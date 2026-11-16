# PR #94 review round 6: the kept result's limits, the verdict's label and the quoted subject

Spec folder: `agent-os/specs/2026-11-15-0822-94-review-round-6/`

Shaped by Redline in unattended mode, for review round 6 of PR #94 (issue #93, with #68 on the same branch), from the round's ten findings (`redline/round-6-review.json`, `redline/round-6-findings.json`).

- `defer`, one task each, mitigation only, in finding order: R6-2 (Task 2), R6-4 (Task 3), R6-7 (Task 4), R6-8 (Task 5). Each full fix is in `scripts/checks-template.sh` below its header, which no Redline role may change (`shape.md`, Unattended answer 7); the intended lines are under `## Deferred` in `shape.md`.
- `fix`, one task each, in finding order: R6-10 (Task 6), R6-5 (Task 7), R6-9 (Task 8, a small refactor).
- `decline`, no task and no commit: R6-1, R6-3, R6-6 (`shape.md`, `## Declined`).
- No `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Line numbers are at `9d22ff8`, the PR head this round reviewed and the working tree's HEAD. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block. No commit subject holds a bare `@word`.

Nothing in this plan touches `scripts/checks-template.sh`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, the gate's backticked text, `scripts/redline-guard.sh`, `hooks/hooks.json` or anything under `templates/`. The version stays 0.3.0 (`shape.md`, Standards Applied, process/release).

Task order matters once: Tasks 6, 7 and 8 all change `workflows/redline-loop.js`, in different functions; Task 6 and Task 7 both add to `tests/loop-test.mjs`'s mock and its round_sha/verdict section, and Task 7's anchors are as Task 6 leaves them.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-15-0822-94-review-round-6/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Tasks 6 and 7 add their checks first and see them fail on a gate run (`.claude/redline/checks.sh <snapshot>` prints the failing check names), then make the change and see them pass. Task 8 is a refactor with no new check: its neighbours are green before and after. Tasks 2 to 5 change only `README.md`.

**Expected counts.** Before this round: loop `938 checks passed, 0 failed`, guard `596 passed, 0 mismatched`, prefs `121`, gate `117`, setup `506`, gh `136`, background `39` (#68's As built, `agent-os/specs/2026-11-15-0730-68-gate-result-sized-for-the-workflow/plan.md`, "The gate"; the one commit since touches only that spec folder). This round adds three `check()` calls to the loop test (Task 6 one, Task 7 two), plus the run-record check `go()` adds for each new run that reaches Finish (Task 7's three runs; Task 6's run stops at check and adds none), so loop should read 944. No existing expectation changes. The other harnesses keep their counts. The first green gate run's counts are the evidence, recorded under As built.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-15-0822-94-review-round-6/plan.md`
- `agent-os/specs/2026-11-15-0822-94-review-round-6/shape.md`
- `agent-os/specs/2026-11-15-0822-94-review-round-6/standards.md`
- `agent-os/specs/2026-11-15-0822-94-review-round-6/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 6 spec for PR #94 (#93)`

## Task 2: R6-2 (defer), list the kept result's exposure in a shared temp directory under Known limits

`shape.md`, Decision 2; the full fix is under `## Deferred`.

**Files:**

- `README.md`

**Change.** In `README.md`, Known limits, insert a new bullet right after the bullet that opens `- **A run on this repository runs the PR's own code only when the plugin loads in place.**` (line 116) and before the bullet that opens `- **The person's last typed line reaches every agent.**` (line 117):

```markdown
- **`checks.sh`'s kept result has gaps a person is to close (#94, round 6).** Each needs a change to `scripts/checks-template.sh` below its header, which a Redline run may not make (see the bullet above), so a person makes it, regenerates `checks.sh` and restamps after the run; until then:
  - with `TMPDIR` unset, as is usual on Linux, the kept result is under `/tmp/redline-checks/`, created with the default umask, and nothing checks who owns that directory. On a host shared with other users, any of them can read every kept file (each check's command and the tail of its output, the changed paths, the commit subjects), and one who creates the directory first can replace a file between the checker's run and its verdict, so that a failing gate reads as passing when the result spilled. On a shared host, set `TMPDIR` to a directory only you can read before launching; macOS gives each user one already (R6-2).
```

