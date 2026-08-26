import { promises as fs } from 'node:fs'
import { spent, resetSpend } from '../src/lib/ai/usage'
import { getAgeBand } from '../src/lib/catalog'
import type { AgeBandId, BookBrief } from '../src/lib/types'

/**
 * Generates a real reading book and checks it against the age it was ordered
 * for. Run with an age band as the argument: little | middle | big.
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
  const { generateIdeas, generateStoryboard } = await import('../src/lib/ai/claude')

  const brief: BookBrief = {
    locale: 'pt', bookLanguage: 'pt', finish: 'reading', ageBandId: bandId,
    occasionId: 'child', storyTypeId: 'adventure', toneId: 'playful',
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
      { questionId: 'q1', question: 'O que a Lila faz ao chegar na casa da avó?', answer: 'Tira um tênis só e sai andando assim até alguém reclamar.' },
      { questionId: 'q2', question: 'O que tem no quintal?', answer: 'Um formigueiro que ela visita todo dia e um pé de manga alto demais.' },
    ],
  }

  resetSpend()
  const ideas = await generateIdeas(brief)
  const board = await generateStoryboard(brief, ideas[0])
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
  console.log(`\npáginas: ${board.pages.length} (esperado 16)`)
  console.log(`fora da faixa: ${fora}`)
  console.log(`custo do texto: US$ ${spent().usd.toFixed(4)}`)
}
main()
