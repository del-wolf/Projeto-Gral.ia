# Backend Gral.ia

O adaptador da aplicação usa Supabase Auth (e-mail e senha), Data API e quatro RPCs. A demo não depende deste diretório. Não há troca automática para demo quando Auth/rede/configuração falham.

## Banco e permissões

A migração `migrations/20261116053503_gralia_core.sql` cria 15 tabelas com RLS, FKs sem exclusões em cascata, grants explícitos, unicidade e validações. O nome do arquivo foi gerado por `supabase migration new gralia_core` com CLI 3.1.0. Os papéis vêm de `profiles`, vinculada a `auth.users`; o cliente não insere perfis nem altera papéis ou `profile_id`.

- Aluno lê seu cadastro, ofertas ativas, materiais e seu histórico de notas/frequência; não escreve dados pedagógicos.
- Professor ativo lê e altera somente suas ofertas; não vê notas de outro professor. Reserva e cancela seus próprios ambientes.
- Admin técnico prepara cadastros/ofertas/matrículas e cancela reservas para manutenção; não recebe leitura ou escrita das tabelas pedagógicas.
- Aluno consulta apenas intervalos ocupados pela projeção `disponibilidade_salas`, que não retorna solicitante nem motivo.

As funções auxiliares privilegiadas estão no schema não exposto `private`, com `search_path` fixado e escopo condicionado a `auth.uid()`. RPCs públicas são `SECURITY INVOKER`; a projeção privada de disponibilidade é a exceção necessária para devolver intervalos sanitizados de terceiros. As policies não usam `user_metadata` e não consultam recursivamente `profiles`.

`registrar_matriculas` valida o lote inteiro, trava o aluno, rejeita lista vazia/repetida e duplicidade ativa e reativa o mesmo vínculo cancelado. `reservar_sala` usa exclusão GiST sobre `sala_id` e `tstzrange(...,'[)')` para impedir corrida; horários adjacentes são permitidos. `cancelar_reserva` mantém histórico. IDs e pares pedagógicos existentes são imutáveis; notas e frequência têm FKs compostas da mesma oferta, além de validação de vínculo ativo.

## Testes PostgreSQL/RLS locais

Execute da raiz:

```powershell
npm run test:db
```

Requer Docker Desktop com daemon ativo e acesso inicial à imagem `postgres:17.6-bookworm`. O runner cria seu próprio container sem portas, rede ou volume de host, aplica a migração e remove o container e seu volume ao encerrar. Não recebe URL de banco e não pode resetar um destino remoto. Emite JSON, JUnit, log SQL e ambiente em `docs/evidencias/db-*`.

O bootstrap SQL reproduz apenas `auth.users` e `auth.uid()`. Os testes usam `SET LOCAL ROLE authenticated` e cinco sujeitos de JWT simulados para exercitar RLS sem bypass. A corrida usa duas conexões PostgreSQL simultâneas. Isso valida regras SQL/RLS/concorrência, **não** valida GoTrue, assinatura/expiração de JWT, Auth HTTP ou integração da aplicação com a Data API.

## Preparar integração Supabase local real

Em uma máquina com espaço suficiente para as imagens da stack, confira `npx supabase --help` e `npx supabase start --help`, então:

```powershell
npx supabase start
```

O arquivo `config.toml` identifica `gralia-local`, mantém apenas Auth/Data API/banco e não contém credenciais remotas. A primeira inicialização aplica as migrações. Nunca use `--remote` para esta preparação. Se precisar restaurar todo o banco de testes local, confira `npx supabase db reset --help` e execute `npx supabase db reset --no-seed` somente após confirmar que o destino é a stack local descartável `gralia-local`; isso apaga os dados locais. Na CLI 3.1.0 o destino é local por padrão, sem `--local`; nunca adicionar `--remote`.

Depois configure, **somente no terminal administrativo**, a URL local, a chave administrativa local obtida por `npx supabase status`, uma senha sintética e a confirmação explícita:

```powershell
$env:GRALIA_TEST_SUPABASE_URL = "http://127.0.0.1:54321"
$env:GRALIA_TEST_SERVICE_ROLE_KEY = "<chave administrativa apenas do ambiente local>"
$env:GRALIA_TEST_PUBLISHABLE_KEY = "<chave pública apenas do ambiente local>"
$env:GRALIA_TEST_PASSWORD = "<senha sintética com pelo menos 12 caracteres>"
$env:GRALIA_TEST_ALLOW_PROVISION = "LOCAL_DISPOSABLE_ONLY"
node supabase/tools/provision-local.mjs
```

A ferramenta recusa URLs remotas, cria contas pelo método suportado `auth.admin.createUser`, mapeia os IDs reais aos aliases da fixture e insere dados sintéticos. Os modelos de reserva D+2 são criados pela sessão do próprio docente com chave pública, convertidos pelo fuso IANA e derivados do relógio HTTP do backend local. Não supõe UUID Auth arbitrário e não envia e-mails. Não limpa registros antigos ou reservas; iniciar uma rodada independente exige o reset local separado. O mapa sem senhas/tokens fica em `work/supabase-test-identities.json`. Nunca incluir `SERVICE_ROLE` ou `sb_secret_*` em variáveis `VITE_`.

No `.env.local` do frontend, configure apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` públicas. Execute `npm run dev:supabase`. O login real é com o e-mail sintético da fixture e a senha administrativa escolhida, sem seletor de papel. As contas acadêmicas criadas pelo admin na UI não criam contas Auth.

## Limites de execução nesta entrega

A tentativa real de iniciar a stack Supabase completa foi interrompida quando o download das imagens esgotou o espaço do Docker. As imagens criadas somente para essa tentativa foram removidas e os testes SQL foram repetidos separadamente. Auth/REST, navegador integrado e advisors da CLI precisam ser executados em uma máquina com espaço/configuração adequados; não equivalem aos resultados aprovados do runner PostgreSQL. Advisors não foram executados nesta entrega.

Referências verificadas: [changelog](https://supabase.com/changelog.md), [mudança CLI v3](https://supabase.com/changelog/supabase-cli-v3), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Data API](https://supabase.com/docs/guides/api/securing-your-api). CLI 3.1.0 foi executada em container descartável pois o diretório de configuração padrão do ambiente era somente leitura. Não foi necessário alterar a pasta pessoal do usuário.
