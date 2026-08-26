import * as z from 'zod'
import { getBookLanguage, getOccasion, pagesFor } from '../catalog'
import { askForJson } from './ask'
import { reviewStoryboard } from './story-review'
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

/**
 * How many times the story may be repaired before it goes to the customer.
 *
 * Three, matching the pages. The first draft usually fails one or two rules,
 * the repair clears them, and the third attempt is there for the book that
 * needs it. All of it is text, so a whole loop costs a fraction of one page
 * of drawings.
 */
const MAX_STORY_ATTEMPTS = 3

/**
 * What claude-opus-5 will emit in one answer.
 *
 * Named so the ceilings below are visibly derived from the model's own limit
 * rather than from a number somebody liked. Every call here streams, which is
 * what makes budgets this size safe: the SDK refuses a non-streaming request
 * whose max_tokens could outrun the ten-minute HTTP timeout.
 */
const MAX_OUTPUT_TOKENS = 128_000

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
        want: z
          .string()
          .describe(
            'One sentence: what somebody wants and does not have at the start, small and concrete. This is what the reader follows.',
          ),
        turn: z
          .string()
          .describe(
            'One sentence: what changes partway through, so the second half cannot be swapped with the first.',
          ),
        device: z
          .string()
          .describe(
            'One small thing already in these people\'s lives that turns up more than once, and its colour — "the blue biscuit tin". On a coloring page it becomes the only coloured object. A recurring detail, never the engine: the story must make complete sense without it. Empty when nothing like that is in what the customer told us.',
          ),
        anchor: z
          .boolean()
          .describe(
            'True only for the idea written to the required shape, when the prompt asked for one, and false on every other idea. False on all four when no shape was required.',
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
  // Roughly 250 tokens per question once the three suggestions are counted,
  // and adaptive thinking spends from this same budget before it starts
  // writing — which is what put the old 8000 over the edge.
  const parsed = await askForJson({
    what: 'interview questions',
    label: 'perguntas da entrevista',
    schema: InterviewSchema,
    maxTokens: 24_000,
    system: INTERVIEW_SYSTEM,
    user: interviewUser(brief, count),
  })

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

/**
 * How many times ideas are asked for before the customer is shown any.
 *
 * An idea with nobody wanting anything is not a weak idea, it is a different
 * object: pages that click together and give the reader no reason to turn
 * them. One reached a real customer — its turn was entirely about a paper bag
 * blowing into the Seine, its want was empty, and the book that came out of
 * it was a chase with nobody in it. The rule existed and only the writing
 * prompt enforced it, which means it was a request rather than a gate.
 */
const MAX_IDEA_ATTEMPTS = 2

export async function generateIdeas(brief: BookBrief): Promise<StoryIdea[]> {
  // Occasions that always offer a shape of their own — the customer should
  // find it among the four however the writing model felt that day.
  const wantsAnchor = Boolean(getOccasion(brief.occasionId).anchorIdea)

  let last: StoryIdea[] = []
  let retryNote = ''

  for (let attempt = 1; attempt <= MAX_IDEA_ATTEMPTS; attempt++) {
    // Four ideas each carrying a summary, three highlights, a want and a turn.
    // At 8000 the reply came back cut off mid-string.
    const parsed = await askForJson({
      what: 'story ideas',
      label: attempt === 1 ? 'ideias de historia' : `ideias de historia (${attempt})`,
      schema: IdeasSchema,
      maxTokens: 24_000,
      system: IDEAS_SYSTEM,
      user: retryNote ? `${ideasUser(brief)}\n\n${retryNote}` : ideasUser(brief),
    })

    const ideas = parsed.ideas.slice(0, 4).map((idea) => ({
      id: '',
      title: idea.title,
      logline: idea.logline,
      summary: idea.summary,
      highlights: idea.highlights,
      want: idea.want,
      turn: idea.turn,
      device: idea.device,
      anchored: idea.anchor === true,
    }))

    // Only ideas somebody wants something in reach the customer, and the
    // occasion's own shape leads when it came back. Renumbered last so the
    // ids stay dense — the screen and the chosen id both assume it.
    const wanted = ideas.filter((idea) => idea.want?.trim())
    const kept = [
      ...wanted.filter((idea) => idea.anchored),
      ...wanted.filter((idea) => !idea.anchored),
    ].map((idea, i) => ({ ...idea, id: `idea${i + 1}` }))

    const hasAnchor = !wantsAnchor || kept.some((idea) => idea.anchored)
    if (kept.length >= 2 && hasAnchor) return kept

    // Prefer whichever attempt got closer: carrying the shape beats carrying
    // one more idea, because the missing shape is the thing being guarded.
    if (score(kept, wantsAnchor) > score(last, wantsAnchor)) last = kept

    retryNote =
      kept.length < 2
        ? 'The previous attempt came back with ideas that had nobody wanting anything. Every idea must name, in the "want" field, one small concrete thing somebody does not have on page one and spends the book trying to get. An idea whose turn is only about an object moving around is the failure this is guarding against.'
        : 'The previous attempt came back without the required shape. One of the four must follow it and carry "anchor": true. Write that one first.'
  }

  if (last.length > 0) return last
  throw new Error(
    'The ideas came back with nobody wanting anything in them. Try again.',
  )
}

/** Ranks two attempts at the four ideas. Carrying the shape outweighs count. */
function score(ideas: StoryIdea[], wantsAnchor: boolean): number {
  if (ideas.length === 0) return 0
  const anchored = wantsAnchor && ideas.some((idea) => idea.anchored)
  return ideas.length + (anchored ? 10 : 0)
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
  // Three short strings, but adaptive thinking still needs headroom to weigh
  // them: the output is tiny, the budget is not.
  const parsed = await askForJson({
    what: 'title suggestions',
    label: 'sugestoes de titulo',
    schema: TitlesSchema,
    maxTokens: 12_000,
    system: TITLES_SYSTEM,
    user: titlesUser(brief, idea),
  })
  return parsed.titles.map((t) => t.trim()).filter(Boolean).slice(0, 3)
}

export async function generateStoryboard(
  brief: BookBrief,
  idea: StoryIdea,
): Promise<Storyboard> {
  const pageCount = pagesFor()

  // The largest answer by far: every page carries narration, an optional
  // translation and an English scene description. The ceiling scales with the
  // book so a long one cannot quietly hit a limit a short one never reached.
  //
  // The translation is its own term rather than a fatter per-page number,
  // because it was the two together that overran: the old ceiling was a flat
  // 16k + 1.5k a page, tuned when every book was twelve pages in one
  // language. A sixteen-page reading book with a second language underneath
  // is twice that book, and it hit the 40k ceiling mid-repair — the repair
  // came back truncated and was thrown away, so the customer got the
  // unrepaired draft after paying for both.
  const bilingual = Boolean(getBookLanguage(brief.bookLanguage).secondary)
  const storyboardTokens = 16_000 + pageCount * (bilingual ? 2_500 : 1_500)

  // A repair is the draft plus the reading of a review, and it re-emits the
  // whole book either way, so it cannot live inside the draft's budget. The
  // draft has never overrun; the repair is what did.
  const repairTokens = Math.min(Math.round(storyboardTokens * 1.5), MAX_OUTPUT_TOKENS)

  let parsed = await askForJson({
    what: 'storyboard',
    label: 'roteiro (rascunho)',
    schema: StoryboardSchema,
    maxTokens: storyboardTokens,
    system: STORYBOARD_SYSTEM,
    user: storyboardUser(brief, idea, pageCount),
  })

  // Then the same loop the pages get: mark it against the rules, repair only
  // what failed, mark it again. Text is the cheap place to do this — a story
  // that does not hold costs a few calls to fix here and roughly US$0.70 of
  // drawings to discover later.
  //
  // What this replaced was a single blind rewrite: hand the draft over, ask
  // for it to be better, keep whatever came back. Nothing said what was
  // wrong and nothing confirmed the rewrite had fixed it.
  // The best version is kept, not the last one. Reviewing and then repairing
  // sends the final repair out unread, and a repair is a fresh draft: it fixes
  // what it was told about and can quietly break something else. It did —
  // a book came back with its four named faults mended and its opening pages
  // at fifty-nine words in a format that holds thirty-five. This is the same
  // rule the pages already follow, for the same reason.
  let best = { board: parsed, failures: Number.POSITIVE_INFINITY }

  const mark = async (board: z.infer<typeof StoryboardSchema>, round: string) => {
    const review = await reviewStoryboard(
      brief,
      idea,
      toStoryboard(board, brief, idea),
    ).catch(() => ({ failures: [] as string[], passed: true }))

    if (process.env.STORY_REVIEW_LOG) {
      console.log(
        review.passed
          ? `  revisao ${round}: passou em todas as regras`
          : `  revisao ${round}: reprovou em ${review.failures.length} —\n    ${review.failures.join('\n    ')}`,
      )
    }
    if (review.failures.length < best.failures) {
      best = { board, failures: review.failures.length }
    }
    return review
  }

  for (let attempt = 1; attempt <= MAX_STORY_ATTEMPTS; attempt++) {
    const review = await mark(parsed, String(attempt))
    if (review.passed) break

    // A repair that comes back unusable leaves the previous draft standing.
    // Losing a revision is worth less than losing the order. The rewrite is
    // a whole storyboard, so it needs the same ceiling as the draft.
    try {
      parsed = await askForJson({
        what: 'storyboard repair',
        label: `roteiro (conserto ${attempt})`,
        schema: StoryboardSchema,
        maxTokens: repairTokens,
        system: REVISE_SYSTEM,
        user: reviseUser(idea, JSON.stringify(parsed, null, 2), review.failures),
      })
    } catch (err) {
      if (process.env.STORY_REVIEW_LOG) {
        console.log(
          `  conserto ${attempt} falhou, mantendo o rascunho: ${
            err instanceof Error ? err.message : err
          }`,
        )
      }
      break
    }

    // The last repair would otherwise go out unread.
    if (attempt === MAX_STORY_ATTEMPTS) await mark(parsed, 'final')
  }

  parsed = best.board

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

  return {
    title: brief.title.trim() || parsed.title,
    device: idea.device,
    dedication: brief.dedication,
    pages: parsed.pages.slice(0, pagesFor()).map((page, i) => ({
      index: i + 1,
      narration: page.narration,
      narrationSecondary: page.narrationSecondary?.trim() || undefined,
      sceneDescription: page.sceneDescription,
      // The model occasionally answers with names instead of ids; drop
      // anything we cannot resolve rather than passing it downstream.
      charactersOnPage: page.charactersOnPage.filter((id) => knownIds.has(id)),
    })),
  }
}

