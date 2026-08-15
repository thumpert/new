import type {
  ArtStyleId,
  BookLanguageId,
  BookSizeId,
  ImageModelId,
  OccasionId,
  StoryTypeId,
  ToneId,
} from './types'

/**
 * The catalog holds the *machine-facing* half of every option: prompt
 * fragments in English that get fed to the models. The human-facing labels
 * live in the locale dictionaries (src/lib/i18n), keyed by the same ids.
 */

export interface OccasionDef {
  id: OccasionId
  /** Steers the story generator towards the right emotional register. */
  storyAngle: string
  /** Seeds the interview so questions feel written for this occasion. */
  interviewFocus: string
  /** Story types that make sense for this occasion, best first. */
  suggestedStoryTypes: StoryTypeId[]
}

export const OCCASIONS: OccasionDef[] = [
  {
    id: 'child',
    storyAngle:
      'A gift from a parent or relative to a child. Celebrates who the child is: their curiosity, their favourite things, the small everyday moments that make them themselves.',
    interviewFocus:
      'the child’s personality, what they love doing, their favourite toy or place, funny habits, who they are closest to',
    suggestedStoryTypes: ['adventure', 'everyday-magic', 'fairy-tale', 'funny'],
  },
  {
    id: 'new-baby',
    storyAngle:
      'Welcoming a newborn into the family. Gentle, full of anticipation and tenderness, often narrated as the family waiting for and meeting the baby.',
    interviewFocus:
      'how the family found out, how siblings and pets reacted, what the family dreams for the baby, the meaning of the baby’s name',
    suggestedStoryTypes: ['everyday-magic', 'journey', 'fairy-tale'],
  },
  {
    id: 'birthday',
    storyAngle:
      'A birthday celebration. Builds towards a party or a surprise, and looks back fondly at the year that passed.',
    interviewFocus:
      'the best thing that happened this year, what they are obsessed with right now, who would be at the party, a running joke among friends',
    suggestedStoryTypes: ['adventure', 'funny', 'superhero', 'everyday-magic'],
  },
  {
    id: 'relationship',
    storyAngle:
      'A gift between partners. Retells the story of the couple: how they met, what they build together, the private jokes only they understand.',
    interviewFocus:
      'how they met, the first date, pet names and inside jokes, the biggest differences between them, a favourite shared memory, what they love doing together',
    suggestedStoryTypes: ['journey', 'everyday-magic', 'funny', 'adventure'],
  },
  {
    id: 'pet',
    storyAngle:
      'A tribute to a beloved pet. The pet is the hero, seen with affection and humour, with the humans as supporting cast.',
    interviewFocus:
      'how the pet joined the family, their worst mischief, favourite spot in the house, how they greet people, their nemesis (the vacuum, the mailman, a cat next door)',
    suggestedStoryTypes: ['funny', 'adventure', 'everyday-magic', 'superhero'],
  },
]

export interface StoryTypeDef {
  id: StoryTypeId
  prompt: string
}

export const STORY_TYPES: StoryTypeDef[] = [
  {
    id: 'adventure',
    prompt:
      'An adventure with a clear quest: the heroes leave home, face a playful obstacle, and come back changed.',
  },
  {
    id: 'everyday-magic',
    prompt:
      'An ordinary day where something quietly magical happens — the real world, tilted just enough to feel enchanted.',
  },
  {
    id: 'fairy-tale',
    prompt:
      'A classic fairy tale structure with castles, forests and a gentle moral, told in a timeless voice.',
  },
  {
    id: 'journey',
    prompt:
      'A journey through time or places, visiting the milestones that brought the characters to where they are today.',
  },
  {
    id: 'superhero',
    prompt:
      'A superhero story where the characters discover a power drawn from their real personality traits.',
  },
  {
    id: 'funny',
    prompt:
      'A comedy built on mishaps and running gags, where everything goes hilariously wrong before it goes right.',
  },
]

export interface ToneDef {
  id: ToneId
  prompt: string
}

export const TONES: ToneDef[] = [
  {
    id: 'warm',
    prompt:
      'Warm and affectionate, like a parent reading at bedtime. Simple sentences, a lot of heart, never saccharine.',
  },
  {
    id: 'playful',
    prompt:
      'Playful and energetic, with sound words, exclamations and a wink to the reader.',
  },
  {
    id: 'poetic',
    prompt:
      'Poetic and lyrical, with gentle rhythm and imagery. May rhyme lightly, but never at the cost of meaning.',
  },
  {
    id: 'epic',
    prompt:
      'Grand and cinematic, in the voice of a narrator announcing legendary deeds — played slightly for laughs given the domestic subject.',
  },
]

