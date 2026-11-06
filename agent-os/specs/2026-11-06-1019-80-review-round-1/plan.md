# PR #80 review round 1: the coverage pass's bookkeeping

Spec folder: `agent-os/specs/2026-11-06-1019-80-review-round-1/`

Shaped by Redline in unattended mode, for review round 1 of PR #80 (issue #79), from the round's six findings (`redline/round-1-findings.json`). There are four correctness findings and two nits, all in the coverage pass #79 added. They cover what the verifier is shown on a fix-diff round, what counts as the skill's list, how the candidates are counted and recorded, and two pieces of copy. Every finding is `fix`; there is no judgment call and no deferral. Each fix task is one commit whose message names its finding id, following "Git rules for Redline agents" in `README.md`.

Corrected after plan-approver adjustment 1: Task 4 now fixes all three parts of R1-4. Corrected after plan-approver adjustment 2: Task 2's closing sentence has its own condition and a carry-only neighbour check; Task 4 runs the correctness-only nit rule before the `knownAs` rule, and its known-finding scenario names its coverage text (`shape.md`, Plan-approver adjustments).

Every command below is a plain pipeline. The loop test runs through the gate script, never by hand with an interpreter.

## Task 1: Save spec documentation

Create `agent-os/specs/2026-11-06-1019-80-review-round-1/` with four files. `plan.md` is this plan. `shape.md` holds the scope, the decisions with owners, the unattended answers, the proportionality table, the plan-approver adjustments and the proposed standards retrospective. `standards.md` holds the applied standards as they read at shaping time. `references.md` lists the code studied. No `visuals/`. The `redline/` subfolder is Redline's own record and is not touched.

Files: the four files above (already written by the shaper).

**Docs entry:** spec folder only; no reader-facing change.

## Task 2: R1-2, show the earlier run's handled findings on every round that ran a coverage pass

Files:

- `workflows/redline-loop.js`
- `agents/redline-reviewer.md`
- `tests/loop-test.mjs`
- `docs/running.md`

Change:

1. `reviewPrompt()` (`workflows/redline-loop.js:1114-1131`), two separate conditions:
   - The list "Findings Redline's earlier rounds on this PR already handled" (`trackedList`, today `1117`) is pushed when `trackedList.length && (reviewed === 'pr' || Array.isArray(candidates))`: as today on the whole-PR round, and also on every round that ran a coverage pass.
   - The closing sentence of the known-finding paragraph (`1131`, "Redline's own earlier rounds on this PR are the lists above: match against them, not against their review comments.") gets its own condition, `priorBlock || (Array.isArray(candidates) && trackedList.length)`. This keeps today's whole-PR gate, so a whole-PR round whose earlier findings are all carry-forward (`trackedList` empty, `carryList` not) still has the sentence, and adds only the coverage rounds that show the handled list. The sentence does not share the handled list's condition.
   - The carry-forward list (`carryList`, `1120`) and `reconcilePrior()` stay on the whole-PR round only (`priorBlock` unchanged for them), so only the first round carries (`workflow/agents.md`, the carry-forward bullet).
   With `coverage off`, `candidates` is `null`, so both new conditions reduce to today's and every prompt stays byte-identical (`workflow/replay.md`, the dial bullet).
2. `agents/redline-reviewer.md`, "Check for known findings first", point 3: the parenthetical "(a whole-PR review on a PR that already carries posted rounds)" also names every round that ran a coverage pass. The prompt gives such a round the list of findings with a disposition; the carry-forward list stays on the whole-PR review.
3. `docs/running.md`, "The coverage pass": "collapses each candidate by cause into what the round, the run's earlier rounds, the carry-forward list or an issue already holds" names the earlier runs' handled findings too ("the earlier rounds of this run or of an earlier run on the PR").

Proof, in `tests/loop-test.mjs` (red before green: add the checks first and see them fail through the gate):

