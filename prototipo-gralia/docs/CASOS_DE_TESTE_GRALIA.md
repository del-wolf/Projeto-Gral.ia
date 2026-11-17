# Gralia Plano de casos de teste

Versão 1.0 • 15/11/2026 • Planejamento para a implementação futura. **Todos os 41 casos estão Não executados.**

## Método e limites

Cada caso deve começar com fixture reiniciada e ser executável isoladamente. Casos com duas modalidades precisam de duas execuções identificadas. Aprovação da demo não aprova Supabase; aprovação de SQL não comprova interação acessível. Screenshots devem ser capturas reais e os campos de resultado não podem ser preenchidos pela descrição do esperado.

O CSV inclui os 14 campos da atividade acadêmica e colunas adicionais de requisito e versão da fixture. Resultado obtido está vazio. Prioridade indica ordem de tratamento; severidade só é atribuída após observar um defeito. As instruções completas de dados e tempo estão em REGRAS_E_DADOS_DE_TESTE.md.

## Dois casos prioritários da atividade

### CT-GR-001 Matricular aluno em uma oferta válida

| Campo | Conteúdo |
|---|---|
| 1. ID | CT-GR-001 |
| 2. Título | Matricular aluno em uma oferta válida |
| 3. Objetivo | Matricular aluno em uma oferta válida. |
| 4. Pré-condições | Restaurar fixture 1.0; nenhuma matrícula ALUNO-A/OF-TEST-3A; admin técnico ativo. |
| 5. Dados de teste | QA2026001; OF-TEST-3A; status ativa. |
| 6. Passos de execução | 1. Entrar como ADMIN-QA. 2. Abrir Matrículas. 3. Buscar QA2026001 e conferir Aluno Teste A. 4. Selecionar OF-TEST-3A. 5. Acionar Registrar matrícula uma vez. 6. Verificar confirmação, seleção limpa e consulta independente do repositório. 7. Recarregar, localizar o aluno e verificar o vínculo. |
| 7. Resultado esperado | Exatamente um vínculo ativo do par; aluno/oferta corretos; sucesso acessível apenas após persistir; busca e seleção limpas; vínculo permanece após recarga. Consulta independente confirma uma linha. Na integração, essa leitura confirma o banco real. |
| 8. Resultado obtido | Não preenchido; depende da execução real. |
| 9. Status | Não executado |
| 10. Prioridade | Alta |
| 11. Severidade | Não avaliada; preencher somente se houver defeito |
| 12. Ambiente | Cypress demo; repetir com Supabase; versões a registrar na execução |
| 13. Responsável | Execução pendente; autoria do projeto Igor Felipe Wolff |
| 14. Evidências | A produzir em docs/evidencias/<run-id>/CT-GR-001 |

Requisitos: GRF-05; GRF-13. Fixture: 1.0.

### CT-GR-002 Bloquear matrícula sem oferta selecionada

| Campo | Conteúdo |
|---|---|
| 1. ID | CT-GR-002 |
| 2. Título | Bloquear matrícula sem oferta selecionada |
| 3. Objetivo | Bloquear matrícula sem oferta selecionada. |
| 4. Pré-condições | Restaurar fixture 1.0; nenhuma matrícula ALUNO-A/OF-TEST-3A; admin técnico ativo. |
| 5. Dados de teste | QA2026001; ofertaIds = []. |
| 6. Passos de execução | 1. Reiniciar fixture independentemente do CT-GR-001. 2. Entrar como ADMIN-QA e buscar QA2026001. 3. Não marcar oferta. 4. Verificar botão desabilitado, ajuda e zero chamada de criação pela UI. 5. Em teste de domínio separado, chamar registrarMatriculas com lista vazia. 6. No Supabase, repetir pela RPC/API autenticada. 7. Conferir contagem antes/depois. |
| 7. Resultado esperado | UI impede submissão e preserva aluno; zero chamada de criação originada da tela; serviço rejeita entrada vazia antes da escrita; zero novas matrículas. Não atribuir mensagem visual ao botão desabilitado. A rejeição real do backend só é aprovada se a rodada Supabase ocorrer. |
| 8. Resultado obtido | Não preenchido; depende da execução real. |
| 9. Status | Não executado |
| 10. Prioridade | Alta |
| 11. Severidade | Não avaliada; preencher somente se houver defeito |
| 12. Ambiente | Cypress + domínio; repetir RPC no Supabase; versões a registrar na execução |
| 13. Responsável | Execução pendente; autoria do projeto Igor Felipe Wolff |
| 14. Evidências | A produzir em docs/evidencias/<run-id>/CT-GR-002 |

