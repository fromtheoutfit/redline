#!/usr/bin/env node
// Mock harness for workflows/redline-loop.js: runs the workflow script with agent() and parallel()
// replaced by scripted stand-ins, and checks the shape of the run (which agents were called, in
// what order, with what prompts, and what the script returned). No model, no GitHub, no repository.
//
//   node tests/loop-test.mjs            (from the plugin's checkout)
//
// Each scenario scripts the reviewer's findings per round, the shaper's dispositions (ask, defer,
// everything else fix) and the commits the checker reports per revise pass. Exit 1 on any failed
// check. The harness also proves the replay rule: on a relaunch after a hand-off, every prompt up
// to the stopping point is byte-identical, which is what lets resumeFromRunId replay from cache.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const src = fs.readFileSync(path.join(here, '..', 'workflows', 'redline-loop.js'), 'utf8').replace('export const meta', 'const meta')
const body = `return (async () => { ${src} })()`
// The reviewer's own instructions, for the checks that pin a verifier rule in both the agent file
// and the verify prompt (#85).
const reviewerAgent = fs.readFileSync(path.join(here, '..', 'agents', 'redline-reviewer.md'), 'utf8')

let passed = 0
const failures = []
function check(name, condition, detail) {
  if (condition) {
    passed += 1
  } else {
    failures.push(name + (detail === undefined ? '' : `: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`))
  }
}

const SHA = (n) => String(n).padEnd(40, 'b')
// The review body's closing sentence, written when the round has findings, after the last finding
// list and before For the person (the #87 follow-up spec, answer 9).
const CLOSING = 'Each item has an inline comment with the detail or, where GitHub could not anchor it, sits under Not placed inline below. Redline replies in the item\'s thread, or in a PR comment that opens with its marker, with what it decided and why.'
// The word joiner's numeric character reference the workflow puts after a neutralised `@`: plain
// ASCII, so the GitHub agent's byte-for-byte copy keeps it, and GitHub shows it as U+2060 (#87;
// the #87 follow-up spec, answer 8). RAW_WJ is the raw character, written as its escape, for the
// checks that no prompt the GitHub agent copies holds one.
const WJ = '&#8288;'
const RAW_WJ = '\u2060'

function mock(scenario) {
  const calls = []
  let reviewN = 0
  // The highest round a post call put on GitHub, which is what last-round reads at Finish (#81).
  let postedRound = 0
  let planN = 0
  const agent = async (prompt, opts) => {
    calls.push({ label: opts.label, agentType: opts.agentType, prompt, opts })
    const t = opts.agentType
    // The coverage pass (#79): a call with no agent type and the label `coverage r<n>`, answered
    // with scenario.coverage[n-1] as the agent's final text (a string; by default a fenced empty
    // array). A coverage call that carries an agent type or a schema is a regression (the guard
    // does not see a skill fork, and a schema on the caller can swallow the fork's output), so the
    // mock refuses it outright.
    if (/^coverage r\d+$/.test(opts.label || '')) {
      if (t !== undefined || opts.schema !== undefined) {
        throw new Error(`coverage call ${opts.label} carries ${t !== undefined ? 'an agent type' : 'a schema'}`)
      }
      const n = Number(opts.label.slice('coverage r'.length))
      const scripted = scenario.coverage ? scenario.coverage[n - 1] : undefined
      return scripted === undefined ? '```json\n[]\n```' : scripted
    }
    if (t === 'redline:redline-github') {
      if (opts.label.startsWith('gather')) {
        return { number: 114, title: 'T', body: 'PR BODY TEXT', state: 'OPEN', baseRefName: 'main', headRefName: 'redline-seed-3', headRefOid: scenario.heads ? scenario.heads.shift() : 'a'.repeat(40), url: 'https://github.com/example/repo/pull/114', error: '' }
      }
      if (opts.label.startsWith('post')) {
        // A dry run posts nothing, as the real agent answers it: no review, no comments.
        if (prompt.includes('postToGitHub: false.')) {
          return { operation: 'post-review', dryRun: true, posted: false, skipped: '', review: { id: 0, html_url: '', comments: [], movedToBody: [] }, files: [], error: '' }
        }
        // Every finding gets an inline thread, unless the scenario moves some (scenario.moved) or
        // all of them (scenario.noInline) into the review body, as the script does when GitHub
        // cannot anchor a comment. scenario.postError is the agent's error on a posted review (the
        // Losers League #778 shape), scenario.postReviewId its review id (default 1), and
        // scenario.postDrop the findings left out of both comments and movedToBody.
        postedRound = Math.max(postedRound, Number(opts.label.slice(6)) || 0)
        const ids = [...new Set([...prompt.matchAll(/\*\*(R\d+-\d+)\*\*/g)].map((m) => m[1]))]
        const drop = scenario.postDrop || []
        const moved = (scenario.noInline ? ids : (scenario.moved || [])).filter((id) => !drop.includes(id))
        const inline = ids.filter((id) => !moved.includes(id) && !drop.includes(id))
        return { operation: 'post-review', dryRun: false, posted: true, skipped: '', review: { id: scenario.postReviewId === undefined ? 1 : scenario.postReviewId, html_url: '', comments: inline.map((id, i) => ({ finding: id, id: 100 + i })), movedToBody: moved }, files: [], error: scenario.postError || '' }
      }
      if (opts.label.startsWith('snapshot')) {
        return { operation: 'snapshot', files: [], error: '' }
      }
      // The spec check (#57): the folder's four files and the Decisions heading, as the two git grep
      // commands print them. scenario.specMissing leaves one out (a kind for every status call, or
      // an object keyed by label); scenario.specError is the agent's error.
      if (opts.label.startsWith('spec status')) {
        const folder = prompt.match(/agent-os\/specs\/[^/\s]+/)[0]
        const kind = typeof scenario.specMissing === 'object' && scenario.specMissing !== null ? scenario.specMissing[opts.label] || '' : scenario.specMissing || ''
        const all = ['plan.md', 'shape.md', 'standards.md', 'references.md']
        const names = kind === 'folder' ? [] : kind === 'plan' ? all.slice(1) : kind === 'shape' ? ['plan.md', 'standards.md', 'references.md'] : kind === 'partial' ? ['plan.md', 'shape.md'] : all
        const headings = names.includes('shape.md') && kind !== 'decisions' ? [`${folder}/shape.md`] : []
        return { operation: 'spec-status', files: names.map((n) => `${folder}/${n}`), headings, error: scenario.specError || '' }
      }
      // scenario.pushError is the agent's error on a push and replies that went through. The
      // replies answer as the real agent does: one entry per entry in the prompt, reply_id 200+i
      // for a thread reply and 0 where nothing was posted (#39).
      if (opts.label.startsWith('push')) {
        const entries = JSON.parse(prompt.slice(prompt.indexOf('Replies, as JSON:\n[') + 18, prompt.lastIndexOf(']') + 1))
        const replies = entries.map((r, i) => ({ finding: r.finding, comment_id: r.comment_id, reply_id: r.route === 'thread' ? 200 + i : 0 }))
        return { operation: 'push-and-reply', dryRun: false, pushed: true, replies, files: [], error: scenario.pushError || '' }
      }
      // The sweep (#39): every given inline id resolves unless scenario.threadsSkipped names it with
      // the script's reason; scenario.resolveError is the agent's error.
      if (opts.label === 'resolve threads') {
        const ids = prompt.slice(prompt.indexOf('resolve-threads 114 ') + 20).split('\n')[0].split(' ').map(Number)
        const skipped = scenario.threadsSkipped || {}
        const roots = ids.filter((id) => id < 200)
        return { operation: 'resolve-threads', resolved: roots.filter((id) => !skipped[id]).map((id) => ({ id, thread: `PRRT_${id}` })), skipped: roots.filter((id) => skipped[id]).map((id) => ({ id, reason: skipped[id] })), error: scenario.resolveError || '' }
      }
      // Finish's read of the highest posted round (#81): scenario.lastPosted, else the highest round
      // a post call of this run posted; scenario.lastRoundError is the agent's error.
      if (opts.label === 'last round') {
        return { operation: 'last-round', round: scenario.lastPosted === undefined ? postedRound : scenario.lastPosted, error: scenario.lastRoundError || '' }
      }
      // scenario.updateError is the agent's error on an update that ran nothing (no pr-body.md).
      if (opts.label === 'PR description') {
        return { operation: 'update', prBody: { file: '', updated: false, backup: '', copy: '' }, error: scenario.updateError || '' }
      }
      // git status over the record's paths: by default one uncommitted file per round folder, and
      // the start snapshot as untracked; scenario.recordFiles scripts the list instead.
      if (opts.label === 'record files') {
        const paths = prompt.slice(prompt.indexOf('--untracked-files=all -- ') + 25).split('\n')[0].split(' ')
        const files = scenario.recordFiles ? scenario.recordFiles.slice() : paths.map((p) => (p.endsWith('/') ? `${p}handoff.md` : p))
        return { operation: 'record-status', files, error: '' }
      }
      if (opts.label === 'record commit') {
        const files = prompt.slice(prompt.indexOf(' add -- ') + 8).split('\n')[0].split(' ')
        return { operation: 'record-commit', committed: true, sha: 'c'.repeat(40), pushed: prompt.includes('push: true'), files, error: scenario.recordError || '' }
      }
      // scenario.finishError (#59, R1-6) is the agent's error on a Finish comment, such as a review
      // request GitHub refused after the comment posted. scenario.finishUrl (#59, R2-1) is the URL a
      // resumed Finish comment reports when it found its comment already posted, which is "".
      return { operation: 'handoff', dryRun: false, posted: true, comment_url: 'finishUrl' in scenario ? scenario.finishUrl : 'u', reviewRequested: true, files: [], error: scenario.finishError || '' }
    }
    if (t === 'redline:redline-reviewer') {
      reviewN += 1
      // scenario.resolved[n] is the nth review's resolved list (#35): earlier findings the reviewer found gone.
      // scenario.coverageOut[n] is the nth review's accounting of the coverage candidates and
      // (#79; a verifier since #93 returns no For the person list); absent, the key is left out,
      // as a reviewer before the pass existed would. scenario.summary[n] is the nth review's summary
      // (#87), 'S' when absent.
      return {
        round: reviewN, reviewed: 'pr', findings: scenario.reviews[reviewN - 1] || [], resolved: scenario.resolved ? scenario.resolved[reviewN - 1] || [] : [], summary: scenario.summary ? scenario.summary[reviewN - 1] || 'S' : 'S',
        ...(scenario.coverageOut ? { coverage: scenario.coverageOut[reviewN - 1] || [] } : {}),
      }
    }
    if (t === 'redline:redline-shaper') {
      // scenario.shaperDrop (#10): the ids the shaper leaves out of its findings, a shape-stage error.
      const ids = [...new Set([...prompt.matchAll(/"id": "([RH]\d+-\d+)"/g)].map((m) => m[1]))].filter((id) => !(scenario.shaperDrop || []).includes(id))
      const ask = scenario.ask || []
      const defer = scenario.defer || []
      const none = scenario.none || []
      // scenario.decline (#93): the ids the shaper declines on its own, each with a reason
      // (scenario.reason[id], or a default one); scenario.declineNoReason leaves the reason out,
      // a shape-stage error. scenario.whyHuman[id] is a judgment call's why_human ('product
      // decision' when absent), and scenario.secondLook[id] the shaper's second look at an item
      // the verifier could not confirm.
      const decline = scenario.decline || []
      // A human review pass (#36): a fix is the reviewer's (decidedBy "reviewer"), unless the
      // scenario scripts another owner (scenario.shaperOwner) to prove the workflow corrects it.
      const human = prompt.includes('a revise pass whose findings are the review comments')
      // A reshape answers what the reshape prompt asks for (#61, R1-2), and only when scripted: the
      // ids whose call it leaves out (reshapeOmitCall), sorts fix with the call kept (reshapeFix),
      // newly sorts ask (reshapeAsk) or gives a call while sorting as before (reshapeExtraCall).
      const reshape = typeof opts.label === 'string' && opts.label.startsWith('reshape')
      const onReshape = (key) => (reshape && scenario[key]) || []
      const disposition = (id) => (onReshape('reshapeFix').includes(id) ? 'fix' : ask.includes(id) || onReshape('reshapeAsk').includes(id) ? 'ask' : defer.includes(id) ? 'defer' : decline.includes(id) ? 'decline' : none.includes(id) ? 'none' : 'fix')
      const owner = (id) => (disposition(id) === 'ask' ? 'pending' : disposition(id) === 'fix' && human ? scenario.shaperOwner || 'reviewer' : 'redline')
      return {
        specFolder: prompt.match(/agent-os\/specs\/[^/\s]+/)[0],
        // scenario.files and scenario.askRule (#49) add the paths a finding's task touches and the
        // shaper's ask-rule tag, only when scripted, so every other scenario's JSON is unchanged.
        findings: ids.map((id) => ({
          id, disposition: disposition(id), decidedBy: owner(id), recommendation: `${disposition(id)} ${id} this way`,
          ...(scenario.files && scenario.files[id] ? { files: scenario.files[id] } : {}),
          ...(scenario.askRule && scenario.askRule[id] ? { askRule: scenario.askRule[id] } : {}),
          ...(disposition(id) === 'decline' && !(scenario.declineNoReason || []).includes(id) ? { reason: (scenario.reason && scenario.reason[id]) || `the spec keeps ${id} as it is on purpose` } : {}),
          ...(scenario.secondLook && scenario.secondLook[id] ? { secondLook: scenario.secondLook[id] } : {}),
        })),
        // scenario.mitigation (#87) is the shaper's mitigation for every deferred finding.
        deferred: ids.filter((id) => defer.includes(id)).map((id) => ({ id, mitigation: scenario.mitigation || 'a guard clause', fullFix: 'a lock' })),
        // scenario.shaperNoCall (#57) leaves an ask without its call; scenario.shaperExtraCall gives a
        // call to a finding sorted otherwise. Both are shape-stage errors.
        judgmentCalls: ids.filter((id) => !onReshape('reshapeOmitCall').includes(id) && ((ask.includes(id) && !(scenario.shaperNoCall || []).includes(id)) || (scenario.shaperExtraCall || []).includes(id) || onReshape('reshapeAsk').includes(id) || onReshape('reshapeExtraCall').includes(id))).map((id) => ({ id, title: `call ${id}`, story: 's', why_human: (scenario.whyHuman && scenario.whyHuman[id]) || 'product decision', options: [{ label: 'Keep it', cost: 'c', effect: 'e' }, { label: 'Change it', cost: 'c', effect: 'e' }], recommendation: 'Keep it', dependsOn: [] })),
      }
    }
    if (t === 'redline:redline-resolve') {
      const ids = [...new Set([...prompt.matchAll(/"([RH]\d+-\d+)": \{/g)].map((m) => m[1]))]
      // An accepted override has no files to touch, nor does a finding left to the person under a
      // repository ask rule (its decision carries rule, #49); everything else gets a task with a file.
      // scenario.acceptedCalls (#93): the judgment calls the person answered with no change.
      const accepted = new Set([...prompt.matchAll(/"([RH]\d+-\d+)": \{[^}]*"disposition": "accept"/g)].map((m) => m[1]).concat(scenario.acceptedCalls || []))
      const left = new Set([...prompt.matchAll(/"([RH]\d+-\d+)": \{[^}]*"rule": "/g)].map((m) => m[1]))
      const title = (id) => (accepted.has(id) ? `Accepted, no change: ${id}` : left.has(id) ? `Left to the person: ${id}` : `t ${id}`)
      return { specFolder: 'x', tasks: ids.map((id, i) => ({ n: i + 2, title: title(id), files: accepted.has(id) || left.has(id) ? [] : ['app/x.php'], finding: id })), deferred: [], unresolved: scenario.unresolved ? scenario.unresolved.slice() : [] }
    }
    if (t === 'redline:redline-plan-approver') {
      // scenario.planBounce (#10): the plan approver bounces the plan this many times first.
      if (scenario.planBounce && planN++ < scenario.planBounce) {
        return { approved: false, adjustments: [{ task: 2, problem: 'p', change: 'c' }], planPaths: [], notes: '' }
      }
      return { approved: true, adjustments: [], planPaths: ['app/x.php'], notes: '' }
    }
    if (t === 'redline:redline-standards-approver') {
      return { approved: [], rejected: [], deferred: [], noChanges: true }
    }
    if (t === 'redline:redline-implementer') {
      return { commits: [], checks: { ok: true, runs: 1 }, deviations: [], blocked: [] }
    }
    if (t === 'redline:redline-checker') {
      // scenario.checker(label, out) replaces the result of one call (#9: a stray error, a failing
      // gate, an unreadable result); nothing returned keeps the default.
      let out
      if (opts.label === 'baseline') {
        out = { exit: 0, status: 'read', reason: '', result: { mode: 'baseline', ok: true, checks: [{ name: 'check', exit: 0, recorded: false }], git: null }, error: '' }
      } else {
        scenario.allCommits.push(...(scenario.commitIds.shift() || []))
        out = { exit: 0, status: 'read', reason: '', result: { mode: 'full', ok: true, checks: [{ name: 'check', exit: 0, recorded: false }], git: { unexpected_files: [], uncommitted: [], commits: scenario.allCommits.map((id, i) => ({ sha: SHA(i + 1), message: id.startsWith('redline:') ? id : `redline: ${id} fix` })).reverse(), diff_lines: 3 } }, error: '' }
      }
      return (scenario.checker && scenario.checker(opts.label, out)) || out
    }
    throw new Error('unexpected agent type ' + t)
  }
  return { agent, calls }
}

const f = (id, category, extra) => ({ id, file: 'app/x.php', line: 1, side: 'RIGHT', category, severity: 'low', confidence: 'confirmed', title: `title ${id}`, description: 'd', proposedFix: '', knownAs: '', carriedFrom: '', ...extra })
// An earlier round's finding as redline-gh.sh prior-findings prints it (#35).
const prior = (id, disposition, extra) => ({ id, round: Number(id.slice(1).split('-')[0]), review_id: 20, category: 'correctness', severity: 'low', confidence: 'likely', file: 'app/x.php', line: 1, title: `title ${id}`, comment_id: 0, body: '', reply: null, carried_from: '', carried_to: '', disposition, ...extra })
const baseArgs = {
  repoRoot: '/r', pluginRoot: '/p', pr: 114, launchedAt: '2026-10-20T16:00:00-0400', headRef: 'redline-seed-3', baseRef: 'main',
  startSha: 'a'.repeat(40), files: ['app/x.php'], snapshotPath: '/r/agent-os/specs/x/redline/snapshot-start.json', reviewer: 'sam', login: 'author',
  // coverage null: the reviewer alone, as before the coverage pass existed (#79), so every scenario
  // below section 15 runs today's rounds and today's done rule byte for byte.
  models: { revise: { model: 'claude-opus-5-5' }, coverage: null }, baselineSeconds: 33,
}

// No review, reply or closing comment of any scenario holds a For the person section (#93): every
// prompt of every run is read, and one check at the end says so.
const forThePerson = []

async function go(name, args, scenario, script = body) {
  const s = { ...scenario, allCommits: [], commitIds: (scenario.commitIds || []).map((c) => c.slice()), reviews: scenario.reviews, unresolved: scenario.unresolved, recordFiles: scenario.recordFiles }
  const { agent, calls } = mock(s)
  const fn = new Function('args', 'agent', 'parallel', 'phase', 'log', script)
  const parallel = async (thunks) => Promise.all(thunks.map((t) => t().catch(() => null)))
  let res
  let thrown = null
  try {
    res = await fn(args, agent, parallel, () => {}, () => {})
  } catch (error) {
    thrown = error
  }
  console.log(`== ${name}: ${thrown ? `threw ${thrown.message}` : `status=${res.status}${res.handoffKind ? ` (${res.handoffKind})` : ''} rounds=${res.rounds.length}${res.error ? ` error=${res.error}` : ''}`}`)
  console.log('   calls: ' + calls.map((c) => c.label).join(' | '))
  forThePerson.push(...calls.filter((c) => c.prompt.includes('### For the person') || c.prompt.includes('forThePerson')).map((c) => `${name}: ${c.label}`))
  // Every run that reaches Finish ends with the run-record commit: after the closing comment, or
  // after the post of a review-only run or the replies of a revise-only run (#10).
  if (!thrown && (res.status === 'capped' || res.status === 'review-only' || 'handoffPosted' in res || 'humanReview' in res) && !scenario.recordFiles) {
    const tail = calls.slice(-3).map((c) => c.label)
    const before = res.status === 'review-only' ? /^post r\d+$/ : res.reviseOnly ? /^push and reply r\d+$/ : /comment$/
    check(`${name}: the run-record commit is the last call, after the closing step`, before.test(tail[0]) && tail[1] === 'record files' && tail[2] === 'record commit' && res.recordCommit && res.recordCommit.committed, tail)
  }
  return { res, calls, thrown }
}

const labels = (calls) => calls.map((c) => c.label)
const pick = (calls, label) => calls.find((c) => c.label === label)
// The why_human enum of a shaper call's schema, [] when the call or the path is absent (#94, R1-5).
const whyEnum = (calls, label) => {
  const schema = (pick(calls, label) || { opts: {} }).opts.schema || {}
  const call = ((schema.properties || {}).judgmentCalls || {}).items || {}
  return ((call.properties || {}).why_human || {}).enum || []
}
const comment = (calls, label) => {
  const p = pick(calls, label).prompt
  return p.slice(p.indexOf('```markdown\n') + 12, p.lastIndexOf('\n```'))
}
const replies = (calls, label) => {
  const call = pick(calls, label)
  if (!call) {
    return []
  }
  const p = call.prompt
  return JSON.parse(p.slice(p.indexOf('Replies, as JSON:\n[') + 18, p.lastIndexOf(']') + 1))
}
const replyFor = (calls, label, id) => (replies(calls, label).find((r) => r.finding === id) || {}).body || ''
// The replay rule: the first n prompts of the relaunch equal the launch's.
function samePrefix(name, first, second, n) {
  const a = first.slice(0, n).map((c) => c.label + '\n' + c.prompt + '\n' + JSON.stringify(c.opts))
  const b = second.slice(0, n).map((c) => c.label + '\n' + c.prompt + '\n' + JSON.stringify(c.opts))
  check(`${name}: the ${n} prompts before the stop replay byte-identically`, a.length === n && a.every((x, i) => x === b[i]), labels(second).slice(0, n))
}

// ---------------------------------------------------------------------------
// 1. guided (the default): a judgment call ends the run; the relaunch carries the decision.
// ---------------------------------------------------------------------------
{
  const scenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-2'], commitIds: [['R1-1', 'R1-2']] }
  const first = await go('guided: hand-off', baseArgs, scenario)
  check('guided: status handoff (decisions)', first.res.status === 'handoff' && first.res.handoffKind === 'decisions', first.res.status)
  check('guided: stops after the shaper', labels(first.calls).join('|') === 'gather r1|review r1|post r1|shape r1|spec status r1', labels(first.calls))
  check('guided: decisionsNeeded lists the ask', JSON.stringify(first.res.decisionsNeeded) === '["R1-2"]')
  check('guided: interrupt reported', first.res.interrupt === 'guided' && first.res.scope === 'all')
  const decided = { ...baseArgs, decisions: { 'R1-2': { choice: 'Keep it', notes: 'The author keeps it because the board already shows it.', date: '2026-10-20' } } }
  const second = await go('guided: relaunch with the decision', decided, scenario)
  check('guided: relaunch finishes', second.res.status === 'done', second.res.status)
  samePrefix('guided', first.calls, second.calls, 5)
  const resolve = pick(second.calls, 'resolve r1').prompt
  check('guided: resolve prompt attributes the decision to the login', resolve.includes('"decidedBy": "@author"') && resolve.includes('Decided by: <that value>'), resolve.slice(0, 200))
  check('guided: resolve prompt has no overrides section', !resolve.includes('Disposition overrides'))
  check('guided: R1-2 reply carries the restatement and the owner', replyFor(second.calls, 'push and reply r1', 'R1-2') === 'Redline round 1: The author keeps it because the board already shows it. Applied in 2bbbbbb (redline: R1-2 fix). · decided by: @author', replyFor(second.calls, 'push and reply r1', 'R1-2'))
  check('guided: R1-1 reply is decided by redline', replyFor(second.calls, 'push and reply r1', 'R1-1').endsWith(' · decided by: redline'), replyFor(second.calls, 'push and reply r1', 'R1-1'))
  const handoff = comment(second.calls, 'handoff comment')
  check('guided: the handoff lists what was put to the person, then what was fixed, folded, each with its owner, and has no Decisions list', handoff.includes('### Put to @author (1)\n\n- **R1-2** title R1-2: The author keeps it because the board already shows it. Applied in 2bbbbbb. · decided by: @author\n\n### Fixed (1)\n\n<details>\n<summary>Each in its own commit</summary>\n\n- **R1-1** title R1-1: fixed in 1bbbbbb · decided by: redline\n\n</details>') && !handoff.includes('### Decisions'), handoff)
  check('guided: shape prompt asks for decidedBy and recommendation', pick(second.calls, 'shape r1').prompt.includes('decidedBy "redline" for fix, decline and defer or "pending" for ask') && pick(second.calls, 'shape r1').prompt.includes('Decided by: redline'))
  check('guided: result.decided carries owners', second.res.decided.map((d) => `${d.id}=${d.decidedBy}`).join(',') === 'R1-1=redline,R1-2=@author', second.res.decided)
}

// ---------------------------------------------------------------------------
// 2. autopilot: the same judgment call is decided from the recommendation and the run goes on.
// ---------------------------------------------------------------------------
{
  const scenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-2'], commitIds: [['R1-1', 'R1-2']] }
  const run = await go('autopilot: judgment call decided from the recommendation', { ...baseArgs, interrupt: 'autopilot' }, scenario)
  check('autopilot: never ends for a judgment call', run.res.status === 'done', run.res.status)
  check('autopilot: resolve ran', !!pick(run.calls, 'resolve r1'))
  const resolve = pick(run.calls, 'resolve r1').prompt
  check('autopilot: resolve prompt carries the autopilot decision', resolve.includes('"decidedBy": "redline (autopilot)"') && resolve.includes('"notes": "Autopilot took the shaper\'s recommendation: Keep it."') && resolve.includes('"choice": "Keep it"'), resolve)
  check('autopilot: R1-2 reply is labelled', replyFor(run.calls, 'push and reply r1', 'R1-2') === 'Redline round 1: Autopilot took the shaper\'s recommendation: Keep it. Applied in 2bbbbbb (redline: R1-2 fix). · decided by: redline (autopilot)', replyFor(run.calls, 'push and reply r1', 'R1-2'))
  check('autopilot: handoff comment labels it', comment(run.calls, 'handoff comment').includes('### Asked, decided on autopilot (1)\n\n- **R1-2** title R1-2: Autopilot took the shaper\'s recommendation: Keep it. Applied in 2bbbbbb. · decided by: redline (autopilot)') && !comment(run.calls, 'handoff comment').includes('### Put to '), comment(run.calls, 'handoff comment'))
  check('autopilot: plan approver sees the decision as decided', pick(run.calls, 'plan approver r1').prompt.includes('"decidedBy": "redline (autopilot)"'))
  const stuck = await go('autopilot: resolve cannot apply the recommendation', { ...baseArgs, interrupt: 'autopilot' }, { ...scenario, unresolved: [{ id: 'R1-2', why: 'no such option' }] })
  check('autopilot: an unresolved decision is an error, not a hand-off', stuck.res.status === 'error' && stuck.res.stage === 'resolve', stuck.res)
}

// ---------------------------------------------------------------------------
// 3. plan: every round stops after shaping; the relaunch approves the round, answers the ask and
//    may change a disposition.
// ---------------------------------------------------------------------------
{
  const scenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], [f('R2-1', 'nit')], []], ask: ['R1-2'], commitIds: [['R1-2'], ['R2-1']] }
  const planArgs = { ...baseArgs, interrupt: 'plan' }
  const first = await go('plan: round 1 stops after shape', planArgs, scenario)
  check('plan: status handoff (plan)', first.res.status === 'handoff' && first.res.handoffKind === 'plan', first.res.status)
  check('plan: stops after the shaper', labels(first.calls).join('|') === 'gather r1|review r1|post r1|shape r1|spec status r1', labels(first.calls))
  check('plan: carries every disposition with its recommendation', first.res.plan.length === 2 && first.res.plan[0].disposition === 'fix' && first.res.plan[0].recommendation === 'fix R1-1 this way' && first.res.plan[0].decidedBy === 'redline' && first.res.plan[1].disposition === 'ask' && first.res.plan[1].decidedBy === '', first.res.plan)
  check('plan: carries the ask with story and options', first.res.judgmentCalls.length === 1 && first.res.judgmentCalls[0].options.length === 2 && first.res.judgmentCalls[0].finding.id === 'R1-2')
  check('plan: says how to approve', JSON.stringify(first.res.approveWith) === '{"approvedPlans":[1]}', first.res.approveWith)
  const round1 = {
    ...planArgs,
    approvedPlans: [1],
    decisions: {
      'R1-2': { choice: 'Keep it', notes: 'The author keeps it.', date: '2026-10-20' },
      'R1-1': { choice: 'accept', notes: 'The author accepts the current behaviour; the edge case cannot happen in production data.', date: '2026-10-20', disposition: 'accept' },
    },
  }
  const second = await go('plan: round 1 approved with an override, round 2 stops', round1, scenario)
  samePrefix('plan round 1', first.calls, second.calls, 5)
  check('plan: round 2 stops after its shape', second.res.status === 'handoff' && second.res.handoffKind === 'plan' && second.res.handoffRound === 2, [second.res.status, second.res.handoffRound])
  check('plan: resolve got the override', pick(second.calls, 'resolve r1').prompt.includes('Disposition overrides') && pick(second.calls, 'resolve r1').prompt.includes('"disposition": "accept"'))
  check('plan: plan approver sees the overridden disposition', pick(second.calls, 'plan approver r1').prompt.includes('"disposition": "accept"'))
  check('plan: R1-1 reply is the override, decided by the login', replyFor(second.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: The author accepts the current behaviour; the edge case cannot happen in production data. No code change. · decided by: @author', replyFor(second.calls, 'push and reply r1', 'R1-1'))
  check('plan: approveWith accumulates', JSON.stringify(second.res.approveWith) === '{"approvedPlans":[1,2]}', second.res.approveWith)
  const third = await go('plan: both rounds approved', { ...round1, approvedPlans: [1, 2] }, scenario)
  samePrefix('plan round 2', second.calls, third.calls, second.calls.length)
  check('plan: finishes after the final nit pass', third.res.status === 'done' && third.res.rounds.length === 3, [third.res.status, third.res.rounds.length])
  check('plan: handoff comment names the approvals', comment(third.calls, 'handoff comment').includes('- Round 1 (pr): 2 items: 1 put to @author, 1 overruled by @author; 1 commits; plan approved by @author;') && comment(third.calls, 'handoff comment').includes('- Round 2 (fix-diff): 1 item: 1 fixed; 1 commits; plan approved by @author;') && comment(third.calls, 'handoff comment').includes('- Round 3 (final-nit-pass): no new items; 0 commits;') && comment(third.calls, 'handoff comment').includes('### Overruled by @author (1)\n\n- **R1-1** title R1-1: The author accepts the current behaviour; the edge case cannot happen in production data. No code change. · decided by: @author'), comment(third.calls, 'handoff comment'))
  // plan with autopilot-style unanswered ask: approving without answering falls back to a decisions hand-off.
  const unanswered = await go('plan: approved without answering the ask', { ...planArgs, approvedPlans: [1] }, scenario)
  check('plan: an unanswered ask after approval is a decisions hand-off', unanswered.res.status === 'handoff' && unanswered.res.handoffKind === 'decisions', unanswered.res)
}

// ---------------------------------------------------------------------------
// 4. review: the run stops after the round 1 review; the relaunch picks what to act on.
// ---------------------------------------------------------------------------
{
  const scenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit'), f('R1-3', 'nit')], []], commitIds: [['R1-1']] }
  const reviewArgs = { ...baseArgs, interrupt: 'review' }
  const first = await go('review: stops after post', reviewArgs, scenario)
  check('review: status reviewed', first.res.status === 'reviewed' && first.res.reviewedRound === 1, first.res.status)
  check('review: stops after the post', labels(first.calls).join('|') === 'gather r1|review r1|post r1', labels(first.calls))
  check('review: carries the findings', first.res.findings.length === 3 && first.res.findings[0].description === 'd' && JSON.stringify(first.res.selectionNeeded) === '["R1-1","R1-2","R1-3"]')
  const second = await go('review: relaunch with a selection', { ...reviewArgs, selected: { act: ['R1-1'], dropped: { 'R1-2': 'Naming is fine as it is.' } } }, scenario)
  samePrefix('review', first.calls, second.calls, 3)
  check('review: finishes', second.res.status === 'done', second.res.status)
  const shape = pick(second.calls, 'shape r1').prompt
  check('review: shapes only the selected finding', shape.includes('"id": "R1-1"') && !shape.includes('"id": "R1-2"') && !shape.includes('"id": "R1-3"'))
  check('review: dropped findings get a reply with the reason and the owner', replyFor(second.calls, 'push and reply r1', 'R1-2') === 'Redline round 1: not acted on in this run. Naming is fine as it is. · decided by: @author', replyFor(second.calls, 'push and reply r1', 'R1-2'))
  check('review: an unlisted finding is dropped with the default reason', replyFor(second.calls, 'push and reply r1', 'R1-3') === 'Redline round 1: not acted on in this run. Not selected for this run. · decided by: @author', replyFor(second.calls, 'push and reply r1', 'R1-3'))
  check('review: the handoff comment lists the drops', comment(second.calls, 'handoff comment').includes('### Not picked by @author (2)\n\n') && comment(second.calls, 'handoff comment').includes('- **R1-2** title R1-2: not acted on in this run: Naming is fine as it is. · decided by: @author') && comment(second.calls, 'handoff comment').includes('2 not picked by @author;'), comment(second.calls, 'handoff comment'))
  check('review: the re-review sees the drops as settled', pick(second.calls, 're-review r2').prompt.includes('"outcome": "not acted on in this run: Naming is fine as it is. · decided by: @author"'), pick(second.calls, 're-review r2').prompt)
  check('review: round record lists the drops', JSON.stringify(second.res.rounds[0].dropped) === '[{"id":"R1-2","reason":"Naming is fine as it is."},{"id":"R1-3","reason":"Not selected for this run."}]', second.res.rounds[0].dropped)
  const none = await go('review: nothing selected', { ...reviewArgs, selected: { act: [], dropped: { 'R1-1': 'Known and accepted.' } } }, scenario)
  check('review: nothing selected replies and finishes without a revise pass', none.res.status === 'done' && labels(none.calls).join('|') === 'gather r1|review r1|post r1|push and reply r1|last round|PR description|handoff comment|record files|record commit', labels(none.calls))
  const later = await go('review: round 2 is guided', { ...reviewArgs, selected: { act: ['R1-1'], dropped: {} } }, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')], []], ask: ['R2-1'], commitIds: [['R1-1'], ['R2-1']] })
  check('review: a later round hands off its asks as guided does', later.res.status === 'handoff' && later.res.handoffKind === 'decisions' && later.res.handoffRound === 2, later.res.status)
}

// ---------------------------------------------------------------------------
// 5. scope correctness: the reviewer is told not to look for nits, and a correctness-free round
//    is done without a final nit pass.
// ---------------------------------------------------------------------------
{
  const scenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], [f('R2-1', 'nit')]], commitIds: [['R1-1']] }
  const run = await go('scope correctness', { ...baseArgs, scope: 'correctness' }, scenario)
  check('scope: reviewer prompt says no nits', pick(run.calls, 'review r1').prompt.includes('Scope: correctness only. Run no nit checks of your own') && pick(run.calls, 're-review r2').prompt.includes('Scope: correctness only'))
  // A nit the verifier reports under correctness only is declined by the workflow with the scope as
  // its reason (#93): it stays a finding of the round, is listed once in the review body with an id
  // that is not bold (so prior-findings never reads it back), gets no inline comment and no shaper,
  // and the next review sees it as declined, so it is not raised again.
  const scopeBody = JSON.parse(pick(run.calls, 'post r1').prompt.slice(pick(run.calls, 'post r1').prompt.indexOf('{\n  "body"'), pick(run.calls, 'post r1').prompt.indexOf('\n}\n', pick(run.calls, 'post r1').prompt.indexOf('{\n  "body"')) + 2))
  // The round's findings file, File 2 of the post prompt; {} when the prompt has none.
  const findingsFile = (calls, label) => {
    const p = (pick(calls, label) || { prompt: '' }).prompt
    const at = p.indexOf('```json\n', p.indexOf('File 2:')) + 8
    return p.includes('File 2:') ? JSON.parse(p.slice(at, p.indexOf('\n```', at))) : {}
  }
  // What the scope declined is the record's, under its own key (#94, R1-10): a revise of the
  // round reads findings only, so it never shapes those items, as before #93.
  const scopeFile = findingsFile(run.calls, 'post r1')
  check('scope: the findings file keeps what the scope declined under scoped, apart from its findings', JSON.stringify((scopeFile.findings || []).map((x) => x.id)) === '["R1-1"]' && JSON.stringify((scopeFile.scoped || []).map((x) => x.id)) === '["R1-2"]', [scopeFile.findings, scopeFile.scoped])
  check('scope: a nit the verifier reports is declined by the scope and kept in the round', run.res.rounds[0].droppedNits === 0 && run.res.rounds[0].findings.length === 2 && run.res.rounds[0].outcomes['R1-2'] === 'declined: outside this run\'s scope (correctness only) · decided by: redline', run.res.rounds[0])
  check('scope: the review body lists it once under the scope, with no bold id and no inline comment', scopeBody.body.includes('### Correctness (1)\n\n- **R1-1** · correctness · low · confirmed · `app/x.php:1` · title R1-1\n\n### Declined under this run\'s scope (correctness only) (1)\n\n- R1-2 · `app/x.php:1` · title R1-2\n') && !scopeBody.body.includes('### Other items') && scopeBody.comments.length === 1 && scopeBody.comments[0].body.startsWith('**R1-1** · '), scopeBody)
  check('scope: the next review sees the scope decline as an outcome', pick(run.calls, 're-review r2').prompt.includes('"outcome": "declined: outside this run\'s scope (correctness only) · decided by: redline"'), pick(run.calls, 're-review r2').prompt.slice(0, 2500))
  check('scope: done after the correctness-free re-review, no nit pass', run.res.status === 'done' && run.res.rounds.length === 2 && !labels(run.calls).some((l) => l.startsWith('final nit pass')), labels(run.calls))
  check('scope: shape prompt carries only the correctness finding', !pick(run.calls, 'shape r1').prompt.includes('R1-2'))
  check('scope: reported in the result', run.res.scope === 'correctness')
  const all = await go('scope all (default) keeps the nit pass', baseArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], [f('R2-1', 'nit')], []], commitIds: [['R1-1', 'R1-2'], ['R2-1']] })
  check('scope all: the final nit pass still runs', all.res.status === 'done' && labels(all.calls).includes('final nit pass r3'), labels(all.calls))
  check('scope all: a run without the scope writes no scoped key in its findings file', !('scoped' in findingsFile(all.calls, 'post r1')) && (findingsFile(all.calls, 'post r1').findings || []).length === 2, findingsFile(all.calls, 'post r1'))
}

