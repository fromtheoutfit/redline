# The guard

What each Redline role may run and write, how the hook that enforces it is wired, how to read and run the guard's regression table, and what changes when Redline reviews its own repository. The guard is `scripts/redline-guard.sh`; its header is quoted below, verbatim at version 0.1.1. Where a command names `<plugin>`, it is the directory `claude plugin list` prints as `Read from:` for `redline@redline`.

## The hook

A plugin's agents cannot carry their own hooks (Claude Code ignores `hooks`, `permissionMode` and `mcpServers` in a plugin agent's frontmatter), so the guard is a plugin hook. A plugin hook fires on every matching tool call in every session where the plugin is enabled, so the guard first reads `agent_type` from the hook input. Claude Code sets it to `redline:redline-<role>` inside a Redline agent (`redline-<role>` for a copy installed into `.claude/agents/`). Anything else, or no `agent_type` at all (the main session), is not a Redline role: the guard exits 0 with no output, and the call goes on as if the hook were not there, with one exception (#50). A Bash call from such a session that is one of the plugin's own scripts by real path (`redline-gh.sh`'s read subcommands, `redline-prefs.sh`, `redline-gate.sh check`, `redline-setup.sh version`), the repository's own `.claude/redline/checks.sh`, or read-only git under the vetting below, each as the bare command word (nothing in front of it: no wrapper, `env`, `timeout` or `xargs`; a `cd` to the repository root before it is fine), is approved, so the shared allow list carries no `Bash(/*/scripts/…)` rule that a script of the same name at any path an agent could write would match; anything else from such a session, a builtin, `sed`, `find` or a pipe into another command included, is left to the permission prompt, never refused (#54). A skill fork is the other way a call escapes the guard: a `Skill` call forks the calling agent, and the fork's hook input carries no Redline `agent_type`, so the fork is a non-role session to the guard even when a Redline role made the call (spike #72). Its commands run unvetted, and the #50 exception above applies to it: the plugin's scripts by real path (of `redline-gh.sh`, only its read subcommands), `checks.sh` and read-only git are approved with no prompt, and a `redline-gh.sh` write (a review, a reply, a comment, an issue, a thread resolve) is left to the permission prompt, never refused (#80, R2-5; `tests/guard-cases.tsv` pins it). The cost is one prompt in the main session too: filing a deferred issue after a run asks once in default mode. That is why the coverage pass, the built-in `code-review` skill, is a plain workflow agent and never a role; the README's Known limits say what it runs.

`hooks/hooks.json` registers it:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Write|Edit|MultiEdit|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/scripts/redline-guard.sh\""
          }
        ]
      }
    ]
  }
}
```

The header of the script:

```text
#
# redline-guard.sh: PreToolUse hook for Redline's subagents, registered by the plugin's
# hooks/hooks.json on Bash, Write, Edit, MultiEdit and NotebookEdit.
#
# A plugin hook fires in every session where the plugin is enabled, and a plugin agent's
# frontmatter hooks are ignored, so the guard learns its role from the hook input:
# agent_type is "redline:redline-<role>" for the plugin's agents (or "redline-<role>" for a
# copy installed into .claude/agents/). Any other agent_type, or none (the main session), is
# not a Redline role: the guard exits 0 with no output and the call goes on as if the hook
# were not there. An agent_type of the Redline form whose role is not in the table is refused.
#
# Reads the hook JSON on stdin. For a Bash call it tokenises tool_input.command,
# splits it into simple commands, and exits 2 with a one-line reason unless BOTH
# hold for every simple command: (a) the command (and for git, gh, composer, php
# and the Redline scripts, its subcommand) is on the role's allowlist, and (b)
# every write target it can extract (>, >>, tee, sed -i, mv/cp, rm, mkdir, touch,
# git add paths, ...) is under one of the role's write prefixes. For a Write,
# Edit, MultiEdit or NotebookEdit call it checks tool_input.file_path against the
# same prefixes. Default deny: anything it cannot classify is refused.
#
# What it allows it also approves: it prints a PreToolUse permissionDecision of
# "allow" on stdout, so a guarded Redline role never meets a permission prompt for
# a command the guard vetted, and the shared settings.json needs no git write
# rules that would reach every other session in the repository.
#
# The repository is the one holding the hook's cwd. The plugin's own files are found through
# CLAUDE_PLUGIN_ROOT, which Claude Code exports to plugin hooks (this script's parent directory
# when it is run by hand, as tests/guard-test.sh does). When the two are the same directory
# (Redline loaded in place from its own checkout, reviewing itself), the plugin's source is the
# repository's content and the roles write it by the same rules as any other; see the table.
#
# Needs python3 (macOS command line tools) and jq. Set REDLINE_GUARD_LOG=<file> in the
# environment Claude Code starts from to append one line per decision for tuning, inert ones
# included: agent_type (- for the main session), decision, reason, command or path.
```

## The roles

For a Redline role it is a default-deny allowlist, in a table at the top of the script: the commands each role may run, and the paths it may write. What the guard allows it also approves (a `PreToolUse` `allow`), so a Redline role never stops at a permission prompt for a vetted command, and no git write rule has to sit in the shared `settings.json` where every other session would get it too. It needs `python3` and `jq`. The table and its legend, from the script:

```text
# The allowlist. One line per role: role | command groups | write prefixes.
#
# Command groups (defined in the Python below):
#   read       file and text tools, read-only php artisan commands, read-only git
#   tests      php artisan test, vendor/bin/pest, composer test
#   build      composer check/fix/lint/test*, vendor/bin/{pint,phpstan,rector,pest},
#              php artisan <anything except tinker, db:wipe, migrate:fresh, migrate:reset>, npm run
# A vendor/bin tool is accepted in any spelling that resolves to the repository's own copy
# (vendor/bin/pest, ./vendor/bin/pest, <repo>/vendor/bin/pest), and in no other. So is
# artisan after php (php artisan, php ./artisan, php <repo>/artisan).
#   checks     the repository's .claude/redline/checks.sh, and the plugin's scripts/redline-background.sh
#              start | wait, which runs that checks.sh in the background for a long gate (#40)
#   gh-read    the plugin's scripts/redline-gh.sh pr | diff | pr-comments | issues-search | review-comments | has-review | last-round | prior-findings | files | login | place | human-review | last-human-review | threads
#   gh-all     the plugin's scripts/redline-gh.sh, every subcommand
#   git-read   read-only git alone (status, log, rev-parse, ...), without the file tools of read
#   git-add    git add <paths>  (never -A, --all, -u, ., *)
#   git-commit git commit -m/-F (never -a, --amend, --no-verify; message starts "redline:", no attribution)
#   git-push   git push [remote [branch]]  (never --force, -f, --force-with-lease, --delete, +ref)
#
# Write prefixes:
#   NONE   no write target of any kind (/dev/null is never a write)
#   TMP    the system temp dir, $TMPDIR and the hook's scratchpad_dir
#   REPO   anywhere inside the repository
#   <path> a repository-relative prefix
# .git/ and Redline's own files (the plugin's directory, .claude/redline/, .claude/redline*.json,
# .claude/settings*.json, and the copies .claude/agents/redline-*, .claude/workflows/redline-*,
# .claude/skills/redline* an install into .claude/ would add) are refused for every role (Redline
# never edits Redline), and so is a write that would take them along (rm -rf .claude). The
# rest of .claude/ (commands, other skills and agents, CLAUDE.md beside it) is ordinary repository
# content: the implementer may write it when the approved plan names it, and the checker's
# allowed list is what holds the implementer to the plan.
# A Bash write target holding *, ?, [ or { is refused for every role unless it is under the temp
# directory: the guard checks paths, not patterns, so a role names its files (#53). A tool's
# file_path is literal.
# When the repository is the plugin (its checkout loaded in place, Redline reviewing itself), the
# plugin's directory is the repository, so it is not refused as a whole: agents/, scripts/,
# workflows/, skills/, tests/, templates/, hooks/ and the README are repository content under the
# same prefixes. Two files stay refused for every role there, because they are the guard that
# vets the run: scripts/redline-guard.sh and hooks/hooks.json. A person changes those.
# A repository's ask rules (askRules[].when.paths in <repo>/.claude/redline.json, #49) name the files
# a person is always brought in for: a write under one is refused for every role, naming the rule,
# and so is a write to a directory that holds a rule's root (rm -rf config). The target is resolved
# through symlinks first, so a path outside the repository that resolves into a match is refused
# too. Globs: ** spans directories, * and ? stay inside one segment, a pattern with no / matches at
# any depth, a trailing / takes the directory and everything in it; matched case-folded against the
# repository-relative path (the same dialect as workflows/redline-loop.js). A malformed askRules
# list refuses every write by a role, naming the fault, until a person fixes the file.
# ---------------------------------------------------------------------------
REDLINE_GUARD_TABLE='
reviewer           | read tests gh-read                                | TMP
shaper             | read tests gh-read                                | TMP agent-os/specs/
resolve            | read                                              | agent-os/specs/
plan-approver      | read gh-read                                      | NONE
standards-approver | read                                              | NONE
implementer        | read tests build checks git-add git-commit        | TMP REPO
checker            | checks                                            | NONE
github             | gh-all git-read git-add git-commit git-push       | TMP agent-os/specs/
'
export REDLINE_GUARD_TABLE
```

Beyond the table, the guard refuses, for every role:

- **Redline's own files:** the plugin's directory, `.claude/redline/`, `.claude/redline*.json`, `.claude/settings*.json`, and the `.claude/{agents,workflows,skills}/redline*` copies an install into `.claude/` would add, and a write that would take a directory holding one of them along (`rm -rf .claude`). The rest of `.claude/` is ordinary content the implementer may write when the plan names it.
- **The guard and the hook, when the repository is the plugin** (this checkout loaded in place, Redline reviewing itself): the plugin's directory is then the repository, so `agents/`, `scripts/`, `workflows/`, `skills/`, `tests/`, `templates/` and the README are repository content under the roles' usual prefixes, `.claude/`'s Redline files stay refused, and so do `scripts/redline-guard.sh` and `hooks/hooks.json`, the guard that vets the run, which a person changes.
- **The repository's ask rules:** a write under a `paths` rule's globs in `.claude/redline.json`, or to a directory holding a rule's root, naming the rule, after the target is resolved through symlinks (see "Ask rules" in [contract.md](contract.md)); a malformed list refuses every write until a person fixes the file.
- **A wildcard, character class or brace list in a Bash write target** (`*`, `?`, `[` or `{`): the guard checks paths, not patterns (a pattern that matches nothing when the hook runs can match a file an earlier command in the same call creates), so a role names its files, and the refusal names the protected file or ask rule the pattern could reach (#53). A pattern under the temp directory is the exception, when the wildcard is in its last segment and no segment is `..`, since the text after the wildcard is never resolved (#54); a tool's `file_path` is literal, and so is a sed script (`sed -i -e 's/[0-9]*/x/' <file>` checks the file, not the regex); `git add` of a path that names an existing file exactly (`app/pages/[id].php`, a route) stages that file (#54).
- **A read-only git flag that writes a file or runs a program:** `--output`, `-O`, `--ext-diff`, every `-c` and `--config-env`, `--exec-path`, in any spelling git's parser accepts: `-O` anywhere in a bundle (`-lO<pager>`) and any abbreviation of the long form (`--open=<pager>`) (#50, #54).
- **git anywhere but the repository root:** after `-C` and any `cd`, git's working directory must be the root, so `git -C <dir> …` and `cd <dir> && git …` are refused, since a repository under `<dir>` (one a role wrote under the temp directory, or a nested one) can name a program in its config (#54).
- **A variable set for a child:** `export`, `declare`, `typeset`, `set`, `readonly` and `local` as commands, and a `NAME=value` prefix on any command, bare or through `env` (`PATH`, `BASH_ENV` and `GIT_EXTERNAL_DIFF` each reach a program through any command word), except `REDLINE_OCTANE` and the `env` names of the repository's `checks.json` `vars`, whose value must be a plain word; every `env` option (#50, #54).
- **`!` and the shell keywords** (`if`, `for`, `while`, `case`, `function` and the rest): the word after one would never be read, so a role runs plain pipelines, `a && b` in place of `if a; then b; fi` (#54).
- **A sed script that writes a file or runs a command, and find's file writers:** `w`, `W` and `e` as a command, and `w` and `e` among the flags of `s`, in every script a sed call carries (positional, after `-e`, in `--expression=`, and the file after `-f`, read from disk), `-n` or `-i` alike; the script is read as sed reads it, so a `w` inside the pattern or replacement of `s` or `y`, in a label or in the text of `a`, `i` and `c` is text, and a script the reader cannot place, or a script file it cannot read, is refused too; and `find -fprint`, `-fprint0`, `-fprintf` and `-fls` (#54).
- **Interpreters and escapes:** `python3`, `node`, `php -r`, `gh`, `curl`, `eval`, `source`, `sudo` and the rest of the script's refused list; `bash` only as `bash -c <string>`, checked recursively; a runnable backtick, and `$(...)` inside quotes.

## Reading `tests/guard-cases.tsv`

`tests/guard-test.sh` feeds every row of `tests/guard-cases.tsv` to the guard as the hook input Claude Code would send and prints the decisions as a table, marking mismatches; it exits 1 on any. Every change to the guard adds or changes a row in the same commit, beside a row for the neighbouring decision that must not change, and a bug fix lands red before green: the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one.

A row is four tab-separated columns, with an optional fifth:

| column | holds |
| --- | --- |
| `agent_type` | what Claude Code puts in the hook input: `redline:redline-<role>` for the plugin's agents, `redline-<role>` for a copy installed into `.claude/agents/`, anything else for another agent, `-` for none (the main session) |
| expected | `allow` (exit 0 with a `permissionDecision` of `allow`), `deny` (exit 2 with a reason on stderr) or `inert` (exit 0 with no output: not a Redline role) |
| tool | `Bash`, `Write`, `Edit`, `MultiEdit` or `NotebookEdit` |
| command or path | the Bash command, or the tool's `file_path`; `REPO/` is the repository root, `PLUGIN/` the plugin root, `ASK/` the ask-rules fixture, and `\n` is expanded |
| reason (optional) | text the deny reason must contain; a row with one mismatches when the guard denies for another reason |

A directive line switches the hook's working directory for the rows after it: `# @cwd REPO` (the default) sends them from the repository the test runs in; `# @cwd PLUGIN` from the plugin's own checkout, where the repository and the plugin are the same path (Redline reviewing itself); `# @cwd ASKRULES` and `# @cwd ASKRULESBAD` from two fixture repositories the harness prepares on every run under `~/.cache/redline/` (a rules file with a paths, an any-depth and a prose rule, a symlink into a match, a `checks.json` declaring one gate variable, two files whose names hold a bracket, two sed scripts; and a malformed list). A main-session row (`-`) expects `allow` for the plugin's scripts by real path, the repository's `checks.sh` and read-only git, and `inert` for everything else, never `deny`.

Run it from a repository that uses Redline; from the plugin's own checkout, or outside any repository, it uses an empty repository under `~/.cache/redline/guard-test-repo` for the ordinary rows, since those need a repository that is not the plugin and a temp directory is one of the roles' scratch areas:

```bash
<plugin>/tests/guard-test.sh
<plugin>/tests/guard-test.sh my-new-rows.tsv
```

About 60 ms a row; this repository's whole baseline, the guard table included (389 rows then), took 78 seconds on 2026-10-26. Set `REDLINE_GUARD_LOG=<file>` in the environment Claude Code starts from to log every decision, inert ones included: `agent_type`, decision, reason, command or path, one line each.

## Self-hosted: Redline reviewing itself

This repository is set up for Redline like any other (`.claude/redline/checks.sh`, `.claude/redline.json`, the allow list, Agent OS under `.claude/commands/agent-os/` and `agent-os/`), so a Redline pull request gets a Redline review. When the checkout loads in place (a session started with `claude --plugin-dir <checkout>`, or the local-directory marketplace; see "Developing the plugin" in [CONTRIBUTING.md](../CONTRIBUTING.md)), the plugin's directory is the repository, so `agents/`, `scripts/`, `workflows/`, `skills/`, `tests/`, `templates/`, `docs/` and the README are repository content under the roles' usual prefixes, and the implementer may write them when the approved plan names them. Two files stay refused for every role there, because they are the guard that vets the run: `scripts/redline-guard.sh` and `hooks/hooks.json`. A person changes those, and `tests/guard-cases.tsv`'s rows after `# @cwd PLUGIN` pin the decision (`allow Write REPO/scripts/redline-guard.sh` in an ordinary repository beside the self-hosted `deny`).

Loaded from a cached release instead, the guard treats this checkout as an ordinary repository and does not refuse those two files; the launch precheck warns (`redline-setup.sh version .`), and only point 11 of the unattended section in this repository's `.claude/commands/agent-os/shape-spec.md` and the teammate's review keep a change to them out of a plan. Issue #66 tracks protecting them by the repository's manifest instead. A finding in either file is deferred: mitigated by a `tests/guard-cases.tsv` row pinning today's decision or a line under Known limits in the README, and a person makes the change after the run. The same holds for `.claude/redline/checks.sh` and its stamp, which no role may write, so a finding whose fix changes the gate's backticked text, how `scripts/redline-gate.sh` computes the hash, or what `redline-setup.sh checks` writes into `checks.sh`, is deferred to a person too (the README, Known limits).

See also: [contract.md](contract.md) for the ask rules and the files the guard protects, [running.md](running.md) for what each role does in a run, [scripts.md](scripts.md) for the other scripts' headers.
