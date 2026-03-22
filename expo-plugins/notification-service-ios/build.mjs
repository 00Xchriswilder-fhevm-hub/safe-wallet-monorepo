/**
 * Cross-platform build (replaces rm/cp shell usage for Windows dev machines).
 */
import { cpSync, existsSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))
const dist = join(root, 'dist')

if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true })
}

const require = createRequire(import.meta.url)
let tscBin
try {
  tscBin = require.resolve('typescript/bin/tsc')
} catch {
  console.error('typescript not found; run yarn install from the monorepo root first.')
  process.exit(1)
}

const tsc = spawnSync(process.execPath, [tscBin], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
})
if (tsc.status !== 0) {
  process.exit(tsc.status ?? 1)
}

cpSync(join(root, 'ios-notification-service-files'), join(root, 'dist', 'ios-notification-service-files'), {
  recursive: true,
})
