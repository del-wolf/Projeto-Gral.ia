# Estado da implementação

A demo Gral.ia está implementada e validada nos fluxos automatizados abaixo. **CT-GR-001 e CT-GR-002 passaram no navegador real da demo**. A entrega inclui também adaptador Supabase e banco SQL testado; **Auth/API Supabase completos permanecem bloqueados**, separados dos resultados locais. Horários reais, UTC e America/Sao_Paulo estão nos relatórios.

## Marcos

| Marco | Estado e escopo comprovado |
|---|---|
| M1 — base, navegação, temas e demo | **Concluído na demo.** React/TypeScript/Vite, entrada/saída simuladas, home por perfil, acesso negado, temas, persistência e reset. Navegador verificou recarga, troca de perfil, acesso negado e reset com confirmação/preservação de chave externa. |
| M2 — cadastros, ofertas e matrícula | **Concluído na demo e regras locais.** Cadastros acadêmicos, catálogo, turmas, períodos, ofertas e vínculos implementados. Casos acadêmicos aprovados em Cypress; lote, duplicidade, inativo, reativação e permissões verificados em domínio e PostgreSQL. Cadastro acadêmico não provisiona Auth nem permite escolher papel. |
| M3 — área acadêmica e pedagógica | **Concluído na demo.** Ofertas, plano/referências, avaliações, notas decimais, aulas, frequência, links e agenda. Navegador verificou zero versus pendência, média parcial/completa, decimal após recarga, presença pendente sem duplicação e material/avaliação somente na oferta do aluno correto. |
| M4 — ambientes e reservas | **Concluído na demo e PostgreSQL local.** Lista/disponibilidade, filtros, criação e cancelamento implementados. Navegador verificou persistência, conflito e adjacência; SQL verificou exclusão GiST e duas conexões concorrentes reais. |
| M5 — Supabase e banco | **Código entregue; validação parcial.** Adaptador implementado, 15 tabelas com RLS/grants/constraints e RPCs; **44/44 testes PostgreSQL locais aprovados**. Auth/GoTrue, assinatura/expiração de JWT, API HTTP e E2E Supabase completos **BLOQUEADOS**: imagens da stack excederam o espaço disponível. Não são aprovados pelos testes SQL. |
| M6 — acessibilidade, CI e documentação | **Parte automatizada concluída no escopo declarado.** Checks, documentação, CI web/SQL, teclado no navegador, reflow 320 px, axe e cálculo de contraste. Leitor de tela, zoom físico/manual de 200%, Windows e Android/APK não executados. Sem alegação de conformidade integral WCAG/eMAG. |

## Resultados finais efetivamente executados

| Comando/ensaio | Observado | Evidência |
|---|---|---|
| Instalação npm com lockfile | Concluída sem `--force` ou `--legacy-peer-deps` | `package-lock.json`; inventário no relatório de checks |
| `npm run typecheck` | APROVADO, saída 0 | `evidencias/2026-11-16T05-48-13-722Z-checks/typecheck.log` |
| `npm run lint` | APROVADO, saída 0 | Mesmo diretório, `lint.log`; a suíte final também teve lint aprovado |
| Vitest | **36/36 APROVADOS**, sem pendentes/TODO | Mesmo diretório, `vitest.json`, `vitest-junit.xml`, `unit.log` |
| `npm run build:demo` | APROVADO, saída 0 | Mesmo diretório, `build-demo.log` |
| `npm run build:supabase` | APROVADO, saída 0; aviso de tamanho do bundle | Mesmo diretório, `build-supabase.log` |
| Inspeção do bundle integrado | Zero marcadores proibidos encontrados: fixture-alvo, ADMIN-QA, hooks, reset, entrada fictícia e Manus | Mesmo diretório, `bundle-integrado.json` |
| `npm run test:e2e:demo` | **15/15 APROVADOS**: 14 testes demo e 1 de teclado, em duas specs; zero falhas, pendentes ou ignorados | `evidencias/2026-11-16-demo-final/` — JSON/JUnit, ambiente, log e screenshots reais |
| `npm run test:db` | **44/44 APROVADOS**, saída 0, PostgreSQL 17.6 descartável | `evidencias/db-2026-11-16T05-40-42-834Z/` — JSON/JUnit, ambiente e log SQL |
| Contraste estático | 24 pares selecionados acima dos limiares aplicados | `evidencias/2026-11-15-contraste-css/` — script, resultado e log |
| Auditoria estática de entrega | Nenhum candidato nos padrões de segredo verificados; fixture idêntica ao contrato; sem CSV pessoal | `evidencias/auditoria-estatica-entrega/resultado.json` — escopo e limites explícitos |
| Inicialização Supabase completo | **BLOQUEADO** por espaço para imagens | `evidencias/supabase-local-20261116T054120Z/` |
| Teste Auth/API HTTP | **BLOQUEADO**, sem configuração da stack real, saída 2 | `evidencias/supabase-http-2026-11-16T05-42-00-229Z/resultado.json` |
| E2E Supabase e suas guardas | Runner sem configuração encerrou com saída 2, sem servidor/rede/escrita; dez verificações de guardas passaram | `evidencias/supabase-e2e-bloqueado-2026-11-16T05-49-10.751Z/` — não comprova integração |

Vitest verifica regras, repositório demo e adaptador com SDK simulado; não comprova serviço Supabase. PostgreSQL usa cinco sujeitos distintos com `SET LOCAL ROLE authenticated`/claim JWT simulado, sem bypass nas operações protegidas. A prova de concorrência SQL usa duas conexões e contagem independente; não depende de dois cliques.

