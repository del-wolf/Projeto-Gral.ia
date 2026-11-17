import { spawn } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// This runner has no URL/remote target argument: it owns its disposable Docker DB.
// PostgreSQL/RLS tests simulate JWT subject only; they do not validate GoTrue Auth.
const root = fileURLToPath(new URL('../../', import.meta.url))
const stamp = new Date().toISOString().replaceAll(/[:.]/g, '-')
const output = path.join(root, 'docs/evidencias', `db-${stamp}`)
const image = 'postgres:17.6-bookworm@sha256:f3bd19c606e442c3d7bdfa8002e03fe260a1023351e0ea4598032022b68dd6e3'
const container = `gralia-sql-test-${Date.now()}-${randomBytes(3).toString('hex')}`
const results = []
let created = false
let log = ''

function execute(command, args, input = '') {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
    let stdout = '', stderr = ''
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.on('error', reject)
    child.on('close', code => resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() }))
    child.stdin.on('error', () => {})
    child.stdin.end(input)
  })
}
const quote = value => value == null ? 'null' : typeof value === 'boolean' || typeof value === 'number' ? String(value) : `'${String(value).replaceAll("'", "''")}'`
async function sql(source) {
  const result = await execute('docker', ['exec', '-i', container, 'psql', '-XqAt', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'gralia_test'], source)
  log += `\nSQL:\n${source}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}\nEXIT: ${result.code}\n`
  return result
}
async function query(source) {
  const result = await sql(source)
  if (result.code !== 0) throw new Error(result.stderr || 'SQL failed')
  return result.stdout
}
function equal(actual, expected) {
  if (String(actual) !== String(expected)) throw new Error(`Esperado ${JSON.stringify(expected)}; observado ${JSON.stringify(actual)}`)
}
async function denied(source, expression = /FORBIDDEN|permission denied|row-level security|42501/i) {
  const result = await sql(source)
  if (result.code === 0) throw new Error('Operação proibida teve sucesso')
  if (!expression.test(result.stderr)) throw new Error(`Erro inesperado: ${result.stderr}`)
  return result.stderr
}
const fixture = JSON.parse(await readFile(path.join(root, 'fixtures/gralia_seed_contract.json'), 'utf8'))
const profiles = Object.fromEntries(fixture.profiles.map(p => [p.alias, p.id]))
const alunos = Object.fromEntries(fixture.alunos.map(p => [p.alias, p.id]))
const ofertas = Object.fromEntries(fixture.ofertas_disciplina.map(p => [p.codigo, p.id]))
const enrollment = fixture.matriculas[0].id
const pweb = ofertas['OF-PWEB-3A']
const bd = ofertas['OF-BD-3B']
const alvo = ofertas['OF-TEST-3A']
const redes = ofertas['OF-REDES-3A']
const lab = fixture.salas[0].id
const a3 = fixture.avaliacoes[2].id
const lesson = fixture.aulas[2].id
const uid = () => randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
const as = (alias, source, commit = false) => `begin; set local role authenticated; set local "request.jwt.claim.sub" = '${profiles[alias]}'; ${source}; ${commit ? 'commit' : 'rollback'};`
const future = (day = 3, time = '14:00') => `((((now() at time zone 'America/Sao_Paulo')::date + ${day}) + time '${time}') at time zone 'America/Sao_Paulo')`
const reserve = (room = lab, start = future(), end = future(3, '15:00'), reason = 'Aula de teste') => `select public.reservar_sala('${room}',${start},${end},${quote(reason)})`
const tables = ['profiles', 'alunos', 'professores', 'periodos', 'turmas', 'disciplinas', 'ofertas_disciplina', 'matriculas', 'avaliacoes', 'notas', 'aulas', 'frequencias', 'materiais', 'salas', 'reservas']
function seedSQL(mapping = {}) {
  const lines = []
  for (const table of tables) {
    if (!Array.isArray(fixture[table])) continue
    for (const original of fixture[table]) {
      const row = Object.fromEntries(Object.entries(original).filter(([key]) => !['alias', 'email_fixture'].includes(key)))
      if (table === 'profiles') row.id = mapping[original.alias] ?? row.id
      if (row.profile_id) {
        const match = fixture.profiles.find(p => p.id === row.profile_id)
        row.profile_id = mapping[match?.alias] ?? row.profile_id
      }
      const columns = Object.keys(row).map(k => `"${k}"`).join(',')
      lines.push(`insert into public.${table} (${columns}) values (${Object.values(row).map(quote).join(',')});`)
    }
  }
  return lines.join('\n')
}
async function reset() {
  // Exclusive new container: this cannot reset a Supabase or remote database.
  await query(`truncate ${tables.map(t => `public.${t}`).join(',')} restart identity cascade;\n${seedSQL()}`)
}
async function check(id, expected, run) {
  const started = new Date().toISOString()
  try {
    await reset()
    const observed = await run()
    results.push({ id, status: 'APROVADO', expected, observed: observed ?? 'Asserções SQL satisfeitas.', started, ended: new Date().toISOString() })
    console.log(`APROVADO ${id}`)
  } catch (error) {
    results.push({ id, status: 'REPROVADO', expected, observed: error.message, started, ended: new Date().toISOString() })
    console.error(`REPROVADO ${id}: ${error.message}`)
  }
}

