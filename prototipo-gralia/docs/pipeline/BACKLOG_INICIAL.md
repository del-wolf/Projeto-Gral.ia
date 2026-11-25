# Backlog de adoção do pipeline

Proposta ordenada, sem prazo fixado. As tarefas verificam e completam o código existente; não representam autorização para reescrever o aplicativo inteiro. Todos os itens abaixo estão **A fazer**. A inspeção documental da proposta não conclui uma instalação ou teste.

| ID | Resultado | Responsável principal | Aceite |
| --- | --- | --- | --- |
| P0 | Base e execução local preparadas | Igor + Codex | Confirmar a fonte; identificar a pendência de antivírus do README/revisão; inspecionar dependências e scripts; depois executar somente o fluxo revisado; consolidar branch gralia |
| P1 | Mapa de um fluxo real | Igor com orientação dos dois agentes | Seguir nota da tela ao domínio, adaptador e SQL; registrar caminhos; explicar demo versus Supabase |
| P2 | Integração Auth/API e isolamento verificados | Codex; Antigravity nos estados de sessão; Igor no roteiro | Sessões reais sintéticas; logout/troca de usuário; leituras próprias e negadas; HTTP/E2E no ambiente descartável compatível |
| P3 | Primeiro ciclo guiado sobre notas | Igor + Codex + Antigravity | Contrato, pequena melhoria observada, trecho de Igor, zero distinto de pendência, recarga, acesso cruzado e revisão |
| P4 | Frequência e vínculos conferidos | Mesma divisão | Pendente não vira presença; docente apenas na própria oferta; dados e erros coerentes |
| P5 | Reserva e cancelamento validados em conjunto | Codex no banco; Antigravity na interação; Igor no caso | Conflito atômico, adjacência, fuso, preservação de dados no erro e duas sessões reais no teste de concorrência |
| P6 | Acessibilidade e CI da base concluídas no escopo declarado | Igor + agentes conforme área | Ensaio manual; workflow na raiz Git adaptado ao subdiretório; execução real dos jobs; documentação das lacunas |

P2 trata uma lacuna registrada no estado da implementação; não supõe ausência do adaptador ou necessidade de outro backend. Não criar contas reais de alunos. Os runners Supabase atuais exigem instância local descartável; registrar o bloqueio se o computador não comportar a stack e planejar executor apropriado.

## Exercício piloto de P1/P3

**Pergunta:** o que acontece quando PROF-A altera uma nota e ALUNO-A recarrega o boletim?

1. Igor localiza o evento e a chamada feita pela tela.
2. Codex aponta o contrato, a validação, o adaptador e a proteção no banco.
3. Antigravity explica renderização, estado de envio e mensagem de erro.
4. Igor assume uma melhoria pequena, escolhida após observar uma lacuna: por exemplo, um estado de erro específico ou um teste de regressão de comportamento ainda sem cobertura.
5. Os agentes revisam a tentativa e verificam os cenários afetados.

Se o comportamento já estiver correto e coberto, P1 pode ser uma leitura guiada e uma demonstração. Não introduzir defeito nem reimplementar a operação apenas para criar exercício.

## Critérios para liberar trabalho paralelo

- Contrato identificado e integrado na base dos dois agentes.
- Cada arquivo tem responsável por edição.
- Passagem registra branch e commit.
- Igor consegue inspecionar o diff e navegar entre as pastas.
- Banco/fixture têm responsável e agenda ou instâncias independentes.
- Checks básicos do primeiro ciclo foram executados e compreendidos.

## Fora desta adoção

Secretaria, biblioteca, serviços pagos, dados institucionais reais, integração com plataformas escolares e orquestrador de agentes próprio não são tarefas deste backlog. Capacitor e publicação recebem etapas posteriores próprias.
