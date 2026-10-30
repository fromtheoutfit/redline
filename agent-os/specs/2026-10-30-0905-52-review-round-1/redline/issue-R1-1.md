Found as R1-1 in Redline round 1 on #52 ([the finding](https://github.com/fromtheoutfit/redline/pull/52#discussion_r4424010517)). The round deferred it because the fix belongs in `scripts/redline-guard.sh`, and only a person changes the guard. **It should be done soon.** The more serious half is not about ask rules: a Redline role can rewrite Redline's own protected files, including, in this repository, the guard itself.

## Priority: a Redline role can rewrite Redline's protected files

`writable()` cuts a write target at its first `*` or `?` (`scripts/redline-guard.sh:406`) and checks only the part before it. `protected()` compares that prefix with each protected pattern, and a prefix such as `.claude/settings` or `scripts/redline-guar` matches none of them. A `[...]` class or a `{a,b}` brace list is not cut at all: the literal text is compared, and it matches nothing either. The target is still inside the repository, so the implementer's `REPO` write prefix admits it, and the shell then expands the operand to the protected file.

The guard's decisions for `redline:redline-implementer`. These come from feeding the guard hook input, which only returns a decision; no command was run. The "this plugin" rows ran against this checkout (self-hosted). The "any repository" rows ran against the guard test's ask-rules fixture (`~/.cache/redline/guard-test-askrules`).

| Repository | Command | Decision |
|---|---|---|
| this plugin | `sed -i '' 's/a/b/' scripts/redline-guard.sh` | deny |
| this plugin | `sed -i '' 's/a/b/' scripts/redline-guar?.sh` | **allow** |
| this plugin | `sed -i '' 's/a/b/' scripts/redline-guar[d].sh` | **allow** |
| this plugin | `sed -i '' 's/a/b/' scripts/redline-guard.{sh,x}` | **allow** |
| this plugin | `echo x > scripts/redline-guar?.sh` | **allow** |
| this plugin | `sed -i '' 's/a/b/' hooks/hook*.json` | **allow** |
| any repository | `sed -i '' 's/a/b/' .claude/redline.json` | deny |
| any repository | `sed -i '' 's/a/b/' .claude/redline.js?n` | **allow** |
| any repository | `sed -i '' 's/a/b/' .claude/redline.jso[n]` | **allow** |
| any repository | `sed -i '' 's/a/b/' .claude/{redline,x}.json` | **allow** |
| any repository | `sed -i '' 's/a/b/' .claude/settings*.json` | **allow** |
| any repository | `echo x > .claude/settings.jso[n]` | **allow** |
| any repository | `sed -i '' 's/a/b/' .claude/agents/redline-*.md` | deny (`redline-*` matches the cut prefix) |
| any repository | `sed -i '' 's/a/b/' .claude/redline/check*.sh` | deny (the cut prefix is still under `.claude/redline/`) |
| this plugin | `sed -i '' 's/a/b/' .git/confi?` | deny (the cut prefix is still under `.git/`) |

What this exposes:

- **In this repository**, a Redline role can rewrite the guard that vets it (`scripts/redline-guard.sh`) and the hook that registers it (`hooks/hooks.json`). Both are meant to be changed only by a person.
- **In every repository**, it can rewrite `.claude/settings*.json` (the allow list that runs commands without a prompt) and `.claude/redline.json`. The second holds the ask rules, so an agent can remove the very rule that was meant to stop it.

The protected directories (`.git/`, `.claude/redline/`) hold, because the cut prefix still falls under them. An installed plugin outside the repository holds too: a wildcard path there is outside every write prefix.

## Also: paths ask rules (what R1-1 reported)

The same cut lets a write reach a file that a `paths` ask rule covers. The fixture's rules are `craft-config: config/project/**` and `yaml-anywhere: *.secret.yaml`.

| Command | Decision |
|---|---|
| `sed -i '' 's/a/b/' config/project/*.yaml` | deny |
| `sed -i '' 's/a/b/' config/proj*/project.yaml` | **allow** |
| `sed -i '' 's/a/b/' config/projec[t]/project.yaml` | **allow** |
| `sed -i '' 's/a/b/' config/{project,x}/project.yaml` | **allow** |
| `sed -i '' 's/a/b/' app/*.secret.yaml` | **allow** |

## What #52 shipped in the meantime

In `9ec60fd`:

- Two rows in `tests/guard-cases.tsv` under `# @cwd ASKRULES`, with a comment naming #52 R1-1, pin today's allow for `app/*.secret.yaml` and `config/proj*/project.yaml`.
- The README's Known limits says a Bash operand holding `*` or `?` is checked by its literal prefix only.

Nothing pins or documents the protected-files half, bracket classes or brace lists.

## Proposed fix

In `writable()`, when a write target holds `*`, `?`, `[` or `{`:

1. Brace-expand it, glob each result against `cur`, and run every match through `protected()` and `ask_rule()`.
2. Also refuse it when its literal prefix (cut at the first of those characters) could still reach a protected file or a rule's files. That covers three cases: the prefix is a string prefix of a protected pattern's path, it is a string prefix of a rule's root, or some rule has no literal root (`*.secret.yaml`). Step 1 alone is not enough. Expansion at check time sees the tree before the command runs, so a pattern that matches nothing yet is admitted, even when an earlier part of the same command creates the match.

A blunter option is to refuse every write target holding any of those characters outside the `TMP` prefix. It is simpler to get right. The cost is that an implementer could no longer use `sed -i '' ... tests/*.sh` (allowed today) and would name the files one by one.

Per CLAUDE.md, the same commit updates `tests/guard-cases.tsv`:

- a deny row for each **allow** above, for `redline:redline-implementer`, each beside its literal neighbour (`scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline.json`, `.claude/settings.json`, `config/project/project.yaml`), which stays deny;
- a row pinning the neighbouring decision for an ordinary wildcard target, `sed -i '' 's/a/b/' tests/*.sh`: still allowed under the first fix, denied under the blunt one;
- the two #52 R1-1 rows flipped to deny, with reasons naming `yaml-anywhere` and `craft-config`.

The README's Known limits clause that #52 added is then dropped, or reworded for whatever the fix leaves.
