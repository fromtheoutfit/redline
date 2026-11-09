# Inline-session auto-mode warning (#76): Shaping Notes

## Scope

Issue #76, as narrowed by its two Nov 9 comments. The "no verdict" refusals in auto mode and the accept-edits prompts on role writes happen only in a session that loads the plugin with `--plugin-dir`; the installed release runs clean. Redline cannot change the harness, so the launch tells the person before a run fails.

In scope: `skills/redline/SKILL.md`, `docs/running.md`, `CONTRIBUTING.md`, a standards bullet, and a CHANGELOG line once the PR number exists. The "Meanwhile" section of the issue body is withdrawn. The upstream report is a separate, non-blocking task tracked in the issue.

## Decisions

Given at the start of shaping:

1. No change to `templates/settings.allow.json`, `redline-setup.sh`, `--remove-stale`, the guard, `hooks.json` or `tests/guard-cases.tsv`.
2. The warning lives in the precheck, beside the #16 warning for the inverse case. It is one paragraph, a warning and never a stop, because the skill cannot read the permission mode.
3. `docs/running.md` and `CONTRIBUTING.md` carry the same sentence. The standards record the harness fact and the probe that proved it.
4. **This spec keeps the version on purpose.** 0.2.0 is undated and untagged (`git tag` lists only `redline--v0.1.0`), so this change rides in it. The CHANGELOG gets a Fixes line under 0.2.0 once the PR number exists.
5. Done when an inline session shows the warning at launch and an installed-release session does not, `tests/prefs-test.sh` passes and the guard cases are unchanged.

Asked during shaping:

6. **A resume warns too.** Section 2's resume skips the precheck, and the failure this warns about ends as a resumable error at `post r<n>`, so someone resuming in auto mode would hit the same refusal unwarned. A hand-off relaunch stays silent: same session, already said.
7. **The wording is widened to "fails at its first file write, normally its first post".** On Nov 6, in an inline session, the launcher's own Write of `snapshot-start.json` was refused twice and no run started. The Nov 9 probe's result for the main session does not explain that. The standard carries the same clause.
8. **The negative half of the done rule is split.** Before the merge: the inline walk and the path check. After the 0.2.0 tag: one real installed-release session, the last item before #76 closes. The only installed release today is 0.1.0, which has no warning code and would pass vacuously.

Settled from the code:

9. **The condition is that `${CLAUDE_PLUGIN_ROOT}` does not contain `/plugins/cache/`.** An install lives at `<config dir>/plugins/cache/<marketplace>/redline/<version>`. The test covers the repository itself and any other outside path, the local-directory marketplace included. The probe did not cover that marketplace; a false warning there costs a line and stops nothing.
10. **The skill reads the variable, not `plugin.pluginRoot`.** A resume never calls `redline-setup.sh version`, so one test serves both places with no extra call. `/redline:redline-review` and `/redline:redline-revise` read this file and state that the variable is their root, and their precheck is this one, so they get the warning unchanged.
11. **The harness fact goes in `process/release.md`,** after the bullets on loading the checkout with `--plugin-dir` and on the precheck's warning.

## Standards retrospective

Every decision above was classified. The version exception and `--plugin-dir` loading are already in `process/release.md`, and the Docs entry follows `process/docs-gate.md`. No check went red during the build, and no pattern was invented. Missing: the harness fact and its probe, added as one bullet at the end of `process/release.md`, approved at the gate, in its own commit. No heading changed.

## Open after the gate

- One installed-release session after the 0.2.0 tag shows no warning; then #76 closes.
- The upstream report, tracked in the issue.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** "Honest about its reach" in `agent-os/product/mission.md`; no conflict.

## Standards Applied

- process/release: the version rule and its "keeps the version on purpose" exception, and where the `--plugin-dir` fact belongs.
- process/docs-gate: the skill change names `docs/running.md`, "Precheck".
- process/standards-retrospective: the harness fact lands in its own commit.
- prompts/attribution: nothing this change adds carries an attribution marker.
