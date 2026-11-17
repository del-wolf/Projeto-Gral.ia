# Gral.ia — pacote testável 0.1.0

[Baixar Gralia_Codigo_Testavel.zip](./Gralia_Codigo_Testavel.zip?raw=true)

O ZIP contém o projeto completo na pasta `Gralia`: código React/TypeScript, demo local persistente, adaptador Supabase, migrações, lockfile, builds, README e evidências reais.

## Executar no Windows / VS Code

Instale Node 24 LTS, extraia o ZIP e abra a pasta `Gralia` no VS Code. No terminal:

```powershell
npm ci
npm run dev
```

Abra http://127.0.0.1:5173. A demo não exige conta externa, chave de API ou Docker. Use `ADMIN-QA` para testar matrículas; o README do pacote detalha as contas fictícias de aluno e professor e o reset.

## Evidências e limites

Passaram TypeScript, ESLint, as duas builds, 36 testes Vitest, 15 Cypress (incluindo CT-GR-001/002) e 44 testes PostgreSQL/RLS/concorrência. O banco local usa sujeitos JWT simulados; Auth/GoTrue e API HTTP Supabase completos ficaram bloqueados por espaço Docker. Windows, leitor de tela, zoom manual e Android permanecem pendentes.

O formulário de pesquisa, o Apps Script e os arquivos anteriores do repositório foram preservados. O ZIP usa dados sintéticos e não inclui o CSV pessoal, credenciais, node_modules ou diretório Git.

SHA-256 do ZIP: `74b9deb6e67b1dfaea616c6de881ba47433c64241cb34d959307b146eb059143`.

[Arquivo de checksum](./Gralia_Codigo_Testavel.zip.sha256)
