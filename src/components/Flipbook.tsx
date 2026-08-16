'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PageFlip } from 'page-flip'
import type { BookSheet } from '@/lib/book-sheets'

/**
 * The book, on screen, turning like a book.
 *
 * This is the whole point of the digital edition: the same twelve pages the
 * printer would get, readable the moment they are paid for instead of two
 * weeks later. It costs nothing to make — the pages are already drawn — and a
 * present that arrives now is worth more than the same present in a fortnight.
 *
 * The layout deliberately copies the PDF rather than improving on it: art
 * anchored to the top, the narration in a narrow centred column across its
 * calm lower band, photograph pages mounted with their words beneath. Two
 * renderings of one book. A reader that arranged the page more handsomely
 * than the printed copy would just be a different object.
 */

export interface FlipbookLabels {
  previous: string
  next: string
  /** "3 of 15" — the two numbers are substituted for {n} and {total}. */
  counter: string
}

interface Props {
  sheets: BookSheet[]
  title: string
  labels: FlipbookLabels
}

export function Flipbook({ sheets, title, labels }: Props) {
  const sourceRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const flipRef = useRef<PageFlip | null>(null)
  const [current, setCurrent] = useState(0)
  const [total, setTotal] = useState(sheets.length)

  useEffect(() => {
    const source = sourceRef.current
    const host = hostRef.current
    if (!source || !host) return

    let cancelled = false

    // StPageFlip is handed its own copy of the markup, not the nodes React
    // rendered. The library rewrites whatever it is given — wrapping, moving
    // and transforming every sheet — and two things rewriting the same nodes
    // is how a flipbook ends up blank after an unrelated re-render.
    for (const node of Array.from(source.children)) {
      host.appendChild(node.cloneNode(true))
    }

    // Loaded on demand: it is a browser-only library and there is no reason
    // for the rest of the site to carry it.
    import('page-flip').then(({ PageFlip: Flip }) => {
      if (cancelled) return

      const flip = new Flip(host, {
        // A4's proportions, so a sheet on screen is the sheet in the book.
        width: 420,
        height: 594,
        size: 'stretch',
        minWidth: 280,
        maxWidth: 520,
        minHeight: 396,
        maxHeight: 735,
        showCover: true,
        // One page at a time when the screen is narrow, which is where most
        // people will open the link they were sent.
        usePortrait: true,
        mobileScrollSupport: true,
        maxShadowOpacity: 0.4,
      })

      flip.loadFromHTML(host.querySelectorAll('.flip-sheet'))
      flip.on('flip', (event) => setCurrent(event.data))
      flipRef.current = flip
      setTotal(flip.getPageCount())
    })

    return () => {
      cancelled = true
      flipRef.current?.destroy()
      flipRef.current = null
      // The host is ours alone, so emptying it is safe and leaves nothing of
      // the library's wrapper behind for a second mount to trip over.
      host.replaceChildren()
    }
  }, [])

  const prev = useCallback(() => flipRef.current?.flipPrev(), [])
  const next = useCallback(() => flipRef.current?.flipNext(), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* React renders the sheets here and keeps owning them; the copies are
          what the library gets. Hidden from view and from screen readers,
          which read the real book to the right of it. */}
      <div ref={sourceRef} hidden aria-hidden="true">
        {sheets.map((sheet, i) => (
          <Sheet key={i} sheet={sheet} title={title} />
        ))}
      </div>

      {/* Wide enough that the type, which is sized in the printed book's own
          proportions, is still comfortable to read. A narrower book stays
          faithful but turns the narration into 8px. */}
      <div ref={hostRef} className="w-full max-w-[1060px]" />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={prev}
          disabled={current === 0}
          className="rounded-full px-4 py-2 text-sm text-ink-soft transition hover:text-ink disabled:opacity-30"
        >
          ← {labels.previous}
        </button>
        <span className="text-xs tabular-nums text-ink-soft">
          {labels.counter
            .replace('{n}', String(current + 1))
            .replace('{total}', String(total))}
        </span>
        <button
          type="button"
          onClick={next}
          disabled={current >= total - 1}
          className="rounded-full px-4 py-2 text-sm text-ink-soft transition hover:text-ink disabled:opacity-30"
        >
          {labels.next} →
        </button>
      </div>
    </div>
  )
}

