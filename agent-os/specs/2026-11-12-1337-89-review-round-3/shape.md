# PR #89 review round 3: the inline link's cost, the rule branch's pin and the backslash trigger: Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The three findings of Redline round 3 on PR #89 (issue #87), and nothing more. All three are nits. The round has no correctness finding, so this is the final nit round, and the plan covers the nits only. The round reviewed the whole pull request at `0e4a537`, which is the working tree's HEAD; line numbers here are at that commit.

- **R3-1** (nit, low, confirmed): `README.md:106`. Known limits names a bare URL's broken link as a cost of neutralised text, but not an inline link whose destination holds `@x`, which the #87 follow-up spec's Evidence recorded.
- **R3-2** (nit, low, confirmed): `tests/loop-test.mjs:1751`. The handoff's Deferred line has two `postedText` calls, and no check pins an escaped title on the repository-rule branch (`workflows/redline-loop.js:2967`).
- **R3-3** (nit, low, confirmed, needs a decision): `workflows/redline-loop.js:965`. Any backslash escapes the whole text, so a line that names a PHP namespace shows entities inside its code spans. Decided by the person: narrow the trigger to a backslash before a backtick (Decision 3, plan Task 4).

The round's For the person lines (a fence after a newline, old titles holding other entities, a title's open backtick before raw text, cross-repository references, reading titles from the committed record) are not findings and are not in scope. The `redline/` subfolder is Redline's own record and is untouched. The invoking prompt lists no repository ask rules.

## Decisions

1. **R3-1: fix, name the inline link's cost in both places.** README Known limits gains one cost line after the bare-URL line (line 106), and the "What is escaped and neutralised (#87)" bullet in `docs/running.md` (line 137) gains one sentence after its bare-URL sentence. Both say that an inline link whose destination holds `@x` keeps its text, but its href gets the joiner after the `@` (`%E2%81%A0`), so the link looks right and leads to another page. That is the reviewer's proposed fix. Plan Task 2.
   Decided by: redline
2. **R3-2: fix, pin the rule branch with a title the function changes.** Section 12 of `tests/loop-test.mjs` gains one autopilot run whose R1-2 title is `Field <b> renamed @config`, and one check that pins its Deferred line as the workflow writes it. It is proven red by removing `postedText` from line 2967 for one gate run, then restoring the line byte for byte. The commit carries the test file only. That is the reviewer's proposed fix, minus the optional cap-comment pin (Unattended answer 3). Plan Task 3.
   Decided by: redline
