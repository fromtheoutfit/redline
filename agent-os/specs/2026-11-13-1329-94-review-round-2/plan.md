# PR #94 review round 2: the read-back, accounting, outcome and handoff fixes the second review found

Spec folder: `agent-os/specs/2026-11-13-1329-94-review-round-2/`

Shaped by Redline in unattended mode, for review round 2 of PR #94 (issue #93), from the round's fifteen findings (`redline/round-2-review.json`, `redline/round-2-findings.json`).

- `fix`, one task each, in finding order: R2-1 (Task 2), R2-5 (Task 3), R2-6 (Task 4), R2-10 (Task 5), R2-11 (Task 6), R2-2 (Task 8), R2-3 (Task 9), R2-7 (Task 10), R2-8 (Task 11), R2-9 (Task 12), R2-13 (Task 13), R2-14 (Task 14), R2-15 (Task 15).
- `defer`, its mitigation as a task: R2-12 (Task 7). The full fix is under Deferred in `shape.md`.
- `decline`, no task: R2-4. The reason is under Declined in `shape.md`.
- No `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Line numbers are at `e788107`, the PR head this round reviewed and the working tree's HEAD; each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block. No commit subject holds a bare `@word`.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-13-1329-94-review-round-2/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds a check adds it first and sees it fail on a gate run (`.claude/redline/checks.sh <snapshot>` prints the failing check names), then makes the change and sees it pass. A refactor (Tasks 11 and 13) is green before and after, with every existing check unchanged. A check that pins a neighbour (named in its task) is green before and after.

**Expected counts.** Before this round: loop `841 checks passed, 0 failed`, gh `133 passed, 0 failed`, guard `594 passed, 0 mismatched`, prefs `121`, gate `117`, setup `470`, background `39` (round 1's As built, `agent-os/specs/2026-11-13-1329-94-review-round-1/plan.md:590`). This round adds thirteen `check()` calls to the loop test (Tasks 3, 4, 5, 6, 7 (two), 8, 9 (two), 10, 12 (two) and 15), plus the run-record checks `go()` adds for each new run that reaches its handoff, and three cases to the gh test (Tasks 2 and 4, so `136 passed`). The other harnesses keep their counts: none reads a file this round changes. The first green gate run's counts are the evidence, recorded under As built.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-13-1329-94-review-round-2/plan.md`
- `agent-os/specs/2026-11-13-1329-94-review-round-2/shape.md`
- `agent-os/specs/2026-11-13-1329-94-review-round-2/standards.md`
- `agent-os/specs/2026-11-13-1329-94-review-round-2/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 2 spec for PR #94 (#93)`

## Task 2: R2-1, read back a login with an underscore in prior-findings

`shape.md`, Decision 1.

**Files:**

- `tests/gh-fixtures/reviews-18.json` (new)
- `tests/gh-fixtures/comments-18.json` (new)
- `tests/gh-fixtures/issue-comments-18.json` (new)
- `tests/gh-test.sh`
- `scripts/redline-gh.sh`

**Test first.** A PR 18 fixture, wired like PR 17:

- `reviews-18.json`: one review, id `60`, user login `octo_acme`, state `COMMENTED`, `submitted_at` `2026-11-13T10:00:00Z`, whose body is `Redline round 1`, a blank line, `Reviewed the whole pull request.`, a blank line, `One item.`, a blank line, `### Correctness (1)`, a blank line, and one finding line:

  ```
  - **R1-1** · correctness · medium · confirmed · `config/project/project.yaml:3` · Field handle renamed · left to @octo_acme under rule craft-config
  ```

  then a blank line and the closing sentence PR 17's body ends with.
- `comments-18.json`: its root inline comment (id `1801`, `pull_request_review_id` `60`, user `octo_acme`, path `config/project/project.yaml`, line `3`, side `RIGHT`, `in_reply_to_id` null, body opening `**R1-1** · correctness · medium · confirmed`) and one Redline reply in its thread (id `1811`, `in_reply_to_id` `1801`, `pull_request_review_id` `61`, created later), whose body is:

  ```
  Redline round 1: left to @octo_acme under repository rule craft-config (Craft project config is applied through the control panel). No change made; @octo_acme makes it. · decided by: @octo_acme
  ```

- `issue-comments-18.json`: `[]`.
- `tests/gh-test.sh`: copy the three files where PR 17's are copied (the `cp` line, line 62) and route PR 18's three endpoints in the fake `gh` as PR 17's are (lines 147-149).

Two cases after the PR 17 cases (line 281), under a comment naming #94, R2-1 (an Enterprise Managed User login is `<handle>_<shortcode>`):

- `underscore login: the rule tail of a login with an underscore is stripped from the title`: `jq -r '.[0].title'` of `prior-findings 18` is `Field handle renamed`.
- `underscore login: its left to @login reply is left`: `jq -r '.[0].disposition'` is `left`.

Both fail before the change (the title keeps the tail; the reply reads `decided`).

**Change, `scripts/redline-gh.sh`.** In `classify` (line 358) and in the title capture's rule alternative (line 365), `@[A-Za-z0-9-]+` becomes `@[A-Za-z0-9_-]+`. Extend the comment above `classify` (lines 344-349) with one sentence, worded with no apostrophe since it sits inside the single-quoted jq program: "A login may hold an underscore, as an Enterprise Managed User login does (#94, R2-1)."

