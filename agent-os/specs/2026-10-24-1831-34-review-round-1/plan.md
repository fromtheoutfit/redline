# PR #34 review round 1 (launch 2026-10-24-1831): address R1-1 to R1-8

Shaped by Redline in unattended mode.

## Context

Redline round 1 on PR #34 (large PRs, #33; round numbering, first half of #10) found three correctness issues and five nits. Seven are planned as fixes (R1-1, R1-7, R1-2, R1-3, R1-4, R1-5, R1-6). R1-8 was a judgment call returned to the person, who chose option A on 2026-10-25 (Decided by: @michaelfromtheoutfit); Task 9 implements it. Nothing is deferred. See `shape.md`.

Constraints for every task:

- **Files no role may write stay untouched:** `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, `.claude/settings*.json`, `scripts/checks-template.sh`, `scripts/redline-gate.sh`, and the Verification Gate section of `.claude/commands/agent-os/shape-spec.md`. No task here needs them.
- A file a task does not name is not changed in this round.
- One commit per finding, in task order; the spec folder in the round's first commit or on its own.
- **Commands for the implementer.** The guard does not let a role run the harnesses directly, so every harness result comes from the gate script: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-24-1831-34-review-round-1/redline/snapshot.json` and read the named check's `stdout` in its JSON (`loop` for `tests/loop-test.mjs`, `gh` for `tests/gh-test.sh`). Every other proof is a plain `grep` from the repository root. Red before green (`testing/tests.md`): add a task's cases first, run the gate script and see the check fail on them, then make the fix. At the start of the round the summaries were `loop 129 checks passed, 0 failed` and `gh 42 passed, 0 failed` (PR description).

## Task 1: Save spec documentation

Files: `agent-os/specs/2026-10-24-1831-34-review-round-1/` (`plan.md`, `shape.md`, `standards.md`, `references.md`; `redline/` is the workflow's and is left alone).

The shaper has written these four files. Commit the folder in the round's first commit or on its own, never mixed into a finding's commit.

## Task 2: R1-1, the "already posted" check looks for the reply's own line, not the marker

Files: `agents/redline-github.md`, `workflows/redline-loop.js`, `README.md`, `tests/loop-test.mjs`.

`pr-comments` prints review bodies as well as issue comments (`README.md:279`), and the round's review body already carries `<!-- redline:<id> -->` for every moved finding (`scripts/redline-gh.sh:139`). So the marker cannot tell whether the reply was posted. The reply's second line, `**<id>** · ... · from the Redline round <n> review body` (`replyEntry`, `workflows/redline-loop.js:545`), is in the reply only.

- **`agents/redline-github.md:23`**, the reply paragraph: replace "(check `redline-gh.sh pr-comments <pr>` for the marker when unsure)" with "(when unsure, check `redline-gh.sh pr-comments <pr>` for the reply's second line, `**<finding>** · ... · from the Redline round <n> review body`: only the reply carries it, while the marker alone also sits in the review body, so finding the marker proves nothing)".
- **`pushReplyPrompt`** (`workflows/redline-loop.js:825`), the comment_id 0 sentence: after "run `${GH} comment ${pr} <file>` once for it instead of reply and report reply_id 0.", add (inside the template string, with its backticks escaped): "To check whether it is already posted, look in `${GH} pr-comments ${pr}` for its second line (`**<id>** · ... · from the Redline round ${round} review body`), never for the marker, which the review body also carries."
- **`README.md:303`**: append "To check whether one is already posted, the agent looks for that second line in `pr-comments`, never for the marker, which the review body also carries."
- **Check** in `tests/loop-test.mjs` section 8, after "no inline: the prompt sends a comment_id 0 reply through comment" (line 379), suggested: `check('no inline: the already-posted check is the reply\'s own line, not the marker', pick(run.calls, 'push and reply r1').prompt.includes('look in `/p/scripts/redline-gh.sh pr-comments 114` for its second line') && pick(run.calls, 'push and reply r1').prompt.includes('from the Redline round 1 review body`), never for the marker'))`.

