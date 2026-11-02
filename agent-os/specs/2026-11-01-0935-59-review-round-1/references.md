# References for PR #59 review round 1

Shaped by Redline in unattended mode. Every file below was opened while shaping.

## Code the findings name

### The run marker

- **Location:** `scripts/redline-prefs.sh` (header lines 19-47; `run save` lines 123-166; `run check` lines 168-216)
- **Relevance:** R1-1 (`specFolders` built only from the result, lines 158-161; the untracked rule, lines 209-213), R1-2 (the `.claude/` rule for every kind, lines 192-207), R1-4 (`hand` from the marker's head only, lines 196-198).
- **Key patterns:** one jq program per subcommand; `refuse()` prints the one JSON object with `reason` and `line`; the start snapshot's folder is read off `args.repoRoot` and the fixed `/redline/snapshot-start.json` tail, never split on `/redline/` (the original spec's As built).

### The skill's stop and resume handling

- **Location:** `skills/redline/SKILL.md` (section 3 line 46; section 4 lines 69-80; "Save the run record" and "Write the marker", lines 207-209; `error`, line 233)
- **Relevance:** R1-3 (section 3 runs before the resume choice), R1-4 (the resume entry written at line 76), R1-5 (the null branch at line 233 neither writes nor clears).
- **Key patterns:** every finishing handler (`review-only`, `done`, `capped`) runs `run clear` first; a resume relaunches with the marker's `args`, never from memory (the Rules section).

### The workflow's folders, resume and Finish

- **Location:** `workflows/redline-loop.js`
- **Relevance:** the launch stamp (lines 48-52) and `specFolderFor` / `humanFolderFor` (lines 264-265), which R1-1 mirrors; `result()`'s `specFolders` and `snapshotStart` (lines 1647-1648); `rounds.push(record)` after `post()` in the main loop and the human pass's nit round (R1-1 (2)); `resume`, `handCommits`, `handPaths` (the `args.resume` block); `resumeLine()` and `run()` (R1-6); `judge()`'s `excused` and `unprefixed` (R1-2, R1-4); `finishPrompt()`, `recordStatusPrompt()`, `recordCommitPrompt()`, `finish()`, `commitRecord()` (R1-6); the catch's `resumeFrom` (R1-5).
- **Key patterns:** a per-agent clause in `resumeLine()` (the shaper's replace sentence) is the model for R1-6's two clauses.

### The GitHub role

- **Location:** `agents/redline-github.md` (lines 22-25: `post-review`'s `has-review` check, `reply`'s duplicate check, `comment` with none)
- **Relevance:** R1-6: the "duplicate checks in your instructions" the resume line promises exist for posting a review and a reply, not for the closing comment or the record commit.

### The guard's allowed spellings for the GitHub agent

- **Location:** `tests/guard-cases.tsv` rows 490-500
- **Relevance:** R1-6's record-commit clause uses only `git -C <root> status --porcelain --untracked-files=all -- ...` (row 490) and `git -C <root> rev-parse HEAD` (row 493), so no guard change is needed.

## Tests

### Prefs harness

- **Location:** `tests/prefs-test.sh` lines 100-237
- **Relevance:** the record fixtures (`stopped.json` with no result; `nested.json` with a repository path holding `/redline/`), "save: no result is a stopped run" pinning `specFolders` `[]` (R1-1), "save: a refused save leaves the entry" (R1-5), "check: a hand commit under .claude/ is allowed" (R1-2, R1-4).
- **Key patterns:** `runj`, `runx`, `runerr`; a throwaway git repository with the marker's head `RUNHEAD`; cleanup with `rm -rf "$REPO/agent-os"` and `reset --hard`.

### Loop harness

- **Location:** `tests/loop-test.mjs` (the GitHub mock, lines 70-95; the record section around lines 370-430, "record: the commit fails" at line 426; the resume scenario, lines 1020-1105)
- **Relevance:** R1-4's two-commit judge check sits beside "resume: a hand commit is excused"; R1-6's checks reuse `recordError` and add a Finish comment error to the mock.
- **Key patterns:** `samePrefix` for the cached prefix; `pick(calls, label).prompt.endsWith(line(...))` for the resume line.

## Specs and docs

- **Original spec:** `agent-os/specs/2026-11-01-0911-10-resume-a-run-that-ended-in-error/shape.md`: Scope (the HEAD and untracked rules), Decisions 1, 3, 10 and 12, Context (duplicate checks on a resume).
- **README:** "Launching" (line 189, the resume paragraph), "Known limits" (line 205), "Saved preferences" (line 106), "Git rules for Redline agents" rule 7 (line 218).
- **Reviewer's reproduction:** `/tmp/redlinerepro/reviewer-r1-marker.sh`, read, not run (the guard refuses `bash <file>` to the shaper).
- **Product:** `agent-os/product/mission.md`, "Decisions stay with people".
