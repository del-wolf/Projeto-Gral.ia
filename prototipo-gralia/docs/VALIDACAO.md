# Validação reproduzível

Este arquivo descreve o método. Resultados observados, ambiente, hashes, logs, JSON/JUnit e screenshots pertencem a `docs/evidencias/<id-da-execucao>/`. Um passo descrito neste roteiro não equivale a um teste executado. O estado consolidado está em `STATUS_IMPLEMENTACAO.md`.

## Verificações locais

Na raiz, com Node 24 LTS e dependências do lockfile:

```powershell
npm ci
npm run typecheck
npm run lint
npm run test:unit
npm run build:demo
npm run build:supabase
npm run test:e2e:demo
```

A suíte Cypress demo abre um navegador real e inicia, aguarda e encerra seu próprio Vite na porta 4173. Não é E2E Supabase. Vitest verifica regras, repositório demo e adaptador Supabase com SDK simulado; não é teste de navegador nem prova de RLS.

Cada caso deve iniciar com a mesma fixture 1.0 restaurada independentemente. O relógio automatizado da demo é `2026-11-16T12:00:00Z`, apenas quando controlado pelo teste; a demo interativa usa o instante corrente. Reservas relativas são D+2 no fuso America/Sao_Paulo. Ganchos de teste pertencem somente à demo.

## Casos acadêmicos prioritários

Os 14 campos e os passos normativos estão em `CASOS_DE_TESTE_GRALIA.md`. A intenção original deve ser mantida. Estes são pontos de inspeção dos resultados, sem preenchimento antecipado de “obtido”:

| Caso | Comportamento a observar | Evidência necessária |
|---|---|---|
| CT-GR-001 | ADMIN-QA localiza QA2026001, seleciona OF-TEST-3A e registra um único vínculo ativo; confirmação acessível só após persistência; busca e seleção limpas; recarga mantém vínculo | Screenshot real antes/depois conforme suíte; contagem independente do repositório; log e relatório de navegador; no integrado, consulta ao banco real |
| CT-GR-002 UI | Fixture reiniciada; aluno localizado; nenhuma oferta selecionada; botão desabilitado e instrução clara; zero chamada de criação originada da tela e zero nova matrícula | Screenshot real do botão/instrução; spy/contador da operação e comparação antes/depois; não atribuir erro de serviço ao botão desabilitado |
| CT-GR-002 domínio | Chamada direta ao serviço com lista vazia rejeita antes de persistir | Teste Vitest independente, erro e confirmação de zero escrita |
| CT-GR-002 Supabase | Chamada RPC autenticada com lista vazia rejeita e banco permanece igual | Relatório próprio do ambiente integrado; não inferir resultado da demo |

Não copiar resultados do Nexus, capturas antigas ou o modelo de execução vazio. Uma captura sem consulta persistente não prova o caso completo.

## Riscos adicionais e separação de ambientes

| Grupo | Cobertura local útil | Prova adicional exigida no backend |
|---|---|---|
| Matrículas | Repetição, aluno inativo, aluno não encontrado, seleção obsoleta, lote inválido sem alteração, falha de storage, reset isolado | Atomicidade RPC, unicidade/reactivação, concorrência e recusa autenticada de papel indevido |
| Notas | Zero distinto de pendência; decimal preservado; escala/duas casas; peso positivo; média parcial/completa | RLS docente atribuído e aluno próprio, FK composta de oferta, matrícula ativa e integridade dos valores |
| Frequência | P/F/pendente, sem duplicidade, sem denominador inventado | RLS e integridade aula/matrícula/oferta |
| Materiais | HTTP/HTTPS, recusa de `javascript:`, texto sem HTML executável | Permissão por oferta e protocolo válido também no banco |
| Reservas | UTC/SP, início futuro, data local única, sala ativa, adjacência e cancelamento | Exclusão GiST transacional; duas conexões paralelas e no máximo um sucesso; cancelamento próprio/admin e dados redigidos para aluno |
| Sessão e erro | Logout, troca de perfil sem cache, formulário preservado em erro | Auth real inválido/expirado, erro de rede sem fallback, papel não alterável por cliente |
| Builds | Compilar ambos os modos e examinar bundle integrado | Build integrada sem fixtures/reset/entrada fictícia/hooks/Manus/segredos |

Testes do adaptador demo só demonstram a política local proposta. Segurança depende das políticas e operações de banco, com sessões autenticadas próprias de ALUNO-A, ALUNO-B, PROF-A, PROF-B e ADMIN-QA. Uma chave que ignora RLS não valida isolamento.

## Banco e integração

```powershell
npm run test:db
npm run test:e2e:supabase
```

Leia primeiro os requisitos e a preparação em `supabase/`. Execute testes de banco somente contra destino descartável identificado. Não inferir que um banco é seguro para reset por seu nome. O projeto não deve executar reset de produção nem publicar serviços.

