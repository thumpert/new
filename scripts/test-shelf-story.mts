/**
 * Writes one of the pre-written baby stories end to end, and prints it.
 *
 *   npx tsx scripts/test-baby-story.mts sunbeam
 *   npx tsx scripts/test-baby-story.mts best-things | on-the-way | training | waiting
 *
 * Text only — no images, no PDF — which is what makes it the cheap way to
 * judge a mould after editing it: about US$1 and seven minutes, against three
 * dollars for a whole book.
 *
 * The same family plays every story on purpose. A tic that shows up in one
 * story belongs to that story; the same tic in three belongs to the mould,
 * and that difference is only visible if the cast is held still.
 *
 * Prints the pages, then what the run cost, call by call.
 *
 * Kept as .mts on purpose. The project is not `"type": "module"`, so a plain
 * .ts here compiles as CommonJS and every top-level await below becomes a
 * build error — one that blames the await instead of the extension.
 */
import fs from 'node:fs'
import path from 'node:path'
for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { generateStoryboard } = await import('../src/lib/ai/claude')
const { getBabyStory, babyStoryIdea } = await import('../src/lib/baby-stories')
const { spent } = await import('../src/lib/ai/usage')
import type { BookBrief, InterviewAnswer } from '../src/lib/types'

// A mesma família nas quatro, de propósito: se um tique aparecer em mais de
// uma história, ele é do molde e não daquela história.
const CAST: BookBrief['characters'] = [
  { id: 'c1', name: 'Aurora', kind: 'person', role: 'irmã mais velha do bebê', age: '6 anos', gender: 'female', appearance: 'cabelo cacheado preso, macacão jeans' },
  { id: 'c2', name: 'Marina', kind: 'person', role: 'mãe', age: '34', gender: 'female', appearance: 'grávida, cabelo curto' },
  { id: 'c3', name: 'Téo', kind: 'person', role: 'pai', age: '36', gender: 'male', appearance: 'barba, óculos' },
  { id: 'c4', name: 'Bigode', kind: 'pet', role: 'gato laranja', appearance: 'gato laranja gordo' },
  { id: 'c5', name: 'bebê', kind: 'person', role: 'o bebê que vem aí', age: 'recém-nascido', appearance: 'recém-nascido' },
]

const q = (questionId: string, question: string, answer: string): InterviewAnswer =>
  ({ questionId, question, answer })

const INTERVIEWS: Record<string, InterviewAnswer[]> = {
  sunbeam: [
    q('places', 'Quais lugares desse lugar a família ama de verdade?',
      'O Elevador Lacerda, a Praia do Porto da Barra, o Mercado Modelo e a ladeira do Pelourinho'),
    q('pet-spot', 'Onde o bicho de vocês costuma dormir quando bate sol?',
      'O Bigode dorme no quadrado de sol que bate no chão da sala de manhã'),
    q('room-state', 'Como está o quarto do bebê hoje, de verdade?',
      'Berço montado no meio e caixa de mudança em todo canto, mudamos faz um mês'),
  ],
  'best-things': [
    q('favourites', 'Quais são as coisas favoritas dela no mundo?',
      'Sorvete de chocolate na padaria da esquina, correr no parque até cansar, tomar banho de mangueira no quintal, e o colo do pai quando ele chega do trabalho'),
    q('too-big', 'E uma coisa grande demais, que ela ama e não cabe dentro de casa?',
      'O mar do Porto da Barra. Ela quer que o mar entre em casa, e a gente explica toda vez que não dá'),
    q('unteachable', 'Tem alguma coisa que ela ama e que ninguém ensinou?',
      'Rir. Ela ri de tudo, principalmente quando ninguém mais está achando graça'),
  ],
  'on-the-way': [
    q('places', 'Quais lugares desse lugar a família ama de verdade?',
      'O Elevador Lacerda, a Praia do Porto da Barra, o Mercado Modelo e a ladeira do Pelourinho'),
    q('real-question', 'Que pergunta ela já fez de verdade sobre o bebê?',
      'Ela perguntou: "e se o bebê não gostar da gente?"'),
    q('keepsake', 'Que coisa dela ela daria pro bebê?',
      'A coelha de pano dela, a Nina, que já perdeu uma orelha'),
  ],
  training: [
    q('noticed', 'O que vocês já perceberam que o bebê faz aí dentro?',
      'Ele chuta sempre do lado direito, e sempre depois do jantar. Soluça quase todo dia de manhã'),
    q('room-ready', 'O que já está pronto esperando, e o que ainda falta?',
      'O berço já está montado e as roupinhas lavadas e dobradas. Falta pintar a parede e achar onde põe a cômoda'),
    q('voices', 'Como são as duas vozes que ele já conhece?',
      'A da Marina é mais fina e fala rápido. A do Téo é grave e devagar, ele canta desafinado toda noite'),
  ],
  waiting: [
    q('waiting-places', 'Quais desses lugares existem na cidade de vocês?',
      'O Elevador Lacerda, a Praia do Porto da Barra, o Mercado Modelo e a ladeira do Pelourinho'),
    q('pet-waiting', 'Onde o bicho de vocês se instalou desde que o quarto ficou pronto?',
      'O Bigode dorme dentro do berço. A gente tira, ele volta'),
    q('other-waiting', 'Além do bebê, o que mais essa família está esperando?',
      'O resultado de um concurso que o Téo fez, e a mangueira do quintal que ainda não deu fruta nenhuma'),
  ],
}

// Checked before anything is built, and before anything is spent. Without
// this the script reached the API with an undefined story and died on a
// property of undefined, which reads like a bug in the product rather than a
// missing argument.
const storyId = process.argv[2]
if (!storyId || !INTERVIEWS[storyId] || !getBabyStory(storyId)) {
  console.error(
    `Uso: npx tsx scripts/test-baby-story.mts <historia>\n` +
      `Histórias: ${Object.keys(INTERVIEWS).join(', ')}`,
  )
  process.exit(1)
}

const brief: BookBrief = {
  locale: 'pt', bookLanguage: 'pt', finish: 'coloring', occasionId: 'new-baby',
  chosenStoryId: storyId,
  storyTypeId: 'everyday-magic', toneId: 'warm', artStyleId: 'chibi',
  title: '', place: 'Salvador, Bahia',
  characters: CAST,
  interview: INTERVIEWS[storyId],
}

const story = getBabyStory(storyId)!
const t0 = Date.now()
const sb = await generateStoryboard(brief, babyStoryIdea(story, brief))
console.log(`\n=== ${sb.title} === (${((Date.now()-t0)/1000).toFixed(0)}s, ${sb.pages.length} páginas)\n`)
for (const p of sb.pages) {
  console.log(`--- ${p.index} --- [${p.charactersOnPage.join(',')}]`)
  console.log(p.narration)
}
const s = spent()
console.log('\n=== CUSTO ===')
for (const c of s.charges) console.log(`  ${c.what.padEnd(28)} in ${String(c.input).padStart(7)}  out ${String(c.output).padStart(6)}  US$ ${c.usd.toFixed(4)}`)
console.log(`  TOTAL TEXTO: US$ ${s.usd.toFixed(4)}`)
