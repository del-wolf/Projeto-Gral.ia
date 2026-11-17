# Gralia Especificação do protótipo testável

Versão documental 4.0 • 15 de novembro de 2026 • Projeto Integrador do CEDUP Renato Ramos da Silva • Igor Felipe Wolff

## 1 Objetivo e situação desta entrega

Esta especificação substitui o Nexus como referência de desenvolvimento do protótipo Gral.ia. Consolida a stack aprovada, reduz os módulos ao escopo atual e define comportamentos observáveis para os casos de teste da disciplina Qualidade e Teste de Software. O objetivo imediato é permitir que o Codex produza uma aplicação executável no computador do aluno e registre evidências reproduzíveis.

O pacote entregue nesta etapa contém documentação atualizada, fontes legadas para consulta, dados fictícios, casos de teste e o prompt de implementação. **Ainda não contém o novo aplicativo Gralia implementado.** Nenhum resultado de teste do Gralia foi atribuído nesta revisão. Os resultados históricos do Nexus permanecem vinculados às versões e aos ambientes em que foram obtidos.

O produto é uma plataforma acadêmica complementar, inicialmente pensada para o CEDUP. Não substitui registros oficiais, não emite documentos escolares e não presume integração autorizada com Estudante Online ou SISGESC. O primeiro recorte é uma instituição; suporte a múltiplas instituições fica fora desta implementação.

## 2 Fontes e precedência das decisões

Foram considerados os 11 anexos desta conversa, o diagnóstico de 09/11/2026, a versão atual do trabalho de testes editada em 14/11/2026 e as diretrizes disponíveis no Google Drive. O dossiê com o nome Gralia ainda reproduz a stack antiga: o nome do arquivo não o torna mais atual tecnicamente. A lista completa e os hashes estão no inventário do pacote.

| Ordem | Fonte | Aplicação nesta revisão |
|---|---|---|
| 1 | Solicitação atual de 15/11/2026 | Atualizar material e preparar implementação de protótipo para casos de teste |
| 2 | Decisões consolidadas no diagnóstico de 09/11 | React e TypeScript, Supabase, PostgreSQL, Cypress, reservas obrigatórias, identidade Gral.ia |
| 3 | Trabalho de testes atualizado em 14/11 | Preservar a intenção dos dois cenários de matrícula e renovar sua execução |
| 4 | Diretrizes de 22/10 | Foco aluno e professor; secretaria excluída; biblioteca adicional; referências serranas |
| 5 | Código e documentos Nexus | Referências históricas de fluxo e componentes, sujeitos a revisão |

Decisões institucionais ainda ausentes são tratadas como **convenções propostas para o protótipo**, identificadas na seção 7. Elas permitem implementar agora, mas não devem ser apresentadas como regulamento do CEDUP. O documento de diagnóstico não prova o estado atual de um serviço remoto: GitHub, Manus, Supabase, Figma e deploy não foram auditados ao vivo nesta etapa.

## 3 O que foi encontrado no legado

| Artefato | Evidência observada | Uso recomendado |
|---|---|---|
| nexus-system(1).zip | 150 arquivos; pacote 1.0.0; React 19, TypeScript, Tailwind 4, Express, tRPC, Drizzle, MySQL e Manus OAuth | Melhor referência de implementação; reaproveitar componentes após revisar contratos |
| nexus_app.html | Protótipo HTML com dados e interação no cliente | Referência de organização das telas |
| nexus_app_v2.html | Protótipo HTML; funções de notas e diário mostram sucesso sem persistência observada nessas funções | Referência visual, não evidência de gravação |
| nexus_corrigido.html | Documento interativo de diagrama de casos de uso | Atualizar o diagrama; não confundir com uma terceira aplicação funcional |
| Especificação Nexus v3 e PDFs Nexus | Escopo antigo com direção, biblioteca, MySQL e regras não ratificadas | Histórico e rastreabilidade |
| Dossiê e benchmarking Gralia | Pesquisa, contexto e comparações; parte técnica ainda herdada do Nexus | Apoiar prioridades de UX, sem reproduzir estatísticas não verificadas |
| Relatório de reconstrução de 15/10 | Relata 26 testes aprovados e build do Nexus | Registro histórico, não execução repetida nesta revisão |
| Exportação CSV de usuários | Uma linha e 12 colunas; estrutura de usuário com openId, role e campos cadastrais | Não é exportação completa do banco nem conjunto de testes |