// ---------------------------------------------------------------------------
// 6. Regressions from earlier steps: defer + nits, the final nit pass, the cap, a dry run,
//    review only, and a bad interrupt word.
// ---------------------------------------------------------------------------
{
  let run = await go('defer + nits, round 2 clean', baseArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit'), f('R1-3', 'nit')], []], defer: ['R1-1'], commitIds: [['R1-1', 'R1-2', 'R1-3']] })
  check('defer: done', run.res.status === 'done')
  check('defer: R1-1 reply', replyFor(run.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: mitigated in 1bbbbbb (redline: R1-1 fix). The full fix is deferred and listed in the Redline handoff: a lock · decided by: redline', replyFor(run.calls, 'push and reply r1', 'R1-1'))
  check('defer: deferred list', run.res.deferred.length === 1 && run.res.deferred[0].commentId === 100)
  check('defer: every prompt names the authority', run.calls.every((c) => c.prompt.includes('args.decisions, args.selected and args.approvedPlans')))
  run = await go('final nit pass finds correctness', baseArgs, { reviews: [[f('R1-1', 'nit')], [f('R2-1', 'correctness')]], commitIds: [['R1-1'], ['R2-1']] })
  check('nit pass: lastFixUnreviewed', run.res.status === 'done' && run.res.lastFixUnreviewed === true)
  run = await go('cap (maxRounds 1)', { ...baseArgs, maxRounds: 1 }, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')]], commitIds: [['R1-1']] })
  check('cap: capped with the open finding', run.res.status === 'capped' && run.res.openFindings[0].id === 'R2-1')
  run = await go('dry run', { ...baseArgs, postToGitHub: false }, { reviews: [[f('R1-1', 'nit')], []], commitIds: [['R1-1']] })
  check('dry run: done, nothing posted', run.res.status === 'done' && pick(run.calls, 'handoff comment').prompt.includes('This is a dry run: post nothing'))
  check('dry run: reply says local', replyFor(run.calls, 'push and reply r1', 'R1-1').includes('Committed locally; not pushed. · decided by: redline'))
  run = await go('review only (flag)', { ...baseArgs, reviewOnly: true }, { reviews: [[f('R1-1', 'nit')]] })
  check('review only: gather, review, post and the record commit', run.res.status === 'review-only' && labels(run.calls).join('|') === 'gather r1|review r1|post r1|record files|record commit' && run.res.interrupt === 'review only', labels(run.calls))
  run = await go('review only (dial word)', { ...baseArgs, interrupt: 'review only' }, { reviews: [[f('R1-1', 'nit')]] })
  check('review only word: same', run.res.status === 'review-only' && run.calls.length === 5)
  run = await go('bad interrupt word', { ...baseArgs, interrupt: 'yolo' }, { reviews: [[]] })
  check('bad interrupt: refused before any agent runs', run.thrown && /args.interrupt must be one of/.test(run.thrown.message) && run.calls.length === 0, run.thrown && run.thrown.message)
  run = await go('bad scope word', { ...baseArgs, scope: 'nits' }, { reviews: [[]] })
  check('bad scope: refused', run.thrown && /args.scope must be/.test(run.thrown.message))
  run = await go('no login', { ...baseArgs, login: undefined, decisions: { 'R1-1': { choice: 'Keep it', notes: 'Kept.', date: '2026-10-20' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], commitIds: [['R1-1']] })
  check('no login: the person running Redline stands in, never the author', replyFor(run.calls, 'push and reply r1', 'R1-1').endsWith('· decided by: the person running Redline') && !comment(run.calls, 'handoff comment').includes('the author'), replyFor(run.calls, 'push and reply r1', 'R1-1'))
}

// ---------------------------------------------------------------------------
// 7. Finish commits the run record: last, after the description and the closing comment, staging
//    by name only the record files git status lists, and only when it lists any.
// ---------------------------------------------------------------------------
{
  const folder1 = 'agent-os/specs/2026-10-20-1600-114-review-round-1/redline/'
  const folder2 = 'agent-os/specs/2026-10-20-1600-114-review-round-2/redline/'
  const start = 'agent-os/specs/x/redline/snapshot-start.json'
  const scenario = { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] }
  let run = await go('record: two rounds, pushed', baseArgs, scenario)
  check('record: after the description, the sweep and the handoff comment', labels(run.calls).slice(-5).join('|') === 'PR description|resolve threads|handoff comment|record files|record commit', labels(run.calls).slice(-5))
  const status = pick(run.calls, 'record files').prompt
  check('record: status covers every round folder and the start snapshot', status.includes(`git -C /r status --porcelain --untracked-files=all -- ${folder1} ${folder2} ${start}\n`), status)
  const commit = pick(run.calls, 'record commit').prompt
  check('record: stages the listed files by name', commit.includes(`git -C /r add -- ${folder1}handoff.md ${folder2}handoff.md ${start}\n`), commit)
  check('record: the commit message', commit.includes('git -C /r commit -m "redline: record the run\'s replies, reviews and handoff for PR #114 (#114)"'), commit)
  check('record: pushes the head branch when push is on', commit.includes('push: true') && commit.includes('git -C /r push origin redline-seed-3'), commit)
  check('record: reported in the result', run.res.recordCommit.committed === true && run.res.recordCommit.sha === 'c'.repeat(40) && run.res.recordCommit.pushed === true && run.res.recordCommit.files.length === 3, run.res.recordCommit)
  check('record: the handoff comment is composed before the commit, so it lists only the fix commits', !comment(run.calls, 'handoff comment').includes('record the run'))

  run = await go('record: description error \'""\'', baseArgs, { ...scenario, updateError: '""' })
  check('record: \'""\' from the description update is empty; the sweep, the handoff and the record follow', run.res.status === 'done' && labels(run.calls).slice(-5).join('|') === 'PR description|resolve threads|handoff comment|record files|record commit', [run.res.status, run.res.error, labels(run.calls).slice(-5)])
  run = await go('record: description error text', baseArgs, { ...scenario, updateError: 'gh: HTTP 422' })
  check('record: a real description error stops the run at finish, before the handoff', run.res.status === 'error' && run.res.stage === 'finish' && run.res.error.includes('gh: HTTP 422') && !labels(run.calls).includes('handoff comment'), [run.res.status, run.res.stage, run.res.error])
  run = await go('record: push-and-reply error \'""\'', baseArgs, { ...scenario, pushError: '""' })
  check('record: \'""\' from push-and-reply is empty; the run goes on to the handoff', run.res.status === 'done' && labels(run.calls).includes('handoff comment'), [run.res.status, run.res.stage, run.res.error])

  run = await go('record: nothing uncommitted', baseArgs, { ...scenario, recordFiles: [] })
  check('record: no commit when git status lists nothing', run.res.status === 'done' && labels(run.calls).slice(-2).join('|') === 'handoff comment|record files' && run.res.recordCommit.committed === false, labels(run.calls).slice(-3))

  run = await go('record: a stray file in the status', baseArgs, { ...scenario, recordFiles: [`${folder1}round-1-reply-R1-1.md`, 'app/x.php'] })
  const stray = pick(run.calls, 'record commit').prompt
  check('record: stages only the record, never a file outside it', stray.includes(`add -- ${folder1}round-1-reply-R1-1.md\n`) && !stray.includes('app/x.php'), stray)
  check('record: the stray file is a warning', run.res.warnings.some((w) => w.includes('app/x.php') && w.includes('not staged')), run.res.warnings)

  run = await go('record: dry run commits locally', { ...baseArgs, postToGitHub: false }, scenario)
  const dry = pick(run.calls, 'record commit').prompt
  check('record: a dry run commits and does not push', dry.includes('Do not push (this is a dry run)') && !dry.includes(' push origin ') && run.res.recordCommit.pushed === false, dry)
  run = await go('record: no push', { ...baseArgs, push: false }, scenario)
  check('record: no push commits and does not push', pick(run.calls, 'record commit').prompt.includes('Do not push (push is off for this run)'))

  run = await go('record: cap hit', { ...baseArgs, maxRounds: 1 }, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')]], commitIds: [['R1-1']] })
  check('record: the cap-hit run commits its record too', run.res.status === 'capped' && labels(run.calls).slice(-3).join('|') === 'cap-hit comment|record files|record commit', labels(run.calls).slice(-3))

  for (const [name, args, s] of [
    ['a hand-off', baseArgs, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'] }],
    ['the review dial', { ...baseArgs, interrupt: 'review' }, { reviews: [[f('R1-1', 'correctness')]] }],
  ]) {
    run = await go(`record: ${name} stops before Finish`, args, s)
    check(`record: ${name} commits no record`, !labels(run.calls).some((l) => l.startsWith('record')), labels(run.calls))
  }
  // A review-only run ends with the record commit like a full run, so the next launch's clean-tree
  // precheck passes (#10).
  run = await go('record: review only commits its record', { ...baseArgs, interrupt: 'review only' }, { reviews: [[f('R1-1', 'nit')]] })
  check('record: review only ends with the record commit after post', run.res.status === 'review-only' && labels(run.calls).join('|') === 'gather r1|review r1|post r1|record files|record commit' && run.res.recordCommit.committed === true, [run.res.status, labels(run.calls)])
  check('record: review only stages the round folder and the start snapshot', pick(run.calls, 'record files') && pick(run.calls, 'record files').prompt.includes(`--untracked-files=all -- ${folder1} ${start}\n`), pick(run.calls, 'record files') && pick(run.calls, 'record files').prompt)

  run = await go('record: the commit fails', baseArgs, { ...scenario, recordError: 'nothing added to commit' })
  check('record: a failed commit is an error at finish', run.res.status === 'error' && run.res.stage === 'finish' && run.res.error.includes('committing the run record failed'), run.res)
}

// ---------------------------------------------------------------------------
// 8. Large PRs (#33) and round numbering (#10): a review with no inline thread continues, a body
//    finding's reply is an issue comment that opens with its marker, and a fresh launch on a PR
//    with posted rounds starts after the last one.
// ---------------------------------------------------------------------------
{
  let run = await go('no inline threads', baseArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], []], commitIds: [['R1-1', 'R1-2']], noInline: true })
  check('no inline: the run continues to done', run.res.status === 'done', run.res.status)
  check('no inline: a warning, not an error', run.res.warnings.includes('round 1: no finding could be placed inline; every reply goes as an issue comment quoting its body marker'), run.res.warnings)
  const rs = replies(run.calls, 'push and reply r1')
  check('no inline: every reply has comment_id 0', rs.length === 2 && rs.every((r) => r.comment_id === 0), rs)
  check('no inline: a posted review routes body findings to issue-comment', rs.length === 2 && rs.every((r) => r.route === 'issue-comment'), rs)
  check('no inline: the reply opens with the marker and names the finding', replyFor(run.calls, 'push and reply r1', 'R1-1').startsWith('<!-- redline:R1-1 -->\n**R1-1** · `app/x.php:1` · from the Redline round 1 review body\n\nRedline round 1: fixed in 1bbbbbb'), replyFor(run.calls, 'push and reply r1', 'R1-1'))
  check('no inline: the prompt sends an issue-comment reply through comment', pick(run.calls, 'push and reply r1').prompt.includes('Route "issue-comment": the finding sits in the review body') && pick(run.calls, 'push and reply r1').prompt.includes('run `/p/scripts/redline-gh.sh comment 114 <file>` once for it instead of reply'), pick(run.calls, 'push and reply r1').prompt)
  check('no inline: the already-posted check is the reply\'s own line, not the marker', pick(run.calls, 'push and reply r1').prompt.includes('look in `/p/scripts/redline-gh.sh pr-comments 114` for its second line') && pick(run.calls, 'push and reply r1').prompt.includes('from the Redline round 1 review body`), never for the marker'), pick(run.calls, 'push and reply r1').prompt)
  check('no inline: the post prompt says a thread-less review is not an error', pick(run.calls, 'post r1').prompt.includes('A review with no inline comment at all is a valid result, not an error'))
  check('no inline: the deferred list is unaffected', run.res.deferred.length === 0)
  check('no inline: the review body does not promise an inline comment for every finding', pick(run.calls, 'post r1').prompt.includes('sits under Not placed inline below') && !pick(run.calls, 'post r1').prompt.includes('Redline replies in each thread') && pick(run.calls, 'post r1').prompt.includes('or in a PR comment that opens with its marker'))
  const errorScenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], []], commitIds: [['R1-1', 'R1-2']], noInline: true, postError: 'no inline comment could be anchored' }
  run = await go('no inline with an agent error', baseArgs, errorScenario)
  check('posted error: the #778 shape continues into shape with a warning', run.res.status === 'done' && !!pick(run.calls, 'shape r1') && run.res.warnings.some((w) => w.includes('reported an error for a review it posted; continuing: no inline comment could be anchored')), [run.res.status, run.res.warnings])
  run = await go('posted error, review id 0', baseArgs, { ...errorScenario, postReviewId: 0 })
  check('posted error: a posted review with no id still stops at post', run.res.status === 'error' && run.res.stage === 'post' && run.res.error.includes('posting the round 1 review failed') && !pick(run.calls, 'shape r1'), run.res)
  run = await go('posted error, a finding in neither list', baseArgs, { ...errorScenario, noInline: false, postDrop: ['R1-2'] })
  check('posted error: a finding in neither list still stops at post', run.res.status === 'error' && run.res.stage === 'post' && run.res.error.includes('posting the round 1 review failed') && !pick(run.calls, 'shape r1'), run.res)
  run = await go('posted error \'""\', every finding inline', baseArgs, { ...errorScenario, noInline: false, postError: '""' })
  check('posted error: \'""\' on a consistent review is empty; shape runs and nothing is warned', run.res.status === 'done' && !!pick(run.calls, 'shape r1') && !run.res.warnings.some((w) => w.includes('reported an error')), [run.res.status, run.res.warnings])
  run = await go('one finding moved to the body', baseArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], []], commitIds: [['R1-1', 'R1-2']], moved: ['R1-2'] })
  check('moved: the warning names it', run.res.warnings.includes('round 1: R1-2 could not be placed inline and sit in the review body behind their markers'), run.res.warnings)
  check('moved: the inline reply keeps its thread, the body reply carries the marker', replyFor(run.calls, 'push and reply r1', 'R1-1').startsWith('Redline round 1: fixed in') && replyFor(run.calls, 'push and reply r1', 'R1-2').startsWith('<!-- redline:R1-2 -->') && replies(run.calls, 'push and reply r1').find((r) => r.finding === 'R1-1').comment_id === 100, replies(run.calls, 'push and reply r1'))
  check('moved: the inline reply is a thread', replies(run.calls, 'push and reply r1').map((r) => `${r.finding}=${r.route}`).join(',') === 'R1-1=thread,R1-2=issue-comment', replies(run.calls, 'push and reply r1'))
  run = await go('dry run replies', { ...baseArgs, postToGitHub: false }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], []], commitIds: [['R1-1', 'R1-2']] })
  const dryReplies = replies(run.calls, 'push and reply r1')
  check('dry run: no review, so every reply is file-only with the plain body', dryReplies.length === 2 && dryReplies.every((r) => r.route === 'file-only' && r.comment_id === 0 && r.body.startsWith('Redline round 1:') && !r.body.includes('<!-- redline:')), dryReplies)
  const reviseArgs = (posted) => ({ ...baseArgs, revise: { round: 1, specFolder: 'agent-os/specs/2026-10-20-1600-114-review-round-1', findings: [f('R1-1', 'nit')], commentIds: {}, ...(posted === undefined ? {} : { posted }) } })
  run = await go('revise-only over an unposted review', reviseArgs(), { reviews: [], commitIds: [['R1-1']] })
  const unpostedReplies = replies(run.calls, 'push and reply r1')
  const revisePrompt = pick(run.calls, 'push and reply r1') ? pick(run.calls, 'push and reply r1').prompt : ''
  check('revise-only: an unposted review writes reply files only', run.res.status === 'done' && unpostedReplies.length === 1 && unpostedReplies.every((r) => r.route === 'file-only' && r.body.startsWith('Redline round 1:')) && ['Route "thread"', 'Route "issue-comment"', 'Route "file-only"'].every((s) => revisePrompt.includes(s)), [run.res.status, unpostedReplies, revisePrompt])
  run = await go('revise-only over a posted review', reviseArgs(true), { reviews: [], commitIds: [['R1-1']] })
  const postedReplies = replies(run.calls, 'push and reply r1')
  check('revise-only: a posted review with no thread id routes to issue-comment', postedReplies.length === 1 && postedReplies[0].route === 'issue-comment' && postedReplies[0].body.startsWith('<!-- redline:R1-1 -->'), postedReplies)
  check('revise-only: the record is committed after the replies (#10)', labels(run.calls).slice(-3).join('|') === 'push and reply r1|record files|record commit' && run.res.recordCommit.committed === true, labels(run.calls))
  check('revise-only: handoffPosted and reviewRequested are false, never absent (#10)', run.res.handoffPosted === false && run.res.reviewRequested === false, [run.res.handoffPosted, run.res.reviewRequested])
  run = await go('review dial drops a body finding', { ...baseArgs, interrupt: 'review', selected: { act: ['R1-1'], dropped: { 'R1-2': 'Fine as is.' } } }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], []], commitIds: [['R1-1']], moved: ['R1-2'] })
  check('moved: a dropped body finding is also replied to behind its marker', replyFor(run.calls, 'push and reply r1', 'R1-2').startsWith('<!-- redline:R1-2 -->') && replyFor(run.calls, 'push and reply r1', 'R1-2').includes('not acted on in this run. Fine as is.'), replyFor(run.calls, 'push and reply r1', 'R1-2'))

  const fresh = { ...baseArgs, firstRound: 2 }
  run = await go('firstRound 2', fresh, { reviews: [[f('R2-1', 'correctness')], []], commitIds: [['R2-1']] })
  check('firstRound: the run starts at round 2', labels(run.calls).slice(0, 4).join('|') === 'gather r2|review r2|post r2|shape r2' && run.res.status === 'done', labels(run.calls))
  check('firstRound: the first round reviews the whole PR into a round-2 folder', run.res.rounds[0].round === 2 && run.res.rounds[0].reviewed === 'pr' && run.res.rounds[0].range === null && run.res.rounds[0].specFolder === 'agent-os/specs/2026-10-20-1600-114-review-round-2', run.res.rounds[0])
  const rp = pick(run.calls, 'review r2')
  check('firstRound: the reviewer prompt is a whole-PR review with R2- ids', rp.prompt.includes('Finding IDs are R2-<n>.') && rp.prompt.includes('the whole pull request:') && rp.prompt.includes("the working tree is the PR's head (aaaaaaa") && rp.opts.phase === 'Review', rp.prompt.slice(0, 700))
  check('firstRound: the review body says round 1 is already on the PR', pick(run.calls, 'post r2').prompt.includes('Reviewed the whole pull request. Round 1 is already on this PR; this run starts at round 2.'), pick(run.calls, 'post r2').prompt.slice(0, 900))
  check('firstRound: has-review checks round 2, so the review posts', pick(run.calls, 'post r2').prompt.includes('has-review 114 2`'))
  check('firstRound: the re-review is round 3 over the fix diff', pick(run.calls, 're-review r3') && pick(run.calls, 're-review r3').prompt.includes('after the round 2 fixes'), labels(run.calls))
  check('firstRound: reported in the result', run.res.firstRound === 2 && run.res.specFolders.join() === 'agent-os/specs/2026-10-20-1600-114-review-round-2,agent-os/specs/2026-10-20-1600-114-review-round-3', run.res.specFolders)
  run = await go('firstRound 2, nit pass', fresh, { reviews: [[f('R2-1', 'nit')], []], commitIds: [['R2-1']] })
  check('firstRound: the handoff comment names round 2 as the whole-PR review', comment(run.calls, 'handoff comment').includes('Only round 2 reviewed the whole PR'), comment(run.calls, 'handoff comment'))
  run = await go('firstRound 2, maxRounds 1', { ...fresh, maxRounds: 1 }, { reviews: [[f('R2-1', 'correctness')], [f('R3-1', 'correctness')]], commitIds: [['R2-1']] })
  check('firstRound: the cap counts from the first round', run.res.status === 'capped' && run.res.openFindings[0].id === 'R3-1' && run.res.rounds.length === 2, [run.res.status, run.res.rounds.length])
  run = await go('firstRound 2, review dial', { ...fresh, interrupt: 'review' }, { reviews: [[f('R2-1', 'correctness')]] })
  check('firstRound: the review dial stops after the first round\'s post', run.res.status === 'reviewed' && run.res.reviewedRound === 2, run.res.status)
  run = await go('default firstRound', baseArgs, { reviews: [[f('R1-1', 'nit')]] , commitIds: [['R1-1']] })
  check('firstRound: absent means 1, with no "already on this PR" sentence', run.res.firstRound === 1 && !pick(run.calls, 'post r1').prompt.includes('already on this PR'))
  run = await go('firstRound 4', { ...baseArgs, firstRound: 4 }, { reviews: [[f('R4-1', 'nit')], []], commitIds: [['R4-1']] })
  check('firstRound: the plural names the earlier rounds', pick(run.calls, 'post r4').prompt.includes('Rounds 1 to 3 are already on this PR; this run starts at round 4.'), pick(run.calls, 'post r4').prompt.slice(0, 900))
  run = await go('bad firstRound', { ...baseArgs, firstRound: 0 }, { reviews: [[]] })
  check('bad firstRound: refused before any agent runs', run.thrown && /args.firstRound must be/.test(run.thrown.message) && run.calls.length === 0, run.thrown && run.thrown.message)
}

// ---------------------------------------------------------------------------
// 8b. carry forward (#35): an earlier round's finding with no disposition is carried into this
// run's first round; one with a reply is tracked; the loop accounts for every carry-forward id.
// ---------------------------------------------------------------------------
{
  const priors = [
    prior('R1-1', 'fixed', { comment_id: 11, reply: { id: 250, body: 'fixed in 1234567 (redline: R1-1 x). · decided by: redline' } }),
    prior('R1-2', 'none', { comment_id: 12, body: '**R1-2** · correctness · low · likely\n\n**title R1-2**\n\nOld description.' }),
    prior('R1-3', 'dropped', { comment_id: 13, category: 'nit', reply: { id: 251, body: 'not acted on in this run. Fine. · decided by: @author' } }),
    prior('R1-4', 'not-changed', { comment_id: 14, reply: { id: 252, body: 'not changed in this round. Disposition fix; no commit names it. · decided by: redline' } }),
    prior('R1-5', 'none', { comment_id: 0 }),
  ]
  const carryArgs = { ...baseArgs, firstRound: 2, priorFindings: priors }
  const scenario = { reviews: [[f('R2-1', 'correctness', { carriedFrom: 'R1-2' }), f('R2-2', 'nit')], []], resolved: [[{ id: 'R1-4', why: 'The line was removed.' }]], commitIds: [['R2-1', 'R2-2', 'R2-3']] }
  let run = await go('carry: a fresh run at round 2', carryArgs, scenario)
  check('carry: finishes', run.res.status === 'done', run.res.status)
  const rp = pick(run.calls, 'review r2').prompt
  const tracked = rp.slice(rp.indexOf('already handled'), rp.indexOf('with no disposition'))
  const carry = rp.slice(rp.indexOf('with no disposition'), rp.indexOf('Before you report anything'))
  check('carry: the prompt lists the tracked findings with their dispositions', tracked.includes('"id": "R1-1"') && tracked.includes('"disposition": "fixed"') && tracked.includes('"id": "R1-3"') && tracked.includes('"disposition": "dropped"') && tracked.includes('"reply": "fixed in 1234567 (redline: R1-1 x). · decided by: redline"'), tracked)
  check('carry: the prompt lists the carry-forward findings, no reply and not changed alike, with the old comment body', carry.includes('"id": "R1-2"') && carry.includes('"id": "R1-4"') && carry.includes('"id": "R1-5"') && carry.includes('Old description.') && !carry.includes('"id": "R1-1"') && !carry.includes('"id": "R1-3"'), carry)
  check('carry: the prompt says to re-verify, never copy, and to account for every id', carry.includes('Re-verify each against the current head') && carry.includes('carriedFrom') && carry.includes('resolved') && carry.includes('exactly one of the two'), carry.slice(0, 400))
  check('carry: the known-finding sentence points at the lists for Redline\'s own rounds', rp.includes("Redline's own earlier rounds on this PR are the lists above"), rp.slice(rp.indexOf('Before you report')))
  const first = run.res.rounds[0]
  check('carry: the carried finding keeps its id and names its origin', first.findings[0].id === 'R2-1' && first.findings[0].carriedFrom === 'R1-2', first.findings[0])
  check('carry: the loop carries the finding the reviewer did not account for, as reported', first.findings.length === 3 && first.findings[2].id === 'R2-3' && first.findings[2].carriedFrom === 'R1-5' && first.findings[2].category === 'correctness' && first.findings[2].title === 'title R1-5', first.findings)
  check('carry: the unaccounted finding is a warning', run.res.warnings.some((w) => w === 'round 2: the reviewer did not account for R1-5 (carried forward from round 1); carried as reported'), run.res.warnings)
  check('carry: the record maps every earlier id to its carried id and keeps the resolved list', JSON.stringify(first.carried) === '{"R1-2":"R2-1","R1-5":"R2-3"}' && JSON.stringify(first.resolvedPrior) === '[{"id":"R1-4","why":"The line was removed."}]', [first.carried, first.resolvedPrior])
  check('carry: the shaper gets the carried findings as findings of this round', pick(run.calls, 'shape r2').prompt.includes('"id": "R2-3"') && pick(run.calls, 'shape r2').prompt.includes('"carriedFrom": "R1-5"'), pick(run.calls, 'shape r2').prompt.slice(0, 300))

  run = await go('carry: carriedFrom names a tracked id', carryArgs, { reviews: [[f('R2-1', 'correctness', { carriedFrom: 'R1-1' })], []], resolved: [[{ id: 'R1-2', why: 'gone' }, { id: 'R1-3', why: 'gone' }, { id: 'R1-4', why: 'gone' }, { id: 'R1-5', why: 'gone' }]], commitIds: [['R2-1']] })
  check('carry: a carriedFrom naming a tracked finding is cleared with a warning', run.res.rounds[0].findings[0].carriedFrom === '' && run.res.warnings.some((w) => w === 'round 2: the reviewer marked R2-1 as carried from R1-1, which is tracked (fixed); cleared'), run.res.warnings)
  check('carry: a resolved entry naming a tracked finding is ignored with a warning', JSON.stringify((run.res.rounds[0].resolvedPrior || []).map((r) => r.id)) === '["R1-2","R1-4","R1-5"]' && run.res.warnings.some((w) => w === 'round 2: the reviewer resolved R1-3, which is tracked (dropped); ignored'), run.res.warnings)
  check('carry: every carry-forward id resolved means nothing carried and no fallback', JSON.stringify(run.res.rounds[0].carried) === '{}' && run.res.rounds[0].findings.length === 1, run.res.rounds[0].findings)

  run = await go('carry: none at round 1', { ...baseArgs, priorFindings: [] }, { reviews: [[f('R1-1', 'nit')]], commitIds: [['R1-1']] })
  check('carry: an empty list adds nothing to the prompt', !pick(run.calls, 'review r1').prompt.includes('already handled') && !pick(run.calls, 'review r1').prompt.includes('with no disposition'))
  // Only the run's first round carries (#46, R1-1): a re-review that copies a carriedFrom from the
  // history, and a first round with no earlier findings, clear it with a warning.
  run = await go('carry: a re-review never carries', { ...baseArgs, firstRound: 2, priorFindings: [prior('R1-2', 'none', { comment_id: 12 })] }, { reviews: [[f('R2-1', 'correctness', { carriedFrom: 'R1-2' })], [f('R3-1', 'correctness', { carriedFrom: 'R1-2' })], []], commitIds: [['R2-1'], ['R3-1']] })
  check('carry: a re-review\'s carriedFrom is cleared with a warning', run.res.rounds[1].findings[0].carriedFrom === '' && run.res.warnings.includes('round 3: the reviewer marked R3-1 as carried from R1-2, but this review has no carry-forward list; cleared'), [run.res.rounds[1].findings[0], run.res.warnings])
  check('carry: a re-review posts no carried heading and no origin note', !pick(run.calls, 'post r3').prompt.includes('### Carried forward') && !pick(run.calls, 'post r3').prompt.includes('irst reported as R1-2'), pick(run.calls, 'post r3').prompt.slice(0, 1500))
  check('carry: a re-review sends no reply to the earlier thread; the first round\'s reply stands', !replies(run.calls, 'push and reply r3').some((x) => x.finding === 'R1-2') && replyFor(run.calls, 'push and reply r2', 'R1-2').startsWith('Redline round 2: carried forward as R2-1; '), [replies(run.calls, 'push and reply r3'), replyFor(run.calls, 'push and reply r2', 'R1-2')])
  // The known-finding sentence has its own gate (#80, R1-2): a whole-PR round with carry-forward
  // priors only keeps it; a re-review with no coverage pass has neither the handled list nor it.
  check('carry: a whole-PR round with only carry-forward priors keeps the match sentence; the re-review has neither', pick(run.calls, 'review r2').prompt.includes('match against them, not against their review comments') && !pick(run.calls, 're-review r3').prompt.includes('already handled') && !pick(run.calls, 're-review r3').prompt.includes('match against them'), pick(run.calls, 're-review r3').prompt.slice(-1500))
  run = await go('carry: no list at round 1', { ...baseArgs, priorFindings: [] }, { reviews: [[f('R1-1', 'nit', { carriedFrom: 'R0-1' })]], commitIds: [['R1-1']] })
  check('carry: a first round with no earlier findings clears a carriedFrom with a warning', run.res.rounds[0].findings[0].carriedFrom === '' && !pick(run.calls, 'post r1').prompt.includes('### Carried forward') && run.res.warnings.includes('round 1: the reviewer marked R1-1 as carried from R0-1, but this review has no carry-forward list; cleared'), [run.res.rounds[0].findings[0], run.res.warnings])
  // The fallback carry is numbered after the highest id in use, so a gap in the reviewer's ids
  // never gives two findings one id (#46, R1-3).
  run = await go('carry: a gap in the reviewer\'s ids', { ...baseArgs, firstRound: 2, priorFindings: [prior('R1-2', 'none', { comment_id: 12 })] }, { reviews: [[f('R2-1', 'correctness'), f('R2-3', 'nit')], []], commitIds: [['R2-1', 'R2-3', 'R2-4']] })
  check('carry: the fallback carry is numbered after the highest id in use', run.res.rounds[0].findings.map((x) => x.id).join(',') === 'R2-1,R2-3,R2-4' && run.res.rounds[0].findings[2].carriedFrom === 'R1-2' && JSON.stringify(run.res.rounds[0].carried) === '{"R1-2":"R2-4"}', run.res.rounds[0].findings.map((x) => [x.id, x.carriedFrom]))
  run = await go('carry: bad entry', { ...baseArgs, firstRound: 2, priorFindings: [prior('R2-1', 'none')] }, { reviews: [[]] })
  check('carry: an entry from this run\'s round or later is refused before any agent runs', run.thrown && /args.priorFindings/.test(run.thrown.message) && run.calls.length === 0, run.thrown && run.thrown.message)
  run = await go('carry: bad disposition', { ...baseArgs, firstRound: 2, priorFindings: [prior('R1-1', 'done')] }, { reviews: [[]] })
  check('carry: an unknown disposition is refused before any agent runs', run.thrown && /args.priorFindings/.test(run.thrown.message) && run.calls.length === 0, run.thrown && run.thrown.message)
  const dial = { ...carryArgs, interrupt: 'review' }
  const stop = await go('carry: review dial stops', dial, scenario)
  check('carry: the review dial presents the carried findings with their origin', stop.res.status === 'reviewed' && (stop.res.findings || []).map((x) => `${x.id}<${x.carriedFrom}`).join(',') === 'R2-1<R1-2,R2-2<,R2-3<R1-5', stop.res.findings)
  const resumed = await go('carry: review dial relaunch', { ...dial, selected: { act: ['R2-1', 'R2-3'], dropped: { 'R2-2': 'Fine.' } } }, scenario)
  samePrefix('carry', stop.calls, resumed.calls, 3)
}

