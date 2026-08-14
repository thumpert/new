import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DEFAULT_LOCALE, LOCALES } from './lib/types'

/**
 * Redirects locale-less paths onto the visitor's best supported locale so
 * every page lives under /pt or /en.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )
  if (hasLocale) return

  const locale = pickLocale(request.headers.get('accept-language'))
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

/**
 * Inlined rather than imported from lib/i18n: proxy code is deployed
 * separately and should not pull in the dictionaries.
 */
function pickLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return DEFAULT_LOCALE
  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=')
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { tag } of ranked) {
    const base = tag.split('-')[0]
    if ((LOCALES as string[]).includes(base)) return base
  }
  return DEFAULT_LOCALE
}

export const config = {
  // Skip Next internals, the API surface and anything with a file extension.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
