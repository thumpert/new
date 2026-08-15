import { GoogleProvider, googleConfigured } from './google'
import { MockProvider } from './mock'
import type { ImageProvider } from './types'

export * from './types'
export { googleConfigured }

/**
 * Picks the provider from the environment. Set IMAGE_PROVIDER=mock to force
 * the placeholder pipeline even when a key is present — it is how the story
 * and the PDF layout get iterated on without spending anything.
 */
export function getImageProvider(): ImageProvider {
  if (process.env.IMAGE_PROVIDER === 'mock') return new MockProvider()
  return googleConfigured() ? new GoogleProvider() : new MockProvider()
}
