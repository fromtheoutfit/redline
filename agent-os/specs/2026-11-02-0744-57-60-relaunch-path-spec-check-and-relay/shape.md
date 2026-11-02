# The workflow's relaunch path — Shaping Notes (#57 and #60)

## Scope

The Change sections of issues #57 and #60, read with the four decisions of the shaping prompt and the five answered on 2026-11-02:

- **#57.** A shaper result without a usable spec (no folder, no `plan.md`, no `shape.md` with a `## Decisions` section, a finding missing from `findings`) is a run error at stage `shape`, with `resumeFrom` the shaper's label and the error line naming what is missing. No synthetic judgment calls: a finding reaches the person only when the shaper wrote it as an ask. A resume reruns the shaper, which replaces the four spec files (#10, decision 4).
- **#60.** The person's last typed line reaches every relaunched agent. The workflow cannot strip it (see "The relay evidence" below), so the fix is in the skill: every hand-off answer is collected through `AskUserQuestion` options plus a fixed free-text form, the relaunch happens only when `relaunch` is the last typed line, and the skill refuses to relaunch on anything else. `RUN_LINE` stays as the second layer.
- **The #10 lesson.** Nothing a person or the skill adds belongs in a round's record folder; the deferred-list issue body no longer goes under the spec folder.

**Not applicable: the issue's workflow-side tests.** #60 asks for a loop-test scenario proving that only the resolve agent's prompt carries the relayed line and that a first launch is unchanged. The script never sees the relayed line: it is a harness block beside the prompt, not part of it, so there is nothing in `workflows/redline-loop.js` to pass or strip and nothing the mock could observe. The loop test pins the second layer instead: every prompt names the two lines the harness may relay, and a decision's choice text reaches only the resolve agent and the plan approver, through `args.decisions`.

**Not offered: "shape by hand and relaunch".** #57 names it as a recovery. A resume at the shape stage reruns the shaper and rewrites the four files, so a hand-shaped folder would be overwritten; the skill's error report says a resume reruns the shaper, and a hand-shaped round is a fresh run.

## The relay evidence

What this session read (the internal notes are cited by file name, never copied; see `process/internal-notes`):