**Proof:** `grep -c 'R6-2' README.md` prints `1`.

**Docs entry:** `README.md`, Known limits, updated in this task's commit. No file under the gate's Docs directories changes.

**Commit:** `redline: R6-2 list the kept result's exposure in a shared temp directory under Known limits (#93)`

## Task 3: R6-4 (defer), note under Known limits that the budget assumes UTF-8 output

`shape.md`, Decision 3; the full fix is under `## Deferred`.

**Files:**

- `README.md`

**Change.** In the bullet Task 2 added, after the R6-2 sub-bullet, add:

```markdown
  - the budget's figures (at most 22,960 bytes with every check failing, under 25 KB) assume that a byte left in a stream encodes as at most two: `jq` writes each byte that is not valid UTF-8 as three, so failing checks whose output is mostly Latin-1 or binary can reach about 28 KB. Over the Bash tool's inline limit the workflow reads the verdict, which carries no check's output (R6-4).
```

**Proof:** `grep -c 'R6-4' README.md` prints `1`.

**Docs entry:** `README.md`, Known limits, updated in this task's commit.

**Commit:** `redline: R6-4 note under Known limits that the gate's budget assumes UTF-8 output (#93)`

## Task 4: R6-7 (defer), note under Known limits that a verdict can read an earlier run's result

`shape.md`, Decision 4; the full fix is under `## Deferred`.

**Files:**

- `README.md`

**Change.** In the same bullet, after the R6-4 sub-bullet, add:

```markdown
  - a run that cannot write the kept directory keeps nothing and removes nothing, so an earlier run's file for the same commit stays, and a `--verdict` after it reads that file as its own when its mode and snapshot match, though the template's comment says it finds nothing. It needs the directory to lose its write permission between two runs at one commit, which no Redline role can cause (R6-7).
```

**Proof:** `grep -c 'R6-7' README.md` prints `1`.

**Docs entry:** `README.md`, Known limits, updated in this task's commit.

**Commit:** `redline: R6-7 note under Known limits that a verdict can read an earlier run's result (#93)`

## Task 5: R6-8 (defer), note under Known limits that a failed keep stops the gate's answer

`shape.md`, Decision 5; the full fix is under `## Deferred`.

**Files:**

- `README.md`

**Change.** In the same bullet, after the R6-7 sub-bullet, add:

```markdown
  - a failure while keeping the result (a full temp filesystem, another `checks.sh` run for the same root removing the temp file before its rename, or an entry in a shared kept directory this user cannot remove) ends the script before it prints, and the run stops at `check` though the gate passed: free the space or stop the other run, and resume (R6-8).
```

**Proof:** `grep -c 'R6-8' README.md` prints `1`.

**Docs entry:** `README.md`, Known limits, updated in this task's commit.

**Commit:** `redline: R6-8 note under Known limits that a failed keep costs the gate its answer (#93)`

## Task 6: R6-10, a verdict call that returns nothing stops under the check's label

`shape.md`, Decision 10 and Unattended answer 8.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in `mock()`, right after the line `calls.push({ label: opts.label, agentType: opts.agentType, prompt, opts })` (line 52), add:

```js
    // scenario.nothing (#94, R6-10): the labels whose call returns nothing, as an agent that was
    // skipped, stalled on every attempt or died on an API error does. No per-agent override can
    // return null: the mock falls back to its default result.
    if ((scenario.nothing || []).includes(opts.label)) {
      return null
    }
```

Then, right after the check `verdict: the record keeps the spilled result and what the verdict said` (line 920), add:

```js
  // A verdict call that returns nothing stops the run under the check's label, never the
  // verdict's, so a resume runs the gate again (#94, R6-10).
  run = await go('verdict: the verdict call returns nothing', baseArgs, { ...base, checker: onSpill(() => null), nothing: ['check r1 verdict'] })
  check('verdict: a verdict call that returns nothing stops at check, resumable from the check, never from the verdict', run.res.status === 'error' && run.res.stage === 'check' && run.res.error.includes('check r1 verdict returned nothing') && JSON.stringify(run.res.resumeFrom) === JSON.stringify({ label: 'check r1', attempt: 2 }), [brief(run), run.res.resumeFrom])
```

Red: `resumeFrom` is `{"label":"check r1 verdict","attempt":2}`.

