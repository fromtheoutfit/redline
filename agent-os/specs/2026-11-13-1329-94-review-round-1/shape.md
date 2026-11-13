# PR #94 review round 1: the verify-then-decide fixes the first review found — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The twenty findings of Redline round 1 on PR #94 (issue #93), and nothing more. The round reviewed the whole pull request at `3d23086`, the start snapshot's `start_sha` and the working tree's HEAD. Line numbers here are at that commit. The `redline/` subfolder is Redline's own record and is untouched. The invoking prompt lists no repository ask rules, and `.claude/redline.json` declares no `askRules`.

Sorted:

- `fix` (16): R1-1, R1-8, R1-10, R1-12, R1-15, R1-20 (correctness); R1-2, R1-3, R1-4, R1-5, R1-6, R1-9, R1-13, R1-16, R1-17, R1-19 (nits).
- `decline` (4): R1-11, R1-7, R1-14, R1-18.
- No `defer`, no `ask`. No finding touches one of Redline's own files (`.claude/redline*.json`, `.claude/settings*.json`, `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`): this repository is the plugin, loaded in place, so `agents/`, `workflows/`, `skills/`, `scripts/redline-gh.sh` and `docs/` are planned like any other file (the shaper's rule 7). No task touches the gate's backticked text, `checks.json`, `checks-template.sh` or anything under `templates/`, so nothing needs a restamp, a regeneration or a version bump.

## Decisions

1. **R1-1: fix.** Every statement that a declined finding is never raised again gains the decline-reopen exception, as the agent file's line 20 and the candidates block already state it: `agents/redline-reviewer.md:22`; the history header in `reviewPrompt` (`workflows/redline-loop.js:1330`), only when the round has candidates, so a `coverage off` prompt keeps its header (the reopen is the candidates block's rule, `agent-os/standards/workflow/replay.md:15`); `README.md:103` (Known limits, "A decline is Redline's judgment"); `docs/running.md:45` ("Why it does not chase nits"). The standard `workflow/agents.md:16` already asks for exactly this search ("found by searching both for the rule's own words (`never re-raise`, ...)"); #93 missed the wording "not raised again". The loop test pins the phrase in the agent file and in a covered fix-diff round's prompt that holds this run's history (`re-review r3` of a run that starts at round 2), and its absence from the `coverage off` twin's. Plan Task 2.
   Decided by: redline
2. **R1-8: fix.** The final nit pass line in `reviewPrompt` (`workflows/redline-loop.js:1361`) says its scope stands over the `FACTS_ONLY` paragraph that follows; `agents/redline-reviewer.md:12` says the same of the final nit pass instruction. `FACTS_ONLY` itself stays one constant, pinned in every review prompt (`tests/loop-test.mjs:1540`). Plan Task 3.
   Decided by: redline
3. **R1-10: fix, by keeping scope-declined items out of the findings file's `findings`, as before #93.** `post()` writes them under their own key, `scoped`, so the record keeps them and `/redline:redline-revise <pr> round <n>`, which reads `findings` only (`skills/redline-revise/SKILL.md:15`), never shapes them. The reviewer's other option, a marker the revise-only path filters on, would change the revise skill (a file outside the pull request's diff) and the revise-only path, for the same effect. Plan Task 4.
   Decided by: redline
4. **R1-12: fix, by building the shaper's output schema per pass (R1-5's own fix).** A Redline round's `why_human` enum is `ROUND_WHY` plus the rule reasons; a human review pass's is `HUMAN_WHY` plus the rule reasons. A shaper that follows a v3 section's point 5 and returns `unsure` on a Redline round is then refused by its structured-output tool inside its own run, and it either decides the finding (fix, decline or defer) or asks under one of the cases, so the stop the finding describes cannot happen; `checkCalls` stays as the second layer. `docs/upgrading.md`, "Unattended section versions (#15)", says what a v3 section does on a 0.3.0 run. The reviewer's other options are not taken (Unattended answer 4). The commit names R1-5 as well. Plan Task 5.
   Decided by: redline
