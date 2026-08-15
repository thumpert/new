'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ART_STYLES,
  BOOK_LANGUAGES,
  OCCASIONS,
  STORY_TYPES,
  TONES,
  getOccasion,
} from '@/lib/catalog'
import type { Dictionary } from '@/lib/i18n'
import { BOOK_FINISHES } from '@/lib/types'
import type {
  ArtStyleId,
  BookBrief,
  BookFinish,
  BookLanguageId,
  Character,
  InterviewQuestion,
  MemoryPhoto,
  Locale,
  OccasionId,
  StoryIdea,
  StoryTypeId,
  ToneId,
} from '@/lib/types'
import { CharactersStep } from './CharactersStep'
import { InterviewStep } from './InterviewStep'
import {
  Button,
  ErrorNote,
  Field,
  OptionCard,
  Progress,
  StepShell,
  TextArea,
  TextInput,
} from './ui'

const STEPS = [
  // The finish comes first: it is the biggest fork in the product, and every
  // later screen reads differently once you know which book you are making.
  'finish',
  'bookLanguage',
  'occasion',
  'storyType',
  'tone',
  'artStyle',
  'characters',
  'place',
  'interview',
  // The title comes after the story is chosen, so the suggestions can be
  // drawn from that story rather than guessed from the brief.
  'ideas',
  'title',
] as const

type Step = (typeof STEPS)[number]

