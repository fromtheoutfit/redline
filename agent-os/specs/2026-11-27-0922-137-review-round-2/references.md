# References for PR #137 Review Round 2

Shaped by Redline in unattended mode. Every file below was opened for this round; line numbers are at `704bbaf`.

## Similar Implementations

### `run drift` and `run check`

- **Location:** `scripts/redline-prefs.sh`.
  - The header's `run check` entry (58-75) and `run drift` entry (76-106).
  - `realdir` (133).
  - `version_line` (178-201) and the `--plugin` check (202-204).
  - `run drift` (276-371):
    - the version refusal (282-289);
    - the copy block (290-318), its `diff -rq` at 307;
    - the start commit on the plugin's own repository (319-326);
    - the live file, the pin and the blob comparison under `git -C "$root"` (327-348);
    - the #81 list of changed agent files (349-353).
  - `run check` (373-457): the `session` reason (385-388), the `version` reason (389-390), `branch` (391-395).
- **Relevance:**
  - R2-1: the copy block's comparison and the #81 list.
  - R2-2: the blob comparison under `git -C`.
  - R2-3: the copy block lives in drift alone, while `run check` has the version check only.
  - R2-5: the exit 2s.
- **Key patterns:**
  - `version_line`: a helper shared by check and drift that prints a refusal line or nothing, which Task 4's `copy_line` copies.
  - The `refuse` helper of `run check`.
  - `realdir` for comparing two copies.

### `version_installs`

- **Location:** `scripts/redline-setup.sh`.
  - `PLUGIN_ROOT` (164).
  - `version_installs` (1508-1532): the visible filter's `projectPath` comparison with `$rootp` (1517), and `mine`'s two spellings (1515).
- **Relevance:** R2-4's claim and its second look. `PLUGIN_ROOT` is already absolute, so setup is not a member of R2-2's class.

### The skill's stops, resume and relaunch

- **Location:** `skills/redline/SKILL.md`.
  - The opening (9): every stop leaves a marker.
  - Section 1 (15): `repoRoot` is `git rev-parse --show-toplevel`.
  - Section 2's Resume bullet (51) and its `handoff`/`reviewed` clause (53), and the relaunch line (55).
  - Section 7's opening (173).
  - The plan dial (194), the review dial (200), "Relaunch only from the word" (237).
  - "Save the run record" (241), "Write the marker" (243).
  - "The script a relaunch runs" (245-251), its `refuse` bullet (249) and its exit-2 sentence (251).
  - The deferred hand-off (263).
- **Relevance:**
  - R2-3: the Resume bullet's `version` clause.
  - R2-5: the exit 2s.
  - R2-6: where the marker and `run drift` sit at each stop and on a resume.

### The harness

- **Location:** `tests/prefs-test.sh`.
  - The fixtures (172-211): `REC`, `PLUG`, `LBLOB`, `L`, `G`, `FOLDER`.
  - The `run`, `runj`, `runx` and `runerr` helpers (212-234).
  - The `run check` cases (304-412).
  - The drift cases (415-555):
    - `$DRIFT` (431);
    - the fallback marker `wf_22` (446-451);
    - the R1-3 block, with `cline`, `CPIN`, `plugin3`, `plugin4` and the gone launch copy (455-490);
    - the #81 list's untracked agent file (543-545).
- **Relevance:** where Tasks 2, 3 and 4 add cases, and the state each insertion point leaves.
- **Key patterns:**
  - Records under `$REC` with `L` for `args.launch`.
  - `run save ... --record` to switch the marker.
  - `cline` for the copy line.
  - `"${G[@]}" checkout -q -b other` for a branch case.
- **Also read:** `tests/loop-test.mjs`, which is the only harness that reads `skills/redline/SKILL.md`. None of its reads holds the sentences Tasks 5 and 6 change.

### The docs

- **Location:**
  - `docs/running.md`: "Hand-off and relaunch" (137-174), its bullets on another copy (162) and on an agent file changed (166), and its sentence on a marker that could not be written (168); "Run markers and resume" (223-225).
  - `docs/scripts.md`: the `redline-prefs.sh` block (194-311).
  - `docs/upgrading.md`: "A stopped run across a version change (#135)" (50-69), unchanged by this round.
  - `README.md`: the file table (74) and the Known limits bullet on a self-review that edits an agent file (115), unchanged.
- **Relevance:** each task's Docs entry; the README's file table for what an agent file is.

### The pull request's own spec

- **Location:** `agent-os/specs/2026-11-26-1135-135-refuse-relaunch-other-version/`.
  - `shape.md`: decisions 1 to 5; answers (a) to (c); "Decision 4, agent files"; "How the refusal offers Start fresh"; the deviations as built, 2 and 7.
  - The probes: findings 6 (a pinned script runs with the session's agents) and 7 (a checkout loaded in place).
- **Relevance:**
  - The unattended answers for R2-2 (deviation 2's `git -C`) and R2-3 (how a refusal is offered on a resume).
  - R2-6's reading of "At a relaunch in the session".

### Round 1's spec

- **Location:** `agent-os/specs/2026-11-27-0922-137-review-round-1/`.
  - `shape.md`: R1-1 (a self-review's version bump ends the run), R1-3 (the copy check, its `cause`), R1-7 (the reopen lines, now #138), the deviations as built.
  - `plan.md`: Task 3 and the As built counts.
- **Relevance:**
  - R2-3's `sameClassAs` R1-3 and its premise.
  - R2-6's trigger.
  - The commit-message constraint of deviation 1.

### The standards

- **Location:** `agent-os/standards/`.
  - `workflow/agents.md` 3, 17 and 45.
  - `workflow/replay.md` 20, 23 and 24.
  - `scripts/bash-conventions.md` 8, 10, 11, 28, 29, 43 and 49.
  - `testing/tests.md` 13, 30 and 35.
  - `process/docs-gate.md` 5, 16 and 20.
  - `process/release.md` 5.
  - `prompts/attribution.md`.
- **Relevance:** `standards.md` copies the applied lines; the retrospective items name where each goes.

### The scratch copies

- **Location:** `/tmp/redlinerepro/`:
  - `shaper-r2-launch/agents/redline-shaper.md`;
  - `shaper-r2-session/agents/redline-shaper.md`, `.DS_Store` and `redline-shaper.md~`.
- **Relevance:** R2-1's measurement. `diff -rq` reports both strays and exits non-zero, while the top-level `*.md` lists agree and `cmp -s` finds the pair equal.

### The machine's install registry and plugin cache

- **Location:**
  - `~/.claude/plugins/installed_plugins.json`: the Redline entries' `scope`, `projectPath` and `version`, read-only.
  - `~/.claude/plugins/cache/claude-plugins-official/expo/1.13.9/agents/` (holds only `openai.yaml`), and `~/.claude/plugins/cache/redline/redline/0.4.5/agents/` (the eight `redline-*.md` files).
  - `~/.claude/projects/`: the session directories' names.
- **Relevance:**
  - R2-4's second look.
  - R2-1's evidence that a release can hold a non-agent file in `agents/`.

### Open issues and the PR's comments

- **Location:**
  - `scripts/redline-gh.sh issues-search` for `agent files`, `run drift`, `projectPath` and `marker`;
  - `scripts/redline-gh.sh pr-comments 137`.
- **Relevance:** none of the round's findings is already tracked. #138 is round 1's R1-7 issue, which R2-3's line leaves to its own class.
