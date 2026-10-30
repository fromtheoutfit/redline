---
name: setup
description: "Walk this repository through Redline's contract: /redline:setup, run interactively from the repository root. Reads what it can off the repository, asks about the rest, writes .claude/redline/checks.json and the generated checks.sh, redline.json, settings.json, the .gitignore line, the unattended section of shape-spec.md and the CLAUDE.md sentences, runs the baseline, stamps the gate, and hands back a file list and a suggested commit message. A rerun changes nothing when nothing drifted and shows each diff otherwise. Never commits. Use only when the person types /redline:setup."
argument-hint: ""
---

# /redline:setup

You walk one repository through Redline's per-repository contract, in conversation with the person, from the repository's root. Everything that can be scripted is: `${CLAUDE_PLUGIN_ROOT}/scripts/redline-setup.sh` does the edits (its header is the reference; the README's "Set up a repository" and `checks.sh` sections say what each file is for), `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gate.sh` finds the gate and stamps it. You do the reading, the asking and the explaining. You never commit, stage or push: the person does, with the message you suggest at the end.

The thirteen steps below are the issue's; do them in order. A **rerun** on a repository that already has the contract follows the same steps, and each one either reports "nothing drifted" or shows the diff and asks before writing. Everything you write is on a branch; nothing touches `.claude/settings.local.json` or the plugin's own files.

## 1. Preflight, read only

1. `git rev-parse --show-toplevel` is `repoRoot`; every path below is absolute from it. Not a repository: stop.
2. The default branch: `git symbolic-ref --short refs/remotes/origin/HEAD` (strip `origin/`), else `main`. `git rev-parse --abbrev-ref HEAD` must be that branch on a fresh setup (on a rerun, the current branch is fine when it is not the default and the tree is clean). `git status --porcelain` must print nothing. `git fetch`, then `git rev-list --count HEAD..origin/<default>`: when behind, offer `git pull --ff-only` and run it only on a yes.
3. `gh auth status` signed in; `jq --version` and `python3 --version` print; Claude Code has workflows (the `Workflow` tool exists in this session).
4. Agent OS present: `<repoRoot>/.claude/commands/agent-os/shape-spec.md` exists. If not, stop with one line: Redline needs Agent OS in the repository (#1 tracks repositories without it).
5. Inventory, so a rerun updates instead of duplicating; keep it for step 13:
   - `.claude/redline/checks.json` and `.claude/redline/checks.sh` (either, both, neither; `redline-setup.sh version <checks.sh>` and `redline-gate.sh check <repoRoot>` when `checks.sh` exists: their exit codes and lines);
   - `.claude/redline.json`; `.claude/settings.json`; the `.gitignore` line `.claude/redline.local.json`;
   - the `## Unattended mode (Redline)` heading in `shape-spec.md`;
   - the CLAUDE.md sentence (`When the prompt identifies the session as a Redline agent run`) and paragraph (`Redline labels its own work as "Redline"`).
6. `selfHosted`: true when `repoRoot` is the plugin itself (`cd <repoRoot> && pwd -P` equals `cd ${CLAUDE_PLUGIN_ROOT} && pwd -P`). It only changes the paths the generated `checks.sh` header names.

Say what you found in a few lines: fresh setup or rerun, and what exists.

## 2. Branch

Fresh setup: `git checkout -b feature/redline-setup` from the updated default branch (ask first if a branch of that name exists: reuse it or name another). Rerun: stay on the current branch when it is not the default; otherwise create `feature/redline-setup-rerun` the same way.

## 3. Find the gate

1. `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gate.sh extract <repoRoot>/.claude/commands/agent-os/shape-spec.md`. It exits 1 when the file has no "verification gate" heading with a numbered list, or two: say so, and stop until the person has fixed the file (the stamp needs exactly one).
2. Show the steps: number, title, the backticked items of each. Propose the **command/prose split**: a step whose items are commands that can run as they stand is a command step (one `run_check`); a step that is an instruction to a person (the standards retrospective, a spec-folder check, a review of a diff "for intent") is a prose step. This is a conversation, not a rule: the person confirms or moves a step, and the stamp hashes every backticked item of the whole section regardless of the split, so the split never changes the hash.
3. For each command step agree on: a **check name** (`[a-z][a-z0-9-]*`, named for what it proves: `check`, `tests`, `phpstan`, `snapshots`, `migrations`), the **command verbatim** from the gate (a step with several commands is one `run_check` with them joined by ` && `, in the gate's order), and whether it is **recorded only** (never fails the run: a formatter). A command that must expand a shell variable at run time (a scratch database name from an environment variable, the base ref) is a `source` step, written as it will appear inside the double quotes, and a step that diffs the change against the PR's base is `kind: "base-diff"` (the template's `base_ref` guard wraps it).
4. Cross-check the commands against `CLAUDE.md`, the `shape.md` template inside `shape-spec.md`, `.github/workflows/*.yml` and the `scripts` of `composer.json` and `package.json`. Put every disagreement to the person with its evidence, the gate text as the default. Two seen so far: a gate's serial `php artisan test --compact` includes a Browser suite that CI's `composer test` excludes, and CI passes `--memory-limit=2G` to PHPStan while the gate does not. Record the answer; the gate text is what `checks.sh` transcribes, so an answer that changes a command is an edit to `shape-spec.md` the person makes (it moves the hash, which the stamp in step 10 takes care of).
5. Three more answers: the **formatter** (the gate's repo-wide formatter step, if any, recorded only; when the gate has none, ask whether the repository has one it wants here and otherwise leave it out), **octane** (a separate long-lived-process suite the workflow runs on demand, `REDLINE_OCTANE=1`; most repositories have none), and **`ALWAYS_ALLOWED`** (files the gate regenerates and the tree tracks, such as a generated `openapi.json`; usually none). Any **variable** a `source` step expands (`vars`: name, environment variable, default, one-line doc).
6. The **allow entries** for `.claude/settings.json`: one `Bash(<prefix>:*)` per command step, proposed from the command's first words (`composer check`, `php artisan test`, `vendor/bin/phpstan`, `npm run type-check`), confirmed by the person. These let the implementer run the gate's commands outside `checks.sh`.

## 4. Environment against the lockfiles, before any baseline

A baseline against a stale environment is a baseline lost (one port lost 14 minutes to a `vendor/` behind its lockfile and a two-month-old asset build). Check what applies, read only:

- `composer install --dry-run` (anything it would install means `vendor/` is stale); `npm ci --dry-run`, or the packages the gate depends on (a pinned browser-test runner) against `package-lock.json`.
- Built assets: when `public/build` (or whatever the bundler writes) exists, compare its newest file's mtime with the newest commit touching `resources/` (`git log -1 --format=%ct -- resources/`); older means stale.
- Browser tests: when the suite has a Browser or end-to-end suite (a `testsuite` in `phpunit.xml`, a `tests/Browser` directory, a Playwright or Dusk dependency), the build must run before the baseline, or the suite tests a stale bundle.

Offer the sync (`composer install`, `npm ci`, `npm run build`) and run only what the person approves. Then `git status --porcelain` must be empty again: a build can regenerate tracked files; name each one and ask (commit it on the branch, or revert it) before going on.

## 5. Write `checks.json`, generate `checks.sh`

`.claude/redline/checks.json` is the source of truth; `checks.sh` is generated from it and never edited by hand. The JSON's shape is in `redline-setup.sh`'s header (`repo`, `gateFile`, `selfHosted`, `alwaysAllowed`, `vars`, `formatter`, `octane`, `baseline`, `steps`).

**Fresh setup.** Write `<repoRoot>/.claude/redline/checks.json` with the Write tool from step 3's answers: `repo` is a short phrase naming the repository (the header reads "Redline gate for <repo>"), `gateFile` is `.claude/commands/agent-os/shape-spec.md` (repository-relative), `baseline` is `null` until step 6, each step has its gate step number, name, `recorded` and `cmd` (or `source`), and a `title` taken from the gate step's title. Then:

```
${CLAUDE_PLUGIN_ROOT}/scripts/redline-setup.sh checks <repoRoot>/.claude/redline/checks.json <repoRoot>/.claude/redline/checks.sh
bash -n <repoRoot>/.claude/redline/checks.sh
```

The script exits 2 naming every problem in the JSON. Show the person the generated check block (`sed -n '/^if \[\[ "\$mode" != "git-only"/,/^fi$/p'`). Then stamp it, with the command-step range from step 3, since the unattended section that would supply the range is not in yet:

```
${CLAUDE_PLUGIN_ROOT}/scripts/redline-gate.sh stamp <repoRoot>/.claude/commands/agent-os/shape-spec.md <repoRoot>/.claude/redline/checks.sh --steps <m>-<n>
```

The baseline in step 6 needs it: a gate that tests its own stamp (this plugin's does) is red until then, and step 10 stamps again without `--steps` as the cross-check.

**Rerun with a `checks.json`.** When step 1's `version` reported `newer: true`, stop here: `checks.sh` was made from a newer template than this plugin ships, and regenerating would take it back; say to update the plugin and rerun. First `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gate.sh check <repoRoot>`:

- exit 0 (the gate has not moved): regenerate with the same `checks` command. `changed: false` is "nothing drifted". `changed: true` means the template or the generator moved since the file was written (an `emit_checks` port, say): show `git diff .claude/redline/checks.sh` and ask; a no reverts the file with `git checkout -- .claude/redline/checks.sh`.
- exit 1, "gate changed": compare the `extract` output's per-step commands with `checks.json`'s steps and show what was added, removed or changed, step by step. Ask how each should read in `checks.json` (a new step gets a name as in step 3), write the answer into `checks.json` with Edit, regenerate, and restamp with the `stamp` command above (the section's range is updated in step 10, which stamps again). Never edit `checks.sh` to settle a difference.
- exit 1, "no stamp" or any other reason: say the line, regenerate as above, and stamp as above.

**Rerun on a hand-written `checks.sh` with no `checks.json`** (a repository set up before `/redline:setup` existed): bootstrap the JSON:

```
${CLAUDE_PLUGIN_ROOT}/scripts/redline-setup.sh read-checks <repoRoot>/.claude/redline/checks.sh
```

Its `input` field is a best-effort `checks.json`: the `run_check` lines with their gate step numbers and titles from the comments above them, the formatter and octane blocks, the `base_ref` guard, the variables and `ALWAYS_ALLOWED`, and `repo`, `gateFile` and `baseline` when the header carries them (fill what is null by asking). Write it to `checks.json`, show it, regenerate, and show `git diff .claude/redline/checks.sh`: the header prose and comments become the generator's, and the template's current functions replace the old ones. That diff is the person's to accept; on a no, revert both files and stop here.

## 6. Baseline

Run the gate once, in the background, since it may outlast the Bash tool's ten minutes (a Laravel repository with a Browser suite took 17.5):

```
<repoRoot>/.claude/redline/checks.sh --baseline
```

with `run_in_background` and `date +%s` before and after for the wall time. Watch it: minutes with no new stderr line and the test process at 0% CPU (`ps -o %cpu,etime,command -p <pid>`) is a hang, not a slow suite. Stop it, say which suite it was in from the last output, and do not wait out the timeout; the person decides (a mismatched browser runner has been the cause once).

Read the JSON: `ok`, and for each check with `exit != 0` its name and the failing lines. Classify every failure with evidence before saying anything: a stale environment (step 4 missed something), a key the suite needs that `.env.example` leaves empty and the machine's `.env` lacks (`grep` the test for `env(`), or a real failure. **Stop for the person while the baseline is red**: a red check guards nothing, and what to change is the repository's call, not yours. Do not go on to step 7 until it is green.

When it is green, record the wall time: set `checks.json`'s `baseline` to `{"seconds": <n>, "date": "<today, YYYY-MM-DD>"}` with Edit (add a short `note` when one line explains where the time goes), regenerate `checks.sh` with the `checks` command from step 5, and say the time. On a rerun whose baseline is within a minute of the recorded one, leave it as recorded.

## 7. `redline.json`

Suggest a reviewer: `gh pr list --state merged --limit 30 --json reviews --jq '[.[].reviews[].author.login] | group_by(.) | map({login: .[0], n: length}) | sort_by(-.n) | .[0:3]'`, the most frequent first, and ask (the reviewer must not be the person who will run Redline).

Then the **ask rules** (#49): what a person is always brought in for, which Redline never fixes or defers on its own (a finding under one comes back as a judgment call naming the rule, the guard refuses the write, and the handoff lists it as the person's). Run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-setup.sh suggest-ask-rules <repoRoot>`: it reads `composer.json` and prints a suggestion with its evidence for a Craft site (`config/project/**`, applied through the control panel) and for a Laravel application (`database/migrations/*`). Present each with its `because` and ask whether to keep it, then ask what else the repository has: a path pattern (`paths`: globs, `**` across directories, matched against the repository-relative path) or a sentence the shaper judges (`prose`: "the change alters what a customer is charged", "the change adds or edits user-facing copy"), each with an id (`[a-z][a-z0-9-]*`, unique) and a one-line reason written for the person who will read it in a review. A rule must not cover `agent-os/specs/`, where Redline writes. On a rerun, the file's list is shown by the `config` dry run below (`askRules`); keep it unless the person changes it. When the list is new or changes (a rule added, edited or removed), write the whole list with the Write tool to `${TMPDIR:-/tmp}/redline-ask-rules.json` as a JSON array of `{id, when, reason}` and pass it as `--ask-rules`; when the person removes every rule, that list is `[]`, which clears the file's `askRules` (the dry run lists it under `updated.askRules`). Omit the flag only when the file's list stays as it is, or when there is none and the person adds none: without the flag `config` keeps the file's `askRules` as they are. Then:

```
${CLAUDE_PLUGIN_ROOT}/scripts/redline-setup.sh config --reviewer <handle> --baseline-seconds <n> <repoRoot> [--ask-rules <file>]
```

It derives `checker` (`git-only` over five minutes, else `full`) and `checkerStallMs` (1.7 times the baseline, rounded up to five minutes, never below 300000), keeps `maxRounds` 3, `push` true and the models as the template, and writes `askRules` when given. On a rerun it updates only `checker`, `checkerStallMs` and, when `--ask-rules` gives a different list, `askRules`, and keeps every other value, the reviewer included, as the person's: pass `--dry-run` first, show `updated` (the values it would change), `differs` (the values it keeps that differ from the template's) and `askRules` (the file's rules, kept as they are without the flag), and on a yes run it without `--dry-run`. `--force` rewrites the whole file from the template and drops every hand-set value, the rules included unless `--ask-rules` is passed again; use it only when the person asks for that reset. On exit 1, a derived key could not be updated in place: show the stderr line and `differs`, and offer `--force`. On exit 2 naming a rule, fix the list and run again.

## 8. `.claude/settings.json`

```
${CLAUDE_PLUGIN_ROOT}/scripts/redline-setup.sh settings <repoRoot> --allow '<entry>' ... [--dry-run]
```

with one `--allow` per entry from step 3.6. It merges `templates/settings.allow.json` without dropping a key and appends what is missing. It keeps every value already in the file: show `conflicts` (each `path` with the file's value and the template's) on every run, and say the file's value was kept; taking the template's is a hand edit the person makes. On a rerun pass `--dry-run` first and show `added`, `keysAdded` and `conflicts` before writing. Then `claude plugin install redline@redline --scope project`, which records the plugin as enabled (it may reorder the file's keys; the next rerun reads it as unchanged). Never read or write `settings.local.json`.

## 9. `.gitignore`

`${CLAUDE_PLUGIN_ROOT}/scripts/redline-setup.sh gitignore <repoRoot>`: adds `.claude/redline.local.json` after `.claude/settings.local.json`, else after the last `.claude/` entry, else at the end; `changed: false` on a rerun.

## 10. `shape-spec.md`, then the stamp

```
${CLAUDE_PLUGIN_ROOT}/scripts/redline-setup.sh unattended <repoRoot>/.claude/commands/agent-os/shape-spec.md --gate-steps <m>-<n> --prose-steps "<text>" --retro-step <n> (--pr-body-standard <name> | --no-pr-body)
```

- `--gate-steps`: the command steps' range from step 3 (`1-7`); `--prose-steps`: the prose steps as the sentence "Steps ... stay as written" should read (`8 and 9`, or `4`); `--retro-step`: the standards retrospective's step number; `--pr-body-standard`: the repository's standard that tells an agent to redraft a stale PR description as `pr-body.md`, when it has one (look under `agent-os/standards/`), else `--no-pr-body`.
- Fresh: the section goes in after the plan-mode check under Prerequisites. Then check the section's "Steps 1 to 5" and "Step 6's slug rule" against the file's own `### Step N` headings and say whether they match; when they do not, tell the person which numbers to change (the section is theirs to edit).
- Rerun: `changed: false` is "nothing drifted". Exit 1 with `differs` means the fill-ins moved (a new gate step): show them and, on a yes, rerun with `--force`, which patches those phrases in place and keeps every other line of the section.

Then stamp again, this time without `--steps`, so the range comes from the section's `(gate steps M to N` parenthetical:

```
${CLAUDE_PLUGIN_ROOT}/scripts/redline-gate.sh stamp <repoRoot>/.claude/commands/agent-os/shape-spec.md <repoRoot>/.claude/redline/checks.sh
```

It prints the line it wrote, which must equal step 5's: the section was inserted outside the gate, so the hash is the same, and the range is the same when the section agrees with step 3's split. A different range means the two disagree; settle it with the person and run `unattended` again with `--force`. On a rerun whose gate did not move the line is unchanged (no diff).

## 11. `CLAUDE.md`

From `${CLAUDE_PLUGIN_ROOT}/templates/claude-md-git-sentence.md`: append the sentence to the Git rule that keeps agents from committing, and add the paragraph after the rule that forbids AI attribution. Show the target lines first, then Edit. Skip each that is already present (step 1's inventory). When CLAUDE.md has no such rule, ask whether to add the sentence as its own bullet under a Git heading, or the paragraph at all (it only matters where attribution is forbidden).

## 12. Verify

From the repository: `${CLAUDE_PLUGIN_ROOT}/tests/guard-test.sh` prints `N passed, 0 mismatched`; `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gate.sh check <repoRoot>` exits 0; `${CLAUDE_PLUGIN_ROOT}/scripts/redline-setup.sh version <repoRoot>/.claude/redline/checks.sh` exits 0; `jq . <repoRoot>/.claude/redline.json` and `jq . <repoRoot>/.claude/redline/checks.json` parse; the baseline was green in step 6; `gh auth status` signed in.

## 13. Hand back

Print, in this order: the files written or changed (`git status --porcelain`, `checks.json` among them), the baseline result and wall time, and a suggested commit message and PR title:

- commit: `Set up Redline for review and revise runs on pull requests` (a rerun: `Bring the Redline contract up to date`), and the files to stage by name;
- PR title: `Set up Redline`.

On a rerun that changed nothing, say "nothing drifted" and list what was checked. Then recommend: merge the setup PR first, then `/redline:redline <pr> dry run review only` on a real PR before the first real run. **You never commit, stage or push.**

## Rules

- You write only the files named above, through the scripts where one exists (the ask rules reach `redline.json` only through `config --ask-rules`), and never `.claude/settings.local.json` or anything under `${CLAUDE_PLUGIN_ROOT}`.
- Nothing you write names a model, a vendor or an AI assistant; Redline labels its own work as Redline.
- A headless session (`claude -p`) has no `AskUserQuestion`: stop in step 1 with one line saying setup is interactive.
- The repository's CLAUDE.md Git section stands: no commit, no push, no staging.
