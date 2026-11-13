# #93: verify facts, the shaper decides — Shaping Notes

## Scope

Issue #93 and its comment are the brief. The verifier answers one question, whether a candidate is true. The shaper answers the other, what to do about it, for every item of any kind. The person is asked on a real split only, and every decision Redline makes alone is posted with its reason and can be overruled.

Built here:

- The verifier's contract: verified, could not confirm or refuted, beside `duplicate`, `settled` and `known`. For the person, `outside` and `disproportionate` go.
- The shaper's dispositions: `fix`, `decline` with a reason, `defer`, `ask`, with the ask cases written as cases and checked by the workflow.
- The done rule: a round is bought by what it finds.
- The review body by kind, the handoff by outcome, the person named by login.
- Two doors to overrule a decline, and the closing summary in the session.
- The unattended template at v4, the plugin at 0.3.0.

Not built:

- One notification for a round's replies. It is a follow-up issue; its text is drafted in `plan.md`, "After the gate".
- Any change to `scripts/redline-guard.sh`, `hooks/hooks.json`, the gate or its stamp.
- Any change to the human-review pass.
- #73's regression pass and #75's instance-or-class question, which stay their own work.

## Decisions

From the brief (2026-11-13, @michaelfromtheoutfit; not reopened):

- The model in #93 is settled: the finder reports; every candidate is verified; every verified item is fixed, declined with a reason, or put to the person.
- The verifier establishes facts only. For the person goes, and so does the verifier's `disproportionate`. A cause outside the diff is a fact it states.
- The shaper decides every verified item of any kind: `fix`, `decline`, `defer`, `ask`.
- The person is asked in four cases only: the options differ in what the product does or a user sees; the fix changes an assumption, the approach or the architecture the original spec agreed; it reaches outside what the pull request set out to do; two options are both defensible and neither is the clear pick. Repository ask rules stay. The rule is written as cases, never as a confidence figure.
- A small refactor is done without asking.
- Redline acts on more per round and pull requests grow: accepted.
- Under `correctness only`, a verified nit is declined with the scope as its reason.
- Autopilot never stops; `coverage off` follows the same model; the human-review pass is unchanged unless the work forces a change.
- The template change is one a setup rerun carries: 0.3.0, marker v4, the frozen v3.
- Evidence is cited, not copied: `SPIKE-72-NOTES.md` section 10 by name, Losers League pull requests by number.
- The measurements in #93's Done-when are the owner's, after the gate.
- `scripts/redline-guard.sh` and `hooks/hooks.json` are not touched.

Asked at shaping (2026-11-13, one at a time), answered by @michaelfromtheoutfit:

1. **A round is bought by what it finds, not by what it commits.** When a round verifies a new correctness item that the shaper fixes or puts to the person, the next round runs the coverage pass again, whatever the person answered and whether or not a commit resulted. A round whose new items are all nits, small refactors, tests, docs or costs, or are all declined by the shaper on its own, ends: at the handoff when no fix was committed, after one final pass over the fixes when one was. The cap is unchanged. Rider: for this rule correctness includes security, privacy, data loss, and a promise the pull request makes that the code does not keep, and the verifier's instructions say so where it states an item's kind.
2. **An item the verifier could not confirm goes to the shaper for a second look, then gets a decision.** The verifier's way in is narrow: the claim turns on something the repository cannot show, and the entry says what was tried and what would confirm it. Rider: an item still unconfirmed after the second look whose harm would be serious if it were true (security, privacy, data loss, money) is put to the person; it is never declined on Redline's own say. Anything less serious is declined with "could not confirm: needs X".
3. **A refactor is small when four tests hold:** behaviour unchanged; it stays inside the pull request's files; it reworks code the pull request wrote; it is one idea, smaller than the pull request. Rider: a refactor that would undo a choice the pull request's own spec records as deliberate is not put to the person; the shaper's evidence rule answers it from the spec, and the item is declined with that decision cited.
4. **Every item the shaper decides gets an id and an inline thread.** Refuted and collapsed candidates get neither. Declined threads are resolved at the handoff like fixed ones. Under `correctness only` the workflow declines verified nits in one list in the review body, with no thread each. Rider: the plan says what a watcher is notified of in a round and whether the replies can arrive as one notification.
5. **The one-notification route is a follow-up issue, not built here.** GitHub's API allows it; #93 leaves replies as they are and documents what a watcher receives.
6. **The review body lists items by kind; the handoff groups them by what became of them,** declines up top, fixed in a folded block. The single Decisions list goes. Riders: the person is named by login, never by role; the full handoff is in the plan and was shown before the build.
7. **A decline is overruled through two doors that exist today:** a typed line at a stop the run already makes in that round, or a reply in the decline's thread followed by the human-review pass over the person's own login. Rider: the skill's closing summary lists what Redline declined on its own, each with its id and reason, after what it fixed, with one line on how to overrule one.
8. **One pull request, a commit per slice.** The build stops at each boundary with the exact file list and one line on what the slice did and which harness went red then green. Anything that needs a decision is put as a question.

