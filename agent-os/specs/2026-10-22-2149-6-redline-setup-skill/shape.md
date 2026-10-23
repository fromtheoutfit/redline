# #6, second half: `/redline:setup` — Shaping Notes

## Scope

Issue #6 asks for `/redline:setup`, an interactive skill run from a repository's root that reads what it can off the repository, asks about the rest, and writes Redline's per-repository contract, and for the gate stamp that lets a launch refuse a `checks.sh` whose Verification Gate has moved. The stamp shipped first (#7, #8: `scripts/redline-gate.sh extract|stamp|check`, the precheck's stamp check, the `# redline-gate:` placeholder in `scripts/checks-template.sh`). This spec ships the skill (`skills/setup/SKILL.md`), the script behind its scriptable parts (`scripts/redline-setup.sh`), that script's test (`tests/setup-test.sh`, gate step 7), the template version line from #11 with its precheck warning, and the dogfood: this repository's own `checks.sh` generated from a committed `.claude/redline/checks.json`.

## Investigation

- The two hand ports, Chalkboard and Losers League, differ from each other and from this repository only in header prose, `ALWAYS_ALLOWED`, the check block, and (Chalkboard) one `migrate_db=` line after `trap` plus an `if env_base="$(base_ref)"` wrapper around the env step. So one generator with named patterns (`formatter`, `vars`, `kind: base-diff`, `octane`) covers every `checks.sh` seen so far.
- Losers League's port (`redline-internal/docs/STEP14-NOTES.md`) lost a 14-minute baseline to a `vendor/` behind `composer.lock`, a Playwright behind `package-lock.json` and a two-month-old `public/build`; its gate text (`php artisan test --compact`, Browser suite included) disagrees with CI (`composer test`, parallel, no Browser) and with CLAUDE.md (`composer browsertest`), and CI passes `--memory-limit=2G` to PHPStan while the gate does not. Those are the skill's step 3 and step 4 examples.
- The three unattended sections differ in points 7, 8 and 11 and in hand edits elsewhere (this repository's point 11 is "The guard and the hook"; Losers League's point 2 lists extra topics), so a rerun patches phrases in place and never re-pastes the body.
- `claude plugin install --scope project` rewrites `.claude/settings.json` in its own key order (here `permissions, enabledPlugins, extraKnownMarketplaces`; the template's is `extraKnownMarketplaces, enabledPlugins, permissions`), so the settings merge compares semantically (`jq -S`) and does not write when nothing changed.
- `redline-gate.sh stamp` replaces the first `# redline-gate:` line or inserts the stamp as the header's last line, and `check` reads the first such line; the version line therefore sits immediately above the stamp, and the generator keeps an existing stamp line when it regenerates.
- The guard refuses `.claude/redline/` to every role (`scripts/redline-guard.sh`), so `checks.json` is as unwritable to a Redline run as `checks.sh`; `scripts/redline-setup.sh` is unknown to `script_name()` and ends at default deny, like `redline-prefs.sh` and `redline-gate.sh`.
- The stall arithmetic from the Losers League port (baseline × 1.7, rounded up to five minutes, never below 300000) reproduces its committed `checkerStallMs` of 1800000 for a 1048 s baseline, and this repository's 300000 for 29 s.

## Unattended answers

Not a Redline run; shaped by a person in plan mode, one question at a time.

## Decisions

- **#11 scope: the version line and a precheck warning, not the function port.** Setup writes `# redline-template: checks-template.sh v1` above the stamp; `/redline:redline`'s precheck warns in one line, never stops, when a repository's line is older than the template's or missing. Diffing the template-owned functions against a repository's copy on rerun stays with #11. decided by: @michaelfromtheoutfit
- **`checks.sh` is generated from a committed `.claude/redline/checks.json`.** The JSON is the source of truth and is never bypassed: a change is an edit to the JSON and a regenerate. A rerun regenerates and reports no change when nothing drifted; a gate mismatch is answered in the JSON. A repository with a hand-written `checks.sh` (Chalkboard, Losers League) is bootstrapped by `read-checks`, and the diff against the hand-written file is the person's to accept. decided by: @michaelfromtheoutfit
- **The generator's input stays minimal** (names, commands, recorded flags, the baseline, the few named patterns); the header prose is the generator's, so this repository's hand-written header notes are replaced by generated ones. decided by: @michaelfromtheoutfit
- **One script, one harness, gate step 7.** `scripts/redline-setup.sh` with subcommands `settings`, `gitignore`, `unattended`, `config`, `checks`, `read-checks`, `version`; `tests/setup-test.sh` over `tests/setup-fixtures/`; the gate list gains step 7 and `checks.sh` is restamped in the same commit. decided by: redline
- **No allow-list entry for `redline-setup.sh`.** Setup is interactive and rewrites `.claude/settings.json`; the permission prompt is the person's confirmation. Guard-cases rows pin the script as the skill's. decided by: redline
- **The stamp runs at the end of step 5 with `--steps` from step 3's split, and step 10 stamps again without `--steps` as the cross-check.** Shaped as "after step 10, once the inserted section supplies the range"; changed during the build when the fresh-run evidence showed this repository's gate, which tests its own stamp, red at step 6 until stamped (see `plan.md`, As built). decided by: redline
- **The skill never commits, stages or pushes.** Step 13 prints the file list, the baseline result and time, a suggested commit message and PR title. decided by: @michaelfromtheoutfit
- **Clean-clone evidence is two runs on this repository**: a rerun that changes nothing, and a fresh run on a stripped clone whose diff against the committed contract is empty but for recorded deviations (this repository's hand-written point 11, the CLAUDE.md parenthetical, `settings.json` key order, the baseline date and seconds). decided by: @michaelfromtheoutfit
- **Step 4 checks built assets too**, and builds before the baseline when the suite has browser tests. decided by: @michaelfromtheoutfit
- **Step 3's command/prose split is a conversation**, not a rule; the stamp hashes every backticked item regardless (#7). decided by: @michaelfromtheoutfit

### Proportionality

Likely and visible: every new repository repeats the two hand ports' traps, and a third is waiting. Cost: one script with seven subcommands, one harness, one skill file, documentation, and a regenerated `checks.sh` here. Fix.

- **Deviations from the shaped plan** (gate step 9): the stamp order above; `checks.json` steps carry a `title` and `vars` a `doc`, which the header prints and `read-checks` recovers; the generator keeps an existing stamp line rather than masking it in a comparison; this repository's `settings.json` gained the template's `REDLINE_OCTANE` allow entry, found by the rerun's merge; the clean-clone evidence ran on a stand-in built from the working tree, from this session, since the commits are the owner's (`plan.md`, As built, has the two runs and their diffs). decided by: redline

## Deferred

- **#11's function port**: diffing `run_check`, `emit_checks`, `tree_state`, `base_ref` and the git block against a repository's copy on rerun. With `checks.json`, that port is a regenerate: a repository that has bootstrapped its JSON gets the template's current functions on the next `redline-setup.sh checks`, so #11's remaining work is running setup on Chalkboard and Losers League.
- **Repositories without Agent OS** (#1) and other trackers (#2), as the issue says.

## Context

- **Visuals:** None
- **References:** see `references.md`
- **Product alignment:** `agent-os/product/roadmap.md` Phase 1 item 7 (both halves of #6); `tech-stack.md` counts (four skills, five harnesses)

## Standards Applied

- scripts/bash-conventions — the script's header, exit codes, stdin-fed python, jq for JSON, `--help` range, `pwd -P`
- testing/tests — a fifth harness, red before green, writes only under the temp directory, the dogfood case
- scripts/guard — no guard change; the skill-only script and `checks.json` are pinned with rows
- prompts/attribution — nothing written by setup names a model or vendor
- process/internal-notes — the port notes stay in the internal record and are cited by name
- workflow/agents — the shaper's point 11 learns that `checks.sh` is generated from `checks.json`
- workflow/replay — the precheck warning runs before launch and never enters `args`
- process/standards-retrospective — gate step 7 becomes 8

## Standards retrospective

Items: the ten decisions above, the As-built deviations, and two things learned during the build: the guard's `TMP` prefix makes a checkout under the temp directory writable for every role, so a stand-in checkout showed false allows; and a self-hosted gate that tests its own stamp is red until stamped, which moved the first stamp into step 5. Approved by the owner and applied in their own commit:

- `testing/tests.md`: five harnesses; a bullet for `tests/setup-test.sh`; "a setup case"; the stamp bullet gains the `checks.json` regenerate rule; a bullet on stand-in checkouts and the `TMP` prefix. `index.yml`'s description lists the fifth harness.
- `scripts/bash-conventions.md`: `redline-setup.sh` in the script list and the skill-only bullet (no allow-list rule); a generator splices by anchor lines and is deterministic; a script that edits a person's file preserves BOM and line endings, writes only on change, and compares JSON semantically.
- `scripts/guard.md`: a finding that changes a check edits `checks.json` and regenerates; deferred the same way.
- `process/standards-retrospective.md`: gate step 7 becomes 8.
