import type { ArtStyleId, Character } from '../types'

export interface CharacterSheetRequest {
  character: Character
  artStyleId: ArtStyleId
  /** Absolute URL of the customer's reference photo, when they uploaded one. */
  photoUrl?: string
}

export interface PageRequest {
  index: number
  /** English visual description of the scene. */
  sceneDescription: string
  artStyleId: ArtStyleId
  /**
   * Absolute URLs of the line-art model sheets for the characters on this
   * page, in the same order as `characterNames`.
   */
  referenceUrls: string[]
  characterNames: string[]
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

export interface ImageProvider {
  readonly name: string
  /**
   * Draws a character once, in line art, so every page can reference the same
   * drawing instead of re-interpreting the photo.
   */
  generateCharacterSheet(req: CharacterSheetRequest): Promise<GeneratedImage>
  generatePage(req: PageRequest): Promise<GeneratedImage>
}
