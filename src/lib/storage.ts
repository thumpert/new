import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

/**
 * Binary storage for reference photos and generated pages.
 *
 * Files land in `.data/files` and are served back through /api/files/[name].
 * Swapping in S3 or Vercel Blob means reimplementing `putFile` and `fileUrl`.
 */

const FILES_DIR = path.join(process.cwd(), '.data', 'files')

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export function extensionFor(contentType: string): string {
  return EXTENSIONS[contentType] ?? 'bin'
}

export function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).slice(1).toLowerCase()
  const match = Object.entries(EXTENSIONS).find(([, e]) => e === ext)
  return match ? match[0] : 'application/octet-stream'
}

export async function putFile(
  data: Buffer,
  contentType: string,
): Promise<{ name: string; url: string }> {
  await fs.mkdir(FILES_DIR, { recursive: true })
  const name = `${randomUUID()}.${extensionFor(contentType)}`
  await fs.writeFile(path.join(FILES_DIR, name), data)
  return { name, url: fileUrl(name) }
}

export function fileUrl(name: string): string {
  return `/api/files/${name}`
}

export async function readFile(name: string): Promise<Buffer | null> {
  // Reject anything that could climb out of the storage directory.
  if (name.includes('/') || name.includes('\\') || name.includes('..')) return null
  try {
    return await fs.readFile(path.join(FILES_DIR, name))
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}

/**
 * Absolute URL for a stored file.
 *
 * Only the app itself reads these — it fetches its own stored reference sheets
 * to send them as bytes, and pulls page images back to build the PDF. Nothing
 * outside needs to reach them, so this can stay private; set APP_URL (or rely
 * on Vercel's VERCEL_URL) so the server resolves its own origin correctly.
 */
export function absoluteUrl(pathname: string): string {
  // The last fallback is the server calling itself, which is what actually
  // happens in a container: nothing outside needs to reach these files, the
  // PDF builder just reads back pages this same process wrote. It has to
  // follow PORT rather than assume 3000 — otherwise moving the port makes
  // every PDF fail to find its own illustrations, and nothing says why.
  const base =
    process.env.APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    `http://localhost:${process.env.PORT ?? 3000}`
  return pathname.startsWith('http') ? pathname : `${base}${pathname}`
}

/** Downloads a remote image so it can be embedded into the PDF. */
export async function fetchBinary(url: string): Promise<Buffer> {
  const res = await fetch(absoluteUrl(url))
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  return Buffer.from(await res.arrayBuffer())
}