Requisitos: GRF-05. Fixture: 1.0.

## Demais casos planejados

### CT-GR-003 Rejeitar vínculo já existente

**Requisitos:** GRF-05. **Ambiente:** Domínio + Cypress; banco; versões a registrar na execução.

**Pré-condições:** Restaurar fixture 1.0; nenhuma matrícula ALUNO-A/OF-TEST-3A; admin técnico ativo.

**Dados:** ALUNO-A; OF-PWEB-3A já ativa.

**Passos:** Buscar aluno; selecionar oferta já vinculada pela UI se disponível; enviar a mesma intenção pelo serviço; comparar registros.

**Esperado:** Interface sinaliza vínculo existente; serviço rejeita duplicidade; permanece uma matrícula; nenhum sucesso enganoso.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-003. **Responsável pela execução:** a registrar.

### CT-GR-004 Descartar aluno e resposta de busca obsoletos

**Requisitos:** GRF-05; GRF-12. **Ambiente:** Cypress com respostas controladas; versões a registrar na execução.

**Pré-condições:** Restaurar fixture 1.0; nenhuma matrícula ALUNO-A/OF-TEST-3A; admin técnico ativo.

**Dados:** Busca QA2026001 seguida de INEXISTENTE e respostas invertidas.

**Passos:** Localizar A; alterar busca; atrasar resposta antiga e concluir busca nova vazia; tentar registrar.

**Esperado:** Aluno/seleções antigos são invalidados imediatamente; resposta atrasada não reativa A; matrícula bloqueada; mensagem de vazio coerente.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-004. **Responsável pela execução:** a registrar.

### CT-GR-005 Tratar aluno não encontrado

**Requisitos:** GRF-05; GRF-12. **Ambiente:** Cypress demo; integrado; versões a registrar na execução.

**Pré-condições:** Restaurar fixture 1.0; nenhuma matrícula ALUNO-A/OF-TEST-3A; admin técnico ativo.

**Dados:** QA9999999.

**Passos:** Buscar a matrícula inexistente; aguardar término; verificar feedback e controles.

**Esperado:** Estado vazio claro; sem dados de aluno anterior; sem seleção de ofertas utilizável; sem escrita.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-005. **Responsável pela execução:** a registrar.

### CT-GR-006 Negar matrícula por perfil indevido

**Requisitos:** GRF-01; GRF-05. **Ambiente:** Cypress + domínio; RLS/RPC; versões a registrar na execução.

**Pré-condições:** Restaurar fixture 1.0; nenhuma matrícula ALUNO-A/OF-TEST-3A; admin técnico ativo.

**Dados:** ALUNO-A e PROF-A tentando criar matrícula.

**Passos:** Entrar por cada perfil; acessar URL admin diretamente; tentar a operação no serviço/API com o próprio token.

**Esperado:** Rota protegida e operação negada; zero registros criados; não basta esconder o menu.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-006. **Responsável pela execução:** a registrar.

### CT-GR-007 Garantir atomicidade do lote

**Requisitos:** GRF-05. **Ambiente:** Domínio + integração PostgreSQL; versões a registrar na execução.

**Pré-condições:** Restaurar fixture 1.0; nenhuma matrícula ALUNO-A/OF-TEST-3A; admin técnico ativo.

**Dados:** Lote OF-TEST-3A + oferta inválida; depois lote OF-TEST-3A + OF-REDES-3A.

**Passos:** Enviar lote com item inválido; comparar banco; depois enviar lote inteiramente válido; observar confirmação e limpeza.

**Esperado:** Primeiro lote grava zero; campos preservados; segundo lote grava dois vínculos uma vez e só então confirma/limpa. Não aceitar um vínculo parcial.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-007. **Responsável pela execução:** a registrar.

