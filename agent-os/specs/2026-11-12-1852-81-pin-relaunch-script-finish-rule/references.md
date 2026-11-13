# References for issue #81: pin the relaunch script, the Finish rule

## Similar Implementations

### `run check` and its `plugin` reason

- **Location:** `scripts/redline-prefs.sh`, the `run` block; cases under `# run check` in `tests/prefs-test.sh`
- **Relevance:** the existing self-hosted test (`realdir` of `--plugin` equals `realdir` of the repository root) and the marker fields `run drift` reads (`record`, `args.startSha`).
- **Key patterns:** one JSON object on stdout with a `line` the skill says verbatim; exit 1 for a refusal, 2 for a usage error; throwaway git repositories in the test.

### The Finish-only GitHub read

- **Location:** `sweepThreads()` and `finish()` in `workflows/redline-loop.js`
- **Relevance:** the one place the workflow already asks GitHub for state that changes as the run posts, placed after every stopping point. The `last round` call follows it: one GitHub-agent call, the workflow decides from the data.
- **Key patterns:** `run('finish', prompt, {agentType: 'redline:redline-github', ...modelOpts('github'), label, phase: 'Finish', schema})`; `stageError('finish', ...)` with no label for a stop that cannot be resumed.

### Byte-identical prompts when a key is absent

- **Location:** `tests/loop-test.mjs`, the ask-rules section (a run with no `askRules` against one with `[]`) and `samePrefix`
- **Relevance:** the proof shape for `args.drift`: every prompt before Finish equals the run without it.
- **Key patterns:** compare `label`, `prompt` and `opts` call by call.

### The resume section of the loop test

- **Location:** `tests/loop-test.mjs`, the `resume:` scenarios
- **Relevance:** how an error result with `resumeFrom` is asserted, and how a relaunch scenario is built from the first run's args.

### PR #80's run records

- **Location:** the harness's saved records of run `wf_de66a509-f1e` (outside the repository)
- **Relevance:** the fault's evidence: three script texts across the launches of one run. Cited, not copied.
