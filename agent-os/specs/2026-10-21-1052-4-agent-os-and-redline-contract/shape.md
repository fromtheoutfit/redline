# #4: Install Agent OS and Redline's own contract — Shaping Notes

## Scope

Issue #4, "Install Agent OS and Redline's own contract so Redline can review itself": Part 1 (Agent OS the way Chalkboard has it, adapted to a plugin repository), Part 2 (Redline's own per-repo contract), and the known wrinkle (the guard protects the plugin's directory for every role, which refuses every implementer write when the repository is the plugin). Done when a `dry run review only` runs here with zero permission denials, `checks.sh --baseline` is green, and every standard in `index.yml` exists.

## Investigation

- The plugin is read in place from this checkout (`claude plugin list`: `Read from: /Users/michaelwitwicki/Code/Claude/redline`; the marketplace `redline` is a directory source), so the wrinkle is live, not theoretical. A marketplace cache copy exists at `~/.claude/plugins/cache/redline/redline/0.1.0` but is not what runs.
- `scripts/redline-guard.sh`, `protected()`: the plugin-directory check runs before the role's prefixes and matches every path under the repository when the two are one. `REPO` is an absolute path from the hook's `cwd`; `PLUGIN_DIRS` holds the normalised and the real path, so the self-hosted test compares real paths.
- `tests/guard-test.sh` decides the repository from the hook `cwd` only, and forces the cache repository when its own cwd is the plugin, so a self-hosted row needs its own `cwd`.
- A `review only` run launches gather, review and post only (`workflows/redline-loop.js`); it never runs `checks.sh` and never reads `shape-spec.md` or `index.yml`. The main session's commands are all covered by `templates/settings.allow.json`; the proven Chalkboard dry run had zero denials with that list alone.
- Chalkboard's four stock commands carry no Laravel content; only `shape-spec.md` is customised. Chalkboard's standards have no frontmatter. The "Code review: check before reporting" section is in Losers League's `CLAUDE.md`, not Chalkboard's.
- `hooks/` holds only `hooks.json`, so `bash -n hooks/*` fails.
- Baseline by hand before the change: `bash -n` ok, `claude plugin validate .` passes with an icon warning, prefs 44/44, loop 100/100, guard 287/287 in about 17 s.

## Unattended answers

Not a Redline run; shaped by a person in plan mode with one question to the author.

## Decisions

- **The self-hosted write set.** When the repository is the plugin, the implementer may write everything except `.claude/`'s Redline files, and `scripts/redline-guard.sh` and `hooks/hooks.json` stay refused for every role: a guard change is made by a person. The issue's list of five directories was illustrative; `hooks/`, `templates/`, `README.md` and `.claude-plugin/` are writable too, so a Redline PR that bumps the version or edits the README can be fixed. The approved plan's file list, enforced by the checker, is what limits the implementer. decided by: @michaelfromtheoutfit
- **`bash -n hooks/*` becomes `jq -e . hooks/hooks.json`.** The directory holds only JSON. decided by: redline
- **No formatter step and no Octane block in `checks.sh`.** Nothing here mutates a file and nothing outlives a request. decided by: redline
- **The "Code review" section is taken from Losers League.** Chalkboard does not have it; the issue named Chalkboard as the model for the rest. decided by: redline
- **The unattended section comes from the plugin's template, not Chalkboard's copy**, with point 11 dropped (no PR-description standard here) and the gate numbers repointed. decided by: redline
- **`settings.json` keeps the GitHub marketplace source** for teammates; this machine already knows `redline` as a directory marketplace, and `enabledPlugins` is what turns it on here. The install CLI reorders the keys; the content is the template's plus the gate's commands. decided by: redline
- **No `Bash(date:*)` rule**: the proven dry run ran `date` with the template list alone. decided by: redline
- **Out of scope**: the reviewer's prompt and the guard's groups are Laravel-shaped, so the reviewer cannot run this repository's tests to reproduce a finding, and the implementer runs them only through `checks.sh`. That is issue #3. decided by: redline

### Proportionality (the wrinkle)

Likely and visible: every implementer write in a Redline run on this repository is refused, so no revise pass can succeed here. Cost: a few lines in the guard, a directive in the harness, and test rows. Fix.

## Deferred

None.

## Context

- **Visuals:** None
- **References:** see `references.md`
- **Product alignment:** `agent-os/product/roadmap.md`, Phase 1 item 4

## Standards Applied

The standards did not exist when shaping started; the eight written here are the retrospective's output and this change follows them: `scripts/guard` (every guard change gets its rows), `testing/tests` (a tested surface gains a case), `prompts/attribution` (no attribution anywhere in these files), `process/internal-notes` (nothing from the design record copied in).

## Standards retrospective

The eight standards under `agent-os/standards/` are this spec's retrospective: each records what the code already does, discovered from the scripts, the workflow, the agents and the tests, plus the one new rule this change adds (the self-hosted case in `scripts/guard`). No further edits.
