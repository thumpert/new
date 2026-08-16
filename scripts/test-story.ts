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
import type { BookBrief } from '../src/lib/types'

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
  finish: 'coloring',
  occasionId: 'relationship',
  storyTypeId: 'journey',
  toneId: 'playful',
  artStyleId: 'fine-line',
  title: '',
  place: 'Buenos Aires — Palermo, San Telmo, e a livraria Eterna Cadencia',
  characters: [
    {
      id: 'c1',
      name: 'Torotito',
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
      name: 'Terecoteco',
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
      answer: 'A livraria Eterna Cadencia, em Palermo. Vamos todo sábado.',
    },
    {
      questionId: 'q4',
      question: 'O que vocês fazem toda semana sem falhar?',
      answer: 'Domingo de sushi e violão em casa.',
    },
    {
      questionId: 'q5',
      question: 'Onde foi o pedido de namoro?',
      answer: 'Numa praça em Palermo, num fim de tarde.',
    },
  ],
}

async function main() {
  await loadEnvLocal()

  console.log('escrevendo as 4 ideias…\n')
  const ideas = await generateIdeas(BRIEF)

  for (const idea of ideas) {
    console.log(`— ${idea.title}`)
    console.log(`  ${idea.logline}`)
    console.log(`  objeto-guia: ${idea.device || '(nenhum)'}`)
    console.log(`  virada: ${idea.turn}\n`)
  }

  const chosen = ideas[0]
  console.log(`\nescrevendo e revisando o roteiro de "${chosen.title}"…\n`)
  const storyboard = await generateStoryboard(BRIEF, chosen)

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