3. **R3-3: Any backslash escapes a whole line, so a namespaced finding shows entities inside its code spans. Decided: Full fix: narrow to a backslash before a backtick.** The author narrows the whole-text trigger to a backslash directly before a backtick, keeping the carriage return, newline and link triggers, because nine texts rendered on 2026-11-12 through a scratch copy of postedText with the backslash trigger narrowed that way (`gh api markdown`, gfm, this repository as context, nothing posted) showed that no other backslash changed which backticks GitHub paired, that the spans matched textParts one for one and matched the unescaped controls, and that no raw tag or mention came through; the one cosmetic case left, a typed backslash before `<` or `&` outside code showing the entity text (`\<b>` reads `&lt;b>`) as it did before, goes in README Known limits. Plan Task 4.
   - **Why it was the person's:** spec assumption. Narrowing changes a rule the #87 brief set (its decision 5), weighed against a cost that spec did not record (Unattended answer 4).
   - **Story, as the shaper wrote it:** A finding on a Laravel repository is titled ``App\Models\User::save drops `<x-slot>` when `$a && $b` ``. The title holds a backslash, so Redline escapes the whole line, code spans included. The review body and the handoff then show `&lt;x-slot>` and `$a &amp;&amp; $b` inside the code, and a span holding `@csrf` reads `@&#8288;csrf`. Nothing leaks and nobody is notified, but the line reads wrong, and namespaces are common in this kind of text. Before this PR, only a newline or a backslash directly before a backtick caused this. A backslash before a backtick is the only kind that changes how GitHub pairs backticks. Your #87 brief chose any backslash (decision 5), and README Known limits names the cost in general terms. But no recorded answer weighed how often a namespace would trigger it, as answer 15 did for `[`.
   - **Options, as the shaper wrote them:**
     1. **Full fix: narrow to a backslash before a backtick.** Cost: Changes one regex and its docblock in workflows/redline-loop.js, about four loop-test lines (re-pin case 14 as a namespaced text, add a check for case 6, add a round-trip mode), two doc sentences and two standards lines. It commits workflows/ inside this self-review run, so a later relaunch meets #81. The claim that other backslashes do not change pairing comes from CommonMark's rules, not a render. No Redline role may run gh, so the renderer check is yours, by hand. Effect: Namespaced lines keep their code spans as written. A backslash before a backtick, a newline, a carriage return and the link triggers still escape the whole text.
     2. **Mitigate: keep any backslash and name the namespace case.** Cost: One clause each in README Known limits (the code-span cost line) and docs/running.md (after the trigger list). No code, test or standards change, and no #81 exposure. Effect: The display stays as it is. A reader who sees entities in a namespaced line's spans finds the reason in Known limits.
     3. **Accept as is.** Cost: None. Effect: README Known limits already names the cost of a text escaped whole, and docs/running.md lists the backslash trigger. The namespace case itself is not named.
   - **The shaper's recommendation:** Mitigate: keep any backslash in this PR and name the namespace case in README Known limits and docs/running.md. If you want the spans back, narrow the trigger in its own PR, where it can be rendered and does not commit workflows/ inside a self-review run.
   - **What it supersedes:** the backslash trigger of the #87 spec's decision 5 (`agent-os/specs/2026-11-12-0948-87-posted-text-mentions-and-escaping/shape.md:43`) and the backslash in its answer 15's "Decision 5's carriage return, backslash and newline triggers stay" (line 63). A backslash directly before a backtick stays a trigger, as on the base, and so do the carriage return, the newline, `](`, `][`, `://` and `www.`.
   - **Docs:** Task 4 commits `workflows/redline-loop.js`, so its Docs entry names `docs/running.md`, "How the review is posted", the "What is escaped and neutralised (#87)" bullet, and README Known limits, both updated in the same commit.
   - **Run caution (#81):** Task 4's commit carries `workflows/redline-loop.js`, the cost the chosen option named, so a relaunch after that commit replays a round-edited workflow.
   - **Date:** 2026-11-12.

   Decided by: @michaelfromtheoutfit
4. **No version change.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` read `0.2.3`, and `main` reads `0.2.2` (`git show main:.claude-plugin/plugin.json`). So this PR already carries its bump. This round changes no file a setup rerun writes (`process/release`, first bullet).
   Decided by: redline
5. **Docs.** Task 2 is itself a README and `docs/` edit, which needs no Docs entry of its own (`process/docs-gate`, the `docs/` bullet). Task 3 commits `tests/loop-test.mjs` only, which is in no directory gate step 10 lists. `workflows/redline-loop.js` changes only for the red run and ends the task unchanged, so it needs no entry. No config key, subcommand, allow rule or exit code is added.
   Decided by: redline
6. **As built: the standards commit names R3-3.** Its message is `redline: record the round 3 review lessons in the standards, finishing R3-3 (#87)`, where `plan.md` Task 5, step 12, gave it without the finding. Retrospective item 3's two edits are part of R3-3's fix (Decision 3's option counts "two standards lines" in its cost, and Proportionality counts them in R3-3's change), so R3-3's reply names both of its commits. Items 1 and 2 are lessons only and name no finding. Recorded in `plan.md`, As built.
   Decided by: redline

### Proportionality

All three are nits, so the rule for correctness findings does not apply. For the record:

- **R3-1:** two lines of prose, one in `README.md` and one in `docs/running.md`. Both files are in the PR's diff, and no harness reads either one (`grep -n -e README -e running.md tests/*.sh tests/*.mjs` finds only a fixture string in `tests/gh-test.sh:278`).
- **R3-2:** five lines in `tests/loop-test.mjs`, which is in the PR's diff: a three-line comment, one `go()` run and one check. No other file is committed. The temporary edit of `workflows/redline-loop.js` is one line, restored before the commit.
- **R3-3:** decided by the person (Decision 3): the narrowing. It costs a regular expression and its docblock in `workflows/redline-loop.js`, five changed or added test lines and a reworded comment in `tests/loop-test.mjs`, one sentence changed and one added in `docs/running.md`, one README line become two, and two standards edits (retrospective item 3). It also commits `workflows/` in a self-review (#81). See Task 4 in `plan.md`.

## Unattended answers

1. **Is R3-1 real?** Yes, confirmed by reading the code and the recorded render.
   - `textParts` (`workflows/redline-loop.js:965`) returns any text holding `](` as one part, escaped whole. In that part, `postedText` (line 939) puts `&#8288;` after every `@` before an ASCII letter or digit, link destinations included.
   - The #87 follow-up spec's Evidence table (`agent-os/specs/2026-11-12-1310-87-joiner-reference-and-closing-line/shape.md:96`) records the render: "link destination: `[a](https://x.com/@&#8288;click)` | href `https://x.com/@%E2%81%A0click`". So GitHub decodes the reference there and the href changes.
   - README Known limits line 106 and `docs/running.md:137` name only the bare URL. `grep -c 'E2%81%A0'` and `grep -c -i 'inline link'` print `0` for both files.
   - The same Evidence section says why the reference protects nothing in a URL: "A raw `@` inside a bare URL is never a mention". A link destination is not rendered text, so no mention can form there either.

   Decided by: redline
2. **Is R3-2 real?** Yes, confirmed by reading both branches and every pin of the line.
   - The two branches are `workflows/redline-loop.js:2967`, the `d.rule` branch (`left to you under repository rule`), and line 2968 (`shipped`), each with its own `postedText(d.title)`.
   - `grep -n 'Deferred (mitigated now' tests/loop-test.mjs` finds one check, line 1045, the section 12 autopilot case. It pins `title R1-2` and `title R1-3`. `postedText` returns those unchanged (no `&`, `<`, `@` or trigger), so the line reads the same with or without the call.
   - Section 16's check at line 1751 pins only the `shipped` branch (`Deferred @` + `WJ` + `csrf &lt;i> check: shipped a <b> guard`).
   - The `titled` run at line 1036 is guided, so its handoff has no Deferred section. Line 1030 asserts `!handoff.includes('### Deferred')` for the guided relaunch, which has the same arguments.
   - `docs/running.md:127` lists the Deferred line as escaped.
   - The shaper's guard refuses interpreters (`scripts/guard`, line 6), so the loop test was not run here. The reviewer could not run it either, as its finding says. The trace turns on one template literal and one check's input, so it settles the finding. The plan's red run is the implementer's.

   Decided by: redline
3. **Does the round also pin the cap comment's Still open line?** No. The reviewer offers it as optional.
   - `capComment` (`workflows/redline-loop.js:3054-3064`) builds its list with `open.map(findingLine)`. `findingLine` (line 820) is the same function the review body's finding line uses, and section 16 pins that at line 1743 with an escaped title.
   - The cap comment has no `postedText` call of its own. The rule `testing/tests` line 13 states, pin a fix at a second call site, asks for a second call site, and this is the same one.
   - The finding's broader remark, that no capped scenario pins the cap comment's body, is outside this finding's question, which is the posted title.

   Decided by: redline
4. **Does the PR, the original spec or the code already answer R3-3?** They state the rule. They do not weigh the cost the finding raises, so the question stands.
   - The #87 spec's decision 5, from the brief (`agent-os/specs/2026-11-12-0948-87-posted-text-mentions-and-escaping/shape.md:43`): "A code span is left as written only when the text holds none of `[`, a carriage return, a backslash or a newline; otherwise the whole text is escaped." Answer 15 (line 63) replaced `[` and kept the rest: "Decision 5's carriage return, backslash and newline triggers stay."
   - The PR description says the same: "A code span is left as written unless the text holds `](`, `][`, `://`, `www.` (any case), a backslash, a carriage return or a newline." The code matches it (`textParts`, line 965, `[\r\n\\]`) and so does its docblock (line 961). So there is no disagreement between the code and the stated rule to fix.
   - What no evidence answers is the trade-off the finding raises. Answer 15 dropped `[` because "`[` is common in code talk (`$a[0]`, `[data-x]`), so triggering on it would escape most lines whole and show entities inside their code spans". No recorded answer weighs how often a backslash appears in the same kind of text, as in a PHP namespace. The Evidence (shape.md, lines 139 and 147) rendered backslashes only before `<`, `&` and `@`, outside spans.
   - The base's rule was a newline or a backslash directly before a backtick (`git show main:workflows/redline-loop.js`, line 917, `/\n|\\`/`). The #87 spec superseded it on purpose (shape.md:235).
   - Narrowing would change a rule the person set in the brief, for a reason that spec did not record. Rule 1 of the unattended section makes that the person's call, and the reviewer marked it `needsDecision`. It is returned as R3-3's judgment call, with no default implemented.
5. **Is any of the three already tracked?** No.
   - `scripts/redline-gh.sh issues-search` for "backslash", "link", "Deferred", "postedText" and "namespace" returns no open issue covering any of them. The only hits are #87 itself (this PR's issue), #50, #21, #2, #1 and #66, none about posted text.
   - #88, the #87 follow-up, covers comment descriptions, proposed fixes, replies and the newline hazard, not these.
   - This PR's earlier round folders (`agent-os/specs/2026-11-12-1044-89-review-round-1/`, `-round-2/redline/handoff.md`) hold R1-1 only and no round 2 finding. Their For the person lines and the follow-up spec's "Seen and left" do not name any of the three.

   Decided by: redline
6. **Visuals, references, product context.**
   - **Visuals:** none.
   - **References:** see `references.md`.
   - **Product context:** `agent-os/product/mission.md`, "Honest about its reach", ties a clean run's claims to README Known limits. R3-1 adds a cost to that list. No conflict, no mission edit.

   Decided by: redline
7. **What carries the red run for R3-2?** A temporary edit of `workflows/redline-loop.js` line 2967, restored byte for byte before the commit. That is PR #86 round 5's pattern (`agent-os/specs/2026-11-11-1952-86-review-round-5/plan.md`, Task 2: "It changes **temporarily**, for the red run below, and is restored byte for byte before the commit"). The new check pins behaviour the code already has, so only a mutation can show it red (`testing/tests`, line 28). The commit leaves `workflows/` untouched, so a relaunch is not exposed to #81.
   Decided by: redline

## Deferred

None.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "Honest about its reach" (Unattended answer 6).
- **Run caution (#81): noted for the person, not a decision and not a finding.** #81 is open: "Self-review: a relaunch runs the workflow and agents as the run's own rounds edited them". Tasks 2 and 3 commit `README.md`, `docs/running.md` and `tests/loop-test.mjs` only. Task 3's edit of `workflows/redline-loop.js` is restored before its commit. R3-3's decision (Decision 3) commits `workflows/redline-loop.js` in Task 4, so a relaunch after that commit replays a round-edited workflow (Task 4 in `plan.md` says so).
- **The PR description: noted for the person, not a task.** "For the reviewer", "Gate:" says the loop test passes 676 checks; after this round it is 680. "Known costs" names the bare URL and not the inline link. Its trigger list ("a backslash, a carriage return or a newline") reads "a backslash before a backtick" after Task 4. The round writes no `pr-body.md`, as round 1 wrote none. The author can correct all three by hand.

## Standards Applied

- `testing/tests`:
  - escaped text is pinned as the string the workflow writes, one case per way the reading can go wrong (line 10; R3-2);
  - a fix is pinned at a second call site (line 13; R3-2, and Unattended answer 3);
  - a check's name states only what it asserts (line 25; the new check's name);
  - red before green (line 28; the mutation red run);
  - a claim about what GitHub shows is checked once through the renderer and recorded in the spec (line 10; R3-1 cites the follow-up spec's recorded render, and R3-3's narrowing cites the person's render, recorded in Decision 3).
- `process/docs-gate`: README and `docs/` edits need no Docs entry; a file touched only for a red run and restored needs none (Decision 5).
- `process/release`: no version change in this round (Decision 4).
- `workflow/agents`, line 39: the trigger list R3-3's narrowing rewords (retrospective item 3, drafted).
- `scripts/guard`: every command the plan gives the implementer is a plain pipeline, with no `$`, no backticks, no process substitution and no interpreter.
- `process/standards-retrospective`: the proposed list below.
- `prompts/attribution`: no model or vendor name in the spec, the code or the commits.

## Standards retrospective (proposed)

Listed mechanically from the Decisions and Unattended answers above.

1. **Decision 2 (R3-2): missing, a sentence added to `agent-os/standards/testing/tests.md` line 13.** The bullet asks for a second call site. It does not say that a call site pinned only with input the function leaves unchanged is not pinned, and that is how the rule branch stayed unpinned. Append to the end of line 13, after "(#43, R1-1)":

   > ; and a call site pinned only with input the function returns unchanged is not pinned: the handoff's Deferred line under a repository rule was checked with `title R1-2`, which `postedText` returns as it is, so dropping the call there stayed green until a title with a tag and an `@` was pinned (#89, R3-2)

2. **Decision 1 (R3-1): missing, one bullet added at the end of `agent-os/standards/process/docs-gate.md`.** Nothing says that a cost a spec's renderer Evidence records reaches README Known limits. The follow-up spec recorded the inline link's href and the README named only the bare URL. Drafted:

   > - A cost a spec's renderer Evidence records (a link that breaks, an entity that shows) is named in README Known limits in the same PR, each Evidence row read against the costs list before the docs are written: the #87 follow-up spec recorded an inline link's href taking the joiner, and Known limits named only the bare URL until #89, R3-1

3. **Decision 3 (R3-3): outdated, the trigger list narrowed in two standards.** The person narrowed the trigger (Decision 3), so both standards that state it would be wrong after Task 4. Drafted by the resolve agent after the decision:
   - `agent-os/standards/workflow/agents.md` line 39. Replace
     > unless the text holds `](`, `][`, `://`, `www.` (any case), a backslash, a carriage return or a newline; such a text is escaped whole.

     with
     > unless the text holds `](`, `][`, `://`, `www.` (any case), a backslash before a backtick, a carriage return or a newline; such a text is escaped whole, and a backslash anywhere else, as in a namespace, changes no pairing and is no trigger (#89, R3-3).
   - `agent-os/standards/testing/tests.md` line 10. Replace
     > each trigger of the whole-text rule (`](`, `][`, `://`, `www.` in any case, a carriage return, a backslash), with `[` alone as the neighbour that keeps its spans;

     with
     > each trigger of the whole-text rule (`](`, `][`, `://`, `www.` in any case, a carriage return, a backslash before a backtick), with `[` alone and a namespaced text's backslash as the neighbours that keep their spans (#89, R3-3);
4. **Decision 4 (version): already in a standard.** `agent-os/standards/process/release.md`, first bullet.
5. **Decision 5 (Docs): already in a standard.** `agent-os/standards/process/docs-gate.md`, the first bullet and the `docs/` bullet.
6. **Unattended answer 3 (the cap comment): already in a standard.** `testing/tests.md` line 13 asks for a second call site, and the cap comment shares the first.
7. **Unattended answer 7 (the temporary mutation): already in a standard.** `testing/tests.md` line 28 (red before green); the pattern is PR #86 round 5's Task 2.
8. **No pattern invented.** The plan uses no pattern outside `agent-os/standards/`.

If the standards approver approves none of items 1, 2 and 3, the implementer records "Standards retrospective: no changes" under Decisions here at the gate.