// ---------------------------------------------------------------------------
// 8c. carry forward, the posted side (#35): the review body's headings, the inline note, the reply
// in the earlier thread, the sweep of that thread and the handoff's Earlier rounds section.
// ---------------------------------------------------------------------------
{
  const priors = [
    prior('R1-1', 'fixed', { comment_id: 11, reply: { id: 250, body: 'fixed in 1234567 (redline: R1-1 x). · decided by: redline' } }),
    prior('R1-2', 'none', { comment_id: 12, body: '**R1-2** · correctness · low · likely\n\n**title R1-2**\n\nOld description.' }),
    prior('R1-3', 'dropped', { comment_id: 13, category: 'nit', reply: { id: 251, body: 'not acted on in this run. Fine. · decided by: @author' } }),
    prior('R1-4', 'not-changed', { comment_id: 14, reply: { id: 252, body: 'not changed in this round. Disposition fix; no commit names it. · decided by: redline' } }),
    prior('R1-5', 'none', { comment_id: 0 }),
  ]
  const carryArgs = { ...baseArgs, firstRound: 2, priorFindings: priors }
  const scenario = { reviews: [[f('R2-1', 'correctness', { carriedFrom: 'R1-2' }), f('R2-2', 'nit')], []], resolved: [[{ id: 'R1-4', why: 'The line was removed.' }]], commitIds: [['R2-1', 'R2-2', 'R2-3']] }
  let run = await go('carry: posted side', carryArgs, scenario)
  const post = pick(run.calls, 'post r2').prompt
  check('carry: the fresh findings and the carried ones sit under their own headings, with counts', post.includes('### Other items (1)\\n\\n- **R2-2** · nit') && post.includes('### Carried forward from earlier rounds (2 correctness, 0 nit)\\n\\n- **R2-1** · correctness · low · confirmed · `app/x.php:1` · title R2-1 · first reported as R1-2\\n- **R2-3** · correctness · low · unconfirmed · `app/x.php:1` · title R1-5 · first reported as R1-5\\n  Would confirm it: The verifier did not re-verify this carried finding; check it at this head.'), post.slice(0, 1500))
  check('carry: the resolved earlier findings are listed with why', post.includes('### Resolved from earlier rounds\\n\\n- **R1-4** title R1-4: The line was removed.'), post.slice(0, 1500))
  check('carry: the inline comment of a carried finding names its origin after the title', post.includes('**title R2-1**\\n\\nFirst reported as R1-2 in Redline round 1.\\n\\nd'), post.slice(0, 2500))
  const r = replies(run.calls, 'push and reply r2')
  const by = (id) => r.find((x) => x.finding === id) || {}
  check('carry: the earlier thread gets the carried-forward reply with the new id and the outcome', by('R1-2').body === 'Redline round 2: carried forward as R2-1; fixed in 1bbbbbb (redline: R2-1 fix). · decided by: redline' && by('R1-2').comment_id === 12 && by('R1-2').route === 'thread' && by('R1-2').file === '/r/agent-os/specs/2026-10-20-1600-114-review-round-2/redline/round-2-reply-R1-2.md', by('R1-2'))
  check('carry: an earlier body finding gets its reply as an issue comment behind its own marker and round header', by('R1-5').route === 'issue-comment' && by('R1-5').body === '<!-- redline:R1-5 -->\n**R1-5** · `app/x.php:1` · from the Redline round 1 review body\n\nRedline round 2: carried forward as R2-3; fixed in 3bbbbbb (redline: R2-3 fix). · decided by: redline', by('R1-5'))
  check('carry: a resolved earlier finding gets the resolved reply in its thread', by('R1-4').body === 'Redline round 2: resolved; first reported as R1-4 in Redline round 1. The line was removed. · decided by: redline' && by('R1-4').comment_id === 14, by('R1-4'))
  check('carry: a tracked earlier finding gets no reply', !r.some((x) => x.finding === 'R1-1' || x.finding === 'R1-3'), r.map((x) => x.finding))
  const sweep = (pick(run.calls, 'resolve threads') || {}).prompt || ''
  check('carry: the sweep names the earlier root, its earlier reply and this round\'s reply', sweep.includes('- R1-2 (round 1): comments 12, 203') && sweep.includes('- R1-4 (round 1): comments 14, 252, 205') && /resolve-threads 114 [0-9 ]*\b12 203\b/.test(sweep) && /resolve-threads 114 [0-9 ]*\b14 252 205\b/.test(sweep) && !sweep.includes('R1-5'), sweep.slice(sweep.indexOf('These findings')))
  const handoff = comment(run.calls, 'handoff comment')
  check('carry: the handoff counts the earlier threads among the resolved', handoff.includes('Resolved 5 threads; 0 left open.'), handoff)
  check('carry: the handoff lists every earlier finding under Earlier rounds', handoff.includes('### Earlier rounds\n\n- **R1-1** title R1-1: already handled in round 1: fixed in 1234567 (redline: R1-1 x). · decided by: redline\n- **R1-2** title R1-2: carried forward as R2-1: fixed in 1bbbbbb · decided by: redline\n- **R1-3** title R1-3: already handled in round 1: not acted on in this run. Fine. · decided by: @author\n- **R1-4** title R1-4: resolved: The line was removed. · decided by: redline\n- **R1-5** title R1-5: carried forward as R2-3: fixed in 3bbbbbb · decided by: redline'), handoff)
  check('carry: the push prompt says an earlier round\'s reply in the thread is not a duplicate', pick(run.calls, 'push and reply r2').prompt.includes('The duplicate check is a reply in that thread opening `Redline round 2:`'), pick(run.calls, 'push and reply r2').prompt.slice(0, 1200))
  check('carry: the result records the earlier threads\' reply ids', run.res.rounds[0].replyIds['R1-2'] === 203 && run.res.rounds[0].replyIds['R1-4'] === 205 && !('R1-5' in run.res.rounds[0].replyIds), run.res.rounds[0].replyIds)

  run = await go('carry: review dial drops a carried finding', { ...carryArgs, interrupt: 'review', selected: { act: ['R2-2'], dropped: { 'R2-1': 'Keep it.' } } }, scenario)
  check('carry: a dropped carried finding tells its earlier thread, with the person as owner', replyFor(run.calls, 'push and reply r2', 'R1-2') === 'Redline round 2: carried forward as R2-1; not acted on in this run. Keep it. · decided by: @author', replyFor(run.calls, 'push and reply r2', 'R1-2'))
  check('carry: the earlier thread of a dropped finding stays open as the person\'s pick', run.res.threads.open.some((o) => o.id === 'R1-2' && o.reason === 'dropped by @author') && run.res.threads.open.some((o) => o.id === 'R2-1'), run.res.threads)
  check('carry: the handoff says the earlier finding was carried and dropped', comment(run.calls, 'handoff comment').includes('- **R1-2** title R1-2: carried forward as R2-1: not acted on in this run: Keep it. · decided by: @author'), comment(run.calls, 'handoff comment'))

  run = await go('carry: everything resolved', { ...baseArgs, firstRound: 2, priorFindings: [prior('R1-1', 'none', { comment_id: 11 }), prior('R1-2', 'not-changed', { comment_id: 12, reply: { id: 250, body: 'not changed in this round. x · decided by: redline' } })] }, { reviews: [[]], resolved: [[{ id: 'R1-1', why: 'Gone.' }, { id: 'R1-2', why: 'Gone too.' }]] })
  check('carry: a first round with only resolved earlier findings replies and finishes without a revise pass', run.res.status === 'done' && labels(run.calls).join('|') === 'gather r2|review r2|post r2|push and reply r2|last round|PR description|resolve threads|handoff comment|record files|record commit', labels(run.calls))
  check('carry: the review body says no findings and lists the resolved', pick(run.calls, 'post r2').prompt.includes('No findings.\\n\\n### Resolved from earlier rounds\\n\\n- **R1-1** title R1-1: Gone.\\n- **R1-2** title R1-2: Gone too.'), pick(run.calls, 'post r2').prompt.slice(0, 900))
  check('carry: both earlier threads are swept, the second with its earlier reply', ((pick(run.calls, 'resolve threads') || {}).prompt || '').includes('resolve-threads 114 11 200 12 250 201'), (pick(run.calls, 'resolve threads') || {}).prompt)

  run = await go('carry: correctness scope', { ...baseArgs, firstRound: 2, scope: 'correctness', priorFindings: [prior('R1-3', 'none', { comment_id: 13, category: 'nit' })] }, { reviews: [[f('R2-1', 'nit', { carriedFrom: 'R1-3' })]] })
  check('carry: a carried nit under the correctness scope is declined by the scope, said so in the handoff, with no reply and no sweep', run.res.status === 'done' && comment(run.calls, 'handoff comment').includes('- **R1-3** title R1-3: carried forward as R2-1: declined: outside this run\'s scope (correctness only) · decided by: redline') && !pick(run.calls, 'push and reply r2') && !pick(run.calls, 'resolve threads'), [labels(run.calls), comment(run.calls, 'handoff comment')])

  // A carrying finding the post moved into the review body has no thread, so its earlier thread
  // settles on its own reply (#46, R1-4).
  run = await go('carry: the carrying finding sits in the review body', carryArgs, { ...scenario, moved: ['R2-1'] })
  check('carry: an earlier thread is swept on its own reply when its carrying finding has no thread', ((pick(run.calls, 'resolve threads') || {}).prompt || '').includes('- R1-2 (round 1): comments 12, 203') && !run.res.threads.open.some((o) => o.id === 'R1-2') && comment(run.calls, 'handoff comment').includes('Resolved 4 threads; 0 left open.'), [run.res.threads, comment(run.calls, 'handoff comment')])
  check('carry: the body finding\'s reply is an issue comment and the earlier thread\'s stays a thread reply', replies(run.calls, 'push and reply r2').find((x) => x.finding === 'R2-1').route === 'issue-comment' && replies(run.calls, 'push and reply r2').find((x) => x.finding === 'R1-2').route === 'thread', replies(run.calls, 'push and reply r2').map((x) => `${x.finding}=${x.route}`))

  // A finding an earlier run carried, whose own thread still holds its round's not-changed reply
  // (the fixture PR 14 shape), is named in the handoff by its new id, not the stale reply (#46, R1-5).
  run = await go('carry: a finding an earlier run carried', { ...baseArgs, firstRound: 3, priorFindings: [prior('R1-5', 'carried', { comment_id: 15, carried_to: 'R2-2', reply: { id: 255, body: 'not changed in this round. Disposition fix; no commit names it. · decided by: redline' } }), prior('R2-2', 'none', { comment_id: 22, carried_from: 'R1-5' })] }, { reviews: [[f('R3-1', 'correctness', { carriedFrom: 'R2-2' })], []], commitIds: [['R3-1']] })
  check('carry: the handoff names an earlier run\'s carry by its new id, not the stale reply', comment(run.calls, 'handoff comment').includes('### Earlier rounds\n\n- **R1-5** title R1-5: carried forward as R2-2 in round 2\n- **R2-2** title R2-2: carried forward as R3-1: fixed in '), comment(run.calls, 'handoff comment'))

  // A carried finding the reviewer also marks known (#46, R1-2): a Redline id there is cleared and
  // the finding is carried; an issue or a teammate's comment keeps it known, and its earlier thread
  // is answered as already tracked and left open. postDrop scripts what the real post returns for
  // a known finding, which is no inline thread (post sends only the active findings as comments).
  run = await go('carry: carried and known by a Redline id', { ...baseArgs, firstRound: 2, priorFindings: [prior('R1-1', 'fixed', { comment_id: 11, reply: { id: 250, body: 'fixed in 1234567 (redline: R1-1 x). · decided by: redline' } }), prior('R1-2', 'none', { comment_id: 12 })] }, { reviews: [[f('R2-1', 'correctness', { carriedFrom: 'R1-2', knownAs: 'R1-2' }), f('R2-2', 'nit', { knownAs: 'R1-1: fixed' })], []], postDrop: ['R2-2'], commitIds: [['R2-1']] })
  check('carry: a carried finding\'s known mark naming a Redline id is cleared with a warning', run.res.rounds[0].findings[0].knownAs === '' && run.res.warnings.includes('round 2: the reviewer marked R2-1 as carried from R1-2 and as known by "R1-2", which names a Redline finding; knownAs cleared, so it is carried'), [run.res.rounds[0].findings[0], run.res.warnings])
  check('carry: that finding is posted, shaped and answered as carried', pick(run.calls, 'post r2').prompt.includes('### Carried forward from earlier rounds (1 correctness, 0 nit)\\n\\n- **R2-1** · correctness') && ((pick(run.calls, 'shape r2') || {}).prompt || '').includes('"carriedFrom": "R1-2"') && replyFor(run.calls, 'push and reply r2', 'R1-2').startsWith('Redline round 2: carried forward as R2-1; fixed in '), [labels(run.calls), replies(run.calls, 'push and reply r2')])
  check('carry: a fresh finding matched to a tracked Redline finding stays known, with no reply', run.res.rounds[0].findings[1].knownAs === 'R1-1: fixed' && pick(run.calls, 'post r2').prompt.includes('\\n- **R2-2** title R2-2: R1-1: fixed') && !replies(run.calls, 'push and reply r2').some((x) => x.finding === 'R1-1'), [run.res.rounds[0].findings[1], replies(run.calls, 'push and reply r2')])

  run = await go('carry: carried and known by an issue', { ...baseArgs, firstRound: 2, priorFindings: [prior('R1-2', 'none', { comment_id: 12 })] }, { reviews: [[f('R2-1', 'correctness', { carriedFrom: 'R1-2', knownAs: '#41' })]], postDrop: ['R2-1'] })
  check('carry: a carried finding known by an issue stays known, listed with its origin, and is not shaped', run.res.rounds[0].findings[0].knownAs === '#41' && JSON.stringify(run.res.rounds[0].carried) === '{"R1-2":"R2-1"}' && pick(run.calls, 'post r2').prompt.includes('### Already tracked\\n\\n- **R2-1** title R2-1: #41 · first reported as R1-2') && !pick(run.calls, 'shape r2'), [run.res.rounds[0], labels(run.calls)])
  check('carry: its earlier thread is told it is carried and already tracked, with no revise pass', labels(run.calls).join('|') === 'gather r2|review r2|post r2|push and reply r2|last round|PR description|handoff comment|record files|record commit' && replies(run.calls, 'push and reply r2').length === 1 && replyFor(run.calls, 'push and reply r2', 'R1-2') === 'Redline round 2: carried forward as R2-1; already tracked in #41 · decided by: redline' && replies(run.calls, 'push and reply r2')[0].route === 'thread' && replies(run.calls, 'push and reply r2')[0].comment_id === 12, [labels(run.calls), replies(run.calls, 'push and reply r2')])
  check('carry: that thread stays open as already tracked, and the handoff names the issue', run.res.threads.open.some((o) => o.id === 'R1-2' && o.reason === 'already tracked') && comment(run.calls, 'handoff comment').includes('Resolved 0 threads; 1 left open: R1-2 (already tracked).') && comment(run.calls, 'handoff comment').includes('- **R1-2** title R1-2: carried forward as R2-1: already tracked in #41'), [run.res.threads, comment(run.calls, 'handoff comment')])

  // The same reply from revise()'s batch, the second call site (testing/tests), beside a fixed carry.
  run = await go('carry: carried and known by an issue, beside a fix', { ...baseArgs, firstRound: 2, priorFindings: [prior('R1-2', 'none', { comment_id: 12 }), prior('R1-3', 'none', { comment_id: 13 })] }, { reviews: [[f('R2-1', 'correctness', { carriedFrom: 'R1-2', knownAs: '#41' }), f('R2-2', 'correctness', { carriedFrom: 'R1-3' })], []], postDrop: ['R2-1'], commitIds: [['R2-2']] })
  check('carry: the revise pass answers the issue-tracked carry once, beside the fixed carry', replies(run.calls, 'push and reply r2').filter((x) => x.finding === 'R1-2').length === 1 && replyFor(run.calls, 'push and reply r2', 'R1-2') === 'Redline round 2: carried forward as R2-1; already tracked in #41 · decided by: redline' && replyFor(run.calls, 'push and reply r2', 'R1-3').startsWith('Redline round 2: carried forward as R2-2; fixed in ') && !('R2-1' in (run.res.rounds[0].outcomes || {})) && !pick(run.calls, 'push and reply r3'), replies(run.calls, 'push and reply r2'))
}

// ---------------------------------------------------------------------------
// 9. Checker results (#9): the loop decides from the gate's own fields. A stray `error` on a passing
//    gate is text (a warning at most); a result the implementer cannot change (unreadable, missing,
//    exit 2, no git block) stops the run at check with no repair pass; only failing checks and
//    git-block findings are repaired.
// ---------------------------------------------------------------------------
{
  const base = { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] }
  const full = (label) => label.startsWith('check') || label.startsWith('recheck')
  const repaired = (run) => labels(run.calls).some((l) => l.startsWith('repair'))
  const stopped = (run) => run.res.status === 'error' && run.res.stage === 'check' && !repaired(run)
  const unreadable = (reason, result, error) => ({ exit: 0, status: 'result_unreadable', reason, result, error })
  const kept = (run) => (run.res.detail && run.res.detail.checker) || {}
  const roundCheck = (run) => (run.res.rounds[0] && run.res.rounds[0].check) || {}
  const brief = (run) => [run.res.status, run.res.stage, run.res.error]
  let run = await go('checker: ok true, error \'""\'', baseArgs, { ...base, checker: (label, out) => (full(label) ? { ...out, error: '""' } : null) })
  check('checker: \'""\' is empty; the round passes with no repair and no warning', run.res.status === 'done' && !repaired(run) && !!pick(run.calls, 'push and reply r1') && !run.res.warnings.some((w) => w.includes('checker')), [run.res.status, labels(run.calls), run.res.warnings])
  run = await go('checker: ok true, error text', baseArgs, { ...base, checker: (label, out) => (full(label) ? { ...out, error: 'note from the checker' } : null) })
  check('checker: text on a passing gate is a warning, not a reason', run.res.status === 'done' && !repaired(run) && run.res.warnings.includes('round 1: the checker reported "note from the checker" on a round that passes'), [run.res.status, run.res.warnings])
  run = await go('checker: ok false with a message', baseArgs, { ...base, checker: (label, out) => (full(label) ? { ...out, exit: 1, error: 'guard: 2 mismatched', result: { ...out.result, ok: false } } : null) })
  check('checker: a failing gate\'s error is the reason, after one repair pass', run.res.status === 'error' && run.res.stage === 'check' && labels(run.calls).filter((l) => l === 'repair r1').length === 1 && run.res.error.includes('checker error: guard: 2 mismatched') && run.res.error.includes('after one repair pass'), brief(run))
  const failingCheck = (out) => ({ ...out, exit: 1, result: { ...out.result, ok: false, checks: [{ name: 'guard', cmd: 'tests/guard-test.sh', exit: 1, recorded: false, stdout: '1 mismatched', stderr: '' }] } })
  run = await go('checker: a failing check is repaired', baseArgs, { ...base, checker: (label, out) => (label === 'check r1' ? failingCheck(out) : null) })
  check('checker: a failing check sends one repair pass and the recheck passes', run.res.status === 'done' && labels(run.calls).includes('repair r1') && pick(run.calls, 'repair r1').prompt.includes('This is a repair pass') && pick(run.calls, 'repair r1').prompt.includes('failing checks: guard') && pick(run.calls, 'repair r1').prompt.includes('--- guard (exit 1)'), [run.res.status, labels(run.calls)])
  run = await go('checker: baseline failure with text', baseArgs, { ...base, checker: (label, out) => (label === 'baseline' ? failingCheck(out) : full(label) ? { ...failingCheck(out), error: 'checks.sh exited 1' } : null) })
  check('checker: text on a round whose only failure was failing at baseline is a warning, no repair', run.res.status === 'done' && !repaired(run) && !!pick(run.calls, 'push and reply r1') && run.res.warnings.includes('round 1: the checker reported "checks.sh exited 1" on a round that passes') && run.res.warnings.includes('round 1: guard still failing, as at baseline'), [run.res.status, labels(run.calls), run.res.warnings])
  run = await go('checker: new failure with text', baseArgs, { ...base, checker: (label, out) => (full(label) ? { ...failingCheck(out), error: 'checks.sh exited 1' } : null) })
  check('checker: a new failure with text fails on the check, the text added, after one repair pass', run.res.status === 'error' && run.res.stage === 'check' && labels(run.calls).filter((l) => l === 'repair r1').length === 1 && run.res.error.includes('failing checks: guard') && run.res.error.includes('checker error: checks.sh exited 1') && run.res.error.includes('after one repair pass'), brief(run))
  run = await go('checker: result unreadable (spilled)', baseArgs, { ...base, checker: (label) => (label === 'check r1' ? unreadable('spilled', null, 'Output too large; saved to /tmp/out.txt') : null) })
  check('unreadable: stops at check with the cause and the fix, no repair', stopped(run) && run.res.error.includes('exceeded the Bash tool\'s inline limit') && run.res.error.includes('emit_checks in /p/scripts/checks-template.sh') && run.res.error.includes('the checker said: Output too large'), [brief(run), labels(run.calls)])
  check('unreadable: the record keeps what the checker returned', kept(run).status === 'result_unreadable' && kept(run).reason === 'spilled' && roundCheck(run).pass === false, [run.res.detail, roundCheck(run)])
  const command = pick(run.calls, 'check r1').prompt.split('\n').pop()
  check('unreadable: the command line is the prompt\'s last line', command === '/r/.claude/redline/checks.sh /r/agent-os/specs/2026-10-20-1600-114-review-round-1/redline/snapshot.json', command)
  run = await go('checker: result unreadable (not JSON)', baseArgs, { ...base, checker: (label) => (label === 'check r1' ? unreadable('not_json', null, 'Running guard...') : null) })
  check('unreadable: not JSON names the cause and the command to run by hand', stopped(run) && run.res.error.includes('not one JSON object') && run.res.error.includes(`run ${command} by hand`) && run.res.error.includes('the checker said: Running guard...'), run.res.error)
  run = await go('checker: result unreadable (no git key)', baseArgs, { ...base, checker: (label, out) => (label === 'check r1' ? unreadable('no_git_block', { mode: 'full', ok: true, checks: out.result.checks }, '') : null) })
  check('unreadable: a partial object is kept in the record', stopped(run) && run.res.error.includes('no git block') && run.res.error.includes(`run ${command} by hand`) && !run.res.error.includes('the checker said') && (kept(run).result || {}).mode === 'full', brief(run))
  // A structural reason the workflow can check from the JSON it holds is checked (#55): #54 round 1
  // stopped at baseline when the checker read `git: null` as a missing key. A run-level reason
  // (spilled, backgrounded, no_result) stops as before, and an overridden full-pass `git: null`
  // still stops on the missing block downstream.
  const overrode = (reason) => `the checker said result_unreadable (${reason}), but the JSON it returned is one object with a checks array and a git key; the workflow overrode the status and read the result`
  run = await go('checker: baseline git null read as no_git_block', baseArgs, { ...base, checker: (label, out) => (label === 'baseline' ? { ...out, status: 'result_unreadable', reason: 'no_git_block' } : null) })
  check('override: a baseline with git null the checker called no_git_block is read, with a warning, and the run goes on', run.res.status === 'done' && !!pick(run.calls, 'implement r1') && !repaired(run) && run.res.warnings.includes(`baseline: ${overrode('no_git_block')}`), [brief(run), labels(run.calls), run.res.warnings])
  run = await go('checker: not_json with a complete result', baseArgs, { ...base, checker: (label, out) => (label === 'check r1' ? { ...out, status: 'result_unreadable', reason: 'not_json' } : null) })
  check('override: not_json on a complete result is read, with a warning, no repair', run.res.status === 'done' && !repaired(run) && run.res.warnings.includes(`round 1: ${overrode('not_json')}`), [brief(run), run.res.warnings])
  run = await go('checker: spilled with a complete result', baseArgs, { ...base, checker: (label, out) => (label === 'check r1' ? { ...out, status: 'result_unreadable', reason: 'spilled' } : null) })
  check('override: a run-level reason stops even with a complete result, no warning', stopped(run) && run.res.error.includes('exceeded the Bash tool\'s inline limit') && !run.res.warnings.some((w) => w.includes('overrode')), [brief(run), run.res.warnings])
  run = await go('checker: full pass git null read as no_git_block', baseArgs, { ...base, checker: (label, out) => (label === 'check r1' ? { ...out, status: 'result_unreadable', reason: 'no_git_block', result: { ...out.result, git: null } } : null) })
  check('override: a full pass with git null is read, then stops on the missing block', stopped(run) && run.res.error.includes('the checker result has no git block') && run.res.warnings.includes(`round 1: ${overrode('no_git_block')}`), [brief(run), run.res.warnings])
  check('override: the stop record keeps the copy the workflow read, the checker\'s reason only in the warning', kept(run).status === 'read' && kept(run).reason === '' && (kept(run).result || {}).git === null && Array.isArray((kept(run).result || {}).checks), [kept(run), run.res.warnings])
  run = await go('checker: baseline unreadable', baseArgs, { ...base, checker: (label) => (label === 'baseline' ? unreadable('spilled', null, '') : null) })
  check('unreadable: a baseline the checker cannot read stops before implement', stopped(run) && !pick(run.calls, 'implement r1') && run.res.error.startsWith('baseline: the checker could not read') && kept(run).status === 'result_unreadable', [brief(run), labels(run.calls)])
  run = await go('checker: exit 2', baseArgs, { ...base, checker: (label) => (label === 'check r1' ? { exit: 2, status: 'read', reason: '', result: null, error: 'checks.sh: no snapshot' } : null) })
  check('stop: a usage error stops with the script\'s message, no repair', stopped(run) && run.res.error.includes('checks.sh exited 2 (usage error)') && run.res.error.includes('the checker said: checks.sh: no snapshot') && run.res.error.includes(`run ${command} by hand`) && roundCheck(run).pass === false, brief(run))
  run = await go('checker: exit 2 read as unreadable', baseArgs, { ...base, checker: (label) => (label === 'check r1' ? { exit: 2, status: 'result_unreadable', reason: 'not_json', result: null, error: 'checks.sh: a snapshot file is required unless --baseline is given' } : null) })
  check('stop: a usage error the checker called unreadable still names exit 2, no repair', stopped(run) && run.res.error.includes('checks.sh exited 2 (usage error)') && !run.res.error.includes('not one JSON object') && run.res.error.includes('the checker said: checks.sh: a snapshot file is required') && run.res.error.includes(`run ${command} by hand`), brief(run))
  check('stop: the checker prompt says a usage error is status read', pick(run.calls, 'check r1').prompt.includes('A usage error (exit 2) is status read with result null, never result_unreadable.'), pick(run.calls, 'check r1').prompt.split('\n').slice(-3))
  run = await go('checker: exit 2, error \'""\'', baseArgs, { ...base, checker: (label) => (label === 'check r1' ? { exit: 2, status: 'read', reason: '', result: null, error: '""' } : null) })
  check('checker: a stop keeps the checker\'s error normalized in the record', stopped(run) && kept(run).error === '', [brief(run), kept(run)])
  run = await go('checker: no result', baseArgs, { ...base, checker: (label) => (label === 'check r1' ? { exit: 1, status: 'read', reason: '', result: null, error: '' } : null) })
  check('stop: a missing result stops, no repair', stopped(run) && run.res.error.includes('the checker returned no result'), brief(run))
  run = await go('checker: no git block', baseArgs, { ...base, checker: (label, out) => (label === 'check r1' ? { ...out, result: { mode: 'full', ok: true, checks: out.result.checks } } : null) })
  check('stop: a result with no git block stops, no repair', stopped(run) && run.res.error.includes('the checker result has no git block') && run.res.error.includes(`run ${command} by hand`), brief(run))
  run = await go('checker: baseline with no result', baseArgs, { ...base, checker: (label) => (label === 'baseline' ? { exit: 1, status: 'read', reason: '', result: null, error: 'killed' } : null) })
  check('stop: a baseline with no result stops instead of passing silently', stopped(run) && !pick(run.calls, 'implement r1') && run.res.error.startsWith('baseline: the checker returned no result; the checker said: killed'), [brief(run), labels(run.calls)])
}

// ---------------------------------------------------------------------------
// 9b. A gate longer than the Bash tool's foreground cap (#40). Over 480 s of recorded baseline, or
//     none, the checker and the implementer get the start/wait pair of redline-background.sh; 480 s
//     or less, and a --git-only check, which runs no command, keep the one command line. A
//     foreground run the tool moved to the background stops as backgrounded, a background run that
//     gave no result as no_result, neither repaired.
// ---------------------------------------------------------------------------
{
  const base = { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] }
  const snap = '/r/agent-os/specs/2026-10-20-1600-114-review-round-1/redline/snapshot.json'
  const startSnap = '/r/agent-os/specs/x/redline/snapshot-start.json'
  const BG = '/p/scripts/redline-background.sh'
  const background = (p) => p.includes(`${BG} start`) && p.includes(`${BG} wait`)
  const repaired = (run) => labels(run.calls).some((l) => l.startsWith('repair'))
  const stopped = (run) => run.res.status === 'error' && run.res.stage === 'check' && !repaired(run)
  const brief = (run) => [run.res.status, run.res.stage, run.res.error]

  let r = await go('long gate: 732 s', { ...baseArgs, baselineSeconds: 732, checkerStallMs: 1500000 }, base)
  const baseline = pick(r.calls, 'baseline').prompt
  check('long gate: the baseline starts in the background, with its own label', baseline.includes(`run_in_background: true on the Bash call:\n${BG} start 2026-10-20-1600-114-baseline --baseline ${startSnap}\n`), baseline)
  check('long gate: the wait runs in the foreground, the stall window its limit', baseline.includes(`timeout: 600000 on the Bash call:\n${BG} wait 2026-10-20-1600-114-baseline --limit 1500\n`), baseline)
  check('long gate: the prompt carries the recorded baseline', baseline.includes('recorded baseline: 732 s'), baseline)
  check('long gate: exit 3 is wait again, exit 4 or 5 is no_result', baseline.includes('Exit 3 means the gate is still running: run the same wait again') && baseline.includes('exits 4 (the gate ran past its limit) or 5 (the run ended without a result), return status result_unreadable with reason no_result'), baseline)
  check('long gate: exit 0, 1 or 2 is the gate\'s own result', baseline.includes('When the wait exits 0, 1 or 2, its output and exit code are the gate\'s'), baseline)
  const checkP = pick(r.calls, 'check r1').prompt
  check('long gate: the round check runs the round snapshot under its own label', checkP.includes(`${BG} start 2026-10-20-1600-114-check-r1 ${snap}\n`) && checkP.includes(`${BG} wait 2026-10-20-1600-114-check-r1 --limit 1500\n`), checkP)
  const impl = pick(r.calls, 'implement r1').prompt
  check('long gate: the implementer gets its own pair and the baseline', impl.includes(`\`${BG} start 2026-10-20-1600-114-implement-r1 ${snap}\``) && impl.includes(`\`${BG} wait 2026-10-20-1600-114-implement-r1 --limit 1500\``) && impl.includes('recorded baseline: 732 s'), impl)
  check('long gate: the implementer is not given the foreground gate', !impl.includes('- The gate: `/r/.claude/redline/checks.sh'), impl)
  check('long gate: the run completes', r.res.status === 'done', brief(r))

  r = await go('long gate: a repair pass', { ...baseArgs, baselineSeconds: 732 }, { ...base, checker: (label, out) => (label === 'check r1' ? { ...out, exit: 1, result: { ...out.result, ok: false, checks: [{ name: 'guard', exit: 1, recorded: false }] } } : null) })
  check('long gate: the repair pass and the recheck get their own labels', pick(r.calls, 'repair r1').prompt.includes(`${BG} start 2026-10-20-1600-114-repair-r1 ${snap}`) && pick(r.calls, 'recheck r1').prompt.includes(`${BG} start 2026-10-20-1600-114-recheck-r1 ${snap}\n`), labels(r.calls))

  r = await go('long gate: git-only', { ...baseArgs, baselineSeconds: 732, checker: 'git-only' }, base)
  check('long gate, git-only: the baseline still runs every command, in the background', pick(r.calls, 'baseline').prompt.includes(`${BG} start 2026-10-20-1600-114-baseline --baseline ${startSnap}\n`), pick(r.calls, 'baseline').prompt)
  check('long gate, git-only: the round check runs no command, so it stays in the foreground', !background(pick(r.calls, 'check r1').prompt) && pick(r.calls, 'check r1').prompt.split('\n').pop() === `/r/.claude/redline/checks.sh --git-only ${snap}`, pick(r.calls, 'check r1').prompt)
  check('long gate, git-only: the implementer runs the full gate in the background', background(pick(r.calls, 'implement r1').prompt), pick(r.calls, 'implement r1').prompt)

  r = await go('boundary: 480 s', { ...baseArgs, baselineSeconds: 480 }, base)
  check('boundary: 480 s is the one command line, in the foreground', !background(pick(r.calls, 'baseline').prompt) && pick(r.calls, 'baseline').prompt.split('\n').pop() === `/r/.claude/redline/checks.sh --baseline ${startSnap}` && !background(pick(r.calls, 'implement r1').prompt), pick(r.calls, 'baseline').prompt)
  r = await go('boundary: 481 s', { ...baseArgs, baselineSeconds: 481 }, base)
  check('boundary: 481 s is the start/wait pair', background(pick(r.calls, 'baseline').prompt) && background(pick(r.calls, 'check r1').prompt) && background(pick(r.calls, 'implement r1').prompt) && pick(r.calls, 'baseline').prompt.includes('recorded baseline: 481 s'), pick(r.calls, 'baseline').prompt)
  const noBaseline = { ...baseArgs }
  delete noBaseline.baselineSeconds
  r = await go('unknown: no recorded baseline', noBaseline, base)
  check('unknown: a run with no recorded baseline backgrounds and says so', background(pick(r.calls, 'baseline').prompt) && pick(r.calls, 'baseline').prompt.includes('no baseline is recorded') && background(pick(r.calls, 'implement r1').prompt), pick(r.calls, 'baseline').prompt)
  r = await go('unknown: a baseline that is not a number', { ...baseArgs, baselineSeconds: '732' }, base)
  check('unknown: a baseline that is not an integer counts as none', background(pick(r.calls, 'baseline').prompt) && pick(r.calls, 'baseline').prompt.includes('no baseline is recorded'), pick(r.calls, 'baseline').prompt)

  r = await go('long gate: octane', { ...baseArgs, baselineSeconds: 732, octane: true }, base)
  check('octane: REDLINE_OCTANE=1 prefixes the round start, not the wait', pick(r.calls, 'check r1').prompt.includes(`\nREDLINE_OCTANE=1 ${BG} start 2026-10-20-1600-114-check-r1 ${snap}\n`) && pick(r.calls, 'check r1').prompt.includes(`\n${BG} wait 2026-10-20-1600-114-check-r1 --limit 300\n`), pick(r.calls, 'check r1').prompt)
  check('octane: the baseline start carries no prefix', pick(r.calls, 'baseline').prompt.includes(`\n${BG} start 2026-10-20-1600-114-baseline --baseline`), pick(r.calls, 'baseline').prompt)

  r = await go('short gate: 33 s', baseArgs, base)
  const fg = pick(r.calls, 'check r1').prompt
  check('short gate: the checker prompt is the one command line, in the foreground', fg.endsWith(`\n\nRun this command line with Bash, exactly as given, once, with timeout: 600000 on the Bash call (the gate outlasts the tool's two-minute default), and return its JSON as your instructions say. If the tool moves the command to the background instead, return status result_unreadable with reason backgrounded and its notice under error. If the tool shows you no complete JSON otherwise (the output was saved to a file, is not one JSON object, or has no git key), return status result_unreadable with the reason, as your instructions say. A usage error (exit 2) is status read with result null, never result_unreadable.\n\n/r/.claude/redline/checks.sh ${snap}`), fg)
  check('short gate: the implementer runs the gate in the foreground', pick(r.calls, 'implement r1').prompt.includes(`- The gate: \`/r/.claude/redline/checks.sh ${snap}\` (run it with timeout: 600000 on the Bash call; it outlasts the tool's two-minute default)`) && !background(pick(r.calls, 'implement r1').prompt), pick(r.calls, 'implement r1').prompt)

  r = await go('backgrounded', baseArgs, { ...base, checker: (label) => (label === 'check r1' ? { exit: 0, status: 'result_unreadable', reason: 'backgrounded', result: null, error: 'Command did not complete within its 600s timeout and was moved to the background' } : null) })
  check('backgrounded: stops with the issue\'s sentence and the recorded baseline, no repair', stopped(r) && r.res.error.includes('the gate took longer than the Bash tool allows in the foreground; the checker must background it (recorded baseline: 33 s)') && r.res.error.includes('/r/.claude/redline/checks.json') && r.res.error.includes('the checker said: Command did not complete'), brief(r))
  check('backgrounded: not the spilled message', !r.res.error.includes('inline limit') && r.res.detail.checker.reason === 'backgrounded', brief(r))
  r = await go('no_result', { ...baseArgs, baselineSeconds: 732 }, { ...base, checker: (label) => (label === 'check r1' ? { exit: 4, status: 'result_unreadable', reason: 'no_result', result: null, error: 'redline-background: the run under 2026-10-20-1600-114-check-r1 has gone on 301 s, past the limit of 300 s' } : null) })
  check('no_result: stops with the wait\'s line and the command to run by hand, no repair', stopped(r) && r.res.error.includes('the gate run in the background gave no result') && r.res.error.includes('past the limit of 300 s') && r.res.error.includes(`run /r/.claude/redline/checks.sh ${snap} by hand`), brief(r))
  r = await go('no_result at baseline', { ...baseArgs, baselineSeconds: 732 }, { ...base, checker: (label) => (label === 'baseline' ? { exit: 5, status: 'result_unreadable', reason: 'no_result', result: null, error: 'redline-background: no run under 2026-10-20-1600-114-baseline; start it first' } : null) })
  check('no_result: a baseline with no result stops before implement', stopped(r) && !pick(r.calls, 'implement r1') && r.res.error.startsWith('baseline: the checker could not read checks.sh\'s result: the gate run in the background gave no result'), [brief(r), labels(r.calls)])
}

