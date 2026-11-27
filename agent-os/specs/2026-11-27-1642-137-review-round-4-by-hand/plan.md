# PR #137, round 4 by hand: close the pull request after its round cap

## Context

Redline's run on #137 (#135, 0.5.1) stopped at its cap of 3 revise rounds with round 4's four findings open: R4-1, R4-2, R4-3 (correctness) and R4-4 (nit). No further Redline run follows. This spec fixes the four by hand, and settles three classes once each, by a table in `shape.md` measured by running, so a later review does not find a fifth member of any of them.

Read first: the four round reviews, all 23 threads (every one unresolved; R4-2, R4-3 and R4-4 have no reply, R4-1 sits in the review body), the cap-hit comment, and the three round folders plus round 4's `redline/` on this branch.

Spec folder: `agent-os/specs/2026-11-27-1642-137-review-round-4-by-hand/`.

## Decisions

From the brief (not reopened): fix R4-1 to R4-4; three class tables, measured; version stays 0.5.1, template untouched; replies drafted after the build and shown first; #138, #136, #133, #129 out of scope; guard and hook unchanged; no count in a standard; no AI attribution; the person makes every commit.

Answered while shaping (Decided by: @michaelfromtheoutfit, 2026-11-27):

1. **Template `-z` (table A).** `run check` reads both lists with `-z`. A resume with a name `git diff --name-only` quotes then stops at the gate, which names the file; README Known limits says so. The template's reads go to a drafted issue, which **opens with what a pull request whose own files include such a name does at the gate on an ordinary round, resume or not, as measured** (`docs/zé.md`, a committed change to the one file the snapshot allows: `unexpected_files` holds `"docs/z\303\251.md"`, exit 1).
2. **The workflow's `args.launch` throw (table B).** Kept. The precheck stops the one way the skill reaches it; loop-test 17a's seven cases stay unedited; the table says the throw remains for hand-built args only.
3. **#138's cell (table C).** Left to #138. The table marks it "already tracked in #138"; a comment is drafted under "For you to add".
4. **R1-5 and R2-4.** Both can be measured here. Measured as the first build task. **I say when the registry is about to change, and show the diff against the backup when it is restored, before the first result.** Then one question per finding.
5. **Round 3's R3-6 case.** Its tail only changes: the clause R4-3 corrects. Labels, update command, fixture and name stay. Named in `shape.md` and the boundary message as the one round case edited.

Mine, following from those (say so before approving if any should differ):

- **R4-2 is fixed at its source and takes R3-5 with it.** `version_plugin` reads the loaded copy's two facts and `redline-setup.sh version <repoRoot>` exits 2, with one line naming both files and both values, when `plugin.json`'s version is absent, is not a string, or is not the workflow file's `REDLINE_VERSION` (either quote style is read, so a copy that runs today is not newly refused). The skill's precheck sentence for exit 2 changes from "stop as section 1 does" to: say the script's line and stop; for this line, fix the files and reopen the session with the checkout loaded in place. R3-5's decline is superseded; a follow-up reply for its thread is drafted with the others.
- **One #135-build case changes its fixture, not its expectation:** setup-test's "a copy at another version reports its own version, blob and root" builds a copy at 9.8.7 whose workflow still says 0.5.1, which is R4-2's state. The fixture's constant is set to 9.8.7; the old fixture becomes a new red case.
- **R4-3's line names the installs.** When an install the session could switch onto is older than 0.5.1: "...and a run that switches onto `<scope version>` is not stopped: a build before 0.5.1 has no version check, so its relaunch reruns steps already recorded" (plus "; onto any other it stops at its next relaunch" when one at 0.5.1 or later also differs). Otherwise the sentence is as today. The line's ending is not touched. Two #135-build expectations and R3-6's tail change; "this session's 0.4.3, project 0.5.1" keeps its line.
- **A staged rename keeps today's reading** in `run check`: the destination is the path, the source is read and dropped. Pinned as the neighbouring decision.

## What the tables found (measured before this plan)

The tables are in `shape.md`; their scratch scripts and raw output were in the shaping session's scratchpad (`A/`, `B/`, `C/`). Each table gets an "As built" column at the gate, from the same script rerun.

