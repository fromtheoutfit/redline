# Resume a run that ended in error (#10)

Spec folder: `agent-os/specs/2026-11-01-0911-10-resume-a-run-that-ended-in-error/`

Shaped by hand on 2026-11-01 with `/agent-os:shape-spec`; the person makes every commit. Issue #10 is the source of truth, read with the eight decisions in the shaping prompt and the four answered today.

## Context

The first full run on #7 ended in error at `check`. After the cause was fixed by hand, `/redline:redline 7` could not resume: the skill resumes only a hand-off, so it ran the precheck, which failed on the unpushed fix commits and the uncommitted record folder, and a fresh launch started a second round 1. Two of the issue's three bullets are still open; the third (round numbering, posting a new round's review) landed with #33 and #35.

What the survey established (read only):

- **The issue's third bullet is done.** `skills/redline/SKILL.md` precheck steps 8 and 9 read `last-round` and `prior-findings`; `workflows/redline-loop.js` numbers from `args.firstRound`; the GitHub agent's `has-review <n> <round>` check is per round, so a fresh run never collides with a posted round; `tests/loop-test.mjs` section 8 (`firstRound 2`, `has-review 114 2`) pins it. The "same round number *and* same findings" refinement is moot: a fresh run gets a new number, a relaunch replays post from cache, and a resume at `post` reruns the agent whose has-review check skips. Dropped.
- **Today a hand-off leaves no marker.** The relaunch state is the session's memory plus a copy of the harness record (`~/.claude/projects/<project>/<session>/workflows/<runId>.json`, copied to `saved/`). So the marker is new for every stop. The record holds `args` and `result`, which is the byte-identical source a resume needs.
- **A cached result the script rejected replays unchanged.** Claude Code docs: a completed agent returns its saved result until the first agent whose prompt differs, then that one and every later one rerun; relaunch is same-session only, or that session reopened with `claude --resume <id>`. So an error raised from a returned result (a failing `recheck`, a shaper with a missing disposition, a Finish comment that failed) repeats on a plain relaunch unless the failed agent's prompt changes.
- **The session id is in the environment.** `CLAUDE_CODE_SESSION_ID` is set in Bash tool subprocesses and matches the hook's `session_id` and the `~/.claude/projects/<project>/<session>/` folder (verified in this session). A script the skill runs reads it itself, so the skill never types a `$`.
- **`run()` is the one call site for every agent** (`workflows/redline-loop.js:359`); `stageError()` (`:346`) carries `stage` and `extra`; the catch at `:2887` returns `result('error', {stage, error, detail})`. The parallel Approve step is the only place two agents start together (`:2127`).
- **`judge()` (`:1471`)** fails a round on `unexpected_files`, on a commit without the `redline:` prefix, and on a non-zero exit with no other reason. A hand commit on `.claude/redline/checks.json` would fail all three today.
- **`commitRecord()` (`:2621`)** is called only from `finish()`. `review-only` returns at `:2818` and revise-only at `:2777` without it, so both leave their record untracked, and the next fresh launch's clean-tree precheck fails on it (STEP14 left this open). The loop test pins today's behaviour at `tests/loop-test.mjs:405-412` ("review only commits no record") and `:182` (the record-commit tail check keys on `handoffPosted` or `humanReview`).
- **`handoffPosted`** is set only on the full-run `done` results (`:2839-2879`); the revise-only (`:2777`) and human-review (`:2751`) `done` results carry no key, so the skill's `done` report reads it as null. Decided today: fix the absent key.
- **`scripts/redline-prefs.sh save`** rebuilds `.claude/redline.local.json` from the four fields (`:160-168`) and drops every other key. The file is gitignored, refused to every role, and approved for the main session by real path with any subcommand (`scripts/redline-guard.sh:1079`). `tests/prefs-test.sh` runs in a throwaway directory under `$TMPDIR` (28 cases).
- **#57** needs a new read-only GitHub-agent operation (list the spec folder, grep `shape.md` for `## Decisions`), a prompt function, a loop-test mock branch, a role-file change and a README line: more than one task. It stays its own issue; this spec's `resumeFrom` on a shape-stage error is the marker it will use (decision 6).

## Decisions

The prompt's eight, as given, plus four answered on 2026-11-01 and the calls made from the survey.

