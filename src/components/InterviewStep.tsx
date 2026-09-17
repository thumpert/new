'use client'

import { useMemo, useState } from 'react'
import type { Dictionary } from '@/lib/i18n'
import type { InterviewQuestion } from '@/lib/types'
import { Button } from './ui'

/**
 * The interview, written as a conversation.
 *
 * It used to be a themed block per screen: three questions stacked in one
 * panel, each with its own textarea. That worked and read as a form, which is
 * the one thing this screen cannot afford — the product's whole claim is "we
 * ask", and a wall of boxes is not somebody asking.
 *
 * So: one question at a time, arriving in a bubble, with everything already
 * said kept above it. That last part is the reason to prefer this over simply
 * paginating, and it is not decoration. The questions of a pre-written story
 * refer to each other — the places in the city, where the animal sleeps, what
 * the room looks like — and being able to see what you answered two questions
 * ago is what stops the third answer contradicting the first.
 *
 * The themes survive as dividers between questions rather than as pages. The
 * grouping was always a signal about what the next few questions are about,
 * and a divider says that without costing a screen.
 */
export function InterviewStep({
  dict,
  questions,
  answers,
  onAnswer,
}: {
  dict: Dictionary
  questions: InterviewQuestion[]
  answers: Record<string, string>
  onAnswer: (questionId: string, answer: string) => void
}) {
  const copy = dict.wizard.interview
  const [index, setIndex] = useState(0)
  const [listOpen, setListOpen] = useState(false)

  // Kept in the order they arrived. The grouping is read off the sequence
  // rather than restructured into it, so a question never moves.
  const ordered = useMemo(
    () => questions.map((q) => ({ ...q, group: q.group?.trim() || '' })),
    [questions],
  )

  const current = ordered[index]
  if (!current) return null

  const answered = ordered.filter((q) => answers[q.id]?.trim()).length
  const history = ordered.slice(0, index)

  return (
    <div>
      {/* Barra da direção 7a: mostra a posição na entrevista. A contagem de
          respondidas é uma coisa diferente — dá para pular perguntas — então
          fica como legenda à parte, não escondida atrás da barra. */}
      <div className="mb-3 flex items-center gap-3">
        <div
          className="h-3 flex-1 overflow-hidden rounded-[var(--raio-pill)]"
          style={{ background: 'var(--trilha-progresso)' }}
        >
          <div
            className="h-full rounded-[var(--raio-pill)] transition-all duration-300"
            style={{
              width: `${((index + 1) / ordered.length) * 100}%`,
              background: 'var(--cor-tinta)',
            }}
          />
        </div>
        <span className="text-[13px] font-extrabold whitespace-nowrap text-ink">
          {index + 1} / {ordered.length}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {answered}/{ordered.length} {copy.answered}
        </p>
        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="border-b-2 border-[var(--giz-amarelo)] pb-0.5 text-sm font-semibold text-ink-soft hover:text-ink"
        >
          {copy.allQuestions}
        </button>
      </div>

      <section
        className="border-2 border-ink bg-paper-raised p-5 sm:p-6"
        style={{
          borderRadius: 'var(--raio-3d-cartao)',
          boxShadow: 'var(--sombra-3d-cartao)',
        }}
      >
        {history.map((question, i) => (
          <Exchange
            key={question.id}
            dict={dict}
            question={question}
            answer={answers[question.id] ?? ''}
            showDivider={question.group !== (ordered[i - 1]?.group ?? null)}
            onJump={() => setIndex(i)}
          />
        ))}

        {current.group &&
          current.group !== (ordered[index - 1]?.group ?? null) && (
            <Divider title={current.group} />
          )}

        {/* The question being asked. Warmer and larger than the ones behind
            it, so the eye lands here on a screen that grows as it is used. */}
        <div
          className="max-w-[86%] rounded-[16px_16px_16px_4px] border-2 border-ink bg-[var(--tile-areia)] px-4 py-3.5 sm:max-w-[74%]"
          style={{ transform: 'rotate(-0.5deg)' }}
        >
          <p className="font-bold leading-snug text-[#5a4413]">
            {current.question}
          </p>
          {current.hint && (
            <p className="mt-1.5 text-[13px] leading-snug text-[#7a6634]">
              {current.hint}
            </p>
          )}
        </div>

        <div className="mt-3.5">
          <textarea
            value={answers[current.id] ?? ''}
            onChange={(e) => onAnswer(current.id, e.target.value)}
            placeholder={current.placeholder ?? copy.answerPlaceholder}
            rows={3}
            maxLength={2000}
            // Campo da direção 7a: mesmo contorno de tinta do resto do
            // sistema, mas com a sombra sólida "3D" e o raio de 18px que
            // marcam esta caixa como a do formulário de perguntas.
            className="block w-full resize-y border-2 border-ink bg-[var(--cor-branco)] px-4 py-3.5 text-ink placeholder:text-[var(--cor-tinta-5)] outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--giz-amarelo)]"
            style={{
              minHeight: '104px',
              borderRadius: 'var(--raio-3d-campo)',
              boxShadow: 'var(--sombra-3d-campo)',
              font: 'var(--texto-campo)',
            }}
          />
        </div>

        {current.suggestions.length > 0 && (
          <Suggestions
            dict={dict}
            suggestions={current.suggestions}
            value={answers[current.id] ?? ''}
            onApply={(text) => onAnswer(current.id, text)}
          />
        )}

        <div className="mt-6 flex items-center gap-2.5 border-t-2 border-line pt-5">
          <Button
            variant="secondary3d"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            {dict.common.back}
          </Button>
          <Button
            variant="primary3d"
            className="flex-1"
            onClick={() =>
              setIndex((i) => Math.min(ordered.length - 1, i + 1))
            }
            disabled={index === ordered.length - 1}
          >
            {dict.common.next}
          </Button>
        </div>
      </section>

      {listOpen && (
        <QuestionList
          dict={dict}
          questions={ordered}
          answers={answers}
          currentIndex={index}
          onPick={(i) => {
            setIndex(i)
            setListOpen(false)
          }}
          onClose={() => setListOpen(false)}
        />
      )}
    </div>
  )
}

