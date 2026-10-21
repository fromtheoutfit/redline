# References for #4: Install Agent OS and Redline's own contract

## Similar Implementations

### Chalkboard's Agent OS install

- **Location:** `Sites/chalkboard-feature-redline-plugin/.claude/commands/agent-os/`, `agent-os/product/`, `agent-os/standards/`
- **Relevance:** the model the issue names. The four stock commands were copied unchanged; `shape-spec.md` was copied and its gate, gate task and tips rewritten for this repository.
- **Key patterns:** a standard is an H1, a lead rule and bullets, no frontmatter; `index.yml` is `folder: file: description:`; a spec folder is `YYYY-MM-DD-HHMM-<slug>/` with `plan.md`, `shape.md`, `standards.md`, `references.md`.

### Chalkboard's Redline contract

- **Location:** `Sites/chalkboard-feature-redline-plugin/.claude/redline/checks.sh`, `.claude/redline.json`, `.claude/settings.json`, `CLAUDE.md` (Git, No AI attribution, Specs)
- **Relevance:** the proven per-repo contract; this repository's is the same shape with this repository's commands.
- **Key patterns:** `run_check <name> 0 "<cmd>"` per gate step; the git block and the envelope untouched; the CLAUDE.md sentence and paragraph from `templates/claude-md-git-sentence.md`.

### Losers League's "Code review — check before reporting"

- **Location:** `Sites/loser/CLAUDE.md`
- **Relevance:** the section the issue asks for; Chalkboard does not have it.
- **Key patterns:** three checks before a finding is reported as new; spec folders read off the PR ref, not the working tree.

### The plugin's own templates

- **Location:** `templates/settings.allow.json`, `templates/redline.json.example`, `templates/shape-spec-unattended.md`, `templates/claude-md-git-sentence.md`, `scripts/checks-template.sh`
- **Relevance:** the starting points the README's "Set up a repository" names; this repository is the first to be set up from the templates rather than from Chalkboard's files directly.
