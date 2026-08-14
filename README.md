# Livro de Colorir Personalizado

Site onde o cliente monta um livro de colorir personalizado para dar de presente.
Ele escolhe a ocasião, os personagens e o estilo, responde algumas perguntas
sobre as pessoas envolvidas, escolhe entre quatro ideias de história — e recebe
um PDF A4 pronto para a gráfica, uma ilustração por página.

## Como funciona

```
brief  →  entrevista  →  4 ideias  →  roteiro  →  ilustrações  →  PDF A4
         (Claude)       (Claude)     (Claude)     (Higgsfield)    (pdf-lib)
```

1. **Brief** — ocasião, tipo de história, tom do narrador, estilo do desenho,
   tamanho, personagens (com foto opcional) e o lugar onde a história acontece.
2. **Entrevista** — a Claude API escreve 8–10 perguntas feitas sob medida para
   *aqueles* personagens ("O que a Lila faz assim que chega da escola?"). O
   cliente responde as que quiser.
3. **Ideias** — quatro histórias possíveis, com estruturas diferentes entre si,
   construídas a partir dos detalhes reais que o cliente contou.
4. **Roteiro** — a história escolhida vira um storyboard página a página. Cada
   página tem a narração (no idioma do cliente) e uma descrição visual da cena
   em inglês, escrita para o modelo de imagem.
5. **Ilustrações** — duas etapas, e a ordem é o que garante a consistência:
   primeiro cada personagem é desenhado **uma vez** como ficha de personagem em
   traço; depois cada página é gerada usando essas fichas como referência.
6. **PDF** — capa, dedicatória, páginas ilustradas em A4 com a narração
   embaixo, e contracapa.

## Rodando

```bash
npm install
cp .env.example .env.local   # preencha ANTHROPIC_API_KEY
npm run dev
```

Sem credenciais do Higgsfield o app usa o **provider mock**: o fluxo inteiro
funciona e o PDF é gerado, com molduras de prévia no lugar das ilustrações —
cada uma mostrando o prompt que teria sido enviado. É a forma barata de ajustar
a história e o layout antes de gastar créditos.

Para checar a metade de baixo da pipeline (roteiro → fila de render → PDF) sem
gastar nada e sem subir o servidor:

```bash
npx tsx scripts/smoke-pdf.ts   # escreve .data/smoke.pdf
```

## Configuração

Veja `.env.example`. Os dois que importam:

| Variável | Para quê |
|---|---|
| `ANTHROPIC_API_KEY` | Todo o texto: perguntas, ideias, roteiro |
| `HIGGSFIELD_CREDENTIALS` + `HIGGSFIELD_IMAGE_ENDPOINT` | As ilustrações |

`HIGGSFIELD_IMAGE_ENDPOINT` não tem um default: a Higgsfield expõe muitos
modelos atrás de uma API genérica de endpoint + input, e o endpoint certo
depende do modelo que você escolher — confira em docs.higgsfield.ai. Escolha um
que aceite imagens de referência, senão a consistência de personagem entre as
páginas se perde.

## Estrutura

```
src/
  app/
    [locale]/            páginas (pt e en)
      criar/             o wizard
      livro/[id]/        progresso da geração e download
    api/                 orders, uploads, arquivos, PDF
  components/            wizard, entrevista, personagens, progresso
  lib/
    catalog.ts           ocasiões, estilos, tons, tamanhos (+ prompts)
    i18n/                dicionários pt/en
    ai/                  prompts e chamadas da Claude API
    images/              provider de imagem (higgsfield | mock) e prompts
    pdf/build.ts         montagem do PDF A4
    render.ts            fichas de personagem + fila de páginas
    store.ts             persistência dos pedidos
```

Os rótulos que o cliente lê ficam nos dicionários (`lib/i18n`); os fragmentos de
prompt que vão para os modelos ficam no `catalog.ts`. As duas metades usam os
mesmos ids, então adicionar uma ocasião nova é mexer nesses dois arquivos.

## Escopo atual

Vai do brief ao PDF. Pagamento e envio para a gráfica **ainda não estão
implementados** — os pontos de integração estão preparados (o pedido tem
status próprio e o PDF é gerado sob demanda por `GET /api/orders/[id]/pdf`),
mas o checkout e a API da gráfica são a fase 2.

Persistência é em arquivo (`.data/`), o que serve para desenvolvimento e para um
servidor único. Para produção na Vercel, `lib/store.ts` e `lib/storage.ts` são as
duas peças a reimplementar (Postgres + blob storage) — nenhum outro arquivo
toca o disco diretamente.
