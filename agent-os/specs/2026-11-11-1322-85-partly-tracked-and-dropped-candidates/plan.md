# #85: a partly tracked candidate keeps its remainder, and the review shows what the verifier dropped

Spec folder: `agent-os/specs/2026-11-11-1322-85-partly-tracked-and-dropped-candidates/`

## Context

Task 10.6 of #79 reran Losers League #817 at its pre-Redline SHA on the built plugin (`SPIKE-72-NOTES.md` §10, redline-internal; cited by name only). The coverage pass raised the two items the spec expected as correctness findings, and the verifier kept neither. It followed its rules as written, so the fault is in the rules:

1. **A tracked issue that covers part of a candidate swallows the rest.** The known-finding check has one outcome, "already tracked in #N, with the line #N lacks". A regression this PR introduced became a For the person note because a neighbouring issue existed, and two candidates were collapsed by issue rather than by cause.
2. **A discarded candidate reaches the person only as a count.** `refuted`, `disproportionate` and `outside` candidates appear in the review body only as a number. The candidate and the reason are in `round-<n>-findings.json`. Two of the three refutations answered a claim the candidate did not make, or cited an intent comment. The disproportionate drop was a guard the PR had removed.

The fix is three verifier rules, in `agents/redline-reviewer.md` and the verify prompt, plus a collapsed dropped block in the review body and the handoff. The loop test pins all of it. The result is that a remainder caused in this PR keeps the run going, and the person can overrule a drop without opening the round folder.

## Decisions

From the brief (not reopened):

1. Scope is #85 only. #74, #73 and #75 stay out.
2. **Partly tracked.** When an open issue or a teammate's comment covers only part of a candidate, the tracked part is `known` and the remainder is judged as its own candidate. A remainder whose cause is in this PR's diff is a finding: the issue is named in its description, `knownAs` stays empty, and it is accounted for as `finding`. "Collapse by cause" gains a counter-case: two candidates are not one just because one issue's title fits both.
3. **A refutation states the candidate's claim and the evidence against that claim.** Evidence for a neighbouring claim does not refute, and neither does a comment or docblock that states intent. Such a candidate goes under For the person.
4. **A removed guard is not disproportionate.** A candidate that needs implausible conditions today, but which the base branch handled and this PR stopped handling, goes under For the person with the removed line named.
5. **The dropped block.** After For the person, the review body lists every `refuted`, `disproportionate` and `outside` candidate, one line each (file and line, the claim, the reason), in a collapsed `<details>` block. With no dropped candidates there is no block. The handoff carries the same block for the last round.
6. Evidence is cited as `SPIKE-72-NOTES.md` §10 only. No Losers League code or candidate text enters this repository. Every example and loop-test candidate is invented.
7. The Done-when replay of the rerun's 25 candidates is the person's step after the gate, and its result goes to the internal note.
8. Patch bump to 0.2.2. This was checked: nothing a setup rerun writes changes (no template, `checks-template.sh`, allow entry or unattended body), and the check-before-reporting wording lives only in this repository's `CLAUDE.md`, never in a template.
9. `scripts/redline-guard.sh` and `hooks/hooks.json` are not touched.
10. The retrospective adds the exposure to the throwaway-PR recipe.

From shaping (asked 2026-11-11, answered by @michaelfromtheoutfit):

11. **The claim is the candidate's own `summary`, unedited and whole, never truncated.** The block is collapsed, so length costs nothing. A refutation that answers a different claim then shows as a mismatch on the line. There is no schema change.
12. **The agent file is pinned by a new loop-test check, one per rule, each matching a short key phrase rather than a whole sentence.** #85's "structural test" did not exist (nothing in `tests/` opened an agent file). This check is what was built in its place, and `shape.md` says so.
13. **Docs go in `docs/running.md` and README Known limits only.** `docs/contract.md` gets no entry: neither change alters a per-repository file, which differs from what the Done-when says. `running.md`'s coverage-pass section states the new format of a `refuted` ref in `round-<n>-findings.json`.
14. **The handoff carries the block of the last round that ran the coverage pass, and says which round.** That is the round before a final nit pass, else the last round. Earlier rounds' drops stay in their own review bodies and are not repeated. Under `coverage off` no round has candidates, so there is no block.

Shaping defaults (recorded, not asked):

