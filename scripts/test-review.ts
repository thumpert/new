/**
 * Points the page reviewer at images already on disk and prints what it finds.
 *
 *   npx tsx scripts/test-review.ts .data/pagina.png "what the page should show"
 *
 * Run with no arguments it checks the pages from the first real order — the
 * one that shipped with a third arm, a hallucinated map and a pair of floating
 * trainers. Those are the defects this reviewer exists to catch, so they are
 * the right thing to measure it against: a checker that misses the failures it
 * was written for is worse than none, because it is reassuring.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { reviewImageBytes } from '../src/lib/ai/review'
import type { BookFinish } from '../src/lib/types'

async function loadEnvLocal() {
  const raw = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && m[2]) process.env[m[1]] ??= m[2]
  }
}

interface Case {
  file: string
  scene: string
  finish: BookFinish
  device?: string
  /** What a working reviewer has to notice here. Empty means a clean page. */
  expect: string
}

const CASES: Case[] = [
  {
    file: '.data/crua-mem-10.png',
    scene:
      'Two men on a hiking trail, arms around each other, mountains behind them.',
    finish: 'coloured',
    expect: 'BRACO A MAIS (o principal), mapa inventado, tenis flutuando',
  },
  {
    file: '.data/crua-mem-11.png',
    scene: 'Two men smiling side by side in front of a yellow doorway.',
    finish: 'coloured',
    expect: 'mapa inventado, tênis flutuando',
  },
  {
    file: '.data/files/bc1eb0d8-1a97-4229-996a-0ab232ca3e2c.jpg',
    scene:
      'A red woollen thread loops around a frog on a lily pad while a girl kneels at a pond with her dog.',
    finish: 'coloring',
    device: 'a red woollen thread',
    expect: 'moldura desenhada (a cor vermelha do fio NAO e defeito)',
  },
]

async function main() {
  await loadEnvLocal()

  // npx tsx scripts/test-review.ts <arquivo> "<cena>" [coloring|coloured] "<objeto-guia>"
  const [fileArg, sceneArg, finishArg, deviceArg] = process.argv.slice(2)
  const cases: Case[] = fileArg
    ? [
        {
          file: fileArg,
          scene: sceneArg ?? 'a page of a children’s book',
          finish: finishArg === 'coloring' ? 'coloring' : 'coloured',
          device: deviceArg,
          expect: '(informado na linha de comando)',
        },
      ]
    : CASES

  for (const c of cases) {
    const bytes = await fs.readFile(path.join(process.cwd(), c.file))
    const { problems } = await reviewImageBytes(bytes, {
      sceneDescription: c.scene,
      finish: c.finish,
      device: c.device,
    })

    console.log(`\n${c.file}`)
    console.log(`  esperado: ${c.expect}`)
    if (problems.length === 0) {
      console.log('  encontrou: nada')
    } else {
      for (const p of problems) console.log(`  · ${p}`)
    }
  }
}

main().catch((err) => {
  console.error('\n❌ falhou:', err?.message ?? err)
  process.exit(1)
})
