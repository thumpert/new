export const pt = {
  meta: {
    /* A marca, e só ela. É o que o logo escreve. */
    name: 'Por Tintim',
    /*
     * O <title> da aba e do Google, que é outra coisa do <h1>.
     *
     * Antes daqui saía só "Por Tintim", e ninguém busca por isso: busca por
     * "livro infantil personalizado". O nome da marca vem depois do que o
     * produto é, porque é nessa ordem que o resultado de busca é lido.
     */
    seoTitle: 'Livro infantil personalizado, para colorir ou para ler | Por Tintim',
    /* A descrição do resultado de busca. Cabe em ~155 caracteres. */
    tagline:
      'Um livro infantil personalizado feito das histórias reais da sua família. Escolha entre livro de colorir ou livro para ler, ilustrado página por página.',
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
    eyebrow: 'Livro infantil personalizado',
    /*
     * O título do hero é vazado e se preenche de cor, então vem quebrado em
     * três linhas curtas em caixa alta: é a mesma frase do `title`, que
     * continua sendo o que vai na aba do navegador e nos buscadores.
     */
    heroLines: ['O HERÓI', 'DA HISTÓRIA', 'MORA COM VOCÊ'],
    lineBookAlt: 'Uma página em traço preto, para colorir',
    colourBookAlt: 'A mesma página já pintada, para ler',
    sticker: 'Página por página',
    kinds: {
      heading: 'Dois livros, a mesma história',
      body: 'Você escolhe na primeira tela, e a escolha desce até o fundo: muda o traço, a paleta e como a página é diagramada.',
      colouring: {
        label: 'Para colorir',
        body: 'Traço preto sobre branco, sem uma palavra dentro: a história se conta de desenho em desenho, e são 24 deles nas histórias de prateleira. A capa já vem colorida — o resto é trabalho de quem ganhar.',
      },
      reading: {
        label: 'Para ler',
        body: 'Treze páginas já pintadas no estilo que você escolheu, com a história embaixo. Para ler junto na hora de dormir.',
      },
    },
    reassurance: 'Você lê a história inteira antes de a gente desenhar qualquer página.',
    footnote: 'Impresso em A4 · também para ler no navegador',
    subtitle:
      'E não é só o nome na capa. O herói tem o tênis que ela tira ao chegar, a avó que responde pergunta com pergunta, o formigueiro que ela visita todo dia. A gente pergunta, escreve a história e desenha — e o livro chega com essas coisas dentro.',
    cta: 'Personalizar',
    how: 'Como funciona',
    steps: [
      {
        title: 'A gente pergunta',
        body: 'Perguntas escritas para este livro, não um formulário. É de "para no meio da rua para olhar formiga" que sai uma história — de "é muito querida" não sai nada.',
      },
      {
        title: 'Você lê antes de desenhar',
        body: 'Em algumas ocasiões você escolhe entre histórias que já escrevemos. Nas outras, escrevemos quatro possíveis e você fica com uma. Nos dois casos você lê o livro inteiro antes de qualquer desenho — texto é barato, desenho não.',
      },
      {
        title: 'Escolhe a capa, e o livro é desenhado',
        body: 'Duas capas para você decidir. Depois cada página é ilustrada no estilo que você escolheu, conferida uma a uma, e sai em PDF pronto para imprimir — e num link para ler na hora.',
      },
    ],
  },
  wizard: {
    finish: {
      title: 'Que tipo de livro você quer?',
      subtitle: 'Esta escolha muda tudo o que vem depois — inclusive como as ilustrações são desenhadas.',
    },
    bookLanguage: {
      title: 'Em que idioma será o livro?',
      subtitle:
        'O site continua em português — isso vale só para o livro.',
    },
    occasion: {
      title: 'Qual é a ocasião?',
      subtitle: 'Isso define o tom e o coração da história.',
    },
    shelf: {
      title: 'Qual história vai ser?',
      subtitle:
        'Estas histórias já estão escritas. Você escolhe uma, e nas próximas telas a gente pergunta só o que ela precisa para virar a história de vocês — os nomes, a cidade, o bicho, as coisas favoritas.',
      empty:
        'Nenhuma das histórias dessa ocasião funciona com os personagens que você incluiu. Volte uma tela e adicione quem falta — ou troque a ocasião.',
    },
    artStyle: {
      title: 'Qual estilo de desenho?',
      subtitle: 'Todos são em traço preto e branco, prontos para colorir.',
      subtitleColoured:
        'Cada estilo tem sua própria paleta — o de quadrinhos sai vibrante, o kawaii sai em pastel.',
    },
    characters: {
      title: 'Quem são os personagens?',
      subtitle:
        'Adicione pessoas e pets. A foto ensina o rosto ao desenhista: com ela, o personagem sai parecido com a pessoa de verdade e continua o mesmo da primeira à última página. Sem ela, sai uma pessoa qualquer.',
      // Vale para qualquer prateleira, não só a do bebê: quem entra aqui é
      // quem pode ser escalado, e algumas histórias só aparecem quando existe
      // uma criança na lista.
      shelfIntro:
        'Quem você incluir aqui decide quais histórias aparecem na próxima tela — algumas só existem quando há uma criança no livro. Vale um irmão, uma irmã, um primo, uma prima ou um amiguinho. E quem você incluir vai ter o que fazer na história, seja qual for a que você escolher.',
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
      gender: 'Como falar dessa pessoa',
      genderHint:
        'Opcional. Em português quase toda palavra que encosta numa pessoa tem gênero, então isso muda o livro inteiro. Sem marcar, a gente escreve desviando da marca em vez de chutar.',
      genders: { male: 'Menino / homem', female: 'Menina / mulher', neutral: 'Neutro' },
      appearance: 'Como ele(a) é fisicamente?',
      appearanceHint:
        'Só o que se vê. É a única parte que vai para quem desenha.',
      appearancePlaceholder:
        'Cabelo cacheado castanho na altura do ombro, óculos redondos, jardineira jeans e tênis vermelho…',
      personality: 'Como é o jeito dele(a)?',
      personalityHint:
        'Vai para quem escreve a história, não para o desenho.',
      personalityPlaceholder:
        'Ri de tudo, fala pelos cotovelos, tem medo de trovão, teimosa do jeito bom…',
      storyNotes: 'Algo que precisa entrar na história',
      storyNotesHint: 'Um momento real, uma mania, uma frase que ele(a) sempre diz.',
      storyNotesPlaceholder:
        'Sempre chega três passos à frente. Chama todo mundo de "chefe". No Natal passado escondeu o presente e esqueceu onde.',
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
      subtitleStory: 'Estas são as coisas que a história escolhida precisa saber. As marcadas com ★ são as que ela não consegue escrever sem.',
      allQuestions: 'Todas as perguntas',
      current: 'Atual',
      close: 'Fechar',
      suggestions: 'Sugestões — clique para usar e edite depois',
      block: 'Bloco',
      answered: 'respondidas',
      /* O balão fantasma de uma pergunta que ficou para trás sem resposta. */
      unanswered: 'ficou em branco — responder',
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
      want: 'O que está em jogo:',
      device: 'O fio da história:',
      turn: 'O que muda no meio:',
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
    storyReady: 'Leia a história antes de desenharmos',
    storyTitle: 'A história ficou assim',
    storyHint: 'Nada foi desenhado ainda. Leia com calma: se não estiver boa, peça outra — texto não custa quase nada, desenho custa.',
    approveStory: 'Está boa, pode desenhar',
    rewriteStory: 'Escrever outra história',
    approvingStory: 'Começando…',
    rewritingStory: 'Escrevendo…',
    covers: 'Desenhando as capas…',
    coverReady: 'Escolha a capa para continuar',
    chooseCoverTitle: 'Qual vai ser a capa?',
    chooseCoverHint:
      'Quatro capas: duas de cada enquadramento, todas coloridas no estilo que você escolheu. Compare as duas versões de cada uma — o livro só começa a ser desenhado depois desta escolha.',
    chooseThis: 'Escolher esta',
    choosingCover: 'Escolhendo…',
    coverFailed: 'Esta capa não pôde ser desenhada.',
    failedPages: 'Não deu para desenhar:',
    failedHint: 'Toque no número da página para vê-la e tentar de novo.',
    coverVariant: 'Versão {n}',
    coverTakes: {
      portrait: {
        1: 'Os dois de frente, grandes e no centro, olhando para quem abre o presente.',
        2: 'Mais perto e de lado, virados um para o outro, um passo à frente do outro.',
      },
      scene: {
        1: 'O mundo da história aberto, com eles dentro dele.',
        2: 'Vistos por trás, de cima, entrando na história — o lugar ocupa quase tudo.',
      },
    },
    coverKinds: {
      portrait: {
        label: 'Retrato',
        description:
          'Os personagens juntos, grandes, olhando para quem abre o presente.',
      },
      scene: {
        label: 'Cena',
        description:
          'Um momento largo da história, com os personagens dentro do mundo deles.',
      },
    },
  },
  reader: {
    previous: 'Voltar',
    next: 'Avançar',
    counter: '{n} de {total}',
    download: 'Baixar o PDF',
    notReady: 'Este livro ainda está sendo desenhado.',
    seeProgress: 'Ver como está',
    open: 'Ler aqui',
  },
  finishes: {
    coloring: {
      label: 'Livro de colorir',
      description:
        'Desenhos em traço preto sobre branco, para colorir com lápis e giz. A capa vem colorida.',
    },
    reading: {
      label: 'Livro de histórias para ler',
      description:
        'Treze páginas com o desenho colorido e a história embaixo. Feito para ler junto, na hora de dormir.',
    },
  },
  ageBands: {
    title: 'Para que idade?',
    hint: 'Isso muda a história de verdade, não só o tamanho: quanto fica sem explicação, quanto tempo uma pergunta pode ficar no ar, e se um capítulo pode terminar sem resposta.',
    little: {
      label: '3 a 5 anos',
      description:
        'Para ler em voz alta, no colo. Uma ou duas frases por página, uma coisa acontecendo de cada vez, e um refrão que a criança repete junto.',
    },
    middle: {
      label: '6 a 8 anos',
      description:
        'Para quem está começando a ler sozinho. Três a cinco frases por página, e uma pergunta que pode ficar no ar por várias páginas — é a idade que descobre o suspense.',
    },
    big: {
      label: '9 a 12 anos',
      description:
        'Para ler sozinho. Um parágrafo por página, com espaço para uma segunda linha da história. O personagem pode estar errado sobre algo e descobrir depois.',
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
    'pt-fr': {
      label: 'Português com apoio em francês',
      description:
        'A narração em português e, embaixo e menor, a tradução — para a criança que cresce entre as duas línguas.',
    },
  },
  occasions: {
    child: {
      label: 'Presente para o filho(a)',
      description: 'Uma história sobre quem essa criança é.',
    },
    // Uma prateleira só. O livro do bebê e o livro de quem já estava em casa
    // viraram a mesma ocasião, então o rótulo precisa dizer os dois sem
    // obrigar ninguém a escolher entre "bebê" e "irmão" antes de ver as
    // histórias.
    'new-baby': {
      label: 'Vem um bebê aí',
      description:
        'Para o bebê que está chegando — ou para quem já estava em casa e vai ter que dividir o quarto.',
    },
    birthday: {
      label: 'Aniversário',
      description: 'Uma celebração do ano que passou.',
    },
    dinosaur: {
      label: 'Dinossauro',
      description: 'Tem uma coisa enorme embaixo do bairro, e ela cava até achar.',
    },
    space: {
      label: 'Espaço',
      description: 'Subir atrás do que a família olha no céu toda noite.',
    },
    holiday: {
      label: 'Viagem',
      description: 'A viagem da família, contada da altura de quem é baixinho.',
    },
  },
  // storyTypes e tones saíram junto com as duas telas que os liam.
  //
  // O que os modelos recebem continua igual: os fragmentos de prompt de cada
  // tipo e de cada tom estão no catalog.ts, e o brief ainda carrega os dois
  // campos — só que agora o tipo vem da ocasião e o tom é sempre 'warm'. O que
  // morreu foi o rótulo e a descrição que o cliente lia para escolher, porque
  // não há mais escolha. Os cinco exemplos de voz continuam no git, em
  // 31aab72:src/lib/i18n/pt.ts, se algum dia voltarem.
  artStyles: {
    chibi: {
      label: 'Chibi',
      description: 'Cabeção redondo, olhos enormes, tudo fofo. O mais fácil de colorir.',
      descriptionColoured:
        'Cabeção redondo, olhos enormes, tudo fofo. Pintado em pastel suave.',
    },
    'coloring-book': {
      label: 'Livro de colorir',
      description: 'Traço fino e cheio de folhas, flores e bichinhos escondidos. Para colorir com calma.',
      descriptionColoured:
        'Cheio de folhas, flores e bichinhos escondidos, pintado em tons joia.',
    },
    'superhero-comic': {
      label: 'HQ super-heróis',
      description: 'Poses de ação, ângulos dramáticos e anatomia heroica, como um quadrinho.',
      descriptionColoured:
        'Poses de ação e ângulos dramáticos, em cores fortes e vibrantes de quadrinho.',
    },
    'fine-line': {
      label: 'Moderno elegante',
      description: 'Traço finíssimo e delicado, com jeito de ilustração de revista.',
      descriptionColoured:
        'Traço finíssimo com aguadas suaves, do jeito de ilustração de revista.',
    },
    cartoon: {
      label: 'Cartoon',
      description: 'Desenho animado dos anos 90, com cenário em camadas.',
      descriptionColoured:
        'Desenho animado dos anos 90, com cor chapada e cenário em camadas.',
    },
    'retro-storybook': {
      label: 'Clássico retrô',
      description:
        'Árvores geométricas e cenas montadas em camadas, como um livro dos anos 50.',
      descriptionColoured:
        'Formas chapadas com textura de giz, em verdes e terrosos meio desbotados.',
    },
  },
}

/** The Portuguese dictionary is the source of truth for the shape. */
export type Dictionary = typeof pt
