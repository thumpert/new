import {
  getArtStyle,
  getBookLanguage,
  getBookSize,
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

function describeCharacter(c: Character): string {
  const parts = [`${c.name} (${c.kind === 'pet' ? 'a pet' : 'a person'}`]
  if (c.age) parts.push(`, age: ${c.age}`)
  if (c.role) parts.push(`, role: ${c.role}`)
  parts.push(')')
  return `${parts.join('')}: ${c.traits}`
}

/** The shared block of facts every call needs. */
export function briefContext(brief: BookBrief): string {
  const occasion = getOccasion(brief.occasionId)
  const storyType = getStoryType(brief.storyTypeId)
  const tone = getTone(brief.toneId)
  const size = getBookSize(brief.sizeId)

  const lines = [
    `OCCASION: ${occasion.storyAngle}`,
    `STORY SHAPE: ${storyType.prompt}`,
    `NARRATOR TONE: ${tone.prompt}`,
    `SETTING: ${brief.place || 'not specified — invent something that fits the characters'}`,
    `BOOK LENGTH: ${size.pages} illustrated pages`,
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

Rules:
- Each idea must use the customer's real details. If they mentioned a one-eared cat named Biscoito, Biscoito is in the story.
- The four ideas must differ in structure, not just in wording: a quest, a day-in-the-life, a fantastical transformation, a look back through time — pick four distinct shapes.
- Every idea must be drawable: things that happen in places, with characters doing things. Avoid inner monologue and abstraction.
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

Rules:
- The story must have a real arc: a beginning that sets things up, a middle with a complication, and an ending that lands.
- Vary the framing across pages. Do not open every page with a wide shot.
- Keep two to four characters per page at most; crowds do not colour well.
- Use the customer's real details throughout.
- The last page should feel like a gift — warm, and about the person receiving the book.`

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
  ].join('\n')
}
