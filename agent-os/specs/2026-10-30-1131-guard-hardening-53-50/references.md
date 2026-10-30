# References for guard hardening (#53, #50)

Line numbers are as of the survey on 2026-10-30, before any change.

## The guard

- **`scripts/redline-guard.sh`** 41-50 (the jq fast path: every non-role exits before Python), 101-110 (the role table), 195-214 (`TMP_DIRS`, `PROTECTED_DIRS`, `PROTECTED_FILES`, the self-hosted files), 329-347 (`ask_rule()` and the "holds" branch), 363-394 (`protected()`), 397-424 (`writable()`: the cut at 406, realpath at 410, the prefix loop), 429-434 (the Write/Edit branch), 616-632 (`script_name()`: the realpath pinning of `checks.sh`, `redline-gh.sh`, `redline-background.sh`), 664-712 (`check_simple()`: env prefixes stripped at 678, `env` at 684, `xargs`, the writers), 733-751 (the script branch), 753-787 (`rm/mkdir/touch/mv/cp/tee`, `sed -i`), 792-815 (`find -exec` substitutes `{}` with the starting point), 854-959 (`check_git()`: the global loop at 855, `GIT_READ` at 868, `git add`'s glob refusal at 902), 1010-1013 (the final decision).
- **Relevance:** `writable()` is one function for every tool and Bash form, so the pattern refusal sits there once; `script_name()` is the pinning the main-session approvals reuse; `check_git()` is one place for the flag vetting, shared by roles and the main session.

## The guard harness and the case table

- **`tests/guard-test.sh`** 39-44 (the cache repository), 46-67 (the ask-rules fixtures), 76-90 (the hook input: `-` means no `agent_type`), 91-104 (the decision and the fifth column).
- **`tests/guard-cases.tsv`** 1-9 (format), 11-12 (the reviewer's `git diff`/`git log` allows), 174-215 (protected files, `xargs`, `find -exec`), 268-300 (the main session's `inert` rows, the unknown role, the plugin's directory), 385-447 (`# @cwd PLUGIN`: the self-hosted rows, the guard and hook refused), 449-495 (`# @cwd ASKRULES`: row 458 `config/project/*.yaml` "holds", rows 479-480 the #52 R1-1 allows, `ASKRULESBAD`).
- **Relevance:** every new decision lands as a row beside its literal neighbour; the main-session rows use `-` and expect `allow` or `inert`.

## Setup

- **`scripts/redline-setup.sh`** 1-98 (the header: the output contract of every subcommand; usage), 108-174 (`cmd_settings`: the jq merge at 140-147, the output at 162-173), 832-889 (`cmd_checks`: the version line read from the template at 846-851), 1044-1074 (`cmd_version`).
- **`tests/setup-test.sh`** 65-132 (the settings cases; 76 asserts the template's one `redline-setup` rule), 331-391 (the Laravel shape; 368 spells `v1`), 393-406 (the scratch repository that runs a generated file), 452-469 (the version cases spelling `v1`), 471-479 (this checkout's `checks.sh` regenerated and compared).
- **`scripts/checks-template.sh`** 32-40 (the stamp and version lines), 276-286 (the git block's untracked-lines assignment at 285 under `set -euo pipefail`).
- **`skills/setup/SKILL.md`** 13-26 (step 1, the inventory), 110-116 (step 8, settings), 140-142 (step 11, CLAUDE.md).
- **`templates/settings.allow.json`**, **`templates/claude-md-git-sentence.md`**.
- **Relevance:** `settings` needs a record of what the template used to carry to report it stale; the version line is the port signal; the scratch repository is where the symlink case runs.

## README and standards

- **`README.md`** 24-32 (Upgrading), 34-47 (Set up a repository: items 3 and 6), 115-131 (Ask rules: the paths bullet at 128), 139-162 (Files), 164-170 (The guard), 182-190 (Known limits: the #52 clause at 187), 290 (Template version), 301-315 (`redline-setup.sh`).
- **`agent-os/standards/scripts/guard.md`** 14, 16, 17; **`scripts/bash-conventions.md`** 30; **`testing/tests.md`** 69: the lines the retrospective rewords.
- **`agent-os/specs/2026-10-30-0905-52-review-round-1/shape.md`**: R1-1's disposition, the deferred entry's intended lines, and the observation that the same cut feeds `protected()`.

## Pattern

- **`agent-os/specs/2026-10-30-0826-49-per-repository-ask-rules/`**: the plan shape (Context, Decisions, tasks with files and rows, Docs entries, Verification) and the shape.md layout with owners on every decision.
