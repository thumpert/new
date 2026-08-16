import { getAgeBand, READING_PAGES } from '../catalog'
import type { BookBrief } from '../types'

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
 * THE SHAPE. Sixteen spreads is enough to carry a real arc, so it carries
 * one: the oldest shape there is, a child who leaves the ordinary world,
 * is changed by what happens, and comes home different. The stages are given
 * as page ranges rather than named, because a writer told to "write the
 * Refusal of the Call" writes a beat, and a writer told what happens on page
 * four writes a page.
 *
 * THE AGE. Every competitor personalises the name and the face and then hands
 * a four-year-old and a ten-year-old the same sentences. The age band decides
 * the word count, but more than that it decides how much is left unexplained
 * and how long a question may stay open — which is the actual difference
 * between a book for a four-year-old and a book for a ten-year-old.
 */

/**
 * The sixteen spreads, as a shape rather than a vocabulary.
 *
 * Deliberately written as what happens on the page. Naming the stages invites
 * the model to write about the structure — "and so began her journey" — which
 * is the sound of a story explaining itself instead of happening.
 */
const SHAPE = [
  '1–2  HOME, AS IT IS. The ordinary world, drawn precisely enough that we will miss it. Establish the one thing about this child that the whole book will turn on. End page 2 with the first small wrongness — something out of place that nobody has explained yet.',
  '3    THE PULL. Whatever it is that will not let them stay. Not announced: found. Something arrives, opens, goes missing, or speaks.',
  '4    NOT YET. They hesitate, and for a reason the reader can feel — not cowardice, something they would lose. This is the page that makes them a person rather than a protagonist.',
  '5    THE ONE WHO HELPS. Someone or something takes their side. In a personalized book this is very often the other real person in the brief, and it should be.',
  '6    ACROSS. They go. The world changes on this page and the reader should see it change — different light, different ground, different rules.',
  '7–9  WHAT THE WORLD IS LIKE NOW. Three pages of trying: something learned, something got wrong, something befriended. Each must change the situation, so that page 9 cannot be swapped with page 7.',
  '10   THE HARD PART. The thing they were most unwilling to do. Small in scale — this is a present, not a peril — but genuinely difficult for this particular child, and difficult because of what was established on page 1.',
  '11   WHAT THEY GET. Not a prize: an understanding, or a thing that turns out to matter. The mystery opened on page 2 pays off here or on page 12, never later.',
  '12–13 THE WAY BACK. Turning for home, carrying it. Something from the first act returns here, changed — the refrain, the object, the phrase.',
  '14   ONE MORE TIME. A last small test that only works because of what they learned. The reader should recognise it as the page-1 problem wearing different clothes.',
  '15   HOME, AND DIFFERENT. The same place as page 1, drawn from the same angle if possible, and unmistakably not the same to them.',
  '16   THE LAST PAGE. Warm, short, and addressed at the person this book was made for. It closes the refrain and it stops — no moral, no lesson stated.',
] as const

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
    'THE SHAPE OF THE SIXTEEN. Follow it. It is the oldest shape there is because it is the one children already know:',
    ...SHAPE,
    '',
    'FOUR THINGS THE BOOK MUST HAVE, none of which is optional:',
    'MYSTERY — something is established early that the reader does not understand yet, and wants to. It is answered before the end. A book where nothing is withheld gives the reader no reason to turn.',
    'EMPATHY — at some point the reader knows something the character does not, or wants something for them that they have not asked for. That gap is where feeling for a character comes from.',
    'SURPRISE — one thing the reader could not have predicted, and which on rereading was always going to happen. Not a trick; a turn.',
    'CONTINUITY — every page follows from the last. Something planted grows. A state that changes stays changed. If two pages could trade places, one of them is decoration.',
  ].join('\n')
}
