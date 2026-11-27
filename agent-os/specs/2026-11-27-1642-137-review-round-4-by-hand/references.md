# References for PR #137, round 4 by hand

## The pull request's own record

### The #135 spec

- **Location:** `agent-os/specs/2026-11-26-1135-135-refuse-relaunch-other-version/`
- **Relevance:** what #137 set out to do, its answers (a) to (c), its deviations as built, and its probes of what a session loads.
- **Key patterns:** the probe plugin `probe135` and how it was driven (Task 2 uses it again); the relaunch-site table built by running; the one-time gap toward an install older than 0.5.1, which table C's last column is.

### Review rounds 1 to 3, and round 4's review

- **Location:** `agent-os/specs/2026-11-27-0922-137-review-round-1/` to `-round-3/`, and `-round-4/redline/` (`round-4-review.json`, `round-4-findings.json`, `cap-hit.md`)
- **Relevance:** every earlier finding's disposition and reason. Read with each finding here: R3-4 for R4-1, R3-5 and R1-4 for R4-2, R3-6 for R4-3 and the case decision 5 edits, R2-6 for R4-4, R1-7 for the cell left to #138, R1-5 and R2-4 for Task 2.
- **Key patterns:** the reply files' form (`redline/round-<n>-reply-<id>.md`).

## Similar work

### PR #114, round 4 by hand

- **Location:** `agent-os/specs/2026-11-21-1501-114-review-round-4-by-hand/`, with its replies in `agent-os/specs/2026-11-20-2144-114-review-round-4/redline/`
- **Relevance:** the last close-out by hand after a round cap: one class settled by a table, replies in Redline's form posted after the push.
- **Key patterns:** a thread reply is one line, `Redline round 4: fixed in <sha> (<subject>). · decided by: @<login>`; a finding that sat in the review body is answered by a pull request comment that opens with `<!-- redline:<id> -->` and the line naming the finding, the file and "from the Redline round 4 review body".

## Code read

### `scripts/redline-prefs.sh`

- **Relevance:** `run check` (the hand list and the untracked list, R4-1), `run drift`, `version_line`, `copy_line`, and `agent_paths`, the NUL-delimited reader round 3 added.
- **Key patterns:** each kept name printed as a JSON string on its own line (`jq -cn --arg p "$p" '$p'`), then `jq -sc .`.

### `scripts/redline-setup.sh`

- **Relevance:** `version_plugin` (R4-2, R3-5) and `version_installs` (R4-3), with `cmd_version`, which ends on a part's exit 2 with that part's line.
- **Key patterns:** `die2` for a stop with its reason; the installs line built in one jq program; `REDLINE_CLAUDE` for the stub CLI.

### `skills/redline/SKILL.md`

- **Relevance:** the precheck's sentence for `version` (R4-2, R4-3), section 7's hand-off sentences (R4-4), "Save the run record" and the `error` section (table C).

### `workflows/redline-loop.js`

- **Relevance:** the startup check of `args.launch` against `REDLINE_VERSION`, read for table B and not changed. The excuse for a hand-committed path, by exact string against the gate's `unexpected_files`, is why decision 1 needs its Known limits line.

### `scripts/checks-template.sh`

- **Relevance:** the git block's changed list and `tree_state`, measured for table A and not changed (For you to open, 1).

## Tests

- `tests/prefs-test.sh`: the run-marker fixtures (a throwaway repository, a record, a copy of the plugin) that the scratch scripts follow; round 3's quoted-name cases for `run drift`.
- `tests/setup-test.sh`: the installs cases and their stub CLI; the three-places version cases at its end; the fixture copy at another version (decision 7).
- `tests/loop-test.mjs`: section 17a, and the way it runs the workflow with a stub agent, which `B/run-wf.mjs` follows.

## Issues

- #138, the reopen lines for a checkout loaded in place: out of scope; shares table C's "start fresh" cell (decision 3).
- #136, #133, #129: out of scope; no table shows a shared reader.
- #50: the template's untracked line count, a different read from the ones drafted here.
