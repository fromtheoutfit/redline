# References for PR #97 Review Round 2

Shaped by Redline in unattended mode. Every file below was opened at `54b13f1` for this round.

## Similar Implementations

### The record write in `redline-gh.sh defer` (R2-1)

- **Location:** `scripts/redline-gh.sh`, the `defer` header (111-131), `defer_cleanup` (176-183), `defer_record` (185-202), the `defer` subcommand (567-638: the lookup at 615-624, `gh issue create` at 629, the record write at 636); `docs/scripts.md`, the quoted header (121-141); `tests/gh-test.sh`, the fake `gh`'s `issue` handler with its `GH_FAKE_CREATE_WRITES` hook (85-115) and the `defer` cases (401-475), R1-3's corrupt-record case among them (456-462).
- **Relevance:** R1-3 gave the `jq` step its own named failure; R2-1 gives the steps around it the same.
- **Key patterns:** one message shape for a failed write (`<record> <what is wrong> when <finding>'s entry is written; not recorded: <entry>`), the one `EXIT` trap that removes the temp file, a gh case that grep-counts the issue's URL on stderr.

### Deferrals in `revise()` (R2-6, R2-12, R2-13, R2-14, R2-15)

- **Location:** `workflows/redline-loop.js`: `DEFERRED_SCHEMA`, `hasMitigation`, `DRAFT_FIELDS` and `draftMissing` (757-779); the shaper schema's `files` (816-818); `RESOLVE_SCHEMA` (830-845); `resolvePrompt` (1973-2019); `implementPrompt`'s dispositions line (2114); `outcomesFor` and `shipsNothing` (2868-2914); `checkDispositions` and its stray-entry block (2962-3006); `checkDrafts` (3092-3103); `vetShape` (3504-3526); in `revise()`: `draftsOf` (3559-3567), `let resolved` and `resolveDeferred` (3617-3621), `resolveWith` (3622-3673) with its `undrafted` check (3663-3666) and its merge (3670), `plannedTask` and `isDeferral` (3678-3697), the reshape's resolve (3767), `needCommits` (3822-3827), the filing and `outcomesFor`'s call (3896-3910), the done rule (3953-3974).
- **Relevance:** every one of these findings is a place where a deferral is read from part of what the round knows: one resolve's tasks, the first entry, the resolve's entries alone, or an entry's shape.
- **Key patterns:** a check that stops with `stageError` at the stage whose agent reruns (the undrafted entry, 3663-3666); a stray entry dropped with a warning (2996-3004); R1-10's `resolveDeferred` set and `planned` argument.

### The draft as filed (R2-2, R2-5)

- **Location:** `workflows/redline-loop.js`: `json` (458), `postedText` and `textParts` (1172-1220), `draftTitle` and `issueDraft` (1257-1290), `NO_FILE` (1732) and the minted finding (1849), `deferPrompt` (2202-2218).
- **Relevance:** the Where line, the title's cleaning, and how the GitHub agent is given each draft.
- **Key patterns:** a line added only when its value exists (`...(cond ? [line] : [])`).

### Replies, outcomes and the held drafts (R2-7, R2-8, R2-9, R2-10)

- **Location:** `workflows/redline-loop.js`: `replyEntry` (1362-1373), `mergeThreadReplies` and `withAnswers` (1403-1454), `replyBody` (1470-1500), `droppedOutcome`, `HELD` and `draftClose` (2916-2927), `describeOutcome` (2931-2958), `fileDeferred` (3275-3311), `draftView` (3331-3337), `settleHeld` (3375-3426), the round's push and reply (3934-3950); `skills/redline-revise/SKILL.md:24`; `docs/running.md`, Deferred items (120-131).
- **Relevance:** the evidence the four declines rest on.

### The handoff's opening sentence (R2-16)

- **Location:** `workflows/redline-loop.js`: `fixesRead` (1041-1044), `handoffComment`'s opening (3982-4020), the main loop's `minor` and its ending (4744-4806); `docs/running.md`, The handoff comment (156-162).
- **Relevance:** the endings the opening sentence already has (`final`, `noRecheck`, `notPicked`) and the fallback the new one sits before.

### The skill and the docs (R2-3, R2-4)

- **Location:** `skills/redline/SKILL.md`: the headless line (79), the `done` and `capped` sections (262-268); `docs/running.md`: When you are asked (128), Saved launch settings, The words (198).

### The loop test

- **Location:** `tests/loop-test.mjs`: the scripted GitHub agent's filing (123-143), the scripted shaper with its `deferred` list (183-242), the scripted resolve agent (243-253), `f()`, `goAhead` and `baseArgs` (300-322), `go()` and its run-record check (324-346), the defer section with its no-mitigation runs and the resolve draft check (2805-2860), the filing section (2865-2995) with R1-10's runs (2963-2972), the fix-diff section with `low()` and `two()` (3155-3268), the statements block with R1-6's `capped` constant (3270-3313).
- **Key patterns:** a scripted key added only when set, so no other run changes (`reshapeDefer`, round 1); a check that reads an absent prompt or draft as `''`.

### The pull request's own spec and round 1

- **Location:** `agent-os/specs/2026-11-16-1026-95-defer-means-tracked/plan.md` (decisions 11, 13, 20, 35 and 38; Design, The model, line 78; What is posted, lines 128-146); `agent-os/specs/2026-11-16-1358-97-review-round-1/shape.md` and `plan.md` (R1-3, R1-6, R1-8 and R1-10, and its As built counts).

### Scratch files the reviewer left

- **Location:** `/tmp/redlinerepro/reviewer-r2-escape.txt` (read with `od -c`: the backslash-u-000a escape kept literal, the backslash-u-0040 one written as `@`), `/tmp/redlinerepro/reviewer-r2-scenarios.mjs` (scenarios C1 to C7, for R2-12, R2-13, R2-14, R2-15 and R2-16). Read, not run.

### Issues searched

- `scripts/redline-gh.sh issues-search` (open issues only): `escape` and `88` find #88 and #73; `resolve agent` finds #1, #82, #88 and #50; `Issues turned on` finds #98; `deferred` finds #98, #95, #21, #2, #1 and #66; `settleHeld` finds none; `headless` finds #31 (a scheduled review-only pass); `handoff` finds #20, #70, #88, #27, #23, #19, #95, #73, #1 and #2, none on the opening sentence. None tracks a finding of this round.
