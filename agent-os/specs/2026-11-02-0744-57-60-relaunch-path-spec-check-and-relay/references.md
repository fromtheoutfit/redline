# References for the workflow's relaunch path (#57 and #60)

## Similar Implementations

### The shape stage and the reshape path

- **Location:** `workflows/redline-loop.js` 2080-2135 (`revise()`: the shaper call, the folder warning, the `unsorted` error, `checkDispositions`, `forceAskRules`, the dial), 2200-2222 (the reshape after a plan bounce)
- **Relevance:** where the two new checks and the status call go, in both paths
- **Key patterns:** every check throws `stageError('shape', ...)`; decisions enter only after this point, so everything here replays from cache

### Errors and the resume line

- **Location:** `workflows/redline-loop.js` 369-425 (`stageError` with its optional label, `resumeLine` with the shaper's replace sentence, `run()` with `lastLabel`), 2954-2962 (the error result and `resumeFrom`)
- **Relevance:** the status call moves `lastLabel`, so the spec error passes the shaper's label explicitly; the status call's own failure keeps the default
- **Key patterns:** `resumeFrom.attempt` is the label's earlier attempt plus one

### The one-command read-only operation

- **Location:** `workflows/redline-loop.js` 1430-1443 (`recordStatusPrompt`), 507-511 (`FILE_OP_SCHEMA`), 2681-2690 (`commitRecord`, the call and the parse); `agents/redline-github.md` (Operations, `record-status`; What you return)
- **Relevance:** the model for `specStatusPrompt`, `SPEC_STATUS_SCHEMA` and `checkSpec`
- **Key patterns:** "Run this once, exactly as given, and nothing else"; the agent returns lines as printed, the script decides

### `RUN_LINE`

- **Location:** `workflows/redline-loop.js` 261; the eighteen prompt helpers 995-1445 each put it in by hand; `tests/loop-test.mjs` 352 pins one of its sentences in every prompt
- **Relevance:** the second layer; one edit reaches every prompt

### The loop test

- **Location:** `tests/loop-test.mjs` 33-165 (the mock: the GitHub branch dispatches on the label, the shaper stub echoes the folder from its prompt), 179-220 (`go`, `labels`, `pick`, `samePrefix`), 268-298 (the plan dial relaunch), 1038-1075 (section 13, the resume checks: the model for the new section's error and resume cases)
- **Relevance:** no file is created; a new behaviour is scripted in the mock and proven on prompts and results
- **Key patterns:** a scenario knob per mock (`shaperDrop`, `checker`, `finishError`); `samePrefix` for the replay rule; `check(name, ok, detail)`

### The guard rows

- **Location:** `tests/guard-cases.tsv` 1-9 (the format), 490 (the GitHub role's `git status` row); `scripts/redline-guard.sh` 122 (the role table), 712 (`READ_CMDS`), 726 (`GIT_READ`)
- **Relevance:** the two commands and their refused neighbour are pinned without a guard change

### The skill's stops and hand-offs

- **Location:** `skills/redline/SKILL.md` 44-57 (a stopped run, the settings skip), 169-235 (stopped before a result, the plan hand-off, `reviewed`, the decisions hand-off, the confirm, the record copy, the marker, the relaunch, `done`, `error`), 237-242 (Rules); `skills/redline-revise/SKILL.md` 31
- **Relevance:** every sentence the relaunch rule and the answer form replace

### README

- **Location:** `README.md` 75-87 (The interrupt dial), 93-106 (Saved preferences, line 104), 108-115 (Decided by), 185-189 (Launching), 197-206 (Known limits)

### The #10 spec

- **Location:** `agent-os/specs/2026-11-01-0911-10-resume-a-run-that-ended-in-error/` (`shape.md` Scope, the #57 paragraph; decision 4, the shape-stage resume; the format of this folder)

### Internal notes (cited, not copied)

- redline-internal `DESIGN.md` (the step-5 and step-9 reconciliation rows on the relayed message), `docs/STEP5-NOTES.md` item 16, `docs/STEP6-NOTES.md` item 9, `docs/STEP7-NOTES.md` section 3, `docs/STEP9-NOTES.md` section 11 item 1, `docs/STEP10-NOTES.md` item 9
