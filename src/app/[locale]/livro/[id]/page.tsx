import { notFound } from 'next/navigation'
import { BookProgress } from '@/components/BookProgress'
import { getDictionary } from '@/lib/i18n'
import { getOrder } from '@/lib/store'

export default async function BookPage({
  params,
}: PageProps<'/[locale]/livro/[id]'>) {
  const { locale, id } = await params

  // Fail fast on a bad link instead of polling an order that will never exist.
  const order = await getOrder(id)
  if (!order) notFound()

  return (
    <main className="flex flex-1 flex-col">
      <BookProgress dict={getDictionary(locale)} orderId={id} />
    </main>
  )
}
