/**
 * The mark: an open book with one page in line and one page painted.
 *
 * It is the product decision drawn once — a book to colour in, or a book to
 * read — which is the thing a stranger most needs to understand and the thing
 * a name alone cannot say. It was chosen over five other directions on the
 * test that decides marks: it is still legible at sixteen pixels, where an
 * ink drop says nothing specific and two coins say nothing at all.
 *
 * No 'use client'. This is static SVG, so it renders inside server components
 * and costs the browser nothing.
 *
 * The colours come from the design tokens rather than from literals, so the
 * mark can never drift from the rest of the system. The standalone favicon at
 * src/app/icon.svg is the one place that repeats the hex values, because a
 * file served on its own has no stylesheet to read them from — if a token
 * changes, that file changes with it.
 */
export function LogoMark({
  size = 26,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      style={{ display: 'block' }}
    >
      {/* Left page: line art, the book to colour in. */}
      <path
        d="M6 15C17 10 27 12 32 16.5V51C27 47 17 45 6 50Z"
        fill="var(--cor-branco)"
        stroke="var(--cor-tinta)"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      {/* Right page: painted, the book to read. */}
      <path
        d="M58 15C47 10 37 12 32 16.5V51C37 47 47 45 58 50Z"
        fill="var(--giz-vermelho)"
        stroke="var(--cor-tinta)"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      {/* Three strokes of narration on the page that is still blank. Dropped
          below 22px, where they close up into a smudge. */}
      {size >= 22 && (
        <path
          d="M12 25h12M12 31h9M12 37h12"
          stroke="var(--cor-tinta)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

/**
 * Mark plus wordmark, which is what the nav shows.
 *
 * Two-tone and tilted a degree and a half, per the system: nothing on the page
 * sits perfectly square, and the second half of the name is the one place the
 * brand spends red on something that is not a button.
 */
export function Logo({
  name,
  size = 26,
  className = '',
}: {
  /** The brand name. Split on the first space; the tail takes the accent. */
  name: string
  size?: number
  className?: string
}) {
  const space = name.indexOf(' ')
  const head = space === -1 ? '' : name.slice(0, space + 1)
  const tail = space === -1 ? name : name.slice(space + 1)

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span
        className="font-serif font-extrabold leading-none tracking-[-0.02em]"
        style={{
          fontSize: `${Math.round(size * 0.66)}px`,
          transform: 'rotate(var(--giro-logo))',
        }}
      >
        <span className="text-ink">{head}</span>
        <span className="text-accent">{tail}</span>
      </span>
    </span>
  )
}
