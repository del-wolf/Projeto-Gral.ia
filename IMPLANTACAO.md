# Gral.ia — implantação e teste de aceite

Versão corrigida: 2.0 • Revisão: 23/09/2026

Os arquivos estão preparados e testados localmente. Esta entrega não publicou alterações no GitHub nem no Apps Script e não inseriu respostas na planilha real.

## 1. Preparar a atualização

1. Pause a divulgação/coleta durante a troca de versão. O HTML antigo mostra sucesso sem confirmação; deixá-lo em uso com a API nova pode enganar participantes.
2. Faça uma cópia de segurança da planilha e do código implantado. As correções preservam os dados antigos, mas não recuperam campos que nunca foram armazenados.
3. No Google Sheets, confira o arquivo **Entrevista Projeto Gral.ia**, ID `1BdVwL6gfQVytVNyr6lkGCDxQ11pv36A5HbwKlpL235Y`.
4. Em **Compartilhar → Acesso geral**, restrinja a planilha à equipe responsável, caso as respostas individuais não sejam destinadas à publicação. Na inspeção, o arquivo estava como `anyone / reader`, isto é, leitura para qualquer pessoa com o link. Isso não é necessário para receber respostas pelo Web App.
5. Preserve a aba `Respostas`. As abas `Respostas ao formulário 1` e `Página1` não são usadas pelo código entregue.

## 2. Instalar o Apps Script

1. Abra **Extensões → Apps Script** na planilha correta.
2. Substitua o código antigo pelo conteúdo integral de `Gralia_AppsScript.js`, em um arquivo `.gs` do projeto. O nome do arquivo pode ser `Codigo.gs`; as funções `doPost` e `doGet` devem existir uma única vez no projeto.
3. Confira as constantes `SPREADSHEET_ID`, `SHEET_NAME` e `FORM_VERSION`. Elas já contêm os valores desta pesquisa.
4. Use o runtime V8. Confira o fuso do projeto: `America/Sao_Paulo`. O fuso da planilha inspecionada já era esse; a formatação de células segue o fuso da planilha.
5. Execute **verificarConfiguracao** no editor e autorize o acesso à planilha. Essa função só consulta configuração. O log deve mostrar o arquivo esperado, a aba `Respostas` e `esquema: "legacy"` ou `"current"`.
6. Se aparecer `incompatible`, compare os cabeçalhos com o relatório. Não renomeie, apague nem mova colunas com dados para forçar a execução. Use uma cópia para investigar.
7. Execute **prepararPlanilha**. Ela acrescenta os cabeçalhos M:U ao esquema antigo, sem criar respostas de teste e sem preencher os campos das respostas históricas.
8. Confira A:L preservadas e M:U novas. `verificarConfiguracao` deve passar a mostrar `current`.

O primeiro POST válido também pode preparar o esquema, mas executar a preparação antes de reabrir a pesquisa torna a mudança revisável.

## 3. Publicar a API

1. Em **Implantar → Gerenciar implantações**, edite a implantação existente, escolha **Nova versão** e publique. Salvar o código no editor, sozinho, não atualiza uma implantação versionada.
2. Configure a execução como a conta que tem acesso de edição à planilha. Para a pesquisa pública sem login, o acesso do **Web App** precisa permitir participantes sem autenticação, quando essa opção estiver disponível na conta/instituição.
3. Se a instituição bloquear acesso anônimo, resolva isso com o responsável pela conta ou adote uma distribuição autenticada e revise o aviso aos participantes. Não contorne as restrições da instituição.
4. Copie a URL terminada em `/exec`. Não use `/dev`, pois ela é destinada ao teste com usuários autorizados no projeto.
5. Abra a URL em uma janela anônima. A API revisada deve responder:

```json
{"status":"ready","api_version":"2.0"}
```

Isso confirma a publicação de `doGet` e a versão, **não** confirma acesso à planilha nem uma gravação. Se aparecer “Função de script não encontrada: doGet”, a URL ainda atende código sem essa função ou outra implantação. Esse foi o resultado do GET da implantação antiga durante a revisão; a ausência de `doGet` não prova falha do POST antigo.

## 4. Publicar o formulário

1. Confira em `index.html` a constante `SHEETS_URL`. Ela mantém a URL encontrada no anexo; altere somente se a implantação fornecer outra URL.
2. Atualize o `index.html` do repositório/site que você usa para divulgar a pesquisa. **A página `/blob/main/index.html` do GitHub exibe o código; ela não é o formulário publicado.** Abra o endereço público efetivo do site para testar. O endereço de publicação não foi confirmado nesta revisão.
3. Publique a atualização do site, confira a versão carregada e solicite que participantes com a página antiga aberta a atualizem antes de responder.
4. Não publique `testes/teste_navegador.html` como formulário de coleta: essa página simula a API e não envia respostas reais.

