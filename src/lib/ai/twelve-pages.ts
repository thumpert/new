import { BOOK_PAGE_WORDS, getOccasion } from '../catalog'
import type { BookBrief } from '../types'

/**
 * The shape of the twelve-page book — the colouring book and the coloured one.
 *
 * These had one line of structure between them: "pages 1-3 set up who these
 * people are; 4-6 the world opens and the story goes somewhere; 7-9 the
 * wobble; 10-12 the way back". Next to the sixteen numbered instructions the
 * reading book gets, that is not a shape, it is a wish — "the story goes
 * somewhere" does not tell anybody what happens on page five. Books came back
 * with twelve pages that each read well and did not add up, which is what a
 * customer calls confusing.
 *
 * So it is written out page by page, and built on three things that are about
 * clarity rather than about art:
 *
 * THE STORY SPINE (Kenn Adams, 1991 — the one Pixar spread). Once upon a
 * time / every day / but one day / because of that, because of that, because
 * of that / until finally / ever since then. Eight sentences that fit twelve
 * pages almost exactly, and the three "because of that" beats are the part
 * that matters: they are causal by construction, so a writer following them
 * cannot produce a list.
 *   https://improvencyclopedia.org/games/Story_Spine.html
 *   https://www.aerogrammestudio.com/2013/03/22/the-story-spine-pixars-4th-rule-of-storytelling/
 *
 * BUT / THEREFORE, NEVER AND THEN (Trey Parker and Matt Stone). Put a word
 * between each pair of beats. If the only word that fits is "and then", the
 * story is a sequence rather than a story. This is the single cheapest test
 * for the fault being complained about, and it can be applied mechanically.
 *   https://speakola.com/arts/matt-stone-trey-parker-nyu-writing-class-2014
 *
 * ORIENT BEFORE YOU COMPLICATE (Labov and Waletzky's narrative schema, 1967:
 * orientation, complicating action, evaluation, resolution, coda). Who, where
 * and when come before anything is allowed to change. A reader who does not
 * yet know where they are cannot follow what just moved — and in a
 * personalized book, where every name is a stranger to the reader on page
 * one, that is the commonest way the thread is lost.
 *   https://www.ukessays.com/essays/english-language/labovs-model-narrative-analysis-2563.php
 *
 * The turn on page 7 is a re-framing rather than a battle, which is the
 * kishōtenketsu move: a four-act shape whose third act turns the story by
 * showing something in a new light instead of by conflict. These books are
 * presents — a couple, a pet, a new baby — and most of them have no
 * antagonist to give them a climax.
 *   https://mythicscribes.com/plot/kishotenketsu/
 */

/** What happens on each of the twelve pages, as pages rather than as acts. */
const SPINE = [
  '1   ONCE UPON A TIME. Who these people are and where they are. Name every one of them on this page, and give each a single concrete detail taken from what the customer told us. Nothing has happened yet and nothing needs to.',
  '2   EVERY DAY, AND WHAT IS MISSING FROM IT. The thing they always do — the routine, the running joke, the ritual — and, inside it, the small thing somebody wants and does not have. The routine makes the rest of the book legible; the want is what makes anybody care which way it goes. A page that establishes only the routine has built a clock and forgotten to wind it.',
  '3   THE GUIDE OBJECT, ALREADY IN USE. The object that runs through the book appears inside the ordinary routine, doing something useful and unremarkable. Introduced here, it can carry meaning later; introduced later, it is a prop that arrived to be symbolic.',
  '4   BUT ONE DAY. One thing changes, on this page, and it is visible. This is the only page where something may arrive from outside the story. Everything from here on is caused by it.',
  '5   BECAUSE OF THAT. The first consequence, and it moves them measurably closer to or further from what page 2 said they wanted. It must be caused by page 4 and not merely happen after it: if page 5 would still make sense with page 4 removed, it is the wrong page.',
  '6   BECAUSE OF THAT. The second consequence, larger, and it closes an option. Something that was possible on page 5 is not possible any more.',
  '7   THE TURN. The thing the chosen idea promised. Not a fight and not a disaster — something is seen differently, and the reader understands the last six pages in a new way. Everything after this page must read differently because of it. It cannot be moved to the end: a turn on the last page has nothing left to change.',
  '8   BECAUSE OF THAT. What the turn costs or opens. The first page that could not have been written before page 7.',
  '9   THE WOBBLE. The small thing that goes wrong, and it is caused by page 8 rather than dropped in. It must threaten the thing wanted on page 2 — a mishap that costs nobody anything is a page of weather. Light, though: this is a present, never a book about danger, illness or loss.',
  '10  PUT RIGHT. One of them fixes it by doing the thing that is most characteristically them, drawn from what the customer actually said about them. Not luck, not a coincidence, not somebody arriving.',
  '11  UNTIL FINALLY. They arrive, and the want from page 2 is answered — met, or exchanged for something better that they could not have named on page 2. The question the book opened is closed here or on 12, never later. The refrain returns, changed.',
  '12  EVER SINCE THEN. The coda. Time steps forward, the refrain returns changed, and the page is addressed to the person this book was made for. No moral, no summary of what it all meant.',
] as const

