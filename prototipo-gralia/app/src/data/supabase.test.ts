import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseRepository } from './supabase'

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))

/** SDK unit doubles: these assertions do not exercise Auth, RLS, or a live database. */
describe('adaptador Supabase — testes unitários com SDK simulado', () => {
  const admin = { id: 'admin-auth-id', nome: 'Admin sintético', papel: 'admin' }
  const rpc = vi.fn()
  const getUser = vi.fn()
  const getSession = vi.fn()
  const signOut = vi.fn()
  const signInWithPassword = vi.fn()
  const profileQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test_key')
    getSession.mockResolvedValue({ data: { session: { access_token: 'unit-only' } }, error: null })
    getUser.mockResolvedValue({ data: { user: { id: admin.id } }, error: null })
    profileQuery.maybeSingle.mockResolvedValue({ data: admin, error: null })
    signOut.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({ data: null, error: null })
    vi.mocked(createClient).mockReturnValue({
      auth: { getSession, getUser, signOut, signInWithPassword },
      from: vi.fn().mockReturnValue(profileQuery), rpc,
    } as unknown as ReturnType<typeof createClient>)
  })

  afterEach(() => vi.unstubAllEnvs())

  it('falha sem configuração e não cria cliente nem ativa uma demo', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    const repository = createSupabaseRepository()
    await expect(repository.session()).rejects.toMatchObject({ code: 'CONFIGURATION_ERROR' })
    expect(repository.mode).toBe('supabase')
    expect('reset' in repository).toBe(false)
    expect(createClient).not.toHaveBeenCalled()
  })

  it.each(['http://remote.example.test', 'invalid-url'])('rejeita URL insegura ou inválida %s', async url => {
    vi.stubEnv('VITE_SUPABASE_URL', url)
    await expect(createSupabaseRepository().session()).rejects.toMatchObject({ code: 'CONFIGURATION_ERROR' })
    expect(createClient).not.toHaveBeenCalled()
  })

  it.each(['sb_secret_do_not_use', `x.${btoa('{"role":"service_role"}')}.x`])('rejeita chave administrativa sem devolvê-la no erro', async key => {
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', key)
    let observed: unknown
    try { await createSupabaseRepository().session() } catch (error) { observed = error }
    expect(observed).toMatchObject({ code: 'CONFIGURATION_ERROR' })
    expect(String(observed)).not.toContain(key)
    expect(createClient).not.toHaveBeenCalled()
  })

  it('usuário sem sessão retorna null sem buscar dados ou perfil', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null })
    expect(await createSupabaseRepository().session()).toBeNull()
    expect(getUser).not.toHaveBeenCalled()
    expect(profileQuery.select).not.toHaveBeenCalled()
  })

  it('valida usuário no Auth e busca papel do profile protegido', async () => {
    expect(await createSupabaseRepository().session()).toEqual(admin)
    expect(getUser).toHaveBeenCalledOnce()
    expect(profileQuery.eq).toHaveBeenCalledWith('id', admin.id)
  })

  it('não usa metadados editáveis para aceitar papel admin', async () => {
    getUser.mockResolvedValue({ data: { user: { id: admin.id, user_metadata: { papel: 'admin' } } }, error: null })
    profileQuery.maybeSingle.mockResolvedValue({ data: null, error: null })
    await expect(createSupabaseRepository().session()).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('sessão expirada falha com código estável e não retorna dados em cache', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { status: 401, message: 'expired token' } })
    await expect(createSupabaseRepository().read()).rejects.toMatchObject({ code: 'SESSION_INVALID' })
    expect(profileQuery.select).not.toHaveBeenCalled()
  })

  it('CT-GR-002: lista vazia é rejeitada antes da chamada de escrita', async () => {
    await expect(createSupabaseRepository().enroll('aluno-id', [])).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rejeita repetição na entrada antes de chamar a RPC', async () => {
    await expect(createSupabaseRepository().enroll('aluno-id', ['oferta-id', 'oferta-id'])).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('envia todo lote em uma única RPC', async () => {
    await createSupabaseRepository().enroll('aluno-id', ['oferta-a', 'oferta-b'])
    expect(rpc).toHaveBeenCalledExactlyOnceWith('registrar_matriculas', { p_aluno_id: 'aluno-id', p_oferta_ids: ['oferta-a', 'oferta-b'] })
  })

  it('erro de rede rejeita a promessa sem devolver sucesso', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } })
    await expect(createSupabaseRepository().enroll('aluno-id', ['oferta-a'])).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
  })

  it('preserva conflito de reserva como erro de domínio legível', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '23P01', message: 'conflicting key' } })
    await expect(createSupabaseRepository().reserve({ sala_id: 'sala-id', inicio: '2099-11-16T12:00:00Z', fim: '2099-11-16T13:00:00Z', motivo: 'Aula' })).rejects.toMatchObject({ code: 'RESERVATION_CONFLICT' })
  })
})