**Change.** In `checker()` (`workflows/redline-loop.js:2962-2963`), replace

```js
  const asked = await run('check', verdictPrompt(flag, snapshot, resume[label] ? resume[label].attempt : 0), { ...opts, label: `${label} verdict` })
  lastLabel = label
```

with

```js
  // The verdict is asked on the check's behalf, so the check's label is handed back whatever the
  // call does, its own stop included: run() builds that stop from the verdict's label, and a
  // resume must run the gate again (#68; #94, R6-10).
  let asked
  try {
    asked = await run('check', verdictPrompt(flag, snapshot, resume[label] ? resume[label].attempt : 0), { ...opts, label: `${label} verdict` })
  } catch (error) {
    error.label = label
    throw error
  } finally {
    lastLabel = label
  }
```

Neighbours, green before and after: `verdict: the stop resumes from the check, never from the verdict` (line 919, an exit-2 verdict), `verdict: the verdict is the next call after the check, by the checker, under the check's label` (line 904), and `verdict: on a resumed check the verdict prompt carries the attempt, so it is asked again and never replayed` (line 922).

**Proof:** `grep -c 'error.label = label' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: `docs/contract.md`, "Exit code", already says "The stop names the check's own label, never the verdict's, so a resume runs the gate again"; the code now does so in this case too.

**Commit:** `redline: R6-10 stop under the check's label when the verdict call returns nothing (#93)`

## Task 7: R6-5, replies and the handoff quote a commit's whole subject

`shape.md`, Decision 7 and Unattended answer 9.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in `mock()`, the implementer's result (line 223, `return { commits: [], checks: { ok: true, runs: 1 }, deviations: [], blocked: [] }`) becomes:

```js
      // scenario.implementerCommits (#94, R6-5): the commits the implementer reports, by default none.
      return { commits: scenario.implementerCommits ? scenario.implementerCommits.slice() : [], checks: { ok: true, runs: 1 }, deviations: [], blocked: [] }
```

Then, right after the check `round_sha: an older checks.sh lists every commit since the start, and each round still records only its own` (line 879), add:

```js
  // A reply and the handoff quote a commit's whole subject (#94, R6-5). A checks.sh of template v3
  // cuts a subject over 100 characters for what the workflow matches, so the workflow quotes the
  // first line of the message the implementer reported for that commit when it opens with the part
  // the cut kept; a commit the implementer did not report, or one whose report does not open so,
  // is quoted as the git block gave it, and the round records git's own text either way.
  const whole = 'redline: R1-1 keep the whole subject of a long commit in the reply and in the handoff list of commits (#93)'
  const cutSubject = 'redline: R1-1 keep the whole subject of a long commit in the reply and in the handoff list of...'
  const longCut = { reviews: [[f('R1-1', 'correctness')], []], commitIds: [[cutSubject]] }
  const quoted = await go('subject: the implementer reported the whole subject', baseArgs, { ...longCut, implementerCommits: [{ sha: SHA(1), finding: 'R1-1', message: whole }] })
  check('subject: the reply and the handoff quote the whole subject, and the round records git\'s cut one', quoted.res.status === 'done' && replyFor(quoted.calls, 'push and reply r1', 'R1-1').includes(`fixed in 1bbbbbb (${whole})`) && comment(quoted.calls, 'handoff comment').includes(`- 1bbbbbb ${whole}`) && quoted.res.rounds[0].commits[0].message === cutSubject, [brief(quoted), replyFor(quoted.calls, 'push and reply r1', 'R1-1')])
  const unreported = await go('subject: the implementer reported no commit', baseArgs, longCut)
  const otherText = await go('subject: the implementer reported another subject', baseArgs, { ...longCut, implementerCommits: [{ sha: SHA(1), finding: 'R1-1', message: 'redline: R1-1 a different subject that is long enough to pass the cut of one hundred characters in all (#93)' }] })
  check('subject: with no report, or one that does not open with the cut\'s kept part, the cut subject is quoted', [unreported, otherText].every((r) => r.res.status === 'done' && replyFor(r.calls, 'push and reply r1', 'R1-1').includes(`fixed in 1bbbbbb (${cutSubject})`) && comment(r.calls, 'handoff comment').includes(`- 1bbbbbb ${cutSubject}`)), [unreported, otherText].map((r) => replyFor(r.calls, 'push and reply r1', 'R1-1')))
```

