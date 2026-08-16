import { reviewBrief } from '@/lib/ai/brief-review'
import { getOrder } from '@/lib/store'
import { startTask } from '@/lib/tasks'
import { jsonError, notFound } from '../../../_lib/respond'
import type { InterviewQuestion } from '@/lib/types'

type Context = { params: Promise<{ id: string }> }

/**
 * Reads the brief the way the writer will, and returns what is still too thin
 * as ordinary interview questions.
 *
 * They come back in that shape on purpose: the interview screen already knows
 * how to ask a list of questions and collect answers, so a gap becomes another
 * question rather than a new kind of screen. And the moment to ask is here —
 * once the customer has said everything they thought to say, and before any
 * story has been written from it.
 *
 * Never blocks. A thin book is still a book, and someone who wants to skip
 * ahead is entitled to.
 */
export async function POST(_request: Request, { params }: Context) {
  const { id } = await params

  try {
    const order = await getOrder(id)
    if (!order) return notFound('Order not found.')

    await startTask(id, 'gaps', async () => {
      const review = await reviewBrief(order.brief)
      const questions: InterviewQuestion[] = review.gaps.map((gap, i) => ({
        id: `gap${i + 1}`,
        group: 'gaps',
        question: gap.ask,
        hint: gap.missing,
        suggestions: [],
      }))
      return { questions, ready: review.ready }
    })

    return Response.json({ started: true }, { status: 202 })
  } catch (err) {
    return jsonError(err)
  }
}
