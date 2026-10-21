# Product Roadmap

## Phase 1: Dogfood

Redline runs on the repositories its author works in, and on itself. Agent OS is the planner and GitHub is the host; both are fixed in this phase.

1. **Extracted as a plugin** (done, 2026-10-20): the skill, the workflow, the eight agents, the guard and the GitHub wrapper moved out of Chalkboard into this repository as a single-plugin marketplace; each repository keeps its own contract (`.claude/redline/checks.sh`, `.claude/redline.json`, the allow list, the unattended section in shape-spec, the CLAUDE.md sentence).
2. **The interrupt dial, finding scope and decision owners** (done): `autopilot`, `guided`, `plan`, `review`, `review only`; `correctness only`; `decided by:` on every decision.
3. **Saved launch settings** (done): `.claude/redline.local.json` per person per repository, with a tested merge.
4. **Redline on Redline** (#4): Agent OS and the per-repo contract in this repository, and the guard's self-hosted case, so a Redline PR gets a Redline review.
5. **A seeded PR per repository before the first real one**: a branch with planted bugs whose answer key lives outside the repository, to measure the reviewer's recall there. Three seeds in Chalkboard so far: 7 of 7 in-function bugs found on the right line, one race missed.
6. **A second machine**: a teammate installing from `extraKnownMarketplaces` in a repository's `.claude/settings.json` has not been tried.

## Phase 2: Beyond Agent OS and GitHub

Each is a backlog issue; none is built until Phase 1 has run for a while.

- **Planners beyond Agent OS** (#1): a built-in planner for a repository without Agent OS, and a way to pick from the common planning conventions at setup.
- **Code host and issue tracker providers** (#2): GitLab, Bitbucket and Jira behind the same `redline-gh.sh` shape.
- **The stack axis** (#3): the guard's command groups and the agents' language assumptions (Laravel, PHP, Pest, Octane) configurable per repository. Until then the reviewer cannot run this repository's own tests to reproduce a finding, and the implementer runs them only through `checks.sh`.

## Open Items

- **The missed race.** The reviewer is now asked about scheduled and queued work on the same data; until a seed shows the check working, concurrency belongs to the human review.
- **A run on this repository runs the PR's own code.** Loaded in place, the plugin that reviews a PR here is the PR branch's skill, workflow, agents and guard, not a released copy. Acceptable while the gate protects the guard; a released copy would need a cache install.
