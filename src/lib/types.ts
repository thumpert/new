/**
 * Domain types for the personalized coloring book generator.
 *
 * The flow is: brief -> ideas -> chosen idea -> storyboard -> page renders -> PDF.
 */

/**
 * The language the SITE is read in. One only.
 *
 * Not to be confused with `BookLanguageId`, which is the language the book is
 * printed in and still offers English, English-with-Portuguese and
 * Portuguese-with-French. The two were always separate on purpose — a
 * Brazilian buying a present for a child learning English browses in
 * Portuguese and orders an English book — and it is the site half that has
 * been dropped: whoever is buying reads Portuguese.
 *
 * Kept as a type with one member rather than deleted outright, because the
 * URL still carries /pt and orders already on disk carry a locale. Some of
 * those say 'en'; normalizeLocale answers 'pt' for anything it does not
 * recognise, so an old order opens instead of throwing.
 */
export type Locale = 'pt'

export const LOCALES: Locale[] = ['pt']
export const DEFAULT_LOCALE: Locale = 'pt'

/**
 * What the book is for — and, since the shelf, which shelf it is on.
 *
 * It used to be a prompt setting: five moods the writer was steered towards
 * before inventing a story from scratch. Now most of these are a row of
 * pre-written books with a cover each, and the id is what says which row.
 * Three decisions are baked into this list and each of them removed
 * something:
 *
 * 'relationship' and 'pet' are gone. A twenty-four page colouring book as a
 * present between adults is a different business from a book for a child, and
 * it had been pulling the flow sideways since the beginning — it is the
 * reason the wizard asks about tone, and the reason the interview had to work
 * for a customer with no child in the cast. Neither will ever have a shelf,
 * so neither stays.
 *
 * 'new-baby' now covers the older child's book as well as the baby's. They
 * were drifting into one occasion on their own: three of the five stories
 * already on this shelf are about the child who was there first, not about
 * the newborn. Splitting them would have meant drawing a line between "bebê"
 * and "irmão" that no customer would find, so the line is gone and the shelf
 * is one shelf. The id is kept as it is because orders on disk carry it.
 *
 * 'dinosaur' and 'space' are two occasions rather than one called adventure.
 * They have nothing in common except being large inventions, and an umbrella
 * over them is only useful while the home page is a form. Once it is a shelf,
 * each is a book with its own cover, and a customer recognises a dinosaur on
 * a cover faster than they recognise a category.
 *
 * 'child' is gone too, and for a different reason than 'relationship' and
 * 'pet': it was never wrong, it is just the one occasion left with no shelf.
 * Every occasion here now resolves to a pre-written book — see
 * src/lib/stories.ts — because the invented-from-scratch flow (four ideas a
 * model writes per order, from nothing) has been retired along with it. A
 * form asking the most-sold occasion in the trade to invent its own book from
 * a blank page was already the weakest part of the product; keeping it alive
 * for 'child' alone, after every other occasion had a shelf, would have meant
 * keeping the whole invented pipeline — the ideas screen, the gap-filling
 * questions, a second AI call before the interview even starts — for one
 * occasion out of six. 'child' returns once it has stories of its own; until
 * then it is round 2, exactly as the proposal that planned this shelf always
 * said it would be.
 *
 * Orders placed before this list changed still carry a retired id, 'child'
 * included. See `getOccasion`, which answers with the nearest living occasion
 * rather than throwing, so an old book still opens and still prints.
 */
export type OccasionId = 'new-baby' | 'birthday' | 'dinosaur' | 'space' | 'holiday'

export type StoryTypeId =
  | 'adventure'
  | 'everyday-magic'
  | 'fairy-tale'
  | 'journey'
  | 'superhero'
  | 'funny'

export type ToneId = 'warm' | 'playful' | 'poetic' | 'epic' | 'serene'

export type ArtStyleId =
  | 'chibi'
  | 'coloring-book'
  | 'superhero-comic'
  | 'fine-line'
  | 'cartoon'
  | 'retro-storybook'


export type CharacterKind = 'person' | 'pet'

/**
 * How this character is spoken about.
 *
 * Portuguese marks gender on almost every word that touches a person — the
 * article, the adjective, the noun for what they are to the baby — so a book
 * that guesses wrong does not get one word wrong, it gets a hundred wrong,
 * and the customer notices on page one.
 *
 * 'neutral' is not a third grammatical gender, because Portuguese does not
 * have one. It is an instruction to write around the marking: use the name in
 * place of the pronoun, choose nouns that do not inflect, and rebuild the
 * sentence when an adjective would force a choice. Neopronouns are not
 * invented here.
 *
 * Optional, and absent on every order placed before it existed. Absent means
 * "not told", and the writer is instructed to avoid the marking rather than
 * pick for itself.
 */