export interface ArtStyleDef {
  id: ArtStyleId
  /**
   * Appended to every page prompt to lock the drawing style. Each style states
   * its own line weight — the shared rules deliberately leave that open.
   * Written as a self-contained sentence, ending in its own punctuation.
   *
   * Every style here is a full specification rather than a one-liner. A short
   * phrase lets the model fall back on its own idea of "cute" or "comic book",
   * and naming each part is what holds it in place — measured on kawaii/chibi,
   * where the one-liner drew solid black pupils and the spec did not.
   */
  prompt: string
  /** Rough guide for how much detail the scene description should carry. */
  complexity: 'low' | 'medium' | 'high'
  /**
   * Fixed example shown in the wizard, generated once from this style's own
   * prompt on one shared scene so the five are directly comparable. Checked
   * into public/styles — it must never change per customer, or the picker
   * stops being a promise about what they will get.
   */
  sample: string
}

export const ART_STYLES: ArtStyleDef[] = [
  {
    id: 'chibi',
    prompt: [
      'kawaii chibi super-deformed vector illustration.',
      'SHAPES: rounded and spherical throughout; the silhouette has no sharp corners, hard edges or right angles.',
      'PROPORTIONS: super-deformed chibi build. The head is large and spherical and takes up 50-70% of the character\u2019s total height. The body is tiny and minimal beside it, roughly 1:1.5 to 1:2 head-to-body, tapering like a cone or a pear so the figure sits stably.',
      'HEAD: a perfect circle or a soft wide ellipse. Full round cheeks carry the outline. There is no chin at all \u2014 the base of the head is one continuous soft curve.',
      'FACE: eyes, nose and mouth sit low on the face, leaving a large spherical forehead, for an infant-like look. Eyes are big and exaggerated, oval or round, filling much of the head; their interiors are simplified into basic geometry \u2014 large circles for pupils, small dots for highlights \u2014 drawn as outlines only and never filled in solid. Upper lashes are thick. The nose is one small round dot, or left out entirely. The mouth is small and simple, a single short curve just under the nose.',
      'BODY: a short minimal torso joins the spherical head straight to the limbs, with no visible neck. Shoulders are narrow and rounded. Limbs are short simplified stubs; hands are mitten shapes and feet are rounded clubs, with fingers suggested by a curve or two rather than drawn joint by joint.',
      'HAIR: large spherical volumetric clumps. Individual strands simplify into rounded leaf or pebble shapes. Highlights are flat, simple geometric shapes.',
      'CLOTHING: fabric folds are minimal, a few simple curved lines. Hoods, bags and garments read as rounded volumes.',
      'LINES: clean, smooth, consistent vector line art. Thick black outlines on the character\u2019s silhouette and on the main objects, sticker-like. Interior detail lines \u2014 inside hair, clothing and eyes \u2014 slightly thinner, still clean and smooth. No brush texture, no noise, and every outline fully closed.',
    ].join(' '),
    complexity: 'low',
    sample: '/styles/chibi.png',
  },
  {
    id: 'coloring-book',
    // The spec this came from described a botanical mandala. A mandala has no
    // story in it, so the ornament is applied *to the scene* instead: the
    // characters stay the subject and the decorative density fills around them.
    prompt: [
      'highly detailed ornamental black-and-white line art, in the manner of an intricate art-therapy coloring book.',
      'ORNAMENT: the scene itself is drawn plainly and clearly, then framed and filled with dense decorative botanical work \u2014 interlacing foliage, climbing vines, tendrils, overlapping petals, and curling arabesque swirls that fill what would otherwise be empty background.',
      'SYMMETRY: decorative borders and background elements are arranged in concentric, mirrored, mandala-like patterns around the subject, while the characters themselves stay naturally posed and asymmetric.',
      'HIDDEN DETAIL: tiny butterflies, ladybirds, small birds and beetles are tucked into the foliage for the colourist to find.',
      'DETAIL LEVEL: extreme density of micro-detail \u2014 fine veins drawn inside every leaf, repeated carved patterns on surfaces, small decorative dots.',
      'CONTRAST: strong contrast between clean pure-white negative space and the richly tangled decorated areas, so the page never becomes uniformly busy.',
      'LINES: fine, precise, sharp black ink outlines at a near-uniform weight, with only very subtle variation to show which leaf or petal overlaps which. Every single shape is strictly closed so each individual space can be coloured.',
    ].join(' '),
    complexity: 'high',
    sample: '/styles/coloring-book.png',
  },
  {
    id: 'superhero-comic',
    // Heroic drama, minus the ink. The source spec asked for blackout shadow
    // and cross-hatching, which are the two things a coloring page cannot have
    // \u2014 they fill in the very areas the child is meant to colour. The
    // drama survives in the anatomy, the poses and the camera instead.
    prompt: [
      'action comic-book superhero art, drawn as clean open line art.',
      'ANATOMY: heroic exaggerated proportions, hyper-defined musculature, broad shoulders, idealised build and strong bone structure.',
      'POSES: caught mid-movement, with twisting bodies, dramatic foreshortening and forced perspective that throws fists and limbs toward the viewer.',
      'EXPRESSIONS: intense and emotive, with strong angular jaws, furrowed brows and a focused heroic stare.',
      'CAMERA: dramatic low angles that make the characters tower over the viewer, or steep high angles for action beats.',
      'ENERGY: converging speed lines, impact bursts and energy blasts drawn as bold clean outlines only.',
      'LINES: bold ink outlines with strongly varied weight \u2014 heavy on the silhouette and on whatever is nearest the camera, lighter on interior detail \u2014 so weight, volume and depth are carried entirely by the line itself.',
      'IMPORTANT: despite the comic-book idiom, use no solid black shadow areas, no hatching and no cross-hatching, and draw one single full-page illustration rather than a grid of panels.',
    ].join(' '),
    complexity: 'high',
    sample: '/styles/superhero-comic.png',
  },
  {
    id: 'fine-line',
    // The source spec built its volume out of fine parallel hatching. Hatching
    // is shading, and shading is what the child is supposed to add, so volume
    // is carried by the contour instead.
    prompt: [
      'refined modern editorial illustration, in elegant fine-line pen work.',
      'LINES: ultra-fine, graceful, fluid and perfectly clean contours, with subtle weight variation to suggest lightness and depth. Organic curves and soft transitions throughout, with none of the heavy blunt strokes of traditional comics.',
      'DETAIL: fine strokes carry the complex detail \u2014 individual strands of windblown hair, the natural fall and fold of fabric, the soft contour of a face.',
      'PROPORTIONS: semi-realistic and elegantly stylised. Almond-shaped faces with gentle features, expressive well-defined eyes and natural smiles.',
      'ANIMALS: highly expressive but anatomically natural. Fur is suggested by small groups of fine strokes along the edge, never so dense that it clouds the silhouette.',
      'POSES: dynamic yet relaxed and fluid, built around expressive gestures and natural interaction between the characters.',
      'BACKGROUND: rich and detailed \u2014 foliage, water, rock \u2014 but drawn in lighter, thinner contours than the foreground so the characters stay the focus.',
      'BALANCE: an elegant balance between clean open areas and regions of dense fine detail.',
      'IMPORTANT: build volume from the contour lines alone \u2014 no hatching, no parallel line-shading, no shadow tone of any kind.',
    ].join(' '),
    complexity: 'high',
    sample: '/styles/fine-line.png',
  },
  {
    id: 'cartoon',
    // The source spec ended with one specific picture (a dog on a trail below
    // angular mountains). Naming those objects would fight whatever the page
    // is actually about, so only the layered depth recipe is kept.
    prompt: [
      'modern 1990s adventure-cartoon animation style, drawn as clean vector-quality line art.',
      'LINES: clean, continuous, well-defined black line art. Medium, even weight on the silhouettes of characters and foreground objects, in the manner of classic cel animation. Interior lines slightly thinner, marking fabric folds, facial features, locks of hair and the texture of rock and leaves.',
      'PROPORTIONS: lightly stylised, in the register of 90s animation. The head is a little large for the body, eyes are expressive and almond-shaped, the nose is small and simplified, ears are cleanly drawn. Hair divides into large, voluminous, pointed locks.',
      'ANIMALS: drawn with almost human expressiveness in the face \u2014 almond eyes with expressive brows, a pronounced muzzle \u2014 while keeping true four-legged anatomy.',
      'CLOTHING: broad, clean, well-structured fabric folds.',
      'COMPOSITION: staged in clear layers of depth \u2014 foliage or trunks framing the near edges, the characters full-body in the middle ground, and simplified rounded masses of trees, hills or buildings behind.',
      'IMPORTANT: this style is normally cel-shaded; here leave every shape open and unshaded \u2014 no blocks of flat shadow, no cast shadows on the ground.',
    ].join(' '),
    complexity: 'medium',
    sample: '/styles/cartoon.png',
  },
]

