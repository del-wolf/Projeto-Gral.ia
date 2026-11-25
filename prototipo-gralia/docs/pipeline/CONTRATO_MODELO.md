# Contrato: <operação> — versão <n>

Status: proposto / combinado / implementado / validado no modo indicado.

## Fonte executável

- Interface/tipo real e caminho:
- Adaptadores demo/Supabase:
- Função SQL/RPC/migração, se pertinente:
- Requisito GRF:
- Commit de referência:

Conferir os nomes existentes antes de propor novos. Este documento descreve o contrato e aponta para o tipo executável; não o duplica como outra fonte de verdade.

## Comportamento

| Item | Definição |
| --- | --- |
| Perfil e vínculo necessários | <quem pode executar> |
| Entrada | <campos, tipos e valores válidos> |
| Identidade confiável | <origem da sessão e verificação de vínculo> |
| Resultado de sucesso | <tipo retornado e efeito persistente> |
| Recurso ausente | <retorno efetivo esperado> |
| Erros de domínio | <códigos estáveis já existentes ou mudança proposta> |
| Transação/concorrência | <garantia exigida> |
| Confirmação de gravação | <momento em que a UI pode mostrar sucesso> |
| Fuso/decimais/pendências | <regras pertinentes> |

## Cenários de aceite

1. Operação permitida.
2. Entrada inválida.
3. Acesso cruzado ou sessão sem permissão.
4. Falha do armazenamento/serviço.
5. Recarga e leitura independente.
6. Concorrência, quando aplicável.

## Compatibilidade e integração

- Consumidores afetados:
- Migração nova:
- Ordem de integração:
- Como atualizar a base dos agentes:
- Evidências e limites:

Mudança incompatível exige atualizar este acordo, tipos, adaptadores e testes relacionados antes de retomar a integração paralela.