export function Wizard({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [orderId, setOrderId] = useState<string | null>(null)
  const [finish, setFinish] = useState<BookFinish>('coloring')
  const [bookLanguage, setBookLanguage] = useState<BookLanguageId>(locale)
  const [occasionId, setOccasionId] = useState<OccasionId>('child')
  const [storyTypeId, setStoryTypeId] = useState<StoryTypeId>('adventure')
  const [toneId, setToneId] = useState<ToneId>('warm')
  const [artStyleId, setArtStyleId] = useState<ArtStyleId>('chibi')
  const [place, setPlace] = useState('')
  const [title, setTitle] = useState('')
  const [dedication, setDedication] = useState('')
  const [characters, setCharacters] = useState<Character[]>([
    { id: 'c1', name: '', kind: 'person', traits: '' },
  ])
  const [memories, setMemories] = useState<MemoryPhoto[]>([])

  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [ideas, setIdeas] = useState<StoryIdea[]>([])
  const [chosenIdeaId, setChosenIdeaId] = useState<string | null>(null)
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([])

  const current: Step = STEPS[step]

  /** Story types the chosen occasion actually suits, best first. */
  const storyTypeOrder = useMemo(() => {
    const preferred = getOccasion(occasionId).suggestedStoryTypes
    return [...STORY_TYPES].sort(
      (a, b) =>
        (preferred.indexOf(a.id) + 1 || 99) - (preferred.indexOf(b.id) + 1 || 99),
    )
  }, [occasionId])

  const brief = (): BookBrief => ({
    locale,
    bookLanguage,
    finish,
    occasionId,
    storyTypeId,
    toneId,
    artStyleId,
    title,
    place,
    dedication: dedication.trim() || undefined,
    characters: characters.map((c) => ({ ...c, name: c.name.trim() })),
    // Only photographs the customer actually described: without a note the
    // writer has nothing to weave the page into the story with.
    memories: memories.filter((m) => m.note.trim()),
    interview: questions
      .filter((q) => answers[q.id]?.trim())
      .map((q) => ({
        questionId: q.id,
        question: q.question,
        answer: answers[q.id].trim(),
      })),
  })

  async function call<T>(
    url: string,
    init?: RequestInit & { json?: unknown },
  ): Promise<T> {
    const { json, ...rest } = init ?? {}
    const res = await fetch(url, {
      ...rest,
      headers: json ? { 'Content-Type': 'application/json' } : undefined,
      body: json ? JSON.stringify(json) : rest.body,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? dict.common.error)
    return data as T
  }

  /** Runs an async transition, keeping error and busy state in one place. */
  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.common.error)
    } finally {
      setBusy(false)
    }
  }

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))

  /** Creates the order, then asks for interview questions written for it. */
  const startInterview = () =>
    run(async () => {
      const created = await call<{ id: string }>('/api/orders', {
        method: 'POST',
        json: brief(),
      })
      setOrderId(created.id)

      const result = await call<{ questions: InterviewQuestion[] }>(
        `/api/orders/${created.id}/interview`,
        { method: 'POST' },
      )
      setQuestions(result.questions)
      next()
    })

  const loadIdeas = () =>
    run(async () => {
      if (!orderId) throw new Error(dict.common.error)
      await call(`/api/orders/${orderId}`, { method: 'PATCH', json: brief() })
      const result = await call<{ ideas: StoryIdea[] }>(
        `/api/orders/${orderId}/ideas`,
        { method: 'POST' },
      )
      setIdeas(result.ideas)
      setChosenIdeaId(null)
      setTitleSuggestions([])
      next()
    })

  /** Moves on to naming, pre-loading three titles for the chosen story. */
  const goToTitle = () =>
    run(async () => {
      if (!orderId || !chosenIdeaId) throw new Error(dict.common.error)
      next()

      const chosen = ideas.find((i) => i.id === chosenIdeaId)
      if (chosen && !title.trim()) setTitle(chosen.title)

      const result = await call<{ titles: string[] }>(
        `/api/orders/${orderId}/titles`,
        { method: 'POST', json: { ideaId: chosenIdeaId } },
      )
      setTitleSuggestions(result.titles)
    })

  const generateBook = () =>
    run(async () => {
      if (!orderId || !chosenIdeaId) throw new Error(dict.common.error)
      await call(`/api/orders/${orderId}/generate`, {
        method: 'POST',
        json: { ideaId: chosenIdeaId, title: title.trim() || undefined },
      })
      router.push(`/${locale}/livro/${orderId}`)
    })

  const charactersReady = characters.every(
    (c) => c.name.trim() && c.traits.trim(),
  )

  const footer = (
    onNext: () => void,
    canAdvance = true,
    label = dict.common.next,
  ) => (
    <>
      {step > 0 && (
        <Button variant="quiet" onClick={back} disabled={busy}>
          {dict.common.back}
        </Button>
      )}
      <Button onClick={onNext} disabled={busy || !canAdvance}>
        {busy ? dict.common.generating : label}
      </Button>
    </>
  )

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-10 sm:py-14">
      <Progress
        current={step + 1}
        total={STEPS.length}
        stepLabel={dict.common.step}
        ofLabel={dict.common.of}
      />

      {error && (
        <div className="mb-6">
          <ErrorNote message={error} />
        </div>
      )}

      {current === 'finish' && (
        <StepShell
          title={dict.wizard.finish.title}
          subtitle={dict.wizard.finish.subtitle}
          footer={footer(next)}
        >
          <div className="grid gap-3">
            {BOOK_FINISHES.map((f) => (
              <OptionCard
                key={f}
                label={dict.finishes[f].label}
                description={dict.finishes[f].description}
                selected={finish === f}
                onSelect={() => setFinish(f)}
              />
            ))}
          </div>
        </StepShell>
      )}

      {current === 'bookLanguage' && (
        <StepShell
          title={dict.wizard.bookLanguage.title}
          subtitle={dict.wizard.bookLanguage.subtitle}
          footer={footer(next)}
        >
          <div className="grid gap-3">
            {BOOK_LANGUAGES.map((b) => (
              <OptionCard
                key={b.id}
                label={dict.bookLanguages[b.id].label}
                description={dict.bookLanguages[b.id].description}
                selected={bookLanguage === b.id}
                onSelect={() => setBookLanguage(b.id)}
              />
            ))}
          </div>
        </StepShell>
      )}

      {current === 'occasion' && (
        <StepShell
          title={dict.wizard.occasion.title}
          subtitle={dict.wizard.occasion.subtitle}
          footer={footer(next)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {OCCASIONS.map((o) => (
              <OptionCard
                key={o.id}
                label={dict.occasions[o.id].label}
                description={dict.occasions[o.id].description}
                selected={occasionId === o.id}
                onSelect={() => setOccasionId(o.id)}
              />
            ))}
          </div>
        </StepShell>
      )}

      {current === 'storyType' && (
        <StepShell
          title={dict.wizard.storyType.title}
          subtitle={dict.wizard.storyType.subtitle}
          footer={footer(next)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {storyTypeOrder.map((s) => (
              <OptionCard
                key={s.id}
                label={dict.storyTypes[s.id].label}
                description={dict.storyTypes[s.id].description}
                selected={storyTypeId === s.id}
                onSelect={() => setStoryTypeId(s.id)}
              />
            ))}
          </div>
        </StepShell>
      )}

      {current === 'tone' && (
        <StepShell
          title={dict.wizard.tone.title}
          subtitle={dict.wizard.tone.subtitle}
          footer={footer(next)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {TONES.map((t) => (
              <OptionCard
                key={t.id}
                label={dict.tones[t.id].label}
                description={dict.tones[t.id].description}
                example={dict.tones[t.id].example}
                selected={toneId === t.id}
                onSelect={() => setToneId(t.id)}
              />
            ))}
          </div>
        </StepShell>
      )}

      {current === 'artStyle' && (
        <StepShell
          title={dict.wizard.artStyle.title}
          subtitle={
            finish === 'coloured'
              ? dict.wizard.artStyle.subtitleColoured
              : dict.wizard.artStyle.subtitle
          }
          footer={footer(next)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {ART_STYLES.map((a) => (
              <OptionCard
                key={a.id}
                label={dict.artStyles[a.id].label}
                // The sample and the wording both have to match the book being
                // made, or the picker promises one thing and delivers another.
                description={
                  finish === 'coloured'
                    ? dict.artStyles[a.id].descriptionColoured
                    : dict.artStyles[a.id].description
                }
                sample={finish === 'coloured' ? a.sampleColoured : a.sample}
                selected={artStyleId === a.id}
                onSelect={() => setArtStyleId(a.id)}
              />
            ))}
          </div>
        </StepShell>
      )}


      {current === 'characters' && (
        <StepShell
          title={dict.wizard.characters.title}
          subtitle={dict.wizard.characters.subtitle}
          footer={footer(next, charactersReady)}
        >
          <CharactersStep
            dict={dict}
            characters={characters}
            onChange={setCharacters}
            memories={memories}
            onMemoriesChange={setMemories}
          />
        </StepShell>
      )}

      {current === 'place' && (
        <StepShell
          title={dict.wizard.place.title}
          subtitle={dict.wizard.place.subtitle}
          footer={footer(startInterview, place.trim().length > 2)}
        >
          <TextArea
            value={place}
            rows={4}
            maxLength={600}
            placeholder={dict.wizard.place.placeholder}
            onChange={setPlace}
          />
        </StepShell>
      )}

      {current === 'interview' && (
        <StepShell
          title={dict.wizard.interview.title}
          subtitle={dict.wizard.interview.subtitle}
          footer={footer(loadIdeas)}
        >
          <InterviewStep
            dict={dict}
            questions={questions}
            answers={answers}
            onAnswer={(id, answer) =>
              setAnswers((prev) => ({ ...prev, [id]: answer }))
            }
          />
        </StepShell>
      )}

      {current === 'title' && (
        <StepShell
          title={dict.wizard.title.title}
          subtitle={dict.wizard.title.subtitle}
          footer={
            <>
              <Button variant="quiet" onClick={back} disabled={busy}>
                {dict.common.back}
              </Button>
              <Button
                onClick={generateBook}
                disabled={busy || !title.trim()}
                className="ml-auto"
              >
                {busy ? dict.common.generating : dict.wizard.review.generate}
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <Field label={dict.wizard.title.title}>
              <TextInput
                value={title}
                maxLength={120}
                placeholder={dict.wizard.title.placeholder}
                onChange={setTitle}
              />
            </Field>

            <div>
              <p className="mb-2 text-xs text-ink-soft">
                {dict.wizard.title.suggest}
              </p>
              {titleSuggestions.length === 0 ? (
                // Only while the call is in flight — if it failed, the error
                // is already shown above and naming still works by hand.
                busy && <p className="text-sm text-ink-soft">{dict.common.loading}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {titleSuggestions.map((suggestion) => {
                    const chosen = title.trim() === suggestion
                    return (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setTitle(suggestion)}
                        aria-pressed={chosen}
                        className={`rounded-full border px-4 py-2 font-serif text-sm transition ${
                          chosen
                            ? 'border-accent bg-accent-soft text-accent'
                            : 'border-line bg-paper text-ink hover:border-accent hover:text-accent'
                        }`}
                      >
                        {suggestion}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <Field
              label={dict.wizard.dedication.title}
              hint={dict.wizard.dedication.subtitle}
            >
              <TextArea
                value={dedication}
                rows={3}
                maxLength={600}
                placeholder={dict.wizard.dedication.placeholder}
                onChange={setDedication}
              />
            </Field>
          </div>
        </StepShell>
      )}

      {current === 'ideas' && (
        <StepShell
          title={dict.wizard.ideas.title}
          subtitle={dict.wizard.ideas.subtitle}
          footer={
            <>
              <Button variant="quiet" onClick={loadIdeas} disabled={busy}>
                {dict.wizard.ideas.regenerate}
              </Button>
              <Button
                onClick={goToTitle}
                disabled={busy || !chosenIdeaId}
                className="ml-auto"
              >
                {busy ? dict.common.generating : dict.common.next}
              </Button>
            </>
          }
        >
          <div className="grid gap-4">
            {ideas.map((idea) => {
              const selected = chosenIdeaId === idea.id
              return (
                <button
                  key={idea.id}
                  type="button"
                  onClick={() => setChosenIdeaId(idea.id)}
                  aria-pressed={selected}
                  className={`rounded-2xl border p-5 text-left transition ${
                    selected
                      ? 'border-accent bg-accent-soft'
                      : 'border-line bg-paper-raised hover:border-accent/50'
                  }`}
                >
                  <h2 className="font-serif text-xl text-ink">{idea.title}</h2>
                  <p className="mt-1 text-sm italic text-ink-soft">
                    {idea.logline}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink">
                    {idea.summary}
                  </p>
                  <p className="mt-4 text-xs uppercase tracking-wide text-ink-soft">
                    {dict.wizard.ideas.highlights}
                  </p>
                  <ul className="mt-1.5 space-y-1 text-sm text-ink-soft">
                    {idea.highlights.map((h, i) => (
                      <li key={i}>— {h}</li>
                    ))}
                  </ul>
                </button>
              )
            })}
          </div>
        </StepShell>
      )}
    </div>
  )
}
