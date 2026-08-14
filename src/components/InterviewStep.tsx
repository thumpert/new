'use client'

import { useState } from 'react'
import type { Dictionary } from '@/lib/i18n'
import type { InterviewQuestion } from '@/lib/types'
import { Button, TextArea } from './ui'

/**
 * The interview: one question at a time, with a panel listing all of them so
 * the customer can jump to whichever they actually have an answer for.
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
  const [index, setIndex] = useState(0)
  const [listOpen, setListOpen] = useState(false)

  const question = questions[index]
  if (!question) return null

  const answered = questions.filter((q) => answers[q.id]?.trim()).length

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-soft">
          {answered}/{questions.length}
        </p>
        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="text-sm text-accent underline underline-offset-4"
        >
          {dict.wizard.interview.allQuestions}
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-paper-raised p-6">
        <h2 className="font-serif text-xl text-ink">{question.question}</h2>
        {question.hint && (
          <p className="mt-1.5 text-sm text-ink-soft">{question.hint}</p>
        )}

        <div className="mt-5">
          <TextArea
            value={answers[question.id] ?? ''}
            onChange={(value) => onAnswer(question.id, value)}
            placeholder={
              question.placeholder ?? dict.wizard.interview.answerPlaceholder
            }
            rows={5}
            maxLength={2000}
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            {dict.common.back}
          </Button>
          <Button
            onClick={() =>
              setIndex((i) => Math.min(questions.length - 1, i + 1))
            }
            disabled={index === questions.length - 1}
          >
            {dict.common.next}
          </Button>
        </div>
      </div>

      {listOpen && (
        <QuestionList
          dict={dict}
          questions={questions}
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
            <h2 className="font-serif text-2xl text-ink">
              {dict.wizard.interview.allQuestions}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {dict.wizard.interview.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.wizard.interview.close}
            className="rounded-full p-1 text-2xl leading-none text-ink-soft hover:text-ink"
          >
            ×
          </button>
        </header>

        <ul className="flex-1 overflow-y-auto px-4 py-3">
          {questions.map((q, i) => {
            const isCurrent = i === currentIndex
            const isAnswered = Boolean(answers[q.id]?.trim())
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => onPick(i)}
                  className={`flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left transition ${
                    isCurrent
                      ? 'bg-accent-soft ring-1 ring-accent'
                      : 'hover:bg-paper'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`size-4 shrink-0 rounded-full border-2 ${
                      isAnswered
                        ? 'border-accent bg-accent'
                        : isCurrent
                          ? 'border-accent'
                          : 'border-line'
                    }`}
                  />
                  <span
                    className={`flex-1 ${isCurrent ? 'font-medium text-accent' : 'text-ink'}`}
                  >
                    {q.question}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-paper px-3 py-1 text-xs text-ink-soft">
                      {dict.wizard.interview.current}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        <footer className="border-t border-line px-6 py-4">
          <Button variant="ghost" className="w-full" onClick={onClose}>
            {dict.wizard.interview.close}
          </Button>
        </footer>
      </div>
    </div>
  )
}
