import { characterSheetPrompt, pagePrompt } from './prompt'
import type {
  CharacterSheetRequest,
  GeneratedImage,
  ImageProvider,
  PageRequest,
} from './types'

/**
 * Draws nothing, but exercises the whole pipeline — storyboard, queue,
 * progress screen and PDF — with no credentials and no credits spent.
 *
 * It returns the prompt it *would* have sent, which the PDF prints inside a
 * placeholder frame. That makes prompt problems visible before you pay to
 * render 32 pages.
 */
export class MockProvider implements ImageProvider {
  readonly name = 'mock'

  async generateCharacterSheet(
    req: CharacterSheetRequest,
  ): Promise<GeneratedImage> {
    await delay()
    return {
      url: `mock:character/${req.character.id}`,
      placeholder: true,
      promptPreview: characterSheetPrompt(
        req.character,
        req.artStyleId,
        Boolean(req.photoUrl),
      ),
    }
  }

  async generatePage(req: PageRequest): Promise<GeneratedImage> {
    await delay()
    return {
      url: `mock:page/${req.index}`,
      placeholder: true,
      promptPreview: pagePrompt(
        req.sceneDescription,
        req.artStyleId,
        req.characterNames,
        req.referenceUrls.length > 0,
      ),
    }
  }
}

/** Enough latency that the progress UI actually gets exercised. */
function delay() {
  return new Promise((resolve) => setTimeout(resolve, 250))
}
