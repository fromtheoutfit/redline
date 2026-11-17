# PR #97 review round 2: a deferral's record, its entry and its planned task, read whole

Spec folder: `agent-os/specs/2026-11-16-1358-97-review-round-2/`

Shaped by Redline in unattended mode, for review round 2 of PR #97 (issue #95), from the round's sixteen findings (`redline/round-2-review.json`, `redline/round-2-findings.json`).

- `fix`, one task each, in finding order: R2-1 (Task 2), R2-6 (Task 3), R2-12 (Task 4), R2-13 (Task 5), R2-14 (Task 6), R2-3 (Task 7), R2-4 (Task 8), R2-5 (Task 9), R2-11 (Task 10), R2-16 (Task 11).
- `ask`, decided by the person: R2-15 (Task 12), mitigate now, defer the full fix (`shape.md`, Decision 7). Task 12 is its mitigation; its drafted issue is under `## Deferred` in `shape.md`, and the run files it.
- `decline`, no task: R2-2, R2-7, R2-8, R2-9, R2-10 (`shape.md`, `## Declined`).
- No `defer` of Redline's own.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every commit message names the finding and ends `(#95)`. Line numbers are at `54b13f1`, the working tree's HEAD. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block. No commit subject holds a bare `@word`.

Nothing in this plan touches `scripts/checks-template.sh`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, the gate's backticked text, `scripts/redline-guard.sh`, `hooks/hooks.json`, any agent file or anything under `templates/`. The version stays 0.4.0 (`shape.md`, Standards Applied, process/release).

Task order matters. Tasks 3, 4, 5 and 6 all change `revise()` in `workflows/redline-loop.js`: Task 3 adds a line after `plannedTask` and changes the `outcomesFor` call's `planned`; Task 4 changes the line that sets `fresh` in `resolveWith`; Task 5 adds a check after the `undrafted` check; Task 6 rewrites `plannedTask` and `needCommits` and adds a line before `for (const item of fresh) {`. Tasks 7 and 8 both add a check at the end of the loop test's statements block, in that order, and both change `skills/redline/SKILL.md`. Tasks 5, 8, 9 and 11 each change a different bullet of `docs/running.md`. Task 12 changes `resolvePrompt`, which no other task touches, and adds a check in the filing section right after R1-10's first check, above the anchor Task 6 uses. Each task's anchors are as the tasks before it leave them.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-16-1358-97-review-round-2/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds a case (2 to 9, 11) makes the test change first and sees it fail on a gate run (`.claude/redline/checks.sh <snapshot>` prints the failing check names), then makes the change and sees it pass. A check named as the neighbour that must not change is green on both runs. Task 10 changes a comment only: its proof grep and the green gate run are its evidence.

