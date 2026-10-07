import { startPageRender } from '@/lib/render'
import {
  getPayment,
  paymentIdFromWebhook,
  verifyWebhookSignature,
} from '@/lib/payments/mercadopago'
import { getOrder, updateOrder } from '@/lib/store'
import { jsonError } from '../../_lib/respond'

/**
 * Where a Pix landing turns into a book being drawn.
 *
 * Mercado Pago resends a notification it does not get a 200 back for, so
 * this always answers 200 once the signature has checked out — a payment
 * this handler cannot yet explain (an order already past 'payment-pending',
 * a status that is not 'approved') is not an error to retry, it is this
 * webhook arriving a second time or about a payment that was never going to
 * change anything here.
 */
export async function POST(request: Request) {
  if (!verifyWebhookSignature(request)) {
    return new Response('invalid signature', { status: 401 })
  }

  const paymentId = paymentIdFromWebhook(request)
  if (!paymentId) return Response.json({ received: true })

  try {
    const payment = await getPayment(paymentId)
    const orderId = payment.externalReference
    if (!orderId) return Response.json({ received: true })

    const order = await getOrder(orderId)
    if (!order) return Response.json({ received: true })

    if (payment.status === 'approved') {
      // Idempotent on purpose: a resend after this already ran would
      // otherwise start a second page render over the first.
      if (order.status === 'payment-pending') {
        await updateOrder(orderId, (current) => ({
          ...current,
          payment: current.payment
            ? { ...current.payment, status: 'approved' }
            : current.payment,
        }))
        startPageRender(orderId)
      }
    } else if (order.payment && order.payment.status !== payment.status) {
      await updateOrder(orderId, (current) => ({
        ...current,
        payment: current.payment
          ? { ...current.payment, status: payment.status as 'pending' | 'rejected' | 'expired' }
          : current.payment,
      }))
    }

    return Response.json({ received: true })
  } catch (err) {
    return jsonError(err)
  }
}
