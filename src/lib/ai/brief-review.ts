import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import * as z from 'zod'
import { briefContext, uiLanguage } from './prompts'
import { record } from './usage'
import type { BookBrief } from '../types'

/**
 * Asks whether there is enough here to make a good book, before one is made.
 *
 * Everything downstream assumes the brief is rich. When it is not, the story
 * comes back generic and nobody can tell whether the writing failed or the
 * material was thin — and the customer, who is the only person who could
 * supply more, has already left the screen where they could have.
 *
 * So this reads the brief the way the writer will and reports what is missing,
 * in the customer's own language, as things they can actually answer. It never
 * blocks: a thin book is still a book, and refusing to make one because a form
 * was short would be worse than making it.
 *
 * Two failures it looks hardest for, both learned from a real order:
 *
 *   A character with a face and no person. "Curly hair, round glasses" gives
 *   the illustrator everything and the writer nothing, and the writer is who
 *   decides whether the book is about anybody.
 *
 *   Details true of anyone. "Loves to laugh, very kind" cannot produce a page.
 *   "Stops in the middle of the street to ask 'what?'" produced eleven.
 */
const MODEL = 'claude-opus-5'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) client = new Anthropic()
  return client
}

const GapSchema = z.object({
  readyForAGoodBook: z
    .boolean()
    .describe('Whether there is enough particular material here already.'),
  gaps: z
    .array(
      z.object({
        about: z
          .string()
          .describe(
            'Which character this concerns, by name, or "a história" when it is about the story as a whole.',
          ),
        missing: z
          .string()
          .describe(
            'One short line naming what is thin, addressed to the customer in their language.',
          ),
        ask: z
          .string()
          .describe(
            'One concrete question they could answer in a sentence to fix it, in their language.',
          ),
      }),
    )
    .describe('At most three, most valuable first. Empty when the brief is rich.'),
})

export interface BriefGap {
  about: string
  missing: string
  ask: string
}

export interface BriefReview {
  ready: boolean
  gaps: BriefGap[]
}

const SYSTEM = `You are reading the brief for a personalized children's book and judging whether there is enough in it to write a good one.

A good book of this kind is built from particular things: a habit, a phrase someone always says, a thing that happened once, an object that belongs to them. Generic warmth cannot be drawn and cannot be narrated — "loves to laugh", "very sweet", "best friends" produce a book that could be given to anyone.

Judge these, per character and for the story as a whole:

- IS THERE A PERSON, not only a face? An appearance with no temperament gives the illustrator everything and the writer nothing.
- IS ANYTHING PARTICULAR? At least one habit, phrase, obsession or real moment that could only be this person.
- IS THERE SOMETHING THAT HAPPENED? Stories need events. A brief of adjectives has none.
- IS THERE A RELATIONSHIP? What these people are to each other, and one concrete thing that shows it.
- IS THERE A PLACE with something specific in it?

Report at most three gaps, the most valuable first, and only real ones. If the brief is already rich, say so and return none — telling someone their answers are thin when they are not is worse than silence.

For each gap, write one line naming what is thin and one question they can answer in a sentence. Ask about concrete things: what they do, what they say, what happened. Never ask them to describe a personality in the abstract, which is the question that produced the thin answer in the first place.

Write everything you return in the requested language, addressed to the customer as "você".`

export async function reviewBrief(brief: BookBrief): Promise<BriefReview> {
  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          `Write your answer in ${uiLanguage(brief)}.`,
          '',
          briefContext(brief),
        ].join('\n'),
      },
    ],
    output_config: { format: zodOutputFormat(GapSchema) },
  })

  record('conferencia do briefing', MODEL, response.usage)
  const parsed = response.parsed_output
  return {
    ready: parsed?.readyForAGoodBook ?? true,
    gaps: (parsed?.gaps ?? []).slice(0, 3),
  }
}