export type GenderId = 'male' | 'female' | 'neutral'

export const GENDERS: GenderId[] = ['male', 'female', 'neutral']

/**
 * The language the *book* is written in — independent of the language the
 * site is shown in. A Brazilian buying a gift for someone learning English
 * browses in Portuguese and orders an English book.
 */
export type BookLanguageId = 'pt' | 'en' | 'en-pt' | 'pt-fr'

/**
 * What the customer actually receives, and the first thing they choose.
 *
 * 'coloring'  — thirteen pages of black line art on white, each with its
 *               text, for the child to fill in.
 * 'reading'   — the same thirteen pages, printed in colour, to be read aloud.
 *
 * There used to be a third, 'coloured', a finished picture book sitting
 * between the two. It was removed because it was not a third thing: once the
 * reading book became thirteen pages of picture and text, the only difference
 * left was a name, and the customer was being asked to choose between two
 * descriptions of the same object.
 *
 * It reaches all the way down: it decides whether the model sheets and pages
 * are drawn in line or in colour. The covers ignore it — they are always in
 * colour, in both.
 *
 * Orders placed before the change still carry 'coloured' on disk. Everything
 * that reads a finish treats an unknown value as 'reading', so an old book
 * still opens and still prints; see `isLineArt`.
 */
export type BookFinish = 'coloring' | 'reading'

export const BOOK_FINISHES: BookFinish[] = ['coloring', 'reading']

/**
 * Whether this book is drawn in black line for colouring in.
 *
 * The one question the rest of the code actually asks about a finish, and the
 * safe place to answer it: anything that is not the colouring book is drawn
 * in colour, which is what makes a stored 'coloured' order keep working
 * instead of falling down the line-art branch by accident.
 */
export function isLineArt(finish: BookFinish | string): boolean {
  return finish === 'coloring'
}

/**
 * Who the reading book is for, which decides how much text a page carries.
 *
 * The one thing every competitor gets asked for and none of them does: they
 * personalise the name and the face, and then hand a six-year-old and a
 * ten-year-old the same sentences. A book that is read aloud to a
 * four-year-old and a book a nine-year-old reads alone are different objects,
 * and the difference is mostly length and how much is left unexplained.
 */
export type AgeBandId = 'little' | 'middle' | 'big'

export const AGE_BANDS: AgeBandId[] = ['little', 'middle', 'big']

export interface Character {
  id: string
  name: string
  kind: CharacterKind
  /** Free text: "mãe da aniversariante", "melhor amigo", "golden retriever". */
  role?: string
  /** Free text so "6 anos", "recém-nascido" and "3 (em anos de cachorro)" all work. */
  age?: string
  /**
   * How the book should speak about them. Absent means we were not told, and
   * the writer avoids the marking rather than guessing. See `GenderId`.
   */
  gender?: GenderId
  /**
   * What the character looks like. Goes to the image model and to nothing
   * else.
   *
   * Split from the rest because a single "what are they like" box sent
   * everything to both models, and the illustrator cannot draw "laughs at
   * everything" — it can only try. Trying is where invented objects come
   * from: a page once arrived with a pair of trainers floating in mid-air
   * because they had been mentioned in words rather than placed in a scene.
   */
  appearance: string
  /**
   * How they are — temperament, habits, what they love. Goes to the writer
   * and to nothing else, because it is what makes a story about this person
   * rather than about a body.
   */
  personality?: string
  /**
   * Specific things the customer wants to happen in the book: a real moment,
   * a running joke, something they always say. Goes to the writer as material
   * the story must find room for.
   */
  storyNotes?: string
  /**
   * Reference photos uploaded by the customer. More angles give the model a
   * better read on the face; they are used once, to draw the model sheet.
   */
  photoUrls?: string[]
  /**
   * Line-art model sheet generated from the photo. Used as the reference for
   * every page so the character stays consistent across the whole book.
   */
  referenceSheetUrl?: string
}