1. **Marker** (prompt 1): one marker for every stop, error or not: run id, kind, stage, agent label and next attempt, error text, HEAD, branch, the session id, the record path, the spec folders and the args as launched. The skill offers resume or fresh with the stage and message in the question.
2. **Session** (prompt 2): resume requires the launching session. The check prints `claude --resume <session id>`; the skill shows it and stops instead of relaunching into "nothing to resume".
3. **HEAD** (prompt 3): HEAD equals the marker's, or sits on top of it with hand commits that touch only `.claude/` paths; untracked or modified paths only under the run's spec folders; when the repository is the plugin (`repoRoot` is `${CLAUDE_PLUGIN_ROOT}`) any moved HEAD refuses with "start fresh: the next round carries the findings forward".
4. **Shape stage** (prompt 4): a resume at a shape-stage error reruns the shaper; its resume line says to rewrite the four spec files from scratch and never touch `redline/`.
5. **Record commits** (prompt 5): `review-only` and revise-only runs end with the run-record commit; every `done` result carries `handoffPosted` and `reviewRequested` as booleans (answered 2026-11-01: the absent key).
6. **#57** (prompt 6): not built here; see Context.
7. **Tests** (prompt 7): loop-test for the replay prefix, the resume line, the shape-stage rerun, the hand commit, the non-resumable gather error, the record commits and the booleans; prefs-test for the marker and every refusal (session, branch, head, plugin, untracked).
8. **Docs** (prompt 8): README Launching and Known limits, plus Saved preferences, the Files table and Git rule 7, which the record-commit change makes wrong.
9. **Marker home** (answered 2026-11-01): a `runs` map keyed by PR in `.claude/redline.local.json`, through new `redline-prefs.sh run save|read|check|clear` subcommands; `save` keeps the other keys. No guard, gitignore or setup change.
10. **Resume mechanics** (answered 2026-11-01): label-keyed. The error result names the agent label that caused the stop; the relaunch adds `args.resume = {"<label>": {attempt, error, hand}}`; `run()` appends one resume line to that label's prompt. Everything before replays byte-identically; that agent and all after rerun. The prefs script runs the git checks before launch. A hand commit's `.claude/` paths and SHAs ride in `hand`: the judge excuses them, and they join `approvedPaths` at the resume point (never at startup, which would change the cached snapshot prompt and rerun the implementer).
11. **Standards carried** (answered 2026-11-01): `workflow/replay`, `workflow/agents`, `scripts/bash-conventions`, `testing/tests`, `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`.
12. **Not resumable**: a `gather` error (head moved, PR closed, wrong branch) and an error with no agent label. The result's `resumeFrom` is null, no marker is written, and the skill names the folders to commit or remove before a fresh launch.
13. **The marker reads the harness record**, not the skill's memory: `run save` takes the run id, finds `~/.claude/projects/*/<session>/workflows/<runId>.json` (or `--record <file>`), and copies `args` and the result's fields from it, so a resumed session relaunches the args the harness ran, byte for byte.
14. **One record-commit message** for every run kind (`redline: record the run's replies, reviews and handoff for PR #<pr> (#<issue>)`), as README and the loop test pin it; a review-only record is reviews and findings only, which the message's "replies ... and handoff" overstates. Kept for one message everywhere.
15. Visuals: none. The person makes every commit.

## Task 1: Save spec documentation

Create `agent-os/specs/2026-11-01-0911-10-resume-a-run-that-ended-in-error/` with:

- `plan.md`: this plan, with the Docs entries table and an As built section filled at the gate.
- `shape.md`: scope (the issue's first two bullets; the third recorded as covered by #33/#35 and dropped), the decisions above with the four answers of 2026-11-01, context (visuals none; references; product alignment: `agent-os/product/mission.md`, "the author keeps every decision": a resume is the person's choice, never a retry), `## Standards retrospective (proposed)` (Task 7's list), Standards Applied.
- `standards.md`: the full text of the seven standards as they read at shaping time.
- `references.md`: `skills/redline/SKILL.md` 150-222 (the result handlers, the run-record copy, the lost-session paragraph); `scripts/redline-prefs.sh` 1-25 (header contract), 160-168 (`save` rebuilds the file); `tests/prefs-test.sh` 1-30 (harness helpers); `workflows/redline-loop.js` 346-366 (`stageError`, `run`), 1471-1519 (`judge`), 1559-1609 (`result`), 2127-2145 (the parallel Approve and its errors), 2253-2263 (round commits), 2621-2649 (`commitRecord`), 2777, 2817-2819, 2751-2755 (the three returns without a record commit or the booleans), 2887-2890 (the catch); `tests/loop-test.mjs` 167-209 (`go`, `samePrefix`), 362-416 (section 7, record), 463-485 (firstRound), 624-640 (checker helpers), 760-860 (human pass); `agents/redline-shaper.md` rule 9; `README.md` 93-106 (Saved preferences), 185-187 (Launching), 195-203 (Known limits), 209, 215 (Git rules 1 and 7); `agent-os/specs/2026-10-30-1558-55-checker-overrides-structural-unreadable/` (format); redline-internal `docs/API-NOTES.md` section g and `docs/STEP7-NOTES.md` section 3, cited by name.

## Task 2: The run marker in `redline-prefs.sh`

**Files:** `scripts/redline-prefs.sh`, `tests/prefs-test.sh` (same commit; the cases land first and are seen red).

1. **Red first.** In `tests/prefs-test.sh`, after the "a damaged file" block (restore a valid file first), add a git repository to the throwaway directory (`git -C "$REPO" init -q`, one commit with `-c user.name` and `-c user.email`, branch `work`) and a fake harness record written with `printf` to `$REPO/record.json`:
   `{"runId":"wf_1","args":{"pr":7,"headRef":"work","files":["app/x.php"]},"result":{"status":"error","stage":"check","error":"checks.sh still fails","resumeFrom":{"label":"recheck r1","attempt":2},"specFolders":["agent-os/specs/2026-11-01-0900-7-review-round-1"]}}`.
   Cases (each through a `run` helper that sets `CLAUDE_CODE_SESSION_ID=s1` for the call):
   - `save` keeps other keys: seed the file with `{"runs": {"7": {"kind": "error"}}, "interrupt": "plan"}`, run `save`, assert `.runs."7".kind` is still `error` and `.interrupt` updated.
   - `run save`: `run save "$REPO" 7 --run-id wf_1 --record "$REPO/record.json"` prints the entry; `.runs."7"` has `kind error`, `stage check`, `label "recheck r1"`, `attempt 2`, `session s1`, `runId wf_1`, `head` = `git rev-parse HEAD`, `branch work`, `args.pr 7`, `specFolders[0]`, `record` = the record path. The four prefs keys are untouched.
   - `run save` of a record whose result has `resumeFrom: null` exits 1 with a line holding `cannot be resumed` and writes no entry.
   - `run save` of a record with `status: handoff` writes `kind handoff` and no label; `status: reviewed` writes `kind reviewed`; a record with no `result` writes `kind stopped`.
   - `run save` with neither `--record` nor a session in the environment exits 2.
   - `run read "$REPO" 7` prints the entry; `run read "$REPO" 8` prints `null`.
   - `run check` ok: same session, same HEAD, clean tree → `.ok true`, `.reason ""`, exit 0.
   - session: `CLAUDE_CODE_SESSION_ID=s2` → `.ok false`, `.reason "session"`, `.line` contains `claude --resume s1`, exit 1.
   - branch: `git checkout -q -b other` → `.reason "branch"`; back to `work`.
   - untracked under the run's spec folder (`mkdir -p` + `touch` under `agent-os/specs/2026-11-01-0900-7-review-round-1/redline/`) → ok, `.untracked` lists it.
   - untracked outside it (`touch "$REPO/stray.txt"`) → `.reason "untracked"`, `.line` names `stray.txt`; remove it.
   - a hand commit touching `.claude/redline/checks.json` → ok, `.hand.commits` has one SHA, `.hand.paths == [".claude/redline/checks.json"]`.
   - a hand commit touching `app/y.php` on top → `.reason "head-moved"`, `.line` names `app/y.php` and says `start fresh`.
   - plugin: reset to the `.claude/`-only hand commit, `run check ... --plugin "$REPO"` → `.reason "plugin"`, `.line` says `start fresh` and `carries the findings forward`; `--plugin /elsewhere` → ok.
   - HEAD behind the marker (`git reset -q --hard HEAD~1` below the marker's head) → `.reason "head-moved"`.
   - `run clear "$REPO" 7` prints `{"cleared": true}`, `run read` prints `null`, `run clear` again prints `{"cleared": false}`; the four prefs keys survive.
   Run `tests/prefs-test.sh`: the new cases fail (`run` is an unknown command, exit 2), the 28 existing ones pass.
2. **Then the script.** In `scripts/redline-prefs.sh`:
   - Header: the file holds the four settings and, under `runs`, one marker per PR for a run that stopped (`run save|read|check|clear`), with the argument forms below.
   - Accept `run` as a third command: `redline-prefs.sh run <save|read|check|clear> <repoRoot> <pr> [...]`. `pr` must be a positive integer (exit 2).
   - `save`: `($saved // {}) | del(.interrupt, .revise, .maxRounds, .scope) + <the four as computed today>`, so `runs` and any other key survive; the per-run verb rule is unchanged.
   - `run save <root> <pr> --run-id <id> [--session <id>] [--record <file>]`: session from `--session`, else `CLAUDE_CODE_SESSION_ID`, else exit 2 with `redline-prefs: no session id; pass --session or run from a Claude Code session`. Record from `--record`, else the one file matching `$HOME/.claude/projects/*/<session>/workflows/<runId>.json` (none or several: exit 2 naming the pattern). Read `args` and `result` with jq. `kind` = `error` | `handoff` | `reviewed` for those statuses, `stopped` when `result` is null or absent, exit 2 for any other status (`done`, `capped`, `review-only` leave no marker). For `error`, `result.resumeFrom` null → exit 1 with `redline-prefs: the run on #<pr> stopped at <stage> and cannot be resumed; start fresh after committing or removing <specFolders>`. Entry: `{pr, kind, runId, session, record, head: git rev-parse HEAD, branch: git rev-parse --abbrev-ref HEAD, stage, label, attempt, error, round (result.handoffRound or reviewedRound or the last of result.rounds), handoffKind, specFolders (result.specFolders, plus the folder of result.snapshotStart), args}`; absent fields as `""`, `0` or `[]`. Written atomically (the existing mktemp + mv), printed as JSON.
   - `run read <root> <pr>`: prints the entry or `null`; exit 0 either way (a missing or non-JSON file is `null` for `read`; `check` and `clear` exit 2 on non-JSON).
   - `run check <root> <pr> [--plugin <dir>] [--session <id>]`: prints `{ok, reason, line, marker, head, hand: {commits, paths}, untracked}`, exit 0 when ok, 1 when refused. Rules in order, the first failing reason wins: `none` (no entry: `no stopped run is recorded for #<pr>`); `session` (marker.session differs from the current one: `the run on #<pr> was launched from session <id>; reopen it with: claude --resume <id>, then type /redline:redline <pr> again`); `branch` (`git rev-parse --abbrev-ref HEAD` is not marker.branch: `check out <branch>`); `head-moved` when `git merge-base --is-ancestor <marker.head> HEAD` fails (`HEAD <short> is not on top of the run's last commit <short>; start fresh after committing or removing <specFolders>`); when HEAD differs: `hand.commits` = `git rev-list <marker.head>..HEAD`, `hand.paths` = `git diff --name-only <marker.head> HEAD`; `plugin` when `--plugin` resolves (realpath) to `root` and HEAD moved (`the repository is the plugin and HEAD moved since the run stopped (<n> commits); a plugin fix changes what runs, so start fresh: the next round carries the findings forward`); `head-moved` when any hand path does not start with `.claude/` (`<n> commits since the run stopped touch <paths> outside .claude/; start fresh ...`); `untracked` when `git status --porcelain --untracked-files=all` lists a path not under one of marker.specFolders (`commit or remove <paths>, or start fresh`). `line` is `""` when ok.
   - `run clear <root> <pr>`: deletes `.runs.<pr>` (and `runs` when empty), prints `{"cleared": true|false}`.
   - Every git call is `git -C "$root" ...` read-only; `set -euo pipefail` and the exit-2 usage rule as the header says.
3. `tests/prefs-test.sh` prints `N passed, 0 failed`, N up by the cases above.

## Task 3: Resume in the workflow and the shaper

**Files:** `workflows/redline-loop.js`, `agents/redline-shaper.md`, `tests/loop-test.mjs` (same commit; checks first, seen red).

1. **Red first.** New section 13 in `tests/loop-test.mjs`, "Resume after an error (#10)", using `go`, `samePrefix`, `pick`, `labels` and a new scenario knob `shaperDrop` (ids the shaper mock leaves out of `findings`):
   - `resume: error at recheck`: `checker` patches `check r1` and `recheck r1` to a failing check → `status error`, `stage check`, `res.resumeFrom` deep-equals `{label: 'recheck r1', attempt: 2}`.
   - `resume: relaunch reruns from the label`: same scenario with the checker passing and `args.resume = {'recheck r1': {attempt: 2, error: 'checks.sh still fails after one repair pass in round 1: failing checks: check', hand: {commits: [], paths: []}}}`; `samePrefix` over the calls before `recheck r1` in the first run (its index); the `recheck r1` prompt ends with the resume line (pinned verbatim: `Resume attempt 2 of this step. The run stopped at this step with an error (checks.sh still fails after one repair pass in round 1: failing checks: check); the person has since fixed the cause by hand. Do the step again from the current state of the repository and the PR. What an earlier attempt already made stands (a commit, a posted review or reply, a written file), and the duplicate checks in your instructions apply.`); the `check r1` prompt carries no `Resume attempt`; status `done`.
   - `resume: a hand-off after the resume keeps the line`: the relaunch scenario with an ask in round 2; the second relaunch (decisions added, `resume` unchanged) replays every prompt up to the stop, the resumed one included.
   - `resume: shape stage`: `shaperDrop: ['R1-2']` → `status error`, `stage shape`, `resumeFrom.label === 'shape r1'`; relaunch with `resume['shape r1']` and no drop → the `shape r1` prompt ends with the line plus ` Rewrite plan.md, shape.md, standards.md and references.md in the spec folder from scratch, replacing what the earlier attempt wrote; never change or remove anything under its redline/ folder.`; the three prompts before replay; `done`.
   - `resume: approve names the plan approver`: `planBounce: 3` knob (the plan approver mock rejects n times) with `maxPlanAdjustments: 2` → `resumeFrom.label === 'plan approver r1 #3'`.
   - `resume: gather is not resumable`: `heads: ['b'.repeat(40)]` → `stage gather`, `resumeFrom === null`.
   - `resume: a hand commit is excused`: relaunch at `recheck r1` with `hand: {commits: [SHA(9)], paths: ['.claude/redline/checks.json']}`; the checker patch for `recheck r1` returns `exit 1`, `unexpected_files: ['.claude/redline/checks.json']`, commits including `{sha: SHA(9), message: 'Fix the gate config'}`; round 2 finds one nit so a second revise runs → `done`; `res.commits` has no SHA(9) and no `Fix the gate config`; the `snapshot r2` prompt's JSON `plan_paths` includes `.claude/redline/checks.json`; the `snapshot r1` prompt's does not (cached prefix).
   - `resume: an unexcused unexpected file still fails`: the same patch without `hand` → `error` at `check` with `files outside the approved plan changed`.
   - `resume: bad args`: `resume: {'x': {attempt: 1}}` and `resume: []` are refused before any agent runs (`args.resume`).
   Run `node tests/loop-test.mjs`: the new checks fail, every existing one passes.
2. **Then the workflow.** In `workflows/redline-loop.js`:
   - After `selected` (`:191`): `const resume = ...`: an object map (not an array) or `{}`; each value an object with integer `attempt >= 2`, string `error`, optional `hand` with string lists `commits` and `paths`; anything else `fail('args.resume must map an agent label to {attempt, error, hand}; got ...')`. Derive `handCommits` (Set) and `handPaths` over all entries.
   - `let lastLabel = ''` in Run state; `stageError(stage, message, extra, label)` sets `label: label || lastLabel`.
   - `run()`: set `lastLabel = opts.label` first; when `resume[opts.label]` exists, append the resume line (the shaper sentence too when `opts.agentType === 'redline:redline-shaper'`) to the prompt, and `approvedPaths = unique(approvedPaths.concat(resume[opts.label].hand.paths))` (the resume point is where the hand paths enter; a comment says why not at startup).
   - The two Approve-stage errors (`:2138`, `:2144`) pass `` `plan approver ${pass.tag}${suffix}` `` as the label.
   - `judge()`: `excused = unexpected.filter((p) => handPaths.includes(p))`, `unexpected` without them; the prefix check skips commits whose `sha` is in `handCommits`; the exit-code rule adds `&& excused.length === 0`.
   - Round commits (`:2254`): `known` also holds `handCommits`.
   - The catch (`:2889`): `resumeFrom: error.stage && error.stage !== 'gather' && error.label ? { label: error.label, attempt: (resume[error.label] ? resume[error.label].attempt : 1) + 1 } : null`, and `relaunch.how` gains one sentence: `error: resume ({"<label>": {attempt, error, hand}}) for the label resumeFrom names, through the skill's run marker.`
   - `agents/redline-shaper.md` rule 9: after "complete or correct it rather than creating a second one", add: `On a resume attempt (the invoking prompt says so) rewrite the four files from scratch, replacing the failed attempt's; never change or remove anything under its redline/ folder.`
3. `node tests/loop-test.mjs` prints `N checks passed, 0 failed`.

## Task 4: Record commits and the booleans

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs` (same commit; checks first).

1. **Red first.** In section 7: remove `review only` from the "commits no record" list (`:405-412`) and add `review only: the record is committed after post`: calls end `post r1|record files|record commit`, `res.recordCommit.committed === true`, the status prompt covers the round-1 folder and the start snapshot. In section 8 beside the revise-only checks: `revise-only: the record is committed after the replies` (calls end `push and reply r1|record files|record commit`) and `revise-only: handoffPosted and reviewRequested are false`. In section 10: `human: handoffPosted and reviewRequested are false`. In `go()` (`:182`) add `res.status === 'review-only'` to the tail condition, so every review-only scenario asserts the tail. Run: the new checks fail.
2. **Then the workflow.** `:2817`: `if (reviewOnly) { phase('Finish'); recordCommit = await commitRecord(); return result('review-only', {...}) }`. `:2777`: `phase('Finish'); recordCommit = await commitRecord(); return result('done', { reviseOnly: true, handoffPosted: false, reviewRequested: false, note })`. `:2751`: add `handoffPosted: false, reviewRequested: false`. The dry-run and `no push` paths need nothing: `recordCommitPrompt` already reads `push`.
3. `node tests/loop-test.mjs` green.

## Task 5: The skill

**File:** `skills/redline/SKILL.md` (the review and revise variants follow it unchanged; `skills/redline-revise/SKILL.md` step 4's "the tree may hold uncommitted files under `revise.specFolder`" stays true for a review-dial stop and is left).

1. **Section 4, a new first step, "A stopped run."** Run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run read <repoRoot> <n>`. `null`: go on to step 1. Otherwise ask one `AskUserQuestion`: "The last run on #<n> stopped <with an error at <stage> (<error>) | at a hand-off with <k> judgment calls open | after posting the round <r> review for you to pick from | before returning a result>. Resume it, or start fresh?" with **Resume** first and **Start fresh** second. Headless: resume when the check below passes, else fresh, and say which in one line.
   - **Resume.** Run `run check <repoRoot> <n> --plugin ${CLAUDE_PLUGIN_ROOT}`. Exit 1: print its `line` verbatim and stop (for `session` the line carries `claude --resume <id>`: the person reopens that session and types the command again there; for `plugin`, `head-moved`, `untracked` and `branch` the line says what to do). Exit 0: skip sections 3, 4 and 5. Save the run record copy as step 7 says. Then by `kind`: `error`: relaunch in this session with the marker's `args` plus `resume` set to the marker's existing `args.resume` (or `{}`) with `[label]: {attempt, error, hand}` added (`hand` from the check's output), and `resumeFromRunId: <marker.runId>`; `handoff` and `reviewed`: read `result` from the marker's `record` file and continue as that result's section below says (present the calls or the findings, confirm, relaunch); `stopped`: relaunch with the marker's `args` unchanged and `resumeFromRunId`. Record the new `runId`; a later stop rewrites the marker.
   - **Start fresh.** Run `run clear <repoRoot> <n>`, then steps 1 to 10 as today. When step 4 (clean tree) fails and the marker named spec folders, the one line names them: `commit or remove <folders>` (the earlier run's record; a `review only` run commits its own since this spec, so this is a hand-off or an error that was not resumed).
2. **Section 7.** `handoff` (both kinds), `reviewed` and `stopped before a result`: after saving the run record copy, run `run save <repoRoot> <n> --run-id <runId>`, so a `/redline:redline <n>` in this or the reopened session picks the stop up. Replace the two "If the session that started the run is gone" paragraphs with: the marker and `claude --resume <session>` (printed by `run check`) are the way back; never relaunch from a different session. `done`, `capped` and `review-only`: run `run clear <repoRoot> <n>` first. `error`: after the report, when `resumeFrom` is not null, run `run save ...` and say in one line that `/redline:redline <n>` will offer to resume once the cause is fixed, from this session or `claude --resume <session id>`; when null, say the run cannot be resumed (name the stage) and list the uncommitted spec folders to commit or remove before a fresh launch. Still never retry or fix anything yourself.
3. **Rules.** The marker is written only through `redline-prefs.sh run`; `args` on a resume come from the marker, never from memory.

## Task 6: README

**File:** `README.md`.

- **Launching** (`:187`): after the hand-off relaunch sentence, one paragraph: every stop (a hand-off, the review dial, an error with a resumable stage, a run the harness stopped) leaves a marker under `runs` in `.claude/redline.local.json` with the run id, the session id, HEAD and the args as launched; the next `/redline:redline <pr>` offers resume or fresh, naming the stage and the error; resume runs `redline-prefs.sh run check` first (same session, else the line prints `claude --resume <id>`; the PR's branch; HEAD equal to the marker's or on top of it with commits touching only `.claude/` paths, which the checker then excuses and later snapshots allow; on the plugin's own checkout any moved HEAD refuses; untracked or modified paths only under the run's spec folders) and relaunches with the marker's args plus `resume` for the agent label the error named, so the cached prefix replays and that agent reruns with one added line; a `gather` error is not resumable. `review only` and revise-only runs end with the run-record commit like a full run.
- **Known limits** (`:195`): one bullet: **A stopped run resumes only from its own session, and only onto its own HEAD.** The harness replays from the launching session (reopen it with `claude --resume`); a fix outside `.claude/`, or any hand commit when the repository under review is the plugin, means a fresh run, whose first round carries the findings forward (#10).
- **Saved preferences** (`:93-106`): the file also holds `runs`, one marker per PR; `redline-prefs.sh run save|read|check|clear` and that `save` keeps it.
- **Files table** (`:152`, `:161`): the prefs row adds "and the run marker"; the prefs-test row adds "and the marker checks".
- **Git rules** 1 (`:209`) and 7 (`:215`): a `review only` run and a revise-only run make the run-record commit; a run that stops for the person (a hand-off, the review dial, an error) leaves its spec folder uncommitted and a marker, and a relaunch or a fresh launch picks it up.
- **Use** (`:67`): "`review only`, read the review, then `/redline:redline <pr>`" gains "(the review-only run commits its record, so the tree is clean for the next launch)".

## Docs entries

| File | README section | Commit or reason |
| --- | --- | --- |
| `scripts/redline-prefs.sh` (new `run` subcommands; `save` keeps keys) | Settings › Saved preferences; Files table | Task 6's commit |
| `workflows/redline-loop.js` (`args.resume`, `resumeFrom`, the resume line, hand commits, record commits, booleans) | Launching; Git rules 1 and 7; Known limits | Task 6's commit |
| `agents/redline-shaper.md` (rule 9 sentence) | Launching (the shaper rerun on a shape-stage resume) | Task 6's commit |
| `skills/redline/SKILL.md` (the stopped-run step, the marker in section 7) | Launching; Use | Task 6's commit |
| `tests/prefs-test.sh`, `tests/loop-test.mjs` | Files table rows | Task 6's commit (the rows name the new families) |
| `agent-os/specs/2026-11-01-0911-10-.../` | none | no reader-facing change: spec folders are the record |
| `agent-os/standards/` (retrospective edits, if approved) | none | no reader-facing change: the README does not describe the standards |

## Task 7: Verification Gate

Run `.claude/redline/checks.sh --baseline` (gate steps 1 to 9; expect exit 0 with every check green: syntax, validate, guard, loop, prefs, gate, setup, gh, background), then:

- Step 10, Docs: every row above names a commit or a reason.
- Step 11, standards retrospective, presented with AskUserQuestion (apply, adjust, none). Proposed:
  - `agent-os/standards/workflow/replay.md`: add "A resume after an error changes exactly one prompt: `run()` appends a resume line to the agent label the error result's `resumeFrom` names (`args.resume`), so every prompt before it replays and that agent and all after rerun; a cached result the script rejected replays unchanged on a plain relaunch, which is why the line exists. A hand commit's paths join `approvedPaths` at that label, never at startup, so the cached snapshot prompt stays byte-identical (#10)".
  - `agent-os/standards/workflow/agents.md`: add "An error result names the agent label that caused the stop (`resumeFrom`) and the skill writes a marker through `redline-prefs.sh run save`; a resume is the person's choice at the next launch, never a retry by the skill or the workflow, and a `gather` error is not resumable (#10)".
  - `agent-os/standards/testing/tests.md`: the prefs-test bullet gains "and the run marker (`run save|read|check|clear`) with every refusal (session, branch, head, plugin, untracked) in a throwaway git repository (#10)"; the loop-test bullet gains "a resume scenario proves the error result's `resumeFrom`, the byte-identical prefix up to the resumed label, the resume line on that prompt alone, a shape-stage rerun, an excused hand commit beside an unexcused unexpected file, a non-resumable gather error, and the record commit that ends `review only` and revise-only runs (#10)".
  - `agent-os/standards/scripts/bash-conventions.md`: expected "already covered" (one JSON object, usage exit 2); confirm at the gate.
  - Approved edits land in their own commit; otherwise record "Standards retrospective: no changes" under Decisions in `shape.md`.
- Step 12: `plan.md` As built; any deviation under Decisions in `shape.md`.

Also from the repository root: `scripts/redline-gate.sh check .` exit 0 (no gate text changes), `scripts/redline-setup.sh version .claude/redline/checks.sh` exit 0, `git status --porcelain` empty after the commits. CI runs the same on the PR.

## Verification (end to end)

1. After Task 2 step 1: `tests/prefs-test.sh` reports exactly the new cases failing; after step 2 it prints `N passed, 0 failed`.
2. After Task 3 step 1 and Task 4 step 1: `node tests/loop-test.mjs` reports only the new checks (and the flipped review-only check) failing; after the workflow changes, `N checks passed, 0 failed`.
3. `claude plugin validate .` passes after the shaper and skill edits.
4. A hand rehearsal on this checkout, read-only: with `CLAUDE_CODE_SESSION_ID` set, `scripts/redline-prefs.sh run save /tmp/x 7 --run-id wf_x --record <a record copied from ~/.claude/projects/.../workflows/saved/>` into a throwaway copy of a repository, then `run check` and `run clear`, to see the real record shape parse.
5. Read the README paragraph against decisions 2, 3, 10 and 12: the same five refusals, the same `.claude/` rule, the same plugin rule, `gather` not resumable.

## Suggested commit split (the person commits)

1. spec folder (Task 1); 2. prefs script with its cases (Task 2); 3. workflow resume, shaper sentence, loop checks (Task 3); 4. record commits and booleans with their checks (Task 4); 5. skill (Task 5); 6. README (Task 6); 7. standards, if approved; 8. the As built commit.

## As built (2026-11-01)

- Built as shaped, with four deviations, each recorded under Decisions in `shape.md`:
  1. The rehearsal against a real harness record (verification item 4) found that the start snapshot's folder was derived by splitting its absolute path on `/redline/`, which on a repository whose own path holds `/redline/` (this checkout's does) yields a stray folder. Fixed red before green with a prefs-test case (`save: the start snapshot's folder under a path holding /redline/`): the folder is read off the record's `args.repoRoot` and the snapshot's fixed tail.
  2. The loop test's `go()` tail check wanted a closing comment before the record commit; a review-only run's last step is `post r<n>` and a revise-only run's is `push and reply r<n>`, so the check takes the step the run kind ends with. The two "review only: three calls" pins became five calls.
  3. The red run of the loop test crashed on `pick()` of a call that did not exist yet, so the new checks guard their picks; the red list was then 21 failures, all new or flipped.
  4. The Approve stage's "approver returned nothing" error names the approver that returned nothing (plan or standards), beside the exhausted-adjustments error naming the plan approver.
- The marker's `attempt` is the next attempt (the error result's `resumeFrom.attempt`), so the skill copies it into `args.resume` unchanged.
- `node tests/loop-test.mjs`: `444 checks passed, 0 failed` (up 25). `tests/prefs-test.sh`: `94 passed, 0 failed` (up 66). `.claude/redline/checks.sh --baseline`: `ok: true`, all nine checks exit 0. `scripts/redline-gate.sh check .` reports `match`; `scripts/redline-setup.sh version` matches v2. shellcheck is not installed on this machine; CI runs it on the PR.
- Rehearsal: `run save` on a saved handoff record of #45 wrote a `handoff` marker whose `args` diff empty against the record's; `run check` from another session printed the `claude --resume` line; from the right session `ok: true`; `run save` without `--record` found the live record by session and run id through the glob (and refused it, since that run's status is `done`); `run clear` removed the entry.
- Step 10 (Docs): every row of the Docs entries table names Task 6's commit or its reason.
- Step 11 (retrospective): three edits approved and applied (`workflow/replay.md`, `workflow/agents.md`, `testing/tests.md`); `scripts/bash-conventions.md` already covered. See `shape.md`.
- The person makes the commits; the Docs entries name them by task.