**Proof.** `grep -c "A-Za-z0-9_-" scripts/redline-gh.sh` prints `2`. `grep -c "@\[A-Za-z0-9-\]" scripts/redline-gh.sh` prints `0`.

**Docs entry:** `scripts/redline-gh.sh`: no reader-facing change; the header (line 35) and its copy in `docs/scripts.md` already say `<person> is @<login>`, and a login with an underscore is one. No new subcommand, so no guard group changes.

**Commit:** `redline: R2-1 read back a login with an underscore in prior-findings (#93)`

## Task 3: R2-5, read a verified or unconfirmed ref by its leading id

`shape.md`, Decision 2.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first (`tests/loop-test.mjs`, section 15).** Right after the `coverage: a renamed finding keeps its accounting` check (line 1476), where `two` and `settledAll` are in scope, add one run and one check:

```js
  // A verified or unconfirmed ref with a note after the id still names that finding: it is read by
  // its leading id with a warning, so the note never mints a second finding (#94, R2-5).
  run = await go('coverage: a verified ref with a note after the id', covArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1 (the guard)' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], settledAll] })
  check('coverage: a ref with a note after the id counts as that finding and mints nothing', run.res.rounds[0].findings.length === 1 && run.res.rounds[0].coverage.counts.verified === 1 && run.res.rounds[0].coverage.counts.unconfirmed === 0 && run.res.rounds[0].coverage.accounting.map((e) => `${e.index}:${e.outcome}:${e.ref}`)[0] === '1:verified:R1-1' && run.res.warnings.some((w) => w.includes('with ref "R1-1 (the guard)"') && w.includes('read as R1-1')), [run.res.rounds[0].findings.map((x) => x.id), run.res.rounds[0].coverage, run.res.warnings])
```

It fails before the change (R1-2 is minted). The `coverage: accounting` run's `R9-9` ref (line 1461), whose leading token names no finding, is the neighbour: it still mints, and its checks (lines 1462-1465) stay as they are.

**Change, `workflows/redline-loop.js`, `accountCoverage`, the `LISTED_ELSEWHERE` branch (lines 1536-1551).** Replace

```js
      const finding = byId.get(ref)
```

with

```js
      // The ref is the finding's id alone, as the accounting sentence asks; a note after the id is
      // read past, by its leading id, with a warning, so it never mints a second finding for a
      // candidate already reported (#94, R2-5). A leading token that names no finding is a bad ref.
      const id = (/^(R\d+-\d+)(?![\w-])/.exec(ref) || [])[1] || ref
      const finding = byId.get(id)
      if (finding && id !== ref) {
        warnings.push(`round ${round}: the reviewer accounted for coverage candidate ${index} as ${entry.outcome} with ref ${JSON.stringify(ref)}; read as ${id}, the finding its leading id names`)
      }
```

and in the same branch's last `seen.set`, `ref` becomes `id`:

```js
      seen.set(index, { index, outcome: own, ref: id })
```

The miss branch keeps `ref` in its warning, so the bad ref is shown as written.

**Change, `docs/running.md` line 69** ("Nothing leaves quietly."). After "The shaper's second look then decides it.", add: "A ref that opens with a finding's id and adds a note after it names that finding, with a warning."

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "The coverage pass" ("Nothing leaves quietly", line 69), updated in this task's commit.

**Commit:** `redline: R2-5 read a verified or unconfirmed coverage ref by its leading id (#93)`

## Task 4: R2-6, mint a candidate with no file at a place prior-findings reads back

`shape.md`, Decision 3.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `tests/gh-fixtures/reviews-18.json`
- `tests/gh-test.sh`
- `docs/running.md`

**Test first (`tests/loop-test.mjs`, section 15).** Right after Task 3's check:

```js
  // A candidate with no file is minted at a place prior-findings reads back (#94, R2-6).
  const noPlace = fenced([{ summary: 'no place', failure_scenario: 'f' }])
  run = await go('coverage: a candidate with no file', covArgs, { reviews: [[f('R1-1', 'correctness')], []], decline: ['R1-2'], secondLook: { 'R1-2': 'unconfirmed' }, commitIds: [['R1-1']], coverage: [noPlace, noPlace], coverageOut: [[], [{ index: 1, outcome: 'settled', ref: 'R1-2' }]] })
  check('coverage: a candidate with no file is minted at (no file), line 0, and its body line has a place', body(run.calls, 'post r1').includes('· unconfirmed · `(no file):0` · no place') && !body(run.calls, 'post r1').includes('`:0`'), body(run.calls, 'post r1'))
```

It fails before the change (the line reads `` `:0` ``).

**Test (`tests/gh-test.sh`, PR 18).** In `reviews-18.json`, the body gains a second heading and line after the Correctness line, before the closing sentence, and `One item.` becomes `Two items.`:

```
### Could not confirm (1)

- **R1-2** · correctness · medium · unconfirmed · `(no file):0` · A candidate with no place
  Would confirm it: The verifier gave no account of this candidate; check the claim as the finder made it.
```

One case after Task 2's: `no file: a finding minted with no file reads back at (no file), line 0`: `jq -c '.[1] | [.id, .file, .line, .confidence]'` of `prior-findings 18` is `["R1-2","(no file)",0,"unconfirmed"]`. It passes once the fixture line exists, since the reader already takes any text before the colon; it pins the placeholder the loop check above writes. Task 2's two cases stay as they are.

**Change, `workflows/redline-loop.js`.** After `MINTED_WOULD_CONFIRM` (line 1515), add

