# #4: Install Agent OS and Redline's own contract so Redline can review itself

Shaped in plan mode on 2026-10-21 on `main` at 388b6bc, clean tree. The model for Part 1 is Chalkboard's Agent OS install; the model for Part 2 is the contract Chalkboard carries for Redline.

## Context

Redline reviews and revises PRs in repositories that carry Agent OS and Redline's per-repo contract. This repository had neither (an empty `.claude/`, no `agent-os/`, no `CLAUDE.md`), so Redline PRs were reviewed by hand and Redline never reviewed itself.

The plugin is read in place from this checkout on the author's machine (`claude plugin list`: `Read from: /Users/michaelwitwicki/Code/Claude/redline`), so when Redline runs here the repository and `CLAUDE_PLUGIN_ROOT` are the same path, and the guard's "no role writes inside the plugin" rule refused every write in the repository. That is the issue's known wrinkle, and the one code change here.

| Part | What | Disposition |
| --- | --- | --- |
| 0 | The guard's self-hosted case, with test rows for both situations | fix |
| 1 | Agent OS: five commands, product docs, eight standards and the index, this spec, `CLAUDE.md` | fix |
| 2 | The contract: `checks.sh`, `redline.json`, `settings.json`, `.gitignore`, the unattended section, the CLAUDE.md sentence, the plugin install | fix |

## Task 1: Save spec documentation

Create this folder with `plan.md`, `shape.md`, `standards.md` and `references.md`.

## Task 2: The guard's self-hosted case

Files this task may create or change, and no others: `scripts/redline-guard.sh`, `tests/guard-test.sh`, `tests/guard-cases.tsv`, `README.md`.

- `scripts/redline-guard.sh`: `SELF_HOSTED` is true when the repository's real path is the plugin's. Then the plugin-directory refusal is skipped and `scripts/redline-guard.sh` and `hooks/hooks.json` join `PROTECTED_FILES`, with a denial reason that says a person changes them. `.git/`, `.claude/redline/`, `.claude/redline*.json`, `.claude/settings*.json` and the `.claude/{agents,workflows,skills}/redline*` copies stay refused as before. The header comment and the table comment say so.
- `tests/guard-test.sh`: a `# @cwd PLUGIN` line in the case file sends the rows after it from the checkout (where the guard finds the repository and the plugin at one path); `# @cwd REPO` switches back. The header comment explains why the cache repository is still needed.
- `tests/guard-cases.tsv`: in the ordinary section, rows proving a repository's own `agents/`, `scripts/redline-guard.sh` and `hooks/hooks.json` are ordinary content, beside the plugin-directory denials. A new self-hosted section: the implementer may write the plugin's source, `.claude/commands/`, `CLAUDE.md` and the standards, stage and commit them, and run `checks.sh`; it may not write, copy over, stage or remove the guard, the hook, their directories, or `.claude/`'s Redline files; the reviewer, shaper and github roles keep their prefixes.
- `README.md`: "The guard" says what the self-hosted case changes; "Known limits" says a run here runs the PR's own code; "Install" says this repository is set up.

Proof: `tests/guard-test.sh` from this checkout and from Chalkboard's worktree, 0 mismatched.

## Task 3: Agent OS

Files this task may create, and no others: `.claude/commands/agent-os/*.md`, `agent-os/product/*.md`, `agent-os/standards/index.yml`, `agent-os/standards/*/*.md`, `CLAUDE.md`.

- `plan-product.md`, `discover-standards.md`, `index-standards.md`, `inject-standards.md`: Chalkboard's, unchanged (stock Agent OS, no Laravel content).
- `shape-spec.md`: Chalkboard's with the Verification Gate rewritten for this repository (syntax, manifest, guard, loop, prefs, the standards retrospective, the spec folder; seven steps), the Step 7 gate task and the Tips repointed, and the `## Unattended mode (Redline)` section from `templates/shape-spec-unattended.md` with point 7 reading "gate steps 1 to 5" and "Steps 6 and 7", point 8 reading "Gate step 6", point 11 dropped, and a neutral story example.
- `agent-os/product/`: `mission.md`, `roadmap.md`, `tech-stack.md`, written to `plan-product.md`'s templates from the README, the issue list and the design record's facts.
- `agent-os/standards/`: `scripts/bash-conventions`, `scripts/guard`, `workflow/replay`, `workflow/agents`, `prompts/attribution`, `testing/tests`, `process/standards-retrospective`, `process/internal-notes`, in Chalkboard's format (an H1, a lead rule, bullets, no frontmatter), each discovered from the code as it stands; `index.yml` lists them.
- `CLAUDE.md`: the Git rule with the Redline sentence, the no-attribution block with the Redline paragraph, the Specs rule, "Code review: check before reporting" (from Losers League, the only repository that has it), and two rules of this repository's own: no internal design record here, and every guard change updates `tests/guard-cases.tsv` while the guard and the hook are changed by a person.

## Task 4: Redline's own contract

Files this task may create or change, and no others: `.claude/redline/checks.sh`, `.claude/redline.json`, `.claude/settings.json`, `.gitignore`.

- `.claude/redline/checks.sh` from `scripts/checks-template.sh`: no formatter step, no Octane block, `ALWAYS_ALLOWED=()`; five checks, `syntax` (`bash -n scripts/*.sh && jq -e . hooks/hooks.json`), `validate` (`claude plugin validate .`), `guard`, `loop`, `prefs`; the git block and the envelope as the template has them; the baseline time in the header.
- `.claude/redline.json`: reviewer `marcamos`, `checker: full`, `checkerStallMs: 300000`, three rounds, push on, the models block from the example.
- `.claude/settings.json`: `templates/settings.allow.json` without the Octane rule, plus the gate's commands (`bash -n`, `jq -e . hooks/hooks.json`, `claude plugin validate`, `tests/*.sh`, `node tests/loop-test.mjs`). Installed with `claude plugin install redline@redline --scope project`, which reorders the keys.
- `.gitignore`: `.claude/settings.local.json` and `.claude/redline.local.json`.

## Task 5: Verification Gate

Run `.claude/redline/checks.sh --baseline` until it exits 0 (steps 1 to 5), then the standards retrospective (step 6) and this folder's As built (step 7). The issue's "done when" adds a dry run: from a fresh session at the PR's head, `/redline:redline <pr> dry run review only` with zero permission denials and the review under the round's spec folder.

## As built (2026-10-21)

- Task 2 as planned. `tests/guard-test.sh`: 337 passed, 0 mismatched, from this checkout (repository `~/.cache/redline/guard-test-repo`) and from `Sites/chalkboard-feature-redline-plugin`. The self-hosted rows prove the directive: `deny Write scripts/redline-guard.sh` and `allow Write <plugin>/agents/redline-reviewer.md` can only hold when the checkout is the repository.
- Task 3 as planned, with one deviation recorded in `shape.md`: the "Code review" section came from Losers League, not Chalkboard, which does not have it.
- Task 4 as planned, with one deviation recorded in `shape.md`: the issue's `bash -n` over `hooks/*` became `jq -e . hooks/hooks.json`, since `hooks/` holds only JSON.
- Task 5: `checks.sh --baseline` exit 0, five checks at exit 0, 22 seconds, almost all of it the guard table. Standards retrospective: the eight standards are its output; see `shape.md`. The dry run is the user's to launch once the PR exists; its result is recorded in the PR.
- Commits: TBD (the user titles and makes every commit).
