# PR #127 by hand: every new key states its place — Shaping Notes

## Scope

A by-hand follow-up on the branch of pull request #127 (template v6: #105, #75, #126), before a fresh Redline run on it. It is not a close-out.

The self-review of #127 stopped twice at `shape r2`. A real shaper sorted R2-1 and R2-2 as sweeps and returned `swept` beside `cause` on the finding, where the schema and `checkCauses` read `cause.swept`. This spec fixes that instance everywhere it is stated, then settles its class: every key #127 added that sits inside another object or beside one, against every place that states it, with what the workflow does when a result puts it one level out.

R2-2 is fixed here, since it changes the same return example (decision 3). R2-1 and R2-3 to R2-7 are out of scope and the fresh run carries them. Also out of scope: #128, #104, #119, #115, #109. `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` and the Verification Gate's text are not touched.

## What the shaper returned

Read from this project's workflow records for run `wf_6478a046-32b` (the launching session's `workflows/` folder: the run record, its six saved launches, the journal, and each agent's transcript).

`shape r2` ran three times:

| Launch | Agent | Prompt | Outcome |
|---|---|---|---|
| 4 | `a072e6aaccbc75715` | the first shape of round 2 | no return: `[shape r2] failed: API Error: Your computer went to sleep mid-response.` |
| 5 | `a0cd89872e7e66565` | resume attempt 2, after that error | returned; stopped by the workflow's own check |
| 6 | `a6069304786f98501` | resume attempt 3, its resume line quoting the stop below | returned the same form; stopped by the same check |

Both stops, word for word:

> the shaper called the fix for R2-1 a sweep and returned no usable list of what the sweep covered (no swept list); a sweep lists every member it measured in swept, each as member and found, holds or fixed

The resume line of launch 6 carried that sentence and added "When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it." The two prompts differ in that one line and nowhere else.

Each agent returned through one `StructuredOutput` call, and the journal's saved result is identical to that call's input, so the schema accepted both. In each, `swept` is a key of the finding, beside `cause`, for R2-1 and R2-2, and no other finding carries one.

Launch 5, as returned (one finding a line):

```json
{
  "specFolder": "agent-os/specs/2026-11-24-1712-127-review-round-2",
  "findings": [
    {"id":"R2-6","disposition":"fix","decidedBy":"redline","recommendation":"Clear the mitigation of every entry the round keeps for a finding left to the person (in resolveWith and in the reshape's rebuild) and stop at resolve when a resolve plans a task with files for any left finding it applies; five loop cases and the error count pin prove it.","files":["workflows/redline-loop.js","tests/loop-test.mjs","docs/running.md"],"cause":{"where":"workflows/redline-loop.js","outcome":"one-place","why":"The round takes a left finding's entries and tasks from the resolve agent as written, and one helper at both places the list takes entries in plus one check beside the other resolve-time task checks closes every way an entry or task for a left finding reaches the build."}},
    {"id":"R2-1","disposition":"fix","decidedBy":"redline","recommendation":"Reword the three sentences in SKILL.md (213, 228) and docs/running.md (95) to say the draft is shown before it is filed: at the round's stop, or at the end-of-run stop under defer at end.","files":["skills/redline/SKILL.md","docs/running.md"],"cause":{"where":"skills/redline/SKILL.md","outcome":"sweep","why":"The same false sentence, that a chosen deferral's draft stops the round, is written in more than one place, so each statement found by grep is fixed or confirmed right."},"swept":[{"member":"skills/redline/SKILL.md:213 (Deferring a finding left to the person)","found":"fixed"},{"member":"docs/running.md:95 (Left to you)","found":"fixed"},{"member":"skills/redline/SKILL.md:228 (a defer typed at a stop)","found":"fixed"},{"member":"docs/running.md:134 (A draft that changes is shown again)","found":"holds"},{"member":"docs/running.md:132 (When you are asked)","found":"holds"},{"member":"skills/redline/SKILL.md:262 (handoff with handoffKind deferred)","found":"holds"}]},
    {"id":"R2-2","disposition":"fix","decidedBy":"redline","recommendation":"Change the return example's R1-2 recommendation to \"Accept, no change.\" in the template, this checkout's shape-spec.md and the shaper agent file, and follow it in setup-test.sh's merge grep.","files":["templates/shape-spec-unattended.md",".claude/commands/agent-os/shape-spec.md","agents/redline-shaper.md","tests/setup-test.sh"],"cause":{"where":"templates/shape-spec-unattended.md","outcome":"sweep","why":"The example is a list kept in several files that carry the shaper's contract, so every copy found by grep is changed or confirmed frozen."},"swept":[{"member":"templates/shape-spec-unattended.md (74, 93)","found":"fixed"},{"member":".claude/commands/agent-os/shape-spec.md (65, 84)","found":"fixed"},{"member":"agents/redline-shaper.md (41, 55)","found":"fixed"},{"member":"tests/setup-test.sh:754 merge grep of the example line","found":"fixed"},{"member":"templates/history/shape-spec-unattended.v1.md to v5.md (frozen bodies with no recommended or ends)","found":"holds"}]},
    {"id":"R2-3","disposition":"fix","decidedBy":"redline","recommendation":"Strip one trailing period from the kept draft's title before forceAskRules adds its own; a loop case with a period-ended title checks the call and the autopilot Left to line.","files":["workflows/redline-loop.js","tests/loop-test.mjs"],"cause":{"where":"workflows/redline-loop.js","outcome":"instance","why":"Only the one recommendation template at 3848 adds a period to an unstripped title; its siblings strip one, the option effect quotes the title, and the issue heading adds none."}},
    {"id":"R2-4","disposition":"fix","decidedBy":"redline","recommendation":"For a finding left to the person, word the unmatched-option warning as read in the person's own words, so the finding stays left under its rule and nothing is filed; a loop case pins it beside the unchanged UNKNOWN case.","files":["workflows/redline-loop.js","tests/loop-test.mjs"],"cause":{"where":"workflows/redline-loop.js","outcome":"one-place","why":"The warning in resolveWith is the one message for an unmatched option, so wording it by whether the finding is left covers every such decision."}},
    {"id":"R2-5","disposition":"fix","decidedBy":"redline","recommendation":"Admit a resolve's entry for a left finding only when that resolve applies it, and drop any other with a warning so the earlier entry stands; a loop case with a reshape-raised resolve proves it.","files":["workflows/redline-loop.js","tests/loop-test.mjs"],"cause":{"where":"workflows/redline-loop.js","outcome":"one-place","why":"The returned filter in resolveWith is the one place every resolve's entries pass, so narrowing it there closes the path for every later resolve and every left deferral, drafted or not."}},
    {"id":"R2-7","disposition":"fix","decidedBy":"redline","recommendation":"Skip left findings in the deferral own-commit loop and warn once, truly, for every left finding with a commit of its own that its reply and the handoff name no commit; loop cases and the running.md sentence follow.","files":["workflows/redline-loop.js","tests/loop-test.mjs","docs/running.md"],"cause":{"where":"workflows/redline-loop.js","outcome":"one-place","why":"The warnings after the build are where a finding's own commit is compared with the plan, and one loop over the round's forced findings there covers a left deferral and a left finding nobody deferred alike."}}
  ],
  "deferred": [],
  "judgmentCalls": []
}
```