Sem Docker/CLI/credenciais/contas, registre **BLOQUEADO** com a causa e comando; não substitua pelo resultado de mock. Migração SQL executada em PostgreSQL local pode verificar integridade/RLS, mas não comprova Supabase Auth e Data API reais. Concorrência precisa de duas solicitações paralelas ao banco, respostas e contagem verificadas; cliques sequenciais e localStorage não são essa prova.

O ensaio HTTP opcional `node supabase/tests/http.mjs` usa chave pública e tokens próprios das cinco contas em loopback preparado, sem reset; exige `GRALIA_TEST_SUPABASE_URL`, `GRALIA_TEST_PUBLISHABLE_KEY` e `GRALIA_TEST_PASSWORD` no executor. Deve usar fixture independente limpa; seu relatório não substitui o fluxo de navegador.

O Cypress integrado usa configuração própria e tarefas Node que recusam URLs fora de loopback. Após `GRALIA_DISPOSABLE_LOCAL=LOCAL_DISPOSABLE_ONLY`, restaura as 15 tabelas da aplicação e provisiona as cinco contas sintéticas antes de cada caso. A chave administrativa é exclusiva da preparação Node; UI e consultas independentes usam tokens próprios. Veja `TESTES_SUPABASE_E2E.md` para as cinco variáveis e o efeito de descarte local. Sem a stack completa, seu status permanece BLOQUEADO.

O teste integrado exige contas Auth provisionadas administrativamente e mapa dos UUIDs reais; os UUIDs da fixture são lógicos. A ferramenta administrativa prepara dados; quem executa a ação protegida deve usar seu próprio token. Não registrar senhas, chaves ou tokens nas evidências.

## Roteiro manual de acessibilidade

Meta WCAG 2.2 AA/eMAG 3.1, sem declaração de conformidade integral. Antes da execução manual, todos os itens abaixo permanecem **NÃO EXECUTADOS**. Registre navegador, SO, leitor de tela, tema, página, critério verificado, observação e evidência. Axe cobre somente parte das verificações.

1. **Teclado e navegação:** com mouse afastado, usar Tab, Shift+Tab, Enter e Espaço na entrada, menu, matrícula, lançamento de nota, frequência e reserva. Verificar skip link, ordem coerente, foco visível e ausência de controles inacessíveis.
2. **Diálogo de reset:** abrir pelo teclado, verificar foco inicial e nome anunciado; Tab/Shift+Tab devem permanecer no modal; Escape cancela; fechar devolve foco ao acionador; cancelar mantém os dados; confirmar restaura somente chaves Gralia.
3. **Erros e status:** produzir erro de validação e falha de gravação controlada; verificar rótulo e associação da mensagem ao campo, anúncio por região viva, formulário preservado e ausência de sucesso falso. Não depender somente de cor ou toast efêmero.
4. **Leitor de tela:** em Windows, NVDA com Firefox/Chrome; se disponível, TalkBack em Android para navegação web. Conferir hierarquia de títulos, nomes de controles, estado do botão desabilitado, instrução de seleção vazia, sucesso/erro e tabela/lista de notas. Android web não equivale a APK testado.
5. **320 CSS px e reflow:** percorrer páginas principais sem perder texto ou controles; verificar tabelas com rolagem localizada ou alternativa legível e menu móvel operável. Medição de largura por teste automatizado não substitui toda a inspeção visual.
6. **Zoom 200%:** ampliar pelo navegador real em desktop, repetir fluxos e diálogos e verificar leitura/ações. Reduzir viewport não é prova equivalente de zoom manual.
7. **Temas e contraste:** conferir claro e escuro, estados normal/foco/erro/desabilitado, texto secundário e links. Medir combinações realmente usadas; critério comum de texto é 4,5:1 e texto grande 3:1, elementos e foco conforme critério aplicável.
8. **Movimento reduzido:** ativar preferência do sistema/emulação de `prefers-reduced-motion` e verificar que movimento não é necessário à operação e transições são reduzidas.
9. **Axe:** executar auditoria nos dois temas e páginas de entrada, matrícula, boletim, diário e reserva. Guardar violações reais, correções e nova execução pertinente. Zero violações axe não comprova leitor de tela, ordem ideal, usabilidade ou conformidade integral.

## Estados dos resultados

- **APROVADO:** observação real satisfaz o esperado no escopo e ambiente registrados.
- **REPROVADO:** falha observada; incluir defeito, evidência e severidade contextual.
- **BLOQUEADO:** pré-condição ou infraestrutura impede executar; incluir causa e reprodução.
- **NÃO EXECUTADO:** não houve execução; não preencher observado com o esperado.

A CI executa verificações web e Cypress demo; um job separado roda o PostgreSQL descartável de `test:db`. Ambos armazenam artefatos. Sua existência não implica que um workflow remoto foi executado nesta sessão; nenhum push/publicação é necessário para a demo local.
