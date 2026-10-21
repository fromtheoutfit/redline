# Product Mission

## Problem

The first rounds of a pull request's review are spent on the wrong things. The author waits for a second developer; the reviewer's first pass goes to what a careful reader with the test suite in hand would have found: a missing status filter, a tie counted as a win, a streak one short, a docblock that disagrees with its code. Each one costs a full round trip (comment, fix, push, re-review), and the reviewer's attention is used up before the question that needed a person, a product or design call, comes up. Agents can do those first rounds, but only if the author keeps every decision, the team keeps its planning conventions, and nothing an agent does is hidden from the review thread.

## Target Users

The author of a pull request, running Redline on their own PR from their own Claude Code session, in a repository that plans work through Agent OS and hosts it on GitHub. Today that is Chalkboard and Losers League (Laravel applications), and this repository. The second developer's review stays in place: Redline hands the PR to them once a round finds no correctness bug, with every decision of the run posted and attributed.

## Solution

- **One command.** `/redline:redline <pr>` reviews the PR, posts one review per round, fixes what it found, pushes, replies in each finding's thread, and re-reviews the fix diff until a round finds no correctness bug. Then it requests review from the teammate named in `.claude/redline.json`.
- **Fixes go through the repository's own planner.** Each round is an Agent OS spec: shape, approve the plan, implement one commit per finding, run the repository's gate (`.claude/redline/checks.sh`). Nothing is fixed outside a plan the repository's conventions would accept.
- **Decisions stay with people.** A finding that needs a product or design decision is returned to the author in their session, never decided by an agent. The interrupt dial sets how often the run stops, from never to after every review, and every decision is posted with its owner (`decided by: redline`, `decided by: @login`, `decided by: redline (autopilot)`).
- **Guarded roles.** Eight agents, each with a default-deny allowlist of commands and write paths enforced by a hook, so a reviewer cannot write code and an implementer cannot push. Redline never edits Redline.
- **Honest about its reach.** A clean run means no correctness bug in the changed code that the reviewer could read or reproduce. Concurrency between the change and scheduled or queued work still belongs to the human review (README, Known limits).

Redline is not a replacement for the second developer, not a planner (Agent OS is), not a code-host client beyond `gh`, and not a formatter or linter.
