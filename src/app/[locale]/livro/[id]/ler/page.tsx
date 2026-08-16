import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Flipbook } from '@/components/Flipbook'
import { bookSheets } from '@/lib/book-sheets'
import { getDictionary } from '@/lib/i18n'
import { getOrder } from '@/lib/store'

/**
 * The book itself, at a link that can be sent to the person it is for.
 *
 * Deliberately not the progress screen: nothing here counts pages, reports
 * failures or offers to redraw anything. Whoever opens this is meant to read
 * a present, not to watch a factory. The link is the order's own id, which is
 * a uuid — unguessable, and shareable exactly as far as the customer chooses
 * to share it.
 */
export default async function ReaderPage({
  params,
}: PageProps<'/[locale]/livro/[id]/ler'>) {
  const { locale, id } = await params
  const dict = getDictionary(locale)

  const order = await getOrder(id)
  if (!order) notFound()

  const sheets = bookSheets(order)
  const title = order.storyboard?.title ?? ''

  // A book still being drawn has a home already, with progress and the redraw
  // controls on it. Sending someone there beats showing them a half-book.
  if (sheets.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-ink-soft">{dict.reader.notReady}</p>
        <Link
          href={`/${locale}/livro/${id}`}
          className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:brightness-110"
        >
          {dict.reader.seeProgress}
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-[1320px] flex-col items-center gap-6 px-4 py-10">
      <h1 className="text-center font-serif text-2xl">{title}</h1>

      <Flipbook
        sheets={sheets}
        title={title}
        labels={{
          previous: dict.reader.previous,
          next: dict.reader.next,
          counter: dict.reader.counter,
        }}
      />

      <a
        href={`/api/orders/${id}/pdf`}
        className="text-sm text-ink-soft underline underline-offset-4 transition hover:text-ink"
      >
        {dict.reader.download}
      </a>
    </main>
  )
}
