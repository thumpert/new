import { getOrder, updateOrder } from '@/lib/store'
import { briefPatchSchema } from '@/lib/validation'
import type { BookBrief } from '@/lib/types'
import { badRequest, jsonError, notFound } from '../../_lib/respond'

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params
  try {
    const order = await getOrder(id)
    return order ? Response.json(order) : notFound('Order not found.')
  } catch (err) {
    return jsonError(err)
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest('Body must be JSON.')
  }

  const parsed = briefPatchSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Invalid brief update.', parsed.error.issues)
  }

  try {
    const updated = await updateOrder(id, (order) => ({
      ...order,
      brief: { ...order.brief, ...parsed.data } as BookBrief,
    }))
    return updated ? Response.json(updated) : notFound('Order not found.')
  } catch (err) {
    return jsonError(err)
  }
}
