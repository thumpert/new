/**
 * Runs the free half of the page check — the pixel measurement — over images
 * on disk, and prints both the numbers and the verdict.
 *
 *   npx tsx scripts/test-measure.ts
 *
 * Worth having on its own because this half costs nothing to run: it can be
 * pointed at every page of every book ever made without spending anything,
 * which is how the thresholds were set in the first place.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { measurePage, thumbnail } from '../src/lib/images/measure'
import type { BookFinish } from '../src/lib/types'

const CASES: Array<{ file: string; finish: BookFinish; note: string }> = [
  {
    file: '.data/files/c7a51674-e2ae-47a9-9b0e-55ac87080154.jpg',
    finish: 'coloring',
    note: 'pagina limpa, com o fio vermelho permitido',
  },
  {
    file: '.data/crua-mem-10.png',
    finish: 'reading',
    note: 'pagina de foto do livro real (braco extra, mapa)',
  },
  {
    file: 'public/styles/cartoon.png',
    finish: 'coloring',
    note: 'amostra de estilo em traco puro',
  },
  {
    file: 'public/styles/cartoon-colour.png',
    finish: 'reading',
    note: 'amostra de estilo pintada',
  },
]

async function main() {
  for (const c of CASES) {
    const bytes = await fs.readFile(path.join(process.cwd(), c.file))
    const started = Date.now()
    const { problems, stats } = await measurePage(bytes, c.finish)
    const small = await thumbnail(bytes)
    const ms = Date.now() - started

    console.log(`\n${c.file}`)
    console.log(`  ${c.note}`)
    console.log(
      `  cor ${stats.colour}%  cinza ${stats.grey}%  preto ${stats.black}%  branco ${stats.white}%`,
    )
    console.log(
      `  ${(bytes.length / 1024).toFixed(0)} KB -> miniatura ${(small.length / 1024).toFixed(0)} KB  (${ms}ms, custo zero)`,
    )
    console.log(
      problems.length ? `  PROBLEMAS: ${problems.join(' | ')}` : '  sem problemas',
    )
  }
}

main().catch((err) => {
  console.error('falhou:', err?.message ?? err)
  process.exit(1)
})