### CT-GR-008 Impedir duplicidade por envio repetido

**Requisitos:** GRF-05. **Ambiente:** Cypress + concorrência no banco; versões a registrar na execução.

**Pré-condições:** Restaurar fixture 1.0; nenhuma matrícula ALUNO-A/OF-TEST-3A; admin técnico ativo.

**Dados:** Dois envios simultâneos de ALUNO-A/OF-TEST-3A.

**Passos:** Disparar clique duplo durante latência controlada; em integração disparar duas chamadas concorrentes; consultar contagem.

**Esperado:** UI impede reenvio pendente; banco contém no máximo um vínculo; chamada duplicada tem resultado definido e não cria segunda linha.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-008. **Responsável pela execução:** a registrar.

### CT-GR-009 Bloquear aluno inativo e reativar vínculo

**Requisitos:** GRF-03; GRF-05. **Ambiente:** Domínio + Cypress; banco; versões a registrar na execução.

**Pré-condições:** Restaurar fixture 1.0; nenhuma matrícula ALUNO-A/OF-TEST-3A; admin técnico ativo.

**Dados:** ALUNO-C inativo; matrícula cancelada de A/OF-TEST-3A preparada para segunda parte.

**Passos:** Tentar matricular C inativo; restaurar fixture; criar/cancelar vínculo de A; reativar mesmo vínculo.

**Esperado:** Inativo não recebe matrícula; reativação preserva id e mantém um único vínculo; históricos não são apagados.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-009. **Responsável pela execução:** a registrar.

### CT-GR-010 Validar cadastro acadêmico mínimo

**Requisitos:** GRF-03. **Ambiente:** Cypress demo; integrado; versões a registrar na execução.

**Pré-condições:** Admin ativo; fixture restaurada.

**Dados:** Nome vazio; depois Aluno Teste D e QA2026004.

**Passos:** Enviar nome vazio; corrigir e salvar registro válido; recarregar lista.

**Esperado:** Nome vazio bloqueado com erro associado; um cadastro válido persistido; nenhum papel de acesso escolhido no formulário.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-010. **Responsável pela execução:** a registrar.

### CT-GR-011 Rejeitar matrícula cadastral duplicada

**Requisitos:** GRF-03. **Ambiente:** Cypress + domínio; banco; versões a registrar na execução.

**Pré-condições:** Admin ativo; QA2026001 já existe.

**Dados:** Novo aluno com matrícula QA2026001 e espaços externos.

**Passos:** Criar outro cadastro com o identificador existente após normalização.

**Esperado:** Duplicidade rejeitada; permanece um aluno com essa matrícula; registro original preservado.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-011. **Responsável pela execução:** a registrar.

### CT-GR-012 Separar catálogo de oferta e preservar histórico

**Requisitos:** GRF-04; GRF-06. **Ambiente:** Cypress + integração; versões a registrar na execução.

**Pré-condições:** Admin; duas turmas e período criados.

**Dados:** Mesma disciplina em TDS-3A e TDS-3B; oferta duplicada; turma com matrícula.

**Passos:** Criar duas ofertas em turmas distintas; tentar repetir trio disciplina/turma/período; tentar excluir entidade referenciada.

**Esperado:** Duas ofertas distintas permitidas; trio duplicado rejeitado; exclusão protegida; não apagar notas ou matrículas relacionadas.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-012. **Responsável pela execução:** a registrar.

### CT-GR-013 Aceitar zero e preservar nota decimal

**Requisitos:** GRF-07. **Ambiente:** Vitest + Cypress; banco; versões a registrar na execução.

**Pré-condições:** PROF-A e aluno A na oferta PWEB.

**Dados:** A3=0; A1=8,75.

**Passos:** Lançar zero em A3; recarregar; editar A1 para 8,75; reler como aluno.

**Esperado:** Zero persistido e distinto de pendência; 8,75 não vira 9; aluno vê a nota correta.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-013. **Responsável pela execução:** a registrar.

### CT-GR-014 Rejeitar nota inválida

