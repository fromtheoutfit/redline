# PR #38 review round 2 (launch 2026-10-26-1023): address R2-1

Shaped by Redline in unattended mode.

## Context

Redline round 2 on PR #38 (#36: `/redline:redline-revise <pr> review <id | @login | latest>`, a revise pass over a teammate's review comments) reviewed only the round 1 fix diff (`d7b7c86..5365811`). It found no correctness bug. This is the final nit round:

- **R2-1** (nit): `README.md:67`, the user-facing paragraph on the human review pass, still describes the review-body selection from before R1-3. Planned as a **fix**. One sentence becomes the wording the script header, the README table row and the revise skill already use.

Nothing is deferred and nothing is pending. `shape.md` has the evidence.

Constraints for every task:

- **Files no role may write stay untouched:** `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, `.claude/settings*.json`, `scripts/checks-template.sh`, `scripts/redline-gate.sh`, and the Verification Gate section of `.claude/commands/agent-os/shape-spec.md`. No task here needs them. No task changes the gate's text, so nothing needs a restamp.
- **A file a task does not name is not changed in this round.** In particular, these stay as they are, because each already describes the selection as built:
  - `scripts/redline-gh.sh` (header and filter)
  - the README table row at `README.md:288`
  - `skills/redline-revise/SKILL.md`
  - the round 1 spec folder and the #36 spec folder
- **Commits.** One commit per finding, with the `redline:` prefix and the finding's ID, referencing #36 as the branch's other commits do. The spec folder goes in the round's first commit or in a commit of its own.
- **Commands for the implementer.** The guard does not let a role run the harnesses directly, so every harness result comes from the gate script. Every other proof is a plain `grep -c` or `wc -l` run from the repository root.
  - No grep pattern below contains a backtick or a dollar sign.
  - In basic regex, `(`, `)` and `;` are literal and `.` matches any character, so each pattern matches the text as written.
  - Under macOS's BSD grep these counts are line counts. `README.md:67` and `:288` are separate lines.

## Task 1: Save spec documentation

Files: `agent-os/specs/2026-10-26-1023-38-review-round-2/` (`plan.md`, `shape.md`, `standards.md`, `references.md`). The workflow owns `redline/`, so leave it alone.

The shaper has written these four files. Commit the folder in the round's first commit or on its own, never mixed into a finding's commit.

## Task 2: R2-1, the README's human review paragraph describes the body selection as built

Files: `README.md`.

There is no red case. No harness reads `README.md`, and the paragraph is not a tested surface (`shape.md`, Unattended answers; `testing/tests.md:14`). The proof is the grep counts below.

1. **`README.md:67`.** Replace exactly this text, which is a substring of the line:

   ```text
   `review @login` takes every inline comment by that login that no Redline reply has answered yet, replies inside Redline threads included, plus the body of their newest review that has one; `review <id>` takes that review's unanswered comments and body; `latest` is the newest review that is not Redline's and not the author's.
   ```

   with:

   ```text
   `review @login` takes every inline comment by that login (matched in any case) that no Redline reply has answered yet, replies inside Redline threads included, plus the newest of their review bodies that no Redline human review comment has answered yet (one body per pass, so an older one comes up on the next pass); `review <id>` takes that review's unanswered comments and its body, unless a Redline human review comment has already answered it; `latest` is the newest review that is not Redline's, not the author's, and still has an unanswered comment or body.
   ```

   Keep the rest of line 67 as it is: the text before the sentence ("... `Redline human review` passes already on the PR). ") and everything after it ("A clear instruction is fixed, ..."). The line stays one line, with no wrap and no new line. Change no other line in the file.

2. **Commit** with the message `redline: R2-1 describe the human review body selection as built in the README paragraph (#36)`, staging `README.md` by name.

Proof:
- `grep -c "plus the body of their newest review that has one;" README.md` prints 0.
- `grep -c "unanswered comments and body;" README.md` prints 0.
- `grep -c "by that login (matched in any case) that no Redline reply has answered yet" README.md` prints 1.
- `grep -c "plus the newest of their review bodies that no Redline human review comment has answered yet (one body per pass, so an older one comes up on the next pass);" README.md` prints 1.
- `grep -c "unanswered comments and its body, unless a Redline human review comment has already answered it;" README.md` prints 1.
- `grep -c "not the author's, and still has an unanswered comment or body." README.md` prints 1.
- `grep -c "matched in any case" README.md` prints 2 (lines 67 and 288).
- `grep -c "and the body of their newest review that has one not answered (one body per pass, so an older one comes up on the next pass)" README.md` prints 1. This is the table row at line 288, which must not change.
- `wc -l README.md` prints `336 README.md`, the same as before the change.

## Task 3: Verification Gate

Files:
- Step 9, the retrospective commit: `agent-os/standards/scripts/bash-conventions.md`.
- Step 10: `agent-os/specs/2026-10-26-1023-38-review-round-2/plan.md` and `shape.md`.

Gate steps 1 to 8, in a Redline run: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-26-1023-38-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of those steps, so the gate text stays the source.

A README-only change moves no harness count. Expect the counts round 1's As built ended on: gh `76 passed, 0 failed` and loop `219 checks passed, 0 failed`. If a count differs, record the actual numbers in As built.

Steps 9 and 10 stay as written in `.claude/commands/agent-os/shape-spec.md`:

- **Step 9, standards retrospective.** The proposed edit is under `## Standards retrospective (proposed)` in `shape.md`: one new bullet in `agent-os/standards/scripts/bash-conventions.md`, after the bullet at line 9 that begins "The header comment is the documentation".
  - The standards approver approves the list. The implementer applies it in its own commit and touches only `agent-os/standards/scripts/bash-conventions.md`.
  - The commit's message names no finding. R2-1's plan does not send part of its fix through the retrospective, so the edit records a lesson, not a fix.
  - If the approver approves no edit, the implementer records "Standards retrospective: no changes" under Decisions in `shape.md` instead.
- **Step 10, spec folder.** `plan.md` gets an As built section. Record any deviation under Decisions in `shape.md`.

Proof (step 9, when item 1 is approved):
- `grep -c "#38, R2-1" agent-os/standards/scripts/bash-conventions.md` prints 1.
- `grep -c "^# " agent-os/standards/scripts/bash-conventions.md` prints 1, because the file's only heading is unchanged.
- `grep -c "^- " agent-os/standards/scripts/bash-conventions.md` prints 23 (22 bullets before the edit).

## As built

Built as planned, with no deviation, so `shape.md` gets no new Decision.

- **Task 1.** The four spec files were committed on their own (`79da417`). `redline/` was left to the workflow.
- **Task 2, R2-1.** `README.md:67` now carries the planned sentence, and the rest of the line is unchanged (`24ecd55`). Before the edit, the two old phrases counted 1 each, "matched in any case" counted 1, the table-row phrase counted 1, and `wc -l` printed 336. After the edit, every Task 2 proof prints what the plan says: 0, 0, 1, 1, 1, 1, 2, 1, and `336 README.md`.
- **Task 3, step 9.** The standards approver approved the one proposed bullet. It went into `agent-os/standards/scripts/bash-conventions.md` after the line 9 bullet, word for word, in its own commit that names no finding (`0481cd4`). Proofs: `#38, R2-1` counts 1, the `# ` heading count stays 1, and the bullet count goes from 22 to 23.
- **Task 3, steps 1 to 8.** `checks.sh` with the round 2 snapshot exited 0 on its first run: syntax, validate, guard `374 passed, 0 mismatched`, loop `219 checks passed, 0 failed`, prefs `44 passed, 0 failed`, gate `117 passed, 0 failed`, setup `240 passed, 0 failed`, gh `76 passed, 0 failed`. The git block listed no `unexpected_files` and nothing `uncommitted`. The gh and loop counts match round 1's As built, as a README-only change should.
