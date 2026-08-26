/**
 * Draws the five coloured style samples that the colour-book flow shows in the
 * style picker.
 *
 *   npx tsx scripts/make-colour-samples.ts            # all five
 *   npx tsx scripts/make-colour-samples.ts chibi      # just one
 *
 * Same scene for all five, and the same scene as the line-art samples in
 * public/styles, so the two sets are comparable and a customer switching
 * between the two flows sees the same picture drawn two ways.
 *
 * It goes through the real pagePrompt with finish='reading', so what the
 * picker promises is what the pipeline actually produces. Writes straight into
 * public/styles/<id>-colour.png; they are checked into git and never generated
 * at runtime.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { ART_STYLES } from '../src/lib/catalog'
import { GoogleProvider, googleConfigured } from '../src/lib/images/google'
import type { ArtStyleId } from '../src/lib/types'

/** The scene the original line-art samples were drawn from. */
const SCENE =
  'A curly-haired child in round glasses, with a small satchel over one shoulder, walks along a garden path between tall mango trees. A small scruffy dog trots beside her. A parrot watches from a branch overhead, and flowers grow along the edges of the path.'

async function loadEnvLocal() {
  const raw = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && m[2]) process.env[m[1]] ??= m[2]
  }
}

async function main() {
  await loadEnvLocal()
  if (!googleConfigured()) {
    console.error('Falta GEMINI_API_KEY no .env.local.')
    process.exit(1)
  }

  const only = process.argv[2] as ArtStyleId | undefined
  const styles = only ? ART_STYLES.filter((s) => s.id === only) : ART_STYLES
  if (styles.length === 0) {
    console.error(`Estilo desconhecido: ${only}`)
    process.exit(1)
  }

  const provider = new GoogleProvider()
  const outDir = path.join(process.cwd(), 'public', 'styles')

  for (const style of styles) {
    const started = Date.now()
    // No reference sheets: these samples are about the style, not about a
    // particular cast, and a sample must never look like someone's character.
    const image = await provider.generatePage({
      index: 0,
      sceneDescription: SCENE,
      artStyleId: style.id,
      finish: 'reading',
      characters: [],
      referenceUrls: [],
    })

    const bytes = await fs.readFile(
      path.join(process.cwd(), '.data', 'files', path.basename(image.url)),
    )
    const out = path.join(outDir, `${style.id}-colour.png`)
    await fs.writeFile(out, bytes)

    const secs = ((Date.now() - started) / 1000).toFixed(0)
    const kb = (bytes.length / 1024).toFixed(0)
    console.log(`${style.id.padEnd(18)} ${secs}s  ${kb} KB  -> ${out}`)
  }

  console.log('\nAgora reduza para 720px de largura, como as originais:')
  console.log('  sips --resampleWidth 720 public/styles/*-colour.png')
}

main().catch((err) => {
  console.error('\n❌ falhou:', err?.message ?? err)
  process.exit(1)
})
