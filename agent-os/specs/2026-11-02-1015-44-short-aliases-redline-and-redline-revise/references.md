# References for the short aliases `/redline` and `/redline-revise` (#44)

## Similar Implementations

### The writing subcommands of `redline-setup.sh`

- **Location:** `scripts/redline-setup.sh`, `cmd_gitignore` and `cmd_unattended`
- **Relevance:** the shape of a subcommand that writes a person's repository file and reports a rerun
- **Key patterns:** `tmp_beside`/`commit_tmp` for the write, `--dry-run` everywhere, `changed: false` when nothing would change, exit 1 with the JSON printed first when a compared file differs without `--force`, every usage error `die2`

### The setup test

- **Location:** `tests/setup-test.sh`, the unattended block and the "this checkout" block at the end
- **Relevance:** the case style (`expect_json`, `expect_exit`, `expect_stderr`, `same`), copies changed with `sed … > <copy>` in the temp directory, and the last cases that compare this checkout's own files with what the script writes

### The guard table

- **Location:** `tests/guard-cases.tsv`, the `.claude/` write rows beside the `shape-spec.md` write and the `redline-setup.sh` rows for the roles and the main session
- **Relevance:** where a decision about a path is pinned without a guard change; the self-hosted `# @cwd PLUGIN` block repeats the `.claude/` rows that must hold there too

### The relayed line

- **Location:** `workflows/redline-loop.js` (`RUN_LINE`), `tests/loop-test.mjs` (the relay checks), `skills/redline/SKILL.md` section 7
- **Relevance:** the one sentence every agent prompt carries about the two lines the harness may relay; the alias form is a third spelling of one of them

### The skill frontmatter

- **Location:** `skills/redline/SKILL.md:4`, `skills/redline-revise/SKILL.md:4`
- **Relevance:** the `argument-hint` text the two templates copy

### The last hand-shaped setup spec

- **Location:** `agent-os/specs/2026-11-02-0851-18-setup-header-and-read-checks/`
- **Relevance:** the model for the folder's four files and the Docs entries table

## Claude Code behaviour read for decision 4

- `$ARGUMENTS` is substituted when the command is rendered, before the model sees the body; a slash command written inside a body is text, not an expansion, so the alias asks the model to invoke the namespaced skill through the Skill tool. Command files take the skills' frontmatter minus `name` and `paths`; a project command and a plugin skill of the same bare name coexist because plugin skills are namespaced. Read from the Claude Code skills documentation on 2026-11-02; nothing there documents a command aliasing a plugin command, which is why the pass-through was proven live (Task 3).