// ---------------------------------------------------------------------------
// 10. A human review pass (#36): the findings are a teammate's comments (H<n>-k), a clear
//     instruction is theirs, a question goes to the author, a comment that asks for nothing is
//     none, the fix diff gets one final nit pass as a Redline round, and the pass ends with one
//     summary comment: no handoff, no PR description, no review request.
// ---------------------------------------------------------------------------
{
  const h = (id, extra) => ({ id, file: 'app/x.php', line: 1, side: 'RIGHT', category: 'human', severity: 'medium', confidence: 'confirmed', title: `comment ${id}`, description: `Please change ${id}.`, proposedFix: '', needsDecision: false, knownAs: '', source: '@marcamos', commentId: 900, threadId: 900, reviewId: 7, ...extra })
  const folder = 'agent-os/specs/2026-10-20-1600-114-human-review-1'
  const humanArgs = (findings, extra, argExtra) => ({
    ...baseArgs,
    firstRound: 3,
    ...(argExtra || {}),
    revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: 'Two things inline, one general.', specFolder: folder, findings, commentIds: Object.fromEntries(findings.filter((f) => f.threadId).map((f) => [f.id, f.threadId])), posted: true, ...(extra || {}) },
  })
  const four = [h('H1-1'), h('H1-2', { threadId: 901, commentId: 901, description: 'Is this the right default?' }), h('H1-3', { threadId: 902, commentId: 902, description: 'Nice.' }), h('H1-4', { file: '', line: 0, threadId: 0, commentId: 0, description: 'The empty case needs a test somewhere.' })]
  const scenario = { reviews: [[]], ask: ['H1-2'], none: ['H1-3'], commitIds: [['H1-1', 'H1-2', 'H1-4']] }
  const sequence = 'shape h1|spec status h1|resolve h1|plan approver h1|standards approver h1|snapshot h1|baseline|implement h1|check h1|push and reply h1|gather r3|final nit pass r3|post r3|last round|summary comment|record files|record commit'

  const first = await go('human: an ask stops for the author', humanArgs(four), scenario)
  check('human: status handoff (decisions) after the shaper', first.res.status === 'handoff' && first.res.handoffKind === 'decisions' && labels(first.calls).join('|') === 'shape h1|spec status h1', [first.res.status, labels(first.calls)])
  check('human: the call is for the author, with the comment in the finding', first.res.judgmentCalls.length === 1 && first.res.judgmentCalls[0].id === 'H1-2' && first.res.judgmentCalls[0].finding.id === 'H1-2' && first.res.specFolder === folder, first.res.judgmentCalls)
  const shape = pick(first.calls, 'shape h1').prompt
  check('human: the shape prompt names the pass, the reviewer, the ids and the rules', ['You are the shaper for Redline human review 1', 'Finding IDs are H1-<k>.', 'over review 7 by @marcamos', 'Sort each finding into fix, ask or none; never defer', 'Decided by: @marcamos', 'Two things inline, one general.', 'do not use the review-round name', `Spec folder to write: /r/${folder}/`, '/tmp/redlinerepro/shaper-h1-ReproTest.php'].every((s) => shape.includes(s)), shape.slice(0, 1200))
  check('human: the shape prompt never mentions a decision', !shape.includes('"H1-2": {'))

  const decided = humanArgs(four, {}, { decisions: { 'H1-2': { choice: 'Keep it', notes: 'The author keeps the default because the board already shows it.', date: '2026-10-20' } } })
  const second = await go('human: relaunch with the author\'s answer', decided, scenario)
  check('human: handoffPosted and reviewRequested are false, never absent (#10)', second.res.handoffPosted === false && second.res.reviewRequested === false, [second.res.handoffPosted, second.res.reviewRequested])
  check('human: finishes', second.res.status === 'done' && second.res.humanReview && second.res.humanReview.n === 1 && second.res.humanReview.reviewer === 'marcamos' && second.res.humanReview.nitPassRound === 3 && second.res.humanReview.summaryPosted === true, [second.res.status, second.res.humanReview])
  samePrefix('human', first.calls, second.calls, 2)
  check('human: the call sequence, with the nit pass as round 3 and the summary in place of the handoff', labels(second.calls).join('|') === sequence, labels(second.calls))
  check('human: no PR description, no handoff comment, no review request', !labels(second.calls).some((l) => l === 'PR description' || l === 'handoff comment') && pick(second.calls, 'summary comment').prompt.includes('Request no review') && !pick(second.calls, 'summary comment').prompt.includes('request-review 114'), labels(second.calls))
  const rs = replies(second.calls, 'push and reply h1')
  check('human: a fix is decided by the reviewer', replyFor(second.calls, 'push and reply h1', 'H1-1') === 'Redline human review 1: fixed in 1bbbbbb (redline: H1-1 fix). · decided by: @marcamos\n\n<!-- redline:answers 900 -->', replyFor(second.calls, 'push and reply h1', 'H1-1'))
  check('human: an answered ask is decided by the author', replyFor(second.calls, 'push and reply h1', 'H1-2') === 'Redline human review 1: The author keeps the default because the board already shows it. Applied in 2bbbbbb (redline: H1-2 fix). · decided by: @author\n\n<!-- redline:answers 901 -->', replyFor(second.calls, 'push and reply h1', 'H1-2'))
  check('human: a comment that asks for nothing says so, decided by redline', replyFor(second.calls, 'push and reply h1', 'H1-3') === 'Redline human review 1: no change requested. none H1-3 this way · decided by: redline\n\n<!-- redline:answers 902 -->', replyFor(second.calls, 'push and reply h1', 'H1-3'))
  check('human: the body finding is an issue comment headed by the reviewer\'s name', rs.find((r) => r.finding === 'H1-4').route === 'issue-comment' && replyFor(second.calls, 'push and reply h1', 'H1-4').startsWith('<!-- redline:H1-4 -->\n**H1-4** · from review 7 by @marcamos\n\nRedline human review 1: fixed in 3bbbbbb'), replyFor(second.calls, 'push and reply h1', 'H1-4'))
  check('human: the inline replies go to their threads', rs.filter((r) => r.finding !== 'H1-4').every((r) => r.route === 'thread') && rs.find((r) => r.finding === 'H1-2').comment_id === 901, rs)
  check('human: reply files carry the pass name', rs.every((r) => r.file === `/r/${folder}/redline/human-review-1-reply-${r.finding}.md`), rs.map((r) => r.file))
  check('human: the body reply names no comment, so only thread replies carry the answers line', !replyFor(second.calls, 'push and reply h1', 'H1-4').includes('redline:answers'), replyFor(second.calls, 'push and reply h1', 'H1-4'))
  const pushPrompt = pick(second.calls, 'push and reply h1').prompt
  check('human: the push prompt names the pass, the header line and the duplicate rule', ['Operation: push and reply for human review 1.', 'the finding is the body of @marcamos\'s review, which has no thread', '`**<id>** · from review <review id> by @marcamos`', 'may already hold a Redline round\'s reply; that is not a duplicate', 'opening `Redline human review 1:`'].every((s) => pushPrompt.includes(s)), pushPrompt)
  check('human: resolve and approvers are told it is the human pass', pick(second.calls, 'resolve h1').prompt.includes('You are the resolve agent for human review 1.') && pick(second.calls, 'plan approver h1').prompt.includes('a fix is decided by them (decidedBy "reviewer")') && pick(second.calls, 'plan approver h1').prompt.includes('a disposition of defer here is a bounce') && pick(second.calls, 'implement h1').prompt.includes('You are the implementer for human review 1.') && pick(second.calls, 'implement h1').prompt.includes('finishing H1-1 (#114)'), pick(second.calls, 'implement h1').prompt.slice(-900))
  const nit = pick(second.calls, 'final nit pass r3')
  check('human: the nit pass is a round-3 final nit pass over the human fixes', nit.prompt.includes('Finding IDs are R3-<n>.') && nit.prompt.includes("after the Redline human review 1 fixes (HEAD 3bbbbbbb") && nit.prompt.includes('This is the final nit pass') && nit.prompt.includes('git diff aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa..3bbbbbbb') && nit.opts.phase === 'Re-review', nit.prompt.slice(0, 900))
  check('human: the nit pass sees the human findings and their outcomes', nit.prompt.includes('"id": "H1-1"') && nit.prompt.includes('"outcome": "fixed in 1bbbbbb · decided by: @marcamos"') && nit.prompt.includes('"outcome": "no change requested: none H1-3 this way · decided by: redline"'), nit.prompt)
  check('human: the nit pass reviewer checks both spec folder patterns', nit.prompt.includes('*-114-review-round-*/ and /r/agent-os/specs/*-114-human-review-*/'))
  const postNit = pick(second.calls, 'post r3').prompt
  check('human: the nit pass posts as Redline round 3 over the human fixes, in a round-3 folder', postNit.includes('Redline round 3\\n\\nFinal nit pass: reviewed only the fixes from Redline human review 1 (aaaaaaa..3bbbbbb) for correctness bugs they introduced.') && postNit.includes('agent-os/specs/2026-10-20-1600-114-review-round-3/redline/round-3-review.json') && postNit.includes('has-review 114 3`'), postNit.slice(0, 1200))
  check('human: the summary is one line', comment(second.calls, 'summary comment') === 'Redline human review 1 · review by @marcamos: fixed H1-1 and H1-4 in 3 commits (pushed); H1-2 was a question for @author, answered in its thread; H1-3 asked for nothing. Final nit pass (Redline round 3): no correctness bugs.', comment(second.calls, 'summary comment'))
  check('human: the summary file sits in the human folder', pick(second.calls, 'summary comment').prompt.includes(`/r/${folder}/redline/human-review-1-summary.md`) && second.res.humanReview.summaryFile === `${folder}/redline/human-review-1-summary.md`)
  check('human: the record commit covers both folders', pick(second.calls, 'record files').prompt.includes(`-- ${folder}/redline/ agent-os/specs/2026-10-20-1600-114-review-round-3/redline/ agent-os/specs/x/redline/snapshot-start.json`), pick(second.calls, 'record files').prompt)
  check('human: the result records the pass and the owners', second.res.rounds[0].reviewed === 'human-review' && second.res.rounds[0].human.reviewIds[0] === 7 && second.res.rounds[1].reviewed === 'final-nit-pass' && second.res.decided.map((d) => `${d.id}=${d.decidedBy}`).join(',') === 'H1-1=@marcamos,H1-2=@author,H1-3=redline,H1-4=@marcamos', [second.res.rounds.map((r) => r.reviewed), second.res.decided])
  check('human: the snapshot names the human folder', pick(second.calls, 'snapshot h1').prompt.includes(`"${folder}/"`) && pick(second.calls, 'snapshot h1').prompt.includes('Operation: snapshot (human review 1).'))

  let run = await go('human: the nit pass finds a correctness bug', decided, { ...scenario, reviews: [[f('R3-1', 'correctness')]], commitIds: [['H1-1', 'H1-2', 'H1-4'], ['R3-1']] })
  check('human: one more fix pass as round 3, not re-reviewed, then the summary', run.res.status === 'done' && run.res.lastFixUnreviewed === true && labels(run.calls).join('|') === 'shape h1|spec status h1|resolve h1|plan approver h1|standards approver h1|snapshot h1|baseline|implement h1|check h1|push and reply h1|gather r3|final nit pass r3|post r3|shape r3|spec status r3|plan approver r3|standards approver r3|snapshot r3|implement r3|check r3|push and reply r3|last round|resolve threads|summary comment|record files|record commit', labels(run.calls))
  check('human: the summary names the bug and the sweep of the nit-pass thread', comment(run.calls, 'summary comment').endsWith('Final nit pass (Redline round 3): 1 correctness bug in the fixes, fixed in one more pass that was not re-reviewed. Resolved 1 thread; 0 left open.'), comment(run.calls, 'summary comment'))
  check('human: the sweep names only the nit-pass thread, never the teammate\'s', pick(run.calls, 'resolve threads').prompt.includes('resolve-threads 114 100 200\n') && !/ 90[0-9]\b/.test(pick(run.calls, 'resolve threads').prompt), pick(run.calls, 'resolve threads').prompt)
  check('human: the round-3 fix reply is a Redline round reply', replyFor(run.calls, 'push and reply r3', 'R3-1') === 'Redline round 3: fixed in 4bbbbbb (redline: R3-1 fix). · decided by: redline', replyFor(run.calls, 'push and reply r3', 'R3-1'))

  run = await go('human: nothing to commit', humanArgs([h('H1-1', { description: 'Nice.' })]), { reviews: [], none: ['H1-1'], commitIds: [[]] })
  check('human: no commits, no nit pass, still the summary', run.res.status === 'done' && labels(run.calls).join('|') === 'shape h1|spec status h1|plan approver h1|standards approver h1|snapshot h1|baseline|implement h1|check h1|push and reply h1|summary comment|record files|record commit' && run.res.humanReview.nitPassRound === 0, labels(run.calls))
  check('human: the summary says so', comment(run.calls, 'summary comment') === 'Redline human review 1 · review by @marcamos: nothing to fix; H1-1 asked for nothing. No commits, so no final nit pass.', comment(run.calls, 'summary comment'))
  check('human: the push prompt does not push', pick(run.calls, 'push and reply h1').prompt.includes('push: false'))

  run = await go('human: autopilot', humanArgs(four, {}, { interrupt: 'autopilot' }), scenario)
  check('human: autopilot takes the shaper\'s reading and the reply says so', run.res.status === 'done' && replyFor(run.calls, 'push and reply h1', 'H1-2') === 'Redline human review 1: Autopilot took the shaper\'s recommendation: Keep it. Applied in 2bbbbbb (redline: H1-2 fix). · decided by: redline (autopilot)\n\n<!-- redline:answers 901 -->', replyFor(run.calls, 'push and reply h1', 'H1-2'))
  check('human: the autopilot summary counts the answer as a question', comment(run.calls, 'summary comment').includes('H1-2 was a question for @author, answered in its thread'), comment(run.calls, 'summary comment'))

  run = await go('human: plan dial', humanArgs(four, {}, { interrupt: 'plan' }), scenario)
  check('human: the plan dial lists the fix as the reviewer\'s', run.res.status === 'handoff' && run.res.handoffKind === 'plan' && run.res.plan.find((p) => p.id === 'H1-1').decidedBy === '@marcamos' && run.res.plan.find((p) => p.id === 'H1-2').decidedBy === '' && run.res.plan.find((p) => p.id === 'H1-3').decidedBy === 'redline', run.res.plan)
  check('human: the plan dial approves the pass by its key, h1', JSON.stringify(run.res.approveWith) === '{"approvedPlans":["h1"]}', run.res.approveWith)
  const nitBug = { reviews: [[f('R1-1', 'correctness')]], commitIds: [['H1-1'], ['R1-1']] }
  run = await go('human: plan dial, a round number does not approve the pass', humanArgs([h('H1-1')], {}, { firstRound: 1, interrupt: 'plan', approvedPlans: [1] }), nitBug)
  check('human: approvedPlans [1] does not approve h1, even when the nit pass is round 1', run.res.status === 'handoff' && run.res.handoffKind === 'plan' && labels(run.calls).join('|') === 'shape h1|spec status h1' && JSON.stringify(run.res.approveWith) === '{"approvedPlans":[1,"h1"]}', [run.res.status, labels(run.calls), run.res.approveWith])
  run = await go('human: plan dial, h1 approved, the nit pass finds a bug', humanArgs([h('H1-1')], {}, { firstRound: 1, interrupt: 'plan', approvedPlans: ['h1'] }), nitBug)
  check('human: approving h1 leaves the round-1 fix plan to stop for the person', run.res.status === 'handoff' && run.res.handoffKind === 'plan' && run.res.handoffRound === 1 && labels(run.calls).join('|') === 'shape h1|spec status h1|plan approver h1|standards approver h1|snapshot h1|baseline|implement h1|check h1|push and reply h1|gather r1|final nit pass r1|post r1|shape r1|spec status r1' && JSON.stringify(run.res.approveWith) === '{"approvedPlans":["h1",1]}', [run.res.status, labels(run.calls), run.res.approveWith])

  run = await go('human: the shaper defers', humanArgs([h('H1-1')]), { reviews: [], defer: ['H1-1'], commitIds: [[]] })
  check('human: a defer stops the run at shape', run.res.status === 'error' && run.res.stage === 'shape' && run.res.error.includes('the shaper deferred H1-1') && run.res.error.includes('never defer') && labels(run.calls).join('|') === 'shape h1', [run.res.status, run.res.error, labels(run.calls)])

  run = await go('human: the shaper writes the wrong owner on a fix', humanArgs([h('H1-1')]), { reviews: [[]], shaperOwner: 'redline', commitIds: [['H1-1']] })
  check('human: the fix is still the reviewer\'s, with a warning', run.res.status === 'done' && replyFor(run.calls, 'push and reply h1', 'H1-1').endsWith('· decided by: @marcamos\n\n<!-- redline:answers 900 -->') && run.res.warnings.includes('human review 1: the shaper marked H1-1 as decided by redline; a fix from @marcamos\'s comment is theirs'), [run.res.warnings, replyFor(run.calls, 'push and reply h1', 'H1-1')])

  run = await go('human: two comments in one thread', humanArgs([h('H1-1'), h('H1-2', { commentId: 912, description: 'Also rename baz.' })]), { reviews: [[]], commitIds: [['H1-1', 'H1-2']] })
  const shared = replies(run.calls, 'push and reply h1')
  check('human: two findings in one thread get one reply that names both', run.res.status === 'done' && shared.length === 1 && shared[0].comment_id === 900 && shared[0].route === 'thread' && JSON.stringify(shared[0].findings) === '["H1-1","H1-2"]' && shared[0].file === `/r/${folder}/redline/human-review-1-reply-H1-1-H1-2.md` && shared[0].body === 'Redline human review 1:\n\n**H1-1**: fixed in 1bbbbbb (redline: H1-1 fix). · decided by: @marcamos\n\n**H1-2**: fixed in 2bbbbbb (redline: H1-2 fix). · decided by: @marcamos\n\n<!-- redline:answers 900 912 -->', shared)
  check('human: the push prompt says one entry can answer several findings', pick(run.calls, 'push and reply h1').prompt.includes('One entry may answer several findings of one thread (its findings list names them); it is still one reply.'))

  run = await go('human: dry run', humanArgs(four, {}, { postToGitHub: false, decisions: decided.decisions }), scenario)
  const dry = replies(run.calls, 'push and reply h1')
  check('human: a dry run writes the replies and the summary only', run.res.status === 'done' && dry.every((r) => r.route === 'file-only') && replyFor(run.calls, 'push and reply h1', 'H1-1').includes('Committed locally; not pushed. · decided by: @marcamos') && pick(run.calls, 'summary comment').prompt.includes('This is a dry run: post nothing') && comment(run.calls, 'summary comment').includes('(not pushed)'), [run.res.status, dry.map((r) => r.route)])

  run = await go('round: the shaper uses human values', baseArgs, { reviews: [[f('R1-1', 'nit')]], none: ['R1-1'] })
  check('round: none in a Redline round stops at shape', run.res.status === 'error' && run.res.stage === 'shape' && run.res.error.includes('human review pass\'s values'), [run.res.status, run.res.error])

  run = await go('human: wrong ids', humanArgs([f('R1-1', 'nit')]), { reviews: [] })
  check('human: an id outside H<n>- is refused before any agent runs', run.thrown && /args.revise.findings ids must be H1-/.test(run.thrown.message) && run.calls.length === 0, run.thrown && run.thrown.message)
  run = await go('human: no reviewer', humanArgs([h('H1-1')], { reviewer: '' }), { reviews: [] })
  check('human: a missing reviewer is refused', run.thrown && /args.revise.reviewer must be/.test(run.thrown.message), run.thrown && run.thrown.message)
  run = await go('human: no n', humanArgs([h('H1-1')], { n: undefined }), { reviews: [] })
  check('human: a missing n is refused', run.thrown && /needs n/.test(run.thrown.message), run.thrown && run.thrown.message)
}

// ---------------------------------------------------------------------------
// 11. The thread sweep (#39): at a handoff, the settled findings' threads (fixed, deferred,
//     decided, each with its reply posted) are resolved through one resolve-threads call before
//     the handoff comment, which says how many and what stayed open; a body finding has no
//     thread; dropped and not-changed findings stay open; a thread already resolved is in
//     neither count; a thread with a comment that is not Redline's anywhere in it stays open; a
//     dry run, no push, a capped run, a hand-off and review only sweep nothing.
// ---------------------------------------------------------------------------
{
  const four = [f('R1-1', 'correctness'), f('R1-2', 'nit'), f('R1-3', 'correctness'), f('R1-4', 'nit')]
  const scenario = { reviews: [four, []], ask: ['R1-3'], defer: ['R1-2'], commitIds: [['R1-1', 'R1-2', 'R1-3', 'R1-4']], moved: ['R1-4'] }
  const args = { ...baseArgs, decisions: { 'R1-3': { choice: 'Keep it', notes: 'Kept, the board shows it.', date: '2026-10-20' } } }
  let run = await go('threads: settled findings', args, scenario)
  let sweep = pick(run.calls, 'resolve threads')
  check('threads: the sweep runs after the PR description and before the handoff comment', run.res.status === 'done' && labels(run.calls).slice(-5).join('|') === 'PR description|resolve threads|handoff comment|record files|record commit', labels(run.calls))
  check('threads: the command names the inline and reply ids of the fixed, deferred and decided findings, in finding order, and nothing of the body finding', sweep.prompt.includes('\n/p/scripts/redline-gh.sh resolve-threads 114 100 200 102 202 101 201\n'), sweep.prompt)
  check('threads: the prompt lists each settled finding with its round and its two ids', sweep.prompt.includes('- R1-1 (round 1): comments 100, 200\n- R1-2 (round 1): comments 102, 202\n- R1-3 (round 1): comments 101, 201\n') && !sweep.prompt.includes('R1-4'), sweep.prompt)
  check('threads: the sweep is a Finish call of the GitHub agent, run once and nothing else', sweep.agentType === 'redline:redline-github' && sweep.opts.phase === 'Finish' && sweep.prompt.includes('Operation: resolve-threads. PR #114.') && sweep.prompt.includes('Run this once, exactly as given, and nothing else:'), sweep.opts)
  check('threads: the handoff line counts the resolved, after the round sentence; a body finding is not a thread', comment(run.calls, 'handoff comment').includes('the last one verified no new correctness item to fix or ask about.\n\nResolved 3 threads; 0 left open.\n'), comment(run.calls, 'handoff comment'))
  check('threads: the result records the sweep', JSON.stringify(run.res.threads) === '{"resolved":["R1-1","R1-2","R1-3"],"open":[]}', run.res.threads)
  check('threads: the round record keeps the reply ids, none for the body finding', JSON.stringify(Object.entries(run.res.rounds[0].replyIds).sort()) === '[["R1-1",200],["R1-2",202],["R1-3",201]]', run.res.rounds[0].replyIds)

  run = await go('threads: a teammate replied after Redline', args, { ...scenario, threadsSkipped: { 102: "last comment 202 is not Redline's" } })
  check('threads: a thread the script skipped stays open with the reason', comment(run.calls, 'handoff comment').includes('\n\nResolved 2 threads; 1 left open: R1-2 (a reply after Redline\'s).\n') && JSON.stringify(run.res.threads) === '{"resolved":["R1-1","R1-3"],"open":[{"id":"R1-2","reason":"a reply after Redline\'s"}]}', [comment(run.calls, 'handoff comment'), run.res.threads])
  run = await go('threads: the author resolved one by hand', args, { ...scenario, threadsSkipped: { 102: 'already resolved' } })
  check('threads: a thread already resolved is neither resolved by the sweep nor left open', comment(run.calls, 'handoff comment').includes('\n\nResolved 2 threads; 0 left open.\n') && JSON.stringify(run.res.threads) === '{"resolved":["R1-1","R1-3"],"open":[]}', [comment(run.calls, 'handoff comment'), run.res.threads])
  run = await go('threads: a teammate commented between Redline\'s two', args, { ...scenario, threadsSkipped: { 102: "comment 150 is not Redline's" } })
  check('threads: a thread with a comment that is not Redline\'s stays open with that reason', comment(run.calls, 'handoff comment').includes('\n\nResolved 2 threads; 1 left open: R1-2 (a comment that is not Redline\'s).\n') && JSON.stringify(run.res.threads) === '{"resolved":["R1-1","R1-3"],"open":[{"id":"R1-2","reason":"a comment that is not Redline\'s"}]}', [comment(run.calls, 'handoff comment'), run.res.threads])

  const two = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], []], commitIds: [['R1-1']] }
  run = await go('threads: a dropped finding', { ...baseArgs, interrupt: 'review', selected: { act: ['R1-1'], dropped: { 'R1-2': 'Fine as it is.' } } }, two)
  check('threads: a dropped finding stays open as the person\'s pick', run.res.status === 'done' && pick(run.calls, 'resolve threads').prompt.includes('resolve-threads 114 100 200\n') && comment(run.calls, 'handoff comment').includes('\n\nResolved 1 thread; 1 left open: R1-2 (dropped by @author).\n'), comment(run.calls, 'handoff comment'))
  run = await go('threads: nothing selected', { ...baseArgs, interrupt: 'review', selected: { act: [], dropped: { 'R1-1': 'Known.', 'R1-2': 'Known.' } } }, two)
  check('threads: nothing settled means no call, and the line still says what stayed open', run.res.status === 'done' && !labels(run.calls).includes('resolve threads') && comment(run.calls, 'handoff comment').includes('\n\nResolved 0 threads; 2 left open: R1-1 (dropped by @author), R1-2 (dropped by @author).\n'), [labels(run.calls), comment(run.calls, 'handoff comment')])

  const one = { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] }
  for (const [name, a, s, closing] of [
    ['a dry run', { ...baseArgs, postToGitHub: false }, one, 'handoff comment'],
    ['no push', { ...baseArgs, push: false }, one, 'handoff comment'],
    ['a capped run', { ...baseArgs, maxRounds: 1 }, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')]], commitIds: [['R1-1']] }, 'cap-hit comment'],
    ['a hand-off', baseArgs, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'] }, ''],
    ['review only', { ...baseArgs, interrupt: 'review only' }, one, ''],
  ]) {
    run = await go(`threads: ${name} sweeps nothing`, a, s)
    check(`threads: ${name} sweeps nothing and says nothing about threads`, !labels(run.calls).includes('resolve threads') && run.res.threads === null && (!closing || !comment(run.calls, closing).includes('Resolved ')), [labels(run.calls), run.res.threads])
  }

  run = await go('threads: the sweep fails', args, { ...scenario, resolveError: 'gh: HTTP 502' })
  check('threads: a failed sweep stops the run at finish, before the handoff comment', run.res.status === 'error' && run.res.stage === 'finish' && run.res.error.includes('resolving the settled threads failed: gh: HTTP 502') && !labels(run.calls).includes('handoff comment'), [run.res.status, run.res.stage, run.res.error, labels(run.calls)])
}

// ---------------------------------------------------------------------------
// 12. Repository ask rules (#49): a finding under a paths rule (by its file, or by the files the
//     shaper's task touches) or one the shaper tags with a prose rule is forced to ask whatever
//     the shaper returned; the review marks it; guided records the person's answer as left to
//     the author, autopilot leaves it with no commit and lists it under Deferred; its thread
//     stays open; the handoff lists it under its rule; a repository with no rules keeps
//     byte-identical prompts; a plan-dial override to fix is refused; a human pass does the same.
// ---------------------------------------------------------------------------
{
  const rules = [
    { id: 'craft-config', when: { paths: ['config/project/**'] }, reason: 'Craft project config is applied through the control panel' },
    { id: 'billing', when: { prose: 'the change alters what a customer is charged' }, reason: 'Billing changes are reviewed by finance' },
  ]
  const three = [f('R1-1', 'correctness'), f('R1-2', 'correctness', { file: 'config/project/project.yaml', line: 3 }), f('R1-3', 'correctness', { file: 'app/Billing.php', askRule: 'billing' })]
  // The shaper says fix for all three; R1-3 carries its prose-rule tag.
  const scenario = { reviews: [three, []], askRule: { 'R1-3': 'billing' }, commitIds: [['R1-1']] }
  const ruleArgs = { ...baseArgs, askRules: rules }
  const reason = 'Craft project config is applied through the control panel'

  const first = await go('rules: guided, forced asks', ruleArgs, scenario)
  check('rules: a paths match and a prose tag end the run as a decisions hand-off', first.res.status === 'handoff' && first.res.handoffKind === 'decisions' && JSON.stringify(first.res.decisionsNeeded) === '["R1-2","R1-3"]', [first.res.status, first.res.decisionsNeeded])
  check('rules: the shaper sorted them as fix; the forcing point warns and wins', first.res.warnings.includes('round 1: the shaper sorted R1-2 as fix; repository rule craft-config makes it an ask for the person') && first.res.warnings.includes('round 1: the shaper sorted R1-3 as fix; repository rule billing makes it an ask for the person'), first.res.warnings)
  const calls = first.res.judgmentCalls
  check('rules: the synthesised call names the rule, quotes its reason and offers the person\'s options', calls[0].id === 'R1-2' && calls[0].why_human === 'repository rule craft-config' && calls[0].story === `Repository rule craft-config: ${reason}. d` && calls[0].options.map((o) => o.label).join('|') === 'Make the change by hand after the run|Accept, no change' && calls[0].recommendation === 'By hand: fix R1-2 this way.' && JSON.stringify(calls[0].forced) === `{"rule":"craft-config","reason":"${reason}","recommendation":"By hand: fix R1-2 this way."}`, calls[0])
  check('rules: the prose-tagged call names its rule', calls[1].id === 'R1-3' && calls[1].why_human === 'repository rule billing' && calls[1].forced.rule === 'billing', calls[1])
  // The shaper's schema is built per pass (#94, R1-5, R1-12): a Redline round's why_human enum is
  // the round's cases and the rule reasons, so a human pass's reason is refused in the shaper's run.
  const roundEnum = whyEnum(first.calls, 'shape r1')
  check('rules: a Redline round\'s shaper schema takes the round\'s reasons and the rule reasons, and none of a human pass\'s own', ['product decision', 'spec assumption', 'outside the pull request', 'no clear pick', 'unconfirmed, serious if true', 'redline\'s own file', 'repository rule craft-config', 'repository rule billing'].every((w) => roundEnum.includes(w)) && ['unsure', 'new standard', 'disproportionate fix'].every((w) => !roundEnum.includes(w)), roundEnum)
  const post = pick(first.calls, 'post r1').prompt
  check('rules: the review body marks a paths match and the reviewer\'s tag as the person\'s, last on the line', post.includes('`config/project/project.yaml:3` · title R1-2 · left to @author under rule craft-config\\n') && post.includes('`app/Billing.php:1` · title R1-3 · left to @author under rule billing\\n') && !post.includes('yours under rule') && post.includes('`app/x.php:1` · title R1-1\\n'), post)
  check('rules: the inline comment says whose it is and why', post.includes(`This one is left to @author: repository rule craft-config (${reason}).`) && post.includes('This one is left to @author: repository rule billing (Billing changes are reviewed by finance).'), post)
  check('rules: the reviewer, the shaper and the plan approver get the rule list', pick(first.calls, 'review r1').prompt.includes('Repository ask rules, as JSON: what a person is always brought in for') && pick(first.calls, 'review r1').prompt.includes('"id": "craft-config"') && pick(first.calls, 'shape r1').prompt.includes('askRule set to the id') && pick(first.calls, 'shape r1').prompt.includes('"prose": "the change alters what a customer is charged"'), pick(first.calls, 'shape r1').prompt.slice(0, 2500))

  const decided = { ...ruleArgs, decisions: { 'R1-2': { choice: 'Make the change by hand after the run', notes: 'The author renames the field through the control panel after the merge.', date: '2026-10-30' }, 'R1-3': { choice: 'Accept, no change', notes: 'The author leaves the charge as it is.', date: '2026-10-30' } } }
  const second = await go('rules: guided relaunch', decided, scenario)
  check('rules: the relaunch finishes with no commit for the forced findings', second.res.status === 'done', [second.res.status, second.res.error])
  samePrefix('rules', first.calls, second.calls, 5)
  const resolve = pick(second.calls, 'resolve r1').prompt
  check('rules: the resolve prompt carries the rule on the decision and the left-to-the-person sentence', resolve.includes('"rule": "craft-config"') && resolve.includes('"rule": "billing"') && resolve.includes('A decision carrying `rule` is on a finding a repository ask rule covers'), resolve)
  check('rules: the plan approver sees the rules and the asks', pick(second.calls, 'plan approver r1').prompt.includes('"id": "craft-config"') && pick(second.calls, 'plan approver r1').prompt.includes('"askRule": "craft-config"'), pick(second.calls, 'plan approver r1').prompt)
  check('rules: the reply says left to the author, with the rule, its reason, the restatement and the owner', replyFor(second.calls, 'push and reply r1', 'R1-2') === `Redline round 1: left to @author under repository rule craft-config (${reason}). The author renames the field through the control panel after the merge. · decided by: @author`, replyFor(second.calls, 'push and reply r1', 'R1-2'))
  check('rules: an accepted one is left too, in the person\'s words', replyFor(second.calls, 'push and reply r1', 'R1-3') === 'Redline round 1: left to @author under repository rule billing (Billing changes are reviewed by finance). The author leaves the charge as it is. · decided by: @author', replyFor(second.calls, 'push and reply r1', 'R1-3'))
  const handoff = comment(second.calls, 'handoff comment')
  check('rules: the handoff lists both under their rules', handoff.includes(`### Left to @author (repository rules)\n\n- **R1-2** title R1-2: rule craft-config (${reason}); left to @author under repository rule craft-config: The author renames the field through the control panel after the merge. · decided by: @author\n- **R1-3** title R1-3: rule billing (Billing changes are reviewed by finance); left to @author under repository rule billing: The author leaves the charge as it is. · decided by: @author`) && !handoff.includes('Left to you') && !handoff.includes('### Deferred'), handoff)
  check('rules: their threads stay open, named with the rule; the fixed one is swept', pick(second.calls, 'resolve threads').prompt.includes('resolve-threads 114 100 200\n') && handoff.includes('\n\nResolved 1 thread; 2 left open: R1-2 (repository rule craft-config), R1-3 (repository rule billing).\n'), handoff)
  check('rules: the result names them', JSON.stringify(second.res.forced.map((x) => [x.id, x.rule, x.round])) === '[["R1-2","craft-config",1],["R1-3","billing",1]]' && second.res.rounds[0].forced['R1-2'].rule === 'craft-config' && second.res.deferred.length === 0, [second.res.forced, second.res.deferred])
  check('rules: the re-review sees them as left', pick(second.calls, 're-review r2').prompt.includes(`"outcome": "left to @author under repository rule craft-config: The author renames the field through the control panel after the merge. · decided by: @author"`), pick(second.calls, 're-review r2').prompt)
  // Posted text (#87): a Left to you line holds the finding's title and its owner; the title is
  // escaped and neutralised, the rule, the restatement and `decided by: @author` are as written.
  const titled = await go('rules: a title with a tag and an @', decided, { ...scenario, reviews: [[three[0], { ...three[1], title: 'Field <b> renamed @config' }, three[2]], []] })
  check('posted text: a Left to you line escapes the title and posts the rule, the outcome and its owner as written', comment(titled.calls, 'handoff comment').includes(`- **R1-2** Field &lt;b> renamed @${WJ}config: rule craft-config (${reason}); left to @author under repository rule craft-config: The author renames the field through the control panel after the merge. · decided by: @author`), comment(titled.calls, 'handoff comment'))

  const auto = await go('rules: autopilot', { ...ruleArgs, interrupt: 'autopilot' }, scenario)
  check('rules: autopilot never applies a forced finding and demands no commit', auto.res.status === 'done', [auto.res.status, auto.res.error])
  const autoResolve = pick(auto.calls, 'resolve r1').prompt
  check('rules: the autopilot decision leaves it to the person', autoResolve.includes('"choice": "Left to the person"') && autoResolve.includes(`"notes": "Repository rule craft-config: ${reason}. No change made; @author makes it."`) && autoResolve.includes('"decidedBy": "redline (autopilot)"') && autoResolve.includes('"rule": "craft-config"'), autoResolve)
  check('rules: the autopilot reply', replyFor(auto.calls, 'push and reply r1', 'R1-2') === `Redline round 1: left to @author under repository rule craft-config (${reason}). Repository rule craft-config: ${reason}. No change made; @author makes it. · decided by: redline (autopilot)`, replyFor(auto.calls, 'push and reply r1', 'R1-2'))
  const autoHandoff = comment(auto.calls, 'handoff comment')
  check('rules: autopilot lists it under Deferred with no mitigation and under Left to you', autoHandoff.includes('### Deferred (mitigated now, full fix left open)\n\n- **R1-2** title R1-2: left to @author under repository rule craft-config; open: By hand: fix R1-2 this way.\n- **R1-3** title R1-3: left to @author under repository rule billing; open: By hand: fix R1-3 this way.') && autoHandoff.includes('### Left to @author (repository rules)\n\n- **R1-2** title R1-2: rule craft-config'), autoHandoff)
  check('rules: the deferred list carries the rule and no mitigation', JSON.stringify(auto.res.deferred.map((d) => [d.id, d.rule, d.mitigation, d.fullFix])) === '[["R1-2","craft-config","none (repository rule craft-config)","By hand: fix R1-2 this way."],["R1-3","billing","none (repository rule billing)","By hand: fix R1-3 this way."]]', auto.res.deferred)
  // Posted text (#87): the Deferred line of a finding autopilot leaves under a rule makes its own
  // postedText call, beside the shipped branch section 16 pins, so it is pinned with a title the
  // function changes: a plain title reads the same with or without the call (#89, R3-2).
  const autoTitled = await go('rules: autopilot, a title with a tag and an @', { ...ruleArgs, interrupt: 'autopilot' }, { ...scenario, reviews: [[three[0], { ...three[1], title: 'Field <b> renamed @config' }, three[2]], []] })
  check('posted text: a Deferred line a rule left to the person escapes and neutralises its title', comment(autoTitled.calls, 'handoff comment').includes(`### Deferred (mitigated now, full fix left open)\n\n- **R1-2** Field &lt;b> renamed @${WJ}config: left to @author under repository rule craft-config; open: By hand: fix R1-2 this way.\n`), comment(autoTitled.calls, 'handoff comment'))

  // The paths rule also catches a finding elsewhere whose task would write under it.
  const viaFiles = await go('rules: a task that writes under a paths rule', ruleArgs, { reviews: [[f('R1-1', 'correctness')], []], files: { 'R1-1': ['app/x.php', '/r/config/project/project.yaml'] }, commitIds: [[]] })
  check('rules: the shaper\'s files force the ask', viaFiles.res.status === 'handoff' && viaFiles.res.judgmentCalls[0].forced.rule === 'craft-config', viaFiles.res)
  // The reviewer's tag alone is advisory: it marks the review and forces nothing.
  const advisory = await go('rules: the reviewer\'s tag alone', ruleArgs, { reviews: [[f('R1-1', 'correctness', { askRule: 'billing' })], []], commitIds: [['R1-1']] })
  check('rules: a tagged finding the shaper did not tag is fixed as usual, and still marked in the review', advisory.res.status === 'done' && pick(advisory.calls, 'post r1').prompt.includes('title R1-1 · left to @author under rule billing') && replyFor(advisory.calls, 'push and reply r1', 'R1-1').startsWith('Redline round 1: fixed in'), [advisory.res.status, replyFor(advisory.calls, 'push and reply r1', 'R1-1')])
  const unknown = await go('rules: an unknown tag', ruleArgs, { reviews: [[f('R1-1', 'correctness', { askRule: 'nope' })], []], askRule: { 'R1-1': 'nope' }, commitIds: [['R1-1']] })
  check('rules: an unknown tag is cleared with a warning, by the reviewer and by the shaper', unknown.res.status === 'done' && unknown.res.warnings.includes('round 1: the reviewer tagged R1-1 with ask rule "nope", which .claude/redline.json does not declare; cleared') && unknown.res.warnings.includes('round 1: the shaper tagged R1-1 with ask rule "nope", which .claude/redline.json does not declare; ignored') && !pick(unknown.calls, 'post r1').prompt.includes('yours under rule'), unknown.res.warnings)

  // No rules: a run with no key and one with [] build the same prompts, with no rule text in them.
  const plain = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-2'], commitIds: [['R1-1', 'R1-2']] }
  const noKey = await go('rules: no askRules key', { ...baseArgs, interrupt: 'autopilot' }, plain)
  const empty = await go('rules: askRules []', { ...baseArgs, interrupt: 'autopilot', askRules: [] }, plain)
  samePrefix('rules: no key against []', noKey.calls, empty.calls, noKey.calls.length)
  check('rules: no rule text reaches a prompt when there are no rules', noKey.calls.every((c) => !c.prompt.includes('ask rule') && !c.prompt.includes('Repository ask rules')), noKey.calls.filter((c) => c.prompt.includes('ask rule')).map((c) => c.label))
  const bad = await go('rules: a malformed rule', { ...baseArgs, askRules: [{ id: 'Bad', when: { paths: ['x'] }, reason: 'r' }] }, plain)
  check('rules: a malformed list stops the launch before any agent runs', !!bad.thrown && bad.thrown.message.includes('args.askRules[0]: id must match [a-z][a-z0-9-]*') && bad.calls.length === 0, [bad.thrown && bad.thrown.message, labels(bad.calls)])

  // The plan dial: the forced finding is shown with its rule, and an override to fix is refused.
  const planFirst = await go('rules: plan dial', { ...ruleArgs, interrupt: 'plan' }, scenario)
  check('rules: the plan hand-off carries the rule on the entry and the call', planFirst.res.status === 'handoff' && planFirst.res.handoffKind === 'plan' && planFirst.res.plan[1].disposition === 'ask' && planFirst.res.plan[1].forced.rule === 'craft-config' && planFirst.res.plan[0].forced === null && planFirst.res.judgmentCalls[0].forced.rule === 'craft-config', planFirst.res.plan)
  const overridden = { ...ruleArgs, interrupt: 'plan', approvedPlans: [1], decisions: { 'R1-2': { choice: 'fix', notes: 'The author wants it fixed anyway.', date: '2026-10-30', disposition: 'fix' }, 'R1-3': { choice: 'Accept, no change', notes: 'The author leaves the charge as it is.', date: '2026-10-30' } } }
  const planSecond = await go('rules: plan dial override to fix', overridden, scenario)
  check('rules: an override to fix on a forced finding is refused with a warning and the finding stays the person\'s', planSecond.res.status === 'done' && planSecond.res.warnings.includes('round 1: R1-2 is left to the person under repository rule craft-config; the disposition "fix" is not applied') && replyFor(planSecond.calls, 'push and reply r1', 'R1-2') === `Redline round 1: left to @author under repository rule craft-config (${reason}). The author wants it fixed anyway. · decided by: @author` && !pick(planSecond.calls, 'resolve r1').prompt.includes('Disposition overrides'), [planSecond.res.status, planSecond.res.warnings, replyFor(planSecond.calls, 'push and reply r1', 'R1-2')])

  // A human review pass on autopilot: a comment under a paths rule is left to the author the same way.
  const folder = 'agent-os/specs/2026-10-20-1600-114-human-review-1'
  const hf = { id: 'H1-1', file: 'config/project/project.yaml', line: 3, side: 'RIGHT', category: 'human', severity: 'medium', confidence: 'confirmed', title: 'comment H1-1', description: 'Rename this handle.', proposedFix: '', needsDecision: false, knownAs: '', source: '@marcamos', commentId: 905, threadId: 905, reviewId: 7 }
  const human = await go('rules: human pass on autopilot', { ...ruleArgs, firstRound: 3, interrupt: 'autopilot', revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: '', specFolder: folder, findings: [hf], commentIds: { 'H1-1': 905 }, posted: true } }, { reviews: [[]], commitIds: [[]] })
  check('rules: the human pass leaves the comment to the author with the pass title', human.res.status === 'done' && replyFor(human.calls, 'push and reply h1', 'H1-1') === `Redline human review 1: left to the author under repository rule craft-config (${reason}). Repository rule craft-config: ${reason}. No change made; the person makes it. · decided by: redline (autopilot)\n\n<!-- redline:answers 905 -->`, [human.res.status, human.res.error, replyFor(human.calls, 'push and reply h1', 'H1-1')])
  check('rules: the human summary says so', comment(human.calls, 'summary comment') === 'Redline human review 1 · review by @marcamos: nothing to fix; H1-1 left to @author under repository rule craft-config. No commits, so no final nit pass.', comment(human.calls, 'summary comment'))
  // A comment that asks for nothing stays none on a rule-covered file: there is no change to leave to the person (#52, R1-4).
  const praise = await go('rules: a human-pass comment that asks for nothing', { ...ruleArgs, firstRound: 3, interrupt: 'autopilot', revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: '', specFolder: folder, findings: [{ ...hf, description: 'Nice.' }], commentIds: { 'H1-1': 905 }, posted: true } }, { reviews: [], none: ['H1-1'], commitIds: [[]] })
  check('rules: a none on a rule-covered file is not forced: no change requested, nothing left or deferred, no warning', praise.res.status === 'done' && replyFor(praise.calls, 'push and reply h1', 'H1-1').startsWith('Redline human review 1: no change requested.') && praise.res.forced.length === 0 && praise.res.deferred.length === 0 && !praise.res.warnings.some((w) => w.includes('makes it an ask')), [praise.res.status, praise.res.error, replyFor(praise.calls, 'push and reply h1', 'H1-1'), praise.res.forced, praise.res.deferred, praise.res.warnings])
  check('rules: the human summary says the comment asked for nothing', comment(praise.calls, 'summary comment') === 'Redline human review 1 · review by @marcamos: nothing to fix; H1-1 asked for nothing. No commits, so no final nit pass.', comment(praise.calls, 'summary comment'))
}

