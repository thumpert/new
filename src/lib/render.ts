import { getImageProvider, type ImageProvider } from './images'
import { fetchBinary, putFile } from './storage'
import { getOrder, saveOrder, updateOrder } from './store'
import {
  COVER_KINDS,
  type ArtStyleId,
  type BookFinish,
  type Character,
  type CoverKind,
  type CoverRender,
  type MemoryPhoto,
  type Order,
  type PageRender,
  type StoryPage,
} from './types'

/**
 * Turns a storyboard into a rendered book, in two halves separated by a
 * decision the customer makes.
 *
 * First half: draw each character once as a model sheet — line art or in
 * colour, matching the book — then draw both cover options against those
 * sheets. Then stop: nothing else is worth drawing until someone has said
 * which cover this book has.
 *
 * Second half: every page, plus the back cover.
 *
 * The model sheets come first in both halves for the same reason: they are
 * what keeps a character recognisably themselves, on page 30 and on the cover.
 */

/** Pages generated at once. Keeps us well inside provider rate limits. */
const PAGE_CONCURRENCY = 3

/** Draws the sheets and both covers, then waits. */
export function startRender(orderId: string): void {
  void renderCoverStage(orderId).catch(async (err) => {
    await updateOrder(orderId, (order) => ({
      ...order,
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    }))
  })
}

/** Draws the book itself, once a cover has been chosen. */
export function startPageRender(orderId: string): void {
  void renderPageStage(orderId).catch(async (err) => {
    await updateOrder(orderId, (order) => ({
      ...order,
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    }))
  })
}

export async function renderCoverStage(orderId: string): Promise<void> {
  const order = await getOrder(orderId)
  if (!order) throw new Error(`Order ${orderId} not found`)
  if (!order.storyboard) throw new Error(`Order ${orderId} has no storyboard`)

  const provider = getImageProvider()

  await saveOrder({
    ...order,
    status: 'covers',
    error: undefined,
    chosenCoverKind: undefined,
    covers: COVER_KINDS.map((kind) => ({ kind, status: 'pending' as const })),
    // The page slots exist from the start so the progress screen can show the
    // whole shape of the job, not just the part currently running.
    renders: order.storyboard.pages.map((page) => ({
      index: page.index,
      status: 'pending' as const,
    })),
  })

  const characters = await renderCharacterSheets(orderId, provider)
  await Promise.all(
    COVER_KINDS.map((kind) => renderCover(orderId, provider, characters, kind)),
  )

  await updateOrder(orderId, (current) => {
    const usable = (current.covers ?? []).filter((c) => c.status === 'done')
    return usable.length === 0
      ? {
          ...current,
          status: 'failed',
          error: 'Neither cover could be drawn.',
        }
      : { ...current, status: 'choosing-cover' }
  })
}

export async function renderPageStage(orderId: string): Promise<void> {
  const order = await getOrder(orderId)
  if (!order) throw new Error(`Order ${orderId} not found`)
  if (!order.storyboard) throw new Error(`Order ${orderId} has no storyboard`)
  if (!order.chosenCoverKind) throw new Error('No cover has been chosen yet.')

  const provider = getImageProvider()
  await updateOrder(orderId, (current) => ({
    ...current,
    status: 'rendering',
    error: undefined,
  }))

  const characters = order.brief.characters
  // The back cover rides along with the pages: it needs the same sheets and
  // nothing about it depends on how the pages turn out.
  await Promise.all([
    renderPages(orderId, provider, characters),
    renderCover(orderId, provider, characters, 'back'),
  ])
  await settleStatus(orderId)
}

/** Records the choice and starts the second half. */
export async function chooseCover(
  orderId: string,
  kind: CoverKind,
): Promise<void> {
  const order = await getOrder(orderId)
  if (!order) throw new Error(`Order ${orderId} not found`)

  const cover = (order.covers ?? []).find((c) => c.kind === kind)
  if (!cover) throw new Error(`This book has no ${kind} cover.`)
  if (cover.status !== 'done') {
    throw new Error(`The ${kind} cover was not drawn, so it cannot be chosen.`)
  }

  await updateOrder(orderId, (current) => ({
    ...current,
    chosenCoverKind: kind,
    // A rebuild has to pick the new cover up.
    pdfPath: undefined,
  }))

  startPageRender(orderId)
}

/**
 * Draws one cover. The front covers run before any page exists; the back cover
 * runs alongside them, so both read the cast from the brief rather than from
 * anything the page loop produces.
 */
