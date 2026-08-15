'use client'

import { useEffect, useState } from 'react'
import type { Dictionary } from '@/lib/i18n'
import type { CoverKind, Order } from '@/lib/types'
import { Button, ErrorNote } from './ui'

/** Polls while the pages are drawn, then offers the finished PDF. */
export function BookProgress({
  dict,
  orderId,
}: {
  dict: Dictionary
  orderId: string
}) {
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [regenerating, setRegenerating] = useState<number | null>(null)
  const [choosingCover, setChoosingCover] = useState<CoverKind | null>(null)
  /** Bumped after a redraw so the poller restarts and picks the page up. */
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    async function poll() {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? dict.common.error)
        if (cancelled) return

        setOrder(data as Order)
        setError(null)

        // Stop polling once the book has settled, or once it is waiting on the
        // customer — nothing moves again until they pick a cover.
        const settled =
          data.status === 'ready' ||
          data.status === 'failed' ||
          data.status === 'choosing-cover'
        if (!settled) timer = setTimeout(poll, 3000)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : dict.common.error)
        timer = setTimeout(poll, 6000)
      }
    }

    void poll()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [orderId, dict.common.error, reloadKey])

  /** Redraws one page. The characters are already fixed, so only this scene changes. */
  async function regenerate(index: number) {
    setRegenerating(index)
    setError(null)
    try {
      const res = await fetch(
        `/api/orders/${orderId}/pages/${index}/regenerate`,
        { method: 'POST' },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? dict.common.error)
      // Restart polling: the order has gone back to "rendering".
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.common.error)
    } finally {
      setRegenerating(null)
    }
  }

  /** Locks in a cover and lets the page render start. */
  async function pickCover(kind: CoverKind) {
    setChoosingCover(kind)
    setError(null)
    try {
      const res = await fetch(`/api/orders/${orderId}/cover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? dict.common.error)
      // The order has left 'choosing-cover', so polling can pick up again.
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.common.error)
    } finally {
      setChoosingCover(null)
    }
  }

  const renders = order?.renders ?? []
  const selectedRender = renders.find((r) => r.index === selected)
  const done = renders.filter((r) => r.status === 'done').length
  const failed = renders.filter((r) => r.status === 'failed').length
  const total = renders.length
  const ready = order?.status === 'ready'

  const pickingCover = order?.status === 'choosing-cover'
  const frontCovers = (order?.covers ?? []).filter((c) => c.kind !== 'back')

  const stage = !order?.storyboard
    ? dict.progress.writing
    : order.status === 'covers'
      ? dict.progress.covers
      : pickingCover
        ? dict.progress.coverReady
        : total === 0
          ? dict.progress.characters
          : dict.progress.pages

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-16">
      <h1 className="font-serif text-3xl text-ink sm:text-4xl">
        {ready ? dict.progress.done : dict.progress.title}
      </h1>
      <p className="mt-2 text-ink-soft">
        {ready ? order?.storyboard?.title : dict.progress.subtitle}
      </p>

      {error && (
        <div className="mt-6">
          <ErrorNote message={error} />
        </div>
      )}
      {order?.status === 'failed' && order.error && (
        <div className="mt-6">
          <ErrorNote message={order.error} />
        </div>
      )}

      {pickingCover && (
        <section className="mt-9">
          <h2 className="font-serif text-xl text-ink">
            {dict.progress.chooseCoverTitle}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {dict.progress.chooseCoverHint}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {frontCovers.map((cover) => {
              const kind = cover.kind as CoverKind
              const usable = cover.status === 'done' && Boolean(cover.imageUrl)
              return (
                <div
                  key={cover.kind}
                  className="overflow-hidden rounded-2xl border border-line bg-paper-raised"
                >
                  <div className="flex aspect-[3/4] items-center justify-center bg-paper">
                    {cover.imageUrl ? (
                      // Not next/image: these live under /api/files and change
                      // per order, so there is nothing to optimise ahead of time.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover.imageUrl}
                        alt={dict.progress.coverKinds[kind].label}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <p className="px-4 text-center text-xs text-ink-soft">
                        {cover.error ?? dict.progress.coverFailed}
                      </p>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-serif text-lg text-ink">
                      {dict.progress.coverKinds[kind].label}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {dict.progress.coverKinds[kind].description}
                    </p>
                    <div className="mt-4">
                      <Button
                        disabled={!usable || choosingCover !== null}
                        onClick={() => void pickCover(kind)}
                      >
                        {choosingCover === kind
                          ? dict.progress.choosingCover
                          : dict.progress.chooseThis}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="mt-9 rounded-2xl border border-line bg-paper-raised p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink">{stage}</span>
          {total > 0 && (
            <span className="text-sm tabular-nums text-ink-soft">
              {done}/{total}
            </span>
          )}
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: total > 0 ? `${(done / total) * 100}%` : '8%' }}
          />
        </div>

        {total > 0 && (
          <ul className="mt-6 grid grid-cols-6 gap-2 sm:grid-cols-8">
            {renders.map((r) => (
              <li key={r.index}>
                <button
                  type="button"
                  onClick={() => setSelected(r.index)}
                  title={r.error ?? `${dict.progress.page} ${r.index}`}
                  className={`flex aspect-[3/4] w-full items-end justify-center rounded border pb-1 text-[10px] leading-none transition ${
                    selected === r.index ? 'ring-2 ring-accent ring-offset-1' : ''
                  } ${
                    r.status === 'done'
                      ? 'border-accent bg-accent-soft text-accent'
                      : r.status === 'failed'
                        ? 'border-accent bg-accent/20 text-accent'
                        : r.status === 'generating'
                          ? 'animate-pulse border-accent/40 bg-paper text-ink-soft'
                          : 'border-line bg-paper text-ink-soft'
                  }`}
                >
                  {r.index}
                </button>
              </li>
            ))}
          </ul>
        )}

        {selectedRender && (
          <div className="mt-5 rounded-xl border border-line bg-paper p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">
                {dict.progress.page} {selectedRender.index}
              </p>
              <Button
                variant="ghost"
                disabled={
                  regenerating === selectedRender.index ||
                  selectedRender.status === 'generating'
                }
                onClick={() => void regenerate(selectedRender.index)}
              >
                {regenerating === selectedRender.index
                  ? dict.progress.regenerating
                  : dict.progress.regenerate}
              </Button>
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              {dict.progress.regenerateHint}
            </p>
            {selectedRender.error && (
              <p className="mt-2 text-xs text-accent">{selectedRender.error}</p>
            )}
          </div>
        )}

        {failed > 0 && (
          <p className="mt-4 text-sm text-ink-soft">
            {failed} × {dict.common.error}
          </p>
        )}
      </div>

      {(ready || done > 0) && (
        <div className="mt-8 flex gap-3">
          <a
            href={`/api/orders/${orderId}/pdf`}
            className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:brightness-110"
          >
            {dict.progress.download}
          </a>
          <Button variant="ghost" onClick={() => window.location.reload()}>
            {dict.common.tryAgain}
          </Button>
        </div>
      )}
    </div>
  )
}