**Requisitos:** GRF-07. **Ambiente:** Vitest parametrizado + integração; versões a registrar na execução.

**Pré-condições:** Docente autorizado; fixture restaurada.

**Dados:** Vazio, -0,01, 10,01, 8,755, NaN, infinito e texto abc.

**Passos:** Tentar cada entrada na UI quando representável e no domínio/serviço; conferir nota anterior.

**Esperado:** Rejeição clara para valores fora da escala, com mais de duas casas ou sem número válido; nota anterior preservada; nenhuma gravação parcial ou truncamento silencioso.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-014. **Responsável pela execução:** a registrar.

### CT-GR-015 Calcular média com pendência explícita

**Requisitos:** GRF-07. **Ambiente:** Vitest + Cypress; versões a registrar na execução.

**Pré-condições:** Fixture de notas PWEB: 8 peso2; 6 peso1; A3 peso1 sem nota.

**Dados:** Média parcial 7,33; depois A3=0.

**Passos:** Ler boletim; conferir pendência; lançar zero em A3 e reler.

**Esperado:** Antes: parcial 7,33 e uma pendência. Depois: completa 5,50. Sem aprovação/reprovação inventada; peso zero/negativo rejeitado no domínio.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-015. **Responsável pela execução:** a registrar.

### CT-GR-016 Negar lançamento em oferta de outro docente

**Requisitos:** GRF-01; GRF-07. **Ambiente:** Domínio + RLS/RPC; versões a registrar na execução.

**Pré-condições:** PROF-A autenticado; OF-BD-3B do PROF-B.

**Dados:** Matrícula de B e avaliação BD.

**Passos:** Tentar criar/editar avaliação e nota de BD com token de PROF-A; consultar registro como usuário autorizado.

**Esperado:** Todas as escritas indevidas rejeitadas; valor de B e avaliação permanecem inalterados.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-016. **Responsável pela execução:** a registrar.

### CT-GR-017 Registrar frequência sem duplicar

**Requisitos:** GRF-08. **Ambiente:** Cypress + domínio; banco; versões a registrar na execução.

**Pré-condições:** PROF-A; aluno A; três aulas PWEB.

**Dados:** Aula3=P; reenvio da mesma aula/matrícula.

**Passos:** Lançar presença; recarregar; editar para F; reenviar; consultar par.

**Esperado:** Exatamente um registro do par; alteração coerente; totais recalculados; não duplicar aula ou frequência.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-017. **Responsável pela execução:** a registrar.

### CT-GR-018 Exibir pendência e frequência parcial

**Requisitos:** GRF-08. **Ambiente:** Vitest + Cypress; versões a registrar na execução.

**Pré-condições:** Fixture PWEB de frequência.

**Dados:** P, F e pendente; depois P na pendência; depois nenhum registro.

**Passos:** Consultar totais; concluir pendência; em cenário reiniciado sem registros consultar frequência.

**Esperado:** Inicial 1P/1F/1pendente e 50% parcial; depois 66,67%; sem registros, sem divisão por zero ou ausência tratada como presença.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-018. **Responsável pela execução:** a registrar.

### CT-GR-019 Negar frequência por docente alheio

**Requisitos:** GRF-01; GRF-08. **Ambiente:** Domínio + RLS/RPC; versões a registrar na execução.

**Pré-condições:** PROF-B autenticado; PWEB pertence ao PROF-A.

**Dados:** Aula PWEB e matrícula A.

**Passos:** Tentar escrever/editar frequência diretamente com token do PROF-B.

**Esperado:** Operação negada e registros preservados; falta não pode ser lançada apenas por ser professor.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-019. **Responsável pela execução:** a registrar.

### CT-GR-020 Publicar material seguro no escopo correto

**Requisitos:** GRF-06; GRF-09. **Ambiente:** Cypress + domínio; integração; versões a registrar na execução.

**Pré-condições:** PROF-A; A matriculado PWEB; B sem PWEB.

**Dados:** Título sintético; link https; entradas javascript: e texto com marcação.

**Passos:** Publicar link válido; consultar como A e B; tentar URL insegura e título contendo marcação.

