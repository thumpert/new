import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import * as z from 'zod'
import { fetchBinary } from '../storage'
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

Report only defects that are actually visible. Look for these, in order:

1. ANATOMY. Do this one by counting rather than by impression, because it is the defect most easily missed and the one that ruins a page.

   Take each person and animal in turn. Count the arms you can see, then the hands, then the legs. Follow every arm from its hand back to the shoulder it belongs to, and every hand back along its arm to a body. Then ask: is there a hand or an arm here that does not lead back to anybody? Is there a limb more than there should be? Is a limb attached where it could not be?

   A hand resting on someone's shoulder with no arm and no figure behind it is the exact failure to look for. So is a third arm on a figure that already has two. Say so plainly when you find one.

2. FLOATING OBJECTS. Anything hovering in the air that nobody is holding and that is not resting on a surface — shoes, cups, toys sitting in empty space.

3. INVENTED CONTENT. Maps, diagrams, charts, screens, signage, logos, or text of any kind: letters, numbers, words, captions, watermarks. None of these belong on the page. Also flag extra people or animals that the scene did not ask for.

4. FRAMES. A drawn border, box, panel outline or empty rectangle around or inside the picture.

5. THE SCENE. Anything the description clearly asked for that is missing, or something clearly contradicting it.

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

/** The same check against bytes already in hand, so it can be run offline. */
export async function reviewImageBytes(
  bytes: Buffer,
  opts: { sceneDescription: string; finish: BookFinish; device?: string },
): Promise<PageReview> {

  const colourRule =
    opts.finish === 'coloring'
      ? opts.device
        ? `6. COLOUR. This is a coloring book page: it must be black line art on white, with exactly one exception — ${opts.device} — which is drawn in its own flat colour. Flag any other coloured area, however small: tinted eyes, a shaded cheek and a coloured leaf are all defects here. Flag grey shading and filled black areas too.`
        : '6. COLOUR. This is a coloring book page: it must be pure black line art on white, with no colour anywhere, no grey shading and no filled black areas. Flag any of those.'
      : '6. COLOUR. This is a finished colour page. Flag any area left blank or unpainted as though waiting to be coloured in.'

  const response = await getClient().messages.parse({
    model: REVIEW_MODEL,
    max_tokens: 2000,
    system: `${SYSTEM}\n\n${colourRule}`,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: bytes[0] === 0x89 ? 'image/png' : 'image/jpeg',
              data: bytes.toString('base64'),
            },
          },
          {
            type: 'text',
            text: `This page was drawn to show: ${opts.sceneDescription}\n\nList the defects you can actually see.`,
          },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(ReviewSchema) },
  })

  return { problems: response.parsed_output?.problems ?? [] }
}
