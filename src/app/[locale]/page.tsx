import Image from 'next/image'
import Link from 'next/link'
import { getDictionary, normalizeLocale } from '@/lib/i18n'

/**
 * The page leads with the object.
 *
 * A stranger arriving here has no idea what a "personalized book" is, and no
 * sentence fixes that as fast as one real spread does: two pages from a book
 * that already exists, the words printed onto the picture the way they are
 * printed on paper. The argument for the product is made by showing the
 * product, and the copy beside it only has to say what is inside.
 *
 * The three steps below are numbered because the order is the product. Reading
 * the story before anything is drawn is not a feature that could sit anywhere
 * in the list — it is deliberately between choosing and drawing, and that is
 * where the money is saved.
 */
export default async function LandingPage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  const dict = getDictionary(locale)
  const lang = normalizeLocale(locale)

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16">
      <header className="flex items-center justify-between py-7">
        <span className="font-serif text-[15px] text-ink">{dict.meta.name}</span>
        <Link
          href={`/${lang}/criar`}
          className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:brightness-110"
        >
          {dict.landing.cta}
        </Link>
      </header>

      <div className="grid items-center gap-12 py-10 md:grid-cols-[1.05fr_.95fr] md:gap-14 md:py-16">
        <div className="flex flex-col items-start gap-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            {dict.landing.eyebrow}
          </p>
          <h1 className="font-serif text-4xl leading-[1.08] text-ink sm:text-5xl">
            {dict.landing.title}
          </h1>
          <p className="max-w-[52ch] text-[17px] leading-relaxed text-ink-soft">
            {dict.landing.subtitle}
          </p>
          <Link
            href={`/${lang}/criar`}
            className="rounded-full bg-accent px-8 py-4 font-medium text-white transition hover:brightness-110"
          >
            {dict.landing.cta}
          </Link>
        </div>

        {/* A real spread, laid out as the printed book lays it out: art to the
            edge, and the narration across the calm band the illustration was
            drawn to leave open.
            
            Tilted a degree, as a book left open on the bed rather than a
            product shot. Straightened on small screens, where the rotation
            only costs width. */}
        <figure className="m-0 grid grid-cols-2 overflow-hidden rounded-2xl bg-white shadow-[0_16px_40px_rgba(36,27,18,0.32)] md:-rotate-[1.2deg]">
          <Image
            src="/exemplo/pagina-1.jpg"
            alt={dict.landing.sampleAlt}
            width={760}
            height={1074}
            className="h-full w-full object-cover"
            priority
          />
          <div className="relative">
            <Image
              src="/exemplo/pagina-2.jpg"
              alt=""
              width={760}
              height={1074}
              className="h-full w-full object-cover"
              priority
            />
            <figcaption className="absolute inset-x-0 bottom-[8%] mx-auto max-w-[74%] text-center font-serif text-[11px] italic leading-snug text-ink">
              {dict.landing.sampleNarration}
            </figcaption>
          </div>
        </figure>
      </div>

      <section>
        <h2 className="sr-only">{dict.landing.how}</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {dict.landing.steps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl bg-paper-raised px-5 pb-5 pt-4.5"
            >
              <span className="block font-mono text-[11px] text-ink-soft/80">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 font-serif text-lg text-ink">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-10 text-xs text-ink-soft">{dict.landing.footnote}</p>
    </main>
  )
}
