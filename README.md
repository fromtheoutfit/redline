# Redline

Redline is a Claude Code plugin for one command, `/redline:redline <pr>`. It reviews a pull request, posts one review per round, fixes what it found through Agent OS (shape a spec, approve the plan, implement one commit per finding, check), pushes, replies in each finding's thread, and re-reviews the fix diff until a round finds no correctness bugs. Then it requests review from a teammate. A finding that needs a product or design decision comes back to you in the session instead of being decided by an agent, and an interrupt dial sets how often the run stops for you, from never to after every review. Every decision is posted with its owner. The author runs it on their own PR; the second developer's review stays in place.

It was built and proven end to end on seeded pull requests in a production Laravel application before it was packaged as a plugin.

This file is the part an agent or a teammate needs at hand while a run is going: how to install and set up Redline, how it commits, what `checks.sh` emits, what `redline-gh.sh` can do, and what the snapshot file looks like.

## Install

Redline is its own marketplace. In a terminal, from the repository you want to use it in:

```bash
claude plugin marketplace add fromtheoutfit/redline
claude plugin install redline@redline --scope project
```

`--scope project` records `"redline@redline": true` under `enabledPlugins` in the repository's `.claude/settings.json`, which you commit. Teammates get the marketplace from the same file's `extraKnownMarketplaces` (see `templates/settings.allow.json`) once they trust the folder, so per the plugin docs they need no install command of their own (not yet tried on a second machine). To try a local checkout instead, add the marketplace by path (`claude plugin marketplace add /path/to/redline`); the plugin then loads in place, and edits take effect at the next session start.

This repository is itself set up the same way (`.claude/redline/checks.sh`, `.claude/redline.json`, the allow list, Agent OS under `.claude/commands/agent-os/` and `agent-os/`), so a Redline pull request gets a Redline review; see "The guard" for what that changes.

Requirements: Claude Code with dynamic workflows (proven on 2.1.303 and 2.1.304), `gh` 2.48.0 or newer (`gh api --slurp`; an older one stops the launch with a line naming both versions) signed in as the person who runs Redline, `jq`, `python3`, and Agent OS in the repository.

## Upgrading

A launch now refuses a `checks.sh` that carries no gate stamp (see "Gate stamp" under `checks.sh` below). A repository set up before the stamp existed is stamped once, by hand, from its root:

```bash
<plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh
```

It prints the line it wrote. Change the `-h|--help` line of `checks.sh` from its numeric `sed -n '2,NNp'` range to `sed -n '2,/^$/p'` at the same time (the inserted line shifts the header, and `stamp` warns when it does), then commit both. A PR branch cut before that commit reached its base carries no stamp, and a launch on it stops with the same line: merge the base into the branch, or stamp it on the branch and commit and push, before launching on it. Or run `/redline:setup` from the repository's root (see "Set up a repository"): on a repository whose `checks.sh` was written by hand it bootstraps `.claude/redline/checks.json` from the file (`redline-setup.sh read-checks`), regenerates `checks.sh` from the current template, which brings the version line and the template's current functions with it, shows you the diff to accept, and stamps it.

## Set up a repository

The plugin holds the tool: the skills, the workflow, the eight agents, the guard and the GitHub wrapper. Each repository keeps its own contract, which the plugin never edits. `/redline:setup`, typed from the repository's root in an interactive session, writes it: the skill (`skills/setup/SKILL.md`) reads what it can off the repository, asks about the rest, writes the files below on a branch, runs the baseline, stamps the gate, and hands back the file list with a suggested commit message. It never commits. A rerun on a repository that already has the contract changes nothing when nothing drifted and shows each diff before writing. The scriptable parts live in `scripts/redline-setup.sh` (see its table below), so by hand the same steps are, in this order:

1. **`.claude/redline/checks.json`, then `.claude/redline/checks.sh`**: the repository's gate as data (one entry per command step: the gate step number, a check name, the command verbatim, whether it is recorded only; plus the formatter, the long-lived suite, the files the gate regenerates, and the baseline time) and the script generated from it: `redline-setup.sh checks .claude/redline/checks.json .claude/redline/checks.sh`. `checks.sh` is never edited by hand: a change to the gate is an edit to the JSON and a regenerate. Its header ends with the template version line and the gate stamp, written in step 5.
2. **`.claude/redline.json`**: the round cap, the teammate to request review from, the checker mode and stall timeout, the models, and optionally `maxFiles`, the most changed files a PR may have before the launch refuses it with "split the PR" (no cap when absent): `redline-setup.sh config --reviewer <handle> --baseline-seconds <n> .` derives the checker mode and the stall from the baseline time and takes the rest from `templates/redline.json.example`. On a rerun it updates only those two values in an existing file and keeps every other value, the reviewer included, as the person's, listing each that differs under `differs`; `--force` rewrites it from the template.
3. **`.claude/settings.json`**: the marketplace, the plugin enabled, and the allow list for what runs outside a guarded role: `redline-setup.sh settings . --allow 'Bash(<command prefix>:*)' ...` merges `templates/settings.allow.json` without dropping a key or changing a value already there (each one that differs from the template's is reported under `conflicts`) and adds one entry per gate command (a Laravel repository might add `composer check`, `php artisan test`, `vendor/bin/pest`), then `claude plugin install redline@redline --scope project`.
4. **`.gitignore`**: `redline-setup.sh gitignore .` adds the line `.claude/redline.local.json`, beside `.claude/settings.local.json`. That file holds each person's saved launch settings (see "Settings") and is never committed.
5. **`.claude/commands/agent-os/shape-spec.md`**: an "Unattended mode (Redline)" section, so the shaper can follow shape-spec with nobody to ask: `redline-setup.sh unattended <file> --gate-steps <m>-<n> --prose-steps "<text>" --retro-step <n> --no-pr-body` inserts `templates/shape-spec-unattended.md` after the plan-mode check with the fill-ins applied (a rerun patches the fill-ins in place and keeps the rest). Then stamp `checks.sh`: `<plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh` replaces the header's `# redline-gate: TODO` line with the gate's hash, taking the step range from point 7's `(gate steps M to N` parenthetical (see "Gate stamp"); before the section exists, `--steps <m>-<n>` gives the range, which is how the skill stamps in its step 5 so the baseline can run. The unattended section sits outside the gate, so adding it never moves the hash.
6. **`CLAUDE.md`**: one sentence in the Git section, and one paragraph beside the attribution rule, from `templates/claude-md-git-sentence.md`.
7. **Verify**, from the repository: `<plugin>/tests/guard-test.sh` all passing, `.claude/redline/checks.sh --baseline` green, `<plugin>/scripts/redline-gate.sh check .` and `<plugin>/scripts/redline-setup.sh version .claude/redline/checks.sh` exiting 0, `gh auth status` signed in.
8. **Dry run.** Before the first real PR, run a dry run on a seeded PR (a branch with planted bugs whose answer key lives outside the repository) to measure the reviewer's recall there.

Before the baseline, check the environment against the lockfiles (`composer install --dry-run`, `npm ci --dry-run`) and the built assets against the newest change under `resources/`; with a browser suite, build first. Both hand ports lost a baseline to a stale `vendor/` or asset build, which is why the skill's step 4 does this before anything runs.

## Use

Check out the PR's branch, clean, at the pushed head, and type the command from a message that holds only the command:

```
/redline:redline 21
/redline:redline 21 max 2 rounds
/redline:redline 21 revise fable no push
/redline:redline 21 reviewer @sam
/redline:redline 21 autopilot
/redline:redline 21 plan correctness only
/redline:redline 21 review
/redline:redline 21 dry run review only
/redline:redline-revise 21 review @sam
```

The words can come in any order. `dry run` posts and pushes nothing: every body is written under the round's spec folder instead, and the PR may be closed (a seed). The first launch in a repository asks for the settings it was not given on the command line, and later launches confirm the remembered ones in one question; see "Settings". `/redline:redline-review` and `/redline:redline-revise` are the two halves on their own, for debugging.

`/redline:redline-revise <pr> review <id | @login | latest>` is the pass after the hand-off: a teammate's review comments become the findings (`H<n>-<k>`, one pass per launch, numbered after the `Redline human review` passes already on the PR). `review @login` takes every inline comment by that login (matched in any case) that no Redline reply has answered yet, replies inside Redline threads included, plus the newest of their review bodies that no Redline human review comment has answered yet (one body per pass, so an older one comes up on the next pass); `review <id>` takes that review's unanswered comments and its body, unless a Redline human review comment has already answered it; `latest` is the newest review that is not Redline's, not the author's, and still has an unanswered comment or body. A clear instruction is fixed, `decided by: @<login>`; a question, a disagreement or a comment the shaper cannot turn into one change comes back to you as a judgment call with the comment quoted, and the reply says what you decided; a comment that asks for nothing gets "no change requested". Nothing a teammate asked for is deferred by Redline on its own. After the fixes are pushed and every thread answered, the reviewer reads the fix diff once as the next `Redline round`, a correctness bug it finds gets one more fix pass, and the pass ends with one summary line on the PR: no handoff comment, no review request, the teammate is already there. The interrupt dial applies; the scope does not.

## Settings

Four settings shape a run besides the PR number. Each can be typed on the command line; otherwise it comes from the saved file, then from the defaults.

### The interrupt dial

`interrupt` says where the run stops for you. Each level is a stopping point the loop already has.

| Word | Stops | What you do there |
| --- | --- | --- |
| `autopilot` | Never | Nothing. At a judgment call the shaper's recommendation becomes the decision, attributed `redline (autopilot)`, and the run goes on |
| `guided` (default) | Only when the shaper returns a judgment call (`ask`) | Answer the calls, one at a time, in the session; the run relaunches with the decisions |
| `plan` | After shaping, every round | See every finding's disposition (fix, defer, ask) with the shaper's one-sentence recommendation. Approve as-is, change a disposition to fix, defer or accept, or answer an ask; the run relaunches and stops again after the next round's shaping |
| `review` | After the round 1 review is posted | Pick the findings to act on; each one not picked is dropped with a reason, which is posted in its thread. Later rounds stop as `guided` does |
| `review only` | After the round 1 review | Nothing is revised |

`autopilot` and `review only` are per-run verbs: they are never saved.

### Scope

`correctness only` sets `scope` to `correctness`: the reviewer is told not to look for nits at all, and a round with no correctness finding is done, with no final nit pass. The default, `all`, reviews for correctness bugs and nits, and a round of nits ends in one final nit pass over the nit fixes.

### Saved preferences

`.claude/redline.local.json` in the repository (ignored by git, so per person per repository) remembers `interrupt`, `revise` (the model id), `maxRounds` and `scope`:

```json
{"interrupt": "guided", "revise": "claude-opus-5-5", "maxRounds": 3, "scope": "all"}
```

- **No saved file.** The skill asks one `AskUserQuestion` for every setting not typed on the command line (up to four fields), with the defaults first: guided, Opus 5.5, 3 rounds, all. A `review only` run asks only for the scope, since no revise agent starts.
- **A saved file.** One confirm question whose first option reads `Run with: <interrupt> · <model> · <N> rounds · <scope>` (a value typed on the command line overrides the saved one and is marked `(command line)`), and whose second option, "Change something", re-asks the fields that were not typed.
- **Whatever the run uses becomes the saved set**, however it was chosen, except `autopilot` and `review only`, which are never written: the previous saved interrupt stays.
- **A hand-off relaunch asks nothing** beyond the existing "Relaunch with these decisions / Let me change one" confirm.

The merge rules live in `scripts/redline-prefs.sh` (`resolve` prints the effective settings, what to ask and the confirm line; `save` writes the file), and `tests/prefs-test.sh` is their unit test. The file is one of Redline's own: the guard refuses it for every role, and only the skill writes it, through the script.

### Decided by

Every decision is posted with its owner. Each Decision in a round's `shape.md`, each reply in a finding's thread, and each line of the handoff comment's Decisions list ends with one of:

- `decided by: redline`: the shaper settled it from the evidence (a fix, a defer, an answer the PR description or the code already gave);
- `decided by: @<login>`: a person decided it at a hand-off (the login `redline-gh.sh login` prints), with their reasoning restated in one sentence;
- `decided by: redline (autopilot)`: the run took the shaper's recommendation on autopilot;
- `decided by: @<reviewer login>`: a teammate asked for the change in their review, and a human review pass (`/redline:redline-revise <pr> review ...`) made it as asked.

The handoff comment lists every decision of the run, not only the human ones. The shaper's JSON carries `decidedBy` per finding (`redline` or `pending`; `reviewer` for a fix in a human review pass); the workflow fills `@<login>` from `args.login` for the answers a person gave and `@<reviewer login>` for the teammate's instructions.

## Files

| Path in the plugin | What |
| --- | --- |
| `skills/redline/SKILL.md` | `/redline:redline`: parses the arguments, settles and saves the settings, prechecks (the gate stamp first, then the template version), writes the start snapshot, launches `redline:redline-loop`, handles hand-offs (decisions, a plan to approve, findings to pick) and the deferred list. `redline-review` beside it is the review half on its own; `redline-revise` is the revise half on its own and, with `review <selector>`, the human review pass |
| `skills/setup/SKILL.md` | `/redline:setup`: walks a repository through the contract in conversation, in the thirteen steps of #6; see "Set up a repository" |
| `workflows/redline-loop.js` | The loop: phases, done rule, final nit pass, cap, the interrupt dial's stopping points, decision owners, the pass/fail decision from the checker's JSON, the stop on a checker result the implementer cannot change, and the human review pass (`args.revise.kind: "human"`). Runs as `redline:redline-loop` |
| `agents/redline-*.md` | The eight roles: reviewer, shaper, resolve, plan-approver, standards-approver, implementer, checker, github. They load as `redline:redline-<role>` |
| `hooks/hooks.json` | One `PreToolUse` hook on Bash, Write, Edit, MultiEdit and NotebookEdit, calling the guard |
| `scripts/redline-guard.sh` | The per-role guard; see below |
| `scripts/redline-gh.sh` | Every GitHub call; see below |
| `scripts/redline-prefs.sh` | The saved launch settings: the merge rules behind `.claude/redline.local.json`; see "Settings" |
| `scripts/redline-gate.sh` | The gate stamp: `extract` parses a repository's Verification Gate, `stamp` writes its hash into `checks.sh`, `check` compares the two at launch; see "Gate stamp" under `checks.sh` |
| `scripts/redline-background.sh` | A long gate run in the background: `start` runs the repository's `checks.sh` and keeps what it prints, `wait` hands it back in waits that fit the Bash tool; see "`redline-background.sh`" |
| `scripts/redline-setup.sh` | The scriptable parts of setup: the `settings.json` merge, the `.gitignore` line, the unattended section, `redline.json` from the baseline time, `checks.sh` generated from `checks.json` and read back, the template version; see "`redline-setup.sh`" |
| `scripts/checks-template.sh` | What `checks.sh` is generated from (and the starting point for a hand copy) |
| `templates/` | The per-repository files above |
| `tests/guard-test.sh`, `tests/guard-cases.tsv` | The guard's regression table |
| `tests/gh-test.sh`, `tests/gh-fixtures/` | The unit test of `redline-gh.sh`'s read subcommands (`files`, `diff`, `place`, `last-round`, `has-review`, `human-review`, `last-human-review`) against a fake `gh` that serves the fixtures, with a two-page, 150-file PR, a 60,000-line patch and a PR with a teammate's review |
| `tests/loop-test.mjs` | A mock harness for the workflow: runs `redline-loop.js` with scripted agents and checks each dial level, the scope, the owners, the replay rule, the run-record commit and the human review pass (`node tests/loop-test.mjs`) |
| `tests/prefs-test.sh` | The unit test of the settings merge rules |
| `tests/gate-test.sh`, `tests/gate-fixtures/` | The unit test of the gate stamp, on one synthetic `shape-spec.md` per gate shape seen so far; its last case checks this repository's own stamp |
| `tests/setup-test.sh`, `tests/setup-fixtures/` | The unit test of `redline-setup.sh`; its last cases regenerate this repository's own `checks.sh` from its `checks.json` and compare |
| `tests/background-test.sh` | The unit test of `redline-background.sh`, against a stub `checks.sh` in a throwaway repository: results passed through as printed, still running, past the limit, a run that died or never started, a rerun under the same label |

## The guard

A plugin's agents cannot carry their own hooks (Claude Code ignores `hooks`, `permissionMode` and `mcpServers` in a plugin agent's frontmatter), so the guard is a plugin hook. A plugin hook fires on every matching tool call in every session where the plugin is enabled, so the guard first reads `agent_type` from the hook input. Claude Code sets it to `redline:redline-<role>` inside a Redline agent (`redline-<role>` for a copy installed into `.claude/agents/`). Anything else, or no `agent_type` at all (the main session), is not a Redline role: the guard exits 0 with no output, and the call goes on as if the hook were not there.

