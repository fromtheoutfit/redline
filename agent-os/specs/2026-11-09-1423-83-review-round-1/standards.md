# Standards for PR #83 Review Round 1

The following standards apply to this work, as they read at shaping time (`00b04f3`).

---

## process/release (excerpt: the bullets this round applies)

# Release

The plugin's version is the manifest's, every PR moves it, and a release is a person's tag and changelog entry after the merge (#16).

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)
- A marketplace is registered once per user, so the machine's `redline` marketplace is the GitHub one and development loads the checkout with `claude --plugin-dir <checkout>`, which replaces the installed copy by name for that session with its hooks and `CLAUDE_PLUGIN_ROOT` from the checkout; the local-directory marketplace would put every repository on the machine on the checked-out branch
- A script the skill runs by `${CLAUDE_PLUGIN_ROOT}` knows which copy the session loaded from its own path, so it takes no flag for it: `redline-setup.sh version <repoRoot>` reports a self-hosted root that is not the loaded copy (`plugin: {self, inPlace, pluginRoot}`) and the launch precheck warns with the `claude --plugin-dir` line, never stops
- Under `claude --plugin-dir` a subagent's `Write` is refused in auto mode with no verdict, and in accept-edits it prompts despite a matching allow rule; an installed release is clean. The probe, on Claude Code 2.1.319: a project subagent with `tools: Write` asked to write one word, same checkout, same mode, refused under `--plugin-dir` and written under plain `claude`. The main session's own Writes passed in both, and allow rules are not consulted for a subagent's write in either mode. One launcher Write of `snapshot-start.json` was refused in an inline session on Nov 6, unexplained, so a run fails at its first file write, normally its first post. The launch skill says so when `${CLAUDE_PLUGIN_ROOT}` is outside `/plugins/cache/`, on a fresh launch and on a resume, a warning and never a stop since a skill cannot read the permission mode (#76)

---

## process/docs-gate (excerpt: the bullets this round applies)

# Docs gate

Every spec names the README, `docs/` and template changes it needs, so a public reader is never behind the code.

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/standards-retrospective

# Standards retrospective

Every spec ends by asking what it taught, mechanically, and the answer lands in a standard or is recorded as "no changes".

- Gate step 12 in `.claude/commands/agent-os/shape-spec.md`: list every Decision in `shape.md`, every deviation in `plan.md`'s As built, and every check that went red and was fixed by learning something; classify each as already in a standard, missing, or contradicting one
- Approved edits land in their own commit, separate from the spec's code. Code that enforces a new rule (a guard-cases row, a loop-test check) follows in its own commit with the case proving a violation fails
- In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit
- When nothing changes, `shape.md` records "Standards retrospective: no changes" under Decisions, so the absence is deliberate and visible
- A round a person finishes by hand, outside the run (a pending decision applied, a deferred full fix made), still owes its record in the same PR: the round's `shape.md` records the decision with its owner and commit, its proposed retrospective lands or reads 'Standards retrospective: no changes', and every standard that named the change pending says what landed, not only the README and `docs/`: `6ef58a9` applied R3-4 with neither record, and `a70c243` narrowed the guard while `scripts/guard.md` still called it pending, until the next round found both (#80, R4-1, R4-2)
- A standards edit keeps the file's headings: they diff empty against `main` unless the spec names the section it adds, renames or removes
- `index.yml` lists every standard and nothing else; a new file is added to it in the same commit, alphabetised by folder and file

---

## scripts/guard (excerpt: the bullet R1-6 reads against)

# The guard

`scripts/redline-guard.sh` is a default-deny allowlist per role, and every change to it is proven by a row in `tests/guard-cases.tsv`.

- The guard does not see a skill fork: a `Skill` call from a Redline role runs the skill's commands with no Redline `agent_type`, so `gh`, `$(...)` and loops the role's row refuses go through unvetted (spike #72). A pass built on a skill is therefore a plain workflow agent, never a role, and its safety is the skill's own read-only recipe and the session's permission mode, except where the fork's Bash call meets #50's main-session approvals: a fork is a non-role session to the guard, so one of the plugin's scripts by real path (of `redline-gh.sh`, only its read subcommands), the repository's `checks.sh` and read-only git are approved for it with no prompt, and a `redline-gh.sh` write (a review, a reply, a comment, an issue, a thread resolve) is inert, never a deny, so the session's permission prompt decides; `tests/guard-cases.tsv` pins the write as `inert` beside a read row that stays `allow`, and the README's Known limits, `docs/running.md` and `docs/guard.md` say the same (#80, R2-5, R4-2)

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
