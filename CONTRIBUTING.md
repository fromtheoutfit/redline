# Contributing

How this repository is developed, checked and released. The plugin's documentation for users is the [README](README.md) and [docs/](docs/); this file is for a change to the plugin itself.

## Developing the plugin

To run a checkout's own code, start the session with `claude --plugin-dir /path/to/redline`, from the checkout or from any repository that should run unreleased code: the checkout loads as `redline@inline` for that session, replacing the installed copy by name, with its hooks and `${CLAUDE_PLUGIN_ROOT}` from the checkout, so a Redline run on this repository runs the PR branch's own skill, workflow, agents and guard; edits take effect at the next session start. The launch precheck warns when this repository is reviewed without it (`redline-setup.sh version`, "Template version" in [docs/contract.md](docs/contract.md)). The local-directory marketplace (`claude plugin marketplace add /path/to/redline`) also loads in place, but a marketplace is registered once per user, so every repository on the machine then runs whatever branch the checkout has out; use it only on a machine with no other Redline repositories.

## This repository reviews itself

This repository is itself set up the same way (`.claude/redline/checks.sh`, `.claude/redline.json`, the allow list, Agent OS under `.claude/commands/agent-os/` and `agent-os/`), so a Redline pull request gets a Redline review; see "Self-hosted" in [docs/guard.md](docs/guard.md) for what that changes.

## Specs and the gate

Work is shaped with `/agent-os:shape-spec` and follows the standards in `agent-os/standards/`. A spec is not complete until the Verification Gate in `.claude/commands/agent-os/shape-spec.md` passes: `.claude/redline/checks.sh --baseline` runs its nine command steps (syntax, manifest, the guard table, the loop, prefs, gate stamp, setup, the GitHub wrapper, background) and prints one JSON object, then the Docs step, the Version step, the standards retrospective and the spec-folder check below. `checks.sh` is generated from `.claude/redline/checks.json`: a change to a check edits the JSON and regenerates (`scripts/redline-setup.sh checks .claude/redline/checks.json .claude/redline/checks.sh`), and a change to the gate's backticked text restamps it in the same commit (`scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh`); the gate test's last case and the setup test's last cases prove both.

## CI

Every push to a pull request and every push to `main` runs the gate in GitHub Actions on Ubuntu and macOS (`.github/workflows/gate.yml`): the same `.claude/redline/checks.sh --baseline` the Redline checker runs, then `scripts/redline-gate.sh check .`, `scripts/redline-setup.sh version .` (the contract's versions: `checks.sh`, the unattended section and `settings.json`), and a check that the tree is clean afterwards. Run the same four from the repository root before pushing; a check that fails on one OS is fixed on that OS, never skipped in the workflow. shellcheck runs beside the gate on Ubuntu and is required.

## The Docs step

The gate has a Docs step: a spec that adds or alters a file under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, or adds a config key, subcommand, allow rule or exit code, names in its plan the README section, or the `docs/` file and section (and the template, if any), it updates, or says why there is no reader-facing change. The Redline reviewer reports a change with no such entry as a nit, and the plan approver sends back a plan missing one. A change to `docs/` is reader-facing by nature and needs no entry of its own. `docs/scripts.md` quotes each script's header verbatim, so a header change updates it in the same commit.

Two README sections are named by heading from outside this repository and stay where they are: "Git rules for Redline agents" (the sentence `/redline:setup` writes into every repository's CLAUDE.md, and every agent prompt, point at it) and "Known limits" (the handoff comment links it). Moving either is a template change: a minor bump and a rerun of setup in every repository.

## Releases

The gate's Version step: `.claude-plugin/plugin.json` and the entry in `.claude-plugin/marketplace.json` carry one semver version, and the setup test checks they agree. Every PR bumps it: minor when the change alters what a setup rerun writes (with the template markers it touches bumped in the same PR), major for a contract change a rerun cannot carry, patch otherwise; the Redline reviewer reports a missing bump as a nit, except in a PR whose spec keeps the version on purpose. After the merge, on `main`, from the plugin root: first the `CHANGELOG.md` entry, one heading for the version with the tag date and one line per PR merged since the previous tag, grouped as the file says, committed on `main`, so the tag names a commit that carries its own entry (`claude plugin tag` refuses a dirty tree, so the entry cannot wait uncommitted); then, on the clean tree, `claude plugin tag --dry-run .` and `claude plugin tag --push` (`claude plugin tag` is Claude Code 2.1.316's), which validates the manifest, requires the two versions to agree, a clean tree and no `redline--v<version>` tag yet, and pushes the annotated tag. Nothing automates the tag: CI runs the gate, never a release. Claude Code moves an install on the manifest's version, not the tag; the tag names the release commit and is what a dependency's version range resolves against.

Every change to the guard adds or changes a row in `tests/guard-cases.tsv` in the same commit, beside a row for the neighbouring decision that must not change; `scripts/redline-guard.sh` and `hooks/hooks.json` are changed by a person, never by a Redline run ([docs/guard.md](docs/guard.md), "Self-hosted"). Commits, PR bodies, comments and specs carry no AI attribution: Redline labels its own work as Redline, a tool name.