- Each workflow agent's first message is a `[Workflow harness — user request]` block holding the person's last typed message verbatim, with the sentence that where the computed task conflicts with it, the request wins: redline-internal `docs/STEP5-NOTES.md` (item 16, the first sighting), `docs/STEP9-NOTES.md` (section 11, item 1: all twelve relaunched agents received the person's answer), `DESIGN.md` (the reconciled-after-step-9 row that chose the confirm pick and the `RUN_LINE` backstop), and the transcript of the PR #59 relaunch under `~/.claude/projects/<project>/<session>/subagents/workflows/wf_9ae247f5-c4f/`, where the GitHub agent's refusal quotes the block.
- The script's globals are `args`, `agent`, `parallel`, `pipeline`, `phase`, `log`, `budget` and `workflow`, with no filesystem or conversation access (the `/workflow-authoring` reference). The Claude Code docs on workflows and sub-agents say a subagent starts with no conversation history and describe no relay.
- An `AskUserQuestion` pick is not relayed: on #59 the "Relaunch with these decisions" pick came after the typed `Refuse it`, and `Refuse it` is what arrived. `docs/STEP10-NOTES.md` had left this unverified.
- A headless `claude -p` session relays nothing (`docs/STEP6-NOTES.md` item 9, `docs/STEP7-NOTES.md` section 3).
- The GitHub role's allowlist is `gh-all git-read git-add git-commit git-push` (`scripts/redline-guard.sh:122`); `grep` and `ls` are read-group commands it does not have, `git grep` is in `GIT_READ` (`:726`). Fed to the guard as `redline:redline-github` from the cache repository in this session: `git -C <repo> grep --no-index -l -e '' -- <paths>` allow, `git -C <repo> grep --no-index -l -e '^## Decisions' -- <path>` allow, `grep -l '^## Decisions' <path>` deny ("'grep' is not on the github's allowlist"). Against git 2.54: `-l -e ''` prints each existing non-empty file among the pathspecs and nothing for a missing or empty one (a missing folder adds `warning: could not open directory` on stderr, exit 1); `-l -e '^## Decisions'` prints the path when the heading is present.

## Decisions

The prompt's four stand as given; five were put to the person on 2026-11-02, one at a time, and answered as recorded; the rest were made from the survey.

1. **#57** (prompt 1): as in Scope. Tests as the issue lists plus one for the resume. Decided by: @michaelwitwicki.
2. **#60** (prompt 2): the harness injects the line and the workflow cannot strip it, so the fix moves to the skill, as the prompt's second branch says; `RUN_LINE` stays as a second layer. Decided by: @michaelwitwicki.
3. **Drafts** (prompt 3): nothing the person writes into a round's record folder belongs there; the skill's text no longer writes drafts under the spec folder. Decided by: @michaelwitwicki.
4. **Docs** (prompt 4): README Launching and Known limits; Decided by, since the relay rule changes what the person types; plus The interrupt dial and Saved preferences, which the confirm change makes wrong. Decided by: @michaelwitwicki.
5. **The word.** Offered: `relaunch` with a bare command line also passing (recommended); `relaunch` for every relaunch, the error resume included; a different word. **Answer: `relaunch`, and a line holding only a Redline command also passes**, so a first launch and an error resume stay as they are: the command line has been the relayed line since step 5 and was never read as an order. `RUN_LINE` names both forms. Decided by: @michaelwitwicki.
6. **The answer form.** Offered: `<id>: <choice>. <reason>` in the Other field or typed (recommended); the Other field only; two questions per call. **Answer: the form, in Other or typed.** One line; the choice is an option label or the person's own words; the reason is optional and a pick with none takes the recommendation's reasoning, as today. A typed line not in the form is a question or pushback, answered, after which the call is asked again. Inside Other the `<id>:` prefix may be omitted, since the question names the call. Decided by: @michaelwitwicki.
7. **Forced asks stay.** Offered: keep `forceAskRules` (recommended); remove it and make a missing forced call a shape-stage error. **Answer: keep it.** The call carries an answer the person asked for in `.claude/redline.json`; the #57 checks run before it, so a run with no usable spec never reaches it. This is the one call the workflow writes. Decided by: @michaelwitwicki.
8. **Draft home.** Offered: the session's scratchpad directory, outside the repository (recommended); under the spec folder but never committed; no file at all through a new stdin subcommand. **Answer: the scratchpad.** The body is written as `redline-issue-<pr>-<id>.md` there (`/tmp/redline/` when the harness names no scratchpad) and that path goes to `issue-create`; in a dry run the path is named. README says nothing a person or the skill adds belongs under a spec folder. Decided by: @michaelwitwicki.
9. **Standards carried.** Offered: the same seven as #10 (recommended); six without bash-conventions; eight with internal-notes. **Answer: seven**: `workflow/replay`, `workflow/agents`, `scripts/bash-conventions`, `testing/tests`, `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`. Decided by: @michaelwitwicki.
10. **The spec check is a GitHub-agent operation, `spec-status`**: read-only, two fixed `git grep --no-index -l` commands, labelled `spec status <tag>` (`spec status <tag> #<n>` after a reshape), run after the script's own checks on the shaper's JSON and before `forceAskRules`. The script parses the result. A missing `standards.md` or `references.md` is a warning. The operation's own failure (a refused command, an `error`) is a shape-stage error whose `resumeFrom` is the status label, so a resume reruns the check, not the shaper. #10's spec had already named this mechanism. Decided by: redline.
11. **Ask and call agree**: an `ask` finding without a judgment call, or a call for a finding not sorted `ask`, is a shape-stage error (shaper rule 10 already demands it; the script now pins it). Decided by: redline.
12. **The word is the confirm.** The "Relaunch with these decisions / Let me change one" pick is replaced by the typed `relaunch`: after the restatements are listed, the person types the word, or a line in the answer form to change one. One fewer click, and the relayed line is always the word. Decided by: redline.
13. **"Shape by hand and relaunch" is not offered** (Scope). Decided by: redline.
14. **No guard change.** The two commands are allowed today; `tests/guard-cases.tsv` gains rows pinning them and the plain-`grep` neighbour. Decided by: redline.
15. Visuals: none. The person makes every commit.
16. **Standards retrospective: applied** (2026-11-02): the four edits under "Standards retrospective (applied)" below. Decided by: @michaelwitwicki.
17. **As built, three deviations from the plan** (see `plan.md`, As built): the pass name in the status prompt and the warnings is `round 1`, not `Redline round 1`, since `pass.name` is what every other prompt uses; a decision's choice text reaches the implementer as well as the resolve agent and the plan approver, since the implementer's prompt carries the decisions it applies, so the loop check names three agents; the new loop checks guard their `pick()` calls and the resume's error text so the red run reports instead of crashing. Decided by: redline.

## Context

- **Visuals:** None.
- **References:** see `references.md`. The survey read the shape stage and the reshape path, `stageError`, `resumeLine` and `run`, `forceAskRules`, the error result, every prompt helper's `RUN_LINE`, the GitHub agent's role file and the guard's role table, the loop test's mock and its resume section, the skill's stops and hand-offs, the README's dial, preferences, Decided by, Launching and Known limits, the #10 spec, and in redline-internal the design table and the step 5, 6, 7, 9 and 10 notes.
- **Product alignment:** `agent-os/product/mission.md`: the author keeps every decision. An answer reaches the run only as recorded data (`args.decisions`, `args.selected`, `args.approvedPlans`), never as a relayed order, and a run with no usable spec asks the person nothing it cannot act on.

## Standards retrospective (proposed)

Approved with `AskUserQuestion` at the gate and applied in their own commit.

1. `agent-os/standards/workflow/replay.md`: add "On an interactive relaunch the harness relays the person's last typed message to every agent with precedence over its task; an `AskUserQuestion` pick is not relayed and a headless session relays nothing. The skill relaunches only from `relaunch` typed alone or a line holding only a Redline command, and `RUN_LINE` names both (#60)".
2. `agent-os/standards/workflow/agents.md`: add "The workflow checks a result before it acts on it: the shaper's spec folder is listed by the GitHub agent's read-only `spec-status` operation, an `ask` must have its judgment call, and an unusable result is a stage error with `resumeFrom` naming the agent to rerun, never a synthetic judgment call; the one call the workflow writes is the repository-rule ask (#57)".
3. `agent-os/standards/scripts/bash-conventions.md`: add "A role without the read group lists files with `git -C <repo> grep --no-index -l -e '' -- <paths>` and tests a heading with `-e '^## ...'`: `git grep` is git-read, `ls` and `grep` are not (#57)".
4. `agent-os/standards/testing/tests.md`: add "A new agent operation's fixed command gains a `tests/guard-cases.tsv` row for its role and a neighbour the role may not run".
5. `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`: no changes expected.

## Standards Applied

- workflow/replay — the status prompt never mentions decisions, so it replays; the relaunch rule is the skill's, with byte-identical args
- workflow/agents — one new operation on an existing role; judgment calls returned, never decided or invented; an owner on every decision
- scripts/bash-conventions — the two commands are plain pipelines, no `$`, no interpreter, no glob
- testing/tests — loop-test section 14 and three guard-cases rows, red before green
- process/docs-gate — the Docs entries table in `plan.md`
- process/standards-retrospective — the proposed list above
- prompts/attribution — nothing new names a model or vendor

## Standards retrospective (applied)

Approved on 2026-11-02, all four: the bullets above as drafted, appended to `workflow/replay.md`, `workflow/agents.md`, `scripts/bash-conventions.md` and `testing/tests.md`, in their own commit. `process/docs-gate`, `process/standards-retrospective` and `prompts/attribution`: no changes. Decided by: @michaelwitwicki.
