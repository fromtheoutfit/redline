# References for PR #80 Review Round 1

Shaped by Redline in unattended mode. Line numbers are at `48c971b`, the PR head this round reviewed.

## Similar Implementations

### The coverage pass in the workflow

- **Location:** `workflows/redline-loop.js`
- **Relevance:** every finding of the round is here.
- **Key patterns:**
  - `carryList` and `trackedList` (101-102): module-level splits of `priorFindings`, so `trackedList` is available on every round.
  - `reviewPrompt()` (1086-1140): the handled list (`trackedList`, 1116-1119) and the carry-forward list (1120-1122) are gated on `priorBlock` (`reviewed === 'pr' && priorFindings.length`), and so is the known-finding sentence's "match against them" clause (1131). That clause therefore also shows on a whole-PR round whose earlier findings are all carry-forward. The candidates block is added only when `candidates` is an array (1126-1128), which is how `coverage off` stays byte-identical. R1-2 widens the handled list's gate the same way and gives the clause its own gate (plan-approver adjustment 2).
  - `candidatesBlock()` (1145-1161): the definition of new and "never drop a candidate silently" (1156), and the per-candidate rules, including "under a correctness-only scope a nit candidate goes there too" (1157).
  - `coverageCandidates()` (1179-1209) and `coverageMessage()` (1214-1224): the three causes; R1-3.
  - `accountCoverage()` (1230-1265): the accounting and the counts, the mirror of `reconcilePrior()`; R1-4. Its docblock (1226-1229) says every candidate has exactly one entry and one left out or placed with an unknown outcome is "listed under For the person as reported, with a warning, never dropped". A `finding` entry whose ref names no finding of the round only warns and keeps the outcome `finding` (1248-1250). R1-4 part (1) brings it in line with the docblock (plan-approver adjustment 1).
  - `history()` (1838-1847): this run's rounds only.
  - `review()` (1924-2000): the coverage call is skipped on the final nit pass (1933); the accounting (1976-1984) runs before the carry-forward reconcile (1987-1998); R1-4 moves it after.
  - `reconcilePrior()` (2011-2056): may clear a `knownAs` naming a Redline id.
  - `post()` (2058-2069): the findings file, with the dead `reviewOut.candidates ||` fallback; R1-5.
  - `reviewBody()` (816-859) and `coverageSentence()` (869-876): the count sentence and the Already tracked and For the person headings; R1-4.
  - `handoffComment()` (2697-2712): the whole-PR sentence; R1-6.
  - The main loop (3203-3221): the correctness-only nit drop (3205-3211) runs before the known split (3212), so a nit with a `knownAs` is dropped, never listed under Already tracked; R1-4's rule order follows it (plan-approver adjustment 2).
  - `meta.description` (line 3): the done clause R1-1 copies into the skill's description.

### The reviewer's instructions

- **Location:** `agents/redline-reviewer.md`, "Check for known findings first" (14-22) and "Candidates from the coverage pass" (24 on).
- **Relevance:** point 3 says when the prompt lists the earlier rounds; R1-2 extends it to every round that ran a coverage pass.

### The loop test

- **Location:** `tests/loop-test.mjs`, section 15 (1265-1380); helpers `f()` (205), `prior()` (207) and `baseArgs` (208-214, `coverage: null`); the mock's coverage branch (40-52, an empty fenced array when the scenario names no `coverage` text, line 51) and the reviewer branch's `coverageOut` and `forThePerson` (126-132); the carry scenarios (`carry: a re-review never carries`, 583-586: `firstRound: 2`, a carry-forward prior only, rounds 2 and 3).
- **Relevance:** every new check goes here, beside the scenarios it neighbours. They are the findings-file check (1305), the handoff sentence (1319), the correctness-only scenario (1321-1323), the three causes (1346-1355) and `coverage off` (1373-1378). The accounting scenario (comment 1336-1338, run 1340, checks 1341-1342) pins `1:finding:R9-9` and the two-entry For the person list today; R1-4 part (1) changes check 1341 and keeps the warning check 1342. R1-2's sentence-gate neighbour sits beside the carry scenario at 583.

### The reviewer's reproduction

- **Location:** `/tmp/redlinerepro/reviewer-r1-repro.mjs`
- **Relevance:** scenarios A (R1-2: `review r2` lists R1-1, `re-review r3` does not), B (R1-4's correctness-only nit), C (R1-3's renamed keys), E (R1-5's findings file). Read, not run: the shaper's guard does not allow `node`; the plan's checks reproduce each through the gate.

### The launch skill and the alias template

- **Location:** `skills/redline/SKILL.md` (frontmatter lines 1-4; the grammar table, `coverage off` at line 33), `templates/command-redline.md` (line 3), `.claude/commands/redline.md` (byte-identical to the template today).
- **Relevance:** R1-1. `tests/setup-test.sh` pins this checkout's alias files to their templates (`testing/tests.md`, #44).

### The #79 spec

- **Location:** `agent-os/specs/2026-11-05-1443-79-two-reviewer-whole-pr-round/plan.md` (Decisions 3, 5, 10, 20 to 22; Task 4.5 and 4.6; As built deviations 2, 3 and 5) and `shape.md` (Context).
- **Relevance:** the answers recorded under Unattended answers in this round's `shape.md`. Task 4.5 (120) and As built deviation 3 (208) say only that a `finding` entry naming no finding warns. Neither says the candidate may be left out of every list, so neither settles R1-4 part (1).

### The shape-spec command

- **Location:** `.claude/commands/agent-os/shape-spec.md`, "Unattended mode (Redline)", point 2 (line 35).
- **Relevance:** a question the code's own docblock answers is answered from it, and where the code disagrees, the disagreement is the finding to fix; the ground for applying adjustment 1 as option (a).

### The docs

- **Location:** `docs/running.md` "Rounds" step 7 (line 42), "The coverage pass" (48-54), "The handoff comment" (83); `CHANGELOG.md` `## 0.2.0`.
- **Relevance:** the stated behaviour each fix matches, and the sentences Tasks 2 to 5 and 7 update.
