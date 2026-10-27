# References for carry forward undispositioned findings (#35)

## Similar Implementations

### `args.firstRound`, the replay-safe path for a value read before launch

- **Location:** `workflows/redline-loop.js:74-80`; `skills/redline/SKILL.md:83` (precheck step 8), `:138` (the args sentence); `agent-os/standards/workflow/replay.md` (the `firstRound` bullet).
- **Relevance:** the one value a fresh run already learns about earlier runs. `args.priorFindings` follows it exactly: read by the skill with a `redline-gh.sh` read subcommand, validated at the top of the loop, never re-read inside the workflow.
- **Key patterns:** `fail(...)` before any agent runs; the comment that says why the workflow may not ask GitHub itself; the loop-test `firstRound` section (`tests/loop-test.mjs:451-472`) for the shape of the checks.

### `redline-gh.sh human-review`, a read that joins reviews, inline comments and issue comments

- **Location:** `scripts/redline-gh.sh:291-350`; header 7-93; `last-round` 284-289.
- **Relevance:** the only subcommand that reads the three lists together and classifies a reply as Redline's (`redline_reply`), answered or not. `prior-findings` reads the same three lists and classifies by the reply's fixed wording.
- **Key patterns:** three temp files through `--slurpfile`, never `--argjson`; one jq program; `[.[][]]` over slurped pages; exit 2 on a gh error; the header paragraph as the documentation the README quotes.

### The reply wording, the outcomes and the sweep

- **Location:** `workflows/redline-loop.js`: `replyBody` 718-736 (the fixed strings `prior-findings` classifies by), `replyEntry` 646-657 (the route rule), `outcomesFor`/`describeOutcome` 1471-1512, `droppedReplies`/`replyDropped` 1540-1572, `keepReplyIds` 1577-1586, `revise` tail 1828-1848, `threadCandidates`/`sweepThreads`/`threadsLine` 1992-2077, `resolveThreadsPrompt` 1143-1159, `pushReplyPrompt` 1077-1102.
- **Relevance:** the carried-forward and resolved replies are reply entries in the round's batch; the earlier thread is one more candidate with more than two ids.
- **Key patterns:** `passOf(record)` for every label, file name and header (`:186-205`); `record.commentIds`/`record.replyIds` as the ids the sweep names; the workflow picks, the GitHub agent runs the one line.

### The review body, the finding line and the handoff

- **Location:** `workflows/redline-loop.js`: `findingLine`/`reviewBody`/`commentBody` 559-598, `handoffComment` 1856-1898, `reviewPrompt` 749-788, schemas 266-294, `review()` 1392-1411, main loop 2240-2345 (`known`/`active` at 2268-2269, the two finish-without-revise paths at 2296 and 2319).
- **Relevance:** the headings, the suffix and the `### Earlier rounds` section are composed here; the finding line is what `prior-findings` parses, so the two stay in step.

### The harnesses

- **Location:** `tests/gh-test.sh` (shim 61-137, fixture copies 51, `human-review` cases 200-210), `tests/gh-fixtures/{reviews,comments,issue-comments}-10.json`; `tests/loop-test.mjs` (mock 33-146: reviewer 95-98, push 65-69, resolve threads 72-77 with its `< 200` root rule; `f`/`baseArgs`/`go` 148-175; review dial 281-302; `samePrefix` 193-197); `tests/guard-cases.tsv:137-151` (the `last-round` and `human-review` rows per role).
- **Relevance:** the style of every new case.

### The roles and the prose

- **Location:** `agents/redline-reviewer.md:14-22, 30, 38-64`; `agents/redline-github.md:23-24`; `skills/redline/SKILL.md:83, 99-138, 150-152, 170-174`; `README.md:65-67, 106-115, 152, 160, 291-308, 319`; `scripts/redline-guard.sh:68, 464`.
- **Relevance:** every description of the known-finding check, the reply duplicate rule, the sweep's ids and the precheck is reworded in the same change (`scripts/bash-conventions.md`).

### The #39 spec

- **Location:** `agent-os/specs/2026-10-27-1150-39-resolve-redline-threads/`.
- **Relevance:** the thread sweep this spec extends to earlier rounds' threads, and the layout of a hand-shaped plan in this repository.
