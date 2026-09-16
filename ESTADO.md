# Onde o projeto está

Snapshot para retomar o trabalho numa sessão nova. Leia junto com o `README.md`,
que explica o produto e a arquitetura.

**Branch:** `claude/personalized-coloring-book-generator-ufe6lv`
**Último commit:** veja `git log -1`

Esta versão substitui a anterior de ponta a ponta: o assistente tinha 12 etapas,
existia um terceiro acabamento ("livro colorido") e toda história era inventada
do zero por um modelo. Nada disso é mais verdade — leia como se fosse a
primeira vez.

---

## O que já funciona

O fluxo inteiro, do brief ao PDF:

1. **Assistente, 8 etapas** — tipo de livro → idioma do livro → ocasião →
   estilo do desenho → personagens → escolha da história (prateleira) →
   conversa (perguntas escritas à mão da história escolhida, a primeira
   sempre "onde a história acontece") → título.
2. **Toda história vem da prateleira.** Não existe mais fluxo que inventa uma
   história do zero: as quatro ideias, a entrevista escrita por modelo e a
   conferência de lacunas no brief foram removidas do produto inteiro — rotas,
   chamadas de IA e telas. Ver a seção seguinte.
3. **Google (Gemini)** desenha: fichas de personagem, as duas capas, as
   páginas e a contracapa.
4. **PDF A4**, em duas formas — ver "Duas formas de livro" abaixo.
5. **Refazer página** isolada, reusando as fichas de personagem.

---

## A prateleira substituiu a invenção

`src/lib/stories.ts` guarda **13 histórias já escritas**, cada uma amarrada a
uma ocasião do `catalog.ts`:

| Ocasião | Histórias |
|---|---|
| `new-baby` (Vem um bebê aí) | Um Raio de Sol Atravessa a Cidade · As Coisas Mais Belas · A Caminho · Treinamento · Esperando · A Troca · O Nome Que Só Eu Sei |
| `birthday` (Aniversário) | Um Bilhete Por Ano · O Caso da Porta Fechada |
| `dinosaur` (Dinossauro) | O Bicho Embaixo de Casa |
| `space` (Espaço) | Nunca Solte a Corda |
| `holiday` (Viagem) | O Guia · Quanto Falta |

Cada história é um molde: título, logline, resumo, elenco (papéis escaláveis
só a partir dos personagens que o cliente nomeou — nunca inventa parente ou
bicho), perguntas próprias e as batidas da história. `storiesFor(brief)`
filtra pela ocasião escolhida **e** pelo elenco real da família; uma história
que precisa de um adulto não aparece para quem só nomeou uma criança.

**`child` (Presente para o filho[a]) não tem prateleira ainda** — é a única
ocasião sem histórias, e por isso saiu da lista viva em `OccasionId` e do
`OCCASIONS` do catálogo, junto com `relationship` e `pet` (removidas por outro
motivo: livro de colorir de 24 páginas para presente entre adultos é outro
negócio). Pedido antigo com qualquer uma dessas três ocasiões ainda abre —
`getOccasion` cai na primeira ocasião viva em vez de estourar. `child` volta
quando tiver histórias escritas; enquanto isso, **nenhuma ocasião nova deve
ser adicionada sem escrever a prateleira dela junto** — não existe mais
caminho de reserva que invente uma história para uma ocasião vazia.

**Nenhuma pergunta é obrigatória.** Cada história ainda marca quais perguntas
ela usa de verdade (`loadBearing`, antigo `required`), mas isso não trava mais
o botão de avançar — vira instrução para o escritor: um slot vazio é nomeado
no prompt com um exemplo do formato de resposta (`assumptionsFor` em
`stories.ts`), e a regra é escolher o mais comum e manter o mesmo palpite do
início ao fim do livro.

---

## Duas formas de livro, e uma prateleira que atende as duas

O acabamento (`finish`) continua sendo a primeira pergunta: `coloring` ou
`reading`. O que mudou é que uma história da prateleira pode ser contada dos
dois jeitos, e às vezes de um jeito bem diferente do outro:

- **Se a história tem as batidas cortadas em quadros** (`FramedBeat`, com
  `frameA`/`frameB`) — hoje só *O Bicho Embaixo de Casa* — pedida como
  `coloring` ela vira **24 painéis sem uma palavra**: cada batida é um par de
  desenhos, A é o gesto e B é a consequência, e B tem que ser um desenho
  genuinamente diferente (outro ângulo, outra distância, outras caras) — nunca
  a mesma composição com um braço mudado. É a única coisa que diz para uma
  criança que o tempo passou, já que não existe texto na página. Pedida como
  `reading`, a mesma história sai como sempre saiu: uma página por batida
  (`beat.text`), com narração.
