# Issue #93: every verified candidate is fixed, declined with a reason, or put to the person

Spec folder: `agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/`. I make no commits; the owner commits at each slice boundary. Version goes to 0.3.0, the unattended template to v4.

## Context

Redline's verifier (`agents/redline-reviewer.md`) answers two questions at once: is the candidate true, and should Redline act on it. It is held to precision, so it promotes only confirmed defects and parks the rest under For the person, where nothing acts on them, nobody is asked, and a reader cannot tell "true, not worth a task" from "plausible, not reproduced". The same strictness ends runs early: the loop goes on only while a review holds an open correctness finding (`workflows/redline-loop.js:3586-3603`), so a round whose new candidates were all filed as notes finishes the run while the finder is still producing material.

Evidence, cited and not copied: `SPIKE-72-NOTES.md` section 10 (internal), Losers League pull requests #829 and #817, and this repository's #86 and #89.

The change splits what is true from what to do about it. The verifier states facts. The shaper decides every item. The person is asked on a real split only. Every decision Redline makes alone is posted with its reason and can be overruled.

## Decisions

### From the brief (2026-11-13, not reopened)

1. The model in #93 is settled: the finder reports; every candidate is verified; every verified item is fixed, declined with a reason, or put to the person.
2. The verifier establishes facts only: verified, could not confirm, refuted, beside `duplicate`, `settled`, `known`. For the person goes, and so does the verifier's `disproportionate`. A cause outside the diff is a fact it states.
3. The shaper decides every verified item of any kind: `fix`, `decline` (with a reason a teammate can read), `defer` (as today), `ask`.
4. The person is asked in four cases only: the options differ in what the product does or a user sees; the fix changes an assumption, the approach or the architecture the original spec agreed; it reaches outside what the pull request set out to do; two options are both defensible and neither is the clear pick. Repository ask rules stay. Written as cases, never a confidence figure.
5. A small refactor is done without asking.
6. Redline acts on more per round and pull requests grow: accepted.
7. Under `correctness only`, a verified nit is declined with the scope as its reason.
8. Autopilot never stops; `coverage off` follows the same model; the human-review pass is unchanged unless forced (then stop and ask).
9. A template change a setup rerun carries: 0.3.0, marker v3 to v4, `templates/history/` per the release standard.
10. Evidence is cited, not copied. The privacy item on #829 is not described in this repository.
11. The Done-when measurements are the owner's, after the gate.
12. `scripts/redline-guard.sh` and `hooks/hooks.json` are not touched. Nothing in this plan needs either.

### Asked at shaping (2026-11-13, one at a time)

13. **The done rule: a round is bought by what it finds, not by what it commits.**
    - Keeps going: the round verified a new correctness item that the shaper fixes (in full, or by a deferral's mitigation) or puts to the person. The next round runs the coverage pass again, whatever the person answered and whether or not a commit resulted. A decline the person overrules to a fix counts the same.
    - Ends: nothing new, or every new item declined by the shaper on its own or not a correctness item. With no fix committed: handoff. With fixes committed (nits, small refactors, tests, docs, costs): one final pass over those fixes, then handoff.
    - No nit chase: only such a correctness item buys a round; the final pass reads the fixes only and reports only correctness bugs they introduced, one more fix pass at most; a declined item is settled.
    - Cap unchanged: `maxRounds` revise rounds (default 3); a new correctness item in the review after the last one ends the run with the cap-hit comment and no review request.
    - Rider: for this rule correctness includes security, privacy, data loss, and a promise the pull request makes that the code does not keep. The verifier's instructions say so where it states an item's kind.
14. **An item the verifier could not confirm goes to the shaper for a second look, then gets a decision.**
    - Verifier, a narrow way in: could not confirm means the claim turns on something the repository cannot show (production data, an external service, timing between processes, a browser). A claim that reading the code or running a test can settle is verified or refuted. Each entry says what was tried and, in one line, what would confirm it.
    - Shaper: confirmed, then fix, defer or ask as usual. Refuted, then decline with the evidence. Still unconfirmed: fix when a cheap guard is right either way; otherwise decline with "could not confirm: needs X".
    - Rider: an item still unconfirmed after the second look whose harm would be serious if true (security, privacy, data loss, money) is put to the person with what was tried and what would confirm it. It is never declined on Redline's own say. This is the one ask case beside the four.
    - Settled like any decline, except that a later pass's candidate the verifier does confirm is new and names the earlier id.
15. **A refactor is small, and done without asking, when all four hold.**
    1. Behaviour unchanged: no existing test's expectation is edited (tests may be added, or follow a rename), and nothing outside the code depends on what moves (a route, a response shape, a config key, a command's output, a column).
    2. It stays inside the pull request: every file it changes is one the pull request already changed, or a new file holding code moved out of those, or their tests.
    3. It reworks code this pull request wrote: the lines it rewrites are lines the pull request added or changed, plus the call sites of what it extracts in those same files.
    4. One idea, smaller than the pull request: one extraction, rename, inlining or removal per item, and its diff is smaller than the pull request's own.
    - Not small: declined with the reason and where it belongs, or asked about when a case holds.
    - Rider: a refactor that would undo a choice the pull request's own spec records as deliberate is not put to the person. The shaper's evidence rule answers it from the spec, and the item is declined with that decision cited.
