import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Repository, Profile, State } from '../domain/types'

/** Errors expose stable application codes; transport payloads and credentials stay private. */
export class SupabaseRepositoryError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'SupabaseRepositoryError'
  }
}

type TransportError = { code?: string; message?: string; status?: number }

function fail(error: TransportError | Error | null | undefined): never {
  const code = error && 'code' in error ? String(error.code ?? '') : ''
  const message = error?.message ?? ''
  const marker = `${code} ${message}`.toUpperCase()
  if (code === '23P01' || marker.includes('RESERVATION_CONFLICT')) {
    throw new SupabaseRepositoryError('RESERVATION_CONFLICT', 'Este ambiente já está reservado nesse horário. Escolha outro intervalo.')
  }
  if (marker.includes('DUPLICATE_ENROLLMENT')) {
    throw new SupabaseRepositoryError('DUPLICATE_ENROLLMENT', 'O aluno já possui matrícula ativa em uma das ofertas. Nenhum vínculo do lote foi criado.')
  }
  if (code === '23505') throw new SupabaseRepositoryError('VALIDATION_ERROR', 'Já existe um registro com essa identificação. Revise os dados.')
  if (code === '42501' || marker.includes('FORBIDDEN')) {
    throw new SupabaseRepositoryError('FORBIDDEN', 'Seu perfil não tem permissão para esta operação.')
  }
  if (code === '23503' || marker.includes('NOT_FOUND')) {
    throw new SupabaseRepositoryError('NOT_FOUND', 'Um dos registros informados não está disponível. Atualize os dados e tente novamente.')
  }
  if (['23514', '22003', '22007', '22P02'].includes(code) || marker.includes('VALIDATION_ERROR')) {
    throw new SupabaseRepositoryError('VALIDATION_ERROR', 'Os dados foram rejeitados. Confira os campos e as regras da operação.')
  }
  if (['PGRST301', 'PGRST302'].includes(code) || marker.includes('JWT') || marker.includes('SESSION_INVALID') || ('status' in (error ?? {}) && (error as TransportError).status === 401)) {
    throw new SupabaseRepositoryError('SESSION_INVALID', 'Sua sessão não é válida. Entre novamente para continuar.')
  }
  if (marker.includes('INVALID LOGIN CREDENTIALS')) throw new SupabaseRepositoryError('SESSION_INVALID', 'E-mail ou senha inválidos.')
  throw new SupabaseRepositoryError('NETWORK_ERROR', 'Não foi possível concluir a comunicação com o Supabase. Verifique a conexão e tente novamente; os campos foram preservados.')
}

function publicConfiguration(): { url: string; key: string } {
  const url = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim()
  const key = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim()
  if (!url || !key) {
    throw new SupabaseRepositoryError('CONFIGURATION_ERROR', 'Modo Supabase sem configuração. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY em .env.local e reinicie o servidor. A demo usa npm run dev:demo.')
  }
  let parsed: URL
  try { parsed = new URL(url) } catch {
    throw new SupabaseRepositoryError('CONFIGURATION_ERROR', 'VITE_SUPABASE_URL precisa ser uma URL válida do seu ambiente Supabase.')
  }
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname))) {
    throw new SupabaseRepositoryError('CONFIGURATION_ERROR', 'Use HTTPS para o Supabase remoto ou HTTP apenas em localhost.')
  }
  let secret = key.startsWith('sb_secret_')
  // Legacy JWT anon keys are public; reject an accidentally supplied service-role JWT.
  if (key.split('.').length === 3) {
    try {
      const claims = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { role?: unknown }
      secret ||= claims.role === 'service_role'
    } catch { /* The server remains responsible for checking malformed public tokens. */ }
  }
  if (secret) throw new SupabaseRepositoryError('CONFIGURATION_ERROR', 'Chave administrativa não é permitida no navegador. Configure somente a chave pública/publishable.')
  return { url, key }
}

const tables = [
  'profiles', 'alunos', 'professores', 'periodos', 'turmas', 'disciplinas',
  'ofertas_disciplina', 'matriculas', 'avaliacoes', 'notas', 'aulas',
  'frequencias', 'materiais', 'salas',
] as const

/** Explicit columns prevent accidental writes of identity, role, or arbitrary metadata. */
const editableColumns: Record<string, readonly string[]> = {
  alunos: ['id', 'nome', 'matricula', 'email', 'status'],
  professores: ['id', 'nome', 'email', 'status'],
  periodos: ['id', 'codigo', 'inicio', 'fim'],
  turmas: ['id', 'codigo', 'nome'],
  disciplinas: ['id', 'codigo', 'nome', 'descricao', 'carga_horaria'],
  ofertas_disciplina: ['id', 'codigo', 'disciplina_id', 'turma_id', 'periodo_id', 'professor_id', 'plano_ensino', 'referencias'],
  avaliacoes: ['id', 'oferta_id', 'titulo', 'peso', 'data'],
  notas: ['id', 'avaliacao_id', 'matricula_id', 'oferta_id', 'valor'],
  aulas: ['id', 'oferta_id', 'titulo', 'data'],
  frequencias: ['id', 'aula_id', 'matricula_id', 'oferta_id', 'status'],
  materiais: ['id', 'oferta_id', 'titulo', 'descricao', 'url'],
  salas: ['id', 'codigo', 'nome', 'ativa'],
}

