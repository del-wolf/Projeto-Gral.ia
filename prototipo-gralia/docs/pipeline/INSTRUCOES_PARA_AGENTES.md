# Instruções para adotar o pipeline

Estes blocos são modelos de configuração. Nesta proposta, AGENTS.md e README.md da aplicação permanecem como estavam e GEMINI.md não é criado automaticamente.

## Regras comuns

Combinar o bloco abaixo com AGENTS.md da pasta prototipo-gralia, preservando todas as regras existentes. Se houver conflito com uma decisão mais recente de Igor, registrar o ajuste pertinente.

~~~markdown
## Desenvolvimento com agentes e aprendizado

Usar docs/pipeline/README.md para o processo local com Igor, Codex e Antigravity. Codex lidera domínio, adaptadores, Supabase e banco; Antigravity lidera interface. O cartão da tarefa pode atribuir a Igor arquivos/trechos de qualquer camada.

Padrão: pareamento guiado. Explicar brevemente intenção, arquivos e decisões de projeto; implementar a parte atribuída em mudanças pequenas. Reservar um exercício concreto para Igor no cartão. Não editar esse trecho durante a prática dele; dar pistas e revisar a tentativa. Solução completa do exercício pode ser fornecida quando Igor pedir. O restante da tarefa autorizada pode continuar sem pedir confirmação a cada ação.

Uma tarefa por vez no início, com edição em turnos. Para editar em paralelo, usar branches em worktrees diferentes e contrato combinado. Worktrees não isolam banco: migrações, preparação de fixture e testes que alteram o mesmo banco têm um responsável por vez.

Antes de continuar trabalho de outro agente, ler tarefa, contrato e passagem e conferir branch/commit. Registrar testes executados e limites. Não presumir sincronização de chats nem carregamento automático dos modelos em docs/pipeline. Respeitar a preparação pendente descrita no README antes de executar o aplicativo.

Revisão de agente complementa a revisão de Igor. Integração e publicação são decisões separadas; não fazer merge ou publicação automáticos. Preservar o formulário e a aplicação existente durante a adoção deste processo.
~~~

## Ponte para o Antigravity

Criar GEMINI.md dentro de prototipo-gralia com o conteúdo abaixo, depois de combinar as regras comuns.

~~~markdown
# Antigravity no Gralia

Leia AGENTS.md como regra comum e docs/pipeline/README.md como processo. Abra prototipo-gralia como workspace e confirme as instruções carregadas.

Papel padrão: frontend. Leia o cartão, o contrato e a passagem indicada no prompt. Use os adaptadores existentes, preserve os arquivos do backend e o trecho reservado a Igor. Explique as decisões e trabalhe em pequenas alterações, com a prática de Igor delimitada.

Esta orientação complementa AGENTS.md. Não há comunicação automática com o Codex: a passagem acontece por arquivos e commits.
~~~

## Conferência da adoção

Abrir prototipo-gralia como workspace nos dois produtos. Iniciar uma nova sessão e pedir: "Identifique os arquivos de instruções carregados e resuma sua responsabilidade nesta tarefa". Conferir o trecho reservado a Igor e o contrato. Esta verificação é leitura; não exige iniciar o aplicativo.

Não copiar perfis globais de outros projetos ou substituir as instruções atuais por inteiro. Tarefas, contratos e passagens são carregados pelos caminhos informados no prompt.