```js
// The place of a minted finding whose candidate named no file (#94, R2-6): prior-findings reads a
// body line back only with text before the colon, so `:0` would leave it neither carried nor
// settled. The post script moves its comment into the review body, as it does any path in no hunk.
const NO_FILE = '(no file)'
```

In the fill loop (lines 1556-1571), the warning's `(${c.file}:${c.line})` becomes `(${c.file || NO_FILE}:${c.line})`, and the minted finding's `file: c.file` becomes `file: c.file || NO_FILE`.

**Change, `docs/running.md` line 69.** After Task 3's sentence, add: "A candidate that names no file is kept at `(no file)`, line 0, so a later run reads its line back."

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "The coverage pass" (line 69), updated in this task's commit.

**Commit:** `redline: R2-6 mint a candidate with no file at a place prior-findings reads back (#93)`

## Task 5: R2-10, do not call an accept that keeps a decline an overrule

`shape.md`, Decision 4.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first (`tests/loop-test.mjs`, section 3).** Right after the `plan: handoff comment names the approvals` check (line 376), where `scenario` and `round1` are in scope:

```js
  // An accept that keeps a decline is the person's decision, put to them on the plan dial, and no
  // overrule; an accept on a fix still is one (the check above) (#94, R2-10).
  const keptDecline = await go('plan: an accept that keeps a decline', { ...round1, approvedPlans: [1, 2] }, { ...scenario, decline: ['R1-1'] })
  const keptHandoff = comment(keptDecline.calls, 'handoff comment')
  check('plan: an accept that keeps a decline is listed as put to the person, never as overruled', keptDecline.res.status === 'done' && keptHandoff.includes('- Round 1 (pr): 2 items: 2 put to @author;') && !keptHandoff.includes('### Overruled by') && (keptDecline.res.decided || []).some((d) => d.id === 'R1-1' && d.overruled === false && d.kind === 'decided'), [keptDecline.res.status, keptHandoff, keptDecline.res.decided])
```

It fails before the change (`1 put to @author, 1 overruled by @author`). The check above it, an accept on a fix, is the neighbour: it still reads `1 overruled by @author`.

**Change, `workflows/redline-loop.js`, `revise()`.** Right before the `for (const f of inScope)` loop that pushes to `decidedAll` (line 3099), add

```js
  // The shaper's own disposition of each item, before any override: `overruled` and `bought` read
  // it. An accept that keeps a decline changes nothing Redline does, so it is the person's decision
  // on what the plan dial showed them, never an overrule: only a decline changed to fix or defer is
  // overruled (skills/redline/SKILL.md, the plan dial; #94, R2-10).
  const shaperOwn = Object.fromEntries(shaped.findings.map((s) => [s.id, s.disposition]))
  const keptDecline = (id) => shaperOwn[id] === 'decline' && Boolean(roundDecisions[id]) && roundDecisions[id].disposition === 'accept'
```

In that loop's push (line 3102), `overruled: outcomes[f.id].kind === 'decided' && !calls.some((call) => call.id === f.id)` becomes `overruled: outcomes[f.id].kind === 'decided' && !calls.some((call) => call.id === f.id) && !keptDecline(f.id)`. Remove the later `const shaperOwn = ...` line (line 3125); `bought` reads the one defined above.

**Change, `docs/running.md`.** Line 148 (`### Put to @<login> (n)`): after "the judgment calls you answered", insert ", and a decline you kept on the plan dial with `accept` and your reason". Line 149 (`### Overruled by @<login> (n)`): after "a decline you overruled included", insert " (an `accept` that keeps a decline is not an overrule)".

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "The handoff comment" (lines 148-149), updated in this task's commit. `skills/redline/SKILL.md` already says only a change to fix or defer overrules a decline, and its closing summary reads `overruled`, so it is unchanged.

**Commit:** `redline: R2-10 list an accept that keeps a decline as put to the person, not overruled (#93)`

## Task 6: R2-11, let a call put to the person buy the round when a reshape re-sorts its finding

`shape.md`, Decision 5.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first (`tests/loop-test.mjs`).** In the shaper mock's `disposition` function (line 175), add a reshape key before the others, so a reshape can decline an id:

```js
      const disposition = (id) => (onReshape('reshapeDecline').includes(id) ? 'decline' : onReshape('reshapeFix').includes(id) ? 'fix' : ask.includes(id) || onReshape('reshapeAsk').includes(id) ? 'ask' : defer.includes(id) ? 'defer' : decline.includes(id) ? 'decline' : none.includes(id) ? 'none' : 'fix')
```

and extend the comment above `reshape` (lines 170-172) with "or declines (reshapeDecline)". A declined id gets the mock's default reason, as any decline does. No other scenario sets the key, so every other run is unchanged.

Then in section 19, right after the `done: a final nit pass whose two items were both fixed says so in the plural` check (line 2187):

```js
  // A correctness item put to the person buys the round even when a reshape re-sorts it to a
  // decline afterwards: the call was asked (#94, R2-11). Coverage off, so the next round is a
  // re-review of the fix diff rather than a final nit pass.
  run = await go('done: an answered ask a reshape declines still buys the round', { ...baseArgs, decisions: { 'R1-2': { choice: 'Keep it', notes: 'Kept as it is, on purpose.', date: '2026-11-13' } } }, { reviews: [[f('R1-1', 'nit'), f('R1-2', 'correctness')], []], ask: ['R1-2'], planBounce: 1, reshapeDecline: ['R1-2'], reshapeOmitCall: ['R1-2'], commitIds: [['R1-1'], []] })
  check('done: an answered correctness ask that a reshape re-sorts to a decline still buys the next round', labels(run.calls).includes('reshape r1 #1') && labels(run.calls).includes('re-review r2') && !labels(run.calls).includes('final nit pass r2'), labels(run.calls))
```

