import { generateStoryboard } from '@/lib/ai/claude'
import { getOrder, updateOrder } from '@/lib/store'
import { chooseIdeaSchema } from '@/lib/validation'
import { badRequest, jsonError, notFound } from '../../../_lib/respond'

type Context = { params: Promise<{ id: string }> }

/**
 * Locks in the chosen idea and writes the storyboard.
 *
 * Stops there on purpose. Nothing is drawn until the customer has read the
 * story and approved it at POST /api/orders/[id]/storyboard — twelve
 * sentences take a minute to read, and it is the last point where a book that
 * went wrong costs nothing to throw away.
 */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest('Body must be JSON.')
  }

  const parsed = chooseIdeaSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Invalid selection.', parsed.error.issues)
  }

  try {
    const order = await getOrder(id)
    if (!order) return notFound('Order not found.')

    const idea = order.ideas?.find((i) => i.id === parsed.data.ideaId)
    if (!idea) return badRequest('That story idea does not belong to this order.')

    const brief = parsed.data.title
      ? { ...order.brief, title: parsed.data.title }
      : order.brief

    const storyboard = await generateStoryboard(brief, idea)

    // Deliberately does not start rendering. The story goes to the customer
    // first: reading twelve sentences costs a minute, and it is the only
    // place a wrong book can be caught before roughly US$0.70 of drawings
    // have been made of it.
    await updateOrder(id, (current) => ({
      ...current,
      brief,
      status: 'storyboard-review',
      chosenIdeaId: idea.id,
      storyboard,
      pdfPath: undefined,
    }))

    return Response.json({ storyboard })
  } catch (err) {
    return jsonError(err)
  }
}
