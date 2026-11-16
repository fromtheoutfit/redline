# The per-repository contract

This is the output contract the header of a repository's `checks.sh` points to ("See README.md for the output contract"; the text moved here in 0.1.1), and the rest of what `/redline:setup` writes into a repository: `checks.json` and the generated `checks.sh`, the gate stamp and the template version line, `redline.json`, `redline.local.json`, the allow list in `settings.json`, the unattended section of `shape-spec.md`, the CLAUDE.md sentence, and the snapshot files a run writes. The plugin never edits any of it after setup; a rerun of `/redline:setup` shows each diff first ([setup.md](setup.md), [upgrading.md](upgrading.md)). Where a command below names `<plugin>`, it is the directory `claude plugin list` prints as `Read from:` for `redline@redline`.

## `checks.json` → `checks.sh`

The runnable part of the repository's Verification Gate (in `.claude/commands/agent-os/shape-spec.md`), plus the git-state checks, wrapped to emit one JSON object. Nothing in it is new policy. Each repository's is generated from its `.claude/redline/checks.json` and `scripts/checks-template.sh` by `redline-setup.sh checks`: edit the JSON and regenerate, never the script. The commands differ per repository, and the usage, the git block, the output contract and the exit codes below are the same everywhere. The example below is a Laravel application's.

