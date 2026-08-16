import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import * as z from 'zod'
import { BOOK_PAGES } from '../catalog'
import { reviewStoryboard } from './story-review'
import { record } from './usage'
import type {
  BookBrief,
  InterviewQuestion,
  StoryIdea,
  Storyboard,
} from '../types'
import {
  IDEAS_SYSTEM,
  INTERVIEW_SYSTEM,
  STORYBOARD_SYSTEM,
  TITLES_SYSTEM,
  ideasUser,
  interviewUser,
  storyboardUser,
  REVISE_SYSTEM,
  reviseUser,
  titlesUser,
} from './prompts'

const MODEL = 'claude-opus-5'

/**
 * How many times the story may be repaired before it goes to the customer.
 *
 * Three, matching the pages. The first draft usually fails one or two rules,
 * the repair clears them, and the third attempt is there for the book that
 * needs it. All of it is text, so a whole loop costs a fraction of one page
 * of drawings.
 */
const MAX_STORY_ATTEMPTS = 3

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) client = new Anthropic()
  return client
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)
}

/* ------------------------------------------------------------------ *
 * Schemas — these double as the structured-output contract and as the
 * runtime validation of what comes back.
 * ------------------------------------------------------------------ */

const InterviewSchema = z.object({
  questions: z
    .array(
      z.object({
        group: z
          .string()
          .describe('Short theme title. Questions shown together share it.'),
        question: z.string().describe('The question, addressed to the customer.'),
        hint: z.string().describe('One short line on why we are asking.'),
        placeholder: z.string().describe('An example answer, shown greyed out.'),
        suggestions: z
          .array(z.string())
          .describe('Three short, concrete answers the customer can click.'),
      }),
    )
    .describe('The interview questions, in the order they should be asked.'),
})

const IdeasSchema = z.object({
  ideas: z
    .array(
      z.object({
        title: z.string().describe('A real children’s book title.'),
        logline: z.string().describe('One sentence hook.'),
        summary: z.string().describe('Two or three sentences describing the arc.'),
        highlights: z
          .array(z.string())
          .describe('Exactly three concrete scenes, one sentence each, in order.'),
        turn: z
          .string()
          .describe(
            'One sentence: what changes partway through, so the second half cannot be swapped with the first.',
          ),
        device: z
          .string()
          .describe(
            'The guide object and its colour, e.g. "a blue woollen thread". One thing, present and acting on every page. Empty when no object genuinely belongs to this story — a forced one is worse than none.',
          ),
      }),
    )
    .describe('Exactly four distinct story ideas.'),
})

const StoryboardSchema = z.object({
  title: z.string().describe('The final title of the book.'),
  pages: z
    .array(
      z.object({
        narration: z.string().describe('Text printed under the illustration.'),
        narrationSecondary: z
          .string()
          .describe(
            'The same sentence in the support language, or empty when the book is single-language.',
          ),
        sceneDescription: z
          .string()
          .describe('English visual description of the scene for the image model.'),
        charactersOnPage: z
          .array(z.string())
          .describe('Character ids visible on this page.'),
        memoryId: z
          .string()
          .describe(
            'Id of the photograph this page recreates, or empty for an ordinary page.',
          ),
      }),
    )
    .describe('One entry per illustrated page, in reading order.'),
})

/* ------------------------------------------------------------------ *
 * Calls
 * ------------------------------------------------------------------ */

export async function generateInterviewQuestions(
  brief: BookBrief,
  count = 9,
): Promise<InterviewQuestion[]> {
  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    system: INTERVIEW_SYSTEM,
    messages: [{ role: 'user', content: interviewUser(brief, count) }],
    output_config: { format: zodOutputFormat(InterviewSchema) },
  })

  record('perguntas da entrevista', MODEL, response.usage)
  const parsed = expectParsed(response.parsed_output, 'interview questions')

  // Keep same-group questions adjacent even if the model interleaves them —
  // the UI shows one group per screen and a split group reads as a bug.
  const order: string[] = []
  for (const q of parsed.questions) {
    if (!order.includes(q.group)) order.push(q.group)
  }

  return parsed.questions
    .slice(0, count)
    .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group))
    .map((q, i) => ({
      id: `q${i + 1}`,
      group: q.group,
      question: q.question,
      hint: q.hint,
      placeholder: q.placeholder,
      suggestions: q.suggestions.slice(0, 3),
    }))
}

export async function generateIdeas(brief: BookBrief): Promise<StoryIdea[]> {
  const response = await getClient().messages.parse({
    model: MODEL,
    // Four ideas each carrying a summary, three highlights, a turn and a guide
    // object. At 8000 the reply came back cut off mid-string.
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: IDEAS_SYSTEM,
    messages: [{ role: 'user', content: ideasUser(brief) }],
    output_config: { format: zodOutputFormat(IdeasSchema) },
  })

  record('ideias de historia', MODEL, response.usage)
  const parsed = expectParsed(response.parsed_output, 'story ideas')
  return parsed.ideas.slice(0, 4).map((idea, i) => ({
    id: `idea${i + 1}`,
    title: idea.title,
    logline: idea.logline,
    summary: idea.summary,
    highlights: idea.highlights,
    turn: idea.turn,
    device: idea.device,
  }))
}

