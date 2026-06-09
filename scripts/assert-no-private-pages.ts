import fs from 'fs'
import path from 'path'
import { WikiIndex } from 'lib/wiki/retrieve'

let failed = false
function fail(msg: string) {
  console.error(`FAIL: ${msg}`)
  failed = true
}

// Check 1: no app/ file references WIKI_PRIVATE_DIR
const appDir = path.join(process.cwd(), 'app')
function walkApp(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkApp(full)
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      const src = fs.readFileSync(full, 'utf-8')
      if (src.includes('WIKI_PRIVATE_DIR')) {
        fail(`${path.relative(process.cwd(), full)} references WIKI_PRIVATE_DIR`)
      }
    }
  }
}
walkApp(appDir)

// Check 2: every private note in the index has url === null
const indexPath = path.join(process.cwd(), 'lib', 'wiki-index.generated.json')
if (!fs.existsSync(indexPath)) {
  fail('lib/wiki-index.generated.json not found — run pnpm index first')
} else {
  const index: WikiIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  for (const note of index.notes) {
    if (note.visibility === 'private' && note.url !== null) {
      fail(`private note "${note.slug}" has url "${note.url}" (must be null)`)
    }
  }
  const privateCount = index.notes.filter(n => n.visibility === 'private').length
  console.log(`assert: ${privateCount} private notes all have url=null ✓`)
}

if (failed) process.exit(1)
console.log('assert-no-private-pages: all checks passed ✓')
