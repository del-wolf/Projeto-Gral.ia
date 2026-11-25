# Pipeline de desenvolvimento e aprendizado do Gral.ia

## Objetivo e situação

Igor desenvolve e aprende com apoio de dois agentes: Antigravity na interface e Codex no backend e no banco. O trabalho começa localmente, no mesmo computador, pelo VS Code/terminal e pelo Antigravity. Igor escolhe prioridades, implementa parte das tarefas, verifica o comportamento e decide a integração.

Este documento propõe o processo. Não comprova instalação local, execução de testes, comunicação automática entre produtos ou publicação. A coordenação inicial acontece por Git, contratos e passagens de tarefa versionadas.

## Base real do projeto

A referência inspecionada é a branch codex/gralia-fontes-v0.1.0, commit e589d0c86931ac8a0b17a9fdc8d6caeacfa15e41, pasta prototipo-gralia. A main contém o coletor da pesquisa; não é a base atual da aplicação acadêmica.

O código existente já contém React/TypeScript/Vite, domínio, adaptadores demo/Supabase, migrações e testes. A proposta é continuar essa implementação. O estado observado em rodadas anteriores está em [STATUS_IMPLEMENTACAO](../STATUS_IMPLEMENTACAO.md); não foi reexecutado nesta proposta.

O [README da aplicação](../../README.md) e a [revisão do download](../REVISAO_DOWNLOAD.md) registram uma pendência de identificação do alerta de antivírus do pacote anterior. A tarefa P0 deve resolver essa pendência antes de executar dependências, scripts ou builds. A inspeção e a preparação documental podem continuar.

Escopo obrigatório: professor, aluno e reserva de salas/laboratórios, com cadastros e vínculos mínimos de apoio. Secretaria e biblioteca ficam fora deste ciclo. Capacitor/Android e publicação avançam depois do núcleo web validado. As regras acadêmicas do protótipo não são regulamento institucional.

## Quem faz o quê

| Responsável | Implementação principal | Entrega esperada |
| --- | --- | --- |
| Igor | Requisitos, uma parte prática de cada tarefa, depuração acompanhada e integração | Explicar o fluxo, demonstrar a alteração e registrar o que aprendeu |
| Antigravity | Componentes, navegação, formulários, estados de interface, temas e acessibilidade | Interface ligada ao contrato, com carregamento, vazio, erro e sucesso coerentes |
| Codex | Domínio, adaptador Supabase, Auth, SQL, migrações, grants/RLS e operações transacionais | Dados persistidos, acesso por vínculo e testes das permissões e regras |
| Revisor em uma sessão separada de um dos agentes | Examinar o diff da tarefa do outro agente | Achados reproduzíveis, gravidade e lacunas de cobertura |

A divisão organiza responsabilidade; ambos os agentes podem explicar qualquer camada. Não há necessidade de criar um terceiro produto para revisão. A sessão revisora lê o contrato e o diff antes de sugerir mudanças; revisão de IA complementa a verificação de Igor.

O backend atual é formado por Supabase Auth, PostgreSQL, políticas e funções SQL/RPC. Node é ferramenta de desenvolvimento. Não adicionar uma API Express apenas para separar os agentes. Edge Function exige uma necessidade concreta de execução privilegiada que não possa ficar no navegador.

## Fluxo inicial: uma funcionalidade por vez

1. **Escolher um comportamento.** Exemplo: professor autorizado altera uma nota; o aluno certo vê o valor após recarga.
2. **Ler o caminho existente.** Localizar tela, contrato, regra de domínio, adaptador e SQL relacionados. Registrar o que já funciona e a lacuna real.
3. **Combinar o contrato.** Definir entradas, saídas, acesso, erros e efeitos persistentes. Codex mantém o contrato tipado; Antigravity confere se ele atende a tela; Igor explica o caso.
4. **Dividir a tarefa.** Nomear os arquivos de cada agente e um trecho reservado a Igor. Mudança em arquivo compartilhado tem um responsável por vez.
5. **Implementar em turnos.** Cada responsável faz uma alteração pequena e entrega um commit com resumo. No primeiro ciclo, usar a mesma branch da funcionalidade e interromper a edição do agente anterior antes de passar ao próximo.
6. **Integrar e revisar.** Conferir o fluxo completo, o tratamento de erros e os acessos indevidos. O revisor procura falhas em uma sessão própria.
7. **Validar e aprender.** Executar os checks pertinentes e a demonstração manual. Igor modifica ou explica seu trecho sem depender da resposta pronta. Registrar resultado real e abrir a PR.

