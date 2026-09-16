# Oito histórias para a prateleira

Propostas, não código. Nada aqui foi implementado — é para você ler, cortar e
aprovar. Quando aprovar, cada história vira uma entrada no catálogo no mesmo
formato de `src/lib/baby-stories.ts`: molde fixo, elenco escalado a partir de
quem o cliente nomeou, perguntas escritas à mão.

---

## 1. O que os americanos fazem, e o que dá para roubar

Olhei Wonderbly, Hooray Heroes, Leo Books, First Time Books, KD Novelties,
I See Me e Shutterfly. Três coisas valem, uma não.

**Vale: eles vendem um título, não um gerador.** A home deles é uma prateleira
de livros com capa, nome e faixa etária. A nossa é um botão que diz "faça um
livro". Quem compra presente quer ver o presente antes — e uma prateleira
também é uma promessa que dá para cumprir, enquanto "a gente inventa uma
história para você" é uma promessa que depende do modelo acertar naquele dia.

**Vale: a personalização É o enredo, não um campo preenchido.** O melhor livro
do setor é o *Incredible Intergalactic Journey Home* da Wonderbly: a criança
está perdida no espaço e precisa achar a própria casa — com o endereço real,
visto de cima. O nome da criança aparecer na página é decoração; o endereço
dela ser o problema da história é outra categoria de produto. Toda história
aqui embaixo tem um campo do brief que é a engrenagem, não o enfeite.

**Vale: eles resolvem uma ansiedade, não uma data.** Os títulos que mais
vendem são transições — irmão novo, primeiro dia de aula, penico, mudança,
médico. A ocasião é a desculpa de compra; a ansiedade é o motivo.

