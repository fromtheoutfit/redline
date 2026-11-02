# Short aliases `/redline` and `/redline-revise` (#44) — Shaping Notes

## Scope

Issue #44, read with the six decisions in the shaping prompt and the five answered on 2026-11-02: two project command files, `.claude/commands/redline.md` and `.claude/commands/redline-revise.md`, written verbatim by `/redline:setup` (a new step 12) from `templates/command-redline.md` and `templates/command-redline-revise.md` through a new `redline-setup.sh command` subcommand; a rerun reports a file as `unchanged`, `differs` (diff shown, asked) or `foreign` (no marker line, left alone); the files are ordinary repository content, not guarded; pass-through from a project command to the plugin skill was proven live before anything else was built; setup-test cases for the write, the drift-free rerun, the changed-file rerun and the foreign-file skip; this repository gets the two files; the README's "Use" block shows the short form first and says where it comes from; the relaunch rule and `RUN_LINE` name the short form, with the loop check moved first. The person makes every commit.

## Decisions

The prompt's six, as given, plus five answered on 2026-11-02 and the calls made from the survey.

1. **Two project command files written by setup from templates** (prompt 1): `templates/command-redline.md` and `templates/command-redline-revise.md`, written verbatim to `<repoRoot>/.claude/commands/redline.md` and `redline-revise.md`. No substitution: the template is the file, so "drift-free" is byte-equality. Decided by: @michaelwitwicki.
2. **File shape** (answered today): frontmatter (`description`, `argument-hint` copied from the skill's, `disable-model-invocation: true`, so the model never starts a run on its own, as the plugin skill already says), then the marker line, an HTML comment `<!-- redline-alias: written by /redline:setup from the Redline plugin's templates/command-redline.md; a rerun compares this file with the template, so a change here is drift -->`, then the one-line body: "The person typed `/redline $ARGUMENTS`. Invoke the `redline:redline` skill with the arguments `$ARGUMENTS`, exactly as if they had typed `/redline:redline $ARGUMENTS`, and follow it." The revise file says `redline:redline-revise`. Decided by: @michaelwitwicki.
3. **Setup asks once, default yes; a rerun compares** (prompt 2): identical is drift-free; different shows the diff and asks; a file of the same name with no marker line is a person's own command, left alone and reported. Decided by: @michaelwitwicki.
4. **Step placement** (answered today): a new step **12, Short aliases**, after CLAUDE.md (11); Verify becomes 13, Hand back 14; the skill and the README say fourteen steps. Decided by: @michaelwitwicki.
5. **One file per call** (answered today): `redline-setup.sh command <repoRoot> <redline|redline-revise> [--force] [--dry-run]`, so a yes on one file never overwrites the other. Decided by: @michaelwitwicki.
6. **Ordinary repository files** (prompt 3): not under `.claude/redline/`, not protected by the guard; no guard change, two `tests/guard-cases.tsv` rows pin the decision beside its neighbours. Decided by: @michaelwitwicki.
7. **Verify first** (prompt 4, method answered today): the templates are copied into this checkout and two headless runs (`claude -p`) prove the words reach the skill; the person then types the two lines in a fresh session before the commit. If either headless run does not reach the skill with the words intact, the build stops and says so. Decided by: @michaelwitwicki.
8. **The relaunch rule and `RUN_LINE` accept the alias forms, with a test** (answered today): the skill's section 7 and the workflow's `RUN_LINE` name `/redline <pr> ...` and `/redline-revise ...` beside the namespaced form; the loop check that pins the sentence is updated first and seen red. Decided by: @michaelwitwicki.
9. **Setup-test cases** (prompt 5): write, drift-free rerun, changed-file rerun, foreign-file skip, plus `--dry-run`, a bad name, and a last case proving this checkout's two files equal the templates. Decided by: @michaelwitwicki.
10. **This repository gets the two files** (prompt 6), under `.claude/commands/`, committed. Decided by: @michaelwitwicki.
11. **README** (answered today): the "Use" block starts with the short forms and keeps the namespaced lines; one sentence after it says where the short forms come from and that the namespaced form always works. No new "Quick start" heading. Decided by: @michaelwitwicki.
12. **Standards carried** (answered today): `scripts/bash-conventions`, `testing/tests`, `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`, `workflow/replay`, `scripts/guard`. Visuals: none. Decided by: @michaelwitwicki.
13. **Line endings** (from the survey): the alias file is Redline's own, written verbatim; a CRLF copy reads as `differs` and is shown as a diff, never rewritten in place. A foreign file is never touched, whatever its endings. Decided by: redline (shaping).
14. **Standards retrospective: applied** (2026-11-02): the three edits under "Standards retrospective (proposed)" below, in their own commit. Decided by: @michaelwitwicki.
15. **As built, no deviation from the plan** (see `plan.md`, As built): the headless verification passed on the first run; the guard rows were inserted at both anchors, since the `shape-spec.md` write row also appears in the self-hosted `# @cwd PLUGIN` block, where the alias row is repeated. Decided by: redline.

## Context


Plugin commands are namespaced, so the shortest launch today is `/redline:redline <pr>`. Issue #44 asks for a one-file project command that aliases it, `.claude/commands/redline.md` whose body runs `/redline:redline $ARGUMENTS`, and likewise `redline-revise.md`; `/redline:setup` offers to write both (default yes); the README shows the short form and says where it comes from; a setup rerun treats an existing alias file as drift-free when its body matches.

What the survey established (read only):

- **Claude Code renders `$ARGUMENTS` before the model sees a command body, and a slash command written inside a body is not expanded** (docs: a name typed mid-message "gives Claude permission to run the skill but doesn't run it"; direct execution happens only at the start of the person's message). So the alias body must get the model to invoke the `redline:redline` skill through the Skill tool with the arguments. Command files support the skills' frontmatter minus `name` and `paths` (`description`, `argument-hint`, `disable-model-invocation`, …); a plugin skill and a project command of the same bare name coexist because plugin skills are namespaced (`/redline` beside `/redline:redline`, `/redline:setup`). No documented precedent for a project command aliasing a plugin command, which is why decision 4 (verify first) stands.
- **The relaunch rule names the command form.** `skills/redline/SKILL.md:211` relaunches only from `relaunch` or "a line holding only a Redline command (`/redline:redline <n> ...` or a variant)"; `workflows/redline-loop.js:261` (`RUN_LINE`) tells every agent that such a line is conversational, and `tests/loop-test.mjs:1230` pins that sentence in every prompt. With the alias, the person's last typed line is `/redline 21`, so both texts name the short form too, and the loop check moves with it (red first).
- **The guard already treats `.claude/commands/` as ordinary content** (`scripts/redline-guard.sh:94`; `PROTECTED_FILES` at `:233` names only `.claude/agents|workflows|skills/redline*`), and `tests/guard-cases.tsv:186` pins a write to `.claude/commands/agent-os/shape-spec.md` as allowed to the implementer. Decision 3 (not guarded) needs no guard change; two rows pin it. `redline-setup.sh` is the skill's: every role is refused (`:474-481`), the main session is `inert` for every writing subcommand (`:396`).
- **The setup skill has thirteen numbered steps** (`skills/setup/SKILL.md:11`, README `:146`); step 11 is CLAUDE.md, 12 Verify, 13 Hand back. The inventory in step 1.5 lists what a rerun must find first. The script's pattern for a compared file is `unattended`: `changed: false` when equal, exit 1 with `differs` when not, `--force` to overwrite, `--dry-run` everywhere.
- **The README has no "Quick start"**: the examples are the block under "Use" (`README.md:55-65`); "Set up a repository" is a numbered list whose items 7 and 8 are Verify and Dry run; the Files table has one `templates/` row and the `skills/setup/SKILL.md` row saying "thirteen steps"; the `redline-setup.sh` table lists one row per subcommand.
- **Two safe lines prove pass-through without starting a run**: `/redline 62 bogus` stops at the grammar (`skills/redline/SKILL.md:35`: "A word that fits none of these stops the launch with one line naming it"), and `/redline-revise 62 review` stops because `review` has no selector (`skills/redline-revise/SKILL.md:13`). Both run before any `gh` call.

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md` says "One command, `/redline:redline <pr>`"; the alias shortens the typing and changes nothing about the run. Nothing else bears.

## Standards retrospective (proposed)

Approved with `AskUserQuestion` at the gate and applied in their own commit.

1. `agent-os/standards/scripts/bash-conventions.md`: add "A file setup writes verbatim from a template (`redline-setup.sh command`, the alias command files) carries a marker line naming the template, and a rerun compares bytes: equal is `unchanged`, different with the marker is `differs` (exit 1, the diff in the JSON, `--force` rewrites), and a file of that name without the marker is a person's own, `foreign`, never written whatever the flags (#44)".
2. `agent-os/standards/testing/tests.md`: extend the setup-test bullet: "…and prove this checkout's two alias files under `.claude/commands/` equal their templates (#44)".
3. `agent-os/standards/workflow/replay.md`: the last bullet names the short form: "…a line holding only a Redline command, namespaced or the `/redline` alias, and `RUN_LINE` names both forms (#60, #44)".
4. `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`, `scripts/guard`: no changes expected.

## Standards Applied

- scripts/bash-conventions — a new writing subcommand with one JSON object, `--dry-run`, `changed: false` on a rerun, exit 1 for a compared file that differs, exit 2 for usage, and the header as its documentation
- testing/tests — the setup cases red before green, in the temp directory, with neighbours; a last case over this checkout's own files; the guard rows beside their neighbours; the loop check moved before the workflow
- process/docs-gate — the Docs entries table in `plan.md`
- process/standards-retrospective — the proposed list above
- prompts/attribution — the templates and the alias files name no model or vendor
- workflow/replay — `RUN_LINE` names the alias form in every prompt, byte-identical on relaunch, pinned by the relay checks
- scripts/guard — no guard change; `tests/guard-cases.tsv` rows pin the alias files as ordinary content and `redline-setup.sh command` as the skill's

## Standards retrospective (applied)

Approved on 2026-11-02, all three: the bullets above as drafted, appended to `scripts/bash-conventions.md`, extended in `testing/tests.md`'s setup-test bullet and `workflow/replay.md`'s relayed-line bullet, in their own commit. `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`, `scripts/guard`: no changes. Decided by: @michaelwitwicki.
