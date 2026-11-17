> **Entrega de fontes para revisão.** O ZIP anterior foi bloqueado pelo antivírus do usuário. A causa ainda não foi identificada; não há conclusão de falso positivo. Esta pasta apresenta arquivos-fonte abertos para inspeção no GitHub, sem builds, dependências instaladas ou anexos de evidências. Não desative a proteção nem libere o pacote anterior. Não execute `npm ci`, scripts ou builds enquanto o alerta não for identificado; os comandos abaixo são apenas referência técnica. A identificação do alerta continua pendente.

> Os relatórios e as capturas citados abaixo pertencem à execução anterior e não estão incluídos nesta entrega de fontes. A base de código da aplicação foi mantida byte a byte; mudanças desta distribuição se limitam à documentação. Veja `docs/REVISAO_DOWNLOAD.md`.

# Gral.ia

Protótipo acadêmico de Igor Felipe Wolff, Técnico em Desenvolvimento de Sistemas do CEDUP Renato Ramos da Silva. React e TypeScript com demonstração local persistente e adaptador Supabase. A aplicação usa dados fictícios; as convenções de notas, frequência e reservas não representam regulamento oficial da instituição.

## Abrir no Windows e VS Code

1. Instale Node.js **24 LTS** (ambiente verificado: 24.22.1; npm 11.9.0) e o VS Code.
2. Extraia o projeto em uma pasta, por exemplo `C:\Projetos\Gralia`. Abra essa pasta no VS Code, a que contém este `README.md` e `package.json`.
3. No terminal PowerShell integrado, execute:

```powershell
node --version
npm --version
npm ci
npm run dev
```

Abra o endereço que o Vite imprimir, normalmente `http://127.0.0.1:5173`. `npm run dev` inicia explicitamente a demo; `npm run dev:demo` é equivalente. A primeira utilização da demo não exige conta, chave de API ou Docker. A instalação inicial das dependências usa internet. Pare o servidor com `Ctrl+C`.

Se o PowerShell bloquear `npm.ps1`, use os mesmos comandos com `npm.cmd`, sem alterar a política global de execução. Use uma pasta local gravável, sem executar o projeto dentro do ZIP.

## Contas fictícias e caminhos de teste

A entrada da demo é uma **simulação**, sem senha nem autenticação segura. O aviso “Demonstração com dados fictícios” identifica esse modo.

| Conta | Acesso inicial |
|---|---|
| `ADMIN-QA` | Cadastros, catálogo/ofertas, matrículas e operação de reservas; sem acesso pedagógico global |
| `ALUNO-A` | Matrícula `QA2026001`, inicialmente em `OF-PWEB-3A`; notas 8 e 6, uma nota pendente; frequência P, F e pendente |
| `ALUNO-B` | Matrícula `QA2026002`, inicialmente em `OF-BD-3B`; conjunto independente de dados |
| `PROF-A` | Programação Web, Qualidade e Teste de Software e Redes; lançamentos dessas ofertas e reservas próprias |
| `PROF-B` | Banco de Dados; lançamentos dessa oferta e reservas próprias |

`ALUNO-C`/`QA2026003` é cadastro acadêmico sem conta associada. Cadastro de aluno/docente não cria usuário Auth nem permite escolher papel de acesso.

Para a atividade, entre como `ADMIN-QA`, abra **Matrículas**, busque `QA2026001`, selecione `OF-TEST-3A` de Qualidade e Teste de Software e registre. Após salvar, a seleção é limpa; recarregue e confira o vínculo. Para CT-GR-002, restaure os dados antes, busque o mesmo aluno e não selecione oferta: o botão fica desabilitado e a instrução permanece visível. A rejeição de lista vazia no domínio é um teste separado.

As áreas de aluno e professor usam os vínculos correntes. O professor registra avaliações, notas decimais, aulas, frequência e links de material. O aluno consulta suas ofertas, plano, referências, notas, pendências, frequência e agenda derivada. Reservas armazenam instantes UTC e exibem **America/Sao_Paulo**; aluno consulta disponibilidade sem dados pessoais de terceiros.

## Persistência e reset

A demo guarda dados em armazenamento local versionado do navegador. Recarregar e sair da conta não apagam os registros. A confirmação de sucesso ocorre depois da gravação. Se o navegador bloquear armazenamento ou faltar espaço, a aplicação apresenta erro e preserva o formulário.

