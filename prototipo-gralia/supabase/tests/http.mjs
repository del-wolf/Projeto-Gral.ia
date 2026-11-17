import { createClient } from '@supabase/supabase-js'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Optional real Auth/HTTP verification. Public key and each user's own JWT only.
// This never resets, provisions users, or performs a permitted durable write.
const root = fileURLToPath(new URL('../../', import.meta.url))
const output = path.join(root, 'docs/evidencias', `supabase-http-${new Date().toISOString().replaceAll(/[:.]/g, '-')}`)
const url = process.env.GRALIA_TEST_SUPABASE_URL ?? ''
const key = process.env.GRALIA_TEST_PUBLISHABLE_KEY ?? ''
const password = process.env.GRALIA_TEST_PASSWORD ?? ''
const results = []
const clients = []
const fixture = JSON.parse(await readFile(path.join(root, 'fixtures/gralia_seed_contract.json'), 'utf8'))
function assert(condition, message) { if (!condition) throw new Error(message) }
async function check(id, expected, run) {
  try {
    const observed = await run()
    results.push({ id, status: 'APROVADO', expected, observed: observed ?? 'Asserções satisfeitas.' })
    console.log(`APROVADO ${id}`)
  } catch (error) {
    results.push({ id, status: 'REPROVADO', expected, observed: error.message })
    console.error(`REPROVADO ${id}: ${error.message}`)
  }
}
function confirmed(result, operation) {
  if (result.error) throw new Error(`${operation}: código ${result.error.code ?? result.error.status ?? 'indisponível'}; sem credenciais no relatório.`)
  return result.data
}
try {
  await mkdir(output, { recursive: true })
  let endpoint
  try { endpoint = new URL(url) } catch { throw new Error('BLOQUEADO: defina GRALIA_TEST_SUPABASE_URL de um Supabase local descartável preparado.') }
  assert(['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname) && !endpoint.username && !endpoint.password, 'BLOQUEADO: teste HTTP aceita somente loopback; nenhum destino remoto será acessado.')
  assert(key && password, 'BLOQUEADO: faltam GRALIA_TEST_PUBLISHABLE_KEY e/ou GRALIA_TEST_PASSWORD. Nenhuma conta ou chave é inventada.')
  let secret = key.startsWith('sb_secret_')
  if (key.split('.').length === 3) {
    try { secret ||= JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'service_role' } catch { /* Server checks malformed public tokens. */ }
  }
  assert(!secret, 'BLOQUEADO: chave administrativa não comprova RLS; use exclusivamente chave pública/publishable.')
  const profiles = {}
  for (const expected of fixture.profiles) {
    const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
    clients.push(client)
    const auth = confirmed(await client.auth.signInWithPassword({ email: expected.email_fixture, password }), `Auth ${expected.alias}`)
    assert(auth.user && auth.session, `Auth ${expected.alias} não confirmou sessão real`)
    const user = confirmed(await client.auth.getUser(), `getUser ${expected.alias}`).user
    assert(user?.id === auth.user.id, `getUser ${expected.alias} não confirmou a identidade`)
    const profile = confirmed(await client.from('profiles').select('id,nome,papel').eq('id', user.id).single(), `Perfil ${expected.alias}`)
    assert(profile.papel === expected.papel, `Papel protegido divergente para ${expected.alias}`)
    profiles[expected.alias] = { client, id: user.id }
    results.push({ id: `AUTH-${expected.alias}`, status: 'APROVADO', expected: 'Login/sessão real e papel da tabela protegida', observed: { userId: user.id, papel: profile.papel } })
  }
  const pweb = fixture.ofertas_disciplina.find(o => o.codigo === 'OF-PWEB-3A').id
  const bd = fixture.ofertas_disciplina.find(o => o.codigo === 'OF-BD-3B').id
  const target = fixture.ofertas_disciplina.find(o => o.codigo === 'OF-TEST-3A').id
  const student = fixture.alunos.find(a => a.alias === 'ALUNO-A').id
  for (const [alias, count, hiddenOffer] of [['ALUNO-A', 2, bd], ['ALUNO-B', 1, pweb], ['PROF-A', 2, bd], ['PROF-B', 1, pweb], ['ADMIN-QA', 0, pweb]]) {
    await check(`HTTP-RLS-notas-${alias}`, `Lê ${count} notas da fixture limpa e zero da oferta não autorizada`, async () => {
      const client = profiles[alias].client
      const own = confirmed(await client.from('notas').select('id,oferta_id'), 'Leitura de notas')
      const cross = confirmed(await client.from('notas').select('id').eq('oferta_id', hiddenOffer), 'Leitura cruzada')
      assert(own.length === count && cross.length === 0, `Contagens observadas ${own.length} próprias/visíveis e ${cross.length} cruzadas; esperado ${count} e 0`)
      return { visibleCount: own.length, crossCount: cross.length }
    })
  }
  await check('HTTP-admin-sem-pedagogico', 'Admin lê zero avaliações, aulas, materiais e frequências', async () => {
    const observed = {}
    for (const table of ['avaliacoes', 'aulas', 'materiais', 'frequencias']) {
      const rows = confirmed(await profiles['ADMIN-QA'].client.from(table).select('id'), `Leitura ${table}`)
      assert(rows.length === 0, `Admin leu ${rows.length} linhas de ${table}`)
      observed[table] = rows.length
    }
    return observed
  })
  await check('HTTP-profile-sem-escalacao', 'Aluno não altera papel e continua aluno', async () => {
    const { client, id } = profiles['ALUNO-A']
    const update = await client.from('profiles').update({ papel: 'admin' }).eq('id', id).select('id')
    const profile = confirmed(await client.from('profiles').select('papel').eq('id', id).single(), 'Conferência do papel')
    assert((update.error || update.data?.length === 0) && profile.papel === 'aluno', 'Tentativa de escalada não foi negada ou alterou papel')
    return { responseCode: update.error?.code ?? 'zero-linhas', roleAfter: profile.papel }
  })
  for (const alias of ['ALUNO-A', 'PROF-A']) {
    await check(`HTTP-matricula-proibida-${alias}`, 'RPC de matrícula nega perfil sem criar vínculo', async () => {
      const result = await profiles[alias].client.rpc('registrar_matriculas', { p_aluno_id: student, p_oferta_ids: [target] })
      assert(result.error?.code === '42501', `RPC sem permissão não retornou 42501; código ${result.error?.code ?? 'sucesso'}`)
      const rows = confirmed(await profiles['ADMIN-QA'].client.from('matriculas').select('id').eq('aluno_id', student).eq('oferta_id', target), 'Consulta independente pelo admin')
      assert(rows.length === 0, 'Vínculo não esperado encontrado; requer fixture independente limpa')
      return { responseCode: result.error.code, targetPairCount: rows.length }
    })
  }
  await check('CT-GR-002-HTTP', 'RPC Auth admin rejeita [] e mantém exatamente a contagem anterior', async () => {
    const client = profiles['ADMIN-QA'].client
    const before = confirmed(await client.from('matriculas').select('id'), 'Contagem antes')
    const result = await client.rpc('registrar_matriculas', { p_aluno_id: student, p_oferta_ids: [] })
    const after = confirmed(await client.from('matriculas').select('id'), 'Contagem depois')
    assert(result.error?.code === '23514' && before.length === after.length, `Entrada vazia não retornou 23514 ou alterou contagem; código ${result.error?.code ?? 'sucesso'}`)
    return { responseCode: result.error.code, before: before.length, after: after.length }
  })
  const failures = results.filter(r => r.status === 'REPROVADO').length
  await writeFile(path.join(output, 'resultado.json'), JSON.stringify({ status: failures ? 'REPROVADO' : 'APROVADO', mode: 'Supabase Auth + PostgREST HTTP local; cinco JWTs próprios, chave pública', endpoint: endpoint.origin, fixtureVersion: fixture.fixture_version, executedAt: new Date().toISOString(), sourceSha256: createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).digest('hex'), results, failed: failures, limits: 'Sem reset ou escrita autorizada durável; matrícula válida, reserva/concorrência HTTP e interface Cypress exigem rodada separada.' }, null, 2))
  process.exitCode = failures ? 1 : 0
  console.log(`HTTP: ${results.length - failures} aprovados; ${failures} reprovados. Evidências: ${path.relative(root, output)}`)
} catch (error) {
  const blocked = String(error.message).startsWith('BLOQUEADO:')
  console.error(error.message)
  await mkdir(output, { recursive: true })
  await writeFile(path.join(output, 'resultado.json'), JSON.stringify({ status: blocked ? 'BLOQUEADO' : 'REPROVADO', reason: error.message, mode: 'Supabase Auth + HTTP local', results }, null, 2))
  process.exitCode = blocked ? 2 : 1
} finally {
  for (const client of clients) await client.auth.signOut({ scope: 'local' })
}
