# PR #94 review round 6: the kept result and the verdict call — Shaping Notes

Shaped by Redline in unattended mode, for review round 6 of PR #94 (issue #93, with #68 on the same branch), from the round's ten findings (`redline/round-6-review.json`, `redline/round-6-findings.json`). Line numbers are at `9d22ff8`, the PR head this round reviewed, the snapshot's `start_sha` and the working tree's HEAD; only this spec folder is untracked.

## Scope

The round's ten findings, nothing more. Seven are in `scripts/checks-template.sh`, the template #68 moved to v3 on this branch; three are in `workflows/redline-loop.js`.

- `fix`, three: R6-10 (Task 6), R6-5 (Task 7), R6-9 (Task 8, a small refactor).
- `defer`, four, each mitigated by a line under Known limits in `README.md`: R6-2 (Task 2), R6-4 (Task 3), R6-7 (Task 4), R6-8 (Task 5).
- `decline`, three: R6-1 (refuted on the second look), R6-3, R6-6.
- No `ask`. No finding touches one of Redline's own files (`.claude/redline*.json`, `.claude/settings*.json`, `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`), and the invoking prompt lists no repository ask rules.

Every finding in `scripts/checks-template.sh` has its fix below the template's header (the header ends at line 49, the stamp line), so none of them can be a `fix` in a Redline run (Unattended answer 7). Nothing this round plans touches the template, `checks.json`, `checks.sh`, the gate's backticked text or anything under `templates/`, so nothing needs a regeneration, a restamp or a version bump.

## Unattended answers

1. **Scope.** The ten findings above. Evidence: the invoking prompt's findings JSON and point 6 of the unattended section ("Scope is the round's findings, nothing more").
   Decided by: redline
2. **Visuals.** None; the findings are about a shell script and a workflow script.
   Decided by: redline