const TitlesSchema = z.object({
  titles: z
    .array(z.string())
    .describe('Three short, distinct titles for the chosen story.'),
})

export async function generateTitleSuggestions(
  brief: BookBrief,
  idea: StoryIdea,
): Promise<string[]> {
  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    system: TITLES_SYSTEM,
    messages: [{ role: 'user', content: titlesUser(brief, idea) }],
    output_config: { format: zodOutputFormat(TitlesSchema) },
  })

  record('sugestoes de titulo', MODEL, response.usage)
  const parsed = expectParsed(response.parsed_output, 'title suggestions')
  return parsed.titles.map((t) => t.trim()).filter(Boolean).slice(0, 3)
}

export async function generateStoryboard(
  brief: BookBrief,
  idea: StoryIdea,
): Promise<Storyboard> {
  const pageCount = BOOK_PAGES

  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: STORYBOARD_SYSTEM,
    messages: [{ role: 'user', content: storyboardUser(brief, idea, pageCount) }],
    output_config: { format: zodOutputFormat(StoryboardSchema) },
  })

  record('roteiro (rascunho)', MODEL, response.usage)
  let parsed = expectParsed(response.parsed_output, 'storyboard')

  // Then the same loop the pages get: mark it against the rules, repair only
  // what failed, mark it again. Text is the cheap place to do this — a story
  // that does not hold costs a few calls to fix here and roughly US$0.70 of
  // drawings to discover later.
  //
  // What this replaced was a single blind rewrite: hand the draft over, ask
  // for it to be better, keep whatever came back. Nothing said what was
  // wrong and nothing confirmed the rewrite had fixed it.
  for (let attempt = 1; attempt <= MAX_STORY_ATTEMPTS; attempt++) {
    const review = await reviewStoryboard(brief, idea, toStoryboard(parsed, brief, idea))
      .catch(() => ({ failures: [] as string[], passed: true }))
    if (process.env.STORY_REVIEW_LOG) {
      console.log(
        review.passed
          ? `  revisao ${attempt}: passou em todas as regras`
          : `  revisao ${attempt}: reprovou em ${review.failures.length} —\n    ${review.failures.join('\n    ')}`,
      )
    }
    if (review.passed) break

    const repaired = await getClient().messages.parse({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: REVISE_SYSTEM,
      messages: [
        {
          role: 'user',
          content: reviseUser(
            idea,
            JSON.stringify(parsed, null, 2),
            review.failures,
          ),
        },
      ],
      output_config: { format: zodOutputFormat(StoryboardSchema) },
    })

    // A repair that comes back unusable leaves the previous draft standing.
    // Losing a revision is worth less than losing the order.
    record(`roteiro (conserto ${attempt})`, MODEL, repaired.usage)
    if (repaired.parsed_output) parsed = repaired.parsed_output
  }

  return toStoryboard(parsed, brief, idea)
}

/**
 * Turns what the model returned into a Storyboard, dropping ids it invented.
 *
 * Shared by the review loop and the final return so the editor marks exactly
 * the object the customer will read.
 */
function toStoryboard(
  parsed: z.infer<typeof StoryboardSchema>,
  brief: BookBrief,
  idea: StoryIdea,
): Storyboard {
  const knownIds = new Set(brief.characters.map((c) => c.id))
  const knownMemoryIds = new Set((brief.memories ?? []).map((m) => m.id))

  return {
    title: brief.title.trim() || parsed.title,
    device: idea.device,
    dedication: brief.dedication,
    pages: parsed.pages.slice(0, BOOK_PAGES).map((page, i) => ({
      index: i + 1,
      narration: page.narration,
      narrationSecondary: page.narrationSecondary?.trim() || undefined,
      sceneDescription: page.sceneDescription,
      // The model occasionally answers with names instead of ids; drop
      // anything we cannot resolve rather than passing it downstream.
      charactersOnPage: page.charactersOnPage.filter((id) => knownIds.has(id)),
      // Same guard: an unknown id would send the renderer looking for a photo
      // that does not exist, so only ids we actually hold survive.
      memoryId: knownMemoryIds.has(page.memoryId?.trim() ?? '')
        ? page.memoryId.trim()
        : undefined,
    })),
  }
}

function expectParsed<T>(parsed: T | null | undefined, what: string): T {
  if (!parsed) {
    throw new Error(`The model did not return usable ${what}. Try again.`)
  }
  return parsed
}