**Esperado:** A acessa material; B não recebe recurso; URL insegura rejeitada; marcação exibida como texto; sem execução de script.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-020. **Responsável pela execução:** a registrar.

### CT-GR-021 Criar reserva válida em horário livre

**Requisitos:** GRF-11. **Ambiente:** Cypress demo; integrado; versões a registrar na execução.

**Pré-condições:** PROF-A; LAB-02 ativo; relógio definido.

**Dados:** D+2, 14h–15h, motivo Aula demonstrativa.

**Passos:** Filtrar agenda; preencher reserva; confirmar; recarregar; ler registro.

**Esperado:** Uma reserva ativa do solicitante correto; persistência confirmada; hora exibida em America/Sao_Paulo corresponde ao instante salvo.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-021. **Responsável pela execução:** a registrar.

### CT-GR-022 Rejeitar sobreposição e permitir sala distinta

**Requisitos:** GRF-11. **Ambiente:** Vitest + Cypress; banco; versões a registrar na execução.

**Pré-condições:** Reserva base LAB-01 D+2 14h–15h.

**Dados:** LAB-01 14h30–15h30; LAB-02 mesmo intervalo.

**Passos:** Tentar reserva sobreposta na LAB-01; repetir na LAB-02.

**Esperado:** Conflito na LAB-01, sem nova linha; LAB-02 permitida; erro não limpa dados indevidamente.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-022. **Responsável pela execução:** a registrar.

### CT-GR-023 Permitir reservas adjacentes

**Requisitos:** GRF-11. **Ambiente:** Vitest + integração; versões a registrar na execução.

**Pré-condições:** Reserva base LAB-01 14h–15h.

**Dados:** LAB-01 15h–16h e 13h–14h.

**Passos:** Criar cada intervalo adjacente; consultar agenda.

**Esperado:** Ambos são permitidos; limites [início,fim) preservados; não interpretar toque de extremidade como sobreposição.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-023. **Responsável pela execução:** a registrar.

### CT-GR-024 Rejeitar intervalo e sala inválidos

**Requisitos:** GRF-11. **Ambiente:** Vitest + Cypress; banco; versões a registrar na execução.

**Pré-condições:** Professor ativo; relógio registrado.

**Dados:** Início passado; fim igual/antes; atravessar data local; SALA-INATIVA.

**Passos:** Executar cada variação independente e comparar contagem.

**Esperado:** Todas rejeitadas com causa adequada e zero nova reserva; backend também valida instante atual, duração e sala.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-024. **Responsável pela execução:** a registrar.

### CT-GR-025 Cancelar somente reserva autorizada

**Requisitos:** GRF-01; GRF-11. **Ambiente:** Cypress + RLS/RPC; versões a registrar na execução.

**Pré-condições:** Reserva base do PROF-A.

**Dados:** PROF-B, depois PROF-A; mesmo intervalo após cancelamento.

**Passos:** B tenta cancelar; A cancela; consultar histórico; B reserva o intervalo liberado.

**Esperado:** B não cancela reserva alheia; A cancela com metadados; histórico preservado; horário fica disponível; admin pode cancelar para manutenção.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-025. **Responsável pela execução:** a registrar.

### CT-GR-026 Bloquear corrida entre duas reservas

**Requisitos:** GRF-11. **Ambiente:** Integração PostgreSQL real; versões a registrar na execução.

**Pré-condições:** Banco de testes; duas sessões; horário futuro livre.

**Dados:** PROF-A e PROF-B; mesma sala; intervalos sobrepostos.

**Passos:** Coordenar duas requisições paralelas; aguardar ambas; registrar respostas; consultar reservas ativas no intervalo.

**Esperado:** Exatamente um sucesso e uma rejeição por conflito; exatamente uma reserva ativa. Mock/localStorage não comprova este caso.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-026. **Responsável pela execução:** a registrar.

### CT-GR-027 Encerrar sessão e limpar cache do perfil

**Requisitos:** GRF-01; GRF-02. **Ambiente:** Cypress demo; repetir Auth real; versões a registrar na execução.

**Pré-condições:** Aluno A autenticado; tela com notas aberta.

**Dados:** Logout; botão voltar; login como aluno B.

