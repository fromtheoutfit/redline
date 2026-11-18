Redline handoff

Redline ran 5 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in round 4's fixes. The coverage pass reviewed the whole PR at the head of every round but the final nit pass; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

Resolved 28 threads; 0 left open.

Agent files changed during this run (`agents/redline-resolve.md`): the rounds after the change may have run under them, while the workflow's own prompts were the launch's.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 8 items: 4 fixed, 3 declined, 1 overruled by @michaelfromtheoutfit; 8 commits; spec `agent-os/specs/2026-11-18-1026-108-review-round-1`
- Round 2 (fix-diff): 7 items: 6 fixed, 1 declined; 9 commits; spec `agent-os/specs/2026-11-18-1026-108-review-round-2`
- Round 3 (fix-diff): 6 items: 6 fixed; 9 commits; spec `agent-os/specs/2026-11-18-1026-108-review-round-3`
- Round 4 (fix-diff): 9 items: 5 fixed, 2 declined, 1 deferred, 1 put to @michaelfromtheoutfit; 10 commits; spec `agent-os/specs/2026-11-18-1026-108-review-round-4`
- Round 5 (final-nit-pass): no new items; 0 commits; spec `agent-os/specs/2026-11-18-1026-108-review-round-5`

### Put to @michaelfromtheoutfit (1)

- **R4-9** An override is held to a task of its own, but neither the overrides prompt nor the agent file asks for one: @michaelfromtheoutfit has the resolve agent's file and docs/running.md say that an override's fix is a task of its own, and leaves the overrides prompt unchanged, so a run already in progress still replays that step after a plugin update (decision 13). Applied in 36f9bef. · decided by: @michaelfromtheoutfit

### Overruled by @michaelfromtheoutfit (1)

- **R1-5** The new consistency checks skip a decision that names its own disposition, so a named defer with no entry files nothing: @michaelfromtheoutfit has the three resolve-time checks run over every decision resolveWith applies, by its effective disposition, with the draft's three loop cases, and keeps the allowance for an entry the round already holds, since the checks now exist and this pull request is the place to apply them. Applied in e2f66d8. · decided by: @michaelfromtheoutfit

### Declined by Redline (6)

To overrule one, reply in its thread (for one in the review body, which has no thread, submit a pull request review whose body names its id), then run `/redline:redline-revise 108 review @<login>` with the login of whoever replied, such as `review @michaelfromtheoutfit`.

