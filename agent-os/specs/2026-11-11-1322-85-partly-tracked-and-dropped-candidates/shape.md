# #85: partly tracked candidates and the dropped block — Shaping Notes

## Scope

Issue #85, and only #85. Task 10.6 of #79 reran Losers League #817 at its pre-Redline SHA on the built plugin (the evidence is `SPIKE-72-NOTES.md` §10 in redline-internal, cited by name; none of its text, and none of Losers League's code or candidate text, is copied here). The verifier followed its rules as written and lost two of the items the spec expected as correctness findings, so the rules change:

1. **A tracked issue that covers part of a candidate swallows the rest.** The known-finding check had one outcome, "already tracked in #N, with the line #N lacks", so a regression this pull request introduced became a For the person note because a neighbouring issue existed, and two candidates were collapsed by issue rather than by cause.
2. **A discarded candidate reaches the person only as a count.** `refuted`, `disproportionate` and `outside` candidates appeared in the review body as a number; the candidate and the reason were in `round-<n>-findings.json` only.

What is built: three verifier rules (partly tracked, a refutation answers the claim, a removed guard is not disproportionate) in `agents/redline-reviewer.md` and the verify prompt (`candidatesBlock` in `workflows/redline-loop.js`), and a collapsed dropped block in the review body and the handoff comment, each pinned by `tests/loop-test.mjs`; `docs/running.md` and README Known limits describe them; the version moves to 0.2.2.

Out of scope: #74 (review-only rounds at coverage), #73 (the regression pass, cost as a finding class) and #75 (instance or class), even where the same evidence touches them.

## Decisions

From the brief (2026-11-11, @michaelfromtheoutfit; not reopened):

