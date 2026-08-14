import { createHiggsfieldClient } from '@higgsfield/client/v2'
import { absoluteUrl } from '../storage'
import { characterSheetPrompt, pagePrompt } from './prompt'
import type {
  CharacterSheetRequest,
  GeneratedImage,
  ImageProvider,
  PageRequest,
} from './types'

/**
 * Higgsfield image provider.
 *
 * Higgsfield exposes many image models behind one generic endpoint-plus-input
 * API, and the exact endpoint string and reference-image field differ per
 * model. Rather than hard-code a guess, both are configuration:
 *
 *   HIGGSFIELD_CREDENTIALS      "KEY_ID:KEY_SECRET"
 *   HIGGSFIELD_IMAGE_ENDPOINT   e.g. "flux-pro/kontext/max/text-to-image"
 *   HIGGSFIELD_ASPECT_RATIO     defaults to 3:4 (fits A4 with margins)
 *   HIGGSFIELD_REFERENCE_FIELD  defaults to input_images
 *
 * See docs.higgsfield.ai for the endpoint that matches the model you want.
 */

const DEFAULT_ASPECT_RATIO = '3:4'
const DEFAULT_REFERENCE_FIELD = 'input_images'

/** How long we let a single image take before giving up on it. */
const MAX_POLL_MS = 5 * 60 * 1000

export function higgsfieldConfigured(): boolean {
  return Boolean(credentials() && process.env.HIGGSFIELD_IMAGE_ENDPOINT)
}

function credentials(): string | undefined {
  const single = process.env.HIGGSFIELD_CREDENTIALS ?? process.env.HF_CREDENTIALS
  if (single) return single
  const id = process.env.HIGGSFIELD_API_KEY ?? process.env.HF_API_KEY
  const secret = process.env.HIGGSFIELD_API_SECRET ?? process.env.HF_API_SECRET
  return id && secret ? `${id}:${secret}` : undefined
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `${name} is not set. The Higgsfield provider needs HIGGSFIELD_CREDENTIALS and HIGGSFIELD_IMAGE_ENDPOINT — see .env.example.`,
    )
  }
  return value
}

export class HiggsfieldProvider implements ImageProvider {
  readonly name = 'higgsfield'

  private client = createHiggsfieldClient({
    credentials: credentials(),
    maxPollTime: MAX_POLL_MS,
  })

  async generateCharacterSheet(
    req: CharacterSheetRequest,
  ): Promise<GeneratedImage> {
    const prompt = characterSheetPrompt(
      req.character,
      req.artStyleId,
      Boolean(req.photoUrl),
    )
    return this.generate(prompt, req.photoUrl ? [req.photoUrl] : [])
  }

  async generatePage(req: PageRequest): Promise<GeneratedImage> {
    const prompt = pagePrompt(
      req.sceneDescription,
      req.artStyleId,
      req.characterNames,
      req.referenceUrls.length > 0,
    )
    return this.generate(prompt, req.referenceUrls)
  }

  private async generate(
    prompt: string,
    referenceUrls: string[],
  ): Promise<GeneratedImage> {
    const endpoint = requireEnv('HIGGSFIELD_IMAGE_ENDPOINT')
    const referenceField =
      process.env.HIGGSFIELD_REFERENCE_FIELD ?? DEFAULT_REFERENCE_FIELD

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: process.env.HIGGSFIELD_ASPECT_RATIO ?? DEFAULT_ASPECT_RATIO,
    }

    if (referenceUrls.length > 0) {
      // Higgsfield fetches reference images over the network, so they have to
      // be absolute URLs it can actually reach.
      input[referenceField] = referenceUrls.map((url) => ({
        type: 'image_url',
        image_url: absoluteUrl(url),
      }))
    }

    const response = await this.client.subscribe(endpoint, {
      input,
      withPolling: true,
    })

    if (response.status !== 'completed') {
      throw new Error(
        `Higgsfield returned status "${response.status}" for request ${response.request_id}.`,
      )
    }

    const url = response.images?.[0]?.url
    if (!url) {
      throw new Error(
        `Higgsfield completed request ${response.request_id} without returning an image.`,
      )
    }

    return { url, requestId: response.request_id }
  }
}