O CSV não acompanha o pacote de implementação. Seus valores não foram convertidos em fixtures. O novo ambiente usa identidades sintéticas e não depende da conta real do Manus.

### 3.1 Correções necessárias

As constatações abaixo resultam de leitura estática do código. Quando descrevem uma possível falha em execução, são riscos a verificar por teste, não incidentes reproduzidos nesta sessão.

| Achado | Local no legado | Correção exigida |
|---|---|---|
| Autorização docente incompleta | server/routers.ts, notas.create e frequencias.register | Além do papel, exigir vínculo com a oferta da disciplina |
| Matrícula sem unicidade do par | drizzle/schema.ts, tabela matriculas | Restringir aluno e oferta; impedir duplicidade também no banco |
| Reserva consulta antes de inserir | server/routers.ts e server/db.ts | Bloqueio atômico de sobreposição no PostgreSQL |
| Notas arredondadas para inteiro | notas.create e coluna valor int | Preservar decimais na escala proposta |
| Resultado de busca pode ficar obsoleto | Matriculas.tsx, atualização apenas quando aluno existe | Limpar seleção ao mudar a busca e descartar resposta atrasada |
| Matrículas múltiplas são gravadas em laço | Matriculas.tsx, mutateAsync e onSuccess por item | Operação em lote atômica, confirmação e limpeza apenas ao final |
| Acoplamento e coleta do Manus | vite.config.ts e client/public/__manus__ | Remover da nova aplicação OAuth, runtime, coleta de console/rede e session replay do Manus |
| Documentos usam numerações RF diferentes | Especificação v3 versus docs/requisitos.md do ZIP | Adotar prefixo GRF e manter tabela explícita de correspondência |

## 4 Escopo da versão testável

Todos os módulos essenciais abaixo fazem parte do protótipo planejado. A ordem organiza a execução; não torna reservas opcionais.

| Marco | Entrega | Critério para avançar |
|---|---|---|
| M1 | Base React, navegação, temas, dados de demo e entrada por perfil fictício | Iniciar com npm, recarregar e reiniciar o conjunto de dados |
| M2 | Cadastros acadêmicos mínimos, ofertas e matrículas | CT-GR-001 e CT-GR-002 executáveis no navegador |
| M3 | Área do aluno, professor, avaliações, notas, frequência e materiais | Alterações aparecem no contexto correto e persistem após recarga |
| M4 | Salas, consulta de agenda, criação e cancelamento | Conflitos e intervalos inválidos são rejeitados |
| M5 | Adaptador Supabase, migrações, Auth, RLS e testes de integração | Evidências separadas de autenticação, autorização e banco reais |
| M6 | Revisão de acessibilidade, CI, documentação e preparação Capacitor | Entrega reproduzível; lacunas identificadas sem declarar aprovação fictícia |

Biblioteca, empréstimos, multas, secretaria documental, financeiro, gestão de responsáveis, fórum, mensageria, push, IA generativa, integração institucional e reservas recorrentes complexas ficam fora desta rodada. Plano de ensino, referências, links para slides/vídeos e agenda da oferta entram de forma simples no ambiente da disciplina. Upload real de arquivos, calendário institucional completo, APK e testes k6 ficam como etapas posteriores ao núcleo web; a stack e a intenção Android são preservadas.

## 5 Stack e organização do código

| Camada | Decisão |
|---|---|
| Interface | React, TypeScript estrito, Vite, Tailwind CSS e shadcn/ui |
| Componentes existentes | Reutilizar elementos adequados do Nexus; retirar tipos any nos contratos de domínio |
| Dados remotos | Supabase Auth, API de dados e PostgreSQL com migrações SQL |
| Operações transacionais | Funções SQL/RPC; Edge Functions apenas quando uma operação exigir privilégio de servidor |
| Qualidade | Cypress para navegador; Vitest para domínio e componentes; testes SQL/RLS e concorrência |
| Código e entrega | Git, GitHub e GitHub Actions; npm com package-lock.json |
| Hospedagem prevista | Cloudflare Pages, conforme diagnóstico; publicar não integra a tarefa de geração local |
| Android | Capacitor depois que a experiência web estiver estável; não confundir configuração com APK validado |