export function createSupabaseRepository(): Repository {
  let instance: SupabaseClient | undefined
  function client(): SupabaseClient {
    if (!instance) {
      const { url, key } = publicConfiguration()
      instance = createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'gralia.auth.v1' },
      })
    }
    return instance
  }

  async function profileFor(id: string): Promise<Profile> {
    const { data, error } = await client().from('profiles').select('id,nome,papel').eq('id', id).maybeSingle()
    if (error) fail(error)
    if (!data || !['aluno', 'professor', 'admin'].includes(String(data.papel))) {
      throw new SupabaseRepositoryError('FORBIDDEN', 'Conta sem perfil acadêmico provisionado. Solicite o vínculo ao responsável pelo ambiente.')
    }
    return data as Profile
  }

  async function session(): Promise<Profile | null> {
    const { data: stored, error: storedError } = await client().auth.getSession()
    if (storedError) fail(storedError)
    if (!stored.session) return null
    const { data, error } = await client().auth.getUser()
    if (error) fail(error)
    if (!data.user) throw new SupabaseRepositoryError('SESSION_INVALID', 'Sessão encerrada. Entre novamente.')
    return profileFor(data.user.id)
  }

  async function requireSession(): Promise<Profile> {
    const current = await session()
    if (!current) throw new SupabaseRepositoryError('SESSION_INVALID', 'Entre para acessar os dados acadêmicos.')
    return current
  }

  return {
    mode: 'supabase',
    session,
    async signIn(credentials) {
      if (!credentials.email?.trim() || !credentials.password) throw new SupabaseRepositoryError('VALIDATION_ERROR', 'Informe e-mail e senha.')
      const { data, error } = await client().auth.signInWithPassword({ email: credentials.email.trim(), password: credentials.password })
      if (error) fail(error)
      if (!data.user) throw new SupabaseRepositoryError('SESSION_INVALID', 'Não foi possível iniciar a sessão.')
      try { return await profileFor(data.user.id) } catch (profileError) {
        await client().auth.signOut({ scope: 'local' })
        throw profileError
      }
    },
    async signOut() {
      const { error } = await client().auth.signOut({ scope: 'local' })
      if (error) fail(error)
    },
    async read() {
      const current = await requireSession()
      const rows = await Promise.all(tables.map(async table => {
        const { data, error } = await client().from(table).select('*')
        if (error) fail(error)
        return [table, data ?? []] as const
      }))
      const { data: availability, error: availabilityError } = await client().rpc('disponibilidade_salas')
      if (availabilityError) fail(availabilityError)
      const reservations = new Map<string, Record<string, unknown>>()
      for (const item of (availability ?? []) as Record<string, unknown>[]) reservations.set(String(item.id), item)
      if (current.papel !== 'aluno') {
        const { data, error } = await client().from('reservas').select('*')
        if (error) fail(error)
        for (const item of (data ?? []) as Record<string, unknown>[]) reservations.set(String(item.id), item)
      }
      return { ...Object.fromEntries(rows), reservas: [...reservations.values()] } as unknown as State
    },
    async findStudent(matricula) {
      const current = await requireSession()
      if (current.papel !== 'admin') throw new SupabaseRepositoryError('FORBIDDEN', 'Somente o admin técnico pode buscar matrícula para novos vínculos.')
      const normalized = matricula.trim().toUpperCase().replace(/\s+/g, '')
      if (!normalized) return null
      const { data, error } = await client().from('alunos').select('*').eq('matricula', normalized).maybeSingle()
      if (error) fail(error)
      return data
    },
    async enroll(alunoId, ofertaIds) {
      const current = await requireSession()
      if (current.papel !== 'admin') throw new SupabaseRepositoryError('FORBIDDEN', 'Somente o admin técnico pode registrar matrículas.')
      if (!ofertaIds.length || new Set(ofertaIds).size !== ofertaIds.length) throw new SupabaseRepositoryError('VALIDATION_ERROR', 'Selecione uma ou mais ofertas diferentes. Nenhuma matrícula foi gravada.')
      const { error } = await client().rpc('registrar_matriculas', { p_aluno_id: alunoId, p_oferta_ids: ofertaIds })
      if (error) fail(error)
    },
    async save(entity, data) {
      await requireSession()
      const allowed = editableColumns[entity]
      if (!allowed) throw new SupabaseRepositoryError('FORBIDDEN', 'Esta entidade não pode ser alterada pelo formulário.')
      const row = Object.fromEntries(Object.entries(data).filter(([key]) => allowed.includes(key)))
      const conflict = entity === 'notas' ? 'avaliacao_id,matricula_id' : entity === 'frequencias' ? 'aula_id,matricula_id' : 'id'
      const { data: persisted, error } = await client().from(entity).upsert(row, { onConflict: conflict }).select('id').maybeSingle()
      if (error) fail(error)
      if (!persisted) throw new SupabaseRepositoryError('FORBIDDEN', 'A gravação não foi confirmada. Atualize os dados e verifique sua permissão.')
    },
    async reserve(input) {
      await requireSession()
      const { error } = await client().rpc('reservar_sala', {
        p_sala_id: input.sala_id, p_inicio: input.inicio, p_fim: input.fim, p_motivo: input.motivo,
      })
      if (error) fail(error)
    },
    async cancelReservation(id) {
      await requireSession()
      const { error } = await client().rpc('cancelar_reserva', { p_reserva_id: id })
      if (error) fail(error)
    },
  }
}

export default createSupabaseRepository
