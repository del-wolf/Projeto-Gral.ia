# Revisão do alerta de download — 17/11/2026

O navegador do usuário exibiu “Vírus detectado” ao baixar `Gralia_Codigo_Testavel.zip`. O antivírus, o nome da ameaça e o arquivo interno afetado ainda não foram informados. Esse alerta não foi classificado como falso positivo.

## Arquivo examinado e resultados limitados

Foi examinado o pacote original de 9.946.405 bytes, SHA-256 `74b9deb6e67b1dfaea616c6de881ba47433c64241cb34d959307b146eb059143`. Não foi examinada a cópia bloqueada ou colocada em quarentena no Windows; o nome do arquivo na captura não comprova igualdade dos bytes.

A análise estática verificou integridade ZIP e manifesto, nomes/caminhos, tipos reais de arquivos, conteúdo ativo e trechos de código. Os 222 itens do pacote original conferem com o manifesto; não foram identificados caminhos inseguros, symlinks, entradas criptografadas ou payload extra após o ZIP. Não havia PE/ELF/Mach-O nem executáveis/instaladores/scripts Windows como EXE, DLL, MSI, BAT, CMD, PS1, VBS ou LNK. As 52 imagens PNG tinham estrutura e CRC válidos; o SVG não continha script ou referência externa. Não foram encontrados indicadores estáticos claros de coleta oculta de credenciais ou execução ofuscada de payload nos trechos examinados. **Essas verificações não são um laudo antivírus e não provam ausência de malware.**

O lockfile usa o registro npm oficial. `npm audit --omit=dev --json --ignore-scripts` reportou zero vulnerabilidades conhecidas de runtime; esse resultado não detecta malware nem certifica as publicações dos pacotes. O projeto raiz não possui lifecycle próprio de instalação. Cypress possui pós-instalação que baixa seu binário de testes, e fsevents possui instalação opcional de macOS; nenhum node_modules foi incluído no pacote.

## Tentativa de varredura local

Foi instalado ClamAV 1.4.6 em contêiner descartável local. A atualização de assinaturas encontrou primeiro um erro de certificado. Após configurar no contêiner os certificados já confiados pelo ambiente, mantendo a validação TLS habilitada, o servidor oficial de assinaturas permaneceu inacessível por timeout. A segunda atualização terminou com código 11 e nenhuma base diária disponível. **A varredura antivírus não foi concluída: não há resultado “limpo” ou “zero infectados”.** Nenhum código ou ZIP foi enviado a scanners públicos, como VirusTotal.

## O que contém esta entrega de fontes

Esta pasta apresenta arquivos de texto legíveis para inspeção no GitHub. Foram excluídos os seis arquivos de build, 146 anexos de evidências e os dois documentos de distribuição do pacote anterior. Não contém o ZIP anterior, node_modules, builds, imagens de captura ou dependências instaladas. Não foi usado arquivo criptografado, ofuscação ou troca de extensão para atravessar o bloqueio.

Os arquivos de aplicação, testes, scripts, banco, fixtures e contratos npm foram preservados byte a byte. As alterações desta distribuição se limitam à documentação e ao manifesto de fontes. Os relatórios/capturas dos testes anteriores citados na documentação não estão incluídos nesta pasta, e não houve nova execução de testes funcionais nesta revisão de segurança.

## Próxima evidência necessária

Para investigar a causa do bloqueio, informe o antivírus, o nome/código da ameaça e o caminho do arquivo afetado. Se for Microsoft Defender, veja **Segurança do Windows → Proteção contra vírus e ameaças → Histórico de proteção**. Uma mensagem genérica do navegador não distingue detecção por assinatura, heurística ou reputação.

Por enquanto, leia os fontes no navegador. Não libere o ZIP bloqueado, não desative o antivírus e não adicione exclusões para executar o projeto. Os comandos nos demais documentos permanecem como referência técnica, não como autorização de segurança.
