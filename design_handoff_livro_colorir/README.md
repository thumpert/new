# Handoff: Livro de Colorir — design system (direção 5a)

## Overview
Sistema visual para o produto "livro de colorir personalizado" (motor Por Tintim): o comprador responde
oito perguntas sobre a criança, o produto gera 24 páginas de contorno e entrega em PDF e/ou impresso.
Esta é a direção **5a** aprovada: papel texturado com cores de giz, cantos levemente irregulares,
elementos girados alguns graus, e o título-assinatura **vazado que se preenche de cor**.

Público: pais de crianças de 3 a 10 anos e quem compra de presente (avós, padrinhos). Tom lúdico, artesanal,
nunca infantilizado no texto.

## About the Design Files
Os arquivos deste pacote são **referências de design feitas em HTML** — protótipos que mostram aparência e
comportamento pretendidos, **não código de produção para copiar**. A tarefa é **recriar estes designs no
ambiente do codebase de destino** (React/Next, Vue, SwiftUI, etc.) usando os padrões e bibliotecas já
estabelecidos nele. Se ainda não existe ambiente, escolha o framework mais adequado ao projeto e implemente lá.

`tokens.css` é a exceção: pode ser adotado como está (ou convertido para o formato de tokens do projeto —
Tailwind theme, design tokens JSON, etc.). Os nomes das variáveis são a fonte da verdade do sistema.

## Fidelity
**Alta fidelidade (hifi)** para cor, tipografia, raio, sombra, rotações e animação — os valores do
`tokens.css` são finais e devem ser reproduzidos exatamente.
**Baixa fidelidade** apenas para as ilustrações: todo bloco `[ ... ]` é placeholder. As ilustrações reais
(livro, páginas, categorias) ainda não existem e serão fornecidas depois como imagens/SVG.

## Screens / Views

### 1. Home (única tela desenhada em 5a)
**Purpose:** convencer e levar ao fluxo de criação.
**Layout:** coluna única, largura máxima de conteúdo 1120px centrada, padding lateral `--esp-6` (26px)
no mobile e `--esp-8` (44px) acima de 900px. Seções, de cima para baixo:

1. **Nav** — flex, `justify-content: space-between`, `align-items: center`, padding `18px 26px`.
   - Logo: "tintim" em `--cor-tinta` + "colorir" em `--giz-vermelho`, `800 17px/1 Baloo 2`,
     `transform: rotate(var(--giro-logo))` (-1.5°).
   - Links: `--texto-nav` em `--cor-tinta-3`, gap 16px.
   - CTA: fundo `--cor-tinta`, texto `--cor-papel`, padding `10px 18px`, `border-radius: 14px 12px 15px 11px`,
     `rotate(var(--giro-botao))` (0.8°), rótulo "Criar livro →".

2. **Hero** — grid `1.1fr 0.9fr`, gap `--esp-4`, `align-items: center`, padding `10px 26px 26px`.
   Empilha em uma coluna abaixo de 760px (texto primeiro).
   - **Título vazado** (assinatura do sistema): duas camadas sobrepostas do mesmo texto
     `PINTA / DO JEITO / DELA` (`<br>` entre as linhas), `--texto-hero`, `letter-spacing: -.02em`:
     - camada de baixo: `color: transparent; -webkit-text-stroke: 2px var(--cor-tinta)`
     - camada de cima (`position:absolute; inset:0`): `color: var(--giz-vermelho)`,
       `animation: preenche-titulo var(--dur-preenche) ease-in-out infinite alternate`
     - Fallback obrigatório: onde `-webkit-text-stroke` não existir, usar `color: var(--cor-tinta)`
       sólido na camada de baixo (`@supports not (-webkit-text-stroke: 2px black)`).
   - Parágrafo: `--texto-corpo` em `--cor-tinta-2`, `max-width: 30ch`, `text-wrap: pretty`.
     Texto: "Oito perguntas, 24 contornos em papel 180g. A cor é trabalho dela."
   - Botão primário: fundo `--giz-vermelho`, texto `--cor-papel`, padding `14px 22px`,
     `border-radius: var(--raio-botao)`, `box-shadow: var(--sombra-solida-primaria)`. Rótulo "Começar →".
   - **Coluna da imagem:** `position: relative; display: grid; place-items: center; min-height: 200px`.
     - Blob: 150×150, `border-radius: 30px`, `background: var(--giz-amarelo)`, `opacity: .6`, `rotate(-6deg)`, absoluto.
     - Livro: 112px de largura, `aspect-ratio: 3/4`, fundo `--cor-branco`, `border: var(--borda-traco)`,
       `border-radius: var(--raio-folha)`, `rotate(var(--giro-livro))`.
     - Adesivo "24 páginas!": pill `--giz-verde`, texto `#12331B`, `--texto-adesivo` sem uppercase,
       padding `7px 11px`, `rotate(var(--giro-adesivo))`, canto inferior direito.

3. **Grade de páginas** — fundo `rgba(255,255,255,.72)` sobre o papel, padding `20px 26px`.
   Grid de 3 colunas (`repeat(3, minmax(0,1fr))`), gap `--esp-3`; 1 coluna abaixo de 640px.
   Cada item: tile `aspect-ratio: 1`, `border-radius: var(--raio-tile)`, `border: var(--borda-traco)`,
   fundo/texto em par de tile (`--tile-areia/-ink`, `--tile-verde/-ink`, `--tile-rosa/-ink`) e rotação
   alternada `--giro-tile-a/b/c`. Legenda abaixo, centrada, `--texto-legenda` em `--cor-tinta-3`.
   Copy usada: "O dinossauro de pelúcia." / "O Bidu no sofá." / "A praia com balde amarelo."

