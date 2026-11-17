-- Gral.ia v4: synthetic prototype rules; not official institutional regulations.
create extension if not exists btree_gist;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id),
 nome text not null check (length(btrim(nome)) between 1 and 150),
 papel text not null check (papel in ('aluno','professor','admin'))
);
create table public.alunos (
 id uuid primary key default gen_random_uuid(), profile_id uuid unique references public.profiles(id),
 nome text not null check(length(btrim(nome)) between 1 and 150),
 matricula text not null unique check(matricula ~ '^[A-Z0-9-]{1,40}$'),
 email text check(email is null or email='' or email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 status text not null default 'ativo' check(status in ('ativo','inativo'))
);
create table public.professores (
 id uuid primary key default gen_random_uuid(), profile_id uuid unique references public.profiles(id),
 nome text not null check(length(btrim(nome)) between 1 and 150),
 email text check(email is null or email='' or email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 status text not null default 'ativo' check(status in ('ativo','inativo'))
);
create table public.periodos (
 id uuid primary key default gen_random_uuid(), codigo text not null unique check(length(btrim(codigo)) between 1 and 40),
 inicio date not null, fim date not null, check(fim >= inicio)
);
create table public.turmas (
 id uuid primary key default gen_random_uuid(), codigo text not null unique check(length(btrim(codigo)) between 1 and 40),
 nome text not null check(length(btrim(nome)) between 1 and 150)
);
create table public.disciplinas (
 id uuid primary key default gen_random_uuid(), codigo text not null unique check(length(btrim(codigo)) between 1 and 40),
 nome text not null check(length(btrim(nome)) between 1 and 150), descricao text not null default '',
 carga_horaria integer not null check(carga_horaria > 0)
);
create table public.ofertas_disciplina (
 id uuid primary key default gen_random_uuid(), codigo text not null unique check(length(btrim(codigo)) between 1 and 40),
 disciplina_id uuid not null references public.disciplinas(id), turma_id uuid not null references public.turmas(id),
 periodo_id uuid not null references public.periodos(id), professor_id uuid not null references public.professores(id),
 plano_ensino text not null default '', referencias text not null default '',
 unique(disciplina_id,turma_id,periodo_id)
);
create table public.matriculas (
 id uuid primary key default gen_random_uuid(), aluno_id uuid not null references public.alunos(id),
 oferta_id uuid not null references public.ofertas_disciplina(id), status text not null default 'ativa' check(status in ('ativa','cancelada')),
 criada_em timestamptz not null default now(), unique(aluno_id,oferta_id), unique(id,oferta_id)
);
create table public.avaliacoes (
 id uuid primary key default gen_random_uuid(), oferta_id uuid not null references public.ofertas_disciplina(id),
 titulo text not null check(length(btrim(titulo)) between 1 and 150),
 peso numeric not null check(peso > 0 and peso < 'Infinity'::numeric), data date,
 unique(id,oferta_id)
);
create table public.notas (
 id uuid primary key default gen_random_uuid(), avaliacao_id uuid not null, matricula_id uuid not null,
 oferta_id uuid not null references public.ofertas_disciplina(id),
 valor numeric not null check(valor >= 0 and valor <= 10 and scale(valor) <= 2),
 foreign key(avaliacao_id,oferta_id) references public.avaliacoes(id,oferta_id),
 foreign key(matricula_id,oferta_id) references public.matriculas(id,oferta_id), unique(avaliacao_id,matricula_id)
);
create table public.aulas (
 id uuid primary key default gen_random_uuid(), oferta_id uuid not null references public.ofertas_disciplina(id),
 titulo text not null check(length(btrim(titulo)) between 1 and 150), data date not null, unique(id,oferta_id)
);
create table public.frequencias (
 id uuid primary key default gen_random_uuid(), aula_id uuid not null, matricula_id uuid not null,
 oferta_id uuid not null references public.ofertas_disciplina(id), status text not null check(status in ('presente','falta')),
 foreign key(aula_id,oferta_id) references public.aulas(id,oferta_id),
 foreign key(matricula_id,oferta_id) references public.matriculas(id,oferta_id), unique(aula_id,matricula_id)
);
create table public.materiais (
 id uuid primary key default gen_random_uuid(), oferta_id uuid not null references public.ofertas_disciplina(id),
 titulo text not null check(length(btrim(titulo)) between 1 and 150), descricao text not null default '',
 url text not null check(url ~* '^https?://[^[:space:]<>]+$' and url !~* '^https?://[^/]*@'),
 autor_profile_id uuid not null default auth.uid() references public.profiles(id), criada_em timestamptz not null default now()
);
create table public.salas (
 id uuid primary key default gen_random_uuid(), codigo text not null unique check(length(btrim(codigo)) between 1 and 40),
 nome text not null check(length(btrim(nome)) between 1 and 150), ativa boolean not null default true
);
create table public.reservas (
 id uuid primary key default gen_random_uuid(), sala_id uuid not null references public.salas(id),
 solicitante_profile_id uuid not null default auth.uid() references public.profiles(id),
 inicio timestamptz not null, fim timestamptz not null,
 motivo text not null check(length(btrim(motivo)) between 1 and 300),
 status text not null default 'ativa' check(status in ('ativa','cancelada')),
 cancelada_por uuid references public.profiles(id), cancelada_em timestamptz,
 check(isfinite(inicio) and isfinite(fim) and fim > inicio),
 check((inicio at time zone 'America/Sao_Paulo')::date=(fim at time zone 'America/Sao_Paulo')::date),
 check((status='ativa' and cancelada_por is null and cancelada_em is null) or (status='cancelada' and cancelada_por is not null and cancelada_em is not null)),
 exclude using gist (sala_id with =, tstzrange(inicio,fim,'[)') with &&) where (status='ativa')
);

-- Non-exposed ownership helpers avoid recursive policies and never trust user_metadata.
create function private.papel() returns text language sql stable security definer set search_path='' as $$
 select p.papel from public.profiles p where p.id=(select auth.uid())
$$;
create function private.docente(p_oferta uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.ofertas_disciplina o join public.professores p on p.id=o.professor_id
 where o.id=p_oferta and p.profile_id=auth.uid() and p.status='ativo')
$$;
create function private.aluno_da_oferta(p_oferta uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.matriculas m join public.alunos a on a.id=m.aluno_id
 where m.oferta_id=p_oferta and m.status='ativa' and a.profile_id=auth.uid() and a.status='ativo')
$$;
create function private.propria_matricula(p_matricula uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.matriculas m join public.alunos a on a.id=m.aluno_id
 where m.id=p_matricula and a.profile_id=auth.uid() and a.status='ativo')
$$;
create function private.docente_do_aluno(p_aluno uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.matriculas m join public.ofertas_disciplina o on o.id=m.oferta_id
 join public.professores p on p.id=o.professor_id where m.aluno_id=p_aluno and m.status='ativa' and p.profile_id=auth.uid() and p.status='ativo')
$$;
create function private.oferta_visivel(p_oferta uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.papel()='admin' or private.docente(p_oferta) or private.aluno_da_oferta(p_oferta)
$$;
create function private.vinculo_ativo(p_matricula uuid,p_oferta uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.matriculas m join public.alunos a on a.id=m.aluno_id
 where m.id=p_matricula and m.oferta_id=p_oferta and m.status='ativa' and a.status='ativo')
$$;

create function private.validar_academico() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and new.id is distinct from old.id then raise exception 'VALIDATION_ERROR: immutable id' using errcode='23514'; end if;
 if tg_table_name='alunos' then new.matricula:=upper(regexp_replace(btrim(new.matricula),'\s','','g')); end if;
 if tg_table_name in ('alunos','professores') then
  if new.profile_id is not null then
  if not exists(select 1 from public.profiles p where p.id=new.profile_id and p.papel=case when tg_table_name='alunos' then 'aluno' else 'professor' end) then
   raise exception 'VALIDATION_ERROR: profile type mismatch' using errcode='23514';
  end if;
  end if;
 end if;
 if tg_table_name='ofertas_disciplina' then
  if not exists(select 1 from public.professores p where p.id=new.professor_id and p.status='ativo') then
   raise exception 'VALIDATION_ERROR: inactive teacher' using errcode='23514';
  end if;
 end if;
 if tg_table_name='matriculas' then
  if tg_op='UPDATE' then
   if new.aluno_id is distinct from old.aluno_id or new.oferta_id is distinct from old.oferta_id then raise exception 'VALIDATION_ERROR: immutable enrollment identity' using errcode='23514'; end if;
  end if;
  if new.status='ativa' then
  if not exists(select 1 from public.alunos a where a.id=new.aluno_id and a.status='ativo') then
   raise exception 'VALIDATION_ERROR: inactive student' using errcode='23514';
  end if;
  end if;
 end if;
 return new;
end $$;
create trigger validar_aluno before insert or update on public.alunos for each row execute function private.validar_academico();
create trigger validar_professor before insert or update on public.professores for each row execute function private.validar_academico();
create trigger validar_oferta before insert or update on public.ofertas_disciplina for each row execute function private.validar_academico();
create trigger validar_matricula before insert or update on public.matriculas for each row execute function private.validar_academico();

create function private.validar_pedagogico() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.matriculas m join public.alunos a on a.id=m.aluno_id where m.id=new.matricula_id and m.oferta_id=new.oferta_id and m.status='ativa' and a.status='ativo') then
  raise exception 'VALIDATION_ERROR: inactive or different enrollment' using errcode='23514';
 end if;
 return new;
end $$;
create trigger validar_nota before insert or update on public.notas for each row execute function private.validar_pedagogico();
create trigger validar_frequencia before insert or update on public.frequencias for each row execute function private.validar_pedagogico();

create function private.validar_reserva() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' then
  if private.papel() is distinct from 'professor' or new.solicitante_profile_id is distinct from auth.uid() or not exists(select 1 from public.professores p where p.profile_id=auth.uid() and p.status='ativo') then
   raise exception 'FORBIDDEN: only own teacher reservation' using errcode='42501';
  end if;
  if new.inicio<=clock_timestamp() or new.status<>'ativa' or not exists(select 1 from public.salas s where s.id=new.sala_id and s.ativa) then
   raise exception 'VALIDATION_ERROR: future start and active room required' using errcode='23514';
  end if;
 else
  if old.status<>'ativa' or new.status<>'cancelada' or not (private.papel()='admin' or (private.papel()='professor' and old.solicitante_profile_id=auth.uid())) then
   raise exception 'FORBIDDEN: reservation cancellation' using errcode='42501';
  end if;
  new.cancelada_por:=auth.uid(); new.cancelada_em:=clock_timestamp();
 end if;
 return new;
end $$;
create trigger validar_reserva before insert or update on public.reservas for each row execute function private.validar_reserva();

-- Existing pedagogical records retain their original offering and primary identity.
create function private.identidade_pedagogica() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.id is distinct from old.id or new.oferta_id is distinct from old.oferta_id then
  raise exception 'VALIDATION_ERROR: immutable pedagogical identity' using errcode='23514';
 end if;
 if tg_table_name='notas' then
  if new.avaliacao_id is distinct from old.avaliacao_id or new.matricula_id is distinct from old.matricula_id then
   raise exception 'VALIDATION_ERROR: immutable grade identity' using errcode='23514';
  end if;
 end if;
 if tg_table_name='frequencias' then
  if new.aula_id is distinct from old.aula_id or new.matricula_id is distinct from old.matricula_id then
   raise exception 'VALIDATION_ERROR: immutable attendance identity' using errcode='23514';
  end if;
 end if;
 return new;
end $$;
do $$ declare t text; begin
 foreach t in array array['avaliacoes','aulas','materiais','notas','frequencias'] loop
  execute format('create trigger identidade_pedagogica before update on public.%I for each row execute function private.identidade_pedagogica()',t);
 end loop;
end $$;

-- Opt-in grants: no DELETE, role changes or client-side Auth provisioning.
revoke all on public.profiles,public.alunos,public.professores,public.periodos,public.turmas,public.disciplinas,public.ofertas_disciplina,public.matriculas,public.avaliacoes,public.notas,public.aulas,public.frequencias,public.materiais,public.salas,public.reservas from anon,authenticated;
revoke all on all functions in schema private from public,anon;
grant execute on all functions in schema private to authenticated;
grant usage on schema public to authenticated;
-- Administrative seed/provisioning remains server-side; never ship this role in VITE_.
grant all on public.profiles,public.alunos,public.professores,public.periodos,public.turmas,public.disciplinas,public.ofertas_disciplina,public.matriculas,public.avaliacoes,public.notas,public.aulas,public.frequencias,public.materiais,public.salas,public.reservas to service_role;
grant select on public.profiles,public.alunos,public.professores,public.periodos,public.turmas,public.disciplinas,public.ofertas_disciplina,public.matriculas,public.avaliacoes,public.notas,public.aulas,public.frequencias,public.materiais,public.salas,public.reservas to authenticated;
grant insert,update on public.periodos,public.turmas,public.disciplinas,public.ofertas_disciplina,public.matriculas,public.avaliacoes,public.notas,public.aulas,public.frequencias,public.salas to authenticated;
grant insert(id,oferta_id,titulo,descricao,url),update(id,oferta_id,titulo,descricao,url) on public.materiais to authenticated;
grant insert(id,nome,matricula,email,status),update(id,nome,matricula,email,status) on public.alunos to authenticated;
grant insert(id,nome,email,status),update(id,nome,email,status) on public.professores to authenticated;
grant insert(sala_id,inicio,fim,motivo,solicitante_profile_id) on public.reservas to authenticated;
grant update(status) on public.reservas to authenticated;

alter table public.profiles enable row level security;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or private.papel()='admin');
alter table public.alunos enable row level security;
create policy alunos_read on public.alunos for select to authenticated using(profile_id=auth.uid() or private.papel()='admin' or private.docente_do_aluno(id));
create policy alunos_insert on public.alunos for insert to authenticated with check(private.papel()='admin');
create policy alunos_update on public.alunos for update to authenticated using(private.papel()='admin') with check(private.papel()='admin');
alter table public.professores enable row level security;
create policy professores_read on public.professores for select to authenticated using(profile_id=auth.uid() or private.papel()='admin' or exists(select 1 from public.ofertas_disciplina o where o.professor_id=professores.id and private.aluno_da_oferta(o.id)));
create policy professores_insert on public.professores for insert to authenticated with check(private.papel()='admin');
create policy professores_update on public.professores for update to authenticated using(private.papel()='admin') with check(private.papel()='admin');

-- Catalog/configuration is visible after provisioning; pedagogical rows have narrower scope.
do $$ declare t text; begin
 foreach t in array array['periodos','turmas','disciplinas','salas'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy %I on public.%I for select to authenticated using (private.papel() is not null)',t||'_read',t);
  execute format('create policy %I on public.%I for insert to authenticated with check (private.papel()=''admin'')',t||'_insert',t);
  execute format('create policy %I on public.%I for update to authenticated using (private.papel()=''admin'') with check (private.papel()=''admin'')',t||'_update',t);
 end loop;
end $$;
alter table public.ofertas_disciplina enable row level security;
create policy ofertas_read on public.ofertas_disciplina for select to authenticated using(private.oferta_visivel(id));
create policy ofertas_insert on public.ofertas_disciplina for insert to authenticated with check(private.papel()='admin');
create policy ofertas_update on public.ofertas_disciplina for update to authenticated using(private.papel()='admin') with check(private.papel()='admin');
alter table public.matriculas enable row level security;
create policy matriculas_read on public.matriculas for select to authenticated using(private.papel()='admin' or private.propria_matricula(id) or private.docente(oferta_id));
create policy matriculas_insert on public.matriculas for insert to authenticated with check(private.papel()='admin');
create policy matriculas_update on public.matriculas for update to authenticated using(private.papel()='admin') with check(private.papel()='admin');
do $$ declare t text; begin
 foreach t in array array['avaliacoes','aulas','materiais'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy %I on public.%I for select to authenticated using (private.docente(oferta_id) or private.aluno_da_oferta(oferta_id))',t||'_read',t);
  execute format('create policy %I on public.%I for insert to authenticated with check (private.docente(oferta_id))',t||'_insert',t);
  execute format('create policy %I on public.%I for update to authenticated using (private.docente(oferta_id)) with check (private.docente(oferta_id))',t||'_update',t);
 end loop;
 foreach t in array array['notas','frequencias'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy %I on public.%I for select to authenticated using (private.docente(oferta_id) or private.propria_matricula(matricula_id))',t||'_read',t);
  execute format('create policy %I on public.%I for insert to authenticated with check (private.docente(oferta_id) and private.vinculo_ativo(matricula_id,oferta_id))',t||'_insert',t);
  execute format('create policy %I on public.%I for update to authenticated using (private.docente(oferta_id)) with check (private.docente(oferta_id) and private.vinculo_ativo(matricula_id,oferta_id))',t||'_update',t);
 end loop;
end $$;
alter table public.reservas enable row level security;
create policy reservas_read on public.reservas for select to authenticated using(private.papel()='admin' or (private.papel()='professor' and solicitante_profile_id=auth.uid()));
create policy reservas_insert on public.reservas for insert to authenticated with check(private.papel()='professor' and solicitante_profile_id=auth.uid());
create policy reservas_update on public.reservas for update to authenticated using(status='ativa' and (private.papel()='admin' or (private.papel()='professor' and solicitante_profile_id=auth.uid()))) with check(private.papel()='admin' or (private.papel()='professor' and solicitante_profile_id=auth.uid()));

create function public.registrar_matriculas(p_aluno_id uuid,p_oferta_ids uuid[]) returns void language plpgsql security invoker set search_path='' as $$
begin
 if private.papel() is distinct from 'admin' then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if p_oferta_ids is null or cardinality(p_oferta_ids)=0 or array_position(p_oferta_ids,null) is not null or cardinality(p_oferta_ids)<>(select count(distinct x) from unnest(p_oferta_ids) x) then
  raise exception 'VALIDATION_ERROR: nonempty distinct offers required' using errcode='23514';
 end if;
 -- Serializes enrollment requests for the same student. Unique pair is defense in depth.
 perform 1 from public.alunos where id=p_aluno_id and status='ativo' for update;
 if not found then raise exception 'VALIDATION_ERROR: active student required' using errcode='23514'; end if;
 if cardinality(p_oferta_ids)<>(select count(*) from public.ofertas_disciplina o join public.professores p on p.id=o.professor_id where o.id=any(p_oferta_ids) and p.status='ativo') then
  raise exception 'VALIDATION_ERROR: invalid offer' using errcode='23514';
 end if;
 if exists(select 1 from public.matriculas where aluno_id=p_aluno_id and oferta_id=any(p_oferta_ids) and status='ativa') then
  raise exception 'DUPLICATE_ENROLLMENT' using errcode='23505';
 end if;
 insert into public.matriculas(aluno_id,oferta_id,status) select p_aluno_id,x,'ativa' from unnest(p_oferta_ids) x
 on conflict(aluno_id,oferta_id) do update set status='ativa';
end $$;
create function public.reservar_sala(p_sala_id uuid,p_inicio timestamptz,p_fim timestamptz,p_motivo text) returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid;
begin
 if private.papel() is distinct from 'professor' then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 insert into public.reservas(sala_id,inicio,fim,motivo,solicitante_profile_id) values(p_sala_id,p_inicio,p_fim,btrim(p_motivo),auth.uid()) returning id into result;
 return result;
end $$;
create function public.cancelar_reserva(p_reserva_id uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 update public.reservas set status='cancelada' where id=p_reserva_id;
 if not found then raise exception 'FORBIDDEN: unavailable reservation' using errcode='42501'; end if;
end $$;
-- The one privileged projection returns occupied intervals only, never personal details.
create function private.disponibilidade_salas() returns table(id uuid,sala_id uuid,inicio timestamptz,fim timestamptz,status text) language sql stable security definer set search_path='' as $$
 select r.id,r.sala_id,r.inicio,r.fim,r.status from public.reservas r where r.status='ativa' and auth.uid() is not null and private.papel() is not null
$$;
create function public.disponibilidade_salas() returns table(id uuid,sala_id uuid,inicio timestamptz,fim timestamptz,status text) language sql stable security invoker set search_path='' as $$
 select * from private.disponibilidade_salas()
$$;
revoke all on function private.disponibilidade_salas() from public,anon;
grant execute on function private.disponibilidade_salas() to authenticated;
revoke all on function public.registrar_matriculas(uuid,uuid[]),public.reservar_sala(uuid,timestamptz,timestamptz,text),public.cancelar_reserva(uuid),public.disponibilidade_salas() from public,anon;
grant execute on function public.registrar_matriculas(uuid,uuid[]),public.reservar_sala(uuid,timestamptz,timestamptz,text),public.cancelar_reserva(uuid),public.disponibilidade_salas() to authenticated;

create index matriculas_oferta_idx on public.matriculas(oferta_id);
create index matriculas_aluno_idx on public.matriculas(aluno_id);
create index ofertas_professor_idx on public.ofertas_disciplina(professor_id);
create index notas_matricula_idx on public.notas(matricula_id);
create index frequencias_matricula_idx on public.frequencias(matricula_id);
