# #100: a deferral ships from the round's record — Shaping Notes

## Scope

Issue #100, deferred from pull request #97 (round 3, finding R3-2). Whether a deferred item ships a mitigation is no longer read from the words of its free-text `mitigation` field. The round's own record decides: the plan before the build, the finding's own commit after it. Every place that read `hasMitigation` moves, the phrase list goes, and a deferral can no longer stop a round or have a commit demanded of it.

Out of scope: #99 (the resolve agent naming each decision's disposition). `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`, `.claude/redline/checks.json`, everything under `templates/` and the Verification Gate's text are not touched.

## Decisions

Given with the brief, not reopened:

1. Whether a deferred item ships a mitigation is no longer decided from the words of its `mitigation` field. The words are kept for display. No wording of "nothing ships" can stop a round or demand a commit.
2. Every place that reads `hasMitigation` is covered, each listed in `plan.md` with what it reads after the change.
3. The pinned case is a loop test seen red first: a deferral worded `No code ships in this pull request.` with no task ends its round with no commit demanded. Its mirror: a deferral worded `none` with a planned task with files and a commit is treated as shipping one.
4. `NOTHING_SHIPS` and its phrase list are removed if nothing needs them. Nothing does (decision 13).
5. #99 is not taken on. What it still has to do is in `plan.md` and under "For you to add to #99" below.
6. The version follows the release standard: patch, since a setup rerun writes nothing new.
7. `scripts/redline-guard.sh` and `hooks/hooks.json` are not touched.
8. CI's shellcheck command runs before the first commit and after the last if any `.sh` file changes.
9. No AI attribution anywhere.

Answered during shaping (2026-11-17):

10. **The signal is the round's own record**, not a `ships` field the agents state. A field would have meant template v6, a setup rerun in every repository and a minor bump, and a wrong `true` would stop the round at the check exactly as a missed wording does today.
11. **A deferral's commit is never demanded, and its miss never reaches the repair.** The addition to answer a: a planned mitigation that ends the build with no commit of its own is a warning, never a stop; the item is recorded and posted as shipping nothing, its draft is still filed, and the warning names the finding and the planned files. A fix with no commit still stops the round. The repair step made the other form unsafe: a repair told to produce a commit for a finding with no task in `plan.md` can only invent a change or return `blocked`, which stops the round at `implement` (`workflows/redline-loop.js:3946`), and a round that failed on nothing else would spend its one repair pass on an optional item, so anything that repair broke would stop it. The cost taken: a mitigation task the implementer skipped is not retried.
12. **When the words and the record disagree, the record decides and the warnings come from the record.** A commit of the finding's own is counted even when no files were listed, with a warning. Words that describe a mitigation, with no task and no commit, raise nothing: that is the same record as the pinned wording, and no rule that reads no words can tell them apart. The addition to answer b: a correctness deferral buys the next round only when a commit of its own landed; a planned task with no commit of its own buys nothing. The done rule is evaluated after the round's commits are known (`bought`, after the commits are read off the passed check), so it can read them.
13. **"Planned" is split by who decided, as #97 R2-6 has it, and `files` becomes required.** A finding nobody decided reads the shaper's `findings[].files` on its own defer; one the person or autopilot decided reads the resolve agent's `tasks[].files` only. The shape schema requires `files`, and the shape, human-pass and reshape prompts ask for it, since before this the prompt asked only in a repository with ask rules.
14. **`isDeferral` reads whether the field is filled, with no phrase list.** The record cannot tell a "Mitigate" answer from a fix with a stray entry (both are an entry beside a task with files), which is #99's subject. One emptiness test stays at the line #99 replaces; `NOTHING_SHIPS` and `hasMitigation` are deleted.

Behaviour that changes on purpose:

- #97 R2-6's pin: an empty mitigation with listed files and its own commit now buys the next round, since new code shipped.
- The shaper's mitigated deferral that the person changes to accept no longer buys a round: no commit of its own can land. A shaper fix changed to accept still buys (#93).
- A resolve entry worded `none` beside a task with files now reads as the person's deferral; the phrase list read it as a fix with a stray entry.
- A mitigation committed under a subject that does not open with its id, and not reported for the finding, is not counted. When a task was planned the warning says no commit of its own landed; when none was planned nothing warns.
- A deferral whose words describe a mitigation, with no files listed and only a commit that mentions its id, is posted as shipping nothing. Before, the mention was posted as its mitigation.

