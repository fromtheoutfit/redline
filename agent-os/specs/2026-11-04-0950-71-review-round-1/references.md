# References for PR #71 Review Round 1

Shaped by Redline in unattended mode. Every file below was opened in this shaping session, at the PR's head `89dcbfe`.

## The files the findings name

### CONTRIBUTING.md (R1-1, R1-2)

- **Location:** `CONTRIBUTING.md:7` ("Developing the plugin"), `:29` ("Releases")
- **Relevance:** line 7 carries the stale pointer "Template version" under `checks.sh`; line 29 runs `claude plugin tag` with no Claude Code version.
- **Key patterns:** a relative link from the root is `[docs/contract.md](docs/contract.md)`, as line 3 links `[docs/](docs/)`.

### docs/contract.md (R1-1's target)

- **Location:** `docs/contract.md:97-99`, `## Template version`
- **Relevance:** the heading the pointer should name; its paragraph ends with the self-hosted warning `redline-setup.sh version` prints (#16).

### docs/guard.md (R1-3)

- **Location:** `docs/guard.md:170`
- **Relevance:** the timing sentence. Its source is `.claude/redline/checks.sh:28` and `.claude/redline/checks.json:10-12` (`"seconds": 78` and the note), both a person's files, read only.

### docs/running.md (R1-4, R1-5)

- **Location:** `docs/running.md:23` ("Launching a run"), `:27-29` ("Precheck"), `:104` ("The run record")
- **Relevance:** line 23 says the next run after a dry run starts at round 1; line 104 says a dry run's commits stay on the local branch; lines 27 and 29 both end a paragraph with the background sentence.

### docs/scripts.md (R1-6)

- **Location:** `docs/scripts.md:5`
- **Relevance:** the opening claim about what every script prints, checked against the headers it quotes: `scripts/redline-gh.sh:7-20` (the read subcommands; `diff`, `pr-comments`, `issues-search`, `has-review`), `scripts/redline-gate.sh:12-13` (`stamp`). `scripts/redline-guard.sh:737` (`GH_READ`) lists which subcommands are read subcommands.

### docs/upgrading.md (R1-7)

- **Location:** `docs/upgrading.md:5-25`
- **Relevance:** the three headings and the bold lead-ins under them.

## The code behind R1-4

### The dry run's record commit

- **Location:** `workflows/redline-loop.js:2968-2972` (the review-only path: `phase('Finish')`, `recordCommit = await commitRecord()`), `:1466-1469` (`recordCommitPrompt`: "Do not push (... 'this is a dry run'); set pushed false")
- **Relevance:** a dry run commits its record locally and never pushes it.

### The precheck that stops the next launch

- **Location:** `skills/redline/SKILL.md:80-98` (section 4, steps 3 to 5 and the stop lines), `:32` (`dry run` sets `postToGitHub` and `push` false), `:167` (the `review-only` summary, with the dry-run sentence the PR added)
- **Relevance:** step 5 requires HEAD to equal the PR's head; the stop line is "pull or push so HEAD matches the PR". `README.md:93`, Git rule 7, says the same of a fresh launch.

### Where a person is sent to a dry run

- **Location:** `skills/setup/SKILL.md:178` (the hand-back recommends `dry run review only` on a real PR), `docs/setup.md:142-144` ("Before the first real PR")
- **Relevance:** the path on which the next launch stops.

## The original spec and the old README

- **Location:** `agent-os/specs/2026-11-03-1259-14-public-docs/plan.md` (decisions 1, 5, 7 and 10; the section map; the As built and its walkthrough fixes), `agent-os/specs/2026-11-03-1259-14-public-docs/shape.md` (walkthrough log items 3 and 4)
- **Relevance:** the rule that every reference moves with its section (R1-1, R1-2), the patch bump (no new bump this round), and what the walkthrough found about a dry run (R1-4).
- **Old README:** `git show main:README.md`, line 20 ("Developing the plugin", the source of R1-1's pointer), line 24 (Requirements, with "`claude plugin tag` is 2.1.316's", R1-2), line 194 (the guard harness paragraph, which had no timing sentence, R1-3).
- **The #16 spec:** `agent-os/specs/2026-11-02-2003-16-release-process-semver-tags-changelog/plan.md:118` and `shape.md:19`, where 2.1.316 entered the Requirements line for `claude plugin tag`.

## The pattern for this spec folder

### PR #65, review round 1

- **Location:** `agent-os/specs/2026-11-03-0852-65-review-round-1/plan.md`, `shape.md`
- **Relevance:** the most recent review round on this repository, with a doc-only fix shaped as an exact replace plus `grep -c` proofs, and a pending decision held as options.
- **Key patterns:** proofs as `grep -c` counts (its As built records that `bash -n` on its own was refused to the implementer, so no proof here runs `bash`); the Docs entry for a reader-facing file is "the reader-facing text itself".
