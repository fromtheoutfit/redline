# #95: defer means tracked — Shaping Notes

## Scope

A verified item that is worth doing and does not belong in this pull request is deferred, of any kind and with or without a mitigation, and every deferred item ends in a drafted issue that Redline files where the team tracks work: a GitHub issue (the default), a draft in the round's spec folder, or a draft printed to paste. The thread reply and the handoff say where each item went. Two saved launch settings say when the person is asked about the drafts (each round, the default, or once at the end of the run) and where a draft goes. The skill's deferred-issue triage after the run is replaced. The done rule changes in two places: a deferral buys the next round only through a mitigation, and a low-severity correctness finding caused by the previous round's fix diff is fixed like a nit.

Out of scope: `scripts/redline-guard.sh` and `hooks/hooks.json` (untouched; the GitHub role already runs every `redline-gh.sh` subcommand), labels, project boards, a ceiling on opened issues, a setup question for the repository default.

Issue: #95, which follows #93 (PR #94). Version 0.3.0 to 0.4.0; unattended template v4 to v5.

## Decisions

The full text of each, with its riders, is in `plan.md` under Decisions, by the same numbers.

### From the brief (2026-11-16, not reopened)

1. Four endings: fixed here, deferred, declined, put to the person. Deferred always ends in a drafted issue. Declined is not worth doing: the claim is wrong, the conditions will not occur, or the pull request's spec chose otherwise on purpose.
2. Defer is for any kind of item; a mitigation is optional.
3. A decline never points at a follow-up; that item is a defer. A refactor that fails the four tests is a defer.
4. The draft stands on its own: title, what was found, where, why not here, the fix proposed, the pull request and finding id. No AI attribution.
5. Two settings, asked at launch, saved per person per repository, overridable on the command line.
6. The reply and the handoff say where each item went; a later run reads an opened issue as tracking it.
7. This replaces the skill's triage after the run.
8. A template change a setup rerun carries, with the release standard's bump.
9. The guard and the hook are not touched.

### Asked at shaping (2026-11-16, one at a time; decided by the owner)

10. **Six settings: a second question** at the first launch; a saved file from before this change is asked for the two it lacks, once.
11. **The per-round stop sits with the calls, after shaping**; a round with only deferred items stops too. Rider: filing is safe to repeat, from the round's record, with a loop test.
12. **End of the run: one stop before the handoff**, only when the run deferred something. Riders: the docs say "no stop inside the rounds; one stop before the handoff, only when the run deferred something"; within the run an item deferred in an earlier round is settled for later rounds from the round's record, with a loop test.
13. **Autopilot files each draft as drafted.** Rider: an opened issue's title and body are posted text and go through `postedText`, with a test.
14. **One pick per draft**: go ahead, drop, make it a fix, and a typed title. Rider: above three drafts, the list first and one question (file all, or walk them), typed lines for the exceptions, every body shown before anything is filed.
15. **Board cards: say so, nothing more.**
16. **Where a draft goes has a repository default (`deferTo`); when it is raised does not.**
17. **The done rule.** A deferral buys the next round only with a mitigation. A new correctness finding that is low severity and whose cause is in the previous round's fix diff is fixed like a nit and buys no round; one in the pull request's own code, or of medium severity or above, still buys one. Both sides in a loop test and in `docs/running.md`.

### Consequences drawn at shaping (18 to 29) and from the stress test (30 to 37)

Each is stated in full in `plan.md`. The plan was approved with them as written on 2026-11-16.

