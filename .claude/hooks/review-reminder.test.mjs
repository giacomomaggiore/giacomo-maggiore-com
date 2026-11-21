import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const hook = fileURLToPath(new URL('./review-reminder.mjs', import.meta.url))

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'review-reminder-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' })
  git('init', '-q')
  return {
    git,
    run: () => execFileSync(process.execPath, [hook], {
      env: { ...process.env, CLAUDE_PROJECT_DIR: root }, encoding: 'utf8',
    }),
    write: (path, contents = 'synthetic fixture\n') => {
      const file = join(root, path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, contents)
    },
  }
}

test('stays silent for docs and ignored local notebook changes', (t) => {
  const repo = fixture(t)
  repo.write('.gitignore', '/wiki/notebooks/\n')
  repo.write('docs/guide.md')
  repo.write('wiki/notebooks/analysis.ipynb')
  assert.equal(repo.run(), '')
})

test('combines app and protected-data reminders without exposing paths', (t) => {
  const repo = fixture(t)
  repo.write('app/local.ts')
  repo.write('wiki/private/synthetic\nnote.md')
  repo.git('add', 'wiki/private')
  const output = JSON.parse(repo.run())
  assert.match(output.systemMessage, /UI comparison/)
  assert.match(output.systemMessage, /approvals and data boundaries/)
  assert.doesNotMatch(output.systemMessage, /synthetic|local\.ts/)
  assert.equal(output.decision, undefined)
})

test('treats an index-only change as sensitive without asking for a UI comparison', (t) => {
  const repo = fixture(t)
  repo.write('lib/wiki-index.generated.json', '{}\n')
  const { systemMessage } = JSON.parse(repo.run())
  assert.match(systemMessage, /approvals and data boundaries/)
  assert.doesNotMatch(systemMessage, /UI comparison/)
})
