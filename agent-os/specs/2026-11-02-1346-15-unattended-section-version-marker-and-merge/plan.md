# Spec: unattended-section version marker, launch warning and a rerun that carries template body changes (#15)

Spec folder: `agent-os/specs/2026-11-02-1346-15-unattended-section-version-marker-and-merge/`

Shaped by hand on 2026-11-02 with `/agent-os:shape-spec`; the person makes every commit. Issue #15 is the source of truth, read with the eight decisions in the shaping prompt and the three answered today.

## Context

`redline-setup.sh unattended` inserts `templates/shape-spec-unattended.md`'s section into a repository's `shape-spec.md` and, on a rerun, reads only the four fill-ins back (#12), so a change to the template's body never reaches a repository that already has the section, and nothing warns. The survey showed the bug is already live: the template has had three bodies (extraction `dbb27ec`, the owner line `89d0e00` on 2026-10-20, the #49 ask-rules sentence `e7d030d` on 2026-10-30), and of the four live sections only this checkout's is at the current one. Chalkboard's matches the extraction body (4 differing lines, all fill-ins: it lacks the owner-line paragraph, the `decidedBy`/`recommendation` JSON and #49's sentence); Losers League's and Vestmark's match the owner-line body (7 and 5 differing lines: they lack #49's sentence and the `repository rule <id>` why_human); this checkout's matches the current body with three hand edits (point 7's tail about gate step 10 Docs, the story line "A teammate runs the command", and point 11 "The guard and the hook" in place of "The PR description").

A read-only prototype of the base guess and the three-way merge over the four live files (fill-ins normalised, python difflib) picked v1 for Chalkboard, v2 for Losers League and Vestmark, v3 for this checkout, with no conflicts, every hand edit kept and every template addition taken.

Two more facts from the survey shape the design:

- **The guard approves one `redline-setup.sh` subcommand for the main session, `version`** (`scripts/redline-guard.sh:1083`, `sub == "version"`, no argument vetting), and since #50 the allow list carries no script rule, so a precheck that ran `unattended --version` or `settings --dry-run` would stop at the permission prompt on every launch.
- **This checkout's own contract is stale**: `.claude/settings.json` carries all ten #50 retired entries (`settings . --dry-run` reports `added: []`, `stale:` 10), and its section carries no marker, so the new precheck would warn here on every run until a rerun.

## Decisions

The prompt's eight, as given, plus three answered on 2026-11-02 and the calls made from the survey.

1. **The marker** (prompt 1): `<!-- redline-unattended: vN -->` is the section's first line inside it, right after the `## Unattended mode (Redline)` heading, then the blank line, then the intro. It lives in the template body itself (below the `---` cut), so `unattended` copies it on insert as it copies the rest; `unattended --version <file>` prints `{template, file, match, newer}` exactly as `version <checks.sh>` does; a section with no marker is `file: null` and reads as v0. Decided by: @michaelwitwicki.
2. **Warn, never stop** (prompt 2): the launch precheck's wording is the issue's: `the unattended section in shape-spec.md was made from template v1; the plugin ships v3. Run /redline:setup to see the change`; a missing marker reads `carries no version marker`; a missing section `has no unattended section; run /redline:setup`; a newer one says `update the plugin`, as `version` does for `checks.sh`. Decided by: @michaelwitwicki.
3. **Frozen copies, not git** (prompt 3): `templates/history/shape-spec-unattended.vN.md`, one per past version, each the whole template file as it was at that commit (header comment, `---`, body) with its own marker line inserted after the heading. A marketplace install has no checkout to `git show` from. Bumping the version freezes the previous body in the same commit; a setup-test case checks every version below the current has a frozen copy whose marker equals its file name and that the current version is not frozen, deriving the current version from the template's marker (`UV`/`UN`, never spelled, as `TV`/`TN` do for `checks-template.sh`). Decided by: @michaelwitwicki.
4. **Versions from git history** (answered today): v1 = `dbb27ec`'s body, v2 = `89d0e00`'s, v3 = the current body (`e7d030d`'s). The template ships v3 now; no bump in this spec, since its body does not change. An unmarked section's merge base is guessed: over the candidates (every frozen body plus the current template, markers stripped, the section's own found fill-ins applied), the one with the fewest differing lines; tie goes to the newest (the newest tied candidate changes the least of the person's text, and a tie with the current template means "already current, add the marker"); reported as `base: "vN", guessed: true`. After their next rerun Chalkboard merges from v1, LL and Vestmark from v2, this checkout from a guessed v3, and all four read v3. **Known limit:** a section whose hand deletions are exactly the lines a version added measures closer to the older body and the merge would restore them; the guess is one-shot (every section is marked after this), `guessed: true` is shown, setup shows `templateDiff` before writing, and `--keep` is the escape. Decided by: @michaelwitwicki.
5. **The three-way view and merge** (prompt 4): all three sides carry the **wanted** fill-ins before the merge, so fill-in phrases never reach it: OURS is the repository's section with the wanted fill-ins patched in (exactly today's `--force` result), BASE the frozen body at the section's version with the wanted fill-ins applied, THEIRS the current template with them applied; marker lines are stripped from all three and the current marker is written at index 1 after. A hand edit on a fill-in line (this checkout's point 7) is then a hand edit, not a conflict, and a dropped point 11 (`--no-pr-body`) is an absence on every side, not a deletion. The merge is a diff3 over `difflib.SequenceMatcher` matching blocks (`autojunk=False`): a hunk changed only in OURS is kept (hand edits and hand deletions), only in THEIRS is taken, changed in both the same way is taken once, changed in both differently is a conflict `{n, base, ours, theirs}` (each a list of lines); an insertion at the same slot from both sides is a conflict, not both (a hand-added point 11 beside a future template point 11 would otherwise give two 11s); a hand deletion of a line the template changed is a conflict, never silently restored. The script never writes a conflict marker into `shape-spec.md`; the JSON's `merged` renders open conflicts diff3-style for the person to read. Decided by: @michaelwitwicki (prompt), the mechanics redline (shaping).
6. **Flags and the decision table** (from the survey): version is decided before fill-ins. `--force` governs fill-ins, as today; `--merge` and `--keep` govern the version and are mutually exclusive (both: exit 2); `--pick <n>=ours|theirs` needs `--merge` (else exit 2) and must name an existing conflict (else exit 2); `--dry-run` is orthogonal (`written: false`, same JSON). Every key is always present in the JSON (`version`, `base: null`, `guessed: false`, `templateDiff: null`, `handEdits: null`, `merged: null`, `conflicts: []` on the match path), so no consumer branches on key presence; `templateDiff` (BASE→THEIRS) and `handEdits` (BASE→OURS) are unified-diff strings as `command`'s `diff` is.

   | present | version | fill-ins differ | flags | exit | written |
   | --- | --- | --- | --- | --- | --- |
   | no | – | – | any | 0 | yes, with the marker |
   | yes | match | no | any | 0 | no (`changed: false`) |
   | yes | match | yes | none, `--keep` | 1 | no (`differs`) |
   | yes | match | yes | `--force`, `--merge`, `--keep --force` | 0 | fill-ins patched |
   | yes | older or unmarked | any | none, `--force` alone | 1 | no; the full report; stderr names `--merge` and `--keep` |
   | yes | older or unmarked | any | `--merge`, no conflicts | 0 | merged, wanted fill-ins, current marker |
   | yes | older or unmarked | any | `--merge`, conflicts, a pick missing | 1 | no; stderr names the unpicked numbers |
   | yes | older or unmarked | any | `--merge --pick` for every conflict | 0 | merged with the picks |
   | yes | older or unmarked | no | `--keep` | 0 | marker only (`changed: true`) |
   | yes | older or unmarked | yes | `--keep` | 1 | no (`differs`) |
   | yes | older or unmarked | yes | `--keep --force` | 0 | fill-ins patched and the marker |
   | yes | newer | any | any | 1 | no; `newer: true`; stderr "update the plugin"; never a downgrade |

   `--force` alone on a version mismatch writes nothing: a write with a failing exit is wrong. A marked section whose frozen copy is missing exits 2 naming the file; a missing or empty history directory is tolerated (an unmarked section then has only the current template as a candidate). Decided by: redline (shaping).
