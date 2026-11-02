# Spec: short aliases `/redline` and `/redline-revise` (#44)

Spec folder: `agent-os/specs/2026-11-02-1015-44-short-aliases-redline-and-redline-revise/`

Shaped by hand on 2026-11-02 with `/agent-os:shape-spec`; the person makes every commit. Issue #44 is the source of truth, read with the six decisions in the shaping prompt and the five answered today.

## Context

Plugin commands are namespaced, so the shortest launch today is `/redline:redline <pr>`. Issue #44 asks for a one-file project command that aliases it, `.claude/commands/redline.md` whose body runs `/redline:redline $ARGUMENTS`, and likewise `redline-revise.md`; `/redline:setup` offers to write both (default yes); the README shows the short form and says where it comes from; a setup rerun treats an existing alias file as drift-free when its body matches.

What the survey established (read only):

- **Claude Code renders `$ARGUMENTS` before the model sees a command body, and a slash command written inside a body is not expanded** (docs: a name typed mid-message "gives Claude permission to run the skill but doesn't run it"; direct execution happens only at the start of the person's message). So the alias body must get the model to invoke the `redline:redline` skill through the Skill tool with the arguments. Command files support the skills' frontmatter minus `name` and `paths` (`description`, `argument-hint`, `disable-model-invocation`, …); a plugin skill and a project command of the same bare name coexist because plugin skills are namespaced (`/redline` beside `/redline:redline`, `/redline:setup`). No documented precedent for a project command aliasing a plugin command, which is why decision 4 (verify first) stands.
- **The relaunch rule names the command form.** `skills/redline/SKILL.md:211` relaunches only from `relaunch` or "a line holding only a Redline command (`/redline:redline <n> ...` or a variant)"; `workflows/redline-loop.js:261` (`RUN_LINE`) tells every agent that such a line is conversational, and `tests/loop-test.mjs:1230` pins that sentence in every prompt. With the alias, the person's last typed line is `/redline 21`, so both texts name the short form too, and the loop check moves with it (red first).
- **The guard already treats `.claude/commands/` as ordinary content** (`scripts/redline-guard.sh:94`; `PROTECTED_FILES` at `:233` names only `.claude/agents|workflows|skills/redline*`), and `tests/guard-cases.tsv:186` pins a write to `.claude/commands/agent-os/shape-spec.md` as allowed to the implementer. Decision 3 (not guarded) needs no guard change; two rows pin it. `redline-setup.sh` is the skill's: every role is refused (`:474-481`), the main session is `inert` for every writing subcommand (`:396`).
- **The setup skill has thirteen numbered steps** (`skills/setup/SKILL.md:11`, README `:146`); step 11 is CLAUDE.md, 12 Verify, 13 Hand back. The inventory in step 1.5 lists what a rerun must find first. The script's pattern for a compared file is `unattended`: `changed: false` when equal, exit 1 with `differs` when not, `--force` to overwrite, `--dry-run` everywhere.
- **The README has no "Quick start"**: the examples are the block under "Use" (`README.md:55-65`); "Set up a repository" is a numbered list whose items 7 and 8 are Verify and Dry run; the Files table has one `templates/` row and the `skills/setup/SKILL.md` row saying "thirteen steps"; the `redline-setup.sh` table lists one row per subcommand.
- **Two safe lines prove pass-through without starting a run**: `/redline 62 bogus` stops at the grammar (`skills/redline/SKILL.md:35`: "A word that fits none of these stops the launch with one line naming it"), and `/redline-revise 62 review` stops because `review` has no selector (`skills/redline-revise/SKILL.md:13`). Both run before any `gh` call.

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

## Task 1: Save spec documentation

Create `agent-os/specs/2026-11-02-1015-44-short-aliases-redline-and-redline-revise/` with `plan.md` (this plan, with the Docs entries table and an As built section filled at the gate), `shape.md` (Scope, the Decisions above, the Context bullets, context with visuals none and references, `## Standards retrospective (proposed)` from Task 9's step 11, Standards Applied), `standards.md` (the full text of the seven standards as they read today), `references.md` (the pointers under References below). No `visuals/`.

## Task 2: The two templates

**Files:** `templates/command-redline.md`, `templates/command-redline-revise.md` (new).

Exactly the shape in decision 2. The `description` of each reads `Short form of /redline:redline <pr> ...; written by /redline:setup from the Redline plugin's templates/command-redline.md` (revise: `/redline:redline-revise <pr> ...`, `templates/command-redline-revise.md`); `argument-hint` is the matching skill's (`skills/redline/SKILL.md:4`, `skills/redline-revise/SKILL.md:4`). The marker line's text is fixed and the script greps for its prefix `<!-- redline-alias:`. Nothing in either file names a model or vendor (`prompts/attribution`).

## Task 3: Verify pass-through (decision 7), before anything else is built

**Files:** `.claude/commands/redline.md`, `.claude/commands/redline-revise.md` (new, byte-for-byte copies of the templates: `cp templates/command-redline.md .claude/commands/redline.md`, likewise revise). These are the deliverable of decision 10 as well; Task 5's script later reports them `unchanged`.

1. From the repository root run `claude -p '/redline 62 bogus'` and `claude -p '/redline-revise 62 review'`, each with a timeout under the Bash tool's cap, and keep the outputs.
2. Pass: the first output is the skill's one line naming `bogus` as a word it does not know (or its usage line naming `/redline:redline`), the second the revise skill's one line that `review` needs a selector. Either shows the words reached the skill through the alias.
3. Fail (the model answers in prose without the skill, or the words are missing): stop, record both outputs under As built, and say so; nothing after this task is built (decision 7).
4. Record both outputs verbatim under As built in `plan.md`. The person types the same two lines in a fresh interactive session before the commit; the result goes under As built too.

## Task 4: `redline-setup.sh command` with its cases, red first

**Files:** `tests/setup-test.sh` (cases first), `scripts/redline-setup.sh` (`cmd_command`, the header, `usage()`, the dispatcher).

1. **Cases first**, a new block `echo "# command: the alias files (#44)"` before the `# version` block, all in the temp directory (`testing/tests`: never `sed -i`, never into the checkout):
   - fresh write: `expect_json "fresh: absent, changed, written" '[.existed, .status, .changed, .written] | join(",")' "false,absent,true,true" command "$A1" redline`; the directory `.claude/commands/` is created; `same "fresh: byte-identical to the template" "$A1/.claude/commands/redline.md" "$PLUGIN/templates/command-redline.md"`; the revise name writes `redline-revise.md` from its template.
   - drift-free rerun: `[.status, .changed, .written]` is `unchanged,false,false` and the file is byte-identical to its copy before.
   - changed file: `sed 's/exactly as if/just as if/' "$PLUGIN/templates/command-redline.md" > "$A1/.claude/commands/redline.md"`; `expect_exit "… exit 1" 1 command "$A1" redline`; `.status` is `differs`, `.diff` holds a line starting `-` with `exactly as if` and one starting `+` with `just as if`; the file is untouched; one stderr line; `--force` writes it (`changed,written` `true,true`) and it equals the template again.
   - foreign file: `printf 'Deploy the thing with $ARGUMENTS\n' > "$A2/.claude/commands/redline.md"`; exit 0, `.status` `foreign`, `.changed` false, `.written` false, the file byte-identical after; `--force` still leaves it (`foreign`, not written): a person's file is never overwritten by this subcommand.
   - `--dry-run`: on an absent file `changed,written` is `true,false` and no file and no `.claude/commands/` directory appear; on a differing file exit 1 and untouched.
   - usage: no root exit 2; a name other than `redline` or `redline-revise` exit 2 naming it; a root that is not a directory exit 2.
   - this checkout, in the "# this checkout" block: `expect_json "this checkout's /redline alias is the template" '.status' "unchanged" command "$PLUGIN" redline`, and the same for `redline-revise`. Red until Task 3's copies exist; green after.
   Run `tests/setup-test.sh` and see the block red (unknown subcommand exits 2).
2. **The subcommand.** `cmd_command`: parse `<repoRoot> <name> [--force] [--dry-run]`; `name` in `redline` or `redline-revise` else `die2`; template `$PLUGIN_ROOT/templates/command-$name.md` (die2 when missing); target `<root>/.claude/commands/$name.md`. Status: no file → `absent` (write a copy through `tmp_beside`/`commit_tmp` unless `--dry-run`); file present and `cmp -s` equal → `unchanged`; present, holds a line starting `<!-- redline-alias:` and differs → `differs` (`diff` is `diff -u <template> <file>` as one string with the two `---`/`+++` header lines included; without `--force`, one stderr line `redline-setup: <file> differs from <template>; show the diff and rerun with --force to rewrite it` and exit 1 after printing the JSON, as `unattended` does; with `--force` and not `--dry-run`, rewrite and `changed,written` true); present without the marker → `foreign`, exit 0, never written, `--force` or not, with `diff` null. Output: `{file, name, template, existed, status, changed, written, diff}` through `jq -n`, never a hand-built string. Exit codes stay the header's: 0; 1 differs without `--force`; 2 usage.
3. **Header** (`scripts/redline-setup.sh:9-69`): a `command` entry in the usage list, in the same voice as `gitignore`'s, and `usage()` gains `| command <repoRoot> <redline|redline-revise> [--force] [--dry-run]`. The exit-code paragraph needs no change (1 for "a compared file differs without --force" already covers it).
4. The whole table green: `tests/setup-test.sh`.

## Task 5: Guard rows pinning decision 6

**Files:** `tests/guard-cases.tsv` only (`scripts/redline-guard.sh` is a person's, and it does not change here).

Under a comment `# Alias command files (#44): ordinary content under .claude/commands/, beside the protected copies`, after row 186's group: `redline:redline-implementer allow Write .claude/commands/redline.md`, `redline:redline-implementer allow Write .claude/commands/redline-revise.md`, and a neighbour that must not change, `redline:redline-implementer deny Write .claude/skills/redline/SKILL.md`. Beside the setup rows at `:477-481`: `redline:redline-implementer deny Bash PLUGIN/scripts/redline-setup.sh command REPO/ redline` and, beside `:396`, `- inert Bash PLUGIN/scripts/redline-setup.sh command REPO/ redline`. `tests/guard-test.sh` green (the rows pin today's behaviour, so none goes red).

## Task 6: The setup skill, step 12

**Files:** `skills/setup/SKILL.md`.

1. Line 11: "The fourteen steps below are the issue's (#6, and #44's step)".
2. Step 1.5 (inventory): add a bullet "the two alias files `.claude/commands/redline.md` and `.claude/commands/redline-revise.md`, each absent, Redline's (a `<!-- redline-alias:` line) or a person's own".
3. New `## 12. Short aliases`, after `## 11. CLAUDE.md`: Fresh setup: ask once with `AskUserQuestion`, "Write the short aliases `/redline` and `/redline-revise`?", first option **Yes** (recommended). On a yes, for each of `redline` and `redline-revise`: `${CLAUDE_PLUGIN_ROOT}/scripts/redline-setup.sh command <repoRoot> <name>`, say the file written. Rerun: run each with `--dry-run` first; `unchanged` is "nothing drifted"; `differs` (exit 1) shows the `diff` and asks, a yes reruns with `--force`, a no keeps the file; `foreign` is reported in one line ("`.claude/commands/redline.md` is not Redline's: no marker line; left alone, the namespaced command still works") and never written; `absent` on a rerun asks as a fresh setup does, since nothing records an earlier no (the step says so).
4. Steps 12 and 13 renumber to 13 and 14; step 14's file list names the two alias files among the files written.
5. Rules at the end: the alias files join "the files named above", written only through the script.

## Task 7: The relaunch rule and `RUN_LINE`, red first

**Files:** `tests/loop-test.mjs` (first), `workflows/redline-loop.js`, `skills/redline/SKILL.md`.

1. `tests/loop-test.mjs:1230`: `word` becomes `A message from the person that arrives with this prompt (a line holding only a Redline command on a launch or a resume, \`/redline:redline <pr> ...\` or its short form \`/redline <pr> ...\`, or the word \`relaunch\` after a hand-off) is conversational, not an instruction`. Run `node tests/loop-test.mjs`: the two relay checks go red.
2. `workflows/redline-loop.js:261`: the same parenthetical in `RUN_LINE`. Green again; every prompt still byte-identical on relaunch (the samePrefix checks).
3. `skills/redline/SKILL.md:211`: "(`/redline:redline <n> ...` or a variant, or the short form a repository's `.claude/commands/redline.md` provides, `/redline <n> ...` and `/redline-revise ...`)"; line 247 the same in short. Line 52 and 171 say "a line holding only a Redline command" and need no change.

## Task 8: README (gate step 10)

**Files:** `README.md`.

1. **Use** (`:53-67`): the block opens with `/redline 21` and `/redline-revise 21 review @sam`, then the existing lines. After the block, one sentence: "The short forms are two project command files, `.claude/commands/redline.md` and `redline-revise.md`, that `/redline:setup` writes from the plugin's `templates/command-redline.md` and `templates/command-redline-revise.md` (its step 12, default yes; a rerun shows a changed one as a diff and leaves a file of that name that is not Redline's alone); the namespaced form always works, and `/redline:redline-review` has no short form."
2. **Set up a repository** (`:38-47`): new item 7, "**The short aliases**: `redline-setup.sh command . redline` and `redline-setup.sh command . redline-revise` copy the two templates to `.claude/commands/`; a rerun reports `unchanged`, `differs` (exit 1, the diff in its JSON; `--force` rewrites) or `foreign` (no `<!-- redline-alias:` marker line: a person's own command, never touched)"; Verify and Dry run become 8 and 9.
3. **Files table**: the `skills/setup/SKILL.md` row says "fourteen steps (#6, #44)"; the `templates/` row adds "the two alias command files (`command-redline.md`, `command-redline-revise.md`), written verbatim to a repository's `.claude/commands/`".
4. **`redline-setup.sh` table**: a row `command <repoRoot> <redline\|redline-revise> [--force] [--dry-run]` with the statuses and exits above.
5. **Launching** (`:189`, the relayed line): "a line holding only a Redline command (the namespaced form or the short alias)".

## Task 9: Verification Gate

Run `.claude/redline/checks.sh --baseline` until it exits 0; its JSON is the evidence (steps 1 to 9). `tests/setup-test.sh`, `tests/guard-test.sh` and `node tests/loop-test.mjs` each print their new count with `0 failed` / `0 mismatched`; the red runs of Tasks 4 and 7 are seen before their fixes. `claude plugin validate .` still passes (the alias files sit under `.claude/commands/`, outside the plugin's manifest). Then:

**Step 10, Docs entries** (one per touched file; the gate confirms each names its commit or its reason):

| File | README section | Commit |
| --- | --- | --- |
| `templates/command-redline.md`, `templates/command-redline-revise.md` (new) | "Use" (where the short forms come from), "Set up a repository" item 7, Files table `templates/` row | Task 8's commit |
| `scripts/redline-setup.sh` (`command`, a new subcommand) | "`redline-setup.sh`" table row, "Set up a repository" item 7 | Task 8's commit |
| `skills/setup/SKILL.md` (step 12, fourteen steps) | Files table `skills/setup/SKILL.md` row; "Set up a repository" intro sentence | Task 8's commit |
| `skills/redline/SKILL.md` (the relaunch rule names the alias) | "Launching", the relayed-line paragraph | Task 8's commit |
| `workflows/redline-loop.js` (`RUN_LINE`) | "Launching", the same paragraph | Task 8's commit |
| `tests/setup-test.sh`, `tests/loop-test.mjs`, `tests/guard-cases.tsv` | no reader-facing change: tests; the Files table rows for them already describe the harnesses | — |
| `.claude/commands/redline.md`, `.claude/commands/redline-revise.md` | this repository's own contract, named in "Use" | Task 8's commit |

No new config key, allow rule or exit code; one new subcommand (`command`), documented above.

**Step 11, Standards retrospective (proposed; approved with `AskUserQuestion` at the gate, applied in their own commit):**

1. `agent-os/standards/scripts/bash-conventions.md`: add "A file setup writes verbatim from a template (`redline-setup.sh command`, the alias command files) carries a marker line naming the template, and a rerun compares bytes: equal is `unchanged`, different with the marker is `differs` (exit 1, the diff in the JSON, `--force` rewrites), and a file of that name without the marker is a person's own, `foreign`, never written whatever the flags (#44)".
2. `agent-os/standards/testing/tests.md`: extend the setup-test bullet: "…and prove this checkout's two alias files under `.claude/commands/` equal their templates (#44)".
3. `agent-os/standards/workflow/replay.md`: the last bullet names the short form: "…a line holding only a Redline command, namespaced or the `/redline` alias, and `RUN_LINE` names both forms (#60, #44)".
4. `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`, `scripts/guard`: no changes expected.

**Step 12**: `plan.md` reflects what was built (the two headless outputs and the interactive confirmation under As built); deviations under Decisions in `shape.md`.

## Commits (the person makes and titles them)

1. The spec folder (Task 1).
2. The templates and this checkout's two alias files, with the verification recorded (Tasks 2 and 3).
3. `redline-setup.sh command` with its cases (Task 4).
4. The guard rows (Task 5).
5. The setup skill's step 12 (Task 6).
6. The relaunch rule, `RUN_LINE` and the loop check (Task 7).
7. The README (Task 8).
8. The standards retrospective, if approved (own commit).
9. As built (Task 9).

## References

- `scripts/redline-setup.sh:237-273` (`cmd_gitignore`) and `:419-460` (`cmd_unattended`): the shape of a writing subcommand, `tmp_beside`/`commit_tmp`, `--dry-run`, the exit-1-with-JSON pattern.
- `tests/setup-test.sh:290-349` (the unattended cases) and `:520-528` (this checkout's own files): the case style, `same`, `expect_json`, `expect_exit`, `expect_stderr`.
- `tests/guard-cases.tsv:186-200` and `:474-481`: the `.claude/` write rows and the setup-script rows the new rows sit beside.
- `tests/loop-test.mjs:1228-1240`: the relay checks that pin `RUN_LINE`.
- `skills/redline/SKILL.md:4` and `skills/redline-revise/SKILL.md:4`: the `argument-hint` text the templates copy.
- `skills/setup/SKILL.md:140-155`: steps 11 to 13 today, the voice for the new step.
- `agent-os/specs/2026-11-02-0851-18-setup-header-and-read-checks/`: the last hand-shaped setup spec, the model for the folder's files.

## Verification of the whole

1. Task 3's two headless outputs and the person's interactive run in a fresh session (`/redline 62 bogus`, `/redline-revise 62 review`), both stopping inside the skill with the words named.
2. `.claude/redline/checks.sh --baseline` exits 0; `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .claude/redline/checks.sh` exit 0; `git status --porcelain` shows only the intended files.
3. A rerun of `redline-setup.sh command . redline` over this checkout reports `unchanged`.

## As built (2026-11-02)

Built as planned; the gate is green.

- **Task 3, the headless verification.** `claude -p '/redline 62 bogus'` from the repository root printed: "The arguments are `62 bogus`. Parsing them against the grammar: `62` is the PR number, and `bogus` fits none of the words the grammar accepts (…). The skill says a word that fits none of these stops the launch with one line naming it, without guessing. `bogus` is not a word Redline recognises, so the launch stops here. Nothing was read, saved or launched." `claude -p '/redline-revise 62 review'` printed: "`review` needs a selector in `/redline-revise`: type `/redline-revise 62 review latest`, `/redline-revise 62 review @login`, or `/redline-revise 62 review <review id>` to pick the teammate's review to revise from." Both reached the skill through the alias with the words intact; both exited 0. The interactive confirmation in a fresh session is the person's, before the commit. (Each run also printed a pre-existing warning on stderr about the `Bash(tests/*.sh:*)` allow rule in `.claude/settings.json`, unrelated to this change.)
- **Task 4.** The 19 new setup cases were seen red (`311 passed, 19 failed`: `command` was an unknown subcommand, and this checkout's two files were already in place from Task 3), then green with the subcommand: `330 passed, 0 failed`.
- **Task 5.** The `shape-spec.md` write row appears twice in `tests/guard-cases.tsv` (line 186 and again in the self-hosted `# @cwd PLUGIN` block), so the alias rows went in at both: three rows beside line 186, one beside the setup rows, one main-session `inert` row, and one self-hosted `allow` row. `tests/guard-test.sh`: 584 passed, 0 mismatched.
- **Task 7.** The relay checks were seen red (`493 checks passed, 2 failed`) with the loop test's new sentence, then green with `RUN_LINE`: `495 checks passed, 0 failed`.
- **Task 9, the gate.** `.claude/redline/checks.sh --baseline` exit 0 in 73 s: syntax, validate (the known icon warning), guard, loop 495, prefs 101, gate 117, setup 330, gh 113, background 39. `scripts/redline-gate.sh check .` ok (the gate text is untouched, so no restamp), `scripts/redline-setup.sh version` match v2. shellcheck is not installed on this machine; the CI leg runs it.
- **Docs entries.** Every row of the step 10 table lands in the README commit (Task 8), as planned; no row changed.
- **Standards retrospective.** Applied, all three, in their own commit (shape.md, Decisions 14).
- **Deviations from the shaped plan:** none.
