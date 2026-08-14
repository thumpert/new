import { getImageProvider, type ImageProvider } from './images'
import { fetchBinary, putFile } from './storage'
import { getOrder, saveOrder, updateOrder } from './store'
import type { Character, Order, PageRender } from './types'

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
      photoUrl: character.photoUrl,
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
  const artStyleId = order.brief.artStyleId

  // A simple worker pool: each worker pulls the next index off a shared cursor.
  let cursor = 0
  const workers = Array.from(
    { length: Math.min(PAGE_CONCURRENCY, pages.length) },
    async () => {
      while (true) {
        const i = cursor++
        if (i >= pages.length) return
        const page = pages[i]

        await patchRender(orderId, page.index, { status: 'generating' })

        const onPage = page.charactersOnPage
          .map((id) => byId.get(id))
          .filter((c): c is Character => Boolean(c))

        try {
          const image = await provider.generatePage({
            index: page.index,
            sceneDescription: page.sceneDescription,
            artStyleId,
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
    },
  )

  await Promise.all(workers)
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