Launch 6, as returned:

```json
{
  "specFolder": "agent-os/specs/2026-11-24-1712-127-review-round-2",
  "findings": [
    {"id":"R2-6","disposition":"fix","decidedBy":"redline","recommendation":"Clear the mitigation of every deferred entry the round keeps for a finding left to the person, at resolve and at a reshape's rebuild, and stop at resolve when a resolve plans a task with files for a left finding it applies; loop cases prove both.","files":["workflows/redline-loop.js","tests/loop-test.mjs","docs/running.md"],"cause":{"where":"workflows/redline-loop.js","outcome":"one-place","why":"The round takes in the resolve agent's entries and tasks for a left finding as written in resolveWith and the reshape's rebuild, so one helper and one check there close every path at once."}},
    {"id":"R2-1","disposition":"fix","decidedBy":"redline","recommendation":"Say in the skill and in docs/running.md that a deferred left finding's draft is shown before it is filed, at the round's stop or, with defer at end, at the end-of-run stop, and fix the same sentence for a typed defer at SKILL.md:228.","files":["skills/redline/SKILL.md","docs/running.md"],"cause":{"where":"skills/redline/SKILL.md","outcome":"sweep","why":"The sentence that a chosen deferral's draft stops the round is kept in several places, so every place a grep over the docs, skill, agents, workflows, templates and commands found was measured."},"swept":[{"member":"skills/redline/SKILL.md:213 (Deferring a finding left to the person)","found":"fixed"},{"member":"docs/running.md:95 (Left to you)","found":"fixed"},{"member":"skills/redline/SKILL.md:228 (a defer typed at a stop)","found":"fixed"},{"member":"docs/running.md:134 (A draft that changes is shown again)","found":"holds"},{"member":"docs/running.md:132 (When you are asked)","found":"holds"},{"member":"skills/redline/SKILL.md:262 (deferred items raised at the end of the run)","found":"holds"},{"member":"README.md:50 (the plan dial row)","found":"holds"}]},
    {"id":"R2-2","disposition":"fix","decidedBy":"redline","recommendation":"Make the return example's R1-2 recommendation read \"Accept, no change.\" in the template, this checkout's shape-spec.md and the shaper agent, and have the setup test's merge check follow it.","files":["templates/shape-spec-unattended.md",".claude/commands/agent-os/shape-spec.md","agents/redline-shaper.md","tests/setup-test.sh"],"cause":{"where":"templates/shape-spec-unattended.md","outcome":"sweep","why":"The example is copied into every file that carries the shaper's contract, so every copy a grep found was measured."},"swept":[{"member":"templates/shape-spec-unattended.md","found":"fixed"},{"member":".claude/commands/agent-os/shape-spec.md","found":"fixed"},{"member":"agents/redline-shaper.md","found":"fixed"},{"member":"templates/history/shape-spec-unattended.v1.md","found":"holds"},{"member":"templates/history/shape-spec-unattended.v2.md","found":"holds"},{"member":"templates/history/shape-spec-unattended.v3.md","found":"holds"},{"member":"templates/history/shape-spec-unattended.v4.md","found":"holds"},{"member":"templates/history/shape-spec-unattended.v5.md","found":"holds"}]},
    {"id":"R2-3","disposition":"fix","decidedBy":"redline","recommendation":"Strip a trailing period from the kept draft's title before forceAskRules adds one to the call's recommendation; a loop case with a period-ended title proves it, guided and on autopilot.","files":["workflows/redline-loop.js","tests/loop-test.mjs"],"cause":{"where":"workflows/redline-loop.js","outcome":"instance","why":"Only the one template string at 3848 adds a period after a draft title; every sibling sentence already strips one and the other draftTitle calls add none."}},
    {"id":"R2-4","disposition":"fix","decidedBy":"redline","recommendation":"Word the unmatched-option warning for a finding left to the person as staying left with nothing filed; a loop case pins the text.","files":["workflows/redline-loop.js","tests/loop-test.mjs"],"cause":{"where":"workflows/redline-loop.js","outcome":"one-place","why":"The warning in resolveWith is the one message for an unmatched option, so wording it by whether the finding is left covers every such decision."}},
    {"id":"R2-5","disposition":"fix","decidedBy":"redline","recommendation":"Drop, with a warning, a resolve's deferred entry for a left finding whose decision that resolve did not apply, so the draft first decided is the one filed; a loop case with a reshape-raised resolve proves it.","files":["workflows/redline-loop.js","tests/loop-test.mjs"],"cause":{"where":"workflows/redline-loop.js","outcome":"one-place","why":"The returned filter in resolveWith is the one place every resolve's entries pass, so narrowing it for left findings closes the path for every later resolve."}},
    {"id":"R2-7","disposition":"fix","decidedBy":"redline","recommendation":"Skip left findings in the own-commit deferral warnings and warn once for any left finding with a commit of its own that its reply and the handoff name no commit; loop cases and docs/running.md say so.","files":["workflows/redline-loop.js","tests/loop-test.mjs","docs/running.md"],"cause":{"where":"workflows/redline-loop.js","outcome":"one-place","why":"The warnings after the build are the one place a finding's own commit is compared with its plan, so one loop over record.forced there covers a left deferral and a left finding nobody deferred alike."}}
  ],
  "deferred": [],
  "judgmentCalls": []
}
```

What the shaper was told about the list, in every place it reads:

- Template point 5 and the shaper file's rule 3: "returned as `swept`, one entry a member, `member` and `found`".
- The sentence under point 10's example and the shaper file's rule 10: "and for a `sweep` also `swept`".
- `CAUSE_ASK`, in the prompt's Return sentence: "with swept listing every member the sweep measured as member and found".
- The stop: "lists every member it measured in swept".
- Neither example shows a sweep. Only `CAUSE_SCHEMA` nests the list, and a schema that names a key inside `cause` does not refuse the same key beside it.

## Decisions

Given with the brief or answered on 2026-11-25, in the order asked.