**Passos:** Sair; voltar no navegador; acessar rota diretamente; entrar como B.

**Esperado:** Sem sessão não há dados protegidos; B não recebe cache de A; dados persistentes não são apagados ao sair.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-027. **Responsável pela execução:** a registrar.

### CT-GR-028 Tratar login inválido e sessão expirada

**Requisitos:** GRF-01; GRF-12. **Ambiente:** Supabase Auth real + Cypress; versões a registrar na execução.

**Pré-condições:** Contas de teste provisionadas; backend acessível.

**Dados:** Senha inválida; sessão inválida/expirada durante operação.

**Passos:** Tentar login incorreto; autenticar válido; invalidar sessão em teste controlado; solicitar operação protegida.

**Esperado:** Login incorreto não cria sessão; sessão inválida bloqueia operação e exige autenticação; sem sucesso falso nem fallback demo; logs sem senha/token.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-028. **Responsável pela execução:** a registrar.

### CT-GR-029 Isolar leitura entre alunos

**Requisitos:** GRF-01; GRF-06; GRF-07; GRF-08. **Ambiente:** RLS/API com token do aluno; versões a registrar na execução.

**Pré-condições:** A e B com dados distintos.

**Dados:** IDs de B usados por A; oferta não matriculada.

**Passos:** Como A, consultar notas, frequência, matrícula e material de B via API; repetir leitura permitida própria.

**Esperado:** Dados alheios não retornam; próprios permitidos; registrar vazio/erro efetivo; não depender apenas da rota visual.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-029. **Responsável pela execução:** a registrar.

### CT-GR-030 Restringir professor e admin por finalidade

**Requisitos:** GRF-01; GRF-07; GRF-08; GRF-11. **Ambiente:** RLS/API; versões a registrar na execução.

**Pré-condições:** Dois docentes e admin técnico.

**Dados:** PROF-A consulta BD; admin tenta notas/frequência; aluno consulta agenda.

**Passos:** Executar leitura/escrita cruzada; consultar disponibilidade como aluno.

**Esperado:** Docente sem vínculo e admin técnico não recebem acesso pedagógico global; aluno vê sala/horário, sem motivo ou identidade de terceiros.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-030. **Responsável pela execução:** a registrar.

### CT-GR-031 Impedir autopromoção de perfil

**Requisitos:** GRF-01. **Ambiente:** Supabase RLS/Auth real; versões a registrar na execução.

**Pré-condições:** Aluno autenticado; papel fonte de verdade definido.

**Dados:** Tentativa de update de role e metadado user_metadata com admin.

**Passos:** Alterar papel diretamente via API e metadado editável; tentar operação admin.

**Esperado:** Papel protegido não muda por edição do cliente; metadado não concede privilégio; operação admin continua negada.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-031. **Responsável pela execução:** a registrar.

### CT-GR-032 Negar acesso anônimo aos dados acadêmicos

**Requisitos:** GRF-01. **Ambiente:** SQL/RLS/API; versões a registrar na execução.

**Pré-condições:** Migrações aplicadas; inventário de tabelas expostas.

**Dados:** Papel anon; operações SELECT/INSERT/UPDATE/DELETE.

**Passos:** Testar operações por tabela conforme matriz de permissões; inspecionar grants e RLS; repetir permissões autenticadas.

**Esperado:** Anon não acessa dados acadêmicos; tabelas expostas com RLS/grants adequados; políticas permitem apenas ações definidas; registrar cobertura tabela/operação.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-032. **Responsável pela execução:** a registrar.

### CT-GR-033 Impor integridade entre ofertas

**Requisitos:** GRF-04; GRF-05; GRF-07; GRF-08. **Ambiente:** SQL/RPC real; versões a registrar na execução.

**Pré-condições:** Matrícula PWEB e avaliação/aula BD existem.

**Dados:** Nota PWEB com avaliação BD; frequência PWEB com aula BD; peso inválido.

**Passos:** Enviar payloads incompatíveis diretamente ao backend; consultar registros.

**Esperado:** Constraints ou transação rejeitam cada combinação; zero escrita inválida; não confiar na lista de opções da UI.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-033. **Responsável pela execução:** a registrar.

