import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExampleReader } from '@/components/ExampleReader'
import { bookSheets } from '@/lib/book-sheets'
import { EXAMPLE_ORDERS, EXAMPLE_STORY_ID } from '@/lib/examples'
import { getDictionary, normalizeLocale } from '@/lib/i18n'
import { getStory, say } from '@/lib/stories'
import { getOrder } from '@/lib/store'

/**
 * A real book, open for anyone deciding whether to make their own.
 *
 * Not a mock-up: every page here came out of the same pipeline a customer's
 * order does, for a made-up family off the dinosaur shelf. Seeing the thing
 * itself — the art, the page count, how the words sit under a picture —
 * answers more of the "what do I actually get" question than another
 * paragraph of copy would, which is the same bet the wizard's own reassurance
 * line makes one step earlier in the funnel.
 */
export default async function ExamplePage({ params }: PageProps<'/[locale]/exemplo'>) {
  const { locale } = await params
  const dict = getDictionary(locale)
  const lang = normalizeLocale(locale)
  const story = getStory(EXAMPLE_STORY_ID)
  if (!story) notFound()

  const entries = Object.entries(EXAMPLE_ORDERS) as [keyof typeof EXAMPLE_ORDERS, string][]
  const orders = await Promise.all(
    entries.map(async ([styleId, orderId]) => ({ styleId, order: await getOrder(orderId) })),
  )
  const ready = orders.filter((o) => o.order && bookSheets(o.order).length > 0)
  if (ready.length === 0) notFound()

  const variants = ready.map(({ styleId, order }) => ({
    styleId,
    label: dict.artStyles[styleId].label,
    title: order!.storyboard?.title ?? '',
    sheets: bookSheets(order!),
  }))

  const first = ready[0].order!
  const hero = first.brief.characters.find((c) => c.kind === 'person')
  const pageCount = first.storyboard?.pages.length ?? 0

  return (
    <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 pb-16 sm:px-11">
      <nav className="py-[18px]">
        <Link href={`/${lang}`} className="text-sm font-semibold text-ink-soft hover:text-ink">
          {dict.example.back}
        </Link>
      </nav>

      <header className="mx-auto max-w-[640px] pb-8 pt-2.5 text-center">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
          {dict.example.eyebrow}
        </p>
        <h1 className="font-serif text-[clamp(26px,3.6vw,40px)] font-extrabold leading-tight">
          {variants[0].title}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {dict.example.madeFor
            .replace('{name}', hero?.name ?? '')
            .replace('{pages}', String(pageCount))}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft text-pretty">
          {say(story.summary, first.brief)}
        </p>
        <p className="mt-3 text-xs text-ink-mute">{dict.example.hint}</p>
      </header>

      <ExampleReader
        variants={variants}
        styleLabel={dict.example.styleLabel}
        labels={dict.reader}
      />

      <section className="mx-auto mt-14 max-w-[560px] border-2 border-ink bg-paper-raised px-6 py-8 text-center" style={{ borderRadius: 'var(--raio-card)' }}>
        <h2 className="font-serif text-xl font-extrabold">{dict.example.ctaHeading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{dict.example.ctaBody}</p>
        <Link
          href={`/${lang}/criar`}
          className="mt-5 inline-block bg-accent px-6 py-3.5 text-sm font-bold text-[var(--cor-papel)] shadow-[var(--sombra-solida-primaria)] transition-[transform,box-shadow] duration-[120ms] hover:translate-y-0.5 hover:shadow-[0_3px_0_var(--giz-vermelho-sombra)]"
          style={{ borderRadius: 'var(--raio-botao)' }}
        >
          {dict.example.cta}
        </Link>
      </section>
    </main>
  )
}
