import { createClient } from '@supabase/supabase-js'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Server-side preparation only. This file is never imported by the application.
// It creates synthetic users through Auth's supported admin API, then maps real IDs.
const root = fileURLToPath(new URL('../../', import.meta.url))
const url = process.env.GRALIA_TEST_SUPABASE_URL ?? ''
const key = process.env.GRALIA_TEST_SERVICE_ROLE_KEY ?? ''
const publicKey = process.env.GRALIA_TEST_PUBLISHABLE_KEY ?? ''
const password = process.env.GRALIA_TEST_PASSWORD ?? ''
const confirmation = process.env.GRALIA_TEST_ALLOW_PROVISION

function stop(message) { throw new Error(message) }
function assert(result, operation) {
  if (result.error) stop(`Falha na preparação (${operation}); código ${result.error.code ?? result.error.status ?? 'indisponível'}. Detalhes e credenciais não foram impressos.`)
  return result.data
}
const literal = value => value === null ? 'null' : typeof value === 'string' ? `'${value.replaceAll("'", "''")}'` : String(value)
function partsAt(date) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]))
}
function localToUtc(date, time) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const intended = Date.UTC(year, month - 1, day, hour, minute)
  let instant = intended
  for (let i = 0; i < 3; i++) {
    const local = partsAt(new Date(instant))
    const represented = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second)
    instant += intended - represented
  }
  return new Date(instant).toISOString()
}

try {
  let endpoint
  try { endpoint = new URL(url) } catch { stop('Defina GRALIA_TEST_SUPABASE_URL para seu Supabase local descartável.') }
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname) || !['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password) stop('Provisionamento permitido somente em loopback; nenhum destino remoto é aceito.')
  if (confirmation !== 'LOCAL_DISPOSABLE_ONLY') stop('Confirme o ambiente descartável local com GRALIA_TEST_ALLOW_PROVISION=LOCAL_DISPOSABLE_ONLY.')
  if (!key || !publicKey || password.length < 12) stop('Informe GRALIA_TEST_SERVICE_ROLE_KEY, GRALIA_TEST_PUBLISHABLE_KEY e GRALIA_TEST_PASSWORD (mínimo de 12 caracteres), somente no executor administrativo.')
  const fixture = JSON.parse(await readFile(path.join(root, 'fixtures/gralia_seed_contract.json'), 'utf8'))
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
  const listed = assert(await client.auth.admin.listUsers({ page: 1, perPage: 1000 }), 'listar contas locais')
  const mapping = {}
  for (const item of fixture.profiles) {
    let account = listed.users.find(u => u.email === item.email_fixture)
    if (!account) {
      account = assert(await client.auth.admin.createUser({ email: item.email_fixture, password, email_confirm: true }), 'criar conta Auth sintética').user
    } else {
      account = assert(await client.auth.admin.updateUserById(account.id, { password, email_confirm: true }), 'atualizar conta Auth sintética local').user
    }
    if (!account) stop('Auth não confirmou a conta criada; nenhuma identidade fictícia será inventada.')
    mapping[item.id] = account.id
  }
  const tables = ['profiles', 'alunos', 'professores', 'periodos', 'turmas', 'disciplinas', 'ofertas_disciplina', 'matriculas', 'avaliacoes', 'notas', 'aulas', 'frequencias', 'materiais', 'salas']
  for (const table of tables) {
    const rows = fixture[table].map(original => {
      const row = Object.fromEntries(Object.entries(original).filter(([name]) => !['alias', 'email_fixture'].includes(name)))
      if (table === 'profiles') row.id = mapping[row.id]
      if (row.profile_id) row.profile_id = mapping[row.profile_id]
      return row
    })
    if (rows.length) assert(await client.from(table).upsert(rows, { onConflict: 'id' }).select('id'), `preparar ${table}`)
  }
  // Relative fixture dates use a backend instant, never the fixed browser clock.
  const health = await fetch(`${endpoint.origin}/auth/v1/health`, { headers: { apikey: publicKey } })
  const backendClock = new Date(health.headers.get('date') ?? '')
  if (!health.ok || Number.isNaN(backendClock.valueOf())) stop('Backend não forneceu um instante válido para reservas relativas; cadastros foram gravados, mas a fixture ainda está incompleta.')
  const day = partsAt(backendClock)
  const reservations = []
  for (const template of fixture.reservas_templates ?? []) {
    const owner = fixture.profiles.find(p => p.id === template.solicitante_profile_id)
    if (!owner || template.status !== 'ativa') stop('Modelo de reserva sem solicitante sintético ou status suportado.')
    const actor = createClient(url, publicKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
    try {
      assert(await actor.auth.signInWithPassword({ email: owner.email_fixture, password }), 'sessão docente para reserva relativa')
      const date = new Date(Date.UTC(day.year, day.month - 1, day.day + template.offset_dias)).toISOString().slice(0, 10)
      const inicio = localToUtc(date, template.inicio_local)
      const fim = localToUtc(date, template.fim_local)
      const previous = assert(await actor.from('reservas').select('id').eq('sala_id', template.sala_id).eq('inicio', inicio).eq('fim', fim).eq('status', 'ativa').eq('motivo', template.motivo).maybeSingle(), 'verificar reserva relativa')
      if (!previous) assert(await actor.rpc('reservar_sala', { p_sala_id: template.sala_id, p_inicio: inicio, p_fim: fim, p_motivo: template.motivo }), 'criar reserva pela sessão docente')
      reservations.push({ alias: template.alias, inicio, fim, status: previous ? 'existente' : 'criada' })
    } finally { await actor.auth.signOut({ scope: 'local' }) }
  }
  const target = path.join(root, 'work')
  await mkdir(target, { recursive: true })
  // Contains identifiers and synthetic email aliases only: no tokens or passwords.
  const users = fixture.profiles.map(p => ({ alias: p.alias, id: mapping[p.id], email: p.email_fixture, papel: p.papel }))
  await writeFile(path.join(target, 'supabase-test-identities.json'), JSON.stringify({ endpoint: endpoint.origin, provisionedAt: new Date().toISOString(), fixtureVersion: fixture.fixture_version, users, reservations, backendClock: backendClock.toISOString(), backendClockSource: 'Cabeçalho Date de Auth health no servidor local', warning: 'Não representa resultado de testes de Auth/RLS. Não limpa dados anteriores ou reservas.' }, null, 2))
  // SQL for manual independent inspection in the local SQL editor. No API credentials.
  await writeFile(path.join(target, 'verify-fixture.sql'), `-- Leitura independente do par acadêmico; deve iniciar em zero após reset local.\nselect count(*) from public.matriculas where aluno_id=${literal(fixture.alunos[0].id)} and oferta_id=${literal(fixture.ofertas_disciplina[1].id)} and status='ativa';\n`)
  console.log('Contas Auth sintéticas provisionadas, IDs mapeados e templates de reserva preparados. Mapa em work/supabase-test-identities.json. Estado anterior não foi apagado; para uma rodada independente, use antes o reset do Supabase local descartável.')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