**Não vale: o tom deles.** "Você vai ser um irmão mais velho incrível", em
rima, para 2 a 5 anos. É declaração de sentimento, que é exatamente o que o
`prompts.ts` deste projeto já proíbe ("se a frase pode ser trocada por 'eles
se amavam muito', está escrita errado"). E a versão de férias deles é lista de
monumentos — o erro de "e aí, e aí, e aí" que o teste do `mas`/`portanto` pega.
Não copiamos.

Fontes: [Wonderbly – A New Sibling For You](https://www.wonderbly.com/personalized-products/new-sibling-for-you-book),
[Hooray Heroes – siblings](https://hoorayheroes.com/personalized-books/siblings),
[Hooray Heroes – dinossauro](https://hoorayheroes.com/personalized-book/violets-dinosaur-playdate),
[Leo Books – life events](https://www.leo-books.com/books/life-events),
[First Time Books](https://firsttimebooks.com/),
[KD Novelties](https://www.kdnovelties.com/personalized-books),
[I See Me – road trip](https://www.iseeme.com/en-us/my-usa-roadtrip-personalized-storybook.html).

### Ocasiões que eles usam e você não pediu

Em ordem do que eu colocaria numa segunda rodada:

| Ocasião | Por que entra | Por que não agora |
|---|---|---|
| **Primeiro dia de aula** | as três casas americanas têm, e é a segunda maior ansiedade da infância depois do irmão novo | precisa de um molde novo inteiro; é o primeiro da lista da rodada 2 |
| **Mudança de casa** | mesma mecânica de lugar real que já faz o livro do bebê funcionar | idem |
| **O dente que caiu** | data marcada, presente barato, e tem folclore brasileiro próprio (o rato, não a fada) | ocasião pequena demais para abrir a rodada |
| **Natal / avós / Dia das Mães** | sazonal, é onde eles ganham dinheiro | é calendário, não transição — a história fica fraca |
| **Penico, médico, primeiro corte de cabelo** | vendem | idade baixa demais para um livro de colorir de 24 páginas |

**Uma coisa que eles têm e nós não:** livro de **irmãos** (dois ou três filhos
juntos, sem bebê nenhum envolvido). A Hooray Heroes vende isso separado e é um
dos carros-chefe deles. Nosso produto já aceita 3 personagens — é a ocasião
mais barata de abrir que existe aqui.

---

## 2. O fluxo repensado

### A regra que amarra tudo: 12 batidas, 24 quadros

Uma história serve os dois produtos porque ela é escrita em **12 batidas**, e
cada batida se abre em **dois quadros**:

```
livro de leitura     batida 1 → [imagem]  [texto]     = 12 imagens + 12 páginas de texto
livro de colorir     batida 1 → [quadro A][quadro B]  = 24 desenhos, zero texto
```

O quadro A é o gesto, o quadro B é a consequência. Nunca o mesmo momento em
dois planos — isso faz a página repetir em vez de andar. Quem vira a página do
livro de colorir tem que entender que o tempo passou, sem ler nada.

Três regras que toda história abaixo obedece, e que dá para conferir:

1. **Uma mudança visível por par.** A mão fechada vira mão aberta. A porta
   fechada vira porta aberta. O pacote vira pacote vazio. Se a diferença entre
   A e B for só o ângulo da câmera, o par está errado.
2. **Mesmo cenário dentro do par.** A troca de lugar acontece entre batidas,
   não dentro delas — senão a criança perde o fio.
3. **A virada é um par inteiro, e é a única batida que pode ser silenciosa.**
   Na batida 9 de quase todas elas, A é a decisão na cara e B é a mão fazendo.

### O assistente encolhe de 12 para 9 telas

| Hoje | Depois | Por quê |
|---|---|---|
| tipo de livro | tipo de livro | — |
| faixa etária (só leitura) | **faixa etária (os dois)** | sem texto, a idade passa a decidir a **grossura do traço e a densidade do desenho** — uma página fine-line é impintável para uma criança de 3 anos. Hoje o colorir não pergunta idade nenhuma |
| idioma do livro | idioma do livro | sobra só para o título, a dedicatória e a contracapa — o miolo do colorir não tem uma palavra |
| ocasião | ocasião | vira **filtro da prateleira**, não mais um campo de prompt |
| tipo de história | ~~morre~~ | o molde já é a forma |
| tom | ~~morre~~ | o molde já é a voz |
| estilo do desenho | estilo do desenho | — |
| tamanho | tamanho | — |
| personagens | personagens | — |
| — | **escolha da história** | o centro novo do fluxo |
| lugar | lugar | — |
| entrevista (perguntas geradas) | **perguntas da história** (escritas à mão, 3 a 5, obrigatórias) | — |
| escolha entre 4 ideias | ~~morre~~ | — |
| título | título | — |

**Duas chamadas de modelo morrem inteiras:** `generateIdeas` e as perguntas de
entrevista geradas. Some junto a maior fonte de defeito estrutural do produto —
história sem virada, irmão que a família não tem, bicho que aparece na página 10
sem ter sido estabelecido na 1.

### A prateleira sobe para a home

Copiando a lógica deles e resolvendo uma tensão que já está comentada no
`Wizard.tsx`: a escolha da história precisa vir **depois** do elenco, senão a
tela renderiza vazia (uma história que precisa de um irmão mais velho não pode
ser oferecida para uma família que não tem). Mas uma prateleira é a melhor
vitrine que esse produto pode ter.

A saída: a home mostra os oito livros como **vitrine** (capa, logline, e um
selo "precisa de um irmão mais velho"). Quem clica entra no assistente já com
aquela história pré-selecionada. No passo da escolha, a lista é refiltrada pelo
elenco de verdade — se a escolhida continuar válida, ela já vem marcada e a
tela é uma confirmação de um clique; se não, ela aparece explicando por quê.

### O que muda embaixo (para dimensionar, não para fazer agora)

- `BabyStoryDef` vira `StoryDef`, com `beats` passando de `string[]` para
  `{ text, frameA, frameB }[]`.
- O storyboard do livro de colorir emite **24 painéis**, não 12.
- `bookSheets` ganha o par colorir: dois `picture` por batida, nenhum `text`.
- O PDF do colorir vira espelho do de leitura — hoje ele é imagem com margem e
  narração embaixo ([`build.ts`](src/lib/pdf/build.ts)).
- **Custo:** o livro de colorir sai de ~US$ 0,55 para ~US$ 1,00 de imagem. O de
  leitura não muda. As 24 páginas em paralelo de 3 em 3 encostam no timeout de
  função serverless — já está na lista de "antes de produção" do `ESTADO.md`.

---

## 3. As oito histórias

Duas por ocasião, e as duas de cada par são de espécies diferentes de
propósito: uma terna e uma cômica, ou uma do mundo real e uma de invenção
grande. Assim a escolha é escolha, e não duas versões da mesma coisa.

Notação dos quadros: **A** é o gesto, **B** é a consequência.
`[COLCHETES]` é campo preenchido pelo brief ou por uma das perguntas.

---

### ANIVERSÁRIO 1 — *Um Bilhete Por Ano*

> Ela acorda e ninguém canta parabéns. Tem um envelope no chão, com uma letra
> que ela não conhece, e um lugar escrito dentro.

**Resumo.** Uma trilha de bilhetes atravessa a cidade, e em cada parada tem um
objeto de um ano da vida dela: o sapato que serviu, a caneca com a marca do
dente. Ela junta a própria vida numa sacola até chegar na última parada, que
está vazia — porque o ano que começa hoje ainda não tem objeto, e quem deixa é
ela.

**O desejo.** Chegar no fim da trilha, porque quem montou aquilo sabe coisas
dela que ela nem lembra.
**A virada (batida 9).** O último pacote está vazio de propósito, e o preço de
fechar a trilha é dar a coisa que ela trouxe no bolso sem pensar.

**Elenco.**
- `O QUE ESCONDEU` — adulto da casa. *Opcional.* Sem ele, ninguém assume a
  trilha até a última página, o que melhora a história em vez de piorar.
- `O COMPANHEIRO` — outra criança ou o bicho da família. *Opcional.* Sozinha,
  os bilhetes são a companhia, e a batida 6 troca de mecanismo (ela mesma
  lembra, em vez de alguém contar).

**Perguntas.** Três ou quatro lugares reais que a família frequenta *(obrigatória)*
· uma coisa que ela não largava quando era bem pequena *(obrigatória)* · o que
ela carrega para todo lado hoje *(obrigatória — é o objeto da batida 10)* · quem
estaria na festa.

**As doze batidas.**
1. A casa quieta demais, e um envelope no chão com o nome dela.
   **A** o quarto vazio e o envelope · **B** ela de joelhos, lendo a letra estranha
2. O bilhete não diz feliz aniversário. Diz um lugar. **Portanto** ela sai.
   **A** ela franzindo a testa no papel · **B** o tênis sendo calçado na porta
3. No `[LUGAR 1]`, um pacote amarrado: um sapatinho que não serve em ninguém daquela casa.
   **A** ela procurando · **B** o sapato minúsculo ao lado do pé dela
4. Ela entende o jogo — é um objeto por ano. **Portanto** ela corre, agora contando.
   **A** comparando sapato e pé · **B** correndo, o sapato no bolso
5. `[LUGAR 2]`: a caneca com a marca dos dentes dela. Quem guardou isso guardou tudo.
   **A** puxando o pacote de trás de alguma coisa · **B** a marca de mordida, bem perto
6. `[LUGAR 3]`: um objeto que ela não reconhece, **mas** `O COMPANHEIRO` reconhece e conta.
   **A** ela confusa com a coisa na mão · **B** a história sendo contada, ela rindo
7. A sacola já está pesada. Ela está carregando a própria vida nas costas.
   **A** a sacola cheia · **B** ela ajeitando no ombro, medindo a rua que falta
8. `[LUGAR 4]`, o último pacote da trilha. Está vazio.
   **A** a mão chegando no pacote fechado · **B** o pacote aberto, nada dentro
9. **A virada.** O bilhete diz que este ano ainda não tem objeto, e que ela tem que deixar um. Ela só tem `[A COISA QUE ELA CARREGA]`, no bolso.
   **A** o bilhete aberto nas duas mãos · **B** a mão no bolso, fechada em volta da coisa
10. Ninguém está mandando. Ela põe a coisa dentro e amarra.
    **A** a coisa entrando no pacote · **B** as mãos dando o nó
11. O último bilhete manda levar o pacote para casa. **Portanto** ela volta, mais leve e mais pesada.
    **A** ela de costas, o pacote debaixo do braço · **B** a rua de casa aparecendo
12. A casa está cheia, e cada pessoa está segurando um ano dela. Na mesa tem um lugar vazio, marcado com o ano que vem.
    **A** a porta abrindo, todo mundo com um objeto na mão · **B** o pacote dela aberto na mesa, e o lugar vazio ao lado

**Elenco que sobrou.** Quem não virou `COMPANHEIRO` está na batida 12,
segurando um objeto, um por pessoa.

---

### ANIVERSÁRIO 2 — *O Caso da Porta Fechada*

> Todo mundo está agindo normal demais. Ela abre uma investigação.

**Resumo.** Ela junta provas de que estão escondendo alguma coisa — a porta que
nunca fecha, fechada; farinha na manga de quem jurou não ter cozinhado; o
cachorro saindo do quarto com fita no pelo. Ela resolve o caso rápido demais,
e descobre que a festa dos outros é a cara que ela vai fazer. Então ela fecha o
caderno e vai ensaiar a surpresa na vitrine.

**O desejo.** Descobrir o que estão escondendo (ela acha que esqueceram).
**A virada (batida 9).** Ela resolve o caso na rua, sozinha, e escolhe fingir.

**Elenco.**
- `O SUSPEITO` — um adulto da casa. **Obrigatório.** Sem ele não há quem
  esconda: a história sai da prateleira de uma família com um personagem só,
  do mesmo jeito que `canTell` já filtra hoje.
- `O CÚMPLICE` — o bicho da família, que sabe e não conta, e atravessa a porta
  fechada. *Opcional.* Sem bicho, o cúmplice é a casa: os barulhos que param
  quando ela chega.

**Perguntas.** O jeito dela de descobrir as coisas *(obrigatória — escuta atrás
da porta? revira armário? interroga?)* · quem ela queria muito que aparecesse na
festa *(obrigatória — é a surpresa de verdade da batida 12)* · uma comida que
só aparece em festa nessa casa · o que ela mais quer de presente.

**As doze batidas.**
1. Dia do aniversário. Ninguém fala nada e todo mundo está normal demais.
   **A** a mesa do café, todo mundo natural · **B** ela olhando de lado, já desconfiada
2. Primeira prova: a porta dos fundos, que nunca fica fechada, está fechada.
   **A** o corredor com a porta fechada no fim · **B** a orelha dela na porta
3. Ela pergunta o que tem lá. Dizem "nada". **Portanto** ela sabe que tem tudo.
   **A** o adulto plantado na frente da porta, sorrindo demais · **B** ela anotando no caderno
4. Segunda prova: farinha na manga de quem disse que não cozinhou.
   **A** o abraço · **B** a mancha branca na manga, bem perto
5. Terceira: `O CÚMPLICE` sai do quarto com uma fita colorida no pelo.
   **A** a porta abrindo uma fresta · **B** o bicho passando com a fita
6. O caso está montado, **mas** falta o motivo: se é festa, por que ninguém deu parabéns?
   **A** o caderno com as três provas desenhadas · **B** ela mordendo o lápis
7. Mandam ela sair de casa com uma desculpa ruim. **Portanto** ela tem certeza.
   **A** o adulto apontando a rua, a desculpa na cara · **B** ela saindo, olhando por cima do ombro
8. Na calçada, cruza com `[UM CONVIDADO]` indo na direção contrária, com um pacote mal escondido.
   **A** os dois se cruzando · **B** o pacote debaixo do braço, óbvio
9. **A virada.** Ela resolveu cedo demais. Se chegar sabendo, acaba a festa de todo mundo — porque a festa deles é a cara dela. Ela fecha o caderno.
   **A** ela parada na calçada, caderno aberto · **B** o caderno fechado, enfiado no bolso
10. Ela ensaia a cara de surpresa na vitrine. Fica péssima. Ensaia de novo.
    **A** a cara horrível no reflexo · **B** a segunda tentativa, quase boa
11. Volta. A porta de casa está fechada. Ela bate.
    **A** a porta · **B** a mão dela batendo, os pés juntinhos
12. Todo mundo grita, e ela faz a melhor atuação da vida — **mas** no meio dela a surpresa vira de verdade, porque `[QUEM ELA QUERIA QUE VIESSE]` está ali.
    **A** a explosão de gente e cor · **B** a cara dela, de verdade agora, olhando para a pessoa que ela não previu

**Elenco que sobrou.** Todo mundo é suspeito na primeira metade e está na sala
na batida 12. Ninguém fica de fora — é uma história de casa cheia.

---

### AVENTURA / ESPAÇO — *Nunca Solte a Corda*

> `[A COISA QUE A FAMÍLIA OLHA NO CÉU]` não está lá hoje. Então eles vão buscar.

**Resumo.** Amarrados um no outro por uma corda, com uma regra dita em voz alta
na primeira página, eles sobem atrás da estrela que apagou. A corda é curta
por um braço. Ela desamarra o nó.

**O desejo.** Acender de novo a coisa que os dois olham juntos todas as noites.
**A virada (batida 9).** A regra do livro inteiro é quebrada de propósito, e é
a coisa certa a fazer.

**Elenco.**
- `O OUTRO LADO DA CORDA` — qualquer personagem nomeado, pessoa ou bicho.
  *Opcional na forma, obrigatório na função.* Se a criança for o único
  personagem, a outra ponta é amarrada na janela de casa, e a batida 11 vira a
  casa inteira puxando ela de volta. Funciona, e fica mais solitária — o que é
  honesto.

**Perguntas.** Tem alguma coisa no céu que vocês olham juntos? *(obrigatória —
a lua, uma estrela, o avião das sete)* · de onde vocês olham *(obrigatória —
janela, quintal, laje, calçada)* · do que ela tem medo no escuro · o que ela
leva para todo lugar.

**As doze batidas.**
1. Toda noite eles olham `[A COISA NO CÉU]` da `[JANELA]`. Hoje não tem nada lá.
   **A** os dois apontando para cima · **B** o céu vazio e o dedo apontando para nada
2. Ela quer subir. **Portanto** amarram a corda: uma ponta nela, a outra em `O OUTRO LADO`. A regra é dita em voz alta.
   **A** o nó no pulso dela · **B** a outra ponta sendo amarrada
3. Sobem. A casa fica pequena, e depois a rua inteira.
   **A** os telhados do bairro · **B** a cidade inteira, com a casa marcada
4. Primeira parada: um lugar onde tudo flutua, inclusive o que caiu do bolso das pessoas. Nenhuma das coisas é a estrela.
   **A** chegando no meio das coisas flutuando · **B** ela pegando uma e vendo que não é
5. A corda começa a ficar curta. Eles trocam de posição — ela vai na frente. **Mas** a regra continua.
   **A** a corda esticada · **B** os dois trocando de lugar no ar
6. Segunda parada: uma poeira que apaga tudo o que atravessa. Foi ela que apagou a estrela.
   **A** a nuvem escura chegando · **B** a mão dela sumindo dentro da poeira
7. Do outro lado, a estrela está lá: apagada, do tamanho de uma bola, esperando.
   **A** a poeira abrindo · **B** a estrela apagada e quieta
8. E está longe demais. A corda acaba um braço antes.
   **A** o braço esticado, a mão a um palmo · **B** a corda retesada no pulso, sem sobra
9. **A virada.** Ela olha para `O OUTRO LADO` e desamarra o nó.
   **A** o rosto do outro, do outro lado da corda · **B** o nó abrindo, a corda solta
10. Ela alcança, e a estrela acende na mão dela — **mas** agora ela está solta.
    **A** a mão fechando na estrela · **B** a luz acendendo, e ela sozinha no escuro
11. A corda chega nela. `O OUTRO LADO` não esperou: veio junto. Nunca foi a corda que segurava.
    **A** a corda voando com alguém atrás · **B** os dois de mãos dadas, a estrela entre eles
12. Descem e penduram a estrela de volta. Da `[JANELA]`, de baixo, está exatamente onde sempre esteve.
    **A** os dois pendurando · **B** a janela de casa vista de longe, e a estrela acesa acima dela

**Elenco que sobrou.** Fica em casa, na janela, e aparece nos quadros 1, 3 e 12
olhando para cima — é como a distância percorrida fica visível.

---

### AVENTURA / DINOSSAURO — *O Bicho Embaixo de Casa*

> A pá bate em coisa dura. É um osso, e é grande demais para qualquer bicho que
> mora ali.

**Resumo.** Quanto mais fundo ela cava, mais o bairro vira o que era antes: a
praça é um brejo com o mesmo formato, a ponte é um tronco caído no mesmo lugar.
Ela quer uma prova para levar. Sobe no ponto mais alto para achar o caminho de
volta e vê que a colina onde a casa dela fica não é uma colina — é uma costela.

**Por que essa é a vitrine do livro de colorir.** A estrutura de dois quadros
**é** a história: o quadro A é o lugar hoje, o quadro B é o mesmo enquadramento
com o bicho dentro. Vinte e quatro páginas em que o bairro da criança aparece
doze vezes e o mundo de antes aparece doze, sempre encaixados.

**O desejo.** Provar. Levar de volta uma coisa que `O QUE NÃO ACREDITA` não
consiga explicar.
**A virada (batida 9).** O que ela estava procurando embaixo da terra é a
própria terra: o bairro inteiro está deitado em cima do bicho.

**Elenco.**
- `O QUE NÃO ACREDITA` — adulto ou outra criança. *Opcional.* Sem ele, a
  dúvida é dela mesma, e a batida 12 vira ela decidindo se conta para alguém.
- `O QUE CAVA JUNTO` — o bicho da família, escalado obrigatoriamente se
  existir. *Opcional.* Sem bicho, é uma pá emprestada que ela não devolve.

**Perguntas.** Onde ela cava ou brinca no chão *(obrigatória — quintal, praça,
praia, terreno)* · três ou quatro lugares do bairro que dá para desenhar
*(obrigatória)* · qual é o dinossauro favorito dela *(obrigatória)* · quem
duvida das histórias dela.

**As doze batidas.**
1. Ela cava no `[LUGAR]` como sempre, **mas** hoje a pá bate em coisa dura.
   **A** ela cavando, um dia comum · **B** a pá parada, e a cara dela
2. É um osso, e é grande demais para qualquer bicho dali.
   **A** o osso saindo da terra · **B** o osso ao lado do braço dela, comparando
3. Ela mostra para `O QUE NÃO ACREDITA`. Dizem que é de boi. **Portanto** ela volta a cavar.
   **A** o osso estendido, o adulto de lado · **B** ela voltando, pá no ombro
4. Cava mais fundo — e quando levanta a cabeça, a `[PRAÇA]` não está mais lá. No lugar tem um brejo, com o mesmo formato.
   **A** a praça de hoje · **B** o mesmo enquadramento, brejo, uma cauda ao fundo
5. Ela anda pelo bairro que virou outro. A `[PONTE]` agora é um tronco caído, e dá para atravessar igual.
   **A** a ponte de hoje · **B** o tronco, no mesmo lugar
6. `O QUE CAVA JUNTO` não tem medo nenhum e dispara na frente, o que é péssimo.
   **A** o bicho disparando · **B** ela correndo atrás, e o que tem adiante
7. Ela encontra o `[DINOSSAURO FAVORITO]` de perto. Ele não está caçando: está cavando também.
   **A** o bicho enorme de costas, cavando · **B** os dois, cada um com seu buraco
8. Ela quer a prova. Pega um dente do chão.
   **A** o dente na terra · **B** o dente na mão dela, fechada
9. **A virada.** Ela sobe no ponto mais alto para se achar, olha para trás, e a colina da casa dela não é colina. É costela. O bairro inteiro está em cima de um bicho só.
   **A** ela subindo, de costas · **B** o plano aberto: a colina com a forma do osso, a casinha dela lá em cima
10. O caminho de volta é o mesmo caminho, **mas** agora ela reconhece cada pedaço pelo que tem embaixo.
    **A** ela descendo · **B** os lugares de hoje com a linha do osso aparecendo por baixo
11. Ela chega no buraco. **Portanto** devolve o dente e começa a tapar.
    **A** o dente voltando para a terra · **B** as mãos empurrando a terra de volta
12. Perguntam se ela achou alguma coisa. Ela diz que não. E depois deita com a orelha na grama.
    **A** os dois, ela dando de ombros · **B** ela deitada, orelha no chão, e por baixo da terra a forma inteira

**Elenco que sobrou.** Vira gente do bairro nos quadros A — a mesma pessoa no
mesmo lugar em duas eras, que é a piada visual do livro.

---

### NOVO IRMÃO 1 — *A Troca*

> Vem alguém morar na casa. Ele pergunta onde. Dizem: no seu quarto.

**Resumo.** Uma coisa de cada vez é pedida para o bebê, e cada uma que sai
volta maior: entrega o berço, ganha a cama alta; entrega o carrinho, ganha ir a
pé de mão dada. Ele entra no jogo e começa a entregar antes de pedirem. Até
pedirem a coisa que não tem versão maior.

**Por que essa e não a dos americanos.** Wonderbly e Hooray Heroes resolvem
isso dizendo à criança que o amor cabe. Aqui ninguém diz nada: a criança
entrega objetos e recebe objetos maiores, e a conta fecha sozinha na cabeça de
quem lê. A única vez que a história fala de sentimento é quando a mão do adulto
baixa e não insiste.

**O desejo.** Que as coisas fiquem como estão.
**A virada (batida 9).** Ele diz não — e ninguém obriga. A história inteira
vira nesse gesto de quem pediu, não no dele.

**Elenco.**
- `QUEM PEDE` — adulto da casa. **Obrigatório.**
- `O QUE FICA IGUAL` — o bicho da família, a única coisa da casa que não muda
  de lugar em nada. *Opcional.* Sem bicho, é um móvel que nunca saiu do lugar,
  nomeado pela pergunta.
- `O QUE VEM` — o bebê. Pode não ter nome ainda; a história funciona sem.

**Perguntas.** O que vai passar do mais velho para o bebê *(obrigatória —
berço, quarto, carrinho, cadeirinha)* · o que ele ganha de verdade em troca
*(obrigatória — cama grande, beliche, ir a pé, copo de vidro)* · qual é a coisa
que ele não larga *(obrigatória)* · como ele chama essa coisa.

**As doze batidas.**
1. Avisam que vem alguém morar na casa. Ele pergunta onde. Dizem: no seu quarto.
   **A** os três na sala, a notícia · **B** ele olhando a porta do próprio quarto
2. Primeiro pedido: o berço. Ele entrega — **mas** ganha a cama grande, que é altíssima.
   **A** o berço sendo levado · **B** ele sentado na cama alta, os pés longe do chão
3. Descobre que na cama grande dá para pular. A troca foi boa.
   **A** ele testando com um pé · **B** ele no ar
4. Segundo pedido: o carrinho. **Portanto** agora ele vai a pé, de mão dada, em vez de sentado.
   **A** o carrinho saindo da garagem · **B** os dois andando na rua
5. Depois a cadeirinha, o copo com bico, a gaveta de baixo. Cada coisa deixa um vazio do tamanho dela.
   **A** os objetos indo, um a um · **B** a gaveta vazia aberta
6. Ele começa a entregar antes de pedirem. Virou jogo dele.
   **A** ele carregando uma coisa sozinho · **B** pondo na pilha, satisfeito
7. Só `O QUE FICA IGUAL` não mudou de lugar nenhum, e ele repara.
   **A** o bicho no canto de sempre · **B** ele sentado ao lado, encostado
8. Então pedem `[A COISA]`.
   **A** a mão do adulto estendida · **B** a coisa apertada contra o peito dele
9. **A virada.** Ele diz não. E ninguém insiste: a mão volta.
   **A** a cara dele, fechada · **B** a mão baixando, e um abraço que não pede nada
10. Ele guarda a coisa no lugar mais alto que alcança — que é alto, porque agora ele é grande.
    **A** ele subindo na cama para chegar lá · **B** a coisa no alto, sozinha
11. O bebê chega. É menor do que qualquer coisa que ele entregou.
    **A** o berço agora ocupado · **B** a mão do bebê ao lado da mão dele
12. De noite, sozinho, ele tira a coisa de cima e põe no berço. Ninguém vê. E volta para a cama grande, que dá para pular.
    **A** ele de pijama, tirando a coisa do alto · **B** a coisa dentro do berço, e ele de costas voltando

**Elenco que sobrou.** Recebe os objetos nas batidas 2, 4 e 5 — a família
inteira participa da mudança, uma pessoa por entrega.

---

### NOVO IRMÃO 2 — *O Nome Que Só Eu Sei*

> Falta um nome, e a casa inteira está tentando. Ele quer ser quem escolhe.

**Resumo.** Ele inventa três testes para os nomes: gritar no corredor e ouvir
como volta, falar perto do cachorro e ver se ele vira a cabeça, escrever o nome
inteiro à mão sem desistir no meio. Acha o nome certo. E perde — os adultos já
tinham escolhido outro, que tem história de família. Então ele para de dizer o
nome dele em voz alta e passa a usá-lo só quando está sozinho com a barriga.

**O desejo.** Ser o que dá o nome.
**A virada (batida 8).** Ele perde a escolha, e em vez de largar o nome, esconde.

**Elenco.**
- `QUEM ESCOLHE` — pelo menos um adulto da casa. **Obrigatório.**
- `O JUIZ` — o bicho da família, que vira a cabeça em alguns nomes e não em
  outros. *Opcional.* Sem bicho, o juiz é o eco de `[ONDE A VOZ DELE ECOA]`, e
  a batida 12 troca a cabeça que vira pelo silêncio que vem depois do choro.

**Perguntas.** Que nome o mais velho queria dar *(obrigatória)* · como ele chama
o bebê quando ninguém está ouvindo *(obrigatória — se não existir, é o nome que
ele queria dar)* · onde a voz dele ecoa na casa *(obrigatória)* · de onde veio o
nome que os adultos escolheram.

**As doze batidas.**
1. Falta um nome, e a casa inteira está tentando.
   **A** a lista de nomes na geladeira · **B** ele de pé na frente, sem alcançar o topo
2. Ele quer ser quem escolhe. **Portanto** inventa um teste.
   **A** ele puxando a cadeira para alcançar · **B** ele riscando a lista, sério
3. Teste um: gritar o nome em `[ONDE A VOZ ECOA]` e ouvir como ele volta.
   **A** ele gritando · **B** o corredor vazio devolvendo
4. Teste dois: falar o nome perto de `O JUIZ`. Alguns nomes não fazem nada.
   **A** ele sussurrando para o bicho · **B** o bicho dormindo, sem virar
5. Teste três: escrever o nome inteiro à mão. Os compridos ele larga no meio.
   **A** a mão escrevendo · **B** o papel com o nome pela metade
6. Ele acha o nome: é curto, o bicho vira, e cabe no papel.
   **A** ele escrevendo até o fim · **B** o bicho de orelha em pé
7. Ele apresenta. Acham lindo — **mas** já tinham escolhido outro, que veio de `[DE ONDE VEIO O NOME]`.
   **A** ele mostrando o papel · **B** os adultos, um deles com uma foto antiga na mão
8. **A virada.** Ele perde. **Portanto** para de dizer o nome em voz alta, e passa a usar só sozinho, com a boca perto da barriga.
   **A** o papel dele indo para a gaveta · **B** ele encostado na barriga, falando baixo
9. Ele usa esse nome todo dia. Conta as coisas. É a única voz que chama o bebê assim.
   **A** ele deitado ao lado da barriga · **B** o mesmo, outro dia, outra luz
10. O bebê nasce com o nome dos adultos escrito em tudo: na pulseirinha, na porta, no bolo.
    **A** a pulseirinha · **B** a porta do quarto com o nome
11. O bebê chora e não para com ninguém. **Mas** ele chega perto e usa o nome dele.
    **A** o bebê chorando, a casa inteira tentando · **B** ele se aproximando, a boca perto da orelha
12. O bebê para. E vira a cabeça — igualzinho `O JUIZ` virava. Acham que foi sorte. Só ele sabe que foi o teste.
    **A** o bebê quieto, virando · **B** ele e `O JUIZ`, os dois olhando, cúmplices

**Elenco que sobrou.** Todo mundo tem um nome na lista da batida 1 e um palpite
reprovado nos testes 3 a 5.

---

### FÉRIAS 1 — *O Guia*

> Ela é baixa demais para ver o mapa.

**Resumo.** Enquanto os adultos andam pelos lugares famosos, ela vai marcando o
caminho do jeito dela — não por nome, por sinal: a porta azul, o cachorro do
telhado, o cheiro da rua da padaria. No terceiro dia todo mundo está perdido e
de mau humor, e alguém finalmente se abaixa até a altura dela e pergunta.

**Por que essa e não a dos americanos.** A versão deles é o tour de monumentos,
que é uma lista — falha no teste do `mas`/`portanto` em toda página. Aqui a
viagem é a mesma, mas o que a move é quem está autorizado a apontar o caminho.

**O desejo.** Que alguém pergunte alguma coisa para ela.
**A virada (batida 8).** Um adulto se abaixa até a altura dela. É a única
batida do livro em que os olhos ficam na mesma linha.

**Elenco.**
- `OS QUE LEVAM` — pelo menos um adulto. **Obrigatório.**
- `O QUE VAI ATRÁS` — outra criança ou o bicho. *Opcional.* Sozinha, a
  coleção de sinais é secreta até a batida 9, e é melhor assim.

**Perguntas.** Para onde a família foi ou vai *(obrigatória)* · três ou quatro
lugares dessa viagem *(obrigatória)* · alguma coisa que ela reparou e mais
ninguém *(obrigatória)* · qual foi o lugar bobo que virou o melhor da viagem
*(obrigatória — é a batida 11)*.

**As doze batidas.**
1. Chegam em `[DESTINO]`. Os adultos abrem o mapa, e ela é baixa demais para ver.
   **A** a chegada, as malas · **B** o mapa aberto acima da cabeça dela
2. Vão ao `[LUGAR 1]`, que é lindo e tem fila. Ela olha para o lado e vê `[A COISA QUE SÓ ELA REPAROU]`.
   **A** a fila e o monumento · **B** ela virada para o outro lado, e a coisa
3. Ela puxa a manga de alguém para mostrar. Dizem "depois".
   **A** a mão puxando a manga · **B** o adulto apontando para a frente, sem olhar
4. **Portanto** ela começa a guardar sozinha, e marca o caminho por sinal em vez de por nome.
   **A** ela parando na frente da porta azul · **B** a mão dela desenhando o sinal
5. `[LUGAR 2]`. Mesma coisa. A coleção cresce.
   **A** o lugar cheio de gente · **B** mais um sinal anotado
6. No terceiro dia todo mundo está cansado, o mapa não bate com a rua, e estão perdidos.
   **A** o cruzamento, o mapa girando nas mãos · **B** as caras
7. Ela reconhece a porta azul — **mas** ninguém pergunta nada para ela.
   **A** a porta azul no canto do quadro · **B** ela olhando para cima, esperando
8. **A virada.** Alguém se abaixa e pergunta: você sabe onde a gente está?
   **A** o adulto se abaixando · **B** os olhos dos dois na mesma linha
9. Ela sabe. **Portanto** vai na frente.
   **A** o primeiro passo dela · **B** a família atrás, em fila
10. Ela leva por onde não está no mapa: pelo cheiro da padaria, pelo cachorro do telhado.
    **A** passando pela padaria · **B** todo mundo olhando para o telhado
11. E não leva para o hotel. Leva para `[O LUGAR BOBO]`, que ela guardou desde o primeiro dia.
    **A** o grupo chegando onde não era o esperado · **B** o lugar, agora com todo mundo olhando
12. É uma bobagem. E é onde eles voltam todo dia até a viagem acabar.
    **A** todo mundo parado ali, sem pressa · **B** o mesmo lugar, outro dia, outra luz, a família já instalada

**Elenco que sobrou.** Está no grupo que ela guia da batida 9 em diante — a
fila atrás dela é onde a família inteira aparece.

---

### FÉRIAS 2 — *Quanto Falta*

> Ela combinou em voz alta com todo mundo: vai ser a primeira a ver.

**Resumo.** A viagem inteira medida em unidades de criança — três músicas, dois
túneis, um lanche, uma soneca. Ela se recusa a dormir porque combinou ser a
primeira a ver `[O DESTINO]`. Dez minutos antes, ela perde. O carro para, e
ninguém desce.

**O desejo.** Ser a primeira a ver.
**A virada (batida 9).** Ela dorme. Perde. E a história passa para o lado de
quem está acordado.

**Nota de tom.** Essa história já está escrita na voz `warm` que existe no
`catalog.ts` — medida em braços, pulos e distâncias, nunca em números. O molde
e a voz batem sem precisar de ajuste.

**Elenco.**
- `QUEM LEVA` — adulto que dirige ou carrega. **Obrigatório.**
- `O QUE VIAJA DO LADO` — outra criança ou o bicho, que dorme na batida 5 e
  serve de contraste. *Opcional.* Sozinha, ela espalha as coisas dela no banco
  vazio, e o banco vazio é o contraste.

**Perguntas.** Como é a viagem *(obrigatória — carro, ônibus, avião, quantas
horas)* · o que sempre acontece nessa viagem *(obrigatória — a música, o lanche,
o enjoo, a parada)* · o que eles vão ver quando chegar *(obrigatória)* · quem
sempre dorme no caminho.

**As doze batidas.**
1. Ainda escuro. Ela é a primeira acordada da casa, porque hoje é o dia.
   **A** a casa no escuro, ela já vestida · **B** os outros ainda dormindo
2. Primeira pergunta: quanto falta? Resposta: três músicas. **Portanto** ela conta as músicas.
   **A** ela na janela · **B** os dedos contando, um, dois
3. Acabam as três e não chegou. Unidade nova: dois túneis.
   **A** o primeiro túnel entrando · **B** o escuro, e a luz no fim
4. Depois: um lanche. O lanche acaba rápido demais.
   **A** o pacote sendo aberto · **B** o pacote vazio nas mãos
5. Depois: uma soneca — **mas** ela não vai dormir, e combina isso em voz alta com todo mundo.
   **A** ela anunciando, dedo em riste · **B** `O QUE VIAJA DO LADO` já dormindo, a cabeça caída
6. A estrada muda de cor. Ela reconhece que está perto sem ninguém falar nada.
   **A** a paisagem de antes · **B** a paisagem nova, mesmo enquadramento
7. Ela pergunta de novo, e a resposta é outra: não falta nada, é aqui do lado.
   **A** ela perguntando · **B** os olhos do adulto no retrovisor, sorrindo
8. E é aí que fica mais longe. O último pedaço é sempre o mais comprido.
   **A** o carro numa reta · **B** a mesma reta, sem fim
9. **A virada.** Os olhos dela fecham. Ela perde.
   **A** a cabeça pesando · **B** ela dormindo, o rosto no vidro
10. O carro para. Ninguém desce. Todo mundo espera, sem abrir a porta.
    **A** o carro parado · **B** os adultos quietos, olhando para trás, ninguém se mexendo
11. Alguém acorda ela com a mão no joelho, do jeito certo.
    **A** a mão no joelho · **B** os olhos dela abrindo
12. Ela é a primeira a descer e a primeira a ver `[O DESTINO]`. Tinha sido combinado. E cumpriram.
    **A** a porta abrindo, o pé dela no chão · **B** ela de costas, pequena, e o destino inteiro na frente

**Elenco que sobrou.** Está no carro desde a batida 2 e é quem segura a batida
10 — a história precisa de gente acordada esperando.

---

## 4. O que eu preciso de você

**Decisões que ficaram abertas e que mudam o trabalho:**

1. **As três ocasiões antigas.** Se a prateleira substitui a invenção em todas,
   `child` (criança genérica), `relationship` (casal) e `pet` ficam sem
   histórias. Minha recomendação: `child` ganha prateleira na rodada 2 — é a
   ocasião mais vendida do setor —, e `relationship` e `pet` saem do produto.
   Livro de colorir de 24 páginas para um presente entre adultos é outro
   negócio, e está puxando o fluxo para os lados desde o começo.
2. **`new-baby` e `novo irmão` são a mesma prateleira?** Hoje três das cinco
   histórias de `new-baby` já são o livro do filho mais velho. Ou as duas
   ocasiões viram uma com sete histórias, ou a fronteira entre elas precisa de
   um nome melhor do que "bebê" e "irmão".
3. **Aventura é uma ocasião ou duas?** Espaço e dinossauro não têm nada em
   comum além de serem invenção grande. Se a home vira vitrine, é melhor
   tratar cada uma como um livro com capa própria e esquecer o guarda-chuva.
4. **Qual das oito eu escrevo por inteiro primeiro**, para virar o molde de
   referência dos outros sete. Minha aposta é *O Bicho Embaixo de Casa*: é a que
   mais depende da estrutura de 24 quadros, então é a que prova ou derruba a
   ideia toda mais rápido.