**Expected counts.** Before this round (round 1's As built): loop `1254 checks passed, 0 failed`, guard `601 passed, 0 mismatched`, prefs `172`, gate `117`, setup `512`, gh `178`, background `39`. This round adds: gh 1 (Task 2), so gh reads 179; loop 2 (Task 3: one check, one run that reaches Finish), 4 (Task 4: two checks, two runs that reach Finish), 1 (Task 5: one check; its run ends in an error), 3 (Task 6: two checks, one run that reaches Finish), 1 (Task 7), 1 (Task 8), 4 (Task 9: two checks, two runs that reach Finish), 2 (Task 11: one check, one run that reaches Finish), 1 (Task 12: one check on a run that already exists), so loop reads 1273. `go()` adds one run-record check for each run that reaches Finish (`tests/loop-test.mjs:339-344`), so a red run that stops elsewhere counts fewer. The other harnesses keep their counts. If a count differs, the first green gate run's counts are the evidence, recorded under As built with the reason, and as a deviation under Decisions in `shape.md`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-16-1358-97-review-round-2/plan.md`
- `agent-os/specs/2026-11-16-1358-97-review-round-2/shape.md`
- `agent-os/specs/2026-11-16-1358-97-review-round-2/standards.md`
- `agent-os/specs/2026-11-16-1358-97-review-round-2/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 2 spec for PR #97 (#95)`

## Task 2: R2-1, every failed write of the record after the create names the entry

`shape.md`, Decision 1.

**Files:**

- `tests/gh-test.sh`
- `scripts/redline-gh.sh`
- `docs/scripts.md`

**Test first.** In `tests/gh-test.sh`, right after the two cases that open `is "defer issue, a record that is no JSON object when the entry is written:` (lines 460-461) and the `rm -f "$LOG"` after them (line 462), add:

```bash
# A record that cannot be written once the issue is open (#97, R2-1): its folder is a file, so
# making it fails after the create; exit 1, naming the entry with the issue it opened.
printf 'not a folder\n' > "$D/blocked"
gh defer issue R2-8 "$D/issue-R2-3.md" "$D/blocked/round-2-deferred.json" >/dev/null 2>"$WORK/err"; code=$?
is "defer issue, a record whose folder cannot be made once the issue is open: exits 1, naming the issue opened" "$code $(grep -c 'not recorded: .*https://github.com/o/r/issues/123' "$WORK/err")" "1 1"
rm -f "$LOG"
```

Red: the case reads `1 0` (`mkdir -p` stops the script under `set -e` with only its own message).

**Change.** In `scripts/redline-gh.sh`:

1. Right before the comment that opens `# defer_record <record file> <finding> <entry>:` (line 185), add:

   ```bash
   # defer_lost <record file> <finding> <entry> <what is wrong>: a write of the record that failed
   # after the lookup or the create on GitHub, so the issue opened by then may be in no record: one
   # line naming the entry it could not record, never a tool's own message alone, and exit 1 (#97,
   # R1-3, R2-1).
   defer_lost() {
       echo "redline-gh.sh: $1 $4 when $2's entry is written; not recorded: $3" >&2
       exit 1
   }

   ```

2. Replace the body of `defer_record` (lines 189-202, from `defer_record() {` to its closing `}`) with:

   ```bash
   defer_record() {
       local current='{}'
       if ! mkdir -p "$(dirname "$1")" || ! defer_tmp="$(mktemp "$(dirname "$1")/.redline-deferred.XXXXXX")"; then
           defer_lost "$1" "$2" "$3" "cannot be written"
       fi
       if [[ -f "$1" ]]; then
           if ! current="$(cat "$1")"; then
               defer_lost "$1" "$2" "$3" "cannot be read"
           fi
       fi
       if ! jq -e --arg id "$2" --argjson e "$3" 'if type == "object" then . + {($id): $e} else error("not an object") end' <<<"$current" > "$defer_tmp" 2>/dev/null; then
           defer_lost "$1" "$2" "$3" "is no JSON object"
       fi
       if ! mv "$defer_tmp" "$1"; then
           defer_lost "$1" "$2" "$3" "cannot be moved into place"
       fi
       defer_tmp=''
   }
   ```

   and the comment above it (lines 185-188) gains a last sentence, wrapped to the comment's width: "Every step that can fail exits through defer_lost, which names the entry (#97, R2-1)." The `jq` branch's message reads as round 1 left it (`<record> is no JSON object when <finding>'s entry is written; not recorded: <entry>`), so R1-3's case is unchanged. `mkdir`, `mktemp`, `cat` and `mv` still print their own message first; `defer_lost` adds the line that names the entry. The `EXIT` trap (`defer_cleanup`) removes the temp file on every way out, as before.

3. In the header's `defer` entry, the last three lines (129-131)

   ```
   #                                  that is no JSON object when the entry is written, which names
   #                                  the entry it could not record, the issue opened by then
   #                                  included
   ```

   become

   ```
   #                                  that cannot be read, written or moved into place, or is no JSON
   #                                  object, when the entry is written, which names the entry it
   #                                  could not record, the issue opened by then included
   ```

In `docs/scripts.md`, the quoted `redline-gh.sh` header takes the same three lines in place of its own (lines 139-141), byte for byte as the script's header.

Proof: `grep -c 'defer_lost "' scripts/redline-gh.sh` prints `4`, and `grep -c 'or is no JSON' docs/scripts.md` prints `1`.

**Docs entry:** `scripts/redline-gh.sh` is described in `docs/scripts.md`, its quoted header, updated in this commit. No new exit code: exit 1 is the code the header already names for a failed lookup, create or write.

**Commit:** `redline: R2-1 name the entry on every failed write of the deferred record (#95)`

## Task 3: R2-6, a task the shaper planned with files for its own deferral is planned

`shape.md`, Decision 3 and Unattended answer 10.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in the defer section, right after the check that opens `check('defer: a mitigation that only begins with "nothing ships now" still ships, is demanded and buys the round'` (line 2835), add:

```js
  // A task the shaper planned with files for its own deferral is a task the round planned (#97,
  // R2-6): its commit is the item's, never zeroed as shipping nothing, so it is posted and the final
  // nit pass reads it. The runs above with no files keep the zeroing.
  const plannedBare = await go('defer: the shaper plans a task with files for a deferral that ships nothing', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], mitigations: { 'R1-1': '' }, files: { 'R1-1': ['app/x.php'] }, commitIds: [['R1-1']] })
  check('defer: a commit for a task the shaper planned with files is posted with the item and read by the final nit pass', plannedBare.res.status === 'done' && replyFor(plannedBare.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: deferred to #301. Mitigated in 1bbbbbb (redline: R1-1 fix). · decided by: redline' && (plannedBare.res.rounds[1] || {}).reviewed === 'final-nit-pass', [plannedBare.res.status, plannedBare.res.error, replyFor(plannedBare.calls, 'push and reply r1', 'R1-1'), plannedBare.res.rounds.map((r) => r.reviewed)])
```

Red: the check fails (the reply reads `Redline round 1: deferred to #301. · decided by: redline` and the run hands off after round 1). The word loop above it (line 2826 onward), whose runs list no files, is the neighbour, green on both runs.

**Change.** In `workflows/redline-loop.js`, in `revise()`:

1. Right after the line `const plannedTask = (id) => Boolean(resolved) && resolved.tasks.some((task) => task.finding === id && task.files.length > 0)` (line 3679), add:

   ```js
     // A task the shaper planned with files for one of its own deferrals (#97, R2-6): a finding's
     // `files` are the paths its task touches (the shaper's schema), so a deferral listed with files
     // has a task whatever its mitigation says, and the commit that task makes is the item's, never
     // zeroed as shipping nothing. A finding the person or autopilot decided is read from the
     // resolve's tasks instead (plannedTask), whatever the shaper listed for it. Nothing new is
     // demanded of the gate: a deferral with no mitigation still demands no commit.
     const shaperPlanned = (id) => !roundDecisions[id] && shaped.findings.some((s) => s.id === id && s.disposition === 'defer' && Array.isArray(s.files) && s.files.length > 0)
   ```

2. In the `outcomesFor` call (line 3904), `planned: new Set(inScope.map((f) => f.id).filter(plannedTask))` becomes `planned: new Set(inScope.map((f) => f.id).filter((id) => plannedTask(id) || shaperPlanned(id)))`.

Proof: `grep -c 'plannedTask(id) || shaperPlanned(id)' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `docs/running.md`, Dispositions, `defer`, already says a mitigation becomes the task and the commit, and this keeps a planned task's commit from being dropped from the reply.

**Commit:** `redline: R2-6 count a task the shaper planned for its own deferral as planned (#95)`

## Task 4: R2-12, one deferred entry per finding, the first

`shape.md`, Decision 4 and Unattended answer 11.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`:

1. The scripted shaper gains `deferTwice`: the ids whose entry it returns twice, the second with another `found`. In the `deferred:` list, the line that closes its `.map(` (line 238, `        })),`) becomes

   ```js
           })).flatMap((entry) => ((scenario.deferTwice || []).includes(entry.id) ? [entry, { ...entry, found: `${entry.found} again` }] : [entry])),
   ```

   and the comment above the list (it ends `unless scenario.noDraft names the finding, a` / `shape-stage error.`) gains a sentence: "scenario.deferTwice (#97, R2-12) returns a finding's entry twice, the second with another found." No existing scenario sets the key, so no other run changes.

2. In the filing section, right after the check that opens `check('filing: no draft carries a model or vendor name'` (line 2893), add:

   ```js
     // One deferred entry per finding (#97, R2-12): a second entry the shaper or the resolve agent
     // returns for the same id is dropped with a warning, so one draft, the first, is filed and listed.
     const twice = await go('filing: the shaper returns two entries for one deferral', filedArgs, { ...scenario, deferTwice: ['R1-1'] })
     check('filing: two shaper entries for one finding file one draft, the first, listed once, with a warning', twice.res.status === 'done' && draftsOf(twice).length === 1 && (draftsOf(twice)[0] || {}).content === (entry || {}).content && (twice.res.deferred || []).length === 1 && handoffOf(twice).includes('### Deferred (1)\n') && (twice.res.warnings || []).includes('round 1: the shaper listed R1-1 as deferred more than once; the first entry is kept'), [twice.res.status, twice.res.handoffKind, draftsOf(twice).length, twice.res.warnings])
     const twiceResolved = await go('filing: the resolve agent returns two entries for one deferral the person chose', { ...filedArgs, interrupt: 'plan', approvedPlans: [1], decisions: { 'R1-1': { choice: 'defer', notes: 'Defer it behind a log line.', date: '2026-11-16', disposition: 'defer' } } }, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']], resolveDeferred: [{ id: 'R1-1', mitigation: 'a log line', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }, { id: 'R1-1', mitigation: 'a log line', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1 again', why: 'why R1-1' }] })
     check('filing: two resolve entries for one finding file one draft, the first, with a warning', twiceResolved.res.status === 'done' && draftsOf(twiceResolved).length === 1 && ((draftsOf(twiceResolved)[0] || {}).content || '').includes('\nfound R1-1\n') && (twiceResolved.res.deferred || []).length === 1 && (twiceResolved.res.warnings || []).includes('round 1: the resolve agent listed R1-1 as deferred more than once; the first entry is kept'), [twiceResolved.res.status, twiceResolved.res.handoffKind, draftsOf(twiceResolved).length, twiceResolved.res.warnings])
   ```

Red: both checks fail: the second entry is a second version of the draft, which the answer for version 1 does not cover, so each run stops at a hand-off for it.

**Change.** In `workflows/redline-loop.js`:

1. Right after `draftMissing` (line 779), add:

   ```js
   // One deferred entry per finding (#97, R2-12): the first an agent returned, which checkDrafts and
   // outcomesFor read (both take the first with find), and the ids it returned more than once. A
   // second entry would be a second draft, a second filing over the first's file and a second line
   // under Deferred.
   function firstPerId(list) {
     const seen = new Set()
     const repeated = []
     const kept = (list || []).filter((item) => {
       if (seen.has(item.id)) {
         repeated.push(item.id)
         return false
       }
       seen.add(item.id)
       return true
     })
     return { kept, repeated: unique(repeated) }
   }
   ```

2. In `checkDispositions`, right after the stray-entry block's closing `}` (line 3004, after `shaped.deferred = shaped.deferred.filter((d) => deferredIds.has(d.id))`) and before the function's own closing `}`, add:

   ```js
     // One entry per deferred finding (#97, R2-12): the first, with a warning.
     const once = firstPerId(shaped.deferred)
     if (once.repeated.length) {
       warnings.push(`${pass.name}: the shaper listed ${once.repeated.join(', ')} as deferred more than once; the first entry is kept`)
       shaped.deferred = once.kept
     }
   ```

3. In `resolveWith`, the line `const fresh = out.deferred.filter((item) => !record.forced[item.id])` (line 3661) becomes:

   ```js
       const once = firstPerId(out.deferred.filter((item) => !record.forced[item.id]))
       if (once.repeated.length) {
         warnings.push(`${pass.name}: the resolve agent listed ${once.repeated.join(', ')} as deferred more than once; the first entry is kept`)
       }
       const fresh = once.kept
   ```

   The comment above it is unchanged.

`checkDispositions` runs inside `vetShape` after every shape and reshape, so the count of checks `vetShape` names stays eight (Task 10).

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; one entry per deferred finding is already the shaper's contract (the unattended section's point 10) and the resolve agent's, and the warning is the run's own.

**Commit:** `redline: R2-12 keep one deferred entry per finding, the first (#95)`

## Task 5: R2-13, a defer override with no entry stops at resolve

`shape.md`, Decision 5.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`, in the defer section, right after the check that opens `check('defer: the resolve prompt asks for the draft of a deferral the person chose'` (line 2844), add:

```js
  // A defer override the resolve agent returns no entry for stops there too (#97, R2-13): it would
  // be neither drafted nor filed, and its reply would close the person's deferral with no issue.
  const unentered = await go('defer: the resolve agent returns no entry for a deferral the person chose', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: override }, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('defer: a defer override with no deferred entry stops at resolve, resumable there', unentered.res.status === 'error' && unentered.res.stage === 'resolve' && unentered.res.error === 'the resolve agent returned no deferred entry for R1-1, which a disposition override deferred; a deferred item always carries a drafted issue' && Boolean(unentered.res.resumeFrom) && unentered.res.resumeFrom.label === 'resolve r1', [unentered.res.status, unentered.res.error, unentered.res.resumeFrom])
```

`override` is the constant defined two checks above it. Red: the check fails (the run finishes, posting the person's deferral with no issue). The filing run with an entry (`check('filing: a deferral the person chose is filed, and its reply ends with where it went, as their decision'`, line 2962) is the neighbour, green on both runs.

**Change.** In `workflows/redline-loop.js`, in `resolveWith`, right after the `undrafted` check's closing `}` (line 3666) and before `for (const item of fresh) {`, add:

```js
    // A deferral the person chose by a disposition override comes back with its entry (#97,
    // R2-13): one the resolve agent left out would be neither drafted nor filed, and its reply would
    // close the person's deferral with no issue and no warning. An entry the round already holds
    // for it (the shaper's own deferral) stands in, as it does when the resolve returns none.
    const unentered = newOverrides.filter((f) => roundDecisions[f.id].disposition === 'defer' && !fresh.some((item) => item.id === f.id) && !deferred.some((d) => d.id === f.id))
    if (unentered.length) {
      throw stageError('resolve', `the resolve agent returned no deferred entry for ${unentered.map((f) => f.id).join(', ')}, which a disposition override deferred; a deferred item always carries a drafted issue`)
    }
```

A finding a repository ask rule covers has its decision's `disposition` deleted at the top of `resolveWith`, so it never trips this check.

In `docs/running.md`, Deferred items, "The draft" bullet (line 124), after the sentence `No model or vendor name is in a draft.` add:

```markdown
A deferral you chose comes back from the resolve agent with its draft: one that comes back without it, or with no entry at all, stops the run at stage `resolve`, resumable there.
```

Proof: `grep -c 'which a disposition override deferred' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, Deferred items, The draft, updated in this commit.

**Commit:** `redline: R2-13 stop at resolve when a deferral the person chose comes back with no entry (#95)`

## Task 6: R2-14, the round's planned tasks are every resolve's

`shape.md`, Decision 6 and Unattended answer 12.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in the filing section, right after the check that opens `check('filing: a call answered with a deferral that ships nothing, with no task, is still filed as the person\'s deferral'` (line 2972), add:

```js
  // Every resolve of the round planned tasks (#97, R2-14): a reshape that raises a call runs a
  // second resolve for that call alone, and the first resolve's tasks still count, for the task a
  // stray entry stands beside and for the commits the gate demands.
  const strayRaised = await go('filing: the resolve agent defers a call it planned as a fix, then a reshape raises a call', { ...baseArgs, interrupt: 'autopilot' }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeAsk: ['R1-2'], resolveDeferred: [{ id: 'R1-1', mitigation: '', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }], commitIds: [['R1-1', 'R1-2']] })
  check('filing: after a reshape\'s resolve, a stray entry beside the first resolve\'s fix files nothing, and the fix is posted as applied', strayRaised.res.status === 'done' && labels(strayRaised.calls).includes('resolve r1 #1') && !labels(strayRaised.calls).includes('file deferred r1') && (replyFor(strayRaised.calls, 'push and reply r1', 'R1-1') || '').includes(' Applied in ') && !(replyFor(strayRaised.calls, 'push and reply r1', 'R1-1') || '').includes('Deferred to'), [strayRaised.res.status, labels(strayRaised.calls), replyFor(strayRaised.calls, 'push and reply r1', 'R1-1')])
  const unbuilt = await go('filing: a reshape raises a call and the first resolve\'s task is not built', { ...baseArgs, interrupt: 'autopilot' }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeAsk: ['R1-2'], commitIds: [['R1-2'], []] })
  check('filing: after a reshape\'s resolve, the gate still demands the commit of the first resolve\'s task', unbuilt.res.status === 'error' && unbuilt.res.stage === 'check' && (unbuilt.res.error || '').includes('no commit names R1-1'), [unbuilt.res.status, unbuilt.res.stage, unbuilt.res.error])
```

Red: both checks fail: the first run files R1-1 and replies `No code change. Deferred to #301.`, and the second finishes with no commit for R1-1 demanded. R1-10's three runs above it, which raise no call on a reshape, are the neighbours, green on both runs.

**Change.** In `workflows/redline-loop.js`, in `revise()`:

1. Right after `let resolved = null` (line 3617), add:

   ```js
     // Every task the round's resolves planned (#97, R2-14): a reshape that raises a call runs a
     // resolve for that call alone and `resolved` becomes it, so what the round planned is read from
     // every resolve's tasks, never from the latest one's.
     const resolvedTasks = []
   ```

2. In `resolveWith`, right before `for (const item of fresh) {` (after the check Task 5 added), add `resolvedTasks.push(...out.tasks)` on a line of its own.

3. `plannedTask` and its comment (lines 3678-3679)

   ```js
     // A task the round's resolve planned with files for a finding: what needCommits demands.
     const plannedTask = (id) => Boolean(resolved) && resolved.tasks.some((task) => task.finding === id && task.files.length > 0)
   ```

   become

   ```js
     // A task one of the round's resolves planned with files for a finding: what needCommits demands.
     const plannedTask = (id) => resolvedTasks.some((task) => task.finding === id && task.files.length > 0)
   ```

4. In `needCommits` (line 3827), the line

   ```js
       .concat(resolved ? resolved.tasks.filter((task) => task.files.length && task.finding && !accepted.has(task.finding) && !record.forced[task.finding]).map((task) => task.finding) : [])
   ```

   becomes

   ```js
       .concat(resolvedTasks.filter((task) => task.files.length && task.finding && !accepted.has(task.finding) && !record.forced[task.finding]).map((task) => task.finding))
   ```

No existing scenario reaches the gate after a reshape's resolve with a first resolve's task left unbuilt (the reshape runs that raise a call stop at that call, or have no first resolve), so no existing check should move; if one does, it is a case this trace missed: record it under Decisions in `shape.md` as a deviation, with the scenario and why.

Proof: `grep -c 'resolved.tasks' workflows/redline-loop.js` prints `0`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; no doc says which of a round's resolves plans the tasks the gate demands, and the round now counts every one.

**Commit:** `redline: R2-14 read the round's planned tasks from every resolve it ran (#95)`

## Task 7: R2-3, a print-mode body is fenced longer than any fence in it

`shape.md`, Decision 8.

**Files:**

- `tests/loop-test.mjs`
- `skills/redline/SKILL.md`

**Test first.** In `tests/loop-test.mjs`, at the end of the statements block, right after the check that opens `check('statements: docs/guard.md no longer names a deferred issue filed after the run as the main session\'s prompt'` (line 3312) and before the block's closing `}` (line 3313), add:

```js
  // A draft's body can hold a code fence, so the session prints it in a longer one (#97, R2-3).
  const fence = 'in a fenced block whose fence is one backtick longer than the longest run of backticks in the body, and at least three'
  const doneSection = ((read('skills', 'redline', 'SKILL.md').split('### `done`')[1] || '').split('### `capped`')[0]) || ''
  check('statements: the skill prints a print-mode draft\'s body in a fence longer than any run of backticks in it, when the run ends and at the cap', doneSection.includes(fence) && capped.includes(fence) && !read('skills', 'redline', 'SKILL.md').includes('in a fenced block, both exactly as given'), 'skills/redline/SKILL.md, done and capped')
```

`capped` is the constant R1-6's check defined earlier in the block. Red: the check fails.

**Change.** In `skills/redline/SKILL.md`, the `done` section (line 264) and the `capped` section (line 268) each hold

```markdown
then `draft.body` in a fenced block, both exactly as given
```

Replace both with

```markdown
then `draft.body` in a fenced block whose fence is one backtick longer than the longest run of backticks in the body, and at least three, both exactly as given
```

Proof: `grep -c 'in a fenced block, both exactly as given' skills/redline/SKILL.md` prints `0`.

**Docs entry:** `skills/redline/SKILL.md`: no reader-facing change; the README's Dials and `docs/running.md`, "Where a draft goes", say a print-mode draft's title and body are printed when the run ends, which stays true; the fence is how the session prints them.

**Commit:** `redline: R2-3 fence a printed draft body longer than any fence in it (#95)`

## Task 8: R2-4, a headless run that must not stop uses autopilot

`shape.md`, Decision 9 and Unattended answer 6.

**Files:**

- `tests/loop-test.mjs`
- `docs/running.md`
- `skills/redline/SKILL.md`

**Test first.** In `tests/loop-test.mjs`, right after the check Task 7 added, add:

```js
  // A headless run stops where its dial does, a draft's stop included (#97, R2-4).
  const headless = 'a headless run that must not stop uses `autopilot`'
  check('statements: the docs and the skill say a headless run that must not stop uses autopilot', read('docs', 'running.md').includes(headless) && read('skills', 'redline', 'SKILL.md').includes(headless), 'docs/running.md, Saved launch settings; skills/redline/SKILL.md, section 3')
```

Red: the check fails.

**Change.**

1. In `docs/running.md`, Saved launch settings, "The words" bullet (line 198), after the sentence that ends `then the defaults, which for \`deferTo\` is the repository's, else a GitHub issue.` add:

   ```markdown
   It still stops where its dial does: on every dial but `autopilot`, at a judgment call and at a round that defers anything (with `defer at end`, once before the handoff), since each draft is shown before it is filed, so a headless run that must not stop uses `autopilot`.
   ```

2. In `skills/redline/SKILL.md`, the paragraph that opens `A headless session (\`claude -p\`) has no \`AskUserQuestion\`:` (line 79), after its first sentence (it ends `and say so in one line.`) add:

   ```markdown
   When the dial is not `autopilot`, say in that line too that the run still stops at a judgment call and at a deferred item's draft, so a headless run that must not stop uses `autopilot`.
   ```

   The sentence after it (`Pass every setting on the command line when a headless run must not rely on the saved file.`) stays.

**Docs entry:** `skills/redline/SKILL.md`: `docs/running.md`, Saved launch settings, The words, updated in this commit, beside the skill's own line.

**Commit:** `redline: R2-4 say a headless run that must not stop uses autopilot (#95)`

## Task 9: R2-5, a draft's Where line names a place that exists

`shape.md`, Decision 10.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`, in the filing section, right after the checks Task 4 added (after the check that opens `check('filing: two resolve entries for one finding file one draft, the first, with a warning'`), add:

```js
  // The Where line names a place that exists (#97, R2-5): a finding minted with no file has none,
  // and a file with no line is named alone.
  const unplaced = await go('filing: a deferral of a finding with no file', filedArgs, { ...scenario, reviews: [[f('R1-1', 'correctness', { file: '(no file)', line: 0 }), f('R1-2', 'nit')], []] })
  check('filing: a finding with no file has no Where line in its draft', ((draftsOf(unplaced)[0] || {}).content || '') === '# Lock R1-1\n\nfound R1-1\n\n- **Why it is not fixed in #114:** why R1-1\n- **Proposed fix:** a lock\n\nDeferred from pull request #114 by Redline (round 1, finding R1-1).\n', [unplaced.res.status, unplaced.res.error, (draftsOf(unplaced)[0] || {}).content])
  const lineless = await go('filing: a deferral of a finding with a file and no line', filedArgs, { ...scenario, reviews: [[f('R1-1', 'correctness', { line: 0 }), f('R1-2', 'nit')], []] })
  check('filing: a finding with a file and no line names the file alone', ((draftsOf(lineless)[0] || {}).content || '').includes('\n- **Where:** `app/x.php`\n'), [lineless.res.status, (draftsOf(lineless)[0] || {}).content])
```

Red: both checks fail (the drafts read `` `(no file):0` `` and `` `app/x.php:0` ``). The filing check that opens `check('filing: the draft is the title, an empty line, what was found, where,` (line 2885), with a file and a line, is the neighbour, green on both runs.

**Change.** In `workflows/redline-loop.js`, in `issueDraft` (line 1282), the line

```js
    ...(f && f.file ? [`- **Where:** \`${f.file}:${f.line}\``] : []),
```

becomes

```js
    ...(f && f.file && f.file !== NO_FILE ? [`- **Where:** \`${f.file}${Number.isInteger(f.line) && f.line > 0 ? `:${f.line}` : ''}\``] : []),
```

and the function's comment (it ends `gives way to the shaper's (#97, R1-8).`) gains a last sentence: "The Where line names a place that exists: none for a finding minted with no file (NO_FILE), and the file alone when the finding gives no line (#97, R2-5)." `NO_FILE` is a module constant set before any draft is composed.

In `docs/running.md`, Deferred items, "The draft" bullet (line 124), `to which it adds the file and line and a last line naming the pull request, the round and the finding` becomes `to which it adds the file and line, when the finding names a file, and a last line naming the pull request, the round and the finding`.

Proof: `grep -c 'f.file !== NO_FILE' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, Deferred items, The draft, updated in this commit.

**Commit:** `redline: R2-5 write a draft's Where line only for a place that exists (#95)`

## Task 10: R2-11, vetShape's comment counts eight checks

`shape.md`, Decision 15.

**Files:**

- `workflows/redline-loop.js`

**Change.** In `workflows/redline-loop.js`, in the comment above `vetShape` (line 3506), `then the seven checks` becomes `then the eight checks`. The rest of the comment is unchanged.

Proof: `grep -c 'the seven checks' workflows/redline-loop.js` prints `0`, and `grep -c 'the eight checks' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; a code comment.

**Commit:** `redline: R2-11 count vetShape's eight checks in its comment (#95)`

## Task 11: R2-16, the handoff names a last round of bugs in the previous round's fixes

`shape.md`, Decision 16.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`, in the fix-diff section, right after the check that opens `check('fix-diff: a bug the final nit pass finds in those fixes gets its one more pass, named the same way'` (line 3187), add:

```js
  // A round whose only correctness item is a bug in the previous round's fixes, asked about and
  // kept, bought nothing and changed nothing: the handoff says so, not that nothing was asked (#97, R2-16).
  const keptMinor = await go('fix-diff: a low finding in the fix diff, asked about and kept', { ...baseArgs, decisions: { 'R2-1': { choice: 'Keep it', notes: 'Kept as it is.', date: '2026-11-16' } } }, two([low('R2-1')], { ask: ['R2-1'], acceptedCalls: ['R2-1'], commitIds: [['R1-1'], []] }))
  check('fix-diff: the handoff after such a round names the bugs in the previous round\'s fixes, not a round that asked nothing', keptMinor.res.status === 'done' && handoffOf(keptMinor.calls).includes('Redline ran 2 review rounds; the last one verified no new correctness item to fix or ask about beyond low-severity bugs in round 1\'s fixes, which are handled like nits and buy no further round, and it committed no fix.'), [keptMinor.res.status, handoffOf(keptMinor.calls).slice(0, 400)])
```

Red: the check fails (the handoff opens with the generic sentence). The generic sentence's checks (`tests/loop-test.mjs`, lines 493, 1235, 2549, 2570 and 2696) are the neighbours, green on both runs.

**Change.** In `workflows/redline-loop.js`:

1. In the main loop, the two lines (4797-4798)

   ```js
         const noRecheck = outcome.bought
         const finished = await finish('handoff', record, (prBody, threads) => handoffComment(noRecheck ? { noRecheck: true } : {}, prBody, threads))
   ```

   become

   ```js
         const noRecheck = outcome.bought
         // A round whose correctness items included low-severity bugs in the previous round's fixes,
         // handled like nits, bought nothing and changed nothing: the handoff names them, since the
         // generic sentence says the round verified nothing to fix or ask about (#97, R2-16).
         const likeNits = !noRecheck && (record.minor || []).length > 0
         const finished = await finish('handoff', record, (prBody, threads) => handoffComment(noRecheck ? { noRecheck: true } : likeNits ? { likeNits: true } : {}, prBody, threads))
   ```

2. In `handoffComment`, the comment above the opening sentence (lines 3992-3995) ends `` `ending.notPicked` a review dial with nothing picked. ``; it gains: "`ending.likeNits` a round that bought nothing and committed no fix whose correctness items included low-severity bugs in the previous round's fixes, which the generic sentence would say it never asked about (#97, R2-16)."

3. In `handoffComment`, right before the final `} else {` whose branch pushes the generic sentence (line 4016), after the `end.notPicked` branch, add:

   ```js
     } else if (end.likeNits) {
       lines.push(`${ran}; the last one verified no new correctness item to fix or ask about beyond low-severity bugs in round ${last.round - 1}'s fixes, which are handled like nits and buy no further round, and it committed no fix.`)
   ```

   A minor finding exists only on a fix-diff round, so `last.round` is 2 or more.

In `docs/running.md`, The handoff comment, "The opening sentence" bullet (line 162), `it verified no new correctness item to fix or ask about;` becomes `it verified no new correctness item to fix or ask about; or none beyond low-severity bugs in the previous round's fixes, which are handled like nits, and it committed no fix;`.

Proof: `grep -c 'likeNits' workflows/redline-loop.js` prints `4`.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, The handoff comment, The opening sentence, updated in this commit.

**Commit:** `redline: R2-16 open the handoff with the bugs in the last round's fixes when they bought nothing (#95)`

## Task 12: R2-15 (defer, the person's), its mitigation: the resolve prompt says when a deferred entry is returned

`shape.md`, Decision 7 (decided by the person: Option 2, mitigate now, defer the full fix) and `## Deferred`. This task is the mitigation, the only change the round ships for R2-15. Its full fix (the resolve agent names the disposition each decision ends in, and `isDeferral` reads it) is the drafted issue under `## Deferred`, which the run files; no task here starts it, and no agent file changes.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in the filing section, right after the check that opens `check('filing: a resolve entry that ships nothing beside a call planned as a fix files nothing` (line 2968) and before the line that opens `const strayReshape = ` (line 2969), add:

```js
  // The resolve prompt says, beside the decisions, when a deferred entry is returned (#97, R2-15):
  // an entry with a mitigation beside a call planned as a fix has the shape of a "Mitigate" answer.
  check('filing: the resolve prompt of a run with a call says an entry is returned only for a decision that defers', (pick(strayResolve.calls, 'resolve r1') || { prompt: '' }).prompt.includes('Return a deferred entry for a call only when its decision defers the finding'), (pick(strayResolve.calls, 'resolve r1') || { prompt: '' }).prompt.slice(-1500))
```

`strayResolve` is R1-10's autopilot run just above it, whose resolve prompt carries the calls block; the check adds no run. An absent call reads as `''`, so the check fails and does not throw (`testing/tests.md:14`). Red: the check fails. The check on line 2968 and `check('defer: the resolve prompt asks for the draft of a deferral the person chose'` (line 2844) are the neighbours, green on both runs.

**Change.** In `workflows/redline-loop.js`, in `resolvePrompt`, the `if (calls.length) {` block (line 1995): right after the line `      json(callDecisions),` (line 2002) and before the block's closing `    )`, add two array items, an empty string and the sentence:

```js
      '',
      'Return a deferred entry for a call only when its decision defers the finding (a "mitigate" choice, or the person\'s own words saying to defer it), with its mitigation and its drafted issue; a decision that fixes the finding in full or accepts it returns none, since the workflow reads an entry beside a planned task as a deferral the person chose (#97, R2-15).',
```

The sentence is constant and the resolve prompt comes after the decisions it answers, so nothing before a stop changes (`workflow/replay`, line 6). The overrides block, which already says when an override returns an entry, is unchanged.

Proof: `grep -c 'Return a deferred entry for a call only when its decision defers the finding' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change, the text is the resolve agent's prompt, and `agents/redline-resolve.md`, step 3, already says when a deferred entry is returned.

**Commit:** `redline: R2-15 say in the resolve prompt when a deferred entry is returned (#95)`

## Task 13: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-16-1358-97-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence.** The script is a transcription of those steps, so the gate text in `.claude/commands/agent-os/shape-spec.md` stays the source. Expected: loop 1273 checks passed, 0 failed (Task 12, R2-15's chosen option, adds one); guard 601; prefs 172; gate 117; setup 512; gh 179; background 39.

10. **Docs.** Each entry above names its section or its reason: Task 2, `docs/scripts.md`, the quoted `redline-gh.sh` header; Task 5 and Task 9, `docs/running.md`, Deferred items, The draft; Task 8, `docs/running.md`, Saved launch settings, The words; Task 11, `docs/running.md`, The handoff comment, The opening sentence; Tasks 3, 4, 6, 10 and 12, no reader-facing change with the reason given; Task 7, the README's Dials and `docs/running.md` already say it. No config key, subcommand, allow rule or exit code is added: `defer`'s exit 1 for a failed write is the code its header already names.
11. **Version.** Stays 0.4.0: the pull request already carries the minor bump; nothing this round changes what a setup rerun writes, and no template marker moves.
12. **Standards retrospective.** Apply only the edits the standards approver approves from `shape.md`, `## Standards retrospective (proposed)`, in their own commit after the finding commits: `redline: record the round 2 review lessons in the standards (#95)`. The files are `agent-os/standards/workflow/agents.md`, `agent-os/standards/scripts/bash-conventions.md` and `agent-os/standards/process/docs-gate.md`. The item held for R2-15 is drafted (item 7, for the person's Option 2). When none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md`.
13. **Spec folder.** `plan.md` gains an As built section with each task's commit and its red and green counts, and any deviation is recorded under Decisions in `shape.md`, in a final commit: `redline: record review round 2 as built for PR #97 (#95)`.

**Files (steps 12 and 13):**

- `agent-os/standards/workflow/agents.md` (step 12, only the approved edits)
- `agent-os/standards/scripts/bash-conventions.md` (step 12, only the approved edits)
- `agent-os/standards/process/docs-gate.md` (step 12, only the approved edits)
- `agent-os/specs/2026-11-16-1358-97-review-round-2/plan.md` (step 13)
- `agent-os/specs/2026-11-16-1358-97-review-round-2/shape.md` (step 13)
