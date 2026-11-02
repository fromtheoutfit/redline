# The `checks.sh` header and the `read-checks` bootstrap (#18) — Shaping Notes

## Scope

Issue #18, all three items, read with the decisions in the shaping prompt and the two answered on 2026-11-02:

1. **The header's checks list shows a `source` step with its escapes.** The generator prints the `source` text verbatim into the header comment, so Chalkboard's `env` step read `base=\$(git merge-base $env_base HEAD) || { echo \"no merge base …`. The header prints each command as a person would type it: a `cmd` step as today, a `source` step unescaped. The `run_check` line keeps its escapes.
2. **A `vars` line prints `ENV=name` instead of `ENV=<name>`.** The line becomes `ENV=<name>   <doc> (default <value>)`, matching the hand-written form, and `read-checks` reads the doc off either spelling, with or without the `(default …)` tail.
3. **`read-checks` bootstraps `gateFile` with a stray `(` and `alwaysAllowed` empty** on a hand-written gate. It strips the parenthesis from the hand-written "Verification Gate (<file>)" line and reads `ALWAYS_ALLOWED` or, when the file has none, the list hard-coded on the git block's `printf` line.

Tests: one setup-test case per item against the Laravel fixture, red first, each with a neighbour that must not change. This repository's `checks.sh` is regenerated as a check (a no-op is expected) and restamped only if the stamp moves. Template version v2 stays. The person makes every commit.

## Decisions

1. **Item 1** (prompt 1, answered 2026-11-02): the header prints a step's command as a person would type it. A `cmd` step prints `cmd` as today; a `source` step prints the source **unescaped**, as `bash -c` receives it (`\\` `\"` `\$` `` \` `` undone; the script's own variables such as `$env_base` and `$migrate_db` stay as written, since the header cannot expand them). The `run_check` line keeps its escapes; `read-checks` still round-trips the source verbatim. Decided by: @michaelwitwicki.
2. **Item 2** (prompt 2): a `vars` line prints `ENV=<name>   <doc> (default <value>)`, the literal placeholder `<name>`, matching the hand-written form. Decided by: @michaelwitwicki.
3. **Item 3** (prompt 3): `read-checks` strips the parenthesis from the hand-written gate line and reads `ALWAYS_ALLOWED` or, when the file has none, the single-quoted entries after `'agent-os/specs/' 'agent-os/standards/'` on the git block's `printf` line into `alwaysAllowed`. Decided by: @michaelwitwicki.
4. **The docs regex moves with item 2** (from the survey): `read-checks` reads a var's doc off `ENV=<name> …` as well as `ENV=<identifier> …` (a file generated before this change, on its rerun), with the `(default …)` tail optional (Chalkboard's hand-written line had it on the next line). Without this, item 2 breaks the round-trip case; with it, the bootstrap no longer loses the doc. Decided by: redline (shaping).
5. **Tests** (prompt): one setup-test case per item against the Laravel fixture, red first. The hand-written shapes are derived from the generated Laravel `checks.sh` with `sed … > <copy>` in the temp directory, as the `stale.sh` case does, never a new fixture file and never `sed -i` (`testing/tests`); `tests/gate-fixtures/checks-no-stamp.sh` serves as a second, already hand-written header for the `gateFile` case. Each item keeps a neighbour that must not change (the `run_check` line's escapes; the old `=identifier` header form; the template form's `ALWAYS_ALLOWED`).
6. **Regenerate and restamp** (prompt): this repository's `checks.sh` is regenerated from `checks.json` and `redline-gate.sh check .` run; a no-op is the expected result (`checks.json` has no `vars` and no `source` step; the gate text is untouched), and only a moved stamp would be restamped. Point 11 of the unattended section applies to a Redline round on the PR, not to this build.
7. **Template version** (prompt): stays v2; only header lines change, `scripts/checks-template.sh` is untouched.
8. **Docs** (prompt): the README's `checks.sh` section shows no header, so items 1 and 2 have no reader-facing change; item 3 rewords the README's `read-checks` row and the setup skill's bootstrap sentence. The script's own header (its documentation, `scripts/bash-conventions`) is updated for all three.
9. **Standards carried** (answered 2026-11-02): `scripts/bash-conventions`, `testing/tests`, `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`. Decided by: @michaelwitwicki.
10. Visuals: none. The person makes every commit.
11. **Standards retrospective: applied** (2026-11-02): the two edits under "Standards retrospective (applied)" below. Decided by: @michaelwitwicki.
12. **As built, two deviations from the plan** (see `plan.md`, As built): the hand-written var line's `sed` matches either spelling after `=`, so its case is red before the generator change too; and the title split in `read-checks` passes `maxsplit` as a keyword, removing a Python 3.13 deprecation warning the Chalkboard read surfaced on stderr. Decided by: redline.

