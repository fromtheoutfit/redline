# References for PR #65 Review Round 2

Shaped by Redline in unattended mode. Every file below was opened while shaping. Line numbers are those at the PR head (`862ab55`).

## The four sentences R2-1 corrects

### README.md

- **Location:** `:221` (Known limits, "A run on this repository runs the PR's own code only when the plugin loads in place"), `:182-186` (The guard, the self-hosted bullet, which names no approver and is accurate), `:286` (the checker's allowed list is the approved plan)
- **Relevance:** Task 2 step 1 removes the approver from `:221`. `:286` is why a planned edit of the guard would pass the checker. Seven other lines name the plan approver (ask rules, the Docs step, the allowed list, the snapshot) and stay.

### CLAUDE.md

- **Location:** `:57`, the "This repository" bullet on guard changes
- **Relevance:** Task 2 step 2.

### .claude/commands/agent-os/shape-spec.md

- **Location:** `:25` (`## Unattended mode (Redline)`), `:70` (point 11, "The guard and the hook"), `:235` (`## Verification Gate`), `:252` (gate step 11, Version)
- **Relevance:** Task 2 step 3 changes point 11. The sentence sits outside the gate section, so there is no restamp.

### agent-os/standards/scripts/guard.md

- **Location:** `:9`, the self-hosted bullet
- **Relevance:** the fourth sentence, corrected through retrospective item 1 (Task 3).

## What the approver and the workflow actually do

### agents/redline-plan-approver.md

- **Location:** `:16-23`, checks 1 to 8; `:20`, check 5 (file scope: "the Redline plugin's own directory, `.claude/redline/`, ..."); `:22`, check 7 (standards, "as `standards.md` records them")
- **Relevance:** no check names `scripts/redline-guard.sh` or `hooks/hooks.json`. In cached mode the plugin's own directory is the cache. Not in the PR's diff, and not touched by this round.

### agents/redline-shaper.md

- **Location:** `:25`, rule 7 ("When the repository is the plugin itself (its checkout loaded in place) ... except `scripts/redline-guard.sh`, `hooks/hooks.json` and `.claude/redline/checks.sh` ... as the repository's unattended-mode section says")
- **Relevance:** the shaper's own rule covers the in-place case and defers to point 11. In cached mode, point 11 is the one instruction that names the two files.

### workflows/redline-loop.js

- **Location:** `planPrompt`, `:1217-1240`; `rulesBlock`, `:351-355`
- **Relevance:** the approver's prompt carries the spec folder, the PR's files, earlier paths, the repository's ask rules (none in `.claude/redline.json` here), the findings and the decisions. It has no guard-file rule.

## Round 1 and the original spec

### Round 1 spec: `agent-os/specs/2026-11-03-0852-65-review-round-1/`

- **Location:** `shape.md:42` (R1-3, the person's decision), `:51` (Investigation: the approver's check names the cache), `:56` (Proportionality: the marketplace still loads in place), `:68` (option 3's text, which named the approver), `:127` (Deferred mitigation), `:152` (retrospective item 4); `plan.md`, Task 4 (the three sentences as rewritten) and As built (commits `4884677`, `a3d420b`; harness counts)
- **Relevance:** R2-1's origin and the evidence for Unattended answer 1. Round 1's record is left as written.

### Original spec: `agent-os/specs/2026-11-02-2003-16-release-process-semver-tags-changelog/`

- **Location:** `plan.md:28`, decision 3 ("This PR is the exception: it keeps `0.1.0`, the first release, never tagged yet.")
- **Relevance:** Unattended answer 3, the Version step.

## Harness and gate facts

### tests/setup-test.sh

- **Location:** `:593-602` (this checkout's unattended section as the hand-edit fixture; `:599` looks for "The guard and the hook"; `:601` checks a `--merge` reproduces the section byte for byte)
- **Relevance:** Task 2 step 3 keeps point 11's title, and the merge case holds for any wording of the line.

### scripts/redline-gate.sh

- **Location:** header `:22-28` ("The hash covers every backticked span and every fenced block in the section ... Prose outside backticks never changes it.")
- **Relevance:** point 11 is outside the gate section, so its backticked spans are not in the hash.

## Searches

- `scripts/redline-gh.sh issues-search` for "plan approver", "guard hooks.json", "cached release", "self-hosted", "manifest", "0.1.1" and "redline-guard.sh": no issue covers R2-1 (shape.md, Unattended answer 2).
- `scripts/redline-gh.sh pr-comments 65`: the round 1 and round 2 reviews only.

## Not available

- No reviewer reproduction: `/tmp/redlinerepro/` does not exist, and none was needed.
