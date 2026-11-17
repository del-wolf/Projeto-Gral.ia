# Cypress integrado: reprodução local descartável

A suíte `cypress/e2e/supabase.cy.ts` implementa CT-GR-001, CT-GR-002 e CT-GR-006 contra Auth e Data API reais. Nesta entrega, **execução integrada BLOQUEADA**: a stack Supabase completa não ficou disponível por falta de espaço para as imagens Docker. Não confundir com os testes unitários do adaptador ou com os testes PostgreSQL/RLS executados separadamente.

## Preparação e execução no Windows

Use uma máquina com Node/npm compatíveis, Docker Desktop e espaço para a stack Supabase. Execute todos os comandos na raiz do projeto:

```powershell
npm ci
npx supabase --help
npx supabase start --help
npx supabase start
npx supabase status
```

Confirme que o destino é a stack **local descartável** `gralia-local` definida em `supabase/config.toml`. Não adicionar `--remote`. O runner abaixo recusa qualquer URL fora de `localhost`, `127.0.0.1` ou `[::1]`, mesmo com a confirmação preenchida.

Defina no mesmo terminal PowerShell os valores da stack local. Não salvar a chave administrativa em `.env.local`, em variável `VITE_`, no Git ou nas evidências:

```powershell
$env:VITE_SUPABASE_URL = "http://127.0.0.1:54321"
$env:VITE_SUPABASE_PUBLISHABLE_KEY = "<chave pública local>"
$env:GRALIA_TEST_SERVICE_ROLE_KEY = "<chave administrativa somente local>"
$env:GRALIA_TEST_PASSWORD = "<senha sintética com pelo menos 12 caracteres>"
$env:GRALIA_DISPOSABLE_LOCAL = "LOCAL_DISPOSABLE_ONLY"
npm run test:e2e:supabase
```

As variáveis precisam estar no processo do terminal executor; apenas escrever `.env.local` não configura as tarefas Node do Cypress. No Linux/CI, forneça as mesmas variáveis pelo ambiente do executor. Os scripts Node iniciam o Vite, aguardam a porta 4173 e encerram o servidor após o Cypress, inclusive quando a suíte falha.

**Efeito da confirmação:** antes de **cada caso**, a preparação Node apaga os registros de todas as 15 tabelas públicas da aplicação nesse destino local e restaura a fixture 1.0. Contas Auth sintéticas são criadas/atualizadas pelo método administrativo suportado e seus IDs reais são mapeados; outras contas Auth não são apagadas. Nunca apontar para ambiente com dados que precisem ser preservados. A restauração não é um endpoint da aplicação e não entra na build integrada.

A chave administrativa serve somente à preparação da fixture. As ações da tela e todas as asserções de matrícula usam sessões próprias de usuários reais de teste. A senha de teste do admin chega ao navegador para o login com logs desabilitados; a chave administrativa permanece no processo Node e não é colocada no `config.env` do Cypress. As evidências omitem tokens e chaves.

## O que a suíte verifica

| Caso | Ação e consulta independente |
|---|---|
| CT-GR-001 | Reinicia a fixture; login Auth do ADMIN-QA; matrícula QA2026001/OF-TEST-3A pela tela; uma chamada de criação; confirmação em `role=status`; busca/seleção limpas; três matrículas totais e exatamente uma do par em consulta Data API independente autenticada como admin; recarga e nova consulta. |
| CT-GR-002 | Reinicia a mesma fixture; botão desabilitado e orientação sem seleção; zero chamada de criação da tela; tarefa separada chama a RPC com `[]` usando token admin real, exige rejeição SQL `23514` e nenhuma mudança das duas matrículas base. O erro da RPC não é atribuído ao botão desabilitado. A validação do domínio é testada separadamente no Vitest. |
| CT-GR-006 | Reinicia a fixture e tenta matricular usando sessões próprias de ALUNO-A, ALUNO-B, PROF-A e PROF-B; exige rejeição `42501`/HTTP403 e zero novas matrículas. |

A fixture de reserva relativa também é restaurada. Datas D+2 partem do cabeçalho `Date` do backend, são convertidas em `America/Sao_Paulo` e persistidas em UTC. O relógio do navegador não substitui o relógio PostgreSQL.

Os resultados JSON/JUnit, ambiente/hash e screenshots reais são gerados em `docs/evidencias/<run-id>-supabase/` **somente quando a suíte roda**. A ausência das variáveis ou confirmação encerra o runner com código 2 antes de iniciar o servidor ou alterar dados e produz `bloqueado.json`. Uma falha de preparação interrompe a suíte e não vira aprovação ou teste ignorado.

## Verificação feita nesta sessão

Foram executados `node --check` nos dois scripts e ESLint na configuração, suíte e scripts. Dez verificações dos guardas locais passaram: configuração ausente, destinos remotos/URLs inválidas, confirmação incorreta, chave administrativa em `VITE_` e repetição da guarda antes de preparar dados. Essas verificações não abriram conexão e **não validam Auth/Data API reais**.

Próximo passo exato: em máquina com a stack local disponível, preencher as cinco variáveis acima, confirmar o descarte local e executar `npm run test:e2e:supabase`; revisar resultados/screenhots antes de atribuir status acadêmico à rodada integrada.
