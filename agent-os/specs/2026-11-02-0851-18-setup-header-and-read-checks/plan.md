# Spec: the `checks.sh` header and the `read-checks` bootstrap (#18)

Spec folder: `agent-os/specs/2026-11-02-0851-18-setup-header-and-read-checks/`

Shaped by hand on 2026-11-02 with `/agent-os:shape-spec`; the person makes every commit. Issue #18 is the source of truth, all three items, read with the decisions in the shaping prompt and the two answered today.

## Context

Seen on the first `/redline:setup` rerun on Chalkboard, whose `checks.sh` was hand-written and bootstrapped through `redline-setup.sh read-checks`. Both header items are cosmetic (the generated script runs correctly); the third made the bootstrap wrong in two fields the skill then fixed by hand.

What the survey established (read only):

- **Item 1 is the `source` step only.** The header's checks list (`scripts/redline-setup.sh:769-771`) prints `i["cmd"]` for a `cmd` step, which is already the string a person types (the `dq()` escaping at `:748` is applied only on the `run_check` line), and `i["source"]` verbatim for a `source` step, which is the escaped text that sits inside the `run_check` line's double quotes. So Chalkboard's `env` step showed `base=\$(git merge-base $env_base HEAD) || { echo \"no merge base …`. The Laravel fixture's `env` step reproduces it today (generated into the scratchpad this session). `PY_READ` already has the inverse, `unescape()` at `:950-961`.
- **Item 2 is one token.** `:765` prints `#   %s=%s   %s (default %s)` with the var's shell name second: `REDLINE_MIGRATE_DB=migrate_db   scratch database … (default chalkboard_redline_migrate)`. The target is the literal placeholder `<name>`. Chalkboard's original hand-written line (`~/Code/Sites/chalkboard-feature-redline-plugin/.claude/redline/checks.sh:14-15`, commit 44f9a33) read `REDLINE_MIGRATE_DB=<name> scratch database for the migrations check` with `(default chalkboard_redline_migrate)` on the next line; the issue's one-line form is the target. **The change breaks `read-checks` unless its docs regex moves too:** `:941` requires an identifier after `=` (`[A-Za-z_][A-Za-z0-9_]*`) and a `(default …)` tail, so a generated header would stop yielding the doc and the round-trip case at `tests/setup-test.sh:390` would go red. The same regex is why Chalkboard's hand-written line yielded no doc (the skill filled it by hand; `~/Code/Sites/chalkboard/.claude/redline/checks.json` carries it).
- **Item 3, `gateFile`:** `:925` reads the generated form `(<file>, steps m to n)`; the fallback at `:929`, `(\S*shape-spec\.md)`, swallows the opening parenthesis of the hand-written form `Verification Gate (.claude/commands/agent-os/shape-spec.md)`, giving `(.claude/commands/agent-os/shape-spec.md`. Reproduced this session on `tests/gate-fixtures/checks-no-stamp.sh`, whose header has that form across a line break (the header lines are joined with a space at `:912`).
- **Item 3, `alwaysAllowed`:** `:982-985` reads only an `ALWAYS_ALLOWED=(…)` line. A hand-written gate has none: Chalkboard's original hard-coded the entry in the git block, `printf '%s\n' 'agent-os/specs/' 'agent-os/standards/' 'openapi.json'` (`:181` of the file above), where the template writes `printf '%s\n' 'agent-os/specs/' 'agent-os/standards/' ${ALWAYS_ALLOWED[@]+"${ALWAYS_ALLOWED[@]}"}` (`scripts/checks-template.sh:254`). So `alwaysAllowed` came back `[]` while the gate allowed `openapi.json`. This repository's own pre-generator `checks.sh` (`git show 7ac2d65^:.claude/redline/checks.sh`) already used `ALWAYS_ALLOWED=()`, so the hard-coded form is the Chalkboard-era one.
- **Nothing below the header moves.** Items 1 and 2 change lines of `H` in `PY_CHECKS`; item 3 changes `PY_READ`. `scripts/checks-template.sh` is untouched and the body splice (`:832-833`) is untouched, so the template stays v2 (`scripts/bash-conventions`: a change below the template's header bumps the version; a header-only change does not).
- **This repository's `checks.sh` does not change.** `.claude/redline/checks.json` has `vars: []` and no `source` step (nine `cmd` steps), so the regenerate in Task 5 is expected to report `changed: false`, and the stamp cannot move because the gate text in `shape-spec.md` is untouched. The setup test's last cases (`tests/setup-test.sh:503-511`) prove both.
- **The README's `checks.sh` section shows no header** (usage block, environment paragraph, example gate table, output contract: `README.md:223-281`), so items 1 and 2 have no reader-facing change. Item 3 touches two sentences that describe what `read-checks` reads back: the `redline-setup.sh` table row (`README.md:332`) and the setup skill's bootstrap paragraph (`skills/setup/SKILL.md:80`).

## Decisions

The prompt's, as given, plus two answered on 2026-11-02 and the calls made from the survey.

1. **Item 1** (prompt 1, answered 2026-11-02): the header prints a step's command as a person would type it. A `cmd` step prints `cmd` as today; a `source` step prints the source **unescaped**, as `bash -c` receives it (`\\` `\"` `\$` `` \` `` undone; the script's own variables such as `$env_base` and `$migrate_db` stay as written, since the header cannot expand them). The `run_check` line keeps its escapes; `read-checks` still round-trips the source verbatim. Decided by: @michaelwitwicki.
2. **Item 2** (prompt 2): a `vars` line prints `ENV=<name>   <doc> (default <value>)`, the literal placeholder `<name>`, matching the hand-written form. Decided by: @michaelwitwicki.
3. **Item 3** (prompt 3): `read-checks` strips the parenthesis from the hand-written gate line and reads `ALWAYS_ALLOWED` or, when the file has none, the single-quoted entries after `'agent-os/specs/' 'agent-os/standards/'` on the git block's `printf` line into `alwaysAllowed`. Decided by: @michaelwitwicki.
4. **The docs regex moves with item 2** (from the survey): `read-checks` reads a var's doc off `ENV=<name> …` as well as `ENV=<identifier> …` (a file generated before this change, on its rerun), with the `(default …)` tail optional (Chalkboard's hand-written line had it on the next line). Without this, item 2 breaks the round-trip case; with it, the bootstrap no longer loses the doc. Recorded under item 2's task since that is where it is forced. Decided by: redline (shaping).
5. **Tests** (prompt): one setup-test case per item against the Laravel fixture, red first. The hand-written shapes are derived from the generated Laravel `checks.sh` with `sed … > <copy>` in the temp directory, as the `stale.sh` case does (`tests/setup-test.sh:403`), never a new fixture file and never `sed -i` (`testing/tests`); `tests/gate-fixtures/checks-no-stamp.sh` serves as a second, already hand-written header for the `gateFile` case. Each item also keeps a neighbour that must not change (the `run_check` line's escapes; the old `=identifier` header form; the template form's `ALWAYS_ALLOWED`).
6. **Regenerate and restamp** (prompt): Task 5 regenerates this repository's `checks.sh` from `checks.json` and runs `redline-gate.sh check .`; a no-op is the expected result (Context), and only a moved stamp would be restamped. Point 11 of the unattended section applies to a Redline round on the PR, not to this build.
7. **Template version** (prompt): stays v2; only header lines change (Context).
8. **Docs** (prompt): no reader-facing change for items 1 and 2; item 3 rewords the README's `read-checks` row and the setup skill's bootstrap sentence. The script's own header (its documentation, `scripts/bash-conventions`) is updated for all three.
9. **Standards carried** (answered 2026-11-02): `scripts/bash-conventions`, `testing/tests`, `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`. Decided by: @michaelwitwicki.
10. Visuals: none. Product alignment: `agent-os/product/mission.md` names Chalkboard among the target users; this is the bootstrap that brought its hand-written gate under `checks.json`. Nothing else bears. The person makes every commit.

