import { generateIdeas } from '@/lib/ai/claude'
import { getOrder, updateOrder } from '@/lib/store'
import { jsonError, notFound } from '../../../_lib/respond'

type Context = { params: Promise<{ id: string }> }

/** Proposes four stories. Calling again replaces the previous four. */
export async function POST(_request: Request, { params }: Context) {
  const { id } = await params

  try {
    const order = await getOrder(id)
    if (!order) return notFound('Order not found.')

    const ideas = await generateIdeas(order.brief)
    await updateOrder(id, (current) => ({
      ...current,
      status: 'ideas',
      ideas,
      chosenIdeaId: undefined,
    }))

    return Response.json({ ideas })
  } catch (err) {
    return jsonError(err)
  }
}
