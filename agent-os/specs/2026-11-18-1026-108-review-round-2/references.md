# References for PR #108 Review Round 2

Shaped by Redline in unattended mode. Every file below was opened at `81565cc` for this round.

## Similar Implementations

### The pull request's own spec

- **Location:** `agent-os/specs/2026-11-18-0819-99-call-decision-states-its-disposition/shape.md`
- **Relevance:** decision 16 (the check's demand for a call comes from the statement alone), decision 17 (a call's decision that names a disposition keeps deciding, with no statement), decision 21 (`fixNoFilesBeside`, a fix held to its own task's files), and the description's list of stops (R2-4).
- **Key patterns:** a behaviour the spec records as deliberate is answered from it, never reopened.

### Round 1's spec

- **Location:** `agent-os/specs/2026-11-18-1026-108-review-round-1/`
- **Relevance:** R1-8 (the forced test on the stated branch of `needCommits`, which R2-5 extends to the whole list), R1-2 (the prompt's exemption for a named call, which R2-1 has the mock follow), R1-5 (named decisions held to the resolve-time checks, which R2-3's warning and R2-6's intake check complete), and its plan's task layout, which this plan follows.

### resolveWith, its stray-entry warnings and its checks

- **Location:** `workflows/redline-loop.js`, 3746-3880 (`awayFromDefer` 3733, `asked` 3795, `strayOverride` 3814-3817, `strayCall` 3823-3826, `named`/`namedAs`/`whose` 3837-3839, `taskFiles` 3858).
- **Relevance:** R2-3's warning, R2-4's stop, R2-6's readers of a named disposition.

### needCommits

- **Location:** `workflows/redline-loop.js`, 4081-4093; `main`'s version at main 3981-3984 (`git show main:workflows/redline-loop.js`).
- **Relevance:** R2-5 (the first branch's missing forced test) and R2-6 (the removed resolve-task clause that caught a disposition outside the three).

### forceAskRules on a reshape

- **Location:** `workflows/redline-loop.js`, 3249-3320 (`s.disposition = 'ask'` at 3289; `record.forced` set for a decided finding not yet forced at 3317-3318); `vetShape` and the approve loop, 3960-4025.
- **Relevance:** R2-5 and R2-7: a reshape after a bounced plan can force a decided finding after its resolve.

### The argument checks at intake

- **Location:** `workflows/redline-loop.js`, 170-290 (`fail` at 30; `args.deferrals` 206-213; `args.resume` 257-266; `args.drift` 281-284; `const decisions` 234).
- **Relevance:** R2-6's check follows the same form, and its loop case the same pattern as `bad scope: refused` (`tests/loop-test.mjs:598`).

### The resolve prompt's calls block and the resolve agent's file

- **Location:** `workflows/redline-loop.js:2079`; `agents/redline-resolve.md:24`.
- **Relevance:** R2-4's clause, and R2-1's statement that a named call has no entry in `decided`.

### The comments around DEFERRED_SCHEMA

- **Location:** `workflows/redline-loop.js`, 769-791; the pull request's diff of that hunk (`git diff main...HEAD -- workflows/redline-loop.js`); the source checks that read a phrase of these comments with `src.includes`, at `tests/loop-test.mjs:2865` (`only beside a mitigation the record says ships`, today at 784), 2870 (`since #99 nothing reads the field to decide anything`, today at 771) and 2871 (`the plan dial's list of the shaper's`, today at 785), and the negatives of 2870 and 2890.
- **Relevance:** R2-2's fold, and Plan adjustment 1: the new comment keeps each phrase whole on one line.

### The loop test

- **Location:** `tests/loop-test.mjs`: the resolve mock (255-276), the named-call scenarios (3236-3249, 3277), the resolve-time stops (3257-3283, `fixNoFilesBeside` at 3268-3269), `forcedLater` (3285-3294), the prompt checks (3299-3306), `overrideBuilt`'s warning (3334).
- **Relevance:** every task's checks sit beside these.

### The implementer's prompt and file

- **Location:** `workflows/redline-loop.js`, 2180-2215 (`implementPrompt`); `agents/redline-implementer.md`, "How you work" step 3 and Rules; the reshape prompt, 2020-2036.
- **Relevance:** R2-7's second look: what the implementer is shown and when it stops.

### The skill's records of a disposition

- **Location:** `skills/redline/SKILL.md`, lines 189, 215, 224, 228.
- **Relevance:** R2-6: the skill writes a disposition only as `fix`, `defer` or `accept`.

### The docs

- **Location:** `docs/running.md`, "Deferred items", bullet "A deferral you chose at a call" (126); "Hand-off and relaunch" (135); `docs/contract.md`, "Ask rules" (139-150).
- **Relevance:** the Docs entries of Tasks 4 to 7.

### Open issues

- **Location:** `scripts/redline-gh.sh issues-search "ask rule reshape"` and `issues-search "106"`: #106, "Read a reshape's change to the task of a deferral the person or autopilot decided".
- **Relevance:** neighbouring, not covering R2-5 or R2-7 (Unattended answer 3).