It fails before the change (the run goes to `final nit pass r2`).

**Change, `workflows/redline-loop.js`, `bought` (line 3127).**

```js
  const bought = inScope.some((f) => f.category === 'correctness' && (calls.some((call) => call.id === f.id) || ['fix', 'defer', 'ask'].includes(shaperOwn[f.id]) || ['fix', 'defer'].includes(finalOwn[f.id])))
```

Add to the done-rule comment above it (lines 3119-3124): "A call stays in `calls` when a reshape re-sorts its finding, so an item put to the person buys the round whatever the reshape returned (#94, R2-11)."

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `docs/running.md:43` already says an item put to the person buys the next round whatever was answered.

**Commit:** `redline: R2-11 let a call put to the person buy the round when a reshape re-sorts its finding (#93)`

## Task 7: R2-12 (defer), never count a declined item as fixed

`shape.md`, Decision 6; the full fix is under Deferred.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first (`tests/loop-test.mjs`, section 19).** Right after Task 6's check, where `nitThen` and `covArgs` are in scope:

```js
  // A commit that mentions a declined item never makes the sentence call it fixed (#94, R2-12).
  run = await go('done: the final nit pass, a declined item a commit mentions', covArgs, nitThen({ decline: ['R2-2'], commitIds: [['R1-1'], ['redline: R2-1 guard the loop; R2-2 needs no change']] }))
  check('done: a commit that mentions a declined item does not count it fixed in the final nit pass sentence', comment(run.calls, 'handoff comment').includes('The final nit pass found 2 correctness items in the nit fixes: 1 fixed in one more pass, which was not re-reviewed (please look at that commit first); 1 not changed, listed below. '), comment(run.calls, 'handoff comment').slice(0, 400))
  // The neighbour: a deferral's mitigation commit is still counted, so it is flagged for a look.
  // The sentence still calls it fixed; naming it apart is R2-12's deferred full fix.
  run = await go('done: the final nit pass, one deferred with its mitigation', covArgs, nitThen({ defer: ['R2-1'], commitIds: [['R1-1'], ['R2-1', 'R2-2']] }))
  check('done: a final nit pass deferral\'s mitigation commit is still flagged as unreviewed', run.res.status === 'done' && run.res.lastFixUnreviewed === true && comment(run.calls, 'handoff comment').includes('### Deferred (mitigated now, full fix left open)\n\n- **R2-1** '), [run.res.status, run.res.lastFixUnreviewed, comment(run.calls, 'handoff comment')])
```

The first fails before the change (the sentence reads "2 correctness bugs ... they were fixed"); the second is the neighbour, green before and after.

**Change, `workflows/redline-loop.js`, `fixed` (line 3128).**

```js
  const fixed = inScope.filter((f) => !['declined', 'none'].includes(outcomes[f.id].kind) && outcomes[f.id].commits.length > 0).map((f) => f.id)
```

In the done-rule comment above it, replace "`fixed` is the items a commit names: the round's spec and standards commits are no fix diff." with:

```
// `fixed` is the items a commit names, never a declined item or a none, whose `commits` only
// mention them (#94, R2-12): the round's spec and standards commits are no fix diff. A deferral's
// mitigation counts, since its commit is unreviewed code the final nit pass must read; the final
// nit pass's sentences still call such an item fixed (R2-12, deferred).
```

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `docs/running.md:145` already says the opening sentence never calls a declined item fixed, which now holds.

**Commit:** `redline: R2-12 never count a declined item as fixed in the round's fixed list (#93)`

## Task 8: R2-2, tell the final nit pass what a correctness finding buys there

`shape.md`, Decision 7.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `agents/redline-reviewer.md`

**Test first (`tests/loop-test.mjs`, section 19).** Right after the check at line 2183, where `run` is the `done: a final nit pass with one item fixed and one declined` run:

```js
  // The kinds' last sentence is the pass's: a final nit pass is told what a correctness finding
  // buys there, every other review keeps "buys another round" (#94, R2-2).
  check('done: the final nit pass is told a correctness finding gets one more revise pass and then the run ends, and a whole-PR prompt keeps buys another round', promptOf(run.calls, 'final nit pass r2').includes('in this final nit pass a correctness finding the run acts on gets one more revise pass, and then the run ends') && !promptOf(run.calls, 'final nit pass r2').includes('buys another round') && promptOf(run.calls, 'review r1').includes('a correctness finding the run acts on buys another round.') && reviewerAgent.includes('(in a final nit pass, one more revise pass, after which the run ends)'), promptOf(run.calls, 'final nit pass r2').slice(-1200))
```

It fails before the change.

**Change, `workflows/redline-loop.js` line 346.** Replace the `KINDS` constant with three:

```js
const KIND_RULES = 'A finding\'s kind: correctness is wrong behaviour reachable in practice, a security hole, a privacy leak, data loss, a broken contract, or a promise this pull request makes (in its title, its description or its spec) that the code does not keep. Everything else is nit: naming, clarity, a docblock, a small refactor, a test gap, a cost, a doc.'
const KINDS = `${KIND_RULES} State the kind with care: a correctness finding the run acts on buys another round.`
// A final nit pass buys no round: what it finds gets one more revise pass and the run ends (#94, R2-2).
const KINDS_FINAL = `${KIND_RULES} State the kind with care: in this final nit pass a correctness finding the run acts on gets one more revise pass, and then the run ends.`
```

