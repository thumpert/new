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
const RULES: Rule[] = [
  {
    id: 'chaining',
    structural: true,
    title: 'Encadeamento e movimento',
    test: 'Three checks, reported together as one fault so the writer gets one repair rather than three that fight each other. FIRST, between pages: put "but", "therefore" or "and then" between each consecutive pair and name every join where only "and then" fits — those pages follow in time without one causing the other. SECOND, the shuffle test: if any two pages could trade places without the book breaking, say which. THIRD, inside each page: one thing is true at the start and a different thing at the end — somebody decides, finds, loses, admits, tries or arrives — and each sentence follows from the one before it with the join visible ("so", "but", "until", "which is why"). Sentences sitting side by side describing one moment from two angles fail this. Name the pages for each of the three.',
  },
  {
    id: 'orientation',
    title: 'Dá para saber onde estamos',
    test: 'Read as somebody who has never met these people. The opening pages establish who and where before anything changes. Every person is named on the page they first act, and named rather than pronouned the first time they act after somebody else has. Any passage of time is stated in the words, not left to the picture. Name any page where you could not say who is acting, where they are, or how long it has been.',
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
    id: 'machine-shapes',
    title: 'Sem os vícios de máquina',
    // Adapted from the no-ai-slop skill by Peter Yang (MIT), keeping the
    // patterns that survive translation into Portuguese children's narration
    // and dropping the ones aimed at English business prose. The em-dash rule
    // is inverted on purpose: here it is the correct mark for speech.
    test: 'None of these appear anywhere in the book: the colon reveal (a noun phrase, a colon, a small unveiling); the binary contrast ("Não era X. Era Y."); negative listing; sentence fragments stacked for percussion; a closing aphorism or neat metaphor after the story has ended; a recap ending ("No fim das contas"); a line telling the reader what to notice; scenery given human feelings to sound literary; "tomou a decisão" where "decidiu" would do; empty intensifiers ("realmente", "simplesmente", "literalmente") outside dialogue. Also fails if any sentence shape is used twice: read the page openings as a column, and look hardest for naming a character and then explaining what they are like ("A Lila é assim: …"), which is charm once and a machine twice. Quote each instance with the page and the plain replacement. The em dash opening a spoken line is correct and is never a fault; only decorative em dashes inside narration are.',
  },
  {
    id: 'plain',
    title: 'Linguagem simples e clara',
    test: 'Plain and followable on one reading aloud. Ordinary words a child already uses, short sentences with one idea each, events in the order they happened. The reader always knows who is present, where they are and what just happened; only the meaning is withheld. Fails on literary inversion, on a metaphor a child would not use, on a sentence whose subject only becomes clear at the end, on a line that reads as atmosphere rather than as fact, on an identity carried by "ela" or "ele" alone across a page turn, and on any page whose setting or event the reader has to reconstruct. Quote the worst sentence in the book and say plainly how to say the same thing.',
  },
  {
    id: 'dialogue',
    title: 'Alguém fala, e do jeito certo',
    test: 'Roughly a third of the pages carry a spoken line. Every spoken line sits alone on its own line inside the narration, opened with a single em dash and a space ("— Você vem?"), with any attribution following on the same line — a full stop becomes a comma ("— Já estou indo, disse a Lila."), while a question mark or exclamation stays and takes no comma ("— Que foi? perguntou o Rui."), because "?," is wrong in Portuguese. Quotation marks, double dashes, hyphens, "?,", "!,", and speech buried mid-paragraph all fail this. The line breaks must be real newline characters in the narration text.',
  },
  {
    id: 'want',
    structural: true,
    title: 'Alguém quer alguma coisa',
    test: 'Somebody wants something they do not have, it is established in the opening pages, and it is small and concrete. Every page after moves them nearer to it or further from it; the thing that goes wrong threatens it; the ending answers it — met, or exchanged for something better they could not have named at the start. Say what the want is and name the page it is established on. If you cannot finish the sentence "the reader keeps turning because they want to find out whether ___" from this storyboard, this fails, and it fails however well the pages are connected: causality without desire is a clock ticking.',
  },
  {
    id: 'mystery',
    structural: true,
    title: 'Algo para o leitor querer saber',
    test: 'Something is established in the first third that the reader does not understand yet and wants to — and it is answered near the end. Name the page it opens and the page it closes. This is not the same as being unclear: the reader must always know what is happening and wonder only what it will come to. If nothing is withheld, nobody has a reason to turn over.',
  },
  {
    id: 'empathy',
    structural: true,
    title: 'O leitor chega antes',
    test: 'At least once the reader understands something a character has not worked out yet, or wants something for them they have not asked for. Name the page. That gap is where feeling for somebody on a page comes from; without it the reader watches instead of caring.',
  },
  {
    id: 'invented-cast',
    title: 'Ninguém foi inventado',
    test: 'List every person and animal who appears in the thirteen pages and check each against the characters the customer named. REPORT A FAULT ONLY FOR SOMEBODY YOU CAN POINT AT: they are given a name that is not in the cast, or they speak a line, or they appear on more than one page — a grandmother, an aunt, a neighbour, a second parent, an older sibling, a friend, an animal. Say which page and which person. Unnamed scenery is not a fault and never has been: a baker who lifts a cloth, a stranger in a queue, people waiting on a platform, so long as they stay unnamed, never speak and do not come back. This matters because a family reading about a grandmother they do not have is reading a book about somebody else — but it only catches somebody actually on the page, so if every figure in the book is either in the cast or is unnamed scenery, this rule passes.',
  },
  {
    id: 'continuity',
    title: 'As contas fecham',
    test: 'Track every countable and every object across the thirteen pages. FIRST, counts: anything the book counts out loud — mirrors in a bag, items on a list, how many are left — must still add up the last time it is mentioned. Add them yourself, page by page. SECOND, objects: anything given away, put down, wedged somewhere or broken stays where it was put and is not used again without somebody fetching it. THIRD, people and animals: nobody acts in a scene they were not brought into. REPORT A FAULT ONLY WHEN YOU CAN STATE THE CONTRADICTION IN NUMBERS OR IN PLACES — "page 4 counts four mirrors, pages 5 to 7 use five", "the mirror given away on page 9 is back in her hand on page 11". If you cannot write the contradiction down that plainly, there is not one, and this rule passes. A page that merely leaves something vague, or that you would have written differently, is not a fault here: vagueness is another rule\'s business and this one is about arithmetic that does not work.',
  },
  {
    id: 'specificity',
    title: 'Detalhe que só esta família teria',
    test: 'Each page carries at least one concrete, surprising, particular detail drawn from what this customer actually said. If the book could be re-titled and given to another family unchanged, this fails.',
  },
  {
    id: 'refrain',
    structural: true,
    title: 'Refrão',
    test: 'One short phrase or gesture returns three or four times, changed a little each time, and pays off on the last page.',
  },
  {
    id: 'turn',
    structural: true,
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
    structural: true,
    title: 'O final aterrissa',
    test: 'The last page closes what the first opened, pays off the refrain changed, steps time forward, and speaks warmly to the person the book was made for. It is a coda, not a summary: it must not retell what happened, state what it all meant, or end on a lesson. A last page that could be deleted without the book changing fails this, and so does one that explains the book.',
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
const READING_RULES: Rule[] = [
  {
    id: 'shape',
    structural: true,
    title: 'A forma da idade acontece',
    test: 'The sixteen spreads carry the shape given for THIS age band, and mark it against that shape only — a three-year-old\'s book is a pattern of three broken once and returning home, a six-year-old\'s is a misunderstanding found out, a nine-year-old\'s is a secret kept and what it cost. None of them is a hero\'s journey, and marking them against one fails books that are right. Name the page each turn happens on. Whatever the age, a book that is sixteen nice moments in a row fails this.',
  },
  {
    id: 'age-craft',
    title: 'Escrito para esta idade',
    test: 'Judge the language against the age this book was ordered for, and judge it on how it is written rather than on how long it is. FOR 3–5: one clause a sentence, present or simple past, concrete nouns a child can point at, and every abstract idea shown as an action instead of named. Repetition is a feature at this age, not a fault. FOR 6–8: two clauses joined by a visible connective are welcome, a subordinate clause now and then, and a word the child may not know is fine when the sentence around it makes it obvious. FOR 9+: full paragraphs, a question left open across a page, irony the reader is trusted to catch, and no explaining of what a scene already showed. Report a fault when a page is written for a different age than the one ordered — a nine-year-old given nursery repetition, a four-year-old given a subordinate clause they have to hold in their head — and name the page and which way it missed. Length is somebody else\'s rule; this one is about the sentences.',
  },
  {
    id: 'picture-alone',
    title: 'A imagem se sustenta sozinha',
    test: 'Each scene description is a complete picture in its own right: a child who cannot read yet could follow the whole book from the left-hand pages alone. And no narration merely describes what its picture already shows — the words alone on their page have to carry what the picture cannot.',
  },
] as const

/**
 * What is additionally true of a twelve-page book, and only of one.
 *
 * The reading book's shape has been marked since it existed. The twelve-page
 * book's shape was only ever *asked for* — written into the prompt and then
 * never checked, which for a model is a suggestion. These are the two rules
 * that turn the spine into something the book has to have passed.
 *
 * Both name page numbers on purpose. "The structure is weak" is not a repair
 * instruction; "page 6 does not close any option that was open on page 5" is.
 */
const TWELVE_PAGE_RULES: Rule[] = [
  {
    id: 'spine',
    structural: true,
    title: 'A espinha das doze páginas',
    test: 'Name the page each of these lands on, in order: the ordinary world with everyone named (1); the routine the book will depart from (2); the habit or the place the reader will miss once it is gone (3); the one thing that changes (4); three consequences, each caused by the page before it rather than merely following it (5, 6, 8); the turn, which re-frames what came before and is NOT a fight or a disaster (7); the small thing that goes wrong, caused by the consequence before it (9); it being put right by one of them doing the thing that is most characteristically them — never luck, never somebody arriving (10); arriving at what the book was walking towards, with the refrain changed (11). If a beat is missing, or landed more than one page from where it belongs, or the turn sits in the last two pages, this fails. Say which page is doing what instead.',
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

type Rule = {
  id: string
  title: string
  test: string
  /**
   * Whether this rule audits the SHAPE of the book rather than its sentences.
   *
   * The distinction only started to matter when stories stopped being
   * invented. A rule asking "could any two pages trade places?" or "does the
   * promised turn happen?" is asking whether the model built a good story —
   * which is the right question for a story it made up five minutes ago, and
   * a wasted one for a story whose page order is fixed in this repository.
   * The answer is yes, by construction, and it was being paid for at US$25
   * per million tokens to be told so.
   */
  structural?: boolean
}

function rulesFor(brief: BookBrief): readonly Rule[] {
  const all =
    brief.finish === 'reading'
      ? [...RULES, ...READING_RULES]
      : [...RULES, ...TWELVE_PAGE_RULES]

  // A pre-written story is marked on its prose only. Its shape was decided
  // before the customer arrived, and the beats it was written to are handed
  // to the writer as the page order — so the structural half of the rubric
  // can only ever come back passing, at the cost of the largest call in the
  // product. Measured on one book: the review emitted more tokens than the
  // book itself and was the biggest single item on the bill.
  return brief.chosenStoryId ? all.filter((r) => !r.structural) : all
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
  // The twelve-page books are held to the band under the drawing; the reading
  // book to the age it was ordered for. Both are counting, so both are counted
  // rather than judged.
  // A RANGE, NOT A RULER.
  //
  // The counts per age are real and worth writing to — a page for a
  // four-year-old and a page for a nine-year-old are different objects, and
  // most of that difference is length. What they are not is a boundary a book
  // fails at. Six pages of a good book were sent back for having 36 and 37
  // words against a 35 ceiling, and the repair cost more than the draft.
  //
  // So the band is guidance, given to the writer, and only a page that has
  // plainly missed the age is a fault here: less than half the floor, or more
  // than double the ceiling. That catches a page written for the wrong child
  // and lets a page that runs two words over be a page that runs two words
  // over.
  const band =
    brief.finish === 'reading' ? getAgeBand(brief.ageBandId).words : null
  if (!band) return []

  const floor = Math.floor(band.min / 2)
  const ceiling = band.max * 2

  const wrong = storyboard.pages
    .map((p) => ({ index: p.index, words: p.narration.trim().split(/\s+/).filter(Boolean).length }))
    .filter((p) => p.words < floor || p.words > ceiling)

  if (wrong.length === 0) return []
  return [
    `Tamanho das páginas: a book for ${getAgeBand(brief.ageBandId).years} sits around ${band.min}–${band.max} words a page. These are not near it — ${wrong
      .map((p) => `page ${p.index} has ${p.words}`)
      .join(', ')}. A page that far out is written for a different child, not merely long: rewrite it at the length this age reads.`,
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
      idea.want ? `WHAT SOMEBODY WANTS, PER THE CHOSEN IDEA: ${idea.want}` : '',
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