16. **Every item the shaper decides, verified or could-not-confirm, gets an id and an inline thread, as findings do today.**
    - Refuted and collapsed candidates get neither and stay in the folded set-aside block.
    - Fixed, deferred, declined and decided threads are resolved at the handoff; open threads are only what waits on a person.
    - Under `correctness only`, verified nits are declined by the workflow with the scope as the reason: one list in the review body, an id each so a later round does not repeat them, no thread; a later run without the scope sees them fresh.
17. **A round's replies stay one notification each; the one-notification route is a follow-up issue.** See "Notifications in a round" and "After the gate".
18. **The review body lists items by kind; the handoff groups them by what became of them, declines up top, fixed in a folded block. The single Decisions list goes.**
    - Rider: the person is named by login, never by role ("Put to @login", "left to @login", never "the author"), since on a teammate's pull request the person running Redline is not its author.
    - Rider: the full handoff is in this plan ("The handoff, in full") and is shown before the build starts.
    - The agent-files sentence in the handoff is written in the past tense.
19. **A decline is overruled through two doors that exist today.**
    - Door 1, a stop the run already makes in that round: at a guided hand-off the skill lists the round's declines with their reasons after the calls, and a typed line `<id>: fix. <reason>` (or `defer`) overrules one before `relaunch`. On the plan dial a decline can be changed to fix or defer in the list. A round with declines and no ask does not stop.
    - Door 2, after the run or for an earlier round: reply in the decline's thread, then `/redline-revise <pr> review @login`. The human-review pass, unchanged, takes the reply as an instruction.
    - Rider: when a run finishes, the skill's closing summary in the session lists what Redline declined on its own, each with its id and reason, grouped after what it fixed, with one line on how to overrule one.
20. **One pull request, a commit per slice.** I stop at each boundary. The boundary message holds the exact file list for the commit and one line saying what the slice did and which harness went red then green, and nothing else. Anything that needs a decision is put as a question.

### Consequences I drew from the answers (strike any that is wrong)

