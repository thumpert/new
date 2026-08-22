import * as z from 'zod'
import {
  ART_STYLES,
  BOOK_LANGUAGES,
  OCCASIONS,
  STORY_TYPES,
  TONES,
} from './catalog'
import { AGE_BANDS, BOOK_FINISHES, COVER_KINDS, LOCALES, MAX_MEMORIES } from './types'

/** Runtime validation for everything that arrives from the browser. */

const ids = <T extends { id: string }>(defs: readonly T[]) =>
  defs.map((d) => d.id) as [string, ...string[]]

export const characterSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(60),
  kind: z.enum(['person', 'pet']),
  role: z.string().max(120).optional(),
  age: z.string().max(60).optional(),
  appearance: z.string().max(1200).default(''),
  personality: z.string().max(1200).optional(),
  storyNotes: z.string().max(1200).optional(),
  photoUrls: z.array(z.string().max(500)).max(3).optional(),
  referenceSheetUrl: z.string().max(500).optional(),
})

export const memoryPhotoSchema = z.object({
  id: z.string().min(1).max(64),
  url: z.string().min(1).max(500),
  note: z.string().max(600).default(''),
})

export const interviewAnswerSchema = z.object({
  questionId: z.string().max(64),
  question: z.string().max(500),
  answer: z.string().max(2000),
})

export const briefSchema = z.object({
  locale: z.enum(LOCALES as [string, ...string[]]),
  bookLanguage: z.enum(ids(BOOK_LANGUAGES)),
  finish: z.enum(BOOK_FINISHES as [string, ...string[]]),
  // Missing from this list until now, so zod stripped it on the way in and
  // every reading book silently fell back to the middle age band, whatever
  // the customer had chosen. The wizard had been sending it all along.
  ageBandId: z.enum(AGE_BANDS as [string, ...string[]]).optional(),
  occasionId: z.enum(ids(OCCASIONS)),
  storyTypeId: z.enum(ids(STORY_TYPES)),
  toneId: z.enum(ids(TONES)),
  artStyleId: z.enum(ids(ART_STYLES)),
  title: z.string().max(120).default(''),
  place: z.string().max(600).default(''),
  dedication: z.string().max(600).optional(),
  characters: z.array(characterSchema).min(1).max(6),
  memories: z.array(memoryPhotoSchema).max(MAX_MEMORIES).optional(),
  interview: z.array(interviewAnswerSchema).max(20).default([]),
})

/** Partial updates from the wizard as the customer moves between steps. */
export const briefPatchSchema = briefSchema.partial()

export const chooseIdeaSchema = z.object({
  ideaId: z.string().min(1).max(64),
  title: z.string().max(120).optional(),
})

export const chooseCoverSchema = z.object({
  kind: z.enum(COVER_KINDS as [string, ...string[]]),
  // Optional so a client that predates the second take still chooses the
  // first one rather than being rejected.
  variant: z.union([z.literal(1), z.literal(2)]).optional(),
})

export type BriefInput = z.infer<typeof briefSchema>
