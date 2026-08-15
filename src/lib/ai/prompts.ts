import {
  getArtStyle,
  getBookLanguage,
  BOOK_PAGES,
  getOccasion,
  getStoryType,
  getTone,
} from '../catalog'
import type { BookBrief, Character, StoryIdea } from '../types'

/**
 * Prompt construction for the writing model.
 *
 * All prompts are written in English; which language to *write in* is stated
 * per call. Two different languages are in play and mixing them up is the
 * easy mistake here:
 *
 *   - the site locale, which the buyer reads (questions, ideas)
 *   - the book language, which the recipient reads (narration)
 *
 * A Brazilian buying a gift for someone learning English gets Portuguese
 * questions and an English book.
 */

const LANGUAGE_NAMES: Record<string, string> = {
  pt: 'Brazilian Portuguese',
  en: 'English',
}

/** The language the buyer reads the site in. */
export function uiLanguage(brief: BookBrief): string {
  return LANGUAGE_NAMES[brief.locale] ?? 'English'
}

/**
 * The writer's view of a character.
 *
 * Deliberately leaves out what they look like. Appearance is the
 * illustrator's business, and putting hair and glasses in front of the writer
 * only invites narration that describes a face the reader can already see.
 */
function describeCharacter(c: Character): string {
  const parts = [`${c.name} (${c.kind === 'pet' ? 'a pet' : 'a person'}`]
  if (c.age) parts.push(`, age: ${c.age}`)
  if (c.role) parts.push(`, role: ${c.role}`)
  parts.push(')')

  const lines = [`${parts.join('')}`]
  if (c.personality?.trim()) lines.push(`  how they are: ${c.personality.trim()}`)
  if (c.storyNotes?.trim()) {
    lines.push(`  must appear in the book: ${c.storyNotes.trim()}`)
  }
  return lines.join('\n')
}

/** The shared block of facts every call needs. */
export function briefContext(brief: BookBrief): string {
  const occasion = getOccasion(brief.occasionId)
  const storyType = getStoryType(brief.storyTypeId)
  const tone = getTone(brief.toneId)

  const lines = [
    `OCCASION: ${occasion.storyAngle}`,
    `STORY SHAPE: ${storyType.prompt}`,
    `NARRATOR TONE: ${tone.prompt}`,
    `SETTING: ${brief.place || 'not specified — invent something that fits the characters'}`,
    `BOOK LENGTH: ${BOOK_PAGES} illustrated pages`,
    '',
    'CHARACTERS:',
    ...brief.characters.map((c) => `- ${describeCharacter(c)}`),
  ]

  if (brief.interview.length > 0) {
    lines.push(
      '',
      'WHAT THE CUSTOMER TOLD US (use these real details — they are what makes the book personal):',
      ...brief.interview
        .filter((a) => a.answer.trim())
        .map((a) => `- ${a.question}\n  ${a.answer}`),
    )
  }

  const memories = (brief.memories ?? []).filter((m) => m.note.trim())
  if (memories.length > 0) {
    lines.push(
      '',
      'REAL PHOTOGRAPHS THE CUSTOMER WANTS IN THE BOOK:',
      'Each of these is a real moment that already happened, and it will be redrawn as a page from the photograph itself. Treat them as fixed events the story has to pass through.',
      ...memories.map((m) => `- [${m.id}] ${m.note.trim()}`),
    )
  }

  if (brief.title.trim()) {
    lines.push('', `WORKING TITLE: ${brief.title}`)
  }

  return lines.join('\n')
}

export const INTERVIEW_SYSTEM = `You write the interview questions for a personalized coloring book service.

The customer has told us the occasion and who the characters are. Your job is to ask the questions that will make the book feel unmistakably theirs — the small, concrete, specific things a stranger could never guess.

Rules:
- Ask about concrete moments and habits, never abstractions. "What does she do the second she gets home from school?" beats "What is she like?".
- Every question must be answerable in one or two sentences by someone who is not a writer.
- Use the characters' actual names in the questions.
- Each question needs a short hint explaining why we are asking, and a placeholder showing the kind of answer we want.
- Never ask anything the customer has already told us.

Organise the questions into themed groups of two or three. Each group is shown on one screen, so the questions inside it should belong to the same train of thought — one group about how they met, another about everyday habits, another about the funny stuff. Give each group a short title, two or three words. Questions in the same group must carry exactly the same group title.

For every question, also write three suggested answers:
- Each one short, one sentence, in the customer's own register — the way a parent would actually reply, not the way a copywriter would.
- Make them concrete and plausible for these specific characters. If the pet is a one-eared dog called Biscoito, the suggestions mention Biscoito.
- The three must differ from each other in substance, so picking one is a real choice.
- They are starting points the customer will edit, not guesses at the truth. Never phrase them as if you know the answer.

Write the questions, hints, placeholders, group titles and suggestions in the requested language.`