For a Redline role it is a default-deny allowlist, in a table at the top of the script: the commands each role may run, and the paths it may write. Redline's own files are refused for every role: the plugin's directory, `.claude/redline/`, `.claude/redline*.json`, `.claude/settings*.json`, and the `.claude/{agents,workflows,skills}/redline*` copies an install into `.claude/` would add. The rest of `.claude/` is ordinary content the implementer may write when the plan names it. When the repository is the plugin (this checkout loaded in place, Redline reviewing itself), the plugin's directory is the repository, so `agents/`, `scripts/`, `workflows/`, `skills/`, `tests/`, `templates/` and the README are repository content under the roles' usual prefixes; `.claude/`'s Redline files stay refused, and so do `scripts/redline-guard.sh` and `hooks/hooks.json`, the guard that vets the run, which a person changes. What the guard allows it also approves (a `PreToolUse` `allow`), so a Redline role never stops at a permission prompt for a vetted command, and no git write rule has to sit in the shared settings where every other session would get it too. It needs `python3` and `jq`.

`tests/guard-test.sh` feeds every case in `tests/guard-cases.tsv` to the guard as the hook input Claude Code would send and prints the decisions as a table. Run it from a repository that uses Redline; from the plugin's own checkout it uses an empty repository under `~/.cache/redline/` for the rows that need a repository that is not the plugin. The rows after a `# @cwd PLUGIN` line run from the checkout itself, as the self-hosted case. Set `REDLINE_GUARD_LOG=<file>` in the environment Claude Code starts from to log every decision, inert ones included.

## Launching

