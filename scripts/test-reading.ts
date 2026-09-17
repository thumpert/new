import { promises as fs } from 'node:fs'
import { spent, resetSpend } from '../src/lib/ai/usage'
import { getAgeBand } from '../src/lib/catalog'
import { getStory, storyIdea } from '../src/lib/stories'
import type { AgeBandId, BookBrief } from '../src/lib/types'

/**
 * Generates a real reading book off the shelf and checks it against the age
 * it was ordered for. Run with an age band as the argument: little | middle |
 * big.
 *
 * Used to invent its own story with generateIdeas before every occasion had
 * a shelf. There is no invented flow left to call, and there does not need
 * to be one for what this script is actually checking: whether a chosen
 * story's page count and word band come out right for reading, and every
 * shelf story answers that the same way regardless of which one is picked.
 */
async function env() {
  const raw = await fs.readFile('.env.local', 'utf8')
  for (const l of raw.split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && m[2]) process.env[m[1]] ??= m[2]
  }
}

async function main() {
  await env()
  const bandId = (process.argv[2] as AgeBandId) || 'little'
  const { generateStoryboard } = await import('../src/lib/ai/claude')

  const story = getStory('the-case-of-the-shut-door')!

  const brief: BookBrief = {
    locale: 'pt', bookLanguage: 'pt', finish: 'reading', ageBandId: bandId,
    occasionId: story.occasionId, chosenStoryId: story.id,
    storyTypeId: 'adventure', toneId: 'warm',
    artStyleId: 'chibi', title: '', place: 'a casa da avó em Petrópolis, com o quintal de mangueiras',
    characters: [
      { id: 'c1', name: 'Lila', kind: 'person', age: '5 anos',
        appearance: 'cabelo cacheado castanho, óculos redondos, jardineira e tênis vermelho',
        personality: 'para no meio da rua para olhar formiga; tem medo de secador',
        storyNotes: 'chama toda comida nova de "experimento". No Natal escondeu o presente e esqueceu onde.' },
      { id: 'c2', name: 'Vovó Zeza', kind: 'person', age: '71 anos',
        appearance: 'cabelo branco preso, avental de flores',
        personality: 'responde tudo com outra pergunta',
        storyNotes: 'guarda botões numa lata de biscoito.' },
    ],
    interview: [
      { questionId: 'detective-method', question: 'Qual é o jeito dela de descobrir as coisas?', answer: 'Ela revira gaveta e pergunta sem parar até alguém falhar.' },
      { questionId: 'wished-guest', question: 'Quem ela queria muito que aparecesse na festa?', answer: 'O tio que mora longe e ela não vê há um ano.' },
    ],
  }

  resetSpend()
  const board = await generateStoryboard(brief, storyIdea(story, brief))
  const band = getAgeBand(bandId)

  console.log(`\nTÍTULO: ${board.title}`)
  console.log(`FAIXA: ${band.years} → ${band.words.min}–${band.words.max} palavras por página\n`)

  let fora = 0
  for (const p of board.pages) {
    const n = p.narration.trim().split(/\s+/).filter(Boolean).length
    const ok = n >= band.words.min && n <= band.words.max
    if (!ok) fora++
    console.log(`${String(p.index).padStart(2)}. [${String(n).padStart(3)}p]${ok ? '  ' : ' !'} ${p.narration}`)
  }
  console.log(`\npáginas: ${board.pages.length} (esperado ${story.beats.length})`)
  console.log(`fora da faixa: ${fora}`)
  console.log(`custo do texto: US$ ${spent().usd.toFixed(4)}`)
}
main()