export function interviewUser(brief: BookBrief, count: number): string {
  const occasion = getOccasion(brief.occasionId)
  return [
    `Write ${count} interview questions in ${uiLanguage(brief)}, organised into three or four themed groups.`,
    '',
    `For this occasion, the most fertile ground is: ${occasion.interviewFocus}.`,
    '',
    briefContext(brief),
  ].join('\n')
}

export const IDEAS_SYSTEM = `You are a children's book author who writes personalized coloring books.

You will be given everything a customer told us about the people they love. Propose four genuinely different story ideas built from those details.

Every idea must have a turn: something that changes partway through, so that the second half of the book cannot be swapped with the first. State it in the "turn" field, in one sentence.

This is the hardest rule and the one most often broken. A premise is not a turn. "Streetlamps that light up memories" is a premise, and on its own it produces twelve pages of "the next lamp is…", any two of which could trade places without anything breaking. Give it a turn — the lamps go out and they have to remember without them — and every page after that depends on the one before it. Apply the same test to each idea you propose: if the pages could be shuffled, it is not a story yet.

Rules:
- Each idea must use the customer's real details. If they mentioned a one-eared cat named Biscoito, Biscoito is in the story.
- The four ideas must differ in structure, not just in wording: a quest, a day-in-the-life, a fantastical transformation, a look back through time — pick four distinct shapes. Whichever shape you choose, it still needs its turn; a look back through time is the shape most likely to arrive without one.
- Every idea must be drawable: things that happen in places, with characters doing things. Avoid inner monologue and abstraction.
- When the customer supplied photographs to include, say in the summary where each one falls in this particular story. A photograph that could sit anywhere sits nowhere.
- The title should sound like a real children's book, not a summary.
- Highlights are three concrete scenes, each one sentence, in story order.

Two languages are involved. The buyer is choosing between these four ideas, so the logline, summary and highlights are written in their language. The title is printed on the cover of the book, so it is written in the book's language. When the two differ, that is deliberate — do not "fix" it by translating the title.`

export function ideasUser(brief: BookBrief): string {
  const language = getBookLanguage(brief.bookLanguage)
  return [
    `Propose four story ideas. Write the logline, summary and highlights in ${uiLanguage(brief)}. Write the title in ${language.primary}.`,
    '',
    briefContext(brief),
  ].join('\n')
}

export const TITLES_SYSTEM = `You name children's books.

You will be given the story the customer chose and everything they told us about the people in it. Propose three titles.

Rules:
- Each title must sound like a real children's book someone would pull off a shelf — not a description of the plot, not a summary.
- Use the characters' real names where it helps. A name in the title is half the reason this book is a gift.
- Make the three genuinely different in approach: one plain and warm, one playful, one with a bit of wonder. Three variations of the same title is a wasted choice.
- Keep them short. Six words is already long.
- No subtitles, no colons, no quotation marks.
- Write them in the book's language.`

export function titlesUser(brief: BookBrief, idea: StoryIdea): string {
  const language = getBookLanguage(brief.bookLanguage)
  return [
    `Propose three titles in ${language.primary}.`,
    '',
    'THE CHOSEN STORY:',
    `Working title: ${idea.title}`,
    `Logline: ${idea.logline}`,
    `Summary: ${idea.summary}`,
    '',
    briefContext(brief),
  ].join('\n')
}

export const STORYBOARD_SYSTEM = `You turn a chosen story idea into a page-by-page coloring book.

Each page is one full-page illustration with one or two sentences of narration printed underneath.

For every page you produce two things:

1. "narration" — the text printed on the page, in the requested language, in the narrator's voice. One or two short sentences. It should read aloud well.

   When a second language is requested, also write "narrationSecondary": the same sentence in that language, printed smaller underneath. This book is often a gift for someone learning the first language, so the second line has to be a natural translation a reader can check themselves against — not a word-for-word gloss, and never extra story the first line does not contain.

2. "sceneDescription" — a visual description IN ENGLISH, written for an image generator. Describe only what is visible: who is in frame, what they are doing, where they are, and the framing (wide shot, close-up). Name characters by the exact names given, so the illustrator knows which reference to use. Do NOT mention art style, line weight, black and white, or coloring pages — that is added separately. Do NOT describe emotions the drawing cannot show; show them through posture and expression instead.

3. "memoryId" — normally empty. Set it only on the pages described below.

When the brief lists REAL PHOTOGRAPHS, each one must become exactly one page of the story, and that page carries the photograph's id in "memoryId".

These pages are not inserts. Place each one where the story genuinely arrives at that moment, give it narration in the same voice as every other page, and let the page after it react to what just happened. A reader who does not know which pages came from photographs should not be able to tell.

Their "sceneDescription" works differently: the photograph itself decides the composition, so do not invent framing, poses or a setting for it. Write one plain sentence saying what the moment is and who is in it, and nothing more.

Rules:
- The story must have a real arc: a beginning that sets things up, a middle with a complication, and an ending that lands.
- Vary the framing across pages. Do not open every page with a wide shot.
- Keep two to four characters per page at most; crowds do not colour well.
- Use the customer's real details throughout.
- Every listed photograph gets exactly one page. Never two pages for the same photograph, and never a photograph left out.
- The last page should feel like a gift — warm, and about the person receiving the book.`

