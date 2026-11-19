# References for #96: place findings inline on a file whose patch the files listing omits

## Similar Implementations

### The placement this spec extends (#33)

- **Location:** `scripts/redline-gh.sh`: `pr_files`, `diff_positions`, `place_comments`, and the `place` and `post-review` subcommands.
- **Relevance:** the one place a comment's path, side and line are checked against the hunks before a review is posted.
- **Key patterns:** the listing is read once and passed on; the hunks are streamed as `@@@redline-file<TAB>path` followed by the patch, into one awk pass that prints `path<TAB>side<TAB>line`; the positions reach `jq` through a temp file and `--slurpfile`, never the command line; a moved comment sits behind `<!-- redline:<id> -->`, then its path and line, then its text; `moved` is `[{id, path, line, side}]`.

### The earlier investigation (#68)

- **Location:** `agent-os/specs/2026-11-15-0730-68-gate-result-sized-for-the-workflow/shape.md`, "Reported, not built: why rounds 4 and 5 of PR #94 placed no finding inline".
- **Relevance:** the report #96 was opened from: the cause, the two files and their sizes on #94, and the one thing it left unverified, which this spec measured.
- **Key patterns:** a claim about GitHub is recorded with the pull request, the date and the numbers it was read off.

### The placement cases and the shim

- **Location:** `tests/gh-test.sh`, the `# place` cases, the files generated for PR 7 and PR 9, and the `gh` shim; `tests/gh-fixtures/files-7-special.json`, `review-7.json`, `review-7-placed.json`.
- **Relevance:** the cases decision 4 keeps as they are, and the harness the new cases join.
- **Key patterns:** a large fixture is generated with `jq` in the temp directory, never checked in; the shim serves an endpoint from `$PAGES` and refuses what it has no fixture for; a write the shim answers (`gh issue create`, the thread mutation) is logged to a file the cases read, so a case pins how many calls were made and with what.

### A recorded round to replay (#94, round 9)

- **Location:** `agent-os/specs/2026-11-15-0822-94-review-round-9/redline/round-9-review.json`.
- **Relevance:** seven comments, all on `workflows/redline-loop.js`, none placed inline when the round was posted. Five are inside the hunks of #94's merged diff and two are not.
- **Key patterns:** the review file is what `place` and `post-review` take, so a recorded round can be placed again, read-only, against the pull request as it stands.

### Posting past a refusal that names its cause

- **Location:** `scripts/redline-gh.sh`, `defer` (the lookup before the create, #95) and `resolve-threads` (a read, then one mutation per thread, #39).
- **Relevance:** the two writes that already do more than one call, and how their headers say when they stop and with which exit code.
- **Key patterns:** nothing repeats a call that failed; a second call is a different request, decided from what the first one returned; the header states the bound.