**A. Git path lists (43 rows, `table-a.sh`).** Four reads in `redline-prefs.sh`, none in `redline-setup.sh` (its one git call is `hash-object`). `run drift`'s two (`diff -z --name-only`, `ls-files -z --others`): every kind of name listed as named. `run check`'s two: the hand list refuses a byte above 0x7f, a double quote, a backslash, a tab, a newline; the untracked list refuses those and also a space, and cuts a name at ` -> `. Other scripts: `checks-template.sh`'s git block reads `git diff --name-only` and `git ls-files --others` without `-z` (measured, above) and `tree_state` splits `status -z` on newlines; `redline-gh.sh`'s one read is a diff under `core.quotepath=off` with its limit already documented (#112); guard, gate and background read none.

**B. Version facts (60 rows, `table-b.sh`).** Eight readers. Rows that end in a throw or a loop today, all behind one reader, `version_plugin`: a manifest version that is absent, null, empty or false (args throw, R3-5); a number, object or array (refusal, then the reopen advice, which reloads the same files); manifest and constant disagreeing in either direction (R4-2); no constant (ReferenceError); a constant that is not a string. The marketplace entry has no reader at run time (`claude plugin validate` warns or errors). `version_line`, `copy_line` and the marker's readers end in exit 2 with the file named or in a refusal that leads to a fresh launch, which the fixed precheck then stops with the cause. `version_installs` never stops. The workflow's seven malformed-launch rows throw (decision 2).

**C. What-happens-next sentences (50 rows).** Rows are the sentences #137 added in the two scripts' lines, the workflow's refusal, the skill, `docs/running.md`, `docs/upgrading.md`, `docs/setup.md`, the README and CONTRIBUTING. Columns: fresh launch, relaunch, installed release, loaded in place, other install older than 0.5.1. Cells are runs: tables A and B, `older-workflow.txt` (each of the six cached releases, 0.2.0 to 0.4.5, starts under a 0.5.1 launch record), `older-skill.txt` (0.4.5's own `run check` and `run drift` pass a 0.5.1 marker), `cells.txt`, and the #135 probes for what a session loads (same Claude Code, 2.1.332). Found so far, each a rewording or already decided:
  - R4-3: the warning, its docblock, the skill's precheck sentence.
  - R4-4: "either kind" in three places, and the deferred section's one `run drift`.
  - R4-2: the error section's reopen advice, for a copy that disagrees with itself.
  - `docs/upgrading.md`: "not relaunched under another version at all, on any repository" and "refused, never run" are false for a switch onto an older install; `docs/running.md` and the skill state the rule with no pointer to that gap.
  - Skill, "Save the run record": "the marker holds what `run drift` reads" is false; with the record gone drift has no pinned copy and falls to the blob.
  - `docs/running.md`: "On the plugin's own repository, a round whose commits change the version ... ends the run" holds only when loaded in place.
  - The update advice ends "restart the session or run /reload-plugins" with the launch going on: a caution about reloading during a run goes in the skill and `docs/upgrading.md`.
  - "start fresh" after a version commit in place: #138 (decision 3).

If writing table C out finds anything that is not a rewording, it comes to you as a question before its slice.

## Tasks (stop at each commit boundary; you commit)

**Task 1. Save spec documentation.** `plan.md`, `shape.md` (scope, decisions, the three tables with counts, "For you to open", "For you to add"), `standards.md`, `references.md`. Boundary 1.

**Task 2. Measure R1-5 and R2-4** with the `probe135` plugin from the #135 session's scratchpad. Back up `installed_plugins.json`, `known_marketplaces.json`, `settings.json`; announce; add the marketplace; install at user scope and at project scope from the `/tmp/...` spelling of a scratch repository; read `projectPath` (R2-4); disable at user scope; read `enabled` per install; one headless session, one reopen, one `/reload-plugins` to see which install loads (R1-5); remove everything; show the diff against the backup; then the results, one question each. A fix either calls for is its own slice with a setup-test case; otherwise a line in `shape.md` and, where something is left, a drafted issue. No commit of its own.

**Task 3. R4-1** (`scripts/redline-prefs.sh`, `tests/prefs-test.sh`). Hand list from `git diff -z --name-only`; untracked list from `git status --porcelain=v1 -z --untracked-files=all`, each entry's two status letters read and a rename's or copy's second field dropped; both through one NUL-delimited reader that prints JSON strings (`agent_paths`' way). Cases, red first: a hand commit to `.claude/redline/zé.json` after an error stop resumes; untracked `zé.md`, `z q.md` and `a -> b.md` in a listed spec folder pass; the same names outside it are refused and named as they are; a staged rename inside the folder to a quoted name passes; neighbours: the ASCII cases and a rename out of the folder, unchanged. Docs: the header's `run check` paragraph and its mirror in `docs/scripts.md`; README Known limits, one line (decision 1); `docs/running.md` "Run markers and resume" if its wording needs it. Boundary 2.

