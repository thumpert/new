import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
  type RGB,
} from 'pdf-lib'
import { getAgeBand } from '../catalog'
import { fit, sanitize, wrap } from './text'
import { fetchBinary, putFile } from '../storage'
import type { BookBrief, Locale, Order, StoryPage } from '../types'

/**
 * Builds the print-ready A4 PDF.
 *
 * Layout per illustrated page: the drawing centred in the upper block, the
 * narration centred underneath. Nothing is placed within the margin, so the
 * printer can trim or bind without eating the artwork.
 */

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

const A4 = { width: 595.28, height: 841.89 }

/** 12.7mm — comfortably clear of a perfect-bound gutter. */
const MARGIN = 36
/** Vertical space reserved under the drawing for the narration. */
const NARRATION_BLOCK = 88
/** Extra room when a bilingual book prints a support line underneath. */
const NARRATION_BLOCK_BILINGUAL = 122

const INK = rgb(0.1, 0.1, 0.12)
const MUTED = rgb(0.45, 0.45, 0.5)
const HAIRLINE = rgb(0.82, 0.82, 0.85)

interface Fonts {
  display: PDFFont
  body: PDFFont
  bodyItalic: PDFFont
}

const COPY: Record<Locale, Record<string, string>> = {
  pt: {
    subtitle: 'um livro de colorir feito só para você',
    starring: 'Com',
    placeholder: 'Prévia — ilustração ainda não gerada',
    failed: 'Esta página não pôde ser ilustrada',
    theEnd: 'Fim',
    madeWith: 'Feito com carinho',
  },
  en: {
    subtitle: 'a coloring book made just for you',
    starring: 'Starring',
    placeholder: 'Preview — illustration not generated yet',
    failed: 'This page could not be illustrated',
    theEnd: 'The End',
    madeWith: 'Made with love',
  },
}

