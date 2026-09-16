'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ART_STYLES,
  BOOK_LANGUAGES,
  OCCASIONS,
  getOccasion,
} from '@/lib/catalog'
import {
  PLACE_QUESTION_ID,
  getStory,
  occasionHasShelf,
  openingQuestions,
  questionsFor,
  say,
  storiesFor,
  storyIdea,
} from '@/lib/stories'
import type { Dictionary } from '@/lib/i18n'
import { AGE_BANDS, BOOK_FINISHES } from '@/lib/types'
import type {
  AgeBandId,
  Order,
  TaskKind,
  ArtStyleId,
  BookBrief,
  BookFinish,
  BookLanguageId,
  Character,
  InterviewQuestion,
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
  // Only a reading book asks this, so the step is skipped for the other two
  // rather than existing twice or being hidden inside another screen.
  'age',
  'bookLanguage',
  'occasion',
  // 'storyType' and 'tone' used to sit here, and both are gone.
  //
  // They were skipped for a book off the shelf, because a mould is already a
  // shape and already a voice. What that exposed is that they were never the
  // customer's questions to answer: an occasion with no shelf yet was still
  // asking somebody buying a present to pick the narrator's register off a
  // list of five, and then handing the answer to a writer who had been given
  // the occasion, the cast and the interview anyway. Nobody choosing between
  // 'poético' and 'sereno' is making the book better; they are doing the
  // writer's job with less information than the writer has.
  //
  // The two fields still exist on the brief and still reach the prompts. The
  // story type comes off the occasion, which already lists which shapes suit
  // it, best first. The tone is the house voice — see TONE below.
  'artStyle',
  'characters',
  // Which pre-written story this is. It comes before every question, because
  // it is what decides which questions there are — but after the cast, and
  // that order is not a preference. The menu is filtered by who is actually
  // in this family: a story that needs a child is not offered to a couple
  // with no child in it. Put this screen before the characters step and there
  // is no cast to filter by, and it renders empty — which is exactly what it
  // did the first time it was tried in a browser.
  'shelf',
  // 'place' used to sit here: one screen, one big empty box, asking where the
  // story happens. It is the same question it always was and it is now the
  // first bubble of the conversation below, because a form field standing
  // between the cast and the interview was the one moment in the flow that
  // did not look like somebody asking — which is the whole claim of the
  // product. See PLACE_QUESTION in src/lib/stories.ts.
  'interview',
  // The title comes after the story is chosen, so the suggestions can be
  // drawn from that story rather than guessed from the brief.
  'ideas',
  'title',
] as const

type Step = (typeof STEPS)[number]

/**
 * Where the wizard opens when the home page already asked the first question.
 *
 * The two tiles on the home are the finish step, in different clothes: one
 * says colouring, the other says reading. Landing somebody on a screen that
 * asks again what they just clicked is the worst kind of step — it reads as
 * if the click was not registered. So the arriving finish is taken as
 * answered, and the wizard opens on the screen after it.
 *
 * Found by name rather than by number so that reordering STEPS above cannot
 * quietly send an arriving customer to the wrong screen.
 */
function openingStep(initialFinish: BookFinish | undefined): number {
  if (!initialFinish) return 0
  // 'age' exists only for a reading book; a colouring book's next real
  // question is the book's language.
  return initialFinish === 'reading'
    ? STEPS.indexOf('age')
    : STEPS.indexOf('bookLanguage')
}

