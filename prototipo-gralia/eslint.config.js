import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
export default tseslint.config({ignores:['dist/**','node_modules/**','docs/**','supabase/**']},js.configs.recommended,...tseslint.configs.recommended,{files:['**/*.{ts,tsx,js,mjs}'],languageOptions:{globals:{...globals.browser,...globals.node,cy:'readonly',Cypress:'readonly',describe:'readonly',it:'readonly',beforeEach:'readonly',expect:'readonly',__DEMO__:'readonly'}},rules:{'@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}]}});
