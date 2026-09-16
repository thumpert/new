import type {
  BookBrief,
  Character,
  InterviewQuestion,
  OccasionId,
  StoryIdea,
} from './types'

/**
 * The shelf: every book this product can be, written in advance.
 *
 * This is the change that separates this occasion from every other one. The
 * rest of the product invents a story per order: four ideas written from
 * scratch by a model that has never seen the family before, one of them
 * chosen, then written. It works, and it fails in a way that is expensive —
 * the failures are not bad sentences, they are structural. A story with no
 * turn. A cast that includes a sibling the family does not have. A pet asked
 * to do something on page ten that was never established on page one.
 *
 * Here the story is decided in advance and only the details move. The book is
 * still this family's — their child, their city, their animal, their list of
 * favourite things — but the shape underneath is one somebody wrote on
 * purpose and read back. What the model does is cast it and fill it, not
 * invent it.
 *
 * IT STARTED AS ONE OCCASION AND IS NOW THE PRODUCT. These were the five
 * new-baby stories, and everything else invented a book per order. The shelf
 * is the other way round: an occasion either has books on it, and then the
 * customer picks one off it, or it has none and falls back to invention. So a
 * story carries the occasion it belongs to, and `storiesFor` answers with the
 * ones that are both on this shelf and tellable about this family.
 *
 * WHY THE TEXT LIVES HERE AND NOT IN src/lib/i18n. The convention in this
 * codebase is that the catalog holds the machine-facing half and the locale
 * dictionaries hold what the customer reads. These stories break it, on
 * purpose: a question, its hint, its placeholder, its three suggestions and
 * the condition that decides whether it is asked at all are one thought, and
 * splitting that thought across two files by language is how a question ends
 * up asked in Portuguese about a role the English version no longer has. They
 * are kept whole and localised in place.
 */

export type StoryId =
  | 'sunbeam'
  | 'best-things'
  | 'on-the-way'
  | 'training'
  | 'waiting'
  | 'the-thing-under-the-house'
  | 'one-note-a-year'
  | 'the-case-of-the-shut-door'
  | 'never-let-go-of-the-rope'
  | 'the-swap'
  | 'the-name-only-i-know'
  | 'the-guide'
  | 'how-much-further'

export interface Localized {
  pt: string
  en: string
}

const t = (pt: string, en: string): Localized => ({ pt, en })

/**
 * Everything this renders — story titles, loglines, summaries, the interview
 * questions and their suggestions — is read by the BUYER, on the site, and
 * the site is Portuguese. So it answers in Portuguese, and the `brief` is
 * kept in the signature because the caller has one and the day a second site
 * language appears this is the one place that has to change.
 *
 * The English strings stay in the definitions below rather than being torn
 * out. They are the finished counterpart to every Portuguese one, deleting a
 * hundred of them is a large diff with nothing gained, and none of them is
 * reachable from here.
 *
 * Note what this is NOT: the language the book is printed in. That is
 * `bookLanguage`, it still offers English, and the writer is told about it
 * separately — a Portuguese summary going into the prompt for an English book
 * is correct, because the summary is a brief and not a manuscript.
 */
export function say(text: Localized, _brief: BookBrief): string {
  return text.pt
}

/* ------------------------------------------------------------------ *
 * Casting
 * ------------------------------------------------------------------ */

/**
 * A part the story needs somebody to play.
 *
 * Three of the five stories are built around a child who is not the baby.
 * Most families ordering this book have one; some do not, and the old
 * behaviour when they did not was to write the child in anyway, because a
 * shape that needs a child will find one. That is the single worst failure
 * this product can have — a book that gives a family a sibling that does not
 * exist — so the roles are declared, checked before the story is offered, and
 * filled from named characters only.
 */
export type StoryRoleId = 'hero' | 'older-child' | 'companion' | 'grown-up'

export interface StoryRole {
  id: StoryRoleId
  /** Named in the prompt, in caps, exactly as the beats refer to it. */
  slot: string
  /**
   * What kind of character can be cast.
   *
   * 'child'  — the child this book is about. Named 'person-not-baby' while
   *            this file was only the baby shelf, which described what it
   *            ruled out rather than what it picked. It is the same rule: the
   *            youngest named person who is not the newborn, and on a shelf
   *            with no newborn on it, simply the youngest.
   * 'adult'  — the grown-ups of the house, at most two.
   * 'pet'    — the family's own animal.
   * 'anyone-else' — one named person who is not already the child. An adult
   *            or another child, whichever the family has; the part is
   *            written so either can play it. This is the part for the one
   *            who does not believe her, and the reason it is its own kind
   *            is that 'adult' casts a couple and this wants one person.
   */
  cast: 'child' | 'adult' | 'pet' | 'anyone-else'
  /**
   * Whether the story can be written at all without somebody in this part.
   *
   * A required role that cannot be filled takes the story off the menu. An
   * optional one has a written fallback instead — see `fallback`.
   */
  required: boolean
  /**
   * What plays this part when nobody can. Goes to the writer verbatim.
   *
   * The pet is the case that matters: roughly a third of orders have no
   * animal, and the beat it exists for — something is sitting in front of the
   * last mirror — is load-bearing. So the part is written to be playable by
   * an object, and the question that fills it asks for the object by name
   * rather than letting the model pick a drying rack for a family that does
   * not own one.
   */
  fallback?: string
}

/* ------------------------------------------------------------------ *
 * Questions
 * ------------------------------------------------------------------ */

/**
 * A question that is only asked when an earlier answer calls for it.
 *
 * "Do you have an animal at home?" and "what is sitting in the sunny spot
 * instead?" are the same slot asked two ways, and asking both is how a
 * customer without a cat is made to explain twice that they do not have one.
 */
export type QuestionCondition =
  /**
   * Asked only of families with no animal. Not a follow-up to an earlier
   * answer — we already know, because a pet is a character and the customer
   * has just finished naming their characters. Asking "do you have a pet?"
   * after they filled in a form saying so is the kind of question that makes
   * a customer trust the rest of the form less.
   */
  | 'no-pet'
  /** Asked only when there is an animal: what it does, where it sleeps. */
  | 'has-pet'

export interface StoryQuestionDef {
  id: string
  group: Localized
  question: Localized
  hint?: Localized
  placeholder?: Localized
  suggestions: Localized[]
  /**
   * The story leans on this one — it is a slot the book reads from rather
   * than extra colour.
   *
   * It used to mean "the wizard will not let them past without it", and that
   * is gone. Nothing is compulsory now, because a customer who does not know
   * which dinosaur is their child's favourite is not a customer to stop at a
   * door: they are a customer we should make a sensible assumption for and
   * let through. Half the people filling this in are buying a present for
   * somebody else's child and genuinely do not know.
   *
   * What it means now is where the writer is told to invent. An unanswered
   * slot marked here is named in the prompt with an example of the shape an
   * answer takes, and the writer fills it and commits to it — see
   * `assumptionsFor`. Left unmarked, an empty answer is simply one less
   * detail and nobody is told anything.
   */
  loadBearing?: boolean
  showIf?: QuestionCondition
}

/**
 * Where the story happens, asked as the first thing in the conversation.
 *
 * It lives here, with the story questions, because that is now where it is
 * asked. It used to be a screen of its own with a big empty box on it — a
 * form field sitting between the cast and the interview, which made it the
 * one question in the flow that did not look like somebody asking. It is the
 * same question either way; what changed is that it arrives in a bubble with
 * the rest of them.
 *
 * It is not a story question and no story declares it. Every book needs it,
 * including the freely invented ones, so it is built here and prepended to
 * whatever list the flow produces.
 *
 * Its answer does NOT stay in the interview. It is lifted into `brief.place`,
 * which is what every prompt already reads — see the wizard. Leaving it in
 * both would tell the writer the setting twice, once as a fact and once as
 * something a customer said, and those are read differently.
 */
export const PLACE_QUESTION_ID = 'place'

const PLACE_QUESTION: StoryQuestionDef = {
  id: PLACE_QUESTION_ID,
  group: t('O lugar', 'The place'),
  question: t('Onde essa história acontece?', 'Where does this story happen?'),
  hint: t(
    'A cidade, o bairro, a casa — o que for verdade. É o cenário do livro inteiro, e os desenhos saem daqui.',
    'The city, the neighbourhood, the house — whatever is true. It is the setting of the whole book, and the drawings come from it.',
  ),
  placeholder: t(
    'A casa da vovó em Petrópolis, com o quintal cheio de mangueiras',
    'Grandma’s house in Petrópolis, with the yard full of mango trees',
  ),
  suggestions: [
    t('Aqui em casa mesmo, num apartamento de São Paulo', 'Right here at home, in a São Paulo flat'),
    t('Na casa da avó no interior, com quintal e galinha', 'At grandma’s in the countryside, with a yard and chickens'),
    t('Salvador, entre a praia e a ladeira de casa', 'Salvador, between the beach and our own hill'),
  ],
  loadBearing: true,
}

/**
 * One beat of the story, and — once it has been cut — the two drawings it
 * becomes in a colouring book.
 *
 * THE RULE THE WHOLE COLOURING BOOK RESTS ON. A reading book wants one
 * picture a beat, because the words carry the time. A colouring book has no
 * words at all, so the only way a child can tell that time has passed
 * between two pages is to see it: A is the gesture, B is the consequence.
 * The hand closed becomes the hand open. The packet becomes the empty packet.
 *
 * AND B IS A DIFFERENT DRAWING, NOT A SECOND TAKE OF THE SAME ONE. This is
 * the part that decides whether the format is worth buying. A child who
 * turns the page and finds the same composition with one arm moved has been
 * given the same page twice and will colour one of them. So B moves the
 * camera: a wide shot becomes a close one, a back becomes a face, a standing
 * figure becomes a figure seen from above, and the faces are doing something
 * they were not doing in A. Same moment, same place, genuinely different
 * picture — with something in it that has visibly changed.
 *
 * Two things must NOT change inside a pair: where they are, and who is
 * there. Moving the story somewhere else happens between beats, never inside
 * one, or the child loses the thread with nothing written down to catch it.
 *
 * A bare string is a beat that has not been cut yet. The five stories of the
 * new-baby shelf are all bare strings: they were written as thirteen pages
 * with words under them, before frames existed, and wrapping them in an
 * object with two empty halves would only be a way of pretending otherwise.
 * A story is offered as a twenty-four page colouring book when every one of
 * its beats has been cut, and not before — see `isFramed`.
 */
export type StoryBeat = string | FramedBeat

export interface FramedBeat {
  /** What happens. One page of a reading book, exactly as before. */
  text: string
  /** The gesture. English, machine-facing, written for the image model. */
  frameA: string
  /** The consequence — a new drawing of the same moment. See `StoryBeat`. */
  frameB: string
}

export const beatText = (beat: StoryBeat): string =>
  typeof beat === 'string' ? beat : beat.text

export const beatFrames = (beat: StoryBeat): [string, string] | undefined =>
  typeof beat === 'string' ? undefined : [beat.frameA, beat.frameB]

/**
 * Whether this story can be printed as a twenty-four page colouring book.
 *
 * All or nothing on purpose. A book that is paired for nine beats and single
 * for four is not a format, it is a bug the customer pays for — so a story
 * with one uncut beat is still thirteen captioned pages, the way it always
 * was.
 */
export const isFramed = (story: StoryDef): boolean =>
  story.beats.length > 0 && story.beats.every((b) => typeof b !== 'string')

export interface StoryDef {
  id: StoryId
  /**
   * Which shelf this book sits on.
   *
   * The field that turned five new-baby stories into a product. An occasion
   * with stories offers them instead of inventing; an occasion with none
   * still invents. Nothing else decides it — there is no list of "occasions
   * that have a shelf" to keep in step with this one.
   */
  occasionId: OccasionId
  /** The working title. The customer can still rename the book afterwards. */
  title: Localized
  /** One line on the chooser card. */
  logline: Localized
  /** Two or three sentences on the chooser card. */
  summary: Localized
  /** Three concrete scenes, shown on the card so the shape is visible. */
  highlights: Localized[]
  roles: StoryRole[]
  questions: StoryQuestionDef[]
  /** English, machine-facing. What somebody wants and does not have. */
  want: string
  /** English, machine-facing. What changes half way. */
  turn: string
  /**
   * English, machine-facing. The beats, in order, one page each.
   *
   * Thirteen on the stories written before the shelf, twelve on the ones
   * written after — twelve because twelve doubles into twenty-four, and
   * twenty-four is the colouring book. Nothing enforces a number here: the
   * page count of a given order is read off this array.
   */
  beats: StoryBeat[]
  /** English, machine-facing. Rules for filling the mould with real details. */
  filling: string[]
  /**
   * Where anybody the roles did not claim belongs.
   *
   * Every story has parts, and no story has a part for everyone. A family
   * that names a six-year-old and then picks the book about the baby
   * training inside has named somebody the mould never asks for — and the
   * old behaviour was the worst of the three possibilities: not written in,
   * not written out, just left to the writer, who put her on whichever pages
   * felt empty.
   *
   * A named character who does not appear is a customer who paid for a book
   * with their child missing from it. So every story says here what to do
   * with the ones its roles did not take, and the casting block names them.
   */
  extras: string
  /**
   * Declared only when this story is NOT written in the past.
   *
   * Every book here defaults to the past: it is the register the language
   * tells stories in, and it suits a book assembled out of things a family
   * actually said happened. A story that wants otherwise says so here, and
   * says why — the reason travels into the prompt, so the writer is told what
   * the tense is doing rather than just obeying a rule.
   *
   * This exists because one story came out in the present on its own and was
   * right to. Left to chance it would have come out in the past on the next
   * run, and a customer ordering two books would have got two different
   * narrators without anybody having chosen that.
   */
  tense?: { use: 'present'; because: string }
}

/* ------------------------------------------------------------------ *
 * The five stories
 * ------------------------------------------------------------------ */

const PLACES_QUESTION: StoryQuestionDef = {
  id: 'places',
  group: t('A cidade', 'The city'),
  question: t(
    'Quais lugares desse lugar a família ama de verdade?',
    'Which places there does the family actually love?',
  ),
  hint: t(
    'Três ou quatro. Podem ser famosos ou não — a padaria da esquina vale tanto quanto o monumento.',
    'Three or four. Famous or not — the bakery on the corner counts as much as the monument.',
  ),
  placeholder: t(
    'O Farol da Barra, a feira de domingo na praça, o mirante atrás da igreja',
    'The lighthouse, the Sunday market in the square, the viewpoint behind the church',
  ),
  suggestions: [
    t('A praça onde a gente leva ela todo fim de semana', 'The square we take her to every weekend'),
    t('A ponte, o mercado municipal e a igreja da praça', 'The bridge, the market hall and the church on the square'),
    t('A padaria da esquina e o campinho atrás de casa', 'The bakery on the corner and the little pitch behind the house'),
  ],
  loadBearing: true,
}

const NO_PET_QUESTION: StoryQuestionDef = {
  id: 'sunny-spot',
  group: t('A casa', 'The house'),
  question: t(
    'O que está parado no cantinho de sol da casa há semanas?',
    'What has been standing in the sunny spot of the house for weeks?',
  ),
  hint: t(
    'Uma coisa que todo mundo desvia e ninguém tira do lugar. Ela tem um papel na história.',
    'Something everybody walks around and nobody moves. It has a part to play.',
  ),
  placeholder: t(
    'O varal com a roupa do bebê secando há uma semana',
    'The drying rack with the baby clothes on it, a week now',
  ),
  suggestions: [
    t('O varal que vive armado na sala', 'The drying rack that lives up in the living room'),
    t('A pilha de caixas que ninguém abriu ainda', 'The stack of boxes nobody has opened yet'),
    t('A mala da maternidade, pronta perto da porta', 'The hospital bag, packed, by the door'),
  ],
  loadBearing: true,
  showIf: 'no-pet',
}

