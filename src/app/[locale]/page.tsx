import Image from 'next/image'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { getDictionary, normalizeLocale } from '@/lib/i18n'

/**
 * The page leads with the object, and with the fact that the object is two
 * things.
 *
 * A stranger arriving here has no idea what a "personalized book" is, and no
 * sentence fixes that as fast as the thing itself does. So the stage in the
 * hero holds the SAME page drawn twice — once in black line, once painted —
 * which is the whole product decision in one picture: a book to colour in, or
 * a book to read. Two files of one scene make that argument; two files of two
 * different scenes would only look like a gallery.
 *
 * The three steps below are numbered because the order is the product.
 * Reading the story before anything is drawn is not a feature that could sit
 * anywhere in the list — it is deliberately between choosing and drawing, and
 * that is where the money is saved.
 *
 * No price anywhere. The handoff's home carries one, and the handoff's own
 * README marks it as a placeholder to confirm with the business; there is no
 * checkout in this product yet, and a price on a page that cannot take money
 * is a promise made by the design rather than by the company.
 */
export default async function LandingPage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  const dict = getDictionary(locale)
  const lang = normalizeLocale(locale)
  const { landing } = dict

  return (
    <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 pb-16 sm:px-11">
      <nav className="flex items-center justify-between py-[18px]">
        <Logo name={dict.meta.name} size={28} />
        <div className="flex items-center gap-4">
          <Link
            href={`/${lang}/criar`}
            className="inline-block bg-ink px-[18px] py-2.5 text-[13px] font-semibold text-[var(--cor-papel)] transition-transform duration-[120ms] hover:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--giz-amarelo)]"
            style={{
              borderRadius: '14px 12px 15px 11px',
              transform: 'rotate(var(--giro-botao))',
            }}
          >
            {landing.cta} →
          </Link>
        </div>
      </nav>

      {/* The stage takes the larger half now. The books ARE the argument —
          the same page in line and in colour — and they were losing to the
          type at 0.9fr, which made the one thing a stranger needs to see the
          smallest thing on the screen. */}
      <header className="grid items-center gap-6 pb-8 pt-2.5 md:grid-cols-[0.95fr_1.05fr]">
        <div className="order-1">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
            {landing.eyebrow}
          </p>

          {/* The signature: the same words twice, the lower layer hollow and
              the upper one painting itself in from the left. aria-hidden on
              the painted copy so a screen reader hears the heading once. */}
          <div className="titulo-vazado mb-4">
            <h1 className="m-0 font-serif text-[clamp(38px,6.2vw,72px)] font-extrabold leading-[0.98] tracking-[-0.02em] titulo-vazado__contorno">
              {landing.heroLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <div
              aria-hidden="true"
              className="m-0 font-serif text-[clamp(38px,6.2vw,72px)] font-extrabold leading-[0.98] tracking-[-0.02em] titulo-vazado__preenchimento"
            >
              {landing.heroLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </div>
          </div>

          <p className="mb-5 max-w-[46ch] text-[clamp(13px,1.1vw,16px)] leading-[1.65] text-ink-soft text-pretty">
            {landing.subtitle}
          </p>

          <Link
            href={`/${lang}/criar`}
            className="inline-block bg-accent px-[22px] py-3.5 text-sm font-bold text-[var(--cor-papel)] shadow-[var(--sombra-solida-primaria)] transition-[transform,box-shadow] duration-[120ms] hover:translate-y-0.5 hover:shadow-[0_3px_0_var(--giz-vermelho-sombra)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--giz-amarelo)]"
            style={{ borderRadius: 'var(--raio-botao)' }}
          >
            {landing.cta} →
          </Link>
        </div>

        {/* The stage. A yellow chalk blob behind, the two books overlapping in
            front of it, and the sticker on the corner. The books are the same
            scene so the pairing reads as one book in two finishes. */}
        <div className="relative order-2 grid min-h-[380px] place-items-center py-8 sm:min-h-[460px]">
          <div
            aria-hidden="true"
            className="absolute h-[260px] w-[260px] rounded-[46px] bg-[var(--giz-amarelo)] opacity-60 sm:h-[330px] sm:w-[330px]"
            style={{ transform: 'rotate(-6deg)' }}
          />
          <div className="relative flex items-center">
            <Image
              src="/styles/retro-storybook.png"
              alt={landing.lineBookAlt}
              width={720}
              height={964}
              priority
              className="w-[168px] -rotate-[7deg] rounded-[var(--raio-folha)] border-2 border-ink bg-sheet object-cover shadow-[var(--sombra-folha)] sm:w-[215px]"
            />
            <Image
              src="/styles/retro-storybook-colour.png"
              alt={landing.colourBookAlt}
              width={720}
              height={964}
              priority
              className="-ml-8 w-[168px] rotate-[var(--giro-livro)] rounded-[var(--raio-folha)] border-2 border-ink object-cover shadow-[var(--sombra-folha)] sm:-ml-10 sm:w-[215px]"
            />
            {/* Anchored to the books rather than to the stage. Pinned to the
                stage it drifted away from them as the stage grew, and a
                sticker floating in space is not a sticker. */}
            <span
              className="absolute -bottom-3 -right-3 rounded-[var(--raio-pill)] border-2 border-ink bg-[var(--giz-verde)] px-3.5 py-2 text-[13px] font-bold leading-none text-[#12331b]"
              style={{ transform: 'rotate(var(--giro-adesivo))' }}
            >
              {landing.sticker}
            </span>
          </div>
        </div>
      </header>

      {/* The choice, said out loud. It is the first question the wizard asks
          and the one that changes the most, so the home answers it before the
          customer has to guess which product this is. */}
      <section className="-mx-6 bg-white/70 px-6 py-8 sm:-mx-11 sm:px-11">
        <h2 className="font-serif text-[clamp(21px,2.4vw,32px)] font-extrabold leading-tight">
          {landing.kinds.heading}
        </h2>
        <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-ink-soft">
          {landing.kinds.body}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            {
              ...landing.kinds.colouring,
              art: '/styles/retro-storybook.png',
              alt: landing.lineBookAlt,
              tile: 'var(--tile-areia)',
              ink: 'var(--tile-areia-ink)',
              giro: 'giro-a',
            },
            {
              ...landing.kinds.reading,
              art: '/styles/retro-storybook-colour.png',
              alt: landing.colourBookAlt,
              tile: 'var(--tile-verde)',
              ink: 'var(--tile-verde-ink)',
              giro: 'giro-b',
            },
          ].map((kind) => (
            <article
              key={kind.label}
              className={`${kind.giro} overflow-hidden border-2 border-ink transition-transform duration-[180ms] hover:rotate-0`}
              style={{
                borderRadius: 'var(--raio-tile)',
                background: kind.tile,
              }}
            >
              <div className="flex h-40 items-center justify-center border-b-2 border-ink bg-sheet">
                <Image
                  src={kind.art}
                  alt={kind.alt}
                  width={720}
                  height={964}
                  className="h-full w-auto object-contain"
                />
              </div>
              <div className="px-5 py-4">
                <h3
                  className="font-serif text-lg font-extrabold"
                  style={{ color: kind.ink }}
                >
                  {kind.label}
                </h3>
                <p className="mt-1 text-sm leading-snug text-ink">{kind.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-[clamp(21px,2.4vw,32px)] font-extrabold leading-tight">
          {landing.how}
        </h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {landing.steps.map((step, i) => (
            <li
              key={step.title}
              className="border-2 border-ink bg-paper-raised px-5 pb-5 pt-4"
              style={{ borderRadius: 'var(--raio-card)' }}
            >
              <span
                className="inline-block rounded-[var(--raio-pill)] bg-[var(--giz-amarelo)] px-2.5 py-1 text-[11px] font-bold leading-none text-[#5a4413]"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 font-serif text-lg font-extrabold text-ink">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-10 text-xs text-ink-mute">{landing.footnote}</p>
    </main>
  )
}
