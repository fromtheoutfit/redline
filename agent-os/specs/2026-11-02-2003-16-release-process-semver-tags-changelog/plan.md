# Spec: release process, semver in plugin.json, `redline--v` tags, update instructions, CHANGELOG (#16)

Spec folder: `agent-os/specs/2026-11-02-2003-16-release-process-semver-tags-changelog/`

Shaped by hand on 2026-11-02 with `/agent-os:shape-spec`; the person makes every commit. Issue #16 is the source of truth, read with the seven decisions in the shaping prompt and the one answered today.

## Context

`plugin.json` has said `0.1.0` since the extraction and nothing is tagged, so an install from the GitHub marketplace is "whatever `main` was", and a bug report cannot name a Redline. The issue asks for semver kept in sync between the manifest and the marketplace entry, a tag per release, a prose gate step that ties a version bump to every PR, install and update instructions that distinguish the GitHub marketplace from a development checkout, and a CHANGELOG. `v0.1.0` is cut by hand after this PR merges.

What the survey established (every item verified in this session, on Claude Code 2.1.316; the prompt said 2.1.312, this machine is four patches newer):

- **The marketplace entry's field is `version`**, on the plugin entry (`plugins[0].version`). `claude plugin tag --dry-run` names it as `plugins[0].version`, and `claude plugin validate` reports a disagreement as a warning: `plugins[0].version: Entry declares version "0.0.9" but .claude-plugin/plugin.json says "0.1.0". At install time, plugin.json wins`. Today's `marketplace.json` has no `version` on the entry.
- **Claude Code reads the manifest, not the tag, to resolve a version.** Plugin loading reference, "How Claude Code computes the version" (code.claude.com/docs/en/plugins/loading): "1. The `version` field in the plugin's manifest comes first 2. Then the `version` field in the plugin's marketplace entry 3. When neither is set, the version comes from the source type" (for a relative path inside a git-hosted marketplace, the commit SHA). "Users get a new copy only when the plugin's computed version differs from the one they have" (Host a marketplace, "Release a new version"). The `<plugin>--v<version>` tag is what a *dependency's* version range resolves against (Plugin dependencies, "Create a release tag": "Tag each release as `<plugin-name>--v<version>`, where `<version>` matches the `version` field in that commit's `plugin.json`"). So the bump in `plugin.json` on `main` is what moves users; the tag names the commit and serves dependency ranges. The issue's "Why" says Claude Code resolves versions against the tags; the spec records the correction.
- **`claude plugin tag` exists** in 2.1.316 (`claude plugin tag [options] [path]`, `--dry-run`, `--push`, `--remote`, `-m`, `-f`). Proven on a scratch clone: a `plugins[0].version` that disagrees with the manifest exits 1 (`Version mismatch: plugin.json says "0.1.0" but .claude-plugin/marketplace.json plugins[0].version says "0.0.9". plugin.json wins at install time, so update the marketplace entry to "0.1.0" (or remove it) before tagging`); an uncommitted change exits 1 (`Uncommitted changes affecting this release — commit them first ... (or use --force)`); an existing tag exits 1 (`Tag "redline--v0.1.0" already exists locally. Bump the version in plugin.json, or re-run with --force to move the tag`). It creates an annotated tag, `git tag -a redline--v0.1.0 -m "redline 0.1.0"`, then `git push origin refs/tags/redline--v0.1.0`. It does not check the branch: the README says `main`. The dry run on this checkout today: `Version: 0.1.0 (from plugin.json)`, `Tag: redline--v0.1.0`.
- **Auto-update is off** for every marketplace but Anthropic's (loading reference, "Which marketplaces and plugins auto-update": "off for every other marketplace"); a user turns it on under `/plugin` → Marketplaces → Enable auto-update, or updates with `claude plugin update redline@redline` (`Restart to apply changes`).
- **A marketplace is registered once per user**, in `~/.claude/plugins/known_marketplaces.json` ("There is one `known_marketplaces.json` per user, so a marketplace you add in one project is available in every project"). On this machine `redline` is a `directory` source at this checkout, and every set-up repository's `.claude/settings.json` (this one, Chalkboard, Losers League, Vestmark) already declares the GitHub source under `extraKnownMarketplaces`. Switching Losers League to the GitHub marketplace therefore switches the machine, and this checkout stops loading in place. A plugin loaded with `claude --plugin-dir <dir>` loads as `redline@inline`, "replaces a same-named installed marketplace plugin" silently, runs its hooks, and gets `CLAUDE_PLUGIN_ROOT` pointing at the directory, so the guard's self-hosted case (`scripts/redline-guard.sh:237-240`, `SELF_HOSTED` compares the repository with `CLAUDE_PLUGIN_ROOT`) holds.
- **The gate hash covers every backticked span in the gate section**, prose steps included (`scripts/redline-gate.sh` header, lines 26-29; the docs-gate standard records that adding step 10 moved the hash). A new prose step with backticks restamps `checks.sh` in the same commit. The stamp's `steps 1-9` range is the command steps and does not change.
- **Renumbering cost** of a separate step: the unattended section's two fill-ins (`--prose-steps "10, 11 and 12"`, `--retro-step 11`), the setup test's `SFILL` line (`tests/setup-test.sh:595`), `agent-os/standards/process/standards-retrospective.md` line 5 ("Gate step 11"), and the Tips line of `shape-spec.md` (line 351). Nothing else names 11 or 12 by number; the README names steps by title.
- 21 merged PRs on `main` (#5 to #64), plus five direct commits on 2026-10-20 before PR #5 (the extraction, the interrupt dial, the owners, the saved settings, the settings docs). No tags, locally or on `origin`. Issue #11 is closed; #10 landed as PR #59.

## Decisions

The prompt's seven, as given, plus one answered today and the calls made from the survey.

1. **Versioning** (prompt 1): semver in `.claude-plugin/plugin.json` `version` and in `.claude-plugin/marketplace.json` `plugins[0].version`, kept equal; `tests/setup-test.sh` gains the cases in Task 2. The manifest is what moves users; the tag names the release. Decided by: @michaelwitwicki.
2. **Tagging is a person's step** (prompt 2): `claude plugin tag --push` from the plugin root on `main` after the version-bumping merge; it validates the manifest, requires the two versions to agree, a clean tree and no existing tag (proven above). Nothing automates it; CI does not tag. Decided by: @michaelwitwicki.
3. **A separate gate step 11, "Version"**, between Docs (10) and the Standards retrospective (now 12); Spec folder becomes 13 (prompt 3's "either is fine"). Reason: the step has its own rule and its own standard file; folding it into Docs would retitle the step the README, the docs-gate standard and the unattended section's point 7 all name "Docs", which costs more edits than the renumbering, and the renumbering exercises the fill-in rerun #15 built. The step's text is in Task 3. Every PR bumps: minor for a change that alters what a setup rerun writes (with the template markers it touches bumped in the same PR), major for a contract change a rerun cannot carry, patch for anything else; the reviewer treats a missing bump as a nit. This PR is the exception: it keeps `0.1.0`, the first release, never tagged yet. Decided by: @michaelwitwicki (the rule), redline (separate step).
4. **CHANGELOG.md** (prompt 4): one `## <version>` heading per tagged version, newest first, one line per merged PR under three headings: Features, Fixes, Setup and templates (a rerun of `/redline:setup` carries them). Written by the person at tag time; a PR merged between tags goes under the next tagged version. The `0.1.0` entry is written by this spec (Task 5) with `(unreleased)` after the heading, which the tag checklist replaces with the tag date. The five direct commits before PR #5 get one leading line under Features, since they are what `0.1.0` is; strike it if a line per PR is the rule. The PR that lands this spec is added by the person at tag time, since its number is not known while shaping. Decided by: @michaelwitwicki (format), redline (the leading line, the unreleased marker).
5. **README Install** (prompt 5): the GitHub marketplace is the way to install; developing uses `claude --plugin-dir <checkout>` (today's answer, below); the local-directory marketplace paragraph stays as the fallback with the warning that it is registered once per user, so every repository on the machine then runs the checked-out branch. Upgrading gains the update paragraph: `claude plugin update redline@redline` or auto-update in `/plugin`, then restart or `/reload-plugins`; a plugin update replaces the plugin's files only, and the per-repository contract (the `checks.sh` template version, the allow list, the unattended section, the alias files) is carried by a rerun of `/redline:setup`, which the launch precheck names part by part. Decided by: @michaelwitwicki.
6. **`v0.1.0` is cut by hand after this PR merges** (prompt 6): the checklist is Task 8; the done-when test switches this machine to the GitHub marketplace and runs the precheck in Losers League (Chalkboard is frozen). Decided by: @michaelwitwicki.
7. **Docs gate applies; the Files table gains `CHANGELOG.md`** (prompt 7). Decided by: @michaelwitwicki.
8. **Development loads the checkout with `--plugin-dir`, and the precheck warns when the repository is the plugin but `CLAUDE_PLUGIN_ROOT` is not it** (answered today): once the machine's `redline` marketplace is the GitHub one, a session on this checkout (or on any repository that should run unreleased code) starts with `claude --plugin-dir /Users/michaelwitwicki/Code/Claude/redline`. `redline-setup.sh version <repoRoot>` gains `--plugin <dir>` (Task 4): when `<repoRoot>/.claude-plugin/plugin.json` names the same plugin as `<dir>`'s manifest and the two real paths differ, it warns `this repository is the plugin, but the run loads Redline from <dir>; start the session with claude --plugin-dir <repoRoot> to run this checkout's own code` and exits 1, a warning the skill says and goes on from, like the other three. The guard already approves `redline-setup.sh version` with any arguments for the main session (`scripts/redline-guard.sh:1083`), so no guard change; two `tests/guard-cases.tsv` rows pin it. Decided by: @michaelwitwicki.
9. **CI does not change**: `gate.yml` keeps `version .` (no `--plugin`; a runner has no plugin root) and gains no tag or changelog step; the version agreement is a setup-test case, so it runs inside the baseline. Decided by: redline.
10. **Standards carried**: `process/docs-gate`, `process/standards-retrospective`, `testing/tests`, `prompts/attribution`, `scripts/bash-conventions` (for `version --plugin`), `scripts/guard` (for the rows). Visuals: none. Product alignment: roadmap Phase 1 (the roadmap gains item 8, the release process, and its Open Item on the PR's own code is amended for `--plugin-dir`). Decided by: redline.

## Task 1: Save spec documentation

Create `agent-os/specs/2026-11-02-2003-16-release-process-semver-tags-changelog/` with `plan.md` (this plan, the Docs entries table, an As built section filled at the gate), `shape.md` (Scope, the Decisions above with the doc quotes and the dry-run output as evidence, Context, `## Standards retrospective (proposed)` from Task 7, Standards Applied), `standards.md` (the full text of the six standards as they read today), `references.md` (the loading, host-marketplace, dependencies and manifest reference pages; `scripts/redline-prefs.sh run check --plugin` as the pattern for `--plugin`; the #15 spec for the fill-in rerun). No `visuals/`.

## Task 2: The two versions agree, and a test says so

**Files:** `tests/setup-test.sh` (first), `.claude-plugin/marketplace.json`.

1. Cases, red first, in the "this checkout" block after line 807: `PV="$(jq -r .version "$PLUGIN/.claude-plugin/plugin.json")"`, `MV="$(jq -r '.plugins[0].version' "$PLUGIN/.claude-plugin/marketplace.json")"`; `check "plugin.json carries a semver version (#16)" grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$' <<<"$PV"` (as a plain test: `[[ "$PV" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]`); "the marketplace entry carries the same version" (`$MV == $PV`); the neighbour that must not change: "the marketplace entry's name is the manifest's name" (`plugins[0].name` equals `.name`). The header comment of the test gains the manifest cases in its list.
2. `marketplace.json`: `"version": "0.1.0"` on the entry, after `"name"`. `claude plugin validate .` still passes with the known icon warning; `claude plugin tag --dry-run .` prints `(version: 0.1.0)` beside the entry.
3. Green.

## Task 3: Gate step 11, Version

**Files:** `.claude/commands/agent-os/shape-spec.md`, `.claude/redline/checks.sh` (the stamp only, by `redline-gate.sh stamp`), `tests/setup-test.sh`, `agent-os/standards/process/standards-retrospective.md`.

1. Insert after step 10, Docs, in the Verification Gate list, and renumber Standards retrospective to 12 and Spec folder to 13; "Only after all twelve pass" becomes thirteen; the Tips line "The retrospective in gate step 11" becomes 12:

   > 11. **Version** — `.claude-plugin/plugin.json` carries the plugin's semver version and the entry in `.claude-plugin/marketplace.json` the same string; the setup test's last cases check they agree. Every PR bumps it: a change that alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body) bumps the minor version and, in the same PR, the markers it touches (`# redline-template: checks-template.sh vN`, `<!-- redline-unattended: vN -->`); a contract change a rerun cannot carry bumps the major version; any other change bumps the patch version. The reviewer treats a missing bump as a nit. The tag and the `CHANGELOG.md` entry are a person's step after the merge (`claude plugin tag --push` on `main`; see Contributing in the README).

2. The unattended section's fill-ins: `scripts/redline-setup.sh unattended .claude/commands/agent-os/shape-spec.md --gate-steps 1-9 --prose-steps "10, 11, 12 and 13" --retro-step 12 --no-pr-body --force` patches point 7's "Steps 10, 11 and 12 stay as written" and point 8's "Gate step 11's edits"; the hand edit "gate step 10, Docs" on point 7's line is kept (a fill-in patch touches the phrase only). `tests/setup-test.sh:595` `SFILL` becomes `--prose-steps "10, 11, 12 and 13" --retro-step 12`.
3. Restamp in the same commit: `scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh` (the new step's backticks move the hash; `steps 1-9` stays). `tests/gate-test.sh`'s last case and the setup test's regenerate-and-compare cases go green together.
4. `agent-os/standards/process/standards-retrospective.md` line 5: "Gate step 12".
5. The whole gate green: `.claude/redline/checks.sh --baseline`, then `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .` exit 0.

## Task 4: `version <repoRoot> --plugin <dir>`: the in-place warning

**Files:** `tests/setup-test.sh` (first), `scripts/redline-setup.sh` (`cmd_version`, header, `usage()`), `tests/guard-cases.tsv`, `skills/redline/SKILL.md`, `README.md`.

1. Cases, red first, in the `version <repoRoot>` block (`tests/setup-test.sh:755-`): on `$VR` (no `.claude-plugin/`) with `--plugin "$PLUGIN"` → exit 0, `.plugin` = `{self: false, inPlace: null, loadedFrom: "<dir>"}`; a copy of `$VR` with `.claude-plugin/plugin.json` `{"name": "redline"}` and `--plugin "$PLUGIN"` → exit 1, `.plugin.self` true, `.plugin.inPlace` false, stderr holds `claude --plugin-dir ` and the root's path; the same root with `--plugin` its own path → exit 0, `inPlace` true; a root whose manifest names `other` → `self` false, exit 0; no `--plugin` → `.plugin` = `{self: <bool>, inPlace: null, loadedFrom: null}` (every key present); `--plugin` without a value, or a `--plugin` pointing at a directory with no manifest → exit 2; the existing "version with two arguments: exit 2" case stands. Dogfood: `version "$PLUGIN" --plugin "$PLUGIN"` exits 0 beside line 814.
2. `cmd_version`: the root form parses `--plugin <dir>` after the root (the file form takes none); `version_plugin <root> <dir|null>` reads both manifests with `jq -r .name`, compares real paths (`cd && pwd -P`), prints the JSON and the one stderr line, returns 1 on the warning; the root form adds `plugin` to its object and folds the return into `rc` as the other three parts do. Header lines 34-40 and `usage()` gain the flag; the exit-code paragraph: unchanged.
3. `tests/guard-cases.tsv`: beside line 402, `-	allow	Bash	PLUGIN/scripts/redline-setup.sh version REPO/ --plugin PLUGIN/`; beside line 492, `redline:redline-checker	deny	Bash	PLUGIN/scripts/redline-setup.sh version REPO/ --plugin PLUGIN/`. No change to the guard script.
4. `skills/redline/SKILL.md` precheck step 1 (line 85): the call becomes `version <repoRoot> --plugin ${CLAUDE_PLUGIN_ROOT}` and the sentence "There are three kinds" gains the fourth: this repository is the plugin but the session loads Redline from elsewhere (start it with `claude --plugin-dir <repoRoot>`).
5. README: the `redline-setup.sh` table's `version` row; the "Template version" paragraph under `checks.sh` (the fourth line); the Files table's `skills/redline/SKILL.md` row ("prechecks ... and whether a self-hosted run loads in place").

## Task 5: `CHANGELOG.md`

**File:** `CHANGELOG.md` (new, at the root beside `README.md`).

Header: one paragraph saying what it is (one heading per tagged version, newest first; one line per merged PR; written by the person at tag time, see Contributing) and the three groups. Then the first entry; `(unreleased)` is replaced by the tag date in Task 8.

```
## 0.1.0 (unreleased)

The first release: Redline extracted from Chalkboard as a single-plugin marketplace, dogfooded on itself, Chalkboard, Losers League and Vestmark.

### Features
- Extracted from Chalkboard as a plugin, with the interrupt dial, finding scope and decision owners, saved launch settings and their docs (the commits before #5, 2026-10-20)
- #5 Set up this repository for Redline: Agent OS, the per-repo contract, and the guard's self-hosted case
- #34 Handle PRs over 100 files and number a fresh run after posted rounds (#33, #10)
- #37 Stop the run on a checker result the implementer cannot change (#9)
- #38 Revise from a human review: ingest a teammate's review comments as findings and fix them (#36)
- #41 Run a long gate in the background for the checker and the implementer (#40)
- #45 Resolve the threads Redline opened once their findings are settled, never a human's (#39)
- #46 Carry forward an earlier round's finding that has no disposition (#35)
- #47 CI: run the gate on every PR push, on Ubuntu and macOS, with stamp, version and clean-tree checks (#17)
- #51 Gate step 10, Docs: every spec names the README changes it needs (#13)
- #59 Resume a run that ended in error from the failed step (#10)
- #61 Check the shaper's spec folder and relaunch only from a typed `relaunch` (#57, #60)
- #NN Release process: semver in plugin.json, `redline--v` tags, update instructions, CHANGELOG (#16)   ← the person fills NN at tag time

### Fixes
- #8 Port the shared output budget into this repo's checks.sh (#7 R1-13, R1-14, R2-1)
- #43 Normalize every GitHub agent's error field with errorText (#42)
- #48 ci: make the shellcheck job required, no longer advisory
- #56 Override a checker's structural misread when the JSON it returned is well-formed (#55)

### Setup and templates (rerun /redline:setup to carry them)
- #7 Add the gate stamp so a launch refuses a drifted checks.sh (#6, first half)
- #12 Add /redline:setup: generate checks.sh from checks.json and dogfood it here (#6)
- #52 Per-repository ask rules: things a person is always brought in for, declared in the repository (#49); unattended template v3
- #54 Harden the guard: refuse wildcard write targets, vet read-only git, drop the imitable allow-list rules (#53, #50); checks template v2, ten allow entries retired
- #62 Print the checks.sh header as a person types it and bootstrap hand-written gates in read-checks (#18)
- #63 Add /redline and /redline-revise short alias commands (#44)
- #64 Version the unattended section, warn at launch, and merge template body changes on a rerun (#15)
```

## Task 6: README, and the roadmap

**Files:** `README.md`, `agent-os/product/roadmap.md`.

1. **Install**: keep the two commands and the `--scope project` paragraph; replace the local-checkout sentence with a "Developing the plugin" paragraph: `claude --plugin-dir /path/to/redline` from the checkout (or from any repository that should run unreleased code) loads it as `redline@inline` for that session, replacing the installed copy by name, with its hooks and `CLAUDE_PLUGIN_ROOT` from the checkout, so a Redline run on this repository runs the branch's own code; the launch precheck warns when this repository is reviewed without it. The local-directory marketplace (`claude plugin marketplace add /path/to/redline`) also loads in place, but a marketplace is registered once per user, so every repository on the machine then runs the checked-out branch, whatever it is; use it only on a machine with no other Redline repositories. Requirements: add 2.1.316 to the proven versions (`claude plugin tag`).
2. **Upgrading**: a first paragraph, "Updating the plugin": `claude plugin update redline@redline`, or Enable auto-update for the `redline` marketplace under `/plugin` → Marketplaces (off by default for a marketplace that is not Anthropic's), then restart or `/reload-plugins`; `claude plugin list` shows the installed version; an update replaces the plugin's files only, and the per-repository contract is carried by a rerun of `/redline:setup`, which the launch precheck names part by part (the existing paragraphs say which).
3. **Contributing**: a "Releases" paragraph: the Version gate step by title (every PR bumps; minor when a rerun must carry it, with the markers; patch otherwise; a missing bump is a nit); after the merge, on `main`, from the plugin root: `claude plugin tag --push` (validates, requires the two versions to agree, a clean tree and no such tag; `--dry-run` first), then the `CHANGELOG.md` entry from the merged PR titles since the previous tag, in the same commit as the next bump or on its own, and that Claude Code moves users on the manifest's version, not the tag.
4. **Files table**: a `CHANGELOG.md` row and a `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` row (the manifest and the single-entry marketplace; the two versions agree, gate step Version).
5. **Known limits**, "A run on this repository runs the PR's own code": only when the plugin loads in place (`--plugin-dir`, or the local-directory marketplace); from the GitHub marketplace a run here runs the cached release, and the precheck says so.
6. `agent-os/product/roadmap.md`: item 8, "Release process (#16)", and the Open Item on the PR's own code amended for `--plugin-dir`.

## Task 7: Verification Gate

Run `.claude/redline/checks.sh --baseline` until it exits 0 (gate steps 1 to 9), then `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .` (CI's two), `claude plugin tag --dry-run .` (exit 0, `Tag: redline--v0.1.0`), then the Docs step (the table below, each entry naming its task's commit or its reason), the Version step (this PR keeps `0.1.0`: the first release; recorded here as the exception) and the standards retrospective (the proposed edits below, presented with AskUserQuestion; approved ones in their own commit; else "Standards retrospective: no changes" in `shape.md`); `plan.md`'s As built records what was built and any deviation.

### Docs entries

| File | README section (and template) | Commit |
| --- | --- | --- |
| `.claude-plugin/marketplace.json` (the entry's `version`) | Contributing, "Releases"; Files table row | Task 2 / Task 6 |
| `.claude/commands/agent-os/shape-spec.md` (gate step 11) | Contributing, "Releases" (by title, never by number) | Task 3 / Task 6 |
| `scripts/redline-setup.sh` (`version --plugin`) | `redline-setup.sh` table `version` row; "Template version" under `checks.sh`; Install, "Developing the plugin" | Task 4 |
| `skills/redline/SKILL.md` (precheck step 1) | Files table `skills/redline/SKILL.md` row | Task 4 |
| `tests/guard-cases.tsv` | unchanged: as built, `version` takes no new argument (As built, 1) | – |
| `CHANGELOG.md` | Files table; Contributing, "Releases" | Task 5 / Task 6 |
| `.github/workflows/gate.yml` | unchanged (decision 9) | – |

### Standards retrospective (proposed)

- `agent-os/standards/process/release.md` (new; `index.yml` under `process`): the version rule (every PR bumps; minor with the markers when a rerun must carry it; major for a contract change a rerun cannot carry; patch otherwise; a missing bump is a nit); the two versions agree and the setup test proves it; `claude plugin tag --push` on `main` is a person's step, never CI's; the CHANGELOG is written at tag time, one line per PR, three groups; Claude Code moves users on the manifest, not the tag (loading reference); a marketplace is per user, development is `--plugin-dir`, and the precheck warns (#16).
- `agent-os/standards/process/docs-gate.md`, the step-number bullet: add "(#16 moved the retrospective from 11 to 12)".
- `agent-os/standards/process/standards-retrospective.md` line 5: "Gate step 12" (applied in Task 3, since the gate text moves there; recorded here).
- `agent-os/standards/testing/tests.md`, the setup-test bullet: the manifest and entry versions agree and are semver, and `version <repoRoot> --plugin <dir>` warns off a self-hosted root that does not load in place (#16).

## Task 8: Cut `v0.1.0` (by hand, after this PR merges)

1. On `main`, clean, at the merge: `claude plugin tag --dry-run .` shows `Version: 0.1.0 (from plugin.json)`, `(version: 0.1.0)` on the entry, `Tag: redline--v0.1.0`.
2. `CHANGELOG.md`: `## 0.1.0 (unreleased)` → `## 0.1.0 (<today>)`, the `#NN` line filled; commit `redline: CHANGELOG for 0.1.0`. (The tag then points at this commit.)
3. `claude plugin tag --push` from the plugin root; `git ls-remote --tags origin` lists `redline--v0.1.0`.
4. Switch the machine's marketplace: `claude plugin marketplace remove redline` (removes the marketplace and its installs), `claude plugin marketplace add fromtheoutfit/redline`, then in `/Users/michaelwitwicki/Code/Sites/loser`: `claude plugin install redline@redline --scope project` (its `settings.json` already carries the GitHub source and `redline@redline: true`, so the file should not change: `git status` clean). `claude plugin list` there shows `redline@redline`, `Version: 0.1.0`, no `Read from:` line; a session there runs `/redline:setup`'s step 13 verify, or the launch precheck on an open PR in a dry run, with no warning.
5. From this checkout: `claude --plugin-dir /Users/michaelwitwicki/Code/Claude/redline`, then `${CLAUDE_PLUGIN_ROOT}/scripts/redline-setup.sh version . --plugin ${CLAUDE_PLUGIN_ROOT}` exits 0; without `--plugin-dir` the same call warns with the `claude --plugin-dir` line.
6. Record the result under As built in `plan.md` (a follow-up commit on `main`, or in the next PR), and update the user settings' `extraKnownMarketplaces.redline` to the GitHub source if the add did not.

## Verification (end to end)

- `tests/setup-test.sh` red before Tasks 2 and 4, green after; `tests/gate-test.sh` green after the restamp; `tests/guard-test.sh` green with the two rows.
- `.claude/redline/checks.sh --baseline` exits 0; `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .` exit 0; `claude plugin validate .` passes with the icon warning only; `claude plugin tag --dry-run .` exits 0.
- A dry-run launch on this PR's branch with `claude --plugin-dir` set runs the precheck with no in-place warning; without it, the warning line appears and the launch goes on.
- Task 8's checklist is the done-when: `claude plugin list` in Losers League shows `0.1.0` from the GitHub marketplace.

## As built

Built on 2026-11-02 by hand from this plan; the person makes the commits. Deviations:

1. **No `--plugin <dir>` flag** (Task 4, decision 8). The skill runs `redline-setup.sh` by `${CLAUDE_PLUGIN_ROOT}`, so the script's own root (`PLUGIN_ROOT`, line 143) is the copy the session loaded, and `version <repoRoot>` reports `plugin: {self, inPlace, pluginRoot}` without being told where it runs from: `self` when the root's `plugin.json` names the same plugin as the script's own manifest, `inPlace` when the two real paths are one directory (`null` unless `self`). A flag could be passed wrong; the script's path cannot. So no guard rows (no new argument), the skill's call is unchanged, and CI's `version .` reports `inPlace: true` from the checkout. The setup test's cases: a root that is not the plugin, a self-hosted root at another path (exit 1, the stderr line naming the loaded copy and `claude --plugin-dir <root>`), a root that is another plugin, a root manifest that is not JSON (exit 2), and this checkout (`self` and `inPlace` true).
2. **The test's fixture path**: `TMPDIR` ends in a slash on macOS, so `$WORK/selfroot` carries a double slash the script's `cd && pwd` normalises; the stderr case compares against the normalised path.
   A first fix put a trailing comment on that line and swallowed the manifest write after it; the setup check went red in the baseline and the fix moved the comment to its own line. Nothing learned about the tooling; the harness caught it.
3. Task 3's fill-in patch touched point 7 and point 8 of the unattended section as planned; the stamp moved from `a7ef5783…` to `a6972391…`.

Docs entries: every row above names its section; the commits are the person's, one per task, titled at commit time.

Gate: `.claude/redline/checks.sh --baseline` exit 0 (see the gate run recorded in the shaping session); `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .` exit 0; `claude plugin validate .` passes with the icon warning; `claude plugin tag --dry-run .` exits 1 on the uncommitted tree (`Uncommitted changes affecting this release`, the check working as designed) and 0 once the tree is committed, with `(version: 0.1.0)` on the entry.
