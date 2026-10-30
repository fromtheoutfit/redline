# References for PR #52 review round 2

Shaped by Redline in unattended mode. Every file below was opened while shaping; line numbers are at `da5b577`, the PR's head.

## The finding's code

### R2-1: setup's ask-rules check

- **Location:** `scripts/redline-setup.sh` 30-45 (the `config` header: "(id [a-z][a-z0-9-]*, unique; ...)", "A bad list exits 2 naming the rule"), 452-455 (the comment above `ask_rules_fault`: "It tests what they test"), 456-475 (`ask_rules_fault`; 459 `clean`, the doubled-backslash spelling the fix follows; 463 the id test), 477-512 (`cmd_config`; 503-509 the `--ask-rules` flag: read with `jq -c .`, checked, then merged as `. + {askRules: $r}`).
- **Relevance:** `test("^[a-z][a-z0-9-]*$")` passes `"a\n"`, since jq's `$` also matches before a final newline. The documented behaviour is exit 2 with the shared message.
- **Key patterns:** the program sits in a quoted heredoc, so a jq string literal writes a regex escape with two backslashes (`"\\s"`), and `\A` / `\z` are written `"\\A"` / `"\\z"`.

### R2-1: the two checks it must agree with

- **Location:** `scripts/redline-guard.sh` 215-221 (`RULE_ID = re.compile(r"[a-z][a-z0-9-]*")`), 271-296 (`rule_fault`, 277 `RULE_ID.fullmatch(rid)`); `workflows/redline-loop.js` 105-140 (the launch check; 109 `const RULE_ID = /^[a-z][a-z0-9-]*$/`, no `m` flag; 120-121 the id message).
- **Relevance:** both refuse `"a\n"`; their message text is the one setup must keep.

### R2-1: the setup test

- **Location:** `tests/setup-test.sh` 1-50 (the harness: `WORK` under the temp directory, `expect_json`, `expect_exit`, `expect_stderr`), 207-249 (the ask-rules round trip and every validation case; 228-230 the bad-id pair the new cases sit after; 226 the no-root case that reads `.askRules` from the output), `tests/setup-fixtures/ask-rules.json` (ids `craft-project-config` and `billing`).
- **Relevance:** where the new cases go and which cases are their neighbours.

## The record this round builds on

### The #49 feature spec

- **Location:** `agent-os/specs/2026-10-30-0826-49-per-repository-ask-rules/shape.md:13` (decision 1: "one validation wording shared by the skill's precheck, `redline-setup.sh config --ask-rules` and the guard: `id` matches `[a-z][a-z0-9-]*`"), `plan.md:25` (the same, as the plan's first point).
- **Relevance:** the evidence that answers what setup does with a malformed id: refuse it, with the guard's wording.

### Round 1 of this PR

- **Location:** `agent-os/specs/2026-10-30-0905-52-review-round-1/shape.md` (R1-2: "setup's check tests presence and reads only objects' ids"), `plan.md` (Task 3, the R1-2 fix and its cases at `tests/setup-test.sh` 241-247; As built: `setup` 275 passed after Task 4).
- **Relevance:** R2-1 is the same kind of disagreement R1-2 fixed. Round 1's layout is the model for this folder, and its As built count is this round's baseline.

### The README

- **Location:** `README.md:117` (Settings → Ask rules: "`id` matches `[a-z][a-z0-9-]*` and is unique"), `README.md:161` (the Files row for `tests/setup-test.sh`), `README.md:310` (the `redline-setup.sh` table's `config` row: "a bad rule exits 2 naming it").
- **Relevance:** the Docs entry. Both already state what the fix makes true, so there is no reader-facing change.

### The standards the retrospective extends

- **Location:** `agent-os/standards/scripts/bash-conventions.md:19` (the validator bullet), `agent-os/standards/testing/tests.md:17` (the ask-rules bullet).
- **Relevance:** retrospective items 1 and 2 in `shape.md`.

### Repository settings

- **Location:** `.claude/redline.json` (no `askRules`), `.claude/redline/checks.json:10` (baseline 78 s).
- **Relevance:** no ask rule forces this finding; the red run fits one foreground gate call.