export interface InterviewQuestion {
  id: string
  question: string
  /** Why we are asking — shown as a subtle helper under the question. */
  hint?: string
  placeholder?: string
  /**
   * Theme this question belongs to. Questions sharing a group are shown
   * together on one screen, so the customer answers in one train of thought.
   */
  group: string
  /**
   * Plausible answers the customer can click instead of typing. They are
   * starting points, not the model's guesses about the truth.
   */
  suggestions: string[]
  /*
   * There used to be a `required` flag here, set by a pre-written story on
   * the questions whose answers it reads from, and the wizard would not let
   * anybody past without them. Nothing is compulsory now: an empty slot is
   * something the writer is told to fill sensibly and hold, rather than
   * something the customer is stopped at. The stories still mark which slots
   * they lean on — `loadBearing` in src/lib/stories.ts — but that is a note
   * to the writer and never reaches this screen.
   */
}

export interface InterviewAnswer {
  questionId: string
  question: string
  answer: string
}

export interface BookBrief {
  /** Language the site is being browsed in. */
  locale: Locale
  /** Language the book itself is written in. Chosen explicitly. */
  bookLanguage: BookLanguageId
  /** Line art to colour in, a finished colour book, or a story to read. */
  finish: BookFinish
  /** Who it is for. Only asked, and only used, for a reading book. */
  ageBandId?: AgeBandId
  occasionId: OccasionId
  /**
   * Which book off the shelf this is, for occasions that have one.
   *
   * Its presence is what switches the whole flow: the story is chosen before
   * the questions rather than after, the questions are the ones that story
   * actually needs, and nothing is invented. See src/lib/stories.ts.
   *
   * It also decides the shape of the object. A story whose beats have been
   * cut into frames, ordered as a colouring book, is twenty-four wordless
   * drawings rather than thirteen captioned ones — so this field changes the
   * page count, and everything that counts pages asks for it.
   */
  chosenStoryId?: string
  storyTypeId: StoryTypeId
  toneId: ToneId
  artStyleId: ArtStyleId
  /** Title chosen by the customer. May be empty until the review step. */
  title: string
  /** Where the story happens: "a fazenda da vovó em Minas". */
  place: string
  characters: Character[]
  interview: InterviewAnswer[]
  /** Optional dedication printed on the first page. */
  dedication?: string
}

export interface StoryIdea {
  id: string
  title: string
  /** One-sentence hook. */
  logline: string
  /** 2-3 sentence summary of the arc. */
  summary: string
  /** Three concrete beats/scenes the book would contain. */
  highlights: string[]
  /**
   * What somebody in this story wants, and does not have on page one.
   *
   * Asked for here and not left to the storyboard for the same reason the
   * turn is: it decides the shape. A premise with a guide object, a turn and
   * nobody wanting anything produces twelve pages that click together and
   * grip no one — followable, and no reason to keep reading. The reader
   * follows because somebody might not get what they want.
   *
   * Optional because orders written before this field existed are still on
   * disk and still have to open. Everything that reads it guards for absence
   * rather than assuming a backfill nobody ran.
   */
  want?: string
  /**
   * What changes partway through — the reason the second half of the book is
   * not the first half again.
   *
   * Asked for at the idea stage rather than left to the storyboard, because
   * the shape of the book is decided here. A list-shaped idea produces a
   * list-shaped book however well the storyboard is written: a real one came
   * back as twelve pages of "the next lamp is…", any two of which could have
   * swapped places without anything breaking.
   */
  turn: string
  /**
   * The guide object: one thing that runs through every page and holds the
   * book together, written as the object and its colour.
   *
   * Named here because it is the whole difference between the two books this
   * product has made. One had streetlamps that lit up memories — a premise;
   * every page reset and any two could trade places. The other had a blue
   * woollen thread tied to both their wrists, which opened the door, ran down
   * the stairs, turned corners, and on the last page pulled itself into a
   * bow. The second is a mechanism, and it is what made the book a book.
   *
   * In a coloring book it is drawn as the only coloured thing on the page —
   * see the spot-colour rule in images/prompt.ts.
   *
   * Empty when nothing fits. An object with no connection to these people,
   * carried through twelve pages because the format wanted one, reads worse
   * than a book without one.
   */
  device?: string
}

export interface StoryPage {
  /** 1-based page number within the illustrated pages. */
  index: number
  /** Narration text printed under the illustration. */
  narration: string
  /**
   * Support line printed smaller under the narration, used by the bilingual
   * book so a learner can check themselves without leaving the page.
   */
  narrationSecondary?: string
  /**
   * Visual description of the scene in English, written to be fed to the
   * image model. Describes action, setting and framing — never art style,
   * which is appended separately from the chosen art style.
   */
  sceneDescription: string
  /** Ids of the characters that appear on this page. */
  charactersOnPage: string[]
}