Asked while building (2026-11-13), answered by @michaelfromtheoutfit:

9. **A finding on one of Redline's own files is still an ask, with its own reason, `redline's own file`.** The shaper's rule 7 already sent such a finding to the person, since no Redline role may write those files; the brief's cases did not name it, and the workflow now refuses an ask for any reason outside the cases. It is no case of judgment: it is a change only a person can make, as a finding under a repository ask rule is. So a Redline round's allowed reasons are the five cases, a repository rule, and this one.

10. **After a human-review pass, the final nit pass's line gives counts, and never says fixed for what was declined.** That pass's findings go to a Redline round's shaper, which can now decline, so the summary's one wording ("fixed in one more pass that was not re-reviewed") could be false. It now reads, for a mixed result, "2 correctness items in the fixes: 1 fixed in one more pass that was not re-reviewed; 1 not changed, answered in its thread", and for none fixed, "none was changed, and each is answered in its thread". `lastFixUnreviewed` is true only when that pass committed a fix. Nothing else in the human-review pass changed. The loop test has the mixed case.

Deviations from the shaped plan, found while building:

- **Task 3, this repository's section.** The setup script's three-way merge carried v4 into `.claude/commands/agent-os/shape-spec.md` with one conflict: the paragraph after the JSON block changed in the template and sits beside the hand-edited point 11. The section's side was kept and that paragraph edited by hand to the v4 wording. `tests/setup-test.sh` confirms the result: the unmarked section is read as v4 with no conflict, and a merge adds only the marker.
- **Task 3, the other roles' prompts.** "Judgment calls are returned, never decided" also stood in the resolve, plan approver, standards approver and implementer prompts. On a Redline round those now say that a pending decision is the person's and a decision already made, the shaper's own included, is applied as recorded. A human-review pass keeps the old sentence in every prompt.
- **Task 3, the sweep.** The kinds that settle a thread were listed in two places; they are one constant now, and a carried finding the new round declines has its earlier thread resolved, which a second check pins.

- **Task 4, a carried finding the verifier left out.** The workflow already carried such a finding as reported; it carried the earlier round's confidence with it. Nobody verified it at the new head, so it is carried as `unconfirmed`, with a line saying so, and the shaper's second look decides it.
- **Task 4, a nit an issue already tracks, under `correctness only`.** It is listed under Already tracked, where a tracked finding of any kind sits, and is not declined by the scope: there is nothing for the scope to decline.
- **Task 4, a candidate kept as reported.** It is a `correctness` finding of `medium` severity, since the finder gives neither; its title is the candidate's summary on one line and its description the failure scenario.
- **Task 4, the skill's review-only report.** It read `rounds[0].forThePerson`, which the result no longer carries, so its one line changed in this slice and not with the rest of the skill in Task 6.
- **Task 4, the closing sentence of a review body.** "Redline replies in the item's thread, or in a PR comment that opens with its marker, with what it decided and why": the plan's wording ("in each thread") read as a promise of a thread for every item, which an item in the review body does not have.

- **Task 5, the handoff's opening sentence.** The same rule as decision 10 holds for a Redline run's own final nit pass: the sentence counts what the pass found and what a commit fixed, in three wordings (all fixed, none changed, some of each). The default sentence reads "the last one verified no new correctness item to fix or ask about". Two endings that had no sentence of their own got one, so the default is never said where it would be untrue: a review dial with nothing picked ("none of its findings was picked to act on"), and a bought round that changed no code with the coverage pass off.
- **Task 5, the round after a round that changed no code.** It is a `fix-diff` round whose range carries `empty: true`: the prompt says there is no fix diff to recheck, the review body says the last round changed no code, and the coverage pass runs at the new head as on any round.

- **Task 6, a decision's line.** In the handoff, and in what a later review reads as an earlier outcome, a person's or the autopilot's decision now says whether it was applied ("Applied in 2bbbbbb." or "No code change."), as its thread reply always did. A human-review pass's lines are as they were.
- **Task 6, the human-review pass with no login.** The fallback for the person's name is "the person running Redline" on a Redline run. A run that is a human-review pass keeps "the author", in its replies and its summary, so nothing in that pass changes.
- **Task 6, what the results carry.** A decisions hand-off carries `declined` (id, title, reason) for the round, which the skill lists after the calls. Every entry of `decided` carries `kind`, a decline's `reason`, and `overruled` (the person changed a disposition that was not put to them), which the skill's closing summary groups by.
- **Task 6, the folded Fixed block as GitHub shows it.** Rendered once through `gh api markdown` (mode `gfm`) on 2026-11-13 with sample lines: the block is one folded `<details>` holding a list, the heading after it renders as a heading, and `@alex` inside the overrule line's code span is no mention.

Shaping defaults (recorded, not asked; each was listed in the plan the owner approved):

- A fix diff means a commit that names an item; the round's spec and standards commits are not one.
- A bought round that changed no code runs the next round as the coverage pass and verify, with no fix diff to recheck. With `coverage off` such a round ends the run.
- A finding under a repository ask rule is put to the person whatever the shaper returned, a decline included.
- The cap counts every new correctness item in the review past the cap, confirmed or not.
- `needsDecision` leaves the verifier's contract.
- The kind stays two-valued, `correctness` or `nit`; `nit` covers everything that is not correctness.
- A decided finding a candidate still reproduces (#80, R3-4) is accounted for as `settled` and shows in the set-aside block.
- A candidate the verifier left out, or gave an unknown outcome or a bad ref, becomes an unconfirmed correctness item of the round, with a warning.
- Login naming reaches every string a Redline round posts that names the runner by role or as "you"; `redline-gh.sh` reads the old and the new forms; the human-review pass's wording is left as it is.
- A final pass whose items were all declined says so.

## Context

- **Visuals:** None. The review body and the handoff are laid out as text in `plan.md`.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`. "Decisions stay with people" narrows to the ask cases: Redline now decides what a careful author would decide without asking, and says so with its reason. "Honest about its reach" holds: a clean run means a round found no new correctness item to fix or ask about. Both statements are reworded in the docs task.