- **Accounting a partly tracked candidate.** The index's outcome is whatever the remainder became (`finding`, `forThePerson`, `outside`, `refuted`, `disproportionate` or `duplicate`). The issue or comment is named in the finding's description, the For the person line or the ref. `known` stays for a candidate tracked whole.
- **The prompt changes go in the verify prompt only (`candidatesBlock`).** A `coverage off` prompt stays byte-identical (`workflow/replay.md`). The agent file carries the rules for both modes, since its "Check for known findings first" section speaks of a "candidate finding" in general.
- **An empty reason on a dropped entry prints `no reason given`, and the run records a warning naming the index**, so a dropped line is never blank (the "never drop a candidate silently" rule).
- **Unchanged:** the coverage count sentence; the cap-hit comment and a human pass's summary comment (not the handoff); the findings file (it already holds the list and the accounting); the run's result (counts only, as #80 R1-5 left it).
- **Noted, out of scope:** this repository's `CLAUDE.md` ("Code review — check before reporting") still reads "plus only whatever that issue is missing", the wording behind fault 1. It is the person's file and outside #85.
- No visuals. Product alignment: the mission's "Decisions stay with people" (a drop can now be overruled) and "Honest about its reach" (the drops are listed). No conflict, and no mission edit.
- Standards applied: `workflow/agents`, `workflow/replay`, `testing/tests`, `process/docs-gate`, `process/release`, `process/internal-notes`, `process/standards-retrospective`, `prompts/attribution`.

## Task 1: Save spec documentation

Create the spec folder with:

- `plan.md`: this plan.
- `shape.md`: Scope, the Decisions above (deviations from #85's text included: the structural test, the contract.md entry, the handoff round), Context, Standards Applied, and the out-of-scope note.
- `standards.md`: the full text of the eight standards above, as they read at shaping time.
- `references.md`: the code below, plus `SPIKE-72-NOTES.md` §10 by name. Also the precedents: the #79 spec folder, and #80's R1-4, R1-5 and R3-3, which set the accounting, list and prompt-wording rules this extends.

## Task 2: Loop-test checks first (red)

In `tests/loop-test.mjs`, section 15 (the coverage pass, lines 1267–1458), add the checks below and run `node tests/loop-test.mjs` to see them fail before Tasks 3 and 4:

- **The agent file and the prompt state the three rules.** Read `agents/redline-reviewer.md` beside the workflow (`fs.readFileSync`, as line 18 reads the workflow). There is one check per rule. Each asserts that its key phrase is in the agent file and in a covered `review r1` prompt, and absent from a `coverage off` `review r1` prompt:
  - partly tracked: `the remainder is judged as its own candidate`
  - refutation: `neighbouring claim does not refute`
  - removed guard: `this pull request stopped handling`
- **Partly tracked scenario.** A covered run, with an invented candidate list:
  - The reviewer returns `R1-1` (correctness) with `knownAs: ''` and a description naming `#7`. The accounting is `[{1, finding, R1-1}, {2, known, '#7'}]`.
  - Assert that round 1 counts it as 1 confirmed and 1 already tracked.
  - Assert that `R1-1` is under `### Findings` and not under `### Already tracked`, and that its inline comment carries `#7`.
  - Assert that the shaper receives `R1-1`, and that the run goes on to `re-review r2`.
- **The dropped block in the review body.**
  - Use a round with one `refuted`, one `outside` and one `disproportionate` candidate beside a For the person entry.
  - The body holds, after `### For the person` and before the trailing "Each finding has an inline comment" sentence:

    ```
    <details>
    <summary>Dropped candidates (3): refuted, outside the diff or disproportionate</summary>

    - `<file>:<line>` · <summary, unedited> · <outcome>: <ref>
    ...

    </details>
    ```

    The lines are in index order, and each summary is the candidate's own, byte for byte.
  - `every`'s round 1 (no drops) and the `coverage: off` scenario hold no `<details>`.
  - `prior-findings` safety follows from the line's shape: it opens with ``- ` ``, never `- **R`. No gh-test change is needed.
- **Empty reason.** A `refuted` entry with `ref: ''` prints `refuted: no reason given`, and the warnings name its index.
- **The handoff block.**
  - A two-round covered run with a drop in each round. The handoff holds round 2's block, with the summary `Dropped candidates in round 2 (1): …`, after `### For the person` and before `### Commits`. Round 1's drop is absent.
  - A run ending in a final nit pass carries the block of the round before the nit pass, naming that round.
  - A run with no drops in its last covered round has no `<details>`, nor does `coverage: off`.
- Existing checks that must stay green unchanged: "the result's coverage record has no candidate list" and every pre-coverage scenario.

## Task 3: The three rules, in the agent file and the verify prompt

`agents/redline-reviewer.md`: search for the old rule's words (`already tracked in #N`, `the line #N lacks`, `knownAs`, `Collapse by cause`, `disproportionate`, `refuted`), as `workflow/agents.md` requires (#80, R3-3), and edit each place:

- **Check for known findings first** (after line 22): add a paragraph, **A tracked part is not the whole finding.**
  - When an open issue or a teammate's comment covers only part of a candidate finding, the tracked part is known and the remainder is judged as its own candidate.
  - A remainder whose cause is in this pull request's diff is a finding. It names the issue or comment in its description, leaves `knownAs` empty, and is accounted for as `finding`.
  - `knownAs` is for a finding tracked whole.
- **New carries the run's done rule** (line 30): "a finding an issue or a teammate's comment already tracks" gains "in full (the part it does not track is judged on its own)".
- **Collapse by cause** (line 34): add the counter-case with an invented example. Two candidates are not one because one issue's title fits both: a check missing from one handler and a case-folding bug in a lookup are two defects.
- **Run the known-finding check** (line 35): when #N tracks only part of the candidate, the part #N lacks is judged as its own candidate. A cause in the diff makes it a finding naming #N, never a For the person line saying what #N lacks. A For the person entry on its own merits still says "already tracked in #N".
- **New bullet, A refutation answers the candidate's claim** (in "For each candidate"):
  - `refuted` means evidence against the claim the candidate makes, and its ref states that claim and the evidence against it.
  - Evidence for a neighbouring claim does not refute (a test that pins another behaviour of the same code), and neither does a comment or docblock that states intent. Such a candidate goes under For the person.
- **The disproportionate guard** (line 43): add the exception. A candidate whose conditions are implausible today, but which the base branch handled and this pull request stopped handling (the diff's removed lines show it), is not disproportionate. It goes under For the person, naming the removed line.
- **Account for every candidate** (line 47):
  - `refuted` becomes "the claim it disproves and the evidence against that claim".
  - A partly tracked candidate is accounted for by what its remainder became, and `known` is for a candidate tracked whole.
  - The `refuted`, `outside` and `disproportionate` refs are posted in the review body's dropped block beside the candidate's own summary, so write each one for the teammate.
- **For the person** (line 62) and the `knownAs` paragraph (line 98): the same narrowing. "already tracked" means in full, and a part an issue lacks that is caused in the diff is a finding, not an entry.

`workflows/redline-loop.js`, `candidatesBlock` (lines 1158–1174), the branch with candidates only:

- Line 1169 (the definition of new): "a finding an issue or a teammate's comment already tracks" gains "in full".
- Line 1170 (for each candidate): add the partly tracked sentence, the collapse counter-case, the refutation rule and the removed-guard exception to the disproportionate guard. Use the agent file's key phrases verbatim.
- Line 1171 (accounting): the `refuted` ref states the claim it disproves and the evidence against it. A partly tracked candidate is accounted for by its remainder's outcome. The three dropped outcomes' refs are posted in the review body beside the candidate's summary.
- Extend the comment above the function (#85). The `reviewPrompt` known-finding sentence (line 1140) is unchanged, so `coverage off` prompts stay byte-identical.

Docs entry: `agents/redline-reviewer.md` and `workflows/redline-loop.js` (the prompt) → `docs/running.md` "Rounds" (step 1) and "The coverage pass", updated in Task 5's commit.

## Task 4: The dropped block, in the review body and the handoff

`workflows/redline-loop.js`:

- Beside `COVERAGE_OUTCOMES` (line 507): add `const DROPPED_OUTCOMES = ['refuted', 'outside', 'disproportionate']`, with a comment (#85).
- In the review normalizer, after `accountCoverage` (lines 2061–2065):
  - Set `out.droppedCandidates` to the accounting entries with a dropped outcome, joined by index to `candidates`: `{ index, file, line, summary, outcome, ref }`, where summary is the candidate's own, unedited.
  - For an entry whose ref is empty, push the warning `round <n>: the reviewer dropped coverage candidate <i> as <outcome> with no reason; listed as "no reason given"`.
  - Without a pass, the list is `[]`.
- New `droppedBlock(entries, round)` beside `personLine` (line 864). It returns the `<details>` lines from Task 2, with `in round <n>` in the summary only when `round` is given, and renders an empty ref as `no reason given`. Blank lines around the list let GitHub render it inside `<details>`.
- `reviewBody` (lines 851–854): after the For the person block, `if (dropped.length) lines.push('', ...droppedBlock(dropped))`, before the trailing sentence.
- The round record (line 3295): add `droppedCandidates: reviewOut.droppedCandidates || []`. It stays out of `result()`, which keeps counts only.
- `handoffComment` (lines 2821–2826): after `### For the person`, take the last record with `coverage`. When its `droppedCandidates` is non-empty, push `droppedBlock(entries, record.round)` before `### Commits`.

Docs entry: `workflows/redline-loop.js` (body and handoff) → `docs/running.md` "The coverage pass" and "The handoff comment", plus README "Known limits" ("What a clean run means"), updated in Task 5's commit.

## Task 5: Docs

- `docs/running.md`:
  - "Rounds" step 1: "already tracked, never fixed" gains the partly tracked case, and the review's contents gain the dropped block after For the person.
  - Step 7: "tracked elsewhere" becomes "tracked elsewhere in full; the part an issue does not track is judged on its own" (`process/docs-gate.md`, #80 R5-1: every statement of the done rule).
  - "The coverage pass": add the partly tracked outcome; the refutation rule and the new format of a `refuted` ref in `round-<n>-findings.json` (the claim it disproves and the evidence against it); the removed-guard exception to the disproportionate guard; and the dropped block (one line each: the candidate's file and line, its own summary unedited, the outcome and the verifier's reason; no block when nothing was dropped).
  - "The handoff comment": add the block of the last round that ran the coverage pass, after For the person, naming its round. Earlier rounds' drops stay in their own reviews.
- `README.md` Known limits, "What a clean run means": "settled, carried or tracked" becomes "or tracked in full (the part an issue does not track is judged on its own)". After the Deferred and decided sentence, add that the last coverage round's dropped candidates are listed in the handoff with each reason (#85).
- No `docs/contract.md` entry (decision 13), and no mission edit.

## Task 6: Version 0.2.2

`.claude-plugin/plugin.json` and the entry in `.claude-plugin/marketplace.json`: `0.2.1` → `0.2.2` (patch). Docs entry: no reader-facing change, since only the version string moves; the CHANGELOG line is written at tag time (CONTRIBUTING.md, Releases).

## Task 7: Verification Gate

- Steps 1–9: run `.claude/redline/checks.sh --baseline` until every check passes. Its JSON is the evidence, and failing output is reported verbatim.
- Step 10, Docs: each entry above names its commit or its reason.
- Step 11, Version: 0.2.2 in both files.
- Step 12, Standards retrospective: list, classify and present with AskUserQuestion; approved edits land in their own commit. Expected items:
  - `workflow/agents.md`, the coverage-pass bullet: partly tracked (accounted for by the remainder, `known` only when tracked whole); the refutation rule; the removed guard; the dropped block (the candidate's own summary unedited, after For the person; the handoff carries the last coverage round's, naming it) (#85).
  - `testing/tests.md`, the loop-test bullet: it reads `agents/redline-reviewer.md`, and pins one short key phrase per verifier rule in the agent file and the verify prompt, absent under `coverage off` (#85).
  - `process/internal-notes.md`, the throwaway-PR bullet (decision 10): once the original PR has merged, its review-round folders are on the default branch, and a coverage pass that follows the repository's check-before-reporting rule reads them. Either measure before the original merges, or audit what the pass read, call by call.
- Step 13: `plan.md` As built and `shape.md` Decisions record any deviation.

## After the gate (yours)

- Replay the rerun's recorded 25 candidates at the same SHA, against the first bullet of #85's Done when (decision 7). The result goes to `SPIKE-72-NOTES.md` §10, not this spec.

## Commits (yours; nothing is staged)

1. Spec folder (Task 1).
2. The three rules: `agents/redline-reviewer.md`, `candidatesBlock`, and the rule checks plus the partly tracked scenario.
3. The dropped block: the workflow and its checks.
4. Docs: `docs/running.md`, `README.md`.
5. Version 0.2.2.
6. Standards retrospective edits, on their own.
7. As built: `plan.md`, `shape.md`.

## Verification

- `node tests/loop-test.mjs`: the new checks red after Task 2 and green after Tasks 3 and 4, with every existing check unchanged.
- `.claude/redline/checks.sh --baseline`: all nine checks exit 0.
- Read one rendered body from the loop test (the three-drop scenario) to confirm the `<details>` shape, and that no dropped line opens with `- **R`.

## Docs entries (gate step 10)

| File | Section | Commit or reason |
| --- | --- | --- |
| `agents/redline-reviewer.md` | `docs/running.md` "Rounds" (step 1) and "The coverage pass"; no template | the docs commit (4): partly tracked, the refutation rule, the removed guard, the `refuted` ref's format |
| `workflows/redline-loop.js` (the verify prompt) | `docs/running.md` "Rounds" (step 7) and "The coverage pass"; README "Known limits" ("What a clean run means"); no template | the docs commit (4): "tracked" now reads "tracked in full", in every statement of the done rule |
| `workflows/redline-loop.js` (the dropped block) | `docs/running.md` "The coverage pass" and "The handoff comment"; README "Known limits" ("What a clean run means"); no template | the docs commit (4) |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | none | no reader-facing change: only the version string moves (0.2.1 → 0.2.2); the CHANGELOG line is written at tag time (CONTRIBUTING.md, Releases) |

No new config key, subcommand, allow rule or exit code. `docs/contract.md` has no entry (decision 13).

## As built

- **Task 1.** The spec folder as planned; `standards.md` holds the full text of the eight standards as they read before the retrospective's edits.
- **Task 2, red.** `node tests/loop-test.mjs` printed `591 checks passed, 8 failed` after the checks were added: the three rule checks, the partly tracked scenario, the body's dropped block, the two handoff blocks and the empty reason. The partly tracked scenario failed only on its prompt-phrase clause: the workflow already counted a finding with `knownAs` empty as confirmed, listed it under Findings and shaped it, so the rule lives in the prompt and the agent file, and the scenario pins the path the rule relies on. One check, "no dropped line opens with a finding id", passed vacuously on the red run (with no block, its slice was empty), so it now also requires the block to be there.
- **Task 3.** `agents/redline-reviewer.md`: the new paragraph after "Check for known findings first"; "in full" in the done rule; the collapse counter-case; the known-finding bullet; a new bullet, "A refutation answers the candidate's claim"; the removed-guard exception in the disproportionate guard; the accounting (the `refuted` ref, partly tracked accounting, the refs posted in the dropped block); the For the person bullet; the `knownAs` paragraph. A search for `#N lacks`, `one sentence why` and `already tracks` found no old wording left. `candidatesBlock`: four edits in the branch with candidates (the definition of new, the for-each sentence, the guards sentence, the accounting sentence), each applied by an exact single match, plus the comment above the function. The known-finding sentence of every review prompt is unchanged.
- **Task 4.** As planned: `DROPPED_OUTCOMES`, `out.droppedCandidates` after `accountCoverage` (`[]` without a pass), `droppedBlock(entries, round)` after `personLine`, the block in `reviewBody` after For the person, `droppedCandidates` on the round record (not in `result()`), and the last covered round's block in `handoffComment` before `### Commits`.
- **Green.** `node tests/loop-test.mjs`: `599 checks passed, 0 failed`.
- **Task 5.** `docs/running.md`: Rounds steps 1 and 7, "The coverage pass", "The handoff comment". README Known limits, "What a clean run means": "tracked in full", and a sentence on the handoff's dropped block.
- **Task 6.** 0.2.2 in both files.
- **Task 7.** `.claude/redline/checks.sh --baseline` exited 0, every check `exit` 0: syntax, validate, guard, loop, prefs, gate, setup, gh, background. Standards retrospective: three edits approved and applied (see `shape.md`).
- **Commits.** Commit 2 carries the three rules and the dropped block together, in place of the plan's commits 2 and 3: both change `workflows/redline-loop.js` and `tests/loop-test.mjs` in interleaved hunks, and the plan's split would need hunk staging. Decided by: @michaelfromtheoutfit.
