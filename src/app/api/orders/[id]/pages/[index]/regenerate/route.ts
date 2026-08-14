import { regeneratePage } from '@/lib/render'
import { getOrder, updateOrder } from '@/lib/store'
import { badRequest, jsonError, notFound } from '../../../../../_lib/respond'

type Context = { params: Promise<{ id: string; index: string }> }

/**
 * Redraws one page. The character sheets are already stored, so the people
 * and pets come back identical — only this scene is drawn again.
 *
 * Drawing takes ~40s, so the request returns once the page is validated and
 * queued; the client polls the order to see it land.
 */
export async function POST(_request: Request, { params }: Context) {
  const { id, index } = await params

  const pageIndex = Number(index)
  if (!Number.isInteger(pageIndex) || pageIndex < 1) {
    return badRequest('Page number must be a positive integer.')
  }

  try {
    // Validate up front so a bad id or page number is a real error rather
    // than a 202 followed by silence.
    const order = await getOrder(id)
    if (!order) return notFound('Order not found.')
    if (!order.storyboard) return badRequest('This book has no storyboard yet.')
    if (!order.storyboard.pages.some((p) => p.index === pageIndex)) {
      return badRequest(`This book has no page ${pageIndex}.`)
    }

    void regeneratePage(id, pageIndex).catch(async (err) => {
      await updateOrder(id, (current) => ({
        ...current,
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      }))
    })

    return Response.json({ ok: true, index: pageIndex }, { status: 202 })
  } catch (err) {
    return jsonError(err)
  }
}
