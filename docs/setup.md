# Setting up a repository

What `/redline:setup` reads, asks and writes, step by step, with the by-hand command behind each step. The plugin holds the tool (the skills, the workflow, the eight agents, the guard and the GitHub wrapper); each repository keeps its own contract, which the plugin never edits after setup. Every file below is described in [contract.md](contract.md). Where a command names `<plugin>`, it is the directory `claude plugin list` prints as `Read from:` for `redline@redline`; inside a Claude Code session the same directory is `${CLAUDE_PLUGIN_ROOT}`.

## Install

From the repository you want to use Redline in:

```bash
claude plugin marketplace add fromtheoutfit/redline
claude plugin install redline@redline --scope project
```

`--scope project` records `"redline@redline": true` under `enabledPlugins` in the repository's `.claude/settings.json`. Commit that file before `/redline:setup`: its preflight stops on anything uncommitted (step 1 below), and this edit is the one the install leaves behind. Teammates get the marketplace from the same file's `extraKnownMarketplaces` (the setup step below writes it) once they trust the folder, so they need no install command of their own (not yet tried on a second machine). `claude plugin list` shows the installed version; Claude Code moves users on the `version` in the plugin's manifest, not on the git tag, so an install stays on its version until you update it ([upgrading.md](upgrading.md)).

Requirements: Claude Code with dynamic workflows (proven on 2.1.303 to 2.1.316), `gh` 2.48.0 or newer signed in as the person who runs Redline (an older one stops the launch with a line naming both versions), `jq`, `python3`, and Agent OS in the repository with a Verification Gate task in `.claude/commands/agent-os/shape-spec.md` (the next section).

## The gate task

Setup reads the repository's gate out of `.claude/commands/agent-os/shape-spec.md` (step 3 below) and generates `checks.sh` from it, so the file must hold one: a heading whose text contains "Verification Gate", with a numbered list under it, one step per check, each command in backticks. Stock Agent OS ships `shape-spec.md` without one, and setup stops at step 3 until it is there (#70 makes the gate optional; today it is required). Before you run the command, append a section like this to the file, with the repository's own test command in step 1, and commit it:

````markdown
## Verification Gate

**A spec is not complete until every check below passes.** It is the final task of every plan.

1. **Tests** — `composer test` passes.
2. **Standards retrospective** — Check what the spec taught against the standards in `agent-os/standards/`; land approved edits in their own commit, or record "Standards retrospective: no changes" in the spec's `shape.md`.
````

One command step and the standards-retrospective step are the minimum: step 1 becomes the one check in `checks.json`, step 2 is a prose step, and the fill-ins setup writes in step 10 read `--gate-steps 1-1 --prose-steps "2" --retro-step 2`. Add a step per further command (a linter, a type check) the same way. The stamp covers every backticked span in the section, so a later edit to any of them is followed by a restamp ([contract.md](contract.md), "Gate stamp"). This repository's own gate, thirteen steps, is the full example: `.claude/commands/agent-os/shape-spec.md` here.

## Run `/redline:setup`

In an interactive Claude Code session, from the repository's root, on the default branch with a clean tree (the install's `.claude/settings.json` and the gate task committed), type `/redline:setup`. The skill (`skills/setup/SKILL.md`) does the fourteen steps below in order: it reads what it can off the repository, asks about the rest, writes the files on a branch, runs the baseline, stamps the gate, and hands back the file list with a suggested commit message. It never commits, stages or pushes; you do. A rerun on a repository that already has the contract follows the same steps and, for each, either reports "nothing drifted" or shows the diff and asks before writing. A headless session (`claude -p`) cannot run it: setup is a conversation.

### 1. Preflight

