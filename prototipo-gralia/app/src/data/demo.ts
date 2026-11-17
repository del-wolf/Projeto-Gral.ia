import fixture from '../../../fixtures/gralia_seed_contract.json';
import type { Repository, State, Profile, SaveData, SaveEntity } from '../domain/types';
import { DomainError, ensure, normalizeMatricula, grade, safeUrl, validateReservation, localDate } from '../domain/rules';
export const DEMO_STATE_KEY='gralia.demo.state.v1';
export const DEMO_SESSION_KEY='gralia.demo.session.v1';
const VERSION='1.0';
export interface DemoStorage {getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void}
export function seedState(now:number=Date.now()):State {
 const data=structuredClone(fixture);const date=new Date(`${localDate(now)}T12:00:00-03:00`);date.setUTCDate(date.getUTCDate()+2);const day=localDate(date.valueOf());
 const {reservas_templates,...base}=data;
 return {...base,reservas:reservas_templates.map((r)=>({id:crypto.randomUUID(),sala_id:r.sala_id,solicitante_profile_id:r.solicitante_profile_id,inicio:new Date(`${day}T${r.inicio_local}:00-03:00`).toISOString(),fim:new Date(`${day}T${r.fim_local}:00-03:00`).toISOString(),status:'ativa',motivo:r.motivo}))} as State;
}
export function createDemoRepository(storage:DemoStorage=localStorage,now:()=>number=Date.now):Repository {
 let queue:Promise<unknown>=Promise.resolve();
 function get(key:string):string|null {try{return storage.getItem(key);}catch{throw new DomainError('STORAGE_ERROR','Não foi possível ler o armazenamento local. Libere o armazenamento deste navegador.');}}
 function put(key:string,value:string):void {try{storage.setItem(key,value);if(storage.getItem(key)!==value)throw new Error('Unconfirmed');}catch{throw new DomainError('STORAGE_ERROR','Não foi possível salvar no armazenamento local. Os dados não foram confirmados.');}}
 function readAll():State {const raw=get(DEMO_STATE_KEY);if(!raw){const state=seedState(now());put(DEMO_STATE_KEY,JSON.stringify({version:VERSION,state}));return state;}try{const parsed=JSON.parse(raw) as {version:string;state:State};ensure(parsed.version===VERSION&&['profiles','alunos','professores','periodos','turmas','disciplinas','ofertas_disciplina','matriculas','avaliacoes','notas','aulas','frequencias','materiais','salas','reservas'].every(key=>Array.isArray(parsed.state?.[key as keyof State])),'Versão de dados incompatível. Restaure a demonstração.','STORAGE_ERROR');return parsed.state;}catch(e){if(e instanceof DomainError)throw e;throw new DomainError('STORAGE_ERROR','Armazenamento inválido. Restaure a demonstração para continuar.');}}
 function active():Profile {const id=get(DEMO_SESSION_KEY);ensure(id,'Entre em uma conta de demonstração.','SESSION_INVALID');const current=readAll().profiles.find(p=>p.id===id);ensure(current,'A sessão de demonstração expirou. Entre novamente.','SESSION_INVALID');return current;}
 function admin(profile:Profile){ensure(profile.papel==='admin','Somente o admin técnico pode realizar esta operação.','FORBIDDEN');}
 function teacher(profile:Profile,state:State,offerId:unknown){const professor=state.professores.find(p=>p.profile_id===profile.id&&p.status==='ativo');ensure(profile.papel==='professor'&&state.ofertas_disciplina.some(o=>o.id===offerId&&o.professor_id===professor?.id),'Somente o professor vinculado à oferta pode alterar seus dados.','FORBIDDEN');}
 function mutate(action:(state:State,profile:Profile)=>void):Promise<void> {const task=queue.then(()=>{const profile=active();const state=readAll();action(state,profile);put(DEMO_STATE_KEY,JSON.stringify({version:VERSION,state}));});queue=task.catch(()=>undefined);return task;}
 function text(value:unknown,label:string):string {ensure(typeof value==='string'&&value.trim(),`${label} é obrigatório.`);return value.trim();}
 function validDate(value:unknown):value is string {if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value+'T12:00:00Z');return Number.isFinite(date.valueOf())&&date.toISOString().slice(0,10)===value;}
 function scoped(state:State,p:Profile):State {
  const result=structuredClone(state);result.profiles=result.profiles.filter(x=>x.id===p.id);
  const ownedStudents=new Set(state.alunos.filter(a=>a.profile_id===p.id).map(a=>a.id));
  const teacherId=state.professores.find(x=>x.profile_id===p.id&&x.status==='ativo')?.id;
  const offerIds=new Set(state.ofertas_disciplina.filter(o=>p.papel==='admin'||(p.papel==='professor'?o.professor_id===teacherId:state.matriculas.some(m=>m.oferta_id===o.id&&ownedStudents.has(m.aluno_id)&&m.status==='ativa'))).map(o=>o.id));
  result.ofertas_disciplina=result.ofertas_disciplina.filter(o=>offerIds.has(o.id));
  result.matriculas=result.matriculas.filter(m=>p.papel==='admin'||(p.papel==='professor'?offerIds.has(m.oferta_id):ownedStudents.has(m.aluno_id)));
  const enrollmentIds=new Set(result.matriculas.map(m=>m.id));
  result.alunos=result.alunos.filter(a=>p.papel==='admin'||ownedStudents.has(a.id)||(p.papel==='professor'&&result.matriculas.some(m=>m.aluno_id===a.id)));
  result.professores=result.professores.filter(t=>p.papel==='admin'||t.profile_id===p.id||result.ofertas_disciplina.some(o=>o.professor_id===t.id));
  result.avaliacoes=p.papel==='admin'?[]:result.avaliacoes.filter(a=>offerIds.has(a.oferta_id));
  result.aulas=p.papel==='admin'?[]:result.aulas.filter(a=>offerIds.has(a.oferta_id));
  result.materiais=p.papel==='admin'?[]:result.materiais.filter(a=>offerIds.has(a.oferta_id));
  result.notas=p.papel==='admin'?[]:result.notas.filter(a=>offerIds.has(a.oferta_id)&&enrollmentIds.has(a.matricula_id));
  result.frequencias=p.papel==='admin'?[]:result.frequencias.filter(a=>offerIds.has(a.oferta_id)&&enrollmentIds.has(a.matricula_id));
  result.reservas=result.reservas.filter(r=>r.status==='ativa'||p.papel==='admin'||r.solicitante_profile_id===p.id).map(r=>p.papel==='admin'||r.solicitante_profile_id===p.id?r:{id:r.id,sala_id:r.sala_id,inicio:r.inicio,fim:r.fim,status:r.status});
  return result;
 }
 return {
 mode:'demo',
 async session(){const id=get(DEMO_SESSION_KEY);return id?readAll().profiles.find(p=>p.id===id)??null:null;},
 async signIn(credentials){const profile=readAll().profiles.find(p=>p.alias===credentials.alias);ensure(profile,'Selecione uma conta fictícia válida.','SESSION_INVALID');put(DEMO_SESSION_KEY,profile.id);return profile;},
 async signOut(){try{storage.removeItem(DEMO_SESSION_KEY);if(storage.getItem(DEMO_SESSION_KEY)!==null)throw new Error('Unconfirmed');}catch{throw new DomainError('STORAGE_ERROR','Não foi possível encerrar a sessão local.');}},
 async read(){const p=active();return scoped(readAll(),p);},
 async findStudent(value){admin(active());return readAll().alunos.find(a=>a.matricula===normalizeMatricula(value))??null;},
 async enroll(alunoId,offerIds){return mutate((state,profile)=>{admin(profile);ensure(offerIds.length>0&&new Set(offerIds).size===offerIds.length,'Selecione uma ou mais ofertas diferentes. Nenhuma matrícula foi gravada.');const aluno=state.alunos.find(a=>a.id===alunoId);ensure(aluno?.status==='ativo','Selecione um aluno ativo.');for(const offerId of offerIds){ensure(state.ofertas_disciplina.some(o=>o.id===offerId),'Oferta não encontrada.','NOT_FOUND');ensure(!state.matriculas.some(m=>m.aluno_id===alunoId&&m.oferta_id===offerId&&m.status==='ativa'),'O aluno já possui matrícula ativa em uma das ofertas. Nenhum vínculo do lote foi criado.','DUPLICATE_ENROLLMENT');}for(const offerId of offerIds){const existing=state.matriculas.find(m=>m.aluno_id===alunoId&&m.oferta_id===offerId);if(existing)existing.status='ativa';else state.matriculas.push({id:crypto.randomUUID(),aluno_id:alunoId,oferta_id:offerId,status:'ativa',criada_em:new Date(now()).toISOString()});}});},
 async save(entity:SaveEntity,data:SaveData){return mutate((state,p)=>{
  ensure(['alunos','professores','periodos','turmas','disciplinas','ofertas_disciplina','avaliacoes','notas','aulas','frequencias','materiais','salas'].includes(entity),'Esta entidade não pode ser alterada pelo formulário.','FORBIDDEN');
  const pedagogical=['avaliacoes','notas','aulas','frequencias','materiais'].includes(entity);if(pedagogical)teacher(p,state,data.oferta_id);else admin(p);
  const existing=data.id?(state[entity] as {id:string}[]).find(x=>x.id===data.id):undefined;ensure(!data.id||existing,'O registro não está disponível.','NOT_FOUND');
  const row:Record<string,unknown>={id:existing?.id??crypto.randomUUID()};
  if(entity==='alunos'||entity==='professores'){
   row.nome=text(data.nome,'Nome');row.status=data.status??'ativo';ensure(row.status==='ativo'||row.status==='inativo','Situação inválida.');if(data.email){ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),'Informe um e-mail válido.');row.email=data.email.trim();}else row.email=null;
   if(entity==='alunos'){row.matricula=normalizeMatricula(text(data.matricula,'Matrícula'));ensure(!state.alunos.some(a=>a.matricula===row.matricula&&a.id!==row.id),'A matrícula já está cadastrada.');}
   // The browser cannot provision or replace identity/profile linkage.
   row.profile_id=(existing as {profile_id?:string|null}|undefined)?.profile_id??null;
  } else if(entity==='periodos'){row.codigo=text(data.codigo,'Código');ensure(validDate(data.inicio)&&validDate(data.fim)&&data.fim>=data.inicio,'Informe um período com datas válidas.');row.inicio=data.inicio;row.fim=data.fim;
  } else if(entity==='turmas'||entity==='disciplinas'||entity==='salas'){row.codigo=text(data.codigo,'Código');row.nome=text(data.nome,'Nome');if(entity==='disciplinas'){ensure(Number.isFinite(data.carga_horaria)&&Number(data.carga_horaria)>0,'Carga horária deve ser positiva.');row.carga_horaria=data.carga_horaria;row.descricao=data.descricao??'';}if(entity==='salas'){ensure(typeof data.ativa==='boolean','Informe a situação da sala.');row.ativa=data.ativa;}
  } else if(entity==='ofertas_disciplina'){
   row.codigo=text(data.codigo,'Código');for(const [field,table] of [['disciplina_id','disciplinas'],['turma_id','turmas'],['periodo_id','periodos'],['professor_id','professores']] as const){ensure(state[table].some(x=>x.id===data[field]),'Selecione referências válidas para a oferta.');row[field]=data[field];}
   ensure(state.professores.some(t=>t.id===data.professor_id&&t.status==='ativo'),'Selecione docente ativo.');ensure(!state.ofertas_disciplina.some(o=>o.id!==row.id&&o.disciplina_id===row.disciplina_id&&o.turma_id===row.turma_id&&o.periodo_id===row.periodo_id),'Já existe oferta desta disciplina, turma e período.');row.plano_ensino=data.plano_ensino??'';row.referencias=data.referencias??'';
  } else {
   row.oferta_id=data.oferta_id;if(existing)ensure((existing as {oferta_id?:string}).oferta_id===data.oferta_id,'Não é permitido transferir registros entre ofertas.','FORBIDDEN');
   if(entity==='avaliacoes'||entity==='aulas'||entity==='materiais')row.titulo=text(data.titulo,'Título');
   if(entity==='avaliacoes'){ensure(Number.isFinite(data.peso)&&Number(data.peso)>0,'Peso deve ser positivo.');row.peso=data.peso;if(data.data)ensure(validDate(data.data),'Data inválida.');row.data=data.data||null;}
   if(entity==='aulas'){ensure(validDate(data.data),'Data da aula é obrigatória e deve ser válida.');row.data=data.data;}
   if(entity==='materiais'){row.url=safeUrl(text(data.url,'URL'));row.descricao=data.descricao??'';row.autor_profile_id=p.id;row.criado_em=new Date(now()).toISOString();}
   if(entity==='notas'||entity==='frequencias'){
    const enrollment=state.matriculas.find(m=>m.id===data.matricula_id);ensure(enrollment?.status==='ativa'&&enrollment.oferta_id===data.oferta_id&&state.alunos.some(a=>a.id===enrollment.aluno_id&&a.status==='ativo'),'Matrícula e aluno ativos devem pertencer à mesma oferta.');row.matricula_id=data.matricula_id;
    if(entity==='notas'){ensure(state.avaliacoes.some(a=>a.id===data.avaliacao_id&&a.oferta_id===data.oferta_id),'Avaliação deve pertencer à mesma oferta.');row.avaliacao_id=data.avaliacao_id;row.valor=grade(data.valor);const old=state.notas.find(n=>n.matricula_id===data.matricula_id&&n.avaliacao_id===data.avaliacao_id);if(old)row.id=old.id;}
    else {ensure(state.aulas.some(a=>a.id===data.aula_id&&a.oferta_id===data.oferta_id),'Aula deve pertencer à mesma oferta.');ensure(data.status==='presente'||data.status==='falta','Selecione P ou F.');row.aula_id=data.aula_id;row.status=data.status;const old=state.frequencias.find(n=>n.matricula_id===data.matricula_id&&n.aula_id===data.aula_id);if(old)row.id=old.id;}
   }
  }
  if(row.codigo)ensure(!(state[entity] as {id:string;codigo?:string}[]).some(x=>x.id!==row.id&&x.codigo===row.codigo),'O código já está cadastrado.');
  const target=state[entity] as unknown as Record<string,unknown>[];const index=target.findIndex(x=>x.id===row.id);if(index<0)target.push(row);else target[index]=row;
 });},
 async reserve(input){return mutate((state,p)=>{ensure(p.papel==='professor'&&state.professores.some(t=>t.profile_id===p.id&&t.status==='ativo'),'Somente docente ativo pode reservar ambientes.','FORBIDDEN');validateReservation(input,state,now());const motivo=text(input.motivo,'Motivo');state.reservas.push({...input,motivo,id:crypto.randomUUID(),inicio:new Date(input.inicio).toISOString(),fim:new Date(input.fim).toISOString(),solicitante_profile_id:p.id,status:'ativa'});});},
 async cancelReservation(id){return mutate((state,p)=>{const r=state.reservas.find(x=>x.id===id);ensure(r,'Reserva não encontrada.','NOT_FOUND');ensure(p.papel==='admin'||(p.papel==='professor'&&r.solicitante_profile_id===p.id),'Você pode cancelar somente suas próprias reservas.','FORBIDDEN');r.status='cancelada';r.cancelada_por=p.id;r.cancelada_em=new Date(now()).toISOString();});},
 async reset(){const fresh=seedState(now());put(DEMO_STATE_KEY,JSON.stringify({version:VERSION,state:fresh}));try{storage.removeItem(DEMO_SESSION_KEY);if(storage.getItem(DEMO_SESSION_KEY)!==null)throw new Error('Unconfirmed');}catch{throw new DomainError('STORAGE_ERROR','Dados reiniciados, mas não foi possível encerrar a sessão.');}}
 };
}
export default createDemoRepository;
