import { Wizard } from '@/components/Wizard'
import { getDictionary, normalizeLocale } from '@/lib/i18n'
import type { BookFinish } from '@/lib/types'

/**
 * The two tiles on the home page link straight in here with the first
 * question already answered: /pt/criar?livro=colorir or ?livro=ler.
 *
 * Read on the server and handed down as a prop rather than pulled from
 * useSearchParams inside the wizard. The wizard is a client component, and
 * reading the query there would drag the whole flow behind a Suspense
 * boundary to satisfy static rendering — for a value the page already has in
 * its hands.
 *
 * The parameter is in Portuguese because the URL is part of the page, the
 * site is Portuguese, and a customer who sees ?livro=colorir in the bar can
 * read what it means.
 */
const ARRIVING_FINISH: Record<string, BookFinish> = {
  colorir: 'coloring',
  ler: 'reading',
}

export default async function CreatePage({
  params,
  searchParams,
}: PageProps<'/[locale]/criar'>) {
  const { locale } = await params
  const { livro } = await searchParams

  // Anything unrecognised falls through to undefined, which opens the wizard
  // on its first screen — a mistyped link asks the question instead of
  // guessing an answer on the customer's behalf.
  const initialFinish =
    typeof livro === 'string' ? ARRIVING_FINISH[livro] : undefined

  return (
    <main className="flex flex-1 flex-col">
      <Wizard
        dict={getDictionary(locale)}
        locale={normalizeLocale(locale)}
        initialFinish={initialFinish}
      />
    </main>
  )
}