- **Toda história ainda não cortada em quadros** (as sete histórias restantes
  de `new-baby`, mais as duas de aniversário, a de espaço e as duas de
  viagem) sai como sempre saiu: uma imagem por página, com ou sem narração
  conforme o acabamento.

`pageCountFor(story, brief)` é a única função que decide quantas páginas um
pedido tem — nunca mais um valor fixo do catálogo quando existe história
escolhida. Existia um bug real aqui antes desta rodada: pedir *O Bicho
Embaixo de Casa* como livro para ler pedia 13 páginas ao modelo tendo só 12
batidas escritas. Corrigido.

**Escrever a próxima história em quadros:** siga o molde de
`the-thing-under-the-house` em `src/lib/stories.ts` — é o exemplo de
referência. Doze batidas, cada uma com `text` (a versão para ler), `frameA` e
`frameB` (as duas versões para colorir). `npx tsx scripts/test-shelf-story.mts
<id>` lê a história inteira sem gastar desenho.

---

## As duas decisões de acabamento que continuam de pé

### 1. Cada estilo carrega a própria paleta

O cliente **nunca** escolhe cor separadamente. O estilo diz como ele é desenhado
*e* como é colorido, no mesmo objeto (`ArtStyleDef` em `src/lib/catalog.ts`).
Super-herói sai em primárias saturadas, chibi em pastel leitoso, fine-line em
aguadas contidas.

Há um terceiro campo, `coloringCaveat`, que só entra no livro de colorir com
palavras (o formato antigo, ainda usado pelas histórias não cortadas em
quadros). Três estilos são sombreados na forma natural e uma página de
colorir não pode ter nada disso — essas retratações vivem separadas do
`prompt` principal porque contradizem a paleta do próprio estilo.

### 2. A capa é escolhida no meio do caminho

```
assistente → [fichas + 2 capas] → VOCÊ ESCOLHE → [páginas + contracapa] → PDF
```

As duas opções são ideias diferentes de capa: **retrato** (personagens
grandes, olhando pra quem abre) e **cena** (momento largo, personagens dentro
do mundo).

---

## Fotos que viram página

Até 3 (`MAX_MEMORIES`). Não confundir com as fotos de referência do personagem:
aquelas ensinam um rosto, são usadas uma vez e nunca são impressas. Estas **são**
a página. Só existe no formato antigo (não cortado em quadros) — um livro
wordless de 24 painéis não tem onde colocar a legenda que uma foto precisaria.

---

## O que foi medido de verdade

**Consistência de personagem — a estratégia funciona.** Gerar cada personagem
uma vez como ficha e usar essa ficha como referência em toda página mantém a
pessoa reconhecível.

**Traço limpo — medido.** Método: máscara de pixels cinza, erodida em 5px; o que
sobrevive é sombreado real, o que some era antialiasing de borda. Cor vazando,
cinza sólido e preto preenchido (contornos excluídos) deram 0% nas amostras
medidas.

**JPEG não estraga o traço.** O Gemini só devolve JPEG. A faixa de 2 a 6px em
volta de cada contorno dá 0% não-branco — sem ringing perceptível.

**Capas coloridas a partir de ficha em preto e branco — funciona.** As cores
vêm das descrições escritas dos personagens, que por isso vão no prompt junto
com a ficha.

---

## O que ainda não foi visto por olho humano

- **Um livro de 24 painéis inteiro, desenhado de verdade.** O encanamento
  está testado ponta a ponta com o mock provider e com prompts reais lidos de
  volta (`test-shelf-story.mts`), mas ninguém ainda pagou US$1 e olhou as 24
  imagens de *O Bicho Embaixo de Casa* saindo do Google lado a lado — em
  especial se o par A/B de cada batida realmente sai como dois desenhos
  diferentes, que é a aposta inteira do formato.
- **As sete histórias novas** (Um Bilhete Por Ano, O Caso da Porta Fechada,
  Nunca Solte a Corda, A Troca, O Nome Que Só Eu Sei, O Guia, Quanto Falta)
  foram verificadas por script (elenco, perguntas, contagem de páginas,
  ausência de vazamento no prompt) mas nenhuma foi lida de ponta a ponta por
  um humano depois de escrita pelo modelo de verdade.
