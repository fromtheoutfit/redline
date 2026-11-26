# PR #127 review round 5: a decision a reshape newly leaves keeps its fix, a link on an unasked review cleared for the wrong reason, and call warnings for a decided finding

Spec folder: `agent-os/specs/2026-11-25-1418-127-review-round-5/`

Shaped by Redline in unattended mode, for review round 5 of PR #127 (issues #105, #75 and #126), from the round's three findings (`redline/round-5-review.json`, `redline/round-5-findings.json`).

- `fix`, one task each, in the order the round lists them: R5-3 (Task 2), R5-1 (Task 3), R5-2 (Task 4).
- No `decline`, no `defer` and no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#105)`. No commit subject holds a bare `@word`.

Line numbers are at `10f2630`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, `agents/`, `skills/`, anything under `templates/`, `.claude/commands/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text. The version stays `0.5.0`: the pull request bumped it once, and a review round of the same pull request adds no bump. No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**This round edits `workflows/redline-loop.js`**, which the pull request's own caution names. A relaunch of this run runs the script it launched with (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)").

**Where each task works.**

- `workflows/redline-loop.js`:
  - Task 2: `revise()`, beside `leftDeferred` (4592); `resolveWith`'s left block (4658-4671); the approve loop's R4-4 loop after the reshape's `vetShape` (4996-5004); the comment in `resolvePrompt` (2446-2448).
  - Task 3: `honourLinks` (3100-3132); `review()`'s link section (3212-3248); the revise-only pass's call (6074).
  - Task 4: `forceAskRules`' first line (3972), the R4-2 warning (4043-4045), the relabel warning (4088-4090); `vetShape`'s call (4434).
- `tests/loop-test.mjs`: every task adds checks; no existing check changes.
  - Task 2's cases go in two places:
    - the `filing:` block, after the check whose name opens `filing: that named call is posted as left to the person under the rule` (4050);
    - the `left:` block, after the check whose name opens `left: a decided finding a reshape leaves to the person with its task emptied runs on` (5180), where `billing`, `later`, `laterNoEntry`, `namedLater`, `pickOf`, `typedDefer` and `goAhead` are in scope.
  - Task 3's cases go in the `class:` block after the check whose name opens `class: a link returned by a review that was shown no earlier finding is cleared with a warning` (5310), where `CLEARED`, `f` and `baseArgs` are in scope.
  - Task 4's cases go in the `left:` block after Task 2's.
- `docs/running.md`: Task 2 (128, "A reshape after your decision"), Task 3 (86, "Instance or class"), Task 4 (95, "Left to you"). Each is found by its own anchor text, and no anchor lies in the text another task changes.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-25-1418-127-review-round-5/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task adds its checks first and sees them fail on a gate run, then makes the change and sees them pass.
- The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-25-1418-127-review-round-5/redline/snapshot.json`, which prints the failing check names. The count recorded is the harness's own summary line, read off the run.
- A pin whose outcome already holds before the change (a neighbour below) cannot be red before the build. It is written with the others, As built says so, and it is seen red under a mutation of the clause it turns on.
- If gate runs are slow, the red runs of several tasks may be seen together in one gate run. Each task is still committed with only its own checks, and the combined run is recorded under As built.

**Existing checks.** No existing check's expectation changes in this round. Any existing check that goes red is a fault in the task.

## Task 1: Save spec documentation

Commit the spec folder as it stands (`plan.md`, `shape.md`, `standards.md`, `references.md`; never anything under `redline/`) on its own: `redline: save review round 5 spec for PR #127 (#105)`.

