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