## Task 1: Save spec documentation

Create `agent-os/specs/2026-11-02-0851-18-setup-header-and-read-checks/` with:

- `plan.md`: this plan, with the Docs entries table and an As built section filled at the gate.
- `shape.md`: Scope (the issue's three items, read with the decisions), the Decisions above, the Context bullets, context (visuals none; references; product alignment as in decision 10), `## Standards retrospective (proposed)` (Task 7's list), Standards Applied.
- `standards.md`: the full text of the five standards as they read at shaping time.
- `references.md`: the pointers under References below.

## Task 2: Item 1, a `source` step's header line is unescaped

**Files:** `scripts/redline-setup.sh` (`PY_CHECKS`), `tests/setup-test.sh` (same commit; the case lands first and is seen red with `tests/setup-test.sh`).

1. **Test first**, in "checks: the Laravel shape" after the step-and-title check (`:364`):
   - `check "generated: a source step's header line reads as bash -c receives it, unescaped (#18)" grep -qF '#   env         base=$(git merge-base $env_base HEAD) || { echo "no merge base between $env_base and HEAD"; exit 1; }; for name in $(git diff "$base"..HEAD' "$LC"` (the name column is padded to the longest name, `migrations`, so `env` is followed by nine spaces). Red today: the header line holds `base=\$(`.
   - Neighbour: `check "generated: the run_check line keeps the escapes a source step needs" grep -qF 'run_check env 0 "base=\$(git merge-base $env_base HEAD) || { echo \"no merge base' "$LC"`. Green before and after.
