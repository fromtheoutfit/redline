# Standards for PR #34 review round 2

Shaped by Redline in unattended mode. The following standards apply to this work, as they read at shaping time.

---

## testing/tests

# Tests

Six harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- `tests/guard-test.sh` over `tests/guard-cases.tsv`: every row is the hook input Claude Code would send (`agent_type`, tool, command or path) and the decision expected. A `# @cwd PLUGIN` line sends the rows after it from the checkout, where the repository is the plugin. About 60 ms a row; 350 rows on 2026-10-21
- `node tests/loop-test.mjs`: `workflows/redline-loop.js` under scripted `agent()` and `parallel()`; it asserts which agents ran, in what order, with what prompt text, and what the script returned. No model, no GitHub, no repository
- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7)
- `tests/prefs-test.sh`: the merge rules of `scripts/redline-prefs.sh`, in a throwaway repository under the temp directory
- `tests/gate-test.sh` over `tests/gate-fixtures/`: the gate parser and the stamp of `scripts/redline-gate.sh`, on one synthetic `shape-spec.md` per gate shape seen so far, mutated with `sed` and `awk` in the temp directory; the fixture hashes are pinned inline, and the last case checks this checkout's own stamp (#6)
- `tests/setup-test.sh` over `tests/setup-fixtures/`: the subcommands of `scripts/redline-setup.sh`, on a settings file with other keys, a bare `shape-spec.md` and a Laravel-shaped `checks.json`, in the temp directory; its last cases regenerate this checkout's own `checks.sh` from its committed `.claude/redline/checks.json`, stamp it and compare, and prove a regenerate over the committed file is a no-op (#6)
- `tests/gh-test.sh` over `tests/gh-fixtures/`: the read subcommands of `scripts/redline-gh.sh` that a large pull request exercises (`files`, `diff`, `place`, `last-round`, `has-review`), against a fake `gh` first on PATH that serves the fixtures by endpoint (an array of pages for `--paginate --slurp`, a `--jq` filter applied with the real jq), refuses `gh pr diff` as GitHub does over 300 files, refuses every write, and plays an older gh that rejects `--slurp`; nothing reaches GitHub (#33)
- A fixture is made large enough to hit the limit it guards: the gh harness's 150 small files passed while Losers League #778 (336 files, a 1.8 MB diff) overflowed the command line, so it also carries a 60,000-line patch (#33)
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change
- A comparison of two command outputs passes when both are empty, so a harness pins at least one output against a literal before it compares outputs with each other (#6); a check that two outputs differ also requires each side to be a well-formed value, since the empty output of a failed command differs from everything (#7, R1-10)
- `.claude/redline/checks.sh` carries the gate stamp (`# redline-gate:`); a change to the backticked text of the gate list in `shape-spec.md`, or to how `scripts/redline-gate.sh` computes the hash or writes the stamp line, restamps it in the same commit, and the gate test's last case proves it (#6; #7, R1-1). `checks.sh` is generated: a change to a check edits `.claude/redline/checks.json` and regenerates with `scripts/redline-setup.sh checks .claude/redline/checks.json .claude/redline/checks.sh` in the same commit, never a hand edit, and the setup test's last cases prove the two agree (#6)
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix
- The tests write only under the temp directory and `~/.cache/redline/`, never into the checkout; a fixture copy is changed with `sed ... > <copy>` (or `awk`) in the temp directory, never `sed -i`, whose argument differs between BSD and GNU sed (#12, R1-9)
- A stand-in checkout (a copy of the working tree made to prove a rerun or a fresh setup) goes outside the temp directory: the guard's `TMP` prefix lets every role write there, so the guard test's write rows show false allows from a checkout under it (#6)
- The gate records its baseline time in `.claude/redline/checks.sh`'s header; a test that doubles it says why in its own header

---

## scripts/bash-conventions (the lines this round relies on)

From `agent-os/standards/scripts/bash-conventions.md`:

- Every script starts `#!/usr/bin/env bash` and `set -euo pipefail` (`redline-gh.sh`, `redline-guard.sh`, `redline-prefs.sh`, `redline-gate.sh`, `redline-setup.sh`, `checks-template.sh`). The test harnesses use `set -uo pipefail` instead, because one failing case must not stop the table
- Usage errors exit 2 with a one-line reason on stderr. A check that fails exits 1. A script whose exit code is an answer (`redline-gh.sh has-review`: 0, 1 or 2) says so in its header
- The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. The README quotes from it rather than restating it.
- A header printed by `-h|--help` is printed with `sed -n '2,/^$/p'`, never a numeric range, which rots on every header edit (#6)

The rest of the file (JSON on stdout, guard groups, generators, merges, paths, `jq`, the paginated files endpoint) does not bear on a one-line test change.

---

## process/standards-retrospective

# Standards retrospective

Every spec ends by asking what it taught, mechanically, and the answer lands in a standard or is recorded as "no changes".

- Gate step 9 in `.claude/commands/agent-os/shape-spec.md`: list every Decision in `shape.md`, every deviation in `plan.md`'s As built, and every check that went red and was fixed by learning something; classify each as already in a standard, missing, or contradicting one
- Approved edits land in their own commit, separate from the spec's code. Code that enforces a new rule (a guard-cases row, a loop-test check) follows in its own commit with the case proving a violation fails
- In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit
- When nothing changes, `shape.md` records "Standards retrospective: no changes" under Decisions, so the absence is deliberate and visible
- A standards edit keeps the file's headings: they diff empty against `main` unless the spec names the section it adds, renames or removes
- `index.yml` lists every standard and nothing else; a new file is added to it in the same commit, alphabetised by folder and file