export function Wizard({
  dict,
  locale,
  initialFinish,
}: {
  dict: Dictionary
  locale: Locale
  /** Set when the customer arrived from one of the home page's two tiles. */
  initialFinish?: BookFinish
}) {
  const router = useRouter()

  const [step, setStep] = useState(() => openingStep(initialFinish))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [orderId, setOrderId] = useState<string | null>(null)
  const [finish, setFinish] = useState<BookFinish>(initialFinish ?? 'coloring')
  const [ageBandId, setAgeBandId] = useState<AgeBandId>('middle')
  const [bookLanguage, setBookLanguage] = useState<BookLanguageId>(locale)
  const [occasionId, setOccasionId] = useState<OccasionId>('child')
  /**
   * The narrator's register, and no longer a question.
   *
   * 'warm' is the house voice: measured in arms, jumps and distances rather
   * than in numbers, which is the voice every story on the shelf was written
   * in. A book that came out in one of the other four was not a different
   * book, it was the same book read by somebody else — and a customer had to
   * guess which of five strangers they wanted before naming a single person.
   */
  const toneId: ToneId = 'warm'
  const [artStyleId, setArtStyleId] = useState<ArtStyleId>('chibi')
  const [chosenStoryId, setChosenStoryId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [dedication, setDedication] = useState('')
  const [characters, setCharacters] = useState<Character[]>([
    { id: 'c1', name: '', kind: 'person', appearance: '' },
  ])

  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [ideas, setIdeas] = useState<StoryIdea[]>([])
  const [chosenIdeaId, setChosenIdeaId] = useState<string | null>(null)
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([])
  /** The brief is only checked for gaps once, however many times they go back. */
  const [askedForMore, setAskedForMore] = useState(false)
  /**
   * Whether the written-to-order questions have been fetched.
   *
   * Only the invented flow has any. It cannot fetch them at the same moment
   * it used to, because the setting is now the first thing asked inside the
   * conversation rather than a screen before it — and a question writer that
   * has not been told where the book happens writes worse questions, and
   * writes one asking where the book happens.
   *
   * So the conversation opens with that one question, and the rest are
   * written once it has been answered.
   */
  const [interviewLoaded, setInterviewLoaded] = useState(false)

  const current: Step = STEPS[step]

  /**
   * The shape of story this occasion suits, taken rather than asked for.
   *
   * Every occasion already carries an ordered list of the shapes that fit it,
   * written when the occasion was, by somebody who knew what the books on
   * that shelf were going to be. Reading the first of them is strictly better
   * information than a customer's guess on a screen shown before they have
   * named anybody — and it is the same list that used to sort the options on
   * that screen, so the default was already what most people clicked.
   */
  const storyTypeId: StoryTypeId = useMemo(
    () => getOccasion(occasionId).suggestedStoryTypes[0] ?? 'adventure',
    [occasionId],
  )

  const brief = (): BookBrief => ({
    locale,
    bookLanguage,
    finish,
    ageBandId: finish === 'reading' ? ageBandId : undefined,
    occasionId,
    chosenStoryId: chosenStoryId ?? undefined,
    storyTypeId,
    toneId,
    artStyleId,
    title,
    // Asked as the first bubble of the conversation now, and lifted back out
    // of it here. Everything downstream still reads `brief.place`, which is
    // what it always read — the question moved, the field did not.
    place: answers[PLACE_QUESTION_ID]?.trim() ?? '',
    dedication: dedication.trim() || undefined,
    characters: characters.map((c) => ({ ...c, name: c.name.trim() })),
    interview: questions
      // The setting is a fact about the book, not something somebody said
      // about it. Sending it as both would state it twice in one prompt, in
      // two registers that are read differently.
      .filter((q) => q.id !== PLACE_QUESTION_ID && answers[q.id]?.trim())
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

  /**
   * Whether this order picks a book off a shelf instead of inventing one.
   *
   * Asked of the OCCASION and not of the cast, which matters: this decides
   * which screens exist, and it is read while the customer is still three
   * screens away from naming anybody. Using `storiesFor` here instead would
   * make the step list flicker as characters are typed in — the shelf would
   * appear the moment a name was entered and vanish when it was cleared.
   *
   * Which of the shelf's books this particular family can be given is the
   * narrower question, and it is asked on the shelf screen itself, where
   * there is a cast to ask it about.
   */
  const preWritten = occasionHasShelf(occasionId)

  /**
   * Which steps this particular order actually walks through.
   *
   * Three of them are conditional now, and they are conditional for the same
   * reason: a step that cannot change the book should not be on the way to
   * it. The age band only reaches a reading book. The shelf only exists for
   * an occasion that has one. And the ideas screen — four stories to choose
   * between — has nothing to show when the story was chosen six screens ago.
   */
  const shown = (s: Step) => {
    if (s === 'age') return finish === 'reading'
    if (s === 'shelf') return preWritten
    if (s === 'ideas') return !preWritten
    return true
  }

  const next = () =>
    setStep((s) => {
      let i = s + 1
      while (i < STEPS.length - 1 && !shown(STEPS[i])) i++
      return Math.min(STEPS.length - 1, i)
    })

  const back = () =>
    setStep((s) => {
      let i = s - 1
      while (i > 0 && !shown(STEPS[i])) i--
      return Math.max(0, i)
    })

  /**
   * Starts a slow step on the server and waits for it here instead.
   *
   * The server used to hold the request open until the model was finished,
   * which works on a laptop and nowhere else: a proxy gives up on a silent
   * connection long before a storyboard is written, and the customer sees an
   * error for work that actually succeeded and was paid for. Now the request
   * returns at once and this asks how it is going, which is exactly what the
   * drawing screen already does.
   */
  async function runTask<T>(
    id: string,
    path: string,
    kind: TaskKind,
    json?: unknown,
  ): Promise<T> {
    await call(path, { method: 'POST', json })

    for (;;) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const order = await call<Order>(`/api/orders/${id}`)
      const task = order.task
      // A task for an earlier step means this one has not been recorded yet.
      if (!task || task.kind !== kind || task.status === 'running') continue
      if (task.status === 'failed') {
        throw new Error(task.error ?? dict.common.error)
      }
      return task.result as T
    }
  }

  /**
   * Creates the order and opens the conversation.
   *
   * Nothing is fetched here any more, in either flow, and the screen appears
   * at once. A book off the shelf has its questions on this machine already.
   * A freely invented one opens on the setting alone — the one question every
   * book asks — and the rest are written after it is answered, by a model
   * that has then been told where the book happens.
   */
  const startInterview = () =>
    run(async () => {
      const created = await call<{ id: string }>('/api/orders', {
        method: 'POST',
        json: brief(),
      })
      setOrderId(created.id)

      const story = chosenStoryId ? getStory(chosenStoryId) : undefined
      setQuestions(
        story ? questionsFor(story, brief()) : openingQuestions(brief()),
      )
      setInterviewLoaded(Boolean(story))
      next()
    })

  /**
   * The rest of an invented book's questions, written now that the setting is
   * known.
   *
   * Runs when the customer moves past the opening question, and exactly once.
   * The order is patched first so the writer reads the place from the same
   * brief everything else will.
   */
  const loadInterview = () =>
    run(async () => {
      if (!orderId || interviewLoaded) return
      setInterviewLoaded(true)
      await call(`/api/orders/${orderId}`, { method: 'PATCH', json: brief() })
      const result = await runTask<{ questions: InterviewQuestion[] }>(
        orderId,
        `/api/orders/${orderId}/interview`,
        'interview',
      )
      setQuestions((current) => [...current, ...result.questions])
    })

  /**
   * Leaving the interview. Before writing anything, the brief is read the way
   * the writer will read it, and anything still too thin comes back as more
   * questions on this same screen — the last moment where the person who can
   * fix it is still here. Asked once: a second refusal to move on would be
   * nagging, and the customer is allowed a thin book.
   */
  const loadIdeas = () =>
    run(async () => {
      if (!orderId) throw new Error(dict.common.error)

      // Somebody who answered the setting and went straight for the footer
      // never triggered the fetch. Do it here rather than let them past with
      // a one-question interview behind them.
      if (!interviewLoaded) {
        await loadInterview()
        return
      }

      await call(`/api/orders/${orderId}`, { method: 'PATCH', json: brief() })

      // A pre-written story skips the gap check and the ideas screen alike.
      // There is nothing to check the brief for — the questions it just
      // answered are exactly the ones this story needs — and nothing to
      // choose between, because the choice was made before the questions.
      const story = chosenStoryId ? getStory(chosenStoryId) : undefined
      if (story) {
        const idea = storyIdea(story, brief())
        setIdeas([idea])
        setChosenIdeaId(idea.id)
        if (!title.trim()) setTitle(idea.title)
        next()
        return
      }

      if (!askedForMore) {
        setAskedForMore(true)
        const gaps = await runTask<{ questions: InterviewQuestion[] }>(
          orderId,
          `/api/orders/${orderId}/gaps`,
          'gaps',
        )
        if (gaps.questions.length > 0) {
          setQuestions((current) => [...current, ...gaps.questions])
          return
        }
      }

      const result = await runTask<{ ideas: StoryIdea[] }>(
        orderId,
        `/api/orders/${orderId}/ideas`,
        'ideas',
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

      const result = await runTask<{ titles: string[] }>(
        orderId,
        `/api/orders/${orderId}/titles`,
        'titles',
        { ideaId: chosenIdeaId },
      )
      setTitleSuggestions(result.titles)
    })

  const generateBook = () =>
    run(async () => {
      if (!orderId || !chosenIdeaId) throw new Error(dict.common.error)
      await runTask(orderId, `/api/orders/${orderId}/generate`, 'storyboard', {
        ideaId: chosenIdeaId,
        title: title.trim() || undefined,
      })
      router.push(`/${locale}/livro/${orderId}`)
    })

  const charactersReady = characters.every(
    (c) => c.name.trim() && c.appearance.trim(),
  )

  /*
   * NOTHING HOLDS THIS DOOR ANY MORE.
   *
   * A pre-written story used to mark some of its questions required and the
   * wizard would not let anybody past without them, on the reasoning that an
   * unanswered slot makes the model invent the city rather than making the
   * book thinner.
   *
   * The reasoning was right about the model and wrong about the customer.
   * Half the people here are buying a present for a child who is not theirs,
   * and they do not know which dinosaur is the favourite — so the door did
   * not collect the answer, it collected a made-up one typed to get past, or
   * it lost the sale. And the model inventing is not a defect to be prevented,
   * it is a thing to be instructed: see `assumptionsFor`, which names each
   * empty slot, shows the shape of an answer, and tells the writer to pick the
   * ordinary one and hold it all the way through.
   */

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
        current={STEPS.slice(0, step + 1).filter(shown).length}
        total={STEPS.filter(shown).length}
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

      {current === 'age' && (
        <StepShell
          title={dict.ageBands.title}
          subtitle={dict.ageBands.hint}
          footer={footer(next)}
        >
          <div className="grid gap-3">
            {AGE_BANDS.map((b) => (
              <OptionCard
                key={b}
                label={dict.ageBands[b].label}
                description={dict.ageBands[b].description}
                selected={ageBandId === b}
                onSelect={() => setAgeBandId(b)}
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

      {current === 'shelf' && (
        <StepShell
          title={dict.wizard.shelf.title}
          subtitle={dict.wizard.shelf.subtitle}
          footer={footer(startInterview, Boolean(chosenStoryId))}
        >
          <div className="grid gap-4">
            {/* An occasion whose every book needs somebody this family did not
                name. It cannot happen today — the shelf always has one book
                castable from a single named person — but it is one story away
                from happening, and a screen that renders as blank space with
                a dead Next button is the worst way to find out. */}
            {storiesFor(brief()).length === 0 && (
              <p className="rounded-2xl border border-line bg-paper-raised p-5 text-sm leading-relaxed text-ink-soft">
                {dict.wizard.shelf.empty}
              </p>
            )}

            {/* Only the stories this family can actually be given. A story
                needing a child nobody named is not shown at all, which is
                what stops a book from inventing a sibling. */}
            {storiesFor(brief()).map((story) => {
              const selected = chosenStoryId === story.id
              return (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => setChosenStoryId(story.id)}
                  aria-pressed={selected}
                  className={`rounded-2xl border p-5 text-left transition ${
                    selected
                      ? 'border-accent bg-accent-soft'
                      : 'border-line bg-paper-raised hover:border-accent/50'
                  }`}
                >
                  <h2 className="font-serif text-xl text-ink">
                    {say(story.title, brief())}
                  </h2>
                  <p className="mt-1 text-sm italic text-ink-soft">
                    {say(story.logline, brief())}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink">
                    {say(story.summary, brief())}
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                    {story.highlights.map((h, i) => (
                      <li key={i}>— {say(h, brief())}</li>
                    ))}
                  </ul>
                </button>
              )
            })}
          </div>
        </StepShell>
      )}

      {current === 'artStyle' && (
        <StepShell
          title={dict.wizard.artStyle.title}
          subtitle={
            // Only the coloring book is line art. Testing for 'coloured'
            // instead sent the reading book down the wrong branch and told
            // the customer their colour storybook would be black and white.
            finish === 'coloring'
              ? dict.wizard.artStyle.subtitle
              : dict.wizard.artStyle.subtitleColoured
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
                //
                // Only the coloring book is line art. Testing for 'coloured'
                // instead put the reading book on the wrong side of both: its
                // customer read "the easiest to colour in" and was shown a
                // black-and-white sample of a book that arrives painted.
                description={
                  finish === 'coloring'
                    ? dict.artStyles[a.id].description
                    : dict.artStyles[a.id].descriptionColoured
                }
                sample={finish === 'coloring' ? a.sample : a.sampleColoured}
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
          // The cast is the last screen before the conversation for an
          // invented book; a book off the shelf has its chooser in between.
          footer={footer(preWritten ? next : startInterview, charactersReady)}
        >
          {/* Only for occasions with a shelf, where the menu of stories
              actually depends on who is added — telling anybody else that a
              child unlocks stories would be describing a door that is not
              there. */}
          {preWritten && (
            <p className="mb-5 rounded-2xl border border-line bg-accent-soft/40 p-4 text-sm leading-relaxed text-ink">
              {dict.wizard.characters.shelfIntro}
            </p>
          )}
          <CharactersStep
            dict={dict}
            characters={characters}
            onChange={setCharacters}
            preWritten={preWritten}
          />
        </StepShell>
      )}

      {current === 'interview' && (
        <StepShell
          title={dict.wizard.interview.title}
          subtitle={
            chosenStoryId
              ? dict.wizard.interview.subtitleStory
              : dict.wizard.interview.subtitle
          }
          footer={footer(loadIdeas)}
        >
          <InterviewStep
            dict={dict}
            questions={questions}
            answers={answers}
            busy={busy}
            // Set only while an invented book still owes the customer the
            // rest of its questions. It turns the last bubble's Next button
            // into "ask me the rest" instead of a dead end.
            onMore={interviewLoaded ? undefined : loadInterview}
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
                  {/* The turn and the want are shown because they are what
                      separate a story from a list, and choosing without
                      seeing them is how a list gets picked. The want goes
                      first: it is the one that decides whether anybody keeps
                      reading, and it is the easiest of the three for a
                      customer to judge against the people they know. */}
                  {(idea.want || idea.device || idea.turn) && (
                    <div className="mt-4 space-y-1.5 border-t border-line pt-3 text-sm text-ink-soft">
                      {idea.want && (
                        <p>
                          <span className="font-medium text-ink">
                            {dict.wizard.ideas.want}
                          </span>{' '}
                          {idea.want}
                        </p>
                      )}
                      {idea.device && (
                        <p>
                          <span className="font-medium text-ink">
                            {dict.wizard.ideas.device}
                          </span>{' '}
                          {idea.device}
                        </p>
                      )}
                      {idea.turn && (
                        <p>
                          <span className="font-medium text-ink">
                            {dict.wizard.ideas.turn}
                          </span>{' '}
                          {idea.turn}
                        </p>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </StepShell>
      )}
    </div>
  )
}
