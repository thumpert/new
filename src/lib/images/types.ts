import type {
  ArtStyleId,
  BookFinish,
  Character,
  CoverKind,
} from '../types'

export interface CharacterSheetRequest {
  character: Character
  artStyleId: ArtStyleId
  /** Line art or colour — the sheet is drawn the same way the pages will be. */
  finish: BookFinish
  /** Reference photos the customer uploaded, if any. */
  photoUrls: string[]
}

export interface PageRequest {
  index: number
  /** English visual description of the scene. */
  sceneDescription: string
  artStyleId: ArtStyleId
  finish: BookFinish
  /**
   * Absolute URLs of the model sheets for the characters on this page, in the
   * same order as `characterNames`. Line art or coloured, matching `finish`.
   */
  referenceUrls: string[]
  /**
   * The characters on this page, in the same order as `referenceUrls`. Carries
   * their written appearance as well as their names: the sheet alone drifts
   * over a dozen pages, and the description is what holds it.
   */
  characters: Character[]
  /**
   * Set when this page redraws one of the customer's photographs. The photo is
   * sent ahead of the model sheets, because the prompt refers to it as the
   * first reference and order is the only thing that makes that unambiguous.
   */
  memoryPhotoUrl?: string
  /** The customer's words about what the photograph is. */
  memoryNote?: string
  /**
   * The guide object that runs through this book. In a coloring book it is
   * drawn as the only coloured thing on the page.
   */
  device?: string
}

export interface GeneratedImage {
  /** URL the image can be fetched from. */
  url: string
  /** Provider-side request id, kept for debugging. */
  requestId?: string
  /**
   * True when the provider did not actually draw anything and the PDF should
   * fall back to a placeholder frame.
   */
  placeholder?: boolean
  /** The prompt that was sent, surfaced by the mock provider for review. */
  promptPreview?: string
}

/**
 * A cover — front or back. Always in colour, in both books.
 *
 * It carries the cast with their written traits because of the coloring book:
 * there the model sheets are line art, so nothing else in the request says
 * what colour anyone's hair or coat is. In a colour book the sheets already
 * answer that and the traits are only a fallback.
 */
export interface CoverRequest {
  /** 'back' is the closing image; the other two are the front-cover options. */
  kind: CoverKind | 'back'
  /** Which of the two takes of that kind. Unused by the back cover. */
  variant?: 1 | 2
  artStyleId: ArtStyleId
  /** Covers are always coloured; this only decides how the sheets are read. */
  finish: BookFinish
  /** The full cast, with traits — the source of the palette. */
  characters: Character[]
  place: string
  /** A representative beat from the storyboard. Unused by the back cover. */
  moment: string
  /** Absolute URLs of the model sheets. */
  referenceUrls: string[]
}

export interface ImageProvider {
  readonly name: string
  /**
   * Draws a character once, in line art, so every page can reference the same
   * drawing instead of re-interpreting the photo.
   */
  generateCharacterSheet(req: CharacterSheetRequest): Promise<GeneratedImage>
  generatePage(req: PageRequest): Promise<GeneratedImage>
  generateCover(req: CoverRequest): Promise<GeneratedImage>
}