4. **Faixa de preço** — flex `space-between`, `align-items: center`, padding `22px 26px`.
   - Preço `--texto-preco` em `--cor-tinta`: **R$ 89** (placeholder, confirmar com o negócio).
   - Linha de apoio `--texto-legenda` em `--cor-tinta-4`: "impresso + PDF · só PDF R$ 49".
   - Botão escuro: fundo `--cor-tinta`, texto `--cor-papel`, `--raio-botao`, `--sombra-solida-escura`.
     Rótulo "Criar o livro dela".

### 2. Fluxo de criação (3 passos — especificado em 2b/`Design System Livro de Colorir.dc.html`)
Mesmos tokens. Cartões de passo com barra de progresso (3 segmentos, `height: 5px`, `--raio-pill`;
ativos em `--giz-vermelho`, inativos em `--cor-borda`), campo de texto com `border: var(--borda-traco)`,
chips selecionáveis (`--raio-pill`; selecionado = `--giz-amarelo` com texto `#5A4413`), e no passo 3 a
capa em fundo `--cor-tinta` com o botão "Finalizar · R$ 89". Implementar depois da home.

## Interactions & Behavior
- **Título vazado:** preenchimento por `clip-path: inset(0 100% 0 0)` → `inset(0)`, 5s, `ease-in-out`,
  `infinite alternate`. Respeitar `prefers-reduced-motion` (mostrar já preenchido, sem animação).
- **Hover em botão:** `translateY(2px)` e sombra sólida reduzida de 5px para 3px, 120ms. Sem mudança de cor.
- **Hover em tile de página:** `scale(1.02)` e rotação volta a 0deg, 180ms `--ease`.
- **Focus visível:** `outline: 3px solid var(--giz-amarelo); outline-offset: 2px` em tudo que é clicável.
- **Nav CTA e botão de preço** levam ao fluxo de criação (passo 1).
- **Responsivo:** hero empilha < 760px; grade de páginas vira 1 coluna < 640px; título usa `clamp()`
  (nunca abaixo de 38px); rotações reduzidas à metade < 480px para evitar overflow.
- Nenhum estado de carregamento/erro nesta tela. Validação existe no fluxo (nome obrigatório, idade 3-10).

## State Management
A home é estática. Estado necessário apenas no fluxo de criação:
`{ passo: 1|2|3, nome: string, idade: number, interesses: string[], paginas: Pagina[], plano: 'pdf'|'impresso' }`.
Transições: "Começar" → passo 1; validação por passo antes de avançar; passo 2 busca as páginas geradas
(assíncrono, mostrar skeleton no lugar dos thumbs); passo 3 cria o pedido.

## Design Tokens
Todos em `tokens.css` (fonte da verdade). Resumo:
- **Base:** papel `#FDF3E0`, papel-alt `#FFFCF4`, branco `#FFFFFF`, borda `#E3D4B4`.
- **Tinta:** `#2E2A22`, `#5C5444`, `#6B6252`, `#8C8168`, `#B6AA90`, sombra `#1A1710`.
- **Giz:** vermelho `#E2574C` (+ sombra `#B33C33`), amarelo `#FFD166`, verde `#7FB685`.
- **Tiles:** areia `#FFE6A8`/`#9A8355`, verde `#D6EBD8`/`#4E7A55`, rosa `#FBDBD4`/`#A65A4C`,
  azul `#DCE6F5`/`#4A6285`.
- **Textura:** dois `repeating-linear-gradient` (ver `--grao-papel`) sobre `--cor-papel`.
- **Tipografia:** Baloo 2 (800) títulos; Nunito (400/600/700) corpo, UI e botões; IBM Plex Mono só em
  rótulos técnicos. Escala em `--texto-*`.
- **Espaçamento:** 4, 8, 12, 16, 20, 26, 32, 44, 64.
- **Raio:** botão `15px 12px 16px 11px`; tile/card 18px; folha 10px; pill 999px.
- **Sombra:** sólidas `0 5px 0` (nunca blur em botão); folha `0 6px 0 rgba(46,42,34,.12)`.
- **Rotações:** entre -2.5° e +3° em logo, botões, tiles, livro; adesivos até -12°.

### Regras do sistema (o que mantém a identidade)
1. Contraste de texto: sempre tinta cheia sobre papel/tile — nunca texto com opacidade.
2. Toda superfície "desenhada" tem `border: 2px solid var(--cor-tinta)`, não borda cinza.
3. Sombra de botão é sólida e colorida, nunca difusa.
4. Nada perfeitamente alinhado: cada grupo repetido alterna rotações `--giro-tile-*`.
5. Máximo dois acentos de giz por seção. Vermelho é só ação primária.
6. Cor grande e chapada é para tiles e blobs; texto e contorno ficam em tinta.

## Assets
Nenhum asset final. Placeholders `[ livro ]`, `[ dinossauro ]`, `[ cachorro ]`, `[ praia ]` marcam onde
entram ilustrações de contorno (SVG preferencialmente, traço 3mm equivalente). Fontes vêm do Google Fonts
(Baloo 2, Nunito, IBM Plex Mono) — ou auto-hospedar com `font-display: swap`.

## Files
- `5a-home.html` — referência isolada da direção 5a (abre no navegador; é o alvo da implementação).
- `tokens.css` — tokens do sistema, prontos para adoção.
- `Design System Livro de Colorir.dc.html` — board completo com as 15 direções exploradas; use como
  contexto e para o fluxo de criação de 3 passos (turno 2, opção 2b).
