import type { Dictionary } from './pt'

export const en: Dictionary = {
  meta: {
    name: 'Coloring Book',
    tagline: 'A coloring book made only for someone you love',
  },
  common: {
    next: 'Continue',
    back: 'Back',
    skip: 'Skip',
    finish: 'Finish',
    optional: 'optional',
    loading: 'Loading…',
    generating: 'Generating…',
    error: 'Something went wrong',
    tryAgain: 'Try again',
    step: 'Step',
    of: 'of',
  },
  landing: {
    title: 'A coloring book made only for someone you love',
    subtitle:
      'Tell us your story, pick the drawing style, and get a personalized coloring book printed and delivered to your door.',
    cta: 'Create my book',
    how: 'How it works',
    steps: [
      {
        title: 'Tell the story',
        body: 'Pick the occasion and the characters, then answer a few questions about them.',
      },
      {
        title: 'Pick the idea',
        body: 'We write four possible stories. You choose your favourite.',
      },
      {
        title: 'Get it printed',
        body: 'Every page becomes an A4 illustration, ready to be coloured.',
      },
    ],
  },
  wizard: {
    finish: {
      title: 'What kind of book is this?',
      subtitle: 'This choice shapes everything after it — including how the pictures are drawn.',
    },
    bookLanguage: {
      title: 'What language should the book be in?',
      subtitle: 'The site stays as it is — this is only about the printed book.',
    },
    occasion: {
      title: 'What is the occasion?',
      subtitle: 'This sets the tone and the heart of the story.',
    },
    storyType: {
      title: 'What kind of story do you want?',
      subtitle: 'Choose the shape of the adventure.',
    },
    tone: {
      title: 'What is the narrator’s tone?',
      subtitle: 'This is the voice that tells the story.',
    },
    artStyle: {
      title: 'Which drawing style?',
      subtitle: 'All of them are black and white line art, ready to colour.',
      subtitleColoured:
        'Each style brings its own palette — the comic one is vivid, the kawaii one is pastel.',
    },
    characters: {
      title: 'Who are the characters?',
      subtitle:
        'Add people and pets. A photo helps keep each character consistent across every page.',
      add: 'Add character',
      addPet: 'Add pet',
      remove: 'Remove',
      name: 'Name',
      namePlaceholder: 'What everyone calls them',
      kind: 'Type',
      person: 'Person',
      pet: 'Pet',
      role: 'Role in the story',
      rolePlaceholder: 'e.g. birthday kid, mum, best friend',
      age: 'Age',
      agePlaceholder: 'e.g. 6 years old, newborn',
      appearance: 'What do they look like?',
      appearanceHint:
        'Only what can be seen. This is the one part the illustrator gets.',
      appearancePlaceholder:
        'Shoulder-length curly brown hair, round glasses, denim dungarees and red trainers…',
      personality: 'What are they like?',
      personalityHint: 'This goes to the writer, not to the drawing.',
      personalityPlaceholder:
        'Laughs at everything, never stops talking, scared of thunder, stubborn in the good way…',
      storyNotes: 'Something that has to be in the book',
      storyNotesHint: 'A real moment, a habit, something they always say.',
      storyNotesPlaceholder:
        'Always three steps ahead. Calls everyone "boss". Last Christmas he hid the present and forgot where.',
      photo: 'Reference photos',
      photoHint:
        'Up to 3 sharp, well-lit photos: one front-on, one from the side, one smiling. We only use them to draw the character, once.',
      upload: 'Upload photo',
      addPhoto: 'Add another photo',
      removePhoto: 'Remove photo',
    },
    memories: {
      title: 'Photos to go in the book',
      subtitle:
        'Different from the photos above. These become pages: the photo is redrawn in the style you picked, keeping the whole moment — who is there, doing what.',
      notePlaceholder:
        'What is this moment? e.g. the day Zeca came home and hid under the sofa all afternoon.',
      add: 'Choose the photo',
      addAnother: 'Add another photo',
      remove: 'Remove this photo',
      hint: 'One photo. Write what happened — that is what turns the page into part of the story rather than an insert. One, because the story has to pass through it: with several, the book becomes a route between photographs.',
    },
    place: {
      title: 'Where does the story happen?',
      subtitle: 'A place that means something to you.',
      placeholder: 'e.g. grandma’s house by the lake, with the old wooden porch',
    },
    interview: {
      title: 'Tell us a bit more',
      subtitle:
        'The more real detail, the more the book feels like yours. Skip anything that does not fit.',
      answerPlaceholder: 'Write whatever comes to mind…',
      allQuestions: 'All questions',
      current: 'Current',
      close: 'Close',
      suggestions: 'Suggestions — click to use one, then edit it',
      block: 'Block',
      answered: 'answered',
    },
    title: {
      title: 'What is the book called?',
      subtitle: 'You can change it later, once you pick the story.',
      placeholder: 'e.g. The Great Adventures of Lila',
      suggest: 'Suggestions for this story — click to pick one',
    },
    dedication: {
      title: 'Want to write a dedication?',
      subtitle: 'It gets printed on the first page.',
      placeholder: 'For Lila, who turns any backyard into a jungle.',
    },
    ideas: {
      title: 'Choose the story',
      subtitle: 'We wrote four possibilities from what you told us.',
      choose: 'Choose this one',
      chosen: 'Chosen',
      regenerate: 'Generate other ideas',
      highlights: 'What happens',
      device: 'What runs through it:',
      turn: 'What changes partway:',
    },
    review: {
      title: 'All good?',
      subtitle: 'Have a look before we draw the illustrations.',
      generate: 'Generate my book',
    },
  },
  progress: {
    title: 'Drawing your book',
    subtitle: 'This takes a few minutes. Feel free to keep this page open.',
    writing: 'Writing the story…',
    characters: 'Drawing the characters…',
    pages: 'Illustrating the pages',
    done: 'Your book is ready!',
    download: 'Download PDF',
    preview: 'See preview',
    page: 'Page',
    regenerate: 'Redraw this page',
    regenerating: 'Redrawing…',
    regenerateHint:
      'The characters stay the same — only this scene is drawn again.',
    storyReady: 'Read the story before we draw it',
    storyTitle: 'Here is the story',
    storyHint: 'Nothing has been drawn yet. Read it properly: if it is not right, ask for another one — text costs almost nothing, drawings do.',
    approveStory: 'This one is good, draw it',
    rewriteStory: 'Write a different story',
    approvingStory: 'Starting…',
    rewritingStory: 'Writing…',
    covers: 'Drawing the covers…',
    coverReady: 'Choose a cover to carry on',
    chooseCoverTitle: 'Which one is the cover?',
    chooseCoverHint:
      'Both are in colour, in the style you picked. The book is only drawn once you have chosen.',
    chooseThis: 'Choose this one',
    choosingCover: 'Choosing…',
    coverFailed: 'This cover could not be drawn.',
    coverKinds: {
      portrait: {
        label: 'Portrait',
        description:
          'The characters together, large, looking straight at whoever opens the present.',
      },
      scene: {
        label: 'Scene',
        description:
          'A wide moment from the story, with the characters inside their world.',
      },
    },
  },
  reader: {
    previous: 'Back',
    next: 'Next',
    counter: '{n} of {total}',
    download: 'Download the PDF',
    notReady: 'This book is still being drawn.',
    seeProgress: 'See how it is going',
    open: 'Read it here',
  },
  finishes: {
    coloring: {
      label: 'Coloring book',
      description:
        'Black line art on white, to fill in with pencils and crayons. The cover comes in colour.',
    },
    coloured: {
      label: 'Illustrated colour book',
      description:
        'The pages arrive already painted, ready to read. Each style has its own palette — the comic one is vivid, the kawaii one is pastel.',
    },
  },
  bookLanguages: {
    pt: {
      label: 'Portuguese',
      description: 'The whole story in Portuguese.',
    },
    en: {
      label: 'English',
      description: 'The whole story in English, no translation.',
    },
    'en-pt': {
      label: 'English with Portuguese support',
      description:
        'Narration in English with the translation smaller underneath — for someone learning.',
    },
  },
  occasions: {
    child: {
      label: 'Gift for a child',
      description: 'A story about who this child really is.',
    },
    'new-baby': {
      label: 'New baby',
      description: 'The arrival the whole family was waiting for.',
    },
    birthday: {
      label: 'Birthday',
      description: 'A celebration of the year that just passed.',
    },
    relationship: {
      label: 'Relationship',
      description: 'The story of you two, from the beginning until now.',
    },
    pet: {
      label: 'Pet',
      description: 'A tribute to the biggest troublemaker in the house.',
    },
  },
  storyTypes: {
    adventure: { label: 'Adventure', description: 'A quest, an obstacle and the way back home.' },
    'everyday-magic': {
      label: 'Everyday magic',
      description: 'An ordinary day where something magical happens.',
    },
    'fairy-tale': { label: 'Fairy tale', description: 'Castles, forests and a gentle moral.' },
    journey: { label: 'Timeline', description: 'A trip through the moments that brought you here.' },
    superhero: { label: 'Superhero', description: 'Powers born from who they really are.' },
    funny: { label: 'Comedy', description: 'Everything goes wrong in the funniest way.' },
  },
  tones: {
    warm: {
      label: 'Warm',
      description:
        'A conversation between two: one measures love with open arms, the other tries to outdo it.',
      example:
        '“Zeca, do you know how much I love it here?”\nZeca did not know.\nLila opened her arms until her shoulders ached.\n“This much. And there is still some left over.”',
    },
    playful: {
      label: 'Playful',
      description:
        'Short sentences, stacked up, and the joke is who someone is — not what happens.',
      example:
        'Lila is like this: she arrives, she shoves the gate, and the whole garden knows about it.\nZeca is even more like that.\nZeca gets there first.',
    },
    poetic: {
      label: 'Poetic',
      description:
        'Short lines, one image a page. It rhymes only when the rhyme turns up on its own.',
      example:
        'The gate swung open, unhurried.\nThe afternoon came in, and stayed.\nZeca ran on ahead\nlike someone who already knew.',
    },
    epic: {
      label: 'Epic',
      description:
        'Live commentary, from a narrator losing all composure over almost nothing.',
      example:
        'She approaches the gate… she pushes… IT IS OPEN!\nThe garden is open, ladies and gentlemen!\nAnd look at Zeca! Zeca is already through!',
    },
    serene: {
      label: 'Serene',
      description:
        'Hardly anyone speaks. The narrator notices one thing at a time, and each gesture brings the earlier afternoons with it.',
      example:
        'The gate kept the creak of every afternoon that came before it.\nLila went in, and with her went all the other times she had gone in.\nZeca walked ahead, like someone who knows the way by heart.',
    },
  },
  artStyles: {
    chibi: {
      label: 'Chibi',
      description: 'Big round heads, huge eyes, everything cute. The easiest to colour.',
      descriptionColoured:
        'Big round heads, huge eyes, everything cute. Painted in soft pastels.',
    },
    'coloring-book': {
      label: 'Coloring book',
      description: 'Fine lines packed with leaves, flowers and hidden little animals. To colour slowly.',
      descriptionColoured:
        'Packed with leaves, flowers and hidden little animals, painted in jewel tones.',
    },
    'superhero-comic': {
      label: 'Superhero comic',
      description: 'Action poses, dramatic angles and heroic anatomy, like a comic book.',
      descriptionColoured:
        'Action poses and dramatic angles, in strong, vivid comic-book colour.',
    },
    'fine-line': {
      label: 'Modern and elegant',
      description: 'Very fine, delicate line work, like a magazine illustration.',
      descriptionColoured:
        'Very fine line work with soft washes, like a magazine illustration.',
    },
    cartoon: {
      label: 'Cartoon',
      description: 'A 90s animated show, with scenery staged in layers.',
      descriptionColoured:
        'A 90s animated show, in flat colour with scenery staged in layers.',
    },
  },
}
