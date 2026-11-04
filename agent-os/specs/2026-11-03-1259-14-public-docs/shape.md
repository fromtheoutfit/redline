# Public docs: README for installation and use, reference moved to docs/ (#14) — Shaping Notes

## Scope

Issue #14, the source of truth for the target layout, read with the eight decisions in the shaping prompt and three answered on 2026-11-03. The README becomes installation and usage documentation under 150 lines: what Redline is and the loop, requirements, install, quick start with the `/redline` aliases, the dials with their defaults, the Files table, the git rules for Redline agents, Known limits, and a link to each reference file. The reference moves to `docs/` (`setup.md`, `contract.md`, `running.md`, `guard.md`, `upgrading.md`, `scripts.md`) and Contributing to `CONTRIBUTING.md`. Every reference to a README section elsewhere in the repository moves with its section in the same commit; the two sections the setup template and the workflow name by heading stay in the README. The Docs gate step lets an entry name a `docs/` file and section. Patch bump to 0.1.1. Not in scope: a docs site, badges, GitHub Pages, Phase 2 (#1 to #3), any template change.

## Decisions

See `plan.md`, "Decisions" (fourteen entries, each with its owner). The evidence behind the three answered today:

**The `checks.sh` header sentence stays (decision 9).** `scripts/redline-setup.sh:1042` sets `readme = "README.md" if self_hosted else "the Redline plugin's README"`, line 1090 writes `See %s for the output contract.` into every generated header, and line 1238 (`read-checks`) sets `self_hosted = "See README.md for" in htext`. `scripts/checks-template.sh:30` carries the hand-copy form. Rewording any of it is a change to what a setup rerun writes: a minor bump, `checks-template.sh` v3, a regenerate and restamp here, and a rerun in every set-up repository. Kept, with the one hop (the README's Documentation list names `docs/contract.md` as the output contract) and `docs/contract.md` opening with the sentence the header means.

*Wording to carry at the next `checks-template.sh` bump:* "See docs/contract.md in the Redline plugin for the output contract" (self-hosted: "See docs/contract.md for the output contract"), with `read-checks`'s detection phrase changed to match both spellings, old and new, so a header written by v2 still bootstraps.

**Contributing moves to `CONTRIBUTING.md` at the root (decision 10).** The issue's README list and docs/ list both leave it out. GitHub's convention is a root `CONTRIBUTING.md`, linked from the new-pull-request page. `CHANGELOG.md:3` and gate step 11 (`.claude/commands/agent-os/shape-spec.md:252`, prose) are repointed in the same commits.

**The Docs gate step: entries may name a `docs/` file (decision 6).** Step 10's directory list stays; its entry sentence gains "or the `docs/` file and section". A change to `docs/` is reader-facing by nature and needs no entry. The sentence holds backticked spans, so the stamp moves and the restamp is in the same commit (`tests/gate-test.sh`'s last case, `tests/setup-test.sh`'s regenerate-and-compare cases). The unattended section's point 7 (`shape-spec.md:45`) carries the same phrase as a hand edit of this repository's section: `templates/shape-spec-unattended.md` has no README or docs wording, and `tests/setup-test.sh:593-601` reads this checkout's section live and asserts the phrase "gate step 10, Docs" survives a merge, which the edit keeps.

## Inventory

The references to README sections outside the README, each with its disposition, are listed under Context in `plan.md`. In short: four expensive references (the CLAUDE.md template and `RUN_LINE` naming "Git rules for Redline agents"; the handoff's `README.md#known-limits`; `tests/guard-cases.tsv:301`; unattended point 11) point at sections that stay; one (the `checks.sh` header sentence) goes stale by a hop and is kept; the rest are cheap and move in Task 5.

## Walkthrough log

Task 9, done on 2026-11-04 by @michaelwitwicki on `fromtheoutfit/redline-walkthrough`, a private scratch repository with stock Agent OS, `composer test` as `php -l`, the plugin loaded with `--plugin-dir` from this checkout, following `README.md` and `docs/setup.md` literally and then a `dry run review only`. Each line: what the doc did not say or the tool contradicted, and the fix made in the doc, never by telling the reader.

1. **The install dirties the tree.** `claude plugin install redline@redline --scope project` (README "Install", `docs/setup.md` "Install") writes `.claude/settings.json`, and neither said to commit it; `/redline:setup`'s preflight (`skills/setup/SKILL.md` step 2, `git status --porcelain` must print nothing) then stopped on it as a blocker. Fix: the README's Install sentence and Quick start step 1, and `docs/setup.md` "Install", "Run `/redline:setup`" and step 1, say to commit that file before setup, which needs a clean tree. Chosen over making setup take the file onto its branch, which is a skill change outside this spec.
2. **Stock Agent OS has no Verification Gate task.** Setup stopped at step 3 (`redline-gate.sh extract` exits 1 with no "verification gate" heading over a numbered list) and the person added a gate by hand before it would go on; `docs/setup.md` named the gate only in Requirements. Fix: a new section "The gate task" before "Run `/redline:setup`" says a gate task is required today, shows the minimal one (the heading, a numbered list, one command step, the standards-retrospective step) with the fill-ins it yields for step 10 (`--gate-steps 1-1 --prose-steps "2" --retro-step 2`), and cites #70, which makes the gate optional. The minimal section was checked against both tools in the scratchpad: `redline-gate.sh extract` prints two steps and `redline-setup.sh unattended` inserts the section with those fill-ins. The README's Requirements line and step 3 of `docs/setup.md` point at it.
3. **What a dry run leaves for the next run.** The review-only summary said the next `/redline <pr>` starts with the four findings; an earlier dry run on 2026-10-28 had shown a real run starting from scratch. The workflow decides it: `firstRound` and `priorFindings` come from `redline-gh.sh last-round` and `prior-findings` (`skills/redline/SKILL.md` precheck steps 8 and 9), which read the posted reviews, and a dry run posts none, so the next run starts at round 1 with nothing carried. Fix: `docs/running.md` "Launching a run" says so, qualifies the review-only path to a posted round, and "Earlier rounds" says a dry run is never one. The summary line itself was the contradiction, so `skills/redline/SKILL.md`'s `review-only` paragraph (line 167) gains the dry-run case: nothing reached GitHub, a later run starts at round 1 and carries nothing, the review is the record under the spec folder. The one edit outside the docs; it is in commit 8 and has a Docs entry.
4. **The dry run's commits.** The dry run committed its record locally (the review-only path commits its record, #10; `commitRecord` with `push` false says "this is a dry run") and pushed nothing; `docs/running.md` said only that a dry run posts and pushes nothing. Fix: "Launching a run" says the commits stay on the local branch, unpushed, and that a `dry run review only` leaves exactly one commit, the record; "The run record" says the same in one clause.
5. Everything else in `docs/setup.md` matched the questions setup asked, in their order. No path named in the docs was missing.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** roadmap Phase 1; the roadmap gains item 9, public docs (#14), and `tech-stack.md`'s "its README only" becomes "its README and `docs/`". Phase 2 (#1 to #3) is untouched.
- **Open issues checked:** #14 is the only docs issue. #66 (guard protection by the repository's manifest) is cited as open where `docs/guard.md` describes the self-hosted rules.

## Standards retrospective

Presented with AskUserQuestion at the gate on 2026-11-03; approved as proposed, all four, decided by: @michaelwitwicki. Applied, for their own commit: `agent-os/standards/process/internal-notes.md` (the long-form documents bullet), `agent-os/standards/process/docs-gate.md` (the title line, bullets 1, 4 and 6, two new bullets), `agent-os/standards/scripts/bash-conventions.md` (the header bullet and the search list), `agent-os/standards/index.yml` (two descriptions). Items reviewed: the fourteen decisions (docs-gate and internal-notes now carry 2, 6, 9 and 14; the rest are already in release, attribution and the issue), the As built deviations in `plan.md` (presentation choices inside the README, no rule), and the one red run during the build (none: the gate was green on its first run after the restamp). The edits as proposed:

- `agent-os/standards/process/internal-notes.md`, the second bullet: "`README.md` is the only long-form document here ..." → "`README.md`, `docs/` and `CONTRIBUTING.md` are the long-form documents here: the README for installation and use (what it is, requirements, install, quick start, the dials, the Files table, the git rules for agents, Known limits), `docs/` for the reference (setup, contract, running, guard, upgrading, scripts), `CONTRIBUTING.md` for CI, the Docs step and releases. A rationale goes to the internal repository; a rule goes to a standard (#14)".
- `agent-os/standards/process/docs-gate.md`: the title line and bullets 1, 4 and 6 read "the README section, or the `docs/` file and section (and template, if any)"; two new bullets: "A section the setup template or the workflow names by heading (`Git rules for Redline agents`, `Known limits`, from `templates/claude-md-git-sentence.md` and `workflows/redline-loop.js`) stays in the README under that heading: moving it is a template change, a minor bump and a rerun in every repository; the `checks.sh` header's 'See README.md for the output contract' is the same kind, kept until the next `checks-template.sh` bump (#14)" and "A change to `docs/` is reader-facing by nature and needs no Docs entry; a file under `scripts/` whose header `docs/scripts.md` quotes names `docs/scripts.md` in its entry when the header changes (#14)".
- `agent-os/standards/scripts/bash-conventions.md`, the header bullet: "The README quotes from it rather than restating it" → "`docs/scripts.md` quotes it verbatim and `docs/contract.md` carries the output contract, so a header change updates `docs/scripts.md` and a contract change updates `docs/contract.md` in the same commit"; the next bullet: "across `README.md`, `skills/` and `agents/`" → "across `README.md`, `docs/`, `skills/` and `agents/`".
- `agent-os/standards/index.yml`: the `docs-gate` and `internal-notes` descriptions follow their new first lines.
- `agent-os/standards/process/release.md`: no change; the patch bump is already the rule.

After the walkthrough (Task 9, 2026-11-04): no further standards changes. The four fixes are doc wording and one skill sentence, covered by docs-gate as it now reads. One candidate was considered and declined by @michaelwitwicki on 2026-11-04: a rule in docs-gate that a reader-facing doc change is walked on a scratch repository before its gate (the done-when of decision 8). Not applied; the walkthrough stays a per-spec done-when, not a standard.

## Standards Applied

- process/docs-gate — the spec changes the step itself and names a section or a reason for every touched file under `skills/`, `agents/` and `.claude-plugin/`
- process/internal-notes — the public repository's long-form documents change shape; the standard is updated to say so
- process/release — a patch bump, no template change
- process/standards-retrospective — the proposed edits above, in their own commit
- scripts/bash-conventions — the header is the documentation and `docs/scripts.md` quotes it; a change rewords every description across the README, `docs/`, `skills/` and `agents/`
- testing/tests — the gate's backticked text changes, so the restamp is in the same commit and the gate test's last case proves it
- prompts/attribution — the new documents name Redline only
