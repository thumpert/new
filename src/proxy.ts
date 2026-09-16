import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DEFAULT_LOCALE } from './lib/types'

/**
 * Puts every page under /pt.
 *
 * This used to negotiate Accept-Language across two site languages. There is
 * one now, so there is nothing to negotiate: a locale-less path is rewritten
 * onto /pt, and so is a path that still asks for the retired /en — an English
 * link handed out before the change lands on the Portuguese page rather than
 * on a 404.
 *
 * The prefix stays in the URL even though it can only hold one value. Orders
 * already placed have their book at /pt/livro/<id>, those links are out in
 * the world, and dropping the segment would break every one of them to save
 * three characters.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === `/${DEFAULT_LOCALE}` || pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    return
  }

  const url = request.nextUrl.clone()
  const retired = pathname.match(/^\/en(\/.*)?$/)
  url.pathname = retired
    ? `/${DEFAULT_LOCALE}${retired[1] ?? ''}`
    : `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  // Skip Next internals, the API surface and anything with a file extension.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
