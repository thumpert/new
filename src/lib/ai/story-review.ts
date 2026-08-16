import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import * as z from 'zod'
import { getTone } from '../catalog'
import { record } from './usage'
import type { BookBrief, StoryIdea, Storyboard } from '../types'

/**
 * Marks a finished storyboard against the rules, before anybody reads it.
 *
 * The pages half of this pipeline already works this way: draw, look at what
 * came out, redraw against what was wrong. The words half did not. It had a
 * single blind rewrite that was handed the draft and told to improve it,
 * which is a wish rather than a check — nothing said what was wrong, and
 * nothing confirmed the rewrite had fixed it.
 *
 * So the rules are written out as a rubric, each is marked separately with a
 * reason, and only the failures are sent back to be repaired. Then it is
 * marked again. A story reaches the customer having passed, or having been
 * given three tries.
 *
 * The rules are stated as mechanisms and never as names. The voices behind
 * them came from studying particular authors, but asking a model to write
 * "like" someone produces pastiche of that person's protected work, and
 * describing what the technique actually does produces the technique.
 */
const MODEL = 'claude-opus-5'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) client = new Anthropic()
  return client
}

const RULES = [
  {
    id: 'chaining',
    title: 'Encadeamento',
    test: 'Every page depends on the one before it. Something set up earlier pays off later; a state changes and stays changed. Apply the shuffle test: if any two pages could trade places without the book breaking, this fails.',
  },
  {
    id: 'voice',
    title: 'Voz coesa',
    test: 'One narrator, the same person on every page, and unmistakably the tone that was chosen. A page that drifts into a different register — suddenly grander, suddenly flatter, suddenly explaining — fails this for the whole book.',
  },
  {
    id: 'not-captions',
    title: 'O texto não legenda a imagem',
    test: 'No page merely says what its illustration already shows. Each narration carries something the picture cannot: a thought, a thing unsaid, the moment before, what is about to happen.',
  },
  {
    id: 'unstated-feeling',
    title: 'O sentimento não é declarado',
    test: 'Nowhere does the narrator explain what a moment meant or how anyone felt. No "that was when he knew", no "they were so happy". Gestures only.',
  },
  {
    id: 'page-turns',
    title: 'Cada página puxa a seguinte',
    test: 'Most pages end mid-motion, on a question, or on a word that leans forward. A book of closed statements gives the reader permission to stop.',
  },
  {
    id: 'specificity',
    title: 'Detalhe que só esta família teria',
    test: 'Each page carries at least one concrete, surprising, particular detail drawn from what this customer actually said. If the book could be re-titled and given to another family unchanged, this fails.',
  },
  {
    id: 'refrain',
    title: 'Refrão',
    test: 'One short phrase or gesture returns three or four times, changed a little each time, and pays off on the last page.',
  },
  {
    id: 'turn',
    title: 'A virada prometida acontece',
    test: 'The turn the chosen idea promised happens on an identifiable page, before the last two, and the pages after it read differently because of it.',
  },
  {
    id: 'wobble',
    title: 'Um tropeço leve',
    test: 'Somewhere in the middle something small goes briefly wrong and is put right with tenderness. It must be gentle — nothing frightening, nothing sad, no illness, no loss, no real danger. This is a present.',
  },
  {
    id: 'rhythm',
    title: 'Ritmo',
    test: 'Sentence lengths vary deliberately, and short lines are used to land. Pages of uniform sentence length flatten the book.',
  },
  {
    id: 'ending',
    title: 'O final aterrissa',
    test: 'The last page closes what the first opened, pays off the refrain, and is warm towards the person receiving the book.',
  },
] as const

const VerdictSchema = z.object({
  verdicts: z
    .array(
      z.object({
        id: z.string().describe('The rule id being marked.'),
        pass: z.boolean().describe('Whether the storyboard satisfies it.'),
        note: z
          .string()
          .describe(
            'When failed: what is wrong and on which pages, concretely enough to act on. When passed: one short line saying how.',
          ),
      }),
    )
    .describe('One verdict per rule, in the order given.'),
})

export interface StoryReview {
  /** Rule ids that failed, with what is wrong — the repair list. */
  failures: string[]
  passed: boolean
}

function rubric(): string {
  return RULES.map((r) => `- ${r.id} — ${r.title}: ${r.test}`).join('\n')
}

const SYSTEM = `You are the editor marking a personalized children's book before it is shown to the person who ordered it.

Mark each rule below separately. Be hard: the book is a gift someone is paying for, and the common failure is a storyboard where every page reads acceptably and the whole is lifeless. A rule you are unsure about has not been met.

RULES:
${rubric()}

For a failure, say what is wrong and name the pages, concretely enough that a writer could fix it without asking you anything. "Pages 4 to 9 are all 'the next lamp is X' and could be shuffled freely" is useful. "Needs more depth" is not.`

export async function reviewStoryboard(
  brief: BookBrief,
  idea: StoryIdea,
  storyboard: Storyboard,
): Promise<StoryReview> {
  const tone = getTone(brief.toneId)

  const pages = storyboard.pages
    .map((p) => `${p.index}. ${p.narration}`)
    .join('\n')

  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          `THE TONE THIS BOOK WAS ORDERED IN: ${tone.prompt}`,
          `THE TURN THE IDEA PROMISED: ${idea.turn}`,
          idea.device ? `THE GUIDE OBJECT: ${idea.device}` : '',
          '',
          'WHAT THE CUSTOMER TOLD US:',
          ...brief.interview
            .filter((a) => a.answer.trim())
            .map((a) => `- ${a.question} ${a.answer}`),
          ...brief.characters.map(
            (c) =>
              `- ${c.name}: ${c.personality ?? ''} ${c.storyNotes ?? ''}`.trim(),
          ),
          '',
          'THE STORYBOARD:',
          pages,
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ],
    output_config: { format: zodOutputFormat(VerdictSchema) },
  })

  record('revisao do texto', MODEL, response.usage)
  const verdicts = response.parsed_output?.verdicts ?? []
  const failures = verdicts
    .filter((v) => !v.pass)
    .map((v) => {
      const rule = RULES.find((r) => r.id === v.id)
      return `${rule?.title ?? v.id}: ${v.note}`
    })

  return { failures, passed: failures.length === 0 }
}
