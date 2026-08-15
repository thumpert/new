import { getArtStyle } from '../catalog'
import type { ArtStyleId, Character } from '../types'

/**
 * Every prompt ends with the same hard constraints. Coloring pages fail in
 * exactly three ways — grey shading, filled black areas, and stray text — so
 * each is ruled out explicitly rather than left to the model's taste.
 */
const LINE_ART_RULES = [
  'Pure black outlines on a solid pure white background',
  'no shading, no grey tones, no gradients, no hatching, no stippling, no filled black areas',
  'no colour of any kind',
  'no text, no letters, no numbers, no signatures, no borders or frames',
  // Line weight is deliberately not fixed here: each style specifies its own,
  // and some want a thick silhouette against thinner interior detail.
  'clean closed shapes, drawn to be coloured in with crayons',
] as const

const PAGE_FRAMING =
  'Single full-page children’s coloring book illustration, vertical portrait orientation, the whole scene comfortably inside the frame with clear white space at the edges.'

export function characterSheetPrompt(
  character: Character,
  artStyleId: ArtStyleId,
  photoCount: number,
): string {
  const style = getArtStyle(artStyleId)
  const subject = character.kind === 'pet' ? 'animal character' : 'character'

  const source =
    photoCount === 0
      ? `Design a ${subject} from this description alone.`
      : photoCount === 1
        ? `Turn the subject in the reference photo into a ${subject} drawing, keeping their recognisable features: face shape, hairstyle, and anything distinctive.`
        : `The ${photoCount} reference photos are all the same individual from different angles. Read them together to work out the face, hair and build, and draw that ${subject}. Where the photos disagree — different lighting, a different haircut, a different day — follow whatever is consistent across most of them rather than any single photo.`

  return [
    `Character model sheet for a children’s coloring book: three views of the same ${subject} side by side on one white sheet — full body facing forward, full body from the side, and a head-and-shoulders close-up.`,
    source,
    `The character is ${character.name}${character.age ? `, ${character.age}` : ''}. ${terminated(character.traits)}`,
    `Drawing style: ${style.prompt}`,
    'All three views must be unmistakably the same character, with identical clothing and proportions.',
    LINE_ART_RULES.join(', ') + '.',
  ].join(' ')
}

export function pagePrompt(
  sceneDescription: string,
  artStyleId: ArtStyleId,
  characterNames: string[],
  hasReferences: boolean,
): string {
  const style = getArtStyle(artStyleId)

  const consistency =
    hasReferences && characterNames.length > 0
      ? `The reference sheets show exactly how ${formatList(characterNames)} must look. Match their faces, hair, clothing and proportions precisely — they must be the same characters readers saw on every other page.`
      : ''

  return [
    PAGE_FRAMING,
    `Scene: ${terminated(sceneDescription)}`,
    consistency,
    `Drawing style: ${style.prompt}`,
    LINE_ART_RULES.join(', ') + '.',
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * The traits and the scene description are typed by a person (or written by the
 * writing model), so they may or may not end in a full stop. Every other piece
 * of a prompt is a whole sentence; without this, the next instruction runs on
 * from the last word of free text.
 */
function terminated(text: string): string {
  const trimmed = text.trim()
  return /[.!?…]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

function formatList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}
