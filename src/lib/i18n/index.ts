import { DEFAULT_LOCALE, LOCALES, type Locale } from '../types'
import { pt, type Dictionary } from './pt'

/**
 * One dictionary, because the site is read in one language.
 *
 * The lookup survives the change rather than being flattened into a constant:
 * every page already asks for the dictionary by locale, and an order stored
 * before the change can still arrive carrying 'en'. normalizeLocale answers
 * 'pt' for anything unrecognised, so that order opens in Portuguese instead
 * of handing a page `undefined`.
 */
const dictionaries: Record<Locale, Dictionary> = { pt }

export function getDictionary(locale: string): Dictionary {
  return dictionaries[normalizeLocale(locale)]
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as string[]).includes(value)
}

/** Maps things like "pt-BR", or a retired locale, onto a supported one. */
export function normalizeLocale(value: string | undefined | null): Locale {
  if (!value) return DEFAULT_LOCALE
  const lower = value.toLowerCase()
  if (isLocale(lower)) return lower
  const base = lower.split('-')[0]
  return isLocale(base) ? base : DEFAULT_LOCALE
}

export type { Dictionary }
export { LOCALES, DEFAULT_LOCALE }
export type { Locale }
