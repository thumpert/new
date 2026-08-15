/**
 * Draws the two cover options and the back cover for real, against a model
 * sheet, and reports where they landed.
 *
 *   npx tsx scripts/test-covers.ts
 *
 * This is the one part of the pipeline that inverts every other rule: the
 * covers are in colour, and they reference a black-and-white model sheet. That
 * combination is worth checking with your eyes before it reaches a customer.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { GoogleProvider, googleConfigured } from '../src/lib/images/google'
import type { ArtStyleId, BookFinish, Character } from '../src/lib/types'

const STYLE = (process.argv[3] ?? 'cartoon') as ArtStyleId
/** npx tsx scripts/test-covers.ts coloured superhero-comic */
const FINISH: BookFinish =
  process.argv[2] === 'coloured' ? 'coloured' : 'coloring'

const CAST: Character[] = [
  {
    id: 'c1',
    name: 'Lila',
    kind: 'person',
    age: '7 anos',
    appearance:
      'curly dark hair in two puffs, round glasses, a gap between her front teeth, wears blue dungarees over a red-and-white striped t-shirt and red trainers',
  },
  {
    id: 'c2',
    name: 'Zeca',
    kind: 'pet',
    appearance:
      'a scruffy small mongrel dog with sandy-brown shaggy fur, one floppy ear and one upright, wears a green bandana knotted at his neck',
  },
]

const PLACE = 'o quintal da casa da avó, cheio de mangueiras antigas'
const MOMENT =
  'Lila kneels by a pond to look at a frog on a lily pad while Zeca leans over her shoulder, both peering at the water.'

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

  const provider = new GoogleProvider()
  console.log(`acabamento: ${FINISH} | estilo: ${STYLE}`)

  // The sheets have to exist first — without them the covers invent faces.
  console.log('fichas de personagem…')
  const sheets: string[] = []
  for (const character of CAST) {
    const sheet = await provider.generateCharacterSheet({
      character,
      artStyleId: STYLE,
      finish: FINISH,
      photoUrls: [],
    })
    sheets.push(sheet.url)
    console.log(`  ${character.name}: ${sheet.url}`)
  }

  for (const kind of ['portrait', 'scene', 'back'] as const) {
    const started = Date.now()
    const image = await provider.generateCover({
      kind,
      artStyleId: STYLE,
      finish: FINISH,
      characters: CAST,
      place: PLACE,
      moment: MOMENT,
      referenceUrls: sheets,
    })
    const secs = ((Date.now() - started) / 1000).toFixed(0)
    console.log(`${kind}: ${image.url}  (${secs}s)`)
  }
}

main().catch((err) => {
  console.error('\n❌ falhou:', err?.message ?? err)
  process.exit(1)
})