## Standards Applied

- workflow/agents — the verifier's and the shaper's contracts, owners on every decision, what counts as settled.
- workflow/replay — decisions still enter after shaping; the done rule reads no clock and no GitHub state; `coverage off` keeps its prompts free of the candidates block.
- testing/tests — red before green per slice; one key phrase per verifier rule; a neighbour for each decision that must not change.
- scripts/bash-conventions — the `redline-gh.sh` header is the reference and `docs/scripts.md` quotes it; the template marker and the frozen copy.
- scripts/guard — read to confirm that no new subcommand and no guard change is needed.
- process/docs-gate — one Docs entry per touched file; a done-rule change rewords every statement of it.
- process/release — the minor bump, the marker, the frozen v3, the changelog left to the owner.
- process/internal-notes — evidence cited by name and number, never copied.
- process/standards-retrospective — Task 8.
- prompts/attribution — no model or vendor name in anything posted or written.

## Standards retrospective

Done mechanically (gate step 12): every decision above, every deviation found while building, and every check that went red and was fixed by learning something about the harness, each checked against `agent-os/standards/`.

### Contradicted by this spec (the standard is now wrong)

1. **`workflow/agents.md`, the "Judgment calls are returned, never decided" bullet.** Replaced:
   > - The shaper decides, and a person is asked in named cases only (#93): the verifier states what is true and the shaper sorts every finding into `fix`, `decline` (with the reason a teammate reads), `defer` or `ask`. It returns an `ask`, with a story, options and a recommendation, in five cases (the options differ in what the product does or a user sees; the fix changes an assumption, the approach or the architecture the spec agreed; it reaches outside the pull request; two options are defensible with no clear pick; the finding is still unconfirmed after the shaper's second look and serious if true), beside a repository ask rule and a finding on one of Redline's own files. Everything else it decides, a decline included, as `decided by: redline` with its reason. The rule is cases, never a confidence figure, and the workflow checks it: a judgment call whose `why_human` is outside the round's list stops the run at `shape`. The person decides a call in their session, or autopilot takes the recommendation and says so, except for a finding a repository ask rule covers, which autopilot leaves to the person with the rule as its reason (#49). No other role decides a pending call or reopens a decision made
2. **`workflow/agents.md`, the human-review-pass bullet.** "never `defer`: nothing a teammate asked for is deferred by Redline on its own" becomes "never `defer` and never `decline`: nothing a teammate asked for is deferred or declined by Redline on its own". Added at its end:
   > The pass is unchanged by #93: its prompts keep "Judgment calls are returned, never decided", its lines say "the author", and a run that is a human review pass keeps that as its no-login fallback. The round its final nit pass runs as is a Redline round, whose shaper may decline, so the pass's summary counts what the nit pass found and what a commit fixed, and never says fixed of an item that was not
3. **`workflow/agents.md`, the earlier-rounds bullet.** The dispositions a reply gives evidence of gain `declined` (a reply opening `declined: `, Redline's own decision) and `left`.
4. **`workflow/agents.md`, the thread-sweep bullet.** "Settled is fixed, deferred or decided with the reply posted" becomes "Settled is fixed, deferred, declined or decided with the reply posted, one list (`SETTLED_KINDS`) read for the round's own threads and for the earlier threads it carried (#93)".
5. **`workflow/agents.md`, the coverage-pass bullet (#79).** Rewritten for the facts-only verifier and the new done rule: six outcomes (`verified`, `unconfirmed`, `refuted`, `duplicate`, `settled`, `known`); no guards and no For the person, with a cause outside the diff, the conditions a failure needs and a removed guard stated as facts; the kinds, and that the kind keeps a run going; the done rule as the workflow's, read off the shaper's decisions (a round is bought by what it finds); the two reopenings; a decided finding that still reproduces accounted for as `settled`; a left-out candidate, and a left-out carried finding, kept as `unconfirmed`; the scope decline under `correctness only`. The #79 and #80 references it carries stay.
6. **`workflow/agents.md`, the #85 verifier-rules bullet.** `finding` becomes `verified` in the accounting; "unless another rule puts it elsewhere" keeps only a collapse or a refutation; a candidate a refutation does not answer is verified or could not be confirmed, no longer For the person; a removed guard is a fact the finding states; the set-aside block lists every candidate that is not a finding of the round, after the closing sentence, with the summary `Refuted, collapsed or already tracked`; the fields that go through `postedText` lose For the person lines and gain the Would confirm line and the scope-declined lines.
7. **`workflow/replay.md`, the dial bullet.** "keeps every prompt byte-identical to the run before the pass existed" is no longer true of `coverage off`:
   > - A dial that turns a pass off leaves that pass's call and its block out of every prompt: `coverage off` reaches the workflow as `models.coverage` null, and the coverage call, the candidates block and its rules exist only when a pass ran. The loop test proves it per rule, each key phrase of the block being absent from a `coverage off` prompt (#79). Since #93 the off run follows the same model as the covered one, the reviewer finding and verifying alone, so its prompts are no longer those of the run before the pass existed
8. **`process/docs-gate.md`, the done-rule bullet.** "a decided finding it still reproduces is listed under For the person" becomes "is shown in the set-aside block as settled (#93)".
9. **`index.yml`, `workflow/agents`.** "judgment calls returned never decided, an owner on every decision" becomes "the verifier states facts and the shaper decides, a person asked in named cases only, an owner and a reason on every decision".

### Missing (taught by this spec)

10. **`workflow/agents.md`, the owner bullet**, added at its end:
    > A decision Redline makes alone carries its reason beside its owner, in the thread and in the handoff, so the person can audit it and overrule it without a new stop: a typed line at a stop the run already makes in that round, or a reply in the thread and a human review pass over their own login (#93). A posted line names the person running Redline by login, never by role or as "you" (`left to @<login> under repository rule <id>`, `### Put to @<login>`), since on a teammate's pull request that person is not its author; with no login the words are "the person running Redline", and `redline-gh.sh prior-findings` reads the older wording too
11. **`workflow/agents.md`, the workflow-checks-a-result bullet**, added: "a `decline` must carry its reason, and on a Redline round a judgment call's `why_human` must be one of the round's cases (#93)".
12. **`testing/tests.md`, the key-phrase bullet**, added:
    > A sentence every review prompt carries, with the pass or without it (the kinds; that the verifier states facts and decides nothing, #93), is pinned in the agent file and in both prompts. The loop test reads `agents/redline-shaper.md`, `templates/shape-spec-unattended.md` and this repository's section the same way: a rule all three state is one key phrase found in each
13. **`testing/tests.md`, the gh-test bullet**, added: PR 16, the #93 forms (a `declined:` reply in a thread and in an issue comment; a reply that only mentions a decline; an `unconfirmed` line with its Would confirm line; a scope-declined line that is no finding; the rule's tail and reply naming the person by login and by the no-login fallback; a decided reply that opens `left to @<login>` without the rule's words; a line whose fourth word the reader does not know).
14. **`testing/tests.md`, three new bullets** from checks that went red for a reason in the harness:
    > - A check fails, it does not throw, when the run it reads took another path: a prompt or a body that may be absent is read as `''`, so a red run reports its count. A `TypeError` in one check hides every check after it (#93)
    > - A rule about every posted body is pinned over every scenario, not in one: `go()` reads each run's prompts and one check at the end names the offenders (`no prompt of any scenario holds a For the person section`), so a later scenario cannot bring back what the rule removed (#93)
    > - The post mock numbers inline comments in the order ids appear in the post prompt, the body first, so a change to the order a body lists findings renumbers them: an expected sweep line is read off the scenario's body order, never carried over from the layout before (#93)

### Already covered, so no edit

- The template bump, the frozen v3 and the pinned hash: `scripts/bash-conventions.md` (the template bullet) and `process/release.md`. The one conflict in this repository's own merge, a changed line beside its hand-written point 11, is the case that bullet already describes (a hunk whose lines do not line up stays one conflict); `docs/upgrading.md` now says what to do for v4.
- The minor bump with the template change, the changelog left to the owner: `process/release.md`.
- Evidence cited by name and number, never copied: `process/internal-notes.md`.
- The Docs entries and the done-rule rewording across the README, `docs/`, the descriptions and the mission: `process/docs-gate.md`.
- The claim about GitHub's rendering checked once through `gh api markdown` and recorded here: `testing/tests.md`.
- No guard change: `scripts/guard.md` was read to confirm it (the GitHub agent's group passes every `redline-gh.sh` subcommand, and no subcommand was added).
- Red before green on every slice, and a neighbour for each decision that must not change: `testing/tests.md`.

No pattern was invented outside `agent-os/standards/` beyond the test patterns item 14 proposes.
