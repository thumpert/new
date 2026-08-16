import { generateIdeas } from '@/lib/ai/claude'
import { getOrder, updateOrder } from '@/lib/store'
import { startTask } from '@/lib/tasks'
import { jsonError, notFound } from '../../../_lib/respond'

type Context = { params: Promise<{ id: string }> }

/**
 * Starts proposing four stories. Calling again replaces the previous four.
 *
 * The longest wait in the wizard, so it is the one that most needs to be
 * started rather than waited for. See src/lib/tasks.ts.
 */
export async function POST(_request: Request, { params }: Context) {
  const { id } = await params

  try {
    const order = await getOrder(id)
    if (!order) return notFound('Order not found.')

    await startTask(id, 'ideas', async () => {
      const ideas = await generateIdeas(order.brief)
      await updateOrder(id, (current) => ({
        ...current,
        status: 'ideas',
        ideas,
        chosenIdeaId: undefined,
      }))
      return { ideas }
    })

    return Response.json({ started: true }, { status: 202 })
  } catch (err) {
    return jsonError(err)
  }
}
