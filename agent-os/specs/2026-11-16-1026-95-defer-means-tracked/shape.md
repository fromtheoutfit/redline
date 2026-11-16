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
