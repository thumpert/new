import { buildBookPdf } from '@/lib/pdf/build'
import { getOrder } from '@/lib/store'
import { badRequest, jsonError, notFound } from '../../../_lib/respond'

type Context = { params: Promise<{ id: string }> }

/** Builds the PDF on demand so it always reflects the latest renders. */
export async function GET(_request: Request, { params }: Context) {
  const { id } = await params

  try {
    const order = await getOrder(id)
    if (!order) return notFound('Order not found.')
    if (!order.storyboard) {
      return badRequest('This book has no storyboard yet.')
    }

    const bytes = await buildBookPdf(order)
    const filename = slugify(order.storyboard.title || 'livro-de-colorir')

    return new Response(bytes as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return jsonError(err)
  }
}

function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'livro-de-colorir'
  )
}
