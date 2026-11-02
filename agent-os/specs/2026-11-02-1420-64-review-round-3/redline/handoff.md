Redline handoff

Redline ran 3 review rounds; the last one found no correctness bugs.

Resolved 3 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 1 correctness, 1 nit; 5 commits; spec `agent-os/specs/2026-11-02-1420-64-review-round-1`
- Round 2 (fix-diff): 1 correctness, 0 nit; 4 commits; spec `agent-os/specs/2026-11-02-1420-64-review-round-2`
- Round 3 (fix-diff): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-11-02-1420-64-review-round-3`

### Decisions

- **R1-1** A same-length hunk with one conflicting line becomes a whole-hunk conflict, so a pick drops a clean change on the adjacent line: fixed in 24d5661 · decided by: redline
- **R1-2** Nothing catches a change to the template body that does not bump the marker, which is the gap #15 closes: The author chose pinned hashes: setup-test.sh holds a sha256 for the current template body and for each frozen copy, keyed by version, because a hash is a fact about the file, gate-test.sh already pins fixture hashes the same way, and a bump that has to touch the test is the visible reminder to freeze the old body. · decided by: @michaelfromtheoutfit
- **R2-1** The per-line split pairs lines by position even when an anchor inside the hunk is shifted, so a pick duplicates or drops a line: fixed in 75a40c8 · decided by: redline

### Commits

- 17db6d6 redline: save review round 1 spec for PR #64 (#15)
- 24d5661 redline: R1-1 conflict a same-length hunk line by line so a pick settles only its line (#15)
- 17564c1 redline: R1-2 pin each unattended body's hash so a body change without a bump fails (#15)
- f15cd40 redline: record the round 1 review lessons in the standards, finishing R1-2 (#15)
- f67708c redline: record PR #64 round 1 as built (#15)
- 65d1a4a redline: save review round 2 spec for PR #64 (#15)
- 75a40c8 redline: R2-1 split a same-length hunk line by line only when its lines line up (#15)
- 91d7154 redline: record the round 2 review lessons in the standards (#15)
- b8dec91 redline: record PR #64 round 2 as built (#15)