Planejamento, desenvolvimento e aprendizagem fazem parte da mesma tarefa. Uma entrega visual sem persistência e uma tabela sem fluxo utilizável representam etapas intermediárias.

## Contrato antes de paralelizar

O contrato é o acordo que permite desenvolver a tela e os dados separadamente. Ele descreve os tipos existentes ou propostos, quem pode fazer a operação, códigos de erro e quando há confirmação de gravação.

| Questão | Exemplo do Gralia |
| --- | --- |
| Entrada | Identificadores de matrícula/avaliação/oferta e nota decimal |
| Identidade | Usuário autenticado obtido da sessão confiável; papel enviado pela tela não concede acesso |
| Permissão | Professor precisa estar vinculado à oferta; aluno lê apenas os dados permitidos |
| Retorno | Valor efetivamente persistido, incluindo zero |
| Erros | Validação, falta de permissão, recurso ausente ou falha de armazenamento |
| Interface | Não mostrar sucesso antes da confirmação; preservar formulário quando falhar |
| Teste | Docente correto grava; docente alheio é rejeitado; outro aluno não recebe a nota |

Usar [CONTRATO_MODELO](CONTRATO_MODELO.md). Conferir app/src/domain/types.ts e os adaptadores antes de inventar nomes. A documentação aponta para o contrato executável; não manter duas definições divergentes.

## Organização dos arquivos e das instruções

| Caminho relativo a prototipo-gralia | Responsabilidade |
| --- | --- |
| app/src/App.tsx, app/src/components/, app/src/styles.css | Antigravity, com divisão explícita do arquivo se necessário |
| app/src/domain/ | Codex no contrato/regra; Igor pode assumir um exercício identificado |
| app/src/data/ | Codex nos adaptadores e integração; mudanças de consumo combinadas com o frontend |
| supabase/ | Codex nas migrações, permissões, funções e testes |
| cypress/ | Responsável pelo fluxo, com revisão da outra camada |
| fixtures/ | Alteração coordenada com contrato, testes e versão dos dados |
| package.json, package-lock.json, configurações e contratos públicos | Um autor por tarefa; os demais registram a necessidade |
| docs/pipeline/ | Tarefas, passagens, prompts e aprendizado |
| AGENTS.md | Regras comuns e duráveis do projeto |
| GEMINI.md | Orientação curta do Antigravity que remete às regras comuns |

AGENTS.md é reconhecido pelo Codex e pela documentação atual do Antigravity. Ao adotar o processo, combinar as regras do [modelo de instruções](INSTRUCOES_PARA_AGENTES.md) com o AGENTS.md existente e criar a ponte GEMINI.md para o frontend. Esta proposta mantém as configurações atuais e entrega esses trechos como modelos. Abra a pasta prototipo-gralia como workspace nos dois produtos e peça a cada agente que identifique as instruções carregadas. Arquivos de tarefa e passagem precisam ser lidos conforme o prompt: não se presume carregamento automático.

## Git e trabalho local

A proposta mantém um repositório. Enquanto main concentra o formulário, a etapa P0 consolida uma branch de integração chamada **gralia**, a partir da fonte examinada e das decisões aceitas. Esse nome é proposto; esta documentação não cria essa branch automaticamente.

No início, criar feat/<assunto> a partir da integração, trabalhar em turnos e abrir uma PR para gralia. Não é necessário manter uma develop adicional. Uma PR reúne um comportamento revisável, com commits pequenos.

Quando houver segurança no fluxo, usar um checkout para Igor e dois worktrees para edição paralela. Worktrees são pastas separadas do mesmo repositório, cada uma com sua branch. Trocar a branch de uma pasta compartilhada não isola dois editores.

Exemplo PowerShell, **somente depois** de a base gralia existir no remoto, o contrato estar integrado e o checkout estar limpo; executar na raiz Git:

