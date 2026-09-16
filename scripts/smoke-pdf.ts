/**
 * End-to-end check of everything downstream of the writing model:
 * storyboard -> render queue -> A4 PDF. Uses the mock image provider, so it
 * needs no credentials and spends nothing.
 *
 *   IMAGE_PROVIDER=mock npx tsx scripts/smoke-pdf.ts
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { BOOK_PAGES } from '../src/lib/catalog'
import { buildBookPdf } from '../src/lib/pdf/build'
import {
  chooseCover,
  regeneratePage,
  renderCoverStage,
  renderPageStage,
} from '../src/lib/render'
import { getOrder, newOrderId, saveOrder } from '../src/lib/store'
import type { BookFinish, Order } from '../src/lib/types'

process.env.IMAGE_PROVIDER ??= 'mock'

/** npx tsx scripts/smoke-pdf.ts coloured|reading — o padrao e o livro de colorir. */
const arg = process.argv[2]
const FINISH: BookFinish =
  arg === 'reading' ? 'reading' : arg === 'reading' ? 'reading' : 'coloring'

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
    finish: FINISH,
    ageBandId: 'little',
    occasionId: 'birthday',
    storyTypeId: 'adventure',
    toneId: 'warm',
    artStyleId: 'cartoon',
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
        appearance: 'cabelo cacheado castanho, óculos redondos, adora dinossauros',
        photoUrls: [],
      },
      {
        id: 'c2',
        name: 'Biscoito',
        kind: 'pet',
        role: 'cachorro da família',
        appearance: 'vira-lata caramelo, uma orelha caída, sempre com a bola na boca',
      },
    ],
    interview: [],
    // Page 4 is redrawn, which is the repair path: one page regenerated
    // than from an invented scene.
  },
  storyboard: {
    title: 'As Grandes Aventuras da Lila',
    // Exercita a cor unica: no livro de colorir este objeto e a unica cor.
    device: 'a red woollen thread',
    dedication: 'Para a Lila, que transforma qualquer quintal em floresta.',
    // Both finishes are thirteen pages now. This said 12 and 16, which were
    // the two lengths before they were unified, so the smoke test had been
    // checking a book the product no longer makes.
    pages: Array.from({ length: BOOK_PAGES }, (_, i) => ({
      index: i + 1,
      // Toda terceira pagina fala, com travessao e quebra de linha — e a
      // combinacao que a tipografia do PDF costumava destruir sem avisar.
      narration:
        i % 3 === 2
          ? `— Você vem?\nBiscoito não respondeu. Page ${i + 1}: he was already halfway up the path, pulling her in after him.`
          : `Page ${i + 1}: Lila and Biscoito follow the path between the mango trees, and the backyard keeps growing.`,
      narrationSecondary:
        i % 3 === 2
          ? `— Você vem?\nO Biscoito não respondeu. Página ${i + 1}: já estava no meio da trilha, puxando ela atrás.`
          : `Página ${i + 1}: a Lila e o Biscoito seguem a trilha entre as mangueiras, e o quintal fica cada vez maior.`,
      sceneDescription: `Wide shot of Lila and her dog Biscoito walking along a garden path between mango trees, page ${i + 1} of the journey.`,
      charactersOnPage: ['c1', 'c2'],
    })),
  },
}

async function main() {
  console.log(`acabamento: ${FINISH}`)
  await saveOrder(order)

  // First half: model sheets, then both cover options. Stops there.
  await renderCoverStage(order.id)
  const atChoice = await getOrder(order.id)
  const covers = atChoice?.covers ?? []
  console.log(`status na escolha: ${atChoice?.status}`)
  console.log(
    `capas: ${covers.map((c) => `${c.kind}${c.variant ?? ''}=${c.status}`).join(', ')}`,
  )
  if (atChoice?.status !== 'choosing-cover') {
    throw new Error(`expected to be waiting on a cover, got ${atChoice?.status}`)
  }

  // Second half only starts once a cover is chosen.
  await chooseCover(order.id, 'scene', 2)
  await renderPageStage(order.id)

  const rendered = await getOrder(order.id)
  if (!rendered) throw new Error('order vanished')
  console.log(
    `capa escolhida: ${rendered.chosenCoverKind} (versao ${rendered.chosenCoverVariant})`,
  )
  console.log(
    `contracapa: ${rendered.covers?.find((c) => c.kind === 'back')?.status}`,
  )

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
  // The photograph-becomes-a-page feature used to be asserted here. It was
  // taken out of the product in August — it never worked well enough to ship
  // — and the assertion outlived it, which left the only free end-to-end
  // check failing for a reason that had nothing to do with the code under it.

  console.log(`prompt sample:\n${renders[0]?.promptPreview ?? '(none)'}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