### CT-GR-034 Preservar formulário quando falha a gravação

**Requisitos:** GRF-12. **Ambiente:** Cypress com falha controlada; integrado; versões a registrar na execução.

**Pré-condições:** Professor/admin com formulário preenchido.

**Dados:** Falha de rede no Supabase; erro de quota/storage na demo.

**Passos:** Provocar falha no adaptador; tentar salvar; recuperar serviço e reenviar uma vez.

**Esperado:** Erro acessível e dados preservados; zero sucesso antes da confirmação; rollback otimista correto; reenviar cria uma operação válida.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-034. **Responsável pela execução:** a registrar.

### CT-GR-035 Persistir e reiniciar apenas a demo

**Requisitos:** GRF-13. **Ambiente:** Cypress demo; versões a registrar na execução.

**Pré-condições:** Fixture base; chave externa ao Gralia no localStorage.

**Dados:** Alteração de nota ou matrícula; reset cancelado e confirmado.

**Passos:** Salvar; recarregar; cancelar reset; conferir; confirmar reset; conferir fixture e chave externa.

**Esperado:** Recarga mantém mudança; cancelar mantém estado; confirmar restaura fixture 1.0; chave externa permanece; modo Supabase não oferece reset.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-035. **Responsável pela execução:** a registrar.

### CT-GR-036 Operar pelos temas e teclado

**Requisitos:** GRF-14. **Ambiente:** Cypress + manual; versões a registrar na execução.

**Pré-condições:** Demo em tema claro e escuro.

**Dados:** Fluxos matrícula, notas e reserva.

**Passos:** Navegar com Tab/Shift+Tab/Enter/Espaço; alternar tema; verificar foco e pares de contraste.

**Esperado:** Controles operáveis e foco visível; status não depende só de cor; sem perda de texto; contraste medido nos estados usados.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-036. **Responsável pela execução:** a registrar.

### CT-GR-037 Gerenciar foco e erro nos formulários

**Requisitos:** GRF-12; GRF-14. **Ambiente:** Cypress + manual; versões a registrar na execução.

**Pré-condições:** Modal de reserva/reset; formulário inválido.

**Dados:** Abrir, navegar, fechar por Escape; gerar erro.

**Passos:** Verificar foco inicial, contenção no modal, Escape e retorno ao acionador; conferir label e anúncio de erro.

**Esperado:** Foco previsível e restaurado; campos associados a rótulos/erros; mensagem não depende só de toast; sem armadilha fora do modal.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-037. **Responsável pela execução:** a registrar.

### CT-GR-038 Manter fluxo em tela estreita e zoom

**Requisitos:** GRF-14. **Ambiente:** Cypress + inspeção manual; versões a registrar na execução.

**Pré-condições:** Telas principais com dados.

**Dados:** 320 CSS px; desktop; zoom 200%.

**Passos:** Percorrer matrícula, diário, notas e reserva nos tamanhos; ampliar a 200%; testar menu móvel.

**Esperado:** Sem controles ocultos ou sobreposição; leitura e ações preservadas; tabelas com alternativa ou rolagem localizada adequada; sem perda funcional.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-038. **Responsável pela execução:** a registrar.

### CT-GR-039 Verificar leitor de tela e auditoria automática

**Requisitos:** GRF-14. **Ambiente:** Manual NVDA/TalkBack + axe; versões a registrar na execução.

**Pré-condições:** Rotas e estados principais renderizados.

**Dados:** Login/demo, matrícula, boletim, diário e reserva.

**Passos:** Rodar axe nos dois temas; percorrer os fluxos por leitor de tela; registrar critérios verificados e falhas.

**Esperado:** Rótulos, ordem, títulos, status e erros compreensíveis; corrigir violações observadas; checklist não equivale a certificação geral. Parte manual não executada permanece pendente.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-039. **Responsável pela execução:** a registrar.

### CT-GR-040 Separar build integrada de recursos de demo

**Requisitos:** GRF-01; GRF-13. **Ambiente:** Build + inspeção e teste de configuração; versões a registrar na execução.

**Pré-condições:** Builds demo e Supabase disponíveis.

