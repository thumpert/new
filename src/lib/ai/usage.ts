/**
 * What each order actually costs, recorded as it is spent.
 *
 * Every model call here is money. Without this the only honest answer to
 * "what does a book cost?" is an estimate, and an estimate is what you build
 * a price on and then find out was wrong.
 *
 * Prices are per million tokens, and they are written down rather than
 * fetched: they change rarely, and a number that silently drifts is worse
 * than one that is visibly stale. Checked 16 August 2026.
 */

export interface Charge {
  what: string
  model: string
  input: number
  output: number
  usd: number
  /**
   * How long the call took, in milliseconds.
   *
   * Added because the ledger could say what a book cost and not what it cost
   * the customer in waiting, and those turned out to be different questions
   * with different answers: the most expensive call and the slowest one were
   * the same call, but nothing in here proved it until it was measured.
   */
  ms?: number
}

/** US$ per million tokens, input and output. */
const RATES: Record<string, { in: number; out: number }> = {
  'claude-opus-5': { in: 5, out: 25 },
  // Sonnet 5 is at introductory pricing (US$2/US$10) until 31 August 2026,
  // after which it is US$3/US$15. The higher number is used here so the cost
  // of a book does not appear to rise on its own in September.
  'claude-sonnet-5': { in: 3, out: 15 },
}

/**
 * One image from gemini-3.1-flash-image at 2K, which is what the pages are
 * drawn at. Google prices these by resolution: 1K is US$0.067 and 4K is
 * US$0.15.
 */
export const IMAGE_USD = 0.101

const charges: Charge[] = []

export function record(
  what: string,
  model: string,
  usage: { input_tokens?: number; output_tokens?: number } | null | undefined,
  ms?: number,
): void {
  if (!usage) return
  const rate = RATES[model]
  if (!rate) return

  const input = usage.input_tokens ?? 0
  const output = usage.output_tokens ?? 0

  charges.push({
    what,
    model,
    input,
    output,
    usd: (input * rate.in + output * rate.out) / 1_000_000,
    ms,
  })
}

export function recordImage(what: string): void {
  charges.push({ what, model: 'gemini-3.1-flash-image', input: 0, output: 0, usd: IMAGE_USD })
}

/** Everything spent since the last reset, newest last. */
export function spent(): { charges: Charge[]; usd: number } {
  return { charges: [...charges], usd: charges.reduce((sum, c) => sum + c.usd, 0) }
}

export function resetSpend(): void {
  charges.length = 0
}
