import type {
  AgeBandId,
  BookFinish,
  ArtStyleId,
  BookLanguageId,
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
    // Affection measured out loud rather than declared.
    prompt: [
      'Affectionate, in the voice of two who love each other measuring it out loud.',
      'MECHANISM: affection is never named in the abstract. It always becomes a quantity or a gesture — how wide the arms open, how high the jump, how far one would run. If a line could be replaced by "they loved each other very much", it is written wrong.',
      'EXCHANGE: the page is built as a small back-and-forth. One asks or claims, the other answers or tries to outdo it. A page may carry only one half of the exchange, with the next page answering.',
      'UNITS: the measures are childlike and physical — arms, jumps, distances, how long a breath lasts. Never abstract units, never numbers.',
      'HUMOUR: comes from the mismatch of scales, when the small one tries to out-measure the big one, or accidentally wins.',
      'SPEECH: the characters actually talk. Most pages carry at least one spoken line, written as speech. This voice is a conversation overheard, not a scene described.',
      'TIME: one present moment, unfolding now. Never "every afternoon", never "as always" — this voice does not look back or count repetitions.',
      'CLOSING: whoever is older or bigger has the last word, and it is quieter than the one before, not louder.',
      'AVOID: abstract feeling words, adult vocabulary for emotion, sentimentality with no gesture underneath.',
      'NOT TO BE CONFUSED WITH the quiet remembering voice: that one watches and accumulates afternoons, and hardly anyone speaks in it. This one is two people talking, right now. If a page has nobody speaking and reaches for what always happens, it has drifted into the wrong voice.',
      'WHEN THERE IS ONLY ONE CHARACTER: the measuring runs against the world instead — the size of the garden, the length of the afternoon, how much of the day is left. The form needs two sides, so the world becomes the second one.',
    ].join(' '),
  },
  {
    id: 'playful',
    // Brazilian, colloquial, cumulative; the joke is who someone is.
    prompt: [
      'Playful and colloquial, in the voice of a Brazilian narrator who knows this person well and is amused by them.',
      'SENTENCES: short and declarative, stacked one after another. The rhythm comes from accumulation, and the last sentence of a page is shorter than the ones before it, landing like a punchline.',
      'SUBJECT OF THE JOKE: who the character is, never what merely happens. The humour is affectionate exaggeration of a real habit — the way they always run ahead, the thing they always say.',
      'HOW A PERSON IS DRAWN: by one habit, shown in action rather than announced — and often topped by a second character who is even more that way. Do not use a fixed formula to do it, and above all do not open a page by naming somebody and then explaining what they are like; write them doing the thing.',
      'VOCABULARY: everyday and unpretentious, the way people actually speak. No invented words, no rhyme, no sound effects.',
      'AVOID: slapstick for its own sake, jokes only an adult would get, and any humour at the character’s expense — the reader must feel the narrator likes them.',
    ].join(' '),
  },
  {
    id: 'poetic',
    // Short lines, gentle cadence, one image a page.
    prompt: [
      'Poetic, in the voice of short lines and a gentle regular cadence.',
      'IMAGE: one clear image per page, drawn from the concrete world of this story — the light, the garden, the animal, the object in someone’s hand. Never abstract beauty, never a feeling floating free of a thing.',
      'RHYME: allowed but never pursued. If a rhyme arrives on its own and costs nothing, keep it. The moment it would force an odd word, an inverted sentence or a weaker meaning, drop it and let the line be unrhymed. An unrhymed line that reads naturally is always better than a rhymed one that does not.',
      'SOUND: softness comes from the vowels and the pauses rather than from ornament. Keep the lines short enough to breathe between them.',
      'AVOID: archaic word order, inversions written to land a rhyme, and grand abstractions.',
      'BILINGUAL BOOKS: the support line stays an honest, natural translation. It must never be bent to rhyme — its job is to let a learner check themselves.',
    ].join(' '),
  },
  {
    id: 'epic',
    // Live commentary over a domestic non-event.
    prompt: [
      'Epic in the voice of a live sports commentator, calling something far too small for the intensity being brought to it.',
      'TENSE: present, always. It is happening now, in front of the microphone.',
      'RHYTHM: short bursts and sentence fragments. A build-up, then a break. The page has quiet before it has a shout, or the shout means nothing.',
      'THE JOKE: the mismatch between the delivery and the event. A dog reaching the gate first is called like a decisive goal, and the narrator never once acknowledges that it is a small thing.',
      'NAMING: say the characters’ names constantly, the way commentators do.',
      'INTENSITY: at most one shouted, capitalised moment per page, and not on every page.',
      'AVOID: real sporting jargon a child would not know, mockery of the characters, and shouting all the way through with no quiet to set it off.',
    ].join(' '),
  },
  {
    id: 'serene',
    // The one voice that does not perform. Every gesture carries the earlier
    // times it happened, which is what a keepsake book actually is.
    prompt: [
      'Quiet and unhurried, in the voice of someone remembering rather than announcing.',
      'MECHANISM: every ordinary thing carries the times it happened before. A gate holds the creak of all the afternoons that came before it; a path is known by heart because it was walked so often. This is what separates this voice from simply being calm.',
      'RESTRAINT: the feeling is never stated. Put down one exact detail and stop. If a sentence explains why a moment matters, delete the explanation and keep the moment.',
      'SENTENCES: plain and unhurried, with no ornament and few adjectives. Their weight comes from what they leave out.',
      'DETAIL: concrete and sensory — what the hand touched, what the air smelled of, what was heard from the next room. Small things, given their due.',
      'SPEECH: almost none. The narrator is watching, not listening in. On the rare page where someone speaks, report what they said rather than quoting it.',
      'TIME: many afternoons at once rather than one. Reach for what always happens, what happened before, what is known by heart. A page may sit inside a single moment, but that moment carries the others behind it.',
      'AVOID: nostalgia laid on thick, sadness, anything wistful about time passing. This voice is warm and present, not mournful. Also avoid grand words: the register breaks the moment it reaches for beauty.',
      'NOT TO BE CONFUSED WITH the affectionate measuring voice: that one is two people talking now, trading gestures and trying to outdo each other. This one has nobody competing and hardly anybody speaking. If a page turns into an exchange of dialogue, it has drifted into the wrong voice.',
    ].join(' '),
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
  /**
   * How this style is coloured. Used by every cover, and by every page when
   * the book is a colour book rather than a coloring book.
   *
   * A full specification for the same reason `prompt` is one: "colour it in"
   * lands on the same generic mid-saturation cartoon palette every time, and
   * the palette is most of what separates a comic from something kawaii. The
   * style owns its colour — the customer never picks a palette separately,
   * so the two can never fight each other.
   */
  palette: string
  /**
   * Appended only when the book is a coloring book.
   *
   * Several of these styles are shaded in their natural form — cel blocks,
   * cross-hatching, ink shadow — and a coloring page cannot carry any of it,
   * because shading fills the very areas the child is meant to fill. So each
   * style states its own retraction here rather than in `prompt`: kept in the
   * main spec it would contradict that style's own palette, and the colour
   * book would come out flat and unshaded.
   */
  coloringCaveat?: string
  /** Rough guide for how much detail the scene description should carry. */
  complexity: 'low' | 'medium' | 'high'
  /**
   * Fixed example shown in the wizard, generated once from this style's own
   * prompt on one shared scene so the five are directly comparable. Checked
   * into public/styles — it must never change per customer, or the picker
   * stops being a promise about what they will get.
   */
  sample: string
  /**
   * The same scene again, in this style's own palette, shown when the customer
   * is making a colour book. Without it the colour flow would advertise itself
   * with a black-and-white picture, which is the one thing the palettes exist
   * to contradict.
   */
  sampleColoured: string
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
    palette: [
      'Soft kawaii pastel palette.',
      'HUES: powder pinks, mints, butter yellows, sky blues, lilac and cream — every hue a shade lighter and milkier than it would be in life.',
      'SATURATION: low throughout. Nothing shouts; the loudest colour on the page is still gentle.',
      'CONTRAST: deliberately narrow. The darkest value in the picture is a soft grey-lilac, never black and never a true shadow.',
      'FILLS: flat and even, with at most one slightly deeper tone of the same hue to round a shape.',
      'The black outline stays as drawn — the colour sits inside it without darkening it.',
    ].join(' '),
    complexity: 'low',
    sample: '/styles/chibi.png',
    sampleColoured: '/styles/chibi-colour.png',
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
    palette: [
      'Rich decorative jewel tones, in the manner of a finished art-therapy page.',
      'HUES: deep emerald and moss, plum, indigo, amber, coral and old gold.',
      'SATURATION: high but never neon — colours read as dyed or enamelled rather than lit.',
      'APPLICATION: the ornament is filled band by band so neighbouring shapes differ in hue, which is what makes the interlacing legible.',
      'RESTRAINT: the very finest micro-detail — leaf veins, carved dots, the smallest inner shapes — is left unfilled, so the linework still carries the drawing instead of drowning in colour.',
      'Decorative rather than naturalistic: a leaf may be plum if the pattern wants plum.',
    ].join(' '),
    complexity: 'high',
    sample: '/styles/coloring-book.png',
    sampleColoured: '/styles/coloring-book-colour.png',
  },
  {
    id: 'superhero-comic',
    // Heroic drama, minus two things the source spec asked for.
    //
    // The ink: blackout shadow and cross-hatching fill in the very areas the
    // child is meant to colour, so the page would arrive already coloured.
    //
    // The muscles: the customer is buying a book about a real 6-year-old, a
    // grandmother, a dachshund. Bodybuilder anatomy would draw somebody else.
    // The heroism is moved into pose, camera and energy, which cost the
    // likeness nothing.
    prompt: [
      'action comic-book superhero art, drawn as clean open line art.',
      'ANATOMY: proportions stay true to who each character actually is \u2014 a child is drawn as a child, an adult as an adult, an animal as itself, with ordinary everyday builds. Nobody is given heroic musculature or an idealised physique.',
      'HEROISM: the heroic register comes from posture and staging rather than from the body \u2014 a planted confident stance, a cape or scarf or coat streaming behind, a costume detail, a fist raised.',
      'POSES: caught mid-movement, with twisting bodies, dramatic foreshortening and forced perspective that throws hands and limbs toward the viewer.',
      'EXPRESSIONS: big and emotive, full of brave determination, delight and mischief. Warm and friendly rather than gritty \u2014 no furrowed scowls or hard angular jaws.',
      'CAMERA: dramatic low angles that make the characters tower over the viewer, or steep high angles for action beats.',
      'ENERGY: converging speed lines, impact bursts and energy blasts drawn as bold clean outlines only.',
      'LINES: bold ink outlines with strongly varied weight \u2014 heavy on the silhouette and on whatever is nearest the camera, lighter on interior detail \u2014 so weight, volume and depth are carried entirely by the line itself.',
      'IMPORTANT: draw one single full-page illustration rather than a grid of panels.',
    ].join(' '),
    coloringCaveat:
      'Despite the comic-book idiom, use no solid black shadow areas, no hatching and no cross-hatching \u2014 the drama has to come from the anatomy, the poses and the camera instead.',
    palette: [
      'Bold saturated comic-book colour.',
      'HUES: strong primaries at full strength — fire-engine red, cobalt and royal blue, chrome yellow — supported by deep teal and violet in the shadowsides.',
      'SATURATION: high and unapologetic. This is the loudest palette in the catalogue and it should look it.',
      'CONTRAST: hard and deliberate. Adjacent areas jump in both hue and value, so a figure reads instantly against whatever is behind it.',
      'FILLS: flat colour with a single hard-edged lighter shape for a highlight and a single deeper shape for the turn — cut cleanly, never airbrushed.',
      'SKIN: warm and simplified, one tone plus one highlight.',
      'No muddy mixes, no dusty neutrals, no washed-out pastels anywhere.',
    ].join(' '),
    complexity: 'high',
    sample: '/styles/superhero-comic.png',
    sampleColoured: '/styles/superhero-comic-colour.png',
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
    ].join(' '),
    coloringCaveat:
      'Build volume from the contour lines alone \u2014 no hatching, no parallel line-shading, no shadow tone of any kind.',
    palette: [
      'Restrained watercolour washes laid over the fine line.',
      'HUES: muted and slightly greyed — sage, dusty rose, ochre, faded indigo, warm stone.',
      'SATURATION: low. The colour tints the drawing rather than filling it.',
      'APPLICATION: thin transparent washes that pool a little darker where they meet an outline and fade toward the middle of a shape. Edges may stay soft and slightly irregular, as real washes do.',
      'NEGATIVE SPACE: generous areas of untouched paper are part of the design — do not colour everything.',
      'The fine line remains the drawing; the colour never thickens or obscures it.',
    ].join(' '),
    complexity: 'high',
    sample: '/styles/fine-line.png',
    sampleColoured: '/styles/fine-line-colour.png',
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
    ].join(' '),
    coloringCaveat:
      'This style is normally cel-shaded; here leave every shape open and unshaded \u2014 no blocks of flat shadow, no cast shadows on the ground.',
    palette: [
      'Flat cel-animation colour, in the register of 90s adventure animation.',
      'HUES: warm and natural — sunlit greens, earth browns, clear sky blues — with each character given one or two signature colours that stay theirs for the whole book.',
      'SATURATION: confident mid-range. Fuller than pastel, well short of comic-book primaries.',
      'FILLS: flat areas of colour with one darker tone of the same hue for the shadow side, cut as a clean shape the way cels were painted.',
      'DEPTH: the layered staging is carried by colour — backgrounds sit lighter, cooler and less saturated than the foreground, so the characters come forward without a heavier outline.',
    ].join(' '),
    complexity: 'medium',
    sample: '/styles/cartoon.png',
    sampleColoured: '/styles/cartoon-colour.png',
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

