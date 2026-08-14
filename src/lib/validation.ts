import * as z from 'zod'
import {
  ART_STYLES,
  BOOK_LANGUAGES,
  BOOK_SIZES,
  OCCASIONS,
  STORY_TYPES,
  TONES,
} from './catalog'
import { LOCALES } from './types'

/** Runtime validation for everything that arrives from the browser. */

const ids = <T extends { id: string }>(defs: readonly T[]) =>
  defs.map((d) => d.id) as [string, ...string[]]

export const characterSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(60),
  kind: z.enum(['person', 'pet']),
  role: z.string().max(120).optional(),
  age: z.string().max(60).optional(),
  traits: z.string().max(1200).default(''),
  photoUrls: z.array(z.string().max(500)).max(3).optional(),
  referenceSheetUrl: z.string().max(500).optional(),
})

export const interviewAnswerSchema = z.object({
  questionId: z.string().max(64),
  question: z.string().max(500),
  answer: z.string().max(2000),
})

export const briefSchema = z.object({
  locale: z.enum(LOCALES as [string, ...string[]]),
  bookLanguage: z.enum(ids(BOOK_LANGUAGES)),
  occasionId: z.enum(ids(OCCASIONS)),
  storyTypeId: z.enum(ids(STORY_TYPES)),
  toneId: z.enum(ids(TONES)),
  artStyleId: z.enum(ids(ART_STYLES)),
  sizeId: z.enum(ids(BOOK_SIZES)),
  title: z.string().max(120).default(''),
  place: z.string().max(600).default(''),
  dedication: z.string().max(600).optional(),
  characters: z.array(characterSchema).min(1).max(6),
  interview: z.array(interviewAnswerSchema).max(20).default([]),
})

/** Partial updates from the wizard as the customer moves between steps. */
export const briefPatchSchema = briefSchema.partial()

export const chooseIdeaSchema = z.object({
  ideaId: z.string().min(1).max(64),
  title: z.string().max(120).optional(),
})

export type BriefInput = z.infer<typeof briefSchema>
