# References for PR #61 Review Round 1

## Similar Implementations

### The ask-and-call check and the reshape loop

- **Location:** `workflows/redline-loop.js`: `checkCalls` (lines 1947-1962), `revise()` first shape (2161-2176), `settle()` and the first resolve (2189-2253), the approve loop and the reshape (2260-2310), `reshapePrompt` (1157-1173), `forceAskRules` (1999-2057)
- **Relevance:** R1-2's failure path. `calls` (line 2191) holds every call the round has seen, all decided before the approve loop starts; `raised` (line 2296) is the existing precedent for treating a known call as settled on a reshape.
- **Key patterns:** a known call is filtered by `calls.some((known) => known.id === call.id)`; pass the same list to `checkCalls` rather than introducing a new record field.

### The loop test's shaper mock and section 14

- **Location:** `tests/loop-test.mjs`: shaper mock (115-140, with the `shaperNoCall` and `shaperExtraCall` keys of #57), plan-approver mock and `planBounce` (150-156), section 14 (1157-1218), the relay scenario with a decided ask (1211-1216)
- **Relevance:** R1-2's red test. The mock returns a call for every ask on every call, so a reshape that follows its prompt is never simulated. The relay scenario (`ask: ['R1-2']` plus `decisions`) is the template for a guided decided-ask run that finishes `done`.
- **Key patterns:** scenario keys scoped by `opts.label`, as the spec-status mock does with `specMissing` keyed by label; error checks pin `status`, `stage`, `error` text and `resumeFrom` exactly.

### The relaunch rule and its callers

- **Location:** `skills/redline/SKILL.md`: section 2 "A stopped run" (44-53), "stopped before a result" (169-171), "Relaunch only from the word" (209), "The relaunch rule" (211), the Rules bullet (247); `README.md` Launching, "The relayed line" (189) and the marker paragraph (191), Known limits (209)
- **Relevance:** R1-1's three disagreeing sentences, and the sentence R1-2's README clause joins.
- **Key patterns:** the Rules bullet at SKILL.md:247 and `agent-os/standards/workflow/replay.md` line 17 name the two lines without listing cases, which is the form the fixed rule should match.

### The original spec for this PR

- **Location:** `agent-os/specs/2026-11-02-0744-57-60-relaunch-path-spec-check-and-relay/` (`plan.md` Task 5 item 5 and decision 5; `shape.md` line 8 and decision 5)
- **Relevance:** answers R1-1's question: a stopped-run relaunch starts from the command line, and the rule's object is the last typed line.

### The reviewer's scratch reproduction

- **Location:** `/tmp/redlinerepro/reviewer-r1-repro.mjs` (outside the repository)
- **Relevance:** the three variants of R1-2 (guided ask without call, autopilot ask without call, guided fix without call). It was not run: the guard refuses `node` to the reviewer and to the shaper. Its mock shape is what Task 2's scenarios encode in the loop test.
