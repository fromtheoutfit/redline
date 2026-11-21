# PR #114 Review Round 4, Fixed by Hand — Shaping Notes

## Scope

Redline's run on PR #114 (#106) stopped at its round cap after round 4, with round 4's six findings undecided. This spec fixes the six, and settles once the class that three of them are the fourth round of. It changes nothing else. The brief is the record in `agent-os/specs/2026-11-20-2144-114-review-round-4/redline/` (`round-4-findings.json`, `round-4-review.json`, `cap-hit.md`). That folder has no `shape.md`, because the run stopped before shaping. The findings were read from the pull request's round 4 review (6006885361): five inline comments, and R4-4 in the review body under "Not placed inline".

- **R4-1** (nit, `agents/redline-shaper.md:32`): rule 9's "the one exception" follows the sentence that bans touching `redline/`, so it can be read as lifting that ban, and the correct-in-place resume clause leaves the ban out.
- **R4-2** (correctness, low, `workflows/redline-loop.js:494`): `cleanPaths` does not fold `..` segments or a trailing `/.`, which the guard's `normpath` does.
- **R4-3** (correctness, low, `workflows/redline-loop.js:547`): a directory listed in a non-standard form under a paths rule matches neither form `ruleForPaths` reads.
- **R4-4** (correctness, low, `workflows/redline-loop.js:3761`): a deferral nobody decided reads the shaper's files as written, so `['']` counts as a planned mitigation.
- **R4-5** (correctness, low, `workflows/redline-loop.js:4016`): after R3-4 a re-applied override's list ignores the second resolve's tasks, but the named-fix check still demands them.
- **R4-6** (nit, `workflows/redline-loop.js:4170`): the hold after a reshape names only the fix failures when one reshape also gives an accepted finding a task.

