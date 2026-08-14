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
    bookLanguage: {
      title: 'What language should the book be in?',
      subtitle: 'The site stays as it is — this is only about the printed book.',
    },
    imageModel: {
      title: 'Which model should draw?',
      subtitle:
        'Under test: both draw the same book, at very different speeds.',
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
    },
    size: {
      title: 'How long should the book be?',
      subtitle: 'Every page is one A4 illustration.',
      pages: 'pages',
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
      traits: 'What are they like?',
      traitsPlaceholder:
        'Looks and personality: curly brown hair, glasses, obsessed with dinosaurs, laughs at everything…',
      photo: 'Reference photos',
      photoHint:
        'Up to 3 sharp, well-lit photos: one front-on, one from the side, one smiling. We only use them to draw the character, once.',
      upload: 'Upload photo',
      addPhoto: 'Add another photo',
      removePhoto: 'Remove photo',
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
  },
  imageModels: {
    'nano-banana': {
      label: 'Nano Banana',
      description:
        'About 40s per page. This is the one we validated character consistency with.',
      meta: '~4 min / 12 pages',
    },
    'gpt-image': {
      label: 'GPT Image',
      description:
        'About 100s per page. Slower, and consistency across pages is still untested.',
      meta: '~10 min / 12 pages',
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
    warm: { label: 'Warm', description: 'Like a bedtime story.' },
    playful: { label: 'Playful', description: 'Full of energy, sounds and jokes.' },
    poetic: { label: 'Poetic', description: 'Gentle rhythm and beautiful imagery.' },
    epic: { label: 'Epic', description: 'A grand narrator for domestic deeds.' },
  },
  artStyles: {
    'classic-cartoon': { label: 'Classic cartoon', description: 'Rounded, expressive characters.' },
    kawaii: { label: 'Kawaii', description: 'Cute, big heads and big eyes.' },
    storybook: { label: 'Picture book', description: 'Ink line work, rich scenery.' },
    'bold-simple': { label: 'Bold and simple', description: 'Simple shapes, great for little kids.' },
    'detailed-doodle': { label: 'Detailed doodle', description: 'Patterns and detail to colour slowly.' },
  },
  bookSizes: {
    short: { label: 'Short', description: 'A quick story, straight to the point.' },
    medium: { label: 'Medium', description: 'The most popular size.' },
    long: { label: 'Long', description: 'Room for a full story.' },
  },
}
