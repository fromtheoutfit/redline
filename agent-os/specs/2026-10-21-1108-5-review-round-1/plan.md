# PR #5 review round 1: address R1-1 to R1-4

## Context

The dry-run Redline review of PR #5 (`/redline:redline 5 dry run review only`, posted to the PR as a comment) found three correctness bugs and one nit in the change that sets this repository up for Redline. The self-hosted case promises more than the code delivers:

- **R1-1**: a finding whose fix is in `scripts/redline-guard.sh` or `hooks/hooks.json` stops the round at Implement.
- **R1-2**: the unattended section is an older copy than its template.
- **R1-3**: the syntax check parses only the first script.
- **R1-4**: on macOS, a case variant of the path gets past the guard's protection of itself.

This work is shaped by hand with the person, not in a Redline run. The person changes the guard here, which CLAUDE.md allows. Nothing is committed: the person commits, and the plan suggests how to group the commits.

**R1-1 decision (@michaelfromtheoutfit, 2026-10-21):** in this repository, a finding whose fix is in `scripts/redline-guard.sh` or `hooks/hooks.json` is `defer`, with a note that a person makes the change. It reaches the deferred list and the handoff comment, and the rest of the round ships. Use `ask` only when the finding also needs a decision.

## Task 1: Save spec documentation

Save into the existing round folder `agent-os/specs/2026-10-21-1108-5-review-round-1/`, beside `redline/`, which already holds the snapshot, the review and the findings:

- `plan.md`: this plan, with an As built section at the end.
- `shape.md`:
  - Scope: the four findings.
  - Decisions: R1-1 as above, `Decided by: @michaelfromtheoutfit`. R1-2 to R1-4 are fixes, `Decided by: @michaelfromtheoutfit`, since the person directed this session. Also record:
    - The `A teammate runs the command` story wording stays deliberately.
    - `SELF_HOSTED` stays case-sensitive: a mismatch there fails closed, refusing the whole plugin, and never loosens anything.
    - The prefix checks in `writable()` stay case-sensitive for the same reason.
  - Context: no visuals. References as below. Product alignment: roadmap phase 1, dogfooding Redline on itself.
- `standards.md`: full text of `scripts/guard`, `testing/tests`, `scripts/bash-conventions`, `workflow/agents` and `process/standards-retrospective`.
- `references.md`:
  - `templates/shape-spec-unattended.md` (R1-2).
  - The `# @cwd PLUGIN` section of `tests/guard-cases.tsv` (R1-4).
  - `workflows/redline-loop.js:1332-1352`: `needCommits` and the `blocked` stage error, which explain why a defer needs a writable mitigation (R1-1).
  - `agents/redline-plan-approver.md:16`: every defer has a task.

## Task 2: R1-2, recopy the unattended section from its template

File: `.claude/commands/agent-os/shape-spec.md`, lines 25-65.

- Restore the "**Every decision names its owner.**" paragraph after point 3.
- Restore the `findings` example in point 10 that carries `decidedBy` and `recommendation`.
- Restore the sentence explaining those two fields, before "Every `ask` finding has exactly one entry…".
- Add the blank line before "Everything not named above…".
- Keep this repository's own adjustments: gate steps 1 to 5, steps 6 and 7, gate step 6, and the teammate story.