1. Scope is #85 only. #74, #73 and #75 stay out.
2. **Partly tracked.** When an open issue or a teammate's comment covers only part of a candidate, the tracked part is `known` and the remainder is judged as its own candidate. A remainder whose cause is in this pull request's diff is a finding: the issue is named in its description, `knownAs` stays empty, and it is accounted for as `finding`. "Collapse by cause" gains the counter-case that two candidates are not one because one issue's title fits both.
3. **A refutation states the candidate's claim and the evidence against that claim.** Evidence for a neighbouring claim does not refute, and neither does a comment or docblock that states intent; such a candidate goes under For the person.
4. **A removed guard is not disproportionate.** A candidate that needs implausible conditions today, but which the base branch handled and this pull request stopped handling, goes under For the person with the removed line named.
5. **The dropped block.** The review body lists every `refuted`, `disproportionate` and `outside` candidate after For the person, one line each (file and line, the claim, the reason), in a collapsed `<details>` block. No dropped candidates means no block. The handoff comment carries the same block for the last round.
6. The evidence is the #817 rerun in `SPIKE-72-NOTES.md` §10 (internal), cited by file name and section; no text of it, and none of Losers League's code or candidate text, enters this repository. The loop-test scenarios use invented candidates.
7. The Done-when's replay of the rerun's recorded 25 candidates is the person's to run after the gate, as task 10.6 of #79 was; its result goes to the internal note, not this spec.
8. Patch bump to 0.2.2 in `plugin.json` and `marketplace.json`. Checked at shaping: nothing a setup rerun writes changes (no file under `templates/`, nothing in `scripts/checks-template.sh` below its header, no allow entry, not the unattended section's body), and the check-before-reporting wording lives only in this repository's `CLAUDE.md`, never in a template.
9. `scripts/redline-guard.sh` and `hooks/hooks.json` are not touched.
10. The standards retrospective adds the exposure this run met to the throwaway-PR recipe: once the original PR has merged, its review-round folders are on the default branch and a coverage pass that follows the repository's check-before-reporting rule reads them. Measure before the original merges, or audit what the pass read.

Asked at shaping (2026-11-11, one at a time), answered by @michaelfromtheoutfit:

11. **The claim on a dropped line is the candidate's own `summary`, unedited and whole, never truncated**, since the block is collapsed. A refutation that answers a different claim then shows as a mismatch on the line. The reason is the verifier's `ref`. No schema change.
12. **#85's "structural test" of the reviewer agent did not exist**: nothing in `tests/` opened an agent file at shaping time. What is built in its place is a loop-test check per rule that reads `agents/redline-reviewer.md` and matches a short key phrase, not a whole sentence, so a later rewording of the surrounding text does not break it. Each check also finds the phrase in a covered verify prompt and not in a `coverage off` one.
13. **Docs: `docs/running.md` and README Known limits only.** `docs/contract.md` has no entry, against the Done-when's wording, because neither change alters a per-repository file (contract.md covers `checks.json`, `redline.json`, `redline.local.json`, the allow list, the unattended section, the CLAUDE.md sentence and the snapshots). The `refuted` ref's format in `round-<n>-findings.json` changes, so `running.md`'s coverage-pass section says so.
14. **The handoff carries the block of the last round that ran the coverage pass, and names that round.** That is the round before a final nit pass, else the last round; under `coverage off` there is none. Earlier rounds' drops stay in their own review bodies and are not repeated.

Shaping defaults (recorded, not asked):

- **Accounting a partly tracked candidate.** Its index is accounted for by what its remainder became (`finding`, `forThePerson`, `outside`, `refuted`, `disproportionate`, `duplicate`), with the issue or comment named in the finding's description, the For the person line or the ref; `known` stays the outcome for a candidate an issue or a comment tracks whole.
- **The rules enter the verify prompt only.** The partly tracked, refutation and removed-guard sentences go in `candidatesBlock`, the branch with candidates, so a `coverage off` prompt stays byte-identical (`workflow/replay.md`); the agent file states them for both modes, since its "Check for known findings first" section already speaks of each "candidate finding".
- **An empty reason on a dropped entry** prints `no reason given`, and the run records a warning naming the index, so a dropped line is never blank and the slip is visible (the "never drop a candidate silently" rule).
- **Unchanged:** the coverage count sentence; the cap-hit comment and a human review pass's summary comment (neither is the handoff); the findings file, which already holds the candidate list and the accounting; the run's result, which keeps counts only (#80, R1-5).
- **The dropped line's shape** opens with ``- ` `` like a For the person line, never `- **R`, so `redline-gh.sh prior-findings` (whose `finding_lines` matches `^- \*\*R<n>-<k>\*\* · `) never reads one back as a finding.
- **Out of scope, noted for the person:** this repository's `CLAUDE.md` ("Code review — check before reporting") still says a known finding is reported as "already tracked in #N", plus only whatever that issue is missing, the wording behind fault 1. It is the person's file and outside #85.

## Context

- **Visuals:** None.
- **References:** `agents/redline-reviewer.md` (known-finding check, candidates section, return block); `workflows/redline-loop.js` (`candidatesBlock`, `accountCoverage`, the review normalizer, `reviewBody`, `personLine`, `handoffComment`, the round record, `result`); `tests/loop-test.mjs` section 15; `scripts/redline-gh.sh` `prior-findings`; `docs/running.md`; README Known limits; see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "Decisions stay with people" (a drop is now one the person can overrule from the review) and "Honest about its reach" (what the verifier set aside is listed, with its reason). No conflict, no mission edit.

## Standards Applied

- `workflow/agents` — the coverage-pass bullet this extends (outcomes, guards, the For the person list); a rule a prompt states is changed everywhere the prompt and the agent file state it (#80, R3-3).
- `workflow/replay` — a `coverage off` prompt stays byte-identical; the record carries what the handoff needs, never the clock.
- `testing/tests` — red before green; a tested surface gains a case; a loop-test mock answers as the real agent would.
- `process/docs-gate` — a Docs entry per touched plugin file; every statement of the done rule reworded (#80, R5-1).
- `process/release` — the patch bump, both files equal.
- `process/internal-notes` — the spike note is cited, never copied; the throwaway-PR recipe the retrospective extends.
- `process/standards-retrospective` — gate step 12.
- `prompts/attribution` — no model or vendor name anywhere.

## Standards retrospective

Listed mechanically (gate step 12) from the Decisions above, the As built notes in `plan.md` and the checks that went red, and presented one at a time on 2026-11-11. All three were applied as their own commit, approved by @michaelfromtheoutfit:

1. `workflow/agents.md`: a new bullet after the coverage-pass bullet, "The verifier's rules from the #817 rerun (#85)". It records partly tracked, the refutation rule, the removed guard and the dropped block, including the handoff's last covered round. This was missing; the coverage-pass bullet's "dropped with that word" had no exception and no block. Applied as drafted.
2. `testing/tests.md`: a new bullet after the loop-test mock bullet. It says the loop test reads `agents/redline-reviewer.md` and pins one short key phrase per verifier rule in the agent file and the verify prompt, absent under `coverage off`. This was missing. Applied as drafted.
3. `process/internal-notes.md`: the throwaway-PR bullet gains the exposure (decision 10). Once the original PR has merged, its review-round folders are on the default branch, and a coverage pass that follows the check-before-reporting rule reads them. Measure before the original merges, or audit what the pass read by call index. Applied with @michaelfromtheoutfit's addition: the fork's thinking is empty in the transcript, so the call order is the only evidence, and an item whose file the fork first names after the read is recorded as open, not found, even when the whole-diff read came first.

Already covered, so no edit:

- The rules entering the verify prompt only, so coverage off stays byte-identical: `workflow/replay.md`, the dial bullet.
- The patch bump: `process/release.md`.
- A Docs entry per touched file, and the done rule reworded wherever it is stated: `process/docs-gate.md`.
- The vacuous check tightened on the red run: `testing/tests.md`, "A comparison of two command outputs passes when both are empty".

No pattern was invented outside `agent-os/standards/`.

## Deviations from #85's text

- **The structural test.** #85 names a structural test of the reviewer agent that did not exist. Its replacement is the key-phrase check (decision 12).
- **`docs/contract.md`.** It has no entry (decision 13).
- **The handoff's "last round".** It is read as the last round that ran the coverage pass, named in the block's summary line (decision 14).
