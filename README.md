# Gral.ia — Gestão Acadêmica

**Pesquisa de UX para orientar o desenvolvimento de um sistema acadêmico.**

O **Gralha (Gral.ia)** é um Projeto Integrador do último semestre do curso **Técnico em Desenvolvimento de Sistemas do CEDUP**. A proposta é desenvolver um sistema acadêmico a partir das necessidades de quem utiliza os serviços e ferramentas de uma instituição de ensino.

O projeto está na etapa de **Pesquisa e Discovery**. Este repositório reúne o formulário de pesquisa e sua integração com Google Apps Script e Google Sheets, usados para investigar rotinas, dificuldades e prioridades antes da definição do produto.

**[Guia de implantação](./IMPLANTACAO.md)** · **[Código do formulário](./index.html)** · **[Código do Apps Script](./Gralia_AppsScript.js)**

> As instruções técnicas deste README descrevem a versão revisada do coletor, com contrato de dados **2.0**. A publicação do site e do Web App deve ser validada conforme o guia de implantação antes de iniciar ou retomar a coleta.

## Objetivo

Compreender como alunos, professores e equipes de apoio realizam suas atividades acadêmicas, identificando:

- Ferramentas e canais utilizados no cotidiano.
- Satisfação com a usabilidade e a organização das informações.
- Dificuldades para consultar notas, frequência, avisos e materiais.
- Problemas nas rotinas docentes, administrativas e de biblioteca.
- Aspectos positivos das soluções existentes.
- Funcionalidades que merecem prioridade no desenvolvimento.

Os resultados da pesquisa orientarão o levantamento de requisitos, a priorização de funcionalidades e a elaboração dos protótipos do Gral.ia.

## Público da pesquisa

O questionário contempla quatro perfis, com uma pergunta específica para cada rotina:

| Perfil | Foco da investigação |
|---|---|
| Alunos e estudantes | Acesso a notas, faltas, avisos e materiais de estudo. |
| Professores e docentes | Chamada, lançamento de notas, publicação de materiais e reserva de espaços. |
| Direção, secretaria e gestão | Matrículas, organização de espaços e comunicação institucional. |
| Biblioteca e apoio pedagógico | Acervo, empréstimos, devoluções e dificuldades do processo atual. |

O formulário também coleta informações comuns a todos os perfis, como nível de ensino, frequência de uso das plataformas e sugestões de melhoria.

## Escopo atual

### Coletor de pesquisa — versão revisada

- Questionário em quatro seções, com layout adaptado a diferentes tamanhos de tela.
- Exibição de perguntas conforme o perfil selecionado.
- Indicador de preenchimento das perguntas obrigatórias.
- Validação de campos no navegador e no servidor.
- Seleção de até três funcionalidades prioritárias.
- Envio das respostas ao Apps Script e gravação na aba `Respostas`.
- Confirmação de gravação associada a um identificador de envio.
- Tratamento de erros, timeout e nova tentativa com o mesmo identificador.
- Verificação dos cabeçalhos da planilha e proteção contra interpretação de textos como fórmulas.

### Sistema acadêmico — oportunidades em avaliação

A pesquisa apresenta possibilidades como painel de horários, notas e frequência; central de materiais; mural de avisos; diário de classe; acompanhamento de matrícula; reserva de espaços e recursos de biblioteca.

Esses módulos são **hipóteses para o produto futuro**. Sua inclusão e prioridade dependem dos resultados do Discovery, da viabilidade técnica e do escopo definido para o Projeto Integrador.

## Tecnologias

| Tecnologia | Uso nesta etapa |
|---|---|
| HTML5 | Estrutura do questionário e controles de preenchimento. |
| CSS3 | Layout, apresentação visual e estados da interface. |
| JavaScript | Interações, validação no cliente, coleta dos campos e envio. |
| Fetch API | Comunicação HTTP com o Web App. |
| Google Apps Script | Recebimento, validação e gravação das respostas. |
| Google Sheets | Armazenamento e organização dos dados da pesquisa. |

O formulário utiliza JavaScript sem framework e não exige uma etapa de build para sua publicação. O Apps Script é implantado separadamente no ambiente do Google.

## Como funciona a integração

1. O participante preenche o formulário e escolhe seu perfil.
2. O navegador valida as respostas e cria um identificador único para aquela tentativa de envio.
3. Um `POST` envia o objeto JSON ao Web App do Apps Script.
4. O servidor confere os dados, abre a planilha configurada e verifica se aquele envio já foi registrado.
5. Uma nova resposta é gravada na aba `Respostas`; uma repetição do mesmo envio recebe a confirmação anterior.
6. A interface exibe sucesso somente ao receber uma confirmação válida com o mesmo identificador.

Todos os perfis são registrados na mesma aba e diferenciados pelo campo `perfil`. O contrato revisado registra as perguntas, o horário de recebimento do servidor, a versão do formulário e os dados usados para conferir reenvios.

Em uma falha de comunicação, o servidor pode ter concluído a gravação antes de a resposta chegar ao navegador. Por isso, a nova tentativa reutiliza o mesmo identificador. Essa proteção vale para o envio mantido na aba aberta; não impede que uma pessoa inicie outro preenchimento.

