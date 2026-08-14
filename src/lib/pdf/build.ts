import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
  type RGB,
} from 'pdf-lib'
import { fetchBinary, putFile } from '../storage'
import type { Locale, Order } from '../types'

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

  drawCover(pdf, fonts, order, t)

  if (order.storyboard.dedication?.trim()) {
    drawDedication(pdf, fonts, order.storyboard.dedication)
  }

  const rendersByIndex = new Map(
    (order.renders ?? []).map((r) => [r.index, r]),
  )

  for (const page of order.storyboard.pages) {
    const render = rendersByIndex.get(page.index)
    const sheet = pdf.addPage([A4.width, A4.height])

    const imageBottom = MARGIN + NARRATION_BLOCK
    const box = {
      x: MARGIN,
      y: imageBottom,
      width: A4.width - MARGIN * 2,
      height: A4.height - MARGIN - imageBottom,
    }

    if (render?.imageUrl) {
      await drawImage(pdf, sheet, render.imageUrl, box)
    } else {
      drawPlaceholder(sheet, fonts, box, {
        label: render?.status === 'failed' ? t.failed : t.placeholder,
        detail: render?.error ?? render?.promptPreview ?? page.sceneDescription,
      })
    }

    drawNarration(sheet, fonts, page.narration, page.index)
  }

  drawClosing(pdf, fonts, t)

  return pdf.save()
}

/** Builds the PDF, stores it, and records the path on the order. */
export async function buildAndStorePdf(order: Order): Promise<string> {
  const bytes = await buildBookPdf(order)
  const { url } = await putFile(Buffer.from(bytes), 'application/pdf')
  return url
}

/* ------------------------------------------------------------------ */

function drawCover(
  pdf: PDFDocument,
  fonts: Fonts,
  order: Order,
  t: Record<string, string>,
) {
  const page = pdf.addPage([A4.width, A4.height])
  const title = order.storyboard!.title

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

  const names = order.brief.characters.map((c) => c.name).filter(Boolean)
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

function drawClosing(pdf: PDFDocument, fonts: Fonts, t: Record<string, string>) {
  const page = pdf.addPage([A4.width, A4.height])
  drawCentered(page, t.theEnd, fonts.display, 28, A4.height / 2, INK)
  drawCentered(page, t.madeWith, fonts.bodyItalic, 12, A4.height / 2 - 40, MUTED)
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
  narration: string,
  pageNumber: number,
) {
  const lines = wrap(narration, fonts.bodyItalic, 13, A4.width - MARGIN * 3)
  let y = MARGIN + NARRATION_BLOCK - 30

  for (const line of lines.slice(0, 4)) {
    drawCentered(page, line, fonts.bodyItalic, 13, y, INK)
    y -= 19
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
