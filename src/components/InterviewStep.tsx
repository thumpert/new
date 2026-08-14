'use client'

import { useMemo, useState } from 'react'
import type { Dictionary } from '@/lib/i18n'
import type { InterviewQuestion } from '@/lib/types'
import { Button, TextArea } from './ui'

interface Block {
  title: string
  questions: InterviewQuestion[]
}

/**
 * The interview, one themed block per screen.
 *
 * Grouping matters more than it looks: answering three questions about the
 * same thing keeps the customer in one train of thought, where answering nine
 * unrelated ones in a row feels like a form.
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
  const [blockIndex, setBlockIndex] = useState(0)
  const [listOpen, setListOpen] = useState(false)

  const blocks = useMemo(() => groupQuestions(questions), [questions])
  const block = blocks[blockIndex]
  if (!block) return null

  const answered = questions.filter((q) => answers[q.id]?.trim()).length

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {copy.block} {blockIndex + 1}/{blocks.length} · {answered}/
          {questions.length} {copy.answered}
        </p>
        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="text-sm text-accent underline underline-offset-4"
        >
          {copy.allQuestions}
        </button>
      </div>

      <section className="rounded-2xl border border-line bg-paper-raised p-6">
        <h2 className="font-serif text-2xl text-ink">{block.title}</h2>

        <div className="mt-6 space-y-8">
          {block.questions.map((question) => (
            <QuestionField
              key={question.id}
              dict={dict}
              question={question}
              value={answers[question.id] ?? ''}
              onChange={(value) => onAnswer(question.id, value)}
            />
          ))}
        </div>

        <div className="mt-7 flex items-center gap-3 border-t border-line pt-5">
          <Button
            variant="ghost"
            onClick={() => setBlockIndex((i) => Math.max(0, i - 1))}
            disabled={blockIndex === 0}
          >
            {dict.common.back}
          </Button>
          <Button
            onClick={() =>
              setBlockIndex((i) => Math.min(blocks.length - 1, i + 1))
            }
            disabled={blockIndex === blocks.length - 1}
          >
            {dict.common.next}
          </Button>
        </div>
      </section>

      {listOpen && (
        <QuestionList
          dict={dict}
          blocks={blocks}
          answers={answers}
          currentBlock={blockIndex}
          onPick={(i) => {
            setBlockIndex(i)
            setListOpen(false)
          }}
          onClose={() => setListOpen(false)}
        />
      )}
    </div>
  )
}

function QuestionField({
  dict,
  question,
  value,
  onChange,
}: {
  dict: Dictionary
  question: InterviewQuestion
  value: string
  onChange: (value: string) => void
}) {
  const copy = dict.wizard.interview

  /** Appends a suggestion, so picking a second one builds on the first. */
  function applySuggestion(text: string) {
    const current = value.trim()
    if (!current) return onChange(text)
    if (current.includes(text)) return
    onChange(`${current} ${text}`)
  }

  return (
    <div>
      <h3 className="font-medium text-ink">{question.question}</h3>
      {question.hint && (
        <p className="mt-1 text-sm text-ink-soft">{question.hint}</p>
      )}

      <div className="mt-3">
        <TextArea
          value={value}
          onChange={onChange}
          placeholder={question.placeholder ?? copy.answerPlaceholder}
          rows={3}
          maxLength={2000}
        />
      </div>

      {question.suggestions.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-ink-soft">{copy.suggestions}</p>
          <div className="flex flex-wrap gap-2">
            {question.suggestions.map((suggestion, i) => {
              const used = value.includes(suggestion)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  disabled={used}
                  className={`rounded-full border px-3.5 py-1.5 text-left text-sm transition ${
                    used
                      ? 'cursor-default border-accent/30 bg-accent-soft text-accent/60'
                      : 'border-line bg-paper text-ink-soft hover:border-accent hover:text-accent'
                  }`}
                >
                  {suggestion}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionList({
  dict,
  blocks,
  answers,
  currentBlock,
  onPick,
  onClose,
}: {
  dict: Dictionary
  blocks: Block[]
  answers: Record<string, string>
  currentBlock: number
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
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-paper-raised shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="font-serif text-2xl text-ink">{copy.allQuestions}</h2>
            <p className="mt-1 text-sm text-ink-soft">{copy.subtitle}</p>
          </div>
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
          {blocks.map((block, i) => {
            const isCurrent = i === currentBlock
            const done = block.questions.filter((q) =>
              answers[q.id]?.trim(),
            ).length

            return (
              <button
                key={block.title}
                type="button"
                onClick={() => onPick(i)}
                className={`mb-1 flex w-full flex-col gap-2 rounded-xl px-4 py-4 text-left transition ${
                  isCurrent ? 'bg-accent-soft ring-1 ring-accent' : 'hover:bg-paper'
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span
                    className={`font-medium ${isCurrent ? 'text-accent' : 'text-ink'}`}
                  >
                    {block.title}
                  </span>
                  <span className="text-xs text-ink-soft">
                    {done}/{block.questions.length}
                  </span>
                </span>
                <span className="space-y-1">
                  {block.questions.map((q) => (
                    <span
                      key={q.id}
                      className="flex items-center gap-3 text-sm text-ink-soft"
                    >
                      <span
                        aria-hidden
                        className={`size-3 shrink-0 rounded-full border-2 ${
                          answers[q.id]?.trim()
                            ? 'border-accent bg-accent'
                            : 'border-line'
                        }`}
                      />
                      {q.question}
                    </span>
                  ))}
                </span>
              </button>
            )
          })}
        </div>

        <footer className="border-t border-line px-6 py-4">
          <Button variant="ghost" className="w-full" onClick={onClose}>
            {copy.close}
          </Button>
        </footer>
      </div>
    </div>
  )
}

/** Preserves the order the questions arrived in, one entry per theme. */
function groupQuestions(questions: InterviewQuestion[]): Block[] {
  const blocks: Block[] = []
  for (const question of questions) {
    const title = question.group?.trim() || '—'
    const existing = blocks.find((b) => b.title === title)
    if (existing) existing.questions.push(question)
    else blocks.push({ title, questions: [question] })
  }
  return blocks
}
