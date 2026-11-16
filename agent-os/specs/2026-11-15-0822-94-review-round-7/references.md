# References for PR #94 Review Round 7

Shaped by Redline in unattended mode. Every file below was opened at `8739d8b`.

## Similar Implementations

### The correctness-only scope's decline, the pattern R7-10 follows

- **Location:** `workflows/redline-loop.js`, 341 (`SCOPE_DECLINED`), 943-948 (`scopedLine`), 991-996 and 1013 (`reviewBody`'s list and closing sentence), 2557-2560 (`post()`'s findings file with `scoped` apart), 2278 (`result()`'s `scoped`), 3407 and 3444-3448 (the handoff's list), 3661 (an earlier thread of a scope-declined carried finding), 3994-4009 (the main loop's `scoped` and the round record).
- **Relevance:** R7-10. The final nit pass's blocks are 3896-3930 (a human review pass) and 3984-3991 (the main loop); its endings, 4043-4056.
- **Key patterns:** a plain id, so `redline-gh.sh prior-findings` never reads the line back; the item stays in `findings` and is listed apart under `scoped`; no inline comment, no reply, never shaped.

### The handoff's outcome lists

- **Location:** `workflows/redline-loop.js`, 3392 (the comment saying the Decisions list is gone), 3395-3466 (the groups and the `line` helper at 3431), 3489-3500 (`leftToYou`).
- **Relevance:** R7-1.

### The result and the skill's summaries

- **Location:** `workflows/redline-loop.js`, 2242-2244 (`compactFinding`), 2246-2255 (`history()`, which feeds the reviewer's prompt), 2257-2290 (`result()`), 939 and 1148 (how an unconfirmed finding's line reads, `not stated` when none was given), 4016 (the review-only result); `skills/redline/SKILL.md`, 27 (the grammar table), 170 (the review-only summary), 190 (the `reviewed` hand-off), 242 (the done summary).
- **Relevance:** R7-3, R7-4, R7-10.

### The shaper's checks

- **Location:** `workflows/redline-loop.js`, 726 (the round schema's `secondLook`), 1696 (the shaper prompt's return line), 2669-2712 (`checkDispositions`), 2721-2764 (`checkCalls`, `checkWhy`, `checkDeclineReasons`), 2809-2866 (`forceAskRules`), 2995-3015 and 3138-3150 (the shape and reshape sites), 3030-3046 (autopilot's `settle`), 3278-3292 (the Deferred list); `agents/redline-shaper.md`, 21 and 32.
- **Relevance:** R7-5, R7-7.
- **Key patterns:** a check reads the shaper's values before `forceAskRules` rewrites them; `decisions` is module-level (196).

### The checker and the verdict

- **Location:** `workflows/redline-loop.js`, 2108-2127 (`STRUCTURAL_REASONS`, `gateShaped`, `readStructure`), 2955-2992 (`checker()`).
- **Relevance:** R7-8.

### The round's commits and the quoted subject

- **Location:** `workflows/redline-loop.js`, 1312-1321 (`shownSubject`), 1324 (`replyBody`), 3221-3271 (the implement loop and the round's commits), 3479 (the handoff's Commits list); `scripts/checks-template.sh`, 150-176 (the budget comment) and 315-331 (`cut_subjects`); `docs/contract.md`, 56 and 75; `README.md`, 90 (the one-sentence commit subject).
- **Relevance:** R7-2, R7-6, R7-9.
- **Key patterns:** `message` stays git's; only the posted subject changes (round 6, Decision 7).

### The loop test

- **Location:** `tests/loop-test.mjs`, 50 (`planN`), 160-260 (the mock: the shaper's `decline`, `reason`, `secondLook`, `reshapeAsk`, `reshapeOmitCall`; the plan approver's `planBounce`; the implementer's `implementerCommits`; the checker's override), 261 (`f`), 276-299 (`go()` and its run-record check), 446-481 (the scope section), 875-950 (round_sha, subject and verdict), 1030-1090 (the human pass), 1520-1540 (coverage), 2285-2301 (a decline under a repository rule).
- **Relevance:** every task's test.

### The pull request's spec

- **Location:** `agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/shape.md` (decision 2, the second look) and `plan.md` (decision 14, line 97, `secondLook`); round 6's spec, `agent-os/specs/2026-11-15-0822-94-review-round-6/shape.md` (Unattended answer 7, Decision 7).
- **Relevance:** Unattended answers 6 to 9.
