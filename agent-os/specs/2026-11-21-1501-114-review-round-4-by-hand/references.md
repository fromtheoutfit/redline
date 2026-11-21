# References for PR #114 Review Round 4, Fixed by Hand

## Similar Implementations

### The #112 round finished by hand

- **Location:** `agent-os/specs/2026-11-20-1057-112-review-round-4-by-hand/`
- **Relevance:** the nearest precedent: a round a person finishes after the cap, with a class settled once by a measured table (its sweep of git's keys and variables).
- **Key patterns:** the person's decisions listed first, then the answers given while shaping, then the ones made from the code; the table in `shape.md` before the plan; a mechanism that needs no list (the prefix drop) in place of one more named instance; the earlier rounds' cases kept unedited as the proof of the new mechanism; a change no finding names as its own task and commit; one reply per finding in Redline's form after the push.

### The #97 round finished by hand

- **Location:** `agent-os/specs/2026-11-17-0929-97-review-round-4-by-hand/`
- **Relevance:** the form of a reply to a finding that sits in the review body: the marker, the header line, a blank line, the reply (`plan.md`, "After the push").
- **Key patterns:** `scripts/redline-gh.sh comment <pr> <file>` for a body finding, `reply <pr> <comment id> <file>` for one placed inline; `prior-findings` read afterwards.

### The guard's reading of a write target

- **Location:** `scripts/redline-guard.sh`: `writable` (498-548), `ask_rule` (386-404), `glob_regex` (258-290), `glob_root` (293-302)
- **Relevance:** the reference for the table. The guard is not changed.
- **Key patterns:** `os.path.normpath(os.path.join(cur, path))` (518), then `os.path.realpath` (521); `ask_rule` reads the path relative to the repository (394), skips one that starts with `..` (395), matches the glob (400) and then the rule's literal root, "holds the files of" (402). A target is never trimmed.

### The cleanup rounds 1 to 3 built

- **Location:** `workflows/redline-loop.js` at `4200467`: `relPath` (485), `cleanPaths` (494), `taskFilesOf` (498), `ruleForPaths` (543-555)
- **Relevance:** what the one normaliser replaces (decision 15).
- **Key patterns:** a list read through one function before it is compared, stored or counted; the comments carry each round's history (R1-6, R2-2, R3-3), which the rewritten comments keep.

### The path-form cases of rounds 1 to 3

- **Location:** `tests/loop-test.mjs` at `4200467`: the rules cases (1441-1465), the reshape cases (3468-3486), the blank at the resolve-time check (3627)
- **Relevance:** the new cases sit beside them and use the same helpers; these cases stay unedited and prove the normaliser for their forms.
- **Key patterns:** one run per form, each named with the form as written (`JSON.stringify(form)`); `approverFiles(run, id, label)` for what the plan approver is shown; `forcedAs(run)` for the rule a finding is left under; `anyWarning(run, 'the reshape changed')` for a change that must not be warned about.

### The override a reshape returns as a call

- **Location:** `tests/loop-test.mjs` at `4200467`: `overrideRecalled` (3414-3419), `overrideCalled` and `overrideCalledEmptied` (3501-3504), the hold's cases (3449-3460)
- **Relevance:** R4-5's and R4-6's cases sit beside them.
- **Key patterns:** `reshapeAsk: ['R1-1']` has the reshape return a call for the override's finding; `resolveFilesAt: { 'resolve r1 #1': { 'R1-1': files } }` scripts the task that one resolve alone returns; `stopsAtReshape(run, error)` and `stopOf(run)` read a stop.

### The plan approver's list in a scenario

- **Location:** `tests/loop-test.mjs` at `4200467`: `scenario.planPaths` in the mock (310-314), `snapshotPaths` (1605), the fix-diff cases (4055-4061)
- **Relevance:** the `planPaths` task's cases script the list and read the snapshot's `plan_paths` this way.

## Records this spec rests on

- `agent-os/specs/2026-11-20-2144-114-review-round-4/redline/`: `round-4-findings.json`, `round-4-review.json`, `cap-hit.md` (the brief). Review 6006885361 on the pull request holds the findings: five inline comments (R4-1 4653942695, R4-2 4653942703, R4-3 4653942709, R4-5 4653942714, R4-6 4653942719) and R4-4 in the body under "Not placed inline".
- `agent-os/specs/2026-11-20-2144-114-review-round-1/shape.md`: R1-6, which built `cleanPaths`, and R1-3, the reshape block's ends.
- `agent-os/specs/2026-11-20-2144-114-review-round-2/shape.md`: Decision 1 (R2-2, the forms folded, and `relPath` left unchanged because no finding raised the rules' reading), Decision 3 (R2-5, which agents run is kept).
- `agent-os/specs/2026-11-20-2144-114-review-round-3/shape.md`: Decision 3 (R3-3, the two readings and the reader table, whose last two rows this spec takes up) and Decision 4 (R3-4, the list set once, and "The checks in `resolveWith` still hold that second resolve to its own tasks", which decision 14 here keeps for the accept half only).
- `agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/shape.md`: decisions 10 to 20 (the design this pull request builds), decision 17 (a second resolve sets only the ids it applied) and "For you to open" (the ask rules never read a resolve's tasks, which stays out of scope).
- `agent-os/specs/2026-11-20-2144-114-review-round-3/redline/round-3-reply-R3-3.md`: the form of a reply in a finding's thread.
- `scripts/redline-gh.sh`: `prior-findings` (which replies it reads as settled), `reply`, `comment`, `resolve-threads`.
- `scripts/checks-template.sh:390-409`: how the gate reads `plan_paths` (a leading `./` taken off, a blank dropped, an entry that ends in `/` a prefix), which decision 12 protects.
- Python's `os.path.normpath`, `os.path.join` and `os.path.relpath` (3.14.7 on this machine), the calls the guard makes.
