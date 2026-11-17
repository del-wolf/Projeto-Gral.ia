export type Papel = 'aluno' | 'professor' | 'admin';
export interface Profile { id: string; nome: string; papel: Papel; alias?: string; email_fixture?: string }
export interface Aluno { id: string; profile_id?: string | null; nome: string; matricula: string; email?: string | null; status: 'ativo' | 'inativo'; alias?: string }
export interface Professor { id: string; profile_id?: string | null; nome: string; email?: string | null; status: 'ativo' | 'inativo'; alias?: string }
export interface Periodo { id: string; codigo: string; inicio: string; fim: string }
export interface Turma { id: string; codigo: string; nome: string }
export interface Disciplina { id: string; codigo: string; nome: string; carga_horaria: number; descricao?: string }
export interface Oferta { id: string; codigo: string; disciplina_id: string; turma_id: string; periodo_id: string; professor_id: string; plano_ensino: string; referencias: string }
export interface Matricula { id: string; aluno_id: string; oferta_id: string; status: 'ativa' | 'cancelada'; criada_em?: string }
export interface Avaliacao { id: string; oferta_id: string; titulo: string; peso: number; data?: string | null }
export interface Nota { id: string; oferta_id: string; avaliacao_id: string; matricula_id: string; valor: number }
export interface Aula { id: string; oferta_id: string; titulo: string; data: string }
export interface Frequencia { id: string; oferta_id: string; aula_id: string; matricula_id: string; status: 'presente' | 'falta' }
export interface Material { id: string; oferta_id: string; titulo: string; descricao?: string; url: string; autor_profile_id?: string; criado_em?: string }
export interface Sala { id: string; codigo: string; nome: string; ativa: boolean }
export interface Reserva { id: string; sala_id: string; inicio: string; fim: string; status: 'ativa' | 'cancelada'; solicitante_profile_id?: string; motivo?: string; cancelada_por?: string; cancelada_em?: string }
export interface State { profiles: Profile[]; alunos: Aluno[]; professores: Professor[]; periodos: Periodo[]; turmas: Turma[]; disciplinas: Disciplina[]; ofertas_disciplina: Oferta[]; matriculas: Matricula[]; avaliacoes: Avaliacao[]; notas: Nota[]; aulas: Aula[]; frequencias: Frequencia[]; materiais: Material[]; salas: Sala[]; reservas: Reserva[] }
export type SaveEntity = 'alunos' | 'professores' | 'periodos' | 'turmas' | 'disciplinas' | 'ofertas_disciplina' | 'avaliacoes' | 'notas' | 'aulas' | 'frequencias' | 'materiais' | 'salas';
export type SaveData = Partial<Omit<Aluno & Professor & Periodo & Turma & Disciplina & Oferta & Avaliacao & Nota & Aula & Material & Sala, 'status'>> & {status?: 'ativo' | 'inativo' | 'presente' | 'falta'; aula_id?: string};
export interface ReservationInput { sala_id: string; inicio: string; fim: string; motivo: string }
export interface Repository { mode: 'demo' | 'supabase'; session(): Promise<Profile | null>; signIn(credentials: {alias?: string; email?: string; password?: string}): Promise<Profile>; signOut(): Promise<void>; read(): Promise<State>; findStudent(matricula: string): Promise<Aluno | null>; enroll(alunoId: string, ofertaIds: string[]): Promise<void>; save(entity: SaveEntity, data: SaveData): Promise<void>; reserve(input: ReservationInput): Promise<void>; cancelReservation(id: string): Promise<void>; reset?(): Promise<void> }