One class runs through the four rounds: **a path an agent returns is read in more than one form.** R1-6 built `cleanPaths` for the decided lists. R2-2 folded three more forms into it. R3-3 gave the paths rules a second reading beside the written one. Round 4 found two forms neither folds (`..`, a trailing `/.`: R4-2), a form the two readings miss between them (a directory in a non-standard spelling: R4-3) and a reader no round had put through the cleanup (the shaper's own list: R4-4). Each round fixed the forms or the reader its finding named.

Before the first commit (2026-11-21, `4200467`, tree clean), `node tests/loop-test.mjs` printed `1556 checks passed, 0 failed`.

## Decisions

Decisions 1 to 10 are @michaelfromtheoutfit's, given with the request. Decisions 11 to 16 are their answers while shaping. Decisions 17 to 24 were made while shaping, from the code, and approved with the plan.

1. **All six findings are handled here.** R4-1 and R4-6 are fixed as the review proposes.
2. **R4-2, R4-3 and R4-4 are settled as their class, once,** and not one form at a time. The table under "The table" below is the ground: every place the workflow reads a path an agent returned, against every form a path can take, with what each reader does today and after, measured by running the functions. The reference is the guard, which decides a write: for each form the table says how the guard reads it, and the workflow's reading agrees with it or the table says why not. The guard is not changed.
3. **R4-5 is settled by question b** (decision 14).
4. **Out of scope:** #104, #105, #109, #115, #116, #117, and the paths ask rules on a resolve's task (the drafted issue in the #106 spec's `shape.md`). Decision 24 says where a change here touches what one of them describes.
5. **The replay standard holds.** "Prompts that change" below names each prompt that changes, and the loop test proves the rest byte-identical.
6. **Every fix has a case seen red first, except a wording fix.** The version stays 0.4.4: this is the same pull request.
7. **Not touched:** `templates/`, the unattended section, `skills/`, `scripts/`, `hooks/` and `tests/gh-test.sh`.
8. **The six findings are answered on PR #114 in Redline's own reply form, after the push,** naming the commit, so `redline-gh.sh prior-findings` reads each as settled: in the thread for the five placed inline, and as a pull-request comment that opens with its marker for R4-4. @michaelfromtheoutfit sees the six replies before they are posted.
9. **The standards retrospective is its own commit.** The sentence R1-6 added to `workflow/agents.md` ("a list of paths an agent returns is read through one cleanup before it is compared, stored or counted") is made true or reworded to what is true.
10. **No AI attribution anywhere,** in commits, replies or the spec.
11. **(a) One normaliser, the guard's lexical reading, used by every reader in the table.** It trims the text, joins it to the repository root, folds repeated slashes, `./` and `..` segments and a trailing `/` or `/.`, and takes the root off. A blank, or the root itself, is no path. The other two choices were not taken:
    - *A check at intake that refuses a path not already in standard form.* It would stop the run at the step that returned the path (shape, resolve or approve), so `./app/x.php`, which R1-6 made harmless, would become a stop a person relaunches on an unattended run. The shaper would need a third resume clause, a new prompt sentence. About a dozen cases rounds 1 to 3 pinned as "changes nothing" would flip to "stops", and a cached result that ran on before the update would stop on the relaunch after it.
    - *Keeping `cleanPaths` and narrowing the docs and the standard to what it does.* It costs replay nothing and leaves `app/../config/project/x.yaml` not left to the person, the guard refusing the write at the build, where the round cannot replan; and a fifth round can name the next form.
12. **(a, rider) Normalising never widens the gate's allowed list.** `planPaths` feeds the snapshot's `plan_paths`, which `checks.sh` reads as the allowed list (`scripts/checks-template.sh:390-409`). An entry that folds to the repository root or climbs above it is dropped, never written as a prefix, and no entry is written as a broader prefix than the path as the agent gave it. A case pins it.
13. **The rule's-root gap is recorded and drafted, not built.** The measurement found a disagreement with the guard that is not a path form. Under `config/project/**` the guard refuses a write to `config/project`, `config/project/`, `config/` and `config`: its second test says the target "holds the files of" the rule (`ask_rule`, 402). The workflow has only the glob. After this change it leaves a task to the person when it lists `config/project/` in any spelling; it still does not for `config/project` with no slash, or for a directory above the rule's root. This predates the pull request (#49), no finding names it, and closing it makes the workflow ask about more tasks. The table's rows say why, and the issue is drafted under "For you to open".
14. **(b) Drop the fix half only.** A resolve that applies again a finding that already has a list (an override a reshape returned as a call) is no longer held to a task with files for a named fix: the list, which the hold after the reshape has just checked, has them. The named-accept check still reads what that resolve itself returned: a task with files for a finding @michaelfromtheoutfit accepted stops at the resolve, as today, and does not wait on the plan approver to notice. So two places decide, on two sources, and each says which: the hold reads the list, and the accept check reads that resolve's own tasks. Round 3's Decision 4 ("The checks in `resolveWith` still hold that second resolve to its own tasks") stands for the accept half and is replaced for the fix half.
    - *Leaving such a finding out of both checks* was the recommendation and was not taken: it leaves one place that decides, and a task written against an accept would then wait for the plan approver's next pass.
    - *Reading both checks from the round's list* was not taken: for such a finding the list the checks would read is the one the hold has just passed with the same test, so neither could ever fire.
15. **(c) What the answers make unnecessary is removed here, and every case is kept.** Under b, nothing: R3-4's set-once filter and its `resolveFilesAt` mock key are what the change and its cases stand on. Under a, four pieces of code did part of what the normaliser does whole:
    - `cleanPaths`' chain of replaces (R1-6, R2-2) becomes a list reader built on the normaliser;
    - `planPaths`' own root strip (older than the pull request) is replaced by it;
    - `relPath` (#49, moved by R2-2) has no caller left and is deleted;
    - R3-3's second, as-written reading in `ruleForPaths` goes: the directory mark (decision 19) keeps a directory's trailing slash under its rule, which was that reading's purpose.

    Every case rounds 1 to 3 added stays unedited and now proves the normaliser for its form, as #112's `hgit` cases did for the prefix drop. One wording pin follows its sentence: the `docs/contract.md` phrase "read as listed and also as the run keeps a task" is reworded, so its check reads the new phrase. Nothing else is trimmed. Three kinds of path that the as-written reading left to the person by accident of their text no longer are; the table shows each: `config/project/../other.yaml` and `config/project/sub/../../other.yaml` (the guard allows the write, it is `config/other.yaml`), `/etc/a.secret.yaml` under a rule with no slash (outside the repository, where the guard reads no rule), and `config/project/..` (decision 16).
16. **(c, rider) The drafted issue says that `config/project/..` was left to the person before this change,** by the as-written reading, and no longer is, so whoever picks the issue up restores it with the rest.
17. **The reading of decision 12 for a `..` segment.** A file entry folds: `app/sub/../x.php` is `app/x.php`, one named file. A directory entry that holds a `..` segment (`app/sub/../`, `app/sub/..`) is dropped with a warning, never written as `app/`: that is the one fold that makes a prefix broader than the text the agent wrote. An entry is a prefix only when the agent wrote it as a directory. Every drop from `planPaths` (the root, above it, elsewhere, a directory through `..`) is warned about by name, since a narrower list can fail the gate and the person should see why. A blank is dropped with no warning: it names nothing.
18. **A path outside the repository stays in a file list,** in its absolute folded form (`../x.php` under `/r` is `/x.php`). It equals no repository file and is under no rule, as the guard reads it (no rule, and the write refused as outside the role's prefixes). It is not dropped, so a list that holds only such a path is still shown as holding it.
19. **"Written as a directory" is one test:** the trimmed text ends in `/`, `/.` or `/..`. A file list drops the mark, as now (R2-2's `./app/x.php/` case). The rules test the path and the path with a slash. `planPaths` writes the path with a slash, subject to decision 17.
20. **The shaper's `files` are rewritten once, where the shape is taken in** (`vetShape`, straight after `forceAskRules`, which needs the directory mark from the text as written), and only where `files` is a list. Every later reader then sees one form: `shaperFiles`, `effectiveDispositions`, the stops' `shaped`, the reshape's compare. No reader is left to forget, which is what the class rule asks for (`workflow/agents.md`, line 10: a mechanism that needs no list). This is R4-4's fix.
21. **The reviewer's file is normalised where it is matched or compared** (`ruleOf`, and the fix-diff compare against the previous round's plan paths) and shown as the reviewer wrote it. The posted text and GitHub's placement read it as written, `redline-gh.sh place` matches it against the diff's own names, and `scripts/` is not touched.
22. **Two differences from the guard stay, and the table says why.**
    - *Padding is trimmed.* The guard takes a target literally, since a file name may hold a space. A path in an agent's JSON is not a file name yet, and a padded one that the trimmed reading puts under a rule is left to the person, which only ever asks more.
    - *No symlinks.* The guard resolves a target (`realpath`, 521). The workflow reads no disk. `docs/contract.md` says the guard alone catches a path that reaches a rule through a link.

    Case is not a difference: both sides fold it for the rules, and the workflow folds it nowhere else, since git's paths are case-sensitive.
23. **A pin that held before the change is seen red under a mutation** (`testing/tests.md`, line 35): decision 14's accept case and its first-resolve neighbour, the trailing-slash neighbour, the not-left pins of decision 13, and the never-widen property of decision 12.
24. **Where this touches what an out-of-scope issue describes, it is left:**
    - #116 and #117 describe `resumeLine`'s text for the hold's stop and for the other shape-stage stops. R4-1 adds one closing clause to the hold's own sentence and changes nothing else in that function.
    - #104 describes a draft's version being counted over its issue text and not over what its stop shows. After decision 20 a shaper deferral's `files` at a draft stop can read differently (folded, or none for a blank) with no new version. The version rule is not touched.
    - #115, #105 and #109 are not touched: `effectiveDispositions` is not edited (decision 20 changes what it is handed), the unattended section's return example is not edited, and no deferred entry is removed from a `shape.md`.
    - The paths ask rules on a resolve's task: `forceAskRules` still never reads a resolve's tasks.

### Proportionality

- **R4-2.** It needs an agent to write a path with `..` in it, or a trailing `/.`. Unusual. When it fires on a decided list, a reshape that changed nothing is warned about as a change and the unfolded path is stored and shown. When it fires under a paths rule, a task under the rule is not left to the person, the guard refuses the write, the implementer reports blocked and the round stops at implement, which cannot replan. The fix is one function in code the pull request wrote, and the cases. In proportion, and the table is what keeps it from being a fifth round.
- **R4-3.** It needs a task that lists a directory under a paths rule in a non-standard spelling. Rare. When it fires, the same stop at implement. The cause is round 3's own fix. The same function settles it.
- **R4-4.** It needs a shaper that returns a blank path, which its schema allows. Rare. When it fires, a deferral is shown as shipping a planned change that does not exist, a warning names a mitigation in no file, and the plan approver can bounce a plan on a list no reshape can settle. The cause predates the pull request (#97, #100), and the pull request's own standard sentence says the list is read through one cleanup. The fix is one loop where the shape is taken in. In proportion.
- **R4-5.** It needs a reshape that returns a judgment call for a finding the person overrode to a fix, against its prompt, and a second resolve that does not restate the task. Rare. When it fires, a spurious stop at resolve, which a resume recovers from. The cause is round 3's fix. The change is one condition. In proportion.

### Noted, not in scope

- **The rule's root** (decision 13): `config/project` with no slash, `config/`, `config`, `config/project/..` and the repository root itself. The drafted issue is under "For you to open".
- **A path that reaches a rule only through a symlink** (decision 22). The guard refuses the write; the workflow does not leave the task to the person first.
- **A fix whose only file is outside the repository** (decision 18) still counts as a task with files and goes on to the build, where the guard refuses the write. It was so before this change, in the form the agent wrote.
- **The reviewer's file as shown** (decision 21): a reviewer that writes `./app/x.php` is posted so, and GitHub may not anchor its comment. `redline-gh.sh place` is under `scripts/`.
- **`args.files` and a resume's `hand.paths`** are read from git by the skill, not written by an agent, and are not read through the normaliser.

## The readers

Every place `workflows/redline-loop.js` reads a path, or a list of paths, that an agent returned. Line numbers are at `4200467`.

| Reader | What it reads | What it does with it | Reads it through, today | After |
|---|---|---|---|---|
| `taskFilesOf` (498), from `resolveWith` (3987) | a resolve's `tasks[].files` for one finding | counted (the stated and named checks, 3993-4010), shown (the accept stops' messages), stored (`decidedFiles`, 4016-4018) | `cleanPaths` | `cleanPaths`, built on the normaliser |
| the reshape's update (4143-4154) | a reshape's `files` for a decided finding | compared with the stored list, stored, shown (the change warning; `reshapedTasks` in the approve stop's detail) | `cleanPaths` | the same |
| the hold (4166-4175), `plannedFiles` for a decided finding (4045), and through it `effectiveDispositions` (4030), `draftView` (3530) and the push-time warnings (4369-4380) | the stored list | counted, shown to the plan approver and the implementer, shown at a draft stop | already cleaned when stored | the same |
| `forceAskRules` (3349), through `ruleForPaths` (543) | the reviewer's file, and the shaper's or a reshape's `files` for every finding | matched against the paths rules | two readings: `relPath` as written, and `cleanPaths` | the normaliser: one reading, and the path with a slash when written as a directory |
| `ruleOf` (558), through `ruleForPaths` | the reviewer's file | matched (the review's "left to" marks, 1154 and 1378) | the same two readings | the same one reading |
| `shaperFiles` (3761), through `plannedFiles` for a deferral nobody decided | the shaper's `files` for its own deferral | counted (`draftView`'s `ships`, 3531; the push-time warnings, 4370), shown (a draft's `files`; the warning's text) | as written | cleaned where the shape is taken in |
| `effectiveDispositions` (4030) for a finding nobody decided; `record.dispositions` (3726); the stops' `shaped` (3784, 3813, 4200) | the shaper's `files` | shown to the plan approver (4103), the implementer (4288) and, at a stop, the person | as written | cleaned where the shape is taken in |
| `planPaths` (4221) | the plan approver's `planPaths` | stored (`record.planPaths`, 4225; `approvedPaths`, 4226), written into the snapshot's `plan_paths` (4234), which `checks.sh` reads as the allowed list, shown to the implementer (`allowed`, 4289), matched (`octane`, 4241) | the root taken off, nothing else | the normaliser, a directory written with its slash, with the drops of decisions 12 and 17 |
| the fix-diff compare (5200), `underPaths` (2645) | the reviewer's file, against the previous round's plan paths | compared | as written | the file through the normaliser |
| the reviewer's file everywhere else (the review's lines, 1157 and 1164; an inline comment's `path`, 2977; a drafted issue's Where line, 1414; the prior-findings lists, 1700-1703) | the reviewer's file | shown, and placed by GitHub | as written | unchanged (decision 21) |

Paths an agent relays or reports, which are not a task's paths. Each is compared with a path the workflow itself built, or is git's own output, and none is read through the normaliser:

| Reader | What it reads | What it does with it | Why it is left |
|---|---|---|---|
| `vetShape` (3711) | the shaper's `specFolder` | trailing slashes taken off, compared with the round's folder, a mismatch warned about | the workflow gave the shaper the folder; the compare is against that text |
| `checkSpec` (3304-3305) | the spec-status operation's `files` and `headings` | trimmed, compared with `<specFolder>/<name>` | `git grep`'s output for a path the prompt named |
| `commitRecord` (4958) | the record-status operation's `files` | trimmed, a blank dropped, tested against the record's folders | `git status`'s output |
| `judge` (2589-2594) | the gate's `unexpected_files` and `uncommitted` | compared with a resume's hand paths, shown | `checks.sh`'s output, git's own names |
| `handoffComment` (4511) | the PR body operation's `file` | the root taken off, shown in the handoff comment | a path the prompt named |

## The table

Measured on 2026-11-21 at `4200467` by a throwaway script. The workflow's functions (`relPath`, `cleanPaths`, `globToRegExp`, `ruleForPaths`, `underPaths`) were lifted from the source as it stood and run under node 22.23.2 with the repository root `/r`, the harness's own. The guard was run as it stands, as the implementer's `Write`, on its harness's ask-rules fixture (`~/.cache/redline/guard-test-askrules`: the rules `config/project/**` and `*.secret.yaml`, and a link `cfg` to `config/project`), with no log written; a form written under `/r` was given to the guard under the fixture's own root. "Guard reads it as" is the two calls the guard makes on a target, `os.path.normpath(os.path.join(repository, target))` and then `os.path.relpath` (lines 518 and 394), under Python 3.14.7. The "after" side of each cell is the draft of the normaliser, run on the same forms; `plan.md`'s As built records the same script run against the code as built.

How to read it:

- A cell `a → b` is what the reader made of the form before and after. `, same` means no change.
- The shaper's own list is read as written today, so its "before" is the form itself.
- In the `planPaths` column, `dropped (...)` is an entry left out of the list, with the reason its warning gives; a blank is dropped with no warning.
- In the rules table, "left to the person" is `ruleForPaths` returning the rule. "Agree after" compares that with whether the guard refuses the write under the rule or as holding its files. Each **no** is one of the differences decisions 13 and 22 record.

What it found:

- The decided list folded every form but `..` and a trailing `/.`, which it kept as written (R4-2), and it kept `/r` and `app/..`, the root itself, as a file.
- The rules missed a directory written with `//`, an inner `./` or padding (R4-3), `..` into a rule and `..` out and back in (R4-2), and left to the person, by accident of their text, paths the guard does not read as under the rule (decision 15).
- The shaper's own list folded nothing: a blank counted as a file (R4-4).
- `planPaths` took the root off and folded nothing else, so an entry written `app//x.php` named no file the gate would see changed, and the fix-diff compare missed `./app/x.php`.
- Where the guard and the workflow still differ after: padding (two rows), a link (one row) and the rule's root (five rows).

### Forms, file lists and the plan approver's list

| Form | As written | Guard reads it as | Guard | Decided list (`cleanPaths`) | Shaper's own list | `planPaths` |
|---|---|---|---|---|---|---|
| blank | `""` | (none) | refused: no target | `[]`, same | `[""]` → `[]` | `""` → `"dropped (blank)"` |
| whitespace | `"  "` | (taken as a file name) | allowed | `[]`, same | `["  "]` → `[]` | `"  "` → `"dropped (blank)"` |
| leading `./` | `"./app/x.php"` | `app/x.php` | allowed | `["app/x.php"]`, same | `["./app/x.php"]` → `["app/x.php"]` | `"./app/x.php"` → `"app/x.php"` |
| the root as a prefix | `"/r/app/x.php"` | `app/x.php` | allowed | `["app/x.php"]`, same | `["/r/app/x.php"]` → `["app/x.php"]` | `"app/x.php"`, same |
| the root, then `./` | `"/r/./app/x.php"` | `app/x.php` | allowed | `["app/x.php"]`, same | `["/r/./app/x.php"]` → `["app/x.php"]` | `"./app/x.php"` → `"app/x.php"` |
| the root, then `//` | `"/r//app/x.php"` | `app/x.php` | allowed | `["app/x.php"]`, same | `["/r//app/x.php"]` → `["app/x.php"]` | `"/app/x.php"` → `"app/x.php"` |
| `//` | `"app//x.php"` | `app/x.php` | allowed | `["app/x.php"]`, same | `["app//x.php"]` → `["app/x.php"]` | `"app//x.php"` → `"app/x.php"` |
| an inner `./` | `"app/./x.php"` | `app/x.php` | allowed | `["app/x.php"]`, same | `["app/./x.php"]` → `["app/x.php"]` | `"app/./x.php"` → `"app/x.php"` |
| a trailing slash | `"app/x.php/"` | `app/x.php` | allowed | `["app/x.php"]`, same | `["app/x.php/"]` → `["app/x.php"]` | `"app/x.php/"`, same |
| a trailing slash, a directory | `"app/sub/"` | `app/sub` | allowed | `["app/sub"]`, same | `["app/sub/"]` → `["app/sub"]` | `"app/sub/"`, same |
| leading `./` and a trailing slash | `"./app/x.php/"` | `app/x.php` | allowed | `["app/x.php"]`, same | `["./app/x.php/"]` → `["app/x.php"]` | `"./app/x.php/"` → `"app/x.php/"` |
| a trailing `/.` | `"app/x.php/."` | `app/x.php` | allowed | `["app/x.php/."]` → `["app/x.php"]` | `["app/x.php/."]` → `["app/x.php"]` | `"app/x.php/."` → `"app/x.php/"` |
| a trailing `/.`, a directory | `"app/sub/."` | `app/sub` | allowed | `["app/sub/."]` → `["app/sub"]` | `["app/sub/."]` → `["app/sub"]` | `"app/sub/."` → `"app/sub/"` |
| `..` inside | `"app/sub/../x.php"` | `app/x.php` | allowed | `["app/sub/../x.php"]` → `["app/x.php"]` | `["app/sub/../x.php"]` → `["app/x.php"]` | `"app/sub/../x.php"` → `"app/x.php"` |
| `..` inside, after `./` | `"./app/../app/x.php"` | `app/x.php` | allowed | `["app/../app/x.php"]` → `["app/x.php"]` | `["./app/../app/x.php"]` → `["app/x.php"]` | `"./app/../app/x.php"` → `"app/x.php"` |
| `..` inside, a directory | `"app/sub/../"` | `app` | allowed | `["app/sub/.."]` → `["app"]` | `["app/sub/../"]` → `["app"]` | `"app/sub/../"` → `"dropped (a directory through ..)"` |
| a trailing `/..` | `"app/sub/.."` | `app` | allowed | `["app/sub/.."]` → `["app"]` | `["app/sub/.."]` → `["app"]` | `"app/sub/.."` → `"dropped (a directory through ..)"` |
| `..` out and back in | `"../r/app/x.php"` | `app/x.php` | allowed | `["../r/app/x.php"]` → `["app/x.php"]` | `["../r/app/x.php"]` → `["app/x.php"]` | `"../r/app/x.php"` → `"app/x.php"` |
| the root, `..`, the root | `"/r/../r/app/x.php"` | `app/x.php` | allowed | `["../r/app/x.php"]` → `["app/x.php"]` | `["/r/../r/app/x.php"]` → `["app/x.php"]` | `"../r/app/x.php"` → `"app/x.php"` |
| `..` climbing above | `"../x.php"` | `../x.php` | refused: outside the write prefixes | `["../x.php"]` → `["/x.php"]` | `["../x.php"]` → `["/x.php"]` | `"../x.php"` → `"dropped (outside)"` |
| `..` climbing above, from inside | `"app/../../x.php"` | `../x.php` | refused: outside the write prefixes | `["app/../../x.php"]` → `["/x.php"]` | `["app/../../x.php"]` → `["/x.php"]` | `"app/../../x.php"` → `"dropped (outside)"` |
| an absolute path elsewhere | `"/etc/x.php"` | `../../../../../etc/x.php` | refused: outside the write prefixes | `["/etc/x.php"]`, same | `["/etc/x.php"]`, same | `"/etc/x.php"` → `"dropped (outside)"` |
| the root itself: `.` | `"."` | `.` | refused: holds the files of rule craft-config | `[]`, same | `["."]` → `[]` | `"."` → `"dropped (the root)"` |
| the root itself: `./` | `"./"` | `.` | refused: holds the files of rule craft-config | `[]`, same | `["./"]` → `[]` | `"./"` → `"dropped (the root)"` |
| the root itself: the root | `"/r"` | `.` | refused: holds the files of rule craft-config | `["/r"]` → `[]` | `["/r"]` → `[]` | `"/r"` → `"dropped (the root)"` |
| the root itself: the root and a slash | `"/r/"` | `.` | refused: holds the files of rule craft-config | `[]`, same | `["/r/"]` → `[]` | `""` → `"dropped (the root)"` |
| the root itself: `app/..` | `"app/.."` | `.` | refused: holds the files of rule craft-config | `["app/.."]` → `[]` | `["app/.."]` → `[]` | `"app/.."` → `"dropped (the root)"` |
| padding | `" app/x.php "` | ` app/x.php ` | allowed | `["app/x.php"]`, same | `[" app/x.php "]` → `["app/x.php"]` | `" app/x.php "` → `"app/x.php"` |
| standard | `"app/x.php"` | `app/x.php` | allowed | `["app/x.php"]`, same | `["app/x.php"]`, same | `"app/x.php"`, same |
| another case | `"App/X.php"` | `App/X.php` | allowed | `["App/X.php"]`, same | `["App/X.php"]`, same | `"App/X.php"`, same |

### Forms under a paths rule (`config/project/**`, `*.secret.yaml`)

| Form | As written | Guard reads it as | Guard | Rules today | Rules after | Agree after |
|---|---|---|---|---|---|---|
| standard, a file | `"config/project/project.yaml"` | `config/project/project.yaml` | refused: under rule craft-config | left to the person (craft-config) | left to the person (craft-config) | yes |
| padding | `" config/project/project.yaml "` | ` config/project/project.yaml ` | allowed | left to the person (craft-config) | left to the person (craft-config) | **no** |
| leading `./` | `"./config/project/project.yaml"` | `config/project/project.yaml` | refused: under rule craft-config | left to the person (craft-config) | left to the person (craft-config) | yes |
| the root as a prefix | `"/r/config/project/project.yaml"` | `config/project/project.yaml` | refused: under rule craft-config | left to the person (craft-config) | left to the person (craft-config) | yes |
| `//` | `"config//project/project.yaml"` | `config/project/project.yaml` | refused: under rule craft-config | left to the person (craft-config) | left to the person (craft-config) | yes |
| an inner `./` | `"config/./project/project.yaml"` | `config/project/project.yaml` | refused: under rule craft-config | left to the person (craft-config) | left to the person (craft-config) | yes |
| a trailing slash on a file | `"config/project/project.yaml/"` | `config/project/project.yaml` | refused: under rule craft-config | left to the person (craft-config) | left to the person (craft-config) | yes |
| a trailing `/.` on a file | `"config/project/project.yaml/."` | `config/project/project.yaml` | refused: under rule craft-config | left to the person (craft-config) | left to the person (craft-config) | yes |
| a directory, standard | `"config/project/"` | `config/project` | refused: holds the files of rule craft-config | left to the person (craft-config) | left to the person (craft-config) | yes |
| a directory, `//` | `"config//project/"` | `config/project` | refused: holds the files of rule craft-config | not left | left to the person (craft-config) | yes |
| a directory, an inner `./` | `"config/./project/"` | `config/project` | refused: holds the files of rule craft-config | not left | left to the person (craft-config) | yes |
| a directory, padding | `" config/project/ "` | ` config/project/ ` | allowed | not left | left to the person (craft-config) | **no** |
| a directory, the root as a prefix | `"/r/config/project/"` | `config/project` | refused: holds the files of rule craft-config | left to the person (craft-config) | left to the person (craft-config) | yes |
| a directory, a trailing `/.` | `"config/project/."` | `config/project` | refused: holds the files of rule craft-config | left to the person (craft-config) | left to the person (craft-config) | yes |
| a directory below the root of the rule | `"config/project/sub/"` | `config/project/sub` | refused: under rule craft-config | left to the person (craft-config) | left to the person (craft-config) | yes |
| a directory, `..` inside | `"config/other/../project/"` | `config/project` | refused: holds the files of rule craft-config | not left | left to the person (craft-config) | yes |
| a directory, a trailing `/..` back to it | `"config/project/sub/.."` | `config/project` | refused: holds the files of rule craft-config | left to the person (craft-config) | left to the person (craft-config) | yes |
| `..` into the rule | `"app/../config/project/x.yaml"` | `config/project/x.yaml` | refused: under rule craft-config | not left | left to the person (craft-config) | yes |
| `..` inside the rule | `"config/project/../project/x.yaml"` | `config/project/x.yaml` | refused: under rule craft-config | left to the person (craft-config) | left to the person (craft-config) | yes |
| `..` out of the rule | `"config/project/../other.yaml"` | `config/other.yaml` | allowed | left to the person (craft-config) | not left | yes |
| `..` out of the rule, twice | `"config/project/sub/../../other.yaml"` | `config/other.yaml` | allowed | left to the person (craft-config) | not left | yes |
| `..` out and back in | `"../r/config/project/x.yaml"` | `config/project/x.yaml` | refused: under rule craft-config | not left | left to the person (craft-config) | yes |
| `..` climbing above | `"../config/project/x.yaml"` | `../config/project/x.yaml` | refused: outside the write prefixes | not left | not left | yes |
| an absolute path elsewhere | `"/etc/config/project/x.yaml"` | `../../../../../etc/config/project/x.yaml` | refused: outside the write prefixes | not left | not left | yes |
| elsewhere, under a rule with no slash | `"/etc/a.secret.yaml"` | `../../../../../etc/a.secret.yaml` | refused: outside the write prefixes | left to the person (yaml-anywhere) | not left | yes |
| inside, under a rule with no slash | `"app/a.secret.yaml"` | `app/a.secret.yaml` | refused: under rule yaml-anywhere | left to the person (yaml-anywhere) | left to the person (yaml-anywhere) | yes |
| another case | `"Config/Project/x.yaml"` | `Config/Project/x.yaml` | refused: under rule craft-config | left to the person (craft-config) | left to the person (craft-config) | yes |
| a path that folds to one outside the rule | `"config//project.yaml"` | `config/project.yaml` | allowed | not left | not left | yes |
| the root of the rule, no trailing slash | `"config/project"` | `config/project` | refused: holds the files of rule craft-config | not left | not left | **no** |
| a directory above the root of the rule | `"config/"` | `config` | refused: holds the files of rule craft-config | not left | not left | **no** |
| above the root of the rule, no slash | `"config"` | `config` | refused: holds the files of rule craft-config | not left | not left | **no** |
| a trailing `/..` to above the root of the rule | `"config/project/.."` | `config` | refused: holds the files of rule craft-config | left to the person (craft-config) | not left | **no** |
| the root itself | `"."` | `.` | refused: holds the files of rule craft-config | not left | not left | **no** |
| through a symlink (`cfg` → `config/project`) | `"cfg/x.yaml"` | `cfg/x.yaml` | refused: under rule craft-config | not left | not left | **no** |

### The fix-diff compare (`underPaths`), the reviewer's file against a plan entry

| Reviewer's file | Plan entry as the approver wrote it | Today | After |
|---|---|---|---|
| `"app/x.php"` | `"app/x.php"` | true | true |
| `"app/x.php"` | `"./app/x.php"` | false | true |
| `"app/x.php"` | `"app//x.php"` | false | true |
| `"app/x.php"` | `"/r/app/x.php"` | true | true |
| `"app/x.php"` | `"app/"` | true | true |
| `"app/x.php"` | `"./app/"` | false | true |
| `"app/x.php"` | `"app"` | false | false |
| `"app/x.php"` | `"app/sub/../x.php"` | false | true |
| `"./app/x.php"` | `"app/x.php"` | false | true |
| `"/r/app/x.php"` | `"app/"` | false | true |
| `"app.php"` | `"app/"` | false | false |

## Prompts that change

- **R4-1.** The resume line of a reshape resumed after the hold's stop gains one closing clause. A resume's prompt is never a cached one: a resume changes exactly that prompt (`workflow/replay.md`).
- **R4-6.** The hold's error text when one reshape breaks a decided fix and a decided accept together, which that reshape's resume line quotes. Each single-kind message is byte-identical.
- **The path class.** No prompt gains or loses a sentence. A prompt's bytes change only in a run where an agent returned a path the normaliser now reads differently: `..` or a trailing `/.` in a decided list; for the shaper's own list, any non-standard form, a trailing slash or the same path twice; for `planPaths`, any non-standard form in the snapshot's `plan_paths`.
- **R4-5.** None. One stop no longer happens.

The proof is in the loop test: its prompt pins and its relaunch checks (`samePrefix`) stay green unedited, and the sweep `testing/tests.md` line 36 asks for runs every scenario under the script as it read at `4200467` and as built and compares every call's label, prompt and options. `plan.md`'s As built records the counts and explains every scenario that differs.

## For you to open

Drafted for @michaelfromtheoutfit to open; nothing in this spec builds it (decisions 13 and 16).

**Title:** Leave a task to the person when it lists a paths rule's root or a directory above it

**Found.** A `paths` ask rule is enforced twice: the guard refuses a write under one of its globs, and the workflow leaves a finding to the person when its file, or a file its task would touch, matches. The guard has a second test the workflow lacks. Under `config/project/**` it refuses a write to `config/project`, `config/` and `config`, as a target that "holds the files of" the rule (`ask_rule` in `scripts/redline-guard.sh`, with `glob_root`), which is how `rm -rf config` is stopped. The workflow's `ruleForPaths` has only the glob. It leaves a task to the person when the task lists `config/project/` (a trailing slash marks a directory, and the glob covers what is in it), and does not when the task lists `config/project` with no slash, `config/`, `config`, or the repository root. Such a task is planned as a fix, the guard refuses the write, the implementer reports blocked and the round stops at implement, which cannot replan; the plan approver's own rule may bounce it first.

One form was left to the person before the #114 round 4 follow-up and no longer is: `config/project/..`. Until then `ruleForPaths` also read a path as written, and the text `config/project/..` matched `config/project/**` by accident. The path is `config`, the directory above the rule's root, so it belongs with the rest of this issue: whoever picks this up restores it with them. `tests/loop-test.mjs` pins all four as not left, under a comment that names this issue.

**Why it was not fixed there.** It predates that pull request (#49), no finding named it, and it is not a way of writing a path: it changes which tasks the workflow asks about, including one that lists `config/` and touches only `config/app.php`.

**The fix proposed.** Give the workflow the guard's second test: a `globRoot` beside `globToRegExp`, the literal leading segments of a pattern, pinned by the same cases on both sides as the glob dialect is, and `ruleForPaths` returning the rule when a path is that root or a directory above it. Decide first whether a directory above the root should ask every time, or only when the task lists it as a directory.

## For you to decide when the replies are shown

Whether the five threads are resolved after the replies. `scripts/redline-gh.sh resolve-threads 114 <the five comment ids> <the five reply ids>` resolves a thread only when every comment in it is Redline's. R4-4 has no thread.

## Standards retrospective (proposed)

Gate step 12, item by item: the decisions above, the As built deviations, and the checks that went red. Drafted while shaping and redrafted after the build, which taught E7.

**Already in a standard:**

- Decision 2 (a class settled once, with a table of every reader in `shape.md`, and a mechanism that needs no list): `workflow/agents.md`, line 10.
- Decision 5 (a resume changes exactly one prompt; a claim of byte-identical prompts is proven by a sweep as well as a check): `workflow/replay.md`, line 19; `testing/tests.md`, line 36.
- Decision 6 (red before green; the version kept in a round of the same pull request): `testing/tests.md`, line 35; `process/release.md`.
- Decision 8 (replies in Redline's form): `workflow/agents.md`, the line on a disposition's evidence.
- Decision 10: `prompts/attribution.md`.
- Decision 15 (the earlier rounds' cases kept unedited as the proof of the new mechanism): `workflow/agents.md`, line 10, as #112 did.
- Decision 23 (a pin that held before is seen red under a mutation): `testing/tests.md`, line 35.
- Task 3's case-fold pin, which a mutation found missing after `ruleForPaths`' loop was rewritten (a rewritten clause is listed with every exclusion the clause it replaces carried, each pinned): `testing/tests.md`, line 30.
- A mutation that crashed the harness in an existing check and was replaced by one that does not (a run that prints no count crashed and is reported so): `testing/tests.md`, line 14.
- Task 6's sentence in `docs/running.md` (an exception a change adds to a rule is stated wherever the rule is): `workflow/agents.md`, line 17.

**Missing or contradicted**, each drafted as the text to land:

- **E1**, `workflow/agents.md`, line 50, contradicted (decisions 9, 11, 15, 18 to 20): "read through one cleanup before it is compared, stored or counted" did not hold for the shaper's own list, the plan approver's list or `..`, and "which reads both forms" is no longer what the rules do. The line's tail, from `; and a list of paths an agent returns` to its end, is replaced by:

  ```
  ; and a path an agent returns for a task is read through one function before it is compared, stored, counted, shown or matched (`repoPath`), which reads it as the guard reads the target of a write: trimmed, joined to the repository root, repeated slashes, `./` and `..` segments and a trailing `/` or `/.` folded, and the root taken off, so one file written two ways is one file, a blank or the root itself is no file, and a path outside the repository is kept, absolute, and equals none. Every list goes through it where it is taken in: a resolve's tasks and a reshape's list for a decided finding (`cleanPaths`), the shaper's own list for every finding (`vetShape`, after the paths rules have read it), the plan approver's list (`planEntry`), and the reviewer's file where it is matched or compared. A path written as a directory (it ends in `/`, `/.` or `/..`) keeps that mark where a directory means something: the paths rules match it with its slash, and the plan approver's list writes it as a prefix. Two things differ from the guard on purpose, padding (trimmed here, literal there) and symlinks (the workflow reads no disk), and one by omission: a rule's own root, or a directory above it, which the guard refuses and the workflow does not leave to the person (the issue drafted in the #114 round 4 by-hand spec). It took four rounds of #114 to get here, a form or a reader at a time: a reshape's `./app/x.php` was warned about as a change from the resolve's `app/x.php`, and `['']` passed the hold that stops a decided fix with no files (R1-6); the cleanup took off the root or a leading `./`, never both, and kept `app//x.php`, `app/./x.php` and a trailing slash as written (R2-2); the paths rules matched the list as written while the round kept it folded, so `app//billing/x.php` under `app/billing/**` was never left to the person (R3-3, which read both forms); and `..` and a trailing `/.` were still kept as written, a directory written `config//project/` was under neither reading, and the shaper's own list and the plan approver's were read as written, so `['']` counted as a planned mitigation (R4-2 to R4-4), until the round finished by hand set every reader against every form and against the guard, by running them, and put the one function in their place
  ```

- **E2**, `workflow/agents.md`, line 10, missing (decision 2). Appended after `(#114, R1-7)`:

  ```
  ; and a class of the kind "the same thing is read two ways" is settled against the component that has the last word on it (the guard decides a write), with a column for that component in the table, each cell measured by running the code, never traced, and each row where the two still differ saying why: #114's first three rounds each set one path reader against the forms its finding named, and the table set every reader against every form and the guard's reading of it (#114, R4-2 to R4-4)
  ```

- **E3**, `workflow/agents.md`, line 47, missing (decision 14). Appended after `until #114, R3-4`:

  ```
  ; and a change that stops reading an agent's output for one purpose revisits, in the same change, every check that still demands that output: R3-4 stopped setting the list from a second resolve's tasks and left the named-fix check demanding a task of that resolve, a stop for a task the list held, until #114, R4-5, which drops that demand for a finding that already has a list and keeps the accept check on what that resolve itself returned, since a task with files written for an accepted finding is that resolve's own contradiction
  ```

- **E4**, `workflow/agents.md`, line 47, missing (decisions 12 and 17). Appended after E3's clause:

  ```
  ; and a list the workflow passes on as a permission (the plan approver's paths, which become the gate's allowed list) is never made broader by reading it more kindly: an entry the reading would turn into the repository root, a path outside the repository or a prefix wider than any the agent wrote out (a directory through a `..` segment) is left out and warned about by name, and a case pins that no entry is a prefix the agent did not write (the #114 round 4 by-hand spec)
  ```

- **E5**, `workflow/replay.md`, line 19, missing (R4-6, R4-1). Appended after `keeps the shaper's sentence (#106)`:

  ```
  ; and a stop whose resume line tells the rerun to correct what the error names names every failure of its check in one error, since each one it leaves out is one more relaunch: the hold after a reshape named only the fixes left with no task when the same reshape also gave an accepted finding one, until #114, R4-6; and a resume sentence that states an exception restates the rule it leaves standing: the correct-in-place sentence left out the from-scratch sentence's ban on touching `redline/`, until #114, R4-1
  ```

- **E6**, `workflow/agents.md`, line 17, missing (R4-1). Appended after `until #114, R3-2`:

  ```
  ; and an exception written straight after two rules says which one it lifts: rule 9 of the shaper's file put "The one exception" after the sentence that bans touching `redline/`, where it could be read as lifting that ban too, until #114, R4-1
  ```

- **E7**, `testing/tests.md`, line 36, missing (As built, Task 8). Appended at the end of the line:

  ```
  ; and the sweep runs the whole harness once under each script and compares the two records, never both scripts inside one `go()`: the mock consumes what a scenario holds (the heads a gather reads, a filed record kept across launches), so a second run in the same process showed 11 scenarios as differing that were identical (the #114 round 4 by-hand spec: 618 scenarios, 590 identical, the 28 that differ being 25 of the spec's own cases and 3 earlier ones, two that script a path the shaper's list now folds and one that reads the resume line R4-1 changed)
  ```

No pattern is used that the standards do not hold. No heading changes, and `index.yml` is unchanged.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md:15`: "Every verified item is decided, and the real decisions stay with people." A finding under a repository rule stays the person's however its path is written (R4-2, R4-3). A decision the person made is held to its task in the place that can replan (R4-5, R4-6). What the person is shown about a deferral is what the round planned (R4-4).

## Standards Applied

- process/docs-gate — every touched plugin file names its README or `docs/` section, or says why there is no reader-facing change.
- process/standards-retrospective — the gate's step 12; a round finished by hand still owes its record in the same pull request, in its own commit.
- process/release — the version stays 0.4.4 on purpose (decision 6).
- prompts/attribution — the commits, the spec and the six replies carry no model or vendor name (decision 10).
- scripts/guard — the guard is the reference and is not changed, so `tests/guard-cases.tsv` is not changed either.
- testing/tests — red before green, a mutation for a pin that cannot be red (line 35); a case per form, each turning on one clause (line 30); a check that fails and does not throw (line 14); the sweep behind a claim of byte-identical prompts (line 36).
- workflow/agents — a class settled by reader, with a mechanism that needs no list (line 10); a rule and its comments and docs changed together (line 17); the decided list set once and replaced by each reshape (line 47); a path list read through one cleanup (line 50).
- workflow/replay — a resume changes exactly one prompt, its sentence chosen by the stop; no prompt before a stopping point changes.
