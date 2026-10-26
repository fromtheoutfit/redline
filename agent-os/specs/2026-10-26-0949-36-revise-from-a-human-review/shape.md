# Revise from a human review (#36) — Shaping Notes

## Scope

Issue #36: `/redline:redline-revise <pr> review <id | @login | latest>`, a revise pass whose findings come from a teammate's review. Ingest the review's un-replied inline comments and its body as findings `H<n>-<k>`; a clear instruction is `fix`, decided by the reviewer; a question or a disagreement is `ask`, returned to the author; a comment that asks for nothing is `none`. Then the normal pass (shape, approve, implement one commit per finding, check, push, reply in every thread with the owner), one final nit pass over the fix diff, and a one-line summary comment. No handoff comment, no review request. The human review's id and the ingested findings are kept in the run record for #20.

Shaped by hand with `/agent-os:shape-spec` on 2026-10-26; the person makes the commits and opens the PR.

## Decisions

- **Grammar: bare word `review <selector>`.** Asked 2026-10-26; chosen over the issue's `--review`. The skill grammar is all bare words, and `review` has no other meaning in `redline-revise`.
- **Selection normalises to one comment list.** Asked 2026-10-26; chosen over "newest review by that login". `review @login` takes every inline comment by that login with no Redline reply yet (replies inside Redline threads included), plus the body of their newest non-Redline review with a non-empty body; `review <id>` takes that review's un-replied comments and its body; `latest` is the newest non-Redline review with a body or a comment, then as `<id>`. `redline-gh.sh human-review` does the selection and prints the same shape for every form, so the skill and the workflow have one code path.
- **Un-replied** means no Redline reply (`^Redline (round|human review) N`) with a higher id in the same thread (the thread is `in_reply_to_id`, else the comment itself). A Redline review's own comments and Redline's replies are never findings.
- **The final nit pass is included.** Asked 2026-10-26. After the human fixes are pushed, the reviewer reads the fix diff once as `Redline round <firstRound>` (`final-nit-pass`; the skill's precheck already reads `last-round`), a correctness bug it finds gets one more fix pass that is not re-reviewed, then the summary comment.
- **Dispositions in a human pass are `fix`, `ask`, `none`; never `defer`.** The issue: nothing a human asked for is deferred by Redline on its own. A disproportionate fix is `ask`; the author may answer "defer", which the existing disposition-override path applies. `none` is only for a comment that asks for nothing (praise, thanks, an acknowledgement, a body that only points at the inline comments); when in doubt, `ask`. A `defer` from the shaper is a stage error at `shape`, as a missing disposition is.
- **Owners.** A `fix` is `decided by: @<reviewer login>`: the shaper returns `decidedBy: "reviewer"` and the workflow maps it, as it maps a person's decision to `args.login`. An `ask` becomes `decided by: @<author login>` after the hand-off, or `redline (autopilot)` on autopilot. `none` is `decided by: redline`, since the shaper read the comment as asking for nothing.
- **Labels.** The pass is `Redline human review <n>` wherever a Redline round says `Redline round <n>`: reply bodies, the summary comment, the reply files (`human-review-<n>-reply-<id>.md`), the summary file. `n` is `redline-gh.sh last-human-review <pr>` plus one, read by the skill before launch and passed in `args.revise.n`, so a relaunch replays (workflow/replay).
- **The body finding** (`file: ""`, `line: 0`) has no thread: its reply is an issue comment opening with `<!-- redline:<id> -->` and the line `**<id>** · from the review by @<login>`, which is also the already-posted check, on the pattern of the body-finding replies of #33.
- **The unattended template is not changed.** The human-pass rules (dispositions, owners, the comment quoted in an ask's story) live in the shaper's prompt and in `agents/redline-shaper.md`'s overriding rules, which the unattended section says the invoking prompt supplies. Every repository's copy of the section would otherwise need re-inserting, and the rerun of `redline-setup.sh unattended` patches fill-ins only.
- **Scope does not apply** (every human comment is in scope) and the interrupt dial does: `plan` and `guided` stop for the author as today, `autopilot` takes the shaper's reading and the reply says so (the existing autopilot wording).
- **The guard change is the person's.** `human-review` and `last-human-review` join `GH_READ` with rows beside the `last-round` rows; CLAUDE.md reserves `scripts/redline-guard.sh` for a person, and this spec is run by one.
- Out of scope (from the issue): several reviewers in one pass; resolving threads on GitHub.
- **Deviations while building** (see "As built" in `plan.md`): `latest` also skips the gh user's own reviews; the reviewer's label and model key on what is reviewed rather than the round number; a dry run routes every reply `file-only` whatever threads exist; a fix with the wrong owner in a human pass is corrected to the reviewer with a warning rather than stopping the run; the summary's "pushed" reads the run's `push` setting.

## Context

- **Visuals:** None (a CLI plugin; GitHub's rendering of the replies and the summary is the only screen).
- **References:** see `references.md`: the revise-only path and `revise()` in the loop, `review-comments`/`last-round` in `redline-gh.sh`, the gh and loop harnesses, the skills and agent files, the guard's `GH_READ`.
- **Product alignment:** `agent-os/product/mission.md`: "Decisions stay with people" (a human's instruction is theirs, an unclear one goes to the author, never decided by an agent) and "nothing an agent does is hidden from the review thread" (a reply in every thread with its owner, one summary comment). Confirmed 2026-10-26.

## Standards Applied

- scripts/bash-conventions — two read subcommands added to `redline-gh.sh` join `GH_READ` in the same change; JSON only on stdout; a number as a bare JSON number; the header is the documentation
- scripts/guard — every guard change proven by a `guard-cases.tsv` row beside its neighbour
- testing/tests — a tested surface gains a case; red before green; the gh harness serves the new fixtures, the loop harness the human scenario
- workflow/agents — judgment calls returned never decided; every decision names its owner; the GitHub agent's duplicate check looks for text only the pass's reply carries
- workflow/replay — `n` and the findings enter through args; nothing before a stopping point reads GitHub or the clock
- prompts/attribution — the replies and the summary carry no model or vendor name; a GitHub login appears only as a decision's owner
- process/standards-retrospective — the retrospective at the end of this spec
- process/internal-notes — this spec carries no private detail beyond the logins that own decisions

## Standards retrospective

Applied 2026-10-26 (for the person's own commit, separate from the code): workflow/agents (the fourth owner `decided by: @<reviewer login>`; a human review pass sorts into fix, ask or none and never defers; one pass descriptor keeps a Redline round's prompts byte-identical; a dry run routes every reply file-only), workflow/replay (`args.revise.n` from `last-human-review`), testing/tests (the gh harness covers the ingest, the loop harness the human pass), and `index.yml` (the testing description names the gh harness, missing since #33). scripts/guard, scripts/bash-conventions, prompts/attribution, process/standards-retrospective and process/internal-notes taught nothing new: the guard row rule, the `GH_READ` rule and the attribution rule already covered this spec's parts.