## Context

What the survey established (read only):

- **Item 1 is the `source` step only.** The header's checks list (`scripts/redline-setup.sh:769-771`) prints `i["cmd"]` for a `cmd` step, already the string a person types (the `dq()` escaping at `:748` is applied only on the `run_check` line), and `i["source"]` verbatim for a `source` step, the escaped text that sits inside the `run_check` line's double quotes. The Laravel fixture's `env` step reproduces the issue's line. `PY_READ` already has the inverse, `unescape()` at `:950-961`.
- **Item 2 is one token in the generator**, `:765`, which prints the var's shell name after `=`. Chalkboard's original hand-written line (`~/Code/Sites/chalkboard-feature-redline-plugin/.claude/redline/checks.sh:14-15`, commit 44f9a33) read `REDLINE_MIGRATE_DB=<name> scratch database for the migrations check` with `(default chalkboard_redline_migrate)` on the next line; the issue's one-line form is the target. The reader's docs regex at `:941` requires an identifier after `=` and a `(default …)` tail, so the new line would stop yielding the doc (decision 4), and the same regex is why Chalkboard's hand-written line yielded none (the skill filled it by hand).
- **Item 3, `gateFile`:** `:925` reads the generated form `(<file>, steps m to n)`; the fallback at `:929`, `(\S*shape-spec\.md)`, swallows the opening parenthesis of the hand-written form. Reproduced on `tests/gate-fixtures/checks-no-stamp.sh`, whose header has that form across a line break (header lines are joined with a space at `:912`).
- **Item 3, `alwaysAllowed`:** `:982-985` reads only an `ALWAYS_ALLOWED=(…)` line. Chalkboard's original hard-coded the entry in the git block, `printf '%s\n' 'agent-os/specs/' 'agent-os/standards/' 'openapi.json'` (`:181`), where the template writes the array expansion (`scripts/checks-template.sh:254`). This repository's own pre-generator `checks.sh` (`git show 7ac2d65^:.claude/redline/checks.sh`) already used `ALWAYS_ALLOWED=()`, so the hard-coded form is the Chalkboard-era one.
- **Nothing below the header moves**, so the template stays v2, and **this repository's `checks.sh` does not change** (no vars, no `source` step, the gate text untouched); the setup test's last cases prove both.
- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md` names Chalkboard among the target users; this is the bootstrap that brought its hand-written gate under `checks.json`. Nothing else bears.

## Standards retrospective (proposed)

Approved with `AskUserQuestion` at the gate and applied in their own commit.

1. `agent-os/standards/scripts/bash-conventions.md`: add "A reader that bootstraps a hand-written file (`redline-setup.sh read-checks`) accepts the hand-written spellings the generator replaced, not only the generator's own: the gate file with or without `steps m to n`, `ALWAYS_ALLOWED` or the git block's hard-coded `printf` list, `ENV=<name>` with or without `(default …)` on the line; and a header line that shows a command prints it as a person types it, since the escaping belongs to the `run_check` line alone (#18)".
2. `agent-os/standards/testing/tests.md`: add "A hand-written shape the bootstrap must read is derived from the generated Laravel fixture with `sed … > <copy>` in the temp directory (the `(<file>)` gate line, the hard-coded allowed list, a vars line without its default), so one fixture serves the generator and the reader, beside the gate fixture's already hand-written header (#18)".
3. `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`: no changes expected.

## Standards Applied

- scripts/bash-conventions — the generator stays deterministic and validates what it writes; the header is the script's documentation and is updated with it; Python inside the script is `python3 -I -c` on stdin
- testing/tests — one setup case per item, red before green, a neighbour beside each; copies by `sed … > <copy>` in the temp directory, never a new fixture, never `sed -i`
- process/docs-gate — the Docs entries table in `plan.md`
- process/standards-retrospective — the proposed list above
- prompts/attribution — nothing new names a model or vendor

## Standards retrospective (applied)

Approved on 2026-11-02, both: the bullets above as drafted, appended to `scripts/bash-conventions.md` and `testing/tests.md`, in their own commit. `process/docs-gate`, `process/standards-retrospective` and `prompts/attribution`: no changes. Decided by: @michaelwitwicki.
