'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'

/** Shared visual primitives for the wizard. */

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'ghost' | 'quiet'
  disabled?: boolean
  className?: string
}) {
  const styles = {
    primary:
      'bg-accent text-white hover:brightness-110 disabled:bg-line disabled:text-ink-soft',
    ghost:
      'border border-line bg-paper-raised text-ink hover:border-accent hover:text-accent',
    quiet: 'text-ink-soft hover:text-ink underline underline-offset-4',
  }[variant]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-6 py-3 text-sm font-medium transition disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function OptionCard({
  label,
  description,
  selected,
  onSelect,
  meta,
  sample,
  example,
}: {
  label: string
  description?: string
  selected: boolean
  onSelect: () => void
  meta?: string
  /** Example drawing, shown above the label. Used by the art style picker. */
  sample?: string
  /**
   * A few lines written in this option's own voice, shown under the
   * description. Used by the narrator picker, where an adjective like
   * "playful" says far less than two lines of the thing itself.
   */
  example?: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full flex-col gap-1 rounded-2xl border text-left transition ${
        sample ? 'overflow-hidden p-0' : 'px-5 py-4'
      } ${
        selected
          ? 'border-accent bg-accent-soft'
          : 'border-line bg-paper-raised hover:border-accent/50'
      }`}
    >
      {sample && (
        // The samples are line art on white, so they need a white plate of
        // their own — on the cream page background they would look grubby.
        // The plate keeps its height if the file is missing, so a card without
        // its sample yet is a blank frame rather than a collapsed layout.
        <span className="flex h-44 items-center justify-center border-b border-line bg-white">
          <Image
            src={sample}
            alt=""
            // Intrinsic size of the checked-in samples; the card scales them
            // down by height, so this only fixes the aspect ratio.
            width={720}
            height={960}
            className="block h-full w-auto object-contain"
          />
        </span>
      )}
      <span className={sample ? 'flex flex-col gap-1 px-5 py-4' : 'contents'}>
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-serif text-lg text-ink">{label}</span>
          {meta && <span className="text-xs text-ink-soft">{meta}</span>}
        </span>
        {description && (
          <span className="text-sm leading-snug text-ink-soft">
            {description}
          </span>
        )}
        {example && (
          // Set apart with a rule and italics so it reads as a specimen of the
          // voice rather than as more instructions about it. Line breaks in the
          // string are meaningful here — these are lines, not a paragraph.
          <span className="mt-2 block border-l-2 border-line pl-3 font-serif text-sm italic leading-relaxed whitespace-pre-line text-ink/75">
            {example}
          </span>
        )}
      </span>
    </button>
  )
}

export function StepShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="step-enter flex flex-1 flex-col">
      <header className="mb-7">
        <h1 className="font-serif text-3xl leading-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-xl text-ink-soft">{subtitle}</p>
        )}
      </header>
      <div className="flex-1">{children}</div>
      {footer && (
        <footer className="mt-10 flex items-center gap-4 border-t border-line pt-6">
          {footer}
        </footer>
      )}
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-soft">{hint}</span>}
    </label>
  )
}

const inputBase =
  'w-full rounded-xl border border-line bg-paper-raised px-4 py-3 text-ink placeholder:text-ink-soft/60 outline-none transition focus:border-accent'

export function TextInput({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
}) {
  return (
    <input
      type="text"
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputBase}
    />
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} resize-y leading-relaxed`}
    />
  )
}

export function Progress({
  current,
  total,
  stepLabel,
  ofLabel,
}: {
  current: number
  total: number
  stepLabel: string
  ofLabel: string
}) {
  return (
    <div className="mb-10">
      <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">
        {stepLabel} {current} {ofLabel} {total}
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent"
    >
      {message}
    </p>
  )
}
