# References for PR #94 Review Round 4

Shaped by Redline in unattended mode. Every file below was opened at `4227e11`.

## Similar Implementations

### Rounds 1 to 3 of this pull request

- **Location:** `agent-os/specs/2026-11-13-1329-94-review-round-1/`, `agent-os/specs/2026-11-13-1329-94-review-round-2/` and `agent-os/specs/2026-11-13-1329-94-review-round-3/`
- **Relevance:**
  - Round 3's folder gives the format this plan follows: a task per finding, files by path, a Docs entry, a commit line, the gate task with expected counts, an As built section, and the format of the shaping notes. Its As built gives this round's starting counts.
  - Round 3's Declined entry for R3-5 is the decision R4-7 carries.
  - Round 1's R1-9 introduced `decideRule`, which R4-4 and R4-5 narrow; its R1-17 capitalised the label in `capComment`, the site R4-3 shares; its R1-20 moved the main loop's gate to `fixed`, the move R4-12 completes.
  - Round 2's R2-12 (the `fixed` count) sits next to R4-12, and R2-15 (a decline already overruled left out of a second stop) next to R4-8.

### The #93 spec (the pull request's own)

- **Location:** `agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/shape.md`
- **Relevance:** Decision 1 (line 42) is the done rule that answers R4-10. Decision 7 (line 48) states the overrule door R4-4 and R4-8 keep. The Task 3 deviation (line 60) states what the other roles' prompts say, which R4-4 and R4-5 make precise.

### Numbering after the highest id

- **Location:** `workflows/redline-loop.js`, `accountCoverage` (line 1576) and `reconcilePrior` (line 2442).
- **Relevance:** the pattern R4-6's rename follows.

### Code read for each finding

- `workflows/redline-loop.js`:
  - `personLabel` (185-190) and `decisionSentence` (1131-1136);
  - `NOT_YOURS`, `NEVER_DECIDE` and `decideRule` (328-354), and `rulesBlock` (443-447);
  - `accountCoverage` and its constants (1520-1592);
  - `reshapePrompt`, `resolvePrompt` and `planPrompt` (1695-1778), `standardsPrompt` (1780-1788), `implementPrompt`'s decide line (1861);
  - `humanShapePrompt`'s findings block (1660-1693);
  - `review()`'s rename and field clean-up (2280-2340);
  - `reconcilePrior`'s numbering (2430-2452);
  - `outcomesFor` and `describeOutcome` (2524-2579);
  - `checkDispositions` (2581-2620) and the head of `checkCalls` (2622-2629);
  - `revise()` from the shaper through the approve loop and the outcomes (2858-3168);
  - `handoffComment`'s groups (3175-3290);
  - `humanSummary` and `capComment` (3338-3390);
  - `handoffResult` (3644-3684);
  - the human-review path (3711-3768) and the main loop's endings (3905-3925).
- `RESOLVE_SCHEMA` (723-739).
- `git show origin/main:workflows/redline-loop.js`: the decide-rule uses (lines 319, 1583, 1623, 1650, 1660, 1736) and the rename (line 2182).
- `agents/redline-resolve.md` (whole), `agents/redline-plan-approver.md` (whole), `agents/redline-implementer.md` (line 17), `agents/redline-shaper.md` (lines 28-29).
- `skills/redline/SKILL.md`: lines 98, 195-216 and 240. `skills/redline-revise/SKILL.md`: line 19 (through the finding).
- `docs/running.md`: lines 36-48, 108-138 and 224-226. `README.md`: lines 56, 70, 88, 100-103.
- `tests/loop-test.mjs`:
  - the mock (150-260);
  - the human-pass scenario (904-961);
  - the rules scenario (1060-1160);
  - the coverage helpers and the rename check (1367-1411, 1486-1495);
  - the decline scenario (2053-2130);
  - the overrule and layout checks (2240-2375).
- `.claude/redline.json` (no `askRules`), `.claude-plugin/plugin.json` (`0.3.0`; `main` `0.2.4`).
- `agent-os/standards/workflow/agents.md` (lines 8-20, 34-40), `agent-os/standards/workflow/replay.md` (whole), `agent-os/standards/testing/tests.md` (lines 1-20), `agent-os/standards/process/docs-gate.md` and `agent-os/standards/process/release.md`.
