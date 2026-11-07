# References for PR #80 Review Round 3

Shaped by Redline in unattended mode. Line numbers are at `474593f`, the PR head this round reviewed.

## Similar Implementations

### The verifier's prompt in the workflow

- **Location:** `workflows/redline-loop.js`
- **Relevance:** R3-3 and R3-4 are here.
- **Key patterns:**
  - `PRIOR_DISPOSITIONS`, `CARRY`, `trackedList` (86-102). An earlier run's `fixed` finding is in `trackedList`, so it sits under the handled-list header (R3-3).
  - `reviewPrompt()` (1086-1146):
    - The history line (1112), "never re-raise a declined, deferred or decided one" (R3-4).
    - `handledBlock` and the header (1121, 1124), "never re-raise one". R3-3 adds the exception on the coverage branch only, the pattern `matchSentence` (1122) already uses: `Array.isArray(candidates)` gates new text, so a `coverage off` prompt is unchanged.
    - The carry-forward list's gate (1120, 1126-1128), on the whole-PR round only (R3-2).
  - `candidatesBlock()` (1148-1170):
    - The empty branch (1157-1159), which R3-2's doc sentence must match.
    - The reopen sentence (1165), which R3-3 extends with the `knownAs` rule.
  - `accountCoverage()` (1247-1310): a `finding` entry naming a finding with a `knownAs` is counted `known` (1291-1293). This is why a reopened finding must carry none (R3-3).
  - `replyBody()` (1051-1070): a decided outcome's reply carries "Applied in <sha>" when commits named it (1061) (R3-4).
  - `history()` (1883-1892): what the verifier sees of this run's earlier findings, `record.outcomes[f.id]`, which holds `describeOutcome()`'s text (2384-2389, 2737-2738) (R3-4).
  - `reconcilePrior()` (2080-2124): clears a Redline id from `knownAs` on a carried finding only (2094-2097). R3-3's prompt-only fix leaves it as it is (`shape.md`, Decision 1).
  - `outcomesFor()` (2185-2213) and `describeOutcome()` (2215-2233): a finding with a decision is `decided` whatever its commits (2199-2200), and its description has no commit (2221-2222) (R3-4).
  - The known split: the main loop (3282-3283) and the nit-pass branch (3203-3204). A finding with a `knownAs` is listed under Already tracked and does not run another round (R3-3).

### The reviewer's instructions

- **Location:** `agents/redline-reviewer.md`
- **Relevance:** R3-3's four edits and R3-4's options.
- **Key patterns:**
  - Line 16: the known-finding check's example, `"R1-2: fixed"`.
  - Line 20: the first list's rule and R2-1's exception.
  - Line 22: "A finding an earlier round declined, deferred or decided is not raised again".
  - Line 30: "New carries the run's done rule" and the reopen sentence.
  - Line 98: the output contract's `knownAs` example, `R1-2: fixed`.

### How an earlier run's dispositions are read

- **Location:** `scripts/redline-gh.sh`
- **Relevance:** R3-4 across runs.
- **Key patterns:** the `prior-findings` header (36-44) and `classify` (335-342). A reply that opens "fixed in" is `fixed`; any other reply, an `Applied in` decision included, is `decided`.

### The loop test's coverage scenarios

- **Location:** `tests/loop-test.mjs`
- **Relevance:** where Task 2's checks go, and the evidence for R3-4's recommendation.
- **Key patterns:**
  - `prior()` (207): builds an earlier run's finding with a disposition.
  - The decided replies with "Applied in" (279, 297), one of them a decision to keep the code.
  - The R2-1 reopen check (1322-1325).
  - The handled-list scenarios with `handledScenario()` (1337-1349), on a `deferred` prior. Task 2 adds the `fixed` prior beside them.
  - The `coverage: off` run and its R2-1 neighbour (1437-1439).

### The operating doc and the product file

- **Location:** `docs/running.md`, `agent-os/product/tech-stack.md`
- **Relevance:** R3-2 and R3-1.
- **Key patterns:**
  - `docs/running.md` step 7 (42) and "The coverage pass" (48-56) already state the reopen rule.
  - The three-causes paragraph's last sentence (54) is R3-2.
  - `agent-os/product/tech-stack.md:5` is R3-1. The PR's diff appended "and runs it as the coverage pass since #79" to the pre-#79 clause.

### Earlier specs

- `agent-os/specs/2026-11-06-1019-80-review-round-2/shape.md`: Decision 4 (R2-1, decided by the person as option A, "a finding marked fixed") and Decision 5 (R2-5, a mitigation the person chose). Its plan's Task 5 covers what R2-1 changed and what it left (R3-3).
- `agent-os/specs/2026-11-05-1443-79-two-reviewer-whole-pr-round/shape.md`: the #79 spec's Decision 21 (the definition of new) and its Context (product alignment).
- `agent-os/specs/2026-11-06-1019-80-review-round-3/redline/round-3-review.json`: the round's review as posted.
