# Release process: semver, `redline--v` tags, update instructions, CHANGELOG (#16) — Shaping Notes

## Scope

Issue #16, the source of truth, read with the seven decisions in the shaping prompt and one answered on 2026-11-02. Semver in `.claude-plugin/plugin.json` and the marketplace entry, kept equal and tested; `claude plugin tag --push` as a person's step after a version-bumping merge; a prose gate step, Version, beside Docs, that ties a bump to every PR; `CHANGELOG.md` with the `0.1.0` entry from the merged PR titles; the README's Install, Upgrading and Contributing sections rewritten for the GitHub marketplace, `--plugin-dir` development and plugin updates; a launch precheck warning when this repository is reviewed from a copy that is not the checkout; and the checklist that cuts `v0.1.0` by hand after the PR merges. Not in scope: CI tagging, changelog generation, a release on the Anthropic directory.

## Decisions

See `plan.md`, "Decisions" (ten entries, each with its owner). The evidence behind the two the prompt asked to verify:

**What the marketplace entry's version field is called, and what Claude Code reads.** The field is `version` on the plugin entry, `plugins[0].version`. Three sources, all read on 2026-11-02 on Claude Code 2.1.316:

- Plugin loading reference, "How Claude Code computes the version" (https://code.claude.com/docs/en/plugins/loading#versions-and-updates): "1. The `version` field in the plugin's manifest comes first 2. Then the `version` field in the plugin's marketplace entry 3. When neither is set, the version comes from the source type" (a relative path inside a git-hosted marketplace: "The commit SHA of the installed directory"). And: "Because the manifest comes first, a manifest that pins `"version": "1.0.0"` keeps every user on the cached copy until its author changes the string, however many commits they push."
- Host a marketplace, "Release a new version" (https://code.claude.com/docs/en/plugins/host-marketplace#keep-users-up-to-date): "Users get a new copy only when the plugin's computed version differs from the one they have. That version comes from `plugin.json` first, then from the marketplace entry". "Don't set `version` in both `plugin.json` and the marketplace entry. If you do, Claude Code uses the `plugin.json` value without warning, and `claude plugin validate` reports the mismatch". We set both and keep them equal, which is what `claude plugin tag` checks; the validate warning fires only on a disagreement (proven below).
- Plugin dependencies, "Create a release tag" (https://code.claude.com/docs/en/plugins/dependencies#release-a-plugin-that-others-depend-on): "Tag each release as `<plugin-name>--v<version>`, where `<version>` matches the `version` field in that commit's `plugin.json`." A dependency's "constraint resolves against git tags on the repository that hosts the plugin". The tag is not what `claude plugin update` reads for an ordinary install.

So Claude Code reads the manifest to resolve a version; the tag names the release commit and serves dependency ranges. The issue's "Why" ("Claude Code resolves plugin versions against git tags") is corrected by this record.

**`claude plugin tag` exists and what it requires.** `claude --version` is 2.1.316 on this machine (the prompt said 2.1.312). `claude plugin tag --help`: "Create a {name}--v{version} git tag for a plugin release, validating that plugin.json and any enclosing marketplace entry agree", with `--dry-run`, `-f, --force` ("Skip the dirty-working-tree and tag-already-exists checks"), `-m`, `--push`, `--remote`. Proven on a scratch clone of this repository:

- entry `version` `0.0.9` against manifest `0.1.0`: exit 1, `Version mismatch: plugin.json says "0.1.0" but .claude-plugin/marketplace.json plugins[0].version says "0.0.9". plugin.json wins at install time, so update the marketplace entry to "0.1.0" (or remove it) before tagging.` `claude plugin validate .` on the same tree: `plugins[0].version: Entry declares version "0.0.9" but .claude-plugin/plugin.json says "0.1.0". At install time, plugin.json wins (calculatePluginVersion precedence) — the entry version is silently ignored.` as a warning (`--strict` exits 1).
- equal versions: exit 0, `Marketplace entry: plugins[0] in .../marketplace.json (version: 0.1.0)`, `Tag: redline--v0.1.0`, and the two commands it would run: `git tag -a redline--v0.1.0 -m "redline 0.1.0"`, `git push origin refs/tags/redline--v0.1.0`.
- an uncommitted change to `README.md`: exit 1, `Uncommitted changes affecting this release — commit them first so the tag points at the version you intend to release (or use --force):   README.md`.
- the tag already present: exit 1, `Tag "redline--v0.1.0" already exists locally. Bump the version in plugin.json, or re-run with --force to move the tag.`
- on a branch other than `main`: no check; the README says `main`.
- on this checkout, with no entry version yet: `Version: 0.1.0 (from plugin.json)`, `Marketplace entry: plugins[0]`, `Tag: redline--v0.1.0`.

**A marketplace is registered once per user** (loading reference, "Check which stage a plugin reached": "There is one `known_marketplaces.json` per user, so a marketplace you add in one project is available in every project"). `~/.claude/plugins/known_marketplaces.json` on this machine: `redline` is `{"source": "directory", "path": "/Users/michaelwitwicki/Code/Claude/redline"}`; `claude plugin list` shows `redline@redline 0.1.0, Read from: /Users/michaelwitwicki/Code/Claude/redline` at project scope for this checkout, Chalkboard and Losers League; every set-up repository's `.claude/settings.json` already declares the GitHub source. Hence decision 8: switching Losers League switches the machine, and development uses `claude --plugin-dir <checkout>` ("An enabled `--plugin-dir` ... plugin ... replaces a same-named installed marketplace plugin ... silently", loading reference, "Name conflicts"; `${CLAUDE_PLUGIN_ROOT}` then points at the directory, so `SELF_HOSTED` in `scripts/redline-guard.sh:240` holds).

**Auto-update** (loading reference, "Which marketplaces and plugins auto-update"): the default is "off for every other marketplace" than Anthropic's; a user turns it on under `/plugin` → Marketplaces, or runs `claude plugin update redline@redline` ("restart required to apply", `claude plugin update --help`).

**Deviation (as built), decided by: @michaelwitwicki (shaping session, 2026-11-02):** `version <repoRoot>` takes no `--plugin` flag; the script's own root is the copy the session loaded, since the skill runs it by `${CLAUDE_PLUGIN_ROOT}`. See `plan.md`, As built.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** roadmap Phase 1, dogfood; item 6 (a second machine) stays open, since the done-when test runs on this machine against the GitHub marketplace, not on a machine that never saw the checkout. The roadmap gains item 8 (the release process) and its Open Item on the PR's own code is amended for `--plugin-dir`.
- 21 merged PRs (#5 to #64) and five direct commits on 2026-10-20 before PR #5 make up `0.1.0`; no tag exists locally or on `origin`.

## Standards retrospective

Proposed under `plan.md`, Task 7, and presented with AskUserQuestion at the gate on 2026-11-02; approved as proposed, decided by: @michaelwitwicki. Applied, for their own commit: `agent-os/standards/process/release.md` (new, indexed), the step-number parenthetical in `process/docs-gate.md`, the setup-test sentence in `testing/tests.md`; `process/standards-retrospective.md`'s step number landed earlier in commit a128ce4. Items reviewed: the ten decisions (release.md carries 1, 2, 3, 4, 8 and 9; 5, 6, 7 and 10 are already in docs-gate, attribution and the README), the As built deviation (release.md's last bullet), and the one red run (the swallowed test line: nothing about the tooling, the harness caught it).

## Standards Applied

- process/docs-gate — the spec touches `.claude-plugin/`, `scripts/`, `skills/` and `tests/guard-cases.tsv`; every file names its README section or its reason
- process/standards-retrospective — the gate step moves from 11 to 12; the retrospective proposes a release standard
- testing/tests — the setup test gains the manifest cases and the `--plugin` cases, red first; the guard table gains two rows
- prompts/attribution — the CHANGELOG, the README and the spec name Redline only
- scripts/bash-conventions — `version <repoRoot> --plugin <dir>`: one JSON object on stdout, warnings on stderr, usage errors exit 2, every key present
- scripts/guard — the two rows pin the main session's allow and the checker's deny for the new argument; the guard script itself does not change
