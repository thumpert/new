import { getAgeBand, READING_PAGES } from '../catalog'
import type { AgeBandId, BookBrief } from '../types'

/**
 * What makes a reading book different from the other two, in one place.
 *
 * The colouring and colour books are objects to look at: twelve pictures with
 * a line under each. A reading book is a story that happens to have pictures,
 * and it is read aloud at bedtime — sixteen times a picture on the left and
 * the words alone on the right, so the reader's eye has somewhere to rest
 * while the listener's stays on the picture.
 *
 * Two things here are not in the other books:
 *
 * THE SHAPE. Sixteen spreads is enough to carry a real arc, and for a long
 * time all three ages were given the same one — the hero's journey, which is
 * a summary of adult myth rather than a description of what children's books
 * actually do. So each age now gets the shape its own shelf uses: a
 * three-year-old's book is a pattern of three, broken once, returning to the
 * room it started in; a six-year-old's is somebody wrong about something,
 * finding out, in front of a reader who saw it first; a ten-year-old's is a
 * secret kept, what keeping it costs, and who is still there afterwards.
 * The stages are given as what happens on the page rather than as names,
 * because a writer told to "write the Refusal of the Call" writes a beat, and
 * a writer told what happens on page four writes a page.
 *
 * THE AGE. Every competitor personalises the name and the face and then hands
 * a four-year-old and a ten-year-old the same sentences. The age band decides
 * the word count, and the shape, and what the prose is allowed to do — three
 * different crafts rather than one craft in three sizes.
 */

/**
 * The sixteen spreads, as a shape rather than a vocabulary — one shape per age.
 *
 * Deliberately written as what happens on the page. Naming the stages invites
 * the model to write about the structure — "and so began her journey" — which
 * is the sound of a story explaining itself instead of happening.
 *
 * There are three of these because the shelf has three, and none of them is
 * the hero's journey — that outline describes adult myth, and running a
 * picture book through it is how a book for a four-year-old ends up with a
 * Refusal of the Call in it. What is here instead is what each shelf actually
 * does: the pattern of three at 3–5, the misunderstanding at 6–8, the kept
 * secret and its cost at 9–12.
 */
const SHAPES: Record<AgeBandId, readonly string[]> = {
  little: [
    '1–2   HOME, AND THE ONE THING THIS CHILD ALWAYS DOES. The ordinary world and the habit inside it — the whole book will bend that habit. End page 2 on something noticed that nobody explains.',
    '3     WHAT GOES WRONG, AND WHAT THEY WANT. Small, visible, and entirely theirs to fix. Say it in one sentence a three-year-old could repeat back.',
    '4     THE REFRAIN IS BORN. The phrase or gesture is said for the first time, in the ordinary way, before it means anything at all.',
    '5–6   THE FIRST TRY. They do something about it themselves. It does not work. Set the pattern plainly, and end page 6 on the refrain.',
    '7–8   THE SECOND TRY. Same shape, bigger, funnier, and it fails worse. The child now knows what is coming and is waiting for it — do not vary the shape, vary the size.',
    '9–10  THE LOW BIT. It looks like it cannot be done, and somebody is cross or sorry. Two pages, no more, and no grown-up arrives to mend it.',
    '11–12 THE THIRD TRY, WHICH IS NOT LIKE THE OTHERS. The pattern breaks and this time it works — because of the thing established on page 1. This is the surprise the whole book has been building, and it is a delight rather than a shock.',
    '13    THE REFRAIN, CHANGED. The same words with one of them different, and that difference is the story.',
    '14    TURNING FOR HOME, carrying whatever they now have.',
    '15    HOME. The same place as page 1, drawn from the same angle. A light on, something warm, somebody who waited.',
    '16    THE LAST PAGE. Very short. The refrain one last time, and the child this book was made for, by name. Then it stops — no lesson, no moral, nothing explained.',
  ],
  middle: [
    '1–2   HOME, AND WHAT THIS CHILD IS LIKE. Show it by what they say and by what they will not say. End page 2 on somebody deciding something out loud.',
    '3     THE PLAN. What they have decided to do, stated plainly enough that the reader can watch it go wrong.',
    '4     THE WRONG IDEA. Somebody gets something wrong, and the reader can see it. Nobody in the book corrects it. This is the engine of the middle and it must be planted here.',
    '5–6   THE FIRST TRY, which half works. Enough success to keep going, enough failure to need the rest of the book.',
    '7     THE THING SAID THAT WAS NOT MEANT. A page carried almost entirely by dialogue. Somebody goes too far, or too honest, and it cannot be unsaid.',
    '8–9   THE TROUBLE. They do the thing they were told not to do. Give it its own page and do not soften it.',
    '10    THE CONSEQUENCE — real, survivable, and nobody stops loving them.',
    '11    THE LIST. One page that is a catalogue: what was in the bag, everyone who came, all the names they tried. Let it be funny and let it be long.',
    '12    THE PENNY DROPS. The wrong idea from page 4 is corrected — by the child working it out, never by an adult explaining it — and the correction changes what they want.',
    '13    PUTTING IT RIGHT, which costs them something they would rather have kept.',
    '14    THE SECOND TRY, which works — and works only because of what they now know.',
    '15    HOME, AND SOMEBODY NOTICES they are different. The narrator does not say how.',
    '16    THE LAST PAGE. Warm, dry, short, and addressed to the child this book was made for. No lesson stated.',
  ],
  big: [
    '1–2   THE ORDINARY, AND THE THING THIS CHILD DOES THAT NOBODY NOTICES. A specific hour, specific weather, a house with habits in it. End page 2 on something out of place that is not explained.',
    '3     WHAT THEY FIND OUT. Something is discovered, or overheard, or worked out — something the adults do not know they know. Describe it plainly and physically: its weight, its temperature, the sound it made.',
    '4     THE DECISION NOT TO TELL. And the reason, which must be sympathetic rather than naughty — telling would cost somebody something. The whole book runs on this decision.',
    '5     THE ONE THEY LET IN. They bring in exactly one other person, and that person is usually the other real person in the brief. What they choose not to say even to them matters as much as what they say.',
    '6–7   KEEPING IT. Two pages of what the secret costs day to day — a lie told at the table, something missed, somebody left waiting. Plant the second thread here, as a habit or an object or a remark that looks incidental.',
    '8     THE NEAR MISS. An adult almost finds out. Nothing is confessed, and everything gets harder.',
    '9     WRONG ABOUT SOMEBODY. It becomes clear to the reader — not yet to the child — that they have misjudged a person. Let the reader sit ahead of them for a while.',
    '10    IT GETS AWAY FROM THEM. The secret does damage they did not intend. This is the low point and it is caused by them, not by an enemy.',
    '11    THE TELLING. They tell, or they are found out. Give the actual words. This is the page the book has been walking towards.',
    '12    THE ADULT WHO CANNOT FIX IT. Somebody entirely on their side, who listens, and who does not make it go away — and who has a life of their own that has nothing to do with this child. Do not solve it for them and do not send them away; both are the oldest clichés on this shelf.',
    '13    WHAT THEY GIVE UP. They put it right themselves, and it costs them something they wanted to keep, and it stays gone.',
    '14    THE SECOND THREAD TURNS OUT TO BE THE POINT. The incidental thing from pages 6–7 is what actually resolves it — and rereading, it was always going to.',
    '15    THE SAME PLACE, LATER. The house from page 1, a different hour and different weather. What changed is in what they now do without thinking, and the narrator does not say so.',
    '16    THE LAST PAGE. Quiet, unhurried, and addressed to the person this book was made for. No moral, no summary of what was learned — one image and a stop.',
  ],
}

