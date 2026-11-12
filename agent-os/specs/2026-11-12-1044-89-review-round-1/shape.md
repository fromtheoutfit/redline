# PR #89 review round 1: the round-trip check named for what it asserts: Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The one finding of Redline round 1 on PR #89 (issue #87), and nothing more. It is a nit. The round has no correctness finding, so this is the final nit round, and the plan covers the nit only. The round reviewed the whole pull request at `1a7bf67`, which is the working tree's HEAD; line numbers here are at that commit.

- **R1-1** (nit, low, confirmed): `tests/loop-test.mjs:1770`. The check `posted text: nothing read back is escaped twice or neutralised twice` holds a `|| t.includes(WJ + WJ)` clause that no posted text can satisfy, so the "neutralised twice" half of its name is not tested.

The round's For the person lines (the joiner surviving the GitHub agent's Write, the decoded `title` beside an escaped `body`, the kept `0.2.2`, the posted #88 body, and the placement questions) are not findings and are not in scope. The `redline/` subfolder is Redline's own record and is untouched. The invoking prompt lists no repository ask rules.

## Decisions

1. **R1-1: fix, drop the clause and rename the check.** Line 1770's `|| t.includes(WJ + WJ)` goes, the check is renamed `posted text: nothing read back is escaped twice`, and a two-line comment above it says why no posted text can show a joiner `readBack` left in place and which check pins the strip instead (the reviewer-prompt check at line 1760). That is the reviewer's proposed fix with its optional comment taken, since the comment keeps the clause from being added back. The check's two `&amp;` clauses, which can go red, stay. No check is added: a doubled joiner is not something the workflow can post, so there is no case to write for it (Unattended answer 2). Plan Task 2.
   Decided by: redline
2. **No version change.** `.claude-plugin/plugin.json` reads `0.2.2`, as does `main`'s. The #87 spec keeps it on purpose (`agent-os/specs/2026-11-12-0948-87-posted-text-mentions-and-escaping/shape.md:47`, decision 9: "The version stays 0.2.2, on purpose."). The round 1 review lists that decision under For the person, so whether to bump is the person's question and not this round's finding. This round's one change is a test file, which a setup rerun does not write (`process/release`, first bullet), so it adds no bump of its own.
   Decided by: redline
3. **Docs.** Task 2 commits `tests/loop-test.mjs` only, which is not in a directory gate step 10 lists, and adds no config key, subcommand, allow rule or exit code, so it needs no Docs entry (`process/docs-gate`, first bullet). Neither `README.md` nor `docs/` names the check.
   Decided by: redline

### Proportionality

R1-1 is a nit, so the rule for correctness findings does not apply. For the record: one line of `tests/loop-test.mjs` becomes three (a clause removed, the name shortened, two comment lines). The file is in the PR's diff. No other file, dependency or abstraction is touched.

## Unattended answers

1. **Is the finding real?** Yes, confirmed by reading the three functions. `postedText` (`workflows/redline-loop.js:929-931`) inserts the joiner with the pattern `/@(?=[A-Za-z0-9])/g`, so it adds one only after an `@` whose next character is an ASCII letter or digit. An `@` already followed by U+2060 is not, and gets none. `grep -n 'u2060' workflows/redline-loop.js` finds the joiner only at lines 930 (`postedText`) and 939 (`readBack`): nothing else in the workflow writes one. With the strip removed from `readBack`, the read-back title `posted` (`tests/loop-test.mjs:1715`, `'Binds @' + WJ + 'click to &lt;b> &amp; more'`) decodes to `Binds @` + WJ + `click to <b> & more`, and `postedText` turns it back into `posted`, byte for byte. Every posted string in the scenario is then the same, so the clause stays false and the check stays green. The `&amp;lt;` and `&amp;amp;` clauses do turn red without the decode, since `posted` holds `&lt;` and `&amp;`. The shaper's guard refuses `node`, so the loop test was not run here; the reviewer could not run it either (its finding says so). The trace is short and turns on one regular expression, so it settles the finding.
2. **Should the round add a case that would catch a missing strip instead?** No. The finding's own description says no posted output can show a missing strip, and Unattended answer 1 shows why: the only producer of a joiner never writes two. The strip is observable only where a read-back title is shown un-posted, which is the reviewer's carry list, and line 1760 (`posted text: the reviewer's carry list shows a read-back title decoded, the joiner stripped`, asserting `rp.includes('"title": "Binds @click to <b> & more"')`) already pins it there.
3. **What did the PR and the original spec promise for the round trip?** Escaping once, not neutralising once. The PR description: "So the reviewer reads it as written, and a carried title is escaped once, never twice." The #87 spec's decision 7 (`agent-os/specs/2026-11-12-0948-87-posted-text-mentions-and-escaping/shape.md:45`): "The tests must prove two things: a finding carried forward is not escaped twice, and a title still matches its earlier id". So the renamed check states what both promise, and nothing the spec asked for is dropped.
4. **Is R1-1 already tracked?** No. `scripts/redline-gh.sh issues-search "round trip"` returns no open issue, and this is the PR's first review-round folder, so no earlier round dispositioned it.
5. **Visuals, references, product context, standards.** No visuals. References: the three functions and the two checks named above (`references.md`). Product context does not bear on a test name. Standards: `testing/tests` line 25, "A check's name states only what it asserts", is the rule this fix applies (`standards.md`).

## Deferred

None.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** N/A; a test check's name and one clause.
- **Run caution (#81): noted for the person, not a decision and not a finding.** #81 is open: "Self-review: a relaunch runs the workflow and agents as the run's own rounds edited them, so replay diverges and a re-run round can wrongly end the run". Task 2 commits `tests/loop-test.mjs` only, and no round commit touches `workflows/` or `agents/`, so a relaunch of this run is not exposed to it.

## Standards Applied

- `testing/tests`: a check's name states only what it asserts (line 25; R1-1); a change that touches a tested surface adds a case (line 23), which does not apply, since the change removes a clause no input can satisfy and adds no behaviour; red before green (line 28), which does not apply for the same reason (Unattended answer 2); the escaping bullet's round trip (line 10), whose "proven red by removing the decode at intake" is what the kept clauses still prove.
- `process/docs-gate`: no Docs entry for a file outside the listed directories (Decision 3).
- `process/release`: no version change in this round (Decision 2).
- `scripts/guard`: every command the plan gives the implementer is a plain pipeline, with no `$`, no backticks, no process substitution and no interpreter.
- `process/standards-retrospective`: the proposed list below.
- `prompts/attribution`: no model or vendor name in the spec, the code or the commits.

## Standards retrospective (proposed)

Listed mechanically from the Decisions and Unattended answers above.

1. **Decision 1 (R1-1): already in a standard.** `agent-os/standards/testing/tests.md` line 25: "A check's name states only what it asserts". The check's name claimed a joiner strip that its clause could not see; the fix is that rule applied, and the line needs no new wording.
2. **Decision 2 (version): already in a standard.** `agent-os/standards/process/release.md`, first bullet. Whether to keep `0.2.2` is the #87 spec's decision, raised to the person by the round's review, and is not a lesson of this round.
3. **Decision 3 (Docs): already in a standard.** `agent-os/standards/process/docs-gate.md`, first bullet.
4. **No pattern invented.** The plan uses no pattern outside `agent-os/standards/`.

Proposed: **Standards retrospective: no changes.** If the standards approver approves none, the implementer adds that line under Decisions here at the gate.