3. **References.** `scripts/checks-template.sh` (the kept result, lines 86-126 and 473-509; the budget comment, 139-176; the git block, 424-462), `workflows/redline-loop.js` (`run()` and `stageError`, 478-529; `checkerCommand`, 1834; `verdictCommand`, 1926; `checker()`, 2944-2971; `stopReason`, 2120-2140; the round's commits, 3240-3250; `replyBody`, 1314; the handoff's Commits list, 3457-3459), `tests/loop-test.mjs` (the mock's checker and implementer, 200-248; the verdict section, 856-934), `agents/redline-checker.md`, `docs/contract.md` (Output contract and Exit code), `README.md` (Known limits), and #68's spec, `agent-os/specs/2026-11-15-0730-68-gate-result-sized-for-the-workflow/shape.md`. Listed in `references.md`.
   Decided by: redline
4. **Product context.** `agent-os/product/mission.md:14`, "Fixes go through the repository's own planner ... run the repository's gate (`.claude/redline/checks.sh`)": the gate's answer must reach the workflow, which is what R6-8 and R6-10 are about. No roadmap item moves.
   Decided by: redline
5. **Standards.** `workflow/agents` (line 44, the label a call made on a step's behalf hands back), `testing/tests` (line 15, a stage error pinned by its `resumeFrom` label; line 32, red before green), `scripts/bash-conventions` (line 45, a cut of text the workflow matches; line 46, a result kept outside the tree), `scripts/guard` (line 9, a template finding is deferred to a person), `process/docs-gate`, `process/release`, `prompts/attribution`. Copied in `standards.md`.
   Decided by: redline
6. **Where the kept result lives is the author's decision.** #68's `shape.md`, decision 5: "Outside the working tree, at `${TMPDIR:-/tmp}/redline-checks/<root key>-<head sha>.json`, keyed by the repository's root and the commit it was produced at, overwritten by each run ... Decided by: the author (rider on decision 4)." So moving the file under the git directory, which R6-1 proposes and R6-2 offers as an alternative, would undo a recorded decision; the in-place hardening R6-2 also offers keeps it.
   Decided by: redline
7. **A fix below the template's header is a person's, not the run's.** Point 11 of the unattended section: "So is a finding whose fix touches `scripts/checks-template.sh` below its header ... It is `defer`, mitigated by a line under Known limits in `README.md` naming the finding; its entry under `## Deferred` records the intended lines, and a person makes the change, regenerates `checks.sh` and restamps after the run." `agent-os/standards/scripts/guard.md:9` says the same. So R6-2, R6-4, R6-7 and R6-8 are `defer`, and R6-3 and R6-6, which I would not act on anyway, are declined with that as where they belong.
   Decided by: redline
8. **The verdict's stop names the check's label.** `docs/contract.md:88`: "The stop names the check's own label, never the verdict's, so a resume runs the gate again". #68's deviation 19: "`checker()` sets `lastLabel` to the check's label after the verdict call instead, which covers both sites and any added later." `agent-os/standards/workflow/agents.md:44`: a call made on a step's behalf "hands the label back, so a stop that follows resumes at the step". The code disagrees when the verdict call itself fails (R6-10), so the disagreement is the finding to fix.
   Decided by: redline
9. **The subject cut is for the workflow, not for a person.** #68's `shape.md`, decisions made before shaping: "Size the result for what the workflow reads, not for a person." Decision 2 cuts the subject so that `judge()` still finds every id. Neither says replies or the handoff should quote the cut form; before #68 they quoted the whole subject. So R6-5 restores the whole subject in posted text and leaves what the workflow matches on as it is.
   Decided by: redline
10. **`unexpected_files` and `uncommitted` stay whole in stdout.** #68's `shape.md`, decisions made before shaping: "The git block gives counts for allowed and changed files and keeps `unexpected_files` and `uncommitted` in full." R6-3 does not ask to change that; it asks about the verdict's form, and is declined on cost and placement (Decision 6).
    Decided by: redline

## Decisions

1. **R6-1: decline, refuted on the second look.** The verifier's line on what would confirm it: one spilled check in a real run with a v3 `checks.sh`, or the checker printing `TMPDIR` in both calls. No run can be made from here, and the checker's own environment cannot be observed. What I could check: this shaper is a separate agent call of the same run, and `printenv TMPDIR` prints `/var/folders/l4/jz4g7psj5h1gxvk_6zp29rvm0000gn/T/`, the value the reviewer saw; its `redline-checks/` holds the kept file `27c34aec...-81ca5d33....json` written at 08:09 by the build's gate run in the person's session. So two agent calls of this run and the session share one `TMPDIR`: an agent call inherits the session's environment and gets none of its own, and the checker is spawned the same way. The claim's premise does not hold for any agent call that can be observed. Even if it held, the run would stop at `check` as on `main` (the finding says so), and the proposed fix would undo #68's decision 5 (Unattended answer 6).
   Reason posted: refuted: the reviewer and the shaper, two separate agent calls of this run, both see the session's TMPDIR and the kept file the build's gate wrote there, so agent calls inherit the session's environment rather than getting their own; moving the file would also undo #68's decision 5 on where it lives.
   Decided by: redline
2. **R6-2: defer.** Confirmed: `kept_dir` is `${TMPDIR:-/tmp}/redline-checks` (lines 98-99), created by `mkdir -p` with the default umask (480) and written without a mode (498-503); the kept file here is `-rw-r--r--` in a `drwxr-xr-x` directory, and nothing checks the directory's owner or mode. The full fix is in the template below its header (Unattended answer 7). The clear pick among the finding's options is the in-place hardening, which keeps #68's decision 5; the git-directory option would undo it (Unattended answer 6), so no decision is needed and this is not a judgment call. Mitigation, Task 2: a Known limits bullet in `README.md` naming R6-2 and telling a shared-host user to set `TMPDIR` to a private directory before launching. Proportionality below.
   Decided by: redline
3. **R6-4: defer.** Confirmed here: `printf '\351%.0s' {1..5120} | jq -n -c --rawfile s /dev/stdin '{s: $s}' | wc -c` prints `15363` with jq 1.8.2, so a byte that is not valid UTF-8 encodes as three, and the comment at lines 167-168 ("adds a byte to each newline, tab, quote and backslash and nothing to any other byte") and the 22,960 figure (166) are wrong for such output; `docs/contract.md`, "The budget", repeats the figure. The fix is in the template below its header (Unattended answer 7). Mitigation, Task 3: a Known limits line naming R6-4.
   Decided by: redline
4. **R6-7: defer.** Confirmed by reading: when the directory cannot be written, `kept` is emptied (480-483) and the removal and the write both sit inside `if [[ -n "$kept" ]]` (496-504), so an earlier file for this root and HEAD stays, and `--verdict` (105-125) checks only its mode and snapshot. The comment at 478-479 says "a --verdict after it finds nothing", which the code does not keep. The fix is in the template below its header. Mitigation, Task 4: a Known limits line naming R6-7.
   Decided by: redline
5. **R6-8: defer.** Confirmed by reading: the `rm -f`, the `jq ... > "$kept.part"` and the `mv` (497-503) run under `set -euo pipefail` (51) before `cat "$work/printed.json"` (506), so a failure there ends the script with no JSON, against #68's deviation 16 ("Keeping the result must never cost the gate its answer"). The fix is in the template below its header. Mitigation, Task 5: a Known limits line naming R6-8.
   Decided by: redline
6. **R6-3: decline.** Confirmed: `--verdict` (124) drops only the checks' output and keeps the git block's lists whole. The failure needs several hundred paths outside the plan or left uncommitted (about 600 of 50 bytes), which fail the round's gate anyway, and the stop that follows is the one `docs/contract.md` documents ("When the verdict gives nothing (... a verdict the tool could not show either), the run stops at `check` as before"). `stopReason`'s text (`workflows/redline-loop.js:2130`) names what the verdict call said before the sentence about a template before v3, so the stop is not silent about the cause. The change is to the template's `--verdict`, which only a person can make and regenerate (Unattended answer 7). A nit, not worth a Known limits line.
   Reason posted: it needs several hundred paths left outside the plan or uncommitted, a round whose gate fails anyway, and the stop that follows is the one docs/contract.md documents; the change is to the template's --verdict, which only a person can make and regenerate, so it belongs in a person's next change to the template.
   Decided by: redline
7. **R6-5: fix.** Confirmed: `roundCommits` takes `message` from the git block (`workflows/redline-loop.js:3248`), which a v3 `checks.sh` cuts at 100 characters, and `replyBody` (1316) and the handoff's Commits list (3458) post it as written; 11 of this pull request's subjects are over 100 characters. Change: a display-only `subject` on each round commit, the whole first line of the message the implementer reported for that commit when git's subject was cut and that line opens with the part the cut kept, else git's subject; the reply and the handoff quote `subject`. `message` stays git's, so `judge()`, `outcomesFor`'s id match (2604) and every other matcher read what they read today. Unattended answer 9. Plan Task 7.
   Decided by: redline
8. **R6-6: decline.** Confirmed: two `jq -n` calls over the same slurped files (449-462) and two `git log` runs over one range on a first round (425-426). It is a refactor with no behaviour change, its cost is one extra `jq` and one extra `git log` a run, and #68's deviation 14 already keeps the verdict from disagreeing with what the run printed. It is in the template below its header, which no Redline role may regenerate (Unattended answer 7).
   Reason posted: a refactor with no behaviour change, costing one extra jq and one git log a run, where #68's deviation 14 already keeps the verdict from disagreeing with what the run printed; it is in the template below its header, which no Redline role may regenerate, so it belongs in a person's next change to the template.
   Decided by: redline
9. **R6-9: fix, a small refactor.** `verdictCommand` (1926-1928) rebuilds the string `checkerCommand` (1834-1836) builds. The four tests hold: behaviour unchanged (the same string for every flag; the loop checks at `tests/loop-test.mjs:905`, `927` and `931` pin it and no expectation changes); inside the pull request (`workflows/redline-loop.js` is in its diff); code the pull request wrote (`verdictCommand` was added by #68 on this branch; `checkerCommand` is on `main` at line 1677 and is only called); one idea, a one-line body. Plan Task 8.
   Decided by: redline
10. **R6-10: fix.** Confirmed by reading: `run()` sets `lastLabel = opts.label` (519) before the call and builds its stage error from `lastLabel` when the agent returns nothing (526-528, 482-483), and `checker()` resets `lastLabel` only after the verdict call returns (2962-2963), so a verdict call that returns nothing stops the run with `resumeFrom` `check r<n> verdict`. That contradicts `docs/contract.md:88` and `workflow/agents.md:44` (Unattended answer 8). Change: the verdict call's error carries the check's label, and the reset runs in a `finally`. The loop mock gains a way to make one label's call return nothing (`scenario.nothing`), and one check pins the stop at `{label: 'check r1', attempt: 2}`. Plan Task 6.
    Decided by: redline

### Proportionality

- **R6-2.** Likelihood: needs a multi-user host with `TMPDIR` unset, usual on Linux, never on macOS, whose per-user `TMPDIR` is `drwx------`. Reading the kept files needs only another local user; replacing one needs a hostile one who creates `/tmp/redline-checks` first and swaps the file inside one agent round trip, and it changes the outcome only on a spill, when the verdict is read. Impact: the kept file holds every check's command, the last 200 lines of each stream, every changed path and every commit subject, so a private repository's details are readable on that host; a swapped file makes a failing gate read as passing. Cost of the full fix: about ten lines in the template below its header, a setup-test case, a regenerated `checks.sh` and a restamp, which no role may do. The mitigation, a documented `TMPDIR` setting, removes the exposure for anyone who follows it. Defer.
- **R6-4.** Likelihood: failing checks whose kept tails are mostly bytes that are not UTF-8 (Latin-1 or binary output), at the stated scale; never seen in this repository's output. Impact: the stated 25 KB worst case can reach about 28 KB; under the Bash tool's inline limit nothing changes, and over it the workflow reads the verdict, which carries no check's output. Cost: the template below its header plus a setup-test case. Defer, with a Known limits line.
- **R6-7.** Likelihood: the kept directory must lose its write permission between an earlier run and the checker's run at the same HEAD, and the checker's result must spill; no Redline role can cause it (the guard refuses `chmod` and `ln`). Impact: a verdict reads an earlier run's result as this run's, which can pass a round whose own check failed. Cost: the template below its header. Defer, with a Known limits line.
- **R6-8.** Likelihood: a full temp filesystem between the work files and the kept file (about 1.5 MB at most), a concurrent `checks.sh` run for the same root, or an entry in a shared kept directory this user cannot remove. Impact: the script prints nothing and the run stops at `check` with a gate that passed, resumable. Cost: the template below its header plus a setup-test case. Defer, with a Known limits line.
- **R6-10.** Likelihood: the verdict call must return nothing (skipped, stalled on every attempt, or an API error) after a spilled check, both rare. Impact: the resume replays the spilled check and reruns only the verdict; if a hand commit under `.claude/` moved HEAD, the verdict exits 2 and the run stops a second time, costing a relaunch. Cost: about eight lines in `checker()`, one mock option and one check, all in files the pull request changes. Fix.

## Declined

- **R6-1.** refuted: the reviewer and the shaper, two separate agent calls of this run, both see the session's TMPDIR and the kept file the build's gate wrote there, so agent calls inherit the session's environment rather than getting their own; moving the file would also undo #68's decision 5 on where it lives.
- **R6-3.** It needs several hundred paths left outside the plan or uncommitted, a round whose gate fails anyway, and the stop that follows is the one docs/contract.md documents; the change is to the template's --verdict, which only a person can make and regenerate, so it belongs in a person's next change to the template.
- **R6-6.** A refactor with no behaviour change, costing one extra jq and one git log a run, where #68's deviation 14 already keeps the verdict from disagreeing with what the run printed; it is in the template below its header, which no Redline role may regenerate, so it belongs in a person's next change to the template.

## Deferred

Each full fix is in `scripts/checks-template.sh` below its header. A person makes it after the run, then regenerates this repository's `checks.sh` (`scripts/redline-setup.sh checks .claude/redline/checks.json .claude/redline/checks.sh`), restamps if the gate's text moved, adds the setup-test case named, and removes the finding's Known limits line. Whether the template marker moves to v4 is the person's call: the PR already carries v3 unreleased.

- **R6-2. Mitigation:** the Known limits bullet (Task 2). **Full fix:** create the kept directory private and refuse one that is not, keeping nothing in that case, and write the file private. The intended lines, replacing 480-483:

  ```bash
  if ! mkdir -m 700 -p "$kept_dir" 2>/dev/null || [[ ! -O "$kept_dir" || ! -w "$kept_dir" ]] \
      || [[ -n "$(find "$kept_dir" -maxdepth 0 -perm -g+w -o -maxdepth 0 -perm -o+w 2>/dev/null)" ]]; then
      log "the result is not kept: $kept_dir is not a private directory of this user's"
      kept=""
  fi
  ```

  and the kept write under `umask 077` (a subshell around lines 497-503). `--verdict` refuses a kept directory that fails the same test (exit 2), so it never reads a file another user could have placed. Setup-test cases: a kept directory of mode 0777 keeps nothing and its verdict exits 2; a new kept directory is 0700 and its file 0600. The same class predates this pull request in `scripts/redline-background.sh` (lines 67-92, `${TMPDIR:-/tmp}/redline-background/`), outside this diff; a follow-up issue covering both is the person's to open. When it lands, `agent-os/standards/scripts/bash-conventions.md:46` gains "in a directory only its user can write, created 0700 and refused otherwise".
- **R6-4. Mitigation:** a Known limits line (Task 3). **Full fix:** make every kept byte encode to at most two: in `plain` (184-187), after the `tr`, drop bytes that are not valid UTF-8 (`| iconv -f UTF-8 -t UTF-8 -c`, available in macOS's libiconv and in glibc), and say so in the comment at 167-168; or keep the bytes, correct the factor to three and lower `budget` so 600 + 960 + 12 x 350 + 3 x budget + 40 x 174 stays under 25,000 (budget at most 4,413). Setup-test case: the worst-case run with Latin-1 output stays under 25,000 bytes. `docs/contract.md`, "The budget", follows.
- **R6-7. Mitigation:** a Known limits line (Task 4). **Full fix:** `--verdict` exits 2 when the kept directory is not writable (or fails R6-2's test), with `checks.sh: the kept result may predate the last run: <dir> cannot be written; run the gate again`, since a run that could not keep its result could not have replaced the file either; the comment at 478-479 says so. Setup-test case: a kept file at HEAD in a directory made read-only after the run is refused by `--verdict`.
- **R6-8. Mitigation:** a Known limits line (Task 5). **Full fix:** keeping is never fatal. Lines 496-504 become

  ```bash
  if [[ -n "$kept" ]]; then
      if ! { rm -f "$kept_dir/$root_key-"* && jq -n -c ... > "$kept.part" && mv "$kept.part" "$kept"; } 2>/dev/null; then
          log "the result is not kept: writing $kept failed"
          kept=""
      fi
  fi
  ```

  with `printed.json` written after this block, so `kept` names a file only when the move succeeded, and `cat "$work/printed.json"` reached in every case. Setup-test case: a run whose `.part` path is a directory still prints its JSON with `kept` empty and exits with the checks' code. When it lands, `bash-conventions.md:46` gains "keeping it is never fatal: a failed write leaves `kept` empty and the result printed".

## Standards retrospective (proposed)

Done against the decisions above. The deferred findings land no standard now: a rule the template does not follow yet would contradict it, so each Deferred entry names the line a person adds with the fix.

Already in a standard, no edit:

- A template finding is deferred to a person with a Known limits line (`scripts/guard.md:9`): R6-2, R6-4, R6-7, R6-8.
- A stage error is pinned by its `resumeFrom` label (`testing/tests.md:15`): Task 6's check.
- A bug fix lands red before green (`testing/tests.md:32`): Tasks 6 and 7.
- A refactor needs no new check when its neighbours pin the behaviour: the small-refactor rule in the unattended section, Task 8.

Proposed edits:

1. `agent-os/standards/workflow/agents.md`, line 44 (the `stageError` bullet). Replace the closing "(#68)" with: "(#68), and so does that call's own failure: `run()` builds the stop from the label it was called with, so the call's stage error is given the step's label before it is thrown (#94, R6-10)".
2. `agent-os/standards/testing/tests.md`, line 15 (the `resumeFrom` bullet). Append: "; a call that returns nothing is scripted with the mock's `scenario.nothing` (a list of labels), since no per-agent override can return null through the mock's fallback, and the stop it causes is pinned by its label too (#94, R6-10)".
3. `agent-os/standards/scripts/bash-conventions.md`, line 45 (the cut bullet). Append: "Text posted for a person (a reply, the handoff's Commits list) is not taken from the cut: the workflow quotes the whole subject the implementer reported for the commit when it opens with the part the cut kept, and matches only on git's own text (#94, R6-5)".

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** Unattended answer 4.
- **Run caution (#81), noted for the person, not a decision.** Tasks 6, 7 and 8 commit changes to `workflows/redline-loop.js`. A relaunch runs the script the run launched with, so this run's later rounds are unaffected; the next launch runs the new one. No agent file changes.
- **A follow-up, noted for the person, not a task.** The four deferred template fixes and R6-3 and R6-6 are one person-made change to `scripts/checks-template.sh` followed by a regeneration and a restamp; `scripts/redline-background.sh` shares R6-2's class outside this diff.

## Standards Applied

- workflow/agents — line 44: the label a call made on a step's behalf hands back, which R6-10 extends to that call's own failure.
- testing/tests — line 15: a stage error pinned by its `resumeFrom` label; line 32: red before green.
- scripts/bash-conventions — line 45: a cut of text the workflow matches (R6-5); line 46: a result kept outside the tree (R6-2, R6-7, R6-8).
- scripts/guard — line 9: a template finding is deferred to a person with a Known limits line.
- process/docs-gate — each touched plugin file names its section in the plan.
- process/release — the version stays 0.3.0: the pull request already bumps the minor version and #68's spec keeps it on purpose; nothing this round changes what a setup rerun writes.
- prompts/attribution — nothing posted or committed carries a model or vendor name.
