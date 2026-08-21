import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import * as z from 'zod'
import { measurePage, thumbnail } from '../images/measure'
import { fetchBinary } from '../storage'
import { record } from './usage'
import type { BookFinish } from '../types'

/**
 * Looks at a page after it has been drawn and says what is wrong with it.
 *
 * Everything else in this pipeline tries to stop bad pages from being made.
 * This is the only thing that notices one that was. Until now the first
 * reader of every page was the customer, opening the finished PDF — which is
 * how a book shipped with a third arm on one page, a hallucinated bus-route
 * map across two others, and a pair of trainers floating in mid-air.
 *
 * It asks about the failures that actually happened rather than for a general
 * opinion. A model asked "is this good?" says yes; asked "does anyone have a
 * hand with no arm behind it?" it looks.
 *
 * The model is Sonnet rather than something cheaper, and that was measured
 * rather than assumed. Haiku missed the third arm on the page that has one,
 * and on a second run missed a drawn frame it had found on the first — a
 * checker that misses the defect it exists for is worse than none, because it
 * reassures. Sonnet found the extra arm, the floating shoe, the invented map,
 * the frame, and colour leaking into three characters' eyes that a pixel
 * measurement had classified as part of the one permitted colour.
 *
 * It is not a guarantee. It is a net that catches most of what used to reach
 * the customer, and what escapes it is flagged rather than hidden.
 */
const REVIEW_MODEL = 'claude-sonnet-5'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) client = new Anthropic()
  return client
}

const ReviewSchema = z.object({
  problems: z
    .array(z.string())
    .describe(
      'Each real defect, in one short phrase naming what and where. Empty when the page is sound.',
    ),
})

const SYSTEM = `You are checking a single illustrated page of a children's book before it is printed. You will be shown the drawing and told what it was supposed to contain.

You are being asked about two things only: whether the bodies are possible, and whether the scene is coherent. Colour, shading and blank areas are counted separately and are not your concern — do not comment on them.

Report only defects that are actually visible. Look for these, in order:

1. ANATOMY. Do this one by counting rather than by impression, because it is the defect most easily missed and the one that ruins a page.

   Take each person and animal in turn. Count the arms you can see, then the hands, then the legs. Follow every arm from its hand back to the shoulder it belongs to, and every hand back along its arm to a body. Then ask: is there a hand or an arm here that does not lead back to anybody? Is there a limb more than there should be? Is a limb attached where it could not be?

   A hand resting on someone's shoulder with no arm and no figure behind it is the exact failure to look for. So is a third arm on a figure that already has two. Say so plainly when you find one.

2. FLOATING OBJECTS. Anything hovering in the air that nobody is holding and that is not resting on a surface — shoes, cups, toys sitting in empty space.

3. INVENTED CONTENT. Maps, diagrams, charts, screens, signage, logos, or text of any kind: letters, numbers, words, captions, watermarks. None of these belong on the page. Also flag extra people or animals that the scene did not ask for.

4. FRAMES AND LETTERING. A drawn border, box, panel outline or empty rectangle around or inside the picture. Any writing at all: words, numbers, labels, signage, a watermark.

5. SCENE LOGIC. Does the picture hold together as a place? Someone standing on nothing, an object twice the size it could be, a figure behind a wall that is also in front of it, two light sources fighting, a body cut off by scenery that should be behind it. Also: anything the description clearly asked for that is missing.

6. THE SAME PEOPLE AS EVERY OTHER PAGE. You will be given each character's written description, which is the same on every page of the book and is what makes twelve separately drawn pages look like one book.

   Check each named character against their description, garment by garment: the clothes, their colours, the shoes, the hair. Report anything different — a coat that is not in the description, missing shoes, a changed colour. Do not accept a substitution because it suits the scene; the description is the authority and the weather is not.

   Then check that nobody appears twice. The same person drawn side by side with themselves, at two ages, or as a portrait or reflection that reads as a second copy, is a defect however well it is drawn.

   Finally, check the sizes against each other: a small child stays small beside an adult, and two children of the same age stay the same height as each other.

Rules:
- Report what you can see, not what you suspect. If you are unsure, leave it out.
- One short phrase per problem, naming what it is and roughly where: "third arm on the left character's shoulder", "map drawn across the bottom".
- Stylistic opinions are not defects. Do not comment on the drawing being simple, the composition, the mood or the likeness.
- A sound page returns an empty list. Most pages are sound, and saying so is the correct answer.`

export interface PageReview {
  problems: string[]
}

export async function reviewPageImage(opts: {
  imageUrl: string
  sceneDescription: string
  finish: BookFinish
  /** The one object allowed to carry colour in a coloring book. */
  device?: string
}): Promise<PageReview> {
  const bytes = await fetchBinary(opts.imageUrl)
  return reviewImageBytes(bytes, opts)
}

/**
 * Both halves of the check, cheap one first.
 *
 * The measurement is local and free, so it always runs. The vision call is
 * the expensive half and is asked only what pixels cannot answer.
 */
export async function checkPage(
  bytes: Buffer,
  opts: {
    sceneDescription: string
    finish: BookFinish
    device?: string
    cast?: Record<string, string>
  },
): Promise<PageReview> {
  const [measured, seen] = await Promise.all([
    measurePage(bytes, opts.finish),
    reviewImageBytes(bytes, opts),
  ])
  return { problems: [...measured.problems, ...seen.problems] }
}

/** The same check against bytes already in hand, so it can be run offline. */
export async function reviewImageBytes(
  bytes: Buffer,
  opts: {
    sceneDescription: string
    finish: BookFinish
    device?: string
    /** name → the written appearance, so the outfit can be checked here. */
    cast?: Record<string, string>
  },
): Promise<PageReview> {

  // Colour is the one thing the vision model is still asked about, and only
  // in the narrow form counting cannot answer: whether the coloured thing is
  // the right thing. How much colour there is gets measured, not looked at.
  const colourRule = opts.device
    ? `6. THE COLOURED OBJECT. Exactly one thing on this page may carry colour: ${opts.device}. Say so if something else is coloured — a tinted eye and a shaded cheek both count — or if that object is missing from the page altogether.`
    : ''

  // A quarter the width costs a fraction of the tokens, and every defect
  // this is asked about — a spare arm, a floating shoe, a drawn frame —
  // is still plainly there at 700px.
  const small = await thumbnail(bytes)

  const response = await getClient().messages.parse({
    model: REVIEW_MODEL,
    max_tokens: 1500,
    system: colourRule ? `${SYSTEM}\n\n${colourRule}` : SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: small.toString('base64'),
            },
          },
          {
            type: 'text',
            text: [
              `This page was drawn to show: ${opts.sceneDescription}`,
              opts.cast && Object.keys(opts.cast).length
                ? `\nThe people in this book always look like this:\n${Object.entries(opts.cast).map(([n, d]) => `- ${n}: ${d}`).join('\n')}`
                : '',
              '\nList the defects you can actually see.',
            ].filter(Boolean).join('\n'),
          },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(ReviewSchema) },
  })

  record('revisao de imagem', REVIEW_MODEL, response.usage)
  return { problems: response.parsed_output?.problems ?? [] }
}
