# Standards for PR #108 Review Round 4

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `8bad058`, before this round's retrospective. For a long file, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did.

---

## workflow/agents (applied bullets)

Line 7 (in part, its opening; R4-4 reads the workflow's own error from the resume entry, not an agent's text):

- The reviewer, the shaper, both approvers and the checker return JSON, not prose, and the workflow reads fields, never text (the coverage pass's relay of a skill's text is the one exception, below). [...]

Line 16 (in part, its opening and the comment clause; R4-1, R4-4, R4-6, R4-9):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted, and every other wording of the same rule (`not raised again`, `raises it again`) [...]; and a rule the prompt states only on some rounds (with candidates) is stated with the same condition wherever it is restated [...]; and a comment in the workflow that restates the rule is changed with it: the shape schema's comment on `reason` still said a decline names where the finding belongs, the rule before #95, until #97, R4-2 [...]

Line 24 (whole; R4-2):

- Every agent's `error` is normalized once, as `run()` returns the result: `""`, `''` and `null` are empty and the text is trimmed, so a call site reads `.error` as it is, and a new call cannot stop a run on `'""'` as Losers League #790 did at Finish. The run record's `detail.checker` keeps the normalized text, beside the status, reason and partial result #9 keeps it for (#42; #43, R1-1); and a decision's `disposition` at intake is read the same way: an empty or null one is dropped from the run's copy of the decision, so every reader, the resolve prompt included, sees none, where the intake check refused it and a relaunch after a hand-off threw before any agent ran, until #108, R3-1

Line 36 (whole; R4-4's likelihood):

- An error result names the agent label that caused the stop (`resumeFrom`), and the skill writes a marker through `redline-prefs.sh run save`; a resume is the person's choice at the next launch, never a retry by the skill or the workflow, and a `gather` error is not resumable (#10)

Line 39 (in part; R4-7):

- A list posted under an outcome's heading is read off each finding's final outcome, never off a list an agent returned beside the dispositions: [...] and a disposition the person changes away from defer drops the shaper's entry, and the resolve agent's entry beside it, with a warning: one stayed in the list the plan approver and the implementer were shown, though no longer filed, until #103, R2-8 [...]; a call's decision names none, and is read from what the resolve agent states it ends in, `fix`, `defer` or `accept`, never from the entry or the task beside it, so an entry beside a call stated as a fix or as accepted is dropped with a warning, as beside an override [...]

Line 46 (in part, its opening; R4-1's stop):

- A fact an agent states that changes what the run does is checked by the workflow against something the run itself recorded, and a claim it cannot honour is cleared with a warning before anything is posted; it is never trusted on its own and never inferred. [...]

---

## workflow/replay (applied bullets)

Line 19 (in part, its opening and its last clause; R4-4):

- A resume after an error changes exactly one prompt: `run()` appends a resume line to the agent label the error result's `resumeFrom` names (`args.resume`), so every prompt before it replays and that agent and all after rerun; a cached result the script rejected replays unchanged on a plain relaunch, which is why the line exists. [...]; and a step whose stop is the workflow's own check of what that step returned is told so in its resume line, as the shaper is told to rewrite its folder: the resolve agent's rerun after a resolve-time stop was told only that the person had fixed the cause by hand, beside a `plan.md` its first attempt had already decided, until #108, R3-4

Line 23 (whole; R4-5, R4-9):

- A new ask in a prompt sits in the block that only the calls it concerns carry, and nowhere else in that prompt, so a call it does not concern keeps a byte-identical prompt and still replays after an update. The schema requires the new key, and the workflow reads an absent one as empty wherever an unchanged prompt can replay an older result. The prompt states the whole ask, so the answer does not depend on the agent file the session loaded, and the agent file gains the ask and changes no other rule, so an older script reading a newer agent's output behaves as it did (#99, `decided` in the resolve prompt's calls block)

---

## testing/tests (applied bullets)

Line 14 (whole; every new check reads an absent result as empty):

- A check fails, it does not throw, when the run it reads took another path: a prompt or a body that may be absent is read as `''`, so a red run reports its count. A `TypeError` in one check hides every check after it (#93). A list that may be absent is read as `[]` for the same reason, and a mutation run that prints no count crashed: it is reported as a crash, and the scenario that threw is found before the mutation is called pinned (#95)

Line 28 (in part, its opening; R4-4's neighbour):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; [...]

Line 33 (whole; R4-4's red run and its source check):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54); a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on (#99, a real 'Mitigate' answer, which the old inference already filed)

---

## process/docs-gate

Applied as the gate's step 10 states it: one Docs entry per plugin file a task adds or alters under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, naming the README or `docs/` section and its commit or "no reader-facing change" with the reason; a `docs/` change needs no entry of its own.

---

## process/release

Line 5 (in part, its opening):

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes [...]; major for a contract change a rerun cannot carry; patch otherwise. [...]

The pull request bumped to `0.4.2` once; this round adds no bump.

---

## prompts/attribution

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. [...]
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
