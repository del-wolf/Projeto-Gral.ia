# Gral.ia — revisão da entrega

O ZIP anterior foi bloqueado pelo antivírus do usuário com a mensagem “Vírus detectado”. O antivírus, a ameaça e o arquivo interno afetado ainda não foram informados. **Não desative a proteção, não adicione exclusões e não libere o arquivo bloqueado.**

## Fontes abertas para inspeção

[prototipo-gralia — fontes legíveis no GitHub](https://github.com/del-wolf/Projeto-Gral.ia/tree/codex/gralia-fontes-v0.1.0/prototipo-gralia)

[Relatório da revisão e seus limites](https://github.com/del-wolf/Projeto-Gral.ia/blob/codex/gralia-fontes-v0.1.0/prototipo-gralia/docs/REVISAO_DOWNLOAD.md)

Essa entrega contém arquivos-fonte, sem builds, node_modules ou anexos de capturas/evidências. Os arquivos da aplicação foram preservados byte a byte; alterações se limitam à documentação e ao manifesto. Ela permite inspeção no navegador e **não é uma autorização para executar o software enquanto o alerta estiver sem identificação**.

## Resultado limitado

A revisão estática do pacote original não encontrou executáveis Windows ou indicadores estáticos claros de malware. A tentativa de varredura local com ClamAV 1.4.6 não foi concluída: a atualização oficial de assinaturas permaneceu inacessível por timeout. Nenhum código foi enviado a scanners públicos.

Não há conclusão de falso positivo nem certificação de ausência de malware. Para diagnosticar o bloqueio, é necessário o nome/código da ameaça e o caminho afetado no histórico de proteção do antivírus.

O ZIP foi retirado da ponta desta branch como medida de cautela. Seu histórico e checksum foram preservados para identificação. Isso não revoga URLs de commits anteriores; não use o link antigo para executar o pacote.

SHA-256 do arquivo originalmente entregue: `74b9deb6e67b1dfaea616c6de881ba47433c64241cb34d959307b146eb059143` (9.946.405 bytes).

O formulário de pesquisa, o Apps Script e a branch `main` foram preservados.
