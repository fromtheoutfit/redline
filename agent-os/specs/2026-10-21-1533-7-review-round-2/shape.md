# PR #7 review round 2 (launch 2026-10-21-1533) — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The one finding of this launch's Redline round 2 on PR #7, the gate stamp (first half of #6). It is in `redline/round-2-findings.json`, and the review was posted to the PR. The round reviewed only round 1's fix diff (6e54c7d..1089c42), found no correctness issue, and this is the final nit round.

- **R2-1** · nit · low · `scripts/checks-template.sh:127` · inside a failing check's share of the output budget, stdout takes the bytes stderr leaves unused, but stderr never takes the bytes stdout leaves unused.

Scope is this finding and nothing more.

## Investigation

### Already known?

- `redline-gh.sh issues-search "checks-template stderr budget"` returns no open issue.
- `redline-gh.sh review-comments 7`: the only comments on `scripts/checks-template.sh` are R1-5 (the restamp wording, a previous launch) and R2-1 itself. Nothing earlier raises the split inside a share.
- The PR's round folders: `2026-10-21-1533-7-review-round-1/` decided R1-13 (the shared budget) and planned the split inside a share as a detail of Task 5 ("stderr gets at most half the share and stdout the rest"). No finding there raises the unused half.

### R2-1

Confirmed by reading.
- `emit_checks` (`scripts/checks-template.sh:114-149`). For a failing check, `err_kept` is the bytes in the last 200 lines of stderr (`:126`), `err_cap` is `share / 2` lowered to `err_kept` when stderr is shorter (`:127-130`), and `out_cap=$((share - err_cap))` (`:131`).
- So a short stderr hands its unused bytes to stdout, but nothing hands stdout's unused bytes to stderr: `err_cap` never rises above `share / 2`.
- Case: one failing check (share = 16384) whose stdout is empty and whose stderr is long, as a `bash -n` syntax error, a `jq -e` failure or a tool that logs to stderr would produce. stderr is cut to 8192 bytes, stdout carries nothing, and 8192 bytes of the budget go unused.
- The comment above the caps (`:78-83`) and the README `truncated` bullet (`README.md:213`) both state the asymmetry ("stderr takes at most half"), so code and docs agree with each other. Round 1's plan Task 5 says "One failing check alone keeps today's 16 KB", which holds only when stdout fills its half.
- The reviewer's scratch script (`/tmp/redlinerepro/reviewer-r2-checks.sh`) copies `run_check` and `emit_checks` verbatim with synthetic checks; the review says it was not run. The arithmetic above settles the finding without running it.
- `.claude/redline/checks.sh:100-101` still carries the per-check cap from before round 1 (`local keep=20 cap=16384`). The author carries round 1's R1-13 and R1-14 lines into it by hand after the round, and no Redline role may write it.

### The proposed fix, checked case by case

The reviewer's rule: `out_kept` is the bytes in stdout's last 200 lines; `err_cap = min(err_kept, max(share / 2, share - out_kept))`; `out_cap = share - err_cap`.

- Both streams long (each at least half the share): `share - out_kept <= share / 2`, so `err_cap = share / 2` and `out_cap = share / 2`. Same as today.
- stderr short or empty, stdout long: `err_cap = err_kept`, stdout gets the rest. Same as today.
- stdout short or empty, stderr long: `err_cap = share - out_kept`, and `out_cap = out_kept`, which holds all of stdout's kept lines. stderr gains the bytes stdout did not use. This is the only case that changes.
- Both short: each keeps all it has. Same as today.
- `out_kept` larger than `share` makes `share - out_kept` negative, which never beats `share / 2`. `wc -c`'s leading spaces on macOS are fine inside `$(( ))` and `[[ -lt ]]`, as the existing `err_kept` line already relies on.
- Every case keeps `out_cap + err_cap = share`, so no check takes more than its share and the total stays within the 16 KB budget. `truncated` compares each whole stream with the allotment it was cut to (`:138-141`), so it stays correct with the larger `err_cap`.

### Nothing in this round moves the gate hash

The planned edits touch `scripts/checks-template.sh` below its header and `README.md`. Neither is the gate in `.claude/commands/agent-os/shape-spec.md` or `scripts/redline-gate.sh`. The gate test's last case ("the plugin's own checks.sh stamp matches its gate") proves it.

## Unattended answers