Read only. The repository root (`git rev-parse --show-toplevel`), the default branch, a clean tree (`git status --porcelain` prints nothing: the `.claude/settings.json` the install wrote is committed), `gh auth status`, `jq` and `python3` present, the `Workflow` tool available, and Agent OS present (`.claude/commands/agent-os/shape-spec.md` exists; without it setup stops, since #1 tracks repositories without Agent OS). Then an inventory of what is already there, so a rerun updates instead of duplicating: `checks.json` and `checks.sh` (with `redline-setup.sh version` and `redline-gate.sh check` when the latter exists), `redline.json`, `settings.json` and its retired allow entries, the `.gitignore` line, the unattended section and its version marker, the CLAUDE.md sentence and paragraph, and the two alias command files. It says in a few lines whether this is a fresh setup or a rerun.

### 2. Branch

Fresh: `git checkout -b feature/redline-setup` from the updated default branch. Rerun: the current branch when it is not the default, else `feature/redline-setup-rerun`.

### 3. Find the gate

```bash
<plugin>/scripts/redline-gate.sh extract .claude/commands/agent-os/shape-spec.md
```

prints the Verification Gate's steps with their backticked items (exit 1 when the file has no "verification gate" heading with a numbered list, or two: fix the file first; stock Agent OS has none, so add the gate task of "The gate task" above before you start). The skill proposes the **command/prose split**: a step whose items are commands that run as they stand becomes one check; an instruction to a person (the standards retrospective, a spec-folder check) is a prose step. For each command step you agree on a check name (`[a-z][a-z0-9-]*`, named for what it proves), the command verbatim from the gate, and whether it is recorded only (a formatter, which never fails the run). A command that expands a shell variable at run time is a `source` step; one that diffs the change against the PR's base is `kind: "base-diff"`. The skill cross-checks the commands against `CLAUDE.md`, CI and the `scripts` of `composer.json` and `package.json`, and puts every disagreement to you with its evidence; the gate text is what `checks.sh` transcribes, so an answer that changes a command is an edit to `shape-spec.md` you make. Three more answers: the formatter, a long-lived-process suite the workflow runs on demand (`REDLINE_OCTANE=1`; most repositories have none), and `alwaysAllowed` (files the gate regenerates and the tree tracks). Then the allow entries for `settings.json`, one `Bash(<prefix>:*)` per command step, proposed from each command's first words.

### 4. The environment against the lockfiles

Before any baseline, read only: `composer install --dry-run`, `npm ci --dry-run`, the built assets against the newest commit under `resources/`, and whether a browser suite needs a build first. Both hand ports lost a baseline to a stale `vendor/` or asset build. The skill offers the sync and runs only what you approve; the tree must be clean again afterwards.

### 5. `checks.json`, then `checks.sh`

`.claude/redline/checks.json` is the repository's gate as data (one entry per command step, plus the formatter, the long-lived suite, the regenerated files and the baseline time; its shape is in `redline-setup.sh`'s header, quoted in [scripts.md](scripts.md)), and `checks.sh` is generated from it, never edited by hand:

```bash
<plugin>/scripts/redline-setup.sh checks .claude/redline/checks.json .claude/redline/checks.sh
bash -n .claude/redline/checks.sh
<plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh --steps 1-7
```

The `--steps` range is the command steps from step 3, given here because the unattended section that would supply it is not in yet; step 10 stamps again without it as the cross-check. The baseline needs the stamp: a gate that tests its own stamp is red until then. On a rerun with a `checks.json`, the skill runs `redline-gate.sh check .` first: when the gate has not moved it regenerates (`changed: false` is "nothing drifted"); when the gate changed it shows what was added, removed or changed step by step, asks how each should read in `checks.json`, regenerates and restamps. A repository with a hand-written `checks.sh` and no `checks.json` is bootstrapped with `redline-setup.sh read-checks .claude/redline/checks.sh`, whose `input` field is a best-effort `checks.json`; the diff of the regenerated file is yours to accept.

### 6. Baseline

```bash
.claude/redline/checks.sh --baseline
```

run in the background with the wall time measured (a Laravel repository with a browser suite took 17.5 minutes). A red check guards nothing, so the skill stops for you while the baseline is red, with each failure classified (a stale environment, a key the suite needs that `.env` lacks, a real failure); what to change is the repository's call. When it is green, the wall time goes into `checks.json`'s `baseline` (`{"seconds": <n>, "date": "<YYYY-MM-DD>"}`) and `checks.sh` is regenerated, so the launch knows whether the gate fits in one foreground call ([contract.md](contract.md), "Long gates").

### 7. `redline.json`

The skill suggests a reviewer from the repository's merged PRs (never the person who runs Redline) and asks for the **ask rules** (#49): what a person is always brought in for, which Redline never fixes or defers on its own. `redline-setup.sh suggest-ask-rules .` reads `composer.json` and proposes the stack's (`config/project/**` for a Craft site, `database/migrations/*` for a Laravel application); you add path patterns or sentences of your own, each with an id and a one-line reason. Then:

```bash
<plugin>/scripts/redline-setup.sh config --reviewer <handle> --baseline-seconds <n> . --ask-rules <file>
```

derives `checker` and `checkerStallMs` from the baseline time, takes the rest from the template, and writes the rules. On a rerun it updates only those two values (and the rules when a different list is given) and keeps every other value as yours, listing each that differs from the template under `differs`; `--force` is the full reset.

### 8. `.claude/settings.json`

```bash
<plugin>/scripts/redline-setup.sh settings . --allow 'Bash(composer check:*)' --allow 'Bash(php artisan test:*)'
claude plugin install redline@redline --scope project
```

with one `--allow` per entry from step 3. The merge adds the marketplace, the plugin and the allow list without dropping a key or changing a value already there (`conflicts` names each kept value that differs from the template's). On a rerun, `stale` lists the entries earlier templates added that this one no longer carries; `--remove-stale` drops them on a yes.

### 9. `.gitignore`

```bash
<plugin>/scripts/redline-setup.sh gitignore .
```

adds `.claude/redline.local.json`, each person's saved launch settings, beside `.claude/settings.local.json`.

### 10. The unattended section, then the stamp

```bash
<plugin>/scripts/redline-setup.sh unattended .claude/commands/agent-os/shape-spec.md --gate-steps 1-7 --prose-steps "8 and 9" --retro-step 9 --no-pr-body
<plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh
```

The first inserts the `## Unattended mode (Redline)` section after the plan-mode check with the fill-ins applied (the command-step range, the prose steps as the sentence "Steps ... stay as written" should read, the retrospective's step number, and `--pr-body-standard <name>` when the repository has a standard that redrafts a stale PR description, else `--no-pr-body`), with the template's version marker as its first line. On a rerun it patches moved fill-ins in place (`--force`), or, for a section made from an older template body, shows the three-way view and merges the template's changes while keeping your hand edits (`--merge`, asking per conflicting line), or marks the section current as it stands (`--keep`); see [upgrading.md](upgrading.md). The second stamps again, this time taking the range from the section's own `(gate steps M to N` parenthetical, and must print the same line as step 5: the section sits outside the gate, so the hash does not move.

### 11. `CLAUDE.md`

Two edits from `<plugin>/templates/claude-md-git-sentence.md`, made with Edit after showing you the target lines: the sentence appended to the Git rule that keeps agents from committing, and the paragraph beside the attribution rule, when CLAUDE.md has one ([contract.md](contract.md), "The CLAUDE.md sentence"). Each is skipped when already present.

### 12. The short aliases

```bash
<plugin>/scripts/redline-setup.sh command . redline
<plugin>/scripts/redline-setup.sh command . redline-revise
```

copy `templates/command-redline.md` and `templates/command-redline-revise.md` to `.claude/commands/`, so `/redline <pr>` and `/redline-revise <pr>` work beside the namespaced commands (#44). The skill asks once, default yes. For a file already there it reports `unchanged`, `differs` (the diff shown; `--force` rewrites) or `foreign` (no `<!-- redline-alias:` marker line: a command of your own by that name, never written).

### 13. Verify

```bash
<plugin>/tests/guard-test.sh
.claude/redline/checks.sh --baseline
<plugin>/scripts/redline-gate.sh check .
<plugin>/scripts/redline-setup.sh version .
gh auth status
```

The guard table prints `N passed, 0 mismatched`; the baseline exits 0; `check` and `version` exit 0 (the stamp matches the gate; `checks.sh`, the unattended section and `settings.json` are at the plugin's versions); `gh` is signed in.

### 14. Hand back

The skill prints the files written or changed, the baseline result and wall time, the files to stage by name, and a suggested commit message (`Set up Redline for review and revise runs on pull requests`; on a rerun, `Bring the Redline contract up to date`) and PR title. Merge the setup PR first.

## Before the first real PR

Run a dry run on a seeded PR (a branch with planted bugs whose answer key lives outside the repository) to measure the reviewer's recall there: `/redline:redline <pr> dry run review only` posts and pushes nothing and writes every body under the round's spec folder. Three seeds so far found 7 of 7 in-function bugs on the right line and missed one race (the README, Known limits).

See also: [contract.md](contract.md) for each file, [running.md](running.md) for the first run, [upgrading.md](upgrading.md) for the rerun.
