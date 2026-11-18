# Standards for PR #108 Review Round 3

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `da09090`, before this round's retrospective. A short file is copied whole. For a long one, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did.

---

## workflow/agents (applied bullets)

Line 15 (whole; R3-5):

- A message the run shows the person says when it fires in the words of the decision behind it, so a fix that widens or narrows the condition rewords the message and the loop checks that pin it in the same commit: R1-3 let the checker-text warning fire on a round whose gate exited 1, and it still said 'on a passing gate' next to 'still failing, as at baseline' (#37, R2-1)

Line 16 (in part, its opening; R3-4):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted, and every other wording of the same rule [...]

Line 24 (whole; R3-1):

- Every agent's `error` is normalized once, as `run()` returns the result: `""`, `''` and `null` are empty and the text is trimmed, so a call site reads `.error` as it is, and a new call cannot stop a run on `'""'` as Losers League #790 did at Finish. The run record's `detail.checker` keeps the normalized text, beside the status, reason and partial result #9 keeps it for (#42; #43, R1-1)

Line 36 (whole; R3-4):

- An error result names the agent label that caused the stop (`resumeFrom`), and the skill writes a marker through `redline-prefs.sh run save`; a resume is the person's choice at the next launch, never a retry by the skill or the workflow, and a `gather` error is not resumable (#10)

Line 38 (in part, the one-reader clause; R3-6):

- A finding's id is unique in its round: [...] a coverage ref's leading id is read by one function wherever the workflow reads it (`leadingId`, for the rename in `review()` and for `accountCoverage`), and a duplicate's target index by one (`duplicateTarget`) [...]

Line 46 (in part, its opening; R3-3's second layer):

- A fact an agent states that changes what the run does is checked by the workflow against something the run itself recorded, and a claim it cannot honour is cleared with a warning before anything is posted; it is never trusted on its own and never inferred. [...]

---

## workflow/replay (applied bullets)

Line 10 (whole; R3-2):

- Every item a stop hands back is one the skill asks about and counts in `decisionsNeeded`: an override the resolve agent could not apply comes back as `overridesUnresolved` with its why, for the person to restate, since a stop with nothing to ask relaunches with the same args and replays the same refusal every time (#94, R4-8); a field a stop adds to the result is named in `relaunch.how` in the same commit, with what the relaunch passes for it, since a session reading the note would otherwise send the refused decision back unchanged (#94, R5-4); and the skill section that presents and records the new field lands in that commit too, since a stop the skill cannot answer relaunches into itself (#95, `drafts` and `draftsNeeded`)

Line 19 (in part, its opening; R3-4):

- A resume after an error changes exactly one prompt: `run()` appends a resume line to the agent label the error result's `resumeFrom` names (`args.resume`), so every prompt before it replays and that agent and all after rerun; a cached result the script rejected replays unchanged on a plain relaunch, which is why the line exists. A hand commit's paths join `approvedPaths` at that label, never at startup, so the cached snapshot prompt stays byte-identical (#10). [...]

---

## testing/tests (applied bullets)

Line 7 (in part, its opening; R3-1, where the dropped key keeps the resolve mock reading as the agent does):

- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7; #37, R1-1); [...]

Line 13 (in part, its opening; R3-1's two values):

- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site: #42's fix covered nine checks and scripted `'""'` at one, so a revert at the other eight stayed green (#43, R1-1) [...]

Line 14 (whole; every new check reads an absent result as empty):

- A check fails, it does not throw, when the run it reads took another path: a prompt or a body that may be absent is read as `''`, so a red run reports its count. A `TypeError` in one check hides every check after it (#93). A list that may be absent is read as `[]` for the same reason, and a mutation run that prints no count crashed: it is reported as a crash, and the scenario that threw is found before the mutation is called pinned (#95)

Line 15 (in part, its opening; R3-3, R3-4):

- A stage error is pinned by its `resumeFrom` label as well as its text, since the label is what a resume reruns [...]

Line 28 (in part, its opening; every task with a check):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; [...]

Line 33 (whole; every task with a check):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54); a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on (#99, a real 'Mitigate' answer, which the old inference already filed)

---

## process/docs-gate (applied bullets)

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)
- A behaviour a spec records as unmeasured is stated as expected, never as fact, everywhere a reader meets it (the README, `docs/`, a line the skill says), and README Known limits lists every case of it [...] (Task 5's `docs/running.md` clause says what the rerun is told, which the prompt states, not what the rerun does, which is unmeasured)

---

## process/release (applied bullet)

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet) [...]

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
