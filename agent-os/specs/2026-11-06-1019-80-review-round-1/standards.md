# Standards for PR #80 Review Round 1

Shaped by Redline in unattended mode. These standards apply to this work. They are quoted as they read at shaping time on the PR branch (`48c971b`). `workflow/agents`, `workflow/replay` and `testing/tests` are long and mostly about other surfaces, so only the bullets this round applies are quoted, each verbatim; the short standards are quoted in full.

---

## workflow/agents (excerpt: the bullets this round applies)

# Agents

One role per file under `agents/`, loaded as `redline:redline-<role>`, with its model and its denied tools in the frontmatter.

- The reviewer, the shaper, both approvers and the checker return JSON, not prose, and the workflow reads fields, never text (the coverage pass's relay of a skill's text is the one exception, below). The checker's pass or fail comes from `checks.sh`'s JSON: each check's `exit` against the baseline, the exit code and the git block (`unexpected_files`, `uncommitted`, `commits`), never `ok` and never the checker's error text (#37, R1-3)
- Judgment calls are returned, never decided: a shaper that cannot settle a question from the code returns it as `ask` with a story, options and a recommendation. The person decides in their session, or autopilot takes the recommendation and says so, except for a finding a repository ask rule covers, which autopilot leaves to the person with the rule as its reason (#49)
- Every decision carries its owner, in `shape.md`, in each finding's reply and in the handoff comment: `decided by: redline`, `decided by: @<login>` (the login `redline-gh.sh login` prints), `decided by: redline (autopilot)`, or `decided by: @<reviewer login>` for a change a teammate's review asked for and a human review pass made as asked (#36)
- A message the run shows the person says when it fires in the words of the decision behind it, so a fix that widens or narrows the condition rewords the message and the loop checks that pin it in the same commit: R1-3 let the checker-text warning fire on a round whose gate exited 1, and it still said 'on a passing gate' next to 'still failing, as at baseline' (#37, R2-1)
- A finding an earlier round recorded is not one it dispositioned. The evidence of a disposition is the Redline reply answering the finding (`fixed`, `deferred`, `decided`, `dropped`, or `carried` by a later round), never `shape.md`, which a hand-off never relaunched leaves reading `Decided by: redline` on fixes never made; a finding with no reply, or a `not changed` one, is carried forward: a finding of the current round with `carriedFrom`, re-verified against the head and never copied, listed under its own heading in the review body, replied to in its earlier thread and swept with it, and named in the handoff. The reviewer accounts for every carry-forward id as carried or resolved, and the workflow carries what it did not account for, with a warning, rather than dropping it. The duplicate check for a reply is a reply opening with this pass's title, so an earlier round's reply in a carried finding's thread is not one (#35). Only the run's first round carries: a `carriedFrom` on any review with no carry-forward list (a re-review, a final nit pass, a first round with no earlier findings) is cleared with a warning, since the history block shows later reviewers the carried ids (#46, R1-1). An earlier thread is swept on its own reply when the finding that carries it sits in the review body, which has no thread to reply in (#46, R1-4). The handoff names an earlier finding by its disposition before its reply text: one a later round's line already carried reads `carried forward as R2-2 in round 2`, whatever its own thread's last reply says (#46, R1-5). A carried finding is never known by a Redline id: a `knownAs` naming one is cleared with a warning and the finding is carried. One naming an issue or a teammate's comment keeps the author's choice to track it there: the finding stays under Already tracked with `first reported as R1-2` on its line, unshaped, and its earlier thread is answered `carried forward as R2-1; already tracked in #41 · decided by: redline` and left open as `already tracked`. That reply is what the next run reads as carried, so the finding is neither set aside unanswered nor raised again (#46, R1-2)
- A workflow subagent never has the Agent tool (`agent()` has no `tools` option and the default workflow agent denies it), so a skill it invokes runs its recipe without a fan-out. The skill runs as a foreground fork with the caller's tools and output contract: a `schema` on the agent that calls the Skill tool, role or not, can make the fork call StructuredOutput itself and leave the caller with `Skill execution completed` (spike #72's reviewer-role probe, then #79's second corpus run on a default agent after the same script got through on the first; it is not deterministic), and the run record counts the calling agent only (two tool calls), so a skill pass is a plain workflow agent with no schema, measured from the fork's transcript under `subagents/` (spike #72, #79). Its text is the one thing the workflow reads as text: the skill's own documented contract, one fenced json array of findings, and two fixed marker lines the prompt asks for (`coverage: skill denied`, `coverage: skill absent`), each a cause the workflow turns into a stage error at the pass's own label; anything else in the text is ignored. The effort word is always passed, since without one the skill reuses the level typed last on the machine (#79)
- The coverage pass is the finder and the reviewer the verifier (#79): the built-in `code-review` skill runs over the whole pull request at the round's head on every whole-PR and fix-diff round, since it is stochastic and attends to what moved, so each pass is a sample and the manual loop it replaces ran one per round. The reviewer verifies its candidates and runs no discovery pass of its own over the PR; it keeps the checks its prompt names by rule (scheduled and queued overlap, the Docs nit, the Version nit) and the fix-diff recheck, and accounts for every candidate with one of a fixed set of outcomes (`finding`, `forThePerson`, `duplicate`, `settled`, `known`, `refuted`, `outside`, `disproportionate`). The finder never returns an empty list, so the verifier's collapse is the run's stop rule: the prompt defines new (not collapsed into a finding already reported, settled in an earlier round, carried, or tracked elsewhere), the run ends when a round confirms no new correctness finding, and the workflow lists an unaccounted candidate under For the person as reported, with a warning, the mirror of carry-forward. Two guards keep the finder's wider net out of the plan: a candidate anchored outside the diff is never a finding, and one that needs implausible conditions to bite is disproportionate and dropped with that word. What the verifier would not act on but a person should see goes under `### For the person`, no id, never shaped, carried into the handoff, and never read back as a finding, since `redline-gh.sh prior-findings` reads only lines that open with a finding id

---

## workflow/replay (excerpt: the bullets this round applies)

# Replay

A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch.

- Nothing before a stopping point reads the clock: the launch timestamp is `args.launchedAt`, the spec folder name is derived from it, and `Date.now()` and `new Date()` do not appear in `workflows/redline-loop.js`
- The findings of the PR's earlier Redline rounds and their dispositions enter through `args.priorFindings`: the skill reads them with `redline-gh.sh prior-findings` after `last-round` and passes the list, and the workflow never reads the threads itself, since the run's own carried-forward replies change them (#35)
- A dial that turns a pass off keeps every prompt byte-identical to the run before the pass existed: `coverage off` reaches the workflow as `models.coverage` null, the coverage call and the candidates block exist only when a pass ran, and the loop test proves it by running every pre-existing scenario under the off value, so every earlier check holds unchanged (#79)
- `tests/loop-test.mjs` proves the rule: its relaunch scenarios assert that the prompts before the stopping point equal the first launch's, and a change that breaks that fails there before it reaches a PR

---

## testing/tests (excerpt: the bullets this round applies)

# Tests

Seven harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- A loop-test mock refuses an option the design forbids on a call (the coverage call with an agent type or a schema, since the guard does not see a skill fork and a schema on the caller can swallow the fork's output), so a regression there is red, never silently green (#79). `tests/setup-test.sh` pins this checkout's `.claude/redline.json` byte for byte to `templates/redline.json.example` with the reviewer substituted, so a key added to the template is added to both in the same commit (#79)
- `tests/setup-test.sh` over `tests/setup-fixtures/`: the subcommands of `scripts/redline-setup.sh`, on a settings file with other keys, a bare `shape-spec.md` and a Laravel-shaped `checks.json`, in the temp directory; its last cases regenerate this checkout's own `checks.sh` from its committed `.claude/redline/checks.json`, stamp it and compare, and prove a regenerate over the committed file is a no-op (#6), and prove this checkout's two alias files under `.claude/commands/` equal their templates (#44), that its unattended section carries the template's current marker and that `redline-setup.sh version <repoRoot>` over the checkout exits 0, the whole contract current (#15); the merge's hand-edit fixture is a copy of this checkout's own section with its marker stripped, whose three hand edits must come through a `--merge` byte for byte (#15); its last cases also prove the manifest and the marketplace entry carry one semver version, and that `version <repoRoot>` reports whether a self-hosted root loads in place, `inPlace` true over this checkout and a warning over a root whose manifest names this plugin at another path (#16)
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change
- A case named for a boundary asserts the boundary itself: one that says it checks a header's last line matches the last non-blank line of the output, not text a few lines before it, or a cut between the two still passes (#34, R2-1)
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)

---

## process/docs-gate

# Docs gate

Every spec names the README, `docs/` and template changes it needs, so a public reader is never behind the code.

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- A plan that cannot name the section adds one; the entry then names the new section
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)
- No commit exists at shaping time: a plan's entry names the README section, or the `docs/` file and section (and template), its task updates, or the reason there is no reader-facing change, and its commit is that task's own, named in `plan.md`'s As built when it lands and confirmed at the gate. The plan approver checks the section or the reason only: its check 8 first asked for the commit too, which no reshape could supply, so a plan written as point 7 says could be bounced until the run ran out of adjustments (#51, R1-3)
- The README names a gate step by its title, never by its number: the numbers move whenever a step is inserted before them (#40 moved the retrospective from 9 to 10, #13 from 10 to 11, #16 from 11 to 12), and a gate edit touches no directory this step lists, so no Docs entry would flag the stale number (#51, R1-1)
- In a Redline run the shaper writes them from the unattended section's point 7, so the round's commits carry the README or `docs/` edit; the plan approver bounces a plan missing one; the reviewer reports a change with no entry as a nit with the fix "update section X of the README" or of `docs/<file>`
- A prose step whose text holds a backticked span is inside the stamp: adding this step moved the hash, and the restamp went in the same commit (#13)
- Point 7 of the unattended section keeps its "Steps … stay as written" sentence first on its line and says "gate step" in lower case after it: `redline-setup.sh unattended` reads the fill-ins back by leftmost match, so an earlier capital "Step" on that line would be read as the fill-in (#13)
- A section the setup template or the workflow names by heading (`Git rules for Redline agents`, named by `templates/claude-md-git-sentence.md` and the run line in `workflows/redline-loop.js`; `Known limits`, linked by the handoff comment) stays in the README under that heading: moving it is a template change, a minor bump and a rerun of setup in every repository. The `checks.sh` header's "See README.md for the output contract" is the same kind, written by `redline-setup.sh checks` and read back by `read-checks`, and is kept until the next `checks-template.sh` bump; `docs/contract.md` opens by saying it is the contract that sentence means (#14)
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/release

# Release

The plugin's version is the manifest's, every PR moves it, and a release is a person's tag and changelog entry after the merge (#16).

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)
- The two versions are kept equal, never one without the other: Claude Code reads the manifest's first and ignores the entry's when both are set, `claude plugin validate` warns on a disagreement and `claude plugin tag` refuses one; `tests/setup-test.sh`'s last cases prove they agree and are semver
- The tag is a person's step, never CI's: on `main`, clean, from the plugin root, `claude plugin tag --dry-run .` then `claude plugin tag --push`, which validates the manifest, requires the two versions to agree, a clean tree and no `redline--v<version>` tag yet, and pushes the annotated tag. CI runs the gate and nothing of a release
- `CHANGELOG.md` is written at tag time, dated and committed on `main` before `claude plugin tag`, so the tag names a commit that carries its own entry (#65, R1-2): one heading per tagged version, newest first, one line per merged PR since the previous tag, in three groups (Features; Fixes; Setup and templates, the ones a rerun of `/redline:setup` carries); a PR merged between tags goes under the next tagged version
- Claude Code moves an install on the manifest's `version`, not on the tag: an install from the GitHub marketplace stays on its version until `claude plugin update redline@redline` or auto-update, which is off by default for a marketplace that is not Anthropic's. The tag names the release commit and is what a dependency's version range resolves against (plugin loading reference, "How Claude Code computes the version")
- A marketplace is registered once per user, so the machine's `redline` marketplace is the GitHub one and development loads the checkout with `claude --plugin-dir <checkout>`, which replaces the installed copy by name for that session with its hooks and `CLAUDE_PLUGIN_ROOT` from the checkout; the local-directory marketplace would put every repository on the machine on the checked-out branch
- A script the skill runs by `${CLAUDE_PLUGIN_ROOT}` knows which copy the session loaded from its own path, so it takes no flag for it: `redline-setup.sh version <repoRoot>` reports a self-hosted root that is not the loaded copy (`plugin: {self, inPlace, pluginRoot}`) and the launch precheck warns with the `claude --plugin-dir` line, never stops

---

## process/standards-retrospective

# Standards retrospective

Every spec ends by asking what it taught, mechanically, and the answer lands in a standard or is recorded as "no changes".

- Gate step 12 in `.claude/commands/agent-os/shape-spec.md`: list every Decision in `shape.md`, every deviation in `plan.md`'s As built, and every check that went red and was fixed by learning something; classify each as already in a standard, missing, or contradicting one
- Approved edits land in their own commit, separate from the spec's code. Code that enforces a new rule (a guard-cases row, a loop-test check) follows in its own commit with the case proving a violation fails
- In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit
- When nothing changes, `shape.md` records "Standards retrospective: no changes" under Decisions, so the absence is deliberate and visible
- A standards edit keeps the file's headings: they diff empty against `main` unless the spec names the section it adds, renames or removes
- `index.yml` lists every standard and nothing else; a new file is added to it in the same commit, alphabetised by folder and file

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
