# Standards for PR #65 Review Round 1

Shaped by Redline in unattended mode. The following standards apply to this work, as they read at shaping time on the PR branch. `scripts/guard`, `scripts/bash-conventions` and `testing/tests` are long and mostly about other surfaces, so only the bullets this round applies are quoted; the full files are under `agent-os/standards/`.

---

## process/release

# Release

The plugin's version is the manifest's, every PR moves it, and a release is a person's tag and changelog entry after the merge (#16).

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the reviewer treats a missing bump as a nit
- The two versions are kept equal, never one without the other: Claude Code reads the manifest's first and ignores the entry's when both are set, `claude plugin validate` warns on a disagreement and `claude plugin tag` refuses one; `tests/setup-test.sh`'s last cases prove they agree and are semver
- The tag is a person's step, never CI's: on `main`, clean, from the plugin root, `claude plugin tag --dry-run .` then `claude plugin tag --push`, which validates the manifest, requires the two versions to agree, a clean tree and no `redline--v<version>` tag yet, and pushes the annotated tag. CI runs the gate and nothing of a release
- `CHANGELOG.md` is written at tag time: one heading per tagged version, newest first, one line per merged PR since the previous tag, in three groups (Features; Fixes; Setup and templates, the ones a rerun of `/redline:setup` carries); a PR merged between tags goes under the next tagged version
- Claude Code moves an install on the manifest's `version`, not on the tag: an install from the GitHub marketplace stays on its version until `claude plugin update redline@redline` or auto-update, which is off by default for a marketplace that is not Anthropic's. The tag names the release commit and is what a dependency's version range resolves against (plugin loading reference, "How Claude Code computes the version")
- A marketplace is registered once per user, so the machine's `redline` marketplace is the GitHub one and development loads the checkout with `claude --plugin-dir <checkout>`, which replaces the installed copy by name for that session with its hooks and `CLAUDE_PLUGIN_ROOT` from the checkout; the local-directory marketplace would put every repository on the machine on the checked-out branch
- A script the skill runs by `${CLAUDE_PLUGIN_ROOT}` knows which copy the session loaded from its own path, so it takes no flag for it: `redline-setup.sh version <repoRoot>` reports a self-hosted root that is not the loaded copy (`plugin: {self, inPlace, pluginRoot}`) and the launch precheck warns with the `claude --plugin-dir` line, never stops

---

## process/docs-gate

# Docs gate

Every spec names the README and template changes it needs, so a public reader is never behind the code.

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section (and template, if any) and either the commit that updated it or "no reader-facing change" with the reason
- A plan that cannot name the section adds one; the entry then names the new section
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)
- No commit exists at shaping time: a plan's entry names the README section (and template) its task updates, or the reason there is no reader-facing change, and its commit is that task's own, named in `plan.md`'s As built when it lands and confirmed at the gate. The plan approver checks the section or the reason only: its check 8 first asked for the commit too, which no reshape could supply, so a plan written as point 7 says could be bounced until the run ran out of adjustments (#51, R1-3)
- The README names a gate step by its title, never by its number: the numbers move whenever a step is inserted before them (#40 moved the retrospective from 9 to 10, #13 from 10 to 11, #16 from 11 to 12), and a gate edit touches no directory this step lists, so no Docs entry would flag the stale number (#51, R1-1)
- In a Redline run the shaper writes them from the unattended section's point 7, so the round's commits carry the README edit; the plan approver bounces a plan missing one; the reviewer reports a change with no entry as a nit with the fix "update section X of the README"
- A prose step whose text holds a backticked span is inside the stamp: adding this step moved the hash, and the restamp went in the same commit (#13)
- Point 7 of the unattended section keeps its "Steps … stay as written" sentence first on its line and says "gate step" in lower case after it: `redline-setup.sh unattended` reads the fill-ins back by leftmost match, so an earlier capital "Step" on that line would be read as the fill-in (#13)

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

---

## scripts/guard (excerpt: the bullets this round applies)

# The guard

`scripts/redline-guard.sh` is a default-deny allowlist per role, and every change to it is proven by a row in `tests/guard-cases.tsv`.

- When the repository is the plugin (its checkout loaded in place, Redline reviewing itself), the plugin's source is repository content under the roles' usual prefixes, except `scripts/redline-guard.sh` and `hooks/hooks.json`: the guard that vets the run is changed by a person, never by a Redline role (#4). A finding there is deferred, mitigated by a pinned `tests/guard-cases.tsv` row or a Known limits line, and a person makes the change after the run (#5, R1-1). [The rest of the bullet covers `checks.sh` restamps, `checks-template.sh` and `checks.json`; none applies this round.]
- Every change to the guard adds or changes a row in `tests/guard-cases.tsv` in the same commit, with the `agent_type` Claude Code sends, beside a row for the neighbouring decision that must not change (`allow Write REPO/scripts/redline-guard.sh` in an ordinary repository, next to the self-hosted `deny`)
- A guard denial is a sentence a person can act on: which file or command, which rule, and for the self-hosted files, who changes them

---

## scripts/bash-conventions (excerpt)

# Bash scripts

Every script under `scripts/` is its own documentation and talks to the workflow in JSON.

- Usage errors exit 2 with a one-line reason on stderr. A check that fails exits 1. A script whose exit code is an answer (`redline-gh.sh has-review`: 0, 1 or 2) says so in its header
- The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. The README quotes from it rather than restating it. [The rest of the bullet covers `checks.sh`'s JSON; it does not apply.]
- A change to what a subcommand selects or prints rewords every description of it in the same commit, found by searching for the old phrase across `README.md`, `skills/` and `agents/` rather than by editing only the `redline-gh.sh` table row that quotes the header: R1-3 changed which review body `human-review` takes and updated the header, the README's `redline-gh.sh` row and the revise skill, and left the README's paragraph on `/redline:redline-revise <pr> review` describing the old selection (#38, R2-1)

---

## testing/tests (excerpt: the bullets this round applies)

# Tests

Seven harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- `tests/setup-test.sh` over `tests/setup-fixtures/`: [...] its last cases also prove the manifest and the marketplace entry carry one semver version, and that `version <repoRoot>` reports whether a self-hosted root loads in place, `inPlace` true over this checkout and a warning over a root whose manifest names this plugin at another path (#16)
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)

This round's two fixes change prose only (a README sentence and a header comment), so no case is added. The behaviour R1-4's header line describes is already pinned at `tests/setup-test.sh:806`.
