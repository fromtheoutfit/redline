# PR #71 Review Round 1 — Plan

Shaped by Redline in unattended mode. Seven findings on PR #71 (issue #14, the public docs). Six are `fix`, every one a doc edit in a file the PR adds: R1-1 repoints a cross-reference in `CONTRIBUTING.md` to `docs/contract.md`; R1-2 puts back, in `CONTRIBUTING.md` "Releases", the Claude Code version `claude plugin tag` needs; R1-3 corrects the guard-table timing sentence in `docs/guard.md`; R1-5 deletes a repeated sentence in `docs/running.md` "Precheck"; R1-6 corrects the opening claim of `docs/scripts.md` about what every script prints; R1-7 drops three bold lead-ins in `docs/upgrading.md` that repeat their headings. R1-4 (correctness: after a dry run the next launch stops at the precheck, where the docs and the skill say it starts at round 1) was `ask`, returned to the person as a product decision, and decided on 2026-11-04 as "Docs: drop the commits before the next run" (`shape.md`, Decisions, R1-4). Its task says, in `docs/running.md`, `docs/setup.md` and the `review-only` summary in `skills/redline/SKILL.md`, to copy a dry run's spec folder out if it is worth keeping and then `git reset --hard origin/<branch>` before the next launch.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-04-0950-71-review-round-1/redline/snapshot.json`.

Every command below is a plain pipeline run from the repository root (`/Users/michaelwitwicki/Code/Claude/redline`). No task adds or changes a test case, so every harness should end the round at its count before the round; if a count before Task 2 differs from the end, record it under As built.

