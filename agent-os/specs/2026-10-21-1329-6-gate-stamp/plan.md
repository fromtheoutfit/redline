# #6, first half: the gate stamp (`scripts/redline-gate.sh`)

Spec folder: `agent-os/specs/2026-10-21-1329-6-gate-stamp/`. Shaped in plan mode on 2026-10-21 on branch `feature/6-redlinesetup-walk-a-repository-through-the-contract-and-stamp-the-gate-against-drift` at 1620fe1, clean tree.

## Context

`checks.sh` is a transcription of the Verification Gate in a repository's `shape-spec.md`. When someone adds a gate step later, `checks.sh` goes on passing without it and nobody notices. Issue #6 asks for two things: a `/redline:setup` skill that walks a repository through the contract, and a **gate stamp** that records a hash of the gate's commands in `checks.sh` so a launch refuses to run against a gate that moved.

The owner split the issue: **this spec ships the stamp**; the setup skill is a second spec on #6 after this PR merges. Decisions taken while shaping (recorded in `shape.md`, each `decided by: @michaelfromtheoutfit`):

1. **Hash scope.** sha256 over every backticked span and every fenced block in the whole gate section, in document order, nested sub-bullets included, whitespace-normalised. Prose edits never change it; any backticked change does. Classification of steps into command and prose happens only at setup, where a person confirms it; it never touches the hash. The stamp's `steps m-n` is for the reader. A false positive costs a restamp; a false negative is the drift the stamp exists to catch, so the hash errs toward firing.
2. **No stamp stops the launch**, same message shape as a mismatch. This breaks Chalkboard and Losers League the moment it merges, until each is stamped once by hand; the README's Upgrading note says so.
3. **Scope**: `scripts/redline-gate.sh` (`extract|stamp|check`), `tests/gate-test.sh` with trimmed fixtures for the gate shapes seen so far, the check as the first step of the main skill's precheck (fresh launches only), the template and README updates for the stamp line, and this repository dogfooding it: a sixth gate step, `checks.sh` restamped, the unattended section repointed.
4. **Check site**: the skill precheck, fresh launches only. No workflow or loop-test change.

Until `/redline:setup` exists, an existing repository gets its first stamp by running `scripts/redline-gate.sh stamp` by hand; the check's failure message says so.

## The script: `scripts/redline-gate.sh`