2. **Fix.** In `PY_CHECKS` beside `dq()` (`:748`), add its inverse, `unq(s)`: walk the string; a backslash followed by one of `\ " $ `` ` `` yields that character, any other backslash is kept (the same rule as `PY_READ`'s `unescape()` at `:950`, which cannot be shared since the two Python programs are separate strings). At `:770`: `shown = i["cmd"] if i["cmd"] is not None else unq(i["source"])`. The `run_check` lines (`:815`, `:820`) are untouched.
3. **Header comment of the script** (`:54-60`, the `checks` entry): add that the header's checks list shows each command as a person types it, a `source` step unescaped.

## Task 3: Item 2, the `vars` line prints `ENV=<name>   doc (default value)`

**Files:** `scripts/redline-setup.sh` (`PY_CHECKS` and `PY_READ`), `tests/setup-test.sh` (same commit; red first).

1. **Test first.** The existing case at `:366` becomes the item's case, its pattern now anchored and exact: `grep -q '^#   REDLINE_MIGRATE_DB=<name>   scratch database for the migrations check (default chalkboard_redline_migrate)$' "$LC"`, renamed `"generated: a var's line reads ENV=<name>   doc (default value) (#18)"`. Red today (`=migrate_db`). Then, after the `read-checks` cases (`:388`):
   - `sed 's/^#   REDLINE_MIGRATE_DB=<name>   scratch database for the migrations check (default chalkboard_redline_migrate)$/#   REDLINE_MIGRATE_DB=<name> scratch database for the migrations check/' "$LC" > "$WORK/hand-vars.sh"` then `expect_json "read-checks: a hand-written var line without its default still yields the doc (#18)" '.input.vars[0].doc' "scratch database for the migrations check" read-checks "$WORK/hand-vars.sh"`. Red today (the regex needs an identifier and a `(default …)` tail).
   - Neighbour: `sed 's/^#   REDLINE_MIGRATE_DB=<name>   /#   REDLINE_MIGRATE_DB=migrate_db   /' "$LC" > "$WORK/old-vars.sh"` then `expect_json "read-checks: a header generated before #18 (ENV=identifier) still yields the doc" '.input.vars[0].doc' "scratch database for the migrations check" read-checks "$WORK/old-vars.sh"`. Green before and after.
   - The round-trip case at `:390` ("input recovers the whole checks.json") stays and now exercises the new line through the new regex.
2. **Fix, the generator** (`:765`): `"#   %s=<name>   %s (default %s)" % (v["env"], v.get("doc", "").strip() or "set by the repository", v["default"])`.
3. **Fix, the reader** (`:941`): the docs regex becomes `^#   ([A-Z_][A-Z0-9_]*)=(?:<name>|[A-Za-z_][A-Za-z0-9_]*)\s+(.*?)(?:\s+\(default [^)]*\))?\s*$`, the doc its second group (`REDLINE_OCTANE=1` still does not match, since `1` is neither form). Everything else in `PY_READ`'s vars path (`VAR` at `:949`, the lookup at `:988`) is unchanged.
4. **Header comment of the script**: the `checks` entry names the vars line's form; the `checks.json` paragraph (`:71-82`) is unchanged, since the JSON shape is unchanged.

## Task 4: Item 3, `read-checks` bootstraps `gateFile` and `alwaysAllowed` from a hand-written gate

**Files:** `scripts/redline-setup.sh` (`PY_READ`), `tests/setup-test.sh` (same commit; red first), then the docs in Task 6.

1. **Test first**, after the round-trip cases (`:393`):
   - Derive the hand-written shape: `sed -e 's/, steps 1 to 7)/)/' -e '/^ALWAYS_ALLOWED=(/d' -e "s/\${ALWAYS_ALLOWED\[@\]+\"\${ALWAYS_ALLOWED\[@\]}\"}/'openapi.json'/" "$LC" > "$WORK/hand.sh"` (the header's gate line loses its step range, the array declaration goes, and the git block's `printf` carries the entry itself, as Chalkboard's original did). Then `expect_json "read-checks: a hand-written gate gives gateFile without the parenthesis and the hard-coded allowed list (#18)" '[.input.gateFile, (.input.alwaysAllowed | join(","))] | join(" ")' ".claude/commands/agent-os/shape-spec.md openapi.json" read-checks "$WORK/hand.sh"`. Red today (`(.claude/… ` and an empty list).
   - `expect_json "read-checks: the gate fixture's hand-written header, split across two lines, gives gateFile without the parenthesis (#18)" '.input.gateFile' ".claude/commands/agent-os/shape-spec.md" read-checks "$GFIX/checks-no-stamp.sh"`. Red today.
   - Neighbour: the template form, where the `printf` line carries only the array expansion, still reads `alwaysAllowed` from `ALWAYS_ALLOWED`: covered by the round-trip case at `:390` on `$LC`; add `expect_json "read-checks: the template form reads alwaysAllowed from ALWAYS_ALLOWED, not the printf line" '.input.alwaysAllowed | join(",")' "openapi.json" read-checks "$LC"` so the decision is pinned by name. Green before and after.
2. **Fix, `gateFile`** (`:924-931`): keep the generated form first (`\((\S+), steps \d+ to \d+\)`); then the hand-written form, `Verification Gate\s*\(([^\s()]+)\)`; then the last-resort `([^\s()]*shape-spec\.md)`, parentheses excluded from the class so the match never starts on one.
3. **Fix, `alwaysAllowed`** (`:982-985` and after the loop): record whether an `ALWAYS_ALLOWED=(` line was seen. In the same loop, on a line matching `^\s*printf '%s\\n' 'agent-os/specs/' 'agent-os/standards/'(.*)$`, take the rest's tokens with the same three-way pattern the array parser uses (`'…'`, `"…"`, bare), dropping an empty token and any that starts with `$` (the template's `${ALWAYS_ALLOWED[@]+…}`); after the loop, when no array line was seen, `allowed` is that list. The template form therefore still reads from the array, and a hand-written file reads from the `printf`.
4. **Header comment of the script** (`:61-63`, the `read-checks` entry): "…variables, `ALWAYS_ALLOWED` (or the allowed list a hand-written git block hard-codes after `'agent-os/specs/' 'agent-os/standards/'`) and header back (the gate file with or without the generated `steps m to n`)…".

## Task 5: This repository's `checks.sh`

**Files:** none expected to change.

Run `scripts/redline-setup.sh checks .claude/redline/checks.json .claude/redline/checks.sh` and `scripts/redline-gate.sh check .`. Expected: `changed: false` and `ok: true`, since `checks.json` has no `vars` and no `source` step and the gate text is untouched (Context). If `changed` were true, the diff is the header's and goes in Task 4's commit; if the stamp had moved, `scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh` goes in the same commit. Record the result in As built. The template version stays v2 (decision 7).

## Task 6: Docs (gate step 10)

**Files:** `README.md`, `skills/setup/SKILL.md`.

1. `README.md:332`, the `read-checks` row: "the `run_check` lines, guards, variables, `ALWAYS_ALLOWED` (or the list a hand-written git block hard-codes) and header read back, with a best-effort `checks.json` under `input`".
2. `skills/setup/SKILL.md:80`: "the variables and `ALWAYS_ALLOWED` (or the allowed list a hand-written git block hard-codes), and `repo`, `gateFile` and `baseline` when the header carries them".
3. The `checks.sh` section of the README shows no header, so items 1 and 2 add nothing there (decision 8).

## Task 7: Verification Gate

Run `.claude/redline/checks.sh --baseline` until it exits 0; its JSON is the evidence (steps 1 to 9: syntax, manifest, guard, loop, prefs, gate stamp, setup, gh, background). `tests/setup-test.sh` alone prints its new count with `0 failed` (292 passed today; each task's red run is seen with it before the fix). Then:

**Step 10, Docs entries** (one per touched file; the gate confirms each names its commit or its reason):

| File | README section | Commit |
| --- | --- | --- |
| `scripts/redline-setup.sh` (items 1 and 2) | no reader-facing change: the `checks.sh` section shows the usage, the example gate and the output contract, never the header's checks list or a vars line; the script's own header is the documentation and is updated in Tasks 2 and 3 | — |
| `scripts/redline-setup.sh` (item 3) | `redline-setup.sh`, the `read-checks` row | Task 6's commit |
| `skills/setup/SKILL.md` | `redline-setup.sh` row (the skill's bootstrap paragraph names what `read-checks` reads) | Task 6's commit |
| `tests/setup-test.sh` | no reader-facing change: tests | — |

No new config key, subcommand, allow rule or exit code; `checks.json`'s shape is unchanged; the template version is unchanged.

**Step 11, Standards retrospective (proposed; approved with `AskUserQuestion` at the gate, applied in their own commit):**

1. `agent-os/standards/scripts/bash-conventions.md`: add "A reader that bootstraps a hand-written file (`redline-setup.sh read-checks`) accepts the hand-written spellings the generator replaced, not only the generator's own: the gate file with or without `steps m to n`, `ALWAYS_ALLOWED` or the git block's hard-coded `printf` list, `ENV=<name>` with or without `(default …)` on the line; and a header line that shows a command prints it as a person types it, since the escaping belongs to the `run_check` line alone (#18)".
2. `agent-os/standards/testing/tests.md`: add "A hand-written shape the bootstrap must read is derived from the generated Laravel fixture with `sed … > <copy>` in the temp directory (the `(<file>)` gate line, the hard-coded allowed list, a vars line without its default), so one fixture serves the generator and the reader, beside the gate fixture's already hand-written header (#18)".
3. `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`: no changes expected.

**Step 12**: `plan.md` reflects what was built; deviations under Decisions in `shape.md`.

## Commits (the person makes and titles them)

1. The spec folder (Task 1).
2. Item 1: the header shows a `source` step unescaped, with its case (Task 2).
3. Item 2: the vars line and the reader's docs regex, with their cases (Task 3).
4. Item 3: `gateFile` and the hard-coded allowed list in `read-checks`, with their cases (Task 4), plus Task 5's regenerate if it changed anything.
5. Docs (Task 6).
6. The standards commit (Task 7, step 11), then the as-built commit.

## Verification

- Per task: `tests/setup-test.sh` shows the new case as `FAIL` before the fix and `ok` after; the neighbours stay `ok` throughout.
- `scripts/redline-setup.sh checks tests/setup-fixtures/checks-input-laravel.json <scratch>` and a read of the header by eye: the `env` line reads as the answered preview, the `REDLINE_MIGRATE_DB` line as decision 2.
- `scripts/redline-setup.sh read-checks ~/Code/Sites/chalkboard-feature-redline-plugin/.claude/redline/checks.sh | jq '.input | {gateFile, alwaysAllowed, vars}'` on Chalkboard's original hand-written gate (outside this repository, read only) gives `.claude/commands/agent-os/shape-spec.md`, `["openapi.json"]` and the var with its doc: the live case the issue came from. Record the output in As built.
- `.claude/redline/checks.sh --baseline` exits 0; `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .claude/redline/checks.sh` exit 0; `git status` shows `checks.sh` unchanged after Task 5.

## References

- `scripts/redline-setup.sh`: `:54-63` (the `checks` and `read-checks` header entries), `:71-82` (the `checks.json` shape), `:748-749` (`dq`, the escaping the header must not show), `:764-771` (the header's environment and checks lines), `:912` (header lines joined for `htext`), `:920-943` (`repo`, `gateFile`, `self_hosted`, `baseline`, the docs regex), `:947-972` (`RUN`, `COMMENT`, `VAR`, `unescape`, `expands`), `:978-1011` (the line loop: `ALWAYS_ALLOWED`, vars, guards, `run_check`), `:1012-1041` (the `input` assembly).
- `scripts/checks-template.sh:251-255`: the `printf` allowed line the hard-coded form replaces; `:19-22`: the template's own environment block (unchanged).
- `tests/setup-test.sh`: `:351-411` (the Laravel shape, the `read-checks` cases, the `stale.sh` sed-copy pattern at `:403`), `:440-482` (bad input), `:503-511` (this checkout's regeneration and stamp).
- `tests/setup-fixtures/checks-input-laravel.json`: the one var, the `env` base-diff `source` step, `alwaysAllowed: ["openapi.json"]`.
- `tests/gate-fixtures/checks-no-stamp.sh:3-4`: a hand-written header whose `(<file>)` sits on the line after "Verification Gate".
- Chalkboard's original hand-written gate, `~/Code/Sites/chalkboard-feature-redline-plugin/.claude/redline/checks.sh` (commit 44f9a33): `:3-4` the gate line, `:13-15` the vars line with its default on the next line, `:181` the hard-coded allowed list; its bootstrapped `checks.json` in `~/Code/Sites/chalkboard/.claude/redline/`, and the regenerated `checks.sh` there (`:16`, the `=migrate_db` line the issue quotes). Read only; cited, not copied.
- This repository's pre-generator gate, `git show 7ac2d65^:.claude/redline/checks.sh` (`ALWAYS_ALLOWED=()` already, so the hard-coded form is Chalkboard's generation).
- `README.md:223-281` (the `checks.sh` section, no header shown), `:325-333` (the `redline-setup.sh` table); `skills/setup/SKILL.md:76-80` (the bootstrap paragraph).
- `agent-os/specs/2026-11-02-0744-57-60-relaunch-path-spec-check-and-relay/` for the spec folder's format.

## As built

Built on 2026-11-02 from this plan; the person makes every commit.

- **Task 2.** `unq()` beside `dq()` in `PY_CHECKS`, the header's checks line shows `unq(i["source"])` for a `source` step; the two cases ("a source step's header line reads as bash -c receives it, unescaped", red first; "the run_check line keeps the escapes", green throughout). The Laravel header's `env` line now reads as the answered preview.
- **Task 3.** The vars line prints `ENV=<name>   doc (default value)`; the reader's docs regex accepts `<name>` or an identifier with the `(default …)` tail optional. The old vars-line case became the item's case (red first); the hand-written-line case (red first) and the `ENV=identifier` neighbour (green throughout) were added after the `read-checks` cases. **Deviation:** the hand-written copy's `sed` matches either spelling after `=` (`[^ ]*`), so that case is red before the generator change as well as after it, not only once the generator has moved.
- **Task 4.** `gateFile` tries the generated form, then `Verification Gate (<file>)`, then a `shape-spec.md` path never starting on a parenthesis; `alwaysAllowed` comes from `ALWAYS_ALLOWED` when the file has the line (`aa_seen`), else from the entries after `'agent-os/specs/' 'agent-os/standards/'` on the git block's `printf` line with the template's array expansion removed. The two hand-written cases were red first; the template-form neighbour green throughout. **Deviation:** the title split in `read-checks` passed `maxsplit` positionally, which Python 3.13 reports as a deprecation warning on stderr on every call (seen when reading Chalkboard's original gate); it is now the keyword, and the call prints nothing on stderr.
- **Task 5.** `scripts/redline-setup.sh checks .claude/redline/checks.json .claude/redline/checks.sh` reported `changed: false`; `scripts/redline-gate.sh check .` reported `ok: true, reason: match`; `scripts/redline-setup.sh version` reported v2 on both sides. `checks.sh` is unchanged, so no restamp.
- **Task 6.** `README.md`: the `read-checks` row of the `redline-setup.sh` table. `skills/setup/SKILL.md`: the bootstrap paragraph's sentence on what `input` carries. The script's own header (the `checks` and `read-checks` entries) was updated in Tasks 2 to 4.
- **The live case.** `scripts/redline-setup.sh read-checks` on Chalkboard's original hand-written gate (`~/Code/Sites/chalkboard-feature-redline-plugin/.claude/redline/checks.sh`, read only) now gives `gateFile` `.claude/commands/agent-os/shape-spec.md`, `alwaysAllowed` `["openapi.json"]` and the var with its doc `scratch database for the migrations check`: the three fields the skill fixed by hand on the first rerun.
- **Gate.** `.claude/redline/checks.sh --baseline` on 2026-11-02 exited 0 in 1 min 12 s with every check at exit 0: syntax, validate (passed with the known icon warning), guard, loop (495 checks passed, 0 failed), prefs (101), gate (117), setup (299, from 292), gh (113), background (39). shellcheck is not installed on this machine; the CI leg runs it. Docs entries: as in the table above, each naming its section or its reason; the commits are the person's. Standards retrospective: see `shape.md`, Decisions.
