# Standards for PR #41 review round 1

Shaped by Redline in unattended mode. The following standards apply to this work, as they read at shaping time on the PR branch.

---

## scripts/bash-conventions

# Bash scripts

Every script under `scripts/` is its own documentation and talks to the workflow in JSON.

- Every script starts `#!/usr/bin/env bash` and `set -euo pipefail` (`redline-gh.sh`, `redline-guard.sh`, `redline-prefs.sh`, `redline-gate.sh`, `redline-setup.sh`, `checks-template.sh`). The test harnesses use `set -uo pipefail` instead, because one failing case must not stop the table
- A script a workflow reads emits exactly one JSON object on stdout and everything else on stderr: `checks.sh` logs through `log()` to stderr and prints the envelope last; `redline-prefs.sh resolve` and the read subcommands of `redline-gh.sh` print JSON and nothing else
- `bash -n` reads its first file and treats the rest as arguments; check several with `ls <glob> | xargs -n1 bash -n` (#5, R1-3)
- Usage errors exit 2 with a one-line reason on stderr. A check that fails exits 1. A script whose exit code is an answer (`redline-gh.sh has-review`: 0, 1 or 2) says so in its header
- A wrapper that runs another script for a role (`redline-background.sh` around `checks.sh`) passes the wrapped script's stdout, stderr and exit codes through unchanged, so the role reads the result as it would the script's own, and takes the codes above them for its own answers (3 still running, 4 past the limit, 5 no result), stated in its header. It runs one fixed script, never a command it is given, so the guard admits it by subcommand (#40)
- The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. The README quotes from it rather than restating it. A field added to `checks.sh`'s JSON, or a limit changed in it (`run_check` in `scripts/checks-template.sh`), updates the README's output contract in the same change, and a flag that reports a cut is set by every limit that can cut (#7, R1-14). `checks.sh`'s whole JSON stays bounded however many checks fail: the failing checks share one output budget, split evenly among them in a final pass after every check has run, never consumed in run order, because the checker may not Read a result that spills to a file (#7, R1-13)
- A change to what a subcommand selects or prints rewords every description of it in the same commit, found by searching for the old phrase across `README.md`, `skills/` and `agents/` rather than by editing only the `redline-gh.sh` table row that quotes the header: R1-3 changed which review body `human-review` takes and updated the header, the README's `redline-gh.sh` row and the revise skill, and left the README's paragraph on `/redline:redline-revise <pr> review` describing the old selection (#38, R2-1)
- A subcommand added to `redline-gh.sh` or `redline-prefs.sh` is added to the guard's groups in the same change (`GH_READ` for a read subcommand; `gh-all` already covers a write one), and the agent or skill that calls it names the exact spelling
- A script only a skill calls (`redline-prefs.sh`, `redline-gate.sh`, `redline-setup.sh`) needs no guard group: the guard's default deny refuses it to every role, and `tests/guard-cases.tsv` rows pin it as the skill's (#6); when one of its subcommands is reserved for a person, its rule in the shared allow list (`templates/settings.allow.json`, and the repository's `.claude/settings.json`) names only the subcommand the skill runs unprompted (`Bash(/*/scripts/redline-gate.sh check *)`), so the reserved one stays behind the permission prompt (#7, R1-9); `redline-setup.sh`'s writing subcommands have no allow-list rule, and the permission prompt is the person's confirmation (#6), while `version`, which writes nothing and which `/redline:redline`'s precheck runs at every launch, has the one narrow rule, `Bash(/*/scripts/redline-setup.sh version *)`, on the pattern of `redline-gate.sh check`'s (#12, R1-8)
- A generator that writes a file from a template (`redline-setup.sh checks` from `checks-template.sh`) splices by anchor lines and exits 1 naming a missing one, so the template and the generator cannot drift apart silently, and its output is deterministic: the same input gives the same bytes, and nothing is written when they are unchanged (#6). It validates every input field it writes, not only the commands: a field that lands in a comment is a single line, and one that lands inside quotes holds no character that would end or expand them, so a bad `checks.json` exits 2 rather than writing a `checks.sh` that runs a stray line (#12, R1-6)
- A script that edits a person's file (`.gitignore`, `shape-spec.md`, `settings.json`) preserves the file's line endings and a byte-order mark (`settings.json` refuses a byte-order mark instead, exit 2, as its header says), writes only when the bytes change and reports `changed: false` otherwise, so a rerun can say nothing drifted; a JSON file is compared with `jq -S`, since a CLI that rewrites it (`claude plugin install`) reorders keys and that is not drift (#6)
- A merge into a person's JSON file keeps every value already there, adds only what is missing, and reports each kept value that differs from the template (`conflicts`) rather than overwriting it (#12, R1-3, R1-4); every subcommand that writes takes `--dry-run`, which prints the same JSON with `written: false` and creates nothing, not even the target's directory (#12, R1-2)
- A rerun over a file the script wrote earlier changes only the values the script derives from its inputs (`config` updates `checker` and `checkerStallMs` in place, keeping the file's formatting) and keeps every other value as the person's, the ones the person chose at setup included (`reviewer`), listing each that differs from the template under `differs` without changing it; `--force` is the full reset to the template (#12, R1-5)
- Python inside a script is `python3 -I -c "$PYTHON"` with the standard library only, fed on stdin; it writes no file beside the script
- A path the script receives is made absolute once (`cd "$(dirname "$path")" && pwd`) and used as is; the repository is `git rev-parse --show-toplevel`, never a walk from `$PWD`
- A path compared with `git rev-parse --show-toplevel` is made physical first (`pwd -P`): git prints the physical path, and on macOS `/var` is `/private/var`, so a logical path never matches its prefix (#6)
- A header printed by `-h|--help` is printed with `sed -n '2,/^$/p'`, never a numeric range, which rots on every header edit (#6)
- A script that chooses which part of a file to hash refuses when more than one part qualifies, naming each by line, rather than taking the first: a silent switch moves the hash onto the wrong text and every later check passes against it (#7, R1-6)
- Never print a token, a header or an environment dump; `redline-gh.sh` leaves authentication to `gh`
- `jq` reads and writes every JSON value; no hand-built JSON strings in bash
- A JSON value that grows with the pull request (the anchor positions of `place`, megabytes on a 336-file PR) reaches `jq` through `--slurpfile` or `--rawfile` from a temp file, never `--argjson`, which puts it on the command line and fails with "Argument list too long" (#33)
- `redline-gh.sh` never calls `gh pr diff` or `gh pr view --json files`: the first refuses a PR over 300 files, the second stops at 100, so the paginated files endpoint (`gh api --paginate --slurp`, gh 2.48.0 or newer, which the script names when an older gh rejects the flag) is the one source of the file list, the diff and the anchor positions (#33)
- A read subcommand whose answer is a number (`last-round`) prints it as a bare JSON number, `0` for none; one whose answer is yes or no (`has-review`) uses the exit code
- A GitHub login a selector names is matched case-folded (`ascii_downcase` on both sides of the comparison), since GitHub treats logins case-insensitively, and a skill takes the login it writes as an owner from the script's output, never from the text as typed (#38, R1-2)

---

## testing/tests

# Tests

Seven harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- `tests/guard-test.sh` over `tests/guard-cases.tsv`: every row is the hook input Claude Code would send (`agent_type`, tool, command or path) and the decision expected. A `# @cwd PLUGIN` line sends the rows after it from the checkout, where the repository is the plugin. About 60 ms a row; 350 rows on 2026-10-21
- `node tests/loop-test.mjs`: `workflows/redline-loop.js` under scripted `agent()` and `parallel()`; it asserts which agents ran, in what order, with what prompt text, and what the script returned. No model, no GitHub, no repository. Its human-pass scenario proves the H ids, the reviewer and the author as owners, the final nit pass as a Redline round and the summary comment in place of the handoff (#36)
- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7; #37, R1-1)
- A loop-test scenario scripts the checker's result shape per call (a passing gate with a stray `error`, a failing gate, an unreadable result, a baseline that cannot be read), as it scripts the reviewer's findings, so the stop and the repair paths are both asserted (#9)
- `tests/prefs-test.sh`: the merge rules of `scripts/redline-prefs.sh`, in a throwaway repository under the temp directory
- `tests/gate-test.sh` over `tests/gate-fixtures/`: the gate parser and the stamp of `scripts/redline-gate.sh`, on one synthetic `shape-spec.md` per gate shape seen so far, mutated with `sed` and `awk` in the temp directory; the fixture hashes are pinned inline, and the last case checks this checkout's own stamp (#6)
- `tests/setup-test.sh` over `tests/setup-fixtures/`: the subcommands of `scripts/redline-setup.sh`, on a settings file with other keys, a bare `shape-spec.md` and a Laravel-shaped `checks.json`, in the temp directory; its last cases regenerate this checkout's own `checks.sh` from its committed `.claude/redline/checks.json`, stamp it and compare, and prove a regenerate over the committed file is a no-op (#6)
- `tests/gh-test.sh` over `tests/gh-fixtures/`: the read subcommands of `scripts/redline-gh.sh` that a large pull request exercises (`files`, `diff`, `place`, `last-round`, `has-review`) and the human-review ingest (`human-review`, `last-human-review`, on a PR with a teammate's submitted review, their single comment, their reply inside a Redline thread and the author's hand reply; #36; a thread two teammates share, under a Redline reply that names the one comment it answered; #38, R1-1; a review body a Redline human review comment answered, beside an older open one and a teammate's comment that quotes the header without the marker; #38, R1-3), against a fake `gh` first on PATH that serves the fixtures by endpoint (an array of pages for `--paginate --slurp`, a `--jq` filter applied with the real jq), refuses `gh pr diff` as GitHub does over 300 files, refuses every write, and plays an older gh that rejects `--slurp`; nothing reaches GitHub (#33)
- `tests/background-test.sh`: `start` and `wait` of `scripts/redline-background.sh` against a stub `checks.sh` in a throwaway repository with its own `TMPDIR`: results passed through as printed (exit 0, 1 and 2), still running, past the limit, a run that died or never started, a rerun under the same label; `REDLINE_BACKGROUND_POLL` shortens the waits (#40)
- A harness that polls for a file the script under test writes bounds the poll (`within <seconds> <test>`), so a red run, where the script is missing, fails the case instead of hanging the table (#40)
- A fixture is made large enough to hit the limit it guards: the gh harness's 150 small files passed while Losers League #778 (336 files, a 1.8 MB diff) overflowed the command line, so it also carries a 60,000-line patch (#33)
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change
- A comparison of two command outputs passes when both are empty, so a harness pins at least one output against a literal before it compares outputs with each other (#6); a check that two outputs differ also requires each side to be a well-formed value, since the empty output of a failed command differs from everything (#7, R1-10)
- A case named for a boundary asserts the boundary itself: one that says it checks a header's last line matches the last non-blank line of the output, not text a few lines before it, or a cut between the two still passes (#34, R2-1)
- `.claude/redline/checks.sh` carries the gate stamp (`# redline-gate:`); a change to the backticked text of the gate list in `shape-spec.md`, or to how `scripts/redline-gate.sh` computes the hash or writes the stamp line, restamps it in the same commit, and the gate test's last case proves it (#6; #7, R1-1). `checks.sh` is generated: a change to a check edits `.claude/redline/checks.json` and regenerates with `scripts/redline-setup.sh checks .claude/redline/checks.json .claude/redline/checks.sh` in the same commit, never a hand edit, and the setup test's last cases prove the two agree (#6)
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix
- The tests write only under the temp directory and `~/.cache/redline/`, never into the checkout; a fixture copy is changed with `sed ... > <copy>` (or `awk`) in the temp directory, never `sed -i`, whose argument differs between BSD and GNU sed (#12, R1-9)
- A stand-in checkout (a copy of the working tree made to prove a rerun or a fresh setup) goes outside the temp directory: the guard's `TMP` prefix lets every role write there, so the guard test's write rows show false allows from a checkout under it (#6)
- The gate records its baseline time in `.claude/redline/checks.sh`'s header; a test that doubles it says why in its own header

---

## process/standards-retrospective

# Standards retrospective

Every spec ends by asking what it taught, mechanically, and the answer lands in a standard or is recorded as "no changes".

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: list every Decision in `shape.md`, every deviation in `plan.md`'s As built, and every check that went red and was fixed by learning something; classify each as already in a standard, missing, or contradicting one
- Approved edits land in their own commit, separate from the spec's code. Code that enforces a new rule (a guard-cases row, a loop-test check) follows in its own commit with the case proving a violation fails
- In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit
- When nothing changes, `shape.md` records "Standards retrospective: no changes" under Decisions, so the absence is deliberate and visible
- A standards edit keeps the file's headings: they diff empty against `main` unless the spec names the section it adds, renames or removes
- `index.yml` lists every standard and nothing else; a new file is added to it in the same commit, alphabetised by folder and file
