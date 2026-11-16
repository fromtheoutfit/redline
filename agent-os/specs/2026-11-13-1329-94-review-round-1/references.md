# References for PR #94 Review Round 1

Shaped by Redline in unattended mode. Every file below was opened at `3d23086`.

## Similar Implementations

### The #93 spec (the pull request's own)

- **Location:** `agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/`
- **Relevance:** Its `shape.md` records the owner's answers and the shaping defaults this round answers from: decision 7 (the two doors to overrule a decline; R1-15), the default "A fix diff means a commit that names an item; the round's spec and standards commits are not one" (line 79; R1-20), and the deviation that kept a human review pass's wording (R1-3). Its `plan.md:67` lists the same consequence the owner approved.
- **Key patterns:** a decision the spec records is answered from the spec, and only the statement that disagrees with it is fixed.

### The #91 round 1 spec

- **Location:** `agent-os/specs/2026-11-13-0859-91-review-round-1/`
- **Relevance:** The latest review-round spec in this repository; its `plan.md` is the format this plan follows (task per finding, files by path, Docs entry, commit line, the gate task with expected counts) and its `shape.md` the format of Decisions, Proportionality and Unattended answers.

### The #87 spec (posted text)

- **Location:** `agent-os/specs/2026-11-12-0948-87-posted-text-mentions-and-escaping/shape.md`
- **Relevance:** Decision 2 and its "A field before raw text is rendered alone" rule (line 91): shaper, person and implementer text is posted as written, behind the agent files' backtick sentence. R1-11 is declined on it and on `agent-os/standards/workflow/agents.md:17`.

### Code read for each finding

- `workflows/redline-loop.js`: `PRIOR_DISPOSITIONS` (86), `personLabel` (190), the constants block (329-348), `JUDGMENT_CALL_SCHEMA` and `SHAPE_SCHEMA` (641-705), `findingLine` and `reviewBody` (885-962), `personLine` and `setAsideBlock` (973-1012), `postedText` (1022), `reviewPrompt` (1299-1366), `candidatesBlock` (1385-1409), the prompts that use `NEVER_DECIDE` and `NOT_YOURS` (1579-1830), `reconcilePrior` (2361-2408), `post()` (2411-2440), `outcomesFor` and `describeOutcome` (2469-2524), `checkCalls` (2573-2600), `forceAskRules` (2642-2695), `revise()` (2795-3092), `handoffComment` (3099-3225), `humanSummary` and `capComment` (3256-3312), `threadCandidates` and `earlierRoundsLines` (3375-3456), `sweepThreads` and `threadsLine` (3465-3519), the revise-only path and the round loop (3674-3829).
- `agents/redline-reviewer.md`: lines 8-22 and 44 (the known-finding check and "What is new").
- `agents/redline-shaper.md`: rules 1-10 and the Attribution sentence (line 61).
- `scripts/redline-gh.sh`: the header (lines 28-38), `prior-findings` (330-386) and `human-review` (388-450).
- `skills/redline/SKILL.md`: lines 86, 95-99, 188-192, 208 and 236-244. `skills/redline-revise/SKILL.md`: line 15.
- `docs/running.md`: lines 43-48, 67, 108-116, 150-159 and 172. `docs/upgrading.md`: "Unattended section versions (#15)". `docs/scripts.md`: lines 40-48. `README.md`: lines 84-106.
- `templates/history/shape-spec-unattended.v3.md`: point 5 (line 52) and the JSON example (line 70).
- `tests/loop-test.mjs`: the scope scenario (405-419), the carry scenario under the scope (692-693), the coverage key-phrase checks (1413-1414, 1530-1542), the ask-reason checks (2010-2031), the done-rule checks (2099-2154), the layout and overrule checks (2196-2268). `tests/gh-test.sh`: the fake `gh` routing (140-150), the fixture copy line (62) and the PR 16 cases (257-273).
