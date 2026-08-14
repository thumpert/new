export const pt = {
  meta: {
    name: 'Livro de Colorir',
    tagline: 'Um livro de colorir feito só para quem você ama',
  },
  common: {
    next: 'Continuar',
    back: 'Voltar',
    skip: 'Pular',
    finish: 'Finalizar',
    optional: 'opcional',
    loading: 'Carregando…',
    generating: 'Gerando…',
    error: 'Algo deu errado',
    tryAgain: 'Tentar de novo',
    step: 'Etapa',
    of: 'de',
  },
  landing: {
    title: 'Um livro de colorir feito só para quem você ama',
    subtitle:
      'Conte a história de vocês, escolha o estilo do desenho e receba um livro de colorir personalizado, impresso e entregue na sua casa.',
    cta: 'Criar meu livro',
    how: 'Como funciona',
    steps: [
      {
        title: 'Conte a história',
        body: 'Escolha a ocasião, os personagens e responda algumas perguntas sobre eles.',
      },
      {
        title: 'Escolha a ideia',
        body: 'A gente escreve quatro histórias possíveis. Você escolhe a sua favorita.',
      },
      {
        title: 'Receba impresso',
        body: 'Cada página vira uma ilustração em A4, pronta para colorir.',
      },
    ],
  },
  wizard: {
    bookLanguage: {
      title: 'Em que idioma será o livro?',
      subtitle:
        'O site continua em português — isso vale só para o livro impresso.',
    },
    imageModel: {
      title: 'Qual modelo vai desenhar?',
      subtitle:
        'Em teste: os dois desenham o mesmo livro, com velocidades bem diferentes.',
    },
    occasion: {
      title: 'Qual é a ocasião?',
      subtitle: 'Isso define o tom e o coração da história.',
    },
    storyType: {
      title: 'Que tipo de história você quer?',
      subtitle: 'Escolha o formato da aventura.',
    },
    tone: {
      title: 'Qual é o tom do narrador?',
      subtitle: 'É a voz que vai contar a história.',
    },
    artStyle: {
      title: 'Qual estilo de desenho?',
      subtitle: 'Todos são em traço preto e branco, prontos para colorir.',
    },
    size: {
      title: 'Qual o tamanho do livro?',
      subtitle: 'Cada página é uma ilustração em A4.',
      pages: 'páginas',
    },
    characters: {
      title: 'Quem são os personagens?',
      subtitle:
        'Adicione pessoas e pets. A foto ajuda a manter o personagem parecido em todas as páginas.',
      add: 'Adicionar personagem',
      addPet: 'Adicionar pet',
      remove: 'Remover',
      name: 'Nome',
      namePlaceholder: 'Como todo mundo chama',
      kind: 'Tipo',
      person: 'Pessoa',
      pet: 'Pet',
      role: 'Papel na história',
      rolePlaceholder: 'Ex.: aniversariante, mãe, melhor amigo',
      age: 'Idade',
      agePlaceholder: 'Ex.: 6 anos, recém-nascido',
      traits: 'Como ele(a) é?',
      traitsPlaceholder:
        'Aparência e jeito: cabelo cacheado castanho, óculos, adora dinossauros, ri de tudo…',
      photo: 'Fotos de referência',
      photoHint:
        'Até 3 fotos nítidas e com boa luz: uma de frente, uma de lado e uma sorrindo. Usamos só para desenhar o personagem, uma única vez.',
      upload: 'Enviar foto',
      addPhoto: 'Mais uma foto',
      removePhoto: 'Remover foto',
    },
    place: {
      title: 'Onde a história acontece?',
      subtitle: 'Um lugar que signifique alguma coisa para vocês.',
      placeholder: 'Ex.: a casa da vovó em Petrópolis, com o quintal cheio de mangueiras',
    },
    interview: {
      title: 'Conte um pouco mais',
      subtitle:
        'Quanto mais detalhes reais, mais o livro parece de vocês. Pode pular o que não fizer sentido.',
      answerPlaceholder: 'Escreva o que vier à cabeça…',
      allQuestions: 'Todas as perguntas',
      current: 'Atual',
      close: 'Fechar',
      suggestions: 'Sugestões — clique para usar e edite depois',
      block: 'Bloco',
      answered: 'respondidas',
    },
    title: {
      title: 'Qual o título do livro?',
      subtitle: 'Pode mudar depois, quando você escolher a história.',
      placeholder: 'Ex.: As Grandes Aventuras da Lila',
      suggest: 'Sugestões para esta história — clique para escolher',
    },
    dedication: {
      title: 'Quer escrever uma dedicatória?',
      subtitle: 'Vai impressa na primeira página.',
      placeholder: 'Para a Lila, que transforma qualquer quintal em floresta.',
    },
    ideas: {
      title: 'Escolha a história',
      subtitle: 'Escrevemos quatro possibilidades a partir do que você contou.',
      choose: 'Escolher esta',
      chosen: 'Escolhida',
      regenerate: 'Gerar outras ideias',
      highlights: 'O que acontece',
    },
    review: {
      title: 'Tudo certo?',
      subtitle: 'Confira antes de gerarmos as ilustrações.',
      generate: 'Gerar meu livro',
    },
  },
  progress: {
    title: 'Desenhando seu livro',
    subtitle: 'Isso leva alguns minutos. Pode deixar esta página aberta.',
    writing: 'Escrevendo a história…',
    characters: 'Desenhando os personagens…',
    pages: 'Ilustrando as páginas',
    done: 'Seu livro está pronto!',
    download: 'Baixar PDF',
    preview: 'Ver prévia',
    page: 'Página',
    regenerate: 'Refazer esta página',
    regenerating: 'Refazendo…',
    regenerateHint:
      'Os personagens continuam iguais — só esta cena é desenhada de novo.',
  },
  imageModels: {
    'nano-banana': {
      label: 'Nano Banana',
      description:
        'Cerca de 40s por página. Foi com ele que validamos a consistência dos personagens.',
      meta: '~4 min / 12 páginas',
    },
    'gpt-image': {
      label: 'GPT Image',
      description:
        'Cerca de 100s por página. Mais lento; a consistência entre páginas ainda não foi testada.',
      meta: '~10 min / 12 páginas',
    },
  },
  bookLanguages: {
    pt: {
      label: 'Português',
      description: 'A história inteira em português.',
    },
    en: {
      label: 'Inglês',
      description: 'A história inteira em inglês, sem tradução.',
    },
    'en-pt': {
      label: 'Inglês com apoio em português',
      description:
        'A narração em inglês e, embaixo e menor, a tradução — para quem está aprendendo.',
    },
  },
  occasions: {
    child: {
      label: 'Presente para o filho(a)',
      description: 'Uma história sobre quem essa criança é.',
    },
    'new-baby': {
      label: 'Novo bebê',
      description: 'A chegada de quem a família estava esperando.',
    },
    birthday: {
      label: 'Aniversário',
      description: 'Uma celebração do ano que passou.',
    },
    relationship: {
      label: 'Relacionamento',
      description: 'A história de vocês dois, do começo até aqui.',
    },
    pet: {
      label: 'Pet',
      description: 'Uma homenagem ao maior bagunceiro da casa.',
    },
  },
  storyTypes: {
    adventure: { label: 'Aventura', description: 'Uma missão, um obstáculo e a volta para casa.' },
    'everyday-magic': {
      label: 'Magia do cotidiano',
      description: 'Um dia comum onde algo mágico acontece.',
    },
    'fairy-tale': { label: 'Conto de fadas', description: 'Castelos, florestas e uma moral gentil.' },
    journey: { label: 'Linha do tempo', description: 'Uma viagem pelos momentos que trouxeram vocês até aqui.' },
    superhero: { label: 'Super-herói', description: 'Poderes que nascem do jeito real de cada um.' },
    funny: { label: 'Comédia', description: 'Tudo dá errado do jeito mais engraçado possível.' },
  },
  tones: {
    warm: { label: 'Afetuoso', description: 'Como uma história antes de dormir.' },
    playful: { label: 'Brincalhão', description: 'Cheio de energia, sons e piadas.' },
    poetic: { label: 'Poético', description: 'Ritmo suave e imagens bonitas.' },
    epic: { label: 'Épico', description: 'Um narrador grandioso para feitos domésticos.' },
  },
  artStyles: {
    'classic-cartoon': { label: 'Cartoon clássico', description: 'Personagens redondos e expressivos.' },
    kawaii: { label: 'Kawaii', description: 'Fofo, cabeção e olhos grandes.' },
    storybook: { label: 'Livro ilustrado', description: 'Traço de nanquim, cenários ricos.' },
    'bold-simple': { label: 'Traço grosso', description: 'Formas simples, ideal para crianças pequenas.' },
    'detailed-doodle': { label: 'Doodle detalhado', description: 'Padrões e detalhes para colorir com calma.' },
  },
  bookSizes: {
    short: { label: 'Curto', description: 'Uma história rápida, direto ao ponto.' },
    medium: { label: 'Médio', description: 'O tamanho mais escolhido.' },
    long: { label: 'Longo', description: 'Espaço para uma história completa.' },
  },
}

/** The Portuguese dictionary is the source of truth for the shape. */
export type Dictionary = typeof pt
