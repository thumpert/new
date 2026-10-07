import { BOOK_PRICE_CENTS } from '@/lib/pricing'
import { createPixPayment } from '@/lib/payments/mercadopago'
import { getOrder, updateOrder } from '@/lib/store'
import { checkoutSchema } from '@/lib/validation'
import { badRequest, jsonError, notFound } from '../../../_lib/respond'

type Context = { params: Promise<{ id: string }> }

/**
 * Opens the Pix charge that unlocks the pages.
 *
 * Only reachable once a cover is chosen — see `recordCoverChoice` in
 * src/lib/render.ts, the only thing that puts an order into
 * 'payment-pending'. Re-postable: a customer who reloads or comes back later
 * gets the same charge back rather than a second QR code, because the
 * idempotency key handed to Mercado Pago is the order id itself.
 */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest('Body must be JSON.')
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Invalid checkout request.', parsed.error.issues)
  }

  try {
    const order = await getOrder(id)
    if (!order) return notFound('Order not found.')

    // Already has a live charge — hand back the same QR rather than asking
    // Mercado Pago for a second one, which an idempotency key would collapse
    // into this one anyway but without saving the round trip.
    if (order.payment?.status === 'pending') {
      return Response.json({
        qrCode: order.payment.qrCode,
        qrCodeBase64: order.payment.qrCodeBase64,
      })
    }

    if (order.status !== 'payment-pending') {
      return badRequest('This order is not waiting for payment.')
    }
    if (!order.chosenCoverKind) {
      return badRequest('Choose a cover before paying.')
    }

    const charge = await createPixPayment({
      orderId: id,
      email: parsed.data.email,
      amountCents: BOOK_PRICE_CENTS,
      description: order.storyboard?.title || 'Livro infantil personalizado',
    })

    await updateOrder(id, (current) => ({
      ...current,
      email: parsed.data.email,
      payment: {
        provider: 'mercadopago',
        paymentId: charge.paymentId,
        status: 'pending',
        qrCode: charge.qrCode,
        qrCodeBase64: charge.qrCodeBase64,
        amountCents: BOOK_PRICE_CENTS,
        createdAt: new Date().toISOString(),
      },
    }))

    return Response.json({ qrCode: charge.qrCode, qrCodeBase64: charge.qrCodeBase64 })
  } catch (err) {
    return jsonError(err)
  }
}