- **A fix diff means a commit that names an item.** The round's spec and standards commits are not one, so a round whose items were all declined ends at the handoff instead of a final pass over an empty diff.
- **A bought round that changed no code** runs the next round as the coverage pass and verify at the new head, with no fix diff to recheck. With `coverage off` there is no pass to rerun, so such a round ends the run.
- **A finding under a repository ask rule** is put to the person whatever the shaper returned, a decline included, and so buys a round like any ask when it is a correctness item. A finding not picked on the review dial was never shaped and buys nothing.
- **The cap counts** every new correctness item in the review past the cap, confirmed or not.
- **`needsDecision` leaves the verifier's contract.** Whether to ask is the shaper's question; the review no longer says "this needs a decision".
- **The kind stays two-valued**, `correctness` or `nit`. `nit` covers everything that is not correctness: naming, clarity, a small refactor, a test gap, a cost, a doc. The review body's heading for them reads "Other items".
- **A decided finding a candidate still reproduces** (#80, R3-4: keep settled, show the gap) is accounted for as `settled`, its ref naming the id and saying it still reproduces, and shows in the set-aside block, since For the person is gone.
- **A candidate the verifier left out, or gave an unknown outcome or a bad ref**, becomes an item of the round as reported: a new id, `correctness`, `unconfirmed`, with a warning. The shaper's second look decides it. Never a quiet drop.
- **Login naming reaches every string a Redline round posts** that names the runner by role or as "you": the handoff headings, `left to @login under repository rule <id>` (reply and handoff line), the finding-line tail `· left to @login under rule <id>`, the inline sentence, `@login chose: ...`, the cap comment's `@login will pick these up`. With no login the fallback reads "the person running Redline". `redline-gh.sh` reads both the old and the new forms. The human-review pass's own wording is left as it is (decision 8).
- **A final pass whose items were all declined** says so; "fixed in one more pass, not re-reviewed" is written only when that pass committed a fix.

## Design

### The verifier (`agents/redline-reviewer.md`, the verify prompt)

- An item: `id, file, line, side, category (correctness | nit), severity, confidence (confirmed | unconfirmed), title, description, proposedFix, wouldConfirm, outsideDiff, knownAs, carriedFrom, askRule`.
- `confirmed` means reproduced, or traced through the code to the claimed result with the lines cited. `unconfirmed` is the narrow case of decision 14, with `wouldConfirm` in one line.
- Kind, with decision 13's rider: `correctness` is wrong behaviour reachable in practice, a security hole, a privacy leak, data loss, a broken contract, or a promise the pull request makes (title, description, spec) that the code does not keep. The file says the kind now keeps a run going.
- Facts it states and no longer acts on: the cause is in code the diff did not change (`outsideDiff`, and where); the conditions a failure needs; a guard the base branch had and this pull request removed, with the removed line.
- Accounting, one entry per candidate: `verified` or `unconfirmed` (ref the item's id), `refuted` (the claim and the evidence against it), `duplicate`, `settled`, `known`. `outside`, `disproportionate` and `forThePerson` go.
- Settled gains `declined`. Two things reopen: a fixed finding that still reproduces (as today), and a could-not-confirm decline the verifier now confirms.
- Unchanged: collapse by cause, the known-finding check, the partly tracked rule, a refutation answers the claim, the rule checks (scheduled and queued work, Docs, Version), the recheck of the fix diff.
- `coverage off`: the reviewer is its own finder under the same contract, with no accounting.

### The shaper (template v4, `agents/redline-shaper.md`)

- Dispositions: `fix`, `decline` (with `reason`), `defer`, `ask`. A human-review pass still sorts into fix, ask or none, never defer or decline.
- "Judgment calls are returned, never decided" becomes: you decide, and the person is asked in five cases only (decision 4's four, and decision 14's rider), beside the repository ask rules. Everything else is decided by redline with the reason.
- `why_human` on a Redline round: `product decision`, `spec assumption`, `outside the pull request`, `no clear pick`, `unconfirmed, serious if true`, `repository rule <id>`, and `redline's own file` (asked while building; see As built). The workflow refuses any other on a round (a stage error naming the item, resumable at the shaper), so "asked only in the cases" is checked, not hoped. The human-review pass keeps today's values.
- Proportionality: a fix out of proportion is `defer` when a cheap mitigation exists, otherwise `decline` with the reason, or `ask` when a case holds. A removed guard weighs toward `fix`.
- The second look (decision 14): the shaper returns `secondLook` (`confirmed | refuted | unconfirmed`) for each item the verifier could not confirm, and records what it ran or read.
- The small-refactor test (decision 15) and its rider.
- The plan approver bounces: a decline with no reason a teammate can read; a decline of a still-unconfirmed item that would be serious if true; an ask outside the cases; a "small" refactor task that fails the four tests.

### The workflow (`workflows/redline-loop.js`)

- Schemas: `FINDING_SCHEMA :503`, `COVERAGE_OUTCOMES :536`, `LISTED_ELSEWHERE :545`, `REVIEW_SCHEMA :552` (no `forThePerson`, `PERSON_SCHEMA` removed), `JUDGMENT_CALL_SCHEMA :613`, `SHAPE_SCHEMA :636`.
- Intake: `review() :2145` and `accountCoverage() :1418` (a left-out candidate is minted as an item), `coverageSentence() :1017`, `setAsideBlock() :936` (summary "Refuted, collapsed or already tracked").
- Prompts: `reviewPrompt() :1234`, `candidatesBlock() :1317`, `shapePrompt() :1500`, `resolvePrompt() :1588`, the plan approver's and implementer's prompts, `NEVER_DECIDE :319` replaced by the ask cases.
- Decisions: `checkDispositions() :2436`, `checkCalls() :2463`, `forceAskRules() :2523`, `outcomesFor() :2384` (kind `declined`), `describeOutcome() :2413`, `replyBody() :1199` (`declined: <reason> · decided by: redline`), `threadCandidates() :3175` (declined is settled).
- The loop `:3494-3606`: `revise()` returns `bought` and whether a fix was committed; the three endings of decision 13; the no-fix-diff round; under `correctness only` the workflow declines nits before shaping and keeps them in the round's history.
- Posted text: `reviewBody() :861`, `findingLine() :849`, `commentBody() :1026`, `handoffComment() :2965`, `capComment() :3102`, the agent-files sentence `:244` (the handoff gets its own past-tense form; the warning and the skill's line keep theirs).
- Results: a decisions hand-off carries the round's declines (`handoffResult() :3359`); every entry of `decided` carries its kind and reason, for the closing summary.
- Reuse, unchanged: `postedText()`, `personLine()`, `passOf()`, `history()`, `reconcilePrior()`, `finish()`, `sweepThreads()`, `commitRecord()`, the override path in `revise()` (`overridesFor :2729`), which already applies a typed disposition change.

### Reading earlier rounds back (`scripts/redline-gh.sh`, `prior-findings`)

- The finding-line pattern `:334` accepts `unconfirmed` beside the old words.
- `classify :336-344`: a reply opening `declined: ` is `declined`; `left to @` is `left` beside `left to the author`.
- The tail it strips `:349` gains `· left to @login under rule <id>` beside `· yours under rule <id>`.
- No new subcommand, so no guard change.

### The template and this repository's section

- `templates/shape-spec-unattended.md` to v4: the intro sentence, point 3 (the cases), point 4 (dispositions, proportionality, small refactor), point 5 (the second look), point 10 (the JSON). The fill-in phrases and the "Everything not named above" line stay where `redline-setup.sh` reads them (`:426-470`).
- `templates/history/shape-spec-unattended.v3.md`: today's template, byte for byte.
- `.claude/commands/agent-os/shape-spec.md`: the v4 body with this repository's three hand edits kept (the Docs sentence, "A teammate runs the command", point 11). The section sits outside the Verification Gate, so the gate stamp does not move.

### The skill (`skills/redline/SKILL.md`)

- The plan hand-off shows `decline` with its reason and lets it be changed to fix or defer.
- The decisions hand-off lists the round's declines after the calls and takes `<id>: fix. <reason>`.
- The closing summary lists fixed, then declined with id and reason, then one line on how to overrule.
- The review-only report counts could-not-confirm items in place of For the person entries.

## The review body

```
Redline round 1

Reviewed the whole pull request.

The coverage pass over the whole pull request at 0a1b2c3 returned 15 candidates: 12 verified, 1 could not be confirmed, 1 refuted, 0 collapsed into items already reported or settled, 1 already tracked.

<the verifier's summary, two or three sentences>

### Correctness (3)

- **R1-1** · correctness · high · confirmed · `app/Orders/Export.php:42` · The export skips cancelled orders

### Other items (9)

- **R1-4** · nit · low · confirmed · `app/Orders/Export.php:88` · Two methods repeat the header row

### Could not confirm (1)

- **R1-13** · correctness · medium · unconfirmed · `app/Jobs/SendExport.php:20` · Two workers can send the same export
  Would confirm it: two workers on one queue taking the same job.

### Declined under this run's scope (correctness only) (9)

- R1-4 · `app/Orders/Export.php:88` · Two methods repeat the header row

### Carried forward from earlier rounds, Resolved from earlier rounds, Already tracked

(as today)

Each item has an inline comment with the detail or, where GitHub could not anchor it, sits under Not placed inline below. Redline replies in the item's thread, or in a PR comment that opens with its marker, with what it decided and why.

### Candidates set aside (2)

<details>
<summary>Refuted, collapsed or already tracked</summary>

- `config/export.php:7` · The chunk size cannot be configured · refuted: the claim is that the size is fixed; `config/export.php:7` reads it from the environment

</details>
```

"Other items" and "Declined under this run's scope" never appear together: the second replaces the first on a `correctness only` run, with no thread per line.

## The handoff, in full

Every heading in order, one example line each. A heading with nothing under it is left out. Bracketed notes say when a heading appears and are not posted.

```
Redline handoff

Redline ran 3 review rounds; the last one verified no new correctness item to fix or ask about.

Resolved 21 threads; 2 left open: R1-3 (repository rule migrations), R2-4 (a teammate commented).

Redline replaced the PR description with the redraft in `agent-os/specs/2026-11-13-0859-21-review-round-3/redline/pr-body.md`; the previous one is in the description's edit history.

Agent files changed during this run (`agents/redline-reviewer.md`): the rounds after the change may have run under them, while the workflow's own prompts were the launch's.

@sam, over to you for the human review.

### Rounds

- Round 1 (pr): 13 items: 8 fixed, 3 declined, 1 put to @alex, 1 left to @alex; 9 commits; spec `agent-os/specs/2026-11-13-0859-21-review-round-1`

### Put to @alex (1)

- **R1-2** The export skips cancelled orders: Include them, marked as cancelled. Applied in 1a2b3c4. · decided by: @alex

### Overruled by @alex (1)                [a disposition @alex changed at a stop]

- **R1-9** Two methods repeat the header row: Fix it now; a third copy lands next week. Applied in 2b3c4d5. · decided by: @alex

### Declined by Redline (4)

To overrule one, reply in its thread, then run `/redline-revise 21 review @alex`.

- **R1-7** Rename `sendAll` to `dispatchAll`: declined: the pull request's spec keeps the name on purpose (decision 4 in its shape.md) · decided by: redline
- **R2-3** Two workers can send the same export: declined: could not confirm: needs two workers on one queue · decided by: redline

### Declined under this run's scope (correctness only) (5)     [correctness-only runs]

- R1-12 · `resources/js/pages/Export.vue:18` · The prop name shadows the import

### Deferred (mitigated now, full fix left open)

- **R1-5** The export holds every row in memory: shipped a row cap with a clear error; open: stream the export

### Left to @alex (repository rules)

- **R1-3** The new column has no index: rule migrations (Migrations are applied by hand); left to @alex under repository rule migrations: Add the index in the next migration. · decided by: @alex

### Not picked by @alex (1)               [review dial]

- **R1-11** The log line names the wrong queue: not acted on in this run: Known and accepted. · decided by: @alex

### Not changed (1)                       [a fix that did not land]

- **R2-6** The retry count is read twice: not changed · decided by: redline

### Fixed (9)

<details>
<summary>Each in its own commit</summary>

- **R1-1** The download link is unsigned: fixed in 3c4d5e6 · decided by: redline

</details>

### Earlier rounds                        [a pull request that already carries rounds]

- **R1-4** The header row is built twice: carried forward as R3-1: fixed in 4d5e6f7 · decided by: redline

### Candidates set aside in round 3 (3)

<details>
<summary>Refuted, collapsed or already tracked</summary>

- `config/export.php:7` · The chunk size cannot be configured · refuted: the claim is that the size is fixed; `config/export.php:7` reads it from the environment

</details>

### Commits

- 3c4d5e6 redline: R1-1 sign the download link (#20)

The commits are local only; push was off for this run.        [no push]
```

- On autopilot the second heading reads `### Asked, decided on autopilot (n)` and its lines end `· decided by: redline (autopilot)`.
- A could-not-confirm item has no heading of its own here: it sits under what became of it.
- Opening sentence, by ending:
  - Nothing bought: as above.
  - A clean final pass: "Redline ran N review rounds. The last was a final pass over the fix diff only, which found no correctness bugs in those fixes." then the whole-PR sentence as today.
  - A final pass that fixed a bug: today's sentence ("fixed in one more pass, which was not re-reviewed. Please look at that commit first.").
  - A final pass whose items were all declined or decided with no commit: "The final pass found N correctness items in those fixes; none was changed, and each is listed below."
  - `coverage off`, a bought round with no fix: "the last one changed no code, and with the coverage pass off there was nothing further to review."

**The closing summary in the session** (decision 19's rider), after the counts the skill reports today:

```
Fixed (9)
- R1-1 The download link is unsigned: fixed in 3c4d5e6
Declined by Redline (4)
- R1-7 Rename `sendAll` to `dispatchAll`: the pull request's spec keeps the name on purpose
- R2-3 Two workers can send the same export: could not confirm: needs two workers on one queue
To overrule one: reply in its thread, then /redline-revise 21 review @alex
```

## Notifications in a round

- **Today, and after this change:** the round's review is one notification, with every inline comment in it. Each reply is its own notification, because each is its own REST call (`scripts/redline-gh.sh:471-479`; GitHub's reference for that endpoint says "This endpoint triggers notifications"). A reply to an item in the review body is an issue comment: one more each. The handoff comment and the review request are one each.
- **Who receives them:** anyone subscribed to the pull request. The teammate is subscribed once review is requested or once they comment, so the per-reply notifications reach them on a later run and on a human-review pass; someone watching the repository gets them from round 1. A round like #829's would send about 13.
- **Can a round's replies arrive as one?** GitHub's API allows it: the GraphQL mutation `addPullRequestReviewThreadReply` takes `pullRequestReviewId`, "the pending review to which the reply will belong", so the replies can sit in one pending review submitted once, as "Start a review" does in the browser. That it notifies once is expected, not measured.
- **Not built here** (decision 17). `docs/running.md` says what a watcher receives.

## Files

- Changed: `workflows/redline-loop.js`, `agents/redline-reviewer.md`, `agents/redline-shaper.md`, `agents/redline-plan-approver.md`, `agents/redline-resolve.md`, `agents/redline-github.md`, `agents/redline-implementer.md`, `skills/redline/SKILL.md`, `scripts/redline-gh.sh`, `templates/shape-spec-unattended.md`, `.claude/commands/agent-os/shape-spec.md`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`.
- New: `templates/history/shape-spec-unattended.v3.md`, the spec folder, gh fixtures for the new reply and line forms.
- Tests: `tests/loop-test.mjs` (725 checks today), `tests/gh-test.sh`, `tests/setup-test.sh` (the `v4)` hash in `ubody_pin :698`, a "v4's decline arrived" merge case).
- Docs: `README.md`, `docs/running.md`, `docs/contract.md`, `docs/upgrading.md`, `docs/scripts.md`, `agent-os/product/mission.md`.
- Not touched: `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` and its stamp, `scripts/redline-setup.sh`, `scripts/redline-prefs.sh`, `skills/redline-revise/SKILL.md`, `CHANGELOG.md` (the owner's, at tag time).

## Tasks, one commit each

Every slice writes or changes its checks first and sees them fail, then builds. A check named in `tests.md` rules is followed: one key phrase per verifier rule, in the agent file and in a covered prompt; a neighbour for each decision that must not change.

**Task 1: save the spec documentation.** `plan.md` (this plan), `shape.md` (scope, the decisions above with their owners and dates, context, standards applied), `standards.md` (the ten standards in full, as read today), `references.md` (the lines named under Design, read at `d6876e8`).

**Task 2: the reader of earlier rounds.** `scripts/redline-gh.sh` (the three changes above and its header), `tests/gh-test.sh` and fixtures (a declined reply is `declined`; an `unconfirmed` line is a finding; `left to @login` is `left`; the old forms still read; a neighbour: a reply that merely contains "declined" is still `decided`), `docs/scripts.md`. Red then green: `tests/gh-test.sh`.

**Task 3: the shaper decides.** Template v4 and the frozen v3, this repository's section, the shaper, plan approver, resolve, GitHub and implementer agent files, the workflow's shaper side (schemas, `checkDispositions`, `checkCalls`, `forceAskRules`, the `declined` outcome, its reply, the sweep, the shape, resolve, plan and implement prompts), version 0.3.0 in both manifests. Checks: a decline is replied to and resolved, with no commit demanded; a decline with no reason stops at `shape`; an ask outside the cases stops at `shape`; a human-review pass refuses `decline`; a rule-covered decline is still an ask; autopilot goes through. Red then green: `node tests/loop-test.mjs`, `tests/setup-test.sh`.

**Task 4: the verifier states facts.** `agents/redline-reviewer.md`, the workflow's verifier side (schemas, `reviewPrompt`, `candidatesBlock`, `accountCoverage`, `review()`, `coverageSentence`, `setAsideBlock`, `reviewBody`, `commentBody`, the findings file, the `correctness only` declines). Checks: the six outcomes and the count sentence; a left-out candidate is minted and warned about; a decided finding that still reproduces is in the block; the two reopenings; no posted body in any scenario holds "For the person"; the key phrases; `coverage off` has no candidates block and no accounting. Red then green: `node tests/loop-test.mjs`.

**Task 5: the done rule.** The loop, `revise()`'s return, the no-fix-diff round, the final pass's endings, the cap. Scenarios: a correctness fix buys a round; an ask answered "no change" with no commit buys a round, and the next review has a coverage call and no fix diff; all declined ends at the handoff with no final pass; a declined correctness item beside a fixed nit goes to the final pass, not a full round; an overruled decline buys a round; `coverage off` with no fix ends; the cap past round `maxRounds`; a relaunch still replays every prompt before the stop. Red then green: `node tests/loop-test.mjs`.

**Task 6: the handoff and the overrule.** `handoffComment`, the login forms, the cap comment, the past-tense sentence, the hand-off result's declines, the result's kinds, `skills/redline/SKILL.md`. Checks: every heading of "The handoff, in full" in order, each with its line; autopilot's heading; the no-login fallback; the handoff's sentence is past tense while the warning keeps the launch's; the escaped fields still escape. The folded Fixed block is rendered once through `gh api markdown` with sample text, and the result recorded in the spec. Red then green: `node tests/loop-test.mjs`.

**Task 7: docs.** Docs entries (gate step 10), one per touched file:

| File | Section |
| --- | --- |
| `workflows/redline-loop.js` | `docs/running.md`: Rounds, The coverage pass, Dispositions, The handoff comment, Decided by, Earlier rounds, How the review is posted (the notifications paragraph) |
| `agents/redline-reviewer.md` | `docs/running.md`, "The coverage pass"; `README.md`, Known limits ("What a clean run means", "Each pass is a sample") |
| `agents/redline-shaper.md`, the template | `docs/running.md`, "Dispositions"; `docs/contract.md`, "The unattended section" and "Template version"; `docs/upgrading.md`, the unattended versions |
| `agents/redline-plan-approver.md`, `-resolve.md`, `-github.md`, `-implementer.md` | `docs/running.md`, "Rounds" and "Dispositions" |
| `skills/redline/SKILL.md` | `docs/running.md`, "Hand-off and relaunch" (the two doors, the closing summary); `README.md`, Dials |
| `scripts/redline-gh.sh` | `docs/scripts.md`, its header; `docs/running.md`, "Earlier rounds" |
| `.claude-plugin/*.json` | the descriptions state the done rule; reworded with `README.md`'s opening, the skill's description and `agent-os/product/mission.md` (docs-gate, the done-rule line) |

No new config key, subcommand, allow rule or exit code.

**Task 8: the standards retrospective**, proposed with a question, applied only as approved, in its own commit. Candidates I expect: `workflow/agents.md` (the "returned, never decided" rule, the settled list, the verifier's outcomes, logins in posted text), `workflow/replay.md` (the `coverage off` line), `testing/tests.md` (the key-phrase rule's "absent from a coverage off prompt"), `index.yml` (the agents description).

**Task 9: the Verification Gate and As built.** `.claude/redline/checks.sh --baseline` (steps 1 to 9), Docs (10), Version (11: 0.3.0 in both manifests, marker v4, the frozen v3), the retrospective (12), then `plan.md`'s As built with each deviation under Decisions in `shape.md` (13).

## How this pull request's own review should be run

It is the first real run of the new model and the first real test of #81's pinned relaunch, since most rounds will commit to `workflows/` and `agents/` and the run will stop for decisions.

- **Session:** `claude --plugin-dir <this checkout>`, interactive, in bypass-permissions (under `--plugin-dir`, auto mode refuses the agents' writes, #76; a headless session cannot take a pinned relaunch). The branch pushed and clean.
- **Launch:** `/redline:redline <pr>`, guided, the default cap. Not autopilot: the stops are what is being tested. The run is this branch's own loop, verifier and shaper, so expect more items than any earlier self-review.
- **At each stop:** answer the calls; overrule one decline with a typed line to exercise door 1; type `relaunch`.
- **Before each relaunch** the skill runs `redline-prefs.sh run drift`. Expected once a round has committed to `workflows/redline-loop.js`: `scriptPath`, the copy the harness kept at launch, and the line naming the changed agent files.
- **Record** (in `redline-internal`, not here), per relaunch:
  1. what `run drift` printed;
  2. whether Claude Code asked to review the script (expected: no prompt in bypass-permissions; not measured before);
  3. the first agent label that ran: it should be the one after the stop, with no earlier label rerun, no review skipped as already posted, and the round numbers continuing;
  4. at the end, that the round Finish finished from is GitHub's highest, and that the handoff's agent-files sentence names the files;
  5. whether a round after an agent-file change behaved by the new text (the mid-session reload nobody has measured).
- **If `run drift` says `refuse`** (the first launch fell back to the script path), start a fresh run; it carries the open findings forward.
- **If a relaunch reruns a posted round,** stop it there, keep the run record, and finish with a fresh run. A `done` that reports fewer rounds than are posted is now refused by Finish; do not work around it.
- **The pinned script is the launch's:** a fix a round makes to the loop does not run until the next run. If the rounds changed the done rule or the handoff, a short fresh run afterwards exercises them.
- **Guard, hook and gate-stamp findings** are deferred by point 11, as always; a person changes those files after the run.
- **After the handoff,** door 2 can be tried once: reply in a declined thread, then `/redline-revise <pr> review @<login>`.

## After the gate (the owner's)

- The two measurements in #93's Done-when, on throwaway pull requests with the exposure audit.
- A `/redline:setup` rerun in each repository that uses Redline, to carry the v4 section.
- The tag and the `CHANGELOG.md` entry after the merge.
- Opening the follow-up issue. Draft:

  > **A round's thread replies arrive as one notification**
  >
  > **Why.** Since #93 every item Redline decides has a thread, and each reply is its own REST call, so a subscribed teammate gets one notification per reply: about thirteen in a round.
  >
  > **What GitHub allows.** The GraphQL mutation `addPullRequestReviewThreadReply` takes `pullRequestReviewId`, the pending review the reply belongs to. A round's replies can sit in one pending review that is submitted once, as "Start a review" does in the browser.
  >
  > **Change.** `redline-gh.sh` gains a batch reply (open a pending review, add each thread reply, submit once), and the GitHub agent posts a round's thread replies through it. Rows in `tests/guard-cases.tsv`; the guard script itself needs no change, since the GitHub agent's group passes every subcommand.
  >
  > **To settle.** GitHub allows one pending review per user per pull request, and Redline posts as the person running it, so a draft review they left open blocks the batch: it needs a fallback to one call each. A submit that fails leaves a pending review to remove. Replies to items in the review body are issue comments and stay one notification each. The reply ids the thread sweep needs must still come back.
  >
  > **Done when.** A round with several replies is measured on a throwaway pull request to notify a subscriber once, and a run with a draft review open still posts every reply.

## Verification

- Per slice: the harness named in its task, red first, then green (`node tests/loop-test.mjs`, `tests/gh-test.sh`, `tests/setup-test.sh`).
- At the end: `.claude/redline/checks.sh --baseline` exits 0 with all nine checks green; `claude plugin validate .`; `scripts/redline-setup.sh version .` reports the section and the template both at v4; `scripts/redline-gate.sh check` still passes, since the gate's backticked text did not move.
- Against #93's Done-when, in the loop test: no posted review or handoff holds a For the person section; every item of every scenario ends with a disposition and a reason; an ask outside the cases cannot reach the person; autopilot never stops; a relaunch replays.
- The real-run checks are the owner's two measurements and this pull request's own review, above.

## Standards applied

All ten: `workflow/agents`, `workflow/replay`, `testing/tests`, `scripts/bash-conventions`, `scripts/guard` (to confirm nothing here needs it), `process/docs-gate`, `process/release`, `process/internal-notes`, `process/standards-retrospective`, `prompts/attribution`.

## As built

Built 2026-11-13, one slice per commit, each commit made by the owner.

**The gate.** `.claude/redline/checks.sh --baseline` exits 0 with all nine checks green: guard 594 passed, 0 mismatched; loop 828 checks passed, 0 failed (725 before this spec); prefs 121; gate 117; setup 470; gh 131; background 39. `claude plugin validate .` passes with the known icon warning. `scripts/redline-gate.sh check .` reports a match, since the gate's backticked text did not move. `scripts/redline-setup.sh version .` reports the template and this repository's section both at v4.

**The slices, red then green.**

| Commit | Slice | Harness, red then green |
| --- | --- | --- |
| `33de20a` | Task 1, the spec folder | none (documents) |
| `bf03333` | Task 2, the reader of earlier rounds | `tests/gh-test.sh`: 124 passed, 6 failed; then 131 passed, 0 failed |
| `d29c9a8` | Task 3, the shaper decides | `node tests/loop-test.mjs`: 741 passed, 22 failed; then 765, 0. `tests/setup-test.sh`: 468 passed, 1 failed; then 470, 0 |
| `6b4b6c3` | Task 4, the verifier states facts | `node tests/loop-test.mjs`: 724 passed, 49 failed; then 778, 0 |
| `b4e08d7` | Task 5, the done rule | `node tests/loop-test.mjs`: 798 passed, 14 failed; then 813, 0 |
| `471d481` | Task 6, the handoff and the overrule | `node tests/loop-test.mjs`: 797 passed, 29 failed; then 828, 0 |
| `a041969` | Task 7, docs | none changed; setup 470, loop 828 stay green |
| `8f5fd84` | Task 8, the standards retrospective | none reads the standards |

The checks written after their code (the unconfirmed finding with nothing to confirm it, the accounting counted by a finding's own confidence, the rule over every scenario) and every clause of the done rule were seen red under a mutation of the clause they pin.

**Deviations from the plan above.** Each is recorded under Decisions in `shape.md`, with its reason: two questions asked while building (a finding on one of Redline's own files stays an ask with its own reason; after a human-review pass the final nit pass's line gives counts), and the deviations listed there for Tasks 3 to 6.

### Docs (gate step 10)

| File | Section | Commit |
| --- | --- | --- |
| `workflows/redline-loop.js` | `docs/running.md`: Rounds, The coverage pass, Dispositions, Overruling a decline, Hand-off and relaunch, The handoff comment, Decided by, Earlier rounds, How the review is posted | `a041969` |
| `agents/redline-reviewer.md` | `docs/running.md`, "The coverage pass"; `README.md`, Known limits ("What a clean run means", "Each coverage pass is a sample") | `a041969` |
| `agents/redline-shaper.md`, `templates/shape-spec-unattended.md`, `templates/history/shape-spec-unattended.v3.md` | `docs/running.md`, "Dispositions"; `docs/contract.md`, "The unattended section" and "Template version"; `docs/upgrading.md`, "Unattended section versions" | `a041969` |
| `agents/redline-plan-approver.md`, `agents/redline-resolve.md`, `agents/redline-github.md`, `agents/redline-implementer.md` | `docs/running.md`, "Rounds" and "Dispositions" | `a041969` |
| `skills/redline/SKILL.md` | `docs/running.md`, "Hand-off and relaunch" and "Overruling a decline"; `README.md`, Dials | `a041969` |
| `scripts/redline-gh.sh` | `docs/scripts.md`, its header (`bf03333`); `docs/running.md`, "Earlier rounds" (`a041969`) | as named |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | the descriptions state the done rule and were reworded with the README's opening, the skill's description and `agent-os/product/mission.md` (`a041969`); the version itself has no reader-facing change beyond the number, and the `CHANGELOG.md` entry is the owner's step after the merge | `a041969` |

No new config key, subcommand, allow rule or exit code. Two notes were added to Known limits in `README.md`: a decline is Redline's judgment, and a subscribed teammate gets one notification per reply.

### Version (gate step 11)

0.3.0 in `.claude-plugin/plugin.json` and in the marketplace entry (`d29c9a8`), a minor bump: the unattended section's body changed, so a setup rerun carries it. The marker is `<!-- redline-unattended: v4 -->`, the previous body is frozen as `templates/history/shape-spec-unattended.v3.md`, and its hash and the v4 hash are pinned in `tests/setup-test.sh`.

### Standards retrospective (gate step 12)

Fourteen edits, approved by the owner and applied in their own commit, `8f5fd84`. The list is under "Standards retrospective" in `shape.md`.

### Left to the owner

As "After the gate" above says: the two measurements, this pull request's own review, a `/redline:setup` rerun in each repository that uses Redline, the follow-up issue on one notification per round, and the tag and changelog after the merge.
