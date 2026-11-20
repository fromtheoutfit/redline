# References for PR #112 Review Round 1

Shaped by Redline in unattended mode. Every file below was opened while shaping, at `34acd12`.

## The code under review

### `scripts/redline-gh.sh`

- **Location:** the header's `place` entry (90-106) and `post-review` entry (117-132); `pr_files` (254-269); `wanted_files` (291-297); `diff_sections` (305-315); `recover_hunks` (317-375), its pinned `git diff` (365-367) and the comment on its flags (326-329); `diff_positions` (382-396); `place_comments` (398-458), the kinds (423-432), the cause lines (433-440), `placed` and `cause` (446-447), `block` (448); the `place` subcommand (525-534); the `post-review` subcommand (687-746), its temp files and trap (695-701), the loop (708-737), the `status` read (715) and the fallback (723-731).
- **Relevance:** every finding of the round but R1-1 and R1-3 is in these lines; R1-1 and R1-3 compare the texts with them.
- **Key patterns:** one source of positions through a temp file; the `@@@redline-file` stream both sources write; the refusal loop's bound (one post per sourced file, one fallback).

### `tests/gh-test.sh`

- **Location:** the harness header (47-63); `leftover()` (83-88); the PR 20 and PR 21 fixtures (102-195) and the pinned-configuration gitconfig (165); the shim's review POST (283-305), `refuse` (292-296) and `named` (298); the patch-less `place` cases (425-451); the clone cases (453-490), the pinned-configuration case (466-467); the `post-review` cases (492-545), `fresh_posts`, `posts`, `post_paths`, `post_body` and `BINARY_GROUP` (503-509), the fallback case (526-532).
- **Relevance:** every task but 7 and 9 adds its cases here, beside these.
- **Key patterns:** a review file written with `jq -n` into `$WORK`; the shim's lists (`too-large.txt`, `unresolved.txt`) chosen per case after `fresh_posts`; `posts` and `post_paths` read the payload log; a leftover count by glob.

## The pull request's own spec

### `agent-os/specs/2026-11-19-1523-96-place-findings-on-patch-less-files/`

- **Location:** `shape.md`, decisions 3, 5, 11, 12, 24 (lines 15, 17, 26, 28, 49) and deviation 20 (45); `plan.md`, the causes table (80-88) and the design of the post (114-120), line 117 in particular.
- **Relevance:** Unattended answers 4 to 7 are answered from these lines: decision 11's "a round never fails to post because of the new path" (R1-10), the causes table and the post's design (R1-6, R1-7), decision 12's source order (R1-3), decision 24's known edge (R1-5), decision 5's narrowed Known limits line (R1-1).

## The texts

- `README.md:114`, Known limits, the patch-less bullet (R1-1, R1-3).
- `docs/running.md:29`, Precheck (R1-3); `docs/running.md:37`, Rounds, step 1 (R1-1); `docs/running.md:218`, "How the review is posted" (R1-6's design reading).
- `docs/scripts.md:127-142`, the quoted `post-review` header entry (Tasks 5 and 6).
- `skills/redline/SKILL.md:99`, step 7's over-300-files warning (R1-3).
- `agents/redline-github.md:22`, the post-review bullet: a non-zero exit is reported and stops the agent (Task 5 needs no agent change).

## The workflow's placeholder

- `workflows/redline-loop.js:1819-1823` (`NO_FILE` and its comment), 1935-1940 (a minted finding with no file), 2913-2918 (`post` writes `path: f.file`).
- **Relevance:** R1-7's placeholder and R1-8's likelihood: the workflow always writes a path.

## Outside the repository

- `/Library/Developer/CommandLineTools/usr/share/man/man1/git.1:1655-1657`, `GIT_DIFF_OPTS`: "This takes precedence over any "-U" or "--unified" option value passed on the Git diff command line." (R1-4).
- `/tmp/redlinerepro/reviewer-r1-nopath.json` and `/tmp/redlinerepro/reviewer-r1-nofile.json`, the reviewer's reproduction inputs for R1-8 and R1-7.
- jq 1.8.2 on this machine: `{"a.txt":"hunks"} | (.[null] // "absent")` fails with `Cannot index object with null`; `.[(null // "")] // "absent"` gives `"absent"`; `"a" + 5` fails with `string ("a") and number (5) cannot be added` (R1-8, and R1-9's test input).
