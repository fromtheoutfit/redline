# PR #61 Review Round 1 — Plan

Shaped by Redline in unattended mode. Two findings, both `fix`: R1-2 (the reshape check) and R1-1 (the relaunch rule's wording). No judgment calls. Tasks follow the order the round's findings were listed (R1-2, then R1-1).

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-0807-61-review-round-1/redline/snapshot.json`.

Every command below is a plain pipeline run from the repository root. Roles cannot run `node` directly, so the loop test runs through `.claude/redline/checks.sh`: read the `loop` entry of its JSON (`exit`, and the `N checks passed, M failed` line in its output).

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before any finding's commit:

- `agent-os/specs/2026-11-02-0807-61-review-round-1/plan.md`
- `agent-os/specs/2026-11-02-0807-61-review-round-1/shape.md`
- `agent-os/specs/2026-11-02-0807-61-review-round-1/standards.md`
- `agent-os/specs/2026-11-02-0807-61-review-round-1/references.md`

Never stage anything under its `redline/` folder in this commit.

**Files:** the four above.

**Commit:** `redline: shape PR #61 review round 1 (#57)`

## Task 2: R1-2 — the reshape check accepts what the round already decided

**Files:** `tests/loop-test.mjs`, `workflows/redline-loop.js`, `README.md`.

**Red first** (testing/tests: a bug fix lands red before green).

1. `tests/loop-test.mjs`, shaper mock (`if (t === 'redline:redline-shaper')`, about line 115). Make the mock answer a reshape the way the reshape prompt asks, under four new scenario keys that apply only when `opts.label` starts with `reshape`. Every other scenario's JSON must stay unchanged:
   - `scenario.reshapeOmitCall`: ids whose judgment call the reshape leaves out (the finding keeps the disposition it would otherwise have).
   - `scenario.reshapeFix`: ids the reshape sorts `fix` (`decidedBy` `redline`) while still returning their call.
   - `scenario.reshapeAsk`: ids the reshape newly sorts `ask` (`decidedBy` `pending`) with a call, unless `reshapeOmitCall` also names them.
   - `scenario.reshapeExtraCall`: ids the reshape returns a call for while sorting them as they would otherwise be.
   Add a two-line comment above the keys naming #61, R1-2, as the existing `shaperNoCall` comment names #57.
2. `tests/loop-test.mjs`, section 14, after the "a reshape without a usable spec names the reshape label" check (about line 1205). Add a short comment ("A reshape after a decided ask (#61, R1-2) ...") and these five scenarios, one `check` each. Each uses `reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness', { needsDecision: true })], []]`, `ask: ['R1-2']`, `planBounce: 1` and `commitIds: [['R1-1', 'R1-2']]`:
   - **Decided ask, call left out (guided):** `{ ...baseArgs, decisions: { 'R1-2': { choice: 'Keep it', notes: 'The author keeps it as it is.', date: '2026-11-02' } } }` with `reshapeOmitCall: ['R1-2']`. Check that the run finishes `done`, that the labels include `reshape r1 #1` and `spec status r1 #1`, and that they do not include `resolve r1 #1` (nothing new to resolve).
   - **Decided ask re-sorted fix, call kept (guided):** the same args with `reshapeFix: ['R1-2']`. Check `done`.
   - **Autopilot:** `{ ...baseArgs, interrupt: 'autopilot' }`, no decisions, with `reshapeOmitCall: ['R1-2']`. Check `done`.
   - **Neighbour that must not change, a new ask without a call:** the guided decided args with `reshapeAsk: ['R1-1']` and `reshapeOmitCall: ['R1-1']`. Check `status` `error`, `stage` `shape`, `error` exactly `the shaper marked R1-1 as ask but returned no judgment call for it`, and `resumeFrom` `{ label: 'reshape r1 #1', attempt: 2 }`.
   - **Neighbour that must not change, a new call for a fix:** the guided decided args with `reshapeExtraCall: ['R1-1']`. Check `status` `error`, `stage` `shape`, `error` exactly `the shaper returned a judgment call for R1-1, which it sorted as fix`, and `resumeFrom` `{ label: 'reshape r1 #1', attempt: 2 }`.
3. Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-0807-61-review-round-1/redline/snapshot.json`. The `loop` entry must fail on the first three new checks. Both neighbours already pass, and every existing check passes. Record the failing count under As built.

**Then the fix.**

4. `workflows/redline-loop.js`, `checkCalls` (line 1951): change it to `checkCalls(shaped, known = [])`, where `known` is the round's judgment calls so far. An `ask` whose id is in `known` needs no call. A call whose id is in `known` is skipped in the disposition loop. A new ask without a call, and a new call for a finding not sorted `ask`, still throw the same two errors. Update the comment above it (lines 1947-1950) to say, in one sentence: on a reshape, a call the round already decided may be left out or kept beside a re-sorted finding, since the reshape returns only the calls still pending or newly raised (#61, R1-2).
5. `workflows/redline-loop.js`, the reshape in `revise()` (line 2290): `checkCalls(shaped, calls)`. The first-shape call at line 2173 stays `checkCalls(shaped)`. Leave `reshapePrompt` unchanged.
6. `README.md`, Launching, the marker paragraph (line 191), in the sentence "a missing `plan.md`, `shape.md` or Decisions section, a finding without a disposition, or an ask without a judgment call is an error at stage `shape`": after "an ask without a judgment call", add "(on a reshape after a bounced plan, one the round has not already decided: the reshape returns only the calls still pending or newly raised)".
7. Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-0807-61-review-round-1/redline/snapshot.json` until the `loop` entry exits 0 with 0 failed.

**Docs (gate step 10):** `workflows/redline-loop.js` is described in README "Launching" (the marker paragraph's spec-check sentence), updated in this task's commit. `tests/loop-test.mjs` is not under a Docs directory, and its README table row (line 160) is unchanged, since that row does not list section 14's scenarios.

**Commit:** `redline: R1-2 let a reshape leave out a judgment call the round already decided (#57)`

## Task 3: R1-1 — one wording for when a command line relaunches

**Files:** `skills/redline/SKILL.md`, `README.md`.

1. `skills/redline/SKILL.md`, the relaunch rule (line 211). Replace its first sentence with: "`Workflow(...)` is called only when the person's last typed line is exactly `relaunch`, or, on a launch, a resume (section 2) or the in-session relaunch of a stopped run ("stopped before a result"), a line holding only a Redline command (`/redline:redline <n> ...` or a variant). The turn that relaunches need not be the person's (a stopped run is seen in the workflow's notification); the line that counts is still the last one they typed." Keep the rest of the paragraph as it is.
2. `skills/redline/SKILL.md`, section 2, "A stopped run" (line 52). Replace "Every relaunch here starts from the line holding only the command the person typed, which the relaunch rule (section 7) accepts; nothing else is typed first." with "An `error` or `stopped` resume relaunches from the line holding only the command the person typed, which the relaunch rule (section 7) accepts; nothing else is typed first. A `handoff` or `reviewed` resume relaunches from the word, as its section says ("Relaunch only from the word"), since the person answers there first."
3. `README.md`, Launching, "The relayed line" (line 189). Replace "So the skill relaunches only from `relaunch` typed on its own (a hand-off, the review dial, a stopped run) or from a line holding only a Redline command (a launch, a resume), and refuses any other last line;" with "So the skill relaunches only from `relaunch` typed on its own (a hand-off, the review dial) or from a line holding only a Redline command (a launch, a resume); a stopped run relaunched in its own session takes either, and the skill refuses any other last line;".
4. Proof, each a plain read:
   - `grep -n "in-session relaunch of a stopped run" skills/redline/SKILL.md` prints the rule's line.
   - `grep -n "An .error. or .stopped. resume relaunches" skills/redline/SKILL.md` prints section 2's line.
   - `grep -c "a stopped run relaunched in its own session takes either" README.md` prints 1.
   - `grep -n "a turn whose user message" skills/redline/SKILL.md` prints nothing.

**Docs (gate step 10):** `skills/redline/SKILL.md` is described in README "Launching" ("The relayed line" paragraph), updated in this task's commit. The README's Known limits entry for #60 (line 209) already says "a line holding only a Redline command" without listing cases, so it stays.

**Commit:** `redline: R1-1 let a stopped run relaunch from the command line in the relaunch rule and the README (#60)`

## Task 4: Standards retrospective (as approved)

Apply the edits the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", in one commit of their own. Keep each file's headings.

**Files:** `agent-os/standards/workflow/agents.md` (line 32), `agent-os/standards/testing/tests.md` (line 7).

When the approver approves none, change no file and record "Standards retrospective: no changes" under Decisions in `shape.md` (in the as-built commit).

**Commit:** `redline: record the PR #61 round 1 lessons in the standards (#57)`

## Task 5: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-0807-61-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence.** The `loop` check's passed count must be the count before this round (487) plus the five new checks, with 0 failed.

10. **Docs:** confirm each entry names its commit: Task 2 (`workflows/redline-loop.js` → README Launching, marker paragraph) and Task 3 (`skills/redline/SKILL.md` → README Launching, "The relayed line").
11. **Standards retrospective:** Task 4, as approved, or "Standards retrospective: no changes" under Decisions in `shape.md`.
12. **Spec folder:** add an "As built" section to this file: the red count from Task 2 step 3, the green count, and any deviation, each deviation also recorded under Decisions in `shape.md`. This lands in the round's last commit.

**Files:** `agent-os/specs/2026-11-02-0807-61-review-round-1/plan.md`, `agent-os/specs/2026-11-02-0807-61-review-round-1/shape.md`.

**Commit:** `redline: record PR #61 round 1 as built (#57)`