Use **Restaurar demonstração** e confirme para reiniciar a fixture 1.0. Cancelar mantém os dados. O reset modifica apenas chaves próprias do Gralia, preservando chaves externas. Cada navegador/origem possui seu próprio conjunto; a fila de gravação da instância não coordena abas diferentes, e esse armazenamento não substitui um servidor nem garante concorrência entre usuários.

## Modo Supabase

```powershell
Copy-Item .env.example .env.local
```

Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com o ambiente de desenvolvimento/testes que você controla. Não coloque `service_role`, chaves `sb_secret_`, senhas de banco ou tokens administrativos em variáveis `VITE_`. O projeto não inclui credenciais nem provisiona serviços remotos automaticamente.

```powershell
npm run dev:supabase
```

Esse modo usa email/senha do Supabase Auth e perfil protegido no banco. Migrações, políticas, constraints, RPCs e ferramentas de testes estão em `supabase/`.

Para preparar o **Supabase local descartável**, instale Docker Desktop e confira `project_id = "gralia-local"` em `supabase/config.toml`. Na raiz:

```powershell
npx supabase start
npx supabase db reset --no-seed
```

O reset acima apaga o banco **local deste projeto** e aplica as migrações. Não use `--remote`. A CLI 3.1.0 usa destino local por padrão e não possui a antiga flag `--local`. Essa preparação só se aplica à instância descartável que você confirmou; nunca aponte o processo para produção. Depois provisione as cinco contas sintéticas com `supabase/tools/provision-local.mjs`, conforme [o roteiro do backend](supabase/tests/README.md); a ferramenta exige URL loopback, `GRALIA_TEST_PUBLISHABLE_KEY`, `GRALIA_TEST_SERVICE_ROLE_KEY`, `GRALIA_TEST_PASSWORD` e confirmação `GRALIA_TEST_ALLOW_PROVISION=LOCAL_DISPOSABLE_ONLY`. A chave administrativa fica apenas no executor. Os templates de reserva usam a sessão do professor e o instante fornecido pelo backend, com conversão America/Sao_Paulo. Copie somente URL/chave pública para `.env.local` e use `npm run dev:supabase`.

 O JSON da fixture não é um seed SQL nem contém usuários Auth provisionados. Prepare um ambiente descartável e vincule as contas sintéticas conforme a documentação do backend. Aluno/docente acadêmico pode existir antes da conta.

Ausência de configuração produz erro claro. Falha de Auth, sessão ou rede não muda para demo. A build Supabase usa o mesmo domínio e telas, sem importar fixture, seleção fictícia, reset ou ganchos de teste da demo.

## Comandos na raiz

| Comando | Finalidade |
|---|---|
| `npm run dev` / `npm run dev:demo` | Abrir demo local |
| `npm run dev:supabase` | Abrir aplicação com Auth/banco reais |
| `npm run verify` | Typecheck, lint, Vitest, builds e inspeção do bundle, com relatórios de evidência |
| `npm run typecheck` | TypeScript estrito |
| `npm run lint` | ESLint |
| `npm run test:unit` | Vitest: regras e testes locais pertinentes |
| `npm run test:e2e:demo` | Cypress no navegador, com Vite iniciado/aguardado/encerrado pelo executor |
| `npm run test:e2e:supabase` | Cypress integrado; exige ambiente descartável preparado e variáveis do executor |
| `npm run test:db` | SQL/RLS/concorrência em PostgreSQL descartável próprio; requer Docker Desktop/daemon |
| `npm run build:demo` | Conferir tipos e gerar build da demo |
| `npm run build:supabase` | Conferir tipos e gerar build integrada |
| `npm run preview:demo` | Servir a build demo já gerada |

Não mantenha outro servidor na porta **4173** durante E2E. O executor inicia o Vite nessa porta, aguarda HTTP e encerra o processo ao terminar, inclusive em falhas. Relatórios JSON/JUnit, log do Vite e screenshots vão para `docs/evidencias/`. O navegador padrão é o Electron do Cypress. Se a instalação do binário foi bloqueada ou interrompida, execute `npx cypress install` e `npx cypress verify`; esses comandos usam a versão fixada localmente.

O teste `test:db` exige Docker Desktop/daemon com contêineres Linux e baixa inicialmente `postgres:17.6-bookworm`. Ele cria um contêiner de nome único, sem rede, portas ou volumes, aplica o bootstrap de teste, migrações e fixtures e remove apenas esse contêiner ao terminar. Não recebe URL e não acessa bancos remotos. As cinco identidades usam papéis e sujeitos JWT simulados no PostgreSQL, sem BYPASSRLS na operação protegida; isso testa SQL/RLS/concorrência, sem validar Supabase Auth/GoTrue/JWT assinado/API HTTP. Veja [preparação e testes do backend](supabase/tests/README.md).

