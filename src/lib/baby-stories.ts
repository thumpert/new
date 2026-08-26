import type { BookBrief, Character, InterviewQuestion, StoryIdea } from './types'

/**
 * The five stories a new-baby book can be.
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
 * WHY THE TEXT LIVES HERE AND NOT IN src/lib/i18n. The convention in this
 * codebase is that the catalog holds the machine-facing half and the locale
 * dictionaries hold what the customer reads. These stories break it, on
 * purpose: a question, its hint, its placeholder, its three suggestions and
 * the condition that decides whether it is asked at all are one thought, and
 * splitting that thought across two files by language is how a question ends
 * up asked in Portuguese about a role the English version no longer has. They
 * are kept whole and localised in place.
 */

export type BabyStoryId =
  | 'sunbeam'
  | 'best-things'
  | 'on-the-way'
  | 'training'
  | 'waiting'

export interface Localized {
  pt: string
  en: string
}

const t = (pt: string, en: string): Localized => ({ pt, en })

export function say(text: Localized, brief: BookBrief): string {
  return brief.locale === 'en' ? text.en : text.pt
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
export type BabyRoleId = 'older-child' | 'companion' | 'grown-up'

export interface BabyRole {
  id: BabyRoleId
  /** Named in the prompt, in caps, exactly as the beats refer to it. */
  slot: string
  /** What kind of character can be cast. */
  cast: 'person-not-baby' | 'pet' | 'adult'
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
   * The book cannot be written without this one. The wizard will not move on
   * until it is answered, which is a thing the old free interview never did —
   * every question there was optional, so the answer that the whole story
   * hangs on was as skippable as the one about a funny habit.
   */
  required?: boolean
  showIf?: QuestionCondition
}

export interface BabyStoryDef {
  id: BabyStoryId
  /** The working title. The customer can still rename the book afterwards. */
  title: Localized
  /** One line on the chooser card. */
  logline: Localized
  /** Two or three sentences on the chooser card. */
  summary: Localized
  /** Three concrete scenes, shown on the card so the shape is visible. */
  highlights: Localized[]
  roles: BabyRole[]
  questions: StoryQuestionDef[]
  /** English, machine-facing. What somebody wants and does not have. */
  want: string
  /** English, machine-facing. What changes half way. */
  turn: string
  /** English, machine-facing. The thirteen beats, in order. */
  beats: string[]
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
  required: true,
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
  required: true,
  showIf: 'no-pet',
}

export const BABY_STORIES: BabyStoryDef[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'sunbeam',
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
        cast: 'person-not-baby',
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
        required: true,
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
      { id: 'older-child', slot: 'THE LISTER', cast: 'person-not-baby', required: true },
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
        required: true,
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
        required: true,
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
      { id: 'older-child', slot: 'THE SEEKER', cast: 'person-not-baby', required: true },
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
        required: true,
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
        required: true,
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
        required: true,
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
        required: true,
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
        required: true,
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
]

/* ------------------------------------------------------------------ *
 * Casting the real family into the mould
 * ------------------------------------------------------------------ */

export function getBabyStory(id: string): BabyStoryDef | undefined {
  return BABY_STORIES.find((s) => s.id === id)
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
 * Whether this story can be told about this family at all.
 *
 * The check that stops the one failure that matters: a book handed to a
 * family that gives them a child they do not have. A story whose required
 * role cannot be cast is not offered, and the two stories with no child in
 * them are why there is always something left on the menu.
 */
export function canTell(story: BabyStoryDef, brief: BookBrief): boolean {
  return story.roles.every((role) => {
    if (!role.required) return true
    if (role.cast === 'person-not-baby') return Boolean(child(brief))
    if (role.cast === 'adult') return adults(brief).length > 0
    if (role.cast === 'pet') return pets(brief).length > 0
    return true
  })
}

export function storiesFor(brief: BookBrief): BabyStoryDef[] {
  return BABY_STORIES.filter((story) => canTell(story, brief))
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
  story: BabyStoryDef,
  brief: BookBrief,
): InterviewQuestion[] {
  const hasPet = pets(brief).length > 0
  return story.questions
    .filter((q) => {
      if (q.showIf === 'has-pet') return hasPet
      if (q.showIf === 'no-pet') return !hasPet
      return true
    })
    .map((q) => ({
      id: q.id,
      group: say(q.group, brief),
      question: say(q.question, brief),
      hint: q.hint ? say(q.hint, brief) : undefined,
      placeholder: q.placeholder ? say(q.placeholder, brief) : undefined,
      suggestions: q.suggestions.map((sug) => say(sug, brief)),
      required: q.required,
    }))
}

/** Questions the wizard will not let the customer walk past. */
export function requiredQuestionIds(
  story: BabyStoryDef,
  brief: BookBrief,
): string[] {
  const shown = new Set(questionsFor(story, brief).map((q) => q.id))
  return story.questions
    .filter((q) => q.required && shown.has(q.id))
    .map((q) => q.id)
}

/**
 * The cast list handed to the writer, by name, before it sees the beats.
 *
 * Written as instructions rather than as data because the failure it guards
 * against is a writer improvising: told "THE FINDER = Aurora", a model will
 * happily also invent Aurora's little brother when a beat feels like it wants
 * one. Told "these are the only people in this book", it does not.
 */
export function castingFor(story: BabyStoryDef, brief: BookBrief): string[] {
  const lines: string[] = [
    'CASTING. The people and animals listed below are the only ones in this book. This is the hardest rule here and it is not a preference.',
    '',
    'NOBODY WHO MATTERS MAY BE INVENTED. Do not add a grandmother, a grandfather, an aunt, a neighbour, a second parent, an older sibling, a friend or an animal, however naturally a beat seems to ask for one. If a beat needs a pair of hands and there is only one person, that person does it alone and the house is quieter. The beats bend; the cast does not.',
    '',
    'The line between a character and a passer-by: a character is anybody named, anybody who speaks, or anybody who comes back on a second page. The baker who lifts a cloth, a stranger in a queue, people waiting on a platform — those are scenery, they stay unnamed, they never speak and they never return. The moment one of them acquires a name, a line of dialogue or a second appearance, an invented relative has entered the book.',
    '',
    'This matters more here than in any other kind of book. A family who is given a grandmother they do not have, or an older sister for a first child, is not reading a book with a small error in it — they are reading a book about somebody else.',
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
    if (role.cast === 'person-not-baby') {
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
 * The whole mould, ready to be pasted under the brief.
 */
export function babyStoryPrompt(
  story: BabyStoryDef,
  brief: BookBrief,
): string {
  return [
    'THIS BOOK IS A STORY THAT ALREADY EXISTS. You are not inventing it. It has been written, read back and approved, and your job is to cast it with these people and fill its slots with their real details — not to improve its shape, reorder its beats, or add one of your own.',
    '',
    `TITLE OF THE SHAPE: ${story.title.en}`,
    `WHAT SOMEBODY WANTS: ${story.want}`,
    `THE TURN: ${story.turn}`,
    '',
    ...castingFor(story, brief),
    '',
    'THE NARRATOR NEVER SPEAKS TO THE BABY. Not once, on any page, including the last. No "e você chega", no "quando você nascer", no page that turns and addresses the cot. The narrator is telling somebody about this family from outside it, in the third person, and a single page that breaks into the second person breaks the voice of the whole book — it is the commonest way this kind of story goes wrong, because the last page invites it. Where a beat below is written in the second person, that is shorthand for what happens, not for how to say it: put it in the third person. If something needs saying TO the baby, a character says it out loud, by name, as a line of speech: — Essa luz é tua, disse a Aurora. That is a person talking to their brother or sister, which is the whole point of the book, and it is not the narrator addressing the reader.',
    '',
    'THE PRONOUNS IN THE BEATS BELOW MEAN NOTHING. They are written with whichever pronoun the story was first drafted in, and the beats are the same beats whoever is playing the parts. The CASTING block above is the only authority on who these people are and how to speak about them: where a beat says "she" and the casting says otherwise, the casting wins, every time. The baby is very often not known to be a boy or a girl at all, and where nothing above says which, write around it rather than picking one.',
    '',
    'THE BEATS. One page each, in this order, all thirteen:',
    ...story.beats,
    '',
    'SAY WHEN THEY LEFT AND WHEN THEY CAME BACK. Every time the book moves from the house to the city or back, one plain clause in the words says so — "Saíram depois do almoço", "Pegaram o ônibus", "Voltaram quando o sol já estava baixo". The picture cannot say it and the reader should never have to work out that a page happened somewhere else, or later. It costs half a line and it is the single commonest fault in books built from beats, because a beat list reads as continuous to whoever is writing it and as a jump cut to whoever is reading it.',
    '',
    'FILLING THE MOULD:',
    ...story.filling.map((f) => `- ${f}`),
    '',
    'The words on every page are still yours to write, and every rule about how the prose works still applies. What is fixed is what happens, and in what order.',
  ].join('\n')
}

/**
 * The chosen story dressed as a StoryIdea, so the rest of the pipeline —
 * titles, storyboard, review, rendering — carries on without knowing that
 * this one was not invented five minutes ago.
 */
export function babyStoryIdea(
  story: BabyStoryDef,
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
    anchored: true,
  }
}