// ---------------------------------------------------------------------------
// 13. Resume after an error (#10): the error result names the agent label that caused the stop;
//     the relaunch's args.resume appends one resume line to that label's prompt, so every prompt
//     before it replays byte-identically and that agent and all after rerun. A hand commit on
//     .claude/ paths is excused by the judge and allowed by later snapshots; gather is not resumable.
// ---------------------------------------------------------------------------
{
  const failing = (out) => ({ ...out, exit: 1, result: { ...out.result, checks: [{ name: 'check', exit: 1, recorded: false, stdout: 'boom', stderr: '' }] } })
  const full = (label) => label.startsWith('check') || label.startsWith('recheck')
  const errorText = 'checks.sh still fails after one repair pass in round 1: failing checks: check'
  const line = (e) => `Resume attempt 2 of this step. The run stopped at this step with an error (${e}); the person has since fixed the cause by hand. Do the step again from the current state of the repository and the PR. What an earlier attempt already made stands (a commit, a posted review or reply, a written file), and the duplicate checks in your instructions apply.`
  const shaperLine = ' Rewrite plan.md, shape.md, standards.md and references.md in the spec folder from scratch, replacing what the earlier attempt wrote; never change or remove anything under its redline/ folder.'
  const base = { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] }
  const first = await go('resume: error at recheck', baseArgs, { ...base, checker: (label, out) => (full(label) ? failing(out) : null) })
  check('resume: the error names the label and the next attempt', first.res.status === 'error' && first.res.stage === 'check' && JSON.stringify(first.res.resumeFrom) === JSON.stringify({ label: 'recheck r1', attempt: 2 }), [first.res.status, first.res.stage, first.res.resumeFrom])
  check('resume: the error text is what the relaunch quotes', first.res.error === errorText, first.res.error)
  const at = first.calls.findIndex((c) => c.label === 'recheck r1')
  // On the real relaunch every agent before recheck r1 replays from cache, the failing check r1
  // included; the mock reruns them, so the scenario fails check r1 again and lets the recheck pass.
  const onlyFirst = { ...base, checker: (label, out) => (label === 'check r1' ? failing(out) : null) }
  const resumeArgs = { ...baseArgs, resume: { 'recheck r1': { attempt: 2, error: errorText, hand: { commits: [], paths: [] } } } }
  const second = await go('resume: relaunch reruns from the label', resumeArgs, onlyFirst)
  samePrefix('resume', first.calls, second.calls, at)
  check('resume: the resumed prompt ends with the resume line', pick(second.calls, 'recheck r1') && pick(second.calls, 'recheck r1').prompt.endsWith(line(errorText)), pick(second.calls, 'recheck r1') && pick(second.calls, 'recheck r1').prompt.slice(-400))
  check('resume: no other prompt carries the line', second.calls.filter((c) => c.prompt.includes('Resume attempt')).map((c) => c.label).join() === 'recheck r1', second.calls.filter((c) => c.prompt.includes('Resume attempt')).map((c) => c.label))
  check('resume: the relaunch finishes', second.res.status === 'done' && second.res.resumeFrom === undefined, [second.res.status, second.res.error])
  check('resume: the relaunch note names the field', first.res.relaunch.how.includes('error: resume ({"<label>": {attempt, error, hand}}) for the label resumeFrom names, through the skill\'s run marker.'), first.res.relaunch.how)

  // A hand-off after the resume: the next relaunch adds decisions and keeps resume, so every prompt
  // up to the stop, the resumed one included, replays.
  const later = { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')], []], ask: ['R2-1'], commitIds: [['R1-1'], ['R2-1']], checker: onlyFirst.checker }
  const stop = await go('resume: a hand-off after the resume', resumeArgs, later)
  check('resume: the hand-off stops after shape r2', stop.res.status === 'handoff' && stop.res.handoffRound === 2, [stop.res.status, stop.res.handoffRound])
  const third = await go('resume: relaunch after the hand-off keeps the line', { ...resumeArgs, decisions: { 'R2-1': { choice: 'Keep it', notes: 'Kept.', date: '2026-11-01' } } }, later)
  samePrefix('resume: after the hand-off', stop.calls, third.calls, stop.calls.length)
  check('resume: the hand-off relaunch finishes', third.res.status === 'done', [third.res.status, third.res.error])

  // The shape stage: a missing disposition stops at shape; the resume reruns the shaper with the
  // replace sentence, and the three prompts before it replay.
  const two = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], []], commitIds: [['R1-1', 'R1-2']] }
  const shapeFail = await go('resume: shape stage error', baseArgs, { ...two, shaperDrop: ['R1-2'] })
  check('resume: a missing disposition names shape r1', shapeFail.res.status === 'error' && shapeFail.res.stage === 'shape' && shapeFail.res.error === 'the shaper gave no disposition for R1-2' && JSON.stringify(shapeFail.res.resumeFrom) === JSON.stringify({ label: 'shape r1', attempt: 2 }), [shapeFail.res.status, shapeFail.res.stage, shapeFail.res.error, shapeFail.res.resumeFrom])
  const shapeArgs = { ...baseArgs, resume: { 'shape r1': { attempt: 2, error: 'the shaper gave no disposition for R1-2', hand: { commits: [], paths: [] } } } }
  const reshaped = await go('resume: shape stage relaunch', shapeArgs, two)
  samePrefix('resume: shape stage', shapeFail.calls, reshaped.calls, 3)
  check('resume: the shaper prompt ends with the line and the replace sentence', pick(reshaped.calls, 'shape r1') && pick(reshaped.calls, 'shape r1').prompt.endsWith(line('the shaper gave no disposition for R1-2') + shaperLine), pick(reshaped.calls, 'shape r1') && pick(reshaped.calls, 'shape r1').prompt.slice(-600))
  check('resume: the shape relaunch finishes', reshaped.res.status === 'done', [reshaped.res.status, reshaped.res.error])

  // The approve stage names the plan approver, not the standards approver that started beside it.
  const bounced = await go('resume: approve exhausted', baseArgs, { ...base, planBounce: 3 })
  check('resume: an exhausted approval names the last plan approver', bounced.res.status === 'error' && bounced.res.stage === 'approve' && bounced.res.resumeFrom && bounced.res.resumeFrom.label === 'plan approver r1 #3', [bounced.res.status, bounced.res.stage, bounced.res.resumeFrom])

  // gather is not resumable: the head moved, the PR is not open, or the branch is wrong.
  const moved = await go('resume: gather is not resumable', baseArgs, { ...base, heads: ['b'.repeat(40)] })
  check('resume: a gather error carries resumeFrom null', moved.res.status === 'error' && moved.res.stage === 'gather' && moved.res.resumeFrom === null, [moved.res.status, moved.res.stage, moved.res.resumeFrom])

  // A hand commit on .claude/ since the run stopped: the checker reports it as unexpected and
  // without the prefix, the judge excuses both, and the next snapshot allows the path.
  const handSha = SHA(9)
  const handPatch = (label, out) => {
    if (label === 'check r1') {
      return failing(out)
    }
    if (label === 'recheck r1') {
      return { ...out, exit: 1, result: { ...out.result, git: { ...out.result.git, unexpected_files: ['.claude/redline/checks.json'], commits: [{ sha: handSha, message: 'Fix the gate config' }].concat(out.result.git.commits) } } }
    }
    return null
  }
  const withNit = { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'nit')], []], commitIds: [['R1-1'], ['R2-1']], checker: handPatch }
  const handArgs = { ...baseArgs, resume: { 'recheck r1': { attempt: 2, error: errorText, hand: { commits: [handSha], paths: ['.claude/redline/checks.json'] } } } }
  const hand = await go('resume: a hand commit is excused', handArgs, withNit)
  check('resume: the excused round passes and the run finishes', hand.res.status === 'done' && !labels(hand.calls).some((l) => l.startsWith('repair r1 #')), [hand.res.status, hand.res.error, labels(hand.calls)])
  check('resume: the hand commit is not one of the run\'s', !hand.res.commits.some((c) => c.sha === handSha || c.message === 'Fix the gate config'), hand.res.commits)
  const snapshotPaths = (run, label) => (pick(run.calls, label) ? JSON.parse(pick(run.calls, label).prompt.slice(pick(run.calls, label).prompt.indexOf('{'), pick(run.calls, label).prompt.lastIndexOf('}') + 1)).plan_paths : [])
  check('resume: the next snapshot allows the hand path', snapshotPaths(hand, 'snapshot r2').includes('.claude/redline/checks.json'), snapshotPaths(hand, 'snapshot r2'))
  check('resume: the snapshot before the resume point does not (it is cached)', !snapshotPaths(hand, 'snapshot r1').includes('.claude/redline/checks.json'), snapshotPaths(hand, 'snapshot r1'))
  const unexcused = await go('resume: an unexcused unexpected file still fails', { ...baseArgs, resume: { 'recheck r1': { attempt: 2, error: errorText, hand: { commits: [], paths: [] } } } }, withNit)
  check('resume: the neighbouring decision stands', unexcused.res.status === 'error' && unexcused.res.stage === 'check' && unexcused.res.error.includes('files outside the approved plan changed: .claude/redline/checks.json'), [unexcused.res.status, unexcused.res.stage, unexcused.res.error])
  // A second resume at the same label: run check prints the hand list with the label's earlier
  // entry merged in, so the entry carries both resumes' commits and paths, and the judge excuses both.
  const secondSha = SHA(10)
  const twoHands = (label, out) => {
    if (label === 'recheck r1') {
      return { ...out, exit: 1, result: { ...out.result, git: { ...out.result.git, unexpected_files: ['.claude/redline/checks.json', '.claude/redline/checks.sh'], commits: [{ sha: secondSha, message: 'Fix the gate script' }, { sha: handSha, message: 'Fix the gate config' }].concat(out.result.git.commits) } } }
    }
    return handPatch(label, out)
  }
  const bothArgs = { ...baseArgs, resume: { 'recheck r1': { attempt: 3, error: errorText, hand: { commits: [handSha, secondSha], paths: ['.claude/redline/checks.json', '.claude/redline/checks.sh'] } } } }
  const both = await go('resume: a second resume carries both hand commits', bothArgs, { ...withNit, checker: twoHands })
  check('resume: both hand commits are excused and the run finishes', both.res.status === 'done' && !labels(both.calls).some((l) => l.startsWith('repair r1 #')), [both.res.status, both.res.error, labels(both.calls)])
  check('resume: neither hand commit is one of the run\'s', !both.res.commits.some((c) => c.sha === handSha || c.sha === secondSha), both.res.commits)

  // The Finish comment and the record commit (#59, R1-6): each has two effects and no duplicate
  // check of its own, so the resume line at those labels gives it one; no other label carries it.
  const commentClause = ' Before Step 2, run `/p/scripts/redline-gh.sh pr-comments 114`: when a comment there has exactly the body of the file Step 1 wrote, an earlier attempt posted it, so post nothing, set posted true and comment_url to "" (the script prints no comment URL), and go on to Step 3.'
  const recordClause = ' Before Step 1, run `git -C /r status --porcelain --untracked-files=all -- <the paths Step 1 names>`: when it prints nothing, an earlier attempt committed them, so skip Steps 1 and 2, set committed true and sha to the full SHA `git -C /r rev-parse HEAD` prints, and do Step 3.'
  const finishFail = await go('resume: the handoff comment fails after posting', baseArgs, { ...base, finishError: 'could not request a review from sam' })
  check('resume: a Finish comment error names the handoff comment', finishFail.res.status === 'error' && finishFail.res.stage === 'finish' && JSON.stringify(finishFail.res.resumeFrom) === JSON.stringify({ label: 'handoff comment', attempt: 2 }), [finishFail.res.status, finishFail.res.stage, finishFail.res.resumeFrom])
  const commentArgs = { ...baseArgs, resume: { 'handoff comment': { attempt: 2, error: finishFail.res.error, hand: { commits: [], paths: [] } } } }
  const reposted = await go('resume: the handoff comment relaunch', commentArgs, { ...base, finishUrl: '' })
  check('resume: the handoff comment relaunch finishes', reposted.res.status === 'done', [reposted.res.status, reposted.res.error])
  check('resume: the handoff comment prompt ends with the line and the comment check', pick(reposted.calls, 'handoff comment') && pick(reposted.calls, 'handoff comment').prompt.endsWith(line(finishFail.res.error) + commentClause), pick(reposted.calls, 'handoff comment') && pick(reposted.calls, 'handoff comment').prompt.slice(-700))
  check('resume: a handoff comment found already posted is reported posted', reposted.res.handoffPosted === true, [reposted.res.handoffPosted, reposted.res.status])
  const recordFail = await go('resume: the record commit fails after committing', baseArgs, { ...base, recordError: 'push rejected: fetch first' })
  check('resume: a record commit error names the record commit', recordFail.res.status === 'error' && recordFail.res.stage === 'finish' && JSON.stringify(recordFail.res.resumeFrom) === JSON.stringify({ label: 'record commit', attempt: 2 }), [recordFail.res.status, recordFail.res.stage, recordFail.res.resumeFrom])
  const recommitArgs = { ...baseArgs, resume: { 'record commit': { attempt: 2, error: recordFail.res.error, hand: { commits: [], paths: [] } } } }
  const recommitted = await go('resume: the record commit relaunch', recommitArgs, base)
  check('resume: the record commit relaunch finishes', recommitted.res.status === 'done', [recommitted.res.status, recommitted.res.error])
  check('resume: the record commit prompt ends with the line and the commit check', pick(recommitted.calls, 'record commit') && pick(recommitted.calls, 'record commit').prompt.endsWith(line(recordFail.res.error) + recordClause), pick(recommitted.calls, 'record commit') && pick(recommitted.calls, 'record commit').prompt.slice(-700))
  check('resume: the handoff comment before a record commit resume carries no clause', pick(recommitted.calls, 'handoff comment') && !pick(recommitted.calls, 'handoff comment').prompt.includes('Resume attempt'), pick(recommitted.calls, 'handoff comment') && pick(recommitted.calls, 'handoff comment').prompt.slice(-300))
  check('resume: the recheck resume line carries neither clause', pick(second.calls, 'recheck r1') && !pick(second.calls, 'recheck r1').prompt.includes(commentClause) && !pick(second.calls, 'recheck r1').prompt.includes(recordClause), pick(second.calls, 'recheck r1') && pick(second.calls, 'recheck r1').prompt.slice(-400))

  // Bad args are refused before any agent runs.
  const badAttempt = await go('resume: bad attempt', { ...baseArgs, resume: { x: { attempt: 1, error: '' } } }, base)
  check('resume: an attempt under 2 is refused', badAttempt.thrown && /args.resume must map an agent label/.test(badAttempt.thrown.message) && badAttempt.calls.length === 0, badAttempt.thrown && badAttempt.thrown.message)
  const badShape = await go('resume: bad shape', { ...baseArgs, resume: [] }, base)
  check('resume: a list is refused', badShape.thrown && /args.resume must map an agent label/.test(badShape.thrown.message), badShape.thrown && badShape.thrown.message)
}

// ---------------------------------------------------------------------------
// 14. The spec check (#57) and the relayed line (#60). After the shaper, the GitHub agent's
//     read-only spec-status operation lists the spec folder's four files and greps shape.md for
//     its Decisions heading; a missing plan.md, shape.md or Decisions section, an ask without a
//     judgment call, or a call for a finding not sorted ask, is a shape-stage error with
//     resumeFrom the shaper's label, and no judgment call reaches the person. The check's own
//     failure names the status label, so a resume reruns the check. RUN_LINE names the two lines
//     the harness may relay (the script never sees the relayed line itself, so the second layer
//     is what the test can pin), and a decision's choice text reaches only the agents that apply it.
// ---------------------------------------------------------------------------
{
  const folder = 'agent-os/specs/2026-10-20-1600-114-review-round-1'
  const line = (e) => `Resume attempt 2 of this step. The run stopped at this step with an error (${e}); the person has since fixed the cause by hand. Do the step again from the current state of the repository and the PR. What an earlier attempt already made stands (a commit, a posted review or reply, a written file), and the duplicate checks in your instructions apply.`
  const shaperLine = ' Rewrite plan.md, shape.md, standards.md and references.md in the spec folder from scratch, replacing what the earlier attempt wrote; never change or remove anything under its redline/ folder.'
  const two = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], []], commitIds: [['R1-1', 'R1-2']] }
  const ok = await go('spec: a usable spec', baseArgs, two)
  const status = pick(ok.calls, 'spec status r1')
  check('spec: the status call follows the shaper, on the GitHub agent, in the Shape phase', status && labels(ok.calls).indexOf('spec status r1') === labels(ok.calls).indexOf('shape r1') + 1 && status.agentType === 'redline:redline-github' && status.opts.phase === 'Shape', labels(ok.calls))
  check('spec: the prompt holds the two commands and no finding', status && status.prompt.includes(`git -C /r grep --no-index -l -e '' -- ${folder}/plan.md ${folder}/shape.md ${folder}/standards.md ${folder}/references.md`) && status.prompt.includes(`git -C /r grep --no-index -l -e '^## Decisions' -- ${folder}/shape.md`) && status.prompt.includes('Operation: spec-status (round 1). Read only.') && !status.prompt.includes('"R1-'), status && status.prompt)
  check('spec: a usable spec finishes', ok.res.status === 'done', [ok.res.status, ok.res.error])

  const missing = { folder: ['no plan.md', 'no shape.md'], plan: ['no plan.md'], shape: ['no shape.md'], decisions: ['no "## Decisions" section in shape.md'] }
  for (const [kind, list] of Object.entries(missing)) {
    const run = await go(`spec: ${kind} missing`, baseArgs, { ...two, specMissing: kind })
    check(`spec: ${kind} missing stops at shape, naming what is missing and the shaper`, run.res.status === 'error' && run.res.stage === 'shape' && run.res.error === `the shaper wrote no usable spec in ${folder}: ${list.join(', ')}` && JSON.stringify(run.res.resumeFrom) === JSON.stringify({ label: 'shape r1', attempt: 2 }) && JSON.stringify(run.res.detail) === JSON.stringify({ specFolder: folder, missing: list }), [run.res.status, run.res.stage, run.res.error, run.res.resumeFrom, run.res.detail])
    check(`spec: ${kind} missing asks nothing and runs nothing after the check`, JSON.stringify(run.res.judgmentCalls) === '[]' && labels(run.calls).slice(-1)[0] === 'spec status r1' && !labels(run.calls).some((l) => l.startsWith('resolve') || l.startsWith('plan approver') || l === 'handoff comment'), labels(run.calls))
  }
  const asked = await go('spec: shape.md missing with an ask open', baseArgs, { ...two, ask: ['R1-1'], specMissing: 'shape' })
  check('spec: an ask never reaches the person without a spec', asked.res.status === 'error' && asked.res.stage === 'shape' && JSON.stringify(asked.res.judgmentCalls) === '[]' && asked.res.decisionsNeeded === undefined, [asked.res.status, asked.res.judgmentCalls, asked.res.decisionsNeeded])
  const partial = await go('spec: standards.md and references.md missing', baseArgs, { ...two, specMissing: 'partial' })
  check('spec: a missing standards.md or references.md is a warning', partial.res.status === 'done' && partial.res.warnings.includes(`round 1: the shaper wrote no standards.md in ${folder}`) && partial.res.warnings.includes(`round 1: the shaper wrote no references.md in ${folder}`), [partial.res.status, partial.res.warnings])
  const refused = await go('spec: the status command failed', baseArgs, { ...two, specError: 'git grep was refused' })
  check('spec: a failed check names the status label, not the shaper', refused.res.status === 'error' && refused.res.stage === 'shape' && refused.res.error === 'checking the round 1 spec folder failed: git grep was refused' && JSON.stringify(refused.res.resumeFrom) === JSON.stringify({ label: 'spec status r1', attempt: 2 }), [refused.res.status, refused.res.stage, refused.res.error, refused.res.resumeFrom])
  const noCall = await go('spec: an ask without a call', baseArgs, { ...two, ask: ['R1-1'], shaperNoCall: ['R1-1'] })
  check('spec: an ask without a judgment call stops at shape before the check', noCall.res.status === 'error' && noCall.res.stage === 'shape' && noCall.res.error === 'the shaper marked R1-1 as ask but returned no judgment call for it' && JSON.stringify(noCall.res.resumeFrom) === JSON.stringify({ label: 'shape r1', attempt: 2 }) && !labels(noCall.calls).includes('spec status r1'), [noCall.res.status, noCall.res.stage, noCall.res.error, noCall.res.resumeFrom, labels(noCall.calls)])
  const extra = await go('spec: a call for a fix', baseArgs, { ...two, shaperExtraCall: ['R1-2'] })
  check('spec: a judgment call for a finding sorted fix stops at shape', extra.res.status === 'error' && extra.res.stage === 'shape' && extra.res.error === 'the shaper returned a judgment call for R1-2, which it sorted as fix' && JSON.stringify(extra.res.resumeFrom) === JSON.stringify({ label: 'shape r1', attempt: 2 }), [extra.res.status, extra.res.stage, extra.res.error, extra.res.resumeFrom])

  // The resume (#10, decision 4): the shaper reruns with the replace sentence, the check runs again
  // after it with no resume line of its own, and the three prompts before the shaper replay.
  const failed = await go('spec: shape.md missing, then the resume', baseArgs, { ...two, specMissing: 'shape' })
  const resumeArgs = { ...baseArgs, resume: { 'shape r1': { attempt: 2, error: failed.res.error || 'no error', hand: { commits: [], paths: [] } } } }
  const resumed = await go('spec: the resume reruns the shaper and the check', resumeArgs, two)
  samePrefix('spec: resume', failed.calls, resumed.calls, 3)
  check('spec: the resumed shaper prompt ends with the line and the replace sentence', pick(resumed.calls, 'shape r1') && pick(resumed.calls, 'shape r1').prompt.endsWith(line(failed.res.error) + shaperLine), pick(resumed.calls, 'shape r1') && pick(resumed.calls, 'shape r1').prompt.slice(-600))
  check('spec: the check runs again after the shaper, without a resume line, and the run finishes', labels(resumed.calls)[4] === 'spec status r1' && pick(resumed.calls, 'spec status r1') && !pick(resumed.calls, 'spec status r1').prompt.includes('Resume attempt') && resumed.res && resumed.res.status === 'done', [labels(resumed.calls), resumed.res && resumed.res.status, resumed.res && resumed.res.error])

  // A reshape after a plan bounce is checked the same way and names its own label.
  const bounced = await go('spec: shape.md missing after a reshape', baseArgs, { ...two, planBounce: 1, specMissing: { 'spec status r1 #1': 'shape' } })
  check('spec: a reshape without a usable spec names the reshape label', bounced.res.status === 'error' && bounced.res.stage === 'shape' && JSON.stringify(bounced.res.resumeFrom) === JSON.stringify({ label: 'reshape r1 #1', attempt: 2 }) && labels(bounced.calls).slice(-2).join('|') === 'reshape r1 #1|spec status r1 #1', [bounced.res.status, bounced.res.stage, bounced.res.resumeFrom, labels(bounced.calls)])

  // A reshape after a decided ask (#61, R1-2): the reshape returns only the calls still pending or
  // newly raised, so a call the round already decided may be left out, or kept beside a finding the
  // reshape re-sorted; a new ask without a call and a new call for a fix still stop at shape.
  const decidedAsk = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-2'], planBounce: 1, commitIds: [['R1-1', 'R1-2']] }
  const decidedArgs = { ...baseArgs, decisions: { 'R1-2': { choice: 'Keep it', notes: 'The author keeps it as it is.', date: '2026-11-02' } } }
  const omitted = await go('reshape: a decided ask without its call', decidedArgs, { ...decidedAsk, reshapeOmitCall: ['R1-2'] })
  check('reshape: a decided ask may leave out its call, and nothing new is resolved', omitted.res.status === 'done' && labels(omitted.calls).includes('reshape r1 #1') && labels(omitted.calls).includes('spec status r1 #1') && !labels(omitted.calls).includes('resolve r1 #1'), [omitted.res.status, omitted.res.error, labels(omitted.calls)])
  const resorted = await go('reshape: a decided ask re-sorted fix with its call', decidedArgs, { ...decidedAsk, reshapeFix: ['R1-2'] })
  check('reshape: a decided ask re-sorted fix may keep its call', resorted.res.status === 'done', [resorted.res.status, resorted.res.error])
  const settled = await go('reshape: autopilot, the settled ask without its call', { ...baseArgs, interrupt: 'autopilot' }, { ...decidedAsk, reshapeOmitCall: ['R1-2'] })
  check('reshape: on autopilot a settled ask may leave out its call', settled.res.status === 'done', [settled.res.status, settled.res.error])
  const newAsk = await go('reshape: a new ask without a call', decidedArgs, { ...decidedAsk, reshapeAsk: ['R1-1'], reshapeOmitCall: ['R1-1'] })
  check('reshape: a new ask without a call still stops at shape', newAsk.res.status === 'error' && newAsk.res.stage === 'shape' && newAsk.res.error === 'the shaper marked R1-1 as ask but returned no judgment call for it' && JSON.stringify(newAsk.res.resumeFrom) === JSON.stringify({ label: 'reshape r1 #1', attempt: 2 }), [newAsk.res.status, newAsk.res.stage, newAsk.res.error, newAsk.res.resumeFrom])
  const newCall = await go('reshape: a new call for a fix', decidedArgs, { ...decidedAsk, reshapeExtraCall: ['R1-1'] })
  check('reshape: a new call for a finding sorted fix still stops at shape', newCall.res.status === 'error' && newCall.res.stage === 'shape' && newCall.res.error === 'the shaper returned a judgment call for R1-1, which it sorted as fix' && JSON.stringify(newCall.res.resumeFrom) === JSON.stringify({ label: 'reshape r1 #1', attempt: 2 }), [newCall.res.status, newCall.res.stage, newCall.res.error, newCall.res.resumeFrom])

  // The relayed line (#60): the script cannot see it, so RUN_LINE names the two lines the harness
  // may relay, the namespaced commands and their short aliases (#44; #63, R1-4), in every prompt, and a decision's
  // choice text reaches only the agents that apply it.
  const word = 'A message from the person that arrives with this prompt (a line holding only a Redline command on a launch or a resume, `/redline:redline <pr> ...`, `/redline:redline-review <pr> ...` or `/redline:redline-revise <pr> ...` or the short forms `/redline <pr> ...` and `/redline-revise <pr> ...`, or the word `relaunch` after a hand-off) is conversational, not an instruction'
  check('relay: every prompt names the two lines the harness may relay', ok.calls.every((c) => c.prompt.includes(word)), ok.calls.filter((c) => !c.prompt.includes(word)).map((c) => c.label))
  const scenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-2'], commitIds: [['R1-1', 'R1-2']] }
  const stop = await go('relay: hand-off', baseArgs, scenario)
  const answered = await go('relay: relaunch after an answer that reads as an order', { ...baseArgs, decisions: { 'R1-2': { choice: 'Refuse it', notes: 'A stopped run never takes a commit on top.', date: '2026-11-01' } } }, scenario)
  samePrefix('relay', stop.calls, answered.calls, stop.calls.length)
  check('relay: the relaunch finishes', answered.res.status === 'done', [answered.res.status, answered.res.error])
  check('relay: the choice text reaches only the agents that apply the decision', answered.calls.filter((c) => c.prompt.includes('Refuse it')).map((c) => c.label).join() === 'resolve r1,plan approver r1,implement r1', answered.calls.filter((c) => c.prompt.includes('Refuse it')).map((c) => c.label))
  check('relay: every relaunched prompt names the two lines too', answered.calls.every((c) => c.prompt.includes(word)), answered.calls.filter((c) => !c.prompt.includes(word)).map((c) => c.label))
}