## Task 2: R5-3 — a decision a reshape newly leaves to the person is given what a resolve gives a left decision

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`, `docs/running.md`

The cause is `resolveWith`'s treatment of a left decision, copied in part to the R4-4 loop. It moves into one helper both call (cause: `one-place`, `workflows/redline-loop.js`).

In the checks below, "the decisions shown in a prompt" means the text of that prompt from `Decisions made outside the shaper` to the next blank line (`\n\n`). That text holds the JSON of `roundDecisions` in `planPrompt` (2524) and in the implementer's prompt (2602). `NAMED_FIX` is exactly:

`round 1: R1-1 is left to the person under repository rule billing; the disposition "fix" is not applied`

1. **Red.** In `tests/loop-test.mjs`:
   - **A named fix** (member 5). In the `filing:` block, after the check named above, add a check on the existing `forcedNamed` run:
     - the decisions shown in `plan approver r1` include `"disposition": "fix"`;
     - the decisions shown in `plan approver r1 #2` and in `implement r1` include `"rule": "billing"` and do not include `"disposition"`;
     - `res.warnings` holds `NAMED_FIX` exactly once.
   - **A pick that ends in fix or accept** (member 4). In the `left:` block, after the check named above, loop over two cases, each `[label, end, extra]`: `['Change it', 'fix', {}]` and `['Keep it', 'accept', { acceptedCalls: ['R1-1'] }]`. Each runs `go(\`left: a pick that ends in ${end}, left to the person by a reshape after its resolve\`, { ...baseArgs, askRules: billing, decisions: pickOf(label, 'The author picks it.') }, { ...laterNoEntry, ...extra })`. Check:
     - the run is `done`, with no `repair r1` call;
     - the decisions shown in `plan approver r1` include `"disposition": "<end>"`;
     - the decisions shown in `plan approver r1 #2` and in `implement r1` include `"rule": "billing"` and `"option": "<label>"`, and do not include `"disposition"`;
     - no warning includes `is not applied`, as for a pick at a call (`tests/loop-test.mjs:4789`);
     - the reply for `R1-1` opens `Redline round 1: left to @author under repository rule billing`.
   - **Autopilot** (member 4 again). The same `laterNoEntry` scenario with `{ ...baseArgs, askRules: billing, interrupt: 'autopilot' }` and no decisions: autopilot picks `Keep it`, which ends in fix there. Check:
     - the run is `done`;
     - the decisions shown in `plan approver r1 #2` include `"rule": "billing"` and do not include `"disposition"`.
   - **Neighbours that must not change.** They hold today, so each is seen red under the mutation in step 3.
     - `namedLater` (a named deferral, member 6): the decisions shown in `plan approver r1 #2` include both `"rule": "billing"` and `"disposition": "defer"`.
     - `forcedLater` (an answer in the person's own words, member 7): the decisions shown in `plan approver r1 #2` include `"rule": "billing"` and no `"disposition"`, and no warning includes `is not applied`.
   - The existing checks of `resolveWith`'s left block must stay green unchanged: `tests/loop-test.mjs:1663` (an override to fix on a forced finding), `4789` (a pick on a left call warns of none), `4792` and `4945` (a typed fix on a left call warns).
   - Seen red: the named-fix check, both pick cases and the autopilot case.
2. **Green.** In `workflows/redline-loop.js`, inside `revise()`, after `leftDeferred` (4592), add `leaveDecision(id, decision)`. With `forced = record.forced[id]`:
   - when `decision.disposition` is set and is not `defer`:
     - it pushes today's warning (`${pass.name}: ${id} is left to the person under ${leftUnder(forced)}; the disposition ${JSON.stringify(decision.disposition)} is not applied`), only when `decision.option === undefined`;
     - it then deletes `decision.disposition`;
   - it sets `decision.rule = forced.rule`, and `decision.own = true` when `forced.own`.

   Its comment says:
   - it is the one place a decision is given what a left finding's decision carries (#49; #126; #127, R5-3);
   - a pick's end is dropped with no warning, since a pick of a left call never takes a non-defer end at a resolve;
   - until R5-3 the reshape loop set `rule` and `own` alone, so a pick or a named fix kept its disposition beside the rule.

   Then:
   - `resolveWith`'s `if (forced) { ... }` block (4663-4671) becomes `if (forced) { leaveDecision(id, decision) }`. The comment above it (4658-4662) stays. Within `resolveWith` the warning fires exactly when it does today: a forced pick never has a non-defer disposition there (4638), and intake refuses a decision that names both `option` and `disposition`.
   - The R4-4 loop (4999-5004) becomes `for (const id of named.filter((x) => record.forced[x] && !leftBefore.has(x))) { leaveDecision(id, roundDecisions[id]) }`. Its comment says it gives such a decision everything `resolveWith` gives a left one (#127, R5-3).
   - The comment in `resolvePrompt` at 2446-2448 is unchanged: it is true again.
3. **Mutation** (for the neighbours). Remove the `decision.disposition !== 'defer'` test from the helper's condition. The `namedLater` neighbour turns red. Restore it. As built records the run.
4. In `docs/running.md`, "Dispositions", the bullet "A reshape after your decision" (128): at its end, after the anchor `or return the finding as an ask with no files whose call names the rule to leave it to you.`, add this sentence:

   `Such a finding is then shown to the plan approver's next pass and the implementer as one left to you: its decision carries the rule, and a fix or an accept it ended in is not applied, with the warning a fix or an accept typed for a left finding always had, and none for a pick, as at a call (#127, R5-3).`

**Proof:** the gate run shows the new checks passing, and `grep -c 'and none for a pick, as at a call (#127, R5-3)' docs/running.md` prints `1`.

**Docs:** `workflows/redline-loop.js`: `docs/running.md`, "Dispositions", "A reshape after your decision", updated in this task.

**Commit:** `redline: R5-3 give a decision a reshape newly leaves to the person what a resolve gives one (#105)`

## Task 3: R5-1 — a review that was not asked for links clears every link it returns with the one true reason

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`, `docs/running.md`

The cause is that every reader of a link reads it before anything asks whether the review was asked for links. The question moves first, into one function (cause: `one-place`, `workflows/redline-loop.js`).

The two new warnings are, for the scenarios below, exactly:

- `BESIDE_UNASKED`: `round 1: the reviewer returned sameClassAs beside findings, at the top of its result, but this review was shown no earlier finding; the link is cleared`
- `FORM_UNASKED`: `round 1: the reviewer stated sameClassAs for R1-1 as "R0-1", but this review was shown no earlier finding; the link is cleared`

1. **Red.** In `tests/loop-test.mjs`, in the `class:` block, after the check named above, add round-1 cases on `baseArgs`, a pull request with no earlier round:
   - **Beside findings** (member 3). `{ reviews: [[f('R1-1', 'correctness')], []], reviewKeys: [{ sameClassAs: { 'R1-1': ['R0-1'] } }], commitIds: [['R1-1']] }`. Check:
     - the run is `done`;
     - `res.warnings` includes `BESIDE_UNASKED`;
     - no warning includes `where the workflow does not read it`;
     - the round's finding carries no `sameClassAs`.
   - **A renamed id** (member 4). `{ reviews: [[f('R0-1', 'correctness'), f('R1-2', 'correctness', { sameClassAs: ['R0-1'] })], []], commitIds: [['R1-2', 'R1-3']] }`. The rename makes `R0-1` into `R1-3`; As built records the id the run gives it. Check:
     - `res.warnings` includes `CLEARED(1, 'R1-2', 'R0-1', 'this review was shown no earlier finding')`;
     - no warning includes `so the link is ambiguous`.
   - **No list of ids** (member 5). `{ reviews: [[f('R1-1', 'correctness', { sameClassAs: 'R0-1' })], []], commitIds: [['R1-1']] }`. Check:
     - `res.warnings` includes `FORM_UNASKED`;
     - no warning includes `which is no list of finding ids`.

     The same with `sameClassAs: ['R0-1', 7]`. Check:
     - one warning, `FORM_UNASKED` with `["R0-1",7]` in place of `"R0-1"`, as `JSON.stringify` writes it;
     - no warning includes `the entries that are no id are cleared`.
   - **An empty list** (member 2). `sameClassAs: []` on round 1: no warning includes `sameClassAs`.
   - **Neighbours that must not change:**
     - the `unasked` check at 5310 (member 1, a well-formed list, cleared per id);
     - the round-2 checks `BESIDE` (5518), `UNREADABLE` (5521-5526) and `renamedLink` (5400), whose reviews were asked;
     - `reviseOnly` (5314), with its `noRecord` reason.
   - Seen red: the beside, renamed and no-list cases. The empty-list case holds today: it is seen red under the mutation in step 3.
2. **Green.** In `workflows/redline-loop.js`:
   - Add `clearUnasked(round, out)` beside `honourLinks`. It clears every link on a review that was not asked for links, with that one reason:
     - `out.sameClassAs !== undefined`: pushes `BESIDE_UNASKED` (with the round) and deletes it;
     - for each finding whose `sameClassAs` is not `undefined`:
       - an empty list: deleted with no warning;
       - a list of ids (an array whose every entry is a non-blank string): one `round ${round}: the reviewer linked ${f.id} to ${id} as one class (sameClassAs), but this review was shown no earlier finding; the link is cleared` per unique trimmed id, the words `honourLinks` gives today, then deleted;
       - anything else: one `FORM_UNASKED` (with `JSON.stringify(f.sameClassAs)`), then deleted.

     Its comment says whether a link was asked for is checked once, before any other reading of a link, so the reason a cleared link gives is the real one on this review. Until #127, R5-1 the readers beside `findings`, of a renamed id and of a link's form ran first and gave theirs.
   - In `review()` (3212-3248): `if (!linksAsked) { clearUnasked(round, out) } else { ... }`. The `else` holds the top-level block (3219-3222), the rename loop (3229-3247) and `honourLinks(round, out.findings)`, unchanged but for that call.
   - `honourLinks` loses its `asked` parameter, now always true: `function honourLinks(round, findings, noRecord = false)`.
     - The `!asked ? 'this review was shown no earlier finding' :` arm of `why` (3119) is removed.
     - Its comment says the unasked review is cleared before it, by `clearUnasked`.
     - The revise-only call (6074) becomes `honourLinks(round, record.findings, true)`.
3. **Mutation** (for the empty-list case). In `clearUnasked`, warn for an empty list as for a list of ids. The empty-list case turns red. Restore it. As built records the run.
4. In `docs/running.md`, "Dispositions", "Instance or class" (86): after the anchor `and one that names an id the review renamed, which may mean either finding`, insert this clause; the `;` that follows stays:

   `, and a review that was not asked for links (the first review of a pull request with no earlier round) clears every link it returns, beside the findings or on one and in any form, with the one reason that it was shown no earlier finding (#127, R5-1)`

**Proof:** the gate run shows the new checks passing, and `grep -c 'with the one reason that it was shown no earlier finding (#127, R5-1)' docs/running.md` prints `1`.

**Docs:** `workflows/redline-loop.js`: `docs/running.md`, "Dispositions", "Instance or class", updated in this task.

**Commit:** `redline: R5-1 clear every link on a review not asked for links with the one true reason (#105)`

## Task 4: R5-2 — forceAskRules gives no call-shaped warning for a finding already decided

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`, `docs/running.md`

The cause is that `forceAskRules` is not told which findings the round already decided, so its warnings about the call it builds or relabels fire for a call that is not shown again. It is told, as `checkDrafts` is (cause: `one-place`, `workflows/redline-loop.js`).

1. **Red.** In `tests/loop-test.mjs`, in the `left:` block, after Task 2's cases, add:
   - **A decided deferral a reshape leaves with a short entry and its call kept** (members 4 and 5). Run `go('left: a decided deferral a reshape leaves to the person, returned as a deferral with a short draft and its call kept', { ...baseArgs, askRules: billing, decisions: typedDefer(), deferrals: goAhead('R1-1') }, { ...later, reshapeDefer: ['R1-1'], reshapeDrafts: { 'R1-1': { title: '' } } })`.
     - What the reshape does: it sorts `R1-1` as `defer` with an entry whose title is empty, keeps the round's call for it (the mock builds one, since `ask` names it, under `product decision`), and tags it `billing`.
     - Check: the run is `done`.
     - Check: no warning includes `with no complete drafted issue`.
     - Check: no warning includes `its call keeps the options the shaper wrote`.
     - Check: `res.warnings` still includes `round 1: the shaper sorted R1-1 as defer; repository rule billing makes it an ask for the person` (member 1).
     - Check: the `file deferred r1` prompt includes `# Lock R1-1`, the resolve's draft (`guard`).
   - **Neighbours that must not change:**
     - the R4-2 cases (`SHORT_DRAFT`, `tests/loop-test.mjs:4871-4878`), on a first shape with no decision applied, still warn;
     - the R1-4 case (`RELABELLED`, 5014) still warns;
     - the check whose name opens `left: a complete draft kept under a rule is warned about as no incomplete one` (4880) still holds.
   - Seen red: the new case.
2. **Green.** In `workflows/redline-loop.js`:
   - `function forceAskRules(record, pass, inScope, shaped, decided = [])`.
   - The R4-2 condition (4043) becomes `if (s.disposition === 'defer' && !kept && !decided.includes(f.id))`.
   - The relabel warning (4088) becomes `if (relabelled && !decided.includes(f.id))`. `relabelled` and what `record.forced` records are unchanged.
   - `vetShape` (4434) calls `forceAskRules(record, pass, inScope, shaped, decided)`.
   - The comment above the function says:
     - `decided` is the round's decided ids on a reshape, as `checkDrafts` reads them;
     - a decided finding's call is not shown again, so the two warnings about the call (a draft not kept as its option, the options it keeps) are not given for one (#127, R5-2);
     - the warnings that hold for a decided finding (its sorting made an ask, the rule its call names, a tag that names none) are given as before.
3. In `docs/running.md`, "Dispositions", "Left to you" (95): after the anchor `a draft short of a field is not kept, and the run warns with what it lacks`, insert this clause; the `.` that follows stays:

   `, unless the finding was already decided, whose decision stands and whose call is not shown again (#127, R5-2)`

**Proof:** the gate run shows the new check passing, and `grep -c 'unless the finding was already decided, whose decision stands' docs/running.md` prints `1`.

**Docs:** `workflows/redline-loop.js`: `docs/running.md`, "Dispositions", "Left to you", updated in this task.

**Commit:** `redline: R5-2 give no call warning in forceAskRules for a finding already decided (#105)`

## Task 5: Verification Gate

Gate steps 1 to 9: run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-25-1418-127-review-round-5/redline/snapshot.json` until it exits 0; its JSON is the evidence.

Steps 10, 11, 12 and 13 stay as written:

- **10. Docs.** Each task above names its `docs/` section for `workflows/redline-loop.js`, the one file it touches under the step's directories. As built records each entry's commit.
- **11. Version.** `0.5.0` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged: the pull request bumped it, and no template body changes this round.
- **12. Standards retrospective.** The list under "Standards retrospective (proposed)" in `shape.md`, as the standards approver approves it, applied in its own commit after the finding commits: `redline: record the round 5 review lessons in the standards (#105)`.
- **13. Spec folder.** `plan.md` gains an As built section in the last commit: `redline: record the as-built state of review round 5 for PR #127 (#105)`. It records each task's commit, its red and green counts read off the gate's summary line, every mutation run, and the id the rename gave in Task 3's renamed case. Any deviation is recorded under Decisions in `shape.md`.
