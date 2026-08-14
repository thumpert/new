/**
 * End-to-end check of everything downstream of the writing model:
 * storyboard -> render queue -> A4 PDF. Uses the mock image provider, so it
 * needs no credentials and spends nothing.
 *
 *   IMAGE_PROVIDER=mock npx tsx scripts/smoke-pdf.ts
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { buildBookPdf } from '../src/lib/pdf/build'
import { regeneratePage, renderOrder } from '../src/lib/render'
import { getOrder, newOrderId, saveOrder } from '../src/lib/store'
import type { Order } from '../src/lib/types'

process.env.IMAGE_PROVIDER ??= 'mock'

const now = new Date().toISOString()

const order: Order = {
  id: newOrderId(),
  createdAt: now,
  updatedAt: now,
  status: 'storyboard',
  brief: {
    locale: 'pt',
    // The bilingual book is the layout most likely to break: it is the only
    // one printing two text blocks under the drawing.
    bookLanguage: 'en-pt',
    imageModelId: 'nano-banana',
    occasionId: 'birthday',
    storyTypeId: 'adventure',
    toneId: 'warm',
    artStyleId: 'classic-cartoon',
    sizeId: 'short',
    title: 'As Grandes Aventuras da Lila',
    place: 'a casa da vovó em Petrópolis, com o quintal cheio de mangueiras',
    dedication: 'Para a Lila, que transforma qualquer quintal em floresta.',
    characters: [
      {
        id: 'c1',
        name: 'Lila',
        kind: 'person',
        age: '6 anos',
        role: 'aniversariante',
        traits: 'cabelo cacheado castanho, óculos redondos, adora dinossauros',
        photoUrls: [],
      },
      {
        id: 'c2',
        name: 'Biscoito',
        kind: 'pet',
        role: 'cachorro da família',
        traits: 'vira-lata caramelo, uma orelha caída, sempre com a bola na boca',
      },
    ],
    interview: [],
  },
  storyboard: {
    title: 'As Grandes Aventuras da Lila',
    dedication: 'Para a Lila, que transforma qualquer quintal em floresta.',
    pages: Array.from({ length: 12 }, (_, i) => ({
      index: i + 1,
      narration: `Page ${i + 1}: Lila and Biscoito follow the path between the mango trees, and the backyard keeps growing.`,
      narrationSecondary: `Página ${i + 1}: a Lila e o Biscoito seguem a trilha entre as mangueiras, e o quintal fica cada vez maior.`,
      sceneDescription: `Wide shot of Lila and her dog Biscoito walking along a garden path between mango trees, page ${i + 1} of the journey.`,
      charactersOnPage: ['c1', 'c2'],
    })),
  },
}

async function main() {
  await saveOrder(order)
  await renderOrder(order.id)

  const rendered = await getOrder(order.id)
  if (!rendered) throw new Error('order vanished')

  const renders = rendered.renders ?? []
  const done = renders.filter((r) => r.status === 'done').length
  console.log(`status: ${rendered.status}`)
  console.log(`pages rendered: ${done}/${renders.length}`)
  if (rendered.error) console.log(`error: ${rendered.error}`)

  // Redrawing one page must not disturb the other eleven.
  await regeneratePage(order.id, 5)
  const afterRedraw = await getOrder(order.id)
  const stillDone = (afterRedraw?.renders ?? []).filter(
    (r) => r.status === 'done',
  ).length
  console.log(`after redrawing page 5: ${stillDone}/${renders.length} done`)

  const bytes = await buildBookPdf(afterRedraw ?? rendered)
  const out = path.join(process.cwd(), '.data', 'smoke.pdf')
  await fs.writeFile(out, bytes)

  console.log(`pdf: ${out} (${(bytes.length / 1024).toFixed(1)} KB)`)
  console.log(`prompt sample:\n${renders[0]?.promptPreview ?? '(none)'}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