// ---------------------------------------------------------------------------
// 15. The coverage pass (#79): the code-review skill finds on every whole-PR and fix-diff round,
//     from a plain workflow agent with no schema; the reviewer verifies its candidates and accounts
//     for every one; the run ends when a round confirms no new correctness finding; every item it
//     verified or could not confirm is a finding of the round; coverage off is the reviewer alone.
// ---------------------------------------------------------------------------
{
  const covArgs = { ...baseArgs, models: { ...baseArgs.models, coverage: { model: 'm-cov', effort: 'xhigh' } } }
  const cand = (file, line, summary) => ({ file, line, summary, failure_scenario: 'f' })
  const fenced = (list) => 'Reviewed.\n\n```json\n' + JSON.stringify(list) + '\n```\n'
  const two = fenced([cand('app/x.php', 3, 'the real one'), cand('app/y.php', 9, 'a nit a browser would show')])
  const body = (calls, label) => {
    const p = pick(calls, label).prompt
    return JSON.parse(p.slice(p.indexOf('{\n  "body"'), p.indexOf('\n}\n', p.indexOf('{\n  "body"')) + 2)).body
  }

  // Every round: coverage r1 before review r1, coverage r2 before re-review r2, none on the nit pass.
  const every = {
    reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit', { file: 'app/y.php', line: 9, confidence: 'unconfirmed', wouldConfirm: 'a browser on the page' })], []], commitIds: [['R1-1', 'R1-2']],
    coverage: [two, two],
    coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'unconfirmed', ref: 'R1-2' }], [{ index: 1, outcome: 'settled', ref: 'R1-1' }, { index: 2, outcome: 'settled', ref: 'R1-2' }]],
  }
  let run = await go('coverage: every round', covArgs, every)
  check('coverage: round 1 runs the pass before the review, round 2 before the re-review', labels(run.calls).slice(0, 5).join('|') === 'gather r1|coverage r1|review r1|post r1|shape r1' && labels(run.calls).join('|').includes('|gather r2|coverage r2|re-review r2|post r2|'), labels(run.calls))
  check('coverage: a round whose verifier confirms nothing new ends the run (non-empty list, all settled)', run.res.status === 'done' && run.res.rounds.length === 2 && !labels(run.calls).some((l) => l.startsWith('coverage r3')), [run.res.status, run.res.rounds.length])
  const c1 = pick(run.calls, 'coverage r1')
  const c2 = pick(run.calls, 'coverage r2')
  check('coverage: the pass is the default workflow agent with no schema, at models.coverage', c1.opts.agentType === undefined && c1.opts.schema === undefined && c1.opts.model === 'm-cov' && c1.opts.effort === 'xhigh' && c1.opts.phase === 'Review' && c2.opts.phase === 'Re-review', [c1.opts, c2.opts])
  check('coverage: the prompt names the skill, the effort, the head branch and every finding', c1.prompt.includes('skill "code-review" and args "xhigh redline-seed-3 --max-findings all"') && c1.prompt.includes(`at ${'a'.repeat(40)}`) && c1.prompt.includes('coverage: skill denied') && c1.prompt.includes('coverage: skill absent'), c1.prompt.slice(-600))
  check('coverage: round 2 runs the pass over the whole PR at the pushed head', c2.prompt.includes(`at ${run.res.rounds[1].range.to}`) && c2.prompt.includes('not only the last round\'s fixes'), c2.prompt.slice(0, 400))
  const r1 = pick(run.calls, 'review r1').prompt
  const r2 = pick(run.calls, 're-review r2').prompt
  check('coverage: the review prompt carries the candidates, the verify instruction and the definition of new', r1.includes('Candidates from the coverage pass.') && r1.includes('"index": 1') && r1.includes('"summary": "the real one"') && r1.includes('you run no discovery pass of your own') && r1.includes('A candidate is new when it collapses into none of these') && r1.includes('What to do about a true claim is not yours to decide') && r1.includes('turns on something the repository cannot show') && !r1.includes('forThePerson') && !r1.includes('disproportionate'), r1.slice(-1500))
  check('coverage: the re-review prompt keeps the fix-diff recheck beside the candidates', r2.includes('only the fix diff') && r2.includes('Candidates from the coverage pass.') && r2.includes('Your recheck of the fix diff named above stays as your instructions say'), r2.slice(-800))
  check('coverage: the result carries each round\'s accounting, and no For the person list', !('forThePerson' in run.res.rounds[0]) && run.res.rounds[0].coverage.counts.verified === 1 && run.res.rounds[0].coverage.counts.unconfirmed === 1 && run.res.rounds[1].coverage.counts.settled === 2 && Object.keys(run.res.rounds[0].coverage.counts).join(',') === 'verified,unconfirmed,refuted,duplicate,settled,known', [run.res.rounds[0].coverage, run.res.rounds[1].coverage])
  const b1 = body(run.calls, 'post r1')
  const b2 = body(run.calls, 'post r2')
  check('coverage: the round 1 body counts the candidates, lists the items by kind with what would confirm the unconfirmed one, and ends with the closing sentence', b1.includes('Reviewed the whole pull request.\n\nThe coverage pass over the whole pull request at aaaaaaa returned 2 candidates: 1 verified, 1 could not be confirmed, 0 refuted, 0 collapsed into items already reported or settled, 0 already tracked.') && b1.endsWith('\n\n### Correctness (1)\n\n- **R1-1** · correctness · low · confirmed · `app/x.php:1` · title R1-1\n\n### Could not confirm (1)\n\n- **R1-2** · nit · low · unconfirmed · `app/y.php:9` · title R1-2\n  Would confirm it: a browser on the page\n\n' + CLOSING) && !b1.includes('For the person'), b1)
  check('coverage: the round 2 body names both the fix diff and the whole PR', b2.startsWith(`Redline round 2\n\nReviewed the fix diff from round 1 (aaaaaaa..${run.res.rounds[1].range.to.slice(0, 7)}), and the coverage pass's candidates over the whole pull request at ${run.res.rounds[1].range.to.slice(0, 7)}.\n\nThe coverage pass over the whole pull request at ${run.res.rounds[1].range.to.slice(0, 7)} returned 2 candidates: 0 verified, 0 could not be confirmed, 0 refuted, 2 collapsed into items already reported or settled, 0 already tracked.`), b2)
  const findingsFile = pick(run.calls, 'post r1').prompt
  check('coverage: the findings file carries the coverage record and no For the person list', !findingsFile.includes('"forThePerson"') && findingsFile.includes('"wouldConfirm": "a browser on the page"') && findingsFile.includes('"coverage": {\n    "head": "aaaaaaaaaa') && findingsFile.includes('"candidates": 2'), findingsFile.slice(-900))
  // The findings file keeps the candidate list its accounting indexes point into (#80, R1-5); the
  // round record and the result keep the count only.
  check('coverage: the findings file carries the candidate list beside the accounting', findingsFile.includes('"list": [') && findingsFile.includes('"index": 1') && findingsFile.includes('"summary": "the real one"') && findingsFile.includes('"candidates": 2'), findingsFile.slice(-1200))
  check('coverage: the result\'s coverage record has no candidate list', !('list' in run.res.rounds[0].coverage) && run.res.rounds[0].coverage.candidates === 2, run.res.rounds[0].coverage)
  let handoff = comment(run.calls, 'handoff comment')
  check('coverage: the handoff has no For the person section', !handoff.includes('For the person') && handoff.includes('### Commits'), handoff)
  check('coverage: the log line names the accounting (no throw, two rounds)', run.res.rounds[1].coverage.candidates === 2)

  // The done rule's other branches: a new verified finding runs another round; nits only end in the
  // final nit pass with no coverage call; correctness only is done at once; the cap holds.
  const settledAll = [{ index: 1, outcome: 'settled', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: 'untouched code' }]
  run = await go('coverage: a new verified finding runs another round', covArgs, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')], []], commitIds: [['R1-1'], ['R2-1']], coverage: [two, two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], [{ index: 1, outcome: 'verified', ref: 'R2-1' }, { index: 2, outcome: 'known', ref: '#7' }], settledAll] })
  check('coverage: round 3 runs after a new finding in round 2, then the run is done', run.res.status === 'done' && run.res.rounds.length === 3 && labels(run.calls).join('|').includes('|gather r3|coverage r3|re-review r3|'), [run.res.status, labels(run.calls)])
  // A candidate matching a fixed finding that still reproduces at this head is new, named with the
  // earlier id, so a fix that did not fully land runs another round (#80, R2-1).
  const reopens = (p) => p.includes('whose outcome is fixed, but that you reproduce or trace at this round\'s head, is new') && p.includes('the earlier id named in its description')
  check('coverage: a fixed finding that still reproduces is new', reopens(pick(run.calls, 're-review r2').prompt) && reopens(pick(run.calls, 'review r1').prompt), pick(run.calls, 're-review r2').prompt.slice(-2500))
  run = await go('coverage: nits only end in the final nit pass', covArgs, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'nit')], []], commitIds: [['R1-1'], ['R2-1']], coverage: [two, two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: 'x' }], [{ index: 1, outcome: 'settled', ref: 'R1-1' }, { index: 2, outcome: 'verified', ref: 'R2-1' }], settledAll] })
  check('coverage: the final nit pass has no coverage call and the run is done', run.res.status === 'done' && run.res.rounds.length === 3 && labels(run.calls).includes('final nit pass r3') && !labels(run.calls).includes('coverage r3'), labels(run.calls))
  check('coverage: the final nit pass review has no candidates block and no accounting', !pick(run.calls, 'final nit pass r3').prompt.includes('Candidates from the coverage pass') && run.res.rounds[2].coverage === null, run.res.rounds[2].coverage)
  handoff = comment(run.calls, 'handoff comment')
  check('coverage: the handoff says the coverage pass reviewed the whole PR at every round\'s head but the final nit pass\'s', handoff.includes('The coverage pass reviewed the whole PR at the head of every round but the final nit pass; see [Known limits]') && !handoff.includes('Only round 1 reviewed the whole PR'), handoff.split('\n')[2])
  run = await go('coverage: correctness only is done at once', { ...covArgs, scope: 'correctness' }, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: 'x' }], settledAll] })
  check('coverage: correctness only, nothing new in round 2, no nit pass', run.res.status === 'done' && run.res.rounds.length === 2 && !labels(run.calls).some((l) => l.startsWith('final nit pass')), labels(run.calls))
  check('coverage: the correctness-only prompt tells the verifier a nit candidate is still verified and that the run declines it', pick(run.calls, 'review r1').prompt.includes('Scope: correctness only. Run no nit checks of your own') && pick(run.calls, 'review r1').prompt.includes('the run declines it under the scope'))
  run = await go('coverage: the cap holds', { ...covArgs, maxRounds: 1 }, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')]], commitIds: [['R1-1']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: 'x' }], [{ index: 1, outcome: 'verified', ref: 'R2-1' }, { index: 2, outcome: 'refuted', ref: 'x' }]] })
  check('coverage: capped with a new finding every round', run.res.status === 'capped' && labels(run.calls).includes('coverage r2'), [run.res.status, labels(run.calls)])

  // An earlier run's handled findings (#80, R1-2): the pass samples the whole PR at every head, so
  // a fix-diff round that ran it is shown the handled list and the sentence that matches against
  // it; the carry-forward list stays on the whole-PR round. With coverage off the re-review's
  // prompt is as before: neither the list nor the sentence.
  const handled = { firstRound: 2, priorFindings: [prior('R1-1', 'deferred', { comment_id: 11 })] }
  const handledScenario = (cov) => ({ reviews: [[f('R2-1', 'correctness')], []], commitIds: [['R2-1']], ...(cov ? { coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R2-1' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], [{ index: 1, outcome: 'settled', ref: 'R2-1' }, { index: 2, outcome: 'refuted', ref: 'untouched code' }]] } : {}) })
  run = await go('coverage: an earlier run\'s handled findings on a fix-diff round', { ...covArgs, ...handled }, handledScenario(true))
  const handledR3 = pick(run.calls, 're-review r3').prompt
  check('coverage: a fix-diff round that ran the pass lists the earlier run\'s handled findings and matches against them', handledR3.includes('Findings Redline\'s earlier rounds on this PR already handled') && handledR3.includes('"id": "R1-1"') && handledR3.includes('match against them, not against their review comments') && !handledR3.includes('Findings from earlier rounds with no disposition'), handledR3.slice(0, 2500))
  run = await go('coverage: off, an earlier run\'s handled findings on a fix-diff round', { ...baseArgs, ...handled }, handledScenario(false))
  const handledOff = pick(run.calls, 're-review r3').prompt
  check('coverage: off, the fix-diff round has neither the handled list nor the sentence, as before', !handledOff.includes('already handled') && !handledOff.includes('match against them') && pick(run.calls, 'review r2').prompt.includes('"id": "R1-1"'), handledOff.slice(0, 2500))
  const handledOffR2 = pick(run.calls, 'review r2').prompt
  // The decline-reopen exception reaches every wording of the never-raised rule (#94, R1-1): the
  // agent file's sentence, and the history header of a round with candidates; with coverage off
  // the header is as before.
  check('coverage: the agent file says a declined finding is not raised again, except one declined for want of confirmation that the verifier now confirms', reviewerAgent.includes('is not raised again, except one declined because it could not be confirmed'))
  check('coverage: the history header carries the decline-reopen exception on a covered round, and a coverage off round keeps the header as before', (handledR3 || '').includes('never re-raise a declined, deferred or decided one, except one declined because it could not be confirmed that you now confirm') && (handledOff || '').includes('never re-raise a declined, deferred or decided one):'), [(handledR3 || '').slice(0, 2500), (handledOff || '').slice(0, 2500)])

  // A decided finding stays settled whatever its commits (#80, R3-4): a candidate that still
  // reproduces one is accounted for as settled, naming its id and saying so, is shown in the
  // set-aside block of the review and the handoff (For the person is gone, #93), and the run ends.
  // A fixed one that still reproduces is new and runs another round, and the handled-list header
  // carries that exception only when the pass ran (#80, R2-1, R3-3).
  const decidedPrior = { firstRound: 2, priorFindings: [prior('R1-1', 'decided', { comment_id: 11 })] }
  run = await go('coverage: a decided finding that still reproduces', { ...covArgs, ...decidedPrior }, { reviews: [[]], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'settled', ref: 'R1-1 was decided, and this still reproduces it' }, { index: 2, outcome: 'refuted', ref: 'untouched code' }]] })
  const decidedR2 = pick(run.calls, 'review r2').prompt
  check('coverage: a decided finding that still reproduces is settled with its id, shown in the block, not new, and the run ends', run.res.status === 'done' && run.res.rounds.length === 1 && run.res.rounds[0].findings.length === 0 && run.res.rounds[0].coverage.counts.verified === 0 && run.res.rounds[0].coverage.counts.settled === 1 && body(run.calls, 'post r2').includes('- `app/x.php:3` · the real one · settled: R1-1 was decided, and this still reproduces it\n') && comment(run.calls, 'handoff comment').includes('### Candidates set aside in round 2 (2)') && comment(run.calls, 'handoff comment').includes('- `app/x.php:3` · the real one · settled: R1-1 was decided, and this still reproduces it\n') && decidedR2.includes('A decided finding stays settled whatever its commits') && decidedR2.includes('accounted for as settled') && decidedR2.includes('a decided one stays settled whatever its commits'), [run.res.status, run.res.rounds.length, run.res.rounds[0].coverage, decidedR2.slice(0, 2500)])
  const fixedPrior = { firstRound: 2, priorFindings: [prior('R1-1', 'fixed', { comment_id: 11 })] }
  run = await go('coverage: a fixed finding that still reproduces', { ...covArgs, ...fixedPrior }, { reviews: [[f('R2-1', 'correctness', { description: 'R1-1 was fixed, but still reproduces here' })], []], commitIds: [['R2-1']], coverage: [two, two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R2-1' }, { index: 2, outcome: 'refuted', ref: 'untouched code' }], [{ index: 1, outcome: 'settled', ref: 'R2-1' }, { index: 2, outcome: 'refuted', ref: 'untouched code' }]] })
  const fixedR2 = pick(run.calls, 'review r2').prompt
  check('coverage: the handled-list header names both reopenings when the pass ran', fixedR2.includes('and one declined for want of confirmation that you now confirm, which is new the same way; a decided one stays settled whatever its commits') && !handledOffR2.includes('for want of confirmation'), fixedR2.slice(0, 2500))
  check('coverage: a fixed finding that still reproduces is new and runs another round; the header says so only with the pass', run.res.rounds[0].coverage.counts.verified === 1 && run.res.rounds[0].findings[0].knownAs === '' && run.res.status === 'done' && run.res.rounds.length === 2 && labels(run.calls).includes('re-review r3') && fixedR2.includes('never re-raise one, except a fixed one a coverage candidate shows still reproduces at this head, which is new and carries no knownAs') && handledOffR2.includes('"<id>: <disposition>"; never re-raise one):'), [run.res.status, run.res.rounds.map((r) => r.coverage && r.coverage.counts), labels(run.calls), fixedR2.slice(0, 2500)])

  // Defaults: models.coverage absent means on, at reviewerFirstRound's model and effort; with no
  // effort anywhere the pass is told high.
  run = await go('coverage: defaults from reviewerFirstRound', { ...baseArgs, models: { revise: { model: 'claude-opus-5-5' }, reviewerFirstRound: { model: 'm-first', effort: 'xhigh' } } }, { reviews: [[]], coverage: [two], coverageOut: [settledAll] })
  check('coverage: absent means on at the first-round reviewer\'s model and effort', pick(run.calls, 'coverage r1').opts.model === 'm-first' && pick(run.calls, 'coverage r1').opts.effort === 'xhigh' && pick(run.calls, 'coverage r1').prompt.includes('"xhigh redline-seed-3 --max-findings all"'), pick(run.calls, 'coverage r1').opts)
  run = await go('coverage: no effort anywhere', { ...baseArgs, models: { revise: { model: 'claude-opus-5-5' } } }, { reviews: [[]] })
  check('coverage: with no effort configured the pass is told high', pick(run.calls, 'coverage r1').opts.effort === 'high' && pick(run.calls, 'coverage r1').prompt.includes('"high redline-seed-3 --max-findings all"'), pick(run.calls, 'coverage r1').opts)
  run = await go('coverage: a bad effort word', { ...baseArgs, models: { revise: { model: 'claude-opus-5-5' }, coverage: { model: 'm', effort: 'ultra' } } }, { reviews: [[]] })
  check('coverage: an effort word the skill would run elsewhere fails at launch', run.thrown && run.thrown.message.includes('must be one of low | medium | high | xhigh | max'), run.thrown && run.thrown.message)

  // Accounting: an index the verifier left out, or gave an unknown outcome, becomes a finding of
  // the round as reported, unconfirmed, with a warning; so does a ref that names no finding, which
  // is never counted verified (#80, R1-4; #93). The shaper's second look then decides each one,
  // so no candidate leaves quietly and none is parked.
  const three = fenced([cand('app/x.php', 3, 'one'), cand('app/y.php', 4, 'two'), cand('app/z.php', 5, 'three')])
  run = await go('coverage: accounting', covArgs, { reviews: [[f('R1-1', 'correctness')], []], decline: ['R1-2', 'R1-3', 'R1-4'], secondLook: { 'R1-2': 'unconfirmed', 'R1-3': 'unconfirmed', 'R1-4': 'refuted' }, commitIds: [['R1-1']], coverage: [three, three], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R9-9' }, { index: 3, outcome: 'maybe', ref: '' }], [{ index: 1, outcome: 'settled', ref: 'R1-2' }, { index: 2, outcome: 'settled', ref: 'R1-3' }, { index: 3, outcome: 'settled', ref: 'R1-4' }]] })
  check('coverage: unaccounted, unknown-outcome and no-finding-ref candidates become unconfirmed findings as reported', run.res.rounds[0].findings.map((x) => `${x.id}:${x.category}:${x.confidence}:${x.file}:${x.line}:${x.title}`).join(',') === 'R1-1:correctness:confirmed:app/x.php:1:title R1-1,R1-2:correctness:unconfirmed:app/x.php:3:one,R1-3:correctness:unconfirmed:app/y.php:4:two,R1-4:correctness:unconfirmed:app/z.php:5:three' && run.res.rounds[0].coverage.accounting.map((e) => `${e.index}:${e.outcome}:${e.ref}`).join(',') === '1:unconfirmed:R1-2,2:unconfirmed:R1-3,3:unconfirmed:R1-4', run.res.rounds[0])
  check('coverage: a ref that names no finding is not counted verified', run.res.rounds[0].coverage.counts.verified === 0 && run.res.rounds[0].coverage.counts.unconfirmed === 3, run.res.rounds[0].coverage.counts)
  check('coverage: the warnings name the index, the new id and the bad ref', run.res.warnings.some((w) => w === 'round 1: the reviewer did not account for coverage candidate 2 (app/y.php:4); kept as R1-3, an unconfirmed finding, as reported') && run.res.warnings.some((w) => w.includes('coverage candidate 3 the outcome "maybe"')) && run.res.warnings.some((w) => w.includes('with ref "R9-9", which is not a finding of this round')), run.res.warnings)
  check('coverage: each one goes to the shaper with a line on what would confirm it, is decided, and the next round collapses it as settled', pick(run.calls, 'shape r1').prompt.includes('"id": "R1-3"') && pick(run.calls, 'shape r1').prompt.includes('"wouldConfirm": "The verifier gave no account of this candidate; check the claim as the finder made it."') && replyFor(run.calls, 'push and reply r1', 'R1-3') === 'Redline round 1: declined: the spec keeps R1-3 as it is on purpose · decided by: redline' && run.res.rounds[1].findings.length === 0 && run.res.rounds[1].coverage.counts.settled === 3 && run.res.status === 'done', [run.res.rounds[1], run.res.status])
  // An unconfirmed finding that says nothing on what would confirm it is posted saying so, with a
  // warning; an entry whose outcome disagrees with its finding's own confidence is counted by the
  // finding's, with a warning, so the count sentence and the body's headings never disagree.
  run = await go('coverage: an unconfirmed finding with nothing to confirm it', covArgs, { reviews: [[f('R1-1', 'correctness', { confidence: 'unconfirmed' }), f('R1-2', 'nit')], []], decline: ['R1-1'], commitIds: [['R1-2']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'unconfirmed', ref: 'R1-2' }], settledAll] })
  check('coverage: an unconfirmed finding that says nothing on what would confirm it is posted as not stated, with a warning', body(run.calls, 'post r1').includes('### Could not confirm (1)\n\n- **R1-1** · correctness · low · unconfirmed · `app/x.php:1` · title R1-1\n  Would confirm it: not stated\n') && pick(run.calls, 'post r1').prompt.includes('Could not confirm. Would confirm it: not stated') && run.res.warnings.includes('round 1: the reviewer could not confirm R1-1 and did not say what would confirm it'), [body(run.calls, 'post r1'), run.res.warnings])
  check('coverage: an entry is counted by its finding\'s own confidence, with a warning when the two disagree', run.res.rounds[0].coverage.accounting.map((e) => `${e.index}:${e.outcome}:${e.ref}`).join(',') === '1:unconfirmed:R1-1,2:verified:R1-2' && body(run.calls, 'post r1').includes('returned 2 candidates: 1 verified, 1 could not be confirmed,') && run.res.warnings.includes('round 1: the reviewer accounted for coverage candidate 1 as verified, but R1-1 is unconfirmed; counted as unconfirmed') && run.res.warnings.includes('round 1: the reviewer accounted for coverage candidate 2 as unconfirmed, but R1-2 is confirmed; counted as verified'), [run.res.rounds[0].coverage, run.res.warnings])
  // A finding the workflow renames keeps its accounting entry: the ref is renamed with it, so the
  // candidate is counted verified and is not kept as a second, unconfirmed finding (#80, R2-3).
  run = await go('coverage: a renamed finding keeps its accounting', covArgs, { reviews: [[f('X-1', 'correctness')], []], commitIds: [['R1-1']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'X-1' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], settledAll] })
  const renamedRound = run.res.rounds[0]
  check('coverage: a renamed finding keeps its accounting', renamedRound.findings[0].id === 'R1-1' && renamedRound.coverage.accounting.map((e) => `${e.index}:${e.outcome}:${e.ref}`)[0] === '1:verified:R1-1' && renamedRound.coverage.counts.verified === 1 && renamedRound.coverage.counts.unconfirmed === 0 && renamedRound.findings.length === 1 && body(run.calls, 'post r1').includes('1 verified') && run.res.warnings.includes('round 1: reviewer returned id "X-1"; renamed R1-1') && !run.res.warnings.some((w) => w.includes('which is not a finding of this round')), [renamedRound.coverage, renamedRound.findings, run.res.warnings])

  // A candidate is counted where the round puts it (#80, R1-4): under correctness only a nit the
  // verifier reported from a candidate is verified, and declined by the scope in its own list (#93);
  // a finding listed under Already tracked counts as already tracked, a nit under the scope included.
  const nitCorrectness = (nit) => ({ reviews: [[f('R1-1', 'correctness'), nit], []], commitIds: [['R1-1']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'verified', ref: 'R1-2' }], settledAll] })
  run = await go('coverage: a nit under correctness only', { ...covArgs, scope: 'correctness' }, nitCorrectness(f('R1-2', 'nit', { file: 'app/y.php', line: 9 })))
  let nb = body(run.calls, 'post r1')
  check('coverage: under correctness only a nit from a candidate is verified, and declined by the scope in its own list', nb.includes('returned 2 candidates: 2 verified, 0 could not be confirmed,') && nb.includes('### Declined under this run\'s scope (correctness only) (1)\n\n- R1-2 · `app/y.php:9` · title R1-2') && run.res.rounds[0].coverage.accounting[1].outcome === 'verified' && run.res.rounds[0].outcomes['R1-2'].startsWith('declined: outside this run\'s scope'), [nb, run.res.rounds[0].coverage])
  run = await go('coverage: a known nit under correctness only', { ...covArgs, scope: 'correctness' }, nitCorrectness(f('R1-2', 'nit', { file: 'app/y.php', line: 9, knownAs: '#7' })))
  nb = body(run.calls, 'post r1')
  check('coverage: under correctness only a known nit is already tracked, not declined by the scope', run.res.rounds[0].coverage.accounting[1].outcome === 'known' && run.res.rounds[0].coverage.counts.known === 1 && nb.includes('### Already tracked\n\n- **R1-2** title R1-2: #7') && !nb.includes('Declined under this run'), [nb, run.res.rounds[0].coverage])
  run = await go('coverage: a known finding from a candidate', covArgs, { reviews: [[f('R1-1', 'correctness', { knownAs: '#7' })]], coverage: [two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }]] })
  nb = body(run.calls, 'post r1')
  check('coverage: a finding listed under Already tracked counts as already tracked, not confirmed', run.res.rounds[0].coverage.counts.known === 1 && run.res.rounds[0].coverage.counts.verified === 0 && run.res.rounds[0].coverage.counts.refuted === 1 && nb.includes('0 verified') && nb.includes('1 already tracked'), [nb, run.res.rounds[0].coverage])
  // Its accounting entry is known, so the set-aside block lists the candidate's own summary beside
  // the finding and the issue it is tracked in (the #85 follow-up spec, decision 1).
  check('coverage: a known finding from a candidate is listed in the set-aside block with the finding and the issue', nb.includes('### Candidates set aside (2)\n\n<details>\n<summary>Refuted, collapsed or already tracked</summary>\n\n- `app/x.php:3` · the real one · known: R1-1: #7\n- `app/y.php:9` · a nit a browser would show · refuted: not reachable\n'), nb)
  run = await go('coverage: a nit under scope all', covArgs, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'nit')], []], commitIds: [['R1-1'], ['R2-1']], coverage: [two, two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: 'x' }], [{ index: 1, outcome: 'settled', ref: 'R1-1' }, { index: 2, outcome: 'verified', ref: 'R2-1' }], settledAll] })
  check('coverage: under scope all a nit from a candidate is verified like any item', run.res.rounds[1].coverage.counts.verified === 1 && run.res.rounds[1].coverage.counts.unconfirmed === 0 && body(run.calls, 'post r2').includes('### Other items (1)\n\n- **R2-1** · nit'), run.res.rounds[1].coverage)
  check('coverage: an accounting with no pass behind it is cleared with a warning', (await go('coverage: accounting without a pass', baseArgs, { reviews: [[]], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }]] })).res.warnings.some((w) => w === 'round 1: the reviewer returned a coverage accounting, but this round ran no coverage pass; cleared'))

  // The three causes stop the round at review, resumable at the coverage label; an empty array is
  // zero candidates, not an error.
  for (const [name, text, words] of [['denied', 'coverage: skill denied\nSkill tool is not allowed in this session', 'the Skill tool was denied'], ['absent', 'coverage: skill absent\nNo such skill: code-review', 'no skill named code-review'], ['no array', 'Skill execution completed', 'holds no fenced json array']]) {
    run = await go(`coverage: ${name}`, covArgs, { reviews: [[]], coverage: [text] })
    check(`coverage: ${name} stops the round at review, resumable at coverage r1`, run.res.status === 'error' && run.res.stage === 'review' && JSON.stringify(run.res.resumeFrom) === JSON.stringify({ label: 'coverage r1', attempt: 2 }) && run.res.error.includes(words) && run.res.error.includes('launch again with coverage off') && run.res.rounds.length === 0, [run.res.status, run.res.stage, run.res.resumeFrom, run.res.error])
  }
  // A marker is read on any line, after optional backticks or quotes, since the agent may copy the
  // prompt's formatting or lead with a sentence; it is read only when no list was found, so a skill
  // result that quotes a marker is still the list (#80, R2-2).
  for (const [name, text, words] of [['a backticked denied marker stops with the denied cause', '`coverage: skill denied`\nSkill tool is not allowed in this session', 'the Skill tool was denied'], ['an absent marker after a leading line stops with the absent cause', 'The Skill tool reported no such skill.\ncoverage: skill absent\nNo such skill: code-review', 'no skill named code-review']]) {
    run = await go(`coverage: ${name}`, covArgs, { reviews: [[]], coverage: [text] })
    check(`coverage: ${name}`, run.res.status === 'error' && run.res.stage === 'review' && JSON.stringify(run.res.resumeFrom) === JSON.stringify({ label: 'coverage r1', attempt: 2 }) && run.res.error.includes(words) && run.res.error.includes('launch again with coverage off'), [run.res.status, run.res.stage, run.res.resumeFrom, run.res.error])
  }
  run = await go('coverage: a skill result that quotes a marker', covArgs, { reviews: [[]], coverage: ['`coverage: skill denied` is one of the markers the prompt names.\n' + two], coverageOut: [settledAll] })
  check('coverage: a skill result that quotes a marker is still the list', run.res.status === 'done' && labels(run.calls).includes('review r1') && pick(run.calls, 'review r1').prompt.includes('"summary": "the real one"'), [run.res.status, run.res.error, labels(run.calls)])
  // An array with none of the skill's fields is not the skill's list (#80, R1-3): renamed keys or
  // bare strings are the recipe-drift stop, never blank candidates.
  for (const [name, list] of [['renamed keys', [{ path: 'app/x.php', start_line: 3, description: 'real bug' }]], ['strings', ['real bug']]]) {
    run = await go(`coverage: an array of ${name}`, covArgs, { reviews: [[]], coverage: [fenced(list)] })
    check(`coverage: an array of ${name} stops the round as recipe drift, resumable at coverage r1`, run.res.status === 'error' && run.res.stage === 'review' && JSON.stringify(run.res.resumeFrom) === JSON.stringify({ label: 'coverage r1', attempt: 2 }) && run.res.error.includes('holds no fenced json array') && run.res.error.includes('launch again with coverage off') && !labels(run.calls).includes('review r1'), [run.res.status, run.res.stage, run.res.resumeFrom, run.res.error])
  }
  run = await go('coverage: denied on round 2', covArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']], coverage: [two, 'coverage: skill denied\nno'], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: 'x' }]] })
  check('coverage: a cause on round 2 resumes at coverage r2 with round 1 intact', run.res.status === 'error' && JSON.stringify(run.res.resumeFrom) === JSON.stringify({ label: 'coverage r2', attempt: 2 }) && run.res.rounds.length === 1, [run.res.status, run.res.resumeFrom, run.res.rounds.length])
  run = await go('coverage: empty array', covArgs, { reviews: [[]], coverage: ['```json\n[]\n```'] })
  check('coverage: an empty array is zero candidates, not an error', run.res.status === 'done' && pick(run.calls, 'review r1').prompt.includes('returned no candidates. Run no discovery pass of your own') && run.res.rounds[0].coverage.candidates === 0 && body(run.calls, 'post r1').includes('returned no candidates.'), [run.res.status, run.res.error])

  // Resume at the coverage label appends the resume line to that prompt only.
  const plain = await go('coverage: before a resume', covArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: 'x' }], settledAll] })
  const resumed = await go('coverage: resume at coverage r2', { ...covArgs, resume: { 'coverage r2': { attempt: 2, error: 'the Skill tool was denied', hand: { commits: [], paths: [] } } } }, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: 'x' }], settledAll] })
  const at = labels(plain.calls).indexOf('coverage r2')
  samePrefix('coverage resume', plain.calls, resumed.calls, at)
  check('coverage: the resumed coverage prompt carries the resume line, round 1\'s does not', pick(resumed.calls, 'coverage r2').prompt.includes('Resume attempt 2 of this step') && !pick(resumed.calls, 'coverage r1').prompt.includes('Resume attempt'), pick(resumed.calls, 'coverage r2').prompt.slice(-300))

  // Replay across the round boundary: a hand-off in round 2 and its relaunch replay every prompt
  // before the stop, the coverage prompts included.
  const askLater = { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')], []], ask: ['R2-1'], commitIds: [['R1-1'], ['R2-1']], coverage: [two, two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: 'x' }], [{ index: 1, outcome: 'verified', ref: 'R2-1' }, { index: 2, outcome: 'settled', ref: 'R1-1' }], settledAll] }
  const stop = await go('coverage: hand-off in round 2', covArgs, askLater)
  check('coverage: the hand-off stops after round 2\'s shaper', stop.res.status === 'handoff' && labels(stop.calls).slice(-2).join('|') === 'shape r2|spec status r2' && labels(stop.calls).includes('coverage r2'), labels(stop.calls))
  const again = await go('coverage: relaunch after the hand-off', { ...covArgs, decisions: { 'R2-1': { choice: 'Keep it', notes: 'Kept.', date: '2026-11-05' } } }, askLater)
  samePrefix('coverage replay', stop.calls, again.calls, stop.calls.length)
  check('coverage: the relaunch finishes after round 3', again.res.status === 'done' && again.res.rounds.length === 3, [again.res.status, again.res.rounds.length])

  // coverage off: no pass on any round, no candidates block, today's handoff sentence, and no For
  // the person section either: the reviewer alone reports under the same contract (#93).
  run = await go('coverage: off', baseArgs, { reviews: [[f('R1-1', 'nit')], []], commitIds: [['R1-1']] })
  check('coverage: off runs no pass on any round and adds no block', !labels(run.calls).some((l) => l.startsWith('coverage')) && !pick(run.calls, 'review r1').prompt.includes('Candidates from the coverage pass') && !pick(run.calls, 'final nit pass r2').prompt.includes('Candidates from the coverage pass') && run.res.rounds[0].coverage === null, labels(run.calls))
  check('coverage: off carries no fixed-reopens sentence', !pick(run.calls, 'review r1').prompt.includes('whose outcome is fixed') && !pick(run.calls, 'final nit pass r2').prompt.includes('whose outcome is fixed'), labels(run.calls))
  check('coverage: off keeps today\'s whole-PR sentence in the handoff', comment(run.calls, 'handoff comment').includes('Only round 1 reviewed the whole PR; see [Known limits]'), comment(run.calls, 'handoff comment').split('\n')[2])
  check('coverage: off has no For the person section, and the reviewer is told to report what it verified', !body(run.calls, 'post r1').includes('For the person') && !comment(run.calls, 'handoff comment').includes('For the person') && pick(run.calls, 'review r1').prompt.includes('You establish what is true') && !pick(run.calls, 'review r1').prompt.includes('needsDecision'), body(run.calls, 'post r1'))
  const mixed = await go('coverage: a bad config value', { ...baseArgs, models: { revise: { model: 'claude-opus-5-5' }, coverage: 'off' } }, { reviews: [[]] })
  check('coverage: a config value that is neither an object nor null fails at launch', mixed.thrown && mixed.thrown.message.includes('args.models.coverage must be an object'), mixed.thrown && mixed.thrown.message)

  // The verifier's three rules (#85), and where a partly tracked candidate's issue is named (#86,
  // R1-4), each pinned by a short key phrase in the agent file and in a covered verify prompt, and
  // absent from a coverage-off prompt, so a rule restated in one place and not the other is red
  // (#80, R3-3) and coverage off stays as before. #85 named a structural test of the agent file
  // that did not exist; these checks are what was built in its place.
  // The fifth entry pins that a partly tracked remainder meets every other rule (#86, R2-1). The
  // sixth pins the accounting sentence that says what the set-aside block lists, widened with the
  // block (the #85 follow-up spec, answer 11). The seventh pins that a duplicate's ref opens with
  // the index or the id, so the target parse reads it (#86, R4-1).
  const offRules = await go('coverage: off, the verifier rules and the set-aside block', baseArgs, { reviews: [[f('R1-1', 'nit')], []], commitIds: [['R1-1']] })
  const uncovered = pick(offRules.calls, 'review r1').prompt
  const covered = pick((await go('coverage: the verifier rules', covArgs, { reviews: [[]], coverage: [two], coverageOut: [settledAll] })).calls, 'review r1').prompt
  for (const [rule, phrase] of [['partly tracked', 'the remainder is judged as its own candidate'], ['a refutation answers the candidate\'s claim', 'neighbouring claim does not refute'], ['a removed guard is a fact the verifier states', 'this pull request stopped handling'], ['a verified or unconfirmed entry\'s ref is the finding\'s id alone', 'ref is the finding\'s id alone'], ['a partly tracked remainder meets every other rule', 'unless another rule here puts it elsewhere'], ['the review body lists every candidate that is not a finding of the round', 'every candidate that is not a finding of this round'], ['a duplicate\'s ref opens with the index or the id', 'opening with the index of the candidate or the id of the finding'], ['could not confirm is the narrow case', 'turns on something the repository cannot show'], ['no candidate is held back for its size, its cost or where its cause lies', 'What to do about a true claim is not yours to decide'], ['a decline for want of confirmation reopens once confirmed', 'could not be confirmed, and that you now confirm'], ['a decided finding that still reproduces is settled', 'accounted for as settled']]) {
    check(`coverage: the agent file and the verify prompt state the rule "${rule}", and a coverage-off prompt does not`, reviewerAgent.includes(phrase) && covered.includes(phrase) && !uncovered.includes(phrase), [phrase, reviewerAgent.includes(phrase), covered.includes(phrase), uncovered.includes(phrase)])
  }
  // The known-finding section opens on what is tracked in full (#86, R1-1). The review prompt's own
  // known-finding sentence stays as it was, so a coverage-off prompt is unchanged, and this sentence
  // is pinned in the agent file alone.
  check('coverage: the agent file opens its known-finding check on what is already tracked in full', reviewerAgent.includes('look for what is already tracked in full'), 'agents/redline-reviewer.md, "Check for known findings first"')
  // The kind is stated wherever the verifier reads its instructions, with or without the pass, since
  // a correctness item the run acts on buys another round (#93, the done rule's rider).
  for (const phrase of ['a promise this pull request makes', 'a privacy leak', 'You establish what is true']) {
    check(`coverage: the agent file and every review prompt, covered or not, say "${phrase}"`, reviewerAgent.includes(phrase) && covered.includes(phrase) && uncovered.includes(phrase), [phrase, reviewerAgent.includes(phrase), covered.includes(phrase), uncovered.includes(phrase)])
  }
  check('coverage: the agent file no longer has a For the person list, a needsDecision field or a disproportionate outcome', !reviewerAgent.includes('forThePerson') && !reviewerAgent.includes('For the person') && !reviewerAgent.includes('needsDecision') && !reviewerAgent.includes('disproportionate'), 'agents/redline-reviewer.md')

  // A candidate an issue tracks only in part (#85): the remainder caused in this pull request's
  // diff is a finding that names the issue, knownAs empty, so it is confirmed, listed under
  // Findings, shaped, and keeps the run going. The tracked part is known, so each round's set-aside
  // block lists it with the issue (the #85 follow-up spec, decision 2), and the handoff carries
  // round 2's.
  const partlyCandidates = fenced([cand('app/x.php', 3, 'the save no longer checks the owner, and the lookup ignores case'), cand('app/x.php', 8, 'the lookup ignores case')])
  run = await go('coverage: a partly tracked candidate', covArgs, {
    reviews: [[f('R1-1', 'correctness', { file: 'app/x.php', line: 3, description: 'Issue #7 tracks the case-insensitive lookup; the owner check this pull request removed from the save is not in it.' })], []],
    commitIds: [['R1-1']],
    coverage: [partlyCandidates, partlyCandidates],
    coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'known', ref: '#7' }], [{ index: 1, outcome: 'settled', ref: 'R1-1' }, { index: 2, outcome: 'known', ref: '#7' }]],
  })
  const pb = body(run.calls, 'post r1')
  check('coverage: a partly tracked candidate is a finding naming the issue, confirmed, shaped, and the run goes on', pick(run.calls, 'review r1').prompt.includes('the remainder is judged as its own candidate') && run.res.rounds[0].coverage.counts.verified === 1 && run.res.rounds[0].coverage.counts.known === 1 && run.res.rounds[0].findings[0].knownAs === '' && pb.includes('1 verified') && pb.includes('1 already tracked') && pb.includes('### Correctness (1)\n\n- **R1-1**') && !pb.includes('### Already tracked') && pick(run.calls, 'post r1').prompt.includes('Issue #7 tracks the case-insensitive lookup') && pick(run.calls, 'shape r1').prompt.includes('"id": "R1-1"') && labels(run.calls).includes('re-review r2') && run.res.status === 'done', [pb, run.res.rounds[0].coverage, labels(run.calls)])
  const knownLine = '- `app/x.php:8` · the lookup ignores case · known: #7'
  check('coverage: the set-aside block lists a partly tracked candidate\'s tracked part as known, naming the issue, in the review body and the handoff', pb.includes('### Candidates set aside (1)\n\n<details>\n<summary>Refuted, collapsed or already tracked</summary>\n\n' + knownLine + '\n\n</details>') && comment(run.calls, 'handoff comment').includes('### Candidates set aside in round 2 (2)\n\n<details>\n<summary>Refuted, collapsed or already tracked</summary>\n\n- `app/x.php:3` · the save no longer checks the owner, and the lookup ignores case · settled: R1-1\n' + knownLine + '\n\n</details>'), [pb, comment(run.calls, 'handoff comment')])
  check('coverage: a round whose candidates are all findings has no set-aside block', b1.includes('1 verified, 1 could not be confirmed,') && !b1.includes('<details>'), b1)

  // The set-aside block (#85; the #85 follow-up spec; #93): every candidate that is not a finding
  // of the round, by one rule, one line each after the closing sentence, in index order,
  // with the candidate's own file, line and summary, as written, then the outcome and the
  // verifier's ref. A known line names the issue; a duplicate of another candidate's index also
  // gives that candidate's place and outcome, so a duplicate of a refuted or tracked
  // candidate cannot hide; a duplicate of a finding id is as written. The label's count is the
  // count sentence's refuted, collapsed and already tracked added up. The handoff carries the block
  // of the last round that ran the pass, naming that round; an earlier round's block stays in its
  // own review body.
  const nine = fenced([cand('app/x.php', 3, 'the real one'), cand('app/y.php', 9, 'a nit a browser would show'), cand('app/z.php', 5, 'Saving clears the `note` field when the form *omits* it'), cand('lib/w.php', 12, 'an old helper rounds down'), cand('app/v.php', 7, 'two saves in the same millisecond lose one'), cand('app/u.php', 4, 'the export skips archived rows'), cand('app/x.php', 4, 'the save skips the owner check'), cand('app/z.php', 6, 'saving drops the note'), cand('app/y.php', 10, 'the same nit, seen from the template')])
  const setAsideOut = [
    { index: 5, outcome: 'verified', ref: 'R1-3' },
    { index: 1, outcome: 'verified', ref: 'R1-1' },
    { index: 2, outcome: 'verified', ref: 'R1-2' },
    { index: 3, outcome: 'refuted', ref: 'The claim is that saving clears the note when the form omits it; the form always sends the field, and the save test posts without it and keeps the note.' },
    { index: 4, outcome: 'verified', ref: 'R1-4' },
    { index: 6, outcome: 'known', ref: '#7' },
    { index: 7, outcome: 'duplicate', ref: 'R1-1' },
    { index: 8, outcome: 'duplicate', ref: '3' },
    { index: 9, outcome: 'duplicate', ref: 'candidate 2' },
  ]
  // What the verifier used to drop is a finding now, with the fact stated: the conditions a failure
  // needs (R1-3) and a cause in code the pull request did not change (R1-4, outsideDiff).
  run = await go('coverage: the set-aside block', covArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit', { file: 'app/y.php', line: 9 }), f('R1-3', 'correctness', { file: 'app/v.php', line: 7, description: 'Needs two saves in the same millisecond.' }), f('R1-4', 'correctness', { file: 'lib/w.php', line: 12, outsideDiff: true })], []], commitIds: [['R1-1', 'R1-2', 'R1-3', 'R1-4']], coverage: [nine, two], coverageOut: [setAsideOut, settledAll] })
  const setAside1 = [
    '### Candidates set aside (5)',
    '',
    '<details>',
    '<summary>Refuted, collapsed or already tracked</summary>',
    '',
    '- `app/z.php:5` · Saving clears the `note` field when the form *omits* it · refuted: The claim is that saving clears the note when the form omits it; the form always sends the field, and the save test posts without it and keeps the note.',
    '- `app/u.php:4` · the export skips archived rows · known: #7',
    '- `app/x.php:4` · the save skips the owner check · duplicate: R1-1',
    '- `app/z.php:6` · saving drops the note · duplicate: 3 (candidate 3, `app/z.php:5`: refuted)',
    '- `app/y.php:10` · the same nit, seen from the template · duplicate: candidate 2 (candidate 2, `app/y.php:9`: verified R1-2)',
    '',
    '</details>',
  ].join('\n')
  const db = body(run.calls, 'post r1')
  check('coverage: the review body lists every candidate that is not a finding of the round after the closing sentence, in index order, with its own summary, the outcome and the ref, and ends with the block', db.endsWith('\n\n' + CLOSING + '\n\n' + setAside1), db)
  check('coverage: the set-aside block\'s count is the count sentence\'s refuted, collapsed and already tracked added up', db.includes('returned 9 candidates: 4 verified, 0 could not be confirmed, 1 refuted, 3 collapsed into items already reported or settled, 1 already tracked.') && db.includes('Candidates set aside (5)'), db)
  check('coverage: a cause outside the diff is a fact on the finding, stated in its inline comment, never a reason to drop it', pick(run.calls, 'post r1').prompt.includes('The cause is in code this pull request did not change.') && pick(run.calls, 'shape r1').prompt.includes('"outsideDiff": true') && db.includes('- **R1-4** · correctness · low · confirmed · `lib/w.php:12` · title R1-4'), db)
  check('coverage: no set-aside line opens with a finding id, so prior-findings never reads one back', db.includes('<details>') && !db.slice(db.indexOf('<details>'), db.indexOf('</details>')).split('\n').some((l) => l.startsWith('- **R')), db)
  const lastBlock = '### Candidates set aside in round 2 (2)\n\n<details>\n<summary>Refuted, collapsed or already tracked</summary>\n\n- `app/x.php:3` · the real one · settled: R1-1\n- `app/y.php:9` · a nit a browser would show · refuted: untouched code\n\n</details>'
  handoff = comment(run.calls, 'handoff comment')
  check('coverage: the handoff carries the last covered round\'s set-aside block, naming the round, before Commits; round 1\'s block is not repeated', handoff.includes(lastBlock) && handoff.indexOf('### Candidates set aside') < handoff.indexOf('### Commits') && handoff.split('### Candidates set aside').length === 2 && !handoff.includes('app/z.php:5') && !handoff.includes('app/u.php:4'), handoff)
  // What the result keeps of a covered round (#80, R1-5; #86, R2-2): the candidate count, the
  // counts by outcome and the accounting, each set-aside candidate's index, outcome and ref among
  // it, and no setAsideCandidates field and no candidate list. The set-aside entries, with their
  // file, line and summary, ride on the round record, which only the handoff reads (the handoff
  // check above).
  check('coverage: the result keeps the candidate count, the counts by outcome and each set-aside candidate\'s index, outcome and ref in the accounting, and no setAsideCandidates field or candidate list', !('setAsideCandidates' in run.res.rounds[0]) && Object.keys(run.res.rounds[0].coverage).join(',') === 'head,candidates,counts,accounting' && run.res.rounds[0].coverage.candidates === 9 && run.res.rounds[0].coverage.counts.refuted === 1 && run.res.rounds[0].coverage.counts.duplicate === 3 && run.res.rounds[0].coverage.counts.known === 1 && run.res.rounds[0].coverage.accounting.every((e) => Object.keys(e).join(',') === 'index,outcome,ref') && setAsideOut.filter((d) => !['verified', 'unconfirmed'].includes(d.outcome)).every((d) => run.res.rounds[0].coverage.accounting.some((e) => e.index === d.index && e.outcome === d.outcome && e.ref === d.ref)), [Object.keys(run.res.rounds[0]), run.res.rounds[0].coverage])

  // A run that ends in a final nit pass, which runs no coverage pass, carries the block of the
  // round before it, and names that round.
  run = await go('coverage: the set-aside block before a final nit pass', covArgs, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'nit')], []], commitIds: [['R1-1'], ['R2-1']], coverage: [three, three, three], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: 'x' }, { index: 3, outcome: 'refuted', ref: 'untouched code' }], [{ index: 1, outcome: 'settled', ref: 'R1-1' }, { index: 2, outcome: 'verified', ref: 'R2-1' }, { index: 3, outcome: 'refuted', ref: 'The claim is three; the code does two.' }]] })
  handoff = comment(run.calls, 'handoff comment')
  check('coverage: after a final nit pass the handoff carries the round before it, named', labels(run.calls).includes('final nit pass r3') && handoff.includes('### Candidates set aside in round 2 (2)\n\n<details>\n<summary>Refuted, collapsed or already tracked</summary>\n\n- `app/x.php:3` · one · settled: R1-1\n- `app/z.php:5` · three · refuted: The claim is three; the code does two.\n\n</details>') && !handoff.includes('in round 3') && !handoff.includes('refuted: untouched code'), handoff)
  // The block's own heading (#87): the block sits under its own heading, so it never reads as part
  // of the lists above it; the heading sits directly above it, after the closing
  // sentence, which follows the findings (the #87 follow-up spec, answer 9).
  const noPerson = body(run.calls, 'post r2')
  check('coverage: the set-aside block opens under its own heading, after the findings and the closing sentence', noPerson.includes('### Other items (1)\n\n- **R2-1** · nit · low · confirmed · `app/x.php:1` · title R2-1\n\n' + CLOSING + '\n\n### Candidates set aside (2)\n\n<details>\n<summary>Refuted, collapsed or already tracked</summary>\n\n- `app/x.php:3` · one · settled: R1-1\n'), noPerson)

  // A set-aside entry with no ref still gets its line, reading "no reason given", and a warning
  // naming the index, so the slip is visible and the candidate never leaves silently.
  run = await go('coverage: a set-aside candidate with no reason', covArgs, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'nit', { file: 'app/x.php', line: 3 }), f('R2-2', 'nit', { file: 'app/y.php', line: 9, confidence: 'unconfirmed', wouldConfirm: 'w' })], []], commitIds: [['R1-1'], ['R2-1', 'R2-2']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: '  ' }], [{ index: 1, outcome: 'verified', ref: 'R2-1' }, { index: 2, outcome: 'unconfirmed', ref: 'R2-2' }]] })
  check('coverage: a set-aside candidate with no reason reads "no reason given", with a warning naming its index', body(run.calls, 'post r1').includes('- `app/y.php:9` · a nit a browser would show · refuted: no reason given\n') && run.res.warnings.includes('round 1: the reviewer set aside coverage candidate 2 as refuted with no reason; listed as "no reason given"'), [body(run.calls, 'post r1'), run.res.warnings])
  // The handoff carries the last covered round's block, not the last round with one (#85,
  // decision 14; #86, R1-2): round 1 set candidate 2 aside, round 2 ran the pass and put both
  // candidates among its findings, so the handoff has no block.
  check('coverage: the handoff carries the last covered round\'s block, not the last round with one, so a last covered round that set nothing aside leaves no block though an earlier round set one aside', body(run.calls, 'post r1').includes('<details>') && labels(run.calls).includes('coverage r2') && !body(run.calls, 'post r2').includes('<details>') && !comment(run.calls, 'handoff comment').includes('Candidates set aside'), comment(run.calls, 'handoff comment'))

  // The escaping of posted text (#87; the #85 follow-up spec): `&` then `<` are escaped and the word
  // joiner's reference `&#8288;` follows each `@` before an ASCII letter or digit (the #87 follow-up
  // spec, answer 8), outside code spans, read over the line's whole text as GitHub pairs backtick
  // runs (equal lengths; an unclosed run is plain text),
  // so no tag in a summary or a ref ends the block or opens another, no `@` mentions anyone, and a
  // code span reads as written. A text holding `](`, `][`, `://`, `www.` (any case), a backslash
  // before a backtick, a carriage return or a newline is escaped whole, spans included: there GitHub
  // reads a backtick as part of a link or an autolink, or as escaped, before it pairs spans (the #87
  // spec's Evidence). `[` alone is no trigger, nor is a backslash elsewhere, so code talk with
  // brackets or a namespace keeps its spans (#89, R3-3). An `&` inside a span is left as written,
  // beside one outside it that is escaped (#86, R5-1). A `@&#8288;` the finder typed has its `&`
  // escaped, so it reads back as typed. A Would confirm line goes through the same function. Each
  // line is pinned as the string the workflow writes, one case per way the reading can go wrong.
  const tags = fenced([
    cand('app/a.vue', 1, 'a bare </details> ends the block, a bare <details> opens one, and `<Head title="x" />` in a span is text'),
    cand('app/b.vue', 2, 'a double-backtick span ``a ` b <c>`` keeps its single backtick'),
    cand('app/c.vue', 3, 'an unclosed ` before <i> is plain text'),
    cand('app/d.vue', 4, 'one ` left open in the summary'),
    cand('app/e.vue', 5, 'two\nlines with `<b>`'),
    cand('app/f.vue', 6, 'an escaped \\` then <i>`'),
    cand('app/g.vue', 7, 'a span `a && b <c>` keeps its ampersands & this one does not'),
    cand('app/h.vue', 8, 'binds @click, `@click` in a span, @123, @-x and a@b.co'),
    cand('app/i.vue', 9, 'see [a](/u "`") </details> ` end'),
    cand('app/j.vue', 10, 'see [a][q`] <i>x</i> `c`'),
    cand('app/k.vue', 11, 'see http://x.com/a`b <i>x</i> `c`'),
    cand('app/l.vue', 12, 'see WWW.x.com/`a <i>x</i> `b`'),
    cand('app/m.vue', 13, 'first\r</details> and @param'),
    cand('app/n.vue', 14, 'App\\Models\\User::save drops `<x-slot>` and `@csrf` when `$a && $b`, beside a \\<b> and \\& c'),
    cand('app/o.vue', 15, 'see [a](/u) and `@param`'),
    cand('app/p.vue', 16, '`$a[0] < $b` and `[data-x] <i>` & more'),
    cand('app/r.vue', 17, 'a typed @&#8288;x stays as typed'),
  ])
  const tagsOut = [
    { index: 1, outcome: 'refuted', ref: 'Tom & Jerry wrote &lt; by hand' },
    { index: 2, outcome: 'refuted', ref: 'untouched code' },
    { index: 3, outcome: 'refuted', ref: 'needs a lone backtick' },
    { index: 4, outcome: 'refuted', ref: '`<c>` pairs it across the ref' },
    ...[5, 6, 7].map((index) => ({ index, outcome: 'refuted', ref: 'untouched code' })),
    { index: 8, outcome: 'refuted', ref: 'not a mention of @param' },
    ...[9, 10, 11, 12, 13, 14, 15, 16, 17].map((index) => ({ index, outcome: 'refuted', ref: 'untouched code' })),
  ]
  run = await go('coverage: the set-aside block escapes outside code spans', covArgs, { reviews: [[f('R1-1', 'nit', { confidence: 'unconfirmed', wouldConfirm: 'a <b> & c note from @param' })]], decline: ['R1-1'], coverage: [tags], coverageOut: [tagsOut] })
  const escapedLines = [
    '- `app/a.vue:1` · a bare &lt;/details> ends the block, a bare &lt;details> opens one, and `<Head title="x" />` in a span is text · refuted: Tom &amp; Jerry wrote &amp;lt; by hand',
    '- `app/b.vue:2` · a double-backtick span ``a ` b <c>`` keeps its single backtick · refuted: untouched code',
    '- `app/c.vue:3` · an unclosed ` before &lt;i> is plain text · refuted: needs a lone backtick',
    '- `app/d.vue:4` · one ` left open in the summary · refuted: `&lt;c>` pairs it across the ref',
    '- `app/e.vue:5` · two\nlines with `&lt;b>` · refuted: untouched code',
    '- `app/f.vue:6` · an escaped \\` then &lt;i>` · refuted: untouched code',
    '- `app/g.vue:7` · a span `a && b <c>` keeps its ampersands &amp; this one does not · refuted: untouched code',
    '- `app/h.vue:8` · binds @' + WJ + 'click, `@click` in a span, @' + WJ + '123, @-x and a@' + WJ + 'b.co · refuted: not a mention of @' + WJ + 'param',
    '- `app/i.vue:9` · see [a](/u "`") &lt;/details> ` end · refuted: untouched code',
    '- `app/j.vue:10` · see [a][q`] &lt;i>x&lt;/i> `c` · refuted: untouched code',
    '- `app/k.vue:11` · see http://x.com/a`b &lt;i>x&lt;/i> `c` · refuted: untouched code',
    '- `app/l.vue:12` · see WWW.x.com/`a &lt;i>x&lt;/i> `b` · refuted: untouched code',
    '- `app/m.vue:13` · first\r&lt;/details> and @' + WJ + 'param · refuted: untouched code',
    '- `app/n.vue:14` · App\\Models\\User::save drops `<x-slot>` and `@csrf` when `$a && $b`, beside a \\&lt;b> and \\&amp; c · refuted: untouched code',
    '- `app/o.vue:15` · see [a](/u) and `@' + WJ + 'param` · refuted: untouched code',
    '- `app/p.vue:16` · `$a[0] < $b` and `[data-x] <i>` &amp; more · refuted: untouched code',
    '- `app/r.vue:17` · a typed @&amp;#8288;x stays as typed · refuted: untouched code',
  ]
  const eb = body(run.calls, 'post r1')
  handoff = comment(run.calls, 'handoff comment')
  const oneBlock = (text) => text.split('<details>').length === 2 && text.split('</details>').length === 2 && text.split('<summary>').length === 2
  check('coverage: the set-aside block escapes & and < and neutralises @ outside code spans, leaves a span as written, and stays one collapsed block, in the review body and the handoff', eb.includes('### Candidates set aside (17)\n\n<details>\n<summary>Refuted, collapsed or already tracked</summary>\n\n' + escapedLines.join('\n') + '\n\n</details>') && handoff.includes('### Candidates set aside in round 1 (17)\n\n<details>\n<summary>Refuted, collapsed or already tracked</summary>\n\n' + escapedLines.join('\n') + '\n\n</details>') && oneBlock(eb) && oneBlock(handoff), [eb, handoff])
  // One check per way the reading can go wrong, so a failure names the rule that broke.
  const blockLine = (n) => eb.includes(escapedLines[n - 1] + '\n')
  check('posted text: an @ before a letter or a digit gets the joiner\'s reference &#8288;, outside a span and in the ref, while @ in a span and @-x stay as written', blockLine(8), eb)
  check('posted text: `](` escapes the whole text, so a backtick in a link title cannot leave a tag raw', blockLine(9), eb)
  check('posted text: `][` escapes the whole text, so a full reference link cannot take a label\'s backtick', blockLine(10), eb)
  check('posted text: `://` escapes the whole text, so a bare autolink cannot take a backtick', blockLine(11), eb)
  check('posted text: `www.` escapes the whole text in any case', blockLine(12), eb)
  check('posted text: a carriage return escapes the whole text and neutralises its @', blockLine(13), eb)
  check('posted text: a backslash before a backtick escapes the whole text', blockLine(6), eb)
  check('posted text: a backslash not before a backtick is no trigger, so a namespaced text keeps its spans as written', blockLine(14), eb)
  check('posted text: in a text escaped whole, an @ inside a span gets the joiner\'s reference too', blockLine(15), eb)
  check('posted text: `[` alone is no trigger, so brackets in code talk keep their spans as written', blockLine(16), eb)
  check('posted text: a @&#8288; the finder typed has its & escaped, so it is not taken for the workflow\'s', blockLine(17), eb)
  // What the GitHub agent copies with the Write tool holds the neutraliser as plain ASCII, so a copy
  // that dropped it would show, and holds no raw joiner (the #87 follow-up spec, decision 2).
  check('posted text: the post prompt and the handoff prompt carry @&#8288; and no raw U+2060', ['post r1', 'handoff comment'].every((label) => pick(run.calls, label).prompt.includes('@' + WJ + 'param') && !pick(run.calls, label).prompt.includes(RAW_WJ)), ['post r1', 'handoff comment'].map((label) => pick(run.calls, label).prompt.includes(RAW_WJ)))
  check('posted text: a Would confirm line goes through the same function', eb.includes('### Could not confirm (1)\n\n- **R1-1** · nit · low · unconfirmed · `app/x.php:1` · title R1-1\n  Would confirm it: a &lt;b> &amp; c note from @' + WJ + 'param\n'), eb)

  // A duplicate's target, by the form of its ref (the #85 follow-up spec's shaping default "A
  // duplicate's target"; #86, R4-2): `index N` in lower case and `candidate N` in upper case each
  // read as another candidate's index and give its place and outcome, while a ref naming the
  // candidate itself, or an index past the round's candidates, is shown as written with no
  // addition. Each check turns on one clause of the parse: the `index` alternative, the case flag,
  // the self guard and the lookup of the index among the round's candidates.
  // A ref that opens with the index and carries a note after it keeps its target, since the
  // parse reads a leading index token and the accounting sentence asks for the index first (#86,
  // R4-1).
  // A leading number that runs into a word (`1st`) is not an index token, since the index ends at
  // a word boundary, and `candidate` with no space before the number is not the `candidate N`
  // form, so both are shown as written: one check each for the `\b` and the `\s+` (#86, R5-2).
  const forms = fenced([cand('app/z.php', 5, 'the target'), cand('app/z.php', 6, 'a lower-case index ref'), cand('app/z.php', 7, 'an upper-case candidate ref'), cand('app/z.php', 8, 'a ref naming itself'), cand('app/z.php', 9, 'a ref past the last candidate'), cand('app/z.php', 10, 'a ref with a note after the index'), cand('app/z.php', 11, 'a ref whose number runs into a word'), cand('app/z.php', 12, 'a ref with no space after candidate')])
  const formsOut = [
    { index: 1, outcome: 'refuted', ref: 'The claim is one thing; the code does another.' },
    { index: 2, outcome: 'duplicate', ref: 'index 1' },
    { index: 3, outcome: 'duplicate', ref: 'CANDIDATE 1' },
    { index: 4, outcome: 'duplicate', ref: '4' },
    { index: 5, outcome: 'duplicate', ref: '99' },
    { index: 6, outcome: 'duplicate', ref: '1; #7 tracks the case-folding' },
    { index: 7, outcome: 'duplicate', ref: '1st pass missed it' },
    { index: 8, outcome: 'duplicate', ref: 'candidate1' },
  ]
  run = await go('coverage: a duplicate\'s target by the form of its ref', covArgs, { reviews: [[]], coverage: [forms], coverageOut: [formsOut] })
  const fb = body(run.calls, 'post r1')
  check('coverage: a lower-case `index N` duplicate ref reads as another candidate\'s index and gives its place and outcome', fb.includes('\n- `app/z.php:6` · a lower-case index ref · duplicate: index 1 (candidate 1, `app/z.php:5`: refuted)\n'), fb)
  check('coverage: an upper-case `CANDIDATE N` duplicate ref reads as another candidate\'s index, since the parse ignores case', fb.includes('\n- `app/z.php:7` · an upper-case candidate ref · duplicate: CANDIDATE 1 (candidate 1, `app/z.php:5`: refuted)\n'), fb)
  check('coverage: a duplicate ref naming the candidate itself is shown as written, with no addition', fb.includes('\n- `app/z.php:8` · a ref naming itself · duplicate: 4\n'), fb)
  check('coverage: a duplicate ref past the round\'s last candidate is shown as written, with no addition', fb.includes('\n- `app/z.php:9` · a ref past the last candidate · duplicate: 99\n'), fb)
  check('coverage: a duplicate ref that opens with another candidate\'s index keeps its place and outcome with a note after the index', fb.includes('\n- `app/z.php:10` · a ref with a note after the index · duplicate: 1; #7 tracks the case-folding (candidate 1, `app/z.php:5`: refuted)\n'), fb)
  check('coverage: a duplicate ref whose leading number runs into a word is shown as written, with no addition', fb.includes('\n- `app/z.php:11` · a ref whose number runs into a word · duplicate: 1st pass missed it\n'), fb)
  check('coverage: a duplicate ref with no space between `candidate` and the number is shown as written, with no addition', fb.includes('\n- `app/z.php:12` · a ref with no space after candidate · duplicate: candidate1\n'), fb)

  // A duplicate of a candidate that became a finding (#86, R5-4): the block does not list the
  // finding, which sits under Findings and may be anchored on another line than the candidate, so
  // the duplicate's line names the finding's id after the target's place and outcome. A target of
  // any other outcome gets no id: the refuted targets above end at the outcome.
  const intoFinding = fenced([cand('app/x.php', 3, 'the real one'), cand('app/x.php', 8, 'the same cause, seen from the save')])
  run = await go('coverage: a duplicate of a candidate that became a finding', covArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']], coverage: [intoFinding, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'duplicate', ref: '1' }], settledAll] })
  const ib = body(run.calls, 'post r1')
  check('coverage: a duplicate of a candidate that became a finding names the finding\'s id after the target\'s place and outcome', ib.includes('\n- `app/x.php:8` · the same cause, seen from the save · duplicate: 1 (candidate 1, `app/x.php:3`: verified R1-1)\n'), ib)

  // coverage off: no candidates, so no set-aside block anywhere.
  check('coverage: off has no set-aside block in the review body or the handoff', !body(offRules.calls, 'post r1').includes('<details>') && !comment(offRules.calls, 'handoff comment').includes('Candidates set aside'), body(offRules.calls, 'post r1'))
}

