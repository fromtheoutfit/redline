# PR #94 review round 3: the posted-text, reopen, minting, alias and result fixes the third review found

Spec folder: `agent-os/specs/2026-11-13-1329-94-review-round-3/`

Shaped by Redline in unattended mode, for review round 3 of PR #94 (issue #93), from the round's eight findings (`redline/round-3-review.json`, `redline/round-3-findings.json`).

- `fix`, one task each, in finding order: R3-2 (Task 2), R3-3 (Task 3), R3-4 (Task 4), R3-1 (Task 5), R3-6 (Task 6), R3-8 (Task 7).
- `ask`, decided by the person (Narrow the door) and built as a fix: R3-7 (Task 8).
- `decline`, no task: R3-5. The reason is under Declined in `shape.md`.
- No `defer`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Line numbers are at `dae81d4`, the PR head this round reviewed and the working tree's HEAD. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block. No commit subject holds a bare `@word`.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-13-1329-94-review-round-3/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds or changes a check does that first and sees it fail on a gate run (`.claude/redline/checks.sh <snapshot>` prints the failing check names). It then makes the change and sees it pass. A check that pins a neighbour (named in its task) is green before and after.

**Expected counts.** Before this round: loop `860 checks passed, 0 failed`, gh `136 passed, 0 failed`, guard `594 passed, 0 mismatched`, prefs `121`, gate `117`, setup `470`, background `39` (round 2's As built, `agent-os/specs/2026-11-13-1329-94-review-round-2/plan.md`, "Gate counts"). This round adds six `check()` calls to the loop test (Tasks 2, 3, 4 and 7, and two in Task 8) and one `samePrefix` check (Task 8), plus the run-record checks `go()` adds for Task 4's new run, which reaches its end, and for Task 8's two runs where they reach it. Task 6 changes two existing expectations and adds none. The other harnesses keep their counts, since none reads a file this round changes. The first green gate run's counts are the evidence, recorded under As built.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-13-1329-94-review-round-3/plan.md`
- `agent-os/specs/2026-11-13-1329-94-review-round-3/shape.md`
- `agent-os/specs/2026-11-13-1329-94-review-round-3/standards.md`
- `agent-os/specs/2026-11-13-1329-94-review-round-3/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 3 spec for PR #94 (#93)`

## Task 2: R3-2, neutralise the Would confirm line in the inline comment

`shape.md`, Decision 1.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`, right after the check `posted text: a Would confirm line goes through the same function` (line 1769), whose run is `coverage: the set-aside block escapes outside code spans` (line 1729, wouldConfirm `a <b> & c note from @param`), add:

```js
  // The inline comment's Would confirm line goes through postedText too (#94, R3-2).
  const wcPrompt = (pick(run.calls, 'post r1') || { prompt: '' }).prompt
  const wcAt = wcPrompt.indexOf('{\n  "body"')
  const wcComments = wcAt < 0 ? [] : JSON.parse(wcPrompt.slice(wcAt, wcPrompt.indexOf('\n}\n', wcAt) + 2)).comments || []
  check('posted text: the inline comment\'s Would confirm line goes through the same function as the body line', wcComments.some((c) => c.body.startsWith('**R1-1** · ') && c.body.includes('Could not confirm. Would confirm it: a &lt;b> &amp; c note from @' + WJ + 'param')) && !wcComments.some((c) => c.body.includes('note from @param')), wcComments)
```

Red: the comment carries `a <b> & c note from @param` raw.

**Change.** In `commentBody` (`workflows/redline-loop.js:1117`), replace

```js
    lines.push('', `Could not confirm. Would confirm it: ${(f.wouldConfirm || 'not stated').trim()}`)
```

with

```js
    lines.push('', `Could not confirm. Would confirm it: ${postedText((f.wouldConfirm || 'not stated').trim())}`)
```

and extend the comment above it (lines 1114-1115) with one sentence: `The Would confirm text is one of the verifier's short fields, so it goes through postedText here as on the body line (#94, R3-2).`

Neighbour, green before and after: `coverage: an unconfirmed finding that says nothing on what would confirm it is posted as not stated, with a warning` (line 1483), which reads `Could not confirm. Would confirm it: not stated` in the post prompt.

In `docs/running.md:203`, replace `in the review body;` at the end of the line `- the line saying what would confirm a finding the verifier could not confirm, in the review body;` with `in the review body and in its inline comment;`.

**Proof:** `grep -c "Would confirm it: .{postedText((f.wouldConfirm" workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — `docs/running.md`, "How the review is posted", the list under "What is escaped and neutralised (#87)", updated in this task's commit.

**Commit:** `redline: R3-2 neutralise the Would confirm line in the inline comment too (#93)`

## Task 3: R3-3, state the coverage-off condition wherever the decline reopen is stated

`shape.md`, Decision 2 and Unattended answer 2.

**Files:**

- `tests/loop-test.mjs`
- `agents/redline-reviewer.md`
- `README.md`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`, right after the check `coverage: the agent file says a declined finding is not raised again, except one declined for want of confirmation that the verifier now confirms` (line 1442), add:

```js
  // The reopen needs a coverage candidate; with none, a declined finding stays settled, as the
  // prompt's history header says under coverage off (#94, R3-3).
  check('coverage: the agent file says the decline reopen needs a coverage candidate, and that with no candidates a decline stays settled', reviewerAgent.includes('that you now confirm from a coverage candidate') && reviewerAgent.includes('With no candidates (a round launched with `coverage off`, or a final nit pass) there is no such exception'))
```

Red: neither phrase is in the agent file.

**Change.**

- `agents/redline-reviewer.md:22`. Replace the line

  ```
  A finding an earlier round declined, deferred or decided is not raised again, except one declined because it could not be confirmed that you now confirm, which "What is new" below treats as new.
  ```

  with

  ```
  A finding an earlier round declined, deferred or decided is not raised again, except one declined because it could not be confirmed that you now confirm from a coverage candidate, which "What is new" below treats as new. With no candidates (a round launched with `coverage off`, or a final nit pass) there is no such exception: every declined, deferred or decided finding the prompt lists stays settled, as the prompt's header says.
  ```

  The check at line 1442 (`is not raised again, except one declined because it could not be confirmed`) stays green: its phrase is unchanged.
- `README.md:103` (Known limits, "A decline is Redline's judgment"). Replace `which a later round raises as new once its verifier confirms it.` with:

  ```
  which a later round with the coverage pass raises as new once its verifier confirms it from a candidate; with `coverage off` it stays settled.
  ```
- `docs/running.md:45` ("Why it does not chase nits"). Replace `unless it was declined because it could not be confirmed and a later round's verifier confirms it.` with:

  ```
  unless it was declined because it could not be confirmed and a later round's verifier confirms it from a coverage candidate; with `coverage off` there is no candidate, and it stays settled.
  ```

The prompt is not changed. Neighbour, green before and after: `coverage: the history header carries the decline-reopen exception on a covered round, and a coverage off round keeps the header as before` (line 1443).

**Proof:**

- `grep -c "that you now confirm from a coverage candidate" agents/redline-reviewer.md` prints `1`.
- `grep -c "with .coverage off. it stays settled" README.md` prints `1`.
- `grep -c "with .coverage off. there is no candidate, and it stays settled" docs/running.md` prints `1`.

**Docs entry:** `agents/redline-reviewer.md` — README "Known limits", "A decline is Redline's judgment", and `docs/running.md`, "Rounds", step 7, "Why it does not chase nits", both updated in this task's commit.

**Commit:** `redline: R3-3 say the decline reopen needs a coverage candidate wherever it is stated (#93)`

## Task 4: R3-4, give a minted finding with no claim a title and a description

`shape.md`, Decision 3 and Unattended answer 3.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`, right after the check `coverage: a candidate with no file is minted at (no file), line 0, and its body line has a place` (line 1497), add a run and a check:

```js
  // A left-out candidate with neither a summary nor a scenario is kept with a title and a
  // description that say so, never an empty line or an empty bold title (#94, R3-4).
  const noClaim = fenced([{ file: 'app/x.php', line: 3, summary: 'the real one', failure_scenario: 'f' }, { file: 'app/x.php', line: 4 }])
  run = await go('coverage: a candidate with no claim', covArgs, { reviews: [[f('R1-1', 'correctness')], []], decline: ['R1-2'], secondLook: { 'R1-2': 'unconfirmed' }, commitIds: [['R1-1']], coverage: [noClaim, noClaim], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }], [{ index: 1, outcome: 'settled', ref: 'R1-1' }, { index: 2, outcome: 'settled', ref: 'R1-2' }]] })
  const ncPrompt = (pick(run.calls, 'post r1') || { prompt: '' }).prompt
  check('coverage: a left-out candidate with no summary and no scenario is minted with a title and a description that say so', ncPrompt !== '' && body(run.calls, 'post r1').includes('· unconfirmed · `app/x.php:4` · coverage candidate 2 (no summary given)') && ncPrompt.includes('The coverage pass gave this candidate no summary and no failure scenario; check the code at its place.') && !ncPrompt.includes('****'), body(run.calls, 'post r1'))
