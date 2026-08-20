/**
 * Proves that a truncated answer produces a useful error instead of a raw
 * JSON syntax error.
 *
 *   npx tsx scripts/test-truncation.ts
 *
 * Points the SDK at a local server that returns canned Messages API bodies,
 * so it exercises the real client and the real code path without a key and
 * without spending anything.
 */
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { BookBrief } from '../src/lib/types'

type Canned = { stop_reason: string; text: string }

let canned: Canned = { stop_reason: 'end_turn', text: '{}' }

/** The Messages API streams SSE, so the stand-in has to as well. */
const server = createServer((req, res) => {
  req.resume()
  req.on('end', () => {
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    const send = (type: string, data: unknown) =>
      res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)

    send('message_start', {
      type: 'message_start',
      message: {
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        model: 'claude-opus-5',
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 0 },
      },
    })
    send('content_block_start', {
      type: 'content_block_start',
      index: 0,
      content_block: { type: 'text', text: '' },
    })
    // Split across deltas, the way a real stream arrives.
    for (let i = 0; i < canned.text.length; i += 25) {
      send('content_block_delta', {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'text_delta', text: canned.text.slice(i, i + 25) },
      })
    }
    send('content_block_stop', { type: 'content_block_stop', index: 0 })
    send('message_delta', {
      type: 'message_delta',
      delta: { stop_reason: canned.stop_reason, stop_sequence: null },
      usage: { output_tokens: 10 },
    })
    send('message_stop', { type: 'message_stop' })
    res.end()
  })
})

const brief: BookBrief = {
  locale: 'pt',
  bookLanguage: 'pt',
  finish: 'coloring',
  occasionId: 'birthday',
  storyTypeId: 'adventure',
  toneId: 'warm',
  artStyleId: 'chibi',
  title: '',
  place: 'a casa da vovó',
  dedication: '',
  characters: [
    {
      id: 'c1',
      name: 'Lila',
      kind: 'person',
      role: 'aniversariante',
      appearance: 'cabelo cacheado, óculos redondos',
      personality: 'adora dinossauros',
    },
  ],
  interview: [],
}

const VALID = JSON.stringify({
  ideas: [
    {
      title: 'As Aventuras da Lila',
      logline: 'Uma menina descobre um quintal sem fim.',
      summary: 'A Lila sai pela porta dos fundos e o quintal cresce.',
      highlights: ['Ela abre a porta.', 'A trilha aparece.', 'Ela volta.'],
      turn: 'A trilha começa a responder quando ela fala.',
      device: 'um novelo de lã azul',
    },
  ],
})

// Cut mid-string, exactly how a max_tokens truncation lands.
const TRUNCATED = VALID.slice(0, 90)

async function check(
  name: string,
  setup: Canned,
  expect: 'ok' | string,
): Promise<boolean> {
  canned = setup
  const { generateIdeas } = await import('../src/lib/ai/claude')
  try {
    await generateIdeas(brief)
    if (expect === 'ok') {
      console.log(`  ok   ${name}`)
      return true
    }
    console.log(`  FAIL ${name}: expected an error, got none`)
    return false
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (expect !== 'ok' && message.includes(expect)) {
      console.log(`  ok   ${name}\n         → ${message.split('\n')[0]}`)
      return true
    }
    console.log(`  FAIL ${name}: got ${message}`)
    return false
  }
}

async function main() {
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const { port } = server.address() as AddressInfo
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${port}`
  process.env.ANTHROPIC_API_KEY = 'test-key-not-real'

  console.log('truncation handling:')
  const results = [
    await check(
      'a truncated answer names the real cause',
      { stop_reason: 'max_tokens', text: TRUNCATED },
      'Ran out of room',
    ),
    await check(
      'broken JSON without max_tokens says so',
      { stop_reason: 'end_turn', text: TRUNCATED },
      'invalid JSON',
    ),
    await check(
      'valid JSON of the wrong shape is caught',
      { stop_reason: 'end_turn', text: '{"ideas":[{"title":"x"}]}' },
      'did not match the expected shape',
    ),
    await check(
      'a good answer still works',
      { stop_reason: 'end_turn', text: VALID },
      'ok',
    ),
  ]

  server.close()
  const failed = results.filter((r) => !r).length
  console.log(failed ? `\n${failed} failed` : '\nall passed')
  process.exit(failed ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  server.close()
  process.exit(1)
})
