/**
 * Fires one real image generation at Higgsfield and reports what came back.
 *
 * Higgsfield puts every image model behind one generic "endpoint + input"
 * API, so the endpoint string depends on which model you picked. This script
 * exists to make that a 30-second check instead of a full pass through the
 * wizard:
 *
 *   npx tsx scripts/test-higgsfield.ts <endpoint>
 *
 * It reads HIGGSFIELD_CREDENTIALS from .env.local, sends one coloring-page
 * prompt, and prints either the image URL or the exact error.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createHiggsfieldClient } from '@higgsfield/client/v2'

async function loadEnvLocal() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!match) continue
      const value = match[2].replace(/^["']|["']$/g, '')
      if (value) process.env[match[1]] ??= value
    }
  } catch {
    // No .env.local — fall back to whatever is already in the environment.
  }
}

const PROMPT = [
  'Single full-page children’s coloring book illustration, vertical portrait orientation.',
  'Scene: A curly-haired child in round glasses and a scruffy dog with one floppy ear walk along a garden path between tall mango trees.',
  'Drawing style: classic children’s cartoon style, friendly rounded characters, medium-weight even outlines.',
  'Pure black outlines on a solid pure white background, no shading, no grey tones, no filled black areas, no colour, no text.',
].join(' ')

async function main() {
  await loadEnvLocal()

  const endpoint = process.argv[2] ?? process.env.HIGGSFIELD_IMAGE_ENDPOINT
  const credentials =
    process.env.HIGGSFIELD_CREDENTIALS ?? process.env.HF_CREDENTIALS

  if (!credentials) {
    console.error('Falta HIGGSFIELD_CREDENTIALS no .env.local (KEY_ID:KEY_SECRET).')
    process.exit(1)
  }
  if (!endpoint) {
    console.error(
      'Informe o endpoint: npx tsx scripts/test-higgsfield.ts <endpoint>',
    )
    process.exit(1)
  }

  console.log(`endpoint: ${endpoint}`)
  console.log('gerando… (costuma levar ~40s)\n')

  const client = createHiggsfieldClient({ credentials, maxPollTime: 300_000 })

  const started = Date.now()
  const response = await client.subscribe(endpoint, {
    input: {
      prompt: PROMPT,
      aspect_ratio: process.env.HIGGSFIELD_ASPECT_RATIO ?? '3:4',
    },
    withPolling: true,
  })

  const seconds = ((Date.now() - started) / 1000).toFixed(0)
  console.log(`status: ${response.status} (${seconds}s)`)
  console.log(`request_id: ${response.request_id}`)

  const url = response.images?.[0]?.url
  if (url) {
    console.log(`\n✅ deu certo. Imagem:\n${url}`)
    console.log(`\nColoque no .env.local:\nHIGGSFIELD_IMAGE_ENDPOINT=${endpoint}`)
  } else {
    console.log('\n⚠️  terminou sem devolver imagem. Resposta completa:')
    console.log(JSON.stringify(response, null, 2))
  }
}

main().catch((err) => {
  console.error('\n❌ falhou:')
  console.error(err?.response?.data ?? err?.message ?? err)
  console.error(
    '\nSe for 404, o endpoint está errado — confira na doc do modelo.' +
      '\nSe for 401/403, são as credenciais.',
  )
  process.exit(1)
})
