export const meta = {
  name: 'redline-loop',
  description: 'Redline: review a pull request, post the review, shape and implement the fixes through Agent OS, check, push, reply and re-review until no correctness bugs remain',
  whenToUse: 'Launched only by the /redline:redline skill (and its /redline:redline-review and /redline:redline-revise variants), which builds args from the repository\'s .claude/redline.json and the command line. Never launched by hand.',
  phases: [
    { title: 'Gather', detail: 'PR facts through redline-gh.sh (GitHub agent)' },
    { title: 'Review', detail: 'the first round: the whole PR (reviewer, first-round model)' },
    { title: 'Re-review', detail: 'later rounds: the fix diff only (reviewer, later-round model)' },
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
const PRIOR_DISPOSITIONS = ['fixed', 'deferred', 'decided', 'dropped', 'carried', 'left', 'none', 'not-changed']
const CARRY = ['none', 'not-changed']
const priorFindings = A.priorFindings === undefined ? [] : A.priorFindings
if (!Array.isArray(priorFindings)) {
  fail('args.priorFindings must be the list redline-gh.sh prior-findings prints, or []; got ' + JSON.stringify(A.priorFindings))
}
for (const p of priorFindings) {
  const m = p && typeof p === 'object' && typeof p.id === 'string' ? /^R(\d+)-\d+$/.exec(p.id) : null
  if (!m || Number(m[1]) >= firstRound) {
    fail(`args.priorFindings must list findings of the rounds before ${firstRound}, each with an id R<round>-<n>; got ${JSON.stringify(p && p.id)}`)
  }
  if (!PRIOR_DISPOSITIONS.includes(p.disposition) || !Number.isInteger(p.comment_id)) {
    fail(`args.priorFindings: ${p.id} needs a disposition in ${PRIOR_DISPOSITIONS.join(' | ')} and an integer comment_id; got ${JSON.stringify(p.disposition)}, ${JSON.stringify(p.comment_id)}`)
  }
}
const carryList = priorFindings.filter((p) => CARRY.includes(p.disposition))
const trackedList = priorFindings.filter((p) => !CARRY.includes(p.disposition))
const priorById = Object.fromEntries(priorFindings.map((p) => [p.id, p]))
const maxPlanAdjustments = Number.isInteger(A.maxPlanAdjustments) && A.maxPlanAdjustments >= 0 ? A.maxPlanAdjustments : 2
// Repository ask rules (#49): what a person is always brought in for, declared as askRules in the
// repository's .claude/redline.json and passed by the skill at launch (the workflow reads no
// file). A finding a rule covers is the person's to act on, never fixed or deferred by Redline.
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
// Finding scope: 'all' reviews for correctness bugs and nits; 'correctness' never looks for nits,
// and a round without a correctness finding is done (no final nit pass).
if (A.scope !== undefined && A.scope !== 'all' && A.scope !== 'correctness') {
  fail(`args.scope must be "all" or "correctness"; got ${JSON.stringify(A.scope)}`)
}
const scope = A.scope === 'correctness' ? 'correctness' : 'all'
// Who decided what. A person's decision is attributed to their GitHub login (args.login, from
// redline-gh.sh login); the shaper's own, settled from evidence, to "redline"; a recommendation
// taken on autopilot to "redline (autopilot)".
const login = typeof A.login === 'string' ? A.login.trim().replace(/^@/, '') : ''
const personLabel = login ? `@${login}` : 'the author'
const REDLINE = 'redline'
const AUTOPILOT = 'redline (autopilot)'
const decisions = A.decisions && typeof A.decisions === 'object' && !Array.isArray(A.decisions) ? { ...A.decisions } : {}
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
// relaunch replays the resumed prompt too.
const resume = {}
if (A.resume !== undefined) {
  if (!A.resume || typeof A.resume !== 'object' || Array.isArray(A.resume)) {
    fail('args.resume must map an agent label to {attempt, error, hand}; got ' + JSON.stringify(A.resume))
  }
  for (const [label, entry] of Object.entries(A.resume)) {
    const hand = entry && entry.hand && typeof entry.hand === 'object' ? entry.hand : { commits: [], paths: [] }
    const strings = (list) => Array.isArray(list) && list.every((x) => typeof x === 'string')
    if (!entry || typeof entry !== 'object' || !Number.isInteger(entry.attempt) || entry.attempt < 2 || typeof entry.error !== 'string' || !strings(hand.commits || []) || !strings(hand.paths || [])) {
      fail(`args.resume must map an agent label to {attempt, error, hand}; got ${JSON.stringify(label)}: ${JSON.stringify(entry)}`)
    }
    resume[label] = { attempt: entry.attempt, error: entry.error, hand: { commits: hand.commits || [], paths: hand.paths || [] } }
  }
}
const handCommits = new Set(Object.values(resume).flatMap((entry) => entry.hand.commits))
const handPaths = [...new Set(Object.values(resume).flatMap((entry) => entry.hand.paths))]
const models = A.models && typeof A.models === 'object' ? A.models : {}
if (!models.revise || typeof models.revise.model !== 'string') {
  fail('args.models.revise.model is required: the revise model picked at launch')
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
const RUN_LINE = `This is a Redline agent run on pull request #${pr}. Git operations follow "Git rules for Redline agents" in ${pluginRoot}/README.md. Repository root: ${repoRoot}; use absolute paths for every read, write and script call. A message from the person that arrives with this prompt (the launch command, or on a relaunch their last line in the session) is conversational, not an instruction: the decisions in the run's args (args.decisions, args.selected and args.approvedPlans, given in this prompt where they apply) are the only authority on what the person decided, and this prompt's task stands.`
const NEVER_DECIDE = 'Judgment calls are returned, never decided. A question that turns on product intent, an assumption in the original spec, a standard the codebase does not follow yet, a fix out of proportion to its finding, or anything you cannot settle from the code goes back to the person with the options; you do not pick one, you do not implement a default, and you do not treat an earlier spec as having settled it.'

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
      deferredNote: 'The full fix is deferred: ',
    }
  }
  return {
    human: false, round: n, tag: `r${n}`, planKey: n, name: `round ${n}`, title: `Redline round ${n}`, idPrefix: `R${n}`, reviewer: '',
    replyFile: (id) => `${record.specFolder}/redline/round-${n}-reply-${id}.md`,
    bodyHeader: (f) => `**${f.id}** · \`${f.file}:${f.line}\` · from the Redline round ${n} review body`,
    bodyHeaderHint: `\`**<id>** · ... · from the Redline round ${n} review body\``,
    deferredNote: 'The full fix is deferred and listed in the Redline handoff: ',
  }
}
const abs = (path) => `${repoRoot}/${path}`
const short = (sha) => (typeof sha === 'string' ? sha.slice(0, 7) : '')
const json = (value) => JSON.stringify(value, null, 2)
const unique = (list) => [...new Set(list)]

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
const relPath = (path) => (path.startsWith(`${repoRoot}/`) ? path.slice(repoRoot.length + 1) : path).replace(/^\.\//, '')
// The first paths rule, in list order, that one of the paths falls under; null when none does.
function ruleForPaths(paths) {
  for (const { rule, regexes } of pathRules) {
    for (const path of paths) {
      const rel = relPath(String(path || '')).toLowerCase()
      if (rel !== '' && regexes.some((re) => re.test(rel))) {
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
  ? `\nRepository ask rules, as JSON: what a person is always brought in for, declared in .claude/redline.json. A finding one covers (its file or its fix under a paths rule, or its change doing what a prose rule's sentence says) is the person's to act on, never fixed or deferred by Redline: in the shaper's JSON it is ask with why_human "repository rule <id>", askRule set to the id, its story quoting the rule's reason and its recommendation what the person would do themselves; every finding's JSON lists files, the paths its task would touch, so the workflow can apply the paths rules. The plan approver bounces a task that writes under a paths rule or fixes a finding a prose rule covers. No Redline role may write under a paths rule; the guard refuses it.\n${json(askRules)}\n`
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

// The one line a resume adds to the resumed agent's prompt, and the shaper's replace sentence: the
// failed attempt's spec files are rewritten, never appended to, and redline/ is never touched (#10).
function resumeLine(opts) {
  const entry = resume[opts.label]
  const shaper = opts.agentType === 'redline:redline-shaper'
    ? ' Rewrite plan.md, shape.md, standards.md and references.md in the spec folder from scratch, replacing what the earlier attempt wrote; never change or remove anything under its redline/ folder.'
    : ''
  return `\n\nResume attempt ${entry.attempt} of this step. The run stopped at this step with an error (${entry.error}); the person has since fixed the cause by hand. Do the step again from the current state of the repository and the PR. What an earlier attempt already made stands (a commit, a posted review or reply, a written file), and the duplicate checks in your instructions apply.${shaper}`
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
  required: ['id', 'file', 'line', 'side', 'category', 'severity', 'confidence', 'title', 'description', 'proposedFix', 'needsDecision', 'knownAs', 'carriedFrom'],
  properties: {
    id: str,
    file: str,
    line: int,
    side: { type: 'string', enum: ['RIGHT', 'LEFT'] },
    category: { type: 'string', enum: ['correctness', 'nit'] },
    severity: { type: 'string', enum: ['high', 'medium', 'low'] },
    confidence: { type: 'string', enum: ['confirmed', 'likely', 'unsure'] },
    title: str,
    description: str,
    proposedFix: str,
    needsDecision: bool,
    knownAs: str,
    carriedFrom: str,
    // The id of a repository ask rule the reviewer judges the finding to be under (#49);
    // advisory: the review marks it, and the shaper applies the rules.
    askRule: str,
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  required: ['round', 'reviewed', 'findings', 'resolved', 'summary'],
  properties: {
    round: int,
    reviewed: { type: 'string', enum: ['pr', 'fix-diff', 'final-nit-pass'] },
    findings: { type: 'array', items: FINDING_SCHEMA },
    resolved: { type: 'array', items: { type: 'object', required: ['id', 'why'], properties: { id: str, why: str } } },
    summary: str,
  },
}

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

const JUDGMENT_CALL_SCHEMA = {
  type: 'object',
  required: ['id', 'title', 'story', 'why_human', 'options', 'recommendation', 'dependsOn'],
  properties: {
    id: str,
    title: str,
    story: str,
    // The fixed reasons, plus one per repository ask rule (#49).
    why_human: { type: 'string', enum: ['product decision', 'spec assumption', 'new standard', 'unsure', 'disproportionate fix'].concat(askRules.map((rule) => `repository rule ${rule.id}`)) },
    options: {
      type: 'array',
      items: { type: 'object', required: ['label', 'cost', 'effect'], properties: { label: str, cost: str, effect: str } },
    },
    recommendation: str,
    dependsOn: strings,
  },
}

const DEFERRED_SCHEMA = {
  type: 'array',
  items: { type: 'object', required: ['id', 'mitigation', 'fullFix'], properties: { id: str, mitigation: str, fullFix: str } },
}

const SHAPE_SCHEMA = {
  type: 'object',
  required: ['specFolder', 'findings', 'deferred', 'judgmentCalls'],
  properties: {
    specFolder: str,
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'disposition', 'decidedBy', 'recommendation'],
        properties: {
          id: str,
          // A Redline round sorts into fix, defer or ask. A human review pass sorts into fix, ask or
          // none (a comment that asks for nothing); never defer, since nothing a teammate asked for
          // is deferred by Redline on its own. The workflow refuses the other pass's values.
          disposition: { type: 'string', enum: ['fix', 'defer', 'ask', 'none'] },
          // "redline" for a fix or defer settled from the evidence; "pending" for an ask, which
          // the workflow fills with the person's login or "redline (autopilot)"; "reviewer" for a
          // fix a teammate's comment asked for, which the workflow maps to their login.
          decidedBy: { type: 'string', enum: ['redline', 'pending', 'reviewer'] },
          // One sentence: the change planned for a fix, the mitigation for a defer, the
          // recommended option for an ask. The plan dial shows it to the person.
          recommendation: str,
          // The paths the finding's task would touch, and the repository ask rule the shaper
          // judged it under (#49); forceAskRules reads both.
          files: strings,
          askRule: str,
        },
      },
    },
    deferred: DEFERRED_SCHEMA,
    judgmentCalls: { type: 'array', items: JUDGMENT_CALL_SCHEMA },
  },
}

const RESOLVE_SCHEMA = {
  type: 'object',
  required: ['specFolder', 'tasks', 'deferred', 'unresolved'],
  properties: {
    specFolder: str,
    tasks: {
      type: 'array',
      items: { type: 'object', required: ['n', 'title', 'files', 'finding'], properties: { n: int, title: str, files: strings, finding: str } },
    },
    deferred: DEFERRED_SCHEMA,
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
    result: {
      type: ['object', 'null'],
      properties: {
        mode: str,
        ok: bool,
        checks: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'exit', 'recorded'],
            properties: { name: str, cmd: str, exit: int, recorded: bool, stdout: str, stderr: str },
          },
        },
        git: {
          type: ['object', 'null'],
          properties: {
            start_sha: str,
            allowed: strings,
            changed_files: strings,
            unexpected_files: strings,
            uncommitted: strings,
            commits: { type: 'array', items: { type: 'object', properties: { sha: str, message: str } } },
            diff_lines: int,
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
  const decision = f.needsDecision ? ' · needs a decision' : ''
  // The suffixes redline-gh.sh prior-findings reads back, in this order: carried_from (#35), then
  // the repository ask rule the finding is the person's under (#49), which stays last.
  const carried = f.carriedFrom ? ` · first reported as ${f.carriedFrom}` : ''
  const rule = ruleOf(f)
  const yours = rule ? ` · yours under rule ${rule.id}` : ''
  return `- **${f.id}** · ${f.category} · ${f.severity} · ${f.confidence} · \`${f.file}:${f.line}\` · ${f.title}${decision}${carried}${yours}`
}

// `source` names the pass whose fixes a final nit pass reads when it is not the previous round (the
// fixes of a human review pass, #36); empty for a Redline round's nit fixes.
function reviewBody(round, reviewed, range, review, active, known, source) {
  const earlier = firstRound === 2 ? ' Round 1 is already on this PR' : ` Rounds 1 to ${firstRound - 1} are already on this PR`
  const scope = reviewed === 'pr'
    ? `Reviewed the whole pull request.${firstRound > 1 ? `${earlier}; this run starts at round ${firstRound}.` : ''}`
    : reviewed === 'fix-diff'
      ? `Reviewed only the fix diff from round ${round - 1} (${short(range.from)}..${short(range.to)}).`
      : `Final nit pass: reviewed only the ${source ? `fixes from ${source}` : 'nit fixes'} (${short(range.from)}..${short(range.to)}) for correctness bugs they introduced.`
  const fresh = active.filter((f) => !f.carriedFrom)
  const carried = active.filter((f) => f.carriedFrom)
  const counts = (list) => `${list.filter((f) => f.category === 'correctness').length} correctness, ${list.filter((f) => f.category === 'nit').length} nit`
  const lines = [`Redline round ${round}`, '', scope, '', review.summary.trim(), '']
  if (active.length === 0) {
    lines.push('No findings.')
  }
  if (fresh.length) {
    lines.push(`### Findings (${counts(fresh)})`, '', ...fresh.map(findingLine))
  }
  // Earlier rounds' findings with no disposition, re-verified and carried into this round (#35).
  if (carried.length) {
    lines.push(...(fresh.length ? [''] : []), `### Carried forward from earlier rounds (${counts(carried)})`, '', ...carried.map(findingLine))
  }
  const resolved = review.resolved || []
  if (resolved.length) {
    lines.push('', '### Resolved from earlier rounds', '', ...resolved.map((r) => `- **${r.id}** ${priorById[r.id] ? priorById[r.id].title : ''}: ${r.why}`))
  }
  if (known.length) {
    lines.push('', '### Already tracked', '', ...known.map((f) => `- **${f.id}** ${f.title}: ${f.knownAs}${f.carriedFrom ? ` · first reported as ${f.carriedFrom}` : ''}`))
  }
  if (active.length) {
    lines.push('', 'Each finding has an inline comment with the detail or, where GitHub could not anchor it, sits under Not placed inline below. Redline replies in the finding\'s thread, or in a PR comment that opens with its marker, once the round\'s fixes are committed.')
  }
  return lines.join('\n')
}

function commentBody(f) {
  const lines = [`**${f.id}** · ${f.category} · ${f.severity} · ${f.confidence}`, '', `**${f.title}**`]
  if (f.carriedFrom) {
    lines.push('', `First reported as ${f.carriedFrom} in Redline round ${priorById[f.carriedFrom] ? priorById[f.carriedFrom].round : f.carriedFrom.slice(1).split('-')[0]}.`)
  }
  lines.push('', f.description.trim())
  if (f.proposedFix && f.proposedFix.trim() !== '') {
    lines.push('', `Proposed fix: ${f.proposedFix.trim()}`)
  }
  if (f.needsDecision) {
    lines.push('', 'This needs a decision from the author; Redline does not decide it.')
  }
  const rule = ruleOf(f)
  if (rule) {
    lines.push('', `This one is yours to act on: repository rule ${rule.id} (${rule.reason}).`)
  }
  return lines.join('\n')
}

// A decision as it reaches GitHub: the session's one-sentence restatement (choice and reasoning),
// never the person's chat. The choice label stands in only when a decision carries no notes.
function decisionSentence(decision) {
  const notes = (decision.notes || '').trim()
  return notes !== '' ? notes : `The author chose: ${decision.choice}.`
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

// autopilot: the shaper's recommendation becomes the decision, attributed to the autopilot.
function autopilotDecision(call) {
  const recommendation = (call.recommendation || '').trim().replace(/\.$/, '')
  return {
    choice: recommendation,
    notes: `Autopilot took the shaper's recommendation: ${recommendation}.`,
    date: launchDate,
    decidedBy: AUTOPILOT,
  }
}

// autopilot on a finding a repository ask rule covers (#49): nothing is applied; the finding is
// left to the person, with the rule as the reason.
function leftDecision(forced) {
  return {
    choice: 'Left to the person',
    notes: `Repository rule ${forced.rule}: ${forced.reason}. No change made; the person makes it.`,
    date: launchDate,
    decidedBy: AUTOPILOT,
    rule: forced.rule,
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

// Every commit that carries part of a finding's fix: its own commit, and the standards commit when
// the plan sent part of the fix through the retrospective.
function replyBody(pass, outcome) {
  const local = push ? '' : ' Committed locally; not pushed.'
  const commits = andList(outcome.commits.map((c) => `${short(c.sha)} (${c.message})`))
  const owner = decidedBy(outcome.decidedBy)
  switch (outcome.kind) {
    case 'fixed':
      return `${pass.title}: fixed in ${commits}.${local}${owner}`
    case 'deferred':
      return `${pass.title}: ${commits ? `mitigated in ${commits}` : `mitigated: ${outcome.mitigation}`}. ${pass.deferredNote}${outcome.fullFix}${commits ? local : ''}${owner}`
    case 'decided':
      return `${pass.title}: ${decisionSentence(outcome)}${commits ? ` Applied in ${commits}.${local}` : ' No code change.'}${owner}`
    case 'left':
      return `${pass.title}: left to the author under repository rule ${outcome.rule} (${outcome.reason}). ${outcome.notes}${owner}`
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
function reviewPrompt(round, reviewed, range, facts, history, source) {
  const diff = reviewed === 'pr'
    ? `the whole pull request: \`${GH} diff ${pr}\``
    : `only the fix diff: \`git diff ${range.from}..${range.to} -- ':/' ':(top,exclude)agent-os/specs'\` (the pathspec works from any directory in the repository and leaves out the round's spec folders, which are Redline's own record; do not review them)`
  const after = reviewed === 'pr' ? ` (${startSha})` : ` after the ${source || `round ${round - 1}`} fixes (HEAD ${range.to})`
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
    lines.push('', 'Findings from earlier rounds and what became of them (never re-raise a declined, deferred or decided one):', json(history))
  }
  // The PR's earlier Redline rounds, from an earlier run (#35): tracked ones are matched into
  // knownAs; undispositioned ones are re-verified and carried or resolved, never dropped.
  const priorBlock = reviewed === 'pr' && priorFindings.length
  if (priorBlock && trackedList.length) {
    lines.push('', 'Findings Redline\'s earlier rounds on this PR already handled (a match goes in knownAs as "<id>: <disposition>"; never re-raise one):', json(trackedList.map((p) => ({ id: p.id, round: p.round, category: p.category, title: p.title, file: p.file, line: p.line, disposition: p.disposition, reply: p.reply ? p.reply.body : '' }))))
  }
  if (priorBlock && carryList.length) {
    lines.push('', 'Findings from earlier rounds with no disposition. Re-verify each against the current head, never copy its text: one that still holds is a finding of this round with carriedFrom set to its id (a fresh description, file and line); one the code no longer has goes in resolved with why. Every id here appears in exactly one of the two:', json(carryList.map((p) => ({ id: p.id, round: p.round, category: p.category, severity: p.severity, title: p.title, file: p.file, line: p.line, body: p.body }))))
  }
  if (askRules.length) {
    lines.push('', 'Repository ask rules, as JSON: what a person is always brought in for, declared in .claude/redline.json. Report a finding one covers (its file under a paths rule, or its change doing what a prose rule\'s sentence says) as usual, with askRule set to the rule\'s id; the review then marks it as the person\'s to act on. The tag is advisory: the shaper applies the rules.', json(askRules))
  }
  lines.push(
    '',
    `Before you report anything, run the known-finding check your instructions describe: \`${GH} issues-search "<keywords>"\` for each candidate finding, \`${GH} review-comments ${pr}\`, \`${GH} pr-comments ${pr}\`, and the spec folders ${repoRoot}/agent-os/specs/*-${pr}-review-round-*/ and ${repoRoot}/agent-os/specs/*-${pr}-human-review-*/. A known finding goes in knownAs.${priorBlock ? " Redline's own earlier rounds on this PR are the lists above: match against them, not against their review comments." : ''}`,
  )
  if (reviewed === 'final-nit-pass') {
    lines.push('', 'This is the final nit pass. Report only correctness bugs introduced by this diff. Do not report nits, and do not report anything the diff did not introduce.')
  } else if (scope === 'correctness') {
    lines.push('', 'Scope: correctness only. Do not look for nits at all, and report none: no naming, clarity, docblock or test-tightness findings. Report only correctness bugs (wrong behaviour reachable in practice, data loss, a security hole, a broken contract), and spend the time a nit pass would take on reproducing the candidates you have.')
  }
  lines.push('', NEVER_DECIDE + ' Report such a finding with needsDecision true and the question stated plainly.', '', `Return only the JSON your instructions specify, with round ${round} and reviewed "${reviewed}".`)
  return lines.join('\n')
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

Sort each finding into fix, defer or ask per the unattended-mode section and your rules. Investigate first: open the files named, their callers and tests, and the standards and specs you cite. ${NEVER_DECIDE} A finding with needsDecision true is a judgment call unless your investigation shows the question does not arise. A question the PR description, the original spec or the code's own docblock already answers is answered from that evidence and recorded under Unattended answers, never escalated. Every task names every file it creates or changes, by path. Every decided entry under Decisions in shape.md (a fix, a defer, an unattended answer) ends with the line \`Decided by: redline\`; a pending entry has no such line until the person or the autopilot decides it. Write plan.md, shape.md, standards.md and references.md into the spec folder with Write. Do not edit any source file and never run a git write or gh.

Return only the JSON object your instructions specify: specFolder, findings (for every finding above: id, disposition, decidedBy "redline" for fix and defer or "pending" for ask, and recommendation in one sentence: the change planned for a fix, the mitigation for a defer, the option you recommend for an ask), deferred (one entry per defer finding), judgmentCalls (one entry per ask finding, in the order the person should answer them, each with dependsOn).`
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

Return only the JSON object your instructions specify: specFolder, findings (for every finding above: id, disposition fix, ask or none, decidedBy "reviewer" for fix, "pending" for ask or "redline" for none, and recommendation in one sentence: the change planned for a fix, the option you recommend for an ask, why nothing is asked for a none), deferred (always empty), judgmentCalls (one entry per ask finding, in the order the author should answer them, each with dependsOn).`
}

function reshapePrompt(pass, specFolder, inScope, adjustments, attempt) {
  return `This is a Redline run; follow shape-spec in unattended mode.

${RUN_LINE}

You are the shaper for ${pass.name}, called again because the plan approver bounced the plan (adjustment ${attempt} of at most ${maxPlanAdjustments}). The spec folder ${abs(specFolder)}/ already exists: read plan.md, shape.md, standards.md and references.md and correct them in place with Write. Do not create a second folder and do not touch its redline/ subfolder. Your scratch Pest test, if you need one: ${scratchTest('shaper', pass.tag)}.${pass.human ? ` This is a pass over ${pass.reviewer}'s review: dispositions stay fix, ask or none, never defer, and a fix is decided by ${pass.reviewer} (decidedBy "reviewer").` : ''}${rulesBlock}

The approver's adjustments, as JSON:
${json(adjustments)}

The round's findings, as JSON:
${json(inScope)}

Apply each adjustment, or record in shape.md why it cannot be applied. Every task still names its files by path. Decisions already recorded as decided in shape.md stay as they are. ${NEVER_DECIDE} An adjustment that would need a new decision becomes a judgment call, never a quiet change.

Return only the JSON object your instructions specify for the whole round (every finding above with id, disposition, decidedBy and recommendation; the deferred list; and every judgment call still pending or newly raised, in asking order with dependsOn).`
}

function resolvePrompt(pass, specFolder, calls, roundDecisions, overrides) {
  const callDecisions = Object.fromEntries(calls.map((call) => [call.id, roundDecisions[call.id]]).filter(([, d]) => d))
  const overrideDecisions = Object.fromEntries(overrides.map((f) => [f.id, roundDecisions[f.id]]))
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
      ? [`- A decision carrying \`rule\` is on a finding a repository ask rule covers, left to the person (#49): whatever its choice, no task writes anything. Its plan task becomes "Left to the person: <id> (repository rule <rule>)" with no files, or "Accepted, no change: <id>" when the choice is to accept; its Decisions entry records the choice and the notes with its owner; and the finding goes under Deferred in shape.md with the mitigation "none (repository rule <rule>)" and the shaper's recommendation as the full fix.`]
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
    )
  }
  if (overrides.length) {
    lines.push(
      '',
      `Disposition overrides, as JSON: findings that were not judgment calls, whose disposition the person changed after seeing the shaper's plan. Each carries the new disposition (fix: plan the full fix as a task, files by path and the test that proves it; defer: plan the mitigation the notes describe as a task and add the finding under Deferred in shape.md with the full fix left open; accept: no change, the finding's task becomes "Accepted, no change: <id>"), with notes (the person's reasoning, one sentence) and the owner:`,
      json(overrideDecisions),
    )
  }
  lines.push(
    '',
    `${NEVER_DECIDE} You apply the decisions verbatim. A decision that is missing, names an option that does not exist, or is too unclear to turn into a task stays pending and goes under unresolved. A standards retrospective item in shape.md that the shaper held for one of these decisions is drafted now, as your instructions say, for the standards approver to judge.`,
    '',
    'Return only the JSON your instructions specify.',
  )
  return lines.join('\n')
}

function planPrompt(pass, specFolder, inScope, shaped, roundDecisions, adjustment, earlierPaths) {
  const humanNote = pass.human
    ? `\nThis is a pass over ${pass.reviewer}'s review (#36): every finding is one of their comments, a fix is decided by them (decidedBy "reviewer"), a none finding asks for nothing and has no task, and no finding is deferred by the shaper; a disposition of defer here is a bounce.\n`
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

Check the plan per your instructions. ${NEVER_DECIDE} A task that turns a still-pending decision into a change is a bounce, and you never decide one yourself. planPaths must list every path the tasks create or change (directories end in /), including the spec folder ${specFolder}/; it becomes the allowed-path list the checker enforces.

Return only the JSON your instructions specify.`
}

function standardsPrompt(pass, specFolder) {
  return `${RUN_LINE}

You are the standards approver for ${pass.name}. Spec folder: ${abs(specFolder)}/. Read its shape.md section "Standards retrospective (proposed)" and decide each proposed edit per your instructions.

${NEVER_DECIDE} A proposed edit that depends on a pending decision is returned under deferred.

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

Dispositions and deferred items (a defer task ships only the mitigation${pass.human ? '; a none finding has no task' : ''}), as JSON:
${json({ findings: ctx.shaped.findings, deferred: ctx.deferred })}

Decisions made outside the shaper (already in the spec; decidedBy names the owner, the person or the autopilot): ${Object.keys(ctx.roundDecisions).length ? json(ctx.roundDecisions) : 'none'}

The plan approver's notes: ${ctx.plan.notes || 'none'}
Allowed paths (the checker refuses anything else): ${json(ctx.allowed)}

Approved standards edits (apply only these, in their own commit after the finding commits), as JSON:
${json(ctx.standards.approved.filter((edit) => !edit.alreadyCovered))}
The standards commit's message names every finding whose fix one of these edits carries, as shape.md's plan for that finding says (for example \`redline: record the ${pass.name} ${pass.human ? '' : 'review '}lessons in the standards, finishing ${pass.idPrefix}-1 (#${issue})\`), so that finding's reply names both of its commits. An edit that is only a lesson names no finding.
${ctx.standards.approved.length === 0 || ctx.standards.noChanges ? 'Nothing approved: record "Standards retrospective: no changes" under Decisions in shape.md.' : ''}

${NEVER_DECIDE} A Pending decision task is not implemented; a question that comes up while you build goes under blocked with the options. Never push.
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

function pushReplyPrompt(pass, specFolder, replies, doPush) {
  const step1 = doPush
    ? `Step 1. Push: run \`git push origin ${headRef}\` once. If it is rejected, set error to git's message, write no reply files and stop.`
    : `Step 1. Do not push (${postToGitHub ? 'push is off for this run' : 'this is a dry run'}).`
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

These findings are settled (fixed, deferred with the mitigation committed, decided by the person and applied, or, for an earlier round's finding this run carried forward or resolved, answered in its thread), their commits are pushed and their replies posted, so Redline closes the threads it opened for them; the ids are the inline comment and every reply Redline posted in each thread, in this run or an earlier round's:
${settled.map((s) => `- ${s.id} (round ${s.round}): comments ${all(s).join(', ')}`).join('\n')}

Run this once, exactly as given, and nothing else:

${GH} resolve-threads ${pr} ${ids.join(' ')}

Set resolved and skipped from its JSON as printed. The script decides what it resolves: a thread a teammate opened or commented in is skipped with a reason, which is a result and not an error. If it exits non-zero, set error to its stderr.

Return only the JSON your instructions specify, with operation "resolve-threads".`
}

function recordStatusPrompt(paths) {
  return `${RUN_LINE}

Operation: record-status. PR #${pr}. Read only. Run this once, exactly as given, and nothing else:

git -C ${repoRoot} status --porcelain --untracked-files=all -- ${paths.join(' ')}

Set files to the path on each line it prints (the text after the two status letters and the space, repository-relative, exactly as printed), in the order printed, or [] when it prints nothing. If git fails, set error to its message.

Return only the JSON your instructions specify, with operation "record-status".`
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
      spilled: `checks.sh output exceeded the Bash tool's inline limit and was saved to a file the checker may not read; cap it, see emit_checks in ${pluginRoot}/scripts/checks-template.sh`,
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
let approvedPaths = []
let baseline = null
let baselineFailing = []
let recordCommit = null
let threadSweep = null

function compactFinding(f) {
  return { id: f.id, category: f.category, severity: f.severity, file: f.file, line: f.line, title: f.title, needsDecision: f.needsDecision, knownAs: f.knownAs, carriedFrom: f.carriedFrom || '' }
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
      findings: record.findings.map(compactFinding),
      droppedNits: record.droppedNits || 0,
      post: record.post,
      dispositions: record.dispositions || null,
      commits: record.commits || [],
      check: record.check || null,
      outcomes: record.outcomes || null,
      dropped: (record.dropped || []).map((f) => ({ id: f.id, reason: f.reason })),
      carried: record.carried || {},
      resolvedPrior: record.resolvedPrior || [],
      files: record.files || [],
      replyIds: record.replyIds || {},
      human: record.human || null,
      forced: record.forced || {},
    })),
    judgmentCalls: [],
    // The findings left to the person under a repository ask rule (#49), every round.
    forced: rounds.flatMap((record) => Object.entries(record.forced || {}).map(([id, x]) => ({ id, round: record.round, rule: x.rule, reason: x.reason, outcome: record.outcomes && record.outcomes[id] ? record.outcomes[id] : '' }))),
    deferred: deferredAll,
    decided: decidedAll,
    openFindings: [],
    commits: commitsAll,
    recordCommit,
    threads: threadSweep,
    specFolders: unique(rounds.map((record) => record.specFolder)),
    snapshotStart,
    warnings,
    relaunch: {
      workflow: 'redline:redline-loop',
      how: 'Relaunch with byte-identical args plus the answers this result asks for, and resumeFromRunId set to the runId of the launch that returned this result. Same session only. handoff (decisions): decisions ({"<id>": {"choice", "notes", "date"}}, every decision so far, unchanged). handoff (plan): approvedPlans as approveWith gives it (this round\'s number added, or h<n> for a human review pass), plus decisions for every ask and every changed disposition ({"choice", "notes", "date", "disposition": "fix|defer|accept"}). reviewed: selected ({"act": [ids], "dropped": {"<id>": "reason"}}). error: resume ({"<label>": {attempt, error, hand}}) for the label resumeFrom names, through the skill\'s run marker.',
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

async function review(round, reviewed, range, facts, source) {
  // What is reviewed, not the round number, picks the model and the label: a human review pass's
  // final nit pass carries the run's first round number and is still a nit pass (#36).
  const key = reviewed === 'pr' ? 'reviewerFirstRound' : 'reviewerLaterRounds'
  const out = await run('review', reviewPrompt(round, reviewed, range, facts, history(), source), {
    agentType: 'redline:redline-reviewer',
    ...modelOpts(key),
    label: `${reviewed === 'pr' ? 'review' : reviewed === 'final-nit-pass' ? 'final nit pass' : 're-review'} r${round}`,
    phase: reviewed === 'pr' ? 'Review' : 'Re-review',
    schema: REVIEW_SCHEMA,
  })
  // IDs are the script's to trust: renumber anything that does not carry this round's prefix.
  out.findings.forEach((f, index) => {
    if (!new RegExp(`^R${round}-\\d+$`).test(f.id)) {
      warnings.push(`round ${round}: reviewer returned id ${JSON.stringify(f.id)}; renamed R${round}-${index + 1}`)
      f.id = `R${round}-${index + 1}`
    }
    f.carriedFrom = typeof f.carriedFrom === 'string' ? f.carriedFrom.trim() : ''
    // The reviewer's ask-rule tag is advisory and must name a declared rule (#49).
    f.askRule = typeof f.askRule === 'string' ? f.askRule.trim() : ''
    if (f.askRule && !ruleById[f.askRule]) {
      warnings.push(`round ${round}: the reviewer tagged ${f.id} with ask rule ${JSON.stringify(f.askRule)}, which .claude/redline.json does not declare; cleared`)
      f.askRule = ''
    }
  })
  out.resolved = Array.isArray(out.resolved) ? out.resolved : []
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
  let next = Math.max(0, ...out.findings.map((x) => Number(x.id.split('-')[1]) || 0))
  for (const p of carryList) {
    if (carried[p.id] || resolved.some((x) => x.id === p.id)) {
      continue
    }
    const id = `R${round}-${++next}`
    warnings.push(`round ${round}: the reviewer did not account for ${p.id} (carried forward from round ${p.round}); carried as reported`)
    const body = (p.body || '').split('\n').slice(1).join('\n').trim()
    out.findings.push({
      id, file: p.file, line: p.line, side: 'RIGHT', category: p.category, severity: p.severity, confidence: p.confidence, title: p.title,
      description: body || `See the Redline round ${p.round} review body.`, proposedFix: '', needsDecision: false, knownAs: '', carriedFrom: p.id, askRule: '',
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
  const findingsFile = {
    path: `${specFolder}/redline/round-${round}-findings.json`,
    content: json({ round, reviewed, range, summary: reviewOut.summary, findings: reviewOut.findings }),
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

function outcomesFor(pass, inScope, shaped, deferred, roundDecisions, commits, forced) {
  const outcomes = {}
  const dispositions = Object.fromEntries(shaped.findings.map((f) => [f.id, f.disposition]))
  const owners = Object.fromEntries(shaped.findings.map((f) => [f.id, shaperOwner(f.decidedBy, pass)]))
  const recommendations = Object.fromEntries(shaped.findings.map((f) => [f.id, (f.recommendation || '').trim()]))
  for (const f of inScope) {
    const named = commits.filter((c) => c.finding === f.id || mentions(c.message, f.id))
    const decision = roundDecisions[f.id]
    const deferredItem = deferred.find((d) => d.id === f.id)
    const owner = owners[f.id] || REDLINE
    const left = (forced || {})[f.id]
    if (left) {
      // A finding a repository ask rule covers (#49): the person's, whatever was decided about it.
      outcomes[f.id] = { kind: 'left', rule: left.rule, reason: left.reason, notes: decision ? decisionSentence(decision) : 'No change made; the person makes it.', commits: [], decidedBy: decision ? decision.decidedBy || personLabel : personLabel }
    } else if (decision) {
      outcomes[f.id] = { kind: 'decided', choice: decision.choice, notes: decision.notes || '', commits: named, decidedBy: decision.decidedBy || personLabel }
    } else if (dispositions[f.id] === 'defer' && deferredItem) {
      outcomes[f.id] = { kind: 'deferred', commits: named, fullFix: deferredItem.fullFix, mitigation: deferredItem.mitigation, decidedBy: owner }
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

function describeOutcome(outcome) {
  const owner = decidedBy(outcome.decidedBy)
  switch (outcome.kind) {
    case 'fixed':
      return `fixed in ${andList(outcome.commits.map((c) => short(c.sha)))}${owner}`
    case 'deferred':
      return `deferred; mitigated${outcome.commits.length ? ` in ${andList(outcome.commits.map((c) => short(c.sha)))}` : ''}: ${outcome.mitigation}${owner}`
    case 'decided':
      return `${decisionSentence(outcome)}${owner}`
    case 'left':
      return `left to the author under repository rule ${outcome.rule}: ${outcome.notes}${owner}`
    case 'dropped':
      return `not acted on in this run: ${outcome.reason}${owner}`
    case 'none':
      return `no change requested: ${outcome.why}${owner}`
    default:
      return `not changed${owner}`
  }
}

// A human review pass sorts into fix, ask or none; a Redline round into fix, defer or ask. The
// shaper's JSON is checked here, so a value from the other kind of pass stops the run at shape
// rather than reaching a plan.
function checkDispositions(pass, shaped) {
  const bad = pass.human
    ? shaped.findings.filter((f) => f.disposition === 'defer')
    : shaped.findings.filter((f) => f.disposition === 'none' || f.decidedBy === 'reviewer')
  if (bad.length) {
    const ids = bad.map((f) => f.id).join(', ')
    throw stageError('shape', pass.human
      ? `the shaper deferred ${ids}; in a human review pass a comment is fix, ask or none, never defer, since nothing a teammate asked for is deferred by Redline on its own`
      : `the shaper sorted ${ids} with a human review pass's values (none, or decidedBy reviewer) in a Redline round`)
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
}

// The forcing point (#49): after shaping, whatever fix, defer or ask the shaper returned, a finding
// a repository ask rule covers is an ask to the person. A paths rule is matched on the finding's file
// and on the files the shaper's task would touch; a prose rule is the shaper's own askRule tag. The
// finding becomes ask and pending, loses any deferred entry, gets a judgment call when the shaper
// gave none, and is recorded under record.forced for the replies, the handoff and the thread sweep.
// A human pass's none, a comment that asks for nothing, is left as it is: there is no change to
// leave to the person (#52, R1-4). Deterministic from args and the shaper's JSON, so a relaunch
// replays it. The numeric limits of #25 force here too, when they come.
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
      continue
    }
    if (s.disposition !== 'ask') {
      warnings.push(`${pass.name}: the shaper sorted ${f.id} as ${s.disposition}; repository rule ${rule.id} makes it an ask for the person`)
    }
    const recommendation = (s.recommendation || '').trim().replace(/\.$/, '')
    s.disposition = 'ask'
    s.decidedBy = 'pending'
    s.askRule = rule.id
    shaped.deferred = shaped.deferred.filter((d) => d.id !== f.id)
    const why = `repository rule ${rule.id}`
    let call = shaped.judgmentCalls.find((c) => c.id === f.id)
    if (!call) {
      call = {
        id: f.id,
        title: f.title,
        story: `Repository rule ${rule.id}: ${rule.reason}. ${(f.description || '').trim()}`,
        why_human: why,
        options: [
          { label: 'Make the change by hand after the run', cost: 'The change, made outside Redline', effect: recommendation ? `What Redline would have done: ${recommendation}.` : 'The finding is settled by the person.' },
          { label: 'Accept, no change', cost: 'None', effect: 'The finding stands as reported.' },
        ],
        recommendation: recommendation ? `By hand: ${recommendation}.` : 'Make the change by hand after the run.',
        dependsOn: [],
      }
      shaped.judgmentCalls.push(call)
    } else {
      call.why_human = why
    }
    record.forced[f.id] = { rule: rule.id, reason: rule.reason, recommendation: call.recommendation }
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
    decidedAll.push({ id: f.id, round: record.round, title: f.title, outcome: describeOutcome(outcome), decidedBy: personLabel, choice: 'drop', notes: f.reason })
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
async function checker(flag, snapshot, octane, label, prefix) {
  const out = await run('check', checkerPrompt(flag, snapshot, octane, label), {
    agentType: 'redline:redline-checker', ...modelOpts('checker'), label, phase: 'Check', schema: CHECKER_SCHEMA, stallMs: checkerStallMs,
  })
  const read = readStructure(out)
  if (read.warning) {
    warnings.push(`${prefix}: ${read.warning}`)
  }
  return read.out
}

// One revise pass for a round: Shape, hand-off, Resolve, Approve, Implement, Check, Push and reply.
async function revise(record, inScope, reviewedKind) {
  const { round, specFolder } = record
  const pass = passOf(record)

  phase('Shape')
  let shaped = await run('shape', pass.human ? humanShapePrompt(pass, record, inScope) : shapePrompt(round, specFolder, reviewedKind, inScope, record.prBody), {
    agentType: 'redline:redline-shaper', ...modelOpts('revise'), label: `shape ${pass.tag}`, phase: 'Shape', schema: SHAPE_SCHEMA,
  })
  if (shaped.specFolder.replace(/\/+$/, '') !== specFolder) {
    warnings.push(`${pass.name}: shaper reported spec folder ${shaped.specFolder}, expected ${specFolder}`)
  }
  const unsorted = inScope.filter((f) => !shaped.findings.some((s) => s.id === f.id)).map((f) => f.id)
  if (unsorted.length) {
    throw stageError('shape', `the shaper gave no disposition for ${unsorted.join(', ')}`)
  }
  checkDispositions(pass, shaped)
  forceAskRules(record, pass, inScope, shaped)
  record.dispositions = shaped.findings

  // The interrupt dial. Decisions enter only after the shaper, so its result replays from cache
  // on the relaunch whatever the dial says.
  //
  // plan: the person sees every disposition before anything is planned further. The run ends
  // here each round until the relaunch carries this pass's key in args.approvedPlans, with any ask
  // answered and any disposition changed under args.decisions.
  if (interrupt === 'plan' && !approvedPlans.includes(pass.planKey)) {
    const pendingCalls = shaped.judgmentCalls.filter((call) => !decisions[call.id])
    return { handoff: true, kind: 'plan', pending: pendingCalls, calls: shaped.judgmentCalls, shaped }
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
        decisions[call.id] = forced ? leftDecision(forced) : autopilotDecision(call)
        log(`${pass.name}: autopilot ${forced ? `left ${call.id} to the person (repository rule ${forced.rule})` : `decided ${call.id} (${decisions[call.id].choice})`}`)
      }
      return false
    }
    return true
  }
  if (settle(calls.filter((call) => !decisions[call.id]))) {
    return { handoff: true, kind: 'decisions', pending: calls.filter((call) => !decisions[call.id]), calls }
  }

  // A decision on a finding that was not a judgment call is a disposition override from the plan
  // dial: the person changed fix/defer/ask to fix, defer or accept after seeing the list.
  const overridesFor = (known) => inScope.filter((f) => decisions[f.id] && decisions[f.id].disposition && !known.some((call) => call.id === f.id))
  let overrides = overridesFor(calls)
  let roundDecisions = {}
  let deferred = shaped.deferred.slice()
  let resolved = null
  const resolveWith = async (newCalls, newOverrides, suffix) => {
    for (const id of newCalls.map((call) => call.id).concat(newOverrides.map((f) => f.id))) {
      const decision = withOwner(decisions[id])
      // A finding a repository ask rule covers stays the person's whatever the decision says: a
      // disposition on it (fix, defer) is not applied, and the rule travels with the decision so
      // the resolve agent writes it as left to the person (#49).
      const forced = record.forced[id]
      if (forced) {
        if (decision.disposition) {
          warnings.push(`${pass.name}: ${id} is left to the person under repository rule ${forced.rule}; the disposition ${JSON.stringify(decision.disposition)} is not applied`)
          delete decision.disposition
        }
        decision.rule = forced.rule
      }
      roundDecisions[id] = decision
    }
    const out = await run('resolve', resolvePrompt(pass, specFolder, newCalls, roundDecisions, newOverrides), {
      agentType: 'redline:redline-resolve', ...modelOpts('revise'), label: `resolve ${pass.tag}${suffix}`, phase: 'Resolve', schema: RESOLVE_SCHEMA,
    })
    if (out.unresolved.length) {
      const ids = out.unresolved.map((item) => item.id)
      if (interrupt === 'autopilot') {
        throw stageError('resolve', `autopilot could not apply the shaper's recommendation for ${ids.join(', ')}`, { unresolved: out.unresolved })
      }
      return { handoff: true, kind: 'decisions', pending: newCalls.filter((call) => ids.includes(call.id)), calls, unresolved: out.unresolved }
    }
    deferred = deferred.concat(out.deferred.filter((item) => !deferred.some((d) => d.id === item.id) && !record.forced[item.id]))
    return out
  }
  if (calls.length || overrides.length) {
    phase('Resolve')
    resolved = await resolveWith(calls, overrides, '')
    if (resolved.handoff) {
      return resolved
    }
  }
  // Dispositions after the overrides: what the implementer builds and the replies report.
  const effectiveDispositions = () => shaped.findings.map((f) => {
    const decision = roundDecisions[f.id]
    return decision && decision.disposition ? { ...f, disposition: decision.disposition } : f
  })

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
      throw stageError('approve', `the plan approver did not approve the ${pass.name} plan after ${maxPlanAdjustments} adjustments`, { adjustments: plan.adjustments, notes: plan.notes }, `plan approver ${pass.tag}${suffix}`)
    }
    log(`${pass.name}: plan bounced (${plan.adjustments.length} adjustments); reshaping`)
    shaped = await run('shape', reshapePrompt(pass, specFolder, inScope, plan.adjustments, adjustment + 1), {
      agentType: 'redline:redline-shaper', ...modelOpts('revise'), label: `reshape ${pass.tag} #${adjustment + 1}`, phase: 'Shape', schema: SHAPE_SCHEMA,
    })
    checkDispositions(pass, shaped)
    forceAskRules(record, pass, inScope, shaped)
    record.dispositions = shaped.findings
    // A call the reshape raised that this round has not seen: autopilot decides it, the other
    // levels end the run; either way the resolve agent writes the new decisions in.
    const raised = shaped.judgmentCalls.filter((call) => !calls.some((known) => known.id === call.id))
    if (settle(raised.filter((call) => !decisions[call.id]))) {
      return { handoff: true, kind: 'decisions', pending: raised.filter((call) => !decisions[call.id]), calls: shaped.judgmentCalls }
    }
    deferred = shaped.deferred.concat(deferred.filter((item) => !shaped.deferred.some((d) => d.id === item.id)))
    if (raised.length) {
      calls = calls.concat(raised)
      phase('Resolve')
      resolved = await resolveWith(raised, [], ` #${adjustment + 1}`)
      if (resolved.handoff) {
        return resolved
      }
    }
    phase('Approve')
  }
  const finalDispositions = effectiveDispositions()

  // The snapshot's plan_paths is every path approved so far in this run: the git block
  // measures from start_sha, so earlier rounds' files are still changed in later rounds.
  const planPaths = plan.planPaths.map((path) => (path.startsWith(`${repoRoot}/`) ? path.slice(repoRoot.length + 1) : path))
  approvedPaths = unique(approvedPaths.concat(planPaths, [`${specFolder}/`]))
  const snapshotPath = abs(`${specFolder}/redline/snapshot.json`)
  const snapshot = { pr, start_sha: startSha, base_ref: baseRef, files: prFiles, plan_paths: approvedPaths }
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

  const accepted = new Set(finalDispositions.filter((f) => f.disposition === 'accept').map((f) => f.id))
  const needCommits = finalDispositions
    .filter((f) => f.disposition === 'fix' || f.disposition === 'defer')
    .map((f) => f.id)
    .concat(resolved ? resolved.tasks.filter((task) => task.files.length && task.finding && !accepted.has(task.finding) && !record.forced[task.finding]).map((task) => task.finding) : [])
  const ctx = {
    specFolder, snapshotPath, octane, baselineFailing, inScope, shaped: { ...shaped, findings: finalDispositions }, deferred, roundDecisions, plan, standards,
    allowed: unique(prFiles.concat(approvedPaths, ['agent-os/specs/', 'agent-os/standards/', 'openapi.json'])),
    repair: '',
  }

  let implemented = null
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
    ctx.repair = `${verdict.reasons.join('\n')}\n${failingExcerpt(checked)}`
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
      const claimed = implemented.commits.find((ic) => ic.sha.length >= 7 && (c.sha.startsWith(ic.sha) || ic.sha.startsWith(c.sha)))
      return { sha: c.sha, message: c.message, finding: claimed ? claimed.finding : '', round }
    })
  commitsAll.push(...roundCommits)
  record.commits = roundCommits
  for (const item of deferred) {
    const f = inScope.find((finding) => finding.id === item.id)
    deferredAll.push({ ...item, round, title: f ? f.title : '', file: f ? f.file : '', line: f ? f.line : 0, specFolder, commentId: record.commentIds[item.id] || 0 })
  }
  // On autopilot a finding a repository ask rule covers is deferred with no mitigation (#49): the
  // person makes the change, and the handoff's Deferred list and the skill's triage name it.
  for (const [id, forced] of Object.entries(record.forced)) {
    const decision = roundDecisions[id]
    if (!decision || decision.decidedBy !== AUTOPILOT) {
      continue
    }
    const f = inScope.find((finding) => finding.id === id)
    deferredAll.push({ id, mitigation: `none (repository rule ${forced.rule})`, fullFix: forced.recommendation, rule: forced.rule, reason: forced.reason, round, title: f ? f.title : '', file: f ? f.file : '', line: f ? f.line : 0, specFolder, commentId: record.commentIds[id] || 0 })
  }

  const outcomes = outcomesFor(pass, inScope, { ...shaped, findings: finalDispositions }, deferred, roundDecisions, roundCommits, record.forced)
  record.outcomes = Object.assign(record.outcomes || {}, Object.fromEntries(Object.entries(outcomes).map(([id, outcome]) => [id, describeOutcome(outcome)])))
  record.outcomeKinds = Object.assign(record.outcomeKinds || {}, Object.fromEntries(Object.entries(outcomes).map(([id, outcome]) => [id, outcome.kind])))
  for (const f of inScope) {
    decidedAll.push({ id: f.id, round, title: f.title, outcome: describeOutcome(outcomes[f.id]), decidedBy: outcomes[f.id].decidedBy, choice: outcomes[f.id].choice || '', notes: outcomes[f.id].notes || '' })
  }

  phase('Push and reply')
  const replies = withAnswers(pass, inScope, mergeThreadReplies(pass, inScope.map((f) => replyEntry(pass, f, outcomes[f.id], record.commentIds[f.id] || 0, record.reviewPosted))))
    .concat(carriedReplies(pass, record, inScope, outcomes), droppedReplies(record), resolvedReplies(record), knownCarriedReplies(record))
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
  return { handoff: false, newHead, commits: roundCommits }
}

// Known limits in the plugin's README, where the teammate reading the handoff can open it.
function knownLimits() {
  return `[Known limits](${README_URL}#known-limits) in Redline's README`
}

function handoffComment(lastFixUnreviewed, prBody, threads) {
  const lines = ['Redline handoff', '']
  const reviews = rounds.length
  const last = rounds[reviews - 1]
  if (lastFixUnreviewed) {
    lines.push(`Redline ran ${reviews} review rounds. The final nit pass found a correctness bug in the nit fixes; it was fixed in one more pass, which was not re-reviewed. Please look at that commit first. Only round ${firstRound} reviewed the whole PR; see ${knownLimits()}.`)
  } else if (last && last.reviewed === 'final-nit-pass') {
    lines.push(`Redline ran ${reviews} review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in the nit fixes. Only round ${firstRound} reviewed the whole PR; see ${knownLimits()}.`)
  } else {
    lines.push(`Redline ran ${reviews} review round${reviews === 1 ? '' : 's'}; the last one found no correctness bugs.`)
  }
  if (threads) {
    lines.push('', threadsLine(threads))
  }
  if (prBody.updated) {
    const file = prBody.file.startsWith(`${repoRoot}/`) ? prBody.file.slice(repoRoot.length + 1) : prBody.file
    lines.push('', `Redline replaced the PR description with the redraft in \`${file}\`; the previous one is in the description's edit history.`)
  }
  if (teammate) {
    lines.push('', `@${teammate}, over to you for the human review.`)
  }
  lines.push('', '### Rounds', '')
  for (const record of rounds) {
    const correctness = record.findings.filter((f) => !f.knownAs && f.category === 'correctness').length
    const nits = record.findings.filter((f) => !f.knownAs && f.category === 'nit').length
    const approved = approvedPlans.includes(record.round) ? `; plan approved by ${personLabel}` : ''
    const picked = record.dropped ? `; ${record.dropped.length} not acted on (${personLabel}'s pick)` : ''
    lines.push(`- Round ${record.round} (${record.reviewed}): ${correctness} correctness, ${nits} nit; ${(record.commits || []).length} commits${approved}${picked}; spec \`${record.specFolder}\``)
  }
  const earlier = earlierRoundsLines()
  if (earlier.length) {
    lines.push('', '### Earlier rounds', '', ...earlier)
  }
  if (decidedAll.length) {
    lines.push('', '### Decisions', '', ...decidedAll.map((d) => `- **${d.id}** ${d.title}: ${d.outcome}`))
  }
  if (deferredAll.length) {
    lines.push('', '### Deferred (mitigated now, full fix left open)', '', ...deferredAll.map((d) => (d.rule
      ? `- **${d.id}** ${d.title}: left to you under repository rule ${d.rule}; open: ${d.fullFix}`
      : `- **${d.id}** ${d.title}: shipped ${d.mitigation}; open: ${d.fullFix}`)))
  }
  const left = leftToYou()
  if (left.length) {
    lines.push('', '### Left to you (repository rules)', '', ...left)
  }
  if (commitsAll.length) {
    lines.push('', '### Commits', '', ...commitsAll.map((c) => `- ${short(c.sha)} ${c.message}`))
  }
  if (!push) {
    lines.push('', 'The commits are local only; push was off for this run.')
  }
  return lines.join('\n')
}

// The findings every round left to the person under a repository ask rule (#49), one line each
// with the rule, its reason and the outcome as recorded (which carries the owner).
function leftToYou() {
  const lines = []
  for (const record of rounds) {
    for (const [id, forced] of Object.entries(record.forced || {})) {
      const f = record.findings.find((x) => x.id === id)
      const outcome = record.outcomes && record.outcomes[id] ? record.outcomes[id] : `left to the author under repository rule ${forced.rule}`
      lines.push(`- **${id}** ${f ? f.title : ''}: rule ${forced.rule} (${forced.reason}); ${outcome}`)
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
  const deferred = ids('deferred')
  if (deferred.length) {
    parts.push(`${andList(deferred)} deferred with a mitigation`)
  }
  const none = ids('none')
  if (none.length) {
    parts.push(`${andList(none)} asked for nothing`)
  }
  const left = ids('left')
  if (left.length) {
    const ruleIds = unique(left.map((id) => (record.forced[id] || {}).rule || ''))
    parts.push(`${andList(left)} left to ${personLabel} under repository rule${ruleIds.length === 1 ? '' : 's'} ${andList(ruleIds)}`)
  }
  const rest = ids('not-changed')
  if (rest.length) {
    parts.push(`${andList(rest)} not changed`)
  }
  const nit = !nitPass
    ? 'No commits, so no final nit pass.'
    : nitPass.found === 0
      ? `Final nit pass (Redline round ${nitPass.round}): no correctness bugs.`
      : `Final nit pass (Redline round ${nitPass.round}): ${nitPass.found} correctness bug${nitPass.found === 1 ? '' : 's'} in the fixes, fixed in one more pass that was not re-reviewed.`
  return `${pass.title} · review by ${pass.reviewer}: ${parts.join('; ')}. ${nit}${threads ? ` ${threadsLine(threads)}` : ''}`
}

function capComment(open) {
  return [
    'Redline stopped at the round cap',
    '',
    `Redline reached its cap of ${maxRounds} revise round${maxRounds === 1 ? '' : 's'} with correctness findings still open in the latest review, so it has not requested a review. The author will pick these up.`,
    '',
    '### Still open',
    '',
    ...open.map(findingLine),
  ].join('\n')
}

// The description goes first, in a call of its own, so the handoff comment can say whether it was
// replaced. compose(prBody) returns the comment's text. A human review pass finishes with its
// summary comment only: no description, no review request (#36).
async function finish(kind, record, compose) {
  phase('Finish')
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
// comment is a candidate; a body finding has no thread. Settled means fixed, deferred or decided
// and a reply posted, so Redline's comment and its reply are both in the list; the rest stay open
// with a reason.
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
      const settled = ['fixed', 'deferred', 'decided'].includes(kind) && replyIds[f.id] > 0
      const reason = settled ? '' : dropped.has(f.id) ? `dropped by ${personLabel}` : kind === 'left' ? `repository rule ${((record.forced || {})[f.id] || {}).rule}` : kind === 'not-changed' ? 'not changed' : !kind ? 'not settled' : 'no reply posted'
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
      const settled = ['fixed', 'deferred', 'decided'].includes(kind) && replyIds[priorId] > 0 && (replyIds[newId] > 0 || !record.commentIds[newId])
      const reason = settled ? '' : carrier.knownAs ? 'already tracked' : dropped.has(newId) ? `dropped by ${personLabel}` : kind === 'left' ? `repository rule ${((record.forced || {})[newId] || {}).rule}` : kind === 'not-changed' ? 'not changed' : !kind ? 'not settled' : 'no reply posted'
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
// Redline rounds posted, as this run read them at launch.
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
    const what = newId
      ? !ids.has(newId)
        ? `carried forward as ${newId}, out of scope (correctness only)`
        : carrier.knownAs
          ? `carried forward as ${newId}: already tracked in ${carrier.knownAs}`
          : record.outcomes && record.outcomes[newId] ? `carried forward as ${newId}: ${record.outcomes[newId]}` : `carried forward as ${newId}`
      : resolved
        ? `resolved: ${resolved.why}${decidedBy(REDLINE)}`
        // The disposition before the reply text: one a later round's line carried is named by its
        // new id, whatever its own thread's last reply says (#46, R1-5).
        : p.disposition === 'carried' && p.carried_to
          ? `carried forward as ${p.carried_to} in round ${p.carried_to.slice(1).split('-')[0]}`
          : `already handled in round ${p.round}: ${p.reply ? p.reply.body : p.disposition}`
    return `- **${p.id}** ${p.title}: ${what}`
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
  if (outcome.kind === 'plan') {
    log(`round ${record.round}: the plan dial stops after shaping (${outcome.shaped.findings.length} dispositions, ${outcome.pending.length} to answer); the run ends here and resumes on relaunch`)
    return result('handoff', {
      handoffKind: 'plan',
      handoffRound: record.round,
      specFolder: record.specFolder,
      plan: outcome.shaped.findings.map((s) => ({ ...s, finding: findingOf(s.id), decidedBy: shaperOwner(s.decidedBy, passOf(record)), forced: forcedOf(s.id) })),
      deferredPlanned: outcome.shaped.deferred,
      judgmentCalls,
      unresolved: [],
      decisionsNeeded: outcome.pending.map((call) => call.id),
      approveWith: { approvedPlans: unique(approvedPlans.concat(passOf(record).planKey)) },
    })
  }
  log(`round ${record.round}: ${outcome.pending.length} judgment call(s) for the person; the run ends here and resumes on relaunch`)
  return result('handoff', {
    handoffKind: 'decisions',
    handoffRound: record.round,
    specFolder: record.specFolder,
    judgmentCalls,
    unresolved: outcome.unresolved || [],
    decisionsNeeded: outcome.pending.map((call) => call.id),
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
    if (outcome.newHead) {
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
      const considered = reviewOut.findings.filter((f) => f.category === 'correctness')
      const droppedNits = reviewOut.findings.length - considered.length
      const known = considered.filter((f) => f.knownAs)
      const active = considered.filter((f) => !f.knownAs)
      log(`round ${round} (final nit pass over ${source}): ${active.length} correctness, ${known.length} already tracked, ${droppedNits} nit(s) dropped`)
      phase('Post')
      const roundFolder = specFolderFor(round)
      const { posted, commentIds, files } = await post(round, 'final-nit-pass', range, roundFolder, { ...reviewOut, findings: considered }, active, known, source)
      const roundRecord = { round, reviewed: 'final-nit-pass', specFolder: roundFolder, range, findings: considered, droppedNits, post: { dryRun: posted.dryRun, posted: posted.posted, skipped: posted.skipped, reviewId: posted.review.id, url: posted.review.html_url, movedToBody: posted.review.movedToBody }, reviewPosted: posted.posted || Boolean(posted.skipped), commentIds, files: files.slice(), prBody: facts.body || '', prUrl: facts.url || '' }
      rounds.push(roundRecord)
      nitPass = { round, found: active.length }
      if (active.length) {
        const fix = await revise(roundRecord, active, 'correctness')
        if (fix.handoff) {
          return handoffResult(roundRecord, fix)
        }
        lastFixUnreviewed = true
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
    rounds.push(record)
    const inScope = record.findings.filter((f) => !f.knownAs)
    const kind = inScope.some((f) => f.category === 'correctness') ? 'correctness' : 'nits'
    const outcome = await revise(record, inScope, kind)
    if (outcome.handoff) {
      return handoffResult(record, outcome)
    }
    phase('Finish')
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
    let considered = reviewOut.findings
    let droppedNits = 0
    if (reviewed === 'final-nit-pass' || scope === 'correctness') {
      considered = reviewOut.findings.filter((f) => f.category === 'correctness')
      droppedNits = reviewOut.findings.length - considered.length
      if (droppedNits) {
        log(`round ${round}: dropped ${droppedNits} nit(s) the reviewer reported; ${reviewed === 'final-nit-pass' ? 'the final nit pass reports correctness only' : 'the scope is correctness only'}`)
      }
    }
    const known = considered.filter((f) => f.knownAs)
    let active = considered.filter((f) => !f.knownAs)
    log(`round ${round} (${reviewed}): ${active.filter((f) => f.category === 'correctness').length} correctness, ${active.filter((f) => f.category === 'nit').length} nit, ${known.length} already tracked`)

    phase('Post')
    const { posted, commentIds, files } = await post(round, reviewed, range, specFolder, { ...reviewOut, findings: considered }, active, known)
    const record = { round, reviewed, specFolder, range: round === firstRound ? null : range, findings: considered, droppedNits, carried: reviewOut.carried || {}, resolvedPrior: reviewOut.resolved || [], post: { dryRun: posted.dryRun, posted: posted.posted, skipped: posted.skipped, reviewId: posted.review.id, url: posted.review.html_url, movedToBody: posted.review.movedToBody }, reviewPosted: posted.posted || Boolean(posted.skipped), commentIds, files: files.slice(), prBody: facts.body || '', prUrl: facts.url || '' }
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
        const finished = await finish('handoff', record, (prBody, threads) => handoffComment(false, prBody, threads))
        return result('done', { handoffPosted: finished.posted, reviewRequested: finished.reviewRequested, prBody: finished.prBody, note: 'No finding was selected to act on, so there was no revise pass.' })
      }
    }
    const correctness = active.filter((f) => f.category === 'correctness')
    const nits = active.filter((f) => f.category === 'nit')

    if (reviewed === 'final-nit-pass') {
      if (correctness.length === 0) {
        const finished = await finish('handoff', record, (prBody, threads) => handoffComment(false, prBody, threads))
        return result('done', { handoffPosted: finished.posted, reviewRequested: finished.reviewRequested, prBody: finished.prBody })
      }
      // One more fix pass, then stop regardless.
      const outcome = await revise(record, correctness, 'correctness')
      if (outcome.handoff) {
        return handoffResult(record, outcome)
      }
      const finished = await finish('handoff', record, (prBody, threads) => handoffComment(true, prBody, threads))
      return result('done', { lastFixUnreviewed: true, handoffPosted: finished.posted, reviewRequested: finished.reviewRequested, prBody: finished.prBody })
    }

    if (correctness.length === 0 && nits.length === 0) {
      await replyStandalone(record)
      const finished = await finish('handoff', record, (prBody, threads) => handoffComment(false, prBody, threads))
      return result('done', { handoffPosted: finished.posted, reviewRequested: finished.reviewRequested, prBody: finished.prBody })
    }

    // The cap counts this run's rounds, from its first.
    if (correctness.length && round - firstRound + 1 > maxRounds) {
      const finished = await finish('cap-hit', record, () => capComment(correctness))
      return result('capped', { openFindings: correctness.map(compactFinding), capCommentPosted: finished.posted })
    }

    const inScope = correctness.length ? correctness.concat(nits) : nits
    const outcome = await revise(record, inScope, correctness.length ? 'correctness' : 'nits')
    if (outcome.handoff) {
      return handoffResult(record, outcome)
    }
    if (!outcome.newHead) {
      // Every finding was settled without a commit (accepted, declined): nothing to re-review.
      const finished = await finish('handoff', record, (prBody, threads) => handoffComment(false, prBody, threads))
      return result('done', { handoffPosted: finished.posted, reviewRequested: finished.reviewRequested, prBody: finished.prBody, note: 'The last revise pass made no commits, so there was no fix diff to re-review.' })
    }
    // A round with nits only ends in one final nit pass; under the correctness scope there are
    // no nits, so a correctness-free re-review is simply done.
    finalPass = correctness.length === 0
    range = { from: range.to, to: outcome.newHead }
    round += 1
  }
} catch (error) {
  log(`stopped: ${error.message}`)
  // The step a resume reruns from (#10): the agent label the error names, with the attempt the
  // relaunch would be. A gather error (the head moved, the PR is not open, the branch is wrong)
  // and an error with no agent behind it are not resumable: the next launch is a fresh run.
  const resumable = error.stage && error.stage !== 'gather' && error.label
  const resumeFrom = resumable ? { label: error.label, attempt: (resume[error.label] ? resume[error.label].attempt : 1) + 1 } : null
  return result('error', { stage: error.stage || 'workflow', error: error.message, detail: error.extra || {}, resumeFrom })
}