Node.js é ambiente de desenvolvimento e automação. Não reconstruir Express, tRPC, MySQL, Drizzle ou OAuth Manus na nova aplicação. Escolher versões estáveis compatíveis no momento da implementação, conferir a documentação oficial e registrar versões efetivamente instaladas. Não transportar automaticamente todo o package.json antigo.

A estrutura recomendada é app/ para o frontend, supabase/ para migrações e testes de banco, docs/ para decisões e evidências, fixtures/ para dados sintéticos e .github/workflows/ para CI. Os scripts da raiz devem permitir executar o projeto sem memorizar subpastas. Se o repositório já contiver o formulário de pesquisa, mantê-lo e não sobrescrever index.html ou Gralia_AppsScript.js.

### 5.1 Dois modos explícitos

**Demo local.** Deve funcionar sem credenciais, após instalação das dependências. Usa as mesmas telas e contratos do modo integrado, com repositório local versionado e persistência de dados fictícios, por exemplo em localStorage. A entrada por perfil é uma simulação identificada por “Demonstração com dados fictícios”. Deve haver ação para restaurar dados, com confirmação. Esse modo não comprova segurança de servidor, RLS, concorrência entre usuários nem funcionamento offline completo.

**Supabase.** Usa sessão real, permissões no banco e a mesma camada de serviços. Deve existir implementação do adaptador e migrações, não apenas interfaces vazias. Se faltarem credenciais ou infraestrutura para executar, apresentar erro de configuração e registrar os testes de integração como bloqueados. Nunca migrar silenciosamente para demo após uma falha de autenticação ou de rede.

Separar as builds e scripts, por exemplo dev:demo, dev:supabase, build:demo e build:supabase. A build integrada não pode conter atalhos de troca de perfil, reset de banco, dados de demonstração embutidos ou funções globais de testes. Fixtures só entram pela ferramenta de preparação autorizada do ambiente de testes. Testes de segurança usam tokens dos próprios usuários; a chave administrativa não serve para comprovar RLS.

## 6 Perfis e limites de acesso

Os perfis de produto são aluno e professor. Um admin técnico mínimo permite preparar cadastros e vínculos para o protótipo e executar a função de matrícula do trabalho. Essa escolha operacional não reintroduz a secretaria do Nexus. O papel bibliotecária não deve aparecer nesta rodada.

| Operação | Aluno | Professor | Admin técnico |
|---|---|---|---|
| Ver perfil acadêmico | Próprio | Próprio | Cadastros mínimos |
| Ver ofertas e materiais | Matrículas ativas próprias | Ofertas atribuídas | Catálogo e configuração |
| Ver notas e frequência | Próprias | Alunos de ofertas atribuídas | Sem acesso pedagógico global por padrão |
| Criar avaliação e lançar nota/frequência | Não | Apenas ofertas atribuídas | Não por padrão |
| Cadastrar alunos, docentes, turmas e disciplinas | Não | Não | Sim |
| Associar docentes e matricular alunos | Não | Não | Sim |
| Ver disponibilidade de salas | Sim, sem dados pessoais do reservante | Sim | Sim |
| Criar/cancelar reservas | Não | Criar e cancelar as próprias | Consultar e cancelar para manutenção |
| Alterar papel de acesso | Não | Não | Somente provisionamento administrativo seguro fora do cliente |

O servidor é a autoridade final. A interface oculta ações indevidas, mas consultas diretas também precisam negar acesso. Disponibilidade deve expor apenas sala e intervalo ocupado; motivo e identidade de terceiros não devem ser entregues ao aluno. Não criar uma view que desative acidentalmente as políticas de acesso às reservas completas.

## 7 Regras propostas para a demonstração

Estas regras preenchem lacunas do diagnóstico. São implementáveis e testáveis, mas continuam sujeitas à validação do responsável e do professor.

