# References for PR #97 Review Round 1

Shaped by Redline in unattended mode. Every file below was opened at `1dc6048` while shaping this round.

## Similar Implementations

### The filing script and its harness

- **Location:** `scripts/redline-gh.sh` (the `defer` header, 111-126; `defer_record` and `defer_print`, 171-185; the `pr` subcommand, 291-295, which reads pull request fields only; the `defer` subcommand, 544-613, with its reuse check, 578-582, the lookup, 593, and the create, 601-604); `tests/gh-test.sh` (the fake `gh`'s `issue` handler, 85-113; the `defer` cases, 398-453); `docs/scripts.md:121` (the quoted header).
- **Relevance:** R1-2 and R1-3 change `defer_record`, the `defer` branch's trap and the header; R1-4's deferred full fix would read `hasIssuesEnabled` through this script.
- **Key patterns:** the fake `gh` already logs each `issue` call and fails one on an environment flag (`GH_FAKE_LIST_FAIL`, `GH_FAKE_CREATE_FAIL`), so a hook that writes into a file during the create is one more flag of the same kind; a temp file beside its target and an atomic `mv`, as `defer_record` already does.

### The installed gh

- **Location:** `/opt/homebrew/Cellar/gh/2.103.3/bin/gh`, its strings only (`strings` piped to `grep`); `gh` itself is refused to every Redline role.
- **Relevance:** R1-4's second look: the binary carries the format `the '%s' repository has disabled issues`, evidence that some issue command refuses on a repository with Issues off, not which ones or with what exit code.

### The launch preferences

- **Location:** `scripts/redline-prefs.sh` (the word checks, 367-382; `MERGE` and its `deferToWord`, 411-433; the refusal's comment, 439-440, and `bad_defer`, 441); `tests/prefs-test.sh:66-77`.
- **Relevance:** R1-5 has the refusal read the merge's word test; the comment at 439-440 ("stops the launch here instead of falling back to GitHub (#95)") is the precedent R1-4's drafted issue proposes to follow.
- **Key patterns:** the `resolve` call's `"$MERGE"'...'` concatenation, which `bad_defer` reuses.

### The workflow's deferrals

- **Location:** `workflows/redline-loop.js`: `DEFER_TO` (187); `args.deferrals` (205-216); `DEFERRED_SCHEMA`, `hasMitigation`, `DRAFT_FIELDS` and `draftMissing` (759-773); `draftTitle`, `issueDraft` and `draftParts` (1257-1287); `deferredTo` and `deferredSentence` (1290-1294); `pushReplyPrompt` (2168-2196) and `deferPrompt` (2200-2212); `judge`'s missing-commit reason (2433); `outcomesFor` (2861-2906), `droppedOutcome`, `HELD`, `HELD_SENTENCE` and `draftClose` (2908-2919), `describeOutcome` (2923-2950); `checkCalls` (3018-3040) and `checkDrafts` (3084-3095); `fileDeferred` (3264-3303), `deferredEntry` (3308-3318), `draftView`, `heldStop` and `settleHeld` (3320-3412); `revise()`: `draftsOf` and `shaperDrafts` (3540-3562), `settle` and the first stop (3567-3592), the overrides, `awayFromDefer`, `resolveWith` (3594-3652), `effectiveDispositions`, `isDeferral` and `draftStop` (3654-3686), the reshape loop (3710-3745), `needCommits` (3788-3794), the filing and `outcomesFor` call (3858-3871), the gate and the push (3869-3909), `bought` and `fixed` (3920-3942); `handoffResult`'s R8-6 comment (4480-4485); the cap and the main loop's ending (4740-4772); `commitRecord`'s status and `record files` call (2286, 4413-4427).
- **Relevance:** R1-7, R1-8, R1-10, R1-11 and R1-12 change these; R1-4's stop at `defer` is traced through them; R1-9, R1-13 and R1-14 are declined on them.
- **Key patterns:** one reader for a deferral's mitigation (`hasMitigation`); `awayFromDefer` and `stillDeferred` as the earlier rules for which entry stands beside a decision (#94, R4-9, R5-9); R8-6's rule that a decided call stays the person's whatever a reshape returns.

### The loop harness

- **Location:** `tests/loop-test.mjs`: the scripted GitHub agent's filing (123-143); the scripted shaper, with its reshape keys (200-240), and resolve agent, with `acceptedCalls` and `resolveDeferred` (242-253); `goAhead` and `baseArgs` (310-317); `go()` and its run-record check (323-345); the no-mitigation cases and their neighbour (2812-2831); the filing section and its `draftsOf` and `filing` (2860-2965); the stop section and `answer` (2977-3040); the end-of-run section, `covArgs`, `ended` and `filedAtEnd` (3070-3110); the statements block and its `read` (3245-3277; its last check, the title's unmeasured case, at 3276, and its closing `}` at 3277).
- **Relevance:** every loop check this round adds sits in one of these sections and reuses its helpers.
- **Key patterns:** a word loop of `[word, name]` pairs with a neighbour run after it; a statement pinned by key phrase through `read(...)`; a reply pinned byte for byte with `replyFor`.

### The skill and the docs

- **Location:** `skills/redline/SKILL.md` (a stopped run's resume, 47-55; the `done` section, 262-264, and the `capped` section, 266-268; the Rules, 274-276); `docs/guard.md:7`; `docs/contract.md:132`; `docs/running.md` (45, the fix-diff rule; 126, "Where a draft goes"); `README.md:61` (Dials).
- **Relevance:** R1-6 brings the `capped` section in line with `done`; R1-1 and R1-4's mitigation change docs sentences; R1-14 is declined on `docs/running.md:45`.
- **Key patterns:** the `done` section's deferred list and its print-mode paragraph, which the `capped` section now follows.

### The agents and the unattended section

- **Location:** `agents/redline-github.md:28` (the `defer` operation, drafts in the order given); `agents/redline-resolve.md:19-23` (a deferred entry only for a "mitigate" choice or a `defer` override); `agents/redline-plan-approver.md:16` (a deferral with an empty mitigation has no task); `agents/redline-shaper.md:28` (only a deferral that ships a mitigation has a task); `.claude/commands/agent-os/shape-spec.md` (the unattended section: point 4's `defer`, 48, "it becomes a plan task, and otherwise the finding has no task"; point 7, 54, "one task per `fix` finding and per `defer` finding that ships a mitigation"; point 11, 89, the guard and the hook).
- **Relevance:** the evidence for R1-2's likelihood, R1-10's rule (Unattended answer 7) and R1-4's deferral. None is changed.

### The repository's settings

- **Location:** `.claude/redline.json` (`"deferTo": "github"`).
- **Relevance:** this round's one deferral, R1-4, is filed as an issue on this repository.

### The pull request's own spec

- **Location:** `agent-os/specs/2026-11-16-1026-95-defer-means-tracked/` (`plan.md`, decisions 20 and 35 and "Replay"; `shape.md`, decisions 11, 30 and 38).
- **Relevance:** decision 35 is R1-7's evidence, decision 20 R1-14's, and "Replay" keeps what the plan approver and the implementer are shown unchanged under R1-10.

### Issues searched

- `redline-gh.sh issues-search` for `deferTo`, `issues disabled`, `issue tracker`, `defer`, `mitigation` and `guard.md`: open issues #95 (this pull request's), #2 (other trackers, which does not track R1-4), #21, #22, #1, #66 and #88; none tracks a finding of this round. On plan adjustment 1, `Issues turned off` and `hasIssuesEnabled` found no open issue, so R1-4's drafted issue is new.