**`checks.json`**, the source: `repo` (the phrase the header names), `gateFile` (`.claude/commands/agent-os/shape-spec.md`), `selfHosted` (true only in this repository), `alwaysAllowed` (files the gate regenerates and the tree tracks), `vars` (a shell variable a step expands, with its environment variable, default and one-line doc), `formatter` (the recorded-only step, or `null`), `octane` (the long-lived suite's step and command, or `null`), `baseline` (`seconds`, `date`, an optional `note`; `null` until the first green run), and `steps`: one object per command step with `step` (its number in the gate), `name`, `recorded` (0 or 1), `cmd` (the exact string `bash -c` runs; quoted for you) or `source` (emitted verbatim inside double quotes, for a step that expands a variable), `title`, and `kind: "base-diff"` for a step that diffs the change against the PR's base (the template's `base_ref` guard wraps it). `redline-setup.sh read-checks` reads a `checks.sh` back into this shape, which is how a hand-written one is bootstrapped.

## Usage

```
.claude/redline/checks.sh <snapshot.json>              full run: commands + git block
.claude/redline/checks.sh --baseline [snapshot.json]   commands only; git is null
.claude/redline/checks.sh --git-only <snapshot.json>   git block only; checks is []
.claude/redline/checks.sh --verdict [--baseline | --git-only] [snapshot.json]
                                                       no run: the verdict of the run kept for this commit
```

Call it by absolute path (`<repoRoot>/.claude/redline/checks.sh`). It works from any cwd inside the repository by changing to `git rev-parse --show-toplevel`. Progress lines go to stderr, one or two short lines a check, naming the check and never its command; stdout carries only the JSON, on one line.

Environment: the workflow sets `REDLINE_OCTANE=1` when the approved plan touches `app/Providers/`, `bootstrap/` or `config/octane.php`; a repository with a long-lived-process suite runs it then (anything that outlives a request: service providers, container bindings, static state). A `checks.sh` may read its own variables too, such as the name of a scratch database for a migrations check.

## An example gate

In order (the `cmd` strings are what runs, through `bash -c`):

| name | cmd | fails the run |
| --- | --- | --- |
| `fix` | `composer fix` (the repo-wide formatter) | no (recorded only) |
| `check` | `composer check` (lint, static analysis, the test suite) | yes |
| `snapshots` | `git status --porcelain tests/.pest/snapshots` prints nothing (the suite created or changed no Pest snapshot; CI fails on one) | yes |
| `migrations` | `php artisan migrate --force --no-interaction` against a scratch database, after `db:wipe` of that database, so it always runs from empty | yes |
| `openapi` | a fresh export of the API contract, then `git diff --exit-code openapi.json` | yes |
| `env` | every `env('NAME')` added by the change (diff of the PR's base to HEAD, in `app config routes database bin`) has a `NAME=` line in `.env.example` | yes |
| `octane` | `composer test:octane` (only with `REDLINE_OCTANE=1`) | yes |

## Output contract

```json
{
  "mode": "full | baseline | git-only",
  "ok": true,
  "checks": [
    {"name": "fix", "exit": 0, "recorded": true},
    {"name": "check", "cmd": "composer check", "exit": 1, "recorded": false, "truncated": true, "stdout": "the tail of a failing check's output: up to 200 lines, within its share of 5 KB", "stderr": "the same"}
  ],
  "git": {
    "start_sha": "the snapshot's start_sha",
    "round_sha": "the snapshot's round_sha, or start_sha when it has none",
    "allowed_count": 14,
    "changed_count": 9,
    "unexpected_files": ["changed files not covered by the allowed list"],
    "uncommitted": ["paths that differ from HEAD or are untracked, outside agent-os/specs/"],
    "commits": [{"sha": "...", "message": "subject line, cut at 100 characters (bytes where awk counts bytes)"}],
    "commits_count": 31,
    "diff_lines": 212,
    "formatter_touched_count": 0
  },
  "kept": "<TMPDIR>/redline-checks/<root key>-<commit>.json"
}
```

The result is sized for what the workflow reads, so the Bash tool shows it inline whatever the pull request's size and however long the run (template v3, #68). What it leaves out is in the kept result, below.

- A check that passed prints `name`, `exit` and `recorded`. A check that failed also prints `cmd`, cut at 120 characters, `truncated`, and the tail of `stdout` and `stderr`.
- `recorded: true` marks a check whose exit code never fails the run (`fix`).
- ANSI escapes (colour, cursor movement, a terminal title) and every other control byte but tab and newline are taken out of each stream as it is captured, so every count and every cut below reads plain text.
- `truncated: true` marks a failing check whose stdout or stderr was cut, by the line count (200) or by bytes. The failing checks share one budget of 5,120 bytes, split evenly among them once every check has run (each stream takes at least half of a check's share when both are long, and a short stream's unused bytes go to the other), so the result stays bounded however many fail. Nothing in the workflow reads `truncated` yet.
- `allowed_count` counts the allowed list the run used: `files` + `plan_paths` + `agent-os/specs/` + `agent-os/standards/` + the repository's `ALWAYS_ALLOWED` (a generated `openapi.json`, say). An entry ending in `/` is a prefix; the rest are exact paths. "Unexpected" therefore means "outside the approved plan", and the plan approver's file-scope review is what makes the list right.
- `changed_count` counts every path that differs between `start_sha` and the working tree, committed or not, untracked included. `unexpected_files`, the ones the allowed list does not cover, is printed whole, since it fails a round.
- `uncommitted` is the working tree against HEAD (modified, added, deleted and untracked), leaving out `agent-os/specs/`, where the round's reply files and snapshot sit uncommitted by design. The checks ran against that tree and the push would omit it, so a full or git-only run fails on it; the workflow's judge reads it too. It is printed whole.
- `commits` lists `round_sha..HEAD` in `git log` order, newest first: the commits made since the newest one an earlier round of the run listed, which are the round's own. With no `round_sha` in the snapshot it lists `start_sha..HEAD`. `commits_count` counts `start_sha..HEAD` either way.
- A commit's `message` is its subject line. A subject over 100 characters is cut at the last space at or before 100 and ends `...`, counted in bytes where `awk` counts bytes, as macOS's does, so a subject with non-ASCII characters can be cut under 100 characters; so a cut never splits a finding id into another one (`R5-10` into `R5-1`). The workflow looks for the round's finding ids in these subjects, and a commit may name one late (`... lessons in the standards, finishing R1-1 and R1-4`), so every id in the part cut off follows the `...`: both forms, `R<round>-<n>` and `H<n>-<k>`.
- `diff_lines` is insertions plus deletions versus `start_sha`, plus the line count of untracked files.
- `formatter_touched_count` counts the files the formatter changed that the allowed list does not cover; such a file is also in `unexpected_files`.
- `git` is `null` in `--baseline` mode. `checks` is `[]` in `--git-only` mode, and `formatter_touched_count` is `null` there because the formatter did not run.

**The budget.** stdout and stderr together, for twelve checks and a round of forty commits, stay under 10 KB when the gate passes (at most 9,240 bytes) and under 25 KB when every check fails (at most 22,960). Neither figure holds the number of files, of allowed paths or of commits since the start, which print as counts; an unexpected or uncommitted path adds its length and three bytes, and both lists are empty when the gate passes. The arithmetic is in the comment above the caps in `scripts/checks-template.sh`, which every generated `checks.sh` carries, and `tests/setup-test.sh` runs both cases: a 300-file pull request with 100 commits since the start measures 8.7 KB passing and 16 KB with all twelve checks failing, and the same run over 600 files and 200 commits is the same size.

**The kept result.** Every run also writes its full result to one file outside the working tree, `<TMPDIR, else /tmp>/redline-checks/<root key>-<commit>.json`, and names it under `kept`. The root key is git's hash of the physical path of the repository's top level, so two worktrees of one repository never read each other's; the commit is HEAD when the run started. A run first removes that root's earlier files, so a root has one kept result, the last run's. The file is `{root, head, mode, snapshot, exit, result, printed}`: `printed` is the object above, and `result` is the same object in full, every check with its whole `cmd` and the last 200 lines of each stream (64 KB at most), and the git block with `allowed`, `changed_files`, `formatter_touched_outside_pr` and every commit since `start_sha` with its whole subject. A run that cannot write the temp directory still prints its result, with `kept` empty.

**`--verdict`** runs no check. It prints the kept run's `printed` object with `"verdict": true` and without any check's `truncated`, `stdout` or `stderr`, and exits with that run's exit code. It reads only the file for this root at the current HEAD, and only when its mode and snapshot are the ones asked for; anything else is exit 2 with one line on stderr (`the kept result here is for commit <sha>, and HEAD is now <sha>; run the gate again`, `no kept result for <root>; run the gate first`, `the kept result is for <mode> <snapshot>, not for ...`). The workflow asks for it when the Bash tool could not show a run's result (see "Exit code").

## Exit code

`0` when every check with `recorded: false` exited 0 and `unexpected_files` and `uncommitted` are both empty; `1` otherwise; `2` for a usage error (no snapshot, a file that is not a snapshot, a `start_sha` or `round_sha` that is not a commit here) and for a `--verdict` with no kept result to print. The workflow reads each check's `exit`, the exit code and the git block; the implementer reads the failing check's output. The checker's own `error` field is text and never decides the verdict: it is a warning in the run's `warnings` on a round that passes, a round whose only failing checks were failing at baseline included, and detail added to the reasons on one the checks, the git block or the exit code already failed; `""`, `''` and `null` count as empty, for this and every agent's `error`, which the workflow normalizes once as each result comes back (#34 round 2 failed a green gate on `""`; #37, R1-3; #42). A result the implementer cannot change stops the run at stage `check`, naming the cause and the fix, with no repair pass: one the checker could not read (`status: result_unreadable`, with `reason` `spilled` when the output went over the Bash tool's inline limit and was saved to a file, `not_json`, `no_git_block`, `backgrounded` when the tool moved a foreground run to the background because it outlasted the 600 s cap, or `no_result` when a background run's wait reported the limit passed, the run gone, or a `checks.sh` exit other than 0, 1 or 2; see "Long gates"), a missing result, exit 2, or a result with no `git` block (#9). A `result_unreadable` whose reason describes the JSON's shape (`not_json`, `no_git_block`) is checked against the JSON the checker returned: when that is one object with a `checks` array and a `git` key (`null` at baseline), the workflow reads it and records the checker's misread as a warning naming the reason; `spilled`, `backgrounded` and `no_result` describe where the output went, which the JSON cannot refute, so the workflow reads no result that came with them (#55). A `spilled` result does not stop the run by itself (#68): the workflow asks the checker, in one more call labelled `<label> verdict`, for `checks.sh --verdict` with the same mode and snapshot, which runs nothing and prints the verdict the script kept for that run (see "Output contract"). A verdict that reads as a gate result takes the spilled one's place, with a warning in the run's `warnings` (`checks.sh's result was too large for the Bash tool to show, so the workflow read the verdict checks.sh kept for that run`): a gate that passed goes on, and one that failed goes to the repair pass with the failing checks named and a sentence saying their output was not relayed. When the verdict gives nothing (exit 2 from a `checks.sh` made before template v3, which has no `--verdict`, or because HEAD moved since the run; or a verdict the tool could not show either), the run stops at `check` as before, the error naming the spill, what the verdict call said, and `/redline:setup`, and `detail.checker` carries that under `verdictError`. The stop names the check's own label, never the verdict's, so a resume runs the gate again, and the verdict prompt of a resumed check carries the attempt number so that it is asked again rather than replayed. `backgrounded` and `no_result` stop as before. The run's `detail.checker` keeps what the checker returned, its `error` normalized; after a structural override it holds the copy the workflow read, `status` `read` and `reason` empty, and the warning is where the checker's own reason is kept (#56, R1-1). The implementer repairs only failing checks and git-block findings.

## Baseline

The checker runs `--baseline` once before the first implement step of a run. "Tests pass" in later runs means no failure the baseline did not already have. The baseline runs every command whatever the checker mode: the workflow needs it to tell a check that was already failing from a new failure. So `checker: git-only` saves the per-round check, not the baseline, and the implementer still runs the full gate on every pass.

## Long gates

The Bash tool stops waiting on a foreground command after 600 s and moves it to the background, and a subagent's background task is killed when the agent finishes. The skill therefore passes the repository's recorded baseline time (`baseline.seconds` in `checks.json`) as `args.baselineSeconds`. When it is over 480 s, or none is recorded, the workflow gives the checker and the implementer two commands in place of the `checks.sh` command line: `redline-background.sh start <label> ...`, run with `run_in_background`, and `redline-background.sh wait <label> --limit <s>`, run in the foreground again while it exits 3. The wait prints what `checks.sh` printed and exits with its exit code when that is 0, 1 or 2 (any other code is the wait's 5, no result), so the result reads as a foreground run's. A `--git-only` check runs no command and stays in the foreground. The stall watchdog restarts only an agent that has been silent for `checkerStallMs`, and each wait is activity, so the wait's `--limit`, set to `checkerStallMs` in seconds, is what bounds a hung background gate: past it, the checker returns `no_result` and the run stops. A gate whose recorded baseline fits but whose run outlasts the cap anyway stops as `backgrounded`: `the gate took longer than the Bash tool allows in the foreground; the checker must background it (recorded baseline: <n> s)`. Re-record the time with `/redline:setup`'s baseline step.

## Gate stamp

The last line of `checks.sh`'s header records the gate it transcribes:

```
# redline-gate: .claude/commands/agent-os/shape-spec.md steps 1-6 sha256:<64 hex>
```

The hash covers every backticked span and every fenced block in the gate's section of `shape-spec.md`, nested lines included, in document order, with runs of whitespace collapsed (a code span that continues on a second line is not recognised). Prose outside backticks never changes it; any backticked change does, so adding or removing a step that holds a backticked span or a fenced block moves the hash, as does giving one a new flag or swapping two such steps. A step written wholly in prose changes nothing when it is added, removed or moved, so a command step keeps its command in backticks. `steps m-n` names the command steps `checks.sh` transcribes and is for the reader: the hash covers the whole section, prose steps included, because a false positive costs a restamp and a false negative is the drift the stamp exists to catch. `/redline:redline` runs `redline-gate.sh check` first in its precheck and stops on any of these lines:

- `the verification gate in <file> has changed since .claude/redline/checks.sh was stamped; bring checks.sh up to date, then restamp with <plugin>/scripts/redline-gate.sh stamp <file> .claude/redline/checks.sh`
- `.claude/redline/checks.sh carries no gate stamp; stamp it with <plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh`
- `the verification gate in <file> is ambiguous: 2 verification gate sections hold a numbered list, the headings at lines <a> ("<heading>") and <b> ("<heading>"); rewrite one so only the gate holds a numbered list, then run check again` (reason `two gates`: the stamp never picks one silently, so a plan-template task written as a numbered list cannot take the real gate's place)

`scripts/redline-gate.sh` is the skill's, never a role's (the guard refuses it to every role, and no role may write `checks.sh`), and `tests/gate-test.sh` is its unit test. Its header, quoted in [scripts.md](scripts.md), is the reference: `extract` finds the gate and prints it as JSON, `stamp` writes the line, `check` compares the two at launch.

`/redline:setup` stamps `checks.sh` as its step 10; `stamp` by hand is the quick path for a repository set up before it existed (see [upgrading.md](upgrading.md)).

## Template version

The header line above the stamp, `# redline-template: checks-template.sh v3`, names the version of `scripts/checks-template.sh` a `checks.sh` was generated from (v2 since #50, v3 since #68; see [upgrading.md](upgrading.md)). `/redline:redline`'s precheck compares it with the plugin's template (`redline-setup.sh version`) and warns, never stops, when the repository's is older or missing: `checks.sh was made from checks-template.sh v2; the plugin ships v3. Run /redline:setup to port the change`. When the repository's is newer than the plugin's (a teammate on an older install), the line says to update the plugin instead, since a rerun would regenerate `checks.sh` from the older template. A rerun of `/redline:setup` regenerates `checks.sh` from `checks.json` and the current template, which is the port. The unattended section of `shape-spec.md` carries a marker of its own, `<!-- redline-unattended: v5 -->`, the first line inside the section, naming the version of `templates/shape-spec-unattended.md` it was pasted from (#15); the same precheck call, `redline-setup.sh version <repoRoot>`, compares it the same way (`the unattended section in shape-spec.md was made from template v1; the plugin ships v5. Run /redline:setup to see the change`; `carries no version marker` for a section pasted before the marker existed), and compares `settings.json` with the allow-list template (`settings.json lacks 2 entries the plugin now expects (…); run /redline:setup`, `settings.json carries 3 entries the plugin retired (…); run /redline:setup`). A rerun of `/redline:setup` merges the template's body changes into the section (see [upgrading.md](upgrading.md)). The same call warns, on this repository only, when the session loads Redline from a copy that is not the checkout under review (`this repository is the plugin, but the run loads Redline from <dir>; start the session with claude --plugin-dir <repoRoot> to run this checkout's own code`, #16; see "Developing the plugin" in [CONTRIBUTING.md](../CONTRIBUTING.md)).

## `redline.json`

The run's configuration, written by `redline-setup.sh config` from `templates/redline.json.example` and kept as the person's on a rerun (only `checker` and `checkerStallMs` are re-derived; see [setup.md](setup.md), step 7). The keys:

| key | what | default |
| --- | --- | --- |
| `maxRounds` | the round cap: how many revise rounds a run makes before it stops with the cap-hit comment | `3` |
| `maxPlanAdjustments` | how many times a plan the plan approver bounced is reshaped before the run stops | `2` |
| `reviewer` | the GitHub login the handoff requests review from; never the person who runs Redline | asked at setup |
| `checker` | `full` runs the whole gate on every round's check; `git-only` runs only the git block there (the baseline and the implementer's runs are always full). Setup derives it: `git-only` when the baseline is over five minutes | derived |
| `checkerStallMs` | the stall watchdog's window for the checker: 1.7 times the baseline, rounded up to five minutes, never below 300000 | derived |
| `push` | whether the GitHub agent pushes; `no push` on the command line overrides it for one run | `true` |
| `models` | one `{model, effort}` per role: `reviewerFirstRound`, `reviewerLaterRounds`, `planApprover`, `standardsApprover`, `checker`, `github`; the revise model is the saved launch setting, not this file. `coverage` is the coverage pass, the finder on every whole-PR and fix-diff round: the built-in `code-review` skill, run from a plain workflow agent over the whole PR at the round's head with every finding reported. `null` turns the pass off for every run (the reviewer alone, as before the pass existed); the key absent means on at `reviewerFirstRound`'s model and effort; `coverage off` on the command line is the per-run form and is never saved. Its `effort` is the level the skill is given, one of `low`, `medium`, `high`, `xhigh` or `max`: `xhigh` is the recipe the spike validated on Claude Code 2.1.318, and `max` runs as a single pass, since a workflow subagent has no Agent tool for the skill's fan-out. Configuration that selects a model is not attribution | the template's |
| `maxFiles` | optional: the most changed files a PR may have before the launch refuses it with "split the PR" | none |
| `askRules` | optional: what a person is always brought in for, below | none |

The file is one of Redline's own: the guard refuses it to every role. `tests/setup-test.sh` pins `config`'s derivations and the rerun's `updated` and `differs` reporting.

### Ask rules

A repository declares what a person is always brought in for as `askRules` in `.claude/redline.json` (#49): a list of `{id, when, reason}`, where `id` matches `[a-z][a-z0-9-]*` and is unique, `when` is `{"paths": ["config/project/**"]}` or `{"prose": "the change alters what a customer is charged"}`, and `reason` is one line written for the review ("Craft project config is applied through the control panel"). Absent or empty, nothing changes. `/redline:setup` asks for them and writes them; a rule edit needs no setup rerun, since `/redline:redline` reads the list at every fresh launch and passes it as `args.askRules` (a relaunch keeps the list the run started with).

```json
"askRules": [
  {"id": "craft-project-config", "when": {"paths": ["config/project/**"]}, "reason": "Craft project config is applied through the control panel"},
  {"id": "billing", "when": {"prose": "the change alters what a customer is charged"}, "reason": "Billing changes are reviewed by finance"}
]
```

A finding a rule covers is the person's: Redline never chooses `fix`, `decline` or `defer` for it, whatever the shaper returned. It comes back as a judgment call with `why_human: "repository rule <id>"`, the story quoting the rule's reason and the options the person's to carry out outside the run (make the change by hand after the run, or accept it as it is); a plan-dial override to `fix` or `defer` is refused with a warning. The review marks it as the person's to act on (` · left to @<login> under rule <id>` on its finding line, and a sentence in its inline comment; the person is named by login, since on a teammate's pull request the person running Redline is not its author). Its reply reads `left to @<login> under repository rule <id> (<reason>). <the decision> · decided by: @<login>`, its thread stays open for the person (the handoff's threads line names it with the rule), the handoff comment lists it under `### Left to @<login> (repository rules)`, and a later run reads the reply as the disposition `left` and never re-raises it. On autopilot the run makes no change for it either: the decision is `decided by: redline (autopilot)`, and the finding's line under `### Left to @<login>` in the handoff says what Redline would have done (`rule <id> (<reason>); open: <what Redline would have done>; left to @<login> under repository rule <id>: ...`). It is not a deferral: only an item with a drafted issue is listed under Deferred (#95). In a human review pass a teammate's comment under a rule takes the same path, unless it asks for nothing (praise, thanks): that one stays `none` and gets `no change requested`, since there is no change to leave to the person (#52, R1-4).

- A **`paths`** rule is enforced twice. The guard refuses a write under one of its globs by every Redline role, naming the rule (and a write to a directory that holds the rule's root, such as `rm -rf config`; a Bash operand holding a wildcard, class or brace list is refused outright, see [guard.md](guard.md)); the target is resolved through symlinks first, so a path outside the repository that resolves into a match is refused too. The workflow forces `ask` for a finding whose file, or any file its planned task would touch, matches, and the plan approver bounces a task that names such a path. Globs are matched case-folded against the repository-relative path: `**` spans directories, `*` and `?` stay inside one segment, a pattern with no `/` matches at any depth, a leading `/` only anchors, a trailing `/` takes the directory and everything in it; no negation and no character classes (a pattern holding `!` or `[` is refused at setup and at launch). No glob should cover `agent-os/specs/`, where Redline writes its own record.
- A **`prose`** rule is judged: the reviewer, the shaper and the plan approver receive the rule list in their prompts. The reviewer may tag a finding with `askRule` (advisory: it marks the review); the shaper sorts a finding the sentence covers as `ask` and tags it, which the workflow then holds to; the plan approver bounces a plan that fixes one.

A malformed list (a bad id, a rule with both or neither kind, a reason that is not one line) stops the launch with one line naming the rule, and the guard refuses every write by a Redline role until a person fixes the file. The rules file is one of Redline's own: no role may write it.

## `redline.local.json`

Each person's saved launch settings for the repository, ignored by git (`redline-setup.sh gitignore` adds the line), so per person per repository. It holds `interrupt`, `revise` (the model id), `maxRounds` and `scope`:

```json
{"interrupt": "guided", "revise": "claude-opus-5-5", "maxRounds": 3, "scope": "all"}
```

and, under `runs`, one marker per PR for a run that stopped (a hand-off, the review dial, an error, a run the harness stopped), written from the harness's own record of the run so the next launch can offer to resume it. How the settings are asked and saved is in [running.md](running.md), "Saved launch settings"; the merge rules and the marker's checks live in `scripts/redline-prefs.sh` (header in [scripts.md](scripts.md)), pinned by `tests/prefs-test.sh`. The file is one of Redline's own: the guard refuses it for every role, and only the skill writes it, through the script.

## `settings.json` and the allow list

`redline-setup.sh settings` merges `templates/settings.allow.json` into the repository's `.claude/settings.json`: the `redline` marketplace under `extraKnownMarketplaces` (so a teammate who trusts the folder gets it without an install command), `redline@redline` under `enabledPlugins`, and under `permissions.allow` what runs outside a guarded role: the workflow (`Workflow(redline:redline-loop)`), the repository's `checks.sh`, edits under `agent-os/specs/`, and read-only `git status`, `git rev-parse` and `git merge-base`, plus one `Bash(<prefix>:*)` per gate command the person confirmed at setup (a Laravel repository might add `composer check`, `php artisan test`, `vendor/bin/pest`). The merge never drops a key or changes a value already there; a kept value that differs from the template's is reported under `conflicts`. `templates/settings.retired.json` lists the entries earlier templates carried and this one does not (the `Bash(/*/scripts/…)` rules, `Edit(//tmp/redlinerepro/**)`, `Bash(git diff|log|show:*)`, retired by #50 because a script of that name at any path an agent could write matched, and `git diff --output=<file>` writes a file); a rerun reports them as `stale` and removes them with `--remove-stale`. The guard approves the plugin's own scripts, the repository's `checks.sh` and read-only git by real path for the main session instead ([guard.md](guard.md)). `tests/setup-test.sh` pins the merge, the conflicts and the stale list.

## The unattended section

A repository's `.claude/commands/agent-os/shape-spec.md` (the Agent OS command that shapes a spec) gains one section, `## Unattended mode (Redline)`, pasted from `templates/shape-spec-unattended.md` by `redline-setup.sh unattended` right after the plan-mode check. A person running shape-spec by hand sees no difference: the section applies only when the shaper's prompt carries the sentence "This is a Redline run; follow shape-spec in unattended mode." It tells the shaper how to answer the questions shape-spec would put to a person, which findings are `fix`, `decline`, `defer` or `ask`, the five cases in which a person is asked and the test for a small refactor ([running.md](running.md), "Dispositions"), how the plan is written, and what JSON to return. Its fill-ins are the repository's own: the gate's command-step range (`gate steps M to N`), the prose steps, the retrospective's step number, and whether the repository has a PR-body standard. Its first line inside the section is the template's version marker, `<!-- redline-unattended: v5 -->` (v4 since #93: the `decline` disposition and the ask cases; v5 since #95: `defer` for any item worth doing outside the pull request, with its drafted issue); the launch precheck compares it with the plugin's and warns when it is older or missing, and a rerun merges the template's changes three ways while keeping hand edits ([upgrading.md](upgrading.md)). The section sits outside the Verification Gate, so adding it never moves the gate stamp. `tests/setup-test.sh` pins the insert, the fill-in rerun, the merge and the frozen bodies under `templates/history/`.

## The CLAUDE.md sentence

Two edits from `templates/claude-md-git-sentence.md`, made by the setup skill with Edit (step 11): one sentence appended to the Git rule that keeps agents from committing ("When the prompt identifies the session as a Redline agent run, git operations follow 'Git rules for Redline agents' in the Redline plugin's README, at the path that prompt gives; otherwise this rule is unchanged."), which is what every Redline agent's prompt keys on, and, where CLAUDE.md forbids AI attribution, one paragraph saying that Redline's own label (`Redline round 2`, the `redline:` commit prefix, the `Redline handoff` comment) is a tool name, not attribution, and that the `models` keys in `redline.json` are configuration. The git rules themselves are in the README under that heading and nowhere else.

## Snapshot file

Two kinds, both under `agent-os/specs/` (inside every allowed list, and committed as the run's record: with the round's spec folder, or by the run-record commit at Finish):

- **Start snapshot**, `<first round's spec folder>/redline/snapshot-start.json`, written by the `/redline:redline` skill after the precheck from `redline-gh.sh pr <n>` and `redline-gh.sh files <n>`, with `plan_paths: []`. The checker's `--baseline` run reads it. A human review pass writes `human-review-<n>.json` beside it (the selector, the reviewer, the reviews, the body and the findings as ingested): the record of what the teammate found, for a later run to compare with what the rounds missed.
- **Round snapshot**, `<round N spec folder>/redline/snapshot.json`, written by the GitHub agent after the plan approver passes, with `plan_paths` set to every path approved so far in the run plus the round's spec folder, and `round_sha` set to the commit the round starts from. Cumulative, because the git block measures from `start_sha` and an earlier round's files are still changed later. The implementer's and checker's full runs read it.

```json
{
  "pr": 42,
  "start_sha": "0123456789abcdef0123456789abcdef01234567",
  "round_sha": "89abcdef0123456789abcdef0123456789abcdef",
  "base_ref": "main",
  "files": ["app/Http/Controllers/OrderController.php"],
  "plan_paths": ["app/Http/Controllers/OrderController.php", "tests/Feature/Orders/"]
}
```

- `pr`: the PR number.
- `start_sha`: the PR's head SHA when the run started (`headRefOid`). The changed files, `commits_count` and `diff_lines` are measured from here.
- `round_sha`: the newest commit an earlier round of the run listed, or `start_sha` in the run's first round; `git.commits` lists what came after it, the round's own commits (#68). It is the same on a resumed attempt of a round, since a round's commits join the run's list only once its check has passed, so the commits a failed attempt made are still listed and checked. Optional: a snapshot without it (the start snapshot, or one an older plugin wrote) lists every commit since `start_sha`, and a `checks.sh` from before template v3 ignores it.
- `base_ref`: the PR's base branch (`baseRefName`). A check that diffs the change against its base (the example's `env`) diffs `merge-base(base_ref, HEAD)..HEAD`. Optional; falls back to `origin/HEAD`, then `origin/main`.
- `files`: the PR's changed files at run start (every path `redline-gh.sh files` lists, all pages).
- `plan_paths`: every path the approved plan names, written by the workflow after the plan approver passes. A trailing `/` makes it a prefix. Optional; empty before the plan exists (the baseline and the first `git-only` precheck).
- The allowed list is `files` + `plan_paths` + `agent-os/specs/` + `agent-os/standards/` + the files the repository's `checks.sh` always allows (a generated `openapi.json`, say). Anything else that changed since `start_sha` is `unexpected_files`.

Required fields are `start_sha` and `files`; the script exits 2 without them. A snapshot elsewhere inside the tree would itself count as a changed file; under `agent-os/specs/` it is allowed.

See also: [setup.md](setup.md) for how each file is written, [running.md](running.md) for how a run reads them, [scripts.md](scripts.md) for the script headers.