| Tema | Convenção operacional desta versão |
|---|---|
| Identificação do aluno | Matrícula sintética única; nome obrigatório; e-mail acadêmico opcional; sem CPF |
| Cadastro e conta | Registro acadêmico pode existir antes da conta; vínculo com Auth é provisionado fora do formulário comum |
| Turmas e ofertas | Turma, disciplina, período e professor formam a oferta; uma disciplina de catálogo pode ter várias ofertas |
| Matrícula | Um vínculo por aluno e oferta; estados ativa e cancelada; reativar o mesmo vínculo |
| Lote de matrículas | Uma ou mais ofertas; validar tudo e gravar tudo ou nada |
| Notas | Escala demonstrativa 0 a 10, até duas casas decimais; não arredondar para inteiro |
| Avaliações | Título e peso positivo; pertencem a uma oferta; nota ausente é pendência, não zero |
| Média | Soma de nota vezes peso dividida pela soma dos pesos lançados; duas casas apenas na exibição; marcar parcial se faltar nota |
| Resultado escolar | Não declarar aprovado/reprovado, recuperação ou frequência mínima oficial sem regra validada |
| Frequência | Presente ou falta por aula; ausência de lançamento é pendência; sem presumir todos presentes |
| Percentual | P dividido pela soma de P e F entre registros lançados; indicar parcial quando houver aula sem lançamento; sem registros, não calcular |
| Falta justificada | Adiada; não coletar atestado, diagnóstico ou observação médica nesta demo |
| Reservas | Professor reserva sala ativa, início futuro, fim posterior; mesma data local; sem aprovação intermediária |
| Intervalos | Início inclusivo e fim exclusivo; 14h–15h e 15h–16h podem coexistir |
| Fuso | Exibir America/Sao_Paulo; armazenar instantes em UTC; não comparar horários como texto livre |
| Cancelamento | Estado cancelada, com autor e momento; não apagar histórico; cancelamento libera o intervalo |

Exemplo de média: notas 8,00 com peso 2 e 6,00 com peso 1 resultam em 7,33 na exibição. Uma nota zero deve ser aceita. Campos vazios, NaN, infinito, valor negativo ou acima de 10 devem ser rejeitados. Inputs podem aceitar vírgula decimal na interface, convertida de forma explícita sem aceitar textos ambíguos.

Alterações de regras devem gerar registro de decisão, atualização dos testes e nova versão de fixtures. Não misturar a antiga escala 0 a 100 com a proposta 0 a 10. Não converter automaticamente notas do Nexus: a extração fornecida não contém o histórico acadêmico completo.

## 8 Requisitos funcionais e aceite

Os IDs GRF evitam colisão com as duas numerações RF encontradas no legado. A matriz completa está no arquivo de migração.

| ID | Requisito | Aceite observável |
|---|---|---|
| GRF-01 | Entrada, saída e sessão por perfil | Logout impede voltar a dados protegidos; Supabase deriva papel de fonte confiável |
| GRF-02 | Home contextual | Atalhos e contagens derivam dos dados do perfil; navegação sem telas vazias |
| GRF-03 | Cadastro acadêmico mínimo | Admin cadastra/edita aluno e docente; rejeita matrícula duplicada; inativa sem apagar histórico |
| GRF-04 | Catálogo, turmas, períodos e ofertas | Oferta identifica disciplina, turma, período e docente; não confunde catálogo com turma |
| GRF-05 | Matrículas | Localiza aluno por matrícula e cria lote válido; sem seleção, botão e serviço impedem gravação |
| GRF-06 | Ambiente da disciplina | Aluno vê apenas suas ofertas; professor suas atribuições; detalhes, plano e referências são coerentes |
| GRF-07 | Avaliações e notas | Docente atribuído cria avaliação e nota decimal; estudante vê o valor correto após recarga |
| GRF-08 | Aulas e frequência | Registro por aula não duplica; pendências permanecem visíveis e totais são recalculados |
| GRF-09 | Materiais | Professor publica título e link válido; aluno matriculado acessa; protocolo inseguro é rejeitado |
| GRF-10 | Agenda da oferta | Lista datas de aulas e avaliações; vazios são explicados; não inventa integração externa |
| GRF-11 | Reserva de ambientes | Lista salas, filtra data, cria e cancela; impede conflito e edição por outro professor |
| GRF-12 | Estados e feedback | Toda ação tem carregamento, vazio, sucesso e erro pertinentes; erro não apaga formulário nem gera falso sucesso |
| GRF-13 | Persistência e reset da demo | Dados persistem na recarga; reset restaura fixture e só altera chaves da aplicação |
| GRF-14 | Temas e responsividade | Claro/escuro, teclado e viewport estreita mantêm conteúdo e controles acessíveis |

