# References for PR #103 Review Round 1

Shaped by Redline in unattended mode. Every location below was opened at `5a9c2f1`.

## The pull request's own spec

### #100: a deferral ships from the round's record

- **Location:** `agent-os/specs/2026-11-17-1535-100-deferral-ships-from-the-record/` (`shape.md`, `plan.md`)
- **Relevance:** the decisions this round answers from (Unattended answers 3 and 4): decision 1 and Task 5's view (the words beside a planned task only), decisions 10 and "Why the template is not touched" (no template change, a patch release), decisions 11 to 13 (no commit demanded of a deferral; the record decides; "planned" split by who decided), and the drafted comment for #99.
- **Key patterns:** a deferral's commit is never demanded; a decided finding is read from the resolve agent's tasks.

## Code the findings name

### The round's deferrals and the commit demand

- **Location:** `workflows/redline-loop.js:3773-3809` (`effectiveDispositions`, `plannedTask`, `shaperPlanned`, `plannedFiles`, `isDeferral`), `3943-3953` (`deferralIds`, `needCommits`), `4017-4046` (`roundDeferrals`, `outcomesFor`, the two warnings), `4113-4119` (`buys`, `bought`, `fixed`)
- **Relevance:** R1-10 (`deferralIds` counts a final `defer` that `isDeferral` rejects), R1-11 (`isDeferral` reads an override's entry), R1-12 (the decided text at 4044).
- **Key patterns:** `awayFromDefer` (3694-3697) states that an override away from defer leaves no deferral behind; the reshape's restated entries are dropped (3870-3879).

### The plan approver's prompt

- **Location:** `workflows/redline-loop.js:2067-2090` (`planPrompt`), `3835-3840` (its call); `agents/redline-plan-approver.md:16` (rule 1)
- **Relevance:** R1-2: the prompt's findings keep the shaper's `files` beside an overridden disposition, while rule 1 holds the list to the plan.

### The resolve prompt

- **Location:** `workflows/redline-loop.js:2015-2065` (`resolvePrompt`; the call sentence at 2046, the override block at 2052)
- **Relevance:** R1-11 and R1-2: what the resolve agent is asked to return for a call and for an override.

### Drafts and their versions

- **Location:** `workflows/redline-loop.js:219` (`draftAnswered`), `1318-1331` (`issueDraft`), `3380-3410` (`deferredEntry`, `draftView`), `3412-3496` (`heldDrafts`, `heldStop`, `settleHeld`), `3621-3658` (`shaperFiles`, `draftsOf`, `openDrafts`, `shaperDrafts`), `3810-3816` (`draftStop`)
- **Relevance:** R1-9 (the version counts the issue text only), R1-7 (the words blanked when nothing ships), R1-8 (the default `filesOf = plannedFiles`).

### Outcomes and replies

- **Location:** `workflows/redline-loop.js:2916-2967` (`outcomesFor`), `2985-3009` (`describeOutcome`), `1512-1545` (`replyBody`), `596-598` (`ownCommit`)
- **Relevance:** R1-6 (the fallbacks at 1523 and 2993 and the field at 2954 are unreachable), R1-1 (an uncounted commit is not in `fixed`).

### The two helpers named `filled`

- **Location:** `workflows/redline-loop.js:774-783` and `1717-1718`
- **Relevance:** R1-5 and R1-7 (the comment above the module-level helper).

### The next round's range

- **Location:** `workflows/redline-loop.js:4960-4980`
- **Relevance:** R1-1: a round that bought nothing and fixed nothing ends at the handoff; otherwise the next range runs from the previous head to the new one.

## Tests

### The loop harness

- **Location:** `tests/loop-test.mjs:190-259` (the scripted shaper and resolve agent: `files`, `acceptedCalls`, `resolveDeferred`, `reshapeDefer`), `2825-2841` (the defer section's statement loop), `2847-2923` (the defer section: the pinned case, the mirror, `unlisted`, `deferAccepted`), `3076-3119` (the filing section: `chosen`, `strayResolve`, `strayWorded`, `strayReshape`, `mitigateCall`, `chosenEntry`, `chosenBare`, `chosenUnbuilt`, `strayRaised`), `3160-3172` (the first stop's view)
- **Relevance:** every new check sits beside the scenario it neighbours; the scripted agents answer as the real ones would (testing/tests, line 7).

### The reviewer's reproduction

- **Location:** `/tmp/redlinerepro/reviewer-r1-repro.mjs`
- **Relevance:** the scenarios behind R1-2 (c2), R1-9 (c5c6), R1-10 (c11), R1-11 (c1) and R1-1 (c3). The guard refuses `node` to the shaper, so it was read, not run; each claim was traced through the code above.

## Docs and templates

- `README.md:111` (Known limits, "No commit is demanded of a deferral"): R1-1.
- `docs/running.md:125` ("Deferred items", Whether a mitigation shipped): R1-1, R1-7, R1-12.
- `skills/redline/SKILL.md:184` (the plan dial's field list) and `:217` (the drafts stop): R1-3, R1-7.
- `templates/shape-spec-unattended.md:66-97` and `.claude/commands/agent-os/shape-spec.md:57-88` (point 10's example and sentence): R1-4.
- `agents/redline-shaper.md` (rule 10 and its example): R1-4.

## Issues

- #99 (open): "Have the resolve agent name each decision's disposition, so a stray deferred entry beside a fix is not filed". Found with `redline-gh.sh issues-search "99"`. Its subject is a call's decision; R1-11 is an override's (`shape.md`, Unattended answer 5).
- #100 (open): the issue this pull request closes.
- No open issue covers R1-4, R1-6 or R1-9 (`redline-gh.sh issues-search` for `deferral`, `draft version`, `plan approver` and `template example files`).