1. **The instance is fixed everywhere it is stated**: the template, the shaper's agent file, `CAUSE_ASK`, the stop message, which names the key by its full path, and the return example, which gains a sweep with its list nested. A loop case covers a list returned one level out. (brief)
2. **The template goes to v7; the plugin stays 0.5.0.** The brief kept v6, since neither v6 nor 0.5.0 has been merged or tagged, and asked to be told if a test or a standard said a body change needs more. Two things did, both measured. `tests/setup-test.sh` pins the v6 body by hash and fails a body change under the same marker. And at an equal marker `redline-setup.sh unattended` compares the fill-ins only: run on a copy of this checkout's section it reported `changed: false` and wrote nothing, so a rerun could not carry a changed v6 body here or into any checkout that already took v6 from this branch. Asked; the answer: bump, "My decision 2 was wrong."
3. **R2-2 comes into this spec**, so the body changes once (the same answer). The return example's R1-2 reads "Accept, no change.", in the finding and in its call: the first of the two fixes the reviewer proposed, and the one both real shapers chose. Its `files: []` and its `Accept` option's `ends: accept` then agree with it.
4. **The class is settled by tables measured by running, not traced** (below), and **a key has one reading**: the workflow never accepts a key in two places. (brief)
5. **A key found one level out stops, and the schemas refuse unknown keys if that is proven** (question a). Second layer: the workflow's own check stops at the agent that returned the result and names the key, where it was found and the path it is read from, resumable as `checkCauses` is. First layer: the shaper's schemas and the link-asking review's schema refuse unknown keys, so the agent corrects inside its own run and nobody relaunches. That structured output enforces `additionalProperties: false` is not measured yet: Task 2 probes it with one real agent call, and if it is not enforced the schema layer is left out and drafted as an issue.
6. **A class link beside `findings` is cleared with a warning** (question b, first). A stop at the reviewer would be a new own-check stage; the link is treated as `honourLinks` treats every other link it cannot keep. The warning names the right place and the round goes on with no link.
7. **A decision with no `option` whose choice is an option's label warns at resolve** (question b, second). The warning names the label, says a pick is named in `option`, and says what happened instead: read as the person's own words, and for a finding left to the person, that it stays left and nothing is filed. The choice is never taken as a pick. An entry of `args.decisions` that is no object is refused before any agent runs. The R2-4 branch is not touched. The rest is a drafted issue ("For you to open", 1), to be weighed with R2-4.
8. **A `sameClassAs` on its finding that is no list of ids is cleared with a warning** (question b, third), in the form of `honourLinks`'s other warnings.

Following from those, listed in the approved plan:

9. **A stray warns.** A key found one level out and also in its place is a stray copy: it is ignored with a warning that names it, never a stop. A key found one level out and absent from its place stops, whatever else the result holds.
10. **`draft` beside `options`.** On a call for a finding left to the person, a relabelled call included, it stops: the draft exists and sits where it is not read. On an ordinary call it is dropped with the warning its right place already gets, since a draft is read on no option of such a call.
11. **One example shows `draft`.** The shaper file's example gains the judgment call its rule finding R1-3 lacks today, with an option that ends in `defer` and carries `draft`. The template's example gains the sweep only.
12. **The #105 hunk conflicts again and is resolved as then.** A dry run of the merge on a copy of this checkout's section, with the v6 body as its base and a drafted new body, gave one conflict: the sentence under point 10's example, beside this repository's point 11. The template's side is taken and point 11 is put back.

Decided during the build, each a difference from the approved plan, reported at its commit boundary:

13. **The probe ran after Task 5, and proved the schema layer.** The word for it came with Task 5's commit. Tasks 3 to 5 did not depend on it. Structured output refused the misplaced key in the agent's own run (see "The probe"), so Task 6 landed and the issue held in reserve was not drafted.
14. **One stop is new.** A list on the finding of a fix that is no sweep, or `member` and `found` on such a cause, had no existing stop to join, so decision 9 needed a message of its own ("the shaper returned ... for the fix for <id>, which it did not call a sweep"). It is in the loop test's own-check list. Every other stop keeps its opening words.
15. **A list is in its place only when it holds an entry.** An empty `cause.swept` beside a list on the finding is the list out of place, and stops; it is not a stray copy.
16. **On a finding left to the person every option's label warns**, as decision 7 says, in words that are true there: the option that ends in defer says nothing is filed, any other says the finding stays left as it would with the pick. No warning for a left finding promises a statement from the resolve agent (the fault R2-4 names in the neighbouring message, which is not touched).
17. **The stops that name a part of `cause` name it by path in every form**, the two that say where a cause lives included (`cause.where`), beyond the three the plan listed.
18. **Point 11 was put back by a script that ran twice.** Its first form refused to run: its check for a point 11 already present matched the Verification Gate's own "11. **Version**" line. Narrowed to the guard point's opening words, it ran. The section differs from the template only where it did before the merge.
19. **The frozen v6 needed no new pin**: its body hashes to the pin the setup test already held.
20. **The loop test's mock gained five scenario keys** to put a key where a schema names none (`findingKeys`, `findingKeysAt`, `shapeKeys`, `shapeKeysAt`, `reviewKeys`), and the test gained `schemaFaults`, the validator of the shaping runs, worded as the tool words a refusal. One check pins the refusal the probe recorded.
21. **Two checks beyond the plan**: no return example an agent is shown holds a key its schema refuses, and a deferred entry and the resolve agent's schema stay open.
22. **The no-`option` warning reaches older scenarios.** Their fixtures answer a call with an option's label as the choice and no `option`, the form from before #105. Their results are unchanged; the sweep counts them (`plan.md`, "As built").
23. **The shaper's and the reviewer's files each say an unnamed key is refused when they return**; the template does not, since its v7 body was pinned by Task 4's commit before Task 6 was known to land.
24. **`docs/upgrading.md` says what a section still at v6 does**, as it does for v3 to v5.
25. **Standards retrospective: all seven proposed edits are applied** (asked on 2026-11-25, with the gate green), in a commit of their own after this folder's. The list and each clause as drafted are under "Standards retrospective (proposed)".

## How the tables were built

By running `workflows/redline-loop.js` through the harness of `tests/loop-test.mjs` (its `mock`, `body` and fixtures, loaded from the file up to its first scenario; nothing written to disk), not by tracing:

- **Misplacement runs.** One run a case: the scripted agent's result is patched to move one key one level out, and the run's status, stage, error, own-check flag, resume label and warnings are printed, with what the stop shows the person, what the resolve prompt holds, whether a `file deferred` call was made, and the reply. Each has a control run with the key in its place. 41 runs, listed under "The runs".
- **The schema layer.** The mock does not validate a result, so each patched result was also read against the schema its call carried, by a small validator of `type`, `required`, `enum`, `properties` and `items`, and its keys the schema does not name were listed. For row 5 a real run is the evidence: both real returns passed `StructuredOutput`.
- **Real results.** The 30 results in the journal of `wf_6478a046-32b` were each read against the schema of their call kind, collected from one mock run, for keys the schema does not name.
- **The validator in use.** A refusal in that run (the baseline checker's first attempt) reads "Output does not match required schema: root: must have required property 'status', ...". That wording is Ajv's. Whether `additionalProperties: false` is enforced is Task 2's to measure.
- **The statements.** Table 2's rows were generated from a list of (place, file, quoted words), and every quoted fragment was checked to be in its file as written.
- **The merge.** `redline-setup.sh unattended` run with `--merge --dry-run` on a copy of this checkout's `shape-spec.md`: once against the real template (equal marker), once against a scratch template pair (the v6 body frozen as the base, a drafted body marked one higher).

A cell marked *read* was read, not run.

## Table 1: the keys, and what the workflow does one level out (13 rows)

| # | Key, as read | An example shows it | One level out (runs) | Today |
|---|---|---|---|---|
| 1 | `findings[].cause` | template, shaper file | beside `findings`, keyed by id (A7) | stops at shape: "no cause". The schema accepts it |
| 2 | `cause.where` | both | on the finding (A2, A5) | stops: "(no where)". The message never says the part sits inside `cause` |
| 3 | `cause.outcome` | both | on the finding (A3, A5) | stops: "(no outcome)", the same |
| 4 | `cause.why` | both | on the finding (A4, A5) | stops: "(no why)", the same |
| 5 | `cause.swept` | **none** | on the finding (A1; A10 at a reshape; the two real returns) | stops: "(no swept list)", and the message names no place. The schema accepts it. Beside a one-place cause (A8): ignored, and shown to the plan approver as returned |
| 6 | `cause.swept[].member` | none | on `cause`, with no list (A6) | stops: "(no swept list)" |
| 7 | `cause.swept[].found` | none | on `cause`, with no list (A6) | stops, the same |
| 8 | `judgmentCalls[].options[].ends` | both | on the call, as a map by label (B1) | stops. The schema refuses it |
| 9 | `judgmentCalls[].options[].draft` | **none** | on the call | a call the shaper wrote as left (B6, B9): stops, and the message never says `draft`. **A relabelled left call (B11, B13): ignored.** The person is shown no draft, and on a pick the resolve agent is asked to write one. **An ordinary call (B15): ignored, with no warning**, and the key rides in the stop's result. In the result's `deferred` list (B8): stops, with a warning that the entry is dropped |
| 10 | `draft.title`, `found`, `why`, `fullFix` | none | flat on the option (B7) | stops: the message says the four fields are "missing" |
| 11 | `judgmentCalls[].recommended` | both | on the finding (B2); a flag inside the option (B3) | stops, and the message names no place. The schema refuses it. On the finding as well as the call (B4): ignored |
| 12 | `args.decisions[id].option` (the session writes it) | SKILL.md's record form | beside the entries (C4); inside `choice` (C5); at the top of the args (C3); left off (C1, C2, C7) | **ignored**: the decision is read as the person's own words and the resolve agent states its end (C2: it stops when none is stated). **On a left call's option that ends in defer (C7): the finding stays left, nothing is filed, and no warning says so** |
| 13 | `findings[].sameClassAs` (the reviewer's) | **none** | beside `findings`, keyed by id (D1) | **ignored**: the shaper is shown no link, the round fixes an instance, and nothing warns. On the finding in another form (D2, a string; D3, a list of objects): cleared with no warning; the schema refuses both |

What the real results show: of the 30, the shaper's five, the reviewer's two, the plan approver's three and every other schema-carrying agent's name only keys their schema names, with two exceptions. Both `shape r2` returns carry `findings[].swept`. And the GitHub agent's two `post` results carry ten keys their schema does not name (its file's whole return block), so a schema of that agent cannot refuse unknown keys.

## Table 2: every statement of a key, and whether it says the key's place (78 rows)

One row a statement. "A reader is told" marks a sentence that describes the key to an agent or a person that reads it and does not write it.

| # | Where | Keys | The words | Place stated without doubt | Changes in |
|---|---|---|---|---|---|
| 1 | Template, opening paragraph | `sameClassAs` | "A finding may also carry `sameClassAs`: the ids of earlier findings that were fixed" | a reader is told, not the writer | none |
| 2 | Template, point 3 | `ends` | "Every option of a call states what choosing it ends in, in `ends`" | yes | none |
| 3 | Template, point 3 | `recommended` | "The call names the option you recommend in `recommended`, by its label as written." | yes | none |
| 4 | Template, point 4 | `draft` and its fields | "an option that ends in `defer` and carries its drafted issue in `draft` (`title`, `found`, `why`, `fullFix`, written as a deferral's are)" | yes | none |
| 5 | Template, point 4 | `draft` | "A `draft` is read on that option alone." | yes | none |
| 6 | Template, point 5 | `cause`, `where`, `outcome`, `why` | "returned as `cause` (`where`, a path in the repository; `outcome`; `why`, one sentence)" | yes | none |
| 7 | Template, point 5 | `swept`, `member`, `found` | "returned as `swept`, one entry a member, `member` and `found`" | `swept`: **no**, it names no place, and `cause` was closed with its parts three sentences earlier. `member`, `found`: yes | Task 4 |
| 8 | Template, point 5 | `sameClassAs` | "A finding that carries `sameClassAs` has the question answered" | a reader is told, not the writer | none |
| 9 | Template, point 10, the example | `cause`, `where`, `outcome`, `why` | ""cause": {"where": "app/Http/Requests/StoreOrderRequest.php", "outcome": "one-place", "why": " | shown | none |
| 10 | Template, point 10, the example | `swept`, `member`, `found` | (nothing) | **not shown**: no fix of the example is a sweep | Task 4 |
| 11 | Template, point 10, the example | `ends`, `recommended` | ""effect": "...", "ends": "fix"}"; ""recommended": "Accept"," | shown | Task 4 rewords the recommendation beside it (R2-2) |
| 12 | Template, point 10, the example | `draft` and its fields | (nothing) | **not shown**: no option of the example carries one | none here (decision 11) |
| 13 | Template, the sentence under the example | `cause`, `where`, `outcome`, `why` | "A `fix` also carries `cause` (point 5): `where`, `outcome` (`one-place`, `sweep` or `instance`) and `why`" | yes | Task 4, with the next row |
| 14 | Template, the sentence under the example | `swept`, `member`, `found` | "and for a `sweep` also `swept`, each member the sweep measured as `{"member", "found"}`" | `swept`: **no**, it reads as "a fix also carries swept". `member`, `found`: yes | Task 4 |
| 15 | Template, the sentence under the example | `ends`, `recommended` | "Each option of a call carries `ends` (`fix`, `defer` or `accept`), and the call carries `recommended`" | yes | none |
| 16 | Template, the sentence under the example | `draft` | "an option that ends in `defer`, on a call for a finding left to the person (point 4), also carries `draft`, and no other option does" | yes | none |
| 17 | Shaper file, rule 1 | `ends` | "Every option of a call states what choosing it ends in, in `ends`" | yes | none |
| 18 | Shaper file, rule 1 | `recommended` | "The call also names the option you recommend in `recommended`, by its label as written" | yes | none |
| 19 | Shaper file, rule 3 | `cause`, `where`, `outcome`, `why` | "returned as `cause` (`where`, a path in the repository; `outcome`; `why`, one sentence)" | yes | none |
| 20 | Shaper file, rule 3 | `swept`, `member`, `found` | "returned as `swept`, one entry a member, `member` and `found`" | `swept`: **no**, as in the template. `member`, `found`: yes | Task 3 |
| 21 | Shaper file, rule 3 | `sameClassAs` | "(`sameClassAs`: the verifier judges the two one class)" | a reader is told, not the writer | none |
| 22 | Shaper file, rule 3, what the workflow stops on | `cause`, `swept` | "The workflow stops the run on a fix with no `cause`"; "a `sweep` with no usable `swept`" | `cause`: yes. `swept`: **no** | Task 3 |
| 23 | Shaper file, rule 7, Redline's own files | `draft` | "an option that ends in `defer` and carries its drafted issue in `draft`, as for a finding a repository ask rule covers" | yes | none |
| 24 | Shaper file, rule 7, repository ask rules | `draft` and its fields | "an option that ends in `defer` and carries its drafted issue in `draft` (`title`, `found`, `why`, `fullFix`, each written to stand on its own"; "A `draft` is read on that option alone" | yes | none |
| 25 | Shaper file, rule 8 | `ends` | "Each option states its end in `ends` as rule 1 says" | yes | none |
| 26 | Shaper file, rule 10 | `cause`, `where`, `outcome`, `why`, `swept`, `member`, `found` | "In a Redline round a `fix` also carries `cause` (rule 3): `where`, `outcome` (`one-place`, `sweep` or `instance`) and `why`, and for a `sweep` also `swept`" | `swept`: **no**, as in the template. The others: yes | Task 3 |
| 27 | Shaper file, rule 10 | `ends`, `recommended` | "Each option of a call carries `ends` (`fix`, `defer` or `accept`), and the call carries `recommended`" | yes | none |
| 28 | Shaper file, rule 10 | `draft` | "An option that ends in `defer`, on a call for a finding left to the person (rule 7), also carries `draft`, and no other option does." | yes | none |
| 29 | Shaper file, the example | `cause`, `where`, `outcome`, `why`, `ends`, `recommended` | ""outcome": "one-place""; ""ends": "accept"}]"; ""recommended": "Accept"," | shown | Task 4 rewords the recommendation (R2-2) |
| 30 | Shaper file, the example | `swept`, `member`, `found`, `draft` and its fields | (nothing) | **not shown**: no sweep, and its rule finding R1-3 has no call | Task 4 |
| 31 | Resolve file, What you receive | `ends`, `recommended` | "options, each with what it ends in, `ends`, the recommended option's label, `recommended`" | a reader is told, not the writer | none |
| 32 | Resolve file, What you receive | `option` | "A decision that carries `option` picked that option of the call, named by its label" | a reader is told, not the writer | none |
| 33 | Resolve file, step 3 | `draft` | "the draft the call's option carries in `draft`, copied as written" | a reader is told, not the writer | none |
| 34 | Plan approver file | `option` | "A decision that carries `option` picked that option of the call" | a reader is told, not the writer | none |
| 35 | Plan approver file | `cause` | "every `fix` the shaper sorted carries `cause`" | a reader is told, not the writer | none |
| 36 | Plan approver file | `sameClassAs` | "a finding the prompt links to an earlier fixed one through `sameClassAs`" | a reader is told, not the writer | none |
| 37 | Reviewer file | `sameClassAs` | "asks each finding to state `sameClassAs`: the ids of the earlier findings listed there"; "Leave the key out when there is none." | nearly: each finding states it, and it is never called a key of the finding | Task 5 |
| 38 | Reviewer file, the return example | `sameClassAs` | (nothing) | **not shown**: its one finding is a first round's | none: a first review states no link, and the sentence above says where |
| 39 | `CAUSE_ASK`, in the Return sentence of a Redline round's shape and reshape prompts | `cause`, `where`, `outcome`, `why` | "for a fix also cause, where its cause lives and what the fix makes of it: where (a path in the repository), outcome (" | yes, by the colon; it is never called an object | Task 3 |
| 40 | `CAUSE_ASK` | `swept`, `member`, `found` | "with swept listing every member the sweep measured as member and found" | `swept`: **no**. `member`, `found`: yes | Task 3 |
| 41 | `ENDS_ASK`, in every shape, human-pass and reshape Return sentence | `ends` | "ends on every option (what choosing it ends in: fix," | yes | none |
| 42 | `ENDS_ASK` | `recommended` | "and recommended (the label, as written, of the option you recommend)" | **no**: it follows "ends on every option" with "and", so it reads as the option's | Task 5 |
| 43 | `LEFT_DRAFT_ASK` | `draft` and its fields | "an option that ends in defer also carries draft, its drafted issue as title, found, why and fullFix, and no other option carries one" | yes | none |
| 44 | `LINK_ASK`, in a review that is shown earlier findings | `sameClassAs` | "For each finding, state sameClassAs when its cause is one class with" | nearly: it is never called a key of the finding | Task 5 |
| 45 | The links block of a shape prompt | `sameClassAs` | "as one class (sameClassAs), each with what the run" | a reader is told, not the writer | none |
| 46 | The resolve prompt, the pick sentence of its calls block | `option` | "A call whose decision carries `option` was answered by picking that option of the call, named by its label" | a reader is told, not the writer | none |
| 47 | The resolve prompt, the bullet for a left finding the person deferred | `draft` | "option carries, copied as written, when one does, and one you write when the call offered none" | a reader is told, not the writer | none |
| 48 | The result's `relaunch.how` | `option` | "A call answered by picking one of its options also carries "option": "<the label of the option picked>"" | yes | none |
| 49 | Stop, `checkCauses`: no cause | `cause` | "with no cause it can be read from (" | yes | Task 5: says where a cause beside `findings` was found |
| 50 | Stop, `checkCauses`: a part missing | `where`, `outcome`, `why` | "a fix says where its cause lives (where, a path in the repository), what the fix makes of it (outcome: one-place, sweep or instance) and why, in one sentence" | **no**: it never says the parts sit inside `cause` | Task 5 |
| 51 | Stop, `checkCauses`: a sweep with no usable list | `swept`, `member`, `found` | "a sweep lists every member it measured in swept, each as member and found, holds or fixed" | `swept`: **no**. `member`, `found`: yes | Task 3 |
| 52 | Stop, `checkOptions`: an option with no end | `ends` | "every option of a judgment call carries a label and states what it ends in, fix, defer or accept" | **no**: the place is said, the key is not named | Task 5 |
| 53 | Stop, `checkOptions`: the recommended option | `recommended` | "recommended names the option the shaper recommends by its label" | **no** | Task 5 |
| 54 | Stop, `checkOptions`: a left call's defer option with no draft | `draft` and its fields | "an option that ends in defer with no complete drafted issue (" | **no**: it lists the fields as missing and never says `draft` | Task 5 |
| 55 | Warning, `checkOptions`: a draft where none is read | `draft` | "a drafted issue, which is read only on an option that ends in defer of a call for a finding left to the person; the draft is dropped" | yes | Task 5: the same warning for one beside `options` on an ordinary call |
| 56 | Refusal of `args.decisions` | `option` | "args.decisions must give an option as a string, the label of the option picked, when it gives one" | yes | none |
| 57 | Refusal of `args.decisions` | `option` | "args.decisions must not give both an option and a disposition" | yes | none |
| 58 | Warning, `resolveWith`: an option that names none | `option` | "which is the label of none of its call" | yes | none: R2-4's, out of scope |
| 59 | Warning, `honourLinks`: a link that does not stand | `sameClassAs` | "as one class (sameClassAs), but" | the key, no place; it fires only on a link in its place | none |
| 60 | Skill, what a stop's result holds | `ends`, `recommended` | "its options (each with what it ends in, `ends`), the label of the recommended option (`recommended`)" | a reader is told, not the writer | none |
| 61 | Skill, showing a call | `ends` | "what it ends in (`ends`: `fix`, a change in this pull request" | a reader is told, not the writer | none |
| 62 | Skill, deferring a finding left to the person | `draft` and its fields | "carries a drafted issue (`draft`: `title`, `found`, `why`, `fullFix`)" | a reader is told, not the writer | none |
| 63 | Skill, the question | `recommended` | "the recommended one (`recommended`, the label of one option) first" | a reader is told, not the writer | none |
| 64 | Skill, Record each answer | `option` | "add `"option": "<the option's label, exactly as given>"`" | yes: this is the writer's instruction, with the record's form beside it | none |
| 65 | Skill, the plan hand-off | `cause`, `where`, `swept` | "for a fix its `cause`: where the cause lives (`where`)"; "(`sweep`, with what the sweep covered in `swept`)" | a reader is told, not the writer; `swept` with no place | Task 3 |
| 66 | `docs/contract.md`, The unattended section | `ends`, `recommended`, `cause` | "`ends` on every option of a judgment call with the call's `recommended` option, the instance-or-class step with `cause` on a fix" | yes | Task 4 adds v7 |
| 67 | `docs/contract.md`, a finding left to the person | `draft` and its fields | "carry a drafted issue (`draft`: `title`, `found`, `why`, `fullFix`)" | yes | none |
| 68 | `docs/running.md`, judgment calls | `ends` | "(`ends` on the option)" | yes | none |
| 69 | `docs/running.md`, judgment calls | `option` | "(`option` on the decision)" | yes | none |
| 70 | `docs/running.md`, Review | `sameClassAs` | "(`sameClassAs`; see "Dispositions", "Instance or class")" | a reader is told, not the writer | none |
| 71 | `docs/running.md`, Instance or class | `cause` | "returned as `cause` on the finding" | yes | none |
| 72 | `docs/running.md`, Instance or class | `swept` | "each member measured by running it and listed with what was found" | the key is not named | Task 3 |
| 73 | `docs/running.md`, Instance or class | `sameClassAs` | "(`sameClassAs`, asked only in a review that is shown earlier findings)" | a reader is told, not the writer | none |
| 74 | `docs/upgrading.md`, Unattended section versions | `ends`, `recommended`, `cause` | "(`ends`) and the call names its recommended option (`recommended`)"; "(`cause`, the step "Instance or class" in point 5)" | a reader is told, not the writer | Task 4 adds v7 |
| 75 | `docs/upgrading.md`, the 0.5.0 replay note | `sameClassAs` | "(`sameClassAs`), so its prompt changed too" | a reader is told, not the writer | none |
| 76 | Schema, `CAUSE_SCHEMA` under a finding's properties | `cause`, `where`, `outcome`, `why`, `swept`, `member`, `found` | "swept: { type: 'array', items: { type: 'object', required: ['member', 'found']" | exact, and the one statement that nests `swept` | Task 6 |
| 77 | Schema, `judgmentCallSchema` | `ends`, `draft`, `recommended` | "required: ['label', 'cost', 'effect', 'ends']"; "required: ['id', 'title', 'story', 'why_human', 'options', 'recommended', 'recommendation', 'dependsOn']" | exact | Task 6 |
| 78 | Schema, `reviewSchema` with links | `sameClassAs` | "properties: { ...FINDING_SCHEMA.properties, sameClassAs: strings }" | exact | Task 6 |

Of the 78 rows, 12 state a key with its place in doubt and 4 are examples that show nothing of their keys. `swept` is in doubt in every sentence that tells the shaper to write it (rows 7, 14, 20, 22, 26, 40) and in its stop (row 51), and no example shows it (rows 10, 30). The rest of the doubt is in stop messages (rows 50, 52, 53, 54) and one ask (row 42).

## The runs

Round fixtures are the loop test's. "Schema" is the patched call's schema as the validator reads it.

**A. The parts of `cause`** (a Redline round, one finding, fixed).

- A0, control: a sweep with `swept` inside `cause`. Done; the round records the cause with its list.
- A1: `swept` on the finding. Schema accepts. Stops at shape, own check, resumable at `shape r1`: "(no swept list) ... in swept".
- A2, A3, A4: `where`, `outcome`, `why` on the finding, one at a time. Schema refuses (`cause` is missing a required part). Stops: "(no where)", "(no outcome)", "(no why)".
- A5: all four on the finding, no `cause`. Schema accepts. Stops: "(no cause)".
- A6: `member` and `found` on `cause`, no list. Schema accepts. Stops: "(no swept list)".
- A7: `cause` at the top of the result, keyed by id. Schema accepts. Stops: "(no cause)".
- A8: a one-place fix, `swept` on the finding. Schema accepts. Done; the recorded cause holds no list, and the plan approver's prompt shows the stray key.
- A9: a one-place fix, `swept` inside `cause`. Done; the recorded cause keeps the list.
- A10: a reshape returns A1's form. Stops at shape, resumable at `reshape r1 #1`.
- A11: a deferral carries `cause`. Handoff for the draft; nothing reads it.

**B. A call's `ends`, `recommended` and `draft`.**

- B0, control: an ordinary call, guided. Handoff.
- B1: `ends` on the call, none on the options. Schema refuses. Stops: every option "ends in null".
- B2: `recommended` on the finding. Schema refuses. Stops: `recommended ""`.
- B3: `recommended` as a flag in the option. Schema refuses. Stops the same.
- B4: `recommended` on the call and, with another label, on the finding. Schema accepts. Handoff; the call's stands.
- B5, control: a rule call the shaper wrote, `draft` on its defer option. Handoff; the stop shows the draft.
- B6: that call, `draft` on the call. Schema accepts. Stops: "missing title, found, why, fullFix".
- B7: the draft's fields flat on the option. Schema accepts. Stops with the same words.
- B8: the draft in the result's `deferred` list. Schema accepts. Stops the same, with the warning that the entry is dropped.
- B9: a call on one of Redline's own files, `draft` on the call. Stops the same.
- B10, control: an ordinary call a paths rule turns out to cover (relabelled), `draft` on its defer option. Handoff; the stop shows the draft.
- B11: that call, `draft` on the call. Schema accepts. Handoff; the stop shows no draft and nothing warns of it.
- B12, control: B10, the person picks the option. Done; the shaper's draft is filed.
- B13: B11, the person picks the option. The resolve prompt asks the resolve agent to write the draft. (The scripted resolve agent writes none, so the run stops at resolve; a real one would write its own.)
- B14: an ordinary call, `draft` on its defer option. Handoff, with the warning that the draft is dropped.
- B15: an ordinary call, `draft` on the call. Schema accepts. Handoff, no warning; the call in the stop's result still carries the key.

**C. A decision's `option`** (a call with three options; the person's answer names Accept).

