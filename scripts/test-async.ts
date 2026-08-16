import { promises as fs } from 'node:fs'

/**
 * Walks the wizard's own HTTP path against a running server, the way the
 * browser does: start a step, then poll until the order's task settles.
 *
 * The point is to prove no request is held open while a model works — every
 * POST must come back at once, which is what lets this run behind a proxy.
 *
 *   npx tsx scripts/test-async.ts
 */
const BASE = process.env.BASE ?? 'http://localhost:3000'

async function env() {
  const raw = await fs.readFile('.env.local', 'utf8')
  for (const l of raw.split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && m[2]) process.env[m[1]] ??= m[2]
  }
}

async function post(path: string, body?: unknown) {
  const t = Date.now()
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  return { ms: Date.now() - t, status: res.status, data }
}

async function aguardar(id: string, kind: string) {
  const t = Date.now()
  for (;;) {
    await new Promise((r) => setTimeout(r, 2000))
    const order = await (await fetch(`${BASE}/api/orders/${id}`)).json()
    const task = order.task
    if (!task || task.kind !== kind || task.status === 'running') continue
    if (task.status === 'failed') throw new Error(`${kind} falhou: ${task.error}`)
    return { ms: Date.now() - t, result: task.result }
  }
}

async function passo(nome: string, id: string, path: string, kind: string, body?: unknown) {
  const r = await post(path, body)
  const w = await aguardar(id, kind)
  const ok = r.ms < 1500 ? 'OK' : 'LENTO'
  console.log(
    `${nome.padEnd(12)} POST devolveu em ${String(r.ms).padStart(5)}ms [${ok}] · trabalho levou ${(w.ms / 1000).toFixed(0)}s`,
  )
  return w.result as Record<string, unknown>
}

async function main() {
  await env()
  const brief = {
    locale: 'pt', bookLanguage: 'pt', finish: 'coloring',
    occasionId: 'child', storyTypeId: 'adventure', toneId: 'playful',
    artStyleId: 'chibi', title: '', place: 'o quintal da avó em Petrópolis',
    characters: [{ id: 'c1', name: 'Lila', kind: 'person', age: '5 anos',
      appearance: 'cabelo cacheado, óculos redondos',
      personality: 'para no meio da rua para olhar formiga' }],
    interview: [], memories: [],
  }

  const criado = await post('/api/orders', brief)
  const id = (criado.data as { id: string }).id
  console.log(`pedido ${id}\n`)

  await passo('entrevista', id, `/api/orders/${id}/interview`, 'interview')
  await passo('lacunas', id, `/api/orders/${id}/gaps`, 'gaps')
  const ideias = await passo('ideias', id, `/api/orders/${id}/ideas`, 'ideas')
  const primeira = (ideias.ideas as { id: string }[])[0]
  await passo('títulos', id, `/api/orders/${id}/titles`, 'titles', { ideaId: primeira.id })
  await passo('roteiro', id, `/api/orders/${id}/generate`, 'storyboard', { ideaId: primeira.id })

  const final = await (await fetch(`${BASE}/api/orders/${id}`)).json()
  console.log(`\nstatus final: ${final.status} · páginas do roteiro: ${final.storyboard?.pages?.length}`)
}
main().catch((e) => { console.error('FALHOU:', e.message); process.exit(1) })
