# References for PR #65 Review Round 1

Shaped by Redline in unattended mode. Every file below was opened while shaping; line numbers are the PR head's (`3587774`).

## The original spec

### Release process (#16)

- **Location:** `agent-os/specs/2026-11-02-2003-16-release-process-semver-tags-changelog/` (`plan.md`, `shape.md`)
- **Relevance:** the PR's own spec. Decision 3: the Version step's rule, "the reviewer treats a missing bump as a nit" (R1-1), and this PR keeps `0.1.0`. Decision 4: the `(unreleased)` marker the tag checklist replaces with the tag date (R1-2). Decision 8: the precheck warns and goes on (R1-3). Task 6.3: the README's first draft of the release order. Task 8, steps 2 and 3: commit the CHANGELOG, then tag (R1-2). As built 1: `version <repoRoot>` takes no flag and reads its own path.
- **Key patterns:** the release order is Task 8's; decision 8 is the person's and is not reversed by this round.

## Files the findings name

### README.md

- **Location:** `README.md:20` (Install, "Developing the plugin"), `:184` (The guard, the self-hosted bullet), `:206-210` (Contributing, the gate, Docs and "Releases"), `:221` (Known limits, "A run on this repository runs the PR's own code only when the plugin loads in place"), `:349` (the `redline-setup.sh` table, `version <repoRoot>`)
- **Relevance:** R1-2 rewrites the procedure sentence in `:210`. R1-1's options touch the sentence before it. R1-3's options touch `:221` (and `:20` for option 1). R1-4's README row at `:349` already lists the case.

### scripts/redline-setup.sh

- **Location:** header `:104-123` (`version <repoRoot>`), `:141-145` (Exit codes), `version_plugin` `:1449-1468` (the `die2` at `:1460`), `cmd_version` `:1472-1495` (the plugin part at `:1491-1492`)
- **Relevance:** R1-4. The header's exit-2 sentence misses the case that `:1460` exits on and `cmd_version` passes through.

### tests/setup-test.sh

- **Location:** `:796-806` (the `version <repoRoot>` plugin cases: not the plugin, a self-hosted root elsewhere, another plugin, a manifest that is not JSON), `:837` (this checkout in place), `:593-601` (this checkout's unattended section as the hand-edit fixture; `:599` reads "The guard and the hook" as a hand edit)
- **Relevance:** `:806` pins R1-4's behaviour. `:599` constrains R1-3's option 3 (keep point 11's title).

### scripts/redline-guard.sh and tests/guard-cases.tsv

- **Location:** `scripts/redline-guard.sh:62`, `:132` (`PLUGIN` from `CLAUDE_PLUGIN_ROOT`), `:237-243` (`SELF_HOSTED`, `SELF_HOSTED_FILES`); `tests/guard-cases.tsv:445-450` (a repository that is not the plugin: the guard's file names are ordinary content), `:543-560` (the `# @cwd PLUGIN` self-hosted block)
- **Relevance:** R1-3. The protection depends on the repository being the loaded plugin directory. Read only; no Redline role may change the guard.

### skills/redline/SKILL.md and skills/setup/SKILL.md

- **Location:** `skills/redline/SKILL.md:80-85` (section 4, Precheck, step 1: "A warning, never a stop"); `skills/setup/SKILL.md:25` (`selfHosted` by the same path comparison)
- **Relevance:** R1-3's option 1 changes the precheck; the setup skill's comparison is the side note in the finding.

### CLAUDE.md

- **Location:** `CLAUDE.md:57` ("the guard refuses them for every role even when this repository is the one under review")
- **Relevance:** R1-3's option 3 corrects this sentence.

### .claude/commands/agent-os/shape-spec.md

- **Location:** `:70` (point 11 of the unattended section, "The guard and the hook"), `:241-262` (the Verification Gate; step 11 Version at `:252`)
- **Relevance:** R1-1 (step 11's "The reviewer"). R1-3's option 3 (point 11). The gate's prose outside backticks does not move the stamp.

### scripts/redline-gate.sh

- **Location:** header `:22-28` ("The hash covers every backticked span and every fenced block in the section ... Prose outside backticks never changes it.")
- **Relevance:** rewording "The reviewer" in gate step 11 (R1-1) needs no restamp.

### agents/redline-reviewer.md and agents/redline-plan-approver.md

- **Location:** `agents/redline-reviewer.md:34` (the Docs bullet); `agents/redline-plan-approver.md:20` (check 5, file scope: "the Redline plugin's own directory"), `:23` (check 8, Docs entries)
- **Relevance:** R1-1. The Docs step is wired into both roles, and the Version step into neither. R1-3: the plan approver's file scope names the loaded plugin's directory, which in cached mode is not the checkout.

### CHANGELOG.md

- **Location:** `CHANGELOG.md:3` (header, "written by the person at tag time"), `:5` (`## 0.1.0 (unreleased)`), `:23` (the `#NN` line)
- **Relevance:** R1-2. These are what a tag taken before the entry's commit would name.

### Standards

- **Location:** `agent-os/standards/process/release.md` (lines 5, 8, 11), `agent-os/standards/process/docs-gate.md`, `agent-os/standards/scripts/guard.md` (line 9), `agent-os/standards/scripts/bash-conventions.md` (the header bullet)
- **Relevance:** see `standards.md`, and the proposed and held retrospective items in `shape.md`.

### agent-os/product/roadmap.md

- **Location:** `:14`, item 8, "Release process (#16)"
- **Relevance:** product context; "`CHANGELOG.md` at tag time", which either order satisfies.

## Not available

- No reviewer reproduction: `/tmp/redlinerepro/` does not exist, and none was needed. Every finding is a statement in a file.