export async function buildBookPdf(order: Order): Promise<Uint8Array> {
  if (!order.storyboard) throw new Error('Cannot build a PDF without a storyboard')

  const locale = order.brief.locale
  const t = COPY[locale] ?? COPY.pt

  const pdf = await PDFDocument.create()
  pdf.setTitle(order.storyboard.title)
  pdf.setSubject(t.subtitle)
  pdf.setCreator('Coloring Book Generator')

  const fonts: Fonts = {
    display: await pdf.embedFont(StandardFonts.TimesRomanBold),
    body: await pdf.embedFont(StandardFonts.Helvetica),
    bodyItalic: await pdf.embedFont(StandardFonts.TimesRomanItalic),
  }

  await drawCover(pdf, fonts, order, t)

  if (order.storyboard.dedication?.trim()) {
    drawDedication(pdf, fonts, order.storyboard.dedication)
  }

  const rendersByIndex = new Map(
    (order.renders ?? []).map((r) => [r.index, r]),
  )

  // One page carrying a translation sets the layout for the whole book —
  // pages must not shift height depending on whether a line happened to fit.
  const bilingual = order.storyboard.pages.some((p) =>
    p.narrationSecondary?.trim(),
  )
  const narrationBlock = bilingual
    ? NARRATION_BLOCK_BILINGUAL
    : NARRATION_BLOCK

  // The narration is printed onto the picture, not under it. The illustration
  // is drawn to leave its bottom fifth open — white paper in a coloring book,
  // pale scenery in a colour one — and the words go straight into that space
  // with nothing between. No plate, no panel: a box under the art reads as a
  // caption bolted on, and the page stops looking like a book.
  //
  // The two still differ in how far the art reaches. A colour page bleeds to
  // the edge. A coloring page stays inside the margin, which costs nothing
  // visually — its background is the same white as the paper — and leaves the
  // printer somewhere to trim and bind.
  const bleed = order.brief.finish === 'coloured'

  for (const page of order.storyboard.pages) {
    const render = rendersByIndex.get(page.index)

    // A reading book is spreads, not pages: the picture takes the left-hand
    // sheet whole and the words get the right-hand sheet to themselves. That
    // is the format's whole point — the listener's eye stays on the picture
    // while the reader's has somewhere quiet to be.
    if (order.brief.finish === 'reading') {
      const picture = pdf.addPage([A4.width, A4.height])
      const full = { x: 0, y: 0, width: A4.width, height: A4.height }
      if (render?.imageUrl) {
        await drawImageCover(pdf, picture, render.imageUrl, full)
      } else {
        drawPlaceholder(
          picture,
          fonts,
          { x: MARGIN, y: MARGIN, width: A4.width - MARGIN * 2, height: A4.height - MARGIN * 2 },
          {
            label: render?.status === 'failed' ? t.failed : t.placeholder,
            detail: render?.error ?? render?.promptPreview ?? page.sceneDescription,
          },
        )
      }
      drawStoryPage(pdf.addPage([A4.width, A4.height]), fonts, page, order.brief)
      continue
    }

    const sheet = pdf.addPage([A4.width, A4.height])

    // A page redrawn from a photograph is laid out like a photograph: mounted
    // inside the page with the words underneath, never bled to the edge.
    //
    // Not decoration. An ordinary page can be composed to leave its foot
    // empty for the narration, but a photograph's composition is already
    // fixed — a selfie has no spare sky at the bottom — so words printed onto
    // it land on faces and dark ground. Mounting it also says something true:
    // this page is a real moment, and it should not pretend to be drawn like
    // the rest.
    const isMemory = Boolean(page.memoryId)
    const mounted = isMemory || !bleed

    const box = mounted
      ? {
          x: MARGIN,
          y: MARGIN,
          width: A4.width - MARGIN * 2,
          height: A4.height - MARGIN * 2 - (isMemory ? narrationBlock : 0),
        }
      : { x: 0, y: 0, width: A4.width, height: A4.height }

    let art = box
    if (render?.imageUrl) {
      art = mounted
        ? await drawImage(pdf, sheet, render.imageUrl, box)
        : await drawImageCover(pdf, sheet, render.imageUrl, box)
    } else {
      // The placeholder frame stops above the band, so a preview PDF shows the
      // words in the same place a real illustration would leave them.
      drawPlaceholder(
        sheet,
        fonts,
        {
          x: box.x + (mounted ? 0 : MARGIN),
          y: box.y + (isMemory ? 0 : narrationBlock),
          width: box.width - (mounted ? 0 : MARGIN * 2),
          height: box.height - (isMemory ? 0 : narrationBlock),
        },
        {
          label: render?.status === 'failed' ? t.failed : t.placeholder,
          detail: render?.error ?? render?.promptPreview ?? page.sceneDescription,
        },
      )
    }

    // On an ordinary page the words go inside the picture's own reserved
    // bottom fifth, measured from where the art ends. On a photograph page
    // the art stops short and they go in the white beneath it — same call,
    // because both are "just under the bottom of the art".
    drawNarration(sheet, fonts, page, page.index, narrationBlock, art)
  }

  await drawClosing(pdf, fonts, order, t)

  return pdf.save()
}

/** Builds the PDF, stores it, and records the path on the order. */
export async function buildAndStorePdf(order: Order): Promise<string> {
  const bytes = await buildBookPdf(order)
  const { url } = await putFile(Buffer.from(bytes), 'application/pdf')
  return url
}

/* ------------------------------------------------------------------ */

/**
 * The front cover: the chosen illustration bled to the edges, with the title
 * typeset across the top.
 *
 * The art is drawn to leave the upper third calm precisely so this text can
 * sit there. When no cover was chosen or drawn, it falls back to the original
 * typographic cover rather than shipping a blank page.
 */
