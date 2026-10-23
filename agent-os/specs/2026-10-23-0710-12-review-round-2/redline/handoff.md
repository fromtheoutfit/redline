Redline handoff

Redline ran 2 review rounds; the last one found no correctness bugs.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 5 correctness, 4 nit; 12 commits; spec `agent-os/specs/2026-10-23-0710-12-review-round-1`
- Round 2 (fix-diff): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-10-23-0710-12-review-round-2`

### Decisions

- **R1-1** A Redline round here that fixes checks-template.sh or the generator's output can never pass gate step 7: In this repository, a finding whose fix touches scripts/checks-template.sh below its header, or changes the text redline-setup.sh writes into checks.sh, is deferred, so the dogfood check stays whole and a person makes the change, regenerates checks.sh and restamps after the run, as is already done for the guard, the hook and checks.sh itself. · decided by: @michaelfromtheoutfit
- **R1-3** The settings merge overwrites existing values and can build a mixed marketplace source: fixed in 64f26c1 · decided by: redline
- **R1-5** `config --force` throws away every hand-tuned key to update checker and stall: On a rerun over an existing redline.json, config updates only checker and checkerStallMs, the two keys derived from the baseline time, and keeps reviewer and every other hand-set value as the person's, listing any differences without changing them, while --force stays the full reset. · decided by: @michaelfromtheoutfit
- **R1-7** `version` treats a newer checks.sh as older and tells the person to downgrade it: fixed in d4b7ab8 · decided by: redline
- **R1-8** The new version precheck triggers a permission prompt on every /redline:redline launch: The read-only redline-setup.sh version precheck gets the narrow allow rule Bash(/*/scripts/redline-setup.sh version *) in the plugin's settings template, and a person adds the same line to this repository's .claude/settings.json, so launches stop prompting while every writing subcommand stays behind the prompt, following the pattern already used for redline-gate.sh check. · decided by: @michaelfromtheoutfit
- **R1-2** README says every writing subcommand takes --dry-run, but `checks` has none: fixed in 6314aa6 · decided by: redline
- **R1-4** Rewriting settings.json drops CRLF, against the standard this PR adds: fixed in 9f69af2 and cc7f232 · decided by: redline
- **R1-6** checks.json text fields other than cmd/source are not checked for newlines or quotes: fixed in e4b9df9 · decided by: redline
- **R1-9** `sed -i ''` only works with BSD sed: fixed in b352ad6 · decided by: redline

### Commits

- a29ddd9 redline: save review round 1 spec for PR #12 (#6)
- 6314aa6 redline: R1-2 give redline-setup.sh checks a --dry-run that writes nothing, not even the directory (#6)
- 64f26c1 redline: R1-3 keep every value already in settings.json and report the differing ones under conflicts (#6)
- 9f69af2 redline: R1-4 write settings.json with CRLF when the existing file uses it (#6)
- e4b9df9 redline: R1-6 refuse a multi-line checks.json text field, and quotes or expansions in a var default or alwaysAllowed entry (#6)
- d4b7ab8 redline: R1-7 tell a newer checks.sh from an older one in version and say to update the plugin (#6)
- b352ad6 redline: R1-9 change the --force fixture with sed into a copy instead of BSD-only sed -i (#6)
- e32f472 redline: R1-1 defer a template or generator fix in this repository to a person, in point 11 and Known limits (#6)
- 91b9135 redline: R1-5 update only checker and checkerStallMs in an existing redline.json and keep every other value as the person's (#6)
- 1ae28f7 redline: R1-8 allow the read-only redline-setup.sh version precheck with one narrow rule in the settings template (#6)
- cc7f232 redline: record the round 1 review lessons in the standards, finishing R1-1, R1-4 and R1-8 (#6)
- 5327dfc redline: record the round 1 as-built notes for PR #12 (#6)
