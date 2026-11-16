# PR #94 review round 1: the verify-then-decide fixes the first review found

Spec folder: `agent-os/specs/2026-11-13-1329-94-review-round-1/`

Shaped by Redline in unattended mode, for review round 1 of PR #94 (issue #93), from the round's twenty findings (`redline/round-1-review.json`, `redline/round-1-findings.json`). Corrected once after the plan approver's first bounce (Tasks 2, 5 and 8; `shape.md`, "Plan adjustments").

- `fix`, one task each, in finding order: R1-1 (Task 2), R1-8 (Task 3), R1-10 (Task 4), R1-12 (Task 5), R1-15 (Task 6), R1-20 (Task 7), R1-2 (Task 8), R1-3 (Task 9), R1-4 (Task 10), R1-5 (Task 11), R1-6 (Task 12), R1-9 (Task 13), R1-13 (Task 14), R1-16 (Task 15), R1-17 (Task 16), R1-19 (Task 17).
- `decline`, no task: R1-11, R1-7, R1-14, R1-18. Each reason is under Declined in `shape.md`.
- No `defer` and no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Line numbers are at `3d23086`, the PR head this round reviewed and the working tree's HEAD; each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block. No commit subject holds a bare `@word`.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-13-1329-94-review-round-1/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds a check adds it first and sees it fail on a gate run (`.claude/redline/checks.sh <snapshot>` prints the failing check names), then makes the change and sees it pass. A task that is a refactor (13, 15) is green before and after, with every existing check unchanged.