7. **Settings get no marker** (prompt 5): the precheck's settings warning is derived by diffing against the template, as `settings --dry-run` reports `added` and `stale`, and reported the same way: `settings.json lacks 2 entries the plugin now expects (…); run /redline:setup` and `settings.json carries 3 entries the plugin retired (…); run /redline:setup`. The repository's own extra entries are never reported. Decided by: @michaelwitwicki.
8. **The precheck reads one command, `version <repoRoot>`** (answered today): `version` keeps its file form unchanged and gains a directory form (a directory argument selects it; neither a file nor a directory exits 2) that checks `checks.sh`, the section and `settings.json` in one call, prints `{checks, unattended, settings: {missing, stale}}`, one stderr line per warning, exit 1 when any warns, 2 when `checks.sh` or `shape-spec.md` is missing or `settings.json` is not JSON or has a BOM; a missing `settings.json` is every template entry missing (exit 1). No guard change: `sub == "version"` already approves it; `tests/guard-cases.tsv` rows pin `version REPO/` allow and `unattended --version` inert for the main session, and `version REPO/` deny for a role. CI's version step widens to `version .` (the same step, the whole contract). Decided by: @michaelwitwicki.
9. **No bump here** (prompt 6): the body does not change in this spec, so the template is v3 with the marker written and history holds v1 and v2. Decided by: @michaelwitwicki.
10. **Tests** (prompt 7): the issue's three (the marker on insert, the version compare, the merge with a hand edit) plus the frozen-copy check, the conflicting-line case, `--keep`, `--dry-run`, the merge over a copy of this checkout's section (decision 4's fixture: all three hand edits kept, the diff against the committed file empty), and `version <repoRoot>` on a throwaway root (green, and each of its warnings). Decided by: @michaelwitwicki.
11. **Dogfood this checkout now** (answered today): a plan task writes the marker into this checkout's `shape-spec.md` through the script (base guessed v3, no conflicts, the three hand edits kept, only the marker added; the section is outside the gate, so the stamp does not move) and runs `settings . --remove-stale`, so the setup test's two dogfood cases pass and the precheck is quiet here. Decided by: @michaelwitwicki.
12. **Docs** (prompt 8): README's Set up a repository item 5 and 8, Upgrading, the Files table (`templates/` and `skills/redline/SKILL.md` rows), the `redline-setup.sh` table, the "Template version" paragraph under `checks.sh`, Contributing (CI's `version .`); `skills/setup/SKILL.md` steps 1, 10 and 13; `skills/redline/SKILL.md` precheck step 1. Decided by: @michaelwitwicki.
13. **Standards carried**: `scripts/bash-conventions`, `testing/tests`, `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`, `scripts/guard` (for the rows). Visuals: none. Product alignment: roadmap Phase 1 item 7 (setup; "a rerun changes nothing when nothing drifted"). Decided by: redline (shaping).

