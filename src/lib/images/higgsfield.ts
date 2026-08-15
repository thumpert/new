import { createHiggsfieldClient } from '@higgsfield/client/v2'
import { getImageModel } from '../catalog'
import { absoluteUrl } from '../storage'
import type { ImageModelId } from '../types'
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
 * Endpoints and body shapes come from the published OpenAPI spec
 * (docs.higgsfield.ai/docs/openapi.json) and live in the model catalog, so
 * credentials are the only thing that has to be configured:
 *
 *   HIGGSFIELD_CREDENTIALS           "KEY_ID:KEY_SECRET"  (required)
 *   HIGGSFIELD_ENDPOINT_NANO_BANANA  override, if the API ever moves
 *   HIGGSFIELD_ENDPOINT_SOUL         override, same
 *   HIGGSFIELD_ASPECT_RATIO          defaults to 3:4 (fits A4 with margins)
 */

const DEFAULT_ASPECT_RATIO = '3:4'

/** How long we let a single image take before giving up on it. */
const MAX_POLL_MS = 5 * 60 * 1000

/** Credentials are the only thing that has to be configured. */
export function higgsfieldConfigured(): boolean {
  return Boolean(credentials())
}

/** The catalog endpoint, unless an env var overrides it. */
function endpointFor(id: ImageModelId): string {
  const model = getImageModel(id)
  return process.env[model.endpointEnv] ?? model.endpoint
}

function credentials(): string | undefined {
  const single = process.env.HIGGSFIELD_CREDENTIALS ?? process.env.HF_CREDENTIALS
  if (single) return single
  const id = process.env.HIGGSFIELD_API_KEY ?? process.env.HF_API_KEY
  const secret = process.env.HIGGSFIELD_API_SECRET ?? process.env.HF_API_SECRET
  return id && secret ? `${id}:${secret}` : undefined
}

/**
 * Builds the reference-image field for this endpoint. The two published
 * shapes are not interchangeable, and sending the wrong one is a 422.
 */
function referenceInput(
  id: ImageModelId,
  urls: string[],
): Record<string, unknown> {
  const model = getImageModel(id)
  const reachable = urls.slice(0, model.maxReferences).map(absoluteUrl)
  if (reachable.length === 0) return {}

  return model.referenceMode === 'array'
    ? { input_images: reachable.map((url) => ({ type: 'image_url', image_url: url })) }
    : { image_reference_url: reachable[0] }
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
      req.photoUrls.length,
    )
    return this.generate(prompt, req.photoUrls, req.imageModelId)
  }

  async generatePage(req: PageRequest): Promise<GeneratedImage> {
    const prompt = pagePrompt(
      req.sceneDescription,
      req.artStyleId,
      req.characterNames,
      req.referenceUrls.length > 0,
    )
    return this.generate(prompt, req.referenceUrls, req.imageModelId)
  }

  private async generate(
    prompt: string,
    referenceUrls: string[],
    imageModelId: ImageModelId,
  ): Promise<GeneratedImage> {
    const model = getImageModel(imageModelId)

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: process.env.HIGGSFIELD_ASPECT_RATIO ?? DEFAULT_ASPECT_RATIO,
      ...model.extraInput,
      // Higgsfield fetches references over the network, so they have to be
      // URLs it can actually reach — hence absoluteUrl.
      ...referenceInput(imageModelId, referenceUrls),
    }

    const response = await this.client.subscribe(endpointFor(imageModelId), {
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
