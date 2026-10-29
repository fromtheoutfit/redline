# References for the Docs gate step (#13)

## Similar Implementations

### The gate stamp and what it hashes

- **Location:** `scripts/redline-gate.sh` (`extract`, `stamp`, `check`); `README.md` 253 ("Gate stamp": the hash covers every backticked span and fenced block in the whole gate section, prose steps included)
- **Relevance:** the Docs step holds backticked directory names, so adding it moves the hash. Measured on scratch copies with `extract`: with backticks `c2f61f80…` (57 items, 12 steps); without, `3ec7834b…` (51 items), the stamp as it stood
- **Key patterns:** restamp in the same commit as the gate edit (`scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh`); the stamp's `steps 1-9` range comes from point 7's `(gate steps 1 to 9` parenthetical and does not move

### The unattended section's fill-ins

- **Location:** `scripts/redline-setup.sh` 299-311 (`read_fillins`), 318-322 (`apply`); `tests/setup-test.sh` 208-263; `skills/setup/SKILL.md` step 10
- **Relevance:** a rerun of `redline-setup.sh unattended` reads three phrases back with regexes: `\(gate steps (\d+) to (\d+)`, `Gate step (\d+)'s edits`, `\bSteps? (.+?) stays? as written` (case-sensitive, leftmost match)
- **Key patterns:** point 7's "Steps 10, 11 and 12 stay as written" sentence comes first on its line and the Docs sentence after it says "gate step 10" in lower case, so the leftmost match is the fill-in. Before the edit the dry run exits 1 with `differs` naming `proseSteps` (`10 and 11` → `10, 11 and 12`) and `retroStep` (10 → 11)

### The README sections a change lands in

- **Location:** `README.md` 121-145 (Files table: `agents/redline-*.md`, `scripts/`, `templates/`, `tests/`), 158-160 (Contributing), 34-48 (Set up a repository)
- **Relevance:** the Docs step asks for a section name per touched file; the Files table is the usual answer for a plugin file, Contributing for this repository's own gate
- **Key patterns:** Contributing holds the sentences about this repository's gate; "Set up a repository" is other repositories' contract and is unchanged

### The reviewer's and plan approver's rule lists

- **Location:** `agents/redline-reviewer.md` 14-23 (known findings), 33 (the Category bullet, where `nit` is defined); `agents/redline-plan-approver.md` 16-22 (checks 1 to 7)
- **Relevance:** the Docs nit and the Docs-entries check join these lists
- **Key patterns:** one bullet per rule; a rule names the file an agent reads to decide (`.claude/commands/agent-os/shape-spec.md`), so a repository without the step is unaffected

### The standards' format and index

- **Location:** `agent-os/standards/process/standards-retrospective.md` (title, one-sentence rule, bullets; its line 5 cites "Gate step 10" and is renumbered here); `agent-os/standards/index.yml` (keys are file names without `.md`, alphabetised by folder and file)
- **Relevance:** `process/docs-gate.md` follows the same shape and sits before `internal-notes` in the index

### The last hand-shaped spec

- **Location:** `agent-os/specs/2026-10-27-1632-17-ci-gate-on-every-pr-push/`
- **Relevance:** plan shape (Context with survey facts, Decisions, Task 1 contents, per-task Files lines, Verification Gate task), and the README Contributing section it created
