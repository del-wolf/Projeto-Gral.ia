# Migração do Nexus para o Gralia

Inspeção estática realizada em 15/11/2026. O novo código será produzido pelo Codex. Os documentos originais e os snapshots legados foram preservados.

## Referência correta

Use o ZIP como principal referência de código. Ele declara React 19.2.1 e Tailwind 4, enquanto a Especificação v3 ainda cita React 18. Essa divergência demonstra por que versões não devem ser copiadas apenas do texto. O alvo é a stack Gralia, com versões verificadas na implementação.

O arquivo nexus_corrigido.html tem título de Diagrama de Casos de Uso Corrigido; ele não é uma versão corrigida completa do aplicativo. Os outros dois HTMLs possuem interação demonstrativa. Em nexus_app_v2.html, salvarNota, salvarTodasNotas e salvarDiario apenas anunciam sucesso nas funções inspecionadas, sem gravar em repositório persistente.

## Correspondência da Especificação Nexus v3

| ID antigo na v3 | Intenção | Destino Gralia |
|---|---|---|
| RF01 | Horários do aluno | GRF-10 agenda da oferta, sem importação institucional |
| RF02 | Disciplinas com matrícula ativa | GRF-05 e GRF-06 |
| RF03 | Notas e frequência | GRF-07 e GRF-08 |
| RF04 | Materiais | GRF-09, links e recurso sintético |
| RF05 | Diário e falta justificada | GRF-08; falta justificada e dados médicos adiados |
| RF06 | Lançamento de notas | GRF-07, decimal e permissão por oferta |
| RF07 | Reservar/cancelar sala | GRF-11 obrigatório |
| RF08 | Bloquear conflito | GRF-11 com garantia no banco |
| RF09 | Matrícula pela direção | GRF-05 com admin técnico mínimo |
| RF10 | Cadastro de disciplinas | GRF-04 e configuração mínima |
| RF11 | Painel de reservas | GRF-11 por escopo de usuário; admin operacional |
| RF12 | Empréstimos e devoluções | Fora desta rodada; biblioteca opcional futura |
| RF13 | Multas e cobranças | Fora desta rodada |

## Correspondência de docs/requisitos.md do ZIP

O ZIP usa outra numeração. Não citar apenas RF09 ou RF12 sem informar a origem.

| ID do código legado | Intenção | Destino Gralia |
|---|---|---|
| RF01 | Autenticação | GRF-01, Supabase ou simulação demo explícita |
| RF02 | Perfil | GRF-01 e matriz RLS por vínculo |
| RF03 | Dashboard | GRF-02 |
| RF04 | Horários | GRF-10 |
| RF05 | Boletim | GRF-07 |
| RF06 | Materiais | GRF-09 |
| RF07 | Frequência | GRF-08 |
| RF08 | Notas de 0 a 100 | GRF-07, proposta demo de 0 a 10 sem conversão automática |
| RF09 | Reserva | GRF-11 |
| RF10 | Conflito | GRF-11, restrição transacional |
| RF11 | Painel institucional | GRF-11 com escopo mínimo |
| RF12 | Matrículas | GRF-05 |
| RF13 | Disciplinas | GRF-04 |
| RF14 | Empréstimo | Adiado |
| RF15 | Devolução | Adiado |
| RF16 | Consulta local | Adiado com biblioteca |
| RF17 | Multa | Excluído desta rodada |
| RF18 | Documentação na aplicação | Ajuda curta e documentação técnica fora do fluxo do aluno |

## O que reaproveitar e o que reimplementar

| Origem | Ação |
|---|---|
| client/src/components/ui | Reutilizar componentes pertinentes depois de conferir acessibilidade e versão |
| NexusDashboardLayout | Adaptar navegação, identidade, temas e escopo de perfis |
| aluno/Boletim, Horarios, Materiais | Reutilizar ideias de apresentação; trocar dados, contratos e permissões |
| professor/Notas, Diario, Reservas | Reescrever efeitos e regras; preservar organização útil da interface |
| direcao/Matriculas | Migrar para admin técnico, busca por matrícula e ofertas; corrigir resultado obsoleto e lote parcial |
| direcao/Disciplinas | Evoluir para catálogo, turmas, períodos e ofertas |
| server/authorization.ts | Reaproveitar intenção dos testes, não supor equivalência automática com RLS |
| drizzle/schema.ts e server/db.ts | Usar como inventário; criar PostgreSQL e migrações próprias |
| server/routers.ts | Reespecificar domínio, validação, transações e contratos dos adaptadores |
| server/_core e lib/trpc | Não transportar dependência Manus/tRPC para o novo produto |
| vite.config.ts e public/__manus__ | Criar configuração limpa; retirar coletor de logs/rede/session replay |
| bibliotecaria/* | Manter apenas no arquivo histórico, fora das rotas e bundle do Gralia |
| AIChatBox, Map e integrações externas | Não incluir sem função exigida no escopo atual |

## Riscos encontrados e testes correspondentes

| Evidência de leitura | Risco a testar | Caso |
|---|---|---|
| notas.create exige papel e matrícula ativa, sem verificar professor da oferta | Professor alterar oferta alheia | CT-GR-016 e CT-GR-030 |
| frequencias.register repete esse padrão | Escrita cruzada de frequência | CT-GR-019 e CT-GR-030 |
| getByMatricula permite caminhos amplos para staff | Leitura pedagógica fora do escopo | CT-GR-029 e CT-GR-030 |
| matriculas não possui unique aluno/disciplina | Duplicidade e clique concorrente | CT-GR-003 e CT-GR-008 |
| criação percorre ofertas em chamadas separadas | Falha parcial e limpeza precoce | CT-GR-007 |
| setAlunoEncontrado só ocorre quando a consulta retorna aluno | Uso de aluno anterior após busca vazia | CT-GR-004 |
| reservas.create consulta conflitos antes do insert | Corrida de gravação | CT-GR-026 |
| Math.round na nota e coluna int | Perda de precisão e zero confundido com vazio na UI | CT-GR-013 e CT-GR-014 |

Esses testes devem verificar o novo comportamento. Não foi afirmado que cada risco foi explorado com sucesso no legado. O relatório de 26 testes do Nexus não comprova cobertura desses cenários.

## Diferença em relação ao trabalho acadêmico anterior

| Aspecto | Trabalho Nexus de 14/11 | Novo ensaio Gralia |
|---|---|---|
| Perfil | Direção controlada pelo teste | Admin técnico, fictício ou autenticado conforme modo |
| Busca | CPF artificial | Matrícula QA2026001 |
| Vínculo | disciplinaId | ofertaId, com turma e período |
| Execução | Componente em jsdom e appRouter; dependências simuladas | Cypress no navegador e, em rodada separada, Supabase |
| Persistência | Adaptador de teste em memória | Demo local persistente ou banco real identificado |
| IDs | CT-001 e CT-002 | CT-GR-001 e CT-GR-002 |
| Resultado | Aprovados naquele escopo histórico | Não executados até a nova implementação |

O hash do ZIP atual é diferente do hash registrado no trabalho. Não inferir igualdade de código pelo nome do arquivo. Para fazer comparação de conteúdo, seria necessário recuperar também o snapshot exato anterior; essa comparação não foi realizada nesta etapa.