Proof:
- The `loop` check passes; before the prompt change, the new check fails.
- `grep -c "for the marker when unsure" agents/redline-github.md` prints 0, and `grep -c "from the Redline round <n> review body" agents/redline-github.md` prints 1.
- `grep -c "never for the marker" README.md` prints 1.

## Task 3: R1-7, a reply's route comes from whether a review is on GitHub

Files: `workflows/redline-loop.js`, `agents/redline-github.md`, `skills/redline-revise/SKILL.md`, `README.md`, `tests/loop-test.mjs`.

A missing thread id means "moved to the body" only when a review is on GitHub. In a dry run, and in `/redline:redline-revise` over a review that was never posted, it means there is no review. Before this PR such a reply wrote its file and posted nothing.

- **The record knows whether a review is on GitHub.**
  - Main loop record (`workflows/redline-loop.js:1662`): add `reviewPosted: posted.posted || Boolean(posted.skipped)`.
  - Revise-only record (`:1614-1617`): add `reviewPosted: A.revise.posted === true`. An absent field means false, the pre-PR behaviour.
- **`replyEntry`** (`:538-547`) takes the record's `reviewPosted` as a sixth argument and adds a `route` field to each reply:
  - `'thread'` when `commentId` is set, with the plain `replyBody`;
  - `'issue-comment'` when there is no `commentId` and `reviewPosted` is true, with today's marker body;
  - `'file-only'` otherwise, with the plain `replyBody`.

  Update the comment above it to name the three routes. Both callers pass `record.reviewPosted`: `droppedReplies` (`:1175`) and the revise replies (`:1421`).