~~~powershell
git fetch origin
git worktree add -b feat/notas-back ../Gralia-Back origin/gralia
git worktree add -b feat/notas-front ../Gralia-Front origin/gralia
git switch -c feat/notas-igor origin/gralia
git worktree list
~~~

Abrir ../Gralia-Back/prototipo-gralia no VS Code/Codex; abrir ../Gralia-Front/prototipo-gralia no Antigravity; Igor usa prototipo-gralia no checkout principal. Cada branch tem um único dono de edição. Não reaproveitar esses comandos se nomes/pastas já existirem; inspecionar o estado e escolher o próximo nome.

Dependências e arquivos ignorados, como .env.local, são locais de cada worktree; não são sincronizados por commit. Evitar misturar ferramentas Windows e WSL no mesmo node_modules. Se houver dois servidores de desenvolvimento, atribuir portas distintas. Os E2E atuais usam 4173: executar essas suítes em turnos.

**O isolamento de arquivos não isola o banco.** Um único responsável aplica migrações e prepara a fixture do banco compartilhado. Resets e suítes que alteram a fixture não podem disputar a mesma instância; reservar a execução ou usar instâncias descartáveis independentes. Ao atualizar o contrato ou a base, parar a integração, sincronizar branches e repetir os checks afetados.

O frontend pode avançar com o adaptador demo existente conforme o contrato. Isso não aprova Auth nem permissões do Supabase. Após a PR do backend, o frontend integra a base atualizada e testa a operação real antes de encerrar a funcionalidade. Igor decide a integração final. Não fazer merge automático.

## Comunicação entre os agentes

GitHub é o registro durável. Não é preciso desenvolver um orquestrador, conectar modelos por API ou compartilhar todo o histórico das conversas.

A cada passagem, preencher [PASSAGEM_MODELO](PASSAGEM_MODELO.md): tarefa, branch, commit, contrato, arquivos alterados, testes observados, limitações e próxima ação. O próximo agente recebe o caminho dessa passagem, confirma a revisão do commit e trabalha na sua parte.

No modo sequencial, o commit e a passagem delimitam o turno. No modo paralelo, mudanças de contrato primeiro entram na integração; os agentes atualizam sua base. Mudanças em diretórios diferentes também podem ser incompatíveis, portanto o contrato continua sendo necessário.

## Aprendizado integrado ao desenvolvimento

Padrão: **pareamento guiado**. O agente explica a intenção e os arquivos em poucas linhas, executa sua parte e deixa um exercício pequeno nomeado no cartão. Durante o trecho reservado, oferece pistas; fornece solução completa se Igor pedir.

| Etapa de aprendizado | Prática de Igor | Apoio do agente |
| --- | --- | --- |
| Observar | Seguir dado do formulário até o banco | Mostrar caminho e explicar as decisões de projeto |
| Completar | Implementar um estado de erro, validação ou teste delimitado | Dar pistas e revisar a tentativa |
| Implementar | Fazer um pequeno fluxo a partir do contrato | Revisar diff e ajudar na depuração |
| Explicar | Mostrar efeito de uma mudança e seus limites | Fazer perguntas sobre comportamento verificável |

Meta prática por tarefa: Igor consegue dizer o que entrou, onde foi validado, onde foi salvo, quem pode acessar e o que ocorre na falha. Copiar e comentar cada linha não substitui isso.

Sugestão ajustável: sessões de 25–45 minutos, com um comportamento por sessão. Usar [DIARIO_APRENDIZADO](DIARIO_APRENDIZADO.md). Em uma correção urgente Igor pode escolher modo produção assistida, com execução maior pelos agentes e revisão explicada depois; o modo deve ficar registrado.

## Qualidade e testes existentes

Os scripts abaixo existem no package.json inspecionado. São referência para a etapa executável posterior ao P0; nenhum foi rodado por esta proposta.