/**
 * Every book is twelve illustrated pages.
 *
 * It used to be a choice of 12, 20 or 32, and the choice cost more than it
 * gave. Length is the multiplier on everything that can go wrong: a story
 * written in one pass holds together over twelve pages and drifts over
 * thirty-two, and a book that drifts is only discovered after it has been
 * paid for. Twelve also keeps a book near US$0.70 of images, which is what
 * makes it cheap to throw one away and start again.
 *
 * A multiple of four, which is what a printer wants for a folded signature.
 */
export const BOOK_PAGES = 12

/**
 * Words on one page of a twelve-page book.
 *
 * Taken off the page rather than guessed. The narration sits in a 321pt
 * column under the drawing, in 13pt italic, in a band that holds four lines —
 * measured, that is 40 words of average Portuguese. Thirty-five is that
 * ceiling with a line of margin, so a page carrying a spoken line (which
 * takes a whole line however short it is) still sets at full size instead of
 * shrinking. Fifteen at the bottom because below that a page stops being a
 * sentence and becomes a caption.
 */
export const BOOK_PAGE_WORDS = { min: 15, max: 35 }

/**
 * How many illustrated pages a book carries.
 *
 * A reading book is sixteen because that is its unit: sixteen spreads, each a
 * picture facing its words. The other two are twelve, which is a multiple of
 * four — what a printer wants for a folded signature.
 */