- C0, control: `option` named. Done; the resolve prompt shows the decision with `disposition: accept`.
- C1: the label in `choice` only. No disposition is set; the resolve agent states the end. (The scripted agent states a fix by default, so the run stops at the check; a real one would state what the words say.)
- C2: the same, and the resolve agent states nothing. Stops at resolve: "stated no disposition".
- C3: `option` at the top of the args. As C1.
- C4: `option` inside `decisions`, beside the entries. As C1; the stray entry is ignored.
- C5: `option` inside `choice`. As C1; the resolve prompt shows `choice` as an object.
- C6, control: a rule call, its defer option picked, `option` named. Done; filed, and the reply ends "Deferred to #301."
- C7: the same pick, the label in `choice` only. Done; nothing is filed, the reply reads "left to @author under repository rule craft-config (...). Track it.", and there is no warning.

**D. The reviewer's `sameClassAs`** (round 2 finds the second instance of a cause round 1 fixed; the scripted shaper fixes an instance).

- D0, control: the link on the finding. Stops at `shape r2`: an instance fix under a link.
- D1: the link at the top of the review, keyed by id. Schema accepts. Done: the shape prompt shows no link and round 2 is fixed as an instance.
- D2: the link on the finding as one id, a string. Schema refuses. Done, as D1, with no warning.
- D3: the link as a list of objects. Schema refuses. Done, as D1, with no warning.
- D4: the shaper states a link on its own finding. Schema accepts. Done; nothing reads it.

