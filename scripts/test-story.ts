/**
 * Writes a whole book — ideas, then storyboard, then the editing pass — and
 * prints it. Text only: no images, no PDF.
 *
 *   npx tsx scripts/test-story.ts
 *
 * This is the cheap half of the pipeline and the half that decides whether the
 * book is any good, so it is worth being able to run it on its own. Judging
 * prose changes by generating a whole illustrated book costs about US$0.70 a
 * try and takes minutes; this costs cents and takes seconds.
 *
 * The fixture is the couple from a real order, so output can be read straight
 * against the book they actually received.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { generateIdeas, generateStoryboard } from '../src/lib/ai/claude'
import type { AgeBandId, BookBrief, BookFinish } from '../src/lib/types'

/**
 * npx tsx scripts/test-story.ts [coloring|reading] [little|middle|big]
 *
 * The second argument is the whole point of running this: the three age bands
 * are three different crafts, and the only way to see whether they came out
 * different is to write the same brief three times and read them side by side.
 */
const FINISH: BookFinish = process.argv[2] === 'reading' ? 'reading' : 'coloring'
const BAND = (process.argv[3] ?? 'middle') as AgeBandId

async function loadEnvLocal() {
  const raw = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && m[2]) process.env[m[1]] ??= m[2]
  }
}

const BRIEF: BookBrief = {
  locale: 'pt',
  bookLanguage: 'pt',
  finish: FINISH,
  ageBandId: FINISH === 'reading' ? BAND : undefined,
  occasionId: FINISH === 'reading' ? 'birthday' : 'relationship',
  storyTypeId: 'journey',
  toneId: 'playful',
  artStyleId: 'fine-line',
  title: '',
  place: 'Lisboa — Alfama, Graça, e a livraria da esquina',
  characters: [
    {
      id: 'c1',
      name: 'Nuno',
      kind: 'person',
      role: 'namorado',
      appearance:
        'louro, cabelo curto, camisa listrada azul, calça bege, botas marrons',
      personality:
        'anda rápido, sempre três passos à frente, conta história e vira a esquina antes de terminar, encanta-se fácil',
      storyNotes:
        'toca violão. Domingo de sushi e violão toda semana. Sai com quatro livros da livraria e não lê nenhum.',
    },
    {
      id: 'c2',
      name: 'Rui',
      kind: 'person',
      role: 'namorado',
      appearance:
        'cabelo escuro, óculos redondos, camiseta preta, bermuda bege, bolsa amarela a tiracolo',
      personality:
        'para no meio da rua, ajeita os óculos e pergunta "Que foi?". Sotaque baiano. Arruma a cama todo dia.',
      storyNotes:
        'a pergunta "Que foi?" é dele, pergunta o tempo todo. Se conheceram por mensagem e um café em San Telmo.',
    },
  ],
  interview: [
    {
      questionId: 'q1',
      question: 'Como vocês se conheceram?',
      answer:
        'Uma mensagem e um café em San Telmo. Ficamos até o garçom subir as cadeiras nas mesas.',
    },
    {
      questionId: 'q2',
      question: 'Qual foi o primeiro encontro?',
      answer: 'Choveu o tempo todo, e tinha um bloco de tambores tocando na rua.',
    },
    {
      questionId: 'q3',
      question: 'Que lugar é só de vocês?',
      answer: 'A livraria da esquina, na Graça. Vamos todo sábado.',
    },
    {
      questionId: 'q4',
      question: 'O que vocês fazem toda semana sem falhar?',
      answer: 'Domingo de sushi e violão em casa.',
    },
    {
      questionId: 'q5',
      question: 'Onde foi o pedido de namoro?',
      answer: 'Num miradouro da Graça, num fim de tarde.',
    },
  ],
}

/** A child, for the reading book: the couple fixture has nobody to read it. */
const CHILD_BRIEF: BookBrief = {
  ...BRIEF,
  storyTypeId: 'adventure',
  toneId: 'warm',
  place: 'o quintal da casa da avó, em Sabará, cheio de mangueiras velhas',
  characters: [
    {
      id: 'c1',
      name: 'Cora',
      kind: 'person',
      role: 'a aniversariante',
      appearance: 'cabelo cacheado preso em dois coques, óculos redondos, jardineira azul',
      personality:
        'pergunta "por quê" até o adulto desistir, guarda pedra no bolso, não gosta de ser carregada',
      storyNotes:
        'conta tudo em voz alta antes de fazer. Tem medo do barulho do portão. Chama a avó de Vó Duda.',
    },
    {
      id: 'c2',
      name: 'Vó Duda',
      kind: 'person',
      role: 'avó',
      appearance: 'cabelo branco curto, avental de bolso fundo, chinelo de dedo',
      personality: 'responde pergunta com pergunta, nunca tem pressa, assobia quando mente',
      storyNotes: 'faz doce de mamão todo sábado. Diz "deixa comigo" e some por dez minutos.',
    },
  ],
  interview: [
    {
      questionId: 'q1',
      question: 'O que a Cora faz todo dia sem falhar?',
      answer: 'Junta pedra no quintal e guarda no bolso da jardineira. A máquina de lavar já quebrou uma vez.',
    },
    {
      questionId: 'q2',
      question: 'Do que ela tem medo?',
      answer: 'Do barulho do portão da frente. Ela dá a volta pela cozinha só para não passar por ele.',
    },
    {
      questionId: 'q3',
      question: 'Que lugar é só dela?',
      answer: 'Atrás da mangueira velha, onde a avó não enxerga da janela.',
    },
    {
      questionId: 'q4',
      question: 'O que a avó sempre diz?',
      answer: '"Deixa comigo." E some por dez minutos.',
    },
  ],
}

async function main() {
  await loadEnvLocal()

  console.log('escrevendo as 4 ideias…\n')
  const brief = FINISH === 'reading' ? CHILD_BRIEF : BRIEF
  const ideas = await generateIdeas(brief)

  for (const idea of ideas) {
    console.log(`— ${idea.title}`)
    console.log(`  ${idea.logline}`)
    console.log(`  objeto-guia: ${idea.device || '(nenhum)'}`)
    console.log(`  virada: ${idea.turn}\n`)
  }

  const chosen = ideas[0]
  console.log(`\nescrevendo e revisando o roteiro de "${chosen.title}"…\n`)
  const storyboard = await generateStoryboard(brief, chosen)

  console.log(`TÍTULO: ${storyboard.title}`)
  console.log(`OBJETO-GUIA: ${storyboard.device || '(nenhum)'}\n`)
  for (const page of storyboard.pages) {
    console.log(`${String(page.index).padStart(2)}. ${page.narration}`)
  }
}

main().catch((err) => {
  console.error('\n❌ falhou:', err?.message ?? err)
  process.exit(1)
})
