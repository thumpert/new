/**
 * Generates one real page and builds a one-page PDF from it, so the narration
 * printed straight onto the artwork can be looked at.
 *
 *   npx tsx scripts/test-page-layout.ts            # colour book
 *   npx tsx scripts/test-page-layout.ts coloring   # coloring book
 *
 * This is the only way to check the thing that actually matters: whether the
 * illustration really left its bottom fifth open, and whether dark words on
 * that band stay readable with no plate underneath.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { GoogleProvider, googleConfigured } from '../src/lib/images/google'
import { buildBookPdf } from '../src/lib/pdf/build'
import { newOrderId } from '../src/lib/store'
import type { BookFinish, Order } from '../src/lib/types'

const FINISH: BookFinish =
  process.argv[2] === 'coloring' ? 'coloring' : 'reading'

const SCENE =
  'A red woollen thread runs across the grass and loops once around the frog on its lily pad. Lila kneels at the edge of the garden pond following the thread with her eyes, while her scruffy dog Zeca leans over her shoulder. Late afternoon, mango trees behind them.'

/** The guide object: in a coloring book, the only coloured thing on the page. */
const DEVICE = 'a red woollen thread'

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

  console.log(`acabamento: ${FINISH}`)

  // Reuse a stored image when one is given, so the layout can be iterated on
  // without paying to redraw the same picture.
  const reuse = process.argv[3]
  const image = reuse
    ? { url: reuse }
    : await new GoogleProvider().generatePage({
      index: 1,
      sceneDescription: SCENE,
      artStyleId: 'cartoon',
      finish: FINISH,
      characters: [],
      referenceUrls: [],
      device: DEVICE,
    })
  console.log(`imagem: ${image.url}${reuse ? ' (reaproveitada)' : ''}`)

  const now = new Date().toISOString()
  const order: Order = {
    id: newOrderId(),
    createdAt: now,
    updatedAt: now,
    status: 'ready',
    brief: {
      locale: 'pt',
      bookLanguage: 'pt',
      finish: FINISH,
      occasionId: 'child',
      storyTypeId: 'adventure',
      toneId: 'serene',
      artStyleId: 'cartoon',
      title: 'A Tarde do Sapo',
      place: 'o quintal da avó',
      characters: [],
      interview: [],
    },
    storyboard: {
      title: 'A Tarde do Sapo',
      device: DEVICE,
      pages: [
        {
          index: 1,
          narration:
            'O sapo já estava ali quando eles chegaram, como estava em todas as outras tardes.',
          sceneDescription: SCENE,
          charactersOnPage: [],
        },
      ],
    },
    renders: [{ index: 1, status: 'done', imageUrl: image.url }],
  }

  const bytes = await buildBookPdf(order)
  const out = path.join(process.cwd(), '.data', `layout-${FINISH}.pdf`)
  await fs.writeFile(out, bytes)
  console.log(`pdf: ${out}`)
}

main().catch((err) => {
  console.error('\n❌ falhou:', err?.message ?? err)
  process.exit(1)
})
