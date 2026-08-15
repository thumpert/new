/**
 * Fires one real image generation at Higgsfield and reports what came back.
 *
 * Checks credentials and the wiring in ~40s, instead of a full pass through
 * the wizard:
 *
 *   npx tsx scripts/test-higgsfield.ts             # nano-banana, the default
 *   npx tsx scripts/test-higgsfield.ts soul        # the other catalog model
 *   npx tsx scripts/test-higgsfield.ts /some/path  # a raw endpoint
 *
 * Reads HIGGSFIELD_CREDENTIALS from .env.local and prints either the image
 * URL or the exact error.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createHiggsfieldClient } from '@higgsfield/client/v2'
import { IMAGE_MODELS, getImageModel } from '../src/lib/catalog'
import type { ImageModelId } from '../src/lib/types'

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

  const credentials =
    process.env.HIGGSFIELD_CREDENTIALS ?? process.env.HF_CREDENTIALS
  if (!credentials) {
    console.error('Falta HIGGSFIELD_CREDENTIALS no .env.local (KEY_ID:KEY_SECRET).')
    process.exit(1)
  }

  // A catalog model id, a raw path, or nothing (the default model).
  const arg = process.argv[2]
  const known = IMAGE_MODELS.find((m) => m.id === arg)
  const endpoint = arg?.startsWith('/')
    ? arg
    : (known ?? getImageModel('nano-banana' as ImageModelId)).endpoint
  const extraInput = arg?.startsWith('/') ? {} : (known ?? getImageModel('nano-banana' as ImageModelId)).extraInput

  console.log(`endpoint: ${endpoint}`)
  console.log('gerando… (costuma levar ~40s)\n')

  const client = createHiggsfieldClient({ credentials, maxPollTime: 300_000 })

  const started = Date.now()
  const response = await client.subscribe(endpoint, {
    input: {
      prompt: PROMPT,
      aspect_ratio: process.env.HIGGSFIELD_ASPECT_RATIO ?? '3:4',
      ...extraInput,
    },
    withPolling: true,
  })

  const seconds = ((Date.now() - started) / 1000).toFixed(0)
  console.log(`status: ${response.status} (${seconds}s)`)
  console.log(`request_id: ${response.request_id}`)

  const url = response.images?.[0]?.url
  if (url) {
    console.log(`\n✅ deu certo. Imagem:\n${url}`)
    console.log('\nA integração está de pé — nada a configurar além das credenciais.')
  } else {
    console.log('\n⚠️  terminou sem devolver imagem. Resposta completa:')
    console.log(JSON.stringify(response, null, 2))
  }
}

main().catch((err) => {
  console.error('\n❌ falhou:')
  console.error(err?.response?.data ?? err?.message ?? err)
  console.error(
    '\n401/403 = credenciais. 404 = a API mudou de caminho (veja' +
      '\ndocs.higgsfield.ai/docs/openapi.json e ajuste src/lib/catalog.ts).' +
      '\n422 = o corpo não bate com o schema do endpoint.',
  )
  process.exit(1)
})
