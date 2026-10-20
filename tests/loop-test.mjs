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
        const ids = [...prompt.matchAll(/\*\*(R\d+-\d+)\*\*/g)].map((m) => m[1])
        return { operation: 'post-review', dryRun: false, posted: true, skipped: '', review: { id: 1, html_url: '', comments: [...new Set(ids)].map((id, i) => ({ finding: id, id: 100 + i })), movedToBody: [] }, files: [], error: '' }
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
      if (opts.label === 'baseline') {
        return { exit: 0, result: { mode: 'baseline', ok: true, checks: [{ name: 'check', exit: 0, recorded: false }], git: null }, error: '' }
      }
      scenario.allCommits.push(...(scenario.commitIds.shift() || []))
      return { exit: 0, result: { mode: 'full', ok: true, checks: [{ name: 'check', exit: 0, recorded: false }], git: { unexpected_files: [], uncommitted: [], commits: scenario.allCommits.map((id, i) => ({ sha: SHA(i + 1), message: id.startsWith('redline:') ? id : `redline: ${id} fix` })).reverse(), diff_lines: 3 } }, error: '' }
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
  const s = { ...scenario, allCommits: [], commitIds: (scenario.commitIds || []).map((c) => c.slice()), reviews: scenario.reviews, unresolved: scenario.unresolved }
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
  check('review: nothing selected replies and finishes without a revise pass', none.res.status === 'done' && labels(none.calls).join('|') === 'gather r1|review r1|post r1|push and reply r1|PR description|handoff comment', labels(none.calls))
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

console.log(`\n${passed} checks passed, ${failures.length} failed`)
for (const failure of failures) {
  console.log(`  FAIL ${failure}`)
}
process.exit(failures.length ? 1 : 0)
