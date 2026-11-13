Redline handoff

Redline ran 3 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in the nit fixes. The coverage pass reviewed the whole PR at the head of every round but the final nit pass; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

Resolved 2 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 1 correctness, 0 nit; 4 commits; spec `agent-os/specs/2026-11-13-0859-91-review-round-1`
- Round 2 (fix-diff): 0 correctness, 1 nit; 4 commits; spec `agent-os/specs/2026-11-13-0859-91-review-round-2`
- Round 3 (final-nit-pass): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-11-13-0859-91-review-round-3`

### Decisions

- **R1-1** A resume after the handoff comment posted posts it again when args.drift changed: fixed in ab88ed0 · decided by: redline
- **R2-1** Docs state the no-prompt relaunch in bypass-permissions as fact, though it was never measured: fixed in 7da0f89 · decided by: redline

### For the person

- `workflows/redline-loop.js:3134` · The Finish rule stops only when a posted round is above the finishing round. A re-run of the highest posted round itself, whose post is skipped as already posted, still hands off if it comes back clean. It needs the pin to fail first. A check on a skipped post would also stop a legitimate resume at `post rN`, which skips the post and uses the cached findings.
- `skills/redline/SKILL.md:226` · On the plugin's own repository, when `run save` exits 2 the skill follows line 218 ("go on: the relaunch in this session does not need the marker"). The person answers every call, then `run drift` exits 2 and the skill stops, so the answers are lost. Decision 9 chose the stop, but the two sentences now disagree. Saying so at the save, or letting `run drift` read the run's record directly, would avoid it.
- `scripts/redline-prefs.sh:208` · A pin that cannot be found (no record, a record without `scriptPath`, or a persisted copy that is gone) is treated like a launch by the scriptPath fallback. A changed workflow is then refused with a line saying the launch ran from the file itself, which is not the cause in that case. The refusal is safe; only its stated reason is wrong. The harness records read here do carry `scriptPath`.
- `workflows/redline-loop.js:244` · The agent sentence exists only when a relaunch passed `args.drift`. An autopilot self-review that edits an agent file reports nothing, and neither does a guided one that edits one after its last hand-off. The cap-hit comment and a human review summary never carry the sentence. So shape.md's "an agent change is read from git and reported, whatever the session has loaded" holds only at relaunches. That matters if an interactive session does reload agent files mid-session, which was not measured.
- `skills/redline/SKILL.md:224` · Both refusals, the skill's `refuse` and the workflow's stage `relaunch`, run `run clear` without telling the person which uncommitted spec folders the earlier run left. The stage `relaunch` result's `specFolders` is empty, and the marker that named them is cleared. The fresh run's clean-tree precheck then fails without its `commit or remove <folders>` line.
- `workflows/redline-loop.js:245` · The handoff comment is posted after the last round, so "this run's remaining rounds may run under them" reads there as a forecast. Something like "the later rounds may have run under them" would fit. The wording is decision 1's rider, so the change is the author's call.
- `skills/redline/SKILL.md:220` · `run drift` runs only just before the relaunch, after the person has answered the calls. A `refuse` can only follow a launch by the scriptPath fallback, and it could be detected at the stop instead, before any call is presented.
- `workflows/redline-loop.js:3126` · The Finish read also runs in a dry run, where nothing was posted and the check cannot fire. Skipping it when `postToGitHub` is false would save one agent call and one GitHub read. The loop test pins today's dry-run call list.
- `scripts/redline-prefs.sh:227` · The agent sentence and the refusal text are each written twice, in this jq and in the workflow (AGENTS_CHANGED and the stage `relaunch` error). Each copy is pinned by its own test, so an edit to one copy passes while the skill's spoken line and the handoff comment drift apart.
- `scripts/redline-prefs.sh:192` · The self-hosted test (`--plugin` resolves to the repository root) now appears twice in this script, here and in `run check`'s `plugin` reason at line 277. One helper would keep them from disagreeing when #66 changes how self-hosting is detected.
- `workflows/redline-loop.js:3407` · The workflow's second layer fires only when the skill ran `run drift`, got `refuse` and launched anyway with that `drift`. A relaunch that skipped `run drift` arrives with no `args.drift` and is not caught, so the pin depends entirely on the skill following section 7.
- `agent-os/specs/2026-11-12-1852-81-pin-relaunch-script-finish-rule/shape.md:53` · The probe report (harness behaviour measured headless on 2.1.322) is written into this public spec and into two standards. CLAUDE.md keeps spike notes in `redline-internal`, and the #72 spike cited its notes there by file name. This spec says the probes are its own and nothing was copied. Whether a probe report belongs here is the author's call.
- `scripts/redline-prefs.sh:228` · R1-1 was decided, and its shape.md ("What it gives up") accepts one cost: an error resume before Finish (a failed `recheck r2`, say) keeps a stale agent list. In autopilot that list is `[]`, so the handoff comment names no agent file even when the resumed rounds ran in a reopened session that loads the edited agents. The shape says a narrower rule would need the workflow's label names. But an error marker already carries `stage`, so holding the list only for `kind == "error" and .stage == "finish"` (and for `stopped`) would need no label names.
- `workflows/redline-loop.js:3134` · The Finish read trusts `round` whenever `error` is empty. On a run that posted, `last.round < finishing` cannot be true: it would mean the GitHub agent returned 0 for a failed read without setting `error`. Treating it as a failed read would harden the backstop for the PR #80 shape. That takes both a re-run round and an agent that ignores its prompt.
- `scripts/redline-prefs.sh:223` · `run drift` reports only files under `agents/`. A self-review round can also edit `scripts/redline-gh.sh`, the other scripts, or README's "Git rules for Redline agents", and agents read all of these live. A reopened session also loads an edited `skills/redline/SKILL.md`. None of these is reported or pinned. Should the sentence cover them? That is a scope question for the author.
- `scripts/redline-prefs.sh:230` · Pre-existing, not a regression. A run launched by the section 6 `scriptPath` fallback ran because the name is not registered in that session. While the workflow file is unchanged, `run drift` answers `name`, and a relaunch by name in the same session fails as not found. Section 7 has no fallback. The new routing could answer `scriptPath` with the live file in that case.
- `docs/running.md:122` · "Run markers and resume" still says a resume "relaunches with the marker's args plus `resume`". On the plugin's own repository a resume first runs `run drift`: it may go by `scriptPath` or be refused, and it adds `args.drift` with the held agent list (R1-1). Only "Hand-off and relaunch" says so. The #81 plan's first Docs entry said this section would name `run drift`, and the as-built entry moved that to "Saved launch settings".
- `tests/loop-test.mjs:1934` · No Finish-rule case covers a human review pass's summary. There is no human sequence with `lastPosted` above the nit-pass round that checks the summary comment and the record commit do not run. docs/running.md promises the same read for the summary.

### Commits

- 89ef4b4 redline: save review round 1 spec for PR #91 (#81)
- ab88ed0 redline: R1-1 keep the agent list an error or stopped resume passes, so a resume never posts the handoff comment twice (#81)
- fd21a23 redline: record the round 1 review lessons in the standards (#81)
- ff3f8d5 redline: record PR #91 round 1 as built (#81)
- f0bf0e3 redline: save review round 2 spec for PR #91 (#81)
- 7da0f89 redline: R2-1 say the pinned relaunch prompt is expected and not measured yet, in the docs and the skill line (#81)
- 3936725 redline: record the round 2 review lessons in the standards (#81)
- 8d78f36 redline: record PR #91 round 2 as built (#81)
