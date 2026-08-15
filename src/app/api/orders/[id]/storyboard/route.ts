import { generateStoryboard } from '@/lib/ai/claude'
import { startRender } from '@/lib/render'
import { getOrder, updateOrder } from '@/lib/store'
import { badRequest, jsonError, notFound } from '../../../_lib/respond'

type Context = { params: Promise<{ id: string }> }

/**
 * Approves the story, or asks for another one.
 *
 * POST { action: 'approve' }  — starts drawing.
 * POST { action: 'rewrite' }  — writes a fresh storyboard from the same idea
 *                               and comes back for another read.
 *
 * Rewriting is text only, so it costs a fraction of what it saves: the
 * alternative is finding out from a finished PDF.
 */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest('Body must be JSON.')
  }

  const action = (body as { action?: string })?.action
  if (action !== 'approve' && action !== 'rewrite') {
    return badRequest('action must be "approve" or "rewrite".')
  }

  try {
    const order = await getOrder(id)
    if (!order) return notFound('Order not found.')
    if (order.status !== 'storyboard-review') {
      return badRequest('This book is not waiting for the story to be read.')
    }
    if (!order.storyboard) return badRequest('This book has no story yet.')

    if (action === 'approve') {
      await updateOrder(id, (current) => ({ ...current, status: 'storyboard' }))
      startRender(id)
      return Response.json({ status: 'rendering' })
    }

    const idea = order.ideas?.find((i) => i.id === order.chosenIdeaId)
    if (!idea) return badRequest('The chosen story idea is no longer on file.')

    const storyboard = await generateStoryboard(order.brief, idea)
    await updateOrder(id, (current) => ({ ...current, storyboard }))

    return Response.json({ storyboard })
  } catch (err) {
    return jsonError(err)
  }
}
