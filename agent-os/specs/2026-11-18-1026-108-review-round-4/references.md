# References for PR #108 Review Round 4

Shaped by Redline in unattended mode. Every file below was opened at `8bad058` for this round.

## Similar Implementations

### The pull request's own spec

- **Location:** `agent-os/specs/2026-11-18-0819-99-call-decision-states-its-disposition/shape.md`
- **Relevance:** decision 11 (`shape.md:26`, `decided` required in `RESOLVE_SCHEMA`), which answers R4-5; decision 13 (`shape.md:36-39`, the ask in the calls block only, an overrides-only prompt byte-identical so an old result can replay), which R4-9 meets.
- **Key patterns:** a behaviour the spec records is answered from it; where two recorded choices pull apart, the finding is put to the person.

### Rounds 1 to 3

- **Location:** `agent-os/specs/2026-11-18-1026-108-review-round-1/shape.md` (R1-5, the named-decision checks, a fix by the person's override, Decision 5), `agent-os/specs/2026-11-18-1026-108-review-round-2/shape.md` (R2-4, "a task of its own" in the calls block and the agent file, Unattended answer 4 and Decision 4), `agent-os/specs/2026-11-18-1026-108-review-round-3/shape.md` and `plan.md` (R3-1, Decision 1, only `''` and `null` read as none; R3-3; R3-4, the resume clause, Decision 4).
- **Relevance:** R4-2 is answered by round 3's Decision 1; R4-4 narrows R3-4's clause; R4-9 follows from R1-5 and R2-4.

### Intake of `args.decisions`

- **Location:** `workflows/redline-loop.js`, 235-250 (`CALL_ENDS`, `const decisions`, the comment at 238-244, the loop at 245-250); `errorText` and its comment, 591-598.
- **Relevance:** R4-2's comment and R4-3's line.

### resumeLine and run()

- **Location:** `workflows/redline-loop.js`, 556-590 (`resumeLine`, `resolveFix` at 574-580, the return at 587) and 600-613 (`run`, the crash at 609); `relaunch.how` at 2664 (the resume entry `{attempt, error, hand}`); the result's `resumeFrom` at 5170-5171.
- **Relevance:** R4-4: where the clause is chosen, and what a resume entry carries.

### RESOLVE_SCHEMA and the resolve prompt

- **Location:** `workflows/redline-loop.js`, 899-923 (`RESOLVE_SCHEMA`, the `decided` comment at 909-914); `resolvePrompt` from 2056, the calls block at 2082-2098 (the ask at 2097, its comment at 2094-2096), the overrides block at 2099-2105; `main`'s `RESOLVE_SCHEMA` (main 875-890).
- **Relevance:** R4-5, R4-6 and R4-9.

### resolveWith and isDeferral

- **Location:** `workflows/redline-loop.js`, 3743-3925: `overridesFor` 3745, `roundDecisions` 3747, `stated` 3763, the call to `run('resolve', ...)` 3784-3786, the autopilot stop 3787-3799, the statements 3800-3823, the stray block 3824-3861, the named checks 3906-3916 (`namedUnplanned` 3909-3912, `namedPlanned` 3913-3916, each reading `taskFiles(id)`, the files of the task whose own `finding` is the id); `taskFilesOf` 479; `isDeferral` 3944-3968.
- **Relevance:** R4-1, R4-4, R4-6, R4-7, R4-8, R4-9; for R4-9, the named checks are what Task 8's agent-file wording states (`shape.md`, Decision 10).

### The resolve agent's file

- **Location:** `agents/redline-resolve.md`, steps 3 (line 20), the override paragraph (21), the deferral draft (23) and the `decided` paragraph (24); Rules, "Apply, never reinterpret" (31) and "On a resume" (32).
- **Relevance:** R4-4's added sentence; R4-7's paired write to `shape.md`; R4-9's override paragraph.

### The implementer's file

- **Location:** `agents/redline-implementer.md`, steps 1, 3 and 6.
- **Relevance:** R4-7's full fix would add the instruction there; the file is not in the pull request's diff.

### docs/running.md

- **Location:** `docs/running.md`, "Deferred items", bullet "A deferral you chose at a call" (line 126).
- **Relevance:** R4-1's and R4-7's sentences; R4-9's "of its own".

### The loop test

- **Location:** `tests/loop-test.mjs`: the mock resolve (272-280), `go` and its call record (53), the autopilot `stuck` run (454-455), the resume section (1435-1475: `line` 1442, `resolveClause` 1469, `resumedResolve` 1472), `src` (18), the source checks (2893-2918), `misstatedFirst` (3267-3268), the resolve prompt and schema checks (3341-3358: the overrides-prompt check at 3353), and `noDecided` (3359-3360: the run at 3359, its check `filing: a resolve with overrides only and no decided list ends as it does with one` at 3360).
- **Relevance:** where Task 5's runs and checks go, and the checks that must stay green.

### Open issues

- **Location:** #106, "Read a reshape's change to the task of a deferral the person or autopilot decided", returned by `scripts/redline-gh.sh issues-search "106"` and by `issues-search "reshape's change to the task of a deferral"`.
- **Relevance:** the one open issue near this round's findings; it covers none of them (`shape.md`, Unattended answer 3).

### The workflow-authoring reference

- **Location:** the harness's workflow-authoring reference, section "Resume".
- **Relevance:** R4-5's second look: it says the longest unchanged prefix of agent calls replays from cache, and not whether a schema is part of a call's identity or whether a cached result is validated.