/**
 * A second pass over the storyboard, before a single page is drawn.
 *
 * One pass produces pages that are individually fine and collectively a list:
 * each reads well, nothing carries over, and any two could trade places. That
 * is invisible while writing page by page and obvious when the whole thing is
 * laid out, which is exactly what a reviewer gets to see.
 *
 * It returns the whole storyboard rather than notes, because a critique
 * someone has to apply is a critique that does not get applied.
 */
export const REVISE_SYSTEM = `You are the editor of a personalized children's book. A storyboard has been drafted. Your job is to find what is wrong with it as a whole and return a fixed version.

Read all the pages together before changing anything, then work through these checks in order:

1. THE SHUFFLE TEST. Could any two pages swap places without the book breaking? If yes, the book is a list rather than a story. Fix it by making pages depend on each other: something set up earlier pays off later, a state changes and stays changed, someone wants something and is closer or further from it than they were.

2. THE TURN. The chosen idea has a turn — something that changes partway through. Find the page where it happens. If it does not happen anywhere, put it in. If it happens on the last page, move it earlier: a turn on the final page has nothing left to change.

3. CONSEQUENCE. Every page after the turn should read differently because of it. If the second half could have been written without the first, rewrite it.

4. THE PHOTOGRAPHS. Pages that recreate a real photograph must land where the story actually arrives at that moment, with the page before leading into it and the page after reacting. A photograph page that could sit anywhere in the book is in the wrong place. Never move one to the end just to be rid of it.

5. THE CAST. Check that each character does what only that character would do. If two characters could be swapped in a page without it reading strangely, they are not yet people. Use what the customer said about how each of them is.

6. THE LAST PAGE. It should land — closing what the first page opened, and warm towards the person receiving the book.

Rules:
- Keep the same number of pages, the same page order fields, and the same character ids.
- Keep the narration in the language it is already in, and keep the narrator's voice exactly as it is. You are fixing structure, not style.
- Keep every scene description in English.
- Change only what the checks above require. A page that already works should come back untouched.`

export function reviseUser(idea: StoryIdea, storyboard: string): string {
  return [
    'Here is the drafted storyboard. Apply the checks and return the corrected version.',
    '',
    `THE IDEA IT CAME FROM: ${idea.title} — ${idea.logline}`,
    `THE TURN IT PROMISED: ${idea.turn}`,
    '',
    'DRAFT:',
    storyboard,
  ].join('\n')
}

export function storyboardUser(
  brief: BookBrief,
  idea: StoryIdea,
  pageCount: number,
): string {
  const artStyle = getArtStyle(brief.artStyleId)
  const detail =
    artStyle.complexity === 'low'
      ? 'Keep scenes simple: one clear action, minimal background.'
      : artStyle.complexity === 'high'
        ? 'Scenes can carry rich background detail worth colouring.'
        : 'Scenes should have a clear focus with some supporting background.'

  const language = getBookLanguage(brief.bookLanguage)
  const narrationRule = language.secondary
    ? `Narration must be in ${language.primary}, with "narrationSecondary" carrying the same sentence in ${language.secondary}.`
    : `Narration must be in ${language.primary}. Leave "narrationSecondary" empty.`

  return [
    `Write the full ${pageCount}-page storyboard for the chosen story.`,
    `${narrationRule} Scene descriptions must always be in English — they are read by the image model, not by a person.`,
    detail,
    '',
    'CHOSEN STORY:',
    `Title: ${idea.title}`,
    `Logline: ${idea.logline}`,
    `Summary: ${idea.summary}`,
    `Beats: ${idea.highlights.join(' / ')}`,
    '',
    briefContext(brief),
    '',
    `Character ids you must use in "charactersOnPage": ${brief.characters
      .map((c) => `${c.id} = ${c.name}`)
      .join(', ')}`,
    ...((brief.memories ?? []).filter((m) => m.note.trim()).length > 0
      ? [
          `Photograph ids you must use in "memoryId", one page each: ${(brief.memories ?? [])
            .filter((m) => m.note.trim())
            .map((m) => m.id)
            .join(', ')}`,
        ]
      : []),
  ].join('\n')
}