/** The theme changing, said once, where a page break used to be. */
function Divider({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3 first:mt-0">
      <span className="h-0.5 flex-1 bg-line" />
      <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-ink-mute">
        {title}
      </span>
      <span className="h-0.5 flex-1 bg-line" />
    </div>
  )
}

/**
 * One question already asked, with what was said back.
 *
 * A question that was walked past without an answer keeps its place and says
 * so, rather than vanishing. Vanishing would make the count at the top
 * disagree with the screen, and it would quietly hide the thing the customer
 * most likely wants to fix.
 */
function Exchange({
  dict,
  question,
  answer,
  showDivider,
  onJump,
}: {
  dict: Dictionary
  question: InterviewQuestion
  answer: string
  showDivider: boolean
  onJump: () => void
}) {
  const copy = dict.wizard.interview

  return (
    <>
      {showDivider && question.group && <Divider title={question.group} />}

      <button
        type="button"
        onClick={onJump}
        className="mb-2 block max-w-[86%] rounded-[16px_16px_16px_4px] border-2 border-ink bg-[var(--tile-azul)] px-4 py-2.5 text-left sm:max-w-[68%]"
        style={{ transform: 'rotate(-0.4deg)' }}
      >
        <span className="text-sm font-semibold leading-snug text-[var(--tile-azul-ink)]">
          {question.question}
        </span>
      </button>

      {answer.trim() ? (
        <button
          type="button"
          onClick={onJump}
          className="mb-5 ml-auto block max-w-[86%] rounded-[16px_16px_4px_16px] border-2 border-ink bg-sheet px-4 py-2.5 text-left sm:max-w-[66%]"
          style={{ transform: 'rotate(0.35deg)' }}
        >
          <span className="text-sm leading-snug whitespace-pre-line text-ink-soft">
            {answer.trim()}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onJump}
          className="mb-5 ml-auto block rounded-[var(--raio-pill)] border-2 border-dashed border-line px-4 py-2 text-left"
        >
          <span className="text-[13px] font-semibold text-ink-mute">
            {copy.unanswered}
          </span>
        </button>
      )}
    </>
  )
}

