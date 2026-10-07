/**
 * The one price in the product.
 *
 * In cents so it is never a floating-point amount by the time it reaches a
 * payment API — R$89,90 as `89.90` has already bitten one integration
 * somewhere into rounding to `89.89999999999999`.
 */
export const BOOK_PRICE_CENTS = 200

/** `BOOK_PRICE_CENTS` as the decimal reais a payment API actually wants. */
export const BOOK_PRICE_BRL = BOOK_PRICE_CENTS / 100

/** `BOOK_PRICE_CENTS`, formatted for a screen: "R$ 89,90". */
export const BOOK_PRICE_LABEL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(BOOK_PRICE_BRL)
