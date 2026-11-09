# #76: warn in a `--plugin-dir` session that auto mode refuses the roles' file writes

## Context

Issue #76 first read as a Claude Code regression that hit every run. Its Nov 9 comments narrow it: the "no verdict" refusals and the accept-edits prompts on role writes happen only in a session that loads the plugin with `--plugin-dir`. The installed release runs clean. That leaves the plugin's own self-review, the one repository that runs inline. Redline cannot fix the harness, so the launch tells the person before the run fails. The "Meanwhile" section of the issue body (template rules) is withdrawn; the upstream report is a separate, non-blocking task tracked in the issue.

## Decisions

From the invocation:

1. Scope is `skills/redline/SKILL.md`, docs and standards. No change to `templates/settings.allow.json`, `redline-setup.sh`, `--remove-stale`, the guard, `hooks.json` or `tests/guard-cases.tsv`.
2. The warning lives in the precheck, beside the #16 warning. It is one paragraph, a warning and never a stop, because the skill cannot read the permission mode.
3. `docs/running.md` and `CONTRIBUTING.md` carry the same sentence. The standards record the harness fact and the probe.
4. No version bump: 0.2.0 is undated and untagged (`git tag` lists only `redline--v0.1.0`), so this rides in it. `shape.md` says the spec keeps the version on purpose, which is the exception the reviewer's Version bullet and `process/release.md` name. CHANGELOG gets a Fixes line under 0.2.0 once the PR number exists.

From the questions:

5. **A resume warns too.** Section 2's resume skips the precheck, and the failure ends as a resumable error at `post r<n>`. A hand-off relaunch stays silent: same session, already said.
6. **The wording is widened.** The run "fails at its first file write, normally its first post". Project memory records a launcher Write of `snapshot-start.json` refused twice on Nov 6 in an inline session, which the Nov 9 probe's "main session passes" does not explain. The standard carries the same clause.
7. **Done rule, negative half.** Before the merge: the inline walk plus the path check. After the 0.2.0 tag: one real installed-release session, the last item before #76 closes, because 0.1.0 has no warning code and would pass vacuously.

Settled from the code:

- **Condition:** `${CLAUDE_PLUGIN_ROOT}` does not contain `/plugins/cache/`. An install is `<config dir>/plugins/cache/<marketplace>/redline/<version>` (seen in `installed_plugins.json`). The test covers the repository itself and any other outside path, the local-directory marketplace included; the probe did not cover that case, and a false warning there costs nothing.
- **Read the variable, not `plugin.pluginRoot`.** A resume never calls `redline-setup.sh version`, so one test serves both places with no extra call. `/redline:redline-review` and `/redline:redline-revise` read this file and state that the variable is their root, and their precheck is this one, so they get the warning unchanged.
- **Standards home:** `process/release.md`, after the `--plugin-dir` and precheck-warning bullets (lines 10 and 11).
- **Shaping defaults:** no visuals. Product alignment: "Honest about its reach" in the mission, no conflict. Standards applied: `process/release`, `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`.

## Task 1: Save spec documentation

