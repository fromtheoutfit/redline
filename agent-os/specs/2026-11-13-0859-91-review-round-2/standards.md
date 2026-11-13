# Standards for PR #91 Review Round 2

The following standards apply to this work. Each is copied as it reads at `ff3f8d5`, before this round's retrospective: the whole file where it is short, otherwise the bullets the round applies, as earlier review rounds did.

---

## process/docs-gate (whole file)

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
- A change to the run's done rule rewords every statement of it a reader meets, found by searching for the old rule's words, not only in the file the change touched: the README's opening paragraph and its Known limits ("What a clean run means", which the handoff links), `docs/`, the skills' descriptions, both `.claude-plugin/` descriptions and `agent-os/product/mission.md`, whose "Honest about its reach" cites the README's Known limits and says what a clean run checked in the same words. A clean run is stated as what the run checked, never as a promise that no correctness bug remains, since the reviewer verifies the coverage pass's candidates and a decided finding it still reproduces is listed under For the person. #79 reworded the skill's description and the README's loop paragraph and left the README's opening line, both plugin descriptions and the mission on the old rule until round 5 (#80, R5-1)
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)
- A cost a spec's renderer Evidence records (a link that breaks, an entity that shows) is named in README Known limits in the same PR, each Evidence row read against the costs list before the docs are written: the #87 follow-up spec recorded an inline link's href taking the joiner, and Known limits named only the bare URL until #89, R3-1

Applied: line 5 gives the skill's Docs entry, and line 16 is why `docs/running.md` and `README.md` need none of their own. Line 15's practice, finding every statement by searching for its words, was used to find the three lines (`shape.md`, Decision 3). Line 17 is the nearest rule to R2-1, and the retrospective's item 1 adds its bullet after it.

---

## process/release (excerpt: the first bullet)

# Release

The plugin's version is the manifest's, every PR moves it, and a release is a person's tag and changelog entry after the merge (#16).

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)

Applied: the PR already carries `0.2.4` against `main`'s `0.2.3`, and this round changes nothing a setup rerun writes (`shape.md`, Decision 2).

---

## testing/tests (excerpt: line 23)

# Tests

- (line 23) A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; ...

Applied: no harness reads `README.md`, `docs/running.md` or `skills/redline/SKILL.md`, so none of them is a tested surface and the round adds no case (`shape.md`, Unattended answer 5).

---

## workflow/replay (excerpt: line 19)

# Replay

- (line 19) A relaunch runs the script the run launched with: by name while `workflows/redline-loop.js` is as launched, from the copy the harness persisted (as `scriptPath`) once it differs, which only the plugin's own repository can see (`redline-prefs.sh run drift`). Replay follows the prompt sequence: script path, script text outside the prompts, an agent's label and the agent file's body are not in the key. The `Workflow(<name>)` allow rule does not cover a `scriptPath` launch. Measured headless under `--plugin-dir` on 2.1.322 (#81)

Applied: the standard states only what was measured, headless, and makes no claim about bypass-permissions. It needs no change, and it is evidence for `shape.md`'s Unattended answer 1.

---

## scripts/guard (excerpt: lines 6 and 20)

# The guard

- (line 6) Default deny: a command the classifier cannot place is refused. `bash` only as `bash -c <string>`, checked recursively; interpreters (`python3`, `node`, `php -r`), `gh`, `curl`, `eval`, `source` and `sudo` are refused for every role. ...
- (line 20) `!` and the shell keywords are refused as a command word: the word after one would never be read, and a role runs plain pipelines, `a && b` in place of `if a; then b; fi` (#54, R2-5)

Applied to the plan: every command given to the implementer is a plain pipeline, with no `$`, no backticks outside single quotes, no process substitution and no interpreter, and the harnesses run only through `.claude/redline/checks.sh`.

---

## prompts/attribution (excerpt)

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. ...

---

## process/standards-retrospective

Applied through gate step 12 as the unattended section's point 8 states it: the edits are proposed in `shape.md`, approved by the standards approver, and applied in their own commit, or "Standards retrospective: no changes" is recorded under Decisions. This round has no pending decision, so no item is held.