5. **R1-15: fix, by naming the door that works for a finding with no thread.** `redline-gh.sh human-review` takes the person's open review comments and their latest open review body (`scripts/redline-gh.sh:427-436`), so a pull request review whose body names the finding's id reaches the human review pass; an issue comment does not. The overrule line in the handoff (`workflows/redline-loop.js:3193`), `docs/running.md:114`, `README.md:103` and the skill's closing summary (`skills/redline/SKILL.md:240`) say so. Teaching `human-review` to read issue comments that open with a marker is a new ingest path in a script and its fixtures, out of proportion to a documentation gap. Plan Task 6.
   Decided by: redline
6. **R1-20: fix the two false statements; the counting rule stays as the pull request's spec agreed it** (Unattended answer 2). The result note "The last revise pass made no commits" becomes "committed no fix" (`workflows/redline-loop.js:3822`), and the no-fix-diff prompt stops claiming its `git diff` is empty (`workflows/redline-loop.js:1306`): it says the round committed no fix, and that its spec and standards commits are not one. Plan Task 7.
   Decided by: redline
7. **R1-2: fix (second look: unconfirmed).** Whether GitHub reopens a resolved thread when someone replies cannot be read from the repository, and this role posts nothing to test it. The sentence at `docs/running.md:116` is reworded so it holds either way: Finish resolved the thread when the run handed off, and the human review pass reads the reply whatever the thread's resolved state, since `human-review` never reads that state (`scripts/redline-gh.sh:414-418`: an open comment is one not in a Redline review, not a Redline reply, and not answered by a later Redline reply in its thread). A cheap guard that is right whether or not the claim holds is a `fix` (the shaper's rule 3). Plan Task 8.
   Decided by: redline
8. **R1-3: fix.** The rule-tail alternatives in `prior-findings` (`scripts/redline-gh.sh:362`) gain `the author`, which `findingLine` writes on a final nit pass after a human review pass with no login (`workflows/redline-loop.js:190`, `893`); the header (line 35) and its verbatim copy in `docs/scripts.md` (line 45) name it. A new gh fixture, PR 17, pins it. Plan Task 9.
   Decided by: redline
9. **R1-4: fix.** `skills/redline/SKILL.md:190` loses `needsDecision`, which `review()` deletes (`workflows/redline-loop.js:2271`); step 9 (line 97) lists `declined` among the tracked dispositions, as `PRIOR_DISPOSITIONS` does (`workflows/redline-loop.js:86`). Plan Task 10.
   Decided by: redline
10. **R1-5: fix, in Task 5's change.** Task 5 builds the schema per pass, and its commit names R1-5; Task 11 pins the human review pass's side (its enum keeps `HUMAN_WHY` and has no `redline's own file`), the neighbour that must not change. Plan Tasks 5 and 11.
    Decided by: redline