**Task 4. R4-2 and R3-5** (`scripts/redline-setup.sh`, `skills/redline/SKILL.md`, `skills/setup/SKILL.md`, `tests/setup-test.sh`). As under "Mine" above. Cases, red first: absent, a number, each direction of disagreement, no constant line: exit 2 and the line; neighbours: an agreeing copy and a double-quoted constant exit as before. Docs: setup header and `docs/scripts.md`; `docs/running.md` (the precheck paragraph, "The workflow, at startup"); `docs/setup.md` Verify; `docs/contract.md` if it lists `version`'s exits. Boundary 3.

**Task 5. R4-3** (`scripts/redline-setup.sh`, `skills/redline/SKILL.md`, `tests/setup-test.sh`). The clause, the docblock, the header. Cases: one older install below 0.5.1; one below and one at or above; all at or above (today's sentence, neighbour); the three changed expectations. Docs: `docs/scripts.md`; `docs/upgrading.md` (the two overclaims, the reload caution); `docs/running.md` (a pointer to the gap); the skill's precheck sentence. Boundary 4.

**Task 6. R4-4 and table C's remaining rewordings** (`skills/redline/SKILL.md`, `docs/running.md`, `tests/loop-test.mjs`). "any kind" at the three places; the deferred section names the second `run drift` in the relaunch turn; "Save the run record"; "loaded in place". Two `statements` checks in loop-test pin R4-4's two sentences, red first. No workflow change, so no prompt changes. Boundary 5.

**Task 7. Verification Gate.** `.claude/redline/checks.sh --baseline` green. CI's shellcheck command (`shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`) is also run before boundaries 2, 3 and 4, its output shown. Docs entries each name their commit. Version: kept at 0.5.1 on purpose (the pull request already carries its bump). Tables rerun for "As built". Standards retrospective put to you with AskUserQuestion, applied in its own commit (boundary 6). `plan.md` "As built" and deviations (boundary 7).

**Task 8. Replies**, after your last code commit, in `<spec folder>/redline/`, shown to you before anything is posted: `round-4-reply-R4-2.md`, `-R4-3.md`, `-R4-4.md` as thread replies (`Redline round 4: fixed in <sha> (<subject>). · decided by: @michaelfromtheoutfit`); `round-4-reply-R4-1.md` as a pull request comment opening with `<!-- redline:R4-1 -->` and the `**R4-1** · \`scripts/redline-prefs.sh:439\` · from the Redline round 4 review body` line; a follow-up for R3-5's thread; follow-ups for R1-5 and R2-4 if Task 2 changes either. You post them through a session after the push.

## For you to open / to add (drafted in `shape.md`; open list searched 2026-11-27, none covers them)

- **Open:** read the gate's git block with `-z` (`scripts/checks-template.sh`: the changed list, `tree_state`), a template version and a minor bump; opens as decision 1 says, then the resume case and the workflow's exact-string excuse.
- **Open:** `run drift`'s no-pin line gives "the launch ran from the file itself" when the record file is gone. Outcome safe, reason wrong.
- **Open, if left after Task 2:** R1-5, R2-4.
- **Add to #138:** the three "start fresh" sentences table C found, and that R4-2's precheck stop now comes first for a copy that disagrees with itself.

## Verification

- Each harness red before green per slice: `tests/prefs-test.sh`, `tests/setup-test.sh`, `node tests/loop-test.mjs`.
- `table-a.sh`, `table-b.sh` and the table C runs again on the built tree: no row of A unnamed in `run check`; no row of B behind `version_plugin` ends in a throw or a loop; every C cell true, not arising, or "tracked in #138".
- `.claude/redline/checks.sh --baseline` exits 0; `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .` as CI runs them; `git status` clean of anything outside the slices.
- After you post: `scripts/redline-gh.sh prior-findings 137` reads R4-1 to R4-4 as fixed.

## As built

Written at the gate (Task 7).