// ---------------------------------------------------------------------------
// 16. Posted text (#87): every finder and verifier field the review body and the handoff post,
//     and an inline comment's title, go through the block's function, with fields that share a
//     line read as one text; shaper, person and implementer text, and the workflow's own mentions,
//     are posted as written; a title read back from GitHub is decoded once at intake, so posting
//     it again escapes it once; the agent files whose text is posted ask for `@` identifiers in
//     backticks.
// ---------------------------------------------------------------------------
{
  const review = (calls, label) => {
    const p = pick(calls, label).prompt
    return JSON.parse(p.slice(p.indexOf('{\n  "body"'), p.indexOf('\n}\n', p.indexOf('{\n  "body"')) + 2))
  }
  const posted = 'Binds @' + WJ + 'click to &lt;b> &amp; more'

  // The lines outside the block, with a defer: the finding line and its inline comment's title, an
  // Already tracked line whose title leaves a backtick open that pairs with one in its knownAs (read
  // apart, `<c>` would sit outside GitHub's span), the summary (one with a newline is escaped
  // whole), and the handoff's Deferred line, whose shaper mitigation stays raw. The finding line
  // keeps a suffix after its escaped title: R1-1 is under a repository ask rule.
  const outside = [
    f('R1-1', 'correctness', { title: 'Binds @click to <b> & more', askRule: 'billing' }),
    f('R1-2', 'nit', { title: 'one ` open', knownAs: '#41 `<c>`' }),
    f('R1-3', 'correctness', { title: 'Deferred @csrf <i> check' }),
  ]
  let run = await go('posted text: the lines outside the block', { ...baseArgs, askRules: [{ id: 'billing', when: { prose: 'the change alters what a customer is charged' }, reason: 'Billing changes are reviewed by finance' }], decisions: { 'R1-1': { choice: 'Make the change by hand after the run', notes: 'The author makes it by hand.', date: '2026-11-13' } } }, { reviews: [outside, []], postDrop: ['R1-2'], defer: ['R1-3'], askRule: { 'R1-1': 'billing' }, mitigation: 'a <b> guard', commitIds: [['R1-3']], summary: ['Uses @param and <b>.', 'Line one with `<b>`\nline two'] })
  const r1 = review(run.calls, 'post r1')
  check('posted text: the finding line escapes its title and keeps its suffix', r1.body.includes('\n- **R1-1** · correctness · low · confirmed · `app/x.php:1` · ' + posted + ' · left to @author under rule billing\n'), r1.body)
  check('posted text: the inline comment\'s title line is escaped the same way', r1.comments.some((c) => c.body.includes('\n\n**' + posted + '**\n\n')), r1.comments.map((c) => c.body))
  check('posted text: an Already tracked line reads its title and knownAs as one text', r1.body.includes('### Already tracked\n\n- **R1-2** one ` open: #41 `&lt;c>`'), r1.body)
  check('posted text: the summary is escaped and neutralised', r1.body.includes('\n\nUses @' + WJ + 'param and &lt;b>.\n\n'), r1.body)
  check('posted text: a summary with a newline is escaped whole, its span included', review(run.calls, 'post r2').body.includes('\n\nLine one with `&lt;b>`\nline two\n\n'), review(run.calls, 'post r2').body)
  check('posted text: the closing sentence follows the last finding list, Already tracked, and ends the body', r1.body.endsWith('### Already tracked\n\n- **R1-2** one ` open: #41 `&lt;c>`\n\n' + CLOSING), r1.body)
  let handoff = comment(run.calls, 'handoff comment')
  check('posted text: the handoff\'s Deferred line escapes the title and posts the shaper\'s mitigation as written', handoff.includes('- **R1-3** Deferred @' + WJ + 'csrf &lt;i> check: shipped a <b> guard; open: a lock'), handoff)
  check('posted text: the hand-off line to the reviewer is written as before, a live mention', handoff.includes('\n\n@sam, over to you for the human review.\n\n'), handoff)

  // A decision line holds a finding's title and its owner: the title is neutralised, the person's
  // restatement and `decided by: @author` are posted as written.
  const asked = { reviews: [[f('R1-1', 'correctness', { title: 'Asked <s> & @param' })], []], ask: ['R1-1'], commitIds: [['R1-1']] }
  run = await go('posted text: a decision line', { ...baseArgs, decisions: { 'R1-1': { choice: 'Keep it', notes: 'The author keeps <s> as it is.', date: '2026-11-12' } } }, asked)
  handoff = comment(run.calls, 'handoff comment')
  check('posted text: a decision\'s line escapes the title and keeps the restatement and the owner as written', handoff.includes('### Put to @author (1)\n\n- **R1-1** Asked &lt;s> &amp; @' + WJ + 'param: The author keeps <s> as it is. Applied in 1bbbbbb. · decided by: @author'), handoff)

  // The round trip (#87, decision 7): a title prior-findings read back escaped is decoded at intake,
  // so the reviewer reads it as written and every line that posts it again escapes it once. R1-1
  // comes back as #87 posts it and the reviewer leaves it out, so the fallback carry copies it;
  // R1-2 is a title posted before #87, raw, which the reviewer carries and an issue tracks; R1-3 is
  // resolved; R1-4's old title holds a literal `&lt;`, which decodes to `<` (rider (a)) and posts
  // as the same bytes, beside its earlier reply, posted as written with its owner.
  const priors = [
    prior('R1-1', 'none', { comment_id: 11, title: posted, body: '**R1-1** · correctness · low · likely\n\n**' + posted + '**\n\nOld description.' }),
    prior('R1-2', 'none', { comment_id: 12, title: 'Old <b> & title' }),
    prior('R1-3', 'none', { comment_id: 13, title: 'Gone <i> @csrf' }),
    prior('R1-4', 'dropped', { comment_id: 14, title: 'Escape &lt; by hand', reply: { id: 254, body: 'not acted on in this run. Keep <b>. · decided by: @author' } }),
  ]
  run = await go('posted text: the round trip', { ...baseArgs, firstRound: 2, priorFindings: priors }, { reviews: [[f('R2-1', 'correctness', { carriedFrom: 'R1-2', title: 'Old <b> & title', knownAs: '#41 @param' })], []], resolved: [[{ id: 'R1-3', why: 'The <i> line @went away.' }]], postDrop: ['R2-1'], commitIds: [['R2-2']] })
  const rp = pick(run.calls, 'review r2').prompt
  check('posted text: the reviewer\'s carry list shows a read-back title decoded, the joiner\'s reference stripped', rp.includes('"title": "Binds @click to <b> & more"'), rp.slice(rp.indexOf('with no disposition')))
  check('posted text: a read-back literal &lt; reaches the reviewer as <', rp.includes('"title": "Escape < by hand"'), rp.slice(rp.indexOf('already handled')))
  const r2 = review(run.calls, 'post r2')
  check('posted text: the fallback carry posts the read-back title escaped once', r2.body.includes('\n- **R2-2** · correctness · low · unconfirmed · `app/x.php:1` · ' + posted + ' · first reported as R1-1\n  Would confirm it: '), r2.body)
  check('posted text: the fallback carry\'s inline comment title is escaped once', r2.comments.some((c) => c.body.startsWith('**R2-2** · ') && c.body.includes('\n\n**' + posted + '**\n\nFirst reported as R1-1')), r2.comments.map((c) => c.body))
  check('posted text: a carried title posted before #87 is escaped, beside its knownAs, read as one text', r2.body.includes('\n- **R2-1** Old &lt;b> &amp; title: #41 @' + WJ + 'param · first reported as R1-2'), r2.body)
  check('posted text: a Resolved line escapes the read-back title and the verifier\'s why as one text', r2.body.includes('### Resolved from earlier rounds\n\n- **R1-3** Gone &lt;i> @' + WJ + 'csrf: The &lt;i> line @' + WJ + 'went away.'), r2.body)
  check('posted text: with Carried forward, Resolved and Already tracked the closing sentence ends the body, after Already tracked', r2.body.endsWith('### Already tracked\n\n- **R2-1** Old &lt;b> &amp; title: #41 @' + WJ + 'param · first reported as R1-2\n\n' + CLOSING), r2.body)
  handoff = comment(run.calls, 'handoff comment')
  check('posted text: Earlier rounds escapes each read-back title once, with the knownAs and the why, and posts an earlier reply as written', handoff.includes('### Earlier rounds\n\n- **R1-1** ' + posted + ': carried forward as R2-2: fixed in ') && handoff.includes('\n- **R1-2** Old &lt;b> &amp; title: carried forward as R2-1: already tracked in #41 @' + WJ + 'param\n') && handoff.includes('\n- **R1-3** Gone &lt;i> @' + WJ + 'csrf: resolved: The &lt;i> line @' + WJ + 'went away. · decided by: redline\n') && handoff.includes('\n- **R1-4** Escape &lt; by hand: already handled in round 1: not acted on in this run. Keep <b>. · decided by: @author'), handoff)
  check('posted text: a carried finding\'s line under Fixed escapes its read-back title once', handoff.includes('<summary>Each in its own commit</summary>\n\n- **R2-2** ' + posted + ': fixed in '), handoff)
  // A `@&#8288;` readBack left in place has its `&` escaped when the title is posted again, so a
  // missing strip shows as `&amp;#8288;` beside the other double escapes. The raw joiner's clause,
  // dropped in #89, R1-1, could not fail; this one can (the #87 follow-up spec).
  check('posted text: nothing read back is escaped twice', ![r2.body, ...r2.comments.map((c) => c.body), handoff].some((t) => t.includes('&amp;lt;') || t.includes('&amp;amp;') || t.includes('&amp;#8288;')), [r2.body, handoff])

  // The round trip once per way the reading can go wrong: each title as the workflow posts it, read
  // back, decoded and posted again on a Resolved line, comes out byte for byte the same.
  const modes = [
    'a bare &lt;/details> ends the block and `<Head title="x" />` in a span is text',
    'one ` left open &lt;c>',
    'a span `a && b <c>` keeps its ampersands &amp; this one does not',
    'binds @' + WJ + 'click, `@click` in a span, @' + WJ + '123 and a@' + WJ + 'b.co',
    'two\nlines with `&lt;b>`',
    'an escaped \\` then &lt;i>`',
    'see [a](/u "`") &lt;/details> ` end',
    'see [a][q`] &lt;i>x&lt;/i> `c`',
    'see http://x.com/a`b &lt;i>x&lt;/i> `c`',
    'first\r&lt;/details> and @' + WJ + 'param',
    'a typed @&amp;#8288;x stays as typed',
    'App\\Models\\User::save drops `<x-slot>` and `@csrf` when `$a && $b`, beside a \\&lt;b> and \\&amp; c',
  ]
  run = await go('posted text: the round trip per mode', { ...baseArgs, firstRound: 2, priorFindings: modes.map((title, i) => prior(`R1-${i + 1}`, 'none', { title })) }, { reviews: [[]], resolved: [modes.map((_, i) => ({ id: `R1-${i + 1}`, why: 'because' }))] })
  const back = review(run.calls, 'post r2').body
  modes.forEach((title, i) => check(`posted text: round trip ${i + 1}, a posted title read back and posted again is unchanged`, back.includes(`- **R1-${i + 1}** ${title}: because`), [title, back]))
  // readBack strips the workflow's reference before it decodes `&amp;`, so a `@&#8288;` the finder
  // typed reaches the reviewer as typed, never as a bare `@` (the #87 follow-up spec, Evidence).
  const modesPrompt = pick(run.calls, 'review r2').prompt
  check('posted text: a typed @&#8288; reads back as typed, so the decode order is the inverse of the escape order', modesPrompt.includes('"title": "a typed @&#8288;x stays as typed"'), modesPrompt.slice(modesPrompt.indexOf('with no disposition')))

  // The agent files whose text is posted in a comment or a reply carry the backtick sentence,
  // word for word (#87, answer 13); the round prompts do not change.
  for (const name of ['redline-reviewer', 'redline-shaper', 'redline-resolve', 'redline-implementer']) {
    const text = fs.readFileSync(path.join(here, '..', 'agents', `${name}.md`), 'utf8')
    check(`posted text: agents/${name}.md asks for an @ identifier in backticks`, text.includes('An identifier that begins with `@` (a decorator, a directive, a docblock tag) is always written in backticks, because a bare `@word` notifies a GitHub account.'), `agents/${name}.md`)
  }
}

