/**
 * Turns a thrown thing into a sentence worth storing.
 *
 * Node's fetch reports every network failure as the single word "fetch
 * failed" and hides what actually happened — the DNS answer, the refused
 * connection, the TLS error — one level down in `cause`. Recording only the
 * message meant an order that died in production said "fetch failed" and
 * nothing else, which is indistinguishable from every other network problem
 * and cost an hour of guessing.
 *
 * So the chain is unwrapped. Everything an operator needs to tell one failure
 * from another is in `cause`, and it costs one function to keep it.
 */
export function describeError(err: unknown): string {
  if (!(err instanceof Error)) return String(err)

  const parts: string[] = [err.message]
  const seen = new Set<unknown>([err])

  let current: unknown = err.cause
  while (current instanceof Error && !seen.has(current)) {
    seen.add(current)
    // Node puts the useful identifiers on the error object rather than in the
    // message: ECONNREFUSED, ENOTFOUND, the address it tried, the port.
    const e = current as Error & { code?: string; address?: string; port?: number }
    const extras = [e.code, e.address, e.port ? `:${e.port}` : null]
      .filter(Boolean)
      .join(' ')
    parts.push(extras ? `${e.message} (${extras})` : e.message)
    current = e.cause
  }

  return parts.join(' ← ')
}

/**
 * A failure that carries the status the provider answered with.
 *
 * The status lives in a field rather than in the sentence because the retry
 * policy has to tell "the server said 429, wait and ask again" from "the
 * server said 400, asking again only spends money to arrive at the same
 * error". Reading that back out of a sentence breaks the moment the sentence
 * contains any other number — and it did: `describeError` appends the port, so
 * every TLS failure to Google carried ":443" and was misread as an HTTP 4xx,
 * which switched off the network retry exactly where it was needed.
 */
export class ProviderError extends Error {
  /** The HTTP status the provider answered with, if it answered at all. */
  readonly status?: number
  /** What the provider asked us to wait, from its Retry-After header. */
  readonly retryAfterMs?: number
  /** Set only when the status alone does not settle whether to ask again. */
  readonly retryable?: boolean

  constructor(
    message: string,
    options: {
      status?: number
      retryAfterMs?: number
      retryable?: boolean
      cause?: unknown
    } = {},
  ) {
    super(message, { cause: options.cause })
    this.name = 'ProviderError'
    this.status = options.status
    this.retryAfterMs = options.retryAfterMs
    this.retryable = options.retryable
  }
}

/** The first ProviderError anywhere in the cause chain. */
export function providerError(err: unknown): ProviderError | undefined {
  const seen = new Set<unknown>()
  let current: unknown = err
  while (current instanceof Error && !seen.has(current)) {
    if (current instanceof ProviderError) return current
    seen.add(current)
    current = current.cause
  }
  return undefined
}

/**
 * How long the provider asked us to wait, in milliseconds.
 *
 * Sent as seconds on a 429, occasionally as an HTTP date. Capped at a minute:
 * a customer is watching this page, and a longer wait is better spent failing
 * the step so they can ask for it again themselves.
 *
 * Takes the headers rather than the response because both providers answer
 * this way and only one of them hands us a `Response` — the Anthropic SDK has
 * already turned its own into an error object by the time we see it.
 */
export function retryAfter(headers: Headers | undefined): number | undefined {
  const header = headers?.get('retry-after')
  if (!header) return undefined

  const seconds = Number(header)
  const ms = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(header) - Date.now()

  return ms > 0 ? Math.min(ms, 60_000) : undefined
}
