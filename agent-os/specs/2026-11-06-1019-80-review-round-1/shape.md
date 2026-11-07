# PR #80 review round 1: the coverage pass's bookkeeping — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The six findings of Redline round 1 on PR #80 (issue #79, the coverage pass: the `code-review` skill as the finder on every round, Redline's reviewer as the verifier), and nothing more:

- R1-2 (correctness, medium): a fix-diff round's verifier is not shown the findings an earlier run already handled, so a re-sampled deferred or decided finding counts as new.
- R1-3 (correctness, medium): a fenced array whose keys the skill renamed passes as blank candidates instead of the drift stop.
- R1-4 (correctness, low): every `finding` entry counts as confirmed, and some such candidates land in no list.
- R1-5 (correctness, low): the findings file saves the candidate count, never the candidate list.
- R1-1 (nit): the argument hint and the description leave out `coverage off`.
- R1-6 (nit): the handoff says the coverage pass ran at every round's head, but it never runs on the final nit pass.

## Decisions

1. **R1-2: fix.** On every round that ran a coverage pass, `reviewPrompt()` lists the earlier runs' handled findings (`trackedList`) and the "match against them" sentence; the carry-forward list and `reconcilePrior()` stay on the whole-PR round; `coverage off` prompts stay byte-identical. The reviewer's instructions and `docs/running.md` "The coverage pass" say the same. Loop-test check plus its `coverage off` neighbour. Plan Task 2.
   Decided by: redline
2. **R1-3: fix.** A non-empty fenced array with no entry carrying a non-empty `summary` or `failure_scenario` is not the skill's list; with no other array the round stops with the `no array` cause at `coverage r<n>`. The message names the skill's shape; `docs/running.md` follows. Plan Task 3.
   Decided by: redline
3. **R1-4: fix, all three parts.** The coverage accounting runs after the carry-forward reconcile. A `finding` entry whose finding carries `knownAs` is accounted `known`. Under `correctness only`, a `finding` entry naming a nit is accounted `forThePerson` and the nit's line is added to For the person. A `finding` entry whose ref names no finding of the round is treated like an unaccounted candidate: it is listed under For the person as reported (`{file, line, text: summary}`), keeps its warning, and is accounted `forThePerson` with the ref `finding ref <ref> names no finding`, so it no longer counts as confirmed (Unattended answer 3). Plan Task 4.
   Revised in plan-approver adjustment 1: the first shaping kept part (1) as it was, citing the #79 spec. The approver showed that the #79 spec says only that such an entry warns. The code's own docblock says the candidate is never dropped. Option (a) of the adjustment, fix part (1), was taken on that evidence (Unattended answer 3).
   Decided by: redline
4. **R1-5: fix.** `review()` keeps the parsed list, with indexes, as `out.coverageList`; the findings file writes it as `coverage.list`; the dead `reviewOut.candidates ||` fallback goes; the round record and `result()` are unchanged. Plan Task 5.
   Decided by: redline
5. **R1-6: fix.** The handoff's sentence becomes "The coverage pass reviewed the whole PR at the head of every round but the final nit pass". These are the words `docs/running.md` "The handoff comment" already uses. The loop-test check at line 1319 follows. Plan Task 6.
   Decided by: redline
6. **R1-1: fix.** `[coverage off]` goes into the skill's `argument-hint` and `description` grammar, into `templates/command-redline.md`'s hint, and into this checkout's `.claude/commands/redline.md` (the setup test pins the two equal). The description's done clause takes the workflow's own wording. One `CHANGELOG.md` line goes under Setup and templates. No version change: the PR already bumps the minor version. Plan Task 7.
   Decided by: redline
7. **Not changed: `skills/redline-review/SKILL.md`'s hint.** Its argument hint is a deliberate subset (`<pr> [correctness only] [dry run]`). It leaves out even `reviewer @handle`, which its description names. R1-1 names only the main skill and the alias template. Recorded so the omission is visible.
   Decided by: redline

### Proportionality (correctness findings)