**Expected counts.** Before this round: loop `828 checks passed, 0 failed`, gh `131 passed, 0 failed`, guard `594 passed, 0 mismatched`, prefs `121`, gate `117`, setup `470`, background `39` (the #93 spec's As built, `agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/plan.md:386`). This round adds about twelve `check()` calls to the loop test (Tasks 2, 3, 4, 5, 7, 11, 12, 14, 16 and 17), plus the run-record checks `go()` adds for each new run that reaches its handoff, and two cases to the gh test (Task 9, so `133 passed`). The other harnesses keep their counts: none reads a file this round changes. The first green gate run's counts are the evidence, recorded under As built.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-13-1329-94-review-round-1/plan.md`
- `agent-os/specs/2026-11-13-1329-94-review-round-1/shape.md`
- `agent-os/specs/2026-11-13-1329-94-review-round-1/standards.md`
- `agent-os/specs/2026-11-13-1329-94-review-round-1/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 1 spec for PR #94 (#93)`

## Task 2: R1-1, say the decline-reopen exception wherever a declined finding is said never to be raised again

`shape.md`, Decision 1.

**Files:**

- `tests/loop-test.mjs`
- `agents/redline-reviewer.md`
- `workflows/redline-loop.js`
- `README.md`
- `docs/running.md`

**Test first (`tests/loop-test.mjs`).** Right after the line `const handledOffR2 = pick(run.calls, 'review r2').prompt` (line 1398), where `handledR3` (line 1394) and `handledOff` (line 1397) are both in scope, add two checks:

1. The agent file states the exception where it says a declined finding is not raised again: `reviewerAgent` (line 22) includes `is not raised again, except one declined because it could not be confirmed`.
2. The history header carries it on a covered round and not on an off one. Use the pair at lines 1393-1397: the `coverage: an earlier run's handled findings on a fix-diff round` run, whose `re-review r3` prompt is `handledR3`, and its off twin, `coverage: off, an earlier run's handled findings on a fix-diff round`, whose `re-review r3` prompt is `handledOff`. Both start at `firstRound: 2`, so round 2 (`review r2`) is the run's first round with an empty history, and `re-review r3` is the first prompt that holds this run's history (round 2's `R2-1`, from `history()` at `workflows/redline-loop.js:2138`); only the covered run has a candidates block there, since its `coverage r3` runs. Check that `(handledR3 || '')` includes `never re-raise a declined, deferred or decided one, except one declined because it could not be confirmed that you now confirm`, and that `(handledOff || '')` includes `never re-raise a declined, deferred or decided one):` exactly. Do not use `fixedR2` or `handledOffR2`: both are `review r2`, a run's first round, whose prompt never carries the header (`workflows/redline-loop.js:1329`). Reading an absent prompt as `''` keeps the check failing rather than throwing (`agent-os/standards/testing/tests.md`, "A check fails, it does not throw").

The first check and the covered half of the second fail before the change; the off half is the neighbour, already green, and must stay green.

**Change, `agents/redline-reviewer.md` line 22.** Replace the line

```
A finding an earlier round declined, deferred or decided is not raised again.
```

with

```
A finding an earlier round declined, deferred or decided is not raised again, except one declined because it could not be confirmed that you now confirm, which "What is new" below treats as new.
```

**Change, `workflows/redline-loop.js`, `reviewPrompt`, line 1330.** The history header gains the exception only when the round has candidates (`Array.isArray(candidates)`), so a `coverage off` prompt keeps its header byte for byte. The header with candidates reads:

```
Findings from earlier rounds and what became of them (never re-raise a declined, deferred or decided one, except one declined because it could not be confirmed that you now confirm, which is new as the candidates block below says):
```

Add a one-line comment above it naming #94, R1-1, as the handled-list header's comment names #80, R3-3.

**Change, `README.md` line 103** (Known limits, "A decline is Redline's judgment"). Replace

```
and is settled: no later round raises it again.
```

with

```
and is settled: no later round raises it again, except one declined because it could not be confirmed, which a later round raises as new once its verifier confirms it.
```

**Change, `docs/running.md` line 45** ("Why it does not chase nits"). Replace

```
A finding Redline declined is settled, so no later round raises it again.
```

with

```
A finding Redline declined is settled, so no later round raises it again, unless it was declined because it could not be confirmed and a later round's verifier confirms it.
```

**Proof.** `grep -c "is not raised again, except one declined because it could not be confirmed" agents/redline-reviewer.md` prints `1`. `grep -c "not raised again\." agents/redline-reviewer.md` prints `0`. `grep -n "raises it again" README.md docs/running.md` shows only the two qualified lines.

**Docs entry:** `agents/redline-reviewer.md` and `workflows/redline-loop.js`: README Known limits, "A decline is Redline's judgment", and `docs/running.md`, "Rounds" ("Why it does not chase nits"), both updated in this task's commit; `docs/running.md` "What counts as new" (line 47) already states the reopen.

**Commit:** `redline: R1-1 say the decline-reopen exception wherever a declined finding is said never to be raised again (#93)`

## Task 3: R1-8, let the final nit pass's scope stand over the facts-only paragraph

`shape.md`, Decision 2.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `agents/redline-reviewer.md`

**Test first.** One check over a run that reaches a final nit pass (an existing scenario whose labels include `final nit pass r2`, such as the `done: a final nit pass with one item fixed and one declined` run near line 2141): its final nit pass prompt includes `This scope stands over the instruction below`, its `review r1` prompt does not, and `reviewerAgent` includes `a scope that stands over the rule above`. Read an absent prompt as `''`. It fails before the change.

**Change, `workflows/redline-loop.js` line 1361** (the line that begins `lines.push('', 'This is the final nit pass.`). The pushed text becomes:

```
This is the final nit pass. Report only correctness bugs introduced by this diff. Do not report nits, and do not report anything the diff did not introduce. This scope stands over the instruction below to report every finding wherever its cause lies: a bug this diff did not introduce is not reported here.
```

`FACTS_ONLY` (line 347) is unchanged.

**Change, `agents/redline-reviewer.md` line 12.** Replace

```
and for a final nit pass the instruction to report only correctness bugs introduced by that diff (after
```

with

```
and for a final nit pass the instruction to report only correctness bugs introduced by that diff, a scope that stands over the rule above that no finding is held back for where its cause lies (after
```

**Docs entry:** `workflows/redline-loop.js` and `agents/redline-reviewer.md`: no reader-facing change; `docs/running.md`, "Rounds" ("Why it does not chase nits"), already says the final nit pass reads the fixes only and reports no nits, and this makes the prompt agree with it.

**Commit:** `redline: R1-8 let the final nit pass's scope stand over the facts-only paragraph (#93)`

## Task 4: R1-10, keep scope-declined items out of the findings file's findings, so a revise of that round never shapes them

`shape.md`, Decision 3.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first.** In section 5, the `scope correctness` scenario (line 407), parse the post r1 prompt's second file (File 2, `round-1-findings.json`, the fenced JSON after `File 2:`) as `scopeBody` parses File 1 (line 414), and check: its `findings` ids are `["R1-1"]`, and its `scoped` ids are `["R1-2"]`. Add the neighbour in the same check or one beside it: a run without the scope (for example the guided run of section 1) has no `scoped` key in its findings file. It fails before the change (today `findings` holds both ids).

**Change, `workflows/redline-loop.js`, `post()`, line 2421.** The findings file's content becomes:

```js
content: json({ round, reviewed, range, summary: reviewOut.summary, findings: reviewOut.findings.filter((f) => !(reviewOut.scoped || []).includes(f)), ...((reviewOut.scoped || []).length ? { scoped: reviewOut.scoped } : {}), ...(reviewOut.coverage ? { coverage: { ...reviewOut.coverage, list: reviewOut.coverageList } } : {}) }),
```

with a comment above `findingsFile` naming #94, R1-10: what the scope declined is the record's, under its own key, and `/redline:redline-revise <pr> round <n>` reads `findings` only, so it never shapes those items, as before #93. `record.findings` is unchanged (it keeps the scoped items, line 3742), so a later round still collapses a repeat as settled.

**Change, `docs/running.md` line 48** ("The scope and the pass"). After "is declined with the scope as its reason," insert "listed under `scoped` in the round's findings file, apart from its `findings`, so `/redline:redline-revise <pr> round <n>` never shapes it,".

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Rounds" ("The scope and the pass"), updated in this task's commit.

**Commit:** `redline: R1-10 keep scope-declined items out of the findings file's findings, so a revise of that round never shapes them (#93)`

## Task 5: R1-12, build the shaper's why_human enum per pass, so a v3 section's reason is refused in the shaper's own run (also R1-5)

`shape.md`, Decisions 4 and 10, Unattended answer 4.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/upgrading.md`

**Test first.** One check: on a Redline round, the `shape r1` call's schema (`pick(run.calls, 'shape r1').opts.schema`) has a `why_human` enum (`.properties.judgmentCalls.items.properties.why_human.enum`) that includes `redline's own file` and every value of `ROUND_WHY`, and includes none of `unsure`, `new standard` and `disproportionate fix`; in a run with `askRules`, it also includes `repository rule <id>` for each rule (use the `rules` runs near line 1041). Read an absent call as `{}` so the check fails rather than throws. It fails before the change.

**Change, `workflows/redline-loop.js` lines 641-705.**

- `JUDGMENT_CALL_SCHEMA` becomes `judgmentCallSchema(reasons)`, a function returning the same object with this `why_human`:

  ```js
  why_human: { type: 'string', enum: reasons.concat(askRules.map((rule) => `repository rule ${rule.id}`)) },
  ```

  Its comment says a Redline round's enum is `ROUND_WHY` and a human review pass's `HUMAN_WHY`, each with the rule reasons, so a value from the other pass is refused by the shaper's structured output inside its own run, and `checkCalls` stays the second layer (#94, R1-5, R1-12).
- `SHAPE_SCHEMA` becomes two constants built from one function: `shapeSchema(reasons)` returns today's object with `judgmentCalls: { type: 'array', items: judgmentCallSchema(reasons) }`, and `const SHAPE_SCHEMAS = { round: shapeSchema(ROUND_WHY), human: shapeSchema(HUMAN_WHY) }`.
- The two call sites (`schema: SHAPE_SCHEMA` at line 2801, `shape`, and line 2925, `reshape`) pass `schema: pass.human ? SHAPE_SCHEMAS.human : SHAPE_SCHEMAS.round`.
- `unique` is no longer needed at line 650; leave the helper itself, which other code uses.

No prompt changes. The disposition enum stays the union, with `checkDispositions` as its check.

**Change, `docs/upgrading.md`, "Unattended section versions (#15)", line 25.** After the sentence that ends "or leaves it, in which case every launch keeps warning.", insert:

```
A section still at v3 tells the shaper to put a finding it cannot confirm to the person as `unsure`, which a Redline round no longer takes: the shaper's own output schema refuses the value, so the shaper either decides the finding (fix, decline or defer) or asks under one of the five cases, and the round goes on; the rerun brings the section's wording in line.
```

**Docs entry:** `workflows/redline-loop.js`: `docs/upgrading.md`, "Unattended section versions (#15)", updated in this task's commit; no new config key, subcommand, allow rule or exit code.

**Commit:** `redline: R1-12 build the shaper's why_human enum per pass, so a v3 section's reason is refused in the shaper's own run (R1-5) (#93)`

## Task 6: R1-15, name the review-body door for overruling a decline that has no thread

`shape.md`, Decision 5, Unattended answer 5.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`
- `README.md`
- `skills/redline/SKILL.md`

**Test first.** Update the two expectations that pin the overrule line, the layout block's expected line (line 2209) and the no-login check's (line 2254), to the new line below. Today they read, with a login and without one:

```
To overrule one, reply in its thread, then run `/redline-revise 114 review @author`.
To overrule one, reply in its thread, then run `/redline-revise 114 review @<your login>`.
```

and after this task:

```
To overrule one, reply in its thread (for one in the review body, which has no thread, submit a pull request review whose body names its id), then run `/redline-revise 114 review @author`.
To overrule one, reply in its thread (for one in the review body, which has no thread, submit a pull request review whose body names its id), then run `/redline-revise 114 review @<your login>`.
```

Both fail before the change.

**Change, `workflows/redline-loop.js`, `handoffComment`, line 3193.** The overrule line becomes:

```js
`To overrule one, reply in its thread (for one in the review body, which has no thread, submit a pull request review whose body names its id), then run \`/redline-revise ${pr} review ${login ? `@${login}` : '@<your login>'}\`.`
```

**Change, `docs/running.md` line 114** ("After the run, or for an earlier round"). After "Reply in the decline's thread on the pull request, saying what you want," insert "or, for a finding in the review body, which has no thread, submit a pull request review whose body names its id and says what you want (an issue comment is not read),".

**Change, `README.md` line 103.** Replace "overruling one is a reply in its thread and a human review pass" with "overruling one is a reply in its thread (a pull request review naming it, for one in the review body) and a human review pass".

**Change, `skills/redline/SKILL.md` line 240.** Replace "reply in its thread on the pull request, then" with "reply in its thread on the pull request (for one in the review body, which has no thread, a pull request review whose body names its id), then".

**Docs entry:** `workflows/redline-loop.js` and `skills/redline/SKILL.md`: `docs/running.md`, "Overruling a decline", and README Known limits, "A decline is Redline's judgment", updated in this task's commit.

**Commit:** `redline: R1-15 name the review-body door for overruling a decline that has no thread (#93)`

## Task 7: R1-20, say a round committed no fix instead of claiming no commits or an empty diff

`shape.md`, Decision 6, Unattended answer 2.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.**

- Update the expectation of the `done: an asked nit, answered with no change, buys no round` check (line 2104) to the new note, `'The last revise pass committed no fix, so there was no fix diff to re-review.'`.
- Add one check on the no-fix-diff round's prompt (`noDiff`, line 2099): it includes `round 1 committed no fix; its spec and standards commits are not one` and does not include `is empty)`.

Both fail before the change. The existing check at line 2099 (`- The diff to review: none: round 1 changed no code, so there is no fix diff to recheck`) stays as it is.

**Change, `workflows/redline-loop.js`, `reviewPrompt`, line 1306.** The no-fix-diff branch becomes:

```js
? `none: round ${round - 1} changed no code, so there is no fix diff to recheck (round ${round - 1} committed no fix; its spec and standards commits are not one)`
```

**Change, line 3822.** `'The last revise pass made no commits, so there was no fix diff to re-review.'` becomes `'The last revise pass committed no fix, so there was no fix diff to re-review.'`.

The counting (`fixedAny`, `empty: true`) is unchanged, as the #93 spec agreed (`shape.md`, Unattended answer 2).

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `docs/running.md`, "Rounds" ("What buys the next round"), already describes a round that changed no code, and neither string is quoted in `README.md`, `docs/` or `skills/` (`grep -rn "made no commits" README.md docs skills` prints nothing).

**Commit:** `redline: R1-20 say a round committed no fix instead of claiming no commits or an empty diff (#93)`

## Task 8: R1-2, say the overruled decline's thread was resolved at Finish and the pass reads the reply anyway

`shape.md`, Decision 7.

**Files:**

- `docs/running.md`

**Change, line 116.** The line ends "...which is right once the pass has fixed it, and the thread stays open, since a person spoke in it." Anchor on the clause with its leading comma, and replace

```
, and the thread stays open, since a person spoke in it.
```

with

```
. Finish resolved that thread when the run handed off, so your reply may sit in a resolved thread; the human review pass reads it all the same, since it does not read whether a thread is resolved.
```

so the line ends in two whole sentences: "...which is right once the pass has fixed it. Finish resolved that thread when the run handed off, ..."

**Proof.** `grep -c "since a person spoke in it" docs/running.md` prints `0`. `grep -c "once the pass has fixed it. Finish resolved that thread" docs/running.md` prints `1`.

**Docs entry:** a change to `docs/` only; no plugin file changes.

**Commit:** `redline: R1-2 say the overruled decline's thread was resolved at Finish and the pass reads the reply anyway (#93)`

## Task 9: R1-3, strip a "left to the author under rule" tail from a prior finding's title

`shape.md`, Decision 8.

**Files:**

- `tests/gh-fixtures/reviews-17.json` (new)
- `tests/gh-fixtures/comments-17.json` (new)
- `tests/gh-fixtures/issue-comments-17.json` (new)
- `tests/gh-test.sh`
- `scripts/redline-gh.sh`
- `docs/scripts.md`

**Test first.** A PR 17 fixture, wired like PR 16:

- `reviews-17.json`: one review, `Redline round 1`, whose body has one finding line under `### Correctness (1)`:

  ```
  - **R1-1** · correctness · low · confirmed · `app/a.php:3` · Rule-covered nit · left to the author under rule craft-config
  ```

- `comments-17.json`: its root inline comment (id `1701`, `pull_request_review_id` the review's id, body opening `**R1-1** · `) and one Redline reply in its thread (id `1711`, `in_reply_to_id` `1701`), body `Redline round 1: left to the author under repository rule craft-config (Config is changed by hand). No change made; the author makes it. · decided by: the author`.
- `issue-comments-17.json`: `[]`.
- `tests/gh-test.sh`: copy the three files where PR 16's are copied (line 62) and route PR 17's three endpoints in the fake `gh` as PR 16's are (lines 144-146).

Two cases after the PR 16 cases (line 273): `prior-findings 17` gives `.[0].title` `Rule-covered nit`, and `.[0].disposition` `left`. The first fails before the change (the title keeps the tail); the second is the neighbour, already green, since the reply's classify matches `startswith("left to the author")` (line 354). PR 16's case "with no login the fallback tail is stripped" stays as it is.

**Change, `scripts/redline-gh.sh` line 362.** In the title pattern's rule alternative, `(yours|left to (@[A-Za-z0-9-]+|the person running Redline))` becomes `(yours|left to (@[A-Za-z0-9-]+|the person running Redline|the author))`. Extend the comment above `classify` (line 346) to say a human review pass with no login writes "the author" in a final nit pass's rule tail too.

**Change, the header, line 35, and its verbatim copy, `docs/scripts.md` line 45.** Replace

```
#                                  title; <person> is @<login>, or "the person running Redline"
#                                  when the run had no login. comment_id and body
```

with

```
#                                  title; <person> is @<login>, or "the person running Redline"
#                                  when the run had no login ("the author" in a final nit pass
#                                  after a human review pass with none). comment_id and body
```

in both files, so the quote stays byte for byte.

**Docs entry:** `scripts/redline-gh.sh`: `docs/scripts.md`, "`redline-gh.sh`", the quoted header, updated in this task's commit. No new subcommand, so no guard group changes (`agent-os/standards/scripts/bash-conventions.md`).

**Commit:** `redline: R1-3 strip a "left to the author under rule" tail from a prior finding's title (#93)`

## Task 10: R1-4, drop needsDecision from the skill's reviewed fields and list declined as tracked

`shape.md`, Decision 9.

**Files:**

- `skills/redline/SKILL.md`

**Change, line 190.** Replace "proposed fix, needsDecision, and `carriedFrom`" with "proposed fix, `wouldConfirm` for one the verifier could not confirm, and `carriedFrom`".

**Change, line 97.** Replace "the rest (`fixed`, `deferred`, `decided`, `dropped`, `carried`, or `left` to the person under a repository ask rule)" with "the rest (`fixed`, `declined`, `deferred`, `decided`, `dropped`, `carried`, or `left` to the person under a repository ask rule)".

**Proof.** `grep -c needsDecision skills/redline/SKILL.md` prints `0`.

**Docs entry:** `skills/redline/SKILL.md`: no reader-facing change; `docs/running.md:172` already lists `declined` among the dispositions, and the skill now agrees with it and with the workflow's `reviewed` result.

**Commit:** `redline: R1-4 drop needsDecision from the skill's reviewed fields and list declined as tracked (#93)`

## Task 11: R1-5, pin the human review pass's own why_human enum beside the Redline round's

`shape.md`, Decision 10. Task 5 made the per-pass schema, and its commit names R1-5. This task pins the neighbour that must not change.

**Files:**

- `tests/loop-test.mjs`

**Test.** One check, beside the `human: an ask for a reason of its own` check (line 2024): the `shape h1` call's `why_human` enum includes every value of `HUMAN_WHY` (`unsure` among them) and does not include `redline's own file` or `outside the pull request`. It passes once Task 5 has landed; under a temporary revert of Task 5's two call sites to one schema it fails on `redline's own file`, which a gate run shows before the revert is undone. The commit carries no change to `workflows/redline-loop.js`.

**Docs entry:** test only; no plugin file changes.

**Commit:** `redline: R1-5 pin the human review pass's own why_human enum beside the Redline round's (#93)`

## Task 12: R1-6, say scope-declined items have no comment and no reply in the closing sentence

`shape.md`, Decision 11.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In section 5 (the `scope correctness` scenario), one check: `scopeBody.body` includes `The items declined under this run's scope have no inline comment and no reply.`, and the body of a run without the scope (the guided run's `post r1`) does not. It fails before the change.

**Change, `workflows/redline-loop.js`, `reviewBody`, line 960.** When `scoped.length` is not 0, the closing sentence is followed, in the same paragraph, by ` The items declined under this run's scope have no inline comment and no reply.` The sentence stays where it is (the comment at lines 956-958).

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `docs/running.md:151` already says what the scope list holds.

**Commit:** `redline: R1-6 say scope-declined items have no comment and no reply in the closing sentence (#93)`

## Task 13: R1-9, extract decideRule for the three identical pass switches

`shape.md`, Decision 12. A small refactor: every prompt stays byte for byte.

**Files:**

- `workflows/redline-loop.js`

**Change.** After `NEVER_DECIDE` (line 348), add

```js
// The rule a role after the shaper follows about decisions: a human review pass keeps NEVER_DECIDE;
// a Redline round's roles apply what was decided and leave what is pending (#93; #94, R1-9).
const decideRule = (pass) => (pass.human ? NEVER_DECIDE : NOT_YOURS)
```

and replace `${pass.human ? NEVER_DECIDE : NOT_YOURS}` with `${decideRule(pass)}` at its three uses: `resolvePrompt` (line 1702), `standardsPrompt` (line 1739) and `implementPrompt` (line 1815). `planPrompt` (line 1729) and `reshapePrompt` (line 1662) keep their own text.

**Proof.** `grep -c "pass.human ? NEVER_DECIDE : NOT_YOURS" workflows/redline-loop.js` prints `1` (the helper). The loop test stays at its count with no failure, so no prompt moved.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; a refactor with every prompt unchanged.

**Commit:** `redline: R1-9 extract decideRule for the three identical pass switches (#93)`

## Task 14: R1-13, check a judgment call's reason after the repository rules have set it

`shape.md`, Decision 13.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** One run beside the `ask: outside the cases` run (line 2010): a finding a `paths` rule covers (the `rules` setup near line 1041, `craft-config`), which the shaper sorts as `ask` with `whyHuman` `unsure`. Check: the run does not stop at `shape` (it hands off with the call, or goes on under autopilot), and the call's `why_human` is `repository rule craft-config`. The `ask: outside the cases` check (line 2011) stays as it is: a call no rule covers, with `unsure`, still stops at shape with the same message. The new check fails before the change.

**Change, `workflows/redline-loop.js`.**

- Move the `why_human` test (lines 2575-2583, the `if (!pass.human)` block) out of `checkCalls` into a new function, `checkWhy(pass, shaped, known = [])`, with the same `decided` helper and the same error text, and a comment: it runs after `forceAskRules`, which gives a call a repository rule covers the rule's reason, so that call is judged by the reason it will be asked with (#94, R1-13).
- In `revise()`, call `checkWhy(pass, shaped)` right after `forceAskRules(record, pass, inScope, shaped)` (line 2813); on the reshape path, `checkWhy(pass, shaped, calls)` right after its `forceAskRules` (line 2930).
- Update `checkCalls`'s comment (lines 2566-2571) so it no longer speaks of the reason.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `docs/running.md`, "Dispositions", still says a call outside the cases stops the run at shape, which holds.

**Commit:** `redline: R1-13 check a judgment call's reason after the repository rules have set it (#93)`

## Task 15: R1-16, extract scopedLine for the two copies of the scope-declined line

`shape.md`, Decision 14. A small refactor: every body stays byte for byte.

**Files:**

- `workflows/redline-loop.js`

**Change.** Before `reviewBody` (line 900), add

```js
// A line the correctness-only scope declined (#93): its id is not bold, so redline-gh.sh
// prior-findings never reads it back as a finding, and a later run without the scope sees the
// item fresh. The title is the verifier's and goes through postedText (#87).
function scopedLine(f) {
  return `- ${f.id} · \`${f.file}:${f.line}\` · ${postedText(f.title)}`
}
```

and use `...scoped.map(scopedLine)` at both copies: `reviewBody` (line 943) and `handoffComment` (line 3198).

**Proof.** `grep -c "scopedLine" workflows/redline-loop.js` prints `3`. The loop test's scope checks (lines 416, 1453 and 2264) stay green unchanged.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; a refactor with every body unchanged.

**Commit:** `redline: R1-16 extract scopedLine for the two copies of the scope-declined line (#93)`

## Task 16: R1-17, capitalise the person's label where the cap-hit comment starts a sentence with it

`shape.md`, Decision 15.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** Beside the `layout: the cap-hit comment` run (line 2267), run the same scenario with `login: ''` and check its `cap-hit comment` includes `so it has not requested a review. The person running Redline will pick these up.` The existing check with a login (line 2268) stays as it is. The new check fails before the change.

**Change, `workflows/redline-loop.js`, `capComment`, line 3306.** Replace `${personLabel} will pick these up.` with `${personLabel.charAt(0).toUpperCase()}${personLabel.slice(1)} will pick these up.` (a login opens with the at sign, so it reads as before).

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; the cap-hit comment's wording is not quoted in `README.md` or `docs/`.

**Commit:** `redline: R1-17 capitalise the person's label where the cap-hit comment starts a sentence with it (#93)`

## Task 17: R1-19, leave a scope-declined carried finding's earlier thread open as declined under the scope

`shape.md`, Decision 16.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first.** In the `carry: correctness scope` run (line 692), one check: `run.res.threads` lists the earlier thread open as `{ id: 'R1-3', reason: 'declined under the scope' }`, and the handoff comment includes `R1-3 (declined under the scope)`. Read `run.res.threads` as `{ open: [] }` when it is null, so the check fails rather than throws. The check at line 693 (no reply, no sweep) stays as it is. It fails before the change (the reason is `not settled`).

**Change, `workflows/redline-loop.js`, `threadCandidates`, line 3410.** In the carried loop's reason chain, before `!kind ? 'not settled'`, add `(record.scoped || []).some((s) => s.id === newId) ? 'declined under the scope'`, with a comment: the scope declined the carried finding, so its earlier thread gets no reply and stays open, and a later run without the scope sees it fresh (#94, R1-19).

**Change, `docs/running.md` line 159.** After "as does a finding the person dropped.", insert "An earlier thread whose carried finding a `correctness only` run declined under its scope stays open too, named `declined under the scope`: it gets no reply, so a later run without the scope sees the finding fresh."

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "What is posted" (the threads line, line 159), updated in this task's commit.

**Commit:** `redline: R1-19 leave a scope-declined carried finding's earlier thread open as declined under the scope (#93)`

## Task 18: Verification Gate

**Files:**

- `agent-os/specs/2026-11-13-1329-94-review-round-1/plan.md` and `agent-os/specs/2026-11-13-1329-94-review-round-1/shape.md` (step 13, and step 12 if nothing is approved).
- Standards, only those the standards approver approves from `shape.md`'s "Standards retrospective (proposed)":
  - `agent-os/standards/workflow/agents.md` (items 1 and 2).

1. **Steps 1 to 9:** run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-13-1329-94-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence. Expected: loop and gh at their counts before the round plus what Tasks 2 to 17 add (see Expected counts above); guard `594 passed, 0 mismatched`; prefs, gate, setup and background at their counts before the round, since none reads a file this round changes.
2. **Step 10, Docs:** as each task's Docs entry says. Every touched file under `scripts/`, `skills/`, `agents/` and `workflows/` has its entry; each names this round's commit for it or "no reader-facing change" with its reason. No new config key, subcommand, allow rule or exit code.
3. **Step 11, Version:** `0.3.0` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged by this round. `main` carries `0.2.4`, so this PR already has its bump, and this round changes nothing a setup rerun writes (`shape.md`, Decision 21). The setup test's last cases prove the two versions agree.
4. **Step 12, Standards retrospective:** apply the items the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", as drafted there.
   - If the approver approves neither, make no standards commit, and add "Standards retrospective: no changes" under Decisions in this folder's `shape.md`.
   - If it approves either, the edits go in one commit of their own after the finding commits: `redline: record the round 1 review lessons in the standards (#93)`. `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` then prints `0`, so no heading moved.
5. **Step 13, Spec folder:** add an "As built" section to this file. It records:
   - each task's commit;
   - each task's red run (the failing check names) and the green run;
   - the gate's counts;
   - the retrospective's outcome.

   A deviation from this plan is also recorded under Decisions in `shape.md`. This lands in the round's last commit.

**Commit:** `redline: record PR #94 round 1 as built (#93)`

---

## As built

**Commits**, one per task, in order:

| Task | Finding | Commit |
| --- | --- | --- |
| 1 | spec folder | `1b0564e` redline: save review round 1 spec for PR #94 (#93) |
| 2 | R1-1 | `ac592aa` |
| 3 | R1-8 | `cd7f181` |
| 4 | R1-10 | `36721b8` |
| 5 | R1-12 (and R1-5) | `c5a2d90` |
| 6 | R1-15 | `70c54cb` |
| 7 | R1-20 | `4eaea03` |
| 8 | R1-2 | `a3f86df` |
| 9 | R1-3 | `a8c7f56` |
| 10 | R1-4 | `6a8c63a` |
| 11 | R1-5 | `d7b1b65` |
| 12 | R1-6 | `39992e5` |
| 13 | R1-9 | `6284634` |
| 14 | R1-13 | `c4afcb8` |
| 15 | R1-16 | `358343f` |
| 16 | R1-17 | `89cef7a` |
| 17 | R1-19 | `6cc00e0` |
| 18 | standards retrospective | `89e5be7` redline: record the round 1 review lessons in the standards (#93) |

No finding commit needed a formatter commit: the gate has no formatter.

**Red run.** Every task's new or changed check was written first, all at once, and one gate run over that tree with no plugin change yet showed them red: loop `827 checks passed, 14 failed`, gh `132 passed, 1 failed`, every other check green. The failing checks, by task:

- Task 2: `coverage: the agent file says a declined finding is not raised again, ...` and `coverage: the history header carries the decline-reopen exception on a covered round, ...` (the off half is the neighbour; the check fails as a whole on the covered half).
- Task 3: `done: the final nit pass's scope stands over the facts-only paragraph, ...`.
- Task 4: `scope: the findings file keeps what the scope declined under scoped, apart from its findings`; the neighbour `scope all: a run without the scope writes no scoped key in its findings file` was green.
- Task 5: `rules: a Redline round's shaper schema takes the round's reasons and the rule reasons, and none of a human pass's own` (the enum held `unsure`).
- Task 6: `layout: the handoff, every heading in order with its line, ...` and `layout: with no login the person running Redline stands in everywhere, ...`.
- Task 7: `done: an asked nit, answered with no change, buys no round` and `done: the no-fix-diff prompt says the round committed no fix and never claims its diff is empty`.
- Task 9: gh `author tail: a left to the author under rule tail is stripped from the title`; the neighbour `author tail: its left to the author reply is still left` was green.
- Task 11: `human: a human pass's shaper schema keeps its own reasons and has none of a Redline round's` (the one union enum held `redline's own file` and `outside the pull request`).
- Task 12: `scope: the closing sentence says the items declined under the scope have no inline comment and no reply, ...`.
- Task 14: `ask: a rule-covered call whose reason is outside the cases is not refused, and is asked under the rule` (the run stopped at shape over `"unsure"`); `ask: outside the cases` stayed green.
- Task 16: `layout: with no login the cap-hit comment opens its sentence with a capital`.
- Task 17: `carry: the earlier thread of a carried finding the scope declined stays open as declined under the scope` (the reason was `not settled`).

The tests were then taken back out and re-added task by task, each with its change, so each finding's commit holds its own check.

**Green runs.** The gate ran green after Task 5 (loop 834), after Task 9 (loop 835, gh 133), after Task 14 (loop 838; Task 13's refactor left every check as it was) and after Task 17 (loop 841). Tasks 13 and 15, the refactors, changed no check's count or expectation.

**Gate counts** (the run after Task 17, every check exit 0, `unexpected_files` empty): syntax 0, validate 0 (passed with warnings), guard `594 passed, 0 mismatched`, loop `841 checks passed, 0 failed`, prefs `121 passed`, gate `117 passed`, setup `470 passed`, gh `133 passed, 0 failed`, background `39 passed`. Loop 841 is 828 plus thirteen: twelve new `check()` calls and the run-record check of the new capped run in Task 16.

**Standards retrospective.** The standards approver approved both items, applied as drafted in one commit (`89e5be7`) to `agent-os/standards/workflow/agents.md`, lines 9, 16 and 36; `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` printed `0`. Neither edit carries part of a finding's fix, so the commit names no finding.

**Deviations** (also under Decisions in `shape.md`, 23):

- The red runs were one batched gate run before any change rather than one per task, and Task 11's red is that run, over the code before Task 5, rather than a temporary revert of Task 5's call sites.
- Task 12's neighbour, and Task 4's, read the scope-all run of section 5 (`all`), not the guided run of section 1, which is out of scope there.
- Task 9: the line added to the comment above `classify` sits inside the single-quoted jq program, so it is worded without an apostrophe ("the rule tail of a final nit pass").
- Task 14: `checkWhy` runs after `forceAskRules`, which itself runs after `checkSpec`, so a refused reason now stops the round after the `spec status` call instead of before it. The error text and the resume label are unchanged. The comment on `judgmentCallSchema` (Task 5) names `checkWhy` as the second layer from Task 14's commit on.
