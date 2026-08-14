import { generateInterviewQuestions } from '@/lib/ai/claude'
import { getOrder, updateOrder } from '@/lib/store'
import { jsonError, notFound } from '../../../_lib/respond'

type Context = { params: Promise<{ id: string }> }

/** Writes the interview questions for this specific brief. */
export async function POST(_request: Request, { params }: Context) {
  const { id } = await params

  try {
    const order = await getOrder(id)
    if (!order) return notFound('Order not found.')

    const questions = await generateInterviewQuestions(order.brief)
    await updateOrder(id, (current) => ({
      ...current,
      interviewQuestions: questions,
    }))

    return Response.json({ questions })
  } catch (err) {
    return jsonError(err)
  }
}
