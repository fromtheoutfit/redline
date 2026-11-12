# References for PR #86 Review Round 1

Every file below was opened at `beb1913`, the PR head this round reviewed. Line numbers are at that commit.

## Similar Implementations

### The reviewer agent file

- **Location:** `agents/redline-reviewer.md`
- **Relevance:** R1-1 and R1-4.
  - Line 16 is the opening sentence of "Check for known findings first", which R1-1 narrows. Lines 18 to 20 are the list after its colon.
  - Line 24 is the "A tracked part is not the whole finding" paragraph #85 added. It already says to name the issue "in its description".
  - Line 50 is the accounting paragraph whose "with the issue named" R1-4 completes. It already ends "a `finding` entry must name a finding of this round".
  - Line 101 is the `knownAs` paragraph, already narrowed to "tracked in full".
- **Key patterns:** the agent file states each verifier rule for both modes; the prompt states it only in the branch with candidates (the #85 spec, Shaping defaults).

### The verify prompt and the review prompt

- **Location:** `workflows/redline-loop.js`, `candidatesBlock` (lines 1177 to 1206) and the review prompt's known-finding sentence (line 1166)
- **Relevance:** R1-4 changes line 1203, the accounting sentence, and the comment above the function (lines 1183 to 1189). Line 1202 already says "with the issue named in its description and knownAs empty". Line 1166, `A known finding goes in knownAs.`, is in every review prompt and stays as it is (R1-1).
- **Key patterns:** a rule enters only the branch with candidates, so a `coverage off` prompt is byte-identical (`workflow/replay`).

### The coverage accounting

- **Location:** `workflows/redline-loop.js`, `accountCoverage` (lines 1283 to 1346), and the normalizer that calls it (lines 2078 to 2116)
- **Relevance:** R1-4's failure path. Line 1309 trims a ref, line 1311 looks a `finding` ref up by exact id, and lines 1313 to 1316 list a miss under For the person as reported, with a warning, and account it `forThePerson`. Lines 2084 to 2092 rename a `finding` or `duplicate` ref only when it equals a renamed id. Lines 2101 to 2109 build `droppedCandidates` from the accounting.
- **Key patterns:** a `finding` ref is an id, matched exactly (#80, R1-4; `agent-os/specs/2026-11-06-1019-80-review-round-1/shape.md`, Decision 3 and Adjustment 1).

### The dropped block and the For the person line

- **Location:** `workflows/redline-loop.js`, `personLine` (lines 869 to 874), `droppedBlock` (lines 876 to 892), `reviewBody`'s For the person and dropped blocks (lines 855 to 862), and `handoffComment`'s (lines 2866 to 2878)
- **Relevance:** R1-3 makes line 888 call `personLine`. R1-2 pins line 2875, `rounds.slice().reverse().find((record) => record.coverage)`, the last covered round.
- **Key patterns:** both lines open with the backticked place, never a finding id, so `redline-gh.sh prior-findings` never reads them back.

### The done rule

- **Location:** `workflows/redline-loop.js`, lines 3378 to 3398
- **Relevance:** the run ends on the round's findings (`correctness`, `nits`), not on the coverage counts, so R1-4's failure misstates the review but does not stop a fix.

### The loop test, section 15

- **Location:** `tests/loop-test.mjs`
- **Relevance:**
  - Line 22 reads the agent file into `reviewerAgent`. Lines 243 and 245 are `labels` and `comment`. Line 1281 is the section's `body`. Line 1294 shows the `coverage r2` label on a covered run.
  - Lines 1462 to 1471 are the key-phrase checks R1-4 extends and R1-1's check follows.
  - Lines 1473 to 1486 are the partly tracked scenario.
  - Lines 1488 to 1517 are the dropped block in the body and the handoff, and lines 1519 to 1523 the block before a final nit pass. These are the existing checks that pin R1-3's output.
  - Lines 1525 to 1528 are the no-reason scenario, the one whose handoff R1-2 pins. Lines 1530 to 1531 are `coverage off`.
- **Key patterns:** a check names the rule it pins; a scenario's premise is asserted with its outcome, so the check is never vacuous (`testing/tests`).

### The docs

- **Location:** `docs/running.md` lines 36 ("Rounds", step 1), 48 ("The coverage pass") and 83 ("The handoff comment"); `README.md` line 100 ("What a clean run means")
- **Relevance:** each already describes what this round's changes make the code and the prompts say, so every Docs entry is "no reader-facing change" with its reason.

### The original spec

- **Location:** `agent-os/specs/2026-11-11-1322-85-partly-tracked-and-dropped-candidates/` (`shape.md`, `plan.md`)
- **Relevance:** Decision 14 (the handoff's last covered round, R1-2). The Shaping default "Accounting a partly tracked candidate" (where the issue is named, R1-4). "The rules enter the verify prompt only" (R1-1 stays out of the review prompt). Task 3's search words and its As built (R1-1).

### The round's own record

- **Location:** `agent-os/specs/2026-11-11-1409-86-review-round-1/redline/round-1-review.json`, `redline/snapshot-start.json`; `scripts/redline-gh.sh pr-comments 86`
- **Relevance:** the review as posted, with its four findings, four For the person lines and three dropped candidates, and the start SHA `beb1913`.

### The reviewer's reproduction

- **Location:** `/tmp/redlinerepro/reviewer-r1-repro.mjs`
- **Relevance:** the reviewer's planned runs for R1-4 (a `finding` ref that names the issue) and R1-2 (the whole loop test against the mutated line 2875). It was never run: node is refused to the reviewer and the shaper, and none of its generated files exist. Task 3 carries out its R1-2 mutation through the gate.

### Issues

- **#81** (open): "Self-review: a relaunch runs the workflow and agents as the run's own rounds edited them, so replay diverges and a re-run round can wrongly end the run". Found with `scripts/redline-gh.sh issues-search "relaunch replay"`, and cited in the PR description's caution. It covers no finding of this round; see `shape.md`, Context.
- **#85**: the issue this PR closes.