## The probe (Task 2)

Run on 2026-11-25, once the word for it was given, as a one-agent workflow (`wf_4b3db9f9-540`): the path Redline's own agents return through. The agent's schema was a cut-down of a Redline round's shape schema with `additionalProperties: false` on the result, a finding, `cause` and an entry of `swept`. Its prompt gave it one result to return unchanged, with `swept` on the finding beside `cause`, and told it to return the corrected result if the tool refused the first.

Read off the tool's own replies in the agent's transcript, not off what the agent reported:

| Call | `swept` | The tool's reply |
|---|---|---|
| first | on the finding | error: `Output does not match required schema: /findings/0: must NOT have additional properties ('swept' is not allowed)` |
| second | inside `cause` | `Structured output provided successfully` |

So structured output enforces `additionalProperties: false`, in the agent's own run, and its refusal names the path and the key. Task 6 landed, and the third issue the plan held in reserve is not drafted. One call was made; the measurement is of one key at one level, and the loop test's `schemaFaults` words every other refusal the same way without a real call behind it.

## For you to open

Drafted in the form of this repository's issues. No open issue covers either (the open list was read on 2026-11-25; the nearest are #126, which #127 closes, and #115).

### 1. Send a picked option again with its `option` when the session left it off

**What was found.** A decision that picks one of its call's options names it in `option`, which the session writes when it records the person's answer (`skills/redline/SKILL.md`, "Record each answer"). When the session leaves the key off and writes the option's label as the `choice` alone, the workflow reads the decision as an answer in the person's own words. On an ordinary call that is the path every free-text answer takes: the resolve agent states what the decision ends in, and the workflow holds its tasks and entries to that. On a call for a finding left to the person it is not safe: such a finding is deferred only by a pick of its option that ends in `defer` or by a typed `<id>: defer.`, so a person who picked that option gets no issue. Measured with the loop harness: the run ends `done`, no `file deferred` call is made, and the reply reads "left to @author under repository rule craft-config (...). Track it." with nothing after it. Since the follow-up spec of #127 the run warns, naming the label and saying that nothing was filed. It still files nothing.

