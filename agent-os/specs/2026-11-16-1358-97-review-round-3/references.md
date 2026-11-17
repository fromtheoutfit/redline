# References for PR #97 Review Round 3

Shaped by Redline in unattended mode. Every file below was opened at `ff5b0a8` for this round.

## Similar Implementations

### What a deferral's mitigation is read as (R3-2)

- **Location:** `workflows/redline-loop.js`: `DEFERRED_SCHEMA`, the comment above `NOTHING_SHIPS`, `NOTHING_SHIPS` and `hasMitigation` (758-775); the readers of `hasMitigation`: `outcomesFor`'s `shipsNothing` (2906), `deferredEntry` (3347), `draftView` (3361), `isDeferral` (3744), `needCommits`' `mitigated` (3874-3878), the done rule's `shaperMitigated` (4018); `judge`'s missing-commit reason (2459-2462); the shape, reshape and resolve prompts' "an empty string when nothing ships now" (1932, 1989, 2029); `tests/loop-test.mjs`: the word loop and its neighbours (2824-2836), the loop test's em dash (964).
- **Relevance:** round 1's R1-7 put the plain words for nothing into the one reader; this round widens it for the wordings found.
- **Key patterns:** one regular expression read by one function (`agent-os/standards/workflow/agents.md:49`); a word-loop entry per accepted form beside a neighbour that must stay a mitigation; `String.fromCharCode` for a non-ASCII character in test source.

### The drafted issue's body (R3-3)

- **Location:** `workflows/redline-loop.js`: `postedText` and its comment (1173-1191), `textParts` and its comment (1205-1236), `draftTitle` (1274-1283), `issueDraft` and its comment (1285-1308), `draftParts` (1310-1314), `deferredEntry` (3344-3352); `docs/running.md`, How the review is posted, What is escaped and neutralised (218-238, the drafted issue's item at 227, the whole-text rule at 231); `README.md`, Known limits (110, 114, 118); the loop test's escaped-body check (`tests/loop-test.mjs:2946-2954`).
- **Relevance:** #87's whole-text rule is where a multi-line field loses its spans; the README and the docs already state it for every posted text.
- **Key patterns:** a constant sentence a prompt carries, pinned by one key phrase; a comment that says when a span stays as written.

### A reshape over a decided finding (R3-4, R3-6)

- **Location:** `workflows/redline-loop.js`: `checkDispositions` (2979-3032), `checkCalls` (3054-3076), `checkDrafts` (3119-3130), `forceAskRules` (3177-3249), `vetShape` (3531-3553); in `revise()`: the shape and its `vetShape` (3561-3564), `draftsOf` (3580-3593), `roundDecisions`, `awayFromDefer` and `deferred` (3638-3644), `resolvedTasks` and `resolveDeferred` (3645-3652), `resolveWith` (3653-3716) with its `undrafted` check (3697-3701), `effectiveDispositions` (3718-3721), `plannedTask` and `shaperPlanned` (3722-3730), `isDeferral` (3731-3747), `draftStop` (3748-3754), the bounced-plan loop (3773-3829) with the reshape and its `vetShape` (3794-3798) and the rebuild (3799-3808); `reshapePrompt` (1974-1990); `git show main:workflows/redline-loop.js` (the rebuild at 3294-3295, before this pull request).
- **Relevance:** the two places a reshape's restatement of a decided finding overrides the decision.
- **Key patterns:** `checkCalls`' `known` exemption for a decided call (3058-3063); a stray entry dropped with a warning (`checkDispositions`, 3017-3025); `stillDeferred` keeping an earlier entry while a decision stands.

### The commits counted for a deferral (R3-5)

- **Location:** `workflows/redline-loop.js`: `mentions` (588-590), `outcomesFor` (2889-2935) with `named` (2899) and `shipsNothing` (2902-2907), the round's commits and their `finding` (3930-3940), the outcomes call (3955), `fixed` (4024); `agents/redline-implementer.md` (steps 3 and 4, lines 18-19, and its return block); `tests/loop-test.mjs`: the scripted implementer (270-275) and checker (276-299, a commit id that opens with `redline:` is its own message at 293), R2-6's `plannedBare` run (2837-2841); `git show e622f6c` (round 2's R2-6 commit).
- **Relevance:** R2-6 made a shaper deferral listed with files a planned task; this keeps that and counts only the task's own commit when nothing ships.

### Replies, the summary and the filing time (R3-1, R3-7)

- **Location:** `workflows/redline-loop.js`: `deferredTo` and `deferredSentence` (1316-1320), `withOwner` (1334-1338), `replyBody` (1489-1522), `deferPrompt` (2228), `fileDeferred` (3302-3339), `settleHeld` (3402-3450), `finish` (4282-4310), `humanSummary` (4216-4266); `agents/redline-github.md` (the `defer` bullet, line 28); `docs/running.md`, Deferred items (120-131, Filing at 125), The handoff comment (169), A human review pass (245); the #95 spec's What is posted (`agent-os/specs/2026-11-16-1026-95-defer-means-tracked/plan.md:128-146`).

### The loop test

- **Location:** `tests/loop-test.mjs`: the scripted GitHub agent's filing (123-144), the scripted shaper with `reshapeDefer`, `mitigations`, `files` and `reshapeDrafts` (190-244), the scripted resolve agent (245-255), `f()`, `goAhead` and `baseArgs` (305-319), `go()` and its run-record check (325-348), `labels`, `pick`, `replies` and `replyFor` (350-375), the defer section (2787-2869), the filing section (2871-3020) with R1-10's runs (2985-2997) and the human pass (3012-3019), the stops section's `only`, `answer` and `changed` (3037-3038, 3094-3103), the statements block (3307-3356).
- **Key patterns:** a check that reads an absent prompt, reply or draft as `''` or `[]`; constants shared by two neighbouring runs (Task 4's `mitigateCall` and `chosenEntry`, reused by Task 6).

### The pull request's own spec and the earlier rounds

- **Location:** `agent-os/specs/2026-11-16-1026-95-defer-means-tracked/plan.md` (decisions 13 and its rider, 35 and 38; Design, The model, 71-79; The draft, as filed, 81-100; Filing, 102-113; the done rule, 124; What is posted, 126-146) and `shape.md` (decisions 13, 35 and 38); `agent-os/specs/2026-11-16-1358-97-review-round-1/shape.md` (Unattended answers 6 and 7, Decisions 4 and 6, the R1-7 and R1-10 proportionality lines); `agent-os/specs/2026-11-16-1358-97-review-round-2/shape.md` (Unattended answer 10, Decisions 3, 7 and 8) and `plan.md` (its As built counts).

### Issues searched

- `scripts/redline-gh.sh issues-search` (open issues only): `escape` finds #88 and #73; `code span` finds #88; `newline` finds #88; `mitigation` finds #99, #95, #22 and #88; `deferred` finds #98, #99, #95, #21, #2, #1 and #66; `resolve agent` finds #99, #1, #82, #88 and #50; `reshape` finds none. None tracks a finding of this round (`shape.md`, Context).

### Scratch files

- No reviewer reproduction for round 3 is under `/tmp/redlinerepro/` (only round 1's and round 2's), and this round wrote none: every finding was settled by reading the code and the loop test's scripted agents.