## 5. Teste real obrigatório

Faça primeiro em uma cópia/implantação de homologação; se testar na planilha de coleta, identifique os registros como `TESTE — excluir da análise` e trate-os separadamente na análise.

1. Abra o formulário no endereço publicado, em janela anônima e também no celular.
2. Preencha todas as obrigatórias e os opcionais do perfil Aluno. Use texto de teste em Q6, Q7, Q8 e Q10.
3. Envie e aguarde **Gravação confirmada** com o UUID do comprovante.
4. Na aba `Respostas`, busque esse UUID na coluna **R**. Deve existir **exatamente uma linha**.
5. Confira todas as colunas contra o preenchimento, inclusive nível M, resposta do aluno I, funcionalidades J, pontos positivos P e outras plataformas Q.
6. Repita com Professor, Direção e Biblioteca; as respostas específicas devem aparecer respectivamente em H, N e O. As outras colunas de perfil devem ficar vazias nessa linha.
7. Na rede do navegador, confirme POST, corpo JSON em `text/plain;charset=utf-8`, resposta JSON com `status: "ok"`, `api_version: "2.0"` e `response_id` igual ao comprovante.
8. Simule perda da resposta/timeout em homologação e repita sem recarregar a aba. **Tentar confirmar envio** deve usar o mesmo UUID e manter uma única linha.

## 6. Se houver erro de CORS ou de resposta

- O formulário usa `mode: 'cors'`, MIME simples `text/plain` e segue redirecionamentos. O texto continua sendo JSON; o Apps Script interpreta `e.postData.contents`.
- O MIME evita o preflight provocado por `application/json` em requisições CORS, mas **não garante** que a implantação forneça os cabeçalhos e redirecionamentos necessários à leitura da resposta.
- Confira URL `/exec`, nova versão publicada, acesso sem login e “Executar como” a conta com acesso à planilha. Inspecione também o histórico **Execuções** do Apps Script.
- O Content Service redireciona a resposta para `script.googleusercontent.com`. O navegador precisa conseguir acompanhar a resposta real.
- Um erro HTTP, página de login/HTML, versão antiga, JSON inválido ou UUID errado impede a tela de sucesso.
- `doOptions` e `.setHeader()` em `TextOutput` não são a solução documentada do Apps Script para configurar CORS. Não acrescente métodos inexistentes.
- Não volte a `mode: 'no-cors'` para anunciar sucesso: esse modo torna a resposta opaca.
- Se a configuração correta ainda não permitir a confirmação no endereço público, a liberação fica pendente. Alternativas exigem uma mudança de arquitetura: hospedar o formulário em HtmlService e usar `google.script.run`, ou usar um backend/proxy controlado com CORS configurável. Nenhuma dessas alternativas foi implementada nesta entrega.

## 7. Reenvio e limitações

- Uma falha de comunicação não prova que o servidor deixou de gravar. O navegador conserva o envio em memória e reapresenta **Tentar confirmar envio** com os mesmos dados e UUID.
- Enquanto a confirmação está incerta, os campos e o botão de limpeza ficam bloqueados para não alterar o conteúdo do mesmo envio. Erros explícitos de validação anteriores à gravação liberam edição.
- Fechar/recarregar a página perde esse estado. A entrega não usa armazenamento persistente de respostas no dispositivo. Um novo preenchimento depois disso pode gerar outra linha.
- A deduplicação é por envio, não por pessoa. Um participante pode iniciar outra resposta e receber outro UUID. O hash não é assinatura digital nem autenticação.
- O lock coordena execuções deste projeto Apps Script; não bloqueia edições manuais nem outro projeto independente escrevendo na mesma aba.
- O endpoint permanece público para coleta. Validação e limite de tamanho reduzem dados inválidos, mas não substituem proteção contra spam ou esgotamento de cotas.

## 8. Repetir os testes locais

Na pasta `Gralia_Revisado`:

```bash
npm install
python testes/gerar_teste_navegador.py
npm run test:frontend
npm run test:backend
```

O teste de frontend usa jsdom e mantém o timeout real de 25 segundos. Os testes de backend usam serviços Google simulados. O último teste de backend lê o payload produzido pelo teste do HTML. Os resultados dessa revisão estão na pasta `testes`.

Sem Node.js, abra `testes/teste_navegador.html` no navegador e clique em **Executar testes do formulário**. A página contém um aviso de simulação e não grava respostas no Google Sheets. A rede real/CORS e a interpretação de células precisam dos testes de aceite acima.
