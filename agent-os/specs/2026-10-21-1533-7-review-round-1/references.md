# References for PR #7 review round 1 (launch 2026-10-21-1533)

Shaped by Redline in unattended mode.

## Similar Implementations

### The checks template's `run_check`

- **Location:** `scripts/checks-template.sh:78-109`, and this repository's copy at `.claude/redline/checks.sh:82-113`
- **Relevance:** R1-13 and R1-14. The per-check, per-stream cap (`keep`, `cap`) and the `truncated` flag landed in e5be593, whose message records the 30 KB guard output that spilled the checker's result.
- **Key patterns:** each stream is cut by `tail -n "$keep" | tail -c "$cap"`; the comment above the block states the goal, the whole result under the Bash tool's inline limit.

### The checker and the judge

- **Location:** `agents/redline-checker.md` (frontmatter line 5, `disallowedTools` includes `Read`), `workflows/redline-loop.js` (`judge` at 897-945, `failingExcerpt` at 947-953, the repair prompt at 1361)
- **Relevance:** R1-13. What happens when the result spills, and how much of a failing check the workflow passes on (3000 characters of stdout, 1500 of stderr).

### The implementer's gate loop

- **Location:** `agents/redline-implementer.md:20`
- **Relevance:** R1-13. The implementer runs `checks.sh` itself and reads its JSON, so a smaller cap shows it less of a failing check.

### The README's setup steps, output contract and Gate stamp paragraph

- **Location:** `README.md` (Upgrading 24-32, Set up a repository 34-45, the output contract 187-214, Gate stamp 220-240)
- **Relevance:** R1-11 (steps 1 and 5), R1-12 (line 226), R1-14 (line 194 and the bullets after it).

### The gate stamp script and its harness

- **Location:** `scripts/redline-gate.sh` (header 22-37, `RANGE` at 66, pass 3 at 148-178, `cmd_stamp` at 248-297), `tests/gate-test.sh` (helpers 29-62, the backticked-edit cases 143-160, the no-parenthetical case 175), `tests/gate-fixtures/plugin-shape.md`
- **Relevance:** R1-11 (stamp's default range and its exit 2) and R1-12 (only spans and fenced lines are hashed; the new case sits beside "a step added").
- **Key patterns:** `same` and `differs` compare two fixtures' hashes; each new case sits beside its neighbouring case.

### The unattended section template

- **Location:** `templates/shape-spec-unattended.md:12`, `:47`
- **Relevance:** R1-11. Point 7 carries the `(gate steps M to N` parenthetical that setup step 5 adds.

### The previous launch's round on this PR

- **Location:** `agent-os/specs/2026-10-21-1422-7-review-round-1/` (`shape.md`, `plan.md`)
- **Relevance:** the format of this round's folder, the self-hosted deferral pattern (a person's change to a file no role may write, R1-9's `.claude/settings.json` line), and the note that the guard does not let a role run the harnesses directly.

### The shaper's rule 7 and unattended point 11

- **Location:** `agents/redline-shaper.md` (rule 7), `.claude/commands/agent-os/shape-spec.md:69`
- **Relevance:** R1-14's `defer`: a finding on `.claude/redline/checks.sh` in this repository is deferred, and a person changes the file.
