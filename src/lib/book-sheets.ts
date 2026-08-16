import type { Order } from './types'

/**
 * The order, laid out as the sheets a reader turns.
 *
 * The same sequence the printed book has — chosen cover, dedication, twelve
 * pages, back cover — assembled once, here, rather than twice: the PDF and
 * the on-screen reader are two renderings of one book, and a reader that put
 * the dedication somewhere else would quietly be a different object from the
 * thing that arrives in the post.
 *
 * Anything that failed to draw is dropped rather than shown as a gap. A
 * missing page is a real problem, but it belongs on the progress screen with
 * a redraw button next to it — not in the middle of somebody's present.
 */

export interface BookSheet {
  kind: 'cover' | 'dedication' | 'page' | 'back'
  imageUrl?: string
  /** Words printed on the art, as in the book. */
  narration?: string
  /** The support language, when the book has one. */
  narrationSecondary?: string
  /** Printed at the foot, on story pages only. */
  number?: number
  /**
   * Art held inside a margin with the words beneath it, rather than bled to
   * the edge with the words across its lower band. Two things land here, for
   * the same two reasons the printed book has:
   *
   * A coloring page, because its background is the paper's own white, so a
   * margin costs nothing to look at and gives the printer somewhere to trim.
   *
   * A page redrawn from the customer's photograph, because its composition
   * was fixed by whoever took it — a selfie has no spare sky at the bottom —
   * and words printed onto it land on faces and dark ground.
   */
  mounted?: boolean
}

export function bookSheets(order: Order): BookSheet[] {
  const sheets: BookSheet[] = []
  const covers = order.covers ?? []
  // The same rule the PDF applies: only a colour page bleeds to the edge.
  const bleed = order.brief.finish === 'coloured'

  const front = covers.find(
    (c) => c.kind === order.chosenCoverKind && c.status === 'done' && c.imageUrl,
  )
  if (front) sheets.push({ kind: 'cover', imageUrl: front.imageUrl })

  const dedication = order.storyboard?.dedication?.trim()
  if (dedication) sheets.push({ kind: 'dedication', narration: dedication })

  const renders = new Map((order.renders ?? []).map((r) => [r.index, r]))
  for (const page of order.storyboard?.pages ?? []) {
    const render = renders.get(page.index)
    if (!render || render.status !== 'done' || !render.imageUrl) continue
    sheets.push({
      kind: 'page',
      imageUrl: render.imageUrl,
      narration: page.narration,
      narrationSecondary: page.narrationSecondary,
      number: page.index,
      mounted: Boolean(page.memoryId) || !bleed,
    })
  }

  const back = covers.find(
    (c) => c.kind === 'back' && c.status === 'done' && c.imageUrl,
  )
  if (back) sheets.push({ kind: 'back', imageUrl: back.imageUrl })

  return sheets
}
