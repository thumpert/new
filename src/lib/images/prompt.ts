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
  'no text, no letters, no numbers, no signatures, no borders or frames',
  // Line weight is deliberately not fixed here: each style specifies its own,
  // and some want a thick silhouette against thinner interior detail.
  'clean closed shapes, drawn to be coloured in with crayons',
] as const

/**
 * Stated separately from the list above because it has two forms, and the two
 * must never both be sent. An absolute "no colour of any kind" alongside an
 * exception for one object is a contradiction, and a contradicted prompt is
 * how a page ends up with something invented in it.
 */
const NO_COLOUR_AT_ALL = 'No colour of any kind anywhere on the page.'

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
 * The one exception to "no colour of any kind": the guide object.
 *
 * This started as the model disobeying. A book came back with the blue
 * woollen thread that runs through its story drawn in actual blue, in a book
 * whose rules said pure black and white — and it was better than the rule. It
 * is the only thing on the page you can follow with a finger, the eye tracks
 * it from page to page without being told to, and everything around it is
 * still empty and waiting to be coloured.
 *
 * So it is deliberate now, and tightly bounded: exactly one object, one flat
 * colour, no shading in it, nothing else on the page tinted at all. Loosening
 * "no colour" any further than this is how colour bleeds back into the whole
 * book.
 */
function spotColourRule(device: string): string {
  return [
    `SPOT COLOUR — one exception to the black and white, and only one: ${terminated(device)}`,
    'That object, and only that object, is drawn in its own flat colour, filled in solid. It is the single coloured thing on the page and it is what the eye follows from page to page.',
    'Everything else in the drawing — every character, every background, every other object — stays pure black line art on white, unfilled and waiting to be coloured in.',
    'The coloured object carries no shading, no gradient and no second tone: one flat colour, inside a black outline like everything else.',
    'Nothing else takes a tint of any kind — not eyes, not cheeks, not a leaf, not the sky. A page reviewer found brown irises on three characters in a book whose only colour was meant to be one red thread.',
  ].join(' ')
}