`cutSubject` is what the template's `cut_subjects` makes of `whole` (107 characters): the first 101 characters end inside `commits`, so the cut falls at the space before it, and no id follows the cut. Red: the first check fails, the reply quoting `cutSubject`; the second is green before and after, and pins the fallback.

**Change.** In `workflows/redline-loop.js`:

1. Right before the comment that opens `// Every commit that carries part of a finding's fix: its own commit, and the standards commit when` (above `function replyBody`, line 1312), add:

   ```js
   // What a reply and the handoff quote for a commit (#94, R6-5): its subject as written. A checks.sh
   // of template v3 cuts a subject over 100 characters for what the workflow matches (#68), so when
   // git's subject was cut, the first line of the message the implementer reported for that commit
   // is quoted, taken only when it opens with the part the cut kept. message stays git's, and every
   // match on a commit reads git's text.
   function shownSubject(message, claimed) {
     const whole = claimed && typeof claimed.message === 'string' ? claimed.message.split('\n')[0].trim() : ''
     const kept = (message || '').lastIndexOf('...')
     return whole.length > 100 && kept > 0 && whole.startsWith(message.slice(0, kept)) ? whole : message
   }

   ```

2. In `replyBody` (line 1316), replace

   ```js
     const commits = andList(outcome.commits.map((c) => `${short(c.sha)} (${c.message})`))
   ```

   with

   ```js
     const commits = andList(outcome.commits.map((c) => `${short(c.sha)} (${c.subject || c.message})`))
   ```

3. In `revise()`, the round's commits (line 3248), replace

   ```js
         return { sha: c.sha, message: c.message, finding: claimed ? claimed.finding : '', round }
   ```

   with

   ```js
         return { sha: c.sha, message: c.message, subject: shownSubject(c.message, claimed), finding: claimed ? claimed.finding : '', round }
   ```

4. In the handoff's Commits list (line 3458), replace

   ```js
       lines.push('', '### Commits', '', ...commitsAll.map((c) => `- ${short(c.sha)} ${c.message}`))
   ```

   with

   ```js
       lines.push('', '### Commits', '', ...commitsAll.map((c) => `- ${short(c.sha)} ${c.subject || c.message}`))
   ```

`judge()` (lines 2182, 2186) reads the git block's own commits and `outcomesFor` (2604) matches on `message`, so neither changes. Neighbours, green before and after: the guided handoff check at line 347 (`fixed in 1bbbbbb`), `no inline: the reply opens with the marker and names the finding` (line 578), and the round_sha checks at lines 874-879.

**Proof:** `grep -c 'shownSubject' workflows/redline-loop.js` prints `2`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: `docs/running.md`, "Rounds" step 6 (`fixed in <sha> (...)`) and "The handoff comment" (`### Commits`), name the commit and its subject, which is again the whole subject, as before #68; `docs/contract.md`'s bullet on a commit's `message` describes `checks.sh`'s output, which does not change.

**Commit:** `redline: R6-5 quote a commit's whole subject in replies and the handoff (#93)`

## Task 8: R6-9, verdictCommand calls checkerCommand

`shape.md`, Decision 9. A small refactor: no new check.

**Files:**

- `workflows/redline-loop.js`

**Change.** In `verdictCommand` (`workflows/redline-loop.js:1926-1928`), replace

```js
  return `${CHECKS} --verdict${flag ? ` ${flag}` : ''} ${snapshot}`
```

with

```js
  return checkerCommand(flag ? `--verdict ${flag}` : '--verdict', snapshot, false)
```

The string is the same for every flag: `checkerCommand` (line 1834) writes no `REDLINE_OCTANE=1 ` when `octane` is false and puts its flag between the script and the snapshot. Neighbours, green before and after, pinning the verdict's line for each flag: `verdict: its command is checks.sh --verdict with the round's snapshot, the prompt's last line` (line 905), `verdict: a spilled baseline is read from its verdict, asked with --baseline` (line 927), `verdict: a git-only check asks for the git-only verdict` (line 931).

