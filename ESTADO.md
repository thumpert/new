# Onde o projeto está

Snapshot para retomar o trabalho numa sessão nova. Leia junto com o `README.md`,
que explica o produto e a arquitetura.

**Branch:** `claude/personalized-coloring-book-generator-ufe6lv`
**Último commit:** veja `git log -1`

---

## O que já funciona

O fluxo inteiro, do brief ao PDF:

1. **Assistente, 12 etapas** — tipo de livro → idioma do livro → ocasião → tipo
   de história → tom → estilo do desenho → tamanho → personagens (até 3 fotos de
   referência cada, mais as fotos que entram no livro) → lugar → entrevista →
   escolha entre 4 histórias → título.
2. **Claude API** escreve as perguntas da entrevista, as 4 ideias, os 3 títulos e
   o roteiro página a página.
3. **Google (Gemini)** desenha: fichas de personagem, as duas capas, as páginas e
   a contracapa.
4. **PDF A4** com capa ilustrada, dedicatória, páginas e contracapa ilustrada.
5. **Refazer página** isolada, reusando as fichas de personagem.

---

## As três decisões que moldam tudo

### 1. Dois tipos de livro, escolhidos na primeira tela

| | livro de colorir | livro colorido |
|---|---|---|
| Ficha de personagem | traço preto | colorida — é ela que trava a paleta |
| Páginas | traço preto sobre branco | pintadas |
| Layout no PDF | margem branca, narração embaixo | sangria total, narração sobre a arte |
| Capa e contracapa | **coloridas** | coloridas |

A capa é colorida nos dois. É a única parte do livro de colorir que já vem
pintada.

### 2. Cada estilo carrega a própria paleta

O cliente **nunca** escolhe cor separadamente. O estilo diz como ele é desenhado
*e* como é colorido, no mesmo objeto (`ArtStyleDef` em `src/lib/catalog.ts`).
Super-herói sai em primárias saturadas, chibi em pastel leitoso, fine-line em
aguadas contidas. Se a cor fosse uma escolha à parte, ela poderia brigar com o
traço; assim não pode.

Há um terceiro campo, `coloringCaveat`, que só entra no livro de colorir. Três
estilos são sombreados na forma natural (cel, hachura, sombra de tinta) e uma
página de colorir não pode ter nada disso — mas essas retratações **contradizem
a paleta do próprio estilo**, então elas vivem separadas do `prompt` principal.
Sem isso, o livro colorido sai chapado.

### As especificações de estilo foram adaptadas de propósito

O cliente mandou cinco especificações. Várias pediam coisas que arruinariam o
produto, e foram adaptadas em vez de seguidas ao pé da letra. Está tudo
comentado no `src/lib/catalog.ts`; o resumo:

| Estilo | O que pedia | Por que não dava |
|---|---|---|
| `superhero-comic` | musculatura hiper-definida, maxilar angular | **o livro é sobre uma criança real, uma avó, um cachorro — anatomia de fisiculturista desenha outra pessoa.** O heroísmo migrou para postura, encenação e câmera, que não custam nada à semelhança |
| `superhero-comic` | blocos de preto, hachura cruzada | preenchem o que a criança ia colorir (hoje em `coloringCaveat`) |
| `superhero-comic` | grade de vinhetas | a página é uma ilustração só |
| `fine-line` | volume por hachura paralela | hachura é sombra, e sombra é o trabalho de quem colore (hoje em `coloringCaveat`) |
| `cartoon` | cel-shading em blocos, sombras projetadas | mesmo motivo (hoje em `coloringCaveat`) |
| `cartoon` | uma cena específica (cachorro, trilha, montanhas) | brigaria com a cena real de cada página; sobrou a receita de profundidade em camadas |
| `coloring-book` | mandala botânica | mandala não tem história dentro; o ornamento preenche **ao redor** dos personagens |