- **`pushReplyPrompt`** step 2 (`:824-826`, with postToGitHub true) says what each route does:
  - `thread`: run `${GH} reply ${pr} <comment_id> <file>`;
  - `issue-comment`: the finding sits in the review body behind its marker and the file already starts with it, so run `${GH} comment ${pr} <file>` once instead of reply (Task 2's check sentence stays here) and report reply_id 0;
  - `file-only`: no review is on GitHub for it, so write the file, post nothing and report reply_id 0.

  Keep "Never reply twice in one thread, and never post a body finding's comment twice." The dry-run branch is unchanged. Existing checks that quote the old sentence (`tests/loop-test.mjs:379`, and Task 2's new check) are updated to the new wording, still asserting the `comment 114 <file>` spelling and the second-line check.
- **`agents/redline-github.md:23`**: the comment_id 0 sentence becomes route-based. "Each reply carries a `route`: `thread` goes through `reply`; `issue-comment` belongs to a finding in the review body behind `<!-- redline:<finding> -->` and goes through `redline-gh.sh comment <pr> <file>` once (with Task 2's check), reporting `reply_id` 0; `file-only` means no review is on GitHub (a dry run, or a revise over a review that was only written): write the file and post nothing, reporting `reply_id` 0."
- **`skills/redline-revise/SKILL.md`**:
  - Step 3 (line 15) gains a first sentence: "Run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh has-review <pr> <N>`: exit 0 sets `revise.posted = true`; exit 1, or a dry run, sets `revise.posted = false`; exit 2 stops with its stderr line."
  - "When the review was posted" then reads "When `revise.posted` is true".
  - Step 6 (line 18): `revise: {round, specFolder, findings, commentIds, posted}`.
- **`README.md:303`**: the body-finding sentence gains "when the round's review is on GitHub; in a dry run, or a revise over a review that was never posted, the reply is written to its file and nothing is posted".
- **`tests/loop-test.mjs`**:
  - The `post` branch of `mock()` (lines 43-49) answers a dry run as the real agent does: when the prompt includes `postToGitHub: false.`, return `dryRun: true, posted: false, skipped: '', review: { id: 0, html_url: '', comments: [], movedToBody: [] }`. The existing dry-run checks (lines 303-304, 345-347) must still pass.
  - New checks in section 8, suggested:
    - `dry run: no review, so every reply is file-only with the plain body`: on the `dry run` scenario's shape (`postToGitHub: false`), every entry of `replies(run.calls, 'push and reply r1')` has `route === 'file-only'`, `comment_id === 0`, and a body starting `Redline round 1:` with no `<!-- redline:`.
    - `no inline: a posted review routes body findings to issue-comment`: in the existing `no inline threads` scenario, every reply has `route === 'issue-comment'`.
    - `moved: the inline reply is a thread`: in the `one finding moved to the body` scenario, R1-1 is `thread` and R1-2 is `issue-comment`.
    - `revise-only: an unposted review writes reply files only`: launch with `revise: { round: 1, specFolder: 'agent-os/specs/2026-10-20-1600-114-review-round-1', findings: [f('R1-1', 'nit')], commentIds: {} }` (no `posted`) and `commitIds: [['R1-1']]`. Every reply is `file-only`, and the push-and-reply prompt names all three routes.
    - `revise-only: a posted review with no thread id routes to issue-comment`: the same with `posted: true`; the reply is `issue-comment` and its body starts `<!-- redline:R1-1 -->`.

Proof:
- The `loop` check passes; before the loop change, the new dry-run and revise-only checks fail.
- `grep -c "revise.posted" skills/redline-revise/SKILL.md` prints at least 2.
- `grep -c "file-only" agents/redline-github.md` prints at least 1.

## Task 4: R1-2, `--help` prints the whole header

Files: `scripts/redline-gh.sh`, `tests/gh-test.sh`.

- **`scripts/redline-gh.sh:50`**: `usage() { sed -n '2,/^$/p' "$0" >&2; exit 2; }`, as `scripts/bash-conventions.md:19` requires.
- **Cases** in `tests/gh-test.sh`'s `# usage` section (after line 137), suggested: capture `gh --help` stderr into `"$WORK/err"` and its exit code; `is "usage: --help exits 2" "$code" "2"`; `has "usage: --help prints the writes section to its last line" "$(cat "$WORK/err")" "update <n> <title|-> <file> [<copy>]"`; `is "usage: --help stops at the header's end" "$(grep -c 'set -euo pipefail' "$WORK/err")" "0"`.

Proof:
- The `gh` check passes; before the `sed` change, the second case fails.
- `grep -c "2,34p" scripts/redline-gh.sh` prints 0.

## Task 5: R1-3, a changed rename without a patch is not called unchanged

Files: `scripts/redline-gh.sh`, `tests/gh-fixtures/files-7-special.json`, `tests/gh-test.sh`.

- **`synthesize_diff`** (`scripts/redline-gh.sh:96-98`): `elif .status == "renamed" and (.changes // 0) == 0 then "(no patch: renamed, no text changes)"`. A rename with `changes` above 0 falls through to `(no patch: binary or too large for GitHub)`. The comment above the function (lines 87-89) names the two messages. "No text changes" rather than "contents unchanged": GitHub counts no lines for a binary file, so a renamed binary whose bytes changed also reports 0 (see `shape.md`, R1-3).
- **`tests/gh-fixtures/files-7-special.json`**: insert two entries before `app/Legacy/Gone.php`, so it stays the last file:
  - `{"filename": "app/Services/Moved.php", "status": "renamed", "previous_filename": "app/Services/Was.php", "changes": 0}`
  - `{"filename": "public/build/vendor.min.js", "status": "renamed", "previous_filename": "public/build/old.min.js", "changes": 4200}`
- **`tests/gh-test.sh`**:
  - Line 33: the page-2 filler becomes `range(100; 144)`, so PR 7 still has 150 files.
  - The header comment (lines 8-10) says "44 generated and the six special files" and names the two renames.
  - Line 102 ("diff: exactly one no-patch line") becomes three cases, suggested:
    - `is "diff: two binary-or-too-large lines" "$(grep -c '^(no patch: binary or too large for GitHub)$' <<<"$diff_out")" "2"`
    - `has "diff: a rename with no text changes says so" "$diff_out" $'diff --git a/app/Services/Was.php b/app/Services/Moved.php\n--- a/app/Services/Was.php\n+++ b/app/Services/Moved.php\n(no patch: renamed, no text changes)'`
    - `has "diff: a changed rename without a patch is not called unchanged" "$diff_out" $'+++ b/public/build/vendor.min.js\n(no patch: binary or too large for GitHub)'`
  - Every other case keeps its expected value (150 files, 150 headers, Gone.php last).

Proof:
- The `gh` check passes; before the jq change, the new cases fail.
- `grep -c "contents unchanged" scripts/redline-gh.sh` prints 0.

## Task 6: R1-4, the review body's closing sentence is true when findings move

Files: `workflows/redline-loop.js`, `tests/loop-test.mjs`.

- **`reviewBody`** (`workflows/redline-loop.js:485`): the closing line becomes "Each finding has an inline comment with the detail or, where GitHub could not anchor it, sits under Not placed inline below. Redline replies in the finding's thread, or in a PR comment that opens with its marker, once the round's fixes are committed."
- **Check** in `tests/loop-test.mjs` section 8, in the `no inline threads` scenario, suggested: `check('no inline: the review body does not promise an inline comment for every finding', pick(run.calls, 'post r1').prompt.includes('sits under Not placed inline below') && !pick(run.calls, 'post r1').prompt.includes('Redline replies in each thread'))`.

Proof:
- The `loop` check passes; before the wording change, the new check fails.
- `grep -c "Redline replies in each thread" workflows/redline-loop.js` prints 0.

## Task 7: R1-5, the precheck reads the local file count instead of counting lines

Files: `skills/redline/SKILL.md`.

- **Precheck step 7** (`skills/redline/SKILL.md:82`): replace "Cross-check it against `git diff --name-only origin/<baseRefName>...HEAD`, run plainly, counting its lines yourself:" with "Cross-check it against `git diff --shortstat origin/<baseRefName>...HEAD`, run plainly: its one line starts with the local count (`336 files changed`, `1 file changed`; no output means 0), with the same rename handling as GitHub's list, so read the number, never count paths:". The rest of the step is unchanged (the mismatch warning, the git-failure warning, the 300 warning, `maxFiles`).

Proof:
- `grep -c "name-only" skills/redline/SKILL.md` prints 0.
- `grep -c "git diff --shortstat origin/<baseRefName>...HEAD" skills/redline/SKILL.md` prints 1.
- The `manifest` check (`claude plugin validate .`) passes.

## Task 8: R1-6, the review body names earlier rounds without "Rounds 1 to 1"

Files: `workflows/redline-loop.js`, `tests/loop-test.mjs`.

- **`reviewBody`** (`workflows/redline-loop.js:470`): with `firstRound` 2, `Reviewed the whole pull request. Round 1 is already on this PR; this run starts at round 2.`; with `firstRound` above 2, `Reviewed the whole pull request. Rounds 1 to ${firstRound - 1} are already on this PR; this run starts at round ${firstRound}.`; with `firstRound` 1, unchanged.
- **`tests/loop-test.mjs`**:
  - Line 394's check expects `'Reviewed the whole pull request. Round 1 is already on this PR; this run starts at round 2.'`.
  - Line 405's check (`firstRound` absent) becomes `!pick(run.calls, 'post r1').prompt.includes('already on this PR')`.
  - New scenario, suggested: `go('firstRound 4', { ...baseArgs, firstRound: 4 }, { reviews: [[f('R4-1', 'nit')], []], commitIds: [['R4-1']] })` and `check('firstRound: the plural names the earlier rounds', pick(run.calls, 'post r4').prompt.includes('Rounds 1 to 3 are already on this PR; this run starts at round 4.'))`.

Proof:
- The `loop` check passes; before the wording change, the changed and new checks fail.
- `grep -c "were posted by an earlier run" workflows/redline-loop.js` prints 0.

## Task 9: R1-8, a posted review that accounts for every finding continues past the agent's `error`

Files: `workflows/redline-loop.js`, `tests/loop-test.mjs`.

Decided: **A. Continue on a consistent posted review** (`shape.md`, Decisions, R1-8; 2026-10-25; Decided by: @michaelfromtheoutfit). The loop treats a posted review that carries an agent error as a warning and continues into shaping when the review has an id and every finding is inline or moved to the body, and still stops the run otherwise. Lands after Task 3, whose post-mock change it builds on.

- **`post()`** (`workflows/redline-loop.js:1106-1108`, the `if (posted.error) { throw stageError('post', ...) }` block): when `posted.error` is set, continue only if all of these hold:
  - `posted.posted` is true;
  - `posted.review` is an object with `id > 0` (guard for a missing `review`; `Number(posted.review.id) > 0`);
  - every `f.id` in `active` is in `posted.review.comments[].finding` or in `posted.review.movedToBody` (both read as `[]` when not arrays).

  Then push `round ${round}: the GitHub agent reported an error for a review it posted; continuing: ${posted.error}` to `warnings` and fall through to the existing moved/no-inline warning branch. Otherwise throw the same `stageError('post', ...)` as today, message unchanged. A result with no `error` follows today's path untouched. Update the comment above the block to say an `error` on a consistent posted review is a warning (the #778 shape), and on anything else still stops the run (a `post-review` that exited after the POST, with no thread ids, is caught here).
- **`tests/loop-test.mjs`**:
  - The `post` branch of `mock()` (lines 43-49, after Task 3's dry-run change) takes `scenario.postError`: when set, the result's `error` is that string, the rest unchanged. `scenario.postReviewId` (default 1) sets `review.id`, and `scenario.postDrop` (an id list) leaves those findings out of both `comments` and `movedToBody`.
  - New scenarios and checks in section 8, after the `no inline threads` scenario (line 373), suggested:
    - `go('no inline with an agent error', baseArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], []], commitIds: [['R1-1', 'R1-2']], noInline: true, postError: 'no inline comment could be anchored' })`; `check('posted error: the #778 shape continues into shape with a warning', <the run reaches done, a shape call for round 1 is in run.calls, and a warning includes 'reported an error for a review it posted; continuing: no inline comment could be anchored'>)`.
    - The same with `postReviewId: 0`; `check('posted error: a posted review with no id still stops at post', <the run ends with a stage error at post naming 'posting the round 1 review failed', and no shape call>)`.
    - The same with `noInline: false, postDrop: ['R1-2']`; `check('posted error: a finding in neither list still stops at post', <stage error at post, no shape call>)`.
  - Every existing check keeps its expected value (no scenario before this sets `postError`).

Proof:
- The `loop` check passes; before the `post()` change, the first new check fails (the run stops at post) and the other two pass.
- `grep -c "reported an error for a review it posted" workflows/redline-loop.js` prints 1.

## Task 10: Verification Gate

Gate steps 1 to 8, in a Redline run: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-24-1831-34-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of those steps, so the gate text stays the source.

Steps 9 and 10 stay as written in `.claude/commands/agent-os/shape-spec.md`:

- **Step 9, standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. Item 6 (R1-8) is drafted for option A, the person's decision. The standards approver approves the list, and the implementer applies it in its own commit, touching only the files the list names: `agent-os/standards/workflow/agents.md` (items 1, 2, 4 and 6) and `agent-os/standards/testing/tests.md` (item 3).
- **Step 10, spec folder.** `plan.md` gets an As built section, and any deviation is recorded under Decisions in `shape.md`.
