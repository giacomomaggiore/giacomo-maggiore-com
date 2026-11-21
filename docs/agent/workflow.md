# Implementation and review

## Before editing

1. Read [the repository rules](../../AGENTS.md) and check `git status --short`. Preserve existing changes; do not reset or stage work just to establish a baseline.
2. Trace one end-to-end path from the entry point to the data source and its tests. Verify current behavior in source: [Architecture](architecture.md) is the map, not a substitute for code. When a decision affects behavior, data exposure, or production, confirm it before acting.
3. Pick the smallest change that solves the whole problem. Use the existing `baseUrl: "."` imports and keep shared logic in `lib/`. Keep handlers thin and initialize external clients lazily. Match surrounding conventions; use English for new code and documentation, and comment only where intent is not obvious.

## Implement, review, verify

- Test changed behavior and its boundary cases, using existing tests and local fakes. Add focused cases that fail without the change, not tests that just repeat constants or framework behavior.
- Review the diff before reporting: look for unrelated edits, user-visible regressions, lost errors or cancellation, unsafe data or logs, missing environment fallbacks, and mismatched contracts between the client and API. Request independent review when a change crosses a privacy, persistence, or public API boundary or when the blast radius is hard to assess; provide only the necessary non-sensitive context.
- Use [Testing](testing.md) to choose checks. Report actual results, skipped checks, failures, and whether they were pre-existing. For UI changes, summarize the expected diff and verify nothing unrelated changed.
- Update the affected reference and README when commands, structure, or behavior change. Keep operational policy in [AGENTS.md](../../AGENTS.md), not duplicated across client adapters. Do not commit, push, or deploy as part of routine verification.

## Agent support

[Claude Code](../../CLAUDE.md), [GitHub Copilot](../../.github/copilot-instructions.md), and other agents share [AGENTS.md](../../AGENTS.md). For existing targeted helpers, see the [skills inventory](../../README.md#skills-automated-helpers). Client support and discovery vary; do not assume that all clients load a given skill or hook.

Claude Code's [Stop hook](../../.claude/settings.json) reads Git status without updating the index. It emits one advisory message for relevant app, protected-content, index, or data changes, including changes already in the working tree. It does not read diffs, print paths, track commands, certify approvals, detect changes already committed, run validation, or block completion. Other clients should apply the same checklist manually. Use the client hook settings or decline its trust prompt if it is not wanted locally.
