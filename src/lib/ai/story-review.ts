import * as z from 'zod'
import { getAgeBand, getTone } from '../catalog'
import { askForJson } from './ask'
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
    test: 'Most pages end with the situation unresolved — a question, something begun, something about to go wrong. What must NOT be unresolved is the grammar: every sentence is finished. A page ending on a fragment or a trailing "and then" fails this, because a reader takes it for a mistake rather than for suspense.',
  },
  {
    id: 'development',
    title: 'A página se desenvolve',
    test: 'On each page, one thing is true at the start and a different thing is true at the end — somebody decides, finds, loses, admits, tries or arrives. Name what changes on each page. A page that is a lovely moment in which nothing moves is a caption, and fails. Then check inside the page: each sentence must follow from the one before it, with the joins visible ("so", "but", "until", "which is why"). Sentences that merely sit side by side describing one moment from two angles fail this — it is what makes a simple story read as confusing.',
  },
  {
    id: 'clarity',
    title: 'Dá para acompanhar em uma leitura',
    test: 'Every page can be followed on a single reading aloud. The reader always knows who is present, where they are and what just happened; only the meaning is withheld. Any page carrying an identity on "ela" or "ele" alone across a page turn fails, as does any page whose setting or event the reader has to reconstruct.',
  },
  {
    id: 'dialogue',
    title: 'Alguém fala, e do jeito certo',
    test: 'Roughly a third of the pages carry a spoken line. Every spoken line sits alone on its own line inside the narration, opened with a single em dash and a space ("— Você vem?"), with any attribution after a comma on the same line. Quotation marks, double dashes, hyphens, and speech buried mid-paragraph all fail this. The line breaks must be real newline characters in the narration text.',
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

/**
 * What is additionally true of a reading book, and only of a reading book.
 *
 * The base rules above hold for all three finishes. These four are the ones
 * the customer is actually buying when they choose a story to read aloud —
 * and they are the four that separate a book a child asks for again from a
 * book that is merely personalized.
 */
const READING_RULES = [
  {
    id: 'shape',
    title: 'A jornada acontece',
    test: 'The sixteen spreads carry a real journey: an ordinary world worth missing, something that will not let the child stay, a hesitation with a reason behind it, a crossing, a hard part that is hard because of what page 1 established, and a return to the same place changed. Name the page each turn happens on. A book that is sixteen nice moments in a row fails this.',
  },
  {
    id: 'mystery',
    title: 'Mistério',
    test: 'Something is established early that the reader does not understand yet and wants to, and it is answered before the end. Name the page it opens and the page it closes. If nothing is withheld, the reader has no reason to turn the page.',
  },
  {
    id: 'empathy',
    title: 'Empatia',
    test: 'Somewhere the reader knows something the character does not, or wants something for them they have not asked for. That gap is where feeling for a character comes from, and without it the child watches rather than cares.',
  },
  {
    id: 'picture-alone',
    title: 'A imagem se sustenta sozinha',
    test: 'Each scene description is a complete picture in its own right: a child who cannot read yet could follow the whole book from the left-hand pages alone. And no narration merely describes what its picture already shows — the words alone on their page have to carry what the picture cannot.',
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

type Rule = { id: string; title: string; test: string }

function rulesFor(brief: BookBrief): readonly Rule[] {
  return brief.finish === 'reading' ? [...RULES, ...READING_RULES] : RULES
}

function rubric(rules: readonly Rule[]): string {
  return rules.map((r) => `- ${r.id} — ${r.title}: ${r.test}`).join('\n')
}

/**
 * The one check that needs no model at all: is each page the right length for
 * the child it was ordered for?
 *
 * Counting words is counting, so it is done by counting — locally, free, and
 * without the chance of a reviewer deciding a 200-word page "feels about
 * right" for a four-year-old. The same split the page images get.
 */
function measureLength(brief: BookBrief, storyboard: Storyboard): string[] {
  if (brief.finish !== 'reading') return []
  const band = getAgeBand(brief.ageBandId)

  const wrong = storyboard.pages
    .map((p) => ({ index: p.index, words: p.narration.trim().split(/\s+/).filter(Boolean).length }))
    .filter((p) => p.words < band.words.min || p.words > band.words.max)

  if (wrong.length === 0) return []
  return [
    `Tamanho das páginas: a book for ${band.years} carries ${band.words.min}–${band.words.max} words a page. These are outside it — ${wrong
      .map((p) => `page ${p.index} has ${p.words}`)
      .join(', ')}. Rewrite those pages to length without cutting anything the story needs; if a page cannot be said in that many words, the page is doing too much and should be split across the turn.`,
  ]
}

function systemFor(rules: readonly Rule[]): string {
  return `You are the editor marking a personalized children's book before it is shown to the person who ordered it.

Mark each rule below separately. Be hard: the book is a gift someone is paying for, and the common failure is a storyboard where every page reads acceptably and the whole is lifeless. A rule you are unsure about has not been met.

RULES:
${rubric(rules)}

For a failure, say what is wrong and name the pages, concretely enough that a writer could fix it without asking you anything. "Pages 4 to 9 are all 'the next lamp is X' and could be shuffled freely" is useful. "Needs more depth" is not.`
}

export async function reviewStoryboard(
  brief: BookBrief,
  idea: StoryIdea,
  storyboard: Storyboard,
): Promise<StoryReview> {
  const tone = getTone(brief.toneId)
  const rules = rulesFor(brief)

  const pages = storyboard.pages
    .map((p) => `${p.index}. ${p.narration}`)
    .join('\n')

  // One verdict per rule, each with its reasoning, plus whatever adaptive
  // thinking spends reading a 32-page storyboard first.
  const parsed = await askForJson({
    what: 'story review',
    label: 'revisao do texto',
    schema: VerdictSchema,
    maxTokens: 24_000,
    system: systemFor(rules),
    user: [
      `THE TONE THIS BOOK WAS ORDERED IN: ${tone.prompt}`,
      `THE TURN THE IDEA PROMISED: ${idea.turn}`,
      idea.device ? `THE GUIDE OBJECT: ${idea.device}` : '',
      '',
      'WHAT THE CUSTOMER TOLD US:',
      ...brief.interview
        .filter((a) => a.answer.trim())
        .map((a) => `- ${a.question} ${a.answer}`),
      ...brief.characters.map(
        (c) => `- ${c.name}: ${c.personality ?? ''} ${c.storyNotes ?? ''}`.trim(),
      ),
      '',
      'THE STORYBOARD:',
      pages,
    ]
      .filter(Boolean)
      .join('\n'),
  })

  const verdicts = parsed.verdicts ?? []
  const failures = [
    ...measureLength(brief, storyboard),
    ...verdicts
      .filter((v) => !v.pass)
      .map((v) => {
        const rule = rules.find((r) => r.id === v.id)
        return `${rule?.title ?? v.id}: ${v.note}`
      }),
  ]

  return { failures, passed: failures.length === 0 }
}
