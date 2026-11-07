# PR #80 review round 3: the reopen rule in the handled-list header and the knownAs contract, decided findings, and two stale doc sentences

Spec folder: `agent-os/specs/2026-11-06-1019-80-review-round-3/`

Shaped by Redline in unattended mode, for review round 3 of PR #80 (issue #79), from the round's four findings (`redline/round-3-review.json`, `redline/round-3-findings.json`).

- Three are `fix`:
  - R3-3: the handled-list header and the `knownAs` contract state the R2-1 reopen rule.
  - R3-1: the tech-stack sentence.
  - R3-2: the empty-candidates sentence in `docs/running.md`.
- One is a pending decision: R3-4, whether a decided finding applied in commits reopens (`shape.md`, Decision 4).

Each fix task is one commit whose message names its finding id, following "Git rules for Redline agents" in `README.md`. Line numbers are at `474593f`.

Every command below is a plain pipeline. The loop test runs through the gate script, never by hand with an interpreter.

## Task 1: Save spec documentation

Create `agent-os/specs/2026-11-06-1019-80-review-round-3/` with four files:

- `plan.md`: this plan.
- `shape.md`: the scope, the decisions with owners, the proportionality table, the unattended answers and the proposed standards retrospective.
- `standards.md`: the applied standards as they read at shaping time.
- `references.md`: the code studied.

There is no `visuals/`. The `redline/` subfolder is Redline's own record and is not touched.

Files: the four files above (already written by the shaper).

**Docs entry:** spec folder only; no reader-facing change.

## Task 2: R3-3, every sentence the verifier reads states the fixed-reopens rule, and a reopened finding carries no knownAs

Files:

- `workflows/redline-loop.js`
- `agents/redline-reviewer.md`
- `tests/loop-test.mjs`

Change:

1. `reviewPrompt()`, the handled-list header (`workflows/redline-loop.js:1124`). When `Array.isArray(candidates)`, the header reads:
   `Findings Redline's earlier rounds on this PR already handled (a match goes in knownAs as "<id>: <disposition>"; never re-raise one, except a fixed one a coverage candidate shows still reproduces at this head, which is new and carries no knownAs, as the candidates below say):`
   When `candidates` is null, the header is byte for byte what it is today:
   `Findings Redline's earlier rounds on this PR already handled (a match goes in knownAs as "<id>: <disposition>"; never re-raise one):`
   Only the parenthesis changes. The JSON list after it is unchanged. Update the comment above `priorBlock` (`1114-1119`) to say the header names the exception only when a pass ran (#80, R3-3).
2. `candidatesBlock()`, the reopen sentence (`1165`). After "and account for it as finding.", insert: " Its knownAs stays empty, since a finding with a knownAs is counted as already tracked and never runs another round; the earlier id goes in its description only." The rest of the line is unchanged. The existing phrases `whose outcome is fixed, but that you reproduce or trace at this round's head, is new` and `the earlier id named in its description` stay as they are, since the R2-1 check reads them. Add `#80, R3-3` to the comment above the function (`1148-1153`).
3. `agents/redline-reviewer.md`:
   - Line 16: after "rather than re-raising it", append: " (a `fixed` one a coverage candidate shows still reproduces at this head is the exception; see \"New carries the run's done rule\")". The colon and the list after it are unchanged.
   - Line 20: the exception "except a `fixed` one that a coverage candidate shows still reproduces at this head, which is new" gains ", with `knownAs` left empty," before "(see \"New carries the run's done rule\")".
   - Line 30: after "and account for it as finding.", insert the same sentence as change 2: "Its `knownAs` stays empty, since the workflow counts a finding with a `knownAs` as already tracked and it never runs another round; the earlier id goes in its description only."
   - Line 98: after "and is listed so the workflow can skip it.", insert: "A finding a coverage candidate reopens (a `fixed` one that still reproduces at this head) carries no `knownAs`: the earlier id goes in its description."

Proof, in `tests/loop-test.mjs` section 15. Red first: add the checks and see the first two fail through the gate, then make the change.

- After the handled-list checks (after line 1349, before the "Defaults" comment at 1350), add a run named `coverage: an earlier run's fixed finding on a fix-diff round`:
  - Args: `{ ...covArgs, firstRound: 2, priorFindings: [prior('R1-1', 'fixed', { comment_id: 11 })] }`.
  - Scenario: `handledScenario(true)`.
  - Check: `pick(run.calls, 'review r2').prompt` and `pick(run.calls, 're-review r3').prompt` each include `never re-raise one, except a fixed one a coverage candidate shows still reproduces at this head, which is new and carries no knownAs`.
  - Name the check `coverage: the handled-list header names the fixed-reopens exception on every round that ran the pass`.
- Neighbour that must not change: a run named `coverage: off, an earlier run's fixed finding`.
  - Args: `{ ...baseArgs, firstRound: 2, priorFindings: [prior('R1-1', 'fixed', { comment_id: 11 })] }`.
  - Scenario: `handledScenario(false)`.
  - Check: `pick(run.calls, 'review r2').prompt` includes `already handled (a match goes in knownAs as "<id>: <disposition>"; never re-raise one):` and does not include `except a fixed one`.
  - Name the check `coverage: off, the handled-list header is as before`.
- In the `coverage: a new verified finding runs another round` run, directly after the R2-1 check at line 1325:
  - Check: `pick(run.calls, 'review r1').prompt` and `pick(run.calls, 're-review r2').prompt` each include `Its knownAs stays empty`.
  - Name the check `coverage: a reopened finding carries no knownAs`.
- Neighbour: in the `coverage: off` run, directly after the check at line 1439:
  - Check: neither `pick(run.calls, 'review r1').prompt` nor `pick(run.calls, 'final nit pass r2').prompt` includes `knownAs stays empty`.
  - Name the check `coverage: off carries no reopened-knownAs sentence`.
- These neighbours pass unchanged:
  - The existing handled-list checks (`1347`, `1349`) and the R2-1 checks (`1325`, `1439`).
  - The carry-forward checks that read `already handled` under `baseArgs` (`561`, `580`, `589`).
  - The replay checks, whose prompts are byte-identical.

**Docs entries:** `workflows/redline-loop.js` and `agents/redline-reviewer.md` are covered by `docs/running.md` step 7 and "The coverage pass". No reader-facing change: both already state the reopen rule, for "the earlier rounds of this run or of an earlier run on the PR". The fix makes the earlier run's header and the reviewer's `knownAs` contract agree with them; `knownAs` is the reviewer's internal contract, which the docs do not describe. `tests/loop-test.mjs` is not in a Docs-step directory.

## Task 3: R3-1, the tech stack names the skill as the finder

Files:

- `agent-os/product/tech-stack.md`

Change: in line 5, replace the sentence that opens "The built-in `code-review` skill, a candidate second reviewer on whole-PR rounds" and ends "so #19's benchmark checks later versions." with:

```
The built-in `code-review` skill is the finder on every whole-PR and fix-diff round since #79 (the coverage pass, unless a run is launched with `coverage off`); its recipe was read and its workflow-subagent route checked against 2.1.318 on 2026-11-05 (spike #72), and since the recipe is keyed by model family, #19's benchmark checks later versions.
```

The sentences before and after it on the line are unchanged.

Proof:

- `grep -c "candidate second reviewer" agent-os/product/tech-stack.md` prints `0`.
- `grep -c "is the finder on every whole-PR and fix-diff round since #79" agent-os/product/tech-stack.md` prints `1`.
- Neighbour: `grep -c "One workflow (.workflows/redline-loop.js." agent-os/product/tech-stack.md` prints `1`.

**Docs entry:** `agent-os/product/` is not in a Docs-step directory and adds no key, subcommand, allow rule or exit code; the file is itself the product record.

## Task 4: R3-2, the empty-candidates sentence names what the reviewer still does

Files:

- `docs/running.md`

Change: in "The coverage pass", the paragraph that opens "A pass that yields nothing usable" (line 54), replace its last sentence ("An empty array the skill returned on purpose is zero candidates, not an error: the reviewer runs on the recheck and the carry-forward list alone.") with:

```
An empty array the skill returned on purpose is zero candidates, not an error: the reviewer runs no discovery pass of its own; it still runs the scheduled-and-queued, Docs and Version checks, the fix-diff recheck on a later round, and the carry-forward list on a run's first round when there is one.
```

The rest of the paragraph is unchanged. The wording follows `candidatesBlock()`'s empty branch (`workflows/redline-loop.js:1157-1159`) and `reviewPrompt()`'s carry-forward gate (`1120`, `1126`).

Proof:

- `grep -c "on the recheck and the carry-forward list alone" docs/running.md` prints `0`.
- `grep -c "the reviewer runs no discovery pass of its own; it still runs the scheduled-and-queued" docs/running.md` prints `1`.
- Neighbour: `grep -c "Each message also names the alternative, a fresh launch with .coverage off." docs/running.md` prints `1`.

**Docs entry:** a change to `docs/` is reader-facing by nature and needs no entry of its own (`process/docs-gate`).

## Task 5: Pending decision R3-4: A decided finding whose decision was applied in commits never reopens

Pending decision R3-4. Nothing in this task is built until the person decides. The resolve agent rewrites this task as the chosen option's change. The task lands after Task 2 and edits the reopen sentence, the handled-list header and the agent-file lines as Task 2 leaves them.

Question: should a coverage candidate that matches a finding the person decided, whose decision was applied in commits, and that the verifier reproduces at this head, be new and run another round?

Today:

- `outcomesFor()` records such a finding as `decided` (`workflows/redline-loop.js:2199-2200`).
- `history()` shows the verifier the decision sentence only, with no commit (`describeOutcome()`, `2221-2222`).
- Across runs, `prior-findings` reads its `Applied in` reply as `decided` (`scripts/redline-gh.sh:342`).
- The history line (`1112`) and the reviewer's rule (`agents/redline-reviewer.md:22`) say a decided finding is not raised again.

A decision applied in commits is not always a fix. It can be a decision to keep the code with a comment (`tests/loop-test.mjs:279`), or a mitigation chosen on purpose (R2-5 in this PR).

Options:

- **A. Reopen it too.**
  - `describeOutcome()`'s `decided` case appends the commits (`; applied in <sha>`), or `history()` adds them for the verifier only. The first also changes the handoff's Earlier rounds lines and the checks that pin them.
  - The reopen sentence in `candidatesBlock()`, Task 2's handled-list header and `agents/redline-reviewer.md` (lines 20, 22, 30) add "or decided and applied in commits".
  - `docs/running.md` step 7 and "The coverage pass" say so.
  - Two loop checks: the history text, and the sentence.
  - Files: `workflows/redline-loop.js`, `agents/redline-reviewer.md`, `docs/running.md`, `tests/loop-test.mjs`.
  - Effect: a partly landed decided fix runs one more round under `maxRounds`. The verifier then has to tell a decided fix from a decided keep-or-mitigate by reading the decision's notes. Where it misreads, a gap the person chose to leave reopens, which costs a round each time until the cap.
- **B. Keep it settled, say so, and show the gap.**
  - The reopen sentence in `candidatesBlock()` and `agents/redline-reviewer.md` line 30 gain: "A decided finding stays settled whatever its commits, since the person chose what to change; a candidate that still reproduces one goes under forThePerson, one line naming the earlier id."
  - `docs/running.md` step 7 and "The coverage pass" say the same.
  - One loop check that the sentence is in a coverage round's prompt, and one that a `coverage off` prompt does not have it.
  - Files: `workflows/redline-loop.js`, `agents/redline-reviewer.md`, `docs/running.md`, `tests/loop-test.mjs`.
  - Effect: the run still ends. The person sees the remaining gap under For the person in the review body and the handoff, and decides by hand whether it needs more.
- **C. Accept as written.**
  - No change: the history line and the reviewer's rule already keep a decided finding settled.
  - Files: none.
  - Effect: the run ends. A partly landed decided fix is caught only if the verifier puts the candidate under For the person on its own, or by the person's review after the handoff.

Shaper's recommendation: B. An applied decision is often a keep or a mitigation the person chose on purpose, as R2-5 in this PR is. Reopening it would re-raise what the person decided to leave. For the person keeps the gap visible without spending a round.

**Docs entries (per option):** A and B: `docs/running.md` step 7 and "The coverage pass" for `workflows/redline-loop.js` and `agents/redline-reviewer.md`. C: no change.

## Task 6: Verification Gate

Files: `agent-os/standards/workflow/agents.md` (step 4's standards commit), and this spec folder's `plan.md` and `shape.md` (step 5).

1. Steps 1 to 9: run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-06-1019-80-review-round-3/redline/snapshot.json` until it exits 0; its JSON is the evidence. The loop test's count is expected to move by four checks from Task 2, plus whatever the R3-4 decision adds. Every other harness stays at its prior count.
2. Step 10, Docs: each task's Docs entry above names its section or its reason, and is confirmed against the task's commit.
3. Step 11, Version: `0.2.0` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged. The PR already bumps the minor version, and no fix changes what a setup rerun writes (`shape.md`, Decision 5).
4. Step 12, Standards retrospective: apply the list under `## Standards retrospective (proposed)` in `shape.md`, as the standards approver approves it, in its own commit.
   - Items 1 and 2 edit `agent-os/standards/workflow/agents.md`.
   - Item 3 is held for R3-4 and is drafted by the resolve agent once the person decides.
   - Items 4 and 5 are no change.
5. Step 13, Spec folder: `plan.md` reflects what was built; any deviation is recorded under Decisions in `shape.md`.
