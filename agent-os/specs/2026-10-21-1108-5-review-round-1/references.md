# References for PR #5 review round 1

## Similar Implementations

### The unattended-mode template

- **Location:** `templates/shape-spec-unattended.md`
- **Relevance:** R1-2; the source this repository's section is copied from.
- **Key patterns:** points 3 and 10 as the template has them; the header comment lists what a repository adjusts.

### The self-hosted guard rows

- **Location:** `tests/guard-cases.tsv`, the `# @cwd PLUGIN` section
- **Relevance:** R1-4; the case-variant rows sit beside the rows they vary.
- **Key patterns:** a deny for the new decision next to the allow that must not change (`allow Edit scripts/redline-gh.sh`).

### The Implement stage and the defer contract

- **Location:** `workflows/redline-loop.js:1332-1352`, `agents/redline-plan-approver.md:16`, `agents/redline-implementer.md:18`
- **Relevance:** R1-1; why a blocked task ends the round, and why a defer still needs a task and a commit naming the finding.
- **Key patterns:** `needCommits` covers every `fix` and `defer`; a defer's mitigation is one commit whose comment names the finding.
