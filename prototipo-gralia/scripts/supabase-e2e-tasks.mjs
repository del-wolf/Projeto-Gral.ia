import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'

const confirmation = 'LOCAL_DISPOSABLE_ONLY'
const loopback = new Set(['localhost', '127.0.0.1', '[::1]'])

/** Never accepts a remote URL, even when confirmation is supplied. No secrets are returned. */
export function integrationConfiguration(environment = process.env) {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'GRALIA_TEST_SERVICE_ROLE_KEY', 'GRALIA_TEST_PASSWORD', 'GRALIA_DISPOSABLE_LOCAL']
  const missing = required.filter(name => !environment[name])
  if (missing.length) throw new Error(`BLOQUEADO: faltam variáveis de integração local: ${missing.join(', ')}. Nenhuma alteração foi feita.`)
  let endpoint
  try { endpoint = new URL(environment.VITE_SUPABASE_URL) } catch { throw new Error('BLOQUEADO: URL local Supabase inválida.') }
  if (!loopback.has(endpoint.hostname) || !['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password || !['', '/'].includes(endpoint.pathname) || endpoint.search || endpoint.hash) {
    throw new Error('BLOQUEADO: o E2E permite somente URL loopback local, sem credenciais, caminho, busca ou fragmento. Nenhum destino remoto será alterado.')
  }
  if (environment.GRALIA_DISPOSABLE_LOCAL !== confirmation) throw new Error(`BLOQUEADO: confirme o descarte dos dados acadêmicos locais com GRALIA_DISPOSABLE_LOCAL=${confirmation}.`)
  if (environment.GRALIA_TEST_PASSWORD.length < 12) throw new Error('BLOQUEADO: use senha sintética de testes com pelo menos 12 caracteres.')
  const publicKey = environment.VITE_SUPABASE_PUBLISHABLE_KEY
  let administrative = publicKey.startsWith('sb_secret_')
  try { administrative ||= JSON.parse(Buffer.from(publicKey.split('.')[1] ?? '', 'base64url').toString()).role === 'service_role' } catch { /* Publishable keys need not be JWTs. */ }
  if (administrative) throw new Error('BLOQUEADO: a variável VITE_ aceita somente a chave pública, nunca a administrativa.')
  return { url: endpoint.origin, publicKey, serviceKey: environment.GRALIA_TEST_SERVICE_ROLE_KEY, password: environment.GRALIA_TEST_PASSWORD }
}

function checked(result, operation) {
  if (result.error) throw new Error(`Integração: falha em ${operation}; código ${result.error.code ?? result.error.status ?? 'sem código'}. Credenciais e resposta bruta foram omitidas.`)
  return result.data
}

const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (input, init) => fetch(input, { ...init, redirect: 'error' }) },
}

function partsAt(date) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]))
}
function localToUtc(date, time) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const intended = Date.UTC(year, month - 1, day, hour, minute)
  let instant = intended
  for (let index = 0; index < 3; index += 1) {
    const local = partsAt(new Date(instant))
    instant += intended - Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second)
  }
  return new Date(instant).toISOString()
}