| Finding | Likelihood and visibility | What it costs | Verdict |
| --- | --- | --- | --- |
| R1-2 | Needs a PR an earlier Redline run already handled (a relaunch after a finished or handed-off run, #35) and a coverage pass that re-samples one of its deferred, decided or dropped findings on round 2 or later. Traced in the code: `priorBlock` is `reviewed === 'pr' && priorFindings.length` (`workflows/redline-loop.js:1116`), and `history()` holds this run's rounds only (`1838-1847`); the reviewer's reproduction (`/tmp/redlinerepro/reviewer-r1-repro.mjs`, scenario A) shows `review r2` listing R1-1 and `re-review r3` not. When it fires, the run does not end: the finding is shaped against an earlier decision or the run hits the cap. | Two conditions in `reviewPrompt()` (the handled list's and the closing sentence's own), one parenthetical in `agents/redline-reviewer.md`, one sentence in `docs/running.md`, three loop-test checks. All inside the PR's diff; no new dependency or abstraction. | fix |
| R1-3 | Needs the skill's recipe to rename its keys, which is exactly the drift the stop exists for (#79 Decision 3). Confirmed in the code: `coverageCandidates()` maps each object with `''` and `0` for missing keys (`1199-1204`). When it fires, the verifier can confirm nothing, so the run ends `done` with no discovery pass and no word to the person. | About six lines in `coverageCandidates()`, one message reworded keeping its pinned words, one docs sentence, two loop-test checks. | fix |
| R1-4 | Three cases. The verifier reports a candidate as a finding that is then known: it is counted confirmed while listed under Already tracked. Under `correctness only`, it reports a nit it was told to put under For the person: the nit is dropped at `3205-3211`, after the counts at `1263`. Or it names a ref that is no finding of the round (`1248-1250`): the candidate is only warned about. Low impact: the body's count disagrees with its lists, and the candidate reaches no list. | About twenty lines in `accountCoverage()` and moving one block in `review()`. One docs clause. Four new loop-test checks; the existing accounting check at `tests/loop-test.mjs:1341` changes its expected outcome. | fix |
| R1-5 | Every coverage round: the findings file's `coverage.candidates` is always the count (`2068`; `reviewOut.candidates` is set nowhere), so the accounting's indexes point at a list kept only in the reviewer's prompt. Low impact: the committed record cannot say which candidate became what. | Three lines in `review()` and `post()`, one docs sentence, one loop-test check extended. | fix |

## Unattended answers

1. **Is a finding an earlier run handled "new" when the coverage pass re-samples it on a fix-diff round?** No. The PR description: "The run's done rule is now the manual loop's: a round whose verifier confirms no new correctness finding ends the run". `docs/running.md:42`: "new means not collapsed into a finding already reported, settled in an earlier round, carried forward or tracked elsewhere". The #79 plan's Context (`agent-os/specs/2026-11-05-1443-79-two-reviewer-whole-pr-round/plan.md:11`): "where new means not collapsed into a known, dispositioned or carried finding". An earlier run's deferred or decided finding is dispositioned and settled in an earlier round. The code withholds that list on fix-diff rounds, so the disagreement is the fix (Decision 1).
   Decided by: redline
2. **Is a fenced array whose entries carry none of the skill's fields the skill's list?** No. The #79 plan, Decision 5 (`plan.md:21`): "the workflow reads from it only the skill's own documented contract, one fenced ```json array of `{file, line, summary, failure_scenario}`"; Decision 3 (`plan.md:19`): a text with no such array is the recipe-drift cause. `docs/running.md:54` names that cause. Entries with none of those fields are not that contract (Decision 2).
   Decided by: redline
3. **What happens to a `finding` entry whose ref names no finding of the round?** It is listed under For the person as reported, with its warning, like an unaccounted candidate, and it does not count as confirmed. The code's own docblock answers this. `accountCoverage()` (`workflows/redline-loop.js:1226-1229`): "every candidate has exactly one entry; one the reviewer left out, or placed with an outcome the schema does not name, is listed under For the person as reported, with a warning, never dropped". The candidates block (`1156`): "never drop a candidate silently". The #79 spec says only that such an entry warns: Task 4.5 (`plan.md:120`), "a `finding` entry whose ref is not an id of this round's findings is a warning too", and As built deviation 3 (`plan.md:208`), "A `finding` entry whose ref is not an id of the round warns". Neither says the candidate may be left out of every list or counted as confirmed. The code keeps the warning but puts the candidate in no list and counts it under `finding` (`1248-1250`; the loop test pins `1:finding:R9-9` at `tests/loop-test.mjs:1341`). That disagrees with the docblock, so the disagreement is the fix (Decision 3). The warning stays, so the fix also keeps what the #79 spec says.
   Decided by: redline
4. **Where does a nit candidate go under `correctness only`?** Under For the person. The candidates block (`workflows/redline-loop.js:1157`): "under a correctness-only scope a nit candidate goes there too"; #79 As built deviation 2 (`plan.md:207`): "under a correctness-only scope the candidates block sends a nit candidate to For the person rather than leaving it unaccounted". The main loop drops a nit the verifier reported anyway (`3205-3211`), so it reaches no list: the fix (Decision 3).
   Decided by: redline
5. **What counts as "already tracked" in the body's count sentence?** What the body lists under `### Already tracked`: `reviewBody()` lists every finding with a `knownAs` there (`workflows/redline-loop.js:848-850`), and `coverageSentence()` names a bucket "already tracked" (`875`). Counting such a finding "confirmed" contradicts the body two paragraphs later (Decision 3).
   Decided by: redline
6. **Does the findings file have to say which candidate became what?** Yes. `docs/running.md:48`: "Every candidate gets one of eight outcomes in the round's findings file". An outcome keyed by an index is readable only beside the list it indexes (Decision 4).
   Decided by: redline
7. **On which rounds does the coverage pass review the whole PR?** Every round but the final nit pass: `review()` skips the pass when `reviewed === 'final-nit-pass'` (`workflows/redline-loop.js:1933`), the code's own comment says "every round but the nit pass" (`2701`), and `docs/running.md:83` says "every round but a final nit pass reviewed the whole PR at its head". The handoff sentence says "every round's head", so it is the fix (Decision 5).
   Decided by: redline
8. **Do the hints have to name `coverage off`?** The grammar table names it (`skills/redline/SKILL.md:33`), and each of the three coverage stop messages tells the person to "launch again with coverage off" (`workflows/redline-loop.js:1215`). A hint that lists every other word but this one is a gap (Decision 6).
   Decided by: redline
9. **Visuals:** none; this is a workflow and its copy.
   Decided by: redline
10. **Product context:** the #79 spec's alignment holds (`agent-os/specs/2026-11-05-1443-79-two-reviewer-whole-pr-round/shape.md`, Context): these fixes keep what the run acts on to what the verifier confirmed and make the For the person list and the count sentence match what the round posts.
    Decided by: redline
11. **Known-finding check.** `scripts/redline-gh.sh issues-search "coverage"` lists #73, #74, #79 and #20; none covers these six. No earlier review-round spec folder exists for PR #80; this is round 1.
    Decided by: redline
12. **Under `correctness only`, is a nit carrying a `knownAs` already tracked or for the person?** For the person. The main loop drops every nit under `correctness only` (`workflows/redline-loop.js:3205-3211`) before it splits the known findings out (`3212`), so such a nit is never listed under Already tracked; the candidates block sends a nit candidate under that scope to For the person (`1157`). Counting it `known` would repeat the count-against-list mismatch R1-4 fixes (Unattended answer 5). So the nit rule runs before the `knownAs` rule (plan-approver adjustment 2, Task 4).
    Decided by: redline

## Plan-approver adjustments

1. **Adjustment 1 (Task 4, R1-4 part (1)): applied as option (a).** Task 4 now fixes part (1) as well. A `finding` entry whose ref names no finding of the round is listed under For the person as reported, keeps its warning, and is accounted `forThePerson` with the ref `finding ref <ref> names no finding`. The existing accounting check at `tests/loop-test.mjs:1341` changes to that outcome, and its expected For the person list gains `app/x.php:3 · one`. Option (b), a pending decision, was not taken. The question does not arise: the code's docblock already answers it (Unattended answer 3), and the fix keeps the #79 spec's warning. Unattended answer 3, Decision 3 and the R1-4 proportionality row changed to match.
2. **Adjustment 2, Task 2 (R1-2): applied.** Step 1 said the closing sentence ("match against them, not against their review comments") is added under the same condition as the handled list. Today the sentence is gated on `priorBlock` alone (`workflows/redline-loop.js:1116`, `1131`), so it also shows on a whole-PR round whose earlier findings are all carry-forward. Under the handled list's condition that round would lose it with `coverage off`, which breaks the byte-identical rule (`workflow/replay.md`, the dial bullet). The sentence now has its own condition, `priorBlock || (Array.isArray(candidates) && trackedList.length)`, and the handled list's condition is unchanged. A new neighbour check beside `carry: a re-review never carries` (`tests/loop-test.mjs:583`) pins it. Under `baseArgs`, with a carry-forward prior only, `review r2` keeps the sentence, and `re-review r3` has neither the handled list nor the sentence. The coverage-on check also requires the sentence on `re-review r3`, and its `coverage off` neighbour requires it absent. This is within Decision 1 as recorded; no new decision.
3. **Adjustment 2, Task 4 (R1-4): applied.** (a) The known-finding proof scenario named no `coverage` text, so under `covArgs` the mock returned an empty array (`tests/loop-test.mjs:51`) and both accounting entries would have been ignored as out of range. It now has `coverage: [two]`, so indexes 1 and 2 are real. (b) Step 3 ran the `knownAs` rule before the correctness-only nit rule. A nit with a `knownAs` would then be counted `known` and never listed, since the main loop drops it before the known split. The nit rule now runs first, and the `knownAs` rule applies only to findings the round keeps (Unattended answer 12). A new check pins the order: a correctness-only nit with `knownAs: '#7'` is still `forThePerson` and listed. This is within Decision 3 as recorded; no new decision.

## Deferred

None.

## Context

- **Visuals:** None.
- **References:** see `references.md`. Code: `workflows/redline-loop.js` (`reviewPrompt()`, `candidatesBlock()`, `coverageCandidates()`, `coverageMessage()`, `accountCoverage()`, `review()`, `reconcilePrior()`, `post()`, `reviewBody()`, `coverageSentence()`, `handoffComment()`, the main loop), `agents/redline-reviewer.md`, `tests/loop-test.mjs` sections on carry-forward and 15, `skills/redline/SKILL.md`, `templates/command-redline.md` and `docs/running.md`. Also the #79 spec folder, and the reviewer's reproduction `/tmp/redlinerepro/reviewer-r1-repro.mjs` (read, not run: the shaper's guard does not allow `node`).
- **Product alignment:** as Unattended answer 10.

## Standards Applied

- workflow/agents: the coverage pass's contract (bullets on the skill relay and the finder/verifier), the carry-forward rule (only the first round carries), and the rule that a message says when it fires in the words of the decision behind it (R1-3's message, R1-6's sentence).
- workflow/replay: `coverage off` keeps every prompt byte-identical; R1-2's new list and sentence are added only when a pass ran, and the sentence keeps its whole-PR gate.
- testing/tests: each change adds a loop-test check and keeps a neighbour; red before green; the setup test pins this checkout's alias to its template (R1-1).
- process/docs-gate: each task names its `docs/` section or says why there is no reader-facing change.
- process/release: no second version bump; the CHANGELOG line for the alias change.
- process/standards-retrospective: the proposed list below.
- prompts/attribution: the spec and the commits carry no model or vendor name.

## Standards retrospective (proposed)

1. `agent-os/standards/workflow/agents.md`, the coverage-pass bullet (line 35), append: "The verifier is shown the PR's earlier runs' handled findings on every round that ran a coverage pass, not only on the whole-PR round, since the pass samples the whole PR at every head and can re-sample a finding an earlier run deferred or decided; the carry-forward list stays on the first round (#80, R1-2)."
2. `agent-os/standards/workflow/agents.md`, the skill-relay bullet (line 34), after "one fenced json array of findings", insert: "; an array none of whose entries carries the contract's fields is not that contract, and stops the round as recipe drift rather than passing as blank candidates (#80, R1-3)".
3. `agent-os/standards/workflow/agents.md`, the coverage-pass bullet (line 35), append: "The count sentence counts a candidate where the round puts it. Under `correctness only`, a nit reported from a candidate is `forThePerson` and listed there, whether or not it carries a `knownAs`. Otherwise a finding listed under Already tracked is `known`. A `finding` entry whose ref names no finding of the round is listed under For the person as reported, like an unaccounted candidate. The findings file keeps the candidate list beside the accounting its indexes point into (#80, R1-4, R1-5)."
4. `agent-os/standards/process/docs-gate.md`, new bullet: "A new launch word lands, in the same commit, in the skill's grammar table, its `argument-hint` and its `description`, and in the alias template's `argument-hint` with this checkout's copy, so the slash-command hint never omits a word a run's own message tells the person to type (#80, R1-1)."
5. R1-6 (a sentence the run shows the person that overclaims when the pass ran): already in `workflow/agents.md` line 15 ("A message the run shows the person says when it fires in the words of the decision behind it"); no change.
6. Plan-approver adjustment 1 (an earlier spec's silence read as a decision): already covered by point 2 of the unattended section in `.claude/commands/agent-os/shape-spec.md` (line 35): "A question the PR description, the original spec or the code's own docblock already answers is answered from that evidence ... Where the code disagrees with that answer, the disagreement is the finding to fix". No standard change.
7. Plan-approver adjustment 2, Task 2 (a sentence sharing a widened gate it never shared before): already covered by `workflow/replay.md`'s dial bullet (with the dial off, every prompt stays byte-identical) and by `testing/tests.md`'s neighbour rule; the new carry-only check is that neighbour. No standard change.
