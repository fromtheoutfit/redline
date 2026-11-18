# References for PR #103 Review Round 3

Shaped by Redline in unattended mode. Every file below was opened at `96f014f`.

## Similar Implementations

### The record of a deferral's task, and its readers

- **Location:** `workflows/redline-loop.js`, in `revise()`:
  - `resolveWith` (3718-3789): `resolvedTasks.push` at 3783;
  - `effectiveDispositions` (3790-3799);
  - `plannedTask` (3800-3801) and `plannedFiles` (3802-3810);
  - `isDeferral` (3811-3834);
  - `draftStop` (3835-3841);
  - the approve loop and the reshape (3856-3925);
  - `roundDeferred` and `needCommits` (3968-3988);
  - the planned-and-unbuilt warning (4061-4076);
  - the done rule (4125-4149).
- **Relevance:** R3-4 and R3-6. `resolvedTasks` is written only by a resolve, and a reshape runs none unless it raises a call. `plannedTask` and `plannedFiles` both read those tasks for a decided finding.
- **Key patterns:** the split by who decided (`roundDecisions[id]`); the reshape's entry for a decided finding dropped with a warning (`restated`, 3895-3904); an override's disposition decides (`isDeferral`, R1-11). The base branch's form is at `git show origin/main:workflows/redline-loop.js` (3755-3790 and 3915-3926), which shows the approver's view before R1-2 and `plannedTask` unchanged.

### What a stop and the result show of a deferral

- **Location:** `workflows/redline-loop.js`, `deferredEntry` (3387-3401), `draftView` (3403-3419), `heldDrafts` and `heldStop` (3421-3430), `handoffResult`'s plan dial (4677-4702: `deferredPlanned` is `outcome.shaped.deferred`, 4694).
- **Relevance:** R3-1, R3-2, R3-3. `ships` is the plan before the build and the commit at the end-of-run stop, and the words are returned as written beside `ships: true`.

### The skill's three sentences

- **Location:** `skills/redline/SKILL.md`, the plan dial's field list (184), the drafts rule (217 and 220), the `done` section (264) and the `capped` section (268).
- **Relevance:** R3-1 (184), R3-2 (220), R3-3 (220, 264).

### The comments to rewrap

- **Location:** `workflows/redline-loop.js`, 3403-3406 (above `draftView`) and 3811-3818 (above `isDeferral`); `git blame` names commits `51e291dd` and `cfb4a1c6` of this pull request for the three long lines.
- **Relevance:** R3-5. The file has 1185 comment lines, 1140 at 100 columns or less; at `96f014f` eight run past 120, on origin/main five.

### The loop test's scenarios

- **Location:** `tests/loop-test.mjs`:
  - the scripted shaper and resolve agent (195-259);
  - the defer section's statement loop and source checks (2825-2851);
  - the pinned case and the mirror (2891-2915);
  - the plan approver's and implementer's file views (3091-3141);
  - `strayResolve`, `strayWorded`, `strayReshape`, `strayReshapeUnbuilt` (3142-3163);
  - the override pins (3164-3186);
  - `shortReshape`, `restated`, `chosenBare` and `chosenUnbuilt` (3187-3206).
- **Relevance:**
  - R3-6's neighbours, which read `isDeferral`'s branch for a call.
  - `restated`, which shows a reshape listing a decided deferral with no files while the resolve's task stands (R3-4's Decision 1).
  - The place each new check goes, after line 2851.

### The plan approver and the reshape prompt

- **Location:** `agents/redline-plan-approver.md`, rule 1 (line 16); `workflows/redline-loop.js`, `reshapePrompt` (2004-2020) and `resolvePrompt` (2022-2072); the resolve schema (875-890).
- **Relevance:** R3-4. Rule 1 bounces a defer whose list and plan disagree, and the reshape keeps a decision the person made "as it is" while applying each adjustment. R3-6: the resolve schema requires every task's `files`.

## Specs read

- **The pull request's spec,** `agent-os/specs/2026-11-17-1535-100-deferral-ships-from-the-record/shape.md`, decision 13 (line 28): a decided finding "reads the resolve agent's `tasks[].files` only". This is R3-4's Unattended answer 5.
- **Round 1,** `agent-os/specs/2026-11-17-1643-103-review-round-1/shape.md`:
  - Decision 1 (R1-2): the plan approver is shown `plannedFiles`.
  - Decision 10 (R1-9): deferred, a reshape's edit a draft's version misses, now #104.
- **Round 2,** `agent-os/specs/2026-11-17-1643-103-review-round-2/shape.md`:
  - Decision 8 (R2-9): a base-branch helper left redundant, removed as a small refactor.
  - Decision 9 (R2-11): `effectiveDispositions` carries `plannedFiles`.
  - Decision 11 (R2-10): declined, two agents against their prompts.
  - Decision 13: one red run for several tasks on a slow machine. `plan.md`'s As built gives the loop count 1378.

## Issues searched

`scripts/redline-gh.sh issues-search` for `reshape`, `plannedFiles`, `resolve tasks` and `99`:

- #104 (open, R1-9's draft version);
- #99 (open, the resolve agent naming each decision's disposition);
- #1, which is unrelated.

None covers R3-4.
