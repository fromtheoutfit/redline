# Standards for PR #94 Review Round 6

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `9d22ff8`, before this round's retrospective. A short file is copied whole; for a long one, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did.

---

## workflow/agents (applied bullet)

Line 44 (whole):

- `stageError` falls back to the last agent label, so a stop that must not be resumed says so itself (the `fresh` flag on Finish's re-run stop); a failed read of the same step stays resumable at its label (#81); a call made on a step's behalf after it (the verdict after a spilled check) hands the label back, so a stop that follows resumes at the step and the gate runs again (#68)

Applied: R6-10 is the case this bullet missed, the call's own failure; the retrospective proposes extending it.

---

## testing/tests (applied bullets)

Line 15 (whole):

- A stage error is pinned by its `resumeFrom` label as well as its text, since the label is what a resume reruns: R1-13 moved a check after another agent's call and its As built called the label unchanged, which only a `resumeFrom` check would have caught (#94, R2-9)

Line 32 (whole):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)

Applied: Task 6's check pins the stop by its `resumeFrom` label; Tasks 6 and 7 add their checks red first.

---

## scripts/bash-conventions (applied bullets)

Line 45 (whole):

- A script that cuts text the workflow matches on keeps what the workflow matches: the cut falls at a word boundary, so no token becomes another one (`R5-10` cut to `R5-1`), and the tokens in the part cut off are put back after the cut (the finding ids of a commit subject, in every form the workflow looks for, with the boundaries the workflow's own test uses). The length is stated in the script's comment (#68)

Line 46 (whole):

- A result a script keeps outside the working tree is filed by the repository's physical root and the commit it was produced at, one file a root, written through a temp name and a rename; its reader takes only the file for the current commit, mode and input and exits 2 on anything else, since a stale result read as current is worse than none, and two worktrees of one repository never share one. The script's header and comment say where the file lives (#68)

Applied: line 45 is the cut R6-5 keeps for matching while posted text quotes the whole subject. Line 46 is the rule R6-2, R6-7 and R6-8 extend; their additions wait for the person's template change (`shape.md`, `## Deferred`).

---

## scripts/guard (applied bullet)

Line 9 (part):

- When the repository is the plugin (its checkout loaded in place, Redline reviewing itself), the plugin's source is repository content under the roles' usual prefixes, except `scripts/redline-guard.sh` and `hooks/hooks.json` [...] A finding whose fix touches `scripts/checks-template.sh` below its header, or changes the text `redline-setup.sh checks` writes into this repository's `checks.sh` (its header, the template version line, the check block), is deferred the same way: the setup test's last cases regenerate `checks.sh` from `checks.json` and compare it with the committed file, and no role may regenerate it, so such a fix leaves the gate red. The round records the intended lines in its Deferred entry, mitigated by a Known limits line, and a person makes the change, regenerates `checks.sh` and restamps after the run (#7, R1-14; #12, R1-1). [...]

Applied: R6-2, R6-4, R6-7 and R6-8 are deferred this way; R6-3 and R6-6 are declined with it as where they belong.

---

## process/docs-gate (applied bullet)

Line 5 (whole):

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason

Applied: each task names its entry.

---

## process/release (applied bullet)

Line 5 (part):

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR [...] except in a PR whose spec keeps the version on purpose [...]

Applied: the version stays 0.3.0; this round changes nothing a setup rerun writes.

---

## prompts/attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