Version step: the PR already bumps `0.1.0` to `0.1.1` (decision 7 of the #14 plan, a patch: no template change). This round changes docs only, plus one sentence of a skill (R1-4, `skills/redline/SKILL.md:167`, no template), so `0.1.1` stands and nothing is bumped again.

Docs step (gate step 10): Tasks 2 to 7 change `CONTRIBUTING.md` or a file under `docs/`. None is under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and none adds a config key, subcommand, allow rule or exit code, so those tasks need no Docs entry (`agent-os/standards/process/docs-gate.md`: "A change to `docs/` is reader-facing by nature and needs no Docs entry of its own"). Task 8 (R1-4) changes `skills/redline/SKILL.md` and names its entry: `docs/running.md` "Launching a run", updated in the same commit.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the findings' commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-04-0950-71-review-round-1/plan.md`
- `agent-os/specs/2026-11-04-0950-71-review-round-1/shape.md`
- `agent-os/specs/2026-11-04-0950-71-review-round-1/standards.md`
- `agent-os/specs/2026-11-04-0950-71-review-round-1/references.md`

**Commit:** `redline: save review round 1 spec for PR #71 (#14)`

## Task 2: R1-1 — point "Template version" at docs/contract.md in CONTRIBUTING.md

**Files:** `CONTRIBUTING.md`.

1. `CONTRIBUTING.md`, line 7, the "Developing the plugin" paragraph. Replace exactly:

   ```text
   (`redline-setup.sh version`, "Template version" under `checks.sh`)
   ```

   with:

   ```text
   (`redline-setup.sh version`, "Template version" in [docs/contract.md](docs/contract.md))
   ```

   Change nothing else in the paragraph. The target heading exists: `docs/contract.md:97` is `## Template version`, and its paragraph ends with the self-hosted warning this sentence means (`this repository is the plugin, but the run loads Redline from <dir>; ...`, #16).
2. Proof:
   - `grep -cF '"Template version" in [docs/contract.md](docs/contract.md)' CONTRIBUTING.md` prints `1` (was `0`).
   - `grep -cF '"Template version" under' CONTRIBUTING.md` prints `0` (was `1`).
   - `grep -c '^## Template version' docs/contract.md` prints `1` (the link's target heading).
3. No harness reads `CONTRIBUTING.md`; Task 10's gate run is the check that nothing else moved.

**Docs (gate step 10):** `CONTRIBUTING.md` is the reader-facing text itself and is not under a Docs directory; no entry.

**Commit:** `redline: R1-1 point "Template version" at docs/contract.md in CONTRIBUTING.md (#14)`

## Task 3: R1-2 — say which Claude Code claude plugin tag needs, in CONTRIBUTING.md "Releases"

**Files:** `CONTRIBUTING.md`.

1. `CONTRIBUTING.md`, line 29, the "Releases" paragraph. Replace exactly this substring of the line:

   ```text
   `claude plugin tag --dry-run .` and `claude plugin tag --push`, which validates the manifest,
   ```

   with:

   ```text
   `claude plugin tag --dry-run .` and `claude plugin tag --push` (`claude plugin tag` is Claude Code 2.1.316's), which validates the manifest,
   ```

   Change nothing else. The README's Requirements line (`README.md:9`) and `docs/setup.md:16` keep only the proven range: the subcommand is a maintainer's release step, so the clause goes back beside the step that runs it (shape.md, R1-2).
2. Proof:
   - `grep -cF "is Claude Code 2.1.316's)" CONTRIBUTING.md` prints `1` (was `0`).
   - `grep -rn 2.1.316 README.md docs CONTRIBUTING.md` lists `README.md:9`, `docs/setup.md:16` and `CONTRIBUTING.md:29`.
3. No harness reads `CONTRIBUTING.md`.

**Docs (gate step 10):** `CONTRIBUTING.md` is the reader-facing text itself; no entry.

**Commit:** `redline: R1-2 say which Claude Code claude plugin tag needs, in CONTRIBUTING.md Releases (#14)`

## Task 4: R1-3 — say the 78 seconds was the whole baseline, in docs/guard.md

**Files:** `docs/guard.md`.

1. `docs/guard.md`, line 170. Replace exactly:

   ```text
   About 60 ms a row (389 rows took 78 seconds on 2026-10-26, most of this repository's gate).
   ```

   with:

   ```text
   About 60 ms a row; this repository's whole baseline, the guard table included (389 rows then), took 78 seconds on 2026-10-26.
   ```

   Keep the sentence after it (the one on `REDLINE_GUARD_LOG`) as it is. The figures come from `.claude/redline/checks.sh:28` ("Baseline on 2026-10-26: 78 seconds, most of it the guard table (389 rows at about 60 ms each)"), where 78 seconds is the whole baseline. The new sentence does not repeat "most of", which 389 rows at 60 ms (about 23 s) does not bear out.
2. Proof:
   - `grep -cF "this repository's whole baseline, the guard table included (389 rows then), took 78 seconds" docs/guard.md` prints `1` (was `0`).
   - `grep -cF "most of this repository's gate" docs/guard.md` prints `0` (was `1`).
3. No harness reads `docs/guard.md`.

**Docs (gate step 10):** a `docs/` change; no entry.

**Commit:** `redline: R1-3 say the 78 seconds was the whole baseline, in docs/guard.md (#14)`

## Task 5: R1-5 — drop the repeated background sentence in docs/running.md "Precheck"

**Files:** `docs/running.md`.

1. `docs/running.md`, line 29, the second paragraph of "Precheck" (it opens "Before any of that, the precheck runs `redline-gate.sh check`"). Delete its last sentence, with the one space before it:

   ```text
    The workflow runs in the background and the session waits for it.
   ```

   so the paragraph ends `([contract.md](contract.md), "Snapshot file").`. Keep the same sentence in line 27, the section's first paragraph. Change nothing else.
2. Proof:
   - `grep -cF 'The workflow runs in the background and the session waits for it.' docs/running.md` prints `1` (was `2`).
   - `grep -cF '"Snapshot file"). The workflow runs' docs/running.md` prints `0` (was `1`).
3. No harness reads `docs/running.md`.

**Docs (gate step 10):** a `docs/` change; no entry.

**Commit:** `redline: R1-5 drop the repeated background sentence in docs/running.md Precheck (#14)`

## Task 6: R1-6 — say what the scripts print, in docs/scripts.md

**Files:** `docs/scripts.md`.

1. `docs/scripts.md`, line 5. Replace exactly:

   ```text
   Every script starts `set -euo pipefail`, prints one JSON object on stdout and progress on stderr, and exits 2 on a usage error; a script whose exit code is an answer says so in its header.
   ```

   with:

   ```text
   Every script starts `set -euo pipefail`, writes progress to stderr and exits 2 on a usage error. What a subcommand prints is in its header: most print one JSON object, but `redline-gh.sh diff` prints a unified diff, `pr-comments` and `issues-search` print text, `redline-gate.sh stamp` prints the stamp line, and a subcommand whose exit code is the answer (`redline-gh.sh has-review`) says so.
   ```

   Keep the next sentence (it opens "Who may run each one is the guard's table") and every quoted header as they are. Each claim is from a header the file quotes: `scripts/redline-gh.sh:9-13` (`diff`), `:14-15` (`pr-comments`, `issues-search`), `:18` (`has-review`, "exit 0 if ..., 1 if none, 2 on error"), `scripts/redline-gate.sh:12-13` (`stamp`, "Print the stamp line").
2. Proof:
   - `grep -cF 'prints one JSON object on stdout and progress on stderr' docs/scripts.md` prints `0` (was `1`).
   - `grep -cF 'What a subcommand prints is in its header' docs/scripts.md` prints `1` (was `0`).
3. No harness reads `docs/scripts.md`, and no quoted header changes.

**Docs (gate step 10):** a `docs/` change; no entry. No script changes, so the quoted headers stay as copied at 0.1.1.

**Commit:** `redline: R1-6 say what the scripts print, in docs/scripts.md (#14)`

## Task 7: R1-7 — drop the bold lead-ins that repeat their headings, in docs/upgrading.md

**Files:** `docs/upgrading.md`.

1. `docs/upgrading.md`, three paragraphs, each directly under a heading of the same words. Delete only the bold lead-in and the one space after it, at the start of the line:
   - line 7, under `## Updating the plugin`: delete `**Updating the plugin.** ` so the line opens with `` `claude plugin update redline@redline` in a terminal ``;
   - line 21, under `## Allow-list entries retired by #50`: delete `**Allow-list entries retired by #50.** ` so the line opens with `` `templates/settings.allow.json` no longer carries ``;
   - line 25, under `## Unattended section versions (#15)`: delete `**Unattended section versions (#15).** ` so the line opens with `` `templates/shape-spec-unattended.md`, the section ``.

   Keep the headings and the rest of each paragraph as they are.
2. Proof:
   - `grep -cF '**Updating the plugin.**' docs/upgrading.md` prints `0` (was `1`).
   - `grep -cF '**Allow-list entries retired by #50.**' docs/upgrading.md` prints `0` (was `1`).
   - `grep -cF '**Unattended section versions (#15).**' docs/upgrading.md` prints `0` (was `1`).
   - `grep -c '^## ' docs/upgrading.md` prints `5` (unchanged: the five headings stay).
3. No harness reads `docs/upgrading.md`.

**Docs (gate step 10):** a `docs/` change; no entry.

**Commit:** `redline: R1-7 drop the bold lead-ins that repeat their headings, in docs/upgrading.md (#14)`

## Task 8: R1-4 — tell a person to drop a dry run's commits before the next run

**Decided** by @michaelfromtheoutfit on 2026-11-04: option 1, "Docs: drop the commits before the next run" (`shape.md`, Decisions, R1-4). The workflow change (option 4) is the person's own follow-up issue; nothing here builds it.

**Files:** `docs/running.md`, `skills/redline/SKILL.md`, `docs/setup.md`.

The fact the change states: a `dry run` commits its record locally and never pushes it (`workflows/redline-loop.js:2969-2971`, the review-only path's `commitRecord()`; `:1469`, "Do not push (... 'this is a dry run')"). HEAD is then ahead of the PR's head, and the next fresh launch stops at precheck step 5 (`skills/redline/SKILL.md:89`, "`git rev-parse HEAD` must equal `headRefOid`") with "pull or push so HEAD matches the PR" (`:98`).

1. `docs/running.md`, line 23, "Launching a run". Replace exactly this substring of the line:

   ```text
   so a `dry run review only` leaves exactly one commit, the record, and nothing on GitHub. Because nothing was posted, the next `/redline:redline <pr>` finds no Redline round on the PR (`redline-gh.sh last-round` reads the posted reviews) and starts at round 1 with no carried findings: a dry run's review is a record under its spec folder, not a round the next run continues.
   ```

   with:

   ```text
   so a `dry run review only` leaves exactly one commit, the record, and nothing on GitHub. Those commits put HEAD ahead of the PR's head, so the next launch stops at the precheck (`pull or push so HEAD matches the PR`) until they are gone. Do not push them: copy the round's spec folder outside the repository if the review is worth keeping, then drop them with `git reset --hard origin/<branch>`. Because nothing was posted, the next `/redline:redline <pr>` then finds no Redline round on the PR (`redline-gh.sh last-round` reads the posted reviews) and starts at round 1 with no carried findings: a dry run's review is a record, kept only where you copied its spec folder, not a round the next run continues.
   ```

   Change nothing else in the line; the later "the review-only run commits its record, so the tree is clean for the next launch" is about a posted `review only`, whose record commit is pushed, and stays. The last clause's "a record, kept only where you copied its spec folder" replaces "a record under its spec folder", which the reset makes untrue (option 1's effect: "The dry run's record survives only where you copied it").
2. `docs/running.md`, line 104, "The run record". Replace exactly:

   ```text
   posts nothing and pushes nothing: its commits, the record included, stay on the local branch.
   ```

   with:

   ```text
   posts nothing and pushes nothing: its commits, the record included, stay on the local branch until you drop them before the next launch (see "Launching a run" above).
   ```

3. `skills/redline/SKILL.md`, line 167, the `review-only` summary's dry-run clause. Replace exactly:

   ```text
   in a dry run say instead that nothing reached GitHub, so a later run starts at round 1 and carries nothing, and the review is the record under the round's spec folder. Stop.
   ```

   with:

   ```text
   in a dry run say instead that nothing reached GitHub and the record commit is local only: before the next launch, copy the round's spec folder outside the repository if the review is worth keeping and drop the commit (`git reset --hard origin/<branch>`), since the precheck stops while HEAD is ahead of the PR; a later run then starts at round 1 and carries nothing, and the review is the record under the round's spec folder until then. Stop.
   ```

   Change nothing else in the section. The finished-run summary (`SKILL.md:227`) makes no claim about the next launch and is not touched.
4. `docs/setup.md`, line 144, "Before the first real PR". Replace exactly:

   ```text
   and missed one race (the README, Known limits).
   ```

   with:

   ```text
   and missed one race (the README, Known limits). Its record commit stays local; drop it before the next launch ([running.md](running.md), "Launching a run").
   ```

5. Proof (each string occurred exactly once before the change):
   - `grep -cF 'Do not push them: copy the round' docs/running.md` prints `1` (was `0`).
   - `grep -cF 'git reset --hard origin/<branch>' docs/running.md` prints `1` (was `0`); the same in `skills/redline/SKILL.md` prints `1` (was `0`).
   - `grep -cF "a dry run's review is a record under its spec folder" docs/running.md` prints `0` (was `1`).
   - `grep -cF 'stay on the local branch until you drop them before the next launch' docs/running.md` prints `1` (was `0`).
   - `grep -cF 'the record commit is local only: before the next launch' skills/redline/SKILL.md` prints `1` (was `0`).
   - `grep -cF 'so a later run starts at round 1 and carries nothing' skills/redline/SKILL.md` prints `0` (was `1`).
   - `grep -cF 'Its record commit stays local; drop it before the next launch' docs/setup.md` prints `1` (was `0`).
   - `grep -c '^## ' docs/running.md docs/setup.md` prints the same counts as before (no heading added or removed).
6. No harness reads these sentences (`grep -rnF` for each replaced string over `tests/`, `scripts/` and `workflows/` finds nothing), so no case is added or changed; Task 10's gate run is the check that nothing else moved.

**Docs (gate step 10):** `skills/redline/SKILL.md`: `docs/running.md` "Launching a run" (and "The run record"), updated in this commit. `docs/running.md` and `docs/setup.md` are `docs/` changes, which need no entry. No config key, subcommand, allow rule or exit code is added.

**Commit:** `redline: R1-4 tell a person to drop a dry run's commits before the next run (#14)`

## Task 9: Standards retrospective (as approved)

Apply the edits the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", in one commit of their own. Keep each file's headings. Item 3 (R1-4, decided as option 1) is drafted as no change, so it adds no file.

**Files:**

- `agent-os/standards/scripts/bash-conventions.md` (line 6: item 1)
- `agent-os/standards/index.yml` (the `bash-conventions` description: item 2)

If the approver approves none, change no file and record "Standards retrospective: no changes" under Decisions in `shape.md`, in the as-built commit.

**Commit:** `redline: record the round 1 review lessons in the standards (#14)`

## Task 10: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-04-0950-71-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence.** The recorded baseline is 78 seconds (`.claude/redline/checks.json`), so it runs in the foreground. Expect every harness at its count before the round: no task adds or changes a case.

10. **Docs:** confirm each entry names its commit or its reason:
    - Tasks 2 and 3 (`CONTRIBUTING.md`): the reader-facing text itself; not under a Docs directory.
    - Tasks 4 to 7 (`docs/guard.md`, `docs/running.md`, `docs/scripts.md`, `docs/upgrading.md`): `docs/` changes, which need no entry.
    - Task 8 (R1-4, decided as option 1): `skills/redline/SKILL.md` names `docs/running.md` "Launching a run", updated in the R1-4 commit; `docs/running.md` and `docs/setup.md` are `docs/` changes, which need no entry.
    No new config key, subcommand, allow rule or exit code.
11. **Version:** `.claude-plugin/plugin.json` and the marketplace entry stay `0.1.1`, the PR's own patch bump; the setup test's last cases prove the two agree.
12. **Standards retrospective:** Task 9, as approved, or "Standards retrospective: no changes" under Decisions in `shape.md`.
13. **Spec folder:** add an "As built" section to this file with each task's commit, the proof outputs, the gate's counts and any deviation. Record each deviation under Decisions in `shape.md` too. This lands in the round's last commit.

**Files:** `agent-os/specs/2026-11-04-0950-71-review-round-1/plan.md`, `agent-os/specs/2026-11-04-0950-71-review-round-1/shape.md`.

**Commit:** `redline: record PR #71 round 1 as built (#14)`
