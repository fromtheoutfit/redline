# Template v6: option ends, instance or class, a rule call the person defers (#105, #75, #126)

## Context

Three open issues change the body of the unattended section, so they ride one template version (v5 to v6, plugin 0.4.5 to 0.5.0).

- **#105.** The shaper's schema requires `files` on every finding and its agent file shows it, but point 10 of the template shows it on none. Its comment adds the per-option disposition the #99 spec noted and left out: the shaper states what each option of a judgment call ends in before anyone decides, and the workflow holds the resolve agent's statement to the picked option's.
- **#75.** The shaper fixes each finding as reported and never asks whether the cause is one place. #112 hit the round cap on two classes fixed one instance a round (evidence in the Nov 20 comment).
- **#126.** A finding a repository ask rule covers ends `left to the person` whatever the answer, so a person who answers "defer it" gets no issue filed (`loser` #839, R1-3, filed by hand as `loser` #843).

The decisions given with the brief, the answers, what the design settled, the four class tables and how each was built are in `shape.md`. This file is the build: the design, the tasks, the Docs entries and, once built, what was built.

## Design

### The fields

| Who states it | Field | Checked by the workflow against | Judgement left to an agent |
|---|---|---|---|
| Shaper, on each `fix` of a Redline round | `cause: {where, outcome, why}`; `swept: [{member, found}]` for a sweep | presence on every fix; `where` a path inside the repository (`repoPath`); `one-place`: `where` is among the finding's own `files`; `sweep`: `swept` present and not empty; never `instance` under a standing link | plan approver: the cause is where the shaper says, `instance` is true, a sweep's table in `shape.md` was measured by running and is complete |
| Shaper, on each option of each call, both passes | `ends` (`fix`, `defer`, `accept`); `draft` on a left call's defer option | the schema's enum; labels unique; a left call's draft complete | none: the end is the contract the dial shows |
| Shaper, on each call | `recommended`, an option's label | names one of the call's options | none |
| Verifier, on a finding, in a review that is shown earlier findings | `sameClassAs`, earlier ids | each id is recorded as `fixed`: `outcomeKinds` of an earlier round of this run, or `disposition` of the pull request's `prior-findings` entry; others cleared with a warning before the review is posted | verifier: that two findings are one class |
| Skill, on a decision | `option`, the picked option's label | names an option of the call; never beside `disposition` | none: recorded for a pick in the question or the label typed as written, and said back |
| Workflow, on its own copy of a decision | `disposition`, from the picked option's `ends`, or from the call's `recommended` option on autopilot | the three record checks a named disposition already has | none |
| Resolve agent | `decided`, for a call answered in the person's own words only | the same resolve's tasks and entries (#99) | resolve agent: what a free-text answer ends in, as today |

### What the workflow does (`workflows/redline-loop.js`)

- **Shape.** `judgmentCallSchema` requires `ends` and `recommended`; a Redline round's finding schema gains `cause`. Two checks join `vetShape` after `forceAskRules` and the path cleanup: `checkOptions` (both passes) and `checkCauses` (a Redline round; a finding the person or autopilot decided is skipped on a reshape, as `checkDrafts` skips it). All six Return sentences ask for the new fields; a human pass's ask for the options' only.
- **The forcing point.** The call the workflow writes carries `ends` on its two options and `recommended`; when the shaper had deferred the finding with a complete draft, a third option, "Defer to an issue", carries it and is the recommended one.
- **A pick.** In `resolveWith`, a decision that carries `option` takes its `disposition` from that option's `ends`. `asked` already leaves out a decision that names its disposition, so no statement is asked, and the calls block says so in one sentence, present only when a decision in it carries `option`. A resolve with overrides and no call keeps its prompt byte for byte.
- **A left finding.** `resolveWith` keeps `defer` on its decision and drops any other disposition; `named` includes it, so a deferral with no entry stops at resolve; its entry is no longer filtered. `isDeferral` reads a left finding as a deferral when its decision ends in defer, by its own disposition or by what was stated (row 21), and never otherwise. `effectiveDispositions` gains the one clause. `outcomesFor`, `describeOutcome`, `replyBody` and `settleHeld` let a `left` outcome carry `filed`, `dropped` and `held`, closing with the sentences a decided deferral closes with. `threadCandidates` settles a left finding whose draft was filed. `humanSummary` names such a finding once.
- **The link.** A review prompt that carries the history block or the handled block gains one sentence asking for `sameClassAs`, and its schema the key. Before the review is posted each id is honoured or cleared. A round with a standing link gains a block in its shape and reshape prompts naming the earlier findings, each with the `cause` its round recorded when this run recorded one.
- **Not touched:** `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`, `.claude/redline/checks.json`, every script under `scripts/`, `checkSpec` and the spec-status operation (#122, #123), `ruleForPaths` (#118), `draftsOf` and `record.drafts` (#104), the implementer's prompt (#109), `resumeLine` (#121, #124), `prior-findings` (#82), `RESOLVE_SCHEMA`.

## Tasks

The person makes every commit. Each task is one commit; the tasks share files, so the build stops after each with the exact file list and one line on what went red then green. A decision goes in a question, never in the boundary message. Every harness case is seen red before green. Where a `.sh` file changes (Tasks 3 and 5), CI's command runs before the boundary and its output is shown: `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`.

### Task 1: save the spec folder

`agent-os/specs/2026-11-24-1231-105-template-v6-ends-class-rule-defer/`: `plan.md` (this plan), `shape.md` (the decisions, the answers, tables A to D with how each was built, Settled by the design, the judgements named with their agents, For you to open, For you to add), `standards.md`, `references.md`. No visuals.

### Task 2: every option states its end, and a pick travels as the decision's disposition (#105's comment)

- `workflows/redline-loop.js`: the schema; `checkOptions`; the forced call's two ends and `recommended`; intake of `option`; the pick in `resolveWith`; `autopilotDecision`; the calls block's sentence; the options half of the six Return sentences; the human pass's plan-approver sentence; `relaunch.how`.
- `agents/redline-shaper.md` (rules 1, 7, 8, 10 and the example), `agents/redline-resolve.md` (what it receives; a pick is planned as the option reads and states nothing), `agents/redline-plan-approver.md` (point 6; the human pass).
- `skills/redline/SKILL.md`: each option is shown with what it ends in; the recommended one comes from the field; a pick records `option`; nothing else about an answer changes.
- `tests/loop-test.mjs`: the mock's options carry `ends` and `recommended` (scripted per scenario where a case needs another). Cases: the four schemas; a repeated label and a `recommended` that names nothing stop at shape with `ownCheck`; a pick is shown by its end and asked no statement; the case #105's comment names, "Mitigate" (ends `defer`) planned as a full fix with no entry, stops at resolve where today it runs on with `fix` stated; a pick that ends `fix` with no task files and one that ends `accept` beside task files stop; a free-text answer is stated, as today; autopilot's decision carries the recommended option; an `option` that names nothing warns and is stated; `option` beside `disposition` is refused at launch; a human-pass pick; `samePrefix` over a pick's relaunch; key phrases in the three agent files, the skill and `relaunch.how`.
- `docs/running.md` ("A deferral you chose at a call", "Hand-off and relaunch", "Decided by"); `README.md`, Known limits: the consistency-check limit now holds for a free-text answer only.

### Task 3: a rule call the person defers is filed (#126)

- `workflows/redline-loop.js`: the forced call's third option; the draft rules in `checkOptions`; the left-finding changes listed under Design; the resolve prompt's one bullet for a decision that carries `rule` and `disposition: "defer"`, present only then, and worded as the exception to the bullet above it.
- `agents/redline-resolve.md` (a left finding the person deferred: a `Left to the person` task with no files, listed under `## Deferred` with the draft as the call gives it or one it writes, returned with an empty mitigation), `agents/redline-shaper.md` (rule 7: a left call's options and their ends; the defer option's draft), `agents/redline-plan-approver.md` (point 1).
- `skills/redline/SKILL.md`: a left call's defer option is shown with its draft's title; `<id>: defer. <reason>` on a left finding is recorded, `fix` is still refused; any other wording is said back as left with nothing filed and how to defer it; the `done`, `capped` and human-review summaries.
- `tests/loop-test.mjs`: one case per row of table C that changes (7, 9, 10 for defer, 21) and per neighbour that must not (1, 2, 3, 6, 8, 11 to 13, 20): the pick, the draft stop, the filing, the reply, both handoff sections, the thread resolved; a dropped draft stays open and files nothing; `defer at end` holds and then files; a dry run and `defer to spec` write the draft file; an own-file finding; a human pass, named once in its summary; a typed defer on a call with no drafted option, where a resolve that returns no entry stops; autopilot's run ends as today.
- `tests/gh-test.sh` and one fixture set under `tests/gh-fixtures/`: `prior-findings` reads a reply that opens "left to @x under repository rule" and ends "Deferred to #N." as `left`, and the own-file one as `decided`. No script changes.
- `docs/running.md` ("Left to you", "Deferred items", the handoff's sections, the threads line), `docs/contract.md` ("Ask rules").

### Task 4: instance or class (#75)

- `workflows/redline-loop.js`: `cause` in a Redline round's schema; `checkCauses`; the review prompt's sentence and per-call schema; the honouring of each link; the shape and reshape block; the cause half of the round's Return sentences.
- `agents/redline-shaper.md` (rule 3 gains the step, with the three outcomes, what each `found` value means, and that a member neither `holds` nor `fixed` makes the finding a defer or an ask; rule 10 and the example), `agents/redline-plan-approver.md` (point 2: an `instance` whose own plan admits a later input will need the same is a bounce; a sweep with no table, or one traced and not run, is a bounce), `agents/redline-reviewer.md` (`sameClassAs`).
- `tests/loop-test.mjs`: the mock returns a `cause` on every fix (scripted where a case needs another). Cases: the #112 replay, red before the build (an instance fix a round, to the cap) and green as built (`instance` under a link stops at shape with `ownCheck`; `sweep` or `one-place` goes on); a fix with no cause, a `one-place` whose `where` is not in its files, a sweep with no `swept`, a `where` outside the repository, each stopping at shape; a link to a finding of the same round, to a declined one, to a call's applied fix and to an unknown id, each cleared with a warning; a link to an earlier run's `fixed` finding stands; a first round on a pull request with no earlier round keeps its review call byte for byte; a round with no link keeps its shape prompt's block out; a human pass's schema has no `cause`; a decided finding is not held on a reshape; key phrases in the three agent files and each prompt.
- `docs/running.md` (the Shape step, Dispositions).

### Task 5: template v6, and `files` on every finding (#105)

- `templates/shape-spec-unattended.md`: marker v6. Body: the opening paragraph (`sameClassAs`); point 3 (`ends`, `recommended`); point 4's `ask` (a left call's defer option and its draft; the person may defer it and Redline files the draft); point 5 gains "Instance or class" as a bold paragraph, so no point is renumbered and the fill-ins and this repository's own point 11 keep their places; point 10's example (`files` on every finding, `cause` on the fix, `ends` on each option, `recommended`) and its field sentence.
- `templates/history/shape-spec-unattended.v5.md`: today's file, frozen. `tests/setup-test.sh`: v6's pin, and the version comment.
- `.claude/commands/agent-os/shape-spec.md`: by `scripts/redline-setup.sh unattended ... --dry-run` first (fill-ins as read back today: `--gate-steps 1-9 --prose-steps "10, 11, 12 and 13" --retro-step 12 --no-pr-body`), then `--merge`. The three hand edits are kept. A conflict stops the build for a question: the hand-edited `story` line sits two lines above the `options` line.
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`: 0.5.0.
- `tests/loop-test.mjs`: the key phrases Tasks 2 to 4 pinned in the agent files are pinned in the template too.
- `docs/contract.md` ("The unattended section"), `docs/upgrading.md` (v6 in "Unattended section versions"; "A stopped run across 0.5.0").
- Checked, not edited: `scripts/redline-gate.sh check` shows the gate stamp did not move, and `.claude/redline/checks.sh` is byte for byte what it was.

### Task 6: the sweep and the mutations, recorded in the spec folder

- **Sweep**, in the scratchpad: the harness as built, run once under `git show <base>:workflows/redline-loop.js` and once under the workflow as built, hashing every call's label, prompt and options. Expected to differ, and named one by one in As built: every shaper call; a resolve whose block holds a call; the plan approver's and the implementer's prompts where the dispositions carry a `cause` or a picked call; a human pass's plan approver; a review call that is shown earlier findings; the calls of a run in which a left finding was deferred. Expected identical: every gather, post, spec-status, snapshot, checker and Finish call otherwise; a first round's review on a pull request with no earlier round; a resolve with overrides and no call; every resume line. Any other difference stops the build for a question.
- **Mutations**, one per new pin, each seen red, a crash reported as a crash.

### Task 7: Verification Gate

`.claude/redline/checks.sh --baseline` green; each Docs entry below named with its commit; the version step; the standards retrospective put to the person and applied in its own commit, or "no changes" recorded; `plan.md`'s As built, which holds every count.

## Docs entries (gate step 10)

| File | Section it updates |
|---|---|
| `workflows/redline-loop.js` | `docs/running.md` (Shape, Dispositions, "Left to you", "Deferred items", "A deferral you chose at a call", the handoff's sections, the threads line); `docs/contract.md` ("Ask rules"); `README.md` (Known limits) |
| `agents/redline-shaper.md`, `agents/redline-reviewer.md`, `agents/redline-plan-approver.md` | `docs/running.md` (Shape, Approve, Dispositions) |
| `agents/redline-resolve.md` | `docs/running.md` ("A deferral you chose at a call", "Left to you") |
| `skills/redline/SKILL.md` | `docs/running.md` ("Hand-off and relaunch") |
| `templates/shape-spec-unattended.md`, `templates/history/shape-spec-unattended.v5.md` | `docs/contract.md` ("The unattended section"); `docs/upgrading.md` ("Unattended section versions") |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | `docs/upgrading.md` ("A stopped run across 0.5.0") |

New names a reader meets: the decision key `option`; the shaper's `cause`, `ends`, `draft`, `recommended`; the verifier's `sameClassAs`. No new config key, subcommand, allow rule or exit code.

## Recorded in `shape.md`

**For you to open** (drafted in the form of this repository's issues; no open issue covers any, checked against the open list on 2026-11-24):

1. A fix the resolve agent plans (a picked option, an override, a free-text answer) is never asked instance or class, and a `sameClassAs` link cannot name a fix made at a call or a shipped mitigation, since those carry no recorded cause.
2. The cause an earlier run recorded is not in the `prior-findings` record, so a link to an earlier run's finding shows the shaper its id, title, place and reply, never its cause (table D, row 19).
3. A rule call's drafted option stops the round once more for its draft after the person picks it, though the dial already showed it.

**For you to add** (drafted comments; posting is yours):

- #115: a picked option's call is now shown by its end; the issue's case needs a free-text answer.
- #119: a decided deferral that later falls under a rule is filed; a left finding's resolve task is still not checked for files by the workflow.
- #109: a left finding's entry is the third place an entry leaves the workflow's list, with no warning.
- #75: what this pull request shows and what it does not, and the #817 rerun.

**Yours after the build:** every commit; the pull request; its self-review, where a real shaper returns `cause` on every fix; the #817 rerun; the setup rerun in each other repository.

**Not shown by this pull request:** that a real shaper names the right cause, that a real plan approver bounces a sweep that was traced and not run, and that a real verifier links a second instance. The loop's stubs cannot show an agent's judgement.

## Verification

1. Each task's cases, red then green, with the harness that ran them.
2. `.claude/redline/checks.sh --baseline`, all nine commands.
3. CI's shellcheck command before the boundaries of Tasks 3 and 5, its output shown.
4. The sweep and the mutation run of Task 6, with their counts in As built.
5. `scripts/redline-setup.sh unattended --version .claude/commands/agent-os/shape-spec.md` exits 0 at v6, and `git diff` of that file shows the template's changes and the three hand edits kept.

## As built

Filled as each task lands: the commit of each task with what went red then green, the Docs entries with their commits, the sweep, the mutations, and any difference from this plan. Every count goes here.