`KINDS` is byte for byte what it was. In `reviewPrompt` (line 1389), `lines.push('', KINDS, '', FACTS_ONLY, ...)` becomes `lines.push('', reviewed === 'final-nit-pass' ? KINDS_FINAL : KINDS, '', FACTS_ONLY, ...)`.

**Change, `agents/redline-reviewer.md` line 65** (the kind bullet). Replace

```
since a correctness finding the run acts on buys another round.
```

with

```
since a correctness finding the run acts on buys another round (in a final nit pass, one more revise pass, after which the run ends).
```

**Proof.** `grep -c "after which the run ends" agents/redline-reviewer.md` prints `1`. The `coverage: the agent file and every review prompt, covered or not, say ...` checks (line 1572) stay green, since `KIND_RULES` holds their key phrases.

**Docs entry:** `workflows/redline-loop.js` and `agents/redline-reviewer.md`: no reader-facing change; `README.md` and `docs/` do not quote the kinds sentence, and `docs/running.md` "Rounds" already says the final nit pass gets one more pass and the run ends.

**Commit:** `redline: R2-2 tell the final nit pass that a correctness finding gets one more pass there, not another round (#93)`

## Task 9: R2-3, build the shaper's disposition enum per pass

`shape.md`, Decision 8.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first (`tests/loop-test.mjs`).** After `whyEnum` (lines 278-282), add a helper:

```js
const dispositionEnum = (calls, label) => {
  const schema = (pick(calls, label) || { opts: {} }).opts.schema || {}
  const item = ((schema.properties || {}).findings || {}).items || {}
  return ((item.properties || {}).disposition || {}).enum || []
}
```

Two checks:

- In section 12, right after the `rules: a Redline round's shaper schema takes the round's reasons ...` check (line 1068): `check('rules: a Redline round\'s shaper schema takes fix, decline, defer and ask, and no none', dispositionEnum(first.calls, 'shape r1').join('|') === 'fix|decline|defer|ask', dispositionEnum(first.calls, 'shape r1'))`.
- In section 18, right after the `human: a human pass's shaper schema keeps its own reasons ...` check (line 2062): `check('human: a human pass\'s shaper schema takes fix, ask and none, and no decline or defer', dispositionEnum(run.calls, 'shape h1').join('|') === 'fix|ask|none', dispositionEnum(run.calls, 'shape h1'))`.

Both fail before the change (one enum of five). The `human: a decline stops the pass at shape` check (line 2057) stays as it is: the mock does not apply a schema, so it proves `checkDispositions` is still the second layer.

**Change, `workflows/redline-loop.js`.** `function shapeSchema(reasons)` (line 675) becomes `function shapeSchema(reasons, dispositions)`; the `disposition` property (line 692) becomes `disposition: { type: 'string', enum: dispositions }`, and the comment above it ends "The schema carries the pass's own values, and the workflow still refuses the other pass's (#94, R2-3)." The comment above the function (lines 672-674) says "only its judgment calls' why_human enum and its disposition enum differ". Line 719 becomes:

```js
const SHAPE_SCHEMAS = { round: shapeSchema(ROUND_WHY, ['fix', 'decline', 'defer', 'ask']), human: shapeSchema(HUMAN_WHY, ['fix', 'ask', 'none']) }
```

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `docs/running.md`, "Dispositions", already says a human review pass sorts into fix, ask or none.

**Commit:** `redline: R2-3 build the shaper's disposition enum per pass, beside its why_human enum (#93)`

## Task 10: R2-7, say in relaunch.how that an overruled decline carries its disposition

`shape.md`, Decision 9.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first (`tests/loop-test.mjs`, section 13).** Right after the `resume: the relaunch note names the field` check (line 1170):

```js
  check('resume: the relaunch note says a decline overruled at a decisions stop carries its disposition', first.res.relaunch.how.includes('handoff (decisions): decisions ({"<id>": {"choice", "notes", "date"}}, every decision so far, unchanged, plus "disposition": "fix|defer" on a decline overruled at that stop).'), first.res.relaunch.how)
```

It fails before the change.

**Change, `workflows/redline-loop.js`, `result()`'s `relaunch.how` (line 2220).** Replace

```
handoff (decisions): decisions ({"<id>": {"choice", "notes", "date"}}, every decision so far, unchanged).
```

with

```
handoff (decisions): decisions ({"<id>": {"choice", "notes", "date"}}, every decision so far, unchanged, plus "disposition": "fix|defer" on a decline overruled at that stop).
```

The string is single-quoted JavaScript, so the double quotes need no escape. The check at line 1170 stays green.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `skills/redline/SKILL.md:208` already records the overrule with `disposition`, and `relaunch.how` is the result's note for a session that relaunches without the skill.

**Commit:** `redline: R2-7 say in the relaunch note that a decline overruled at a decisions stop carries its disposition (#93)`

## Task 11: R2-8, drop checkCalls's unused pass parameter

`shape.md`, Decision 10. A small refactor: no prompt, result or message changes.

**Files:**

- `workflows/redline-loop.js`

