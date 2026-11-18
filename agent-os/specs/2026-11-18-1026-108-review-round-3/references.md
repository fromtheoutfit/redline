# References for PR #108 Review Round 3

Shaped by Redline in unattended mode. Every file below was opened at `da09090` for this round.

## Similar Implementations

### The pull request's own spec

- **Location:** `agent-os/specs/2026-11-18-0819-99-call-decision-states-its-disposition/shape.md`
- **Relevance:** decision 12 (`shape.md:34`, two statements for one id: the first is kept, with a warning) and decision 20 (`shape.md:60`, a value outside the three is no statement), which answer R3-3; the description's list of resolve-time stops, each "resumable at the resolve label" (R3-4).
- **Key patterns:** a behaviour the spec records is answered from it; where the code disagrees, the code is brought to it.

### Rounds 1 and 2

- **Location:** `agent-os/specs/2026-11-18-1026-108-review-round-1/shape.md` (R1-4 and R1-6 declined, the repeat warning and the out-of-range message; R1-5, the named-decision checks and `whose`); `agent-os/specs/2026-11-18-1026-108-review-round-2/` (R2-3, the split stray warning and `strayNamed`; R2-6, the intake check; Unattended answer 8 on #81; the plan layout this plan follows).
- **Relevance:** R3-1 follows from R2-6, R3-5 and R3-6 from R2-3 and R1-5; R3-3 is distinct from R1-4 and R1-6.

### The intake check and run()'s normalization of an agent's error

- **Location:** `workflows/redline-loop.js`, 236-246 (`CALL_ENDS`, `const decisions`, the R2-6 loop); `fail` at 30; `errorText` and its comment, 580-587.
- **Relevance:** R3-1: the refusal of `''` and `null`, and the precedent that `""`, `''` and `null` are empty.

### resumeLine and run()

- **Location:** `workflows/redline-loop.js`, 556-576 (`resumeLine`, the shaper's sentence at 566-568, the return at 575) and 589-600 (`run`).
- **Relevance:** R3-4: what a resumed resolve is told, and where the new clause goes.

### relaunch.how

- **Location:** `workflows/redline-loop.js:2652`; `main`'s version at main 2620.
- **Relevance:** R3-2's plan clause.

### resolveWith: statements, stray warnings and named checks

- **Location:** `workflows/redline-loop.js`, 3750-3900: `overridesFor` 3733, `overrides` 3734, `awayFromDefer` 3739, the statements comment 3788-3796, `statements` 3797, `asked` 3801, `unstated` 3802-3805, the stray block 3816-3831 (`strayOverride` 3823, `strayNamed` 3824, the override warning 3827, the named-call warning 3830), `named`/`namedAs`/`whose` 3851-3853, the named checks 3889-3896; the two call sites of `resolveWith`, 3959 (`calls, overrides`) and 4030 (`raised, []`, after `calls = calls.concat(raised)` at 4028); `firstPerId` 815-826; `RESOLVE_SCHEMA`'s enum at 905.
- **Relevance:** R3-3, R3-5, R3-6.

### The resolve agent's file

- **Location:** `agents/redline-resolve.md`, "What you do" steps 2 and 3 (pending entries and `Pending decision` tasks), and "Rules".
- **Relevance:** R3-4: what a rerun acts on, and where the new bullet goes.

### The skill's records of a decision

- **Location:** `skills/redline/SKILL.md`, lines 186-191 (the plan dial: a changed disposition with one, an ask "as in the `decisions` hand-off"), 215, 224, 228 and 232 (`Record each answer` with no disposition); 272 (an error stop, "once the cause is fixed by hand").
- **Relevance:** R3-1, R3-2, R3-4.

### The loop test

- **Location:** `tests/loop-test.mjs`: `go()` and its run-record check (351-374); the resolve mock (255-282, the `named` read of a key's presence at 265); the intake refusals (596-607); section 13, the resume scenarios and the relaunch note's checks (1425-1456, `line` at 1435); the statement checks (3225-3243: `unstated`, `statedTwice`, `misstated`); `namedStray` (3262-3263); `overrideBuilt` and its warning check (3355-3361); `overrideAccepted` (3366-3367).
- **Relevance:** every task's checks sit beside these.

### The docs

- **Location:** `docs/running.md`, "Deferred items", bullet "A deferral you chose at a call" (126), and "Hand-off and relaunch".
- **Relevance:** the Docs entries of Tasks 2 to 7, and Task 5's clause.

### Open issues

- **Location:** `scripts/redline-gh.sh issues-search "resume resolve"` (#106), `issues-search "relaunch.how"` and `issues-search "resume line"` (#69, #98, #77).
- **Relevance:** none covers a finding of this round (Unattended answer 3).
