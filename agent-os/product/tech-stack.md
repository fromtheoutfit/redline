# Tech Stack

## Runtime

- A Claude Code plugin: dynamic workflows (research preview; proven on 2.1.303, 2.1.304 and 2.1.306), subagents, a plugin `PreToolUse` hook, and skills. One workflow (`workflows/redline-loop.js`, run as `redline:redline-loop`), eight agents (`agents/redline-*.md`), three skills (`/redline:redline` and the two debug halves)
- Models per role from `.claude/redline.json` (Opus for the roles that read code, Haiku for the ones that move files and post); the revise model is chosen at launch and remembered per person

## Scripts

- Bash with `set -euo pipefail` for every script under `scripts/`; `jq` for JSON; `python3 -I` with the standard library for the guard's command parser
- `gh` for every GitHub call, through `scripts/redline-gh.sh`; authentication is `gh`'s
- Each repository's gate is its own `.claude/redline/checks.sh`, built from `scripts/checks-template.sh`; here it runs the six steps in `.claude/commands/agent-os/shape-spec.md`, and carries the gate stamp that `scripts/redline-gate.sh` checks at launch

## Tests

- Bash harnesses for the guard (`tests/guard-test.sh` over `tests/guard-cases.tsv`), the saved settings (`tests/prefs-test.sh`) and the gate stamp (`tests/gate-test.sh` over `tests/gate-fixtures/`); Node, ESM, no dependencies, for the workflow (`tests/loop-test.mjs`)
- No framework, no package manager, no lockfile, no build step, no CI yet

## Planner and host

- Agent OS in the repository under review: `.claude/commands/agent-os/` (five commands) and `agent-os/` (product, standards, specs)
- GitHub, through `gh`; both are the only options in Phase 1 (see `roadmap.md`)

## Where the rest lives

- The design record, step notes and spike notes are in the private sibling repository `redline-internal`; this repository carries the tool and its README only