async function renderCover(
  orderId: string,
  provider: ImageProvider,
  characters: Character[],
  kind: CoverKind | 'back',
): Promise<void> {
  await patchCover(orderId, kind, { status: 'generating', error: undefined })

  const order = await getOrder(orderId)
  if (!order?.storyboard) throw new Error(`Order ${orderId} lost its storyboard`)

  // A beat from the middle of the book: the opening page is usually setup and
  // the last one gives the ending away.
  const pages = order.storyboard.pages
  const moment = pages[Math.floor(pages.length / 2)]?.sceneDescription ?? ''

  try {
    const image = await provider.generateCover({
      kind,
      artStyleId: order.brief.artStyleId,
      finish: order.brief.finish,
      characters,
      place: order.brief.place,
      moment,
      referenceUrls: characters
        .map((c) => c.referenceSheetUrl)
        .filter((u): u is string => Boolean(u)),
    })

    await patchCover(orderId, kind, {
      status: 'done',
      imageUrl: image.placeholder ? undefined : await store(image.url),
      placeholder: image.placeholder,
      promptPreview: image.promptPreview,
    })
  } catch (err) {
    await patchCover(orderId, kind, {
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

async function patchCover(
  orderId: string,
  kind: CoverKind | 'back',
  patch: Partial<CoverRender>,
): Promise<Order | null> {
  return updateOrder(orderId, (current) => {
    const covers = current.covers ?? []
    const existing = covers.find((c) => c.kind === kind)
    return {
      ...current,
      covers: existing
        ? covers.map((c) => (c.kind === kind ? { ...c, ...patch } : c))
        : [...covers, { kind, status: 'pending' as const, ...patch }],
    }
  })
}

/** Marks the book ready, or failed if any page did not come back. */
async function settleStatus(orderId: string): Promise<void> {
  await updateOrder(orderId, (current) => {
    const failed = (current.renders ?? []).filter((r) => r.status === 'failed')
    return {
      ...current,
      status: failed.length > 0 ? 'failed' : 'ready',
      error:
        failed.length > 0
          ? `${failed.length} page(s) failed to render.`
          : undefined,
    }
  })
}

async function renderCharacterSheets(
  orderId: string,
  provider: ImageProvider,
): Promise<Character[]> {
  const order = await getOrder(orderId)
  if (!order) throw new Error(`Order ${orderId} disappeared mid-render`)

  const sheets: Character[] = []
  for (const character of order.brief.characters) {
    const image = await provider.generateCharacterSheet({
      character,
      artStyleId: order.brief.artStyleId,
      finish: order.brief.finish,
      photoUrls: character.photoUrls ?? [],
    })
    sheets.push({
      ...character,
      referenceSheetUrl: image.placeholder ? undefined : await store(image.url),
    })
  }

  await updateOrder(orderId, (current) => ({
    ...current,
    brief: { ...current.brief, characters: sheets },
  }))

  return sheets
}

async function renderPages(
  orderId: string,
  provider: ImageProvider,
  characters: Character[],
): Promise<void> {
  const order = await getOrder(orderId)
  if (!order?.storyboard) throw new Error(`Order ${orderId} lost its storyboard`)

  const byId = new Map(characters.map((c) => [c.id, c]))
  const pages = order.storyboard.pages
  const { artStyleId, finish, memories } = order.brief

  // A simple worker pool: each worker pulls the next index off a shared cursor.
  let cursor = 0
  const workers = Array.from(
    { length: Math.min(PAGE_CONCURRENCY, pages.length) },
    async () => {
      while (true) {
        const i = cursor++
        if (i >= pages.length) return
        await renderOnePage(
          orderId,
          pages[i],
          byId,
          provider,
          artStyleId,
          finish,
          memories,
        )
      }
    },
  )

  await Promise.all(workers)
}

/**
 * Draws one page against the already-generated character sheets.
 *
 * This is the whole reason the two-stage design pays off: redrawing a page
 * reuses the same sheets, so the characters come back identical and only the
 * scene changes.
 */
async function renderOnePage(
  orderId: string,
  page: StoryPage,
  byId: Map<string, Character>,
  provider: ImageProvider,
  artStyleId: ArtStyleId,
  finish: BookFinish,
  memories: MemoryPhoto[] | undefined,
): Promise<void> {
  await patchRender(orderId, page.index, {
    status: 'generating',
    error: undefined,
  })

  const onPage = page.charactersOnPage
    .map((id) => byId.get(id))
    .filter((c): c is Character => Boolean(c))

  // A page can name a photograph that has since been removed from the brief;
  // it then falls back to an ordinary illustrated page rather than failing.
  const memory = page.memoryId
    ? (memories ?? []).find((m) => m.id === page.memoryId)
    : undefined

  try {
    const image = await provider.generatePage({
      index: page.index,
      sceneDescription: page.sceneDescription,
      artStyleId,
      finish,
      memoryPhotoUrl: memory?.url,
      memoryNote: memory?.note,
      characters: onPage,
      referenceUrls: onPage
        .map((c) => c.referenceSheetUrl)
        .filter((u): u is string => Boolean(u)),
    })

    await patchRender(orderId, page.index, {
      status: 'done',
      imageUrl: image.placeholder ? undefined : await store(image.url),
      requestId: image.requestId,
      placeholder: image.placeholder,
      promptPreview: image.promptPreview,
    })
  } catch (err) {
    await patchRender(orderId, page.index, {
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

/**
 * Redraws a single page, keeping every character exactly as they already are.
 * Runs in the background; the caller polls the order for the new status.
 */
export async function regeneratePage(
  orderId: string,
  index: number,
): Promise<void> {
  const order = await getOrder(orderId)
  if (!order?.storyboard) throw new Error('This book has no storyboard yet.')

  const page = order.storyboard.pages.find((p) => p.index === index)
  if (!page) throw new Error(`This book has no page ${index}.`)

  const byId = new Map(order.brief.characters.map((c) => [c.id, c]))

  await updateOrder(orderId, (current) => ({ ...current, status: 'rendering' }))
  await renderOnePage(
    orderId,
    page,
    byId,
    getImageProvider(),
    order.brief.artStyleId,
    order.brief.finish,
    order.brief.memories,
  )
  await settleStatus(orderId)
}

/**
 * Copies a provider-hosted image into our own storage. Provider URLs expire;
 * the PDF may be rebuilt weeks later, so we keep our own copy.
 */
async function store(url: string): Promise<string> {
  const data = await fetchBinary(url)
  const contentType = url.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg'
  const { url: stored } = await putFile(data, contentType)
  return stored
}

async function patchRender(
  orderId: string,
  index: number,
  patch: Partial<PageRender>,
): Promise<Order | null> {
  return updateOrder(orderId, (current) => ({
    ...current,
    renders: (current.renders ?? []).map((r) =>
      r.index === index ? { ...r, ...patch } : r,
    ),
  }))
}
