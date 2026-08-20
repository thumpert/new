import { chooseCover } from '@/lib/render'
import { getOrder } from '@/lib/store'
import { chooseCoverSchema } from '@/lib/validation'
import type { CoverKind, CoverVariant } from '@/lib/types'
import { badRequest, jsonError, notFound } from '../../../_lib/respond'

type Context = { params: Promise<{ id: string }> }

/**
 * Locks in the front cover and starts drawing the book.
 *
 * Returns immediately: the pages take minutes, so the client goes back to
 * polling GET /api/orders/[id] exactly as it does for the covers.
 */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest('Body must be JSON.')
  }

  const parsed = chooseCoverSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Invalid cover choice.', parsed.error.issues)
  }

  try {
    const order = await getOrder(id)
    if (!order) return notFound('Order not found.')

    // Choosing twice would start a second page render over the first.
    if (order.chosenCoverKind) {
      return badRequest('This book already has a cover.')
    }
    if (order.status !== 'choosing-cover') {
      return badRequest('The covers are not ready to be chosen yet.')
    }

    const variant = (parsed.data.variant ?? 1) as CoverVariant
    await chooseCover(id, parsed.data.kind as CoverKind, variant)

    return Response.json({
      chosenCoverKind: parsed.data.kind,
      chosenCoverVariant: variant,
    })
  } catch (err) {
    return jsonError(err)
  }
}
