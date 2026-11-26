# References for PR #127 Review Round 1

Shaped by Redline in unattended mode. Every file below was opened at `d6217dc` while shaping.

## Similar Implementations

### Checks that already name every failure

- **Location:** `workflows/redline-loop.js`, `checkDeclineReasons` (3661-3665) and the ask-with-no-call half of `checkCalls` (3522-3525); the unsorted check in `vetShape` (4160-4163)
- **Relevance:** R1-5's mitigation (Task 6)
- **Key patterns:** collect the failing ids first, throw one `checkError` naming them all; with one failure the text reads as a single-failure message

### The forcing point and the left-call option check

- **Location:** `workflows/redline-loop.js`, `OWN_FILE` (439), `LEFT_CALL` (1125), `forceAskRules` (3747-3835), `checkOptions` (3574-3603), `draftMissing` (1007), the left-deferral draft source in the resolve step (`optionDraft`, 4416-4433) and the resolve step's undrafted-deferral stop (4474-4477)
- **Relevance:** R1-4 (Task 3) and plan adjustments 1 and 2
- **Key patterns:** `record.forced` is the one record of a left finding, written only while the finding is undecided; `LEFT_CALL` tells the shaper to draft the defer option of a call it writes for a rule or for one of Redline's own files, so only a call written under another reason is relabelled; the resolve step lets the agent's own draft stand only when the picked option carried none, and otherwise files the option's draft as it is, so a short one stops at `resolve` on every resume

### The options sentence of every shape prompt

- **Location:** `workflows/redline-loop.js`, `LEFT_CALL` and `OPTIONS_ASK` (1118-1126), `shapePrompt` (2280), `humanShapePrompt` (2319), the reshape prompt (2356); `HUMAN_WHY` (447); the own-file branch of `forceAskRules` (3773)
- **Relevance:** R1-2 (Task 4)
- **Key patterns:** a constant chosen at load time by whether the repository has ask rules, so no rule text reaches a repository without them; the same split by pass kind

### Class links

- **Location:** `workflows/redline-loop.js`, `CARRY` and `trackedList` (87, 109), `showsEarlier` and `LINK_ASK` (1846-1852), `linkFault` and `honourLinks` (3011-3053), the review call (3075-3087), the revise-only path (5686-5702); `scripts/redline-gh.sh`, `prior-findings` and its `classify` (612-642); `tests/loop-test.mjs` (5040-5070)
- **Relevance:** R1-1 (why the first review's prompt changed, and on which pull requests: every reply but "not changed in this round", and no reply, makes an earlier finding tracked) and R1-3 (Task 5)

### The cause checks

- **Location:** `workflows/redline-loop.js`, `CAUSE_ASK` (1129), `checkCauses` (3606-3655), `pathSegments` and `repoPath` (511-560); `tests/loop-test.mjs` (5066-5100)
- **Relevance:** R1-5 and R1-6 (Tasks 6 and 7)

### The left-call loop cases

- **Location:** `tests/loop-test.mjs`, the `left:` section's setup (`rules`, `ruleArgs`, `cfg`, `draft`, `filedCalls`; 4779-4792), the `auto` check (4900-4901), and the `noOptionDraft`, `bareDefer`, `wrongOption` and `ordinary` checks (4911-4923)
- **Relevance:** R1-4 (Task 3): the scenario the new block reuses, how an autopilot run's forced and filed results are read, the neighbours that pin a call the shaper wrote as left, and the error text the pins expect

### Docs

- `docs/upgrading.md`, "A stopped run across 0.5.0" (43-49): R1-1 (Task 2)
- `docs/running.md`, "Dispositions", "Left to you" (95) and "Instance or class" (86): R1-4 (Task 3) and the no-change reasons of Tasks 5 and 7
- `docs/contract.md`, "Ask rules" (150): read for R1-4 and R1-2, unchanged

### The pull request's own spec

- `agent-os/specs/2026-11-24-1231-105-template-v6-ends-class-rule-defer/shape.md`: line 54 (the replay measurement R1-1 corrects), decision 41 at line 91 (the revise-only clearing R1-3 keeps)

### The reviewer's reproduction

- `/tmp/redlinerepro/reviewer-r1-repro.mjs`: read; not run, since the node harness is refused to the shaper
