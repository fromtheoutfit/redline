Redline stopped at the round cap

Redline reached its cap of 3 revise rounds with correctness findings still open in the latest review, so it has not requested a review. @michaelfromtheoutfit will pick these up.

### Still open

- **R4-1** · correctness · low · confirmed · `scripts/redline-prefs.sh:439` · run check reads its hand-commit and untracked path lists from git without -z, so a name git quotes fails the .claude/ and spec-folder tests
- **R4-2** · correctness · low · confirmed · `scripts/redline-setup.sh:1480` · A loaded copy whose plugin.json and REDLINE_VERSION disagree refuses every fresh launch, and the skill's advice to reopen loops
- **R4-3** · correctness · low · confirmed · `scripts/redline-setup.sh:1529` · The launch warning says a run that switches installs stops at its next relaunch, which is false when the install behind is older than 0.5.1

### Deferred (1)

- **R1-7** The advice for a refused fresh launch reopens without --plugin-dir, which runs the installed release: deferred to #138; mitigated in 23a4460 · decided by: redline
