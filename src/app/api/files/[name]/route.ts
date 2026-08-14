import { contentTypeFor, readFile } from '@/lib/storage'
import { jsonError, notFound } from '../../_lib/respond'

type Context = { params: Promise<{ name: string }> }

/** Serves reference photos and rendered pages back out of local storage. */
export async function GET(_request: Request, { params }: Context) {
  const { name } = await params

  try {
    const data = await readFile(name)
    if (!data) return notFound('File not found.')

    return new Response(data as BodyInit, {
      headers: {
        'Content-Type': contentTypeFor(name),
        // Content is immutable — the filename is a fresh UUID per upload.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    return jsonError(err)
  }
}
