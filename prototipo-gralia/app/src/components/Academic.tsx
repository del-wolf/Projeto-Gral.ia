import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Profile, Repository, State } from '../domain/types';
import { Button } from './ui/button';

type Props = {
  repo: Repository;
  state: State;
  profile: Profile;
  onChange: () => Promise<void>;
  notify: (message: string, error?: boolean) => void;
};

function text(form: FormData, key: string): string {
  return String(form.get(key) ?? '').trim();
}

function displayDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'America/Sao_Paulo' })
    .format(new Date(`${value.slice(0, 10)}T12:00:00-03:00`));
}

function safeMaterialUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function EntryForm({ title, children, action, onSaved, notify, submit = 'Salvar' }: {
  title: string;
  children: ReactNode;
  action: (data: FormData) => Promise<void>;
  onSaved: () => Promise<void>;
  notify: Props['notify'];
  submit?: string;
}) {
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    const form = event.currentTarget;
    setPending(true);
    setError('');
    try {
      await action(new FormData(form));
      await onSaved();
      form.reset();
      notify(`${title}: dados salvos.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível salvar. Tente novamente.';
      setError(message);
      notify(message, true);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return <form className="card stack" onSubmit={handleSubmit} aria-label={title} aria-busy={pending}>
    <h3>{title}</h3>
    {children}
    {error && <p role="alert">{error}</p>}
    <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : submit}</Button>
  </form>;
}

export function Academic({ repo, state, profile, onChange, notify }: Props) {
  const [chosenOffer, setChosenOffer] = useState('');
  const teacher = state.professores.find(item => item.profile_id === profile.id);
  const student = state.alunos.find(item => item.profile_id === profile.id);
  const teaching = profile.papel === 'professor';
  const offers = state.ofertas_disciplina.filter(offer => teaching
    ? offer.professor_id === teacher?.id
    : state.matriculas.some(item => item.oferta_id === offer.id && item.aluno_id === student?.id && item.status === 'ativa'));
  const offer = offers.find(item => item.id === chosenOffer) ?? offers[0];
  const subjectName = (id: string) => state.disciplinas.find(item => item.id === id)?.nome ?? 'Disciplina';
  const groupName = (id: string) => state.turmas.find(item => item.id === id)?.codigo ?? '';
  const periodName = (id: string) => state.periodos.find(item => item.id === id)?.codigo ?? '';

  if (profile.papel === 'admin') return <section className="card"><h1>Acesso restrito</h1><p>O admin técnico configura cadastros e vínculos. Dados pedagógicos são acessados pelo aluno ou docente responsável.</p></section>;

  if (!offer) return <section className="stack"><div className="page-header"><p className="muted">Seu espaço acadêmico</p><h1>Minhas disciplinas</h1></div><div className="card"><h2>Nenhuma oferta disponível</h2><p>{teaching ? 'Nenhuma oferta foi atribuída ao seu cadastro docente.' : 'Você ainda não tem matrículas ativas. Consulte o responsável pela configuração acadêmica.'}</p></div></section>;

  const assessments = state.avaliacoes.filter(item => item.oferta_id === offer.id);
  const lessons = state.aulas.filter(item => item.oferta_id === offer.id);
  const enrollments = state.matriculas.filter(item => item.oferta_id === offer.id && item.status === 'ativa' && (teaching || item.aluno_id === student?.id));
  const materials = state.materiais.filter(item => item.oferta_id === offer.id);
  const events = [
    ...lessons.map(item => ({ id: item.id, data: item.data, titulo: item.titulo, tipo: 'Aula' })),
    ...assessments.filter(item => item.data).map(item => ({ id: item.id, data: item.data!, titulo: item.titulo, tipo: 'Avaliação' })),
  ].sort((a, b) => a.data.localeCompare(b.data));

  return <section className="stack">
    <div className="page-header"><p className="muted">{teaching ? 'Ensinar, acompanhar, compartilhar' : 'Aprender, acompanhar, organizar'}</p><h1>Minhas disciplinas</h1><p>{offers.length} {offers.length === 1 ? 'oferta vinculada' : 'ofertas vinculadas'} ao seu perfil.</p></div>
    <label className="field">Oferta da disciplina
      <select value={offer.id} onChange={event => setChosenOffer(event.target.value)} data-testid="academic-offer">
        {offers.map(item => <option key={item.id} value={item.id}>{subjectName(item.disciplina_id)} · {groupName(item.turma_id)} · {periodName(item.periodo_id)} · {item.codigo}</option>)}
      </select>
    </label>
    <article className="card stack">
      <div><span className="badge">{offer.codigo}</span><h2>{subjectName(offer.disciplina_id)}</h2><p className="muted">{groupName(offer.turma_id)} · {periodName(offer.periodo_id)} · {state.professores.find(item => item.id === offer.professor_id)?.nome ?? 'Docente responsável'}</p></div>
      <div className="grid"><div><h3>Plano de ensino</h3><p>{offer.plano_ensino || 'Plano ainda não informado.'}</p></div><div><h3>Referências</h3><p>{offer.referencias || 'Referências ainda não informadas.'}</p></div></div>
    </article>

    <section className="stack" aria-labelledby="grade-title"><div><h2 id="grade-title">Notas e avaliações</h2><p className="muted">Escala demonstrativa de 0 a 10. Pendência não equivale a zero.</p></div>
      {!assessments.length && <p className="card">Nenhuma avaliação foi criada nesta oferta.</p>}
      {!enrollments.length && <p className="card">Nenhuma matrícula ativa nesta oferta.</p>}
      {enrollments.map(enrollment => {
        const rows = assessments.map(assessment => ({ assessment, grade: state.notas.find(item => item.avaliacao_id === assessment.id && item.matricula_id === enrollment.id) }));
        const scored = rows.filter(item => item.grade !== undefined);
        const weight = scored.reduce((sum, row) => sum + row.assessment.peso, 0);
        const average = weight ? scored.reduce((sum, row) => sum + row.grade!.valor * row.assessment.peso, 0) / weight : null;
        const missing = rows.length - scored.length;
        return <article className="card stack" key={enrollment.id}><h3>{state.alunos.find(item => item.id === enrollment.aluno_id)?.nome ?? 'Aluno da oferta'}</h3>
          <div className="table-wrap"><table><caption>Notas de {subjectName(offer.disciplina_id)}</caption><thead><tr><th scope="col">Avaliação</th><th scope="col">Peso</th><th scope="col">Data</th><th scope="col">Nota</th></tr></thead><tbody>{rows.map(({ assessment, grade }) => <tr key={assessment.id}><th scope="row">{assessment.titulo}</th><td>{assessment.peso}</td><td>{assessment.data ? displayDate(assessment.data) : 'Não agendada'}</td><td>{grade === undefined ? 'Pendente' : decimal.format(grade.valor)}</td></tr>)}</tbody></table></div>
          <p data-testid="grade-average"><strong>Média {missing ? 'parcial' : 'completa'}: {average === null ? 'Sem notas lançadas' : decimal.format(average)}</strong> · {missing} {missing === 1 ? 'pendência' : 'pendências'}</p>
        </article>;
      })}
    </section>

    <section className="stack" aria-labelledby="attendance-title"><div><h2 id="attendance-title">Frequência</h2><p className="muted">Cada aula vale uma unidade nesta demonstração. Registros ausentes permanecem pendentes.</p></div>
      {!lessons.length && <p className="card">Nenhuma aula foi registrada nesta oferta.</p>}
      {enrollments.map(enrollment => {
        const rows = lessons.map(lesson => ({ lesson, attendance: state.frequencias.find(item => item.aula_id === lesson.id && item.matricula_id === enrollment.id) }));
        const present = rows.filter(item => item.attendance?.status === 'presente').length;
        const absent = rows.filter(item => item.attendance?.status === 'falta').length;
        const pending = rows.length - present - absent;
        const percent = present + absent ? present / (present + absent) * 100 : null;
        return <article key={enrollment.id} className="card stack"><h3>{state.alunos.find(item => item.id === enrollment.aluno_id)?.nome ?? 'Aluno da oferta'}</h3><div className="table-wrap"><table><caption>Presenças em {subjectName(offer.disciplina_id)}</caption><thead><tr><th scope="col">Aula</th><th scope="col">Data</th><th scope="col">Registro</th></tr></thead><tbody>{rows.map(({ lesson, attendance }) => <tr key={lesson.id}><th scope="row">{lesson.titulo}</th><td>{displayDate(lesson.data)}</td><td>{attendance === undefined ? 'Pendente' : attendance.status === 'presente' ? 'P · Presente' : 'F · Falta'}</td></tr>)}</tbody></table></div><p data-testid="attendance-summary">{present} presença(s) · {absent} falta(s) · {pending} pendência(s). <strong>Frequência {pending ? 'parcial' : ''}: {percent === null ? 'Sem registros' : `${decimal.format(percent)}%`}</strong></p></article>;
      })}
    </section>

    <div className="grid">
      <section className="card stack" aria-labelledby="material-title"><h2 id="material-title">Materiais de estudo</h2>{materials.length ? <ul className="stack">{materials.map(item => <li key={item.id}>{safeMaterialUrl(item.url) ? <a href={safeMaterialUrl(item.url)!} target="_blank" rel="noopener noreferrer">{item.titulo} <span className="muted">(abre em nova aba)</span></a> : <span>{item.titulo} · Link indisponível: endereço não permitido.</span>}{item.descricao && <p>{item.descricao}</p>}</li>)}</ul> : <p className="muted">Nenhum material publicado nesta oferta.</p>}</section>
      <section className="card stack" aria-labelledby="agenda-title"><h2 id="agenda-title">Agenda da oferta</h2>{events.length ? <ol className="stack">{events.map(item => <li key={`${item.tipo}-${item.id}`}><span className="badge">{item.tipo}</span> <time dateTime={item.data}>{displayDate(item.data)}</time><p>{item.titulo}</p></li>)}</ol> : <p className="muted">Não há aulas ou avaliações agendadas nesta oferta.</p>}</section>
    </div>

    {teaching && <section className="stack" aria-labelledby="teacher-title" key={offer.id}>
      <div><h2 id="teacher-title">Diário do professor</h2><p className="muted">Alterações ficam restritas à oferta selecionada.</p></div>
      <div className="grid">
        <EntryForm title="Criar avaliação" onSaved={onChange} notify={notify} action={data => repo.save('avaliacoes', { oferta_id: offer.id, titulo: text(data, 'titulo'), peso: Number(text(data, 'peso').replace(',', '.')), data: text(data, 'data') || undefined })}>
          <label className="field">Título da avaliação<input name="titulo" required maxLength={150} /></label>
          <label className="field">Peso positivo<input name="peso" type="number" step="0.01" min="0.01" defaultValue="1" required /></label>
          <label className="field">Data da avaliação (opcional)<input name="data" type="date" /></label>
        </EntryForm>
        <EntryForm title="Lançar ou editar nota" onSaved={onChange} notify={notify} action={data => {
          const matriculaId = text(data, 'matricula_id');
          const avaliacaoId = text(data, 'avaliacao_id');
          const existing = state.notas.find(item => item.matricula_id === matriculaId && item.avaliacao_id === avaliacaoId);
          const raw = text(data, 'valor');
          if (!/^\d+(?:[.,]\d{1,2})?$/.test(raw)) throw new Error('Informe uma nota de 0 a 10, com até duas casas decimais.');
          return repo.save('notas', { id: existing?.id, oferta_id: offer.id, matricula_id: matriculaId, avaliacao_id: avaliacaoId, valor: Number(raw.replace(',', '.')) });
        }}>
          <label className="field">Aluno para nota<select name="matricula_id" required defaultValue=""><option value="" disabled>Selecione um aluno</option>{enrollments.map(item => <option key={item.id} value={item.id}>{state.alunos.find(studentItem => studentItem.id === item.aluno_id)?.nome}</option>)}</select></label>
          <label className="field">Avaliação<select name="avaliacao_id" required defaultValue=""><option value="" disabled>Selecione uma avaliação</option>{assessments.map(item => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select></label>
          <label className="field">Nota (0 a 10)<input name="valor" inputMode="decimal" placeholder="Ex.: 8,75" required aria-describedby="grade-help" /></label><p id="grade-help" className="muted">Use até duas casas decimais. Zero é válido; vazio não será salvo.</p>
        </EntryForm>
        <EntryForm title="Registrar aula" onSaved={onChange} notify={notify} action={data => repo.save('aulas', { oferta_id: offer.id, titulo: text(data, 'titulo'), data: text(data, 'data') })}>
          <label className="field">Título da aula<input name="titulo" required maxLength={150} /></label>
          <label className="field">Data da aula<input name="data" type="date" required /></label>
        </EntryForm>
        <EntryForm title="Registrar ou editar frequência" onSaved={onChange} notify={notify} action={data => {
          const matriculaId = text(data, 'matricula_id');
          const aulaId = text(data, 'aula_id');
          const existing = state.frequencias.find(item => item.matricula_id === matriculaId && item.aula_id === aulaId);
          const status = text(data, 'status');
          if (status !== 'presente' && status !== 'falta') throw new Error('Selecione P ou F antes de salvar.');
          return repo.save('frequencias', { id: existing?.id, oferta_id: offer.id, matricula_id: matriculaId, aula_id: aulaId, status });
        }}>
          <label className="field">Aluno para frequência<select name="matricula_id" required defaultValue=""><option value="" disabled>Selecione um aluno</option>{enrollments.map(item => <option key={item.id} value={item.id}>{state.alunos.find(studentItem => studentItem.id === item.aluno_id)?.nome}</option>)}</select></label>
          <label className="field">Aula<select name="aula_id" required defaultValue=""><option value="" disabled>Selecione uma aula</option>{lessons.map(item => <option key={item.id} value={item.id}>{item.titulo} · {displayDate(item.data)}</option>)}</select></label>
          <label className="field">Presença ou falta<select name="status" required defaultValue=""><option value="" disabled>Selecione P ou F</option><option value="presente">P · Presente</option><option value="falta">F · Falta</option></select></label>
        </EntryForm>
        <EntryForm title="Publicar material" onSaved={onChange} notify={notify} action={data => repo.save('materiais', { oferta_id: offer.id, titulo: text(data, 'titulo'), descricao: text(data, 'descricao'), url: text(data, 'url') })}>
          <label className="field">Título do material<input name="titulo" required maxLength={150} /></label>
          <label className="field">Descrição (opcional)<textarea name="descricao" rows={3} maxLength={2000} /></label>
          <label className="field">URL do material<input name="url" type="url" placeholder="https://" required aria-describedby="url-help" /></label><p id="url-help" className="muted">Informe um link HTTP ou HTTPS. Arquivos e vídeos não são incorporados à página.</p>
        </EntryForm>
      </div>
    </section>}
  </section>;
}
