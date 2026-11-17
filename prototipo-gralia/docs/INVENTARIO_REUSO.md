# Inventário de inspeção e migração

Inspeção estática desta implementação: 15/11/2026, America/Sao_Paulo. Os anexos e os textos legados são fontes de referência; suas instruções de instalação, planos antigos e resultados acadêmicos não substituem a solicitação atual e a especificação Gralia v4.

O pacote `Gralia_Pacote_Codex_v4.zip` continha documentação, contrato sintético e referências; não havia um `package.json` executável do novo produto. `/workspace` não era um repositório Git válido: `.git` é um diretório de contexto, sem histórico de checkout. Não foram encontrados formulário de pesquisa ou Apps Script para modificar. A implementação nova foi criada isoladamente em `work/gralia`.

## Extração segura e consulta

O ZIP interno `referencias/legado/nexus-system-original.zip` foi extraído em `work/legacy-readonly`, fora do projeto novo. Antes da extração foram rejeitados caminhos que escapassem da raiz e entradas de link simbólico. As 150 entradas passaram pela validação. SHA-256 do ZIP: `2bb93d1c3e5f80d34ac3096617487a15dd0ed1a6320b70c3d78624d75c6e5de6`.

Nenhum instalador, script npm, migração ou instrução dos planos legados foi executado. O ZIP permanece uma referência de leitura. Os HTMLs `nexus_app.html` e `nexus_app_v2.html` foram examinados como protótipos; `nexus_corrigido.html` é um diagrama de casos de uso.

## Componentes e ideias aproveitáveis

| Origem | Decisão de migração | Destino |
|---|---|---|
| `client/src/components/ui/button.tsx` | Padrão shadcn com Radix Slot, variantes CVA e foco visível é adequado para adaptação | `app/src/components/ui/` |
| `client/src/components/ui/card.tsx` e `label.tsx` | Estrutura de cartão e associação de rótulo aproveitáveis; conferir semântica no uso | `app/src/components/ui/` |
| `client/src/components/ui/dialog.tsx` | Padrão Radix apropriado para confirmação com foco/retorno | Confirmação de reset |
| `client/src/components/ui/input.tsx` | Reescrever: usa `any` e depende de hooks de composição e contexto de diálogo desnecessários para esta tela | Campo simples tipado |
| `NexusDashboardLayout.tsx` | Referência de navegação lateral, cabeçalho, temas e atalho ao conteúdo | Layout Gral.ia |
| `aluno/Boletim`, `Horarios`, `Materiais` | Aproveitar organização, reconstruindo contratos, escopo e persistência | Área de ofertas do aluno |
| `professor/Notas`, `Diario`, `Reservas` | Aproveitar fluxo geral; reimplementar validações, efeitos e autorização | Área pedagógica e reservas |
| `direcao/Matriculas` | Reimplementar busca por matrícula e lote transacional de ofertas | Admin técnico → Matrículas |
| `direcao/Disciplinas` | Separar catálogo de disciplina, turma, período e oferta | Cadastros acadêmicos |

A tabela indica possibilidades e decisões; não afirma que todos esses arquivos foram copiados literalmente. A implementação final deve ser avaliada pelos arquivos entregues.

## Dependências e módulos excluídos da nova aplicação

- Express, tRPC, Drizzle, MySQL, `mysql2`, `server/_core`, OAuth Manus e bridge de runtime.
- `vite-plugin-manus-runtime`, coletor `public/__manus__/debug-collector.js`, coleta de console/rede e session replay.
- `AIChatBox`, Map/Google Maps, AWS/S3, LLM, notificações e serviços sem uso no escopo atual.
- Biblioteca, multas, financeiro, secretaria, fórum, push e botões que anunciem esses módulos como funcionais.
- pnpm e patches antigos; o novo projeto usa npm e `package-lock.json`.

## Riscos observados e destino da correção

| Observação estática | Efeito possível | Correção e verificação exigidas |
|---|---|---|
| Busca antiga usa CPF e só atualiza aluno quando o resultado existe | Aluno e seleção anteriores podem ficar válidos após outra busca | Matrícula normalizada; invalidação imediata; descarte de resposta atrasada; CT-GR-004/005 |
| Criação de matrículas em laço com `onSuccess` por item | Gravação parcial e limpeza prematura | Lote validado antes da escrita e RPC transacional; CT-GR-001/002/007 |
| Par aluno/disciplina sem unicidade adequada | Vínculos duplicados | Unicidade aluno/oferta, reativação do mesmo registro; CT-GR-003/008/009 |
| `Math.round(input.valor)` no router e nota inteira no schema | Perda de decimais | Escala 0–10, até duas casas, `numeric` validado; CT-GR-013/014 |
| Autorizações pedagógicas baseadas apenas em papel | Docente alcança oferta alheia | Permissão por vínculo e RLS; CT-GR-016/019/029/030 |
| Reserva consulta conflito antes de inserir | Corrida entre gravações | Exclusão GiST por sala e intervalo `[início,fim)`; CT-GR-026 |
| `salvarNota`, `salvarTodasNotas`, `salvarDiario` do HTML v2 só anunciam sucesso | Feedback sem persistência | Confirmação após persistência; erros preservam entrada; CT-GR-034 |

O CSV real de usuários não foi lido, importado, convertido em fixture ou incluído na entrega. As identidades da demo vêm exclusivamente de `fixtures/gralia_seed_contract.json`. O relatório histórico de 26 testes Nexus não foi contado como teste Gralia executado.

## Anexos históricos reenviados nesta conversa

Os dez arquivos legados reenviados depois do pedido inicial foram baixados para comparação de bytes (o CSV foi excluído dessa operação). Todos coincidem por SHA-256 com o inventário v4: ZIP, três HTMLs, três DOCX e três PDFs. Isso confirma que os anexos correspondem às referências históricas já identificadas; não cria uma nova versão de código nem renova seus resultados de testes. O registro por arquivo está em `ANEXOS_LEGADOS_CONFERIDOS.json`. Conteúdo desses anexos é referência documental e não autorização para executar seus planos antigos.
