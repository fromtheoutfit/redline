# References for #106: a decided finding's task follows the reshape

## Similar Implementations

### The finding and its drafted issue (#103, R3-4)

- **Location:** `agent-os/specs/2026-11-17-1643-103-review-round-3/shape.md`, unattended answer 5, Decision 1 and `## Deferred`.
- **Relevance:** the finding this issue comes from, with its trace, the two designs and the loop case the issue asks for.
- **Key patterns:** the split it left in place ("the shaper's `findings[].files` for a finding nobody decided, the resolve agent's tasks for one the person or autopilot decided"), which this spec keeps for the first half and extends for the second.

### The list the plan approver and the implementer are shown (#103, R1-2 and R2-11)

- **Location:** `agent-os/specs/2026-11-17-1643-103-review-round-1/shape.md` (Decision 1) and `-round-2/shape.md` (Decision 9); `workflows/redline-loop.js`, `effectiveDispositions`; `tests/loop-test.mjs`, `approverFiles` and `implementerFiles`.
- **Relevance:** where the condition this spec widens was set: a decided finding shown as `defer` carries `plannedFiles`, "every other finding keeps the shaper's list".
- **Key patterns:** one function builds what both agents are shown; a loop check parses the findings JSON out of each prompt and reads one finding's disposition and files.

### What a call's decision ends in, and the resolve-time stops (#99; #108, R1-5)

- **Location:** `agent-os/specs/2026-11-18-0819-99-call-decision-states-its-disposition/shape.md` (decisions 11 to 18); `agent-os/specs/2026-11-18-1026-108-review-round-1/shape.md` (R1-5); `workflows/redline-loop.js`, `stated`, `namedAs`, `statedAs`, `whose` and the four stops in `resolveWith`.
- **Relevance:** the rule decision 13 runs again after a reshape: a fix has a task with files, an accept has none, and the stop sits where a rerun can replan.
- **Key patterns:** a stage error whose message says what the agent returned and what the rule is, pinned by text and `resumeFrom` label; the disposition a decision ends in is its own named one, else the stated one.

### A resume line chosen by the stop (#108, R3-4 and R4-4)

- **Location:** `workflows/redline-loop.js`, `resumeLine` (`resolveFix`); `agent-os/standards/workflow/replay.md`, line 19.
- **Relevance:** the form of the reshape's new resume clause: keyed on how the error opens, so only the workflow's own check of what the step returned gets it.
- **Key patterns:** each such check opens its error with the same words; the neighbour, a resume after another stop of the same agent, keeps the old line and is pinned.

### A new ask in the block only its calls carry (#99)

- **Location:** `workflows/redline-loop.js`, `resolvePrompt`, the `decided` ask inside the calls block; `agent-os/standards/workflow/replay.md`, line 23; `tests/loop-test.mjs`, "filing: the resolve prompt of a run with overrides and no call asks for no disposition".
- **Relevance:** how the reshape block is placed: appended through an interpolation that is empty when the round has no tracked decided finding.
- **Key patterns:** the prompt states the whole ask; the agent file gains it and changes no other rule; the loop test pins the block's presence and its absence.

### A reshape and a decided finding (#94, R8-6; #97, R3-6 and R2-14)

- **Location:** `workflows/redline-loop.js`, the reshape loop in `revise()`: `restated`, `stillDeferred`, the second `resolveWith`; `tests/loop-test.mjs`, `restated`, `shortReshape`, `strayReshape`, `acceptedResorted`, `strayRaised`, `unbuilt`.
- **Relevance:** what stays dropped from a reshape (a decided finding's disposition and entry), and the scenarios whose reshape mock now answers the block.
- **Key patterns:** a decision stands whatever a reshape lists for its finding; a second resolve applies the raised calls alone.

### Settling a class with a recorded sweep (#112, round 4 by hand; #75)

- **Location:** `agent-os/specs/2026-11-20-1057-112-review-round-4-by-hand/shape.md`; issue #75, the Nov 20 comment.
- **Relevance:** why the reader list exists, and the form of the fingerprint sweep in Verification: every scenario's prompts under the old script and the new one, compared, with each difference explained.
- **Key patterns:** enumerate the inputs, measure, and put the table in the spec.

## Code read

- `workflows/redline-loop.js`: `taskFilesOf`, `stageError`, `resumeLine`, `run`, `shapeSchema`, `FILES_ASK`, `RESOLVE_SCHEMA`, `PLAN_SCHEMA`, `shapePrompt`, `reshapePrompt`, `resolvePrompt`, `planPrompt`, `implementPrompt`, `outcomesFor`, `forceAskRules`, `fileDeferred`, `deferredEntry`, `draftView`, `heldStop`, `vetShape`, `handoffResult`, `result`, and in `revise()`: `shaperFiles`, `draftsOf`, `resolveWith`, `effectiveDispositions`, `plannedFiles`, `isDeferral`, `draftStop`, the approve loop, `needCommits`, the filing, the outcomes and the two warnings.
- `agents/redline-shaper.md` (rules 7 and 10), `agents/redline-plan-approver.md` (rules 1, 5 and 6), `agents/redline-resolve.md` (step 3), `agents/redline-implementer.md` (rule 3).
- `tests/loop-test.mjs`: the scripted shaper, resolve agent and plan approver; `go`, `samePrefix`; the `filing:` section from `chosen` to `unbuilt`; the reshape cases near `decidedAsk`.
- `skills/redline/SKILL.md`: the error section and "The round's deferred drafts". `docs/running.md`: step 3, "Deferred items", "Hand-off and relaunch".
- Issues #106 (with its Nov 18 comment), #75 (the Nov 20 comment), #104, #105, #109.
