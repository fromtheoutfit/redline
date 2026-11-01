# PR #59 review round 1 — Plan

Shaped by Redline in unattended mode. Round 1 of PR #59 (issue #10). Findings: R1-1, R1-3, R1-4, R1-5, R1-6 `fix`; R1-2 `ask`, decided by the author on 2026-11-01 (Refuse it, Task 7). Every commit message starts `redline:` and names its finding id.

Allowed paths this round (every task's files, together):

- `agent-os/specs/2026-11-01-0935-59-review-round-1/plan.md`, `shape.md`, `standards.md`, `references.md`
- `scripts/redline-prefs.sh`
- `tests/prefs-test.sh`
- `tests/loop-test.mjs`
- `skills/redline/SKILL.md`
- `workflows/redline-loop.js`
- `README.md`
- `agent-os/standards/workflow/replay.md`, `agent-os/standards/workflow/agents.md`, `agent-os/standards/testing/tests.md` (the standards retrospective commit only)

---

## Task 1: Save spec documentation

Files: `agent-os/specs/2026-11-01-0935-59-review-round-1/plan.md`, `shape.md`, `standards.md`, `references.md` (written by the shaper). Leave `redline/` untouched. No visuals.

## Task 2: R1-1 — `run check` counts the run's own folders from its args

Files: `scripts/redline-prefs.sh`, `tests/prefs-test.sh`, `README.md`.

Change, in `scripts/redline-prefs.sh`:

1. `run save`: the start snapshot's folder comes from `$r.snapshotStart`, else from `$rec.args.snapshotPath` when the result has none, through the same `ltrimstr((args.repoRoot // root) + "/")` and the same `sub("/redline/snapshot-start\\.json$"; "")`, dropping an absolute leftover as now. A `stopped` record (no result) then lists the snapshot's folder.
2. `run check`: a path from `git status` is the run's when it sits under a listed folder (as now), or starts with `agent-os/specs/<stamp>-<pr>-review-round-` or `agent-os/specs/<stamp>-<pr>-human-review-`, where `<stamp>` is `marker.args.launchedAt` read as the workflow reads it (`workflows/redline-loop.js` lines 48-52: `^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})` gives `YYYY-MM-DD-HHMM`) and `<pr>` is the marker's PR. When `launchedAt` is absent or does not match, only the listed folders count. Do it inside the existing jq filter (a `capture` on the marker), no bash string building of JSON.
3. The header's `run check` paragraph: "untracked (an untracked or modified path outside the run's spec folders: the listed ones, and every folder the run's launch stamp names for this PR)"; the `run save` paragraph says the start snapshot's folder comes from the result or, without one, from `args.snapshotPath`.

Tests, in `tests/prefs-test.sh`, red before green (add the cases, run, see them fail, then change the script):

- The `stopped.json` record gains `"repoRoot"`, `"snapshotPath"` (`$REPO/$FOLDER/redline/snapshot-start.json`) and `"launchedAt": "2026-11-01T09:00:00-0400"` in its args. "save: no result is a stopped run" now expects `specFolders` to be `["$FOLDER"]` (the old `[]` pinned the bug); rename it to say so.
- New: a `stopped` marker with an untracked `$FOLDER/redline/snapshot-start.json`: `check` is ok.
- New: an error record whose args carry `launchedAt` `2026-11-01T09:00:00-0400` and whose result lists only `$FOLDER` (round 1), with untracked `agent-os/specs/2026-11-01-0900-7-review-round-2/redline/round-2-review.json` and `round-2-findings.json`: `check` is ok.
- New neighbour: the same marker with an untracked file under `agent-os/specs/2026-11-01-0800-7-review-round-2/` (another launch stamp) and one under `agent-os/specs/2026-11-01-0900-8-review-round-1/` (another PR): `check` refuses `untracked` naming them. The existing `stray.txt` case stays.
- Clean up what the new cases write before the `run clear` section, as the existing cases do (`rm -rf "$REPO/agent-os"`), and re-save the marker the later cases expect.

Proof: `tests/prefs-test.sh` prints `N passed, 0 failed`.

Docs: `scripts/redline-prefs.sh` → README "Launching": the sentence "or an untracked or modified path sits outside the run's spec folders" gains "(the folders its result lists and every folder its launch stamp names for the PR, so the start snapshot and a round not yet recorded count as the run's)". README "Saved preferences": no reader-facing change (it names the subcommands, not the rule).

Commit: `redline: R1-1 count a run's own spec folders from its args in run check (#10)`.

## Task 3: R1-3 — the stopped-run step comes before the settings

Files: `skills/redline/SKILL.md`, `README.md`.

Change, in `skills/redline/SKILL.md`:

1. Move the "**A stopped run.**" paragraph and its "Resume" and "Start fresh" bullets (now in section 4, lines 73-80) to the end of section 2, after "A word that fits none of these stops the launch ..." and the dial list, as its own `### A stopped run` subsection. Its first sentence says it runs once the PR number is parsed, before section 3; drop "Before step 1".
2. In the Resume bullet, on exit 0, before relaunching: say in one line that the run resumes with its original settings, giving the marker's `args.interrupt`, revise model (`args.models.revise.model`), `args.maxRounds` and `args.scope`, and name every word typed after the PR number, which a resume ignores (`dry run`, `no push`, `autopilot` and the rest), or say nothing about typed words when there were none. Keep "skip sections 3, 4 and 5".
3. The Start fresh bullet: run `run clear`, then go on to section 3; its note about a failing clean-tree check now says "precheck step 4".
4. Update every reference to the moved block: section 3's first line ("on a resume (section 2, "A stopped run")"), and the "Write the marker" and relaunch paragraphs in section 7 that say "section 4, "A stopped run"". Find them with `grep -n "A stopped run" skills/redline/SKILL.md`.
5. Section 4's first line keeps "Skip this on a relaunch after a hand-off"; it no longer holds the marker check.

Proof: `grep -n "A stopped run" skills/redline/SKILL.md` shows the subsection heading inside section 2 (above `## 3.`) and every reference naming section 2; `grep -n "section 4, \"A stopped run\"" skills/redline/SKILL.md` prints nothing.

Docs: `skills/redline/SKILL.md` → README "Launching": after "The next `/redline:redline <pr>` offers to resume it or start fresh, naming the stage and the error.", add "It asks before anything else, and a resume keeps the run's original settings: the settings question is not asked, and words typed after the PR number are named and ignored."

Commit: `redline: R1-3 offer the resume before asking the settings (#10)`.

## Task 4: R1-4 — a second resume at the same label keeps the first's hand commits

Files: `scripts/redline-prefs.sh`, `tests/prefs-test.sh`, `tests/loop-test.mjs`, `skills/redline/SKILL.md`, `README.md`.

Change:

1. `scripts/redline-prefs.sh`, `run check`: after the HEAD block, merge `marker.args.resume[marker.label].hand` (when the marker's `label` is not empty and the entry exists) into `hand`: `commits` and `paths` each the earlier list plus the new one, without duplicates. Merge whether or not HEAD moved (a resume with no new hand commit must keep the earlier one). The outside-`.claude/` refusal and the plugin refusal's count keep reading the new commits only. The header's `run check` paragraph says `hand` "lists the commits and paths on top of the marker's head, plus the hand list the marker's own label already carries in its args.resume, which the workflow excuses".
2. `skills/redline/SKILL.md`, the Resume bullet's `error` item: `"hand": <the check's hand>` gains "(the script has already merged the label's earlier entry, so copy it as printed)".

Tests, red before green:

- `tests/prefs-test.sh`: a marker saved from an error record whose args carry `"resume": {"recheck r1": {"attempt": 2, "error": "x", "hand": {"commits": ["<H1>"], "paths": [".claude/redline/checks.json"]}}}` and whose result's `resumeFrom` is `{"label": "recheck r1", "attempt": 3}`, with HEAD equal to the marker's head: `check` prints `hand` with `<H1>` and `.claude/redline/checks.json`. Then a new commit on top touching `.claude/redline/other.json`: `hand` lists both commits and both paths. Neighbour: a marker whose args.resume entry is under another label (`check r2`) adds nothing to `hand`.
- `tests/loop-test.mjs`, in the resume scenario beside "resume: a hand commit is excused": a resume entry carrying two hand commits and two `.claude/` paths, with the checker reporting both as commits and as `unexpected_files`, passes the judge and the run finishes; neither commit is one of the run's.

Proof: `tests/prefs-test.sh` prints `N passed, 0 failed`; `node tests/loop-test.mjs` prints `N checks passed, 0 failed`.

Docs: `scripts/redline-prefs.sh` and `skills/redline/SKILL.md` → README "Launching": after "A hand commit under `.claude/` rides along in the entry: ...", add "A second resume at the same step keeps the earlier resume's hand commits: `run check` prints the list with the label's earlier entry merged in."

Commit: `redline: R1-4 keep a label's earlier hand commits on a second resume (#10)`.

## Task 5: R1-5 — a non-resumable error clears the marker

Files: `skills/redline/SKILL.md`.

Change: in section 7's `error` handler, the `resumeFrom` null branch first runs `${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run clear <repoRoot> <n>` (an earlier stop of the same run may have left a marker that no longer describes it), then says the run cannot be resumed and names the uncommitted spec folders, as now.

Proof: `grep -n "run clear" skills/redline/SKILL.md` lists the `error` handler beside `review-only`, `done`, `capped` and Start fresh.

Docs: `skills/redline/SKILL.md` → README "Launching": no reader-facing change; it already says a `gather` error "is not resumable: the error result says so and the next launch is fresh", which the clear makes true when an earlier stop left a marker.

Commit: `redline: R1-5 clear an earlier marker when an error cannot be resumed (#10)`.

## Task 6: R1-6 — the resume line gives the Finish comment and the record commit their duplicate checks

Files: `workflows/redline-loop.js`, `tests/loop-test.mjs`, `README.md`.

Change, in `workflows/redline-loop.js`, `resumeLine(opts)`: beside the shaper's replace sentence, one clause by label, appended after the generic sentence:

- `opts.label` is `handoff comment`, `cap-hit comment` or `summary comment`, and `postToGitHub` is true: " Before Step 2, run `${GH} pr-comments ${pr}`: when a comment there has exactly the body of the file Step 1 wrote, an earlier attempt posted it, so post nothing, return that comment's URL, and go on to Step 3."
- `opts.label` is `record commit`: " Before Step 1, run `git -C ${repoRoot} status --porcelain --untracked-files=all -- <the paths Step 1 names>`: when it prints nothing, an earlier attempt committed them, so skip Steps 1 and 2, set committed true and sha to the full SHA `git -C ${repoRoot} rev-parse HEAD` prints, and do Step 3."

Every other label's line is unchanged, and a run with no `args.resume` sends byte-identical prompts. Update the comment above `resumeLine()` to name the two clauses. The commands are the spellings the guard already allows the GitHub agent (`tests/guard-cases.tsv` rows 490 and 493; `pr-comments` is a read subcommand); no guard change.

Tests, in `tests/loop-test.mjs` resume scenario, red before green:

- The GitHub mock's Finish branch (the default `operation: 'handoff'` return) takes `scenario.finishError` as its `error`. A run with `finishError` stops at `finish` with `resumeFrom` `{label: 'handoff comment', attempt: 2}`; the relaunch with `resume: {'handoff comment': {...}}` (no `finishError`) finishes, and the `handoff comment` prompt ends with the generic line plus the comment clause, holding `pr-comments 114`.
- The existing "record: the commit fails" setup (`recordError`) stops with `resumeFrom` `{label: 'record commit', attempt: 2}`; the relaunch with that resume entry finishes, and the `record commit` prompt ends with the generic line plus the record clause. Neighbour: the `recheck r1` resume prompt carries neither clause.

Proof: `node tests/loop-test.mjs` prints `N checks passed, 0 failed`.

Docs: `workflows/redline-loop.js` → README "Launching": after the sentence on the shape stage ("A resume at the shape stage reruns the shaper ..."), add "A resume at the closing comment first looks for the comment an earlier attempt posted, and one at the record commit for the commit an earlier attempt made, so a request-review or a push that failed after them is retried without posting or committing twice."

Commit: `redline: R1-6 give the Finish comment and record commit a resume duplicate check (#10)`.

## Task 7: R1-2 — `run check` refuses a hand commit after any stop but an error

Decided by the author (Refuse it, 2026-11-01; see `shape.md`, Decisions). Runs after Tasks 3 and 4, so the Resume bullet it edits is the one Task 3 moved into section 2's `### A stopped run`, and the hand merge Task 4 added stays error-only by construction.

Files: `scripts/redline-prefs.sh`, `tests/prefs-test.sh`, `skills/redline/SKILL.md`, `README.md`.

Change:

1. `scripts/redline-prefs.sh`, `run check`, inside the `if [[ "$head" != "$mhead" ]]` block: right after the `merge-base --is-ancestor` refusal and the lines that compute `commits`, `paths`, `hand`, `n` and `plural`, and before the plugin refusal, read the marker's kind (`jq -r '.kind // ""' <<<"$entry"`); when it is not `error`, `refuse head-moved "the run stopped <where> and HEAD moved since ($n $plural); only a run that stopped with an error accepts a hand commit, so $fresh"`, where `<where>` is `at a hand-off` for `handoff`, `after posting a review` for `reviewed`, and `before returning a result` for `stopped` (and any other kind). An `error` marker goes on to the plugin and outside-`.claude/` refusals exactly as now. A marker of any kind whose HEAD equals its head is unaffected.
2. The header's `run check` paragraph: `head-moved` reads "(HEAD is not the marker's and not on top of it, the marker's kind is not error and HEAD moved at all, or the commits on top touch a path outside .claude/)", and the `hand` sentence says hand commits are accepted only on an error marker.

Tests, in `tests/prefs-test.sh`, red before green (add the case, run, see it fail, then change the script):

- New, right after "check: another plugin root is not the plugin case" (HEAD is `$HAND`, a `.claude/redline/checks.json` commit on top of `$RUNHEAD`): `reset -q --hard "$RUNHEAD"`, `run save "$REPO" 7 --run-id wf_3 --record "$REC/handoff.json"`, `reset -q --hard "$HAND"`; then "check: a hand commit after a hand-off is refused" expects `head-moved|the run stopped at a hand-off and HEAD moved since (1 commit); only a run that stopped with an error accepts a hand commit, so start fresh after committing or removing $FOLDER` (`[.reason, .line] | join("|")`). Then restore the error marker the later cases expect: `reset -q --hard "$RUNHEAD"`, re-save from `$REC/error.json` with `--run-id wf_1`, `reset -q --hard "$HAND"`.
- Neighbour: the existing "check: a hand commit under .claude/ is allowed" (an error marker with the same commit on top) still passes unchanged.

Proof: `tests/prefs-test.sh` prints `N passed, 0 failed`.

Skill: `skills/redline/SKILL.md`, the Resume bullet in `### A stopped run` (section 2 after Task 3): the parenthesis "(a fix outside `.claude/`, or any hand commit when this repository is the plugin, means a fresh run, ...)" becomes "(any hand commit after a stop that was not an error, a fix outside `.claude/` after an error, or any hand commit when this repository is the plugin, means a fresh run, ...)".

Docs: `scripts/redline-prefs.sh` and `skills/redline/SKILL.md` → README "Launching": in the `run check` sentence, "HEAD is neither the run's last commit nor on top of it" gains ", the run stopped other than with an error and HEAD moved at all (only an error resume carries a hand commit into the workflow)", and "the commits on top touch a path outside `.claude/` (a fix to the gate's ... is expected after an error; ...)" stays as the error case. README "Known limits", the stopped-run bullet: "A hand fix outside `.claude/`, or any hand commit when the repository under review is this plugin, is a fresh run" becomes "Only a run that stopped with an error accepts a hand commit, and only under `.claude/`: a hand commit after a hand-off, the review dial or a stopped run, a hand fix outside `.claude/`, or any hand commit when the repository under review is this plugin, is a fresh run, refused before launch".

Commit: `redline: R1-2 refuse a hand commit after a stop that was not an error (#10)`.

## Task 8: Verification Gate

Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-01-0935-59-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence (gate steps 1 to 9: syntax, manifest, guard, loop, prefs, gate stamp, setup, GitHub wrapper, background).

10. **Docs.** One entry per touched file, as the tasks give them:
    - `scripts/redline-prefs.sh` (Tasks 2, 4 and 7) → README "Launching", updated in those tasks' commits; (Task 7) also README "Known limits", the stopped-run bullet.
    - `skills/redline/SKILL.md` (Tasks 3, 4 and 7) → README "Launching", updated in those tasks' commits; (Task 5) no reader-facing change, the README already says a non-resumable error means a fresh launch.
    - `workflows/redline-loop.js` (Task 6) → README "Launching", updated in that task's commit.
    - No new config key, subcommand, allow rule or exit code.
11. **Standards retrospective.** Apply the list approved from `shape.md`'s "Standards retrospective (proposed)" in its own commit (`agent-os/standards/workflow/replay.md`, `agent-os/standards/workflow/agents.md`, `agent-os/standards/testing/tests.md`; item 4 as drafted for R1-2's answer, Refuse it: a clause on `workflow/agents.md`'s last bullet). If the approved list is empty, add "Standards retrospective: no changes" under Decisions in `shape.md`.
12. **Spec folder.** `plan.md` gets an "As built" section naming each task's commit and any deviation; a deviation is recorded under Decisions in `shape.md`.