`/redline:redline <pr>` is typed in an interactive session; the workflow runs in the background and the session waits for it. The precheck prints the PR's file count from GitHub and warns when the local diff against the base counts differently; above 300 files it warns that GitHub's whole-PR diff is unavailable there (Redline reads per-file patches instead, so inline anchoring still works, except in a file whose patch GitHub omits), and above `maxFiles` in `redline.json` it refuses. A PR that already carries posted Redline rounds gets its next number: the precheck reads the highest posted round (`redline-gh.sh last-round`) and the run starts after it, so every finding of the new run gets its own review and threads instead of being skipped as already posted. A headless session (`claude -p`) stops background tasks ten minutes after its last turn, which kills a run mid-phase, so it is started with `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`. A run the harness stopped is resumed from the session that launched it: the skill relaunches with byte-identical `args`, no new `decisions`, and `resumeFromRunId` set to the run id; finished agents replay from cache and the interrupted one reruns. A hand-off relaunch works the same way, adding only what the stop asked for (`decisions`; `approvedPlans` for the plan dial; `selected` for the review dial), so every prompt before the stopping point replays from cache.

## Known limits

- **Correctness inside one function is found reliably; a race between two commands is not.** Across three seeded PRs, every planted bug that sits inside one function was found on the right line, 7 of 7: a missing status filter, a tie counted as a win, a streak one short, a missing value read as 0, an undocumented sort order, a method named for the wrong end of a copy, and a docblock that disagreed with its code. The one planted race was missed.
- **The missed race.** One command copies an archived day file by file. A scheduled prune deletes days once they age out, and the oldest day is the one most worth keeping. When both run at once, part of the day is lost for good, and the copy fails with an error that reads as a storage fault. The reviewer read the prune and its schedule, and tested a failed copy against a mocked disk. It reported only that the failure path had no test, a nit. So round 1 had no correctness finding, and the run handed the PR to the teammate with the race still in it.
- **What a clean run means.** No correctness bug in the changed code that the reviewer could read or reproduce. It says nothing about the change running at the same time as a scheduled command or a queued job. The reviewer is now asked for that overlap (`agents/redline-reviewer.md`, "Scheduled and queued work on the same data"). Until a seed shows the check working, concurrency belongs to the human review.
- **A file whose patch GitHub omits anchors nothing.** GitHub leaves `patch` out of a binary file and of a file over its per-file size limit (56 of the 336 files of Losers League #778: built assets, lockfiles, generated code). `diff` shows such a file as a header and one `(no patch: ...)` line, the reviewer opens it in the tree only when a finding points there, and a finding in it goes in the review body behind `<!-- redline:<id> -->`, where later rounds reply with an issue comment quoting the marker. A finding in any other file anchors inline whatever the PR's size.
- **A run on this repository runs the PR's own code.** The plugin loads in place from this checkout, so the skill, workflow, agents and guard that review a Redline PR are the PR branch's, not a released copy. The guard script and the hook registration are refused for every role here, so a run cannot loosen the guard that vets it; everything else the PR changes is what runs. A finding in either file is deferred, mitigated by a `tests/guard-cases.tsv` row pinning today's decision or a line here, and a person makes the change after the run. The same holds for `.claude/redline/checks.sh`: a run cannot restamp it, so a finding whose fix changes the gate's backticked text in `shape-spec.md`, or how `scripts/redline-gate.sh` computes the hash or writes the stamp line, is deferred to a person too. So is a finding whose fix touches `scripts/checks-template.sh` below its header, or changes the text `redline-setup.sh checks` writes into this repository's `checks.sh`: the setup test regenerates `checks.sh` from `checks.json` and compares it with the committed file, and no role may regenerate it, so a person makes the change, regenerates `checks.sh` and restamps after the run.

## Git rules for Redline agents

These apply when the prompt says the session is a Redline run. Outside a Redline run the repo's CLAUDE.md Git section stands unchanged: never commit, push or stage.

1. **One commit per finding.** Each finding fixed in a round is its own commit. The standards retrospective, when it changes anything, is one more commit on its own. The spec folder (`agent-os/specs/<ts>-<pr>-review-round-<n>/`, or `<ts>-<pr>-human-review-<n>/` for a human review pass) is committed in the round's first commit or on its own; never mixed into a finding's commit. Its As built notes land in the round's last commit. So a round makes the spec commit, one commit per finding, the standards commit when there is one, and the as-built commit: three findings make six commits. A run that finishes (handed off or capped) then makes one more, the run-record commit: after the handoff or cap-hit comment (and the PR description, when one was posted), the GitHub agent stages, by name, every file under each round's `<specFolder>/redline/` that no commit holds yet (the replies, the closing comment or a human review pass's summary, the description's backup, the ingested human review, and the review and findings of a round that had no revise pass), plus `snapshot-start.json` if it is untracked, and commits them as `redline: record the run's replies, reviews and handoff for PR #<pr> (#<issue>)`. When nothing is left to stage there is no commit.
2. **Stage files by name.** `git add <path> [<path>...]` only. Never `git add -A`, `git add .`, `git add -u` or `git commit -a`. A file that is not named in the plan task is not staged.
3. **`redline:` prefix.** Every commit message starts with `redline: ` followed by one sentence naming the finding and the change, for example `redline: R1-2 reject a status outside the enum (#42)`. Reference the PR's issue number the way the repo's other commits do.
4. **No AI attribution.** No `Co-Authored-By`, no "Generated with", no model or vendor names, in commits, PR bodies, comments, issues or spec files. Redline labels its own work as Redline (`Redline round 2`, `Redline handoff`, `redline:`), which is a tool name, not vendor attribution.
5. **Push only when `args.push` is true.** The implementer never pushes. The GitHub agent pushes once per round, after the checker passed, and once more after the run-record commit, with `git push` to the PR's head branch and nothing else (no `--force`, no other refs). With `push: false` the commits stay local and the replies say so.
6. **Never merge, approve, rebase or amend.** Reviews post with the `COMMENT` event. History is append-only during a run.
7. **A clean tree at the start and at the end.** A fresh launch requires the PR's head branch, a clean tree and HEAD equal to the PR's head SHA. During a run the only expected uncommitted state is under the spec folders: the round's folder before its commit, and the reply files written after the round's last commit. A run that finishes leaves a clean tree, because the run-record commit holds the rest. A run that stops for the person (a hand-off, the review dial, `review only`) leaves its spec folder uncommitted: a relaunch picks it up, and a `review only` run's files are the person's to commit or remove.

## `checks.sh`

The runnable part of the repository's Verification Gate (in `.claude/commands/agent-os/shape-spec.md`), plus the git-state checks, wrapped to emit one JSON object. Nothing in it is new policy. Each repository's is generated from its `.claude/redline/checks.json` and `scripts/checks-template.sh` by `redline-setup.sh checks`: edit the JSON and regenerate, never the script. The commands differ per repository, and the usage, the git block, the output contract and the exit codes below are the same everywhere. The example below is a Laravel application's.

**`checks.json`**, the source: `repo` (the phrase the header names), `gateFile` (`.claude/commands/agent-os/shape-spec.md`), `selfHosted` (true only in this repository), `alwaysAllowed` (files the gate regenerates and the tree tracks), `vars` (a shell variable a step expands, with its environment variable, default and one-line doc), `formatter` (the recorded-only step, or `null`), `octane` (the long-lived suite's step and command, or `null`), `baseline` (`seconds`, `date`, an optional `note`; `null` until the first green run), and `steps`: one object per command step with `step` (its number in the gate), `name`, `recorded` (0 or 1), `cmd` (the exact string `bash -c` runs; quoted for you) or `source` (emitted verbatim inside double quotes, for a step that expands a variable), `title`, and `kind: "base-diff"` for a step that diffs the change against the PR's base (the template's `base_ref` guard wraps it). `redline-setup.sh read-checks` reads a `checks.sh` back into this shape, which is how a hand-written one is bootstrapped.

```
.claude/redline/checks.sh <snapshot.json>              full run: commands + git block
.claude/redline/checks.sh --baseline [snapshot.json]   commands only; git is null
.claude/redline/checks.sh --git-only <snapshot.json>   git block only; checks is []
```

Call it by absolute path (`<repoRoot>/.claude/redline/checks.sh`). It works from any cwd inside the repository by changing to `git rev-parse --show-toplevel`. Progress lines go to stderr; stdout carries only the JSON.

Environment: the workflow sets `REDLINE_OCTANE=1` when the approved plan touches `app/Providers/`, `bootstrap/` or `config/octane.php`; a repository with a long-lived-process suite runs it then (anything that outlives a request: service providers, container bindings, static state). A `checks.sh` may read its own variables too, such as the name of a scratch database for a migrations check.

**An example gate, in order** (the `cmd` strings are what runs, through `bash -c`):

| name | cmd | fails the run |
| --- | --- | --- |
| `fix` | `composer fix` (the repo-wide formatter) | no (recorded only) |
| `check` | `composer check` (lint, static analysis, the test suite) | yes |
| `snapshots` | `git status --porcelain tests/.pest/snapshots` prints nothing (the suite created or changed no Pest snapshot; CI fails on one) | yes |
| `migrations` | `php artisan migrate --force --no-interaction` against a scratch database, after `db:wipe` of that database, so it always runs from empty | yes |
| `openapi` | a fresh export of the API contract, then `git diff --exit-code openapi.json` | yes |
| `env` | every `env('NAME')` added by the change (diff of the PR's base to HEAD, in `app config routes database bin`) has a `NAME=` line in `.env.example` | yes |
| `octane` | `composer test:octane` (only with `REDLINE_OCTANE=1`) | yes |

**Output contract:**

```json
{
  "mode": "full | baseline | git-only",
  "ok": true,
  "checks": [
    {"name": "check", "cmd": "composer check", "exit": 0, "recorded": false, "truncated": false, "stdout": "the last 20 lines; a failing check keeps up to 200, within its share of 16 KB", "stderr": "the same"}
  ],
  "git": {
    "start_sha": "the snapshot's start_sha",
    "allowed": ["the allowed list the run used: files + plan_paths + agent-os/specs/ + agent-os/standards/ + the repository's ALWAYS_ALLOWED (a generated openapi.json, say)"],
    "changed_files": ["every path that differs between start_sha and the working tree, committed or not, untracked included"],
    "unexpected_files": ["changed_files not covered by allowed"],
    "uncommitted": ["paths that differ from HEAD or are untracked, outside agent-os/specs/"],
    "commits": [{"sha": "...", "message": "subject line"}],
    "diff_lines": 212,
    "formatter_touched_outside_pr": ["files composer fix changed that are not covered by allowed"]
  }
}
```

- `allowed` entries ending in `/` are prefixes; the rest are exact paths. "Unexpected" therefore means "outside the approved plan", and the plan approver's file-scope review is what makes the list right.
- `uncommitted` is the working tree against HEAD (modified, added, deleted and untracked), leaving out `agent-os/specs/`, where the round's reply files and snapshot sit uncommitted by design. The checks ran against that tree and the push would omit it, so a full or git-only run fails on it; the workflow's judge reads it too.
- `git` is `null` in `--baseline` mode. `checks` is `[]` in `--git-only` mode, and `formatter_touched_outside_pr` is `null` there because `composer fix` did not run.
- `recorded: true` marks a check whose exit code never fails the run (`fix`).
- `truncated: true` marks a check whose stdout or stderr was cut, by the line count (20, or 200 for a failing check) or by bytes. The failing checks share one 16 KB budget, split evenly among them once every check has run (each stream takes at least half of a check's share when both are long, and a short stream's unused bytes go to the other), so the result stays bounded however many fail; a passing check is cut at 16 KB. Nothing in the workflow reads `truncated` yet.
- `diff_lines` is insertions plus deletions versus `start_sha`, plus the line count of untracked files.
- `commits` lists `start_sha..HEAD` in `git log` order, newest first.

**Exit code:** `0` when every check with `recorded: false` exited 0 and `unexpected_files` and `uncommitted` are both empty; `1` otherwise; `2` for a usage error (no snapshot, a file that is not a snapshot, a `start_sha` that is not a commit here). The workflow reads each check's `exit`, the exit code and the git block; the implementer reads the failing check's output. The checker's own `error` field is text and never decides the verdict: it is a warning in the run's `warnings` on a round that passes, a round whose only failing checks were failing at baseline included, and detail added to the reasons on one the checks, the git block or the exit code already failed; `""` counts as empty (#34 round 2 failed a green gate on it; #37, R1-3). A result the implementer cannot change stops the run at stage `check`, naming the cause and the fix, with no repair pass: one the checker could not read (`status: result_unreadable`, with `reason` `spilled` when the output went over the Bash tool's inline limit and was saved to a file, `not_json`, `no_git_block`, `backgrounded` when the tool moved a foreground run to the background because it outlasted the 600 s cap, or `no_result` when a background run's wait reported the limit passed or the run gone; see "Long gates"), a missing result, exit 2, or a result with no `git` block (#9). The run's `detail.checker` keeps whatever the checker returned. The implementer repairs only failing checks and git-block findings.

**Baseline.** The checker runs `--baseline` once before the first implement step of a run. "Tests pass" in later runs means no failure the baseline did not already have. The baseline runs every command whatever the checker mode: the workflow needs it to tell a check that was already failing from a new failure. So `checker: git-only` saves the per-round check, not the baseline, and the implementer still runs the full gate on every pass.

**Long gates.** The Bash tool stops waiting on a foreground command after 600 s and moves it to the background, and a subagent's background task is killed when the agent finishes. The skill therefore passes the repository's recorded baseline time (`baseline.seconds` in `checks.json`) as `args.baselineSeconds`. When it is over 480 s, or none is recorded, the workflow gives the checker and the implementer two commands in place of the `checks.sh` command line: `redline-background.sh start <label> ...`, run with `run_in_background`, and `redline-background.sh wait <label> --limit <s>`, run in the foreground again while it exits 3. The wait prints what `checks.sh` printed and exits with its exit code, so the result reads as a foreground run's. A `--git-only` check runs no command and stays in the foreground. The stall watchdog restarts only an agent that has been silent for `checkerStallMs`, and each wait is activity, so the wait's `--limit`, set to `checkerStallMs` in seconds, is what bounds a hung background gate: past it, the checker returns `no_result` and the run stops. A gate whose recorded baseline fits but whose run outlasts the cap anyway stops as `backgrounded`: `the gate took longer than the Bash tool allows in the foreground; the checker must background it (recorded baseline: <n> s)`. Re-record the time with `/redline:setup`'s baseline step.

**Gate stamp.** The last line of `checks.sh`'s header records the gate it transcribes:

```
# redline-gate: .claude/commands/agent-os/shape-spec.md steps 1-6 sha256:<64 hex>
```

The hash covers every backticked span and every fenced block in the gate's section of `shape-spec.md`, nested lines included, in document order, with runs of whitespace collapsed (a code span that continues on a second line is not recognised). Prose outside backticks never changes it; any backticked change does, so adding or removing a step that holds a backticked span or a fenced block moves the hash, as does giving one a new flag or swapping two such steps. A step written wholly in prose changes nothing when it is added, removed or moved, so a command step keeps its command in backticks. `steps m-n` names the command steps `checks.sh` transcribes and is for the reader: the hash covers the whole section, prose steps included, because a false positive costs a restamp and a false negative is the drift the stamp exists to catch. `/redline:redline` runs `redline-gate.sh check` first in its precheck and stops on any of these lines:

- `the verification gate in <file> has changed since .claude/redline/checks.sh was stamped; bring checks.sh up to date, then restamp with <plugin>/scripts/redline-gate.sh stamp <file> .claude/redline/checks.sh`
- `.claude/redline/checks.sh carries no gate stamp; stamp it with <plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh`
- `the verification gate in <file> is ambiguous: 2 verification gate sections hold a numbered list, the headings at lines <a> ("<heading>") and <b> ("<heading>"); rewrite one so only the gate holds a numbered list, then run check again` (reason `two gates`: the stamp never picks one silently, so a plan-template task written as a numbered list cannot take the real gate's place)

`scripts/redline-gate.sh` is the skill's, never a role's (the guard refuses it to every role, and no role may write `checks.sh`), and `tests/gate-test.sh` is its unit test. Its header is the reference; in short:

| subcommand | does | exit |
| --- | --- | --- |
| `extract <shape-spec.md>` | finds the gate (the one "verification gate" heading whose section holds a numbered list: a top-level section, or a task heading inside the plan template's fence) and prints JSON: heading, line, the steps with their backticked items, the default step range from the unattended section's `(gate steps M to N` parenthetical, the hashed items and the sha256 | 0; 1 when the file has no gate, or two sections qualify |
| `stamp <shape-spec.md> [<checks.sh>] [--steps m-n]` | prints the stamp line and, with `checks.sh`, replaces its `# redline-gate:` line (the template's TODO included) or inserts one as the header's last line | 0; 1 no gate or two; 2 a bad or missing `--steps` |
| `check <repoRoot>` | compares the stamp in `<repoRoot>/.claude/redline/checks.sh` with the gate it names; prints `{ok, reason, stamp, actual}` | 0 match; 1 moved, missing, the placeholder or two gates; 2 no `checks.sh` |

`/redline:setup` stamps `checks.sh` as its step 10; `stamp` by hand is the quick path for a repository set up before it existed (see "Upgrading").

**Template version.** The header line above the stamp, `# redline-template: checks-template.sh v1`, names the version of `scripts/checks-template.sh` a `checks.sh` was generated from. `/redline:redline`'s precheck compares it with the plugin's template (`redline-setup.sh version`) and warns, never stops, when the repository's is older or missing: `checks.sh was made from checks-template.sh v1; the plugin ships v2. Run /redline:setup to port the change`. When the repository's is newer than the plugin's (a teammate on an older install), the line says to update the plugin instead, since a rerun would regenerate `checks.sh` from the older template. A rerun of `/redline:setup` regenerates `checks.sh` from `checks.json` and the current template, which is the port.

## `redline-background.sh`

The two commands a role runs for a long gate (see "Long gates" under `checks.sh`). It is in the guard's `checks` group, beside `checks.sh`, so only the checker and the implementer run it, only from the plugin, and only `start` and `wait`. `start` runs nothing but the repository's own `.claude/redline/checks.sh`. Its files live under `$TMPDIR/redline-background/<label>.*` until a wait has returned the run's result: each result is read once, so a returned result is never returned again, not even to a rerun's wait sent under the same label before that rerun's start has cleared the label (#41, R1-2). The workflow names each run `<launch stamp>-<pr>-<agent label>` (`2026-10-26-1304-790-baseline`, `...-check-r1`, `...-implement-r1`), so a relaunch builds the same prompts. Its header is the reference; in short:

| subcommand | does | exit |
| --- | --- | --- |
| `start <label> [--baseline \| --git-only] [<snapshot>]` | removes the label's earlier files, then runs `checks.sh` with the remaining arguments and this environment (`REDLINE_OCTANE=1` passes through), keeping its stdout, stderr and exit code; prints `{label, exit}`. Run with `run_in_background`, so the harness stops it when the role finishes | `checks.sh`'s; 2 a bad label, no repository, no `checks.sh` |
| `wait <label> [--limit <s>] [--slice <s>]` | waits up to `--slice` seconds (default 240, under the tool's cap and the 300 s floor of `checkerStallMs`); when the run is done, prints its stderr and stdout as `checks.sh` printed them, then removes the label's files | `checks.sh`'s 0, 1 or 2; 3 still running, run it again; 4 running longer than `--limit`; 5 the run ended without a result, or never started |

## `redline-setup.sh`

The scriptable parts of `/redline:setup`, the skill's only (the guard refuses it to every role, and its writing subcommands are not in the allow list: setup is interactive, and the permission prompt is the person's confirmation; only `version`, which writes nothing and which `/redline:redline`'s precheck runs at every launch, has a rule, `Bash(/*/scripts/redline-setup.sh version *)`). Every subcommand prints one JSON object; every writing one takes `--dry-run` and reports `changed: false` when nothing would change, so a rerun can say "nothing drifted". Its header is the reference; in short:

| subcommand | does | exit |
| --- | --- | --- |
| `settings <repoRoot> [--allow <entry>]... [--dry-run]` | merges `templates/settings.allow.json` into `.claude/settings.json` without dropping a key or changing a value already there; an entry under a top-level object (a marketplace, a plugin) is kept whole, and each kept value that differs from the template's is listed under `conflicts`; `permissions.allow` is the existing entries, then the template's, then the extras, each once; compared as JSON, so a file the plugin CLI reordered is left alone; keeps CRLF | 0; 2 not JSON, or a BOM |
| `gitignore <repoRoot> [--dry-run]` | adds `.claude/redline.local.json` after `.claude/settings.local.json`, else after the last `.claude/` entry, else at the end; keeps CRLF | 0; 2 |
| `unattended <shape-spec.md> --gate-steps m-n --prose-steps <text> --retro-step n (--pr-body-standard <name> \| --no-pr-body) [--force] [--dry-run]` | inserts the unattended section after the plan-mode check with the fill-ins applied; when present, reads the fill-ins back and compares, and `--force` patches them in place without touching the rest | 0; 1 present and different without `--force`; 2 bad args or no Prerequisites heading |
| `config --reviewer <handle> --baseline-seconds <n> [<repoRoot>] [--force] [--dry-run]` | `redline.json` from the template: `git-only` over five minutes else `full`; the stall is 1.7 times the baseline, rounded up to five minutes, never below 300000; over an existing file, updates only `checker` and `checkerStallMs` in place (`updated`) and lists every other value that differs under `differs`, kept; `--force` rewrites it from the template | 0; 1 `checker` or `checkerStallMs` cannot be updated in place, without `--force`; 2 |
| `checks <checks.json> <checks.sh> [--dry-run]` | generates `checks.sh` (header, version line, the existing stamp or the placeholder, the template's functions, one `run_check` per step); writes nothing when the bytes are unchanged | 0; 1 a template anchor is missing; 2 a bad `checks.json`, every reason on stderr |
| `read-checks <checks.sh>` | the `run_check` lines, guards, variables and header read back, with a best-effort `checks.json` under `input` | 0; 2 |
| `version <checks.sh>` | the file's template version against the plugin's | 0 match; 1 older, newer or missing |


## `redline-gh.sh`

The only door to GitHub, authenticated as whoever ran `gh auth login`. Every body argument is a file path, never inline text. Any `gh` failure prints `gh`'s error to stderr and exits non-zero; nothing retries. Call it by absolute path, `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh`; the workflow gives every agent that path, and the skill gets it from its own `${CLAUDE_PLUGIN_ROOT}`.

Read-only (reviewer, gather, precheck):

| subcommand | gh call | prints |
| --- | --- | --- |
| `pr <n>` | `gh pr view <n> --json number,title,body,state,baseRefName,headRefName,headRefOid,url` | JSON |
| `diff <n>` | `GET /pulls/<n>/files`, paginated; a `diff --git` header per file and its patch (GitHub's whole-PR diff refuses a PR over 300 files) | unified diff; a file whose patch GitHub omits shows its header and one `(no patch: ...)` line |
| `pr-comments <n>` | `gh pr view <n> --comments` | issue comments and review bodies (not inline review comments, no IDs) |
| `issues-search <query>` | `gh issue list --state open --search <query>` | table |
| `review-comments <n>` | `GET /pulls/<n>/comments`, paginated | JSON `[{id, path, line, side, body, in_reply_to_id, pull_request_review_id}]`; replies carry `in_reply_to_id` |
| `has-review <n> <round>` | reviews list, body starts `Redline round <round>` | nothing; exit 0 found, 1 none, 2 gh error |
| `last-round <n>` | reviews list, the highest `Redline round N` | a JSON number, `0` when none (the precheck's `firstRound` minus one); exit 2 gh error |
| `human-review <n> <id \| @login \| latest>` | reviews list, `GET /pulls/<n>/comments` and `GET /issues/<n>/comments`, all paginated; `gh api user` for `latest` | JSON `{selector, reviews: [{id, user, state, body, submitted_at}], body: {review_id, user, text} \| null, comments: [{id, thread_id, review_id, user, path, line, side, body, in_reply_to_id, created_at}]}`: the selection's comments that no Redline reply in the same thread has answered (a reply carrying `<!-- redline:answers <ids> -->`, as every human-pass thread reply does, answers only the comments it names; one without it, `Redline round N:` or an earlier `Redline human review N:`, answers every comment before it), never a Redline review's own comments, in path, line, id order, `thread_id` the root comment the reply goes to, a null `line` read from `original_line`. An id keeps that review's open comments and its body when not empty and not answered (a Redline human review issue comment whose header line is `**H<n>-<k>** · from review <id> by @<login>` answers it); `@login` keeps every open comment by that login (matched in any case), replies inside Redline threads included, and the body of their newest review that has one not answered (one body per pass, so an older one comes up on the next pass); `latest` is the newest review that is not Redline's and not the gh user's with an open comment or an unanswered body, then as its id; exit 2 gh error or a selector of another shape |
| `last-human-review <n>` | `GET /pulls/<n>/comments` and `GET /issues/<n>/comments`, the highest `Redline human review N` | a JSON number, `0` when none (the human review pass's `n` minus one); exit 2 gh error |
| `files <n>` | `GET /pulls/<n>/files`, paginated (`gh pr view --json files` stops at 100) | JSON array of paths (the start snapshot's `files`) |
| `login` | `gh api user` | the login Redline posts as (the precheck's reviewer test) |
| `place <n> <json-file>` | `GET /pulls/<n>/files`, each file's patch parsed into the positions GitHub can anchor (added, removed and context lines of each hunk; a context line on both sides) | the review file as `post-review` would send it: `{body, comments, moved}`, with every comment off a hunk moved into `body` under "Not placed inline" behind `<!-- redline:<id> -->`; `moved` is `[{id, path, line, side}]` |

Writes (GitHub agent only):

| subcommand | gh call | prints |
| --- | --- | --- |
| `post-review <n> <json-file>` | `place` first, then `POST /pulls/<n>/reviews` with `event: COMMENT`; file is `{body, comments:[{path, line, side, body}]}`, `side` defaults to `RIGHT` | `{review_id, html_url, comments:[{id, path, line, side, body}], moved:[{id, path, line, side}]}` |
| `reply <n> <comment-id> <file>` | `POST /pulls/<n>/comments/<id>/replies` | `{id, html_url}` |
| `comment <n> <file>` | `gh pr comment <n> --body-file <file>` | comment URL |
| `request-review <n> <user>` | `gh pr edit <n> --add-reviewer <user>` | PR URL |
| `issue-create <title> <file>` | `gh issue create --title <title> --body-file <file>` | issue URL |
| `update <n> <title or -> <file> [<copy>]` | backup `gh pr view` to `$REDLINE_BACKUP_DIR` (default `$TMPDIR/redline-backups`) and to `<copy>` unless it exists (Finish passes `<round>/redline/pr-body-backup.json`, which outlasts `$TMPDIR`), `gh pr edit --title --body-file`, read back and compare; `-` keeps the title | `{title, body_bytes, backup, copy}` |

Rules the agent follows around these:

- Check `has-review <n> <round>` before `post-review`; a hit means the round is already posted and the post is skipped.
- Inline comments must sit on a line in the PR diff (an added, removed or context line of a hunk of that file's patch). GitHub answers `422 Unprocessable Entity` with `Line could not be resolved` and posts nothing, not even the valid comments, and the answer names no path or line. So `post-review` runs `place` first: every comment off a hunk, and every comment in a file whose patch GitHub omits, is moved into `body` under "Not placed inline" behind `<!-- redline:<id> -->` before anything is sent, and the output's `moved` says which. The agent reports them as `movedToBody`. A posted review with no inline comment at all is a degraded result the workflow records as a warning, never an error.
- A finding in the body has no thread, so its reply is an issue comment (`comment`) whose first line is the finding's marker, then `**<id>** · \`file:line\` · from the Redline round N review body`, then the reply, when the round's review is on GitHub; in a dry run, or a revise over a review that was never posted, the reply is written to its file and nothing is posted. One per finding, never twice. To check whether one is already posted, the agent looks for that second line in `pr-comments`, never for the marker, which the review body also carries.
- The `comments[].id` values printed by `post-review` are what `reply` takes; keep them in the round's record.

## Snapshot file

Two kinds, both under `agent-os/specs/` (inside every allowed list, and committed as the run's record: with the round's spec folder, or by the run-record commit at Finish):

- **Start snapshot**, `<first round's spec folder>/redline/snapshot-start.json`, written by the `/redline:redline` skill after the precheck from `redline-gh.sh pr <n>` and `redline-gh.sh files <n>`, with `plan_paths: []`. The checker's `--baseline` run reads it. A human review pass writes `human-review-<n>.json` beside it (the selector, the reviewer, the reviews, the body and the findings as ingested): the record of what the teammate found, for a later run to compare with what the rounds missed.
- **Round snapshot**, `<round N spec folder>/redline/snapshot.json`, written by the GitHub agent after the plan approver passes, with `plan_paths` set to every path approved so far in the run plus the round's spec folder. Cumulative, because the git block measures from `start_sha` and an earlier round's files are still changed later. The implementer's and checker's full runs read it.

```json
{
  "pr": 42,
  "start_sha": "0123456789abcdef0123456789abcdef01234567",
  "base_ref": "main",
  "files": ["app/Http/Controllers/OrderController.php"],
  "plan_paths": ["app/Http/Controllers/OrderController.php", "tests/Feature/Orders/"]
}
```

- `pr`: the PR number.
- `start_sha`: the PR's head SHA when the run started (`headRefOid`). `changed_files`, `commits` and `diff_lines` are measured from here.
- `base_ref`: the PR's base branch (`baseRefName`). A check that diffs the change against its base (the example's `env`) diffs `merge-base(base_ref, HEAD)..HEAD`. Optional; falls back to `origin/HEAD`, then `origin/main`.
- `files`: the PR's changed files at run start (every path `redline-gh.sh files` lists, all pages).
- `plan_paths`: every path the approved plan names, written by the workflow after the plan approver passes. A trailing `/` makes it a prefix. Optional; empty before the plan exists (the baseline and the first `git-only` precheck).
- The allowed list is `files` + `plan_paths` + `agent-os/specs/` + `agent-os/standards/` + the files the repository's `checks.sh` always allows (a generated `openapi.json`, say). Anything else that changed since `start_sha` is `unexpected_files`.

Required fields are `start_sha` and `files`; the script exits 2 without them. A snapshot elsewhere inside the tree would itself count as a changed file; under `agent-os/specs/` it is allowed.