async function drawCover(
  pdf: PDFDocument,
  fonts: Fonts,
  order: Order,
  t: Record<string, string>,
) {
  const page = pdf.addPage([A4.width, A4.height])
  const title = order.storyboard!.title
  const names = order.brief.characters.map((c) => c.name).filter(Boolean)

  const chosen = (order.covers ?? []).find(
    (c) => c.kind === order.chosenCoverKind && c.imageUrl,
  )

  if (chosen?.imageUrl) {
    // Full bleed: a cover with a white border reads as a printout, not a book.
    await drawImageCover(pdf, page, chosen.imageUrl, {
      x: 0,
      y: 0,
      width: A4.width,
      height: A4.height,
    })

    // A soft plate behind the title so it stays legible over whatever the
    // model painted up there.
    page.drawRectangle({
      x: 0,
      y: A4.height - 210,
      width: A4.width,
      height: 210,
      color: rgb(1, 1, 1),
      opacity: 0.72,
    })

    let y = A4.height - 96
    for (const line of wrap(title, fonts.display, 32, A4.width - MARGIN * 3)) {
      drawCentered(page, line, fonts.display, 32, y, INK)
      y -= 38
    }
    if (names.length > 0) {
      drawCentered(
        page,
        formatNames(names, order.brief.locale),
        fonts.bodyItalic,
        14,
        y - 6,
        MUTED,
      )
    }
    return
  }

  const titleLines = wrap(title, fonts.display, 34, A4.width - MARGIN * 4)
  let y = A4.height * 0.62

  for (const line of titleLines) {
    drawCentered(page, line, fonts.display, 34, y, INK)
    y -= 42
  }

  y -= 18
  drawCentered(page, t.subtitle, fonts.bodyItalic, 14, y, MUTED)

  // A hairline rule, then the cast — the reason this book exists.
  y -= 46
  page.drawLine({
    start: { x: A4.width / 2 - 60, y },
    end: { x: A4.width / 2 + 60, y },
    thickness: 0.75,
    color: HAIRLINE,
  })

  if (names.length > 0) {
    y -= 34
    drawCentered(page, t.starring.toUpperCase(), fonts.body, 9, y, MUTED)
    y -= 22
    for (const line of wrap(
      formatNames(names, order.brief.locale),
      fonts.display,
      18,
      A4.width - MARGIN * 4,
    )) {
      drawCentered(page, line, fonts.display, 18, y, INK)
      y -= 24
    }
  }
}

function drawDedication(pdf: PDFDocument, fonts: Fonts, dedication: string) {
  const page = pdf.addPage([A4.width, A4.height])
  const lines = wrap(dedication, fonts.bodyItalic, 16, A4.width - MARGIN * 4)
  let y = A4.height / 2 + (lines.length * 24) / 2

  for (const line of lines) {
    drawCentered(page, line, fonts.bodyItalic, 16, y, INK)
    y -= 24
  }
}

/**
 * The back cover: the closing illustration, with "The End" and the cast set
 * across the bottom — the mirror of the front, where the type sits on top.
 *
 * A back cover that failed to draw is not worth failing the book over, so this
 * quietly falls back to the plain closing page.
 */
async function drawClosing(
  pdf: PDFDocument,
  fonts: Fonts,
  order: Order,
  t: Record<string, string>,
) {
  const page = pdf.addPage([A4.width, A4.height])
  const back = (order.covers ?? []).find((c) => c.kind === 'back' && c.imageUrl)

  if (!back?.imageUrl) {
    drawCentered(page, t.theEnd, fonts.display, 28, A4.height / 2, INK)
    drawCentered(page, t.madeWith, fonts.bodyItalic, 12, A4.height / 2 - 40, MUTED)
    return
  }

  await drawImageCover(pdf, page, back.imageUrl, {
    x: 0,
    y: 0,
    width: A4.width,
    height: A4.height,
  })

  page.drawRectangle({
    x: 0,
    y: 0,
    width: A4.width,
    height: 168,
    color: rgb(1, 1, 1),
    opacity: 0.72,
  })

  drawCentered(page, t.theEnd, fonts.display, 26, 104, INK)

  const names = order.brief.characters.map((c) => c.name).filter(Boolean)
  if (names.length > 0) {
    drawCentered(
      page,
      formatNames(names, order.brief.locale),
      fonts.bodyItalic,
      13,
      74,
      MUTED,
    )
  }
  drawCentered(page, t.madeWith, fonts.body, 9, 46, MUTED)
}