### 8.1 Fluxo de matrícula prioritário

Admin técnico abre Matrículas, informa QA2026001, confere o aluno, seleciona uma ou mais ofertas e aciona Registrar matrícula. O serviço valida aluno ativo, ofertas válidas, ausência de duplicidades e permissão. Apenas após confirmação persistente, a interface mostra sucesso, atualiza a lista e limpa a busca e a seleção. Se qualquer item for inválido, nenhuma matrícula é criada e os campos permanecem disponíveis para correção.

Mudar o texto da busca invalida imediatamente o aluno anteriormente selecionado. Uma resposta antiga não pode reassociá-lo depois. Pesquisa sem resultado exibe mensagem clara. A tela deve mostrar disciplina, turma e período juntos para evitar matrícula em oferta errada. Não manter bloqueios por documentos, listas de espera ou limites de vagas inventados no material antigo.

## 9 Modelo de dados mínimo

Este é o contrato lógico proposto para o Codex implementar e verificar. Não é uma migração SQL já executada.

| Entidade | Chaves e conteúdo essencial |
|---|---|
| profiles | id igual ao id de Auth, nome de exibição e papel protegido; usuário comum não altera o papel |
| alunos | id, profile_id opcional e único, nome, matrícula única e status; e-mail opcional |
| professores | id, profile_id opcional e único, nome e status |
| periodos e turmas | Código único; período com datas; turma com identificação própria |
| disciplinas | Código único, nome, descrição e carga horária positiva |
| ofertas_disciplina | Disciplina, turma, período, professor, plano e referências; unicidade do trio disciplina/turma/período |
| matriculas | Aluno, oferta, status e data; único aluno/oferta |
| avaliacoes | Oferta, título, peso positivo e data opcional |
| notas | Avaliação, matrícula, oferta e valor numeric; única avaliação/matrícula |
| aulas e frequencias | Aula pertence à oferta; frequência liga aula e matrícula da mesma oferta; par único |
| materiais | Oferta, título, descrição e URL validada; autoria e data |
| salas e reservas | Sala ativa, solicitante, início/fim timestamptz, motivo, status e cancelamento |

Usar UUIDs, FKs, unicidades e checks no banco, não somente validação visual. Notas e frequência precisam pertencer à mesma oferta da avaliação/aula e da matrícula; impor isso por chaves compostas ou operação transacional validada. Impedir exclusão de entidades referenciadas; preferir inativação. Um aluno inativo ou uma matrícula cancelada não recebe novas notas/frequências. Histórico existente não deve desaparecer em cascata sem decisão explícita.

Reservas ativas devem ter restrição de exclusão por sala e intervalo, com timestamptz e tstzrange de limites [). Usar btree_gist, quando disponível, e check fim maior que início. Se a extensão estiver indisponível, documentar e testar solução transacional equivalente. Uma consulta de disponibilidade seguida de INSERT, isoladamente, não resolve a corrida. [T04]

O lote de matrículas exige transação e validação de lista não vazia. A unicidade é aplicada no banco; clique duplo ou duas chamadas simultâneas não podem criar dois vínculos. RPCs com privilégio elevado devem validar o chamador, restringir execução e fixar search_path; preferir executar com os privilégios do usuário quando possível.

## 10 Interface e identidade visual

A marca exibida deve ser Gral.ia; usar gralia em nomes de pacote, armazenamento e identificadores. A direção visual consolidada é a rota A institucional, com referências da combinação A+B e mascote B+C. Não desenhar ou rotular uma nova logo como definitiva sem o ativo aprovado. Enquanto ele faltar, usar marca textual, com motivos serranos discretos.

| Referência | Cor | Uso sugerido |
|---|---|---|
| Azul noturno | #102A43 | Navegação e superfícies de destaque |
| Azul gralha | #1D5FA7 | Ações principais, após conferir o contraste do par |
| Cerúleo | #0786A7 | Acentos e gráficos auxiliares |
| Branco gelo | #F5F8FC | Fundo claro |
| Grafite | #17212F | Texto e base escura |
| Dourado pinhão | #D3A547 | Detalhes pequenos; não usar automaticamente para texto |