18. The proportionality rule ends in defer or ask, never in a decline; two of v4's decline reasons go.
19. "Like a nit" covers the round cap.
20. The workflow checks the fix-diff claim against the previous round's approved paths.
21. A finding left to the person on autopilot leaves the Deferred list.
22. The mitigation is not in the issue body.
23. A changed draft is shown again (versions, counted before any title of the person's).
24. A deferral the person chose is raised like any other, and stays their decision.
25. The human review pass keeps its rules and raises its drafts in the pass at either setting.
26. `issue-create` is replaced by `defer`.
27. Names: `deferAt`, `deferTo`, the command-line words and the summary words.
28. No setup question for `deferTo`.
29. A decline that points at follow-up work is a warning and a plan-approver bounce, not a stop.
30. A second layer under the record: a lookup for an issue that carries the draft's last line.
31. At the end of the run the stop comes first, and Finish's round check stays ahead of filing.
32. The cap-hit comment gains the Deferred section.
33. Under `correctness only` a round that fixed only minor fix-diff findings gets a final nit pass.
34. A finding left to the person keeps what Redline would have done, on its Left-to line.
35. A deferral with no mitigation has no commits of its own; "no mitigation" is read one way.
36. A fresh run after an issue was opened and never replied to relies on the known-finding check; named in Known limits with the other exits that are no Finish.
37. With `spec` and `print` the draft file reaches the branch with the run-record commit.

### Asked during the build

38. **The issue title is posted as written, made safe as plain text (2026-11-16, amends decision 13 for the title).** The body goes through `postedText`, field by field, as decided. The title is not escaped: it is made one line (a newline or a carriage return becomes a space), its control characters are removed, and it is cut to GitHub's 256-character limit. A loop check pins a title with a tag and an at-word filed as written beside the same text escaped in the body. Decided by the owner on the evidence below.

### Deviations from the plan, recorded as built

Each is where the build differs from `plan.md` as shaped, with its reason. Decided by the builder unless it names the owner; each was reported at its slice's boundary.

39. **The skill's after-run triage left in slice 3, not slice 5.** The triage ran `redline-gh.sh issue-create`, which slice 3 removes, so the skill's `done` section, its rule line and the last sentence of `skills/redline-revise/SKILL.md` changed in that commit. The README's loop paragraph took its two phrases then too.
40. **The title was measured without opening an issue.** The plan allowed one scratch issue with the owner's go-ahead. GraphQL `titleHTML` on public issues answered the question read-only (decision 38, Evidence).
41. **`defer` over a record of the other kind.** `defer issue` for a finding the record holds as a draft opens the issue and replaces the entry; `defer draft` for a finding with a recorded issue leaves the issue. Pinned in `tests/gh-test.sh`.
42. **The skill's handling of the stops landed in slice 4, not slice 5.** A commit that adds a stop the skill cannot answer relaunches into the same stop, so decision 14 and its rider, the end-of-run hand-off, `args.deferrals`, the resume question's wording and the authority sentence went in with the stops. Slice 5 kept the settings.
43. **How the end-of-run stop is built.** It is thrown from the top of Finish, before any agent call, and returned by the loop's `catch` as a hand-off with `handoffKind: "deferred"`; a revise-only pass checks it before its record commit. The replies it held are posted by a call labelled `deferred replies r<n>`, after `file deferred r<n>` and after Finish's read of the highest posted round (decision 31).
44. **A dropped draft is the person's decision.** For a deferral Redline made, a drop is outcome kind `decided`, `decided by: @<login>`, listed under Overruled, with "@<login> does not want this tracked." when no reason is given.
45. **One line no check turns on.** In `settleHeld`, the line that updates a held item's recorded outcome kind after an end-of-run drop. No reader tells `deferred` from `decided`, both being settled kinds, so removing it leaves the harness green. Kept so the record is not stale.
46. **What a saved file is asked for.** The plan's sentence read "every applicable field with neither a command-line nor a saved value". As built, a saved file is asked only for the two deferral settings it lacks; the first four keep the rule from before this spec, where the confirm line covers a default. A file whose first save was a `review only` run still is not asked for the dial, and the confirm with its asked fields fits one question.
47. **`save` takes all six settings** and keeps a deferral setting that did not apply to the run out of the file itself, so the skill always passes what `resolve` printed. `resolve` also prints `repository`, what `redline.json` supplies as a default, so the skill can mark the repository's option.
48. **A `deferTo` in `redline.json` that is not one of the three words stops the launch** (exit 2, naming the key, the file and the value). The key says where an issue is opened, so it is not defaulted. `maxRounds` still falls back, as before.
49. **`scripts/redline-setup.sh` did not change.** Its `config_differs` already lists a key the file lacks, so a rerun reports `deferTo` under `differs` and writes nothing (decision 16), pinned by a new setup case. `skills/setup/SKILL.md`, `docs/upgrading.md` and a "Where a draft goes" entry in `docs/running.md` were touched beyond the plan's file list, to say so and to carry decision 15's board sentence.
50. **The final nit pass says whose fixes it read.** After a round that fixed a low-severity correctness finding like a nit, its review and the handoff's sentences read `round <n>'s fixes` in place of "the nit fixes", since what the pass read was a correctness fix. After a round of nits they are unchanged.
51. **A final nit pass finding that states `inFixDiff` is left as stated**: no check, no warning, nothing recorded, since nothing in that pass buys a round. The run's result lists each round's fixed-like-a-nit findings under `minor`, and the skill's `done` summary names them.
52. **Statements beyond the plan's list.** The workflow's `meta.description` still stated the done rule from before #93 and was reworded; the facts-only sentence of every review prompt and the reviewer file's opening gained the deferred ending; `agents/redline-github.md` and step 2 of "Rounds" in `docs/running.md` each still said a deferral comes with a mitigation. The handoff's sentence "the last one verified no new correctness item to fix or ask about" was kept: it stays true when the last round's new items were all deferred with nothing shipped. Each statement is pinned by key phrase in the loop test, which the plan did not ask for.
53. **Not run locally: shellcheck.** It is not installed on the build machine. CI runs it over `scripts/*.sh`, `tests/*.sh` and the generated `checks.sh`.

### Standards retrospective

54. **Standards retrospective: seventeen edits, approved by the owner as proposed (2026-11-16) and applied in their own commit.** Two lines this spec had made wrong were reworded: the done rule in `workflow/agents.md`, which had any deferral buying a round, and the sentence in `workflow/replay.md` that placed the last stop taking an override before a plan approver, where it is the round's first resolve. Fifteen additions went to `workflow/agents.md`, `workflow/replay.md`, `testing/tests.md`, `scripts/bash-conventions.md` and `process/docs-gate.md`; `plan.md`'s As built lists them by file, with what was already in a standard and the four patterns that reached a standard only at this step.

## Evidence

**An issue title is plain text on GitHub (measured 2026-11-16, read-only, GraphQL `Issue.titleHTML` on public issues; no issue was opened).** The rule above rests on this measurement, not on the Markdown specification:

- A title stored as `Mark section titles as &lt;h2&gt; (currently non-semantic &lt;div&gt;)` (FreeForCharity/FFC-EX-technomonasteries.org#119) has `titleHTML` `Mark section titles as &amp;lt;h2&amp;gt; (currently non-semantic &amp;lt;div&amp;gt;)`. GitHub escapes the `&` and decodes nothing, so a reader sees the entity as typed. `postedText` on a title would therefore show `&lt;` and `&#8288;` on screen.
- A title stored as `add @types/node` (stackstic/stackstic#136) has `titleHTML` `add @types/node`: no mention link. In a comment body the same text links the account, which is why the body is escaped.
- A title with backtick spans (objectstack-ai/objectui#8576) renders them as `<code>`, and an entity inside the span is shown as typed there too.

The query, for a rerun: `gh api graphql -f query='query { repository(owner: "<owner>", name: "<repo>") { issue(number: <n>) { title titleHTML } } }'`. Not measured: whether a title's `@word` sends a notification by a path other than the link; the absence of the link is the evidence, and the body, where the link exists, is escaped.

## Context

- **Visuals:** None. The layouts (the draft as filed, the replies, the handoff's Deferred section, the stop as the skill presents it, the launch questions) are in `plan.md`.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`. "Every verified item is decided" and "Nothing is parked" gain the fourth ending: what is worth doing elsewhere is tracked, not declined with a pointer. "Honest about its reach" lists what the run did not fix, and slice 7 rewords it for deferred items that now carry an issue number or a draft path.

## Standards Applied

- workflow/replay — two new stops and a new relaunch argument (`deferrals`); every prompt before a stop stays byte-identical, and the new field is named in `relaunch.how` in the same commit.
- workflow/agents — the dispositions change for the shaper, the plan approver and the resolve agent; a new GitHub-agent operation; a new fact the verifier states; every rule that lists the dispositions is found by searching for the list.
- testing/tests — red before green; a case per accepted and refused form; pinned posted text byte for byte; a new agent operation gains guard rows.
- process/docs-gate — a Docs entry per touched file; a new launch word lands in the grammar, the hints and the alias templates in one commit; every statement of the done rule is reworded.
- process/release — the unattended body changes, so a minor bump, marker v5, v4 frozen under `templates/history/`.
- process/standards-retrospective — the gate's last step, proposed to the owner and applied in its own commit.
- process/internal-notes — nothing from the private design record is copied in.
- prompts/attribution — the drafted issue, the replies and the handoff carry no model or vendor name.
- scripts/bash-conventions — the new subcommand prints one JSON object, progress on stderr, usage errors exit 2.
- scripts/guard — rows only: the GitHub role may run `defer`, the shaper may not, the main session is left to the permission prompt. The guard script is unchanged.