**Why it was not fixed with the follow-up of #127.** One reading per key was a decision of that spec: the workflow does not take a `choice` as a pick because it happens to equal a label. Sending the decision again is the session's step, and no stop today is answered by the session without the person: a stop for it needs a rule in the skill and a field in the result for the skill to read. It also sits beside the warning for an `option` that names none of its call's options, which round 2 of #127 found misworded for a left finding (R2-4); the two are better weighed together once that one is settled.

**Proposed fix.** Have the result name each decision whose `choice` is the label of an option of its call and that carries no `option`, before the round's resolve runs, and have the skill add the key and relaunch in the same turn, without asking the person and without counting it as a new answer. Pin it with a loop case: a left call's option that ends in `defer`, picked with the label in `choice` only, is filed after the resend, and its neighbour, an answer in the person's own words that merely contains a label, is left as it is.

### 2. Hold each scripted result in the loop test to its call's schema

**What was found.** `tests/loop-test.mjs` runs the workflow with scripted agents, and a scripted result reaches the workflow whatever the call's schema says of it. In a real run the agent's structured output is held to that schema inside its own run: a missing required key or a value outside an enum is refused there and the agent returns again. So the harness cannot run the schema layer at all. It proves the workflow's own checks, the second layer, and reads a schema only as an object in a handful of checks (the reasons a call may give, the dispositions of a pass, the keys a finding requires). The standard that a mock "returns every key the agent's schema requires, with the value the real agent would give" (`agent-os/standards/testing/tests.md`) is kept by hand. While shaping the follow-up of #127, a validator of `type`, `required`, `enum`, `properties` and `items` was run beside the harness to say what each schema makes of a misplaced key; it is not part of the test.

**Why it was not fixed with the follow-up of #127.** It is a change across the whole harness. Many scenarios script a result the schema would refuse on purpose, to prove the workflow's check behind it (an end outside the three, a call with no `recommended`, a reason from the other pass). Each would have to be marked as a result that got past the schema before a validator could run on every call without turning them red.

**Proposed fix.** Have the mock read every scripted result against the `schema` its call carries, with the keywords the workflow's schemas use, and fail the run on a result the schema refuses unless the scenario marks that call as past the schema. Then the standard is enforced by the harness, a key added to a mock and not to its schema is red, and a schema that refuses unknown keys is exercised by every scenario.

## Yours after the build

- Every commit, at each boundary.
- `/redline 127`, Start fresh: round 3 carries R2-1 and R2-3 to R2-7. R2-2's thread will be answered by that run's review of the head.
- The two drafted issues.
- The rerun of `/redline:setup` in each other repository once this merges: v7 is the first body any of them will take past v5 unless one already took v6 from this branch, where the merge now sees an older marker and offers the change.

## Standards retrospective (proposed)

Listed mechanically (gate step 12): every decision above, every deviation in `plan.md`'s As built, and every check that went red and was fixed by learning something about the tooling.

### What each item is

