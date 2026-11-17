# Testes do PostgreSQL e preparação integrada

`npm run test:db` exige Docker Desktop/daemon e acesso inicial à imagem fixa
`postgres:17.6-bookworm` fixada também por digest SHA-256. O executor cria um
contêiner com nome único, sem portas, rede ou volume do host; seu volume anônimo
próprio é removido ao terminar. Aplica as migrações e as fixtures; usa cinco sujeitos distintos
com `SET LOCAL ROLE authenticated`, sem `BYPASSRLS`, e destrói apenas esse contêiner
ao terminar. Não recebe URL de banco e não pode executar reset remoto.

As duas conexões da corrida aguardam o mesmo instante medido pelo PostgreSQL e
disparam reservas sobrepostas. A primeira transação mantém o registro aberto
brevemente; a restrição GiST precisa impedir a segunda. O relatório inclui as
duas respostas e a contagem independente do banco.

Os resultados ficam em `docs/evidencias/db-<instante>/resultado.json`, com log SQL
e ambiente. Esperado e observado são campos distintos. Falta de Docker gera
**BLOQUEADO** e saída 2; falha de uma asserção gera **REPROVADO** e saída 1.

Esse ensaio valida PostgreSQL, grants, RLS, integridade, transações e concorrência.
`bootstrap.sql` simula apenas a função `auth.uid()` e sujeitos JWT. Ele não é uma
implementação de Auth, não é migração, e não valida GoTrue, JWT assinado, HTTP ou
sessão do navegador. Essas partes precisam de uma execução integrada separada.

## Preparar contas em um Supabase local descartável

Use somente o Supabase local deste projeto. Antes de iniciar uma rodada
independente, confira o destino local no CLI e use o comando local de reset
documentado por `npx supabase db reset --help`. Esse comando apaga o banco local;
nunca acrescente opções de destino remoto. A ferramenta abaixo não apaga dados
anteriores e não reinicia reservas. Não use como prova de fixture limpa se já
houver intervenções anteriores.

No PowerShell, defina os valores fornecidos pela sua própria instância local:

```powershell
$env:GRALIA_TEST_SUPABASE_URL = 'http://127.0.0.1:54321'
$env:GRALIA_TEST_ALLOW_PROVISION = 'LOCAL_DISPOSABLE_ONLY'
# Defina GRALIA_TEST_SERVICE_ROLE_KEY, GRALIA_TEST_PUBLISHABLE_KEY e
# GRALIA_TEST_PASSWORD no terminal,
# sem salvar os valores em código, .env público ou evidências.
node supabase/tools/provision-local.mjs
```

A chave administrativa fica somente no executor. Contas são criadas pela API
Auth suportada; o UUID retornado substitui o UUID lógico da fixture nos vínculos.
O usuário do navegador continua usando chave pública e sua própria sessão. Não
existe endpoint público para reset ou criação de perfil admin. Os modelos D+2 de
reservas são criados com a sessão do próprio docente e chave pública. A data base
vem do cabeçalho Date do backend Auth local e a conversão usa America/Sao_Paulo;
a ferramenta reaproveita uma reserva ativa idêntica ao repetir no mesmo dia.
O mapa resultante
em `work/supabase-test-identities.json` não contém senha/chave e não constitui
resultado de teste.

Depois configure `.env.local` com a URL/chave pública e execute
`npm run dev:supabase` ou a suíte integrada. Credenciais dos cinco usuários devem
ser entregues apenas ao executor de testes, conforme `cypress.config.ts`.

Nenhuma execução integrada deve usar service role para comprovar autorização.

## Verificação real Auth/HTTP, separada do SQL

Depois de uma preparação limpa local, defina `GRALIA_TEST_SUPABASE_URL`,
`GRALIA_TEST_PUBLISHABLE_KEY` e `GRALIA_TEST_PASSWORD` e execute:

```powershell
node supabase/tests/http.mjs
```

São cinco logins Auth reais, `getUser`, leituras com os respectivos JWTs,
isolamento entre alunos/docentes, admin sem acesso pedagógico, tentativa de
alterar papel e RPCs proibidas/entrada vazia. Erros esperados exigem seus códigos
SQL (`42501` e `23514`); um endpoint ausente não é aceito como prova de negação.
O executor não usa chave administrativa, não reseta e não faz escrita autorizada
durável. Exige a fixture limpa porque compara as contagens iniciais. Produz JSON
em `docs/evidencias/supabase-http-<instante>/` e retorna 2 **BLOQUEADO** quando
falta configuração. Não substitui Cypress, matrícula válida persistida, nem
concorrência de reservas pela API. O teste padrão `npm run test:db` permanece
independente do serviço Auth.