export function twelvePageRules(brief: BookBrief): string {
  const occasion = getOccasion(brief.occasionId)

  return [
    `EACH PAGE CARRIES ${BOOK_PAGE_WORDS.min}–${BOOK_PAGE_WORDS.max} WORDS. This is measured, not a preference: the words are printed in a narrow column under the drawing, and a band that holds four lines holds forty words. A page over the ceiling is set smaller to fit, which is worse to read; a page under the floor has become a caption. It is checked by counting.`,
    '',
    'THIS IS A TWELVE-PAGE BOOK: one full-page illustration each, with one or two sentences printed underneath. Twelve pages is not enough room for a plot with parts. It is enough for one thing to change and for that change to be followed all the way through, which is what the shape below is for.',
    '',
    `WHAT THIS BOOK IS FOR: ${occasion.storyAngle}`,
    '',
    'THE TWELVE PAGES. Follow them in order. Each line says what happens on that page:',
    ...SPINE,
    '',
    'THREE THINGS THAT MAKE IT WORTH READING TWICE. The shape above makes a book followable. On its own it also makes a book that is merely correct — twelve pages that click together and grip nobody. These three are what the reading book has always been held to and this one never was, and they are the difference between a story and a mechanism:',
    '',
    'SOMEBODY WANTS SOMETHING. Name it on page 2, keep it small and concrete — to be listened to all the way through, to not be left behind, to be asked first for once — and let every page after move them nearer to it or further from it. Causality without desire is a clock ticking. The reader follows a story because somebody might not get what they want, and for no other reason.',
    '',
    'A QUESTION THE READER CARRIES. Something is established in the first three pages that the reader does not understand yet and wants to: an object nobody explains, a habit with no reason given, a thing somebody says and does not finish. It is answered on page 11 or 12 and not before. A book that withholds nothing gives nobody a reason to turn over — and this is different from being unclear, which is the opposite fault. The reader must always know what is happening and still be wondering what it will come to.',
    '',
    'THE READER GETS THERE FIRST. At least once, the reader understands something one of the characters has not worked out yet — usually about the other person. That gap is where feeling for somebody on a page comes from; without it the reader watches instead of caring. In a book about people who know each other well, the easiest version is true and cheap: one of them has already noticed what the other is about to discover.',
    '',
    'THE TEST THAT MATTERS MORE THAN ANY OF THE ABOVE. Read your twelve pages in order and put a word between each pair: "but", "therefore", or "and then". If "and then" is the only word that fits between two pages, one of them is decoration and the book has become a list of nice moments. Every join must be "but" or "therefore". Do this before you hand the storyboard over, and fix the joins that fail rather than explaining them.',
    '',
    'ORIENT BEFORE YOU COMPLICATE. Pages 1 to 3 answer who, where and when, and nothing may change until they have. Every person is named on the page they first act on, and named again — not "she", not "he" — the first time they act after somebody else has. In a personalized book every name is a stranger to the reader on page one, and an unattached pronoun is the commonest way the thread is lost.',
    '',
    'ONE NEW THING A PAGE. A page introduces one new person, place or fact — not three. If a page needs two, it is two pages, and something else on your list is decoration that can go.',
    '',
    'IF TIME PASSES, SAY SO IN THE WORDS. "That winter", "by the third try", "the next morning". The illustration cannot show that a week went by, and a reader who thinks two pages are the same afternoon will read the book as nonsense.',
  ].join('\n')
}