Deviations from the shaped plan, as built:

15. **`outcomesFor` moved from Task 4 to Task 3.** The pinned case's reply depends on the outcome reading the commit: with the commit demand gone and the words still read, it was posted as `Mitigation: No code ships in this pull request.`
16. **The draft view carries a `ships` boolean beside `files`.** The plan had the view say what ships through `files` alone. At the end-of-run stop the build is over, so a file list no longer says what shipped: `ships` is a planned task with files before the build and a commit of the finding's own after it, and `files` is the planned task's paths at both stops.
17. **The skill's sentences on the drafts stop landed with the field, in Task 5.** `workflow/replay` has the skill section that presents a stop's new field land in the same commit.
18. **What buys a round is checked off the handoff's `changed no code` sentence.** With the coverage pass off, a bought round with no fix and a round that bought nothing both end after one round.

Standards retrospective: four edits, approved on 2026-11-17 and applied in their own commit.

- `workflow/agents.md`, line 49: contradicted. It described `hasMitigation` and its phrase list as the one reader of the field. Rewritten: whether an optional step happened is read from the run's record, the check never demands it, and a list the record is read from is required and always asked for. The `FOLLOW_UP` half of the bullet is unchanged.
- `workflow/agents.md`, line 39, R1-10's clause: contradicted ("when that entry ships a mitigation"). Now: when its mitigation field is filled, read as filled or empty, a test #99 replaces.
- `workflow/agents.md`, line 39, R2-6's and R3-5's clauses: contradicted in part. A planned task is what a stop shows and what the planned-and-unbuilt warning reads; the commit of the finding's own holds for every deferral and decides its reply, the final nit pass and the next round.
- `testing/tests.md`, lines 7 and 31: missing. A mock returns every key the agent's schema requires; what buys a round is read off an output only a bought round produces.
- Already in a standard: the skill section landing with a stop's new field (`workflow/replay.md`, line 10); a cost named in README Known limits and the done rule's statements reworded (`process/docs-gate.md`); the patch bump (`process/release.md`); red before green and a neighbour beside each case (`testing/tests.md`, lines 28 and 33). No pattern was used that the standards do not hold.

Why the template is not touched: its section says a mitigation "becomes a plan task, and otherwise the finding has no task" and asks for `mitigation` as "an empty string when nothing ships now". Both stay true and are still what the agents are asked to write. `files` is asked for by the workflow's prompt and the shaper's agent file, which ship with the plugin, so a setup rerun has nothing to carry.

## For you to add to #99

A drafted comment; posting it is yours.

> #100 changed what `isDeferral` reads for a finding the person or autopilot decided: the resolve agent's entry counts when its `mitigation` field is filled or the finding has no planned task with files (the phrase list is gone). It also made every deferral's commit optional: a finding read as a deferral is never among the commits the check demands. So a fix that is read as a deferral through a stray filled entry is now filed as an issue and, if its task is never built, passes the check with a warning instead of stopping. The disposition this issue adds closes both: read it in `isDeferral` in place of the emptiness test, and keep the three pins named above.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** N/A.

## Standards Applied

- workflow/agents — line 9, the four endings; line 39, a decided finding and a planned deferral (the R1-10, R2-6 and R3-5 clauses, which this spec changes); line 46, a fact an agent states is checked against the run's record; line 49, one reader for a field's empty value, which this spec replaces.
- workflow/replay — a relaunch runs the script the run launched with, so the changed prompts and schema reach only a new launch; the new warnings are computed from args and agent output alone.
- testing/tests — red before green; a mock answers as the real agent would (the scripted shaper returns `files`); a rule is pinned at a second call site; a check fails, it does not throw.
- process/docs-gate — one entry per touched plugin file; a change to the done rule rewords every statement of it.
- process/release — patch bump, both manifests.
- process/standards-retrospective — the retrospective is put to the person before any edit.
- process/internal-notes — nothing copied in from the private repository.
- prompts/attribution — no model or vendor name anywhere.
