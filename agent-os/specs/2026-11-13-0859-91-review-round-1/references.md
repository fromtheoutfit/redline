# References for PR #91 Review Round 1

Every location is at `1c96b8c`, the PR head the round reviewed.

## Similar Implementations

### `run check`'s merged hand list

- **Location:** `scripts/redline-prefs.sh`, the `check` branch (its header, lines 36 to 47), and `skills/redline/SKILL.md:50` ("the script has already merged the label's earlier entry, so copy it as printed"); `tests/prefs-test.sh`, "# run check: a second resume at the same label keeps the first's hand commits".
- **Relevance:** the precedent for the fix. A value the skill passes into `args` from the run marker is computed by the script and copied as printed, so its rule has prefs cases.
- **Key patterns:** read the marker's own `args` (`.args.resume[label]` there, `.args.drift.agents` here) and print what the skill passes. The skill text does not change its "copy as printed" instruction.

### `run drift` and its prefs cases

- **Location:** `scripts/redline-prefs.sh:189-231` (the `drift` branch) and its header (lines 48 to 63); `tests/prefs-test.sh:278-323`, "# run drift (#81)".
- **Relevance:** the code the fix changes, and the cases it extends. The records `pinned.json` (a hand-off with a pin) and `fallback.json` (no pin) show how a marker is faked, and line 309 is the hand-off neighbour the new cases sit beside.
- **Key patterns:** one record per marker kind, saved with `run save ... --record`, then `runj` on `drift`; the hand-off marker `wf_11` is saved again after the inserted cases, as line 322 saves `wf_1` again.

### Finish and its resume checks

- **Location:** `workflows/redline-loop.js`:
  - `drift` and `AGENTS_CHANGED`, lines 225 to 246;
  - `resumeLine` and `FINISH_COMMENT_LABELS`, lines 434 to 455 (#59, R1-6);
  - `finishPrompt`, line 1804;
  - `handoffComment`, lines 2965 to 2991;
  - `finish()`, line 3117;
  - `commitRecord()`, line 3325;
  - the startup refusal, line 3407.

  `tests/loop-test.mjs` section 13, lines 1190 to 1207 (the Finish comment and record-commit resumes); section 17, lines 1838 to 1918 (the pin, the agent sentence, the Finish rule).
- **Relevance:** the path R1-1 traces. The handoff comment's text is inlined in its prompt. The Finish duplicate checks ride only on the resumed label. The startup refusal reads `workflow` and `pinned` only.
- **Key patterns:** a resume scenario is the first run with `recordError` or `finishError`, then the same args plus `resume` at the error's label. `same(a, b)` compares label, prompt and opts, and `comment(calls, label)` reads the comment text out of its prompt.

### A temporary mutation for a red run

- **Location:** `agent-os/specs/2026-11-12-1337-89-review-round-3/plan.md`, Task 3 (a line of `workflows/redline-loop.js` changed for one gate run and restored byte for byte before the commit).
- **Relevance:** the loop checks pin behaviour the workflow already has, so only a mutation shows them red, and the commit must leave `workflows/` untouched in a self-review.
- **Key patterns:** Edit the lines, run the gate, record every `FAIL` line, restore with Edit, confirm `git diff --stat -- workflows/redline-loop.js` prints nothing.

### The #81 spec

- **Location:** `agent-os/specs/2026-11-12-1852-81-pin-relaunch-script-finish-rule/`:
  - `shape.md`: decision 1, the agent warning and the handoff sentence; decision 3, the paths that could rerun a posted review; decision 6, the two-layer refusal; Unmeasured.
  - `plan.md:56` and `:68`: `args.drift` read nowhere before Finish, and replaced on each relaunch.
  - `plan.md`: "How this PR's own Redline review should be run".
- **Relevance:** the design R1-1 is a finding in. Decision 6 is why `workflow` and `pinned` stay fresh, and line 68 is the mechanism the fix narrows.
- **Key patterns:** none copied. The probe facts it records are cited, not repeated.
