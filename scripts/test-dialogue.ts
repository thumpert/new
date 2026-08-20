/**
 * Checks that a spoken line survives the trip to the page.
 *
 *   npx tsx scripts/test-dialogue.ts
 *
 * A travessão opening a line of its own is how dialogue is set in Portuguese,
 * and two separate things in the typography used to destroy it: the em dash
 * was translated into two hyphens, and newlines were flowed away as if they
 * were spaces. Neither is visible from the layout code, so both live here.
 */
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { fit, sanitize, wrap } from '../src/lib/pdf/text'

let failures = 0

function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(
    `${ok ? 'ok  ' : 'FAIL'}  ${name}` +
      (ok ? '' : `\n        esperado ${JSON.stringify(expected)}\n        veio     ${JSON.stringify(actual)}`),
  )
}

async function main() {
  const pdf = await PDFDocument.create()
  const body = await pdf.embedFont(StandardFonts.Helvetica)
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic)
  const wide = 400

  // 1. The travessão is a travessão, not two hyphens.
  check('o travessão sobrevive', sanitize('— Você vem?'), '— Você vem?')
  check('o travessão não vira --', sanitize('— Vamos').includes('--'), false)
  check('reticências sobrevivem', sanitize('Esperou…'), 'Esperou…')
  check('acentos sobrevivem', sanitize('Não é você, avó'), 'Não é você, avó')
  // Anything the font genuinely cannot set still goes.
  check('emoji sai', sanitize('oi 🙂'), 'oi ')

  // 2. A spoken line keeps its own line.
  check(
    'a fala fica sozinha na linha',
    wrap('— Você vem?\nZeca não respondeu.', body, 12, wide),
    ['— Você vem?', 'Zeca não respondeu.'],
  )
  check(
    'a atribuição fica junto da fala',
    wrap('— Já estou indo, disse a Lila.\nE não estava.', body, 12, wide),
    ['— Já estou indo, disse a Lila.', 'E não estava.'],
  )
  check(
    'linha em branco vira ar, não some',
    wrap('Ela parou.\n\n— Espera.', body, 12, wide),
    ['Ela parou.', '', '— Espera.'],
  )
  check(
    'quebra no começo não abre buraco',
    wrap('\n— Espera.', body, 12, wide),
    ['— Espera.'],
  )

  // 3. Uma linha longa ainda quebra na medida, sem juntar com a de baixo.
  const long = wrap(
    '— Você vem comigo ou vai ficar aí parada olhando o portão a manhã inteira, perguntou ela.\nZeca latiu.',
    body,
    12,
    160,
  )
  check('linha longa quebra e não invade a seguinte', long[long.length - 1], 'Zeca latiu.')
  check('a fala longa começa com travessão', long[0].startsWith('— Você'), true)

  // 4. Uma página que não cabe encolhe em vez de perder a última linha.
  const short = fit('— Você vem?\nZeca não respondeu.', italic, 321)
  check('página curta fica em 13pt', short[1], 13)

  const heavy = fit(
    [
      'A lata nunca tinha tido um biscoito sequer dentro dela.',
      '— E se tiver alguém lá dentro?',
      'Naquela manhã faltava um botão, e ela levantou a tampa mesmo assim, devagar, do jeito que a avó abria as coisas que ainda não sabia o que eram.',
    ].join('\n'),
    italic,
    321,
  )
  const [heavyLines, heavySize] = heavy
  check('página cheia encolhe o tipo', heavySize < 13, true)
  check(
    'e não perde a última frase',
    heavyLines[heavyLines.length - 1].endsWith('eram.'),
    true,
  )

  console.log(failures === 0 ? '\ntudo certo' : `\n${failures} falha(s)`)
  process.exit(failures === 0 ? 0 : 1)
}

void main()