**Change.** `function checkCalls(pass, shaped, known = [])` (line 2603) becomes `function checkCalls(shaped, known = [])`, as on `main`. Its two call sites: `checkCalls(pass, shaped)` (line 2847) becomes `checkCalls(shaped)`, and `checkCalls(pass, shaped, calls)` (line 2965) becomes `checkCalls(shaped, calls)`.

**Proof.** `grep -c "checkCalls(pass" workflows/redline-loop.js` prints `0`. The loop test stays at its count with no failure.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; a refactor with every output unchanged.

**Commit:** `redline: R2-8 drop the unused pass parameter from checkCalls (#93)`

## Task 12: R2-9, name the shaper in checkWhy's error, so a resume reruns it

`shape.md`, Decision 11.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first (`tests/loop-test.mjs`, section 18).** Two checks, inserted right after the `ask: a reason that is not one of the cases stops at shape, ...` check (line 2042) and before the line that reassigns `run` for the next scenario, so the first reads the `ask: outside the cases` run:

- `check('ask: a refused reason names the shaper as the step to resume, not the spec check', JSON.stringify(run.res.resumeFrom) === JSON.stringify({ label: 'shape r1', attempt: 2 }), run.res.resumeFrom)`.
- Then one run and check on the reshape path:

  ```js
  // On a reshape the error names that reshape (#94, R2-9).
  run = await go('ask: outside the cases on a reshape', baseArgs, { reviews: [[f('R1-1', 'correctness')], []], planBounce: 1, reshapeAsk: ['R1-1'], whyHuman: { 'R1-1': 'unsure' }, commitIds: [['R1-1']] })
  check('ask: a refused reason on a reshape names that reshape as the step to resume', run.res.status === 'error' && run.res.stage === 'shape' && JSON.stringify(run.res.resumeFrom) === JSON.stringify({ label: 'reshape r1 #1', attempt: 2 }), [run.res.status, run.res.error, run.res.resumeFrom])
  ```

Both fail before the change (the label is `spec status r1`, then `spec status r1 #1`). The next scenario's own `run = await go(...)` line follows unchanged.

**Change, `workflows/redline-loop.js`.**

- `function checkWhy(pass, shaped, known = [])` (line 2625) becomes `function checkWhy(pass, shaped, known, shaperLabel)`, and its `throw stageError('shape', ...)` (line 2630) passes `{}` and `shaperLabel` as its last two arguments, so the error names the shaper whose output it refuses. Its comment (lines 2620-2624) gains: "It runs after the `spec status` call, so it names the shaper's label itself; `lastLabel` would name the spec check, and a resume would replay the refused output (#94, R2-9)."
- Its call sites: `checkWhy(pass, shaped)` (line 2850) becomes ``checkWhy(pass, shaped, [], `shape ${pass.tag}`)``, and `checkWhy(pass, shaped, calls)` (line 2968) becomes ``checkWhy(pass, shaped, calls, `reshape ${pass.tag} #${adjustment + 1}`)``, the label the reshape's own `run()` call uses (line 2962).

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `docs/running.md` says a call outside the cases stops the run at shape, which holds, and a resume now reruns the shaper.

**Commit:** `redline: R2-9 name the shaper in checkWhy's error, so a resume reruns it (#93)`

## Task 13: R2-13, read the handoff's groups from one set of tests

`shape.md`, Decision 12. A small refactor: every handoff comment stays byte for byte.

**Files:**

- `workflows/redline-loop.js`

**Change, `handoffComment`.** Replace the group lines (lines 3188-3195, from `const of = (test) => decidedAll.filter(test)` through `const fixed = of((d) => d.kind === 'fixed')`) with:

```js
  // One test per group, read by the lists below and by the Rounds counts, so the two never drift
  // (#94, R2-13).
  const isKind = (kind) => (d) => d.kind === kind
  const isAsked = (d) => d.kind === 'decided' && !d.overruled && d.decidedBy !== AUTOPILOT
  const isAuto = (d) => d.kind === 'decided' && !d.overruled && d.decidedBy === AUTOPILOT
  const isOverruled = (d) => d.kind === 'decided' && d.overruled
  const of = (test) => decidedAll.filter(test)
  const asked = of(isAsked)
  const auto = of(isAuto)
  const overruled = of(isOverruled)
  const declined = of(isKind('declined'))
  const notPicked = of(isKind('dropped'))
  const notChanged = of(isKind('not-changed'))
  const fixed = of(isKind('fixed'))
```

and in the Rounds `parts` (lines 3202-3210) each test reads its predicate, in the same order: `count(isKind('fixed'))`, `count(isKind('declined'))`, `count(isKind('deferred'))`, `count(isAsked)`, `count(isAuto)`, `count(isOverruled)`, `count(isKind('left'))`, `count(isKind('dropped'))`, `count(isKind('not-changed'))`. The scope line stays `(record.scoped || []).length`. The labels and order are unchanged.

**Proof.** `grep -c "d.kind === 'decided' && d.overruled" workflows/redline-loop.js` prints `1`. The loop test stays at its count with no failure, so no handoff moved.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; a refactor with every comment unchanged.

**Commit:** `redline: R2-13 read the handoff's groups and the Rounds counts from one set of tests (#93)`

## Task 14: R2-14, caption the Fixed list with what its lines show