/**
 * Appends rather than replaces, so a second pick builds on the first —
 * joined by a comma, per the 7a reference (`campo.value = ...trim() + ', '
 * + texto`). Rendered as the dot-list of 7a rather than the old pill chips:
 * a bullet coloured yellow, green, red of chalk, in that fixed order, cycled
 * if a question ever has more than three.
 */
function Suggestions({
  dict,
  suggestions,
  value,
  onApply,
}: {
  dict: Dictionary
  suggestions: string[]
  value: string
  onApply: (next: string) => void
}) {
  const copy = dict.wizard.interview
  const dotColors = [
    'var(--giz-amarelo)',
    'var(--giz-verde)',
    'var(--giz-vermelho)',
  ]

  return (
    <div className="mt-4">
      <p
        className="mb-2.5 uppercase text-[var(--cor-tinta-5)]"
        style={{ font: 'var(--texto-rotulo)', letterSpacing: '.14em' }}
      >
        {copy.suggestions}
      </p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {suggestions.map((suggestion, i) => {
          const used = value.includes(suggestion)
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  const current = value.trim()
                  if (!current) return onApply(suggestion)
                  if (current.includes(suggestion)) return
                  onApply(`${current.replace(/[.,]$/, '')}, ${suggestion}`)
                }}
                disabled={used}
                className={`group flex w-full items-center gap-2.5 border-0 bg-transparent py-1 text-left transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--giz-amarelo)] ${
                  used ? 'cursor-default opacity-60' : 'cursor-pointer'
                }`}
                style={{ font: 'var(--texto-sugestao)', color: 'var(--cor-tinta)' }}
              >
                <span
                  aria-hidden
                  className="size-[13px] shrink-0 rounded-full border-2 border-ink transition-transform group-hover:translate-y-0.5"
                  style={{
                    background: dotColors[i % dotColors.length],
                    boxShadow: used ? 'none' : 'var(--sombra-3d-ponto)',
                  }}
                />
                {suggestion}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function QuestionList({
  dict,
  questions,
  answers,
  currentIndex,
  onPick,
  onClose,
}: {
  dict: Dictionary
  questions: InterviewQuestion[]
  answers: Record<string, string>
  currentIndex: number
  onPick: (index: number) => void
  onClose: () => void
}) {
  const copy = dict.wizard.interview

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[var(--raio-card)] border-2 border-ink bg-paper-raised shadow-[var(--sombra-solida-escura)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b-2 border-line px-6 py-5">
          <h2 className="font-serif text-2xl font-extrabold text-ink">
            {copy.allQuestions}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="rounded-full p-1 text-2xl leading-none text-ink-soft hover:text-ink"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {questions.map((question, i) => {
            const isCurrent = i === currentIndex
            const done = Boolean(answers[question.id]?.trim())

            return (
              <button
                key={question.id}
                type="button"
                onClick={() => onPick(i)}
                className={`mb-1 flex w-full items-start gap-3 rounded-[var(--raio-folha)] px-4 py-3 text-left transition ${
                  isCurrent
                    ? 'bg-[var(--giz-amarelo)] text-[#5a4413]'
                    : 'hover:bg-paper'
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-1 size-3 shrink-0 rounded-full border-2 border-ink ${
                    done ? 'bg-[var(--giz-verde)]' : 'bg-paper'
                  }`}
                />
                <span className="flex-1">
                  <span
                    className={`block text-sm font-semibold ${isCurrent ? '' : 'text-ink'}`}
                  >
                    {question.question}
                  </span>
                  {done && (
                    <span className="mt-0.5 block truncate text-xs text-ink-mute">
                      {answers[question.id].trim()}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>

        <footer className="border-t-2 border-line px-6 py-4">
          <Button variant="ghost" className="w-full" onClick={onClose}>
            {copy.close}
          </Button>
        </footer>
      </div>
    </div>
  )
}
