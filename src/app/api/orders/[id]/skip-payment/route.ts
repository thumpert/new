import { startPageRender } from '@/lib/render'
import { getOrder } from '@/lib/store'
import { badRequest, jsonError, notFound } from '../../../_lib/respond'

type Context = { params: Promise<{ id: string }> }

/**
 * Starts drawing without a payment.
 *
 * Off by default everywhere, including production — gated on
 * ALLOW_PAYMENT_SKIP rather than NODE_ENV, because the product is still
 * pre-launch and the person testing it needs to unstick a real order that
 * really got paid but whose webhook never confirmed (no
 * MERCADOPAGO_WEBHOOK_SECRET yet). Turn it off the moment real customers
 * might reach this screen: `fly secrets unset ALLOW_PAYMENT_SKIP`. See the
 * matching check in BookProgress.tsx, which decides whether the link even
 * renders.
 */
export async function POST(request: Request, { params }: Context) {
  if (process.env.ALLOW_PAYMENT_SKIP !== 'true') {
    return badRequest('Not available.')
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
