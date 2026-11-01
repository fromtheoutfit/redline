# PR #59 review round 2 — Plan

Shaped by Redline in unattended mode. Round 2 of PR #59 (issue #10). Findings: R2-1 `fix`. Every commit message starts `redline:` and names its finding id.

Allowed paths this round (every task's files, together):

- `agent-os/specs/2026-11-01-0935-59-review-round-2/plan.md`, `shape.md`, `standards.md`, `references.md`
- `workflows/redline-loop.js`
- `tests/loop-test.mjs`
- `agent-os/standards/workflow/agents.md`, `agent-os/standards/testing/tests.md` (the standards retrospective commit only)

---

## Task 1: Save spec documentation

Files: `agent-os/specs/2026-11-01-0935-59-review-round-2/plan.md`, `shape.md`, `standards.md`, `references.md` (written by the shaper). Leave `redline/` untouched. No visuals.

Commit: `redline: save review round 2 spec for PR #59 (#10)`.

## Task 2: R2-1 — the Finish comment resume clause sets posted true and an empty comment_url

Files: `workflows/redline-loop.js`, `tests/loop-test.mjs`.

Tests first, in `tests/loop-test.mjs` (red before green):

1. The `commentClause` constant in the resume scenario (the line beginning `const commentClause = ' Before Step 2, run`) becomes exactly:
   `' Before Step 2, run `/p/scripts/redline-gh.sh pr-comments 114`: when a comment there has exactly the body of the file Step 1 wrote, an earlier attempt posted it, so post nothing, set posted true and comment_url to "" (the script prints no comment URL), and go on to Step 3.'`
   (the outer quotes are the file's single quotes; the inner backticks and the two double quotes are literal).
2. The GitHub mock's default Finish return (the line `return { operation: 'handoff', dryRun: false, posted: true, comment_url: 'u', ...`) takes its `comment_url` from `scenario.finishUrl` when that key is present, else `'u'` as now; extend the comment above it to name `scenario.finishUrl` (#59, R2-1: the URL a resumed Finish comment reports when it found its comment already posted, which is "").
3. The relaunch `const reposted = await go('resume: the handoff comment relaunch', commentArgs, base)` passes `{ ...base, finishUrl: '' }` instead of `base`.
4. A new check after "resume: the handoff comment prompt ends with the line and the comment check": `check('resume: a handoff comment found already posted is reported posted', reposted.res.handoffPosted === true, [reposted.res.handoffPosted, reposted.res.status])`.

Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-01-0935-59-review-round-2/redline/snapshot.json` and see the loop check fail on "resume: the handoff comment prompt ends with the line and the comment check" (the new check passes before and after: it pins the plumbing from `posted` to `handoffPosted` on the resumed path, the neighbouring decision that must not change).

Change, in `workflows/redline-loop.js`, `resumeLine(opts)`: the `finishComment` clause becomes
`` ` Before Step 2, run \`${GH} pr-comments ${pr}\`: when a comment there has exactly the body of the file Step 1 wrote, an earlier attempt posted it, so post nothing, set posted true and comment_url to "" (the script prints no comment URL), and go on to Step 3.` ``
Only the words after "post nothing," change. The gate on `FINISH_COMMENT_LABELS.includes(opts.label) && postToGitHub`, the record commit clause, the generic resume sentence and every first-run prompt stay as they are. The comment above `FINISH_COMMENT_LABELS` ("a Finish comment (handoff, cap-hit, summary) looks for the comment an earlier attempt posted before posting") stays accurate and is not changed.

Neighbours that must not change: "resume: the recheck resume line carries neither clause" and "resume: the handoff comment before a record commit resume carries no clause" still pass; the record commit clause check still passes unchanged.

Proof: `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-01-0935-59-review-round-2/redline/snapshot.json` reports the loop check with exit 0 (`N checks passed, 0 failed`), and `grep -n "set posted true and comment_url" /Users/michaelwitwicki/Code/Claude/redline/workflows/redline-loop.js /Users/michaelwitwicki/Code/Claude/redline/tests/loop-test.mjs` prints one line in each file. The guard allows the implementer no direct `node tests/loop-test.mjs`, so the loop harness runs through `checks.sh` only.

Docs: `workflows/redline-loop.js` → README "Launching": no reader-facing change. Its sentence "A resume at the closing comment first looks for the comment an earlier attempt posted, and one at the record commit for the commit an earlier attempt made, so a request-review or a push that failed after them is retried without posting or committing twice" already describes the behaviour; this change only makes the fields the agent returns on that path (`posted`, `comment_url`) match it. No new config key, subcommand, allow rule or exit code.

Commit: `redline: R2-1 report a resumed Finish comment found already posted as posted (#10)`.

## Task 3: Verification Gate

Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-01-0935-59-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence (gate steps 1 to 9: syntax, manifest, guard, loop, prefs, gate stamp, setup, GitHub wrapper, background).

10. **Docs.** One entry per touched file, as the tasks give them:
    - `workflows/redline-loop.js` (Task 2) → README "Launching": no reader-facing change; the sentence on a resume at the closing comment already says what the clause now makes the agent report.
    - No new config key, subcommand, allow rule or exit code.
11. **Standards retrospective.** Apply the list approved from `shape.md`'s "Standards retrospective (proposed)" in its own commit (`agent-os/standards/workflow/agents.md`, `agent-os/standards/testing/tests.md`). If the approved list is empty, add "Standards retrospective: no changes" under Decisions in `shape.md`.
12. **Spec folder.** `plan.md` gets an "As built" section naming each task's commit and any deviation; a deviation is recorded under Decisions in `shape.md`.
