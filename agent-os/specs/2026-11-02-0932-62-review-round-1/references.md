# References for PR #62 Review Round 1

Shaped by Redline in unattended mode.

## Similar Implementations

### The pre-#18 docs regex

- **Location:** `git show main:scripts/redline-setup.sh`, line 941: `^#   ([A-Z_][A-Z0-9_]*)=([A-Za-z_][A-Za-z0-9_]*)\s+(.*?) \(default (.*)\)\s*$`
- **Relevance:** before this PR, the reader took the default greedily, so a default that held a `)` stayed out of the doc.
- **Key patterns:** a lazy doc group followed by a greedy default that runs to the line's last `)`. The fix brings back that greediness and keeps the tail optional.

### The generator's var line and the default's validation

- **Location:** `scripts/redline-setup.sh:780` (`#   ENV=<name>   doc (default value)`), `:655-661` (the validation), `:85-86` (the header's statement of what a default may hold).
- **Relevance:** these say what the reader must accept. A default holds no `" $ ` \ }`; anything else, parentheses included, is valid.
- **Key patterns:** the reader accepts every character the validator lets through.

### The #18 setup-test cases

- **Location:** `tests/setup-test.sh:352` (`LJ`, `LC`), `:365-402` (the generated header, the `read-checks` cases, the `sed` copies `hand-vars.sh`, `old-vars.sh` and `hand.sh`, and the bootstrap round trip), `:475-478` (`jq` mutations of `LJ` for the default's validation).
- **Relevance:** the new cases sit beside these and follow their two patterns: `jq` on the fixture JSON for a generated variant, and `sed … > <copy>` on the generated file for a hand-written or older one.
- **Key patterns:** `expect_json "<name>" '<filter>' "<want>" read-checks "<file>"`.

### The reviewer's sample lines

- **Location:** `/tmp/redlinerepro/reviewer-r1-vars.txt` (four header lines, two of them with a default holding a parenthesis).
- **Relevance:** the lines the finding was reproduced on.

### The original spec

- **Location:** `agent-os/specs/2026-11-02-0851-18-setup-header-and-read-checks/shape.md`, decision 4 (line 18).
- **Relevance:** it requires the `(default …)` tail to stay optional. The fix keeps it optional.