## Task 1: Save spec documentation

Create `agent-os/specs/2026-11-02-1346-15-unattended-section-version-marker-and-merge/` with `plan.md` (this plan, the Docs entries table, an As built section filled at the gate), `shape.md` (Scope, the Decisions above, the survey's Context bullets, visuals none, references, `## Standards retrospective (proposed)` from Task 7, Standards Applied), `standards.md` (the full text of the six standards as they read today), `references.md`. No `visuals/`.

## Task 2: The template carries v3; history carries v1 and v2

**Files:** `templates/shape-spec-unattended.md`, `templates/history/shape-spec-unattended.v1.md`, `templates/history/shape-spec-unattended.v2.md` (new), `tests/setup-test.sh`.

1. Test first: near `TV`/`TN` (`tests/setup-test.sh:21`) derive `UT`, `UV` (`grep -m1 '^<!-- redline-unattended: v' | sed`), `UN`, `UHIST`; a `for ((n=1; n<UN; n++))` loop checking `$UHIST/shape-spec-unattended.v$n.md` exists, carries `<!-- redline-unattended: v$n -->` and a `---` line; and `[[ ! -e "$UHIST/shape-spec-unattended.$UV.md" ]]`. Red.
2. `templates/shape-spec-unattended.md`: `<!-- redline-unattended: v3 -->` as the line directly after `## Unattended mode (Redline)`; one sentence in the header comment: the marker names the body's version, a body change bumps it and freezes the previous file under `history/` in the same commit.
3. `git show dbb27ec:templates/shape-spec-unattended.md` → `history/...v1.md` with `<!-- redline-unattended: v1 -->` after the heading; `89d0e00` → `v2.md` with `v2`. Nothing else changes in them.
4. Green (the marker-on-insert case of Task 3 also goes green here, since the body is copied verbatim).

## Task 3: `unattended` writes the marker on insert and reads it with `--version`

**Files:** `tests/setup-test.sh` (first), `scripts/redline-setup.sh` (`PY_UNATTENDED`, `cmd_unattended`, header, `usage()`).

1. Cases, red first: the existing "a blank line after the heading" case (`:300`) becomes "the marker is the template's version" (`sed -n "$((H+1))p"` equals `<!-- redline-unattended: $UV -->`) and "a blank line after the marker" (`$((H+2))p`); the "`--force` diff is exactly the two patched lines" count at `:323` stands (the section was inserted from the current template). `unattended --version "$U"` → `$UV,$UV,true`, exit 0; a copy with the marker edited to `v$((UN-1))` → exit 1, `match false`, `newer false`, stderr `Run /redline:setup to see the change`; `v$((UN+1))` → `newer true`, stderr `update the plugin`, no `/redline:setup`; the marker line removed (`grep -v`) → `file null`, exit 1, stderr `carries no version marker`; the bare fixture (no section) → exit 1, `file null`, stderr `has no unattended section`; `--version` with a fill-in flag → exit 2.
2. `UNATTENDED_TEMPLATE="${REDLINE_UNATTENDED_TEMPLATE:-...}"` (tests, the shape of `:105`) and `UNATTENDED_HISTORY="$(dirname "$UNATTENDED_TEMPLATE")/history"`, both passed to python; the header's Environment line names the override.
3. `cmd_unattended --version <file>`: parsed before the fill-in validation, takes no other flag; `PY_UNATTENDED` gets a mode argument and in `version` mode reuses `fenced`/`UNHEAD`/`section_end` to print `{present, file}`; a shared `version_compare <tv> <fv>` function (the body of `:1151-1161`, factored out) prints `{template, file, match, newer}` and returns 1 on a mismatch; `version_unattended <file>` wraps the two and prints the stderr line. Shared with Task 5.
4. Header (`:34-40`) and `usage()` gain the form; the exit-code paragraph is unchanged.

## Task 4: The rerun merge

**Files:** `tests/setup-test.sh` (first), `scripts/redline-setup.sh` (`PY_UNATTENDED`, `cmd_unattended`, header, `usage()`), `skills/setup/SKILL.md`, `README.md`.

1. Cases, red first, with `FILL` as at `:294`:
   - **v1 to current with a hand edit**: `REDLINE_UNATTENDED_TEMPLATE="$UHIST/shape-spec-unattended.v1.md" "$SETUP" unattended "$V1" "${FILL[@]}"` (a plain env prefix; the history dir resolves to a missing `history/history`, which is tolerated); `grep` proves the marker is `v1`; the sed hand edit from `:321` ("Plan mode" line, untouched by every version) into the file; no flag → exit 1, `[.base, .guessed, (.conflicts|length)]` = `v1,false,0`, untouched; `--merge` → exit 0, `changed true, written true`, the hand edit kept, `Every decision names its owner` (v2) and `repository rule <id>` (v3) present, marker `$UV`, the fill-ins the wanted ones, one `## Unattended` heading, `"$GATE" extract` still exits 0 with `steps_default` 1-5; a second rerun → `changed false`.
   - **This checkout's section** (decision 4's fixture): `grep -v '^<!-- redline-unattended:' "$PLUGIN/.claude/commands/agent-os/shape-spec.md" > "$WORK/self.md"` (the pre-marker state, so the guess runs), `SELF=(--gate-steps 1-9 --prose-steps "10, 11 and 12" --retro-step 11 --no-pr-body)`; no flag → exit 1, `.base` = `$UV`, `.guessed` true, conflicts 0; `--merge` → `same` against the committed file (one assertion pins "only the marker added" and the three hand edits kept); `sha256` from `extract` unchanged.
   - **A conflicting line**: `$WORK/v4/shape-spec-unattended.md` is the real template with the marker set to `v$((UN+1))` and the "Plan mode" line reworded; `$WORK/v4/history/` holds the real history files plus the real template frozen as `shape-spec-unattended.$UV.md`; the section under test was inserted from the real template and carries the `:321` hand edit on the same line. With the override on `v4`: no flag → exit 1, `.conflicts|length` 1, `.conflicts[0].n` 1, `.conflicts[0].ours[0]` holds `HAND EDIT`, `.merged` holds `<<<<<<<`; `--merge` alone → exit 1, untouched, stderr names `1`; `--merge --pick 1=theirs` → exit 0, the v4 wording, marker `v$((UN+1))`; `--merge --pick 1=ours` on a fresh copy → the hand edit kept; `--pick 1=ours` without `--merge` → 2; `--merge --pick 2=ours` → 2; `--merge --keep` → 2.
   - **`--keep`**: on the `v$((UN-1))` copy → exit 0, the diff is the marker line alone (`grep -c '^[<>]'` is 2); `--keep` with a changed range → exit 1 `differs`; `--keep --force` → exit 0, range patched and marker written; `--force` alone on it → exit 1, untouched.
   - **`--dry-run`** with `--merge` and with `--keep`: `true,false`, untouched.
   - A marked section whose frozen copy is missing (override under `$WORK` with an empty `history/`, section marked `v$((UN-1))`) → exit 2 naming the file.
