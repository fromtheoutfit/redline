# References for PR #86 Review Round 4

Every file below was opened at `dbfcd69`, the PR head this round reviewed and the working tree's HEAD. Line numbers are at that commit.

## Similar Implementations

### The set-aside entries and the duplicate's target

- **Location:** `workflows/redline-loop.js`:
  - the normalizer's set-aside build, lines 2139 to 2156: the comment at lines 2142 to 2144 names the three forms; `byIndex` is at line 2145, the parse at line 2153, `to` at line 2154 and `into` at line 2155;
  - `accountCoverage`, lines 1332 to 1387, which trims each ref at line 1350 and keeps only in-range indexes;
  - `LISTED_ELSEWHERE`, line 513.
- **Relevance:** R4-1's anchored regex, and the four clauses R4-2's checks turn on (the `index` alternative, the `i` flag, the self guard, the `byIndex` lookup). Task 2's mutations are at lines 2153 and 2155.
- **Key patterns:** a duplicate whose ref reads as another candidate's index carries `into`, one hop; any other ref is shown as written.

### The set-aside block and its line

- **Location:** `workflows/redline-loop.js`:
  - `personLine`, line 874;
  - `setAsideBlock`, its comment at lines 878 to 888 (the "cannot hide" sentence at lines 881 to 883) and the function at lines 889 to 900, with `into(e)` at line 891;
  - `blockText`, line 910.
- **Relevance:** how the addition `(candidate N, `file:line`: outcome)` is built and escaped (a code span is left as written). Option C rewords the comment at lines 881 to 883.

### The accounting sentence

- **Location:** `workflows/redline-loop.js:1244` (`candidatesBlock`, the branch with candidates) and `agents/redline-reviewer.md:50` ("Account for every candidate").
- **Relevance:** R4-1. Both ask for `duplicate (ref the index or the id it collapses into)`. Both also say a partly tracked candidate's issue is named in "the ref of any other outcome", and "write each of those refs for the teammate who may overrule it". Option B changes both.

### The loop test, section 15

- **Location:** `tests/loop-test.mjs`:
  - `go()`, lines 219 to 241, whose run-record check at lines 235 to 239 is added for a run that reaches its handoff;
  - the section's helpers, lines 1277 to 1284 (`covArgs`, `cand`, `fenced`, `two`, `body`);
  - the key-phrase list, line 1476;
  - the nine-candidate scenario, lines 1502 to 1550, whose duplicate entries are at lines 1519 to 1521 (the only three in the suite) and whose pinned duplicate lines are at 1532 to 1534;
  - the escaping scenario, lines 1567 to 1601, whose one-round, no-finding shape Task 2 reuses (its run at line 1588);
  - the `coverage off` check, lines 1603 and 1604, before which Task 2 inserts its scenario.
- **Relevance:** R4-2's new scenario and its insertion point.

### The docs and the standard that state the guarantee

- **Location:**
  - `docs/running.md:48` ("The coverage pass"): "a `duplicate` line names what it collapsed into, plus, when that is another candidate, that candidate's place and outcome, so a duplicate of a dropped or tracked candidate cannot hide".
  - `agent-os/standards/workflow/agents.md:37`, the #85 bullet.
- **Relevance:** R4-1's options A and B make the code meet these; option C narrows them.

### The follow-up spec

- **Location:** `agent-os/specs/2026-11-11-1629-85-set-aside-block-and-escaping/` (`shape.md`, `plan.md`)
- **Relevance:**
  - `shape.md` Decision 2 (line 28) is the aim: "so a duplicate of a dropped or tracked candidate cannot hide".
  - Decision 6 (line 36): "No prompt change unless the wider block needs one; in that case, stop and ask".
  - The Shaping default "A duplicate's target" (lines 63 to 67) is the mechanism: the three forms, any case, the self and out-of-range refs shown as written.
  - `plan.md` As built records the loop test's 610-check green count.

### The earlier rounds

- **Location:**
  - `agent-os/specs/2026-11-11-1409-86-review-round-1/shape.md`. Unattended answer 6 declined loosening the `finding` ref match as a change to an earlier decision. Unattended answer 7 records the guard's refusal of `node` to the shaper.
  - `agent-os/specs/2026-11-11-1409-86-review-round-2/` (`shape.md`, `plan.md`). Task 3 is the temporary-mutation red run Task 2 follows. Unattended answer 7 covers the PR description, and As built gives the other harnesses' counts.
  - `agent-os/specs/2026-11-11-1409-86-review-round-3/redline/round-3-findings.json`: no findings.
- **Relevance:** the known-finding check, the method for a red run over behaviour the code already has, and the expected counts.

### Recorded duplicate refs

- **Location:** every `agent-os/specs/*/redline/*findings.json`, read with `jq` for `coverage.accounting` entries whose outcome is `duplicate`.
- **Relevance:** R4-1's likelihood. Only three exist, all bare: `3` and `1` in `agent-os/specs/2026-11-06-1019-80-review-round-1/redline/round-1-findings.json`, and `R5-1` in `agent-os/specs/2026-11-07-0806-80-review-round-5/redline/round-5-findings.json`.

### The round's own record

- **Location:** `agent-os/specs/2026-11-11-1952-86-review-round-4/redline/round-4-review.json`, `redline/round-4-findings.json` and `redline/snapshot-start.json`; `scripts/redline-gh.sh pr-comments 86`.
- **Relevance:** the review as posted, with its two findings, three For the person lines and five set-aside candidates. In the PR's comments, round 1's coverage candidate 2 and round 2's set-aside candidate on duplicate-ref renaming are the two earlier duplicate notes (`shape.md`, Unattended answer 9).

### The reviewer's reproduction

- **Location:** `/tmp/redlinerepro/`
- **Relevance:** it holds only round 1's files (`reviewer-r1-repro.mjs`, `reviewer-r1-ReproTest.php`). There is no `reviewer-r4-ReproTest.php`, and both findings were traced from the code.

### Issues

- `scripts/redline-gh.sh issues-search` for `"duplicate ref"`, `"set-aside block"`, `"duplicate target"` and `"coverage accounting"`: nothing. For `"duplicate"`: #20 only, about the human reviewer's post-handoff comments, which is unrelated.
- **#81** (open), cited by the PR description as the caution for a self-review round that edits `workflows/` or `agents/`; see `shape.md`, Context.
