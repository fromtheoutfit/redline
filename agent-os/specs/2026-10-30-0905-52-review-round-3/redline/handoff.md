Redline handoff

Redline ran 3 review rounds; the last one found no correctness bugs.

Resolved 5 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 4 correctness, 0 nit; 7 commits; spec `agent-os/specs/2026-10-30-0905-52-review-round-1`
- Round 2 (fix-diff): 1 correctness, 0 nit; 4 commits; spec `agent-os/specs/2026-10-30-0905-52-review-round-2`
- Round 3 (fix-diff): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-10-30-0905-52-review-round-3`

### Decisions

- **R1-1** A wildcard write operand slips past a paths ask rule: deferred; mitigated in 9ec60fd: Two tests/guard-cases.tsv rows under # @cwd ASKRULES, under a comment naming #52 R1-1, pin today's allow for `sed -i '' 's/a/b/' app/*.secret.yaml` and `sed -i '' 's/a/b/' config/proj*/project.yaml` beside the denied `config/project/*.yaml` row; README's Known limits bullet says a Bash operand holding * or ? is checked by its literal prefix only (with both examples), and the Ask rules paths bullet points there. · decided by: redline
- **R1-2** Setup's ask-rules check disagrees with the guard and the workflow: fixed in 7174f02 · decided by: redline
- **R1-3** A setup rerun cannot remove every ask rule: fixed in 2b0c91b · decided by: redline
- **R1-4** A human-pass comment that asks for nothing is forced into a judgment call: fixed in d99c9bf · decided by: redline
- **R2-1** Setup's id check accepts an id with a trailing newline that the guard and the workflow refuse: fixed in 5d09b44 · decided by: redline

### Deferred (mitigated now, full fix left open)

- **R1-1** A wildcard write operand slips past a paths ask rule: shipped Two tests/guard-cases.tsv rows under # @cwd ASKRULES, under a comment naming #52 R1-1, pin today's allow for `sed -i '' 's/a/b/' app/*.secret.yaml` and `sed -i '' 's/a/b/' config/proj*/project.yaml` beside the denied `config/project/*.yaml` row; README's Known limits bullet says a Bash operand holding * or ? is checked by its literal prefix only (with both examples), and the Ask rules paths bullet points there.; open: A person changes scripts/redline-guard.sh after the run: in writable(), when the raw target holds * or ?, expand it with glob.glob against cur and check every match with protected() and ask_rule(); in ask_rule() also refuse when the cut prefix is a string prefix of a rule's root, and when the target holds a wildcard, some rule has no literal root and the expansion found nothing to check. Then flip the two R1-1 rows to deny naming yaml-anywhere and craft-config, add a row per new refusal beside its neighbour, and drop the Known limits clause. Read but not run: the same cut feeds protected(), so a wildcard operand against Redline's own patterns (e.g. .claude/settings*.json) may get through too; issue #50 may already track that.

### Commits

- 11512f4 redline: save review round 1 spec for PR #52 (#49)
- 9ec60fd redline: R1-1 pin the wildcard operands a paths ask rule does not refuse, and name the limit in the README (#49)
- 7174f02 redline: R1-2 have setup's ask-rules check fault a null paths or prose and a non-object rule as the guard does (#49)
- 2b0c91b redline: R1-3 have setup pass an empty ask-rules list when the person removes every rule (#49)
- d99c9bf redline: R1-4 leave a human-pass comment that asks for nothing as none under an ask rule (#49)
- ffa90a9 redline: record the round 1 review lessons in the standards (#49)
- da5b577 redline: record round 1 as built for PR #52 (#49)
- d0ad35c redline: save review round 2 spec for PR #52 (#49)
- 5d09b44 redline: R2-1 have setup's ask-rules check match an id against the whole string, as the guard and the workflow do (#49)
- fac2663 redline: record the round 2 review lessons in the standards (#49)
- aaebc2b redline: record round 2 as built for PR #52 (#49)