/** Cypress Node tasks only: service-role credentials never enter Cypress env/the browser. */
export function createSupabaseTasks(configuration, fixturePath = 'fixtures/gralia_seed_contract.json') {
  let ready = false
  let fixture
  const target = { student: undefined, offer: undefined }
  const service = createClient(configuration.url, configuration.serviceKey, options)
  const fixtureTables = ['profiles', 'alunos', 'professores', 'periodos', 'turmas', 'disciplinas', 'ofertas_disciplina', 'matriculas', 'avaliacoes', 'notas', 'aulas', 'frequencias', 'materiais', 'salas']
  const deleteOrder = ['reservas', 'notas', 'frequencias', 'materiais', 'avaliacoes', 'aulas', 'matriculas', 'ofertas_disciplina', 'disciplinas', 'turmas', 'periodos', 'alunos', 'professores', 'salas', 'profiles']
  function prepared() { if (!ready) throw new Error('Execute a tarefa de preparação local antes de consultar o cenário.') }
  async function authenticated(alias = 'ADMIN-QA') {
    prepared()
    const identity = fixture.profiles.find(item => item.alias === alias)
    if (!identity) throw new Error('Alias sintético inválido no teste.')
    const client = createClient(configuration.url, configuration.publicKey, options)
    checked(await client.auth.signInWithPassword({ email: identity.email_fixture, password: configuration.password }), `autenticar ${alias} com sua própria conta`)
    return client
  }
  async function counts(client) {
    const result = await client.from('matriculas').select('id,aluno_id,oferta_id,status')
    const rows = checked(result, 'consulta independente de matrículas pela Data API') ?? []
    return { total: rows.length, activeTarget: rows.filter(row => row.aluno_id === target.student && row.oferta_id === target.offer && row.status === 'ativa').length }
  }
  return {
    async prepareSupabaseFixture() {
      // Recheck the destructive boundary for every case, before the first mutation.
      integrationConfiguration({ ...process.env, VITE_SUPABASE_URL: configuration.url, VITE_SUPABASE_PUBLISHABLE_KEY: configuration.publicKey, GRALIA_TEST_SERVICE_ROLE_KEY: configuration.serviceKey, GRALIA_TEST_PASSWORD: configuration.password })
      ready = false
      fixture = JSON.parse(await readFile(fixturePath, 'utf8'))
      if (fixture.fixture_version !== '1.0') throw new Error('Fixture diferente da versão acadêmica 1.0; revise os testes antes de preparar o banco.')
      const listed = checked(await service.auth.admin.listUsers({ page: 1, perPage: 1000 }), 'validar Auth administrativo local')
      const mapped = new Map()
      for (const item of fixture.profiles) {
        const previous = listed.users.find(user => user.email === item.email_fixture)
        const result = previous
          ? await service.auth.admin.updateUserById(previous.id, { password: configuration.password, email_confirm: true })
          : await service.auth.admin.createUser({ email: item.email_fixture, password: configuration.password, email_confirm: true })
        const created = checked(result, 'provisionar conta Auth sintética local').user
        if (!created) throw new Error('Auth não confirmou a identidade criada.')
        mapped.set(item.id, created.id)
      }
      // Explicitly confirmed disposable local database only. Retain Auth accounts;
      // clear public application tables in FK order, then restore the same fixture.
      for (const table of deleteOrder) checked(await service.from(table).delete().not('id', 'is', null), `reiniciar ${table} no destino local confirmado`)
      for (const table of fixtureTables) {
        const rows = fixture[table].map(original => {
          const row = Object.fromEntries(Object.entries(original).filter(([name]) => !['alias', 'email_fixture'].includes(name)))
          if (table === 'profiles') row.id = mapped.get(row.id)
          if (row.profile_id) row.profile_id = mapped.get(row.profile_id)
          return row
        })
        if (rows.length) checked(await service.from(table).insert(rows), `restaurar fixture ${table}`)
      }
      const health = await fetch(`${configuration.url}/auth/v1/health`, { headers: { apikey: configuration.publicKey }, redirect: 'error' })
      const backendClock = new Date(health.headers.get('date') ?? '')
      if (!health.ok || Number.isNaN(backendClock.valueOf())) throw new Error('Backend não forneceu relógio válido para completar os templates de reservas.')
      const localDay = partsAt(backendClock)
      for (const template of fixture.reservas_templates ?? []) {
        const owner = fixture.profiles.find(item => item.id === template.solicitante_profile_id)
        if (!owner || template.status !== 'ativa') throw new Error('Template de reserva inválido na fixture.')
        const actor = createClient(configuration.url, configuration.publicKey, options)
        try {
          checked(await actor.auth.signInWithPassword({ email: owner.email_fixture, password: configuration.password }), 'autenticar docente para reserva base')
          const date = new Date(Date.UTC(localDay.year, localDay.month - 1, localDay.day + template.offset_dias)).toISOString().slice(0, 10)
          checked(await actor.rpc('reservar_sala', { p_sala_id: template.sala_id, p_inicio: localToUtc(date, template.inicio_local), p_fim: localToUtc(date, template.fim_local), p_motivo: template.motivo }), 'restaurar template de reserva com token docente')
        } finally { await actor.auth.signOut({ scope: 'local' }) }
      }
      target.student = fixture.alunos.find(item => item.matricula === 'QA2026001').id
      target.offer = fixture.ofertas_disciplina.find(item => item.codigo === 'OF-TEST-3A').id
      ready = true
      const baseline = await counts(await authenticated())
      if (baseline.total !== fixture.matriculas.length || baseline.activeTarget !== 0) throw new Error('Fixture reiniciada não corresponde à pré-condição dos casos acadêmicos.')
      return { fixtureVersion: fixture.fixture_version, total: baseline.total, activeTarget: baseline.activeTarget, student: 'QA2026001', offer: 'OF-TEST-3A', endpoint: configuration.url, backendClock: backendClock.toISOString(), reservationTemplates: fixture.reservas_templates?.length ?? 0, observedAt: new Date().toISOString() }
    },
    async browserAdminCredentials() {
      prepared()
      const identity = fixture.profiles.find(item => item.alias === 'ADMIN-QA')
      // Only the real test user's credentials are returned, never the service key.
      return { email: identity.email_fixture, password: configuration.password }
    },
    async independentEnrollmentCount() {
      return counts(await authenticated())
    },
    async emptyEnrollmentRpc() {
      const client = await authenticated()
      const before = await counts(client)
      const result = await client.rpc('registrar_matriculas', { p_aluno_id: target.student, p_oferta_ids: [] })
      const after = await counts(client)
      return { before, after, status: result.status, errorCode: result.error?.code ?? null, rejected: Boolean(result.error) }
    },
    async nonAdminEnrollmentRpc(alias) {
      if (!['ALUNO-A', 'ALUNO-B', 'PROF-A', 'PROF-B'].includes(alias)) throw new Error('Use somente alias sintético de aluno/professor neste teste.')
      const client = await authenticated(alias)
      const result = await client.rpc('registrar_matriculas', { p_aluno_id: target.student, p_oferta_ids: [target.offer] })
      return { status: result.status, errorCode: result.error?.code ?? null, rejected: Boolean(result.error) }
    },
  }
}
