# References for PR #94 Review Round 8

Shaped by Redline in unattended mode. Every location below was opened while shaping, at `754aa67`.

## Similar Implementations

### The bad-ref rule for a verified or unconfirmed entry

- **Location:** `workflows/redline-loop.js`, `accountCoverage` (1578-1650), the `LISTED_ELSEWHERE` branch (1601-1625) and the mint loop (1628-1646)
- **Relevance:** R8-2 extends the same rule to a `duplicate` or `settled` entry whose ref names nothing.
- **Key patterns:** a bad entry gets a warning and its index goes in `told`, so the mint loop keeps the candidate as an unconfirmed finding without a second warning.

### The duplicate's target in the set-aside block

- **Location:** `workflows/redline-loop.js`, `review()`'s set-aside build (2470-2490); `tests/loop-test.mjs`, the duplicate-form scenario (1993-2020) and the duplicate of a finding (2023-2029); `agent-os/specs/2026-11-11-1952-86-review-round-4/shape.md` (Decision 2, Unattended answer 7, line 82) and `agent-os/specs/2026-11-11-1952-86-review-round-5/shape.md` (Decision 2)
- **Relevance:** R8-2 reads a duplicate's index with the same leading-token parse #86 settled, and changes the outcome of the two refs #86 listed as refused (`4`, `99`).
- **Key patterns:** `/^(?:(?:candidate|index)\s+)?(\d+)\b/i`; a ref in words is shown as written.

### A repository rule's forced entry and the `left` kind

- **Location:** `workflows/redline-loop.js`, `forceAskRules` (2834-2905), `leftDecision` (1196-1207), `settle()` (3076-3091), `resolveWith` (3106-3120), `outcomesFor` (2621-2650), `replyBody` (1350), `describeOutcome` (2668), the autopilot Deferred loop (3331-3340), the handoff's Deferred and Left-to lines (3500-3507), `leftToYou` (3539-3548), the thread sweep (3690, 3712), `result()`'s `forced` (2309); `tests/loop-test.mjs`, the rule-covered declines on autopilot and after a reshape (2318-2342)
- **Relevance:** R8-4 records a finding on Redline's own files the same way, so every one of those lines treats it as left to the person.
- **Key patterns:** R7-7's "the entry its call was decided on stands"; `leftUnder` replaces the hard-coded "repository rule <id>" at each line.

### The stop's list of Redline's declines

- **Location:** `workflows/redline-loop.js`, `handoffResult` (3861-3905), `checkCalls` (2747-2770), the reshape's stop (3196-3201); `tests/loop-test.mjs`, the reshape stop's declines (2542-2546); `skills/redline/SKILL.md:208`
- **Relevance:** R8-6.

### The scope decline's wording

- **Location:** `workflows/redline-loop.js`, 342-348, 1003, 1021, 3497, 3967, 3971, 4046, 4055
- **Relevance:** R8-1's single source.

### The next finding number

- **Location:** `workflows/redline-loop.js`, `review()`'s rename (2379-2385), `reconcilePrior` (2539), `accountCoverage` (1628); `git blame` of those lines (`72978106`, `40f80cee` on `main`, `6b4b6c30` in the PR)
- **Relevance:** R8-3.

### The shaper's output checks

- **Location:** `workflows/redline-loop.js`, `revise()`'s shape (3043-3060) and reshape (3184-3195), `reshapePrompt` (1747-1762), `stageError` (489-491); `git show main:workflows/redline-loop.js`, line 2686; `tests/loop-test.mjs`, the shaper mock (164-215) and the reshape scenarios (1501-1515)
- **Relevance:** R8-5.

### The review dial's ending

- **Location:** `workflows/redline-loop.js`, the review dial (4064-4084), `reviewedResult` (3908-3919), `handoffComment`'s opening (3405-3428); `tests/loop-test.mjs`, section 4 (423-443)
- **Relevance:** R8-7.

### Docs and the skill

- **Location:** `docs/running.md` ("The coverage pass", 52-77; "Dispositions", 79-108; "The handoff comment", 141-161); `skills/redline/SKILL.md` (184, 204-208, 242); `docs/contract.md:149`; `scripts/redline-gh.sh` (the prior-findings header, 25-55, and `classify`, 340-361)
- **Relevance:** the reader-facing statements R8-2 and R8-4 update, and the reader R8-4 leaves alone.

### The pull request's own spec

- **Location:** `agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/` (`shape.md` decision 9 and the Task 4 deviations; `plan.md:74`)
- **Relevance:** Unattended answers 6 and 7.
