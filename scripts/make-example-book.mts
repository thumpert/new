/**
 * Gera um livro completo (roteiro + fichas + capas + páginas + PDF) para usar
 * como exemplo público no site — a prateleira do dinossauro, livro para ler
 * (colorido), num estilo de desenho escolhido na linha de comando.
 *
 *   npx tsx scripts/make-example-book.mts retro-storybook
 *   npx tsx scripts/make-example-book.mts fine-line
 *
 * Mesma família e mesmas respostas de entrevista das duas chamadas, para que
 * a única coisa que muda entre os dois exemplos seja o traço. Gasta dinheiro
 * de verdade — por volta de US$1,70 de imagens por chamada.
 *
 * Mantido como .mts pelo mesmo motivo de scripts/draw-book.mts: o projeto não
 * é "type": "module", e um .ts comum aqui vira CommonJS, onde um top-level
 * await é erro de build.
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
const { renderCoverStage, chooseCover, renderPageStage } = await import('../src/lib/render')
const { buildAndStorePdf } = await import('../src/lib/pdf/build')
import type { ArtStyleId, BookBrief, InterviewAnswer, Order } from '../src/lib/types'

const styleId = process.argv[2] as ArtStyleId | undefined
if (!styleId || !['retro-storybook', 'fine-line', 'chibi', 'coloring-book', 'superhero-comic', 'cartoon'].includes(styleId)) {
  console.error('Uso: npx tsx scripts/make-example-book.mts <retro-storybook|fine-line|...>')
  process.exit(1)
}

const q = (questionId: string, question: string, answer: string): InterviewAnswer => ({ questionId, question, answer })

const STORY_ID = 'the-thing-under-the-house'
const story = getStory(STORY_ID)!

const brief: BookBrief = {
  locale: 'pt',
  bookLanguage: 'pt',
  finish: 'reading',
  occasionId: story.occasionId,
  chosenStoryId: STORY_ID,
  storyTypeId: 'adventure',
  toneId: 'warm',
  artStyleId: styleId,
  title: '',
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

console.log(`[${m()}m] escrevendo o roteiro (${styleId})...`)
const storyboard = await generateStoryboard(brief, storyIdea(story, brief))
console.log(`[${m()}m] roteiro ok — "${storyboard.title}", ${storyboard.pages.length} páginas`)

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
console.log(`[${m()}m] pedido ${orderId} salvo`)

console.log(`[${m()}m] fichas de personagem + capas...`)
await renderCoverStage(orderId)
const withCovers = await getOrder(orderId)
const usable = (withCovers?.covers ?? []).filter((c) => c.status === 'done')
console.log(`[${m()}m] capas prontas: ${usable.length}/4  ${(withCovers?.covers ?? []).map((c) => `${c.kind}${c.variant ?? ''}=${c.status}`).join(' ')}`)
for (const c of withCovers?.brief.characters ?? []) {
  console.log(`   ficha ${c.name}: ${c.referenceSheetUrl ? 'ok' : 'FALTOU'}`)
}
if (usable.length === 0) throw new Error('nenhuma capa saiu')

const chosen = usable.find((c) => c.kind === 'scene') ?? usable[0]
await chooseCover(orderId, chosen.kind as 'portrait' | 'scene', (chosen.variant ?? 1) as 1 | 2)
console.log(`[${m()}m] capa escolhida: ${chosen.kind} take ${chosen.variant ?? 1}. desenhando as páginas...`)

await renderPageStage(orderId)
const done = await getOrder(orderId)
const ok = (done?.renders ?? []).filter((r) => r.status === 'done').length
const bad = (done?.renders ?? []).filter((r) => r.status === 'failed')
console.log(`[${m()}m] páginas: ${ok} prontas, ${bad.length} falharam`)
for (const b of bad) console.log(`   página ${b.index}: ${b.error}`)

const pdf = await buildAndStorePdf(done!)

console.log(`\n=== PRONTO em ${m()} min ===`)
console.log(`estilo: ${styleId}`)
console.log(`order id: ${orderId}`)
console.log(`pdf: ${pdf}`)
console.log(`leitor: /pt/livro/${orderId}/ler`)
