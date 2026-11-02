Redline handoff

Redline ran 3 review rounds; the last one found no correctness bugs.

Resolved 7 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 6 correctness, 0 nit; 8 commits; spec `agent-os/specs/2026-11-01-0935-59-review-round-1`
- Round 2 (fix-diff): 1 correctness, 0 nit; 4 commits; spec `agent-os/specs/2026-11-01-0935-59-review-round-2`
- Round 3 (fix-diff): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-11-01-0935-59-review-round-3`

### Decisions

- **R1-1** run check refuses the run's own files when the result does not list their folder: fixed in eaa86e2 · decided by: redline
- **R1-2** A .claude/ hand commit passes the check for every kind but is excused only on an error resume: The author refuses any commit on top of a stopped run unless it stopped with an error, so a .claude/ fix stays possible after an error and every other stop with a hand commit is refused before launch with a line saying to start fresh, instead of failing at the checker halfway through the round. · decided by: @michaelfromtheoutfit
- **R1-3** Settings are asked and saved before the resume question: fixed in 7e67d07 · decided by: redline
- **R1-4** A second resume at the same label drops the first resume's hand commits: fixed in 59c1624 · decided by: redline
- **R1-5** A non-resumable error leaves the earlier stop's marker in place: fixed in 725803e · decided by: redline
- **R1-6** The resume line promises duplicate checks two Finish operations lack: fixed in f544fd2 · decided by: redline
- **R2-1** The Finish comment resume clause asks for a URL pr-comments cannot give and leaves posted unset: fixed in 1f3eece and bca23c2 · decided by: redline

### Commits

- 50e2146 redline: save review round 1 spec for PR #59 (#10)
- eaa86e2 redline: R1-1 count a run's own spec folders from its args in run check (#10)
- 7e67d07 redline: R1-3 offer the resume before asking the settings (#10)
- 59c1624 redline: R1-4 keep a label's earlier hand commits on a second resume (#10)
- 725803e redline: R1-5 clear an earlier marker when an error cannot be resumed (#10)
- f544fd2 redline: R1-6 give the Finish comment and record commit a resume duplicate check (#10)
- 14e133b redline: R1-2 refuse a hand commit after a stop that was not an error (#10)
- 2b737ed redline: record the round 1 as-built notes and no standards changes for PR #59 (#10)
- 3778554 redline: save review round 2 spec for PR #59 (#10)
- 1f3eece redline: R2-1 report a resumed Finish comment found already posted as posted (#10)
- bca23c2 redline: record the round 2 review lessons in the standards, finishing R2-1 (#10)
- 4223a3e redline: record the round 2 as-built notes for PR #59 (#10)