- **A vitrine na home.** O assistente já filtra por ocasião e elenco; falta a
  home mostrar as 13 capas como prateleira em vez de só os dois blocos
  colorir/ler.

---

## Ambiente e custos

**Provedor:** Google, direto. `GEMINI_API_KEY` no `.env.local` (chave criada em
aistudio.google.com/apikey). Sem chave o app cai no **mock**: o fluxo inteiro
funciona e o PDF sai com molduras de prévia mostrando o prompt.

| | |
|---|---|
| Modelo de imagem | `gemini-3.1-flash-image` |
| Modelo de texto | `claude-opus-5` |
| Resolução | 2K, proporção 3:4 |
| Páginas em paralelo | 3 (`PAGE_CONCURRENCY`) |
| Custo por imagem | ~US$ 0,04 |
| Custo por livro de 24 painéis | ~US$ 1,00 de imagem (o dobro do formato antigo — 24 desenhos em vez de 12 a 13) |

Não existe endpoint de saldo/crédito para consultar por API em nenhum dos dois
provedores — o número de créditos restantes só aparece nos painéis web
(console.anthropic.com/settings/billing e aistudio.google.com ou o Cloud
Console, dependendo de qual conta a `GEMINI_API_KEY` pertence).

---

## Decisões que não devem ser desfeitas sem motivo

- **Toda ocasião tem prateleira, ou não existe.** Não há mais caminho que
  invente uma história do zero. Uma ocasião nova só entra em `OCCASIONS`
  junto com pelo menos uma história em `stories.ts` — do contrário a tela de
  escolha da história renderiza a mensagem de "nenhuma história funciona"
  para todo mundo, sempre.
- **Nenhuma pergunta trava o avanço.** Um slot vazio vira instrução para o
  escritor (`assumptionsFor`), nunca um bloqueio para o cliente.
- **Idioma do livro ≠ idioma do site.** Perguntas e resumos saem no idioma do
  site (quem lê é o comprador); títulos e narração no idioma do livro (vão
  impressos); descrições de cena **sempre em inglês**, porque quem lê é o
  modelo de imagem.
- **Ficha de personagem antes de tudo.** Sustenta a consistência e torna barato
  refazer uma página só.
- **O provider é plugável** (`google` | `mock`). O mock não é enfeite.
- **As amostras de estilo são fixas e versionadas.** Arquivos em
  `public/styles/`, todas na mesma cena. O site nunca as gera em tempo de
  execução. Para refazer: `npx tsx scripts/make-style-samples.ts [estilo]`.

---

## Armadilhas

**Sessão remota vs local.** Se a sessão rodar num container na nuvem, ela não
enxerga o Mac: não lê o `.env.local` e não alcança serviços locais. Cheque com
`pwd` — `/Users/...` é local.

**Nunca cole credencial no chat.** Conversa fica gravada. A chave certa vai
direto no `.env.local` pelo terminal.

---

## Scripts

```bash
npx tsx scripts/smoke-pdf.ts                              # fluxo de colorir, do roteiro ao PDF, sem gastar
npx tsx scripts/test-shelf-story.mts <id-da-historia>      # lê uma história da prateleira inteira, texto só
npx tsx scripts/test-google.ts                             # uma imagem real, confere a integração
npx tsx scripts/test-covers.ts                             # as 2 capas + contracapa, de verdade
npx tsx scripts/test-reading.ts [little|middle|big]        # um livro de leitura real, confere a faixa de idade
npx tsx scripts/test-truncation.ts                         # tratamento de resposta cortada, sem gastar
npx tsx scripts/make-style-samples.ts                      # regera as amostras de estilo do assistente
```

---

## Próximos passos, em ordem

1. Desenhar um livro de 24 painéis de verdade (`the-thing-under-the-house`,
   acabamento `coloring`) e olhar se cada par A/B sai como dois desenhos
   realmente diferentes.
2. Cortar mais uma das sete histórias restantes em quadros, seguindo o mesmo
   molde, e repetir o julgamento.
3. Prateleira na home: trocar os dois blocos colorir/ler por uma vitrine das
   13 capas, filtrável por ocasião.
4. Escrever a prateleira de `child` e trazer a ocasião de volta.
5. Fase 2: pagamento (Stripe) e envio para a gráfica.
6. Antes de produção: trocar `lib/store.ts` e `lib/storage.ts` por Postgres e
   blob storage, e mover a renderização para uma fila (24 páginas em paralelo
   de 3 em 3 encostam no timeout de função serverless).
