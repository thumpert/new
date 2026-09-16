/**
 * Draws a book that already has its storyboard, and builds the PDF.
 *
 *   npx tsx scripts/draw-book.mts <pedido.json>
 *
 * The expensive half of the pipeline, run on its own: character sheets, the
 * four covers, then every page, then the PDF. It exists because the writing
 * and the drawing fail for completely different reasons, and pairing them
 * means paying for a storyboard again every time an image goes wrong.
 *
 * Give it an order whose storyboard is right. It resets only the image state
 * — covers, renders, the chosen cover — and leaves the rest of the order as
 * it is, so the same text can be drawn over and over while a prompt is tuned.
 *
 * This is the one script that spends real money: around US$1.70 of images for
 * a thirteen-page book.
 *
 * Kept as .mts on purpose. The project is not `"type": "module"`, so a plain
 * .ts here compiles as CommonJS and every top-level await below becomes a
 * build error — one that blames the await instead of the extension.
 */
import fs from 'node:fs'
import path from 'node:path'
for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { saveOrder, getOrder } = await import('../src/lib/store')
const { renderCoverStage, chooseCover, renderPageStage } = await import('../src/lib/render')
const { buildAndStorePdf } = await import('../src/lib/pdf/build')
import type { Order } from '../src/lib/types'

// Takes the order file as an argument. It used to be a path hardcoded to
// /tmp, which is fine for a scratch file and wrong for a committed tool: the
// next person runs it and silently draws somebody else's leftover book.
const source = process.argv[2]
if (!source) {
  console.error('Uso: npx tsx scripts/draw-book.mts <pedido.json>')
  process.exit(1)
}

const raw = JSON.parse(fs.readFileSync(source, 'utf8'))
const order = (raw.order ?? raw) as Order

// O roteiro ja existe e esta certo. So o desenho precisa correr de novo, entao
// o estado das imagens volta ao zero e o resto do pedido fica intacto.
const clean: Order = {
  ...order,
  status: 'storyboard-review',
  error: undefined,
  covers: undefined,
  renders: undefined,
  chosenCoverKind: undefined,
  task: undefined,
}
await saveOrder(clean)

const t0 = Date.now()
const m = () => ((Date.now() - t0) / 60000).toFixed(1)
console.log(`[${m()}m] ${order.id} | ${order.storyboard!.pages.length} paginas | ${order.brief.characters.length} personagens`)

console.log(`[${m()}m] fichas de personagem + 4 capas...`)
await renderCoverStage(order.id)
const wc = await getOrder(order.id)
const usable = (wc?.covers ?? []).filter((c) => c.status === 'done')
console.log(`[${m()}m] capas prontas: ${usable.length}/4  ${(wc?.covers ?? []).map(c => `${c.kind}${c.variant ?? ''}=${c.status}`).join(' ')}`)
for (const c of wc?.brief.characters ?? []) console.log(`   ficha ${c.name}: ${c.referenceSheetUrl ? 'ok' : 'FALTOU'}`)
if (usable.length === 0) throw new Error('nenhuma capa saiu')

await chooseCover(order.id, usable[0].kind as 'portrait' | 'scene', (usable[0].variant ?? 1) as 1 | 2)
console.log(`[${m()}m] capa: ${usable[0].kind} take ${usable[0].variant ?? 1}. desenhando as paginas...`)
await renderPageStage(order.id)

const done = await getOrder(order.id)
const ok = (done?.renders ?? []).filter((r) => r.status === 'done').length
const bad = (done?.renders ?? []).filter((r) => r.status === 'failed')
console.log(`[${m()}m] paginas: ${ok} prontas, ${bad.length} falharam`)
for (const b of bad) console.log(`   pagina ${b.index}: ${b.error}`)

const pdf = await buildAndStorePdf(done!)
console.log(`\n=== PRONTO em ${m()} min ===`)
console.log(`pdf: ${pdf}`)
