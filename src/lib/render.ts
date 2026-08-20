import { checkPage } from "./ai/review";
import { describeError, providerError } from "./errors";
import { getImageProvider, type ImageProvider } from "./images";
import { fetchBinary, putFile } from "./storage";
import { getOrder, saveOrder, updateOrder } from "./store";
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
} from "./types";

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
const PAGE_CONCURRENCY = 3;

/**
 * How many times a page may be drawn before we accept what we have.
 *
 * Three, because a defect that survives two redraws is usually in the scene
 * rather than in the drawing, and redrawing past that spends the customer's
 * money to no end. Most pages never reach the second.
 */
const MAX_PAGE_ATTEMPTS = 3;

/**
 * Retries a drawing that failed for a reason likely to have passed by the
 * time we ask again.
 *
 * Observed in production: one page of twelve died with
 * "Headers Timeout Error (UND_ERR_HEADERS_TIMEOUT)" — Node stops waiting for
 * response headers after five minutes, and image generation occasionally
 * takes longer than that. The other eleven were fine, so this is weather
 * rather than a broken request, and the answer is to ask again.
 */
const NETWORK_ATTEMPTS = 3;

/**
 * Whether a failed drawing is worth asking about again.
 *
 * A rejected prompt or a bad API key fails identically every time, and
 * retrying those only spends the customer's money to arrive at the same error
 * more slowly. A refused rate limit, an overloaded provider, a connection that
 * dropped — those clear on their own.
 *
 * This used to be decided by looking for a three-digit number in the error
 * text, which got it wrong in both directions and is why single pages kept
 * dying on an otherwise finished book:
 *
 *   - `describeError` appends the port, so every TLS failure carried ":443",
 *     matched as a 4xx, and was treated as a final answer — switching off the
 *     network retry precisely where it was written to help.
 *   - A 429 counted as "the server answered", so the one failure this app
 *     actually meets with three pages in flight — Google rate-limiting one of
 *     them — killed that page on the first refusal.
 *
 * So the status is read off the error object now, not out of its prose.
 */
export function worthAskingAgain(err: unknown): boolean {
  const failure = providerError(err);
  if (failure?.retryable !== undefined) return failure.retryable;

  const status = failure?.status;
  // No status at all: the request never got an answer. Weather.
  if (status === undefined) return true;
  return status === 408 || status === 429 || status >= 500;
}