export interface Storyboard {
  title: string
  /**
   * The guide object, carried down from the chosen idea. The illustrator needs
   * it on every page, and in a coloring book it is the one thing in colour.
   */
  device?: string
  dedication?: string
  pages: StoryPage[]
}

/**
 * The two ideas of a front cover the customer picks between. They are
 * different propositions, not two attempts at the same picture: a portrait
 * says "this book is about these people", a scene says "this book is a story".
 */
export type CoverKind = 'portrait' | 'scene'

export const COVER_KINDS: CoverKind[] = ['portrait', 'scene']

/**
 * How many of each kind are drawn.
 *
 * Two, because one portrait and one scene is not a choice between styles, it
 * is a choice between two pictures that happen to differ in everything at
 * once. With two of each the customer can prefer the framing and still reject
 * the take — and the second of a pair is a different composition rather than
 * a reroll, or it would only be the same cover with the heads moved.
 */
export const COVER_VARIANTS = [1, 2] as const

export type CoverVariant = (typeof COVER_VARIANTS)[number]

export interface CoverRender {
  /** 'back' is the closing image, drawn only after a front cover is chosen. */
  kind: CoverKind | 'back'
  /**
   * Which of the two takes of this kind. Absent on the back cover, which has
   * only one, and on orders written before there were two — everything that
   * reads it treats absent as 1 rather than assuming a backfill nobody ran.
   */
  variant?: CoverVariant
  status: RenderStatus
  imageUrl?: string
  error?: string
  placeholder?: boolean
  promptPreview?: string
}

export type RenderStatus = 'pending' | 'generating' | 'done' | 'failed'

export interface PageRender {
  index: number
  status: RenderStatus
  imageUrl?: string
  error?: string
  /** Provider-side request id, useful for debugging and for webhooks. */
  requestId?: string
  /** Set when no image was drawn and the PDF should show a placeholder. */
  placeholder?: boolean
  /** The image prompt, surfaced by the mock provider so it can be reviewed. */
  promptPreview?: string
  /**
   * Defects a reviewer could still see after the page was redrawn, if any.
   *
   * Present means the page shipped with something visibly wrong — the retry
   * did not fix it — and the customer is shown a warning so they can redraw
   * it themselves rather than finding it in the PDF.
   */
  problems?: string[]
}

export type OrderStatus =
  | 'draft'
  | 'storyboard'
  /**
   * The story is written and waiting to be read. Nothing is drawn until it is
   * approved: text is the cheap place to find out the book is wrong.
   */
  | 'storyboard-review'
  /** Model sheets and the two cover options are being drawn. */
  | 'covers'
  /** Both covers are up; nothing else is drawn until the customer picks one. */
  | 'choosing-cover'
  | 'rendering'
  | 'ready'
  | 'failed'

/**
 * Slow work started by one request and finished after it, so a proxy never
 * sits watching a silent connection. See src/lib/tasks.ts.
 *
 * 'interview', 'gaps' and 'ideas' used to live here — the three calls that
 * only the invented-from-scratch flow made, before every occasion had a
 * shelf. A shelf book's questions and idea are already on this machine, so
 * there is nothing to start and nothing to wait for.
 */
export type TaskKind = 'titles' | 'storyboard'

export interface OrderTask {
  kind: TaskKind
  status: 'running' | 'done' | 'failed'
  startedAt: string
  error?: string
  /** Whatever the work produced. Its shape follows `kind`. */
  result?: unknown
}

export interface Order {
  id: string
  createdAt: string
  updatedAt: string
  status: OrderStatus
  brief: BookBrief
  /**
   * Id of the idea the storyboard was written from — 'story-<id>' for every
   * order, since every order is a book off the shelf. Kept as a general id
   * rather than reusing `brief.chosenStoryId` directly because the storyboard
   * pipeline (review, repair, the generate route) is written against
   * StoryIdea and does not otherwise need to know a story ever came from a
   * shelf rather than somewhere else.
   */
  chosenIdeaId?: string
  storyboard?: Storyboard
  renders?: PageRender[]
  /** The two front-cover options, plus the back cover once it is drawn. */
  covers?: CoverRender[]
  /** Which front cover the customer picked. Nothing else renders until it is set. */
  chosenCoverKind?: CoverKind
  /** Which take of that kind. Absent means the first, for older orders. */
  chosenCoverVariant?: CoverVariant
  /** The step currently being worked on, if any. */
  task?: OrderTask
  /** Relative path of the generated PDF once the book is ready. */
  pdfPath?: string
  error?: string
}
