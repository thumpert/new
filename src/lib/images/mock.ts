import {
  backCoverPrompt,
  characterSheetPrompt,
  coverPrompt,
  memoryPagePrompt,
  pagePrompt,
} from './prompt'
import type {
  CharacterSheetRequest,
  CoverRequest,
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
        req.photoUrls.length,
        req.finish,
      ),
    }
  }

  async generatePage(req: PageRequest): Promise<GeneratedImage> {
    await delay()
    return {
      url: `mock:page/${req.index}`,
      placeholder: true,
      promptPreview: req.memoryPhotoUrl
        ? memoryPagePrompt(
            req.memoryNote ?? '',
            req.sceneDescription,
            req.artStyleId,
            req.characters,
            req.finish,
          )
        : pagePrompt(
            req.sceneDescription,
            req.artStyleId,
            req.characters,
            req.referenceUrls.length > 0,
            req.finish,
          ),
    }
  }

  async generateCover(req: CoverRequest): Promise<GeneratedImage> {
    await delay()
    return {
      url: `mock:cover/${req.kind}`,
      placeholder: true,
      promptPreview:
        req.kind === 'back'
          ? backCoverPrompt({
              artStyleId: req.artStyleId,
              characters: req.characters,
              place: req.place,
              finish: req.finish,
            })
          : coverPrompt(req.kind, {
              artStyleId: req.artStyleId,
              characters: req.characters,
              place: req.place,
              moment: req.moment,
              finish: req.finish,
            }),
    }
  }
}

/** Enough latency that the progress UI actually gets exercised. */
function delay() {
  return new Promise((resolve) => setTimeout(resolve, 250))
}
