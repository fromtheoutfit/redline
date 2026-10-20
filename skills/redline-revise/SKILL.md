---
name: redline-revise
description: "Redline debug entry point: one revise pass (shape, approve, implement, check, push and reply) over a Redline review already on file, with no re-review. /redline:redline-revise <pr> [round N] [autopilot|guided|plan] [revise fable|opus] [no push] [dry run]. Use only when the person types /redline:redline-revise."
argument-hint: "<pr> [round N] [autopilot|guided|plan] [revise fable|opus] [no push] [dry run]"
---

# /redline:redline-revise

The revise half of Redline, for debugging: it picks up the findings a `/redline:redline-review` (or an earlier run) wrote, and runs one revise pass over them. Arguments: `$ARGUMENTS`

Read `${CLAUDE_PLUGIN_ROOT}/skills/redline/SKILL.md` and follow it, with these differences. That file, read this way, shows the plugin's root as the unexpanded CLAUDE_PLUGIN_ROOT variable; it is this plugin's root, `${CLAUDE_PLUGIN_ROOT}`, wherever it appears (in `pluginRoot` too).

1. **Grammar.** `round <N>` picks the review round to revise; default the newest. `max N rounds`, `reviewer`, `review`, `review only` and `correctness only` do not apply (there is no review in this run); `autopilot`, `guided` and `plan` do, and so does `revise fable|opus`. The settings step runs as in `/redline:redline` for the fields that apply (the dial and the revise model), and the saved file is updated the same way.
2. **Find the review.** The findings file is `<repoRoot>/agent-os/specs/*-<pr>-review-round-<N>/redline/round-<N>-findings.json` (newest folder when several match). Its folder is `revise.specFolder` (repo-relative). Read `findings` from it. None found: stop with one line.
3. **Thread IDs.** When the review was posted, run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh review-comments <pr>` and map each top-level comment (no `in_reply_to_id`) whose body starts with `**R<N>-<k>**` to that finding: `revise.commentIds = {"R1-2": 1234567890, ...}`. In a dry run, or when nothing was posted, leave it empty.
4. **Precheck.** As in `/redline:redline`, except that the tree may hold uncommitted files under `revise.specFolder` (the review's own files) and nothing else.
5. **Snapshot.** Write `snapshot-start.json` into `<repoRoot>/<revise.specFolder>/redline/` (overwrite it) and pass that path as `snapshotPath`.
6. **Launch** `redline:redline-loop` with the same `args` as `/redline:redline` plus `revise: {round, specFolder, findings, commentIds}`. The workflow runs Shape, the hand-off, Resolve, Approve, Implement, Check, and Push and reply for that round, then returns `done` with `reviseOnly: true`. It posts no handoff comment and requests no review.
7. A `handoff` result is handled exactly as in `/redline:redline`, with the same relaunch rule.