Para verificar Auth/API reais com as cinco contas provisionadas, existe também `node supabase/tests/http.mjs`. Ele aceita apenas loopback e usa `GRALIA_TEST_SUPABASE_URL`, `GRALIA_TEST_PUBLISHABLE_KEY` pública e `GRALIA_TEST_PASSWORD` sintética no terminal; recusa chave administrativa para provar RLS e não reinicia os dados. Execute sobre a fixture limpa, antes de uma matrícula válida alterar o par-alvo, ou prepare uma nova rodada local independente. Essa ferramenta tem relatório próprio e está bloqueada nesta entrega por falta da stack Supabase completa em execução.

A suíte `test:e2e:supabase` aceita somente a stack local descartável, recusando destinos remotos. Ela exige no ambiente do terminal `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `GRALIA_TEST_SERVICE_ROLE_KEY` (somente Node), `GRALIA_TEST_PASSWORD` sintética com pelo menos 12 caracteres e `GRALIA_DISPOSABLE_LOCAL=LOCAL_DISPOSABLE_ONLY`. **A confirmação autoriza restaurar a fixture antes de cada caso: registros das 15 tabelas da aplicação nesse banco local são apagados.** Contas Auth sintéticas são criadas/atualizadas por ferramenta administrativa; ações e asserções usam sessões próprias, sem service role para provar RLS. Não use um ambiente com dados a preservar. O roteiro completo está em [TESTES_SUPABASE_E2E](docs/TESTES_SUPABASE_E2E.md). No PowerShell, configure variáveis com `$env:NOME="valor"`; `.env.local` não configura as tarefas Node. Nenhuma chave administrativa entra na build ou no `config.env` do Cypress.

## Estrutura e evidências

- `app/`: telas, componentes, domínio e adaptadores.
- `fixtures/`: contrato sintético 1.0.
- `supabase/`: migrações, ferramentas e testes de banco.
- `cypress/`: suítes de navegador demo e integrada.
- `docs/`: especificação, decisões, roteiro de validação, estado da implementação e evidências.
- `.github/workflows/verify.yml`: checks web, Cypress demo e PostgreSQL descartável reproduzíveis, sem publicação.

Consulte [STATUS_IMPLEMENTACAO](docs/STATUS_IMPLEMENTACAO.md) para marcos e resultados efetivamente observados, [VALIDACAO](docs/VALIDACAO.md) para o roteiro e [VERSOES_E_FONTES](docs/VERSOES_E_FONTES.md) para versões e fontes oficiais. Os casos de teste originais em `docs/CASOS_DE_TESTE_GRALIA.md` descrevem o planejamento; não devem ser interpretados como relatórios de execução. Os registros novos estão em `docs/evidencias/`.

## Validação desta entrega

Executado em Linux: typecheck, lint e builds dos dois modos aprovados; **36 testes Vitest, 15 testes Cypress demo e 44 testes PostgreSQL aprovados**, incluindo CT-GR-001/002 e concorrência real no banco. Relatórios JSON/JUnit, logs e screenshots reais estão em `docs/evidencias/`; os caminhos finais e escopos estão em [STATUS_IMPLEMENTACAO](docs/STATUS_IMPLEMENTACAO.md). Os testes SQL usam sujeitos JWT simulados; Auth/API Supabase completos estão **bloqueados** por falta de espaço para as imagens da stack. Windows, leitor de tela, zoom manual e APK não foram executados.

## Limites desta rodada

A demo não prova RLS nem segurança de servidor. Integração só pode ser considerada validada após Auth, API, persistência, permissões e concorrência reais no ambiente identificado. Resultados bloqueados ou não executados estão registrados separadamente; build concluída não substitui esses ensaios.

As metas WCAG 2.2 AA/eMAG 3.1 incluem teclado, foco, semântica, contraste e reflow; auditoria axe não certifica conformidade integral. Leitor de tela e zoom manual têm roteiro e status próprios. Não há APK/Android validado, deploy, upload real, secretaria, biblioteca, financeiro, fórum, push, IA ou integração institucional. Não foram importados dados pessoais do CSV antigo nem resultados de testes históricos.
