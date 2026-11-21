# Testing and verification

Use the smallest check that covers the change. Tests use Node's built-in runner via `tsx`; there is no package test script, project lint command, or checked-in CI workflow.

| Change | Minimum verification |
| --- | --- |
| Docs or instructions | Read as a fresh reader; verify relative links and command accuracy. |
| Claude hook | `node --test .claude/hooks/review-reminder.test.mjs`; verify the hook is registered in `.claude/settings.json`. |
| TypeScript logic or API | Focused tests, `pnpm typecheck`, and the UI comparison when applicable. |
| Vault, index, privacy or public routes | Focused tests and `pnpm check:private`; inspect exposure boundaries and run the UI comparison when applicable. Do not rebuild the index merely to test. |
| UI, layout, CSS or client behavior | UI comparison plus targeted hydrated checks of changed interactions, including keyboard/mobile where relevant. |
| Notebook or local analysis | Follow the [notebook safety and verification procedure](notebooks.md). Do not add notebook execution to site checks. |

Run related files in one invocation, listing paths explicitly:

```bash
pnpm exec tsx --test tests/ask.test.ts tests/comments.test.ts
```

Other tests cover blog publication/language, frontmatter, newsletter form handling, SEO, and the economy chart. Use `git ls-files -- '*.test.ts'` to find them. For an aggregate run in Bash, `git ls-files -z -- '*.test.ts' | xargs -0 pnpm exec tsx --test` runs the tracked TypeScript tests; include new untracked tests explicitly. Broaden to the aggregate suite for cross-cutting changes or when a focused check does not explain a failure.

The hybrid retrieval unit test uses synthetic data. The `/ask` route integration test reads the checked-in index and uses a loopback-only OpenAI mock; do not dump its captured request or replace the mock with a real service. The comments integration test uses PGlite with the checked-in migration and no external database. If exercising additional paths, use loopback fakes (`OPENAI_BASE_URL`, `RESEND_BASE_URL`, `POSTHOG_API_HOST`) or omit service configuration to test missing-service behavior. Do not call real services to verify a change.

## Verify the UI

Required for changes to `app/`, `lib/`, `middleware.ts`, or `next.config.js`. Refactors should produce no unrelated rendered differences; for approved UI changes, explain each intended difference. HTML snapshots do not prove hydrated interactions or CSS are unchanged.

1. Use a disposable worktree for the pre-change baseline (usually `HEAD`) and a separate isolated copy of the working version with the intended changes. If `HEAD` omits relevant pre-existing changes, capture a pre-edit baseline that includes them. Give both sides the same safe environment and dependencies. Keep production env files and inherited service credentials out of both copies. Do not stop an unrelated user's server or overwrite their build output.
2. Run `pnpm exec next build` on each copy, **not `pnpm build`**. The latter runs the wiki indexer. Use separate `.next` directories. The Next build can fetch assets such as fonts; if that is blocked, report the limitation rather than substituting a successful type check for a UI result.
3. Start each production build on its own free loopback port, wait for readiness, then from the repo root run the snapshot script against both. Use dedicated temporary output directories; the script replaces its output directory.

   ```bash
   node scripts/snapshot-ui.mjs http://localhost:3999 "$SNAPSHOT_ROOT/before"
   node scripts/snapshot-ui.mjs http://localhost:4000 "$SNAPSHOT_ROOT/after"
   diff -r "$SNAPSHOT_ROOT/before" "$SNAPSHOT_ROOT/after"
   ```

4. Inspect relevant CSS under `.next/static/css/` and compare hydrated DOM or interactions as needed. Snapshots cover public routes (including blog cookie variants), status and redirect headers, feed, sitemap and robots; images are summarized by byte count. In browser checks, block external analytics/CDN requests or use local mocks; point `POSTHOG_API_HOST` at a local fake when exercising counters. For a quick hydrated comparison, use headless Chrome's `--dump-dom` with a virtual-time budget, then compare equivalent pages and settings.
5. Stop only the servers started for this check, remove disposable worktrees and snapshots, and report the baseline, results, and any skipped checks.
