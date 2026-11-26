# References for PR #127 Review Round 3

Shaped by Redline in unattended mode. Every file below was opened while shaping; line numbers are at `b696aee`.

## Similar Implementations

### Decision intake and the round's pre-resolve readers

- **Location:** `workflows/redline-loop.js`, 237-283 (the three intake loops over `args.decisions`), 4405-4406 (the shaper's draft filter), 4443 (`overridesFor`), 3025 (`relaunch.how`)
- **Relevance:** R3-4. The marker joins the intake as `option` and `disposition` did, refused when malformed, and both pre-resolve readers skip a marked decision.
- **Key patterns:** a key the session writes is refused at intake, before any agent runs, when it has no reading; a key read only by the workflow is moved off the run's copy so no prompt changes.

### The rename and the link check

- **Location:** `workflows/redline-loop.js`, 3143-3196 (`review()`: the rename map, the link clearing, `honourLinks`), 3061-3106 (`linkFault`, `honourLinks`), 3220-3238 (the coverage refs follow the rename)
- **Relevance:** R3-5. The coverage refs are the model for a reader that follows the rename map; a link cannot follow it, since its target is ambiguous, so it is cleared with a warning in `honourLinks`' form.

### The forcing point

- **Location:** `workflows/redline-loop.js`, 3890-3998 (`forceAskRules`: the paths and tag lookup, the kept draft, the relabelled call, the forced entry)
- **Relevance:** R3-6 (the call's reason as a third source of the rule) and R3-7 (the recommendation's period). The neighbouring strip of a trailing period on `recommendation` and `declineReason` is the pattern for R3-7.

### The resolve step

- **Location:** `workflows/redline-loop.js`, 4489-4729 (`resolveWith`: the decisions it applies, the unmatched-option and no-option warnings, `optionDraft`, `returned`, `once`, the named and stated checks, `decidedFiles`), 4889-4916 (the reshape's hold and rebuild of `deferred`), 5088-5115 (the round's deferrals and the own-commit warnings)
- **Relevance:** R3-8, R3-9, R3-10, R3-11. The named-accept check ("an accepted finding changes nothing") is the model for R3-10's stop; the no-option branch's left-finding wording (the key places spec, decision 16) is the model for R3-8.

### The schemas and the draft check

- **Location:** `workflows/redline-loop.js`, 880-900 (`reviewSchema`), 975-1000 (`judgmentCallSchema`), 1010-1022 (`DEFERRED_SCHEMA`), 1061-1131 (`CAUSE_SCHEMA`, `shapeSchema`), 3846-3853 (`checkDrafts`)
- **Relevance:** R3-2: which objects refuse an unnamed key, and the stop a nested draft meets.

### The texts

- **Location:** `skills/redline/SKILL.md` 213, 217, 228, 262; `docs/running.md` 86, 95, 125-134; `docs/upgrading.md` 31, 45; `docs/contract.md` 118, 153, 175; `agents/redline-shaper.md` 34; `agents/redline-reviewer.md` 78; `README.md` 50
- **Relevance:** R3-1, R3-2, R3-3, and the docs entries of R3-4, R3-5, R3-6.

### The loop test

- **Location:** `tests/loop-test.mjs`: the mock (295-338, the resolve's tasks and statements), the helpers (400-401, 470), the `resume:` count pins (1731-1732), the `reshape:` block (3474-3640: `approverFiles`, `draftFor`, `chargeRule`, `forcedDefer`), the `left:` block (4810-5034), the `class:` block (to 5205), the `places:` block (to 5404)
- **Relevance:** where each task's checks go, and the helpers they use.
- **Key patterns:** a relaunch case compares every call of the first launch with the relaunch's up to the stop (the reviewer's reproduction, `/tmp/redlinerepro/reviewer-r3-repro.mjs`, which the shaper could not run, does this for R3-4, R3-5 and R3-6).

## Specs read

- `agent-os/specs/2026-11-24-1231-105-template-v6-ends-class-rule-defer/` — the pull request's own spec (its decisions on a rule call's deferral, autopilot, and the named-disposition path of a pick).
- `agent-os/specs/2026-11-24-1712-127-review-round-1/shape.md` — round 1's decisions (R1-4's relabelled call, which R3-10 meets; R1-5's deferral, #128).
- `agent-os/specs/2026-11-25-1108-127-key-places-by-hand/shape.md` — the key places follow-up (decision 16, the no-option warning for a left finding; decision 21, the open deferred entry; decision 23, the template's silence on schema reach; the two real shaper returns of round 2, which hold R2-1 to R2-7's earlier sorting).