2. `PY_UNATTENDED`: `MARK` regex and `strip_marker()`; `apply(sec, found, fill)` with an explicit fill dict (`None` fields fall back to `want`); `load_history()` (every `history/*.vN.md`, tolerant of a missing dir); `guess()` by the metric in decision 4; `merge3()` per decision 5, with OURS's trailing blank lines popped into a tail and re-appended; the decision table of decision 6; `templateDiff`/`handEdits` via `difflib.unified_diff`. Bash: `--merge`, `--keep`, `--pick` (accumulated as one comma-joined string, never an empty array under `set -u` on bash 3.2); the exclusivity checks.
3. Header: the rerun paragraph rewritten (the version compare, the three-way report, `--merge`, `--pick`, `--keep`, `templateDiff`'s sides, the known limit of the guess, and the pre-existing note that `--pr-body-standard` over a hand-added point 11 yields two 11s); `usage()`.
4. `skills/setup/SKILL.md` step 1.5: the inventory runs `unattended --version <file>` and keeps its line; step 10, rerun: `changed: false` is "nothing drifted"; `differs` as today; exit 1 with a `version` mismatch: show `version` (`guessed` named as such), `templateDiff`, `handEdits`, `merged` and each conflict's `base`/`ours`/`theirs`, and ask: merge, keep (mark it current as it stands; the launch stops warning), or leave it (the launch keeps warning); on a conflict ask ours or theirs per number; then `--merge [--pick n=ours|theirs ...]` or `--keep`, `--force` added when `differs` was also reported; a `newer` section means update the plugin.
5. README item 5 (the rerun sentence: fill-ins patched in place, a body change merged three ways keeping hand edits, a conflict picked, or the marker bumped alone), the `redline-setup.sh` table's `unattended` row, Upgrading (a paragraph "Unattended section versions": the three bodies and their dates, that a repository set up before this reads as v0 and is guessed, what the next `/redline:setup` rerun does, and that leaving it keeps the warning).

## Task 5: `version <repoRoot>`

**Files:** `tests/setup-test.sh` (first), `scripts/redline-setup.sh` (`cmd_version`, header, `usage()`), `tests/guard-cases.tsv`, `skills/redline/SKILL.md`, `skills/setup/SKILL.md` (step 13), `.github/workflows/gate.yml`, `README.md`.

1. Cases, red first, on `$WORK/root` built from `cp "$TEMPLATE" .claude/redline/checks.sh` (matches itself, as `:538`), a fresh `unattended` insert over the bare fixture at `.claude/commands/agent-os/shape-spec.md`, and `settings "$R"`: exit 0, `.settings.missing|length` 0, `.settings.stale|length` 0, `.checks.match` and `.unattended.match` true; then one warning at a time: `older.sh` copied in → exit 1, `.checks.match` false, stderr `checks-template.sh`; restored, the `v$((UN-1))` section in → stderr `the unattended section in shape-spec.md was made from template v$((UN-1)); the plugin ships $UV`; a settings copy without `Bash(git status:*)` → `.settings.missing` names it, stderr `lacks 1 entry the plugin now expects`; a retired entry added with `jq` → `.settings.stale` names it, stderr `carries 1 entry the plugin retired`; `settings.json` removed → exit 1, missing = the template's count; `checks.sh` removed → 2; `shape-spec.md` removed → 2; a path that is neither → 2; the existing file-form cases unchanged.
2. `cmd_version`: `[[ -d ]]` selects the root form, `[[ -f ]]` the file form. `version_checks <file>` is today's body over `version_compare`; `version_unattended` from Task 3; `version_settings <root>` calls `cmd_settings "$root" --dry-run` in a subshell (propagating its exit 2) and maps `{missing: .added, stale: .stale}`, printing the two stderr lines with counts and entries. The root form prints `{checks, unattended, settings}` and exits 1 when any part did.
3. `tests/guard-cases.tsv`: in the `# #50` block beside `:399`, `-	allow	Bash	PLUGIN/scripts/redline-setup.sh version REPO/` and `-	inert	Bash	PLUGIN/scripts/redline-setup.sh unattended --version REPO/.claude/commands/agent-os/shape-spec.md`; beside `:486`, `redline:redline-checker	deny	Bash	PLUGIN/scripts/redline-setup.sh version REPO/`. No change to the guard script; `tests/guard-test.sh` green.
4. `skills/redline/SKILL.md:85`: run `version <repoRoot>` and say every stderr line it prints (`checks.sh`, the section, `settings.json`), then go on; a warning, never a stop. `skills/setup/SKILL.md` step 13 verifies with `version <repoRoot>`. `.github/workflows/gate.yml:76`: `scripts/redline-setup.sh version .`.
5. README: the `redline-setup.sh` table's `version` row; the "Template version" paragraph under `checks.sh` (now the section's marker and the settings lines too, with the three stderr lines); the Files table's `skills/redline/SKILL.md` row ("prechecks (the gate stamp first, then the contract's versions)"); item 8 of Set up a repository (`version .`); Contributing (CI runs `version .`).

