# PR #97 review round 1: filing that is safe beside itself, a decided fix that stays a fix, and the words for "nothing ships"

Spec folder: `agent-os/specs/2026-11-16-1358-97-review-round-1/`

Shaped by Redline in unattended mode, for review round 1 of PR #97 (issue #95), from the round's fourteen findings (`redline/round-1-review.json`, `redline/round-1-findings.json`). Corrected in place on plan adjustment 1 (`shape.md`, Context).

- `fix`, one task each, in finding order: R1-2 (Task 2), R1-6 (Task 4), R1-7 (Task 5), R1-8 (Task 6), R1-10 (Task 7), R1-1 (Task 8), R1-3 (Task 9), R1-5 (Task 10), R1-11 (Task 11), R1-12 (Task 12).
- `defer` that ships a mitigation, its task in finding order: R1-4 (Task 3); its drafted issue is under `## Deferred` in `shape.md`, and the run files it.
- `decline`, no task: R1-9, R1-13, R1-14 (`shape.md`, `## Declined`).
- No `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every commit message names the finding and ends `(#95)`. Line numbers are at `1dc6048`, the working tree's HEAD. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block. No commit subject holds a bare `@word`.

Nothing in this plan touches `scripts/checks-template.sh`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, the gate's backticked text, `scripts/redline-guard.sh`, `hooks/hooks.json`, any agent file or anything under `templates/`. The version stays 0.4.0 (`shape.md`, Standards Applied, process/release).

Task order matters. Tasks 2 and 9 both change `defer_record` and the `defer` header in `scripts/redline-gh.sh`, the header's quote in `docs/scripts.md`, and `tests/gh-test.sh`; Task 9 builds on Task 2. Tasks 5, 6, 7, 11 and 12 change `workflows/redline-loop.js` and `tests/loop-test.mjs` in different places. Tasks 3, 4 and 8 each add one check at the end of the loop test's statements block, in that order. Each task's anchors are as the tasks before it leave them.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-16-1358-97-review-round-1/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds or changes a case (2 to 9, 11, 12) makes the test change first and sees it fail on a gate run (`.claude/redline/checks.sh <snapshot>` prints the failing check names), then makes the change and sees it pass. A check a task adds as the neighbour that must not change is green on both runs; the task says which. Task 10 is a refactor: the prefs count does not move, and the green gate run and its proof grep are its evidence.

**Expected counts.** Before this round (the pull request's As built): loop `1228 checks passed, 0 failed`, guard `601 passed, 0 mismatched`, prefs `172`, gate `117`, setup `512`, gh `174`, background `39`. This round adds: gh 2 (Task 2) and 2 (Task 9), so gh reads 178; loop 1 (Task 3), 1 (Task 4), 10 (Task 5: five checks, five new runs that reach Finish), 3 (Task 6: two checks, one new run that reaches Finish), 6 (Task 7: three checks, three new runs that reach Finish), 1 (Task 8), 2 (Task 11), 2 (Task 12: one check, one new run that reaches Finish), so loop reads 1254. `go()` adds one run-record check for each run that reaches Finish (`tests/loop-test.mjs:339-344`). The other harnesses keep their counts. If a count differs, the first green gate run's counts are the evidence, recorded under As built with the reason, and as a deviation under Decisions in `shape.md`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-16-1358-97-review-round-1/plan.md`
- `agent-os/specs/2026-11-16-1358-97-review-round-1/shape.md`
- `agent-os/specs/2026-11-16-1358-97-review-round-1/standards.md`
- `agent-os/specs/2026-11-16-1358-97-review-round-1/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 1 spec for PR #97 (#95)`

## Task 2: R1-2, a deferred entry is merged into the record as it stands when it is written

`shape.md`, Decision 1 and Unattended answer 10.

**Files:**

- `tests/gh-test.sh`
- `scripts/redline-gh.sh`
- `docs/scripts.md`

**Test first.** In `tests/gh-test.sh`:

1. In the fake `gh`, in the `issue` handler's `create)` branch (line 106 onward), right before the line `echo "https://github.com/o/r/issues/$n" ;;`, add a hook that writes into a file before the create answers, as another `defer` finishing first would:

   ```bash
               if [[ -n "${GH_FAKE_CREATE_WRITES:-}" ]]; then printf '%s\n' "${GH_FAKE_CREATE_TEXT:-}" > "$GH_FAKE_CREATE_WRITES"; fi
   ```

   and extend the handler's comment (it ends "GH_FAKE_LIST_FAIL=1 and GH_FAKE_CREATE_FAIL=1 fail them as GitHub would.") with: "GH_FAKE_CREATE_WRITES=<file> writes GH_FAKE_CREATE_TEXT into that file before the create answers, as a defer for another finding finishing while this one is on GitHub would (#97)."

2. Right after the case that opens `is "defer issue, a failed lookup: exits 1, creates nothing and writes no record"` (line 445) and the `rm -f "$LOG"` after it, add:

   ```bash
   # A defer for another finding that finished while this one was on GitHub (#97, R1-2): the entry is
   # merged into the record as the file stands when it is written, so the other entry is kept.
   GH_FAKE_CREATE_WRITES="$D/overlap.json" GH_FAKE_CREATE_TEXT='{"R2-5":{"where":"issue","number":90,"url":"https://github.com/o/r/issues/90","path":"x.md"}}' gh defer issue R2-8 "$D/issue-R2-3.md" "$D/overlap.json" >/dev/null
   is "defer issue, another finding recorded meanwhile: the record keeps both entries" "$(jq -c 'keys' "$D/overlap.json")" '["R2-5","R2-8"]'
   is "defer issue, another finding recorded meanwhile: this finding's entry is the issue it opened" "$(jq -c '[.["R2-8"].number, .["R2-5"].number]' "$D/overlap.json")" '[123,90]'
   rm -f "$LOG"
   ```

Red: both cases fail (the record holds `R2-8` alone, written from the copy read before the create).

**Change.** In `scripts/redline-gh.sh`:

1. Replace `defer_record` and its comment (lines 171-179) with:

   ```bash
   # defer_record <record file> <finding> <entry>: the record with the finding's entry set, merged
   # into the record as the file stands now, not as `defer` read it before the lookup and the create
   # on GitHub, so an entry another defer recorded in between is kept (#97, R1-2); written beside
   # itself and moved into place, so a reader never sees half a file.
   defer_record() {
       local tmp current='{}'
       mkdir -p "$(dirname "$1")"
       if [[ -f "$1" ]]; then
           current="$(cat "$1")"
       fi
       tmp="$(mktemp "$(dirname "$1")/.redline-deferred.XXXXXX")"
       jq --arg id "$2" --argjson e "$3" '. + {($id): $e}' <<<"$current" > "$tmp"
       mv "$tmp" "$1"
   }
   ```

2. The three calls `defer_record "$record" "$existing" "$finding" "$entry"` (lines 585, 597 and 611) become `defer_record "$record" "$finding" "$entry"`. `existing` is still read at line 573 for the reuse check at 578-582.
3. In the header's `defer` entry (lines 111-126), after `else the issue is opened and recorded as {where: "issue", number, url, path}.`, add, wrapped to the header's column as the lines around it are: "Each entry is merged into the record as the file stands when it is written, so an entry another defer recorded meanwhile is kept."

In `docs/scripts.md`, the quoted `redline-gh.sh` header (its `defer` entry opens at line 121) takes the same sentence, byte for byte as the script's header.

Proof: `grep -c 'existing" "' scripts/redline-gh.sh` prints `0` (the text sits only in the three old calls).

**Docs entry:** `scripts/redline-gh.sh` is described in `docs/scripts.md`, its quoted header, updated in this commit.

**Commit:** `redline: R1-2 merge a deferred entry into the record as it stands when it is written (#95)`

## Task 3: R1-4 (defer), its mitigation: the docs say drafts to GitHub need the repository's Issues turned on

`shape.md`, Decision 2, Unattended answer 9 and `## Deferred`. R1-4 is a `defer`: this task is its mitigation, the only change the round ships for it. Its full fix (a launch check of `hasIssuesEnabled`, after a measurement of `gh` on a repository with Issues off) is the drafted issue under `## Deferred`, which the run files; no task here starts it.

**Files:**

- `tests/loop-test.mjs`
- `docs/contract.md`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`, at the end of the statements block, after the check that opens `check('statements: the README states the title\'s unmeasured case as expected, never as fact'` (line 3276) and before the block's closing `}` (line 3277), add:

```js
  // Drafts to GitHub need the repository's Issues on (#97, R1-4): whatever gh does where they are
  // off, no issue can be opened there, so the docs that describe the setting say so.
  check('statements: the docs say drafts to GitHub need the repository\'s Issues turned on', read('docs', 'contract.md').includes('`github` needs GitHub Issues turned on in the repository') && read('docs', 'running.md').includes('`defer to github` needs GitHub Issues turned on in the repository'), 'docs/contract.md, redline.json; docs/running.md, Where a draft goes')
```

Red: the check fails.

**Change.**

1. In `docs/contract.md`, the `deferTo` row (line 132): after `` `print` (the same, and its title and body are printed when the run ends). `` add:

   ```markdown
   `github` needs GitHub Issues turned on in the repository: a repository with Issues off, or one that tracks its work in another tracker, sets `spec` or `print`.
   ```

2. In `docs/running.md`, the "Where a draft goes" bullet (line 126): after the sentence `The draft file is written in every case.` add:

   ```markdown
   `defer to github` needs GitHub Issues turned on in the repository: a repository with Issues off, or one that tracks its work in another tracker, uses `spec` or `print`.
   ```

Both sentences state what GitHub needs, never what `gh` does on such a repository, which no Redline role could measure (`shape.md`, Unattended answer 9).

**Docs entry:** a change to `docs/` alone, reader-facing by nature; no plugin file is touched.

**Commit:** `redline: R1-4 say that drafts to GitHub need the repository's Issues turned on (#95)`

## Task 4: R1-6, a capped run lists its deferred items and prints the print-mode drafts

`shape.md`, Decision 3.

**Files:**

- `tests/loop-test.mjs`
- `skills/redline/SKILL.md`

**Test first.** In `tests/loop-test.mjs`, right after the check Task 3 added, add:

```js
  // A capped run reports its deferred items as a finished one does (#97, R1-6): the docs promise
  // a print-mode draft is printed when the run ends, and the cap is an ending too.
  const capped = ((read('skills', 'redline', 'SKILL.md').split('### `capped`')[1] || '').split('### `error`')[0]) || ''
  check('statements: the skill\'s capped section lists the deferred items and prints the print-mode drafts', capped.includes('Then the deferred items (`deferred`), as the `done` section lists them') && capped.includes('when `deferTo` is `print`, print each draft after the list'), capped)
```

Red: the check fails.

**Change.** In `skills/redline/SKILL.md`, the `capped` section (line 268), replace

```markdown
List `openFindings` one line each and stop.
```

with

```markdown
List `openFindings` one line each. Then the deferred items (`deferred`), as the `done` section lists them: one line each with the ID, the title, where it went (`deferred to #<number>`, with its `url`, or the draft's `path`) and the mitigation that shipped, when one did; when `deferTo` is `print`, print each draft after the list as that section says, `draft.title` on a line of its own, then `draft.body` in a fenced block, both exactly as given. Then stop.
```

The sentence after it ("The person picks them up by hand or with another `/redline:redline`.") stays.

**Docs entry:** `skills/redline/SKILL.md`: no reader-facing change; `README.md` (Dials, "deferred items, where"), `docs/running.md` ("Where a draft goes") and `docs/contract.md` (`deferTo`) already say a print-mode draft is printed when the run ends, which the skill now does on a capped run too.

**Commit:** `redline: R1-6 list the deferred items and print the print-mode drafts on a capped run (#95)`

## Task 5: R1-7, the plain words for nothing read as no mitigation

`shape.md`, Decision 4 and Unattended answer 6.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`:

1. The word loop that opens `for (const [word, name] of [['none', 'the word none'], ['None (nothing cheap exists).', 'none with a note'], ['', 'an empty string']]) {` (line 2824) gains four spellings, so its list reads:

   ```js
     for (const [word, name] of [['none', 'the word none'], ['None (nothing cheap exists).', 'none with a note'], ['', 'an empty string'], ['N/A', 'n/a'], ['Nothing ships now.', 'nothing ships now'], ['Nothing.', 'nothing'], ['No mitigation (the client is replaced next quarter).', 'no mitigation with a note']]) {
   ```

   and the comment above it (it opens `// "none" reads as no mitigation`) reads `// "none", and the plain words for nothing (#97, R1-7), read as no mitigation`, the rest of it unchanged.

2. Right after the check that opens `check('defer: a mitigation that only begins with "none" still ships, is demanded and buys the round'` (line 2830), add the neighbour:

   ```js
     // The neighbour of the words (#97, R1-7): a mitigation that only begins with them still ships.
     const nothingBut = await go('defer: a mitigation that begins with the words nothing ships now', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], mitigations: { 'R1-1': 'Nothing ships now but a log line with the retry count' }, commitIds: [['R1-1']] })
     check('defer: a mitigation that only begins with "nothing ships now" still ships, is demanded and buys the round', nothingBut.res.status === 'done' && nothingBut.res.rounds.length === 2 && nothingBut.res.rounds[1].reviewed === 'fix-diff', [nothingBut.res.status, nothingBut.res.rounds.map((r) => r.reviewed)])
   ```

Red: the four new spellings' checks fail (each counts as a mitigation, so the commit that names R1-1 is called its mitigation and buys round 2). The neighbour is green on both runs.

**Change.** In `workflows/redline-loop.js`, replace `hasMitigation` and its comment (lines 766-771) with:

```js
// What ships now for a deferred item, or nothing (#95): an empty mitigation, or one that only says
// nothing ships (none, n/a, nothing, nothing ships, nothing ships now, no mitigation, in any case,
// with or without a note in parentheses and a full stop), means no task, no commit and no round
// bought. The agents are asked for an empty string; the words are read as well because the shape
// prompt asks the recommendation beside the field to say "that nothing ships now" (#97, R1-7).
const NOTHING_SHIPS = /^(none|n\/a|nothing|nothing ships( now)?|no mitigation)(\s*\(.*\))?\.?$/i
const hasMitigation = (item) => {
  const text = item && typeof item.mitigation === 'string' ? item.mitigation.trim() : ''
  return text !== '' && !NOTHING_SHIPS.test(text)
}
```

Every reader of a deferral's mitigation already goes through `hasMitigation` (`needCommits`' `mitigated`, `outcomesFor`'s `shipsNothing`, `bought`'s `shaperMitigated`, `deferredEntry`, `draftView`), so nothing else changes.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; no doc spells which words mean no mitigation, and the shaper and the resolve agent are still asked for an empty string.

**Commit:** `redline: R1-7 read the plain words for nothing as no mitigation (#95)`

## Task 6: R1-8, a title that cleans to nothing gives way, or stops the run at shape

`shape.md`, Decision 5.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in the filing section, right after the check that opens `check('filing: the mitigation is not in the issue'` (line 2880), add:

```js
  // A title is cleaned before one is chosen (#97, R1-8): a title of the person's that cleans to
  // nothing gives way to the shaper's, and a shaper title that cleans to nothing is no title.
  const blank = await go('filing: a title of the person\'s that is only spaces', { ...baseArgs, deferrals: { 'R1-1': { action: 'file', title: '   ', notes: '', date: '2026-11-16', draft: 1 } } }, { reviews: [[f('R1-1', 'correctness')]], defer: ['R1-1'], mitigations: { 'R1-1': '' }, commitIds: [[]] })
  check('filing: a title of the person\'s that cleans to nothing gives way to the shaper\'s', blank.res.status === 'done' && ((draftsOf(blank)[0] || {}).content || '').startsWith('# Lock R1-1\n\n'), [blank.res.status, blank.res.error, (draftsOf(blank)[0] || {}).content])
  const controls = await go('filing: a shaper title of control characters only', baseArgs, { reviews: [[f('R1-1', 'correctness')]], defer: ['R1-1'], drafts: { 'R1-1': { title: '\u0001\u0002' } }, commitIds: [[]] })
  check('filing: a shaper title that cleans to nothing is no title, so the run stops at shape, resumable at the shaper', controls.res.status === 'error' && controls.res.stage === 'shape' && controls.res.error === 'the shaper deferred R1-1 with no drafted issue (missing title); a deferred item always carries one' && controls.res.resumeFrom && controls.res.resumeFrom.label === 'shape r1', [controls.res.status, controls.res.error, controls.res.resumeFrom])
```

The control characters are written as their escapes (`testing/tests.md:11`). Red: the first check fails (the draft opens `# `), and the second fails (the run stops for the draft instead of at shape).

**Change.** In `workflows/redline-loop.js`:

1. In `issueDraft`, the title line (line 1271)

   ```js
       `# ${draftTitle(title || item.title)}`,
   ```

   becomes

   ```js
       `# ${draftTitle(title) || draftTitle(item.title)}`,
   ```

   and the function's comment gains a last sentence: "Each title is cleaned before one is chosen, so a title of the person's that cleans to nothing gives way to the shaper's (#97, R1-8)."

2. `draftMissing` (line 773) becomes

   ```js
   // A draft field is missing when it is no string or holds nothing; the title is read as it will be
   // filed, so one that cleans to nothing (control characters only) is missing too (#97, R1-8).
   const draftMissing = (item) => DRAFT_FIELDS.filter((key) => !item || typeof item[key] !== 'string' || (key === 'title' ? draftTitle(item[key]) : item[key].trim()) === '')
   ```

   `draftTitle` is a function declaration, so it is defined when `draftMissing` runs.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; README Known limits ("A title is made one line and cut to 256 characters") stays true, and a title that cleans to nothing now gives way to the shaper's or stops the run at shape, where the shaper reruns.

**Commit:** `redline: R1-8 clean each draft title before one is chosen, and read the cleaned title in the draft check (#95)`

## Task 7: R1-10, a decided finding is a deferral only when its decision made it one

`shape.md`, Decision 6 and Unattended answer 7.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`:

1. The scripted shaper gains `reshapeDefer`: the ids a reshape sorts as `defer`, with an entry, whatever the first shape gave them. In `disposition` (line 212), put `onReshape('reshapeDefer').includes(id) ? 'defer' :` right after the `onReshape('reshapeFix')` test, before the `ask` test; in the `deferred:` list (line 232), the filter becomes `ids.filter((id) => defer.includes(id) || onReshape('reshapeDefer').includes(id))`. The comment above `const reshape =` (it lists `reshapeOmitCall`, `reshapeFix`, `reshapeAsk`, `reshapeExtraCall` and `reshapeDecline`) names it: "sorts defer with its entry (reshapeDefer, #97, R1-10)". No existing scenario sets the key, so no other run changes.

2. In the filing section, right after the check that opens `check('filing: a deferral the person chose is filed, and its reply ends with where it went, as their decision'` (line 2950), add:

   ```js
     // A finding the person decided is a deferral only when the decision made it one (#97, R1-10): a
     // resolve agent's entry that ships nothing beside a call it planned as a fix, and a reshape's
     // entry beside a decided call, leave the fix a fix; a call answered with a deferral that ships
     // nothing, with no task, is still the person's deferral.
     const strayResolve = await go('filing: the resolve agent defers a call it planned as a fix, shipping nothing', { ...baseArgs, interrupt: 'autopilot' }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], resolveDeferred: [{ id: 'R1-1', mitigation: '', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }], commitIds: [['R1-1']] })
     check('filing: a resolve entry that ships nothing beside a call planned as a fix files nothing, and the fix is posted and counted as one', strayResolve.res.status === 'done' && !labels(strayResolve.calls).includes('file deferred r1') && (strayResolve.res.deferred || []).length === 0 && (replyFor(strayResolve.calls, 'push and reply r1', 'R1-1') || '').includes(' Applied in ') && !(replyFor(strayResolve.calls, 'push and reply r1', 'R1-1') || '').includes('Deferred to') && (strayResolve.res.rounds[1] || {}).reviewed === 'fix-diff', [strayResolve.res.status, labels(strayResolve.calls), replyFor(strayResolve.calls, 'push and reply r1', 'R1-1'), strayResolve.res.rounds.map((r) => r.reviewed)])
     const strayReshape = await go('filing: a reshape defers a decided call\'s finding, shipping nothing', { ...baseArgs, decisions: { 'R1-1': { choice: 'Change it', notes: 'Fix it now.', date: '2026-11-16' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeDefer: ['R1-1'], mitigations: { 'R1-1': '' }, commitIds: [['R1-1']] })
     check('filing: a reshape\'s entry beside a decided call raises no draft and files nothing, and the fix is posted as the person\'s', strayReshape.res.status === 'done' && !labels(strayReshape.calls).includes('file deferred r1') && replyFor(strayReshape.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Fix it now. Applied in 1bbbbbb (redline: R1-1 fix). · decided by: @author' && (strayReshape.res.rounds[1] || {}).reviewed === 'fix-diff', [strayReshape.res.status, strayReshape.res.handoffKind, labels(strayReshape.calls), replyFor(strayReshape.calls, 'push and reply r1', 'R1-1')])
     const chosenBare = await go('filing: a call answered with a deferral that ships nothing', { ...baseArgs, decisions: { 'R1-1': { choice: 'Defer it', notes: 'Defer it; nothing ships now.', date: '2026-11-16' } }, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'], acceptedCalls: ['R1-1'], resolveDeferred: [{ id: 'R1-1', mitigation: '', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }], commitIds: [[]] })
     check('filing: a call answered with a deferral that ships nothing, with no task, is still filed as the person\'s deferral', chosenBare.res.status === 'done' && labels(chosenBare.calls).includes('file deferred r1') && replyFor(chosenBare.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Defer it; nothing ships now. No code change. Deferred to #301. · decided by: @author', [chosenBare.res.status, labels(chosenBare.calls), replyFor(chosenBare.calls, 'push and reply r1', 'R1-1')])
   ```

   `acceptedCalls` is the mock's way to have the resolve agent plan the call's task with no files.

Red: the first check fails (the entry is filed, the reply ends `No code change. Deferred to #301.`, and with no fix counted the run hands off after round 1), and the second fails (the reshape's entry raises a draft, so the run stops at a hand-off). The third is the neighbour, green on both runs. If the reply text of the second or third differs only in a way the plan could not foresee (the short SHA or the subject the harness gives), the expectation follows the harness's text and the difference is recorded under As built.

**Change.** In `workflows/redline-loop.js`, in `revise()`:

1. Right after `let resolved = null` (line 3605), add

   ```js
     // The findings whose deferred entry the round's resolve agent returned (#97, R1-10): how a call's
     // answer shows a deferral. A reshape's entry never does, since the person's decision stays
     // whatever disposition a reshape gives its finding (#94, R8-6).
     const resolveDeferred = new Set()
   ```

2. In `resolveWith`, right after the `undrafted` check's closing `}` (line 3650) and before `deferred = deferred.map(`, add `for (const item of fresh) { resolveDeferred.add(item.id) }` on lines of its own.

3. Replace `isDeferral` and its comment (lines 3659-3663) with:

   ```js
     // A task the round's resolve planned with files for a finding: what needCommits demands.
     const plannedTask = (id) => Boolean(resolved) && resolved.tasks.some((task) => task.finding === id && task.files.length > 0)
     // The round's deferrals as they stand (#95): an entry whose finding is deferred, by the shaper
     // or by the person's override. A finding the person or autopilot decided is a deferral only
     // when the decision made it one (#97, R1-10): a defer override, or the resolve agent's own entry
     // when it ships a mitigation or the finding has no planned task with files, since a deferral
     // that ships nothing has no task. A reshape's disposition or entry never makes a decided finding
     // one (#94, R8-6). A decline or a fix beside a leftover entry is none (#94, R4-9), and neither is
     // a finding left to the person under a rule, which has no entry at all.
     const isDeferral = (d) => {
       if (record.forced[d.id]) {
         return false
       }
       const decision = roundDecisions[d.id]
       if (decision) {
         return decision.disposition === 'defer' || (resolveDeferred.has(d.id) && (hasMitigation(d) || !plannedTask(d.id)))
       }
       return effectiveDispositions().some((s) => s.id === d.id && s.disposition === 'defer')
     }
   ```

4. The `outcomesFor` call (line 3871) passes the round's deferrals and its planned tasks:

   ```js
     const outcomes = outcomesFor(pass, inScope, { ...shaped, findings: finalDispositions }, deferred.filter(isDeferral), roundDecisions, roundCommits, record.forced, { filed, dropped, held: heldIds, planned: new Set(inScope.map((f) => f.id).filter(plannedTask)) })
   ```

5. In `outcomesFor` (line 2864), `const { filed = {}, dropped = {}, held = new Set() } = filing || {}` becomes `const { filed = {}, dropped = {}, held = new Set(), planned = new Set() } = filing || {}`, and `shipsNothing` (line 2877) becomes

   ```js
       const shipsNothing = Boolean(deferredItem) && !hasMitigation(deferredItem) && !planned.has(f.id)
   ```

   with its comment (2874-2876) gaining: "A task the round planned with files for the finding is never one that ships nothing: needCommits demands its commit, and the commit is its own (#97, R1-10)."

What the plan approver and the implementer are shown (`planPrompt`'s and `ctx`'s `deferred`) stays the list as the agents returned it (#95's `plan.md`, "Replay"). Every existing scenario with a decided finding's entry has it from a `defer` override or from the resolve agent's list with a mitigation (`tests/loop-test.mjs:2506`, 2837, 2949, 2962, 3031, 3113), so no existing check should move; if one does, it is a case this trace missed: record it under Decisions in `shape.md` as a deviation, with the scenario and why.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `docs/running.md`, "Deferred items", already says a deferral you chose stays your decision and ends with where it went, and this keeps a fix you chose from being reported as one.

**Commit:** `redline: R1-10 count a decided finding as deferred only when its decision deferred it (#95)`

## Task 8: R1-1, docs/guard.md no longer names the after-run filing

`shape.md`, Decision 7.

**Files:**

- `tests/loop-test.mjs`
- `docs/guard.md`

**Test first.** In `tests/loop-test.mjs`, right after the check Task 4 added, add:

```js
  // The after-run filing is gone (#95), so the guard's docs no longer name it (#97, R1-1).
  check('statements: docs/guard.md no longer names a deferred issue filed after the run as the main session\'s prompt', !read('docs', 'guard.md').includes('filing a deferred issue after a run') && read('docs', 'guard.md').includes('The main session itself runs no `redline-gh.sh` write'), 'docs/guard.md, The hook')
```

Red: the check fails.

**Change.** In `docs/guard.md`, "The hook" (line 7), replace

```markdown
The cost is one prompt in the main session too: filing a deferred issue after a run asks once in default mode.
```

with

```markdown
The main session itself runs no `redline-gh.sh` write: since #95 a deferred item's issue is filed during the run by the GitHub agent, a Redline role, through `redline-gh.sh defer`.
```

The sentence after it ("That is why the coverage pass ...") stays.

**Docs entry:** a change to `docs/` alone, reader-facing by nature; no plugin file is touched.

**Commit:** `redline: R1-1 drop the after-run filing from the guard's docs (#95)`

## Task 9: R1-3, defer removes its temp files on every way out

`shape.md`, Decision 8.

**Files:**

- `tests/gh-test.sh`
- `scripts/redline-gh.sh`
- `docs/scripts.md`

**Test first.** In `tests/gh-test.sh`, right after the two cases and the `rm -f "$LOG"` Task 2 added, add:

```bash
# A record that is no JSON object when the entry is written (#97, R1-3): exit 1, naming the entry
# with the issue it opened, and no temp file left beside the record.
mkdir -p "$D/corrupt"
GH_FAKE_CREATE_WRITES="$D/corrupt/round-2-deferred.json" GH_FAKE_CREATE_TEXT='not json' gh defer issue R2-8 "$D/issue-R2-3.md" "$D/corrupt/round-2-deferred.json" >/dev/null 2>"$WORK/err"; code=$?
is "defer issue, a record that is no JSON object when the entry is written: exits 1, naming the issue opened" "$code $(grep -c 'https://github.com/o/r/issues/123' "$WORK/err")" "1 1"
is "defer issue, a record that is no JSON object when the entry is written: no temp file is left beside it" "$(ls -A "$D/corrupt" | grep -c '^\.redline-deferred\.')" "0"
rm -f "$LOG"
```

Red: both cases fail (`jq` stops the script under `set -e` with its own exit code and message, and the temp file stays).

**Change.** In `scripts/redline-gh.sh`:

1. Right before `defer_record` and its comment, add the cleanup:

   ```bash
   # The temp files `defer` makes, removed on every way out (#97, R1-3): the issue body, and the
   # record's next version beside it until it is moved into place. One EXIT trap names both, since a
   # later `trap ... EXIT` replaces an earlier one.
   defer_body='' defer_tmp=''
   defer_cleanup() {
       if [[ -n "$defer_body" ]]; then rm -f "$defer_body"; fi
       if [[ -n "$defer_tmp" ]]; then rm -f "$defer_tmp"; fi
   }
   ```

2. In `defer_record` (as Task 2 left it), the temp file is `defer_tmp`, and a failed write exits 1 naming what it could not record:

   ```bash
       defer_tmp="$(mktemp "$(dirname "$1")/.redline-deferred.XXXXXX")"
       if ! jq -e --arg id "$2" --argjson e "$3" 'if type == "object" then . + {($id): $e} else error("not an object") end' <<<"$current" > "$defer_tmp" 2>/dev/null; then
           echo "redline-gh.sh: $1 is no JSON object when $2's entry is written; not recorded: $3" >&2
           exit 1
       fi
       mv "$defer_tmp" "$1"
       defer_tmp=''
   ```

   in place of its `tmp` lines; `local tmp` goes, `local current='{}'` stays.

3. In the `defer)` branch, right after `[[ $# -eq 4 ]] || usage` (line 545), add `trap defer_cleanup EXIT`, `trap 'exit 130' INT` and `trap 'exit 143' TERM`, one per line, so a signal leaves through the cleanup too. The body file becomes `defer_body`: the line that makes it (line 601, `body=` and a `mktemp` under the temp directory) assigns `defer_body` instead, the body's own `EXIT` trap on the next line (602) goes, and the two uses after it (the `tail -n +3` into the body file and the `--body-file` argument) read `defer_body`.

4. The header's last sentence for `defer`, `A failed lookup or create exits 1 and writes no record`, becomes, wrapped to the header's column: "A failed lookup or create exits 1 and writes no record; so does a record that is no JSON object when the entry is written, which names the entry it could not record, the issue opened by then included." `docs/scripts.md`'s quoted header takes the same text, byte for byte.

A kill by a signal no shell can trap (`SIGKILL`) can still leave the temp file; the window is the milliseconds between `mktemp` and `mv`.

Proof: the gh harness's two cases above, and `grep -c 'trap defer_cleanup EXIT' scripts/redline-gh.sh`, which prints `1`.

**Docs entry:** `scripts/redline-gh.sh` is described in `docs/scripts.md`, its quoted header, updated in this commit.

**Commit:** `redline: R1-3 remove defer's temp files on every way out, and name what a failed record write lost (#95)`

## Task 10: R1-5, the deferTo refusal reads the merge's own word test

`shape.md`, Decision 9.

**Files:**

- `scripts/redline-prefs.sh`

**Change.** In `scripts/redline-prefs.sh`, replace the `bad_defer` line (line 441)

```bash
    bad_defer="$(jq -r 'if type == "object" and has("deferTo") and (.deferTo | IN("github", "spec", "print") | not) then (.deferTo | tojson) else "" end' <<<"$repo")"
```

with

```bash
    bad_defer="$(jq -rn --argjson repo "$repo" "$MERGE"'$repo | if type == "object" and has("deferTo") and ((.deferTo | deferToWord) == null) then (.deferTo | tojson) else "" end')"
```

and add to the comment above it (it ends "instead of falling back to GitHub (#95).") the words: "It tests the word with the merge's own `deferToWord`, so the two read one list (#97, R1-5)." `MERGE`'s definitions read `$repo` only (in `repository`), which `--argjson` supplies. A null, a number, a word in another case and an unknown word are each still refused, as today: `deferToWord` returns `null` for each.

A refactor: behaviour is unchanged, and `tests/prefs-test.sh` keeps its count (172), its `deferTo` cases (lines 66-77, the refusal of `"folder"` and of `null` included) passing as before. Proof: `grep -c 'IN("github", "spec", "print")' scripts/redline-prefs.sh` prints `0`.

**Docs entry:** `scripts/redline-prefs.sh`: no reader-facing change; its header, its output and its refusal message are unchanged.

**Commit:** `redline: R1-5 test redline.json's deferTo with the merge's own word list (#95)`

## Task 11: R1-11, filing inside Finish is grouped under Finish

`shape.md`, Decision 10.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`:

1. In the filing section, right after the check that opens `check('filing: the call is the GitHub agent\'s, named as the defer operation of the round'` (line 2875), add the neighbour:

   ```js
     check('filing: the round\'s filing call is grouped under Push and reply', filing.opts.phase === 'Push and reply', filing.opts)
   ```

2. In the end-of-run section, right after the check that opens `check('end: after the answer, Finish reads the highest posted round first, then files, then posts the held replies, then finishes'` (line 3082), add:

   ```js
     // Filing held drafts runs inside Finish, so it is grouped there (#97, R1-11).
     check('end: the filing inside Finish is grouped under Finish', (pick(filedAtEnd.calls, 'file deferred r1') || { opts: {} }).opts.phase === 'Finish', (pick(filedAtEnd.calls, 'file deferred r1') || { opts: {} }).opts)
   ```

Red: the second check fails; the first is the neighbour, green on both runs.

**Change.** In `workflows/redline-loop.js`:

1. `async function fileDeferred(pass, record, drafts) {` (line 3273) becomes `async function fileDeferred(pass, record, drafts, phaseName) {`, its call's `phase: 'Push and reply'` (line 3281) becomes `phase: phaseName`, and its comment (3264-3272) gains: "The caller names the phase: the round's own filing is part of Push and reply, the end-of-run filing part of Finish (#97, R1-11)."
2. `settleHeld`'s call (line 3379) passes `'Finish'`: `await fileDeferred(pass, record, toFile, 'Finish')`.
3. The round's call (line 3869) passes `'Push and reply'`: `await fileDeferred(pass, record, toFile, 'Push and reply')`.

A relaunch runs the script the run launched with (`agent-os/standards/workflow/replay.md:21`), so no run in flight sees the new options. Proof: `grep -c "phase: 'Push and reply', schema: DEFER_SCHEMA" workflows/redline-loop.js` prints `0`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; no doc names the phase a call is grouped under, and the labels are unchanged.

**Commit:** `redline: R1-11 group the end-of-run filing under Finish (#95)`

## Task 12: R1-12, the held replies' prompt says push is off when it is

`shape.md`, Decision 11.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in the end-of-run section, right after the check Task 11 added, add:

```js
  // With push off the round pushed nothing, and the held replies' prompt says so (#97, R1-12).
  const unpushed = await go('end: with push off, the relaunch files and finishes', { ...covArgs, push: false, deferrals: { 'R1-2': answer('file') } }, ended)
  check('end: with push off, the held replies\' prompt says push is off, not that the round pushed', unpushed.res.status === 'done' && promptOf(unpushed, 'deferred replies r1').includes('Step 1. Do not push (push is off for this run; these are the replies its deferred items waited for).'), [unpushed.res.status, unpushed.res.error, promptOf(unpushed, 'deferred replies r1').slice(0, 600)])
```

The check beside it at line 3083 (`end: the held reply says where the item went, and is posted with no push`) keeps pinning the push-on text. Red: the new check fails.

**Change.** In `workflows/redline-loop.js`, in `settleHeld`, the `pushReplyPrompt` call (line 3401) takes a reason that follows the setting:

```js
    // Step 1's reason for not pushing (#97, R1-12): the round pushed what it committed, or push is
    // off for the run, which these replies must not contradict.
    const why = push ? 'the round pushed its commits when it ended; these are the replies its deferred items waited for' : 'push is off for this run; these are the replies its deferred items waited for'
    const pushed = await run('push-and-reply', pushReplyPrompt(pass, record.specFolder, replies, false, why), {
```

With push on the text is as before, so every existing prompt is unchanged.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; the text is the GitHub agent's prompt.

**Commit:** `redline: R1-12 say push is off in the held replies' prompt when it is (#95)`

## Task 13: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-16-1358-97-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence.** The script is a transcription of those steps, so the gate text in `.claude/commands/agent-os/shape-spec.md` stays the source. Expected: loop 1254 checks passed, 0 failed; guard 601; prefs 172; gate 117; setup 512; gh 178; background 39.

10. **Docs.** Each entry above names its section or its reason: Tasks 2 and 9, `docs/scripts.md`, the quoted `redline-gh.sh` header; Tasks 3 and 8, a change to `docs/` alone; Task 4, the README's Dials, `docs/running.md` and `docs/contract.md` already say it; Tasks 5, 6, 7, 10, 11 and 12, no reader-facing change with the reason given. No config key, subcommand, allow rule or exit code is added: `defer`'s exit 1 for a failed write is the code its header already names for a failed lookup or create.
11. **Version.** Stays 0.4.0: the pull request already carries the minor bump; nothing this round changes what a setup rerun writes, and no template marker moves.
12. **Standards retrospective.** Apply only the edits the standards approver approves from `shape.md`, `## Standards retrospective (proposed)`, in their own commit after the finding commits: `redline: record the round 1 review lessons in the standards (#95)`. The files are `agent-os/standards/scripts/bash-conventions.md` and `agent-os/standards/workflow/agents.md`. When none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md`.
13. **Spec folder.** `plan.md` gains an As built section with each task's commit and its red and green counts, and any deviation is recorded under Decisions in `shape.md`, in a final commit: `redline: record review round 1 as built for PR #97 (#95)`.

**Files (steps 12 and 13):**

- `agent-os/standards/scripts/bash-conventions.md` (step 12, only the approved edits)
- `agent-os/standards/workflow/agents.md` (step 12, only the approved edits)
- `agent-os/specs/2026-11-16-1358-97-review-round-1/plan.md` (step 13)
- `agent-os/specs/2026-11-16-1358-97-review-round-1/shape.md` (step 13)
