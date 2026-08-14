import Link from 'next/link'
import { getDictionary, normalizeLocale } from '@/lib/i18n'

export default async function LandingPage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  const dict = getDictionary(locale)
  const lang = normalizeLocale(locale)

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-5 py-16">
      <h1 className="max-w-3xl font-serif text-4xl leading-tight text-ink sm:text-6xl">
        {dict.landing.title}
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
        {dict.landing.subtitle}
      </p>

      <div className="mt-9">
        <Link
          href={`/${lang}/criar`}
          className="inline-block rounded-full bg-accent px-8 py-4 font-medium text-white transition hover:brightness-110"
        >
          {dict.landing.cta}
        </Link>
      </div>

      <section className="mt-20">
        <h2 className="text-xs uppercase tracking-wide text-ink-soft">
          {dict.landing.how}
        </h2>
        <ol className="mt-5 grid gap-6 sm:grid-cols-3">
          {dict.landing.steps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-line bg-paper-raised p-5"
            >
              <span className="font-serif text-2xl text-accent">{i + 1}</span>
              <h3 className="mt-2 font-serif text-lg text-ink">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