## Task 6: Dogfood this checkout

**Files:** `.claude/commands/agent-os/shape-spec.md`, `.claude/settings.json`, `tests/setup-test.sh`.

1. Cases first (red): `unattended --version "$PLUGIN/.claude/commands/agent-os/shape-spec.md"` exits 0 (beside the `checks.sh` twin at `:554`); `version "$PLUGIN"` exits 0 (after the alias `--dry-run` cases at `:567-568`). Both are read-only forms.
2. `scripts/redline-setup.sh unattended .claude/commands/agent-os/shape-spec.md --gate-steps 1-9 --prose-steps "10, 11 and 12" --retro-step 11 --no-pr-body` reports base `v3`, `guessed: true`, no conflicts, `handEdits` naming the three; `--merge` adds the marker line only (`git diff` is one added line); `scripts/redline-gate.sh check .` still exits 0.
3. `scripts/redline-setup.sh settings . --remove-stale`: `removed` is the ten retired entries; the person's own entries (`bash -n`, `jq -e`, `claude plugin validate`, `tests/*.sh`, `node tests/loop-test.mjs`) stay. The three `git diff|log|show` rules and `Edit(//tmp/redlinerepro/**)` go with them; the guard approves read-only git by real path for the main session since #54, so nothing the gate or the skills run loses an approval.
4. Green; `.claude/redline/checks.sh --baseline` green.