## Arquivos principais

| Arquivo | Responsabilidade |
|---|---|
| [`README.md`](./README.md) | Apresentação do projeto e orientação inicial. |
| [`index.html`](./index.html) | Formulário, estilos e JavaScript do cliente. |
| [`Gralia_AppsScript.js`](./Gralia_AppsScript.js) | Código a ser instalado em um arquivo `.gs` do projeto Apps Script. |
| [`IMPLANTACAO.md`](./IMPLANTACAO.md) | Configuração, publicação, atualização e testes de aceite. |

Mantenha o guia de implantação na mesma pasta deste README para que os links relativos funcionem. Se adicionar o relatório técnico, os testes e o `package.json` do pacote revisado, preserve a organização desse material e use as instruções de execução do guia.

## Começar a usar

Para configurar a coleta, é necessário ter acesso de edição à planilha de destino e ao projeto Apps Script, além de uma hospedagem estática para o formulário.

1. Instale a versão revisada de `Gralia_AppsScript.js` no editor do Apps Script.
2. Confira `SPREADSHEET_ID`, `SHEET_NAME` e `FORM_VERSION` no servidor.
3. Execute `verificarConfiguracao()` e, em seguida, `prepararPlanilha()` conforme o guia.
4. Publique uma versão do Web App e copie sua URL terminada em `/exec`.
5. Configure essa URL em `SHEETS_URL`, dentro de `index.html`.
6. Publique o formulário e faça um envio de teste pelo endereço público.
7. Localize o identificador retornado na coluna **R — ID da resposta** e confira os dados da linha.

O procedimento detalhado, incluindo permissões, atualização de implantação e tratamento de problemas de CORS, está no **[IMPLANTACAO.md](./IMPLANTACAO.md)**.

Salvar o código no editor do Apps Script não atualiza automaticamente uma implantação versionada. Da mesma forma, adicionar este README ao GitHub não configura o Web App nem a planilha.

## Testes e validação

Na revisão do contrato 2.0, foram aprovados **44 testes de backend e 19 testes de interface em ambientes simulados**. Eles verificaram, entre outros cenários, validação de entrada, mapeamento dos campos, preservação de registros antigos, falhas de envio e repetição sem duplicação da mesma tentativa.

Esses testes não certificam a implantação ativa. Antes de liberar a pesquisa, confira no ambiente publicado:

- Um envio completo para cada um dos quatro perfis.
- Correspondência entre o comprovante exibido e uma única linha na planilha.
- Gravação dos campos opcionais e exclusão dos campos de perfis não selecionados.
- Mensagens de erro quando há desconexão, timeout ou falha do servidor.
- Reenvio com o mesmo identificador, sem criar uma segunda linha.
- Preenchimento e envio no celular e por teclado.

O guia de implantação contém o roteiro de aceite. Caso os arquivos de testes do pacote revisado sejam incluídos no repositório, o mesmo guia explica como executá-los localmente.

## Privacidade e acesso aos dados

O questionário não solicita nome ou e-mail. Como existem campos abertos, os participantes devem evitar inserir dados pessoais ou identificar outras pessoas nas respostas.

A planilha de coleta deve ter acesso restrito à equipe responsável. O acesso público ao formulário pode ser configurado separadamente das permissões de leitura da planilha.

Ao manter este repositório:

- Publique código e documentação; mantenha respostas individuais e exportações identificáveis fora do histórico público.
- Não inclua senhas, tokens de acesso ou credenciais.
- Defina responsável pela pesquisa, finalidade de uso, contato e prazo de conservação das respostas.
- Ao apresentar os resultados, priorize dados agregados e revise textos livres antes de divulgá-los.

A validação do endpoint reduz entradas inválidas, mas não substitui controles adicionais contra spam caso a divulgação ou o volume de acesso aumentem.

## Próximas etapas

| Etapa | Entrega esperada |
|---|---|
| Homologação da coleta | Confirmar o fluxo completo no ambiente publicado. |
| Coleta e análise | Organizar respostas, identificar padrões e registrar limitações da amostra. |
| Definição de requisitos | Transformar achados da pesquisa em requisitos e prioridades. |
| Prototipação | Desenhar e avaliar os fluxos e as telas prioritárias. |
| Desenvolvimento | Implementar o escopo acordado para o sistema acadêmico. |
| Avaliação e documentação | Testar a solução e registrar decisões e resultados do Projeto Integrador. |

## Contribuições

Sugestões e relatos de problemas podem ser registrados nas [issues do repositório](https://github.com/del-wolf/Projeto-Gral.ia/issues).

Ao relatar um problema, informe o comportamento esperado, o resultado observado e os passos para reproduzi-lo. Utilize exemplos fictícios e remova dados de participantes de capturas de tela e mensagens de erro.

## Contexto acadêmico

**Projeto:** Gralha (Gral.ia)  
**Curso:** Técnico em Desenvolvimento de Sistemas  
**Instituição:** CEDUP  
**Atividade:** Projeto Integrador do último semestre  
**Etapa atual:** Pesquisa e Discovery