**Dados:** Ausência de env; bundle integrado; rota de perfil/reset; funções globais de teste.

**Passos:** Construir modos; inspecionar bundle e rotas integradas; iniciar sem configuração; falhar rede; conferir ausência de Manus/segredos.

**Esperado:** Integrado não inclui fixture, troca de perfil, reset, hook de teste ou segredo; erro de configuração não ativa demo; coletor/runtime Manus ausentes.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-040. **Responsável pela execução:** a registrar.

### CT-GR-041 Exibir home e agenda do vínculo correto

**Requisitos:** GRF-02; GRF-06; GRF-10. **Ambiente:** Cypress demo; integrado; versões a registrar na execução.

**Pré-condições:** Fixture restaurada; A e B em ofertas diferentes; aula e avaliação com datas conhecidas.

**Dados:** ALUNO-A, ALUNO-B; oferta PWEB; nova avaliação datada por PROF-A.

**Passos:** Entrar como A e conferir contagens/atalhos; abrir oferta e agenda; como PROF-A criar avaliação com data; voltar como A e recarregar; como B consultar sua home e agenda.

**Esperado:** Contagens derivam dos vínculos atuais; agenda de A mostra aula e nova avaliação PWEB com datas corretas; B não recebe eventos de A; ausência de eventos tem estado vazio explicativo; sem calendário institucional fictício.

**Obtido:** não preenchido. **Status:** Não executado. **Prioridade:** Alta. **Severidade:** não avaliada.

**Evidências previstas:** A produzir em docs/evidencias/<run-id>/CT-GR-041. **Responsável pela execução:** a registrar.

## Matriz de rastreabilidade

| Requisito | Casos planejados |
|---|---|
| GRF-01 | CT-GR-006, CT-GR-016, CT-GR-019, CT-GR-025, CT-GR-027, CT-GR-028, CT-GR-029, CT-GR-030, CT-GR-031, CT-GR-032, CT-GR-040 |
| GRF-02 | CT-GR-027, CT-GR-041 |
| GRF-03 | CT-GR-009, CT-GR-010, CT-GR-011 |
| GRF-04 | CT-GR-012, CT-GR-033 |
| GRF-05 | CT-GR-001, CT-GR-002, CT-GR-003, CT-GR-004, CT-GR-005, CT-GR-006, CT-GR-007, CT-GR-008, CT-GR-009, CT-GR-033 |
| GRF-06 | CT-GR-012, CT-GR-020, CT-GR-029, CT-GR-041 |
| GRF-07 | CT-GR-013, CT-GR-014, CT-GR-015, CT-GR-016, CT-GR-029, CT-GR-030, CT-GR-033 |
| GRF-08 | CT-GR-017, CT-GR-018, CT-GR-019, CT-GR-029, CT-GR-030, CT-GR-033 |
| GRF-09 | CT-GR-020 |
| GRF-10 | CT-GR-041 |
| GRF-11 | CT-GR-021, CT-GR-022, CT-GR-023, CT-GR-024, CT-GR-025, CT-GR-026, CT-GR-030 |
| GRF-12 | CT-GR-004, CT-GR-005, CT-GR-028, CT-GR-034, CT-GR-037 |
| GRF-13 | CT-GR-001, CT-GR-035, CT-GR-040 |
| GRF-14 | CT-GR-036, CT-GR-037, CT-GR-038, CT-GR-039 |

## Gate de entrega

Para a atividade: executar os dois casos prioritários no navegador, preservar relatórios e declarar o modo utilizado. Para validar integração: acrescentar Auth, RLS, integridade, recarga e concorrência reais. Para alegar acessibilidade verificada: registrar o subconjunto de critérios e o ensaio manual. Ausência de ambiente gera Bloqueado com motivo; ausência de execução gera Não executado. Falha observada gera Reprovado, com defeito e severidade contextualizados.

**Fontes técnicas de método:** Cypress Best Practices, https://docs.cypress.io/app/core-concepts/best-practices ; Supabase RLS, https://supabase.com/docs/guides/database/postgres/row-level-security ; consultadas em 15/11/2026. O detalhe de cada caso é desenho de teste deste projeto.