export function pagesFor(finish: BookFinish): number {
  return finish === 'reading' ? READING_PAGES : BOOK_PAGES
}

export const READING_PAGES = 16

/**
 * What a page of a reading book holds, and what the story has to be, for each
 * of the three ages it can be ordered for.
 *
 * The word counts are the trade's own: a picture book for the youngest runs
 * to a few hundred words in total and one or two sentences a spread, while a
 * book for a nine-year-old carries a paragraph and can hold a subplot. What
 * changes with them is not only length — it is how much is left unsaid, how
 * long a question may stay open, and whether a chapter may end unresolved.
 */
export interface AgeBandDef {
  id: AgeBandId
  years: string
  /** Words on one right-hand page. The writer is held to this. */
  words: { min: number; max: number }
  /** What the story may do at this age, in the writer's own terms. */
  prompt: string
}

/**
 * What a book may do at each age.
 *
 * Written as mechanisms, never as names. Asking a model to write "like" an
 * author produces pastiche of that author's protected work; describing what
 * the technique does produces the technique, and it can be marked. Same rule
 * as the rubric in story-review.ts.
 *
 * The three are different crafts rather than one craft in three sizes, which
 * is the part every competitor gets wrong: they personalise the name and the
 * face and then hand a four-year-old and a ten-year-old the same sentences.
 *
 * Where these came from, so the next person can argue with them:
 *
 *   Rule of three, setup-setup-payoff, escalation
 *     emmawaltonhamilton.com/blog/the-rule-of-3-in-picture-books-when-why-how-to-use-it
 *     picturebookden.blogspot.com/2014/02/the-wonderful-rule-of-3.html
 *   Proactive protagonist, no preaching, spread-by-spread stakes
 *     kidlit.com/picture-book-structure
 *   Page turn: question on the right, payoff after the turn
 *     made.live/mastering-page-turns-picture-books
 *     laurasassitales.wordpress.com/2021/04/05
 *   Chapter-book sentence length, single POV, no subplots
 *     karencioffiwritingforchildren.com/2020/10/18/chapter-book-guidelines
 *   Middle grade: the child owns the conflict AND resolves it; adults are
 *   sidelined but must be rounded rather than 2D
 *     nelsonagency.com/2019/01/the-most-common-pitfalls-in-middle-grade-manuscripts
 *     nathanbransford.com/blog/2021/04/how-to-write-adult-characters-in-childrens-books
 *     madeleinemilburn.co.uk/news/new-deals/writing-middle-grade-fiction
 */
