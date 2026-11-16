# References for PR #94 Review Round 2

Shaped by Redline in unattended mode. Every file below was opened at `e788107`.

## Similar Implementations

### Round 1 of this pull request

- **Location:** `agent-os/specs/2026-11-13-1329-94-review-round-1/`
- **Relevance:** The format this plan follows (a task per finding, files by path, a Docs entry, a commit line, the gate task with expected counts and an As built section) and the format of Decisions, Proportionality, Declined and Unattended answers. Its R1-12 fix (the per-pass `why_human` schema) is the pattern R2-3 extends to the disposition enum; its R1-13 fix moved `checkWhy` after the `spec status` call, which R2-9 corrects; its As built gives this round's starting counts (line 590) and the sentence on the resume label that R2-9 shows was wrong (line 599).

### The #93 spec (the pull request's own)

- **Location:** `agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/`
- **Relevance:** Its `shape.md` records the owner's answers this round answers from: answer 1 (a correctness item put to the person buys the round; R2-11), answer 10 and the Task 5 deviation (the final nit pass's three wordings; R2-12's deferral), the Task 6 deviation (a human review pass keeps "the author"; R2-4's decline), and the shaping default "A candidate the verifier left out, or gave an unknown outcome or a bad ref, becomes an unconfirmed correctness item" (line 86; R2-5). Its `plan.md:237` laid out the Fixed caption R2-14 rewords.

### The #86 round 1 spec and the #80 round 1 spec

- **Location:** `agent-os/specs/2026-11-11-1409-86-review-round-1/shape.md` (Decision 4, Unattended answers 4 and 6) and `agent-os/specs/2026-11-06-1019-80-review-round-1/shape.md` (Decision 3).
- **Relevance:** Where the exact match of a coverage ref came from, and the earlier decision not to loosen it, which left the question open (R2-5).

### Code read for each finding

- `workflows/redline-loop.js`: `login` and `personLabel` (185-193), `KINDS` and its neighbours (336-352), `passOf` (362-381), `stageError` and `run()` (457-500), `shapeSchema` and `SHAPE_SCHEMAS` (671-719), `findingLine` and `scopedLine` (899-915), `decisionSentence` and `leftDecision` (1125-1165), `replyBody`'s rule line (1296), `reviewPrompt`'s end (1378-1391), `coverageCandidates` (1457-1490), `accountCoverage` (1508-1576), `reshapePrompt` (1680-1690), the relaunch note in `result()` (2205-2224), `review()`'s rename and the accounting (2270-2370), `outcomesFor` and `describeOutcome` (2498-2555), `checkDispositions`, `checkCalls`, `checkWhy` and `checkSpec` (2557-2668), `revise()` from the shaper to the result (2836-3130), `handoffComment` (3137-3272), `handoffResult` (3600-3632), the human review pass's nit pass (3685-3712) and the round loop's endings (3805-3870).
- `scripts/redline-gh.sh`: the header (25-60), `prior-findings` (330-380), `place` (211-231). `scripts/redline-setup.sh:785-797`.
- `agents/redline-reviewer.md:63-66`.
- `skills/redline/SKILL.md`: lines 170-215 and 240.
- `docs/running.md`: lines 43, 69 and 140-160. `docs/contract.md:121`.
- `tests/loop-test.mjs`: the agent mock (60-245), `f`, `baseArgs` and `go` (246-282), the guided handoff check (323), the plan dial (346-381), the ask-rules schema checks (1060-1080), the resume checks (1155-1200), the coverage accounting checks (1450-1480), the key-phrase checks (1560-1575), the posted-text Fixed check (1864), the ask-reason and human pass checks (2040-2066), the done-rule checks (2110-2197), the layout and overrule checks (2206-2275). `tests/gh-test.sh`: the fixture copy line (62), the fake `gh` routing (147-149) and the PR 16 and PR 17 cases (255-281); `tests/gh-fixtures/reviews-17.json` and `comments-17.json`.
- `agent-os/standards/workflow/agents.md` (lines 1-40), `agent-os/standards/workflow/replay.md` (lines 13, 19 and 20), `agent-os/standards/testing/tests.md` (lines 1-40).
