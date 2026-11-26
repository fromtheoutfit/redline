# References for Template v6: option ends, instance or class, a rule call the person defers (#105, #75, #126)

## The issues

- **#105**, with its comment of 2026-11-18: `files` in point 10's example, and the per-option disposition.
- **#75**, with its comment of 2026-11-20: the evidence from #112 (two classes, an instance fixed a round, the cap), and why a wider fix is not always the answer.
- **#126**: the rule call the person deferred on `fromtheoutfit/loser` #839 (R1-3), filed by hand as `loser` #843.

## Similar Implementations

### The resolve agent states what a call's decision ends in (#99)

- **Location:** `agent-os/specs/2026-11-18-0819-99-call-decision-states-its-disposition/` (decisions 11 to 17; "Noted follow-up: the shaper states a disposition on each option"); `workflows/redline-loop.js`, `resolveWith`.
- **Relevance:** It built the three record checks this spec reuses for a pick, and named this spec's design as the one that closes the case it could not see.
- **Key patterns:** A statement held to the tasks and entries the same resolve returned; a decision that names its own disposition has no entry in `decided`; the ask sits in the calls block and nowhere else in the prompt.

### A decided finding's task follows the reshape (#106)

- **Location:** `agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/` (decision 15; "For you to open", which became #119); `workflows/redline-loop.js`, `tracked`, `effectiveDispositions`, `isDeferral`.
- **Relevance:** Decision 15 kept "today's reading everywhere" for a finding left under a rule; this spec replaces that reading for a decision that ends in defer (table C, row 21).
- **Key patterns:** A class settled by a table of every reader before planning; a block the reshape prompt carries only in a round it concerns.

### The by-hand round of #112

- **Location:** `agent-os/specs/2026-11-20-1057-112-review-round-4-by-hand/`.
- **Relevance:** The evidence for #75: one class closed by a measured sweep that found a member no review had reached, the other by a one-place fix. The loop replay of Task 4 is built from it.
- **Key patterns:** The sweep's table, each member measured by running; the one-place fix that needs no list.

### Repository ask rules and the forcing point (#49; #94, R8-4)

- **Location:** `workflows/redline-loop.js`, `forceAskRules`, `leftDecision`, `leftToYou`; `agents/redline-shaper.md`, rule 7; `docs/contract.md`, "Ask rules".
- **Relevance:** The one function that leaves a finding to the person, for a rule and for one of Redline's own files. #126 changes what such a finding can end in.
- **Key patterns:** One record (`record.forced`) read by the replies, the handoff and the thread sweep; the outcome kind `left`.

### Deferred items, their drafts and their stops (#95, #97, #100)

- **Location:** `workflows/redline-loop.js`, `draftsOf`, `draftStop`, `fileDeferred`, `settleHeld`, `issueDraft`; `skills/redline/SKILL.md`, "The round's deferred drafts".
- **Relevance:** The path a deferred rule call takes after the person chooses it: drafted, raised, filed, replied to.
- **Key patterns:** Every body is shown before anything is filed; an answer names the version of the draft it saw; no commit is demanded of a deferral.

### A stop that is the workflow's own check (#116, #117)

- **Location:** `agent-os/specs/2026-11-22-1306-117-resumed-reshape-corrects-in-place/`; `workflows/redline-loop.js`, `checkError`, `resumeLine`; `tests/loop-test.mjs`, `OWN_CHECKS`.
- **Relevance:** Every new stop of this spec is raised through `checkError` and uses a resume sentence that exists. Its plan is also the model for the sweep of Task 6.
- **Key patterns:** The fact is set where the stop is raised; a sweep of every scenario under the script before and as built, each exception named.

### The unattended section's versions (#15, #64)

- **Location:** `templates/shape-spec-unattended.md` and `templates/history/`; `scripts/redline-setup.sh unattended`; `tests/setup-test.sh` (`ubody_pin`, the history cases, this checkout's own section); `docs/upgrading.md`, "Unattended section versions".
- **Relevance:** The bump to v6: the marker, the frozen v5, the pin, and the three-way merge that keeps this repository's three hand edits.
- **Key patterns:** A body change bumps the marker and freezes the previous body in the same commit; a rerun merges once per marker.
