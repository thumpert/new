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
  variant?: 'primary' | 'dark' | 'ghost' | 'quiet'
  disabled?: boolean
  className?: string
}) {
  /*
   * The shadow is solid and coloured, never blurred — rule 3 of the system,
   * and the single detail that makes a button look drawn rather than
   * rendered. Hover presses it down: the button moves 2px into its own
   * shadow and the shadow shortens to match, which is a thing made of paper
   * being pushed, not a colour change.
   */
  const styles = {
    primary:
      'bg-accent text-[var(--cor-papel)] shadow-[var(--sombra-solida-primaria)] hover:shadow-[0_3px_0_var(--giz-vermelho-sombra)] disabled:bg-line disabled:text-ink-soft disabled:shadow-none',
    dark: 'bg-ink text-[var(--cor-papel)] shadow-[var(--sombra-solida-escura)] hover:shadow-[0_3px_0_var(--cor-tinta-sombra)] disabled:bg-line disabled:text-ink-soft disabled:shadow-none',
    ghost:
      'border-2 border-ink bg-paper-raised text-ink hover:bg-[var(--giz-amarelo)] disabled:border-line disabled:text-ink-faint',
    quiet:
      'text-ink-soft hover:text-ink border-b-2 border-[var(--giz-amarelo)] rounded-none pb-1 px-1',
  }[variant]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={variant === 'quiet' ? undefined : { borderRadius: 'var(--raio-botao)' }}
      className={`px-6 py-3.5 text-sm font-bold transition-[transform,box-shadow] duration-[120ms] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--giz-amarelo)] disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
        variant === 'quiet' ? '' : 'hover:translate-y-0.5'
      } ${styles} ${className}`}
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
      style={{ borderRadius: 'var(--raio-card)' }}
      /*
       * Every drawn surface gets a 2px ink border, not a grey one — rule 2.
       * Selection is carried by the yellow chalk fill rather than by a colour
       * change in the border, because the border is already as dark as it
       * gets and a selected card has to be legible from across the grid.
       */
      className={`flex w-full flex-col gap-1 border-2 border-ink text-left transition-transform duration-[180ms] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--giz-amarelo)] ${
        sample ? 'overflow-hidden p-0' : 'px-5 py-4'
      } ${
        selected
          ? 'bg-[var(--giz-amarelo)] text-[#5a4413]'
          : 'bg-paper-raised hover:-translate-y-0.5'
      }`}
    >
      {sample && (
        // The samples are line art on white, so they need a white plate of
        // their own — on the cream page background they would look grubby.
        // The plate keeps its height if the file is missing, so a card without
        // its sample yet is a blank frame rather than a collapsed layout.
        <span className="flex h-44 items-center justify-center border-b-2 border-ink bg-sheet">
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
          {/* Selected, the card fills with yellow chalk and the text goes to
              the dark brown the system pairs with it. The inner spans have to
              defer to that, or they keep their own ink and the pairing that
              was measured for contrast never actually happens. */}
          <span
            className={`font-serif text-lg ${selected ? '' : 'text-ink'}`}
          >
            {label}
          </span>
          {meta && (
            <span className={`text-xs ${selected ? 'opacity-80' : 'text-ink-soft'}`}>
              {meta}
            </span>
          )}
        </span>
        {description && (
          <span
            className={`text-sm leading-snug ${selected ? 'opacity-90' : 'text-ink-soft'}`}
          >
            {description}
          </span>
        )}
        {example && (
          // Set apart with a rule and italics so it reads as a specimen of the
          // voice rather than as more instructions about it. Line breaks in the
          // string are meaningful here — these are lines, not a paragraph.
          <span
            className={`mt-2 block border-l-2 pl-3 text-sm italic leading-relaxed whitespace-pre-line ${
              selected ? 'border-[#5a4413]/30' : 'border-[var(--giz-amarelo)] text-ink/75'
            }`}
          >
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
        <footer className="mt-10 flex items-center gap-4 border-t-2 border-line pt-6">
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
  'w-full rounded-[var(--raio-folha)] border-2 border-ink bg-sheet px-4 py-3 text-ink placeholder:text-ink-faint outline-none transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--giz-amarelo)]'

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
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-mute">
        {stepLabel} {current} {ofLabel} {total}
      </p>
      {/* 5px and pill-shaped, per the system's step bar. Thicker than the
          hairline it replaces because it now sits on a grained paper that
          swallows a 1px rule. */}
      <div className="h-[5px] w-full overflow-hidden rounded-[var(--raio-pill)] bg-line">
        <div
          className="h-full rounded-[var(--raio-pill)] bg-accent transition-all duration-300"
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
      // Full ink on the pink tile, never accent-on-accent: rule 1 says text
      // is always full-strength ink on paper or on a tile, and a red message
      // on a red-tinted ground is the exact thing it forbids.
      className="rounded-[var(--raio-card)] border-2 border-ink bg-accent-soft px-4 py-3 text-sm font-semibold text-ink"
    >
      {message}
    </p>
  )
}
