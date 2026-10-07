import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * The Pix gate, in front of the one expensive stage of the pipeline.
 *
 * Nothing here is cached or retried the way the image providers are: a
 * payment call either answers now or the customer sees an error and tries
 * again, and a webhook that fails is Mercado Pago's own job to redeliver.
 */

const API_BASE = 'https://api.mercadopago.com'

function accessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não está configurado.')
  return token
}

function webhookSecret(): string {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) throw new Error('MERCADOPAGO_WEBHOOK_SECRET não está configurado.')
  return secret
}

export interface PixCharge {
  paymentId: string
  qrCode: string
  qrCodeBase64: string
}

/**
 * Creates a Pix charge for one order.
 *
 * The idempotency key is the order id itself, not a fresh uuid per call: a
 * retried request — a flaky connection, the customer double-clicking "Pagar"
 * — has to land on the same charge, not open a second QR code nobody is
 * looking at while the first one is still live.
 */
export async function createPixPayment({
  orderId,
  email,
  amountCents,
  description,
}: {
  orderId: string
  email: string
  amountCents: number
  description: string
}): Promise<PixCharge> {
  const res = await fetch(`${API_BASE}/v1/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken()}`,
      'X-Idempotency-Key': orderId,
    },
    body: JSON.stringify({
      transaction_amount: amountCents / 100,
      description,
      payment_method_id: 'pix',
      external_reference: orderId,
      payer: { email },
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(
      `Mercado Pago recusou a cobrança (HTTP ${res.status}): ${data?.message ?? JSON.stringify(data)}`,
    )
  }

  const qrCode: string | undefined = data?.point_of_interaction?.transaction_data?.qr_code
  const qrCodeBase64: string | undefined =
    data?.point_of_interaction?.transaction_data?.qr_code_base64
  if (!qrCode || !qrCodeBase64) {
    throw new Error('Mercado Pago aceitou a cobrança mas não devolveu o QR code do Pix.')
  }

  return { paymentId: String(data.id), qrCode, qrCodeBase64 }
}

export interface PaymentStatus {
  /** Mercado Pago's own values: pending, approved, rejected, cancelled... */
  status: string
  /** The order id, round-tripped through `external_reference`. */
  externalReference?: string
}

/**
 * Always re-fetched from the API rather than read off a webhook's own body —
 * a webhook announces that something changed, never what it changed to.
 */
export async function getPayment(paymentId: string): Promise<PaymentStatus> {
  const res = await fetch(`${API_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Mercado Pago não encontrou o pagamento ${paymentId} (HTTP ${res.status}).`)
  }
  return { status: data.status, externalReference: data.external_reference }
}

/**
 * Checks a webhook's `x-signature` against the secret from this app's own
 * webhook config (Suas integrações → Webhooks → Configurar notificação, in
 * the Mercado Pago developer panel).
 *
 * The manifest Mercado Pago actually signs is
 * `id:{data.id};request-id:{x-request-id};ts:{ts};` — `data.id` read off the
 * notification URL's own query string and lower-cased, never off the JSON
 * body, which is why this takes the raw `Request` rather than its parsed
 * body. Unverified against a live webhook yet; the "Simulador de
 * notificações" in the developer panel is the way to check this once real
 * credentials exist (see the note on MERCADOPAGO_WEBHOOK_SECRET).
 */
export function verifyWebhookSignature(request: Request): boolean {
  const signature = request.headers.get('x-signature')
  const requestId = request.headers.get('x-request-id')
  const dataId = new URL(request.url).searchParams.get('data.id')
  if (!signature || !requestId || !dataId) return false

  const parts: Record<string, string> = {}
  for (const piece of signature.split(',')) {
    const [key, value] = piece.split('=').map((s) => s.trim())
    if (key && value) parts[key] = value
  }
  const { ts, v1: hash } = parts
  if (!ts || !hash) return false

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`
  const expected = createHmac('sha256', webhookSecret()).update(manifest).digest('hex')

  const expectedBuf = Buffer.from(expected)
  const hashBuf = Buffer.from(hash)
  return expectedBuf.length === hashBuf.length && timingSafeEqual(expectedBuf, hashBuf)
}

/** The payment id a webhook notification is about, straight off the URL. */
export function paymentIdFromWebhook(request: Request): string | null {
  return new URL(request.url).searchParams.get('data.id')
}