11. **R1-6: fix.** When the review body lists items declined under the scope, the closing sentence adds that those items have no inline comment and no reply (`workflows/redline-loop.js:960`). The sentence stays where it is: it follows the last list and precedes the set-aside block (the #87 follow-up spec, answer 9, quoted in the code at lines 956-958). Plan Task 12.
    Decided by: redline
12. **R1-9: fix, a small refactor.** One helper, `decideRule(pass)`, replaces the three identical `pass.human ? NEVER_DECIDE : NOT_YOURS` uses (`workflows/redline-loop.js:1702`, `1739`, `1815`); `planPrompt` and `reshapePrompt` keep their own text. All four tests hold: no prompt changes, so no check's expectation changes; one file the pull request changed; the three lines are the pull request's own (`git diff main...HEAD` shows each as added); one extraction. Plan Task 13.
    Decided by: redline
13. **R1-13: fix.** The `why_human` test moves out of `checkCalls` into its own check, run after `forceAskRules` on both the shape and the reshape path (`workflows/redline-loop.js:2811-2813`, `2928-2930`), so a rule-covered call whose reason the rule replaces is never refused for the reason it no longer has. The other two tests of `checkCalls` stay before `forceAskRules`, which adds the one call the workflow writes (the comment at lines 2566-2571). Plan Task 14.
    Decided by: redline
14. **R1-16: fix, a small refactor.** One helper, `scopedLine(f)`, replaces the two copies of the scope-declined line (`workflows/redline-loop.js:943`, `3198`), with the comment on why its id is not bold. Both lines are the pull request's own; output byte-identical. Plan Task 15.
    Decided by: redline
15. **R1-17: fix.** The cap-hit comment capitalises the person's label where it starts a sentence (`workflows/redline-loop.js:3306`), so the no-login fallback reads "The person running Redline will pick these up."; a login reads as before. Plan Task 16.
    Decided by: redline
16. **R1-19: fix.** In `threadCandidates`, an earlier thread whose carried finding the scope declined stays open with the reason `declined under the scope` instead of `not settled` (`workflows/redline-loop.js:3410`), which agrees with the handoff's Earlier rounds line. It stays open and gets no reply: a later run without the scope sees the finding fresh (the comment at `workflows/redline-loop.js:938-941`). `docs/running.md:159` says so. Plan Task 17.
    Decided by: redline
17. **R1-11: decline.** The reason is under Declined; the evidence is Unattended answer 3. No task.
    Decided by: redline
18. **R1-7: decline.** The reason is under Declined: the rename fails the small-refactor test that the lines it rewrites are the pull request's own. No task.
    Decided by: redline
19. **R1-14: decline.** The reason is under Declined. No task.
    Decided by: redline
20. **R1-18: decline.** The reason is under Declined: the branch is outside the pull request's diff, so removing it fails the same small-refactor test. No task.
    Decided by: redline
21. **No version change.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` read `0.3.0`; `main` reads `0.2.4` (`git show main:.claude-plugin/plugin.json`). This round changes nothing a setup rerun writes: no template, no allow entry, nothing in `scripts/checks-template.sh` and nothing in the unattended section (`agent-os/standards/process/release.md`, first bullet).
    Decided by: redline
22. **Run caution.** Tasks 2 and 3 change `agents/redline-reviewer.md`. The rest of this run's rounds run under the edit, and the skill names the file (README Known limits, "A self-review that edits an agent file runs its later rounds under the edit"). The edits only add exceptions the prompts already state, so a later round's reviewer reads the same rules more consistently. `workflows/redline-loop.js` changes in most tasks; a relaunch runs the script the run launched with (`agent-os/standards/workflow/replay.md`, the #81 bullet).
    Decided by: redline

### Proportionality (the correctness fixes)

- **R1-1.** Likelihood: any round 2 or later with the coverage pass on, whose history holds a decline for want of confirmation, which #93 makes a normal outcome. Impact: a verifier that follows the unconditional sentence keeps a confirmed bug settled, and the run ends with it unfixed. Cost: one sentence in the agent file, one conditional clause in the prompt, two doc sentences, two loop checks; no file outside the diff.
- **R1-8.** Likelihood: every final nit pass whose reviewer notices a bug the fixes did not introduce. Impact: a finding shaped and possibly fixed in a pass that is never re-reviewed. Cost: one sentence each in the prompt and the agent file, one loop check.
- **R1-10.** Likelihood: a `/redline:redline-revise <pr> round <n>` on a correctness-only round with a nit; a debugging entry point, rarely used. Impact: items the run declined are shaped and fixed, their replies posted behind a marker no review body carries. The base dropped these before the file was written, so the fix puts back what the base did. Cost: one expression in `post()`, one loop check, one doc sentence.
- **R1-12.** Likelihood: every repository that updated the plugin to 0.3.0 and has not rerun `/redline:setup`, on a round with an unconfirmed finding the shaper follows v3 point 5 for. Impact: the round stops at shape, and a resume reruns the same shaper over the same section. Cost: the schema built per pass (two functions replace two constants, two call sites), one loop check here and one in Task 11, one doc sentence.
- **R1-15.** Likelihood: every decline of a finding GitHub could not anchor, which #93 makes common (a cause outside the diff keeps its own place). Impact: the person follows the posted instruction, and nothing happens. Cost: one sentence in four places, two loop expectations updated.
- **R1-20.** Likelihood: a round whose findings are all declined and whose standards approver approves an edit, or any revise pass that reached implement and committed no fix. Impact: a result note and a reviewer prompt that state something false. Cost: two strings and their loop expectations.

## Declined

Each reason below is the sentence posted in the finding's thread.

- **R1-11** (a decline reason posted raw in the handoff): A decline reason is the shaper's text, which this repository posts as written by design (`agent-os/standards/workflow/agents.md:17`: "a comment's description, a reply, a mitigation or a commit subject is posted as written", with every posting role told to backtick each `@` identifier), so escaping one shaper field in one place would split that rule; a rule for free text Redline posts belongs to #88.
- **R1-7** (rename `personLine`): `personLine` and its definition predate this pull request, which only rewrote its comment and removed its other caller, so the rename rewrites lines the pull request did not write and a name the standard `workflow/agents.md:39` cites; it belongs in a follow-up clean-up.
- **R1-14** (one helper for the final-nit-pass wording): The two chains post different sentences for different readers (the handoff's "listed below" with "please look at that commit first", the human pass's summary's "answered in its thread"), so one helper would hold both wordings behind a style switch and remove no branch, and the loop test already pins each wording (`tests/loop-test.mjs:2141-2154`).
- **R1-18** (the unreachable `out of scope (correctness only)` branch): The branch sits at `workflows/redline-loop.js:3442`, outside this pull request's diff, and is harmless where it is, so removing it is not a small refactor this round can make; it belongs with a follow-up clean-up of `earlierRoundsLines`.

## Deferred

None.

## Plan adjustments

The plan approver bounced the first plan with three adjustments (adjustment 1 of at most 2). Each was checked against the code and applied; none changes a disposition or needs a person.

1. **Task 2 (R1-1), the runs the history-header check reads.** The first plan pointed at `fixedR2` and `handledOffR2`, both `review r2`, the first round of a run that starts at `firstRound: 2`. There `history()` (`workflows/redline-loop.js:2138`) has no record yet, so `reviewPrompt` never pushes the header (`workflows/redline-loop.js:1329`), and the `re-review r2` prompts the plan named do not exist. The check now reads `handledR3` and `handledOff` (`tests/loop-test.mjs:1394`, `1397`), the `re-review r3` prompts of the covered run and its `coverage off` twin, which hold round 2's outcome. Only the covered one has candidates, since its `coverage r3` runs (`workflows/redline-loop.js:2232`). The checks sit right after line 1398, where both are in scope, and an absent prompt still reads as `''`.
   Decided by: redline
2. **Task 8 (R1-2), the anchor.** The old anchor began mid-sentence, after "...which is right once the pass has fixed it, " (`docs/running.md:116`), so the replacement made a comma splice. The anchor now takes the leading comma, and the replacement opens with a full stop, so the line ends in two whole sentences. A proof step pins both.
   Decided by: redline
3. **Task 5 (R1-12), the `docs/upgrading.md` sentence.** A shaper whose `unsure` is refused can decide the finding as well as ask, and on a Redline round deciding is the usual result for a finding that is not serious if true (the shaper's rule 3). The sentence now says the shaper either decides the finding (fix, decline or defer) or asks under one of the five cases. Decision 4 and Unattended answer 4 are worded the same way; the disposition is unchanged.
   Decided by: redline

## Unattended answers

1. **Are the confirmed findings real?** Each was traced in the code, at the lines the Decisions cite. The shaper's guard refuses interpreters, so no harness was run here. `/tmp/redlinerepro/reviewer-r1-repro.mjs` is a reproduction from PR #91's round 1 and `/tmp/redlinerepro/reviewer-r1-ReproTest.php` a PHP test from another repository; neither bears on this round, and no scratch test of the shaper's was needed.
   - R1-1: `agents/redline-reviewer.md:22` reads "A finding an earlier round declined, deferred or decided is not raised again." with no exception; line 20 and `workflows/redline-loop.js:1345` and `:1402` state the reopen.
   - R1-8: the final nit pass line (line 1361) is followed by `KINDS` and `FACTS_ONLY` (line 1365), whose "wherever its cause lies" no candidates block reconciles on that pass.
   - R1-10: `post()` writes `findings: reviewOut.findings` (line 2421), and the caller passes `{ ...reviewOut, findings: considered, scoped }` (line 3741), where `considered` holds the scoped items (line 3728); the base filtered them out of `considered` first (`git show main:workflows/redline-loop.js`, lines 3515-3516).
   - R1-12: `checkCalls` throws for a `why_human` outside `ROUND_WHY` on a Redline round (lines 2578-2582); `templates/history/shape-spec-unattended.v3.md:52` tells the shaper to ask with `unsure`; the schema's enum is the union (line 650), so nothing refuses `unsure` before `checkCalls`.
   - R1-15: the line at 3193 offers only the thread; `human-review` reads review comments and review bodies, and issue comments only to find answered bodies (`scripts/redline-gh.sh:410-436`).
   - R1-20: `fixedAny` (line 3816) reads `outcome.fixed`, the items a commit names (line 3090); the note at 3822 says "made no commits"; the prompt at 1306 says the diff "is empty", though its pathspec excludes only `agent-os/specs`.
   - R1-3: line 362's alternatives are `yours`, `left to @<login>` and `left to the person running Redline`; `personLabel` is `the author` on a human review pass with no login (line 190), and `findingLine` writes `left to ${personLabel} under rule` (line 893).
   - R1-4: `skills/redline/SKILL.md:190` lists `needsDecision`; line 97 omits `declined`.
   - R1-5 and R1-13: the enum at line 650; `checkCalls` at 2811 before `forceAskRules` at 2813, and 2928 before 2930.
   - R1-6: the closing sentence at 960 follows the scope-declined list at 943, whose items have no comment and no reply.
   - R1-9: the three exact uses at 1702, 1739 and 1815 are added lines in `git diff main...HEAD`.
   - R1-16: the two copies at 943 and 3198, both added lines.
   - R1-17: line 3306 opens a sentence with `${personLabel}`.
   - R1-19: `threadCandidates` gives an empty kind the reason `not settled` (line 3410); a scope-declined carried finding has `outcomes[newId] = SCOPE_DECLINED` and no `outcomeKinds` entry (line 3742).
   - R1-11, R1-7, R1-14, R1-18: confirmed as stated (R1-7: the definition line is unchanged context in `git diff main...HEAD`; R1-18: `reconcilePrior` builds `carried` from `out.findings`, lines 2365-2380, so a carried id is always a finding of the first round); declined for the reasons under Declined.

   Decided by: redline
2. **R1-20: does the pull request's spec answer whether a standards commit is a fix diff?** Yes, in two places the owner approved. `agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/shape.md:79`: "A fix diff means a commit that names an item; the round's spec and standards commits are not one." And its `plan.md:67`, under the consequences listed for the owner to strike: "**A fix diff means a commit that names an item.** The round's spec and standards commits are not one, so a round whose items were all declined ends at the handoff instead of a final pass over an empty diff." So the round's counting stays as it is, and a standards-only round is not re-reviewed by design. Where the code disagrees with that answer is the finding to fix: the note and the prompt say something untrue about such a round (no commits; an empty diff), and they are reworded to say what the spec means, that no fix was committed.

   Decided by: redline
3. **R1-11: does an earlier spec or standard answer how shaper text is posted?** Yes. `agent-os/standards/workflow/agents.md:17`: "The workflow neutralises the finder's and the verifier's short fields itself, but a comment's description, a reply, a mitigation or a commit subject is posted as written." And the #87 spec (`agent-os/specs/2026-11-12-0948-87-posted-text-mentions-and-escaping/shape.md:91`): "A field before raw text is rendered alone. That covers a title before a decision outcome, a mitigation or a reply." The handoff's own comment says the same of the outcome after the title (`workflows/redline-loop.js:3178-3180`). A decline reason is a new field of that class. `agents/redline-shaper.md:61` carries the backtick sentence. The open issue #88 (found with `redline-gh.sh issues-search "reply text"`) is the one about free text Redline posts as written.

   Decided by: redline
4. **R1-12: which of the reviewer's options does the evidence pick?** The precheck is "a warning, never a stop" by #15's design (`skills/redline/SKILL.md:86`; `docs/upgrading.md:25`), so refusing a pre-v4 section would reverse a recorded contract. The workflow has no input that carries the section's version, so a version-aware acceptance needs a new `args` field from the skill. The per-pass schema is R1-5's proposed fix, stays inside the workflow, and removes the stop: the shaper's own structured-output call refuses the value, and the shaper, in the same run, either decides the finding or asks with an allowed reason.

   Decided by: redline
5. **R1-15: does the review-body door exist today?** Yes. `human-review` with `@<login>` takes that login's open review comments and its latest review body not already answered (`scripts/redline-gh.sh:427-436`, `$with_body`), and the human review pass turns a body into a finding like a comment. So the fix is documentation of a door that works, and the pull request's decision 7 ("a reply in the decline's thread followed by the human-review pass over the person's own login") is kept: the review body is the same pass over the same login.

   Decided by: redline
6. **Questions Steps 1 to 5 would ask.** Scope: the round's findings (unattended point 6). Visuals: none. References: the code each finding names, and the #91 round 1 spec as the plan's format (`references.md`). Product context: `agent-os/product/mission.md`, read through the #93 spec's Context; nothing here moves it. Standards: those under Standards Applied, read at `3d23086`.

   Decided by: redline

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** N/A beyond the #93 spec's; these findings tighten what that spec built.

## Standards Applied

- workflow/agents — line 16 (a changed rule applied wherever the prompt and the agent file state it; R1-1), line 17 (shaper text posted as written; R1-11), lines 9 and 36 (the cases and the workflow's checks; R1-5, R1-12, R1-13).
- workflow/replay — the `coverage off` bullet: the reopen exception exists only with a candidates block (R1-1).
- testing/tests — a check per changed prompt sentence, pinned in the agent file and both prompts where the rule says so; red before green; a neighbour for each decision that must not change.
- scripts/bash-conventions — `docs/scripts.md` quotes the `redline-gh.sh` header verbatim (R1-3).
- process/docs-gate — one Docs entry per touched plugin file.
- process/release — no bump: nothing a setup rerun writes changes.
- prompts/attribution — no model or vendor name in any commit or spec file.

## Standards retrospective (proposed)

1. **`agent-os/standards/workflow/agents.md`, line 16 (the changed-rule bullet).** After "not only in the sentence the finding quoted", insert:
   > , and every other wording of the same rule (`not raised again`, `raises it again`): #93's decline reopening reached the candidates block and the handled-list header and left the agent file's "is not raised again", the history header, the README's Known limits and `docs/running.md` unconditional until #94, R1-1
2. **`agent-os/standards/workflow/agents.md`, line 36 (the workflow-checks-a-result bullet), and line 9's "the workflow checks it" sentence.** Line 36: replace "and on a Redline round a judgment call's `why_human` must be one of the round's cases (#93)" with:
   > and on a Redline round a judgment call's `why_human` must be one of the round's cases (#93): the shaper's output schema is built per pass, so its enum is that pass's reasons and the rule reasons and a value from the other pass is refused in the shaper's own run, which then decides the finding or asks again with an allowed reason; the workflow's test is the second layer, run after `forceAskRules`, so a call a repository rule covers is judged by the reason the rule gives it (#94, R1-5, R1-12, R1-13)

   Line 9: replace "a judgment call whose `why_human` is outside the round's list stops the run at `shape`" with "a judgment call whose `why_human` is outside the round's list is refused by the shaper's own output schema, and one that reaches the workflow anyway stops the run at `shape`".
