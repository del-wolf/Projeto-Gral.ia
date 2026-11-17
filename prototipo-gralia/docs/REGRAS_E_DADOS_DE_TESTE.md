# Gralia Regras e dados de teste

Versão 1.0 de fixtures • 15/11/2026 • Todas as identidades deste arquivo são sintéticas.

## Premissas

A especificação v4 determina o comportamento. Este arquivo detalha o contrato que o Codex deve implementar, sem afirmar que o sistema ou o banco já existem. O seed JSON é uma entrada de referência; deve ser convertido em fixtures válidas e migrations/seed durante a implementação.

## Cenário base

| Identificador | Papel e vínculo | Finalidade |
|---|---|---|
| ADMIN-QA | Admin técnico, conta fictícia | Cadastros e matrícula |
| ALUNO-A / QA2026001 | Aluno com conta; matriculado em OF-PWEB-3A | Caso acadêmico, consulta própria e notas |
| ALUNO-B / QA2026002 | Aluno com conta; matriculado em OF-BD-3B | Verificação de isolamento |
| ALUNO-C / QA2026003 | Aluno acadêmico sem conta Auth vinculada | Distinguir cadastro de autenticação |
| PROF-A | Docente de OF-PWEB-3A, OF-TEST-3A e OF-REDES-3A | Escritas permitidas e reservas |
| PROF-B | Docente de OF-BD-3B | Negação de acesso cruzado |
| OF-TEST-3A | Qualidade e Teste de Software, TDS-3A, 2026-2 | Aluno A começa sem esse vínculo |
| OF-REDES-3A | Redes de Computadores, TDS-3A, 2026-2 | Segundo item para lote |
| LAB-01 / LAB-02 | Dois ambientes ativos | Conflito versus salas distintas |
| SALA-INATIVA | Ambiente inativo | Validação de disponibilidade |

O teste CT-GR-001 usa QA2026001 e OF-TEST-3A. Depois do reset, a contagem desse par é zero. Matrículas de outras ofertas existentes na fixture não devem ser confundidas com o registro do caso. O teste CT-GR-002 mede zero novas matrículas e a ausência desse par, não exige que toda a tabela do sistema esteja vazia.

## IDs e contas

O JSON contém UUIDs determinísticos e códigos humanos. UUID de perfil é referência lógica para a demo; no Supabase, provisionar as contas de teste de forma suportada e manter um mapa dos IDs reais para os aliases. Não inserir senhas na tabela profiles, não usar openId Manus e não supor que o SDK de criação de usuários aceita um ID arbitrário.

A demo seleciona conta fictícia sem senha. Para integração, credenciais são fornecidas por variáveis do executor e criadas em ambiente de testes. O CSV de usuários real não é uma fonte de login. Os endereços @example.test são marcadores de fixture; não enviar mensagens a eles.

## Estado inicial e reinício

- Cada teste começa a partir da versão de fixture 1.0. Não depender da ordem dos casos.
- Reiniciar somente o armazenamento de demo do Gralia. Outras chaves do navegador permanecem intactas.
- Um reset com dados preenchidos pede confirmação; cancelar mantém o estado.
- Logout limpa sessão e caches do usuário; não apaga os registros de demonstração persistidos.
- Acesso por outro perfil deve recalcular o escopo e invalidar cache de dados do anterior.
- Em Supabase, preparar dados por ferramenta administrativa no processo de teste, nunca por endpoint público ou reset disponível na UI integrada.
- Banco descartável local é preferível para reset automático; destino remoto exige allowlist explícita e confirmação de que é de testes. Não inferir ambiente pelo nome de uma variável isolada.

## Validação e contratos de serviço

Contratos podem usar nomes idiomáticos equivalentes, mantendo estes efeitos observáveis.