// ---------------------------------------------------------------------------
// 17. The script a relaunch runs, and the Finish rule (#81). When Redline reviews its own
//     repository, a round can commit a change to the workflow file, and a relaunch that ran the
//     edited script replayed nothing after the first changed prompt (PR #80). The skill now
//     relaunches the launch's script; what reaches the workflow is args.drift, read only at
//     startup (the refusal) and at Finish (the handoff sentence), and Finish opens by reading the
//     highest posted round, so a run can never finish from a re-run earlier round.
// ---------------------------------------------------------------------------
{
  const scenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-2'], commitIds: [['R1-1', 'R1-2']] }
  const decided = { ...baseArgs, decisions: { 'R1-2': { choice: 'Keep it', notes: 'Kept.', date: '2026-11-12' } } }
  const first = await go('pin: hand-off', baseArgs, scenario)
  check('pin: the launch stops at the hand-off', first.res.status === 'handoff', first.res.status)

  // A relaunch with a changed workflow file: one sentence of the review prompt edited, as a
  // round's own commit would. The edit must land, or the check below proves nothing.
  const needle = 'Operation: gather (round ${round}).'
  const edited = body.replace(needle, 'Operation: gather for round ${round}.')
  check('pin: the edited script differs from the launch\'s', body.includes(needle) && edited !== body)
  const drifted = await go('pin: relaunch with the edited script', decided, scenario, edited)
  const same = (a, b) => a && b && a.label === b.label && a.prompt === b.prompt && JSON.stringify(a.opts) === JSON.stringify(b.opts)
  const firstDiff = first.calls.findIndex((c, i) => !same(c, drifted.calls[i]))
  check('pin: the edited script changes a prompt before the stopping point, so the harness would rerun from it', firstDiff === 0 && first.calls[0].label === 'gather r1', [firstDiff, labels(drifted.calls).slice(0, 5)])
  // The pinned relaunch: the launch's script, whatever the live file now holds.
  const pinned = await go('pin: relaunch with the launch\'s script', decided, scenario, body)
  samePrefix('pin', first.calls, pinned.calls, first.calls.length)
  check('pin: the pinned relaunch finishes', pinned.res.status === 'done', [pinned.res.status, pinned.res.error])

  // The scriptPath fallback: a launch that ran the live file has no pinned copy, so a relaunch
  // after the file changed is refused before any agent runs, with a message naming the file.
  const refused = await go('pin: no pinned copy and a changed workflow file', { ...decided, drift: { workflow: 'workflows/redline-loop.js', pinned: false, agents: [] } }, scenario)
  check('pin: the relaunch is refused at stage relaunch', refused.res.status === 'error' && refused.res.stage === 'relaunch', [refused.res.status, refused.res.stage])
  check('pin: the refusal names the file and says to finish with a fresh run', refused.res.error === 'workflows/redline-loop.js changed since this run launched, and the launch ran from the file itself, so no pinned copy exists; a relaunch would rerun recorded rounds under the edited script. Finish with a fresh run: /redline:redline 114', refused.res.error)
  check('pin: no agent runs and the stop cannot be resumed', refused.calls.length === 0 && refused.res.resumeFrom === null, [labels(refused.calls), refused.res.resumeFrom])
  // With a pinned copy the same change is not refused: the skill relaunched from the copy.
  const kept = await go('pin: a pinned copy and a changed workflow file', { ...decided, drift: { workflow: 'workflows/redline-loop.js', pinned: true, agents: [] } }, scenario)
  check('pin: a changed workflow with a pinned copy runs on', kept.res.status === 'done', [kept.res.status, kept.res.error])
  check('pin: and every prompt equals the relaunch without drift', kept.calls.length === pinned.calls.length && kept.calls.every((c, i) => same(c, pinned.calls[i])), labels(kept.calls))

  // Agent files cannot be pinned, so a changed one is reported: a warning in the result, which the
  // skill shows while rounds are still ahead, and the same fact in the handoff comment, in the past
  // tense, since the comment is posted after the last round (#93). Nothing before Finish reads it.
  const sentence = 'Agent files changed since this run launched (`agents/redline-reviewer.md`, `agents/redline-shaper.md`): this run\'s remaining rounds may run under them, while the workflow\'s own prompts are the launch\'s.'
  const past = 'Agent files changed during this run (`agents/redline-reviewer.md`, `agents/redline-shaper.md`): the rounds after the change may have run under them, while the workflow\'s own prompts were the launch\'s.'
  const agents = await go('pin: changed agent files', { ...decided, drift: { workflow: '', pinned: true, agents: ['agents/redline-reviewer.md', 'agents/redline-shaper.md'] } }, scenario)
  check('pin: changed agent files do not stop the run', agents.res.status === 'done', [agents.res.status, agents.res.error])
  check('pin: the result warns with the sentence', agents.res.warnings.includes(sentence), agents.res.warnings)
  const withSentence = comment(agents.calls, 'handoff comment')
  const without = comment(pinned.calls, 'handoff comment')
  check('pin: the handoff comment says the same in the past tense, as its own paragraph, and never as a forecast', withSentence.includes(`\n\n${past}\n\n`) && !withSentence.includes('remaining rounds may run'), withSentence.slice(0, 600))
  check('pin: and is otherwise the handoff comment of a run without drift', withSentence.replace(`${past}\n\n`, '') === without, withSentence.slice(0, 600))
  const beforeFinish = agents.calls.findIndex((c) => c.label === 'handoff comment')
  check('pin: every prompt before the handoff comment equals the run without drift', beforeFinish > 0 && agents.calls.slice(0, beforeFinish).every((c, i) => same(c, pinned.calls[i])), labels(agents.calls))
  const empty = await go('pin: drift with nothing in it', { ...decided, drift: { workflow: '', pinned: true, agents: [] } }, scenario)
  check('pin: an empty drift leaves every prompt and the warnings as they were', empty.calls.length === pinned.calls.length && empty.calls.every((c, i) => same(c, pinned.calls[i])) && JSON.stringify(empty.res.warnings) === JSON.stringify(pinned.res.warnings), empty.res.warnings)
  // A resume after the handoff comment posted (#91, R1-1). The comment is the one prompt that names
  // the agent list, and a resume at the record commit (a rejected push) or at the comment itself (a
  // review request that failed) reruns Finish from there, so run drift passes the list the marker's
  // args held. With it every prompt through the comment is the first attempt's and replays, or the
  // resumed comment's duplicate check finds the posted one; with the list read afresh the comment
  // is the first prompt to change, so it would be posted again.
  const heldDrift = { workflow: '', pinned: true, agents: ['agents/redline-reviewer.md'] }
  const freshDrift = { workflow: '', pinned: true, agents: ['agents/redline-reviewer.md', 'agents/redline-shaper.md'] }
  const pushFail = await go('pin: the record commit fails after the handoff comment posted', { ...decided, drift: heldDrift }, { ...scenario, recordError: 'push rejected: fetch first' })
  check('pin: the record commit error is resumable at the record commit', pushFail.res.status === 'error' && JSON.stringify(pushFail.res.resumeFrom) === JSON.stringify({ label: 'record commit', attempt: 2 }), [pushFail.res.status, pushFail.res.resumeFrom])
  const atRecord = { 'record commit': { attempt: 2, error: pushFail.res.error, hand: { commits: [], paths: [] } } }
  const throughComment = (calls) => calls.slice(0, calls.findIndex((c) => c.label === 'handoff comment') + 1)
  const heldResume = await go('pin: the record commit resume with the marker\'s agent list', { ...decided, drift: heldDrift, resume: atRecord }, scenario)
  check('pin: with the marker\'s agent list every prompt through the handoff comment replays', throughComment(pushFail.calls).length > 1 && throughComment(pushFail.calls).every((c, i) => same(c, heldResume.calls[i])), labels(heldResume.calls))
  const freshResume = await go('pin: the record commit resume with the agent list read afresh', { ...decided, drift: freshDrift, resume: atRecord }, scenario)
  const firstChanged = pushFail.calls.findIndex((c, i) => !same(c, freshResume.calls[i]))
  check('pin: with the agent list read afresh the handoff comment is the first prompt to change', firstChanged > 0 && pushFail.calls[firstChanged].label === 'handoff comment', [firstChanged, labels(freshResume.calls)])
  const requestFail = await go('pin: the review request fails after the handoff comment posted', { ...decided, drift: heldDrift }, { ...scenario, finishError: 'could not request a review from sam' })
  const atComment = { 'handoff comment': { attempt: 2, error: requestFail.res.error, hand: { commits: [], paths: [] } } }
  const commentResume = await go('pin: the handoff comment resume with the marker\'s agent list', { ...decided, drift: heldDrift, resume: atComment }, { ...scenario, finishUrl: '' })
  check('pin: with the marker\'s agent list the resumed comment is the posted one byte for byte, so its duplicate check can find it', comment(requestFail.calls, 'handoff comment').includes('`agents/redline-reviewer.md`') && comment(commentResume.calls, 'handoff comment') === comment(requestFail.calls, 'handoff comment'), comment(commentResume.calls, 'handoff comment').slice(0, 600))
  for (const bad of ['yes', [], { workflow: 1, pinned: true, agents: [] }, { workflow: '', pinned: 'no', agents: [] }, { workflow: '', pinned: true, agents: [''] }, { workflow: '', pinned: true }]) {
    const run = await go('pin: malformed drift', { ...decided, drift: bad }, scenario)
    check(`pin: args.drift ${JSON.stringify(bad)} fails at startup`, run.thrown !== null && run.thrown.message.includes('args.drift') && run.calls.length === 0, run.thrown && run.thrown.message)
  }

  // The Finish rule: the round that ends a run is the highest one posted on the PR.
  const finishLabels = (calls) => labels(calls).slice(labels(calls).indexOf('last round'))
  check('finish: a normal finish reads the highest posted round first and goes on', finishLabels(pinned.calls).join('|') === 'last round|PR description|resolve threads|handoff comment|record files|record commit', finishLabels(pinned.calls))
  const lastRound = pick(pinned.calls, 'last round')
  check('finish: the read is the GitHub agent\'s, one read-only script call', lastRound.agentType === 'redline:redline-github' && lastRound.prompt.includes('Run `/p/scripts/redline-gh.sh last-round 114` once and nothing else') && lastRound.prompt.includes('Operation: last-round.'), lastRound.prompt)
  check('finish: it is the only last-round read of the run, after the last round\'s replies', labels(pinned.calls).filter((l) => l === 'last round').length === 1 && labels(pinned.calls).indexOf('last round') > labels(pinned.calls).lastIndexOf('gather r2'), labels(pinned.calls))
  const dry = await go('finish: dry run', { ...baseArgs, postToGitHub: false }, { reviews: [[f('R1-1', 'nit')], []], commitIds: [['R1-1']] })
  check('finish: a dry run posted nothing, so the read finds a lower round and the run goes on', dry.res.status === 'done' && finishLabels(dry.calls).join('|') === 'last round|handoff comment|record files|record commit', [dry.res.status, finishLabels(dry.calls)])
  // A re-run earlier round: rounds 2 and 3 are on the PR, and a re-run round 1 comes back clean,
  // which is how PR #80's third relaunch posted a false handoff.
  const rerun = await go('finish: from a re-run earlier round', baseArgs, { reviews: [[]], lastPosted: 3 })
  check('finish: the run stops with an error at Finish', rerun.res.status === 'error' && rerun.res.stage === 'finish', [rerun.res.status, rerun.res.stage])
  check('finish: the error names the round, the highest posted round and the fresh run', rerun.res.error === 'the run was finishing from round 1, but the highest Redline round posted on PR #114 is 3, so round 1 is a re-run of an earlier round; nothing was posted after this check. Start a fresh run: /redline:redline 114', rerun.res.error)
  check('finish: nothing follows the read: no PR description, no sweep, no handoff comment, no review request, no record commit', labels(rerun.calls).slice(-1)[0] === 'last round' && !labels(rerun.calls).some((l) => ['PR description', 'resolve threads', 'handoff comment', 'record files', 'record commit'].includes(l)) && !('reviewRequested' in rerun.res), labels(rerun.calls))
  check('finish: the stop cannot be resumed', rerun.res.resumeFrom === null, rerun.res.resumeFrom)
  // The cap-hit comment is a Finish too.
  const capped = await go('finish: the cap from a re-run earlier round', { ...baseArgs, maxRounds: 1 }, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')]], commitIds: [['R1-1']], lastPosted: 5 })
  check('finish: a capped run from a lower round stops before the cap-hit comment', capped.res.status === 'error' && capped.res.stage === 'finish' && !labels(capped.calls).includes('cap-hit comment'), [capped.res.status, labels(capped.calls)])
  // A read that failed is an error at its own label, which a resume reruns.
  const unread = await go('finish: the read fails', baseArgs, { reviews: [[]], lastRoundError: 'gh: not logged in' })
  check('finish: a failed read stops the run at the read, resumable there', unread.res.status === 'error' && unread.res.stage === 'finish' && unread.res.resumeFrom && unread.res.resumeFrom.label === 'last round' && unread.res.error.includes('gh: not logged in') && labels(unread.calls).slice(-1)[0] === 'last round', [unread.res.error, unread.res.resumeFrom])
}

// ---------------------------------------------------------------------------
// 18. The shaper decides (#93): a decline is a disposition of its own, with a reason, a reply and
//     a settled thread and no commit; a decline without a reason, and an ask outside the cases,
//     stop at shape; a human review pass still refuses both a decline and nothing else it took
//     before; a finding a repository ask rule covers is put to the person even when the shaper
//     would decline it; the plan dial shows a decline and can overrule it; an earlier run's
//     decline is handled, never carried.
// ---------------------------------------------------------------------------
{
  const shaperAgent = fs.readFileSync(path.join(here, '..', 'agents', 'redline-shaper.md'), 'utf8')
  const template = fs.readFileSync(path.join(here, '..', 'templates', 'shape-spec-unattended.md'), 'utf8')
  const section = fs.readFileSync(path.join(here, '..', '.claude', 'commands', 'agent-os', 'shape-spec.md'), 'utf8')
  const why = 'the pull request\'s spec keeps the name on purpose (decision 4 in its shape.md)'
  const scenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit'), f('R1-3', 'nit')], []], decline: ['R1-2', 'R1-3'], reason: { 'R1-2': why }, commitIds: [['R1-1']] }
  let run = await go('decline: the shaper declines two on its own', baseArgs, scenario)
  check('decline: a decline never stops a guided run, and nothing is resolved by a person', run.res.status === 'done' && !labels(run.calls).some((l) => l.startsWith('resolve r')), [run.res.status, labels(run.calls)])
  check('decline: the reply gives the reason and the owner', replyFor(run.calls, 'push and reply r1', 'R1-2') === `Redline round 1: declined: ${why} · decided by: redline`, replyFor(run.calls, 'push and reply r1', 'R1-2'))
  check('decline: the round records it as declined, and the fix beside it as fixed', run.res.rounds[0].outcomes['R1-2'] === `declined: ${why} · decided by: redline` && run.res.rounds[0].outcomes['R1-1'].startsWith('fixed in 1bbbbbb'), run.res.rounds[0].outcomes)
  check('decline: the next review sees it as an outcome', pick(run.calls, 're-review r2').prompt.includes(`"outcome": "declined: ${why} · decided by: redline"`), pick(run.calls, 're-review r2').prompt.slice(0, 2500))
  check('decline: the handoff carries its line with the reason and the owner', comment(run.calls, 'handoff comment').includes(`**R1-2** title R1-2: declined: ${why} · decided by: redline`), comment(run.calls, 'handoff comment'))
  const sweep = pick(run.calls, 'resolve threads').prompt
  check('decline: a declined thread is settled and swept with the fixed one', sweep.includes('- R1-1 (round 1): comments 100, ') && sweep.includes('- R1-2 (round 1): comments 101, ') && sweep.includes('- R1-3 (round 1): comments 102, ') && comment(run.calls, 'handoff comment').includes('Resolved 3 threads; 0 left open.'), sweep)
  const shape = pick(run.calls, 'shape r1').prompt
  check('decline: the shape prompt names the four dispositions and the ask cases, and no longer returns every judgment call', shape.includes('Sort each finding into fix, decline, defer or ask') && shape.includes('the person is asked in five cases only') && shape.includes('never a degree of confidence') && shape.includes('serious if it were true') && !shape.includes('Judgment calls are returned, never decided'), shape.slice(-2600))
  const planPrompt = pick(run.calls, 'plan approver r1').prompt
  check('decline: the plan approver sees the decline with its reason and is told it has no task', planPrompt.includes('"disposition": "decline"') && planPrompt.includes(`"reason": "${why.replace(/'/g, "'")}"`) && planPrompt.includes('A declined finding has no task') && !planPrompt.includes('Judgment calls are returned, never decided'), planPrompt.slice(-1600))
  check('decline: the implementer is told a declined finding has no task', pick(run.calls, 'implement r1').prompt.includes('a declined finding has no task') && pick(run.calls, 'implement r1').prompt.includes('A decision that is still pending is the person\'s'), pick(run.calls, 'implement r1').prompt.slice(0, 1800))
  for (const phrase of ['asked in five cases only', 'never a degree of confidence', 'could not confirm: needs', 'serious if it were true', 'one idea, smaller than the pull request', 'records as deliberate']) {
    check(`decline: the shaper's file, the template and this repository's section all say "${phrase}"`, shaperAgent.includes(phrase) && template.includes(phrase) && section.includes(phrase), [shaperAgent.includes(phrase), template.includes(phrase), section.includes(phrase)])
  }

  run = await go('decline: no reason', baseArgs, { ...scenario, declineNoReason: ['R1-3'] })
  check('decline: a decline with no reason stops at shape, resumable at the shaper', run.res.status === 'error' && run.res.stage === 'shape' && run.res.error === 'the shaper declined R1-3 with no reason; a decline carries the reason a teammate reads in the thread' && run.res.resumeFrom && run.res.resumeFrom.label === 'shape r1', [run.res.status, run.res.error, run.res.resumeFrom])

  const asked = { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], commitIds: [['R1-1']] }
  run = await go('ask: outside the cases', baseArgs, { ...asked, whyHuman: { 'R1-1': 'unsure' } })
  check('ask: a reason that is not one of the cases stops at shape, and the person is not asked', run.res.status === 'error' && run.res.stage === 'shape' && run.res.error === 'the shaper asked about R1-1 because of "unsure", which is not one of the cases the person is asked in on a Redline round (product decision, spec assumption, outside the pull request, no clear pick, unconfirmed, serious if true, redline\'s own file, or a repository rule)' && (run.res.judgmentCalls || []).length === 0, [run.res.status, run.res.error])
  for (const reason of ['product decision', 'spec assumption', 'outside the pull request', 'no clear pick', 'unconfirmed, serious if true', 'redline\'s own file']) {
    run = await go(`ask: ${reason}`, baseArgs, { ...asked, whyHuman: { 'R1-1': reason } })
    check(`ask: "${reason}" is a reason the person is asked for, and the run stops for them`, run.res.status === 'handoff' && run.res.handoffKind === 'decisions' && run.res.judgmentCalls[0].why_human === reason, [run.res.status, run.res.error])
  }

  // A human review pass is unchanged: it keeps its own reasons and its own wording, and it gains
  // no decline.
  const h = (id, extra) => ({ id, file: 'app/x.php', line: 1, side: 'RIGHT', category: 'human', severity: 'medium', confidence: 'confirmed', title: `comment ${id}`, description: `Please change ${id}.`, proposedFix: '', needsDecision: false, knownAs: '', source: '@marcamos', commentId: 900, threadId: 900, reviewId: 7, ...extra })
  const humanArgs = (findings) => ({ ...baseArgs, firstRound: 3, revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: '', specFolder: 'agent-os/specs/2026-10-20-1600-114-human-review-1', findings, commentIds: Object.fromEntries(findings.map((x) => [x.id, x.threadId])), posted: true } })
  run = await go('human: the shaper declines', humanArgs([h('H1-1')]), { reviews: [], decline: ['H1-1'], commitIds: [[]] })
  check('human: a decline stops the pass at shape', run.res.status === 'error' && run.res.stage === 'shape' && run.res.error.includes('the shaper declined H1-1') && run.res.error.includes('never a decline of Redline\'s own') && labels(run.calls).join('|') === 'shape h1', [run.res.status, run.res.error, labels(run.calls)])
  run = await go('human: an ask for a reason of its own', humanArgs([h('H1-1')]), { reviews: [], ask: ['H1-1'], whyHuman: { 'H1-1': 'unsure' }, commitIds: [[]] })
  check('human: a human pass still asks for its own reasons, in its own words', run.res.status === 'handoff' && run.res.judgmentCalls[0].why_human === 'unsure' && pick(run.calls, 'shape h1').prompt.includes('Judgment calls are returned, never decided') && pick(run.calls, 'shape h1').prompt.includes('Sort each finding into fix, ask or none; never defer'), [run.res.status, run.res.error])

  // A repository ask rule still wins: the person is brought in even for what the shaper would decline.
  const rules = [{ id: 'craft-config', when: { paths: ['config/project/**'] }, reason: 'Craft project config is applied through the control panel' }]
  const ruled = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness', { file: 'config/project/project.yaml', line: 3 })], []], decline: ['R1-2'], reason: { 'R1-2': 'the handle is renamed on purpose' }, commitIds: [['R1-1']] }
  run = await go('decline: under a repository rule', { ...baseArgs, askRules: rules }, ruled)
  check('decline: a rule-covered decline is still put to the person, with a warning', run.res.status === 'handoff' && JSON.stringify(run.res.decisionsNeeded) === '["R1-2"]' && run.res.warnings.includes('round 1: the shaper sorted R1-2 as decline; repository rule craft-config makes it an ask for the person'), [run.res.status, run.res.warnings])
  check('decline: its call says what Redline would have done and recommends no change', run.res.judgmentCalls[0].why_human === 'repository rule craft-config' && run.res.judgmentCalls[0].recommendation === 'Accept, no change: the handle is renamed on purpose.' && run.res.judgmentCalls[0].options[0].effect === 'Redline would have declined it: the handle is renamed on purpose.', run.res.judgmentCalls[0])

  // Autopilot never stops: the ask is taken, the decline is Redline's own and stays so.
  const mixed = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit'), f('R1-3', 'correctness')], []], decline: ['R1-2'], ask: ['R1-3'], commitIds: [['R1-1', 'R1-3']] }
  run = await go('decline: autopilot', { ...baseArgs, interrupt: 'autopilot' }, mixed)
  check('decline: autopilot goes through, and the decline is redline\'s, not the autopilot\'s', run.res.status === 'done' && replyFor(run.calls, 'push and reply r1', 'R1-2').endsWith(' · decided by: redline') && replyFor(run.calls, 'push and reply r1', 'R1-3').endsWith(' · decided by: redline (autopilot)'), [run.res.status, replyFor(run.calls, 'push and reply r1', 'R1-2')])

  // The plan dial shows a decline with its reason, and the person can overrule it there.
  const two = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], []], decline: ['R1-2'], commitIds: [['R1-1', 'R1-2']] }
  const planArgs = { ...baseArgs, interrupt: 'plan' }
  const first = await go('decline: the plan dial shows it', planArgs, two)
  check('decline: the plan list carries the decline, its reason and its owner', first.res.status === 'handoff' && first.res.handoffKind === 'plan' && first.res.plan[1].disposition === 'decline' && first.res.plan[1].reason === 'the spec keeps R1-2 as it is on purpose' && first.res.plan[1].decidedBy === 'redline', first.res.plan)
  const overruled = { ...planArgs, approvedPlans: [1], decisions: { 'R1-2': { choice: 'fix', notes: 'The author wants the rename now, since a third caller lands next week.', date: '2026-11-13', disposition: 'fix' } } }
  const second = await go('decline: overruled on the plan dial', overruled, two)
  samePrefix('decline plan', first.calls, second.calls, 5)
  const resolve = pick(second.calls, 'resolve r1').prompt
  check('decline: the resolve agent gets the override and is told a decline can be changed', second.res.status === 'done' && resolve.includes('Disposition overrides') && resolve.includes('"disposition": "fix"') && resolve.includes('a finding the shaper declined') && resolve.includes('A decision that is still pending is the person\'s'), [second.res.status, resolve.slice(-1500)])
  check('decline: an overruled decline is fixed, decided by the person', replyFor(second.calls, 'push and reply r1', 'R1-2') === 'Redline round 1: The author wants the rename now, since a third caller lands next week. Applied in 2bbbbbb (redline: R1-2 fix). · decided by: @author', replyFor(second.calls, 'push and reply r1', 'R1-2'))

  // An earlier run's decline is a disposition: handled, never carried into the new run.
  const priors = [prior('R1-1', 'declined', { comment_id: 11, reply: { id: 250, body: 'declined: the spec keeps it on purpose · decided by: redline' } })]
  run = await go('decline: an earlier run declined one', { ...baseArgs, firstRound: 2, priorFindings: priors }, { reviews: [[]] })
  const rp = run.calls.length ? pick(run.calls, 'review r2').prompt : ''
  check('decline: an earlier decline is in the handled list with its reply, and nothing is carried', !run.thrown && run.res.status === 'done' && rp.includes('"disposition": "declined"') && rp.includes('"reply": "declined: the spec keeps it on purpose · decided by: redline"') && !rp.includes('with no disposition'), [run.thrown && run.thrown.message, rp.slice(0, 200)])
  check('decline: the handoff says what the earlier round did with it', !run.thrown && comment(run.calls, 'handoff comment').includes('already handled in round 1: declined: the spec keeps it on purpose · decided by: redline'), run.thrown ? run.thrown.message : comment(run.calls, 'handoff comment'))
  // A carried finding the new round declines: the earlier thread hears the decline and is swept
  // with the new one, as a carried finding that was fixed is (the second place the settled kinds
  // are read).
  run = await go('decline: a carried finding is declined', { ...baseArgs, firstRound: 2, priorFindings: [prior('R1-2', 'none', { comment_id: 12 })] }, { reviews: [[f('R2-1', 'nit', { carriedFrom: 'R1-2' })], []], decline: ['R2-1'], commitIds: [[]] })
  const carriedSweep = labels(run.calls).includes('resolve threads') ? pick(run.calls, 'resolve threads').prompt : ''
  check('decline: the earlier thread of a carried, declined finding hears it and is swept', run.res.status === 'done' && replyFor(run.calls, 'push and reply r2', 'R1-2') === 'Redline round 2: carried forward as R2-1; declined: the spec keeps R2-1 as it is on purpose · decided by: redline' && carriedSweep.includes('- R1-2 (round 1): comments 12, ') && carriedSweep.includes('- R2-1 (round 2): comments 100, ') && comment(run.calls, 'handoff comment').includes('Resolved 2 threads; 0 left open.'), [run.res.status, carriedSweep.slice(carriedSweep.indexOf('These findings')), comment(run.calls, 'handoff comment').slice(0, 300)])
}

// ---------------------------------------------------------------------------
// 19. The done rule (#93): a round is bought by what it finds, not by what it commits. A new
//     correctness item the shaper fixes or puts to the person buys the next round, whatever the
//     answer and with or without a commit; a round whose items are all nits, or all declined by
//     the shaper on its own, ends: at the handoff when no fix was committed, after one final nit
//     pass over the fixes when one was. The cap is as it was. With the coverage pass off there
//     is no pass to rerun, so a bought round that changed no code ends the run. No wording says
//     an item was fixed when it was declined.
// ---------------------------------------------------------------------------
{
  const covArgs = { ...baseArgs, models: { ...baseArgs.models, coverage: { model: 'm-cov', effort: 'xhigh' } } }
  const one = 'Reviewed.\n\n```json\n' + JSON.stringify([{ file: 'app/x.php', line: 3, summary: 'the real one', failure_scenario: 'f' }]) + '\n```\n'
  const acct = (ref, outcome = 'verified') => [{ index: 1, outcome, ref }]
  const promptOf = (calls, label) => (pick(calls, label) || { prompt: '' }).prompt
  const body = (calls, label) => {
    const p = promptOf(calls, label)
    if (!p.includes('{\n  "body"')) {
      return ''
    }
    return JSON.parse(p.slice(p.indexOf('{\n  "body"'), p.indexOf('\n}\n', p.indexOf('{\n  "body"')) + 2)).body
  }
  const keep = { 'R1-1': { choice: 'Accept', notes: 'The author accepts it as it is.', date: '2026-11-13' } }

  // A correctness fix buys a round, and the run ends when the next round verifies nothing new.
  let run = await go('done: a correctness fix buys a round', covArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']], coverage: [one, one], coverageOut: [acct('R1-1'), acct('R1-1', 'settled')] })
  check('done: a correctness fix buys the next round, and a round that verifies nothing new ends the run', run.res.status === 'done' && run.res.rounds.length === 2 && labels(run.calls).join('|').includes('|gather r2|coverage r2|re-review r2|post r2|') && comment(run.calls, 'handoff comment').includes('Redline ran 2 review rounds; the last one verified no new correctness item to fix or ask about.\n'), [run.res.status, labels(run.calls)])

  // An ask the person answers with no change buys a round too: no commit, so the next round has no
  // fix diff to recheck, and it runs the coverage pass and verify at the same head.
  const asked = { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], acceptedCalls: ['R1-1'], commitIds: [[]], coverage: [one, one], coverageOut: [acct('R1-1'), acct('R1-1', 'settled')] }
  const stop = await go('done: an ask stops a guided run', covArgs, asked)
  run = await go('done: an ask answered with no change', { ...covArgs, decisions: keep }, asked)
  samePrefix('done: the relaunch replays every prompt before the stop', stop.calls, run.calls, stop.calls.length)
  check('done: an ask answered with no change, and no commit, still buys the next round', run.res.status === 'done' && run.res.rounds.length === 2 && replyFor(run.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: The author accepts it as it is. No code change. · decided by: @author' && labels(run.calls).join('|').includes('|gather r2|coverage r2|re-review r2|post r2|'), [run.res.status, labels(run.calls)])
  const noDiff = promptOf(run.calls, 're-review r2')
  check('done: the round after a round that changed no code is told there is no fix diff, and still verifies the candidates', noDiff.includes('- The diff to review: none: round 1 changed no code, so there is no fix diff to recheck') && noDiff.includes('after round 1, which changed no code (HEAD ' + 'a'.repeat(40) + ')') && noDiff.includes('There is no fix diff to recheck this round.') && !noDiff.includes('only the fix diff') && !noDiff.includes('Your recheck of the fix diff named above') && noDiff.includes('Candidates from the coverage pass.'), noDiff.slice(0, 1500))
  check('done: its coverage pass runs at the same head, and its review body says what was reviewed', promptOf(run.calls, 'coverage r2').includes('at ' + 'a'.repeat(40)) && body(run.calls, 'post r2').startsWith('Redline round 2\n\nRound 1 changed no code; reviewed the coverage pass\'s candidates over the whole pull request at aaaaaaa.\n') && run.res.rounds.length === 2 && run.res.rounds[1].range.empty === true, [body(run.calls, 'post r2').slice(0, 300), run.res.rounds.length])

  // An asked nit buys nothing: only a correctness item does.
  run = await go('done: an asked nit buys nothing', { ...covArgs, decisions: keep }, { reviews: [[f('R1-1', 'nit')]], ask: ['R1-1'], acceptedCalls: ['R1-1'], commitIds: [[]], coverage: [one], coverageOut: [acct('R1-1')] })
  check('done: an asked nit, answered with no change, buys no round', run.res.status === 'done' && run.res.rounds.length === 1 && !labels(run.calls).includes('coverage r2') && run.res.note === 'The last revise pass made no commits, so there was no fix diff to re-review.', [run.res.status, labels(run.calls), run.res.note])

  // Everything declined by the shaper on its own: no commit, no final nit pass, the handoff.
  run = await go('done: all declined', covArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')]], decline: ['R1-1', 'R1-2'], commitIds: [[]], coverage: [one], coverageOut: [acct('R1-1')] })
  check('done: a round whose items are all declined ends at the handoff, with no further pass of any kind', run.res.status === 'done' && run.res.rounds.length === 1 && !labels(run.calls).some((l) => l.startsWith('coverage r2') || l.startsWith('final nit pass')) && comment(run.calls, 'handoff comment').includes('Redline ran 1 review round; the last one verified no new correctness item to fix or ask about.\n'), [run.res.status, labels(run.calls)])

  // A declined correctness item beside a fixed nit: the fix gets the final nit pass, not a full round.
  run = await go('done: a declined correctness item beside a fixed nit', covArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], []], decline: ['R1-1'], commitIds: [['R1-2']], coverage: [one, one], coverageOut: [acct('R1-1')] })
  check('done: a declined correctness item buys nothing, so a nit fix beside it goes to the final nit pass', run.res.status === 'done' && run.res.rounds.length === 2 && labels(run.calls).includes('final nit pass r2') && !labels(run.calls).includes('coverage r2') && !labels(run.calls).includes('re-review r2'), labels(run.calls))

  // A decline the person overrules to a fix buys a round, as a fix of the shaper's own does.
  run = await go('done: an overruled decline', { ...covArgs, interrupt: 'plan', approvedPlans: [1], decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it now.', date: '2026-11-13', disposition: 'fix' } } }, { reviews: [[f('R1-1', 'correctness')], []], decline: ['R1-1'], commitIds: [['R1-1']], coverage: [one, one], coverageOut: [acct('R1-1'), acct('R1-1', 'settled')] })
  check('done: a decline the person overrules to a fix buys the next round', run.res.status === 'done' && run.res.rounds.length === 2 && labels(run.calls).includes('coverage r2') && labels(run.calls).includes('re-review r2'), [run.res.status, labels(run.calls)])

  // A finding left to the person under a repository rule is put to the person, so it buys a round
  // with no commit, on guided and on autopilot alike.
  const rules = [{ id: 'craft-config', when: { paths: ['config/project/**'] }, reason: 'Craft project config is applied through the control panel' }]
  const ruled = { reviews: [[f('R1-1', 'correctness', { file: 'config/project/project.yaml', line: 3 })], []], commitIds: [[]], coverage: [one, one], coverageOut: [acct('R1-1'), acct('R1-1', 'settled')] }
  run = await go('done: left to the person on autopilot', { ...covArgs, askRules: rules, interrupt: 'autopilot' }, ruled)
  check('done: a correctness item left to the person under a rule buys the next round, and autopilot never stops', run.res.status === 'done' && run.res.rounds.length === 2 && labels(run.calls).includes('coverage r2') && promptOf(run.calls, 're-review r2').includes('round 1 changed no code'), [run.res.status, labels(run.calls)])

  // With the coverage pass off there is no pass to rerun: a bought round that changed no code ends.
  run = await go('done: coverage off, a bought round with no fix', { ...baseArgs, decisions: keep }, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'], acceptedCalls: ['R1-1'], commitIds: [[]] })
  check('done: with the coverage pass off, a bought round that changed no code ends the run and says why', run.res.status === 'done' && run.res.rounds.length === 1 && !labels(run.calls).some((l) => l.startsWith('re-review')) && run.res.note === 'The last revise pass changed no code, and with the coverage pass off there was nothing further to review.' && comment(run.calls, 'handoff comment').includes('Redline ran 1 review round; the last one changed no code, and with the coverage pass off there was nothing further to review.\n'), [run.res.status, run.res.note, comment(run.calls, 'handoff comment').slice(0, 300)])
  run = await go('done: coverage off, a correctness fix', baseArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('done: with the coverage pass off, a correctness fix still buys a fix-diff round', run.res.status === 'done' && run.res.rounds.length === 2 && labels(run.calls).includes('re-review r2') && promptOf(run.calls, 're-review r2').includes('only the fix diff'), labels(run.calls))

  // The cap is as it was: past it, a new correctness item, confirmed or not, ends the run with the
  // cap-hit comment, while a round of nits alone is still fixed and gets its final nit pass.
  run = await go('done: the cap, an unconfirmed item', { ...covArgs, maxRounds: 1 }, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness', { confidence: 'unconfirmed', wouldConfirm: 'w' })]], commitIds: [['R1-1']], coverage: [one, one], coverageOut: [acct('R1-1'), acct('R2-1', 'unconfirmed')] })
  check('done: past the cap a new correctness item ends the run with the cap-hit comment, confirmed or not', run.res.status === 'capped' && run.res.openFindings.map((x) => x.id).join(',') === 'R2-1' && !labels(run.calls).includes('shape r2') && comment(run.calls, 'cap-hit comment').includes('### Still open'), [run.res.status, labels(run.calls)])
  run = await go('done: the cap, nits only', { ...covArgs, maxRounds: 1 }, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'nit')], []], commitIds: [['R1-1'], ['R2-1']], coverage: [one, one], coverageOut: [acct('R1-1'), acct('R2-1')] })
  check('done: past the cap a round of nits alone is still fixed and ends in its final nit pass', run.res.status === 'done' && labels(run.calls).includes('shape r2') && labels(run.calls).includes('final nit pass r3'), [run.res.status, labels(run.calls)])

  // The final nit pass's endings: what it found is counted, and only what was fixed is called fixed.
  const nitThen = (extra) => ({ reviews: [[f('R1-1', 'nit')], [f('R2-1', 'correctness'), f('R2-2', 'correctness')]], coverage: [one], coverageOut: [acct('R1-1')], ...extra })
  run = await go('done: the final nit pass, one fixed and one declined', covArgs, nitThen({ decline: ['R2-2'], commitIds: [['R1-1'], ['R2-1']] }))
  check('done: a final nit pass with one item fixed and one declined gives both counts, and flags the unreviewed fix', run.res.status === 'done' && run.res.lastFixUnreviewed === true && comment(run.calls, 'handoff comment').includes('Redline ran 2 review rounds. The final nit pass found 2 correctness items in the nit fixes: 1 fixed in one more pass, which was not re-reviewed (please look at that commit first); 1 not changed, listed below. '), comment(run.calls, 'handoff comment').slice(0, 400))
  // The final nit pass's scope stands over the facts-only paragraph after it (#94, R1-8).
  check('done: the final nit pass\'s scope stands over the facts-only paragraph, in its prompt and the agent file, and a whole-PR prompt has no such line', promptOf(run.calls, 'final nit pass r2').includes('This scope stands over the instruction below') && !promptOf(run.calls, 'review r1').includes('This scope stands over the instruction below') && reviewerAgent.includes('a scope that stands over the rule above'), promptOf(run.calls, 'final nit pass r2').slice(-1500))
  run = await go('done: the final nit pass, both declined', covArgs, nitThen({ decline: ['R2-1', 'R2-2'], commitIds: [['R1-1'], []] }))
  check('done: a final nit pass whose items were all declined says none was changed, and flags nothing as unreviewed', run.res.status === 'done' && !('lastFixUnreviewed' in run.res) && comment(run.calls, 'handoff comment').includes('Redline ran 2 review rounds. The final nit pass found 2 correctness items in the nit fixes; none was changed, and each is listed below. ') && !comment(run.calls, 'handoff comment').split('\n')[2].includes('fixed'), comment(run.calls, 'handoff comment').slice(0, 400))
  run = await go('done: the final nit pass, both fixed', covArgs, nitThen({ commitIds: [['R1-1'], ['R2-1', 'R2-2']] }))
  check('done: a final nit pass whose two items were both fixed says so in the plural', run.res.lastFixUnreviewed === true && comment(run.calls, 'handoff comment').includes('Redline ran 2 review rounds. The final nit pass found 2 correctness bugs in the nit fixes; they were fixed in one more pass, which was not re-reviewed. Please look at those commits first. '), comment(run.calls, 'handoff comment').slice(0, 400))

  // The same after a human-review pass: its summary gives the counts (decision 8's question).
  const h = (id, extra) => ({ id, file: 'app/x.php', line: 1, side: 'RIGHT', category: 'human', severity: 'medium', confidence: 'confirmed', title: `comment ${id}`, description: `Please change ${id}.`, proposedFix: '', needsDecision: false, knownAs: '', source: '@marcamos', commentId: 900, threadId: 900, reviewId: 7, ...extra })
  const humanArgs = { ...baseArgs, firstRound: 3, revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: '', specFolder: 'agent-os/specs/2026-10-20-1600-114-human-review-1', findings: [h('H1-1')], commentIds: { 'H1-1': 900 }, posted: true } }
  const two = [f('R3-1', 'correctness'), f('R3-2', 'correctness')]
  run = await go('done: a human pass, the nit pass finds two, one fixed and one declined', humanArgs, { reviews: [two], decline: ['R3-2'], commitIds: [['H1-1'], ['R3-1']] })
  check('done: after a human-review pass, a final nit pass with one item fixed and one declined gives both counts', run.res.status === 'done' && run.res.lastFixUnreviewed === true && comment(run.calls, 'summary comment').includes('Final nit pass (Redline round 3): 2 correctness items in the fixes: 1 fixed in one more pass that was not re-reviewed; 1 not changed, answered in its thread.'), comment(run.calls, 'summary comment'))
  run = await go('done: a human pass, the nit pass finds two, both declined', humanArgs, { reviews: [two], decline: ['R3-1', 'R3-2'], commitIds: [['H1-1'], []] })
  check('done: after a human-review pass, a final nit pass whose items were all declined never says fixed', run.res.status === 'done' && run.res.lastFixUnreviewed === false && comment(run.calls, 'summary comment').includes('Final nit pass (Redline round 3): 2 correctness items in the fixes; none was changed, and each is answered in its thread.') && !comment(run.calls, 'summary comment').includes('fixed in one more pass'), comment(run.calls, 'summary comment'))
}

// ---------------------------------------------------------------------------
// 20. The handoff and the overrule (#93): the handoff groups every item of the run by what became
//     of it, the declines up top with one line on how to overrule one, the fixes folded; the
//     person is named by login, never by role; a decline is overruled by a typed line at a stop the
//     run already makes, with the round's declines in the hand-off result; the result says what
//     kind each decision was, for the closing summary in the session.
// ---------------------------------------------------------------------------
{
  const covArgs = { ...baseArgs, models: { ...baseArgs.models, coverage: { model: 'm-cov', effort: 'xhigh' } } }
  const one = 'Reviewed.\n\n```json\n' + JSON.stringify([{ file: 'app/x.php', line: 3, summary: 'the real one', failure_scenario: 'f' }]) + '\n```\n'
  const rules = [{ id: 'craft-config', when: { paths: ['config/project/**'] }, reason: 'Craft project config is applied through the control panel' }]
  const seven = [f('R1-1', 'correctness'), f('R1-2', 'correctness'), f('R1-3', 'nit'), f('R1-4', 'correctness'), f('R1-5', 'correctness', { file: 'config/project/project.yaml', line: 3 }), f('R1-6', 'nit', { confidence: 'unconfirmed', wouldConfirm: 'two workers on one queue' }), f('R1-7', 'nit')]
  const scenario = { reviews: [seven, []], ask: ['R1-2'], decline: ['R1-3', 'R1-6', 'R1-7'], reason: { 'R1-6': 'could not confirm: needs two workers on one queue' }, secondLook: { 'R1-6': 'unconfirmed' }, defer: ['R1-4'], commitIds: [['R1-1', 'R1-2', 'R1-4', 'R1-7']], coverage: [one, one], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }], [{ index: 1, outcome: 'settled', ref: 'R1-1' }]] }
  const decisions = {
    'R1-2': { choice: 'Keep it', notes: 'Kept as it is, on purpose.', date: '2026-11-13' },
    'R1-5': { choice: 'Make the change by hand after the run', notes: 'Done by hand after the merge.', date: '2026-11-13' },
    'R1-7': { choice: 'fix', notes: 'Fix it now; a third caller lands next week.', date: '2026-11-13', disposition: 'fix' },
  }

  // Door 1: the hand-off the run already makes for its asks carries the round's declines, and the
  // relaunch takes a typed overrule beside the answers.
  const stop = await go('layout: the hand-off', { ...covArgs, askRules: rules }, scenario)
  check('overrule: a decisions hand-off carries the round\'s declines with their reasons', stop.res.status === 'handoff' && stop.res.handoffKind === 'decisions' && JSON.stringify(stop.res.declined) === JSON.stringify([{ id: 'R1-3', title: 'title R1-3', reason: 'the spec keeps R1-3 as it is on purpose' }, { id: 'R1-6', title: 'title R1-6', reason: 'could not confirm: needs two workers on one queue' }, { id: 'R1-7', title: 'title R1-7', reason: 'the spec keeps R1-7 as it is on purpose' }]), stop.res.declined)
  const run = await go('layout: every outcome in one run', { ...covArgs, askRules: rules, decisions }, scenario)
  samePrefix('overrule: the relaunch replays every prompt before the stop', stop.calls, run.calls, stop.calls.length)
  check('overrule: a typed overrule at the hand-off turns a decline into a fix decided by the person', run.res.status === 'done' && pick(run.calls, 'resolve r1').prompt.includes('Disposition overrides') && replyFor(run.calls, 'push and reply r1', 'R1-7') === 'Redline round 1: Fix it now; a third caller lands next week. Applied in 4bbbbbb (redline: R1-7 fix). · decided by: @author', [run.res.status, replyFor(run.calls, 'push and reply r1', 'R1-7')])
  const handoff = comment(run.calls, 'handoff comment')
  const folder = 'agent-os/specs/2026-10-20-1600-114-review-round-'
  const expected = [
    'Redline handoff',
    '',
    'Redline ran 2 review rounds; the last one verified no new correctness item to fix or ask about.',
    '',
    'Resolved 6 threads; 1 left open: R1-5 (repository rule craft-config).',
    '',
    '@sam, over to you for the human review.',
    '',
    '### Rounds',
    '',
    '- Round 1 (pr): 7 items: 1 fixed, 2 declined, 1 deferred, 1 put to @author, 1 overruled by @author, 1 left to @author; 4 commits; spec `' + folder + '1`',
    '- Round 2 (fix-diff): no new items; 0 commits; spec `' + folder + '2`',
    '',
    '### Put to @author (1)',
    '',
    '- **R1-2** title R1-2: Kept as it is, on purpose. Applied in 2bbbbbb. · decided by: @author',
    '',
    '### Overruled by @author (1)',
    '',
    '- **R1-7** title R1-7: Fix it now; a third caller lands next week. Applied in 4bbbbbb. · decided by: @author',
    '',
    '### Declined by Redline (2)',
    '',
    'To overrule one, reply in its thread, then run `/redline-revise 114 review @author`.',
    '',
    '- **R1-3** title R1-3: declined: the spec keeps R1-3 as it is on purpose · decided by: redline',
    '- **R1-6** title R1-6: declined: could not confirm: needs two workers on one queue · decided by: redline',
    '',
    '### Deferred (mitigated now, full fix left open)',
    '',
    '- **R1-4** title R1-4: shipped a guard clause; open: a lock',
    '',
    '### Left to @author (repository rules)',
    '',
    '- **R1-5** title R1-5: rule craft-config (Craft project config is applied through the control panel); left to @author under repository rule craft-config: Done by hand after the merge. · decided by: @author',
    '',
    '### Fixed (1)',
    '',
    '<details>',
    '<summary>Each in its own commit</summary>',
    '',
    '- **R1-1** title R1-1: fixed in 1bbbbbb · decided by: redline',
    '',
    '</details>',
    '',
    '### Candidates set aside in round 2 (1)',
    '',
    '<details>',
    '<summary>Refuted, collapsed or already tracked</summary>',
    '',
    '- `app/x.php:3` · the real one · settled: R1-1',
    '',
    '</details>',
    '',
    '### Commits',
    '',
    '- 1bbbbbb redline: R1-1 fix',
    '- 2bbbbbb redline: R1-2 fix',
    '- 3bbbbbb redline: R1-4 fix',
    '- 4bbbbbb redline: R1-7 fix',
  ].join('\n')
  check('layout: the handoff, every heading in order with its line, is the layout the spec shows', handoff === expected, handoff)
  check('layout: the person is named by login, never by role or as you', !/the author|Left to you|left to you|yours/.test(handoff) && !/yours under rule|yours to act on|the author/.test(pick(run.calls, 'post r1').prompt.slice(pick(run.calls, 'post r1').prompt.indexOf('{\n  "body"'))), handoff)
  check('layout: the result says what kind each decision was, with a decline\'s reason, for the closing summary', run.res.decided.map((d) => `${d.id}:${d.kind}`).join(',') === 'R1-1:fixed,R1-2:decided,R1-4:deferred,R1-5:left,R1-3:declined,R1-6:declined,R1-7:decided' && run.res.decided.find((d) => d.id === 'R1-6').reason === 'could not confirm: needs two workers on one queue' && run.res.decided.find((d) => d.id === 'R1-7').overruled === true && run.res.decided.find((d) => d.id === 'R1-2').overruled === false, run.res.decided)

  // With no login the fallback names nobody's role: headings, lines and the way to overrule.
  const anon = await go('layout: no login', { ...covArgs, askRules: rules, login: '', decisions }, scenario)
  const anonHandoff = comment(anon.calls, 'handoff comment')
  check('layout: with no login the person running Redline stands in everywhere, and the overrule line asks for a login', anon.res.status === 'done' && anonHandoff.includes('### Put to the person running Redline (1)') && anonHandoff.includes('### Left to the person running Redline (repository rules)') && anonHandoff.includes('left to the person running Redline under repository rule craft-config') && anonHandoff.includes('To overrule one, reply in its thread, then run `/redline-revise 114 review @<your login>`.') && !anonHandoff.includes('the author'), anonHandoff)

  // A human-review pass is unchanged, its no-login fallback included: "the author", as before.
  const h = (id, extra) => ({ id, file: 'app/x.php', line: 1, side: 'RIGHT', category: 'human', severity: 'medium', confidence: 'confirmed', title: `comment ${id}`, description: `Is ${id} the right default?`, proposedFix: '', needsDecision: false, knownAs: '', source: '@marcamos', commentId: 900, threadId: 900, reviewId: 7, ...extra })
  const humanNoLogin = await go('layout: a human-review pass with no login', { ...baseArgs, login: '', firstRound: 3, decisions: { 'H1-1': { choice: 'Keep it', notes: '', date: '2026-11-13' } }, revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: '', specFolder: 'agent-os/specs/2026-10-20-1600-114-human-review-1', findings: [h('H1-1')], commentIds: { 'H1-1': 900 }, posted: true } }, { reviews: [[]], ask: ['H1-1'], acceptedCalls: ['H1-1'], commitIds: [[]] })
  check('layout: a human-review pass with no login still says the author, as it always did', humanNoLogin.res.status === 'done' && replyFor(humanNoLogin.calls, 'push and reply h1', 'H1-1').startsWith('Redline human review 1: The author chose: Keep it. No code change. · decided by: the author') && comment(humanNoLogin.calls, 'summary comment').includes('for the author'), [replyFor(humanNoLogin.calls, 'push and reply h1', 'H1-1'), comment(humanNoLogin.calls, 'summary comment')])

  // Under correctness only, the handoff lists what the scope declined, once, with ids that are not bold.
  const scoped = await go('layout: correctness only', { ...covArgs, scope: 'correctness' }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit', { file: 'app/y.php', line: 9 })], [f('R2-1', 'nit', { file: 'app/z.php', line: 2 })]], commitIds: [['R1-1']], coverage: [one, one], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }], [{ index: 1, outcome: 'verified', ref: 'R2-1' }]] })
  const scopedHandoff = comment(scoped.calls, 'handoff comment')
  check('layout: under correctness only the handoff lists what the scope declined, after the declines and before the rest', scoped.res.status === 'done' && scopedHandoff.includes('### Declined under this run\'s scope (correctness only) (2)\n\n- R1-2 · `app/y.php:9` · title R1-2\n- R2-1 · `app/z.php:2` · title R2-1\n\n### Fixed (1)') && scopedHandoff.includes('- Round 1 (pr): 2 items: 1 fixed, 1 declined under the scope; 1 commits;') && scopedHandoff.includes('- Round 2 (fix-diff): 1 item: 1 declined under the scope; 0 commits;'), scopedHandoff)

  // The cap-hit comment names the person by login too.
  const capped = await go('layout: the cap-hit comment', { ...covArgs, maxRounds: 1 }, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')]], commitIds: [['R1-1']], coverage: [one, one], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }], [{ index: 1, outcome: 'verified', ref: 'R2-1' }]] })
  check('layout: the cap-hit comment says who picks the open findings up, by login', capped.res.status === 'capped' && comment(capped.calls, 'cap-hit comment').includes('so it has not requested a review. @author will pick these up.') && !comment(capped.calls, 'cap-hit comment').includes('The author'), comment(capped.calls, 'cap-hit comment'))
}

check('no prompt of any scenario holds a For the person section or asks for a forThePerson list', forThePerson.length === 0, forThePerson.slice(0, 5))

console.log(`\n${passed} checks passed, ${failures.length} failed`)
for (const failure of failures) {
  console.log(`  FAIL ${failure}`)
}
process.exit(failures.length ? 1 : 0)
