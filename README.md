# Livro Personalizado

Site onde o cliente monta um livro personalizado para dar de presente. Ele
escolhe se quer um **livro de colorir** ou um **livro ilustrado colorido**, conta
quem são os personagens, responde algumas perguntas, escolhe entre quatro ideias
de história e uma de duas capas — e recebe um PDF A4 pronto para a gráfica, uma
ilustração por página.

## Como funciona

```
brief → entrevista → 4 ideias → roteiro → fichas + 2 capas → [escolha] → páginas → PDF A4
        (Claude)     (Claude)   (Claude)      (Gemini)                   (Gemini)  (pdf-lib)
```

1. **Brief** — tipo de livro, idioma do livro, ocasião, tipo de história, tom do
   narrador, estilo do desenho, tamanho, personagens e o lugar onde a história
   acontece.
2. **Entrevista** — a Claude API escreve 8–10 perguntas feitas sob medida para
   *aqueles* personagens ("O que a Lila faz assim que chega da escola?"),
   agrupadas por tema — um bloco por tela. Cada pergunta vem com três sugestões
   de resposta clicáveis, que o cliente usa como ponto de partida e edita.
3. **Ideias** — quatro histórias possíveis, com estruturas diferentes entre si,
   construídas a partir dos detalhes reais que o cliente contou.
4. **Roteiro** — a história escolhida vira um storyboard página a página. Cada
   página tem a narração (no idioma do livro) e uma descrição visual da cena em
   inglês, escrita para o modelo de imagem.
5. **Fichas e capas** — cada personagem é desenhado **uma vez** como ficha de
   personagem; depois as duas capas são geradas usando essas fichas. Aí o
   processo para e espera.
6. **Escolha da capa** — o cliente escolhe entre retrato e cena. Só então o livro
   começa a ser desenhado.
7. **Páginas e contracapa** — cada página é gerada usando as fichas como
   referência, que é o que mantém os personagens iguais do começo ao fim.
8. **PDF** — capa ilustrada, dedicatória, páginas em A4 e contracapa ilustrada.

Qualquer página pode ser refeita depois, sozinha. Como as fichas de personagem já
estão guardadas, a cena muda e os personagens continuam idênticos.

## Livro de colorir ou livro colorido

É a primeira coisa que o cliente escolhe, e ela desce até o fundo do sistema:

| | livro de colorir | livro colorido |
|---|---|---|
| Ficha de personagem | traço preto | colorida |
| Páginas | traço preto sobre branco | pintadas |
| Layout no PDF | margem branca, narração embaixo | sangria total, narração sobre a arte |
| Capa e contracapa | coloridas | coloridas |

A capa é colorida nos dois — é a única parte do livro de colorir que já vem
pintada.

**A cor pertence ao estilo, não ao cliente.** Cada estilo diz como é desenhado e
como é colorido, no mesmo lugar: super-herói sai em primárias saturadas, chibi em
pastel, fine-line em aguadas contidas. Não existe uma escolha de paleta separada
justamente para que ela nunca possa brigar com o traço escolhido.

## Fotos que viram página

O cliente pode incluir até três fotos reais no livro. A foto é redesenhada no
estilo escolhido, mantendo o momento — quem está, fazendo o quê — e a descrição
que ele escreve vai para a Claude, que encaixa aquele momento onde a história
chega nele. A página ganha narração como qualquer outra e a página seguinte
reage.

Não confundir com as **fotos de referência** do personagem, na mesma tela: aquelas
ensinam o modelo a desenhar um rosto, são usadas uma vez e nunca são impressas.

Quando a foto e as fichas chegam juntas ao modelo de imagem, elas disputam, e a
hierarquia está declarada no prompt: a **foto manda na composição**, a **ficha
manda na aparência**.

## Idioma do livro ≠ idioma do site

São duas coisas separadas, de propósito. O site é lido pelo comprador; o livro,
por quem recebe. Um brasileiro comprando presente para alguém que está aprendendo
inglês navega em português e encomenda um livro em inglês.

Três opções: **português**, **inglês**, e **inglês com apoio em português** — a
narração em inglês e, embaixo e menor, a tradução, para quem está treinando.

Isso atravessa os prompts: perguntas da entrevista e resumos das ideias saem no
idioma do site, títulos e narração no idioma do livro, e as descrições de cena
sempre em inglês, porque quem lê é o modelo de imagem.

## Rodando

```bash
npm install
cp .env.example .env.local   # preencha ANTHROPIC_API_KEY e GEMINI_API_KEY
npm run dev
```

Sem `GEMINI_API_KEY` o app usa o **provider mock**: o fluxo inteiro funciona e o
PDF é gerado, com molduras de prévia no lugar das ilustrações — cada uma
mostrando o prompt que teria sido enviado. É a forma barata de ajustar a história
e o layout antes de gastar.

Para checar a metade de baixo da pipeline (roteiro → fila de render → PDF) sem
gastar nada e sem subir o servidor:

```bash
npx tsx scripts/smoke-pdf.ts            # livro de colorir
npx tsx scripts/smoke-pdf.ts coloured   # livro colorido
```

## Configuração

Veja `.env.example`. Os dois que importam:

| Variável | Para quê |
|---|---|
| `ANTHROPIC_API_KEY` | Todo o texto: perguntas, ideias, roteiro |
| `GEMINI_API_KEY` | Todas as imagens: fichas, capas, páginas |

A chave do Gemini se cria em [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
O modelo padrão é `gemini-3.1-flash-image` — o mesmo que outros serviços revendem
sob o nome "Nano Banana". Uma imagem custa cerca de US$ 0,04, então um livro de
12 páginas sai por volta de US$ 0,55 de ilustração.

## Estrutura

```
src/
  app/
    [locale]/            páginas (pt e en)
      criar/             o wizard
      livro/[id]/        progresso, escolha da capa e download
    api/                 orders, uploads, arquivos, capa, PDF
  components/            wizard, entrevista, personagens, progresso
  lib/
    catalog.ts           ocasiões, estilos (traço + paleta), tons, tamanhos
    i18n/                dicionários pt/en
    ai/                  prompts e chamadas da Claude API
    images/              provider de imagem (google | mock) e prompts
    pdf/build.ts         montagem do PDF A4
    render.ts            fichas, capas, fila de páginas, contracapa
    store.ts             persistência dos pedidos
```

Os rótulos que o cliente lê ficam nos dicionários (`lib/i18n`); os fragmentos de
prompt que vão para os modelos ficam no `catalog.ts`. As duas metades usam os
mesmos ids, então adicionar uma ocasião nova é mexer nesses dois arquivos.

As amostras de estilo em `public/styles/` são fixas e versionadas — cinco em
traço, cinco coloridas, todas na mesma cena para poderem ser comparadas. O site
nunca as gera em tempo de execução: elas são uma promessa do que o cliente vai
receber. Para refazer as coloridas:
`npx tsx scripts/make-colour-samples.ts [estilo]`.

## Escopo atual

Vai do brief ao PDF. Pagamento e envio para a gráfica **ainda não estão
implementados** — os pontos de integração estão preparados (o pedido tem status
próprio e o PDF é gerado sob demanda por `GET /api/orders/[id]/pdf`), mas o
checkout e a API da gráfica são a fase 2.

Persistência é em arquivo (`.data/`), o que serve para desenvolvimento e para um
servidor único. Para produção na Vercel, `lib/store.ts` e `lib/storage.ts` são as
duas peças a reimplementar (Postgres + blob storage) — nenhum outro arquivo toca
o disco diretamente.
