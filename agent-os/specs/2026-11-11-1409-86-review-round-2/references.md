# References for PR #86 Review Round 2

Every file below was opened at `fd65cb4`, the PR head this round reviewed and the working tree's HEAD. Line numbers are at that commit.

## Similar Implementations

### The reviewer agent file

- **Location:** `agents/redline-reviewer.md`
- **Relevance:** R2-1.
  - Line 24 is "A tracked part is not the whole finding". It already says "by every rule here", then "A remainder whose cause is in this pull request's diff is a finding:" with no condition.
  - Line 37 is the per-candidate "Run the known-finding check" bullet, which says the same without a condition. The finding did not name it.
  - Line 65 is the For the person bullet: "A part #N does not track whose cause is in the diff is a finding, not an entry here."
  - The rules that send a candidate elsewhere are at lines 36 (collapse by cause), 39 (a refutation answers the claim), 46 (disproportionate, and the removed-guard exception) and 48 (plausible but not reproduced).
  - Line 32 ("the part it does not track is judged on its own") already holds and stays.
- **Key patterns:** the agent file states each verifier rule for both modes; the prompt states it only in the branch with candidates (the #85 spec, Shaping defaults).

### The verify prompt

- **Location:** `workflows/redline-loop.js`, `candidatesBlock` (lines 1193 to 1209) and the comment above it (lines 1178 to 1192)
- **Relevance:** R2-1 changes line 1205, the "For each candidate" sentence, which lacks the agent file's "by every rule here". It also adds two lines to the comment after line 1190. Lines 1184 to 1186 of the comment state #85's rule.
- **Key patterns:** a rule enters only the branch with candidates, so a `coverage off` prompt is byte-identical (`workflow/replay`).

### The coverage accounting and the result

- **Location:** `workflows/redline-loop.js`:
  - `accountCoverage`: lines 1294 to 1346. Line 1312 trims a ref, and line 1335 sets `{ index, outcome, ref }`.
  - The normalizer: line 2097 builds `{ head, candidates, counts, accounting }`, the comment at lines 2098 to 2099 is #80 R1-5's "the round record and the result keep the count", and lines 2104 to 2112 build `droppedCandidates`.
  - The findings file: line 2189 spreads `coverage` with `list` into a new object.
  - `result()`'s round map: lines 1945 to 1966, with `coverage: record.coverage || null` at line 1961.
  - The round record: line 3350, which holds `droppedCandidates`.
- **Relevance:** R2-2. The result keeps the count and the accounting, and no `droppedCandidates` and no candidate list. Task 3's mutation is at line 1961.

### The loop test, section 15

- **Location:** `tests/loop-test.mjs`
- **Relevance:**
  - Line 22 reads the agent file into `reviewerAgent`.
  - Line 1305 is `coverage: the result carries each round's For the person and accounting`. Lines 1383, 1386, 1391, 1399 and 1402 read `run.res.rounds[n].coverage.accounting`.
  - Lines 1462 to 1472 are the key-phrase checks: the comment, `uncovered` and `covered`, and the loop at line 1470. Task 2 extends them.
  - Lines 1478 to 1491 are the partly tracked scenario.
  - Line 1498 is `dropOut`, line 1509 runs `coverage: the dropped block`, line 1521 is its handoff check, and line 1522 is the check R2-2 replaces.
- **Key patterns:**
  - A check names the rule it pins, and a scenario's premise is asserted with its outcome (`testing/tests`).
  - A result check reads `run.res.rounds[n]` (line 1305).

### The docs

- **Location:**
  - `docs/running.md` line 36 ("Rounds", step 1) and line 48 ("The coverage pass"), which state #85's rule without a condition.
  - `docs/running.md` line 83 ("The handoff comment"): "the PR description is redrafted when the repository has a standard for it".
  - `README.md` line 100 ("What a clean run means").
- **Relevance:** R2-1 updates the two `docs/running.md` lines. The README already says "the part an issue does not track is judged on its own" and stays. Line 83 is the evidence for R2-2's PR-description answer.

### The unattended section and its template

- **Location:** `.claude/commands/agent-os/shape-spec.md` (points 1 to 11, point 11 being the guard and the hook) and `templates/shape-spec-unattended.md` line 79 (the template's point 11, "The PR description")
- **Relevance:** this repository's section carries no PR-description point, so a round here writes no `pr-body.md` (`shape.md`, Unattended answer 7). `workflows/redline-loop.js` lines 2970 to 2973 list each round's `pr-body.md`, newest first, and Finish posts the first that exists.

### The original spec

- **Location:** `agent-os/specs/2026-11-11-1322-85-partly-tracked-and-dropped-candidates/` (`shape.md`, `plan.md`)
- **Relevance:**
  - Decision 2 is the partly tracked rule, and Decision 4 the removed guard.
  - The Shaping default "Accounting a partly tracked candidate" lists every outcome a remainder can become, which answers R2-1.
  - The Shaping default "Unchanged" says "the run's result, which keeps counts only (#80, R1-5)", the wording behind R2-2's check name.
  - `plan.md` lines 133 and 199 put `droppedCandidates` on the round record and keep it out of `result()`.

### The earlier rounds

- **Location:**
  - `agent-os/specs/2026-11-11-1409-86-review-round-1/` (`shape.md`, `plan.md`): R1-1 to R1-4, all fixed. Its As built gives the 602-check baseline and the other harnesses' counts. Its Unattended answer 7 records the guard's refusal of `node` to the shaper.
  - `agent-os/specs/2026-11-06-1019-80-review-round-1/shape.md`: R1-5, where the result keeps the candidate count, not the list.
- **Relevance:** the known-finding check, and what "counts only" means.

### The round's own record

- **Location:** `agent-os/specs/2026-11-11-1409-86-review-round-2/redline/round-2-review.json` and `redline/round-2-findings.json`; `scripts/redline-gh.sh pr-comments 86`
- **Relevance:** the review as posted, with its two findings, its For the person lines and its two dropped candidates. Coverage candidates 1 and 9 became R2-1 and R2-2. The range is `beb1913..fd65cb4`.

### The reviewer's reproduction

- **Location:** `/tmp/redlinerepro/`
- **Relevance:** it holds only round 1's files (`reviewer-r1-repro.mjs`, and `reviewer-r1-ReproTest.php` from another repository's run). The reviewer wrote no reproduction for round 2, and both findings were traced from the text.

### Issues

- **#81** (open): "Self-review: a relaunch runs the workflow and agents as the run's own rounds edited them, so replay diverges and a re-run round can wrongly end the run". Found with `scripts/redline-gh.sh issues-search "relaunch replay"`. It covers no finding of this round; see `shape.md`, Context.
- **#85**: the issue this PR closes, the only result of `issues-search "partly tracked"` and `issues-search "removed guard disproportionate"`.
- **#68** (open): the checker's output size, returned by `issues-search "round record result counts"`. Unrelated.