## Task 7: Verification Gate

Run `.claude/redline/checks.sh --baseline` until it exits 0 (gate steps 1 to 9), then the Docs step (the table below, each entry naming its task's commit or its reason) and the standards retrospective (the proposed edits presented with AskUserQuestion; approved ones in their own commit; else "Standards retrospective: no changes" in `shape.md`); `plan.md`'s As built records what was built and any deviation, and the read-only `--dry-run` results over Chalkboard's, Losers League's and Vestmark's files.

### Docs entries

| File | README section (and template) | Commit |
| --- | --- | --- |
| `templates/shape-spec-unattended.md`, `templates/history/*.md` | Files table `templates/` row; "Template version" under `checks.sh`; Upgrading | Task 2 |
| `scripts/redline-setup.sh` (`unattended --version`, the marker) | `redline-setup.sh` table `unattended` row; Set up a repository item 5 | Task 3 |
| `scripts/redline-setup.sh` (`--merge`, `--pick`, `--keep`) | the same rows; Upgrading; `skills/setup/SKILL.md` steps 1 and 10 | Task 4 |
| `scripts/redline-setup.sh` (`version <repoRoot>`) | `redline-setup.sh` table `version` row; "Template version"; Set up a repository item 8; Contributing | Task 5 |
| `skills/redline/SKILL.md` (precheck step 1) | Files table row; "Template version" | Task 5 |
| `skills/setup/SKILL.md` (steps 1, 10, 13) | Files table row (fourteen steps, unchanged); Set up a repository items 5 and 8 | Tasks 4, 5 |
| `.github/workflows/gate.yml` (`version .`) | Contributing | Task 5 |
| `tests/guard-cases.tsv` rows | no reader-facing change: pins decisions "The guard" already states | Task 5 |
| `REDLINE_UNATTENDED_TEMPLATE` | no reader-facing change: tests only, in the script header's Environment line like `REDLINE_TEMPLATE` | Task 3 |

### Standards retrospective (proposed)

- `scripts/bash-conventions.md`, after the `# redline-template:` bullet (`:37`): a template whose body a repository copies (`templates/shape-spec-unattended.md`) carries a version marker in the body; a body change bumps it and freezes the previous file under `templates/history/` in the same commit, since an installed plugin has no git history to show, and a rerun merges three ways (the frozen base, the repository's copy, the current template), every side with the wanted fill-ins applied first, keeping hand edits and asking on a conflict; the marker is bumped alone only on `--keep`, so the launch keeps warning otherwise (#15). A second bullet: a read-only subcommand the launch precheck runs takes the repository root and answers every contract question in one call (`version <repoRoot>`), since the guard approves the main session by subcommand word and a flag on a writing subcommand would prompt (#15).
- `testing/tests.md`: the version-case bullet (`:28`) gains `UV`/`UN` from the template's marker and the frozen-copy case that fails a bump that forgot to freeze; the setup bullet (`:12`) gains the section's marker and `version <repoRoot>` on this checkout; the CI bullet (`:26`) reads `version .`.
- `process/docs-gate.md:12`: unchanged (leftmost match still holds; the merge normalises fill-ins by the same regexes).

## Verification

- `tests/setup-test.sh` prints `N passed, 0 failed` (every new case seen red first); `tests/guard-test.sh` prints `N passed, 0 mismatched`; `.claude/redline/checks.sh --baseline` green; `scripts/redline-gate.sh check .`, `scripts/redline-setup.sh version .claude/redline/checks.sh` and `scripts/redline-setup.sh version .` exit 0; `git status --porcelain` shows only the intended files.
- By hand, read only: `unattended <file> <fill-ins> --dry-run` over Chalkboard's, Losers League's and Vestmark's `shape-spec.md` shows base v1 / v2 / v2 guessed, no conflicts, and a `merged` carrying #49's sentence; recorded under As built, nothing written there.
- Commits, all by the person: spec folder; Task 2; Task 3; Task 4 (script, setup skill, README); Task 5 (script, rows, skills, CI, README); Task 6; standards edits on their own.

## As built (2026-11-02)

Built as planned, with these deviations, each recorded under Decisions in `shape.md`:

- **A same-length hunk is merged line by line** (decision 14). The read-only dry run over Chalkboard's section reported one conflict: its hand-edited story line (`Michael opens the app`) sits directly above the `why_human` line #49 changed, and a diff3 over matching blocks puts adjacent changes in one hunk. A hunk of one length on every side whose lines each changed on at most one side is now merged line by line; a line changed differently on both sides still makes the whole hunk a conflict. Case "adjacent changes" in `tests/setup-test.sh`, red first.
- **Every merge side carries the wanted fill-ins** (decision 5 as written in the plan after the design review), so `--merge` implies `--force` and `handEdits` shows hand edits only.
- **The root form's exit codes**: a part that exits 2 (a `settings.json` with a byte-order mark, say) ends `version <repoRoot>` with 2 explicitly rather than through an empty jq argument.
- **`templates/history/`** holds the whole template file at each commit (header comment, `---`, body) with the marker inserted, as decided; the reader cuts at `---` as it does for the current template.

Read-only dry runs (`--dry-run`, no write flag, trees confirmed clean afterwards), with each repository's own fill-ins:

| Repository | Marker | Base | Conflicts | Hand edits kept | Template changes taken |
| --- | --- | --- | --- | --- | --- |
| Chalkboard | none | v1, guessed | 0 (1 before decision 14) | the story line | the owner line, `decidedBy`/`recommendation`, #49's sentence |
| Losers League | none | v2, guessed | 0 | point 2's "launch obligations, MCP parity", point 8's standard citation, no point 11 | #49's sentence, the `repository rule <id>` why_human |
| Vestmark | none | v2, guessed | 0 | none | the same two |
| this checkout | none, then v3 | v3, guessed | 0 | point 7's Docs sentence, the story line, point 11 | none (the marker alone; one added line in `git diff`) |

Dogfood: `unattended ... --merge` on this checkout's `shape-spec.md` added the marker line only and `redline-gate.sh check .` still exits 0; `settings . --remove-stale` removed the ten retired entries (`added: []`) and kept the person's own six; `version .` exits 0.

Verification Gate: `.claude/redline/checks.sh --baseline` exited 0 with every check at 0 (syntax, validate, guard, loop, prefs, gate, setup, gh, background); `tests/setup-test.sh` 438 passed, 0 failed (72 new cases, every one seen red first except the frozen-copy and marker-on-insert cases, which go green with the template and history files of Task 2); `tests/guard-test.sh` 0 mismatched with four new rows; `redline-gate.sh check .` and `redline-setup.sh version .` exit 0. shellcheck is not installed on this machine; CI runs it.

Docs entries: every row of the table above names its section, and the sections were edited in this build (README items 5 and 8, Upgrading, the Files table's `templates/` and `skills/redline/SKILL.md` rows, "Template version", the `redline-setup.sh` table's `unattended`, `unattended --version`, `version <checks.sh>` and `version <repoRoot>` rows, Contributing; `skills/setup/SKILL.md` steps 1, 10 and 13; `skills/redline/SKILL.md` section 4 step 1; `.github/workflows/gate.yml`). The commits are the person's; the files per intended commit are listed in the hand-back.

Standards retrospective: applied (two bullets in `scripts/bash-conventions.md`, three edits in `testing/tests.md`; `process/docs-gate.md` unchanged), for the person's own commit.
