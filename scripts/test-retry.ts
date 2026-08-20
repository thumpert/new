/**
 * Checks which failures get asked about again, and which are accepted the
 * first time.
 *
 *   npx tsx scripts/test-retry.ts
 *
 * This exists because the rule used to be a regular expression over the error
 * text, and it was wrong in both directions — it retried nothing that mattered
 * and cost single pages of otherwise finished books. Both regressions are
 * cases 1 and 2 below; they are the reason this file is not deleted.
 */
import { ProviderError, describeError } from '../src/lib/errors'
import { drawingWithRetry, worthAskingAgain } from '../src/lib/render'

let failures = 0

function check(name: string, actual: unknown, expected: unknown) {
  const ok = actual === expected
  if (!ok) failures++
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${ok ? '' : ` — esperado ${expected}, veio ${actual}`}`)
}

/** A dropped TLS connection, described exactly as production describes it. */
function networkFailure() {
  const cause = Object.assign(new Error('connect ECONNREFUSED 142.250.79.10:443'), {
    code: 'ECONNREFUSED',
    address: '142.250.79.10',
    port: 443,
  })
  return new Error('fetch failed', { cause })
}

async function counted(err: unknown, succeedOnAttempt = Infinity) {
  let attempts = 0
  const started = Date.now()
  try {
    await drawingWithRetry('teste', async () => {
      attempts++
      if (attempts >= succeedOnAttempt) return 'pronto'
      throw err
    })
  } catch {
    // Expected when it never succeeds.
  }
  return { attempts, ms: Date.now() - started }
}

async function main() {
  // 1. The regression that switched the retry off: describeError appends the
  //    port, so the message contains ":443" and the old rule read it as a 4xx.
  const described = describeError(networkFailure())
  check('a mensagem de rede contém :443', described.includes(':443'), true)
  check('rede caída é tentada de novo', worthAskingAgain(networkFailure()), true)
  check('rede caída: 3 tentativas', (await counted(networkFailure())).attempts, 3)

  // 2. The regression that killed one page in sixteen: a rate limit is the one
  //    failure three pages in flight actually provoke, and it used to be final.
  const rateLimited = new ProviderError('Gemini returned 429 Too Many Requests.', {
    status: 429,
    retryAfterMs: 300,
  })
  check('429 é tentado de novo', worthAskingAgain(rateLimited), true)
  const limited = await counted(rateLimited)
  check('429: 3 tentativas', limited.attempts, 3)
  // Two waits of 300ms asked for, instead of 2000 + 4000 of our own guessing.
  check('429 respeita o Retry-After', limited.ms < 2000, true)

  // 3. A provider that is overloaded clears; one that refuses the prompt does not.
  check('503 é tentado de novo', worthAskingAgain(new ProviderError('x', { status: 503 })), true)
  check('400 não é tentado de novo', worthAskingAgain(new ProviderError('x', { status: 400 })), false)
  check('401 não é tentado de novo', worthAskingAgain(new ProviderError('x', { status: 401 })), false)
  check('400: 1 tentativa só', (await counted(new ProviderError('x', { status: 400 }))).attempts, 1)

  // 4. A 200 that came back without a picture: the filter stopped this scene,
  //    or nothing came out. Drawing is stochastic, so asking again is right.
  const empty = new ProviderError('sem imagem', { status: 200, retryable: true })
  check('resposta vazia é tentada de novo', worthAskingAgain(empty), true)

  // 5. A retry that works stops there and hands back the drawing.
  check('para assim que dá certo', (await counted(networkFailure(), 2)).attempts, 2)

  console.log(failures === 0 ? '\ntudo certo' : `\n${failures} falha(s)`)
  process.exit(failures === 0 ? 0 : 1)
}

void main()
