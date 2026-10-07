import type { Order } from './types'
import type { ArtStyleId } from './types'

/**
 * The one book shown on `/exemplo`, drawn once for real in each style listed
 * here — not a mock-up, the actual pipeline's output, so a visitor flips
 * through the same kind of pages their own book would have.
 *
 * Order ids made by `scripts/make-example-book.mts`. Add a style here only
 * after running that script for it; the example page reads straight off
 * these orders and has nothing to fall back to if one is missing.
 */
export const EXAMPLE_STORY_ID = 'the-thing-under-the-house'

export const EXAMPLE_ORDERS: Partial<Record<ArtStyleId, string>> = {
  'retro-storybook': 'da927012-8961-4b8f-95bd-1b56de9c4d7f',
  'fine-line': '83e9f136-ee5d-4263-8a5b-0325e92be154',
}

/**
 * A black-line picture of the same book, from a third order made only to
 * draw it — see `scripts/make-example-bw-cover.mts`. Its pages were never
 * rendered (a coloring book of this framed story is 24 drawings, not worth it
 * for one home-page picture), so it has character sheets and covers and
 * nothing else: do not point `/exemplo` at it.
 *
 * The cover itself is no use here — "a capa é colorida nos dois" (see
 * README.md), the one part of a coloring book that already comes painted.
 * The line art lives on the character sheet instead, which is what
 * `lineArtUrl` below actually reads off this order.
 */
export const EXAMPLE_BW_COVER_ORDER = '8499922f-30fe-4653-9161-26d269c6e29d'

/** The scene cover chosen for every colour example order. */
export function sceneCoverUrl(order: Order | null): string | undefined {
  return order?.covers?.find((c) => c.kind === 'scene' && c.status === 'done')?.imageUrl
}

/** The hero's model sheet, the one genuinely black-line picture of the three. */
export function lineArtUrl(order: Order | null): string | undefined {
  return order?.brief.characters.find((c) => c.referenceSheetUrl)?.referenceSheetUrl
}
