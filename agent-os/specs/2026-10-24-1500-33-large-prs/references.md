# References for large PRs (#33) and round numbering

## Similar Implementations

### The hunk walker and the move-to-body

- **Location:** `scripts/redline-gh.sh`, `diff_positions` and `place_comments` (lines 57-91 before this spec)
- **Relevance:** the awk that turns a unified diff into the positions GitHub can anchor, and the jq that moves every comment off a hunk into the body. Both are reused per file: the walker reads one file's patch at a time with the path passed in, since a per-file patch carries hunks only.
- **Key patterns:** `path<TAB>side<TAB>line` positions; a context line on both sides; `side` defaults to RIGHT.

### The reviews fetch

- **Location:** `scripts/redline-gh.sh`, `has-review` (lines 148-157 before this spec)
- **Relevance:** `last-round` reads the same review bodies and the same `^Redline round N` anchor; `has-review` stays as it is and is pinned as the neighbour.

### The loop's post mock and the replay check

- **Location:** `tests/loop-test.mjs`, the `post` branch of `mock()` (lines 43-46) and `samePrefix`
- **Relevance:** the zero-thread scenario scripts the post mock to return no inline comments; the `firstRound` scenario checks labels, prompts and the spec folder; the replay checks prove the existing scenarios are untouched.

### The prefs harness

- **Location:** `tests/prefs-test.sh` (lines 1-30)
- **Relevance:** the shape of `tests/gh-test.sh`: `set -uo pipefail`, `ok`/`bad`, a throwaway repository under the temp directory, a final `N passed, N failed` line.

### The guard's gh-read rows

- **Location:** `tests/guard-cases.tsv` rows for `redline-gh.sh files 42`, `login`, `issues-search`, `place`, `diff 5`
- **Relevance:** the rows for `last-round` sit beside them, with a deny for a role without `gh-read` as the neighbour.

## The failure this spec fixes

- **Location:** `~/.claude/projects/-Users-michaelwitwicki-Code-Sites-loser-epic-723-live-commenting/18d8d4cf-b336-4df7-adbd-149c280bbd76/workflows/wf_dd6e8938-55c.json` (outside the repository)
- **Relevance:** the GitHub agent's `post r1` result on Losers League #778: `posted: true`, `comments: []`, `movedToBody: ["R1-1","R1-2","R1-3"]`, and an `error` string ("Review posted, but no inline comments were placed…") that the loop treated as a stage error.
