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

function mock(scenario) {
  const calls = []
  let reviewN = 0
  const agent = async (prompt, opts) => {
    calls.push({ label: opts.label, agentType: opts.agentType, prompt, opts })
    const t = opts.agentType
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
        const ids = [...new Set([...prompt.matchAll(/\*\*(R\d+-\d+)\*\*/g)].map((m) => m[1]))]
        const drop = scenario.postDrop || []
        const moved = (scenario.noInline ? ids : (scenario.moved || [])).filter((id) => !drop.includes(id))
        const inline = ids.filter((id) => !moved.includes(id) && !drop.includes(id))
        return { operation: 'post-review', dryRun: false, posted: true, skipped: '', review: { id: scenario.postReviewId === undefined ? 1 : scenario.postReviewId, html_url: '', comments: inline.map((id, i) => ({ finding: id, id: 100 + i })), movedToBody: moved }, files: [], error: scenario.postError || '' }
      }
      if (opts.label.startsWith('snapshot')) {
        return { operation: 'snapshot', files: [], error: '' }
      }
      if (opts.label.startsWith('push')) {
        return { operation: 'push-and-reply', dryRun: false, pushed: true, replies: [], files: [], error: '' }
      }
      if (opts.label === 'PR description') {
        return { operation: 'update', prBody: { file: '', updated: false, backup: '', copy: '' }, error: '' }
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
      return { operation: 'handoff', dryRun: false, posted: true, comment_url: 'u', reviewRequested: true, files: [], error: '' }
    }
    if (t === 'redline:redline-reviewer') {
      reviewN += 1
      return { round: reviewN, reviewed: 'pr', findings: scenario.reviews[reviewN - 1] || [], summary: 'S' }
    }
    if (t === 'redline:redline-shaper') {
      const ids = [...new Set([...prompt.matchAll(/"id": "(R\d+-\d+)"/g)].map((m) => m[1]))]
      const ask = scenario.ask || []
      const defer = scenario.defer || []
      const disposition = (id) => (ask.includes(id) ? 'ask' : defer.includes(id) ? 'defer' : 'fix')
      return {
        specFolder: prompt.match(/agent-os\/specs\/[^/\s]+/)[0],
        findings: ids.map((id) => ({ id, disposition: disposition(id), decidedBy: disposition(id) === 'ask' ? 'pending' : 'redline', recommendation: `${disposition(id)} ${id} this way` })),
        deferred: ids.filter((id) => defer.includes(id)).map((id) => ({ id, mitigation: 'a guard clause', fullFix: 'a lock' })),
        judgmentCalls: ids.filter((id) => ask.includes(id)).map((id) => ({ id, title: `call ${id}`, story: 's', why_human: 'product decision', options: [{ label: 'Keep it', cost: 'c', effect: 'e' }, { label: 'Change it', cost: 'c', effect: 'e' }], recommendation: 'Keep it', dependsOn: [] })),
      }
    }
    if (t === 'redline:redline-resolve') {
      const ids = [...new Set([...prompt.matchAll(/"(R\d+-\d+)": \{/g)].map((m) => m[1]))]
      // An accepted override has no files to touch; everything else gets a task with a file.
      const accepted = new Set([...prompt.matchAll(/"(R\d+-\d+)": \{[^}]*"disposition": "accept"/g)].map((m) => m[1]))
      return { specFolder: 'x', tasks: ids.map((id, i) => ({ n: i + 2, title: accepted.has(id) ? `Accepted, no change: ${id}` : `t ${id}`, files: accepted.has(id) ? [] : ['app/x.php'], finding: id })), deferred: [], unresolved: scenario.unresolved ? scenario.unresolved.slice() : [] }
    }
    if (t === 'redline:redline-plan-approver') {
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

const f = (id, category, extra) => ({ id, file: 'app/x.php', line: 1, side: 'RIGHT', category, severity: 'low', confidence: 'likely', title: `title ${id}`, description: 'd', proposedFix: '', needsDecision: false, knownAs: '', ...extra })
const baseArgs = {
  repoRoot: '/r', pluginRoot: '/p', pr: 114, launchedAt: '2026-10-20T16:00:00-0400', headRef: 'redline-seed-3', baseRef: 'main',
  startSha: 'a'.repeat(40), files: ['app/x.php'], snapshotPath: '/r/agent-os/specs/x/redline/snapshot-start.json', reviewer: 'sam', login: 'author',
  models: { revise: { model: 'claude-opus-5-5' } },
}

async function go(name, args, scenario) {
  const s = { ...scenario, allCommits: [], commitIds: (scenario.commitIds || []).map((c) => c.slice()), reviews: scenario.reviews, unresolved: scenario.unresolved, recordFiles: scenario.recordFiles }
  const { agent, calls } = mock(s)
  const fn = new Function('args', 'agent', 'parallel', 'phase', 'log', body)
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
  // Every run that reaches Finish ends with the run-record commit, after the closing comment.
  if (!thrown && (res.status === 'capped' || 'handoffPosted' in res) && !scenario.recordFiles) {
    const tail = calls.slice(-3).map((c) => c.label)
    check(`${name}: the run-record commit is the last call, after the closing comment`, /comment$/.test(tail[0]) && tail[1] === 'record files' && tail[2] === 'record commit' && res.recordCommit && res.recordCommit.committed, tail)
  }
  return { res, calls, thrown }
}

const labels = (calls) => calls.map((c) => c.label)
const pick = (calls, label) => calls.find((c) => c.label === label)
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
  const scenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness', { needsDecision: true })], []], ask: ['R1-2'], commitIds: [['R1-1', 'R1-2']] }
  const first = await go('guided: hand-off', baseArgs, scenario)
  check('guided: status handoff (decisions)', first.res.status === 'handoff' && first.res.handoffKind === 'decisions', first.res.status)
  check('guided: stops after the shaper', labels(first.calls).join('|') === 'gather r1|review r1|post r1|shape r1', labels(first.calls))
  check('guided: decisionsNeeded lists the ask', JSON.stringify(first.res.decisionsNeeded) === '["R1-2"]')
  check('guided: interrupt reported', first.res.interrupt === 'guided' && first.res.scope === 'all')
  const decided = { ...baseArgs, decisions: { 'R1-2': { choice: 'Keep it', notes: 'The author keeps it because the board already shows it.', date: '2026-10-20' } } }
  const second = await go('guided: relaunch with the decision', decided, scenario)
  check('guided: relaunch finishes', second.res.status === 'done', second.res.status)
  samePrefix('guided', first.calls, second.calls, 4)
  const resolve = pick(second.calls, 'resolve r1').prompt
  check('guided: resolve prompt attributes the decision to the login', resolve.includes('"decidedBy": "@author"') && resolve.includes('Decided by: <that value>'), resolve.slice(0, 200))
  check('guided: resolve prompt has no overrides section', !resolve.includes('Disposition overrides'))
  check('guided: R1-2 reply carries the restatement and the owner', replyFor(second.calls, 'push and reply r1', 'R1-2') === 'Redline round 1: The author keeps it because the board already shows it. Applied in 2bbbbbb (redline: R1-2 fix). · decided by: @author', replyFor(second.calls, 'push and reply r1', 'R1-2'))
  check('guided: R1-1 reply is decided by redline', replyFor(second.calls, 'push and reply r1', 'R1-1').endsWith(' · decided by: redline'), replyFor(second.calls, 'push and reply r1', 'R1-1'))
  const handoff = comment(second.calls, 'handoff comment')
  check('guided: handoff comment lists every decision with its owner', handoff.includes('### Decisions\n\n- **R1-1** title R1-1: fixed in 1bbbbbb · decided by: redline\n- **R1-2** title R1-2: The author keeps it because the board already shows it. · decided by: @author'), handoff)
  check('guided: shape prompt asks for decidedBy and recommendation', pick(second.calls, 'shape r1').prompt.includes('decidedBy "redline" for fix and defer or "pending" for ask') && pick(second.calls, 'shape r1').prompt.includes('Decided by: redline'))
  check('guided: result.decided carries owners', second.res.decided.map((d) => `${d.id}=${d.decidedBy}`).join(',') === 'R1-1=redline,R1-2=@author', second.res.decided)
}

// ---------------------------------------------------------------------------
// 2. autopilot: the same judgment call is decided from the recommendation and the run goes on.
// ---------------------------------------------------------------------------
{
  const scenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness', { needsDecision: true })], []], ask: ['R1-2'], commitIds: [['R1-1', 'R1-2']] }
  const run = await go('autopilot: judgment call decided from the recommendation', { ...baseArgs, interrupt: 'autopilot' }, scenario)
  check('autopilot: never ends for a judgment call', run.res.status === 'done', run.res.status)
  check('autopilot: resolve ran', !!pick(run.calls, 'resolve r1'))
  const resolve = pick(run.calls, 'resolve r1').prompt
  check('autopilot: resolve prompt carries the autopilot decision', resolve.includes('"decidedBy": "redline (autopilot)"') && resolve.includes('"notes": "Autopilot took the shaper\'s recommendation: Keep it."') && resolve.includes('"choice": "Keep it"'), resolve)
  check('autopilot: R1-2 reply is labelled', replyFor(run.calls, 'push and reply r1', 'R1-2') === 'Redline round 1: Autopilot took the shaper\'s recommendation: Keep it. Applied in 2bbbbbb (redline: R1-2 fix). · decided by: redline (autopilot)', replyFor(run.calls, 'push and reply r1', 'R1-2'))
  check('autopilot: handoff comment labels it', comment(run.calls, 'handoff comment').includes('- **R1-2** title R1-2: Autopilot took the shaper\'s recommendation: Keep it. · decided by: redline (autopilot)'), comment(run.calls, 'handoff comment'))
  check('autopilot: plan approver sees the decision as decided', pick(run.calls, 'plan approver r1').prompt.includes('"decidedBy": "redline (autopilot)"'))
  const stuck = await go('autopilot: resolve cannot apply the recommendation', { ...baseArgs, interrupt: 'autopilot' }, { ...scenario, unresolved: [{ id: 'R1-2', why: 'no such option' }] })
  check('autopilot: an unresolved decision is an error, not a hand-off', stuck.res.status === 'error' && stuck.res.stage === 'resolve', stuck.res)
}

// ---------------------------------------------------------------------------
// 3. plan: every round stops after shaping; the relaunch approves the round, answers the ask and
//    may change a disposition.
// ---------------------------------------------------------------------------
{
  const scenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness', { needsDecision: true })], [f('R2-1', 'nit')], []], ask: ['R1-2'], commitIds: [['R1-2'], ['R2-1']] }
  const planArgs = { ...baseArgs, interrupt: 'plan' }
  const first = await go('plan: round 1 stops after shape', planArgs, scenario)
  check('plan: status handoff (plan)', first.res.status === 'handoff' && first.res.handoffKind === 'plan', first.res.status)
  check('plan: stops after the shaper', labels(first.calls).join('|') === 'gather r1|review r1|post r1|shape r1', labels(first.calls))
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
  samePrefix('plan round 1', first.calls, second.calls, 4)
  check('plan: round 2 stops after its shape', second.res.status === 'handoff' && second.res.handoffKind === 'plan' && second.res.handoffRound === 2, [second.res.status, second.res.handoffRound])
  check('plan: resolve got the override', pick(second.calls, 'resolve r1').prompt.includes('Disposition overrides') && pick(second.calls, 'resolve r1').prompt.includes('"disposition": "accept"'))
  check('plan: plan approver sees the overridden disposition', pick(second.calls, 'plan approver r1').prompt.includes('"disposition": "accept"'))
  check('plan: R1-1 reply is the override, decided by the login', replyFor(second.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: The author accepts the current behaviour; the edge case cannot happen in production data. No code change. · decided by: @author', replyFor(second.calls, 'push and reply r1', 'R1-1'))
  check('plan: approveWith accumulates', JSON.stringify(second.res.approveWith) === '{"approvedPlans":[1,2]}', second.res.approveWith)
  const third = await go('plan: both rounds approved', { ...round1, approvedPlans: [1, 2] }, scenario)
  samePrefix('plan round 2', second.calls, third.calls, second.calls.length)
  check('plan: finishes after the final nit pass', third.res.status === 'done' && third.res.rounds.length === 3, [third.res.status, third.res.rounds.length])
  check('plan: handoff comment names the approvals', comment(third.calls, 'handoff comment').includes('- Round 1 (pr): 2 correctness, 0 nit; 1 commits; plan approved by @author;') && comment(third.calls, 'handoff comment').includes('- Round 2 (fix-diff): 0 correctness, 1 nit; 1 commits; plan approved by @author;'), comment(third.calls, 'handoff comment'))
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
  check('review: the handoff comment lists the drops', comment(second.calls, 'handoff comment').includes('- **R1-2** title R1-2: not acted on in this run: Naming is fine as it is. · decided by: @author') && comment(second.calls, 'handoff comment').includes('2 not acted on (@author\'s pick)'), comment(second.calls, 'handoff comment'))
  check('review: the re-review sees the drops as settled', pick(second.calls, 're-review r2').prompt.includes('"outcome": "not acted on in this run: Naming is fine as it is. · decided by: @author"'), pick(second.calls, 're-review r2').prompt)
  check('review: round record lists the drops', JSON.stringify(second.res.rounds[0].dropped) === '[{"id":"R1-2","reason":"Naming is fine as it is."},{"id":"R1-3","reason":"Not selected for this run."}]', second.res.rounds[0].dropped)
  const none = await go('review: nothing selected', { ...reviewArgs, selected: { act: [], dropped: { 'R1-1': 'Known and accepted.' } } }, scenario)
  check('review: nothing selected replies and finishes without a revise pass', none.res.status === 'done' && labels(none.calls).join('|') === 'gather r1|review r1|post r1|push and reply r1|PR description|handoff comment|record files|record commit', labels(none.calls))
  const later = await go('review: round 2 is guided', { ...reviewArgs, selected: { act: ['R1-1'], dropped: {} } }, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness', { needsDecision: true })], []], ask: ['R2-1'], commitIds: [['R1-1'], ['R2-1']] })
  check('review: a later round hands off its asks as guided does', later.res.status === 'handoff' && later.res.handoffKind === 'decisions' && later.res.handoffRound === 2, later.res.status)
}

// ---------------------------------------------------------------------------
// 5. scope correctness: the reviewer is told not to look for nits, and a correctness-free round
//    is done without a final nit pass.
// ---------------------------------------------------------------------------
{
  const scenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], [f('R2-1', 'nit')]], commitIds: [['R1-1']] }
  const run = await go('scope correctness', { ...baseArgs, scope: 'correctness' }, scenario)
  check('scope: reviewer prompt says no nits', pick(run.calls, 'review r1').prompt.includes('Scope: correctness only. Do not look for nits at all') && pick(run.calls, 're-review r2').prompt.includes('Scope: correctness only'))
  check('scope: a nit the reviewer still reports is dropped', run.res.rounds[0].droppedNits === 1 && run.res.rounds[0].findings.length === 1, run.res.rounds[0])
  check('scope: done after the correctness-free re-review, no nit pass', run.res.status === 'done' && run.res.rounds.length === 2 && !labels(run.calls).some((l) => l.startsWith('final nit pass')), labels(run.calls))
  check('scope: shape prompt carries only the correctness finding', !pick(run.calls, 'shape r1').prompt.includes('R1-2'))
  check('scope: reported in the result', run.res.scope === 'correctness')
  const all = await go('scope all (default) keeps the nit pass', baseArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], [f('R2-1', 'nit')], []], commitIds: [['R1-1', 'R1-2'], ['R2-1']] })
  check('scope all: the final nit pass still runs', all.res.status === 'done' && labels(all.calls).includes('final nit pass r3'), labels(all.calls))
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
  check('review only: three calls', run.res.status === 'review-only' && run.calls.length === 3 && run.res.interrupt === 'review only')
  run = await go('review only (dial word)', { ...baseArgs, interrupt: 'review only' }, { reviews: [[f('R1-1', 'nit')]] })
  check('review only word: same', run.res.status === 'review-only' && run.calls.length === 3)
  run = await go('bad interrupt word', { ...baseArgs, interrupt: 'yolo' }, { reviews: [[]] })
  check('bad interrupt: refused before any agent runs', run.thrown && /args.interrupt must be one of/.test(run.thrown.message) && run.calls.length === 0, run.thrown && run.thrown.message)
  run = await go('bad scope word', { ...baseArgs, scope: 'nits' }, { reviews: [[]] })
  check('bad scope: refused', run.thrown && /args.scope must be/.test(run.thrown.message))
  run = await go('no login', { ...baseArgs, login: undefined, decisions: { 'R1-1': { choice: 'Keep it', notes: 'Kept.', date: '2026-10-20' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], commitIds: [['R1-1']] })
  check('no login: the author stands in', replyFor(run.calls, 'push and reply r1', 'R1-1').endsWith('· decided by: the author'), replyFor(run.calls, 'push and reply r1', 'R1-1'))
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
  check('record: after the description and the handoff comment', labels(run.calls).slice(-4).join('|') === 'PR description|handoff comment|record files|record commit', labels(run.calls).slice(-4))
  const status = pick(run.calls, 'record files').prompt
  check('record: status covers every round folder and the start snapshot', status.includes(`git -C /r status --porcelain --untracked-files=all -- ${folder1} ${folder2} ${start}\n`), status)
  const commit = pick(run.calls, 'record commit').prompt
  check('record: stages the listed files by name', commit.includes(`git -C /r add -- ${folder1}handoff.md ${folder2}handoff.md ${start}\n`), commit)
  check('record: the commit message', commit.includes('git -C /r commit -m "redline: record the run\'s replies, reviews and handoff for PR #114 (#114)"'), commit)
  check('record: pushes the head branch when push is on', commit.includes('push: true') && commit.includes('git -C /r push origin redline-seed-3'), commit)
  check('record: reported in the result', run.res.recordCommit.committed === true && run.res.recordCommit.sha === 'c'.repeat(40) && run.res.recordCommit.pushed === true && run.res.recordCommit.files.length === 3, run.res.recordCommit)
  check('record: the handoff comment is composed before the commit, so it lists only the fix commits', !comment(run.calls, 'handoff comment').includes('record the run'))

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
    ['a hand-off', baseArgs, { reviews: [[f('R1-1', 'correctness', { needsDecision: true })]], ask: ['R1-1'] }],
    ['the review dial', { ...baseArgs, interrupt: 'review' }, { reviews: [[f('R1-1', 'correctness')]] }],
    ['review only', { ...baseArgs, interrupt: 'review only' }, { reviews: [[f('R1-1', 'nit')]] }],
  ]) {
    run = await go(`record: ${name} stops before Finish`, args, s)
    check(`record: ${name} commits no record`, !labels(run.calls).some((l) => l.startsWith('record')), labels(run.calls))
  }

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
  check('no inline: the review body does not promise an inline comment for every finding', pick(run.calls, 'post r1').prompt.includes('sits under Not placed inline below') && !pick(run.calls, 'post r1').prompt.includes('Redline replies in each thread'))
  const errorScenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], []], commitIds: [['R1-1', 'R1-2']], noInline: true, postError: 'no inline comment could be anchored' }
  run = await go('no inline with an agent error', baseArgs, errorScenario)
  check('posted error: the #778 shape continues into shape with a warning', run.res.status === 'done' && !!pick(run.calls, 'shape r1') && run.res.warnings.some((w) => w.includes('reported an error for a review it posted; continuing: no inline comment could be anchored')), [run.res.status, run.res.warnings])
  run = await go('posted error, review id 0', baseArgs, { ...errorScenario, postReviewId: 0 })
  check('posted error: a posted review with no id still stops at post', run.res.status === 'error' && run.res.stage === 'post' && run.res.error.includes('posting the round 1 review failed') && !pick(run.calls, 'shape r1'), run.res)
  run = await go('posted error, a finding in neither list', baseArgs, { ...errorScenario, noInline: false, postDrop: ['R1-2'] })
  check('posted error: a finding in neither list still stops at post', run.res.status === 'error' && run.res.stage === 'post' && run.res.error.includes('posting the round 1 review failed') && !pick(run.calls, 'shape r1'), run.res)
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
  check('checker: text on a passing gate is a warning, not a reason', run.res.status === 'done' && !repaired(run) && run.res.warnings.includes('round 1: the checker reported "note from the checker" on a passing gate'), [run.res.status, run.res.warnings])
  run = await go('checker: ok false with a message', baseArgs, { ...base, checker: (label, out) => (full(label) ? { ...out, exit: 1, error: 'guard: 2 mismatched', result: { ...out.result, ok: false } } : null) })
  check('checker: a failing gate\'s error is the reason, after one repair pass', run.res.status === 'error' && run.res.stage === 'check' && labels(run.calls).filter((l) => l === 'repair r1').length === 1 && run.res.error.includes('checker error: guard: 2 mismatched') && run.res.error.includes('after one repair pass'), brief(run))
  const failingCheck = (out) => ({ ...out, exit: 1, result: { ...out.result, ok: false, checks: [{ name: 'guard', cmd: 'tests/guard-test.sh', exit: 1, recorded: false, stdout: '1 mismatched', stderr: '' }] } })
  run = await go('checker: a failing check is repaired', baseArgs, { ...base, checker: (label, out) => (label === 'check r1' ? failingCheck(out) : null) })
  check('checker: a failing check sends one repair pass and the recheck passes', run.res.status === 'done' && labels(run.calls).includes('repair r1') && pick(run.calls, 'repair r1').prompt.includes('This is a repair pass') && pick(run.calls, 'repair r1').prompt.includes('failing checks: guard') && pick(run.calls, 'repair r1').prompt.includes('--- guard (exit 1)'), [run.res.status, labels(run.calls)])
  run = await go('checker: result unreadable (spilled)', baseArgs, { ...base, checker: (label) => (label === 'check r1' ? unreadable('spilled', null, 'Output too large; saved to /tmp/out.txt') : null) })
  check('unreadable: stops at check with the cause and the fix, no repair', stopped(run) && run.res.error.includes('exceeded the Bash tool\'s inline limit') && run.res.error.includes('emit_checks in /p/scripts/checks-template.sh') && run.res.error.includes('the checker said: Output too large'), [brief(run), labels(run.calls)])
  check('unreadable: the record keeps what the checker returned', kept(run).status === 'result_unreadable' && kept(run).reason === 'spilled' && roundCheck(run).pass === false, [run.res.detail, roundCheck(run)])
  const command = pick(run.calls, 'check r1').prompt.split('\n').pop()
  check('unreadable: the command line is the prompt\'s last line', command === '/r/.claude/redline/checks.sh /r/agent-os/specs/2026-10-20-1600-114-review-round-1/redline/snapshot.json', command)
  run = await go('checker: result unreadable (not JSON)', baseArgs, { ...base, checker: (label) => (label === 'check r1' ? unreadable('not_json', null, 'Running guard...') : null) })
  check('unreadable: not JSON names the cause and the command to run by hand', stopped(run) && run.res.error.includes('not one JSON object') && run.res.error.includes(`run ${command} by hand`) && run.res.error.includes('the checker said: Running guard...'), run.res.error)
  run = await go('checker: result unreadable (no git key)', baseArgs, { ...base, checker: (label, out) => (label === 'check r1' ? unreadable('no_git_block', { mode: 'full', ok: true, checks: out.result.checks }, '') : null) })
  check('unreadable: a partial object is kept in the record', stopped(run) && run.res.error.includes('no git block') && run.res.error.includes(`run ${command} by hand`) && !run.res.error.includes('the checker said') && (kept(run).result || {}).mode === 'full', brief(run))
  run = await go('checker: baseline unreadable', baseArgs, { ...base, checker: (label) => (label === 'baseline' ? unreadable('spilled', null, '') : null) })
  check('unreadable: a baseline the checker cannot read stops before implement', stopped(run) && !pick(run.calls, 'implement r1') && run.res.error.startsWith('baseline: the checker could not read') && kept(run).status === 'result_unreadable', [brief(run), labels(run.calls)])
  run = await go('checker: exit 2', baseArgs, { ...base, checker: (label) => (label === 'check r1' ? { exit: 2, status: 'read', reason: '', result: null, error: 'checks.sh: no snapshot' } : null) })
  check('stop: a usage error stops with the script\'s message, no repair', stopped(run) && run.res.error.includes('checks.sh exited 2 (usage error)') && run.res.error.includes('the checker said: checks.sh: no snapshot') && run.res.error.includes(`run ${command} by hand`) && roundCheck(run).pass === false, brief(run))
  run = await go('checker: exit 2 read as unreadable', baseArgs, { ...base, checker: (label) => (label === 'check r1' ? { exit: 2, status: 'result_unreadable', reason: 'not_json', result: null, error: 'checks.sh: a snapshot file is required unless --baseline is given' } : null) })
  check('stop: a usage error the checker called unreadable still names exit 2, no repair', stopped(run) && run.res.error.includes('checks.sh exited 2 (usage error)') && !run.res.error.includes('not one JSON object') && run.res.error.includes('the checker said: checks.sh: a snapshot file is required') && run.res.error.includes(`run ${command} by hand`), brief(run))
  check('stop: the checker prompt says a usage error is status read', pick(run.calls, 'check r1').prompt.includes('A usage error (exit 2) is status read with result null, never result_unreadable.'), pick(run.calls, 'check r1').prompt.split('\n').slice(-3))
  run = await go('checker: no result', baseArgs, { ...base, checker: (label) => (label === 'check r1' ? { exit: 1, status: 'read', reason: '', result: null, error: '' } : null) })
  check('stop: a missing result stops, no repair', stopped(run) && run.res.error.includes('the checker returned no result'), brief(run))
  run = await go('checker: no git block', baseArgs, { ...base, checker: (label, out) => (label === 'check r1' ? { ...out, result: { mode: 'full', ok: true, checks: out.result.checks } } : null) })
  check('stop: a result with no git block stops, no repair', stopped(run) && run.res.error.includes('the checker result has no git block') && run.res.error.includes(`run ${command} by hand`), brief(run))
  run = await go('checker: baseline with no result', baseArgs, { ...base, checker: (label) => (label === 'baseline' ? { exit: 1, status: 'read', reason: '', result: null, error: 'killed' } : null) })
  check('stop: a baseline with no result stops instead of passing silently', stopped(run) && !pick(run.calls, 'implement r1') && run.res.error.startsWith('baseline: the checker returned no result; the checker said: killed'), [brief(run), labels(run.calls)])
}

console.log(`\n${passed} checks passed, ${failures.length} failed`)
for (const failure of failures) {
  console.log(`  FAIL ${failure}`)
}
process.exit(failures.length ? 1 : 0)