Manrope em títulos e Inter em leitura são referências do diagnóstico. Usar fontes locais licenciadas ou fallback de sistema para a demo não depender de CDN. Definir tokens semânticos para fundo, superfície, texto, borda, foco, sucesso e erro nos dois temas. A paleta de marca não garante contraste; medir as combinações usadas.

Mapa mínimo: login/demo; home; minhas disciplinas; detalhe da oferta; notas e frequência do aluno; avaliações/notas e diário do professor; agenda e materiais; salas/reservas; cadastros/ofertas/matrículas do admin; ajuda, privacidade da demo e página de acesso negado. A biblioteca não deve aparecer como opção clicável sem função.

## 11 Acessibilidade e proteção dos dados

WCAG 2.2 AA e eMAG 3.1 são referências verificadas para este pacote. Aplicar semântica, navegação por teclado, rótulos persistentes, ordem e visibilidade de foco, skip link e mensagens de erro anunciadas. Respeitar movimento reduzido. Verificar reflow a 320 CSS px e zoom de 200%, sem esconder controles. Conferir contraste mínimo de texto e componentes e tamanho/espaçamento dos alvos de interação. Cor sozinha não indica presença, erro ou aprovação. [T01; T02]

Combinar axe ou ferramenta equivalente com inspeção manual, teclado e leitor de tela. O resultado automatizado não permite declarar conformidade integral. Manter checklist com critérios verificados, não aplicáveis, pendentes e falhas. O protótipo deve incluir explicação dos recursos de acessibilidade existentes, sem oferecer um “selo” automático de conformidade.

A minimização e a segurança previstas na LGPD orientam as escolhas do projeto. Usar apenas dados fictícios, sem importar CPF, openId, respostas de entrevistas, credenciais ou registros acadêmicos reais para fixtures, logs e screenshots. Finalidades, retenção, responsabilidades institucionais e base legal de uma eventual operação escolar ainda precisam ser definidas; não declarar conformidade jurídica certificada. [T06]

No Supabase, configurar grants e RLS por operação em todas as tabelas expostas. Não usar user_metadata alterável pelo usuário como fonte de privilégio. Chaves secretas e service_role ficam fora do frontend e de variáveis VITE_. Não entregar credenciais nas evidências. Revogar acesso deve funcionar mesmo que alguém manipule a URL ou chame a API diretamente. [T03]

## 12 Testes e evidências para o trabalho

O documento atual da atividade registra dois testes aprovados do Nexus em ambiente isolado com Vitest, componente React, appRouter e dependências controladas. Ele informa explicitamente que OAuth real, banco real e navegação em Chrome/Windows não foram comprovados. Não transformar esse resultado em teste E2E do Gralia.

O ZIP anexado agora possui SHA-256 diferente do ZIP identificado na atividade anterior. Essa diferença não prova qual código mudou, mas impede reutilizar o resultado histórico como certificação deste snapshot sem comparação e nova execução.

| Caso novo | Correspondência histórica | Diferença da execução planejada |
|---|---|---|
| CT-GR-001 | CT-001 matrícula válida | Admin técnico, busca por matrícula, oferta identificada, recarga e leitura persistente |
| CT-GR-002 | CT-002 sem disciplina | Seleção vazia na UI e lista vazia rejeitada no serviço; verificar banco no modo integrado |

Os 41 casos planejados estão em docs/CASOS_DE_TESTE_GRALIA.md e no CSV editável. Todos começam com status **Não executado**. O campo Resultado obtido só é preenchido por evidência de execução. A suíte demo comprova fluxo e persistência local; testes SQL/RLS e concorrência precisam do backend. Testes manuais de leitor de tela permanecem manuais.

Cada execução registra ID, requisito, dados, passos, esperado, obtido, status, prioridade, severidade quando houver defeito, responsável, data com fuso, ambiente, commit ou hash do código, versão da fixture e caminho das evidências. Guardar logs e relatórios legíveis por máquina e screenshots reais. Diferenciar aprovado, reprovado, bloqueado e não executado. Não inventar evidência visual ou reutilizar captura antiga como se fosse atual.

