# References for PR #52 review round 1

Shaped by Redline in unattended mode. Every file below was opened while shaping; line numbers are at `b005f1d`, the PR's head.

## The findings' code

### R1-1: the guard's wildcard cut and the ask-rule check

- **Location:** `scripts/redline-guard.sh` 216-347 (`glob_regex`, `glob_root`, `rule_fault`, `load_ask_rules`, `ask_rule`), 397-424 (`writable()`, the cut at 406), 776-787 (`sed -i` targets), 200-210 (`PROTECTED_FILES`, the self-hosted files), 101-110 (the role table), 589-609 (the command groups).
- **Relevance:** where a Bash operand is cut at its first wildcard and checked by its prefix; why the guard is a person's file here.
- **Key patterns:** a deferred guard finding is mitigated by a pinned `tests/guard-cases.tsv` row and a Known limits line.

### R1-1: the fixture and the rows

- **Location:** `tests/guard-test.sh` (the `ASK` fixture: `craft-config` → `config/project/**`, `yaml-anywhere` → `*.secret.yaml`, a prose rule; the `# @cwd ASKRULES` directive; the optional fifth column), `tests/guard-cases.tsv` 1-8 (the format), 450-489 (the ask-rules rows; 458 the wildcard neighbour; 474 the insertion point).
- **Relevance:** where the two pinned rows go and which row is their neighbour.

### R1-2: setup's validator

- **Location:** `scripts/redline-setup.sh` 30-45 (the `config` header, "A bad list exits 2 naming the rule"), 87 (`set -euo pipefail`), 99 (`die2`), 452-473 (`ask_rules_fault`), 475-572 (`cmd_config`; 501-508 the flag, 527 and 547 the rerun), 573-578 (`config_differs`).
- **Relevance:** the three `!= null` tests and the unfiltered id read; the documented exit 2.
- **Reviewer's reproduction:** `/tmp/redlinerepro/fault.jq` (byte-identical to 457-469), `rules-paths-null.json`, `rules-nonobject-first.json`.

### R1-2: the two checks it must agree with

- **Location:** `scripts/redline-guard.sh` 271-296 (`rule_fault`), `workflows/redline-loop.js` 105-145 (the launch check).
- **Relevance:** both test a key's presence; the shared messages.

### R1-3: the setup skill and the rerun

- **Location:** `skills/setup/SKILL.md` 102 (the ask-rules passage, "with none, omit the flag"), 105-108 (the `config` call and the rerun wording), 159 (the rules file only through `config --ask-rules`); `tests/setup-test.sh` 25-50 (the helpers), 208-239 (the ask-rules round trip and validation cases; 221-222 the insertion point).
- **Relevance:** the instruction that cannot clear a list; the C5 file the new case reuses.

### R1-4: the forcing point and the human pass

- **Location:** `workflows/redline-loop.js` 309-331 (`pathRules`, `ruleForPaths`, `ruleOf`, `rulesBlock`), 788 (`leftDecision`), 911-931 (`replyBody`, `left` and `none`), 1765-1812 (`outcomesFor`, `describeOutcome`), 1814-1836 (`checkDispositions`), 1838-1890 (`forceAskRules`), 1999-2028 (shape, the forcing call, autopilot's settle), 2111-2116 (reshape), 1565-1569 (the result's `forced`).
- **Relevance:** the disposition the forcing ignores; why only a human pass carries a `none`.

### R1-4: the loop test

- **Location:** `tests/loop-test.mjs` 23 (`check`), 95-125 (the mock shaper: `none`, `files`, `askRule`), 167 (`go`), 191-203 (`comment`, `replyFor`), 745-848 (scenario 10, the human review pass; 806-808 a lone `none` with no commits and its summary), 901-986 (scenario 12; 917 `ruleArgs`, 981-985 the human pass on autopilot).
- **Relevance:** where the two new checks go and what they reuse.

### R1-4: the stated behaviour

- **Location:** `agents/redline-shaper.md` 26 (rule 7's ask-rules paragraph); `README.md` 67 (a human pass: "a comment that asks for nothing gets "no change requested""), 115-131 (Ask rules; 126 the human-pass sentence, 128 the paths bullet), 39 (Set up a repository, item 2), 182-190 (Known limits; 189 the ask-rule bullet), 301-314 (the `redline-setup.sh` table).
- **Relevance:** the sentences each task rewords so the docs match the code.

## The original spec and the standards

- `agent-os/specs/2026-10-30-0826-49-per-repository-ask-rules/shape.md` (decisions 2, 3, 8, 14) and `plan.md` (Task 4.4, "keep it unless the person changes it"; As built).
- `agent-os/standards/` as recorded in `standards.md`: `scripts/guard`, `scripts/bash-conventions`, `testing/tests`, `workflow/agents`, `workflow/replay`, `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`.
- `.claude/commands/agent-os/shape-spec.md`, the unattended section (points 4, 7 and 11) and the Verification Gate.

## Plan shape

### PR #51 review round 1

- **Location:** `agent-os/specs/2026-10-29-1614-51-review-round-1/`
- **Relevance:** the last round in this repository; the layout of the plan (per-task Docs lines and a Docs entries table) and of `shape.md`.

### PR #46 review round 1

- **Location:** `agent-os/specs/2026-10-27-1441-46-review-round-1/plan.md` (lines 5, 37)
- **Relevance:** a harness change proved red first through `checks.sh --baseline`, since the guard refuses `node` to the implementer.
