Redline handoff

Redline ran 3 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in the nit fixes. The coverage pass reviewed the whole PR at the head of every round but the final nit pass; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

Resolved 8 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 4 (pr): 1 correctness, 2 nit; 5 commits; spec `agent-os/specs/2026-11-07-0806-80-review-round-4`
- Round 5 (fix-diff): 0 correctness, 1 nit; 4 commits; spec `agent-os/specs/2026-11-07-0806-80-review-round-5`
- Round 6 (final-nit-pass): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-11-07-0806-80-review-round-6`

### Earlier rounds

- **R1-1** The argument hint and the description's grammar leave out `coverage off`: already handled in round 1: fixed in 129ae48 (redline: R1-1 name coverage off in the slash-command hints and the skill's description (#79)). · decided by: redline
- **R1-2** Fix-diff rounds do not get the earlier run's handled findings, so a re-sampled deferred or dropped finding counts as new: already handled in round 1: fixed in 4e67915 (redline: R1-2 show the earlier runs' handled findings on every round that ran a coverage pass (#79)). · decided by: redline
- **R1-3** A skill array with renamed keys passes as blank candidates instead of the drift stop: already handled in round 1: fixed in aacc55f (redline: R1-3 stop as recipe drift on an array with none of the skill's fields (#79)). · decided by: redline
- **R1-4** Every `finding` entry counts as confirmed, and some such candidates land in no list: already handled in round 1: fixed in 96da90b (redline: R1-4 count a coverage candidate where the round puts it (#79)). · decided by: redline
- **R1-5** The findings file saves the candidate count, never the candidate list: already handled in round 1: fixed in e1cc411 (redline: R1-5 write the coverage candidate list into the findings file (#79)). · decided by: redline
- **R1-6** The handoff says the coverage pass ran at every round's head, but it never runs on the final nit pass: already handled in round 1: fixed in 7ed770a (redline: R1-6 say the coverage pass skipped the final nit pass in the handoff (#79)). · decided by: redline
- **R2-1** The definition of new settles a re-found bug into an earlier finding marked fixed, even when the bug still reproduces at this head: already handled in round 2: The author counts a coverage candidate that matches a finding marked fixed but still reproduces at the round's head as a new finding, named with the earlier ID, so a fix that didn't fully land keeps the run going for another round within the round cap. Applied in 3a34dd3 (redline: R2-1 count a candidate that still reproduces a fixed finding as new (#79)). · decided by: @michaelfromtheoutfit
- **R2-2** The skill-denied and skill-absent markers match only as bare text at the very start of the reply: already handled in round 2: fixed in b999be2 (redline: R2-2 read the coverage markers on any line, after the fenced-list scan (#79)). · decided by: redline
- **R2-3** A finding the workflow renames loses its accounting entry, so its candidate is also listed under For the person: already handled in round 2: fixed in ece89ba (redline: R2-3 rename a coverage entry's ref with the finding it names (#79)). · decided by: redline
- **R3-1** The tech stack still calls the code-review skill a candidate second reviewer, and the edited sentence has lost its subject: resolved: agent-os/product/tech-stack.md:5 now says the built-in code-review skill is the finder on every whole-PR and fix-diff round since #79, and the sentence has its own subject (6ef58a9). · decided by: redline
- **R3-2** The empty-candidates sentence names the wrong remaining work: resolved: docs/running.md:54 now says what the reviewer still runs on an empty array: no discovery pass of its own, the scheduled-and-queued, Docs and Version checks, the fix-diff recheck on a later round, and the carry-forward list on a first round that has one (6ef58a9). · decided by: redline
- **R3-3** The handled-list header and the knownAs example still say a fixed match is never re-raised, against the R2-1 reopen rule: resolved: When the pass ran, the handled-list header carries the reopen exception (workflows/redline-loop.js:1126); the candidates block and agents/redline-reviewer.md (the known-finding check and the knownAs contract) say a reopened finding's knownAs stays empty; the coverage-off header is unchanged (6ef58a9). · decided by: redline
- **R3-4** A decided finding whose decision was applied in commits never reopens, and the verifier cannot tell it was fixed: resolved: The person chose option B in 6ef58a9: the header (line 1126), the candidates block (line 1169), agents/redline-reviewer.md and docs/running.md step 7 now say a decided finding stays settled whatever its commits, and that a candidate still reproducing one goes under For the person. · decided by: redline

### Decisions

- **R4-3** A finding an earlier run resolved is read back as decided, so a candidate that still reproduces it can never reopen: The author has a later run read an earlier run's "resolved" reply as fixed, so a coverage candidate that still reproduces a resolved finding reopens as a new finding within the round cap. A resolved reply is Redline's own claim that the bug is gone, not a decision the author made. · decided by: @michaelfromtheoutfit
- **R4-1** Round 3's standards retrospective never landed, and its shape.md still records R3-4 as pending: fixed in 2118e85 and d7f2a4d · decided by: redline
- **R4-2** The guard standard still says a skill fork is approved every redline-gh.sh subcommand and the narrowing is pending: fixed in 2118e85 · decided by: redline
- **R5-1** Known limits and the plugin descriptions still state the old done rule and what a clean run guarantees: The author has the README, both plugin descriptions and the product mission reworded to state the new done rule, that a round confirms no new correctness finding. Each now says a clean run reports what the run checked and doesn't promise that no correctness bug remains. The mission cites the README's Known limits, so the two have to agree. · decided by: @michaelfromtheoutfit

### For the person

- `workflows/redline-loop.js:1892` · R3-4 was decided (option B in 6ef58a9), and this still reproduces its remaining point: history() gives each earlier finding describeOutcome's text but not record.outcomeKinds. So within a run, the verifier can only tell a decided outcome (the decision's notes plus 'decided by') from a fixed one ('fixed in <sha> · decided by: redline') by its wording, while the reopen and settle rules now depend on that kind.
- `workflows/redline-loop.js:2785` · The handoff's fallback line 'the last one found no correctness bugs' is also posted after a round that did report correctness findings: when the review dial selects none, or when every finding settles with no commit. The sentence and both paths are unchanged from main. Round 2's For the person already asked for the done rule's own wording here.
- `agent-os/specs/2026-11-06-1019-80-review-round-1/redline/round-1-findings.json:1` · The posted handoff's For the person already says the self-hosted relaunch rewrote round 1's findings and review files. What it leaves out: 5e2a42e then committed those rewritten files and handoff.md as round 1's record. The folder now says round 1 found 0 findings, while the posted round 1 review and the reply files beside them list R1-1 to R1-6.
- `agent-os/standards/workflow/replay.md:15` · The new bullet says coverage off keeps every prompt byte-identical to the time before the pass existed. But the findings file built in post() (workflows/redline-loop.js:2141) now always carries "forThePerson": [], so every `post r<n>` prompt differs from 0.1.x. Harmless within a run, since has-review skips a repost, but the claim goes further than the loop test proves.
- `docs/running.md:50` · 'The skill never returns an empty list' reads as a guarantee. The same claim is in agents/redline-reviewer.md:30, the workflow comment at line 1152 and the PR description. Yet line 54 handles an empty array on purpose, and round 1's For the person noted that a round-1 [] ends the run with no discovery pass. Saying 'has not returned an empty list in any run so far' would fit both.
- `workflows/redline-loop.js:1203` · The fence pattern needs a lowercase ```json opener on its own line. A ```JSON opener, a bare ``` or an opener with extra text after it stops the round as recipe drift, with the Claude Code version message. This has not been seen in any run; matching the opener case-insensitively would be a cheap hardening.
- `scripts/redline-guard.sh:1076` · The PR description still says nothing under scripts/ changed, but a70c243 narrowed the guard here, along with its docs and tsv rows. No spec plan in the PR names this change, since the R2-5 decision in round 2 left it for a person to make after the run.
- `workflows/redline-loop.js:1169` · R2-1 was decided (the reopened finding names its earlier id in its description only), and this still reproduces its limit. The handoff's Earlier rounds line (earlierRoundsLines, line 3022) still says the earlier finding was `already handled in round N: fixed in ...` even after this run reopened it, and its earlier thread gets no reply. R4-3 makes this more likely, since a resolved reply now reopens too. A structured `reopens` field like carriedFrom would let the handoff and the replies follow the link.
- `workflows/redline-loop.js:865` · personLine inserts a For the person entry's text and file as given. An embedded newline (from the reviewer, or from a skill summary listed for an unaccounted candidate) breaks the bullet list. A line shaped like `- **R1-9** · correctness · ...` would be read back by prior-findings as a finding. Collapsing newlines and escaping backticks in `file` is a cheap fix.
- `scripts/redline-guard.sh:1082` · Not changed by this PR, and the guard is a person's to change. R2-5 narrowed redline-gh.sh to its read subcommands for non-role sessions, but every redline-prefs.sh subcommand, including `save`, `run save` and `run clear`, which write .claude/redline.local.json, is still approved with no prompt for any non-role session, the coverage fork included. The MAIN comment at line 184 still says such a session 'writes nothing'.
- `docs/guard.md:7` · The narrowing's cost is described for default mode only ('asks once in default mode'). In auto mode, the main session's `redline-gh.sh issue-create` for a deferred finding now goes to the auto-mode classifier, which has refused Redline writes before. Related to #76, which covers the same classifier refusal for Write and Edit calls.
- `workflows/redline-loop.js:249` · The coverage effort is checked at launch whenever coverage is on, including revise-only and human-review passes, which never run a coverage pass. A bad `models.coverage.effort` therefore stops `/redline:redline-revise <pr> review @sam` with a message about the coverage pass. Failing early on a config error is defensible, but the message could say the setting is unused on that launch.
- `README.md:101` · The list of redline-gh.sh writes that now meet the permission prompt ('posts, replies, comments, creates an issue or resolves threads', and the same list in docs/guard.md) leaves out `request-review` and `update` (the PR description). Both are outside GH_READ (scripts/redline-guard.sh:738) and are now left to the prompt too.
- `CHANGELOG.md:5` · #71 and #78 merged on main after the redline--v0.1.0 tag (ad4b4d4). release.md says a PR merged between tags goes under the next tagged version, so the 0.2.0 section this PR pre-writes needs their lines at tag time.
- `workflows/redline-loop.js:1260` · R1-4 was fixed, and one narrow path remains (accounted as disproportionate). byId is built after reconcilePrior has added its fallback carries. A `finding` ref naming an id the reviewer never returned can match the id minted for a carry the reviewer left unaccounted, and then counts as confirmed and lands in no list. Taking the reviewer's ids before reconcilePrior would close it.

### Commits

- 0093f66 redline: save review round 4 spec for PR #80 (#79)
- 2118e85 redline: R4-1, R4-2, R4-3 record round 3's reopen and decided rules, the landed guard narrowing and the resolved-as-fixed reading in the standards (#79)
- d7f2a4d redline: R4-1 record the R3-4 decision, its hand commit and the landed retrospective in round 3's shape (#79)
- a8497eb redline: R4-3 read an earlier run's resolved reply as fixed in prior-findings (#79)
- 61068fc redline: record PR #80 round 4 as built (#79)
- 972946e redline: save review round 5 spec for PR #80 (#79)
- fc410ae redline: R5-1 state the done rule and what a clean run checks in the README, the plugin descriptions and the mission (#79)
- 3cec25d redline: R5-1 record that a done-rule change rewords every statement of it in the standards (#79)
- 1f97b62 redline: record PR #80 round 5 as built (#79)
