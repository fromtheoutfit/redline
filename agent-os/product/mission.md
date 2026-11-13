# Product Mission

## Problem

The first rounds of a pull request's review are spent on the wrong things. The author waits for a second developer; the reviewer's first pass goes to what a careful reader with the test suite in hand would have found: a missing status filter, a tie counted as a win, a streak one short, a docblock that disagrees with its code. Each one costs a full round trip (comment, fix, push, re-review), and the reviewer's attention is used up before the question that needed a person, a product or design call, comes up. Agents can do those first rounds, but only if the author keeps every decision, the team keeps its planning conventions, and nothing an agent does is hidden from the review thread.

## Target Users

The author of a pull request, running Redline on their own PR from their own Claude Code session, in a repository that plans work through Agent OS and hosts it on GitHub. Today that is Chalkboard and Losers League (Laravel applications), and this repository. The second developer's review stays in place: Redline hands the PR to them once a round finds no new correctness item to fix or ask about, with every decision of the run posted with its owner and its reason.

## Solution

- **One command.** `/redline:redline <pr>` reviews the PR, posts one review per round, fixes what it found, pushes, replies in each finding's thread, and re-reviews the whole PR and the fix diff while a round finds a new correctness item to fix or ask about. Then it requests review from the teammate named in `.claude/redline.json`.
- **Fixes go through the repository's own planner.** Each round is an Agent OS spec: shape, approve the plan, implement one commit per finding, run the repository's gate (`.claude/redline/checks.sh`). Nothing is fixed outside a plan the repository's conventions would accept.
- **Every verified item is decided, and the real decisions stay with people.** The verifier states what is true; the shaper fixes what a careful author would fix without asking, declines what is not worth doing with a reason a teammate can read, and returns to the person, in their session, what turns on the product, the spec's assumptions, the pull request's scope, or a choice with no clear pick. Nothing is parked. The interrupt dial sets how often the run stops, from never to after every review, and every decision is posted with its owner (`decided by: redline`, `decided by: @login`, `decided by: redline (autopilot)`) and, when Redline made it alone, its reason, so the person can overrule it.
- **Guarded roles.** Eight agents, each with a default-deny allowlist of commands and write paths enforced by a hook, so a reviewer cannot write code and an implementer cannot push. Redline never edits Redline.
- **Honest about its reach.** A clean run means a round found no new correctness item to fix or ask about among what its coverage pass sampled and its recheck of the fixes read, not that no bug remains: what the run found and did not fix (declined with a reason, deferred, or decided and kept by a person) is listed in the handoff. Concurrency between the change and scheduled or queued work still belongs to the human review (README, Known limits).

Redline is not a replacement for the second developer, not a planner (Agent OS is), not a code-host client beyond `gh`, and not a formatter or linter.