## 13 Critérios de conclusão da implementação

Uma entrega local fica pronta para a atividade quando um checkout limpo instala dependências com o lockfile, abre a demo, permite os fluxos de aluno/professor/reservas, mantém dados após recarga e executa CT-GR-001 e CT-GR-002 no navegador com evidência. Typecheck, lint, unitários e build devem passar; a execução de Cypress deve ter comando reproduzível. Nenhum botão central pode apenas simular sucesso sem alterar o repositório de dados.

A integração fica validada somente após executar Auth, migrações, RLS, persistência real e testes de conflito concorrente. Build aprovada não substitui esses testes. Se o ambiente não permitir a execução, o Codex entrega o código e registra o bloqueio; não declara a aplicação pronta para uso institucional.

Capacitor, deploy e k6 têm gates próprios posteriores. Não publicar o sistema, criar recursos pagos, alterar serviços reais nem executar reset em banco remoto durante a tarefa local. O próximo trabalho acadêmico deve usar a versão congelada que realmente for testada, atualizar título, método e resultados e preservar o Nexus como antecedente histórico.

## 14 Uso do pacote no Codex

Extrair o pacote em uma pasta de trabalho nova ou copiar seu conteúdo para uma branch separada do repositório. Abrir essa pasta no Codex ou no VS Code com Codex. No uso pela nuvem, os arquivos precisam estar acessíveis no repositório selecionado; não presumir que os anexos desta conversa estarão disponíveis automaticamente.

Ler LEIA_PRIMEIRO.md e colar o conteúdo de PROMPT_CODEX_GRALIA.md. O arquivo AGENTS.md fornece contexto persistente do projeto; se já existir um AGENTS.md no repositório, combinar as regras pertinentes sem apagar instruções alheias. [T07]

O prompt determina inspeção, implementação, validação e entrega, com continuidade por marcos. Não solicita apenas um plano. A ausência de credenciais Supabase não impede concluir a demo nem escrever o adaptador; impede afirmar que a integração real foi validada.

## 15 Referências e limites

[P01] Anexos Nexus e Gralia fornecidos nesta conversa, inventariados em docs/INVENTARIO_FONTES.json. Leitura documental e inspeção estática em 15/11/2026.

[P02] Gralia Diagnóstico e Roadmap, referência de 09/11/2026, 21 páginas. Foram lidas as duas cópias de título semelhante, cujo texto extraído coincide. Fonte de decisões, não prova de implantação atual.

[P03] Atividade Testes Gralia Igor Wolff, versão editada em 14/11/2026. Fonte dos cenários históricos e das limitações declaradas da execução isolada.

[P04] Diretrizes para o futuro do Gralia, Google Drive, modificação indicada em 22/10/2026. https://docs.google.com/document/d/1ZK3dHkPLeXzyu2tqfvEaK34giBW0mKpnAN6eZVI1uGs/edit

[T01] W3C. Web Content Accessibility Guidelines 2.2. https://www.w3.org/TR/WCAG22/

[T02] Governo Digital. Modelo de Acessibilidade eMAG 3.1. https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/acessibilidade-digital/modelo-de-acessibilidade

[T03] Supabase. Row Level Security. https://supabase.com/docs/guides/database/postgres/row-level-security

[T04] PostgreSQL. Range Types, seção Constraints on Ranges. https://www.postgresql.org/docs/current/rangetypes.html

[T05] Cypress. Best Practices. https://docs.cypress.io/app/core-concepts/best-practices

[T06] Ministério da Saúde. Princípios da LGPD, síntese oficial do artigo 6. https://www.gov.br/saude/pt-br/acesso-a-informacao/lgpd/principios

[T07] OpenAI. Custom instructions with AGENTS.md. https://learn.chatgpt.com/docs/agent-configuration/agents-md

[T08] OpenAI. Prompting. https://learn.chatgpt.com/docs/prompting

Fontes técnicas consultadas em 15/11/2026. A página do Planalto apresentou bloqueio automatizado nesta consulta; a orientação sobre princípios usa a fonte governamental indicada em T06. A pesquisa de benchmarking é utilizada como contexto de produto; suas estatísticas, relatos e comparações não foram revalidados como fatos atuais neste pacote.