/**
 * Fills the box completely, cropping the overflow — the opposite of drawImage,
 * which fits inside and leaves white.
 *
 * Covers want this: a full bleed with a little of the art lost off the edge
 * looks like a book, while a cover letterboxed inside white margins looks like
 * something that came out of a home printer.
 */
async function drawImageCover(
  pdf: PDFDocument,
  page: PDFPage,
  imageUrl: string,
  box: Rect,
): Promise<Rect> {
  const bytes = await fetchBinary(imageUrl)
  const image = isPng(bytes)
    ? await pdf.embedPng(bytes)
    : await pdf.embedJpg(bytes)

  const scale = Math.max(box.width / image.width, box.height / image.height)
  const width = image.width * scale
  const height = image.height * scale

  page.drawImage(image, {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height,
  })
  // It fills the box by definition, so the box is the visible rectangle.
  return box
}

/**
 * Fits the image inside the box without cropping, anchored to the top.
 *
 * Top-anchored rather than centred because the narration is placed relative to
 * where the picture actually ends: the illustration reserves its own bottom
 * fifth for the words, and centring would float that reserved band away from
 * the text by whatever slack the aspect ratio left over.
 *
 * Returns the rectangle it drew into, so the caller can find that band.
 */
async function drawImage(
  pdf: PDFDocument,
  page: PDFPage,
  imageUrl: string,
  box: { x: number; y: number; width: number; height: number },
): Promise<Rect> {
  const bytes = await fetchBinary(imageUrl)
  const image = isPng(bytes)
    ? await pdf.embedPng(bytes)
    : await pdf.embedJpg(bytes)

  const scale = Math.min(box.width / image.width, box.height / image.height)
  const width = image.width * scale
  const height = image.height * scale

  const rect = {
    x: box.x + (box.width - width) / 2,
    y: box.y + box.height - height,
    width,
    height,
  }
  page.drawImage(image, rect)
  return rect
}

function drawPlaceholder(
  page: PDFPage,
  fonts: Fonts,
  box: { x: number; y: number; width: number; height: number },
  content: { label: string; detail: string },
) {
  page.drawRectangle({
    ...box,
    borderColor: HAIRLINE,
    borderWidth: 1,
    borderDashArray: [4, 4],
  })

  let y = box.y + box.height / 2 + 40
  drawCentered(page, content.label, fonts.body, 11, y, MUTED)

  y -= 26
  const lines = wrap(content.detail, fonts.body, 9, box.width - 48).slice(0, 12)
  for (const line of lines) {
    drawCentered(page, line, fonts.body, 9, y, MUTED)
    y -= 13
  }
}

function drawNarration(
  page: PDFPage,
  fonts: Fonts,
  story: StoryPage,
  pageNumber: number,
  block: number,
  art: Rect,
) {
  // A narrow column, centred. The illustration leaves its bottom fifth calm,
  // but reliably only through the middle — scenery creeps back in at the left
  // and right edges, and a line running the full width ends up crossing it.
  // Wrapping to two short lines in the centre is what keeps the words on the
  // clear part of the picture. Measured on a real page: full width put the
  // last three words into a clump of reeds.
  const measure = A4.width * 0.54
  // Four lines at 13pt is what the band holds. A page that needs more is set
  // a step smaller rather than having its last line dropped — which is what
  // used to happen, silently, and reads to the customer as a sentence that
  // stops in the middle of itself. Dialogue makes this common: a spoken line
  // takes a whole line of its own however short it is.
  const [lines, size, leading] = fit(story.narration, fonts.bodyItalic, measure)
  // Sit inside the art's reserved band, which starts at its bottom edge. Never
  // below the page margin, so a picture that ends low cannot push the words
  // off the sheet.
  let y = Math.max(art.y, MARGIN) + block - 30

  for (const line of lines) {
    drawCentered(page, line, fonts.bodyItalic, size, y, INK)
    y -= leading
  }

  // The translation sits smaller and lighter: there to be checked against,
  // not to compete with the line the reader is meant to read first.
  const secondary = story.narrationSecondary?.trim()
  if (secondary) {
    y -= 8
    const support = wrap(secondary, fonts.body, 10, measure)
    for (const line of support.slice(0, 3)) {
      drawCentered(page, line, fonts.body, 10, y, MUTED)
      y -= 14
    }
  }

  drawCentered(page, String(pageNumber), fonts.body, 9, MARGIN - 4, MUTED)
}


