import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
  type RGB,
} from 'pdf-lib'
import { fetchBinary, putFile } from '../storage'
import type { Locale, Order, StoryPage } from '../types'

/**
 * Builds the print-ready A4 PDF.
 *
 * Layout per illustrated page: the drawing centred in the upper block, the
 * narration centred underneath. Nothing is placed within the margin, so the
 * printer can trim or bind without eating the artwork.
 */

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

  // The two books are laid out differently on purpose. A coloring page is a
  // working surface: it wants white margins to rest the hand on and a clear
  // band for the narration. A colour page is a finished picture: it bleeds to
  // the edge, and the narration sits on a soft plate over the art.
  const bleed = order.brief.finish === 'coloured'

  for (const page of order.storyboard.pages) {
    const render = rendersByIndex.get(page.index)
    const sheet = pdf.addPage([A4.width, A4.height])

    const imageBottom = bleed ? 0 : MARGIN + narrationBlock
    const box = bleed
      ? { x: 0, y: 0, width: A4.width, height: A4.height }
      : {
          x: MARGIN,
          y: imageBottom,
          width: A4.width - MARGIN * 2,
          height: A4.height - MARGIN - imageBottom,
        }

    if (render?.imageUrl) {
      if (bleed) {
        await drawImageCover(pdf, sheet, render.imageUrl, box)
        sheet.drawRectangle({
          x: 0,
          y: 0,
          width: A4.width,
          height: narrationBlock,
          color: rgb(1, 1, 1),
          opacity: 0.78,
        })
      } else {
        await drawImage(pdf, sheet, render.imageUrl, box)
      }
    } else {
      drawPlaceholder(
        sheet,
        fonts,
        bleed
          ? {
              x: MARGIN,
              y: MARGIN + narrationBlock,
              width: A4.width - MARGIN * 2,
              height: A4.height - MARGIN * 2 - narrationBlock,
            }
          : box,
        {
          label: render?.status === 'failed' ? t.failed : t.placeholder,
          detail: render?.error ?? render?.promptPreview ?? page.sceneDescription,
        },
      )
    }

    drawNarration(sheet, fonts, page, page.index, narrationBlock)
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
  box: { x: number; y: number; width: number; height: number },
) {
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
}

async function drawImage(
  pdf: PDFDocument,
  page: PDFPage,
  imageUrl: string,
  box: { x: number; y: number; width: number; height: number },
) {
  const bytes = await fetchBinary(imageUrl)
  const image = isPng(bytes)
    ? await pdf.embedPng(bytes)
    : await pdf.embedJpg(bytes)

  // Fit inside the box without cropping, then centre what is left over.
  const scale = Math.min(box.width / image.width, box.height / image.height)
  const width = image.width * scale
  const height = image.height * scale

  page.drawImage(image, {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height,
  })
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
) {
  const lines = wrap(story.narration, fonts.bodyItalic, 13, A4.width - MARGIN * 3)
  let y = MARGIN + block - 30

  for (const line of lines.slice(0, 4)) {
    drawCentered(page, line, fonts.bodyItalic, 13, y, INK)
    y -= 19
  }

  // The translation sits smaller and lighter: there to be checked against,
  // not to compete with the line the reader is meant to read first.
  const secondary = story.narrationSecondary?.trim()
  if (secondary) {
    y -= 8
    const support = wrap(secondary, fonts.body, 10, A4.width - MARGIN * 3)
    for (const line of support.slice(0, 3)) {
      drawCentered(page, line, fonts.body, 10, y, MUTED)
      y -= 14
    }
  }

  drawCentered(page, String(pageNumber), fonts.body, 9, MARGIN - 4, MUTED)
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

function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = sanitize(text).split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

/**
 * The standard PDF fonts are WinAnsi-encoded, which covers Portuguese
 * accents but throws on anything outside it. Map the few typographic
 * characters models like to emit, and drop the rest.
 */
const REPLACEMENTS: Record<string, string> = {
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '–': '-',
  '—': '--',
  '…': '...',
  ' ': ' ',
}

function sanitize(text: string): string {
  let out = text
  for (const [from, to] of Object.entries(REPLACEMENTS)) {
    out = out.split(from).join(to)
  }
  return out.replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '')
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