try {
  await mkdir(output, { recursive: true })
  const info = await execute('docker', ['info', '--format', '{{.ServerVersion}}'])
  if (info.code !== 0) throw new Error('BLOQUEADO: Docker Desktop/daemon não disponível. Nenhum banco externo foi acessado.')
  const password = randomBytes(32).toString('hex')
  const start = await execute('docker', ['run', '-d', '--rm', '--name', container, '--network', 'none', '-e', `POSTGRES_PASSWORD=${password}`, '-e', 'POSTGRES_DB=gralia_test', image])
  if (start.code !== 0) throw new Error(`BLOQUEADO: não foi possível iniciar imagem ${image}: ${start.stderr}`)
  created = true
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    // The image starts a temporary PostgreSQL during initdb. Wait for the final
    // PID 1 server too, otherwise pg_isready can race the temporary shutdown.
    const status = await execute('docker', ['exec', container, 'sh', '-c', 'test "$(cat /proc/1/comm)" = postgres && pg_isready -U postgres -d gralia_test'])
    if (status.code === 0) { ready = true; break }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  if (!ready) throw new Error('BLOQUEADO: PostgreSQL descartável não ficou pronto em 30 segundos.')
  await query(await readFile(new URL('./bootstrap.sql', import.meta.url), 'utf8'))
  const migrations = (await readdir(path.join(root, 'supabase/migrations'))).filter(p => p.endsWith('.sql')).sort()
  if (!migrations.length) throw new Error('Nenhuma migração encontrada')
  for (const migration of migrations) await query(await readFile(path.join(root, 'supabase/migrations', migration), 'utf8'))
  await query(fixture.profiles.map(p => `insert into auth.users(id) values ('${p.id}');`).join('\n'))
  const version = await query('select version();')
  const backendClock = await query('select clock_timestamp();')
  const hashes = {}
  for (const source of ['supabase/tests/run.mjs', 'supabase/tests/bootstrap.sql', 'fixtures/gralia_seed_contract.json', ...migrations.map(m => `supabase/migrations/${m}`)]) hashes[source] = createHash('sha256').update(await readFile(path.join(root, source))).digest('hex')
  await writeFile(path.join(output, 'ambiente.json'), JSON.stringify({ scope: 'PostgreSQL SQL/RLS; sujeitos JWT simulados; GoTrue, JWT assinado e API HTTP não exercitados', node: process.version, os: process.platform, docker: info.stdout, image, postgres: version, backendClock, fixtureVersion: fixture.fixture_version, fixtureClockIgnored: true, migrations, sha256: hashes, timeZoneDisplay: 'America/Sao_Paulo' }, null, 2))

  await check('SQL-RLS-todas-tabelas', 'RLS habilitado em todas as 15 tabelas de domínio', async () => {
    equal(await query(`select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in (${tables.map(quote).join(',')}) and c.relrowsecurity`), tables.length)
  })
  await check('SQL-grants-sem-delete', 'Nenhuma tabela de domínio concede DELETE a anon ou authenticated', async () => {
    for (const table of tables) for (const role of ['anon', 'authenticated']) equal(await query(`select has_table_privilege('${role}','public.${table}','DELETE')`), 'f')
  })
  for (const [alias, grades] of [['ALUNO-A', 2], ['ALUNO-B', 1], ['PROF-A', 2], ['PROF-B', 1], ['ADMIN-QA', 0]]) {
    await check(`SQL-RLS-notas-${alias}`, `Perfil ${alias} lê ${grades} notas, sem acesso cruzado`, async () => {
      equal(await query(as(alias, 'select count(*) from public.notas')), grades)
      if (alias === 'ALUNO-A' || alias === 'PROF-A') equal(await query(as(alias, `select count(*) from public.notas where oferta_id='${bd}'`)), 0)
      if (alias === 'ALUNO-B' || alias === 'PROF-B') equal(await query(as(alias, `select count(*) from public.notas where oferta_id='${pweb}'`)), 0)
    })
  }
  await check('SQL-admin-sem-pedagogico', 'Admin não lê frequência, avaliações, aulas ou materiais', async () => {
    equal(await query(as('ADMIN-QA', 'select (select count(*) from public.frequencias)+(select count(*) from public.avaliacoes)+(select count(*) from public.aulas)+(select count(*) from public.materiais)')), 0)
  })
  await check('SQL-profile-sem-escalacao', 'Usuário não pode mudar o próprio papel nem criar admin', async () => {
    await denied(as('ALUNO-A', `update public.profiles set papel='admin' where id='${profiles['ALUNO-A']}'`))
    await denied(as('ADMIN-QA', `insert into public.profiles(id,nome,papel) values ('${uid()}','Injetado','admin')`))
    equal(await query(`select papel from public.profiles where id='${profiles['ALUNO-A']}'`), 'aluno')
  })
  await check('SQL-claims-forjadas', 'Papel em user_metadata/JWT simulado não substitui profile protegido', async () => {
    await denied(as('ALUNO-A', `set local "request.jwt.claims" = '{"role":"authenticated","user_metadata":{"papel":"admin","role":"admin"}}'; select public.registrar_matriculas('${alunos['ALUNO-A']}',array['${alvo}']::uuid[])`))
    equal(await query('select count(*) from public.matriculas'), 2)
  })
  await check('SQL-sujeito-ausente', 'Sem sujeito Auth não há operação ou disponibilidade de dados privados', async () => {
    await denied(`begin; set local role authenticated; set local "request.jwt.claim.sub"=''; select public.registrar_matriculas('${alunos['ALUNO-A']}',array['${alvo}']::uuid[]); rollback;`)
    equal(await query('begin; set local role authenticated; set local "request.jwt.claim.sub"=\'\'; select count(*) from public.notas; rollback;'), 0)
  })
  await check('SQL-anon-sem-dados', 'Anon não lê tabelas nem chama operação de matrícula', async () => {
    await denied('begin; set local role anon; select * from public.notas; rollback;')
    await denied(`begin; set local role anon; select public.registrar_matriculas('${alunos['ALUNO-A']}',array['${alvo}']::uuid[]); rollback;`)
  })
  await check('CT-GR-001-SQL', 'RPC admin persiste exatamente um vínculo ativo e consulta independente confirma', async () => {
    equal(await query(`select count(*) from public.matriculas where aluno_id='${alunos['ALUNO-A']}' and oferta_id='${alvo}'`), 0)
    await query(as('ADMIN-QA', `select public.registrar_matriculas('${alunos['ALUNO-A']}',array['${alvo}']::uuid[])`, true))
    equal(await query(`select count(*) from public.matriculas where aluno_id='${alunos['ALUNO-A']}' and oferta_id='${alvo}' and status='ativa'`), 1)
    return 'Zero antes; RPC confirmada/commit; uma linha ativa depois, consultada em conexão independente.'
  })
  await check('CT-GR-002-SQL', 'RPC com array vazio rejeita e não altera as duas matrículas da fixture', async () => {
    await denied(as('ADMIN-QA', `select public.registrar_matriculas('${alunos['ALUNO-A']}',array[]::uuid[])`), /VALIDATION_ERROR|23514/i)
    equal(await query('select count(*) from public.matriculas'), 2)
  })
  await check('SQL-matricula-lote-atomico', 'Oferta inválida rejeita lote inteiro, preserva contagem', async () => {
    await denied(as('ADMIN-QA', `select public.registrar_matriculas('${alunos['ALUNO-A']}',array['${alvo}','${uid()}']::uuid[])`), /VALIDATION_ERROR|NOT_FOUND/i)
    equal(await query('select count(*) from public.matriculas'), 2)
  })
  await check('SQL-matricula-duplicada', 'Uma oferta ativa rejeita lote inteiro sem criar oferta válida', async () => {
    await denied(as('ADMIN-QA', `select public.registrar_matriculas('${alunos['ALUNO-A']}',array['${alvo}','${pweb}']::uuid[])`), /DUPLICATE_ENROLLMENT/i)
    equal(await query('select count(*) from public.matriculas'), 2)
  })
  await check('SQL-matricula-entrada-repetida', 'IDs repetidos na entrada rejeitados', async () => {
    await denied(as('ADMIN-QA', `select public.registrar_matriculas('${alunos['ALUNO-A']}',array['${alvo}','${alvo}']::uuid[])`), /VALIDATION_ERROR/i)
    equal(await query('select count(*) from public.matriculas'), 2)
  })
  await check('SQL-matricula-inativo', 'Aluno inativo não pode ser matriculado', async () => {
    await query(`update public.alunos set status='inativo' where id='${alunos['ALUNO-C']}'`)
    await denied(as('ADMIN-QA', `select public.registrar_matriculas('${alunos['ALUNO-C']}',array['${alvo}']::uuid[])`), /VALIDATION_ERROR|NOT_FOUND/i)
    equal(await query('select count(*) from public.matriculas'), 2)
  })
  await check('SQL-matricula-reativacao', 'Reativação preserva ID original sem linha adicional', async () => {
    await query(`update public.matriculas set status='cancelada' where id='${enrollment}'`)
    await query(as('ADMIN-QA', `select public.registrar_matriculas('${alunos['ALUNO-A']}',array['${pweb}']::uuid[])`, true))
    equal(await query(`select id||':'||status from public.matriculas where aluno_id='${alunos['ALUNO-A']}' and oferta_id='${pweb}'`), `${enrollment}:ativa`)
    equal(await query('select count(*) from public.matriculas'), 2)
  })
  for (const alias of ['ALUNO-A', 'PROF-A']) {
    await check(`SQL-matricula-proibida-${alias}`, 'Perfil sem permissão rejeitado antes de gravar', async () => {
      await denied(as(alias, `select public.registrar_matriculas('${alunos['ALUNO-A']}',array['${alvo}']::uuid[])`))
      equal(await query('select count(*) from public.matriculas'), 2)
    })
  }
  await check('SQL-professor-oferta', 'Docente cria avaliação própria, mas não de outro professor', async () => {
    await query(as('PROF-A', `insert into public.avaliacoes(oferta_id,titulo,peso) values ('${pweb}','Nova avaliação',1)`, true))
    await denied(as('PROF-A', `insert into public.avaliacoes(oferta_id,titulo,peso) values ('${bd}','Intrusão',1)`))
    equal(await query('select count(*) from public.avaliacoes'), 5)
  })
  await check('SQL-nota-zero-pendente', 'Nota ausente permanece pendente; zero é persistido como zero', async () => {
    equal(await query(`select count(*) from public.notas where avaliacao_id='${a3}' and matricula_id='${enrollment}'`), 0)
    await query(as('PROF-A', `insert into public.notas(avaliacao_id,matricula_id,oferta_id,valor) values ('${a3}','${enrollment}','${pweb}',0)`, true))
    equal(await query(`select valor::numeric = 0 from public.notas where avaliacao_id='${a3}' and matricula_id='${enrollment}'`), 't')
  })
  for (const invalid of ['-0.01', '10.01', '1.234', "'NaN'::numeric", "'Infinity'::numeric"]) {
    await check(`SQL-nota-invalida-${invalid}`, 'Nota fora do contrato rejeitada no banco sem arredondamento silencioso', async () => {
      await denied(as('PROF-A', `insert into public.notas(avaliacao_id,matricula_id,oferta_id,valor) values ('${a3}','${enrollment}','${pweb}',${invalid})`), /VALIDATION_ERROR|check constraint|out of range|23514/i)
    })
  }
  await check('SQL-integridade-oferta-nota', 'FK composta rejeita nota com oferta diferente, mesmo como proprietário do banco', async () => {
    await denied(`insert into public.notas(avaliacao_id,matricula_id,oferta_id,valor) values ('${a3}','${enrollment}','${bd}',5)`, /foreign key|VALIDATION_ERROR/i)
  })
  await check('SQL-integridade-oferta-frequencia', 'FK composta rejeita frequência com oferta diferente', async () => {
    await denied(`insert into public.frequencias(aula_id,matricula_id,oferta_id,status) values ('${lesson}','${enrollment}','${bd}','presente')`, /foreign key|VALIDATION_ERROR/i)
  })
  await check('SQL-frequencia-pendente', 'Ausência fica sem registro; docente atribuído grava P uma vez', async () => {
    equal(await query(`select count(*) from public.frequencias where aula_id='${lesson}' and matricula_id='${enrollment}'`), 0)
    await query(as('PROF-A', `insert into public.frequencias(aula_id,matricula_id,oferta_id,status) values ('${lesson}','${enrollment}','${pweb}','presente')`, true))
    await denied(as('PROF-A', `insert into public.frequencias(aula_id,matricula_id,oferta_id,status) values ('${lesson}','${enrollment}','${pweb}','falta')`), /unique constraint|duplicate key/i)
    equal(await query(`select count(*) from public.frequencias where aula_id='${lesson}' and matricula_id='${enrollment}'`), 1)
  })
  await check('SQL-professor-acesso-cruzado', 'Professor B não escreve nota/frequência na oferta do professor A', async () => {
    await denied(as('PROF-B', `insert into public.notas(avaliacao_id,matricula_id,oferta_id,valor) values ('${a3}','${enrollment}','${pweb}',5)`))
    await denied(as('PROF-B', `insert into public.frequencias(aula_id,matricula_id,oferta_id,status) values ('${lesson}','${enrollment}','${pweb}','presente')`))
  })
  await check('SQL-admin-aluno-sem-lancamento', 'Admin técnico e aluno não lançam notas ou frequência', async () => {
    for (const alias of ['ADMIN-QA', 'ALUNO-A']) {
      await denied(as(alias, `insert into public.notas(avaliacao_id,matricula_id,oferta_id,valor) values ('${a3}','${enrollment}','${pweb}',5)`))
      await denied(as(alias, `insert into public.frequencias(aula_id,matricula_id,oferta_id,status) values ('${lesson}','${enrollment}','${pweb}','presente')`))
    }
  })
  await check('SQL-identidade-pedagogica-imutavel', 'Oferta/id não podem ser transferidos em avaliação, aula, nota e frequência', async () => {
    await denied(as('PROF-A', `update public.avaliacoes set oferta_id='${alvo}' where id='${a3}'`), /VALIDATION_ERROR|immutable/i)
    await denied(as('PROF-A', `update public.aulas set oferta_id='${alvo}' where id='${lesson}'`), /VALIDATION_ERROR|immutable/i)
    await denied(as('PROF-A', `update public.notas set avaliacao_id='${a3}' where id='${fixture.notas[0].id}'`), /VALIDATION_ERROR|immutable/i)
    await denied(as('PROF-A', `update public.frequencias set aula_id='${lesson}' where id='${fixture.frequencias[0].id}'`), /VALIDATION_ERROR|immutable/i)
    await denied(as('ADMIN-QA', `update public.matriculas set oferta_id='${alvo}' where id='${enrollment}'`), /VALIDATION_ERROR|immutable/i)
  })
  await check('SQL-matricula-cancelada-sem-lancamento', 'Matrícula cancelada não recebe novas notas ou frequência', async () => {
    await query(`update public.matriculas set status='cancelada' where id='${enrollment}'`)
    await denied(as('PROF-A', `insert into public.notas(avaliacao_id,matricula_id,oferta_id,valor) values ('${a3}','${enrollment}','${pweb}',5)`), /FORBIDDEN|VALIDATION_ERROR|row-level security/i)
    await denied(as('PROF-A', `insert into public.frequencias(aula_id,matricula_id,oferta_id,status) values ('${lesson}','${enrollment}','${pweb}','presente')`), /FORBIDDEN|VALIDATION_ERROR|row-level security/i)
  })
  await check('SQL-material-protocolo', 'URL executável rejeitada; URL HTTPS segura persistida', async () => {
    await denied(as('PROF-A', `insert into public.materiais(oferta_id,titulo,url) values ('${pweb}','Inseguro','javascript:alert(1)')`), /VALIDATION_ERROR|check constraint/i)
    await query(as('PROF-A', `insert into public.materiais(oferta_id,titulo,url) values ('${pweb}','Seguro','https://example.test/material')`, true))
    equal(await query('select count(*) from public.materiais'), 1)
  })
  await check('SQL-reserva-validacao', 'Reserva rejeita passado, fim inválido, data local diferente e sala inativa', async () => {
    for (const statement of [reserve(lab, 'now()-interval \'1 hour\'', 'now()+interval \'1 hour\''), reserve(lab, future(), future(3, '13:00')), reserve(lab, future(), future(4, '15:00')), reserve(fixture.salas[2].id)]) {
      await denied(as('PROF-A', statement), /VALIDATION_ERROR|NOT_FOUND|check constraint/i)
    }
    equal(await query('select count(*) from public.reservas'), 0)
  })
  await check('SQL-reserva-aluno-negado', 'Aluno pode consultar disponibilidade mas não reservar', async () => {
    await denied(as('ALUNO-A', reserve()))
    equal(await query(as('ALUNO-A', 'select count(*) from public.disponibilidade_salas()')), 0)
  })
  await check('SQL-reserva-professor-inativo', 'Professor academicamente inativo não cria reserva', async () => {
    await query(`update public.professores set status='inativo' where profile_id='${profiles['PROF-A']}'`)
    await denied(as('PROF-A', reserve()), /FORBIDDEN|VALIDATION_ERROR|row-level security/i)
    equal(await query('select count(*) from public.reservas'), 0)
  })
  await check('SQL-reserva-adjacencia-privacidade', 'Adjacência aceita; sobreposição rejeita; aluno recebe só intervalo', async () => {
    await query(as('PROF-A', reserve(), true))
    await query(as('PROF-B', reserve(lab, future(3, '15:00'), future(3, '16:00')), true))
    await denied(as('PROF-B', reserve(lab, future(3, '14:30'), future(3, '15:30'))), /conflicting key|RESERVATION_CONFLICT|23P01/i)
    equal(await query('select count(*) from public.reservas'), 2)
    equal(await query(as('ALUNO-A', "select count(*) from jsonb_object_keys((select to_jsonb(d) from public.disponibilidade_salas() d limit 1)) k where k in ('motivo','solicitante_profile_id')")), 0)
    equal(await query(as('ALUNO-A', 'select count(*) from public.disponibilidade_salas()')), 2)
  })
  await check('SQL-reserva-cancelamento', 'Outro professor não cancela; proprietário cancela e intervalo é liberado', async () => {
    await query(as('PROF-A', reserve(), true))
    const id = await query('select id from public.reservas limit 1')
    await denied(as('PROF-B', `select public.cancelar_reserva('${id}')`))
    await query(as('PROF-A', `select public.cancelar_reserva('${id}')`, true))
    equal(await query(`select status from public.reservas where id='${id}'`), 'cancelada')
    await query(as('PROF-B', reserve(), true))
    equal(await query("select count(*) from public.reservas where status='ativa'"), 1)
  })
  await check('SQL-reserva-admin-manutencao', 'Admin cancela para manutenção, preserva autor/momento e não cria reserva', async () => {
    await query(as('PROF-A', reserve(), true))
    const id = await query('select id from public.reservas limit 1')
    await denied(as('ADMIN-QA', reserve(lab, future(3, '16:00'), future(3, '17:00'))))
    await query(as('ADMIN-QA', `select public.cancelar_reserva('${id}')`, true))
    equal(await query(`select status||':'||cancelada_por||':'||(cancelada_em is not null)::text from public.reservas where id='${id}'`), `cancelada:${profiles['ADMIN-QA']}:true`)
  })
  await check('SQL-reserva-concorrencia', 'Duas conexões autenticadas na mesma barreira: exatamente um sucesso e uma reserva ativa', async () => {
    const barrier = await query("select clock_timestamp()+interval '1 second'")
    const race = alias => sql(as(alias, `select pg_sleep(greatest(0,extract(epoch from ('${barrier}'::timestamptz-clock_timestamp())))); ${reserve()}; select pg_sleep(0.5)`, true))
    const observed = await Promise.all([race('PROF-A'), race('PROF-B')])
    equal(observed.filter(r => r.code === 0).length, 1)
    equal(observed.filter(r => /conflicting key|RESERVATION_CONFLICT|23P01/i.test(r.stderr)).length, 1)
    equal(await query(`select count(*) from public.reservas where sala_id='${lab}' and status='ativa'`), 1)
    return { barrierBackend: barrier, requests: observed.map((r, i) => ({ profile: i === 0 ? 'PROF-A' : 'PROF-B', exit: r.code, response: r.code === 0 ? 'confirmada' : r.stderr })), activeCount: 1 }
  })
  await check('SQL-matricula-concorrencia', 'Duas chamadas simultâneas não duplicam vínculo', async () => {
    const barrier = await query("select clock_timestamp()+interval '1 second'")
    const race = () => sql(as('ADMIN-QA', `select pg_sleep(greatest(0,extract(epoch from ('${barrier}'::timestamptz-clock_timestamp())))); select public.registrar_matriculas('${alunos['ALUNO-A']}',array['${alvo}']::uuid[]); select pg_sleep(0.3)`, true))
    const observed = await Promise.all([race(), race()])
    equal(observed.filter(r => r.code === 0).length, 1)
    equal(await query(`select count(*) from public.matriculas where aluno_id='${alunos['ALUNO-A']}' and oferta_id='${alvo}' and status='ativa'`), 1)
    return { exits: observed.map(r => r.code), activeCount: 1 }
  })
  const failed = results.filter(r => r.status === 'REPROVADO').length
  await writeFile(path.join(output, 'resultado.json'), JSON.stringify({ mode: 'postgresql-rls-disposable', authTransport: 'NÃO EXECUTADO: GoTrue/JWT assinado/HTTP; identidades simuladas via SET LOCAL, sem bypass na operação testada', fixtureVersion: fixture.fixture_version, startedAt: stamp, results, passed: results.length - failed, failed }, null, 2))
  if (failed) process.exitCode = 1
  console.log(`Banco: ${results.length - failed} aprovados; ${failed} reprovados. Evidências: ${path.relative(root, output)}`)
} catch (error) {
  const blocked = String(error.message).startsWith('BLOQUEADO:')
  console.error(error.message)
  await mkdir(output, { recursive: true })
  await writeFile(path.join(output, 'resultado.json'), JSON.stringify({ status: blocked ? 'BLOQUEADO' : 'REPROVADO', reason: error.message, results }, null, 2))
  process.exitCode = blocked ? 2 : 1
} finally {
  await writeFile(path.join(output, 'execucao.log'), log)
  if (created) await execute('docker', ['rm', '-fv', container])
}
