import { getArtStyle } from '../catalog'
import type { ArtStyleId, BookFinish, Character } from '../types'

/**
 * Coloring pages fail in exactly three ways — grey shading, filled black
 * areas, and stray text — so each is ruled out explicitly rather than left to
 * the model's taste.
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

/**
 * The colour book's own hard constraints. Shorter than the line-art list
 * because the palette does the describing — this only rules out the two things
 * that would spoil a finished page regardless of style.
 */
const COLOURED_RULES = [
  'Fully coloured finished illustration, nothing left blank or white to fill in',
  'no text, no letters, no numbers, no signatures, no borders or frames',
] as const

/**
 * The closing rules for a page or a model sheet, which is the single place the
 * two books diverge. Everything above this line — the style, the cast, the
 * scene — is written once and shared.
 */
function finishRules(finish: BookFinish, artStyleId: ArtStyleId): string {
  const style = getArtStyle(artStyleId)
  if (finish === 'coloring') {
    // The caveat retracts whatever shading this particular style normally
    // carries, and only a coloring page needs that retraction.
    return [style.coloringCaveat, LINE_ART_RULES.join(', ') + '.']
      .filter(Boolean)
      .join(' ')
  }
  return `Colour: ${style.palette} ${COLOURED_RULES.join(', ')}.`
}

/**
 * The narration is printed straight onto the picture, with nothing between it
 * and the art — no panel, no plate. So the room it needs has to be part of the
 * composition rather than something the page tacks on underneath.
 *
 * Describing that room is delicate in both directions. Say "leave space for
 * text" and the model draws somewhere to put text: a caption box, a banner, a
 * blank strip. Say nothing and it fills the foot of the page with detail the
 * words then land on top of. So the band is always described as scenery that
 * happens to be empty, and never as a place for words.
 */
function pageFraming(finish: BookFinish): string {
  return finish === 'coloring'
    ? 'Single full-page children’s coloring book illustration, vertical portrait orientation, the whole scene comfortably inside the frame with clear white space at the edges. Compose so the bottom fifth of the page stays open white background, with no linework and no detail crossing into it — let the scene rest above it, as though the ground simply ran out. Do not draw a box, a frame, a banner or a rule to mark that area off: it is plain untouched paper, continuous with the white the rest of the drawing sits on.'
    : // Full bleed: the PDF prints these edge to edge, so anything that matters
      // has to sit inside the middle. The band has the extra requirement of
      // being pale, because dark type goes on it with nothing underneath.
      'Single full-page children’s picture-book illustration, vertical portrait orientation, composed to fill the frame edge to edge with no border and no white margin. Keep the subject well inside the middle of the frame. The bottom fifth must be a calm, PALE stretch of the scene itself — open sky, still water, pale sand, sunlit grass, a plain light wall — high in value, soft in contrast, free of detail and free of any dark mass, because dark words are printed directly onto it. It must still read as painted scenery continuous with the picture above: draw no caption box, no banner, no panel, no empty rectangle and no blank strip anywhere.'
}

/**
 * The covers are in colour in both books, so they carry their own rules rather
 * than the finish-dependent ones. Two things still have to hold: the characters
 * must be the same people as inside, and nothing may be written on the art —
 * the title and the closing line are typeset over it by the PDF, and a model
 * that letters its own title produces a cover with two of everything.
 */
const COVER_RULES = [
  'Full colour illustration, in the manner of a printed picture-book cover',
  'keep the line work, character design and proportions of the style above, but fill every shape with colour',
  'no photographic realism, no gradients that muddy the line',
  'no text, no letters, no numbers, no title, no logo, no signature, no borders or frames',
] as const

function castDescription(characters: Character[]): string {
  return characters
    .map((c) => `${c.name}: ${terminated(c.traits)}`)
    .join(' ')
}

/**
 * How a cover should read its reference sheets, which depends on the book.
 *
 * In a coloring book the sheets are line art, so they fix the shapes but say
 * nothing about colour — left alone the model picks a different palette on the
 * front than on the back, and the two stop looking like the same book. The
 * written descriptions are what hold it together, and they demonstrably work.
 *
 * In a colour book the sheets are already coloured, so they are the stronger
 * authority and the descriptions are only a fallback for anything the sheet
 * happens not to show.
 */
function coverReferenceRule(
  finish: BookFinish,
  characters: Character[],
): string {
  return finish === 'coloring'
    ? `The sheets are uncoloured line art — colour the characters from these written descriptions: ${castDescription(characters)}`
    : `The sheets are already coloured: take every colour from them exactly, and use these descriptions only for anything the sheets do not show: ${castDescription(characters)}`
}

export type CoverKind = 'portrait' | 'scene'

export function coverPrompt(
  kind: CoverKind,
  opts: {
    artStyleId: ArtStyleId
    characters: Character[]
    /** Where the story happens, in the customer's words. */
    place: string
    /** A representative beat from the storyboard, in English. */
    moment: string
    /** Decides how the reference sheets are read, not whether there is colour. */
    finish: BookFinish
  },
): string {
  const style = getArtStyle(opts.artStyleId)
  const names = opts.characters.map((c) => c.name)

  const composition =
    kind === 'portrait'
      ? [
          'Book cover portrait: the characters posed together, large and central, facing the viewer as if looking at the person holding the book.',
          'They fill most of the frame from roughly the waist up, close enough to read every expression.',
          `Behind them, a simple suggestion of ${terminated(opts.place)} — enough to place them, not enough to compete.`,
        ]
      : [
          'Book cover scene: a wide establishing shot of the world of the story, with the characters inside it rather than posed for the camera.',
          `The moment: ${terminated(opts.moment)}`,
          'The characters read clearly but occupy a modest part of the frame; the setting carries the rest.',
        ]

  return [
    'Vertical portrait cover illustration for a personalised children’s book.',
    ...composition,
    `The reference sheets show exactly how ${formatList(names)} must look. Match their faces, hair, clothing and proportions precisely.`,
    coverReferenceRule(opts.finish, opts.characters),
    // The PDF prints the title across the top, so that band has to survive it.
    'Compose so the upper third of the image stays visually calm — open sky, foliage or plain background — because a title is printed across it.',
    `Drawing style: ${style.prompt}`,
    `Colour: ${style.palette}`,
    COVER_RULES.join(', ') + '.',
  ].join(' ')
}

