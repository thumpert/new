/** Small helpers so every route answers errors the same shape. */

export function badRequest(message: string, details?: unknown) {
  return Response.json({ error: message, details }, { status: 400 })
}

export function notFound(message = 'Not found') {
  return Response.json({ error: message }, { status: 404 })
}

export function jsonError(err: unknown, status = 500) {
  const message = err instanceof Error ? err.message : String(err)
  // Surfaced to the UI: these are our own messages, not provider internals.
  return Response.json({ error: message }, { status })
}
