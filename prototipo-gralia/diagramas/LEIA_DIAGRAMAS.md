# Diagramas do protótipo

Os arquivos são fontes editáveis de arquitetura e comportamento planejado. Não são capturas de uma aplicação executada. Abra .mmd em um renderizador Mermaid e .puml em PlantUML.

O diagrama de casos de uso trata login como uma operação própria e sessão válida como pré-condição. Não representa cada consulta como nova execução obrigatória de login. Os includes indicam validações integrantes da operação. Biblioteca e secretaria não aparecem porque foram retiradas desta rodada.

O modelo lógico omite atributos para favorecer a leitura. profiles corresponde à identidade Auth e pode ligar-se a um cadastro acadêmico; cadastro sem conta é permitido. A matriz de papéis impede tratar um perfil simultaneamente como aluno e professor nesta versão. FKs compostas ou validações transacionais devem garantir que notas e frequência pertençam à oferta correta; a mera existência das linhas no diagrama não impõe isso.
