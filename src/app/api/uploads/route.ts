import { putFile } from '@/lib/storage'
import { badRequest, jsonError } from '../_lib/respond'

/** 8 MB — plenty for a phone photo, small enough to keep uploads quick. */
const MAX_BYTES = 8 * 1024 * 1024

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])

/** Accepts a character reference photo and returns the URL to reference it. */
export async function POST(request: Request) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return badRequest('Expected a multipart form upload.')
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return badRequest('No file was uploaded.')
  }
  if (!ALLOWED.has(file.type)) {
    return badRequest('Send a JPEG, PNG or WebP image.')
  }
  if (file.size > MAX_BYTES) {
    return badRequest('That image is larger than 8 MB.')
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const { url } = await putFile(buffer, file.type)
    return Response.json({ url }, { status: 201 })
  } catch (err) {
    return jsonError(err)
  }
}
