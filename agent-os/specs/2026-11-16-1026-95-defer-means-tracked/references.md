# References for issue #95: defer means tracked

Line numbers are as read at shaping time (2026-11-16, `main` at `a917143`).

## Similar Implementations

### One revise pass and its stops

- **Location:** `workflows/redline-loop.js`: `revise() :3145`, the plan dial's stop `:3161`, `settle() :3169`, `overridesFor() :3190`, `resolveWith() :3199`, the approve and reshape loop `:3259-3305`, `handoffResult() :3957`
- **Relevance:** where the per-round draft checks go (after shaping, after the first resolve, after each reshape), and the result a stop returns.
- **Key patterns:** a decision enters only after the prompt it answers; an override is applied by the round's first resolve, so a stop after that resolve takes none (`afterApproval :3233`, `declinedAfterRun :3994`); an item a stop hands back is counted in what the stop needs.

### Outcomes, replies and the lists posted under them

- **Location:** `workflows/redline-loop.js`: `outcomesFor() :2694`, `describeOutcome() :2729`, `replyBody() :1342`, `replyEntry() :1234`, `carriedReplies() :1265`, `keepReplyIds() :3065`, `replyStandalone() :3045`, the deferred lists `:3412-3430`, `handoffComment() :3481` (the Deferred section `:3589`), `leftToYou() :3635`, `humanSummary() :3651`, `capComment() :3697`
- **Relevance:** the deferred outcome's new wording, the held replies of the end setting, the handoff and cap-hit sections, and the rule-left entries that leave the Deferred list.
- **Key patterns:** a list posted under an outcome's heading is read off each finding's final outcome; a reply's route comes from whether a review is on GitHub; one reply per thread per pass.

### Finish and where a run ends

- **Location:** `workflows/redline-loop.js`: `finish() :3712` (the read of the highest posted round `:3720-3731`), `sweepThreads() :3863`, `threadCandidates() :3770`, `commitRecord() :3923`, the main loop `:4018-4250` (every `finish(` call, the revise-only path `:4109`, the cap `:4213`)
- **Relevance:** the end-of-run stop and the order of filing inside Finish.
- **Key patterns:** nothing is posted once the round check refuses; the sweep names a thread by the inline comment and the reply Redline posted in it.

### The done rule

- **Location:** `workflows/redline-loop.js`: `needCommits :3345`, `bought :3471`, `fixed :3472`, the next-round choice `:4229-4238`, the cap test `:4213`, `planPaths :3310`
- **Relevance:** a deferral with no mitigation, and a minor fix-diff finding.
- **Key patterns:** a round is bought by what it finds, not by what it commits; `fixed` is the items a commit names.

### The shaper's result and its checks

- **Location:** `workflows/redline-loop.js`: `DEFERRED_SCHEMA :701`, `shapeSchema() :709`, `RESOLVE_SCHEMA :755`, `checkDispositions() :2755`, `checkDeclineReasons() :2865`, `forceAskRules() :2917`, `vetShape() :3126`, `shapePrompt() :1742`, `reshapePrompt() :1812`, `resolvePrompt() :1830` (the rule entries `:1846`, `:1849`), `planPrompt() :1878`, `implementPrompt() :1957`
- **Relevance:** the draft fields, the stage error for a defer with no draft, the follow-up-decline warning, and every prompt that names the dispositions.
- **Key patterns:** the workflow checks a result before it acts on it; a check on the shaper's output runs after the shape and after every reshape.

### Posted text

- **Location:** `workflows/redline-loop.js`: `postedText() :1090`, `readBack() :1102`, `textParts() :1119`
- **Relevance:** the drafted issue's title and body go through the same function.
- **Key patterns:** fields that share a line are one text; a text holding a newline is escaped whole, spans included, so each field of the draft is passed on its own.

### The verifier's facts

- **Location:** `workflows/redline-loop.js`: the finding schema `:571-589` (`severity`, `outsideDiff`), `reviewPrompt() :1382`, `KINDS :376`, the normalisation `:2482`; `agents/redline-reviewer.md:38-42`, `:65`
- **Relevance:** `inFixDiff` is stated the way `outsideDiff` is.

### The GitHub wrapper

- **Location:** `scripts/redline-gh.sh`: `issues-search :277`, `classify :351-361`, `issue-create :511`, `update` (the backup copy it writes under the round's `redline/`); `tests/gh-test.sh`: the fake `gh :72-163`, the `prior-findings` cases `:226-292`, the `resolve-threads` log cases `:334-340`
- **Relevance:** the `defer` subcommand, its record, and the word `prior-findings` reads back.
- **Key patterns:** a check that something was already posted looks for text only that post carries; the fake `gh` refuses every write but the one it logs.

### The saved settings

- **Location:** `scripts/redline-prefs.sh`: the flags `:333-362`, `MERGE :381-399`, `resolve :401-426`, `save :428-444`; `tests/prefs-test.sh :31-98`; `skills/redline/SKILL.md` sections 2, 3, 5 and 7
- **Relevance:** two more fields, one with a repository default as `maxRounds` has.
- **Key patterns:** command line over saved over defaults; `autopilot` and `review only` are per-run verbs and never saved.

### The template and its history

- **Location:** `templates/shape-spec-unattended.md`, `templates/history/`, `scripts/redline-setup.sh` (`load_history :503`, the merge `:629-637`), `tests/setup-test.sh` (`UV`, `UN :23-28`, the merge checks `:742-744`, the freeze `:846-852`, `ubody_pin :857-864`)
- **Relevance:** v4 to v5.
- **Key patterns:** a bump freezes the previous body, pins the new body's hash, and adds a check that the new version's text arrives through a merge.

### The harness for the loop

- **Location:** `tests/loop-test.mjs`: `mock() :45-262` (the shaper's `deferred` entries `:202`, the GitHub agent's labels `:73-151`), `go() :279-302`, `samePrefix() :331`, `replies()` and `replyFor() :321-329`, the guided hand-off `:340-360`, the plan dial `:383-419`, the deferral scenarios `:504-507`, `:2453-2460`, the whole-handoff layout `:2645-2707`
- **Relevance:** the pattern for a new stop and its relaunch, a new GitHub-agent label, and the pinned texts that move.

### The previous spec

- **Location:** `agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/`
- **Relevance:** the layout of `plan.md` and `shape.md`, and the done rule and decline rules this spec extends (its decisions 13 to 19).
