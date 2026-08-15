# Onde o projeto está

Snapshot para retomar o trabalho numa sessão nova. Leia junto com o `README.md`,
que explica o produto e a arquitetura.

**Branch:** `claude/personalized-coloring-book-generator-ufe6lv`
**Último commit:** veja `git log -1`

---

## O que já funciona

O fluxo inteiro, do brief ao PDF:

1. **Wizard** — idioma do livro → modelo de imagem → ocasião → tipo de história →
   tom → estilo do desenho → tamanho → personagens (até 3 fotos cada) → lugar →
   entrevista → escolha entre 4 histórias → título.
2. **Claude API** escreve as perguntas da entrevista (em blocos temáticos, com 3
   sugestões clicáveis cada), as 4 ideias, os 3 títulos e o roteiro página a página.
3. **PDF A4** com capa, dedicatória, páginas ilustradas e contracapa.
4. **Refazer página** isolada, reusando as fichas de personagem.

Tudo verificado: TypeScript, lint e build limpos; `scripts/smoke-pdf.ts` roda a
metade de baixo da pipeline sem gastar nada.

---

## O que falta — comece por aqui

### 1. Baixar as imagens de exemplo dos estilos (30 segundos, no Mac)

```bash
cd ~/new && git pull && ./scripts/fetch-style-samples.sh
git add public/styles && git commit -m "Add the fixed art style samples" && git push
```

O wizard mostra um desenho de exemplo embaixo de cada estilo. As imagens já
foram geradas — o script só baixa. **Sem isso os cards aparecem com o quadro
branco vazio** (o layout não quebra, mas fica sem graça).

Por que não estão no repositório ainda: a sessão do Claude que as gerou roda num
container cujo proxy **bloqueia o CDN da Higgsfield** (`d8j0ntlcm91z4.cloudfront.net`,
403 na política de rede do ambiente). O Mac não tem esse bloqueio. Dá para
liberar em claude.ai/code → Settings → Environments → Network access, mas para
cinco arquivos não compensa.

### 2. Credenciais do Higgsfield

Os endpoints já estão no código, tirados do OpenAPI oficial
(`docs.higgsfield.ai/docs/openapi.json`), não adivinhados. Vivem em
`src/lib/catalog.ts`. Base: `https://platform.higgsfield.ai`.

```bash
echo 'HIGGSFIELD_CREDENTIALS=KEY_ID:KEY_SECRET' >> .env.local
npx tsx scripts/test-higgsfield.ts
```

Sem credencial o app roda em **modo mock**: o fluxo inteiro funciona e o PDF é
gerado, mas com molduras de prévia no lugar dos desenhos — cada uma mostrando o
prompt que teria sido enviado.

### Os endpoints de imagem que existem de verdade

| Endpoint | Referências | Serve? |
|---|---|---|
| `/nano-banana` | `input_images[]`, até 8 | **Sim** — o único que aceita várias fichas |
| `/higgsfield-ai/soul/reference` | `image_reference_url`, 1 | Só para livro de um personagem |
| `/reve/remix` | `image_urls[]`, **mín. 2** | Não — o mínimo de 2 quebra o caso de 1 personagem |
| `/reve/edit`, `/higgsfield-ai/soul/character` | 1 | Igual ao soul |
| `/flux-pro/kontext/max/text-to-image`, `/reve/text-to-image` | nenhuma | Não — sem referência não há consistência |

**Não existe endpoint de GPT/OpenAI na API pública.** O `gpt_image_2` que aparece
no MCP não é exposto via REST — uma opção de modelo baseada nele daria 404.

Detalhes do schema que importam e não são óbvios:
- `/nano-banana` devolve **jpeg por padrão**; pedimos `output_format: png`, porque
  o ringing do JPEG vira franja cinza exatamente em cima do contorno preto.
- `soul/reference` tem `enhance_prompt: true` por padrão, que reescreve o prompt
  no servidor e pode desfazer as restrições de "sem sombra, sem cinza". Mandamos
  `false`.

---

## Os cinco estilos

`chibi`, `coloring-book`, `superhero-comic`, `fine-line` (Moderno Elegante) e
`cartoon`. Cada um é uma **especificação inteira**, não uma frase — formas,
proporções, rosto, corpo, linhas. Isso não é capricho: com uma frase só, o modelo
volta para a ideia genérica dele de "fofo" ou "quadrinho". Medido no chibi, onde
a frase curta desenhava **pupilas pretas chapadas** e a especificação não.

Todos os cinco foram gerados de verdade e medidos: **0,000% de cor e 0,000% de
cinza nos cinco**; preto preenchido entre 0,000% e 0,088%.

### Três especificações foram adaptadas de propósito

