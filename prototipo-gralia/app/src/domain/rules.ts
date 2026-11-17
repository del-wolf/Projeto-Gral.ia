import type { State, Reserva } from './types';
export class DomainError extends Error { constructor(readonly code: string, message: string) {super(message);this.name='DomainError';} }
export function ensure(condition: unknown, message: string, code='VALIDATION_ERROR'): asserts condition { if(!condition)throw new DomainError(code,message); }
export function normalizeMatricula(value: string): string {return value.trim().toUpperCase().replace(/\s+/g,'');}
export function grade(value: unknown): number {
 const text=String(value??'').trim();ensure(/^\d+(?:[.,]\d{1,2})?$/.test(text),'Informe nota de 0 a 10 com até duas casas decimais.');
 const result=Number(text.replace(',','.'));ensure(Number.isFinite(result)&&result>=0&&result<=10,'A nota deve estar entre 0 e 10.');return result;
}
export function safeUrl(value: string): string {let parsed:URL;try{parsed=new URL(value);}catch{throw new DomainError('VALIDATION_ERROR','Informe um link HTTP ou HTTPS válido.');}ensure(['http:','https:'].includes(parsed.protocol)&&!parsed.username&&!parsed.password,'Use apenas links HTTP ou HTTPS sem credenciais.');return parsed.href;}
export const localDate=(instant:string|number)=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(instant));
export function validateReservation(input: Pick<Reserva,'sala_id'|'inicio'|'fim'>,state:State,now:number):void {
 const start=Date.parse(input.inicio),end=Date.parse(input.fim);
 ensure(state.salas.some(s=>s.id===input.sala_id&&s.ativa),'Selecione uma sala ativa.');
 ensure(Number.isFinite(start)&&Number.isFinite(end)&&start>now&&end>start,'O início deve ser futuro e o fim posterior ao início.');
 ensure(localDate(start)===localDate(end),'A reserva deve iniciar e terminar na mesma data em America/Sao_Paulo.');
 ensure(!state.reservas.some(r=>r.status==='ativa'&&r.sala_id===input.sala_id&&Date.parse(r.inicio)<end&&start<Date.parse(r.fim)),'Este ambiente já está reservado nesse horário.','RESERVATION_CONFLICT');
}
export function average(state:State,enrollmentId:string):{value:number|null;pending:number} {
 const enrollment=state.matriculas.find(m=>m.id===enrollmentId);const assessments=state.avaliacoes.filter(a=>a.oferta_id===enrollment?.oferta_id);let total=0,weight=0,pending=0;
 for(const assessment of assessments){const score=state.notas.find(n=>n.matricula_id===enrollmentId&&n.avaliacao_id===assessment.id);if(score){total+=score.valor*assessment.peso;weight+=assessment.peso;}else pending++;}return {value:weight?total/weight:null,pending};
}
export function attendance(state:State,enrollmentId:string):{present:number;absent:number;pending:number;percent:number|null} {
 const enrollment=state.matriculas.find(m=>m.id===enrollmentId);const lessons=state.aulas.filter(a=>a.oferta_id===enrollment?.oferta_id);let present=0,absent=0,pending=0;
 for(const lesson of lessons){const record=state.frequencias.find(f=>f.matricula_id===enrollmentId&&f.aula_id===lesson.id);if(!record)pending++;else if(record.status==='presente')present++;else absent++;}return {present,absent,pending,percent:present+absent?present/(present+absent)*100:null};
}
