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

Requirements: Claude Code with dynamic workflows (proven on 2.1.303 and 2.1.304), `gh` signed in as the person who runs Redline, `jq`, `python3`, and Agent OS in the repository.

## Upgrading

A launch now refuses a `checks.sh` that carries no gate stamp (see "Gate stamp" under `checks.sh` below). A repository set up before the stamp existed is stamped once, by hand, from its root:

```bash
<plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh
```

It prints the line it wrote. Change the `-h|--help` line of `checks.sh` from its numeric `sed -n '2,NNp'` range to `sed -n '2,/^$/p'` at the same time (the inserted line shifts the header, and `stamp` warns when it does), then commit both. A PR branch cut before that commit reached its base carries no stamp, and a launch on it stops with the same line: merge the base into the branch, or stamp it on the branch and commit and push, before launching on it. Until `/redline:setup` exists (the second half of #6), that is the whole upgrade.

## Set up a repository

The plugin holds the tool: the skill, the workflow, the eight agents, the guard and the GitHub wrapper. Each repository keeps its own contract, which the plugin never edits. Set it up in this order, from the repository's root:

1. **`.claude/redline/checks.sh`**: the repository's gate as a script that emits Redline's JSON (see `checks.sh` below). Copy `scripts/checks-template.sh`, make it executable, and fill in the TODOs from the gate's command steps. Leave the header's `# redline-gate: TODO` line as it is: it is stamped in step 5, once the unattended section gives the stamp its step range.
2. **`.claude/redline.json`**: the round cap, the teammate to request review from, the checker mode and stall timeout, and the models. Start from `templates/redline.json.example`.
3. **`.claude/settings.json`**: the marketplace, the plugin enabled, and the allow list for what runs outside a guarded role. Merge `templates/settings.allow.json`, then add the gate's own commands (a Laravel repository might add `composer check`, `php artisan test`, `vendor/bin/pest`).
4. **`.gitignore`**: add the line `.claude/redline.local.json`, beside `.claude/settings.local.json`. That file holds each person's saved launch settings (see "Settings") and is never committed.
5. **`.claude/commands/agent-os/shape-spec.md`**: add an "Unattended mode (Redline)" section, so the shaper can follow shape-spec with nobody to ask. Start from `templates/shape-spec-unattended.md`. Then stamp `checks.sh`: `<plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh` replaces the header's `# redline-gate: TODO` line with the gate's hash, taking the step range from point 7's `(gate steps M to N` parenthetical (see "Gate stamp"). The unattended section sits outside the gate, so adding it never moves the hash.
6. **`CLAUDE.md`**: one sentence in the Git section, and one paragraph beside the attribution rule, from `templates/claude-md-git-sentence.md`.
7. **Verify**, from the repository: `<plugin>/tests/guard-test.sh` all passing, `.claude/redline/checks.sh --baseline` green, `<plugin>/scripts/redline-gate.sh check .` exiting 0, `gh auth status` signed in.
8. **Dry run.** Before the first real PR, run a dry run on a seeded PR (a branch with planted bugs whose answer key lives outside the repository) to measure the reviewer's recall there.

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
```

The words can come in any order. `dry run` posts and pushes nothing: every body is written under the round's spec folder instead, and the PR may be closed (a seed). The first launch in a repository asks for the settings it was not given on the command line, and later launches confirm the remembered ones in one question; see "Settings". `/redline:redline-review` and `/redline:redline-revise` are the two halves on their own, for debugging.

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
- `decided by: redline (autopilot)`: the run took the shaper's recommendation on autopilot.

The handoff comment lists every decision of the run, not only the human ones. The shaper's JSON carries `decidedBy` per finding (`redline` or `pending`); the workflow fills `@<login>` from `args.login` for the answers a person gave.

## Files

| Path in the plugin | What |
| --- | --- |
| `skills/redline/SKILL.md` | `/redline:redline`: parses the arguments, settles and saves the settings, prechecks (the gate stamp first), writes the start snapshot, launches `redline:redline-loop`, handles hand-offs (decisions, a plan to approve, findings to pick) and the deferred list. `redline-review` and `redline-revise` beside it are the debug variants |
| `workflows/redline-loop.js` | The loop: phases, done rule, final nit pass, cap, the interrupt dial's stopping points, decision owners, and the pass/fail decision from the checker's JSON. Runs as `redline:redline-loop` |
| `agents/redline-*.md` | The eight roles: reviewer, shaper, resolve, plan-approver, standards-approver, implementer, checker, github. They load as `redline:redline-<role>` |
| `hooks/hooks.json` | One `PreToolUse` hook on Bash, Write, Edit, MultiEdit and NotebookEdit, calling the guard |
| `scripts/redline-guard.sh` | The per-role guard; see below |
| `scripts/redline-gh.sh` | Every GitHub call; see below |
| `scripts/redline-prefs.sh` | The saved launch settings: the merge rules behind `.claude/redline.local.json`; see "Settings" |
| `scripts/redline-gate.sh` | The gate stamp: `extract` parses a repository's Verification Gate, `stamp` writes its hash into `checks.sh`, `check` compares the two at launch; see "Gate stamp" under `checks.sh` |
| `scripts/checks-template.sh` | The starting point for a repository's `.claude/redline/checks.sh` |
| `templates/` | The per-repository files above |
| `tests/guard-test.sh`, `tests/guard-cases.tsv` | The guard's regression table |
| `tests/loop-test.mjs` | A mock harness for the workflow: runs `redline-loop.js` with scripted agents and checks each dial level, the scope, the owners, the replay rule and the run-record commit (`node tests/loop-test.mjs`) |
| `tests/prefs-test.sh` | The unit test of the settings merge rules |
| `tests/gate-test.sh`, `tests/gate-fixtures/` | The unit test of the gate stamp, on one synthetic `shape-spec.md` per gate shape seen so far; its last case checks this repository's own stamp |

## The guard

A plugin's agents cannot carry their own hooks (Claude Code ignores `hooks`, `permissionMode` and `mcpServers` in a plugin agent's frontmatter), so the guard is a plugin hook. A plugin hook fires on every matching tool call in every session where the plugin is enabled, so the guard first reads `agent_type` from the hook input. Claude Code sets it to `redline:redline-<role>` inside a Redline agent (`redline-<role>` for a copy installed into `.claude/agents/`). Anything else, or no `agent_type` at all (the main session), is not a Redline role: the guard exits 0 with no output, and the call goes on as if the hook were not there.

For a Redline role it is a default-deny allowlist, in a table at the top of the script: the commands each role may run, and the paths it may write. Redline's own files are refused for every role: the plugin's directory, `.claude/redline/`, `.claude/redline*.json`, `.claude/settings*.json`, and the `.claude/{agents,workflows,skills}/redline*` copies an install into `.claude/` would add. The rest of `.claude/` is ordinary content the implementer may write when the plan names it. When the repository is the plugin (this checkout loaded in place, Redline reviewing itself), the plugin's directory is the repository, so `agents/`, `scripts/`, `workflows/`, `skills/`, `tests/`, `templates/` and the README are repository content under the roles' usual prefixes; `.claude/`'s Redline files stay refused, and so do `scripts/redline-guard.sh` and `hooks/hooks.json`, the guard that vets the run, which a person changes. What the guard allows it also approves (a `PreToolUse` `allow`), so a Redline role never stops at a permission prompt for a vetted command, and no git write rule has to sit in the shared settings where every other session would get it too. It needs `python3` and `jq`.

`tests/guard-test.sh` feeds every case in `tests/guard-cases.tsv` to the guard as the hook input Claude Code would send and prints the decisions as a table. Run it from a repository that uses Redline; from the plugin's own checkout it uses an empty repository under `~/.cache/redline/` for the rows that need a repository that is not the plugin. The rows after a `# @cwd PLUGIN` line run from the checkout itself, as the self-hosted case. Set `REDLINE_GUARD_LOG=<file>` in the environment Claude Code starts from to log every decision, inert ones included.

## Launching

`/redline:redline <pr>` is typed in an interactive session; the workflow runs in the background and the session waits for it. A headless session (`claude -p`) stops background tasks ten minutes after its last turn, which kills a run mid-phase, so it is started with `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`. A run the harness stopped is resumed from the session that launched it: the skill relaunches with byte-identical `args`, no new `decisions`, and `resumeFromRunId` set to the run id; finished agents replay from cache and the interrupted one reruns. A hand-off relaunch works the same way, adding only what the stop asked for (`decisions`; `approvedPlans` for the plan dial; `selected` for the review dial), so every prompt before the stopping point replays from cache.

## Known limits

- **Correctness inside one function is found reliably; a race between two commands is not.** Across three seeded PRs, every planted bug that sits inside one function was found on the right line, 7 of 7: a missing status filter, a tie counted as a win, a streak one short, a missing value read as 0, an undocumented sort order, a method named for the wrong end of a copy, and a docblock that disagreed with its code. The one planted race was missed.
- **The missed race.** One command copies an archived day file by file. A scheduled prune deletes days once they age out, and the oldest day is the one most worth keeping. When both run at once, part of the day is lost for good, and the copy fails with an error that reads as a storage fault. The reviewer read the prune and its schedule, and tested a failed copy against a mocked disk. It reported only that the failure path had no test, a nit. So round 1 had no correctness finding, and the run handed the PR to the teammate with the race still in it.
- **What a clean run means.** No correctness bug in the changed code that the reviewer could read or reproduce. It says nothing about the change running at the same time as a scheduled command or a queued job. The reviewer is now asked for that overlap (`agents/redline-reviewer.md`, "Scheduled and queued work on the same data"). Until a seed shows the check working, concurrency belongs to the human review.
- **A run on this repository runs the PR's own code.** The plugin loads in place from this checkout, so the skill, workflow, agents and guard that review a Redline PR are the PR branch's, not a released copy. The guard script and the hook registration are refused for every role here, so a run cannot loosen the guard that vets it; everything else the PR changes is what runs. A finding in either file is deferred, mitigated by a `tests/guard-cases.tsv` row pinning today's decision or a line here, and a person makes the change after the run. The same holds for `.claude/redline/checks.sh`: a run cannot restamp it, so a finding whose fix changes the gate's backticked text in `shape-spec.md`, or how `scripts/redline-gate.sh` computes the hash or writes the stamp line, is deferred to a person too.

## Git rules for Redline agents

These apply when the prompt says the session is a Redline run. Outside a Redline run the repo's CLAUDE.md Git section stands unchanged: never commit, push or stage.

1. **One commit per finding.** Each finding fixed in a round is its own commit. The standards retrospective, when it changes anything, is one more commit on its own. The spec folder (`agent-os/specs/<ts>-<pr>-review-round-<n>/`) is committed in the round's first commit or on its own; never mixed into a finding's commit. Its As built notes land in the round's last commit. So a round makes the spec commit, one commit per finding, the standards commit when there is one, and the as-built commit: three findings make six commits. A run that finishes (handed off or capped) then makes one more, the run-record commit: after the handoff or cap-hit comment (and the PR description, when one was posted), the GitHub agent stages, by name, every file under each round's `<specFolder>/redline/` that no commit holds yet (the replies, the closing comment, the description's backup, and the review and findings of a round that had no revise pass), plus `snapshot-start.json` if it is untracked, and commits them as `redline: record the run's replies, reviews and handoff for PR #<pr> (#<issue>)`. When nothing is left to stage there is no commit.
2. **Stage files by name.** `git add <path> [<path>...]` only. Never `git add -A`, `git add .`, `git add -u` or `git commit -a`. A file that is not named in the plan task is not staged.
3. **`redline:` prefix.** Every commit message starts with `redline: ` followed by one sentence naming the finding and the change, for example `redline: R1-2 reject a status outside the enum (#42)`. Reference the PR's issue number the way the repo's other commits do.
4. **No AI attribution.** No `Co-Authored-By`, no "Generated with", no model or vendor names, in commits, PR bodies, comments, issues or spec files. Redline labels its own work as Redline (`Redline round 2`, `Redline handoff`, `redline:`), which is a tool name, not vendor attribution.
5. **Push only when `args.push` is true.** The implementer never pushes. The GitHub agent pushes once per round, after the checker passed, and once more after the run-record commit, with `git push` to the PR's head branch and nothing else (no `--force`, no other refs). With `push: false` the commits stay local and the replies say so.
6. **Never merge, approve, rebase or amend.** Reviews post with the `COMMENT` event. History is append-only during a run.
7. **A clean tree at the start and at the end.** A fresh launch requires the PR's head branch, a clean tree and HEAD equal to the PR's head SHA. During a run the only expected uncommitted state is under the spec folders: the round's folder before its commit, and the reply files written after the round's last commit. A run that finishes leaves a clean tree, because the run-record commit holds the rest. A run that stops for the person (a hand-off, the review dial, `review only`) leaves its spec folder uncommitted: a relaunch picks it up, and a `review only` run's files are the person's to commit or remove.

## `checks.sh`

The runnable part of the repository's Verification Gate (in `.claude/commands/agent-os/shape-spec.md`), plus the git-state checks, wrapped to emit one JSON object. Nothing in it is new policy. Each repository writes its own from `scripts/checks-template.sh`; the commands differ, and the usage, the git block, the output contract and the exit codes below are the same everywhere. The example below is a Laravel application's.

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

**Exit code:** `0` when every check with `recorded: false` exited 0 and `unexpected_files` and `uncommitted` are both empty; `1` otherwise; `2` for a usage error (no snapshot, a file that is not a snapshot, a `start_sha` that is not a commit here). The workflow reads `ok` and the git block; the implementer reads the failing check's output.

**Baseline.** The checker runs `--baseline` once before the first implement step of a run. "Tests pass" in later runs means no failure the baseline did not already have.

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

The second half of #6, `/redline:setup`, moves the stamping into the setup command; until then `stamp` is run by hand (see "Upgrading").

## `redline-gh.sh`

The only door to GitHub, authenticated as whoever ran `gh auth login`. Every body argument is a file path, never inline text. Any `gh` failure prints `gh`'s error to stderr and exits non-zero; nothing retries. Call it by absolute path, `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh`; the workflow gives every agent that path, and the skill gets it from its own `${CLAUDE_PLUGIN_ROOT}`.

Read-only (reviewer, gather, precheck):

| subcommand | gh call | prints |
| --- | --- | --- |
| `pr <n>` | `gh pr view <n> --json number,title,body,state,baseRefName,headRefName,headRefOid,url` | JSON |
| `diff <n>` | `gh pr diff <n>` | unified diff |
| `pr-comments <n>` | `gh pr view <n> --comments` | issue comments and review bodies (not inline review comments, no IDs) |
| `issues-search <query>` | `gh issue list --state open --search <query>` | table |
| `review-comments <n>` | `GET /pulls/<n>/comments`, paginated | JSON `[{id, path, line, side, body, in_reply_to_id, pull_request_review_id}]`; replies carry `in_reply_to_id` |
| `has-review <n> <round>` | reviews list, body starts `Redline round <round>` | nothing; exit 0 found, 1 none, 2 gh error |
| `files <n>` | `gh pr view <n> --json files` | JSON array of paths (the start snapshot's `files`) |
| `login` | `gh api user` | the login Redline posts as (the precheck's reviewer test) |
| `place <n> <json-file>` | `gh pr diff <n>`, parsed into the positions GitHub can anchor (added, removed and context lines of each hunk; a context line on both sides) | the review file as `post-review` would send it: `{body, comments, moved}`, with every comment off a hunk moved into `body` under "Not placed inline" |

Writes (GitHub agent only):

| subcommand | gh call | prints |
| --- | --- | --- |
| `post-review <n> <json-file>` | `place` first, then `POST /pulls/<n>/reviews` with `event: COMMENT`; file is `{body, comments:[{path, line, side, body}]}`, `side` defaults to `RIGHT` | `{review_id, html_url, comments:[{id, path, line, side, body}], moved:[{path, line, side}]}` |
| `reply <n> <comment-id> <file>` | `POST /pulls/<n>/comments/<id>/replies` | `{id, html_url}` |
| `comment <n> <file>` | `gh pr comment <n> --body-file <file>` | comment URL |
| `request-review <n> <user>` | `gh pr edit <n> --add-reviewer <user>` | PR URL |
| `issue-create <title> <file>` | `gh issue create --title <title> --body-file <file>` | issue URL |
| `update <n> <title or -> <file> [<copy>]` | backup `gh pr view` to `$REDLINE_BACKUP_DIR` (default `$TMPDIR/redline-backups`) and to `<copy>` unless it exists (Finish passes `<round>/redline/pr-body-backup.json`, which outlasts `$TMPDIR`), `gh pr edit --title --body-file`, read back and compare; `-` keeps the title | `{title, body_bytes, backup, copy}` |

Rules the agent follows around these:

- Check `has-review <n> <round>` before `post-review`; a hit means the round is already posted and the post is skipped.
- Inline comments must sit on a line in the PR diff (an added, removed or context line of a hunk). GitHub answers `422 Unprocessable Entity` with `Line could not be resolved` and posts nothing, not even the valid comments, and the answer names no path or line. So `post-review` runs `place` first: every comment off a hunk is moved into `body` under "Not placed inline" before anything is sent, and the output's `moved` says which. The agent reports them as `movedToBody`.
- The `comments[].id` values printed by `post-review` are what `reply` takes; keep them in the round's record.

## Snapshot file

Two kinds, both under `agent-os/specs/` (inside every allowed list, and committed as the run's record: with the round's spec folder, or by the run-record commit at Finish):

- **Start snapshot**, `<round 1 spec folder>/redline/snapshot-start.json`, written by the `/redline:redline` skill after the precheck from `redline-gh.sh pr <n>` and `redline-gh.sh files <n>`, with `plan_paths: []`. The checker's `--baseline` run reads it.
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
- `files`: the PR's changed files at run start (the paths in `redline-gh.sh diff`).
- `plan_paths`: every path the approved plan names, written by the workflow after the plan approver passes. A trailing `/` makes it a prefix. Optional; empty before the plan exists (the baseline and the first `git-only` precheck).
- The allowed list is `files` + `plan_paths` + `agent-os/specs/` + `agent-os/standards/` + the files the repository's `checks.sh` always allows (a generated `openapi.json`, say). Anything else that changed since `start_sha` is `unexpected_files`.

Required fields are `start_sha` and `files`; the script exits 2 without them. A snapshot elsewhere inside the tree would itself count as a changed file; under `agent-os/specs/` it is allowed.
