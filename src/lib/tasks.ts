import { describeError } from './errors'
import { getOrder, updateOrder } from './store'
import type { Order, OrderTask, TaskKind } from './types'

/**
 * Slow work, started by a request but not waited for by one.
 *
 * Writing a story takes minutes. A request that waits for it survives on a
 * laptop, where nothing sits between the browser and the server, and dies
 * everywhere else: every proxy worth deploying behind gives up on a silent
 * connection long before the model is finished. The failure is also the worst
 * kind — the work completes, the money is spent, and the customer sees an
 * error.
 *
 * So the request starts the work and returns immediately, the work writes its
 * own result onto the order, and the browser asks how it is going. Exactly
 * what the drawing already does; this brings the writing in line with it.
 */

/**
 * How long each kind of work may run before it is presumed dead.
 *
 * One number for all of them was wrong, and wrong in the direction that hurts:
 * fifteen minutes, chosen because it sounded comfortably longer than anything
 * here. A storyboard measured at sixteen minutes and was still going — draft,
 * then up to three reviews and three repairs, each a full rewrite of the book
 * at a thirty-four-thousand-token ceiling — and the customer was told it had
 * stopped part-way through while it was in fact working.
 *
 * Declaring live work dead is worse than waiting: the money is already spent,
 * and the book was minutes from arriving. These are set from what each step
 * has actually been measured doing, with room on top.
 */
const STALE_AFTER: Record<TaskKind, number> = {
  interview: 10 * 60 * 1000,
  gaps: 10 * 60 * 1000,
  titles: 10 * 60 * 1000,
  ideas: 20 * 60 * 1000,
  // The slowest thing in the product by a wide margin.
  storyboard: 45 * 60 * 1000,
}

/** For work whose kind is not known, and for the drawing stages. */
const STALE_AFTER_MS = 20 * 60 * 1000

export function startTask<T>(
  orderId: string,
  kind: TaskKind,
  work: () => Promise<T>,
): Promise<void> {
  return updateOrder(orderId, (current) => ({
    ...current,
    task: { kind, status: 'running', startedAt: new Date().toISOString() },
  })).then(() => {
    // Deliberately not awaited. The request that called this is already on its
    // way back to the browser.
    void work()
      .then((result) =>
        updateOrder(orderId, (current) => ({
          ...current,
          task: { ...taskOf(current, kind), status: 'done', result },
        })),
      )
      .catch((err) =>
        updateOrder(orderId, (current) => ({
          ...current,
          task: {
            ...taskOf(current, kind),
            status: 'failed',
            error: describeError(err),
          },
        })),
      )
  })
}

function taskOf(order: Order, kind: TaskKind): OrderTask {
  return (
    order.task ?? { kind, status: 'running', startedAt: new Date().toISOString() }
  )
}

/** Statuses that mean a drawing run is supposed to be in flight right now. */
const DRAWING: ReadonlySet<string> = new Set(['covers', 'rendering'])

const ABANDONED = 'This step stopped part-way through. Please try it again.'

/**
 * The order as the browser should see it, with work that died in a restart
 * reported as failed rather than as still running.
 *
 * Both halves need this and for the same reason. A machine that restarts
 * mid-storyboard leaves a task at 'running'; one that restarts mid-render
 * leaves the status at 'rendering'. In both cases nothing is coming, and
 * without this the screen sits there turning forever — which is a worse
 * experience than being told plainly to try again.
 */
export async function orderForPolling(id: string): Promise<Order | null> {
  const order = await getOrder(id)
  if (!order) return null

  const ceiling = order.task ? (STALE_AFTER[order.task.kind] ?? STALE_AFTER_MS) : STALE_AFTER_MS

  if (order.task?.status === 'running' && stale(order.task.startedAt, ceiling)) {
    return { ...order, task: { ...order.task, status: 'failed', error: ABANDONED } }
  }

  // A healthy render bumps updatedAt as each page lands, so a stale timestamp
  // on a drawing status means the run behind it is gone.
  if (DRAWING.has(order.status) && stale(order.updatedAt)) {
    return { ...order, status: 'failed', error: ABANDONED }
  }

  return order
}

function stale(iso: string, ms: number = STALE_AFTER_MS): boolean {
  return Date.now() - new Date(iso).getTime() > ms
}
