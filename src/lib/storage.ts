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
 * Absolute URL for a stored file. Image providers fetch reference images over
 * the network, so they need a URL they can actually reach — set APP_URL (or
 * rely on Vercel's VERCEL_URL) when running against a real provider.
 */
export function absoluteUrl(pathname: string): string {
  const base =
    process.env.APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    'http://localhost:3000'
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