O cliente mandou as cinco especificações. Três pediam coisas que **arruínam uma
página de colorir**, e foram adaptadas em vez de seguidas ao pé da letra. Está
tudo comentado no `src/lib/catalog.ts`, mas o resumo:

| Estilo | O que pedia | Por que não dava |
|---|---|---|
| `superhero-comic` | blocos de preto puro, hachura cruzada, grade de vinhetas | preenchem o que a criança ia colorir; e a página é uma ilustração só |
| `superhero-comic` | musculatura hiper-definida, maxilar angular | o livro é sobre uma criança real, uma avó, um cachorro — anatomia de fisiculturista desenha outra pessoa |
| `fine-line` | volume por hachura paralela fina | hachura é sombra, e sombra é o trabalho de quem colore |
| `cartoon` | cel-shading em blocos, sombras projetadas | mesmo motivo |
| `cartoon` | uma cena específica (cachorro, trilha, montanhas angulares) | brigaria com a cena real de cada página; sobrou só a receita de profundidade em camadas |
| `coloring-book` | mandala botânica | mandala não tem história dentro; o ornamento agora preenche **ao redor** dos personagens |

**Se alguém for "consertar" isso de volta, leia os comentários antes.** Cada
adaptação existe por um motivo medido.

### Uma decisão em aberto

Os cinco exemplos usam **a mesma cena** (menina + cachorro + papagaio), o que é
ótimo para comparar estilos lado a lado — mas deixa o `superhero-comic` sem
graça, porque a cena é uma caminhada tranquila. A alternativa é gerar o exemplo
do super-herói numa cena de ação e abrir mão da comparação direta. Não decidido.

---

## Medições que valem guardar

| | nano_banana_2 | gpt_image_2 (high/2k) |
|---|---|---|
| Tempo por página | ~40s | ~100s |
| Resolução | 1792×2400 | 1744×2336 |

(Medido via MCP. O `gpt_image_2` fica aqui só como registro — não dá para usá-lo
no app, porque não tem endpoint REST.)

O plano **starter da Higgsfield limita 4 jobs simultâneos**. A concorrência do
app é 3 (`PAGE_CONCURRENCY` em `src/lib/render.ts`) — abaixo do teto. Se subir de
plano, é o número a mexer.

Custo estimado da parte de texto: US$ 0,30 a 1,00 por livro (não medido em
produção; estimativa pelo tamanho das 3 chamadas com Opus 5 e raciocínio
adaptativo).

---

## Decisões que não devem ser desfeitas sem motivo

- **Idioma do livro ≠ idioma do site.** São campos separados. Perguntas e resumos
  saem no idioma do site (quem lê é o comprador); títulos e narração no idioma do
  livro (vão impressos); descrições de cena **sempre em inglês**, porque quem lê é
  o modelo de imagem.
- **Ficha de personagem antes das páginas.** É o que sustenta a consistência e o
  que torna barato refazer uma página só.
- **O título vem depois da escolha da história**, para as sugestões nascerem
  daquela história.
- **O provider de imagem é plugável** (`higgsfield` | `mock`). O mock não é
  enfeite: é como se ajusta história e layout sem gastar crédito.

---

## Ambiente — duas armadilhas

**1. Sessão remota vs local.** Se a sessão rodar num container na nuvem, ela *não*
enxerga o Mac do usuário: não lê o `.env.local`, não abre `docs.higgsfield.ai` e
não baixa as imagens do CDN da Higgsfield (bloqueado pelo proxy). O fluxo vira
`push` → o usuário faz `pull`. Uma sessão local no Mac não tem nenhuma dessas
limitações. Cheque com `pwd`: `/Users/...` é local, `/home/user/...` é remoto.

**2. As imagens geradas via MCP não servem para o app.** O MCP do Higgsfield é uma
ponte da sessão de chat; o app precisa da API REST. São caminhos diferentes.

---

## Próximos passos, em ordem

1. **Rodar `./scripts/fetch-style-samples.sh`** e comitar `public/styles/` (ver o
   topo deste documento).
2. Pôr `HIGGSFIELD_CREDENTIALS` no `.env.local` e gerar o primeiro livro real.
3. Julgar com olho humano: a consistência dos personagens no PDF-amostra, e se os
   cinco estilos agradam. Só a métrica de traço limpo está validada — gosto, não.
4. Decidir a cena de exemplo do `superhero-comic` (ver "Uma decisão em aberto").
5. Ajustar prompts conforme o que aparecer (`src/lib/ai/prompts.ts` para texto,
   `src/lib/images/prompt.ts` para desenho).
6. Fase 2: pagamento (Stripe) e envio para a gráfica.
7. Antes de produção: trocar `lib/store.ts` e `lib/storage.ts` por Postgres e blob
   storage, e mover a renderização para uma fila (32 páginas estouram o timeout de
   função serverless).
