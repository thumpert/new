/**
 * Draws just the character sheets and covers of the example book in the
 * black-and-white (coloring) finish — not the whole 24-panel book, which this
 * framed story would be in that finish. The landing page only needs one
 * black-line image to sit next to the two colored examples, and the covers
 * stage is the cheap, fast half of the pipeline (see render.ts).
 *
 *   npx tsx scripts/make-example-bw-cover.mts
 */
import fs from 'node:fs'
import path from 'node:path'
for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { newOrderId, saveOrder, getOrder } = await import('../src/lib/store')
const { generateStoryboard } = await import('../src/lib/ai/claude')
const { getStory, storyIdea } = await import('../src/lib/stories')
const { renderCoverStage } = await import('../src/lib/render')
import type { BookBrief, InterviewAnswer, Order } from '../src/lib/types'

const q = (questionId: string, question: string, answer: string): InterviewAnswer => ({ questionId, question, answer })

const STORY_ID = 'the-thing-under-the-house'
const story = getStory(STORY_ID)!

// Same family, same answers as the two reading examples — only the finish
// changes — so the cover reads as the black-line edition of the same book.
const brief: BookBrief = {
  locale: 'pt',
  bookLanguage: 'pt',
  finish: 'coloring',
  occasionId: story.occasionId,
  chosenStoryId: STORY_ID,
  storyTypeId: 'adventure',
  toneId: 'warm',
  artStyleId: 'retro-storybook',
  title: 'O Dinossauro Particular da Manu',
  place: 'Uma rua de casas coloridas no alto de um morro, numa cidade pequena do interior',
  characters: [
    { id: 'c1', name: 'Manu', kind: 'person', role: 'filha', age: '7 anos', gender: 'female', appearance: 'cabelo curto na altura da orelha, macacão jeans, tênis vermelho' },
    { id: 'c2', name: 'Téo', kind: 'person', role: 'irmão mais velho', age: '11 anos', gender: 'male', appearance: 'magro, camiseta de time, boné para trás' },
    { id: 'c3', name: 'Frida', kind: 'pet', role: 'cachorra vira-lata', appearance: 'caramelo, orelha caída de um lado' },
  ],
  interview: [
    q('digging-spot', 'Onde ela cava, mexe na terra ou brinca no chão?',
      'No canteiro atrás do tanque, que a mãe desistiu de plantar. Ela cava ali com uma colher de pedreiro'),
    q('neighbourhood', 'Que lugares do bairro dá para desenhar de olhos fechados?',
      'A praça do coreto, a passarela que atravessa a avenida, a padaria da esquina e a escadaria que sobe pro morro'),
    q('favourite-dinosaur', 'Qual é o dinossauro dela?',
      'Tricerátops. Ela corrige todo mundo que fala errado'),
    q('doubter', 'Quem duvida das histórias dela?',
      'O Téo, que ri de tudo que ela acha e diz que é osso de boi'),
  ],
}

const t0 = Date.now()
const m = () => ((Date.now() - t0) / 60000).toFixed(1)

console.log(`[${m()}m] escrevendo o roteiro (coloring, preto e branco)...`)
const storyboard = await generateStoryboard(brief, storyIdea(story, brief))
console.log(`[${m()}m] roteiro ok`)

const orderId = newOrderId()
const now = new Date().toISOString()
const order: Order = {
  id: orderId,
  createdAt: now,
  updatedAt: now,
  status: 'storyboard-review',
  brief,
  storyboard,
}
await saveOrder(order)

console.log(`[${m()}m] fichas + capas (preto e branco)...`)
await renderCoverStage(orderId)
const done = await getOrder(orderId)
const usable = (done?.covers ?? []).filter((c) => c.status === 'done')
console.log(`[${m()}m] capas prontas: ${usable.length}/4`)

const chosen = usable.find((c) => c.kind === 'scene') ?? usable[0]
if (!chosen) throw new Error('nenhuma capa saiu')

console.log(`\n=== PRONTO em ${m()} min ===`)
console.log(`order id: ${orderId}`)
console.log(`capa escolhida: ${chosen.kind} take ${chosen.variant ?? 1}`)
console.log(`imagem: ${chosen.imageUrl}`)
