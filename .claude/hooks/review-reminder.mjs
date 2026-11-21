import { execFileSync } from 'node:child_process'
import { realpathSync } from 'node:fs'

function advise(root) {
  const git = (args) => execFileSync('git', ['--no-optional-locks', '-c', 'core.fsmonitor=false', ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 1500,
  })
  if (realpathSync(git(['rev-parse', '--show-toplevel']).trimEnd()) !== realpathSync(root)) return

  const paths = git(['status', '--porcelain=v1', '-z', '--no-renames', '--untracked-files=all'])
    .split('\0').map(entry => entry.slice(3))
  const reminders = []
  if (paths.some(path => /^(app\/|lib\/|middleware\.ts$|next\.config\.js$)/.test(path) && path !== 'lib/wiki-index.generated.json')) {
    reminders.push('Check that focused validation and the UI comparison are covered, or report why they were skipped.')
  }
  if (paths.some(path => /^(wiki\/(private|public|notebooks)\/|lib\/wiki-index\.generated\.json$|migrations\/|neon\.ts$)/.test(path))) {
    reminders.push('Confirm applicable approvals and data boundaries for protected content, index, notebook, or database changes.')
  }
  if (reminders.length) {
    console.log(JSON.stringify({ systemMessage: `Repository reminder: ${reminders.join(' ')} See AGENTS.md.` }))
  }
}

try {
  advise(process.env.CLAUDE_PROJECT_DIR || process.cwd())
} catch {
  // An advisory hook must not fail the turn if Git is unavailable.
}
