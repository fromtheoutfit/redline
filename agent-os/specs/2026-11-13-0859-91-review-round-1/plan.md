# PR #91 review round 1: keep the agent list an error or stopped resume passes

Spec folder: `agent-os/specs/2026-11-13-0859-91-review-round-1/`

Shaped by Redline in unattended mode, for review round 1 of PR #91 (issue #81), from the round's one finding (`redline/round-1-review.json`, `redline/round-1-findings.json`).

- **R1-1** (correctness, medium, confirmed): `fix`, Task 2. On an `error` or `stopped` marker, `redline-prefs.sh run drift` prints `drift` with the agent list the marker's own args passed. So a resume past the handoff comment leaves that comment's prompt as it was, and the comment is never posted twice. The skill, `docs/running.md`, README Known limits and the script's header (with `docs/scripts.md`) say so. Prefs cases and loop checks prove it.

There is no `defer` and no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name. Line numbers are at `1c96b8c`, the PR head this round reviewed and the working tree's HEAD. Each anchor is also named by its text. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, so it reads exactly as the file does. No commit subject holds a bare `@word`.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-13-0859-91-review-round-1/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

Expected counts:

- **Loop test.** Before this round it reads `718 checks passed, 0 failed` (the #81 spec's As built and the PR description, at `1c96b8c`). Task 2 adds seven:
  - four `check()` calls;
  - three run-record checks that `go()` adds for each run that reaches its handoff (`tests/loop-test.mjs:252-258`): the two `record commit` resumes and the `handoff comment` resume. The two runs that stop with an error add none.

  So the round ends at `725 checks passed, 0 failed`.
- **Prefs test.** `117 passed, 0 failed` before this round (the same sources; 110 helper calls and 7 inline `ok` checks in `tests/prefs-test.sh`). Task 2 adds four `runj` cases, so the round ends at `121 passed, 0 failed`.
- **Every other harness** keeps its count: guard `594 passed, 0 mismatched`, and gate, setup, gh and background as the first gate run prints them. None of them reads a file this round changes.

The first gate run's counts are the evidence, and any difference is recorded under As built.

**For the person (not a task).**

- **The PR description.** "For the reviewer", "Gate:" says the loop test passes 718 checks and the prefs test 117. After this round they are 725 and 121. A line saying that an error or stopped resume keeps the agent list would describe this round. The round writes no `pr-body.md`. The author can correct it by hand.
- **The workflow's comment on `args.drift`.** `workflows/redline-loop.js:229-231` says it is read "outside every replayed prompt". It is not committed this round (`shape.md`, Decision 4). `shape.md`, Context, has a draft wording for a hand edit after the run.
- **Run caution (#81).** Task 2 commits nothing under `workflows/` or `agents/`, so this run's next relaunch, if any, still goes by name. It commits `scripts/redline-prefs.sh`, which the skill runs live from this checkout. From the next relaunch on, `run drift` answers with the new rule: unchanged at a hand-off or `reviewed` stop, the held agent list on an error or stopped resume. The `skills/redline/SKILL.md` edit takes effect only in a new session. The temporary edit of `workflows/redline-loop.js` for the red run is restored before the commit.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commit. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-13-0859-91-review-round-1/plan.md`
- `agent-os/specs/2026-11-13-0859-91-review-round-1/shape.md`
- `agent-os/specs/2026-11-13-0859-91-review-round-1/standards.md`
- `agent-os/specs/2026-11-13-0859-91-review-round-1/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 1 spec for PR #91 (#81)`

## Task 2: R1-1, keep the agent list an error or stopped resume passes, so a resume never posts the handoff comment twice

`shape.md`: Decision 1, Proportionality, and Unattended answers 1 to 5. The handoff comment's text holds `AGENTS_CHANGED` (`workflows/redline-loop.js:244-246`, `2989-2991`), built from `args.drift.agents`. The skill sets `args.drift` afresh at every relaunch (`skills/redline/SKILL.md:226`), error and stopped resumes included. So a resume at `record files`, `record commit` or `handoff comment`, or a stopped run relaunched after the comment posted, changes the comment's prompt. Then:

- the comment is rerun with no duplicate check, since only the resumed label carries one (`resumeLine`, line 443; `tests/loop-test.mjs:1207`);
- or, at `handoff comment` itself, the duplicate check looks for the new body, which was never posted.

The fix is in `run drift`. On an `error` or `stopped` marker, the `drift` it prints keeps the agent list the marker's own `args.drift` passed (`[]` when none), and `agents` and `line` still name every changed file. `workflow` and `pinned` are computed as today. The skill keeps copying `drift` "exactly as printed".

**Files:**

- `tests/prefs-test.sh`: the `# run drift (#81)` section, sixteen lines inserted after line 309.
- `tests/loop-test.mjs`: section 17, twenty-one lines inserted after line 1891.
- `scripts/redline-prefs.sh`: the header, lines 60 to 63, and `run drift`'s `jq`, lines 220 to 223.
- `docs/scripts.md`: "`redline-prefs.sh`", the quoted header, lines 196 to 199.
- `skills/redline/SKILL.md`: section 7, "The script a relaunch runs (#81)", line 226.
- `docs/running.md`: "Hand-off and relaunch", the bullet "An agent file changed", line 86.
- `README.md`: Known limits, the bullet "A self-review that edits an agent file runs its later rounds under the edit", line 104.
- `workflows/redline-loop.js`: lines 2989 to 2991. They change **temporarily**, for the red run below, and are restored byte for byte before the commit. The commit carries no change to this file.

**Change, `tests/prefs-test.sh` (first, for the red run).** After line 309, the only line that begins

```bash
runj "drift: the agent files ride in drift for the workflow"
```

and before line 310, which reads exactly

```bash
"${G[@]}" checkout -q -- agents/redline-shaper.md
```

insert these sixteen lines:

```bash
# An error or a harness stop can be resumed after the handoff comment posted, and the comment is
# the one prompt that names the agent list, so on those markers drift keeps the list the marker's
# own args passed, while agents and line still name every changed file; a hand-off (the case above)
# or a reviewed stop, both before Finish, reads the list afresh (#91, R1-1).
HELD='{"workflow":"workflows/redline-loop.js","pinned":true,"agents":["agents/redline-reviewer.md"]}'
printf '%s\n' '{"runId":"wf_13","scriptPath":"'"$PIN"'","args":{"pr":7,"startSha":"'"$START"'","drift":'"$HELD"'},"result":{"status":"error","stage":"finish","error":"committing the run record failed: push rejected: fetch first","resumeFrom":{"label":"record commit","attempt":2},"specFolders":["'"$FOLDER"'"]}}' > "$REC/pinned-error.json"
printf '%s\n' '{"runId":"wf_14","scriptPath":"'"$PIN"'","args":{"pr":7,"startSha":"'"$START"'"}}' > "$REC/pinned-stopped.json"
printf '%s\n' '{"runId":"wf_15","scriptPath":"'"$PIN"'","args":{"pr":7,"startSha":"'"$START"'","drift":'"$HELD"'},"result":{"status":"reviewed","reviewedRound":1,"specFolders":["'"$FOLDER"'"]}}' > "$REC/pinned-reviewed.json"
run save "$REPO" 7 --run-id wf_13 --record "$REC/pinned-error.json" >/dev/null 2>&1
runj "drift: an error marker keeps the agent list its args passed" '[.launch, (.agents|join(",")), (.drift|tostring)] | join("|")' "scriptPath|agents/redline-reviewer.md,agents/redline-shaper.md|$HELD" drift "$REPO" 7 --plugin "$REPO"
runj "drift: on an error marker the line still names every changed file" '.line' "$SENTENCE" drift "$REPO" 7 --plugin "$REPO"
run save "$REPO" 7 --run-id wf_14 --record "$REC/pinned-stopped.json" >/dev/null 2>&1
runj "drift: a stopped marker whose args passed no drift keeps an empty agent list" '[.launch, (.agents|join(",")), (.drift|tostring)] | join("|")' 'scriptPath|agents/redline-reviewer.md,agents/redline-shaper.md|{"workflow":"workflows/redline-loop.js","pinned":true,"agents":[]}' drift "$REPO" 7 --plugin "$REPO"
run save "$REPO" 7 --run-id wf_15 --record "$REC/pinned-reviewed.json" >/dev/null 2>&1
runj "drift: a reviewed marker reads the agent list afresh" '.drift.agents | join(",")' "agents/redline-reviewer.md,agents/redline-shaper.md" drift "$REPO" 7 --plugin "$REPO"
run save "$REPO" 7 --run-id wf_11 --record "$REC/pinned.json" >/dev/null 2>&1
```

Notes for the implementer:

- At that point in the file:
  - the workflow file is edited and committed, and `$PIN` differs from it, so `launch` is `scriptPath`;
  - `agents/redline-reviewer.md` is committed at v2;
  - `agents/redline-shaper.md` holds an uncommitted edit;
  - so the fresh list is the reviewer and the shaper, and `$SENTENCE` (line 307) names both.
- `run save` takes `kind` from the record's `result.status`. A record with no `result` is `stopped` (line 162 of the script).
- The last line saves the hand-off marker `wf_11` again, so the cases after the insertion run on the same marker as before.
- `runId`s `wf_13` to `wf_15` are not used elsewhere in the file. Every other line of the file stays as it is.

**Change, `tests/loop-test.mjs` (first, for the red run).** After line 1891, the only line that begins

```js
  check('pin: an empty drift leaves every prompt and the warnings as they were',
```

and before line 1892, which begins

```js
  for (const bad of ['yes', [],
```

insert these twenty-one lines:

```js
  // A resume after the handoff comment posted (#91, R1-1). The comment is the one prompt that names
  // the agent list, and a resume at the record commit (a rejected push) or at the comment itself (a
  // review request that failed) reruns Finish from there, so run drift passes the list the marker's
  // args held. With it every prompt through the comment is the first attempt's and replays, or the
  // resumed comment's duplicate check finds the posted one; with the list read afresh the comment
  // is the first prompt to change, so it would be posted again.
  const heldDrift = { workflow: '', pinned: true, agents: ['agents/redline-reviewer.md'] }
  const freshDrift = { workflow: '', pinned: true, agents: ['agents/redline-reviewer.md', 'agents/redline-shaper.md'] }
  const pushFail = await go('pin: the record commit fails after the handoff comment posted', { ...decided, drift: heldDrift }, { ...scenario, recordError: 'push rejected: fetch first' })
  check('pin: the record commit error is resumable at the record commit', pushFail.res.status === 'error' && JSON.stringify(pushFail.res.resumeFrom) === JSON.stringify({ label: 'record commit', attempt: 2 }), [pushFail.res.status, pushFail.res.resumeFrom])
  const atRecord = { 'record commit': { attempt: 2, error: pushFail.res.error, hand: { commits: [], paths: [] } } }
  const throughComment = (calls) => calls.slice(0, calls.findIndex((c) => c.label === 'handoff comment') + 1)
  const heldResume = await go('pin: the record commit resume with the marker\'s agent list', { ...decided, drift: heldDrift, resume: atRecord }, scenario)
  check('pin: with the marker\'s agent list every prompt through the handoff comment replays', throughComment(pushFail.calls).length > 1 && throughComment(pushFail.calls).every((c, i) => same(c, heldResume.calls[i])), labels(heldResume.calls))
  const freshResume = await go('pin: the record commit resume with the agent list read afresh', { ...decided, drift: freshDrift, resume: atRecord }, scenario)
  const firstChanged = pushFail.calls.findIndex((c, i) => !same(c, freshResume.calls[i]))
  check('pin: with the agent list read afresh the handoff comment is the first prompt to change', firstChanged > 0 && pushFail.calls[firstChanged].label === 'handoff comment', [firstChanged, labels(freshResume.calls)])
  const requestFail = await go('pin: the review request fails after the handoff comment posted', { ...decided, drift: heldDrift }, { ...scenario, finishError: 'could not request a review from sam' })
  const atComment = { 'handoff comment': { attempt: 2, error: requestFail.res.error, hand: { commits: [], paths: [] } } }
  const commentResume = await go('pin: the handoff comment resume with the marker\'s agent list', { ...decided, drift: heldDrift, resume: atComment }, { ...scenario, finishUrl: '' })
  check('pin: with the marker\'s agent list the resumed comment is the posted one byte for byte, so its duplicate check can find it', comment(requestFail.calls, 'handoff comment').includes('`agents/redline-reviewer.md`') && comment(commentResume.calls, 'handoff comment') === comment(requestFail.calls, 'handoff comment'), comment(commentResume.calls, 'handoff comment').slice(0, 600))
```

Notes for the implementer:

- `scenario`, `decided` and `same` are section 17's own (lines 1848, 1849, 1859).
- `go`, `check`, `labels` and `comment` are the file's helpers (lines 238 to 268).
- `recordError`, `finishError` and `finishUrl` are the mock's existing knobs (lines 136 to 141), used the same way in section 13 (lines 1194 to 1207).
- No name above is declared elsewhere in section 17 (`firstDiff` and `kept` are; `firstChanged` and `heldDrift` are not).
- Every other line of the file stays as it is. The lines after the insertion move down by twenty-one.

**Red run.** With both test insertions in place and `scripts/redline-prefs.sh` as at `1c96b8c`:

1. With Edit, remove these three lines of `workflows/redline-loop.js` (2989 to 2991, inside `handoffComment`), and nothing else:

   ```js
     if (AGENTS_CHANGED) {
       lines.push('', AGENTS_CHANGED)
     }
   ```

2. Run the gate: `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-13-0859-91-review-round-1/redline/snapshot.json`.
   - Its `prefs` check exits 1, and its output reads `119 passed, 2 failed`. The two `FAIL` lines name:
     - `drift: an error marker keeps the agent list its args passed`, whose `got` ends `"agents":["agents/redline-reviewer.md","agents/redline-shaper.md"]}`;
     - `drift: a stopped marker whose args passed no drift keeps an empty agent list`.
   - Its `loop` check exits 1, and its output reads `722 checks passed, 3 failed`. The three `FAIL` lines name:
     - `pin: the handoff comment carries the same sentence as its own paragraph`;
     - `pin: with the agent list read afresh the handoff comment is the first prompt to change`;
     - `pin: with the marker's agent list the resumed comment is the posted one byte for byte, so its duplicate check can find it`.
   - Record every `FAIL` line under As built, and any count that differs. The gate's git block also lists the uncommitted edits at this point; only the `prefs` and `loop` outputs are the evidence here.
3. Restore the three lines of `workflows/redline-loop.js` with Edit, byte for byte, at the same place: after the line `  }` that closes the `if (prBody.updated) {` block, and before `  if (teammate) {`. `git diff --stat -- workflows/redline-loop.js` then prints nothing.

**Change, `scripts/redline-prefs.sh` (after the red run).**

1. `run drift`'s `jq`. Replace lines 220 to 223, which read exactly

   ```bash
           jq -n --arg wf "$wf" --arg pin "$pin" --argjson changed "$changed" --argjson agents "$agents" --arg pr "$pr" --arg q "'" '
               (if $changed then (if $pin != "" then "scriptPath" else "refuse" end) else "name" end) as $launch
               | {self: true, launch: $launch, scriptPath: (if $launch == "scriptPath" then $pin else "" end), workflow: $wf, agents: $agents,
                  drift: (if $changed or ($agents | length) > 0 then {workflow: (if $changed then $wf else "" end), pinned: ($pin != ""), agents: $agents} else null end),
   ```

   with these ten lines:

   ```bash
           # The agent list drift passes (#91, R1-1). The handoff comment is the one prompt that names
           # it, and an error or stopped resume can rerun Finish from a step after the comment posted,
           # so on those markers drift keeps the list the marker's own args passed; a hand-off or a
           # reviewed stop, both before Finish, reads it afresh (held is null there).
           held="$(jq -c 'if .kind == "error" or .kind == "stopped" then (.args.drift | .agents? // []) else null end' <<<"$entry")"
           jq -n --arg wf "$wf" --arg pin "$pin" --argjson changed "$changed" --argjson agents "$agents" --argjson held "$held" --arg pr "$pr" --arg q "'" '
               (if $changed then (if $pin != "" then "scriptPath" else "refuse" end) else "name" end) as $launch
               | ($held // $agents) as $passed
               | {self: true, launch: $launch, scriptPath: (if $launch == "scriptPath" then $pin else "" end), workflow: $wf, agents: $agents,
                  drift: (if $changed or ($passed | length) > 0 then {workflow: (if $changed then $wf else "" end), pinned: ($pin != ""), agents: $passed} else null end),
   ```

   The `line:` lines after it (224 to 228) stay as they are: the sentence still names `$agents`, every changed file.
   - `$entry` is the marker, compact JSON, read at line 120, at the top of the `run` branch, and never null here (line 196 exits 2 first).
   - Only the small list goes through `--argjson`, never the whole entry, whose `args.files` grows with the PR (`scripts/bash-conventions` line 29).
   - In `jq`, `[] // x` is `[]`, so an empty held list stays empty; only `null` falls through to `$agents`.
   - The `held` program holds no single quote (`scripts/bash-conventions` line 21).
2. The header. Replace lines 60 to 63, which read exactly

   ```
   #       included; the run goes on, and line is the sentence the skill says and the handoff comment
   #       repeats. drift is what the skill passes as args.drift ({workflow, pinned, agents}), null
   #       when nothing changed. Exit 0, 1 refused, 2 no marker or no start commit (on the plugin's
   #       own repository only; anywhere else no marker is read).
   ```

   with these eight lines:

   ```
   #       included; the run goes on, and line is the sentence the skill says. drift is what the skill
   #       passes as args.drift ({workflow, pinned, agents}), null when the workflow file is as
   #       launched and drift's agents is empty. drift's agents is agents at a hand-off or a reviewed
   #       stop; on an error or stopped marker it is the list the marker's own args.drift passed ([]
   #       when none), since that resume can rerun Finish from a step after the handoff comment
   #       posted, and the comment, the one prompt that names the list, must not change (#91, R1-1).
   #       Exit 0, 1 refused, 2 no marker or no start commit (on the plugin's own repository only;
   #       anywhere else no marker is read).
   ```

   Line 59 before them and line 64 (`#   redline-prefs.sh run clear <repoRoot> <pr>`) after them stay as they are.

**Change, `docs/scripts.md`.** In the quoted header under "`redline-prefs.sh`", replace lines 196 to 199, which hold the same four lines as the script's lines 60 to 63 above, with the same eight lines as the script's new header, byte for byte. The block then quotes the header verbatim again (`process/docs-gate` line 16). Line 195 before them and line 200 after them stay as they are.

**Change, `skills/redline/SKILL.md`.** In line 226, replace the text

```
say `line` verbatim, the sentence naming them, and go on; the handoff comment repeats it for the teammate. When `drift` is not null, set `args.drift` to it exactly as printed, replacing the one an earlier relaunch set; when it is null, leave `args.drift` out. The workflow reads it only at startup and at Finish, so no replayed prompt depends on it.
```

with

```
say `line` verbatim, the sentence naming them, and go on; the handoff comment carries the same sentence for the list in `drift`, for the teammate. When `drift` is not null, set `args.drift` to it exactly as printed, replacing the one an earlier relaunch set; when it is null, leave `args.drift` out. The workflow reads it only at startup and at Finish. Finish's prompts replay on a resume past them, and the handoff comment is the one that names the agent list, so on an `error` or `stopped` marker `run drift` prints `drift` with the list the marker's own args passed, while `agents` and `line` still name every changed file: a resume after the comment posted then replays it, or its duplicate check finds it, and it is never posted twice (#91, R1-1). Only a hand-off or a `reviewed` relaunch, both before Finish, reads the list afresh.
```

The rest of line 226, from "When `agents` is not empty" before the text to "On exit 2 (the plugin's own repository" after it, stays as it is.

**Change, `docs/running.md`.** In line 86, replace the text

```
and the handoff comment carries the same sentence, so the teammate knows the later rounds ran under instructions the run itself edited.
```

with

```
and the handoff comment carries the same sentence, so the teammate knows the later rounds ran under instructions the run itself edited. The list the comment names is read at a hand-off or a review-dial stop, both before Finish. A resume after an error or a stopped run keeps the list the run already passed (`run drift` prints it so, and the skill's line still names every changed file), since such a resume can rerun Finish from a step after the comment posted: a changed list would change the comment, so it would be posted a second time and review requested again (#91, R1-1).
```

The sentence after it ("Agent text is not part of what replay matches, ...") stays as it is.

**Change, `README.md`.** In line 104, replace the text

```
The skill says which agent files changed and the handoff comment repeats it ([docs/running.md](docs/running.md), "Hand-off and relaunch").
```

with

```
The skill says which agent files changed, and the handoff comment repeats the list as the run's last hand-off or review-dial stop read it: a resume after an error or a stopped run keeps that list, so it never posts the comment twice ([docs/running.md](docs/running.md), "Hand-off and relaunch").
```

The rest of line 104 stays as it is.

### Proof

Green: with every change above made and `workflows/redline-loop.js` restored, run the gate: `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-13-0859-91-review-round-1/redline/snapshot.json`. The `prefs` check reads `121 passed, 0 failed`, and the `loop` check reads `725 checks passed, 0 failed`. Every other check keeps its count, and `syntax` still parses `scripts/redline-prefs.sh`.

And:

- `grep -c -F -e '--argjson held' scripts/redline-prefs.sh` prints `1` (was `0`), and `grep -c -F 'held // ' scripts/redline-prefs.sh` prints `1` (was `0`).
- `grep -c '#91, R1-1' scripts/redline-prefs.sh` prints `2`: the header and the comment (was `0`).
- `grep -c 'the one prompt that names the list, must not change' scripts/redline-prefs.sh docs/scripts.md` prints `scripts/redline-prefs.sh:1` and `docs/scripts.md:1`. `grep -c 'line is the sentence the skill says and the handoff comment' scripts/redline-prefs.sh docs/scripts.md` prints `scripts/redline-prefs.sh:0` and `docs/scripts.md:0` (both were `1`).
- `grep -c '#91, R1-1' skills/redline/SKILL.md docs/running.md` prints `skills/redline/SKILL.md:1` and `docs/running.md:1` (both were `0`).
- `grep -c 'so no replayed prompt depends on it' skills/redline/SKILL.md` prints `0`, and `grep -c 'the handoff comment repeats it for the teammate' skills/redline/SKILL.md` prints `0` (both were `1`).
- `grep -c 'never posts the comment twice' README.md` prints `1` (was `0`), and `grep -c -F 'handoff comment repeats it (' README.md` prints `0` (was `1`).
- `grep -c -e 'pinned-error.json' -e 'pinned-stopped.json' -e 'pinned-reviewed.json' tests/prefs-test.sh` prints `6`, and `grep -c '#91, R1-1' tests/prefs-test.sh tests/loop-test.mjs` prints `tests/prefs-test.sh:1` and `tests/loop-test.mjs:1`.
- `grep -c 'heldDrift' tests/loop-test.mjs` prints `5`.
- `grep -c -F "lines.push('', AGENTS_CHANGED)" workflows/redline-loop.js` prints `1`, and `git diff --stat -- workflows/redline-loop.js` prints nothing: the red run's edit is gone.
- Neighbours, unchanged and green:
  - prefs: `drift: the agent files ride in drift for the workflow` (the hand-off marker reads the list afresh);
  - prefs: `drift: a changed workflow whose launch ran the live file has no pin and is refused, naming the file`;
  - loop: `pin: the handoff comment carries the same sentence as its own paragraph`;
  - loop: `resume: the handoff comment before a record commit resume carries no clause`.
- After the commit, `git diff --stat HEAD~1 HEAD` shows `7 files changed, 64 insertions(+), 13 deletions(-)`. Record any difference under As built.
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `README.md`, `docs/running.md`, `docs/scripts.md`, `scripts/redline-prefs.sh`, `skills/redline/SKILL.md`, `tests/loop-test.mjs` and `tests/prefs-test.sh`.

**Docs entry:**

- `scripts/redline-prefs.sh`: `docs/scripts.md`, "`redline-prefs.sh`", the quoted header block, and `docs/running.md`, "Hand-off and relaunch", the bullet "An agent file changed". Both are updated in this task's commit.
- `skills/redline/SKILL.md`: `docs/running.md`, "Hand-off and relaunch", and `README.md`, "Known limits", the bullet "A self-review that edits an agent file runs its later rounds under the edit". Both are updated in this task's commit.
- `workflows/redline-loop.js` ends the task unchanged, so it needs no entry.
- `tests/prefs-test.sh` and `tests/loop-test.mjs` are in no directory gate step 10 lists.
- No config key, subcommand, allow rule or exit code is added.

**Run caution (#81):** this commit carries nothing under `workflows/` or `agents/`. It changes `scripts/redline-prefs.sh`, which this run's skill runs live at its next relaunch, with the new rule.

**Commit:** `redline: R1-1 keep the agent list an error or stopped resume passes, so a resume never posts the handoff comment twice (#81)`

## Task 3: Verification Gate

**Files:**

- `agent-os/specs/2026-11-13-0859-91-review-round-1/plan.md` and `agent-os/specs/2026-11-13-0859-91-review-round-1/shape.md` (step 13, and step 12 if nothing is approved).
- Standards, only those the standards approver approves from `shape.md`'s "Standards retrospective (proposed)":
  - `agent-os/standards/workflow/replay.md` (item 1);
  - `agent-os/standards/scripts/bash-conventions.md` (item 2).

1. **Steps 1 to 9:** run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-13-0859-91-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence. Expected:
   - `loop` at `725 checks passed, 0 failed`;
   - `prefs` at `121 passed, 0 failed`;
   - `guard` at `594 passed, 0 mismatched`;
   - gate, setup, gh and background at their counts before the round, since none reads a file this round changes.
2. **Step 10, Docs:** as Task 2's Docs entry says.
   - `scripts/redline-prefs.sh`: `docs/scripts.md`, "`redline-prefs.sh`", and `docs/running.md`, "Hand-off and relaunch".
   - `skills/redline/SKILL.md`: `docs/running.md`, "Hand-off and relaunch", and README "Known limits".
   - Each is updated in Task 2's commit, which the entry names.
   - `workflows/redline-loop.js` ends unchanged. There is no new config key, subcommand, allow rule or exit code.
3. **Step 11, Version:** `0.2.4` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged by this round. `main` carries `0.2.3`, so this PR already has its bump, and this round changes nothing a setup rerun writes (`shape.md`, Decision 2). The setup test's last cases prove the two versions agree.
4. **Step 12, Standards retrospective:** apply the items the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", as drafted there.
   - If the approver approves neither, make no standards commit, and add "Standards retrospective: no changes" under Decisions in this folder's `shape.md`.
   - If it approves either, the edits go in one commit of their own after the finding commit: `redline: record the round 1 review lessons in the standards (#81)`. `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` then prints `0`, so no heading moved.
5. **Step 13, Spec folder:** add an "As built" section to this file. It records:
   - each task's commit;
   - Task 2's red run (every `FAIL` line of the `prefs` and `loop` checks) and its proof outputs;
   - the gate's counts;
   - the retrospective's outcome.

   A deviation from this plan is also recorded under Decisions in `shape.md`. This lands in the round's last commit.

**Commit:** `redline: record PR #91 round 1 as built (#81)`
