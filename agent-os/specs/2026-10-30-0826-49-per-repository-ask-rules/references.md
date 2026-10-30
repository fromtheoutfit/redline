# References for per-repository ask rules (#49)

## The guard

- **`scripts/redline-guard.sh`** 93-102 (the role table), 182 (`REPO`), 191-202 (protected dirs and files), 220-251 (`protected()`, the "holds" branch and case-folding), 254-279 (`writable()`: glob cut at 263, realpath at 265, the prefix loop), 284-289 (Write/Edit tools), 386-439 (Bash redirections), 609-642 (`rm/mv/cp/tee/sed -i`), 741-762 (`git add`).
- **`tests/guard-test.sh`** 29-35 (the cache repository), 42-46 (`# @cwd` directives), 50-54 (the hook input), 56-68 (the decision and the unasserted reason).
- **`tests/guard-cases.tsv`** 1-9 (format), 104-106 (implementer allow/deny), 301-306 (`.claude/redline.json` refused), 385-395 (the `# @cwd PLUGIN` block).
- **Relevance:** every write target reaches `writable()`, so one `ask_rule()` check after `protected()` covers every tool and Bash form; the harness needs fixtures the rows can rely on.

## The workflow

- **`workflows/redline-loop.js`** 28 and 104-115 (args), 197-198 (`RUN_LINE`, `NEVER_DECIDE`), 289-309 (`FINDING_SCHEMA`, `REVIEW_SCHEMA`), 353-404 (`JUDGMENT_CALL_SCHEMA` with the `why_human` enum at 360, `SHAPE_SCHEMA`), 584-640 (`findingLine`, `reviewBody`, `commentBody`), 660-669 (`autopilotDecision`), 784-802 (`replyBody`), 815-862 (`reviewPrompt`), 890-919 (`shapePrompt`, `nitNote` inline at 910), 923-976 (`humanShapePrompt`, `reshapePrompt`), 978-1040 (`resolvePrompt`, `planPrompt` with `humanNote` at 1028), 1621-1661 (`outcomesFor`, `describeOutcome`), 1667-1686 (`checkDispositions`), 1780-1870 (`revise()`: the plan dial at 1804, `settle` at 1812, `resolveWith` at 1836, `effectiveDispositions` at 1861), 1946-2018 (`needCommits`, `deferredAll`, outcomes), 2042-2126 (`handoffComment`, `humanSummary`), 2185-2220 (`threadCandidates`), 2363-2378 (`handoffResult`).
- **`tests/loop-test.mjs`** 95-147 (the mock), 149-200 (fixtures, `go`, helpers, `samePrefix`), 205-220 (the guided scenario as the pattern).
- **`scripts/redline-gh.sh`** 331-338 (`classify`), 343 (the finding-line tail capture), 86-87 (`PRIOR_DISPOSITIONS`, `CARRY` in the workflow).
- **Relevance:** the forcing point sits after `checkDispositions`; the outcome kind `left` threads through replies, the handoff, the sweep and the result; the review is posted before shaping, so the mark comes from the finding's file and the reviewer's tag.

## Setup

- **`scripts/redline-setup.sh`** 439-516 (`cmd_config`: sed substitution, in-place rerun, `--force`), 518-521 (`config_differs`), 995-1005 (dispatch), 299-318 (the unattended fill-in regexes).
- **`tests/setup-test.sh`** 175-206 (the `config` cases; 179 pins the fresh write against this checkout's `redline.json`).
- **`skills/setup/SKILL.md`** 98-106 (step 7, `redline.json`), 37 (where `composer.json` is already read).
- **`templates/redline.json.example`** (no `askRules`; stays so).

## Prompts and skills

- **`agents/redline-shaper.md`** 25 (rule 7: Redline's own files are `ask`, the precedent for a rule-matched finding), 42 (the enum).
- **`agents/redline-plan-approver.md`** 16 (check 1), 20 (check 5).
- **`agents/redline-resolve.md`** 20-21 (how a decision becomes a task).
- **`agents/redline-implementer.md`** 18 (one commit per finding), 28 (an accepted task makes no change).
- **`agents/redline-reviewer.md`** 35 (`needsDecision`), 47-61 (the return block).
- **`skills/redline/SKILL.md`** 69-86 (precheck), 100-140 (`args`), 178-202 (the decisions hand-off), 204-210 (`done` and the deferred walk).
- **`templates/shape-spec-unattended.md`** 63 and **`.claude/commands/agent-os/shape-spec.md`** 60 (the enum line, outside the gate).

## README

- 36-47 ("Set up a repository", item 2 at 39), 69-119 (Settings), 121-144 (Files), 146-152 (The guard), 164-171 (Known limits), 282-294 (`redline-setup.sh` table), 297-318 (`redline-gh.sh` read table, `prior-findings` at 312).

## Prior specs

- **`agent-os/specs/2026-10-29-1559-13-docs-gate-step/`**: the last hand-shaped spec; its plan shape, Docs entries table and As built section are the model.
