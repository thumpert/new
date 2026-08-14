import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, isLocale } from '@/lib/i18n'
import '../globals.css'

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
    <html lang={locale === 'pt' ? 'pt-BR' : 'en'} className="h-full">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