**Proof:** `grep -c 'return checkerCommand(flag' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: a refactor; the command the checker is given does not change.

**Commit:** `redline: R6-9 build the verdict's command line with checkerCommand (#93)`

## Task 9: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-15-0822-94-review-round-6/redline/snapshot.json` until it exits 0; its JSON is the evidence.** The script is a transcription of those steps, so the gate text in `.claude/commands/agent-os/shape-spec.md` stays the source. Expected: loop 944 checks passed, 0 failed; guard 596; prefs 121; gate 117; setup 506; gh 136; background 39.

10. **Docs.** Each entry above names its section or its reason: Tasks 2 to 5, `README.md`, Known limits, in their own commits; Tasks 6, 7 and 8, `workflows/redline-loop.js`, no reader-facing change with the reason given. No config key, subcommand, allow rule or exit code is added.
11. **Version.** Stays 0.3.0: the pull request already carries the minor bump and #68's spec keeps the version on purpose; nothing this round changes what a setup rerun writes, and no template marker moves.
12. **Standards retrospective.** Apply only the edits the standards approver approves from `shape.md`, `## Standards retrospective (proposed)`, in their own commit after the finding commits: `redline: record the round 6 review lessons in the standards (#93)`. When none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md`.
13. **Spec folder.** `plan.md` gains an As built section with each task's commit and its red and green counts, and any deviation is recorded under Decisions in `shape.md`, in a final `redline:` commit.

---

## As built

Commits, in order, on top of `9d22ff8`:

- Task 1: `643326c` redline: save review round 6 spec for PR #94 (#93)
- Task 2: `b6996dc` redline: R6-2 list the kept result's exposure in a shared temp directory under Known limits (#93). `grep -c 'R6-2' README.md` prints `1`.
- Task 3: `d522528` redline: R6-4 note under Known limits that the gate's budget assumes UTF-8 output (#93). `grep -c 'R6-4' README.md` prints `1`.
- Task 4: `edfdf8c` redline: R6-7 note under Known limits that a verdict can read an earlier run's result (#93). `grep -c 'R6-7' README.md` prints `1`.
- Task 5: `1b483ab` redline: R6-8 note under Known limits that a failed keep costs the gate its answer (#93). `grep -c 'R6-8' README.md` prints `1`.
- Task 6: `62d25d9` redline: R6-10 stop under the check's label when the verdict call returns nothing (#93). Red: loop `938 checks passed, 1 failed`, the new check's `resumeFrom` `{"label":"check r1 verdict","attempt":2}`. Green: `939 checks passed, 0 failed`. `grep -c 'error.label = label' workflows/redline-loop.js` prints `1`.
- Task 7: `66a7931` redline: R6-5 quote a commit's whole subject in replies and the handoff (#93). Red: loop `943 checks passed, 1 failed`, the reply quoting the cut subject; the fallback check green. Green: `944 checks passed, 0 failed`. `grep -c 'shownSubject' workflows/redline-loop.js` prints `2`.
- Task 8: `9d946fc` redline: R6-9 build the verdict's command line with checkerCommand (#93). Loop `944 checks passed, 0 failed` before and after; the verdict-line checks unchanged. `grep -c 'return checkerCommand(flag' workflows/redline-loop.js` prints `1`.
- Standards retrospective: `53ce886` redline: record the round 6 review lessons in the standards (#93). The three approved edits (`workflow/agents.md` line 44, `testing/tests.md` line 15, `scripts/bash-conventions.md` line 45), as worded. Each is a lesson that carries no part of a finding's fix, so the message names no finding.

The gate (Task 9), the last run before this commit, at `53ce886`: `ok: true`, no failing check, `git.unexpected_files` and `git.uncommitted` empty. Loop `944 checks passed, 0 failed`; guard `596 passed, 0 mismatched`; prefs `121`; gate `117`; setup `506`; gh `136`; background `39`. The counts match the plan's expectation.

Deviations:

- Task 6's check holds its run in `const silent` instead of reassigning `run` as the plan's snippet does. The check after it, `verdict: the relaunch reruns the check and asks again`, builds its resume from `run.res.error` and compares its verdict prompt with `pick(run.calls, 'check r1 verdict')`, both meant to be the stale-verdict run above it; reassigning `run` would have moved that relaunch onto the new run. Behaviour and counts are as planned, and no existing expectation changes.