export const AGE_BANDS_CATALOG: AgeBandDef[] = [
  {
    id: 'little',
    years: '3–5',
    words: { min: 20, max: 40 },
    prompt: [
      'READ ALOUD, ON SOMEBODY\'S LAP, TO A CHILD WHO CANNOT READ YET. It is heard before it is seen and it will be heard again tomorrow night, so build it to be anticipated rather than discovered.',
      'THREE, AND THE THIRD IS DIFFERENT. The middle of the book is three of something — three tries, three places, three people asked. The first two set the expectation and the third pays it off, bigger or funnier or simply not what the pattern promised. Two is not a pattern; four is a queue. Each of the three must raise the stakes on the one before, or the reader stops worrying.',
      'A REFRAIN THEY CAN JOIN IN ON. One short phrase or gesture, back with each of the three, one word different each time. By the third the child says it before you do. On the last page it returns changed for good.',
      'THE PAGE TURN IS THE JOKE. End a page on the question and let the next one answer it. This is the one place a sentence may break in half — an ellipsis or a dash carrying it over the turn — and it must finish on the next page. Everywhere else, finish the sentence.',
      'SOUND FIRST. It has to survive being said out loud by a tired adult at the end of a long day. Short declarative sentences. Physical verbs a child can do with their own body — stamp, squeeze, tiptoe, shove. Concrete nouns they can put a finger on. No abstract noun anywhere: not courage, not loneliness, not adventure. At this age a feeling is a thing somebody does.',
      'SMALL VOCABULARY, USED AGAIN ON PURPOSE. Reuse your own words. Anticipation, not variety, is what a three-year-old is reading for.',
      'THE CHILD SOLVES IT. Whatever goes wrong is put right by the child in the book, not by a grown-up arriving. One visible event a page. And the picture may quietly know something the words do not say — a child who cannot read spotting what the narrator has not mentioned is the best joke this format has.',
      'NOTHING LEFT HANGING, AND NOTHING PREACHED. No question stays open across more than two pages: at this age an unresolved worry is not suspense, it is a child who will not go to sleep. The surprise is a delight, never a twist. The ending is physical — home, a light on, something warm, somebody\'s lap — and it never explains what the book was about.',
    ].join(' '),
  },
  {
    id: 'middle',
    years: '6–8',
    words: { min: 50, max: 85 },
    prompt: [
      'FOR A CHILD OF SIX TO EIGHT WHO IS BEGINNING TO READ IT ALONE, and who will be proud of having finished it. Sentences of roughly twelve to twenty words, varied deliberately, with the occasional deliberate fragment for emphasis — "No way." Three to five sentences a page.',
      'ONE STORY, ONE HEAD. No subplot and no second point of view. A reader at this age is spending most of their effort on the words themselves, and a second thread is what makes them lose the first.',
      'LET THEM TALK. Dialogue is the fastest thing on the page here and the part that gets reread. Character arrives through it: who somebody is shows in what they say, and more in what they will not say. Two friends disagreeing about something small is a whole chapter at six.',
      'THE THING SOMEBODY HAS GOT WRONG. Give a character a wrong idea and let them keep it for several pages while the reader sees it plainly. That gap is the beginning of irony, and children of six discover it with enormous pleasure. The misunderstanding is not decoration — it drives the middle of the book and it is the child, not an adult, who resolves it.',
      'SMALL STAKES, TAKEN ENTIRELY SERIOUSLY. A lost button, a promise made too fast, a cake meant for somebody else. The character treats it as enormous and the narrator does not comment. The distance between those two is where both the comedy and the tenderness live.',
      'DO NOT EXPLAIN THE JOKE, and get drier as the feeling gets bigger. Understatement at the emotional moment is what keeps this age from feeling talked down to.',
      'A LITTLE TROUBLE, SURVIVED. They do the thing they were told not to. The consequence is real, and survivable, and nobody stops loving them.',
      'A LIST SOMEWHERE. One page that is a catalogue — what was in the bag, everyone who came, all the names they tried. Children of this age reread lists.',
      'DO NOT DESCRIBE WHAT THE PICTURE ALREADY SHOWS, including what anybody looks like. A question may stay open across several pages, and should.',
    ].join(' '),
  },
  {
    id: 'big',
    years: '9–12',
    words: { min: 100, max: 150 },
    prompt: [
      'FOR A CHILD OF NINE TO TWELVE READING ALONE, IN BED, PAST THE TIME THEY WERE MEANT TO STOP. A full paragraph a page and a narrator who trusts them completely.',
      'THE CONFLICT IS THEIRS AND SO IS THE SOLUTION. The child holds the central problem of this book and the child is the one who resolves it. The commonest failure at this age is an adult quietly taking the story over.',
      'ADULTS ON THE SIDELINES, BUT REAL PEOPLE. Do not kill the parents off or send them away to clear the stage — that is the oldest cliché on this shelf. Keep them present, specific and rounded, and give at least one of them a life of their own that has nothing to do with the child. An adult entirely on the child\'s side who listens and still cannot fix the thing is worth more here than any rescue.',
      'NEVER STATE A FEELING. At this age being told what to feel is exactly what makes a book babyish. Emotion arrives through what somebody does, what they say instead of the true thing, and what their body is doing while they say it. Interiority is wanted — what they thought, what they decided not to say — but the conclusion belongs to the reader.',
      'NO RUN-ONS, NO SCENERY FOR ITS OWN SAKE. Sentences may take a subordinate clause and no more. A paragraph of description with nothing happening in it is where this reader puts the book down. Detail earns its place by being noticed by somebody, for a reason.',
      'TWO THREADS. Plant a second thing early that looks incidental — a habit, an object, a remark made in passing — and let it turn out to be what matters at the end.',
      'WRONG FOR A WHILE. The character may believe something untrue for a long stretch and find out, with the reader suspecting it first.',
      'THE STRANGE, RENDERED PLAINLY. Whatever is extraordinary here is described in precise ordinary terms: its weight, its temperature, what it did to the grass, how it sounded in a closed room. Matter-of-fact description is what makes the impossible land at this age; adjectives are what make it silly.',
      'A COST. Something is given up, not only gained. Small — this is a present — but real, and not quietly undone on the last page. Specific hours and specific weather: a page should know what time of day it is. A page may end unresolved, and should.',
    ].join(' '),
  },
]

export function getAgeBand(id: AgeBandId | undefined): AgeBandDef {
  const found = AGE_BANDS_CATALOG.find((b) => b.id === id)
  // A missing band means a book that never asked, so the middle one is the
  // honest default: wrong for nobody by much.
  return found ?? AGE_BANDS_CATALOG[1]
}

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

export function getBookLanguage(id: BookLanguageId): BookLanguageDef {
  const found = BOOK_LANGUAGES.find((b) => b.id === id)
  if (!found) throw new Error(`Unknown book language: ${id}`)
  return found
}

