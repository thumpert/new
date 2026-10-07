import { startPageRender } from '@/lib/render'
import { getOrder } from '@/lib/store'
import { badRequest, jsonError, notFound } from '../../../_lib/respond'

type Context = { params: Promise<{ id: string }> }

/**
 * Starts drawing without a payment. Local testing only.
 *
 * Refuses outright in production, independent of whether the client-side
 * link that calls this is visible — see BookProgress.tsx, which only
 * renders that link when NODE_ENV !== 'production'. Belt and suspenders:
 * the whole point of the payment gate is that it cannot be skipped by
 * anyone who finds the URL on the live site.
 */
export async function POST(request: Request, { params }: Context) {
  if (process.env.NODE_ENV === 'production') {
    return badRequest('Not available in production.')
  }

  const { id } = await params

  try {
    const order = await getOrder(id)
    if (!order) return notFound('Order not found.')
    if (order.status !== 'payment-pending') {
      return badRequest('This order is not waiting for payment.')
    }

    startPageRender(id)
    return Response.json({ started: true })
  } catch (err) {
    return jsonError(err)
  }
}