A primeira linha é a mais importante e a mais fácil de desfazer sem querer.
**Se alguém for "consertar" isso de volta, leia os comentários antes** — cada
adaptação existe por um motivo medido.

### 3. A capa é escolhida no meio do caminho

```
assistente → [fichas + 2 capas] → VOCÊ ESCOLHE → [páginas + contracapa] → PDF
```

A ordem é forçada dos dois lados: capa antes das fichas não bate com o livro, e
página antes da capa é trabalho que pode ser jogado fora. O custo é que o cliente
espera **duas vezes** em vez de uma — foi uma escolha consciente.

As duas opções são ideias diferentes de capa, não duas tentativas da mesma:
**retrato** (personagens grandes, olhando pra quem abre) e **cena** (momento
largo, personagens dentro do mundo).

---

## Fotos que viram página

Até 3 (`MAX_MEMORIES`). Não confundir com as fotos de referência do personagem:
aquelas ensinam um rosto, são usadas uma vez e nunca são impressas. Estas **são**
a página.

Duas coisas acontecem com a nota que o cliente escreve:

- vai para a **Claude**, que encaixa aquele momento onde a história chega nele —
  a página ganha narração e a seguinte reage;
- vai para o **modelo de imagem**, junto com a foto.

O ponto delicado é que a foto e as fichas chegam juntas ao modelo e disputam. A
hierarquia está declarada no prompt: **a foto manda na composição** (quem, pose,
enquadramento, momento), **a ficha manda na aparência** (rosto, cabelo, roupa,
proporção). A foto é enviada como primeira referência porque o prompt se refere a
ela nesses termos.

---

## O que foi medido de verdade

**Consistência de personagem — a estratégia funciona, mas atenção à procedência
da prova.** Gerar cada personagem uma vez como ficha e usar essa ficha como
referência em toda página mantém a pessoa reconhecível: validado num livro de 12
páginas **na Higgsfield**, o provedor antigo. No Google só foi verificado o
trecho ficha → capa, que saiu igual à ficha. **Um livro inteiro pelo Google
ainda não foi julgado por ninguém** — a estratégia é a mesma e o modelo por baixo
também, mas isso é dedução, não medição.

**Traço limpo — medido.** Método: máscara de pixels cinza, erodida em 5px; o que
sobrevive é sombreado real, o que some era antialiasing de borda.

| Métrica | Resultado |
|---|---|
| Cor vazando | 0,000% |
| Cinza sólido | 0,000% |
| Preto preenchido (contornos excluídos) | 0,000% a 0,044% |

Medido nas cinco amostras em traço de `public/styles/` e num livro de teste, todos
gerados pela Higgsfield. A única imagem do Google medida pelo mesmo método deu
0,000% nas três colunas.

**JPEG não estraga o traço.** O Gemini só devolve JPEG — a documentação diz que
aceita `image/png`, mas a API responde 400 nos quatro modelos. Medi o estrago: a
faixa de 2 a 6px em volta de cada contorno dá **0,000% não-branco**. Não há
ringing. É JPEG quase sem perda (~1,5 MB em 1792×2400). Se um dia o arquivo
encolher muito, é sinal de que começaram a comprimir — aí vale remedir.

**Capas coloridas a partir de ficha em preto e branco — funciona.** Era o risco
da feature e não se confirmou. As cores vêm das descrições escritas dos
personagens, que por isso vão no prompt junto com a ficha.

---

## O que ainda não foi visto por olho humano

- **A página vinda de foto.** O encanamento está testado (o smoke test tem uma
  memória e confere que o prompt certo foi usado), mas nenhuma foto real virou
  página ainda. É o único caminho do sistema que ninguém viu funcionando, e é
  também o mais incerto: a foto e a ficha disputam, e a hierarquia entre elas só
  existe no texto do prompt. Custa centavos testar.
- **Um livro inteiro gerado pelo Google**, em qualquer um dos dois acabamentos.
  Fichas, capas e páginas soltas já saíram; as 12 ou 32 páginas de uma vez, não.
