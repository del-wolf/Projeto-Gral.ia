# Versões e fontes técnicas

Consulta em 15/11/2026, America/Sao_Paulo. As dependências diretas são fixadas sem intervalos no `package.json`; o `package-lock.json` registra a árvore reproduzível. O inventário efetivamente instalado e os comandos observados estão em `evidencias/2026-11-16T05-48-13-722Z-checks/resultado.json`, separadamente das fontes de compatibilidade.

## Ambiente e versões instaladas

| Ferramenta | Versão selecionada |
|---|---|
| Node.js | 24.22.1, linha 24 Krypton LTS |
| npm | 11.9.0 no ambiente de execução |
| React / React DOM | 19.3.1 |
| Vite / plugin React | 8.3.8 / 6.3.0 |
| TypeScript | 6.0.3 |
| Tailwind CSS / plugin Vite | 4.3.5 |
| Supabase JS | 2.119.0 |
| Supabase CLI | 3.1.0 |
| Vitest | 5.1.0 |
| Cypress | 15.21.2 |
| ESLint / typescript-eslint | 10.15.0 / 8.72.2 |
| Radix Dialog | 1.3.1 |
| class-variance-authority / clsx / tailwind-merge | 0.7.1 / 2.1.1 / 3.7.0 |
| lucide-react | 1.73.0 |
| cypress-axe / axe-core | 1.7.0 / 4.14.0 |

Cypress 16.3.0 era estável no registro consultado, mas `cypress-axe` 1.7.0 declara peer dependency até Cypress 15; foi fixado Cypress 15.21.2 sem forçar a instalação. TypeScript 7.0.2 era estável no registro consultado, mas não satisfazia o peer dependency de `typescript-eslint` (`<6.1`). A versão 6.0.3 mantém compatibilidade sem forçar a instalação. O projeto exige Node `>=24 <25`; o Cypress atual documenta suporte a Node 22.x, 24.x e >=26.x, e npm >=10.1.0. Vite documenta Node 20.19+ ou 22.12+; Node 24 atende a ambos.

shadcn/ui distribui código-fonte de componentes, não um runtime único a versionar. Os componentes locais usam os padrões shadcn e dependências fixadas; a instrução oficial Vite recomenda React + TypeScript, plugin Tailwind e aliases. Componentes locais devem ser revisados com a aplicação, incluindo semântica e foco.

## Documentação oficial consultada

| Assunto | Fonte e observação |
|---|---|
| Node LTS | https://nodejs.org/en/about/previous-releases — página obtida; linha 24 Krypton identificada como LTS |
| Calendário Node | https://raw.githubusercontent.com/nodejs/Release/main/schedule.json — calendário oficial obtido |
| Compatibilidade Vite | https://vite.dev/guide/ — página obtida; versão mínima de Node e template React/TS |
| React | https://react.dev/versions — página obtida; React 19.3 listado |
| Tailwind + Vite | https://tailwindcss.com/docs/installation/using-vite — acesso direto retornou HTTP403; consultado o código oficial da mesma página em https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/app/(docs)/docs/installation/(tabs)/using-vite/page.tsx |
| shadcn + Vite | https://ui.shadcn.com/docs/installation/vite — página obtida; React/TS, Tailwind e aliases |
| Cypress | https://docs.cypress.io/app/get-started/install-cypress — acesso direto retornou HTTP403; consultada fonte oficial https://github.com/cypress-io/cypress-documentation/blob/main/docs/app/get-started/install-cypress.mdx |
| Supabase JS | https://supabase.com/docs/reference/javascript/installing — página obtida; instalação do SDK |
| Supabase RLS | https://supabase.com/docs/guides/database/postgres/row-level-security — fonte de políticas e isolamento |
| PostgreSQL intervalos | https://www.postgresql.org/docs/current/rangetypes.html — referência para exclusão por `tstzrange` |
| WCAG 2.2 | https://www.w3.org/TR/WCAG22/ — critérios de acessibilidade a verificar |
| eMAG 3.1 | https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/acessibilidade-digital/modelo-de-acessibilidade — referência brasileira |

As páginas acima orientaram a escolha de stack e compatibilidade. As versões exatas também foram conferidas no registro npm antes da instalação. Não foi executado comando `npm install ...@latest` no projeto. O changelog e as referências Supabase consultados pelo responsável do backend estão em `docs/referencias-tecnicas/`.

## Reproduzir o inventário instalado

Na raiz, após `npm ci`:

```powershell
node --version
npm --version
npm ls --depth=0
npx cypress version
npx supabase --version
```

O binário Cypress é uma instalação separada do pacote npm; se o download falhar, não considerar navegador testado até executar a suíte. Versões de Chromium/Electron, SO, hash do código e fixture devem ser lidas no relatório real em `docs/evidencias/`.

## GitHub Actions preparado

O workflow usa `ubuntu-24.04`, Node 24.22.1 e referências exatas das actions oficiais estáveis consultadas no GitHub: `actions/checkout@v7.0.1`, `actions/setup-node@v7.1.0` e `actions/upload-artifact@v7.0.2`. Os arquivos `action.yml` desses tags foram conferidos: usam runtime Node 24 e preservam os inputs usados (`node-version`, `cache`, `name`, `path`, `if-no-files-found`). Consulta não equivale à execução de um workflow remoto, que não foi realizada.

- https://github.com/actions/checkout/releases/tag/v7.0.1
- https://github.com/actions/setup-node/releases/tag/v7.1.0
- https://github.com/actions/upload-artifact/releases/tag/v7.0.2
