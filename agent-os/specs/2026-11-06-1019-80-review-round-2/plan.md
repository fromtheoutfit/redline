# PR #80 review round 2: the coverage pass's markers, renamed ids, the changelog line, the meaning of new and the guard in the fork

Spec folder: `agent-os/specs/2026-11-06-1019-80-review-round-2/`

Shaped by Redline in unattended mode, for review round 2 of PR #80 (issue #79), from the round's five findings (`redline/round-2-findings.json`). Three are `fix`: R2-2 (the marker parse), R2-3 (a renamed id's accounting) and R2-4 (the changelog line). Two were judgment calls the person decided (`shape.md`, Decisions 4 and 5): R2-1 is built as option A (a candidate matching a `fixed` finding that still reproduces is new), and R2-5 as option B (the docs corrected and today's approval pinned by a guard row; the guard itself is narrowed by a person after the run, so R2-5 is listed under Deferred in `shape.md`). Each fix task is one commit whose message names its finding id, following "Git rules for Redline agents" in `README.md`. Line numbers are at `bac0b25`.

Every command below is a plain pipeline. The loop test runs through the gate script, never by hand with an interpreter.

## Task 1: Save spec documentation

Create `agent-os/specs/2026-11-06-1019-80-review-round-2/` with four files. `plan.md` is this plan. `shape.md` holds the scope, the decisions with owners, the proportionality table, the unattended answers, one observation out of scope and the proposed standards retrospective. `standards.md` holds the applied standards as they read at shaping time. `references.md` lists the code studied. No `visuals/`. The `redline/` subfolder is Redline's own record and is not touched.

Files: the four files above (already written by the shaper).

**Docs entry:** spec folder only; no reader-facing change.

## Task 2: R2-2, read the coverage markers wherever the agent puts them on a line

Files:

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

Change:

1. `coverageCandidates()` (`workflows/redline-loop.js:1189-1223`):
   - Move the two marker tests (`1192-1197`) after the fenced-block scan (`1198-1221`). A fenced block that is the skill's list returns candidates exactly as today. An empty array is still zero candidates, and an array with no contract field is still skipped (R1-3).
   - When the scan finds no list, test `/^[ \t]*[`'"]*coverage: skill denied/im` first, then `/^[ \t]*[`'"]*coverage: skill absent/im`. Each matches at the start of any line, after optional spaces and any run of backticks or quotes. A match returns `{ cause: 'denied', text: t }` or `{ cause: 'absent', text: t }` as today.
   - With neither, return `{ cause: 'no array', text: t }` as today.