- **R1-3** The stated disposition is a second source beside the decision's own, and each reader joins the two by hand: declined: The view effectiveDispositions gives the plan approver and the implementer is kept on purpose by the pull request's spec (decision 14, as #106's subject), and the one concrete cost the finding names, the forced test missing from needCommits, is fixed in this round as R1-8 · decided by: redline
- **R1-4** The repeated-statement warning fires for identical repeats and for ids the workflow never reads: declined: The pull request's spec chose a warning for any second statement of one call, as for a second deferred entry (decision 12, after #97 R2-12), and a repeat is the agent departing from the ask whether or not the two agree, which is what the warning reports · decided by: redline
- **R1-6** A statement with a value outside the three is reported as no statement: declined: The pull request's spec chose one message for a missing statement and for one outside the three (decision 20, pinned by misstated); the message names the three values a statement may hold, and the schema's enum refuses any other in the agent's own run · decided by: redline
- **R2-7** A call forced by a reshape after its resolve keeps its fix task in plan.md, so its change can ship unlisted under a prose rule: declined: could not confirm: needs a guided run in which a reshape puts a decided call under a prose rule after its resolve, showing plan.md still holding the resolve's task with files and the implementer committing it, which is agent behaviour the scripted loop test cannot show · decided by: redline
- **R4-5** RESOLVE_SCHEMA requires `decided` for a resolve whose prompt never asks for it: declined: could not confirm: needs a relaunch under the new script that replays an overrides-only resolve result recorded before #99, to show whether the harness checks a replayed result against the current schema; the list is required on purpose (workflow/replay, line 23; the spec's decision 11), and `resolveWith` already reads an absent one as empty · decided by: redline
- **R4-8** `stated` is a plain object, so a returned id like 'constructor' reads as a statement: declined: the failure needs a deferred entry whose id is an inherited object key such as `constructor`, and the resolve agent only copies the round's `R<n>-<k>` ids from the calls and overrides it is given; the workflow's other id maps (`roundDecisions`, `record.forced`, `decisions`) are plain objects read the same way, so changing `stated` alone would change nothing a run reaches · decided by: redline

### Deferred (1)

- **R4-7** A stray entry beside a call stated fix or accept is dropped only from the workflow's list, so the committed shape.md still shows it as deferred: deferred to #109; mitigated in ec6f563 · decided by: redline

### Fixed (21)

<details>
<summary>With the commits that fixed each</summary>

- **R1-8** The stated-fix clause of `needCommits` lost the forced guard, so a call a reshape puts under an ask rule is demanded: fixed in 6edd835 · decided by: redline
- **R1-1** The doc names the stop's resume point as `resolve r<n>`, but the stop takes the label of whichever resolve ran: fixed in 109b9c5 · decided by: redline
- **R1-2** The prompt asks for a statement from a call whose decision names its own disposition, and the workflow discards it unread: fixed in a8a1c9d · decided by: redline
- **R1-7** `taskFiles` repeats the expression `plannedFiles` uses for a decided finding: fixed in 3f46c3f · decided by: redline
- **R2-5** needCommits' first branch has no forced guard, so a named-fix call a reshape puts under an ask rule is still demanded: fixed in 9d138a3 · decided by: redline
- **R2-6** With the resolve-task clause removed, a decision whose named disposition is outside fix, defer and accept is never demanded or checked: fixed in 6a35e67 · decided by: redline
- **R2-1** The resolve mock still states a disposition for a call whose decision names its own, which the prompt now says has none: fixed in 0096b84 · decided by: redline
- **R2-2** The mitigation-field comment left by mitigationFilled's removal now sits above DRAFT_FIELDS and retells the filled-or-empty history: fixed in 724e1ac · decided by: redline
- **R2-3** A stray entry beside a call whose decision names a fix is warned as one the person 'changed away from defer': fixed in feabf61 · decided by: redline
- **R2-4** The resolve-time fix checks find a finding's files only in a task whose `finding` is exactly its id: fixed in a461d1e · decided by: redline
- **R3-4** The new resolve-time stops rely on a resume whose line tells the resolve agent the person fixed the cause and the earlier files stand: fixed in a2ba199 · decided by: redline
- **R3-1** The intake check refuses a null or empty disposition, which every reader of the field takes as none: fixed in 54d6218 · decided by: redline
- **R3-2** relaunch.how gives the plan dial's asks the changed-disposition shape, with a disposition key the skill never records for an ask: fixed in 62bdc7d · decided by: redline
- **R3-3** Out-of-range statements are filtered before firstPerId, so a valid second statement is kept silently: fixed in 90ec7e4 · decided by: redline
- **R3-5** The new comment says an override is a finding changed away from defer, and the override warning still says so for a decline overruled to fix: fixed in 0f90b66 · decided by: redline
- **R3-6** resolveWith tells a call from an override two ways: strayNamed reads `calls`, whose() reads `newOverrides`: fixed in 0d86faf · decided by: redline
- **R4-4** The resolve resume clause is chosen by agent type, so the autopilot 'could not apply' stop also tells the agent to correct what the error names: fixed in 6df0664 · decided by: redline
- **R4-1** The doc keeps the first of two statements but does not say a first statement outside the three leaves the call with none: fixed in 386cd20 · decided by: redline
- **R4-2** Intake drops only null and '' but its comment and the standard say it reads a disposition as run() reads an error: fixed in db80099 and 14f26e8 · decided by: redline
- **R4-3** Removing the disposition key goes through Object.fromEntries/filter where rest destructuring does it in one line: fixed in 18675f7 · decided by: redline
- **R4-6** Two comments still say only an override or a rule call has no statement, and that a call's decision names no disposition: fixed in bbe52bc · decided by: redline

</details>

### Candidates set aside in round 4 (1)

<details>
<summary>Refuted, collapsed or already tracked</summary>

- `workflows/redline-loop.js:578` · Altitude: the resume wording is chosen by agent type (`opts.agentType === 'redline:redline-resolve'`), not by what caused the stop, so the new replay.md rule ('a step whose stop is the workflow's own check of what that step returned is told so') is a special case for one agent. · duplicate: 3: same cause as candidate 3, reported as R4-4. `resolveFix` is chosen by `opts.agentType` (line 578), not by what stopped the run, and R4-4's proposed fix is the flag on the stop that this candidate suggests. (candidate 3, `workflows/redline-loop.js:578`: unconfirmed R4-4)

</details>

### Commits

- 3f66809 redline: save review round 1 spec for PR #108 (#99)
- 109b9c5 redline: R1-1 name every label the resolve stop takes (#99)
- a8a1c9d redline: R1-2 ask no statement of a call that names its own disposition (#99)
- e2f66d8 redline: R1-5 hold a named decision to the resolve-time checks (#99)
- 3f46c3f redline: R1-7 read a finding's task files through one helper (#99)
- 6edd835 redline: R1-8 keep the forced guard on a stated fix's demand (#99)
- 90813ac redline: record the round 1 review lessons in the standards (#99)
- 81565cc redline: record the as-built state of review round 1 for PR #108 (#99)
- 7483a79 redline: save review round 2 spec for PR #108 (#99)
- 0096b84 redline: R2-1 leave a named call out of the resolve mock's decided list (#99)
- 724e1ac redline: R2-2 tell the mitigation field's history once, in the deferred schema's comment (#99)
- feabf61 redline: R2-3 word a stray entry's warning by whose decision it is (#99)
- a461d1e redline: R2-4 ask for a task of its own for each call stated as a fix (#99)
- 9d138a3 redline: R2-5 keep the forced test on the whole demand (#99)
- 6a35e67 redline: R2-6 refuse a decision whose disposition is not fix, defer or accept (#99)
- 4c524aa redline: record the round 2 review lessons in the standards (#99)
- da09090 redline: record the as-built state of review round 2 for PR #108 (#99)
- 9945650 redline: save review round 3 spec for PR #108 (#99)
- 54d6218 redline: R3-1 read an empty or null decision disposition as none (#99)
- 62bdc7d redline: R3-2 give a plan dial ask no disposition in the relaunch note (#99)
- 90ec7e4 redline: R3-3 pick the first statement before reading its value (#99)
- a2ba199 redline: R3-4 tell a resumed resolve the stop was the check of its own result (#99)
- 0f90b66 redline: R3-5 word an override's stray warning by the disposition it was changed to (#99)
- 0d86faf redline: R3-6 tell a call from an override with one predicate in resolveWith (#99)
- 7ecbec6 redline: record the round 3 review lessons in the standards (#99)
- 8bad058 redline: record the as-built state of review round 3 for PR #108 (#99)
- af3de86 redline: save review round 4 spec for PR #108 (#99)
- 386cd20 redline: R4-1 say a first statement outside the three is none (#99)
- db80099 redline: R4-2 narrow the intake comment to the two values it reads as none (#99)
- 18675f7 redline: R4-3 drop the disposition key with rest destructuring (#99)
- 6df0664 redline: R4-4 choose the resolve resume clause by the stop (#99)
- bbe52bc redline: R4-6 name a call whose decision names its own disposition in two comments (#99)
- ec6f563 redline: R4-7 say a dropped stray entry can still be listed in the round's shape.md (#99)
- 36f9bef redline: R4-9 say in the resolve agent's file that an override's fix is a task of its own (#99)
- 14f26e8 redline: record the round 4 review lessons in the standards, finishing R4-2 (#99)
- b5e890e redline: record the as-built state of review round 4 for PR #108 (#99)