- **O estilo `coloring-book`** — é o único dos cinco cuja amostra ninguém
  examinou de perto. Os outros quatro foram olhados nos dois acabamentos.

---

## Ambiente e custos

**Provedor:** Google, direto. `GEMINI_API_KEY` no `.env.local` (chave criada em
aistudio.google.com/apikey). Sem chave o app cai no **mock**: o fluxo inteiro
funciona e o PDF sai com molduras de prévia mostrando o prompt — é como se ajusta
história e layout sem gastar nada.

| | |
|---|---|
| Modelo | `gemini-3.1-flash-image` |
| Resolução | 2K, proporção 3:4 |
| Referências por chamada | até 14 (usamos no máximo 4) |
| Páginas em paralelo | 3 (`PAGE_CONCURRENCY`) |
| Custo por imagem | ~US$ 0,04 |
| Custo por livro de 12 páginas | ~US$ 0,55 de imagem + US$ 0,30 a 1,00 de texto |

**A Higgsfield saiu do projeto.** O endpoint público `/nano-banana` parou de
responder — está na especificação publicada deles, mas devolve o mesmo
`model_not_found` que um caminho inventado, e a referência da API deles diz que
os esquemas de modelo estão sendo redesenhados. O CLI ainda alcança o modelo
porque fala com **outro host**, não documentado e autenticado como pessoa. Nada
disso serve para um servidor.

O Nano Banana é modelo do Google; a Higgsfield revendia. Ir na fonte também tirou
duas amarras: as referências viajam como bytes dentro da requisição (nada que a
gente guarda precisa ser alcançável da internet) e a geração é uma chamada só, sem
job para consultar.

Sobrou uma conta Higgsfield com **48,38 créditos** e o CLI instalado na máquina —
úteis para experimentar no chat, inúteis para o app. São portas diferentes.

---

## Decisões que não devem ser desfeitas sem motivo

- **Idioma do livro ≠ idioma do site.** Perguntas e resumos saem no idioma do
  site (quem lê é o comprador); títulos e narração no idioma do livro (vão
  impressos); descrições de cena **sempre em inglês**, porque quem lê é o modelo.
- **Ficha de personagem antes de tudo.** Sustenta a consistência e torna barato
  refazer uma página só.
- **O título vem depois da escolha da história**, para as sugestões nascerem
  daquela história.
- **O provider é plugável** (`google` | `mock`). O mock não é enfeite.
- **As amostras de estilo são fixas e versionadas.** Dez arquivos em
  `public/styles/` — cinco em traço, cinco coloridas, todas na mesma cena. O site
  nunca as gera em tempo de execução, senão a vitrine deixa de ser promessa. Para
  refazer: `npx tsx scripts/make-colour-samples.ts [estilo]`.

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
npx tsx scripts/smoke-pdf.ts            # fluxo de colorir, do roteiro ao PDF, sem gastar
npx tsx scripts/smoke-pdf.ts coloured   # o mesmo, no livro colorido
npx tsx scripts/test-google.ts          # uma imagem real, confere a integração
npx tsx scripts/test-covers.ts          # as 2 capas + contracapa, de verdade
npx tsx scripts/make-colour-samples.ts  # regera as amostras coloridas do assistente
```

---

## Próximos passos, em ordem

1. Gerar uma página a partir de uma foto real e olhar o resultado.
2. Gerar um livro inteiro de verdade nos dois fluxos e julgar a consistência.
3. Ajustar prompts conforme o que aparecer (`src/lib/ai/prompts.ts` para texto,
   `src/lib/images/prompt.ts` para desenho).
4. Fase 2: pagamento (Stripe) e envio para a gráfica.
5. Antes de produção: trocar `lib/store.ts` e `lib/storage.ts` por Postgres e blob
   storage, e mover a renderização para uma fila (32 páginas estouram o timeout de
   função serverless).