O hash do snapshot dos checks é `e12310e8a9d2f4fc41109b81e6a0486a32437eaf79b20a568ed71335876e67fd`, com inventário em `hashes.json`. O snapshot da rodada final Cypress é `15982bc3abba216738d97698ef3c37057fb76d443c27f31ed94f49400df183fb`. Os ensaios têm inventários/escopos próprios; não se presume que hashes calculados por métodos distintos coincidam. A fixture é 1.0. Ambiente: Node 24.22.1/npm 11.9.0, Cypress 15.21.2/Electron 138.0.7204.251, Linux. A rodada Cypress terminou em `2026-11-16T16:36:29.437Z`; o arquivo `ambiente.json` registra também o instante em America/Sao_Paulo.

## Casos acadêmicos e capturas

Os registros com os 14 campos, resultado esperado separado do observado e responsável pela execução estão em:

- `evidencias/2026-11-16-demo-final/CT-GR-001/resultado-observado.json` — um vínculo ativo, busca/seleção limpas, leitura independente do repositório e persistência após recarga.
- `evidencias/2026-11-16-demo-final/CT-GR-002/resultado-observado.json` — botão desabilitado, instrução visível, zero chamada de criação pela tela, zero nova matrícula. Rejeição da lista vazia no domínio é teste separado; SQL/RPC foi testado no PostgreSQL local, sem alegar Auth/API Supabase.

Screenshots reais ficam em `evidencias/2026-11-16-demo-final/screenshots/`: entrada e visão geral, matrícula persistida, seleção vazia, nota decimal, reservas, tela 320 px, tema escuro e fluxo de teclado/modal. Os casos completos originais permanecem como planejamento em `CASOS_DE_TESTE_GRALIA.md`; **15 testes de navegador não significam aprovação integral dos 41 casos planejados**.

## Acessibilidade verificada e pendente

O teste de teclado usa Enter em links/formulários e Space nativo em botões, Tab e Escape conforme o fluxo automatizado. Confere skip link, matrícula e foco/contenção/retorno do modal. Axe foi executado na entrada em tema claro e na matrícula em claro/escuro. Reflow 320 CSS px manteve matrícula operável e sem rolagem horizontal global indevida no cenário verificado. O cálculo estático mede somente 24 pares opacos selecionados do CSS; não é auditoria visual completa.

Nenhum desses ensaios substitui teclado físico/manual, NVDA/TalkBack, zoom real de 200% ou inspeção de todos os estados/telas. Esses itens permanecem **NÃO EXECUTADOS**, com roteiro em `VALIDACAO.md`. Não há certificação integral WCAG 2.2 AA/eMAG 3.1.

## Limitações e tentativas preservadas

- Auth, sessão inválida/expirada, JWT assinado e Data API reais precisam da stack Supabase executável. O adaptador revalida `getUser` por operação, mas a UI não assina mudanças imediatas de Auth; limpeza instantânea de dados entre chamadas ainda precisa de validação integrada.
- A demo persiste por navegador/origem; sua fila local não coordena abas nem substitui concorrência de servidor.
- A build integrada gerou aviso de bundle acima de 500 kB, sem falha. Otimização de carregamento pode ser feita depois.
- Rodadas SQL anteriores com trigger incorreto, prontidão ou falta de espaço permanecem registradas. A migração foi corrigida e a conclusão SQL usa a rodada 44/44; a stack Supabase completa continuou bloqueada.
- Rodadas Cypress anteriores falharam e foram preservadas. Ajustes de controle de armazenamento, sincronização de entrada e driver de teclado foram verificados na rodada final 15/15. O diagnóstico específico do driver Cypress está em `evidencias/2026-11-16-keyboard-focused/diagnostico-harness.md`; não se atribui a todas as falhas uma causa única nem HMR não confirmado.
- Workflow GitHub Actions preparado, sem execução remota nesta sessão. Instalação Windows/VS Code tem instruções, mas foi executada somente em Linux neste ambiente.
- Não há APK/Android compilado, publicação/deploy, upload real ou integração institucional. Nenhum serviço remoto foi modificado. Não foram implementados biblioteca, financeiro, secretaria, fórum, push ou IA nesta rodada.

## Próximos passos exatos

Últimos marcos verificáveis: demo e casos acadêmicos, checks completos, Cypress 15/15 e PostgreSQL local 44/44. O código e as evidências estão preservados; não reinicializar o projeto ao continuar.

1. No Windows, abrir a raiz no VS Code, executar `npm ci` e `npm run dev`; conferir os fluxos e reset conforme README. Para repetir os checks com relatório, `npm run verify`; para navegador, `npm run test:e2e:demo`.
2. Para fechar M5, usar uma máquina com espaço para as imagens, confirmar `gralia-local` descartável e seguir `supabase/README.md`/`TESTES_SUPABASE_E2E.md`. Executar `node supabase/tests/http.mjs` sobre fixture limpa e `npm run test:e2e:supabase` em rodada independente, com chaves somente no executor adequado. Não resetar produção nem adicionar `--remote`.
3. Executar o roteiro manual de acessibilidade em `VALIDACAO.md`, registrando observado e versões de NVDA/TalkBack/navegador. Android/Capacitor e publicação têm validações posteriores próprias.

## Inspeção e preservação

Pacote, AGENTS, especificação, migração, regras, casos, fixture e diagramas foram lidos. ZIP legado extraído com validação de caminhos/symlinks em diretório separado; nenhum instalador legado foi executado. Os dez anexos históricos reenviados coincidiram por hash com o inventário v4. Não havia checkout Git executável ou aplicativo Gralia novo; nenhum formulário de pesquisa/Apps Script foi modificado. CSV pessoal não foi lido/importado; resultados Nexus não foram herdados.