Bash with `set -euo pipefail`; the parsing and the header edit are two `python3 -I -c "$PYTHON"` programs fed on stdin (standard library only, as `scripts/redline-guard.sh` does; neither writes beside the script); `jq` for JSON assembled in bash. Header comment in the standard order: what it is, usage, output contract, exit codes (`check`'s exit code is an answer, so the header says so).

```
redline-gate.sh extract <shape-spec.md>
    One JSON object on stdout: {file (repo-relative), heading, line, level, end_line, in_fence,
      steps_default: [m, n] | null, steps: [{n, line, title, commands: [...]}], outside: [...],
      hashed: [...] (the exact hash input, item by item), sha256}
    Exit 1 when the file has no verification gate section with a numbered list; 2 when unreadable.
redline-gate.sh stamp <shape-spec.md> [<checks.sh>] [--steps <m>-<n>]
    Prints the stamp line. With <checks.sh>: replaces the first "# redline-gate:" line in place (the
    template's TODO placeholder and an old stamp alike) or, when none, inserts it as the last line of
    the header comment (the run of "#" lines starting at line 2); writes through a temp file and
    `cat > checks.sh` so the executable bit survives; one stamp line, so stamping twice is a no-op.
    --steps defaults to the first "(gate steps M to N" match in the file (the unattended section's
    parenthetical; Losers League's "(gate steps 1 to 3: `...`)" matches too); validated as
    1 <= m <= n <= step count. No flag and no match, or out of range: exit 2. No gate section: exit 1.
    When it inserts and the file's --help line is a numeric sed range (`sed -n '2,27p'`), one warning
    on stderr names the fix; the line itself is not edited.
redline-gate.sh check <repoRoot>
    Reads the stamp (`^# redline-gate: (\S+) steps (\d+)-(\d+) sha256:([0-9a-f]{64})$`) from
    <repoRoot>/.claude/redline/checks.sh, recomputes the hash of the named file (relative to
    <repoRoot>) and compares. stdout: {ok, reason, stamp: {path, steps, sha256} | null,
    actual: {heading, line, steps, sha256} | null}. Exit 0 on a match; 1 on a mismatch, no stamp line,
    the TODO placeholder, or a stamped path that does not exist (a failed check); 2 when <repoRoot>
    is not a directory or has no .claude/redline/checks.sh (usage). On 1, one line on stderr that the
    skill prints verbatim.
```

The stamp line, the last line of `checks.sh`'s header comment:

```
# redline-gate: .claude/commands/agent-os/shape-spec.md steps 1-6 sha256:<64 hex>
```

**Parsing** (the first python program). Normalise BOM, CRLF and lone CR. Pass 1 records fence state per line: any-indent ``` or ~~~ openers and matching closers, with the opener's column. Pass 2 picks the section: the first ATX heading (column 0, any level) whose text matches `verification gate` case-insensitively and whose body holds a column-0-or-indented `1.` line not inside a fence nested in the section. A section ends at the next heading of the same or higher level outside a nested fence, or, when the heading sits inside a column-0 fence, at that fence's close. Pass 3 walks the body in order: a fence opened inside the section is captured whole (each line whitespace-normalised, blank lines dropped; the opener's info string and the closer are not hashed) and never scanned for spans; every other line is scanned for CommonMark code spans (a run of N backticks closed by the same run, per line), each normalised (runs of whitespace to one space, trimmed). Column-0 `N.` lines start a step; indented continuation lines, nested lists and sub-bullets stay with the current step; spans before step 1 or after the last step go to `outside` and are hashed too. The hash is sha256 over the items joined by `\n` plus a trailing `\n`, UTF-8. `title` is the first line's bold text cut at the first dash, informational only. A code span spanning two lines is not recognised; the header says so.

Checked against the three real files: this repository picks line 234 (the fenced `## Task N: Verification Gate` at 202 has no list), 7 steps, 28 items, default steps 1-5; Chalkboard picks 230, 9 steps, 53 items (the two indented fenced commands are one item each; step 2's sub-bullets contribute `pint --test` and the rest), default 1-7; Losers League picks 266, inside the plan-template fence closed at 286, 4 steps, 9 items, default 1-3. Step 5's dated timing sentence here is prose, so a timing update does not move the hash.

**Failure lines** (stderr; the second spec on #6 rewords them to name `/redline:setup`):

- mismatch: `the verification gate in <file> has changed since .claude/redline/checks.sh was stamped; bring checks.sh up to date, then restamp with <plugin>/scripts/redline-gate.sh stamp <file> .claude/redline/checks.sh`
- no stamp or the placeholder: `.claude/redline/checks.sh carries no gate stamp; stamp it with <plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh`

## Tasks

### Task 1: Save spec documentation

Create `agent-os/specs/2026-10-21-1329-6-gate-stamp/` with `plan.md` (this plan; As built filled at the end), `shape.md` (scope, the four decisions with the owner's reasoning, investigation notes with file:line evidence, proportionality, Deferred: the setup skill as the second spec, Context, Standards Applied, the standards retrospective), `standards.md` (all eight standards as they read now), `references.md` (`scripts/redline-prefs.sh`, `tests/prefs-test.sh`, the guard's `python3 -I` pattern, Chalkboard's and Losers League's gates as the fixture sources, `.claude/redline/checks.sh`'s header). No `visuals/`.

### Task 2: `tests/gate-test.sh` and the fixtures, red first

Files: `tests/gate-test.sh`, `tests/gate-fixtures/plugin-shape.md`, `tests/gate-fixtures/laravel-shape.md`, `tests/gate-fixtures/fenced-shape.md`, `tests/gate-fixtures/checks-no-stamp.sh`, `tests/gate-fixtures/checks-todo.sh`.

- `plugin-shape.md`: this repository's shape, trimmed and synthetic: a Step 7 plan template in a column-0 fence holding the decoy `## Task N: Verification Gate` with prose only; a top-level `## Verification Gate` with an intro paragraph, seven bold em-dash steps, an indented continuation line with a dated timing sentence under step 5, a nested `1.`-`5.` list under step 6, a trailing "Only after all seven pass" line, then `## Output Structure`; an unattended section with `(gate steps 1 to 5)`.
- `laravel-shape.md`: Chalkboard's shape: nine steps, nested sub-bullets with backticked commands under step 2, an indented fenced multi-line command in steps 4 and 6, `(gate steps 1 to 7)`.
- `fenced-shape.md`: Losers League's shape: the gate as `## Task N (FINAL — ALWAYS INCLUDED): Verification gate` inside the plan-template fence with four steps (the fourth a retrospective holding `agent-os/standards/process/standards-retrospective.md` and `Standards retrospective: no changes` in backticks, with unfenced indented continuation lines), a later decoy `## Verification Gate` inside the shape.md template fence with prose only, and `(gate steps 1 to 3: \`...\`)`.
- `checks-no-stamp.sh`: a template-shaped header with a numeric `--help` sed range and no stamp; `checks-todo.sh`: the same with `# redline-gate: TODO ...` as its last header line.
- The harness, in `tests/prefs-test.sh`'s shape (`set -uo pipefail`, `mktemp -d`, `ok`/`bad`, `expect_json <name> <filter> <want> <args...>`, `expect_exit <name> <code> <args...>`, `N passed, 0 failed`, non-zero exit on any failure), copies the fixtures into the temp directory, `git init`s it with the fixture at `.claude/commands/agent-os/shape-spec.md` where a repo-relative path matters, and mutates copies with `sed`. Expected hashes are pinned inline from the implementation's first run. Cases, by group:
  - **extract**: heading line and step count per fixture (the decoys are never chosen; `in_fence` true for the fenced shape with `end_line` at the fence close); the continuation line's `--baseline` span joins step 5 and the nested list's spans join step 6 without splitting it; the indented fenced commands are one item each, in the step; sub-bullet spans in document order; `steps_default` 1-5, 1-7, 1-3 (the colon form); no gate section exits 1; a CRLF copy and a copy with doubled spaces inside a span and a tab after `1.` hash the same.
  - **hash**: stable across two runs and equal to the pinned value; unchanged after a prose edit in a step, an edit to the intro line, an edit to the dated timing sentence, an edit to either decoy's backticks, a change of the heading's capitalisation; changed after editing a sub-bullet's span, the continuation line's span, a line inside a fenced command, adding a step (count 8), removing one (count 6), swapping steps 1 and 2 (`[.steps[].n]` reads `2,1,...`).
  - **stamp**: the printed line matches `^# redline-gate: \S+ steps [0-9]+-[0-9]+ sha256:[0-9a-f]{64}$` with the repo-relative path; `--steps` overrides; no parenthetical and no flag exits 2, with `--steps` exits 0; `1-9`, `3-2` and `x` exit 2; without a checks.sh nothing is written; insertion lands as the header's last `#` line before the blank line and `bash -n` still passes; replacement keeps the line number and leaves one stamp; the TODO placeholder is replaced; stamping twice leaves the file byte-identical; the executable bit survives; a numeric `--help` range on insertion gives one stderr warning and the line is unchanged.
  - **check**: 0 and `ok: true` on the stamped temp repository; 1 after a backtick edit, stderr one line naming the file, `.stamp.sha256 != .actual.sha256`; 1 with no stamp, with the TODO placeholder, and with the stamped path missing; 2 with no argument, a non-directory, and a directory without `checks.sh`.
  - **dogfood**: `check` on this checkout exits 0, the live proof that the committed stamp matches the committed gate; `bash -n` on the script.
- Run it before the script exists: every case fails. Then Task 3.

### Task 3: `scripts/redline-gate.sh`

File: `scripts/redline-gate.sh`, executable, as designed above. Proof: `tests/gate-test.sh` all passing (the dogfood case stays red until Task 6 stamps this checkout).

### Task 4: The template, the allow lists and the guard rows

Files: `scripts/checks-template.sh`, `templates/settings.allow.json`, `.claude/settings.json`, `tests/guard-cases.tsv`.

- `scripts/checks-template.sh`: the placeholder `# redline-gate: TODO  stamp it: <plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh` as the last header line, a header sentence saying the stamp is what lets a launch refuse a gate that moved, and the `--help` line changed to `sed -n '2,/^$/p' "$0"` so the range never rots (Chalkboard's copy already prints `2,19p` against a 23-line header).
- `templates/settings.allow.json` and `.claude/settings.json`: `Bash(/*/scripts/redline-gate.sh *)` beside the prefs rule, so the precheck never prompts.
- `tests/guard-cases.tsv`: no guard change, but the decision that the gate script is the skill's and never a role's is pinned beside the prefs rows (Step 13): `redline:redline-implementer deny Bash PLUGIN/scripts/redline-gate.sh stamp ...`, `redline:redline-checker deny Bash PLUGIN/scripts/redline-gate.sh check REPO/`, `- inert Bash PLUGIN/scripts/redline-gate.sh check REPO/`; under `# @cwd PLUGIN`, `redline:redline-implementer allow Edit scripts/redline-gate.sh` beside the prefs row. `tests/guard-test.sh` 0 mismatched.

### Task 5: The precheck in `skills/redline/SKILL.md`

File: `skills/redline/SKILL.md`, section 4. A new first item: `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gate.sh check <repoRoot>` must exit 0; on exit 1 stop the launch with the script's stderr line verbatim; on exit 2 stop with "this repository is not set up for Redline yet" as section 1 does. The existing items renumber 2 to 6, the closing "Any failure stops the launch" sentence gains the gate case, and section 4's first sentence (relaunches skip the precheck) stands. The review and revise variants read this file and inherit it.

### Task 6: Dogfood: this repository's gate, stamped last

Files: `.claude/commands/agent-os/shape-spec.md`, `.claude/redline/checks.sh`, `CLAUDE.md`, `agent-os/product/tech-stack.md`, `agent-os/product/roadmap.md`, `README.md` (Known limits only; the rest is Task 7).

- `shape-spec.md` Verification Gate: a new step 6, **Gate stamp** — `tests/gate-test.sh` prints `N passed, 0 failed`; a change to `scripts/redline-gate.sh` adds a case; its last case checks this checkout's own stamp, so any change to this list's backticked text is followed by `scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh` in the same commit. The continuation line reads "Steps 1 to 6 are what `.claude/redline/checks.sh --baseline` runs"; the retrospective becomes 7, the spec folder 8, "Only after all eight pass". Step 7's template line "Run the five commands" becomes six; the Tips' "gate step 6" becomes 7. Unattended point 7: "gate steps 1 to 6" and "Steps 7 and 8"; point 8: "Gate step 7"; point 11 adds `.claude/redline/checks.sh`'s stamp to what no role may write: a finding whose fix changes the gate's backticked text cannot be completed by a run, since the restamp is a person's; it is `defer`, mitigated by a README Known limits line or a row, as the guard case is.
- `.claude/redline/checks.sh`: `run_check gate 0 "tests/gate-test.sh"` after prefs; header: "steps 1 to 6", "The six checks" with the `gate` line, the `--help` line as the template now has it, the new baseline time; **last, after every gate edit is final**, the stamp line written by `scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh` (expected `steps 1-6`).
- `CLAUDE.md`: "runs its five commands" becomes six. `tech-stack.md`: "the five steps" becomes six; the Tests line names the fourth harness. `roadmap.md`: Phase 1 item 7, "Setup and the gate stamp (#6)": the stamp (this spec) done, the setup skill to follow. `README.md` Known limits: a line that a run on this repository cannot restamp `checks.sh`, so a gate-text finding is deferred to a person.

### Task 7: README

File: `README.md`.

- Install: an **Upgrading** subsection: since this change a launch refuses a `checks.sh` without a gate stamp; a repository set up earlier (Chalkboard, Losers League) is stamped once by hand with `scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh`, and its `--help` sed range is changed to `2,/^$/p` at the same time; until `/redline:setup` exists this is the whole upgrade.
- Set up a repository: step 1 ends with the stamp command; step 7 (Verify) adds `scripts/redline-gate.sh check .` exits 0.
- Files table: rows for `scripts/redline-gate.sh` and `tests/gate-test.sh` with `tests/gate-fixtures/`; the skill row mentions the gate check.
- `checks.sh` section: a **Gate stamp** paragraph: the line's format and place, what is hashed (every backticked span and fenced block in the gate section, prose free, a two-line code span not recognised), that `steps m-n` is for the reader, the launch refusal and its two lines, the three subcommands in a short table quoting the script's header, and that the second spec on #6 moves stamping into `/redline:setup`.

### Task 8: Verification Gate

Run `.claude/redline/checks.sh --baseline` until it exits 0 (six checks, `gate` among them), then the standards retrospective (step 7 after this change) and this folder's As built (step 8). The retrospective's proposed edits, from shaping:

- `agent-os/standards/testing/tests.md`: "Three harnesses" becomes four, with a bullet for `tests/gate-test.sh` over `tests/gate-fixtures/` (the gate parser and the stamp, on synthetic shape-spec fixtures, hashes pinned inline); the "adds a case in the same commit" bullet gains "a gate case"; a bullet that `.claude/redline/checks.sh` carries the stamp and a change to the gate list restamps it in the same commit. `index.yml`'s description for `testing/tests` lists the fourth harness.
- `agent-os/standards/process/standards-retrospective.md`: "Gate step 6" becomes 7.
- `agent-os/standards/scripts/bash-conventions.md`: `redline-gate.sh` joins the script list; a line that a script only the skill calls needs no guard group, only the deny rows that pin it (as `redline-prefs.sh`); a line that a header's `--help` prints `sed -n '2,/^$/p'`, never a numeric range.

Approved edits land in their own commit (the user titles it), separate from the code; the standards-retrospective.md step-number edit goes with them. Then As built in `plan.md`, deviations under Decisions in `shape.md`.

## Commit order (the user commits; this is the order the plan asks for)

1. Spec folder. 2. Test and fixtures (red). 3. Script (green except dogfood). 4. Template, allow lists, guard rows. 5. Skill precheck. 6. Gate text, product docs, `checks.sh` with the sixth check and the stamp, README Known limits. 7. README. 8. Standards (retrospective). 9. As built.

## Verification (end to end)

1. `tests/gate-test.sh`: N passed, 0 failed, from this checkout.
2. `.claude/redline/checks.sh --baseline`: `ok: true`, six checks at exit 0; the baseline time recorded in the header.
3. `scripts/redline-gate.sh check .` exits 0 here. Add a backticked step to the gate without restamping: `check` exits 1 with the "has changed" line and the gate test's dogfood case fails. Restamp: both green. Revert.
4. Drift on a model repository, by hand: in `~/Code/Sites/loser`, `check .` exits 1 with "carries no gate stamp"; `stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh` writes `steps 1-3` and warns about the numeric help range; `check .` exits 0; the same in Chalkboard (`steps 1-7`). Those stamps are the person's to commit in their own repositories, not here.
5. The skill: from a fresh session here, `/redline:redline <this PR> dry run review only` passes the precheck's gate check with no permission prompt. With the stamp line temporarily removed from `checks.sh`, the launch stops with the "carries no gate stamp" line. Restore.
6. `tests/guard-test.sh`: 0 mismatched, from this checkout and from Chalkboard's worktree.
7. `claude plugin validate .` passes.

## As built (2026-10-21)

- Task 1 as planned.
- Task 2: three fixtures, not two: `plugin-shape.md`, `laravel-shape.md`, `fenced-shape.md`, plus `checks-no-stamp.sh` and `checks-todo.sh`. The harness ran first with no script: 17 vacuous passes, 87 failures. One expectation was wrong at first (step 6 of the Laravel shape holds four items, not three); the hashes were pinned from the implementation's first run.
- Task 3 as planned. Two defects found by the harness and fixed: the repo-relative path compared a logical `pwd` with git's physical toplevel (`pwd -P` now); and the harness's own `same`/`differs` helpers were passed bare names, which the pinned-hash case exposed. The three fixtures' hashes: plugin `64aed4fb…`, laravel `8419963f…`, fenced `eca310d2…`, the last identical to the Plan agent's independent computation on the real Losers League file. `tests/gate-test.sh`: 104 passed, 0 failed, about 6 seconds.
- Task 4 as planned; `tests/guard-test.sh` 350 passed, 0 mismatched, from this checkout and from Chalkboard's worktree.
- Task 5 as planned.
- Task 6 as planned. Stamped last: `# redline-gate: .claude/commands/agent-os/shape-spec.md steps 1-6 sha256:1333f0cc…`. Drift proof: a step added to the gate makes `check` exit 1 with the "has changed" line and the gate test's last case fail; restored, both green. `checks.sh --baseline`: six checks at exit 0, 29 seconds.
- Task 7 as planned.
- Task 8: `checks.sh --baseline` green. The standards retrospective's four edits were approved and applied (see `shape.md`). Verification 4 was done on temp copies of Chalkboard's and Losers League's two files, not in their trees: both report "carries no gate stamp" today; stamping the copies wrote `steps 1-7 sha256:50b366fe…` and `steps 1-3 sha256:eca310d2…`, warned about the numeric `--help` range, and `check` then passed. Verification 5 (a `dry run review only` launch from a fresh session, with and without the stamp line) is the user's, after the commits.
- Commits: the user titles and makes every commit, in the order the plan lists.

## Out of scope (the second spec on #6)

`/redline:setup`: the interactive walk (preflight, branch, gate discovery with the command/prose classification confirmed by the person, environment check, writing `checks.sh`, the baseline, `redline.json`, the settings merge, `.gitignore`, the unattended section, `CLAUDE.md`, verify, hand back), the rerun diff of command lists, and rewording the check's two lines to name `/redline:setup`.