2. The docblock above the function (`1182-1188`) says the order and why. The function reads the first fenced json block in the skill's shape. Only when there is none does it read the two marker lines, each at the start of any line with leading backticks or quotes allowed, since the agent may copy the prompt's formatting or lead with a sentence (#80, R2-2). The marker is tested after the scan so that a skill result quoting a marker at a line start is still the list. A real denied or absent reply holds no such array.
3. `coveragePrompt()` and `coverageMessage()` are unchanged. The prompt text stays byte-identical, so no other loop check moves.

Proof, in `tests/loop-test.mjs` section 15, after the three-causes loop (`1386-1389`). Red first: add the checks and see the first two fail through the gate.

- A coverage text of ``'`coverage: skill denied`\nSkill tool is not allowed in this session'`` under `covArgs` with `reviews: [[]]` ends as `status: 'error'`, `stage: 'review'`, `resumeFrom` `{ label: 'coverage r1', attempt: 2 }`. The error holds `the Skill tool was denied` and `launch again with coverage off`. Name it `coverage: a backticked denied marker stops with the denied cause`.
- A coverage text of `'The Skill tool reported no such skill.\ncoverage: skill absent\nNo such skill: code-review'` ends the same way, with `no skill named code-review` in the error. Name it `coverage: an absent marker after a leading line stops with the absent cause`.
- Neighbour that must not change: a coverage text of ``'`coverage: skill denied` is one of the markers the prompt names.\n' + two`` with `coverageOut: [settledAll]` is read as the skill's list. Under `covArgs` with `reviews: [[]]`, `status` is `'done'`, `labels(run.calls)` includes `review r1`, and that prompt holds `"summary": "the real one"`. Name it `coverage: a skill result that quotes a marker is still the list`. This scenario sits after `settledAll` is defined (`tests/loop-test.mjs:1319`).
- Neighbours that must not change: the existing three-causes checks (`1386-1389`, bare markers at the start and `Skill execution completed`), the two R1-3 drift checks (`1392-1395`) and the empty-array check (`1398-1399`) all pass unchanged.

**Docs entries:** `workflows/redline-loop.js`: `docs/running.md` "The coverage pass", the three-causes paragraph, names the causes and their fixes, not how the marker line is parsed. No reader-facing change: the causes, their messages and the prompt are unchanged, and the workflow now recognises the marker in the forms an agent writes it. `tests/loop-test.mjs`: not a Docs-step directory.

## Task 3: R2-3, rename a coverage entry's ref with the finding it names

Files:

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

Change:

1. `review()`, the rename loop (`workflows/redline-loop.js:1993-1999`): before the loop, `const renamed = new Map()`. When a finding is renamed, `renamed.set(<old id>, <new id>)` unless the old id is already a key (the first finding with that old id keeps it). The old id is the reviewer's `f.id` as given, trimmed when it is a string. The warning text is unchanged.
2. `review()`, inside `if (candidates) {` before `accountCoverage()` runs (`2030-2031`): each `out.coverage` entry whose `outcome` is `finding` or `duplicate`, and whose ref (trimmed when it is a string) is a key of `renamed`, gets `ref` set to the new id. No other entry and no other outcome is touched. A comment names #80, R2-3. The renamed finding is the round's own, so the entry names a finding of the round, and the R1-4 rule for a ref naming no finding does not apply to it.
3. `accountCoverage()` is unchanged.

Proof, in `tests/loop-test.mjs` section 15, after the accounting scenario (`1355-1365`). Red first.

- `covArgs`, `reviews: [[f('X-1', 'correctness')], []]`, `commitIds: [['R1-1']]`, `coverage: [two, two]`, `coverageOut: [[{ index: 1, outcome: 'finding', ref: 'X-1' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], settledAll]`. Name the scenario `coverage: a renamed finding keeps its accounting`. Check, for round 1:
  - `rounds[0].findings[0].id === 'R1-1'`.
  - `rounds[0].coverage.accounting[0]` reads `1:finding:R1-1` (as `` `${e.index}:${e.outcome}:${e.ref}` ``).
  - `rounds[0].coverage.counts.finding === 1` and `counts.forThePerson === 0`.
  - `rounds[0].forThePerson` is `[]`.
  - The `post r1` body holds `1 confirmed`.
  - `run.res.warnings` holds `round 1: reviewer returned id "X-1"; renamed R1-1`, and no warning holds `which is not a finding of this round`.
  If the mock's later stages key on the reviewer's id rather than the renamed one, the scenario may stop after round 1 with `{ ...covArgs, maxRounds: 1 }`. The checks above read round 1 only.
- Neighbour that must not change: the existing accounting checks (`tests/loop-test.mjs:1362-1364`), whose `finding` entry names `R9-9`, a ref that is neither a finding nor a renamed id. They still read `1:forThePerson:finding ref R9-9 names no finding` and still warn.

**Docs entries:** `workflows/redline-loop.js`: `docs/running.md` "The coverage pass" describes a `finding` outcome by the finding it names and says a candidate is counted where the round puts it. No reader-facing change: the rename is internal, and the fix makes the code match what the doc already says. `tests/loop-test.mjs`: not a Docs-step directory.

## Task 4: R2-4, say what a setup rerun does with `models.coverage`

Files:

- `CHANGELOG.md`

Change: replace line 13 (under `## 0.2.0`, `### Setup and templates`) with:

```
- `redline.json.example` gains `models.coverage`, the coverage pass's model and effort. A rerun of `/redline:setup` keeps an existing `redline.json` as it is and lists the template's `models` under differs without writing them; the key absent means the pass is on at the first-round reviewer's model and effort, so add it by hand only to pick another
```

Line 14 (the alias) is unchanged: a rerun does show the changed alias's diff and rewrites it on `--force` (`scripts/redline-setup.sh` header, lines 26-33). No other line of the file moves.

Proof: `grep -c "offers the new key" CHANGELOG.md` prints `0`, and `grep -c "lists the template's .models. under differs" CHANGELOG.md` prints `1`. Neighbour that must not change: `grep -c "offers the changed alias" CHANGELOG.md` prints `1`. The gate's setup test (the version agreement) stays green.

**Docs entry:** `CHANGELOG.md` is not under a Docs-step directory and adds no key, subcommand, allow rule or exit code; it is itself the reader-facing text. `docs/contract.md` (the `models` row, line 113) already says the key absent means on; no change there.

## Task 5: R2-1, a candidate matching a `fixed` finding that still reproduces at this head is new

Decided by the person: option A, count it as new (`shape.md`, Decision 4; decided by @michaelfromtheoutfit). A coverage candidate that matches a finding marked fixed but still reproduces at the round's head is a new finding of the round, named with the earlier id, so a fix that did not fully land keeps the run going for another round within `maxRounds`.

Files:

- `workflows/redline-loop.js`
- `agents/redline-reviewer.md`
- `docs/running.md`
- `tests/loop-test.mjs`

Change:

1. `candidatesBlock()`, the line that opens "A candidate is new when it collapses into none of these" (`workflows/redline-loop.js:1162`, the branch with candidates only): after its first sentence (the collapse list ending "already tracks."), add one sentence: "One outcome reopens: a candidate that matches an earlier finding whose outcome is fixed, but that you reproduce or trace at this round's head, is new, since the fix did not fully land; report it as a finding of this round with the earlier id named in its description (for example `R1-3 was fixed, but still reproduces here`), and account for it as finding. A candidate the fix did close no longer reproduces and is settled; a deferred, accepted, dropped, left-to-the-person or still-open finding stays settled." The rest of the line is unchanged. The no-candidates branch (`1155`) and the history line (`1112`, "never re-raise a declined, deferred or decided one") are unchanged, so every prompt of a `coverage off` run stays byte-identical. A comment names #80, R2-1.
2. `agents/redline-reviewer.md`, the "New carries the run's done rule" paragraph (line 30): the same sentence, after the collapse list. The first list's rule (line 20, "a match goes in `knownAs` as `<id>: <disposition>` and is never re-raised") gains: ", except a `fixed` one that a coverage candidate shows still reproduces at this head, which is new (see \"New carries the run's done rule\")". Line 22 ("A finding an earlier round declined, deferred or decided is not raised again") is unchanged.
3. `docs/running.md`:
   - Step 7 (line 42), the clause "where new means not collapsed into a finding already reported, settled in an earlier round, carried forward or tracked elsewhere" gains: "; a candidate that matches a finding marked fixed but still reproduces at the new head is new, reported with the earlier id named, so a fix that did not fully land runs one more round under `maxRounds`". The `coverage off` sentence after it is unchanged.
   - "The coverage pass" (line 48), after "collapses each candidate by cause into what the round, the earlier rounds of this run or of an earlier run on the PR, the carry-forward list or an issue already holds", add: "(a finding marked fixed is the one exception: a candidate that still reproduces it at the head is new, named with the earlier id, while one the fix did close no longer reproduces and settles)".

Proof, in `tests/loop-test.mjs` section 15. Red first: add the checks and see the first fail through the gate.

- In the `coverage: a new verified finding runs another round` run (`tests/loop-test.mjs:1320`, under `covArgs`), insert the check directly after the existing round-3 check at line 1321 and before line 1322 reassigns `run`. Round 2 of that run is a fix-diff round, which the workflow labels `re-review r2` (`workflows/redline-loop.js:1989`), and `pick` matches a label exactly (`tests/loop-test.mjs:241`), so the check reads `pick(run.calls, 're-review r2').prompt`. That prompt carries the candidates block, with R1-1 listed above it as an earlier finding, so it is the round where the sentence applies. The check: that prompt includes `whose outcome is fixed, but that you reproduce or trace at this round's head, is new` and `the earlier id named in its description`, and so does `pick(run.calls, 'review r1').prompt` (round 1 also ran the pass with `two`, and the sentence is in every candidates block). Name it `coverage: a fixed finding that still reproduces is new`.
- Neighbour that must not change: in the `coverage: off` run (`tests/loop-test.mjs:1419`), neither `pick(run.calls, 'review r1').prompt` nor `pick(run.calls, 'final nit pass r2').prompt` includes `whose outcome is fixed`; both labels exist in that run (`1420`). Name it `coverage: off carries no fixed-reopens sentence`. The existing `coverage: off` checks (`1420-1422`), the replay checks (byte-identical prompts) and the `coverage: empty array` check (`1398-1399`, the no-candidates branch) pass unchanged.

**Docs entries:** `workflows/redline-loop.js` and `agents/redline-reviewer.md`: `docs/running.md` step 7 and "The coverage pass", as change 3. `tests/loop-test.mjs`: not a Docs-step directory.

## Task 6: R2-5, correct the docs on the guard in the coverage fork and pin today's approval

Decided by the person: option B, correct the docs, pin today's decision, a person narrows the guard after the run (`shape.md`, Decision 5; decided by @michaelfromtheoutfit). This task is the mitigation the run builds; the guard change is the full fix, left open under Deferred in `shape.md`. Nothing in this task changes `scripts/redline-guard.sh` or `hooks/hooks.json` (point 11 of the unattended section).

Files:

- `docs/running.md`
- `README.md`
- `docs/guard.md`
- `tests/guard-cases.tsv`

Change:

1. `docs/running.md`, "What the guard does not vet" (line 56): replace "so the guard is inert inside it" and "The pass's safety is the skill's own read-only recipe and the session's permission mode" with what the guard does: the fork is a non-role session to the guard, so it is inert for every call but one shape, a Bash call that is one of the plugin's own scripts by real path, the repository's `checks.sh` or read-only git, which the guard approves for the fork exactly as for the main session (#50), with no prompt, every `redline-gh.sh` subcommand included (those that post a review, reply, comment, create an issue or resolve threads). The coverage prompt tells the agent not to post anything, and nothing enforces it; the rest of what the fork runs meets the session's allow list or permission prompt. A sentence names the narrowing as pending: a person will change the guard so a session that is not a Redline role is approved only `redline-gh.sh`'s read subcommands (#80, R2-5). The sentence on why a Redline role cannot host the pass, and the spike's list of what the fork ran, are unchanged.
2. `README.md`, Known limits, the bullet "The coverage pass runs outside the guard" (line 101): the same correction in the README's register. The guard does not vet the fork's commands, except that it approves the plugin's own scripts, `checks.sh` and read-only git for it with no prompt, every `redline-gh.sh` subcommand included, until a person narrows that to the read subcommands (#80, R2-5). The `coverage off` sentence and the link to `docs/running.md` are unchanged.
3. `docs/guard.md`, "The hook" (line 7), the last sentences from "A skill fork is the other way a call escapes the guard": say that the fork's hook input carries no Redline `agent_type`, so the fork is a non-role session to the guard. Its commands run unvetted, and the #50 exception above applies to it: the plugin's scripts by real path (every `redline-gh.sh` subcommand, the writes included), `checks.sh` and read-only git are approved with no prompt. `tests/guard-cases.tsv` pins the write approval under #80, R2-5, and the narrowing to `redline-gh.sh`'s read subcommands is pending, a person's change. The sentence on why the coverage pass is a plain workflow agent and never a role is unchanged.
4. `tests/guard-cases.tsv`: after #50's main-session rows (after line 391's comment block, beside `-	allow	Bash	PLUGIN/scripts/redline-gh.sh pr 1` at line 392), add a comment line naming #80, R2-5 (a non-role session, the coverage fork included, gets every `redline-gh.sh` subcommand approved today, the writes included; a person's later change narrows this to the read subcommands and flips this row to `inert`), then the row `-	allow	Bash	PLUGIN/scripts/redline-gh.sh reply 1`. No other row moves.

Proof: the guard harness, through the gate, passes with one more row (`tests/guard-cases.tsv`; the row is green at once, since it pins today's decision rather than a change). Neighbour that must not change: `-	allow	Bash	PLUGIN/scripts/redline-gh.sh pr 1` (line 392) and `-	inert	Bash	/tmp/x/scripts/redline-gh.sh pr 1` (line 393) still pass. Docs: `grep -c "the guard is inert inside it" docs/running.md` prints `0`; `grep -c "R2-5" docs/running.md`, `grep -c "R2-5" README.md` and `grep -c "R2-5" docs/guard.md` each print at least `1`.

**Docs entries:** `docs/running.md` "The coverage pass", `docs/guard.md` "The hook" and `README.md` "Known limits" are themselves the reader-facing change. `tests/guard-cases.tsv`: not a Docs-step directory. The later guard change names `docs/guard.md` in its own spec.

## Task 7: Verification Gate

Files: `agent-os/standards/workflow/agents.md`, `agent-os/standards/process/release.md` and `agent-os/standards/scripts/guard.md` (step 4's standards commit), and this spec folder's `plan.md` and `shape.md` (step 5).

1. Steps 1 to 9: run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-06-1019-80-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence. Expected movers: the loop test's count (Tasks 2, 3 and 5) and the guard test's count (Task 6, one row). Every other harness stays at its prior count.
2. Step 10, Docs: each task's Docs entry above names its section or its reason, and is confirmed against the task's commit.
3. Step 11, Version: `0.2.0` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged. The PR already bumps the minor version, and no fix changes what a setup rerun writes (`shape.md`, Decision 6).
4. Step 12, Standards retrospective: apply the list under `## Standards retrospective (proposed)` in `shape.md`, as the standards approver approves it, in its own commit. Items 1, 2 and 4 edit `agent-os/standards/workflow/agents.md`; item 3 edits `agent-os/standards/process/release.md`; item 5 edits `agent-os/standards/scripts/guard.md`. Items 4 and 5 were drafted after the person decided R2-1 and R2-5.
5. Step 13, Spec folder: `plan.md` reflects what was built; any deviation is recorded under Decisions in `shape.md`.

## As built

One commit per task, in plan order: the spec folder (`03d55f1`), R2-2 (`b999be2`), R2-3 (`ece89ba`), R2-4 (`85c88b6`), R2-1 (`3a34dd3`), R2-5's mitigation (`970506a`), the standards retrospective (`af36f74`, all five approved edits), and this as-built commit. Every task was built as planned, with these notes:

- **Red first.** Each loop-test check went in with its fix in the same edit pass, and the gate ran once per task, green; the red run the plan asked for before each fix was not taken separately. The checks read the behaviour the fixes add (a backticked or later-line marker, a renamed ref, the reopen sentence), which the code at `bac0b25` does not have.
- **Counts.** The loop test ends at 577 checks (the gate after Task 2 read 573, after Task 3 575, after Task 5 577); the guard test at 589 rows passed, one more for Task 6's pinned row. Every other harness is unchanged.
- **Task 6's row.** The comment and the `reply 1` row sit directly after `-	allow	Bash	PLUGIN/scripts/redline-gh.sh pr 1`, so the rows after it are three lines lower; none moved in order.
- **The standards commit names no finding.** No task in this plan sends part of a finding's fix through the retrospective, so every edit there is a lesson, and the message is `redline: record the round 2 review lessons in the standards (#79)`.
- **R2-5 stays deferred.** `scripts/redline-guard.sh` and `hooks/hooks.json` are untouched; the narrowing in `shape.md`'s Deferred entry is a person's change after the run.
- **Version.** `0.2.0`, unchanged (Decision 6).