export function readingBookRules(brief: BookBrief): string {
  const band = getAgeBand(brief.ageBandId)

  return [
    `THIS IS A READING BOOK: ${READING_PAGES} spreads. Every spread is one full-page illustration on the left and the words alone on the right. That has two consequences you must write to.`,
    '',
    'THE PICTURE CARRIES NO WORDS, so "sceneDescription" must be a complete picture in its own right — a child who cannot read yet should be able to follow the whole book from the left-hand pages alone. No signs, no labels, no lettering of any kind in the art.',
    '',
    'THE WORDS ARE ALONE ON THEIR PAGE, which means they are read rather than glanced at, and they cannot lean on the picture. Do not describe what is already drawn. Write what the picture cannot hold: what was thought, what was not said, what happened just before, what is about to.',
    '',
    `WHO IT IS FOR — ${band.years} years. ${band.prompt}`,
    `Each page's narration must be between ${band.words.min} and ${band.words.max} words. This is a real constraint, not a target: a page well outside it is wrong for the child holding the book.`,
    '',
    `THE SHAPE OF THE SIXTEEN, FOR A READER OF ${band.years}. Follow it. It is not the same shape a book for another age would take, and the difference is the point:`,
    ...SHAPES[band.id],
    '',
    'HOW A PAGE OF THIS BOOK IS BUILT. These pages are paragraphs, not captions, and a paragraph that does not travel is the fault this format punishes hardest. Build each page as a small movement: where we are and what is happening, then the thing that changes it, then where that leaves them. Each sentence follows from the one before — the reader should be able to point at why the second sentence exists. A page whose sentences could be reordered without loss is a page of impressions, and impressions are what make a reader say a story is hard to follow even when nothing in it is complicated.',
    '',
    'SOMEBODY SPEAKS. A story read aloud at bedtime needs voices in it: the adult reading gets to change register, and the child hears a person rather than a narrator. Roughly a third of the spreads carry a line of speech, set alone on its own line with a single em dash — "— Você vem?" — and any attribution after a comma on the same line. Write the breaks as real newline characters in the narration.',
    '',
    'FOUR THINGS THE BOOK MUST HAVE, none of which is optional:',
    'MYSTERY — something is established early that the reader does not understand yet, and wants to. It is answered before the end. A book where nothing is withheld gives the reader no reason to turn.',
    'EMPATHY — at some point the reader knows something the character does not, or wants something for them that they have not asked for. That gap is where feeling for a character comes from.',
    'SURPRISE — one thing the reader could not have predicted, and which on rereading was always going to happen. Not a trick; a turn.',
    'CONTINUITY — every page follows from the last. Something planted grows. A state that changes stays changed. If two pages could trade places, one of them is decoration.',
  ].join('\n')
}