export const STORIES: StoryDef[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'sunbeam',
    occasionId: 'new-baby',
    title: t('Um Raio de Sol Atravessa a Cidade', 'A Sunbeam Crosses the City'),
    logline: t(
      'O quarto do bebê não pega sol, então a família vai buscar sol do outro lado da cidade.',
      'The baby’s room gets no sun, so the family goes and fetches some from the other side of the city.',
    ),
    summary: t(
      'A criança mais velha descobre que um espelho joga luz longe, e a família sai pela cidade montando um caminho de espelho em espelho até o berço. No meio do caminho os espelhos acabam, e eles descobrem que a cidade inteira já é feita de espelho.',
      'The older child works out that a mirror throws light a long way, and the family sets off across the city building a route of mirrors back to the cot. Half way, the mirrors run out, and they discover the city was already made of them.',
    ),
    highlights: [
      t('O primeiro espelho joga uma moeda de luz na parede vazia', 'The first mirror throws a coin of light onto the bare wall'),
      t('A sacola de espelhos fica vazia no meio da cidade', 'The bag of mirrors runs empty half way across the city'),
      t('A luz chega em casa e para, porque tem alguém na frente', 'The light reaches home and stops, because something is standing in front of it'),
    ],
    roles: [
      {
        id: 'older-child',
        slot: 'THE FINDER',
        cast: 'child',
        required: true,
      },
      {
        id: 'companion',
        slot: 'THE BLOCKER',
        cast: 'pet',
        required: false,
        fallback:
          'The object the customer named as standing in the sunny spot of the house. It is in shot on page 1 and in the background of every page set at home, and on beat 11 somebody finally shifts it after weeks of walking around it.',
      },
      { id: 'grown-up', slot: 'THE GROWN-UP', cast: 'adult', required: true },
    ],
    questions: [
      PLACES_QUESTION,
      NO_PET_QUESTION,
      {
        id: 'pet-spot',
        group: t('A casa', 'The house'),
        question: t(
          'Onde o bicho de vocês costuma dormir quando bate sol?',
          'Where does your animal sleep when the sun comes in?',
        ),
        hint: t(
          'Ele passa o livro inteiro nesse lugar, e no fim é ele que está na frente da luz.',
          'It spends the whole book there, and at the end it is what the light cannot get past.',
        ),
        placeholder: t('No tapete embaixo da janela da sala', 'On the rug under the living room window'),
        suggestions: [
          t('No quadrado de sol que bate no chão da sala de manhã', 'In the square of sun on the living room floor in the morning'),
          t('Em cima da caixa que ninguém desmontou ainda', 'On top of the box nobody has flattened yet'),
          t('Bem na porta do quarto do bebê', 'Right in the doorway of the baby’s room'),
        ],
        loadBearing: true,
        showIf: 'has-pet',
      },
      {
        id: 'room-state',
        group: t('O quarto', 'The room'),
        question: t(
          'Como está o quarto do bebê hoje, de verdade?',
          'What does the baby’s room actually look like right now?',
        ),
        hint: t(
          'A história começa nesse quarto do jeito que ele está agora — meio pronto, meio bagunçado, tanto faz.',
          'The story opens in that room exactly as it is now — half ready, half a mess, either is fine.',
        ),
        placeholder: t(
          'Berço montado no meio e caixa de mudança em todo canto',
          'Cot up in the middle and moving boxes everywhere',
        ),
        suggestions: [
          t('Ainda é o escritório, com o berço encostado na parede', 'Still the study, with the cot against the wall'),
          t('Tudo pronto menos a parede, que ainda não foi pintada', 'Everything ready except the wall, still unpainted'),
          t('Cheio de caixa da mudança, a gente mudou faz um mês', 'Full of moving boxes, we moved a month ago'),
        ],
      },
    ],
    want:
      'THE FINDER wants to be the one who shows this place to somebody who has never seen it — to be the person who knows it well enough to hand it over.',
    turn:
      'On beat 8 the bag is empty half way across the city, and THE FINDER gives away the one mirror THE FINDER had kept back. From there the book stops being about collecting and starts being about having given something up.',
    beats: [
      '1. The room meant for the baby, with the cot already in the middle of it. The window gives onto a wall, so no sun ever reaches this room. THE BLOCKER is already settled in the sunny spot elsewhere in the house and stays in the background of every page set at home. A child asks whether the baby will sleep in the dark, and is told no, we will find it some light.',
      '2. THE FINDER finds a small mirror in a box while looking for something else. In the living room, where there IS sun, it throws a coin of light on the wall. THE FINDER carries it to the baby’s room, holds it to the window, and nothing happens: there is no sun on that wall to catch.',
      '3. THE GROWN-UP says light can be brought from far away, mirror to mirror. The last mirror of the route is set up at the baby’s window and aimed at the cot, and a soft toy is put in the cot as the target: the light has to hit the bear. Nobody touches that mirror again.',
      '4. They go through the boxes and fill a bag with the mirrors of the route — count them out loud, and make it a number small enough to run out.',
      '5. First stop: the biggest, most recognisable of the family’s LANDMARKS. One holds a mirror up high, another walks far off with a second one, and the light makes its first jump. Somebody shouts about how far their arm reaches.',
      '6. Mirror after mirror across the city. Each jump makes the bag lighter. A child asks how many are left and is told: one.',
      '7. The last mirror of the bag is propped somewhere and the light crosses the widest gap of the route. The bag is empty and there is still half the city to go. Nobody speaks for a while.',
      '8. THE TURN. THE FINDER is the one who spots it: water throws light too. Then they see it everywhere at once. EVERY SURFACE ON THIS PAGE IS A REAL ONE FROM THE LANDMARKS THE CUSTOMER NAMED — the glass of the one they have just come down from, the puddle on the ramp of the market, the wet stone of the named street — and never the generic set of a shop window, a bus and a wet roof, which is any city and therefore nobody\'s. Name the street or the place they are crossing, so the page has somewhere to be. The city was already full of mirrors. They follow the light up through it.',
      '9. At the furthest LANDMARK, THE FINDER takes her own first mirror out of her pocket and hands it to THE GROWN-UP to be wedged there, aimed back at their house. THE FINDER does not ask for it back and does not look at it again.',
      '10. Home. Every light in the house is turned off and nobody turns one back on. The beam arrives from the other side of the city, comes through the window, reaches the big mirror at the baby’s window — and stops there. It does not come down into the cot.',
      '11. THE BLOCKER is sitting directly in front of that mirror, in the exact spot it has occupied since page one.',
      '12. THE BLOCKER is moved, gently and with an apology. The light drops straight down, crosses the room and lands square on the bear in the cot, yellow and about the size of a sleeping baby.',
      '13. The family in the doorway, looking at the lit cot. Somebody says out loud how far THE FINDER’s arm turned out to reach. The last mirror is still up there on the other side of the city, pointing this way, and THE FINDER will not see it again.',
    ],
    extras:
      'Any other named adult is part of the expedition and holds one of the mirrors on a page of their own between beats 5 and 7 — the route needs hands, so there is always work for one more. Another named child is the second pair of hands at every stop: they carry the bag, they hold the mirror THE FINDER cannot reach, and on beat 12 it is they who fetch THE BLOCKER out of the way. Give every named person at least two pages where they do something, not one where they are merely present.',
    filling: [
      'THE LANDMARKS ARE THE PLACES THE CUSTOMER NAMED, always, and never places carried over from another book. Use them in the order that makes a route: the biggest and most recognisable on beat 5, the furthest on beat 9.',
      'Beats 5 to 9 are one landmark per page. If the customer named fewer landmarks than there are pages, repeat none of them — spend the spare page on the street between two of them.',
      'The device is that first small mirror, with its colour. It is kept back in beat 2 and given away in beat 9.',
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'best-things',
    occasionId: 'new-baby',
    title: t('As Coisas Mais Belas', 'The Most Beautiful Things'),
    logline: t(
      'A criança mais velha faz a lista das melhores coisas do mundo, para o bebê saber o que o espera.',
      'The older child lists the best things in the world, so the baby knows what is waiting.',
    ),
    summary: t(
      'Um adulto diz que quem vai mostrar as coisas boas ao bebê é a criança mais velha, e ela entende ao pé da letra: sai chamando uma por uma. A lista cresce até ela descobrir que o bebê é pequeno demais para qualquer uma delas — e que existe uma coisa melhor, que ela não tinha posto na lista.',
      'A grown-up says it is the older child who will show the baby the good things, and she takes it literally: she starts calling them, one by one. The list grows until she works out the baby is too small for any of it — and that there is a better thing she had not put on the list.',
    ),
    highlights: [
      t('Ela decide que só entra na lista o melhor do mundo', 'She decides only the best in the world makes the list'),
      t('Ela chama uma coisa grande demais, que não cabe pela porta', 'She calls something too big to fit through the door'),
      t('A lista fica dobrada dentro do berço, com uma linha em branco no fim', 'The list ends up folded in the cot, one line left blank'),
    ],
    roles: [
      { id: 'older-child', slot: 'THE LISTER', cast: 'child', required: true },
      { id: 'grown-up', slot: 'THE GROWN-UP', cast: 'adult', required: true },
      {
        id: 'companion',
        slot: 'THE ANIMAL',
        cast: 'pet',
        required: false,
        fallback:
          'Skip the animal beat entirely and spend that page on one more thing from the list. Do not invent a pet, and do not replace it with a toy animal.',
      },
    ],
    questions: [
      {
        id: 'favourites',
        group: t('A lista', 'The list'),
        question: t(
          'Quais são as coisas favoritas dela no mundo?',
          'What are their favourite things in the world?',
        ),
        hint: t(
          'Cinco ou seis, e quanto mais específico melhor: não "sorvete", e sim "sorvete de chocolate, o de casquinha, que escorre na mão".',
          'Five or six, and the more specific the better: not "ice cream" but "chocolate ice cream, in a cone, the kind that runs down your hand".',
        ),
        placeholder: t(
          'Sorvete de chocolate, correr no parque até cansar, pisar em poça, balanço bem alto',
          'Chocolate ice cream, running in the park until she drops, stamping in puddles, the swing up high',
        ),
        suggestions: [
          t('Pisar em poça, andar de balanço e comer pipoca no cinema', 'Puddles, the swing, and popcorn at the cinema'),
          t('Sorvete de chocolate, futebol na rua e dormir na cama da gente', 'Chocolate ice cream, football in the street, sleeping in our bed'),
          t('Correr no parque, tomar banho de mangueira e raspar a tigela do bolo', 'Running in the park, the garden hose, scraping the cake bowl'),
        ],
        loadBearing: true,
      },
      {
        id: 'too-big',
        group: t('A lista', 'The list'),
        question: t(
          'E uma coisa grande demais, que ela ama e não cabe dentro de casa?',
          'And one thing too big to fit indoors, that they love anyway?',
        ),
        hint: t(
          'Tem uma página em que ela tenta chamar essa coisa e descobre que existem duas listas: as que vêm até o bebê e as que a gente leva o bebê até elas.',
          'There is a page where she tries to call it and finds out there are two lists: what comes to the baby, and what the baby has to be taken to.',
        ),
        placeholder: t('O mar', 'The sea'),
        suggestions: [
          t('O mar, que ela viu uma vez e não parou de falar', 'The sea, which she saw once and has not stopped talking about'),
          t('O estádio no dia de jogo', 'The stadium on match day'),
          t('A cachoeira do sítio do avô', 'The waterfall at her grandad’s place'),
        ],
        loadBearing: true,
      },
      {
        id: 'unteachable',
        group: t('A lista', 'The list'),
        question: t(
          'Tem alguma coisa que ela ama e que ninguém ensinou?',
          'Is there something they love that nobody taught them?',
        ),
        hint: t(
          'Vira a página do cansaço bom — a coisa da lista que o bebê já sabe fazer sem aprender.',
          'It becomes the good-tired page — the one thing on the list the baby can already do without being taught.',
        ),
        placeholder: t(
          'Dormir no carro na volta e acordar já na cama',
          'Falling asleep in the car and waking up already in bed',
        ),
        suggestions: [
          t('Dormir no meio da festa e ser carregada pra cama', 'Falling asleep mid-party and being carried to bed'),
          t('Cantar errado a música inteira, alto', 'Singing the whole song wrong, loudly'),
          t('Rir antes de chegar no fim da piada', 'Laughing before the joke gets to the end'),
        ],
      },
    ],
    want:
      'THE LISTER wants to be the one who hands the world over to the baby — to be the guide rather than the one who has been replaced.',
    turn:
      'On beat 9 something she calls does not come, because it is too big to fit indoors. The list splits in two, and from there the book stops being about collecting and starts being about what she can and cannot give.',
    beats: [
      '1. The cot is already up and THE LISTER looks at it and sees nothing fun about it at all. She asks what the baby is supposed to enjoy in there. THE GROWN-UP says: whatever you show it — you are going to have to call the good things over.',
      '2. THE LISTER takes it literally, fetches paper, and rules that only the best in the world gets on the list. The first item comes without thinking.',
      '3. — Come here, FAVOURITE 1. Written with the specific detail the customer gave, not the general version of it. THE LISTER asks one small practical question about it and THE GROWN-UP answers seriously.',
      '4. — Come here, FAVOURITE 2. The version of it THE LISTER likes best, plus the part of it that comes afterwards.',
      '5. — Come here, FAVOURITE 3. THE LISTER asks whether this one really counts, and is told it does, with one condition.',
      '6. — Come here, FAVOURITE 4. THE LISTER tries to explain the exact good part of it, fails, and decides the only way is to show the baby instead.',
      '7. THE ANIMAL page, if there is one: the softest thing in the house and the hardest to get, granted for three seconds and then withdrawn.',
      '8. — Come here, THE UNTEACHABLE THING. THE LISTER says they do not know how to show this one, because it happens on its own. THE GROWN-UP says the baby already knows how to do that one.',
      '9. THE TURN. — Come here, THE BIG THING. It does not come. It does not fit through the door, or in the room, or on the list. THE GROWN-UP says there are two lists: the ones that come to him and the ones we take him to. THE LISTER starts a second column and the big thing is the first name in it.',
      '10. THE LISTER asks when the baby will be allowed to do all of it. They put an age beside every item. One of them turns out to be much further away than she wanted.',
      '11. The question she had been saving: what if the baby finds all of it boring? THE GROWN-UP says then the baby will call THE LISTER over and show theirs. THE LISTER thinks about that and is not angry about it, but curious.',
      '12. Then she finds the thing that was not on the list: the baby will have his first of every single one of these, and THE LISTER will be there for all of them. It becomes number one and everything else moves down a place.',
      '13. THE LISTER folds the list and leaves it inside the cot, with one line left blank at the bottom for the baby to fill in. The room is not empty any more: it is full of everything that was called.',
    ],
    extras:
      'Another named child has favourites of their own, and the list becomes two lists being argued over — put their items on the pages between beats 3 and 8, attributed by name, and let them be the one who says the big thing on beat 9 does not fit. Any other named adult is who THE LISTER checks an item with: give them the answering line on at least two of the list pages. Nobody named may go the whole book without speaking.',
    filling: [
      'THE FAVOURITES ARE THE CUSTOMER’S OWN, in their own words, one per page, and never generalised. "Chocolate ice cream, in a cone, the kind that runs down your hand" is the page; "ice cream" is not.',
      'If the customer named fewer favourites than there are pages for them, do not invent extra ones — give one of them two pages, the second showing the part that happens afterwards.',
      'The device is the list itself, on paper, with its colour. It is in her hand from beat 2 and in the cot on beat 13.',
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'on-the-way',
    occasionId: 'new-baby',
    title: t('O Bebê Já Saiu de Casa', 'The Baby Has Already Left'),
    logline: t(
      'A criança quer saber onde o bebê está neste exato minuto, e sai pela cidade procurar.',
      'The child wants to know where the baby is right this minute, and goes out into the city to look.',
    ),
    summary: t(
      'Para a criança mais velha, "o bebê está aqui dentro" não explica nada. Ela decide que ele está atravessando a cidade para chegar, e passa o dia imaginando o bebê em cada lugar que a família conhece — até querer sair para buscar.',
      'For the older child, "the baby is in here" explains nothing. She decides he must be crossing the city to get here, and spends the day imagining him in every place the family knows — until she wants to go out and fetch him.',
    ),
    highlights: [
      t('Ela imagina o bebê pegando o ônibus errado, de mochila', 'She imagines the baby on the wrong bus, with a rucksack'),
      t('Saem procurar o bebê pela cidade e não acham nada', 'They go looking for the baby across the city and find nothing'),
      t('A cidade inteira fica parada por um segundo', 'The whole city stops for one second'),
    ],
    roles: [
      { id: 'older-child', slot: 'THE SEEKER', cast: 'child', required: true },
      { id: 'grown-up', slot: 'THE ONE EXPECTING', cast: 'adult', required: true },
    ],
    questions: [
      PLACES_QUESTION,
      {
        id: 'real-question',
        group: t('As perguntas', 'The questions'),
        question: t(
          'Que pergunta ela já fez de verdade sobre o bebê?',
          'What has they actually asked about the baby?',
        ),
        hint: t(
          'Vale a mais boba. As perguntas dela são a estrutura do livro, e uma de verdade vale mais que três inventadas.',
          'The sillier the better. Their questions are the spine of this book, and one real one beats three invented ones.',
        ),
        placeholder: t(
          'Perguntou se o bebê já tem nome lá dentro',
          'She asked whether the baby already has a name in there',
        ),
        suggestions: [
          t('Perguntou se o bebê consegue ouvir a televisão', 'She asked if the baby can hear the television'),
          t('Quis saber se ele vai chegar sabendo o nome dela', 'She wanted to know if he will arrive knowing her name'),
          t('Perguntou o que ele come lá dentro', 'She asked what he eats in there'),
        ],
        loadBearing: true,
      },
      {
        id: 'keepsake',
        group: t('O quarto', 'The room'),
        question: t(
          'Que coisa dela ela daria pro bebê?',
          'What of theirs would they give the baby?',
        ),
        hint: t(
          'É a última página: ela deixa essa coisa no berço, pra quando ele chegar já ter ali uma coisa conhecida.',
          'It is the last page: she leaves it in the cot so there is already something familiar waiting when he arrives.',
        ),
        placeholder: t('O elefante de pano que dorme com ela', 'The cloth elephant that sleeps with her'),
        suggestions: [
          t('O bicho de pelúcia que ela já não leva mais pra escola', 'The soft toy she no longer takes to school'),
          t('Um desenho que ela fez do quarto', 'A drawing she made of the room'),
          t('A manta que era dela quando era bebê', 'The blanket that was hers when she was a baby'),
        ],
        loadBearing: true,
      },
    ],
    want:
      'THE SEEKER wants a real answer to where the baby is — and underneath it, to be the one who goes and gets him, rather than the one who waits at home while somebody else does everything.',
    turn:
      'On beat 8 she stops imagining and actually goes out to look. They search and find nothing, and the answer she gets on beat 10 is the opposite of the one she was chasing.',
    beats: [
      '1. She asks where the baby is right now. THE ONE EXPECTING says "here", with a hand on the bump. She decides that does not explain anything.',
      '2. So she works it out herself, and starts by imagining the baby at the top of the highest of the LANDMARKS, sitting, waiting for the signal to set off.',
      '3. She asks how he knows the address. She is told he does not need to: he already lives here. She writes the address down anyway, in big letters.',
      '4. She imagines the baby on the wrong bus, with a rucksack, by the window, seeing everything for the first time.',
      '5. She imagines the baby stopped at a shop window at one of the LANDMARKS, taking his time deciding what to wear on the first day.',
      '6. She asks what happens if it rains on him. She is told he will arrive wet and they will dry him. She fetches a towel and leaves it folded out ready.',
      '7. THE REAL QUESTION — the one the customer told us she actually asked — put on the page in her words, and answered plainly on the same page. Then one more place: the baby somewhere in a queue, being helped by a stranger who asks nothing.',
      '8. THE TURN. She asks what happens if he gets lost, and this time she does not want an answer, she wants to go. They go.',
      '9. They search the real LANDMARKS. They look under benches. No baby anywhere.',
      '10. Sitting on a step, THE ONE EXPECTING says it: he is the only one who cannot get lost, because he is not coming from anywhere. He already came.',
      '11. She puts her hand on the bump and stays there. The baby kicks. It is the only page in the book where the whole city is standing still.',
      '12. They walk home by the shortest way, which she now insists on memorising, corner by corner, so she can teach it later.',
      '13. Before bed she leaves THE KEEPSAKE in the cot, so that when he arrives there is already one familiar thing there waiting.',
    ],
    extras:
      'Another named child imagines alongside THE SEEKER, and the two of them disagree about where the baby has got to — the disagreement goes on beats 4 and 5. Any other named adult is with them on the search from beat 8, and is the one who looks under the benches. Every named person acts on at least two pages.',
    filling: [
      'THE LANDMARKS ARE THE PLACES THE CUSTOMER NAMED. The imagined pages (2, 4, 5, 7) and the searching pages (9) use the same real places, which is what makes the search feel like it covers the same ground her head just did.',
      'Every question she asks is answered on the page it is asked on, plainly, by THE ONE EXPECTING. This book is made of questions and it must never leave one hanging.',
      'The device is THE KEEPSAKE, with its colour. It is with her from an early page and in the cot on beat 13.',
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'training',
    occasionId: 'new-baby',
    title: t('O Bebê Está Treinando', 'The Baby Is In Training'),
    logline: t(
      'Do lado de dentro, o bebê treina para a estreia. Do lado de fora, os pais também.',
      'Inside, the baby is training for opening night. Outside, so are the parents.',
    ),
    summary: t(
      'O bebê tem uma data marcada e está se preparando: chutar, fechar a mão, decorar as vozes, virar de cabeça para baixo. Cada página tem os dois lados — o treino lá dentro e os pais reagindo do lado de fora ao mesmo movimento.',
      'The baby has a date and is getting ready for it: kicking, gripping, learning the voices, turning upside down. Every page has both sides — the training inside and the parents outside reacting to that same movement.',
    ),
    highlights: [
      t('O treino mais difícil é o de virar de cabeça pra baixo', 'The hardest drill is turning upside down'),
      t('De repente o quarto redondo fica pequeno demais', 'All at once the round room is too small'),
      t('Ele faz a única coisa que nunca ensaiou', 'He does the one thing he never rehearsed'),
    ],
    roles: [
      { id: 'grown-up', slot: 'THE PARENTS', cast: 'adult', required: true },
    ],
    tense: {
      use: 'present',
      because:
        'every page of this book has two halves happening at the same moment — the baby rehearsing on the inside, the family reacting on the outside — and simultaneity is what the present tense is for. In the past, "the baby trained and the mother felt it" becomes two events in a row instead of one event seen from two places. It is also a book about somebody who has not arrived yet, and the past tense keeps implying they have.',
    },
    questions: [
      {
        id: 'noticed',
        group: t('O bebê', 'The baby'),
        question: t(
          'O que vocês já perceberam que o bebê faz aí dentro?',
          'What have you already noticed the baby doing in there?',
        ),
        hint: t(
          'É o coração do livro. Chuta em algum horário? Soluça? Acorda quando alguém fala? Acalma com alguma coisa?',
          'This is the heart of the book. Does it kick at a certain hour? Hiccup? Wake when somebody speaks? Settle for something?',
        ),
        placeholder: t(
          'Chuta toda noite quando a gente senta pra jantar, e soluça de manhã',
          'Kicks every night when we sit down to eat, and hiccups in the morning',
        ),
        suggestions: [
          t('Só acorda quando a gente vai dormir', 'Only wakes up when we go to bed'),
          t('Mexe muito quando escuta a voz do pai', 'Moves a lot when he hears his dad’s voice'),
          t('Soluça todo dia no fim da tarde', 'Hiccups every day in the late afternoon'),
        ],
        loadBearing: true,
      },
      {
        id: 'voices',
        group: t('O bebê', 'The baby'),
        question: t(
          'Como são as duas vozes que ele já conhece?',
          'What are the two voices he already knows like?',
        ),
        hint: t(
          'Ele passa o livro treinando pra reconhecer vocês dois na hora certa, e na última página reconhece.',
          'He spends the book training to know the two of you on sight, and on the last page he does.',
        ),
        placeholder: t(
          'A do pai é grossa e chega junto com o chão tremendo; a da mãe vem de perto',
          'His dad’s is low and arrives through the floor; his mum’s comes from close up',
        ),
        suggestions: [
          t('Um canta desafinado o tempo todo', 'One of us sings out of tune constantly'),
          t('Um fala com a barriga todo dia antes de dormir', 'One of us talks to the bump every night'),
          t('Um ri muito alto, dá pra ouvir de longe', 'One of us laughs very loudly, you can hear it from far off'),
        ],
      },
      {
        id: 'room-ready',
        group: t('O quarto', 'The room'),
        question: t(
          'O que já está pronto esperando, e o que ainda falta?',
          'What is already there waiting, and what is still missing?',
        ),
        hint: t(
          'Nas últimas páginas os dois terminam o quarto e apagam a luz. Vale dizer o que está meio pronto — é mais verdadeiro que um quarto de revista.',
          'In the last pages the two of them finish the room and turn off the light. Half-done is worth saying — it is truer than a magazine nursery.',
        ),
        placeholder: t(
          'Berço montado e roupinha lavada; falta pendurar tudo na parede',
          'Cot up and clothes washed; nothing on the walls yet',
        ),
        suggestions: [
          t('Tudo pronto menos a cortina', 'Everything but the curtain'),
          t('Só o berço, o resto ainda está em caixa', 'Just the cot, the rest is still boxed'),
          t('A mala da maternidade já está perto da porta', 'The hospital bag is already by the door'),
        ],
      },
    ],
    want:
      'The baby wants to be ready — to arrive having got every single move right. Which is exactly what will not happen.',
    turn:
      'On beat 9 the drills stop working, because he has outgrown the room he trained in. From there the book is not about preparing, it is about going.',
    beats: [
      '1. The baby has a date. He does not know which day, but he knows it is close, because his room has been getting tight. It is round, warm and dark, and he lives there alone. Outside, THE PARENTS are building another room, with a cot in the middle of it. Both sides are getting ready.',
      '2. The first drill is the kick. Outside, one of THE PARENTS stops mid-sentence and puts a hand on the bump, calls the other over — and the other arrives too late, because he has already stopped to rest.',
      '3. Then the hand. He closes it around the cord and grips as hard as he can, which is not very. Lets go. Grips again, harder. One day he will have to hold on to something important and not drop it.',
      '4. THE VOICES. Two of them reach him every day, muffled, as if from the other side of a wall — described exactly as the customer described them. He knows both by heart, and now he is training to know them on the spot.',
      '5. THE NOTICED THING, played as a drill he did not choose. Outside, the parent who notices it laughs, hand on the bump, and says the thing they actually say about it.',
      '6. The hardest drill: turning upside down. A move he will make once in his life, so it has to be perfect. Outside, one of THE PARENTS wakes in the night, turns over, and says in the dark that he has turned.',
      '7. He trains at night, when the world moves about less, and sleeps in the day when everybody is walking. Outside, somebody is awake at three in the morning waiting for him to tire. They will have to sort that out between them later.',
      '8. He trains his mouth. Open, close, thumb, again. The only drill with a clear purpose, and the purpose is eating. Outside, one of THE PARENTS folds something tiny for the third time and cannot believe a person fits in there.',
      '9. THE TURN. The drills stop working. The leg will not straighten, the arm hits the wall, turning is out of the question. The round room did not grow and he did. For the first time he goes still and trains nothing.',
      '10. He puts his ear to the wall. Outside there is space. A lot of it. And the two voices, talking quietly to each other. That night THE PARENTS finish the room — say what was still missing and is now done — turn off the light and leave the door ajar. One of them says: it is ready, you can come.',
      '11. The hour arrives without warning. Everything he trained happens at once. Outside there is a light on, a key, a lift, one hand holding another. The way out is narrow, and it is the only part he never had a chance to practise.',
      '12. Outside is too bright, too wide and cold, and no drill covers it. So he does the one thing he never rehearsed once: fills his chest and cries, very loudly. It works first time. Two hands come and pick him up.',
      '13. In their arms the noise goes muffled again, the way he knows it. It is the two voices. The same ones. He knows them on the spot, and that is what he was training for. One of THE PARENTS puts a finger in his hand and he grips it as hard as he can. That drill he has been doing his whole life.',
    ],
    extras:
      'A named child is on the outside of every panel they can be: the one who arrives too late for the kick on beat 2, who talks to the bump on beat 4 and is one of THE VOICES he already knows, who is told about the hiccups on beat 5, and who is asleep when the hour comes on beat 11 and awake for beat 13. Do not put a child inside the round room, and do not drop them because the mould was drawn around two adults — the outside half of this book has room for everyone the customer named. Any other named adult joins THE PARENTS on the outside panels in the same way.',
    filling: [
      'DRAW THE BABY AS A BABY. Full-term, round-cheeked, a real newborn — never a diagram, never translucent, never medical. The room around him is a round room, warm and enclosed, drawn like a room.',
      'EVERY PAGE HAS BOTH SIDES: what he is doing inside, and what THE PARENTS are doing outside at that same moment because of it. A page with only one side has not been written yet.',
      'THE NOTICED THING is the customer’s, in their words, and it earns its own page at beat 5. If they gave more than one, the extras go into beats 2 and 7 rather than being invented over.',
      'The device is the cot, with its colour: empty in the corner of every outside panel, and occupied at the end.',
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'waiting',
    occasionId: 'new-baby',
    title: t('Tudo Que Também Está Esperando', 'Everything Else That Is Waiting'),
    logline: t(
      'No mundo inteiro, neste minuto, um monte de coisa está esperando. O berço é só mais uma delas.',
      'All over the world, this minute, a great many things are waiting. The cot is only one of them.',
    ),
    summary: t(
      'Cada página é uma coisa esperando — a semente, o ovo, a massa do pão, a lua — e sempre com o sinal de que já está perto. A última página entrega tudo de uma vez.',
      'Each page is one thing waiting — the seed, the egg, the dough, the moon — always with the sign that it is nearly there. The last page delivers all of it at once.',
    ),
    highlights: [
      t('A semente já está rachada debaixo da terra', 'The seed is already split open under the ground'),
      t('Alguém na estação sabe a hora e não pode adiantar nada', 'Somebody at the station knows the time and can do nothing to hurry it'),
      t('Tudo chega quase junto', 'Everything arrives at nearly the same moment'),
    ],
    roles: [
      { id: 'grown-up', slot: 'THE TWO WAITING', cast: 'adult', required: true },
      {
        id: 'companion',
        slot: 'THE ONE WHO ALREADY KNOWS',
        cast: 'pet',
        required: false,
        fallback:
          'The object the customer named as standing in the sunny spot: it has been in position for weeks, nobody explained anything to it either, and on the last page it is exactly where it was.',
      },
    ],
    questions: [
      {
        id: 'waiting-places',
        group: t('A cidade', 'The city'),
        question: t(
          'Quais desses lugares existem na cidade de vocês?',
          'Which of these places exist in your city?',
        ),
        hint: t(
          'A padaria, a estação, a praia, a feira, o campo. Cada um vira uma página de uma coisa esperando.',
          'The bakery, the station, the beach, the market, the pitch. Each becomes a page of something waiting.',
        ),
        placeholder: t(
          'Tem a padaria da esquina, a estação de trem e a praia a vinte minutos',
          'There is the bakery on the corner, the train station, and the beach twenty minutes away',
        ),
        suggestions: [
          t('Padaria na esquina e feira de domingo na praça', 'Bakery on the corner and Sunday market in the square'),
          t('A estação de trem e o rio que corta a cidade', 'The train station and the river through the middle'),
          t('A praia e o mercado municipal', 'The beach and the market hall'),
        ],
        loadBearing: true,
      },
      NO_PET_QUESTION,
      {
        id: 'pet-waiting',
        group: t('A casa', 'The house'),
        question: t(
          'Onde o bicho de vocês se instalou desde que o quarto ficou pronto?',
          'Where has your animal settled since the room was finished?',
        ),
        hint: t(
          'Na penúltima página ele já está no lugar dele, sem ninguém ter explicado nada — e na última ele continua exatamente ali.',
          'On the second-to-last page it is already in position, with nobody having explained anything — and on the last page it has not moved.',
        ),
        placeholder: t('Dorme embaixo do berço desde que a gente montou', 'Sleeps under the cot, since the day we put it up'),
        suggestions: [
          t('Embaixo do berço, desde ontem', 'Under the cot, since yesterday'),
          t('Em cima da pilha de roupinha dobrada', 'On top of the pile of folded baby clothes'),
          t('Na porta do quarto, virado pro corredor', 'In the doorway, facing the hall'),
        ],
        loadBearing: true,
        showIf: 'has-pet',
      },
      {
        id: 'other-waiting',
        group: t('A espera', 'The waiting'),
        question: t(
          'Além do bebê, o que mais essa família está esperando?',
          'Besides the baby, what else is this family waiting for?',
        ),
        hint: t(
          'Uma obra, uma mudança, uma viagem, um resultado. Entra numa das páginas do meio, sem explicação.',
          'Building work, a move, a trip, a result. It goes into one of the middle pages, unexplained.',
        ),
        placeholder: t('A reforma da cozinha, que começou em março', 'The kitchen work, started in March'),
        suggestions: [
          t('A mudança pra casa nova', 'The move to the new place'),
          t('A avó, que chega uma semana antes', 'Her grandmother, arriving a week before'),
          t('A obra do quarto ficar pronta', 'The room to be finished'),
        ],
      },
    ],
    want:
      'THE TWO WAITING want the waiting to be over, and there is nothing left they can do to bring it forward. That is the want the whole book sits on.',
    turn:
      'On beat 10 the waiting stops being a thing out in the world and becomes a person doing it, with an hour and no way to hurry it. From there every page is closer to home than the one before.',
    beats: [
      '1. Right now, all over the world, a great many things are waiting. Almost none of them looks like it is doing anything. All of them are. In a room in the middle of a city there is an empty cot with the sheet pulled tight. It is only one on the list.',
      '2. The seed, waiting under the ground. From above there is nothing to see. But dig with a finger and it is already split open, with a white thread pointing up. It is not sitting still. It is on its way.',
      '3. The egg in the nest. It looks like a smooth stone. It is not. Put your ear to it: there is a tapping from inside, always in the same place on the shell. Two days it has been going.',
      '4. The bread dough at THE BAKERY, under a cloth, already over the rim of the bowl and still rising. The baker lifts the cloth, looks, and puts it back. Dough only rises when nobody is watching.',
      '5. The letter at the bottom of a grey sack in a van. It knows the address by heart and can do nothing but go along. One city, one street and one staircase to go.',
      '6. The moon, waiting to be full. Every night a little more, and from one day to the next nobody notices. Only somebody who looks twice in a week sees it. Four nights left.',
      '7. THE OTHER THING THIS FAMILY IS WAITING FOR, given the same treatment as the seed and the egg, and never explained.',
      '8. The tree in winter, bare-branched. It looks dead and it is the one working hardest: every leaf of next summer is already rolled up inside a hard bud at the end of the branch, waiting for the cold to go.',
      '9. The rain waiting over the city. All of it up there, heavy and grey, and not one drop fallen. People in the street walk faster without quite knowing why. The rain knows.',
      '10. THE TURN. At THE STATION, people waiting on their feet. Somebody with a parcel on their lap looks at the clock, at the track, and at the clock again. This is the hardest waiting on the list: knowing the hour and being able to do nothing at all to bring it forward.',
      '11. At the house, everything has been waiting for weeks. Clothes folded in piles that are too small. The bath inside the shower. The mobile hanging still, with no wind. THE ONE WHO ALREADY KNOWS has taken up its position and has not left it since yesterday — nobody explained anything to it, and it knows anyway.',
      '12. And the two of them wait awake. They have done everything there is to do, three times over. What is left is the waiting, which is the part nobody teaches. One walks up and down the hall. The other leaves the bag by the door and the phone face up.',
      '13. And then everything that was waiting arrives, nearly all at once — the seed through the soil, the egg cracked, the bread out of the oven, the letter up the stairs, the moon gone round, the tree’s first leaf. And the baby arrives. The cot is not empty any more, and THE ONE WHO ALREADY KNOWS is exactly where it was.',
    ],
    extras:
      'A named child is one of the people waiting, and waits worse than the adults do: they are the one who asks how much longer, who checks the bud on the branch on beat 8, and who is asleep against somebody on beat 12 while the two of them stay awake. Give them beat 3 as well — the ear against the egg is a child’s page. Any other named adult waits with the two on beat 12.',
    filling: [
      'USE THE PLACES THE CUSTOMER NAMED for beats 4 and 10. If they have no station, the hardest waiting happens wherever people in that place wait on their feet with a time to keep — a bus stop, a ferry, the gate of a school.',
      'If they named no beach or river, drop the wave and give beat 7 two pages instead. Never carry over a place they did not name.',
      'EVERY PAGE CARRIES THE SIGN THAT IT IS NEARLY THERE — the split seed, the tapping in the shell, the dough over the rim. Without it a page is a picture of something dormant, and thirteen of those is not a book.',
      'The device is the cot, with its colour: on page 1 empty with the sheet pulled tight, on page 13 not empty.',
    ],
  },
  /* ---------------------------------------------------------------- */
  /*
   * The first book written for the shelf rather than for the new-baby
   * occasion, and the one the twenty-four frame format was proved on.
   *
   * It was chosen to go first because it is the story that leans hardest on
   * the pairs: the whole book is one framing held and the ground under it
   * changed, so if two drawings a beat could not carry a story without words,
   * this is where it would show up immediately rather than after eight books.
   *
   * WHY THE B FRAMES LOOK NOTHING LIKE THE A FRAMES. A colouring book is
   * bought by the page — a child sits down with one and fills it in, and a
   * page that is the previous page with an arm moved gets skipped. So every B
   * below changes the camera: distance, height, or what the faces are doing,
   * and usually two of the three. What it never changes is where they are and
   * who is there, because that is the only thing holding the sequence
   * together once the words are gone.
   */
  {
    id: 'the-thing-under-the-house',
    occasionId: 'dinosaur',
    title: t('O Bicho Embaixo de Casa', 'The Thing Under the House'),
    logline: t(
      'A pá bate em coisa dura, e o bairro inteiro começa a virar o que era antes.',
      'The spade hits something hard, and the whole neighbourhood starts turning back into what it used to be.',
    ),
    summary: t(
      'Ela cava no lugar de sempre e desenterra um osso grande demais para qualquer bicho dali. Quanto mais fundo vai, mais o bairro vira o que era antes: a praça é um brejo com o mesmo formato, a ponte é um tronco caído no mesmo lugar. Ela sobe no ponto mais alto para achar o caminho de casa — e vê que a colina onde a casa dela fica não é colina, é costela.',
      'She digs where she always digs and turns up a bone too big for any animal from around there. The deeper she goes, the more the neighbourhood becomes what it used to be: the square is a swamp with the same outline, the bridge is a fallen trunk in the same place. She climbs the highest point to find her way home — and sees that the hill her house stands on is not a hill. It is a rib.',
    ),
    highlights: [
      t('A pá para em cima de uma coisa dura que não devia estar ali', 'The spade stops on something hard that has no business being there'),
      t('A praça de hoje e o brejo de antes, no mesmo enquadramento', 'Today’s square and the old swamp, in the same framing'),
      t('A colina da casa dela vista de longe, com a forma do osso por baixo', 'The hill her house sits on, seen from far off, with the shape of the bone under it'),
    ],
    roles: [
      {
        id: 'hero',
        slot: 'THE DIGGER',
        cast: 'child',
        required: true,
      },
      {
        id: 'grown-up',
        slot: 'THE ONE WHO DOES NOT BELIEVE HER',
        cast: 'anyone-else',
        required: false,
        fallback:
          'Nobody doubts her out loud, so the doubt is her own: on beat 3 she holds the bone up against her own arm and decides for herself that it is probably nothing, and puts it in her pocket anyway. Beat 12 then becomes her deciding whether this is worth telling anybody at all — which is a quieter book and a slightly better one.',
      },
      {
        id: 'companion',
        slot: 'THE ONE WHO DIGS TOO',
        cast: 'pet',
        required: false,
        fallback:
          'A borrowed spade she has not given back, named by the customer’s answer about where she digs. It leans in the corner of the first frame, it is in her hand all the way through, and on beat 11 she leaves it stuck upright in the filled-in hole instead of taking it home. Do not invent an animal.',
      },
    ],
    questions: [
      {
        id: 'digging-spot',
        group: t('O chão', 'The ground'),
        question: t(
          'Onde ela cava, mexe na terra ou brinca no chão?',
          'Where does she dig, poke at the dirt or play on the ground?',
        ),
        hint: t(
          'O livro inteiro começa e termina nesse lugar, então quanto mais real melhor — o canteiro morto, a beira do muro, a areia da praia.',
          'The whole book opens and closes there, so the more real the better — the dead flowerbed, the strip by the wall, the sand at the beach.',
        ),
        placeholder: t(
          'No canteiro atrás do tanque, onde a mãe já desistiu de plantar',
          'In the bed behind the washtub, where her mother gave up on planting',
        ),
        suggestions: [
          t('No quintal, no pedaço de terra ao lado do muro', 'In the yard, on the patch of dirt by the wall'),
          t('Na praça, embaixo do escorregador, onde não tem grama', 'In the square, under the slide, where the grass gave up'),
          t('Na areia da praia que a gente vai todo domingo', 'In the sand at the beach we go to every Sunday'),
        ],
        loadBearing: true,
      },
      {
        id: 'neighbourhood',
        group: t('O bairro', 'The neighbourhood'),
        question: t(
          'Que lugares do bairro dá para desenhar de olhos fechados?',
          'Which places in the neighbourhood could you draw with your eyes shut?',
        ),
        hint: t(
          'Três ou quatro. Cada um aparece duas vezes no livro: como é hoje, e como era quando o bicho estava por cima da terra.',
          'Three or four. Each one appears twice in the book: how it is today, and how it was when the animal was still above ground.',
        ),
        placeholder: t(
          'A praça com o coreto, a ponte de pedestre da avenida, a padaria da esquina',
          'The square with the bandstand, the footbridge over the avenue, the bakery on the corner',
        ),
        suggestions: [
          t('A praça, a ponte e a escada que sobe pro morro', 'The square, the bridge and the steps up the hill'),
          t('O campinho, o mercado e a igreja do alto', 'The pitch, the market and the church up top'),
          t('A padaria, o ponto de ônibus e o terreno baldio da esquina', 'The bakery, the bus stop and the empty lot on the corner'),
        ],
        loadBearing: true,
      },
      {
        id: 'favourite-dinosaur',
        group: t('O bicho', 'The animal'),
        question: t(
          'Qual é o dinossauro dela?',
          'Which dinosaur is hers?',
        ),
        hint: t(
          'O nome que ela já sabe falar e corrige os adultos. É esse que ela encontra cavando, na batida 7.',
          'The name she already says properly and corrects grown-ups about. That is the one she meets digging, on beat 7.',
        ),
        placeholder: t('Tricerátops — ela corrige todo mundo que fala errado', 'Triceratops — she corrects everybody who says it wrong'),
        suggestions: [
          t('Tricerátops', 'Triceratops'),
          t('Braquiossauro, o de pescoço comprido', 'Brachiosaurus, the long-necked one'),
          t('Ela não escolhe um, gosta dos que voam', 'She will not pick one, she likes the flying ones'),
        ],
        loadBearing: true,
      },
      {
        id: 'doubter',
        group: t('O bicho', 'The animal'),
        question: t(
          'Quem duvida das histórias dela?',
          'Who doubts her stories?',
        ),
        hint: t(
          'Sem maldade — o que diz "que legal" sem olhar, ou o que explica que é osso de boi. É essa pessoa que ela decide não convencer no fim.',
          'Nothing unkind — the one who says "how nice" without looking up, or the one who explains it is a cow bone. That is the person she decides not to convince at the end.',
        ),
        placeholder: t('O irmão mais velho, que acha graça de tudo que ela acha', 'Her older brother, who finds everything she finds funny'),
        suggestions: [
          t('O pai, que responde sem tirar o olho do celular', 'Her dad, who answers without looking up from his phone'),
          t('A irmã mais velha, que já sabe tudo', 'Her big sister, who already knows everything'),
          t('Ninguém duvida, todo mundo entra na dela', 'Nobody doubts her, everyone plays along'),
        ],
      },
    ],
    want:
      'THE DIGGER wants proof. Not to be believed in general — to come back up out of the hole holding one object that THE ONE WHO DOES NOT BELIEVE HER cannot explain away.',
    turn:
      'On beat 9 she climbs the highest point to work out her way home, looks back, and the hill her own house stands on is not a hill: it is a rib. What she was looking for under the ground turns out to be the ground. From there the book stops being about digging something up and becomes about whether to put it back.',
    beats: [
      {
        text: '1. She is digging in THE DIGGING PLACE, an ordinary afternoon, the way she does every week — and today the spade stops dead on something hard.',
        frameA:
          'Wide, at her own eye level: the whole digging place with her in the middle of it, mid-swing, spade coming down, the small mess of a hole she has already made, the ordinary things that live in this spot around the edges. She is entirely absorbed and not looking at anything but the dirt. THE ONE WHO DIGS TOO is somewhere in the frame, uninterested.',
        frameB:
          'Close and low, almost at ground level, looking up past the blade of the spade into her face: the spade has stopped, standing upright in the dirt, her two hands still gripping the handle, and her head is tipped down towards it with her mouth open. Her expression has changed completely — absorbed in A, startled and listening in B. The hole and one shoe are the only things left of the wide shot.',
      },
      {
        text: '2. It is a bone, and it is far too big to have come off anything that lives around there.',
        frameA:
          'Both her hands lifting the bone clear of the dirt, seen from behind her shoulder so the reader looks down into the hole with her. Dirt falling off it. Her face is not visible at all.',
        frameB:
          'Flat side-on, like a diagram: the bone laid out on the ground with her own bare arm stretched alongside it for scale, her arm shorter. Her face is now fully visible at the top of the frame, upside down as she leans over her own arm to compare, delighted and slightly appalled. Nothing of the hole in shot.',
      },
      {
        text: '3. She shows it to THE ONE WHO DOES NOT BELIEVE HER, who says it is off a cow. THEREFORE she goes back to the hole.',
        frameA:
          'The bone held out at full stretch in the foreground, enormous and close to the reader; behind it and much smaller, the other person half turned away, mid-shrug, giving it the sort of glance that settles the matter. Two levels of attention in one frame.',
        frameB:
          'From behind, further off, at the height of an adult: she is walking back towards the digging place with the bone under one arm and the spade over the opposite shoulder, shoulders set. The other person is gone from the frame entirely. Same yard, emptier, and her whole body says the conversation is over.',
      },
      {
        text: '4. She digs deeper — and when she lifts her head, THE SQUARE is not there any more. In its place is a swamp with exactly the same outline.',
        frameA:
          'THE SQUARE as it is today, drawn from the digging place looking out: its real furniture, its real edges, people at their ordinary business, her head and shoulders small in the bottom corner of the frame, just risen out of the hole.',
        frameB:
          'The identical framing and the identical outline — the same line where the ground rises, the same corner, the same distance — but every object replaced by what stood there before: reeds and open water where the paving is, huge ferns where the trees are, and at the far edge, mostly out of frame, a tail. She is in the same bottom corner, but now turned to face the reader with her eyes wide, which is the only figure that moved.',
      },
      {
        text: '5. She walks out into the neighbourhood that has become another one. THE BRIDGE is a fallen trunk now, and it still gets you across.',
        frameA:
          'THE BRIDGE today, seen side-on from the bank, with her stepping onto it — the real railings, the real surface, whatever is written or stuck on it.',
        frameB:
          'The same crossing seen from the far bank looking back, so the reader is now on the other side waiting for her: a vast fallen trunk spanning the same gap at the same angle, bark and roots, and her halfway across it with both arms out for balance, laughing, concentrating on her feet. Reverse angle, opposite emotion, same span.',
      },
      {
        text: '6. THE ONE WHO DIGS TOO is not frightened of any of it and bolts off ahead, which is the worst possible news.',
        frameA:
          'The animal at full stretch going away from the reader, low and fast, a spray of dirt behind it, the prehistoric ferns blurring past on either side. Her hand is in the near corner of the frame, grabbing at nothing.',
        frameB:
          'Turned around: her running towards the reader, close, the spade still in one hand, all effort and open mouth — and behind her, upside down in the sense that it is what she is running towards rather than away from, the enormous thing the animal has just run underneath, shown only as legs and shadow across the top of the frame.',
      },
      {
        text: '7. She comes on THE DINOSAUR at close range. It is not hunting anything. It is digging too.',
        frameA:
          'The animal from behind, huge, filling most of the frame, hindquarters and tail towards the reader, head down and out of sight below its own shoulders, dirt flying. She is a small figure at the very edge, stopped.',
        frameB:
          'Wide and level, both of them side-on in profile like two workers on the same job: the dinosaur’s head now fully visible and low to the ground with its own hole in front of it, and her at her own hole a little way off, in exactly the same posture. Neither is looking at the other. The joke is only readable at this distance and from this angle, which is why B is the wide one and A was the close one.',
      },
      {
        text: '8. She wants the proof. She picks a tooth up off the ground.',
        frameA:
          'Straight down at the ground, a top-down frame with no horizon at all: leaf litter, dirt, the tooth lying among it, and her shadow falling across it. No part of her in shot except the shadow.',
        frameB:
          'Very close on her closed fist held against her chest with the tooth inside it, her chin and the bottom of her face at the top of the frame, jaw set. Behind and far out of focus, the shape of the dinosaur going on with its own digging. A hand and a face where A had ground and a shadow.',
      },
      {
        text: '9. THE TURN. She climbs the highest thing she can find to work out the way home, looks back — and the hill her house stands on is not a hill. It is a rib. The whole neighbourhood is lying on top of one animal.',
        frameA:
          'From below and behind, her climbing: hands and feet on rock, back to the reader, the top of the climb out of frame above her, the ferns small underneath. Effort and nothing else. The reader cannot see what she is about to see.',
        frameB:
          'The widest drawing in the book, and the only one taken from the air: the entire landscape laid out, and running through it the unmistakable curve of a ribcage with the ground lying over it like a blanket — her own house tiny and recognisable on top of the nearest rib, THE SQUARE in the hollow, THE BRIDGE crossing between two of them. She is a very small figure on an outcrop in one corner, seen from behind, and the reader understands the picture at the same moment she does. This is the page a child will spend an hour on.',
      },
      {
        text: '10. The way back is the same way — BUT now she knows what is underneath every part of it.',
        frameA:
          'Her coming down the slope towards the reader, middle distance, whole body, walking carefully with the fist still closed, the landscape behind her now ordinary again at her eye level.',
        frameB:
          'A different thing entirely: today’s neighbourhood in a calm wide view, the real square and the real bridge and the real corner drawn plainly — and underneath the ground, in the bottom third of the frame, the bones continuing in clean unbroken lines, the way a cross-section is drawn. She is walking along the top of it, small, in silhouette. A picture with two storeys, and the only page where the reader sees both at once.',
      },
      {
        text: '11. She reaches her hole. THEREFORE she gives the tooth back and starts filling it in.',
        frameA:
          'Close on the open hand above the hole, the tooth resting on the palm, tipped just enough that it is about to go. The dirt below. No face.',
        frameB:
          'Wide and from the side, further back than any frame since the first page, so the reader sees the whole digging place again the way it looked on page one: her on her knees pushing the earth back in with both forearms, dirty to the elbow, the spade lying flat beside her, THE ONE WHO DIGS TOO now helping in the way animals help, which is to say digging it out again. First real laugh on her face since beat 5.',
      },
      {
        text: '12. They ask whether she found anything. She says no. And then she lies down with her ear against the grass.',
        frameA:
          'Waist-up, indoors or in the doorway, the other person asking and her shrugging with both palms up, face entirely innocent — the most ordinary drawing in the book on purpose.',
        frameB:
          'The last page and the largest idea: her lying flat on the grass, cheek pressed to the ground, eyes shut, filling the top third of the frame — and beneath her, taking the whole of the rest of the page, the complete animal drawn in one continuous line under the earth, curled under the entire neighbourhood, the house and the square and the bridge sitting along its back. Nothing of the A frame remains except her. This is the picture the book was written to arrive at, and it is a full page of line to fill in.',
      },
    ],
    extras:
      'Anybody the parts above did not take becomes the neighbourhood: they appear in the A frames of beats 4, 5 and 10, in the real place and doing a real thing — waiting at the stop, carrying bread, leaning on a railing — and then in the B frame of the same beat they are in exactly the same spot and the same posture, in the world of before. The same person, the same pose, two eras. That is the running visual joke of the book, it costs no extra page, and it is how a named character who has no part in the plot still ends up in it four times. Give each of them one such pair of their own rather than crowding them into one.',
    filling: [
      'THE NEIGHBOURHOOD PLACES ARE THE ONES THE CUSTOMER NAMED, always, and never places carried over from another book. The most recognisable one is THE SQUARE on beat 4; the one that crosses something — a bridge, a footbridge, a set of steps, a level crossing — is THE BRIDGE on beat 5. If nothing crosses anything, beat 5 is the longest walk between two of their places and the trunk lies along it.',
      'THE OUTLINE IS THE WHOLE TRICK, AND IT IS A DRAWING INSTRUCTION. In every A/B pair set in the neighbourhood, the horizon, the ground line and the position of the large shapes are identical between the two frames, and only what fills them changes. Say so inside the scene description of the B frame, in those words, or the illustrator will draw a swamp that is simply a different picture and the book stops working.',
      'THE DINOSAUR IS THE ONE THE CUSTOMER NAMED, by name, and it is never a threat. It does not roar, chase, or notice her for more than a moment. If they named a flying one or refused to pick, use it anyway and give it the same job on beat 7 — digging, or dragging something, or working at a nest.',
      'The device is the tooth, with its colour: picked up on beat 8, carried closed in her fist through 9 and 10, put back on 11. It is the only thing she takes and the only thing she returns.',
      'NOTHING SCARY, AND NOTHING SAD. She is never in danger, nothing is lost, and the animal under the neighbourhood is a comfortable fact rather than an eerie one. The register is a child doing serious work in the dirt.',
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'one-note-a-year',
    occasionId: 'birthday',
    title: t('Um Bilhete Por Ano', 'A Note For Every Year'),
    logline: t(
      'Ela acorda e ninguém canta parabéns — só um envelope no chão, com um lugar escrito dentro.',
      'She wakes up to nobody singing happy birthday — only an envelope on the floor, with a place written inside.',
    ),
    summary: t(
      'Uma trilha de bilhetes atravessa a cidade, e em cada parada tem um objeto de um ano da vida dela. Ela junta a própria vida numa sacola até chegar na última parada, que está vazia — porque o ano que começa hoje ainda não tem objeto, e quem deixa um ali é ela.',
      'A trail of notes crosses the city, and at every stop there is an object from one year of her life. She gathers her own life into a bag until she reaches the last stop, which is empty — because the year starting today has no object yet, and she is the one who leaves it there.',
    ),
    highlights: [
      t('Um envelope no chão, com uma letra que ela não reconhece', 'An envelope on the floor, in handwriting she does not recognise'),
      t('A sacola ficando mais pesada a cada parada', 'The bag getting heavier at every stop'),
      t('O último pacote da trilha, vazio por dentro', 'The last package of the trail, empty inside'),
    ],
    roles: [
      {
        id: 'hero',
        slot: 'THE BIRTHDAY GIRL',
        cast: 'child',
        required: true,
      },
      {
        id: 'grown-up',
        slot: 'WHOEVER HID THE NOTES',
        cast: 'adult',
        required: false,
        fallback:
          'Nobody in this book claims the trail. It stays unsigned until the last page, which is a better book than one where an adult is caught arranging it — the mystery is worth more unresolved.',
      },
      {
        id: 'companion',
        slot: 'THE ONE WHO COMES ALONG',
        cast: 'anyone-else',
        required: false,
        fallback:
          'Nobody was named to come with her. Beat 6 changes its own mechanism to match: instead of being told what the object is, she works it out herself, turning it over — a page of her remembering rather than a page of being told.',
      },
    ],
    questions: [
      {
        id: 'places',
        group: t('A cidade', 'The city'),
        question: t(
          'Três ou quatro lugares que a família frequenta de verdade?',
          'Three or four places the family actually spends time in?',
        ),
        hint: t(
          'São as paradas da trilha. Podem ser banais — a padaria conta tanto quanto o parque.',
          'These are the stops of the trail. They can be ordinary — the bakery counts as much as the park.',
        ),
        placeholder: t(
          'A padaria da esquina, a praça com o coreto, a casa da avó',
          'The bakery on the corner, the square with the bandstand, grandma’s house',
        ),
        suggestions: [
          t('A praça, a escola e a casa da avó', 'The square, the school and grandma’s house'),
          t('O parque, o mercado e a casa do primo', 'The park, the market and her cousin’s house'),
          t('A padaria, a quadra do prédio e a casa da tia', 'The bakery, the building’s courtyard and her aunt’s house'),
        ],
        loadBearing: true,
      },
      {
        id: 'young-keepsake',
        group: t('Os objetos', 'The objects'),
        question: t(
          'Uma coisa que ela não largava quando era bem pequena?',
          'One thing she would not put down when she was very small?',
        ),
        hint: t(
          'Um sapato, um bicho de pano, uma caneca — vira o primeiro pacote da trilha.',
          'A shoe, a stuffed animal, a mug — it becomes the trail’s first package.',
        ),
        placeholder: t('O sapatinho vermelho que já não serve em ninguém', 'The little red shoe that fits nobody now'),
        suggestions: [
          t('A coelha de pano que dormia com ela', 'The stuffed rabbit she slept with'),
          t('A caneca com a marca dos dentes dela', 'The mug with her teeth marks on it'),
          t('O chapéu de sol que ela não tirava da cabeça', 'The sun hat she never took off'),
        ],
        loadBearing: true,
      },
      {
        id: 'always-carries',
        group: t('Os objetos', 'The objects'),
        question: t(
          'O que ela carrega para todo lado hoje?',
          'What does she carry everywhere today?',
        ),
        hint: t(
          'É o que sobra no bolso dela quando a trilha chega no fim — o objeto do ano que está começando.',
          'It is what is left in her pocket when the trail ends — the object of the year that is starting.',
        ),
        placeholder: t('Um carrinho vermelho pequeno, sempre num bolso', 'A small red toy car, always in a pocket'),
        suggestions: [
          t('Uma pedra lisa que ela achou e não largou mais', 'A smooth stone she found and never put down'),
          t('Um lápis mastigado que ela não deixa apontar', 'A chewed-up pencil she will not let anyone sharpen'),
          t('Um botão avulso que virou sorte', 'A loose button that became a lucky charm'),
        ],
        loadBearing: true,
      },
      {
        id: 'party-guest',
        group: t('A festa', 'The party'),
        question: t('Quem estaria na festa dela?', 'Who would be at her party?'),
        hint: t(
          'Aparece na última página, com um objeto na mão.',
          'They appear on the last page, holding an object.',
        ),
        placeholder: t('Os avós, a prima e o melhor amigo do prédio', 'Her grandparents, her cousin and her best friend from the building'),
        suggestions: [
          t('Os avós e os tios', 'Her grandparents and aunts and uncles'),
          t('A turma toda da escola', 'Her whole class from school'),
          t('Só a família mesmo, sem convidado de fora', 'Just family, no outside guests'),
        ],
      },
    ],
    want:
      'THE BIRTHDAY GIRL wants to reach the end of the trail, because whoever built it knows things about her life that she has half forgotten herself.',
    turn:
      'On beat 9 the last package is empty on purpose, and the price of closing the trail is giving up the thing she is carrying without being told to.',
    beats: [
      {
        text: '1. The house is too quiet, and there is an envelope on the floor with her name on it, in handwriting she does not know.',
        frameA: 'Wide, from the doorway of her own room: the bed slept-in and empty, the room dim, ordinary morning light. Nobody else in shot.',
        frameB: 'Close and low, at floor height: her knees and one hand reaching for the envelope on the floorboards, her face reflected small and curious in a nearby window pane. A different distance and a different subject — the envelope, not the room.',
      },
      {
        text: '2. The note does not say happy birthday. It names a place. THEREFORE she goes.',
        frameA: 'Over her shoulder, looking down at the note in her two hands, her thumbs holding it open, the handwriting visible but not the room around her.',
        frameB: 'From outside, through the front door left ajar: her back going down the front steps at a half-run, one shoe already on, the note stuffed in a pocket. Wide, exterior, the opposite of the close interior shot.',
      },
      {
        text: '3. At the first place, a small parcel is tied up: something from when she was very small, that fits nobody in the house any more.',
        frameA: 'She is crouched at ground level, both hands working at a knot on the parcel, her face in profile, concentrating.',
        frameB: 'Extreme close-up, top-down: the keepsake resting flat on her open palm, her fingers curled loosely around its edge, out of focus in the background. Nothing of the crouch remains — just hand and object.',
      },
      {
        text: '4. She understands the game — one object for one year. THEREFORE she runs, counting under her breath.',
        frameA: 'Side-on, mid-stride, comparing the small keepsake against her own hand or arm to see how much she has grown — a measuring gesture, thoughtful.',
        frameB: 'Wide, from far ahead of her on the pavement, running towards the reader, the keepsake now stowed and both arms pumping, a look of pure momentum rather than thought. Reverse of the measuring stillness in A.',
      },
      {
        text: '5. At the second place, a small everyday object with a mark of her on it — whoever kept it, kept everything.',
        frameA: 'She is pulling the parcel out from behind or under something ordinary at that place, half-hidden, her whole arm reaching in.',
        frameB: 'Very close on the object itself, held right up to her own face so a small detail on it and her matching feature are both readable at once — the proof that it is truly hers.',
      },
      {
        text: '6. At the third place, an object she does not recognise at all — BUT THE ONE WHO COMES ALONG does, and tells her the story.',
        frameA: 'She is holding the mystery object up, brow furrowed, turning it in the light, alone in the frame if nobody was named to come.',
        frameB: 'Wide two-shot (or, with nobody else, a wider shot of her sitting down with the object in her lap, working it out on her own): whoever is telling the story is mid-gesture, animated, and she is laughing, caught between confusion and delight — a completely different mood from A.',
      },
      {
        text: '7. The bag is heavier now. She is carrying her own life on her back, and there is still a long way to go.',
        frameA: 'Close on the bag itself, bulging, her hand adjusting the strap on her shoulder, objects just visible poking out of the top.',
        frameB: 'Very wide, from a high angle looking down a long street: her small figure far below, the bag on her back, the distance still ahead of her drawn out plainly. A different scale entirely from the close strap shot.',
      },
      {
        text: '8. At the fourth place, the last package of the trail. It is empty.',
        frameA: 'Her hand reaching for a wrapped package that looks the same as all the others, anticipation on her face.',
        frameB: 'The unwrapped package lying open on the ground, nothing inside, shot from directly above so the emptiness reads at a glance — her hands frozen just above it, not touching.',
      },
      {
        text: '9. THE TURN. The note says this year has no object yet, and she is the one who has to leave one. She only has THE THING SHE CARRIES EVERYWHERE, in her pocket.',
        frameA: 'Close on the open note in both hands, her eyes moving along the last line.',
        frameB: 'Her other hand, in the opposite corner of the frame, closed tight around something small inside her pocket — the two hands never in the same shot, the decision visibly still undecided.',
      },
      {
        text: '10. Nobody is making her. She puts the thing inside the empty package and ties it shut herself.',
        frameA: 'Top-down, close: the small object going into the package, her fingers letting go of it.',
        frameB: 'Side-on, pulled back to full figure: her tying the last knot with both hands, satisfied rather than reluctant, the tied package now sitting beside her on the ground.',
      },
      {
        text: '11. The last note says to bring the package home. THEREFORE she turns back, lighter and heavier at once.',
        frameA: 'From behind, her walking away down the same street from beat 7, the package now under one arm instead of in the bag.',
        frameB: 'Ahead of her, at the corner where her own street begins: the front door of her house just becoming visible in the distance, her small figure approaching it. A destination appearing that beat 7’s wide shot did not have.',
      },
      {
        text: '12. The house is full, and everyone is holding an object of her life. On the table there is one empty place, marked for the year that is just beginning.',
        frameA: 'The front door opening from her point of view: a room full of the people from her answer about the party, each one holding one of the objects from earlier in the book, mid-cheer.',
        frameB: 'A quieter close shot on the table itself: her own tied package sitting open in the middle of it, and beside it one empty, waiting space, exactly the size of the package — nobody in frame, just the table and what it is holding.',
      },
    ],
    extras:
      'Whoever the roles above did not claim is in the crowd on beat 12, holding one of the objects from earlier in the book — one object, one person, so a named character who took no part in the trail still has a job on the last page.',
    filling: [
      'THE PLACES ARE THE ONES THE CUSTOMER NAMED, always, in the order that makes a route across their own city rather than a random hop.',
      'The device is THE THING SHE CARRIES EVERYWHERE, with its colour: introduced nowhere until beat 9, because introducing it earlier would tell the reader what beat 9 is for before it happens.',
      'Every keepsake beat (3, 5, 6) draws a REAL object from the customer’s own words wherever one was given — the young keepsake for beat 3, and anything else true about this family for 5 and 6 rather than invented objects with no connection to them.',
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'the-case-of-the-shut-door',
    occasionId: 'birthday',
    title: t('O Caso da Porta Fechada', 'The Case Of The Shut Door'),
    logline: t(
      'Todo mundo está agindo normal demais — ela abre uma investigação.',
      'Everybody is acting too normal — she opens an investigation.',
    ),
    summary: t(
      'Ela junta provas de que a família está escondendo alguma coisa. Resolve o caso rápido demais, na rua, sozinha — e descobre que a surpresa deles é a cara que ela vai fazer. Então fecha o caderno e vai treinar a cara de surpresa na vitrine.',
      'She gathers proof that the family is hiding something. She solves the case too fast, alone on the pavement — and works out that their surprise is the face she is about to make. So she shuts her notebook and goes to practise looking surprised in a shop window.',
    ),
    highlights: [
      t('A porta dos fundos, que nunca fica fechada, está fechada', 'The back door, which never shuts, is shut'),
      t('O caderno cheio de provas, fechado de repente na calçada', 'The notebook full of clues, shut suddenly on the pavement'),
      t('A cara de surpresa ensaiada no vidro de uma vitrine', 'The surprised face rehearsed in a shop window'),
    ],
    roles: [
      { id: 'grown-up', slot: 'THE SUSPECT', cast: 'adult', required: true },
      {
        id: 'companion',
        slot: 'THE ACCOMPLICE',
        cast: 'pet',
        required: false,
        fallback:
          'The family has no animal, so the third clue is the house itself: a sound that stops the moment she walks into the room, rather than something crossing a doorway with a ribbon on it.',
      },
    ],
    questions: [
      {
        id: 'detective-method',
        group: t('A investigação', 'The investigation'),
        question: t(
          'Qual é o jeito dela de descobrir as coisas?',
          'What is her way of finding things out?',
        ),
        hint: t(
          'Escuta atrás da porta? Revira armário? Interroga direto?',
          'Does she listen at doors? Search cupboards? Interrogate people outright?',
        ),
        placeholder: t('Ela revira gaveta e pergunta sem parar até alguém falhar', 'She goes through drawers and asks question after question until somebody slips up'),
        suggestions: [
          t('Ela escuta escondida atrás das portas', 'She listens hidden behind doors'),
          t('Ela pergunta direto, sem rodeio nenhum', 'She asks straight out, no beating around the bush'),
          t('Ela anota tudo num caderninho, como um detetive de verdade', 'She writes everything in a little notebook, like a real detective'),
        ],
        loadBearing: true,
      },
      {
        id: 'wished-guest',
        group: t('A festa', 'The party'),
        question: t(
          'Quem ela queria muito que aparecesse na festa?',
          'Who did she really want to turn up at the party?',
        ),
        hint: t(
          'É a surpresa de verdade da última página — alguém que ela não esperava.',
          'This is the real surprise on the last page — somebody she was not expecting.',
        ),
        placeholder: t('O tio que mora longe e ela não vê há um ano', 'Her uncle who lives far away, whom she has not seen in a year'),
        suggestions: [
          t('A avó que mora em outra cidade', 'Her grandmother, who lives in another city'),
          t('O primo com quem ela mais se dá', 'The cousin she gets on with best'),
          t('O melhor amigo da escola antiga', 'Her best friend from her old school'),
        ],
        loadBearing: true,
      },
      {
        id: 'party-food',
        group: t('A festa', 'The party'),
        question: t(
          'Tem uma comida que só aparece em festa nessa casa?',
          'Is there a food that only appears at parties in this house?',
        ),
        placeholder: t('O bolo de fubá que só a avó sabe fazer', 'The cornmeal cake only grandma knows how to make'),
        suggestions: [
          t('Brigadeiro, sempre em quantidade absurda', 'Brigadeiro, always an absurd amount of it'),
          t('Coxinha feita em casa, nunca comprada', 'Homemade coxinha, never bought'),
          t('Um bolo que muda de sabor todo ano', 'A cake that changes flavour every year'),
        ],
      },
      {
        id: 'wanted-gift',
        group: t('A festa', 'The party'),
        question: t('O que ela mais quer de presente?', 'What does she want most as a present?'),
        placeholder: t('Uma bicicleta nova, da cor certa desta vez', 'A new bicycle, the right colour this time'),
        suggestions: [
          t('Um jogo que ela pediu o ano inteiro', 'A game she has been asking for all year'),
          t('Um livro da série que ela está lendo', 'A book from the series she is reading'),
          t('Ela não sabe dizer — só quer ser surpreendida', 'She cannot say — she just wants to be surprised'),
        ],
      },
    ],
    want:
      'THE BIRTHDAY GIRL wants to find out what everyone is hiding — she assumes, at first, that they have simply forgotten her birthday.',
    turn:
      'On beat 9 she solves the case alone on the pavement and realises the family’s surprise is the face she is about to make — so she chooses to fake not knowing.',
    beats: [
      {
        text: '1. It is her birthday. Nobody has said a word about it, and everybody is acting too normal.',
        frameA: 'Wide, at the breakfast table: the family going about an ordinary morning, nobody looking at her, deliberately unremarkable.',
        frameB: 'Close on her face alone, side-eyeing the room from over a cup or a spoon, already suspicious — the only person in the house not pretending.',
      },
      {
        text: '2. First clue: the back door, which never shuts properly, is shut.',
        frameA: 'Down a hallway towards the door in the distance, ordinary framing, her walking towards it.',
        frameB: 'Close, her ear pressed flat against the door itself, eyes shut with concentration, one hand flat on the wood beside her head.',
      },
      {
        text: '3. She asks what is in there. THE SUSPECT says "nothing". THEREFORE she knows it is everything.',
        frameA: 'THE SUSPECT standing in front of the door, smiling too widely, blocking it without seeming to.',
        frameB: 'Close on a notebook page, her hand mid-sentence, writing the clue down — no adult in the frame at all, just the evidence.',
      },
      {
        text: '4. Second clue: flour on the sleeve of whoever swore they had not been cooking.',
        frameA: 'A warm hug between her and THE SUSPECT, ordinary and affectionate.',
        frameB: 'Extreme close-up on the white smudge on the sleeve, her eyes just visible at the top of frame, narrowed at it over the hug that is still happening.',
      },
      {
        text: '5. Third clue: THE ACCOMPLICE slips out of a room with a coloured ribbon caught in its fur.',
        frameA: 'A door opening a crack, a nose or paw just visible in the gap.',
        frameB: 'The animal trotting past in the foreground, ribbon plainly visible, her head turning sharply to follow it from the background — reverse of the door-crack framing.',
      },
      {
        text: '6. The case is building, BUT the motive is missing: if it is a party, why has nobody said happy birthday?',
        frameA: 'The notebook open flat, three clues sketched on the page, seen from directly above.',
        frameB: 'Her chewing the end of her pencil, staring off past the reader, mid-thought — the notebook closed now, out of focus below.',
      },
      {
        text: '7. She is sent outside on a thin excuse. THEREFORE she is certain now.',
        frameA: 'THE SUSPECT pointing towards the front door, the excuse plainly weak, one eyebrow raised on her side.',
        frameB: 'From outside, her walking away down the front path, glancing back once over her shoulder at the house behind her.',
      },
      {
        text: '8. On the pavement, she passes someone heading the other way, carrying a badly hidden parcel.',
        frameA: 'The two of them crossing paths, mid-stride, both pretending not to notice each other.',
        frameB: 'Close on the parcel alone under that person’s arm, obviously gift-wrapped, her eyes just entering frame at the very edge, caught looking.',
      },
      {
        text: '9. THE TURN. She has solved it too fast. If she walks back in already knowing, she ruins the one thing that is actually for her: their surprise. She shuts the notebook.',
        frameA: 'Her standing alone on the pavement, notebook open in both hands, staring at her own conclusion.',
        frameB: 'Close on the notebook now shut and being pushed into a pocket, her face turned upward, a decision visibly made — different object, different expression.',
      },
      {
        text: '10. She practises looking surprised in a shop window. It is terrible. She tries again.',
        frameA: 'Her reflection in a shop window, both hands on her cheeks, an exaggerated and unconvincing "surprised" face.',
        frameB: 'The same window, a beat later: the reflection noticeably better this time, more natural, a small proud smile creeping through the acting.',
      },
      {
        text: '11. She walks back. The front door is shut. She knocks.',
        frameA: 'Wide, on the shut front door from the pavement, her small figure approaching it.',
        frameB: 'Very close on just her knuckles against the wood and her two feet planted close together below — nothing else in frame.',
      },
      {
        text: '12. Everyone shouts, and she gives the performance of her life — BUT in the middle of it the surprise turns real, because THE ONE SHE WISHED FOR is standing right there.',
        frameA: 'The door bursting open on a room full of people and colour, her own face mid-performance, hands flying to her cheeks exactly as rehearsed.',
        frameB: 'Close on just her face now, the performance gone and something real in its place, looking straight at one particular person in the crowd she was not expecting — the person named in her answer, unmistakably present.',
      },
    ],
    extras:
      'Everybody named who is not THE SUSPECT is a fellow suspect in the first half of the book and is in the crowd on beat 12 — this is a house-full story, and nobody named is left outside it.',
    filling: [
      'THE THREE CLUES (beats 2, 4, 5) are staged in this family’s real house, using whatever the customer told us about how the birthday girl investigates.',
      'Beat 9 is played in near-silence: the notebook shutting is the whole page, not a caption explaining the decision.',
      'THE ONE SHE WISHED FOR from the interview appears nowhere before beat 12 — naming them earlier would spoil the real surprise the book is built around.',
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'never-let-go-of-the-rope',
    occasionId: 'space',
    title: t('Nunca Solte a Corda', 'Never Let Go Of The Rope'),
    logline: t(
      'A coisa que a família olha no céu toda noite não está lá hoje. Então eles vão buscar.',
      'The thing the family looks at in the sky every night is not there tonight. So they go and get it.',
    ),
    summary: t(
      'Amarrados um no outro por uma corda, com uma regra dita em voz alta na primeira página, eles sobem atrás da estrela que apagou. A corda é curta por um braço — e ela desamarra o nó de propósito, a única vez que a regra do livro inteiro é quebrada.',
      'Tied to each other by a rope, with a rule spoken out loud on the first page, they climb after the star that went out. The rope is one arm short — and she unties the knot on purpose, the one time the whole book’s rule is broken.',
    ),
    highlights: [
      t('O céu vazio, e o dedo apontando para nada', 'The empty sky, and a finger pointing at nothing'),
      t('A corda esticada até o fim, sem sobra nenhuma', 'The rope pulled taut with nothing left to give'),
      t('O nó se abrindo, de propósito, no ponto mais alto do livro', 'The knot coming open, on purpose, at the highest point in the book'),
    ],
    roles: [
      {
        id: 'hero',
        slot: 'THE CLIMBER',
        cast: 'child',
        required: true,
      },
      {
        id: 'companion',
        slot: 'THE OTHER END OF THE ROPE',
        cast: 'anyone-else',
        required: false,
        fallback:
          'The other end of the rope is tied to the window frame of home instead of to a person. Beat 11 becomes the whole house pulling her back rather than one person following her up, and beat 9’s untying is her cutting herself loose from home itself for one page — quieter, and honestly the better version.',
      },
    ],
    questions: [
      {
        id: 'sky-thing',
        group: t('O céu', 'The sky'),
        question: t(
          'Tem alguma coisa no céu que vocês olham juntos?',
          'Is there something in the sky you look at together?',
        ),
        hint: t(
          'A lua, uma estrela, o avião das sete. É o que apaga na primeira página.',
          'The moon, a star, the seven o’clock plane. It is what goes out on the first page.',
        ),
        placeholder: t('A estrela mais forte que dá para ver da janela', 'The brightest star you can see from the window'),
        suggestions: [
          t('A lua cheia, todo mês', 'The full moon, every month'),
          t('Uma estrela específica que ele já sabe achar', 'One particular star he already knows how to find'),
          t('O avião que passa toda noite às sete', 'The plane that goes over every night at seven'),
        ],
        loadBearing: true,
      },
      {
        id: 'lookout-spot',
        group: t('O céu', 'The sky'),
        question: t('De onde vocês olham?', 'Where do you look from?'),
        hint: t('Janela, quintal, laje, calçada — é o cenário da primeira e da última página.', 'Window, yard, rooftop, pavement — the setting of the first and last page.'),
        placeholder: t('Da janela do quarto dele', 'From his bedroom window'),
        suggestions: [
          t('Do quintal, deitados na grama', 'From the yard, lying in the grass'),
          t('Da janela da cozinha', 'From the kitchen window'),
          t('Da laje, quando sobem depois do jantar', 'From the rooftop, when they go up after dinner'),
        ],
        loadBearing: true,
      },
      {
        id: 'dark-fear',
        group: t('A subida', 'The climb'),
        question: t('Do que ele tem medo no escuro?', 'What is he afraid of in the dark?'),
        hint: t('Vira a nuvem que apaga tudo, na metade do livro.', 'It becomes the cloud that erases everything, halfway through the book.'),
        placeholder: t('De uma poeira que apaga as coisas', 'Of a dust that makes things disappear'),
        suggestions: [
          t('Do silêncio total', 'Of complete silence'),
          t('De perder alguém de vista', 'Of losing sight of someone'),
          t('De uma sombra grande demais para ver o fim', 'Of a shadow too big to see the end of'),
        ],
      },
      {
        id: 'always-carried',
        group: t('A subida', 'The climb'),
        question: t('O que ele leva para todo lugar?', 'What does he take everywhere?'),
        placeholder: t('Um cata-vento pequeno preso na blusa', 'A little pinwheel pinned to his shirt'),
        suggestions: [
          t('Uma lanterna pequena', 'A small torch'),
          t('Um bicho de pano na mochila', 'A stuffed animal in his backpack'),
          t('Nada — ele confia só na própria mão livre', 'Nothing — he trusts only his own free hand'),
        ],
      },
    ],
    want:
      'THE CLIMBER wants to light THE SKY THING back up — the one they look at together, every night, from THE LOOKOUT SPOT.',
    turn:
      'On beat 9 the rule spoken on page one — never let go of the rope — is broken on purpose, and it is the right thing to do.',
    beats: [
      {
        text: '1. Every night they look at THE SKY THING from THE LOOKOUT SPOT. Tonight there is nothing there.',
        frameA: 'Both of them side by side, one finger pointing up together, seen from behind at THE LOOKOUT SPOT.',
        frameB: 'Reverse angle, facing them: the empty patch of sky itself, framed exactly where THE SKY THING should be, their two upturned faces small at the bottom of the frame.',
      },
      {
        text: '2. THE CLIMBER wants to go up after it. THEREFORE they tie the rope — one end to a wrist, the other to THE OTHER END. The rule is said out loud.',
        frameA: 'Close on the knot being tied around a wrist, two sets of hands working together.',
        frameB: 'Wide, both of them standing back to check the length of rope between them, taut and straight for the first time, a whole different distance from the close knot shot.',
      },
      {
        text: '3. They climb. The house shrinks below them, and then the whole street does.',
        frameA: 'Looking straight down past their own climbing hands and feet at the rooftops of the neighbourhood, small and near.',
        frameB: 'Much higher and further back: the whole town laid out below like a map, their own house marked by something recognisable, tiny now.',
      },
      {
        text: '4. First stop: a place where everything that ever fell out of a pocket floats loose. None of it is THE SKY THING.',
        frameA: 'Arriving at the edge of a drifting field of small floating objects, both of them reaching the first of it.',
        frameB: 'Close on THE CLIMBER’s hand closing around one of the objects and turning it over, disappointed — a single object isolated where A showed a whole field.',
      },
      {
        text: '5. The rope is starting to run short. They swap places — THE CLIMBER goes first now. BUT the rule holds.',
        frameA: 'The rope pulled visibly tauter between them than in beat 2, both straining slightly.',
        frameB: 'The two of them mid-manoeuvre swapping positions on the rope, now facing the opposite direction from before, THE CLIMBER now in front where THE OTHER END was.',
      },
      {
        text: '6. Second stop: a dark dust that erases anything that passes through it. It is what put THE SKY THING out.',
        frameA: 'A dark cloud approaching them from one side, both flinching slightly away from it.',
        frameB: 'THE CLIMBER’s hand and forearm disappearing into the dust up to the elbow, the rest of the body still visible outside it — the moment of vanishing itself, not the cloud approaching.',
      },
      {
        text: '7. On the other side, THE SKY THING is there: gone dark, small, waiting.',
        frameA: 'The dust cloud thinning and parting directly ahead of them.',
        frameB: 'THE SKY THING itself, close and still, dark and quiet, filling most of the frame — the payoff the parting dust promised, shown rather than approached.',
      },
      {
        text: '8. It is too far. The rope runs out one arm’s length short.',
        frameA: 'THE CLIMBER’s arm stretched to its full length, fingers a hand’s width from reaching it.',
        frameB: 'Close on the rope itself at THE CLIMBER’s wrist, pulled bone-straight with no slack left anywhere along its length — the object of the shot is the rope, not the reach.',
      },
      {
        text: '9. THE TURN. THE CLIMBER looks back at THE OTHER END OF THE ROPE, and unties the knot.',
        frameA: 'Close on THE OTHER END’s face, watching, uncertain what is about to happen.',
        frameB: 'Close on the knot itself coming loose under THE CLIMBER’s fingers, the rope beginning to fall slack — a different subject in the same instant, the decision rather than the face behind it.',
      },
      {
        text: '10. THE CLIMBER reaches it, and it lights up in their hand — BUT now they are loose, alone in the dark.',
        frameA: 'THE CLIMBER’s hand closing around THE SKY THING, the first spark of light catching between the fingers.',
        frameB: 'Pulled back and wider: the light now fully lit in THE CLIMBER’s open hand, and around it nothing but dark — no rope, no rooftops, no other figure in frame at all.',
      },
      {
        text: '11. The loose rope reaches THE CLIMBER anyway — THE OTHER END never let it drop. It was never the rope that was holding anyone.',
        frameA: 'The slack rope trailing through the dark, THE OTHER END visible at its far edge, still holding tight and pulling it back in.',
        frameB: 'The two of them together now, hand in hand, THE SKY THING glowing between them — a warm close two-shot, replacing the dark solitary hand of the beat before.',
      },
      {
        text: '12. They climb down and hang THE SKY THING back where it belongs. From THE LOOKOUT SPOT, far below, it is exactly where it always was.',
        frameA: 'Close, both of them together at the top, easing THE SKY THING back into its place among real stars or a real sky.',
        frameB: 'The reverse of beat 1: THE LOOKOUT SPOT from outside, seen from a distance, with THE SKY THING now lit and back in its place above it, and no figures in the frame at all.',
      },
    ],
    extras:
      'Whoever else was named stays at THE LOOKOUT SPOT for the whole climb, and reappears in the final frame of beat 12 looking up from there — the ones who stayed are what makes the light worth bringing home to.',
    filling: [
      'THE SKY THING and THE LOOKOUT SPOT are exactly what the customer named, never invented from nothing — this is the one story on the shelf that is otherwise pure invention, and those two answers are what tie it to this family.',
      'The device is THE SKY THING itself, with its colour, from the moment it lights up in beat 10 onward.',
      'Beat 9 is the only place the rope may be untied. Everywhere else it stays tied, including the swap in beat 5 — that beat is a change of position, never a change of what is fastened to what.',
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'the-swap',
    occasionId: 'new-baby',
    title: t('A Troca', 'The Swap'),
    logline: t(
      'Vem alguém morar na casa. Ele pergunta onde. Dizem: no seu quarto.',
      'Somebody is coming to live in the house. He asks where. They say: in your room.',
    ),
    summary: t(
      'Uma coisa de cada vez é pedida para o irmão mais velho, e cada uma que sai volta maior: entrega o berço, ganha a cama alta. Ele entra no jogo e começa a entregar antes de pedirem — até pedirem a coisa que não tem versão maior, e ele diz não. Ninguém insiste.',
      'One thing at a time is asked of the older child, and each one that goes out comes back bigger: the cot goes, the big bed arrives. He joins the game and starts handing things over before he is asked — until they ask for the one thing with no bigger version, and he says no. Nobody insists.',
    ),
    highlights: [
      t('O berço saindo, a cama alta entrando', 'The cot going out, the tall bed coming in'),
      t('Ele entregando coisas antes de pedirem, virou jogo dele', 'Him handing things over before he is asked, turned into his own game'),
      t('A mão do adulto baixando sem pedir de volta', 'The grown-up’s hand lowering without asking again'),
    ],
    roles: [
      { id: 'grown-up', slot: 'WHOEVER ASKS', cast: 'adult', required: true },
      {
        id: 'companion',
        slot: 'THE ONE THING THAT STAYS PUT',
        cast: 'pet',
        required: false,
        fallback:
          'A piece of furniture that has never moved from its spot, named by the family’s own answer — a chair, a rug, a shelf — standing in for the pet’s job of being the one constant in a house where everything else is changing hands.',
      },
    ],
    questions: [
      {
        id: 'handed-down',
        group: t('As trocas', 'The trades'),
        question: t(
          'O que vai passar do mais velho para o bebê?',
          'What is going to pass from the older child to the baby?',
        ),
        hint: t('Berço, quarto, carrinho, cadeirinha — cada um vira uma página de troca.', 'Cot, room, pram, car seat — each one becomes a page of trading.'),
        placeholder: t('O berço, o carrinho de passeio e a cadeirinha do carro', 'The cot, the pram and the car seat'),
        suggestions: [
          t('O berço e o quarto pequeno', 'The cot and the small bedroom'),
          t('O carrinho e a cadeirinha de alimentação', 'The pram and the high chair'),
          t('Praticamente tudo — a casa é pequena', 'Almost everything — the house is small'),
        ],
        loadBearing: true,
      },
      {
        id: 'gets-in-return',
        group: t('As trocas', 'The trades'),
        question: t(
          'O que ele ganha de verdade em troca?',
          'What does he actually get in return?',
        ),
        hint: t('Cama grande, beliche, ir a pé, copo de vidro — o upgrade de cada entrega.', 'The big bed, the bunk bed, walking instead of riding, a real glass — the upgrade for each handover.'),
        placeholder: t('A cama de cima do beliche e um copo de vidro de verdade', 'The top bunk and a real glass cup'),
        suggestions: [
          t('A cama grande, alta o bastante para pular', 'The big bed, tall enough to jump on'),
          t('Ir a pé de mão dada em vez de sentado', 'Walking hand in hand instead of riding'),
          t('Um quarto novo, só dele', 'A new room, just for him'),
        ],
        loadBearing: true,
      },
      {
        id: 'wont-let-go',
        group: t('A coisa dele', 'His thing'),
        question: t(
          'Qual é a coisa que ele não larga?',
          'What is the one thing he will not let go of?',
        ),
        hint: t('É a única coisa pedida que ele recusa entregar — o coração do livro.', 'It is the one thing asked for that he refuses to hand over — the heart of the book.'),
        placeholder: t('O ursinho surrado que dorme com ele desde bebê', 'The worn-out teddy bear he has slept with since he was a baby'),
        suggestions: [
          t('A fralda de pano velha que virou paninho', 'The old cloth nappy that became his comfort blanket'),
          t('Um carrinho de brinquedo sem uma roda', 'A toy car missing one wheel'),
          t('Um travesseiro pequeno, gasto de tanto uso', 'A small pillow, worn thin from use'),
        ],
        loadBearing: true,
      },
      {
        id: 'thing-name',
        group: t('A coisa dele', 'His thing'),
        question: t('Como ele chama essa coisa?', 'What does he call it?'),
        placeholder: t('Bebê', '"Baby"'),
        suggestions: [
          t('Ele não tem nome para ela, é só "a coisa"', 'He has no name for it, it is just "the thing"'),
          t('Nenê', '"Nen-nen"'),
          t('Um nome inventado que só ele entende', 'A made-up name only he understands'),
        ],
      },
    ],
    want:
      'THE OLDER CHILD wants things to stay exactly as they are.',
    turn:
      'On beat 9 he says no, and nobody makes him — the whole book turns on the hand that lowers rather than on the child who refuses.',
    beats: [
      {
        text: '1. They say somebody is coming to live in the house. He asks where. They say: in your room.',
        frameA: 'The three of them in the living room, the news being given, his face unreadable.',
        frameB: 'Close on just him, looking at the door of his own bedroom from the hallway — a different room, a different framing, the consequence rather than the announcement.',
      },
      {
        text: '2. First request: the cot. He hands it over — BUT gets the big bed in return, and it is very tall.',
        frameA: 'The cot being carried out of the room by WHOEVER ASKS, him watching it go.',
        frameB: 'Him sitting on the edge of the new big bed, feet dangling far off the floor, looking down at the drop — same room, a very different scale.',
      },
      {
        text: '3. He discovers the big bed is good for jumping. The trade was a good one.',
        frameA: 'Him testing the mattress with one careful foot, weight half on the floor still.',
        frameB: 'Him fully airborne above the bed, both feet off it, mid-jump, arms out — a completely different energy from the cautious test in A.',
      },
      {
        text: '4. Second request: the pram. THEREFORE he walks now, hand in hand, instead of riding.',
        frameA: 'The pram being wheeled out of the garage or hallway.',
        frameB: 'Him and WHOEVER ASKS walking together on the street, hand in hand, from a wider angle further down the same street — a new location and mode of movement entirely.',
      },
      {
        text: '5. Then the car seat, the sippy cup, the bottom drawer. Each thing leaves a gap exactly its own size.',
        frameA: 'A handful of small objects going out through a doorway, one after another, mid-motion.',
        frameB: 'The empty drawer left open, close and still, its shape the only thing marking what used to live there — no motion at all, the opposite of A.',
      },
      {
        text: '6. He starts handing things over before he is asked. It has become his own game now.',
        frameA: 'Him carrying an object across the room by himself, unprompted, focused.',
        frameB: 'Close on him placing it onto a small pile of other things he has already gathered, satisfaction plain on his face — a different action, a different mood, from carrying to placing.',
      },
      {
        text: '7. Only THE ONE THING THAT STAYS PUT has not moved an inch, and he notices.',
        frameA: 'THE ONE THING THAT STAYS PUT in its usual corner, seen at a slight distance, unchanged.',
        frameB: 'Him sitting right up against it, leaning in, close and small next to it — the same object, but now he is beside it rather than looking at it from across the room.',
      },
      {
        text: '8. Then they ask for THE THING HE WILL NOT LET GO OF.',
        frameA: 'WHOEVER ASKS’s open hand held out, waiting, at a slight distance from him.',
        frameB: 'Close on his own arms, the thing pressed tight against his chest, his whole body curled protectively around it — the opposite gesture, in the same instant.',
      },
      {
        text: '9. THE TURN. He says no. Nobody insists — the hand lowers.',
        frameA: 'His face, closed and stubborn, looking straight ahead.',
        frameB: 'WHOEVER ASKS’s hand lowering, empty, and an arm going around him instead — the hand is the subject of this frame, not his face.',
      },
      {
        text: '10. He puts the thing on the highest shelf he can reach — which is high now, because he is big.',
        frameA: 'Him standing on the new big bed to stretch up towards a high shelf, the object in one hand.',
        frameB: 'The object alone on the shelf, high up, small and safe, seen from below — nobody in frame, the achievement shown rather than the effort.',
      },
      {
        text: '11. The baby arrives. It is smaller than anything he ever handed over.',
        frameA: 'The cot, now occupied, seen from a respectful distance, him standing beside it looking in.',
        frameB: 'Extreme close-up: the baby’s tiny hand next to his own hand, side by side, the difference in size the entire point of the frame.',
      },
      {
        text: '12. At night, alone, he takes the thing down off the shelf and puts it in the cot. Nobody sees. Then he goes back to the big bed, which is good for jumping.',
        frameA: 'Him in pyjamas, on tiptoe, lifting the object down off the high shelf in the dark.',
        frameB: 'The object now resting inside the cot next to the sleeping baby, and him walking away from it in the background, back towards his own bed — a wide, calm, final shot with both beds visible.',
      },
    ],
    extras:
      'Any other named adult takes one of the handovers in beats 2, 4 or 5 for their own page, so the whole household is doing the moving rather than one person alone.',
    filling: [
      'Every object handed over and every upgrade received is exactly what the customer named — never invented substitutes with no connection to this family.',
      'THE THING HE WILL NOT LET GO OF is named nowhere before beat 8. Introducing it earlier would tell the reader what the book is protecting before it needs protecting.',
      'The device is THE THING HE WILL NOT LET GO OF, with its colour, from beat 8 to the very last page.',
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'the-name-only-i-know',
    occasionId: 'new-baby',
    title: t('O Nome Que Só Eu Sei', 'The Name Only I Know'),
    logline: t(
      'Falta um nome, e a casa inteira está tentando. Ele quer ser quem escolhe.',
      'A name is missing, and the whole house is trying to find one. He wants to be the one who chooses it.',
    ),
    summary: t(
      'Ele inventa três testes para os nomes — gritar no corredor, falar perto do bicho, escrever à mão sem desistir no meio. Acha o nome certo, e perde: os adultos já tinham escolhido outro. Então para de dizer o seu nome em voz alta e passa a usá-lo só sozinho, com a boca perto da barriga.',
      'He invents three tests for names — shouting them down the hallway, saying them near the pet, writing them out by hand without giving up halfway. He finds the right name, and loses: the grown-ups had already chosen another. So he stops saying his name out loud and starts using it only alone, mouth close to the belly.',
    ),
    highlights: [
      t('O teste do corredor, gritando um nome atrás do outro', 'The hallway test, shouting one name after another'),
      t('O papel com o nome pela metade, largado no meio', 'The paper with the name half-written, abandoned partway'),
      t('O bebê virando a cabeça — igual o bicho virava', 'The baby turning its head — just like the pet used to'),
    ],
    roles: [
      { id: 'grown-up', slot: 'WHOEVER CHOOSES', cast: 'adult', required: true },
      {
        id: 'companion',
        slot: 'THE JUDGE',
        cast: 'pet',
        required: false,
        fallback:
          'With no animal to turn its head at a name, the judge becomes the echo itself: a hallway, a stairwell, a bathroom — wherever a shouted name comes back — and beat 12 trades the turning head for the crying stopping instead.',
      },
    ],
    questions: [
      {
        id: 'wanted-name',
        group: t('Os nomes', 'The names'),
        question: t('Que nome o mais velho queria dar?', 'What name did the older child want to give?'),
        hint: t('É o nome que ele encontra e perde — o coração do livro.', 'It is the name he finds and loses — the heart of the book.'),
        placeholder: t('Trovão, porque ele achava que combinava', 'Thunder, because he thought it fit'),
        suggestions: [
          t('O nome de um personagem de desenho favorito', 'The name of a favourite cartoon character'),
          t('Um nome curto que ele mesmo inventou', 'A short name he made up himself'),
          t('O nome do próprio bicho de estimação', 'The name of his own pet'),
        ],
        loadBearing: true,
      },
      {
        id: 'secret-name',
        group: t('Os nomes', 'The names'),
        question: t(
          'Como ele chama o bebê quando ninguém está ouvindo?',
          'What does he call the baby when nobody is listening?',
        ),
        hint: t('Se não existir ainda, é o nome que ele queria dar.', 'If this does not exist yet, it is the name he wanted to give.'),
        placeholder: t('Ele fala com a barriga e chama de "Chefinho"', 'He talks to the belly and calls it "Boss"'),
        suggestions: [
          t('Não existe ainda — usa o nome que ele mesmo escolheu', 'It does not exist yet — he uses the name he chose himself'),
          t('Ele chama de "amigo" quando fala sozinho', 'He calls it "friend" when talking to it alone'),
          t('Um apelido bobo que só ele usa', 'A silly nickname only he uses'),
        ],
      },
      {
        id: 'echo-place',
        group: t('Os testes', 'The tests'),
        question: t('Onde a voz dele ecoa na casa?', 'Where does his voice echo in the house?'),
        hint: t('É o cenário do primeiro teste, gritando um nome atrás do outro.', 'It is the setting of the first test, shouting one name after another.'),
        placeholder: t('No corredor comprido perto dos quartos', 'The long hallway near the bedrooms'),
        suggestions: [
          t('Na escada', 'On the stairs'),
          t('No banheiro, com a porta fechada', 'In the bathroom, with the door shut'),
          t('Na garagem vazia', 'The empty garage'),
        ],
        loadBearing: true,
      },
      {
        id: 'name-origin',
        group: t('Os nomes', 'The names'),
        question: t('De onde veio o nome que os adultos escolheram?', 'Where did the name the grown-ups chose come from?'),
        hint: t('Uma foto antiga, um parente, uma história de família.', 'An old photograph, a relative, a family story.'),
        placeholder: t('É o nome da bisavó, numa foto antiga', 'It is the great-grandmother’s name, from an old photograph'),
        suggestions: [
          t('O nome de um avô ou avó', 'A grandparent’s name'),
          t('Um nome que os dois sempre gostaram', 'A name they had both always liked'),
          t('Uma homenagem a alguém que já morreu', 'A tribute to somebody who has passed away'),
        ],
      },
    ],
    want:
      'THE OLDER CHILD wants to be the one who chooses the name.',
    turn:
      'On beat 8 he loses the choice, and instead of dropping the name, he hides it — using it alone, in secret, for the rest of the book.',
    beats: [
      {
        text: '1. A name is missing, and the whole house is trying to find one.',
        frameA: 'A list of names stuck to the fridge or a wall, the whole family gathered around it, discussing.',
        frameB: 'Him alone in front of the same list, standing on tiptoe, not tall enough to reach the top of it — a different moment, isolated from the group.',
      },
      {
        text: '2. He wants to be the one who chooses. THEREFORE he invents a test.',
        frameA: 'Him dragging a chair or stool across the floor to reach the list.',
        frameB: 'Close on his hand crossing names off the list with a pencil, serious concentration on his face just above it.',
      },
      {
        text: '3. Test one: shout the name down THE ECHO PLACE and listen to how it comes back.',
        frameA: 'Him shouting, mouth wide open, into the hallway or stairwell, whole body leaning into it.',
        frameB: 'The empty hallway itself, seen from further down it, the sound implied by his stance at the far end — a completely different subject, the echo rather than the shout.',
      },
      {
        text: '4. Test two: say the name near THE JUDGE. Some names get no reaction at all.',
        frameA: 'Him crouched close, whispering a name near the animal, hopeful.',
        frameB: 'The animal fast asleep, utterly unmoved, seen from a slightly wider angle that includes his slumping disappointment beside it.',
      },
      {
        text: '5. Test three: write the whole name out by hand. The long ones he abandons halfway.',
        frameA: 'His hand mid-word, pencil pressed to paper, focused.',
        frameB: 'The paper alone, close up, the name trailing off unfinished in the middle of a letter — no hand in frame, just the abandoned attempt.',
      },
      {
        text: '6. He finds the name: it is short, THE JUDGE reacts, and it fits on the page.',
        frameA: 'Him finishing the word on the page with a flourish, triumphant.',
        frameB: 'THE JUDGE’s ear flicking up or head lifting, alert — cutting to the reaction rather than the writing.',
      },
      {
        text: '7. He presents it. They think it is lovely — BUT they had already chosen another, from THE NAME ORIGIN.',
        frameA: 'Him holding the paper up proudly to the grown-ups.',
        frameB: 'One of the grown-ups holding up an old photograph instead, a gentle explanation on their face — a different object entirely occupying the same gesture.',
      },
      {
        text: '8. THE TURN. He loses. THEREFORE he stops saying his name out loud, and starts using it alone, mouth close to the belly.',
        frameA: 'His own paper being folded away into a drawer, his hand pushing it in.',
        frameB: 'Him leaning against the belly, mouth close, speaking quietly — a completely different scene, tender rather than disappointed.',
      },
      {
        text: '9. He uses that name every day. He tells it things. He is the only voice that calls the baby by it.',
        frameA: 'Him lying with his ear or cheek against the belly, mid-conversation.',
        frameB: 'The same pose, another day entirely — different light, a slightly different angle, showing this has become a habit rather than a single moment.',
      },
      {
        text: '10. The baby is born with the grown-ups’ name written on everything: the wristband, the door, the cake.',
        frameA: 'Close on the hospital wristband, the chosen name printed on it.',
        frameB: 'The bedroom door at home, the same name now lettered onto it — a different object, same name, marking the shift from hospital to home.',
      },
      {
        text: '11. The baby cries and will not stop for anyone. BUT he comes close and uses his own name for it.',
        frameA: 'The baby crying, the whole family gathered and failing to help, mid-attempt.',
        frameB: 'Him alone stepping closer, mouth near the baby’s ear, everyone else pulled back out of focus behind him — the crowd of A replaced by just the two of them.',
      },
      {
        text: '12. The baby goes quiet, and turns its head — exactly like THE JUDGE used to. Everyone thinks it is luck. Only he knows it was the test.',
        frameA: 'The baby calm now, head turning towards him.',
        frameB: 'Him and THE JUDGE side by side, both looking on, a small private and knowing look passed only between the two of them — a wider shot that includes the one other creature who understands what just happened.',
      },
    ],
    extras:
      'Everyone in the house has a name on the list in beat 1 and a rejected guess somewhere in tests three to five — nobody is left with nothing to have tried.',
    filling: [
      'THE WANTED NAME never wins. It is found in beat 6 and lost in beat 7, and it is not spoken again until it becomes the secret name of beats 8 onward.',
      'THE NAME ORIGIN (a photograph, a relative, a family story) is exactly what the customer told us, never a generic "family tradition" invented with nothing behind it.',
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'the-guide',
    occasionId: 'holiday',
    title: t('O Guia', 'The Guide'),
    logline: t(
      'Ela é baixa demais para ver o mapa. Então aprende a guiar do jeito dela.',
      'She is too short to see the map. So she learns to guide her own way.',
    ),
    summary: t(
      'Enquanto os adultos andam pelos lugares famosos, ela vai marcando o caminho por sinal — a porta azul, o cachorro do telhado — em vez de por nome. No terceiro dia todo mundo está perdido, e alguém finalmente se abaixa até a altura dela e pergunta.',
      'While the grown-ups walk between the famous places, she quietly starts marking the route by sign rather than by name — the blue door, the dog on the roof. On the third day everybody is lost, and somebody finally crouches down to her height and asks.',
    ),
    highlights: [
      t('O mapa aberto bem acima da cabeça dela', 'The map held open well above her head'),
      t('A porta azul, guardada em segredo como um sinal', 'The blue door, kept secretly as a marker'),
      t('Um adulto se abaixando até os olhos ficarem na mesma linha', 'A grown-up crouching down until their eyes are level'),
    ],
    roles: [
      { id: 'grown-up', slot: 'THE ONES WHO LEAD', cast: 'adult', required: true },
      {
        id: 'companion',
        slot: 'THE ONE WHO FOLLOWS ALONG',
        cast: 'anyone-else',
        required: false,
        fallback:
          'Nobody else was named for this part, so her collection of signs stays entirely secret until beat 9 — which is the better version anyway, since nobody to tell it to makes the discovery in beat 8 land harder.',
      },
    ],
    questions: [
      {
        id: 'trip-destination',
        group: t('A viagem', 'The trip'),
        question: t('Para onde a família foi ou vai?', 'Where did or will the family go?'),
        placeholder: t('Lisboa, para conhecer a cidade da bisavó', 'Lisbon, to see her great-grandmother’s city'),
        suggestions: [
          t('Uma praia diferente da de sempre', 'A different beach from their usual one'),
          t('Uma cidade histórica com ruas estreitas', 'A historic town with narrow streets'),
          t('A casa de parentes numa cidade grande', 'Relatives’ house in a big city'),
        ],
        loadBearing: true,
      },
      {
        id: 'trip-places',
        group: t('A viagem', 'The trip'),
        question: t('Três ou quatro lugares dessa viagem?', 'Three or four places from that trip?'),
        hint: t('São as paradas onde ela guarda um sinal novo.', 'These are the stops where she picks up a new sign.'),
        placeholder: t('O mirante, o mercado coberto e a igreja da praça', 'The viewpoint, the covered market and the church on the square'),
        suggestions: [
          t('A praia, o farol e o mercado de peixe', 'The beach, the lighthouse and the fish market'),
          t('O castelo, a praça principal e a sorveteria', 'The castle, the main square and the ice cream shop'),
          t('A casa dos parentes, o parque e o shopping', 'The relatives’ house, the park and the shopping centre'),
        ],
        loadBearing: true,
      },
      {
        id: 'only-she-noticed',
        group: t('Os sinais', 'The signs'),
        question: t('Alguma coisa que ela reparou e mais ninguém?', 'Something she noticed that nobody else did?'),
        hint: t('É a primeira coisa que ela guarda, na segunda batida.', 'It is the first thing she keeps, on the second beat.'),
        placeholder: t('Uma porta azul bem no meio de uma rua cinza', 'A blue door right in the middle of a grey street'),
        suggestions: [
          t('Um gato que dorme sempre no mesmo parapeito', 'A cat that always sleeps on the same windowsill'),
          t('O cheiro de uma padaria numa esquina específica', 'The smell of a bakery on one particular corner'),
          t('Um sino que toca sempre na mesma hora', 'A bell that rings at the same time every day'),
        ],
        loadBearing: true,
      },
      {
        id: 'silly-best-place',
        group: t('A viagem', 'The trip'),
        question: t('Qual foi o lugar bobo que virou o melhor da viagem?', 'What was the silly place that turned out to be the best of the trip?'),
        hint: t('É para onde ela leva todo mundo no final.', 'It is where she leads everybody at the end.'),
        placeholder: t('Um banco de praça sem graça nenhuma, perto de um chafariz', 'An unremarkable park bench near a fountain'),
        suggestions: [
          t('Uma escada qualquer com uma vista boa', 'Some random staircase with a good view'),
          t('Uma praça pequena sem nome que vira ponto de encontro', 'A small unnamed square that becomes their meeting point'),
          t('Uma sorveteria de esquina, não a famosa', 'A corner ice cream shop, not the famous one'),
        ],
        loadBearing: true,
      },
    ],
    want:
      'THE BIRTHDAY GIRL — no, THE GUIDE wants somebody to ask her something, for once.',
    turn:
      'On beat 8 a grown-up finally crouches down to her height. It is the only beat in the book where the eyes are on the same line.',
    beats: [
      {
        text: '1. They arrive in THE DESTINATION. THE ONES WHO LEAD open a map, and she is too short to see over it.',
        frameA: 'The arrival, suitcases and all, at street level, ordinary and busy.',
        frameB: 'Straight up from below her: the underside of the open map held above her head, her small upturned face just visible at the bottom edge.',
      },
      {
        text: '2. At the first place, beautiful and full of a queue, she looks the other way and sees something nobody else noticed.',
        frameA: 'The famous sight and its queue, everybody else looking at it.',
        frameB: 'Her turned the opposite direction from the crowd, looking at THE THING ONLY SHE NOTICED, isolated in her own small frame away from the group.',
      },
      {
        text: '3. She tugs a sleeve to show someone. They say "later".',
        frameA: 'Her hand pulling at an adult’s sleeve, looking up.',
        frameB: 'The adult’s face, pointed forward at the queue, not looking down — the sleeve released, her hand already falling away in the corner of frame.',
      },
      {
        text: '4. THEREFORE she starts keeping her own record, marking the route by sign instead of by name.',
        frameA: 'Her stopped in front of THE THING SHE NOTICED, standing very still, taking it in.',
        frameB: 'Close on her own hand sketching or tracing the sign in a small notebook or just in the air — a private, deliberate act, different from simply standing and looking.',
      },
      {
        text: '5. At the second place, the same thing happens. Her collection grows.',
        frameA: 'The second named place, crowded, ordinary tourist business happening.',
        frameB: 'Her small figure slightly apart from the group, adding a new sign to her collection, satisfied and a little proud — a private aside from the crowd shot.',
      },
      {
        text: '6. On the third day everybody is tired, the map does not match the street, and they are lost.',
        frameA: 'The map held out, turned this way and that, confused adult faces around it.',
        frameB: 'All their faces together, exhausted and slightly cross with each other — pulled back to a wider shot that includes everyone, replacing the close map confusion.',
      },
      {
        text: '7. She recognises THE THING SHE NOTICED from earlier — BUT nobody thinks to ask her anything.',
        frameA: 'The sign itself, small in the corner of a busy, unfamiliar-looking street.',
        frameB: 'Her looking straight up, waiting, hopeful — a close shot on just her face, a private moment inside the group’s confusion.',
      },
      {
        text: '8. THE TURN. Somebody finally crouches down and asks: do you know where we are?',
        frameA: 'A grown-up crouching down, one knee bent, reaching her eye level.',
        frameB: 'Extremely close and level: just the two sets of eyes, hers and theirs, on exactly the same line — the only shot in the whole book framed this way.',
      },
      {
        text: '9. She knows. THEREFORE she goes first.',
        frameA: 'Her first small step forward, determined, everyone still behind her.',
        frameB: 'The whole family now in a line behind her, following, seen from ahead of her — the reverse of the step, showing the shape of the group now trailing her.',
      },
      {
        text: '10. She leads them by things that are not on any map — the smell of a bakery, a cat asleep on a roof.',
        frameA: 'The group passing a bakery, her leading confidently, pointing without looking back.',
        frameB: 'Everybody’s heads tipped up together, following her lead, looking at something above the street — a cat, a sign, a window — a completely different sightline from the street-level bakery shot.',
      },
      {
        text: '11. And she does not lead them home. She leads them to THE SILLY PLACE, which she has kept since the first day.',
        frameA: 'The group arriving somewhere clearly not grand or expected, faces mildly puzzled.',
        frameB: 'The same place, now filled with everyone settling in, unhurried and pleased despite themselves — a change of mood entirely from the initial puzzlement.',
      },
      {
        text: '12. It is a small silly place. And it is where they come back to, every day, until the trip is over.',
        frameA: 'Everybody gathered there together, relaxed, a single day.',
        frameB: 'The same spot, another day, another light — the family already there and settled, as if it has become a habit, not an event.',
      },
    ],
    extras:
      'Whoever else came on the trip is part of the line following her from beat 9 onward — the trail behind her is where a named companion, if there is one, gets their page.',
    filling: [
      'THE PLACES ARE THE REAL ONES THE CUSTOMER NAMED, in the order that makes an actual route through THE DESTINATION.',
      'THE SILLY PLACE is not on the itinerary anybody would print — it earns its status entirely from having been noticed first by a child, which is the whole point of the book.',
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'how-much-further',
    occasionId: 'holiday',
    title: t('Quanto Falta', 'How Much Further'),
    logline: t(
      'Ela combinou em voz alta com todo mundo: vai ser a primeira a ver.',
      'She announced it out loud to everyone: she is going to be the first to see it.',
    ),
    summary: t(
      'A viagem inteira medida em unidades de criança — três músicas, dois túneis, um lanche. Ela se recusa a dormir porque combinou ser a primeira a ver o destino. Dez minutos antes, ela perde. O carro para, e ninguém desce até ela acordar.',
      'The whole trip measured in child-sized units — three songs, two tunnels, one snack. She refuses to sleep because she announced she would be the first to see the destination. Ten minutes before arriving, she loses. The car stops, and nobody gets out until she wakes up.',
    ),
    highlights: [
      t('Os dedos contando as músicas, uma a uma', 'Fingers counting the songs, one by one'),
      t('O rosto dela dormindo, encostado no vidro', 'Her face asleep, pressed against the glass'),
      t('O carro parado, e ninguém descendo', 'The car stopped, and nobody getting out'),
    ],
    roles: [
      { id: 'grown-up', slot: 'WHOEVER DRIVES OR CARRIES', cast: 'adult', required: true },
      {
        id: 'companion',
        slot: 'THE ONE TRAVELLING ALONGSIDE',
        cast: 'anyone-else',
        required: false,
        fallback:
          'Travelling alone, she spreads her own things out over the empty seat beside her — a bag, a toy, a shoe kicked off — and that empty, cluttered seat is beat 5’s contrast instead of somebody else asleep on it.',
      },
    ],
    questions: [
      {
        id: 'how-they-travel',
        group: t('A viagem', 'The trip'),
        question: t('Como é a viagem?', 'What is the journey like?'),
        hint: t('De carro, ônibus, avião — e quantas horas mais ou menos.', 'By car, bus, plane — and roughly how many hours.'),
        placeholder: t('De carro, umas cinco horas, saindo de madrugada', 'By car, about five hours, leaving before dawn'),
        suggestions: [
          t('De avião, duas horas de voo', 'By plane, a two-hour flight'),
          t('De carro, umas três horas com uma parada', 'By car, about three hours with one stop'),
          t('De ônibus, uma noite inteira', 'By bus, a whole night'),
        ],
        loadBearing: true,
      },
      {
        id: 'trip-ritual',
        group: t('A viagem', 'The trip'),
        question: t('O que sempre acontece nessa viagem?', 'What always happens on this trip?'),
        hint: t('A música, o lanche, o enjoo, a parada de sempre — vira uma das unidades de medida.', 'The song, the snack, the car sickness, the usual stop — becomes one of the units of measure.'),
        placeholder: t('Sempre para no mesmo posto para comer pastel', 'Always stops at the same service station for a pastel'),
        suggestions: [
          t('A mesma playlist toca o caminho inteiro', 'The same playlist plays the whole way'),
          t('Alguém sempre enjoa depois de uma hora', 'Somebody always gets carsick after an hour'),
          t('Para sempre no mesmo lugar para o café', 'Always stops at the same place for coffee'),
        ],
        loadBearing: true,
      },
      {
        id: 'trip-destination-sight',
        group: t('A chegada', 'The arrival'),
        question: t('O que eles vão ver quando chegar?', 'What will they see when they arrive?'),
        placeholder: t('O mar, pela primeira vez para ela', 'The sea, for the first time for her'),
        suggestions: [
          t('A casa da avó, depois de um ano sem ir', 'Grandma’s house, after a year away'),
          t('Uma montanha coberta de neve', 'A mountain covered in snow'),
          t('Um parque de diversões enorme', 'A huge theme park'),
        ],
        loadBearing: true,
      },
      {
        id: 'always-sleeps',
        group: t('A viagem', 'The trip'),
        question: t('Quem sempre dorme no caminho?', 'Who always falls asleep on the way?'),
        placeholder: t('O pai, sempre, em qualquer viagem', 'Dad, always, on every single trip'),
        suggestions: [
          t('Ela mesma, sempre, por mais que resista', 'She herself, always, no matter how hard she fights it'),
          t('O irmão mais novo, em cinco minutos', 'Her younger brother, within five minutes'),
          t('Ninguém — a família inteira briga para ficar acordada', 'Nobody — the whole family fights to stay awake'),
        ],
      },
    ],
    want:
      'She wants to be the first to see THE SIGHT, and she has said so out loud to everyone.',
    turn:
      'On beat 9 her eyes close and she loses — and the book turns to belong to whoever is still awake around her.',
    beats: [
      {
        text: '1. Still dark. She is the first one up in the whole house, because today is the day.',
        frameA: 'The house in near-darkness, her already dressed and ready by the door.',
        frameB: 'Everybody else still visibly asleep in another room, seen through a doorway — the contrast, not the readiness itself.',
      },
      {
        text: '2. First question: how much further? Answer: three songs. THEREFORE she counts them.',
        frameA: 'Her at the window, watching the road go by, listening.',
        frameB: 'Close on her fingers, one held up, then two — counting in the foreground, the window blurred behind.',
      },
      {
        text: '3. The three end and they have not arrived. New unit: two tunnels.',
        frameA: 'The car entering the mouth of the first tunnel, darkness closing in ahead.',
        frameB: 'Inside the tunnel, her face lit only by the passing tunnel lights, striped with light and dark — a completely different lighting condition from the approach shot.',
      },
      {
        text: '4. Then: one snack. It disappears far too fast.',
        frameA: 'The snack packet being opened, her hands eager.',
        frameB: 'The empty packet held upside down over her open palm, nothing left to fall out — the same object, entirely emptied.',
      },
      {
        text: '5. Then: one nap — BUT she refuses, and announces it out loud to everyone.',
        frameA: 'Her sitting bolt upright, one finger raised, declaring something firmly to the car.',
        frameB: 'THE ONE TRAVELLING ALONGSIDE already fast asleep, head lolling — or, alone, her own things spread messily across the empty seat beside her — a different subject entirely from her declaration.',
      },
      {
        text: '6. The landscape outside starts to change colour. She recognises they are close without anyone saying a word.',
        frameA: 'The scenery as it has looked for hours, familiar and unremarkable.',
        frameB: 'The same framing, the scenery visibly different now — new colours, new shapes on the horizon — the same shot repeated to show the world itself has changed rather than the car.',
      },
      {
        text: '7. She asks again, and the answer changes: not far now, just around here.',
        frameA: 'Her leaning forward between the front seats, asking.',
        frameB: 'WHOEVER DRIVES OR CARRIES’s eyes in the rear-view mirror, smiling back at her — a completely different angle, from the front of the car looking back rather than the back looking forward.',
      },
      {
        text: '8. And that is exactly when it gets longer. The last stretch is always the longest.',
        frameA: 'A straight road ahead through the windscreen, seemingly endless.',
        frameB: 'The identical straight road, now from behind the car, showing how much of it is still ahead — same road, opposite direction, no end in sight either way.',
      },
      {
        text: '9. THE TURN. Her eyes close. She loses.',
        frameA: 'Her head starting to nod, fighting it, eyes heavy.',
        frameB: 'Her fully asleep now, cheek against the window glass, mouth slightly open — a full transition from resisting to gone.',
      },
      {
        text: '10. The car stops. Nobody gets out. Everyone waits, without opening a single door.',
        frameA: 'The car stopped, seen from outside, engine off, nobody moving.',
        frameB: 'Inside the car, the grown-ups turned around in their seats, looking back at her quietly, patient — an interior view replacing the exterior stillness.',
      },
      {
        text: '11. Somebody wakes her gently, a hand on her knee, the right way.',
        frameA: 'A hand resting on her knee, still, not shaking her.',
        frameB: 'Her eyes opening, slow and blinking, the hand still there but her face now the subject rather than the hand.',
      },
      {
        text: '12. She is the first out of the car, and the first to see THE SIGHT. It was promised, and it was kept.',
        frameA: 'The car door opening, her foot reaching the ground first.',
        frameB: 'Her from behind, small against the full width of THE SIGHT laid out in front of her — the payoff itself, filling the frame, nobody else visible ahead of her.',
      },
    ],
    extras:
      'Whoever else is in the car is awake and waiting with everyone else in beat 10 — the whole point of that page is that the car is full of people who chose to let her be first.',
    filling: [
      'The units of measurement (songs, tunnels, the snack) are exactly what the customer told us about THIS trip, converted into things a child can count rather than left as hours and kilometres.',
      'This story is already written in the warm voice the catalog default already uses — measured in arms, distances and small counted things rather than numbers — so no adjustment to tone is needed for it.',
    ],
  },

]

/* ------------------------------------------------------------------ *
 * Casting the real family into the mould
 * ------------------------------------------------------------------ */

export function getStory(id: string): StoryDef | undefined {
  return STORIES.find((s) => s.id === id)
}

/**
 * Whether this character is the baby the book is waiting for.
 *
 * Harder than it looks, and it was wrong. Searching the role for "bebê" casts
 * every relative as the newborn, because the natural way to fill that box is
 * to say who somebody is *to* the baby: "irmã do bebê", "primo do bebê", "mãe
 * do bebê". A test order with a seven-year-old cousin came back with the
 * cousin cast as the baby, the real baby demoted, and three of the five
 * stories withdrawn from the menu because no child could be found.
 *
 * So the relation is ruled out first, and only then is what is left read as a
 * description of a newborn.
 */
const RELATION_TO_BABY =
  /\b(do|da|de|of|to)\s+(o\s+|a\s+|the\s+)?(beb[êe]|nen[eé]m|baby)/i

const NEWBORN =
  /rec[ée]m[- ]nascid|newborn|unborn|por nascer|ainda n[ãa]o nasceu|^\s*(o |a |the )?(beb[êe]|nen[eé]m|baby)\b/i

const isBaby = (c: Character) => {
  if (c.kind !== 'person') return false
  const role = c.role ?? ''
  if (RELATION_TO_BABY.test(role)) return false
  return (
    NEWBORN.test(role) ||
    NEWBORN.test(c.age ?? '') ||
    /^\s*(o |a |the )?(beb[êe]|nen[eé]m|baby)\s*$/i.test(c.name)
  )
}

/** Everyone who can carry a part: named, a person, and not the baby itself. */
function people(brief: BookBrief): Character[] {
  return brief.characters.filter(
    (c) => c.kind === 'person' && c.name.trim() && !isBaby(c),
  )
}

function pets(brief: BookBrief): Character[] {
  return brief.characters.filter((c) => c.kind === 'pet' && c.name.trim())
}

/**
 * Whoever is going to be the child in this book.
 *
 * The customer is never asked "is there an older sibling?", because they have
 * just filled in a form that answers it. What matters is that this is the
 * only place that decides, so a story cannot quietly acquire a child on page
 * four that the casting did not grant on page one.
 *
 * A cousin and a friend are as good as a sibling here: the part is "a child
 * who is not the baby and already knows this family", and the role text never
 * calls anybody a brother or a sister unless the customer did.
 */
function child(brief: BookBrief): Character | undefined {
  const candidates = people(brief).filter((c) => {
    const years = Number((c.age ?? '').match(/\d+/)?.[0])
    if (Number.isFinite(years)) return years <= 14
    return /filh|irm|crian|sobrin|prim|amig|child|sibling|niece|nephew|cousin|friend/i.test(
      c.role ?? '',
    )
  })
  // Youngest first, so a nine-year-old carries it rather than a fifteen-year-old.
  return candidates.sort((a, b) => {
    const ay = Number((a.age ?? '').match(/\d+/)?.[0] ?? 99)
    const by = Number((b.age ?? '').match(/\d+/)?.[0] ?? 99)
    return ay - by
  })[0]
}

function adults(brief: BookBrief): Character[] {
  const kid = child(brief)
  return people(brief).filter((c) => c.id !== kid?.id)
}

/**
 * One named person who is not the child this book is about.
 *
 * The part for whoever doubts her, or whoever is hiding something. A grown-up
 * first, because that is who it usually is, and another child when the family
 * named no adult — both play it as written, and a nine-year-old brother who
 * says it is a cow bone is if anything the better version.
 */
function someoneElse(brief: BookBrief): Character | undefined {
  const others = adults(brief)
  return others[0]
}

/**
 * Whether this story can be told about this family at all.
 *
 * The check that stops the one failure that matters: a book handed to a
 * family that gives them a child they do not have. A story whose required
 * role cannot be cast is not offered, and the two stories with no child in
 * them are why there is always something left on the menu.
 */
export function canTell(story: StoryDef, brief: BookBrief): boolean {
  return story.roles.every((role) => {
    if (!role.required) return true
    if (role.cast === 'child') return Boolean(child(brief))
    if (role.cast === 'adult') return adults(brief).length > 0
    if (role.cast === 'anyone-else') return Boolean(someoneElse(brief))
    if (role.cast === 'pet') return pets(brief).length > 0
    return true
  })
}

/**
 * The books on this customer's shelf: the right occasion, and tellable about
 * this family.
 *
 * Two filters, and the order of them is not arbitrary. The occasion is what
 * the customer chose; the cast is what they have. A story withdrawn for the
 * second reason is a real absence the customer could fix by naming another
 * character, and the chooser says so rather than showing a shorter list with
 * no explanation.
 */
export function storiesFor(brief: BookBrief): StoryDef[] {
  return STORIES.filter(
    (story) => story.occasionId === brief.occasionId && canTell(story, brief),
  )
}

/**
 * Whether this occasion has a shelf at all.
 *
 * Asked before the cast exists, which is why it does not take a brief: the
 * wizard has to know on the occasion screen whether the screens after it are
 * the shelf ones or the invented ones, and at that point nobody has been
 * named yet. `storiesFor` is the narrower question, asked later.
 *
 * 'child' deliberately answers false. It is the most-sold occasion in the
 * trade and it gets a shelf in the next round; until those books are
 * written, saying it has one would put a customer on an empty screen.
 */
export function occasionHasShelf(occasionId: OccasionId | string): boolean {
  return STORIES.some((story) => story.occasionId === occasionId)
}

/**
 * How many drawings this order is.
 *
 * Thirteen, unless it is a colouring book of a story whose beats have been
 * cut into frames — then it is two a beat, which is where twenty-four comes
 * from. Answers undefined when the caller should use the product's own
 * default, so there is one number in the catalog and one exception here
 * rather than two numbers that have to agree.
 */
export function panelCount(
  story: StoryDef | undefined,
  brief: BookBrief,
): number | undefined {
  if (!story || brief.finish !== 'coloring' || !isFramed(story)) return undefined
  return story.beats.length * 2
}

/**
 * How many pages THIS order is, whichever finish it was ordered in.
 *
 * `panelCount` only ever answers for the coloured-in twenty-four; everything
 * else that has to know how long the book is was defaulting to the catalog's
 * BOOK_PAGES (13) whenever this was not that one case — which was correct by
 * accident for the five thirteen-beat baby stories and wrong for a framed
 * shelf story ordered as a reading book. The dinosaur book has twelve beats.
 * Asked for a thirteen-page reading storyboard, the model was being told to
 * fill a page no beat exists for — the mould's own page count and the
 * ceiling handed to the model disagreed inside a single prompt.
 *
 * A story's own beat count is always the right answer once a story has been
 * chosen, in both finishes: twelve captioned pages for the dinosaur book read
 * aloud, twenty-four wordless panels for it coloured in, thirteen either way
 * for a baby story. Nothing here is a product default any more — it is read
 * off the mould. Callers still fall back to the catalog's BOOK_PAGES
 * themselves when no story was chosen at all, because that is the one case
 * this function cannot answer.
 */
export function pageCountFor(
  story: StoryDef | undefined,
  brief: BookBrief,
): number | undefined {
  if (!story) return undefined
  return panelCount(story, brief) ?? story.beats.length
}

/**
 * Whether this order is printed without a single word inside it.
 *
 * Asked by everything downstream of the storyboard — the illustrator, the
 * sheets, the PDF — none of which has any business knowing what a framed
 * beat is. It takes the brief because that is what those places hold, and it
 * is the same question `panelCount` answers, phrased as a yes or no.
 */
export function isWordless(brief: BookBrief): boolean {
  const story = brief.chosenStoryId ? getStory(brief.chosenStoryId) : undefined
  return Boolean(panelCount(story, brief))
}

/**
 * The questions this story actually needs, with the ones that do not apply
 * already dropped.
 *
 * This is the whole point of the change, in one function. The old interview
 * asked nine questions written from scratch about a story nobody had chosen
 * yet, so half of them fed nothing. These are the slots of a story that
 * already exists, and every one of them lands somewhere on a page.
 */
export function questionsFor(
  story: StoryDef,
  brief: BookBrief,
): InterviewQuestion[] {
  const hasPet = pets(brief).length > 0
  return [PLACE_QUESTION, ...story.questions]
    .filter((q) => {
      if (q.showIf === 'has-pet') return hasPet
      if (q.showIf === 'no-pet') return !hasPet
      return true
    })
    .map((q) => ask(q, brief))
}

/**
 * The question every book asks, whether or not it came off the shelf.
 *
 * The invented flow has no story to take questions from and still needs the
 * setting, so it asks this one on its own while the rest are being written.
 */
export function openingQuestions(brief: BookBrief): InterviewQuestion[] {
  return [ask(PLACE_QUESTION, brief)]
}

function ask(q: StoryQuestionDef, brief: BookBrief): InterviewQuestion {
  return {
    id: q.id,
    group: say(q.group, brief),
    question: say(q.question, brief),
    hint: q.hint ? say(q.hint, brief) : undefined,
    placeholder: q.placeholder ? say(q.placeholder, brief) : undefined,
    suggestions: q.suggestions.map((sug) => say(sug, brief)),
  }
}

/**
 * What to invent, for the slots this story leans on that came back empty.
 *
 * The other half of making every question optional. Dropping the door is easy
 * and on its own it is a downgrade: a story that reads a favourite dinosaur
 * off an answer, handed nothing, will either write around the hole until the
 * beat stops meaning anything or pick something at random on page seven and
 * something else on page nine.
 *
 * So an empty slot is named, once, before the beats — with an example of the
 * SHAPE an answer takes, which the question already carries as its
 * placeholder. "Invent a favourite dinosaur" produces a generic one;
 * "something like: Tricerátops — she corrects everybody who says it wrong"
 * produces one with a child attached to it. Then the writer is told to hold
 * it, because the failure that actually reaches a customer is not a wrong
 * guess, it is two different guesses in one book.
 */
export function assumptionsFor(story: StoryDef, brief: BookBrief): string[] {
  const answered = new Set(
    brief.interview.filter((a) => a.answer.trim()).map((a) => a.questionId),
  )
  // The setting is asked as a question and stored as a field: the wizard
  // lifts it out of the interview into `brief.place`, so it is never in the
  // list above however plainly it was answered. Without this the prompt told
  // the writer to invent a city the customer had just typed.
  if (brief.place.trim()) answered.add(PLACE_QUESTION_ID)
  const shown = new Set(questionsFor(story, brief).map((q) => q.id))
  const missing = [PLACE_QUESTION, ...story.questions].filter(
    (q) => q.loadBearing && shown.has(q.id) && !answered.has(q.id),
  )
  if (missing.length === 0) return []

  return [
    'NOBODY ANSWERED THESE, AND THAT IS ALLOWED. No question in this product is compulsory — most people buying a present for somebody else\'s child genuinely do not know the answer to half of them, and stopping them at a door is worse than deciding for them.',
    '',
    'So you decide, and the rule is: pick the ordinary thing, not the interesting one. What is wanted is something so plausible the family would not notice it was invented — the default for a Brazilian household of this kind, in this place, with these people in it. A slot filled with something striking is how a book stops being about them.',
    '',
    'THEN HOLD IT. Write it down for yourself and use the same one on every page it appears. One guess, carried all the way through, reads as a fact nobody mentioned; two different guesses in one book reads as a broken book, and it is the only failure this can actually cause.',
    '',
    ...missing.map((q) => {
      const shape = q.placeholder ? ` An answer here looks like: "${q.placeholder.en}".` : ''
      return `- NOT ANSWERED — ${q.question.en}${shape} Choose one and keep it.`
    }),
  ]
}

/**
 * The cast list handed to the writer, by name, before it sees the beats.
 *
 * Written as instructions rather than as data because the failure it guards
 * against is a writer improvising: told "THE FINDER = Aurora", a model will
 * happily also invent Aurora's little brother when a beat feels like it wants
 * one. Told "these are the only people in this book", it does not.
 */
export function castingFor(story: StoryDef, brief: BookBrief): string[] {
  const lines: string[] = [
    'CASTING. The people and animals listed below are the only ones in this book. This is the hardest rule here and it is not a preference.',
    '',
    'NOBODY WHO MATTERS MAY BE INVENTED. Do not add a grandmother, a grandfather, an aunt, a neighbour, a second parent, an older sibling, a friend or an animal, however naturally a beat seems to ask for one. If a beat needs a pair of hands and there is only one person, that person does it alone and the house is quieter. The beats bend; the cast does not.',
    '',
    'The line between a character and a passer-by: a character is anybody named, anybody who speaks, or anybody who comes back on a second page. The baker who lifts a cloth, a stranger in a queue, people waiting on a platform — those are scenery, they stay unnamed, they never speak and they never return. The moment one of them acquires a name, a line of dialogue or a second appearance, an invented relative has entered the book.',
    '',
    'This matters more here than in any other kind of book. A family who is given a grandmother they do not have, or an older sister for a first child, is not reading a book with a small error in it — they are reading a book about somebody else.',
    '',
    'The same rule with no baby in it: a book about a child digging up her own street must be about HER street and HER household. An invented best friend to talk to while she digs is the identical failure wearing different clothes.',
  ]

  const kid = child(brief)
  const grownUps = adults(brief)
  const animals = pets(brief)
  const baby = brief.characters.find(isBaby)

  // Everybody the roles below actually claim. Whoever is left over is named
  // explicitly at the end rather than left for the writer to place, which is
  // how a customer's own child ended up appearing on no page at all.
  const cast = new Set<string>()

  for (const role of story.roles) {
    if (role.cast === 'child') {
      if (kid) {
        cast.add(kid.id)
        lines.push(
          `- ${role.slot} is ${kid.name}${kid.age ? `, ${kid.age}` : ''}${
            kid.role ? ` (${kid.role})` : ''
          }. Refer to them by name, and never as "the sister" or "the brother" unless the customer's own words for them say so.`,
        )
      } else if (role.fallback) {
        lines.push(`- ${role.slot}: ${role.fallback}`)
      }
    } else if (role.cast === 'adult') {
      // At most two. The slot is the couple expecting the baby, and pouring
      // every named adult into it told the writer a grandmother was one of
      // the parents. The rest are real people with a place of their own, and
      // they get it from the leftovers rule below.
      const cast2 = grownUps.slice(0, 2)
      for (const g of cast2) cast.add(g.id)
      lines.push(
        cast2.length > 0
          ? `- ${role.slot}: ${cast2
              .map((c) => `${c.name}${c.role ? ` (${c.role})` : ''}`)
              .join(', ')}. Use their names. If there is only one, the house is quieter and the beats run exactly as written.`
          : `- ${role.slot}: nobody was named for this part, so keep the grown-up off the page and let the beats happen without one.`,
      )
    } else if (role.cast === 'anyone-else') {
      const other = someoneElse(brief)
      if (other) cast.add(other.id)
      lines.push(
        other
          ? `- ${role.slot} is ${other.name}${other.age ? `, ${other.age}` : ''}${
              other.role ? ` (${other.role})` : ''
            }. One person, not a pair, and by name every time. Whether they are a grown-up or another child changes nothing about the part.`
          : `- ${role.slot}: nobody else was named, so nobody plays this part. ${role.fallback ?? 'Leave it out rather than inventing somebody.'}`,
      )
    } else if (role.cast === 'pet') {
      if (animals[0]) cast.add(animals[0].id)
      lines.push(
        animals.length > 0
          ? `- ${role.slot} is ${animals[0].name}, the family's own animal${
              animals[0].role ? ` (${animals[0].role})` : ''
            }. By name, every time.`
          : `- ${role.slot}: this family has no animal. ${role.fallback ?? 'Leave the part out rather than inventing one.'}`,
      )
    }
  }

  if (baby) cast.add(baby.id)

  const leftOver = brief.characters.filter(
    (c) => c.name.trim() && !cast.has(c.id),
  )
  if (leftOver.length > 0) {
    lines.push(
      `- ALSO IN THIS BOOK, and this is not optional: ${leftOver
        .map(
          (c) =>
            `${c.name}${c.role ? ` (${c.role})` : ''}${c.age ? `, ${c.age}` : ''}`,
        )
        .join('; ')}. The customer named them, so they are in the book, and a named person who appears on no page is the one failure this book cannot ship with. ${story.extras}`,
    )
  }

  if (baby) {
    lines.push(
      `- THE BABY is ${baby.name.trim() ? baby.name : 'not named yet — call it "the baby" throughout and never invent a name'}.`,
    )
  }

  const genders = brief.characters
    .filter((c) => c.gender)
    .map((c) => `${c.name}: ${c.gender}`)
  if (genders.length > 0) {
    lines.push(
      `- HOW TO SPEAK ABOUT THEM: ${genders.join('; ')}. "neutral" means write around the grammatical marking — use the name instead of the pronoun, choose nouns that do not inflect, and rebuild the sentence when an adjective would force a choice. Do not invent pronouns. Where a character has no entry here, avoid the marking in the same way rather than guessing.`,
    )
  }

  return lines
}

/**
 * The beats of a framed story, written out as the panels of a colouring book.
 *
 * WHAT THIS IS FOR. A colouring book made this way has no words in it at all
 * — not a caption, not a page number in prose. So everything the reader is
 * going to understand has to survive being looked at, in order, by somebody
 * who cannot read. Two drawings a beat is what makes that possible: the first
 * is somebody doing something, the second is what came of it, and the child
 * turning the page feels time pass without being told.
 *
 * THE FAILURE IT IS WRITTEN AGAINST. The obvious way to draw a pair is to
 * draw the scene once and then draw it again with one thing moved. That
 * produces a book a child fills in half of. Each panel here is sold
 * separately, in effect — it is an afternoon of somebody's attention — so the
 * second has to be a picture worth sitting down to on its own: another
 * distance, another height, another set of faces. The story's own frames
 * below already say how; this block is what stops the writer smoothing them
 * back into two takes of one drawing.
 */
function framedBeatRules(story: StoryDef, panels: number): string[] {
  const lines: string[] = [
    `THIS IS A COLOURING BOOK OF ${panels} DRAWINGS AND NO WORDS. Every page is line art to be filled in, and there is no narration anywhere in it. Leave "narration" and "narrationSecondary" EMPTY on every single page — an empty string, not a sentence, not a caption, not a title. The only writing in this object is on the cover.`,
    '',
    `THE ${story.beats.length} BEATS, EACH ONE TWO DRAWINGS. Page ${1} and page ${2} are beat 1, pages 3 and 4 are beat 2, and so on to page ${panels}. Write one entry per page, in this order, and put the drawing described below into "sceneDescription" — expanded with this family's real names, their real places and what these people actually look like, but never reordered, merged or replaced.`,
    '',
    'A IS THE GESTURE, B IS THE CONSEQUENCE. The pair is how the reader knows time moved: the hand closed becomes the hand open, the full packet becomes the empty one. Something visible must be different in B, and it must be different because of what happened in A.',
    '',
    'B IS A DIFFERENT DRAWING, NOT THE SAME DRAWING AGAIN. This is the rule that decides whether the book is worth owning. B changes the camera — a wide shot becomes a close one, a back becomes a face, a standing figure is seen from above, the reader crosses to the other side — and the faces in B are doing something they were not doing in A. If B could be produced by taking A and moving one arm, it is wrong and you must write the harder version. A child who turns the page and finds the picture they have just coloured will not colour it twice.',
    '',
    'WHAT MAY NOT CHANGE INSIDE A PAIR: where they are, and who is there. The story moves somewhere else BETWEEN beats, never inside one. With no words on the page, a change of place mid-pair is a jump the reader has nothing to catch them with.',
    '',
    'DRAW IT FOR SOMEBODY WHO IS GOING TO FILL IT IN. Every panel needs enclosed areas big enough to put colour inside and a clear subject that is not lost in texture. Crowds, foliage and rubble are background, held to the edges, and never the thing the page is about.',
    '',
    'THE PANELS:',
  ]

  story.beats.forEach((beat, i) => {
    const frames = beatFrames(beat)
    if (!frames) return
    lines.push(
      `BEAT ${i + 1} — ${beatText(beat)}`,
      `  PAGE ${i * 2 + 1} (A): ${frames[0]}`,
      `  PAGE ${i * 2 + 2} (B): ${frames[1]}`,
    )
  })

  return lines
}

/**
 * The whole mould, ready to be pasted under the brief.
 */
export function storyPrompt(
  story: StoryDef,
  brief: BookBrief,
): string {
  // Two different books come out of the same beats. A reading book is one
  // page a beat with words under it; a framed story ordered as a colouring
  // book is two wordless drawings a beat. The beats are identical — what
  // changes is how many pages they become and what is printed on them.
  const panels = panelCount(story, brief)

  return [
    'THIS BOOK IS A STORY THAT ALREADY EXISTS. You are not inventing it. It has been written, read back and approved, and your job is to cast it with these people and fill its slots with their real details — not to improve its shape, reorder its beats, or add one of your own.',
    '',
    `TITLE OF THE SHAPE: ${story.title.en}`,
    `WHAT SOMEBODY WANTS: ${story.want}`,
    `THE TURN: ${story.turn}`,
    '',
    ...castingFor(story, brief),
    '',
    // Before the beats, never after: a beat that reads from an empty slot has
    // to already know what is in it by the time it is read.
    ...(() => {
      const assumptions = assumptionsFor(story, brief)
      return assumptions.length > 0 ? [...assumptions, ''] : []
    })(),
    // The second person is the standing temptation of a book written for a
    // baby, and of no other book on the shelf — so the warning is addressed
    // to the shelf that needs it rather than pasted into every prompt, where
    // it would read as an instruction about a baby who is not in the story.
    ...(story.occasionId === 'new-baby'
      ? [
          'THE NARRATOR NEVER SPEAKS TO THE BABY. Not once, on any page, including the last. No "e você chega", no "quando você nascer", no page that turns and addresses the cot. The narrator is telling somebody about this family from outside it, in the third person, and a single page that breaks into the second person breaks the voice of the whole book — it is the commonest way this kind of story goes wrong, because the last page invites it. Where a beat below is written in the second person, that is shorthand for what happens, not for how to say it: put it in the third person. If something needs saying TO the baby, a character says it out loud, by name, as a line of speech: — Essa luz é tua, disse a Aurora. That is a person talking to their brother or sister, which is the whole point of the book, and it is not the narrator addressing the reader.',
          '',
        ]
      : [
          'THE NARRATOR NEVER ADDRESSES THE CHILD THIS BOOK WAS MADE FOR. Third person throughout, including the last page, which is where the temptation lives. A book that turns and says "e você achou" has changed narrator on its final page. Anything that needs saying to somebody is said out loud by a character, by name, as a line of speech.',
          '',
        ]),
    'THE PRONOUNS IN THE BEATS BELOW MEAN NOTHING. They are written with whichever pronoun the story was first drafted in, and the beats are the same beats whoever is playing the parts. The CASTING block above is the only authority on who these people are and how to speak about them: where a beat says "she" and the casting says otherwise, the casting wins, every time. Where nothing above says which, write around the marking rather than picking one.',
    '',
    ...(panels
      ? framedBeatRules(story, panels)
      : [
          `THE BEATS. One page each, in this order, all ${story.beats.length}:`,
          ...story.beats.map(beatText),
        ]),
    '',
    // A rule about the words, which a wordless book does not have. The
    // colouring book solves the same problem with the picture instead: the
    // journey gets its own panel rather than half a line of narration.
    ...(panels
      ? [
          'SHOW THE JOURNEY, BECAUSE YOU CANNOT SAY IT. When the story moves from one place to another between beats, the A frame of the arriving beat has to establish the new place plainly before anything happens in it — the reader has no sentence telling them they are somewhere else, so the drawing is the only notice they get.',
        ]
      : [
          'SAY WHEN THEY LEFT AND WHEN THEY CAME BACK. Every time the book moves from the house to the city or back, one plain clause in the words says so — "Saíram depois do almoço", "Pegaram o ônibus", "Voltaram quando o sol já estava baixo". The picture cannot say it and the reader should never have to work out that a page happened somewhere else, or later. It costs half a line and it is the single commonest fault in books built from beats, because a beat list reads as continuous to whoever is writing it and as a jump cut to whoever is reading it.',
        ]),
    '',
    'FILLING THE MOULD:',
    ...story.filling.map((f) => `- ${f}`),
    '',
    panels
      ? 'Every drawing is still yours to compose, and every rule about how a page is staged still applies. What is fixed is what happens, in what order, and which two pictures each beat becomes.'
      : 'The words on every page are still yours to write, and every rule about how the prose works still applies. What is fixed is what happens, and in what order.',
  ].join('\n')
}

/**
 * The chosen story dressed as a StoryIdea, so the rest of the pipeline —
 * titles, storyboard, review, rendering — carries on without knowing that
 * this one was not invented five minutes ago.
 */
export function storyIdea(
  story: StoryDef,
  brief: BookBrief,
): StoryIdea {
  return {
    id: `story-${story.id}`,
    title: say(story.title, brief),
    logline: say(story.logline, brief),
    summary: say(story.summary, brief),
    highlights: story.highlights.map((h) => say(h, brief)),
    want: story.want,
    turn: story.turn,
  }
}
