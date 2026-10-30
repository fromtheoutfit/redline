# PR #52 review round 2 — Plan

Shaped by Redline in unattended mode. Round 2 reviewed only round 1's fix diff (`b005f1d..da5b577`) and found one correctness bug, R2-1. It is a fix: setup's ask-rules check matches an id with `^...$`, and jq's `$` also matches before a final newline. So setup accepts and writes the id `"a\n"`, which the guard and the workflow refuse. Nothing goes back to the person and nothing is deferred.

- **R2-1** (Task 2): setup's ask-rules check matches the id against the whole string (`\A...\z`), as the guard's `fullmatch` and the workflow's `/^...$/` do.

Every commit message starts `redline: ` and references (#49), the issue the PR closes. Every path below is under `/Users/michaelwitwicki/Code/Claude/redline/`.

The guard does not let the implementer run `node` or the `tests/*.sh` harnesses directly (its `tests` group is `php artisan test`, `vendor/bin/pest` and `composer test`, `scripts/redline-guard.sh:60`; `checks` is `.claude/redline/checks.sh` and `redline-background.sh start | wait`, 66-67). So every harness runs through the gate:
- for the red run, `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh --baseline` (recorded baseline 78 s, `.claude/redline/checks.json:10`, so it fits one foreground call with `timeout: 600000`);
- for the round, Task 4's command.

No task touches any of these, so nothing is restamped or regenerated:
- the Verification Gate section of `.claude/commands/agent-os/shape-spec.md`;
- `.claude/redline/checks.json` and `.claude/redline/checks.sh`;
- `scripts/checks-template.sh` and `scripts/redline-gate.sh`;
- `scripts/redline-guard.sh` and `hooks/hooks.json`.

`ask_rules_fault` is the `config` subcommand's validator. It is not part of the `checks` generator, so the setup test's last cases, which regenerate `checks.sh`, are unaffected.

## Task 1: Save spec documentation

Files:
- `agent-os/specs/2026-10-30-0905-52-review-round-2/plan.md`
- `agent-os/specs/2026-10-30-0905-52-review-round-2/shape.md`
- `agent-os/specs/2026-10-30-0905-52-review-round-2/standards.md`
- `agent-os/specs/2026-10-30-0905-52-review-round-2/references.md`

The shaper already wrote all four. Commit them in the round's first commit, never with a finding's change. Leave `redline/` under the folder to the workflow.

Commit: `redline: save review round 2 spec for PR #52 (#49)`

## Task 2: R2-1 have setup's ask-rules check match an id against the whole string, as the guard and the workflow do

Files: `scripts/redline-setup.sh`, `tests/setup-test.sh`

What happens today:
- `scripts/redline-setup.sh:463`, in `ask_rules_fault`'s jq program: `($r.id | test("^[a-z][a-z0-9-]*$") | not)`. jq's `$` also matches before a final newline, so the id `"a\n"` passes. `cmd_config` (503-509) then writes the list into `.claude/redline.json`.
- The guard (`scripts/redline-guard.sh:221`, 277: `RULE_ID.fullmatch`) and the workflow (`workflows/redline-loop.js:109`, 120-121: `/^[a-z][a-z0-9-]*$/`, no `m` flag) refuse that id. From then on the guard refuses every write by every Redline role, and every launch stops naming the rule.
- The script's header (39, 44), the README `config` row (`README.md:310`) and the comment above the function (452-455) all say setup refuses what the guard refuses, with the same message, exit 2.

Red first: in `tests/setup-test.sh`, directly after line 230 (`expect_exit "a bad id: exit 2" ...`) and before line 231 (the `printf` that writes `rules-dup.json`), add these five lines:

```
printf '[{"id": "a\\n", "when": {"paths": ["x"]}, "reason": "r"}]\n' > "$WORK/rules-id-newline.json"
expect_stderr "an id ending in a newline: exit 2 naming the rule, as the guard and the workflow refuse it" "askRules\[1\]: id must match \[a-z\]\[a-z0-9-\]\*" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-id-newline.json"
expect_exit "an id ending in a newline: exit 2" 2 config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-id-newline.json"
printf '[{"id": "a-1", "when": {"paths": ["x"]}, "reason": "r"}]\n' > "$WORK/rules-id-digit.json"
expect_json "an id with a digit and a hyphen: still accepted" '.askRules[0].id' "a-1" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-id-digit.json"
```

The first `printf` writes the JSON text `"a\n"`, which decodes to `a` followed by a newline. The shaper checked this: `["a\n",2]` for the id and its length. With no root, `config` writes nothing and prints `askRules` from its output (`expect_json "no root: the list rides in config"`, line 226, reads the same field).

Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh --baseline`. The `setup` check must print `N passed, 2 failed`, and the two failures must be the two newline cases:
- today the `"a\n"` list exits 0 with nothing on stderr;
- the `"a-1"` case passes before and after the fix.

At shaping time the count was 275 (round 1's As built), so the expected line is `276 passed, 2 failed`. If the count differs, record the baseline under As built.

Change, `scripts/redline-setup.sh`:
- Line 463, inside the quoted heredoc, changes one expression only, and the message text stays exactly as it is. `($r.id | test("^[a-z][a-z0-9-]*$") | not)` becomes `($r.id | test("\\A[a-z][a-z0-9-]*\\z") | not)`, so the whole line reads (six leading spaces, as now):

  ```
        elif ($r.id | type) != "string" or ($r.id | test("\\A[a-z][a-z0-9-]*\\z") | not) then "askRules[\($i + 1)]: id must match [a-z][a-z0-9-]*"
  ```

  The doubled backslashes are what jq's string literal needs (`clean`, line 459, writes `\\s` the same way). jq then hands Oniguruma `\A` and `\z`, the start and the very end of the string.
- Lines 454-455, the end of the comment above the function. Replace

  ```
  # It tests what they test: a key's presence, never a non-null value, and the id of an object only
  # (#52, R1-2).
  ```

  with

  ```
  # It tests what they test: a key's presence, never a non-null value, and the id of an object only
  # (#52, R1-2), matched against the whole string with \A and \z, since jq's $ also matches before a
  # final newline, which the guard's fullmatch and the workflow's /^...$/ refuse (#52, R2-1).
  ```

Proof:
- After the red run, the gate's `setup` check prints `N passed, 0 failed`. It has three more cases than at baseline: 275 at shaping time, so 278.
- `grep -cF 'test("^[a-z][a-z0-9-]*' /Users/michaelwitwicki/Code/Claude/redline/scripts/redline-setup.sh` prints `0` (red: `1`).
- `grep -cF 'test("\\A[a-z][a-z0-9-]*\\z")' /Users/michaelwitwicki/Code/Claude/redline/scripts/redline-setup.sh` prints `1` (red: `0`).
- `grep -c "#52, R2-1" /Users/michaelwitwicki/Code/Claude/redline/scripts/redline-setup.sh` prints `1` (red: `0`).
- `grep -c "rules-id-newline" /Users/michaelwitwicki/Code/Claude/redline/tests/setup-test.sh` prints `3` (red: `0`).
- The neighbouring decisions stay green: the bad-id pair (lines 228-230, `"Bad"` still exits 2 naming the rule), every other validation case (231-249), and the fixture round trip (210-226, ids `craft-project-config` and `billing` still accepted).
- `git show --stat HEAD` after the commit lists only `scripts/redline-setup.sh` and `tests/setup-test.sh`.

Docs (the file is under `scripts/`): the README's `redline-setup.sh` table, `config` row (`README.md:310`), and Settings → Ask rules (`README.md:117`); no template. No reader-facing change: the row already says "a bad rule exits 2 naming it", Ask rules already says "`id` matches `[a-z][a-z0-9-]*`", and the script's header (39, 44) says both. The fix makes the script do what they say. No config key, subcommand, allow rule or exit code is added.

Commit: `redline: R2-1 have setup's ask-rules check match an id against the whole string, as the guard and the workflow do (#49)`

## Task 3: Standards retrospective

Files: `agent-os/standards/scripts/bash-conventions.md`, `agent-os/standards/testing/tests.md`

Apply items 1 and 2 under "Standards retrospective (proposed)" in `shape.md`, only those the standards approver approved, in one commit after the finding's commit, keeping each file's headings. Item 1 replaces the ending of `bash-conventions.md`'s validator bullet (line 19). Item 2 replaces one parenthesis in `tests.md`'s ask-rules bullet (line 17). If nothing is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead, and change no standard.

Proof: `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` prints `0` (no heading line changed). `grep -c "#52, R2-1" /Users/michaelwitwicki/Code/Claude/redline/agent-os/standards/scripts/bash-conventions.md` and the same for `agent-os/standards/testing/tests.md` each print `1` for an approved item.

Docs: no reader-facing change. The files are not under a directory the Docs step lists, and the README does not describe `agent-os/standards/`.

Commit: `redline: record the round 2 review lessons in the standards (#49)`

## Docs entries

These are gate step 10's entries, one row per file the round touches. Task 2 carries the same entry in its own Docs line.

| File | README section (template) | Commit or reason |
| --- | --- | --- |
| `scripts/redline-setup.sh` | `redline-setup.sh` table, `config` row; Settings → Ask rules; no template | No reader-facing change: the row, Ask rules and the script's header already say an id matches `[a-z][a-z0-9-]*` and a bad rule exits 2 naming it, which the fix makes true for an id ending in a newline |
| `tests/setup-test.sh` | none | No reader-facing change: not under a listed directory, and the Files row describing it stays true |
| `agent-os/standards/...` | none | No reader-facing change: the README does not describe the standards |
| `agent-os/specs/2026-10-30-0905-52-review-round-2/` | none | No reader-facing change: spec folders are the record |

The round adds no config key, subcommand, allow rule or exit code. It touches nothing under `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`.

## Task 4: Verification Gate

Gate steps 1 to 9: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-30-0905-52-review-round-2/redline/snapshot.json` until it exits 0. Its JSON is the evidence. Use `timeout: 600000` on the Bash call, or the start/wait pair when the prompt gives one.

10. **Docs**: every row under Docs entries names its commit or its reason. This round has no README edit, so every row names a reason.
11. **Standards retrospective**: Task 3, from the proposed list in `shape.md`, as the standards approver approved it.
12. **Spec folder**: `plan.md` reflects what was actually built, and any deviation from the shaped plan is recorded under Decisions in `shape.md`. The As built notes land in the round's last commit.