| Item | In a standard already | Missing |
|---|---|---|
| 1, 17: a key's place stated everywhere it is stated, and named by path in its stop | `workflow/agents`, the line on a rule a prompt states: applied everywhere it is stated | that a key inside another object is stated with its place, shown by an example and named by path: edit 1 |
| 2, 18, 19: template v7 | `process/release`, the last line (the dry run, the hunk beside point 11); `testing/tests`, the pinned bodies (the older pins never change) | that an unmerged version is no exception, and how a point put back is found: edit 5 |
| 3, 11, 21: the examples (R2-2, a sweep, a drafted option, no key a schema refuses) | `testing/tests`, the line on the agent files: an example is parsed and held to what the schema requires | that an example shows each key in its place and agrees with itself: edit 3 |
| 4: tables measured by running; one reading per key | `workflow/agents`, the line on a class: a table built by running, recorded in `shape.md` | one reading per key: edit 2. A table of statements checked against its files: edit 1 |
| 5, 9, 10, 13, 14, 15, 23: the two layers | `workflow/agents`, the line on checking a result: the schema refuses in the shaper's own run and the workflow's test is the second layer; `workflow/replay`: every failure in one error | that a schema refuses unknown keys, what the probe measured, which schemas stay open, and what the second layer does with a key a level out: edit 2 |
| 6, 8: a link out of place or unreadable is cleared with a warning | `workflow/agents`, the line on a class: the workflow keeps a link only to a fixed finding and clears any other with a warning | covered by edit 2's last clause |
| 7, 16: a decision with no `option` | `workflow/agents`, the line on a message the run shows the person: it says what is true when it fires | that a key the session writes has no schema and is refused or warned of: edit 2 |
| 12: the #105 hunk, resolved as then | `process/release`, the last line, which names that hunk | nothing |
| 20, 21: the mock's key hooks and `schemaFaults` | `testing/tests`, the line on mocks: a mock returns every key the schema requires | the hooks, and that the harness runs no schema: edit 4. Both were used before they were proposed here |
| 22: the warning reaches older scenarios, found by the sweep | `testing/tests`, the line on the sweep | that the sweep compares schemas and groups warnings: edit 6 |
| 24: `docs/upgrading.md` says what a section one version behind does | `process/release`, the last line | nothing |
| Red: the first sweep ran both scripts inside one `go()` and gave other counts | `testing/tests`, the line on the sweep: the whole harness once under each script, never both inside one `go()` | nothing; the standard was right and the sweep was run again its way |
| Red: a red count told at a boundary was not read off the run | `testing/tests`, red before green | where a recorded red count comes from: edit 7 |
| Red: `grep` on this machine is ugrep, where a bounded repetition fails with no output | not a rule of the repository: CI and the scripts do not use the form | nothing |

No rule a standard states was found wrong.

### The edits

Each is a clause appended to the line named, which is read back whole when applied (`process/standards-retrospective`). None holds a count.

**1. `agent-os/standards/workflow/agents.md`, the line "A decision that changes a rule a prompt states is applied everywhere", appended:**

> ; and a key an agent returns inside another object is stated with its place in every sentence that tells the agent to write it, the prompt's ask, the agent file and the template alike, is shown in that place by a return example, and is named by its full path in the stop that reads it, which says where it found one a level out: "and for a `sweep` also `swept`" named no place in the template, the shaper's file, the ask or the stop, no example showed a sweep, and the shaper of #127's round 2 returned the list beside `cause` twice, the second time with the stop's words in its prompt; the places are found by a table of every statement of every such key, generated from a list of place, file and quoted words with each fragment checked to be in its file as written, so no row quotes what a file does not say (the follow-up of #127)

**2. `agent-os/standards/workflow/agents.md`, the line "The workflow checks a result before it acts on it", appended:**

> ; and a schema that names a key inside an object accepts the same key beside it, so the schema of an agent that returns nested keys refuses unknown keys on every object that holds one (`additionalProperties: false`): structured output enforces it in the agent's own run and names the path and the key (a probe with a real agent: `/findings/0: must NOT have additional properties ('swept' is not allowed)`), a schema whose call must replay keeps the form it had (the first review of a pull request with no earlier round), and one whose agent returns its file's whole block for every operation stays open (the GitHub agent); the workflow's own check is the second layer and gives each key one reading, never a second place it is also accepted from: found a level out and absent from its place it stops the round with its path and where it was found, found there beside a copy in its place it is dropped with a warning, a class link out of place or in a form that is no list of ids is cleared with a warning as every link the workflow cannot keep is, and a key the session writes, which no schema holds, is refused before any agent runs or warned of where only the round can see it (the follow-up of #127)

**3. `agent-os/standards/testing/tests.md`, the line "`tests/loop-test.mjs` also reads `agents/redline-reviewer.md`", appended:**

> ; and an example is held to more than what the schema requires: it shows each key the shape can carry in the place it is read, it agrees with itself, and it holds no key its schema refuses: no example showed a sweep's list or a drafted option, and the template's call recommended an option that ends in `accept` beside a recommendation that adds a comment, until the follow-up of #127 (R2-2)

**4. `agent-os/standards/testing/tests.md`, the line "A loop-test mock answers as the real agent would", appended:**

> ; and the harness holds no scripted result to its call's schema, so a scenario puts a key where a schema names none through the mock's own keys (`findingKeys`, `shapeKeys`, `reviewKeys`), and a check that needs the schema layer runs the result through `schemaFaults`, which reads a schema with the keywords the workflow's schemas use and words a refusal as the tool does (the follow-up of #127)

**5. `agent-os/standards/process/release.md`, the last line ("A change to the unattended template's body is dry-run"), appended:**

> ; and a body change bumps the marker even while the version it would change is unmerged: at an equal marker `redline-setup.sh unattended` compares the fill-ins only, so a rerun writes nothing to a checkout that already took that version, this one included, and the body's pin fails the change (the follow-up of #127 set out to keep v6, measured both, and went to v7 with the plugin's version kept); and a point put back after the template's side is taken is found by its opening words, never by its number, since the file holds another list with the same number (the Verification Gate's)

**6. `agent-os/standards/testing/tests.md`, the line "A claim that prompts stay byte-identical across a change is proven by a sweep", appended:**

> ; and the sweep compares each call's schema as well as its prompt, and groups what differs in the results and the warnings by form, so a warning a change adds to older scenarios is seen and explained and never met first in a run (the follow-up of #127: a warning for a decision that names no option fired in older scenarios whose fixtures answer a call in the form from before #105)

**7. `agent-os/standards/testing/tests.md`, the line "A bug fix lands red before green", appended:**

> ; and a red count a spec records is the harness's own summary line, read off the run: one that was not read is measured again from the commits, the task's committed test against the tree before it, and the record says so (the follow-up of #127)

## Context

- **Visuals:** None.
- **References:** the template v6 spec folder (`agent-os/specs/2026-11-24-1231-105-template-v6-ends-class-rule-defer/`), round 1 of #127 (`agent-os/specs/2026-11-24-1712-127-review-round-1/`), the workflow records of run `wf_6478a046-32b`; see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`: the review's first rounds should not cost a person a round trip each. A stop the shaper cannot read its way out of cost two relaunches here; a key that is ignored costs a rule silently. Nothing in the roadmap is changed.

## Standards Applied

- workflow/agents — a field the record is read from is required in its schema and asked for in every prompt that returns it; a rule a prompt states is changed everywhere it is stated; the workflow checks a result before it acts on it, with the schema as the first layer.
- workflow/replay — a new ask sits in the block only the calls it concerns carry; which calls' prompts change is shown by a sweep, not claimed.
- testing/tests — every changed surface gains a case, red before green; a pin is a short key phrase; the unattended body is pinned by version.
- process/release — a body change bumps the marker and is dry-run against this checkout's own section first; the version is kept on purpose inside a pull request that already bumps it.
- process/docs-gate — each touched plugin file names its README or `docs/` section.
- process/standards-retrospective — the retrospective is listed mechanically and lands in its own commit.
- process/internal-notes — the spec cites the run's records and copies in no design note.
- prompts/attribution — no model or vendor name anywhere.
- scripts/bash-conventions — `tests/setup-test.sh` changes; CI's shellcheck command runs before that commit.