function Sheet({ sheet, title }: { sheet: BookSheet; title: string }) {
  // container-type lives in a class, not an inline style: StPageFlip writes
  // its own transforms into every sheet's style attribute, and an inline
  // declaration there does not survive.
  //
  // inline-size rather than size, because only a definite width is needed for
  // the cqw units below and a definite width is the one thing every sheet
  // always has. Asking for size as well means any sheet the library has not
  // laid out yet is not a valid container at all, and its text silently falls
  // back to sizing against the viewport — which renders it several times too
  // large.
  const base =
    'flip-sheet relative overflow-hidden bg-white text-ink [backface-visibility:hidden] [container-type:inline-size]'

  // Everything on the sheet is sized against the sheet, never in pixels. The
  // printed book scales its type with the page; a screen does not, so 13px
  // type on a 300px-tall sheet is two and a half times the size it is in the
  // book, and the narration climbs off its band and onto the picture. The
  // proportions below are the printed ones divided by A4's width.

  if (sheet.kind === 'dedication') {
    return (
      <div className={base}>
        <div className="flex h-full items-center justify-center px-[14%]">
          <p className="text-center font-serif text-[2.5cqw] italic leading-[1.6]">
            {sheet.narration}
          </p>
        </div>
      </div>
    )
  }

  // Covers are the one place the art is allowed to fill the sheet edge to
  // edge whatever the finish: they were composed for it, and they carry no
  // words of ours.
  if (sheet.kind === 'cover' || sheet.kind === 'back') {
    return (
      <div className={base}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sheet.imageUrl}
          alt={title}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  if (sheet.mounted) {
    return (
      <div className={base}>
        <div className="flex h-full flex-col">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sheet.imageUrl}
            alt={sheet.narration ?? ''}
            className="min-h-0 flex-1 object-contain px-[6%] pt-[6%]"
          />
          <Words sheet={sheet} className="px-[8%] pb-[7%] pt-[2%]" />
        </div>
        <PageNumber n={sheet.number} />
      </div>
    )
  }

  return (
    <div className={base}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sheet.imageUrl}
        alt={sheet.narration ?? ''}
        className="h-full w-full object-cover"
      />
      {/* Anchored by its top and flowing down, which is what the printed page
          does: the first line lands in a fixed place and extra lines go
          further into the band. Anchoring the bottom instead pushes a long
          narration upward, out of the calm band and onto whatever the
          illustrator drew above it. */}
      <div className="absolute inset-x-0 top-[86.5%]">
        <Words sheet={sheet} />
      </div>
      <PageNumber n={sheet.number} />
    </div>
  )
}

function Words({ sheet, className = '' }: { sheet: BookSheet; className?: string }) {
  return (
    <div className={className}>
      {/* 13pt of A4's 595pt width, and the same narrow column the printed
          book uses — a full-width line runs off the calm part and into
          whatever scenery is at the edges. */}
      <p className="mx-auto max-w-[54%] text-center font-serif text-[2.18cqw] italic leading-[1.46]">
        {sheet.narration}
      </p>
      {sheet.narrationSecondary && (
        <p className="mx-auto mt-[1%] max-w-[54%] text-center font-serif text-[1.68cqw] leading-[1.4] text-ink-soft">
          {sheet.narrationSecondary}
        </p>
      )}
    </div>
  )
}

function PageNumber({ n }: { n?: number }) {
  if (!n) return null
  return (
    <span className="absolute inset-x-0 bottom-[3.4%] text-center text-[1.51cqw] text-ink-soft">
      {n}
    </span>
  )
}
