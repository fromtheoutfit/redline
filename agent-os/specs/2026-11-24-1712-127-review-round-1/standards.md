# Standards for PR #127 Review Round 1

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `d6217dc`, before this round's retrospective. For a long file, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did; `[...]` marks what is left out.

---

## testing/tests (applied bullet)

Line 35 (every task; Task 3's three pins, the partial-draft case, the own-file case and the `bareDefer` neighbour, which already stop before the change and are each seen red under a mutation):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54); a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on (#99, a real 'Mitigate' answer, which the old inference already filed)

---

## workflow/replay (applied bullet, in part)

Line 19 (R1-5, Task 6; standards item 1):

- A resume after an error changes exactly one prompt: `run()` appends a resume line to the agent label the error result's `resumeFrom` names (`args.resume`), so every prompt before it replays and that agent and all after rerun; [...] and a stop whose resume line tells the rerun to correct what the error names names every failure of its check in one error, since each one it leaves out is one more relaunch: the hold after a reshape named only the fixes left with no task when the same reshape also gave an accepted finding one, until #114, R4-6; [...]

The file's opening line also governs R1-1, the replay note: "A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch."

---

## workflow/agents (applied bullets, in part)

Line 11 (R1-4, Task 3; standards item 3, which spares only a draftless defer option of a call relabelled from a reason that does not mark a left call, and holds a call the shaper wrote as left, under `redline's own file` or any `repository rule <id>`, to its draft):

- A finding a repository ask rule covers (#49) has its own outcome kind, `left`: [...] One function in the workflow (`forceAskRules`) applies the rules after every shape and reshape, whatever `fix`, `defer` or `ask` the shaper returned [...]: a paths rule on the finding's file and on the `files` the shaper lists for its task, a prose rule by the shaper's `askRule` tag [...]; and the person may defer what is left to them (#126): an option of the finding's call that ends in `defer` carries a drafted issue, the shaper's own or the one `forceAskRules` keeps from the shaper's deferral of the finding, and a pick of it, or a defer typed for the finding, has the run file that draft. That is the one end of a left finding the workflow acts on: the kind stays `left`, no task is planned and nothing is demanded, the reply keeps its opening and closes with where the draft went, and the thread is resolved once the draft is filed. Any other answer, and autopilot, leave the finding as before

Line 16 (R1-3, R1-6, Tasks 5 and 7; standards item 2):

- A message the run shows the person says when it fires in the words of the decision behind it, so a fix that widens or narrows the condition rewords the message and the loop checks that pin it in the same commit: R1-3 let the checker-text warning fire on a round whose gate exited 1, and it still said 'on a passing gate' next to 'still failing, as at baseline' (#37, R2-1)

---

## process/docs-gate (applied bullets, in part)

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)

---

## process/release (applied bullet, in part)

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. [...]

This pull request bumped it to `0.5.0`; a review round of the same pull request adds no bump.

---

## prompts/attribution (applied bullets)

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
