/**
 * Fires one real image generation at Google's Gemini image API and reports
 * what came back.
 *
 *   npx tsx scripts/test-google.ts
 *
 * Reads GEMINI_API_KEY (or GOOGLE_API_KEY) from .env.local. The image is
 * written into .data/files, the same place the app keeps generated pages, and
 * the local path is printed.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { GoogleProvider, googleConfigured } from '../src/lib/images/google'
import type { ArtStyleId, Character } from '../src/lib/types'

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

const LILA: Character = {
  id: 'test',
  name: 'Lila',
  kind: 'person',
  age: '7 anos',
  appearance:
    'curly dark hair in two puffs, round glasses, a gap between her front teeth, wears dungarees over a striped t-shirt',
}

async function main() {
  await loadEnvLocal()

  if (!googleConfigured()) {
    console.error('Falta GEMINI_API_KEY no .env.local.')
    console.error('Crie a chave em https://aistudio.google.com/apikey')
    process.exit(1)
  }

  console.log(`modelo: ${process.env.GEMINI_IMAGE_MODEL ?? 'gemini-3.1-flash-image'}`)
  console.log('gerando…\n')

  const started = Date.now()
  const image = await new GoogleProvider().generateCharacterSheet({
    character: LILA,
    artStyleId: 'cartoon' as ArtStyleId,
    finish: 'coloring',
    photoUrls: [],
  })
  const seconds = ((Date.now() - started) / 1000).toFixed(0)

  const name = image.url.split('/').pop()
  console.log(`✅ deu certo em ${seconds}s.`)
  console.log(`Arquivo: .data/files/${name}`)
  console.log('\nA integração com o Google está de pé.')
}

main().catch((err) => {
  console.error('\n❌ falhou:')
  console.error(err?.message ?? err)
  console.error(
    '\n400 = corpo ou modelo errado. 403 = chave inválida ou sem permissão.' +
      '\n429 = cota estourada. Veja https://ai.google.dev/gemini-api/docs/image-generation',
  )
  process.exit(1)
})