export interface ImageModelDef {
  id: ImageModelId
  /**
   * Path on platform.higgsfield.ai. Taken from the published OpenAPI spec
   * (docs.higgsfield.ai/docs/openapi.json), not guessed.
   */
  endpoint: string
  /** Env var that overrides the endpoint, for when the API moves. */
  endpointEnv: string
  /**
   * How this endpoint takes reference images:
   *   array  — input_images: [{type: "image_url", image_url}], up to maxReferences
   *   single — image_reference_url: "<url>", one only
   */
  referenceMode: 'array' | 'single'
  maxReferences: number
  /** Extra body fields, straight from the endpoint's schema. */
  extraInput: Record<string, string | number | boolean>
  /** Rough seconds per page, measured on the same scene. */
  secondsPerPage: number
}

export const IMAGE_MODELS: ImageModelDef[] = [
  {
    id: 'nano-banana',
    endpoint: '/nano-banana',
    endpointEnv: 'HIGGSFIELD_ENDPOINT_NANO_BANANA',
    // The only published image endpoint that takes several reference images,
    // which is what a page with more than one character needs.
    referenceMode: 'array',
    maxReferences: 8,
    // The endpoint defaults to jpeg; line art wants png, since JPEG ringing
    // shows up as grey fringes exactly where the black outlines are.
    extraInput: { output_format: 'png' },
    secondsPerPage: 40,
  },
  {
    id: 'soul',
    endpoint: '/higgsfield-ai/soul/reference',
    endpointEnv: 'HIGGSFIELD_ENDPOINT_SOUL',
    referenceMode: 'single',
    maxReferences: 1,
    // enhance_prompt defaults to true and rewrites the prompt server-side,
    // which can quietly undo the "no shading, no grey" constraints.
    extraInput: { resolution: '1080p', enhance_prompt: false },
    secondsPerPage: 45,
  },
]

