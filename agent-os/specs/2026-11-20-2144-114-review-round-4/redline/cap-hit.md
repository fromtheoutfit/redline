Redline stopped at the round cap

Redline reached its cap of 3 revise rounds with correctness findings still open in the latest review, so it has not requested a review. @michaelfromtheoutfit will pick these up.

### Still open

- **R4-2** · correctness · low · confirmed · `workflows/redline-loop.js:494` · cleanPaths does not fold `..` segments or a trailing `/.`, which the guard's normpath does
- **R4-3** · correctness · low · confirmed · `workflows/redline-loop.js:547` · A directory listed in a non-standard form under a paths rule matches neither form ruleForPaths reads
- **R4-4** · correctness · low · confirmed · `workflows/redline-loop.js:3761` · A deferral nobody decided reads the shaper's files raw, so [''] counts as a planned mitigation
- **R4-5** · correctness · low · confirmed · `workflows/redline-loop.js:4016` · After R3-4 a re-applied override's list ignores the second resolve's tasks, but the named-fix check still demands them

### Deferred (3)

- **R1-5** A decided call is shown with the shaper's or a reshape's disposition, never the one the resolve stated: deferred to #115 · decided by: redline
- **R2-1** Error report tells the person to fix the cause by hand for the reshape-hold stop, which needs no hand fix: deferred to #116 · decided by: redline
- **R2-3** A reshape resumed after any other shape-stage stop is still told to rewrite the spec files from scratch beside decided entries: deferred to #117 · decided by: redline
