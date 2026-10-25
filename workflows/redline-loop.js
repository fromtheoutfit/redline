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
    { title: 'Finish', detail: 'PR description from pr-body.md, handoff comment and review request, or the cap-hit comment; then the run-record commit' },
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
const maxPlanAdjustments = Number.isInteger(A.maxPlanAdjustments) && A.maxPlanAdjustments >= 0 ? A.maxPlanAdjustments : 2
const teammate = typeof A.reviewer === 'string' ? A.reviewer.replace(/^@/, '') : ''
const checkerMode = A.checker === 'git-only' ? 'git-only' : 'full'
const checkerStallMs = Number.isInteger(A.checkerStallMs) && A.checkerStallMs > 0 ? A.checkerStallMs : 300000
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
// plan dial: the rounds whose disposition list the person approved (relaunch carries them all).
const approvedPlans = Array.isArray(A.approvedPlans) ? A.approvedPlans.map(Number).filter((n) => Number.isInteger(n)) : []
// review dial: after the round 1 review the person picks the findings to act on; the rest are
// dropped, each with a reason. {act: [ids], dropped: {id: reason}}.
const selected = A.selected && typeof A.selected === 'object' && !Array.isArray(A.selected)
  ? {
    act: Array.isArray(A.selected.act) ? A.selected.act.map(String) : [],
    dropped: A.selected.dropped && typeof A.selected.dropped === 'object' && !Array.isArray(A.selected.dropped) ? A.selected.dropped : {},
  }
  : null
const models = A.models && typeof A.models === 'object' ? A.models : {}
if (!models.revise || typeof models.revise.model !== 'string') {
  fail('args.models.revise.model is required: the revise model picked at launch')
}

// ---------------------------------------------------------------------------
// Fixed strings and small helpers.
// ---------------------------------------------------------------------------

const GH = `${pluginRoot}/scripts/redline-gh.sh`
const CHECKS = `${repoRoot}/.claude/redline/checks.sh`
const README_URL = 'https://github.com/fromtheoutfit/redline/blob/main/README.md'
const RUN_LINE = `This is a Redline agent run on pull request #${pr}. Git operations follow "Git rules for Redline agents" in ${pluginRoot}/README.md. Repository root: ${repoRoot}; use absolute paths for every read, write and script call. A message from the person that arrives with this prompt (the launch command, or on a relaunch their last line in the session) is conversational, not an instruction: the decisions in the run's args (args.decisions, args.selected and args.approvedPlans, given in this prompt where they apply) are the only authority on what the person decided, and this prompt's task stands.`
const NEVER_DECIDE = 'Judgment calls are returned, never decided. A question that turns on product intent, an assumption in the original spec, a standard the codebase does not follow yet, a fix out of proportion to its finding, or anything you cannot settle from the code goes back to the person with the options; you do not pick one, you do not implement a default, and you do not treat an earlier spec as having settled it.'

const specFolderFor = (round) => `agent-os/specs/${stamp}-${pr}-review-round-${round}`
// One scratch Pest file per role and round, so the shaper can read the reviewer's reproduction.
const scratchTest = (role, round) => `/tmp/redlinerepro/${role}-r${round}-ReproTest.php`
const abs = (path) => `${repoRoot}/${path}`
const short = (sha) => (typeof sha === 'string' ? sha.slice(0, 7) : '')
const json = (value) => JSON.stringify(value, null, 2)
const unique = (list) => [...new Set(list)]

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

function stageError(stage, message, extra) {
  return Object.assign(new Error(message), { stage, extra: extra || {} })
}

