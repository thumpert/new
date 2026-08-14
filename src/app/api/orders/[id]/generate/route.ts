import { generateStoryboard } from '@/lib/ai/claude'
import { startRender } from '@/lib/render'
import { getOrder, updateOrder } from '@/lib/store'
import { chooseIdeaSchema } from '@/lib/validation'
import { badRequest, jsonError, notFound } from '../../../_lib/respond'

type Context = { params: Promise<{ id: string }> }

/**
 * Locks in the chosen idea, writes the storyboard, and kicks off rendering.
 *
 * Returns as soon as the storyboard exists — the drawings take minutes, so
 * the client polls GET /api/orders/[id] for progress.
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

    await updateOrder(id, (current) => ({
      ...current,
      brief,
      status: 'storyboard',
      chosenIdeaId: idea.id,
      storyboard,
      pdfPath: undefined,
    }))

    startRender(id)

    return Response.json({ storyboard })
  } catch (err) {
    return jsonError(err)
  }
}