`shape.md`, Decision 13.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first (`tests/loop-test.mjs`).** The three expectations that quote the caption change `<summary>Each in its own commit</summary>` to `<summary>With the commits that fixed each</summary>`: line 323 (`guided: the handoff lists what was put to the person, then what was fixed, ...`), line 1864 (`posted text: a carried finding's line under Fixed ...`) and line 2267 (the layout's expected lines). All three fail before the change.

**Change, `workflows/redline-loop.js` line 3254.** `'<summary>Each in its own commit</summary>'` becomes `'<summary>With the commits that fixed each</summary>'`.

**Change, `docs/running.md` line 154.** "folded, one line per item with its commit." becomes "folded, one line per item with the commits that fixed it (one item can have two, and two items can share one)."

**Proof.** `grep -c "Each in its own commit" workflows/redline-loop.js tests/loop-test.mjs docs/running.md` prints `0` for each file.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "The handoff comment" (line 154), updated in this task's commit.

**Commit:** `redline: R2-14 caption the Fixed list with the commits that fixed each (#93)`

## Task 15: R2-15, leave an overruled decline out of a second decisions stop's declines

`shape.md`, Decision 14.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first (`tests/loop-test.mjs`, section 20).** Right after the `overrule: a decisions hand-off carries the round's declines with their reasons` check (line 2221), where `covArgs`, `rules`, `scenario` and `decisions` are in scope:

```js
  // A second stop in the same round (here an answer the resolve agent could not apply) does not
  // list again a decline the person already overruled (#94, R2-15).
  const again = await go('overrule: a second stop after an overrule', { ...covArgs, askRules: rules, decisions }, { ...scenario, unresolved: [{ id: 'R1-2', why: 'no such option' }] })
  check('overrule: a second decisions stop leaves out a decline the person already overruled', again.res.status === 'handoff' && again.res.handoffKind === 'decisions' && JSON.stringify((again.res.declined || []).map((d) => d.id)) === '["R1-3","R1-6"]', [again.res.status, again.res.handoffKind, again.res.declined])
```

It fails before the change (R1-7 is listed). The check above it, the first stop with no overrule yet, is the neighbour: it still lists R1-3, R1-6 and R1-7.

**Change, `workflows/redline-loop.js`, `handoffResult` (line 3627).** The `declined` filter becomes `.filter((x) => x.disposition === 'decline' && !(decisions[x.id] && decisions[x.id].disposition))`, and the comment above it (lines 3625-3626) gains: "A decline the person already overruled is left out: the overrule is in the decisions the relaunch carries, and it is applied there (#94, R2-15)."

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `skills/redline/SKILL.md:208` lists what `declined` holds, the round's declines nobody has overruled, which now holds at a second stop too.

**Commit:** `redline: R2-15 leave a decline already overruled out of a second decisions stop (#93)`

## Task 16: Verification Gate

**Files:**

- `agent-os/specs/2026-11-13-1329-94-review-round-2/plan.md` and `agent-os/specs/2026-11-13-1329-94-review-round-2/shape.md` (step 13, and step 12 if nothing is approved).
- Standards, only those the standards approver approves from `shape.md`'s "Standards retrospective (proposed)":
  - `agent-os/standards/workflow/agents.md` (items 1 to 5).
  - `agent-os/standards/testing/tests.md` (item 6).

1. **Steps 1 to 9:** run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-13-1329-94-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence. Expected: loop and gh at their counts before the round plus what Tasks 2 to 15 add (see Expected counts above); guard `594 passed, 0 mismatched`; prefs, gate, setup and background at their counts before the round, since none reads a file this round changes.
2. **Step 10, Docs:** as each task's Docs entry says. Every touched file under `scripts/`, `agents/` and `workflows/` has its entry; each names this round's commit for it or "no reader-facing change" with its reason. No new config key, subcommand, allow rule or exit code.
3. **Step 11, Version:** `0.3.0` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged by this round. `main` carries `0.2.4`, so this PR already has its bump, and this round changes nothing a setup rerun writes (`shape.md`, Decision 16). The setup test's last cases prove the two versions agree.
4. **Step 12, Standards retrospective:** apply the items the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", as drafted there.
   - If the approver approves none, make no standards commit, and add "Standards retrospective: no changes" under Decisions in this folder's `shape.md`.
   - If it approves any, the edits go in one commit of their own after the finding commits: `redline: record the round 2 review lessons in the standards (#93)`. `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` then prints `0`, so no heading moved.
5. **Step 13, Spec folder:** add an "As built" section to this file. It records:
   - each task's commit;
   - each task's red run (the failing check names) and the green run;
   - the gate's counts;
   - the retrospective's outcome;
   - the correction to round 1's As built: its Task 14 moved `checkWhy` after the `spec status` call, which changed the resume label too, and this round's Task 12 puts it back on the shaper.

   A deviation from this plan is also recorded under Decisions in `shape.md`. This lands in the round's last commit.

**Commit:** `redline: record PR #94 round 2 as built (#93)`

---

## As built

Built on `refactor/93-...` from `e788107`, one commit per task, every file staged by name.

| Task | Finding | Commit | Red run (failing checks) | Green run |
|---|---|---|---|---|
| 1 | spec | `4bb2695` | n/a | n/a |
| 2 | R2-1 | `18f4675` | gh `133 passed, 2 failed`: `underscore login: the rule tail of a login with an underscore is stripped from the title` (got the title with ` · left to @octo_acme under rule craft-config`), `underscore login: its left to @login reply is left` (got `decided`) | gh `135 passed, 0 failed` |
| 3 | R2-5 | `127ad81` | loop `841 checks passed, 1 failed`: `coverage: a ref with a note after the id counts as that finding and mints nothing` (findings `R1-1`, `R1-2`) | loop `843 checks passed, 0 failed` |
| 4 | R2-6 | `f97b63e` | loop `844 checks passed, 1 failed`: `coverage: a candidate with no file is minted at (no file), line 0, and its body line has a place`; the gh case `no file: ...` passed at once, as planned (gh `136 passed`) | loop `845 checks passed, 0 failed`, gh `136 passed, 0 failed` |
| 5 | R2-10 | `018da64` | loop `846 checks passed, 1 failed`: `plan: an accept that keeps a decline is listed as put to the person, never as overruled` | loop `847 checks passed, 0 failed` |
| 6 | R2-11 | `5bcc795` | loop `848 checks passed, 1 failed`: `done: an answered correctness ask that a reshape re-sorts to a decline still buys the next round` (labels end in `final nit pass r2`) | loop `849 checks passed, 0 failed` |
| 7 | R2-12 (defer) | `bc70286` | loop `852 checks passed, 1 failed`: `done: a commit that mentions a declined item does not count it fixed in the final nit pass sentence`; the neighbour (`a final nit pass deferral's mitigation commit is still flagged as unreviewed`) green | loop `853 checks passed, 0 failed` |
| 8 | R2-2 | `4cf63df` | loop `853 checks passed, 1 failed`: `done: the final nit pass is told a correctness finding gets one more revise pass and then the run ends, ...` | loop `854 checks passed, 0 failed` |
| 9 | R2-3 | `4351d10` | loop `854 checks passed, 2 failed`: `rules: a Redline round's shaper schema takes fix, decline, defer and ask, and no none`, `human: a human pass's shaper schema takes fix, ask and none, and no decline or defer` (both one enum of five) | loop `856 checks passed, 0 failed` |
| 10 | R2-7 | `d4c1fc3` | loop `856 checks passed, 1 failed`: `resume: the relaunch note says a decline overruled at a decisions stop carries its disposition` | loop `857 checks passed, 0 failed` |
| 11 | R2-8 | `df4ad98` | refactor: green before (857) | loop `857 checks passed, 0 failed`; `grep -c "checkCalls(pass"` prints `0` |
| 12 | R2-9 | `5b4c8f7` | loop `857 checks passed, 2 failed`: `ask: a refused reason names the shaper as the step to resume, not the spec check` (`spec status r1`), `ask: a refused reason on a reshape names that reshape as the step to resume` (`spec status r1 #1`) | loop `859 checks passed, 0 failed` |
| 13 | R2-13 | `af97c4e` | refactor: green before (859) | loop `859 checks passed, 0 failed`; the `d.overruled` grep prints `1` |
| 14 | R2-14 | `e02fec3` | loop `856 checks passed, 3 failed`: the guided handoff, the posted-text Fixed line and the layout checks | loop `859 checks passed, 0 failed`; `Each in its own commit` greps `0` in all three files |
| 15 | R2-15 | `540db37` | loop `859 checks passed, 1 failed`: `overrule: a second decisions stop leaves out a decline the person already overruled` (R1-7 listed) | loop `860 checks passed, 0 failed` |
| 16 | standards | `a5bc2ba` | n/a | `git diff HEAD~1 -- agent-os/standards/ \| grep -c "^[-+]#"` prints `0` |

- **Proofs.** Task 2: `grep -c "A-Za-z0-9_-" scripts/redline-gh.sh` prints `2`, and the old pattern greps `0`. Task 8: `grep -c "after which the run ends" agents/redline-reviewer.md` prints `1`.
- **Gate counts** (the final run, recorded in the gate's JSON): loop `860 checks passed, 0 failed` (841 + the thirteen new checks + six run-record checks from the new runs); gh `136 passed, 0 failed`; guard `594 passed, 0 mismatched`; prefs, gate, setup and background at their counts before the round. Every check exits 0, and `git.unexpected_files` and `git.uncommitted` are empty.
- **Standards retrospective.** All six approved items applied as drafted in `shape.md`, in `a5bc2ba`: items 1 to 5 in `agent-os/standards/workflow/agents.md`, item 6 in `agent-os/standards/testing/tests.md`. None carries part of a finding's fix, so the commit names no finding.
- **Correction to round 1's As built.** Round 1's Task 14 (R1-13) moved `checkWhy` after the `spec status` call, and its As built said the error text and the resume label were unchanged. The text was unchanged, but the label changed: `stageError` fell back to `lastLabel`, which then named `spec status r<n>`, so a resume replayed the refused shaper. This round's Task 12 passes the shaper's label, and the two new `resumeFrom` checks pin it.
- **Deviation, Task 6.** The planned scenario stopped at `check r1` before and after the change (`no commit names R1-2`): the resolve mock gives every answered call a task with a file, so the gate needed a commit naming R1-2. The scenario adds `acceptedCalls: ['R1-2']`, since the answer "Keep it" changes no code, and a comment saying so. The check is as planned. Red and green then matched the plan (`final nit pass r2` before, `re-review r2` after). Recorded in `shape.md`, Decision 18.
- **Placement, Task 7.** The R2-12 comment sits as its own paragraph right above the done-rule lines, after Task 6's R2-11 sentence, instead of inside the sentence it replaces. The wording is as planned.
- **Order, Task 5.** The change was written before the red run, so the `overruled` condition was taken out, the red run seen, and the condition put back before the green run.
