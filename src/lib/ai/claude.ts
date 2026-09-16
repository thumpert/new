import * as z from 'zod'
import { getBookLanguage, pagesFor } from '../catalog'
import { getStory, pageCountFor } from '../stories'
import { askForJson } from './ask'
import { reviewStoryboard } from './story-review'
import type { BookBrief, StoryIdea, Storyboard } from '../types'
import {
  STORYBOARD_SYSTEM,
  TITLES_SYSTEM,
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

const TitlesSchema = z.object({
  titles: z
    .array(z.string())
    .describe('Three short, distinct titles for the chosen story.'),
})

/* ------------------------------------------------------------------ *
 * Calls
 * ------------------------------------------------------------------ */

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
  // Thirteen, unless this is a colouring book of a story whose beats have
  // been cut into two frames each — then the book is twice its beats and has
  // no words in it. Read once here and carried down, so the prompt, the token
  // ceiling and the slice that trims the model's answer cannot disagree about
  // how long the book is; they did once, and the extra pages were silently
  // dropped after being paid for.
  const story = brief.chosenStoryId ? getStory(brief.chosenStoryId) : undefined
  const pageCount = pageCountFor(story, brief) ?? pagesFor()

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
      toStoryboard(board, brief, idea, pageCount),
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

  // How many faults the round before this one left standing. A repair that
  // does not reduce it is the signal to stop.
  let previousFailures = Number.POSITIVE_INFINITY

  // A PRE-WRITTEN STORY IS MARKED ONCE, NOT ROUND AFTER ROUND.
  //
  // The loop was built for a story the model invented, where a bad draft can
  // be structurally bad and a second and third look are worth buying. Here
  // the structure is not in question — the page order came from this
  // repository — so what is left to find is prose, one review finds it, and
  // one repair is the whole of what a second round would have asked for.
  // Measured: eight calls and US$3.03 the round-after-round way, against
  // US$0.91 for the same book stopping early, and the customer waiting
  // twenty-one minutes instead of fifteen for the privilege.
  const rounds = brief.chosenStoryId ? 1 : MAX_STORY_ATTEMPTS

  for (let attempt = 1; attempt <= rounds; attempt++) {
    const review = await mark(parsed, String(attempt))
    if (review.passed) break

    // STOP WHEN THE REPAIRS STOP HELPING.
    //
    // The loop used to run its three rounds whatever happened, on the
    // assumption that a book failing review is a book a repair can mend. A
    // rule that cannot be satisfied breaks that assumption, and the loop then
    // pays full price to be told the same thing three times: measured on one
    // book, eight calls and US$3.03 against US$0.91 for the same book when
    // the first repair worked. The unsatisfiable rule was one somebody had
    // just added, which is the point — this guard is not about that rule, it
    // is about the next one.
    //
    // Fewer faults than last round means the repairs are working and another
    // is worth buying. The same number or more means they are not.
    if (review.failures.length >= previousFailures) {
      if (process.env.STORY_REVIEW_LOG) {
        console.log(
          `  parando: o conserto ${attempt - 1} nao reduziu as falhas ` +
            `(${previousFailures} -> ${review.failures.length})`,
        )
      }
      break
    }
    previousFailures = review.failures.length

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
    if (attempt === rounds && !brief.chosenStoryId) await mark(parsed, 'final')
  }

  parsed = best.board

  return toStoryboard(parsed, brief, idea, pageCount)
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
  pageCount: number,
): Storyboard {
  const knownIds = new Set(brief.characters.map((c) => c.id))

  return {
    title: brief.title.trim() || parsed.title,
    device: idea.device,
    dedication: brief.dedication,
    pages: parsed.pages.slice(0, pageCount).map((page, i) => ({
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

