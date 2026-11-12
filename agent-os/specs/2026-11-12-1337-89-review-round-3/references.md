# References for PR #89 Review Round 3

Shaped by Redline in unattended mode. Every file below was opened at `0e4a537`, the PR head the round reviewed and the working tree's HEAD.

## Similar Implementations

### postedText, readBack and textParts

- **Location:** `workflows/redline-loop.js:922-981`
- **Relevance:** `postedText` (line 938) escapes `&` and `<` and adds `&#8288;` after an `@` before an ASCII letter or digit, outside code spans. `textParts` (line 964) returns a text holding a trigger as one part, escaped whole. Its trigger at line 965 is `/\]\(|\]\[|:\/\/|www\.|[\r\n\\]/i`, and its docblock (lines 954 to 963) names "a backslash" among the triggers. R3-1's cost comes from the `](` trigger; R3-3 is the `\\` in the character class.
- **Key patterns:** one function for every posted finder and verifier field; the triggers are a fixed list.

### The base's blockText

- **Location:** `git show main:workflows/redline-loop.js`, lines 907 to 933.
- **Relevance:** the base escaped a text whole only on `/\n|\\`/`, a newline or a backslash directly before a backtick (line 917). R3-3's narrowing option returns to that backslash rule.

### The handoff's Deferred line

- **Location:** `workflows/redline-loop.js:2965-2968`; the two `deferredAll.push` calls at lines 2878 (a shaper's defer) and 2888 (a finding autopilot leaves under a repository rule, with `rule` set).
- **Relevance:** line 2967 is the rule branch R3-2 pins, line 2968 the `shipped` branch section 16 already pins. Each calls `postedText(d.title)` on its own.

### The cap comment

- **Location:** `workflows/redline-loop.js:3054-3064`, `capComment`; `findingLine` at line 820.
- **Relevance:** the cap comment's Still open list is `open.map(findingLine)`, the same call the review body's finding line uses, so it has no `postedText` call of its own (`shape.md`, Unattended answer 3).

### The loop test's repository-rule scenario

- **Location:** `tests/loop-test.mjs`, section 12, lines 990 to 1046.
- **Relevance:**
  - line 1036 is the guided `titled` run, which changes R1-2's title to `Field <b> renamed @config` and pins its Left to you line (line 1037);
  - line 1039 is the autopilot run, whose Deferred lines line 1045 pins with the plain titles `title R1-2` and `title R1-3`;
  - Task 3 adds an autopilot run with the `titled` run's title after line 1046.
- **Key patterns:** `{ ...scenario, reviews: [[three[0], { ...three[1], title: ... }, three[2]], []] }` changes one title and keeps the rule match; `comment(calls, 'handoff comment')` reads the handoff body; `go()` adds a run-record check for a run that reaches its handoff (lines 246 to 250).

### The loop test's posted-text sections

- **Location:** `tests/loop-test.mjs`, section 15's escaping scenario (lines 1590 to 1667) and section 16 (lines 1718 onward).
- **Relevance:**
  - section 15 pins each whole-text trigger, the backslash at case 14 (lines 1616 and 1645) and its check at line 1662, which R3-3's narrowing option would re-pin;
  - section 16 pins the finding line (line 1743) and the Deferred line's `shipped` branch (line 1751).

### README Known limits and the posting rules

- **Location:** `README.md:104-107`, the bullet "A finding's description, its proposed fix and Redline's replies are posted as written" and its costs list; `docs/running.md:126-137`, "How the review is posted", the bullet "What is escaped and neutralised (#87)".
- **Relevance:** Task 2 adds the inline link's cost after README line 106 and to `docs/running.md` line 137. R3-3's options would reword README line 107 and the trigger list at line 137. Line 127 lists the Deferred line among the escaped lines.

### The #87 specs

- **Location:**
  - `agent-os/specs/2026-11-12-0948-87-posted-text-mentions-and-escaping/shape.md`: decision 5 (line 43), answer 15 (line 63), the Evidence's backslash renders (lines 139 and 147), and the supersession of the base's fallbacks (line 235);
  - `agent-os/specs/2026-11-12-1310-87-joiner-reference-and-closing-line/shape.md`: the Evidence row for a link destination (line 96);
  - `agent-os/specs/2026-11-12-1310-87-joiner-reference-and-closing-line/plan.md`: the As built gate table (lines 299 to 305).
- **Relevance:**
  - decision 5 and answer 15 set the trigger list R3-3 questions;
  - the Evidence row is the render R3-1 cites;
  - the gate table gives the counts this round starts from.

### Earlier round with the same kind of task

- **Location:** `agent-os/specs/2026-11-11-1952-86-review-round-5/plan.md`, Task 2.
- **Relevance:** a test-only nit proven red by a temporary edit of `workflows/redline-loop.js`, restored byte for byte before a one-file commit. Task 3 follows its layout.

### This PR's earlier rounds

- **Location:** `agent-os/specs/2026-11-12-1044-89-review-round-1/shape.md` and `plan.md`; `agent-os/specs/2026-11-12-1044-89-review-round-2/redline/handoff.md`.
- **Relevance:** R1-1 is the only earlier finding, and round 2 had none, so no finding of this round was dispositioned before. Round 1's plan is the layout this plan follows.
