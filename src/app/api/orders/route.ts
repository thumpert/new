import { newOrderId, saveOrder } from '@/lib/store'
import { briefSchema } from '@/lib/validation'
import type { BookBrief, Order } from '@/lib/types'
import { badRequest, jsonError } from '../_lib/respond'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest('Body must be JSON.')
  }

  const parsed = briefSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Invalid brief.', parsed.error.issues)
  }

  const now = new Date().toISOString()
  const order: Order = {
    id: newOrderId(),
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    brief: parsed.data as BookBrief,
  }

  try {
    await saveOrder(order)
  } catch (err) {
    return jsonError(err)
  }

  return Response.json({ id: order.id, order }, { status: 201 })
}
