# Standards for PR #103 Review Round 2

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `363e445`, before this round's retrospective. A short file is copied whole. For a long one, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did.

---

## workflow/agents (applied bullets)

Line 16 (in part, its last clause; R2-3, R2-1):

- [...] and a comment in the workflow that restates the rule is changed with it: the shape schema's comment on `reason` still said a decline names where the finding belongs, the rule before #95, until #97, R4-2

Line 39 (in part, the clauses on a disposition changed away from defer and on a decided deferral; R2-8):

- [...] and a disposition the person changes away from defer drops the shaper's entry, while the resolve agent's entry for a decision it planned replaces an earlier one for the same id (#94, R5-9); [...] and a decided finding is a deferral only when its decision made it one: an override names its disposition and that decides, `defer` making it one and `fix` or `accept` never, whatever entry the resolve agent returns beside it (an override to fix beside a filled entry was filed and its fix not demanded until #103, R1-11); a call's decision names none, and is a deferral through the resolve agent's own entry when its mitigation field is filled, read as filled or empty and never by its words (#100), or the finding has no planned task with files, a test the resolve agent naming each decision's disposition replaces (#99); [...]

Line 42 (in part, the done rule; R2-1):

- [...] The done rule is the workflow's, read off the shaper's decisions (#93): a round is bought by what it finds, not by what it commits; a new correctness finding the shaper fixes, defers with a mitigation or asks about, or a decline the person overrules to a fix, buys the next round whatever the answer and with or without a commit; a deferral that ships nothing buys none, as a decline buys none, and neither does a low-severity correctness finding whose cause is in the previous round's fix diff, which is fixed like a nit and left out of the cap test (#95); every other round ends the run, at the handoff when no commit names a finding and after one final nit pass over the fixes when one does; `maxRounds` is unchanged, and with `coverage off` a bought round that changed no code ends the run, since there is no pass to rerun. [...]

Line 44 (whole; R2-5's choice to leave the shaper's agent file unchanged):

- An agent file cannot be pinned: an agent type resolves only from the session's registry, read at session start (measured headless under --plugin-dir, 2.1.322), and a copy run without its type is `workflow-subagent` to the hook, outside the guard. A changed agent file is reported (the skill's line, the handoff comment), never worked around (#81)

Line 46 (whole; R2-11):

- A fact an agent states that changes what the run does is checked by the workflow against something the run itself recorded, and a claim it cannot honour is cleared with a warning before anything is posted; it is never trusted on its own and never inferred. The verifier's `inFixDiff` holds only on a round that read a fix diff and for a file under the paths the previous round's plan named, which each round keeps on its own record (`record.planPaths`), since the run's `approvedPaths` is every round's (#95); and an agent that checks a list against the plan is shown the list the workflow reads: the plan approver was shown the shaper's `files` for a deferral the person or autopilot decided, whose task the workflow reads from the resolve agent's tasks, so its rule bounced a plan that agreed with the record until #103, R1-2

Line 49 (whole; R2-4, R2-5, R2-7):

- Whether an optional step happened is read from the run's record, never from the words of a free-text field an agent fills, and the check never demands it (#100): a deferral's mitigation is the task the round planned with files before the build and a commit of the finding's own after it, the words are shown only beside a mitigation the record says ships, and a miss is a warning after the check has passed, never a failing reason; what the check leaves out is the findings read as deferrals and no other, never a final disposition of `defer` alone: a reshape's re-sort of a decided call is no deferral, and counting it dropped the demand for the fix the person's answer planned until #103, R1-10, since a repair pass told to produce a commit for a finding the plan has no task for can only invent a change or answer blocked, which stops the round. `hasMitigation` read the field's words with a list of phrases for nothing, widened in #97, R1-7 and R3-2, and a wording the list missed (`No code ships in this pull request.`) still demanded a commit the plan had no task for. A list the record is read from is required in its schema and asked for in every prompt that returns it, so an empty one means none, never not asked: the shaper's `files` was asked for only in a repository with ask rules until #100; and a word list that backs a written rule reads the rule's own examples and leaves alone what the rule allows: `FOLLOW_UP` missed 'another PR', 'a new issue' and 'a later change', the forms of the three the decline rule names, and flagged a decline that cited 'the #85 follow-up spec', until #97, R4-5 and R4-6

---

## workflow/replay (applied bullets)

Line 3 (the file's opening):

A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch.

Line 21 (whole; the run caution in `shape.md`):

- A relaunch runs the script the run launched with: by name while `workflows/redline-loop.js` is as launched, from the copy the harness persisted (as `scriptPath`) once it differs, which only the plugin's own repository can see (`redline-prefs.sh run drift`). Replay follows the prompt sequence: script path, script text outside the prompts, an agent's label and the agent file's body are not in the key. The `Workflow(<name>)` allow rule does not cover a `scriptPath` launch. Measured headless under `--plugin-dir` on 2.1.322 (#81)

---

## testing/tests (applied bullets)

Line 7 (whole; R2-5's scripted shaper):

- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7; #37, R1-1); a reshape mock returns what the reshape prompt asks for, which leaves out a call the round already decided, or a check added to the reshape goes untested (#61, R1-2); it gives a field the shared checks read only when the reshape prompt asks for it (`secondLook`, #94, R9-3); and it returns every key the agent's schema requires, with the value the real agent would give: the scripted shaper lists a task's files for a fix and for a deferral with a mitigation and none otherwise, so a scenario with no task scripts an empty list (#100)

Line 14 (whole; the new prompt readers in Tasks 3 and 10):

- A check fails, it does not throw, when the run it reads took another path: a prompt or a body that may be absent is read as `''`, so a red run reports its count. A `TypeError` in one check hides every check after it (#93). A list that may be absent is read as `[]` for the same reason, and a mutation run that prints no count crashed: it is reported as a crash, and the scenario that threw is found before the mutation is called pinned (#95)

Line 28 (in part, its opening; R2-2):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; a rule a spec states as a list of accepted and refused forms gets a case per form, each turning on one clause of the code and seen red under a mutation of that clause [...]

Line 33 (whole):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)

---

## process/docs-gate (applied bullets)

Line 5:

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason

Line 8:

- No commit exists at shaping time: a plan's entry names the README section, or the `docs/` file and section (and template), its task updates, or the reason there is no reader-facing change, and its commit is that task's own, named in `plan.md`'s As built when it lands and confirmed at the gate. The plan approver checks the section or the reason only: its check 8 first asked for the commit too, which no reshape could supply, so a plan written as point 7 says could be bounced until the run ran out of adjustments (#51, R1-3)

Line 15 (in part, its opening; R2-1):

- A change to the run's done rule rewords every statement of it a reader meets, found by searching for the old rule's words, not only in the file the change touched: the README's opening paragraph and its Known limits ("What a clean run means", which the handoff links), `docs/`, the skills' descriptions, both `.claude-plugin/` descriptions, the workflow's `meta.description`, the reviewer agent file's opening sentence, the facts-only sentence of the review prompts and `agent-os/product/mission.md` [...]

Line 16:

- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/release (applied bullet)

Line 5:

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)

---

## prompts/attribution (whole)

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
