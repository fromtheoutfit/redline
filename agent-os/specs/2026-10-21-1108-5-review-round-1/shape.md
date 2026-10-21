# PR #5 review round 1 — Shaping Notes

## Scope

The four findings of Redline round 1 on PR #5 (dry run, `review only`; the findings are in `redline/round-1-findings.json` and were posted to the PR as one comment):

- **R1-1** · correctness · a finding whose fix is in `scripts/redline-guard.sh` or `hooks/hooks.json` has no route that keeps the run going.
- **R1-2** · nit · the unattended section of `.claude/commands/agent-os/shape-spec.md` is older than `templates/shape-spec-unattended.md`.
- **R1-3** · correctness · `bash -n scripts/*.sh` in `.claude/redline/checks.sh` parses only the first script.
- **R1-4** · correctness · on macOS, a case variant of a path (`Scripts/redline-guard.sh`) gets past the guard's protection of the guard, the hook and `.claude/`'s Redline files.

Shaped by hand in plan mode with the author, not in a Redline run, so the guard is changed by a person as CLAUDE.md requires. Nothing is committed by the session; the author commits.

## Investigation

- None of the four is tracked: the round's reviewer checked open issues and earlier rounds (`knownAs` is empty for each).
- **R1-1.** `workflows/redline-loop.js:1350-1352` throws a stage error when the implementer returns anything under `blocked`, and the guard refuses the two files to the implementer with "a person changes it, never a Redline role". `needCommits` (`redline-loop.js:1332-1335`) requires a commit naming every `fix` and `defer` finding, and `agents/redline-plan-approver.md:16` requires a task for every one, so a defer still needs a mitigation in a file the run may write. `agents/redline-shaper.md:25` says a finding on "the Redline plugin's own directory" is never `fix` or `defer`; read literally in the self-hosted case it makes every finding on the plugin's source an `ask`, and it contradicts the author's decision below.
- **R1-2.** Diffing the section against the template: the "Every decision names its owner" paragraph after point 3 is missing, the `findings` example in point 10 lacks `decidedBy` and `recommendation`, and the sentence explaining them is missing. The rest of the difference is this repository's own: gate numbers (1 to 5, 6 and 7, step 6), the dropped point 11, and the story wording "A teammate runs the command".
- **R1-3.** Confirmed: `bash -n a b` reads `a` and passes `b` as `$1`. `run_check` runs its command with `bash -c`, so a pipeline is fine there. `scripts/checks-template.sh` has no `bash -n` line, so other repositories are unaffected.
- **R1-4.** Confirmed by reading `protected()` (`scripts/redline-guard.sh:219-244`): every comparison is case-sensitive (`under`, `fnmatch.fnmatchcase`), and `os.path.realpath` keeps the spelling it is given. On the self-hosted path the plugin-directory check is skipped (line 221), so only those comparisons protect the guard and the hook. The same gap exists for `.claude/redline*.json`, `.claude/settings*.json` and `.git/` in every repository.

## Decisions

- **R1-1: a finding whose fix is in `scripts/redline-guard.sh` or `hooks/hooks.json` is `defer`.** A person makes the change after the run; the finding reaches the deferred list and the handoff comment, and the rest of the round ships. `ask` only when the finding also needs a decision. Its mitigation changes only a writable file (a `tests/guard-cases.tsv` row pinning today's decision under a comment naming the finding, or a Known limits line in `README.md`), because the workflow needs a commit and the plan approver a task for every defer. Written as point 11 of this repository's unattended section, with a matching self-hosted exception in `agents/redline-shaper.md:25` and a sentence in the README's Known limits. Decided by: @michaelfromtheoutfit
- **R1-2: recopy points 3 and 10 from the template**, keeping the repository's gate numbers and the story wording "A teammate runs the command" (this repository's users run a command; they do not open an app). Decided by: @michaelfromtheoutfit
- **R1-3: `ls scripts/*.sh | xargs -n1 bash -n`**, in `checks.sh` and in gate step 1. No `$`, so the gate text can quote it; `xargs` exits 123 when any file fails. Decided by: @michaelfromtheoutfit
- **R1-4: fold case inside `protected()` only.** Every comparison there runs on `casefold()`ed strings; the messages keep the path as written. Folding always is simpler than detecting the volume and only refuses more on a case-sensitive one. Decided by: @michaelfromtheoutfit
- **`SELF_HOSTED` and the prefix checks in `writable()` stay case-sensitive.** A case mismatch there fails closed: `SELF_HOSTED` false refuses the whole plugin, and a target outside the prefixes as spelled is refused. Neither loosens anything. Decided by: @michaelfromtheoutfit
- **The spec lives in the round's folder**, beside `redline/`, so a later review's check of `*-5-review-round-*` folders finds these dispositions. Decided by: @michaelfromtheoutfit

### Proportionality

- R1-1: reachable in any Redline run on this repository that finds a guard bug (this round has one); the round stops at Implement with nothing pushed. Cost: one point in the unattended section, one sentence each in the shaper and the README. Fix.
- R1-3: a syntax error in `redline-gh.sh` passes the whole gate, and the github role runs it in the same round. Cost: one line and the gate text. Fix.
- R1-4: a role can overwrite or delete the guard that vets it, after which every call runs unvetted. Cost: one function and about ten rows. Fix.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** roadmap phase 1, Redline reviewing itself (`agent-os/product/roadmap.md`).

## Standards Applied

- scripts/guard — R1-4 changes the guard; every change is proven by a row beside its neighbour.
- testing/tests — red before green; the new rows go in first.
- scripts/bash-conventions — R1-3 is a script check.
- workflow/agents — R1-1 changes what the shaper returns for a person-only file.
- process/standards-retrospective — gate step 6.

## Deferred

None.

## As built deviations

- R1-3: on macOS `xargs` exits 1, not the 123 the finding quoted (GNU). Recorded, not quoted in the gate text. Decided by: @michaelfromtheoutfit
- R1-4: the existing neighbour row `allow Bash cp /tmp/x.md .` caught an unfolded comparison in the first draft of the fix. The rule that every guard change keeps a neighbour row already covers this, so no new standard was needed. Decided by: @michaelfromtheoutfit

## Standards retrospective

Applied, approved by @michaelfromtheoutfit, for their own commit:
- `agent-os/standards/scripts/guard.md`: the self-hosted bullet gains the defer rule (R1-1); a new bullet says protected paths are compared case-folded (R1-4).
- `agent-os/standards/scripts/bash-conventions.md`: `bash -n` reads its first file only (R1-3).
- `agent-os/standards/testing/tests.md`: the row count is now 346.
