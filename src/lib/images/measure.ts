import sharp from 'sharp'
import type { BookFinish } from '../types'

/**
 * The half of page checking that needs no model at all.
 *
 * Colour where there should be none, grey where there should be none, black
 * filled into areas a child was meant to fill, white left on a page that was
 * supposed to be painted — every one of these is a question about pixels, and
 * a question about pixels should be answered by counting pixels. Local,
 * deterministic, free, and it cannot hallucinate a defect or miss one it can
 * see.
 *
 * What is deliberately not here: anatomy and whether the scene makes sense.
 * No amount of counting tells you that a hand belongs to nobody. That is left
 * to the vision check, which is the expensive one, and keeping these two
 * apart is what lets the expensive one be asked a narrow question.
 */

/** Downscale before analysing: a defect worth catching survives 700px. */
const ANALYSIS_WIDTH = 700

/**
 * Calibrated against pages already known to be good or bad, not guessed.
 * Measured at ANALYSIS_WIDTH on: a pure line-art sample, a clean coloring
 * page carrying one red thread, a fully painted page, and a photo page from
 * the book that went wrong.
 *
 *            colour   white
 *   line art   0.0%   80.6%
 *   thread     0.6%   87.2%
 *   painted   78.3%    3.3%
 *   photo     43.4%    7.7%
 *
 * Those two separate cleanly, so those two are checked.
 *
 * Grey and filled black are deliberately NOT checked here, though an earlier
 * version tried. Telling a filled shape from an outline needs the mask eroded
 * first — without that, every black line counts as a fill and every
 * antialiased edge counts as shading, and the first attempt duly failed two
 * pages known to be perfect. Erosion at full resolution is affordable but not
 * free, and shading is something the vision check can see anyway. A check
 * that fails good pages is worse than no check: it teaches everyone to ignore
 * it.
 */
const LIMITS = {
  /** A coloring page washed in colour rather than carrying one small object. */
  colourOnLineArt: 5,
  /** A painted page with large areas left as bare paper. */
  whiteOnPainted: 25,
} as const

export interface Measurement {
  problems: string[]
  /** Kept for the record even when nothing is wrong. */
  stats: Record<string, number>
}

/**
 * Reduces the image and returns raw pixels, so everything below reads the
 * same buffer instead of decoding four times.
 */
async function pixels(bytes: Buffer) {
  const image = sharp(bytes).resize({ width: ANALYSIS_WIDTH, fit: 'inside' })
  const { data, info } = await image
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

export async function measurePage(
  bytes: Buffer,
  finish: BookFinish,
): Promise<Measurement> {
  const { data, width, height } = await pixels(bytes)
  const total = width * height

  let colour = 0
  let grey = 0
  let black = 0
  let white = 0

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)

    if (max - min > 40) colour++
    else if (max < 45) black++
    else if (max > 240) white++
    else if (max > 70 && max < 205) grey++
  }

  const pct = (n: number) => (100 * n) / total
  const stats = {
    colour: +pct(colour).toFixed(3),
    grey: +pct(grey).toFixed(3),
    black: +pct(black).toFixed(3),
    white: +pct(white).toFixed(3),
  }

  const problems: string[] = []

  if (finish === 'coloring') {
    // A guide object is meant to carry colour, so a small amount is correct
    // and the vision check is what says whether it is the right object. This
    // only catches the different, much larger failure: a coloring page that
    // came back painted.
    if (stats.colour > LIMITS.colourOnLineArt) {
      problems.push(
        `the page is ${stats.colour}% coloured — a coloring page should be line art with at most one small coloured object`,
      )
    }
  } else if (stats.white > LIMITS.whiteOnPainted) {
    problems.push(
      `${stats.white}% of the page is bare white — a colour page should be painted throughout`,
    )
  }

  return { problems, stats }
}

/** A small copy of the image, for sending to the vision check. */
export async function thumbnail(bytes: Buffer): Promise<Buffer> {
  return sharp(bytes)
    .resize({ width: ANALYSIS_WIDTH, fit: 'inside' })
    .jpeg({ quality: 80 })
    .toBuffer()
}
