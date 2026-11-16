# References for PR #94 Review Round 5

Shaped by Redline in unattended mode. Every file below was opened at `583ac3b`.

## Similar Implementations

### Rounds 1 to 4 of this pull request

- **Location:** `agent-os/specs/2026-11-13-1329-94-review-round-1/` to `agent-os/specs/2026-11-13-1329-94-review-round-3/`, and `agent-os/specs/2026-11-14-1509-94-review-round-4/`
- **Relevance:**
  - Round 4's folder gives the format this plan follows: a task per finding, files by path, a Docs entry, a commit line, the gate task with expected counts, an As built section, and the format of the shaping notes. Its As built gives this round's starting counts.
  - Round 4's R4-6 (the rename numbered after the highest id) is the code R5-5 extends, and its Unattended answer 6 answers R5-5's scope; its R4-8 (`overridesUnresolved`) is what R5-4's note describes; its R4-9 (the Deferred filter) is what R5-9 completes.
  - Round 2's R2-5 (the leading-id read in `accountCoverage`) is what R5-3 reaches from the rename, and its R2-9 (`checkWhy` names the shaper's label) is the pattern R5-6 follows.
  - Round 1's R1-13 (`checkWhy` after `forceAskRules`) is the move R5-6 repeats for the reason check.

### The #93 spec (the pull request's own)

- **Location:** `agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/shape.md`
- **Relevance:** the decline with its reason and the plan dial's disposition changes, which R5-6, R5-8 and R5-9 keep consistent.

### Checks that run after forceAskRules

- **Location:** `workflows/redline-loop.js`, `checkWhy` (2674-2689) and its two call sites (2906, 3030).
- **Relevance:** the shape R5-6's `checkDeclineReasons` takes: called after `forceAskRules` in the shape and reshape paths, with the shaper's label passed by name.

### Code read for each finding

- `workflows/redline-loop.js`:
  - `drift`, `AGENTS_CHANGED` and `AGENTS_CHANGED_HANDOFF` (240-258) and their uses (2185-2186, 3256-3257);
  - `stageError` (479-481), `COVERAGE_OUTCOMES` and `LISTED_ELSEWHERE` (585, 594);
  - `leftDecision` (1176-1184);
  - `accountCoverage` and its constants (1527-1612);
  - `handoffResult`'s `relaunch` (2230-2264);
  - `review()`, from the coverage pass through the rename, the ref rename and the set-aside block (2287-2410);
  - `post()`'s comment map (2525-2528), `shaperOwner` and `outcomesFor` (2531-2574), `describeOutcome` (2578-2598);
  - `checkDispositions`, `checkCalls`, `checkWhy`, `checkSpec` and `forceAskRules` (2600-2787);
  - `revise()` from the shaper through the approve loop, the commits and the outcomes (2886-3177);
  - `handoffComment`'s opening sentence, groups and Deferred list (3222-3336), and `leftToYou` (3362-3372);
  - `handoffResult`'s decisions result (3688-3726).
- `git show origin/main:workflows/redline-loop.js`: `AGENTS_CHANGED` (line 244) and the opening sentences (lines 2976-2980).
- `git blame` of `workflows/redline-loop.js` lines 251-258 and 3231-3243, with `git merge-base --is-ancestor` for each commit against `origin/main`.
- `skills/redline/SKILL.md`: lines 195-227 and 242. `docs/running.md`: lines 113, 135, 154 and 161, and its section headings. `docs/contract.md`: line 130.
- `tests/loop-test.mjs`:
  - the mock (150-236);
  - the rules scenario (1081-1132);
  - the resume checks (1186-1194);
  - the coverage helpers and the accounting, rename and note checks (1375-1419, 1486-1519);
  - the drift sentences (1995-1996);
  - the decline, ask, human and overrule scenarios (2080-2161);
  - the final-nit-pass sentence checks (2246-2264) and the unresolved-override check (2296-2310).
- `.claude/redline.json` (no `askRules`), `.claude-plugin/plugin.json` (`0.3.0`; `main` `0.2.4`).
- `agent-os/standards/workflow/agents.md` (whole), `agent-os/standards/workflow/replay.md` (whole), `agent-os/standards/testing/tests.md` (lines 1-20), `agent-os/standards/process/docs-gate.md` (its opening bullets) and `agent-os/standards/process/release.md` (its first bullet).
