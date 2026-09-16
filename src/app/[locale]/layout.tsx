import type { Metadata } from 'next'
import { Baloo_2, Nunito } from 'next/font/google'
import { notFound } from 'next/navigation'
import { getDictionary, isLocale } from '@/lib/i18n'
import '../globals.css'

/*
 * Self-hosted rather than fetched from Google at page load. The handoff names
 * the Google Fonts URL, but next/font downloads the files at build time and
 * serves them from our own origin, which is the same faces without a second
 * DNS lookup in front of the first paint — and without the site depending on
 * a third party staying up.
 *
 * The weights are exactly the ones the system uses. Asking for more would
 * cost bytes nothing in the design refers to.
 */
const fonteTitulo = Baloo_2({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--fonte-titulo',
  display: 'swap',
})

const fonteCorpo = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--fonte-corpo',
  display: 'swap',
})

export async function generateMetadata({
  params,
}: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  const dict = getDictionary(locale)
  return {
    title: dict.meta.name,
    description: dict.meta.tagline,
  }
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  return (
    <html
      lang={locale === 'pt' ? 'pt-BR' : 'en'}
      className={`h-full ${fonteTitulo.variable} ${fonteCorpo.variable}`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