export interface BookLanguageDef {
  id: BookLanguageId
  /** Language the narration is written in. */
  primary: string
  /** Second language printed smaller underneath, when the book is bilingual. */
  secondary?: string
}

export const BOOK_LANGUAGES: BookLanguageDef[] = [
  { id: 'pt', primary: 'Brazilian Portuguese' },
  { id: 'en', primary: 'English' },
  { id: 'en-pt', primary: 'English', secondary: 'Brazilian Portuguese' },
]

export interface BookSizeDef {
  id: BookSizeId
  /** Number of illustrated pages. Multiples of 4 keep the printer happy. */
  pages: number
}

export const BOOK_SIZES: BookSizeDef[] = [
  { id: 'short', pages: 12 },
  { id: 'medium', pages: 20 },
  { id: 'long', pages: 32 },
]

export function getOccasion(id: OccasionId): OccasionDef {
  const found = OCCASIONS.find((o) => o.id === id)
  if (!found) throw new Error(`Unknown occasion: ${id}`)
  return found
}

export function getStoryType(id: StoryTypeId): StoryTypeDef {
  const found = STORY_TYPES.find((s) => s.id === id)
  if (!found) throw new Error(`Unknown story type: ${id}`)
  return found
}

export function getTone(id: ToneId): ToneDef {
  const found = TONES.find((t) => t.id === id)
  if (!found) throw new Error(`Unknown tone: ${id}`)
  return found
}

export function getArtStyle(id: ArtStyleId): ArtStyleDef {
  const found = ART_STYLES.find((a) => a.id === id)
  if (!found) throw new Error(`Unknown art style: ${id}`)
  return found
}

export function getImageModel(id: ImageModelId): ImageModelDef {
  const found = IMAGE_MODELS.find((m) => m.id === id)
  if (!found) throw new Error(`Unknown image model: ${id}`)
  return found
}

export function getBookLanguage(id: BookLanguageId): BookLanguageDef {
  const found = BOOK_LANGUAGES.find((b) => b.id === id)
  if (!found) throw new Error(`Unknown book language: ${id}`)
  return found
}

export function getBookSize(id: BookSizeId): BookSizeDef {
  const found = BOOK_SIZES.find((b) => b.id === id)
  if (!found) throw new Error(`Unknown book size: ${id}`)
  return found
}
