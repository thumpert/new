'use client'

import { useMemo, useState } from 'react'
import { Flipbook, type FlipbookLabels } from './Flipbook'
import type { BookSheet } from '@/lib/book-sheets'

export interface ExampleVariant {
  styleId: string
  label: string
  title: string
  sheets: BookSheet[]
}

/**
 * The same book, in every style it was actually drawn in.
 *
 * Switching styles remounts the Flipbook (via `key`) rather than mutating it
 * in place: StPageFlip owns its own cloned DOM once it starts (see
 * Flipbook.tsx), and handing it a new set of sheets without tearing it down
 * first is how a flipbook ends up showing the old book with the new title.
 */
export function ExampleReader({
  variants,
  styleLabel,
  labels,
}: {
  variants: ExampleVariant[]
  styleLabel: string
  labels: FlipbookLabels
}) {
  const [styleId, setStyleId] = useState(variants[0]?.styleId)
  const current = useMemo(
    () => variants.find((v) => v.styleId === styleId) ?? variants[0],
    [variants, styleId],
  )

  if (!current) return null

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {variants.length > 1 && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
            {styleLabel}
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {variants.map((v) => (
              <button
                key={v.styleId}
                type="button"
                onClick={() => setStyleId(v.styleId)}
                aria-pressed={v.styleId === current.styleId}
                className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition ${
                  v.styleId === current.styleId
                    ? 'border-ink bg-accent text-[var(--cor-papel)]'
                    : 'border-line bg-paper-raised text-ink hover:border-ink'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Flipbook key={current.styleId} sheets={current.sheets} title={current.title} labels={labels} />
    </div>
  )
}