| Operação | Entrada mínima | Condição de sucesso |
|---|---|---|
| buscarAlunoPorMatricula | matrícula normalizada | Aluno atual ou resultado vazio; não devolve o anterior |
| registrarMatriculas | alunoId, ofertaIds não vazio | Todo o lote válido persistido; retorno dos vínculos confirmados |
| registrarNota | matrícula, avaliação, oferta, valor | Oferta coincide; docente atribuído; valor decimal válido |
| registrarFrequencias | aula, oferta, registros de matrícula/status | Lote válido sem duplicação; não converte pendência em presente |
| publicarMaterial | oferta, título, URL | Docente atribuído e protocolo permitido |
| reservarSala | sala, início/fim, motivo | Reserva ativa única, consistente com disponibilidade transacional |
| cancelarReserva | id de reserva | Proprietário ou admin; estado cancelada, sem exclusão |

Erros de domínio devem ter códigos estáveis, por exemplo VALIDATION_ERROR, FORBIDDEN, NOT_FOUND, DUPLICATE_ENROLLMENT, RESERVATION_CONFLICT e STORAGE_ERROR. O adaptador converte erros de banco nesses códigos e mantém mensagem amigável. Não usar status HTTP inventado como prova; registrar o retorno efetivo do transporte usado.

Matrículas em lote: deduplicar ou rejeitar oferta repetida na entrada de forma documentada; neste contrato, **rejeitar lista com repetição** para não ocultar um erro do chamador. Se um item já tiver vínculo ativo, rejeitar o lote inteiro. Um cancelado pode ser reativado na mesma transação, sem criar nova linha. Usuário sem permissão é rejeitado antes da escrita.

Ao falhar uma gravação, preservar o formulário e não exibir sucesso. Ao falhar uma parte do lote, reverter o lote inteiro. Não alterar somente a tela otimista sem rollback. Desabilitar envio enquanto está pendente.

## Notas e frequência

Dados previstos para aluno A em OF-PWEB-3A: avaliação A1 de peso 2 com nota 8,00; A2 de peso 1 com 6,00; A3 de peso 1 sem nota. Exibir média parcial 7,33. Após lançar 0 em A3, a média completa é 5,50. Zero é um valor válido; pendência não equivale a zero.

Três aulas de exemplo: P, F e sem lançamento. Exibir 1 presença, 1 falta e 1 pendência; frequência parcial 50%. Após marcar P na pendência: 2 presenças, 1 falta, 0 pendências; frequência 66,67%. Sem qualquer lançamento, apresentar Sem registros, sem NaN, infinito ou 0% inventado. Cada aula representa uma unidade didática da demonstração, não uma regra institucional de horas.

Não emitir aprovação, reprovação, recuperação ou limite de faltas. Não presumir média 6, média 7 ou frequência mínima de 75% como regra validada.

## Tempo e reserva

O domínio deve receber um relógio substituível em testes. Na demo automatizada, fixar 2026-11-16T12:00:00Z e usar America/Sao_Paulo na apresentação. O relógio fixo é apenas de teste; a demo interativa usa o horário corrente.

Para Supabase, cy.clock não altera o relógio do PostgreSQL. Criar datas de reserva a partir do instante do backend, com margem de dias futuros, e registrar o instante usado no relatório. A fixture contém modelos relativos ao início da execução: D+2 às 14h–15h em LAB-01, do PROF-A. Converter no fuso IANA; não concatenar um sufixo Z em horário local.

Teste de concorrência: duas sessões autenticadas disparam reservas sobrepostas para a mesma sala, coordenadas para ocorrer simultaneamente. Verificar respostas e contagem no banco: um sucesso e uma rejeição por conflito, com apenas uma reserva ativa naquele intervalo. Não simular concorrência apenas com dois cliques consecutivos nem substituir o banco por mock.

## Evidências

Usar docs/evidencias/<run-id>/<case-id> para registros. Cada execução anota perfil, fixture, modo demo/Supabase, versão do código, sistema operacional, navegador, versões e data com fuso. Screenshots do navegador são diferentes de DOM serializado. A preparação administrativa dos dados é distinta do usuário que realiza a operação testada.

O modelo em modelos/execucao_teste.json é vazio e não deve ser agregado como teste aprovado. Campos sem observação permanecem nulos. Resultado esperado vem do contrato; resultado obtido vem da execução.
