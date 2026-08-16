import { generateInterviewQuestions } from '@/lib/ai/claude'
import { getOrder, updateOrder } from '@/lib/store'
import { startTask } from '@/lib/tasks'
import { jsonError, notFound } from '../../../_lib/respond'

type Context = { params: Promise<{ id: string }> }

/**
 * Starts writing the interview questions for this specific brief.
 *
 * Returns as soon as the work has started, not when it has finished — the
 * browser watches the order's task. See src/lib/tasks.ts.
 */
export async function POST(_request: Request, { params }: Context) {
  const { id } = await params

  try {
    const order = await getOrder(id)
    if (!order) return notFound('Order not found.')

    await startTask(id, 'interview', async () => {
      const questions = await generateInterviewQuestions(order.brief)
      await updateOrder(id, (current) => ({
        ...current,
        interviewQuestions: questions,
      }))
      return { questions }
    })

    return Response.json({ started: true }, { status: 202 })
  } catch (err) {
    return jsonError(err)
  }
}
