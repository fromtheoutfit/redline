# References for PR #127 Review Round 4

Shaped by Redline in unattended mode. Every file below was opened for this round, at `20a7603`.

## Similar Implementations

### `forceAskRules` (`workflows/redline-loop.js:3942-4067`)

- **Relevance:** R4-1 (the call-reason lookup, 3973-3986, and the tag warning, 3987-3990), R4-2 (the kept draft, 4012-4018, and the call it builds, 4026-4045), and R4-4 after adjustment 1 (the rule found only through the listed files, read beside `s.askRule = rule.id`, 4021; `ruleForPaths`, 667-680; `leftUnder`, 471).
- **Key patterns:** R3-6's lookup and its warning, which Task 2 widens. The comment that a draft short of a field is not kept so that no stop is raised for an option the shaper never wrote (4015-4016), which Task 3 keeps and adds a warning to.

### `checkCalls`, `checkWhy`, `checkOptions`, `checkDrafts` (`workflows/redline-loop.js:3625-3904`)

- **Relevance:** the members of R4-1's class: `checkCalls` stops a call on a finding sorted otherwise before `forceAskRules`, and `checkWhy` takes only the exact `repository rule <id>` of a declared rule. `checkDrafts` runs after the forcing point (R4-2). `checkOptions` puts no limit on drafted defer options (R4-3).

### `resolveWith` (`workflows/redline-loop.js:4574-4831`)

- **Relevance:** R4-3's draft choice (4692-4702) and the `rewritten` warning (4711-4714). R4-4's members 1 to 3: `leftTasked` (4784-4787) and `rule` set on a left decision (4628-4637), which Task 4 mirrors after a reshape.

### The approve loop's reshape, list update, hold and rebuild (`workflows/redline-loop.js:4913-5039`)

- **Relevance:** R4-4. `tracked` (4540), the decided list passed to `reshapePrompt` (4945), the list update (4960-4971), the hold and its one stop (4984-4998), `raised` (5001) and the rebuild with `leftEntry` (5007-5018).
- **Key patterns:** the hold names every kind in one stop (#114, R4-6), so Task 4's kind joins it and adds no throw site.

### `reshapePrompt`, `planPrompt`, `rulesBlock` (`workflows/redline-loop.js:689-691`, `2395-2417`, `2495-2522`)

- **Relevance:** the decided block Task 4 widens (its sentence `A finding decided as a fix keeps a task with files, and one decided as accepted keeps none.`, 2400, which gains the clause `LEFT_KEEPS_NONE`), `FILES_ASK_DECIDED` (1166), and what the plan approver is shown of a decision (`roundDecisions` in full, 2517, left decisions included).

### The loop test (`tests/loop-test.mjs`)

- **Location:**
  - The mock shaper (220-300: `taskOf`, `namedDecided`, `callOf`, `callAt`, `whyHuman`, `drafts`, `noDraft`, `reshapeAsk`, `reshapeAskRule`, `reshapeFiles`, `reshapeFilesAt`) and the mock resolve (301-340; a left call's task has no files, 335).
  - The harness-wide checks of every shaper prompt that holds the decided block (498-509, `strayDecidedBlock`, `doubleFilesAsk`, read at 5593-5594).
  - The `rules:` section (1620-1640, `reshapedUnder`, `unknown`) and the `resume:` pins (1731-1732).
  - The `reshape:` section (3600-3620: `reshapePromptOf`, `withoutBlock`, the `emptied` and `undecided` block checks, `twoDecided` and its check at 3610-3611, the shaper's file checks at 3613-3614; 3631-3632 `forcedDefer`; 3690-3759 the hold's cases, `blockNames`, `forcedEmptied`).
  - The `filing:` cases `forcedLater` and `forcedNamed` (4017-4043).
  - The `ends:` check of the reshape prompts with and without a decided finding (4643-4649).
  - The `left:` block (4821-5140: the helpers, the kept-draft check at 4839, `later` and `namedLater` at 5027-5031, the R3-6 cases at 5079-5099, the R3-10 cases at 5101-5127, the R3-9 case at 5135-5140).
- **Relevance:** every new case, every scenario Task 4 changes, and the two existing checks that follow it after adjustment 2.

### The reviewer's reproduction (`/tmp/redlinerepro/reviewer-r4-repro.mjs`)

- **Relevance:** its four cases (`c1` to `c4`) script R4-1, R4-4, R4-2 and R4-3. Read, not run: node is refused to the shaper.

### Documents

- `docs/contract.md:153` ("Ask rules", the `prose` bullet): R4-1.
- `docs/running.md:95` ("Left to you"): R4-2, R4-3.
- `docs/running.md:128` ("A reshape after your decision"): R4-4.
- `skills/redline/SKILL.md:213` ("Deferring a finding left to the person"): R4-3.
- `agents/redline-shaper.md:34` (rule 10, the decided findings of a reshape): R4-4.
- `agents/redline-plan-approver.md` rules 1 and 5 (what a left finding's task may be): R4-4's unattended answer.

### Earlier specs

- The PR's spec, `agent-os/specs/2026-11-24-1231-105-template-v6-ends-class-rule-defer/shape.md`: decisions 20 and 22, table C rows 20 and 21, and the drafted #119 comment (line 344).
- Round 3's spec, `agent-os/specs/2026-11-25-1418-127-review-round-3/shape.md`: R3-6 and R3-10, the causes this round's links name.