```

Red: the body line ends `` `app/x.php:4` · `` and the comment holds `****`.

**Change.** In `workflows/redline-loop.js`:

- Under `NO_FILE` (line 1522), add:

  ```js
  // A candidate the finder gave neither a summary nor a failure scenario is still kept, since
  // nothing is dropped (#93): its title and description say what it lacks, so its body line and
  // its inline comment are never empty (#94, R3-4).
  const MINTED_NO_CLAIM = 'The coverage pass gave this candidate no summary and no failure scenario; check the code at its place.'
  ```
- In the mint (lines 1580-1584), read the two fields once, before `out.findings.push`:

  ```js
    const summary = String(c.summary || '').replace(/\s+/g, ' ').trim()
    const scenario = String(c.failure_scenario || '').trim()
  ```

  and replace

  ```js
      title: String(c.summary || '').replace(/\s+/g, ' ').trim(), description: String(c.failure_scenario || '').trim(), proposedFix: '',
  ```

  with

  ```js
      title: summary || scenario.replace(/\s+/g, ' ') || `coverage candidate ${index} (no summary given)`, description: scenario || summary || MINTED_NO_CLAIM, proposedFix: '',
  ```

`coverageCandidates` is not changed. Neighbours, green before and after: `coverage: a candidate with no file is minted at (no file), line 0, and its body line has a place` (line 1497) and `coverage: each one goes to the shaper with a line on what would confirm it, is decided, and the next round collapses it as settled` (line 1478).

In `docs/running.md:69` ("Nothing leaves quietly"), after the sentence that ends `so a later run reads its line back.`, add: `One with neither a summary nor a failure scenario is kept with a title and a description that say so.`

**Proof:** `grep -c "MINTED_NO_CLAIM" workflows/redline-loop.js` prints `2`.

**Docs entry:** `workflows/redline-loop.js` — `docs/running.md`, "The coverage pass", "Nothing leaves quietly", updated in this task's commit.

**Commit:** `redline: R3-4 give a minted finding with no claim a title and a description that say so (#93)`

## Task 5: R3-1, say in the upgrade notes that an older reader cannot continue a 0.3.0 review

`shape.md`, Decision 4.

**Files:**

- `docs/upgrading.md`

**Change.** In `docs/upgrading.md`, insert a section between "## Unattended section versions (#15)" and "## What a template bump means":

```
## Two Redline versions on one pull request (0.3.0)

From 0.3.0 a review body writes `unconfirmed` as a finding's confidence word, and the tail of a finding a repository ask rule covers names the person by login (` · left to @<login> under rule <id>`). The `redline-gh.sh prior-findings` of an older release reads neither. It gives no line for an unconfirmed finding, so such a finding is neither carried nor settled, and a decline of one can be raised again as new. It also keeps the new rule tail in the finding's title and reads the rule reply as decided. Continue a pull request that a 0.3.0 run reviewed with 0.3.0 or later; 0.3.0 reads the older forms too.
```

No test: no harness reads `docs/upgrading.md`.

**Proof:** `grep -c "^## Two Redline versions on one pull request" docs/upgrading.md` prints `1`.

**Docs entry:** a change to `docs/` only; it is reader-facing by nature and needs no entry of its own (`agent-os/standards/process/docs-gate.md`).

**Commit:** `redline: R3-1 say a pull request a 0.3.0 run reviewed is continued with 0.3.0 or later (#93)`

## Task 6: R3-6, name the namespaced command in the posted overrule line

`shape.md`, Decision 5 and Unattended answer 4.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`, change the two expectations that quote the line:

- line 2297: `` then run `/redline-revise 114 review @author`. `` becomes `` then run `/redline:redline-revise 114 review @author`. ``
- line 2342: `` then run `/redline-revise 114 review @<your login>`. `` becomes `` then run `/redline:redline-revise 114 review @<your login>`. ``

Red: the guided layout check and `layout: with no login the person running Redline stands in everywhere, and the overrule line asks for a login` fail.

**Change.** In `handoffComment` (`workflows/redline-loop.js:3263`), in the overrule line, replace

```
then run \`/redline-revise ${pr} review
```

with

```
then run \`/redline:redline-revise ${pr} review
```

In `docs/running.md:114` ("Overruling a decline", "After the run, or for an earlier round"), replace `` then run `/redline-revise <pr> review @<login>`. `` with:

```
then run `/redline:redline-revise <pr> review @<login>` (or the short `/redline-revise` where the repository has the alias; the handoff comment names the namespaced form, which always works).
```

`skills/redline/SKILL.md:240` already names both forms and is not changed.

**Proof:** `grep -c "then run ./redline-revise" workflows/redline-loop.js` prints `0`, and `grep -c "then run ./redline:redline-revise" workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — `docs/running.md`, "Dispositions", "Overruling a decline", updated in this task's commit.

**Commit:** `redline: R3-6 name the namespaced revise command in the handoff's overrule line (#93)`

## Task 7: R3-8, return the scope-declined items apart and name them in the summaries

`shape.md`, Decision 6 and Unattended answer 5.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `skills/redline/SKILL.md`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`, right after the check `scope: a nit the verifier reports is declined by the scope and kept in the round` (line 442), add:

```js
  // The result lists what the scope declined apart, beside the round's findings, so the skill's
  // summaries can name it (#94, R3-8).
  check('scope: the result lists each round\'s scope-declined items under scoped, and findings keeps them', JSON.stringify(run.res.rounds.map((r) => (r.scoped || []).map((x) => x.id))) === '[["R1-2"],["R2-1"]]' && run.res.rounds[0].findings.length === 2, run.res.rounds.map((r) => [r.findings, r.scoped]))
```

Red: `scoped` is absent, so the list reads `[[],[]]`.

**Change.**

- `workflows/redline-loop.js`, in `result()`'s round entries, right after `findings: record.findings.map(compactFinding),` (line 2204), add:

  ```js
        // What the correctness-only scope declined in this round (#93). Those items stay in findings,
        // as the round's record keeps them, and are listed here apart so the skill's summaries can
        // name them (#94, R3-8).
        scoped: (record.scoped || []).map(compactFinding),
  ```
- `skills/redline/SKILL.md:170` (`review-only`). Replace `how many findings by category, the correctness ones by title` with:

  ```
  how many findings by category, not counting the round's `scoped` items (declined under the scope, `correctness only`), which you name in one line with their IDs, the correctness ones by title
  ```
- `skills/redline/SKILL.md:240` (`done`). After the sentence that ends with this text:

  ```
  (the namespaced `/redline:redline-revise` where the repository has no alias).
  ```

  insert, as the next sentence:

  ```
  When any round has `scoped` items (`rounds[].scoped`), one line names them, ID and title, as declined under this run's scope (correctness only), with no thread and no reply.
  ```
- `docs/running.md:116`. Replace `each with its id and reason, with one line on how to overrule one, so you do not have to open GitHub to learn what was declined.` with:

  ```
  each with its id and reason, with one line on how to overrule one, so you do not have to open GitHub to learn what was declined; under `correctness only` it also names, in one line, what the scope declined.
  ```

Neighbour, green before and after: `scope: the findings file keeps what the scope declined under scoped, apart from its findings` (line 441).

**Proof:** `grep -c "scoped: (record.scoped" workflows/redline-loop.js` prints `1`. `grep -c "rounds\[\]\.scoped" skills/redline/SKILL.md` prints `1`.

**Docs entries:**

- `workflows/redline-loop.js` — `docs/running.md`, "Overruling a decline", the closing-summary paragraph, updated in this task's commit. The result's new field is read by the skill only, and no doc lists the result's round fields.
- `skills/redline/SKILL.md` — the same paragraph of `docs/running.md`, updated in this task's commit.

**Commit:** `redline: R3-8 return the scope-declined items apart and name them in the summaries (#93)`

## Task 8: R3-7, offer the round's declines only at a stop no plan approver of the round has run before

`shape.md`, Decision 8 (decided by @michaelfromtheoutfit on 2026-11-14: Narrow the door) and Unattended answer 6. Run it after Task 3, which edits the same README line at another phrase.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `skills/redline/SKILL.md`
- `docs/running.md`
- `README.md`

**Test first.** In `tests/loop-test.mjs`, right after the check `overrule: a second decisions stop leaves out a decline the person already overruled` (line 2267), add a stop, its relaunch and two checks:

```js
  // A stop after a plan approver of the round has run (a reshape's) lists no declines and names
  // them for the after-run door, since the round's first resolve, which applies an overrule, ran
  // before it; the relaunch then replays to the stop and the answer reaches the reshape's resolve
  // (#94, R3-7).
  const late = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], decline: ['R1-2'], planBounce: 1, reshapeAsk: ['R1-1'], commitIds: [['R1-1']] }
  const lateStop = await go('overrule: a reshape stop', baseArgs, late)
  check('overrule: a reshape\'s decisions stop lists no declines and names them for after the run', lateStop.res.status === 'handoff' && lateStop.res.handoffKind === 'decisions' && JSON.stringify(lateStop.res.decisionsNeeded) === '["R1-1"]' && JSON.stringify(lateStop.res.declined) === '[]' && JSON.stringify(lateStop.res.declinedAfterRun) === '["R1-2"]', [lateStop.res.status, lateStop.res.handoffKind, lateStop.res.decisionsNeeded, lateStop.res.declined, lateStop.res.declinedAfterRun])
  const lateRun = await go('overrule: a reshape stop answered', { ...baseArgs, decisions: { 'R1-1': { choice: 'Keep it', notes: 'Kept as it is after the reshape.', date: '2026-11-14' } } }, late)
  samePrefix('overrule: the relaunch from a reshape stop', lateStop.calls, lateRun.calls, lateStop.calls.length)
  check('overrule: the answer typed at a reshape stop reaches the reshape\'s resolve, and the first resolve does not run', Boolean(pick(lateRun.calls, 'resolve r1 #1')) && pick(lateRun.calls, 'resolve r1 #1').prompt.includes('Kept as it is after the reshape.') && !pick(lateRun.calls, 'resolve r1'), labels(lateRun.calls))
```

Red: the stop's `declined` holds R1-2 and `declinedAfterRun` is absent. The relaunch's `samePrefix` and the second check are neighbours, green before and after: they pin that a reshape stop answered with no overrule replays and applies the answer. Neighbours too, green before and after: `overrule: a decisions hand-off carries the round's declines with their reasons` (line 2265), the first shape's stop, which keeps the list, and `overrule: a second decisions stop leaves out a decline the person already overruled` (line 2267), a first resolve's unresolved stop, which keeps it too.

**Change.** In `workflows/redline-loop.js`:

- In `resolveWith`'s hand-off (line 2933, `return { handoff: true, kind: 'decisions', pending: newCalls.filter((call) => ids.includes(call.id)), calls, unresolved: out.unresolved, shaped }`), add `afterApproval: suffix !== ''` to the object: a non-empty suffix is a reshape's resolve, which runs after a plan approver.
- In the reshape's hand-off (line 2990, `return { handoff: true, kind: 'decisions', pending: raised.filter((call) => !decisions[call.id]), calls: shaped.judgmentCalls, shaped }`), add `afterApproval: true` to the object.
- In `handoffResult`'s decisions result (line 3661), compute the round's declines once, right after the `log(` line that ends `the run ends here and resumes on relaunch\`)` above `return result('handoff', {`:

  ```js
    const roundDeclines = (outcome.shaped ? outcome.shaped.findings : []).filter((x) => x.disposition === 'decline' && !(decisions[x.id] && decisions[x.id].disposition)).map((x) => ({ id: x.id, title: findingOf(x.id).title || '', reason: (x.reason || '').trim() }))
  ```

  and replace the `declined: (outcome.shaped ? ...` line with

  ```js
      // At a stop a plan approver of the round has run before (a reshape's, or its resolve's), an
      // overrule would be applied at the round's first resolve, which ran before the stop, so the
      // relaunch would change earlier prompts and could lose the answer to the new call. Such a
      // stop lists no declines, and declinedAfterRun names them for the after-run door: a reply in
      // the thread and the human review pass (#94, R3-7).
      declined: outcome.afterApproval ? [] : roundDeclines,
      declinedAfterRun: outcome.afterApproval ? roundDeclines.map((x) => x.id) : [],
  ```

  Keep the comment above the old line (`What the shaper declined on its own in this round (#93) ...`), which still holds for `declined`.

In `skills/redline/SKILL.md:208` ("The round's declines."), after the sentence `` `declined` lists what the shaper declined on its own in this round, each with its `reason` (empty when it declined nothing). `` insert:

```
At a stop the round reaches after its plan approver has run (a reshape's), `declined` is empty and `declinedAfterRun` lists the IDs of the round's declines: when it is not empty, say in one line that those declines are overruled after the run, by a reply in the decline's thread and the human review pass (`/redline:redline-revise <pr> review @<login>`), and record no typed overrule of one at this stop, since the round's first resolve, which ran before it, is where an overrule is applied.
```

In `docs/running.md:113` ("Overruling a decline", the first door), after the sentence that ends `` overrules one before you type `relaunch`. `` insert:

```
This holds at a stop the round reaches before its plan approver has run. A stop after the approver bounced the plan (the reshape raised a new call, or its resolve could not apply an answer) lists no declines: the skill says in one line that the round's declines are overruled after the run, by the second door, since an overrule is applied at the round's first resolve, which ran before that stop, and the relaunch could otherwise lose your other answer.
```

In `docs/running.md:122` (`guided`), replace `` After the calls the skill lists what the shaper declined in that round, each with its reason, and a line `<id>: fix. <reason>` overrules one (see "Overruling a decline"). `` with:

```
After the calls the skill lists what the shaper declined in that round, each with its reason, and a line `<id>: fix. <reason>` overrules one, at a stop before the round's plan approver has run (see "Overruling a decline").
```

In `README.md:48` (the `guided` row), replace `` The skill then lists what Redline declined in that round, and a line `<id>: fix. <reason>` overrules one. `` with:

```
The skill then lists what Redline declined in that round, and a line `<id>: fix. <reason>` overrules one (at a stop after the round's plan approver has run, it says to overrule one after the run instead).
```

In `README.md:103` (Known limits, "A decline is Redline's judgment"), replace `or a typed line at a stop the run already makes (` with:

```
or a typed line at a stop the run already makes before the round's plan approver has run (
```

**Proof:**

- `grep -c "declinedAfterRun" workflows/redline-loop.js` prints `2`.
- `grep -c "afterApproval" workflows/redline-loop.js` prints `4`.
- `grep -c "declinedAfterRun" skills/redline/SKILL.md` prints `1`.
- `grep -c "lists no declines" docs/running.md` prints `1`.

**Docs entries:**

- `workflows/redline-loop.js` — `docs/running.md`, "Overruling a decline" and "Hand-off and relaunch", `guided`, and the README's `guided` row and Known limits, "A decline is Redline's judgment", updated in this task's commit. The hand-off's new field is read by the skill only.
- `skills/redline/SKILL.md` — the same `docs/running.md` paragraphs, updated in this task's commit.

**Commit:** `redline: R3-7 offer a round's declines only at a stop before its plan approver ran (#93)`

### The judgment call as the shaper put it (the record of what the person saw)

**What happens.** A guided or plan run's plan approver bounces once. The reshape raises a new judgment call, so the round stops again while it holds a decline. The skill lists that decline, and the person types `R1-5: fix. ...` beside the answer to the new call. On the relaunch the overrule is applied at the round's first resolve, which ran before that stop (`workflows/redline-loop.js:2904-2905`). So the first resolve and the first plan approver run with new prompts instead of replaying. If the approver now approves, no reshape runs, and the answer to the new call reaches no resolve: that finding keeps the first shaper's disposition, with nothing said. This breaks `agent-os/standards/workflow/replay.md:6`.

**Options.**

1. **Narrow the door** (recommended). Offer the round's declines only at a stop that no plan approver of the round has run before: the first shape's stop, the first resolve's unresolved stop, and the plan dial. At a reshape's stop, or its resolve's, `handoffResult` passes `declined: []`. The skill and `docs/running.md` ("Overruling a decline") say that such a decline is overruled on GitHub after the run: a reply in its thread, then the human review pass. A loop check covers a reshape stop whose `declined` is empty. A second check relaunches it with the new call answered: `samePrefix` holds to the stop, and `resolve r1 #1`'s prompt carries the answer.
   - Cost: a condition in `handoffResult` or at its two reshape call sites, one sentence each in `skills/redline/SKILL.md` and `docs/running.md`, two loop checks.
   - Effect: the #93 spec's decision 7 door ("a typed line at a stop the run already makes in that round") closes at a reshape's stop, a rare one. The after-run door stays.
   - Files: `workflows/redline-loop.js`, `skills/redline/SKILL.md`, `docs/running.md`, `tests/loop-test.mjs`.
2. **Keep the door.** The decisions hand-off names its stop (for example `stop: "reshape r1 #1"`). The skill records an overrule typed there with that stop. `overridesFor` leaves such an overrule out of the first resolve, and the reshape's `resolveWith` applies it after that stop. The same two loop checks, plus one where the overrule reaches the reshape's resolve and not the first.
   - Cost: a new field in the decisions record, which the skill writes and the workflow reads. Edits to `skills/redline/SKILL.md` (where it records an overrule), `docs/contract.md` or `docs/running.md`, and the relaunch note in `result()`, plus three loop checks.
   - Effect: every stop keeps the in-session overrule that decision 7 promises.
   - Files: `workflows/redline-loop.js`, `skills/redline/SKILL.md`, `docs/running.md`, `docs/contract.md`, `tests/loop-test.mjs`.
3. **Accept.** Leave the code as it is, and add a line under README Known limits.
   - Cost: one line.
   - Effect: in that rare path the relaunch can still drop the person's answer to the reshape's call, with nothing said.

## Task 9: Verification Gate

**Files:**

- `agent-os/specs/2026-11-13-1329-94-review-round-3/plan.md` and `agent-os/specs/2026-11-13-1329-94-review-round-3/shape.md` (step 13, and step 12 if nothing is approved).
- Standards, only those the standards approver approves from `shape.md`'s "Standards retrospective (proposed)":
  - `agent-os/standards/workflow/agents.md` (items 1 to 4).
  - `agent-os/standards/workflow/agents.md` and `agent-os/standards/workflow/replay.md` (item 5, drafted for R3-7 as decided).

1. **Steps 1 to 9:** run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-13-1329-94-review-round-3/redline/snapshot.json` until it exits 0; its JSON is the evidence. Expected:
   - loop at its count before the round plus what Tasks 2, 3, 4, 7 and 8 add (see Expected counts above);
   - guard `594 passed, 0 mismatched`;
   - gh, prefs, gate, setup and background at their counts before the round, since none reads a file this round changes.
2. **Step 10, Docs:** as each task's Docs entry says. Every touched file under `agents/`, `skills/` and `workflows/` has its entry, and each names this round's commit for it or "no reader-facing change" with its reason. No new config key, subcommand, allow rule or exit code.
3. **Step 11, Version:** `0.3.0` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged by this round. `main` carries `0.2.4`, so this PR already has its bump, and this round changes nothing a setup rerun writes (`shape.md`, Decision 9). The setup test's last cases prove the two versions agree.
4. **Step 12, Standards retrospective:** apply the items the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", as drafted there.
   - If the approver approves none, make no standards commit, and add "Standards retrospective: no changes" under Decisions in this folder's `shape.md`.
   - If it approves any, the edits go in one commit of their own after the finding commits: `redline: record the round 3 review lessons in the standards (#93)`. `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` then prints `0`, so no heading moved.
5. **Step 13, Spec folder:** add an "As built" section to this file. It records:
   - each task's commit;
   - each task's red run (the failing check names) and its green run;
   - the gate's counts;
   - the retrospective's outcome;
   - how R3-7 was decided and built.

   A deviation from this plan is also recorded under Decisions in `shape.md`. This lands in the round's last commit.

**Commit:** `redline: record PR #94 round 3 as built (#93)`

## As built

Built on `refactor/93-...` from `dae81d4`, one commit per task, every file staged by name.

| Task | Finding | Commit | Red run (failing checks) | Green run |
|---|---|---|---|---|
| 1 | spec | `fdb73fd` | n/a | n/a |
| 2 | R3-2 | `c3a484a` | loop `860 checks passed, 1 failed`: `posted text: the inline comment's Would confirm line goes through the same function as the body line` (the comment ended `a <b> & c note from @param`) | loop `861 checks passed, 1 failed`, the one failure being Task 3's new check |
| 3 | R3-3 | `b251c8c` | loop `861 checks passed, 1 failed`: `coverage: the agent file says the decline reopen needs a coverage candidate, and that with no candidates a decline stays settled` | loop `863 checks passed, 1 failed`, the one failure being Task 4's new check |
| 4 | R3-4 | `f66e716` | loop `863 checks passed, 1 failed`: `coverage: a left-out candidate with no summary and no scenario is minted with a title and a description that say so` | loop `864 checks passed, 0 failed` |
| 5 | R3-1 | `2607cbd` | no test (no harness reads `docs/upgrading.md`) | n/a |
| 6 | R3-6 | `a5f85a0` | loop `862 checks passed, 2 failed`: `layout: the handoff, every heading in order with its line, is the layout the spec shows`, `layout: with no login the person running Redline stands in everywhere, and the overrule line asks for a login` | loop `864 checks passed, 1 failed`, the one failure being Task 7's new check |
| 7 | R3-8 | `9a30fcc` | loop `864 checks passed, 1 failed`: `scope: the result lists each round's scope-declined items under scoped, and findings keeps them` (`scoped` absent) | loop `865 checks passed, 0 failed` |
| 8 | R3-7 (decided: Narrow the door) | `b7e71f2` | loop `868 checks passed, 1 failed`: `overrule: a reshape's decisions stop lists no declines and names them for after the run` (`declined` held R1-2, `declinedAfterRun` absent); the relaunch's `samePrefix` and `the answer typed at a reshape stop reaches the reshape's resolve` green, as planned | loop `869 checks passed, 0 failed` |
| 9 | standards | `70b5db5` | n/a | `git diff HEAD~1 -- agent-os/standards/ \| grep -c "^[-+]#"` prints `0` |

- **Proofs.** Task 2 `1`; Task 3 `1`, `1`, `1`; Task 4 `2`; Task 5 `1`; Task 7 `1`, `1`; Task 8 `2`, `4`, `1`, `1`, all as planned. Task 6: see the deviation below.
- **Gate counts** (the final run, recorded in the gate's JSON): loop `869 checks passed, 0 failed` (860 + the six new checks + one `samePrefix` + two run-record checks, from Task 4's run and Task 8's answered relaunch); gh `136 passed, 0 failed`; guard `594 passed, 0 mismatched`; prefs `121`, gate `117`, setup `470`, background `39`, as before the round. Every check exits 0, and `git.unexpected_files` and `git.uncommitted` are empty.
- **R3-7.** Put to the person as a spec assumption and decided by @michaelfromtheoutfit on 2026-11-14 as Narrow the door (`shape.md`, Decision 8). Built as Task 8 planned: `resolveWith`'s hand-off carries `afterApproval: suffix !== ''`, the reshape's hand-off `afterApproval: true`, and `handoffResult` passes `declined: []` with `declinedAfterRun` naming the round's declines at such a stop. The first shape's stop and the first resolve's unresolved stop keep their lists (the two neighbour checks stayed green).
- **Standards retrospective.** All six approved edits applied as drafted, in `70b5db5`: five in `agent-os/standards/workflow/agents.md` (lines 11, 16, 17 and 38, and the new bullet after 17), one in `agent-os/standards/workflow/replay.md` (line 6). None carries part of a finding's fix, so the commit names no finding.
- **Deviation, Task 6 proof.** The plan's greps, `then run ./redline-revise` and `then run ./redline:redline-revise`, allow one character between `run ` and `/`, but the template literal holds an escaped backtick (two characters), so both print `0` whatever the line says. With two dots they print `0` and `1`, which is the proof the plan meant. The change is as planned.
- **Order, Tasks 2, 3 and 6.** Each was committed after its proof and before its green gate run, and its green run is the next task's red run, in which that task's check passed and only the next task's new check failed. Tasks 4, 7 and 8 saw their green run before the commit.
