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

## O que falta

**Só as credenciais do Higgsfield.** Os endpoints já estão no código.

Foram tirados do OpenAPI oficial (`docs.higgsfield.ai/docs/openapi.json`), não
adivinhados, e vivem em `src/lib/catalog.ts`. Base: `https://platform.higgsfield.ai`.

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

## O que foi validado de verdade

**Consistência de personagem — funciona.** A estratégia é gerar cada personagem
**uma vez** como ficha de traço (3 vistas) e depois passar essa ficha como
referência em toda página. Testado com um livro real de 12 páginas.

**Traço limpo — medido, não achismo.** Analisei os 12 PNGs em resolução cheia:

| Métrica | Resultado |
|---|---|
| Cor vazando | 0,00% nas 12 páginas |
| Cinza sólido (sombreado) | 0,000% em 11 páginas, 0,005% em 1 |

O método: máscara dos pixels cinza, erodida em 5px. O que sobrevive é sombreado
real; o que some era antialiasing de borda de linha. Sumiu tudo — ou seja, as
restrições negativas do prompt (`no shading, no grey tones, no filled black
areas`) estão funcionando.

**Livro-amostra pronto** (12 páginas, bilíngue EN/PT, personagens Thomas e Zeca):
`https://d2ol7oe51mr4n9.cloudfront.net/user_3GNFAU3bl7JWf8AKSp5WZTLExyW/4240c017-9b91-4d84-bca7-8d9a246ad676.pdf`

**Estilo `kawaii` — validado.** O prompt dele não é uma frase, é uma
especificação inteira (formas, proporções, cabeça, rosto, corpo, cabelo, roupa,
linhas). Testado numa geração real: cabeça esférica sem queixo, rosto baixo,
pupilas em contorno e não preenchidas, mãos de luva. Métricas da página:

| Métrica | Resultado |
|---|---|
| Cor | 0,000% |
| Cinza sólido | 0,000% |
| Preto preenchido | 0,006% (ruído) |

Vale a pena guardar por quê: sem a especificação o modelo volta para "cartoon
fofo genérico", e as pupilas saem preenchidas de preto — que é o defeito que
estraga uma página de colorir. Na ficha de personagem, onde o rosto é grande, o
preenchimento ainda aparece (0,13%), mas a ficha nunca é impressa: ela só serve
de referência, e a página sai limpa.

**Ainda não julgado por humano:** se os personagens *parecem* os mesmos ao longo
das 12 páginas, e os outros três estilos (`storybook`, `bold-simple`,
`detailed-doodle`) — só `classic-cartoon` e `kawaii` foram testados a fundo.

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

1. Pôr `HIGGSFIELD_CREDENTIALS` no `.env.local` e gerar o primeiro livro real.
2. Julgar a consistência dos personagens no PDF-amostra e nos estilos.
3. Ajustar prompts conforme o que aparecer (`src/lib/ai/prompts.ts` para texto,
   `src/lib/images/prompt.ts` para desenho).
4. Fase 2: pagamento (Stripe) e envio para a gráfica.
5. Antes de produção: trocar `lib/store.ts` e `lib/storage.ts` por Postgres e blob
   storage, e mover a renderização para uma fila (32 páginas estouram o timeout de
   função serverless).
