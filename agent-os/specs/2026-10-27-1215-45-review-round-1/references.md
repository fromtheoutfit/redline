# References for PR #45 review round 1

Shaped by Redline in unattended mode. Every file below was opened while shaping.

## Similar Implementations

### The wrapper's thread subcommands (R1-2)

- **Location:** `scripts/redline-gh.sh`, lines 80-92 (the `resolve-threads` header), 96-99 (`THREADS_QUERY`, `RESOLVE_MUTATION`), 199-212 (`review_threads`), 351-355 (`threads`), 459-491 (`resolve-threads`), with the jq plan at 470-483 and the resolve select at 476
- **Relevance:** the resolve rule checks `.comments[0]` and `.comments[-1]` against the given ids and never the comments between them. The four skip reasons are built at 479-482.
- **Key patterns:** one jq pass decides `resolve` and `skipped` from the slurped threads; `mine` is a lookup in the given ids; one mutation per thread to resolve, sent in a loop that exits 1 on the first failure.

### The sweep in the loop (R1-3, and R1-2 option A)

- **Location:** `workflows/redline-loop.js`:
  - `POST_SCHEMA` 296-319, with `skipped` a string at 303
  - `SWEEP_SCHEMA` 537-546, with `skipped` an array at 543
  - `resolveThreadsPrompt` 1143-1159, with the skip sentence at 1156
  - `threadSweep` 1307, returned as `threads` at 1359
  - Push and reply, then `keepReplyIds`: 1562-1586
  - `handoffComment` 1856-1869, where the threads line goes after the round sentence
  - `finish()`, calling the sweep at 1974
  - `threadCandidates` 1987-2012
  - `sweepThreads` 2014-2063: the skipped mapping at 2045-2053, the `not resolved` fallback at 2054-2058, `open` at 2060
  - `threadsLine` 2065-2073
- **Relevance:** R1-3's fix is in `sweepThreads`. R1-2's option (A) adds one reason to the same mapping.
- **Key patterns:** the workflow picks the candidates and maps the script's ids back to findings through `record.commentIds`; a skip is data, not an error; an unmatched skipped id is a warning.

### The loop harness's sweep scenario

- **Location:** `tests/loop-test.mjs`, lines 60-77 (the push mock's `reply_id` 200+i and the `resolve threads` mock driven by `scenario.threadsSkipped`), 702-746 (section 11)
- **Relevance:** the "a teammate replied after Redline" case (723-724) is the template for R1-3's case. A `threadsSkipped` reason is all it takes to reproduce the finding.
- **Key patterns:** `go(name, args, scenario)`, `pick`, `comment`, `labels`; assertions on the exact handoff line and on `JSON.stringify(run.res.threads)`.

### The gh harness's thread fixture (R1-2 options A and B)

- **Location:** `tests/gh-test.sh`, lines 21-26 (header comment), 70-99 (the shim's `graphql` branch: query pages, mutation log), 231-254 (the `threads` and `resolve-threads` cases); `tests/gh-fixtures/threads-13-page1.json`, `threads-13-page2.json`
- **Relevance:** the five fixture threads (PRRT_1 to PRRT_5) have no thread with a foreign comment between two of Redline's. A sixth at `app/f.php` sorts last, so the index-based cases keep their positions.
- **Key patterns:** `is "<name>" "<actual>" "<expected>"`; `jq -c '[.resolved, .skipped]'`; the mutation log `resolved.log` read with `cut`.

### The GitHub agent's contract (R1-1)

- **Location:** `agents/redline-github.md`, lines 22 (post-review's `skipped: "already posted"`), 23 (reply: the duplicate check only looks for a Redline reply), 24 (resolve-threads), 41-66 (What you return: `skipped` at 50 and 54, `resolved` at 53, the closing sentence at 66)
- **Relevance:** the duplicated key is in the block, added by this PR (`git diff main...HEAD -- agents/redline-github.md`).
- **Key patterns:** one JSON block for every operation, "Fill only the fields the operation produced".

### Prose that states the rule

- **Location:** `README.md` lines 3, 115, 135, 154-160 (Known limits), 319 (the `resolve-threads` row), 326-327; `skills/redline/SKILL.md:204` (the `done` report of `threads`); `skills/redline-revise/SKILL.md:31`
- **Relevance:** what the handoff line and the both-ends rule promise. R1-2's option (A) rewords these lines; R1-3 needs none of them changed.

### The original spec

- **Location:** `agent-os/specs/2026-10-27-1150-39-resolve-redline-threads/shape.md` (Decisions at 11-21, in particular 14 "both ends" and 15 "The handoff line reports the wrapper's real result") and `plan.md` (Task 4 item 4, the rendered reasons, and the As built notes)
- **Relevance:** the rule R1-2 questions, and the definition of the line R1-3 restores.

### The previous review round's spec

- **Location:** `agent-os/specs/2026-10-27-0923-43-review-round-1/plan.md`, `shape.md`, `references.md`, `standards.md`
- **Relevance:** the layout this round follows: a pending task with options by file, the standards task, the gate run through `checks.sh` with the snapshot, red-first loop-test runs through the gate.

### Product context

- **Location:** `agent-os/product/mission.md`
- **Relevance:** "nothing an agent does is hidden from the review thread" and "Decisions stay with people", weighed in R1-2's recommendation.
