# Standards for PR #97 Review Round 3

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `ff5b0a8`, before this round's retrospective. A short file is copied whole; for a long one, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did. One bullet of `testing/tests.md` names an escape that a tool call decodes when it is typed; it is copied with the escape spelled out in words.

---

## workflow/agents (applied bullets)

Line 9 (in part; the four endings, R3-2 and R3-3's deferrals):

- The shaper decides, and a person is asked in named cases only (#93): the verifier states what is true and the shaper sorts every finding into `fix`, `decline` (with the reason a teammate reads), `defer` or `ask`. Since #95 these are four endings, and `defer` is its own: an item of any kind that is worth doing and not in this pull request, with a mitigation only when a cheap one exists inside it, and always with a drafted issue (a title, what was found, why it is not fixed here, the fix proposed) that the run files; `decline` is for what is not worth doing (the claim is wrong, the conditions will not occur, the spec chose otherwise, or it could not be confirmed) and never points at follow-up work, so the proportionality rule and a refactor that fails a small-refactor test end in `defer`. It returns an `ask`, with a story, options and a recommendation, in five cases (the options differ in what the product does or a user sees; the fix changes an assumption, the approach or the architecture the spec agreed; it reaches outside the pull request; two options are defensible with no clear pick; the finding is still unconfirmed after the shaper's second look and serious if true), beside a repository ask rule and a finding on one of Redline's own files. Everything else it decides, a decline included, as `decided by: redline` with its reason. [...]

Line 16 (in part, its opening; R3-1):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted, and every other wording of the same rule (`not raised again`, `raises it again`) [...]; and a new disposition is added to every rule that lists the old ones, found by searching for the list itself (`fixed or deferred`): after #93 added decline, the ask-rules block still said a covered finding is 'never fixed or deferred by Redline' until #94, R4-2

Line 39 (in part, from its #94, R8-6 clause; R3-4, R3-5, R3-6):

- [...] and a finding whose call the person or autopilot decided is theirs in every list, whatever disposition a reshape later gives it: a stop's list of Redline's declines left out only a disposition override until #94, R8-6; and an outcome that changes after its round (a draft held to the end of the run, then filed or dropped) rewrites that round's outcome, its kind and its decided entry before Finish composes anything, so the handoff lists the item as what it became (#95); and a decided finding is a deferral only when its decision made it one: a `defer` override, or the resolve agent's own entry when that entry ships a mitigation or the finding has no planned task with files; a reshape's entry beside a decided call made it one, its fix commits zeroed and an issue filed for it, until #97, R1-10; the resolve prompt says when an entry is returned, since a stray mitigated entry beside a fix looks like a 'Mitigate' answer (#97, R2-15); and within one agent's list a finding has one deferred entry, the first returned, any later one dropped with a warning (the resolve agent's entry for a decided finding still replaces the shaper's, as above), and a task the shaper planned with files for its own deferral is a planned task, so its commit is never zeroed as shipping nothing (#97, R2-6, R2-12)

Line 40 (whole; R3-6):

- A value a later pass of a loop rebuilds keeps what an earlier pass recorded once the run rests on it: the round's commits read every implement attempt's report, not the repair's alone (#94, R7-9), and a repository rule's forced entry whose call is decided stands through a reshape (#94, R7-7); and what a round planned is read from every resolve it ran: a reshape that raised a call ran a resolve for that call alone and replaced the first one's tasks, so a stray entry beside the first resolve's fix was filed as a deferral and that task's commit was no longer demanded, until #97, R2-14

Line 43 (in part, the `postedText` rules; R3-3):

- [...] Every finder and verifier field the review body and the handoff post [...], and an inline comment's title, go through one function, `postedText`, with fields that share a line read as one text. Outside code spans, `&` then `<` are escaped, and `&#8288;`, the word joiner (U+2060) as a numeric character reference, follows each `@` before an ASCII letter or digit, so no tag ends the block or bolds the body and no `@word` notifies; GitHub decodes it, and outside a code span it shows nothing (the #87 follow-up spec). Spans are read as GitHub pairs backtick runs and left as written, unless the text holds `](`, `][`, `://`, `www.` (any case), a backslash before a backtick, a carriage return or a newline; such a text is escaped whole, and a backslash anywhere else, as in a namespace, changes no pairing and is no trigger (#89, R3-3). The workflow's own mentions, and shaper, person and implementer text, are posted as written. A comment's description and proposed fix, and every reply, are a known gap (#88). [...]

Line 44 (whole; Task 7's agent file):

- An agent file cannot be pinned: an agent type resolves only from the session's registry, read at session start (measured headless under --plugin-dir, 2.1.322), and a copy run without its type is `workflow-subagent` to the hook, outside the guard. A changed agent file is reported (the skill's line, the handoff comment), never worked around (#81)

Line 46 (whole; R3-5, a commit's `finding` is the implementer's report, matched against the gate's own list):

- A fact an agent states that changes what the run does is checked by the workflow against something the run itself recorded, and a claim it cannot honour is cleared with a warning before anything is posted; it is never trusted on its own and never inferred. The verifier's `inFixDiff` holds only on a round that read a fix diff and for a file under the paths the previous round's plan named, which each round keeps on its own record (`record.planPaths`), since the run's `approvedPaths` is every round's (#95)

Line 47 (whole; R3-3):

- Text is made safe for the surface that renders it, and the rule for a new surface comes from a measurement of that surface, recorded in the spec's Evidence, never from the Markdown specification: an issue's body goes through `postedText` field by field, though its words are the shaper's, since an issue is read where the pull request is not; its title is filed as written, made one line, with control characters removed and cut to 256 characters, since GitHub shows a title as plain text, decoding no entity and linking no `@word` (GraphQL `titleHTML`, read-only, #95); a value cleaned before it is used is cleaned before a fallback chooses between candidates, and the check that it is present reads it cleaned: a person's title of spaces won over the shaper's and filed `# `, and a shaper title of control characters passed the draft check, until #97, R1-8; and a text the session prints inside a fenced block is fenced with a run of backticks longer than any run in the text, since a draft's body can hold a code fence (#97, R2-3)

Line 49 (whole; R3-2):

- A field whose empty value means nothing is read by one function, which also reads as nothing the plain words for it a prompt beside the field invites: `hasMitigation` takes an empty string, `none`, `n/a`, `nothing`, `nothing ships`, `nothing ships now` and `no mitigation`, since the shape prompt asks the recommendation beside the mitigation field to say 'that nothing ships now', and another spelling demanded a commit the plan had no task for (#97, R1-7)

---

## workflow/replay (applied bullets)

Line 6 (whole; Task 3's prompt sentence, Task 4's shape call left as it is):

- Decisions, approved plans, selected findings and the answers to deferred drafts enter the workflow only after the prompt they answer (`args.decisions` after shaping, `args.approvedPlans` for the plan dial, `args.selected` for the review dial, `args.deferrals` at a stop check, at filing and in the text posted after it); a prompt before that point never mentions them; and a stop takes only a decision whose prompt comes after it, so a disposition override, which the round's first resolve applies, is taken only at a stop the round reaches before that resolve: a later stop of the round (a reshape after a bounced plan, a draft the resolve agent wrote) takes none and lists no declines (#94, R3-7, stated then as no plan approver having run; #95)

Line 21 (whole; the run caution):

- A relaunch runs the script the run launched with: by name while `workflows/redline-loop.js` is as launched, from the copy the harness persisted (as `scriptPath`) once it differs, which only the plugin's own repository can see (`redline-prefs.sh run drift`). Replay follows the prompt sequence: script path, script text outside the prompts, an agent's label and the agent file's body are not in the key. The `Workflow(<name>)` allow rule does not cover a `scriptPath` launch. Measured headless under `--plugin-dir` on 2.1.322 (#81)

---

## testing/tests (applied bullets)

Line 7 (whole; the scripted reshape and resolve agent of Tasks 4 and 6):

- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7; #37, R1-1); a reshape mock returns what the reshape prompt asks for, which leaves out a call the round already decided, or a check added to the reshape goes untested (#61, R1-2); it gives a field the shared checks read only when the reshape prompt asks for it (`secondLook`, #94, R9-3)

Line 10 (in part, its last sentence; R3-3's deferral):

- [...] The loop test cannot render, so a claim about what GitHub shows is checked once through `gh api markdown -f mode=gfm` on invented text and recorded in the spec (the #85 follow-up spec; #87)

Line 11 (whole, the escape spelled out in words; Task 2's em dash):

- An invisible or non-ASCII character a test or a fixture needs is written as its escape (backslash, `u`, `2060` in JavaScript and JSON source), never as the character itself. A bash harness compares it through `jq -a`, since bash 3.2 has no `$'\u…'`-style escape. A tool call that is given that escape typed writes the character, which no reader of the file can see, so check a new file with `grep` for the bytes before trusting a red run (#87, the gh harness's first red run).

Line 13 (whole; Task 5's neighbour):

- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site: #42's fix covered nine checks and scripted `'""'` at one, so a revert at the other eight stayed green (#43, R1-1); and a call site pinned only with input the function returns unchanged is not pinned: the handoff's Deferred line under a repository rule was checked with `title R1-2`, which `postedText` returns as it is, so dropping the call there stayed green until a title with a tag and an `@` was pinned (#89, R3-2)

Line 14 (whole):

- A check fails, it does not throw, when the run it reads took another path: a prompt or a body that may be absent is read as `''`, so a red run reports its count. A `TypeError` in one check hides every check after it (#93). A list that may be absent is read as `[]` for the same reason, and a mutation run that prints no count crashed: it is reported as a crash, and the scenario that threw is found before the mutation is called pinned (#95)

Line 15 (whole; Task 4's red run):

- A stage error is pinned by its `resumeFrom` label as well as its text, since the label is what a resume reruns: R1-13 moved a check after another agent's call and its As built called the label unchanged, which only a `resumeFrom` check would have caught (#94, R2-9); a call that returns nothing is scripted with the mock's `scenario.nothing` (a list of labels), since no per-agent override can return null through the mock's fallback, and the stop it causes is pinned by its label too (#94, R6-10)

Line 17 (whole; Task 7's statements check):

- The statements of the endings and the done rule that a person or an agent meets are pinned by key phrase in the loop test (#95): the README's opening and its Known limits entries, both plugin descriptions, the skill's description, the mission, the reviewer file's opening, the workflow's `meta.description` and the facts-only sentence of every review prompt. #79 left three of them on the old rule until a fifth round, and #93 left `meta.description` stale until #95

Line 28 (in part, its opening; Task 2's accepted and refused forms):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; a rule a spec states as a list of accepted and refused forms gets a case per form, each turning on one clause of the code and seen red under a mutation of that clause [...]; and a change that widens such a parse pins the form it still refuses beside the one it now accepts [...] (#86, R5-2)

Line 33 (whole):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)

---

## process/docs-gate (applied bullets)

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)
- In a Redline run the shaper writes them from the unattended section's point 7, so the round's commits carry the README or `docs/` edit; the plan approver bounces a plan missing one; the reviewer reports a change with no entry as a nit with the fix "update section X of the README" or of `docs/<file>`
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/release (applied bullet)

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)

---

## prompts/attribution (whole)

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
