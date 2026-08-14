import { HiggsfieldProvider, higgsfieldConfigured } from './higgsfield'
import { MockProvider } from './mock'
import type { ImageProvider } from './types'

export * from './types'
export { higgsfieldConfigured }

/**
 * Picks the provider from the environment. Set IMAGE_PROVIDER=mock to force
 * the placeholder pipeline even when Higgsfield credentials are present —
 * useful while iterating on the story and the PDF layout.
 */
export function getImageProvider(): ImageProvider {
  const forced = process.env.IMAGE_PROVIDER

  if (forced === 'mock') return new MockProvider()
  if (forced === 'higgsfield') return new HiggsfieldProvider()

  return higgsfieldConfigured() ? new HiggsfieldProvider() : new MockProvider()
}
