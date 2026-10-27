# Carry forward undispositioned findings (#35) — Shaping Notes

Shaped by hand on 2026-10-27 with `/agent-os:shape-spec`, in plan mode, one question at a time. The person makes the commits.

## Scope

Issue #35: the known-finding check in a Redline round treats a finding an earlier round *recorded* as one it *dispositioned*. A finding with no disposition (a review-only round, a run that errored after `post`, a cap hit after the review, a hand-off never relaunched) is carried forward into the current round, re-verified, and goes through shape, approve and fix like any other. A finding with a disposition stays tracked and is not re-raised. The review body, the earlier finding's thread and the handoff comment say which happened.

In scope: a read subcommand of `scripts/redline-gh.sh` that lists every posted Redline finding with its disposition; the skill's precheck passing that list in `args`; the reviewer's prompt and agent file; the loop's review body, inline comment, replies, sweep, handoff and result; the three harnesses; the guard's read group; the README and the skill text.

Out of scope: `redline-revise <pr> round N` (the manual path over an undispositioned round, unchanged), human review passes, re-reviews and final nit passes (nothing to carry: they review a fix diff), and the in-run `history()` block (this run's own rounds already carry their outcomes).

## Decisions

The issue's seven decisions, as given in the shaping prompt, stand. The ones below were made while shaping.

1. **The reply is the evidence of a disposition, not `shape.md`.** Asked 2026-10-27; the person chose the reply over `shape.md` off the PR ref and over both. Reasoning: the workflow cannot read files or GitHub itself, so the list has to be gathered before launch; a plan-dial or guided hand-off that was never relaunched leaves a `shape.md` whose `fix` entries already read `Decided by: redline` though nothing was implemented; a dropped finding never appears in `shape.md` at all; a `review only` run leaves no committed folder unless the person commits it. The reply (`Redline round N: ...` in the thread, or the issue comment behind the marker for a body finding) is written only once the disposition was carried out. The reply's fixed wording (`replyBody`, `workflows/redline-loop.js:718-736`) gives the label.
2. **`not changed in this round` carries forward; the other four labels are tracked.** The person's refinement to decision 1: a `fix` disposition with no commit naming it is not handled. Tracked: `fixed`, `deferred`, `decided`, `dropped`, `carried`. Carried forward: `none`, `not-changed`.
3. **The earlier thread gets a reply and is swept.** Asked 2026-10-27; the person chose "reply in it and sweep it" over leaving it alone and over reply-only. When a carried finding is settled, dropped or not changed, its earlier thread gets one reply from this round (`Redline round 2: carried forward as R2-1; fixed in ... · decided by: ...`); a resolved earlier finding's thread gets `Redline round 2: resolved; first reported as R1-4 in Redline round 1. <why> · decided by: redline`. Finish's sweep names the earlier root, any earlier Redline reply in it and this round's reply, so `resolve-threads`'s every-comment rule holds and a teammate's comment keeps the thread open. A reader sees where the finding went and no stale thread is left for the teammate.
4. **A finding carried once is tracked afterwards.** A review body's finding line ending `· first reported as R1-2` marks R1-2 as `carried` (to that id) as soon as the round is posted, whatever its thread says, so a third run never carries both R1-2 and R2-1. R2-1 carries its own disposition. Decided by: redline, from the chain a hand-off never relaunched would otherwise make.
5. **The list enters through `args.priorFindings`.** The skill's precheck runs the new `redline-gh.sh prior-findings <n>` after `last-round` and passes the JSON; `[]` when `firstRound` is 1; a relaunch reuses it byte for byte. The replay standard (`workflow/replay.md`): the first round number enters the same way, and the run's own replies in the old threads would change what a read inside the workflow sees.
6. **The reviewer matches against two structured lists**, and the loop reads fields. Tracked → `knownAs: "R1-1: fixed"`; carry forward → re-verified at head, then a finding of this round with `carriedFrom` or an entry in `resolved: [{id, why}]`. Issues, teammate comments and human-review folders stay the reviewer's own free check, as today.
7. **The loop enforces the accounting.** A carry-forward id the reviewer neither carried nor resolved is carried by the loop as reported (old title, file, line and comment body; a warning names it) rather than dropped: the issue's failure was a silent drop, and the shaper investigates every finding before it sorts it. A `carriedFrom` naming a tracked or unknown id is cleared with a warning; a `resolved` entry naming one is ignored with a warning.
8. **The "first reported as" note is composed by the loop**, in the inline comment and the finding line, so the words are deterministic (the loop's rule for every body it posts) and the reviewer's description stays fresh.
9. **Only the run's first round carries**: it is the whole-PR review. Later rounds, `redline-revise round N` and human passes are unchanged; `carriedFrom` defaults to `""`.
10. **The duplicate check for a reply is this pass's title.** An earlier round's `not changed` reply in a carried finding's thread is not a duplicate of this round's carried-forward reply. The GitHub agent's rule and the push prompt say so.
11. **Guard:** `prior-findings` joins `GH_READ` and the header line, with guard-cases rows, as `scripts/bash-conventions.md` asks of every read subcommand; only the skill runs it. The person makes that commit.
12. **Accepted:** a teammate's comment in an earlier thread counts, for `human-review`'s answered rule, as answered by the carried-forward reply posted after it, as by any Redline round reply. The sweep still skips that thread (a comment that is not Redline's), so the comment stays visible and the handoff names it. Not a Known limit.
13. **The issue's "done when" is live behaviour.** A review-only run followed by a full run, and a run that errors after `post` and is relaunched fresh, are proven on a seed PR after the merge. The harnesses prove the parts: the subcommand's dispositions on a fixture PR, the loop's prompts, bodies, replies, sweep ids and handoff on a scripted run.

14. **As built deviations.** Six small ones, listed in `plan.md` under As built: the duplicate-reply sentence on every Redline round's push prompt, a drop's `outcomeKinds` entry, the mock's root rule left as is, `carried` from both the line and the reply, no version bump, one sentence in the revise skill. None changes behaviour the plan describes or the scope.

## Context

- **Visuals:** None. The change is a wrapper script, the workflow script, two agent files, a skill, their harnesses and prose; GitHub's review and thread views are the only screens.
- **References:** see `references.md`. Every file cited there was opened while shaping; two Explore passes traced the known-finding path and the harness mechanics.
- **Product alignment:** `agent-os/product/mission.md`: "nothing an agent does is hidden from the review thread" (Problem) and "**Decisions stay with people.**" (Solution). A finding carried forward is posted again with its origin; a finding a person dropped is never re-asked; the earlier thread says where its finding went.

## Standards Applied

- `workflow/replay` — the prior findings enter through `args`, before any prompt, as `firstRound` does; the relaunch replays.
- `workflow/agents` — the reviewer returns fields the workflow reads; every reply carries its owner; a message says when it fires in the words of the decision behind it; one JSON return block per agent.
- `testing/tests` — a gh-test fixture PR, loop-test scenarios and guard rows, each red before green, with the neighbouring decision pinned.
- `scripts/bash-conventions` — one JSON object on stdout, exit 2 on usage or a gh error, the header as documentation, the subcommand added to the guard's group, every description of a changed selection reworded.
- `scripts/guard` — a new read subcommand is a new member of `GH_READ`, proven by rows.
- `prompts/attribution` — Redline's label only, in replies, bodies and the spec.
- `process/standards-retrospective` — the proposed edits below; the person applies them in their own commit.
- `process/internal-notes` — no design record here beyond this spec; the README gains only operating text.

## Standards retrospective (proposed)

- `agent-os/standards/workflow/replay.md`, after the `firstRound` bullet: "The findings of the PR's earlier Redline rounds and their dispositions enter through `args.priorFindings`: the skill reads them with `redline-gh.sh prior-findings` after `last-round` and passes the list, and the workflow never reads the threads itself, since the run's own carried-forward replies change them (#35)".
- `agent-os/standards/workflow/agents.md`, after the known-finding bullets: "A finding an earlier round recorded is not one it dispositioned. The evidence of a disposition is the Redline reply answering the finding (`fixed`, `deferred`, `decided`, `dropped`, or `carried` by a later round), never `shape.md`, which a hand-off never relaunched leaves reading `Decided by: redline` on fixes never made; a finding with no reply, or a `not changed` one, is carried forward: a finding of the current round with `carriedFrom`, re-verified against the head and never copied, listed under its own heading in the review body, replied to in its earlier thread and swept with it, and named in the handoff. The reviewer accounts for every carry-forward id as carried or resolved, and the workflow carries what it did not account for, with a warning, rather than dropping it. The duplicate check for a reply is a reply opening with this pass's title, so an earlier round's reply in a carried finding's thread is not one (#35)".
- `agent-os/standards/testing/tests.md`: the loop-test bullet gains "Its carry-forward scenario proves the two prompt lists, the review body headings, the carried-forward and resolved replies in the earlier threads, the sweep ids and the handoff's Earlier rounds section, and that the loop carries a finding the reviewer did not account for (#35)"; the gh-test bullet gains "and the prior-findings read (`prior-findings`, on PR 14: one finding per disposition, a body finding answered by an issue comment, a teammate's reply that is not a disposition, an Already tracked line that is not a finding, and a round that carried an earlier finding; #35)".
- `scripts/bash-conventions.md`, `scripts/guard.md`, `prompts/attribution.md`, `process/*`: no changes.
