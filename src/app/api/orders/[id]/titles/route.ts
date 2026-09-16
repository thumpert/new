import { generateTitleSuggestions } from '@/lib/ai/claude'
import { getStory, storyIdea } from '@/lib/stories'
import { getOrder } from '@/lib/store'
import { startTask } from '@/lib/tasks'
import { chooseIdeaSchema } from '@/lib/validation'
import { badRequest, jsonError, notFound } from '../../../_lib/respond'

type Context = { params: Promise<{ id: string }> }

/** Starts naming the chosen story three different ways. */
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

    // Rebuilt from the id on the brief, the same way the generate route does
    // — the beats live in this repository, not on the order.
    const story = order.brief.chosenStoryId
      ? getStory(order.brief.chosenStoryId)
      : undefined
    if (!story) return badRequest('This order has no chosen story.')

    const idea = storyIdea(story, order.brief)
    if (idea.id !== parsed.data.ideaId) {
      return badRequest('That story idea does not belong to this order.')
    }

    await startTask(id, 'titles', async () => ({
      titles: await generateTitleSuggestions(order.brief, idea),
    }))

    return Response.json({ started: true }, { status: 202 })
  } catch (err) {
    return jsonError(err)
  }
}