- Section 15: with `covArgs`, `firstRound: 2`, `priorFindings: [prior('R1-1', 'deferred', { comment_id: 11 })]` and two rounds (`reviews: [[f('R2-1', 'correctness')], []]`, `commitIds: [['R2-1']]`, `coverage: [two, two]`, an accounting for both candidates in each round), the `re-review r3` prompt holds `Findings Redline's earlier rounds on this PR already handled`, `"id": "R1-1"` and `match against them, not against their review comments`, and does not hold the carry-forward heading `Findings from earlier rounds with no disposition`.
- Section 15, neighbour that must not change: the same scenario under `baseArgs` (`coverage: null`, so no pass) has a `re-review r3` prompt without the handled list and without `match against them`, as before.
- Beside the carry scenarios (after `carry: a re-review never carries`, `tests/loop-test.mjs:583`), neighbour that must not change: in that scenario (`baseArgs`, `firstRound: 2`, `priorFindings: [prior('R1-2', 'none', { comment_id: 12 })]`, a carry-forward prior only), the `review r2` prompt still holds `match against them, not against their review comments`, and the `re-review r3` prompt holds neither `already handled` nor `match against them`. This pins the sentence's own gate: a whole-PR round with only carry-forward priors keeps it.

**Docs entries:** `workflows/redline-loop.js` and `agents/redline-reviewer.md`: `docs/running.md` "The coverage pass" (this task's commit). `tests/loop-test.mjs`: not a Docs-step directory.

## Task 3: R1-3, an array with none of the skill's fields is the drift stop, not blank candidates

Files:

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`
- `docs/running.md`

Change:

1. `coverageCandidates()` (`workflows/redline-loop.js:1176-1209`): a fenced json array that holds entries, none of which is an object carrying a non-empty string `summary` or `failure_scenario`, is not the skill's list. The scan moves on to the next fenced block. With none left, the result is the `no array` cause, so the round stops at `coverage r<n>` with the recipe-drift message. An empty array stays zero candidates (`#79` Decision 3). An array with at least one usable entry is read as today. The comment above the function says so.
2. `coverageMessage()`'s default message (`workflows/redline-loop.js:1222`) says the text holds no fenced json array of findings in the skill's shape (objects with `file`, `line`, `summary` and `failure_scenario`). It keeps the words `holds no fenced json array`, which the loop test's existing cause check pins, and the rest of the message is unchanged (`workflow/agents.md`: a message says when it fires in the words of the decision behind it).
3. `docs/running.md`, "The coverage pass", the three-causes paragraph: the third cause reads "the pass's text holds no fenced JSON array of findings in the skill's shape (the recipe drifted; check the version)".

Proof, in `tests/loop-test.mjs` section 15 (red first):

- A coverage text holding `[{"path":"app/x.php","start_line":3,"description":"real bug"}]` in a json fence ends as `status: error`, `stage: review`, `resumeFrom` `{ label: 'coverage r1', attempt: 2 }`, with `holds no fenced json array` and `launch again with coverage off` in the error.
- A fenced array of strings (`["real bug"]`) ends the same way.
- Neighbour that must not change: the existing empty-array check (zero candidates, not an error) and the existing `two` scenarios still pass.

**Docs entries:** `workflows/redline-loop.js`: `docs/running.md` "The coverage pass" (this task's commit). `tests/loop-test.mjs`: not a Docs-step directory.

## Task 4: R1-4, count a candidate by where the round puts it

Files:

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`
- `docs/running.md`

Change:

1. `review()` (`workflows/redline-loop.js:1970-1998`): the coverage accounting runs after the carry-forward reconcile (`reconcilePrior()` can clear a `knownAs`), so the accounting reads each finding as the round will post it.
2. `accountCoverage()` (`workflows/redline-loop.js:1230-1265`), a `finding` entry whose ref names no finding of the round (today `1248-1250`, which only warns and records it as `finding`): the candidate is listed under For the person as reported, like an unaccounted one. `out.forThePerson` gets `{file, line, text: summary}` from `candidates[index - 1]`. The existing warning stays, its text extended with `; listed under For the person as reported` (the words the other two warnings use). The entry is recorded as `{ index, outcome: 'forThePerson', ref: 'finding ref <ref> names no finding' }`, so the counts no longer call it confirmed. This is what the function's own docblock (`1226-1229`, "never dropped") and the candidates block (`1156`, "never drop a candidate silently") say (`shape.md`, Unattended answer 3).
3. `accountCoverage()`, before the counts are taken, for each `finding` entry whose ref names a finding of the round, two rules in this order (the order of the main loop, which drops a nit under `correctness only` at `workflows/redline-loop.js:3205-3211` before it splits the known findings out at `3212`):
   1. Under `scope === 'correctness'`, a finding whose category is `nit` is accounted `forThePerson`, its ref `<id>: a nit under correctness only`, whether or not it carries a `knownAs` (the main loop drops it before the known split, so it is never listed under Already tracked). The finding's `{file, line, text: title}` is appended to `out.forThePerson` once, so it reaches the body, the record and the handoff, as the candidates block already tells the verifier (`workflows/redline-loop.js:1157`).
   2. Otherwise, a finding the round keeps that carries a `knownAs` (listed under Already tracked in the body) is accounted `known`, its ref `<id>: <knownAs>`.
   The function's docblock replaces "A finding entry must name a finding of this round." with a sentence saying what is reclassified and why: a `finding` entry naming no finding is For the person as reported; under `correctness only`, one naming a nit is For the person; otherwise one naming a known finding is `known`.
4. `docs/running.md`, "The coverage pass": after "the review body counts them in one sentence", one clause. A finding the round lists under Already tracked counts as already tracked. Under `correctness only`, a nit the reviewer reported from a candidate is listed under For the person. After "a candidate the reviewer left out", the sentence also names "or accounted for as a finding the round does not have".

Proof, in `tests/loop-test.mjs` section 15 (red first):

- `{ ...covArgs, scope: 'correctness' }`, `reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit', { file: 'app/y.php', line: 9 })], []]`, `commitIds: [['R1-1']]`, `coverage: [two, two]`, `coverageOut` `[finding R1-1, finding R1-2]` then `settledAll`: the round 1 body says `1 confirmed, 1 for the person` and holds `- \`app/y.php:9\` · title R1-2` under `### For the person`. `rounds[0].forThePerson` holds that entry, and `rounds[0].coverage.accounting[1].outcome` is `forThePerson`.
- The same scenario with the nit carrying a `knownAs` (`f('R1-2', 'nit', { file: 'app/y.php', line: 9, knownAs: '#7' })`): `rounds[0].coverage.accounting[1].outcome` is still `forThePerson`, `rounds[0].coverage.counts.known === 0`, and the body still lists `- \`app/y.php:9\` · title R1-2` under `### For the person`. This pins the order of the two rules.
- `covArgs`, `reviews: [[f('R1-1', 'correctness', { knownAs: '#7' })]]`, `coverage: [two]`, `coverageOut` `[[{ index: 1, outcome: 'finding', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }]]`: both indexes are real candidates of `two`. `rounds[0].coverage.counts.known === 1`, `counts.finding === 0`, `counts.refuted === 1`, and the body's sentence says `0 confirmed` and `1 already tracked`.
- The existing accounting scenario (`coverage: accounting`, `tests/loop-test.mjs:1340`), whose index 1 is `finding` with ref `R9-9`. The check at line 1341 changes. `rounds[0].forThePerson` is `[{ file: 'app/x.php', line: 3, text: 'one' }, { file: 'app/y.php', line: 4, text: 'two' }, { file: 'app/z.php', line: 5, text: 'three' }]`. The accounting reads `1:forThePerson:finding ref R9-9 names no finding,2:forThePerson:unaccounted,3:forThePerson:unaccounted`. A new check in the same scenario: `rounds[0].coverage.counts.finding === 0 && rounds[0].coverage.counts.forThePerson === 3`. The comment above the scenario (`1336-1338`) says a finding ref that names no finding is For the person as reported, with a warning.
- Neighbours that must not change: the warning check at line 1342 still finds `as a finding with ref "R9-9", which is not a finding of this round` (the extended text keeps those words). Under scope `all`, the nits-only scenario's round 2 (`coverage: nits only end in the final nit pass`) counts its nit as `finding` (`rounds[1].coverage.counts.finding === 1`). The round 1 body check at line 1302 still says `1 confirmed, 1 for the person`.

**Docs entries:** `workflows/redline-loop.js`: `docs/running.md` "The coverage pass" (this task's commit). `tests/loop-test.mjs`: not a Docs-step directory.

## Task 5: R1-5, the findings file records the candidate list its accounting indexes

Files:

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`
- `docs/running.md`

Change:

1. `review()` (`workflows/redline-loop.js:1976-1978`): when a pass ran, `out.coverageList` holds the parsed candidates, each with its `index` (as the verifier saw them, `candidatesBlock()` line 1154). It stays off the round record and `result()`, which keep `head`, `candidates` (the count), `counts` and `accounting`.
2. `post()` (`workflows/redline-loop.js:2068`): the findings file's `coverage` is `{ ...reviewOut.coverage, list: reviewOut.coverageList }`. The dead `reviewOut.candidates ||` fallback goes, so `candidates` stays the count.
3. `docs/running.md`, "The coverage pass": "Every candidate gets one of eight outcomes in the round's findings file" says the file holds each candidate, by index, beside its outcome.

Proof, in `tests/loop-test.mjs` section 15: the findings-file check (`coverage: the findings file carries forThePerson and the coverage record`) also requires `"list": [` and `"summary": "the real one"`, and still `"candidates": 2` (red first). Neighbour: `result().rounds[0].coverage` has no `list` key.

**Docs entries:** `workflows/redline-loop.js`: `docs/running.md` "The coverage pass" (this task's commit). `tests/loop-test.mjs`: not a Docs-step directory.

## Task 6: R1-6, the handoff's whole-PR sentence leaves out the final nit pass

Files:

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

Change: `handoffComment()` (`workflows/redline-loop.js:2701-2705`): with a coverage pass in the run, the sentence reads `The coverage pass reviewed the whole PR at the head of every round but the final nit pass; see <Known limits link>.` in both branches that use it. One is `lastFixUnreviewed`, whose sentence before it already says the last fix was not re-reviewed; the other is a last round that is the final nit pass. The `coverage off` sentence is unchanged. This is the wording `docs/running.md` "The handoff comment" already gives ("every round but a final nit pass reviewed the whole PR at its head").

Proof: `tests/loop-test.mjs:1319` checks the new words (and still that `Only round 1 reviewed the whole PR` is absent); the `coverage off` check at line 1377 is the neighbour that must not change.

**Docs entries:** `workflows/redline-loop.js`: `docs/running.md` "The handoff comment" already says it; no reader-facing change, the code now matches the doc. `tests/loop-test.mjs`: not a Docs-step directory.

## Task 7: R1-1, the slash-command hints and the description name `coverage off`

Files:

- `skills/redline/SKILL.md`
- `templates/command-redline.md`
- `.claude/commands/redline.md`
- `CHANGELOG.md`

Change:

1. `skills/redline/SKILL.md` frontmatter: `[coverage off]` goes after `[dry run]` in `argument-hint` and in the grammar inside `description`, following the order of the section 2 table, where `coverage off` is the last row. The description's "re-reviews until no correctness bugs remain" becomes "re-reviews until a round confirms no new correctness finding", the workflow's own `meta.description` wording (`workflows/redline-loop.js:3`).
2. `templates/command-redline.md`: `[coverage off]` after `[dry run]` in `argument-hint`.
3. `.claude/commands/redline.md`: the same line, so this checkout's alias stays byte-identical to its template, which `tests/setup-test.sh`'s last cases prove (`testing/tests.md`, the setup bullet, #44).
4. `CHANGELOG.md`, `## 0.2.0`, "Setup and templates": one line saying the `/redline` alias's argument hint names `coverage off` and a rerun of `/redline:setup` offers the changed alias.

The version stays `0.2.0`. This PR already bumps the minor version for a template change (#79 Decision 15), and a second template change in the same PR needs no second bump (`process/release.md`). No template marker covers the alias file.

Proof: the gate's `setup` check (the alias equals its template) and `manifest` check (`claude plugin validate .` reads the skill's frontmatter).

**Docs entries:** `skills/redline/SKILL.md`: README "Dials" and `docs/running.md` "Launching a run" already name `coverage off`; no reader-facing change beyond the hint itself. `templates/command-redline.md`: `docs/running.md` "Launching a run" (the short forms) and `docs/setup.md` describe the alias by file, not by its hint; no reader-facing change, and `CHANGELOG.md` carries the line.

## Task 8: Verification Gate

1. Steps 1 to 9: run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-06-1019-80-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence. Expected mover: the loop test's count (Tasks 2 to 6); every other harness at its prior count.
2. Step 10, Docs: each task's Docs entry above names its section and is confirmed against the task's commit.
3. Step 11, Version: `0.2.0` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged (Task 7).
4. Step 12, Standards retrospective: apply the list under `## Standards retrospective (proposed)` in `shape.md`, as the standards approver approves it, in its own commit.
5. Step 13, Spec folder: `plan.md` reflects what was built; any deviation is recorded under Decisions in `shape.md`.
