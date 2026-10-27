Redline handoff

Redline ran 2 review rounds; the last one found no correctness bugs.

Resolved 5 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 4 correctness, 1 nit; 8 commits; spec `agent-os/specs/2026-10-27-1441-46-review-round-1`
- Round 2 (fix-diff): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-10-27-1441-46-review-round-2`

### Decisions

- **R1-1** carriedFrom is kept on re-review and final-nit-pass findings: fixed in b08affc · decided by: redline
- **R1-2** A carried finding with knownAs counts as accounted for but is skipped as known: The author clears a known mark that names an earlier Redline finding so that finding is carried, and keeps a carried finding known by an issue or a comment as already tracked while answering its earlier thread with 'carried forward; already tracked in #N', because an author who opens an issue between a review-only run and a full run has made a choice to respect, and the answered thread stops the finding being raised again. · decided by: @michaelfromtheoutfit
- **R1-3** The fallback carry's id can duplicate a reviewer id: fixed in 40f80ce · decided by: redline
- **R1-4** An earlier thread stays open when its carried finding sits in the review body: fixed in 361496c · decided by: redline
- **R1-5** The handoff calls a carried finding 'already handled' and quotes its stale reply: fixed in 073dbff · decided by: redline

### Commits

- ca4b789 redline: save review round 1 spec for PR #46 (#35)
- b08affc redline: R1-1 clear carriedFrom on a review with no carry-forward list (#35)
- 40f80ce redline: R1-3 number the fallback carry after the highest id in use (#35)
- 361496c redline: R1-4 settle an earlier thread whose carrying finding sits in the review body (#35)
- 073dbff redline: R1-5 name an earlier run's carry in the handoff's Earlier rounds (#35)
- d9048d5 redline: R1-2 carry a finding known by a Redline id; answer one an issue tracks in its earlier thread (#35)
- 0c30331 redline: record the round 1 review lessons in the standards (#35)
- f65baa7 redline: record the round 1 as-built notes for PR #46 (#35)
