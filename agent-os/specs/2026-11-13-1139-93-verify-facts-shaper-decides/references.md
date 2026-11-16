# References for issue #93: verify facts, the shaper decides

Line numbers are as read at shaping time (2026-11-13, `main` at `d6876e8`).

## Similar Implementations

### The loop and its endings

- **Location:** `workflows/redline-loop.js:3494-3606`
- **Relevance:** the done rule today: the split into correctness and nits (`:3562`), the final nit pass (`:3565`, set at `:3603`), the cap (`:3586`), the ending on no commits (`:3596`).
- **Key patterns:** the next round's kind is one expression over what the round held; every ending goes through `finish()`.

### The verifier's intake

- **Location:** `workflows/redline-loop.js`: `FINDING_SCHEMA :503`, `COVERAGE_OUTCOMES :536`, `LISTED_ELSEWHERE :545`, `REVIEW_SCHEMA :552`, `review() :2145`, `accountCoverage() :1418`, `coverageSentence() :1017`, `setAsideBlock() :936`
- **Relevance:** where For the person, `outside` and `disproportionate` are read, counted and rendered.
- **Key patterns:** the set-aside block lists every candidate the round lists nowhere else, by one rule and not by a list of outcomes; a candidate the verifier left out is kept, with a warning.

### The verify and shape prompts

- **Location:** `workflows/redline-loop.js`: `reviewPrompt() :1234`, `candidatesBlock() :1317`, `shapePrompt() :1500`, `resolvePrompt() :1588`, `NEVER_DECIDE :319`
- **Relevance:** the rules the agent files state are stated here too; the loop test pins one key phrase of each in both.

### Dispositions, outcomes and replies

- **Location:** `workflows/redline-loop.js`: `SHAPE_SCHEMA :636`, `JUDGMENT_CALL_SCHEMA :613`, `checkDispositions() :2436`, `checkCalls() :2463`, `forceAskRules() :2523`, `revise() :2673`, `outcomesFor() :2384`, `describeOutcome() :2413`, `replyBody() :1199`, `threadCandidates() :3175`
- **Relevance:** a new disposition needs its schema value, its check, its outcome kind, its reply and its place in the sweep.
- **Key patterns:** the override path (`overridesFor :2729`) already applies a disposition the person changed; a result the workflow cannot use is a stage error naming the agent to rerun.

### Posted bodies

- **Location:** `workflows/redline-loop.js`: `findingLine() :849`, `reviewBody() :861`, `commentBody() :1026`, `handoffComment() :2965`, `capComment() :3102`, the agent-files sentence `:244`, `personLabel :186`
- **Relevance:** the layouts this spec changes, and every place the runner is named.
- **Key patterns:** the finder's and the verifier's text goes through `postedText()`; what the workflow writes is posted as written.

### Reading earlier rounds back

- **Location:** `scripts/redline-gh.sh`: `prior-findings`, the finding-line pattern `:334`, `classify :336-344`, the tails stripped `:349`; cases under `# prior-findings` in `tests/gh-test.sh`
- **Relevance:** a reply wording or a finding-line word the reader does not know is read as `decided`, or not read at all.

### The template and its history

- **Location:** `templates/shape-spec-unattended.md` (v3), `templates/history/`, `scripts/redline-setup.sh:426-470` (the fill-in phrases), `tests/setup-test.sh:686-733` (the frozen bodies and `ubody_pin`)
- **Relevance:** what a bump to v4 has to carry: the frozen v3, the new hash, this repository's own section with its three hand edits.

### The human-review pass as the second door

- **Location:** `scripts/redline-gh.sh`: `human-review :368-427`; `skills/redline-revise/SKILL.md`
- **Relevance:** `review @login` already takes a reply that login wrote inside a Redline thread; `review latest` leaves out the runner's own comments.

## Evidence (cited, not copied)

- `SPIKE-72-NOTES.md` section 10, in `redline-internal`: the #817 rerun.
- Losers League pull requests #829 and #817.
- This repository's #86 and #89.
- GitHub's reference for "Create a reply for a review comment" ("This endpoint triggers notifications") and for the GraphQL mutation `addPullRequestReviewThreadReply` (`pullRequestReviewId`: "The Node ID of the pending review to which the reply will belong"), read 2026-11-13.
