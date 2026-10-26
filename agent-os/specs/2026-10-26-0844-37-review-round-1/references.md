# References for PR #37 review round 1

Shaped by Redline in unattended mode.

## Similar Implementations

### The checker's verdict

- **Location:** `workflows/redline-loop.js`: the section's header comment 923-928, `errorText()` 932-935, `stopReason()` 939-961, `judge()` 968-1015, `checkerPrompt()` 823-829, the baseline site 1410-1421, the implement/check/repair loop 1439-1471, `pluginRoot` 43 and `GH` 131
- **Relevance:** R1-1 reorders `stopReason()` and extends the `checkerPrompt` sentence. R1-2 changes the `spilled` cause. R1-3 is about lines 1003-1013 of `judge()`, and the header comment at 924-925 names `ok` as a verdict input, which Task 4 rewords.
- **Key patterns:** `GH` builds a plugin path from `pluginRoot`, the pattern R1-2 follows. `stopReason()` already orders the specific case before the general one for a missing result (exit 2 before `!out.result`, the #9 spec's As built deviation), and R1-1 extends that order to the status.

### The checker role

- **Location:** `agents/redline-checker.md`, "What you do", steps 2 to 4 (lines 23-28), and "What you return" (line 44)
- **Relevance:** R1-1 makes the exit-2 rule the step before the `result_unreadable` step. R1-3: line 44's last sentence says the workflow decides from `ok`, which Task 4 rewords.

### Loop-test section 9

- **Location:** `tests/loop-test.mjs`: the checker mock and its `scenario.checker` override 112-123, `go()` 136-156 (a run that reaches Finish with `handoffPosted` and no `recordFiles` adds one record-commit check, lines 151-154; a stopped run adds none), section 9 447-490 (helpers `stopped`, `brief`, `unreadable` 455-461; the spilled case 471-472; the command-line check 474-475; the exit-2 case 482-483)
- **Relevance:** R1-1, R1-2 and R1-3 add and change checks here; `go()`'s own check sets Task 4's green count.

### The usage errors

- **Location:** `.claude/redline/checks.sh:63-71` (the snapshot errors print to stderr and `exit 2`)
- **Relevance:** the stdout is empty on exit 2, which is why the checker's step order sends it to `not_json`. The R1-1 case uses the line-64 message.

### The #9 spec

- **Location:** `agent-os/specs/2026-10-25-1353-9-checker-unreadable-result/` (`shape.md` Decisions; `plan.md` Tasks 3 and 4 and As built)
- **Relevance:** it answers R1-1 ("Exit 2 at the checker ... `result_unreadable` is reserved for output the script did print") and gives R1-2's message. For R1-3 it states the two rules that disagree.

### The README's checker contract

- **Location:** `README.md:226` (Exit code, what the workflow reads, the checker's `error` as text, the stops) and `:228` (Baseline)
- **Relevance:** R1-3's Baseline rule; Task 4 changes the two sentences on what the workflow reads and on the checker's `error`.

### The standard's checker contract

- **Location:** `agent-os/standards/workflow/agents.md:7` (the checker's pass or fail comes from `ok`, `unexpected_files`, `uncommitted`) and `:14` (the checker's `error` as text)
- **Relevance:** both lines contradict the R1-3 decision once Task 4 lands; retrospective items 5 and 4 in `shape.md` reword them.
