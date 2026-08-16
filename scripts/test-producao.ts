/**
 * The whole product, once, against whatever is actually deployed.
 *
 * Everything else is tested locally, which proves the code and not the
 * deployment: the volume, the secrets, the image provider reaching Google from
 * inside a container, and the PDF builder fetching pages back off its own
 * disk are all things that only exist in production. This spends real money —
 * about three dollars — and is the only way to find out before a customer does.
 *
 *   BASE=https://portintim.fly.dev npx tsx scripts/test-producao.ts
 */
const BASE = process.env.BASE ?? 'https://portintim.fly.dev'

const t0 = Date.now()
const marca = () => `${String(Math.round((Date.now() - t0) / 1000)).padStart(4)}s`

async function post(path: string, body?: unknown) {
  const t = Date.now()
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const texto = await res.text()
  let data: unknown = null
  try { data = JSON.parse(texto) } catch { /* deixa cru */ }
  return { ms: Date.now() - t, status: res.status, data, texto }
}

async function pedido(id: string) {
  const res = await fetch(`${BASE}/api/orders/${id}`, { cache: 'no-store' })
  return res.json()
}

async function esperarTarefa(id: string, kind: string) {
  for (;;) {
    await new Promise((r) => setTimeout(r, 3000))
    const o = await pedido(id)
    const t = o.task
    if (!t || t.kind !== kind || t.status === 'running') continue
    if (t.status === 'failed') throw new Error(`${kind}: ${t.error}`)
    return t.result
  }
}

async function esperarStatus(id: string, alvos: string[]) {
  for (;;) {
    await new Promise((r) => setTimeout(r, 5000))
    const o = await pedido(id)
    if (o.status === 'failed') throw new Error(`render falhou: ${o.error}`)
    if (alvos.includes(o.status)) return o
  }
}

async function main() {
  console.log(`alvo: ${BASE}\n`)

  const brief = {
    locale: 'pt', bookLanguage: 'pt', finish: 'coloring',
    occasionId: 'child', storyTypeId: 'adventure', toneId: 'playful',
    artStyleId: 'chibi', title: '',
    place: 'a casa da avó em Petrópolis, com o quintal cheio de mangueiras',
    characters: [
      { id: 'c1', name: 'Lila', kind: 'person', age: '5 anos',
        appearance: 'cabelo cacheado castanho na altura do ombro, óculos redondos, jardineira jeans e tênis vermelho',
        personality: 'para no meio da rua para olhar formiga; tem medo de secador',
        storyNotes: 'chama toda comida nova de "experimento".' },
      { id: 'c2', name: 'Vovó Zeza', kind: 'person', age: '71 anos',
        appearance: 'cabelo branco preso num coque, avental de flores, chinelo',
        personality: 'responde tudo com outra pergunta',
        storyNotes: 'guarda botões numa lata de biscoito.' },
    ],
    interview: [], memories: [],
  }

  const criado = await post('/api/orders', brief)
  if (criado.status !== 200 && criado.status !== 201) {
    throw new Error(`criar pedido: HTTP ${criado.status} ${criado.texto.slice(0, 160)}`)
  }
  const id = (criado.data as { id: string }).id
  console.log(`${marca()}  pedido ${id}`)

  for (const [nome, path, kind, corpo] of [
    ['entrevista', `/api/orders/${id}/interview`, 'interview', undefined],
    ['ideias', `/api/orders/${id}/ideas`, 'ideas', undefined],
  ] as const) {
    const r = await post(path, corpo)
    if (r.status !== 202) throw new Error(`${nome}: HTTP ${r.status} ${r.texto.slice(0, 160)}`)
    await esperarTarefa(id, kind)
    console.log(`${marca()}  ${nome} ok (POST devolveu em ${r.ms}ms)`)
  }

  const comIdeias = await pedido(id)
  const ideia = comIdeias.ideas[0]

  const g = await post(`/api/orders/${id}/generate`, { ideaId: ideia.id })
  if (g.status !== 202) throw new Error(`roteiro: HTTP ${g.status} ${g.texto.slice(0, 160)}`)
  await esperarTarefa(id, 'storyboard')
  const comRoteiro = await pedido(id)
  console.log(`${marca()}  roteiro ok — "${comRoteiro.storyboard.title}", ${comRoteiro.storyboard.pages.length} páginas`)

  const ap = await post(`/api/orders/${id}/storyboard`, { action: 'approve' })
  if (ap.status !== 200 && ap.status !== 202) throw new Error(`aprovar: HTTP ${ap.status} ${ap.texto.slice(0, 160)}`)
  console.log(`${marca()}  desenhando capas…`)
  const naEscolha = await esperarStatus(id, ['choosing-cover'])
  const capas = (naEscolha.covers ?? []).map((c: { kind: string; status: string }) => `${c.kind}=${c.status}`)
  console.log(`${marca()}  capas prontas: ${capas.join(', ')}`)

  const esc = await post(`/api/orders/${id}/cover`, { kind: 'scene' })
  if (esc.status !== 200) throw new Error(`escolher capa: HTTP ${esc.status} ${esc.texto.slice(0, 160)}`)
  console.log(`${marca()}  desenhando as páginas…`)
  const pronto = await esperarStatus(id, ['ready'])

  const feitas = (pronto.renders ?? []).filter((r: { status: string }) => r.status === 'done').length
  const falhas = (pronto.renders ?? []).filter((r: { status: string }) => r.status === 'failed').length
  const comDefeito = (pronto.renders ?? []).filter((r: { problems?: string[] }) => r.problems?.length).length
  console.log(`${marca()}  páginas: ${feitas} prontas, ${falhas} falharam, ${comDefeito} com defeito anotado`)

  const pdf = await fetch(`${BASE}/api/orders/${id}/pdf`)
  const bytes = (await pdf.arrayBuffer()).byteLength
  console.log(`${marca()}  PDF: HTTP ${pdf.status}, ${(bytes / 1024).toFixed(0)} KB`)

  const leitor = await fetch(`${BASE}/pt/livro/${id}/ler`)
  console.log(`${marca()}  leitor: HTTP ${leitor.status}`)
  console.log(`\nlink do livro: ${BASE}/pt/livro/${id}/ler`)
  if (falhas > 0 || bytes < 50_000 || pdf.status !== 200 || leitor.status !== 200) {
    throw new Error('algo saiu errado — ver acima')
  }
  console.log('TUDO CERTO')
}
main().catch((e) => { console.error(`${marca()}  FALHOU: ${e.message}`); process.exit(1) })
