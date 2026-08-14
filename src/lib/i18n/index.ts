import { DEFAULT_LOCALE, LOCALES, type Locale } from '../types'
import { pt, type Dictionary } from './pt'
import { en } from './en'

const dictionaries: Record<Locale, Dictionary> = { pt, en }

export function getDictionary(locale: string): Dictionary {
  return dictionaries[normalizeLocale(locale)]
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as string[]).includes(value)
}

/** Maps things like "pt-BR" or "en-US" onto a supported locale. */
export function normalizeLocale(value: string | undefined | null): Locale {
  if (!value) return DEFAULT_LOCALE
  const lower = value.toLowerCase()
  if (isLocale(lower)) return lower
  const base = lower.split('-')[0]
  return isLocale(base) ? base : DEFAULT_LOCALE
}

/** Picks the best supported locale out of an Accept-Language header. */
export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE
  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=')
      return { tag: tag.trim(), q: q ? Number(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { tag } of ranked) {
    const base = tag.toLowerCase().split('-')[0]
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}

export type { Dictionary }
export { LOCALES, DEFAULT_LOCALE }
export type { Locale }