Create `agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/` with `plan.md`, `shape.md` (scope, the decisions above, "keeps the version on purpose", the post-tag walk as an open item), `standards.md` (the four standards in full) and `references.md` (the #16 warning at `skills/redline/SKILL.md:86`, `redline-setup.sh` `version_plugin`, the Nov 9 comments by link; no copied text from `redline-internal`).

## Task 2: Warn in the launch skill

`skills/redline/SKILL.md`:

- **Section 4, step 1.** After the `redline-setup.sh version` paragraph, add a paragraph headed **Inline session**: when `${CLAUDE_PLUGIN_ROOT}` does not contain `/plugins/cache/`, the session loads Redline from a directory rather than an installed release; say the paragraph below whatever else the step warned, then go on. A warning, never a stop, in every permission mode, since the skill cannot read the mode.

  > This session loads Redline from `<root>`, not an installed release. In auto mode, Claude Code refuses the Redline agents' file writes with no verdict, and the run fails at its first file write, normally its first post. Run this session in accept-edits and approve each prompt, or in bypass-permissions (#76).

- **Section 2, Resume.** On `run check` exit 0, before relaunching: say the Inline session paragraph (section 4, step 1) under the same condition, because a resume skips the precheck. A hand-off relaunch does not repeat it.

Docs entry (gate step 10): `skills/redline/SKILL.md` → `docs/running.md`, "Precheck"; this task updates it, in the same commit.

- `docs/running.md`, "Precheck", the paragraph at line 30: end it with a sentence on the session that loads the plugin with `claude --plugin-dir`, said on a fresh launch and on a resume, using the core sentence below.
- `CONTRIBUTING.md`, "Developing the plugin", after "edits take effect at the next session start.": the core sentence, plus that an installed release runs clean.

Core sentence: "In auto mode Claude Code refuses the Redline agents' file writes with no verdict, and the run fails at its first file write, normally its first post; run such a session in accept-edits and approve each prompt, or in bypass-permissions (#76)."

No script header moves, so `docs/scripts.md` is untouched. The README's Known limits bullet and `docs/guard.md` "Self-hosted" stay as they are (decision 3 names two files). `docs/contract.md` describes `redline-setup.sh version`, which does not change.

## Task 3: CHANGELOG line, once the PR number exists

The PR does not exist during the build. After you open it, add a new `### Fixes` group between Features and Setup and templates under `## 0.2.0`:

`- #<PR> A session that loads the plugin with --plugin-dir warns at launch that auto mode refuses the roles' file writes (#76)`

## Task 4: Verification Gate

1. **Steps 1 to 9:** `.claude/redline/checks.sh --baseline` exits 0. `tests/prefs-test.sh` is one of them; no test reads `SKILL.md`, so it shows only that nothing else moved.
2. **Unchanged files:** `git diff --stat -- tests/guard-cases.tsv scripts/redline-guard.sh hooks/hooks.json templates/settings.allow.json scripts/redline-setup.sh` prints nothing.
3. **Step 10, Docs:** the entry above names its commit.
4. **Step 11, Version:** kept on purpose (decision 4); the two manifests still agree.
5. **Inline walk (you, in a new session):** `claude --plugin-dir ~/Code/Claude/redline` from this checkout, then `/redline:redline 80 dry run review only`. The warning appears at precheck step 1, then the launch stops at step 3 with `check out <branch>`, since PR 80's branch is not this one. It posts and launches nothing; the settings step may update the ignored `.claude/redline.local.json`.
6. **Path check (read-only):** `scripts/redline-setup.sh version .` prints `plugin.pluginRoot` as the checkout, and the cached `0.1.0` copy's script prints a path under `/plugins/cache/`. Both values were already seen during shaping.
7. **Resume path:** confirmed by reading the bullet. Walking it needs a stopped run's marker; recorded as not walked.
8. **Step 12, Standards retrospective:** propose this bullet for `process/release.md`, after the existing line 11, then ask apply, adjust or none. Approved edits go in their own commit:

   > Under `claude --plugin-dir` a subagent's `Write` is refused in auto mode with no verdict, and in accept-edits it prompts despite a matching allow rule; an installed release is clean. The probe, on Claude Code 2.1.319: a project subagent with `tools: Write` asked to write one word, same checkout, same mode, refused under `--plugin-dir` and written under plain `claude`. The main session's own Writes passed in both, and allow rules are not consulted for a subagent's write in either mode. One launcher Write of `snapshot-start.json` was refused in an inline session on Nov 6, unexplained, so a run fails at its first file write, normally its first post. The launch skill says so when `${CLAUDE_PLUGIN_ROOT}` is outside `/plugins/cache/`, on a fresh launch and on a resume, a warning and never a stop since a skill cannot read the permission mode (#76)

9. **Step 13, Spec folder:** `plan.md` as built; deviations under Decisions in `shape.md`.

**Open after the gate:** one installed-release session after the 0.2.0 tag shows no warning, then #76 closes. The upstream report stays tracked in the issue.

## Commits (yours; nothing is staged)

1. The spec folder.
2. `skills/redline/SKILL.md`, `docs/running.md`, `CONTRIBUTING.md`.
3. `agent-os/standards/process/release.md`, on its own.
4. `CHANGELOG.md`, once the PR number exists.

## As built

Built as shaped, with no deviation.

- Tasks 1 and 2 are done, and the standards bullet is applied as drafted.
- Task 3 waits for the PR number.
- Gate steps 1 to 9 passed, the unchanged-files check printed nothing, and the path check read the checkout and a path under `/plugins/cache/`.
- Docs (gate step 10): `skills/redline/SKILL.md` is described in `docs/running.md`, "Precheck", updated in the skill's commit.
- Version (gate step 11): kept at 0.2.0 on purpose; both manifests agree.
- Not walked yet: the inline session (the person's step) and the resume path (needs a stopped run's marker; confirmed by reading the bullet). The installed-release session waits for the 0.2.0 tag.
