# References for PR #97 Review Round 4, Fixed by Hand

## Similar Implementations

### The glob count in setup-test (`f3445a6`)

- **Location:** `tests/setup-test.sh`, `keptfiles` (line 504)
- **Relevance:** the same SC2010 fix, made by hand after PR #94's round cap.
- **Key patterns:** a `for f in "<dir>/<prefix>"*` loop counting with `[[ -e "$f" ]] && n=$((n + 1))`, printing `0` when nothing matches; no `ls`, no `grep -c`.

### defer's failure cases in gh-test

- **Location:** `tests/gh-test.sh`, the fake gh's `issue` branch (lines 86-115) and the `defer issue` cases (lines 438-470)
- **Relevance:** R4-1's new cases sit beside the failed lookup and failed create cases.
- **Key patterns:** `GH_FAKE_LIST_FAIL` and `GH_FAKE_CREATE_FAIL` fail a call as GitHub would; `$LOG` records which calls ran; the record file's existence shows whether anything was written.

### Drop scenarios in the loop test

- **Location:** `tests/loop-test.mjs`, the #95 stops block (lines 3062-3210): `droppedRun` (3100), `droppedBare` (3103), `chosenScenario` and `chosenOn` (3118-3125), `ended` and `droppedAtEnd` (3160-3179)
- **Relevance:** R4-3's tests reuse `chosenScenario` (a call answered "Mitigate", its draft from the resolve agent) and the end-of-run setting.
- **Key patterns:** `answer('drop', { notes: why })`, `replyFor(calls, label, id)`, `bodyOf(run)` for the handoff, `res.decided` for the overruled flag.

### The follow-up warning's cases

- **Location:** `tests/loop-test.mjs:2877-2886`
- **Relevance:** R4-5 adds a reason that stands; R4-6 adds four warned forms.
- **Key patterns:** `points` maps an id to `[reason, quoted match]`; `stands` lists reasons that must not warn.

### The human summary's nit-pass cases

- **Location:** `tests/loop-test.mjs:1155-1166`, `2633-2635` and `3042-3052`
- **Relevance:** R4-7's case is a human pass whose final nit pass defers an item; the existing sentences must stay byte for byte.

## Records this spec rests on

- `agent-os/specs/2026-11-16-1358-97-review-round-4/redline/`: `round-4-findings.json`, `round-4-review.json`, `cap-hit.md` (the brief).
- `agent-os/specs/2026-11-16-1358-97-review-round-2/shape.md`, decision 11 and unattended answer 7 (R2-7's decline: the form of a dropped draft's reply).
- `agent-os/specs/2026-11-16-1358-97-review-round-3/redline/round-3-reply-R3-4.md`: the form of a reply to a finding in the review body.
- `agent-os/specs/2026-11-16-1026-95-defer-means-tracked/plan.md`: decision 14c ("Drop … posted as your decision with your reason") and line 146 ("A dropped draft is listed under `### Overruled by @login`").
- `skills/redline/SKILL.md:224`: a drop's restatement is posted in the finding's thread and listed in the handoff.
- `docs/running.md:129` (Deferred items, what you can do with a draft) and `:245` (A human review pass), the two docs lines this spec updates.
- `scripts/redline-gh.sh:21-57`, `prior-findings`: which replies it reads as settled (decision 9).