Proof: diffing the section against the template shows only the header comment, the gate numbers, the story wording, and point 11 (the template's, which Task 3 replaces).

## Task 3: R1-1, defer a finding in the guard or the hook

Done after Task 2, since both edit the same section.

**`.claude/commands/agent-os/shape-spec.md`.** Add point 11 to the unattended section, where the template's point 11 was dropped:

> 11. **The guard and the hook.** In this repository the guard refuses `scripts/redline-guard.sh` and `hooks/hooks.json` to every role, so a finding whose fix is in either file is `defer`, never `fix`: a person makes the change after the run. Its mitigation, the round's task and commit for the finding, changes only a file the run may write: a `tests/guard-cases.tsv` row pinning today's decision under a comment naming the finding, or, when no row can show it, a line under Known limits in `README.md`. The full fix, under `## Deferred`, names the file and says a person changes it. Use `ask` only when the finding also needs a decision; its options are then ones a person carries out outside the run.

The mitigation must touch a writable file for two reasons. The workflow requires a commit naming every defer finding (`needCommits`, `redline-loop.js:1332`). The plan approver requires every defer to have a task.

**`agents/redline-shaper.md:25`.** The line says a finding on "the Redline plugin's own directory" is always `ask`. Read literally in the self-hosted case, that makes every finding on the plugin's source an `ask`, and it contradicts the new point. Append:

> When the repository is the plugin itself (its checkout loaded in place), the plugin's source is repository content planned like any other file, except `scripts/redline-guard.sh` and `hooks/hooks.json`: a finding there is `defer`, as the repository's unattended-mode section says.

**`README.md:135`.** Add one sentence to the "A run on this repository runs the PR's own code" bullet: a finding in the guard or the hook is deferred with a pinned row or a Known limits note, and a person makes the change after the run.

Proof: `claude plugin validate .` passes, through the gate.

## Task 4: R1-3, check every script's syntax

- **`.claude/redline/checks.sh:140`**: `run_check syntax 0 "ls scripts/*.sh | xargs -n1 bash -n && jq -e . hooks/hooks.json >/dev/null"`. Change the header comment at lines 14-15 to "bash -n over each of scripts/*.sh".
- **`.claude/commands/agent-os/shape-spec.md:234`**: gate step 1 quotes the same command.

Proof, red before green, run in the scratchpad (not the repository):
- Create `a.sh` containing `true` and `b.sh` containing `if then`.
- `bash -n a.sh b.sh` exits 0, which is the bug.
- `ls *.sh | xargs -n1 bash -n` exits 123.

## Task 5: R1-4, compare protected paths case-folded

**`scripts/redline-guard.sh`, `protected()` (lines 219-244).** Fold once at the top: `absolute`, `real`, `REPO`, each plugin directory, and each `full`, all through `.casefold()`. Then:

- run the `under` checks and the `!= REPO` comparisons on the folded strings;
- use `fnmatch.fnmatchcase(path_f, full_f)`;
- keep `raw` unfolded in the messages.

Nothing outside `protected()` changes.

**`tests/guard-cases.tsv`.** Add these rows first, run `tests/guard-test.sh`, and watch the deny rows mismatch (they return allow today). Then apply the fix.

- Under `# @cwd PLUGIN`, new denies:
  - `deny Bash cp /tmp/g.sh Scripts/redline-guard.sh`
  - `deny Bash sed -i '' 's/deny/allow/' scripts/Redline-Guard.sh`
  - `deny Edit HOOKS/hooks.json`
  - `deny Bash rm -rf Scripts`
  - `deny Write .Claude/redline.json`
- Under `# @cwd PLUGIN`, the neighbour that must not change: `allow Edit Scripts/redline-gh.sh`. Case folding does not over-refuse the rest of the plugin's source.
- In the ordinary section, new denies: `deny Write .claude/Redline.json` and `deny Bash echo x > .Git/config`.
- In the ordinary section, the neighbour: `allow Write REPO/Scripts/redline-guard.sh`. It stays ordinary content in a repository that is not the plugin.

Each new row goes beside the existing row it varies.

## Task 6: Verification Gate

1. Steps 1 to 5: `.claude/redline/checks.sh --baseline` exits 0 with all five checks green. Report any failure verbatim, fix it, and rerun.
2. Step 6, the standards retrospective. Present these proposed edits with AskUserQuestion:
   - `scripts/guard.md`, new bullet: "Protected paths are compared case-folded: the default macOS volume is case-insensitive, so `Scripts/redline-guard.sh` is the guard (R1-4 in #5)."
   - `scripts/guard.md`, self-hosted bullet: add "a finding there is deferred, mitigated by a pinned row or a Known limits note, and a person makes the change (R1-1 in #5)."
   - `scripts/bash-conventions.md`, new bullet: "`bash -n` reads one file and treats the rest as arguments; check several with `ls <glob> | xargs -n1 bash -n` (R1-3 in #5)."

   Approved edits are left for their own commit. If none are approved, record "Standards retrospective: no changes" in `shape.md`.
3. Step 7: `plan.md` gets an As built section, and any deviation is recorded under Decisions.

## Suggested commits (the person makes them)

1. The spec folder.
2. R1-2.
3. R1-1.
4. R1-3.
5. R1-4, the guard and the table together.
6. The standards, if any edits were approved.

## As built

- Task 1: the spec folder as planned, beside `redline/`.
- Task 2 (R1-2): points 3 and 10 recopied. Diffing the section against the template now shows only the gate numbers, the story wording and point 11.
- Task 3 (R1-1): point 11 in `.claude/commands/agent-os/shape-spec.md`, the self-hosted exception in `agents/redline-shaper.md:25`, and one sentence in README Known limits, as planned.
- Task 4 (R1-3): as planned, plus a two-line comment above the check in `checks.sh`. One deviation: on macOS `xargs` exits 1 when a file fails to parse, not 123 (123 is GNU). Either is a failure, and the gate text quotes no exit code.
- Task 5 (R1-4): 9 rows added (7 denies, 2 neighbour allows). Red first: 339 passed, 7 mismatched. The first fix left one `path != REPO` comparison unfolded, and the existing row `allow Bash cp /tmp/x.md .` went red ("'.' holds Redline's own files"). Folding that comparison too gave 346 passed, 0 mismatched.
- Task 6: `.claude/redline/checks.sh --baseline` exits 0 with syntax, validate, guard, loop and prefs all green. The standards retrospective applied four approved edits: `scripts/guard.md` (two), `scripts/bash-conventions.md` and `testing/tests.md`.
