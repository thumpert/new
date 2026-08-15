import { fetchBinary, putFile } from '../storage'
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
 * Google's Gemini image models — the same family resold elsewhere as "Nano
 * Banana", straight from the source.
 *
 * Two properties shape everything below: reference images travel as bytes
 * inside the request, so nothing we store needs to be reachable from the
 * public internet, and a generation is one synchronous call, so there is no
 * job to poll and no request id to track between calls.
 *
 *   GEMINI_API_KEY / GOOGLE_API_KEY  the credential (required)
 *   GEMINI_IMAGE_MODEL              override the model id
 *   GEMINI_ASPECT_RATIO             defaults to 3:4 (fits A4 with margins)
 *   GEMINI_IMAGE_SIZE               1K | 2K | 4K, defaults to 2K
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions'

const DEFAULT_MODEL = 'gemini-3.1-flash-image'
const DEFAULT_ASPECT_RATIO = '3:4'
const DEFAULT_IMAGE_SIZE = '2K'

/**
 * gemini-3.1-flash-image accepts up to 14 reference images. The app never
 * approaches that — three characters is the ceiling — but the slice keeps a
 * malformed order from turning into a 400.
 */
const MAX_REFERENCES = 14

function apiKey(): string | undefined {
  // Google's own precedence: GOOGLE_API_KEY wins when both are set.
  return process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY
}

export function googleConfigured(): boolean {
  return Boolean(apiKey())
}

interface ImageBlock {
  type?: string
  mime_type?: string
  data?: string
}

interface InteractionStep {
  type?: string
  content?: ImageBlock[]
}

/** Walks the interaction response for the first image block it can find. */
function firstImage(body: unknown): ImageBlock | undefined {
  const steps = (body as { steps?: InteractionStep[] })?.steps
  if (!Array.isArray(steps)) return undefined

  for (const step of steps) {
    for (const block of step.content ?? []) {
      if (block?.type === 'image' && block.data) return block
    }
  }
  return undefined
}

export class GoogleProvider implements ImageProvider {
  readonly name = 'google'

  async generateCharacterSheet(
    req: CharacterSheetRequest,
  ): Promise<GeneratedImage> {
    const prompt = characterSheetPrompt(
      req.character,
      req.artStyleId,
      req.photoUrls.length,
      req.finish,
    )
    return this.generate(prompt, req.photoUrls)
  }

  async generatePage(req: PageRequest): Promise<GeneratedImage> {
    if (req.memoryPhotoUrl) {
      const prompt = memoryPagePrompt(
        req.memoryNote ?? '',
        req.sceneDescription,
        req.artStyleId,
        req.characters,
        req.finish,
      )
      // The photograph goes first: the prompt calls it "the first reference".
      return this.generate(prompt, [req.memoryPhotoUrl, ...req.referenceUrls])
    }

    const prompt = pagePrompt(
      req.sceneDescription,
      req.artStyleId,
      req.characters,
      req.referenceUrls.length > 0,
      req.finish,
      req.device,
    )
    return this.generate(prompt, req.referenceUrls)
  }

  async generateCover(req: CoverRequest): Promise<GeneratedImage> {
    const prompt =
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
          })
    return this.generate(prompt, req.referenceUrls)
  }

  private async generate(
    prompt: string,
    referenceUrls: string[],
  ): Promise<GeneratedImage> {
    const key = apiKey()
    if (!key) throw new Error('GEMINI_API_KEY is not set.')

    // The model never fetches these itself — we read the bytes and send them
    // inline, which is why the stored sheets can stay private.
    const references = await Promise.all(
      referenceUrls.slice(0, MAX_REFERENCES).map(async (url) => {
        const bytes = await fetchBinary(url)
        return {
          type: 'image' as const,
          mime_type: url.endsWith('.jpg') ? 'image/jpeg' : 'image/png',
          data: bytes.toString('base64'),
        }
      }),
    )

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'x-goog-api-key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GEMINI_IMAGE_MODEL ?? DEFAULT_MODEL,
        input: [{ type: 'text', text: prompt }, ...references],
        response_format: {
          type: 'image',
          // No mime_type here on purpose. The docs list "image/png" as a valid
          // value, but every image model rejects it with a 400 naming
          // "image/jpeg" as the only supported output (checked Aug 2026 against
          // flash, flash-lite, pro and 2.5-flash).
          //
          // That is fine in practice, though line art is exactly the content
          // JPEG ringing ruins. It does not ruin this one: Google returns a
          // near-lossless JPEG (quantization tables all 1s, ~1.5 MB at
          // 1792x2400), and the band 2-6px around every outline measures
          // 0.000% non-white — no ringing at all. Re-measure if that file size
          // ever drops sharply; that would be the signal they started
          // compressing, and the halo would arrive with it.
          aspect_ratio: process.env.GEMINI_ASPECT_RATIO ?? DEFAULT_ASPECT_RATIO,
          image_size: process.env.GEMINI_IMAGE_SIZE ?? DEFAULT_IMAGE_SIZE,
        },
      }),
    })

    if (!res.ok) {
      // The body carries Google's own reason (bad key, quota, blocked prompt),
      // which is far more useful than the status alone.
      const detail = await res.text().catch(() => '')
      throw new Error(
        `Gemini returned ${res.status} ${res.statusText}. ${detail.slice(0, 500)}`,
      )
    }

    const body = await res.json()
    const image = firstImage(body)
    if (!image?.data) {
      throw new Error('Gemini completed the request without returning an image.')
    }

    const { url } = await putFile(
      Buffer.from(image.data, 'base64'),
      image.mime_type ?? 'image/png',
    )

    return { url, requestId: (body as { id?: string })?.id }
  }
}
