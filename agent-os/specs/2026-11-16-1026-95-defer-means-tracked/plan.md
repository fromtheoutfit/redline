# Issue #95: defer means tracked

Spec folder: `agent-os/specs/2026-11-16-1026-95-defer-means-tracked/`. I make no commits; you commit at each slice boundary. Version goes 0.3.0 to 0.4.0, the unattended template v4 to v5. `scripts/redline-guard.sh` and `hooks/hooks.json` are not touched: nothing below needs either (the GitHub role already has `gh-all`, every `redline-gh.sh` subcommand).

## Context

#93 gave every verified item a decision, but one ending is missing. An item can be worth doing and not belong in this pull request (a gap that predates it, code it did not touch, a large refactor). Today the shaper declines it with a reason that points at a follow-up issue nobody opens, and `defer` exists only for a real bug with a cheap mitigation, triaged by the skill after the run. On Losers League #829 a manual review named several such items, each with no issue tracking it.

After this change a deferred item always ends in a drafted issue that Redline files where the team tracks work, the thread and the handoff say where it went, and two saved settings say when the person is asked and where the draft goes.

## Decisions

### From the brief (2026-11-16, not reopened)

1. Four endings for a verified item: fixed here, deferred, declined, put to the person. Deferred is worth doing and not here, and always ends in a drafted issue. Declined is not worth doing: the claim is wrong, the conditions will not occur, or the pull request's spec chose otherwise on purpose.
2. Defer is for any kind of item. A mitigation is optional.
3. A decline never says the item belongs in a follow-up; that item is a defer. A refactor that fails the four small-refactor tests is a defer.
4. The draft stands on its own: a title, and a body with what was found, where, why it is not fixed here, the fix proposed, and the pull request and finding id. No AI attribution.
5. Two settings, asked at launch, remembered per person per repository, overridable on the command line: when deferred items are raised (each round, the default; or the end of the run) and where the draft goes (a GitHub issue, the default; the round's spec folder; or printed to paste).
6. The thread reply and the handoff say where each item went (the issue number, or the draft's path). A later run reads an opened issue as tracking the item.
7. This replaces the skill's deferred-issue triage after the run.
8. The unattended template states what defer means: a template change a setup rerun carries, with the version bump the release standard asks for.
9. The guard script and the hook file are not touched unless the work needs it, in which case stop and ask.

### Asked at shaping (2026-11-16, one at a time)

10. **a. Six settings: a second question.** The first launch asks the four as today, then one question with the two new fields. `review only` asks neither; on `autopilot` only where the draft goes is asked (decision 14). A field typed on the command line is not asked. With a saved file the confirm line carries six values, and "Change something" asks the same two questions. A saved file from before this change gets one question of three fields (the confirm for its four, plus the two new ones), once.
11. **b1. The per-round stop sits with the calls, after shaping.** A guided round stops once, after shaping, when it has a judgment call or a deferred draft; a round with only deferred items stops too. The plan dial shows the drafts in the list it already stops for. Nothing is built at that point, so "make it a fix" is built in the same round. A draft that appears later in the round (a reshape after a bounced plan, or a deferral you chose at the stop, which the resolve agent drafts) stops once more for that draft only.
    - Rider: **filing is safe to repeat.** Each opened issue's number, or the draft's path, goes into the round's record as it is filed, before the replies are posted. A relaunch or a re-run round reads that record and reuses it; a second issue is never opened for the same finding id. Covered by a loop test.
12. **b2. End of the run: one stop before the handoff.** No round stops for a draft and a deferred item's thread gets no reply yet. When the rounds are done (also at the round cap), the run stops once with every draft, only if it deferred something; then it files, posts those replies, and finishes with the numbers in the handoff.
    - Rider: the docs call this "no stop inside the rounds; one stop before the handoff, only when the run deferred something", never "no added stop".
    - Rider: **within the run an item deferred in an earlier round is settled for later rounds from the round's record**, though it has no reply and no issue yet: it is not raised again and does not buy a round. Covered by a loop test.
13. **b3. Autopilot files each draft as drafted**, in its round, where the setting says, with no question. The "when" setting does not apply.
    - Rider: **an opened issue's title and body are posted text** and go through `postedText`, so finder or verifier text in a draft cannot mention an account or break the body; file paths and code stay in code spans. Covered by a test.
14. **c. One pick per draft.** Go ahead (first), Drop it, Make it a fix, with typed lines `<id>: title. <new title>`, `<id>: drop. <reason>`, `<id>: fix. <reason>`. Go ahead files as drafted and stays `decided by: redline`. Drop means not filed and nothing else changes (a planned mitigation still ships), posted as your decision with your reason. Fix is the existing disposition override, built in that round as your decision. Fix is offered at the round's shaping stop and on the plan dial; at a later stop of the round and at the end-of-run stop the choices are go ahead, title and drop, and a fix goes through a thread reply and `/redline-revise`.
    - Rider: **above three drafts**, the skill first lists them all (id, title, where each goes) and asks one question: file all as drafted, or walk them one at a time. Typed lines still work at that question for the exceptions, and the rest are filed as drafted. Every draft's full body is shown before anything is filed.
15. **d. Board cards: say so, nothing more.** No label, no project call, no ceiling. Said in the launch question's GitHub option, at the stop (the count and where each goes), in `docs/running.md` (with the autopilot case) and in README Known limits.
16. **e. Where has a repository default; when does not.** `.claude/redline.json` gains `deferTo` (`github`, `spec` or `print`), offered first at the launch question and used by a headless run. Precedence: command line, saved, `redline.json`, `github`. An existing repository without the key behaves as `github`; a setup rerun lists it under `differs` and writes nothing.
17. **The done rule, two changes.**
    - A new correctness finding that is deferred buys the next round only when it ships a mitigation (today's wording, unchanged). Deferred with no mitigation, it buys nothing, like a decline.
    - A new correctness finding that is low severity and whose cause is in the previous round's fix diff is fixed like a nit and does not buy a round. A finding in the pull request's own code, or of medium severity or above, still buys one. Both sides covered by a loop test, and stated in `docs/running.md`.

### Consequences I drew (strike any that is wrong)

18. **The proportionality rule no longer ends in a decline.** A fix out of proportion is worth doing somewhere, so it is a defer, with a mitigation when a cheap one exists. Of the v4 template's decline reasons, two go ("the cause is in code this pull request did not change and the fix belongs elsewhere", "the fix costs more than the failure and no cheap mitigation exists"). "Could not confirm" stays: such an item is not verified (#93, decision 14).
19. **"Like a nit" covers the round cap too.** A review past the cap whose only correctness findings are low-severity ones from the previous round's fix diff is fixed and gets its final nit pass, as a round of nits does, with no cap-hit comment.
20. **The workflow checks the fix-diff claim.** The verifier states it (`inFixDiff: true`), and the workflow honours it only on a round that has a fix diff and for a file among the paths the previous round's plan approved; otherwise it warns and the finding buys a round.
21. **A finding left to the person on autopilot (a repository ask rule, or Redline's own files) leaves the Deferred list.** It has no draft, so it is listed only under "Left to @login", where it already is, with its thread open.
22. **The mitigation is not in the issue body.** Decision 4's list does not name it, and leaving it out keeps a draft stable when a reshape changes the mitigation. The thread reply carries it.
23. **A changed draft is shown again.** Each draft has a version, counted by the workflow over the draft as the shaper or the resolve agent wrote it, before any title of yours; an answer names the version it saw, and a reshape that changes an answered draft raises it once more. This is what keeps decision 14's "every body is shown before anything is filed" true after a bounced plan.
24. **A deferral the person chose is raised like any other.** A `defer` you type at a stop is drafted by the resolve agent after that stop, so its draft is raised once more before it is filed (per round), or sits in the end-of-run list. It stays your decision (`decided by: @login`), and its reply and handoff line end with where it went.
25. **The human review pass keeps its rules, and raises its drafts in the pass at either setting.** Its shaper still never defers or declines. When the author answers "defer" there, the same filing and the same stop apply. Its replies are never held: two comments of one thread share one reply per pass, so a held one could not be answered later. The Redline round its nit pass runs as follows the setting.
26. **`issue-create` is replaced by `defer`** in `redline-gh.sh`: nothing else calls it once the triage is gone, and one subcommand that is safe to repeat is the only way Redline opens an issue.
27. **Names.** Saved keys `deferAt` (`round`, `end`) and `deferTo` (`github`, `spec`, `print`). Command-line words `defer each round`, `defer at end`, `defer to github`, `defer to spec`, `defer to print`. Summary words `deferred each round` or `deferred at the end`, and `drafts to GitHub`, `drafts to the spec folder` or `drafts printed`.
28. **No setup question for `deferTo`.** The example carries `"deferTo": "github"`; a team edits the key by hand, as the changelog line will say.
29. **A decline that points at follow-up work is a warning in the run**, and a bounce for the plan approver, not a stop: a Redline round's shape stops only on the ask cases, a decline with no reason, and now a defer with no draft.

From the stress test of this design against the code (a read-only pass; each is a gap it found and how the plan closes it):

30. **A second layer under the record.** If `gh issue create` succeeds and the run dies before the record is written, the record alone would open a second issue. So before creating, `defer issue` also looks on GitHub for an issue whose body carries the draft's last line (the pull request, round and finding id, text only that issue has), and records and reuses it. Best effort: GitHub's search can lag by seconds.
31. **At the end of the run the stop comes first and the round check stays first.** The stop makes no agent call. After the relaunch, Finish reads the highest posted round as today, and only then files and posts the held replies, so #81's promise that nothing is posted once that check refuses still holds.
32. **The cap-hit comment gains the Deferred section**, so the numbers have a place when a run ends at the cap.
33. **Under `correctness only`, a round whose only fixes are for low-severity findings from the previous round's fix diff gets a final nit pass.** That scope has none today because it fixes no nits; these fixes are unreviewed code, which is what the pass is for. The README's scope row is reworded.
34. **A finding left to the person keeps what Redline would have done.** That text ("open: ...", "Redline would have declined it: ...") moves from the Deferred line to its line under "Left to @login".
35. **A deferral with no mitigation has no commits of its own.** A commit that only names its id (the standards commit) is not its mitigation: no "Mitigated in", no final nit pass on its account. "No mitigation" is an empty string or the word `none`, read the same way everywhere.
36. **A fresh run after a run that opened an issue and never replied** carries the finding under a new id, so the record and the lookup cannot match it; the reviewer's known-finding check finds the issue, which is decision 6's own mechanism. Named in Known limits, with the other exits that are no Finish (an error, an abandoned stop) at the end setting: the threads have no reply, and the next run carries those findings forward.
37. **With `spec` and `print` the draft file reaches the branch with the run-record commit**, at the end of the run, and stays local under `no push`, as the run's commits do. `docs/running.md` says so.

## Design

### The model (template v5, `agents/redline-shaper.md`, `agents/redline-plan-approver.md`, `agents/redline-resolve.md`)

- `defer`: a verified item worth doing outside this pull request, of any kind. A mitigation, when a cheap one exists inside the pull request, is the plan task; otherwise there is no task. Its entry under `## Deferred` in `shape.md` and in the returned `deferred` list carries the draft: `title`, `found` (what was found, written to stand alone), `why` (why it is not fixed here) and `fullFix` (the fix proposed), beside `mitigation` (empty when none).
- `decline`: not worth doing, for one of decision 1's three reasons, or `could not confirm: needs <what>`. It never points at follow-up work.
- The small-refactor rule sends a refactor that fails a test to `defer` (or `ask` in a case); one that would undo a deliberate choice in the pull request's spec is still declined with the decision cited.
- The proportionality rule ends in `defer` or `ask` (decision 18).
- The plan approver: every `fix` finding and every `defer` finding with a mitigation has a task; a `defer` with none has no task and that is no bounce; a decline whose reason points at follow-up work is bounced as a defer; a draft's citations are checked like any other.
- The resolve agent drafts the issue for a deferral the person chose and returns it in `deferred`; "mitigate" keeps meaning a deferral with that mitigation.
- This repository's point 11 keeps its rule (a guard, hook, gate or checks fix is a defer a person makes) and gains one clause: its draft names the file and says a person changes it.

### The draft, as filed

The workflow composes the file from the shaper's fields, each body field through `postedText` as one text and the title as decision 38 has it, with the place and the provenance written by the workflow:

```markdown
# Back off retries in the queue client when the queue is down

`SyncOrders` retries at once and without limit when the queue connection drops, so one outage
turns into a retry storm against the broker.

- **Where:** `app/Jobs/SyncOrders.php:88`
- **Why it is not fixed in #94:** the retry policy lives in the queue client, which that pull request does not touch.
- **Proposed fix:** give the client a capped exponential backoff and have `SyncOrders` use it.

Deferred from pull request #94 by Redline (round 2, finding R2-3).
```

Line 1 is the title (your edited one when you gave one), everything after the blank line is the body. The file is `<specFolder>/redline/issue-<id>.md` in every mode.

**Measured before the escaping was built, and decided (decision 38, 2026-11-16):** GitHub's GraphQL `titleHTML` on existing public issues shows an issue title is plain text: an entity in a title is shown as typed, and an `@word` in a title is not a mention link (the evidence is in `shape.md`; no scratch issue was needed). So the title is filed as written, made safe as plain text: one line (a newline or a carriage return becomes a space), no control characters, cut to GitHub's 256-character limit. The body keeps `postedText`, field by field. This amends decision 13's rider for the title only.

### Filing (`scripts/redline-gh.sh defer`, the GitHub agent's `defer` operation)

```
redline-gh.sh defer <issue|draft> <finding> <draft file> <record file>
```

- `issue`: when the record already holds the finding, print its entry with `"reused": true` and call nothing. When it does not, look for an issue whose body carries the draft's last line; one found is recorded and printed with `"reused": true` (decision 30). Otherwise `gh issue create` with line 1 as the title and the rest as the body, then write `{"<finding>": {"where": "issue", "number": N, "url": "..."}}` into the record (temp file, then `mv`), then print the entry.
- `draft`: write `{"<finding>": {"where": "draft", "path": "<repository-relative path>"}}` and print it. No GitHub call.
- The record is `<specFolder>/redline/round-<n>-deferred.json` (`human-review-<n>-deferred.json` for a human pass). The title never crosses a shell argument.
- The workflow's step is one GitHub-agent call per round, labelled `file deferred r<n>`, after the checker passes and before `push and reply`: write each draft file byte for byte, run the one `defer` line given for it, return what the script printed. Mode is `issue` when `deferTo` is `github` and the run posts; `draft` for `spec`, `print` and a dry run. A dropped draft is not passed. A round with nothing to file makes no such call, so its prompts and label sequence are as today.
- An error stops the run at stage `defer`, resumable at that label; the rerun reuses what the record holds.
- `prior-findings` reads a reply that opens `deferred` as the disposition `deferred`, and keeps reading `mitigated` for older replies.

### The stops (`workflows/redline-loop.js`)

New args: `deferAt` (`round` default, `end`), `deferTo` (`github` default, `spec`, `print`) and `deferrals`, `{"<id>": {"action": "file" | "drop", "title": "", "notes": "", "date": "YYYY-MM-DD", "draft": <version>}}`. A bad word fails the launch as a bad `interrupt` does. `RUN_LINE` names `args.deferrals` beside the other three.

- **Pending drafts.** A draft is pending when the run is not on autopilot and it has no answer, or an answer for an older version. Versions start at 1 and rise when a reshape or the resolve agent changes the draft as written (the composed text with the shaper's own title), so the count never depends on an answer.
- **Each round.** The check runs after shaping (with the calls; a `fix` or `accept` override is taken here, as a decline overrule is today), after the round's first resolve, and after each reshape and its resolve. A stop after the round's first resolve takes no override and lists no declines, plan approver or not: an override is applied by that resolve, whose prompt comes before the stop. A pending draft returns `handoff` / `decisions` with `drafts` (id, finding, round, where it goes, the title and body as they will be filed, version, whether a fix can still be built) and `draftsNeeded`. The plan dial's stop carries the same two fields, so one approval can answer the drafts.
- **End of the run.** At round time a deferred item's outcome is recorded from the setting alone (`deferred; raised with @login at the end of the run`), which is what later rounds' reviewers are shown as settled, and its reply, a carried reply for it, and its filing are held. Where a run would finish (the handoff, the cap-hit comment, the revise-only record commit; a human pass's own drafts are never held), held drafts that are pending return `handoff` with `handoffKind: "deferred"` before any agent call. After the relaunch, inside Finish and after its read of the highest posted round: `file deferred r<n>`, then `deferred replies r<n>` for each round that held any (reply ids kept on that round's record, for the sweep), and each held item's outcome, kind and decided entry rewritten from its answer, so a drop is counted and listed as overruled; then the description, the sweep and the comment as today.
- **Replay.** `deferrals` is read only at a stop check, at filing, and in the replies and Finish text after it. At the end setting no round-time code reads it. The `deferred` list the plan approver and the implementer are shown is the shaper's or the resolve agent's as returned: no title of yours, no version, no drop, no number. An answer for a later version covers the earlier ones, so the first stop of a round still passes on a relaunch after its second.
- `relaunch.how` names `deferrals` and what a relaunch passes for it, in the same commit as the stop.
- **Done rule.** `bought`, `needCommits` and `fixed` count a defer only when it has a mitigation (decision 35). A finding is minor when the round reviewed a non-empty fix diff, it is `correctness`, `low`, `inFixDiff`, and its file is under the paths the previous round's plan approved, which each round now keeps on its own record (the run's `approvedPaths` is cumulative and holds spec folders, so it cannot serve). `inFixDiff` is only ever what the verifier stated, never inferred from the round. A minor finding is left out of `bought` and of the cap test.

### What is posted

Replies (the text after `Redline round N: `):

```
deferred to #123. Mitigated in abc1234 (redline: R2-3 log the retry count). · decided by: redline
deferred to #123. · decided by: redline
deferred; the issue draft is at `agent-os/specs/<folder>/redline/issue-R2-3.md`. · decided by: redline
@alex does not want this tracked: the client is replaced next quarter. No issue was opened. Mitigated in abc1234 (...). · decided by: @alex
```

The handoff's section, replacing `### Deferred (mitigated now, full fix left open)`:

```
### Deferred (2)

- **R2-3** Retry storm when the queue is down: deferred to #123; mitigated in abc1234 · decided by: redline
- **R2-6** OrderExporter does three jobs: deferred; the issue draft is at `agent-os/specs/<folder>/redline/issue-R2-6.md` · decided by: redline
```

A dropped draft is listed under `### Overruled by @login`. A deferral you chose is a decision of yours, so its reply and its line keep the decision sentence and end `Deferred to #123.` (or the draft's path). The human review summary reads the filed list, not the outcome kind, and says `deferred to #123` in place of `deferred with a mitigation`. The cap-hit comment carries the same `### Deferred (n)` section. A line under `### Left to @login` ends with what Redline would have done (decision 34).

### The settings (`scripts/redline-prefs.sh`, `skills/redline/SKILL.md`)

- `resolve` and `save` take `--defer-at round|end` and `--defer-to github|spec|print`. `applies` leaves both out under `review only` and `deferAt` out under `autopilot`. `ask` is every applicable field with neither a command-line nor a saved value, so an older saved file is asked for the two it lacks. `save` keeps the saved value of a field the run did not settle.
- The launch questions, the second one:
  - "When should deferred items be raised with you?" **Each round (Recommended)**: with the round's judgment calls, after shaping; a round with only deferred items stops too. **End of the run**: no stop inside the rounds; one stop before the handoff, only when the run deferred something.
  - "Where should a deferred item's draft go?" **GitHub issue**: Redline opens one issue per deferred item; a project board that takes new issues gets a card for each. **Spec folder**: the draft is written into the round's spec folder. **Print**: the draft is written there and its title and body are printed for you to paste. The repository's `deferTo` is first, marked "(this repository's default)".
- The confirm line: `Run with: guided · Opus 5.5 · 3 rounds · all · deferred each round · drafts to GitHub`.

### The stop, as the skill presents it

After the calls and the round's declines, as today, then:

```
3 or fewer drafts: each in turn, in full, then one question

  R2-3 · app/Jobs/SyncOrders.php:88 · Retry storm when the queue is down
  Ships in this round: a log line with the retry count     (or: nothing)
  Goes to: a GitHub issue
  Title: Back off retries in the queue client when the queue is down
  Body:  <the whole body>

  What should happen with this draft?
    Go ahead (Recommended) | Drop it | Make it a fix
    Other or a typed line: R2-3: title. <new title> | R2-3: drop. <reason> | R2-3: fix. <reason>

more than 3 drafts: the list first, then every body, then one question

  5 drafts, each to a GitHub issue:
    R2-3  Back off retries in the queue client when the queue is down
    R2-6  Split OrderExporter out of the controller
    ...
  <each draft's body in full, under its id>

  File all five as drafted, or walk them one at a time?
    File all as drafted | Walk them one at a time
    typed lines for the exceptions; the rest are filed as drafted
```

Each answer is said back in one line, then `relaunch`. A `fix` or `accept` goes into `args.decisions` as today; go ahead, a title and a drop go into `args.deferrals` with the version the stop reported. At a stop where a fix can no longer be built the skill says so and names the after-run door. The `done` summary lists each deferred item with where it went and, for `print`, prints each title and body as a block to paste; the three-choice triage and its rule line are removed.

## Files

| File | Change |
| --- | --- |
| `templates/shape-spec-unattended.md`, `templates/history/shape-spec-unattended.v4.md` (new), `.claude/commands/agent-os/shape-spec.md` | v5 body; v4 frozen; this checkout's section with its three hand edits kept |
| `agents/redline-shaper.md`, `-plan-approver.md`, `-resolve.md`, `-github.md`, `-reviewer.md`, `-implementer.md` | the model, the draft, the `defer` operation, `inFixDiff`, the four endings |
| `workflows/redline-loop.js`, `tests/loop-test.mjs` | schemas, checks, draft, filing, stops, replies, handoff, result, done rule |
| `scripts/redline-gh.sh`, `tests/gh-test.sh`, `tests/gh-fixtures/` | `defer` in place of `issue-create`; `prior-findings` reads `deferred` |
| `scripts/redline-prefs.sh`, `tests/prefs-test.sh` | the two settings |
| `tests/guard-cases.tsv` | rows for `defer`: the GitHub role allowed, the shaper refused, the main session inert |
| `tests/setup-test.sh` | the v5 body hash, the v4 freeze, a `--merge: v5's ... arrived` check |
| `skills/redline/SKILL.md`, `skills/redline-revise/SKILL.md`, `templates/command-redline*.md`, `.claude/commands/redline*.md` | grammar, questions, args, the stops, the summary; the alias hints |
| `templates/redline.json.example`, `.claude/redline.json` | `deferTo` |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | 0.4.0, and the description's endings |
| `README.md`, `docs/running.md`, `docs/contract.md`, `docs/scripts.md`, `docs/upgrading.md`, `docs/setup.md`, `agent-os/product/mission.md` | see each task |

Reused as they are: `postedText` and `textParts` (`workflows/redline-loop.js:1090`, `:1119`), the disposition override path through `resolveWith` (`:3199`), `replyEntry` and `keepReplyIds` (`:1234`, `:3065`), `stageError` and the resume line, `samePrefix` and `replyFor` in the loop test, the `resolve-threads` log pattern in the gh harness.

## Tasks, one slice per commit

Each slice ends with the harnesses it touched red then green and `.claude/redline/checks.sh --baseline` green, and I stop for your commit with the file list.

1. **Save spec documentation.** `plan.md`, `shape.md`, `standards.md`, `references.md` in the spec folder.
2. **The model.** Template v5, the frozen v4, this checkout's section, the shaper, plan approver, resolve and implementer files. In the loop test, the mocks first: the draft fields on the shaper's and the resolve agent's `deferred` entries. Then the workflow's `deferred` schema, a `defer` with no draft as a stage error at `shape` (and at `resolve`, after the entries of rule-covered findings are filtered out), the follow-up-decline warning with a case per phrase and its neighbour, "no mitigation" read one way (a case for the empty string, `none`, and a real mitigation), `bought`, `needCommits` and `fixed` for a deferral with no mitigation, the prompts and rule lists that name the dispositions. Version 0.4.0 and marker v5. Loop: the key phrases in the template, this repository's section and the agent files; a mitigation-less deferral buys nothing, demands no commit and gets no final nit pass from a commit that only names it, and one with a mitigation buys. Setup: hash, freeze, merge check. Docs: `docs/contract.md` (the unattended section), `docs/upgrading.md` (v5), `docs/running.md` (Dispositions, Proportion, the small refactor).
3. **Filing.** `redline-gh.sh defer` and the `prior-findings` word, with gh-harness cases (opens once, reuses the record, finds an issue already opened when the record is missing, `draft` calls nothing, a failed create writes no record) and guard rows. The GitHub agent's operation. In the workflow: `args.deferTo`, the composed draft through `postedText`, `file deferred r<n>` between the round's commits and its outcomes, the record, the new replies (a decided item's included), the handoff and cap-hit sections, the result's `deferred` entries; rule-left items leave the list in the workflow, the resolve prompt and `agents/redline-resolve.md` together, and their Left-to line gains what Redline would have done. Loop: order of the call, each destination, a dry run, the escaped body pinned byte for byte (a tag, an `@word`, a code span holding `<`) beside a title filed as written (the same tag and `@word` raw; a newline made a space, a control character removed, a cut at 256 characters; decision 38), a resume that reruns filing and reuses the recorded number, and the pinned texts that move (the deferred reply, the whole-handoff layout, the autopilot rule entries, the final nit pass's deferred heading). Docs: `docs/scripts.md`, `docs/running.md` (the reply and handoff lines, how the review is posted, when a draft file reaches the branch), README (what the GitHub agent does).
4. **The stops.** `RUN_LINE` first, then `args.deferAt` and `args.deferrals`, pending drafts and versions, the three per-round checks, the plan dial's `drafts`, the end-of-run stop inside the order decision 31 gives, the held replies and the rewritten outcomes, `relaunch.how`. Every guided or plan scenario that defers then stops, so those scenarios gain their `deferrals`. Loop: a round with only a deferral stops and its relaunch replays byte for byte; a call and a draft make one stop; drop, title and fix each; a stop after the first resolve lists no declines; a reshape that changes an answered draft stops again and one that does not, does not; a title of yours does not move the version; a deferral typed at the stop is raised before filing; the plan dial's approval answers the drafts with no second stop; autopilot never stops; at the end setting, round 1 fixes one finding and defers another with no mitigation, its deferred thread gets no reply, round 2's reviewer is shown it as deferred and a candidate that matches it is settled and buys nothing, the run stops once before the handoff, files after the round check, and a drop there is listed as overruled; the same before a cap-hit comment; a human pass's deferral is not held; a bad word is refused. Docs: `docs/running.md` (Hand-off and relaunch, Run markers).
5. **The settings and the skill.** `redline-prefs.sh` and its cases (defaults, the repository default, command line, an older saved file asked for two, `autopilot` and `review only`, a kept value on save, bad words, the six-value summary). `redline.json.example` and this checkout's file. The skill: grammar, `argument-hint` and description, the two questions, `args`, the stops (decision 14 and its rider), the resume question's wording, the `done` summary without the triage. The alias templates and this checkout's copies. Docs: README Dials, `docs/running.md` (Saved launch settings, Launching), `docs/contract.md` (`redline.json`, `redline.local.json`), `docs/setup.md`.
6. **The fix-diff rule.** Each round's approved paths kept on its record first, then `inFixDiff` in the reviewer's schema, file and fix-diff prompt; the workflow's minor test, the path check and its warning, `bought` and the cap. Loop: low and in the fix diff does not buy and ends in the final nit pass; medium in the fix diff buys; low in the pull request's own code buys; a fix-diff round's low finding with no `inFixDiff` buys and still caps, as today; a claim on a file outside the previous round's paths warns and buys; past the cap, minor findings alone are fixed with no cap-hit comment; under `correctness only` a minor-only round gets its final nit pass. Docs: `docs/running.md` (Rounds, step 7), README (the scope row).
7. **The statements a reader meets.** Every place that states the endings or the done rule, found by searching for the old words (`declined with a reason`, `fix or ask about`, `defer it behind`, `triage`): README's opening, loop paragraph and Known limits (board cards, the autopilot case, what a clean run means), both plugin descriptions, the skill's description, `agent-os/product/mission.md`, `docs/contract.md`'s ask-rules paragraph, the workflow's `meta` and handoff sentences where they restate the rule.
8. **Verification Gate.** The nine commands through `.claude/redline/checks.sh --baseline`, the Docs entries, the version, the standards retrospective (proposed edits put to you; applied in their own commit), and As built in `plan.md`.

## After the gate (yours)

- The pull request, its own Redline run from `claude --plugin-dir`, and the tag and changelog. The changelog line under Setup and templates says a rerun merges the v5 section and that `deferTo` is added to an existing `redline.json` by hand.
- A `/redline:setup` rerun in Losers League and Chalkboard to carry v5.
- A rerun on Losers League #829, to see the items its manual review named end as issues.

## Verification

- Per slice: the touched harness red before green (`node tests/loop-test.mjs`, `tests/gh-test.sh`, `tests/prefs-test.sh`, `tests/setup-test.sh`, the new guard rows alone through `tests/guard-test.sh <file>`).
- At the end: `.claude/redline/checks.sh --baseline` exits 0, `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .` exit 0, `claude plugin validate .` passes, `git status --porcelain` shows only what the slice lists.
- Nothing in the harnesses reaches GitHub. The one live check was the title measurement, read-only (decision 38).

## Standards applied

`workflow/replay`, `workflow/agents`, `testing/tests`, `process/docs-gate`, `process/release`, `process/standards-retrospective`, `process/internal-notes`, `prompts/attribution`, `scripts/bash-conventions`, `scripts/guard` (rows only; the guard script is unchanged).

Shape-spec steps 2 to 5, answered from the repository: no visuals; references are the code named above and the #93 spec folder for the layout of `plan.md` and `shape.md`; product alignment is `agent-os/product/mission.md` ("Every verified item is decided", "Nothing is parked", "Honest about its reach"), which task 7 rewords for the fourth ending.
