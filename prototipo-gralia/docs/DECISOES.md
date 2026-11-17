# Decisões da implementação

Registro iniciado em 15/11/2026, America/Sao_Paulo. A especificação v4 e o contrato de fixture 1.0 são a referência funcional; regras de notas, frequência, reservas e papéis são convenções do protótipo, sem alegação de regulamento oficial do CEDUP.

| ID | Decisão | Motivo e consequência |
|---|---|---|
| D01 | Criar aplicação separada em `app/`, com scripts npm na raiz | O pacote não continha aplicativo novo; preservar originais e evitar inicializar o servidor legado |
| D02 | Compartilhar domínio e telas entre repositórios demo e Supabase | Contratos iguais evitam comportamentos divergentes e condições de modo em cada formulário |
| D03 | Resolver implementação do repositório no build por modo explícito | Build integrada não deve importar fixtures, seleção de perfil, reset ou ganchos de teste; erro remoto não habilita demo |
| D04 | Demo é simulação de conta, identificada permanentemente | Não confundir seleção fictícia com autenticação segura; Supabase usa Auth real e papel protegido em `profiles` |
| D05 | Persistir antes de alterar estado exibido e emitir sucesso | Quota, armazenamento bloqueado e rede falha devem preservar dados de entrada e produzir erro real |
| D06 | Cadastro acadêmico não provisiona Auth nem define papel no cliente | Aluno/docente pode existir sem conta; vinculação e papel são operações administrativas fora da aplicação comum |
| D07 | Matrícula referencia oferta e aceita lote atômico | Oferta identifica disciplina + turma + período; lista vazia e IDs repetidos são rejeitados; cancelado é reativado sem nova linha |
| D08 | Nota usa escala 0–10 e duas casas; ausente permanece pendente | Preservar zero e decimais; média ponderada considera só notas lançadas e é parcial se houver pendência |
| D09 | Frequência por aula/matrícula, P ou F; ausência de registro não é presença | Percentual usa apenas lançamentos e é parcial com pendências; sem denominador, mostrar sem cálculo |
| D10 | Armazenar reservas em UTC e apresentar America/Sao_Paulo | Validação usa instante futuro, mesma data local e intervalo semiaberto; banco deve impedir sobreposição atomicamente |
| D11 | Aluno consulta disponibilidade redigida de reservas | Disponibilidade não pode revelar motivo ou identidade de terceiros; admin técnico não recebe acesso pedagógico global |
| D12 | Usar marca textual Gral.ia e fontes do sistema | Não inventar logo final nem depender de rastreamento/CDNs para renderizar; paleta fornecida e referências serranas discretas |
| D13 | Meta WCAG 2.2 AA/eMAG 3.1 com verificação por critérios | Axe e verificações de teclado/reflow não equivalem a conformidade integral; leitor de tela manual permanece separado |
| D14 | Usar Node 24 LTS e versões exatas no npm/lockfile | Manter instalação reproduzível no Windows/VS Code e CI Linux; nenhuma instalação com `latest` no projeto entregue |
| D15 | Não executar serviços remotos ou publicar nesta tarefa | Banco de testes apenas em ambiente descartável identificado; ausência de credenciais não impede demo |
| D16 | Evidências novas e status por ambiente | Resultado demo não aprova Auth/RLS/concorrência; resultados históricos não são herdados |

Mudanças posteriores de comportamento devem atualizar esta tabela, o contrato correspondente e os testes. As limitações efetivas e os comandos executados estão em `STATUS_IMPLEMENTACAO.md` e `VALIDACAO.md`.

D17 — TypeScript foi fixado em **6.0.3**, versão estável compatível com o intervalo de peer dependency de `typescript-eslint` 8.72.2 (`<6.1`). A tentativa inicial de instalar TypeScript 7.0.2 revelou o conflito; não foi usado `--force` ou `--legacy-peer-deps`. O lockfile final registra a resolução efetiva.

D18 — Quando usado pelo executor, PostgreSQL efêmero com bootstrap mínimo de `auth.users`/`auth.uid()` permite testar SQL, constraints, RLS com papéis/JWT e concorrência reais no banco. Esse escopo deve ser registrado como **PostgreSQL local**, sem alegar validação do Supabase Auth/GoTrue ou da API REST. Auth/API exigem ensaio integrado separado. O bootstrap é ferramenta de teste, não implementação de autenticação da aplicação.

D19 — Cypress foi fixado em **15.21.2** porque `cypress-axe` 1.7.0 declara suporte de peer dependency até Cypress 15. A tentativa com Cypress 16.3.0 foi rejeitada pelo npm; não foi usada instalação forçada. A suíte solicitada permanece Cypress.

D20 — Cypress integrado usa configuração separada e tarefas Node de preparação. Aceita apenas loopback e confirmação `GRALIA_DISPOSABLE_LOCAL=LOCAL_DISPOSABLE_ONLY`; restaura as 15 tabelas locais antes de cada caso e provisiona identidades via Auth. A chave administrativa permanece fora do navegador e só prepara o teste. Operações e asserções usam sessões próprias. Este código foi verificado estaticamente, mas a execução Auth/API permanece bloqueada pela stack indisponível.

D21 — O foco após navegação passou do callback `requestAnimationFrame` no evento de hash para `useLayoutEffect` após o commit da página/perfil. O destino já está montado quando recebe foco e não fica um callback tardio competindo com a próxima interação. Essa é uma mudança real da aplicação; não implica que toda falha observada pelo driver de teclado tenha a mesma causa. Os ensaios Cypress também tiveram ajustes de driver e sincronização; eventos automatizados e foco do ambiente gráfico não substituem verificação manual com teclado/leitor de tela. Os logs consultados não confirmaram HMR como causa das falhas anteriores.
