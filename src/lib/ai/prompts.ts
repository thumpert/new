import {
  getArtStyle,
  getBookSize,
  getOccasion,
  getStoryType,
  getTone,
} from '../catalog'
import type { BookBrief, Character, StoryIdea } from '../types'

/**
 * Prompt construction for the writing model.
 *
 * All prompts are written in English — the model is told which language to
 * *write the book in* separately. This keeps one set of prompts working for
 * every locale we add.
 */

const LANGUAGE_NAMES: Record<string, string> = {
  pt: 'Brazilian Portuguese',
  en: 'English',
}

export function languageName(locale: string): string {
  return LANGUAGE_NAMES[locale] ?? 'English'
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
- Vary the angles: origin, habits, relationships, a favourite place, something funny, something tender.
- Never ask anything the customer has already told us.
- Write the questions, hints and placeholders in the requested language.`

export function interviewUser(brief: BookBrief, count: number): string {
  const occasion = getOccasion(brief.occasionId)
  return [
    `Write ${count} interview questions in ${languageName(brief.locale)}.`,
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
- Write everything in the requested language.`

export function ideasUser(brief: BookBrief): string {
  return [
    `Propose four story ideas in ${languageName(brief.locale)}.`,
    '',
    briefContext(brief),
  ].join('\n')
}

export const STORYBOARD_SYSTEM = `You turn a chosen story idea into a page-by-page coloring book.

Each page is one full-page illustration with one or two sentences of narration printed underneath.

For every page you produce two things:

1. "narration" — the text printed on the page, in the requested language, in the narrator's voice. One or two short sentences. It should read aloud well.

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

  return [
    `Write the full ${pageCount}-page storyboard for the chosen story.`,
    `Narration must be in ${languageName(brief.locale)}. Scene descriptions must be in English.`,
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
