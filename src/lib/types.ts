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

export type ToneId = 'warm' | 'playful' | 'poetic' | 'epic'

export type ArtStyleId =
  | 'chibi'
  | 'coloring-book'
  | 'superhero-comic'
  | 'fine-line'
  | 'cartoon'

export type BookSizeId = 'short' | 'medium' | 'long'

export type CharacterKind = 'person' | 'pet'

/**
 * The language the *book* is written in — independent of the language the
 * site is shown in. A Brazilian buying a gift for someone learning English
 * browses in Portuguese and orders an English book.
 */
export type BookLanguageId = 'pt' | 'en' | 'en-pt'

/**
 * Which image model draws the pages. Exposed while we are still comparing
 * them — the two differ in speed by roughly 3x, which a customer waiting on
 * a 32-page book does feel.
 */
export type ImageModelId = 'nano-banana' | 'soul'

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
  /** Image model used to draw every page. */
  imageModelId: ImageModelId
  occasionId: OccasionId
  storyTypeId: StoryTypeId
  toneId: ToneId
  artStyleId: ArtStyleId
  /** Title chosen by the customer. May be empty until the review step. */
  title: string
  sizeId: BookSizeId
  /** Where the story happens: "a fazenda da vovó em Minas". */
  place: string
  characters: Character[]
  interview: InterviewAnswer[]
  /** Optional dedication printed on the first page. */
  dedication?: string
}

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
}

export interface Storyboard {
  title: string
  dedication?: string
  pages: StoryPage[]
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
  /** Relative path of the generated PDF once the book is ready. */
  pdfPath?: string
  error?: string
}