- **Scope.** R2-1 alone. Evidence: the findings JSON in the invoking prompt, also at `redline/round-2-findings.json`.
- **Visuals.** None; this is a shell-script and documentation change.
- **References.** See `references.md`. Each one is a file opened during shaping.
- **Product context.** `agent-os/product/roadmap.md`, Phase 1 item 7 (#6), as round 1 recorded. Nothing here touches `/redline:setup`.
- **Standards.** `scripts/bash-conventions`, `scripts/guard`, `testing/tests`, `workflow/agents`, `process/standards-retrospective` and `prompts/attribution`, from `agent-os/standards/index.yml`. Full text in `standards.md`.
- **R2-1: should the unused half of a share go to the other stream?** The question of a trade-off does not arise. The fix changes only the case where stdout is short and stderr long, and there it shows more stderr within the same per-check share and the same 16 KB budget. Nothing is shown less, and the bound the person chose is unchanged. The effect the person accepted with R1-13 option (b) says the same: "a single failing check keeps today's 16 KB" (round 1 `shape.md`, R1-13 options), and round 1's plan Task 5: "One failing check alone keeps today's 16 KB." The code meets that only when stdout fills its half. The disagreement is fixed in the code, its comment and the README.
  Decided by: redline
- **R2-1: who changes `.claude/redline/checks.sh`?** Answered by `agent-os/standards/scripts/guard.md`: "A finding whose fix changes `.claude/redline/checks.sh`'s own lines, with no restamp, is deferred the same way: the run fixes `scripts/checks-template.sh` and the README, and a person carries the same lines into `checks.sh` (#7, R1-14)". Unattended point 11 says the same. The author has said they carry round 1's change into it by hand after the round; R2-1's lines go in the same edit.
  Decided by: redline

## Decisions

- **R2-1: defer.** The run fixes everything it may write. In `scripts/checks-template.sh`'s `emit_checks`, a failing check's split becomes symmetric: stderr's allotment is the smaller of its kept bytes and the larger of half the share and what stdout's kept bytes leave. stdout gets the rest, as now. The comment above the caps and the README `truncated` bullet say each stream takes at least half of a share when both are long, and a short stream's unused bytes go to the other. Proven by the `syntax` check and grep. The same lines in this repository's `.claude/redline/checks.sh` are the author's, after the run (see Deferred).
  Decided by: redline
- **Standards retrospective: no changes.** Proposed under `## Standards retrospective (proposed)` below; the standards approver approves the list.
  Decided by: redline

### Proportionality

- **R2-1.** A nit, not a correctness finding.
  - Likelihood: whenever a failing check reports mostly on stderr. That is common (`bash -n`, `jq -e`, a test runner that writes failures to stderr).
  - Impact: the implementer sees half of the stderr it could see; the bound holds either way.
  - Cost: about four lines in one function plus one comment line in `scripts/checks-template.sh`, and one parenthetical in `README.md`, both files the PR already changes. No new dependency or abstraction. Proportionate.
  - It is `defer` only because the live copy is a file no role may write.

## Deferred

- **R2-1, `.claude/redline/checks.sh`.**
  - Mitigation, this round: `scripts/checks-template.sh`'s `emit_checks` splits a failing check's share symmetrically, and the template comment and the README `truncated` bullet describe it (Task 2). Every repository set up from the template after this round gets the symmetric split.
  - Full fix, open: the author carries the same `out_kept` and `err_cap` lines into this repository's `.claude/redline/checks.sh`, in the same hand edit that brings over round 1's R1-13 final pass and R1-14 `truncated`. The change sits below the header, so no restamp is needed.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/roadmap.md`, Phase 1 item 7 (#6). This round finishes the template's output budget; `/redline:setup` keeps its own spec.

## Standards Applied

- scripts/bash-conventions: the header comment is the documentation and the README follows a limit changed in `checks.sh`'s JSON in the same change (#7, R1-14); the shared budget bullet (#7, R1-13) is the bound this fix keeps.
- scripts/guard: the deferral. No role writes `.claude/redline/checks.sh`; the run fixes the template and the README.
- testing/tests: the template has no harness (round 1, Tasks 4 and 5), so the proof is the `syntax` check and grep; the gate test's last case shows the stamp did not move.
- workflow/agents: each decision names its owner.
- process/standards-retrospective: gate step 7, proposed below.
- prompts/attribution: nothing in this folder names a model or vendor.

## Standards retrospective (proposed)

Items, classified:

- **R2-1 (already in a standard).** `scripts/bash-conventions.md`, the bullet starting "The header comment is the documentation": the README's output contract follows a limit changed in `checks.sh` in the same change (#7, R1-14), and the failing checks share one bounded budget (#7, R1-13). How the share splits between a check's two streams is a detail of the template, which the template's own comment documents and the README quotes. No standard should restate it.
- **R2-1 deferral (already in a standard).** `scripts/guard.md`, the self-hosted bullet: "A finding whose fix changes `.claude/redline/checks.sh`'s own lines, with no restamp, is deferred the same way (#7, R1-14)".

Proposed edits: none. Standards retrospective: no changes.
