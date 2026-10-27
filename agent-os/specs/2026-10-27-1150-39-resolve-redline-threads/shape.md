# Resolve the threads Redline opened (#39) — Shaping Notes

## Scope

Issue #39: Redline resolves the inline review threads it opened once their findings are settled and the run has reached Finish with a green gate, and never a thread a human opened or last spoke in. Two wrapper subcommands (`redline-gh.sh threads`, read-only, and `redline-gh.sh resolve-threads`, the GitHub agent's), a sweep step in Finish that the workflow selects and the GitHub agent only calls, one line in the handoff comment (`Resolved n threads; m left open: <ids and why>`), guard rows, and tests in the gh and loop harnesses.

Shaped by hand with `/agent-os:shape-spec` on 2026-10-27; the person makes the commits.

## Decisions

- **Settled** means outcome kind `fixed`, `deferred` or `decided` (an ask the person answered, whatever they chose), as `outcomesFor` in `workflows/redline-loop.js` records it. `not-changed` stays open (the issue). **`dropped` stays open** (asked 2026-10-27): a finding the person deselected on the review dial is one the teammate should still see; the handoff line lists it under left open as `dropped`. A body finding (`post.movedToBody`, no `commentIds` entry) has nothing to resolve and is not listed.
- **Never a human's thread.** A human review pass's record (`record.human`) is never swept: its `commentIds` are the teammate's thread roots. A Redline thread with a human reply after Redline's last reply stays open; the wrapper reports it as skipped and the handoff line says why.
- **Redline's comments are known by id, not by author**, since Redline posts from the person's login. The inline id (`record.commentIds[f.id]`, kept today) and the reply id, which the GitHub agent already returns as `replies[].reply_id` and the loop dropped until now: the loop keeps `record.replyIds` from both push sites.
- **One id list, both ends must be Redline's** (asked 2026-10-27; chosen over "last comment only" and over two lists in a file). `resolve-threads <pr> <ids…>` takes every settled finding's inline id and reply id. A thread is resolved only when its first comment and its last comment are both in the list, so the wrapper enforces "never a human's thread" on its own, whatever the loop selects; a thread with a human's last word, a thread a human opened, an already resolved thread and an id in no thread are skipped with a reason each.
- **The sweep runs before the handoff comment** (asked 2026-10-27; the issue's order, after the handoff, could not report the result in the handoff). Finish order: PR description, `resolve threads`, handoff comment with the review request, record files, record commit. The handoff line reports the wrapper's real result. A sweep error stops the run at `finish`, as a PR-description error does.
- **Which Finish sweeps** (asked 2026-10-27): the handoff and the human review summary (only the nit-pass round's threads; the summary gains the same sentence). A capped run sweeps nothing: the issue's "Finish with a green gate". Skipped in a dry run (`postToGitHub` false) and with `no push` (the fix commits are not on GitHub). `review only` and a hand-off never reach Finish, so nothing is skipped there; the loop test asserts the absence.
- **The line**: `Resolved n threads; m left open: R1-2 (a reply after Redline's), R2-1 (not changed)`, after the round sentence of the handoff comment, or one more sentence on the human summary's line. Omitted when the sweep did not run; the existing "commits are local only" line already explains a `no push` run.
- **Guard** (asked 2026-10-27): the guard decides by the subcommand word alone and refuses raw `gh` to every role, so `resolve-threads` needs no guard line (`gh-all` covers it for the github role and refuses it everywhere else), read-only `threads` joins `GH_READ` as the bash-conventions standard says, and the mutation string is pinned by a gh-test case, not a guard row; a guard row pins that raw `gh api graphql` with the mutation is refused even to the github role, so the wrapper is the only route. The guard change is the person's, as CLAUDE.md requires, and this spec is run by one.
- **GraphQL is new in the wrapper**: the two documents are fixed strings in `redline-gh.sh`, parameterised by `-F` variables only (`owner`, `name`, `number`, `endCursor`, `threadId`), never built from arguments. `gh api graphql --paginate --slurp` follows `pageInfo` through `$endCursor`; gh 2.48.0 or newer is already required.
- **Deviations while building** (see "As built" in `plan.md`): the human-opened fixture case gives only the Redline reply's id; the sweep's schema is `SWEEP_SCHEMA`; `not changed` is unreachable in a finished run, so the loop test's open cases are a skipped thread and a dropped finding; the dropped reason reads `dropped by @<login>`; the handoff line is absent when no Redline thread exists at all, not only when the sweep is off.
- Out of scope: resolving threads from earlier runs (only the ids this run posted are known); unresolving anything; a thread opened by a human, ever.

## Context

- **Visuals:** None (a CLI plugin; GitHub's thread view is the only screen).
- **References:** see `references.md`: `finish()` and `commitRecord()` in the loop (the workflow picks, the agent calls), the push sites and `outcomesFor`, `human-review` in `redline-gh.sh`, the gh harness's shim, the loop harness's mock, the guard's `GH_READ` rows, the #36 spec.
- **Product alignment:** `agent-os/product/mission.md`: "nothing an agent does is hidden from the review thread" (every resolve is reported in the handoff with what stayed open and why) and "Decisions stay with people" (a human's thread, and a thread a human last spoke in, is theirs to resolve). Confirmed 2026-10-27.

## Standards Applied

- scripts/bash-conventions — a read subcommand joins `GH_READ` in the same change; JSON only on stdout; usage exit 2; the header is the documentation; a value that grows with the PR reaches jq through a file
- scripts/guard — every guard change proven by a `guard-cases.tsv` row beside its neighbour; `gh` refused to every role, so the wrapper is the one route
- testing/tests — a tested surface gains a case, red before green; the gh harness serves the fixtures and records the mutation; the loop harness proves the selection and the absences
- workflow/agents — the workflow picks, the GitHub agent only calls; a degraded result (a skipped thread) is data, not an error; every reply and the handoff name their owner as before
- workflow/replay — the sweep sits after every prompt a relaunch replays; nothing before a stopping point changes
- prompts/attribution — the handoff line and the agent prompt carry no model or vendor name
- process/standards-retrospective — the retrospective at the end of this spec
- process/internal-notes — this spec carries no private detail beyond GitHub logins where a decision names its owner

## Standards retrospective

Applied 2026-10-27 (for the person's own commit, separate from the code): scripts/bash-conventions (GraphQL as two fixed strings parameterised by `-F` variables; `--paginate --slurp` through `$endCursor`; a write subcommand that reads first and its exit codes), scripts/guard (the guard reads only the subcommand word, so a mutation reaches GitHub through a wrapper subcommand; the raw form pinned refused by a guard row, the text by a gh-test case), testing/tests (the gh harness's thread fixture and the one `gh api graphql` call its shim accepts and logs; the loop test's sweep scenario), workflow/agents (the sweep: the workflow picks, the agent calls, both ends of a thread must be Redline's, reply ids kept, settled and open, where the line goes and when it is absent) and workflow/replay (the sweep is the one read of changing GitHub state, after every stopping point). prompts/attribution, process/standards-retrospective, process/internal-notes and `index.yml` taught nothing new.
