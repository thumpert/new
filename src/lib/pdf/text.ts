import type { PDFFont } from 'pdf-lib'

/**
 * Turning a written line into lines on a sheet.
 *
 * Separated from the page drawing because this is where two faults lived that
 * were invisible from the layout code: the em dash being translated into two
 * hyphens, and newlines being flowed away as though they were spaces. Both
 * broke the same thing — dialogue, which in a Portuguese book is a travessão
 * opening a line of its own. Kept here with scripts/test-dialogue.ts against
 * it, since neither fault is visible by reading the page that calls this.
 */

/**
 * Wraps narration to the widest type that still fits the band under the art.
 *
 * Falls back a step at a time and stops at the smallest size worth reading; a
 * page that overruns even then is rare enough to accept as tight rather than
 * to hyphenate or truncate.
 */
export function fit(
  text: string,
  font: PDFFont,
  measure: number,
): [lines: string[], size: number, leading: number] {
  const steps: [number, number, number][] = [
    [13, 19, 4],
    [11.5, 16.5, 5],
    [10, 14, 6],
  ]

  for (const [size, leading, max] of steps) {
    const lines = wrap(text, font, size, measure)
    if (lines.length <= max) return [lines, size, leading]
  }

  const [size, leading, max] = steps[steps.length - 1]
  return [wrap(text, font, size, measure).slice(0, max), size, leading]
}

const REPLACEMENTS: Record<string, string> = {
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  ' ': ' ',
}

/**
 * Punctuation above Latin-1 that the standard fonts print anyway.
 *
 * The strip below is written for Latin-1, so everything above it was either
 * mapped down or deleted — which is how the em dash became two hyphens. In a
 * Portuguese book that dash is not decoration: it is the travessão that opens
 * every line of speech, and "-- Você vem?" is simply wrong on the page. The
 * standard 14 fonts encode as WinAnsi, which carries these glyphs, so they are
 * kept rather than translated. Checked against Helvetica and Times before the
 * mappings came out.
 */
const KEEP_ABOVE_LATIN1 = '\u2013\u2014\u2026'

const STRIPPABLE = new RegExp(
  `[^\\x20-\\x7E\\xA0-\\xFF\\n${KEEP_ABOVE_LATIN1}]`,
  'g',
)

export function sanitize(text: string): string {
  let out = text
  for (const [from, to] of Object.entries(REPLACEMENTS)) {
    out = out.split(from).join(to)
  }
  return out.replace(STRIPPABLE, '')
}

/**
 * Breaks text to a measure, honouring the line breaks it was given.
 *
 * The split used to be on /\s+/, which treats a newline as an ordinary space
 * and quietly flows every break away. That is fatal to dialogue: a spoken line
 * in Portuguese opens with a travessão on a line of its own, and running it
 * back into the paragraph leaves a stray dash in the middle of a sentence. So
 * newlines are hard breaks now, and only the spaces inside a line are elastic.
 */
export function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = []

  for (const paragraph of sanitize(text).split('\n')) {
    const words = paragraph.split(/[^\S\n]+/).filter(Boolean)
    // A break the writer asked for with nothing on it: kept as air between
    // speech and narration rather than closed up, but never as a leading gap.
    if (words.length === 0) {
      if (lines.length > 0) lines.push('')
      continue
    }

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
  }

  return lines
}

/**
 * The standard PDF fonts are WinAnsi-encoded, which covers Portuguese
 * accents but throws on anything outside it. Map the few typographic
 * characters models like to emit, and drop the rest.
 */
