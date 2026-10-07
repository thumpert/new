/**
 * Renames an already-drawn book's title in place.
 *
 *   npx tsx scripts/set-example-title.mts <orderId> "Novo Título"
 *
 * For the example orders: the storyboard's title is what both the PDF cover
 * and the example page's heading read off, and nothing about the drawings
 * depends on it, so this changes only that one field.
 */
import fs from 'node:fs'
import path from 'node:path'
for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { getOrder, updateOrder } = await import('../src/lib/store')

const [orderId, title] = process.argv.slice(2)
if (!orderId || !title) {
  console.error('Uso: npx tsx scripts/set-example-title.mts <orderId> "Novo Título"')
  process.exit(1)
}

const order = await getOrder(orderId)
if (!order || !order.storyboard) {
  console.error(`Pedido ${orderId} não encontrado ou sem roteiro.`)
  process.exit(1)
}

await updateOrder(orderId, (current) => ({
  ...current,
  storyboard: { ...current.storyboard!, title },
  pdfPath: undefined,
}))

console.log(`"${order.storyboard.title}" → "${title}"`)
