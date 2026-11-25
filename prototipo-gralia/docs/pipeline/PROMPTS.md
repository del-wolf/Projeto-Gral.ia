# Prompts de trabalho

Copiar o bloco pertinente no produto correspondente e preencher os caminhos/identificadores. São instruções de conversa, sem dependência de integração automática entre Codex e Antigravity.

## Primeiro contato com a base — leitura guiada

~~~text
Vamos trabalhar no Gralia em pareamento guiado. Sou Igor e quero entender e implementar parte do código. Leia AGENTS.md, o guia docs/pipeline/README.md, o estado da implementação e a tarefa indicada abaixo.

Tarefa: <caminho>.
Comece conferindo branch, commit e alterações locais. Respeite a pendência de preparação registrada no README antes de executar scripts. Não reinicialize o aplicativo.

Mapeie um fluxo existente de nota: tela, domínio, adaptador demo, adaptador Supabase e proteção no banco. Explique o papel de cada camada com os caminhos reais. Distinga o que foi lido, o que já tinha evidência e o que foi executado agora.

Proponha uma parte pequena para eu implementar e registre o trecho reservado no cartão. Aplique a sua parte autorizada em mudanças pequenas, com decisões explicadas. Não edite o trecho em que eu estiver trabalhando. Para minhas dúvidas nesse trecho, ofereça pistas antes da solução completa.
~~~

## Codex — backend e banco com aprendizado

~~~text
Você responde pelo backend/banco do Gralia nesta tarefa. Leia AGENTS.md, docs/pipeline/README.md, <tarefa>, <contrato> e <passagem anterior>.

Confirme branch, commit, modo demo/Supabase e arquivos atribuídos. Preserve o trecho reservado a Igor e os arquivos do Antigravity.

Use o domínio e os adaptadores existentes. Explique a decisão de projeto antes de cada pequeno conjunto de alterações e mostre o caminho do dado. Implemente apenas a lacuna da tarefa: tipos, regras, adaptador, migração, grants/RLS, RPC ou testes conforme necessário. Não adicionar API própria sem uma necessidade demonstrada.

Teste acesso permitido e indevido com identidades adequadas. Migrações e fixtures usam o ambiente descartável identificado, com um único responsável por banco. Não colocar segredos em VITE_, logs ou código.

Finalize com diff resumido, comandos realmente executados, resultados, limitações e uma passagem versionada para o frontend. Demo e SQL isolado não aprovam Auth/API Supabase.
~~~

## Antigravity — frontend com aprendizado

~~~text
Você responde pelo frontend do Gralia nesta tarefa. Leia AGENTS.md, GEMINI.md, docs/pipeline/README.md, <tarefa>, <contrato> e <passagem do backend>.

Confirme branch, commit e arquivos atribuídos. Use os tipos e adaptadores existentes. Preserve o trecho reservado a Igor. Proponha atualização do contrato na passagem se encontrar uma lacuna; não altere silenciosamente a definição do backend.

Explique os componentes e o fluxo do evento até a chamada de dados. Implemente a interface da tarefa, incluindo carregamento, vazio, erro e confirmação após persistência. Respeite identidade, temas, teclado, foco e acessibilidade do projeto. Falha do Supabase nunca ativa demo.

Não gravar SQL/migrações nem alterar credenciais como efeito colateral da tarefa de UI. Execute os checks pertinentes no ambiente preparado e registre resultados reais. Deixe um exercício curto para Igor e uma passagem com branch, commit, arquivos, limites e próxima ação.
~~~

## Revisor — sessão separada

~~~text
Revise <diff/PR> do Gralia a partir de <commit base> e <commit final>. Leia AGENTS.md, a tarefa e o contrato. Comece em modo de leitura: sua entrega inicial são os achados.

Procure defeitos de comportamento, perda de dados, autorização por vínculo, incompatibilidade de contrato, tratamento de erro e regressões de acessibilidade. Explique o cenário que reproduz cada achado e cite o arquivo/trecho. Diferencie defeito confirmado de hipótese ainda sem execução.

Não reescreva o código por preferência de estilo. Se não houver achados, diga isso e registre as lacunas de validação. Não declare aprovação de Auth/API pelo sucesso da demo.

Confira também se o trecho de Igor foi preservado e se o registro de aprendizado corresponde a uma prática observável.
~~~

## Pedido de ajuda no meu trecho

~~~text
Estou implementando <trecho> da tarefa <ID>. Minha tentativa está em <arquivo/diff> e o comportamento observado é <resultado>.

Explique o conceito necessário e dê uma pista concreta para eu testar. Depois revise a minha tentativa. Mostre a solução completa somente se eu pedir. Se eu pedir explicação detalhada, foque neste trecho e no efeito observável, sem transformar o restante da tarefa em uma aula longa.
~~~
