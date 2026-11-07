# Standards for PR #80 Review Round 3

Shaped by Redline in unattended mode. These standards apply to this work. They are quoted as they read at shaping time on the PR branch (`474593f`, after round 2's standards commit `af36f74`). `workflow/agents`, `workflow/replay` and `testing/tests` are long and mostly about other surfaces, so only the bullets this round applies are quoted, each verbatim. The short standards are quoted in full.

---

## workflow/agents (excerpt: the bullets this round applies)

# Agents

One role per file under `agents/`, loaded as `redline:redline-<role>`, with its model and its denied tools in the frontmatter.

- Judgment calls are returned, never decided: a shaper that cannot settle a question from the code returns it as `ask` with a story, options and a recommendation. The person decides in their session, or autopilot takes the recommendation and says so, except for a finding a repository ask rule covers, which autopilot leaves to the person with the rule as its reason (#49)
- A message the run shows the person says when it fires in the words of the decision behind it, so a fix that widens or narrows the condition rewords the message and the loop checks that pin it in the same commit: R1-3 let the checker-text warning fire on a round whose gate exited 1, and it still said 'on a passing gate' next to 'still failing, as at baseline' (#37, R2-1)
- A sentence that says what keeps a change out of a run, in the README, `CLAUDE.md`, a standard or a prompt, credits a role only with a check its prompt carries, read in that prompt before the sentence is written: #65's R1-3 correction credited the plan approver with keeping the guard and hook files out of a cached-mode plan, while its file-scope check names the loaded plugin's directory, which is then the cache, and the claim reached four files before R2-1 removed it (#65, R2-1)
- A finding an earlier round recorded is not one it dispositioned. The evidence of a disposition is the Redline reply answering the finding (`fixed`, `deferred`, `decided`, `dropped`, or `carried` by a later round), never `shape.md`, which a hand-off never relaunched leaves reading `Decided by: redline` on fixes never made; a finding with no reply, or a `not changed` one, is carried forward: a finding of the current round with `carriedFrom`, re-verified against the head and never copied, listed under its own heading in the review body, replied to in its earlier thread and swept with it, and named in the handoff. [...] A carried finding is never known by a Redline id: a `knownAs` naming one is cleared with a warning and the finding is carried. [...] (#46, R1-2)
- The coverage pass is the finder and the reviewer the verifier (#79): the built-in `code-review` skill runs over the whole pull request at the round's head on every whole-PR and fix-diff round, since it is stochastic and attends to what moved, so each pass is a sample and the manual loop it replaces ran one per round. The reviewer verifies its candidates and runs no discovery pass of its own over the PR; it keeps the checks its prompt names by rule (scheduled and queued overlap, the Docs nit, the Version nit) and the fix-diff recheck, and accounts for every candidate with one of a fixed set of outcomes (`finding`, `forThePerson`, `duplicate`, `settled`, `known`, `refuted`, `outside`, `disproportionate`). The finder never returns an empty list, so the verifier's collapse is the run's stop rule: the prompt defines new (not collapsed into a finding already reported, settled in an earlier round, carried, or tracked elsewhere); `fixed` is the one disposition a candidate may reopen: a candidate that matches an earlier finding marked fixed but that the verifier reproduces or traces at the round's head is new, reported as a finding of this round with the earlier id named, so a fix that did not fully land keeps the run going under `maxRounds`, while a re-sampled finding the fix did close no longer reproduces and settles (#80, R2-1), the run ends when a round confirms no new correctness finding, and the workflow lists an unaccounted candidate under For the person as reported, with a warning, the mirror of carry-forward. Two guards keep the finder's wider net out of the plan: a candidate anchored outside the diff is never a finding, and one that needs implausible conditions to bite is disproportionate and dropped with that word. What the verifier would not act on but a person should see goes under `### For the person`, no id, never shaped, carried into the handoff, and never read back as a finding, since `redline-gh.sh prior-findings` reads only lines that open with a finding id. The verifier is shown the PR's earlier runs' handled findings on every round that ran a coverage pass, not only on the whole-PR round, since the pass samples the whole PR at every head and can re-sample a finding an earlier run deferred or decided; the carry-forward list stays on the first round (#80, R1-2). The count sentence counts a candidate where the round puts it. Under `correctness only`, a nit reported from a candidate is `forThePerson` and listed there, whether or not it carries a `knownAs`. Otherwise a finding listed under Already tracked is `known`. A `finding` entry whose ref names no finding of the round is listed under For the person as reported, like an unaccounted candidate. The findings file keeps the candidate list beside the accounting its indexes point into (#80, R1-4, R1-5)

(`[...]` marks text left out of the long carry-forward bullet; the parts quoted are verbatim.)

---

## workflow/replay (excerpt)

# Replay

A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch.

- Decisions, approved plans and selected findings enter the workflow only after the prompt they answer (`args.decisions` after shaping, `args.approvedPlans` for the plan dial, `args.selected` for the review dial); a prompt before that point never mentions them
- A dial that turns a pass off keeps every prompt byte-identical to the run before the pass existed: `coverage off` reaches the workflow as `models.coverage` null, the coverage call and the candidates block exist only when a pass ran, and the loop test proves it by running every pre-existing scenario under the off value, so every earlier check holds unchanged (#79)
- `tests/loop-test.mjs` proves the rule: its relaunch scenarios assert that the prompts before the stopping point equal the first launch's, and a change that breaks that fails there before it reaches a PR

---

## testing/tests (excerpt)

# Tests

Seven harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site: #42's fix covered nine checks and scripted `'""'` at one, so a revert at the other eight stayed green (#43, R1-1)
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change

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
- A new launch word lands, in the same commit, in the skill's grammar table, its `argument-hint` and its `description`, and in the alias template's `argument-hint` with this checkout's copy, so the slash-command hint never omits a word a run's own message tells the person to type (#80, R1-1)
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/release

# Release

The plugin's version is the manifest's, every PR moves it, and a release is a person's tag and changelog entry after the merge (#16).

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)
- The two versions are kept equal, never one without the other: Claude Code reads the manifest's first and ignores the entry's when both are set, `claude plugin validate` warns on a disagreement and `claude plugin tag` refuses one; `tests/setup-test.sh`'s last cases prove they agree and are semver
- The tag is a person's step, never CI's: on `main`, clean, from the plugin root, `claude plugin tag --dry-run .` then `claude plugin tag --push`, which validates the manifest, requires the two versions to agree, a clean tree and no `redline--v<version>` tag yet, and pushes the annotated tag. CI runs the gate and nothing of a release
- `CHANGELOG.md` is written at tag time, dated and committed on `main` before `claude plugin tag`, so the tag names a commit that carries its own entry (#65, R1-2): one heading per tagged version, newest first, one line per merged PR since the previous tag, in three groups (Features; Fixes; Setup and templates, the ones a rerun of `/redline:setup` carries); a PR merged between tags goes under the next tagged version. A line under Setup and templates says what a rerun writes, read off the subcommand's own header: `redline-setup.sh config` keeps an existing `redline.json` as the person's and lists a changed template value under differs without writing it, so a key the template gains reaches a repository by hand or by `--force`, and the line says which (#80, R2-4)
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
