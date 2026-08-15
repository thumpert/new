/**
 * Domain types for the personalized coloring book generator.
 *
 * The flow is: brief -> ideas -> chosen idea -> storyboard -> page renders -> PDF.
 */

export type Locale = 'pt' | 'en'

export const LOCALES: Locale[] = ['pt', 'en']
export const DEFAULT_LOCALE: Locale = 'pt'

export type OccasionId =
  | 'child'
  | 'new-baby'
  | 'birthday'
  | 'relationship'
  | 'pet'

export type StoryTypeId =
  | 'adventure'
  | 'everyday-magic'
  | 'fairy-tale'
  | 'journey'
  | 'superhero'
  | 'funny'

export type ToneId = 'warm' | 'playful' | 'poetic' | 'epic' | 'serene'

export type ArtStyleId =
  | 'chibi'
  | 'coloring-book'
  | 'superhero-comic'
  | 'fine-line'
  | 'cartoon'


export type CharacterKind = 'person' | 'pet'

/**
 * The language the *book* is written in — independent of the language the
 * site is shown in. A Brazilian buying a gift for someone learning English
 * browses in Portuguese and orders an English book.
 */
export type BookLanguageId = 'pt' | 'en' | 'en-pt'

/**
 * What the customer actually receives, and the first thing they choose.
 *
 * 'coloring'  — black line art on white, for the child to fill in.
 * 'coloured'  — a finished picture book, printed in colour.
 *
 * It reaches all the way down: it decides whether the model sheets and pages
 * are drawn in line or in colour. The covers ignore it — they are always in
 * colour, in both books.
 */
export type BookFinish = 'coloring' | 'coloured'

export const BOOK_FINISHES: BookFinish[] = ['coloring', 'coloured']

export interface Character {
  id: string
  name: string
  kind: CharacterKind
  /** Free text: "mãe da aniversariante", "melhor amigo", "golden retriever". */
  role?: string
  /** Free text so "6 anos", "recém-nascido" and "3 (em anos de cachorro)" all work. */
  age?: string
  /** Physical + personality traits written by the customer. */
  traits: string
  /**
   * Reference photos uploaded by the customer. More angles give the model a
   * better read on the face; they are used once, to draw the model sheet.
   */
  photoUrls?: string[]
  /**
   * Line-art model sheet generated from the photo. Used as the reference for
   * every page so the character stays consistent across the whole book.
   */
  referenceSheetUrl?: string
}

/**
 * A photograph the customer wants to appear *in* the book.
 *
 * Not to be confused with `Character.photoUrls`, which are reference shots:
 * those teach the model a face, are used once to draw the model sheet, and
 * never become a page. A memory is the opposite — the photograph itself is the
 * page, redrawn in the chosen style with its moment and staging intact.
 */
export interface MemoryPhoto {
  id: string
  /** Stored URL of the uploaded photograph. */
  url: string
  /**
   * How this moment fits the story, in the customer's own words. Goes to the
   * writer, which is what lets the page be part of the plot rather than an
   * insert: "this is the day we brought Zeca home, he hid under the sofa".
   */
  note: string
}

export interface InterviewQuestion {
  id: string
  question: string
  /** Why we are asking — shown as a subtle helper under the question. */
  hint?: string
  placeholder?: string
  /**
   * Theme this question belongs to. Questions sharing a group are shown
   * together on one screen, so the customer answers in one train of thought.
   */
  group: string
  /**
   * Plausible answers the customer can click instead of typing. They are
   * starting points, not the model's guesses about the truth.
   */
  suggestions: string[]
}

export interface InterviewAnswer {
  questionId: string
  question: string
  answer: string
}