| Alteração | Verificação pertinente |
| --- | --- |
| Código TypeScript/interface/domínio | npm run typecheck; npm run lint; npm run test:unit |
| Fluxo de tela/demo | npm run test:e2e:demo e teste manual do caso |
| Banco, permissões ou concorrência | npm run test:db e, para validar o serviço, Auth/API e E2E Supabase reais |
| Alteração de integração | npm run build:supabase; node supabase/tests/http.mjs; npm run test:e2e:supabase conforme os pré-requisitos |
| Integração de código pronta para revisão | npm run verify, mais suítes relevantes que o script não inclua |
| Apenas texto/documentação | Revisar conteúdo, referências e diff; sem repetir suíte de aplicação sem motivo |

verify executa os checks e builds descritos no README; não equivale a todas as suítes de navegador e banco. Evitar duplicar os mesmos checks sem mudança nova. Os runners Supabase atuais exigem ambiente local descartável; não apontar para um serviço remoto para contornar a guarda. Se a máquina não comportar a stack, registrar bloqueio e preparar um executor adequado em outra tarefa.

RLS significa controlar no PostgreSQL quais linhas cada sessão pode ler ou alterar. Esconder um botão é apenas apresentação. Testes de autorização devem incluir acesso permitido e indevido com sessões dos próprios usuários. Credencial administrativa pode preparar fixture no executor autorizado, mas não comprova RLS.

Migrações entram no Git e são aplicadas no ambiente de desenvolvimento/teste identificado. Depois de uma migração compartilhada, mudanças posteriores entram em nova migração; não editar silenciosamente o histórico aplicado. Promoção de banco/deploy tem etapa própria. Segredos ficam fora do código, logs e variáveis VITE_; o navegador recebe somente configuração pública apropriada.

Testes automatizados de acessibilidade são complementados por teclado, foco e leitor de tela. Manter as metas WCAG/eMAG e minimização de dados do projeto, com dados sintéticos. Não declarar conformidade integral por um build ou auditoria automática.

## CI: correção de localização antes de ativar

Foi encontrado prototipo-gralia/.github/workflows/verify.yml. No repositório atual ele fica dentro de uma subpasta. GitHub Actions descobre workflows em **.github/workflows na raiz do repositório**.

A tarefa de CI deve levar e adaptar esse workflow para a raiz: working-directory de comandos, cache-dependency-path do lockfile, caminhos dos artefatos, gatilhos e filtros do app. Evitar executar o mesmo workflow em duas localizações após a promoção. A proposta atual documenta essa correção; não ativa o workflow.

As suítes web/demo e PostgreSQL existentes são um começo. Auth/API Supabase precisam de job/ambiente próprios, preparados e verificados. Configurar checks obrigatórios só depois de uma execução real bem-sucedida e de confirmar os recursos disponíveis na conta GitHub. CI valida o código; publicação exige uma decisão explícita de Igor.

## Quando uma tarefa está pronta

- O comportamento do contrato funciona no modo declarado e a persistência foi conferida.
- Erros, vazio, carregamento e permissões pertinentes têm evidência.
- Checks relevantes passaram no commit indicado; bloqueios estão visíveis.
- O diff foi revisado e os contratos/documentos afetados foram atualizados.
- A parte prática de Igor está implementada ou a mudança de modo está registrada.
- Igor explica o fluxo e o demonstra; a PR identifica o que ainda não foi validado.

Usar [PR_MODELO](PR_MODELO.md). Estados: a fazer, em implementação, em prática de Igor, em revisão, bloqueado ou concluído no escopo declarado. Código escrito, demo validada e integração validada são marcos distintos.

## Ordem de adoção

Seguir [BACKLOG_INICIAL](BACKLOG_INICIAL.md): P0 prepara base e ambiente; P1 mapeia o código; P2 fecha Auth/API e isolamento; P3 faz o ciclo guiado de notas; P4 frequência; P5 reservas e concorrência; P6 estabiliza acessibilidade e CI. Essas etapas verificam e completam a base existente conforme lacunas observadas.

## Referências

- [Instruções AGENTS.md do Codex](https://developers.openai.com/codex/guides/agents-md/).
- [Codex no editor](https://developers.openai.com/codex/ide/).
- [Regras do Antigravity](https://antigravity.google/docs/rules/).
- [git worktree](https://git-scm.com/docs/git-worktree).
- [Sintaxe e localização dos workflows GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).
- [RLS no Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

O processo, a divisão de papéis e a sequência de aprendizado são propostas específicas para o Gralia, não exigências desses produtos.
