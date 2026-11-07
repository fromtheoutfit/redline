# References for PR #80 Review Round 2

Shaped by Redline in unattended mode. Line numbers are at `bac0b25`, the PR head this round reviewed.

## Similar Implementations

### The coverage pass in the workflow

- **Location:** `workflows/redline-loop.js`
- **Relevance:** R2-1, R2-2 and R2-3 are here.
- **Key patterns:**
  - `reviewPrompt()`: the history line (1112), "never re-raise a declined, deferred or decided one". It does not name `fixed`, which is part of R2-1's evidence.
  - `candidatesBlock()` (1151-1167): the definition of new (1162), which lists `fixed` among the outcomes a candidate collapses into; R2-1.
  - `coveragePrompt()` (1172-1180): shows each marker inside backticks (1179) and tells the agent not to post anything (R2-5's only in-prompt limit); R2-2.
  - `coverageCandidates()` (1182-1223): the markers tested first, anchored at the start of the whole text (1192, 1195), then the fenced scan (1198-1221) with R1-3's contract-field skip, then `no array` (1222). R2-2 moves the marker tests after the scan and lets them match at any line start.
  - `coverageMessage()` (1225-1238): one message per cause, each naming its fix; the drift message (1235-1236) is what a missed marker gets today.
  - `accountCoverage()` (1240-1303): `byId` from the round's ids as renamed (1249). A `finding` entry whose ref names no finding goes under For the person (R1-4, 1268-1274). R2-3 keeps this rule for an unknown ref and rewrites the ref of a renamed id before it runs.
  - `review()` (1962-2043): the review call's label (1989), `review r<n>` for a whole-PR round, `final nit pass r<n>` for the nit pass, `re-review r<n>` for a fix-diff round; Task 5's proof reads the label the round gets (plan approver adjustment 1, `shape.md` Decision 7). The rename loop (1993-1999) changes `f.id` only. `out.coverage` is normalised (2013) and accounted for after the carry-forward reconcile (2029-2031). R2-3's map and rewrite sit in these two places.

### The reviewer's instructions

- **Location:** `agents/redline-reviewer.md`
- **Relevance:** the first list's `knownAs` rule (20), "A finding an earlier round declined, deferred or decided is not raised again" (22) and the "New carries the run's done rule" paragraph (30), which lists `fixed` among the settled outcomes; R2-1.

### The guard's main-session row

- **Location:** `scripts/redline-guard.sh`
- **Relevance:** R2-5. The fast path (43-60) sends a non-role Bash call naming a Redline script, `checks.sh` or git to Python with `REDLINE_GUARD_MAIN=1`; the main row's groups (184-189); the approval it prints (166); `checks.sh` (1064), every `redline-gh.sh` subcommand (1070-1072) and `redline-prefs.sh` (1079) approved under `main`; `GH_READ` (737), the read subcommands option B would keep approved.
- **Location:** `tests/guard-cases.tsv`, #50's comment and rows (387-407).
- **Relevance:** where option B's pinned row sits.
- **Location:** `scripts/redline-gh.sh`, the write subcommands `post-review` (441), `reply` (469), `comment` (479), `issue-create` (492), `resolve-threads` (535); `skills/redline/SKILL.md:231`, the main session's one write (`issue-create`, after the person picks "Open an issue").

### Setup's rerun of redline.json

- **Location:** `scripts/redline-setup.sh` header (68-83) and `config_differs` (880); `skills/setup/SKILL.md:109`; `docs/contract.md:113` (the `models` row).
- **Relevance:** R2-4. A rerun updates only `checker`, `checkerStallMs` and, with `--ask-rules`, `askRules`, lists the differing top-level keys under differs, and leaves them; `--force` drops every hand-set value.

### The loop test

- **Location:** `tests/loop-test.mjs`, section 15 (from 1268)
- **Relevance:** where every new loop check lands.
- **Key patterns:** `pick` (241) finds a call by exact label, so a check reads the label the workflow gives that round; `covArgs`, `cand`, `fenced` and `two` (1274-1277); `settledAll` (1319); the `coverage: a new verified finding runs another round` run (1320) and its round-3 check (1321, reading `re-review r3`), where Task 5's check goes before line 1322 reassigns `run`; the accounting scenario with the `R9-9` ref (1355-1365), R2-3's neighbour; the three-causes loop (1386-1389), the R1-3 drift loop (1392-1395) and the empty-array check (1398-1399), R2-2's neighbours; the `coverage: off` run (1419) and its checks (1420-1422), which read `review r1` and `final nit pass r2`, Task 5's neighbour; `f()` (205) builds a finding with any id, so a reviewer id without the round's prefix can be scripted.

### The docs

- **Location:** `docs/running.md`, the loop's step 7 ("new means not collapsed into a finding already reported, settled in an earlier round, carried forward or tracked elsewhere"), "The coverage pass" (the three causes, the accounting, and "What the guard does not vet", line 56); `README.md` Known limits, "The coverage pass runs outside the guard" (101); `docs/guard.md` (7, the fork sentences); `CHANGELOG.md` (13-14).
- **Relevance:** R2-2 and R2-3 change no reader-facing text. R2-4 rewrites `CHANGELOG.md:13`. R2-1's options A and B would change step 7 and "The coverage pass"; option C adds a line to `README.md` "Known limits". R2-5's options both correct `docs/running.md:56`, `README.md:101` and `docs/guard.md:7`.

### The #79 spec and round 1

- **Location:** `agent-os/specs/2026-11-05-1443-79-two-reviewer-whole-pr-round/shape.md`, Decision 15 (`0.2.0`, CHANGELOG entry undated) and Decision 21 (line 35: new is "not collapsed into a known, dispositioned or carried finding", decided by the person); `agent-os/specs/2026-11-06-1019-80-review-round-1/shape.md`, Decision 3 and Unattended answer 3 (R1-4's rule for a `finding` ref naming no finding).
- **Relevance:** R2-1's evidence, R2-4's context and the rule R2-3 must keep.

### This round's record

- **Location:** `agent-os/specs/2026-11-06-1019-80-review-round-2/redline/round-2-review.json` and `round-2-findings.json`
- **Relevance:** the five findings as posted; the accounting shows the gap R1-3 left (the For the person entry on `workflows/redline-loop.js:1209`) went under For the person, not `settled`; R2-1's context.

### Known-finding check

- `scripts/redline-gh.sh issues-search "coverage"`: #74, #79, #73, #20. `issues-search "guard"`: #66, #50, #76, #3, #32, #30, #26, #24, #79, #2, #1. None covers this round's findings; #50 is where the main-session approval came from.
- No reviewer reproduction exists for round 2 under `/tmp/redlinerepro/`.