export interface BookBrief {
  /** Language the site is being browsed in. */
  locale: Locale
  /** Language the book itself is written in. Chosen explicitly. */
  bookLanguage: BookLanguageId
  /** Line art to colour in, or a finished colour book. The first choice made. */
  finish: BookFinish
  occasionId: OccasionId
  storyTypeId: StoryTypeId
  toneId: ToneId
  artStyleId: ArtStyleId
  /** Title chosen by the customer. May be empty until the review step. */
  title: string
  /** Where the story happens: "a fazenda da vovó em Minas". */
  place: string
  characters: Character[]
  interview: InterviewAnswer[]
  /**
   * Real photographs to weave into the story, at most MAX_MEMORIES. Each one
   * becomes a page whose composition comes from the photo itself.
   */
  memories?: MemoryPhoto[]
  /** Optional dedication printed on the first page. */
  dedication?: string
}

/**
 * Three is enough to mark a beginning, a middle and an end. Past that a short
 * book stops being a story with memories in it and becomes an album.
 */
export const MAX_MEMORIES = 3

export interface StoryIdea {
  id: string
  title: string
  /** One-sentence hook. */
  logline: string
  /** 2-3 sentence summary of the arc. */
  summary: string
  /** Three concrete beats/scenes the book would contain. */
  highlights: string[]
}

export interface StoryPage {
  /** 1-based page number within the illustrated pages. */
  index: number
  /** Narration text printed under the illustration. */
  narration: string
  /**
   * Support line printed smaller under the narration, used by the bilingual
   * book so a learner can check themselves without leaving the page.
   */
  narrationSecondary?: string
  /**
   * Visual description of the scene in English, written to be fed to the
   * image model. Describes action, setting and framing — never art style,
   * which is appended separately from the chosen art style.
   */
  sceneDescription: string
  /** Ids of the characters that appear on this page. */
  charactersOnPage: string[]
  /**
   * Set when this page recreates one of the customer's photographs. The photo
   * then owns the composition and the scene description only says what the
   * page is about.
   */
  memoryId?: string
}

export interface Storyboard {
  title: string
  dedication?: string
  pages: StoryPage[]
}

/**
 * The two ideas of a front cover the customer picks between. They are
 * different propositions, not two attempts at the same picture: a portrait
 * says "this book is about these people", a scene says "this book is a story".
 */
export type CoverKind = 'portrait' | 'scene'

export const COVER_KINDS: CoverKind[] = ['portrait', 'scene']

export interface CoverRender {
  /** 'back' is the closing image, drawn only after a front cover is chosen. */
  kind: CoverKind | 'back'
  status: RenderStatus
  imageUrl?: string
  error?: string
  placeholder?: boolean
  promptPreview?: string
}

export type RenderStatus = 'pending' | 'generating' | 'done' | 'failed'

export interface PageRender {
  index: number
  status: RenderStatus
  imageUrl?: string
  error?: string
  /** Provider-side request id, useful for debugging and for webhooks. */
  requestId?: string
  /** Set when no image was drawn and the PDF should show a placeholder. */
  placeholder?: boolean
  /** The image prompt, surfaced by the mock provider so it can be reviewed. */
  promptPreview?: string
}

export type OrderStatus =
  | 'draft'
  | 'ideas'
  | 'storyboard'
  /** Model sheets and the two cover options are being drawn. */
  | 'covers'
  /** Both covers are up; nothing else is drawn until the customer picks one. */
  | 'choosing-cover'
  | 'rendering'
  | 'ready'
  | 'failed'

export interface Order {
  id: string
  createdAt: string
  updatedAt: string
  status: OrderStatus
  brief: BookBrief
  interviewQuestions?: InterviewQuestion[]
  ideas?: StoryIdea[]
  chosenIdeaId?: string
  storyboard?: Storyboard
  renders?: PageRender[]
  /** The two front-cover options, plus the back cover once it is drawn. */
  covers?: CoverRender[]
  /** Which front cover the customer picked. Nothing else renders until it is set. */
  chosenCoverKind?: CoverKind
  /** Relative path of the generated PDF once the book is ready. */
  pdfPath?: string
  error?: string
}