/**
 * The right-hand page of a reading book: words, and nothing else.
 *
 * Set larger and looser than the narration printed on a picture, because this
 * is read rather than glanced at, and often read aloud by somebody holding a
 * child. The type size follows the age the book was ordered for — a page for
 * a four-year-old is a few short lines set large, a page for a ten-year-old is
 * a paragraph — and the block sits on the optical centre rather than the
 * geometric one, which is slightly above it.
 */
function drawStoryPage(
  page: PDFPage,
  fonts: Fonts,
  story: StoryPage,
  brief: BookBrief,
): void {
  const band = getAgeBand(brief.ageBandId)
  // Children's book type, not adult book type. The trade's floor for a
  // beginning reader is 16–18pt and picture-book body runs to 24pt; 14pt is
  // the bottom of the range and belongs to the oldest band only. Leading sits
  // 6–9pt above the size, which is what a child decoding a line needs.
  const size = band.id === 'little' ? 20 : band.id === 'middle' ? 17 : 14
  const leading = size * 1.45
  // A measure of roughly 60 characters, which is what a line wants to be.
  const measure = A4.width - MARGIN * 2 - 54
  const left = (A4.width - measure) / 2

  const lines = wrap(story.narration, fonts.body, size, measure)
  const secondary = story.narrationSecondary?.trim()
  const support = secondary ? wrap(secondary, fonts.bodyItalic, size * 0.8, measure) : []

  const blockHeight =
    lines.length * leading + (support.length ? support.length * leading * 0.82 + leading * 0.6 : 0)
  let y = (A4.height + blockHeight) / 2 - leading + A4.height * 0.04

  // The youngest book is centred, which suits three short lines. Longer text
  // is ranged left: a centred paragraph makes the eye hunt for each new line.
  const centred = band.id === 'little'

  for (const line of lines) {
    if (centred) drawCentered(page, line, fonts.body, size, y, INK)
    else page.drawText(sanitize(line), { x: left, y, size, font: fonts.body, color: INK })
    y -= leading
  }

  if (support.length) {
    y -= leading * 0.6
    for (const line of support) {
      const s = size * 0.8
      if (centred) drawCentered(page, line, fonts.bodyItalic, s, y, MUTED)
      else page.drawText(sanitize(line), { x: left, y, size: s, font: fonts.bodyItalic, color: MUTED })
      y -= leading * 0.82
    }
  }

  drawCentered(page, String(story.index), fonts.body, 9, MARGIN - 4, MUTED)
}

/* ------------------------------------------------------------------ *
 * Text helpers
 * ------------------------------------------------------------------ */

function drawCentered(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color: RGB,
) {
  const safe = sanitize(text)
  const width = font.widthOfTextAtSize(safe, size)
  page.drawText(safe, { x: (A4.width - width) / 2, y, size, font, color })
}

function formatNames(names: string[], locale: Locale): string {
  if (names.length === 1) return names[0]
  const and = locale === 'pt' ? 'e' : 'and'
  return `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`
}

function isPng(bytes: Buffer): boolean {
  return (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
}
