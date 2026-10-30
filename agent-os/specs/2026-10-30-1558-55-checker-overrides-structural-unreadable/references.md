# References for the checker structural override (#55)

## Similar Implementations

### `run()`'s once-per-result normalization

- **Location:** `workflows/redline-loop.js` 350-366
- **Relevance:** the model for a rule applied once as a result comes back, so no call site can miss it (#42, #43 R1-1). The override sits the same way, in `checker()`, which both the baseline and the per-pass check call
- **Key patterns:** a copy is returned, the object `agent()` handed back is left as it was

### The checker's verdict

- **Location:** `workflows/redline-loop.js` 1408-1440 (`stopReason`), 1447-1495 (`judge`), 1983-1987 (`checker()`), 2156-2170 (the baseline call and its `baseline:` warning), 2197-2209 (the per-pass call and its `${pass.name}:` warnings)
- **Relevance:** `stopReason()` tests exit 2, then `result_unreadable` by reason, then a null result, then (`needGit`) a missing git block. The override runs before it, so an overridden full-pass `git: null` still stops on the last test
- **Key patterns:** the script decides from the gate's own fields; the checker's text is a warning at most

### The checker role's reading rules

- **Location:** `agents/redline-checker.md` 43-52
- **Relevance:** line 45 already says `null` in `--baseline` mode is a key; line 50's `no_git_block` bullet is the rule the checker misapplied on #54 round 1
- **Key patterns:** a specific case before the general rule (exit 2 before `result_unreadable`, #37 R1-1); here the baseline example is put on the bullet itself

### The loop test's checker scenario

- **Location:** `tests/loop-test.mjs` 141-152 (the checker mock: a baseline result with `git: null`, a full result with a git block; `scenario.checker(label, out)` replaces one call's result), 623-675 (section 9: a stray error, a failing gate, each unreadable reason, exit 2, no result, no git block)
- **Relevance:** the new checks follow the section's helpers (`unreadable`, `stopped`, `repaired`, `pick`, `labels`, `brief`); the existing `no_git_block` check (658-659, an object with no `git` key) and the `not_json` check (656-657, a null result) are the neighbours that must still stop

### The README paragraph that names the statuses

- **Location:** `README.md` 262 (`## checks.sh`, **Exit code**)
- **Relevance:** the one place the README lists `spilled`, `not_json`, `no_git_block`, `backgrounded` and `no_result`, so the Docs entry lands there

### The last hand-shaped spec

- **Location:** `agent-os/specs/2026-10-29-1559-13-docs-gate-step/`
- **Relevance:** plan shape (Context with survey facts, Decisions with the answers and their owner, per-task Files lines, Docs entries table, Verification Gate task, As built)
