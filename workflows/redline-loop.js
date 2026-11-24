export const meta = {
  name: 'redline-loop',
  description: 'Redline: review a pull request (the code-review skill finds, Redline\'s reviewer verifies), post the review, shape and implement the fixes through Agent OS, check, file each deferred item\'s drafted issue, push, reply and re-review while a round finds a new correctness item to fix or ask about',
  whenToUse: 'Launched only by the /redline:redline skill (and its /redline:redline-review and /redline:redline-revise variants), which builds args from the repository\'s .claude/redline.json and the command line. Never launched by hand.',
  phases: [
    { title: 'Gather', detail: 'PR facts through redline-gh.sh (GitHub agent)' },
    { title: 'Review', detail: 'the first round: the coverage pass over the whole PR, then the reviewer as verifier (first-round model)' },
    { title: 'Re-review', detail: 'later rounds: the coverage pass over the whole PR at the new head, then the reviewer rechecks the fix diff and verifies the candidates (later-round model)' },
    { title: 'Post', detail: 'one Redline review per round, files under <specFolder>/redline/' },
    { title: 'Shape', detail: 'shape-spec in unattended mode (revise model)' },
    { title: 'Resolve', detail: 'only after a hand-off: decisions into the spec folder' },
    { title: 'Approve', detail: 'plan and standards approvers in parallel, then the snapshot' },
    { title: 'Implement', detail: 'one commit per finding (revise model)' },
    { title: 'Check', detail: 'checks.sh by the checker; the script judges' },
    { title: 'Push and reply', detail: 'push when allowed, reply in every finding thread' },
    { title: 'Finish', detail: 'PR description from pr-body.md, the sweep that resolves the settled threads Redline opened, handoff comment and review request, the cap-hit comment, or the human review summary; then the run-record commit' },
  ],
}

// ---------------------------------------------------------------------------
// Arguments. The /redline:redline skill builds these once and passes them verbatim on every
// relaunch; only `decisions` is added after a hand-off, and each decision carries its
// own date so an earlier round's resolve prompt never changes on a later relaunch.
// Date.now(), argless new Date() and Math.random() throw in a workflow script, so
// every timestamp comes in through args.
// ---------------------------------------------------------------------------

const A = args || {}

function fail(message) {
  throw new Error('redline-loop: ' + message)
}

if (typeof A.repoRoot !== 'string' || !A.repoRoot.startsWith('/')) {
  fail('args.repoRoot must be the absolute repository root (git rev-parse --show-toplevel); got ' + JSON.stringify(A.repoRoot))
}
const repoRoot = A.repoRoot.replace(/\/+$/, '')
// The script has no environment, so the skill passes the plugin's root (its ${CLAUDE_PLUGIN_ROOT})
// for the plugin's own scripts and README. checks.sh and everything else per-repo stay under repoRoot.
if (typeof A.pluginRoot !== 'string' || !A.pluginRoot.startsWith('/')) {
  fail('args.pluginRoot must be the absolute root of the Redline plugin (the skill\'s CLAUDE_PLUGIN_ROOT); got ' + JSON.stringify(A.pluginRoot))
}
const pluginRoot = A.pluginRoot.replace(/\/+$/, '')
const pr = Number(A.pr)
if (!Number.isInteger(pr) || pr <= 0) {
  fail('args.pr must be the PR number; got ' + JSON.stringify(A.pr))
}
const launchMatch = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(typeof A.launchedAt === 'string' ? A.launchedAt : '')
if (!launchMatch) {
  fail('args.launchedAt must be an ISO 8601 local timestamp such as 2026-10-18T10:42:00-0400; got ' + JSON.stringify(A.launchedAt))
}
const stamp = `${launchMatch[1]}-${launchMatch[2]}${launchMatch[3]}`
const launchDate = launchMatch[1]
if (typeof A.headRef !== 'string' || A.headRef === '') {
  fail('args.headRef must be the PR head branch')
}
const headRef = A.headRef
const baseRef = typeof A.baseRef === 'string' && A.baseRef !== '' ? A.baseRef : 'main'
if (typeof A.startSha !== 'string' || !/^[0-9a-f]{40}$/.test(A.startSha)) {
  fail('args.startSha must be the PR head SHA at launch (40 hex characters)')
}
const startSha = A.startSha
if (!Array.isArray(A.files)) {
  fail("args.files must be the PR's changed files at launch")
}
const prFiles = A.files.slice()
if (typeof A.snapshotPath !== 'string' || !A.snapshotPath.startsWith('/')) {
  fail('args.snapshotPath must be the absolute path of the start snapshot the skill wrote')
}
const snapshotStart = A.snapshotPath
const issueFromBranch = /^[^/]+\/(\d+)-/.exec(headRef)
const issue = Number.isInteger(A.issue) ? A.issue : issueFromBranch ? Number(issueFromBranch[1]) : pr
const maxRounds = Number.isInteger(A.maxRounds) && A.maxRounds > 0 ? A.maxRounds : 3
// A fresh launch on a PR that already carries posted Redline rounds starts after the last one.
// The skill reads it (redline-gh.sh last-round) and passes it here: nothing inside the workflow
// may ask GitHub for a value that changes once this run posts, or the relaunch could not replay.
const firstRound = A.firstRound === undefined ? 1 : A.firstRound
if (!Number.isInteger(firstRound) || firstRound < 1) {
  fail('args.firstRound must be a positive integer, the last posted Redline round plus one; got ' + JSON.stringify(A.firstRound))
}
// The findings of the PR's earlier Redline rounds and their dispositions (#35). The skill reads
// them (redline-gh.sh prior-findings) after last-round and passes them here, for the same reason
// as firstRound: the run's own carried-forward replies change the old threads, so nothing inside
// the workflow may read them. A finding with no reply, or a "not changed" one, is carried into this
// run's first round; the rest are tracked and never re-raised.
const PRIOR_DISPOSITIONS = ['fixed', 'deferred', 'declined', 'decided', 'dropped', 'carried', 'left', 'none', 'not-changed']
const CARRY = ['none', 'not-changed']
const priorPosted = A.priorFindings === undefined ? [] : A.priorFindings
if (!Array.isArray(priorPosted)) {
  fail('args.priorFindings must be the list redline-gh.sh prior-findings prints, or []; got ' + JSON.stringify(A.priorFindings))
}
for (const p of priorPosted) {
  const m = p && typeof p === 'object' && typeof p.id === 'string' ? /^R(\d+)-\d+$/.exec(p.id) : null
  if (!m || Number(m[1]) >= firstRound) {
    fail(`args.priorFindings must list findings of the rounds before ${firstRound}, each with an id R<round>-<n>; got ${JSON.stringify(p && p.id)}`)
  }
  if (!PRIOR_DISPOSITIONS.includes(p.disposition) || !Number.isInteger(p.comment_id)) {
    fail(`args.priorFindings: ${p.id} needs a disposition in ${PRIOR_DISPOSITIONS.join(' | ')} and an integer comment_id; got ${JSON.stringify(p.disposition)}, ${JSON.stringify(p.comment_id)}`)
  }
}
// The round trip (#87): prior-findings prints a title as the review body posted it, escaped and
// neutralised by postedText since #87 and raw before, so it is decoded here, once, before anything
// reads it. The reviewer's prompt lists then show the title as the verifier wrote it, and every
// line that posts it again (a carried finding, Resolved, Earlier rounds, the handoff's decisions)
// escapes it once, never twice. The comment body and the reply text are posted raw and reposted
// raw, so they are not decoded.
const priorFindings = priorPosted.map((p) => (typeof p.title === 'string' ? { ...p, title: readBack(p.title) } : p))
const carryList = priorFindings.filter((p) => CARRY.includes(p.disposition))
const trackedList = priorFindings.filter((p) => !CARRY.includes(p.disposition))
const priorById = Object.fromEntries(priorFindings.map((p) => [p.id, p]))
const maxPlanAdjustments = Number.isInteger(A.maxPlanAdjustments) && A.maxPlanAdjustments >= 0 ? A.maxPlanAdjustments : 2
// Repository ask rules (#49): what a person is always brought in for, declared as askRules in the
// repository's .claude/redline.json and passed by the skill at launch (the workflow reads no
// file). A finding a rule covers is the person's to act on, never fixed, declined or deferred by Redline.
// The validation wording is the guard's and redline-setup.sh config's.
const RULE_ID = /^[a-z][a-z0-9-]*$/
const askRules = A.askRules === undefined || A.askRules === null ? [] : A.askRules
if (!Array.isArray(askRules)) {
  fail('args.askRules must be the askRules list of .claude/redline.json, or []; got ' + JSON.stringify(A.askRules))
}
const ruleIds = new Set()
askRules.forEach((rule, i) => {
  const at = `args.askRules[${i}]`
  if (!rule || typeof rule !== 'object') {
    fail(`${at} is not an object`)
  }
  if (typeof rule.id !== 'string' || !RULE_ID.test(rule.id)) {
    fail(`${at}: id must match [a-z][a-z0-9-]*; got ${JSON.stringify(rule.id)}`)
  }
  if (ruleIds.has(rule.id)) {
    fail(`${at}: id '${rule.id}' is not unique`)
  }
  ruleIds.add(rule.id)
  const when = rule.when && typeof rule.when === 'object' ? rule.when : {}
  const kind = Object.keys(when).sort().join(',')
  if (kind !== 'paths' && kind !== 'prose') {
    fail(`${at}: rule '${rule.id}': when must hold exactly one of paths or prose`)
  }
  if (kind === 'paths' && (!Array.isArray(when.paths) || !when.paths.length || when.paths.some((p) => typeof p !== 'string' || p.trim() === ''))) {
    fail(`${at}: rule '${rule.id}': paths must be a non-empty list of non-empty strings`)
  }
  if (kind === 'paths' && when.paths.some((p) => /[!\[]/.test(p))) {
    fail(`${at}: rule '${rule.id}': a path pattern may not hold ! or [`)
  }
  if (kind === 'prose' && (typeof when.prose !== 'string' || when.prose.trim() === '')) {
    fail(`${at}: rule '${rule.id}': prose must be a non-empty string`)
  }
  if (typeof rule.reason !== 'string' || rule.reason.trim() === '' || rule.reason.trim().includes('\n')) {
    fail(`${at}: rule '${rule.id}': reason must be one non-empty line`)
  }
})
const ruleById = Object.fromEntries(askRules.map((rule) => [rule.id, rule]))
const teammate = typeof A.reviewer === 'string' ? A.reviewer.replace(/^@/, '') : ''
const checkerMode = A.checker === 'git-only' ? 'git-only' : 'full'
const checkerStallMs = Number.isInteger(A.checkerStallMs) && A.checkerStallMs > 0 ? A.checkerStallMs : 300000
// Whether the gate fits in one foreground Bash call, from the recorded baseline (checks.json's
// baseline.seconds, which the skill passes). The tool's foreground cap is 600 s and 480 leaves a
// fifth for a slow day. Over it, or unknown, the checker and the implementer run the gate through
// redline-background.sh's start and wait (#40).
const baselineSeconds = Number.isInteger(A.baselineSeconds) && A.baselineSeconds >= 0 ? A.baselineSeconds : null
const FOREGROUND_MAX_S = 480
const backgroundGate = baselineSeconds === null || baselineSeconds > FOREGROUND_MAX_S
const postToGitHub = A.postToGitHub !== false
const push = A.push !== false && postToGitHub
// The interrupt dial: where a run stops for the person. Each level is a stopping point the loop
// already has. 'review only' is the old reviewOnly flag under its command-line name.
const INTERRUPTS = ['autopilot', 'guided', 'plan', 'review', 'review only']
const interruptWord = typeof A.interrupt === 'string' && A.interrupt.trim() !== ''
  ? A.interrupt.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ')
  : 'guided'
if (!INTERRUPTS.includes(interruptWord)) {
  fail(`args.interrupt must be one of ${INTERRUPTS.join(' | ')}; got ${JSON.stringify(A.interrupt)}`)
}
const reviewOnly = A.reviewOnly === true || interruptWord === 'review only'
const interrupt = reviewOnly ? 'review only' : interruptWord
// Finding scope: 'all' reviews for correctness bugs and nits; under 'correctness' the reviewer runs
// no nit checks of its own, a nit a candidate raises is still verified and declined by the
// workflow with the scope as its reason, and a round without a correctness finding is done (no
// final nit pass).
if (A.scope !== undefined && A.scope !== 'all' && A.scope !== 'correctness') {
  fail(`args.scope must be "all" or "correctness"; got ${JSON.stringify(A.scope)}`)
}
const scope = A.scope === 'correctness' ? 'correctness' : 'all'
// Where a deferred item's drafted issue goes (#95): 'github' opens an issue, 'spec' leaves the
// draft in the round's spec folder, 'print' does the same and has the skill print it to paste.
// The draft file is written in every mode; a dry run opens nothing whatever the word.
const DEFER_TO = ['github', 'spec', 'print']
if (A.deferTo !== undefined && !DEFER_TO.includes(A.deferTo)) {
  fail(`args.deferTo must be one of ${DEFER_TO.join(' | ')}; got ${JSON.stringify(A.deferTo)}`)
}
const deferTo = A.deferTo === undefined ? 'github' : A.deferTo
// When a deferred item's draft is raised with the person (#95): 'round' stops the round, with its
// judgment calls, after shaping; 'end' stops no round and asks once, before the run finishes.
// Autopilot never asks, so there the word changes nothing.
const DEFER_AT = ['round', 'end']
if (A.deferAt !== undefined && !DEFER_AT.includes(A.deferAt)) {
  fail(`args.deferAt must be one of ${DEFER_AT.join(' | ')}; got ${JSON.stringify(A.deferAt)}`)
}
const deferAt = A.deferAt === undefined ? 'round' : A.deferAt
// What the person said about each draft a stop raised (#95): {action: "file" | "drop", title,
// notes, date, draft}. `draft` is the version of the draft the stop showed, so an answer stands
// only for a draft the person saw; `title` is their own title, or ''; `notes` the restated reason
// for a drop. It enters after the stop that asked, like every decision: it is read at a stop
// check, at filing, and in the replies and the Finish text after it, and in no prompt before.
const deferrals = {}
if (A.deferrals !== undefined && A.deferrals !== null) {
  if (typeof A.deferrals !== 'object' || Array.isArray(A.deferrals)) {
    fail('args.deferrals must map a finding id to {action, title, notes, date, draft}; got ' + JSON.stringify(A.deferrals))
  }
  for (const [id, entry] of Object.entries(A.deferrals)) {
    if (!entry || typeof entry !== 'object' || !['file', 'drop'].includes(entry.action) || !Number.isInteger(entry.draft) || entry.draft < 1) {
      fail(`args.deferrals must map a finding id to {action: "file" | "drop", title, notes, date, draft: <the version the stop gave>}; got ${JSON.stringify(id)}: ${JSON.stringify(entry)}`)
    }
    deferrals[id] = { action: entry.action, draft: entry.draft, title: typeof entry.title === 'string' ? entry.title : '', notes: typeof entry.notes === 'string' ? entry.notes.trim() : '' }
  }
}
// A draft is answered when the person's answer names its version or a later one: an answer to a
// later version came from a later stop, so it never reopens an earlier stop on a relaunch.
const draftAnswered = (id, version) => Boolean(deferrals[id]) && deferrals[id].draft >= version
// Who decided what. A person's decision is attributed to their GitHub login (args.login, from
// redline-gh.sh login); the shaper's own, settled from evidence, to "redline"; a recommendation
// taken on autopilot to "redline (autopilot)".
const login = typeof A.login === 'string' ? A.login.trim().replace(/^@/, '') : ''
// The person running Redline, as every posted line names them (#93): by login, never by role, since
// on a teammate's pull request the person running Redline is not its author. With no login the
// fallback names no role either. A human-review pass is unchanged (#93, decision 8): a run that is
// one keeps "the author" as its fallback, as it keeps that word in its own lines.
const personLabel = login ? `@${login}` : A.revise && typeof A.revise === 'object' && A.revise.kind === 'human' ? 'the author' : 'the person running Redline'
// The label where it starts a sentence: a login as it is, the no-login words with a capital
// (#94, R1-17, R4-3).
const personLabelStart = personLabel.charAt(0).toUpperCase() + personLabel.slice(1)
const REDLINE = 'redline'
const AUTOPILOT = 'redline (autopilot)'
// What a judgment call's decision can end in (#99): a change in this pull request whose commit
// the check demands, an issue with or without a mitigation, or no change.
const CALL_ENDS = ['fix', 'defer', 'accept']
const decisions = A.decisions && typeof A.decisions === 'object' && !Array.isArray(A.decisions) ? { ...A.decisions } : {}
// A decision that names its own disposition names one of the three (#108, R2-6): the skill
// records only fix, defer or accept, and every reader of the field matches those exact values,
// so any other would be neither checked at resolve nor demanded at the check. Until #99 a
// resolve task with files was demanded whatever the decision named. An empty string or a null
// names none, as every reader of the field reads it: it is dropped from the run's copy of the
// decision, so the resolve prompt shows none either, where until #108, R3-1 the check below
// refused it and a relaunch threw before any agent ran. Only those two name none: a blank
// string, or "", '' or null in quotes, which errorText also clears from an agent's error (#42),
// is a value outside the three here and is refused, since no path the skill records writes one
// (#108, R4-2).
for (const [id, entry] of Object.entries(decisions)) {
  if (entry && typeof entry === 'object' && (entry.disposition === null || entry.disposition === '')) {
    const { disposition: _dropped, ...rest } = entry
    decisions[id] = rest
  } else if (entry && typeof entry === 'object' && entry.disposition !== undefined && !CALL_ENDS.includes(entry.disposition)) {
    fail(`args.decisions must give a disposition of ${CALL_ENDS.join(' | ')} when it gives one; got ${JSON.stringify(id)}: ${JSON.stringify(entry)}`)
  }
}
// A decision that picks one of its call's options names it in `option`, by the option's label
// (#105): the skill records it for a pick in the question, and for a label typed as written.
// The round that applies the decision gives it the option's end as its disposition (resolveWith),
// so a pick never carries one of its own: the two together would be two sources for one fact,
// and they are refused here, before any agent runs. An empty string or a null names no option,
// as for a disposition above, and is dropped from the run's copy; any other value that is not a
// string is refused. A decision with no option is an answer in the person's own words.
for (const [id, entry] of Object.entries(decisions)) {
  if (!entry || typeof entry !== 'object' || entry.option === undefined) {
    continue
  }
  if (entry.option === null || entry.option === '') {
    const { option: _dropped, ...rest } = entry
    decisions[id] = rest
  } else if (typeof entry.option !== 'string') {
    fail(`args.decisions must give an option as a string, the label of the option picked, when it gives one; got ${JSON.stringify(id)}: ${JSON.stringify(entry)}`)
  } else if (entry.disposition !== undefined) {
    fail(`args.decisions must not give both an option and a disposition: a pick takes its disposition from the option it names, and a typed disposition names no option; got ${JSON.stringify(id)}: ${JSON.stringify(entry)}`)
  }
}
// plan dial: the passes whose disposition list the person approved (relaunch carries them all):
// a Redline round by its number, a human review pass as h<n> (passOf's planKey), so a pass and
// its final nit pass never share a key when their numbers are equal (#38, R1-5).
const approvedPlans = Array.isArray(A.approvedPlans)
  ? A.approvedPlans.map((key) => (typeof key === 'string' && /^h\d+$/.test(key) ? key : Number(key))).filter((key) => typeof key === 'string' || Number.isInteger(key))
  : []
// review dial: after the round 1 review the person picks the findings to act on; the rest are
// dropped, each with a reason. {act: [ids], dropped: {id: reason}}.
const selected = A.selected && typeof A.selected === 'object' && !Array.isArray(A.selected)
  ? {
    act: Array.isArray(A.selected.act) ? A.selected.act.map(String) : [],
    dropped: A.selected.dropped && typeof A.selected.dropped === 'object' && !Array.isArray(A.selected.dropped) ? A.selected.dropped : {},
  }
  : null
// Resume after an error (#10): the agent label the error result named, with the attempt number
// the relaunch is, the error text, and the hand commits made since the run stopped (their SHAs
// and the .claude/ paths they touch, which the judge excuses). run() appends one resume line to
// that label's prompt, so every prompt before it replays from cache and that agent and all after
// it rerun: a completed agent's result replays unchanged on a plain relaunch, even one the script
// rejected, which is why the prompt has to change. The map keeps every earlier entry, so a later
// relaunch replays the resumed prompt too. An entry also says whether the stop was the workflow's
// own check of what the agent returned (ownCheck, #116), as the error result gave it and the run
// marker kept it: resumeLine reads it, never the error's words. An entry without it, as a marker
// written before the field existed holds, is an ordinary stop.
const resume = {}
if (A.resume !== undefined) {
  if (!A.resume || typeof A.resume !== 'object' || Array.isArray(A.resume)) {
    fail('args.resume must map an agent label to {attempt, error, hand, ownCheck}; got ' + JSON.stringify(A.resume))
  }
  for (const [label, entry] of Object.entries(A.resume)) {
    const hand = entry && entry.hand && typeof entry.hand === 'object' ? entry.hand : { commits: [], paths: [] }
    const strings = (list) => Array.isArray(list) && list.every((x) => typeof x === 'string')
    if (!entry || typeof entry !== 'object' || !Number.isInteger(entry.attempt) || entry.attempt < 2 || typeof entry.error !== 'string' || !strings(hand.commits || []) || !strings(hand.paths || []) || (entry.ownCheck !== undefined && typeof entry.ownCheck !== 'boolean')) {
      fail(`args.resume must map an agent label to {attempt, error, hand, ownCheck}; got ${JSON.stringify(label)}: ${JSON.stringify(entry)}`)
    }
    resume[label] = { attempt: entry.attempt, error: entry.error, hand: { commits: hand.commits || [], paths: hand.paths || [] }, ownCheck: entry.ownCheck === true }
  }
}
// The script a relaunch runs (#81). When Redline reviews its own repository, a round's commit can
// change workflows/redline-loop.js or an agent file. The skill relaunches the launch's script (by
// name while the file is as launched, from the copy the harness persisted once it differs) and
// passes what changed as args.drift, from redline-prefs.sh run drift: {workflow, pinned, agents}.
// It is read in two places only, both outside every replayed prompt: at startup, where a changed
// workflow with no pinned copy (a launch by the scriptPath fallback ran the file itself) refuses
// the relaunch, and at Finish, where the handoff comment says which agent files changed. Agent
// files cannot be pinned: an agent type resolves only from the session's registry, so a copy
// would run with no role and outside the guard.
const drift = { workflow: '', pinned: true, agents: [] }
if (A.drift !== undefined && A.drift !== null) {
  const d = A.drift
  if (typeof d !== 'object' || Array.isArray(d) || typeof d.workflow !== 'string' || typeof d.pinned !== 'boolean' || !Array.isArray(d.agents) || d.agents.some((p) => typeof p !== 'string' || p === '')) {
    fail('args.drift must be {workflow, pinned, agents} as redline-prefs.sh run drift prints it; got ' + JSON.stringify(d))
  }
  drift.workflow = d.workflow
  drift.pinned = d.pinned
  drift.agents = d.agents.slice()
}
// The changed agent files as both sentences below name them, built once so the two never name
// different files (#94, R5-1).
const agentList = drift.agents.map((p) => `\`${p}\``).join(', ')
const AGENTS_CHANGED = drift.agents.length
  ? `Agent files changed since this run launched (${agentList}): this run's remaining rounds may run under them, while the workflow's own prompts are the launch's.`
  : ''
// The same fact as the handoff comment states it (#93): the comment is posted after the last round,
// so it says what happened, where the warning above, shown while rounds are ahead, says what may.
const AGENTS_CHANGED_HANDOFF = drift.agents.length
  ? `Agent files changed during this run (${agentList}): the rounds after the change may have run under them, while the workflow's own prompts were the launch's.`
  : ''
const handCommits = new Set(Object.values(resume).flatMap((entry) => entry.hand.commits))
const handPaths = [...new Set(Object.values(resume).flatMap((entry) => entry.hand.paths))]
const models = A.models && typeof A.models === 'object' ? A.models : {}
if (!models.revise || typeof models.revise.model !== 'string') {
  fail('args.models.revise.model is required: the revise model picked at launch')
}
// The coverage pass (#79): the built-in code-review skill is the finder on every whole-PR and
// fix-diff round, run from the default workflow agent with no schema on the agent that calls the
// Skill tool (spike #72: the guard does not see a skill fork, so the pass is never a role, and a
// schema on the calling agent can make the fork call StructuredOutput itself and return nothing).
// `coverage off` reaches here as models.coverage null: every round is the reviewer alone, as before
// the pass existed. The key absent means on, at the first-round reviewer's model and effort.
if (models.coverage !== undefined && models.coverage !== null && (typeof models.coverage !== 'object' || Array.isArray(models.coverage))) {
  fail('args.models.coverage must be an object ({model, effort}), null (coverage off) or absent; got ' + JSON.stringify(models.coverage))
}
const coverageOn = models.coverage !== null
const COVERAGE_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max']
// The effort word the skill is given, always explicit: without one the skill reuses the level typed
// last on the machine. `max` fans out through the Agent tool, which a workflow subagent never has,
// so it runs as a single pass; `xhigh` on the opus-5 family is the recipe the spike validated.
function coverageEffort() {
  const picked = models.coverage && typeof models.coverage.effort === 'string' && models.coverage.effort !== ''
    ? models.coverage.effort
    : models.reviewerFirstRound && typeof models.reviewerFirstRound.effort === 'string' && models.reviewerFirstRound.effort !== ''
      ? models.reviewerFirstRound.effort
      : 'high'
  if (!COVERAGE_EFFORTS.includes(picked)) {
    fail(`the coverage pass's effort must be one of ${COVERAGE_EFFORTS.join(' | ')} (models.coverage.effort, else models.reviewerFirstRound.effort); got ${JSON.stringify(picked)}`)
  }
  return picked
}
if (coverageOn) {
  coverageEffort()
}
// /redline:redline-revise <pr> review <selector> (#36): a revise pass over a teammate's review. The
// skill ingested the comments (redline-gh.sh human-review), numbered them H<n>-k and passes them
// here with the pass number n (last-human-review plus one), so a relaunch replays.
let humanRevise = null
if (A.revise && typeof A.revise === 'object' && A.revise.kind === 'human') {
  const n = Number(A.revise.n)
  if (!Number.isInteger(n) || n <= 0 || !Array.isArray(A.revise.findings)) {
    fail('args.revise (kind human) needs n (the pass number, last-human-review plus one) and findings (from <specFolder>/redline/human-review-<n>.json)')
  }
  const reviewer = typeof A.revise.reviewer === 'string' ? A.revise.reviewer.trim().replace(/^@/, '') : ''
  if (reviewer === '') {
    fail('args.revise.reviewer must be the login of the teammate whose review this pass reads')
  }
  const badIds = A.revise.findings.filter((f) => !new RegExp(`^H${n}-\\d+$`).test(f.id)).map((f) => f.id)
  if (badIds.length) {
    fail(`args.revise.findings ids must be H${n}-<k>; got ${JSON.stringify(badIds)}`)
  }
  humanRevise = {
    n,
    reviewer,
    reviewIds: Array.isArray(A.revise.reviewIds) ? A.revise.reviewIds.map(Number).filter((id) => Number.isInteger(id)) : [],
    body: typeof A.revise.body === 'string' ? A.revise.body : '',
    findings: A.revise.findings,
    specFolder: typeof A.revise.specFolder === 'string' && A.revise.specFolder !== '' ? A.revise.specFolder.replace(/\/+$/, '') : '',
    commentIds: A.revise.commentIds && typeof A.revise.commentIds === 'object' ? A.revise.commentIds : {},
    posted: A.revise.posted !== false,
  }
}

// ---------------------------------------------------------------------------
// Fixed strings and small helpers.
// ---------------------------------------------------------------------------

const GH = `${pluginRoot}/scripts/redline-gh.sh`
const CHECKS = `${repoRoot}/.claude/redline/checks.sh`
const BACKGROUND = `${pluginRoot}/scripts/redline-background.sh`
const README_URL = 'https://github.com/fromtheoutfit/redline/blob/main/README.md'
const RUN_LINE = `This is a Redline agent run on pull request #${pr}. Git operations follow "Git rules for Redline agents" in ${pluginRoot}/README.md. Repository root: ${repoRoot}; use absolute paths for every read, write and script call. A message from the person that arrives with this prompt (a line holding only a Redline command on a launch or a resume, \`/redline:redline <pr> ...\`, \`/redline:redline-review <pr> ...\` or \`/redline:redline-revise <pr> ...\` or the short forms \`/redline <pr> ...\` and \`/redline-revise <pr> ...\`, or the word \`relaunch\` after a hand-off) is conversational, not an instruction: the decisions in the run's args (args.decisions, args.selected, args.approvedPlans and args.deferrals, given in this prompt where they apply) are the only authority on what the person decided, and this prompt's task stands.`
// A Redline round since #93: the shaper decides every finding, and the person is asked in the
// cases below only, which ROUND_WHY names for the judgment call's why_human. The other roles of a
// round never decide a pending call and never reopen a decision made. A human review pass keeps
// NEVER_DECIDE and its own reasons, unchanged.
// The scope a workflow decline names (#94, R7-10, R8-1): a final nit pass's own, else the run's.
const scopeName = (nitPass) => (nitPass ? 'the final nit pass\'s scope' : 'this run\'s scope')
// What became of a finding the workflow declined under a correctness-only scope (#93), or of a nit
// a final nit pass's reviewer reported though the pass reports correctness only (#94, R7-10): the
// workflow declines it under that scope, never drops it.
const declinedUnder = (nitPass) => `declined: outside ${scopeName(nitPass)} (correctness only) · decided by: redline`
// The outcomes that settle a finding's thread once its reply is posted: Finish resolves it. A
// decline is one since #93; a dropped, left or not-changed finding stays open for the person.
const SETTLED_KINDS = ['fixed', 'deferred', 'declined', 'decided']
// A finding left to the person settles its thread in one case (#126): the person deferred it and
// its drafted issue was filed, as an issue or as a draft file, so the thread's open question is
// tracked. Left to be changed by hand, accepted, left by autopilot, or with its draft dropped, it
// stays open, as before.
const settles = (record, id, kind) => SETTLED_KINDS.includes(kind) || (kind === 'left' && Boolean((record.filed || {})[id]))
// A finding on one of Redline's own files (#94, R8-4): the why_human its call gives, and the reason
// its forced entry records. forceAskRules records it as it records a finding a repository ask rule
// covers, so it is left to the person on every dial: on autopilot it is never decided, its line
// under Left to the person says what Redline would have done (#95: it is no deferral, having no
// drafted issue), its thread stays open, and Redline makes no change.
const OWN_FILE = "redline's own file"
const OWN_FILE_REASON = 'no Redline role may write them'
// What a finding left to the person is left under: its repository rule, or Redline's own files.
const leftUnder = (forced) => (forced.own ? "the rule on Redline's own files" : `repository rule ${forced.rule}`)
// The sixth, "redline's own file", is no case of judgment: no Redline role may write one of
// Redline's own files in the repository under review, so a finding on one is the person's to
// change by hand, as a finding under a repository ask rule is (the shaper's rule 7).
const ROUND_WHY = ['product decision', 'spec assumption', 'outside the pull request', 'no clear pick', 'unconfirmed, serious if true', OWN_FILE]
const HUMAN_WHY = ['product decision', 'spec assumption', 'new standard', 'unsure', 'disproportionate fix']
const ASK_CASES = 'You decide every finding, and the person is asked in five cases only: the options differ in what the product does or what a user sees; the fix changes an assumption, the approach or the architecture the original spec agreed; the fix reaches outside what the pull request set out to do; two options are both defensible and neither is the clear pick; or the finding is still unconfirmed after your second look and its harm would be serious if it were true (security, privacy, data loss, money). A finding on a file of Redline\'s own is asked as well, as your instructions say. In every other case you take your own recommendation, a decision to decline included, and record it as decided by redline with its reason. Name the case, never a degree of confidence.'
const PENDING_IS_THEIRS = 'A decision that is still pending is the person\'s: you do not pick an option, you do not implement a default, and you do not treat an earlier spec as having settled it.'
const NOT_YOURS = `${PENDING_IS_THEIRS} A decision already made, the shaper's own included (a fix, a decline with its reason, a deferral), is applied as recorded and never reopened.`
// The resolve agent applies the person's decisions, and a disposition override is one: it
// replaces the shaper's own, a decline included (the #93 spec, decision 7), so its rule never
// says that a shaper's decision is never reopened (#94, R4-4).
const RESOLVE_RULE = `${PENDING_IS_THEIRS} A disposition override is the person's decision and replaces the shaper's, a decline included. Every other decision already made, the shaper's own included, is applied as recorded.`
// The plan approver checks the shaper's own dispositions (agents/redline-plan-approver.md,
// points 2 and 6), so its rule applies the person's decisions as recorded and sends a
// disposition it bounces back to the shaper, whose reshape decides it again (#94, R4-5).
const APPROVER_RULE = `${PENDING_IS_THEIRS} A decision made outside the shaper (by the person, or by the autopilot taking the shaper's recommendation) is applied as recorded. The shaper's own dispositions (a fix, a decline with its reason, a deferral) are what you check, as your instructions say, and a bounce sends one back to the shaper to decide again.`
// The verifier since #93: it states what is true, and the kind of each finding, which now keeps a
// run going. Every review prompt carries both, with the coverage pass or without it.
const KIND_RULES = 'A finding\'s kind: correctness is wrong behaviour reachable in practice, a security hole, a privacy leak, data loss, a broken contract, or a promise this pull request makes (in its title, its description or its spec) that the code does not keep. Everything else is nit: naming, clarity, a docblock, a small refactor, a test gap, a cost, a doc.'
const KINDS = `${KIND_RULES} State the kind with care: a correctness finding the run acts on buys another round.`
// A final nit pass buys no round: what it finds gets one more revise pass and the run ends (#94, R2-2).
const KINDS_FINAL = `${KIND_RULES} State the kind with care: in this final nit pass a correctness finding the run acts on gets one more revise pass, and then the run ends.`
const FACTS_ONLY = 'You establish what is true; you do not decide what to do about it. Report every finding you verified, whatever its size, whatever its fix would cost and wherever its cause lies, with confidence confirmed (reproduced, or traced through the code to the result, with the lines cited). Report one you could not confirm with confidence unconfirmed and, in wouldConfirm, one line on what would confirm it. Whether to fix it, defer it, decline it or put it to the person is the shaper\'s decision, never yours.'
const NEVER_DECIDE = 'Judgment calls are returned, never decided. A question that turns on product intent, an assumption in the original spec, a standard the codebase does not follow yet, a fix out of proportion to its finding, or anything you cannot settle from the code goes back to the person with the options; you do not pick one, you do not implement a default, and you do not treat an earlier spec as having settled it.'
// The rule a role after the shaper follows about decisions: a human review pass keeps NEVER_DECIDE;
// a Redline round's roles apply what was decided and leave what is pending (#93; #94, R1-9).
// It serves the standards approver and the implementer; the resolve agent and the plan approver
// have rules of their own (#94, R4-4, R4-5).
const decideRule = (pass) => (pass.human ? NEVER_DECIDE : NOT_YOURS)

const specFolderFor = (round) => `agent-os/specs/${stamp}-${pr}-review-round-${round}`
const humanFolderFor = (n) => `agent-os/specs/${stamp}-${pr}-human-review-${n}`
// One scratch Pest file per role and pass, so the shaper can read the reviewer's reproduction.
const scratchTest = (role, tag) => `/tmp/redlinerepro/${role}-${tag}-ReproTest.php`

// What a revise pass is called. A Redline round is "Redline round N" (ids R<N>-k); a pass over a
// teammate's review (#36) is "Redline human review N" (ids H<N>-k), decided by that teammate where
// their comment was a clear instruction. Every label, reply, file name and log line comes from here,
// so a Redline round's prompts stay byte-identical to what they were before human passes existed.
function passOf(record) {
  const n = record.round
  if (record.human) {
    const reviewer = `@${record.human.reviewer}`
    return {
      human: true, round: n, tag: `h${n}`, planKey: `h${n}`, name: `human review ${n}`, title: `Redline human review ${n}`, idPrefix: `H${n}`, reviewer,
      replyFile: (id) => `${record.specFolder}/redline/human-review-${n}-reply-${id}.md`,
      bodyHeader: (f) => `**${f.id}** · from review ${f.reviewId} by ${reviewer}`,
      bodyHeaderHint: `\`**<id>** · from review <review id> by ${reviewer}\``,
      issueFile: (id) => `${record.specFolder}/redline/issue-${id}.md`,
      deferredFile: `${record.specFolder}/redline/human-review-${n}-deferred.json`,
    }
  }
  return {
    human: false, round: n, tag: `r${n}`, planKey: n, name: `round ${n}`, title: `Redline round ${n}`, idPrefix: `R${n}`, reviewer: '',
    replyFile: (id) => `${record.specFolder}/redline/round-${n}-reply-${id}.md`,
    bodyHeader: (f) => `**${f.id}** · \`${f.file}:${f.line}\` · from the Redline round ${n} review body`,
    bodyHeaderHint: `\`**<id>** · ... · from the Redline round ${n} review body\``,
    // A deferred finding's drafted issue as filed, and the round's record of what was filed (#95).
    issueFile: (id) => `${record.specFolder}/redline/issue-${id}.md`,
    deferredFile: `${record.specFolder}/redline/round-${n}-deferred.json`,
  }
}
const abs = (path) => `${repoRoot}/${path}`
const short = (sha) => (typeof sha === 'string' ? sha.slice(0, 7) : '')
const json = (value) => JSON.stringify(value, null, 2)
const unique = (list) => [...new Set(list)]
// The segments of a path once folded: an empty one (a repeated or trailing slash) and a . are
// skipped, and a .. takes the last one off, as os.path.normpath does.
function pathSegments(text) {
  const segments = []
  for (const segment of text.split('/')) {
    if (segment === '' || segment === '.') {
      continue
    }
    if (segment === '..') {
      segments.pop()
      continue
    }
    segments.push(segment)
  }
  return segments
}
// A path as an agent wrote it, read once, as the guard reads the target of a write (#114, R4-2):
// os.path.normpath of the path joined to the repository, then taken relative to it (writable and
// ask_rule in scripts/redline-guard.sh). The text is trimmed, joined to the root unless it is
// absolute, and folded. `path` is what is left with the root taken off: '' for a blank or the
// root itself, which name no file; relative for a path inside the repository; and for one outside
// it (`outside`), the absolute folded path, which equals no repository file. `dir` says the text
// was written as a directory: it ends in /, /. or /.., which a list of files drops and the paths
// rules and the plan approver's list keep. `up` says the text holds a .. segment, and `blank`
// that it holds nothing, which the plan approver's list reads (planEntry). Two things the guard
// does differently, on purpose: it takes padding literally, where a path in an agent's JSON is
// trimmed, and it resolves symlinks, where the workflow reads no disk. Every path an agent
// returns for a task is read through it: the decided lists, the shaper's own list (vetShape,
// R4-4), the plan approver's list (planEntry), the paths rules, and the reviewer's file where it
// is matched or compared. Until R4-2 each read part of it its own way: relPath (#49) took off the
// root and then a leading ./, for the paths rules, cleanPaths folded what R1-6 and R2-2 named
// and kept .. segments and a trailing /. as written, and the plan approver's list had only the
// root taken off.
function repoPath(raw) {
  const text = String(raw === null || raw === undefined ? '' : raw).trim()
  if (text === '') {
    return { path: '', outside: false, dir: false, up: false, blank: true }
  }
  const root = pathSegments(repoRoot)
  const segments = pathSegments(text.startsWith('/') ? text : `${repoRoot}/${text}`)
  const outside = segments.length < root.length || root.some((segment, i) => segments[i] !== segment)
  return { path: outside ? `/${segments.join('/')}` : segments.slice(root.length).join('/'), outside, dir: /(?:^|\/)\.{0,2}$/.test(text), up: text.split('/').includes('..'), blank: false }
}
// A path the plan approver listed, as the allowed list takes it: `entry`, or `dropped`, why it is
// left out. The list becomes the snapshot's plan_paths, which checks.sh reads as what the round
// may change, an entry that ends in a slash as a prefix, so reading it through repoPath must
// never make it broader than the approver wrote it (the #114 round 4 by-hand spec, decisions 12
// and 17). An entry that is the repository root, or outside the repository, is left out, never
// written as a prefix. So is a directory written through a .. segment (app/sub/../): the fold
// would make its prefix, app/, broader than any the approver wrote out. A file written through
// one (app/sub/../x.php) is that one file. A path written as a directory keeps its slash, and a
// blank is no entry and has no reason.
function planEntry(raw) {
  const read = repoPath(raw)
  if (read.blank) {
    return { entry: '', dropped: '' }
  }
  if (read.outside) {
    return { entry: '', dropped: 'is outside the repository' }
  }
  if (read.path === '') {
    return { entry: '', dropped: 'is the repository root' }
  }
  if (read.dir && read.up) {
    return { entry: '', dropped: 'names a directory through a .. segment' }
  }
  return { entry: read.dir ? `${read.path}/` : read.path, dropped: '' }
}
// A list of paths as an agent returned it, read one way (#114, R1-6, R2-2, R4-2): each through
// repoPath, a blank and the root itself dropped, and each path once, so one file written two ways
// is one file and a list of blanks is no list. A finding's task is read through it from a
// resolve's tasks and from a reshape's list alike, so the holds, the warnings and the list the
// round keeps compare one form. A path outside the repository is kept, absolute: the list names
// it, and it is no repository file. R1-6 took off the root or a leading ./, never both; R2-2
// folded a doubled slash, a ./ segment and a trailing slash; R4-2 made it the guard's reading,
// .. segments and a trailing /. included.
const cleanPaths = (list) => unique(list.map((path) => repoPath(path).path).filter((path) => path !== ''))
// The files of the tasks a list holds for one finding (#108, R1-7), read through cleanPaths: the
// resolve-time checks read one resolve's tasks this way, and so does the list the round keeps for
// each decided finding (decidedFiles, #106).
const taskFilesOf = (tasks, id) => cleanPaths(tasks.filter((task) => task.finding === id).flatMap((task) => task.files))

// The glob dialect of a paths ask rule, shared with the guard (glob_regex in
// scripts/redline-guard.sh) and pinned by the same cases on both sides: ** spans segments, * and ?
// stay inside one, a pattern with no slash (a trailing one aside) matches at any depth, a leading
// slash only anchors, a trailing slash takes the directory and everything in it. Case-folded (#49).
function globToRegExp(pattern) {
  let p = pattern.toLowerCase()
  const anchored = p.replace(/\/+$/, '').includes('/')
  p = p.replace(/^\/+/, '')
  const dirOnly = p.endsWith('/')
  p = p.replace(/\/+$/, '')
  let out = ''
  for (let i = 0; i < p.length;) {
    if (p.startsWith('**/', i)) {
      out += '(?:.*/)?'
      i += 3
      continue
    }
    if (p.startsWith('**', i)) {
      out += '.*'
      i += 2
      continue
    }
    const c = p[i]
    out += c === '*' ? '[^/]*' : c === '?' ? '[^/]' : c.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    i += 1
  }
  if (!anchored) {
    out = '(?:.*/)?' + out
  }
  if (dirOnly) {
    out += '(?:/.*)?'
  }
  return new RegExp('^' + out + '$')
}
const pathRules = askRules.filter((rule) => rule.when.paths).map((rule) => ({ rule, regexes: rule.when.paths.map(globToRegExp) }))
// The first paths rule, in list order, that one of the paths falls under; null when none does.
// A path is read through repoPath, as the guard reads the target of a write, and matched
// case-folded (#114, R4-2, R4-3); one written as a directory is also matched with its slash, so
// config//project/ is under config/project/** as config/project/ is. A blank and a path outside
// the repository are under no rule, as for the guard. Until R3-3 only the text as written was
// read, so a task listed as app//billing/x.php was never left to the person. R3-3 read the
// cleaned path beside the written one, and no reading was both folded and a directory, so
// config//project/ was under neither (R4-3); and the written reading put
// app/../config/project/x.yaml under no rule and config/project/../other.yaml, which is
// config/other.yaml, under one (R4-2). A rule's own root with no trailing slash, and a directory
// above it, are not matched here, though the guard refuses a write to either as holding the
// rule's files: the issue drafted in the #114 round 4 by-hand spec.
function ruleForPaths(paths) {
  for (const { rule, regexes } of pathRules) {
    for (const raw of paths) {
      const read = repoPath(raw)
      if (read.path === '' || read.outside) {
        continue
      }
      const forms = (read.dir ? [read.path, `${read.path}/`] : [read.path]).map((form) => form.toLowerCase())
      if (forms.some((form) => regexes.some((re) => re.test(form)))) {
        return rule
      }
    }
  }
  return null
}
// The rule a finding sits under as reviewed: its file under a paths rule, else the reviewer's
// advisory askRule tag. The shaper applies the rules; the forcing point (forceAskRules) wins.
function ruleOf(f) {
  return ruleForPaths([f.file || '']) || (f.askRule && ruleById[f.askRule]) || null
}
// Injected into the reviewer's, shaper's and plan approver's prompts; empty, and appended to an
// existing interpolation, so a repository with no rules keeps byte-identical prompts (#49).
const rulesBlock = askRules.length
  ? `\nRepository ask rules, as JSON: what a person is always brought in for, declared in .claude/redline.json. A finding one covers (its file or its fix under a paths rule, or its change doing what a prose rule's sentence says) is the person's to act on, never fixed, declined or deferred by Redline: in the shaper's JSON it is ask with why_human "repository rule <id>", askRule set to the id, its story quoting the rule's reason and its recommendation what the person would do themselves; every finding's JSON lists files, the paths its task would touch, so the workflow can apply the paths rules. The plan approver bounces a task that writes under a paths rule or fixes a finding a prose rule covers, and a decline of a finding a prose rule covers. No Redline role may write under a paths rule; the guard refuses it.\n${json(askRules)}\n`
  : ''

function modelOpts(key) {
  const picked = models[key] || {}
  const opts = {}
  if (typeof picked.model === 'string' && picked.model !== '') {
    opts.model = picked.model
  }
  if (typeof picked.effort === 'string' && picked.effort !== '') {
    opts.effort = picked.effort
  }
  return opts
}

// The label of the last agent run() started: the step a resume reruns from (#10). An error raised
// from a stage whose last agent is not the one to rerun names its own (the parallel Approve).
let lastLabel = ''

function stageError(stage, message, extra, label) {
  return Object.assign(new Error(message), { stage, extra: extra || {}, label: label || lastLabel })
}
// A stop that is the workflow's own check of what the step's agent returned (#116): the rerun
// corrects what it returned, and nothing needs fixing by hand first. The error result says so in
// ownCheck, which the skill reads for its report and carries, through the run marker, into the
// resume entry, where resumeLine reads it. So the fact is stated once, where the stop is raised,
// and no reader goes by how an error is worded. Three groups of sites raise one: the resolve's
// checks of the result it returned, the hold of a decided finding to its task after a reshape,
// and the checks of the shaper's result (vetShape's, after the spec check). The spec check is
// not one: a missing file can be a Write that was refused, which a person does fix.
function checkError(stage, message, extra, label) {
  return Object.assign(stageError(stage, message, extra, label), { ownCheck: true })
}

// The one line a resume adds to the resumed agent's prompt, and the shaper's sentences. A round's
// first shape rewrites the failed attempt's spec files, never appends to them, and redline/ is
// never touched (#10); a reshape never rewrites them (#117, below).
// Two Finish operations have two effects and no duplicate check in their own prompt, so the line
// gives them one (#59, R1-6): a Finish comment (handoff, cap-hit, summary) looks for the comment an
// earlier attempt posted before posting, and the record commit looks for the commit an earlier
// attempt made before committing, then pushes. Only the resume line carries them, so a first run's
// prompts stay as they were.
const FINISH_COMMENT_LABELS = ['handoff comment', 'cap-hit comment', 'summary comment']

function resumeLine(opts) {
  const entry = resume[opts.label]
  // The shaper's sentence goes by the step and by what its stop was (#117). A round's first shape
  // runs before the round's resolve, so its resume rewrites the four files from scratch, as it
  // always has: the #117 spec measured that no decision of the person or the autopilot can be on
  // disk when one is resumed in a round folder its own launch created. A revise-only pass over an
  // earlier run's round (/redline:redline-revise <pr> round <N>) shapes in that run's folder,
  // which can hold its decided entries, so a resume of its first shape rewrites them, as it
  // always has (#120, R1-1). That run's spec commit keeps them in git history only once the run
  // reached its implement step; one that stopped before it (at its resolve, its plan approver or
  // a reshape) left them uncommitted, and the rewrite loses them; the record commit holds only
  // redline/ (#120, R2-2). A reshape runs after the round's resolve, so its folder can hold the
  // entries and tasks the resolve agent wrote for the round's decisions, and its rerun is never
  // told to rewrite, whatever stopped it. Until #117 only the stop that holds a decided finding
  // to its task (#106) was told to correct in place, and a reshape resumed after any other stop
  // was told to rewrite beside those entries, against its own prompt, which says to correct the
  // four files in place.
  // A reshape is known by its label, the workflow's own name for the step. What its stop was is
  // the entry's ownCheck (#116), never how the error is worded. After the workflow's own check of
  // what the reshape returned (the hold, a check of its result) nothing was fixed by hand, and
  // the rerun corrects what the error names. After any other stop (the spec check, a call that
  // returned nothing) the folder may be incomplete, so the rerun restores what is missing and
  // keeps each decided entry and its task unless an adjustment changes that task (#120, R1-2).
  // After either, the rerun never writes from memory a decided entry the folder no longer holds:
  // the reshape prompt names each decided finding and its end, never the choice, the notes and
  // the date, and a reshape the hold or a check of its result stopped may have dropped an entry
  // as well as a task (#120, R2-3). Both hold in a round with no decision too: the line cannot
  // see the round's decisions, and correcting in place is right for every reshape. Each clause
  // ends with the ban on touching redline/ that the from-scratch sentence carries (#114, R4-1).
  // A first shape stopped by the workflow's own check of its result is told so as well, before
  // the from-scratch sentence (#117): the skill tells the person that nothing needs fixing by
  // hand, and until then this line told the rerun only that the person had fixed the cause by
  // hand. An entry without the field keeps the line a first shape always had, byte for byte.
  const reshape = String(opts.label || '').startsWith('reshape ')
  const shaper = opts.agentType !== 'redline:redline-shaper'
    ? ''
    : !reshape
      ? `${entry.ownCheck ? ' When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it.' : ''} Rewrite plan.md, shape.md, standards.md and references.md in the spec folder from scratch, replacing what the earlier attempt wrote; never change or remove anything under its redline/ folder.`
      : entry.ownCheck
        ? ' When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it: read plan.md, shape.md, standards.md and references.md as that attempt left them, the entries the person or the autopilot decided and the tasks written for them included, correct what the error names, and return the whole result again; never write a decided entry the folder no longer holds from memory (name it in shape.md as lost), and never change or remove anything under its redline/ folder.'
        : ' This step is a reshape, so the spec folder already holds the earlier work of this round, though part of it may be missing: read plan.md, shape.md, standards.md and references.md as they stand, keep any entry the person or the autopilot decided, and the task written for it unless an adjustment above changes that task, then write again what is missing or left unfinished and return the whole result again. Never rewrite the four files from scratch, never write a decided entry the folder no longer holds from memory (name it in shape.md as lost), and never change or remove anything under its redline/ folder.'
  // A resolve stop that is the workflow's check of what the resolve agent returned (#95, #97
  // R2-13, #99) is not a cause the person fixes by hand, and its first attempt has already turned
  // the pending entries and tasks into decided ones, so the rerun is told to correct what it wrote
  // (#108, R3-4). The clause is chosen by the stop, not by the agent alone (#108, R4-4): each of
  // those checks sets ownCheck, and neither the autopilot stop nor a crash does. The autopilot
  // stop is raised from the agent's own unresolved list, whose entries its rules keep pending, so
  // its rerun is told nothing more.
  const resolveFix = opts.agentType === 'redline:redline-resolve' && entry.ownCheck
    ? ' When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it: read shape.md and plan.md as that attempt left them, the entries it already decided and the tasks it already wrote included, correct what the error names, and return the whole result again.'
    : ''
  const finishComment = FINISH_COMMENT_LABELS.includes(opts.label) && postToGitHub
    ? ` Before Step 2, run \`${GH} pr-comments ${pr}\`: when a comment there has exactly the body of the file Step 1 wrote, an earlier attempt posted it, so post nothing, set posted true and comment_url to "" (the script prints no comment URL), and go on to Step 3.`
    : ''
  const recordCommit = opts.label === 'record commit'
    ? ` Before Step 1, run \`git -C ${repoRoot} status --porcelain --untracked-files=all -- <the paths Step 1 names>\`: when it prints nothing, an earlier attempt committed them, so skip Steps 1 and 2, set committed true and sha to the full SHA \`git -C ${repoRoot} rev-parse HEAD\` prints, and do Step 3.`
    : ''
  return `\n\nResume attempt ${entry.attempt} of this step. The run stopped at this step with an error (${entry.error}); the person has since fixed the cause by hand. Do the step again from the current state of the repository and the PR. What an earlier attempt already made stands (a commit, a posted review or reply, a written file), and the duplicate checks in your instructions apply.${shaper}${resolveFix}${finishComment}${recordCommit}`
}

// The strings "" and '' and null, which a model writes for "nothing", count as empty (#34 round 2
// failed a passing gate on error: '""'), and the text is trimmed. run() applies it to every agent's
// result as it comes back, the GitHub agent's and the checker's alike, so a call site reads .error
// as it is: Losers League PR #790 stopped at Finish on a PR description update that ran nothing (#42).
function errorText(out) {
  const text = typeof out.error === 'string' ? out.error.trim() : ''
  return ['""', "''", 'null'].includes(text) ? '' : text
}

async function run(stage, prompt, opts) {
  lastLabel = opts.label
  if (resume[opts.label]) {
    // The resume point: the hand commits' paths join the approved paths here, never at startup,
    // so the snapshot prompt before this point stays byte-identical and replays from cache.
    approvedPaths = unique(approvedPaths.concat(resume[opts.label].hand.paths))
    prompt += resumeLine(opts)
  }
  const out = await agent(prompt, opts)
  if (out === null || out === undefined) {
    throw stageError(stage, `${opts.label} returned nothing (skipped, stalled on every attempt, or died on an API error)`)
  }
  // A copy, so the object agent() handed back is left as it was.
  return typeof out === 'object' && 'error' in out ? { ...out, error: errorText(out) } : out
}

function mentions(message, id) {
  return new RegExp(`(^|[^A-Za-z0-9-])${id.replace(/[-]/g, '\\-')}([^0-9]|$)`).test(message || '')
}

// A commit that is a finding's own (#97, R3-5): the one the implementer reported for it, or one
// whose subject opens with its id, as a finding's own commit does (`redline: R1-2 reject ...`). A
// commit that names the id later, as the standards commit does when it finishes a finding, only
// mentions it.
function ownCommit(commit, id) {
  return commit.finding === id || new RegExp(`^redline: ${id.replace(/[-]/g, '\\-')}([^0-9]|$)`).test(commit.message || '')
}

// ---------------------------------------------------------------------------
// Schemas. Every agent returns through one.
// ---------------------------------------------------------------------------

const str = { type: 'string' }
const int = { type: 'integer' }
const bool = { type: 'boolean' }
const strings = { type: 'array', items: str }

const GATHER_SCHEMA = {
  type: 'object',
  required: ['number', 'title', 'body', 'state', 'baseRefName', 'headRefName', 'headRefOid', 'url', 'error'],
  properties: {
    number: int, title: str, body: str, state: str, baseRefName: str, headRefName: str, headRefOid: str, url: str, error: str,
  },
}

const FINDING_SCHEMA = {
  type: 'object',
  required: ['id', 'file', 'line', 'side', 'category', 'severity', 'confidence', 'title', 'description', 'proposedFix', 'knownAs', 'carriedFrom'],
  properties: {
    id: str,
    file: str,
    line: int,
    side: { type: 'string', enum: ['RIGHT', 'LEFT'] },
    category: { type: 'string', enum: ['correctness', 'nit'] },
    severity: { type: 'string', enum: ['high', 'medium', 'low'] },
    // What the verifier established (#93): confirmed is reproduced, or traced through the code to
    // the claimed result; unconfirmed is the narrow case of a claim the repository cannot show,
    // with one line on what would confirm it. The shaper takes a second look at an unconfirmed one.
    confidence: { type: 'string', enum: ['confirmed', 'unconfirmed'] },
    title: str,
    description: str,
    proposedFix: str,
    wouldConfirm: str,
    // A fact the verifier states, never a reason to drop the finding: the cause is in code this
    // pull request did not change.
    outsideDiff: bool,
    // A fact the verifier states on a fix-diff round (#95): the cause is in the previous round's
    // fixes. The workflow checks it against the paths that round's plan named, and never infers it.
    inFixDiff: bool,
    knownAs: str,
    carriedFrom: str,
    // The id of a repository ask rule the reviewer judges the finding to be under (#49);
    // advisory: the review marks it, and the shaper applies the rules.
    askRule: str,
  },
}

// The verifier's accounting for the coverage pass's candidates (#79): one entry per candidate index.
// Since #93 the verifier states one of three facts about a candidate (verified, unconfirmed,
// refuted) or collapses it (duplicate, settled, known); what to do about a true one is the
// shaper's, so there is no outcome for "not worth acting on" and no list for the person.
const COVERAGE_OUTCOMES = ['verified', 'unconfirmed', 'refuted', 'duplicate', 'settled', 'known']
// The outcomes the round lists elsewhere: a verified or unconfirmed candidate is a finding of the
// round, listed by kind (or under Carried forward). Every other candidate is set aside,
// by this one rule and not by a list of outcomes, so an outcome the schema adds later is listed too
// (#85; the #85 follow-up spec): the review body lists each in its set-aside block, and the handoff
// the last covered round's, so the person can overrule a drop, a collapse or a match to an issue
// without opening the round folder. A candidate behind a finding under Already tracked is among
// them: accountCoverage accounts for it as `known`, its ref the finding's id and the issue, so the
// finding is listed under Already tracked and its candidate in the block (#86, R5-3).
const LISTED_ELSEWHERE = ['verified', 'unconfirmed']
const COVERAGE_SCHEMA = {
  type: 'object',
  required: ['index', 'outcome', 'ref'],
  properties: { index: int, outcome: { type: 'string', enum: COVERAGE_OUTCOMES }, ref: str },
}

// A review's schema, built for the call (#75): `links` adds sameClassAs to a finding, the ids of
// earlier findings the verifier judges to be one class with it. Only a review whose prompt lists
// earlier findings is asked for it (showsEarlier), in its prompt and in its schema, so the first
// review of a pull request with no earlier round is the call it was before #75 and replays.
const reviewSchema = (links) => ({
  type: 'object',
  required: ['round', 'reviewed', 'findings', 'resolved', 'summary'],
  properties: {
    round: int,
    reviewed: { type: 'string', enum: ['pr', 'fix-diff', 'final-nit-pass'] },
    findings: { type: 'array', items: links ? { ...FINDING_SCHEMA, properties: { ...FINDING_SCHEMA.properties, sameClassAs: strings } } : FINDING_SCHEMA },
    resolved: { type: 'array', items: { type: 'object', required: ['id', 'why'], properties: { id: str, why: str } } },
    summary: str,
    coverage: { type: 'array', items: COVERAGE_SCHEMA },
  },
})
const REVIEW_SCHEMA = reviewSchema(false)
const REVIEW_SCHEMA_LINKS = reviewSchema(true)

const POST_SCHEMA = {
  type: 'object',
  required: ['operation', 'dryRun', 'posted', 'skipped', 'review', 'files', 'error'],
  properties: {
    operation: str,
    dryRun: bool,
    posted: bool,
    skipped: str,
    review: {
      type: 'object',
      required: ['id', 'html_url', 'comments', 'movedToBody'],
      properties: {
        id: int,
        html_url: str,
        comments: {
          type: 'array',
          items: { type: 'object', required: ['finding', 'id'], properties: { finding: str, id: int, path: str, line: int } },
        },
        movedToBody: strings,
      },
    },
    files: strings,
    error: str,
  },
}

const FILE_OP_SCHEMA = {
  type: 'object',
  required: ['operation', 'files', 'error'],
  properties: { operation: str, files: strings, error: str },
}

// Finish's read of the highest posted round (#81), as redline-gh.sh last-round prints it.
const LAST_ROUND_SCHEMA = {
  type: 'object',
  required: ['operation', 'round', 'error'],
  properties: { operation: str, round: int, error: str },
}

// Filing a round's deferred drafts (#95): one entry per draft, as redline-gh.sh defer prints it.
const DEFER_SCHEMA = {
  type: 'object',
  required: ['operation', 'deferred', 'error'],
  properties: {
    operation: str,
    deferred: {
      type: 'array',
      items: { type: 'object', required: ['finding', 'where', 'number', 'url', 'path', 'reused'], properties: { finding: str, where: { type: 'string', enum: ['issue', 'draft'] }, number: int, url: str, path: str, reused: bool } },
    },
    error: str,
  },
}

// The spec check (#57): the spec folder's files and the Decisions heading, as the GitHub agent's
// two git grep commands print them.
const SPEC_STATUS_SCHEMA = {
  type: 'object',
  required: ['operation', 'files', 'headings', 'error'],
  properties: { operation: str, files: strings, headings: strings, error: str },
}

// The pass's fixed reasons, plus one per repository ask rule (#49). A Redline round's enum is
// ROUND_WHY (#93) and a human review pass's HUMAN_WHY, each with the rule reasons, so a value from
// the other pass is refused by the shaper's structured output inside its own run, and checkWhy
// stays the second layer (#94, R1-5, R1-12, R1-13).
// Every option states what choosing it ends in (#105), `ends`, one of the three a call's decision
// can end in, and the call names the option the shaper recommends by its label, `recommended`;
// `recommendation` stays the sentence a person reads. The person is shown each option's end
// before deciding, and a decision that picks an option takes that end as its disposition
// (resolveWith), so the end is stated before the decision and never read from a label or from
// prose. Both are required in both passes' schemas, and checkOptions is the second layer.
function judgmentCallSchema(reasons) {
  return {
    type: 'object',
    required: ['id', 'title', 'story', 'why_human', 'options', 'recommended', 'recommendation', 'dependsOn'],
    properties: {
      id: str,
      title: str,
      story: str,
      why_human: { type: 'string', enum: reasons.concat(askRules.map((rule) => `repository rule ${rule.id}`)) },
      options: {
        type: 'array',
        // `draft` (#126) is the drafted issue of an option that ends in defer, on a call for a
        // finding left to the person: Redline files it when the person picks that option. Its
        // fields are checked by the workflow (checkOptions), not required here, as a deferred
        // entry's are; on any other option it is dropped.
        items: { type: 'object', required: ['label', 'cost', 'effect', 'ends'], properties: { label: str, cost: str, effect: str, ends: { type: 'string', enum: CALL_ENDS }, draft: { type: 'object', properties: { title: str, found: str, why: str, fullFix: str } } } },
      },
      recommended: str,
      recommendation: str,
      dependsOn: strings,
    },
  }
}

// A deferred item (#95): worth doing, not in this pull request. `mitigation` is the words for what
// ships now, an empty string when nothing does. The words never decide what ships (#100): before
// the build that is the task the round planned with files, and after it the commit of the
// finding's own, so no wording can stop a round or demand a commit. The words are shown, in a
// stop's drafts and in the result's deferred list, only beside a mitigation the record says ships;
// the plan dial's list of the shaper's dispositions shows them as the shaper wrote them, beside
// the files it listed (#103, R2-4). Until #100 a list of phrases for nothing (none, n/a, nothing
// ships now) was read from the field, and a wording it missed demanded a commit the plan had no
// task for (#97, R1-7, R3-2). And since #99 nothing reads the field to decide anything: whether a
// call's decision deferred its finding is read from what the resolve agent states (`decided` in
// RESOLVE_SCHEMA), where the field was read as filled or empty until then, to tell a person's
// "Mitigate" answer from a fix with a stray entry (#103, R2-3). `title`, `found`, `why` and
// `fullFix` are its drafted issue, which stands on its own. The draft fields are checked by the
// workflow, not required here, since the resolve agent's entry for a finding left to the person
// under a repository rule carries none.
const DEFERRED_SCHEMA = {
  type: 'array',
  items: { type: 'object', required: ['id', 'mitigation', 'fullFix'], properties: { id: str, mitigation: str, fullFix: str, title: str, found: str, why: str } },
}
const DRAFT_FIELDS = ['title', 'found', 'why', 'fullFix']
// A draft field is missing when it is no string or holds nothing; the title is read as it will be
// filed, so one that cleans to nothing (control characters only) is missing too (#97, R1-8).
const draftMissing = (item) => DRAFT_FIELDS.filter((key) => !item || typeof item[key] !== 'string' || (key === 'title' ? draftTitle(item[key]) : item[key].trim()) === '')
// How a drafted issue's body fields are asked for (#97, R3-3): issueDraft passes each through
// postedText as one text, and a text with a line break is escaped whole, its code spans included
// (#87), so code in a field written over several lines would show its entities in the filed
// issue. One paragraph a field, with code in inline code spans, keeps each span as written. A
// rule that escapes a body by Markdown block waits on a measurement of GitHub's renderer, the
// drafted issue of #97, R3-3.
const DRAFT_FORM = 'Write a drafted issue\'s found, why and fullFix each as one paragraph with no line break, and quote code in inline code spans: a field with a line break is escaped whole, its code spans included, so a `<`, an `&` or an `@word` in its code would show as an entity in the filed issue.'
// One deferred entry per finding (#97, R2-12): the first an agent returned, which checkDrafts and
// outcomesFor read (both take the first with find), and the ids it returned more than once. A
// second entry would be a second draft, a second filing over the first's file and a second line
// under Deferred.
function firstPerId(list) {
  const seen = new Set()
  const repeated = []
  const kept = (list || []).filter((item) => {
    if (seen.has(item.id)) {
      repeated.push(item.id)
      return false
    }
    seen.add(item.id)
    return true
  })
  return { kept, repeated: unique(repeated) }
}

// The shaper's schema, one per pass (#94, R1-5, R1-12): only its judgment calls' why_human enum
// and its disposition enum differ, so a Redline round's shaper is refused a human pass's reason in
// its own run, and the other way about.
// A Redline round's finding may carry `cause` (#75): for a fix, where its cause lives, what the
// fix makes of it and why, and for a sweep what the sweep covered. It is not required here,
// since only a fix has one; checkCauses holds every fix of the shaper's own to it. A human
// review pass has no such step, so its schema has no such key (`cause` false).
const CAUSE_OUTCOMES = ['one-place', 'sweep', 'instance']
const SWEPT_FOUND = ['holds', 'fixed']
const CAUSE_SCHEMA = {
  type: 'object',
  required: ['where', 'outcome', 'why'],
  properties: {
    where: str,
    outcome: { type: 'string', enum: CAUSE_OUTCOMES },
    why: str,
    swept: { type: 'array', items: { type: 'object', required: ['member', 'found'], properties: { member: str, found: { type: 'string', enum: SWEPT_FOUND } } } },
  },
}
function shapeSchema(reasons, dispositions, cause) {
  return {
    type: 'object',
    required: ['specFolder', 'findings', 'deferred', 'judgmentCalls'],
    properties: {
      specFolder: str,
      findings: {
        type: 'array',
        items: {
          type: 'object',
          // `files` is required (#100): the round reads whether a deferral planned a mitigation from
          // it, so an empty list has to mean no task, never a list the shaper was not asked for.
          required: ['id', 'disposition', 'decidedBy', 'recommendation', 'files'],
          properties: {
            id: str,
            // A Redline round sorts into fix, decline, defer or ask (#93). A human review pass sorts
            // into fix, ask or none (a comment that asks for nothing); never defer or decline, since
            // nothing a teammate asked for is deferred or declined by Redline on its own. The schema
            // carries the pass's own values, and the workflow still refuses the other pass's (#94, R2-3).
            disposition: { type: 'string', enum: dispositions },
            // "redline" for a fix, a decline or a defer settled from the evidence; "pending" for an ask, which
            // the workflow fills with the person's login or "redline (autopilot)"; "reviewer" for a
            // fix a teammate's comment asked for, which the workflow maps to their login.
            decidedBy: { type: 'string', enum: ['redline', 'pending', 'reviewer'] },
            // One sentence: the change planned for a fix, the mitigation for a defer, the
            // recommended option for an ask, the decision restated for a decline. The plan dial shows
            // it to the person.
            recommendation: str,
            // A decline's reason (#93), the sentence a teammate reads in the thread: why Redline does
            // not act. It never points at follow-up work, which is a defer (#95). Required for a
            // decline, which checkDeclineReasons holds the shaper to.
            reason: str,
            // What the shaper's second look made of a finding the verifier could not confirm (#93).
            secondLook: { type: 'string', enum: ['confirmed', 'refuted', 'unconfirmed'] },
            // The paths the finding's task would touch, an empty list when it has no task, and the
            // repository ask rule the shaper judged it under (#49); forceAskRules reads both, and
            // plannedFiles reads the paths of a deferral (#100).
            files: strings,
            askRule: str,
            ...(cause ? { cause: CAUSE_SCHEMA } : {}),
          },
        },
      },
      deferred: DEFERRED_SCHEMA,
      judgmentCalls: { type: 'array', items: judgmentCallSchema(reasons) },
    },
  }
}
// How every shape prompt asks for a finding's files (#100). Until then only a repository with ask
// rules was asked (rulesBlock), and a list left out read the same as a task that touches nothing.
// An ask's task holds options until the person decides, so its files are the paths its
// recommended change would touch, as the ask-rules block asks for them and forceAskRules reads
// them (#103, R2-5).
const FILES_ASK = 'files (the paths its task creates or changes, an empty list when it has no task; for an ask, the paths its recommended change would touch)'
// The same ask in a reshape prompt whose block names decided findings (#114, R1-4): the block
// gives a named finding's files one meaning, its task as plan.md holds it, whatever disposition
// is returned, so this clause keeps the recommended paths for every ask the block does not name
// and sends a named finding to the block, and no sentence of that prompt gives one finding two
// meanings (#103, R2-5). It names the asks by the block's own test, never as "still pending":
// the Return sentence lists the calls "still pending or newly raised" as two kinds, so an ask a
// reshape newly raises read as neither and was left the general clause's empty list, which
// forceAskRules matches against the paths rules (#114, R2-4). It is used only beside the block,
// so a reshape prompt with no block keeps FILES_ASK, byte for byte.
const FILES_ASK_DECIDED = 'files (the paths its task creates or changes, an empty list when it has no task; for an ask not named above as decided, the paths its recommended change would touch; for a finding named above as decided, the paths of its task as plan.md holds it)'
// How every shape prompt asks for what a call's options end in and for the recommended option
// (#105): a field the record is read from is required in its schema and asked for in every
// prompt that returns it, so the answer does not depend on the agent file the session loaded.
// The second half (#126) is the draft of a left call's defer option. It sits here, in the
// sentence every shape prompt ends with, and not in the ask-rules block: that block is shared
// with the reviewer's and the plan approver's prompts, which this ask does not concern, and a
// finding on one of Redline's own files is left to the person in a repository with no rules.
// A repository with no rules is told of Redline's own files alone, so no rule text reaches its
// prompts (#49). A human pass never leaves a finding on one of Redline's own files to the person
// (forceAskRules records one only when !pass.human), so its sentence names a rule call alone,
// and in a repository with no rules carries no left-call clause at all (#127, R1-2).
const LEFT_CALL = askRules.length ? 'a finding left to the person (one a repository ask rule covers, or one on a file of Redline\'s own)' : 'a finding on a file of Redline\'s own, which is left to the person'
const ENDS_ASK = 'ends on every option (what choosing it ends in: fix, a change in this pull request that leaves nothing to track elsewhere; defer, an issue, with or without a mitigation now; accept, no change) and recommended (the label, as written, of the option you recommend)'
const LEFT_DRAFT_ASK = ', an option that ends in defer also carries draft, its drafted issue as title, found, why and fullFix, and no other option carries one'
const OPTIONS_ASK = `${ENDS_ASK}; on a call for ${LEFT_CALL}${LEFT_DRAFT_ASK}`
const HUMAN_OPTIONS_ASK = askRules.length ? `${ENDS_ASK}; on a call for a finding a repository ask rule covers, which is left to the person${LEFT_DRAFT_ASK}` : ENDS_ASK
// How a Redline round's shape prompts ask for the cause of a fix (#75), with what each value
// means, since the record is read from it: the outcomes, and what a sweep's entries say.
const CAUSE_ASK = 'for a fix also cause, where its cause lives and what the fix makes of it: where (a path in the repository), outcome (one-place: the fix is made where the cause lives, so where is one of its files; sweep: the fix is this instance and a sweep of the class, with swept listing every member the sweep measured as member and found, holds when the code as it stands already handles it and fixed when it was exposed and this task\'s change closes it; instance: the cause is not a class) and why (one sentence)'
const SHAPE_SCHEMAS = { round: shapeSchema(ROUND_WHY, ['fix', 'decline', 'defer', 'ask'], true), human: shapeSchema(HUMAN_WHY, ['fix', 'ask', 'none'], false) }

const RESOLVE_SCHEMA = {
  type: 'object',
  required: ['specFolder', 'tasks', 'deferred', 'decided', 'unresolved'],
  properties: {
    specFolder: str,
    tasks: {
      type: 'array',
      items: { type: 'object', required: ['n', 'title', 'files', 'finding'], properties: { n: int, title: str, files: strings, finding: str } },
    },
    deferred: DEFERRED_SCHEMA,
    // What each judgment call's decision ends in (#99), one entry per call the resolve was asked
    // to state. The workflow reads a call's disposition from here, never from its deferred entry
    // or its task. An override and a call whose decision names its own disposition (#108, R1-2)
    // name theirs, a call answered by picking an option included, whose decision carries the
    // option's end (#105); a call left to the person under a rule has none to read. So none of
    // them has an entry, and since #105 the list holds the calls answered in the person's own
    // words and no others. The list is required, so an empty one means no call needed a
    // statement. A result recorded before #99 holds no list, and can replay only for a resolve
    // with no call, whose prompt did not change; resolveWith reads an absent list as empty.
    decided: {
      type: 'array',
      items: { type: 'object', required: ['id', 'disposition'], properties: { id: str, disposition: { type: 'string', enum: CALL_ENDS } } },
    },
    unresolved: {
      type: 'array',
      items: { type: 'object', required: ['id', 'why'], properties: { id: str, why: str } },
    },
  },
}

const PLAN_SCHEMA = {
  type: 'object',
  required: ['approved', 'adjustments', 'planPaths', 'notes'],
  properties: {
    approved: bool,
    adjustments: {
      type: 'array',
      items: { type: 'object', required: ['task', 'problem', 'change'], properties: { task: int, problem: str, change: str } },
    },
    planPaths: strings,
    notes: str,
  },
}

const STANDARDS_SCHEMA = {
  type: 'object',
  required: ['approved', 'rejected', 'deferred', 'noChanges'],
  properties: {
    approved: {
      type: 'array',
      items: { type: 'object', required: ['file', 'edit', 'alreadyCovered'], properties: { file: str, edit: str, alreadyCovered: bool } },
    },
    rejected: {
      type: 'array',
      items: { type: 'object', required: ['file', 'edit', 'reason'], properties: { file: str, edit: str, reason: str } },
    },
    deferred: {
      type: 'array',
      items: { type: 'object', required: ['file', 'edit', 'pendingDecision'], properties: { file: str, edit: str, pendingDecision: str } },
    },
    noChanges: bool,
  },
}

const IMPLEMENT_SCHEMA = {
  type: 'object',
  required: ['commits', 'checks', 'deviations', 'blocked'],
  properties: {
    commits: {
      type: 'array',
      items: { type: 'object', required: ['sha', 'finding', 'message'], properties: { sha: str, finding: str, message: str } },
    },
    checks: {
      type: 'object',
      required: ['ok', 'runs'],
      properties: { ok: bool, failed: strings, unexpected_files: strings, runs: int },
    },
    deviations: strings,
    blocked: {
      type: 'array',
      items: { type: 'object', required: ['task', 'finding', 'why', 'options'], properties: { task: int, finding: str, why: str, options: strings } },
    },
  },
}

const CHECKER_SCHEMA = {
  type: 'object',
  required: ['exit', 'status', 'reason', 'result', 'error'],
  properties: {
    exit: int,
    // read: the tool showed the script's whole JSON. result_unreadable: it did not, and reason
    // says why; the loop stops on it (#9). backgrounded: the tool moved a foreground run to the
    // background; no_result: a background run's wait reported no result coming (#40).
    status: { type: 'string', enum: ['read', 'result_unreadable'] },
    reason: { type: 'string', enum: ['', 'spilled', 'not_json', 'no_git_block', 'backgrounded', 'no_result'] },
    error: str,
    // The gate's JSON as a checks.sh of template v3 prints it (#68): a passing check is its name,
    // exit and recorded; a failing one adds cmd, truncated and its output; the git block counts
    // the allowed and changed files and lists the round's own commits; kept names the file the
    // full result is in, and verdict marks the answer of checks.sh --verdict. The last three git
    // keys are what a checks.sh from before v3 prints in place of the counts, and are still taken.
    result: {
      type: ['object', 'null'],
      properties: {
        mode: str,
        ok: bool,
        verdict: bool,
        kept: str,
        checks: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'exit', 'recorded'],
            properties: { name: str, cmd: str, exit: int, recorded: bool, truncated: bool, stdout: str, stderr: str },
          },
        },
        git: {
          type: ['object', 'null'],
          properties: {
            start_sha: str,
            round_sha: str,
            allowed_count: int,
            changed_count: int,
            unexpected_files: strings,
            uncommitted: strings,
            commits: { type: 'array', items: { type: 'object', properties: { sha: str, message: str } } },
            commits_count: int,
            diff_lines: int,
            formatter_touched_count: { type: ['integer', 'null'] },
            allowed: strings,
            changed_files: strings,
            formatter_touched_outside_pr: { type: ['array', 'null'], items: str },
          },
        },
      },
    },
  },
}

const PUSH_REPLY_SCHEMA = {
  type: 'object',
  required: ['operation', 'dryRun', 'pushed', 'replies', 'files', 'error'],
  properties: {
    operation: str,
    dryRun: bool,
    pushed: bool,
    replies: {
      type: 'array',
      items: { type: 'object', required: ['finding', 'comment_id', 'reply_id'], properties: { finding: str, comment_id: int, reply_id: int } },
    },
    files: strings,
    error: str,
  },
}

const PR_BODY_SCHEMA = {
  type: 'object',
  required: ['file', 'updated', 'backup', 'copy'],
  properties: { file: str, updated: bool, backup: str, copy: str },
}

const UPDATE_SCHEMA = {
  type: 'object',
  required: ['operation', 'prBody', 'error'],
  properties: { operation: str, prBody: PR_BODY_SCHEMA, error: str },
}

const FINISH_SCHEMA = {
  type: 'object',
  required: ['operation', 'dryRun', 'posted', 'comment_url', 'reviewRequested', 'files', 'error'],
  properties: {
    operation: str,
    dryRun: bool,
    posted: bool,
    comment_url: str,
    reviewRequested: bool,
    files: strings,
    error: str,
  },
}

const SWEEP_SCHEMA = {
  type: 'object',
  required: ['operation', 'resolved', 'skipped', 'error'],
  properties: {
    operation: str,
    resolved: { type: 'array', items: { type: 'object', required: ['id', 'thread'], properties: { id: int, thread: str } } },
    skipped: { type: 'array', items: { type: 'object', required: ['id', 'reason'], properties: { id: int, reason: str } } },
    error: str,
  },
}

const RECORD_SCHEMA = {
  type: 'object',
  required: ['operation', 'committed', 'sha', 'pushed', 'files', 'error'],
  properties: { operation: str, committed: bool, sha: str, pushed: bool, files: strings, error: str },
}

// ---------------------------------------------------------------------------
// Bodies the GitHub agent writes verbatim. Composed here so the words are
// deterministic and never depend on a model's paraphrase.
// ---------------------------------------------------------------------------

function findingLine(f) {
  // The suffixes redline-gh.sh prior-findings reads back, in this order: carried_from (#35), then
  // the repository ask rule the finding is the person's under (#49), which stays last. An
  // unconfirmed finding carries what would confirm it on a second, indented line, which is no
  // finding line to that reader.
  const carried = f.carriedFrom ? ` · first reported as ${f.carriedFrom}` : ''
  const rule = ruleOf(f)
  const yours = rule ? ` · left to ${personLabel} under rule ${rule.id}` : ''
  const would = f.confidence === 'unconfirmed' ? `\n  Would confirm it: ${postedText(f.wouldConfirm || 'not stated')}` : ''
  return `- **${f.id}** · ${f.category} · ${f.severity} · ${f.confidence} · \`${f.file}:${f.line}\` · ${postedText(f.title)}${carried}${yours}${would}`
}

// A line the correctness-only scope declined (#93): its id is not bold, so redline-gh.sh
// prior-findings never reads it back as a finding, and a later run without the scope sees the
// item fresh. The title is the verifier's and goes through postedText (#87; #94, R1-16).
function scopedLine(f) {
  return `- ${f.id} · \`${f.file}:${f.line}\` · ${postedText(f.title)}`
}

// What a final nit pass at `round` read (#95): the nit fixes, unless the round before it fixed a
// low-severity correctness finding from its own fix diff like a nit, which is no nit fix.
function fixesRead(round) {
  const before = rounds.find((record) => record.round === round - 1)
  return before && (before.minor || []).length ? `round ${round - 1}'s fixes` : 'the nit fixes'
}

// `source` names the pass whose fixes a final nit pass reads when it is not the previous round (the
// fixes of a human review pass, #36); empty for a Redline round's nit fixes.
function reviewBody(round, reviewed, range, review, active, known, source) {
  const earlier = firstRound === 2 ? ' Round 1 is already on this PR' : ` Rounds 1 to ${firstRound - 1} are already on this PR`
  const coverage = review.coverage && !Array.isArray(review.coverage) ? review.coverage : null
  const scope = reviewed === 'pr'
    ? `Reviewed the whole pull request.${firstRound > 1 ? `${earlier}; this run starts at round ${firstRound}.` : ''}`
    : reviewed === 'fix-diff'
      ? coverage
        ? range.empty
          ? `Round ${round - 1} changed no code; reviewed the coverage pass's candidates over the whole pull request at ${short(range.to)}.`
          : `Reviewed the fix diff from round ${round - 1} (${short(range.from)}..${short(range.to)}), and the coverage pass's candidates over the whole pull request at ${short(range.to)}.`
        : `Reviewed only the fix diff from round ${round - 1} (${short(range.from)}..${short(range.to)}).`
      : `Final nit pass: reviewed only ${source ? `the fixes from ${source}` : fixesRead(round)} (${short(range.from)}..${short(range.to)}) for correctness bugs they introduced.`
  // By kind (#93): what the verifier confirmed, correctness first; then what it could not confirm,
  // each with what would confirm it. The review is posted before anything is decided, so what
  // became of each is in its thread and in the handoff.
  const fresh = active.filter((f) => !f.carriedFrom)
  const carried = active.filter((f) => f.carriedFrom)
  const unconfirmed = fresh.filter((f) => f.confidence === 'unconfirmed')
  const correctness = fresh.filter((f) => f.confidence !== 'unconfirmed' && f.category === 'correctness')
  const other = fresh.filter((f) => f.confidence !== 'unconfirmed' && f.category !== 'correctness')
  const scoped = review.scoped || []
  const counts = (list) => `${list.filter((f) => f.category === 'correctness').length} correctness, ${list.filter((f) => f.category === 'nit').length} nit`
  const lines = [`Redline round ${round}`, '', scope]
  if (coverage) {
    lines.push('', coverageSentence(coverage))
  }
  lines.push('', postedText(review.summary.trim()))
  if (active.length === 0 && scoped.length === 0) {
    lines.push('', 'No findings.')
  }
  if (correctness.length) {
    lines.push('', `### Correctness (${correctness.length})`, '', ...correctness.map(findingLine))
  }
  if (other.length) {
    lines.push('', `### Other items (${other.length})`, '', ...other.map(findingLine))
  }
  if (unconfirmed.length) {
    lines.push('', `### Could not confirm (${unconfirmed.length})`, '', ...unconfirmed.map(findingLine))
  }
  // Under correctness only, what is not a correctness item is declined by the workflow with the
  // scope as its reason (#93): one list, an id that is not bold, so redline-gh.sh prior-findings
  // never reads a line back and a later run without the scope sees these fresh; no inline comment.
  // A final nit pass declines a nit its reviewer reports the same way, under its own scope (#94, R7-10).
  if (scoped.length) {
    lines.push('', `### Declined under ${scopeName(reviewed === 'final-nit-pass')} (correctness only) (${scoped.length})`, '', ...scoped.map(scopedLine))
  }
  // Earlier rounds' findings with no disposition, re-verified and carried into this round (#35).
  if (carried.length) {
    lines.push('', `### Carried forward from earlier rounds (${counts(carried)})`, '', ...carried.map(findingLine))
  }
  const resolved = review.resolved || []
  if (resolved.length) {
    lines.push('', '### Resolved from earlier rounds', '', ...resolved.map((r) => `- **${r.id}** ${postedText(`${priorById[r.id] ? priorById[r.id].title : ''}: ${r.why}`)}`))
  }
  if (known.length) {
    lines.push('', '### Already tracked', '', ...known.map((f) => `- **${f.id}** ${postedText(`${f.title}: ${f.knownAs}`)}${f.carriedFrom ? ` · first reported as ${f.carriedFrom}` : ''}`))
  }
  // The closing sentence speaks of the items, so it follows the last list the round has and comes
  // before the set-aside block, never under the block's heading (the #87 follow-up spec, answer
  // 9). No reader in redline-gh.sh depends on where it sits.
  // What the scope declined has neither, so the sentence says so when the body lists any (#94, R1-6).
  if (active.length) {
    lines.push('', `Each item has an inline comment with the detail or, where GitHub could not anchor it, sits under Not placed inline below. Redline replies in the item's thread, or in a PR comment that opens with its marker, with what it decided and why.${scoped.length ? ` The items declined under ${scopeName(reviewed === 'final-nit-pass')} have no inline comment and no reply.` : ''}`)
  }
  const setAside = review.setAsideCandidates || []
  if (setAside.length) {
    lines.push('', ...setAsideBlock(setAside))
  }
  return lines.join('\n')
}

// A line that opens with a place and no id, as a set-aside line does, so redline-gh.sh
// prior-findings (which reads "- **R<n>-<k>** · ..." lines only) never takes it for a finding.
// The place is the workflow's and is left as written; the text is the finder's or the verifier's
// and goes through postedText (#87).
function personLine(entry) {
  return `- \`${entry.file}:${entry.line}\` · ${postedText(entry.text)}`
}

// The set-aside block (#85; the #85 follow-up spec; #93): every candidate that is not a finding of
// the round (refuted, a duplicate, settled or known), collapsed, one line each with the candidate's own file, line and
// summary, whole, then the outcome and the verifier's ref, so a refutation that answers a
// different claim shows as a mismatch on the line. A duplicate of another candidate's index also
// gives that candidate's place and outcome, so a duplicate of a dropped or tracked candidate
// cannot hide, and, when that candidate became a finding, which the block does not list, the
// finding's id after the outcome (#86, R5-4). The block sits under its own heading, which carries
// the count, so it never reads as part of the section before it (#87); the summary names the count
// sentence's three groups, which add up to it.
// Each line is built by personLine, so it opens with the backticked place, never a finding id, and redline-gh.sh prior-findings never reads it back (#86, R1-3); its
// text, summary, outcome, ref and the duplicate's addition read as one, goes through postedText
// there, so a tag in a summary or a ref cannot end the block or open another, and no `@` in it
// mentions anyone. `round` names the round in the handoff, which carries only the last covered
// round's block.
function setAsideBlock(entries, round) {
  const where = round ? ` in round ${round}` : ''
  const into = (e) => (e.into ? ` (candidate ${e.into.index}, \`${e.into.file}:${e.into.line}\`: ${e.into.outcome}${e.into.id ? ` ${e.into.id}` : ''})` : '')
  return [
    `### Candidates set aside${where} (${entries.length})`,
    '',
    '<details>',
    '<summary>Refuted, collapsed or already tracked</summary>',
    '',
    ...entries.map((e) => personLine({ file: e.file, line: e.line, text: `${e.summary} · ${e.outcome}: ${e.ref || 'no reason given'}${into(e)}` })),
    '',
    '</details>',
  ]
}

// Free text the finder or the verifier wrote, as GitHub should show it (#87; the #85 follow-up
// spec): the one function every such field goes through where the review body, the handoff or an
// inline comment's title posts it. Outside code spans, `&` becomes `&amp;` and then `<` becomes
// `&lt;`, so a bare tag reads as text and cannot end the set-aside block, open another or bold the
// rest of the body, and `&#8288;` follows every `@` before an ASCII letter or digit, so a `@click`
// or a `@param` notifies nobody. That is the word joiner (U+2060) as a numeric character reference:
// GitHub decodes it before it looks for mentions, and outside a code span shows the invisible
// joiner, so the text reads as written. It is written as ASCII because the GitHub agent copies the
// body into a file with the Write tool and nothing compares that file with this text, so a raw
// joiner it dropped would make the mention live again unseen (the #87 follow-up spec). GitHub links
// `\@x`, `&#64;x`, `/@x` and `(@x)` as mentions, so the reference goes after the `@` whatever
// precedes it. Two places show it, since GitHub does not decode it there: a code span in a text
// escaped whole (`@&#8288;x`, beside the `&amp;` and `&lt;` that mode already shows) and a bare
// URL, whose link it breaks. The mentions the workflow writes itself (`@<reviewer>, over to you`, `decided by: @<login>`)
// never pass through here, so they stay live. Fields that share a line are passed as one text,
// since a backtick left open in one pairs with one in the next.
function postedText(text) {
  return textParts(text).map((p) => (p.span ? p.text : p.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/@(?=[A-Za-z0-9])/g, '@&#8288;'))).join('')
}

// A title read back from GitHub (redline-gh.sh prior-findings) as the finder or the verifier
// wrote it: the exact inverse of postedText, over the same parts. Escaping moves no backtick and
// adds no trigger, so the posted text splits as the raw one did. Outside spans the `&#8288;` after
// an `@` goes, then `&lt;` and then `&amp;` are decoded. postedText escapes a typed `&` before it
// adds the reference, so every `@&#8288;` in a posted text is the workflow's, and a `@&#8288;` the
// finder typed (posted `@&amp;#8288;`) reads back as typed: the inverse is exact for every text. A
// title posted before #87 comes back raw and is decoded all the same; one holding a literal `&lt;`
// then reads `<`, which GitHub already showed.
function readBack(text) {
  return textParts(text).map((p) => (p.span ? p.text : p.text.replace(/@&#8288;/g, '@').replace(/&lt;/g, '<').replace(/&amp;/g, '&'))).join('')
}

// A text cut into its code spans, left as written since GitHub shows a span literally, and the
// rest. Spans are read as GitHub pairs them: a run of n backticks opens a span that the next run of
// exactly n closes, and a run with no closer is plain text. A text that holds a trigger is one part,
// escaped whole, spans included (#87, decision 5 and answer 15 of its spec), because there GitHub
// reads a backtick as part of something else before it pairs code spans, or the pairing turns on
// more than run lengths: an inline link or image (`](`, a backtick in its destination or title), a
// full reference link (`][`, a backtick in a label a definition elsewhere in the body matches), a
// bare autolink (`://` or `www.`, any case: the link takes the backtick), a backslash before a
// backtick (it can escape the backtick, so the pairing turns on more than run lengths), a carriage
// return or a newline. A span in such a text then shows `&lt;` for a `<`. A backslash anywhere
// else changes no pairing, so a namespaced text (`App\Models\User`) keeps its spans (#89, R3-3).
// Each trigger, and each construct that needs none, was checked against GitHub's renderer (the
// spec's Evidence; for the narrowed backslash, the #89 round 3 spec's Decision 3).
function textParts(text) {
  if (/\]\(|\]\[|:\/\/|www\.|[\r\n]|\\`/i.test(text)) {
    return [{ span: false, text }]
  }
  const runs = [...text.matchAll(/`+/g)].map((m) => ({ at: m.index, end: m.index + m[0].length, n: m[0].length }))
  const parts = []
  let from = 0
  for (let i = 0; i < runs.length; i++) {
    const close = runs.findIndex((r, j) => j > i && r.n === runs[i].n)
    if (close === -1) {
      continue
    }
    parts.push({ span: false, text: text.slice(from, runs[i].at) }, { span: true, text: text.slice(runs[i].at, runs[close].end) })
    from = runs[close].end
    i = close
  }
  parts.push({ span: false, text: text.slice(from) })
  return parts
}

// Why nineteen candidates became four findings: the coverage record's counts, by outcome.
function coverageSentence(coverage) {
  const c = coverage.counts
  const n = coverage.candidates
  if (n === 0) {
    return `The coverage pass over the whole pull request at ${short(coverage.head)} returned no candidates.`
  }
  return `The coverage pass over the whole pull request at ${short(coverage.head)} returned ${n} candidate${n === 1 ? '' : 's'}: ${c.verified} verified, ${c.unconfirmed} could not be confirmed, ${c.refuted} refuted, ${c.duplicate + c.settled} collapsed into items already reported or settled, ${c.known} already tracked.`
}

function commentBody(f) {
  const lines = [`**${f.id}** · ${f.category} · ${f.severity} · ${f.confidence}`, '', `**${postedText(f.title)}**`]
  if (f.carriedFrom) {
    lines.push('', `First reported as ${f.carriedFrom} in Redline round ${priorById[f.carriedFrom] ? priorById[f.carriedFrom].round : f.carriedFrom.slice(1).split('-')[0]}.`)
  }
  lines.push('', f.description.trim())
  if (f.proposedFix && f.proposedFix.trim() !== '') {
    lines.push('', `Proposed fix: ${f.proposedFix.trim()}`)
  }
  // The facts the verifier states beside its description (#93): what would confirm a claim it
  // could not confirm, and a cause in code the pull request did not change. The Would confirm text
  // is one of the verifier's short fields, so it goes through postedText here as on the body line
  // (#94, R3-2).
  if (f.confidence === 'unconfirmed') {
    lines.push('', `Could not confirm. Would confirm it: ${postedText((f.wouldConfirm || 'not stated').trim())}`)
  }
  if (f.outsideDiff) {
    lines.push('', 'The cause is in code this pull request did not change.')
  }
  const rule = ruleOf(f)
  if (rule) {
    lines.push('', `This one is left to ${personLabel}: repository rule ${rule.id} (${rule.reason}).`)
  }
  return lines.join('\n')
}

// A drafted issue's title as it is filed (#95, decision 38 of its spec). GitHub shows an issue
// title as plain text: it decodes no entity there and links no @word (measured on GraphQL's
// titleHTML; the spec's Evidence), so the title is never passed through postedText, which would
// put `&lt;` and `&#8288;` on screen. It is made safe as plain text instead: one line (a newline,
// a carriage return or a tab becomes a space), no control characters, and at most GitHub's 256
// characters, counted as characters so no pair is cut in half.
function draftTitle(text) {
  const line = String(text || '').replace(/[\r\n\t]+/g, ' ').replace(/[\x00-\x1f\x7f-\x9f]/g, '').trim()
  return [...line].slice(0, 256).join('').trim()
}

// A deferred finding's drafted issue as the GitHub agent writes it and redline-gh.sh defer files
// it (#95): the first line is the title, the second is empty, the rest is the body. The shaper's
// (or the resolve agent's) fields each go through postedText as one text, since the body is
// posted text GitHub renders: no tag in it can break the body and no @word notifies, while a
// code span stays as written in a field with no line break; a field with one is escaped whole,
// its spans included (#87), so the prompts ask for each field as one paragraph (DRAFT_FORM; #97,
// R3-3). The place and the last line are the workflow's own. The last line
// names the pull request, the pass and the finding, text only this issue carries: the script
// looks an issue up by it before it opens one. Each title is cleaned before one is chosen, so a
// title of the person's that cleans to nothing gives way to the shaper's (#97, R1-8). The Where
// line names a place that exists: none for a finding minted with no file (NO_FILE), and the file
// alone when the finding gives no line (#97, R2-5).
function issueDraft(pass, f, item, title) {
  return [
    `# ${draftTitle(title) || draftTitle(item.title)}`,
    '',
    postedText(item.found.trim()),
    '',
    ...(f && f.file && f.file !== NO_FILE ? [`- **Where:** \`${f.file}${Number.isInteger(f.line) && f.line > 0 ? `:${f.line}` : ''}\``] : []),
    `- **Why it is not fixed in #${pr}:** ${postedText(item.why.trim())}`,
    `- **Proposed fix:** ${postedText(item.fullFix.trim())}`,
    '',
    `Deferred from pull request #${pr} by Redline (${pass.name}, finding ${item.id}).`,
    '',
  ].join('\n')
}

// A composed draft cut back into its title and its body, as redline-gh.sh defer cuts it.
function draftParts(text) {
  const lines = text.split('\n')
  return { title: lines[0].replace(/^# /, ''), body: lines.slice(2).join('\n') }
}

// Where a deferred item went, as a reply and the handoff say it (#95): the issue's number, or the
// draft's path.
const deferredTo = (filed) => (filed.where === 'issue' ? `deferred to #${filed.number}` : `deferred; the issue draft is at \`${filed.path}\``)
// The same, closing a decision of the person's: a deferral they chose stays their decision.
const deferredSentence = (filed) => (filed.where === 'issue' ? ` Deferred to #${filed.number}.` : ` The issue draft is at \`${filed.path}\`.`)

// A decision as it reaches GitHub: the session's one-sentence restatement (choice and reasoning),
// never the person's chat. The choice label stands in only when a decision carries no notes.
function decisionSentence(decision, human) {
  const notes = (decision.notes || '').trim()
  return notes !== '' ? notes : `${human ? 'The author' : personLabelStart} chose: ${decision.choice}.`
}

// Every decision names its owner, in the spec, in the thread and in the handoff comment.
function decidedBy(owner) {
  return ` · decided by: ${owner || REDLINE}`
}

// A person's decision as the run records it: the workflow owns the attribution, so a decision
// from args carries the login whatever the session wrote, except an autopilot one.
function withOwner(decision) {
  return { ...decision, decidedBy: decision.decidedBy === AUTOPILOT ? AUTOPILOT : personLabel }
}

// autopilot: the shaper's recommendation becomes the decision, attributed to the autopilot. It
// is a pick of the option the call names in `recommended` (#105), so it carries that label as
// its option and takes the option's end like a person's pick (resolveWith); the choice and the
// notes stay the recommendation's sentence, which is what is recorded and posted. Until #105
// the resolve agent matched that sentence to an option and stated what it ended in.
function autopilotDecision(call) {
  const recommendation = (call.recommendation || '').trim().replace(/\.$/, '')
  return {
    choice: recommendation,
    option: call.recommended,
    notes: `Autopilot took the shaper's recommendation: ${recommendation}.`,
    date: launchDate,
    decidedBy: AUTOPILOT,
  }
}

// autopilot on a finding a repository ask rule covers (#49), or one on Redline's own files (#94,
// R8-4): nothing is applied; the finding is left to the person, with the rule as the reason.
function leftDecision(forced, human) {
  return {
    choice: 'Left to the person',
    notes: `${forced.own ? "Redline's own files" : `Repository rule ${forced.rule}`}: ${forced.reason}. No change made; ${human ? 'the person' : personLabel} makes it.`,
    date: launchDate,
    decidedBy: AUTOPILOT,
    rule: forced.rule,
    ...(forced.own ? { own: true } : {}),
  }
}

// "a", "a and b", "a, b and c".
function andList(items) {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

// A reply's route comes from whether the round's review is on GitHub, never from a missing thread
// id alone (#34, R1-7):
// - 'thread': the finding has an inline thread, and the reply goes in it.
// - 'issue-comment': the review is on GitHub but the finding sits in its body behind
//   <!-- redline:<id> -->, so the reply is an issue comment that opens with the marker and names
//   the finding; the GitHub agent posts it with `comment` instead of `reply`.
// - 'file-only': no review is on GitHub (a dry run, or a revise over a review that was only
//   written), so the reply file is written and nothing is posted.
// In a human review pass the body finding (the review's own text, no thread) takes the same route,
// with a header naming the teammate's review (`from review <id> by @<login>`), which
// `redline-gh.sh human-review` reads back so it never takes an answered body again (#38, R1-3),
// instead of a Redline round's body.
function replyEntry(pass, f, outcome, commentId, reviewPosted) {
  const body = replyBody(pass, outcome)
  // A dry run posts nothing, whatever threads exist (a human review's threads are real even then).
  const route = !postToGitHub ? 'file-only' : commentId ? 'thread' : reviewPosted ? 'issue-comment' : 'file-only'
  return {
    finding: f.id,
    comment_id: commentId,
    route,
    file: abs(pass.replyFile(f.id)),
    body: route === 'issue-comment' ? `<!-- redline:${f.id} -->\n${pass.bodyHeader(f)}\n\n${body}` : body,
  }
}

// The reply in an earlier round's thread for a finding this round carried forward or resolved
// (#35): one entry per earlier finding, in this round's words, filed under this round. An earlier
// body finding (no thread) is answered behind its own marker with its own round's header.
function priorReplyEntry(pass, prior, text, reviewPosted) {
  const route = !postToGitHub ? 'file-only' : prior.comment_id ? 'thread' : reviewPosted ? 'issue-comment' : 'file-only'
  const priorPass = passOf({ round: prior.round, specFolder: '' })
  const body = `${pass.title}: ${text}`
  return {
    finding: prior.id,
    comment_id: prior.comment_id,
    route,
    file: abs(pass.replyFile(prior.id)),
    body: route === 'issue-comment' ? `<!-- redline:${prior.id} -->\n${priorPass.bodyHeader(prior)}\n\n${body}` : body,
  }
}

// The carried-forward replies for the findings of this round that carry an earlier one: the
// earlier thread hears the new id and the same outcome its finding got.
function carriedReplies(pass, record, findings, outcomes) {
  return findings
    .filter((f) => f.carriedFrom && priorById[f.carriedFrom])
    .map((f) => priorReplyEntry(pass, priorById[f.carriedFrom], `carried forward as ${f.id}; ${replyBody(pass, outcomes[f.id]).slice(pass.title.length + 2)}`, record.reviewPosted))
}

// A thread gets one reply per pass (#38, R1-4). In a human review pass two open comments of one
// thread (a teammate's comment and their own follow-up) are two findings with one root, so their
// entries merge: one reply that opens with the pass's title and gives each finding's outcome on
// its own line. A Redline round's findings each have their own root, so it never merges.
function mergeThreadReplies(pass, entries) {
  if (!pass.human) {
    return entries
  }
  const groups = []
  const byThread = new Map()
  for (const entry of entries) {
    const group = entry.comment_id ? byThread.get(entry.comment_id) : null
    if (group) {
      group.push(entry)
      continue
    }
    const fresh = [entry]
    groups.push(fresh)
    if (entry.comment_id) {
      byThread.set(entry.comment_id, fresh)
    }
  }
  return groups.map((group) => {
    if (group.length === 1) {
      return group[0]
    }
    const ids = group.map((entry) => entry.finding)
    return {
      finding: ids[0],
      findings: ids,
      comment_id: group[0].comment_id,
      route: group[0].route,
      file: abs(pass.replyFile(ids.join('-'))),
      body: `${pass.title}:\n\n${group.map((entry) => `**${entry.finding}**: ${entry.body.slice(pass.title.length + 2)}`).join('\n\n')}`,
    }
  })
}

// A human-pass thread reply names the comments it answers (#38, R1-1): its last line is a hidden
// <!-- redline:answers <ids> --> with each of its findings' own commentId, so redline-gh.sh
// human-review counts a comment in a shared thread as answered only when a reply names it. A
// body reply (no thread) and a Redline round's replies carry no such line; the script answers
// a reply without it by the thread rule.
function withAnswers(pass, findings, entries) {
  if (!pass.human) {
    return entries
  }
  const commentOf = Object.fromEntries(findings.map((f) => [f.id, Number(f.commentId) || 0]))
  return entries.map((entry) => {
    if (!entry.comment_id) {
      return entry
    }
    const ids = unique((entry.findings || [entry.finding]).map((id) => commentOf[id] || entry.comment_id))
    return { ...entry, body: `${entry.body}\n\n<!-- redline:answers ${ids.join(' ')} -->` }
  })
}

// What a reply and the handoff quote for a commit (#94, R6-5): its subject as written. A checks.sh
// of template v3 cuts a long subject for what the workflow matches (#68), so when git's subject was
// cut, the first line of the message the implementer reported for that commit is quoted, taken only
// when it is longer than the part the cut kept and opens with it. The cut is known by its "..."
// marker, never by the length: macOS's awk counts bytes, so a subject under 100 characters can be
// cut (#94, R7-6). message stays git's, and every match on a commit reads git's text.
function shownSubject(message, claimed) {
  const whole = claimed && typeof claimed.message === 'string' ? claimed.message.split('\n')[0].trim() : ''
  const kept = (message || '').lastIndexOf('...')
  return kept > 0 && whole.length > kept && whole.startsWith(message.slice(0, kept)) ? whole : message
}

// Every commit that carries part of a finding's fix: its own commit, and the standards commit when
// the plan sent part of the fix through the retrospective.
function replyBody(pass, outcome) {
  const local = push ? '' : ' Committed locally; not pushed.'
  const commits = andList(outcome.commits.map((c) => `${short(c.sha)} (${c.subject || c.message})`))
  const owner = decidedBy(outcome.decidedBy)
  switch (outcome.kind) {
    case 'fixed':
      return `${pass.title}: fixed in ${commits}.${local}${owner}`
    case 'deferred':
      // Where the item went (#95): the issue's number, or the draft's path. The reply opens
      // "deferred", which redline-gh.sh prior-findings reads back as the disposition, so a later
      // run never raises the finding again. A deferral that ships nothing is never called mitigated.
      return `${pass.title}: ${outcome.filed ? deferredTo(outcome.filed) : 'deferred'}.${commits ? ` Mitigated in ${commits}.${local}` : ''}${owner}`
    case 'decided':
      // A draft the person dropped (#95): their reason, that no issue was opened, and the
      // mitigation's commit when one shipped. It opens with the decision, so prior-findings reads
      // it as decided, which is settled all the same.
      if (outcome.draftDropped) {
        return `${pass.title}: ${decisionSentence(outcome, pass.human)} No issue was opened.${commits ? ` Mitigated in ${commits}.${local}` : ''}${owner}`
      }
      return `${pass.title}: ${decisionSentence(outcome, pass.human)}${commits ? ` Applied in ${commits}.${local}` : ' No code change.'}${draftClose(outcome)}${owner}`
    case 'declined':
      // Redline's own decision not to act (#93). redline-gh.sh prior-findings reads the opening
      // "declined: " back as the disposition, so a later run never raises the finding again.
      return `${pass.title}: declined: ${outcome.reason}${owner}`
    case 'left':
      // A left finding the person deferred closes with where its drafted issue went (#126). The
      // reply still opens "left to ... under", so redline-gh.sh prior-findings reads it back as
      // left under a repository rule, and as decided on Redline's own files, as before.
      return `${pass.title}: left to ${pass.human ? 'the author' : personLabel} under ${leftUnder(outcome)} (${outcome.reason}). ${outcome.notes}${draftClose(outcome)}${owner}`
    case 'dropped':
      return `${pass.title}: not acted on in this run. ${outcome.reason}${owner}`
    case 'none':
      return `${pass.title}: no change requested. ${outcome.why}${owner}`
    default:
      return `${pass.title}: not changed in this ${pass.human ? 'pass' : 'round'}. ${outcome.why}${owner}`
  }
}

// ---------------------------------------------------------------------------
// Prompts.
// ---------------------------------------------------------------------------

function gatherPrompt(round) {
  return `${RUN_LINE}

Operation: gather (round ${round}). Run \`${GH} pr ${pr}\` once and return its fields exactly as printed, with error set to "". If the script fails, return its stderr in error and empty values elsewhere. Run nothing else.`
}

// `source` names the pass whose fixes a final nit pass reads when it is not the previous round.
// `candidates` is the coverage pass's list on a round that ran one (#79), null otherwise: with
// null the prompt carries no candidates block and none of its rules, so `coverage off` is the
// reviewer alone under the same contract (#93): facts only, no accounting.
// Whether a review's prompt lists earlier findings (#75): this run's, with their outcomes (the
// history block), or the ones Redline's earlier rounds on the pull request handled (the handled
// block, whose test this repeats). Such a review is asked for sameClassAs, in its prompt and in
// its schema, and no other is.
const showsEarlier = (reviewed, history, candidates) => history.length > 0 || Boolean(trackedList.length && (reviewed === 'pr' || Array.isArray(candidates)))
const LINK_ASK = 'For each finding, state sameClassAs when its cause is one class with the cause of an earlier finding listed above that was fixed: the ids of those earlier findings, and leave it out when there is none. One class is one cause that takes one kind of fix, met again in another place or through another input: a second form of path a normaliser misreads after the first was fixed, a second caller that needs the guard a fix gave the first. It is a fact you state with care, as outsideDiff is, never because two findings sit in one file or read alike. The run checks each id against its record and keeps only a link to a finding recorded as fixed; a finding that keeps one is shaped as a class, so its fix may not be one more instance.'
function reviewPrompt(round, reviewed, range, facts, history, source, candidates) {
  const noFixDiff = reviewed === 'fix-diff' && range.empty === true
  const diff = reviewed === 'pr'
    ? `the whole pull request: \`${GH} diff ${pr}\``
    : noFixDiff
      // A round the last one bought without changing code (#93): nothing to recheck, the pass's
      // candidates are the round.
      ? `none: round ${round - 1} changed no code, so there is no fix diff to recheck (round ${round - 1} committed no fix; its spec and standards commits are not one)`
      : `only the fix diff: \`git diff ${range.from}..${range.to} -- ':/' ':(top,exclude)agent-os/specs'\` (the pathspec works from any directory in the repository and leaves out the round's spec folders, which are Redline's own record; do not review them)`
  const after = reviewed === 'pr' ? ` (${startSha})` : noFixDiff ? ` after round ${round - 1}, which changed no code (HEAD ${range.to})` : ` after the ${source || `round ${round - 1}`} fixes (HEAD ${range.to})`
  const lines = [
    RUN_LINE,
    '',
    `You are the reviewer for round ${round}. Finding IDs are R${round}-<n>.`,
    '',
    'Run facts:',
    `- PR #${pr}: ${facts.title}`,
    `- Head branch ${headRef}, base ${baseRef}; the working tree is the PR's head${after}.`,
    `- The diff to review: ${diff}. Inline comments must sit on lines of the PR's diff on GitHub (\`${GH} diff ${pr}\`).`,
    ...(reviewed === 'pr'
      ? [`- That diff is built from GitHub's per-file patches. A file GitHub sent no patch for (built assets, lockfiles, generated code, binaries) shows as a header and one \`(no patch: ...)\` line; open such a file in the tree only when a finding points there, never as a pass over all of them.`]
      : []),
    `- Reviewed: ${reviewed}`,
    `- Your scratch Pest test, if you write one: ${scratchTest('reviewer', `r${round}`)}`,
    '',
    'PR description:',
    '<<<',
    (facts.body || '').trim(),
    '>>>',
  ]
  if (history.length) {
    // With candidates, the header carries the decline-reopen exception (#94, R1-1), so it agrees
    // with the candidates block; with coverage off it is as before.
    const reopenDeclined = Array.isArray(candidates) ? ', except one declined because it could not be confirmed that you now confirm, which is new as the candidates block below says' : ''
    lines.push('', `Findings from earlier rounds and what became of them (never re-raise a declined, deferred or decided one${reopenDeclined}):`, json(history))
  }
  // The PR's earlier Redline rounds, from an earlier run (#35): tracked ones are matched into
  // knownAs; undispositioned ones are re-verified and carried or resolved, never dropped. The
  // coverage pass samples the whole PR at every head, so every round that ran it is shown the
  // handled list too (#80, R1-2); only the whole-PR round carries. The closing sentence below has
  // its own gate, so a whole-PR round with carry-forward priors only keeps it, and with coverage
  // off (candidates null) every prompt is as before.
  const priorBlock = reviewed === 'pr' && priorFindings.length
  const handledBlock = trackedList.length && (reviewed === 'pr' || Array.isArray(candidates))
  const matchSentence = priorBlock || (Array.isArray(candidates) && trackedList.length)
  if (handledBlock) {
    // With candidates, the header carries the reopen exception (#80, R3-3), so it agrees with the
    // candidates block; with coverage off it is as before.
    const reopen = Array.isArray(candidates) ? ', except a fixed one a coverage candidate shows still reproduces at this head, which is new and carries no knownAs, and one declined for want of confirmation that you now confirm, which is new the same way; a decided one stays settled whatever its commits' : ''
    lines.push('', `Findings Redline's earlier rounds on this PR already handled (a match goes in knownAs as "<id>: <disposition>"; never re-raise one${reopen}):`, json(trackedList.map((p) => ({ id: p.id, round: p.round, category: p.category, title: p.title, file: p.file, line: p.line, disposition: p.disposition, reply: p.reply ? p.reply.body : '' }))))
  }
  if (priorBlock && carryList.length) {
    lines.push('', 'Findings from earlier rounds with no disposition. Re-verify each against the current head, never copy its text: one that still holds is a finding of this round with carriedFrom set to its id (a fresh description, file and line); one the code no longer has goes in resolved with why. Every id here appears in exactly one of the two:', json(carryList.map((p) => ({ id: p.id, round: p.round, category: p.category, severity: p.severity, title: p.title, file: p.file, line: p.line, body: p.body }))))
  }
  if (askRules.length) {
    lines.push('', 'Repository ask rules, as JSON: what a person is always brought in for, declared in .claude/redline.json. Report a finding one covers (its file under a paths rule, or its change doing what a prose rule\'s sentence says) as usual, with askRule set to the rule\'s id; the review then marks it as the person\'s to act on. The tag is advisory: the shaper applies the rules.', json(askRules))
  }
  if (Array.isArray(candidates)) {
    lines.push('', ...candidatesBlock(reviewed, range, candidates))
  }
  lines.push(
    '',
    `Before you report anything, run the known-finding check your instructions describe: \`${GH} issues-search "<keywords>"\` for each candidate finding, \`${GH} review-comments ${pr}\`, \`${GH} pr-comments ${pr}\`, and the spec folders ${repoRoot}/agent-os/specs/*-${pr}-review-round-*/ and ${repoRoot}/agent-os/specs/*-${pr}-human-review-*/. A known finding goes in knownAs.${matchSentence ? " Redline's own earlier rounds on this PR are the lists above: match against them, not against their review comments." : ''}`,
  )
  if (reviewed === 'final-nit-pass') {
    lines.push('', 'This is the final nit pass. Report only correctness bugs introduced by this diff. Do not report nits, and do not report anything the diff did not introduce. This scope stands over the instruction below to report every finding wherever its cause lies: a bug this diff did not introduce is not reported here.')
  } else if (scope === 'correctness') {
    lines.push('', 'Scope: correctness only. Run no nit checks of your own: no naming, clarity, docblock or test-tightness pass, and no Docs or Version nit. Spend that time on reproducing the correctness candidates you have. A nit a candidate raises is still verified and reported as one, since you state what is true; the run declines it under the scope, in one list, with no thread.')
  }
  lines.push('', reviewed === 'final-nit-pass' ? KINDS_FINAL : KINDS)
  // The fix-diff rule (#95): only a round that reads a fix diff is asked where a finding's cause
  // is, right after the sentence on what a correctness finding buys, which this qualifies.
  if (reviewed === 'fix-diff' && !noFixDiff) {
    lines.push('', `For each finding, state inFixDiff: true when its cause is in the fix diff named above, in code round ${round - 1}'s fixes added or changed, and false when it is in the pull request's own code or anywhere else. It is a fact you state with care, as outsideDiff is, and the run checks it against the files round ${round - 1}'s plan named: a low-severity correctness finding whose cause is in those fixes is fixed like a nit and buys no further round, so never set it because a finding is small.`)
  }
  // One class with an earlier finding (#75): only a review that is shown earlier findings is
  // asked, after the facts it states of a finding's place, so every other review reads as it did.
  if (showsEarlier(reviewed, history, candidates)) {
    lines.push('', LINK_ASK)
  }
  lines.push('', FACTS_ONLY, '', `Return only the JSON your instructions specify, with round ${round} and reviewed "${reviewed}".`)
  return lines.join('\n')
}

// The verify instruction (#79; #93): the coverage pass found, the reviewer verifies, and since #93
// it states facts only (verified, could not confirm, refuted) and leaves what to do to the shaper,
// so there are no guards here: a cause outside the diff and the conditions a failure needs are
// facts on the finding. "New" is defined here because the finder never returns an empty list. Two
// outcomes reopen: a fixed finding that still reproduces at this head, so a fix that did not fully
// land runs another round (#80, R2-1), and a finding declined for want of confirmation that the
// verifier now confirms (#93). A decided finding stays settled whatever its commits, and a
// candidate that reproduces one is accounted for as settled, its ref saying so, which the
// set-aside block shows (#80, R3-4; #93).
// Three rules from the #817 rerun (#85): an issue that tracks only part of a candidate leaves the
// remainder to be judged on its own, and a remainder caused in the diff is a finding naming the
// issue; a refutation answers the candidate's claim, never a neighbouring one or a comment stating
// intent; a guard this pull request removed is a fact the finding states. The ref of every
// candidate that is not a finding of the round is posted in the review body's set-aside
// block (the #85 follow-up spec). The agent file states the same rules, and the loop test pins a
// key phrase of each in both.
// A partly tracked candidate's issue is named in the finding's description, never in a finding ref,
// which accountCoverage matches by id alone (#86, R1-4).
// A partly tracked remainder meets every other rule, as any candidate does: one caused in the diff
// is a finding unless another rule puts it elsewhere (#86, R2-1).
// Only the branch with candidates says so, so a coverage-off prompt is unchanged.
function candidatesBlock(reviewed, range, candidates) {
  const head = reviewed === 'pr' ? startSha : range.to
  const lines = []
  if (candidates.length === 0) {
    lines.push(`Candidates from the coverage pass: the pass ran the code-review skill over the whole pull request at this round's head (${short(head)}) at ${coverageEffort()} with --max-findings all and returned no candidates. Run no discovery pass of your own over the pull request${reviewed === 'fix-diff' ? (range.empty ? '; there is no fix diff to recheck this round' : '; your recheck of the fix diff named above stays as your instructions say') : ''}. The scheduled-and-queued, Docs and Version checks in your instructions still apply. Return coverage as an empty list.`)
    return lines
  }
  lines.push(
    `Candidates from the coverage pass. The pass ran the code-review skill over the whole pull request at this round's head (${short(head)}) at ${coverageEffort()} with --max-findings all, and returned these ${candidates.length} candidates, as JSON with an index each:`,
    json(candidates.map((c, i) => ({ index: i + 1, ...c }))),
    `You verify these candidates; you run no discovery pass of your own over the pull request.${reviewed === 'fix-diff' ? (range.empty ? ' There is no fix diff to recheck this round.' : ' Your recheck of the fix diff named above stays as your instructions say, beside the candidates.') : ''} The scheduled-and-queued, Docs and Version checks in your instructions still apply, since the pass does not know them.`,
    'For each candidate you establish one thing, whether its claim is true, and you say so as one of three facts. Verified: you reproduced it, or traced it through the code to the result the candidate claims, and you cite the lines; it is a finding of this round with confidence confirmed. Refuted: you hold evidence against the claim the candidate makes; a refutation answers that claim, so evidence for a neighbouring claim does not refute it (a test that pins another behaviour of the same code), and neither does a comment or docblock that states intent. Could not confirm: the claim turns on something the repository cannot show (production data, an external service, timing between processes, a browser); a claim that reading the code or running a test can settle is verified or refuted, never this; it is a finding of this round with confidence unconfirmed, wouldConfirm saying in one line what would confirm it, and its description saying what you tried. What to do about a true claim is not yours to decide: no candidate is held back because it is small, because its fix would cost more than it is worth, because it needs conditions unlikely to occur, or because its cause is in code this pull request did not change. State those as facts in the finding instead: the conditions the failure needs; outsideDiff true and where the cause is, when it is in code the diff did not touch; and, for a guard the base branch had and this pull request stopped handling, the removed line. The shaper decides every finding you report.',
    'A candidate is new when it collapses into none of these: a finding you report in this round from another candidate or a rule check, a finding of an earlier round listed above with its outcome (fixed, declined, decided, deferred, accepted, dropped, left to the person, or still open), a finding on the carry-forward list, or a finding an issue or a teammate\'s comment already tracks in full (the part it does not track is judged on its own, below). Two outcomes reopen. A candidate that matches an earlier finding whose outcome is fixed, but that you reproduce or trace at this round\'s head, is new, since the fix did not fully land: report it as a finding of this round with the earlier id named in its description only (for example `R1-3 was fixed, but still reproduces here`), leave its knownAs empty, and account for it as verified. A candidate that matches an earlier finding declined because it could not be confirmed, and that you now confirm, is new in the same way, the earlier id named in its description. A candidate the fix did close no longer reproduces and is settled; a declined, deferred, accepted, dropped, left-to-the-person or still-open finding stays settled. A decided finding stays settled whatever its commits, since an applied decision is often a deliberate keep or mitigation: a candidate that still reproduces one is accounted for as settled, its ref naming the earlier id and saying it still reproduces (for example `R2-5 was decided, and this still reproduces it`), never as a finding. What you report as new, and as correctness, is what keeps the run going: never re-raise a settled finding as new, and never drop a candidate silently.',
    'For each candidate: collapse by cause, never by line or file (two of the spike\'s duplicate pairs shared no line and one shared no file), and two candidates are not one because one issue\'s title fits both; run the known-finding check, and when an open issue or a teammate\'s comment covers only part of a candidate, the tracked part is known and the remainder is judged as its own candidate, by every rule here: a remainder whose cause is in this pull request\'s diff is a finding unless another rule here puts it elsewhere, as it would put any candidate (a collapse or a refutation), and as a finding it has the issue named in its description and knownAs empty; reproduce a correctness candidate where it is cheap; anchor it on a line inside the diff when its cause is in the diff (the skill anchors at code the diff did not touch, which GitHub cannot take inline), and keep the candidate\'s own place when the cause is outside the diff, which the post moves into the review body; and give it category, severity, confidence, side and askRule as for any finding.',
    'Account for every index in coverage, one entry each, with outcome and ref: verified or unconfirmed (ref the finding\'s id), duplicate (ref opening with the index of the candidate or the id of the finding it collapses into, anything meant for the reader after it), settled (ref the earlier finding\'s id), known (ref the issue number or the comment), refuted (ref the claim it disproves and the evidence against that claim). A candidate an issue or a comment tracks only in part is accounted for by what its remainder became, with the issue named in the finding\'s description or in the ref of any other outcome, since a verified or unconfirmed entry\'s ref is the finding\'s id alone; known is for one tracked whole. The review body lists every candidate that is not a finding of this round in a folded block, one line each beside the candidate\'s own summary, so write each of those refs for the teammate who may overrule it. An index you leave out is kept as an unconfirmed finding as reported, with a warning.',
  )
  return lines
}

// The coverage pass's prompt (#79): a plain workflow agent that invokes the code-review skill over
// the head branch at this round's head and relays the skill's own text. No role, no schema (see
// coverageOn). `head` is startSha on the first round and range.to after, so a relaunch replays.
function coveragePrompt(round, head) {
  return `${RUN_LINE}

This is the coverage pass of Redline round ${round} on pull request #${pr}: head branch ${headRef} at ${head}, base ${baseRef}. It covers the whole pull request at this round's head, not only the last round's fixes; the working tree is at that head.

Invoke the Skill tool exactly once, with skill "code-review" and args "${coverageEffort()} ${headRef} --max-findings all", from the repository root (${repoRoot}). Do not review the diff yourself, do not post anything anywhere, and do not write or commit any file.

Your final text is the Skill tool's result, complete and unchanged, including the fenced json array of findings it holds; add nothing before or after it. If the Skill tool was denied, your final text is one line \`coverage: skill denied\` followed by the denial as given. If you have no Skill tool, or it reports no skill named code-review, your final text is one line \`coverage: skill absent\` followed by what it said.`
}

// What the workflow reads from the coverage agent's text: the first fenced json block that parses
// to an array (the skill's documented contract: objects with file, line, summary and
// failure_scenario), else the two marker lines above. Anything else is a cause, never a list. An
// array that holds entries, none of them an object with a non-empty summary or failure_scenario,
// is not that contract (renamed keys, bare strings): the scan moves on, and with no other array it
// is the no-array cause, the recipe-drift stop, never blank candidates (#80, R1-3). An empty array
// stays zero candidates. Only when the scan finds no list are the markers read, denied before
// absent, each at the start of any line with leading backticks or quotes allowed, since the agent
// may copy the prompt's formatting or lead with a sentence (#80, R2-2). The markers come after the
// scan so that a skill result quoting a marker at a line start is still the list; a real denied or
// absent reply holds no such array.
function coverageCandidates(text) {
  const raw = typeof text === 'string' ? text : text === null || text === undefined ? '' : typeof text === 'object' ? JSON.stringify(text) : String(text)
  const t = raw.trim()
  const fence = /```json[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```/g
  let m
  while ((m = fence.exec(t)) !== null) {
    let value
    try {
      value = JSON.parse(m[1])
    } catch (error) {
      continue
    }
    if (Array.isArray(value)) {
      const filled = (s) => typeof s === 'string' && s.trim() !== ''
      if (value.length && !value.some((c) => c && typeof c === 'object' && (filled(c.summary) || filled(c.failure_scenario)))) {
        continue
      }
      return {
        candidates: value.filter((c) => c && typeof c === 'object').map((c) => ({
          file: typeof c.file === 'string' ? c.file : '',
          line: Number.isInteger(c.line) ? c.line : Number.isInteger(Number(c.line)) ? Number(c.line) : 0,
          summary: typeof c.summary === 'string' ? c.summary : '',
          failure_scenario: typeof c.failure_scenario === 'string' ? c.failure_scenario : '',
        })),
      }
    }
  }
  if (/^[ \t]*[`'"]*coverage: skill denied/im.test(t)) {
    return { cause: 'denied', text: t }
  }
  if (/^[ \t]*[`'"]*coverage: skill absent/im.test(t)) {
    return { cause: 'absent', text: t }
  }
  return { cause: 'no array', text: t }
}

// The three ways a coverage pass yields nothing usable, each with its fix; the round stops at
// stage review with resumeFrom at the coverage label, so a resume replays the pass, and a fresh
// launch with `coverage off` is the alternative.
function coverageMessage(cause) {
  const again = 'Resume the run once it is fixed, or launch again with coverage off (the reviewer alone, as before the pass existed).'
  switch (cause) {
    case 'denied':
      return `the coverage pass could not run the code-review skill: the Skill tool was denied (the session's permission mode or allow list). Allow the Skill tool for this session. ${again}`
    case 'absent':
      return `the coverage pass could not run the code-review skill: this Claude Code has no Skill tool or no skill named code-review (check \`claude --version\`; the pass was validated on 2.1.318). ${again}`
    default:
      return `the coverage pass ran but its text holds no fenced json array of findings in the skill's shape, objects with file, line, summary and failure_scenario (the skill's recipe may have drifted on this Claude Code version; check \`claude --version\` against 2.1.318). ${again}`
  }
}

// The highest finding number of the round's form in use (#94, R4-6, R8-3). review() renames every
// id outside the form before reconcilePrior and accountCoverage run, and every path that gives an
// id numbers after this one, so no two findings of a round share an id.
function lastFindingNumber(round, findings) {
  const idForm = new RegExp(`^R${round}-\\d+$`)
  return Math.max(0, ...findings.filter((f) => idForm.test(String(f.id))).map((f) => Number(String(f.id).split('-')[1]) || 0))
}

// The accounting for the coverage pass's candidates (#79, the mirror of reconcilePrior; #93): every
// candidate has exactly one entry. One the reviewer left out, or placed with an outcome the schema
// does not name, or accounted for with a ref that names no finding of this round (#80, R1-4),
// or collapsed with a ref that names nothing it collapses into (#94, R8-2), becomes a finding of
// the round as reported: a new id, correctness, unconfirmed, with a warning, so the shaper's second
// look decides it and no candidate is dropped or parked. A verified or unconfirmed entry is counted by its finding's own confidence, and one naming a finding with a
// knownAs is known, since the body lists that finding under Already tracked.
const MINTED_WOULD_CONFIRM = 'The verifier gave no account of this candidate; check the claim as the finder made it.'
// The place of a minted finding whose candidate named no file (#94, R2-6): prior-findings reads a
// body line back only with text before the colon, so `:0` would leave it neither carried nor
// settled. The post script moves its comment into the review body, as it does any path in no hunk.
const NO_FILE = '(no file)'
// A candidate the finder gave neither a summary nor a failure scenario is still kept, since
// nothing is dropped (#93): its title and description say what it lacks, so its body line and
// its inline comment are never empty (#94, R3-4).
const MINTED_NO_CLAIM = 'The coverage pass gave this candidate no summary and no failure scenario; check the code at its place.'
// The id of `ids` a coverage ref opens with: the longest one the ref starts with that is followed
// by the end of the ref or by anything but a word character or a dash, so `R1-1. note`, `R1-1/x`
// and `R1-1: note` open with R1-1 and `R1-1-x` opens with no id; '' when it opens with none.
// accountCoverage reads a ref's finding by it, and the rename in review() reads the old id a ref
// opens with by it, so the two never read one ref two ways (#94, R2-5, R5-3, R9-5).
function leadingId(ref, ids) {
  return [...ids].filter((id) => typeof id === 'string' && id !== '' && ref.startsWith(id) && !/^[\w-]/.test(ref.slice(id.length))).sort((a, b) => b.length - a.length)[0] || ''
}

// The candidate index a duplicate's ref opens with (`3`, `candidate 3` or `index 3`, any case,
// with any note after it), or 0 when it opens with none. accountCoverage reads what a collapse
// names by it and review()'s set-aside block reads `into` by it, so the two never read one ref's
// target two ways (#86, R4-1; #94, R8-2, R9-2).
const duplicateTarget = (ref) => Number((/^(?:(?:candidate|index)\s+)?(\d+)\b/i.exec(ref || '') || [])[1]) || 0

function accountCoverage(round, out, candidates) {
  const byId = new Map(out.findings.map((f) => [f.id, f]))
  const seen = new Map()
  const told = new Set()
  for (const entry of out.coverage) {
    const index = Number(entry.index)
    if (!Number.isInteger(index) || index < 1 || index > candidates.length) {
      warnings.push(`round ${round}: the reviewer accounted for coverage candidate ${JSON.stringify(entry.index)}, which is not an index of this round's ${candidates.length} candidates; ignored`)
      continue
    }
    // A bad first entry (an outcome the schema does not name, or a ref naming no finding) is the
    // entry that stands too: its index is in `told`, so a later entry is ignored and the candidate
    // is minted as the first warning said (#94, R5-2).
    if (seen.has(index) || told.has(index)) {
      warnings.push(`round ${round}: the reviewer accounted for coverage candidate ${index} twice; the first entry stands`)
      continue
    }
    if (!COVERAGE_OUTCOMES.includes(entry.outcome)) {
      warnings.push(`round ${round}: the reviewer gave coverage candidate ${index} the outcome ${JSON.stringify(entry.outcome)}, which is not one of ${COVERAGE_OUTCOMES.join(' | ')}; kept as an unconfirmed finding as reported`)
      told.add(index)
      continue
    }
    const ref = typeof entry.ref === 'string' ? entry.ref.trim() : String(entry.ref === undefined || entry.ref === null ? '' : entry.ref)
    if (LISTED_ELSEWHERE.includes(entry.outcome)) {
      // The ref is the finding's id alone, as the accounting sentence asks; a note after the id is
      // read past, by its leading id, with a warning, so it never mints a second finding for a
      // candidate already reported (#94, R2-5). A leading token that names no finding is a bad ref.
      const id = leadingId(ref, byId.keys()) || ref
      const finding = byId.get(id)
      if (finding && id !== ref) {
        warnings.push(`round ${round}: the reviewer accounted for coverage candidate ${index} as ${entry.outcome} with ref ${JSON.stringify(ref)}; read as ${id}, the finding its leading id names`)
      }
      if (!finding) {
        warnings.push(`round ${round}: the reviewer accounted for coverage candidate ${index} as ${entry.outcome} with ref ${JSON.stringify(ref)}, which is not a finding of this round; kept as an unconfirmed finding as reported`)
        told.add(index)
        continue
      }
      if (finding.knownAs) {
        seen.set(index, { index, outcome: 'known', ref: `${finding.id}: ${finding.knownAs}` })
        continue
      }
      const own = finding.confidence === 'unconfirmed' ? 'unconfirmed' : 'verified'
      if (own !== entry.outcome) {
        warnings.push(`round ${round}: the reviewer accounted for coverage candidate ${index} as ${entry.outcome}, but ${finding.id} is ${finding.confidence}; counted as ${own}`)
      }
      seen.set(index, { index, outcome: own, ref: id })
      continue
    }
    seen.set(index, { index, outcome: entry.outcome, ref })
  }
  // A collapse names what it collapses into (#94, R8-2). A duplicate whose ref opens with an index
  // (`3`, `candidate 3`, `index 3`, as the set-aside block reads it) names another candidate of the
  // round, and one whose duplicates do not lead back to it; a duplicate or settled ref that opens
  // with an id names a finding of this round, of an earlier round of this run or of an earlier run
  // on the PR. One that names nothing is a bad ref: the candidate is kept as an unconfirmed finding
  // with a warning, as a verified ref naming no finding is. A ref that opens with neither, a note
  // in words, names something and is shown as written in the set-aside block (#86, R4-1, R5-2).
  const named = new Set([...byId.keys(), ...Object.keys(priorById), ...rounds.flatMap((r) => (r.findings || []).map((x) => x.id))])
  const targetOf = (e) => (e.outcome === 'duplicate' ? duplicateTarget(e.ref) : 0)
  const namesNothing = (e) => {
    if (e.outcome !== 'duplicate' && e.outcome !== 'settled') {
      return false
    }
    const to = targetOf(e)
    if (!to) {
      const id = (/^([RH]\d+-\d+)(?![\w-])/.exec(e.ref) || [])[1] || ''
      return id !== '' && !named.has(id)
    }
    const visited = new Set([e.index])
    for (let at = to; ; at = targetOf(seen.get(at))) {
      if (at < 1 || at > candidates.length || visited.has(at)) {
        return true
      }
      if (!seen.has(at) || !targetOf(seen.get(at))) {
        return false
      }
      visited.add(at)
    }
  }
  for (const e of [...seen.values()].filter(namesNothing)) {
    warnings.push(`round ${round}: the reviewer accounted for coverage candidate ${e.index} as ${e.outcome} with ref ${JSON.stringify(e.ref)}, which names nothing it collapses into; kept as an unconfirmed finding as reported`)
    seen.delete(e.index)
    told.add(e.index)
  }
  let next = lastFindingNumber(round, out.findings)
  candidates.forEach((c, i) => {
    const index = i + 1
    if (seen.has(index)) {
      return
    }
    const id = `R${round}-${++next}`
    if (!told.has(index)) {
      warnings.push(`round ${round}: the reviewer did not account for coverage candidate ${index} (${c.file || NO_FILE}:${c.line}); kept as ${id}, an unconfirmed finding, as reported`)
    }
    const summary = String(c.summary || '').replace(/\s+/g, ' ').trim()
    const scenario = String(c.failure_scenario || '').trim()
    out.findings.push({
      id, file: c.file || NO_FILE, line: c.line, side: 'RIGHT', category: 'correctness', severity: 'medium', confidence: 'unconfirmed',
      title: summary || scenario.replace(/\s+/g, ' ') || `coverage candidate ${index} (no summary given)`, description: scenario || summary || MINTED_NO_CLAIM, proposedFix: '',
      wouldConfirm: MINTED_WOULD_CONFIRM, outsideDiff: false, knownAs: '', carriedFrom: '', askRule: '',
    })
    seen.set(index, { index, outcome: 'unconfirmed', ref: id })
  })
  out.coverage = [...seen.values()].sort((a, b) => a.index - b.index)
  const counts = Object.fromEntries(COVERAGE_OUTCOMES.map((o) => [o, out.coverage.filter((e) => e.outcome === o).length]))
  return counts
}

function postPrompt(round, specFolder, reviewFile, findingsFile) {
  const step2 = postToGitHub
    ? `Step 2. Run \`${GH} has-review ${pr} ${round}\`. Exit 0: the round is already posted; post nothing and set skipped to "already posted". Exit 2: report the error and stop. Exit 1: run \`${GH} post-review ${pr} ${abs(reviewFile.path)}\`. The script itself moves every comment it cannot anchor into the body behind a marker and lists them under moved; report them in movedToBody by finding id. A review with no inline comment at all is a valid result, not an error: set error only when the post itself failed. Map every inline comment id the script prints to its finding: each comment body starts with **<finding id>**. When the post was skipped, run \`${GH} review-comments ${pr}\` and map the comments whose body starts with **R${round}- the same way, so the replies still land in their threads.`
    : 'Step 2. This is a dry run (postToGitHub is false). Run no redline-gh.sh command and post nothing. Return dryRun true, posted false, review.id 0, review.html_url "", review.comments [] and review.movedToBody [].'
  return `${RUN_LINE}

Operation: post-review for round ${round}. PR #${pr}, head branch ${headRef}. Spec folder: ${abs(specFolder)}. postToGitHub: ${postToGitHub}.

Step 1. Write these two files with the Write tool, byte for byte (the redline/ folder may not exist yet; Write creates it):

File 1: ${abs(reviewFile.path)}
\`\`\`json
${reviewFile.content}
\`\`\`

File 2: ${abs(findingsFile.path)}
\`\`\`json
${findingsFile.content}
\`\`\`

${step2}

Return only the JSON your instructions specify, with operation "post-review" and files listing the paths you wrote.`
}

// A finding the verifier links to an earlier one that was fixed, as one class (#75), with what
// the run's record holds of each earlier finding: its place, and the cause its round recorded,
// when this run fixed it; its place and its reply when an earlier run did, since that run's
// record is the pull request's threads, which hold no cause. Only links the record honoured
// reach here (honourLinks), so every id names a finding recorded as fixed.
function earlierFinding(id) {
  const record = rounds.find((r) => r.findings.some((x) => x.id === id))
  if (record) {
    const f = record.findings.find((x) => x.id === id)
    const s = (record.dispositions || []).find((x) => x.id === id)
    return { id, round: record.round, title: f.title, file: f.file, line: f.line, ...(s && s.cause ? { cause: s.cause } : {}) }
  }
  const p = priorById[id]
  return p ? { id, round: p.round, title: p.title, file: p.file, line: p.line, reply: p.reply ? p.reply.body : '' } : { id }
}
// The block a shape prompt and a reshape prompt carry for the links that stand (#75): the whole
// of what a link asks of the shaper, in the prompt of the round it concerns and in no other, so
// a round with no link keeps the prompt it would have had. It ends with the rule checkCauses
// holds a fix to.
const LINK_RULE = 'A cause fixed once and found again is a class until shown otherwise. For each finding listed here the question of instance or class is answered: a fix for it closes the class, as one-place or as a sweep, and never says instance, and the workflow stops the round on one that does. When closing the class does not belong in this pull request, the finding is a defer or an ask, as your rules say.'
const linked = (f) => (Array.isArray(f.sameClassAs) ? f.sameClassAs : [])
function linksBlock(inScope) {
  const withLinks = inScope.filter((f) => linked(f).length)
  if (!withLinks.length) {
    return ''
  }
  return `\nFindings of this round that the verifier links to an earlier finding that was fixed, as one class (sameClassAs), each with what the run's record holds of the earlier finding, as JSON:\n${json(withLinks.map((f) => ({ id: f.id, sameClassAs: linked(f).map(earlierFinding) })))}\n\n${LINK_RULE}\n`
}

function shapePrompt(round, specFolder, reviewed, inScope, prBody) {
  const nitNote = reviewed === 'nits'
    ? '\nThis round has no correctness findings: it is the final nit round, and the plan covers the nits only.\n'
    : ''
  const description = typeof prBody === 'string'
    ? `PR description, as the reviewer read it:\n<<<\n${prBody.trim()}\n>>>`
    : `PR description: read it with \`${GH} pr ${pr}\` (the body field).`
  return `This is a Redline run; follow shape-spec in unattended mode.

${RUN_LINE}

Read ${repoRoot}/.claude/commands/agent-os/shape-spec.md in full, including its section "Unattended mode (Redline)", and follow it. You are the shaper for round ${round}.

Run facts:
- PR: #${pr}, head branch ${headRef}; commits reference issue #${issue}
- Round: ${round}
- Launch timestamp: ${stamp}
- Spec folder to write: ${abs(specFolder)}/ (this exact path; do not derive a name from the clock). Its redline/ subfolder holds Redline's own files (the review as posted, the findings, later the snapshot); leave it alone.
- Snapshot for the gate: ${abs(specFolder)}/redline/snapshot.json. The workflow writes it after the plan is approved; the Verification Gate task names it as the argument to ${CHECKS}.
- Your scratch Pest test, if you write one: ${scratchTest('shaper', `r${round}`)}. The reviewer's reproduction for this round, if it wrote one: ${scratchTest('reviewer', `r${round}`)}.
${nitNote}${rulesBlock}
${description}

Findings for this round, as JSON:
${json(inScope)}
${linksBlock(inScope)}
Sort each finding into fix, decline, defer or ask per the unattended-mode section and your rules. Investigate first: open the files named, their callers and tests, and the standards and specs you cite. ${ASK_CASES} A question the PR description, the original spec or the code's own docblock already answers is answered from that evidence and recorded under Unattended answers, never escalated. Every task names every file it creates or changes, by path; a declined finding has no task, and neither has a deferred one that ships no mitigation. A deferred finding is worth doing and not in this pull request, and it always carries a drafted issue that stands on its own. ${DRAFT_FORM} Every decided entry under Decisions in shape.md (a fix, a decline, a defer, an unattended answer) ends with the line \`Decided by: redline\`; a pending entry has no such line until the person or the autopilot decides it. Write plan.md, shape.md, standards.md and references.md into the spec folder with Write. Do not edit any source file and never run a git write or gh.

Return only the JSON object your instructions specify: specFolder, findings (for every finding above: id, disposition, decidedBy "redline" for fix, decline and defer or "pending" for ask, recommendation in one sentence: the change planned for a fix, the decision for a decline, the mitigation for a defer or that nothing ships now, the option you recommend for an ask; ${FILES_ASK}; ${CAUSE_ASK}; for a decline also reason, the sentence a teammate reads in the thread; for a finding the verifier could not confirm also secondLook), deferred (one entry per defer finding: its mitigation, an empty string when nothing ships now, and its drafted issue as title, found, why and fullFix), judgmentCalls (one entry per ask finding, in the order the person should answer them, each with dependsOn, with why_human naming its case, and with ${OPTIONS_ASK}).`
}

// A pass over a teammate's review (#36): the findings are their comments, a clear instruction is
// theirs to decide, an unclear one goes to the author, and nothing is deferred by Redline on its own.
function humanShapePrompt(pass, record, inScope) {
  const human = record.human
  const body = human.body.trim() !== ''
    ? `The review's body, as ${pass.reviewer} wrote it (when it is a finding below, that finding has no file and no line):\n<<<\n${human.body.trim()}\n>>>`
    : 'The review has no body text; every finding is an inline comment.'
  return `This is a Redline run; follow shape-spec in unattended mode.

${RUN_LINE}

Read ${repoRoot}/.claude/commands/agent-os/shape-spec.md in full, including its section "Unattended mode (Redline)", and follow it with the differences below. You are the shaper for ${pass.title}: a revise pass whose findings are the review comments ${pass.reviewer} left on this pull request, not a Redline reviewer's. Finding IDs are ${pass.idPrefix}-<k>.

Run facts:
- PR: #${pr}, head branch ${headRef}; commits reference issue #${issue}
- Pass: ${pass.title}, over review${human.reviewIds.length === 1 ? '' : 's'} ${human.reviewIds.join(', ')} by ${pass.reviewer}
- Launch timestamp: ${stamp}
- Spec folder to write: ${abs(record.specFolder)}/ (this exact path; do not derive a name from the clock, and do not use the review-round name). Its redline/ subfolder holds Redline's own files (the ingested review, later the snapshot); leave it alone.
- Snapshot for the gate: ${abs(record.specFolder)}/redline/snapshot.json. The workflow writes it after the plan is approved; the Verification Gate task names it as the argument to ${CHECKS}.
- Your scratch Pest test, if you write one: ${scratchTest('shaper', pass.tag)}.

PR description: read it with \`${GH} pr ${pr}\` (the body field).

${body}${rulesBlock}

Findings for this pass, as JSON (description is the comment verbatim; source is who wrote it):
${json(inScope)}

What differs from a Redline round:
- Sort each finding into fix, ask or none; never defer. A clear instruction ("rename this", "this leaks the id", "add a test for the empty case") is fix, decided by ${pass.reviewer}: its decidedBy is "reviewer", and its entry under Decisions in shape.md ends with the line \`Decided by: ${pass.reviewer}\`. A question, a disagreement with the design, a comment you cannot turn into one change, or an instruction whose fix is out of proportion to the comment is ask, returned to the author: the story quotes the comment and gives your reading of it, and the options are what the author can choose. A comment that asks for nothing (praise, thanks, an acknowledgement, a body that only points at the inline comments) is none, decided by redline, with recommendation saying why nothing is asked; when in doubt it is ask. Nothing a teammate asked for is deferred by Redline on its own; if the author wants a mitigation instead of the full fix, they say so at the hand-off.
- Every finding is in scope, whatever its size or category; the proportionality rule only ever turns a fix into an ask here.
- Each fix task's commit message names its finding id (${pass.idPrefix}-<k>) as a Redline round's names R<n>-<k>.
- The spec folder's shape.md records the pass as "${pass.title}", the reviewer, and the review ids above.

Investigate first: open the files named, their callers and tests, and the standards and specs you cite. ${NEVER_DECIDE} A question the PR description, the original spec or the code's own docblock already answers is answered from that evidence and recorded under Unattended answers, never escalated. Every task names every file it creates or changes, by path. Write plan.md, shape.md, standards.md and references.md into the spec folder with Write. Do not edit any source file and never run a git write or gh.

Return only the JSON object your instructions specify: specFolder, findings (for every finding above: id, disposition fix, ask or none, decidedBy "reviewer" for fix, "pending" for ask or "redline" for none, and recommendation in one sentence: the change planned for a fix, the option you recommend for an ask, why nothing is asked for a none; and ${FILES_ASK}), deferred (always empty), judgmentCalls (one entry per ask finding, in the order the author should answer them, each with dependsOn and with ${HUMAN_OPTIONS_ASK}).`
}

// `decided` is the findings the person or autopilot decided whose task the round reads from its
// own list (#106), each as {id, end}: end is what its decision ends in (endsIn in revise(): fix,
// defer or accept). The block that names them says what `files` means for each: every shape
// prompt asks, for an ask, for the paths of the recommended change, which is the wrong list for
// a call the person answered, and after a reshape the workflow takes a decided finding's task
// from this list. It names each with its end, which the hold after the reshape reads, so the
// reshape is told which task the hold expects rather than left to infer it from plan.md, since
// shape.md's decided entry records the choice and not its end (#114, R1-3). It says a decided
// fix keeps a task of its own and a task counts only for the finding it names, as the resolve
// agent is told, since the hold reads the files listed for each finding and cannot see which
// task names it: a merged task listed for two decided fixes passed it (#114, R2-6). The whole
// ask sits in the block, and the block is in the prompt only when the round has such a finding,
// so a reshape of any other round keeps the prompt it had before #106.
function reshapePrompt(pass, specFolder, inScope, adjustments, attempt, decided) {
  // How the block names each end, in the words of the rule after the list (#114, R1-3). An end
  // the round has not read is named by the id alone.
  const endWord = { fix: 'fix', defer: 'deferred', accept: 'accepted' }
  const decidedBlock = decided.length
    ? `\n\nFindings the person or the autopilot decided: ${decided.map((d) => (endWord[d.end] ? `${d.id} (${endWord[d.end]})` : d.id)).join(', ')}. Each is named with what its decision ends in. For each of these, files is the paths of its task as plan.md holds it when you are done, an empty list when it has no task, whatever disposition you return for it: after a reshape the workflow reads a decided finding's task from this list. A finding decided as a fix keeps a task with files, and one decided as accepted keeps none. A decided fix keeps a task of its own, one that names it; a task counts only for the finding it names, so never list one task's files for two findings.`
    : ''
  return `This is a Redline run; follow shape-spec in unattended mode.

${RUN_LINE}

You are the shaper for ${pass.name}, called again because the plan approver bounced the plan (adjustment ${attempt} of at most ${maxPlanAdjustments}). The spec folder ${abs(specFolder)}/ already exists: read plan.md, shape.md, standards.md and references.md and correct them in place with Write. Do not create a second folder and do not touch its redline/ subfolder. Your scratch Pest test, if you need one: ${scratchTest('shaper', pass.tag)}.${pass.human ? ` This is a pass over ${pass.reviewer}'s review: dispositions stay fix, ask or none, never defer, and a fix is decided by ${pass.reviewer} (decidedBy "reviewer").` : ''}${rulesBlock}

The approver's adjustments, as JSON:
${json(adjustments)}

The round's findings, as JSON:
${json(inScope)}
${linksBlock(inScope)}
Apply each adjustment, or record in shape.md why it cannot be applied. Every task still names its files by path. ${pass.human ? 'Decisions already recorded as decided in shape.md stay as they are.' : 'Decisions already recorded as decided in shape.md stay as they are, except one of your own (Decided by: redline) that an adjustment names, which you decide again; a decision the person made, or the autopilot applied, stays as it is.'} ${pass.human ? `${NEVER_DECIDE} An adjustment that would need a new decision becomes a judgment call, never a quiet change.` : `${ASK_CASES} An adjustment that would need a decision in one of those cases becomes a judgment call, never a quiet change.`}${pass.human ? '' : ` ${DRAFT_FORM}`}${decidedBlock}

Return only the JSON object your instructions specify for the whole round (every finding above with id, disposition, decidedBy, recommendation and ${decided.length ? FILES_ASK_DECIDED : FILES_ASK}${pass.human ? '' : `, ${CAUSE_ASK}, reason for a decline, and secondLook for a finding the verifier could not confirm`}; the deferred list${pass.human ? '' : ', each entry with its mitigation (an empty string when nothing ships now) and its drafted issue as title, found, why and fullFix'}; and every judgment call still pending or newly raised, in asking order with dependsOn, each with ${pass.human ? HUMAN_OPTIONS_ASK : OPTIONS_ASK}).`
}

function resolvePrompt(pass, specFolder, calls, roundDecisions, overrides) {
  const callDecisions = Object.fromEntries(calls.map((call) => [call.id, roundDecisions[call.id]]).filter(([, d]) => d))
  // A decision on Redline's own files carries `rule` as well as `own`, so the rule bullet sends it
  // to the own-file bullet, and the resolve agent gets one wording for it (#94, R9-4).
  const anyOwn = Object.values(callDecisions).some((d) => d && d.own)
  const overrideDecisions = Object.fromEntries(overrides.map((f) => [f.id, roundDecisions[f.id]]))
  // A call left to the person under a rule has no disposition to state (#99), and the sentence
  // that says so is in the prompt only when a call carries one.
  const anyRule = Object.values(callDecisions).some((d) => d && d.rule)
  // A call whose decision names its own disposition decides as an override's does, so no
  // statement is asked of it (#99, its spec's decision 17), and the sentence that says so is in
  // the prompt only when a call carries one, as for a rule (#108, R1-2).
  const anyNamed = Object.values(callDecisions).some((d) => d && d.disposition)
  // A call the person or autopilot answered by picking an option carries the option's label and
  // the end the workflow gave it (#105). The sentence that says what that means is in the prompt
  // only when a call carries both, after the one for a named disposition, which a pick always
  // is, so a prompt with no pick reads as it did before #105.
  // A finding left to the person follows its own bullets, a deferral of it included (#126), so
  // the sentence is for a pick no rule covers.
  const anyPicked = Object.values(callDecisions).some((d) => d && d.option && d.disposition && !d.rule)
  // A left finding the person deferred (#126): the one decision carrying `rule` that also
  // carries a disposition, since resolveWith keeps no other on one. Its bullet is in the prompt
  // only then, after the bullets it is the exception to.
  const anyLeftDeferred = Object.values(callDecisions).some((d) => d && d.rule && d.disposition === 'defer')
  const lines = [
    RUN_LINE,
    '',
    `You are the resolve agent for ${pass.name}. The judgment calls below were decided outside the shaper (by the person in their session, or by the autopilot taking the shaper's recommendation); write the decisions into the spec folder exactly as given.`,
    '',
    `- Spec folder: ${abs(specFolder)}/`,
    `- Each decision carries the date it was made (date); use it, or ${launchDate} when it is missing.`,
    `- Each decision carries its owner (decidedBy): \`${personLabel}\` for the person, \`${AUTOPILOT}\` for a recommendation taken on autopilot. Every decided entry you write under Decisions in shape.md ends with the line \`Decided by: <that value>\`, verbatim.`,
    `- A decision whose decidedBy is \`${AUTOPILOT}\` carries the shaper's own recommendation as its choice: apply the option that recommendation names (it may paraphrase the label), with the notes as its reasoning.`,
    ...(askRules.length
      ? [`- A decision carrying \`rule\` is on a finding a repository ask rule covers${anyOwn ? " (one that also carries `own` is on one of Redline's own files and follows the next bullet instead)" : ''}, left to the person (#49): whatever its choice, no task writes anything. Its plan task becomes "Left to the person: <id> (repository rule <rule>)" with no files, or "Accepted, no change: <id>" when the choice is to accept; its Decisions entry records the choice and the notes with its owner; and the finding is not listed under Deferred in shape.md, which holds only what carries a drafted issue: the person makes this change.`]
      : []),
    ...(anyOwn
      ? [`- A decision carrying \`own\` is on a finding on one of Redline's own files, which no Redline role may write, left to the person the same way (#94, R8-4): whatever its choice, no task writes anything. Its plan task becomes "Left to the person: <id> (Redline's own files)" with no files, or "Accepted, no change: <id>" when the choice is to accept; its Decisions entry records the choice and the notes with its owner; and the finding is not listed under Deferred in shape.md, which holds only what carries a drafted issue: the person makes this change.`]
      : []),
    ...(anyLeftDeferred
      ? ['- The exception to what is said above of a finding left to the person: a decision carrying `rule` and `disposition` "defer" is one the person deferred to an issue (#126). No task writes anything for it either: its plan task is "Left to the person: <id>" as above, with no files. But the finding is listed under Deferred in shape.md with its drafted issue, and returned in deferred with an empty mitigation and the draft as title, found, why and fullFix: the draft its call\'s option carries, copied as written, when one does, and one you write when the call offered none. The workflow files it, and the change stays the person\'s to make.']
      : []),
  ]
  if (calls.length) {
    lines.push(
      '',
      'Judgment calls as the shaper wrote them, as JSON:',
      json(calls),
      '',
      'Decisions on them, as JSON (choice is an option label or the person\'s own words; notes is the decision restated as one standalone sentence, the choice and the reasoning; date is when; decidedBy is the owner):',
      json(callDecisions),
      '',
      // The whole ask for `decided` (#99) sits here, in the calls block, and nowhere else in the
      // prompt: the answer then does not depend on the agent file the session loaded, and a
      // resolve with overrides and no call keeps the prompt it had before #99, so it replays.
      `State in decided what each call's decision ends in, one entry per call above as {"id", "disposition"}: fix when it plans a change in this pull request and leaves nothing to track elsewhere, whatever its size (a task of its own, its finding set to the call's id, names its files, and the check demands its commit; a choice that keeps the behaviour and still ships something, a code comment say, is a fix); defer when it leaves work to an issue, with or without a mitigation now (a "mitigate" choice, or the person's own words saying to defer it: its deferred entry with the mitigation and the drafted issue, and a task only when a mitigation ships); accept when nothing changes (its task is "Accepted, no change: <id>", with no files). The workflow reads a call's disposition from decided, never from its deferred entry or its task, and checks it against both before anything is built or posted: defer with no drafted entry, fix with no task with files, or accept beside a task with files stops the run, and a deferred entry beside fix or accept is dropped. So return a deferred entry for a call only when its decision defers the finding (#97, R2-15; #99).${anyRule ? ' A call whose decision carries `rule` is left to the person and has no entry in decided.' : ''}${anyNamed ? ' A call whose decision carries `disposition` names its own and has no entry in decided.' : ''}${anyPicked ? ' A call whose decision carries `option` was answered by picking that option of the call, named by its label: plan that option as the shaper wrote it, and the `disposition` beside it is what the option ends in, which the workflow set from the option\'s `ends`.' : ''}`,
    )
  }
  if (overrides.length) {
    lines.push(
      '',
      `Disposition overrides, as JSON: findings that were not judgment calls, whose disposition the person changed after seeing the shaper's plan. Each carries the new disposition (fix: plan the full fix as a task, files by path and the test that proves it; defer: plan the mitigation the notes describe as a task, or no task when they name none, add the finding under Deferred in shape.md with its drafted issue, and return it in deferred with its mitigation (an empty string when nothing ships now) and the draft as title, found, why and fullFix; accept: no change, the finding's task becomes "Accepted, no change: <id>"), with notes (the person's reasoning, one sentence) and the owner${pass.human ? '' : '; a finding the shaper declined is overruled the same way, its Decisions entry keeping the shaper\'s reason as the record of what the person saw'}:`,
      json(overrideDecisions),
    )
  }
  lines.push(
    '',
    `${pass.human ? NEVER_DECIDE : RESOLVE_RULE} You apply the decisions verbatim. A decision that is missing, names an option that does not exist, or is too unclear to turn into a task stays pending and goes under unresolved. A standards retrospective item in shape.md that the shaper held for one of these decisions is drafted now, as your instructions say, for the standards approver to judge.`,
    '',
    DRAFT_FORM,
    '',
    'Return only the JSON your instructions specify.',
  )
  return lines.join('\n')
}

function planPrompt(pass, specFolder, inScope, shaped, roundDecisions, adjustment, earlierPaths) {
  // A human pass's shaper defers nothing, but its author can: an option of a call may end in
  // defer (#105), and a decision that names a deferral is shown below by that disposition. So
  // the bounce is a defer no decision names. Until #105 the sentence called every defer one,
  // beside a list that could show a deferral the author had typed at the plan dial.
  const humanNote = pass.human
    ? `\nThis is a pass over ${pass.reviewer}'s review (#36): every finding is one of their comments, a fix is decided by them (decidedBy "reviewer"), a none finding asks for nothing and has no task, and no finding is deferred by the shaper; a disposition of defer that no decision below names is a bounce.\n`
    : ''
  return `${RUN_LINE}

You are the plan approver for ${pass.name}. Adjustment number ${adjustment} (the workflow allows at most ${maxPlanAdjustments} bounces).

- Spec folder: ${abs(specFolder)}/
- The PR's files at launch: ${json(prFiles)}
- Paths approved in earlier rounds of this run (already allowed): ${json(earlierPaths)}
${humanNote}${rulesBlock}
The ${pass.human ? "pass's" : "round's"} findings, as JSON:
${json(inScope)}

The shaper's dispositions and deferred list, as JSON:
${json({ findings: shaped.findings, deferred: shaped.deferred })}

Decisions made outside the shaper (by the person, or by the autopilot taking the shaper's recommendation; decidedBy names which), already applied by the resolve agent (these are decided, not pending): ${Object.keys(roundDecisions).length ? json(roundDecisions) : 'none'}

Check the plan per your instructions. ${pass.human ? `${NEVER_DECIDE} A task that turns a still-pending decision into a change is a bounce, and you never decide one yourself.` : `${APPROVER_RULE} A task that turns a still-pending decision into a change is a bounce. A declined finding has no task: its reason is in the dispositions above and under Decisions in shape.md, and a decline with no reason a teammate can read is a bounce. The person is asked in the cases your instructions list and no others, so an ask outside them is a bounce too.`} planPaths must list every path the tasks create or change (directories end in /), including the spec folder ${specFolder}/; it becomes the allowed-path list the checker enforces.

Return only the JSON your instructions specify.`
}

function standardsPrompt(pass, specFolder) {
  return `${RUN_LINE}

You are the standards approver for ${pass.name}. Spec folder: ${abs(specFolder)}/. Read its shape.md section "Standards retrospective (proposed)" and decide each proposed edit per your instructions.

${decideRule(pass)} A proposed edit that depends on a pending decision is returned under deferred.

Return only the JSON your instructions specify.`
}

function snapshotPrompt(pass, path, content) {
  return `${RUN_LINE}

Operation: snapshot (${pass.name}). Write this JSON with the Write tool, byte for byte, to ${path} (overwrite it if it exists). No GitHub call, no other file.

\`\`\`json
${content}
\`\`\`

Return only the JSON your instructions specify, with operation "snapshot" and files [${JSON.stringify(path)}].`
}

function checkerCommand(flag, snapshot, octane) {
  return `${octane ? 'REDLINE_OCTANE=1 ' : ''}${CHECKS}${flag ? ` ${flag}` : ''} ${snapshot}`
}

// A long gate's start and wait commands for one run (#40), or null when the gate fits in the
// foreground. A --git-only check runs no command, so it always fits. The run is named from the launch
// stamp, the PR and the agent's label, so a relaunch builds the same prompt; the wait's limit is the
// checker's stall window, which the repeated waits keep from firing.
function gateRun(flag, snapshot, octane, label) {
  if (!backgroundGate || flag === '--git-only') {
    return null
  }
  const id = `${stamp}-${pr}-${label.replace(/\s+/g, '-')}`
  return {
    start: `${octane ? 'REDLINE_OCTANE=1 ' : ''}${BACKGROUND} start ${id}${flag ? ` ${flag}` : ''} ${snapshot}`,
    wait: `${BACKGROUND} wait ${id} --limit ${Math.ceil(checkerStallMs / 1000)}`,
  }
}

const baselineNote = baselineSeconds === null
  ? 'no baseline is recorded in .claude/redline/checks.json, and a gate of unknown length runs in the background'
  : `recorded baseline: ${baselineSeconds} s; over ${FOREGROUND_MAX_S} s it runs in the background`

// The implementer's line for the gate: the one command line, or the start/wait pair.
function gateLine(ctx, label) {
  const bg = gateRun('', ctx.snapshotPath, ctx.octane, label)
  if (!bg) {
    return `- The gate: \`${checkerCommand('', ctx.snapshotPath, ctx.octane)}\` (run it with timeout: 600000 on the Bash call; it outlasts the tool's two-minute default)`
  }
  return `- The gate takes longer than the Bash tool allows in the foreground (${baselineNote}), so run it in two steps every time: start it with run_in_background: true on the Bash call, \`${bg.start}\`, then wait for it in the foreground with timeout: 600000 on the Bash call, \`${bg.wait}\`, running the same wait again while it exits 3 (still running; ignore the start's own completion notice). When the wait exits 0, 1 or 2, its output and exit code are the gate's. Exit 4 (past its limit) or 5 (the run ended without a result) means the gate gave no result: report it under blocked with the wait's line. Never run checks.sh itself in the background.`
}

function implementPrompt(pass, ctx, label) {
  return `${RUN_LINE}

You are the implementer for ${pass.name}. The plan in the spec folder was approved; build exactly it, commit it Redline's way, and leave the gate green.

Run facts:
- PR #${pr}, head branch ${headRef}; commit messages reference (#${issue})
- Spec folder: ${abs(ctx.specFolder)}/
${gateLine(ctx, label)}
- Checks that already failed before this run started (baseline): ${ctx.baselineFailing.length ? ctx.baselineFailing.join(', ') : 'none'}. A check that was already failing is not yours to fix unless a task says so.

The ${pass.human ? "pass's" : "round's"} findings, as JSON:
${json(ctx.inScope)}

Dispositions and deferred items (a defer task ships only the mitigation${pass.human ? '; a none finding has no task' : '; a deferred finding with no task in plan.md gets no change and no commit; a declined finding has no task and no commit'}), as JSON:
${json({ findings: ctx.shaped.findings, deferred: ctx.deferred })}

Decisions made outside the shaper (already in the spec; decidedBy names the owner, the person or the autopilot): ${Object.keys(ctx.roundDecisions).length ? json(ctx.roundDecisions) : 'none'}

The plan approver's notes: ${ctx.plan.notes || 'none'}
Allowed paths (the checker refuses anything else): ${json(ctx.allowed)}

Approved standards edits (apply only these, in their own commit after the finding commits), as JSON:
${json(ctx.standards.approved.filter((edit) => !edit.alreadyCovered))}
The standards commit's message names every finding whose fix one of these edits carries, as shape.md's plan for that finding says (for example \`redline: record the ${pass.name} ${pass.human ? '' : 'review '}lessons in the standards, finishing ${pass.idPrefix}-1 (#${issue})\`), so that finding's reply names both of its commits. An edit that is only a lesson names no finding.
${ctx.standards.approved.length === 0 || ctx.standards.noChanges ? 'Nothing approved: record "Standards retrospective: no changes" under Decisions in shape.md.' : ''}

${decideRule(pass)} A Pending decision task is not implemented; a question that comes up while you build goes under blocked with the options. Never push.
${ctx.repair ? `\nThis is a repair pass. The checker's independent run of checks.sh failed after your last pass:\n${ctx.repair}\nFix the cause, commit Redline's way, and run the gate until it exits 0.\n` : ''}
Return only the JSON your instructions specify.`
}

function checkerPrompt(flag, snapshot, octane, label) {
  const bg = gateRun(flag, snapshot, octane, label)
  if (!bg) {
    return `${RUN_LINE}

Run this command line with Bash, exactly as given, once, with timeout: 600000 on the Bash call (the gate outlasts the tool's two-minute default), and return its JSON as your instructions say. If the tool moves the command to the background instead, return status result_unreadable with reason backgrounded and its notice under error. If the tool shows you no complete JSON otherwise (the output was saved to a file, is not one JSON object, or has no git key), return status result_unreadable with the reason, as your instructions say. A usage error (exit 2) is status read with result null, never result_unreadable.

${checkerCommand(flag, snapshot, octane)}`
  }
  return `${RUN_LINE}

The gate takes longer than the Bash tool allows in the foreground (${baselineNote}), so run it in two steps with Bash, each command exactly as given.

1. Start it once, with run_in_background: true on the Bash call:
${bg.start}

2. Then wait for it in the foreground, with timeout: 600000 on the Bash call:
${bg.wait}

Each wait returns within four minutes. Exit 3 means the gate is still running: run the same wait again, as often as it takes. Ignore the start command's own completion notice; the wait carries the result.

When the wait exits 0, 1 or 2, its output and exit code are the gate's: return them as your instructions say for the gate's command line (a usage error, exit 2, is status read with result null, never result_unreadable; output that is not one complete JSON object with a git key is result_unreadable with the reason). When it exits 4 (the gate ran past its limit) or 5 (the run ended without a result), return status result_unreadable with reason no_result and the wait's line under error. If the start command is refused or fails to start, return status result_unreadable with reason no_result and what the tool said under error.`
}

// The verdict of a gate run whose result the Bash tool could not show (#68): checks.sh keeps every
// run's result in a file outside the tree, and --verdict prints its smallest form without running
// anything, so it is one foreground command whatever the gate's length. The guard already lets
// the checker run checks.sh with any flag; the checker reads no file itself.
function verdictCommand(flag, snapshot) {
  return checkerCommand(flag ? `--verdict ${flag}` : '--verdict', snapshot, false)
}

// attempt is the resume attempt of the check this verdict follows, 0 on a first run: a relaunch
// that reruns the check must ask for the verdict again, never replay the one the earlier attempt
// was given, so its prompt differs.
function verdictPrompt(flag, snapshot, attempt) {
  return `${RUN_LINE}

The gate has run, and the tool could not show its result. Run this command line with Bash, exactly as given, once: it runs no check and prints the verdict checks.sh kept for that run. Return its JSON as your instructions say. A usage error (exit 2) is status read with result null, never result_unreadable.${attempt ? ` This follows resume attempt ${attempt} of the check.` : ''}

${verdictCommand(flag, snapshot)}`
}

function pushReplyPrompt(pass, specFolder, replies, doPush, noPush) {
  const step1 = doPush
    ? `Step 1. Push: run \`git push origin ${headRef}\` once. If it is rejected, set error to git's message, write no reply files and stop.`
    : `Step 1. Do not push (${!postToGitHub ? 'this is a dry run' : noPush || 'push is off for this run'}).`
  const where = pass.human
    ? `the finding is the body of ${pass.reviewer}'s review, which has no thread, and its file already starts with a <!-- redline:<id> --> marker`
    : 'the finding sits in the review body behind a <!-- redline:<id> --> marker, and its file already starts with that marker'
  const twice = pass.human
    ? ` A thread of ${pass.reviewer}'s may already hold a Redline round's reply; that is not a duplicate. The duplicate check is a reply in that thread opening \`${pass.title}:\`. One entry may answer several findings of one thread (its findings list names them); it is still one reply.`
    : ` The duplicate check is a reply in that thread opening \`${pass.title}:\`: an earlier round's reply in the thread of a finding carried forward from it is not one.`
  const step2 = postToGitHub
    ? `then act on its route. Route "thread": run \`${GH} reply ${pr} <comment_id> <file>\`. Route "issue-comment": ${where}, so run \`${GH} comment ${pr} <file>\` once for it instead of reply and report reply_id 0. To check whether it is already posted, look in \`${GH} pr-comments ${pr}\` for its second line (${pass.bodyHeaderHint}), never for the marker, which ${pass.human ? 'only the reply carries here but a Redline round\'s review body also carries' : 'the review body also carries'}. Route "file-only": no review is on GitHub for it (a dry run, or a review that was never posted), so write the file, post nothing and report reply_id 0. Never reply twice in one thread, and never post a body finding's comment twice.${twice}`
    : 'and run nothing else (dry run).'
  return `${RUN_LINE}

Operation: push and reply for ${pass.name}. PR #${pr}, head branch ${headRef}. Spec folder: ${abs(specFolder)}. postToGitHub: ${postToGitHub}. push: ${doPush}.

${step1}

Step 2. For each reply below, write its file with the Write tool, byte for byte, ${step2}

Replies, as JSON:
${json(replies)}

Return only the JSON your instructions specify, with operation "push-and-reply", pushed, and one replies entry per reply (reply_id 0 when nothing was posted).`
}

// Filing a pass's deferred drafts (#95): the agent writes each draft file byte for byte and runs
// the one defer line given for it. The script is what makes a repeat safe: it reads the pass's
// record, then looks on GitHub for an issue that carries the draft's last line, and opens one
// only when both hold none. So a resume that reruns this call reuses what an earlier attempt
// opened, and the agent is told to check and open nothing itself.
function deferPrompt(pass, specFolder, entries) {
  return `${RUN_LINE}

Operation: defer for ${pass.name}. PR #${pr}. Spec folder: ${abs(specFolder)}. postToGitHub: ${postToGitHub}.

Each draft below is a deferred finding's issue as it is to be filed. For each one, in order: Step 1. Write its file with the Write tool, byte for byte (its first line is the title, its second is empty, the rest is the body). Step 2. Run its command exactly as given, once, and keep the JSON object it prints. Mode "issue" opens a GitHub issue; mode "draft" records the file's path and calls nothing on GitHub${postToGitHub ? '' : ', which is every draft of a dry run'}. The command is safe to repeat: it opens an issue only when neither the record nor GitHub holds one for the finding, and otherwise prints the one already there with reused true. So never look for an issue yourself, never open one another way, and never run \`gh\`. If a command exits non-zero, set error to its stderr and run nothing further.

Drafts, as JSON:
${json(entries)}

Return only the JSON your instructions specify, with operation "defer" and one deferred entry per draft exactly as its command printed it (finding, where, number, url, path, reused).`
}

function updatePrompt(specFolder, bodyCandidates, copy) {
  return `${RUN_LINE}

Operation: update (the PR description). PR #${pr}. Spec folder: ${abs(specFolder)}. postToGitHub: true.

This call posts the new PR description before anything else reaches the PR; the handoff comment and the review request come in a later call. Check these files with Read, in this order (newest round first); the first that exists is the new description:
${bodyCandidates.map((path) => `- ${path}`).join('\n')}
Run \`${GH} update ${pr} - <that file> ${copy}\` once (- keeps the title; the script backs up the old title and body, copies the backup to ${copy}, and reads the new body back) and set prBody to {file: <that file>, updated: true, backup: <backup from its output>, copy: <copy from its output>}. When none of the files exists, run nothing and set prBody to {file: "", updated: false, backup: "", copy: ""}. If update exits non-zero, set error to its stderr and run nothing else.

Return only the JSON your instructions specify, with operation "update".`
}

function finishPrompt(kind, specFolder, file, content) {
  const post = postToGitHub
    ? `Step 2. Run \`${GH} comment ${pr} ${abs(file)}\` and return the comment URL.`
    : 'Step 2. This is a dry run: post nothing.'
  const request = kind === 'handoff' && postToGitHub && teammate
    ? `Step 3. Run \`${GH} request-review ${pr} ${teammate}\` and set reviewRequested true.`
    : 'Step 3. Request no review; set reviewRequested false.'
  const operation = kind === 'handoff'
    ? 'comment (the Redline handoff) and request-review'
    : kind === 'cap-hit' ? 'comment (the cap-hit comment)' : 'comment (the Redline human review summary; the reviewer is already on the PR, so no handoff and no review request)'
  return `${RUN_LINE}

Operation: ${operation}. PR #${pr}. Spec folder: ${abs(specFolder)}. postToGitHub: ${postToGitHub}. Do not touch the PR description; it is not part of this operation.

Step 1. Write this file with the Write tool, byte for byte: ${abs(file)}

\`\`\`markdown
${content}
\`\`\`

${post}

${request}

Return only the JSON your instructions specify, with operation "${kind}".`
}

function resolveThreadsPrompt(settled) {
  const all = (s) => [s.commentId, ...(s.extraIds || []), s.replyId]
  const ids = settled.flatMap(all)
  return `${RUN_LINE}

Operation: resolve-threads. PR #${pr}. postToGitHub: true. push: true.

These findings are settled (fixed, deferred with its drafted issue filed, declined by Redline with its reason posted, decided by the person and applied, or, for an earlier round's finding this run carried forward or resolved, answered in its thread), their commits are pushed and their replies posted, so Redline closes the threads it opened for them; the ids are the inline comment and every reply Redline posted in each thread, in this run or an earlier round's:
${settled.map((s) => `- ${s.id} (round ${s.round}): comments ${all(s).join(', ')}`).join('\n')}

Run this once, exactly as given, and nothing else:

${GH} resolve-threads ${pr} ${ids.join(' ')}

Set resolved and skipped from its JSON as printed. The script decides what it resolves: a thread a teammate opened or commented in is skipped with a reason, which is a result and not an error. If it exits non-zero, set error to its stderr.

Return only the JSON your instructions specify, with operation "resolve-threads".`
}

// Finish's first step (#81): the highest Redline round posted on the PR. Read-only, one script
// call. It sits after every stopping point, so no prompt a relaunch replays depends on it.
function lastRoundPrompt() {
  return `${RUN_LINE}

Operation: last-round. PR #${pr}. Read only. Run \`${GH} last-round ${pr}\` once and nothing else. Set round to the number it prints. If the script fails, set round to 0 and error to its stderr.

Return only the JSON your instructions specify, with operation "last-round".`
}

function recordStatusPrompt(paths) {
  return `${RUN_LINE}

Operation: record-status. PR #${pr}. Read only. Run this once, exactly as given, and nothing else:

git -C ${repoRoot} status --porcelain --untracked-files=all -- ${paths.join(' ')}

Set files to the path on each line it prints (the text after the two status letters and the space, repository-relative, exactly as printed), in the order printed, or [] when it prints nothing. If git fails, set error to its message.

Return only the JSON your instructions specify, with operation "record-status".`
}

// The spec check (#57). Read-only, two fixed commands: the GitHub role has git-read, not grep or
// ls, and git grep --no-index lists untracked files. The prompt never mentions a decision, so it
// replays from cache on every relaunch.
function specStatusPrompt(pass, specFolder) {
  return `${RUN_LINE}

Operation: spec-status (${pass.name}). Read only. Run these two commands once each, exactly as given, and nothing else:

git -C ${repoRoot} grep --no-index -l -e '' -- ${specFolder}/plan.md ${specFolder}/shape.md ${specFolder}/standards.md ${specFolder}/references.md

git -C ${repoRoot} grep --no-index -l -e '^## Decisions' -- ${specFolder}/shape.md

Set files to the paths the first printed and headings to the paths the second printed, each exactly as printed and [] when nothing was printed. A non-zero exit, or a warning that a directory could not be opened, means a file is missing and is not an error: leave error empty. Set error only when a command was refused or could not run.

Return only the JSON your instructions specify, with operation "spec-status".`
}

function recordCommitPrompt(files, message) {
  const step3 = push
    ? `Step 3. Push: run \`git -C ${repoRoot} push origin ${headRef}\` once and set pushed true. If it is rejected, set error to git's message.`
    : `Step 3. Do not push (${postToGitHub ? 'push is off for this run' : 'this is a dry run'}); set pushed false.`
  return `${RUN_LINE}

Operation: record-commit. PR #${pr}, head branch ${headRef}. push: ${push}.

These files are the run's record that no commit holds yet (the reviews, findings, snapshots, replies and the closing comment, under the spec folders). Commit them so the run leaves a clean tree.

Step 1. Stage them by name, in one command, these paths and no others:

git -C ${repoRoot} add -- ${files.join(' ')}

Step 2. Commit with exactly this command, then run \`git -C ${repoRoot} rev-parse HEAD\` and set sha to the full SHA it prints and committed true:

git -C ${repoRoot} commit -m "${message}"

${step3}

Return only the JSON your instructions specify, with operation "record-commit" and files listing the paths you staged.`
}

// ---------------------------------------------------------------------------
// The checker's verdict. The script decides, never an agent. It decides from the gate's own
// fields (each check's exit against the baseline, the exit code, the git block); the checker's
// error field is text. A result the implementer cannot change (unreadable, missing, a usage error, no git block) stops the run at
// check instead of starting a repair pass that would hit the same wall (#9).
// ---------------------------------------------------------------------------

// A reason that claims something about the JSON's shape is checked against the JSON the checker
// returned, since the workflow holds it (#55): #54 round 1 stopped at baseline when the checker
// read `git: null`, which --baseline prints, as a missing key. The run-level reasons (spilled,
// backgrounded, no_result) say the output went where the checker could not read it, which the
// JSON cannot refute, so they stop as before.
const STRUCTURAL_REASONS = ['not_json', 'no_git_block']

// One object with a checks array and a git key, whatever its value: the gate's shape.
function gateShaped(result) {
  return result !== null && typeof result === 'object' && !Array.isArray(result) && Array.isArray(result.checks) && Object.prototype.hasOwnProperty.call(result, 'git')
}

// The checker's result with a structural misread overridden to read, and the warning to record,
// or the result as it came with no warning.
function readStructure(out) {
  if (out.status !== 'result_unreadable' || !STRUCTURAL_REASONS.includes(out.reason) || !gateShaped(out.result)) {
    return { out, warning: null }
  }
  return {
    out: { ...out, status: 'read', reason: '' },
    warning: `the checker said result_unreadable (${out.reason}), but the JSON it returned is one object with a checks array and a git key; the workflow overrode the status and read the result`,
  }
}

// Why the run stops on this result, naming the cause and the fix, or null when judge() decides.
// needGit is false for the baseline, whose git block is null by design.
function stopReason(out, command, needGit) {
  const said = out.error
  const suffix = said ? `; the checker said: ${said.slice(0, 400)}` : ''
  const byHand = `; run ${command} by hand and read its output`
  if (out.exit === 2) {
    return `checks.sh exited 2 (usage error)${suffix}${byHand}`
  }
  if (out.status === 'result_unreadable') {
    const cause = {
      spilled: `checks.sh output exceeded the Bash tool's inline limit and was saved to a file the checker may not read, and ${out.verdictError || 'no verdict was asked for'}. A checks.sh made from a template before v3 has no --verdict and no bound on its result: run /redline:setup to regenerate it (the sizes are in the comment above the caps in ${pluginRoot}/scripts/checks-template.sh)`,
      not_json: `checks.sh printed something that is not one JSON object${byHand}`,
      no_git_block: `the JSON checks.sh printed has no git block, so the output was cut or the script is broken${byHand}`,
      backgrounded: `the gate took longer than the Bash tool allows in the foreground; the checker must background it (recorded baseline: ${baselineSeconds === null ? 'none' : `${baselineSeconds} s`}). Record the gate's current time in baseline.seconds in ${repoRoot}/.claude/redline/checks.json (the baseline step of /redline:setup does it); over ${FOREGROUND_MAX_S} s the checker runs the gate in the background`,
      no_result: `the gate run in the background gave no result${byHand}`,
    }[out.reason] || `reason ${JSON.stringify(out.reason)}${byHand}`
    return `the checker could not read checks.sh's result: ${cause}${suffix}`
  }
  if (!out.result) {
    return `the checker returned no result${suffix}${byHand}`
  }
  if (needGit && !out.result.git) {
    return `the checker result has no git block${suffix}${byHand}`
  }
  return null
}

function failingNames(out) {
  const checks = out && out.result && Array.isArray(out.result.checks) ? out.result.checks : []
  return checks.filter((check) => !check.recorded && check.exit !== 0).map((check) => check.name)
}

function judge(out, baselineFailing, needCommits, command) {
  const stop = stopReason(out, command, true)
  if (stop) {
    return { pass: false, stop, reasons: [], warnings: [], preExisting: [], diffLines: null }
  }
  const reasons = []
  const result = out.result
  const checks = Array.isArray(result.checks) ? result.checks : []
  if (checkerMode === 'full' && checks.length === 0) {
    reasons.push('no checks ran in a full checker pass')
  }
  const failing = failingNames(out)
  const newFailures = failing.filter((name) => !baselineFailing.includes(name))
  const preExisting = failing.filter((name) => baselineFailing.includes(name))
  if (newFailures.length) {
    reasons.push(`failing checks: ${newFailures.join(', ')}`)
  }
  const git = result.git
  // A hand commit made since the run stopped, on a .claude/ path, is excused (#10): its paths are
  // not unexpected, its commit needs no prefix, and an exit 1 it alone caused is not a failure.
  const excused = (git.unexpected_files || []).filter((path) => handPaths.includes(path))
  const unexpected = (git.unexpected_files || []).filter((path) => !excused.includes(path))
  if (unexpected.length) {
    reasons.push(`files outside the approved plan changed: ${unexpected.join(', ')}`)
  }
  const uncommitted = git.uncommitted || []
  if (uncommitted.length) {
    reasons.push(`uncommitted changes outside the spec folders, which the push would leave behind: ${uncommitted.join(', ')}`)
  }
  const commits = git.commits || []
  const unprefixed = commits.filter((commit) => !handCommits.has(commit.sha) && !/^redline:/.test(commit.message || ''))
  if (unprefixed.length) {
    reasons.push(`commits without the redline: prefix: ${unprefixed.map((commit) => short(commit.sha)).join(', ')}`)
  }
  const missing = needCommits.filter((id) => !commits.some((commit) => mentions(commit.message, id)))
  if (missing.length) {
    reasons.push(`no commit names ${missing.join(', ')}`)
  }
  if (out.exit !== 0 && reasons.length === 0 && preExisting.length === 0 && excused.length === 0) {
    reasons.push(`checks.sh exited ${out.exit}`)
  }
  // The checker's error is text, never a verdict input (#37, R1-3): detail on a failure the
  // checks, the git block or the exit code already established, a warning otherwise.
  const said = out.error
  const warnings = []
  if (said && reasons.length) {
    reasons.push(`checker error: ${said.slice(0, 400)}`)
  } else if (said) {
    warnings.push(`the checker reported "${said.slice(0, 200)}" on a round that passes`)
  }
  return { pass: reasons.length === 0, stop: null, reasons, warnings, preExisting, diffLines: git.diff_lines }
}

function failingExcerpt(out) {
  const checks = out && out.result && Array.isArray(out.result.checks) ? out.result.checks : []
  return checks
    .filter((check) => !check.recorded && check.exit !== 0)
    .map((check) => `--- ${check.name} (exit ${check.exit}): ${check.cmd || ''}\n${(check.stdout || '').slice(-3000)}\n${(check.stderr || '').slice(-1500)}`)
    .join('\n')
}

// ---------------------------------------------------------------------------
// Run state.
// ---------------------------------------------------------------------------

const rounds = []
const deferredAll = []
const decidedAll = []
const commitsAll = []
const warnings = []
if (AGENTS_CHANGED) {
  warnings.push(AGENTS_CHANGED)
}
let approvedPaths = []
// Whether a file is under a list of plan paths, read as checks.sh reads its allowed list: an entry
// ending in a slash covers everything under it, any other entry only itself.
const underPaths = (file, paths) => paths.some((entry) => (entry.endsWith('/') ? file.startsWith(entry) : file === entry))
let baseline = null
let baselineFailing = []
let recordCommit = null
let threadSweep = null

function compactFinding(f) {
  return { id: f.id, category: f.category, severity: f.severity, file: f.file, line: f.line, title: f.title, confidence: f.confidence, knownAs: f.knownAs, carriedFrom: f.carriedFrom || '' }
}

function history() {
  const out = []
  for (const record of rounds) {
    for (const f of record.findings) {
      const outcome = record.outcomes ? record.outcomes[f.id] : null
      out.push({ ...compactFinding(f), round: record.round, outcome: outcome || (f.knownAs ? `already tracked: ${f.knownAs}` : 'open') })
    }
  }
  return out
}

function result(status, extra) {
  return {
    status,
    pr,
    launchedAt: A.launchedAt,
    stamp,
    firstRound,
    postToGitHub,
    push,
    interrupt,
    scope,
    login,
    rounds: rounds.map((record) => ({
      round: record.round,
      reviewed: record.reviewed,
      specFolder: record.specFolder,
      range: record.range,
      // What would confirm an unconfirmed finding rides with it, so the skill's review-only summary
      // can say it (#94, R7-3); compactFinding stays as history() uses it in the reviewer's prompt.
      findings: record.findings.map((f) => ({ ...compactFinding(f), ...(f.confidence === 'unconfirmed' ? { wouldConfirm: f.wouldConfirm || 'not stated' } : {}), ...(linked(f).length ? { sameClassAs: linked(f).slice() } : {}) })),
      // What the correctness-only scope declined in this round (#93). Those items stay in findings,
      // as the round's record keeps them, and are listed here apart so the skill's summaries can
      // name them (#94, R3-8).
      scoped: (record.scoped || []).map(compactFinding),
      // The round's low-severity correctness findings from the previous round's fix diff, fixed
      // like a nit: none of them bought a round (#95).
      minor: (record.minor || []).slice(),
      // Nothing a final nit pass reports is dropped since #94, R7-10, so this reads 0; the key
      // is kept for readers of the result.
      droppedNits: record.droppedNits || 0,
      post: record.post,
      dispositions: record.dispositions || null,
      commits: record.commits || [],
      check: record.check || null,
      outcomes: record.outcomes || null,
      dropped: (record.dropped || []).map((f) => ({ id: f.id, reason: f.reason })),
      carried: record.carried || {},
      resolvedPrior: record.resolvedPrior || [],
      coverage: record.coverage || null,
      files: record.files || [],
      replyIds: record.replyIds || {},
      human: record.human || null,
      forced: record.forced || {},
    })),
    judgmentCalls: [],
    // The findings left to the person under a repository ask rule (#49), every round.
    // `open` is what Redline would have done for one nobody answered, on autopilot (#95), else ''.
    forced: rounds.flatMap((record) => Object.entries(record.forced || {}).map(([id, x]) => ({ id, round: record.round, rule: x.rule, ...(x.own ? { own: true } : {}), reason: x.reason, outcome: record.outcomes && record.outcomes[id] ? record.outcomes[id] : '', open: (record.leftOpen || {})[id] || '' }))),
    // What the run deferred (#95): each item with its mitigation, its draft as filed (title and
    // body), where it went (where, number, url, path) and its outcome as posted; deferTo is the
    // run's setting, which the session reads to print the drafts when it is print.
    deferTo,
    deferAt,
    deferred: deferredAll,
    decided: decidedAll,
    openFindings: [],
    commits: commitsAll,
    recordCommit,
    threads: threadSweep,
    specFolders: unique(rounds.map((record) => record.specFolder)),
    snapshotStart,
    // Each warning once (#97, R4-4): vetShape runs after the shape and after every reshape, so a
    // decision a reshape keeps would repeat what its check said.
    warnings: unique(warnings),
    relaunch: {
      workflow: 'redline:redline-loop',
      how: 'Relaunch with byte-identical args plus the answers this result asks for, and resumeFromRunId set to the runId of the launch that returned this result. Same session only. handoff (decisions): decisions ({"<id>": {"choice", "notes", "date"}}, every decision so far, unchanged, plus "disposition": "fix|defer" on a decline overruled at that stop). A call answered by picking one of its options also carries "option": "<the label of the option picked>", exactly as the call gives it, never beside "disposition": the workflow takes what the pick ends in from the option\'s ends; an answer in the person\'s own words carries no option. A finding left to the person (forced not null) is deferred to an issue by a pick of its option that ends in defer, or by "disposition": "defer" typed for it; any other disposition typed for one is not applied, and any other answer leaves it to the person with nothing filed. For each id in overridesUnresolved, the restated decision ({"choice", "notes", "date", "disposition": "fix|defer|accept"}) replaces the one the resolve agent could not apply. handoff (plan): approvedPlans as approveWith gives it (this round\'s number added, or h<n> for a human review pass), plus decisions for every ask ({"choice", "notes", "date"}) and every changed disposition ({"choice", "notes", "date", "disposition": "fix|defer|accept"}). reviewed: selected ({"act": [ids], "dropped": {"<id>": "reason"}}). A stop that carries drafts (handoff decisions or plan with draftsNeeded not empty, and handoff deferred, the one stop before the run finishes when deferred items are raised at the end of the run): deferrals ({"<id>": {"action": "file|drop", "title": "<the person\'s title, or empty>", "notes": "<for a drop, the restated reason>", "date", "draft": <the draft number the stop gave for that id>}}, every answer so far, unchanged, plus one for each id in draftsNeeded). A draft turned back into a fix, or accepted with no change, is a disposition override in decisions instead, and only for a draft whose canFix is true. error: resume ({"<label>": {attempt, error, hand, ownCheck}}) for the label resumeFrom names, with ownCheck as this result gives it, through the skill\'s run marker. On the plugin\'s own repository a relaunch runs the script the run launched with and may add drift ({workflow, pinned, agents}), as redline-prefs.sh run drift prints it (#81).',
    },
    ...extra,
  }
}

// ---------------------------------------------------------------------------
// Phases.
// ---------------------------------------------------------------------------

async function gather(round) {
  const facts = await run('gather', gatherPrompt(round), {
    agentType: 'redline:redline-github', ...modelOpts('github'), label: `gather r${round}`, phase: 'Gather', schema: GATHER_SCHEMA,
  })
  if (facts.error) {
    throw stageError('gather', `redline-gh.sh pr ${pr} failed: ${facts.error}`)
  }
  // A dry run posts and pushes nothing, so it may read a closed PR (a seed, a recall test).
  if (facts.state && facts.state !== 'OPEN' && postToGitHub) {
    throw stageError('gather', `PR #${pr} is ${facts.state}, not OPEN`)
  }
  if (facts.headRefName !== headRef) {
    throw stageError('gather', `PR #${pr}'s head branch is ${facts.headRefName}, not ${headRef}`)
  }
  return facts
}

// One class with an earlier finding (#75). The verifier states the link, sameClassAs, and the
// workflow keeps an id only where its record can show the earlier finding was fixed: a finding
// of an earlier round of this run whose outcome is `fixed`, or one of an earlier run on the pull
// request that the launch's prior-findings record gives the disposition `fixed`. A fix made at a
// call or as a deferral's mitigation is recorded as decided or deferred, so it is no link; no
// reply text is read to find one. Every other id is cleared with a warning, here, before the
// review is posted, and a finding left with no link carries no key at all, so its round's
// prompts and its findings file are those of a round with no link. A review that was shown no
// earlier finding was not asked, and whatever it returned is cleared the same way.
function linkFault(id) {
  const record = rounds.find((r) => r.findings.some((x) => x.id === id))
  if (record) {
    const kind = (record.outcomeKinds || {})[id]
    return kind === 'fixed' ? '' : `${passOf(record).name} recorded ${id} ${kind ? `as ${kind}` : 'with no outcome'}, not as fixed`
  }
  const p = priorById[id]
  if (p) {
    return p.disposition === 'fixed' ? '' : `an earlier run recorded ${id} as ${p.disposition}, not as fixed`
  }
  return `${id} names no finding Redline recorded on this pull request`
}
function honourLinks(round, findings, asked) {
  for (const f of findings) {
    if (f.sameClassAs === undefined) {
      continue
    }
    const named = unique((Array.isArray(f.sameClassAs) ? f.sameClassAs : []).map((id) => (typeof id === 'string' ? id.trim() : '')).filter((id) => id !== ''))
    const stands = []
    for (const id of named) {
      const why = !asked ? 'this review was shown no earlier finding' : findings.some((x) => x.id === id) ? `${id} is a finding of this round` : linkFault(id)
      if (why) {
        warnings.push(`round ${round}: the reviewer linked ${f.id} to ${id} as one class (sameClassAs), but ${why}; the link is cleared`)
      } else {
        stands.push(id)
      }
    }
    if (stands.length) {
      f.sameClassAs = stands
    } else {
      delete f.sameClassAs
    }
  }
}

async function review(round, reviewed, range, facts, source) {
  // What is reviewed, not the round number, picks the model and the label: a human review pass's
  // final nit pass carries the run's first round number and is still a nit pass (#36).
  const key = reviewed === 'pr' ? 'reviewerFirstRound' : 'reviewerLaterRounds'
  // The coverage pass first (#79), on every round but the final nit pass: the default workflow
  // agent, no agentType, no schema, its text read by coverageCandidates. A pass that yields
  // nothing usable stops the round here, resumable at its own label.
  let candidates = null
  let coverageHead = ''
  if (coverageOn && reviewed !== 'final-nit-pass') {
    coverageHead = reviewed === 'pr' ? startSha : range.to
    const label = `coverage r${round}`
    const text = await run('review', coveragePrompt(round, coverageHead), {
      ...modelOpts(models.coverage && typeof models.coverage === 'object' ? 'coverage' : 'reviewerFirstRound'),
      effort: coverageEffort(),
      label,
      phase: reviewed === 'pr' ? 'Review' : 'Re-review',
    })
    const parsed = coverageCandidates(text)
    if (parsed.cause) {
      throw stageError('review', coverageMessage(parsed.cause), { cause: parsed.cause, text: parsed.text.slice(0, 2000) }, label)
    }
    candidates = parsed.candidates
  }
  const earlier = history()
  const linksAsked = showsEarlier(reviewed, earlier, candidates)
  const out = await run('review', reviewPrompt(round, reviewed, range, facts, earlier, source, candidates), {
    agentType: 'redline:redline-reviewer',
    ...modelOpts(key),
    label: `${reviewed === 'pr' ? 'review' : reviewed === 'final-nit-pass' ? 'final nit pass' : 're-review'} r${round}`,
    phase: reviewed === 'pr' ? 'Review' : 'Re-review',
    schema: linksAsked ? REVIEW_SCHEMA_LINKS : REVIEW_SCHEMA,
  })
  // IDs are the script's to trust: renumber anything that does not carry this round's prefix.
  // Each rename is recorded, old id to new, so the coverage refs naming it follow (#80, R2-3); the
  // first finding with an old id keeps it. A renamed id is numbered after the highest id of the
  // round's form in use, by lastFindingNumber, as reconcilePrior and accountCoverage number theirs,
  // so it never takes an id another finding already has (#94, R4-6).
  const idForm = new RegExp(`^R${round}-\\d+$`)
  let nextId = lastFindingNumber(round, out.findings)
  const renamed = new Map()
  // An id of the round's form another finding already has is renamed the same way, with a warning,
  // so no two findings share an id; a ref naming it stays with the first finding, which keeps it,
  // so the rename map does not record it (#94, R5-5).
  const taken = new Set()
  out.findings.forEach((f) => {
    if (!idForm.test(f.id)) {
      const newId = `R${round}-${++nextId}`
      warnings.push(`round ${round}: reviewer returned id ${JSON.stringify(f.id)}; renamed ${newId}`)
      const oldId = typeof f.id === 'string' ? f.id.trim() : f.id
      if (!renamed.has(oldId)) {
        renamed.set(oldId, newId)
      }
      f.id = newId
    } else if (taken.has(f.id)) {
      const newId = `R${round}-${++nextId}`
      warnings.push(`round ${round}: reviewer returned id ${JSON.stringify(f.id)} again; renamed ${newId}`)
      f.id = newId
    }
    taken.add(f.id)
    f.carriedFrom = typeof f.carriedFrom === 'string' ? f.carriedFrom.trim() : ''
    // The facts beside the claim (#93). Whether to ask is the shaper's question, so a needsDecision
    // a reviewer still returns is dropped; what would confirm an unconfirmed finding is kept, and
    // its absence is said.
    delete f.needsDecision
    f.outsideDiff = f.outsideDiff === true
    f.inFixDiff = f.inFixDiff === true
    f.wouldConfirm = f.confidence === 'unconfirmed' && typeof f.wouldConfirm === 'string' ? f.wouldConfirm.trim() : ''
    if (f.confidence === 'unconfirmed' && !f.wouldConfirm) {
      warnings.push(`round ${round}: the reviewer could not confirm ${f.id} and did not say what would confirm it`)
    }
    // The reviewer's ask-rule tag is advisory and must name a declared rule (#49).
    f.askRule = typeof f.askRule === 'string' ? f.askRule.trim() : ''
    if (f.askRule && !ruleById[f.askRule]) {
      warnings.push(`round ${round}: the reviewer tagged ${f.id} with ask rule ${JSON.stringify(f.askRule)}, which .claude/redline.json does not declare; cleared`)
      f.askRule = ''
    }
  })
  // The links (#75), read after the ids are the round's own, so a link to a finding of this
  // same round is seen as one.
  honourLinks(round, out.findings, linksAsked)
  out.resolved = Array.isArray(out.resolved) ? out.resolved : []
  // The coverage accounting (#79). Without a coverage pass there is nothing to account for, so an
  // accounting the reviewer wrote anyway is cleared.
  out.coverage = Array.isArray(out.coverage) ? out.coverage.filter((e) => e && typeof e === 'object') : []
  // Only the run's first round carries, from the earlier rounds' list (#35, decision 9 of its
  // spec), so any other review clears what a reviewer copied from the history (#46, R1-1).
  if (reviewed === 'pr' && priorFindings.length) {
    reconcilePrior(round, out)
  } else {
    for (const f of out.findings) {
      if (f.carriedFrom) {
        warnings.push(`round ${round}: the reviewer marked ${f.id} as carried from ${f.carriedFrom}, but this review has no carry-forward list; cleared`)
        f.carriedFrom = ''
      }
    }
    out.carried = {}
    out.resolved = []
  }
  // The accounting runs after the carry-forward reconcile, which can clear a knownAs, so it reads
  // each finding as the round will post it (#80, R1-4).
  if (candidates) {
    // A finding or duplicate entry naming an id the rename above changed names that finding by its
    // new id, a finding of this round, so the R1-4 rule for a ref naming no finding does not apply
    // to it (#80, R2-3). A ref with a note after a renamed id follows the rename too: the old id it
    // opens with, read by leadingId as accountCoverage reads it, is renamed and the note kept, so
    // accountCoverage reads it by its leading id with a warning, as it reads any ref with a note
    // (#94, R2-5, R5-3, R9-5). A duplicate's ref that opens with a candidate's index is left as it
    // is, unless the reviewer gave a finding that index as its id, which the whole ref's rename has
    // always followed. A settled ref names an earlier finding, which the rename never touches, so
    // it keeps its id.
    for (const entry of out.coverage) {
      if (!LISTED_ELSEWHERE.includes(entry.outcome) && entry.outcome !== 'duplicate') {
        continue
      }
      const ref = typeof entry.ref === 'string' ? entry.ref.trim() : entry.ref
      if (renamed.has(ref)) {
        entry.ref = renamed.get(ref)
        continue
      }
      const old = typeof ref === 'string' ? leadingId(ref, renamed.keys()) : ''
      if (old) {
        entry.ref = `${renamed.get(old)}${ref.slice(old.length)}`
      }
    }
    const counts = accountCoverage(round, out, candidates)
    out.coverage = { head: coverageHead, candidates: candidates.length, counts, accounting: out.coverage }
    // The list the accounting's indexes point into, as the verifier saw it, for the findings file
    // only; the round record and the result keep the count (#80, R1-5).
    out.coverageList = candidates.map((c, i) => ({ index: i + 1, ...c }))
    // The candidates the round set aside, for the review body's set-aside block and the round
    // record (#85; the #85 follow-up spec): every accounting entry the round lists nowhere else,
    // each with its own file, line and summary beside the verifier's ref. An entry with no ref
    // keeps its line, read as "no reason given", with a warning. A duplicate whose ref opens with
    // another candidate's index (`3`, `candidate 3` or `index 3`, any case), with any note after it
    // as the accounting sentence asks, carries that candidate's place and outcome in `into`, one
    // hop, so its line shows where it went; any other ref is shown as written (#86, R4-1). When
    // that candidate is accounted for as a finding, `into` also carries its ref, the finding's id,
    // since the block does not list the finding (#86, R5-4).
    const byIndex = new Map(out.coverage.accounting.map((e) => [e.index, e]))
    out.setAsideCandidates = out.coverage.accounting
      .filter((e) => !LISTED_ELSEWHERE.includes(e.outcome))
      .map((e) => {
        const c = candidates[e.index - 1]
        if (!e.ref) {
          warnings.push(`round ${round}: the reviewer set aside coverage candidate ${e.index} as ${e.outcome} with no reason; listed as "no reason given"`)
        }
        const to = e.outcome === 'duplicate' ? duplicateTarget(e.ref) : 0
        const into = to !== e.index && byIndex.has(to) ? { index: to, file: candidates[to - 1].file, line: candidates[to - 1].line, outcome: byIndex.get(to).outcome, id: LISTED_ELSEWHERE.includes(byIndex.get(to).outcome) ? byIndex.get(to).ref : '' } : null
        return { index: e.index, file: c.file, line: c.line, summary: c.summary, outcome: e.outcome, ref: e.ref, into }
      })
  } else {
    if (out.coverage.length) {
      warnings.push(`round ${round}: the reviewer returned a coverage accounting, but this round ran no coverage pass; cleared`)
    }
    out.coverage = null
    out.setAsideCandidates = []
  }
  return out
}

// The accounting for the carry-forward list (#35): every undispositioned earlier finding is
// carried (a finding of this round with carriedFrom) or resolved (the code no longer has it), and
// the loop never lets one drop. One the reviewer did not account for is carried as reported, with
// a warning, so the shaper investigates it: a stale line is moved into the body by place, never
// lost. A carriedFrom or a resolved entry naming a tracked or unknown id is cleared or ignored.
// A fallback id is numbered after the highest id in use, since the reviewer's ids may skip a
// number (#46, R1-3). A carried finding is never known by a Redline id, so a knownAs naming one is
// cleared; one naming an issue or a teammate's comment stays, and the finding's earlier thread is
// answered as already tracked (#46, R1-2).
function reconcilePrior(round, out) {
  const carryIds = new Set(carryList.map((p) => p.id))
  const carried = {}
  for (const f of out.findings) {
    if (!f.carriedFrom) {
      continue
    }
    const p = priorById[f.carriedFrom]
    if (!carryIds.has(f.carriedFrom) || carried[f.carriedFrom]) {
      warnings.push(`round ${round}: the reviewer marked ${f.id} as carried from ${f.carriedFrom}, which is ${p ? (carried[f.carriedFrom] ? `already carried as ${carried[f.carriedFrom]}` : `tracked (${p.disposition})`) : 'not an earlier finding'}; cleared`)
      f.carriedFrom = ''
      continue
    }
    carried[f.carriedFrom] = f.id
    if (/\bR\d+-\d+\b/.test(f.knownAs || '')) {
      warnings.push(`round ${round}: the reviewer marked ${f.id} as carried from ${f.carriedFrom} and as known by ${JSON.stringify(f.knownAs)}, which names a Redline finding; knownAs cleared, so it is carried`)
      f.knownAs = ''
    }
  }
  const resolved = []
  for (const r of out.resolved) {
    const id = typeof r.id === 'string' ? r.id.trim() : ''
    const p = priorById[id]
    if (!carryIds.has(id) || carried[id] || resolved.some((x) => x.id === id)) {
      warnings.push(`round ${round}: the reviewer resolved ${id || JSON.stringify(r.id)}, which is ${p ? (carried[id] ? `carried as ${carried[id]}` : resolved.some((x) => x.id === id) ? 'already resolved' : `tracked (${p.disposition})`) : 'not an earlier finding'}; ignored`)
      continue
    }
    resolved.push({ id, why: (r.why || '').trim() })
  }
  let next = lastFindingNumber(round, out.findings)
  for (const p of carryList) {
    if (carried[p.id] || resolved.some((x) => x.id === p.id)) {
      continue
    }
    const id = `R${round}-${++next}`
    warnings.push(`round ${round}: the reviewer did not account for ${p.id} (carried forward from round ${p.round}); carried as reported`)
    const body = (p.body || '').split('\n').slice(1).join('\n').trim()
    out.findings.push({
      id, file: p.file, line: p.line, side: 'RIGHT', category: p.category, severity: p.severity, confidence: 'unconfirmed', title: p.title,
      // Carried as reported, so nobody verified it at this head: the shaper's second look does.
      description: body || `See the Redline round ${p.round} review body.`, proposedFix: '', wouldConfirm: 'The verifier did not re-verify this carried finding; check it at this head.', outsideDiff: false, knownAs: '', carriedFrom: p.id, askRule: '',
    })
    carried[p.id] = id
  }
  out.carried = carried
  out.resolved = resolved
}

async function post(round, reviewed, range, specFolder, reviewOut, active, known, source) {
  const reviewFile = {
    path: `${specFolder}/redline/round-${round}-review.json`,
    content: json({
      body: reviewBody(round, reviewed, range, reviewOut, active, known, source),
      comments: active.map((f) => ({ path: f.file, line: f.line, side: f.side, body: commentBody(f) })),
    }),
  }
  // What the correctness-only scope declined is the record's, under its own key (#94, R1-10):
  // `/redline:redline-revise <pr> round <n>` reads `findings` only, so it never shapes those items,
  // as before #93. The run's record keeps them among its findings, so a later round still
  // collapses a repeat as settled.
  const scopedOut = reviewOut.scoped || []
  const findingsFile = {
    path: `${specFolder}/redline/round-${round}-findings.json`,
    content: json({ round, reviewed, range, summary: reviewOut.summary, findings: reviewOut.findings.filter((f) => !scopedOut.includes(f)), ...(scopedOut.length ? { scoped: scopedOut } : {}), ...(reviewOut.coverage ? { coverage: { ...reviewOut.coverage, list: reviewOut.coverageList } } : {}) }),
  }
  const posted = await run('post', postPrompt(round, specFolder, reviewFile, findingsFile), {
    agentType: 'redline:redline-github', ...modelOpts('github'), label: `post r${round}`, phase: 'Post', schema: POST_SCHEMA,
  })
  // The agent's `error` is not taken on trust in either direction (#34, R1-8). On a review that is
  // posted, has an id and accounts for every finding (inline or in movedToBody) it is a warning
  // and the run continues: the Losers League #778 shape, every finding moved plus an error string.
  // On anything else it still stops the run, so a post-review that exited after the POST, with no
  // thread ids back, is caught here.
  if (posted.error) {
    const review = posted.review && typeof posted.review === 'object' ? posted.review : null
    const accounted = review
      ? new Set([...(Array.isArray(review.comments) ? review.comments : []).map((c) => c.finding), ...(Array.isArray(review.movedToBody) ? review.movedToBody : [])])
      : new Set()
    const consistent = posted.posted === true && review !== null && Number(review.id) > 0 && active.every((f) => accounted.has(f.id))
    if (!consistent) {
      throw stageError('post', `posting the round ${round} review failed: ${posted.error}`)
    }
    warnings.push(`round ${round}: the GitHub agent reported an error for a review it posted; continuing: ${posted.error}`)
  }
  // A finding the script could not anchor sits in the review body behind its marker; a review
  // with no inline thread at all is degraded, not failed (Losers League #778 stopped here, #33).
  const moved = Array.isArray(posted.review.movedToBody) ? posted.review.movedToBody : []
  if (posted.posted && active.length && posted.review.comments.length === 0) {
    warnings.push(`round ${round}: no finding could be placed inline; every reply goes as an issue comment quoting its body marker`)
  } else if (moved.length) {
    warnings.push(`round ${round}: ${moved.join(', ')} could not be placed inline and sit in the review body behind their markers`)
  }
  const commentIds = {}
  for (const comment of posted.review.comments) {
    commentIds[comment.finding] = comment.id
  }
  return { posted, commentIds, files: [reviewFile.path, findingsFile.path] }
}

// The owner a shaper's decidedBy stands for: "reviewer" is the teammate whose review a human pass
// reads (the workflow owns the attribution, as it does for a person's decisions).
function shaperOwner(decidedBy, pass) {
  if (decidedBy === 'pending') {
    return ''
  }
  if (decidedBy === 'reviewer') {
    return pass.reviewer || REDLINE
  }
  return decidedBy || REDLINE
}

function outcomesFor(pass, inScope, shaped, deferred, roundDecisions, commits, forced, filing) {
  // What became of each deferral's draft (#95): filed (where it went), dropped by the person (their
  // answer), or held for the stop before the run finishes.
  const { filed = {}, dropped = {}, held = new Set() } = filing || {}
  const outcomes = {}
  const dispositions = Object.fromEntries(shaped.findings.map((f) => [f.id, f.disposition]))
  const owners = Object.fromEntries(shaped.findings.map((f) => [f.id, shaperOwner(f.decidedBy, pass)]))
  const recommendations = Object.fromEntries(shaped.findings.map((f) => [f.id, (f.recommendation || '').trim()]))
  const reasons = Object.fromEntries(shaped.findings.map((f) => [f.id, (f.reason || '').trim().replace(/\.$/, '')]))
  for (const f of inScope) {
    const named = commits.filter((c) => c.finding === f.id || mentions(c.message, f.id))
    const decision = roundDecisions[f.id]
    const deferredItem = deferred.find((d) => d.id === f.id)
    // What a deferral shipped is read off the round's commits, never off the words of its
    // mitigation (#100): it shipped one when a commit of its own landed, the one the implementer
    // reported for the finding or one whose subject opens with its id (#97, R3-5). A commit that
    // only names its id, the standards commit say, is not its mitigation (#95), so with no commit
    // of its own the item ships nothing: it is never called mitigated, never earns a final nit
    // pass, and its words are not posted. With one, every commit that names it is listed, as for
    // a fix. No commit is demanded of a deferral, so nothing here stops a round.
    const own = named.filter((c) => ownCommit(c, f.id))
    const shipsNothing = Boolean(deferredItem) && own.length === 0
    const shipped = shipsNothing ? [] : named
    const owner = owners[f.id] || REDLINE
    const left = (forced || {})[f.id]
    if (left) {
      // A finding a repository ask rule covers (#49): the person's, whatever was decided about it.
      // When the person deferred it (#126), its entry is among the round's deferrals, and the
      // outcome says what became of the drafted issue, as a deferral the person chose at any
      // call does: filed, dropped with their reason, or held for the end of the run.
      outcomes[f.id] = { kind: 'left', rule: left.rule, ...(left.own ? { own: true } : {}), reason: left.reason, notes: decision ? decisionSentence(decision, pass.human) : `No change made; ${pass.human ? 'the person' : personLabel} makes it.`, commits: [], decidedBy: decision ? decision.decidedBy || personLabel : personLabel, filed: (deferredItem && filed[f.id]) || null, dropped: Boolean(deferredItem && dropped[f.id]), dropNotes: ((deferredItem && dropped[f.id] && dropped[f.id].notes) || '').trim(), held: Boolean(deferredItem) && held.has(f.id) }
    } else if (decision) {
      // A deferral the person chose is their decision, and says where its drafted issue went, or
      // that they dropped it, with the drop's own reason (#97, R4-3), or that it waits for the end
      // of the run (#95).
      outcomes[f.id] = { kind: 'decided', choice: decision.choice, notes: decision.notes || '', commits: shipped, decidedBy: decision.decidedBy || personLabel, filed: (deferredItem && filed[f.id]) || null, dropped: Boolean(deferredItem && dropped[f.id]), dropNotes: ((deferredItem && dropped[f.id] && dropped[f.id].notes) || '').trim(), held: Boolean(deferredItem) && held.has(f.id) }
    } else if (dispositions[f.id] === 'defer' && deferredItem && dropped[f.id]) {
      // A draft the person dropped (#95): nothing is filed and nothing else changes, so a planned
      // mitigation still ships. It is their decision, posted with their reason.
      outcomes[f.id] = droppedOutcome(dropped[f.id], shipped)
    } else if (dispositions[f.id] === 'defer' && deferredItem) {
      outcomes[f.id] = { kind: 'deferred', commits: shipped, fullFix: deferredItem.fullFix, decidedBy: owner, filed: filed[f.id] || null, held: held.has(f.id) }
    } else if (dispositions[f.id] === 'decline') {
      // Redline's own decision not to act (#93): settled with its reason, and no commit is demanded.
      outcomes[f.id] = { kind: 'declined', reason: reasons[f.id], commits: named, decidedBy: REDLINE }
    } else if (dispositions[f.id] === 'none') {
      outcomes[f.id] = { kind: 'none', why: recommendations[f.id] || 'The comment asks for no change.', commits: named, decidedBy: REDLINE }
    } else if (named.length) {
      outcomes[f.id] = { kind: 'fixed', commits: named, decidedBy: owner }
    } else {
      outcomes[f.id] = { kind: 'not-changed', why: `Disposition ${dispositions[f.id] || 'unknown'}; no commit names it.`, commits: [], decidedBy: owner }
    }
  }
  return outcomes
}

// The outcome of a deferral Redline made whose draft the person dropped (#95): their decision,
// with their restated reason; the mitigation's commits, when one shipped, stay with it.
function droppedOutcome(answer, commits) {
  return { kind: 'decided', draftDropped: true, choice: 'drop', notes: answer.notes || `${personLabelStart} does not want this tracked.`, commits, decidedBy: personLabel }
}
// What an item whose draft waits for the end of the run says until then (#95): the round records
// it from the setting alone, so no answer given later can change what a later round is shown.
const HELD = `deferred; raised with ${personLabel} at the end of the run`
const HELD_SENTENCE = ` Its drafted issue is raised with ${personLabel} at the end of the run.`
// How a decision closes when it deferred something: where the draft went, that it was dropped, or
// that it is still to be raised. A drop gives its own reason before saying no issue was opened, as
// a drop of Redline's deferral does (#97, R4-3).
const draftClose = (outcome) => (outcome.filed ? deferredSentence(outcome.filed) : outcome.dropped ? ` ${outcome.dropNotes || `${personLabelStart} does not want this tracked.`} No issue was opened.` : outcome.held ? HELD_SENTENCE : '')

// `human` is a human-review pass, which keeps its own wording: "the author", and a decision's
// sentence alone. A Redline round names the person by login and says whether a decision was applied.
function describeOutcome(outcome, human) {
  const owner = decidedBy(outcome.decidedBy)
  switch (outcome.kind) {
    case 'fixed':
      return `fixed in ${andList(outcome.commits.map((c) => short(c.sha)))}${owner}`
    case 'deferred':
      // Where the item went (#95), then the mitigation's commits when one shipped. An item with
      // no filing yet is one the run has still to raise with the person.
      return `${outcome.filed ? deferredTo(outcome.filed) : outcome.held ? HELD : 'deferred'}${outcome.commits.length ? `; mitigated in ${andList(outcome.commits.map((c) => short(c.sha)))}` : ''}${owner}`
    case 'decided':
      if (outcome.draftDropped) {
        return `${decisionSentence(outcome, human)} No issue was opened.${outcome.commits.length ? ` Mitigated in ${andList(outcome.commits.map((c) => short(c.sha)))}.` : ''}${owner}`
      }
      return `${decisionSentence(outcome, human)}${human ? '' : outcome.commits && outcome.commits.length ? ` Applied in ${andList(outcome.commits.map((c) => short(c.sha)))}.` : ' No code change.'}${draftClose(outcome)}${owner}`
    case 'declined':
      return `declined: ${outcome.reason}${owner}`
    case 'left':
      return `left to ${human ? 'the author' : personLabel} under ${leftUnder(outcome)}: ${outcome.notes}${draftClose(outcome)}${owner}`
    case 'dropped':
      return `not acted on in this run: ${outcome.reason}${owner}`
    case 'none':
      return `no change requested: ${outcome.why}${owner}`
    default:
      return `not changed${owner}`
  }
}

// A human review pass sorts into fix, ask or none; a Redline round into fix, decline, defer or ask
// (#93). The
// shaper's JSON is checked here, so a value from the other kind of pass stops the run at shape
// rather than reaching a plan. It runs after the `spec status` call, so it names the shaper's
// label itself (#120, R1-3).
function checkDispositions(pass, shaped, shaperLabel) {
  // A decline (#93) is a Redline round's: it carries the reason a teammate reads and is Redline's own
  // decision, never a pending one. A human review pass has none, as it has no defer.
  const declined = shaped.findings.filter((f) => f.disposition === 'decline')
  if (pass.human && declined.length) {
    throw checkError('shape', `the shaper declined ${declined.map((f) => f.id).join(', ')}; in a human review pass a comment is fix, ask or none, never a decline of Redline's own, since what a teammate asked for is the author's to answer`, {}, shaperLabel)
  }
  // The other pass's values are read as the shaper wrote them, before the loop below rewrites a
  // decline's owner, so a decline marked reviewer stops here as a fix marked reviewer does (#94,
  // R5-7).
  const bad = pass.human
    ? shaped.findings.filter((f) => f.disposition === 'defer')
    : shaped.findings.filter((f) => f.disposition === 'none' || f.decidedBy === 'reviewer')
  if (bad.length) {
    const ids = bad.map((f) => f.id).join(', ')
    throw checkError('shape', pass.human
      ? `the shaper deferred ${ids}; in a human review pass a comment is fix, ask or none, never defer, since nothing a teammate asked for is deferred by Redline on its own`
      : `the shaper sorted ${ids} with a human review pass's values (none, or decidedBy reviewer) in a Redline round`, {}, shaperLabel)
  }
  for (const f of declined) {
    if (f.decidedBy !== 'redline') {
      warnings.push(`${pass.name}: the shaper marked the decline of ${f.id} as decided by ${f.decidedBy}; a decline is Redline's own`)
      f.decidedBy = 'redline'
    }
  }
  // A fix in a human pass is the teammate's instruction, whatever the shaper wrote as its owner.
  if (pass.human) {
    for (const f of shaped.findings) {
      if (f.disposition === 'fix' && f.decidedBy !== 'reviewer') {
        warnings.push(`${pass.name}: the shaper marked ${f.id} as decided by ${f.decidedBy}; a fix from ${pass.reviewer}'s comment is theirs`)
        f.decidedBy = 'reviewer'
      }
    }
  }
  // A deferred entry stands beside a finding the shaper deferred, and nothing else: one beside a
  // decline or a fix would be listed under Deferred as shipped with no mitigation planned, so it
  // is dropped with a warning (#94, R4-9).
  const deferredIds = new Set(shaped.findings.filter((f) => f.disposition === 'defer').map((f) => f.id))
  const stray = (shaped.deferred || []).filter((d) => !deferredIds.has(d.id))
  if (stray.length) {
    warnings.push(`${pass.name}: the shaper listed ${stray.map((d) => d.id).join(', ')} as deferred, but its disposition is not defer; the entry is dropped`)
    shaped.deferred = shaped.deferred.filter((d) => deferredIds.has(d.id))
  }
  // One entry per deferred finding (#97, R2-12): the first, with a warning.
  const once = firstPerId(shaped.deferred)
  if (once.repeated.length) {
    warnings.push(`${pass.name}: the shaper listed ${once.repeated.join(', ')} as deferred more than once; the first entry is kept`)
    shaped.deferred = once.kept
  }
}

// The second look (#93; #94, R7-5): a finding the verifier could not confirm carries the shaper's
// secondLook, and a decline whose second look refuted or confirmed the claim does not give
// "could not confirm" as its reason. Read before forceAskRules rewrites a disposition. A miss is a
// warning: a Redline round's shape stops only on the ask cases and a decline with no reason.
function checkSecondLook(pass, shaped, inScope) {
  if (pass.human) {
    return
  }
  const unconfirmed = new Set(inScope.filter((f) => f.confidence === 'unconfirmed').map((f) => f.id))
  const missing = shaped.findings.filter((s) => unconfirmed.has(s.id) && !s.secondLook).map((s) => s.id)
  if (missing.length) {
    warnings.push(`${pass.name}: the shaper gave no second look (secondLook) for ${missing.join(', ')}, which the verifier could not confirm`)
  }
  for (const s of shaped.findings) {
    if (s.disposition === 'decline' && s.secondLook && s.secondLook !== 'unconfirmed' && /^could not confirm/i.test((s.reason || '').trim())) {
      warnings.push(`${pass.name}: the shaper declined ${s.id} as could not confirm, but its second look says ${s.secondLook}`)
    }
  }
}

// Ask and call agree (#57): every ask has its judgment call and no other finding has one, as the
// shaper's rule 10 says; the script pins it, so a call can never stand in for a finding the shaper
// did not write as an ask. Runs before forceAskRules, which adds the one call the workflow writes,
// for a finding a repository ask rule covers; the reason a call gives is checkWhy's, after it. On a
// reshape, `known` is the round's calls so far: a call the round already decided may be left out
// or kept beside a re-sorted finding, since the reshape returns only the calls still pending or
// newly raised (#61, R1-2). It runs after the `spec status` call, so it names the shaper's label
// itself (#120, R1-3).
function checkCalls(shaped, known, shaperLabel) {
  const decided = (id) => known.some((c) => c.id === id)
  const noCall = shaped.findings.filter((f) => f.disposition === 'ask' && !decided(f.id) && !shaped.judgmentCalls.some((c) => c.id === f.id)).map((f) => f.id)
  if (noCall.length) {
    throw checkError('shape', `the shaper marked ${noCall.join(', ')} as ask but returned no judgment call for ${noCall.length === 1 ? 'it' : 'them'}`, {}, shaperLabel)
  }
  for (const call of shaped.judgmentCalls) {
    if (decided(call.id)) {
      continue
    }
    const f = shaped.findings.find((x) => x.id === call.id)
    if (!f || f.disposition !== 'ask') {
      throw checkError('shape', `the shaper returned a judgment call for ${call.id}, which it sorted as ${f ? f.disposition : 'nothing'}`, {}, shaperLabel)
    }
  }
}

// A Redline round asks in the cases of ROUND_WHY only, beside the repository ask rules (#93): a
// call for any other reason is one the shaper should have decided, so it stops here and never
// reaches the person. A human review pass keeps its own reasons. Runs after forceAskRules, which
// gives a call a repository rule covers the rule's reason, so that call is judged by the reason it
// will be asked with (#94, R1-13). `known` is checkCalls's: the round's calls so far on a reshape.
// It runs after the `spec status` call, so it names the shaper's label itself; `lastLabel` would
// name the spec check, and a resume would replay the refused output (#94, R2-9).
function checkWhy(pass, shaped, known, shaperLabel) {
  const decided = (id) => known.some((c) => c.id === id)
  if (!pass.human) {
    const outside = shaped.judgmentCalls.find((call) => !decided(call.id) && !ROUND_WHY.includes(call.why_human) && !askRules.some((rule) => call.why_human === `repository rule ${rule.id}`))
    if (outside) {
      throw checkError('shape', `the shaper asked about ${outside.id} because of ${JSON.stringify(outside.why_human)}, which is not one of the cases the person is asked in on a Redline round (${ROUND_WHY.join(', ')}, or a repository rule)`, {}, shaperLabel)
    }
  }
}

// What the round reads off a call's options (#105): each option's label and what it ends in, and
// the option the call recommends. The label is read without the blanks around it, here and where
// a decision names its option (optionOf), so the two can never disagree about a match.
const optionLabel = (option) => (option && typeof option.label === 'string' ? option.label.trim() : '')
const optionOf = (call, label) => (Array.isArray(call.options) ? call.options : []).find((option) => optionLabel(option) === String(label).trim()) || null
// Every option of a call still open has a label of its own and an end of the three, and the call
// recommends one of them by its label (#105). A decision names the option it picks by the label
// and takes the option's end as its disposition, and autopilot takes `recommended`, so a shared
// label, a missing end or a recommendation that names nothing would leave the round nothing to
// read: each stops here, the workflow's own check of what the shaper returned. The schema refuses
// a missing or an unknown end in the shaper's own run, and this is the second layer, as checkWhy
// is for a call's reason. Both passes; it runs after forceAskRules, so the one call the workflow
// writes is held to it too. `known` is checkCalls's: a call the round already decided is not
// held to the options a reshape restates, since its decision took its end when it was applied.
// Where an option's draft is read (#126): on an option that ends in defer, of a call for a
// finding left to the person (record.forced, which forceAskRules has just set). There it is the
// issue Redline files when the person picks the option, shown with the call before they decide,
// so one short of a field stops the round as a deferral without its draft does (checkDrafts). On
// any other option it is dropped with a warning: an ordinary call's deferral is drafted by the
// resolve agent after the decision, with its mitigation, as before. A call forceAskRules
// relabelled from a reason that does not mark a left call (neither redline's own file nor a
// repository rule, the two LEFT_CALL tells the shaper to draft for) was written as an ordinary
// call, so a defer option of it that carries no draft is not held to one, and a pick of it has the
// resolve agent write the draft, as a typed defer on a call that offered no draft does; a draft
// such an option does carry is the one filed on a pick, so it is held complete like any left
// call's, and a call the shaper wrote as left is held to its draft as before (#127, R1-4).
function checkOptions(pass, record, shaped, known, shaperLabel) {
  const decided = (id) => known.some((c) => c.id === id)
  for (const call of shaped.judgmentCalls.filter((c) => !decided(c.id))) {
    const options = Array.isArray(call.options) ? call.options : []
    const endless = options.filter((option) => optionLabel(option) === '' || !CALL_ENDS.includes(option.ends))
    if (endless.length) {
      throw checkError('shape', `the shaper gave ${call.id} an option with no label or with no end the workflow knows (${endless.map((option) => `${JSON.stringify(optionLabel(option))} ends in ${JSON.stringify(option && option.ends !== undefined ? option.ends : null)}`).join(', ')}); every option of a judgment call carries a label and states what it ends in, fix, defer or accept`, {}, shaperLabel)
    }
    const names = options.map(optionLabel)
    const repeated = unique(names.filter((name, i) => names.indexOf(name) !== i))
    if (repeated.length) {
      throw checkError('shape', `the shaper gave ${call.id} more than one option labelled ${repeated.map((name) => JSON.stringify(name)).join(', ')}; a decision names the option it picks by its label, so each label names one option`, {}, shaperLabel)
    }
    const recommended = typeof call.recommended === 'string' ? call.recommended.trim() : ''
    if (!names.includes(recommended)) {
      throw checkError('shape', `the shaper recommended ${JSON.stringify(recommended)} for ${call.id}, which is the label of none of its options (${names.join(', ')}); recommended names the option the shaper recommends by its label`, {}, shaperLabel)
    }
    const left = Boolean((record.forced || {})[call.id])
    const relabelled = left && Boolean(record.forced[call.id].relabelled)
    const undrafted = left ? options.filter((option) => option.ends === 'defer' && (!relabelled || option.draft !== undefined) && draftMissing(option.draft).length) : []
    if (undrafted.length) {
      throw checkError('shape', `the shaper gave ${call.id}, a call for a finding left to the person, an option that ends in defer with no complete drafted issue (${undrafted.map((option) => `${JSON.stringify(optionLabel(option))}: missing ${draftMissing(option.draft).join(', ')}`).join('; ')}); the person is shown the draft before deciding, and Redline files it when they pick the option`, {}, shaperLabel)
    }
    for (const option of options) {
      if (option.draft !== undefined && !(left && option.ends === 'defer')) {
        warnings.push(`${pass.name}: the shaper gave ${call.id}'s option ${JSON.stringify(optionLabel(option))} a drafted issue, which is read only on an option that ends in defer of a call for a finding left to the person; the draft is dropped`)
        delete option.draft
      }
    }
  }
}

// Instance or class (#75): every fix the shaper sorted itself, in a Redline round, says where
// its cause lives and what the fix makes of it, and the workflow reads four things it can check.
// The cause is there and whole: a path, one of the three outcomes, a reason. The path is inside
// the repository, read as every path is (repoPath). A one-place fix changes the place it names:
// `where` is among the files of the finding's task. A sweep says what it covered: `swept` lists
// at least one member, each measured as holds or fixed, the two values that mean closed once the
// task lands, so a member left exposed is no sweep. And a finding the verifier links to an
// earlier one that was fixed (a link honourLinks kept) is never fixed as one more instance,
// whatever an earlier round decided. Each is the workflow's own check of what the shaper
// returned. Whether the cause is where the shaper says, whether an instance is truly one, and
// whether a sweep was measured by running and is complete are the plan approver's to judge.
// It runs after forceAskRules and the path cleanup: a finding a rule leaves to the person is an
// ask by then, and the files are in one form. On a reshape it skips the round's decided
// findings, as checkDrafts does: their fix is the resolve agent's plan of the person's decision,
// which is asked no cause. A human review pass has no such step.
function checkCauses(pass, shaped, inScope, shaperLabel, decided = []) {
  if (pass.human) {
    return
  }
  const text = (value) => (typeof value === 'string' ? value.trim() : '')
  for (const s of shaped.findings.filter((x) => x.disposition === 'fix' && !decided.includes(x.id))) {
    const cause = s.cause && typeof s.cause === 'object' && !Array.isArray(s.cause) ? s.cause : null
    const missing = !cause
      ? ['no cause']
      : [text(cause.where) === '' && 'no where', !CAUSE_OUTCOMES.includes(cause.outcome) && (cause.outcome === undefined ? 'no outcome' : `outcome ${JSON.stringify(cause.outcome)}`), text(cause.why) === '' && 'no why'].filter(Boolean)
    if (missing.length) {
      throw checkError('shape', `the shaper returned the fix for ${s.id} with no cause it can be read from (${missing.join(', ')}); a fix says where its cause lives (where, a path in the repository), what the fix makes of it (outcome: one-place, sweep or instance) and why, in one sentence`, {}, shaperLabel)
    }
    const where = repoPath(cause.where)
    if (where.outside || where.path === '') {
      throw checkError('shape', `the shaper said the cause of ${s.id} lives at ${JSON.stringify(cause.where)}, which is no path inside the repository; where names the file or folder the cause lives in`, {}, shaperLabel)
    }
    const files = Array.isArray(s.files) ? s.files : []
    if (cause.outcome === 'one-place' && !files.includes(where.path)) {
      throw checkError('shape', `the shaper called the fix for ${s.id} one-place, made where the cause lives, but its task's files (${files.join(', ') || 'none'}) do not include ${where.path}; a one-place fix changes the place the cause lives in`, {}, shaperLabel)
    }
    if (cause.outcome === 'sweep') {
      const swept = Array.isArray(cause.swept) ? cause.swept : []
      const unusable = swept.length === 0
        ? ['no swept list']
        : swept.filter((entry) => !entry || text(entry.member) === '' || !SWEPT_FOUND.includes(entry.found)).map((entry) => (entry && text(entry.member) !== '' ? `${JSON.stringify(text(entry.member))} found ${JSON.stringify(entry.found === undefined ? null : entry.found)}` : 'an entry with no member'))
      if (unusable.length) {
        throw checkError('shape', `the shaper called the fix for ${s.id} a sweep and returned no usable list of what the sweep covered (${unusable.join(', ')}); a sweep lists every member it measured in swept, each as member and found, holds or fixed`, {}, shaperLabel)
      }
    }
    const links = linked(inScope.find((f) => f.id === s.id) || {})
    if (cause.outcome === 'instance' && links.length) {
      throw checkError('shape', `the shaper returned an instance fix for ${s.id}, which the verifier links to ${andList(links)}, fixed earlier, as one class; a cause fixed once and found again is a class until shown otherwise, so its fix closes the class (one-place, or a sweep) or the finding is deferred or asked about`, {}, shaperLabel)
    }
  }
}

// A decline carries the reason a teammate reads in the thread (#93). Runs after forceAskRules, as
// checkWhy does, so a decline a repository rule turns into an ask, which needs no reason, never
// stops the round (#94, R1-13, R5-6); it runs after the `spec status` call, so it names the
// shaper's label itself (#94, R2-9).
function checkDeclineReasons(pass, shaped, shaperLabel) {
  const noReason = shaped.findings.filter((f) => f.disposition === 'decline' && (typeof f.reason !== 'string' || f.reason.trim() === '')).map((f) => f.id)
  if (noReason.length) {
    throw checkError('shape', `the shaper declined ${noReason.join(', ')} with no reason; a decline carries the reason a teammate reads in the thread`, {}, shaperLabel)
  }
  // A decline never points at follow-up work (#95): an item worth doing somewhere is a defer, with
  // a drafted issue. A warning, since a Redline round's shape stops only on what the run cannot
  // use; the plan approver bounces such a decline. A reason that says what would confirm a claim
  // may name a later test, so `could not confirm` is left alone.
  for (const f of shaped.findings) {
    const reason = f.disposition === 'decline' ? f.reason.trim() : ''
    const points = /^could not confirm/i.test(reason) ? null : FOLLOW_UP.exec(reason)
    if (points) {
      warnings.push(`${pass.name}: the shaper declined ${f.id} with a reason that points at follow-up work (${JSON.stringify(points[0])}); an item worth doing elsewhere is a defer`)
    }
  }
}
// The words a decline's reason uses when it points at work to be done elsewhere. A spec named "the
// ... follow-up spec" is one a decline may cite, so the word before "spec" is no pointer (#97, R4-5).
// The rule's own three (another pull request, an issue, a later change) are read as the decline
// rule names them (#97, R4-6); reading free text for a rule more widely is #100's subject.
const FOLLOW_UP = /\bfollow[- ]?up\b(?!\s+spec)|\b(?:another|a separate|a new|a later)\s+(?:pull request|PR|issue|change)\b|\bseparate (?:issue|pull request|PR)\b|\bin an issue\b|\bbelongs elsewhere\b/i

// A deferred finding carries its drafted issue (#95): a title, what was found, why it is not fixed
// here and the fix proposed. One without is a result the run cannot use, as a decline with no
// reason is. Runs after forceAskRules, which turns a rule-covered deferral into an ask and drops
// its entry, and names the shaper's label itself, since the spec check ran after the shaper. On a
// reshape it skips the round's decided findings (`decided`): a deferral the person or autopilot
// made carries the resolve agent's draft, which resolveWith checked, and the decision stands
// whatever the reshape lists, so a restatement is not held to a draft of its own (#97, R3-4).
function checkDrafts(shaped, shaperLabel, decided = []) {
  for (const f of shaped.findings.filter((s) => s.disposition === 'defer' && !decided.includes(s.id))) {
    const missing = draftMissing(shaped.deferred.find((d) => d.id === f.id))
    if (missing.length) {
      throw checkError('shape', `the shaper deferred ${f.id} with no drafted issue (missing ${missing.join(', ')}); a deferred item always carries one`, {}, shaperLabel)
    }
  }
}

// The spec check (#57): the shaper's JSON can be valid while the folder behind it is not (PR #54
// round 2: a halted shaper returned every finding as an ask with no shape.md, and the person was
// handed eight placeholder calls). The GitHub agent's read-only spec-status operation lists the
// four files and the Decisions heading, and the script decides. A missing plan.md, shape.md or
// Decisions section is a shape-stage error that names the shaper, so a resume reruns it with the
// sentence resumeLine gives that step (#117); it carries no ownCheck, since a file can be missing
// because a Write was refused, which a person fixes (#116). The check's own failure keeps its own
// label, so a resume reruns the check. A missing standards.md or references.md is a warning.
async function checkSpec(pass, specFolder, shaperLabel, suffix) {
  const status = await run('shape', specStatusPrompt(pass, specFolder), {
    agentType: 'redline:redline-github', ...modelOpts('github'), label: `spec status ${pass.tag}${suffix}`, phase: 'Shape', schema: SPEC_STATUS_SCHEMA,
  })
  if (status.error) {
    throw stageError('shape', `checking the ${pass.name} spec folder failed: ${status.error}`)
  }
  const listed = (list) => (Array.isArray(list) ? list : []).map((path) => String(path).trim())
  const has = (name) => listed(status.files).includes(`${specFolder}/${name}`)
  const missing = []
  if (!has('plan.md')) {
    missing.push('no plan.md')
  }
  if (!has('shape.md')) {
    missing.push('no shape.md')
  } else if (!listed(status.headings).includes(`${specFolder}/shape.md`)) {
    missing.push('no "## Decisions" section in shape.md')
  }
  if (missing.length) {
    throw stageError('shape', `the shaper wrote no usable spec in ${specFolder}: ${missing.join(', ')}`, { specFolder, missing }, shaperLabel)
  }
  for (const name of ['standards.md', 'references.md']) {
    if (!has(name)) {
      warnings.push(`${pass.name}: the shaper wrote no ${name} in ${specFolder}`)
    }
  }
}

// The forcing point (#49): after shaping, whatever fix, decline, defer or ask the shaper returned, a finding
// a repository ask rule covers is an ask to the person. A paths rule is matched on the finding's file
// and on the files the shaper's task would touch; a prose rule is the shaper's own askRule tag. The
// finding becomes ask and pending, loses its deferred entry, gets a judgment call when the shaper
// gave none, and is recorded under record.forced for the replies, the handoff and the thread sweep.
// The drafted issue of an entry it loses is kept when it is complete (#126), as the option of
// that call that ends in defer, so the person can still send the item to an issue.
// A human pass's none, a comment that asks for nothing, is left as it is: there is no change to
// leave to the person (#52, R1-4). Deterministic from args and the shaper's JSON, so a relaunch
// replays it. The numeric limits of #25 force here too, when they come. A finding on one of
// Redline's own files, a Redline round's ask whose call gives `redline's own file`, is recorded the
// same way, marked `own` (#94, R8-4).
const BY_HAND = 'Make the change by hand after the run'
const ACCEPT_AS_IS = 'Accept, no change'
const DEFER_TO_ISSUE = 'Defer to an issue'
function forceAskRules(record, pass, inScope, shaped) {
  record.forced = record.forced || {}
  for (const f of inScope) {
    const s = shaped.findings.find((x) => x.id === f.id)
    if (!s) {
      continue
    }
    // A human pass's none is a comment that asks for nothing: it makes no change, so there is
    // nothing to leave to the person, and it keeps its "no change requested" reply (#52, R1-4).
    if (s.disposition === 'none') {
      continue
    }
    const files = Array.isArray(s.files) ? s.files : []
    const tagged = typeof s.askRule === 'string' && s.askRule.trim() !== '' ? s.askRule.trim() : ''
    const rule = ruleForPaths([f.file || ''].concat(files)) || (tagged && ruleById[tagged]) || null
    if (!rule) {
      if (tagged) {
        warnings.push(`${pass.name}: the shaper tagged ${f.id} with ask rule ${JSON.stringify(tagged)}, which .claude/redline.json does not declare; ignored`)
      }
      // A finding on one of Redline's own files (#94, R8-4) is recorded as a rule-covered one is,
      // so it is left to the person on every dial. The entry its call was decided on stands, as a
      // rule's does (#94, R7-7); one a reshape no longer asks about this way is dropped while undecided.
      const ownCall = !pass.human && s.disposition === 'ask' ? shaped.judgmentCalls.find((c) => c.id === f.id && c.why_human === OWN_FILE) : null
      if (ownCall && !(decisions[f.id] && record.forced[f.id])) {
        record.forced[f.id] = { rule: OWN_FILE, own: true, reason: OWN_FILE_REASON, recommendation: ownCall.recommendation }
      } else if (!ownCall && !decisions[f.id] && record.forced[f.id] && record.forced[f.id].own) {
        delete record.forced[f.id]
      }
      continue
    }
    if (s.disposition !== 'ask') {
      warnings.push(`${pass.name}: the shaper sorted ${f.id} as ${s.disposition}; repository rule ${rule.id} makes it an ask for the person`)
    }
    const recommendation = (s.recommendation || '').trim().replace(/\.$/, '')
    // What the shaper would have declined is still the person's under the rule (#93): the call
    // says so and recommends no change, with the shaper's reason when it gave one; a decline with
    // none reaches here, since the reason check runs after this function (#94, R5-6).
    const wasDecline = s.disposition === 'decline'
    const declineReason = wasDecline ? (s.reason || '').trim().replace(/\.$/, '') : ''
    const wouldDecline = wasDecline ? `Redline would have declined it${declineReason ? `: ${declineReason}` : ''}.` : ''
    // What the shaper deferred with its drafted issue is still worth tracking under the rule
    // (#126): the draft is kept, as the call's option that ends in defer, where until #126 it
    // was thrown away with the entry and the person was offered the change by hand or nothing.
    // Only a complete draft is kept: one short of a field would stop the round below for an
    // option the shaper never wrote. Its mitigation is not: no task writes under the rule.
    const shaperEntry = s.disposition === 'defer' ? shaped.deferred.find((d) => d.id === f.id) : null
    const kept = shaperEntry && draftMissing(shaperEntry).length === 0 ? Object.fromEntries(DRAFT_FIELDS.map((key) => [key, shaperEntry[key]])) : null
    s.disposition = 'ask'
    s.decidedBy = 'pending'
    s.askRule = rule.id
    shaped.deferred = shaped.deferred.filter((d) => d.id !== f.id)
    const why = `repository rule ${rule.id}`
    let call = shaped.judgmentCalls.find((c) => c.id === f.id)
    let relabelled = false
    if (!call) {
      call = {
        id: f.id,
        title: f.title,
        story: `Repository rule ${rule.id}: ${rule.reason}. ${(f.description || '').trim()}`,
        why_human: why,
        // Each option states its end, and the call names the recommended one, as the shaper's
        // own calls do (#105): the change by hand ends in a fix, the person's and outside the
        // run, and accepting ends in no change. No task writes anything for either (resolveWith).
        options: [
          { label: BY_HAND, cost: 'The change, made outside Redline', effect: wouldDecline || (recommendation ? `What Redline would have done: ${recommendation}.` : 'The finding is settled by the person.'), ends: 'fix' },
          { label: ACCEPT_AS_IS, cost: 'None', effect: 'The finding stands as reported.', ends: 'accept' },
          ...(kept ? [{ label: DEFER_TO_ISSUE, cost: 'None in this pull request', effect: `Redline files the drafted issue, "${draftTitle(kept.title)}"; the change stays to be made outside the run.`, ends: 'defer', draft: kept }] : []),
        ],
        recommended: kept ? DEFER_TO_ISSUE : wasDecline ? ACCEPT_AS_IS : BY_HAND,
        recommendation: kept ? `${DEFER_TO_ISSUE}: ${draftTitle(kept.title)}.` : wasDecline ? `Accept, no change${declineReason ? `: ${declineReason}` : ''}.` : recommendation ? `By hand: ${recommendation}.` : 'Make the change by hand after the run.',
        dependsOn: [],
      }
      shaped.judgmentCalls.push(call)
    } else {
      // A call the shaper wrote as an ordinary one, for a reason that does not mark a left call
      // (neither Redline's own file nor any repository rule, the two LEFT_CALL tells it to draft
      // for), is relabelled (#127, R1-4): it keeps the options the shaper wrote, so checkOptions
      // does not hold a defer option of it that carries no draft to one, and the run says so once.
      const old = call.why_human
      relabelled = old !== OWN_FILE && !(typeof old === 'string' && old.startsWith('repository rule '))
      if (relabelled) {
        warnings.push(`${pass.name}: the shaper asked about ${f.id} because of ${JSON.stringify(old)}; repository rule ${rule.id} leaves it to the person, and its call keeps the options the shaper wrote`)
      }
      call.why_human = why
    }
    // A decline the rule overrides is recorded with what Redline would have done, for the
    // autopilot's Deferred entry, which has no change left open (#94, R5-8). Once the finding's
    // call is decided, the entry it was decided on stands: a reshape returns the finding as an ask
    // with no call, and an entry rebuilt from that would drop what Redline would have declined
    // (#94, R7-7).
    if (!(decisions[f.id] && record.forced[f.id])) {
      record.forced[f.id] = { rule: rule.id, reason: rule.reason, recommendation: call.recommendation, ...(wouldDecline ? { declined: wouldDecline } : {}), ...(relabelled ? { relabelled: true } : {}) }
    }
  }
}

// review dial: the findings the person dropped after the round 1 review get a reply each, a
// line in the handoff comment, and an outcome the later reviewers see as settled.
function droppedReplies(record) {
  const dropped = record.dropped || []
  if (record.droppedRecorded || !dropped.length) {
    return []
  }
  record.droppedRecorded = true
  record.outcomes = record.outcomes || {}
  const outcomes = {}
  const entries = dropped.map((f) => {
    const outcome = { kind: 'dropped', reason: f.reason, commits: [], decidedBy: personLabel }
    outcomes[f.id] = outcome
    record.outcomes[f.id] = describeOutcome(outcome)
    record.outcomeKinds = Object.assign(record.outcomeKinds || {}, { [f.id]: 'dropped' })
    decidedAll.push({ id: f.id, round: record.round, title: f.title, outcome: describeOutcome(outcome), decidedBy: personLabel, choice: 'drop', notes: f.reason, kind: 'dropped', reason: '', overruled: false })
    return replyEntry(passOf(record), f, outcome, record.commentIds[f.id] || 0, record.reviewPosted)
  })
  return entries.concat(carriedReplies(passOf(record), record, dropped, outcomes))
}

// The earlier findings this round's review found gone (#35): each earlier thread hears it once.
function resolvedReplies(record) {
  const resolved = record.resolvedPrior || []
  if (record.resolvedRecorded || !resolved.length) {
    return []
  }
  record.resolvedRecorded = true
  const pass = passOf(record)
  return resolved
    .filter((r) => priorById[r.id])
    .map((r) => priorReplyEntry(pass, priorById[r.id], `resolved; first reported as ${r.id} in Redline round ${priorById[r.id].round}. ${r.why}${decidedBy(REDLINE)}`, record.reviewPosted))
}

// The earlier findings this round carried that an issue or a teammate's comment already tracks
// (#46, R1-2): the finding stays known and is not shaped, and its earlier thread hears once where
// it went, so the next run reads it as carried.
function knownCarriedReplies(record) {
  if (record.knownCarriedRecorded) {
    return []
  }
  const pass = passOf(record)
  const entries = record.findings
    .filter((f) => f.knownAs && f.carriedFrom && priorById[f.carriedFrom])
    .map((f) => priorReplyEntry(pass, priorById[f.carriedFrom], `carried forward as ${f.id}; already tracked in ${f.knownAs}${decidedBy(REDLINE)}`, record.reviewPosted))
  if (entries.length) {
    record.knownCarriedRecorded = true
  }
  return entries
}

// File a pass's deferred drafts and keep where each went on the pass's record (#95). `drafts` is
// [{item, f, title}]: the deferred entry, its finding, and a title the person gave or ''. One
// GitHub-agent call, which a round with nothing to file never makes. The mode is the run's: an
// issue when the setting is github and the run posts, else the draft's path alone. The number is
// the agent's relay of what the script printed; the path is the workflow's own, so no posted line
// depends on how an agent spelled it. The caller names the phase: the round's own filing is part
// of Push and reply, the end-of-run filing part of Finish (#97, R1-11).
async function fileDeferred(pass, record, drafts, phaseName) {
  const mode = deferTo === 'github' && postToGitHub ? 'issue' : 'draft'
  const recordFile = abs(pass.deferredFile)
  const entries = drafts.map(({ item, f, title }) => {
    const file = abs(pass.issueFile(item.id))
    return { finding: item.id, mode, file, command: `${GH} defer ${mode} ${item.id} ${file} ${recordFile}`, content: issueDraft(pass, f, item, title) }
  })
  const out = await run('defer', deferPrompt(pass, record.specFolder, entries), {
    agentType: 'redline:redline-github', ...modelOpts('github'), label: `file deferred ${pass.tag}`, phase: phaseName, schema: DEFER_SCHEMA,
  })
  if (out.error) {
    throw stageError('defer', `filing the deferred drafts failed in ${pass.name}: ${out.error}`)
  }
  record.filed = record.filed || {}
  const unfiled = []
  for (const entry of entries) {
    const got = (out.deferred || []).find((d) => d.finding === entry.finding)
    // An issue the record already held stands whatever the mode; a draft answers only a draft.
    const issue = got && got.where === 'issue' && Number.isInteger(got.number) && got.number > 0
    if (!issue && !(got && got.where === 'draft' && mode === 'draft')) {
      unfiled.push(entry.finding)
      continue
    }
    record.filed[entry.finding] = { where: got.where, number: issue ? got.number : 0, url: issue ? got.url || '' : '', path: pass.issueFile(entry.finding) }
  }
  if (unfiled.length) {
    throw stageError('defer', `the GitHub agent returned no filing for ${unfiled.join(', ')} in ${pass.name}`)
  }
  record.files = unique(record.files.concat(entries.map((entry) => entry.file.slice(repoRoot.length + 1)), [pass.deferredFile]))
  return record.filed
}

// A deferred item as the result and the handoff carry it (#95): the finding, whether a mitigation
// shipped (`ships`: its outcome holds a commit of the finding's own, #100, which the session's
// closing summary reads, never the emptiness of the words; #103, R2-7), its mitigation (the words
// as written when one shipped: for a deferral the person or autopilot decided, as its resolve
// wrote them, whatever a reshape made of its task; #114, R1-7) and full fix, its draft as filed
// (for the session's closing summary, which prints it when the setting is print), where it went,
// and its outcome as posted.
function deferredEntry(pass, record, d, filedTo, outcome) {
  const ships = Boolean(outcome && Array.isArray(outcome.commits) && outcome.commits.length)
  return {
    id: d.item.id, round: record.round, title: d.f.title, file: d.f.file, line: d.f.line, specFolder: record.specFolder, commentId: record.commentIds[d.item.id] || 0,
    ships, mitigation: ships ? d.item.mitigation : '', fullFix: d.item.fullFix,
    draft: draftParts(issueDraft(pass, d.f, d.item, d.title || '')),
    ...filedTo,
    outcome: describeOutcome(outcome, pass.human),
  }
}

// A draft as a stop shows it to the person (#95): the finding, what ships in the round (`ships`,
// with the words and the planned files), where the draft goes, the title and body as they will
// be filed, and its version, which the answer names. `canFix` says whether turning it back into
// a fix can still be built in this round: only at the stop no resolve of the round has run before.
function draftView(record, d, canFix) {
  const parts = draftParts(record.drafts[d.item.id].text)
  // What ships is the round's record, never the words (#100): at a round's stop, before the
  // build, a task planned with files; at the end-of-run stop, where the draft carries its
  // round's outcome, a commit of the finding's own. `files` is the planned task's paths at both.
  // The words are shown only beside a mitigation that ships. They are the entry's, which for a
  // deferral the person or autopilot decided is the one its resolve returned, since a reshape's
  // entry for it is dropped (#97, R3-6): after a reshape that changed its task, `files` is the
  // task as reshaped and the words are the decision's as planned (#106; #114, R1-7).
  const files = Array.isArray(d.files) ? d.files : []
  const ships = d.outcome ? d.outcome.commits.length > 0 : files.length > 0
  return {
    id: d.item.id, round: record.round, finding: compactFinding(d.f), ships, mitigation: ships ? d.item.mitigation : '', files,
    goesTo: postToGitHub ? deferTo : 'spec', dryRun: !postToGitHub, title: parts.title, body: parts.body, draft: d.version, canFix,
  }
}

// The drafts the rounds held for the end of the run (#95), each with its round's record.
const heldDrafts = () => rounds.flatMap((record) => (record.held || []).map((d) => ({ record, d })))

// The end-of-run stop (#95): with the setting at the end of the run, no round stops for a draft,
// and the run stops once here, before anything of Finish runs, with every draft the person has
// not answered. No agent is called for it, so every prompt before it replays on the relaunch.
// A fix can no longer be built: the rounds are over.
function heldStop() {
  const open = heldDrafts().filter(({ d }) => !draftAnswered(d.item.id, d.version))
  if (!open.length) {
    return null
  }
  const last = rounds[rounds.length - 1]
  log(`${open.length} deferred draft(s) held for the end of the run; the run ends here and resumes on relaunch`)
  return result('handoff', {
    handoffKind: 'deferred',
    handoffRound: last.round,
    specFolder: last.specFolder,
    judgmentCalls: [],
    drafts: open.map(({ record, d }) => draftView(record, d, false)),
    draftsNeeded: open.map(({ d }) => d.item.id),
    declined: [],
    declinedAfterRun: [],
    unresolved: [],
    overridesUnresolved: [],
    decisionsNeeded: [],
  })
}
// Thrown where a run would finish while held drafts are unanswered: the loop returns the stop.
function stopForHeld() {
  const stop = heldStop()
  if (stop) {
    throw Object.assign(new Error('deferred drafts are held for the person'), { handoffResult: stop })
  }
}

// After the person answered the end-of-run stop (#95): each round that held drafts files the ones
// that go ahead, then posts the replies its deferred items waited for, and each item's outcome,
// kind and decided entry are completed from its answer, so a dropped draft is counted and listed
// as the person's decision and a filed one says where it went. The reply ids are kept on the
// round's own record, which is where the thread sweep reads them.
async function settleHeld() {
  for (const record of rounds) {
    const held = record.held || []
    if (!held.length) {
      continue
    }
    const pass = passOf(record)
    const toFile = held.filter((d) => deferrals[d.item.id].action !== 'drop').map((d) => ({ ...d, title: deferrals[d.item.id].title }))
    const filed = toFile.length ? await fileDeferred(pass, record, toFile, 'Finish') : {}
    const outcomes = {}
    for (const d of held) {
      const id = d.item.id
      const answer = deferrals[id]
      const outcome = answer.action !== 'drop'
        ? { ...d.outcome, held: false, filed: filed[id] }
        : d.outcome.kind === 'decided' || d.outcome.kind === 'left' ? { ...d.outcome, held: false, dropped: true, dropNotes: (answer.notes || '').trim() } : droppedOutcome(answer, d.outcome.commits)
      outcomes[id] = outcome
      const text = describeOutcome(outcome, pass.human)
      record.outcomes[id] = text
      record.outcomeKinds[id] = outcome.kind
      const entry = decidedAll.find((x) => x.id === id && x.round === record.round)
      if (entry) {
        Object.assign(entry, { outcome: text, decidedBy: outcome.decidedBy, choice: outcome.choice || '', notes: outcome.notes || '', kind: outcome.kind, overruled: entry.overruled || (outcome.kind === 'decided' && Boolean(outcome.draftDropped || outcome.dropped)) })
      }
      if (outcome.filed) {
        deferredAll.push(deferredEntry(pass, record, toFile.find((x) => x.item.id === id), filed[id], outcome))
      }
    }
    const findings = held.map((d) => d.f)
    const replies = findings.map((f) => replyEntry(pass, f, outcomes[f.id], record.commentIds[f.id] || 0, record.reviewPosted)).concat(carriedReplies(pass, record, findings, outcomes))
    // Step 1's reason for not pushing (#97, R1-12): the round pushed what it committed, or push is
    // off for the run, which these replies must not contradict.
    const why = push ? 'the round pushed its commits when it ended; these are the replies its deferred items waited for' : 'push is off for this run; these are the replies its deferred items waited for'
    const pushed = await run('push-and-reply', pushReplyPrompt(pass, record.specFolder, replies, false, why), {
      agentType: 'redline:redline-github', ...modelOpts('github'), label: `deferred replies ${pass.tag}`, phase: 'Finish', schema: PUSH_REPLY_SCHEMA,
    })
    if (pushed.error) {
      throw stageError('push-and-reply', `the deferred items' replies failed in ${pass.name}: ${pushed.error}`)
    }
    record.files.push(...replies.map((reply) => reply.file.slice(repoRoot.length + 1)))
    keepReplyIds(record, pushed)
    record.held = []
  }
}

// A first round that ends without a revise pass (nothing selected on the review dial, or no
// finding at all): the drops, the resolved earlier findings and a carried finding an issue tracks
// still get their replies.
async function replyStandalone(record) {
  const replies = droppedReplies(record).concat(resolvedReplies(record), knownCarriedReplies(record))
  if (!replies.length) {
    return
  }
  phase('Push and reply')
  const pass = passOf(record)
  const pushed = await run('push-and-reply', pushReplyPrompt(pass, record.specFolder, replies, false), {
    agentType: 'redline:redline-github', ...modelOpts('github'), label: `push and reply ${pass.tag}`, phase: 'Push and reply', schema: PUSH_REPLY_SCHEMA,
  })
  if (pushed.error) {
    throw stageError('push-and-reply', `replies failed in round ${record.round}: ${pushed.error}`)
  }
  record.files.push(...replies.map((reply) => reply.file.slice(repoRoot.length + 1)))
  keepReplyIds(record, pushed)
}

// The reply ids the GitHub agent reports, kept per finding: Finish's sweep names a thread by the
// inline comment and the reply Redline posted in it (#39). A reply that posted nothing is 0 and
// is not kept.
function keepReplyIds(record, pushed) {
  record.replyIds = record.replyIds || {}
  for (const reply of pushed.replies || []) {
    if (reply.reply_id > 0) {
      for (const id of reply.findings || [reply.finding]) {
        record.replyIds[id] = reply.reply_id
      }
    }
  }
}

// prefix is what the warnings beside the call use: 'baseline', or the pass's name.
// A result the Bash tool could not show (spilled) is asked for once more as checks.sh --verdict
// (#68), so a gate that passed is not stopped by the size of what it printed. The verdict is the
// script's own, read from the result it kept for that run: it carries every check's exit and the
// git block, and no check's output. A verdict that reads as a gate result replaces the spilled
// one, with a warning; anything else (a checks.sh from before template v3, HEAD moved since the
// run, a verdict the tool could not show either) leaves the spilled result, with what the verdict
// call said under verdictError, and the run stops as it did. Either way a stop after this names
// the check's label, never the verdict's: a resume must run the gate again.
async function checker(flag, snapshot, octane, label, prefix) {
  const opts = { agentType: 'redline:redline-checker', ...modelOpts('checker'), phase: 'Check', schema: CHECKER_SCHEMA, stallMs: checkerStallMs }
  const out = await run('check', checkerPrompt(flag, snapshot, octane, label), { ...opts, label })
  const read = readStructure(out)
  if (read.warning) {
    warnings.push(`${prefix}: ${read.warning}`)
  }
  if (read.out.status !== 'result_unreadable' || read.out.reason !== 'spilled') {
    return read.out
  }
  // The verdict is asked on the check's behalf, so the check's label is handed back whatever the
  // call does, its own stop included: run() builds that stop from the verdict's label, and a
  // resume must run the gate again (#68; #94, R6-10).
  let asked
  try {
    asked = await run('check', verdictPrompt(flag, snapshot, resume[label] ? resume[label].attempt : 0), { ...opts, label: `${label} verdict` })
  } catch (error) {
    error.label = label
    throw error
  } finally {
    lastLabel = label
  }
  // A structural misread of the verdict is overridden as the check call's is, and says so (#94, R7-8).
  const readVerdict = readStructure(asked)
  if (readVerdict.warning) {
    warnings.push(`${prefix} verdict: ${readVerdict.warning}`)
  }
  const verdict = readVerdict.out
  if (verdict.status === 'read' && gateShaped(verdict.result)) {
    warnings.push(`${prefix}: checks.sh's result was too large for the Bash tool to show, so the workflow read the verdict checks.sh kept for that run (checks.sh --verdict), which carries no check's output`)
    return { ...verdict, viaVerdict: true }
  }
  const said = verdict.error ? `: ${verdict.error.slice(0, 300)}` : ''
  return { ...read.out, verdictError: verdict.status === 'read' ? `checks.sh --verdict exited ${verdict.exit}${said}` : `checks.sh --verdict could not be read either (${verdict.reason})${said}` }
}

// The checks on the shaper's output, after the shape and after each reshape, in one order (#94,
// R8-5): the spec folder it reports, the folder itself (the spec check), a disposition for every
// finding (the reshape prompt asks for every finding, as the shape prompt does), then the checks
// of the result, forceAskRules among them, each finding's files read one way (#114, R4-4), and
// the round's dispositions. The spec check runs before the checks of the result (#120, R1-3): its
// stop carries no ownCheck, since a file can be missing because a Write was refused, which a
// person fixes, so an attempt that both left a file out and returned a result a check refuses
// stops there and the skill says to fix the cause first. Until R1-3 the result checks ran first,
// and such an attempt was marked as needing no hand fix. The check of the folder, though,
// sees a refused Write only where it leaves a file missing, as at a round's first shape: at a
// reshape the four files are already on disk, so a reshape whose Writes were all refused passes
// it, and a check of its result or the hold after it still sets ownCheck (#120, R2-5, deferred:
// telling a refused Write from a rerun that rightly changed no file needs a check of its own).
// The order costs a relaunch in one case. The spec-status call's own failure keeps that call's
// label (checkSpec, #57), so its resume replays the shaper's result unchanged, and a result one
// of the checks below refuses then stops the relaunch again, at the shaper, with nothing to fix
// by hand. It needs a failed status call and a refused result in one attempt, the checks after
// the spec check had it before R1-3, and giving the status failure the shaper's label would
// undo #57's rule that the check's own failure reruns the check, so it is accepted (#120, R3-6).
// Every check after the spec check names the shaper's label itself, since lastLabel would name
// the spec-status call (#94, R2-9).
// `known` is the round's calls so far, [] on the shape; `label` names the shaper call for the
// checks that stop on it, and `suffix` its spec-status call. `decided` is the ids of the round's
// decided findings, [] on the shape, which the draft check skips (#97, R3-4).
async function vetShape(pass, record, inScope, shaped, known, label, suffix, decided = []) {
  if (shaped.specFolder.replace(/\/+$/, '') !== record.specFolder) {
    warnings.push(`${pass.name}: shaper reported spec folder ${shaped.specFolder}, expected ${record.specFolder}`)
  }
  await checkSpec(pass, record.specFolder, label, suffix)
  const unsorted = inScope.filter((f) => !shaped.findings.some((s) => s.id === f.id)).map((f) => f.id)
  if (unsorted.length) {
    throw checkError('shape', `the shaper gave no disposition for ${unsorted.join(', ')}`, {}, label)
  }
  checkDispositions(pass, shaped, label)
  checkSecondLook(pass, shaped, inScope)
  checkCalls(shaped, known, label)
  forceAskRules(record, pass, inScope, shaped)
  // Each finding's files are read through the one path function here, where the shape is taken
  // in, so every reader after this point sees one form: the shaper's own list for its deferral
  // (shaperFiles), the list shown for a finding nobody decided (effectiveDispositions), a stop's
  // dispositions and the reshape's update of a decided list (#114, R4-4). It comes after the
  // paths rules, which read whether a path was written as a directory from the text as written.
  // Until R4-4 only a decided finding's list was cleaned, so a deferral the shaper listed with
  // [''] was shown as shipping a planned change. A finding with no list keeps none.
  for (const s of shaped.findings) {
    if (Array.isArray(s.files)) {
      s.files = cleanPaths(s.files)
    }
  }
  checkDeclineReasons(pass, shaped, label)
  checkDrafts(shaped, label, decided)
  checkWhy(pass, shaped, known, label)
  checkOptions(pass, record, shaped, known, label)
  checkCauses(pass, shaped, inScope, label, decided)
  record.dispositions = shaped.findings
}

// One revise pass for a round: Shape, hand-off, Resolve, Approve, Implement, Check, Push and reply.
async function revise(record, inScope, reviewedKind) {
  const { round, specFolder } = record
  const pass = passOf(record)

  phase('Shape')
  let shaped = await run('shape', pass.human ? humanShapePrompt(pass, record, inScope) : shapePrompt(round, specFolder, reviewedKind, inScope, record.prBody), {
    agentType: 'redline:redline-shaper', ...modelOpts('revise'), label: `shape ${pass.tag}`, phase: 'Shape', schema: pass.human ? SHAPE_SCHEMAS.human : SHAPE_SCHEMAS.round,
  })
  await vetShape(pass, record, inScope, shaped, [], `shape ${pass.tag}`, '')

  // The interrupt dial. Decisions enter only after the shaper, so its result replays from cache
  // on the relaunch whatever the dial says.
  //
  // plan: the person sees every disposition before anything is planned further. The run ends
  // here each round until the relaunch carries this pass's key in args.approvedPlans, with any ask
  // answered and any disposition changed under args.decisions.
  //
  // The round's drafted issues (#95). On every dial but autopilot a deferral's draft is raised
  // with the person before it is filed: in the round, at the stops below, when the setting is
  // each round (and in a human review pass at either setting, whose threads take one reply per
  // pass, so nothing of it can wait); once, before the run finishes, when the setting is the end
  // of the run, where the round holds the draft and its reply (holdsDrafts).
  const raisesDrafts = interrupt !== 'autopilot' && (deferAt === 'round' || pass.human)
  const holdsDrafts = interrupt !== 'autopilot' && !raisesDrafts
  // Each draft has a version, counted over the draft as the shaper or the resolve agent wrote it,
  // never over a title the person gave, so the count depends on no answer: 1 when first seen, one
  // more each time a reshape or the resolve agent changes it. An answer names the version it saw,
  // so a draft that changed after it was answered is raised once more, and every body is shown
  // before anything is filed.
  record.drafts = record.drafts || {}
  // The files the shaper listed for its own deferral (#100): its planned task's paths, cleaned
  // where the shape was taken in (vetShape; #114, R4-4).
  const shaperFiles = (id) => {
    const s = shaped.findings.find((x) => x.id === id && x.disposition === 'defer')
    return s && Array.isArray(s.files) ? s.files.slice() : []
  }
  // Each draft carries the files of the task planned for it, which the stop shows (#100):
  // plannedFiles once the round's decisions are in, the shaper's own list at the stops before them.
  // Every call passes its reader, since plannedFiles is declared after the first stop (#103, R1-8).
  const draftsOf = (list, filesOf) => list.map((item) => ({ item, f: inScope.find((finding) => finding.id === item.id) })).filter((d) => d.f).map((d) => {
    const text = issueDraft(pass, d.f, d.item, '')
    const seen = record.drafts[d.item.id]
    if (!seen || seen.text !== text) {
      record.drafts[d.item.id] = { text, version: seen ? seen.version + 1 : 1 }
    }
    return { ...d, version: record.drafts[d.item.id].version, files: filesOf(d.item.id) }
  })
  const openDrafts = (drafts) => (raisesDrafts ? drafts.filter((d) => !draftAnswered(d.item.id, d.version)) : [])
  // What the shaper deferred. A disposition the person changed at a stop replaces the draft that
  // stop showed, so that one is not asked about here: the round's resolve applies the change, and
  // a deferral it drafts is raised after it.
  const shaperDrafts = draftsOf(shaped.deferred.filter((d) => shaped.findings.some((s) => s.id === d.id && s.disposition === 'defer')), shaperFiles)
    .filter((d) => !(decisions[d.item.id] && decisions[d.item.id].disposition))
  if (interrupt === 'plan' && !approvedPlans.includes(pass.planKey)) {
    const pendingCalls = shaped.judgmentCalls.filter((call) => !decisions[call.id])
    return { handoff: true, kind: 'plan', pending: pendingCalls, calls: shaped.judgmentCalls, shaped, drafts: openDrafts(shaperDrafts) }
  }

  // Judgment calls still open: autopilot takes the shaper's recommendation for each and goes on;
  // every other level ends the run for the person (plan included, when an ask was left unanswered).
  let calls = shaped.judgmentCalls
  const settle = (open) => {
    if (!open.length) {
      return false
    }
    if (interrupt === 'autopilot') {
      for (const call of open) {
        // A finding a repository ask rule covers is left to the person, never applied (#49).
        const forced = record.forced[call.id]
        decisions[call.id] = forced ? leftDecision(forced, pass.human) : autopilotDecision(call)
        log(`${pass.name}: autopilot ${forced ? `left ${call.id} to the person (${leftUnder(forced)})` :`decided ${call.id} (${decisions[call.id].choice})`}`)
      }
      return false
    }
    return true
  }
  // The round's one stop after shaping (#95): its open calls and its drafts not yet answered are
  // raised together, so a round with both stops once, and a round with only deferred items stops
  // too. Nothing is planned or built yet, so a draft the person turns back into a fix here is a
  // disposition override like any other, built in this round.
  const openCalls = calls.filter((call) => !decisions[call.id])
  const stopForCalls = settle(openCalls)
  const firstDrafts = openDrafts(shaperDrafts)
  if (stopForCalls || firstDrafts.length) {
    return { handoff: true, kind: 'decisions', pending: stopForCalls ? openCalls : [], calls, shaped, drafts: firstDrafts }
  }

  // A decision on a finding that was not a judgment call is a disposition override from the plan
  // dial: the person changed fix/defer/ask to fix, defer or accept after seeing the list.
  const overridesFor = (known) => inScope.filter((f) => decisions[f.id] && decisions[f.id].disposition && !known.some((call) => call.id === f.id))
  let overrides = overridesFor(calls)
  // Whether a decided finding is a disposition override, read from the round's own overrides as
  // they entered (#114, R2-5), never from `calls`: a reshape that returns a call for an override's
  // finding adds it to `calls` (raised, below), so membership there named the override as a
  // call's decision in the resolve's warnings and stops and in the hold after each reshape.
  const isOverride = (id) => overrides.some((f) => f.id === id)
  let roundDecisions = {}
  // A disposition the person changed away from defer (to fix or accept) leaves no deferral behind:
  // the shaper's entry would be listed under Deferred as shipped and handed to the plan approver
  // and the implementer (#94, R5-9).
  const awayFromDefer = (id) => Boolean(roundDecisions[id] && roundDecisions[id].disposition && roundDecisions[id].disposition !== 'defer')
  let deferred = shaped.deferred.slice()
  let resolved = null
  // The files of each decided finding's task, by finding id, as last planned (#106). The resolve
  // that first applies a decision sets its list, from its own tasks, and each reshape replaces
  // it: a reshape that raises a call runs a resolve for that call alone and `resolved` becomes
  // it, so an earlier decision keeps the list its own resolve or a later reshape gave it (#97,
  // R2-14), an override a reshape returns as a call included, which that resolve applies again
  // (#114, R3-4). Until #106 the round kept every resolve's tasks and read a decided finding's
  // files from them alone.
  const decidedFiles = {}
  // Each list a reshape changed, by finding id: the list as its resolve planned it, then as each
  // reshape that changed it left it. A finding no reshape touched has no entry.
  const reshapedTasks = {}
  // A finding whose task the round reads from that list: one the person or autopilot decided and
  // that no repository rule leaves to the person, whose task has no files by rule (#49).
  const tracked = (id) => Boolean(roundDecisions[id]) && !record.forced[id]
  // What each call's decision ends in, by finding id, as the round's resolves stated it (#99):
  // fix, defer or accept. It is how a call's answer shows a deferral, and what the check demands
  // of a call. Until #99 the resolve agent's own deferred entry showed one (#97, R1-10). A
  // reshape never changes it, since the person's decision stays whatever disposition or entry a
  // reshape gives its finding (#94, R8-6).
  const stated = {}
  // What a decided finding's decision ends in (#99; #108, R1-5): its own disposition when it
  // names one, an override's or a call's, and else what the resolve agent stated for the call.
  // The hold after each reshape reads it, and the reshape prompt names it beside each decided
  // finding, so the reshape is told which task the hold expects (#114, R1-3).
  const endsIn = (id) => roundDecisions[id].disposition || stated[id]
  // A finding left to the person whose decision ends in a deferral (#126), however it came to be
  // left: a call for it that the person deferred, by a pick or a typed defer, or a call they
  // had answered with a deferral, named or stated, before a reshape put its finding under a
  // rule. It is the one end of a left finding the round acts on: its drafted issue is raised,
  // filed and posted like any deferral's, and still nothing is planned, built or demanded for it.
  const leftDeferred = (id) => Boolean(record.forced[id]) && Boolean(roundDecisions[id]) && endsIn(id) === 'defer'
  const resolveWith = async (newCalls, newOverrides, suffix) => {
    // The ids this resolve applies: its calls and its overrides.
    const applied = newCalls.map((call) => call.id).concat(newOverrides.map((f) => f.id))
    for (const id of applied) {
      const decision = withOwner(decisions[id])
      // A finding a repository ask rule covers stays the person's whatever the decision says: a
      // disposition on it (fix, defer) is not applied, and the rule travels with the decision so
      // the resolve agent writes it as left to the person (#49).
      const forced = record.forced[id]
      // A decision that names an option of its call picked it (#105): the person's pick as the
      // skill recorded it, or autopilot's take of the recommended one. The run's copy of the
      // decision takes the option's end as its disposition, the path a decision that names its
      // own already travels: no statement is asked of the resolve agent for it (asked, below),
      // and the three checks of a named disposition hold this resolve's tasks and entries to
      // it. So what a pick ends in was stated by the shaper before anyone decided, and never
      // by the agent that applies it. The copy alone carries it: args.decisions is never
      // written, and intake refuses a pick that names a disposition of its own. An option that
      // names none of its call's options is the person's own words after all: it is dropped
      // from the copy with a warning, and the resolve agent states what the decision ends in.
      // On a finding left to the person no end is kept, as none is for a disposition typed for
      // one: no task writes anything whatever the answer, and the option rides along for the
      // record.
      const call = newCalls.find((c) => c.id === id)
      if (call && decision.option !== undefined) {
        const option = optionOf(call, decision.option)
        if (!option) {
          warnings.push(`${pass.name}: the decision for ${id} names the option ${JSON.stringify(decision.option)}, which is the label of none of its call's options (${(Array.isArray(call.options) ? call.options : []).map(optionLabel).join(', ')}); it is read as an answer in the person's own words, and the resolve agent states what it ends in`)
          delete decision.option
        } else if (!forced || option.ends === 'defer') {
          decision.disposition = option.ends
        }
      }
      // Of what a left finding's decision ends in, one thing is kept: that it is a deferral
      // (#126), by a pick of an option that ends in defer or by a defer typed for the finding.
      // The person may defer what is theirs to change, and Redline then files the drafted
      // issue; a fix or an accept changes nothing Redline does, so a typed one is dropped with
      // its warning, as before, and a picked one was never set.
      if (forced) {
        if (decision.disposition && decision.disposition !== 'defer') {
          warnings.push(`${pass.name}: ${id} is left to the person under ${leftUnder(forced)}; the disposition ${JSON.stringify(decision.disposition)} is not applied`)
          delete decision.disposition
        }
        decision.rule = forced.rule
        if (forced.own) {
          decision.own = true
        }
      }
      roundDecisions[id] = decision
    }
    deferred = deferred.filter((d) => !awayFromDefer(d.id))
    const out = await run('resolve', resolvePrompt(pass, specFolder, newCalls, roundDecisions, newOverrides), {
      agentType: 'redline:redline-resolve', ...modelOpts('revise'), label: `resolve ${pass.tag}${suffix}`, phase: 'Resolve', schema: RESOLVE_SCHEMA,
    })
    if (out.unresolved.length) {
      const ids = out.unresolved.map((item) => item.id)
      // An override is the person's line, not a call, so one the resolve agent could not apply is
      // handed back on its own, with the agent's why, for the person to restate: otherwise the stop
      // has nothing to ask and every relaunch replays the same refusal (#94, R4-8).
      const stuck = newOverrides.filter((f) => ids.includes(f.id)).map((f) => f.id)
      if (interrupt === 'autopilot') {
        const recommended = ids.filter((id) => !stuck.includes(id))
        const what = [recommended.length ? `the shaper's recommendation for ${recommended.join(', ')}` : '', stuck.length ? `the person's disposition override for ${stuck.join(', ')}` : ''].filter(Boolean).join(' or ')
        throw stageError('resolve', `autopilot could not apply ${what}`, { unresolved: out.unresolved })
      }
      return { handoff: true, kind: 'decisions', pending: newCalls.filter((call) => ids.includes(call.id)), overridesUnresolved: out.unresolved.filter((item) => stuck.includes(item.id)), calls, unresolved: out.unresolved, shaped, afterApproval: suffix !== '' }
    }
    // What each call's decision ends in is the resolve agent's to state (#99), one statement a
    // call: the first it returned, and a value outside the three is no statement. A list that is
    // absent reads as empty: a resolve with no call keeps the prompt it had before #99, so a
    // result recorded before it can replay here, and nothing is needed from it. Every call this
    // resolve applied needs its statement, since nothing else says what its decision ends in, and
    // one without stops the round here, where a resume reruns the agent. A decision that names
    // its own disposition decides as an override's does (#103, R1-11), and a call left to the
    // person under a rule has no disposition to read, so neither is asked for one. A decision
    // that names its own disposition is checked below by what it names (#108, R1-5).
    // The first statement is picked before its value is read, so a first one outside the three
    // leaves the call with no statement, a valid second beside it included (#108, R3-3).
    const firstStated = firstPerId(out.decided || [])
    const statements = { kept: firstStated.kept.filter((item) => CALL_ENDS.includes(item.disposition)), repeated: firstStated.repeated }
    if (statements.repeated.length) {
      warnings.push(`${pass.name}: the resolve agent stated a disposition for ${statements.repeated.join(', ')} more than once; the first is kept`)
    }
    const asked = newCalls.filter((call) => !record.forced[call.id] && !roundDecisions[call.id].disposition)
    const unstated = asked.filter((call) => !statements.kept.some((item) => item.id === call.id)).map((call) => call.id)
    if (unstated.length) {
      throw checkError('resolve', `the resolve agent stated no disposition for ${unstated.join(', ')}, a judgment call it applied; a call's decision is read from what it states (fix, defer or accept)`)
    }
    for (const call of asked) {
      stated[call.id] = statements.kept.find((item) => item.id === call.id).disposition
    }
    // The resolve agent's entry for a decision it planned replaces an earlier one for the same id,
    // in place, so a deferral the person restated with their own mitigation is the one planned and
    // posted (#94, R5-9). A finding a repository ask rule covers keeps none (#49).
    // A left finding the person deferred keeps its entry too (#126). Its draft is the one the
    // person was shown: the picked option's, or, for a defer typed for the finding, the draft of
    // the call's one option that carries one. That draft is the entry, with no mitigation, since
    // no task writes anything for a left finding, and an entry the resolve agent returns for it
    // that differs is dropped with a warning. Only when the call offered no draft to take does
    // the agent's own entry stand, held to its fields below like any deferral's. An entry for a
    // left finding nobody deferred is dropped without one, as before (#109).
    const optionDraft = {}
    for (const id of applied.filter((x) => record.forced[x] && roundDecisions[x].disposition === 'defer')) {
      const call = newCalls.find((c) => c.id === id)
      const options = call && Array.isArray(call.options) ? call.options : []
      const drafted = options.filter((option) => option && option.draft)
      const picked = call && roundDecisions[id].option !== undefined ? optionOf(call, roundDecisions[id].option) : null
      const source = picked || (roundDecisions[id].option === undefined && drafted.length === 1 ? drafted[0] : null)
      if (source && source.draft) {
        optionDraft[id] = { id, mitigation: '', ...Object.fromEntries(DRAFT_FIELDS.map((key) => [key, source.draft[key]])) }
      }
    }
    const returned = out.deferred.filter((item) => !record.forced[item.id] || leftDeferred(item.id))
    const rewritten = unique(returned.filter((item) => optionDraft[item.id] && DRAFT_FIELDS.some((key) => String(item[key] === undefined ? '' : item[key]).trim() !== String(optionDraft[item.id][key]).trim())).map((item) => item.id))
    for (const id of rewritten) {
      warnings.push(`${pass.name}: the resolve agent returned a drafted issue for ${id} that differs from the one its call's option carries; the option's is filed, since the person was shown it before deciding`)
    }
    const once = firstPerId(returned.map((item) => optionDraft[item.id] || item).concat(Object.values(optionDraft).filter((entry) => !returned.some((item) => item.id === entry.id))))
    if (once.repeated.length) {
      warnings.push(`${pass.name}: the resolve agent listed ${once.repeated.join(', ')} as deferred more than once; the first entry is kept`)
    }
    // An override to fix or accept leaves no deferral behind (awayFromDefer), whatever entry the
    // resolve agent returns beside it (#103, R2-8): the entry is dropped with a warning before the
    // round's list takes it, so the plan approver and the implementer are never shown one, and no
    // draft check stops the round for it.
    // An override is a finding whose disposition the person changed, from whatever the shaper
    // sorted it to (a decline overruled to a fix included), and a call whose decision names its
    // own fix or accept was never a deferral either: each warning says whose decision it is and
    // what it names (#108, R2-3, R3-5). Whether a decision is a call's or an override's is read
    // one way for the stray warnings, the named-check stops and the hold after each reshape
    // (#108, R3-6): from the round's own overrides (isOverride), never from `calls`, which a
    // reshape's call for an override's finding joins (#114, R2-5).
    const isCall = (id) => !isOverride(id)
    const strayOverride = once.kept.filter((item) => awayFromDefer(item.id)).map((item) => item.id)
    const strayNamed = strayOverride.filter(isCall)
    const strayChanged = strayOverride.filter((id) => !strayNamed.includes(id))
    for (const id of strayChanged) {
      warnings.push(`${pass.name}: the resolve agent listed ${id} as deferred, a finding whose disposition the person changed to ${roundDecisions[id].disposition}; the entry is dropped, since the decision stands`)
    }
    for (const id of strayNamed) {
      warnings.push(`${pass.name}: the resolve agent listed ${id} as deferred, a call whose decision names it as ${roundDecisions[id].disposition}; the entry is dropped, since the decision stands`)
    }
    // A call whose decision is stated as a fix or as accepted leaves none behind either (#99),
    // on any dial: its entry is dropped the same way, before the round's list takes it, so no
    // draft is raised or filed for it and the fix is still demanded. Until #99 a filled entry
    // beside a call's fix was read as a "Mitigate" answer and filed (#97, R2-15). An entry for a
    // call an earlier resolve of the round stated is dropped as well.
    const strayCall = once.kept.filter((item) => Boolean(stated[item.id]) && stated[item.id] !== 'defer')
    for (const item of strayCall) {
      warnings.push(`${pass.name}: the resolve agent listed ${item.id} as deferred and stated its decision as ${stated[item.id]}; the entry is dropped, since the statement decides`)
    }
    const fresh = once.kept.filter((item) => !awayFromDefer(item.id) && !strayCall.includes(item))
    // A deferral the resolve agent planned carries its drafted issue, as the shaper's does (#95).
    const undrafted = fresh.filter((item) => draftMissing(item).length)
    if (undrafted.length) {
      throw checkError('resolve', `the resolve agent deferred ${undrafted.map((item) => item.id).join(', ')} with no drafted issue (${DRAFT_FIELDS.join(', ')}); a deferred item always carries one`)
    }
    // A decision that names its own disposition, an override or a call whose decision carries
    // one, is checked by what it names, as a stated call is by its statement (#108, R1-5); a
    // finding left to the person under a rule names none (its disposition was deleted above).
    // Until #108 only a defer override was checked, by its entry.
    const named = applied.filter((id) => roundDecisions[id].disposition && (!record.forced[id] || roundDecisions[id].disposition === 'defer'))
    const namedAs = (disposition) => named.filter((id) => roundDecisions[id].disposition === disposition)
    const whose = (id) => (isCall(id) ? 'its decision' : 'a disposition override')
    // A deferral the person chose comes back with its entry (#97, R2-13): one the resolve agent
    // left out would be neither drafted nor filed, and its reply would close the person's
    // deferral with no issue and no warning. An entry the round already holds for it (the
    // shaper's own deferral) stands in, as it does when the resolve returns none.
    const unentered = namedAs('defer').filter((id) => !fresh.some((item) => item.id === id) && !deferred.some((d) => d.id === id))
    if (unentered.length) {
      throw checkError('resolve', `the resolve agent returned no deferred entry for ${unentered.map((id) => `${id}, which ${whose(id)} deferred`).join('; ')}; a deferred item always carries a drafted issue`)
    }
    // What a call's decision is stated to end in is checked against what this same resolve
    // returned, its entries and its tasks, before anything is built, filed or posted (#99): a
    // statement they cannot support is never trusted on its own, and it stops the round here,
    // where a resume reruns the agent. A deferral comes back with its deferred entry, as an
    // override's does above: with none there is no draft to file, and its reply would close the
    // person's deferral with no issue. A fix has a task with files: with none the plan approver
    // lists no path for it, so the build could not write it, and the stop that followed would
    // resume at the build, which cannot replan. An accept has no task with files: the workflow
    // cannot take one out of plan.md, and the implementer builds the plan as written. An entry
    // short of a draft field stopped above, and an entry beside a fix or an accept was dropped.
    const taskFiles = (id) => taskFilesOf(out.tasks, id)
    const statedAs = (disposition) => asked.filter((call) => stated[call.id] === disposition).map((call) => call.id)
    const undeferred = statedAs('defer').filter((id) => !fresh.some((item) => item.id === id))
    if (undeferred.length) {
      throw checkError('resolve', `the resolve agent stated defer for ${undeferred.join(', ')} with no deferred entry; a deferred item always carries a drafted issue`)
    }
    const unplanned = statedAs('fix').filter((id) => taskFiles(id).length === 0)
    if (unplanned.length) {
      throw checkError('resolve', `the resolve agent stated fix for ${unplanned.join(', ')} with no task with files; a fix names the files it changes`)
    }
    const planned = statedAs('accept').filter((id) => taskFiles(id).length > 0)
    if (planned.length) {
      throw checkError('resolve', `the resolve agent stated accept beside a task with files for ${planned.map((id) => `${id} (${taskFiles(id).join(', ')})`).join(', ')}; an accepted finding changes nothing`)
    }
    // A decision that names a fix or an accept is held to its tasks the same way (#108, R1-5):
    // until #108 a named fix with no task with files stopped at the check after a repair, which
    // resumes at the build and cannot replan, and a named accept beside a task with files was built.
    // A resolve that applies a decision again, an override a reshape returned as a call (raised),
    // is not held to a task for the fix (#114, R4-5): the round reads that finding's task from
    // its list, which this resolve does not set (R3-4, below) and which the hold after the
    // reshape has just checked, so a task this resolve did not restate is no fault. Until R4-5
    // it stopped the round here for a task the list held. The accept is still held to what this
    // resolve returned: a task with files written for an accepted finding is this resolve's own
    // contradiction, and it stops here, where a resume reruns the agent, before a plan approver
    // pass. So after the first resolve two checks hold a decision to its task, each on its own
    // source: the hold after a reshape reads the list, and this one reads this resolve's tasks.
    const namedUnplanned = namedAs('fix').filter((id) => !(id in decidedFiles) && taskFiles(id).length === 0)
    if (namedUnplanned.length) {
      throw checkError('resolve', `the resolve agent planned no task with files for ${namedUnplanned.map((id) => `${id}, which ${whose(id)} names as a fix`).join('; ')}; a fix names the files it changes`)
    }
    const namedPlanned = namedAs('accept').filter((id) => taskFiles(id).length > 0)
    if (namedPlanned.length) {
      throw checkError('resolve', `the resolve agent planned a task with files for ${namedPlanned.map((id) => `${id} (${taskFiles(id).join(', ')}), which ${whose(id)} names as accepted`).join('; ')}; an accepted finding changes nothing`)
    }
    // Only an id with no list yet takes this resolve's tasks (#114, R3-4): an override a reshape
    // returned as a call is applied again by the resolve that call sets off (raised), and its
    // tasks alone replaced the list its first resolve set and the reshape kept, so a task it did
    // not restate was shown as none and one it moved was shown with no warning. The named-fix
    // check above leaves such an id out for the same reason (R4-5).
    for (const id of applied.filter((x) => !(x in decidedFiles))) {
      decidedFiles[id] = taskFiles(id)
    }
    deferred = deferred.map((d) => fresh.find((item) => item.id === d.id) || d).concat(fresh.filter((item) => !deferred.some((d) => d.id === item.id)))
    return out
  }
  // Dispositions after the overrides: what the plan approver and the implementer are shown, what
  // the implementer builds and the replies report. A finding the person or autopilot decided
  // carries the files of the task the round planned for it (plannedFiles, below), the list the
  // workflow reads, never the shaper's list for the finding's old disposition (#103, R1-2, R2-11).
  // Until #106 only one shown as a deferral did, and a decided fix was shown the shaper's list
  // from before the decision: a decline overruled to a fix was shown no files beside its task.
  // Every other finding keeps the shaper's, one left to the person under a rule included: it is
  // shown as the shaper returned it, an ask, whatever its decision names, a deferral the person
  // chose for it too (#126), whose drafted issue stands beside it in the deferred list. A call
  // answered by picking an option is shown by the option's end, which its decision carries
  // (#105); one answered in the person's own words is still shown as the shaper sorted it, or
  // as a reshape re-sorted it (#115). Its first call comes after plannedFiles is declared.
  const effectiveDispositions = () => shaped.findings.map((f) => {
    const decision = roundDecisions[f.id]
    const shown = decision && decision.disposition && !record.forced[f.id] ? { ...f, disposition: decision.disposition } : f
    return tracked(f.id) ? { ...shown, files: plannedFiles(f.id) } : shown
  })
  // The files of the task the round planned for a finding, none when it planned no task (#100).
  // A finding the person or autopilot decided is read from the round's own list of its task
  // (decidedFiles, #106), whatever the shaper listed for it before the decision, so the stops,
  // the prompts and the warnings read one fact one way (#103, R3-6). isDeferral read this list
  // too until #99, which reads a call's decision from what the resolve agent states and no longer
  // from whether a task is planned. One nobody decided is read from the shaper's own list for its
  // deferral (#97, R2-6): a finding's `files` are the paths its task touches (the shaper's
  // schema), so a deferral listed with files has a task whatever its mitigation says, and
  // shaperFiles reads only a finding the shaper deferred, so no other test of the list is needed
  // (#103, R2-9). Nothing is demanded of the gate for a deferral: no deferral's commit is (#100).
  const plannedFiles = (id) => (tracked(id) ? (decidedFiles[id] || []).slice() : shaperFiles(id))
  // The round's deferrals as they stand (#95): an entry whose finding is deferred, by the shaper
  // or by the person's override. A finding the person or autopilot decided is a deferral only
  // when the decision made it one (#97, R1-10): a defer override, and no other override whatever
  // entry stands beside it (#103, R1-11), or a call whose decision the resolve agent stated as a
  // deferral (#99). Until #99 a call was read from the entry itself, as a deferral when its
  // mitigation field was filled or the finding had no planned task with files, so a fix beside
  // a stray filled entry was filed as the person's deferral, and a deferral in empty words
  // beside a planned task was demanded as a fix. A reshape's disposition or entry never makes a
  // decided finding one (#94, R8-6). A decline or a fix beside a leftover entry is none (#94,
  // R4-9). A finding left to the person under a rule is one only when its decision ends in a
  // deferral (leftDeferred, #126): until #126 it never was, so a rule call the person answered
  // "defer it" filed nothing, and a deferral the person had approved was silently not filed
  // once a reshape put its finding under a rule.
  const isDeferral = (d) => {
    if (record.forced[d.id]) {
      return leftDeferred(d.id)
    }
    const decision = roundDecisions[d.id]
    if (decision) {
      // An override names its disposition, and that decides (#103, R1-11): an override to fix or
      // accept leaves no deferral behind (awayFromDefer), whatever entry the resolve agent returns
      // beside it, and so does a call whose decision names one (#108, R1-2). A call's decision that
      // names no disposition is read from what the resolve agent stated for it (#99), never from
      // the entry or the task beside it: resolveWith checked the statement against both when the
      // resolve returned.
      if (decision.disposition) {
        return decision.disposition === 'defer'
      }
      return stated[d.id] === 'defer'
    }
    return effectiveDispositions().some((s) => s.id === d.id && s.disposition === 'defer')
  }
  // A stop for drafts once the round's first resolve has run. It takes no disposition override
  // and lists no declines, as a stop after a plan approver does (afterApproval; #94, R3-7): an
  // override is applied by that first resolve, whose prompt comes before this stop.
  const draftStop = () => {
    const open = openDrafts(draftsOf(deferred.filter(isDeferral), plannedFiles))
    return open.length ? { handoff: true, kind: 'decisions', pending: [], calls, shaped, drafts: open, afterApproval: true } : null
  }
  if (calls.length || overrides.length) {
    phase('Resolve')
    resolved = await resolveWith(calls, overrides, '')
    if (resolved.handoff) {
      return resolved
    }
    // A deferral the person chose at the stop is drafted by the resolve agent, after the stop, so
    // its draft is raised before it is filed.
    const drafted = draftStop()
    if (drafted) {
      return drafted
    }
  }

  // Approve: plan and standards in parallel; a bounced plan goes back to the shaper.
  phase('Approve')
  let plan = null
  let standards = null
  for (let adjustment = 0; ; adjustment++) {
    const suffix = adjustment ? ` #${adjustment + 1}` : ''
    const approvals = await parallel([
      () => run('approve', planPrompt(pass, specFolder, inScope, { findings: effectiveDispositions(), deferred }, roundDecisions, adjustment, approvedPaths), {
        agentType: 'redline:redline-plan-approver', ...modelOpts('planApprover'), label: `plan approver ${pass.tag}${suffix}`, phase: 'Approve', schema: PLAN_SCHEMA,
      }),
      () => run('approve', standardsPrompt(pass, specFolder), {
        agentType: 'redline:redline-standards-approver', ...modelOpts('standardsApprover'), label: `standards approver ${pass.tag}${suffix}`, phase: 'Approve', schema: STANDARDS_SCHEMA,
      }),
    ])
    plan = approvals[0]
    standards = approvals[1]
    if (!plan || !standards) {
      throw stageError('approve', `the ${!plan ? 'plan' : 'standards'} approver returned nothing in ${pass.name}`, {}, `${!plan ? 'plan' : 'standards'} approver ${pass.tag}${suffix}`)
    }
    if (plan.approved) {
      break
    }
    if (adjustment >= maxPlanAdjustments) {
      // The cap is the only bound on bounces (#106): the workflow is told a bounce by task number
      // and free text, so it cannot tell that one repeats on a decided finding's task. What it
      // does know goes with the stop: each decided finding whose task a reshape changed, with the
      // list as its resolve planned it and then as each such reshape left it, so the person sees
      // which decision the approver and the shaper did not settle. Absent when there is none.
      const reshaped = inScope.map((f) => f.id).filter((id) => reshapedTasks[id]).map((id) => ({ id, decidedBy: roundDecisions[id].decidedBy, files: reshapedTasks[id] }))
      throw stageError('approve', `the plan approver did not approve the ${pass.name} plan after ${maxPlanAdjustments} adjustments`, { adjustments: plan.adjustments, notes: plan.notes, ...(reshaped.length ? { reshaped } : {}) }, `plan approver ${pass.tag}${suffix}`)
    }
    log(`${pass.name}: plan bounced (${plan.adjustments.length} adjustments); reshaping`)
    shaped = await run('shape', reshapePrompt(pass, specFolder, inScope, plan.adjustments, adjustment + 1, inScope.map((f) => f.id).filter(tracked).map((id) => ({ id, end: endsIn(id) }))), {
      agentType: 'redline:redline-shaper', ...modelOpts('revise'), label: `reshape ${pass.tag} #${adjustment + 1}`, phase: 'Shape', schema: pass.human ? SHAPE_SCHEMAS.human : SHAPE_SCHEMAS.round,
    })
    await vetShape(pass, record, inScope, shaped, calls, `reshape ${pass.tag} #${adjustment + 1}`, ` #${adjustment + 1}`, Object.keys(roundDecisions))
    // A decided finding's task is the reshape's to correct after a bounce, so its list follows
    // the reshape (#106): the files the reshape returns for it, which its prompt asks for as the
    // task plan.md now holds. Until #106 the list stayed as the resolve planned it, so the plan
    // approver's next pass, the implementer, a held draft and the warnings were shown a task the
    // plan no longer held, and an approver holding the list to the plan could bounce to the cap.
    // What the reshape says was decided, its disposition and its deferred entry, is still dropped
    // (#94, R8-6; #97, R3-6). The lists are compared as sets, and an equal one is kept as it was,
    // so the prompts that follow do not change; a change is warned about with the decision's
    // owner. A finding this reshape left to the person under a rule is no longer tracked. The
    // list is read through cleanPaths, as a resolve's is, so one file written another way is no
    // change and a blank is no file (#114, R1-6).
    for (const id of inScope.map((f) => f.id).filter(tracked)) {
      const listed = shaped.findings.find((s) => s.id === id)
      const now = cleanPaths(listed && Array.isArray(listed.files) ? listed.files : [])
      const before = decidedFiles[id] || []
      if (now.length === before.length && now.every((path) => before.includes(path))) {
        continue
      }
      const said = (list) => (list.length ? list.join(', ') : 'none')
      warnings.push(`${pass.name}: the reshape changed the files of ${id}'s task, a finding decided by ${roundDecisions[id].decidedBy}, from ${said(before)} to ${said(now)}`)
      reshapedTasks[id] = (reshapedTasks[id] || [before]).concat([now])
      decidedFiles[id] = now
    }
    // The decision is held to its task again, as it is when its resolve returns (#99; #108,
    // R1-5): a fix has a task with files and an accept has none, whatever the reshape made of the
    // plan (#106). The stop sits here, where a resume reruns the reshape and can replan: a fix
    // with no task would otherwise fail the check for no commit and stop after a repair, whose
    // resume starts at the build, and an accepted finding would be built against the decision.
    // What a decision ends in is its own disposition when it names one, an override's or a
    // call's, and else what the resolve agent stated for the call. A deferral is not held: its
    // mitigation is optional, and no commit is demanded of one (#100). The stop is raised through
    // checkError, so the error result carries ownCheck, and resumeLine reads that field, never the
    // message's words (#116).
    // It reads the files the reshape lists for each finding, which the block asks for as a task of
    // the finding's own, since a reshape returns no list of tasks (#114, R2-6).
    const heldIds = inScope.map((f) => f.id).filter(tracked)
    const saidBy = (id) => (roundDecisions[id].disposition ? (isOverride(id) ? 'a disposition override names' : 'its decision names') : 'the resolve agent stated')
    // Both kinds are named in one stop (#114, R4-6): the resume line tells the rerun to correct
    // what the error names, so a stop that named only the fixes had a reshape that also gave
    // an accepted finding a task repair the fixes alone and stop again here for the accept. With
    // one kind the message reads as it did.
    const taskless = heldIds.filter((id) => endsIn(id) === 'fix' && decidedFiles[id].length === 0)
    const tasked = heldIds.filter((id) => endsIn(id) === 'accept' && decidedFiles[id].length > 0)
    const left = [
      taskless.length ? `${taskless.map((id) => `${id}, which ${saidBy(id)} as a fix`).join('; ')}, with no task with files; a fix names the files it changes` : '',
      tasked.length ? `${tasked.map((id) => `${id}, which ${saidBy(id)} as accepted, with a task with files (${decidedFiles[id].join(', ')})`).join('; ')}; an accepted finding changes nothing` : '',
    ].filter(Boolean)
    if (left.length) {
      throw checkError('shape', `the reshape left ${left.join('; and ')}`, {}, `reshape ${pass.tag} #${adjustment + 1}`)
    }
    // A call the reshape raised that this round has not seen: autopilot decides it, the other
    // levels end the run; either way the resolve agent writes the new decisions in.
    const raised = shaped.judgmentCalls.filter((call) => !calls.some((known) => known.id === call.id))
    // An earlier entry stays only while its finding is still deferred or a decision stands on it:
    // a defer the reshape re-sorted is no deferral any more (#94, R4-9). An entry for a finding the
    // person changed away from defer is dropped, whichever list holds it (#94, R5-9). The list is
    // rebuilt before the stop below reads it, so a draft the reshape wrote or changed is raised
    // at the same stop as a call it raised (#95).
    const stillDeferred = (id) => Boolean(roundDecisions[id]) || shaped.findings.some((s) => s.id === id && s.disposition === 'defer')
    // A finding the person or autopilot decided keeps the entry its decision was planned with (#97,
    // R3-6): a reshape's entry for it would replace that one, so a restated draft would swap the
    // one filed and a restated mitigation the words shown beside it. Until #99 isDeferral read
    // the entry as well, so a restated mitigation could undo the person's deferral.
    // The reshape's entry is dropped with a warning; stillDeferred keeps the earlier one.
    const restated = shaped.deferred.filter((d) => roundDecisions[d.id]).map((d) => d.id)
    if (restated.length) {
      warnings.push(`${pass.name}: the reshape listed ${restated.join(', ')} as deferred, a finding the person or autopilot decided; the reshape's entry is dropped, since the decision stands`)
    }
    const reshaped = shaped.deferred.filter((d) => !roundDecisions[d.id])
    deferred = reshaped.concat(deferred.filter((item) => !reshaped.some((d) => d.id === item.id) && stillDeferred(item.id))).filter((d) => !awayFromDefer(d.id))
    const openRaised = raised.filter((call) => !decisions[call.id])
    const stopForRaised = settle(openRaised)
    const redrafted = draftStop()
    if (stopForRaised || redrafted) {
      return { handoff: true, kind: 'decisions', pending: stopForRaised ? openRaised : [], calls: shaped.judgmentCalls, shaped, drafts: redrafted ? redrafted.drafts : [], afterApproval: true }
    }
    if (raised.length) {
      calls = calls.concat(raised)
      phase('Resolve')
      resolved = await resolveWith(raised, [], ` #${adjustment + 1}`)
      if (resolved.handoff) {
        return resolved
      }
      // A raised call the person answered with a deferral, drafted by this resolve.
      const drafted = draftStop()
      if (drafted) {
        return drafted
      }
    }
    phase('Approve')
  }
  const finalDispositions = effectiveDispositions()

  // The snapshot's plan_paths is every path approved so far in this run: the git block
  // measures from start_sha, so earlier rounds' files are still changed in later rounds.
  // Each path the approver listed is read as the guard reads the target of a write (planEntry),
  // once, and one left out is warned about by name: a narrower allowed list can fail the gate on a
  // file the plan meant, and the person should see why. Until the #114 round 4 by-hand spec only
  // the repository root was taken off, so app//x.php named no file the gate would see changed.
  const planPaths = []
  for (const raw of plan.planPaths) {
    const { entry, dropped } = planEntry(raw)
    if (dropped) {
      warnings.push(`${pass.name}: the plan approver listed \`${String(raw).trim()}\`, which ${dropped}; it is not among the allowed paths`)
    } else if (entry !== '' && !planPaths.includes(entry)) {
      planPaths.push(entry)
    }
  }
  // The round keeps the paths its own plan named (#95): the next round's fix diff is this round's
  // fixes, and a finding the verifier places in it must sit under one of them. The run's list
  // below is every round's, so it cannot say which round touched a file.
  record.planPaths = planPaths.slice()
  approvedPaths = unique(approvedPaths.concat(planPaths, [`${specFolder}/`]))
  const snapshotPath = abs(`${specFolder}/redline/snapshot.json`)
  // round_sha is the commit this round starts from (#68): the newest one an earlier round's check
  // listed, or the run's start. checks.sh lists the commits after it, the round's own, so the
  // gate's result does not grow with the run. A round's commits join commitsAll only once its check
  // has passed, so a resumed attempt of the round writes the same round_sha, and what the failed
  // attempt committed is still listed and checked.
  const roundSha = commitsAll.length ? commitsAll[commitsAll.length - 1].sha : startSha
  const snapshot = { pr, start_sha: startSha, round_sha: roundSha, base_ref: baseRef, files: prFiles, plan_paths: approvedPaths }
  const written = await run('snapshot', snapshotPrompt(pass, snapshotPath, json(snapshot)), {
    agentType: 'redline:redline-github', ...modelOpts('github'), label: `snapshot ${pass.tag}`, phase: 'Approve', schema: FILE_OP_SCHEMA,
  })
  if (written.error) {
    throw stageError('snapshot', `writing ${snapshotPath} failed: ${written.error}`)
  }
  const octane = A.octane === true || approvedPaths.some((path) => /^(app\/Providers\/|bootstrap\/|config\/octane\.php)/.test(path))

  if (!baseline) {
    phase('Check')
    if (backgroundGate) {
      log(`the gate runs in the background: ${baselineNote}`)
    }
    baseline = await checker('--baseline', snapshotStart, false, 'baseline', 'baseline')
    const baselineStop = stopReason(baseline, checkerCommand('--baseline', snapshotStart, false), false)
    if (baselineStop) {
      throw stageError('check', `baseline: ${baselineStop}`, { checker: baseline })
    }
    baselineFailing = failingNames(baseline)
    if (baselineFailing.length) {
      warnings.push(`baseline: ${baselineFailing.join(', ')} already failing before the first implement step`)
    }
  }

  // No commit is demanded of a deferral (#100), Redline's own or one the person chose: a
  // mitigation is optional, so one the build left out is a warning after the check, never a
  // failing check. It stays out of the repair as well, which would be told to produce a commit
  // for a finding the plan may hold no task for, and could only invent a change or answer
  // blocked, a stop. A fix, the shaper's or a decided one, is demanded as before.
  // The findings read as deferrals, and only those (#103, R1-10): a final disposition of defer
  // alone is not one, since a reshape's re-sort of a decided call is no deferral (#94, R8-6), and
  // that call's planned task is still demanded. Read once here; the filing and the outcomes
  // below reuse it, since nothing they read changes after the approve loop.
  const roundDeferred = deferred.filter(isDeferral)
  const deferralIds = new Set(roundDeferred.map((d) => d.id))
  // What the check demands of a call the person or autopilot decided is read from what the
  // resolve agent stated for it, and from nothing else (#99): a call stated as a fix is demanded
  // whatever entry stood beside it and whatever a reshape made of its finding, and one stated as
  // a deferral or as accepted is not, whatever its task lists. One exception: a decided finding
  // a reshape leaves to the person under a rule after its resolve is demanded of nothing, a call
  // stated as a fix, a call whose decision names its own fix and an override to fix alike, as
  // isDeferral and the outcomes treat it, and as the clause before #99 had it for a stated call
  // (#108, R1-8); the test is on the whole list, since a decision that names its fix is demanded
  // through its final disposition (#108, R2-5). Until #99 a
  // call's fix was demanded through the resolve's tasks, any with files whose finding was not
  // read as a deferral, the inference isDeferral made from the other side. Every other finding
  // is demanded by its final disposition, as before.
  const needCommits = finalDispositions
    .filter((f) => f.disposition === 'fix' && !deferralIds.has(f.id) && !(f.id in stated))
    .map((f) => f.id)
    .concat(Object.keys(stated).filter((id) => stated[id] === 'fix'))
    .filter((id) => !record.forced[id])
  const ctx = {
    specFolder, snapshotPath, octane, baselineFailing, inScope, shaped: { ...shaped, findings: finalDispositions }, deferred, roundDecisions, plan, standards,
    allowed: unique(prFiles.concat(approvedPaths, ['agent-os/specs/', 'agent-os/standards/', 'openapi.json'])),
    repair: '',
  }

  let implemented = null
  // Every attempt's reported commits (#94, R7-9): a repair is a fresh implementer call that reports
  // only its own, and the round's commits include the attempt's before it.
  const reported = []
  let checked = null
  let verdict = null
  const checkFlag = checkerMode === 'git-only' ? '--git-only' : ''
  const checkCommand = checkerCommand(checkFlag, snapshotPath, octane)
  for (let attempt = 0; attempt < 2; attempt++) {
    phase('Implement')
    const implementLabel = `${attempt ? 'repair' : 'implement'} ${pass.tag}`
    implemented = await run('implement', implementPrompt(pass, ctx, implementLabel), {
      agentType: 'redline:redline-implementer', ...modelOpts('revise'), label: implementLabel, phase: 'Implement', schema: IMPLEMENT_SCHEMA,
    })
    if (implemented.blocked.length) {
      throw stageError('implement', `the implementer is blocked in ${pass.name}`, { blocked: implemented.blocked })
    }
    reported.push(...implemented.commits)
    phase('Check')
    const checkLabel = `${attempt ? 'recheck' : 'check'} ${pass.tag}`
    checked = await checker(checkFlag, snapshotPath, octane, checkLabel, pass.name)
    verdict = judge(checked, baselineFailing, unique(needCommits), checkCommand)
    log(`${pass.name}: checker ${verdict.pass ? 'passed' : verdict.stop ? `stopped (${verdict.stop})` : `failed (${verdict.reasons.join('; ')})`}`)
    for (const warning of verdict.warnings) {
      warnings.push(`${pass.name}: ${warning}`)
    }
    if (verdict.stop) {
      // Nothing the implementer could change: stop now, keeping what the checker returned.
      record.check = { pass: false, stop: verdict.stop, reasons: [], preExisting: [], diffLines: null }
      throw stageError('check', `${pass.name} ${checkLabel}: ${verdict.stop}`, { checker: checked })
    }
    if (verdict.pass) {
      break
    }
    // A result read from checks.sh --verdict carries no check's output (#68), and the repair pass says so.
    ctx.repair = `${verdict.reasons.join('\n')}\n${failingExcerpt(checked)}${checked.viaVerdict ? '\nThe gate\'s result was too large for the checker to relay, so no output of the failing checks is quoted here: run the gate and read it.' : ''}`
  }
  record.check = { pass: verdict.pass, stop: null, reasons: verdict.reasons, preExisting: verdict.preExisting, diffLines: verdict.diffLines }
  if (!verdict.pass) {
    throw stageError('check', `checks.sh still fails after one repair pass in ${pass.name}: ${verdict.reasons.join('; ')}`)
  }
  if (verdict.preExisting.length) {
    warnings.push(`${pass.name}: ${verdict.preExisting.join(', ')} still failing, as at baseline`)
  }

  const gitCommits = (checked.result.git && checked.result.git.commits) || []
  const known = new Set(commitsAll.map((c) => c.sha).concat([...handCommits]))
  const roundCommits = gitCommits
    .filter((c) => !known.has(c.sha))
    .reverse()
    .map((c) => {
      const claimed = reported.find((ic) => ic.sha.length >= 7 && (c.sha.startsWith(ic.sha) || ic.sha.startsWith(c.sha)))
      return { sha: c.sha, message: c.message, subject: shownSubject(c.message, claimed), finding: claimed ? claimed.finding : '', round }
    })
  commitsAll.push(...roundCommits)
  record.commits = roundCommits

  // The round's deferrals (#95): what the shaper deferred and what the person chose to defer, each
  // with its drafted issue, and what becomes of each draft. Held: the setting is the end of the
  // run, so nothing is filed and no reply is posted for it yet. Dropped: the person said so at a
  // stop, so nothing is filed and nothing else changes. Filed: every other draft, with the
  // person's title when they gave one; on autopilot that is every draft, as drafted.
  const roundDeferrals = draftsOf(roundDeferred, plannedFiles)
  const held = holdsDrafts ? roundDeferrals : []
  const dropped = Object.fromEntries(roundDeferrals.filter((d) => raisesDrafts && deferrals[d.item.id] && deferrals[d.item.id].action === 'drop').map((d) => [d.item.id, deferrals[d.item.id]]))
  const toFile = holdsDrafts ? [] : roundDeferrals.filter((d) => !dropped[d.item.id]).map((d) => ({ ...d, title: raisesDrafts && deferrals[d.item.id] ? deferrals[d.item.id].title : '' }))
  // They are filed once the gate has passed and before the replies, so each reply and the handoff
  // say where its item went: the issue's number, or the draft's path.
  const filed = toFile.length ? await fileDeferred(pass, record, toFile, 'Push and reply') : {}
  const heldIds = new Set(held.map((d) => d.item.id))
  const outcomes = outcomesFor(pass, inScope, { ...shaped, findings: finalDispositions }, roundDeferred, roundDecisions, roundCommits, record.forced, { filed, dropped, held: heldIds })
  // A planned mitigation the build left out (#100): the round planned a task with files for the
  // deferral and no commit of its own landed. It is posted as shipping nothing, its draft is
  // filed all the same, and the warning names the files, since a commit that carries it under
  // another subject is not counted either.
  const landed = (id) => roundCommits.some((c) => ownCommit(c, id))
  for (const d of roundDeferrals) {
    const files = plannedFiles(d.item.id)
    if (files.length && !landed(d.item.id)) {
      warnings.push(`${pass.name}: ${d.item.id} planned a mitigation in ${files.join(', ')} and no commit of its own landed; posted as shipping nothing`)
    } else if (!files.length && landed(d.item.id)) {
      // The other way about: a commit of its own with no task planned with files. The commit is the
      // record, so it counts, and the warning says whose list was empty: a reshape's, when one
      // changed a decided finding's task and left it with none (#106), since the resolve agent
      // may well have planned one.
      const shas = andList(roundCommits.filter((c) => ownCommit(c, d.item.id)).map((c) => short(c.sha)))
      const emptyBy = reshapedTasks[d.item.id] ? 'the reshape left its task with no files; posted with its decision' : roundDecisions[d.item.id] ? 'the resolve agent planned no task with files for it; posted with its decision' : 'the shaper listed no files for its task; posted as its mitigation'
      warnings.push(`${pass.name}: ${d.item.id} has a commit of its own (${shas}) and ${emptyBy}`)
    }
  }
  for (const d of toFile) {
    deferredAll.push(deferredEntry(pass, record, d, filed[d.item.id], outcomes[d.item.id]))
  }
  // What the end-of-run stop needs of a held draft: the draft with its version, and the outcome
  // the round gave its finding, which the answer then completes.
  record.held = held.map((d) => ({ ...d, outcome: outcomes[d.item.id] }))
  // On autopilot a finding a repository ask rule covers, or one on Redline's own files (#94, R8-4),
  // is left to the person with no change made (#49). It is no deferral, since it has no drafted
  // issue (#95): its line under Left to the person says what Redline would have done.
  for (const [id, forced] of Object.entries(record.forced)) {
    const decision = roundDecisions[id]
    if (decision && decision.decidedBy === AUTOPILOT) {
      record.leftOpen = Object.assign(record.leftOpen || {}, { [id]: `${forced.declined ? '' : 'open: '}${forced.declined || forced.recommendation}` })
    }
  }
  record.outcomes = Object.assign(record.outcomes || {}, Object.fromEntries(Object.entries(outcomes).map(([id, outcome]) => [id, describeOutcome(outcome, pass.human)])))
  record.outcomeKinds = Object.assign(record.outcomeKinds || {}, Object.fromEntries(Object.entries(outcomes).map(([id, outcome]) => [id, outcome.kind])))
  // The shaper's own disposition of each item, before any override: `overruled` and `bought` read
  // it. An accept that keeps a decline changes nothing Redline does, so it is the person's decision
  // on what the plan dial showed them, never an overrule: only a decline changed to fix or defer is
  // overruled (skills/redline/SKILL.md, the plan dial; #94, R2-10).
  const shaperOwn = Object.fromEntries(shaped.findings.map((s) => [s.id, s.disposition]))
  const keptDecline = (id) => shaperOwn[id] === 'decline' && Boolean(roundDecisions[id]) && roundDecisions[id].disposition === 'accept'
  for (const f of inScope) {
    // `kind` is what became of the item, `reason` a decline's reason, and `overruled` a decision the
    // person made on an item that was not put to them: a disposition they changed at a stop (#93),
    // or a draft they dropped, a deferral they chose at a call included (#97, R4-3).
    decidedAll.push({ id: f.id, round, title: f.title, outcome: describeOutcome(outcomes[f.id], pass.human), decidedBy: outcomes[f.id].decidedBy, choice: outcomes[f.id].choice || '', notes: outcomes[f.id].notes || '', kind: outcomes[f.id].kind, reason: outcomes[f.id].kind === 'declined' ? outcomes[f.id].reason : '', overruled: outcomes[f.id].kind === 'decided' && (Boolean(outcomes[f.id].dropped) || (!calls.some((call) => call.id === f.id) && !keptDecline(f.id))) })
  }

  phase('Push and reply')
  // A finding whose draft is held gets its reply, and the reply in an earlier thread it carries,
  // once the draft is settled at the end of the run (#95): a thread takes one Redline reply a
  // round, and that reply says where the item went.
  const answeredNow = inScope.filter((f) => !heldIds.has(f.id))
  const replies = withAnswers(pass, answeredNow, mergeThreadReplies(pass, answeredNow.map((f) => replyEntry(pass, f, outcomes[f.id], record.commentIds[f.id] || 0, record.reviewPosted))))
    .concat(carriedReplies(pass, record, answeredNow, outcomes), droppedReplies(record), resolvedReplies(record), knownCarriedReplies(record))
  const doPush = push && roundCommits.length > 0
  const pushed = await run('push-and-reply', pushReplyPrompt(pass, specFolder, replies, doPush), {
    agentType: 'redline:redline-github', ...modelOpts('github'), label: `push and reply ${pass.tag}`, phase: 'Push and reply', schema: PUSH_REPLY_SCHEMA,
  })
  if (pushed.error) {
    throw stageError('push-and-reply', `push or replies failed in ${pass.name}: ${pushed.error}`)
  }
  record.files.push(...replies.map((reply) => reply.file.slice(repoRoot.length + 1)))
  record.pushed = pushed.pushed
  keepReplyIds(record, pushed)
  const newHead = roundCommits.length ? roundCommits[roundCommits.length - 1].sha : null
  // The done rule (#93): a round is bought by what it finds, not by what it commits. A new
  // correctness item the shaper fixes or puts to the person buys the next round, whatever the
  // person answered and whether or not a commit resulted; so does a decline the person overruled
  // to a fix. A deferral buys it only through a commit of its own, as the paragraph below says
  // (#100; #103, R2-1). A decline of the shaper's own buys nothing,
  // and neither does any item that is not a correctness one. A call stays in `calls` when a reshape
  // re-sorts its finding, so an item put to the person buys the round whatever the reshape
  // returned (#94, R2-11).
  // `fixed` is the items a commit names, never a declined item or a none, whose `commits` only
  // mention them (#94, R2-12): the round's spec and standards commits are no fix diff. A deferral's
  // mitigation counts, since its commit is unreviewed code the final nit pass must read; the
  // handoff's final nit pass sentence still calls such an item fixed (R2-12, deferred), while a
  // human review pass's summary names it with where it went (#97, R4-7).
  // A deferral buys the next round only through its mitigation, which is new code (#95): one that
  // ships nothing changes nothing here and, like a decline, buys nothing. Whether one shipped is
  // read off the round's commits, never off the words of an entry (#100): a commit of the
  // finding's own landed. So a planned mitigation the build left out buys nothing, and neither
  // does the shaper's deferral once the person changed it to accept, which ships no commit; a fix
  // the person changed to accept still buys, as above.
  const finalOwn = Object.fromEntries(finalDispositions.map((s) => [s.id, s.disposition]))
  const buys = (own, id) => own === 'fix' || (own === 'defer' && landed(id))
  // A low-severity correctness finding from the previous round's fix diff is fixed like a nit
  // (#95): whatever became of it, a call included, it buys nothing, as a nit buys nothing.
  const likeNit = new Set(record.minor || [])
  const bought = inScope.some((f) => f.category === 'correctness' && !likeNit.has(f.id) && (calls.some((call) => call.id === f.id) || shaperOwn[f.id] === 'ask' || buys(shaperOwn[f.id], f.id) || buys(finalOwn[f.id], f.id)))
  const fixed = inScope.filter((f) => !['declined', 'none'].includes(outcomes[f.id].kind) && outcomes[f.id].commits.length > 0).map((f) => f.id)
  return { handoff: false, newHead, commits: roundCommits, bought, fixed }
}

// Known limits in the plugin's README, where the teammate reading the handoff can open it.
function knownLimits() {
  return `[Known limits](${README_URL}#known-limits) in Redline's README`
}

function handoffComment(ending, prBody, threads) {
  const lines = ['Redline handoff', '']
  const reviews = rounds.length
  const last = rounds[reviews - 1]
  // With the coverage pass (#79) every round but the nit pass reviewed the whole PR at its head,
  // and the sentence says so, since it is posted only in the two branches that end in a final nit
  // pass (#80, R1-6); under coverage off only the first round did, as before the pass existed.
  const wholePr = rounds.some((record) => record.coverage)
    ? `The coverage pass reviewed the whole PR at the head of every round but the final nit pass; see ${knownLimits()}.`
    : `Only round ${firstRound} reviewed the whole PR; see ${knownLimits()}.`
  // The opening sentence, by how the run ended (#93). `ending.final` is a final nit pass that found
  // correctness items: how many, and how many of them a commit fixed, since the shaper may decline
  // one and no wording may call a declined item fixed. `ending.noRecheck` is a bought round that
  // changed no code with the coverage pass off; `ending.notPicked` a review dial with nothing picked.
  // `ending.likeNits` a round that bought nothing and committed no fix whose correctness items
  // included low-severity bugs in the previous round's fixes, which the generic sentence would say
  // it never asked about (#97, R2-16).
  const end = ending && typeof ending === 'object' ? ending : {}
  const final = end.final || null
  const ran = `Redline ran ${reviews} review round${reviews === 1 ? '' : 's'}`
  // What the final nit pass read (#95): the nit fixes, or the fixes of a round that fixed a
  // low-severity correctness finding like a nit.
  const read = last && last.reviewed === 'final-nit-pass' ? fixesRead(last.round) : 'the nit fixes'
  if (final && final.fixed === final.found) {
    lines.push(final.found === 1
      ? `${ran}. The final nit pass found a correctness bug in ${read}; it was fixed in one more pass, which was not re-reviewed. Please look at that commit first. ${wholePr}`
      : `${ran}. The final nit pass found ${final.found} correctness bugs in ${read}; they were fixed in one more pass, which was not re-reviewed. Please look at those commits first. ${wholePr}`)
  } else if (final && final.fixed === 0) {
    lines.push(`${ran}. The final nit pass found ${final.found} correctness item${final.found === 1 ? '' : 's'} in ${read}; none was changed, and each is listed below. ${wholePr}`)
  } else if (final) {
    lines.push(`${ran}. The final nit pass found ${final.found} correctness items in ${read}: ${final.fixed} fixed in one more pass, which was not re-reviewed (please look at ${final.fixed === 1 ? 'that commit' : 'those commits'} first); ${final.found - final.fixed} not changed, listed below. ${wholePr}`)
  } else if (last && last.reviewed === 'final-nit-pass') {
    lines.push(`${ran}. The last was a final nit pass over the fix diff only, which found no correctness bugs in ${read}. ${wholePr}`)
  } else if (end.noRecheck) {
    lines.push(`${ran}; the last one changed no code, and with the coverage pass off there was nothing further to review.`)
  } else if (end.notPicked) {
    lines.push(`${ran}; none of its findings was picked to act on.`)
  } else if (end.likeNits) {
    lines.push(`${ran}; the last one verified no new correctness item to fix or ask about beyond low-severity bugs in round ${last.round - 1}'s fixes, which are handled like nits and buy no further round, and it committed no fix.`)
  } else {
    lines.push(`${ran}; the last one verified no new correctness item to fix or ask about.`)
  }
  if (threads) {
    lines.push('', threadsLine(threads))
  }
  if (prBody.updated) {
    const file = prBody.file.startsWith(`${repoRoot}/`) ? prBody.file.slice(repoRoot.length + 1) : prBody.file
    lines.push('', `Redline replaced the PR description with the redraft in \`${file}\`; the previous one is in the description's edit history.`)
  }
  if (AGENTS_CHANGED_HANDOFF) {
    lines.push('', AGENTS_CHANGED_HANDOFF)
  }
  if (teammate) {
    lines.push('', `@${teammate}, over to you for the human review.`)
  }
  // Every item of the run, by what became of it (#93): what was put to the person and what they
  // overruled first, then what Redline declined on its own, with how to overrule one, since that
  // is what a reader audits; then what was deferred, left under a rule, not picked or not changed;
  // the fixes last and folded, since each is a commit below. The single Decisions list is gone.
  // One test per group, read by the lists below and by the Rounds counts, so the two never drift
  // (#94, R2-13).
  const isKind = (kind) => (d) => d.kind === kind
  const isAsked = (d) => d.kind === 'decided' && !d.overruled && d.decidedBy !== AUTOPILOT
  const isAuto = (d) => d.kind === 'decided' && !d.overruled && d.decidedBy === AUTOPILOT
  const isOverruled = (d) => d.kind === 'decided' && d.overruled
  const of = (test) => decidedAll.filter(test)
  const asked = of(isAsked)
  const auto = of(isAuto)
  const overruled = of(isOverruled)
  const declined = of(isKind('declined'))
  const notPicked = of(isKind('dropped'))
  const notChanged = of(isKind('not-changed'))
  const fixed = of(isKind('fixed'))
  const scoped = rounds.flatMap((record) => record.scoped || [])
  lines.push('', '### Rounds', '')
  for (const record of rounds) {
    const mine = decidedAll.filter((d) => d.round === record.round)
    const count = (test) => mine.filter(test).length
    const parts = [
      [count(isKind('fixed')), 'fixed'],
      [count(isKind('declined')), 'declined'],
      [count(isKind('deferred')), 'deferred'],
      [count(isAsked), `put to ${personLabel}`],
      [count(isAuto), 'decided on autopilot'],
      [count(isOverruled), `overruled by ${personLabel}`],
      [count(isKind('left')), `left to ${personLabel}`],
      [count(isKind('dropped')), `not picked by ${personLabel}`],
      [count(isKind('not-changed')), 'not changed'],
      [(record.scoped || []).length, 'declined under the scope'],
    ].filter(([n]) => n > 0)
    const items = parts.reduce((sum, [n]) => sum + n, 0)
    const approved = approvedPlans.includes(record.round) ? `; plan approved by ${personLabel}` : ''
    lines.push(`- Round ${record.round} (${record.reviewed}): ${items ? `${items} item${items === 1 ? '' : 's'}: ${parts.map(([n, what]) => `${n} ${what}`).join(', ')}` : 'no new items'}; ${(record.commits || []).length} commits${approved}; spec \`${record.specFolder}\``)
  }
  // A finding's title is the verifier's and goes through postedText; the outcome after it is the
  // workflow's, the shaper's or the person's, and is posted as written, so its `decided by: @login`
  // still names the owner (#87, decision 2). The lists below all do the same.
  const line = (d) => `- **${d.id}** ${postedText(d.title)}: ${d.outcome}`
  if (asked.length) {
    lines.push('', `### Put to ${personLabel} (${asked.length})`, '', ...asked.map(line))
  }
  if (auto.length) {
    lines.push('', `### Asked, decided on autopilot (${auto.length})`, '', ...auto.map(line))
  }
  if (overruled.length) {
    lines.push('', `### Overruled by ${personLabel} (${overruled.length})`, '', ...overruled.map(line))
  }
  if (declined.length) {
    lines.push('', `### Declined by Redline (${declined.length})`, '', `To overrule one, reply in its thread (for one in the review body, which has no thread, submit a pull request review whose body names its id), then run \`/redline:redline-revise ${pr} review @<login>\` with the login of whoever replied${login ? `, such as \`review @${login}\`` : ''}.`, '', ...declined.map(line))
  }
  // What the workflow declined under a correctness-only scope: ids that are not bold, as in the
  // review bodies, so no reader takes a line for a finding with a disposition. On any other run
  // only a final nit pass declines one (#94, R7-10).
  if (scoped.length) {
    lines.push('', `### Declined under ${scopeName(scope !== 'correctness')} (correctness only) (${scoped.length})`, '', ...scoped.map(scopedLine))
  }
  lines.push(...deferredSection())
  const left = leftToYou()
  if (left.length) {
    // The heading names what the findings are left under: repository rules, Redline's own files
    // (#94, R8-4), or both, always in that order, as docs/running.md gives it, whichever forced
    // finding came first (#94, R9-7).
    const forced = rounds.flatMap((record) => Object.values(record.forced || {}))
    const under = [forced.some((x) => !x.own) && 'repository rules', forced.some((x) => x.own) && "Redline's own files"].filter(Boolean)
    lines.push('', `### Left to ${personLabel} (${under.join(' and ')})`, '', ...left)
  }
  if (notPicked.length) {
    lines.push('', `### Not picked by ${personLabel} (${notPicked.length})`, '', ...notPicked.map(line))
  }
  if (notChanged.length) {
    lines.push('', `### Not changed (${notChanged.length})`, '', ...notChanged.map(line))
  }
  if (fixed.length) {
    lines.push('', `### Fixed (${fixed.length})`, '', '<details>', '<summary>With the commits that fixed each</summary>', '', ...fixed.map(line), '', '</details>')
  }
  const earlier = earlierRoundsLines()
  if (earlier.length) {
    lines.push('', '### Earlier rounds', '', ...earlier)
  }
  // The set-aside block of the last round that ran the coverage pass, named (#85): the round whose
  // verifier ended the run, the one before a final nit pass. Earlier rounds' blocks stay in their
  // own review bodies; under coverage off no round has candidates, so there is none.
  const lastCovered = rounds.slice().reverse().find((record) => record.coverage)
  if (lastCovered && (lastCovered.setAsideCandidates || []).length) {
    lines.push('', ...setAsideBlock(lastCovered.setAsideCandidates, lastCovered.round))
  }
  if (commitsAll.length) {
    lines.push('', '### Commits', '', ...commitsAll.map((c) => `- ${short(c.sha)} ${c.subject || c.message}`))
  }
  if (!push) {
    lines.push('', 'The commits are local only; push was off for this run.')
  }
  return lines.join('\n')
}

// What the run deferred (#95): every item that ended in a drafted issue, with where it went (the
// issue's number, or the draft's path) and, when one shipped, its mitigation's commits. The
// handoff and the cap-hit comment carry the same section; with nothing deferred it is absent.
// The line is the item's outcome as its round recorded it, so a deferral the person chose reads
// as their decision and ends with where it went. A finding left to the person under a rule is
// here only when the person deferred it (#126), listed under Left to as well: any other has no
// drafted issue.
function deferredSection() {
  return deferredAll.length ? ['', `### Deferred (${deferredAll.length})`, '', ...deferredAll.map((d) => `- **${d.id}** ${postedText(d.title)}: ${d.outcome}`)] : []
}

// The findings every round left to the person under a repository ask rule (#49), or on Redline's
// own files (#94, R8-4), one line each
// with the rule, its reason and the outcome as recorded (which carries the owner). On autopilot,
// where nobody answered, the line also says what Redline would have done (#95): that text sat on
// the Deferred list until a deferral came to mean a drafted issue.
function leftToYou() {
  const lines = []
  for (const record of rounds) {
    for (const [id, forced] of Object.entries(record.forced || {})) {
      const f = record.findings.find((x) => x.id === id)
      const outcome = record.outcomes && record.outcomes[id] ? record.outcomes[id] : `left to ${personLabel} under ${leftUnder(forced)}`
      const open = (record.leftOpen || {})[id] ? `${record.leftOpen[id].replace(/\.$/, '')}; ` : ''
      lines.push(`- **${id}** ${f ? postedText(f.title) : ''}: ${forced.own ? "Redline's own files" : `rule ${forced.rule}`} (${forced.reason}); ${open}${outcome}`)
    }
  }
  return lines
}

// One line for the PR after a human review pass: what was fixed, what went back to the author as a
// question, what asked for nothing, what was left to the author under a repository rule, and what
// the final nit pass found. The reviewer is already on the PR, so there is no handoff and no
// review request.
function humanSummary(record, nitPass, threads) {
  const pass = passOf(record)
  const kinds = record.outcomeKinds || {}
  const ids = (kind) => record.findings.map((f) => f.id).filter((id) => kinds[id] === kind)
  const plural = (list, one, many) => (list.length === 1 ? one : many)
  const parts = []
  const fixed = ids('fixed')
  const commits = (record.commits || []).length
  parts.push(fixed.length
    ? `fixed ${andList(fixed)} in ${commits} commit${commits === 1 ? '' : 's'} (${push ? 'pushed' : 'not pushed'})`
    : 'nothing to fix')
  const decided = ids('decided')
  if (decided.length) {
    parts.push(`${andList(decided)} ${plural(decided, 'was a question', 'were questions')} for ${personLabel}, answered in ${plural(decided, 'its thread', 'their threads')}`)
  }
  // What the pass deferred is read off what was filed, never off the outcome kind (#95): in a
  // human review pass a deferral is the author's decision, so no finding has the kind. Each part
  // reads as the replies and the handoff say where an item went (deferredTo; #97, R3-7).
  // A finding left to the author that they deferred is named once, with the left findings below.
  const filed = record.findings.map((f) => f.id).filter((id) => (record.filed || {})[id] && kinds[id] !== 'left')
  if (filed.length) {
    parts.push(andList(filed.map((id) => `${id} ${deferredTo(record.filed[id])}`)))
  }
  const none = ids('none')
  if (none.length) {
    parts.push(`${andList(none)} asked for nothing`)
  }
  const left = ids('left')
  if (left.length) {
    const ruleIds = unique(left.map((id) => (record.forced[id] || {}).rule || ''))
    const leftFiled = left.filter((id) => (record.filed || {})[id])
    parts.push(`${andList(left)} left to ${personLabel} under repository rule${ruleIds.length === 1 ? '' : 's'} ${andList(ruleIds)}${leftFiled.length ? ` (${andList(leftFiled.map((id) => `${id} ${deferredTo(record.filed[id])}`))})` : ''}`)
  }
  const rest = ids('not-changed')
  if (rest.length) {
    parts.push(`${andList(rest)} not changed`)
  }
  // The final nit pass's deferrals (#97, R4-7): filed into its own round's record, or of the kind,
  // named with where each went and never counted as fixed.
  const nitRecord = (nitPass && nitPass.record) || { findings: [] }
  const nitFiled = nitRecord.filed || {}
  const nitKinds = nitRecord.outcomeKinds || {}
  const nitDeferred = nitRecord.findings.map((f) => f.id).filter((id) => nitFiled[id] || nitKinds[id] === 'deferred')
  const nitFixed = nitPass ? (nitPass.fixedIds || []).filter((id) => !nitDeferred.includes(id)).length : 0
  const nitRest = nitPass ? nitPass.found - nitFixed - nitDeferred.length : 0
  const nitClauses = [
    nitFixed > 0 && `${nitFixed} fixed in one more pass that was not re-reviewed`,
    nitDeferred.length > 0 && andList(nitDeferred.map((id) => `${id} ${nitFiled[id] ? deferredTo(nitFiled[id]) : 'deferred'}`)),
    nitRest > 0 && `${nitRest} not changed, answered in ${nitRest === 1 ? 'its thread' : 'their threads'}`,
  ].filter(Boolean)
  const nit = !nitPass
    ? 'No fix was committed, so no final nit pass.'
    : nitPass.found === 0
      ? `Final nit pass (Redline round ${nitPass.round}): no correctness bugs.`
      : nitDeferred.length
        ? `Final nit pass (Redline round ${nitPass.round}): ${nitPass.found} correctness item${nitPass.found === 1 ? '' : 's'} in the fixes: ${nitClauses.join('; ')}.`
      // What the pass found is counted, and only what a commit fixed is called fixed (#93): the
      // round's shaper may decline one.
      : nitPass.fixed === nitPass.found
        ? `Final nit pass (Redline round ${nitPass.round}): ${nitPass.found} correctness bug${nitPass.found === 1 ? '' : 's'} in the fixes, fixed in one more pass that was not re-reviewed.`
        : nitPass.fixed === 0
          ? `Final nit pass (Redline round ${nitPass.round}): ${nitPass.found} correctness item${nitPass.found === 1 ? '' : 's'} in the fixes; none was changed, and each is answered in its thread.`
          : `Final nit pass (Redline round ${nitPass.round}): ${nitPass.found} correctness items in the fixes: ${nitPass.fixed} fixed in one more pass that was not re-reviewed; ${nitPass.found - nitPass.fixed} not changed, answered in ${nitPass.found - nitPass.fixed === 1 ? 'its thread' : 'their threads'}.`
  return `${pass.title} · review by ${pass.reviewer}: ${parts.join('; ')}. ${nit}${threads ? ` ${threadsLine(threads)}` : ''}`
}

function capComment(open) {
  return [
    'Redline stopped at the round cap',
    '',
    `Redline reached its cap of ${maxRounds} revise round${maxRounds === 1 ? '' : 's'} with correctness findings still open in the latest review, so it has not requested a review. ${personLabelStart} will pick these up.`,
    '',
    '### Still open',
    '',
    ...open.map(findingLine),
    // What the run deferred before the cap has its numbers here, since no handoff follows (#95).
    ...deferredSection(),
  ].join('\n')
}

// The description goes first, in a call of its own, so the handoff comment can say whether it was
// replaced. compose(prBody) returns the comment's text. A human review pass finishes with its
// summary comment only: no description, no review request (#36).
async function finish(kind, record, compose) {
  // The drafts the rounds held are raised once, before anything of Finish runs (#95).
  stopForHeld()
  phase('Finish')
  // The round that ends a run is the highest one posted on the PR (#81). A run whose rounds
  // re-ran (PR #80: a relaunch under an edited script) can come back clean at an earlier round
  // while later ones are posted and open, so Finish reads the number before it posts anything
  // and stops when it is above the round the run is finishing from. Nothing follows the stop:
  // no PR description, no sweep, no comment, no review request, no record commit. A dry run
  // posted nothing, so the number is lower and the run goes on.
  const redlineRounds = rounds.filter((r) => !r.human)
  if (redlineRounds.length) {
    const finishing = redlineRounds[redlineRounds.length - 1].round
    const last = await run('finish', lastRoundPrompt(), {
      agentType: 'redline:redline-github', ...modelOpts('github'), label: 'last round', phase: 'Finish', schema: LAST_ROUND_SCHEMA,
    })
    if (last.error) {
      throw stageError('finish', `reading the highest posted Redline round failed: ${last.error}`)
    }
    if (Number.isInteger(last.round) && last.round > finishing) {
      throw Object.assign(stageError('finish', `the run was finishing from round ${finishing}, but the highest Redline round posted on PR #${pr} is ${last.round}, so round ${finishing} is a re-run of an earlier round; nothing was posted after this check. Start a fresh run: /redline:redline ${pr}`), { fresh: true })
    }
  }
  // The held drafts are filed, and their replies posted, only after the read above: nothing is
  // posted once that check refuses (#81; #95).
  await settleHeld()
  const names = { handoff: 'handoff.md', 'cap-hit': 'cap-hit.md', 'human-summary': `human-review-${record.round}-summary.md` }
  const file = `${record.specFolder}/redline/${names[kind]}`
  let prBody = { file: '', updated: false, backup: '', copy: '' }
  if (kind === 'handoff' && postToGitHub) {
    // The review-fix standard redrafts a stale description as pr-body.md in a round's spec folder;
    // the newest round's draft is the one that describes the branch as handed over.
    const bodyCandidates = unique(rounds.map((r) => r.specFolder).reverse()).map((folder) => abs(`${folder}/pr-body.md`))
    const copy = `${record.specFolder}/redline/pr-body-backup.json`
    const updated = await run('finish', updatePrompt(record.specFolder, bodyCandidates, abs(copy)), {
      agentType: 'redline:redline-github', ...modelOpts('github'), label: 'PR description', phase: 'Finish', schema: UPDATE_SCHEMA,
    })
    if (updated.error) {
      throw stageError('finish', `updating the PR description failed: ${updated.error}`)
    }
    prBody = updated.prBody
    if (prBody.copy) {
      record.files.push(copy)
    }
  }
  const threads = await sweepThreads(kind)
  const labels = { handoff: 'handoff comment', 'cap-hit': 'cap-hit comment', 'human-summary': 'summary comment' }
  const out = await run('finish', finishPrompt(kind, record.specFolder, file, compose(prBody, threads)), {
    agentType: 'redline:redline-github', ...modelOpts('github'), label: labels[kind], phase: 'Finish', schema: FINISH_SCHEMA,
  })
  if (out.error) {
    throw stageError('finish', `the ${kind} comment failed: ${out.error}`)
  }
  record.files.push(file)
  recordCommit = await commitRecord()
  return { ...out, prBody, threads }
}

// The threads Redline opened in this run, each settled or not (#39). A finding with an inline
// comment is a candidate; a body finding has no thread. Settled means fixed, deferred, declined
// or decided (SETTLED_KINDS), or left to the person with its drafted issue filed (settles, #126),
// and a reply posted, so Redline's comment and its reply are both in the list; the rest stay
// open with a reason.
// A human review pass's record holds the teammate's threads, which are never candidates.
function threadCandidates() {
  const out = []
  for (const record of rounds) {
    if (record.human) {
      continue
    }
    const kinds = record.outcomeKinds || {}
    const replyIds = record.replyIds || {}
    const dropped = new Set((record.dropped || []).map((f) => f.id))
    for (const f of record.findings) {
      const commentId = record.commentIds[f.id] || 0
      if (!commentId) {
        continue
      }
      const kind = kinds[f.id] || ''
      const settled = settles(record, f.id, kind) && replyIds[f.id] > 0
      const reason = settled ? '' : dropped.has(f.id) ? `dropped by ${personLabel}` : kind === 'left' ? leftUnder((record.forced || {})[f.id] || {}) : kind === 'not-changed' ? 'not changed' : !kind ? 'not settled' : 'no reply posted'
      out.push({ id: f.id, round: record.round, commentId, replyId: replyIds[f.id] || 0, settled, reason })
    }
    // The earlier rounds' threads this round answered (#35): a carried finding's thread is settled
    // with the finding that carries it; a resolved one with its reply. The ids are the earlier
    // root, any earlier Redline reply in it, and this round's reply, so the script's every-comment
    // rule holds and a teammate's comment keeps the thread open. A carrying finding in the review
    // body has no thread, so its earlier thread settles on its own reply (#46, R1-4). A carried
    // finding an issue or a teammate's comment tracks has no outcome: its earlier thread is
    // answered but left open as already tracked (#46, R1-2).
    const ids = new Set(record.findings.map((f) => f.id))
    for (const [priorId, newId] of Object.entries(record.carried || {})) {
      const prior = priorById[priorId]
      if (!prior || !prior.comment_id || !ids.has(newId)) {
        continue
      }
      const carrier = record.findings.find((f) => f.id === newId)
      const kind = kinds[newId] || ''
      const settled = settles(record, newId, kind) && replyIds[priorId] > 0 && (replyIds[newId] > 0 || !record.commentIds[newId])
      // The scope declined the carried finding, so its earlier thread gets no reply and stays
      // open, and a later run without the scope sees it fresh (#94, R1-19).
      const scopeDeclined = (record.scoped || []).some((s) => s.id === newId)
      const reason = settled ? '' : carrier.knownAs ? 'already tracked' : dropped.has(newId) ? `dropped by ${personLabel}` : kind === 'left' ? leftUnder((record.forced || {})[newId] || {}) : kind === 'not-changed' ? 'not changed' : scopeDeclined ? 'declined under the scope' : !kind ? 'not settled' : 'no reply posted'
      out.push({ id: priorId, round: prior.round, commentId: prior.comment_id, extraIds: prior.reply ? [prior.reply.id] : [], replyId: replyIds[priorId] || 0, settled, reason })
    }
    for (const r of record.resolvedPrior || []) {
      const prior = priorById[r.id]
      if (!prior || !prior.comment_id) {
        continue
      }
      const settled = replyIds[r.id] > 0
      out.push({ id: r.id, round: prior.round, commentId: prior.comment_id, extraIds: prior.reply ? [prior.reply.id] : [], replyId: replyIds[r.id] || 0, settled, reason: settled ? '' : 'no reply posted' })
    }
  }
  return out
}

// The handoff's Earlier rounds section (#35): what became of every finding the PR's earlier
// Redline rounds posted, as this run read them at launch. Each line is a part postedText renders,
// the earlier title (read back at intake), the workflow's words and the verifier's knownAs or why,
// as one text, then a part posted as written: an outcome, an earlier reply read back verbatim (its
// owner included) or the redline owner (#87).
function earlierRoundsLines() {
  const record = rounds.find((r) => !r.human && r.round === firstRound)
  if (!priorFindings.length || !record) {
    return []
  }
  const ids = new Set(record.findings.map((f) => f.id))
  return priorFindings.map((p) => {
    const newId = (record.carried || {})[p.id]
    const resolved = (record.resolvedPrior || []).find((r) => r.id === p.id)
    const carrier = newId ? record.findings.find((f) => f.id === newId) : null
    const [said, asWritten] = newId
      ? !ids.has(newId)
        ? [`carried forward as ${newId}, out of scope (correctness only)`, '']
        : carrier.knownAs
          ? [`carried forward as ${newId}: already tracked in ${carrier.knownAs}`, '']
          : record.outcomes && record.outcomes[newId] ? [`carried forward as ${newId}`, `: ${record.outcomes[newId]}`] : [`carried forward as ${newId}`, '']
      : resolved
        ? [`resolved: ${resolved.why}`, decidedBy(REDLINE)]
        // The disposition before the reply text: one a later round's line carried is named by its
        // new id, whatever its own thread's last reply says (#46, R1-5).
        : p.disposition === 'carried' && p.carried_to
          ? [`carried forward as ${p.carried_to} in round ${p.carried_to.slice(1).split('-')[0]}`, '']
          : [`already handled in round ${p.round}`, `: ${p.reply ? p.reply.body : p.disposition}`]
    return `- **${p.id}** ${postedText(`${p.title}: ${said}`)}${asWritten}`
  })
}

// Finish's sweep: the workflow picks the settled threads and the GitHub agent runs the one
// resolve-threads call; the script skips any thread with a comment that is not one of the ids,
// so a teammate's thread is never resolved whatever is passed. Only a handoff or a human
// summary sweeps, and only when the replies and commits are on GitHub (not a dry run, not
// `no push`); a capped run leaves every thread open. Returns null when no sweep ran, otherwise
// {resolved: [ids], open: [{id, reason}]} for the closing comment and the result. A thread the
// script reports already resolved (resolved by hand before Finish) is in neither list: this sweep
// did not resolve it, and it is not open.
async function sweepThreads(kind) {
  if (!(kind === 'handoff' || kind === 'human-summary') || !postToGitHub || !push) {
    return null
  }
  const candidates = threadCandidates()
  if (!candidates.length) {
    return null
  }
  const settled = candidates.filter((c) => c.settled)
  const byComment = Object.fromEntries(candidates.map((c) => [c.commentId, c]))
  const resolved = []
  if (settled.length) {
    const out = await run('finish', resolveThreadsPrompt(settled), {
      agentType: 'redline:redline-github', ...modelOpts('github'), label: 'resolve threads', phase: 'Finish', schema: SWEEP_SCHEMA,
    })
    if (out.error) {
      throw stageError('finish', `resolving the settled threads failed: ${out.error}`)
    }
    for (const r of out.resolved || []) {
      const c = byComment[r.id]
      if (c) {
        c.resolved = true
        resolved.push(c.id)
      }
    }
    for (const s of out.skipped || []) {
      const c = byComment[s.id]
      if (!c) {
        warnings.push(`finish: resolve-threads skipped comment ${s.id}, which no finding of this run posted: ${s.reason}`)
      } else if (/^already resolved/.test(s.reason)) {
        c.alreadyResolved = true
      } else {
        c.reason = /^last comment/.test(s.reason) ? 'a reply after Redline\'s' : /^opened by/.test(s.reason) ? 'not Redline\'s thread' : /^comment /.test(s.reason) ? 'a comment that is not Redline\'s' : 'no thread'
      }
    }
    for (const c of settled) {
      if (!c.resolved && !c.alreadyResolved && !c.reason) {
        c.reason = 'not resolved'
      }
    }
  }
  const open = candidates.filter((c) => !c.resolved && !c.alreadyResolved).map((c) => ({ id: c.id, reason: c.reason }))
  threadSweep = { resolved, open }
  return threadSweep
}

// The one line the handoff comment and the human summary carry about the sweep.
function threadsLine(threads) {
  if (!threads) {
    return ''
  }
  const n = threads.resolved.length
  const m = threads.open.length
  return `Resolved ${n} thread${n === 1 ? '' : 's'}; ${m} left open${m ? `: ${threads.open.map((o) => `${o.id} (${o.reason})`).join(', ')}` : ''}.`
}

// Finish's last step: commit the run's record, so a finished run leaves a clean tree. The replies
// and the closing comment are written after the round's last commit, and a round with no revise
// pass never committed its review at all. The status call only reports which of the record's
// paths no commit holds; the workflow picks what is staged, and commits only when there is any.
async function commitRecord() {
  const folders = unique(rounds.map((r) => `${r.specFolder}/redline/`))
  const start = snapshotStart.startsWith(`${repoRoot}/`) ? snapshotStart.slice(repoRoot.length + 1) : ''
  const status = await run('finish', recordStatusPrompt(unique(folders.concat(start ? [start] : []))), {
    agentType: 'redline:redline-github', ...modelOpts('github'), label: 'record files', phase: 'Finish', schema: FILE_OP_SCHEMA,
  })
  if (status.error) {
    throw stageError('finish', `listing the run record failed: ${status.error}`)
  }
  const listed = unique(status.files.map((path) => path.trim()).filter((path) => path !== ''))
  const inRecord = (path) => path === start || folders.some((folder) => path.startsWith(folder))
  const outside = listed.filter((path) => !inRecord(path))
  if (outside.length) {
    warnings.push(`record: git status listed ${outside.join(', ')}, outside the run record; not staged`)
  }
  const files = listed.filter(inRecord)
  if (!files.length) {
    log('record: every record file is already committed')
    return { committed: false, sha: '', pushed: false, files: [] }
  }
  const message = `redline: record the run's replies, reviews and handoff for PR #${pr} (#${issue})`
  const out = await run('finish', recordCommitPrompt(files, message), {
    agentType: 'redline:redline-github', ...modelOpts('github'), label: 'record commit', phase: 'Finish', schema: RECORD_SCHEMA,
  })
  if (out.error) {
    throw stageError('finish', `committing the run record failed: ${out.error}`, { files })
  }
  return { committed: out.committed, sha: out.sha, pushed: out.pushed, files, message }
}

// ---------------------------------------------------------------------------
// The loop.
// ---------------------------------------------------------------------------

function handoffResult(record, outcome) {
  const findingOf = (id) => compactFinding(record.findings.find((f) => f.id === id) || { id })
  // `forced` names the repository ask rule a finding is left to the person under (#49), or null.
  const forcedOf = (id) => (record.forced || {})[id] || null
  const judgmentCalls = outcome.pending.map((call) => ({ ...call, finding: findingOf(call.id), forced: forcedOf(call.id) }))
  // The drafts the stop raises (#95), each as the person is shown it; draftsNeeded is what the
  // relaunch answers in args.deferrals. A fix can still be built only at a stop the round reaches
  // before its first resolve: the plan dial's, and the one after shaping.
  const drafts = (outcome.drafts || []).map((d) => draftView(record, d, !outcome.afterApproval))
  const draftsNeeded = drafts.map((d) => d.id)
  if (outcome.kind === 'plan') {
    log(`round ${record.round}: the plan dial stops after shaping (${outcome.shaped.findings.length} dispositions, ${outcome.pending.length} to answer); the run ends here and resumes on relaunch`)
    return result('handoff', {
      handoffKind: 'plan',
      handoffRound: record.round,
      specFolder: record.specFolder,
      plan: outcome.shaped.findings.map((s) => ({ ...s, finding: findingOf(s.id), decidedBy: shaperOwner(s.decidedBy, passOf(record)), forced: forcedOf(s.id) })),
      deferredPlanned: outcome.shaped.deferred,
      judgmentCalls,
      drafts,
      draftsNeeded,
      unresolved: [],
      decisionsNeeded: outcome.pending.map((call) => call.id),
      approveWith: { approvedPlans: unique(approvedPlans.concat(passOf(record).planKey)) },
    })
  }
  log(`round ${record.round}: ${outcome.pending.length} judgment call(s)${drafts.length ? ` and ${drafts.length} deferred draft(s)` : ''} for the person; the run ends here and resumes on relaunch`)
  const roundDeclines = (outcome.shaped ? outcome.shaped.findings : []).filter((x) => x.disposition === 'decline' && !decisions[x.id]).map((x) => ({ id: x.id, title: findingOf(x.id).title || '', reason: (x.reason || '').trim() }))
  return result('handoff', {
    handoffKind: 'decisions',
    handoffRound: record.round,
    specFolder: record.specFolder,
    judgmentCalls,
    drafts,
    draftsNeeded,
    // What the shaper declined on its own in this round (#93), each with its reason: the skill
    // lists them after the calls, and a typed line overrules one before the relaunch. A finding the
    // person or autopilot decided is left out: an overrule is in the decisions the relaunch carries
    // and is applied there (#94, R2-15), and an answered call is the person's decision, posted as
    // theirs, whatever disposition a reshape gave its finding (#94, R8-6).
    // At a stop the round's first resolve has run before (the stop for a draft that resolve
    // wrote, #95; a reshape's after a bounced plan, or its resolve's), an
    // overrule would be applied at the round's first resolve, which ran before the stop, so the
    // relaunch would change earlier prompts and could lose the answer to the new call. Such a
    // stop lists no declines, and declinedAfterRun names them for the after-run door: a reply in
    // the thread and the human review pass (#94, R3-7).
    declined: outcome.afterApproval ? [] : roundDeclines,
    declinedAfterRun: outcome.afterApproval ? roundDeclines.map((x) => x.id) : [],
    unresolved: outcome.unresolved || [],
    // A disposition the person changed that the resolve agent could not turn into a task, with
    // the line as recorded and the agent's why: the skill asks the person to restate it, so its
    // id is a decision the stop needs (#94, R4-8).
    overridesUnresolved: (outcome.overridesUnresolved || []).map((item) => ({ id: item.id, title: findingOf(item.id).title || '', disposition: (decisions[item.id] || {}).disposition || '', notes: (decisions[item.id] || {}).notes || '', why: (item.why || '').trim() })),
    decisionsNeeded: outcome.pending.map((call) => call.id).concat((outcome.overridesUnresolved || []).map((item) => item.id)),
  })
}

// review dial: the findings as posted, for the person to pick from.
function reviewedResult(record, active, known, files) {
  log(`round ${record.round}: the review dial stops after posting (${active.length} findings to pick from); the run ends here and resumes on relaunch`)
  return result('reviewed', {
    reviewedRound: record.round,
    specFolder: record.specFolder,
    findings: active.map((f) => ({ ...f })),
    known: known.map(compactFinding),
    reviewFile: files[0],
    findingsFile: files[1],
    selectionNeeded: active.map((f) => f.id),
  })
}

try {
  // A changed workflow file and no pinned copy (#81): the relaunch would rerun recorded rounds
  // under the edited script, so it ends here, before any agent. The skill refuses the same state
  // from redline-prefs.sh run drift without launching; this is the second layer.
  if (drift.workflow && !drift.pinned) {
    return result('error', { stage: 'relaunch', error: `${drift.workflow} changed since this run launched, and the launch ran from the file itself, so no pinned copy exists; a relaunch would rerun recorded rounds under the edited script. Finish with a fresh run: /redline:redline ${pr}`, detail: {}, resumeFrom: null, ownCheck: false })
  }
  // /redline:redline-revise <pr> review <selector>: one revise pass over a teammate's review (#36).
  // The skill ingested the comments (redline-gh.sh human-review) and numbered them H<n>-k; the
  // reviewer owns every clear instruction, the author answers the rest, the fix diff gets one final
  // nit pass as a Redline round, and the pass ends with one summary comment: no handoff.
  if (humanRevise) {
    const { n, reviewer } = humanRevise
    const specFolder = humanRevise.specFolder || humanFolderFor(n)
    const record = {
      round: n, reviewed: 'human-review', specFolder, range: null, findings: humanRevise.findings, files: [],
      commentIds: humanRevise.commentIds, reviewPosted: humanRevise.posted,
      human: { n, reviewer, reviewIds: humanRevise.reviewIds, body: humanRevise.body },
    }
    rounds.push(record)
    const outcome = await revise(record, record.findings, 'human')
    if (outcome.handoff) {
      return handoffResult(record, outcome)
    }
    let nitPass = null
    let lastFixUnreviewed = false
    // The final nit pass reads the fixes, so it runs when the pass committed one, as the main loop
    // gates on fixedAny; the spec folder's own commit is no fix diff (#94, R4-12).
    if (outcome.fixed.length > 0) {
      // The final nit pass over the human fixes, as a Redline round: the next unposted number.
      const round = firstRound
      const range = { from: startSha, to: outcome.newHead }
      const source = passOf(record).title
      phase('Gather')
      const facts = await gather(round)
      if (push && facts.headRefOid !== range.to) {
        warnings.push(`round ${round}: GitHub head ${short(facts.headRefOid)} differs from local ${short(range.to)} after the push`)
      }
      phase('Re-review')
      const reviewOut = await review(round, 'final-nit-pass', range, facts, source)
      // A nit the reviewer reports though the pass reports correctness only is declined under the
      // pass's scope, as in a Redline run's final nit pass, never dropped (#94, R7-10).
      const considered = reviewOut.findings
      const known = considered.filter((f) => f.knownAs)
      const scoped = considered.filter((f) => !f.knownAs && f.category !== 'correctness')
      const active = considered.filter((f) => !f.knownAs && !scoped.includes(f))
      log(`round ${round} (final nit pass over ${source}): ${active.length} correctness, ${known.length} already tracked, ${scoped.length} nit(s) declined under ${scopeName(true)}`)
      phase('Post')
      const roundFolder = specFolderFor(round)
      const { posted, commentIds, files } = await post(round, 'final-nit-pass', range, roundFolder, { ...reviewOut, findings: considered, scoped }, active, known, source)
      const roundRecord = { round, reviewed: 'final-nit-pass', specFolder: roundFolder, range, findings: considered, scoped, outcomes: Object.fromEntries(scoped.map((f) => [f.id, declinedUnder(true)])), post: { dryRun: posted.dryRun, posted: posted.posted, skipped: posted.skipped, reviewId: posted.review.id, url: posted.review.html_url, movedToBody: posted.review.movedToBody }, reviewPosted: posted.posted || Boolean(posted.skipped), commentIds, files: files.slice(), prBody: facts.body || '', prUrl: facts.url || '' }
      rounds.push(roundRecord)
      // The pass's record and the items a commit named are kept for the summary, which reads them
      // once Finish has settled any held draft (#97, R4-7). A deferral's mitigation is unreviewed
      // code, so it still flags the fix; the summary names it with where it went, never as fixed.
      nitPass = { round, found: active.length, fixed: 0, record: roundRecord, fixedIds: [] }
      if (active.length) {
        const fix = await revise(roundRecord, active, 'correctness')
        if (fix.handoff) {
          return handoffResult(roundRecord, fix)
        }
        nitPass.fixed = fix.fixed.length
        nitPass.fixedIds = fix.fixed
        lastFixUnreviewed = nitPass.fixed > 0
      }
    }
    const finished = await finish('human-summary', record, (prBody, threads) => humanSummary(record, nitPass, threads))
    return result('done', {
      humanReview: { n, reviewer, reviewIds: record.human.reviewIds, specFolder, summaryPosted: finished.posted, summaryFile: `${specFolder}/redline/human-review-${n}-summary.md`, nitPassRound: nitPass ? nitPass.round : 0 },
      lastFixUnreviewed,
      handoffPosted: false,
      reviewRequested: false,
      note: 'One revise pass over a human review; the summary comment replaces the handoff, and no review was requested.',
    })
  }

  // /redline:redline-revise: one revise pass over findings an earlier review already posted.
  if (A.revise && typeof A.revise === 'object') {
    const round = Number(A.revise.round)
    if (!Number.isInteger(round) || round <= 0 || !Array.isArray(A.revise.findings)) {
      fail('args.revise needs round and findings (from <specFolder>/redline/round-<n>-findings.json)')
    }
    const specFolder = typeof A.revise.specFolder === 'string' && A.revise.specFolder !== '' ? A.revise.specFolder.replace(/\/+$/, '') : specFolderFor(round)
    const record = {
      round, reviewed: 'revise-only', specFolder, range: null, findings: A.revise.findings, files: [],
      commentIds: A.revise.commentIds && typeof A.revise.commentIds === 'object' ? A.revise.commentIds : {},
      reviewPosted: A.revise.posted === true,
    }
    // A link a findings file carries (#75) was kept by the run that wrote the file, against a
    // record this pass does not hold: a revise-only pass is given no earlier findings. So it is
    // held to what this run can show, like any other, and cleared with a warning otherwise.
    honourLinks(round, record.findings, true)
    rounds.push(record)
    const inScope = record.findings.filter((f) => !f.knownAs)
    const kind = inScope.some((f) => f.category === 'correctness') ? 'correctness' : 'nits'
    const outcome = await revise(record, inScope, kind)
    if (outcome.handoff) {
      return handoffResult(record, outcome)
    }
    // A revise-only pass ends here, so the drafts it held are raised and settled here (#95).
    stopForHeld()
    phase('Finish')
    await settleHeld()
    recordCommit = await commitRecord()
    return result('done', { reviseOnly: true, handoffPosted: false, reviewRequested: false, note: 'One revise pass; no re-review, handoff comment or review request.' })
  }

  let round = firstRound
  let range = { from: startSha, to: startSha }
  let finalPass = false

  for (;;) {
    const reviewed = round === firstRound ? 'pr' : finalPass ? 'final-nit-pass' : 'fix-diff'
    const specFolder = specFolderFor(round)

    phase('Gather')
    const facts = await gather(round)
    if (round === firstRound && facts.headRefOid !== startSha) {
      throw stageError('gather', `PR #${pr}'s head moved since launch (${short(facts.headRefOid)}, launched at ${short(startSha)})`)
    }
    if (round > firstRound && push && facts.headRefOid !== range.to) {
      warnings.push(`round ${round}: GitHub head ${short(facts.headRefOid)} differs from local ${short(range.to)} after the push`)
    }

    phase(round === firstRound ? 'Review' : 'Re-review')
    const reviewOut = await review(round, reviewed, range, facts)
    const considered = reviewOut.findings
    const known = considered.filter((f) => f.knownAs)
    // Under correctness only, a verified item that is not a correctness one is declined by the
    // workflow with the scope as its reason (#93): it stays a finding of the round, so a later
    // round collapses a repeat as settled, but it is never posted inline, shaped or replied to.
    // A final nit pass reports correctness only, so a nit its reviewer reports anyway is declined
    // the same way, under the pass's scope, never dropped (#94, R7-10).
    const scoped = scope === 'correctness' || reviewed === 'final-nit-pass' ? considered.filter((f) => !f.knownAs && f.category !== 'correctness') : []
    let active = considered.filter((f) => !f.knownAs && !scoped.includes(f))
    if (scoped.length) {
      log(`round ${round}: ${scoped.length} item(s) declined under ${scopeName(reviewed === 'final-nit-pass')} (correctness only): ${scoped.map((f) => f.id).join(', ')}`)
    }
    // The fix-diff rule (#95). The verifier states that a finding's cause is in the previous
    // round's fixes; the workflow honours that only where it can be true: on a round that read a
    // fix diff, for a file the previous round's plan named. A claim it cannot honour is cleared
    // with a warning before the review is posted, so the finding buys a round like any other. A
    // final nit pass reads nothing else and buys nothing, so its findings are left as stated.
    if (reviewed !== 'final-nit-pass') {
      const before = rounds.find((earlier) => earlier.round === round - 1)
      for (const f of active.filter((x) => x.inFixDiff)) {
        const why = reviewed !== 'fix-diff'
          ? 'this round reviewed the whole pull request, not a fix diff'
          : range.empty
            ? `round ${round - 1} changed no code, so this round had no fix diff`
            : underPaths(repoPath(f.file).path, (before && before.planPaths) || [])
              ? ''
              : `\`${f.file}\` is not among the paths round ${round - 1}'s plan named`
        if (why) {
          warnings.push(`round ${round}: the reviewer placed ${f.id} in the fix diff, but ${why}; it is treated as a finding in the pull request's own code, which buys a round`)
          f.inFixDiff = false
        }
      }
    }
    const coverageNote = reviewOut.coverage
      ? `, coverage ${reviewOut.coverage.candidates} candidates: ${reviewOut.coverage.counts.verified} verified, ${reviewOut.coverage.counts.unconfirmed} unconfirmed, ${reviewOut.coverage.counts.refuted} refuted, ${reviewOut.coverage.counts.duplicate + reviewOut.coverage.counts.settled} collapsed, ${reviewOut.coverage.counts.known} tracked`
      : ''
    log(`round ${round} (${reviewed}${coverageNote}): ${active.filter((f) => f.category === 'correctness').length} correctness, ${active.filter((f) => f.category === 'nit').length} nit, ${known.length} already tracked`)

    phase('Post')
    const { posted, commentIds, files } = await post(round, reviewed, range, specFolder, { ...reviewOut, findings: considered, scoped }, active, known)
    const record = { round, reviewed, specFolder, range: round === firstRound ? null : range, findings: considered, carried: reviewOut.carried || {}, resolvedPrior: reviewOut.resolved || [], scoped, outcomes: Object.fromEntries(scoped.map((f) => [f.id, declinedUnder(reviewed === 'final-nit-pass')])), coverage: reviewOut.coverage || null, setAsideCandidates: reviewOut.setAsideCandidates || [], post: { dryRun: posted.dryRun, posted: posted.posted, skipped: posted.skipped, reviewId: posted.review.id, url: posted.review.html_url, movedToBody: posted.review.movedToBody }, reviewPosted: posted.posted || Boolean(posted.skipped), commentIds, files: files.slice(), prBody: facts.body || '', prUrl: facts.url || '' }
    rounds.push(record)

    if (reviewOnly) {
      // The review-only run commits its record too (#10), so the next launch finds a clean tree.
      phase('Finish')
      recordCommit = await commitRecord()
      return result('review-only', { reviewFile: files[0], findingsFile: files[1] })
    }

    // review dial: after the round 1 review the person picks what to act on. The run ends here
    // until the relaunch carries args.selected; the rest of the findings are dropped with a reason.
    if (interrupt === 'review' && round === firstRound) {
      if (!selected) {
        return reviewedResult(record, active, known, files)
      }
      const act = new Set(selected.act)
      for (const id of selected.act.concat(Object.keys(selected.dropped))) {
        if (!active.some((f) => f.id === id)) {
          warnings.push(`round ${round}: args.selected names ${id}, which is not an open finding of this round`)
        }
      }
      record.dropped = active.filter((f) => !act.has(f.id)).map((f) => ({ ...f, reason: (selected.dropped[f.id] || '').trim() || 'Not selected for this run.' }))
      active = active.filter((f) => act.has(f.id))
      log(`round ${round}: ${personLabel} picked ${active.length} finding(s) to act on, ${record.dropped.length} dropped`)
      if (active.length === 0) {
        await replyStandalone(record)
        // "None was picked" only when findings were dropped: a round with nothing to pick has the
        // generic ending, as before #93 (#94, R8-7).
        const notPicked = record.dropped.length > 0
        const finished = await finish('handoff', record, (prBody, threads) => handoffComment({ notPicked }, prBody, threads))
        return result('done', { handoffPosted: finished.posted, reviewRequested: finished.reviewRequested, prBody: finished.prBody, note: notPicked ? 'No finding was selected to act on, so there was no revise pass.' : 'The round had no finding to pick, so there was no revise pass.' })
      }
    }
    const correctness = active.filter((f) => f.category === 'correctness')
    const nits = active.filter((f) => f.category === 'nit')
    // Fixed like a nit (#95): a correctness finding of low severity whose cause is in the previous
    // round's fix diff, the claim checked above. It is shaped and fixed with the round's other
    // correctness findings, buys no round, and is left out of the cap test below.
    const minor = reviewed === 'fix-diff' ? correctness.filter((f) => f.inFixDiff && f.severity === 'low') : []
    record.minor = minor.map((f) => f.id)
    const buying = correctness.filter((f) => !minor.includes(f))

    if (reviewed === 'final-nit-pass') {
      if (correctness.length === 0) {
        const finished = await finish('handoff', record, (prBody, threads) => handoffComment({}, prBody, threads))
        return result('done', { handoffPosted: finished.posted, reviewRequested: finished.reviewRequested, prBody: finished.prBody })
      }
      // One more pass over what it found, then stop regardless. The shaper decides each item, so the
      // handoff counts what a commit fixed, and only a fix is flagged as not re-reviewed.
      const outcome = await revise(record, correctness, 'correctness')
      if (outcome.handoff) {
        return handoffResult(record, outcome)
      }
      const final = { found: correctness.length, fixed: outcome.fixed.length }
      const finished = await finish('handoff', record, (prBody, threads) => handoffComment({ final }, prBody, threads))
      return result('done', { ...(final.fixed ? { lastFixUnreviewed: true } : {}), handoffPosted: finished.posted, reviewRequested: finished.reviewRequested, prBody: finished.prBody })
    }

    // Nothing new to decide: the round verified nothing, or only what the scope declined.
    if (active.length === 0) {
      await replyStandalone(record)
      const finished = await finish('handoff', record, (prBody, threads) => handoffComment({}, prBody, threads))
      return result('done', { handoffPosted: finished.posted, reviewRequested: finished.reviewRequested, prBody: finished.prBody })
    }

    // The cap counts this run's rounds, from its first. A round past it whose only correctness
    // findings are fixed like a nit goes on to its fixes and its final nit pass, as a round of
    // nits does (#95); the comment of a capped run lists every open correctness finding.
    if (buying.length && round - firstRound + 1 > maxRounds) {
      const finished = await finish('cap-hit', record, () => capComment(correctness))
      return result('capped', { openFindings: correctness.map(compactFinding), capCommentPosted: finished.posted })
    }

    const inScope = correctness.length ? correctness.concat(nits) : nits
    const outcome = await revise(record, inScope, correctness.length ? 'correctness' : 'nits')
    if (outcome.handoff) {
      return handoffResult(record, outcome)
    }
    // What comes next (#93). A round that bought another gets a full round: the coverage pass over
    // the whole PR at the new head, verify, and the recheck of the fix diff when a commit fixed
    // something. A round that bought nothing ends: at the handoff when no fix was committed, after
    // one final nit pass over the fixes when one was, which reads those fixes only and reports only
    // correctness bugs they introduced, so nits never buy a round. With the coverage pass off there
    // is no pass to rerun, so a bought round that changed no code ends the run too.
    const fixedAny = outcome.fixed.length > 0
    if (outcome.bought && (coverageOn || fixedAny)) {
      finalPass = false
    } else if (!fixedAny) {
      const noRecheck = outcome.bought
      // A round whose correctness items included low-severity bugs in the previous round's fixes,
      // handled like nits, bought nothing and changed nothing: the handoff names them, since the
      // generic sentence says the round verified nothing to fix or ask about (#97, R2-16).
      const likeNits = !noRecheck && (record.minor || []).length > 0
      const finished = await finish('handoff', record, (prBody, threads) => handoffComment(noRecheck ? { noRecheck: true } : likeNits ? { likeNits: true } : {}, prBody, threads))
      return result('done', { handoffPosted: finished.posted, reviewRequested: finished.reviewRequested, prBody: finished.prBody, note: noRecheck ? 'The last revise pass changed no code, and with the coverage pass off there was nothing further to review.' : 'The last revise pass committed no fix, so there was no fix diff to re-review.' })
    } else {
      finalPass = true
    }
    range = { from: range.to, to: outcome.newHead || range.to, ...(fixedAny ? {} : { empty: true }) }
    round += 1
  }
} catch (error) {
  // The end-of-run stop for held drafts (#95) is a hand-off, not an error.
  if (error && error.handoffResult) {
    return error.handoffResult
  }
  log(`stopped: ${error.message}`)
  // The step a resume reruns from (#10): the agent label the error names, with the attempt the
  // relaunch would be. A gather error (the head moved, the PR is not open, the branch is wrong)
  // and an error with no agent behind it are not resumable: the next launch is a fresh run.
  const resumable = error.stage && error.stage !== 'gather' && error.label && !error.fresh
  const resumeFrom = resumable ? { label: error.label, attempt: (resume[error.label] ? resume[error.label].attempt : 1) + 1 } : null
  // Whether the stop was the workflow's own check of what the step's agent returned (#116),
  // which needs no hand fix before the relaunch: the skill says so, and passes it back in the
  // resume entry.
  return result('error', { stage: error.stage || 'workflow', error: error.message, detail: error.extra || {}, resumeFrom, ownCheck: Boolean(resumable && error.ownCheck) })
}
