# Spec: public docs, README for installation and use, reference moved to docs/ (#14)

Spec folder: `agent-os/specs/2026-11-03-1259-14-public-docs/`

Shaped by hand on 2026-11-03 with `/agent-os:shape-spec`; the person makes every commit. Issue #14 is the source of truth for the target layout, read with the eight decisions in the shaping prompt and the three answered today.

## Context

The README is 419 lines written for us while building: install, upgrade, the by-hand setup, use, settings, the Files table, the guard, launching, contributing, Known limits, the git rules for agents, and reference for `checks.sh`, `redline-background.sh`, `redline-setup.sh`, `redline-gh.sh` and the snapshot file. A visitor needs, in order: what Redline does, what it needs, how to install, how to set up a repository, what a run looks like, and what each contract file is for. The issue moves the reference into `docs/` and leaves a README under 150 lines that GitHub renders as installation and usage documentation.

What the inventory established (every reference read in this session):

- **The expensive references, which stay valid without a template change.** `templates/claude-md-git-sentence.md` (both the header comment and the sentence setup appends to a repository's CLAUDE.md) and `workflows/redline-loop.js:261` (`RUN_LINE`) name "Git rules for Redline agents" in the plugin's README; this repository's `CLAUDE.md:7` is the appended sentence. `workflows/redline-loop.js:260,2452` link the handoff comment to `README.md#known-limits`. `tests/guard-cases.tsv:301` greps `## Known limits` in the plugin's README. `.claude/commands/agent-os/shape-spec.md:70` (unattended point 11, a hand edit of this repository's section, not the template's body) names "Known limits in `README.md`" as a mitigation. All four sections named stay in the README, so none of these changes.
- **The one expensive reference that goes stale by a hop.** `scripts/redline-setup.sh:1042,1090` write "See README.md for the output contract" (self-hosted) or "See the Redline plugin's README for the output contract" into every generated `checks.sh` header (`scripts/checks-template.sh:30`, `.claude/redline/checks.sh:35`), and `read-checks` detects a self-hosted file by that phrase (`:1238`). Kept as is (decision 9 below).
- **The cheap references, which move with their sections.** `skills/redline/SKILL.md:15` ("Set up a repository" in the README), `:84` ("Gate stamp" in the README), `:9,17` (the README in general); `skills/redline-revise/SKILL.md:16` (the README's `redline-gh.sh` table); `skills/setup/SKILL.md:9` (the README's "Set up a repository" and `checks.sh` sections); `agents/redline-reviewer.md:34` and `agents/redline-plan-approver.md:23` ("the README section" in the Docs bullets); `CHANGELOG.md:3` ("Releases" under Contributing in the README); `.claude/commands/agent-os/shape-spec.md:251` (gate step 10, Docs) and `:252` (step 11, "see Contributing in the README", prose); `CLAUDE.md:3` ("`README.md` is the operating document") and `:56` ("The README is the only long-form document here"); `agent-os/standards/process/internal-notes.md:6`, `process/docs-gate.md` (every bullet names the README), `scripts/bash-conventions.md:10,11` ("The README quotes from it", "across `README.md`, `skills/` and `agents/`"); `agent-os/product/tech-stack.md:26` ("its README only"). `scripts/redline-guard.sh:102` and `workflows/redline-loop.js:39` mention the README as repository content and stay true.
- **The guard needs no change.** Self-hosted, the implementer's write prefix is `REPO` (`scripts/redline-guard.sh`, the table), so `docs/` and `CONTRIBUTING.md` are writable by the round that reviews this PR; the reviewer writes only `TMP`. Not self-hosted, the plugin's directory is refused whole, `docs/` included.
- **The gate stamp moves.** Gate step 10's text holds backticked spans; the edit in Task 6 changes them, so `tests/gate-test.sh`'s last case and the setup test's regenerate-and-compare cases need the restamp in the same commit. The `steps 1-9` range does not change. `scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh` is the command.
- **Script headers.** Lines of header after the shebang: `redline-gh.sh` 118, `redline-setup.sh` 145, `redline-prefs.sh` 51, `redline-background.sh` 47, `checks-template.sh` 39, `redline-gate.sh` 36, `redline-guard.sh` 34. Each is the subcommand reference its README table was condensed from.
- **README section sizes** (lines): Install 16, Upgrading 15, Set up a repository 15, Use 21, Settings 69, Files 26, The guard 18, Launching 7, Contributing 7, Known limits 11, Git rules 11, `checks.sh` 87, `redline-background.sh` 8, `redline-setup.sh` 18, `redline-gh.sh` 42, Snapshot file 24. Many lines are paragraphs of 1,000+ characters; the 150-line target is on lines, and the new README's paragraphs are short.
- **Open issues checked**: #14 is the only docs issue; #66 (guard protection by manifest) touches `docs/guard.md`'s self-hosted paragraph only in that the paragraph describes today's behaviour and cites #66 as open.

## Decisions

The prompt's eight, as given, plus three answered today and the calls made from the inventory.

1. **Inventory first, each reference moves with its section in the same commit** (prompt 1). The list is the Context above; the plan's tasks name each. Decided by: @michaelwitwicki.
2. **"Git rules for Redline agents" stays in the README**, short, the one agent-facing section, so the CLAUDE.md template, `RUN_LINE` and every set-up repository's CLAUDE.md stay valid with no template change and no rerun (prompt 2). Decided by: @michaelwitwicki.
3. **README order** (prompt 3): what it is (three sentences and the loop), requirements, install, quick start with the `/redline` aliases, the dials with defaults, the Files table, Git rules for Redline agents, Known limits, a link to each docs/ file. Under 150 lines. Known limits stays because the handoff comment links `#known-limits`; `docs/contract.md` does not duplicate it. Decided by: @michaelwitwicki.
4. **docs/ files as the issue lists** (prompt 4): `setup.md`, `contract.md`, `running.md`, `guard.md`, `upgrading.md`, `scripts.md`. `docs/scripts.md` quotes each script's header verbatim and says so (the header is the source; the doc names the version it was copied at; no test pins the copy, see decision 14). `docs/guard.md` includes how to read `tests/guard-cases.tsv`. Decided by: @michaelwitwicki.
5. **Nothing is lost** (prompt 5): the section map below is written into `plan.md` at shaping time and confirmed under As built; Redline's round checks it (the reviewer's prompt sees the plan). Decided by: @michaelwitwicki.
6. **The Docs gate step: entries may name a docs/ file** (prompt 6, answered today): the directory list stays; the entry names "the README section, or the `docs/` file and section (and template, if any)". A change under `docs/` is reader-facing by nature and needs no entry. The backticked text changes, so the stamp moves; restamp in the same commit (Task 6). The agents' Docs bullets and the docs-gate standard are reworded to match. Decided by: @michaelwitwicki.
7. **Patch bump** to `0.1.1` in `plugin.json` and the marketplace entry (prompt 7): no template changes. Decided by: @michaelwitwicki.
8. **Done-when** (prompt 8): the README and `docs/setup.md` walkthrough on a scratch repository with stock Agent OS (not Chalkboard, frozen), the gate task added as `docs/setup.md` describes it; what was unclear is recorded in `shape.md` and fixed in the doc. Task 9. Decided by: @michaelwitwicki.
9. **The `checks.sh` header sentence stays** (answered today): "See README.md for the output contract" is template text and the `read-checks` detection phrase; rewording is a minor bump and a rerun everywhere. The README's link to `docs/contract.md` is the one hop; `shape.md` records the sentence as wording to carry at the next `checks-template.sh` bump (`scripts/redline-setup.sh:1042,1090,1238` and `scripts/checks-template.sh:30`), and `docs/contract.md` opens by saying it is the output contract the header means. Decided by: @michaelwitwicki.
10. **Contributing moves to `CONTRIBUTING.md` at the root** (answered today), GitHub's conventional spot beside `README.md` and `CHANGELOG.md`. `CHANGELOG.md:3` and gate step 11's "see Contributing in the README" (prose, the hash is unmoved by it) are repointed in the same commit; the Files table gains a row. Decided by: @michaelwitwicki.
11. **Section map** (from the inventory; the full table is below): Settings splits, the dial table and scope with defaults in the README and the rest in `docs/running.md`, except Ask rules, a `redline.json` key, which goes whole to `docs/contract.md` with one pointer line from `running.md`'s dispositions, so one description exists (bash-conventions: a change rewords every description). `redline-background.sh` and `checks-template.sh` join `docs/scripts.md`; `redline-guard.sh`'s header is quoted in `docs/guard.md`. The snapshot file goes to `docs/contract.md`. Decided by: redline.
12. **Standards carried**: `process/docs-gate`, `process/internal-notes`, `process/release` (the bump), `process/standards-retrospective`, `scripts/bash-conventions` (the header-quoting rule), `testing/tests` (the restamp), `prompts/attribution`. Visuals: none. Product alignment: roadmap Phase 1 gains item 9, public docs (#14); `tech-stack.md:26` reads "its README and `docs/`". Decided by: redline.
13. **The guard, the hook and the templates do not change**; `templates/claude-md-git-sentence.md` is read, not edited. Decided by: redline.
14. **No test pins `docs/scripts.md` against the headers.** A check would be an edit to `checks.json`, a regenerate and a second reason to restamp; the doc says which version it was copied at, and the Docs gate step covers a header change (the script is under `scripts/`, so its entry names `docs/scripts.md`). Decided by: redline; the person may overrule at approval.

## Section map (old README → new home)

Every heading of today's README, with the destination. Confirmed under As built when the move lands.

| Old section (lines) | New home |
| --- | --- |
| Intro paragraphs 3–7 | README "What it is": three sentences and the loop (review, shape, approve, fix one commit per finding, check, push, reply, re-review; hand off). The "built and proven" sentence stays as one line. Line 7 ("This file is the part an agent needs...") is replaced by the docs links |
| Install (9–24): the two commands, `--scope project`, teammates | README "Install" (the commands and one sentence on `--scope project`); the teammates and `claude plugin list` detail → `docs/setup.md` "Install" |
| Install: "Developing the plugin" (20) | `CONTRIBUTING.md` "Developing the plugin" |
| Install: "This repository is itself set up" (22) | `CONTRIBUTING.md` (one sentence) and `docs/guard.md` "Self-hosted" |
| Install: Requirements (24) | README "Requirements" |
| Upgrading (26–40) | `docs/upgrading.md`, whole, plus a paragraph "What a template bump means" (minor bump, markers, the precheck's warnings, the rerun) |
| Set up a repository (42–56) | `docs/setup.md`: what the skill reads, asks and writes, step by step (the skill's 14 steps), each with the by-hand command; the lockfile paragraph under "Before the baseline"; the dry run under "Before the first real PR" |
| Use (58–76): the command list, the aliases, `dry run`, `review only` path | README "Quick start" (`/redline:setup`, then `/redline <pr>`; the alias forms; one line each on `review only`, `dry run`, `autopilot`) and `docs/running.md` "Launching a run" (the full command list and the words) |
| Use: `/redline:redline-revise <pr> review ...` (78) | `docs/running.md` "A human review pass" |
| Settings intro + The interrupt dial (80–96) | README "Dials" (the table, defaults marked) |
| Settings: Scope (98–100) | README "Dials" (one row or one line) |
| Settings: Saved preferences (102–115) | `docs/running.md` "Saved launch settings"; the `redline.local.json` shape → `docs/contract.md` "`redline.local.json`" (the keys, `runs`) |
| Settings: Decided by (117–124) | `docs/running.md` "Decided by" |
| Settings: Ask rules (126–142) | `docs/contract.md` "`redline.json`" → "Ask rules" (the whole section); `docs/running.md` dispositions point there |
| Settings: Earlier rounds (144–148) | `docs/running.md` "Earlier rounds" and "The handoff comment" |
| Files (150–175) | README "Files", plus rows for `docs/`, `CONTRIBUTING.md` |
| The guard (177–194) | `docs/guard.md`: the hook, the role table (quoted from the script), what each role may run and write, the refusals, the main-session approvals, how to read `guard-cases.tsv` (columns, `# @cwd` lines, the fifth column, how to run one file), the self-hosted rules |
| Launching (196–202) | `docs/running.md` "Precheck", "Relaunch and resume", "The relayed line", "Run markers" |
| Contributing (204–210) | `CONTRIBUTING.md`: CI, the Docs step (reworded for docs/), Releases |
| Known limits (212–222) | README "Known limits", as is |
| Git rules for Redline agents (224–234) | README, as is |
| `checks.sh` (236–322): intro, `checks.json`, usage, environment, example gate, output contract, exit code, baseline, long gates, gate stamp, `redline-gate.sh` table, template version | `docs/contract.md`: "`checks.json` → `checks.sh`", "Output contract", "Exit codes", "Baseline and long gates", "Gate stamp", "Template version line"; the `redline-gate.sh` table → `docs/scripts.md` (the header is quoted; the table is dropped since the header carries it) |
| `redline-background.sh` (324–331) | `docs/scripts.md` (header quoted); the "Long gates" prose stays in `docs/contract.md` |
| `redline-setup.sh` (333–349) | `docs/scripts.md` (header quoted; the condensed table is dropped) |
| `redline-gh.sh` (352–393): the two tables and "Rules the agent follows" | `docs/scripts.md` (header quoted); "Rules the agent follows around these" → `docs/running.md` "How the review is posted" (inline anchoring, `place`, body findings, the sweep) |
| Snapshot file (395–419) | `docs/contract.md` "Snapshot file" |

Things the issue lists for a docs/ file that today's README does not have: `docs/running.md`'s "finding dispositions (fix / mitigate-and-defer / ask / defer)" and "cap-hit" are written from `.claude/commands/agent-os/shape-spec.md` unattended points 3–4 and `workflows/redline-loop.js` (the cap-hit comment); `docs/contract.md`'s "the unattended section" and "the CLAUDE.md sentence" are written from `templates/shape-spec-unattended.md` and `templates/claude-md-git-sentence.md`.

## Task 1: Save spec documentation

Create `agent-os/specs/2026-11-03-1259-14-public-docs/` with `plan.md` (this plan: Context, Decisions, the section map, the tasks, the Docs entries table, an As built section filled at the gate with the confirmed map), `shape.md` (Scope, the Decisions above with the file and line evidence, the walkthrough log of Task 9, Context, `## Standards retrospective (proposed)` from Task 10, Standards Applied), `standards.md` (the full text of the seven standards as they read today), `references.md` (the #16 spec's README task as the pattern for a README rewrite; `skills/setup/SKILL.md` as the source for `docs/setup.md`; the script headers as the source for `docs/scripts.md`). No `visuals/`.

## Task 2: `docs/` reference files

**Files (new):** `docs/setup.md`, `docs/contract.md`, `docs/running.md`, `docs/guard.md`, `docs/upgrading.md`, `docs/scripts.md`.

Write each from the section map, moving text rather than rewriting it, then tightening. Rules from the issue: every code sample is a command a reader can paste from the repository root (no `<plugin>` placeholder where `${CLAUDE_PLUGIN_ROOT}` or `~/.claude/plugins/...` is what a person types; where the path varies, one sentence says how to find it: `claude plugin list` prints `Read from:`); every claim about behaviour names the test that pins it (`tests/gate-test.sh`, `tests/setup-test.sh`, the guard rows, `tests/loop-test.mjs`, `tests/gh-test.sh`, `tests/background-test.sh`). Each file opens with one sentence saying what it covers and ends with a "See also" line to its neighbours. Specifics:

1. `docs/setup.md`: install (the teammates paragraph), then one section per setup step in the skill's order (`skills/setup/SKILL.md` steps 1–14), each saying what the step reads, asks and writes, and the by-hand `redline-setup.sh` command from the old "Set up a repository" list; the lockfile check and the dry run as their own sections; "Verify" as the paste-able four commands. It is the file Task 9 walks.
2. `docs/contract.md`: opens "This is the output contract `checks.sh`'s header points to" (decision 9). Sections: `checks.json` → `checks.sh`; usage; environment (`REDLINE_OCTANE`, `vars`); the example gate; the output contract JSON; exit codes; baseline; long gates; gate stamp (the three stop lines); template version line; `redline.json` keys (from `templates/redline.json.example`, each key one line, with Ask rules whole); `redline.local.json`; the settings allow list (`templates/settings.allow.json`, `settings.retired.json`, what `stale` means); the unattended section (what it is, the marker, where it sits, that it is outside the stamp); the CLAUDE.md sentence (the two edits from the template); snapshot file.
3. `docs/running.md`: launching (the command list, the words, the aliases, `dry run`, `review only` then a full run); precheck (file count, `maxFiles`, round numbering, prior findings, the gate stamp and version warnings); rounds (review, shape, approve, implement one commit per finding, check, push, reply, re-review; the done rule; the final nit pass; the cap and the cap-hit comment); dispositions (fix, defer with a mitigation, ask, left under a repository rule; the proportionality rule in one paragraph; a pointer to `docs/contract.md` for ask rules); hand-off and relaunch (the dial's stopping points, the answer form, `relaunch`, the relayed line); the handoff comment (decisions list, threads line, Earlier rounds, Left to you); decided by; earlier rounds; saved launch settings; run markers and resume; the run record (the commits, the snapshot files, `redline/` under the spec folder); how the review is posted (from the `redline-gh.sh` rules); a human review pass.
4. `docs/guard.md`: the hook (`hooks/hooks.json`, `agent_type`, the inert path); the role table quoted from `scripts/redline-guard.sh` (the `REDLINE_GUARD_TABLE` block and the group legend above it, verbatim, with the line that says so); what the guard refuses for every role (today's bullets); the main-session approvals; how to read `tests/guard-cases.tsv` (the four columns and the optional fifth, `-` as the main session, `# @cwd PLUGIN|ASKRULES|ASKRULESBAD`, `PLUGIN/` and `REPO/` placeholders, running the whole table and running one file of new rows, what `N passed, 0 mismatched` means, where the fixture repositories live); self-hosted rules (the two files, in place versus cached, #66 open, the Known limits bullet).
5. `docs/upgrading.md`: today's Upgrading section, then "What a template bump means": minor version, the markers (`# redline-template: checks-template.sh vN`, `<!-- redline-unattended: vN -->`), what the precheck warns, what a rerun carries, and that a plugin update alone carries none of it; the CHANGELOG's third group is the list.
6. `docs/scripts.md`: one section per script, in this order: `redline-gh.sh`, `redline-prefs.sh`, `redline-gate.sh`, `redline-setup.sh`, `redline-background.sh`, `checks-template.sh`. Each section is one sentence on who runs it (the skill, a role, the guard group) and the header quoted verbatim in a fenced block (the comment lines after the shebang up to the first non-comment line, `#` prefixes kept). The file opens: "Each block below is the script's own header, copied verbatim at version 0.1.1; the header is the source, and a reader with the plugin installed can print it with `<script> --help` where the script has one." The guard's header is in `docs/guard.md`, not here.

**Docs entry:** these files are the reader-facing change; no entry of their own (decision 6).

## Task 3: `CONTRIBUTING.md`

**File (new):** `CONTRIBUTING.md`.

Sections: Developing the plugin (`claude --plugin-dir`, the local-directory marketplace caveat, from Install line 20); This repository reviews itself (line 22, one paragraph, pointing to `docs/guard.md`); CI (line 206); the Docs step, reworded for docs/ (line 208: "names in its plan the README section, or the `docs/` file and section, and the template, it updates"); Releases (line 210, as is). Repoint `CHANGELOG.md:3` to "see Releases in `CONTRIBUTING.md`".

**Docs entry:** `CHANGELOG.md` is not under a listed directory; no entry.

## Task 4: The new README

**File:** `README.md` (rewritten).

Order, with the line budget: title and three sentences plus the loop as one short paragraph or a six-line list (10); Requirements (6); Install, the two commands and one sentence (10); Quick start: `/redline:setup`, then `/redline 21`, the alias and namespaced forms, `review only`, `dry run`, `autopilot` in one line each (18); Dials: the interrupt table with `guided` marked default, scope, rounds (3), models (Opus 5.5 for revise; the rest from `redline.json`) (18); Files table, today's rows plus `docs/` and `CONTRIBUTING.md`, each row's text cut to one clause with a docs/ pointer (30); Git rules for Redline agents, as is (11); Known limits, as is (11); Documentation: one line per docs/ file and `CONTRIBUTING.md` (9). About 125 lines. Keep the "built and proven" sentence. Keep every section heading the expensive references name exactly: `## Known limits`, `## Git rules for Redline agents`.

The Files table rows that today say "see below" or "see 'Settings'" point to the docs/ file and section instead.

**Docs entry:** the README is the reader-facing change; no entry of its own.

## Task 5: Repoint the cheap references

**Files:** `skills/redline/SKILL.md` (lines 9, 15, 17, 84), `skills/redline-revise/SKILL.md` (line 16), `skills/setup/SKILL.md` (line 9), `agents/redline-reviewer.md` (line 34), `agents/redline-plan-approver.md` (line 23), `CLAUDE.md` (lines 3, 56), `agent-os/product/tech-stack.md` (line 26), `agent-os/product/roadmap.md` (item 9).

- `skills/redline/SKILL.md:15`: "see `docs/setup.md` in the plugin" (`${CLAUDE_PLUGIN_ROOT}/docs/setup.md`); `:84`: "see Gate stamp in `${CLAUDE_PLUGIN_ROOT}/docs/contract.md`"; `:9,17`: "its README and `docs/`".
- `skills/redline-revise/SKILL.md:16`: "see the `redline-gh.sh` header, quoted in `${CLAUDE_PLUGIN_ROOT}/docs/scripts.md`, for how each selector form selects".
- `skills/setup/SKILL.md:9`: "`docs/setup.md` and `docs/contract.md` say what each file is for".
- `agents/redline-reviewer.md:34`: "with no README section, or `docs/` file and section, named for it in the PR's spec plan, is a `nit` whose `proposedFix` is 'update section X of the README or of `docs/<file>`'". `agents/redline-plan-approver.md:23`: "the README section, or the `docs/` file and section (and template, if any), the task updates".
- `CLAUDE.md:3`: "`README.md` and `docs/` are the operating documents ... read the one a run touches before changing it"; `:56`: "The README, `docs/` and `CONTRIBUTING.md` are the only long-form documents here."
- `agent-os/product/tech-stack.md:26`: "its README and `docs/`"; `roadmap.md`: item 9, "Public docs (#14): the README for installation and use, the reference under `docs/`, Contributing at the root".

Test for the skill and agent edits: `claude plugin validate .` (gate step 2) and `node tests/loop-test.mjs` (the prompts quote agent files by path, not text, so no check changes; confirm it stays green).

**Docs entries:** `skills/redline/SKILL.md`, `skills/redline-revise/SKILL.md`, `skills/setup/SKILL.md`: no reader-facing change (a pointer moved with its section; the behaviour is unchanged). `agents/redline-reviewer.md`, `agents/redline-plan-approver.md`: `CONTRIBUTING.md` "The Docs step" describes the reworded check.

## Task 6: Gate step 10, Docs, names docs/; restamp

**Files:** `.claude/commands/agent-os/shape-spec.md` (steps 10 and 11), `.claude/redline/checks.sh` (the stamp only, by `redline-gate.sh stamp`), `agent-os/standards/process/docs-gate.md` (Task 10 lands the standard edit in its own commit; this task changes only the gate).

1. Step 10's sentence "name the README section (and template, if any) that describes it" becomes "name the README section, or the `docs/` file and section (and template, if any), that describes it". The directory list is unchanged. Step 11's "see Contributing in the README" becomes "see Releases in `CONTRIBUTING.md`" (prose; no hash change from it alone).
2. The unattended section's point 7 (`shape-spec.md:45`) says "names the README section (and template, if any) it updates"; a hand edit of this repository's section (the template body has no README mention), so it becomes "names the README section, or the `docs/` file and section (and template, if any), it updates". Not a template change: `templates/shape-spec-unattended.md` carries no README or docs wording (verified by grep), and `tests/setup-test.sh:593-601` reads this checkout's section live as the hand-edit fixture, asserting that the phrase "gate step 10, Docs" survives a `--merge`; the edit keeps that phrase on the line, so the case stays green with no fixture change.
3. Restamp: `scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh`. `tests/gate-test.sh` (last case) and `tests/setup-test.sh` (regenerate and compare) go green together; `scripts/redline-gate.sh check .` exits 0.

**Docs entry:** `.claude/commands/agent-os/shape-spec.md` is not under a listed directory; `CONTRIBUTING.md` "The Docs step" describes the step.

## Task 7: Version bump

**Files:** `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`: `0.1.0` → `0.1.1`. `docs/scripts.md`'s opening line names 0.1.1. `tests/setup-test.sh`'s last cases (the two agree, semver) stay green; `claude plugin validate .` passes.

**Docs entry:** `.claude-plugin/`: no reader-facing change (the bump the Version step requires; `docs/upgrading.md` already says what a patch means).

## Task 8: CHANGELOG line

**File:** `CHANGELOG.md`: no entry for this PR (the entry is written at tag time, under the next tagged version, per `process/release`). Only the line-3 repoint from Task 3. Nothing else.

## Task 9: The walkthrough (done-when)

**With the person**, after Tasks 2–7, before the gate. On a scratch repository with stock Agent OS (`agent-os/` and `.claude/commands/agent-os/shape-spec.md` from an Agent OS install, not Chalkboard), the plugin installed from this checkout with `claude --plugin-dir`:

1. Follow `README.md` "Install" and "Quick start" and `docs/setup.md` literally, in a session on the scratch repository, running `/redline:setup`, adding the gate task as `docs/setup.md` describes it (the `checks.json` step and the stamp).
2. Record every point where the doc did not say what to do next, said something the tool contradicted, or named a path the reader could not find, in `shape.md` under "Walkthrough log", one line each with the doc and line.
3. Fix each in the doc, never by telling the reader. The scratch repository's files are not committed anywhere.
4. Verify as `docs/setup.md`'s Verify section says, with its paste-able commands: `tests/guard-test.sh` passing, `checks.sh --baseline` green, `redline-gate.sh check .` and `redline-setup.sh version .` exit 0.

**Docs entry:** none (doc edits only).

## Task 10: Standards retrospective (proposed)

Proposed edits, presented with AskUserQuestion at the gate, applied in their own commit:

- `agent-os/standards/process/internal-notes.md:6`: "`README.md` is the only long-form document here" → "`README.md`, `docs/` and `CONTRIBUTING.md` are the long-form documents here: the README for installation and use (what it is, requirements, install, quick start, the dials, the Files table, the git rules for agents, Known limits), `docs/` for the reference (setup, contract, running, guard, upgrading, scripts), `CONTRIBUTING.md` for CI, the Docs step and releases. A rationale goes to the internal repository; a rule goes to a standard (#14)".
- `agent-os/standards/process/docs-gate.md`: the title line and bullets 1, 4 and 6: "the README section, or the `docs/` file and section (and template, if any)"; a new bullet: "A section the setup template or the workflow names by heading (`Git rules for Redline agents`, `Known limits`, from `templates/claude-md-git-sentence.md` and `workflows/redline-loop.js`) stays in the README under that heading: moving it is a template change, a minor bump and a rerun in every repository; the `checks.sh` header's 'See README.md for the output contract' is the same kind, kept until the next `checks-template.sh` bump (#14)"; a second new bullet: "A change to `docs/` is reader-facing by nature and needs no Docs entry; a file under `scripts/` whose header `docs/scripts.md` quotes names `docs/scripts.md` in its entry when the header changes (#14)".
- `agent-os/standards/scripts/bash-conventions.md:10`: "The README quotes from it rather than restating it" → "`docs/scripts.md` quotes it verbatim, and `docs/contract.md` carries the output contract, so a header change updates `docs/scripts.md` and a contract change updates `docs/contract.md` in the same commit"; `:11`: "across `README.md`, `skills/` and `agents/`" → "across `README.md`, `docs/`, `skills/` and `agents/`".
- `agent-os/standards/process/release.md`: no change (patch bump is already the rule).
- Standards named in Task 1's `standards.md` as they read today; `index.yml` descriptions for `docs-gate` and `internal-notes` updated to match the new first lines.

## Task 11: Verification Gate

Run `.claude/redline/checks.sh --baseline` until it exits 0 (gate steps 1–9; the baseline is about 78 s). Then `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .` exit 0 (the stamp from Task 6, the versions from Task 7). Then:

- **Docs (step 10):** the Docs entries table below, each naming its commit or its reason.
- **Version (step 11):** `0.1.1` in both files (Task 7).
- **Standards retrospective (step 12):** Task 10 applied in its own commit, or "no changes" recorded.
- **Spec folder (step 13):** `plan.md`'s As built carries the confirmed section map (every old section with its commit and new heading), the walkthrough log's fixes, and any deviation; `shape.md` Decisions records each deviation.

Also run before the PR: `wc -l README.md` under 150; every relative link in `README.md`, `docs/*.md` and `CONTRIBUTING.md` resolves to a file and, where it has an anchor, to a heading in that file (check with `grep -o '](\.\{0,1\}/[^)]*)' README.md docs/*.md CONTRIBUTING.md` and open each); `grep -rn 'in the README\|README.md' agents skills workflows templates scripts CLAUDE.md CHANGELOG.md .claude/commands docs CONTRIBUTING.md` lists only the references the Context keeps (the git rules, Known limits, the `checks.sh` header sentence, the "its README and `docs/`" phrases).

### Docs entries

| File | README or docs/ section (and template) | Commit or reason |
| --- | --- | --- |
| `skills/redline/SKILL.md` | no reader-facing change: pointers moved with their sections, behaviour unchanged | Task 5's commit |
| `skills/redline-revise/SKILL.md` | no reader-facing change: pointer moved | Task 5's commit |
| `skills/setup/SKILL.md` | no reader-facing change: pointer moved | Task 5's commit |
| `agents/redline-reviewer.md` | `CONTRIBUTING.md` "The Docs step" | Task 3's commit, Task 5's commit |
| `agents/redline-plan-approver.md` | `CONTRIBUTING.md` "The Docs step" | Task 3's commit, Task 5's commit |
| `.claude-plugin/plugin.json`, `marketplace.json` | no reader-facing change: the patch bump the Version step requires | Task 7's commit |
| `skills/redline/SKILL.md` (the `review-only` summary, Task 9 item 3) | `docs/running.md` "Launching a run" | Task 9's commit |
| `scripts/`, `workflows/`, `templates/`, `hooks/` | not touched | — |

## Verification (how to test end to end)

1. `wc -l README.md` prints under 150, and GitHub's rendering of `README.md`, each `docs/*.md` and `CONTRIBUTING.md` is checked once on the PR branch (every link, every table).
2. The section map's every row has a destination heading that exists (open each file; the As built confirms it).
3. `.claude/redline/checks.sh --baseline` exits 0; `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .` exit 0; `claude plugin validate .` passes with the known icon warning.
4. The walkthrough of Task 9 on the scratch repository ends with `/redline:setup` complete, the gate stamped and `checks.sh --baseline` green there, with the log in `shape.md` empty of unfixed items.
5. Redline's round on the PR (the normal path) is asked, through the PR description, to check the section map against the old README (`git show main:README.md`) and report any section with no destination.

## Commits (the person makes them, in this order)

1. Spec folder (Task 1).
2. `docs/` files (Task 2).
3. `CONTRIBUTING.md` and the `CHANGELOG.md` repoint (Task 3).
4. The new README (Task 4).
5. The repointed references, CLAUDE.md, product (Task 5).
6. Gate step 10 and 11 wording, the unattended point 7 hand edit, the restamp (Task 6).
7. Version bump (Task 7).
8. Walkthrough fixes to the docs (Task 9), one commit.
9. Standards retrospective (Task 10), its own commit.
10. As built (Task 11).

## As built

Built on 2026-11-03 in the shaping session; the person makes the commits in the order above. The gate (`.claude/redline/checks.sh --baseline`) was green on its first run after the restamp, all nine checks exit 0; `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .` exit 0; every relative link and anchor in `README.md`, `CONTRIBUTING.md` and `docs/*.md` resolves (checked by script); `README.md` is 116 lines.

**Section map, confirmed.** Every row of the map above landed where it says, with these refinements:

- Intro: the "built and proven" sentence closes the loop paragraph. Requirements became a four-line list.
- Install: the teammates and `claude plugin list` detail is `docs/setup.md` "Install", as planned; the README's Install is the two commands and one sentence with links to `docs/upgrading.md` and `CONTRIBUTING.md`.
- Use: the README's Quick start lists six command forms (the alias forms first) and one line each on `review only`, `dry run` and `autopilot`; the full list and the paragraph on the words are `docs/running.md` "Launching a run".
- Settings: the interrupt table moved verbatim; scope, rounds and the revise model are a second four-row table under Dials. `redline.local.json`'s JSON shape is in `docs/contract.md`, and `docs/running.md` "Saved launch settings" points there instead of repeating it.
- Files: `hooks/hooks.json` and `scripts/redline-guard.sh` share one row, and the seven test harnesses share one row, so the table fits; each row keeps one clause and points to its docs/ file. Rows for `docs/` and `CONTRIBUTING.md`, `CHANGELOG.md` added.
- The guard: the role table is quoted from the script (the legend and `REDLINE_GUARD_TABLE` block), and the hook registration from `hooks/hooks.json`, both verbatim; the refusals moved as the README's bullets.
- `checks.sh`: the `redline-gate.sh` and `redline-background.sh` tables were dropped, as planned, with one sentence each pointing at the quoted header in `docs/scripts.md`; the "Long gates" paragraph stays in `docs/contract.md`.
- `redline-gh.sh`: the two tables were dropped for the quoted header; "Rules the agent follows around these" is `docs/running.md` "How the review is posted".
- Contributing: `CONTRIBUTING.md` also gained a "Specs and the gate" section (the shape-spec gate in one paragraph, from CLAUDE.md's Specs bullet) and a closing paragraph on guard changes and attribution, so a contributor reads the three repository rules in one place.

**Deviations from the plan.**

1. `docs/scripts.md`'s opening line does not say the header is what `<script> --help` prints: only `redline-gh.sh` and `checks-template.sh` take `-h|--help`. It says the header is the top of the file in the directory `claude plugin list` prints.
2. `docs/running.md` carries a "Hand-off and relaunch" section that restates each dial level's stopping point in prose (the README keeps the table), because the answer form, `relaunch` and the relayed line belong with it.
3. `docs/guard.md` quotes `redline-guard.sh`'s header and the role table, and `docs/scripts.md` quotes the other six scripts, as decision 11 says; `docs/guard.md`'s self-hosted section names `docs/` among the repository content the roles may write in place.
4. The standards retrospective was approved as proposed (all four edits); `shape.md` records it.

**Task 9, the walkthrough, done on 2026-11-04** on `fromtheoutfit/redline-walkthrough` (stock Agent OS, `--plugin-dir`), through `/redline:setup` with the gate task added as the doc now describes it, then a `dry run review only`. The log is under "Walkthrough log" in `shape.md`, five items; the fixes, commit 8:

- `README.md`: Requirements names the gate task and #70; Install says to commit `.claude/settings.json` before setup; Quick start step 1 says what must be committed first.
- `docs/setup.md`: a new section "The gate task" (the minimal two-step gate, its fill-ins, #70) before "Run `/redline:setup`"; Install, the run paragraph, step 1 and step 3 point at the clean tree and the gate task.
- `docs/running.md`: "Launching a run" says what a dry run commits (locally, unpushed) and what the next run finds (nothing: round 1, no carried findings); the review-only path is qualified to a posted round; "Earlier rounds" and "The run record" say the same in a clause each.
- `skills/redline/SKILL.md` line 167: the `review-only` summary gains the dry-run case, since the summary line was what the walkthrough found wrong (deviation 5). Docs entry above.

`README.md` is 116 lines after the fixes. The gate was rerun on 2026-11-04 after them: `.claude/redline/checks.sh --baseline` ok, all nine checks exit 0; `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .` exit 0; every relative link and anchor in `README.md`, `CONTRIBUTING.md` and `docs/*.md` resolves. The fixes sit in files that commits 2, 4 and 5 also carry (the docs, the README, the skill), so commit 8 exists as its own commit only when the person splits the hunks with `git add -p`; folded into those commits instead, the log above still names each fix.

**Deviations from the plan, continued.**

5. Task 9 fixed one sentence outside the docs, in `skills/redline/SKILL.md`: the review-only summary told the person the next run would carry the findings, which the workflow does only for a posted round. The doc alone would have contradicted the tool's own summary, so both were fixed; the entry is in the Docs entries table and the commit is Task 9's.

**Docs entries.** The table above stands: the skills' entries say "no reader-facing change" (pointers moved), the agents' entries name `CONTRIBUTING.md` "The Docs step", the manifest's entry is the patch bump; `scripts/`, `workflows/`, `templates/` and `hooks/` were not touched. The commits are the person's, one per task, titled at commit time.
