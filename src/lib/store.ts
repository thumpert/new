import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Order } from './types'

/**
 * Order persistence.
 *
 * The MVP writes one JSON file per order under `.data/orders`. That is enough
 * for local development and a single long-lived server. Moving to Postgres
 * means reimplementing this module's five functions and nothing else — no
 * caller reaches for the filesystem directly.
 */

const DATA_DIR = path.join(process.cwd(), '.data', 'orders')

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

function orderPath(id: string) {
  return path.join(DATA_DIR, `${id}.json`)
}

export function newOrderId(): string {
  return randomUUID()
}

/**
 * One promise chain per order id.
 *
 * Pages render in parallel and each one patches the same order file. Without
 * serialising, two read-modify-writes interleave and one page's status is
 * silently lost.
 */
const writeQueues = new Map<string, Promise<unknown>>()

function enqueue<T>(id: string, task: () => Promise<T>): Promise<T> {
  const previous = writeQueues.get(id) ?? Promise.resolve()
  // Swallow the predecessor's rejection so one failure cannot poison the chain.
  const next = previous.then(task, task)
  writeQueues.set(
    id,
    next.catch(() => undefined),
  )
  return next
}

export async function saveOrder(order: Order): Promise<Order> {
  return enqueue(order.id, () => writeOrder(order))
}

async function writeOrder(order: Order): Promise<Order> {
  await ensureDir()
  const next: Order = { ...order, updatedAt: new Date().toISOString() }
  // Write to a temp file first so a crash mid-write cannot truncate an order.
  // The name is unique per write — concurrent writers must not share one.
  const tmp = `${orderPath(order.id)}.${randomUUID()}.tmp`
  await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8')
  await fs.rename(tmp, orderPath(order.id))
  return next
}

export async function getOrder(id: string): Promise<Order | null> {
  try {
    const raw = await fs.readFile(orderPath(id), 'utf8')
    return JSON.parse(raw) as Order
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}

/**
 * Reads, mutates and writes an order in one step. Returns null when the order
 * does not exist so callers can answer 404 without a second read.
 */
export async function updateOrder(
  id: string,
  mutate: (order: Order) => Order | Promise<Order>,
): Promise<Order | null> {
  // Read and write inside the same queue slot, so nothing lands in between.
  return enqueue(id, async () => {
    const current = await getOrder(id)
    if (!current) return null
    return writeOrder(await mutate(current))
  })
}

export async function listOrders(): Promise<Order[]> {
  await ensureDir()
  const files = await fs.readdir(DATA_DIR)
  const orders = await Promise.all(
    files
      .filter((f) => f.endsWith('.json'))
      .map((f) => getOrder(f.replace(/\.json$/, ''))),
  )
  return orders
    .filter((o): o is Order => o !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