export function backCoverPrompt(opts: {
  artStyleId: ArtStyleId
  characters: Character[]
  place: string
  finish: BookFinish
}): string {
  const style = getArtStyle(opts.artStyleId)
  const names = opts.characters.map((c) => c.name)

  return [
    'Vertical portrait back-cover illustration for a personalised children’s book: the quiet closing image, after the story has ended.',
    `${formatList(names)} at rest together at the end of the day — sitting, leaning, or walking away from the viewer — somewhere in ${terminated(opts.place)}`,
    'Calm and unhurried, warm late-afternoon light, no action and no drama. It should feel like the last breath of the book, not another scene.',
    `The reference sheets show exactly how ${formatList(names)} must look. Match their faces, hair, clothing and proportions precisely.`,
    coverReferenceRule(opts.finish, opts.characters),
    // Mirrors the cover: there the title sits on top, here the closing line sits under.
    'Compose so the lower third of the image stays visually calm, because a closing line is printed across it.',
    `Drawing style: ${style.prompt}`,
    `Colour: ${style.palette}`,
    COVER_RULES.join(', ') + '.',
  ].join(' ')
}

export function characterSheetPrompt(
  character: Character,
  artStyleId: ArtStyleId,
  photoCount: number,
  finish: BookFinish,
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
    `Character model sheet for a children’s book: three views of the same ${subject} side by side on one white sheet — full body facing forward, full body from the side, and a head-and-shoulders close-up.`,
    source,
    `The character is ${character.name}${character.age ? `, ${character.age}` : ''}. ${terminated(character.traits)}`,
    `Drawing style: ${style.prompt}`,
    'All three views must be unmistakably the same character, with identical clothing and proportions.',
    // The colour book's sheet is the palette every later page copies, so the
    // three views have to agree on colour as much as on shape.
    finish === 'coloured'
      ? 'All three views must also be coloured identically — the same hue on the same garment in each view. Keep the sheet itself on a plain white background.'
      : '',
    finishRules(finish, artStyleId),
  ]
    .filter(Boolean)
    .join(' ')
}

export function pagePrompt(
  sceneDescription: string,
  artStyleId: ArtStyleId,
  characterNames: string[],
  hasReferences: boolean,
  finish: BookFinish,
): string {
  const style = getArtStyle(artStyleId)

  const consistency =
    hasReferences && characterNames.length > 0
      ? [
          `The reference sheets show exactly how ${formatList(characterNames)} must look. Match their faces, hair, clothing and proportions precisely — they must be the same characters readers saw on every other page.`,
          // In a colour book the sheet is the palette, and saying so is what
          // stops a jumper drifting hue over thirty-two pages.
          finish === 'coloured'
            ? 'The sheets are coloured: take every colour from them exactly, without reinterpreting.'
            : '',
        ]
          .filter(Boolean)
          .join(' ')
      : ''

  return [
    pageFraming(finish),
    `Scene: ${terminated(sceneDescription)}`,
    consistency,
    `Drawing style: ${style.prompt}`,
    finishRules(finish, artStyleId),
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * A page redrawn from one of the customer's own photographs.
 *
 * Two references arrive together and they are not equals, which is the whole
 * difficulty: the photograph owns the composition — who is where, the poses,
 * the framing, the moment — while the model sheets own how the characters are
 * drawn. Left unranked the model either invents a new scene that matches the
 * sheets, or traces the photo and loses the characters. So the ranking is
 * stated outright, and the photograph is named as the first reference.
 */
export function memoryPagePrompt(
  note: string,
  sceneDescription: string,
  artStyleId: ArtStyleId,
  characterNames: string[],
  finish: BookFinish,
): string {
  const style = getArtStyle(artStyleId)

  return [
    pageFraming(finish),
    'This page is a real photograph, redrawn.',
    'THE FIRST REFERENCE IMAGE IS THAT PHOTOGRAPH. Recreate what it shows: the same people doing the same thing, in the same arrangement, the same poses and gestures, the same framing and camera distance, the same surroundings. Keep whatever makes the moment itself — a hand on a shoulder, someone caught mid-laugh, the thing being held.',
    `What the moment is: ${terminated(note)}`,
    sceneDescription.trim() ? `Context: ${terminated(sceneDescription)}` : '',
    characterNames.length > 0
      ? `The remaining reference sheets show how ${formatList(characterNames)} are drawn in this book. Take their faces, hair, clothing and proportions from those sheets, not from the photograph — the photograph decides what is happening, the sheets decide what everyone looks like.`
      : '',
    // Photographs carry things a children's book should quietly drop.
    'Redraw it as an illustration rather than copying it: leave out anything incidental the photograph happens to contain — clutter, passers-by, signage, timestamps, brand names — and keep the people and the moment.',
    `Drawing style: ${style.prompt}`,
    finishRules(finish, artStyleId),
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
