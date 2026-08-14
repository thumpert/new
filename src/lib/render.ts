import { getImageProvider, type ImageProvider } from './images'
import { fetchBinary, putFile } from './storage'
import { getOrder, saveOrder, updateOrder } from './store'
import type {
  ArtStyleId,
  Character,
  ImageModelId,
  Order,
  PageRender,
  StoryPage,
} from './types'

/**
 * Turns a storyboard into rendered pages.
 *
 * Two stages: draw each character once as a line-art model sheet, then draw
 * every page referencing those sheets. Doing it in that order is what keeps a
 * character recognisably themselves across thirty-two pages.
 */

/** Pages generated at once. Keeps us well inside provider rate limits. */
const PAGE_CONCURRENCY = 3

/** Renders in the background and keeps the stored order up to date. */
export function startRender(orderId: string): void {
  void renderOrder(orderId).catch(async (err) => {
    await updateOrder(orderId, (order) => ({
      ...order,
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    }))
  })
}

export async function renderOrder(orderId: string): Promise<void> {
  const order = await getOrder(orderId)
  if (!order) throw new Error(`Order ${orderId} not found`)
  if (!order.storyboard) throw new Error(`Order ${orderId} has no storyboard`)

  const provider = getImageProvider()

  await saveOrder({
    ...order,
    status: 'rendering',
    error: undefined,
    renders: order.storyboard.pages.map((page) => ({
      index: page.index,
      status: 'pending' as const,
    })),
  })

  const characters = await renderCharacterSheets(orderId, provider)
  await renderPages(orderId, provider, characters)
  await settleStatus(orderId)
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
      imageModelId: order.brief.imageModelId,
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
  const { artStyleId, imageModelId } = order.brief

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
          imageModelId,
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
  imageModelId: ImageModelId,
): Promise<void> {
  await patchRender(orderId, page.index, {
    status: 'generating',
    error: undefined,
  })

  const onPage = page.charactersOnPage
    .map((id) => byId.get(id))
    .filter((c): c is Character => Boolean(c))

  try {
    const image = await provider.generatePage({
      index: page.index,
      sceneDescription: page.sceneDescription,
      artStyleId,
      imageModelId,
      characterNames: onPage.map((c) => c.name),
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
    order.brief.imageModelId,
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
