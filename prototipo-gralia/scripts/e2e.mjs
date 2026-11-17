import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, createWriteStream, writeFileSync } from 'node:fs'
import path from 'node:path'
import cypress from 'cypress'
import { integrationConfiguration } from './supabase-e2e-tasks.mjs'

const mode = process.argv[2] ?? 'demo'
if (!['demo', 'supabase'].includes(mode)) throw new Error('Use node scripts/e2e.mjs demo|supabase')
const evidenceDir = process.env.GRALIA_EVIDENCE_DIR ?? `docs/evidencias/${new Date().toISOString().replaceAll(':', '-')}-${mode}`
mkdirSync(evidenceDir, { recursive: true })
process.env.GRALIA_E2E_MODE = mode
process.env.GRALIA_EVIDENCE_DIR = evidenceDir
if (mode === 'supabase') {
  try { integrationConfiguration() } catch (error) {
    const record = { status: 'BLOQUEADO', modo: 'Supabase local real', motivo: error.message, observado_utc: new Date().toISOString(), alteracoes_executadas: false }
    writeFileSync(path.join(evidenceDir, 'bloqueado.json'), JSON.stringify(record, null, 2))
    console.error(error.message)
    process.exit(2)
  }
}
const env = { ...process.env }
if (mode === 'supabase') {
  // Vite receives only the public application configuration. Administrative test
  // credentials remain in the Node runner/Cypress task process.
  for (const name of Object.keys(env)) if (name.startsWith('GRALIA_TEST_') || name === 'GRALIA_DISPOSABLE_LOCAL') delete env[name]
}
const serverLog = createWriteStream(path.join(evidenceDir, 'vite.log'))
const vitePath = path.resolve('node_modules/vite/bin/vite.js')
if (!existsSync(vitePath)) throw new Error('Dependências ausentes: execute npm ci na raiz do projeto.')
const server = spawn(process.execPath, [vitePath, '--mode', mode, '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { env, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' })
server.stdout.pipe(serverLog)
server.stderr.pipe(serverLog)
let serverError
server.on('error', (error) => { serverError = error })
const stopServer = () => {
  if (!server.pid) return
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' })
  else { try { process.kill(-server.pid, 'SIGTERM') } catch { /* Already stopped. */ } }
}
process.on('SIGINT', () => { stopServer(); process.exit(130) })
process.on('SIGTERM', () => { stopServer(); process.exit(143) })
try {
  let ready = false
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (serverError) throw serverError
    if (server.exitCode !== null) throw new Error(`Servidor encerrou com código ${server.exitCode}; veja ${evidenceDir}/vite.log`)
    try {
      const response = await fetch('http://127.0.0.1:4173', { signal: AbortSignal.timeout(1000) })
      if (response.ok) { ready = true; break }
    } catch { /* Wait for Vite to bind. */ }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  if (!ready) throw new Error('Vite não iniciou na porta 4173 em até 30 segundos.')
  const result = await cypress.run({
    configFile: mode === 'supabase' ? 'cypress.supabase.config.ts' : 'cypress.config.ts',
    browser: process.env.GRALIA_CYPRESS_BROWSER ?? 'electron',
    quiet: false,
  })
  process.exitCode = 'totalFailed' in result ? (result.totalFailed > 0 ? 1 : 0) : 1
} finally { stopServer(); serverLog.end() }