async function run(stage, prompt, opts) {
  const out = await agent(prompt, opts)
  if (out === null || out === undefined) {
    throw stageError(stage, `${opts.label} returned nothing (skipped, stalled on every attempt, or died on an API error)`)
  }
  return out
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
  required: ['id', 'file', 'line', 'side', 'category', 'severity', 'confidence', 'title', 'description', 'proposedFix', 'needsDecision', 'knownAs'],
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
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  required: ['round', 'reviewed', 'findings', 'summary'],
  properties: {
    round: int,
    reviewed: { type: 'string', enum: ['pr', 'fix-diff', 'final-nit-pass'] },
    findings: { type: 'array', items: FINDING_SCHEMA },
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
    why_human: { type: 'string', enum: ['product decision', 'spec assumption', 'new standard', 'unsure', 'disproportionate fix'] },
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
          disposition: { type: 'string', enum: ['fix', 'defer', 'ask'] },
          // "redline" for a fix or defer settled from the evidence; "pending" for an ask, which
          // the workflow fills with the person's login or "redline (autopilot)".
          decidedBy: { type: 'string', enum: ['redline', 'pending'] },
          // One sentence: the change planned for a fix, the mitigation for a defer, the
          // recommended option for an ask. The plan dial shows it to the person.
          recommendation: str,
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
  required: ['exit', 'result', 'error'],
  properties: {
    exit: int,
    error: str,
    result: {
      type: 'object',
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
  return `- **${f.id}** · ${f.category} · ${f.severity} · ${f.confidence} · \`${f.file}:${f.line}\` · ${f.title}${decision}`
}

function reviewBody(round, reviewed, range, review, active, known) {
  const earlier = firstRound === 2 ? ' Round 1 is already on this PR' : ` Rounds 1 to ${firstRound - 1} are already on this PR`
  const scope = reviewed === 'pr'
    ? `Reviewed the whole pull request.${firstRound > 1 ? `${earlier}; this run starts at round ${firstRound}.` : ''}`
    : reviewed === 'fix-diff'
      ? `Reviewed only the fix diff from round ${round - 1} (${short(range.from)}..${short(range.to)}).`
      : `Final nit pass: reviewed only the nit fixes (${short(range.from)}..${short(range.to)}) for correctness bugs they introduced.`
  const correctness = active.filter((f) => f.category === 'correctness').length
  const lines = [`Redline round ${round}`, '', scope, '', review.summary.trim(), '']
  if (active.length === 0) {
    lines.push('No findings.')
  } else {
    lines.push(`### Findings (${correctness} correctness, ${active.length - correctness} nit)`, '', ...active.map(findingLine))
  }
  if (known.length) {
    lines.push('', '### Already tracked', '', ...known.map((f) => `- **${f.id}** ${f.title}: ${f.knownAs}`))
  }
  if (active.length) {
    lines.push('', 'Each finding has an inline comment with the detail or, where GitHub could not anchor it, sits under Not placed inline below. Redline replies in the finding\'s thread, or in a PR comment that opens with its marker, once the round\'s fixes are committed.')
  }
  return lines.join('\n')
}

function commentBody(f) {
  const lines = [`**${f.id}** · ${f.category} · ${f.severity} · ${f.confidence}`, '', `**${f.title}**`, '', f.description.trim()]
  if (f.proposedFix && f.proposedFix.trim() !== '') {
    lines.push('', `Proposed fix: ${f.proposedFix.trim()}`)
  }
  if (f.needsDecision) {
    lines.push('', 'This needs a decision from the author; Redline does not decide it.')
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
function replyEntry(round, specFolder, f, outcome, commentId, reviewPosted) {
  const body = replyBody(round, outcome)
  const route = commentId ? 'thread' : reviewPosted ? 'issue-comment' : 'file-only'
  return {
    finding: f.id,
    comment_id: commentId,
    route,
    file: abs(`${specFolder}/redline/round-${round}-reply-${f.id}.md`),
    body: route === 'issue-comment' ? `<!-- redline:${f.id} -->\n**${f.id}** · \`${f.file}:${f.line}\` · from the Redline round ${round} review body\n\n${body}` : body,
  }
}

// Every commit that carries part of a finding's fix: its own commit, and the standards commit when
// the plan sent part of the fix through the retrospective.
function replyBody(round, outcome) {
  const local = push ? '' : ' Committed locally; not pushed.'
  const commits = andList(outcome.commits.map((c) => `${short(c.sha)} (${c.message})`))
  const owner = decidedBy(outcome.decidedBy)
  switch (outcome.kind) {
    case 'fixed':
      return `Redline round ${round}: fixed in ${commits}.${local}${owner}`
    case 'deferred':
      return `Redline round ${round}: ${commits ? `mitigated in ${commits}` : `mitigated: ${outcome.mitigation}`}. The full fix is deferred and listed in the Redline handoff: ${outcome.fullFix}${commits ? local : ''}${owner}`
    case 'decided':
      return `Redline round ${round}: ${decisionSentence(outcome)}${commits ? ` Applied in ${commits}.${local}` : ' No code change.'}${owner}`
    case 'dropped':
      return `Redline round ${round}: not acted on in this run. ${outcome.reason}${owner}`
    default:
      return `Redline round ${round}: not changed in this round. ${outcome.why}${owner}`
  }
}

// ---------------------------------------------------------------------------
// Prompts.
// ---------------------------------------------------------------------------

function gatherPrompt(round) {
  return `${RUN_LINE}

Operation: gather (round ${round}). Run \`${GH} pr ${pr}\` once and return its fields exactly as printed, with error set to "". If the script fails, return its stderr in error and empty values elsewhere. Run nothing else.`
}

function reviewPrompt(round, reviewed, range, facts, history) {
  const diff = reviewed === 'pr'
    ? `the whole pull request: \`${GH} diff ${pr}\``
    : `only the fix diff: \`git diff ${range.from}..${range.to} -- ':/' ':(top,exclude)agent-os/specs'\` (the pathspec works from any directory in the repository and leaves out the round's spec folders, which are Redline's own record; do not review them)`
  const lines = [
    RUN_LINE,
    '',
    `You are the reviewer for round ${round}. Finding IDs are R${round}-<n>.`,
    '',
    'Run facts:',
    `- PR #${pr}: ${facts.title}`,
    `- Head branch ${headRef}, base ${baseRef}; the working tree is the PR's head${round > firstRound ? ` after the round ${round - 1} fixes (HEAD ${range.to})` : ` (${startSha})`}.`,
    `- The diff to review: ${diff}. Inline comments must sit on lines of the PR's diff on GitHub (\`${GH} diff ${pr}\`).`,
    ...(reviewed === 'pr'
      ? [`- That diff is built from GitHub's per-file patches. A file GitHub sent no patch for (built assets, lockfiles, generated code, binaries) shows as a header and one \`(no patch: ...)\` line; open such a file in the tree only when a finding points there, never as a pass over all of them.`]
      : []),
    `- Reviewed: ${reviewed}`,
    `- Your scratch Pest test, if you write one: ${scratchTest('reviewer', round)}`,
    '',
    'PR description:',
    '<<<',
    (facts.body || '').trim(),
    '>>>',
  ]
  if (history.length) {
    lines.push('', 'Findings from earlier rounds and what became of them (never re-raise a declined, deferred or decided one):', json(history))
  }
  lines.push(
    '',
    `Before you report anything, run the known-finding check your instructions describe: \`${GH} issues-search "<keywords>"\` for each candidate finding, \`${GH} review-comments ${pr}\`, \`${GH} pr-comments ${pr}\`, and the spec folders ${repoRoot}/agent-os/specs/*-${pr}-review-round-*/. A known finding goes in knownAs.`,
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
- Your scratch Pest test, if you write one: ${scratchTest('shaper', round)}. The reviewer's reproduction for this round, if it wrote one: ${scratchTest('reviewer', round)}.
${nitNote}
${description}

Findings for this round, as JSON:
${json(inScope)}

Sort each finding into fix, defer or ask per the unattended-mode section and your rules. Investigate first: open the files named, their callers and tests, and the standards and specs you cite. ${NEVER_DECIDE} A finding with needsDecision true is a judgment call unless your investigation shows the question does not arise. A question the PR description, the original spec or the code's own docblock already answers is answered from that evidence and recorded under Unattended answers, never escalated. Every task names every file it creates or changes, by path. Every decided entry under Decisions in shape.md (a fix, a defer, an unattended answer) ends with the line \`Decided by: redline\`; a pending entry has no such line until the person or the autopilot decides it. Write plan.md, shape.md, standards.md and references.md into the spec folder with Write. Do not edit any source file and never run a git write or gh.

Return only the JSON object your instructions specify: specFolder, findings (for every finding above: id, disposition, decidedBy "redline" for fix and defer or "pending" for ask, and recommendation in one sentence: the change planned for a fix, the mitigation for a defer, the option you recommend for an ask), deferred (one entry per defer finding), judgmentCalls (one entry per ask finding, in the order the person should answer them, each with dependsOn).`
}

function reshapePrompt(round, specFolder, inScope, adjustments, attempt) {
  return `This is a Redline run; follow shape-spec in unattended mode.

${RUN_LINE}

You are the shaper for round ${round}, called again because the plan approver bounced the plan (adjustment ${attempt} of at most ${maxPlanAdjustments}). The spec folder ${abs(specFolder)}/ already exists: read plan.md, shape.md, standards.md and references.md and correct them in place with Write. Do not create a second folder and do not touch its redline/ subfolder. Your scratch Pest test, if you need one: ${scratchTest('shaper', round)}.

The approver's adjustments, as JSON:
${json(adjustments)}

The round's findings, as JSON:
${json(inScope)}

Apply each adjustment, or record in shape.md why it cannot be applied. Every task still names its files by path. Decisions already recorded as decided in shape.md stay as they are. ${NEVER_DECIDE} An adjustment that would need a new decision becomes a judgment call, never a quiet change.

Return only the JSON object your instructions specify for the whole round (every finding above with id, disposition, decidedBy and recommendation; the deferred list; and every judgment call still pending or newly raised, in asking order with dependsOn).`
}

function resolvePrompt(round, specFolder, calls, roundDecisions, overrides) {
  const callDecisions = Object.fromEntries(calls.map((call) => [call.id, roundDecisions[call.id]]).filter(([, d]) => d))
  const overrideDecisions = Object.fromEntries(overrides.map((f) => [f.id, roundDecisions[f.id]]))
  const lines = [
    RUN_LINE,
    '',
    `You are the resolve agent for round ${round}. The judgment calls below were decided outside the shaper (by the person in their session, or by the autopilot taking the shaper's recommendation); write the decisions into the spec folder exactly as given.`,
    '',
    `- Spec folder: ${abs(specFolder)}/`,
    `- Each decision carries the date it was made (date); use it, or ${launchDate} when it is missing.`,
    `- Each decision carries its owner (decidedBy): \`${personLabel}\` for the person, \`${AUTOPILOT}\` for a recommendation taken on autopilot. Every decided entry you write under Decisions in shape.md ends with the line \`Decided by: <that value>\`, verbatim.`,
    `- A decision whose decidedBy is \`${AUTOPILOT}\` carries the shaper's own recommendation as its choice: apply the option that recommendation names (it may paraphrase the label), with the notes as its reasoning.`,
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

function planPrompt(round, specFolder, inScope, shaped, roundDecisions, adjustment, earlierPaths) {
  return `${RUN_LINE}

You are the plan approver for round ${round}. Adjustment number ${adjustment} (the workflow allows at most ${maxPlanAdjustments} bounces).

- Spec folder: ${abs(specFolder)}/
- The PR's files at launch: ${json(prFiles)}
- Paths approved in earlier rounds of this run (already allowed): ${json(earlierPaths)}

The round's findings, as JSON:
${json(inScope)}

The shaper's dispositions and deferred list, as JSON:
${json({ findings: shaped.findings, deferred: shaped.deferred })}

Decisions made outside the shaper (by the person, or by the autopilot taking the shaper's recommendation; decidedBy names which), already applied by the resolve agent (these are decided, not pending): ${Object.keys(roundDecisions).length ? json(roundDecisions) : 'none'}

Check the plan per your instructions. ${NEVER_DECIDE} A task that turns a still-pending decision into a change is a bounce, and you never decide one yourself. planPaths must list every path the tasks create or change (directories end in /), including the spec folder ${specFolder}/; it becomes the allowed-path list the checker enforces.

Return only the JSON your instructions specify.`
}

function standardsPrompt(round, specFolder) {
  return `${RUN_LINE}

You are the standards approver for round ${round}. Spec folder: ${abs(specFolder)}/. Read its shape.md section "Standards retrospective (proposed)" and decide each proposed edit per your instructions.

${NEVER_DECIDE} A proposed edit that depends on a pending decision is returned under deferred.

Return only the JSON your instructions specify.`
}

function snapshotPrompt(round, path, content) {
  return `${RUN_LINE}

Operation: snapshot (round ${round}). Write this JSON with the Write tool, byte for byte, to ${path} (overwrite it if it exists). No GitHub call, no other file.

\`\`\`json
${content}
\`\`\`

Return only the JSON your instructions specify, with operation "snapshot" and files [${JSON.stringify(path)}].`
}

function checkerCommand(flag, snapshot, octane) {
  return `${octane ? 'REDLINE_OCTANE=1 ' : ''}${CHECKS}${flag ? ` ${flag}` : ''} ${snapshot}`
}

function implementPrompt(round, ctx) {
  return `${RUN_LINE}

You are the implementer for round ${round}. The plan in the spec folder was approved; build exactly it, commit it Redline's way, and leave the gate green.

Run facts:
- PR #${pr}, head branch ${headRef}; commit messages reference (#${issue})
- Spec folder: ${abs(ctx.specFolder)}/
- The gate: \`${checkerCommand('', ctx.snapshotPath, ctx.octane)}\` (run it with timeout: 600000 on the Bash call; it outlasts the tool's two-minute default)
- Checks that already failed before this run started (baseline): ${ctx.baselineFailing.length ? ctx.baselineFailing.join(', ') : 'none'}. A check that was already failing is not yours to fix unless a task says so.

The round's findings, as JSON:
${json(ctx.inScope)}

Dispositions and deferred items (a defer task ships only the mitigation), as JSON:
${json({ findings: ctx.shaped.findings, deferred: ctx.deferred })}

Decisions made outside the shaper (already in the spec; decidedBy names the owner, the person or the autopilot): ${Object.keys(ctx.roundDecisions).length ? json(ctx.roundDecisions) : 'none'}

The plan approver's notes: ${ctx.plan.notes || 'none'}
Allowed paths (the checker refuses anything else): ${json(ctx.allowed)}

Approved standards edits (apply only these, in their own commit after the finding commits), as JSON:
${json(ctx.standards.approved.filter((edit) => !edit.alreadyCovered))}
The standards commit's message names every finding whose fix one of these edits carries, as shape.md's plan for that finding says (for example \`redline: record the round ${round} review lessons in the standards, finishing R${round}-1 (#${issue})\`), so that finding's reply names both of its commits. An edit that is only a lesson names no finding.
${ctx.standards.approved.length === 0 || ctx.standards.noChanges ? 'Nothing approved: record "Standards retrospective: no changes" under Decisions in shape.md.' : ''}

${NEVER_DECIDE} A Pending decision task is not implemented; a question that comes up while you build goes under blocked with the options. Never push.
${ctx.repair ? `\nThis is a repair pass. The checker's independent run of checks.sh failed after your last pass:\n${ctx.repair}\nFix the cause, commit Redline's way, and run the gate until it exits 0.\n` : ''}
Return only the JSON your instructions specify.`
}

function checkerPrompt(command) {
  return `${RUN_LINE}

Run this command line with Bash, exactly as given, once, with timeout: 600000 on the Bash call (the gate outlasts the tool's two-minute default), and return its JSON as your instructions say:

${command}`
}

function pushReplyPrompt(round, specFolder, replies, doPush) {
  const step1 = doPush
    ? `Step 1. Push: run \`git push origin ${headRef}\` once. If it is rejected, set error to git's message, write no reply files and stop.`
    : `Step 1. Do not push (${postToGitHub ? 'push is off for this run' : 'this is a dry run'}).`
  const step2 = postToGitHub
    ? `then act on its route. Route "thread": run \`${GH} reply ${pr} <comment_id> <file>\`. Route "issue-comment": the finding sits in the review body behind a <!-- redline:<id> --> marker, and its file already starts with that marker, so run \`${GH} comment ${pr} <file>\` once for it instead of reply and report reply_id 0. To check whether it is already posted, look in \`${GH} pr-comments ${pr}\` for its second line (\`**<id>** · ... · from the Redline round ${round} review body\`), never for the marker, which the review body also carries. Route "file-only": no review is on GitHub for it (a dry run, or a review that was never posted), so write the file, post nothing and report reply_id 0. Never reply twice in one thread, and never post a body finding's comment twice.`
    : 'and run nothing else (dry run).'
  return `${RUN_LINE}

Operation: push and reply for round ${round}. PR #${pr}, head branch ${headRef}. Spec folder: ${abs(specFolder)}. postToGitHub: ${postToGitHub}. push: ${doPush}.

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
  return `${RUN_LINE}

Operation: ${kind === 'handoff' ? 'comment (the Redline handoff) and request-review' : 'comment (the cap-hit comment)'}. PR #${pr}. Spec folder: ${abs(specFolder)}. postToGitHub: ${postToGitHub}. Do not touch the PR description; it is not part of this operation.

Step 1. Write this file with the Write tool, byte for byte: ${abs(file)}

\`\`\`markdown
${content}
\`\`\`

${post}

${request}

Return only the JSON your instructions specify, with operation "${kind}".`
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
// The checker's verdict. The script decides, never an agent.
// ---------------------------------------------------------------------------

function failingNames(out) {
  const checks = out && out.result && Array.isArray(out.result.checks) ? out.result.checks : []
  return checks.filter((check) => !check.recorded && check.exit !== 0).map((check) => check.name)
}

function judge(out, baselineFailing, needCommits) {
  const reasons = []
  if (!out || !out.result) {
    return { pass: false, reasons: ['the checker returned no result'], preExisting: [], diffLines: null }
  }
  if (out.error) {
    reasons.push(`checker error: ${out.error.slice(0, 400)}`)
  }
  if (out.exit === 2) {
    reasons.push('checks.sh exited 2 (usage error)')
  }
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
  if (!git) {
    reasons.push('the checker result has no git block')
  } else {
    const unexpected = git.unexpected_files || []
    if (unexpected.length) {
      reasons.push(`files outside the approved plan changed: ${unexpected.join(', ')}`)
    }
    const uncommitted = git.uncommitted || []
    if (uncommitted.length) {
      reasons.push(`uncommitted changes outside the spec folders, which the push would leave behind: ${uncommitted.join(', ')}`)
    }
    const commits = git.commits || []
    const unprefixed = commits.filter((commit) => !/^redline:/.test(commit.message || ''))
    if (unprefixed.length) {
      reasons.push(`commits without the redline: prefix: ${unprefixed.map((commit) => short(commit.sha)).join(', ')}`)
    }
    const missing = needCommits.filter((id) => !commits.some((commit) => mentions(commit.message, id)))
    if (missing.length) {
      reasons.push(`no commit names ${missing.join(', ')}`)
    }
  }
  if (out.exit !== 0 && reasons.length === 0 && preExisting.length === 0) {
    reasons.push(`checks.sh exited ${out.exit}`)
  }
  return { pass: reasons.length === 0, reasons, preExisting, diffLines: git ? git.diff_lines : null }
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

function compactFinding(f) {
  return { id: f.id, category: f.category, severity: f.severity, file: f.file, line: f.line, title: f.title, needsDecision: f.needsDecision, knownAs: f.knownAs }
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
      files: record.files || [],
    })),
    judgmentCalls: [],
    deferred: deferredAll,
    decided: decidedAll,
    openFindings: [],
    commits: commitsAll,
    recordCommit,
    specFolders: unique(rounds.map((record) => record.specFolder)),
    snapshotStart,
    warnings,
    relaunch: {
      workflow: 'redline:redline-loop',
      how: 'Relaunch with byte-identical args plus the answers this result asks for, and resumeFromRunId set to the runId of the launch that returned this result. Same session only. handoff (decisions): decisions ({"<id>": {"choice", "notes", "date"}}, every decision so far, unchanged). handoff (plan): approvedPlans with this round added, plus decisions for every ask and every changed disposition ({"choice", "notes", "date", "disposition": "fix|defer|accept"}). reviewed: selected ({"act": [ids], "dropped": {"<id>": "reason"}}).',
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

async function review(round, reviewed, range, facts) {
  const key = round === firstRound ? 'reviewerFirstRound' : 'reviewerLaterRounds'
  const out = await run('review', reviewPrompt(round, reviewed, range, facts, history()), {
    agentType: 'redline:redline-reviewer',
    ...modelOpts(key),
    label: `${round === firstRound ? 'review' : reviewed === 'final-nit-pass' ? 'final nit pass' : 're-review'} r${round}`,
    phase: round === firstRound ? 'Review' : 'Re-review',
    schema: REVIEW_SCHEMA,
  })
  // IDs are the script's to trust: renumber anything that does not carry this round's prefix.
  out.findings.forEach((f, index) => {
    if (!new RegExp(`^R${round}-\\d+$`).test(f.id)) {
      warnings.push(`round ${round}: reviewer returned id ${JSON.stringify(f.id)}; renamed R${round}-${index + 1}`)
      f.id = `R${round}-${index + 1}`
    }
  })
  return out
}

async function post(round, reviewed, range, specFolder, reviewOut, active, known) {
  const reviewFile = {
    path: `${specFolder}/redline/round-${round}-review.json`,
    content: json({
      body: reviewBody(round, reviewed, range, reviewOut, active, known),
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

function outcomesFor(inScope, shaped, deferred, roundDecisions, commits) {
  const outcomes = {}
  const dispositions = Object.fromEntries(shaped.findings.map((f) => [f.id, f.disposition]))
  const owners = Object.fromEntries(shaped.findings.map((f) => [f.id, f.decidedBy === 'pending' ? '' : f.decidedBy || REDLINE]))
  for (const f of inScope) {
    const named = commits.filter((c) => c.finding === f.id || mentions(c.message, f.id))
    const decision = roundDecisions[f.id]
    const deferredItem = deferred.find((d) => d.id === f.id)
    const owner = owners[f.id] || REDLINE
    if (decision) {
      outcomes[f.id] = { kind: 'decided', choice: decision.choice, notes: decision.notes || '', commits: named, decidedBy: decision.decidedBy || personLabel }
    } else if (dispositions[f.id] === 'defer' && deferredItem) {
      outcomes[f.id] = { kind: 'deferred', commits: named, fullFix: deferredItem.fullFix, mitigation: deferredItem.mitigation, decidedBy: owner }
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
    case 'dropped':
      return `not acted on in this run: ${outcome.reason}${owner}`
    default:
      return `not changed${owner}`
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
  return dropped.map((f) => {
    const outcome = { kind: 'dropped', reason: f.reason, commits: [], decidedBy: personLabel }
    record.outcomes[f.id] = describeOutcome(outcome)
    decidedAll.push({ id: f.id, round: record.round, title: f.title, outcome: describeOutcome(outcome), decidedBy: personLabel, choice: 'drop', notes: f.reason })
    return replyEntry(record.round, record.specFolder, f, outcome, record.commentIds[f.id] || 0, record.reviewPosted)
  })
}

// The review dial's relaunch with nothing selected: every finding was dropped, so the replies go
// out without a revise pass and the run finishes.
async function replyDropped(record) {
  const replies = droppedReplies(record)
  if (!replies.length) {
    return
  }
  phase('Push and reply')
  const pushed = await run('push-and-reply', pushReplyPrompt(record.round, record.specFolder, replies, false), {
    agentType: 'redline:redline-github', ...modelOpts('github'), label: `push and reply r${record.round}`, phase: 'Push and reply', schema: PUSH_REPLY_SCHEMA,
  })
  if (pushed.error) {
    throw stageError('push-and-reply', `replies failed in round ${record.round}: ${pushed.error}`)
  }
  record.files.push(...replies.map((reply) => reply.file.slice(repoRoot.length + 1)))
}

async function checker(flag, snapshot, octane, label) {
  return run('check', checkerPrompt(checkerCommand(flag, snapshot, octane)), {
    agentType: 'redline:redline-checker', ...modelOpts('checker'), label, phase: 'Check', schema: CHECKER_SCHEMA, stallMs: checkerStallMs,
  })
}

// One revise pass for a round: Shape, hand-off, Resolve, Approve, Implement, Check, Push and reply.
async function revise(record, inScope, reviewedKind) {
  const { round, specFolder } = record

  phase('Shape')
  let shaped = await run('shape', shapePrompt(round, specFolder, reviewedKind, inScope, record.prBody), {
    agentType: 'redline:redline-shaper', ...modelOpts('revise'), label: `shape r${round}`, phase: 'Shape', schema: SHAPE_SCHEMA,
  })
  if (shaped.specFolder.replace(/\/+$/, '') !== specFolder) {
    warnings.push(`round ${round}: shaper reported spec folder ${shaped.specFolder}, expected ${specFolder}`)
  }
  const unsorted = inScope.filter((f) => !shaped.findings.some((s) => s.id === f.id)).map((f) => f.id)
  if (unsorted.length) {
    throw stageError('shape', `the shaper gave no disposition for ${unsorted.join(', ')}`)
  }
  record.dispositions = shaped.findings

  // The interrupt dial. Decisions enter only after the shaper, so its result replays from cache
  // on the relaunch whatever the dial says.
  //
  // plan: the person sees every disposition before anything is planned further. The run ends
  // here each round until the relaunch carries this round in args.approvedPlans, with any ask
  // answered and any disposition changed under args.decisions.
  if (interrupt === 'plan' && !approvedPlans.includes(round)) {
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
        decisions[call.id] = autopilotDecision(call)
        log(`round ${round}: autopilot decided ${call.id} (${decisions[call.id].choice})`)
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
      roundDecisions[id] = withOwner(decisions[id])
    }
    const out = await run('resolve', resolvePrompt(round, specFolder, newCalls, roundDecisions, newOverrides), {
      agentType: 'redline:redline-resolve', ...modelOpts('revise'), label: `resolve r${round}${suffix}`, phase: 'Resolve', schema: RESOLVE_SCHEMA,
    })
    if (out.unresolved.length) {
      const ids = out.unresolved.map((item) => item.id)
      if (interrupt === 'autopilot') {
        throw stageError('resolve', `autopilot could not apply the shaper's recommendation for ${ids.join(', ')}`, { unresolved: out.unresolved })
      }
      return { handoff: true, kind: 'decisions', pending: newCalls.filter((call) => ids.includes(call.id)), calls, unresolved: out.unresolved }
    }
    deferred = deferred.concat(out.deferred.filter((item) => !deferred.some((d) => d.id === item.id)))
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
      () => run('approve', planPrompt(round, specFolder, inScope, { findings: effectiveDispositions(), deferred }, roundDecisions, adjustment, approvedPaths), {
        agentType: 'redline:redline-plan-approver', ...modelOpts('planApprover'), label: `plan approver r${round}${suffix}`, phase: 'Approve', schema: PLAN_SCHEMA,
      }),
      () => run('approve', standardsPrompt(round, specFolder), {
        agentType: 'redline:redline-standards-approver', ...modelOpts('standardsApprover'), label: `standards approver r${round}${suffix}`, phase: 'Approve', schema: STANDARDS_SCHEMA,
      }),
    ])
    plan = approvals[0]
    standards = approvals[1]
    if (!plan || !standards) {
      throw stageError('approve', `the ${!plan ? 'plan' : 'standards'} approver returned nothing in round ${round}`)
    }
    if (plan.approved) {
      break
    }
    if (adjustment >= maxPlanAdjustments) {
      throw stageError('approve', `the plan approver did not approve the round ${round} plan after ${maxPlanAdjustments} adjustments`, { adjustments: plan.adjustments, notes: plan.notes })
    }
    log(`round ${round}: plan bounced (${plan.adjustments.length} adjustments); reshaping`)
    shaped = await run('shape', reshapePrompt(round, specFolder, inScope, plan.adjustments, adjustment + 1), {
      agentType: 'redline:redline-shaper', ...modelOpts('revise'), label: `reshape r${round} #${adjustment + 1}`, phase: 'Shape', schema: SHAPE_SCHEMA,
    })
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
  const written = await run('snapshot', snapshotPrompt(round, snapshotPath, json(snapshot)), {
    agentType: 'redline:redline-github', ...modelOpts('github'), label: `snapshot r${round}`, phase: 'Approve', schema: FILE_OP_SCHEMA,
  })
  if (written.error) {
    throw stageError('snapshot', `writing ${snapshotPath} failed: ${written.error}`)
  }
  const octane = A.octane === true || approvedPaths.some((path) => /^(app\/Providers\/|bootstrap\/|config\/octane\.php)/.test(path))

  if (!baseline) {
    phase('Check')
    baseline = await checker('--baseline', snapshotStart, false, 'baseline')
    baselineFailing = failingNames(baseline)
    if (baselineFailing.length) {
      warnings.push(`baseline: ${baselineFailing.join(', ')} already failing before the first implement step`)
    }
  }

  const accepted = new Set(finalDispositions.filter((f) => f.disposition === 'accept').map((f) => f.id))
  const needCommits = finalDispositions
    .filter((f) => f.disposition === 'fix' || f.disposition === 'defer')
    .map((f) => f.id)
    .concat(resolved ? resolved.tasks.filter((task) => task.files.length && task.finding && !accepted.has(task.finding)).map((task) => task.finding) : [])
  const ctx = {
    specFolder, snapshotPath, octane, baselineFailing, inScope, shaped: { ...shaped, findings: finalDispositions }, deferred, roundDecisions, plan, standards,
    allowed: unique(prFiles.concat(approvedPaths, ['agent-os/specs/', 'agent-os/standards/', 'openapi.json'])),
    repair: '',
  }

  let implemented = null
  let checked = null
  let verdict = null
  for (let attempt = 0; attempt < 2; attempt++) {
    phase('Implement')
    implemented = await run('implement', implementPrompt(round, ctx), {
      agentType: 'redline:redline-implementer', ...modelOpts('revise'), label: `${attempt ? 'repair' : 'implement'} r${round}`, phase: 'Implement', schema: IMPLEMENT_SCHEMA,
    })
    if (implemented.blocked.length) {
      throw stageError('implement', `the implementer is blocked in round ${round}`, { blocked: implemented.blocked })
    }
    phase('Check')
    checked = await checker(checkerMode === 'git-only' ? '--git-only' : '', snapshotPath, octane, `${attempt ? 'recheck' : 'check'} r${round}`)
    verdict = judge(checked, baselineFailing, unique(needCommits))
    log(`round ${round}: checker ${verdict.pass ? 'passed' : `failed (${verdict.reasons.join('; ')})`}`)
    if (verdict.pass) {
      break
    }
    ctx.repair = `${verdict.reasons.join('\n')}\n${failingExcerpt(checked)}`
  }
  record.check = { pass: verdict.pass, reasons: verdict.reasons, preExisting: verdict.preExisting, diffLines: verdict.diffLines }
  if (!verdict.pass) {
    throw stageError('check', `checks.sh still fails after one repair pass in round ${round}: ${verdict.reasons.join('; ')}`)
  }
  if (verdict.preExisting.length) {
    warnings.push(`round ${round}: ${verdict.preExisting.join(', ')} still failing, as at baseline`)
  }

  const gitCommits = (checked.result.git && checked.result.git.commits) || []
  const known = new Set(commitsAll.map((c) => c.sha))
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

  const outcomes = outcomesFor(inScope, { ...shaped, findings: finalDispositions }, deferred, roundDecisions, roundCommits)
  record.outcomes = Object.assign(record.outcomes || {}, Object.fromEntries(Object.entries(outcomes).map(([id, outcome]) => [id, describeOutcome(outcome)])))
  for (const f of inScope) {
    decidedAll.push({ id: f.id, round, title: f.title, outcome: describeOutcome(outcomes[f.id]), decidedBy: outcomes[f.id].decidedBy, choice: outcomes[f.id].choice || '', notes: outcomes[f.id].notes || '' })
  }

  phase('Push and reply')
  const replies = inScope.map((f) => replyEntry(round, specFolder, f, outcomes[f.id], record.commentIds[f.id] || 0, record.reviewPosted)).concat(droppedReplies(record))
  const doPush = push && roundCommits.length > 0
  const pushed = await run('push-and-reply', pushReplyPrompt(round, specFolder, replies, doPush), {
    agentType: 'redline:redline-github', ...modelOpts('github'), label: `push and reply r${round}`, phase: 'Push and reply', schema: PUSH_REPLY_SCHEMA,
  })
  if (pushed.error) {
    throw stageError('push-and-reply', `push or replies failed in round ${round}: ${pushed.error}`)
  }
  record.files.push(...replies.map((reply) => reply.file.slice(repoRoot.length + 1)))
  record.pushed = pushed.pushed
  const newHead = roundCommits.length ? roundCommits[roundCommits.length - 1].sha : null
  return { handoff: false, newHead, commits: roundCommits }
}

// Known limits in the plugin's README, where the teammate reading the handoff can open it.
function knownLimits() {
  return `[Known limits](${README_URL}#known-limits) in Redline's README`
}

function handoffComment(lastFixUnreviewed, prBody) {
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
  if (decidedAll.length) {
    lines.push('', '### Decisions', '', ...decidedAll.map((d) => `- **${d.id}** ${d.title}: ${d.outcome}`))
  }
  if (deferredAll.length) {
    lines.push('', '### Deferred (mitigated now, full fix left open)', '', ...deferredAll.map((d) => `- **${d.id}** ${d.title}: shipped ${d.mitigation}; open: ${d.fullFix}`))
  }
  if (commitsAll.length) {
    lines.push('', '### Commits', '', ...commitsAll.map((c) => `- ${short(c.sha)} ${c.message}`))
  }
  if (!push) {
    lines.push('', 'The commits are local only; push was off for this run.')
  }
  return lines.join('\n')
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
// replaced. compose(prBody) returns the comment's text.
async function finish(kind, record, compose) {
  phase('Finish')
  const file = `${record.specFolder}/redline/${kind === 'handoff' ? 'handoff' : 'cap-hit'}.md`
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
  const out = await run('finish', finishPrompt(kind, record.specFolder, file, compose(prBody)), {
    agentType: 'redline:redline-github', ...modelOpts('github'), label: kind === 'handoff' ? 'handoff comment' : 'cap-hit comment', phase: 'Finish', schema: FINISH_SCHEMA,
  })
  if (out.error) {
    throw stageError('finish', `the ${kind} comment failed: ${out.error}`)
  }
  record.files.push(file)
  recordCommit = await commitRecord()
  return { ...out, prBody }
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
  const judgmentCalls = outcome.pending.map((call) => ({ ...call, finding: findingOf(call.id) }))
  if (outcome.kind === 'plan') {
    log(`round ${record.round}: the plan dial stops after shaping (${outcome.shaped.findings.length} dispositions, ${outcome.pending.length} to answer); the run ends here and resumes on relaunch`)
    return result('handoff', {
      handoffKind: 'plan',
      handoffRound: record.round,
      specFolder: record.specFolder,
      plan: outcome.shaped.findings.map((s) => ({ ...s, finding: findingOf(s.id), decidedBy: s.decidedBy === 'pending' ? '' : s.decidedBy })),
      deferredPlanned: outcome.shaped.deferred,
      judgmentCalls,
      unresolved: [],
      decisionsNeeded: outcome.pending.map((call) => call.id),
      approveWith: { approvedPlans: unique(approvedPlans.concat(record.round)) },
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
    return result('done', { reviseOnly: true, note: 'One revise pass; no re-review, handoff comment or review request.' })
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
    const record = { round, reviewed, specFolder, range: round === firstRound ? null : range, findings: considered, droppedNits, post: { dryRun: posted.dryRun, posted: posted.posted, skipped: posted.skipped, reviewId: posted.review.id, url: posted.review.html_url, movedToBody: posted.review.movedToBody }, reviewPosted: posted.posted || Boolean(posted.skipped), commentIds, files: files.slice(), prBody: facts.body || '', prUrl: facts.url || '' }
    rounds.push(record)

    if (reviewOnly) {
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
        await replyDropped(record)
        const finished = await finish('handoff', record, (prBody) => handoffComment(false, prBody))
        return result('done', { handoffPosted: finished.posted, reviewRequested: finished.reviewRequested, prBody: finished.prBody, note: 'No finding was selected to act on, so there was no revise pass.' })
      }
    }
    const correctness = active.filter((f) => f.category === 'correctness')
    const nits = active.filter((f) => f.category === 'nit')

    if (reviewed === 'final-nit-pass') {
      if (correctness.length === 0) {
        const finished = await finish('handoff', record, (prBody) => handoffComment(false, prBody))
        return result('done', { handoffPosted: finished.posted, reviewRequested: finished.reviewRequested, prBody: finished.prBody })
      }
      // One more fix pass, then stop regardless.
      const outcome = await revise(record, correctness, 'correctness')
      if (outcome.handoff) {
        return handoffResult(record, outcome)
      }
      const finished = await finish('handoff', record, (prBody) => handoffComment(true, prBody))
      return result('done', { lastFixUnreviewed: true, handoffPosted: finished.posted, reviewRequested: finished.reviewRequested, prBody: finished.prBody })
    }

    if (correctness.length === 0 && nits.length === 0) {
      const finished = await finish('handoff', record, (prBody) => handoffComment(false, prBody))
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
      const finished = await finish('handoff', record, (prBody) => handoffComment(false, prBody))
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
  return result('error', { stage: error.stage || 'workflow', error: error.message, detail: error.extra || {} })
}