export async function drawingWithRetry<T>(
  what: string,
  run: () => Promise<T>,
): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= NETWORK_ATTEMPTS; attempt++) {
    try {
      return await run();
    } catch (err) {
      last = err;
      if (!worthAskingAgain(err) || attempt === NETWORK_ATTEMPTS) break;
      console.warn(
        `${what}: attempt ${attempt} failed (${describeError(err)}) — asking again`,
      );
      // A moment, in case the far side is briefly unwell — or exactly as long
      // as it asked us to wait, when it bothered to say.
      const wait = providerError(err)?.retryAfterMs ?? 2000 * attempt;
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  throw last;
}

/** Draws the sheets and both covers, then waits. */
export function startRender(orderId: string): void {
  void renderCoverStage(orderId).catch(async (err) => {
    await updateOrder(orderId, (order) => ({
      ...order,
      status: "failed",
      error: describeError(err),
    }));
  });
}

/** Draws the book itself, once a cover has been chosen. */
export function startPageRender(orderId: string): void {
  void renderPageStage(orderId).catch(async (err) => {
    await updateOrder(orderId, (order) => ({
      ...order,
      status: "failed",
      error: describeError(err),
    }));
  });
}

export async function renderCoverStage(orderId: string): Promise<void> {
  const order = await getOrder(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);
  if (!order.storyboard) throw new Error(`Order ${orderId} has no storyboard`);

  const provider = getImageProvider();

  await saveOrder({
    ...order,
    status: "covers",
    error: undefined,
    chosenCoverKind: undefined,
    covers: COVER_KINDS.map((kind) => ({ kind, status: "pending" as const })),
    // The page slots exist from the start so the progress screen can show the
    // whole shape of the job, not just the part currently running.
    renders: order.storyboard.pages.map((page) => ({
      index: page.index,
      status: "pending" as const,
    })),
  });

  const characters = await renderCharacterSheets(orderId, provider);
  await Promise.all(
    COVER_KINDS.map((kind) => renderCover(orderId, provider, characters, kind)),
  );

  await updateOrder(orderId, (current) => {
    const usable = (current.covers ?? []).filter((c) => c.status === "done");
    return usable.length === 0
      ? {
          ...current,
          status: "failed",
          error: "Neither cover could be drawn.",
        }
      : { ...current, status: "choosing-cover" };
  });
}

export async function renderPageStage(orderId: string): Promise<void> {
  const order = await getOrder(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);
  if (!order.storyboard) throw new Error(`Order ${orderId} has no storyboard`);
  if (!order.chosenCoverKind) throw new Error("No cover has been chosen yet.");

  const provider = getImageProvider();
  await updateOrder(orderId, (current) => ({
    ...current,
    status: "rendering",
    error: undefined,
  }));

  const characters = order.brief.characters;
  // The back cover rides along with the pages: it needs the same sheets and
  // nothing about it depends on how the pages turn out.
  await Promise.all([
    renderPages(orderId, provider, characters),
    renderCover(orderId, provider, characters, "back"),
  ]);
  await settleStatus(orderId);
}

/** Records the choice and starts the second half. */
export async function chooseCover(
  orderId: string,
  kind: CoverKind,
): Promise<void> {
  const order = await getOrder(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);

  const cover = (order.covers ?? []).find((c) => c.kind === kind);
  if (!cover) throw new Error(`This book has no ${kind} cover.`);
  if (cover.status !== "done") {
    throw new Error(`The ${kind} cover was not drawn, so it cannot be chosen.`);
  }

  await updateOrder(orderId, (current) => ({
    ...current,
    chosenCoverKind: kind,
    // A rebuild has to pick the new cover up.
    pdfPath: undefined,
  }));

  startPageRender(orderId);
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
  kind: CoverKind | "back",
): Promise<void> {
  await patchCover(orderId, kind, { status: "generating", error: undefined });

  const order = await getOrder(orderId);
  if (!order?.storyboard)
    throw new Error(`Order ${orderId} lost its storyboard`);

  // A beat from the middle of the book: the opening page is usually setup and
  // the last one gives the ending away.
  const pages = order.storyboard.pages;
  const moment = pages[Math.floor(pages.length / 2)]?.sceneDescription ?? "";

  try {
    const image = await drawingWithRetry(`cover ${kind}`, () =>
      provider.generateCover({
        kind,
        artStyleId: order.brief.artStyleId,
        finish: order.brief.finish,
        characters,
        place: order.brief.place,
        moment,
        referenceUrls: characters
          .map((c) => c.referenceSheetUrl)
          .filter((u): u is string => Boolean(u)),
      }),
    );

    await patchCover(orderId, kind, {
      status: "done",
      imageUrl: image.placeholder ? undefined : await store(image.url),
      placeholder: image.placeholder,
      promptPreview: image.promptPreview,
    });
  } catch (err) {
    await patchCover(orderId, kind, {
      status: "failed",
      error: describeError(err),
    });
  }
}

async function patchCover(
  orderId: string,
  kind: CoverKind | "back",
  patch: Partial<CoverRender>,
): Promise<Order | null> {
  return updateOrder(orderId, (current) => {
    const covers = current.covers ?? [];
    const existing = covers.find((c) => c.kind === kind);
    return {
      ...current,
      covers: existing
        ? covers.map((c) => (c.kind === kind ? { ...c, ...patch } : c))
        : [...covers, { kind, status: "pending" as const, ...patch }],
    };
  });
}

/** Marks the book ready, or failed if any page did not come back. */
async function settleStatus(orderId: string): Promise<void> {
  await updateOrder(orderId, (current) => {
    const failed = (current.renders ?? []).filter((r) => r.status === "failed");
    if (failed.length === 0) {
      return { ...current, status: "ready", error: undefined };
    }

    // This used to read "1 page(s) failed to render." — a count, which the
    // customer could already see on the grid, in place of the one thing they
    // could not: why. Each failed page stores its own reason, so carry it up
    // rather than throwing it away and restating the count.
    const pages = failed.map((r) => r.index).join(", ");
    const label = failed.length === 1 ? `Page ${pages}` : `Pages ${pages}`;
    const reason = failed.find((r) => r.error)?.error;

    return {
      ...current,
      status: "failed",
      error: reason
        ? `${label} could not be drawn: ${reason}`
        : `${label} could not be drawn.`,
    };
  });
}

async function renderCharacterSheets(
  orderId: string,
  provider: ImageProvider,
): Promise<Character[]> {
  const order = await getOrder(orderId);
  if (!order) throw new Error(`Order ${orderId} disappeared mid-render`);

  const sheets: Character[] = [];
  for (const character of order.brief.characters) {
    const image = await drawingWithRetry(`sheet ${character.name}`, () =>
      provider.generateCharacterSheet({
        character,
        artStyleId: order.brief.artStyleId,
        finish: order.brief.finish,
        photoUrls: character.photoUrls ?? [],
      }),
    );
    sheets.push({
      ...character,
      referenceSheetUrl: image.placeholder ? undefined : await store(image.url),
    });
  }

  await updateOrder(orderId, (current) => ({
    ...current,
    brief: { ...current.brief, characters: sheets },
  }));

  return sheets;
}

async function renderPages(
  orderId: string,
  provider: ImageProvider,
  characters: Character[],
): Promise<void> {
  const order = await getOrder(orderId);
  if (!order?.storyboard)
    throw new Error(`Order ${orderId} lost its storyboard`);

  const byId = new Map(characters.map((c) => [c.id, c]));
  const pages = order.storyboard.pages;
  const { artStyleId, finish, memories } = order.brief;
  const device = order.storyboard.device;

  // A simple worker pool: each worker pulls the next index off a shared cursor.
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(PAGE_CONCURRENCY, pages.length) },
    async () => {
      while (true) {
        const i = cursor++;
        if (i >= pages.length) return;
        await renderOnePage(
          orderId,
          pages[i],
          byId,
          provider,
          artStyleId,
          finish,
          memories,
          device,
        );
      }
    },
  );

  await Promise.all(workers);
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
  device: string | undefined,
): Promise<void> {
  await patchRender(orderId, page.index, {
    status: "generating",
    error: undefined,
  });

  const onPage = page.charactersOnPage
    .map((id) => byId.get(id))
    .filter((c): c is Character => Boolean(c));

  // A page can name a photograph that has since been removed from the brief;
  // it then falls back to an ordinary illustrated page rather than failing.
  const memory = page.memoryId
    ? (memories ?? []).find((m) => m.id === page.memoryId)
    : undefined;

  const draw = (avoid?: string[]) =>
    drawingWithRetry(`page ${page.index}`, () =>
      provider.generatePage({
        index: page.index,
        // A retry says what went wrong last time, in the scene itself, because
        // that is the part of the prompt the model is actually composing from.
        sceneDescription: avoid?.length
          ? `${page.sceneDescription} The previous attempt at this page had to be discarded because of these faults — do not repeat them: ${avoid.join("; ")}.`
          : page.sceneDescription,
        artStyleId,
        finish,
        // Not passed on a memory page: that page draws only what the photograph
        // contains, and slipping the guide object into it would be exactly the
        // invention the photo rules exist to stop.
        device: memory ? undefined : device,
        memoryPhotoUrl: memory?.url,
        memoryNote: memory?.note,
        characters: onPage,
        referenceUrls: onPage
          .map((c) => c.referenceSheetUrl)
          .filter((u): u is string => Boolean(u)),
      }),
    );

  try {
    // Draw, check, and draw again against what the check found. Up to
    // MAX_PAGE_ATTEMPTS in total, stopping the moment a page comes back
    // clean — which most do on the first try, so the extra attempts cost
    // nothing on a good book and rescue a bad page on a poor one.
    //
    // The best attempt is kept rather than the last: a later roll of the dice
    // can be worse than an earlier one, and the customer should get whichever
    // page had the fewest faults.
    let image = await draw();
    let stored = image.placeholder ? undefined : await store(image.url);
    let problems: string[] = [];

    if (stored) {
      const check = async (url: string) =>
        checkPage(await fetchBinary(url), {
          sceneDescription: page.sceneDescription,
          finish,
          device: memory ? undefined : device,
        }).catch(() => ({ problems: [] as string[] }));

      // Everything from here on is an attempt to improve a page we already
      // have, so nothing in here may lose it. It used to: a redraw that hit a
      // rate limit threw straight out of the page, and the customer was told
      // page 5 failed about a page that had been drawn, stored and checked.
      // Failing to improve a drawing is not the same as failing to draw it.
      try {
        problems = (await check(stored)).problems;

        for (
          let attempt = 2;
          attempt <= MAX_PAGE_ATTEMPTS && problems.length > 0;
          attempt++
        ) {
          const retry = await draw(problems);
          const retryStored = retry.placeholder
            ? undefined
            : await store(retry.url);
          if (!retryStored) break;

          const after = await check(retryStored);
          if (after.problems.length < problems.length) {
            image = retry;
            stored = retryStored;
            problems = after.problems;
          }
        }
      } catch (err) {
        console.warn(
          `page ${page.index}: could not be improved (${describeError(err)}) — keeping the drawing we have`,
        );
      }
    }

    await patchRender(orderId, page.index, {
      status: "done",
      imageUrl: stored,
      requestId: image.requestId,
      placeholder: image.placeholder,
      promptPreview: image.promptPreview,
      // Only what survived every attempt, so the progress screen warns about
      // a page that could not be fixed rather than one that was.
      problems: problems.length > 0 ? problems : undefined,
    });
  } catch (err) {
    await patchRender(orderId, page.index, {
      status: "failed",
      error: describeError(err),
    });
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
  const order = await getOrder(orderId);
  if (!order?.storyboard) throw new Error("This book has no storyboard yet.");

  const page = order.storyboard.pages.find((p) => p.index === index);
  if (!page) throw new Error(`This book has no page ${index}.`);

  const byId = new Map(order.brief.characters.map((c) => [c.id, c]));

  await updateOrder(orderId, (current) => ({
    ...current,
    status: "rendering",
  }));
  await renderOnePage(
    orderId,
    page,
    byId,
    getImageProvider(),
    order.brief.artStyleId,
    order.brief.finish,
    order.brief.memories,
    order.storyboard.device,
  );
  await settleStatus(orderId);
}

/**
 * Copies a provider-hosted image into our own storage. Provider URLs expire;
 * the PDF may be rebuilt weeks later, so we keep our own copy.
 */
async function store(url: string): Promise<string> {
  const data = await fetchBinary(url);
  const contentType = url.toLowerCase().includes(".png")
    ? "image/png"
    : "image/jpeg";
  const { url: stored } = await putFile(data, contentType);
  return stored;
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
  }));
}
