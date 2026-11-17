import { defineConfig } from 'cypress'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash } from 'node:crypto'
import { createSupabaseTasks, integrationConfiguration } from './scripts/supabase-e2e-tasks.mjs'

const evidenceDir = process.env.GRALIA_EVIDENCE_DIR ?? 'docs/evidencias/supabase-local'
const xml = (value: unknown) => String(value ?? '').replace(/[<>&"']/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]!)
function sourceHash() {
  const hash = createHash('sha256')
  function scan(directory: string) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) scan(file)
      else { hash.update(file); hash.update(fs.readFileSync(file)) }
    }
  }
  for (const directory of ['app/src', 'fixtures', 'supabase/migrations', 'cypress']) scan(directory)
  return hash.digest('hex')
}

export default defineConfig({
  video: false,
  allowCypressEnv: false,
  screenshotsFolder: path.join(evidenceDir, 'screenshots'),
  trashAssetsBeforeRuns: false,
  viewportWidth: 1280,
  viewportHeight: 900,
  defaultCommandTimeout: 15000,
  taskTimeout: 120000,
  retries: 0,
  e2e: {
    baseUrl: 'http://127.0.0.1:4173',
    specPattern: 'cypress/e2e/supabase.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on) {
      // Only Node receives administrative credentials. No config.env credentials.
      const tasks = createSupabaseTasks(integrationConfiguration())
      const started = new Date().toISOString()
      const hash = sourceHash()
      on('task', {
        ...tasks,
        recordCase(record: { id: string; [key: string]: unknown }) {
          if (!/^CT-GR-\d{3}$/.test(record.id)) throw new Error('ID de evidência inválido')
          const directory = path.join(evidenceDir, record.id)
          fs.mkdirSync(directory, { recursive: true })
          fs.writeFileSync(path.join(directory, 'resultado-observado.json'), JSON.stringify({ ...record, modo: 'Supabase local real', fixture_version: '1.0', source_sha256: hash, observado_utc: new Date().toISOString() }, null, 2))
          return null
        },
      })
      on('after:run', results => {
        fs.mkdirSync(evidenceDir, { recursive: true })
        fs.writeFileSync(path.join(evidenceDir, 'cypress-results.json'), JSON.stringify({ ...results, config: undefined }, null, 2))
        fs.writeFileSync(path.join(evidenceDir, 'ambiente.json'), JSON.stringify({ mode: 'supabase-local-real', fixture_version: '1.0', source_sha256: hash, started_utc: started, ended_utc: new Date().toISOString(), time_zone: 'America/Sao_Paulo', ended_local: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'long', timeZone: 'America/Sao_Paulo' }).format(new Date()), node: process.version, platform: os.platform(), os_release: os.release(), browser: 'browserName' in results ? { name: results.browserName, version: results.browserVersion } : null, cypress: 'cypressVersion' in results ? results.cypressVersion : null }, null, 2))
        if (!('runs' in results)) return
        const cases = results.runs.flatMap(run => run.tests.map(test => {
          const attempt = test.attempts.at(-1)
          const failure = test.state === 'failed' ? `<failure message="${xml(test.displayError)}">${xml(test.displayError)}</failure>` : ''
          const pending = test.state === 'pending' || test.state === 'skipped' ? '<skipped />' : ''
          return `<testcase classname="${xml(run.spec.relative)}" name="${xml(test.title.join(' / '))}" time="${(attempt?.wallClockDuration ?? 0) / 1000}">${failure}${pending}</testcase>`
        }))
        fs.writeFileSync(path.join(evidenceDir, 'cypress-junit.xml'), `<?xml version="1.0" encoding="UTF-8"?><testsuite name="Gralia Supabase local" tests="${results.totalTests}" failures="${results.totalFailed}" skipped="${results.totalPending + results.totalSkipped}" time="${results.totalDuration / 1000}">${cases.join('')}</testsuite>`)
      })
      return undefined
    },
  },
})
