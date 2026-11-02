# References for resuming a run that ended in error (#10)

## Similar Implementations

### The skill's stops and relaunches

- **Location:** `skills/redline/SKILL.md` 150-222: the result handlers (`review-only`, `stopped before a result`, the two `handoff` kinds, `reviewed`, `done`, `capped`, `error`), the run-record copy under `saved/`, and the two "if the session that started the run is gone" paragraphs
- **Relevance:** every stop that will write the marker, and the paragraphs the marker replaces
- **Key patterns:** a relaunch reuses `args` byte for byte and adds only what the stop asked for; the record copy is saved before the relaunch overwrites it

### The prefs script and its harness

- **Location:** `scripts/redline-prefs.sh` 1-25 (the header contract), 160-168 (`save` rebuilds the file from the four fields); `tests/prefs-test.sh` 1-30 (`ok`, `bad`, `expect`, `saved`)
- **Relevance:** the marker's home and the harness its cases join; `save` must learn to keep the other keys
- **Key patterns:** one jq program, atomic write with `mktemp` and `mv`, exit 2 on a bad argument

### The workflow's one call site, its errors and its verdict

- **Location:** `workflows/redline-loop.js` 346-366 (`stageError`, `run`), 1471-1519 (`judge`), 1559-1609 (`result`), 2127-2145 (the parallel Approve and its two errors), 2253-2263 (round commits), 2621-2649 (`commitRecord`), 2751-2755, 2777 and 2817-2819 (the three returns without a record commit or the booleans), 2887-2890 (the catch)
- **Relevance:** `run()` is where the resume line is appended and `lastLabel` kept; `judge()` is where a hand commit is excused; the catch is where `resumeFrom` is added
- **Key patterns:** the script decides from the gate's own fields; `run()` normalizes once for every agent (#42), the model for the resume line

### The loop test

- **Location:** `tests/loop-test.mjs` 167-209 (`go`, `samePrefix`, `pick`, `labels`), 362-416 (section 7, the record commit, including the "commits no record" list), 463-485 (firstRound), 624-640 (the checker helpers and `scenario.checker`), 760-860 (the human pass)
- **Relevance:** the replay rule is proven with `samePrefix`; the checker patch is how a failing recheck and a hand commit are scripted
- **Key patterns:** a scenario knob per mock (`ask`, `defer`, `none`, `checker`, `heads`); every run that reaches Finish asserts the record-commit tail

### The shaper's folder rule

- **Location:** `agents/redline-shaper.md` rule 9
- **Relevance:** "complete or correct it rather than creating a second one" becomes "rewrite the four files, never touch `redline/`" on a resume

### The README sections the Docs step lands in

- **Location:** `README.md` 67 (Use), 93-106 (Saved preferences), 143-164 (Files table), 185-187 (Launching), 195-203 (Known limits), 209 and 215 (Git rules 1 and 7)

### The last hand-shaped spec

- **Location:** `agent-os/specs/2026-10-30-1558-55-checker-overrides-structural-unreadable/`
- **Relevance:** plan shape (Context with survey facts, Decisions with owners, per-task Files lines, Docs entries table, Verification Gate task, As built)

### Internal notes (cited by name, never copied)

- redline-internal `docs/API-NOTES.md`, section g (relaunch and replay behaviour: same session only; `claude --resume` keeps the saved results)
- redline-internal `docs/STEP7-NOTES.md`, section 3 (the one resume so far: a harness-stopped run relaunched with `resumeFromRunId` and no decisions)

### Claude Code docs

- Sessions, environment variables (`CLAUDE_CODE_SESSION_ID` in Bash tool subprocesses), workflows (the replay rule, `resumeFromRunId`)
