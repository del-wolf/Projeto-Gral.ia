import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig(({mode})=>({root:'app',envDir:'..',plugins:[react(),tailwindcss()],resolve:{alias:{'@repository':fileURLToPath(new URL(`./app/src/data/${mode==='supabase'?'supabase':'demo'}-entry.ts`,import.meta.url))}},define:{__DEMO__:JSON.stringify(mode!=='supabase')},build:{outDir:`../dist/${mode==='supabase'?'supabase':'demo'}`,emptyOutDir:true},server:{host:'127.0.0.1',port:5173}}));