function finishRules(
  finish: BookFinish,
  artStyleId: ArtStyleId,
  device?: string,
): string {
  const style = getArtStyle(artStyleId)
  if (finish === 'coloring') {
    // The caveat retracts whatever shading this particular style normally
    // carries, and only a coloring page needs that retraction.
    // Either the absolute rule or the one-object exception — never both.
    return [
      style.coloringCaveat,
      LINE_ART_RULES.join(', ') + '.',
      device?.trim() ? spotColourRule(device) : NO_COLOUR_AT_ALL,
    ]
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
  // A reading book prints its words on the facing page, so this picture needs
  // no calm band at all — and must not be given one, or it comes back with a
  // fifth of the frame wasted on empty sky for text that is printed elsewhere.
  // In exchange it carries a harder requirement: it is the only thing on its
  // page, and a child who cannot read yet follows the book through it.
  if (finish === 'reading') {
    return 'Single full-page children’s picture-book illustration, vertical portrait orientation, composed to fill the frame edge to edge with no border and no white margin. No words are printed on this picture, so use the whole frame: no calm band, no empty strip, no reserved space anywhere. It must tell its moment on its own — clear enough that a child who cannot yet read could follow the story from the pictures alone — so make the action, the faces and what everyone wants unmistakable. Absolutely no lettering: no signs, no labels, no numbers, no writing of any kind.'
  }

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
    .map((c) => `${c.name}: ${terminated(c.appearance)}`)
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
    `The character is ${character.name}${character.age ? `, ${character.age}` : ''}. ${terminated(character.appearance)}`,
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

/**
 * Rules that hold on every drawn page, whatever the style or the book.
 *
 * Written because a real book came back with them broken: a figure with a
 * third arm resting on a shoulder, and a pair of trainers floating unattached
 * because the words had mentioned trainers. Both are the same failure — the
 * model adding something the scene never asked for — so both are ruled out by
 * name rather than left to its judgement.
 */
const SANITY_RULES = [
  'ANATOMY: every person and animal has exactly one head, two arms and two legs, each attached to a body and belonging to someone visible. No spare limbs, no hand resting on a shoulder with nobody behind it, no duplicated face.',
  'NOTHING FLOATS: every object is held, worn, or resting on a surface. Nothing hovers unattached in the air.',
  'ONLY WHAT THE SCENE SAYS: draw the people and things the scene describes and nothing else. Do not add extra figures, extra animals, signs, maps, diagrams, screens or logos to fill space.',
] as const

export function pagePrompt(
  sceneDescription: string,
  artStyleId: ArtStyleId,
  characters: Character[],
  hasReferences: boolean,
  finish: BookFinish,
  device?: string,
): string {
  const style = getArtStyle(artStyleId)
  const names = characters.map((c) => c.name)

  const consistency =
    hasReferences && characters.length > 0
      ? [
          `The reference sheets show exactly how ${formatList(names)} must look. Match their faces, hair, clothing and proportions precisely — they must be the same characters readers saw on every other page.`,
          // The sheet alone drifts over a dozen pages. The written description
          // alongside it is what holds a character still, and it is the same
          // pairing that made the covers come back faithful.
          `In words, so nothing drifts: ${castDescription(characters)}`,
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
    SANITY_RULES.join(' '),
    finishRules(finish, artStyleId, device),
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
  characters: Character[],
  finish: BookFinish,
): string {
  const style = getArtStyle(artStyleId)
  const names = characters.map((c) => c.name)

  // Deliberately NOT pageFraming(). That instruction asks for a calm band of
  // scenery along the bottom, which an ordinary page can compose for — but a
  // photograph's composition is already fixed, and a selfie has no bottom
  // fifth of landscape to give. Asked for one anyway, the model invented it:
  // a real book came back with a hallucinated bus-route map and a pair of
  // floating trainers filling that band on both photo pages. The photograph
  // owns the whole frame here; the PDF handles the words.
  return [
    'Vertical portrait illustration for a children’s book, filling the frame.',
    'This page is a real photograph, redrawn.',
    'THE FIRST REFERENCE IMAGE IS THAT PHOTOGRAPH. Recreate what it shows: the same people doing the same thing, in the same arrangement, the same poses and gestures, the same framing and camera distance, the same surroundings. Keep whatever makes the moment itself — a hand on a shoulder, someone caught mid-laugh, the thing being held.',
    'DRAW ONLY WHAT THE PHOTOGRAPH SHOWS. Do not extend the scene past its edges, do not invent background to fill the frame, and do not add a single object, figure, animal, sign, map or pattern that is not in the photograph. If part of the frame would be empty, let it stay plain.',
    `What the moment is: ${terminated(note)}`,
    // The story text is context for placement only. Given as scene direction
    // it gets drawn: a narration that mentioned green trainers produced a pair
    // of green trainers sitting in mid-air beside the characters.
    sceneDescription.trim()
      ? `For context only, not to be drawn: this page falls at the point in the story where ${terminated(sceneDescription)} Draw the photograph, not this sentence.`
      : '',
    names.length > 0
      ? `The remaining reference sheets show how ${formatList(names)} are drawn in this book. Take their faces, hair, clothing and proportions from those sheets, not from the photograph — the photograph decides what is happening, the sheets decide what everyone looks like. In words: ${castDescription(characters)}`
      : '',
    // Photographs carry things a children's book should quietly drop.
    'Redraw it as an illustration rather than copying it: leave out anything incidental the photograph happens to contain — clutter, passers-by, signage, timestamps, brand names — and keep the people and the moment.',
    `It must look like it belongs in the same book as every other page: same drawing style, same line, same level of stylisation. A page that comes out more realistic than the rest has failed, however faithful it is to the photograph.`,
    `Drawing style: ${style.prompt}`,
    SANITY_RULES.join(' '),
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
