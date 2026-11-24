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
  let approvedN = 0
  // The files of each task the scripted resolve agent planned, by finding id (#106): a reshape
  // asked for a decided finding's task lists them, as a real one reads them off plan.md.
  const plannedByResolve = {}
  const agent = async (prompt, opts) => {
    calls.push({ label: opts.label, agentType: opts.agentType, prompt, opts })
    // scenario.nothing (#94, R6-10): the labels whose call returns nothing, as an agent that was
    // skipped, stalled on every attempt or died on an API error does. No per-agent override can
    // return null: the mock falls back to its default result.
    if ((scenario.nothing || []).includes(opts.label)) {
      return null
    }
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
        // The round's snapshot names the commit the round starts from (#68); the checker mock below
        // lists its commits from there, as a checks.sh of template v3 does.
        scenario.roundSha = JSON.parse(prompt.slice(prompt.indexOf('{'), prompt.lastIndexOf('}') + 1)).round_sha || ''
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
      // The replies a round's deferred items waited for (#95) are the same operation under their
      // own label, posted at the end of the run; their reply ids are numbered from 250.
      if (opts.label.startsWith('push') || opts.label.startsWith('deferred replies')) {
        const entries = JSON.parse(prompt.slice(prompt.indexOf('Replies, as JSON:\n[') + 18, prompt.lastIndexOf(']') + 1))
        const base = opts.label.startsWith('deferred replies') ? 250 : 200
        const replies = entries.map((r, i) => ({ finding: r.finding, comment_id: r.comment_id, reply_id: r.route === 'thread' ? base + i : 0 }))
        return { operation: 'push-and-reply', dryRun: false, pushed: true, replies, files: [], error: scenario.pushError || '' }
      }
      // Filing a pass's deferred drafts (#95): one entry per draft in the prompt, answered as
      // redline-gh.sh defer prints it. A draft of mode "issue" opens an issue, numbered from 301,
      // or returns the one scenario.filedRecord already holds with reused true: that object is
      // the pass's record on disk, so a scenario that passes one keeps it across launches, as the
      // file outlives a relaunch. A draft of mode "draft" returns its path and no number.
      // scenario.deferError is the agent's error, and scenario.deferDrop the findings it leaves out.
      if (opts.label.startsWith('file deferred')) {
        const entries = JSON.parse(prompt.slice(prompt.indexOf('Drafts, as JSON:\n[') + 17, prompt.lastIndexOf(']') + 1))
        const record = scenario.filedRecord || (scenario.filedRecord = {})
        const deferred = entries.filter((e) => !(scenario.deferDrop || []).includes(e.finding)).map((e) => {
          const path = e.file.replace('/r/', '')
          if (e.mode === 'draft') {
            return { finding: e.finding, where: 'draft', number: 0, url: '', path, reused: false }
          }
          const reused = Boolean(record[e.finding])
          if (!reused) {
            record[e.finding] = 301 + Object.keys(record).length
          }
          return { finding: e.finding, where: 'issue', number: record[e.finding], url: `https://github.com/o/r/issues/${record[e.finding]}`, path, reused }
        })
        return { operation: 'defer', deferred, error: scenario.deferError || '' }
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
      // scenario.reshapeDrop (#94, R8-5): the ids a reshape alone leaves out, a shape-stage error since the reshape is vetted as the shape is.
      const ids = [...new Set([...prompt.matchAll(/"id": "([RH]\d+-\d+)"/g)].map((m) => m[1]))].filter((id) => !(scenario.shaperDrop || []).includes(id)).filter((id) => !(typeof opts.label === 'string' && opts.label.startsWith('reshape') && (scenario.reshapeDrop || []).includes(id)))
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
      // newly sorts ask (reshapeAsk) or gives a call while sorting as before (reshapeExtraCall),
      // declines (reshapeDecline), or sorts defer with its entry (reshapeDefer, #97, R1-10). It gives
      // a second look only when its prompt asks for one (#94, R9-3).
      const reshape = typeof opts.label === 'string' && opts.label.startsWith('reshape')
      const onReshape = (key) => (reshape && scenario[key]) || []
      // The findings a reshape prompt names as decided (#106): for each, files is its task as
      // plan.md holds it, whatever disposition the reshape returns. By default that is what the
      // scripted resolve planned; scenario.reshapeFiles[id] scripts a task the reshape changed.
      // Each is named with what its decision ends in (#114, R1-3), so the ids are read off the
      // list by their form.
      const decidedLine = reshape ? prompt.match(/Findings the person or the autopilot decided: ([^.]*)\./) : null
      const namedDecided = decidedLine ? [...decidedLine[1].matchAll(/[RH]\d+-\d+/g)].map((m) => m[0]) : []
      // scenario.reshapeFilesAt[label][id] (#114, R2-5) scripts the task one reshape alone
      // changed, by that reshape's label, before scenario.reshapeFiles, which every reshape reads.
      const filesAt = (scenario.reshapeFilesAt && scenario.reshapeFilesAt[opts.label]) || {}
      const taskOf = (id) => (id in filesAt ? filesAt[id] : scenario.reshapeFiles && id in scenario.reshapeFiles ? scenario.reshapeFiles[id] : plannedByResolve[id] || [])
      const disposition = (id) => (onReshape('reshapeDecline').includes(id) ? 'decline' : onReshape('reshapeFix').includes(id) ? 'fix' : onReshape('reshapeDefer').includes(id) ? 'defer' : ask.includes(id) || onReshape('reshapeAsk').includes(id) ? 'ask' : defer.includes(id) ? 'defer' : decline.includes(id) ? 'decline' : none.includes(id) ? 'none' : 'fix')
      // scenario.ownerOf[id] (#94, R5-7) is the decidedBy the shaper writes for that id, to prove the
      // workflow's check of it.
      // The mitigation the shaper writes for a deferred finding (see `deferred` below).
      const mitigationOf = (id) => (scenario.mitigations && id in scenario.mitigations ? scenario.mitigations[id] : scenario.mitigation || 'a guard clause')
      const owner = (id) => (scenario.ownerOf && scenario.ownerOf[id]) || (disposition(id) === 'ask' ? 'pending' : disposition(id) === 'fix' && human ? scenario.shaperOwner || 'reviewer' : 'redline')
      return {
        specFolder: prompt.match(/agent-os\/specs\/[^/\s]+/)[0],
        // Every finding lists the paths its task touches, as the schema requires (#100): a fix
        // has a task, and so has a deferral unless its mitigation is scripted as '' (nothing ships);
        // a decline, an ask and a none have none. scenario.files[id] (#49) scripts a finding's own
        // list, [] for no task. scenario.askRule (#49) adds the shaper's ask-rule tag, only when scripted.
        findings: ids.map((id) => ({
          id, disposition: disposition(id), decidedBy: owner(id), recommendation: `${disposition(id)} ${id} this way`,
          files: namedDecided.includes(id) ? taskOf(id).slice() : scenario.files && id in scenario.files ? scenario.files[id] : disposition(id) === 'fix' || (disposition(id) === 'defer' && mitigationOf(id) !== '') ? ['app/x.php'] : [],
          ...(scenario.askRule && scenario.askRule[id] ? { askRule: scenario.askRule[id] } : {}),
          // scenario.reshapeAskRule (#108, R1-8) adds an ask-rule tag on a reshape alone, as a
          // reshape that newly puts a decided call under a rule returns it.
          ...(reshape && scenario.reshapeAskRule && scenario.reshapeAskRule[id] ? { askRule: scenario.reshapeAskRule[id] } : {}),
          ...(disposition(id) === 'decline' && !(scenario.declineNoReason || []).includes(id) ? { reason: (scenario.reason && scenario.reason[id]) || `the spec keeps ${id} as it is on purpose` } : {}),
          ...(scenario.secondLook && scenario.secondLook[id] && (!reshape || prompt.includes('secondLook')) ? { secondLook: scenario.secondLook[id] } : {}),
        })),
        // scenario.mitigation (#87) is the shaper's mitigation for every deferred finding, and
        // scenario.mitigations[id] (#95) one finding's own, '' or 'none' for a deferral that ships
        // nothing. Each entry carries its drafted issue (title, found, why, fullFix), which the
        // shape and reshape prompts ask for, unless scenario.noDraft names the finding, a
        // shape-stage error. scenario.deferTwice (#97, R2-12) returns a finding's entry twice, the
        // second with another found.
        deferred: ids.filter((id) => defer.includes(id) || onReshape('reshapeDefer').includes(id)).map((id) => ({
          id, mitigation: mitigationOf(id), fullFix: 'a lock',
          // scenario.drafts[id] (#95) replaces fields of one finding's draft, fullFix included.
          // scenario.reshapeDrafts[id] (#95) does the same on a reshape alone: a draft the reshape changed.
          ...((scenario.noDraft || []).includes(id) ? {} : { title: `Lock ${id}`, found: `found ${id}`, why: `why ${id}`, ...((scenario.drafts || {})[id] || {}), ...((reshape && (scenario.reshapeDrafts || {})[id]) || {}) }),
        })).flatMap((entry) => ((scenario.deferTwice || []).includes(entry.id) ? [entry, { ...entry, found: `${entry.found} again` }] : [entry])),
        // scenario.shaperNoCall (#57) leaves an ask without its call; scenario.shaperExtraCall gives a
        // call to a finding sorted otherwise. Both are shape-stage errors.
        // Every option states what it ends in, and the call names the recommended one by its label
        // (#105). By default the recommended option, Keep it, ends in what the scripted resolve
        // plans for the call, as `states` reads it below (defer beside its own deferred entry,
        // accept for an accepted call, fix otherwise), so a scenario is one script for both
        // agents; scenario.ends[id] scripts another end for it. Change it ends in a fix.
        // scenario.callOf[id] replaces fields of one call (its options, its recommended), and
        // scenario.callAt[label][id] does the same for one shaper call alone, by its label.
        judgmentCalls: ids.filter((id) => !onReshape('reshapeOmitCall').includes(id) && ((ask.includes(id) && !(scenario.shaperNoCall || []).includes(id)) || (scenario.shaperExtraCall || []).includes(id) || onReshape('reshapeAsk').includes(id) || onReshape('reshapeExtraCall').includes(id))).map((id) => ({
          id, title: `call ${id}`, story: 's', why_human: (scenario.whyHuman && scenario.whyHuman[id]) || 'product decision',
          options: [{ label: 'Keep it', cost: 'c', effect: 'e', ends: (scenario.ends && scenario.ends[id]) || ((scenario.resolveDeferred || []).some((e) => e.id === id) ? 'defer' : (scenario.acceptedCalls || []).includes(id) ? 'accept' : 'fix') }, { label: 'Change it', cost: 'c', effect: 'e', ends: 'fix' }],
          recommended: 'Keep it', recommendation: 'Keep it', dependsOn: [],
          ...((scenario.callOf || {})[id] || {}), ...(((scenario.callAt || {})[opts.label] || {})[id] || {}),
        })),
      }
    }
    if (t === 'redline:redline-resolve') {
      const ids = [...new Set([...prompt.matchAll(/"([RH]\d+-\d+)": \{/g)].map((m) => m[1]))]
      // An accepted override has no files to touch, nor does a finding left to the person under a
      // repository ask rule (its decision carries rule, #49); everything else gets a task with a file.
      // scenario.acceptedCalls (#93): the judgment calls the person answered with no change.
      // scenario.resolveDeferred (#94, R5-9): the deferred list the resolve agent returns.
      // scenario.resolveFiles[id] (#108, R1-5) scripts one task's files, [] for none, whatever its decision.
      const accepted = new Set([...prompt.matchAll(/"([RH]\d+-\d+)": \{[^}]*"disposition": "accept"/g)].map((m) => m[1]).concat(scenario.acceptedCalls || []))
      const left = new Set([...prompt.matchAll(/"([RH]\d+-\d+)": \{[^}]*"rule": "/g)].map((m) => m[1]))
      // A call whose decision carries its own disposition has no entry in decided (#108, R1-2,
      // R2-1), as the prompt says, so the mock leaves it out as a real agent would, unless
      // scenario.resolveDecided scripts a statement for it.
      const named = new Set([...prompt.matchAll(/"([RH]\d+-\d+)": \{[^}]*"disposition": "/g)].map((m) => m[1]))
      const title = (id) => (accepted.has(id) ? `Accepted, no change: ${id}` : left.has(id) ? `Left to the person: ${id}` : `t ${id}`)
      // What each judgment call's decision ends in, as the resolve agent states it (#99): one entry
      // per call of the prompt's calls block, none for a call left to the person under a rule, and
      // none for a call whose decision names its own disposition. By default it states what a real agent would for what it returned: defer beside its own
      // deferred entry, accept for a call it accepted, fix otherwise. scenario.resolveDecided[id]
      // scripts one, scenario.resolveUnstated lists the calls it leaves out,
      // scenario.resolveDecidedTwice[id] is a second statement for one, and
      // scenario.resolveNoDecided leaves the key out, as a result recorded before #99 holds none.
      const callsFrom = prompt.indexOf('Judgment calls as the shaper wrote them, as JSON:')
      const callsTo = prompt.indexOf('Decisions on them, as JSON')
      const callIds = callsFrom < 0 || callsTo < 0 ? [] : [...new Set([...prompt.slice(callsFrom, callsTo).matchAll(/"id": "([RH]\d+-\d+)"/g)].map((m) => m[1]))]
      const states = (id) => (scenario.resolveDecided && scenario.resolveDecided[id]) || ((scenario.resolveDeferred || []).some((e) => e.id === id) ? 'defer' : (scenario.acceptedCalls || []).includes(id) ? 'accept' : 'fix')
      const decided = callIds
        .filter((id) => !left.has(id) && !(named.has(id) && !(scenario.resolveDecided && id in scenario.resolveDecided)) && !(scenario.resolveUnstated || []).includes(id))
        .flatMap((id) => [{ id, disposition: states(id) }].concat(scenario.resolveDecidedTwice && scenario.resolveDecidedTwice[id] ? [{ id, disposition: scenario.resolveDecidedTwice[id] }] : []))
      // scenario.resolveExtraTasks (#106): tasks the resolve agent returns beside the ones for the
      // decisions it was given, as an agent that returns the plan's whole task list does.
      // scenario.resolveFilesAt[label][id] (#114, R3-4) scripts the task one resolve alone
      // returns, by that resolve's label, before scenario.resolveFiles, which every resolve reads.
      const resolveAt = (scenario.resolveFilesAt && scenario.resolveFilesAt[opts.label]) || {}
      const tasks = ids.map((id, i) => ({ n: i + 2, title: title(id), files: id in resolveAt ? resolveAt[id] : scenario.resolveFiles && id in scenario.resolveFiles ? scenario.resolveFiles[id] : accepted.has(id) || left.has(id) ? [] : ['app/x.php'], finding: id })).concat(scenario.resolveExtraTasks || [])
      for (const id of ids) {
        plannedByResolve[id] = tasks.filter((task) => task.finding === id).flatMap((task) => task.files)
      }
      return { specFolder: 'x', tasks, deferred: scenario.resolveDeferred ? scenario.resolveDeferred.slice() : [], ...(scenario.resolveNoDecided ? {} : { decided }), unresolved: scenario.unresolved ? scenario.unresolved.slice() : [] }
    }
    if (t === 'redline:redline-plan-approver') {
      // scenario.planBounce (#10): the plan approver bounces the plan this many times first.
      if (scenario.planBounce && planN++ < scenario.planBounce) {
        return { approved: false, adjustments: [{ task: 2, problem: 'p', change: 'c' }], planPaths: [], notes: '' }
      }
      // scenario.planPaths (#95) is the list an approved plan names, 'app/x.php' when absent; a
      // list of lists gives each approval its own, in order.
      const named = scenario.planPaths ? (Array.isArray(scenario.planPaths[0]) ? scenario.planPaths[approvedN] || ['app/x.php'] : scenario.planPaths) : ['app/x.php']
      approvedN += 1
      return { approved: true, adjustments: [], planPaths: named.slice(), notes: '' }
    }
    if (t === 'redline:redline-standards-approver') {
      return { approved: [], rejected: [], deferred: [], noChanges: true }
    }
    if (t === 'redline:redline-implementer') {
      // scenario.implementerCommits (#94, R6-5): the commits the implementer reports, by default none;
      // scenario.repairCommits (#94, R7-9): what a repair pass reports, by default none.
      const reported = typeof opts.label === 'string' && opts.label.startsWith('repair') ? scenario.repairCommits : scenario.implementerCommits
      return { commits: reported ? reported.slice() : [], checks: { ok: true, runs: 1 }, deviations: [], blocked: [] }
    }
    if (t === 'redline:redline-checker') {
      // scenario.checker(label, out) replaces the result of one call (#9: a stray error, a failing
      // gate, an unreadable result); nothing returned keeps the default.
      let out
      if (opts.label.endsWith(' verdict')) {
        // checks.sh --verdict (#68): what the gate run before it kept, marked verdict and without
        // any check's output. It runs nothing, so it adds no commit.
        const gate = scenario.lastGate
        out = { ...gate, result: { ...gate.result, verdict: true, checks: gate.result.checks.map(({ truncated, stdout, stderr, ...rest }) => rest) } }
      } else if (opts.label === 'baseline') {
        out = { exit: 0, status: 'read', reason: '', result: { mode: 'baseline', ok: true, checks: [{ name: 'check', exit: 0, recorded: false }], git: null }, error: '' }
        scenario.lastGate = out
      } else {
        scenario.allCommits.push(...(scenario.commitIds.shift() || []))
        // A checks.sh of template v3 lists the commits after the snapshot's round_sha and counts
        // every commit since the start (#68); scenario.oldChecks is one from before it, which lists
        // them all and gives no count.
        const all = scenario.allCommits.map((id, i) => ({ sha: SHA(i + 1), message: id.startsWith('redline:') ? id : `redline: ${id} fix` }))
        const from = scenario.oldChecks ? 0 : scenario.allCommits.findIndex((id, i) => SHA(i + 1) === scenario.roundSha) + 1
        out = { exit: 0, status: 'read', reason: '', result: { mode: 'full', ok: true, checks: [{ name: 'check', exit: 0, recorded: false }], git: { unexpected_files: [], uncommitted: [], commits: all.slice(from).reverse(), ...(scenario.oldChecks ? {} : { commits_count: all.length }), diff_lines: 3 } }, error: '' }
        scenario.lastGate = out
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
// Since #95 a guided run stops for a deferred item's draft, in the round by default. goAhead(ids)
// is the person letting each draft go ahead as drafted, at its first version. A scenario whose
// subject is not the stop passes it from the first launch: the answer is read at the stop check
// and at filing, and by no prompt before, which the stop's own scenarios prove.
// A call answered in the person's own words (#105): a decision that names no option, whose end
// the resolve agent states. Until #105 autopilot's decision was stated too, and the cases that
// script a statement ran on that dial; autopilot now picks the call's recommended option, so
// those cases are answered here, by the person, from the first launch.
const typedAnswer = (...ids) => Object.fromEntries(ids.map((id) => [id, { choice: 'In their own words', notes: `The author answers ${id} in their own words.`, date: '2026-11-18' }]))
const goAhead = (...ids) => Object.fromEntries(ids.map((id) => [id, { action: 'file', title: '', notes: '', date: '2026-11-16', draft: 1 }]))
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
// No reshape prompt of a round with no decided finding holds the decided-findings block (#106):
// every run is read, and one check at the end names the offenders.
const DECIDED_BLOCK = 'Findings the person or the autopilot decided: '
const strayDecidedBlock = []
// What a reshape prompt that names decided findings asks of a finding's files (#114, R1-4): an
// ask the block does not name, pending or newly raised, by its recommended paths (#114, R2-4), a
// named finding by its task, and never the clause that covers both (#103, R2-5). Every run is
// read, and one check at the end names the offenders.
const FILES_PENDING = 'for an ask, the paths its recommended change would touch)'
const FILES_DECIDED = 'for an ask not named above as decided, the paths its recommended change would touch; for a finding named above as decided, the paths of its task as plan.md holds it)'
const doubleFilesAsk = []
// Whether a stop was the workflow's own check of what an agent returned (#116): every error result
// of every scenario says so in ownCheck, true for the stops of the sites below (the resolve's,
// the hold and the checks of the shaper's result, one of which words its stop two ways) and
// false for every other. The skill and the resume line read the field, so a site that drops it,
// and one that gains it, are both red here. Every run is read, and two checks at the end name
// the offenders and any site no scenario reached.
const OWN_CHECKS = [
  ['resolve', /^the resolve agent stated no disposition for /],
  ['resolve', /^the resolve agent deferred .* with no drafted issue/],
  ['resolve', /^the resolve agent returned no deferred entry for /],
  ['resolve', /^the resolve agent stated defer for .* with no deferred entry/],
  ['resolve', /^the resolve agent stated fix for .* with no task with files/],
  ['resolve', /^the resolve agent stated accept beside a task with files for /],
  ['resolve', /^the resolve agent planned no task with files for /],
  ['resolve', /^the resolve agent planned a task with files for /],
  ['shape', /^the reshape left /],
  ['shape', /^the shaper declined .*; in a human review pass/],
  ['shape', /^the shaper deferred .*; in a human review pass/],
  ['shape', /^the shaper sorted .* with a human review pass's values/],
  ['shape', /^the shaper gave no disposition for /],
  ['shape', /^the shaper marked .* as ask but returned no judgment call/],
  ['shape', /^the shaper returned a judgment call for /],
  ['shape', /^the shaper asked about .* because of /],
  ['shape', /^the shaper declined .* with no reason/],
  ['shape', /^the shaper deferred .* with no drafted issue/],
  ['shape', /^the shaper gave .* an option with no label or with no end the workflow knows/],
  ['shape', /^the shaper gave .* more than one option labelled /],
  ['shape', /^the shaper recommended .*, which is the label of none of its options/],
  ['shape', /^the shaper gave .*, a call for a finding left to the person, an option that ends in defer with no complete drafted issue/],
].map(([stage, re]) => ({ stage, re, seen: 0 }))
const ownWrong = []
// No reshape is told to rewrite its spec folder from scratch (#117), on a first run or a resume:
// every reshape prompt of every scenario is read. And what a resume line says is said on a
// resume only: no prompt of a run that passes no resume entry holds the line or one of its
// clauses. Two checks at the end name the offenders.
const REWRITE_SENTENCE = 'from scratch, replacing what the earlier attempt wrote'
const RESUME_WORDS = ['Resume attempt', 'nothing was fixed by hand for it', 'This step is a reshape, so the spec folder already holds the earlier work of this round', REWRITE_SENTENCE]
const rewrittenReshape = []
const strayResumeWords = []

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
  rewrittenReshape.push(...calls.filter((c) => /^reshape /.test(c.label || '') && c.prompt.includes(REWRITE_SENTENCE)).map((c) => `${name}: ${c.label}`))
  if (!args || !args.resume || Array.isArray(args.resume) || Object.keys(args.resume).length === 0) {
    strayResumeWords.push(...calls.filter((c) => RESUME_WORDS.some((words) => c.prompt.includes(words))).map((c) => `${name}: ${c.label}`))
  }
  if (!thrown && res && res.status === 'error') {
    const own = OWN_CHECKS.find((k) => k.stage === res.stage && k.re.test(res.error || ''))
    if (own && res.ownCheck === true && res.resumeFrom) {
      own.seen += 1
    }
    if (res.ownCheck !== Boolean(own)) {
      ownWrong.push(`${name}: ${res.stage}: ${String(res.error).slice(0, 70)} (ownCheck ${JSON.stringify(res.ownCheck)})`)
    }
  }
  calls.forEach((c, i) => {
    if (c.agentType !== 'redline:redline-shaper' || !c.prompt.includes(DECIDED_BLOCK)) {
      return
    }
    if (c.prompt.includes(FILES_PENDING)) {
      doubleFilesAsk.push(`${name}: ${c.label}`)
    }
    const approver = calls.slice(0, i).reverse().find((x) => x.agentType === 'redline:redline-plan-approver')
    if (!approver || approver.prompt.includes('(these are decided, not pending): none')) {
      strayDecidedBlock.push(`${name}: ${c.label}`)
    }
  })
  // Every run that reaches Finish ends with the run-record commit: after the closing comment, or
  // after the post of a review-only run or the replies of a revise-only run (#10).
  if (!thrown && (res.status === 'capped' || res.status === 'review-only' || 'handoffPosted' in res || 'humanReview' in res) && !scenario.recordFiles) {
    const tail = calls.slice(-3).map((c) => c.label)
    const before = res.status === 'review-only' ? /^post r\d+$/ : res.reviseOnly ? /^(push and reply|deferred replies) r\d+$/ : /comment$/
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
const dispositionEnum = (calls, label) => {
  const schema = (pick(calls, label) || { opts: {} }).opts.schema || {}
  const item = ((schema.properties || {}).findings || {}).items || {}
  return ((item.properties || {}).disposition || {}).enum || []
}
// The keys a shaper call's schema requires of every finding, [] when the call or the path is absent (#100).
const findingRequired = (calls, label) => {
  const schema = (pick(calls, label) || { opts: {} }).opts.schema || {}
  return (((schema.properties || {}).findings || {}).items || {}).required || []
}
// What every shape, human-pass and reshape prompt asks of a finding's files (#100).
const FILES_ASKED = 'an empty list when it has no task'
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
  check('guided: the handoff lists what was put to the person, then what was fixed, folded, each with its owner, and has no Decisions list', handoff.includes('### Put to @author (1)\n\n- **R1-2** title R1-2: The author keeps it because the board already shows it. Applied in 2bbbbbb. · decided by: @author\n\n### Fixed (1)\n\n<details>\n<summary>With the commits that fixed each</summary>\n\n- **R1-1** title R1-1: fixed in 1bbbbbb · decided by: redline\n\n</details>') && !handoff.includes('### Decisions'), handoff)
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
  // An accept that keeps a decline is the person's decision, put to them on the plan dial, and no
  // overrule; an accept on a fix still is one (the check above) (#94, R2-10).
  const keptDecline = await go('plan: an accept that keeps a decline', { ...round1, approvedPlans: [1, 2] }, { ...scenario, decline: ['R1-1'] })
  const keptHandoff = comment(keptDecline.calls, 'handoff comment')
  check('plan: an accept that keeps a decline is listed as put to the person, never as overruled', keptDecline.res.status === 'done' && keptHandoff.includes('- Round 1 (pr): 2 items: 2 put to @author;') && !keptHandoff.includes('### Overruled by') && (keptDecline.res.decided || []).some((d) => d.id === 'R1-1' && d.overruled === false && d.kind === 'decided'), [keptDecline.res.status, keptHandoff, keptDecline.res.decided])
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
  // A round with no finding to pick is not one whose findings were all dropped (#94, R8-7): the
  // handoff opens with the generic ending and the note says there was nothing to pick, while a round
  // whose findings were all dropped still says none was picked.
  const nothingToPick = await go('review: a round with no finding to pick', { ...reviewArgs, selected: { act: [], dropped: {} } }, { reviews: [[]] })
  const nothingHandoff = comment(nothingToPick.calls, 'handoff comment') || ''
  check('review: a round with no finding to pick opens the handoff with the generic ending, and one whose findings were all dropped says none was picked', nothingToPick.res.status === 'done' && nothingHandoff.includes('Redline ran 1 review round; the last one verified no new correctness item to fix or ask about.') && !nothingHandoff.includes('none of its findings was picked') && nothingToPick.res.note === 'The round had no finding to pick, so there was no revise pass.' && (comment(none.calls, 'handoff comment') || '').includes('Redline ran 1 review round; none of its findings was picked to act on.') && none.res.note === 'No finding was selected to act on, so there was no revise pass.', [nothingToPick.res.status, nothingToPick.res.note, nothingHandoff])
  const later =await go('review: round 2 is guided', { ...reviewArgs, selected: { act: ['R1-1'], dropped: {} } }, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')], []], ask: ['R2-1'], commitIds: [['R1-1'], ['R2-1']] })
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
  // The result lists what the scope declined apart, beside the round's findings, so the skill's
  // summaries can name it (#94, R3-8).
  check('scope: the result lists each round\'s scope-declined items under scoped, and findings keeps them', JSON.stringify(run.res.rounds.map((r) => (r.scoped || []).map((x) => x.id))) === '[["R1-2"],["R2-1"]]' && run.res.rounds[0].findings.length === 2, run.res.rounds.map((r) => [r.findings, r.scoped]))
  check('scope: the review body lists it once under the scope, with no bold id and no inline comment', scopeBody.body.includes('### Correctness (1)\n\n- **R1-1** · correctness · low · confirmed · `app/x.php:1` · title R1-1\n\n### Declined under this run\'s scope (correctness only) (1)\n\n- R1-2 · `app/x.php:1` · title R1-2\n') && !scopeBody.body.includes('### Other items') && scopeBody.comments.length === 1 && scopeBody.comments[0].body.startsWith('**R1-1** · '), scopeBody)
  check('scope: the next review sees the scope decline as an outcome', pick(run.calls, 're-review r2').prompt.includes('"outcome": "declined: outside this run\'s scope (correctness only) · decided by: redline"'), pick(run.calls, 're-review r2').prompt.slice(0, 2500))
  check('scope: done after the correctness-free re-review, no nit pass', run.res.status === 'done' && run.res.rounds.length === 2 && !labels(run.calls).some((l) => l.startsWith('final nit pass')), labels(run.calls))
  check('scope: shape prompt carries only the correctness finding', !pick(run.calls, 'shape r1').prompt.includes('R1-2'))
  check('scope: reported in the result', run.res.scope === 'correctness')
  const all = await go('scope all (default) keeps the nit pass', baseArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], [f('R2-1', 'nit')], []], commitIds: [['R1-1', 'R1-2'], ['R2-1']] })
  check('scope all: the final nit pass still runs', all.res.status === 'done' && labels(all.calls).includes('final nit pass r3'), labels(all.calls))
  check('scope all: a run without the scope writes no scoped key in its findings file', !('scoped' in findingsFile(all.calls, 'post r1')) && (findingsFile(all.calls, 'post r1').findings || []).length === 2, findingsFile(all.calls, 'post r1'))
  // The closing sentence says the scope-declined items get neither a comment nor a reply (#94, R1-6).
  check('scope: the closing sentence says the items declined under the scope have no inline comment and no reply, and a run without the scope says nothing of them', scopeBody.body.includes(`${CLOSING} The items declined under this run's scope have no inline comment and no reply.`) && !(pick(all.calls, 'post r1') || { prompt: '' }).prompt.includes('declined under this run\'s scope have no inline comment'), scopeBody.body)
  // A final nit pass reports correctness only, and a nit its reviewer reports anyway is declined
  // by the workflow under the pass's scope, never dropped (#94, R7-10): kept in the round with its
  // outcome, listed once in the round's review body and in the handoff, with no thread, never shaped.
  const nitPassNit = await go('scope: a nit the final nit pass reports anyway', baseArgs, { reviews: [[f('R1-1', 'nit')], [f('R2-1', 'nit')]], commitIds: [['R1-1']] })
  const nitPassPost = (pick(nitPassNit.calls, 'post r2') || { prompt: '' }).prompt
  const nitPassHandoff = comment(nitPassNit.calls, 'handoff comment') || ''
  check('scope: a nit the final nit pass reports is declined under the pass\'s scope, kept in the round, listed in its review body and the handoff, never shaped', nitPassNit.res.status === 'done' && JSON.stringify((nitPassNit.res.rounds[1].scoped || []).map((x) => x.id)) === '["R2-1"]' && (nitPassNit.res.rounds[1].outcomes || {})['R2-1'] === 'declined: outside the final nit pass\'s scope (correctness only) · decided by: redline' && nitPassPost.includes('### Declined under the final nit pass\'s scope (correctness only) (1)\\n\\n- R2-1 · `app/x.php:1` · title R2-1') && nitPassHandoff.includes('### Declined under the final nit pass\'s scope (correctness only) (1)\n\n- R2-1 · `app/x.php:1` · title R2-1') && !labels(nitPassNit.calls).includes('shape r2'), [nitPassNit.res.status, labels(nitPassNit.calls), nitPassHandoff])
}

// ---------------------------------------------------------------------------
// 6. Regressions from earlier steps: defer + nits, the final nit pass, the cap, a dry run,
//    review only, and a bad interrupt word.
// ---------------------------------------------------------------------------
{
  let run = await go('defer + nits, round 2 clean', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit'), f('R1-3', 'nit')], []], defer: ['R1-1'], commitIds: [['R1-1', 'R1-2', 'R1-3']] })
  check('defer: done', run.res.status === 'done')
  check('defer: R1-1 reply', replyFor(run.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: deferred to #301. Mitigated in 1bbbbbb (redline: R1-1 fix). · decided by: redline', replyFor(run.calls, 'push and reply r1', 'R1-1'))
  check('defer: deferred list', run.res.deferred.length === 1 && run.res.deferred[0].commentId === 100)
  check('defer: every prompt names the authority', run.calls.every((c) => c.prompt.includes('args.decisions, args.selected, args.approvedPlans and args.deferrals')))
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
  // A decision's disposition is one of the three when it names one (#108, R2-6): every reader of
  // it matches the exact values, so any other is refused before any agent runs. Its neighbour, a
  // lower-case fix, runs on (`namedCall`), and so does a decision with no disposition at all.
  run = await go('bad decision disposition', { ...baseArgs, decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-18', disposition: 'Fix' } } }, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'] })
  check('bad decision disposition: refused before any agent runs', Boolean(run.thrown) && /args\.decisions must give a disposition of fix \| defer \| accept/.test(run.thrown.message) && run.calls.length === 0, run.thrown && run.thrown.message)
  // An empty or a null disposition names none (#108, R3-1), as every reader of the field reads it:
  // the decision runs on as a call with no disposition, its resolve prompt shows none, and the
  // agent states one. The neighbour above, a value outside the three, is still refused.
  run = await go('empty decision disposition', { ...baseArgs, decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-18', disposition: '' }, 'R1-2': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-18', disposition: null } } }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-1', 'R1-2'], commitIds: [['R1-1', 'R1-2']] })
  const emptyResolve = (pick(run.calls, 'resolve r1') || { prompt: '' }).prompt
  check('empty decision disposition: an empty and a null one each run on as no disposition, and the resolve prompt shows neither', !run.thrown && (run.res || {}).status === 'done' && emptyResolve !== '' && !emptyResolve.includes('"disposition": ""') && !emptyResolve.includes('"disposition": null'), [run.thrown && run.thrown.message, (run.res || {}).status, (run.res || {}).error])
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
  // Its earlier thread stays open, named as the handoff names it (#94, R1-19).
  const scopeThreads = run.res.threads || { open: [] }
  check('carry: the earlier thread of a carried finding the scope declined stays open as declined under the scope', scopeThreads.open.some((o) => o.id === 'R1-3' && o.reason === 'declined under the scope') && comment(run.calls, 'handoff comment').includes('R1-3 (declined under the scope)'), [scopeThreads, comment(run.calls, 'handoff comment').slice(0, 400)])

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
  // A spilled result is asked for again as checks.sh --verdict (#68; the cases are in the next
  // section). Here the verdict gives nothing, as from a checks.sh made before template v3, so the
  // run stops as it always did.
  const noVerdict = { exit: 2, status: 'read', reason: '', result: null, error: 'checks.sh: unknown flag --verdict' }
  run = await go('checker: result unreadable (spilled)', baseArgs, { ...base, checker: (label) => (label === 'check r1' ? unreadable('spilled', null, 'Output too large; saved to /tmp/out.txt') : label === 'check r1 verdict' ? noVerdict : null) })
  check('unreadable: stops at check with the cause and the fix, no repair', stopped(run) && run.res.error.includes('exceeded the Bash tool\'s inline limit') && run.res.error.includes('checks.sh --verdict exited 2: checks.sh: unknown flag --verdict') && run.res.error.includes('run /redline:setup') && run.res.error.includes('/p/scripts/checks-template.sh') && run.res.error.includes('the checker said: Output too large'), [brief(run), labels(run.calls)])
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
  run = await go('checker: spilled with a complete result', baseArgs, { ...base, checker: (label, out) => (label === 'check r1' ? { ...out, status: 'result_unreadable', reason: 'spilled' } : label === 'check r1 verdict' ? noVerdict : null) })
  check('override: a run-level reason stops even with a complete result, no warning', stopped(run) && run.res.error.includes('exceeded the Bash tool\'s inline limit') && !run.res.warnings.some((w) => w.includes('overrode')), [brief(run), run.res.warnings])
  check('override: the result that came with a spilled status is never read; the verdict is asked for', labels(run.calls).includes('check r1 verdict'), labels(run.calls))
  run = await go('checker: full pass git null read as no_git_block', baseArgs, { ...base, checker: (label, out) => (label === 'check r1' ? { ...out, status: 'result_unreadable', reason: 'no_git_block', result: { ...out.result, git: null } } : null) })
  check('override: a full pass with git null is read, then stops on the missing block', stopped(run) && run.res.error.includes('the checker result has no git block') && run.res.warnings.includes(`round 1: ${overrode('no_git_block')}`), [brief(run), run.res.warnings])
  check('override: the stop record keeps the copy the workflow read, the checker\'s reason only in the warning', kept(run).status === 'read' && kept(run).reason === '' && (kept(run).result || {}).git === null && Array.isArray((kept(run).result || {}).checks), [kept(run), run.res.warnings])
  run = await go('checker: baseline unreadable', baseArgs, { ...base, checker: (label) => (label === 'baseline' ? unreadable('spilled', null, '') : label === 'baseline verdict' ? noVerdict : null) })
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
// 9a. The gate's result is sized for the workflow (#68). The round snapshot names the commit the
//     round starts from (round_sha), so checks.sh lists the round's own commits; it is the same on a
//     resumed attempt of the round, so what a failed attempt committed is still listed and checked.
//     A result the Bash tool could not show (spilled) is asked for again as checks.sh --verdict,
//     which runs nothing: a passing verdict lets the round go on, a failing one is repaired, and no
//     verdict stops the run as before, resumable from the check.
// ---------------------------------------------------------------------------
{
  const base = { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] }
  const snap = '/r/agent-os/specs/2026-10-20-1600-114-review-round-1/redline/snapshot.json'
  const snapshotOf = (run, label) => {
    const p = pick(run.calls, label).prompt
    return JSON.parse(p.slice(p.indexOf('{'), p.lastIndexOf('}') + 1))
  }
  const promptOf = (run, label) => (pick(run.calls, label) || { prompt: "" }).prompt
  const lastLine = (run, label) => promptOf(run, label).split("\n").pop()
  const roundShas = (run) => run.res.rounds.map((r) => r.commits.map((c) => c.sha).join('+')).join(' | ')
  const brief = (run) => [run.res.status, run.res.stage, run.res.error]

  const two = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], [f('R2-1', 'correctness')], []], commitIds: [['R1-1', 'R1-2'], ['R2-1']] }
  let run = await go('round_sha: two rounds', baseArgs, two)
  check('round_sha: the first round starts from the run\'s start commit', run.res.status === 'done' && snapshotOf(run, 'snapshot r1').round_sha === baseArgs.startSha, [brief(run), snapshotOf(run, 'snapshot r1')])
  check('round_sha: the second round starts from the newest commit the first round listed', snapshotOf(run, 'snapshot r2').round_sha === SHA(2), snapshotOf(run, 'snapshot r2'))
  check('round_sha: the key sits beside start_sha in the snapshot', Object.keys(snapshotOf(run, 'snapshot r2')).join() === 'pr,start_sha,round_sha,base_ref,files,plan_paths', Object.keys(snapshotOf(run, 'snapshot r2')))
  check('round_sha: each round records its own commits, oldest first', roundShas(run) === `${SHA(1)}+${SHA(2)} | ${SHA(3)} | `, roundShas(run))
  run = await go('round_sha: a checks.sh from before template v3', baseArgs, { ...two, oldChecks: true })
  check('round_sha: an older checks.sh lists every commit since the start, and each round still records only its own', run.res.status === 'done' && roundShas(run) === `${SHA(1)}+${SHA(2)} | ${SHA(3)} | `, [brief(run), roundShas(run)])
  // A reply and the handoff quote a commit's whole subject (#94, R6-5). A checks.sh of template v3
  // cuts a subject over 100 characters for what the workflow matches, so the workflow quotes the
  // first line of the message the implementer reported for that commit when it opens with the part
  // the cut kept; a commit the implementer did not report, or one whose report does not open so,
  // is quoted as the git block gave it, and the round records git's own text either way.
  const whole = 'redline: R1-1 keep the whole subject of a long commit in the reply and in the handoff list of commits (#93)'
  const cutSubject = 'redline: R1-1 keep the whole subject of a long commit in the reply and in the handoff list of...'
  const longCut = { reviews: [[f('R1-1', 'correctness')], []], commitIds: [[cutSubject]] }
  const quoted = await go('subject: the implementer reported the whole subject', baseArgs, { ...longCut, implementerCommits: [{ sha: SHA(1), finding: 'R1-1', message: whole }] })
  check('subject: the reply and the handoff quote the whole subject, and the round records git\'s cut one', quoted.res.status === 'done' && replyFor(quoted.calls, 'push and reply r1', 'R1-1').includes(`fixed in 1bbbbbb (${whole})`) && comment(quoted.calls, 'handoff comment').includes(`- 1bbbbbb ${whole}`) && quoted.res.rounds[0].commits[0].message === cutSubject, [brief(quoted), replyFor(quoted.calls, 'push and reply r1', 'R1-1')])
  const unreported = await go('subject: the implementer reported no commit', baseArgs, longCut)
  const otherText = await go('subject: the implementer reported another subject', baseArgs, { ...longCut, implementerCommits: [{ sha: SHA(1), finding: 'R1-1', message: 'redline: R1-1 a different subject that is long enough to pass the cut of one hundred characters in all (#93)' }] })
  check('subject: with no report, or one that does not open with the cut\'s kept part, the cut subject is quoted', [unreported, otherText].every((r) => r.res.status === 'done' && replyFor(r.calls, 'push and reply r1', 'R1-1').includes(`fixed in 1bbbbbb (${cutSubject})`) && comment(r.calls, 'handoff comment').includes(`- 1bbbbbb ${cutSubject}`)), [unreported, otherText].map((r) => replyFor(r.calls, 'push and reply r1', 'R1-1')))
  // A subject under 100 characters but over 100 bytes is cut by macOS's awk, which counts bytes,
  // and is still quoted whole (#94, R7-6): the workflow knows the cut by its marker, not its length.
  const dash = String.fromCharCode(0x2014)
  const wideWhole = `redline: R1-1 quote the whole subject when awk counts bytes ${dash} a dash ${dash} is three ${dash} of them (#93)`
  const wideCut = `redline: R1-1 quote the whole subject when awk counts bytes ${dash} a dash ${dash} is three ${dash} of them...`
  const wide = await go('subject: a subject cut in bytes', baseArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [[wideCut]], implementerCommits: [{ sha: SHA(1), finding: 'R1-1', message: wideWhole }] })
  check('subject: a subject under 100 characters that awk cut in bytes is quoted whole', wide.res.status === 'done' && wideWhole.length < 100 && replyFor(wide.calls, 'push and reply r1', 'R1-1').includes(`fixed in 1bbbbbb (${wideWhole})`) && comment(wide.calls, 'handoff comment').includes(`- 1bbbbbb ${wideWhole}`), [brief(wide), replyFor(wide.calls, 'push and reply r1', 'R1-1')])

  // A resumed attempt of round 2: check r2 failed after the first attempt's commit, the repair
  // committed again and recheck r2 failed, the person fixed the cause and the run resumed there.
  const failing = (out) => ({ ...out, exit: 1, result: { ...out.result, ok: false, checks: [{ name: 'check', cmd: 'c', exit: 1, recorded: false, truncated: false, stdout: 'boom', stderr: '' }] } })
  const three = { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')], []], commitIds: [['R1-1'], ['R2-1'], ['redline: R2-1 the repair']] }
  const first = await go('round_sha: error at recheck r2', baseArgs, { ...three, checker: (label, out) => (label === 'check r2' || label === 'recheck r2' ? failing(out) : null) })
  check('round_sha: the stop names recheck r2', first.res.status === 'error' && JSON.stringify(first.res.resumeFrom) === JSON.stringify({ label: 'recheck r2', attempt: 2 }), [brief(first), first.res.resumeFrom])
  const resumeArgs = { ...baseArgs, resume: { 'recheck r2': { attempt: 2, error: first.res.error, hand: { commits: [], paths: [] } } } }
  const second = await go('round_sha: the resumed attempt', resumeArgs, { ...three, checker: (label, out) => (label === 'check r2' ? failing(out) : null) })
  samePrefix('round_sha: the resumed attempt', first.calls, second.calls, first.calls.findIndex((c) => c.label === 'recheck r2'))
  check('round_sha: a resumed attempt of the round keeps the round\'s starting commit', snapshotOf(first, 'snapshot r2').round_sha === SHA(1) && snapshotOf(second, 'snapshot r2').round_sha === SHA(1), [snapshotOf(first, 'snapshot r2').round_sha, snapshotOf(second, 'snapshot r2').round_sha])
  check('round_sha: the commits the failed attempt made are listed in the resumed round', second.res.status === 'done' && roundShas(second) === `${SHA(1)} | ${SHA(2)}+${SHA(3)} | `, [brief(second), roundShas(second)])
  const wip = { sha: SHA(8), message: 'wip from the first attempt' }
  const third = await go('round_sha: the failed attempt left a commit without the prefix', resumeArgs, { ...three, checker: (label, out) => (label === 'check r2' ? failing(out) : label === 'recheck r2' ? { ...out, exit: 1, result: { ...out.result, git: { ...out.result.git, commits: out.result.git.commits.concat([wip]) } } } : null) })
  check('round_sha: and they are checked: one without the redline: prefix still fails the resumed round', third.res.status === 'error' && third.res.stage === 'check' && third.res.error.includes(`commits without the redline: prefix: ${SHA(8).slice(0, 7)}`), brief(third))
  // After a repair pass a commit the first attempt made is quoted whole too (#94, R7-9): the
  // workflow reads every attempt's report, not the last one's.
  const afterRepair = await go('subject: a long subject from the attempt before a repair', baseArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [[cutSubject], ['redline: R1-1 the repair']], implementerCommits: [{ sha: SHA(1), finding: 'R1-1', message: whole }], repairCommits: [{ sha: SHA(2), finding: 'R1-1', message: 'redline: R1-1 the repair' }], checker: (label, out) => (label === 'check r1' ? failing(out) : null) })
  check('subject: after a repair pass the first attempt\'s commit is quoted whole in the reply and the handoff', afterRepair.res.status === 'done' && labels(afterRepair.calls).includes('repair r1') && replyFor(afterRepair.calls, 'push and reply r1', 'R1-1').includes(`1bbbbbb (${whole})`) && comment(afterRepair.calls, 'handoff comment').includes(`- 1bbbbbb ${whole}`), [brief(afterRepair), replyFor(afterRepair.calls, 'push and reply r1', 'R1-1')])

  // The verdict.
  const spilled = { exit: 0, status: 'result_unreadable', reason: 'spilled', result: null, error: 'Output too large; saved to /tmp/out.txt' }
  const onSpill = (verdictOf) => (label, out) => (label === 'check r1' ? spilled : label === 'check r1 verdict' ? verdictOf(out) : null)
  const repaired = (r) => labels(r.calls).some((l) => l.startsWith('repair'))
  const warning = 'checks.sh\'s result was too large for the Bash tool to show, so the workflow read the verdict checks.sh kept for that run (checks.sh --verdict), which carries no check\'s output'
  run = await go('verdict: spilled, the kept verdict passes', baseArgs, { ...base, checker: onSpill(() => null) })
  const asked = pick(run.calls, 'check r1 verdict')
  check('verdict: a spilled result whose kept verdict passes goes on to push and reply, with no repair', run.res.status === 'done' && !!asked && !repaired(run) && !!pick(run.calls, 'push and reply r1') && run.res.rounds[0].check.pass === true, [brief(run), labels(run.calls)])
  check('verdict: the verdict is the next call after the check, by the checker, under the check\'s label', !!asked && labels(run.calls).indexOf('check r1 verdict') === labels(run.calls).indexOf('check r1') + 1 && asked.agentType === 'redline:redline-checker' && asked.opts.phase === 'Check', labels(run.calls))
  check('verdict: its command is checks.sh --verdict with the round\'s snapshot, the prompt\'s last line', !!asked && asked.prompt.split('\n').pop() === `/r/.claude/redline/checks.sh --verdict ${snap}`, asked && asked.prompt.split('\n').pop())
  check('verdict: the prompt says the gate has run and that this command runs no check', !!asked && asked.prompt.includes('The gate has run, and the tool could not show its result.') && asked.prompt.includes('it runs no check and prints the verdict checks.sh kept for that run') && asked.prompt.includes('A usage error (exit 2) is status read with result null, never result_unreadable.') && !asked.prompt.includes('resume attempt'), asked && asked.prompt)
  check('verdict: one warning names the spill and the verdict', run.res.warnings.filter((w) => w.includes('--verdict')).join('|') === `round 1: ${warning}`, run.res.warnings)
  check('verdict: the round records the commits the verdict listed', roundShas(run) === `${SHA(1)} | `, roundShas(run))
  const failed = (out) => ({ ...out, exit: 1, result: { ...out.result, ok: false, checks: [{ name: 'guard', cmd: 'tests/guard-test.sh', exit: 1, recorded: false }] } })
  run = await go('verdict: spilled, the kept verdict fails', baseArgs, { ...base, checker: onSpill(failed) })
  const repair = pick(run.calls, 'repair r1')
  check('verdict: a failing verdict sends one repair pass, and the recheck passes', run.res.status === 'done' && !!repair && labels(run.calls).filter((l) => l.startsWith('repair')).length === 1, [brief(run), labels(run.calls)])
  check('verdict: the repair prompt names the failing checks and says their output was not relayed', !!repair && repair.prompt.includes('failing checks: guard') && repair.prompt.includes('--- guard (exit 1): tests/guard-test.sh') && repair.prompt.includes('The gate\'s result was too large for the checker to relay, so no output of the failing checks is quoted here: run the gate and read it.'), repair && repair.prompt.slice(-900))
  run = await go('checker: a failing check read in full', baseArgs, { ...base, checker: (label, out) => (label === 'check r1' ? failing(out) : null) })
  check('verdict: a result read in full carries no such sentence', !!pick(run.calls, 'repair r1') && !pick(run.calls, 'repair r1').prompt.includes('too large for the checker to relay') && !labels(run.calls).includes('check r1 verdict'), labels(run.calls))
  const stale = { exit: 2, status: 'read', reason: '', result: null, error: 'checks.sh: the kept result here is for commit abc, and HEAD is now def; run the gate again' }
  run = await go('verdict: spilled, no kept result for this commit', baseArgs, { ...base, checker: onSpill(() => stale) })
  check('verdict: with no kept result the run stops at check as before, both causes named, no repair', run.res.status === 'error' && run.res.stage === 'check' && !repaired(run) && !pick(run.calls, 'push and reply r1') && run.res.error.includes('exceeded the Bash tool\'s inline limit') && run.res.error.includes('checks.sh --verdict exited 2: checks.sh: the kept result here is for commit abc, and HEAD is now def; run the gate again') && run.res.error.includes('the checker said: Output too large'), brief(run))
  check('verdict: the stop resumes from the check, never from the verdict', JSON.stringify(run.res.resumeFrom) === JSON.stringify({ label: 'check r1', attempt: 2 }), run.res.resumeFrom)
  check('verdict: the record keeps the spilled result and what the verdict said', ((run.res.detail || {}).checker || {}).status === 'result_unreadable' && run.res.detail.checker.reason === 'spilled' && String(run.res.detail.checker.verdictError).startsWith('checks.sh --verdict exited 2') && run.res.rounds[0].check.pass === false, run.res.detail)
  // A verdict call that returns nothing stops the run under the check's label, never the
  // verdict's, so a resume runs the gate again (#94, R6-10).
  const silent = await go('verdict: the verdict call returns nothing', baseArgs, { ...base, checker: onSpill(() => null), nothing: ['check r1 verdict'] })
  check('verdict: a verdict call that returns nothing stops at check, resumable from the check, never from the verdict', silent.res.status === 'error' && silent.res.stage === 'check' && silent.res.error.includes('check r1 verdict returned nothing') && JSON.stringify(silent.res.resumeFrom) === JSON.stringify({ label: 'check r1', attempt: 2 }), [brief(silent), silent.res.resumeFrom])
  // A verdict the checker misread as not JSON, though it is the gate's shape, is overridden and
  // read, and the override leaves its warning as the check call's does (#94, R7-8).
  const misread = await go('verdict: the verdict call misread as not JSON', baseArgs, { ...base, checker: onSpill((out) => ({ ...out, status: 'result_unreadable', reason: 'not_json' })) })
  check('verdict: a structural misread of the verdict is overridden with its own warning, and the verdict is read', misread.res.status === 'done' && misread.res.warnings.some((w) => w.startsWith('round 1 verdict: the checker said result_unreadable (not_json)')) && misread.res.warnings.includes(`round 1: ${warning}`), [brief(misread), misread.res.warnings])
  const again = await go('verdict: the relaunch reruns the check and asks again', { ...baseArgs, resume: { 'check r1': { attempt: 2, error: run.res.error, hand: { commits: [], paths: [] } } } }, { ...base, checker: onSpill(() => null) })
  check('verdict: on a resumed check the verdict prompt carries the attempt, so it is asked again and never replayed', again.res.status === 'done' && promptOf(again, 'check r1 verdict') !== pick(run.calls, 'check r1 verdict').prompt && promptOf(again, 'check r1 verdict').includes('This follows resume attempt 2 of the check.') && lastLine(again, 'check r1 verdict') === `/r/.claude/redline/checks.sh --verdict ${snap}`, [brief(again), promptOf(again, 'check r1 verdict')])
  const unread = { exit: 0, status: 'result_unreadable', reason: 'spilled', result: null, error: 'Output too large again' }
  run = await go('verdict: the verdict spilled too', baseArgs, { ...base, checker: onSpill(() => unread) })
  check('verdict: a verdict the checker could not read either stops the run, saying so', run.res.status === 'error' && run.res.stage === 'check' && run.res.error.includes('checks.sh --verdict could not be read either (spilled)') && labels(run.calls).filter((l) => l.endsWith(' verdict')).length === 1, brief(run))
  run = await go('verdict: the baseline spilled', baseArgs, { ...base, checker: (label) => (label === 'baseline' ? spilled : null) })
  check('verdict: a spilled baseline is read from its verdict, asked with --baseline', run.res.status === 'done' && !!pick(run.calls, 'baseline verdict') && lastLine(run, 'baseline verdict') === '/r/.claude/redline/checks.sh --verdict --baseline /r/agent-os/specs/x/redline/snapshot-start.json' && run.res.warnings.includes(`baseline: ${warning}`), [brief(run), labels(run.calls), run.res.warnings])
  run = await go('verdict: a long gate', { ...baseArgs, baselineSeconds: 732 }, { ...base, checker: onSpill(() => null) })
  check('verdict: after a background gate the verdict is still one foreground checks.sh call', run.res.status === 'done' && pick(run.calls, 'check r1').prompt.includes('redline-background.sh start') && !promptOf(run, 'check r1 verdict').includes('redline-background.sh') && lastLine(run, 'check r1 verdict') === `/r/.claude/redline/checks.sh --verdict ${snap}`, [brief(run), promptOf(run, 'check r1 verdict')])
  run = await go('verdict: git-only', { ...baseArgs, checker: 'git-only' }, { ...base, checker: onSpill(() => null) })
  check('verdict: a git-only check asks for the git-only verdict', run.res.status === 'done' && lastLine(run, 'check r1 verdict') === `/r/.claude/redline/checks.sh --verdict --git-only ${snap}`, [brief(run), lastLine(run, 'check r1 verdict')])
  const schema = pick(run.calls, 'check r1').opts.schema.properties.result.properties
  check('schema: the checker\'s result carries the v3 keys and still takes a v2 result', ['verdict', 'kept'].every((k) => k in schema) && 'truncated' in schema.checks.items.properties && ['round_sha', 'allowed_count', 'changed_count', 'commits_count', 'formatter_touched_count', 'allowed', 'changed_files', 'formatter_touched_outside_pr'].every((k) => k in schema.git.properties) && (pick(run.calls, 'check r1 verdict') || { opts: {} }).opts.schema === pick(run.calls, 'check r1').opts.schema, [Object.keys(schema), Object.keys(schema.git.properties)])
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
  check('human: resolve and approvers are told it is the human pass', pick(second.calls, 'resolve h1').prompt.includes('You are the resolve agent for human review 1.') && pick(second.calls, 'plan approver h1').prompt.includes('a fix is decided by them (decidedBy "reviewer")') && pick(second.calls, 'plan approver h1').prompt.includes('a disposition of defer that no decision below names is a bounce') && pick(second.calls, 'implement h1').prompt.includes('You are the implementer for human review 1.') && pick(second.calls, 'implement h1').prompt.includes('finishing H1-1 (#114)'), pick(second.calls, 'implement h1').prompt.slice(-900))
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
  // The human pass's final nit pass declines a nit its reviewer reports the same way (#94, R7-10).
  const humanNit = await go('human: the final nit pass reports a nit anyway', decided, { ...scenario, reviews: [[f('R3-1', 'nit')]] })
  check('human: a nit the final nit pass reports is declined under the pass\'s scope and listed in its review body, never shaped', humanNit.res.status === 'done' && JSON.stringify((humanNit.res.rounds[1].scoped || []).map((x) => x.id)) === '["R3-1"]' && (pick(humanNit.calls, 'post r3') || { prompt: '' }).prompt.includes('### Declined under the final nit pass\'s scope (correctness only) (1)\\n\\n- R3-1 · `app/x.php:1` · title R3-1') && !labels(humanNit.calls).includes('shape r3'), [humanNit.res.status, labels(humanNit.calls)])
  check('human: the snapshot names the human folder', pick(second.calls, 'snapshot h1').prompt.includes(`"${folder}/"`) && pick(second.calls, 'snapshot h1').prompt.includes('Operation: snapshot (human review 1).'))

  let run = await go('human: the nit pass finds a correctness bug', decided, { ...scenario, reviews: [[f('R3-1', 'correctness')]], commitIds: [['H1-1', 'H1-2', 'H1-4'], ['R3-1']] })
  check('human: one more fix pass as round 3, not re-reviewed, then the summary', run.res.status === 'done' && run.res.lastFixUnreviewed === true && labels(run.calls).join('|') === 'shape h1|spec status h1|resolve h1|plan approver h1|standards approver h1|snapshot h1|baseline|implement h1|check h1|push and reply h1|gather r3|final nit pass r3|post r3|shape r3|spec status r3|plan approver r3|standards approver r3|snapshot r3|implement r3|check r3|push and reply r3|last round|resolve threads|summary comment|record files|record commit', labels(run.calls))
  check('human: the summary names the bug and the sweep of the nit-pass thread', comment(run.calls, 'summary comment').endsWith('Final nit pass (Redline round 3): 1 correctness bug in the fixes, fixed in one more pass that was not re-reviewed. Resolved 1 thread; 0 left open.'), comment(run.calls, 'summary comment'))
  check('human: the sweep names only the nit-pass thread, never the teammate\'s', pick(run.calls, 'resolve threads').prompt.includes('resolve-threads 114 100 200\n') && !/ 90[0-9]\b/.test(pick(run.calls, 'resolve threads').prompt), pick(run.calls, 'resolve threads').prompt)
  check('human: the round-3 fix reply is a Redline round reply', replyFor(run.calls, 'push and reply r3', 'R3-1') === 'Redline round 3: fixed in 4bbbbbb (redline: R3-1 fix). · decided by: redline', replyFor(run.calls, 'push and reply r3', 'R3-1'))

  run = await go('human: nothing to commit', humanArgs([h('H1-1', { description: 'Nice.' })]), { reviews: [], none: ['H1-1'], commitIds: [[]] })
  check('human: no commits, no nit pass, still the summary', run.res.status === 'done' && labels(run.calls).join('|') === 'shape h1|spec status h1|plan approver h1|standards approver h1|snapshot h1|baseline|implement h1|check h1|push and reply h1|summary comment|record files|record commit' && run.res.humanReview.nitPassRound === 0, labels(run.calls))
  check('human: the summary says so', comment(run.calls, 'summary comment') === 'Redline human review 1 · review by @marcamos: nothing to fix; H1-1 asked for nothing. No fix was committed, so no final nit pass.', comment(run.calls, 'summary comment'))
  check('human: the push prompt does not push', pick(run.calls, 'push and reply h1').prompt.includes('push: false'))
  // A pass whose only commit is its spec folder fixed nothing: it runs no final nit pass and posts
  // no Redline round over an empty diff (#94, R4-12).
  run = await go('human: only the spec folder committed', humanArgs([h('H1-1', { description: 'Nice.' })]), { reviews: [], none: ['H1-1'], commitIds: [['redline: save human review 1 spec for PR #114 (#114)']] })
  check('human: a pass that committed only its spec folder runs no final nit pass, and the summary says no fix was committed', run.res.status === 'done' && !labels(run.calls).some((l) => l.startsWith('final nit pass') || l.startsWith('post r')) && run.res.humanReview.nitPassRound === 0 && comment(run.calls, 'summary comment').includes('No fix was committed, so no final nit pass.'), [labels(run.calls), comment(run.calls, 'summary comment')])

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
  check('human: a defer stops the run at shape', run.res.status === 'error' && run.res.stage === 'shape' && run.res.error.includes('the shaper deferred H1-1') && run.res.error.includes('never defer') && labels(run.calls).join('|') === 'shape h1|spec status h1', [run.res.status, run.res.error, labels(run.calls)])

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
  const args = { ...baseArgs, decisions: { 'R1-3': { choice: 'Keep it', notes: 'Kept, the board shows it.', date: '2026-10-20' } }, deferrals: goAhead('R1-2') }
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
  check('rules: a Redline round\'s shaper schema takes fix, decline, defer and ask, and no none', dispositionEnum(first.calls, 'shape r1').join('|') === 'fix|decline|defer|ask', dispositionEnum(first.calls, 'shape r1'))
  // A finding's files are required, so an empty list means no task, never a list not asked for (#100).
  check('rules: a Redline round\'s shaper schema requires every finding\'s files', findingRequired(first.calls, 'shape r1').includes('files'), findingRequired(first.calls, 'shape r1'))
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
  // With no decision on Redline's own files, the rule bullet names no exception (#94, R9-4).
  check('rules: with no decision on Redline\'s own files, the resolve prompt\'s rule bullet names no exception', resolve.includes('A decision carrying `rule` is on a finding a repository ask rule covers, left to the person (#49)') && !resolve.includes('also carries `own`'), resolve)
  check('rules: the plan approver sees the rules and the asks', pick(second.calls, 'plan approver r1').prompt.includes('"id": "craft-config"') && pick(second.calls, 'plan approver r1').prompt.includes('"askRule": "craft-config"'), pick(second.calls, 'plan approver r1').prompt)
  // The ask-rules block names decline beside fix and defer, and the approver bounces a decline of a
  // finding a prose rule covers, in its prompt and in its agent file (#94, R4-2).
  const approverAgent = fs.readFileSync(path.join(here, '..', 'agents', 'redline-plan-approver.md'), 'utf8')
  check('rules: the ask-rules block says never fixed, declined or deferred, and a decline a prose rule covers is a bounce', pick(second.calls, 'shape r1').prompt.includes('never fixed, declined or deferred by Redline') && pick(second.calls, 'plan approver r1').prompt.includes('and a decline of a finding a prose rule covers') && approverAgent.includes('or a `decline` of such a finding (it has no task: read the dispositions)'), pick(second.calls, 'plan approver r1').prompt.slice(0, 2500))
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
  // A call left to the person under a rule has no disposition to state (#99): its resolve prompt
  // says so, and the round goes on with no statement for it.
  check('rules: the resolve prompt says a call that carries a rule has no entry in decided, and the round goes on without one', autoResolve.includes('A call whose decision carries `rule` is left to the person and has no entry in decided.') && auto.res.status === 'done', [auto.res.status, auto.res.error, autoResolve.slice(-600)])
  check('rules: the autopilot reply', replyFor(auto.calls, 'push and reply r1', 'R1-2') === `Redline round 1: left to @author under repository rule craft-config (${reason}). Repository rule craft-config: ${reason}. No change made; @author makes it. · decided by: redline (autopilot)`, replyFor(auto.calls, 'push and reply r1', 'R1-2'))
  const autoHandoff = comment(auto.calls, 'handoff comment')
  // Since #95 a deferral is an item with a drafted issue, so a finding autopilot leaves to the
  // person is listed under Left to the person alone, with what Redline would have done.
  check('rules: autopilot lists it under Left to the person with what Redline would have done, and not under Deferred', !autoHandoff.includes('### Deferred') && autoHandoff.includes(`### Left to @author (repository rules)\n\n- **R1-2** title R1-2: rule craft-config (${reason}); open: By hand: fix R1-2 this way; left to @author under repository rule craft-config`) && autoHandoff.includes('\n- **R1-3** title R1-3: rule billing (Billing changes are reviewed by finance); open: By hand: fix R1-3 this way; left to @author under repository rule billing'), autoHandoff)
  check('rules: nothing is deferred, and the result says what Redline would have done for each', JSON.stringify(auto.res.deferred) === '[]' && JSON.stringify(auto.res.forced.map((x) => [x.id, x.rule, x.open])) === '[["R1-2","craft-config","open: By hand: fix R1-2 this way."],["R1-3","billing","open: By hand: fix R1-3 this way."]]', [auto.res.deferred, auto.res.forced])
  check('rules: no draft is filed for a finding left to the person', !labels(auto.calls).some((l) => l.startsWith('file deferred')), labels(auto.calls))
  // Posted text (#87): the Deferred line of a finding autopilot leaves under a rule makes its own
  // postedText call, beside the shipped branch section 16 pins, so it is pinned with a title the
  // function changes: a plain title reads the same with or without the call (#89, R3-2).
  const autoTitled = await go('rules: autopilot, a title with a tag and an @', { ...ruleArgs, interrupt: 'autopilot' }, { ...scenario, reviews: [[three[0], { ...three[1], title: 'Field <b> renamed @config' }, three[2]], []] })
  check('posted text: the Left to the person line of a finding autopilot left escapes and neutralises its title', comment(autoTitled.calls, 'handoff comment').includes(`### Left to @author (repository rules)\n\n- **R1-2** Field &lt;b> renamed @${WJ}config: rule craft-config (${reason}); open: By hand: fix R1-2 this way; left to @author under repository rule craft-config`), comment(autoTitled.calls, 'handoff comment'))

  // The paths rule also catches a finding elsewhere whose task would write under it.
  const viaFiles = await go('rules: a task that writes under a paths rule', ruleArgs, { reviews: [[f('R1-1', 'correctness')], []], files: { 'R1-1': ['app/x.php', '/r/config/project/project.yaml'] }, commitIds: [[]] })
  check('rules: the shaper\'s files force the ask', viaFiles.res.status === 'handoff' && viaFiles.res.judgmentCalls[0].forced.rule === 'craft-config', viaFiles.res)
  // A paths rule reads a path as the round keeps it as well as as written (#114, R3-3), a case per
  // form the cleanup folds: a doubled slash, a ./ segment and padding. Until R3-3 the rules read
  // the written form alone, so these were never forced while the round kept and showed the folded
  // path, which is under the rule. Beside them, the form that is under the rule as written and that
  // the cleanup drops, a directory's trailing slash, is still forced, and a path that folds to one
  // outside the rule forces nothing.
  const forcedAs = (r) => ((((r.res || {}).judgmentCalls || [])[0] || {}).forced || {}).rule
  for (const form of ['config//project/project.yaml', 'config/./project/project.yaml', ' config/project/project.yaml ', 'config/project/']) {
    const r = await go(`rules: a task that writes under a paths rule, listed as ${JSON.stringify(form)}`, ruleArgs, { reviews: [[f('R1-1', 'correctness')], []], files: { 'R1-1': ['app/x.php', form] }, commitIds: [[]] })
    check(`rules: the shaper's files force the ask when they list ${JSON.stringify(form)}`, (r.res || {}).status === 'handoff' && forcedAs(r) === 'craft-config', [(r.res || {}).status, (r.res || {}).error, forcedAs(r)])
  }
  const foldedOutside = await go('rules: a task listed with a path that folds to one outside the paths rule', ruleArgs, { reviews: [[f('R1-1', 'correctness')], []], files: { 'R1-1': ['app/x.php', 'config//project.yaml'] }, commitIds: [['R1-1']] })
  check('rules: a path that folds to one outside the paths rule forces nothing, and the fix is built', (foldedOutside.res || {}).status === 'done' && JSON.stringify((foldedOutside.res || {}).forced || []) === '[]', [(foldedOutside.res || {}).status, (foldedOutside.res || {}).error, (foldedOutside.res || {}).forced])
  // A paths rule reads a path once, as the guard reads a write target (#114, R4-2, R4-3): joined
  // to the root and folded, `..` segments and a trailing /. included, and matched with its slash
  // when it was written as a directory. Until then the rules read it as written and as cleanPaths
  // kept it, and no reading was both folded and a directory, so a directory written with a doubled
  // slash, a ./ segment or padding was never forced, and neither was a path that reaches the rule
  // through `..`. The last form held before by accident of its text, and is seen red under a
  // mutation of the directory test.
  for (const form of ['config//project/', 'config/./project/', ' config/project/ ', 'config/other/../project/', 'app/../config/project/x.yaml', '../r/config/project/x.yaml', 'config/project/.']) {
    const r = await go(`rules: a task that writes under a paths rule, listed as ${JSON.stringify(form)}`, ruleArgs, { reviews: [[f('R1-1', 'correctness')], []], files: { 'R1-1': ['app/x.php', form] }, commitIds: [[]] })
    check(`rules: the shaper's files force the ask when they list ${JSON.stringify(form)}`, (r.res || {}).status === 'handoff' && forcedAs(r) === 'craft-config', [(r.res || {}).status, (r.res || {}).error, forcedAs(r)])
  }
  // The match is case-folded, as the guard's is and as it was before R4-2 rewrote the loop that
  // does it: held before, and seen red under a mutation that drops the fold.
  const otherCase = await go('rules: a task that writes under a paths rule, listed in another case', ruleArgs, { reviews: [[f('R1-1', 'correctness')], []], files: { 'R1-1': ['app/x.php', 'Config/Project/Project.yaml'] }, commitIds: [[]] })
  check('rules: the shaper\'s files force the ask when they list the path in another case', (otherCase.res || {}).status === 'handoff' && forcedAs(otherCase) === 'craft-config', [(otherCase.res || {}).status, (otherCase.res || {}).error, forcedAs(otherCase)])
  // The other way about: a path the guard reads as outside the rule forces nothing, where the
  // written reading matched its text. `..` out of the rule's directory is the file beside it, and
  // a path outside the repository is under no rule, a rule with no slash included, which matches
  // at any depth inside it.
  const secretRules = rules.concat([{ id: 'secrets', when: { paths: ['*.secret.yaml'] }, reason: 'A secret file is rotated by hand' }])
  for (const form of ['config/project/../other.yaml', 'config/project/sub/../../other.yaml', '/etc/a.secret.yaml']) {
    const r = await go(`rules: a task listed with ${JSON.stringify(form)}, which is outside every paths rule`, { ...baseArgs, askRules: secretRules }, { reviews: [[f('R1-1', 'correctness')], []], files: { 'R1-1': ['app/x.php', form] }, commitIds: [['R1-1']] })
    check(`rules: ${JSON.stringify(form)} forces nothing, and the fix is built`, (r.res || {}).status === 'done' && JSON.stringify((r.res || {}).forced || []) === '[]', [(r.res || {}).status, (r.res || {}).error, (r.res || {}).forced])
  }
  const secretInside = await go('rules: a task that writes under a paths rule with no slash, inside the repository', { ...baseArgs, askRules: secretRules }, { reviews: [[f('R1-1', 'correctness')], []], files: { 'R1-1': ['app/x.php', 'app/keys/../a.secret.yaml'] }, commitIds: [[]] })
  check('rules: a rule with no slash still takes a path at any depth inside the repository', (secretInside.res || {}).status === 'handoff' && forcedAs(secretInside) === 'secrets', [(secretInside.res || {}).status, (secretInside.res || {}).error, forcedAs(secretInside)])
  // What the workflow does not read as the guard does, pinned as it stands: a rule's own root
  // written with no trailing slash, and a directory above it. The guard refuses a write to either
  // as holding the rule's files; the workflow has only the glob, and a path with no trailing slash
  // is a file. The follow-up is the issue drafted under "For you to open" in
  // agent-os/specs/2026-11-21-1501-114-review-round-4-by-hand/shape.md. `config/project/..` is
  // the directory above the root: the written reading forced it by accident of its text until
  // this change, and that issue restores it with the rest.
  for (const form of ['config/project', 'config/', 'config/project/..']) {
    const r = await go(`rules: a task listed with ${JSON.stringify(form)}, a paths rule's root or the directory above it`, ruleArgs, { reviews: [[f('R1-1', 'correctness')], []], files: { 'R1-1': ['app/x.php', form] }, commitIds: [['R1-1']] })
    check(`rules: ${JSON.stringify(form)} is not left to the person, as the drafted issue records`, (r.res || {}).status === 'done' && JSON.stringify((r.res || {}).forced || []) === '[]', [(r.res || {}).status, (r.res || {}).error, (r.res || {}).forced])
  }
  // The reshape's list is read the same way (#114, R3-3): a call answered with a fix whose task a
  // reshape lists under a paths rule with a doubled slash is left to the person under the rule at
  // that reshape, as one listed as written is, and the round finishes with no repair. Until R3-3
  // it stayed tracked, its list became the folded path under the rule, and the fix was demanded.
  const billingPaths = [{ id: 'billing-code', when: { paths: ['app/billing/**'] }, reason: 'Billing code is changed by finance' }]
  const reshapedUnder = await go('rules: a call answered with a fix whose task a reshape lists under a paths rule with a doubled slash', { ...baseArgs, askRules: billingPaths, decisions: { 'R1-1': { choice: 'Change it', notes: 'Fix it now.', date: '2026-11-21' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeFiles: { 'R1-1': ['app//billing/charge.php'] }, commitIds: [[], []] })
  const reshapedUnderReply = replyFor(reshapedUnder.calls, 'push and reply r1', 'R1-1')
  check('rules: a decided finding whose task a reshape lists under a paths rule with a doubled slash is left to the person under the rule, with no repair', (reshapedUnder.res || {}).status === 'done' && !labels(reshapedUnder.calls).includes('repair r1') && reshapedUnderReply.startsWith('Redline round 1: left to @author under repository rule billing-code'), [(reshapedUnder.res || {}).status, (reshapedUnder.res || {}).error, labels(reshapedUnder.calls).slice(-6), reshapedUnderReply])
  check('rules: docs/contract.md says a paths rule reads a path once, as the guard reads a write target', fs.readFileSync(path.join(here, '..', 'docs', 'contract.md'), 'utf8').includes('which the workflow reads once, as the guard reads a write target'))
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
  check('rules: the human summary says so', comment(human.calls, 'summary comment') === 'Redline human review 1 · review by @marcamos: nothing to fix; H1-1 left to @author under repository rule craft-config. No fix was committed, so no final nit pass.', comment(human.calls, 'summary comment'))
  // A comment that asks for nothing stays none on a rule-covered file: there is no change to leave to the person (#52, R1-4).
  const praise = await go('rules: a human-pass comment that asks for nothing', { ...ruleArgs, firstRound: 3, interrupt: 'autopilot', revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: '', specFolder: folder, findings: [{ ...hf, description: 'Nice.' }], commentIds: { 'H1-1': 905 }, posted: true } }, { reviews: [], none: ['H1-1'], commitIds: [[]] })
  check('rules: a none on a rule-covered file is not forced: no change requested, nothing left or deferred, no warning', praise.res.status === 'done' && replyFor(praise.calls, 'push and reply h1', 'H1-1').startsWith('Redline human review 1: no change requested.') && praise.res.forced.length === 0 && praise.res.deferred.length === 0 && !praise.res.warnings.some((w) => w.includes('makes it an ask')), [praise.res.status, praise.res.error, replyFor(praise.calls, 'push and reply h1', 'H1-1'), praise.res.forced, praise.res.deferred, praise.res.warnings])
  check('rules: the human summary says the comment asked for nothing', comment(praise.calls, 'summary comment') === 'Redline human review 1 · review by @marcamos: nothing to fix; H1-1 asked for nothing. No fix was committed, so no final nit pass.', comment(praise.calls, 'summary comment'))
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
  check('resume: the relaunch note names the field', first.res.relaunch.how.includes('error: resume ({"<label>": {attempt, error, hand, ownCheck}}) for the label resumeFrom names, with ownCheck as this result gives it, through the skill\'s run marker.'), first.res.relaunch.how)
  check('resume: the relaunch note says a decline overruled at a decisions stop carries its disposition', first.res.relaunch.how.includes('handoff (decisions): decisions ({"<id>": {"choice", "notes", "date"}}, every decision so far, unchanged, plus "disposition": "fix|defer" on a decline overruled at that stop).'), first.res.relaunch.how)
  // An override the resolve agent could not apply is restated, and the restatement replaces it in
  // the relaunch's decisions (#94, R5-4).
  check('resume: the relaunch note says a restated override replaces the one the resolve agent could not apply', first.res.relaunch.how.includes('For each id in overridesUnresolved, the restated decision ({"choice", "notes", "date", "disposition": "fix|defer|accept"}) replaces the one the resolve agent could not apply.'), first.res.relaunch.how)
  // The plan clause gives an ask the shape the skill records for it, with no disposition, and a
  // changed disposition its own (#108, R3-2): since #99 a disposition on a call's decision decides it.
  check('resume: the relaunch note gives a plan dial ask no disposition, and a changed disposition its own', first.res.relaunch.how.includes('plus decisions for every ask ({"choice", "notes", "date"}) and every changed disposition ({"choice", "notes", "date", "disposition": "fix|defer|accept"})'), first.res.relaunch.how)
  // A stop at resolve is the workflow's check of what the resolve agent returned, so its resume
  // line tells the rerun to correct what its first attempt wrote, decided entries included (#108,
  // R3-4). The recheck above is the neighbour: its resumed prompt ends with the line alone.
  const resolveClause = ' When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it: read shape.md and plan.md as that attempt left them, the entries it already decided and the tasks it already wrote included, correct what the error names, and return the whole result again.'
  const stoppedAtResolve = await go('resume: a stop at resolve', { ...baseArgs, decisions: typedAnswer('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], resolveUnstated: ['R1-1'], commitIds: [['R1-1']] })
  const resolveError = (stoppedAtResolve.res || {}).error || ''
  const resumedResolve = await go('resume: a stop at resolve, resumed', { ...baseArgs, decisions: typedAnswer('R1-1'), resume: { 'resolve r1': { attempt: 2, error: resolveError, hand: { commits: [], paths: [] }, ownCheck: true } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], commitIds: [['R1-1']] })
  const resumedResolvePrompt = (pick(resumedResolve.calls, 'resolve r1') || { prompt: '' }).prompt
  // The clause is chosen by the field the stop set (#116), never by the error's words: the stop's
  // result says ownCheck, the marker and the skill carry it into the entry, and an entry without
  // it is an ordinary stop whatever its error says. There is no fallback to the wording, so a
  // marker written before the field existed resumes with the line alone.
  const fieldlessResolve = await go('resume: a stop at resolve, resumed from an entry with no ownCheck', { ...baseArgs, decisions: typedAnswer('R1-1'), resume: { 'resolve r1': { attempt: 2, error: resolveError, hand: { commits: [], paths: [] } } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], commitIds: [['R1-1']] })
  const fieldlessResolvePrompt = (pick(fieldlessResolve.calls, 'resolve r1') || { prompt: '' }).prompt
  check('resume: an entry with no ownCheck is an ordinary stop whatever its error says: a resolve resumed from one ends with the line alone', resolveError.startsWith('the resolve agent ') && fieldlessResolvePrompt.endsWith(line(resolveError)) && !fieldlessResolvePrompt.includes(resolveClause), fieldlessResolvePrompt.slice(-400))
  check('resume: a resumed resolve is told the stop was the check of its own result and to correct what it wrote, and the relaunch finishes', resolveError.startsWith('the resolve agent stated no disposition for R1-1') && resumedResolvePrompt.endsWith(line(resolveError) + resolveClause) && (resumedResolve.res || {}).status === 'done', [resolveError, resumedResolvePrompt.slice(-600), (resumedResolve.res || {}).status])
  check('resume: the resolve agent\'s file says the same of a resumed resolve, as the resume line does', fs.readFileSync(path.join(here, '..', 'agents', 'redline-resolve.md'), 'utf8').includes('the entries it already decided and the tasks it already wrote included, correct what the error names, and return the whole result again'))
  // The clause is chosen by the stop (#108, R4-4): the autopilot stop is raised from the resolve
  // agent's own unresolved list, which its rules keep pending, so its resumed prompt ends with the
  // line alone. `resumedResolve` above is the neighbour: a check of the returned result keeps it.
  const unappliedStop = await go('resume: autopilot could not apply a recommendation', { ...baseArgs, interrupt: 'autopilot' }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], unresolved: [{ id: 'R1-1', why: 'no such option' }], commitIds: [['R1-1']] })
  const unappliedError = (unappliedStop.res || {}).error || ''
  const resumedUnapplied = await go('resume: autopilot could not apply a recommendation, resumed', { ...baseArgs, interrupt: 'autopilot', resume: { 'resolve r1': { attempt: 2, error: unappliedError, hand: { commits: [], paths: [] } } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], commitIds: [['R1-1']] })
  const resumedUnappliedPrompt = (pick(resumedUnapplied.calls, 'resolve r1') || { prompt: '' }).prompt
  check('resume: a resumed resolve after autopilot could not apply a recommendation ends with the resume line alone, with no clause to correct what it wrote', unappliedError.startsWith('autopilot could not apply the shaper\'s recommendation for R1-1') && resumedUnappliedPrompt.endsWith(line(unappliedError)) && !resumedUnappliedPrompt.includes(resolveClause), [unappliedError, resumedUnappliedPrompt.slice(-600)])
  check('resume: the resolve agent\'s file says a decision it could not apply stays pending on a resume, as the resume line leaves it', fs.readFileSync(path.join(here, '..', 'agents', 'redline-resolve.md'), 'utf8').includes('An error that says autopilot could not apply a decision is not that check'))
  // The field is set where the stop is raised (#116): the sites that are the workflow's check of
  // what an agent returned go through checkError, and no other site does. At the resolve that is
  // every stop but the autopilot one; at the shape stage, the hold and the checks of the shaper's
  // result (the four of a call's options among them, #105, #126), and neither the spec check (a
  // missing file can be a refused Write, which a person fixes) nor the spec check's own failure.
  const sites = (text) => src.split(text).length - 1
  check('resume: every resolve stage error but the autopilot stop is raised as the workflow\'s own check', sites("throw checkError('resolve', `the resolve agent ") === 8 && sites("checkError('resolve', ") === 8 && sites("stageError('resolve', ") === 1 && sites("stageError('resolve', `autopilot could not apply ") === 1, [sites("checkError('resolve', "), sites("stageError('resolve', ")])
  check('resume: the hold and the checks of the shaper\'s result are raised as the workflow\'s own check, the spec check and its own failure are not, and no other stage has one', sites("throw checkError('shape', ") === 13 && sites("throw checkError('shape', `the reshape left ") === 1 && sites("stageError('shape', ") === 2 && sites("stageError('shape', `the shaper wrote no usable spec in ") === 1 && sites('throw checkError(') === 21, [sites("throw checkError('shape', "), sites("stageError('shape', "), sites('throw checkError(')])

  // A hand-off after the resume: the next relaunch adds decisions and keeps resume, so every prompt
  // up to the stop, the resumed one included, replays.
  // The mock hands out one commit list per checker call, so recheck r1 takes the empty one and
  // round 2's commit is made in round 2: since #68 a round's check lists only that round's commits.
  const later = { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')], []], ask: ['R2-1'], commitIds: [['R1-1'], [], ['R2-1']], checker: onlyFirst.checker }
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
  // The stop is the workflow's own check of what the shaper returned, so its entry carries
  // ownCheck and the line says nothing was fixed by hand, as the resolve's and the reshape's do,
  // before the replace sentence (#117): the skill tells the person the same, and until then the
  // line said only that the person had fixed the cause by hand.
  const ownSentence = ' When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it.'
  const shapeArgs = { ...baseArgs, resume: { 'shape r1': { attempt: 2, error: 'the shaper gave no disposition for R1-2', hand: { commits: [], paths: [] }, ownCheck: true } } }
  const reshaped = await go('resume: shape stage relaunch', shapeArgs, two)
  samePrefix('resume: shape stage', shapeFail.calls, reshaped.calls, 3)
  const shapePromptOf = (r) => (pick(r.calls, 'shape r1') || { prompt: '' }).prompt
  check('resume: a first shape resumed after a check of its result is told nothing was fixed by hand, then to rewrite the four files', shapePromptOf(reshaped).endsWith(line('the shaper gave no disposition for R1-2') + ownSentence + shaperLine), shapePromptOf(reshaped).slice(-700))
  // The neighbour: the same error on an entry with no ownCheck is an ordinary stop, so its line is
  // the one a first shape always had, byte for byte (no fallback to the wording, #116).
  const reshapedFieldless = await go('resume: shape stage relaunch from an entry with no ownCheck', { ...baseArgs, resume: { 'shape r1': { attempt: 2, error: 'the shaper gave no disposition for R1-2', hand: { commits: [], paths: [] } } } }, two)
  check('resume: a first shape resumed from an entry with no ownCheck ends with the line and the replace sentence, as it always did', shapePromptOf(reshapedFieldless).endsWith(line('the shaper gave no disposition for R1-2') + shaperLine) && !shapePromptOf(reshapedFieldless).includes(ownSentence), shapePromptOf(reshapedFieldless).slice(-600))
  check('resume: the shaper\'s file, the replay standard and docs/running.md say a first shape resumed after the workflow\'s check is told nothing was fixed by hand', fs.readFileSync(path.join(here, '..', 'agents', 'redline-shaper.md'), 'utf8').includes('nothing was fixed by hand for it, and you rewrite the four files all the same') && fs.readFileSync(path.join(here, '..', 'agent-os', 'standards', 'workflow', 'replay.md'), 'utf8').includes('a first shape resumed after the workflow\'s own check is told so too') && fs.readFileSync(path.join(here, '..', 'docs', 'running.md'), 'utf8').includes('it is told first that nothing was fixed by hand'))
  check('resume: the shape relaunch finishes', reshaped.res.status === 'done', [reshaped.res.status, reshaped.res.error])

  // The approve stage names the plan approver, not the standards approver that started beside it.
  const bounced = await go('resume: approve exhausted', baseArgs, { ...base, planBounce: 3 })
  check('resume: an exhausted approval names the last plan approver', bounced.res.status === 'error' && bounced.res.stage === 'approve' && bounced.res.resumeFrom && bounced.res.resumeFrom.label === 'plan approver r1 #3', [bounced.res.status, bounced.res.stage, bounced.res.resumeFrom])

  // gather is not resumable: the head moved, the PR is not open, or the branch is wrong.
  const moved = await go('resume: gather is not resumable', baseArgs, { ...base, heads: ['b'.repeat(40)] })
  check('resume: a gather error carries resumeFrom null', moved.res.status === 'error' && moved.res.stage === 'gather' && moved.res.resumeFrom === null, [moved.res.status, moved.res.stage, moved.res.resumeFrom])
  // What each result says of its stop (#116): the resolve's check and the shaper's missing
  // disposition are the workflow's own checks; the autopilot stop, a gate that still fails, an
  // exhausted approval and a gather error are not.
  const says = (r) => (r.res || {}).ownCheck
  check('resume: a stop that is the workflow\'s own check says so in its result (ownCheck), at the resolve and at a first shape', says(stoppedAtResolve) === true && says(shapeFail) === true, [says(stoppedAtResolve), says(shapeFail)])
  check('resume: the autopilot stop, a gate that still fails, an exhausted approval and a gather error say ownCheck false', says(unappliedStop) === false && says(first) === false && says(bounced) === false && says(moved) === false, [says(unappliedStop), says(first), says(bounced), says(moved)])

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
  const withNit = { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'nit')], []], commitIds: [['R1-1'], [], ['R2-1']], checker: handPatch }
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
  // ownCheck is true or false, or absent, which reads as false (#116).
  const badOwn = await go('resume: an ownCheck that is not a boolean', { ...baseArgs, resume: { 'recheck r1': { attempt: 2, error: errorText, hand: { commits: [], paths: [] }, ownCheck: 'yes' } } }, base)
  check('resume: an ownCheck that is neither true nor false is refused', Boolean(badOwn.thrown) && /args.resume must map an agent label/.test(badOwn.thrown.message) && badOwn.calls.length === 0, badOwn.thrown ? badOwn.thrown.message : labels(badOwn.calls))
  // ownCheck false reads as an entry with no field (#116). The comparison runs at a first shape,
  // whose line reads the field: until #120, R3-3 it ran at recheck r1, whose line never does, so
  // a normalisation that read false as true stayed green here.
  const falseOwn = await go('resume: shape stage relaunch from an entry with ownCheck false', { ...baseArgs, resume: { 'shape r1': { attempt: 2, error: 'the shaper gave no disposition for R1-2', hand: { commits: [], paths: [] }, ownCheck: false } } }, two)
  const everyPrompt = (r) => r.calls.map((c) => `${c.label}\n${c.prompt}`).join('\n')
  check('resume: an entry that says ownCheck false builds the prompts of one that says nothing, at a first shape, whose line reads the field', !falseOwn.thrown && falseOwn.res.status === 'done' && shapePromptOf(falseOwn).endsWith(line('the shaper gave no disposition for R1-2') + shaperLine) && everyPrompt(falseOwn) === everyPrompt(reshapedFieldless), falseOwn.thrown ? falseOwn.thrown.message : shapePromptOf(falseOwn).slice(-600))
  // The skill reads the field where it reports the stop and carries it into the entry, and the
  // replay standard and docs/running.md say what the workflow does with it.
  const skillFile = fs.readFileSync(path.join(here, '..', 'skills', 'redline', 'SKILL.md'), 'utf8')
  const errorSection = (skillFile.split('### `error`')[1] || '').split('\n## ')[0]
  check('resume: the skill\'s error section reads ownCheck: nothing to fix by hand after the workflow\'s own check, the hand-fix sentence for every other resumable stop', errorSection.includes('`ownCheck`') && errorSection.includes('nothing needs fixing by hand') && errorSection.includes('once the cause is fixed by hand'), errorSection.slice(0, 900))
  check('resume: the skill copies the marker\'s ownCheck into the resume entry, lists it among the marker\'s keys and says in the resume question when nothing needs fixing by hand', skillFile.includes('"ownCheck": <marker.ownCheck>') && skillFile.includes('`error`, `ownCheck`, `round`') && skillFile.includes('For an `error` marker whose `ownCheck` is true, say in the question'))
  check('resume: the replay standard says the sentence is chosen by the field the stop set, never by the error\'s words', fs.readFileSync(path.join(here, '..', 'agent-os', 'standards', 'workflow', 'replay.md'), 'utf8').includes('chosen by the field the stop set (`ownCheck`), never by the words of its error'))
  check('resume: docs/running.md says which stops need no hand fix and that the marker carries ownCheck', (() => { const doc = fs.readFileSync(path.join(here, '..', 'docs', 'running.md'), 'utf8'); return doc.includes('`ownCheck`') && doc.includes('nothing needs fixing by hand') })())
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
  check('spec: an ask without a judgment call stops at shape after the check, resumable at the shaper', noCall.res.status === 'error' && noCall.res.stage === 'shape' && noCall.res.error === 'the shaper marked R1-1 as ask but returned no judgment call for it' && JSON.stringify(noCall.res.resumeFrom) === JSON.stringify({ label: 'shape r1', attempt: 2 }) && labels(noCall.calls).slice(-1)[0] === 'spec status r1', [noCall.res.status, noCall.res.stage, noCall.res.error, noCall.res.resumeFrom, labels(noCall.calls)])
  const extra = await go('spec: a call for a fix', baseArgs, { ...two, shaperExtraCall: ['R1-2'] })
  check('spec: a judgment call for a finding sorted fix stops at shape', extra.res.status === 'error' && extra.res.stage === 'shape' && extra.res.error === 'the shaper returned a judgment call for R1-2, which it sorted as fix' && JSON.stringify(extra.res.resumeFrom) === JSON.stringify({ label: 'shape r1', attempt: 2 }), [extra.res.status, extra.res.stage, extra.res.error, extra.res.resumeFrom])
  // The spec check runs before the checks of the result (#120, R1-3): a missing file can be a
  // refused Write, which a person fixes, so an attempt that both left a file out and returned a
  // result a check refuses stops at the spec check, with no ownCheck, resumable at the shaper.
  // Until R1-3 the result check stopped it first, and the result said nothing needed fixing by hand.
  const droppedAndLost = await go('spec: a finding left out and no shape.md', baseArgs, { ...two, shaperDrop: ['R1-2'], specMissing: 'shape' })
  const lostRes = droppedAndLost.res || {}
  check('spec: an attempt that leaves a finding out and writes no shape.md stops at the spec check, with no ownCheck, resumable at the shaper', lostRes.status === 'error' && lostRes.stage === 'shape' && lostRes.error === `the shaper wrote no usable spec in ${folder}: no shape.md` && lostRes.ownCheck === false && JSON.stringify(lostRes.resumeFrom) === JSON.stringify({ label: 'shape r1', attempt: 2 }), [lostRes.status, lostRes.error, lostRes.ownCheck, lostRes.resumeFrom])

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
  // The reshape is vetted as the first shape is (#94, R8-5): one that leaves a finding out stops at
  // shape, naming the reshape as the step to resume.
  const reshapeDropped = await go('reshape: a finding left out', baseArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], planBounce: 1, reshapeDrop: ['R1-2'], commitIds: [['R1-1', 'R1-2']] })
  check('reshape: a reshape that leaves a finding out stops at shape, as the first shape does', reshapeDropped.res.status === 'error' && reshapeDropped.res.stage === 'shape' && reshapeDropped.res.error === 'the shaper gave no disposition for R1-2' && JSON.stringify(reshapeDropped.res.resumeFrom) === JSON.stringify({ label: 'reshape r1 #1', attempt: 2 }), [reshapeDropped.res.status, reshapeDropped.res.stage, reshapeDropped.res.error, reshapeDropped.res.resumeFrom])
  // The same at a reshape (#120, R1-3): the spec check comes first, so the stop is its own, with
  // no ownCheck, resumable at the reshape, and the rerun is given the restore clause.
  const reshapeDroppedLost = await go('reshape: a finding left out and no shape.md', baseArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], planBounce: 1, reshapeDrop: ['R1-2'], specMissing: { 'spec status r1 #1': 'shape' }, commitIds: [['R1-1', 'R1-2']] })
  const reshapeLostRes = reshapeDroppedLost.res || {}
  check('reshape: a reshape that leaves a finding out and writes no shape.md stops at the spec check, with no ownCheck, resumable at the reshape', reshapeLostRes.status === 'error' && reshapeLostRes.stage === 'shape' && reshapeLostRes.error === `the shaper wrote no usable spec in ${folder}: no shape.md` && reshapeLostRes.ownCheck === false && JSON.stringify(reshapeLostRes.resumeFrom) === JSON.stringify({ label: 'reshape r1 #1', attempt: 2 }), [reshapeLostRes.status, reshapeLostRes.error, reshapeLostRes.ownCheck, reshapeLostRes.resumeFrom])

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
  // The result carries what would confirm an unconfirmed finding, so the review-only summary can say
  // it; a confirmed finding has no such key (#94, R7-3).
  check('coverage: the result carries wouldConfirm for an unconfirmed finding, and none for a confirmed one', (run.res.rounds[0].findings.find((x) => x.id === 'R1-2') || {}).wouldConfirm === 'a browser on the page' && !('wouldConfirm' in (run.res.rounds[0].findings.find((x) => x.id === 'R1-1') || {})), run.res.rounds[0].findings)
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
  // A first round has no earlier finding to settle a candidate into, so a settled ref there names
  // nothing (#94, R8-2): a first-round run that needs no finding refutes both candidates instead.
  const refutedAll = [{ index: 1, outcome: 'refuted', ref: 'untouched code' }, { index: 2, outcome: 'refuted', ref: 'untouched code' }]
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
  // The reopen needs a coverage candidate; with none, a declined finding stays settled, as the
  // prompt's history header says under coverage off (#94, R3-3).
  check('coverage: the agent file says the decline reopen needs a coverage candidate, and that with no candidates a decline stays settled', reviewerAgent.includes('that you now confirm from a coverage candidate') && reviewerAgent.includes('With no candidates (a round launched with `coverage off`, or a final nit pass) there is no such exception'))
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
  run = await go('coverage: defaults from reviewerFirstRound', { ...baseArgs, models: { revise: { model: 'claude-opus-5-5' }, reviewerFirstRound: { model: 'm-first', effort: 'xhigh' } } }, { reviews: [[]], coverage: [two], coverageOut: [refutedAll] })
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
  // A bad first entry for a candidate is the entry that stands: a later entry for the same index is
  // ignored with the twice warning, and the candidate is minted as the first warning said (#94,
  // R5-2).
  run = await go('coverage: a bad entry, then another for the same index', covArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1', 'R1-2']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'nope' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], settledAll] })
  const badFirst = (run.res.rounds || [])[0] || { findings: [], coverage: { accounting: [] } }
  check('coverage: a bad first entry stands, a later one for its index is ignored, and the candidate is minted as the warning says', JSON.stringify(badFirst.findings.map((x) => x.id)) === '["R1-1","R1-2"]' && (badFirst.coverage || { accounting: [] }).accounting.map((e) => `${e.index}:${e.outcome}:${e.ref}`).join(',') === '1:verified:R1-1,2:unconfirmed:R1-2' && (run.res.warnings || []).includes('round 1: the reviewer accounted for coverage candidate 2 twice; the first entry stands') && !(run.res.warnings || []).some((w) => w.includes('did not account for coverage candidate 2')), [badFirst.findings.map((x) => x.id), badFirst.coverage, run.res.warnings])
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
  // A renamed id is numbered after the highest id in use, so it never takes another finding's id
  // and a ref to that finding stays with it (#94, R4-6).
  run = await go('coverage: a renamed id takes the next free number', covArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-3', 'correctness'), f('X', 'correctness')], []], commitIds: [['R1-1', 'R1-3', 'R1-4']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-3' }, { index: 2, outcome: 'verified', ref: 'X' }], settledAll] })
  const freeRound = run.res.rounds[0] || { findings: [], coverage: { accounting: [] } }
  check('coverage: a renamed id takes the next free number, and a ref to the id it would have taken stays with its own finding', JSON.stringify(freeRound.findings.map((x) => x.id)) === '["R1-1","R1-3","R1-4"]' && (freeRound.coverage || { accounting: [] }).accounting.map((e) => `${e.index}:${e.outcome}:${e.ref}`).join(',') === '1:verified:R1-3,2:verified:R1-4' && run.res.warnings.includes('round 1: reviewer returned id "X"; renamed R1-4'), [freeRound.findings.map((x) => x.id), freeRound.coverage, run.res.warnings])
  // An id of the round's form the reviewer returns twice is renamed the second time, to the next
  // free number with a warning, so the two findings keep their own threads and outcomes, and a ref
  // to the id stays with the first (#94, R5-5).
  run = await go('coverage: a repeated id', covArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-1', 'nit', { file: 'app/y.php', line: 9 })], []], commitIds: [['R1-1', 'R1-2']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], settledAll] })
  const twiceRound = (run.res.rounds || [])[0] || { findings: [], coverage: { accounting: [] } }
  check('coverage: an id returned twice is renamed the second time with a warning, and a ref to it stays with the first', JSON.stringify(twiceRound.findings.map((x) => `${x.id}:${x.file}`)) === '["R1-1:app/x.php","R1-2:app/y.php"]' && ((twiceRound.coverage || { accounting: [] }).accounting.map((e) => `${e.index}:${e.outcome}:${e.ref}`)[0] || '') === '1:verified:R1-1' && (run.res.warnings || []).includes('round 1: reviewer returned id "R1-1" again; renamed R1-2') && Boolean(replyFor(run.calls, 'push and reply r1', 'R1-2')), [twiceRound.findings.map((x) => x.id), twiceRound.coverage, run.res.warnings])
  // A verified or unconfirmed ref with a note after the id still names that finding: it is read by
  // its leading id with a warning, so the note never mints a second finding (#94, R2-5).
  run = await go('coverage: a verified ref with a note after the id', covArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1 (the guard)' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], settledAll] })
  check('coverage: a ref with a note after the id counts as that finding and mints nothing', run.res.rounds[0].findings.length === 1 && run.res.rounds[0].coverage.counts.verified === 1 && run.res.rounds[0].coverage.counts.unconfirmed === 0 && run.res.rounds[0].coverage.accounting.map((e) => `${e.index}:${e.outcome}:${e.ref}`)[0] === '1:verified:R1-1' && run.res.warnings.some((w) => w.includes('with ref "R1-1 (the guard)"') && w.includes('read as R1-1')), [run.res.rounds[0].findings.map((x) => x.id), run.res.rounds[0].coverage, run.res.warnings])
  // A ref with a note after an id the rename changed follows the rename: its leading token is
  // renamed with the note kept and read past by its leading id, so the candidate is counted as that
  // finding and mints nothing, whether a space or a colon ends the id (#94, R5-3).
  run = await go('coverage: a ref with a note after a renamed id', covArgs, { reviews: [[f('X1', 'correctness')], []], commitIds: [['R1-1']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'X1 (the lock)' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], settledAll] })
  const noteRenamed = (run.res.rounds || [])[0] || { findings: [], coverage: { accounting: [] } }
  const noteWarnings = run.res.warnings || []
  run = await go('coverage: a ref with a note after a wrong-round id', covArgs, { reviews: [[f('R0-1', 'correctness')], []], commitIds: [['R1-1']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R0-1: the lock' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], settledAll] })
  const colonRenamed = (run.res.rounds || [])[0] || { findings: [], coverage: { accounting: [] } }
  const firstEntry = (r) => (r.coverage || { accounting: [] }).accounting.map((e) => `${e.index}:${e.outcome}:${e.ref}`)[0] || ''
  check('coverage: a ref with a note after a renamed id counts as the renamed finding and mints nothing', JSON.stringify(noteRenamed.findings.map((x) => x.id)) === '["R1-1"]' && firstEntry(noteRenamed) === '1:verified:R1-1' && noteWarnings.includes('round 1: reviewer returned id "X1"; renamed R1-1') && noteWarnings.some((w) => w.includes('with ref "R1-1 (the lock)"') && w.includes('read as R1-1')) && JSON.stringify(colonRenamed.findings.map((x) => x.id)) === '["R1-1"]' && firstEntry(colonRenamed) === '1:verified:R1-1', [noteRenamed.findings.map((x) => x.id), noteRenamed.coverage, colonRenamed.findings.map((x) => x.id), colonRenamed.coverage, noteWarnings])
  // The rename reads a ref's leading id as accountCoverage does, so a full stop or a slash after a
  // renamed id ends the id there: the candidate is counted as the renamed finding and mints
  // nothing, and a duplicate's ref that opens with the old id follows the rename with its note kept,
  // so it names a finding of this round. A dash after the id ends no id, so `R0-1-x` is read by
  // neither, and the candidate is kept as an unconfirmed finding with a warning, as before (#94, R9-5).
  const renamedFirst = (r) => (r.coverage || { accounting: [] }).accounting.map((e) => `${e.index}:${e.outcome}:${e.ref}`).join(',')
  run = await go('coverage: a ref with a full stop after a renamed id', covArgs, { reviews: [[f('R0-1', 'correctness')], []], commitIds: [['R1-1']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R0-1. the lock' }, { index: 2, outcome: 'duplicate', ref: 'R0-1: same cause' }], settledAll] })
  const stopRenamed = (run.res.rounds || [])[0] || { findings: [], coverage: { accounting: [] } }
  const stopWarnings = run.res.warnings || []
  check('coverage: a ref with a full stop after a renamed id counts as the renamed finding, and a duplicate ref opening with that id follows the rename, so nothing is minted', JSON.stringify(stopRenamed.findings.map((x) => x.id)) === '["R1-1"]' && renamedFirst(stopRenamed) === '1:verified:R1-1,2:duplicate:R1-1: same cause' && stopWarnings.some((w) => w.includes('with ref "R1-1. the lock"') && w.includes('read as R1-1')) && !stopWarnings.some((w) => w.includes('which is not a finding of this round') || w.includes('names nothing it collapses into')), [stopRenamed.findings.map((x) => x.id), stopRenamed.coverage, stopWarnings])
  run = await go('coverage: a ref with a slash after a renamed id', covArgs, { reviews: [[f('R0-1', 'correctness')], []], commitIds: [['R1-1']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R0-1/the lock' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], settledAll] })
  const slashRenamed = (run.res.rounds || [])[0] || { findings: [], coverage: { accounting: [] } }
  check('coverage: a ref with a slash after a renamed id counts as the renamed finding and mints nothing', JSON.stringify(slashRenamed.findings.map((x) => x.id)) === '["R1-1"]' && renamedFirst(slashRenamed).startsWith('1:verified:R1-1,'), [slashRenamed.findings.map((x) => x.id), slashRenamed.coverage, run.res.warnings])
  run = await go('coverage: a ref with a dash after a renamed id', covArgs, { reviews: [[f('R0-1', 'correctness')], []], commitIds: [['R1-1', 'R1-2']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R0-1-x' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], [{ index: 1, outcome: 'settled', ref: 'R1-1' }, { index: 2, outcome: 'settled', ref: 'R1-2' }]] })
  const dashRenamed = (run.res.rounds || [])[0] || { findings: [], coverage: { accounting: [] } }
  check('coverage: a ref with a dash after a renamed id is not read as that id, so the candidate is kept as an unconfirmed finding with a warning', JSON.stringify(dashRenamed.findings.map((x) => `${x.id}:${x.confidence}`)) === '["R1-1:confirmed","R1-2:unconfirmed"]' && renamedFirst(dashRenamed).startsWith('1:unconfirmed:R1-2,') && (run.res.warnings || []).includes('round 1: the reviewer accounted for coverage candidate 1 as verified with ref "R0-1-x", which is not a finding of this round; kept as an unconfirmed finding as reported'), [dashRenamed.findings.map((x) => x.id), dashRenamed.coverage, run.res.warnings])
  // A candidate with no file is minted at a place prior-findings reads back (#94, R2-6).
  const noPlace = fenced([{ summary: 'no place', failure_scenario: 'f' }])
  run = await go('coverage: a candidate with no file', covArgs, { reviews: [[f('R1-1', 'correctness')], []], decline: ['R1-2'], secondLook: { 'R1-2': 'unconfirmed' }, commitIds: [['R1-1']], coverage: [noPlace, noPlace], coverageOut: [[], [{ index: 1, outcome: 'settled', ref: 'R1-2' }]] })
  check('coverage: a candidate with no file is minted at (no file), line 0, and its body line has a place', body(run.calls, 'post r1').includes('· unconfirmed · `(no file):0` · no place') && !body(run.calls, 'post r1').includes('`:0`'), body(run.calls, 'post r1'))
  // A left-out candidate with neither a summary nor a scenario is kept with a title and a
  // description that say so, never an empty line or an empty bold title (#94, R3-4).
  const noClaim = fenced([{ file: 'app/x.php', line: 3, summary: 'the real one', failure_scenario: 'f' }, { file: 'app/x.php', line: 4 }])
  run = await go('coverage: a candidate with no claim', covArgs, { reviews: [[f('R1-1', 'correctness')], []], decline: ['R1-2'], secondLook: { 'R1-2': 'unconfirmed' }, commitIds: [['R1-1']], coverage: [noClaim, noClaim], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }], [{ index: 1, outcome: 'settled', ref: 'R1-1' }, { index: 2, outcome: 'settled', ref: 'R1-2' }]] })
  const ncPrompt = (pick(run.calls, 'post r1') || { prompt: '' }).prompt
  check('coverage: a left-out candidate with no summary and no scenario is minted with a title and a description that say so', ncPrompt !== '' && body(run.calls, 'post r1').includes('· unconfirmed · `app/x.php:4` · coverage candidate 2 (no summary given)') && ncPrompt.includes('The coverage pass gave this candidate no summary and no failure scenario; check the code at its place.') && !ncPrompt.includes('****'), body(run.calls, 'post r1'))

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
  run = await go('coverage: a skill result that quotes a marker', covArgs, { reviews: [[]], coverage: ['`coverage: skill denied` is one of the markers the prompt names.\n' + two], coverageOut: [refutedAll] })
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
  const covered = pick((await go('coverage: the verifier rules', covArgs, { reviews: [[]], coverage: [two], coverageOut: [refutedAll] })).calls, 'review r1').prompt
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
  // The inline comment's Would confirm line goes through postedText too (#94, R3-2).
  const wcPrompt = (pick(run.calls, 'post r1') || { prompt: '' }).prompt
  const wcAt = wcPrompt.indexOf('{\n  "body"')
  const wcComments = wcAt < 0 ? [] : JSON.parse(wcPrompt.slice(wcAt, wcPrompt.indexOf('\n}\n', wcAt) + 2)).comments || []
  check('posted text: the inline comment\'s Would confirm line goes through the same function as the body line', wcComments.some((c) => c.body.startsWith('**R1-1** · ') && c.body.includes('Could not confirm. Would confirm it: a &lt;b> &amp; c note from @' + WJ + 'param')) && !wcComments.some((c) => c.body.includes('note from @param')), wcComments)

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
  // A ref naming the candidate itself or an index past the last candidate names nothing, so its candidate is kept as an unconfirmed finding (#94, R8-2).
  const forms =fenced([cand('app/z.php', 5, 'the target'), cand('app/z.php', 6, 'a lower-case index ref'), cand('app/z.php', 7, 'an upper-case candidate ref'), cand('app/z.php', 8, 'a ref naming itself'), cand('app/z.php', 9, 'a ref past the last candidate'), cand('app/z.php', 10, 'a ref with a note after the index'), cand('app/z.php', 11, 'a ref whose number runs into a word'), cand('app/z.php', 12, 'a ref with no space after candidate')])
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
  run = await go('coverage: a duplicate\'s target by the form of its ref', covArgs, { reviews: [[]], decline: ['R1-1', 'R1-2'], secondLook: { 'R1-1': 'unconfirmed', 'R1-2': 'unconfirmed' }, coverage: [forms], coverageOut: [formsOut] })
  const fb = body(run.calls, 'post r1')
  check('coverage: a lower-case `index N` duplicate ref reads as another candidate\'s index and gives its place and outcome', fb.includes('\n- `app/z.php:6` · a lower-case index ref · duplicate: index 1 (candidate 1, `app/z.php:5`: refuted)\n'), fb)
  check('coverage: an upper-case `CANDIDATE N` duplicate ref reads as another candidate\'s index, since the parse ignores case', fb.includes('\n- `app/z.php:7` · an upper-case candidate ref · duplicate: CANDIDATE 1 (candidate 1, `app/z.php:5`: refuted)\n'), fb)
  // A ref naming the candidate itself, or an index past the round's last, names nothing it
  // collapses into, so the candidate is kept as an unconfirmed finding with a warning (#94, R8-2).
  check('coverage: a duplicate ref naming the candidate itself names nothing it collapses into, so the candidate is kept as an unconfirmed finding with a warning', fb.includes('\n- **R1-1** · correctness · medium · unconfirmed · `app/z.php:8` · a ref naming itself\n') && !fb.includes('· duplicate: 4\n') && run.res.warnings.includes('round 1: the reviewer accounted for coverage candidate 4 as duplicate with ref "4", which names nothing it collapses into; kept as an unconfirmed finding as reported'), [fb, run.res.warnings])
  check('coverage: a duplicate ref past the round\'s last candidate names nothing it collapses into, so the candidate is kept as an unconfirmed finding with a warning', fb.includes('\n- **R1-2** · correctness · medium · unconfirmed · `app/z.php:9` · a ref past the last candidate\n') && !fb.includes('· duplicate: 99\n') && run.res.warnings.includes('round 1: the reviewer accounted for coverage candidate 5 as duplicate with ref "99", which names nothing it collapses into; kept as an unconfirmed finding as reported'), [fb, run.res.warnings])
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

  // A collapse names what it collapses into (#94, R8-2): two duplicates naming each other, a
  // duplicate of an id no finding has and a settled ref naming no earlier finding each name
  // nothing, so each candidate is kept as an unconfirmed finding with a warning; a duplicate ref
  // in words names something and stays as written in the block, with no warning.
  const nameless = fenced([cand('app/q.php', 1, 'a pair, one way'), cand('app/q.php', 2, 'a pair, the other way'), cand('app/q.php', 3, 'a duplicate of a finding no round has'), cand('app/q.php', 4, 'settled into a finding no round has'), cand('app/q.php', 5, 'a duplicate in words')])
  const namelessOut = [
    { index: 1, outcome: 'duplicate', ref: '2' },
    { index: 2, outcome: 'duplicate', ref: 'candidate 1' },
    { index: 3, outcome: 'duplicate', ref: 'R1-9' },
    { index: 4, outcome: 'settled', ref: 'R1-8 was decided' },
    { index: 5, outcome: 'duplicate', ref: 'the same cause as the owner check' },
  ]
  run = await go('coverage: a collapse whose ref names nothing', covArgs, { reviews: [[]], decline: ['R1-1', 'R1-2', 'R1-3', 'R1-4'], secondLook: { 'R1-1': 'unconfirmed', 'R1-2': 'unconfirmed', 'R1-3': 'unconfirmed', 'R1-4': 'unconfirmed' }, coverage: [nameless], coverageOut: [namelessOut] })
  nb = body(run.calls, 'post r1')
  const namesNothing = (index, outcome, ref) => run.res.warnings.includes(`round 1: the reviewer accounted for coverage candidate ${index} as ${outcome} with ref ${JSON.stringify(ref)}, which names nothing it collapses into; kept as an unconfirmed finding as reported`)
  check('coverage: two duplicates that name each other name nothing, so each is kept as an unconfirmed finding with a warning', nb.includes('\n- **R1-1** · correctness · medium · unconfirmed · `app/q.php:1` · a pair, one way\n') && nb.includes('\n- **R1-2** · correctness · medium · unconfirmed · `app/q.php:2` · a pair, the other way\n') && namesNothing(1, 'duplicate', '2') && namesNothing(2, 'duplicate', 'candidate 1'), [nb, run.res.warnings])
  check('coverage: a duplicate of an id no finding has, and a settled ref whose id no earlier finding has, are each kept as an unconfirmed finding with a warning', nb.includes('\n- **R1-3** · correctness · medium · unconfirmed · `app/q.php:3` · a duplicate of a finding no round has\n') && nb.includes('\n- **R1-4** · correctness · medium · unconfirmed · `app/q.php:4` · settled into a finding no round has\n') && namesNothing(3, 'duplicate', 'R1-9') && namesNothing(4, 'settled', 'R1-8 was decided'), [nb, run.res.warnings])
  check('coverage: a duplicate ref in words names something, so it stays as written in the block, with no warning', nb.includes('### Candidates set aside (1)') && nb.includes('\n- `app/q.php:5` · a duplicate in words · duplicate: the same cause as the owner check\n') && !run.res.warnings.some((w) => w.includes('coverage candidate 5')), [nb, run.res.warnings])

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
  let run = await go('posted text: the lines outside the block', { ...baseArgs, askRules: [{ id: 'billing', when: { prose: 'the change alters what a customer is charged' }, reason: 'Billing changes are reviewed by finance' }], decisions: { 'R1-1': { choice: 'Make the change by hand after the run', notes: 'The author makes it by hand.', date: '2026-11-13' } }, deferrals: goAhead('R1-3') }, { reviews: [outside, []], postDrop: ['R1-2'], defer: ['R1-3'], askRule: { 'R1-1': 'billing' }, mitigation: 'a <b> guard', commitIds: [['R1-3']], summary: ['Uses @param and <b>.', 'Line one with `<b>`\nline two'] })
  const r1 = review(run.calls, 'post r1')
  check('posted text: the finding line escapes its title and keeps its suffix', r1.body.includes('\n- **R1-1** · correctness · low · confirmed · `app/x.php:1` · ' + posted + ' · left to @author under rule billing\n'), r1.body)
  check('posted text: the inline comment\'s title line is escaped the same way', r1.comments.some((c) => c.body.includes('\n\n**' + posted + '**\n\n')), r1.comments.map((c) => c.body))
  check('posted text: an Already tracked line reads its title and knownAs as one text', r1.body.includes('### Already tracked\n\n- **R1-2** one ` open: #41 `&lt;c>`'), r1.body)
  check('posted text: the summary is escaped and neutralised', r1.body.includes('\n\nUses @' + WJ + 'param and &lt;b>.\n\n'), r1.body)
  check('posted text: a summary with a newline is escaped whole, its span included', review(run.calls, 'post r2').body.includes('\n\nLine one with `&lt;b>`\nline two\n\n'), review(run.calls, 'post r2').body)
  check('posted text: the closing sentence follows the last finding list, Already tracked, and ends the body', r1.body.endsWith('### Already tracked\n\n- **R1-2** one ` open: #41 `&lt;c>`\n\n' + CLOSING), r1.body)
  let handoff = comment(run.calls, 'handoff comment')
  check('posted text: the handoff\'s Deferred line escapes the title and says where the item went', handoff.includes('- **R1-3** Deferred @' + WJ + 'csrf &lt;i> check: deferred to #301; mitigated in '), handoff)
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
  check('posted text: a carried finding\'s line under Fixed escapes its read-back title once', handoff.includes('<summary>With the commits that fixed each</summary>\n\n- **R2-2** ' + posted + ': fixed in '), handoff)
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
  // In a Redline round decidedBy reviewer is a human review pass's value whatever the disposition,
  // so a decline that carries it stops at shape as a fix does; a decline with another wrong owner
  // is still rewritten to redline with a warning (#94, R5-7).
  run = await go('decline: decided by reviewer', baseArgs, { ...scenario, ownerOf: { 'R1-3': 'reviewer' } })
  const reviewerOwned = [run.res.status, run.res.stage, run.res.error, (run.res.resumeFrom || {}).label].join('|')
  run = await go('decline: decided by pending', baseArgs, { ...scenario, ownerOf: { 'R1-3': 'pending' } })
  check('decline: a decline marked decided by reviewer stops at shape as a fix does, and one marked pending is rewritten with a warning', reviewerOwned === 'error|shape|the shaper sorted R1-3 with a human review pass\'s values (none, or decidedBy reviewer) in a Redline round|shape r1' && run.res.status === 'done' && (run.res.warnings || []).includes('round 1: the shaper marked the decline of R1-3 as decided by pending; a decline is Redline\'s own') && (replyFor(run.calls, 'push and reply r1', 'R1-3') || '').endsWith(' · decided by: redline'), [reviewerOwned, run.res.status, run.res.warnings])

  const asked = { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], commitIds: [['R1-1']] }
  run = await go('ask: outside the cases', baseArgs, { ...asked, whyHuman: { 'R1-1': 'unsure' } })
  check('ask: a reason that is not one of the cases stops at shape, and the person is not asked', run.res.status === 'error' && run.res.stage === 'shape' && run.res.error === 'the shaper asked about R1-1 because of "unsure", which is not one of the cases the person is asked in on a Redline round (product decision, spec assumption, outside the pull request, no clear pick, unconfirmed, serious if true, redline\'s own file, or a repository rule)' && (run.res.judgmentCalls || []).length === 0, [run.res.status, run.res.error])
  check('ask: a refused reason names the shaper as the step to resume, not the spec check', JSON.stringify(run.res.resumeFrom) === JSON.stringify({ label: 'shape r1', attempt: 2 }), run.res.resumeFrom)
  // On a reshape the error names that reshape (#94, R2-9).
  run = await go('ask: outside the cases on a reshape', baseArgs, { reviews: [[f('R1-1', 'correctness')], []], planBounce: 1, reshapeAsk: ['R1-1'], whyHuman: { 'R1-1': 'unsure' }, commitIds: [['R1-1']] })
  check('ask: a refused reason on a reshape names that reshape as the step to resume', run.res.status === 'error' && run.res.stage === 'shape' && JSON.stringify(run.res.resumeFrom) === JSON.stringify({ label: 'reshape r1 #1', attempt: 2 }), [run.res.status, run.res.error, run.res.resumeFrom])
  // A call a repository rule covers is judged by the reason the rule gives it, so the shaper's own
  // reason, outside the cases, never stops the round (#94, R1-13).
  run = await go('ask: outside the cases, under a repository rule', { ...baseArgs, askRules: [{ id: 'craft-config', when: { paths: ['config/project/**'] }, reason: 'Craft project config is applied through the control panel' }] }, { ...asked, reviews: [[f('R1-1', 'correctness', { file: 'config/project/project.yaml', line: 3 })], []], whyHuman: { 'R1-1': 'unsure' } })
  check('ask: a rule-covered call whose reason is outside the cases is not refused, and is asked under the rule', run.res.status === 'handoff' && run.res.handoffKind === 'decisions' && (run.res.judgmentCalls || []).length === 1 && run.res.judgmentCalls[0].why_human === 'repository rule craft-config', [run.res.status, run.res.error, run.res.judgmentCalls])
  for (const reason of ['product decision', 'spec assumption', 'outside the pull request', 'no clear pick', 'unconfirmed, serious if true', 'redline\'s own file']) {
    run = await go(`ask: ${reason}`, baseArgs, { ...asked, whyHuman: { 'R1-1': reason } })
    check(`ask: "${reason}" is a reason the person is asked for, and the run stops for them`, run.res.status === 'handoff' && run.res.handoffKind === 'decisions' && run.res.judgmentCalls[0].why_human === reason, [run.res.status, run.res.error])
  }

  // A finding on one of Redline's own files is the person's on every dial, as a rule-covered one is
  // (#94, R8-4): on autopilot it is left to them and never decided, its reply opens "left to", it is
  // listed under Deferred with no mitigation and under Left to, and the resolve agent is told no task
  // writes anything for it.
  const ownFile = await go('ask: redline\'s own file, on autopilot', { ...baseArgs, interrupt: 'autopilot' }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness', { file: '.claude/redline.json', line: 3 })], []], ask: ['R1-2'], whyHuman: { 'R1-2': 'redline\'s own file' }, commitIds: [['R1-1']] })
  const ownHandoff = comment(ownFile.calls, 'handoff comment') || ''
  const ownReply = replyFor(ownFile.calls, 'push and reply r1', 'R1-2') || ''
  check('ask: on autopilot a finding on Redline\'s own files is left to the person, never decided: its reply opens "left to", and it is listed under Left to with what Redline would have done, never under Deferred', ownFile.res.status === 'done' && ownReply.startsWith('Redline round 1: left to @author under the rule on Redline\'s own files (no Redline role may write them).') && ownReply.endsWith(' · decided by: redline (autopilot)') && ownHandoff.includes('### Left to @author (Redline\'s own files)\n\n- **R1-2** title R1-2: Redline\'s own files (no Redline role may write them); open: Keep it; left to @author under the rule on Redline\'s own files') && !ownHandoff.includes('### Deferred') && !ownHandoff.includes('Autopilot took the shaper\'s recommendation: Keep it'), [ownFile.res.status, ownReply, ownHandoff])
  check('ask: the result names a finding on Redline\'s own files as left to the person, and the resolve agent is told no task writes anything for it', JSON.stringify((ownFile.res.forced || []).map((x) => [x.id, x.own === true, x.open])) === '[["R1-2",true,"open: Keep it"]]' && (ownFile.res.deferred || []).length === 0 && (pick(ownFile.calls, 'resolve r1') || { prompt: '' }).prompt.includes('A decision carrying `own` is on a finding on one of Redline\'s own files') && (pick(ownFile.calls, 'resolve r1') || { prompt: '' }).prompt.includes('the finding is not listed under Deferred in shape.md, which holds only what carries a drafted issue'), [ownFile.res.forced, ownFile.res.deferred])

  // With repository ask rules declared, a decided call on Redline's own files carries `rule` and
  // `own`, so the resolve prompt's rule bullet sends a decision with `own` to the own-file bullet
  // and the resolve agent never gets two wordings for one decision (#94, R9-4). The Left-to heading
  // names its groups in the order docs/running.md gives, repository rules first, whichever forced
  // finding comes first: here the own-file finding does (#94, R9-7).
  const ownAndRule = await go('ask: redline\'s own file beside a repository rule, on autopilot', { ...baseArgs, interrupt: 'autopilot', askRules: [{ id: 'craft-config', when: { paths: ['config/project/**'] }, reason: 'Craft project config is applied through the control panel' }] }, { reviews: [[f('R1-1', 'correctness', { file: '.claude/redline.json', line: 3 }), f('R1-2', 'correctness', { file: 'config/project/project.yaml', line: 3 }), f('R1-3', 'correctness')], []], ask: ['R1-1', 'R1-2'], whyHuman: { 'R1-1': 'redline\'s own file' }, commitIds: [['R1-3']] })
  const bothResolve = (pick(ownAndRule.calls, 'resolve r1') || { prompt: '' }).prompt
  const bothHandoff = comment(ownAndRule.calls, 'handoff comment') || ''
  check('ask: with ask rules declared, the resolve prompt\'s rule bullet sends a decision that also carries `own` to the own-file bullet', ownAndRule.res.status === 'done' && bothResolve.includes('A decision carrying `rule` is on a finding a repository ask rule covers (one that also carries `own` is on one of Redline\'s own files and follows the next bullet instead), left to the person') && bothResolve.includes('A decision carrying `own` is on a finding on one of Redline\'s own files'), [ownAndRule.res.status, ownAndRule.res.error, bothResolve])
  check('ask: the Left-to heading names repository rules before Redline\'s own files when the own-file finding comes first', ownAndRule.res.status === 'done' && JSON.stringify((ownAndRule.res.forced || []).map((x) => x.id)) === '["R1-1","R1-2"]' && bothHandoff.includes('### Left to @author (repository rules and Redline\'s own files)\n'), [ownAndRule.res.forced, bothHandoff])

  // A human review pass is unchanged: it keeps its own reasons and its own wording, and it gains
  // no decline.
  const h = (id, extra) => ({ id, file: 'app/x.php', line: 1, side: 'RIGHT', category: 'human', severity: 'medium', confidence: 'confirmed', title: `comment ${id}`, description: `Please change ${id}.`, proposedFix: '', needsDecision: false, knownAs: '', source: '@marcamos', commentId: 900, threadId: 900, reviewId: 7, ...extra })
  const humanArgs = (findings) => ({ ...baseArgs, firstRound: 3, revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: '', specFolder: 'agent-os/specs/2026-10-20-1600-114-human-review-1', findings, commentIds: Object.fromEntries(findings.map((x) => [x.id, x.threadId])), posted: true } })
  run = await go('human: the shaper declines', humanArgs([h('H1-1')]), { reviews: [], decline: ['H1-1'], commitIds: [[]] })
  // The stop resumes at the shaper, whose label the throw passes itself: the spec check runs first,
  // so lastLabel names the spec-status call, and a resume there would replay the refused result
  // (#120, R1-3). Until R2-1 no check read this stop's label.
  check('human: a decline stops the pass at shape, resumable at the shaper', run.res.status === 'error' && run.res.stage === 'shape' && run.res.error.includes('the shaper declined H1-1') && run.res.error.includes('never a decline of Redline\'s own') && labels(run.calls).join('|') === 'shape h1|spec status h1' && (run.res.resumeFrom || {}).label === 'shape h1', [run.res.status, run.res.error, labels(run.calls), run.res.resumeFrom])
  // That stop is the workflow's own check of the shaper's result, and a human pass's first shape
  // goes by the same field as a round's (#117): nothing was fixed by hand, then the rewrite.
  const humanResumed = await go('human: the shaper declined, resumed', { ...humanArgs([h('H1-1')]), resume: { 'shape h1': { attempt: 2, error: run.res.error, hand: { commits: [], paths: [] }, ownCheck: run.res.ownCheck === true } } }, { reviews: [[]], commitIds: [['H1-1'], []] })
  const humanShape = (pick(humanResumed.calls, 'shape h1') || { prompt: '' }).prompt
  check('human: a first shape resumed after that check is told nothing was fixed by hand, then to rewrite the four files', run.res.ownCheck === true && humanShape.includes('Resume attempt 2 of this step.') && humanShape.endsWith('and the duplicate checks in your instructions apply. When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it. Rewrite plan.md, shape.md, standards.md and references.md in the spec folder from scratch, replacing what the earlier attempt wrote; never change or remove anything under its redline/ folder.') && (humanResumed.res || {}).status !== 'error', [run.res.ownCheck, humanShape.slice(-500), (humanResumed.res || {}).status, (humanResumed.res || {}).error])
  run = await go('human: an ask for a reason of its own', humanArgs([h('H1-1')]), { reviews: [], ask: ['H1-1'], whyHuman: { 'H1-1': 'unsure' }, commitIds: [[]] })
  check('human: a human pass still asks for its own reasons, in its own words', run.res.status === 'handoff' && run.res.judgmentCalls[0].why_human === 'unsure' && pick(run.calls, 'shape h1').prompt.includes('Judgment calls are returned, never decided') && pick(run.calls, 'shape h1').prompt.includes('Sort each finding into fix, ask or none; never defer'), [run.res.status, run.res.error])
  // Its schema is its own (#94, R1-5): HUMAN_WHY, and none of the Redline round's cases.
  const humanEnum = whyEnum(run.calls, 'shape h1')
  check('human: a human pass\'s shaper schema keeps its own reasons and has none of a Redline round\'s', ['product decision', 'spec assumption', 'new standard', 'unsure', 'disproportionate fix'].every((w) => humanEnum.includes(w)) && !humanEnum.includes('redline\'s own file') && !humanEnum.includes('outside the pull request'), humanEnum)
  check('human: a human pass\'s shaper schema takes fix, ask and none, and no decline or defer', dispositionEnum(run.calls, 'shape h1').join('|') === 'fix|ask|none', dispositionEnum(run.calls, 'shape h1'))
  check('human: a human pass\'s shaper schema requires every finding\'s files, and its prompt asks for them', findingRequired(run.calls, 'shape h1').includes('files') && (pick(run.calls, 'shape h1') || { prompt: '' }).prompt.includes(FILES_ASKED), findingRequired(run.calls, 'shape h1'))

  // A repository ask rule still wins: the person is brought in even for what the shaper would decline.
  const rules = [{ id: 'craft-config', when: { paths: ['config/project/**'] }, reason: 'Craft project config is applied through the control panel' }]
  const ruled = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness', { file: 'config/project/project.yaml', line: 3 })], []], decline: ['R1-2'], reason: { 'R1-2': 'the handle is renamed on purpose' }, commitIds: [['R1-1']] }
  run = await go('decline: under a repository rule', { ...baseArgs, askRules: rules }, ruled)
  check('decline: a rule-covered decline is still put to the person, with a warning', run.res.status === 'handoff' && JSON.stringify(run.res.decisionsNeeded) === '["R1-2"]' && run.res.warnings.includes('round 1: the shaper sorted R1-2 as decline; repository rule craft-config makes it an ask for the person'), [run.res.status, run.res.warnings])
  check('decline: its call says what Redline would have done and recommends no change', run.res.judgmentCalls[0].why_human === 'repository rule craft-config' && run.res.judgmentCalls[0].recommendation === 'Accept, no change: the handle is renamed on purpose.' && run.res.judgmentCalls[0].options[0].effect === 'Redline would have declined it: the handle is renamed on purpose.', run.res.judgmentCalls[0])
  // A rule-covered decline with no reason is put to the person under the rule, recommending no
  // change, never stopped for its missing reason: the reason check runs after forceAskRules, as
  // checkWhy does (#94, R5-6).
  run = await go('decline: no reason, under a repository rule', { ...baseArgs, askRules: rules }, { ...ruled, declineNoReason: ['R1-2'] })
  const noReasonCall = (run.res.judgmentCalls || [])[0] || { options: [{}] }
  check('decline: a rule-covered decline with no reason is put to the person under the rule, recommending no change', run.res.status === 'handoff' && JSON.stringify(run.res.decisionsNeeded) === '["R1-2"]' && noReasonCall.why_human === 'repository rule craft-config' && noReasonCall.recommendation === 'Accept, no change.' && noReasonCall.options[0].effect === 'Redline would have declined it.', [run.res.status, run.res.error, run.res.judgmentCalls])
  // On autopilot a rule-covered finding the shaper declined is listed under Deferred with what
  // Redline would have done, never as a change left open (#94, R5-8).
  run = await go('decline: under a repository rule, on autopilot', { ...baseArgs, askRules: rules, interrupt: 'autopilot' }, ruled)
  const ruledHandoff = comment(run.calls, 'handoff comment') || ''
  check('decline: a rule-covered decline on autopilot is listed as what Redline would have declined, with no open change', run.res.status === 'done' && ruledHandoff.includes('); Redline would have declined it: the handle is renamed on purpose; left to @author under repository rule craft-config') && !ruledHandoff.includes('open: Accept, no change') && !ruledHandoff.includes('### Deferred') && ((run.res.forced || []).find((x) => x.id === 'R1-2') || {}).open === 'Redline would have declined it: the handle is renamed on purpose.', [run.res.status, ruledHandoff, run.res.forced])
  // The second look is read (#94, R7-5): a finding the verifier could not confirm that the shaper
  // gives no secondLook, and a decline as could not confirm whose second look refuted the claim,
  // each leave a warning; a decline as could not confirm whose second look stayed unconfirmed, none.
  const looks = await go('second look: read and checked', baseArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit', { confidence: 'unconfirmed', wouldConfirm: 'a browser' }), f('R1-3', 'nit', { confidence: 'unconfirmed', wouldConfirm: 'a queue' }), f('R1-4', 'nit', { confidence: 'unconfirmed', wouldConfirm: 'a cron' })], []], decline: ['R1-2', 'R1-3', 'R1-4'], reason: { 'R1-2': 'could not confirm: needs a browser', 'R1-3': 'could not confirm: needs a queue', 'R1-4': 'could not confirm: needs a cron' }, secondLook: { 'R1-3': 'refuted', 'R1-4': 'unconfirmed' }, commitIds: [['R1-1']] })
  check('second look: a missing one and a refuted one declined as could not confirm each leave a warning, and a consistent one none', looks.res.status === 'done' && looks.res.warnings.includes('round 1: the shaper gave no second look (secondLook) for R1-2, which the verifier could not confirm') && looks.res.warnings.includes('round 1: the shaper declined R1-3 as could not confirm, but its second look says refuted') && !looks.res.warnings.some((w) => w.includes('R1-4')), looks.res.warnings)
  // A reshape is vetted as the shape is (#94, R8-5), so its prompt asks for the second look as the
  // shape prompt does, and a reshape that returns what its prompt asks for raises no second-look
  // warning for a finding the verifier could not confirm (#94, R9-3).
  const bounced = await go('second look: on a reshape', baseArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit', { confidence: 'unconfirmed', wouldConfirm: 'a browser' })], []], secondLook: { 'R1-2': 'confirmed' }, planBounce: 1, commitIds: [['R1-1', 'R1-2']] })
  check('second look: the reshape prompt asks for secondLook, and a reshape that returns it raises no second-look warning', bounced.res.status === 'done' && (pick(bounced.calls, 'reshape r1 #1') || { prompt: '' }).prompt.includes('secondLook for a finding the verifier could not confirm') && !(bounced.res.warnings || []).some((w) => w.includes('gave no second look')), [bounced.res.status, bounced.res.error, bounced.res.warnings])
  // A reshape after autopilot settled the call keeps what Redline would have declined (#94, R7-7):
  // the reshape returns the rule-covered finding as an ask with no call, as it is told to, and the
  // forced entry the decided call rests on stands.
  run = await go('decline: under a repository rule, on autopilot, after a reshape', { ...baseArgs, askRules: rules, interrupt: 'autopilot' }, { ...ruled, planBounce: 1, reshapeAsk: ['R1-2'], reshapeOmitCall: ['R1-2'] })
  const reshapedHandoff = comment(run.calls, 'handoff comment') || ''
  check('decline: after a reshape returns it as an ask, a rule-covered decline on autopilot is still listed as what Redline would have declined', run.res.status === 'done' && labels(run.calls).includes('reshape r1 #1') && reshapedHandoff.includes('); Redline would have declined it: the handle is renamed on purpose; left to @author under repository rule craft-config') && !reshapedHandoff.includes('open: By hand') && ((run.res.forced || []).find((x) => x.id === 'R1-2') || {}).open === 'Redline would have declined it: the handle is renamed on purpose.', [run.res.status, labels(run.calls), reshapedHandoff, run.res.forced])

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
  // The resolve agent's rule says an override replaces the shaper's decision, a decline included,
  // and never that a shaper's decision is never reopened; the implementer keeps that sentence
  // (#94, R4-4).
  check('decline: the resolve rule says an override replaces the shaper\'s decision, and the implementer keeps never reopened', resolve.includes('A disposition override is the person\'s decision and replaces the shaper\'s, a decline included.') && !resolve.includes('never reopened') && (pick(second.calls, 'implement r1') || { prompt: '' }).prompt.includes('is applied as recorded and never reopened.'), resolve.slice(-900))
  check('decline: an overruled decline is fixed, decided by the person', replyFor(second.calls, 'push and reply r1', 'R1-2') === 'Redline round 1: The author wants the rename now, since a third caller lands next week. Applied in 2bbbbbb (redline: R1-2 fix). · decided by: @author', replyFor(second.calls, 'push and reply r1', 'R1-2'))
  // A defer the reshape re-sorts to decline is posted as declined and never listed under Deferred;
  // the deferred entry the reshape left beside it is dropped with a warning, and the implementer is
  // not given it (#94, R4-9). The mock's reshape keeps the entry for a scenario's defer ids.
  const deferResorted = await go('decline: a reshape re-sorts a defer to decline', { ...baseArgs, deferrals: goAhead('R1-4') }, { reviews: [[f('R1-1', 'correctness'), f('R1-4', 'nit')], []], defer: ['R1-4'], planBounce: 1, reshapeDecline: ['R1-4'], commitIds: [['R1-1']] })
  check('decline: a defer re-sorted to decline is posted as declined, never listed under Deferred, and its stray entry is dropped with a warning', deferResorted.res.status === 'done' && (replyFor(deferResorted.calls, 'push and reply r1', 'R1-4') || '').startsWith('Redline round 1: declined: ') && !comment(deferResorted.calls, 'handoff comment').includes('### Deferred') && deferResorted.res.deferred.length === 0 && !(pick(deferResorted.calls, 'implement r1') || { prompt: '' }).prompt.includes('"mitigation": "a guard clause"') && deferResorted.res.warnings.some((w) => w.includes('R1-4') && w.includes('as deferred, but its disposition is not defer')), [deferResorted.res.status, deferResorted.res.deferred, deferResorted.res.warnings])
  // A shaper deferral the person changes on the plan dial is no deferral any more: changed to fix,
  // it leaves no entry under Deferred and none reaches the implementer, with or without a reshape;
  // restated as defer with the person's own mitigation, the resolve agent's entry replaces the
  // shaper's (#94, R5-9).
  const deferToFix = { ...planArgs, approvedPlans: [1], decisions: { 'R1-4': { choice: 'fix', notes: 'Fix it properly now.', date: '2026-11-14', disposition: 'fix' } } }
  const deferScenario = { reviews: [[f('R1-1', 'correctness'), f('R1-4', 'nit')], []], defer: ['R1-4'], commitIds: [['R1-1', 'R1-4']] }
  const changedPlain = await go('defer: changed to fix on the plan dial', deferToFix, deferScenario)
  const changedBounced = await go('defer: changed to fix on the plan dial, then a reshape', deferToFix, { ...deferScenario, planBounce: 1 })
  const noDeferral = (x) => x.res.status === 'done' && (x.res.deferred || []).length === 0 && !(comment(x.calls, 'handoff comment') || '').includes('### Deferred') && !(pick(x.calls, 'implement r1') || { prompt: '' }).prompt.includes('"mitigation": "a guard clause"')
  check('defer: a deferral the person changes to fix on the plan dial is never listed under Deferred nor given to the implementer, with or without a reshape', noDeferral(changedPlain) && noDeferral(changedBounced), [changedPlain.res.status, changedPlain.res.deferred, changedBounced.res.status, changedBounced.res.deferred])
  const restated = await go('defer: restated with the person\'s mitigation on the plan dial', { ...planArgs, approvedPlans: [1], decisions: { 'R1-4': { choice: 'defer', notes: 'Defer it behind a log line.', date: '2026-11-14', disposition: 'defer' } }, deferrals: goAhead('R1-4') }, { ...deferScenario, resolveDeferred: [{ id: 'R1-4', mitigation: 'a log line', fullFix: 'a lock', title: 'Lock R1-4', found: 'found R1-4', why: 'why R1-4' }] })
  check('defer: a deferral restated on the plan dial lists the resolve agent\'s mitigation, not the shaper\'s', restated.res.status === 'done' && (restated.res.deferred || []).length === 1 && restated.res.deferred[0].mitigation === 'a log line' && restated.res.deferred[0].number === 301 && (comment(restated.calls, 'handoff comment') || '').includes('### Deferred (1)\n\n- **R1-4** title R1-4: Defer it behind a log line. Applied in ') && (comment(restated.calls, 'handoff comment') || '').includes(' Deferred to #301. · decided by: @author'), [restated.res.status, restated.res.deferred, comment(restated.calls, 'handoff comment')])

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
  // It says no fix was committed and never claims the diff is empty, which a standards commit is not (#94, R1-20).
  check('done: the no-fix-diff prompt says the round committed no fix and never claims its diff is empty', noDiff.includes('round 1 committed no fix; its spec and standards commits are not one') && !noDiff.includes('is empty)'), noDiff.slice(0, 1500))
  check('done: its coverage pass runs at the same head, and its review body says what was reviewed', promptOf(run.calls, 'coverage r2').includes('at ' + 'a'.repeat(40)) && body(run.calls, 'post r2').startsWith('Redline round 2\n\nRound 1 changed no code; reviewed the coverage pass\'s candidates over the whole pull request at aaaaaaa.\n') && run.res.rounds.length === 2 && run.res.rounds[1].range.empty === true, [body(run.calls, 'post r2').slice(0, 300), run.res.rounds.length])

  // An asked nit buys nothing: only a correctness item does.
  run = await go('done: an asked nit buys nothing', { ...covArgs, decisions: keep }, { reviews: [[f('R1-1', 'nit')]], ask: ['R1-1'], acceptedCalls: ['R1-1'], commitIds: [[]], coverage: [one], coverageOut: [acct('R1-1')] })
  check('done: an asked nit, answered with no change, buys no round', run.res.status === 'done' && run.res.rounds.length === 1 && !labels(run.calls).includes('coverage r2') && run.res.note === 'The last revise pass committed no fix, so there was no fix diff to re-review.', [run.res.status, labels(run.calls), run.res.note])

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
  // The kinds' last sentence is the pass's: a final nit pass is told what a correctness finding
  // buys there, every other review keeps "buys another round" (#94, R2-2).
  check('done: the final nit pass is told a correctness finding gets one more revise pass and then the run ends, and a whole-PR prompt keeps buys another round', promptOf(run.calls, 'final nit pass r2').includes('in this final nit pass a correctness finding the run acts on gets one more revise pass, and then the run ends') && !promptOf(run.calls, 'final nit pass r2').includes('buys another round') && promptOf(run.calls, 'review r1').includes('a correctness finding the run acts on buys another round.') && reviewerAgent.includes('(in a final nit pass, one more revise pass, after which the run ends)'), promptOf(run.calls, 'final nit pass r2').slice(-1200))
  run = await go('done: the final nit pass, both declined', covArgs, nitThen({ decline: ['R2-1', 'R2-2'], commitIds: [['R1-1'], []] }))
  check('done: a final nit pass whose items were all declined says none was changed, and flags nothing as unreviewed', run.res.status === 'done' && !('lastFixUnreviewed' in run.res) && comment(run.calls, 'handoff comment').includes('Redline ran 2 review rounds. The final nit pass found 2 correctness items in the nit fixes; none was changed, and each is listed below. ') && !comment(run.calls, 'handoff comment').split('\n')[2].includes('fixed'), comment(run.calls, 'handoff comment').slice(0, 400))
  run = await go('done: the final nit pass, both fixed', covArgs, nitThen({ commitIds: [['R1-1'], ['R2-1', 'R2-2']] }))
  check('done: a final nit pass whose two items were both fixed says so in the plural', run.res.lastFixUnreviewed === true && comment(run.calls, 'handoff comment').includes('Redline ran 2 review rounds. The final nit pass found 2 correctness bugs in the nit fixes; they were fixed in one more pass, which was not re-reviewed. Please look at those commits first. '), comment(run.calls, 'handoff comment').slice(0, 400))
  // A correctness item put to the person buys the round even when a reshape re-sorts it to a
  // decline afterwards: the call was asked (#94, R2-11). Coverage off, so the next round is a
  // re-review of the fix diff rather than a final nit pass. The answer keeps the code as it is, so
  // its task touches no file (acceptedCalls) and no commit has to name it.
  run = await go('done: an answered ask a reshape declines still buys the round', { ...baseArgs, decisions: { 'R1-2': { choice: 'Keep it', notes: 'Kept as it is, on purpose.', date: '2026-11-13' } } }, { reviews: [[f('R1-1', 'nit'), f('R1-2', 'correctness')], []], ask: ['R1-2'], acceptedCalls: ['R1-2'], planBounce: 1, reshapeDecline: ['R1-2'], reshapeOmitCall: ['R1-2'], commitIds: [['R1-1'], []] })
  check('done: an answered correctness ask that a reshape re-sorts to a decline still buys the next round', labels(run.calls).includes('reshape r1 #1') && labels(run.calls).includes('re-review r2') && !labels(run.calls).includes('final nit pass r2'), labels(run.calls))
  // A commit that mentions a declined item never makes the sentence call it fixed (#94, R2-12).
  run = await go('done: the final nit pass, a declined item a commit mentions', covArgs, nitThen({ decline: ['R2-2'], commitIds: [['R1-1'], ['redline: R2-1 guard the loop; R2-2 needs no change']] }))
  check('done: a commit that mentions a declined item does not count it fixed in the final nit pass sentence', comment(run.calls, 'handoff comment').includes('The final nit pass found 2 correctness items in the nit fixes: 1 fixed in one more pass, which was not re-reviewed (please look at that commit first); 1 not changed, listed below. '), comment(run.calls, 'handoff comment').slice(0, 400))
  // The neighbour: a deferral's mitigation commit is still counted, so it is flagged for a look.
  // The sentence still calls it fixed; naming it apart is R2-12's deferred full fix.
  run = await go('done: the final nit pass, one deferred with its mitigation', { ...covArgs, deferrals: goAhead('R2-1') }, nitThen({ defer: ['R2-1'], commitIds: [['R1-1'], ['R2-1', 'R2-2']] }))
  check('done: a final nit pass deferral\'s mitigation commit is still flagged as unreviewed', run.res.status === 'done' && run.res.lastFixUnreviewed === true && comment(run.calls, 'handoff comment').includes('### Deferred (1)\n\n- **R2-1** '), [run.res.status, run.res.lastFixUnreviewed, comment(run.calls, 'handoff comment')])

  // The same after a human-review pass: its summary gives the counts (decision 8's question).
  const h = (id, extra) => ({ id, file: 'app/x.php', line: 1, side: 'RIGHT', category: 'human', severity: 'medium', confidence: 'confirmed', title: `comment ${id}`, description: `Please change ${id}.`, proposedFix: '', needsDecision: false, knownAs: '', source: '@marcamos', commentId: 900, threadId: 900, reviewId: 7, ...extra })
  const humanArgs = { ...baseArgs, firstRound: 3, revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: '', specFolder: 'agent-os/specs/2026-10-20-1600-114-human-review-1', findings: [h('H1-1')], commentIds: { 'H1-1': 900 }, posted: true } }
  const two = [f('R3-1', 'correctness'), f('R3-2', 'correctness')]
  run = await go('done: a human pass, the nit pass finds two, one fixed and one declined', humanArgs, { reviews: [two], decline: ['R3-2'], commitIds: [['H1-1'], ['R3-1']] })
  check('done: after a human-review pass, a final nit pass with one item fixed and one declined gives both counts', run.res.status === 'done' && run.res.lastFixUnreviewed === true && comment(run.calls, 'summary comment').includes('Final nit pass (Redline round 3): 2 correctness items in the fixes: 1 fixed in one more pass that was not re-reviewed; 1 not changed, answered in its thread.'), comment(run.calls, 'summary comment'))
  run = await go('done: a human pass, the nit pass finds two, both declined', humanArgs, { reviews: [two], decline: ['R3-1', 'R3-2'], commitIds: [['H1-1'], []] })
  check('done: after a human-review pass, a final nit pass whose items were all declined never says fixed', run.res.status === 'done' && run.res.lastFixUnreviewed === false && comment(run.calls, 'summary comment').includes('Final nit pass (Redline round 3): 2 correctness items in the fixes; none was changed, and each is answered in its thread.') && !comment(run.calls, 'summary comment').includes('fixed in one more pass'), comment(run.calls, 'summary comment'))
  // A nit pass's deferral is named with where it went, and never called fixed, though its
  // mitigation's commit is still flagged as unreviewed (#97, R4-7).
  run = await go('done: a human pass, the nit pass defers its one item with a mitigation', { ...humanArgs, deferrals: goAhead('R3-1') }, { reviews: [[f('R3-1', 'correctness')]], defer: ['R3-1'], commitIds: [['H1-1'], ['R3-1']] })
  check('done: after a human-review pass, a final nit pass deferral is named with its issue and never called fixed', run.res.status === 'done' && run.res.lastFixUnreviewed === true && comment(run.calls, 'summary comment').includes('Final nit pass (Redline round 3): 1 correctness item in the fixes: R3-1 deferred to #301.') && !comment(run.calls, 'summary comment').includes('fixed in one more pass'), [run.res.status, run.res.error, comment(run.calls, 'summary comment')])
  run = await go('done: a human pass, the nit pass fixes one and defers one', { ...humanArgs, deferrals: goAhead('R3-2') }, { reviews: [two], defer: ['R3-2'], commitIds: [['H1-1'], ['R3-1', 'R3-2']] })
  check('done: after a human-review pass, a final nit pass that fixed one and deferred one counts the fix and names the deferral', run.res.status === 'done' && comment(run.calls, 'summary comment').includes('Final nit pass (Redline round 3): 2 correctness items in the fixes: 1 fixed in one more pass that was not re-reviewed; R3-2 deferred to #301.'), [run.res.status, run.res.error, comment(run.calls, 'summary comment')])
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
  // A second stop in the same round (here an answer the resolve agent could not apply) does not
  // list again a decline the person already overruled (#94, R2-15).
  const again = await go('overrule: a second stop after an overrule', { ...covArgs, askRules: rules, decisions, deferrals: goAhead('R1-4') }, { ...scenario, unresolved: [{ id: 'R1-2', why: 'no such option' }] })
  check('overrule: a second decisions stop leaves out a decline the person already overruled', again.res.status === 'handoff' && again.res.handoffKind === 'decisions' && JSON.stringify((again.res.declined || []).map((d) => d.id)) === '["R1-3","R1-6"]', [again.res.status, again.res.handoffKind, again.res.declined])
  // An override the resolve agent cannot apply is handed back with its line and its why, and is a
  // decision the stop needs, so the stop has something to ask (#94, R4-8).
  const stuckOverride = await go('overrule: an override the resolve cannot apply', { ...covArgs, askRules: rules, decisions, deferrals: goAhead('R1-4') }, { ...scenario, unresolved: [{ id: 'R1-7', why: 'the notes do not say what to fix' }] })
  check('overrule: an override the resolve agent cannot apply is handed back with its why and is a decision needed', stuckOverride.res.status === 'handoff' && stuckOverride.res.handoffKind === 'decisions' && JSON.stringify(stuckOverride.res.decisionsNeeded) === '["R1-7"]' && JSON.stringify(stuckOverride.res.overridesUnresolved) === JSON.stringify([{ id: 'R1-7', title: 'title R1-7', disposition: 'fix', notes: 'Fix it now; a third caller lands next week.', why: 'the notes do not say what to fix' }]), [stuckOverride.res.status, stuckOverride.res.decisionsNeeded, stuckOverride.res.overridesUnresolved])
  // A stop after a plan approver of the round has run (a reshape's) lists no declines and names
  // them for the after-run door, since the round's first resolve, which applies an overrule, ran
  // before it; the relaunch then replays to the stop and the answer reaches the reshape's resolve
  // (#94, R3-7).
  const late = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], decline: ['R1-2'], planBounce: 1, reshapeAsk: ['R1-1'], commitIds: [['R1-1']] }
  const lateStop = await go('overrule: a reshape stop', baseArgs, late)
  check('overrule: a reshape\'s decisions stop lists no declines and names them for after the run', lateStop.res.status === 'handoff' && lateStop.res.handoffKind === 'decisions' && JSON.stringify(lateStop.res.decisionsNeeded) === '["R1-1"]' && JSON.stringify(lateStop.res.declined) === '[]' && JSON.stringify(lateStop.res.declinedAfterRun) === '["R1-2"]', [lateStop.res.status, lateStop.res.handoffKind, lateStop.res.decisionsNeeded, lateStop.res.declined, lateStop.res.declinedAfterRun])
  // A finding whose call the person already answered is theirs, whatever a reshape sorts it as: a
  // reshape that returns it as a decline and raises a new call never hands it back as Redline's
  // decline to overrule after the run (#94, R8-6).
  const decidedLate = await go('overrule: a reshape declines a decided call\'s finding and raises a new call', { ...baseArgs, decisions: { 'R1-2': { choice: 'Keep it', notes: 'The author keeps it as it is.', date: '2026-11-02' } } }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-2'], planBounce: 1, reshapeDecline: ['R1-2'], reshapeAsk: ['R1-1'], commitIds: [['R1-1']] })
  check('overrule: a finding whose call was decided is never listed as Redline\'s decline at a reshape\'s stop', decidedLate.res.status === 'handoff' && decidedLate.res.handoffKind === 'decisions' && JSON.stringify(decidedLate.res.decisionsNeeded) === '["R1-1"]' && JSON.stringify(decidedLate.res.declined) === '[]' && JSON.stringify(decidedLate.res.declinedAfterRun) === '[]', [decidedLate.res.status, decidedLate.res.handoffKind, decidedLate.res.decisionsNeeded, decidedLate.res.declined, decidedLate.res.declinedAfterRun])
  // The plan approver checks the shaper's own dispositions and sends one back, and the reshape
  // decides again a decision of its own that an adjustment names (#94, R4-5).
  const lateApprover = (pick(lateStop.calls, 'plan approver r1') || { prompt: '' }).prompt
  const lateReshape = (pick(lateStop.calls, 'reshape r1 #1') || { prompt: '' }).prompt
  check('overrule: the plan approver is told it checks the shaper\'s dispositions, and the reshape decides one an adjustment names again', lateApprover.includes('a bounce sends one back to the shaper to decide again') && !lateApprover.includes('never reopened') && lateReshape.includes('except one of your own (Decided by: redline) that an adjustment names, which you decide again') && lateReshape.includes('a decision the person made, or the autopilot applied, stays as it is'), [lateApprover.slice(-1400), lateReshape.slice(-1200)])
  const lateRun = await go('overrule: a reshape stop answered', { ...baseArgs, decisions: { 'R1-1': { choice: 'Keep it', notes: 'Kept as it is after the reshape.', date: '2026-11-14' } } }, late)
  samePrefix('overrule: the relaunch from a reshape stop', lateStop.calls, lateRun.calls, lateStop.calls.length)
  check('overrule: the answer typed at a reshape stop reaches the reshape\'s resolve, and the first resolve does not run', Boolean(pick(lateRun.calls, 'resolve r1 #1')) && pick(lateRun.calls, 'resolve r1 #1').prompt.includes('Kept as it is after the reshape.') && !pick(lateRun.calls, 'resolve r1'), labels(lateRun.calls))
  const run = await go('layout: every outcome in one run', { ...covArgs, askRules: rules, decisions, deferrals: goAhead('R1-4') }, scenario)
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
    'To overrule one, reply in its thread (for one in the review body, which has no thread, submit a pull request review whose body names its id), then run `/redline:redline-revise 114 review @<login>` with the login of whoever replied, such as `review @author`.',
    '',
    '- **R1-3** title R1-3: declined: the spec keeps R1-3 as it is on purpose · decided by: redline',
    '- **R1-6** title R1-6: declined: could not confirm: needs two workers on one queue · decided by: redline',
    '',
    '### Deferred (1)',
    '',
    '- **R1-4** title R1-4: deferred to #301; mitigated in 3bbbbbb · decided by: redline',
    '',
    '### Left to @author (repository rules)',
    '',
    '- **R1-5** title R1-5: rule craft-config (Craft project config is applied through the control panel); left to @author under repository rule craft-config: Done by hand after the merge. · decided by: @author',
    '',
    '### Fixed (1)',
    '',
    '<details>',
    '<summary>With the commits that fixed each</summary>',
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
  const anon = await go('layout: no login', { ...covArgs, askRules: rules, login: '', decisions, deferrals: goAhead('R1-4') }, scenario)
  const anonHandoff = comment(anon.calls, 'handoff comment')
  check('layout: with no login the person running Redline stands in everywhere, and the overrule line asks for a login', anon.res.status === 'done' && anonHandoff.includes('### Put to the person running Redline (1)') && anonHandoff.includes('### Left to the person running Redline (repository rules)') && anonHandoff.includes('left to the person running Redline under repository rule craft-config') && anonHandoff.includes('To overrule one, reply in its thread (for one in the review body, which has no thread, submit a pull request review whose body names its id), then run `/redline:redline-revise 114 review @<login>` with the login of whoever replied.') && !anonHandoff.includes('the author'), anonHandoff)
  // With no login, a decision with no notes starts its sentence with a capital (#94, R4-3).
  const noNotes = await go('layout: no login, a decision with no notes', { ...covArgs, askRules: rules, login: '', decisions: { ...decisions, 'R1-2': { choice: 'Keep it', date: '2026-11-13' } }, deferrals: goAhead('R1-4') }, scenario)
  const noNotesReply = replyFor(noNotes.calls, 'push and reply r1', 'R1-2') || ''
  check('layout: with no login a decision with no notes starts its sentence with a capital', noNotesReply.startsWith('Redline round 1: The person running Redline chose: Keep it.') && noNotesReply.endsWith('· decided by: the person running Redline'), noNotesReply)

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
  // With no login the fallback opens the sentence, so it is capitalised (#94, R1-17).
  const cappedAnon = await go('layout: the cap-hit comment with no login', { ...covArgs, maxRounds: 1, login: '' }, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')]], commitIds: [['R1-1']], coverage: [one, one], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }], [{ index: 1, outcome: 'verified', ref: 'R2-1' }]] })
  check('layout: with no login the cap-hit comment opens its sentence with a capital', cappedAnon.res.status === 'capped' && comment(cappedAnon.calls, 'cap-hit comment').includes('so it has not requested a review. The person running Redline will pick these up.'), comment(cappedAnon.calls, 'cap-hit comment'))
}

// ---------------------------------------------------------------------------
// #95, the model: a deferred item is worth doing and not here, of any kind; its mitigation is
// optional and it always carries a drafted issue; a decline never points at follow-up work.
// ---------------------------------------------------------------------------
{
  const read = (...parts) => fs.readFileSync(path.join(here, '..', ...parts), 'utf8')
  const shaperAgent = read('agents', 'redline-shaper.md')
  const template = read('templates', 'shape-spec-unattended.md')
  const section = read('.claude', 'commands', 'agent-os', 'shape-spec.md')
  for (const phrase of ['drafted issue that stands on its own', 'A decline never points at follow-up work', 'A mitigation is optional', 'ships a mitigation', 'Deferring is your decision, never a question']) {
    check(`defer: the shaper's file, the template and this repository's section all say "${phrase}"`, shaperAgent.includes(phrase) && template.includes(phrase) && section.includes(phrase), [shaperAgent.includes(phrase), template.includes(phrase), section.includes(phrase)])
  }
  // The rule #95 retired is gone from all three: a decline that names where the work belongs.
  for (const phrase of ['where it belongs (a follow-up issue)', 'the fix belongs elsewhere (say where)', 'no cheap mitigation exists']) {
    check(`defer: none of the three still says "${phrase}"`, !shaperAgent.includes(phrase) && !template.includes(phrase) && !section.includes(phrase), [shaperAgent.includes(phrase), template.includes(phrase), section.includes(phrase)])
  }
  const approverAgent = read('agents', 'redline-plan-approver.md')
  check('defer: the plan approver\'s file asks for a task only of a deferral that ships a mitigation, and bounces a decline that points at follow-up work', approverAgent.includes('ships a mitigation') && approverAgent.includes('points at follow-up work'), [approverAgent.includes('ships a mitigation'), approverAgent.includes('points at follow-up work')])
  // What a deferral ships is the round's record (#100), and each place a person or an agent meets
  // the rule says so: the plan approver holds the file list and the plan to each other, the
  // implementer makes the mitigation's commit the finding's own, and the docs, the README and the
  // skill say what is read and that no commit is demanded.
  const implementerAgent = read('agents', 'redline-implementer.md')
  const runningDoc = read('docs', 'running.md')
  for (const [name, text, phrases] of [
    ['the plan approver\'s file', approverAgent, ['whose `files` list is empty has no task', 'lists `files` with no task for it in `plan.md`']],
    ['the implementer\'s file', implementerAgent, ['with no task in `plan.md` gets no change and no commit', 'only a commit of the finding\'s own is counted']],
    ['docs/running.md', runningDoc, ['A deferral buys a round only through a commit of its own', '**Whether a mitigation shipped.**', 'no commit is demanded of a deferral', 'read by no Redline pass', 'which are shown only beside a mitigation that ships', 'the resolve agent planned no task with files for it; posted with its decision', 'except in the plan dial\'s list of the shaper\'s dispositions', '**A reshape after your decision.**', 'the run follows the plan as reshaped', 'the reshape changed the files of R1-4\'s task, a finding decided by @<login>, from app/x.php to none', 'the reshape left its task with no files; posted with its decision', 'stops the run at stage `shape`, resumable at that reshape', 'or `reshape h<n> #<k>` in a human review pass', 'and so, for a deferral, are a draft at the end-of-run stop and the two warnings above', 'stay as the resolve agent wrote them for your decision', 'that a task counts only for the finding it names', 'the stop\'s `detail` lists it under `reshaped`', 'whenever it was shown as a deferral, whether its decision named one', 'At a reshape after a bounced plan (`reshape r<n> #<k>`, `reshape h<n> #<k>`) it never rewrites them', 'it corrects what the error names and keeps the decided entries', 'named in `shape.md` as lost, never written back from memory', 'and their tasks unless an adjustment changes one', 'The folder is checked before the result the shaper returned', 'in a round folder its own launch created, nothing you or the autopilot decided can be there yet', 'once that run reached its implement step', 'After either kind of stop, an entry of yours the folder no longer holds is named in `shape.md` as lost', 'The check sees a refused Write only where it leaves a file missing', 'so a resume reruns the check alone', 'so that case takes two relaunches']],
    ['docs/upgrading.md', read('docs', 'upgrading.md'), ['and is not stopped at one now, is not affected']],
    ['the README\'s Known limits', read('README.md'), ['**No commit is demanded of a deferral.**', 'read by no Redline pass']],
    ['the skill\'s plan dial', read('skills', 'redline', 'SKILL.md'), ['`files` (the paths its task touches, empty when it has no task;', 'for an ask, the paths its recommended change would touch; for a defer', 'holds each defer\'s mitigation as the shaper wrote it']],
    ['the skill\'s closing summary', read('skills', 'redline', 'SKILL.md'), ['and what shipped, from `ships` and never from whether `mitigation` is empty', 'and what shipped, from `ships`, as that section says']],
  ]) {
    for (const phrase of phrases) {
      check(`defer: ${name} says "${phrase}"`, text.includes(phrase))
    }
  }
  check('defer: the skill\'s plan dial has no space before the comma after a decline\'s reason', !read('skills', 'redline', 'SKILL.md').includes('thread) ,'))
  check('defer: the script\'s comment on the mitigation field says the words are shown only beside a mitigation that ships', src.includes('only beside a mitigation the record says ships'))
  check('defer: every call of draftsOf passes its files reader, with no default that names a later declaration', !src.includes('filesOf = plannedFiles'))
  check('defer: a deferred outcome carries no mitigation words, so no reply or outcome line can post them without a commit of its own', !src.includes('outcome.mitigation') && !src.includes('mitigation: shipsNothing ? \'\' : deferredItem.mitigation'))
  check('defer: the skill\'s closing summary no longer reads an empty mitigation as nothing shipped', !read('skills', 'redline', 'SKILL.md').includes('(`mitigation` is empty when nothing shipped)'))
  check('defer: the script\'s done-rule comment says a deferral buys a round only through a commit of its own', !src.includes('(in full, or by a deferral\'s mitigation) or puts to the') && src.includes('A deferral buys it only through a commit of its own'))
  check('defer: the deferred schema\'s comment says nothing reads the mitigation field to decide anything, since a call\'s decision is read from what is stated (#99)', src.includes('since #99 nothing reads the field to decide anything') && !src.includes('read once, as filled or empty, by isDeferral') && !src.includes('shown and never read to decide'))
  check('defer: the comment on the mitigation field names the plan dial\'s list as the one that shows the shaper\'s words', src.includes('the plan dial\'s list of the shaper\'s'))
  check('defer: plannedFiles reads the shaper\'s own list through shaperFiles alone, with no second test of it', !src.includes('shaperPlanned'))
  check('defer: a finding\'s task files are read through one helper, by the resolve-time checks and for the list plannedFiles reads (#108, R1-7; #106)', src.includes('const taskFilesOf = (tasks, id) =>') && src.includes('taskFilesOf(out.tasks, id)') && src.includes('decidedFiles[id] = taskFiles(id)') && !src.includes('unique(out.tasks.filter((task) => task.finding === id)') && !src.includes('resolvedTasks'))
  check('defer: the skill\'s plan dial no longer reads an empty mitigation in deferredPlanned as nothing shipping', !read('skills', 'redline', 'SKILL.md').includes('holds each defer\'s mitigation (empty when nothing ships now)'))
  check('defer: the skill\'s draft stop calls a mitigation with empty words a planned change only at a round\'s stop, and a change in its own commit at the end-of-run stop', read('skills', 'redline', 'SKILL.md').includes('"a change in its own commit" at the end-of-run stop') && !read('skills', 'redline', 'SKILL.md').includes('or "a planned change" when the words are empty'))
  // What shipped is stated from `ships` first, and the words follow it labelled as its words
  // (#103, R3-3): they are not checked and can say that nothing ships, so the draft stop and the
  // closing summary never print them alone as what shipped.
  check('defer: the skill\'s draft stop and closing summary state what shipped from ships first and the words after it, labelled as its words', read('skills', 'redline', 'SKILL.md').split('then the words as written, labelled as its words, when they are not empty').length === 3 && !read('skills', 'redline', 'SKILL.md').includes('true: the mitigation as written'), [read('skills', 'redline', 'SKILL.md').split('then the words as written, labelled as its words, when they are not empty').length - 1, read('skills', 'redline', 'SKILL.md').includes('true: the mitigation as written')])
  // The comments this pull request added above draftView and isDeferral wrap at the file's width
  // (#103, R3-5). An anchor that is absent reads as one over-long line, so the check fails and
  // does not throw.
  const commentLines = (start, end) => {
    const a = src.indexOf(start)
    const b = a < 0 ? -1 : src.indexOf(end, a)
    return a < 0 || b < 0 ? ['x'.repeat(101)] : src.slice(a, b).split('\n')
  }
  const wrapped = [commentLines('// A draft as a stop shows it to the person', 'function draftView('), commentLines('  // The round\'s deferrals as they stand', '  const isDeferral = ')]
  check('defer: the comments above draftView and isDeferral wrap at 100 columns', wrapped.every((lines) => lines.every((line) => line.length <= 100)), wrapped.map((lines) => Math.max(...lines.map((line) => line.length))))
  check('defer: isDeferral reads a decided call from what the resolve agent states, with no reader of the mitigation field or of the resolve agent\'s entries', !src.includes('plannedTask') && !src.includes('mitigationFilled') && !src.includes('resolveDeferred') && src.includes("return stated[d.id] === 'defer'"))
  for (const [name, text] of [['the plan approver\'s file', approverAgent], ['the implementer\'s file', implementerAgent]]) {
    check(`defer: ${name} no longer reads a deferral's task off an empty mitigation`, !text.includes('with an empty mitigation has no task'))
  }
  check('defer: the resolve agent\'s file has it draft the issue for a deferral the person chose', read('agents', 'redline-resolve.md').includes('drafted issue'))

  // A deferral with a mitigation is as before: its commit is demanded, and a correctness one buys the next round.
  const mitigated = await go('defer: a correctness deferral that ships a mitigation', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], commitIds: [['R1-1']] })
  check('defer: with a mitigation, a correctness deferral buys the next round', mitigated.res.status === 'done' && mitigated.res.rounds.length === 2 && mitigated.res.rounds[1].reviewed === 'fix-diff', [mitigated.res.status, mitigated.res.rounds.map((r) => r.reviewed)])
  const shape = (pick(mitigated.calls, 'shape r1') || { prompt: '' }).prompt
  check('defer: the shape prompt asks for the drafted issue and says a deferral with no mitigation has no task', shape.includes('it always carries a drafted issue that stands on its own') && shape.includes('neither has a deferred one that ships no mitigation') && shape.includes('its drafted issue as title, found, why and fullFix'), shape.slice(-1800))
  // Every finding lists its files, in a repository with no ask rules too (#100): the round reads
  // whether a deferral planned a mitigation from them, never from the words of its mitigation.
  check('defer: the shaper\'s file says every finding lists its files and that a deferral\'s planned mitigation is read from them', shaperAgent.includes(FILES_ASKED) && shaperAgent.includes('never from the words of `mitigation`'), [shaperAgent.includes(FILES_ASKED), shaperAgent.includes('never from the words of `mitigation`')])
  check('defer: the shape prompt of a repository with no ask rules asks for every finding\'s files', shape.includes(FILES_ASKED), shape.slice(-900))
  check('defer: the shape prompt asks an ask for the paths its recommended change would touch, as the ask-rules block does', shape.includes('for an ask, the paths its recommended change would touch'), shape.slice(-900))
  check('defer: the plan approver and the implementer are shown the entry with its draft', [(pick(mitigated.calls, 'plan approver r1') || { prompt: '' }).prompt, (pick(mitigated.calls, 'implement r1') || { prompt: '' }).prompt].every((p) => p.includes('"title": "Lock R1-1"') && p.includes('"why": "why R1-1"')))

  // No mitigation: no task, no commit demanded, nothing bought. The nit fixed beside it earns the
  // final nit pass, as any fix does; the deferral itself earns nothing.
  const bare = await go('defer: a correctness deferral that ships nothing, beside a nit', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], []], defer: ['R1-1'], mitigations: { 'R1-1': '' }, commitIds: [['R1-2']] })
  check('defer: with no mitigation the gate passes without a commit for it, and it buys no round', bare.res.status === 'done' && bare.res.rounds.length === 2 && bare.res.rounds[1].reviewed === 'final-nit-pass', [bare.res.status, bare.res.error, bare.res.rounds.map((r) => r.reviewed)])
  check('defer: with no mitigation the reply says where the item went and is not called mitigated', replyFor(bare.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: deferred to #301. · decided by: redline', replyFor(bare.calls, 'push and reply r1', 'R1-1'))
  // A handoff that may be absent reads as '', so a run that took another path fails the check and does not throw.
  const handoffOf = (r) => (pick(r.calls, 'handoff comment') ? comment(r.calls, 'handoff comment') : '')
  check('defer: with no mitigation the handoff line says where the item went and names no mitigation', handoffOf(bare).includes('### Deferred (1)\n\n- **R1-1** title R1-1: deferred to #301 · decided by: redline\n'), handoffOf(bare))
  check('defer: the implementer is told a deferral with no task in the plan gets no change and no commit', (pick(bare.calls, 'implement r1') || { prompt: '' }).prompt.includes('a deferred finding with no task in plan.md gets no change and no commit'))

  // The words of a mitigation decide nothing (#100). With no task planned and only a commit that
  // names the finding, which is not its mitigation (#95), nothing shipped whatever the field says:
  // no final nit pass, no round bought, no words posted and no warning. The list holds phrases #97
  // read as nothing (R1-7, R3-2), the wording its list missed, and a sentence that describes a
  // real mitigation, which read as one and bought a round until the commits were read instead.
  for (const [word, name] of [['none', 'the word none'], ['', 'an empty string'], ['Nothing ships now.', 'nothing ships now'], ['None; nothing ships in this pull request.', 'none with its reason after a semicolon'], ['No code ships in this pull request.', 'a sentence no phrase list held'], ['Log the retry count when the queue is down.', 'a sentence that describes a mitigation']]) {
    const named = await go(`defer: no task, the mitigation worded as ${name}, and a commit that only names it`, { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')]], defer: ['R1-1'], mitigations: { 'R1-1': word }, files: { 'R1-1': [] }, commitIds: [['redline: standards edits for R1-1']] })
    check(`defer: with no task and no commit of its own, ${name} ships nothing: no final nit pass, no round bought, no words posted, no warning`, named.res.status === 'done' && named.res.rounds.length === 1 && !labels(named.calls).includes('gather r2') && replyFor(named.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: deferred to #301. · decided by: redline' && !handoffOf(named).includes('changed no code') && ((named.res.deferred || [])[0] || {}).mitigation === '' && !(named.res.warnings || []).some((w) => w.includes('R1-1')), [named.res.status, named.res.error, labels(named.calls).slice(-8), replyFor(named.calls, 'push and reply r1', 'R1-1'), handoffOf(named).split('\n')[2], named.res.deferred, named.res.warnings])
  }
  // The neighbour: a deferral with a planned task and a commit of its own ships, whatever its words begin with.
  const noneOf = await go('defer: a mitigation that begins with the word none', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], mitigations: { 'R1-1': 'None of the callers pass null, so a guard clause' }, commitIds: [['R1-1']] })
  check('defer: a mitigation that only begins with "none" still ships, is demanded and buys the round', noneOf.res.status === 'done' && noneOf.res.rounds.length === 2 && noneOf.res.rounds[1].reviewed === 'fix-diff', [noneOf.res.status, noneOf.res.rounds.map((r) => r.reviewed)])
  // The pinned case of #100: nothing ships, said in words no list holds, with no task. The words
  // decide nothing, so the check demands no commit and the round ends; before, the wording read as
  // a mitigation and the round stopped at the check after its repair, on every resume.
  const WARNED = 'round 1: R1-1 planned a mitigation in app/x.php and no commit of its own landed; posted as shipping nothing'
  const pinned = await go('defer: nothing ships, in words no list holds, and no task', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')]], defer: ['R1-1'], mitigations: { 'R1-1': 'No code ships in this pull request.' }, files: { 'R1-1': [] }, commitIds: [[]] })
  check('defer: "No code ships in this pull request." with no task demands no commit, ends its round and is posted as shipping nothing, with no warning', pinned.res.status === 'done' && !(pinned.res.error || '').includes('no commit names') && replyFor(pinned.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: deferred to #301. · decided by: redline' && !(pinned.res.warnings || []).some((w) => w.includes('R1-1')), [pinned.res.status, pinned.res.stage, pinned.res.error, replyFor(pinned.calls, 'push and reply r1', 'R1-1'), pinned.res.warnings])
  check('defer: the result\'s entry for the pinned case carries no mitigation words, since nothing shipped', ((pinned.res.deferred || [])[0] || {}).mitigation === '', pinned.res.deferred)
  check('defer: the result\'s entry for the pinned case says nothing shipped', ((pinned.res.deferred || [])[0] || {}).ships === false, pinned.res.deferred)
  // A deferral's commit is never demanded (#100): a planned mitigation the build left out is a
  // warning naming the planned files, never a stop and never a repair pass, and its draft is filed.
  const unbuiltMitigation = await go('defer: a planned mitigation the build leaves out', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')]], defer: ['R1-1'], commitIds: [[]] })
  check('defer: a planned mitigation with no commit of its own is a warning naming its files, never a stop or a repair, and the draft is still filed', unbuiltMitigation.res.status === 'done' && !labels(unbuiltMitigation.calls).includes('repair r1') && labels(unbuiltMitigation.calls).includes('file deferred r1') && replyFor(unbuiltMitigation.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: deferred to #301. · decided by: redline' && (unbuiltMitigation.res.warnings || []).includes(WARNED), [unbuiltMitigation.res.status, unbuiltMitigation.res.stage, unbuiltMitigation.res.error, labels(unbuiltMitigation.calls).slice(-6), replyFor(unbuiltMitigation.calls, 'push and reply r1', 'R1-1'), unbuiltMitigation.res.warnings])
  check('defer: a planned mitigation with no commit of its own buys nothing', unbuiltMitigation.res.status === 'done' && unbuiltMitigation.res.rounds.length === 1 && !handoffOf(unbuiltMitigation).includes('changed no code'), [unbuiltMitigation.res.status, handoffOf(unbuiltMitigation).split('\n')[2]])
  // The neighbour: a fix the build left out still fails the check, is sent to the repair and stops.
  const unbuiltFix = await go('defer: the neighbour, a fix the build leaves out', baseArgs, { reviews: [[f('R1-1', 'correctness')]], commitIds: [[], []] })
  check('defer: a fix with no commit still stops at the check after its repair', unbuiltFix.res.status === 'error' && unbuiltFix.res.stage === 'check' && (unbuiltFix.res.error || '').includes('no commit names R1-1') && labels(unbuiltFix.calls).includes('repair r1'), [unbuiltFix.res.status, unbuiltFix.res.stage, unbuiltFix.res.error, labels(unbuiltFix.calls).slice(-4)])
  // The mirror of the pinned case (#100): the words say nothing ships, and the round planned a
  // task with files whose own commit landed. It shipped: it is posted as mitigated, its words go
  // with the result's entry as written, and a correctness one buys the next round, since new code
  // went in. #97, R2-6 had such a commit posted and read by a final nit pass only.
  for (const [word, name] of [['none', 'the word none'], ['', 'an empty string']]) {
    const mirror = await go(`defer: a task with files and a commit of its own, the mitigation worded as ${name}`, { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], mitigations: { 'R1-1': word }, files: { 'R1-1': ['app/x.php'] }, commitIds: [['R1-1']] })
    check(`defer: a planned task with files and a commit of its own ships, with the mitigation worded as ${name}: posted as mitigated, the next round bought, no warning`, mirror.res.status === 'done' && replyFor(mirror.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: deferred to #301. Mitigated in 1bbbbbb (redline: R1-1 fix). · decided by: redline' && (mirror.res.rounds[1] || {}).reviewed === 'fix-diff' && ((mirror.res.deferred || [])[0] || {}).mitigation === word && !(mirror.res.warnings || []).some((w) => w.includes('R1-1')), [mirror.res.status, mirror.res.error, replyFor(mirror.calls, 'push and reply r1', 'R1-1'), mirror.res.rounds.map((r) => r.reviewed), mirror.res.deferred, mirror.res.warnings])
    check(`defer: the result's entry says a mitigation shipped, read off its own commit, with the mitigation worded as ${name}`, ((mirror.res.deferred || [])[0] || {}).ships === true, mirror.res.deferred)
  }
  // A commit of its own counts with no files listed too (#100): the record after the build is the
  // commit. It is posted as the mitigation and buys the round, and a warning says the shaper
  // listed no files, so a shaper that stops listing them does not go unnoticed.
  const unlisted = await go('defer: no words and no files, and a commit of its own', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], mitigations: { 'R1-1': '' }, files: { 'R1-1': [] }, commitIds: [['R1-1']] })
  check('defer: a commit of its own with no files listed is counted: posted as mitigated, the next round bought, and a warning says the shaper listed none', unlisted.res.status === 'done' && replyFor(unlisted.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: deferred to #301. Mitigated in 1bbbbbb (redline: R1-1 fix). · decided by: redline' && (unlisted.res.rounds[1] || {}).reviewed === 'fix-diff' && (unlisted.res.warnings || []).includes('round 1: R1-1 has a commit of its own (1bbbbbb) and the shaper listed no files for its task; posted as its mitigation'), [unlisted.res.status, unlisted.res.error, replyFor(unlisted.calls, 'push and reply r1', 'R1-1'), unlisted.res.rounds.map((r) => r.reviewed), unlisted.res.warnings])
  // A deferral buys the next round only through a commit of its own (#100), so one the person
  // changed to accept, which ships none, buys nothing. The neighbour is #93's rule: a fix the
  // person changed to accept still buys the round, whatever they answered.
  const acceptIt = { 'R1-1': { choice: 'accept', notes: 'Keep it as it is.', date: '2026-11-17', disposition: 'accept' } }
  const deferAccepted = await go('defer: the shaper defers with a task, and the person changes it to accept', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: acceptIt }, { reviews: [[f('R1-1', 'correctness')]], defer: ['R1-1'], commitIds: [[]] })
  check('defer: a deferral the person changed to accept ships no commit of its own, so it buys nothing', deferAccepted.res.status === 'done' && deferAccepted.res.rounds.length === 1 && handoffOf(deferAccepted) !== '' && !handoffOf(deferAccepted).includes('changed no code'), [deferAccepted.res.status, deferAccepted.res.error, handoffOf(deferAccepted).split('\n')[2]])
  const fixAccepted = await go('defer: the neighbour, the shaper fixes and the person changes it to accept', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: acceptIt }, { reviews: [[f('R1-1', 'correctness')]], commitIds: [[]] })
  check('defer: a fix the person changed to accept still buys the round', fixAccepted.res.status === 'done' && handoffOf(fixAccepted).includes('changed no code'), [fixAccepted.res.status, fixAccepted.res.error, handoffOf(fixAccepted).split('\n')[2]])
  // Only a planned deferral's own commit is posted with it when it ships nothing (#97, R3-5): the
  // standards commit names a finding it finishes, and a commit that only mentions the id is no
  // mitigation, so the reply names none and no final nit pass follows.
  const mentionedBare = await go('defer: the shaper lists files for a deferral that ships nothing, and only the standards commit names it', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')]], defer: ['R1-1'], mitigations: { 'R1-1': '' }, files: { 'R1-1': ['app/x.php'] }, commitIds: [['redline: record the round 1 review lessons in the standards, finishing R1-1 (#95)']] })
  check('defer: a commit that only mentions a planned deferral that ships nothing is not posted as its mitigation, earns no final nit pass and raises the warning', mentionedBare.res.status === 'done' && replyFor(mentionedBare.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: deferred to #301. · decided by: redline' && mentionedBare.res.rounds.length === 1 && !labels(mentionedBare.calls).includes('gather r2') && (mentionedBare.res.warnings || []).includes(WARNED), [mentionedBare.res.status, replyFor(mentionedBare.calls, 'push and reply r1', 'R1-1'), mentionedBare.res.rounds.map((r) => r.reviewed)])

  // The phrase list and its reader are gone (#100): nothing in the script reads a mitigation by its words.
  check('defer: the script holds neither the phrase list nor its reader', !src.includes('NOTHING_SHIPS') && !src.includes('hasMitigation'), [src.includes('NOTHING_SHIPS'), src.includes('hasMitigation')])
  // A deferral with no drafted issue is a result the run cannot use: the shaper is rerun.
  const undrafted = await go('defer: the shaper drafts no issue', baseArgs, { reviews: [[f('R1-1', 'correctness')]], defer: ['R1-1'], noDraft: ['R1-1'], commitIds: [[]] })
  check('defer: a deferral with no drafted issue stops at shape, resumable at the shaper', undrafted.res.status === 'error' && undrafted.res.stage === 'shape' && undrafted.res.error === 'the shaper deferred R1-1 with no drafted issue (missing title, found, why); a deferred item always carries one' && undrafted.res.resumeFrom && undrafted.res.resumeFrom.label === 'shape r1', [undrafted.res.status, undrafted.res.error, undrafted.res.resumeFrom])
  // The same holds for a deferral the person chose, which the resolve agent drafts.
  const override = { 'R1-1': { choice: 'defer', notes: 'Defer it behind a log line.', date: '2026-11-16', disposition: 'defer' } }
  const resolved = await go('defer: the resolve agent drafts no issue', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: override }, { reviews: [[f('R1-1', 'correctness')]], commitIds: [[]], resolveDeferred: [{ id: 'R1-1', mitigation: 'a log line', fullFix: 'a lock' }] })
  check('defer: a deferral the resolve agent returns with no drafted issue stops at resolve, resumable there', resolved.res.status === 'error' && resolved.res.stage === 'resolve' && resolved.res.error === 'the resolve agent deferred R1-1 with no drafted issue (title, found, why, fullFix); a deferred item always carries one' && resolved.res.resumeFrom && resolved.res.resumeFrom.label === 'resolve r1', [resolved.res.status, resolved.res.error, resolved.res.resumeFrom])
  check('defer: the resolve prompt asks for the draft of a deferral the person chose', (pick(resolved.calls, 'resolve r1') || { prompt: '' }).prompt.includes('the draft as title, found, why and fullFix'))
  // A defer override the resolve agent returns no entry for stops there too (#97, R2-13): it would
  // be neither drafted nor filed, and its reply would close the person's deferral with no issue.
  const unentered = await go('defer: the resolve agent returns no entry for a deferral the person chose', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: override }, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('defer: a defer override with no deferred entry stops at resolve, resumable there', unentered.res.status === 'error' && unentered.res.stage === 'resolve' && unentered.res.error === 'the resolve agent returned no deferred entry for R1-1, which a disposition override deferred; a deferred item always carries a drafted issue' && Boolean(unentered.res.resumeFrom) && unentered.res.resumeFrom.label === 'resolve r1', [unentered.res.status, unentered.res.error, unentered.res.resumeFrom])
  // A reshape is asked for every field the checks read.
  const bounced = await go('defer: a bounced plan reshapes a deferral', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], planBounce: 1, commitIds: [['R1-1']] })
  check('defer: the reshape prompt asks for the mitigation and the drafted issue', bounced.res.status === 'done' && (pick(bounced.calls, 'reshape r1 #1') || { prompt: '' }).prompt.includes('its drafted issue as title, found, why and fullFix'), [bounced.res.status, bounced.res.error])
  // Each drafted issue's body field is asked for as one paragraph (#97, R3-3): a field with a line
  // break is escaped whole, its code spans included, so the shape, reshape and resolve prompts ask
  // for one paragraph with code in inline spans.
  const oneParagraph = 'found, why and fullFix each as one paragraph with no line break'
  check('defer: the shape, reshape and resolve prompts ask for each drafted issue field as one paragraph', [(pick(mitigated.calls, 'shape r1') || { prompt: '' }).prompt, (pick(bounced.calls, 'reshape r1 #1') || { prompt: '' }).prompt, (pick(resolved.calls, 'resolve r1') || { prompt: '' }).prompt].every((p) => p.includes(oneParagraph)), 'shape r1, reshape r1 #1, resolve r1')

  // A decline that points at follow-up work is warned about, one case per form, beside the
  // reasons that stand and a "could not confirm" that names a later test. The forms include the
  // rule's own three (another pull request, an issue, a later change; #97, R4-6), and a warning
  // quotes the leftmost match, so "a separate issue" is quoted with its article.
  const points = { 'R1-1': ['it belongs in a follow-up issue', 'follow-up'], 'R1-2': ['someone can follow up after the release', 'follow up'], 'R1-3': ['a followup should rename it', 'followup'], 'R1-4': ['a separate issue should track it', 'a separate issue'], 'R1-5': ['a separate pull request should do this', 'a separate pull request'], 'R1-6': ['a separate PR is the place', 'a separate PR'], 'R1-7': ['another pull request owns that file', 'another pull request'], 'R1-8': ['the fix belongs elsewhere', 'belongs elsewhere'], 'R1-15': ['it belongs in another PR', 'another PR'], 'R1-16': ['it is worth a new issue', 'a new issue'], 'R1-17': ['leave it for a later change', 'a later change'], 'R1-18': ['track it in an issue', 'in an issue'] }
  const stands = { 'R1-9': 'the spec keeps R1-9 as it is on purpose', 'R1-10': 'could not confirm: needs a follow-up load test on two workers', 'R1-11': 'a separate process already retries it, so the row is never read twice', 'R1-12': 'the job follows up to three redirects, so the loop the claim needs cannot form', 'R1-14': 'the #85 follow-up spec decided the point (its Decision 2)' }
  const ids = Object.keys(points).concat(Object.keys(stands))
  const warned = await go('defer: declines that point at follow-up work', baseArgs, { reviews: [ids.map((id) => f(id, 'nit')).concat([f('R1-13', 'nit')]), []], decline: ids, reason: { ...Object.fromEntries(Object.entries(points).map(([id, [reason]]) => [id, reason])), ...stands }, commitIds: [['R1-13']] })
  for (const [id, [, match]] of Object.entries(points)) {
    check(`defer: a decline whose reason says "${match}" is warned about as a defer`, warned.res.warnings.includes(`round 1: the shaper declined ${id} with a reason that points at follow-up work (${JSON.stringify(match)}); an item worth doing elsewhere is a defer`), warned.res.warnings)
  }
  check('defer: a decline for a reason that stands, or for want of confirmation, is not warned about, and the run goes on', warned.res.status === 'done' && !warned.res.warnings.some((w) => Object.keys(stands).some((id) => w.includes(`declined ${id} `))), warned.res.warnings)
  // A reshape that keeps the same decline does not repeat its warning (#97, R4-4): the run's
  // warnings are each listed once, however many times the shape was vetted.
  const rewarned = await go('defer: a kept decline over two reshapes', baseArgs, { reviews: [[f('R1-1', 'nit'), f('R1-2', 'nit')], []], decline: ['R1-1'], reason: { 'R1-1': 'a follow-up PR' }, planBounce: 2, commitIds: [['R1-2']] })
  const followUpWarning = 'round 1: the shaper declined R1-1 with a reason that points at follow-up work ("follow-up"); an item worth doing elsewhere is a defer'
  check('defer: a decline a reshape keeps is warned about once, however often the plan bounced', rewarned.res.status === 'done' && labels(rewarned.calls).includes('reshape r1 #2') && rewarned.res.warnings.filter((w) => w === followUpWarning).length === 1, [rewarned.res.status, labels(rewarned.calls), rewarned.res.warnings])
}

// ---------------------------------------------------------------------------
// #95, filing: a round's deferred drafts are filed once the gate has passed and before the
// replies, by one GitHub-agent call that redline-gh.sh defer makes safe to repeat; the reply,
// the handoff and the result say where each item went.
// ---------------------------------------------------------------------------
{
  const folder = 'agent-os/specs/2026-10-20-1600-114-review-round-1'
  const draftsOf = (r, label = 'file deferred r1') => {
    const p = (pick(r.calls, label) || { prompt: '' }).prompt
    return p.includes('Drafts, as JSON:\n[') ? JSON.parse(p.slice(p.indexOf('Drafts, as JSON:\n[') + 17, p.lastIndexOf(']') + 1)) : []
  }
  const handoffOf = (r, label = 'handoff comment') => (pick(r.calls, label) ? comment(r.calls, label) : '')
  const scenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit')], []], defer: ['R1-1'], commitIds: [['R1-1', 'R1-2']] }
  // The stop is slice 4's subject: here every draft goes ahead as drafted.
  const filedArgs = { ...baseArgs, deferrals: goAhead('R1-1', 'R2-1', 'H1-1') }

  const run = await go('filing: a deferral with a mitigation, to a GitHub issue', filedArgs, scenario)
  check('filing: the drafts are filed after the check and before the push and the replies', run.res.status === 'done' && labels(run.calls).slice(10, 13).join('|') === 'check r1|file deferred r1|push and reply r1', labels(run.calls))
  const filing = (pick(run.calls, 'file deferred r1') || { prompt: '', opts: {} })
  check('filing: the call is the GitHub agent\'s, named as the defer operation of the round', filing.opts.agentType === 'redline:redline-github' && filing.prompt.includes('Operation: defer for round 1. PR #114.') && filing.prompt.includes('postToGitHub: true.'), filing.prompt.slice(0, 1400))
  check('filing: the round\'s filing call is grouped under Push and reply', filing.opts.phase === 'Push and reply', filing.opts)
  check('filing: the agent is told the command is safe to repeat, and to look for and open nothing itself', filing.prompt.includes('it opens an issue only when neither the record nor GitHub holds one for the finding') && filing.prompt.includes('never look for an issue yourself, never open one another way, and never run `gh`'), filing.prompt)
  const [entry] = draftsOf(run)
  check('filing: a draft names its finding, its mode, its file and the one command, with the round\'s record', entry && entry.finding === 'R1-1' && entry.mode === 'issue' && entry.file === `/r/${folder}/redline/issue-R1-1.md` && entry.command === `/p/scripts/redline-gh.sh defer issue R1-1 /r/${folder}/redline/issue-R1-1.md /r/${folder}/redline/round-1-deferred.json`, entry)
  check('filing: the draft is the title, an empty line, what was found, where, why not here, the fix proposed, and the pull request, round and finding it came from', entry && entry.content === '# Lock R1-1\n\nfound R1-1\n\n- **Where:** `app/x.php:1`\n- **Why it is not fixed in #114:** why R1-1\n- **Proposed fix:** a lock\n\nDeferred from pull request #114 by Redline (round 1, finding R1-1).\n', entry && entry.content)
  check('filing: the mitigation is not in the issue', entry && !entry.content.includes('a guard clause'), entry && entry.content)
  // A title is cleaned before one is chosen (#97, R1-8): a title of the person's that cleans to
  // nothing gives way to the shaper's, and a shaper title that cleans to nothing is no title.
  const blank = await go('filing: a title of the person\'s that is only spaces', { ...baseArgs, deferrals: { 'R1-1': { action: 'file', title: '   ', notes: '', date: '2026-11-16', draft: 1 } } }, { reviews: [[f('R1-1', 'correctness')]], defer: ['R1-1'], mitigations: { 'R1-1': '' }, commitIds: [[]] })
  check('filing: a title of the person\'s that cleans to nothing gives way to the shaper\'s', blank.res.status === 'done' && ((draftsOf(blank)[0] || {}).content || '').startsWith('# Lock R1-1\n\n'), [blank.res.status, blank.res.error, (draftsOf(blank)[0] || {}).content])
  const controls = await go('filing: a shaper title of control characters only', baseArgs, { reviews: [[f('R1-1', 'correctness')]], defer: ['R1-1'], drafts: { 'R1-1': { title: '\u0001\u0002' } }, commitIds: [[]] })
  check('filing: a shaper title that cleans to nothing is no title, so the run stops at shape, resumable at the shaper', controls.res.status === 'error' && controls.res.stage === 'shape' && controls.res.error === 'the shaper deferred R1-1 with no drafted issue (missing title); a deferred item always carries one' && controls.res.resumeFrom && controls.res.resumeFrom.label === 'shape r1', [controls.res.status, controls.res.error, controls.res.resumeFrom])
  check('filing: no draft carries a model or vendor name', entry && !/claude|anthropic|generated (with|by)|co-authored/i.test(entry.content), entry && entry.content)
  // One deferred entry per finding (#97, R2-12): a second entry the shaper or the resolve agent
  // returns for the same id is dropped with a warning, so one draft, the first, is filed and listed.
  const twice = await go('filing: the shaper returns two entries for one deferral', filedArgs, { ...scenario, deferTwice: ['R1-1'] })
  check('filing: two shaper entries for one finding file one draft, the first, listed once, with a warning', twice.res.status === 'done' && draftsOf(twice).length === 1 && (draftsOf(twice)[0] || {}).content === (entry || {}).content && (twice.res.deferred || []).length === 1 && handoffOf(twice).includes('### Deferred (1)\n') && (twice.res.warnings || []).includes('round 1: the shaper listed R1-1 as deferred more than once; the first entry is kept'), [twice.res.status, twice.res.handoffKind, draftsOf(twice).length, twice.res.warnings])
  const twiceResolved = await go('filing: the resolve agent returns two entries for one deferral the person chose', { ...filedArgs, interrupt: 'plan', approvedPlans: [1], decisions: { 'R1-1': { choice: 'defer', notes: 'Defer it behind a log line.', date: '2026-11-16', disposition: 'defer' } } }, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']], resolveDeferred: [{ id: 'R1-1', mitigation: 'a log line', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }, { id: 'R1-1', mitigation: 'a log line', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1 again', why: 'why R1-1' }] })
  check('filing: two resolve entries for one finding file one draft, the first, with a warning', twiceResolved.res.status === 'done' && draftsOf(twiceResolved).length === 1 && ((draftsOf(twiceResolved)[0] || {}).content || '').includes('\nfound R1-1\n') && (twiceResolved.res.deferred || []).length === 1 && (twiceResolved.res.warnings || []).includes('round 1: the resolve agent listed R1-1 as deferred more than once; the first entry is kept'), [twiceResolved.res.status, twiceResolved.res.handoffKind, draftsOf(twiceResolved).length, twiceResolved.res.warnings])
  // The Where line names a place that exists (#97, R2-5): a finding minted with no file has none,
  // and a file with no line is named alone.
  const unplaced = await go('filing: a deferral of a finding with no file', filedArgs, { ...scenario, reviews: [[f('R1-1', 'correctness', { file: '(no file)', line: 0 }), f('R1-2', 'nit')], []] })
  check('filing: a finding with no file has no Where line in its draft', ((draftsOf(unplaced)[0] || {}).content || '') === '# Lock R1-1\n\nfound R1-1\n\n- **Why it is not fixed in #114:** why R1-1\n- **Proposed fix:** a lock\n\nDeferred from pull request #114 by Redline (round 1, finding R1-1).\n', [unplaced.res.status, unplaced.res.error, (draftsOf(unplaced)[0] || {}).content])
  const lineless = await go('filing: a deferral of a finding with a file and no line', filedArgs, { ...scenario, reviews: [[f('R1-1', 'correctness', { line: 0 }), f('R1-2', 'nit')], []] })
  check('filing: a finding with a file and no line names the file alone', ((draftsOf(lineless)[0] || {}).content || '').includes('\n- **Where:** `app/x.php`\n'), [lineless.res.status, (draftsOf(lineless)[0] || {}).content])
  check('filing: the reply says the issue\'s number, then the mitigation\'s commit', replyFor(run.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: deferred to #301. Mitigated in 1bbbbbb (redline: R1-1 fix). · decided by: redline', replyFor(run.calls, 'push and reply r1', 'R1-1'))
  check('filing: the handoff lists it under Deferred with its number', handoffOf(run).includes('### Deferred (1)\n\n- **R1-1** title R1-1: deferred to #301; mitigated in 1bbbbbb · decided by: redline\n'), handoffOf(run))
  check('filing: the next round\'s reviewer is shown it as deferred, with its number', (pick(run.calls, 're-review r2') || { prompt: '' }).prompt.includes('"outcome": "deferred to #301; mitigated in 1bbbbbb · decided by: redline"'))
  const item = (run.res.deferred || [])[0] || {}
  check('filing: the result carries the item, its draft as filed and where it went', JSON.stringify([item.id, item.round, item.title, item.mitigation, item.fullFix, item.where, item.number, item.url, item.path, item.draft && item.draft.title, item.draft && item.draft.body.startsWith('found R1-1\n\n- **Where:**'), item.outcome]) === JSON.stringify(['R1-1', 1, 'title R1-1', 'a guard clause', 'a lock', 'issue', 301, 'https://github.com/o/r/issues/301', `${folder}/redline/issue-R1-1.md`, 'Lock R1-1', true, 'deferred to #301; mitigated in 1bbbbbb · decided by: redline']), item)
  check('filing: the result says where drafts go, github by default', run.res.deferTo === 'github', run.res.deferTo)
  check('filing: the draft and the record are among the round\'s files', [`${folder}/redline/issue-R1-1.md`, `${folder}/redline/round-1-deferred.json`].every((p) => run.res.rounds[0].files.includes(p)), run.res.rounds[0].files)
  check('filing: its thread is settled and swept, as a deferred one was', (pick(run.calls, 'resolve threads') || { prompt: '' }).prompt.includes('- R1-1 (round 1): comments 100, '), (pick(run.calls, 'resolve threads') || { prompt: '' }).prompt)

  // A round that defers nothing makes no such call, so its prompts and its labels are as before.
  const plain = await go('filing: a round with nothing deferred', filedArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('filing: a round with nothing deferred makes no filing call and has no Deferred section', plain.res.status === 'done' && !labels(plain.calls).some((l) => l.startsWith('file deferred')) && !handoffOf(plain).includes('### Deferred'), labels(plain.calls))

  // The other two destinations write the draft and open nothing: the reply and the handoff give its path.
  for (const word of ['spec', 'print']) {
    const drafted = await go(`filing: drafts to ${word}`, { ...filedArgs, deferTo: word }, scenario)
    const [d] = draftsOf(drafted)
    check(`filing: with ${word} the draft is recorded by its path and GitHub is not called`, drafted.res.status === 'done' && d && d.mode === 'draft' && d.command === `/p/scripts/redline-gh.sh defer draft R1-1 /r/${folder}/redline/issue-R1-1.md /r/${folder}/redline/round-1-deferred.json`, d)
    check(`filing: with ${word} the reply gives the draft's path`, replyFor(drafted.calls, 'push and reply r1', 'R1-1') === `Redline round 1: deferred; the issue draft is at \`${folder}/redline/issue-R1-1.md\`. Mitigated in 1bbbbbb (redline: R1-1 fix). · decided by: redline`, replyFor(drafted.calls, 'push and reply r1', 'R1-1'))
    check(`filing: with ${word} the handoff and the result give the draft's path, and the result the setting`, handoffOf(drafted).includes(`- **R1-1** title R1-1: deferred; the issue draft is at \`${folder}/redline/issue-R1-1.md\`; mitigated in 1bbbbbb · decided by: redline\n`) && JSON.stringify([drafted.res.deferTo, (drafted.res.deferred || [])[0].where, (drafted.res.deferred || [])[0].number, (drafted.res.deferred || [])[0].path]) === JSON.stringify([word, 'draft', 0, `${folder}/redline/issue-R1-1.md`]), [handoffOf(drafted), drafted.res.deferTo, drafted.res.deferred])
  }
  const badWord = await go('filing: a bad deferTo word', { ...filedArgs, deferTo: 'jira' }, scenario)
  check('filing: a deferTo that is not github, spec or print is refused before any agent runs', Boolean(badWord.thrown) && /args\.deferTo must be one of github \| spec \| print/.test(badWord.thrown.message) && badWord.calls.length === 0, badWord.thrown && badWord.thrown.message)

  // A dry run opens nothing whatever the setting: every draft is written and recorded by its path.
  const dry = await go('filing: a dry run', { ...filedArgs, postToGitHub: false }, scenario)
  const [dryDraft] = draftsOf(dry)
  check('filing: a dry run files every draft as a draft, and says so', dry.res.status === 'done' && dryDraft && dryDraft.mode === 'draft' && (pick(dry.calls, 'file deferred r1') || { prompt: '' }).prompt.includes('which is every draft of a dry run') && (pick(dry.calls, 'file deferred r1') || { prompt: '' }).prompt.includes('postToGitHub: false.'), dryDraft)
  check('filing: a dry run\'s reply gives the draft\'s path and is written, not posted', (replies(dry.calls, 'push and reply r1').find((r) => r.finding === 'R1-1') || {}).route === 'file-only' && (replyFor(dry.calls, 'push and reply r1', 'R1-1') || '').startsWith(`Redline round 1: deferred; the issue draft is at \`${folder}/redline/issue-R1-1.md\`.`), replies(dry.calls, 'push and reply r1'))

  // The body is posted text (#95, decision 13): every field goes through postedText, so a tag is
  // shown as text and an @word notifies nobody, while a code span stays as written. The title is
  // plain text on GitHub (decision 38), so it is filed as written: the same tag and @word, raw.
  const text = { title: 'Escape <b> in @mention labels', found: 'The label prints <b> raw, @sam is linked & `Map<K, V>` stays in its span.', why: 'It is @param territory: A & B share `x<y`.', fullFix: 'Escape <i> at the edge, as `e(@value)` does.' }
  const escaped = await go('filing: a draft with a tag, an at-word and a code span', filedArgs, { ...scenario, drafts: { 'R1-1': text } })
  const [e] = draftsOf(escaped)
  check('filing: the body is escaped field by field and the title is filed as written', e && e.content === `# Escape <b> in @mention labels\n\nThe label prints &lt;b> raw, @${WJ}sam is linked &amp; \`Map<K, V>\` stays in its span.\n\n- **Where:** \`app/x.php:1\`\n- **Why it is not fixed in #114:** It is @${WJ}param territory: A &amp; B share \`x<y\`.\n- **Proposed fix:** Escape &lt;i> at the edge, as \`e(@value)\` does.\n\nDeferred from pull request #114 by Redline (round 1, finding R1-1).\n`, e && e.content)
  check('filing: the result gives the title as filed, for the session to print', ((escaped.res.deferred || [])[0] || {}).draft && (escaped.res.deferred || [])[0].draft.title === 'Escape <b> in @mention labels', (escaped.res.deferred || [])[0])
  check('filing: no raw word joiner is in the filing prompt', !(pick(escaped.calls, 'file deferred r1') || { prompt: '\u2060' }).prompt.includes('\u2060'))
  // The title is made safe as plain text: one line, no control characters, at most 256 characters.
  const lined = await go('filing: a title over two lines with a tab and a control character', filedArgs, { ...scenario, drafts: { 'R1-1': { title: '  Back off\r\nretries\tin the\x07 client\x1b[0m  ' } } })
  check('filing: a newline, a carriage return and a tab in a title become a space, and a control character goes', (draftsOf(lined)[0] || { content: '' }).content.startsWith('# Back off retries in the client[0m\n\n'), (draftsOf(lined)[0] || {}).content)
  const long = await go('filing: a title of 300 characters', filedArgs, { ...scenario, drafts: { 'R1-1': { title: `${'a'.repeat(255)}\u{1F600}${'b'.repeat(44)}` } } })
  const longTitle = ((draftsOf(long)[0] || { content: '' }).content.split('\n')[0] || '').slice(2)
  check('filing: a title is cut to 256 characters, counted as characters so no pair is cut in half', [...longTitle].length === 256 && longTitle.endsWith('\u{1F600}'), [[...longTitle].length, longTitle.slice(-4)])
  const exact = await go('filing: a title of 256 characters', filedArgs, { ...scenario, drafts: { 'R1-1': { title: 'c'.repeat(256) } } })
  check('filing: a title of exactly 256 characters is filed whole', (draftsOf(exact)[0] || { content: '' }).content.startsWith(`# ${'c'.repeat(256)}\n`))

  // Filing is safe to repeat (#95, decision 11): the round's record holds what was filed, so a
  // resumed round that runs the call again is given the same number and no second issue.
  const record = {}
  const failedPush = await go('filing: the push fails after the issue was opened', filedArgs, { ...scenario, filedRecord: record, pushError: 'rejected' })
  check('filing: a failed push stops the run after the filing, resumable at the push', failedPush.res.status === 'error' && failedPush.res.resumeFrom && failedPush.res.resumeFrom.label === 'push and reply r1' && JSON.stringify(record) === '{"R1-1":301}', [failedPush.res.status, failedPush.res.resumeFrom, record])
  const resumed = await go('filing: the resume runs the filing again', { ...filedArgs, resume: { 'push and reply r1': { attempt: 2, error: failedPush.res.error, hand: { commits: [], paths: [] } } } }, { ...scenario, filedRecord: record })
  samePrefix('filing: a resume replays every prompt through the filing call', failedPush.calls, resumed.calls, labels(failedPush.calls).indexOf('file deferred r1') + 1)
  check('filing: the resumed round reuses the recorded issue and opens no second one', resumed.res.status === 'done' && JSON.stringify(record) === '{"R1-1":301}' && replyFor(resumed.calls, 'push and reply r1', 'R1-1').startsWith('Redline round 1: deferred to #301.') && ((resumed.res.deferred || [])[0] || {}).number === 301, [resumed.res.status, record, replyFor(resumed.calls, 'push and reply r1', 'R1-1')])
  // A second deferral in a later round gets its own issue; the first keeps its number.
  const twoRounds = await go('filing: a deferral in each of two rounds', filedArgs, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')], []], defer: ['R1-1', 'R2-1'], commitIds: [['R1-1'], ['R2-1']] })
  check('filing: each round files its own drafts into its own record', twoRounds.res.status === 'done' && (draftsOf(twoRounds, 'file deferred r2')[0] || {}).command === '/p/scripts/redline-gh.sh defer issue R2-1 /r/agent-os/specs/2026-10-20-1600-114-review-round-2/redline/issue-R2-1.md /r/agent-os/specs/2026-10-20-1600-114-review-round-2/redline/round-2-deferred.json' && JSON.stringify(twoRounds.res.deferred.map((d) => [d.id, d.number])) === '[["R1-1",301],["R2-1",302]]', [twoRounds.res.status, twoRounds.res.deferred])

  // A filing that fails, or that leaves a draft out, stops the run at the filing call, where a resume reruns it.
  const refused = await go('filing: the script fails', filedArgs, { ...scenario, deferError: 'HTTP 403: Resource not accessible by integration' })
  check('filing: a failed filing stops at stage defer, resumable at the filing call, before any reply', refused.res.status === 'error' && refused.res.stage === 'defer' && refused.res.error === 'filing the deferred drafts failed in round 1: HTTP 403: Resource not accessible by integration' && refused.res.resumeFrom && refused.res.resumeFrom.label === 'file deferred r1' && !labels(refused.calls).includes('push and reply r1'), [refused.res.status, refused.res.error, refused.res.resumeFrom, labels(refused.calls).slice(-3)])
  const left = await go('filing: the agent leaves a draft out', filedArgs, { ...scenario, deferDrop: ['R1-1'] })
  check('filing: a draft the agent gave no filing for stops the run, resumable at the filing call', left.res.status === 'error' && left.res.stage === 'defer' && left.res.error === 'the GitHub agent returned no filing for R1-1 in round 1' && left.res.resumeFrom && left.res.resumeFrom.label === 'file deferred r1', [left.res.status, left.res.error, left.res.resumeFrom])

  // A deferral the person chose is their decision: its reply and its line keep the decision and end with where it went.
  const chosen = await go('filing: a fix the person changes to a deferral on the plan dial', { ...filedArgs, interrupt: 'plan', approvedPlans: [1], decisions: { 'R1-1': { choice: 'defer', notes: 'Defer it behind a log line.', date: '2026-11-16', disposition: 'defer' } } }, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']], resolveDeferred: [{ id: 'R1-1', mitigation: 'a log line', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }] })
  check('filing: a deferral the person chose is filed, and its reply ends with where it went, as their decision', chosen.res.status === 'done' && labels(chosen.calls).includes('file deferred r1') && replyFor(chosen.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Defer it behind a log line. Applied in 1bbbbbb (redline: R1-1 fix). Deferred to #301. · decided by: @author', [chosen.res.status, chosen.res.error, replyFor(chosen.calls, 'push and reply r1', 'R1-1')])
  // The plan approver is shown the files the workflow reads (#103, R1-2): for a deferral the
  // person decided, the task the resolve agent planned, never the shaper's list for the finding's
  // old disposition. An absent heading or JSON that does not parse reads as null, so a run that
  // took another path fails the check and does not throw.
  const approverFiles = (r, id, label = 'plan approver r1') => {
    const p = (pick(r.calls, label) || { prompt: '' }).prompt
    const head = "The shaper's dispositions and deferred list, as JSON:\n"
    const a = p.indexOf(head)
    const b = a < 0 ? -1 : p.indexOf('\n\nDecisions made outside the shaper', a)
    if (a < 0 || b < 0) {
      return null
    }
    try {
      const entry = JSON.parse(p.slice(a + head.length, b)).findings.find((x) => x.id === id)
      return entry ? JSON.stringify([entry.disposition, entry.files]) : null
    } catch {
      return null
    }
  }
  const draftFor = (id) => ({ fullFix: 'a lock', title: `Lock ${id}`, found: `found ${id}`, why: `why ${id}` })
  const toDefer = (notes) => ({ 'R1-1': { choice: 'defer', notes, date: '2026-11-17', disposition: 'defer' } })
  const declineToDefer = await go('filing: a decline the person overrules to a deferral with a mitigation', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: toDefer('Defer it behind a guard.'), deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], decline: ['R1-1'], resolveDeferred: [{ id: 'R1-1', mitigation: 'a guard', ...draftFor('R1-1') }], commitIds: [['R1-1']] })
  check('filing: the plan approver is shown the resolve agent\'s files for a decline the person overruled to a deferral with a task', approverFiles(declineToDefer, 'R1-1') === '["defer",["app/x.php"]]', [declineToDefer.res.status, declineToDefer.res.error, approverFiles(declineToDefer, 'R1-1')])
  const fixToDefer = await go('filing: a fix the person changes to a deferral that ships nothing', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: toDefer('Defer it; nothing ships now.'), deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')]], acceptedCalls: ['R1-1'], resolveDeferred: [{ id: 'R1-1', mitigation: '', ...draftFor('R1-1') }], commitIds: [[]] })
  check('filing: the plan approver is shown no files for a fix the person changed to a deferral with no task, whatever the shaper listed', approverFiles(fixToDefer, 'R1-1') === '["defer",[]]', [fixToDefer.res.status, fixToDefer.res.error, approverFiles(fixToDefer, 'R1-1')])
  // The neighbour: a deferral nobody decided is shown with the shaper's own list, as before.
  const ownDefer = await go('filing: the shaper\'s own deferral, as the plan approver is shown it', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], files: { 'R1-1': ['app/y.php'] }, commitIds: [['R1-1']] })
  check('filing: the plan approver is shown the shaper\'s own files for a deferral nobody decided', approverFiles(ownDefer, 'R1-1') === '["defer",["app/y.php"]]', [ownDefer.res.status, ownDefer.res.error, approverFiles(ownDefer, 'R1-1')])
  // The implementer is shown the same list (#103, R2-11): for a deferral the person decided, the
  // files of the task the resolve agent planned, never the shaper's list for the old disposition.
  // An absent heading or JSON that does not parse reads as null, so a run that took another path
  // fails the check and does not throw.
  const IMPLEMENT_HEAD = 'a declined finding has no task and no commit), as JSON:\n'
  const implementerFiles = (r, id) => {
    const p = (pick(r.calls, 'implement r1') || { prompt: '' }).prompt
    const a = p.indexOf(IMPLEMENT_HEAD)
    const b = a < 0 ? -1 : p.indexOf('\n\nDecisions made outside the shaper', a)
    if (a < 0 || b < 0) {
      return null
    }
    try {
      const entry = JSON.parse(p.slice(a + IMPLEMENT_HEAD.length, b)).findings.find((x) => x.id === id)
      return entry ? JSON.stringify([entry.disposition, entry.files]) : null
    } catch {
      return null
    }
  }
  check('filing: the implementer is shown the resolve agent\'s files for a decline the person overruled to a deferral with a task', implementerFiles(declineToDefer, 'R1-1') === '["defer",["app/x.php"]]', [declineToDefer.res.status, implementerFiles(declineToDefer, 'R1-1')])
  check('filing: the implementer is shown no files for a fix the person changed to a deferral with no task, whatever the shaper listed', implementerFiles(fixToDefer, 'R1-1') === '["defer",[]]', [fixToDefer.res.status, implementerFiles(fixToDefer, 'R1-1')])
  // The neighbour: a deferral nobody decided is shown with the shaper's own list, as before.
  check('filing: the implementer is shown the shaper\'s own files for a deferral nobody decided', implementerFiles(ownDefer, 'R1-1') === '["defer",["app/y.php"]]', [ownDefer.res.status, implementerFiles(ownDefer, 'R1-1')])
  // Every finding the person or autopilot decided is shown the files of its task, from the first
  // plan approver pass on (#106): until then only one shown as a deferral was (#103, R2-11), and a
  // decided fix was shown the shaper's list from before the decision. No reshape runs here, so the
  // task is the resolve agent's.
  const filesShown = (r, id) => [approverFiles(r, id), implementerFiles(r, id)]
  const bothShown = (r, id, expected) => filesShown(r, id).every((x) => x === expected)
  const declineToFix = await go('filing: a decline the person overrules to a fix, as the agents are shown it', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-20', disposition: 'fix' } } }, { reviews: [[f('R1-1', 'correctness')], []], decline: ['R1-1'], commitIds: [['R1-1']] })
  check('filing: the plan approver and the implementer are shown the task\'s files for a decline the person overruled to a fix, never the decline\'s empty list', bothShown(declineToFix, 'R1-1', '["fix",["app/x.php"]]'), [declineToFix.res.status, declineToFix.res.error, filesShown(declineToFix, 'R1-1')])
  const changeIt = { 'R1-1': { choice: 'Change it', notes: 'Fix it now.', date: '2026-11-20' } }
  const answeredFix = await go('filing: a call answered with a fix, as the agents are shown it', { ...baseArgs, decisions: changeIt }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], files: { 'R1-1': ['app/rec.php'] }, commitIds: [['R1-1']] })
  check('filing: the plan approver and the implementer are shown the task\'s files for a call answered with a fix, never the paths of the shaper\'s recommended option', bothShown(answeredFix, 'R1-1', '["ask",["app/x.php"]]'), [answeredFix.res.status, answeredFix.res.error, filesShown(answeredFix, 'R1-1')])
  const answeredKeep = await go('filing: a call answered with no change, as the agents are shown it', { ...baseArgs, decisions: { 'R1-1': { choice: 'Keep it', notes: 'Keep it as it is.', date: '2026-11-20' } } }, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'], acceptedCalls: ['R1-1'], files: { 'R1-1': ['app/rec.php'] }, commitIds: [[]] })
  check('filing: the plan approver and the implementer are shown no files for a call answered with no change, whatever the shaper listed', bothShown(answeredKeep, 'R1-1', '["ask",[]]'), [answeredKeep.res.status, answeredKeep.res.error, filesShown(answeredKeep, 'R1-1')])
  // The neighbours: a fix nobody decided keeps the shaper's list, and a finding left to the person
  // under a repository rule keeps the list it had, since its task has no files by rule and the
  // rule is matched on the shaper's.
  const ownFix = await go('filing: the shaper\'s own fix, as the agents are shown it', baseArgs, { reviews: [[f('R1-1', 'correctness')], []], files: { 'R1-1': ['app/y.php'] }, commitIds: [['R1-1']] })
  check('filing: the plan approver and the implementer are shown the shaper\'s own files for a fix nobody decided', bothShown(ownFix, 'R1-1', '["fix",["app/y.php"]]'), [ownFix.res.status, ownFix.res.error, filesShown(ownFix, 'R1-1')])
  const chargeRule = [{ id: 'billing', when: { prose: 'the change alters what a customer is charged' }, reason: 'Billing changes are reviewed by finance' }]
  const leftCall = await go('filing: a call under a repository rule, answered, as the agents are shown it', { ...baseArgs, askRules: chargeRule, decisions: changeIt }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], askRule: { 'R1-1': 'billing' }, files: { 'R1-1': ['app/rec.php'] }, commitIds: [[], []] })
  check('filing: the plan approver and the implementer are shown the shaper\'s list for an answered call left to the person under a rule, as before', bothShown(leftCall, 'R1-1', '["ask",["app/rec.php"]]'), [leftCall.res.status, leftCall.res.error, filesShown(leftCall, 'R1-1')])
  // The list follows a reshape (#106). Until then a decided finding's task was read from the
  // resolve agent's tasks alone, so after a bounced plan and a reshape that changed or removed
  // the task, the plan approver's next pass, the implementer, a held draft and the warning were
  // shown the files as first planned, and an approver that holds the list to the plan (its rule
  // 1) could bounce to the cap. The issue's case: an override to defer whose resolve plans
  // app/x.php, a bounced plan, and a reshape that lists no files for it.
  const PASS_2 = 'plan approver r1 #2'
  const guardEntry = { id: 'R1-1', mitigation: 'a guard', ...draftFor('R1-1') }
  const deferArgs = { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: toDefer('Defer it behind a guard.'), deferrals: goAhead('R1-1') }
  const deferBounced = { reviews: [[f('R1-1', 'correctness')]], decline: ['R1-1'], planBounce: 1, resolveDeferred: [guardEntry], commitIds: [[]] }
  const CHANGED = (from, to) => `round 1: the reshape changed the files of R1-1's task, a finding decided by @author, from ${from} to ${to}`
  const warned = (r, text) => ((r.res || {}).warnings || []).includes(text)
  const anyWarning = (r, part) => ((r.res || {}).warnings || []).some((w) => w.includes(part))
  const emptied = await go('reshape: an override to defer whose task the reshape removes', deferArgs, { ...deferBounced, reshapeFiles: { 'R1-1': [] } })
  check('reshape: the second plan approver pass is shown no files for a decided deferral whose task the reshape removed, where the first was shown the resolve agent\'s', emptied.res.status === 'done' && approverFiles(emptied, 'R1-1') === '["defer",["app/x.php"]]' && approverFiles(emptied, 'R1-1', PASS_2) === '["defer",[]]', [emptied.res.status, emptied.res.stage, emptied.res.error, approverFiles(emptied, 'R1-1'), approverFiles(emptied, 'R1-1', PASS_2)])
  check('reshape: the implementer is shown the same empty list', implementerFiles(emptied, 'R1-1') === '["defer",[]]', implementerFiles(emptied, 'R1-1'))
  check('reshape: a change to a decided finding\'s files is warned about, with its owner, and a task the reshape removed is no planned mitigation left unbuilt', warned(emptied, CHANGED('app/x.php', 'none')) && !anyWarning(emptied, 'planned a mitigation in'), (emptied.res || {}).warnings)
  // Its neighbour: a reshape that lists the same files, in another order, changes nothing. The
  // list is kept as it was, so the second pass is shown what the first was, and nothing is warned.
  const findingsShown = (r, label) => {
    const p = (pick(r.calls, label) || { prompt: '' }).prompt
    const a = p.indexOf("The shaper's dispositions and deferred list, as JSON:\n")
    const b = a < 0 ? -1 : p.indexOf('\n\nDecisions made outside the shaper', a)
    return a < 0 || b < 0 ? '' : p.slice(a, b)
  }
  const sameFiles = await go('reshape: an override to defer whose task the reshape lists as it was', deferArgs, { ...deferBounced, resolveFiles: { 'R1-1': ['app/x.php', 'app/z.php'] }, reshapeFiles: { 'R1-1': ['app/z.php', 'app/x.php'] }, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('reshape: a reshape that lists the same files leaves the list as it was: the second pass is shown what the first was, and nothing is warned', sameFiles.res.status === 'done' && approverFiles(sameFiles, 'R1-1', PASS_2) === '["defer",["app/x.php","app/z.php"]]' && findingsShown(sameFiles, 'plan approver r1') !== '' && findingsShown(sameFiles, PASS_2) === findingsShown(sameFiles, 'plan approver r1') && !anyWarning(sameFiles, 'the reshape changed'), [sameFiles.res.status, sameFiles.res.error, approverFiles(sameFiles, 'R1-1', PASS_2), (sameFiles.res || {}).warnings])
  // The other way about: the resolve agent planned no task, and the reshape adds one.
  const added = await go('reshape: an override to defer with no task, and the reshape adds one', deferArgs, { ...deferBounced, resolveFiles: { 'R1-1': [] }, reshapeFiles: { 'R1-1': ['app/y.php'] }, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('reshape: the second pass is shown the task a reshape added for a decided deferral the resolve agent planned none for, and its commit raises no warning', added.res.status === 'done' && approverFiles(added, 'R1-1') === '["defer",[]]' && approverFiles(added, 'R1-1', PASS_2) === '["defer",["app/y.php"]]' && warned(added, CHANGED('none', 'app/y.php')) && !anyWarning(added, 'has a commit of its own'), [added.res.status, added.res.error, approverFiles(added, 'R1-1', PASS_2), (added.res || {}).warnings])
  // The two warnings read the list as the reshape left it: a mitigation moved to another file and
  // not built is named by that file, and a commit beside a task the reshape emptied says the
  // reshape left it so, since the resolve agent did plan one. The resolve agent's own wording is
  // pinned by `chosenUnlisted` below.
  const moved = await go('reshape: an override to defer whose task the reshape moves, nothing built', deferArgs, { ...deferBounced, reshapeFiles: { 'R1-1': ['app/y.php'] } })
  check('reshape: a planned mitigation the build left out is named by the files the reshape gave its task', moved.res.status === 'done' && warned(moved, 'round 1: R1-1 planned a mitigation in app/y.php and no commit of its own landed; posted as shipping nothing') && !anyWarning(moved, 'planned a mitigation in app/x.php'), [moved.res.status, moved.res.error, (moved.res || {}).warnings])
  const emptiedBuilt = await go('reshape: an override to defer whose task the reshape removes, and a commit of its own lands', deferArgs, { ...deferBounced, reshapeFiles: { 'R1-1': [] }, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('reshape: a commit beside a task the reshape emptied is warned about as the reshape\'s doing, never as the resolve agent planning none', emptiedBuilt.res.status === 'done' && warned(emptiedBuilt, 'round 1: R1-1 has a commit of its own (1bbbbbb) and the reshape left its task with no files; posted with its decision') && !anyWarning(emptiedBuilt, 'the resolve agent planned no task with files'), [emptiedBuilt.res.status, emptiedBuilt.res.error, (emptiedBuilt.res || {}).warnings])
  // The end-of-run stop shows the list too. No round's stop can: a decided deferral's draft is
  // answered before a reshape can run, or, on autopilot or with `defer at end`, is never raised at
  // a round's stop, and an answered draft is not raised again (#104; #114, R1-1).
  const heldEmptied = await go('reshape: an override to defer whose task the reshape removes, held to the end', { ...deferArgs, deferAt: 'end', deferrals: {} }, { ...deferBounced, reshapeFiles: { 'R1-1': [] } })
  const heldDraft = ((heldEmptied.res || {}).drafts || [])[0] || {}
  check('reshape: the end-of-run stop shows a held draft with the files the reshape left its task', heldEmptied.res.status === 'handoff' && heldEmptied.res.handoffKind === 'deferred' && JSON.stringify([heldDraft.id, heldDraft.ships, heldDraft.mitigation, heldDraft.files]) === '["R1-1",false,"",[]]', [heldEmptied.res.status, heldEmptied.res.handoffKind, heldEmptied.res.error, heldDraft])
  // The words beside a held draft stay the decision's when a reshape moves its task (#114,
  // R1-7): the reshape's own entry for a decided finding is dropped (#97, R3-6), so the person is
  // shown the words the resolve agent planned the decision with, beside the files as reshaped and
  // a commit that shipped. A pin: it held before R1-7, and a mutation that keeps the reshape's
  // entry turns it red.
  const heldMoved = await go('reshape: an override to defer whose task the reshape moves and restates, a commit of its own landing, held to the end', { ...deferArgs, deferAt: 'end', deferrals: {} }, { ...deferBounced, reshapeFiles: { 'R1-1': ['app/y.php'] }, reshapeDefer: ['R1-1'], reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  const heldMovedDraft = ((heldMoved.res || {}).drafts || [])[0] || {}
  check('reshape: the end-of-run stop shows a moved decided mitigation with the files as reshaped and the words its resolve planned, the reshape\'s restated entry dropped', heldMoved.res.status === 'handoff' && heldMoved.res.handoffKind === 'deferred' && JSON.stringify([heldMovedDraft.id, heldMovedDraft.ships, heldMovedDraft.mitigation, heldMovedDraft.files]) === '["R1-1",true,"a guard",["app/y.php"]]' && anyWarning(heldMoved, 'the reshape listed R1-1 as deferred'), [heldMoved.res.status, heldMoved.res.handoffKind, heldMoved.res.error, heldMovedDraft, (heldMoved.res || {}).warnings])
  // The reshape prompt says what files means for a decided finding, in a block only a round with
  // one carries (#106): "for an ask" means the paths of the recommended option everywhere else,
  // the wrong list for a call the person answered. The block names the decided findings no rule
  // leaves to the person, and nothing else in the prompt changes: with the block cut out, the
  // prompt is the one the same round has with no decision, once the Return sentence's files
  // clause, which the block qualifies (#114, R1-4), is put back as it reads with no block.
  const reshapePromptOf = (r, label = 'reshape r1 #1') => (pick(r.calls, label) || { prompt: '' }).prompt
  const withoutBlock = (p) => {
    const a = p.indexOf(`\n\n${DECIDED_BLOCK}`)
    const b = a < 0 ? -1 : p.indexOf('\n\nReturn only', a)
    return a < 0 || b < 0 ? null : p.slice(0, a) + p.slice(b).replace(FILES_DECIDED, FILES_PENDING)
  }
  const undecided = await go('reshape: the same round with no decision', { ...baseArgs, interrupt: 'plan', approvedPlans: [1] }, { ...deferBounced, reviews: [[f('R1-1', 'correctness')]] })
  check('reshape: the reshape prompt of a round with a decided finding names it and says its files are its task as plan.md holds it, whatever disposition is returned', reshapePromptOf(emptied).includes(`${DECIDED_BLOCK}R1-1 (deferred). `) && reshapePromptOf(emptied).includes('as plan.md holds it when you are done') && reshapePromptOf(emptied).includes('whatever disposition you return for it') && reshapePromptOf(emptied).includes('keeps a task with files'), reshapePromptOf(emptied).slice(-1600))
  check('reshape: the reshape prompt of a round with no decided finding has no such block, and is the decided round\'s prompt with the block cut out and the files clause put back', reshapePromptOf(undecided) !== '' && !reshapePromptOf(undecided).includes(DECIDED_BLOCK) && withoutBlock(reshapePromptOf(emptied)) === reshapePromptOf(undecided), [reshapePromptOf(undecided).length, (withoutBlock(reshapePromptOf(emptied)) || '').length])
  check('reshape: a reshape prompt that names decided findings asks for files in one meaning: an ask the block does not name by its recommended paths, a named finding by its task',reshapePromptOf(emptied).includes(FILES_DECIDED) && !reshapePromptOf(emptied).includes(FILES_PENDING) && reshapePromptOf(undecided).includes(FILES_PENDING) && !reshapePromptOf(undecided).includes(FILES_DECIDED), reshapePromptOf(emptied).slice(-900))
  const twoDecided = await go('reshape: a decided fix beside a call left to the person under a rule and a fix nobody decided', { ...baseArgs, askRules: chargeRule, decisions: { 'R1-1': changeIt['R1-1'], 'R1-2': changeIt['R1-1'] } }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness'), f('R1-3', 'correctness')], []], ask: ['R1-1', 'R1-2'], askRule: { 'R1-2': 'billing' }, planBounce: 1, commitIds: [['R1-1', 'R1-3'], []] })
  check('reshape: the block names the decided finding alone, never one left to the person under a rule or one nobody decided', reshapePromptOf(twoDecided).includes(`${DECIDED_BLOCK}R1-1 (fix). `), [twoDecided.res.status, twoDecided.res.error, reshapePromptOf(twoDecided).slice(-1600)])
  const shaperFile = fs.readFileSync(path.join(here, '..', 'agents', 'redline-shaper.md'), 'utf8')
  check('reshape: the shaper\'s file states the same rule for a finding the invoking prompt names as decided', shaperFile.includes('as `plan.md` holds it when you are done') && shaperFile.includes('whatever disposition you return for it') && shaperFile.includes('keeps a task with files'))
  check('reshape: the shaper\'s file says the invoking prompt names each decided finding with what its decision ends in', shaperFile.includes('each with what its decision ends in (fix, accepted or deferred)'))
  // A decided fix's task is its own and counts only for the finding it names, after a reshape as
  // at resolve (#114, R2-6): the hold reads the files the reshape lists for each finding and
  // cannot see which task names it, so a merged task listed for two decided fixes passed it, and
  // the fix the merged commit did not name stopped at the check, which cannot replan.
  check('reshape: the block says a decided fix keeps a task of its own and a task counts only for the finding it names', reshapePromptOf(emptied).includes('A decided fix keeps a task of its own, one that names it; a task counts only for the finding it names'), reshapePromptOf(emptied).slice(-1600))
  check('reshape: the shaper\'s file says the same of a decided fix\'s task after a reshape', shaperFile.includes('a task counts only for the finding it names'))
  // A call answered with a fix whose reshape still returns it as an ask lists its task, never the
  // recommended option's paths, so the second pass is shown the task as the first was.
  const askedAgain = await go('reshape: a call answered with a fix, the plan bounced', { ...baseArgs, decisions: changeIt }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], files: { 'R1-1': ['app/rec.php'] }, planBounce: 1, commitIds: [['R1-1']] })
  check('reshape: a call answered with a fix is shown its task\'s files on the second pass too, with nothing warned', askedAgain.res.status === 'done' && approverFiles(askedAgain, 'R1-1', PASS_2) === '["ask",["app/x.php"]]' && !anyWarning(askedAgain, 'the reshape changed'), [askedAgain.res.status, askedAgain.res.error, approverFiles(askedAgain, 'R1-1', PASS_2), (askedAgain.res || {}).warnings])
  // A finding a reshape newly leaves to the person under a rule is not read from the list any
  // more: its task has no files by rule, and it is shown the reshape's own list and disposition,
  // as every finding left to the person is, whatever its decision names (#126). Until #126 a
  // call whose decision names defer was still shown as a defer here, and its approved draft
  // was not filed; it is filed now (`namedLater`, in the #126 cases).
  const namedDefer = { 'R1-1': { choice: 'defer', notes: 'Defer it behind a guard.', date: '2026-11-20', disposition: 'defer' } }
  const forcedDefer = await go('reshape: a call whose decision names defer, left to the person under a rule by the reshape', { ...baseArgs, askRules: chargeRule, decisions: namedDefer, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeAskRule: { 'R1-1': 'billing' }, reshapeFiles: { 'R1-1': ['app/y.php'] }, resolveDeferred: [guardEntry], commitIds: [[], []] })
  check('reshape: a decided finding the reshape leaves to the person under a rule is shown the reshape\'s own list, and its files are not taken or warned about', approverFiles(forcedDefer, 'R1-1', PASS_2) === '["ask",["app/y.php"]]' && !anyWarning(forcedDefer, 'the reshape changed') && labels(forcedDefer.calls).includes('file deferred r1'), [forcedDefer.res.status, forcedDefer.res.error, approverFiles(forcedDefer, 'R1-1', PASS_2), (forcedDefer.res || {}).warnings])
  // A resolve sets the list of the ids it applied and no other (#97, R2-14): a reshape that
  // raises a call runs a resolve for that call alone, and a task that resolve returns for an
  // earlier decision does not undo what the reshape made of it.
  const raisedArgs = { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: { ...toDefer('Defer it behind a guard.'), 'R1-2': changeIt['R1-1'] }, deferrals: goAhead('R1-1') }
  const raisedScenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], decline: ['R1-1'], planBounce: 1, reshapeAsk: ['R1-2'], reshapeFiles: { 'R1-1': ['app/y.php'] }, resolveDeferred: [guardEntry], resolveDecided: { 'R1-2': 'fix' }, resolveExtraTasks: [{ n: 9, title: 't R1-1', files: ['app/x.php'], finding: 'R1-1' }], commitIds: [['R1-1', 'R1-2']] }
  const raisedLater = await go('reshape: a reshape moves a decided task and raises a call, whose resolve returns the old task too', raisedArgs, raisedScenario)
  check('reshape: a resolve for a raised call leaves an earlier decision\'s list as the reshape left it', labels(raisedLater.calls).includes('resolve r1 #1') && approverFiles(raisedLater, 'R1-1', PASS_2) === '["defer",["app/y.php"]]', [raisedLater.res.status, raisedLater.res.error, labels(raisedLater.calls).slice(4, 16), approverFiles(raisedLater, 'R1-1', PASS_2)])
  // An override a reshape returns as a call is applied again by the resolve that call sets off,
  // and that resolve's tasks do not replace its list either (#114, R3-4): a list is set by the
  // resolve that first applies a decision and replaced by each reshape (the spec's decision 17),
  // so a second resolve that plans no task for the override, or another one, leaves the list as
  // the reshape left it. Until R3-4 the second resolve's tasks alone replaced it.
  const overrideRecalled = (files) => ({ ...deferBounced, reshapeAsk: ['R1-1'], resolveFilesAt: { 'resolve r1 #1': { 'R1-1': files } }, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  const recalledNone = await go('reshape: an override to defer that a reshape returns as a call, whose second resolve plans no task for it', deferArgs, overrideRecalled([]))
  check('reshape: a second resolve that plans no task for an override a reshape returned as a call leaves its list as the reshape left it, on the second pass and at the build', (recalledNone.res || {}).status === 'done' && labels(recalledNone.calls).includes('resolve r1 #1') && approverFiles(recalledNone, 'R1-1', PASS_2) === '["defer",["app/x.php"]]' && implementerFiles(recalledNone, 'R1-1') === '["defer",["app/x.php"]]', [(recalledNone.res || {}).status, (recalledNone.res || {}).error, approverFiles(recalledNone, 'R1-1', PASS_2), implementerFiles(recalledNone, 'R1-1')])
  check('reshape: that override\'s commit of its own is not warned about as beside a task with no files', !anyWarning(recalledNone, 'has a commit of its own'), (recalledNone.res || {}).warnings)
  const recalledMoved = await go('reshape: an override to defer that a reshape returns as a call, whose second resolve plans its task elsewhere', deferArgs, overrideRecalled(['app/y.php']))
  check('reshape: a second resolve that plans another task for that override leaves its list as the reshape left it, with no change warned', (recalledMoved.res || {}).status === 'done' && approverFiles(recalledMoved, 'R1-1', PASS_2) === '["defer",["app/x.php"]]' && !anyWarning(recalledMoved, 'the reshape changed'), [(recalledMoved.res || {}).status, (recalledMoved.res || {}).error, approverFiles(recalledMoved, 'R1-1', PASS_2), (recalledMoved.res || {}).warnings])
  // The neighbour: a call a reshape newly raises has no list yet, and the resolve that applies it sets one.
  check('reshape: a call a reshape raises is shown the task its own resolve planned', approverFiles(raisedLater, 'R1-2', PASS_2) === '["ask",["app/x.php"]]', approverFiles(raisedLater, 'R1-2', PASS_2))
  // Replay: a stop that follows a reshape in a round with a decided finding, and its relaunch.
  const raisedStop = await go('reshape: a reshape in a round with a decided finding raises a call, unanswered', { ...raisedArgs, decisions: toDefer('Defer it behind a guard.') }, raisedScenario)
  check('reshape: a call the reshape raises stops the round after a reshape prompt that names the decided finding', raisedStop.res.status === 'handoff' && reshapePromptOf(raisedStop).includes(`${DECIDED_BLOCK}R1-1 (deferred). `), [raisedStop.res.status, raisedStop.res.handoffKind, raisedStop.res.error])
  // An ask the reshape newly raises is one the block does not name, and the Return sentence's
  // files clause keeps the recommended paths for it, which forceAskRules matches against the
  // paths rules (#114, R2-4): "an ask still pending" left it out, since the same sentence lists
  // the calls "still pending or newly raised" as two kinds.
  check('reshape: the files clause of a decided round\'s reshape covers an ask the reshape newly raises, by its recommended paths', reshapePromptOf(raisedStop).includes(FILES_DECIDED) && reshapePromptOf(raisedStop).includes('every judgment call still pending or newly raised') && !reshapePromptOf(raisedStop).includes('for an ask still pending,'), reshapePromptOf(raisedStop).slice(-900))
  samePrefix('reshape: the relaunch replays every prompt before a stop that follows a reshape of a decided round', raisedStop.calls, raisedLater.calls, raisedStop.calls.length)
  // A decision is held to its task after each reshape, as it is when its resolve returns (#99;
  // #108, R1-5): a decided fix the reshape leaves with no files, or a decided accept it leaves
  // with any, stops the round at that reshape, where a resume replans (#106). Left to run, the
  // fix would reach the check with no commit and stop after a repair, whose resume starts at the
  // build and cannot replan, and the accepted finding would be built against the decision. Each
  // way a decision ends in a fix or an accept has its case: an override, a call whose decision
  // names it, and a call the resolve agent stated.
  const RESHAPE_1 = 'reshape r1 #1'
  const stopsAtReshape = (r, error) => r.res.status === 'error' && r.res.stage === 'shape' && r.res.error === error && Boolean(r.res.resumeFrom) && r.res.resumeFrom.label === RESHAPE_1 && !labels(r.calls).includes(PASS_2)
  const stopOf = (r) => [r.res.status, r.res.stage, r.res.error, r.res.resumeFrom, labels(r.calls).slice(-3)]
  const toFix = { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-20', disposition: 'fix' } }
  const toAccept = { 'R1-1': { choice: 'accept', notes: 'Keep it as it is.', date: '2026-11-20', disposition: 'accept' } }
  const keepIt = { 'R1-1': { choice: 'Keep it', notes: 'Keep it as it is.', date: '2026-11-20' } }
  const overrideDial = { ...baseArgs, interrupt: 'plan', approvedPlans: [1] }
  const declined = { reviews: [[f('R1-1', 'correctness')]], decline: ['R1-1'], planBounce: 1, commitIds: [[]] }
  const asked = { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'], planBounce: 1, commitIds: [[]] }
  const NO_TASK = (how) => `the reshape left R1-1, which ${how} as a fix, with no task with files; a fix names the files it changes`
  const A_TASK = (how) => `the reshape left R1-1, which ${how} as accepted, with a task with files (app/y.php); an accepted finding changes nothing`
  const fixEmptied = await go('reshape: an override to fix whose task the reshape removes', { ...overrideDial, decisions: toFix }, { ...declined, reshapeFiles: { 'R1-1': [] } })
  check('reshape: an override to fix the reshape leaves with no task stops at that reshape, resumable there, before the next plan approver pass', stopsAtReshape(fixEmptied, NO_TASK('a disposition override names')), stopOf(fixEmptied))
  const namedFixEmptied = await go('reshape: a call whose decision names a fix, its task removed by the reshape', { ...baseArgs, decisions: toFix }, { ...asked, reshapeFiles: { 'R1-1': [] } })
  check('reshape: a call whose decision names a fix that the reshape leaves with no task stops at that reshape', stopsAtReshape(namedFixEmptied, NO_TASK('its decision names')), stopOf(namedFixEmptied))
  const statedFixEmptied = await go('reshape: a call stated as a fix, its task removed by the reshape', { ...baseArgs, decisions: changeIt }, { ...asked, reshapeFiles: { 'R1-1': [] } })
  check('reshape: a call stated as a fix that the reshape leaves with no task stops at that reshape', stopsAtReshape(statedFixEmptied, NO_TASK('the resolve agent stated')), stopOf(statedFixEmptied))
  const acceptTasked = await go('reshape: an override to accept that the reshape gives a task', { ...overrideDial, decisions: toAccept }, { ...declined, reshapeFiles: { 'R1-1': ['app/y.php'] } })
  check('reshape: an override to accept the reshape gives a task with files stops at that reshape', stopsAtReshape(acceptTasked, A_TASK('a disposition override names')), stopOf(acceptTasked))
  const statedAcceptTasked = await go('reshape: a call stated as accepted that the reshape gives a task', { ...baseArgs, decisions: keepIt }, { ...asked, acceptedCalls: ['R1-1'], reshapeFiles: { 'R1-1': ['app/y.php'] } })
  check('reshape: a call stated as accepted that the reshape gives a task with files stops at that reshape', stopsAtReshape(statedAcceptTasked, A_TASK('the resolve agent stated')), stopOf(statedAcceptTasked))
  const twoEmptied = await go('reshape: two overrides to fix whose tasks the reshape removes', { ...overrideDial, decisions: { 'R1-1': toFix['R1-1'], 'R1-2': toFix['R1-1'] } }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')]], decline: ['R1-1', 'R1-2'], planBounce: 1, reshapeFiles: { 'R1-1': [], 'R1-2': [] }, commitIds: [[]] })
  check('reshape: the stop names every decided fix the reshape left with no task', twoEmptied.res.status === 'error' && twoEmptied.res.error === 'the reshape left R1-1, which a disposition override names as a fix; R1-2, which a disposition override names as a fix, with no task with files; a fix names the files it changes', stopOf(twoEmptied))
  // The block names each decided finding with what its decision ends in, read as the hold reads
  // it (#114, R1-3): an override's or a call's own disposition, else what the resolve agent
  // stated. Until then it named the ids alone, and the reshape could learn the end only from the
  // task's wording in plan.md.
  const blockNames = (r, end) => reshapePromptOf(r).includes(`${DECIDED_BLOCK}R1-1 (${end}). Each is named with what its decision ends in. `)
  const blockLine = (r) => (reshapePromptOf(r).match(/Findings the person or the autopilot decided: [^.]*\./) || [''])[0]
  check('reshape: the block names each decided finding with its end: an override, a named call and a stated call, as a fix, as accepted or as deferred', blockNames(emptied, 'deferred') && blockNames(fixEmptied, 'fix') && blockNames(namedFixEmptied, 'fix') && blockNames(statedFixEmptied, 'fix') && blockNames(acceptTasked, 'accepted') && blockNames(statedAcceptTasked, 'accepted'), [emptied, fixEmptied, namedFixEmptied, statedFixEmptied, acceptTasked, statedAcceptTasked].map(blockLine))
  // A path is read one way, from a resolve's tasks and from a reshape's list alike (#114, R1-6):
  // trimmed, with the repository root or a leading ./ taken off and a blank dropped. A reshape
  // that writes the resolve's file another way lists the same file, so nothing changes and
  // nothing is warned; and a list of blanks is no list, so a decided fix left with one is held.
  const sameFileAnotherWay = await go('reshape: an override to defer whose task the reshape lists in other forms of the same path', deferArgs, { ...deferBounced, reshapeFiles: { 'R1-1': ['./app/x.php', '/r/app/x.php', ' app/x.php '] }, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('reshape: a reshape that lists the resolve\'s file in other forms changes nothing: the second pass is shown it as it was, and nothing is warned', sameFileAnotherWay.res.status === 'done' && approverFiles(sameFileAnotherWay, 'R1-1', PASS_2) === '["defer",["app/x.php"]]' && !anyWarning(sameFileAnotherWay, 'the reshape changed'), [sameFileAnotherWay.res.status, sameFileAnotherWay.res.error, approverFiles(sameFileAnotherWay, 'R1-1', PASS_2), (sameFileAnotherWay.res || {}).warnings])
  const fixBlanked = await go('reshape: an override to fix whose task the reshape lists as a blank path', { ...overrideDial, decisions: toFix }, { ...declined, reshapeFiles: { 'R1-1': [''] } })
  check('reshape: an override to fix the reshape leaves with only a blank path stops at that reshape, as one with no files does', stopsAtReshape(fixBlanked, NO_TASK('a disposition override names')), stopOf(fixBlanked))
  // The cleanup reads each form it folds one way (#114, R2-2), a case per form: the root and then
  // a leading ./ taken off, as relPath takes them for the ask rules, repeated slashes and ./
  // segments folded, and a trailing slash dropped. R1-6 took off the root or a leading ./, never
  // both, and kept the other forms as written, so a reshape that wrote the resolve's file one of
  // these ways was warned about as a change, and a resolve that did was shown in that form.
  for (const form of ['/r/./app/x.php', 'app//x.php', 'app/./x.php', './app/x.php/']) {
    const r = await go(`reshape: an override to defer whose task the reshape lists as ${form}`, deferArgs, { ...deferBounced, reshapeFiles: { 'R1-1': [form] }, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
    check(`reshape: a reshape that lists the resolve's app/x.php as ${form} changes nothing: the second pass is shown app/x.php, and nothing is warned`, r.res.status === 'done' && approverFiles(r, 'R1-1', PASS_2) === '["defer",["app/x.php"]]' && !anyWarning(r, 'the reshape changed'), [r.res.status, r.res.error, approverFiles(r, 'R1-1', PASS_2), (r.res || {}).warnings])
  }
  const resolvedOtherForm = await go('reshape: an override to defer whose resolve plans its file with a doubled slash and a trailing slash', deferArgs, { ...deferBounced, resolveFiles: { 'R1-1': ['app//x.php/'] }, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('reshape: a resolve that plans a file with a doubled slash and a trailing slash is read as that file on both passes, and a reshape that lists it as planned changes nothing', resolvedOtherForm.res.status === 'done' && approverFiles(resolvedOtherForm, 'R1-1') === '["defer",["app/x.php"]]' && approverFiles(resolvedOtherForm, 'R1-1', PASS_2) === '["defer",["app/x.php"]]' && !anyWarning(resolvedOtherForm, 'the reshape changed'), [resolvedOtherForm.res.status, resolvedOtherForm.res.error, approverFiles(resolvedOtherForm, 'R1-1'), approverFiles(resolvedOtherForm, 'R1-1', PASS_2)])
  // The cleanup is one function that reads a path as the guard reads a write target (#114, R4-2):
  // joined to the root, then folded, `..` segments and a trailing /. included. R2-2 folded the
  // forms above and kept these as written, so a reshape that wrote the resolve's file through a
  // `..` segment, with a trailing /. or out of the repository and back was warned about as a change.
  for (const form of ['app/sub/../x.php', 'app/x.php/.', '../r/app/x.php']) {
    const r = await go(`reshape: an override to defer whose task the reshape lists as ${form}`, deferArgs, { ...deferBounced, reshapeFiles: { 'R1-1': [form] }, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
    check(`reshape: a reshape that lists the resolve's app/x.php as ${form} changes nothing: the second pass is shown app/x.php, and nothing is warned`, r.res.status === 'done' && approverFiles(r, 'R1-1', PASS_2) === '["defer",["app/x.php"]]' && !anyWarning(r, 'the reshape changed'), [r.res.status, r.res.error, approverFiles(r, 'R1-1', PASS_2), (r.res || {}).warnings])
  }
  const resolvedDotDot = await go('reshape: an override to defer whose resolve plans its file through a .. segment', deferArgs, { ...deferBounced, resolveFiles: { 'R1-1': ['app/sub/../x.php'] }, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('reshape: a resolve that plans a file through a .. segment is read as that file on both passes, and a reshape that lists it as planned changes nothing', resolvedDotDot.res.status === 'done' && approverFiles(resolvedDotDot, 'R1-1') === '["defer",["app/x.php"]]' && approverFiles(resolvedDotDot, 'R1-1', PASS_2) === '["defer",["app/x.php"]]' && !anyWarning(resolvedDotDot, 'the reshape changed'), [resolvedDotDot.res.status, resolvedDotDot.res.error, approverFiles(resolvedDotDot, 'R1-1'), approverFiles(resolvedDotDot, 'R1-1', PASS_2)])
  // The repository root names no file, however it is written, so a decided fix left with it alone
  // is held as one left with a blank is. Until R4-2 the root with no slash after it, and a path
  // that folds to it, counted as a file.
  for (const root of ['/r', 'app/..']) {
    const r = await go(`reshape: an override to fix whose task the reshape lists as the repository root, ${root}`, { ...overrideDial, decisions: toFix }, { ...declined, reshapeFiles: { 'R1-1': [root] } })
    check(`reshape: an override to fix the reshape leaves with only ${root} stops at that reshape, as one with no files does`, stopsAtReshape(r, NO_TASK('a disposition override names')), stopOf(r))
  }
  // A path outside the repository is kept, in its absolute folded form: it is no repository file,
  // so it is a change, and it is shown as what it is. The second held before, as written, and is
  // seen red under a mutation that drops an outside path.
  const climbed = await go('reshape: an override to defer whose task the reshape lists above the repository', deferArgs, { ...deferBounced, reshapeFiles: { 'R1-1': ['../x.php'] }, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('reshape: a reshape that lists a path above the repository is warned about as a change to that path, folded', climbed.res.status === 'done' && approverFiles(climbed, 'R1-1', PASS_2) === '["defer",["/x.php"]]' && warned(climbed, CHANGED('app/x.php', '/x.php')), [climbed.res.status, climbed.res.error, approverFiles(climbed, 'R1-1', PASS_2), (climbed.res || {}).warnings])
  const elsewhere = await go('reshape: an override to defer whose task the reshape lists elsewhere on the disk', deferArgs, { ...deferBounced, reshapeFiles: { 'R1-1': ['/etc/x.php'] }, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('reshape: a reshape that lists an absolute path elsewhere is warned about as a change to that path, and it is kept', elsewhere.res.status === 'done' && approverFiles(elsewhere, 'R1-1', PASS_2) === '["defer",["/etc/x.php"]]' && warned(elsewhere, CHANGED('app/x.php', '/etc/x.php')), [elsewhere.res.status, elsewhere.res.error, approverFiles(elsewhere, 'R1-1', PASS_2), (elsewhere.res || {}).warnings])
  // A finding nobody decided is shown with the shaper's own list, read the same way where the
  // shape is taken in (#114, R4-4): the plan approver and the implementer are shown one form of
  // each path, once. Until R4-4 they were shown the list as the shaper wrote it.
  const shaperOtherForm = await go('shape: a fix nobody decided, listed in other forms of one path', baseArgs, { reviews: [[f('R1-1', 'correctness')], []], files: { 'R1-1': ['./app//x.php', ' app/x.php ', 'app/sub/../y.php'] }, commitIds: [['R1-1']] })
  check('shape: a finding nobody decided is shown to the plan approver and the implementer with its files read one way', (shaperOtherForm.res || {}).status === 'done' && approverFiles(shaperOtherForm, 'R1-1') === '["fix",["app/x.php","app/y.php"]]' && implementerFiles(shaperOtherForm, 'R1-1') === '["fix",["app/x.php","app/y.php"]]', [(shaperOtherForm.res || {}).status, (shaperOtherForm.res || {}).error, approverFiles(shaperOtherForm, 'R1-1'), implementerFiles(shaperOtherForm, 'R1-1')])
  // A finding the shaper returned with no list keeps none: a result recorded before the list was
  // required (#100) replays with the prompts it had. Held before, and seen red under a mutation
  // that reads an absent list as an empty one.
  const shaperNoList = await go('shape: a fix nobody decided, returned with no list of files', baseArgs, { reviews: [[f('R1-1', 'correctness')], []], files: { 'R1-1': undefined }, commitIds: [['R1-1']] })
  check('shape: a finding returned with no list of files is shown with none, never with an empty one', (shaperNoList.res || {}).status === 'done' && approverFiles(shaperNoList, 'R1-1') === '["fix",null]', [(shaperNoList.res || {}).status, (shaperNoList.res || {}).error, approverFiles(shaperNoList, 'R1-1')])
  // The neighbours. A deferral is never held: a mitigation is optional, and `emptied` above runs
  // on. A fix whose task the reshape moves to other files still has one. A finding the reshape
  // leaves to the person under a rule is skipped, its task having no files by rule. And an accept
  // a reshape re-sorts with no task for it runs on (`acceptedResorted` below).
  const fixMoved = await go('reshape: an override to fix whose task the reshape moves', { ...overrideDial, decisions: toFix }, { ...declined, reviews: [[f('R1-1', 'correctness')], []], reshapeFiles: { 'R1-1': ['app/y.php'] }, commitIds: [['R1-1']] })
  check('reshape: a decided fix whose task the reshape moved to other files runs on, shown the new files and warned about', fixMoved.res.status === 'done' && approverFiles(fixMoved, 'R1-1', PASS_2) === '["fix",["app/y.php"]]' && warned(fixMoved, CHANGED('app/x.php', 'app/y.php')), [stopOf(fixMoved), approverFiles(fixMoved, 'R1-1', PASS_2), (fixMoved.res || {}).warnings])
  const forcedEmptied = await go('reshape: a call stated as a fix that the reshape leaves to the person under a rule, listing no files', { ...baseArgs, askRules: chargeRule, decisions: changeIt }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeAskRule: { 'R1-1': 'billing' }, reshapeFiles: { 'R1-1': [] }, commitIds: [[], []] })
  check('reshape: a decided fix the reshape leaves to the person under a rule is not held to a task', forcedEmptied.res.status === 'done' && labels(forcedEmptied.calls).includes(PASS_2), stopOf(forcedEmptied))
  // Whether a decided finding is a disposition override is read from the round's own overrides,
  // never from the round's calls (#114, R2-5): a reshape that returns a call for an override's
  // finding adds it to `calls`, and the resolve that call sets off and every later reshape's hold
  // then named the override as a call's decision. One run per place that names it: the resolve's
  // stray warning and the hold's stop.
  const STRAY_OVERRIDE = 'round 1: the resolve agent listed R1-1 as deferred, a finding whose disposition the person changed to fix; the entry is dropped, since the decision stands'
  const overrideCalled = await go('reshape: an override to fix that a reshape returns as a call, a stray entry beside it at each resolve', { ...overrideDial, decisions: toFix }, { ...declined, reviews: [[f('R1-1', 'correctness')], []], reshapeAsk: ['R1-1'], resolveDeferred: [guardEntry], commitIds: [['R1-1']] })
  check('reshape: the resolve a reshape\'s call for an override sets off warns of a stray entry as the override\'s, never as a call\'s decision', overrideCalled.res.status === 'done' && labels(overrideCalled.calls).includes('resolve r1 #1') && warned(overrideCalled, STRAY_OVERRIDE) && !anyWarning(overrideCalled, 'a call whose decision names it as'), [overrideCalled.res.status, overrideCalled.res.error, (overrideCalled.res || {}).warnings])
  const overrideCalledEmptied = await go('reshape: an override to fix that a first reshape returns as a call and a second leaves with no task', { ...overrideDial, decisions: toFix }, { ...declined, planBounce: 2, reshapeAsk: ['R1-1'], reshapeFilesAt: { 'reshape r1 #2': { 'R1-1': [] } } })
  check('reshape: the hold names an override a reshape returned as a call as a disposition override, at the later reshape that leaves it with no task', overrideCalledEmptied.res.status === 'error' && overrideCalledEmptied.res.stage === 'shape' && overrideCalledEmptied.res.error === NO_TASK('a disposition override names') && Boolean(overrideCalledEmptied.res.resumeFrom) && overrideCalledEmptied.res.resumeFrom.label === 'reshape r1 #2', stopOf(overrideCalledEmptied))
  // The resolve such a call sets off is not held to a task for a named fix (#114, R4-5): since
  // R3-4 the round does not read that resolve's tasks for a finding that already has a list, and
  // the hold after the reshape has just checked that list, so a second resolve that does not
  // restate the override's task runs on with the list as the reshape left it. Until R4-5 it
  // stopped the round at that resolve for a task the list held.
  const fixRecalledNone = await go('reshape: an override to fix that a reshape returns as a call, whose second resolve plans no task for it', { ...overrideDial, decisions: toFix }, { ...declined, reviews: [[f('R1-1', 'correctness')], []], reshapeAsk: ['R1-1'], resolveFilesAt: { 'resolve r1 #1': { 'R1-1': [] } }, commitIds: [['R1-1']] })
  check('reshape: a second resolve that plans no task for an override to fix does not stop the round, and its list stays as the reshape left it, on the second pass and at the build', (fixRecalledNone.res || {}).status === 'done' && labels(fixRecalledNone.calls).includes('resolve r1 #1') && approverFiles(fixRecalledNone, 'R1-1', PASS_2) === '["fix",["app/x.php"]]' && implementerFiles(fixRecalledNone, 'R1-1') === '["fix",["app/x.php"]]', [stopOf(fixRecalledNone), approverFiles(fixRecalledNone, 'R1-1', PASS_2), implementerFiles(fixRecalledNone, 'R1-1')])
  // The accept half stays on what that resolve itself returned: a task with files for a finding
  // the person accepted stops at the resolve, where a resume reruns it, and does not wait for the
  // plan approver to notice. Held before, and seen red under a mutation that leaves a finding
  // with a list out of this check as well.
  const acceptRecalledTasked = await go('reshape: an override to accept that a reshape returns as a call, whose second resolve plans a task for it', { ...overrideDial, decisions: toAccept }, { ...declined, reshapeAsk: ['R1-1'], resolveFilesAt: { 'resolve r1 #1': { 'R1-1': ['app/y.php'] } } })
  check('reshape: a second resolve that plans a task with files for an override to accept stops at that resolve, resumable there', acceptRecalledTasked.res.status === 'error' && acceptRecalledTasked.res.stage === 'resolve' && acceptRecalledTasked.res.error === 'the resolve agent planned a task with files for R1-1 (app/y.php), which a disposition override names as accepted; an accepted finding changes nothing' && Boolean(acceptRecalledTasked.res.resumeFrom) && acceptRecalledTasked.res.resumeFrom.label === 'resolve r1 #1', stopOf(acceptRecalledTasked))
  // A resumed reshape is never told to rewrite the four files from scratch (#117): by then the
  // folder can hold the entries and tasks the resolve agent wrote for the round's decisions. Its
  // clause is chosen by its label and by the field its stop set (#116). After the workflow's own
  // check of what the reshape returned (the hold, a result check) the rerun corrects what the
  // error names and keeps the decided entries, as the resolve's does (#108, R3-4). After any
  // other stop (the spec check, a call that returned nothing) it restores what is missing.
  // Until #117 only the hold's stop was told to correct in place, and every other was told to
  // rewrite. The from-scratch sentence stays for a round's first shape, which no decision can
  // precede in a round folder its own launch created; a revise-only pass over an earlier run's
  // round shapes in that run's folder, where a resume still rewrites the decided entries, as it
  // always has (#120, R1-1).
  const resumeLineFor = (e) => `Resume attempt 2 of this step. The run stopped at this step with an error (${e}); the person has since fixed the cause by hand. Do the step again from the current state of the repository and the PR. What an earlier attempt already made stands (a commit, a posted review or reply, a written file), and the duplicate checks in your instructions apply.`
  const FROM_SCRATCH = ' Rewrite plan.md, shape.md, standards.md and references.md in the spec folder from scratch, replacing what the earlier attempt wrote; never change or remove anything under its redline/ folder.'
  const REWRITTEN = 'from scratch, replacing what the earlier attempt wrote'
  const CORRECT_IN_PLACE = ' When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it: read plan.md, shape.md, standards.md and references.md as that attempt left them, the entries the person or the autopilot decided and the tasks written for them included, correct what the error names, and return the whole result again; never write a decided entry the folder no longer holds from memory (name it in shape.md as lost), and never change or remove anything under its redline/ folder.'
  const RESTORE = ' This step is a reshape, so the spec folder already holds the earlier work of this round, though part of it may be missing: read plan.md, shape.md, standards.md and references.md as they stand, keep any entry the person or the autopilot decided, and the task written for it unless an adjustment above changes that task, then write again what is missing or left unfinished and return the whole result again. Never rewrite the four files from scratch, never write a decided entry the folder no longer holds from memory (name it in shape.md as lost), and never change or remove anything under its redline/ folder.'
  const resumeAt = (error, own) => ({ [RESHAPE_1]: { attempt: 2, error, hand: { commits: [], paths: [] }, ...(own ? { ownCheck: true } : {}) } })
  const fixRestored = await go('reshape: an override to fix whose task the reshape removed, resumed', { ...overrideDial, decisions: toFix, resume: resumeAt(NO_TASK('a disposition override names'), true) }, { ...declined, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  const restoredPrompt = reshapePromptOf(fixRestored)
  // No fallback to the wording (#116): the same error on an entry with no ownCheck is an ordinary
  // stop, so its rerun is not told the stop was the workflow's check.
  const fixRestoredFieldless = await go('reshape: an override to fix whose task the reshape removed, resumed from an entry with no ownCheck', { ...overrideDial, decisions: toFix, resume: resumeAt(NO_TASK('a disposition override names')) }, { ...declined, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('reshape: an entry with no ownCheck is an ordinary stop whatever its error says: a reshape resumed from one is told to restore what is missing, never that the stop was the workflow\'s check', reshapePromptOf(fixRestoredFieldless).endsWith(resumeLineFor(NO_TASK('a disposition override names')) + RESTORE) && !reshapePromptOf(fixRestoredFieldless).includes('nothing was fixed by hand'), reshapePromptOf(fixRestoredFieldless).slice(-700))
  check('reshape: a reshape resumed after that stop is told to correct what the error names and keep the decided entries, never to rewrite the folder, and the relaunch finishes', restoredPrompt.endsWith(resumeLineFor(NO_TASK('a disposition override names')) + CORRECT_IN_PLACE) && !restoredPrompt.includes(FROM_SCRATCH) && fixRestored.res.status === 'done', [restoredPrompt.slice(-700), stopOf(fixRestored)])
  // The clause after the workflow's own check bans writing a lost decided entry back from memory,
  // as the restore clause does (#120, R2-3): the reshape prompt names each decided finding and its
  // end, never the person's words, and a reshape the hold or a check of its result stopped may
  // have dropped an entry as well as a task. Until R2-3 only the restore clause said so.
  check('reshape: a reshape resumed after the workflow\'s check is told never to write a decided entry the folder no longer holds from memory', restoredPrompt.includes('correct what the error names, and return the whole result again; never write a decided entry the folder no longer holds from memory (name it in shape.md as lost)'), restoredPrompt.slice(-700))
  const specLost = await go('reshape: a reshape of a decided round that leaves no shape.md', { ...overrideDial, decisions: toFix }, { ...declined, specMissing: { 'spec status r1 #1': 'shape' } })
  const specLostError = (specLost.res || {}).error || ''
  const specRestored = await go('reshape: a reshape of a decided round that left no shape.md, resumed', { ...overrideDial, decisions: toFix, resume: resumeAt(specLostError) }, { ...declined, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('reshape: a reshape resumed after another stop is told to restore what is missing and keep the decided entries, never to rewrite the folder, and the relaunch finishes', specLost.res.status === 'error' && specLostError !== '' && specLost.res.ownCheck === false && reshapePromptOf(specRestored).endsWith(resumeLineFor(specLostError) + RESTORE) && !reshapePromptOf(specRestored).includes(REWRITTEN) && !reshapePromptOf(specRestored).includes(CORRECT_IN_PLACE) && specRestored.res.status === 'done', [specLostError, reshapePromptOf(specRestored).slice(-700), stopOf(specRestored)])
  // A decided finding's task follows an adjustment the reshape applies (#106), so the restore
  // clause keeps a decided task unless an adjustment changes it (#120, R1-2): until R1-2 it said
  // to keep the task, beside a reshape prompt that says to apply each adjustment.
  check('reshape: a reshape resumed after another stop keeps a decided task unless an adjustment above changes it', reshapePromptOf(specRestored).includes('keep any entry the person or the autopilot decided, and the task written for it unless an adjustment above changes that task'), reshapePromptOf(specRestored).slice(-700))
  // The neighbour: the first shape of the same round, stopped by the same check, still rewrites.
  // No decision can be on disk when a first shape is resumed in a round folder its own launch
  // created (the #117 spec's measurement; a revise-only pass over an earlier run's round is the
  // exception, #120, R1-1), and its line is the one it had, byte for byte.
  const firstLost = await go('reshape: the first shape of that round leaves no shape.md', { ...overrideDial, decisions: toFix }, { ...declined, specMissing: { 'spec status r1': 'shape' } })
  const firstLostError = (firstLost.res || {}).error || ''
  const firstRestored = await go('reshape: the first shape of that round left no shape.md, resumed', { ...overrideDial, decisions: toFix, resume: { 'shape r1': { attempt: 2, error: firstLostError, hand: { commits: [], paths: [] } } } }, { ...declined, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('reshape: the first shape of the same round, resumed after its spec check, still rewrites the four files from scratch, its line byte for byte as it was', firstLost.res.status === 'error' && firstLostError !== '' && (firstLost.res.resumeFrom || {}).label === 'shape r1' && reshapePromptOf(firstRestored, 'shape r1').endsWith(resumeLineFor(firstLostError) + FROM_SCRATCH) && firstRestored.res.status === 'done', [stopOf(firstLost), reshapePromptOf(firstRestored, 'shape r1').slice(-500), stopOf(firstRestored)])
  check('reshape: the shaper\'s file says a resumed reshape never rewrites from scratch: it corrects what the error names after the workflow\'s check, and restores what is missing after any other stop', shaperFile.includes('A resumed reshape never rewrites from scratch') && shaperFile.includes('correct what the error names') && shaperFile.includes('write again what is missing or left unfinished') && shaperFile.includes('never write a decided entry the folder no longer holds from memory'))
  check('reshape: the shaper\'s file says a reshape resumed after any other stop keeps a decided task unless an adjustment changes it', shaperFile.includes('keep every decided entry, and its task unless an adjustment changes that task'))
  check('reshape: the shaper\'s file says a reshape resumed after the workflow\'s check never writes a lost decided entry from memory', shaperFile.includes('the decided entries and their tasks included, correct what the error names, and return the whole result again; never write a decided entry the folder no longer holds from memory'))
  // Rule 9 keeps the ban on touching redline/ for a resumed reshape as for a resumed first shape,
  // and both clauses above carry it to their end (#114, R4-1).
  check('reshape: the shaper\'s file says a resumed first shape rewrites the four files, and that redline/ is left alone on either resume', shaperFile.includes('On a resume attempt (the invoking prompt says so) of a round\'s first shape, rewrite the four files from scratch') && shaperFile.includes('Either way, never change or remove anything under its `redline/` folder.'))
  // One reshape that breaks two decisions in opposite ways is stopped once, for both (#114, R4-6):
  // the resume line tells the rerun to correct what the error names, so an error that named
  // only the emptied fix had the rerun repair that one and the hold stop again, at the same
  // label, for the accept. Each message alone reads as it did (NO_TASK and A_TASK above).
  const BOTH = 'the reshape left R1-1, which a disposition override names as a fix, with no task with files; a fix names the files it changes; and R1-2, which a disposition override names as accepted, with a task with files (app/y.php); an accepted finding changes nothing'
  const fixAndAccept = { 'R1-1': toFix['R1-1'], 'R1-2': toAccept['R1-1'] }
  const twoDeclined = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')]], decline: ['R1-1', 'R1-2'], planBounce: 1, commitIds: [[]] }
  const bothBroken = await go('reshape: one reshape that removes a decided fix\'s task and gives a decided accept one', { ...overrideDial, decisions: fixAndAccept }, { ...twoDeclined, reshapeFiles: { 'R1-1': [], 'R1-2': ['app/y.php'] } })
  check('reshape: the stop names a fix left with no task and an accept left with one together, once, at that reshape', stopsAtReshape(bothBroken, BOTH), stopOf(bothBroken))
  const bothRestored = await go('reshape: a fix left with no task and an accept left with one, resumed', { ...overrideDial, decisions: fixAndAccept, resume: resumeAt(BOTH, true) }, { ...twoDeclined, reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], commitIds: [['R1-1']] })
  check('reshape: a reshape resumed after the stop for both is told to correct what the error names, and the relaunch finishes', reshapePromptOf(bothRestored).endsWith(resumeLineFor(BOTH) + CORRECT_IN_PLACE) && bothRestored.res.status === 'done', [reshapePromptOf(bothRestored).slice(-900), stopOf(bothRestored)])
  // Every kind of reshape stop, each resumed from the entry its own result gives (#117): the
  // field is the stop's, read off the result as the marker and the skill carry it. The prompts
  // before the reshape replay, and the reshape's is the one prompt that changes.
  const resumedReshape = async (name, args, stopScenario, runScenario, label = RESHAPE_1, attempt = 2) => {
    const stop = await go(name, args, stopScenario)
    const error = (stop.res || {}).error || ''
    const own = (stop.res || {}).ownCheck === true
    const again = await go(`${name}, resumed`, { ...args, resume: { [label]: { attempt, error, hand: { commits: [], paths: [] }, ownCheck: own } } }, runScenario)
    const at = stop.calls.findIndex((c) => c.label === label)
    samePrefix(name, stop.calls, again.calls, at)
    const withLine = again.calls.filter((c) => c.prompt.includes('Resume attempt')).map((c) => c.label).join()
    return { stop, error, own, again, prompt: reshapePromptOf(again, label), stoppedThere: (stop.res || {}).status === 'error' && (stop.res || {}).stage === 'shape' && ((stop.res || {}).resumeFrom || {}).label === label, onePrompt: withLine === label, lineFor: (clause) => resumeLineFor(error).replace('Resume attempt 2 ', `Resume attempt ${attempt} `) + clause }
  }
  const toldOnly = (r, clause) => r.stoppedThere && r.onePrompt && r.prompt.endsWith(r.lineFor(clause)) && !r.prompt.includes(REWRITTEN) && (r.again.res || {}).status === 'done'
  const shown = (r) => [stopOf(r.stop), r.own, r.onePrompt, r.prompt.slice(-700), (r.again.res || {}).status, (r.again.res || {}).error]
  const twoInRound = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], decline: ['R1-1'], planBounce: 1, commitIds: [['R1-1', 'R1-2']] }
  const decidedRound = { ...overrideDial, decisions: toFix }
  const noReason = await resumedReshape('reshape: a reshape of a decided round that declines another finding with no reason', decidedRound, { ...twoInRound, reshapeDecline: ['R1-2'], declineNoReason: ['R1-2'] }, twoInRound)
  check('reshape: a reshape of a decided round resumed after a check of its result (a decline with no reason) is told to correct what the error names and keep the decided entries', noReason.own === true && noReason.error.startsWith('the shaper declined R1-2 with no reason') && toldOnly(noReason, CORRECT_IN_PLACE), shown(noReason))
  const crashed = await resumedReshape('reshape: a reshape of a decided round that returns nothing', decidedRound, { ...twoInRound, nothing: [RESHAPE_1] }, twoInRound)
  check('reshape: a reshape of a decided round resumed after it returned nothing is told to restore what is missing, never to rewrite', crashed.own === false && crashed.error.startsWith('reshape r1 #1 returned nothing') && toldOnly(crashed, RESTORE), shown(crashed))
  // A round with no decision gets the same two clauses: its reshape prompt already says to
  // correct the four files in place, and the clause does not turn on what the round decided.
  const plainRound = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], planBounce: 1, commitIds: [['R1-1', 'R1-2']] }
  const plainLost = await resumedReshape('reshape: a reshape of a round with no decision that leaves no plan.md', baseArgs, { ...plainRound, specMissing: { 'spec status r1 #1': 'plan' } }, plainRound)
  check('reshape: a reshape of a round with no decision resumed after its spec check is told to restore what is missing, never to rewrite', plainLost.own === false && toldOnly(plainLost, RESTORE), shown(plainLost))
  // The restore clause opens with what is true after every stop it follows (#120, R3-5): the spec
  // check's no plan.md stop is one of them, and until R3-5 the clause opened by saying the folder
  // already held the plan.
  check('reshape: a reshape resumed after its spec check found no plan.md is told part of the folder may be missing, never that the folder already holds the plan', plainLost.error.endsWith(': no plan.md') && plainLost.prompt.includes('already holds the earlier work of this round, though part of it may be missing') && !plainLost.prompt.includes('already holds the plan'), shown(plainLost))
  const plainDropped = await resumedReshape('reshape: a reshape of a round with no decision that leaves a finding out', baseArgs, { ...plainRound, reshapeDrop: ['R1-2'] }, plainRound)
  check('reshape: a reshape of a round with no decision resumed after a check of its result is told to correct what the error names', plainDropped.own === true && plainDropped.error === 'the shaper gave no disposition for R1-2' && toldOnly(plainDropped, CORRECT_IN_PLACE), shown(plainDropped))
  // A human review pass's reshape goes by the same label test (reshape h<n> #<k>).
  const comment1 = { id: 'H1-1', file: 'app/x.php', line: 1, side: 'RIGHT', category: 'human', severity: 'medium', confidence: 'confirmed', title: 'comment H1-1', description: 'Please change H1-1.', proposedFix: '', needsDecision: false, knownAs: '', source: '@marcamos', commentId: 900, threadId: 900, reviewId: 7 }
  const humanDecided = { ...baseArgs, firstRound: 3, decisions: { 'H1-1': { choice: 'Change it', notes: 'The author changes it.', date: '2026-11-22' } }, revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: '', specFolder: 'agent-os/specs/2026-10-20-1600-114-human-review-1', findings: [comment1], commentIds: { 'H1-1': 900 }, posted: true } }
  const humanRound = { reviews: [[]], ask: ['H1-1'], planBounce: 1, commitIds: [['H1-1'], []] }
  const humanLost = await resumedReshape('reshape: a human review pass\'s reshape, after the author\'s answer, that leaves no shape.md', humanDecided, { ...humanRound, specMissing: { 'spec status h1 #1': 'shape' } }, humanRound, 'reshape h1 #1')
  check('reshape: a human review pass\'s reshape resumed after its spec check is told to restore what is missing, never to rewrite', labels(humanLost.stop.calls).includes('resolve h1') && humanLost.own === false && toldOnly(humanLost, RESTORE), shown(humanLost))
  // The entry holds the last error, so a reshape resumed after the hold that then failed the
  // spec check is resumed a third time from that error: restore, and still no rewrite.
  const thirdTime = await go('reshape: a reshape resumed after the hold, then stopped by the spec check, resumed again', { ...decidedRound, resume: { [RESHAPE_1]: { attempt: 3, error: specLostError, hand: { commits: [], paths: [] }, ownCheck: false } } }, { ...declined, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('reshape: a third attempt after the hold and then the spec check is told to restore what is missing, never to rewrite', reshapePromptOf(thirdTime).endsWith(resumeLineFor(specLostError).replace('Resume attempt 2 ', 'Resume attempt 3 ') + RESTORE) && !reshapePromptOf(thirdTime).includes(REWRITTEN) && (thirdTime.res || {}).status === 'done', [reshapePromptOf(thirdTime).slice(-700), (thirdTime.res || {}).status, (thirdTime.res || {}).error, thirdTime.thrown ? thirdTime.thrown.message : ''])
  // maxPlanAdjustments stays the only bound on bounces (#106). The stop at the cap keeps its
  // message and its label, and its detail names each decided finding whose task a reshape
  // changed: the list as the resolve planned it, then as each reshape that changed it left it.
  const atCap = await go('reshape: an override to defer whose task the reshape removes, bounced to the cap', deferArgs, { ...deferBounced, planBounce: 3, reshapeFiles: { 'R1-1': [] } })
  check('reshape: the stop at the cap is the approve stop as before, and its detail names the decided task the reshapes changed', atCap.res.status === 'error' && atCap.res.stage === 'approve' && atCap.res.error === 'the plan approver did not approve the round 1 plan after 2 adjustments' && Boolean(atCap.res.resumeFrom) && atCap.res.resumeFrom.label === 'plan approver r1 #3' && JSON.stringify((atCap.res.detail || {}).reshaped) === '[{"id":"R1-1","decidedBy":"@author","files":[["app/x.php"],[]]}]' && Array.isArray((atCap.res.detail || {}).adjustments), [stopOf(atCap), atCap.res.detail])
  const atCapPlain = await go('reshape: the same round with no decision, bounced to the cap', { ...baseArgs, interrupt: 'plan', approvedPlans: [1] }, { ...deferBounced, planBounce: 3 })
  const atCapSame = await go('reshape: an override to defer whose task every reshape keeps, bounced to the cap', deferArgs, { ...deferBounced, planBounce: 3 })
  check('reshape: the stop at the cap carries no such key when no reshape changed a decided finding\'s task', atCapPlain.res.status === 'error' && atCapPlain.res.stage === 'approve' && !('reshaped' in (atCapPlain.res.detail || {})) && atCapSame.res.stage === 'approve' && !('reshaped' in (atCapSame.res.detail || {})), [atCapPlain.res.detail, atCapSame.res.detail])
  // What a call's decision ends in is read from what the resolve agent states (#99), never from
  // its deferred entry or from whether its task has files, and the statement is checked against
  // the tasks and entries the same resolve returned. Four runs cover both statements over both
  // entries, so neither the words nor the emptiness of the mitigation field decides anything: a
  // filled entry and an empty one beside a call stated as a fix are dropped, and the fix is
  // demanded (`strayFilled`, `strayResolve`); the same two beside a call stated as a deferral are
  // the decision's deferral (`strayWorded` and `mitigateAnswer`, `emptyDeferral`).
  // Pin 1 of #99: a fix beside a stray filled entry, which was filed as an issue until #99, on
  // autopilot with no question. Since #105 autopilot picks the recommended option and nothing is
  // stated for it, so the statement's cases here are a call the person answered in their own
  // words (typedAnswer); the same entry beside autopilot's pick is `autoStray`, in the #105 cases.
  const strayEntry = { id: 'R1-1', mitigation: 'a guard', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }
  const strayScenario = { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], resolveDeferred: [strayEntry], resolveDecided: { 'R1-1': 'fix' }, commitIds: [['R1-1']] }
  const STRAY_CALL = 'round 1: the resolve agent listed R1-1 as deferred and stated its decision as fix; the entry is dropped, since the statement decides'
  // The prompts a dropped entry must not reach. A prompt that is absent reads as '' and fails.
  const shownTo = (r) => ['plan approver r1', 'implement r1'].map((label) => (pick(r.calls, label) || { prompt: '' }).prompt)
  const entryDropped = (r) => shownTo(r).every((p) => p !== '' && !p.includes('"title": "Lock R1-1"')) && (r.res.warnings || []).includes(STRAY_CALL)
  const postedAsFix = (r) => r.res.status === 'done' && !labels(r.calls).includes('file deferred r1') && (r.res.deferred || []).length === 0 && (replyFor(r.calls, 'push and reply r1', 'R1-1') || '').includes(' Applied in ') && !(replyFor(r.calls, 'push and reply r1', 'R1-1') || '').includes('Deferred to') && (r.res.rounds[1] || {}).reviewed === 'fix-diff'
  const fixDetail = (r) => [r.res.status, r.res.error, labels(r.calls), replyFor(r.calls, 'push and reply r1', 'R1-1'), r.res.rounds.map((round) => round.reviewed)]
  const strayFilled = await go('filing: the resolve agent returns a filled entry beside a call it states as a fix', { ...baseArgs, decisions: typedAnswer('R1-1') }, strayScenario)
  check('filing: a filled entry beside a call stated as a fix files nothing, and the fix is posted and counted as one', postedAsFix(strayFilled), fixDetail(strayFilled))
  check('filing: a filled entry beside a call stated as a fix is dropped with a warning, and neither the plan approver nor the implementer is shown it', entryDropped(strayFilled), [shownTo(strayFilled).map((p) => p.includes('"title": "Lock R1-1"')), strayFilled.res.warnings])
  // The same with the reply pinned whole (#99): a guided run whose call is answered raises no
  // draft for the dropped entry, so the round goes on with no stop and no answer for one.
  const fixCall = { 'R1-1': { choice: 'Change it', notes: 'Fix it now.', date: '2026-11-18' } }
  const strayFilledGuided = await go('filing: a filled entry beside a call stated as a fix, on the guided dial', { ...baseArgs, decisions: fixCall }, strayScenario)
  check('filing: on the guided dial a filled entry beside a call stated as a fix raises no draft and files nothing', strayFilledGuided.res.status === 'done' && !labels(strayFilledGuided.calls).includes('file deferred r1') && replyFor(strayFilledGuided.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Fix it now. Applied in 1bbbbbb (redline: R1-1 fix). · decided by: @author', [strayFilledGuided.res.status, strayFilledGuided.res.handoffKind, labels(strayFilledGuided.calls), replyFor(strayFilledGuided.calls, 'push and reply r1', 'R1-1')])
  // The fix is demanded by the check whatever entry stands beside it (#99): left unbuilt, the
  // round stops at the check after its repair and files nothing. Until #99 the filled entry made
  // it a deferral, whose commit is never demanded (#100), so the round passed with a warning.
  const strayFilledUnbuilt = await go('filing: a filled entry beside a call stated as a fix, the fix left out', { ...baseArgs, decisions: typedAnswer('R1-1') }, { ...strayScenario, commitIds: [[], []] })
  check('filing: a call stated as a fix is demanded beside a filled entry: left unbuilt, the round stops at the check after its repair and files nothing', strayFilledUnbuilt.res.status === 'error' && strayFilledUnbuilt.res.stage === 'check' && (strayFilledUnbuilt.res.error || '').includes('no commit names R1-1') && labels(strayFilledUnbuilt.calls).includes('repair r1') && !labels(strayFilledUnbuilt.calls).includes('file deferred r1'), [strayFilledUnbuilt.res.status, strayFilledUnbuilt.res.stage, strayFilledUnbuilt.res.error, labels(strayFilledUnbuilt.calls).slice(-6)])
  // Pin 2 of #99: a fix beside a stray empty entry. It filed nothing before #99 either (#97,
  // R1-10), by the emptiness of the field, but the entry stayed in the list the plan approver and
  // the implementer were shown, and no warning said so.
  const strayResolve = await go('filing: the resolve agent returns an empty entry beside a call it states as a fix', { ...baseArgs, decisions: typedAnswer('R1-1') }, { ...strayScenario, resolveDeferred: [{ ...strayEntry, mitigation: '' }] })
  check('filing: an empty entry beside a call stated as a fix files nothing, and the fix is posted and counted as one', postedAsFix(strayResolve), fixDetail(strayResolve))
  check('filing: an empty entry beside a call stated as a fix is dropped with a warning, and neither the plan approver nor the implementer is shown it', entryDropped(strayResolve), [shownTo(strayResolve).map((p) => p.includes('"title": "Lock R1-1"')), strayResolve.res.warnings])
  // What is stated decides, whatever the entry says (#99): an entry worded `none` beside a planned
  // task, with a deferral stated, is the decision's deferral, filed and posted as applied. Until
  // #99 it was filed because its field was filled (#100). `strayFilled` above is its twin, a
  // filled entry beside the same task with a fix stated, which files nothing.
  const strayWorded = await go('filing: the resolve agent returns an entry worded none beside a call it states as a deferral', { ...baseArgs, decisions: typedAnswer('R1-1'), deferrals: goAhead('R1-1') }, { ...strayScenario, resolveDeferred: [{ ...strayEntry, mitigation: 'none' }], resolveDecided: { 'R1-1': 'defer' } })
  check('filing: an entry worded none beside a call stated as a deferral is the decision\'s deferral, whatever its words: filed and posted as applied', strayWorded.res.status === 'done' && labels(strayWorded.calls).includes('file deferred r1') && (replyFor(strayWorded.calls, 'push and reply r1', 'R1-1') || '').includes(' Applied in ') && (replyFor(strayWorded.calls, 'push and reply r1', 'R1-1') || '').includes('Deferred to #301.') && !(strayWorded.res.warnings || []).some((w) => w.includes('the entry is dropped')), [strayWorded.res.status, labels(strayWorded.calls), replyFor(strayWorded.calls, 'push and reply r1', 'R1-1'), strayWorded.res.warnings])
  // Every call the resolve applied has its statement (#99): one left out is a result the run
  // cannot use, so the round stops at resolve, where a resume reruns the agent.
  const unstated = await go('filing: the resolve agent states no disposition for a call it applied', { ...baseArgs, decisions: typedAnswer('R1-1') }, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'], resolveUnstated: ['R1-1'], commitIds: [['R1-1']] })
  check('filing: a call with no stated disposition stops at resolve, resumable there, before the plan approver', unstated.res.status === 'error' && unstated.res.stage === 'resolve' && unstated.res.error === 'the resolve agent stated no disposition for R1-1, a judgment call it applied; a call\'s decision is read from what it states (fix, defer or accept)' && Boolean(unstated.res.resumeFrom) && unstated.res.resumeFrom.label === 'resolve r1' && !labels(unstated.calls).includes('plan approver r1'), [unstated.res.status, unstated.res.stage, unstated.res.error, unstated.res.resumeFrom, labels(unstated.calls).slice(-3)])
  // One statement a call (#99): the first the agent returned, as for a deferred entry (#97,
  // R2-12). Here the first says fix and the second defer, so the entry is dropped and nothing filed.
  const statedTwice = await go('filing: the resolve agent states two dispositions for one call', { ...baseArgs, decisions: typedAnswer('R1-1') }, { ...strayScenario, resolveDecidedTwice: { 'R1-1': 'defer' } })
  check('filing: of two statements for one call the first is kept, with a warning', postedAsFix(statedTwice) && (statedTwice.res.warnings || []).includes('round 1: the resolve agent stated a disposition for R1-1 more than once; the first is kept'), [fixDetail(statedTwice), statedTwice.res.warnings])
  // A value outside the three is no statement (#99): the schema refuses one in the agent's own
  // run, and the workflow's test is the second layer, as for a judgment call's reason.
  const misstated = await go('filing: the resolve agent states a disposition the workflow does not know', { ...baseArgs, decisions: typedAnswer('R1-1') }, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'], resolveDecided: { 'R1-1': 'mitigate' }, commitIds: [['R1-1']] })
  check('filing: a stated disposition outside fix, defer and accept is no statement, so the round stops at resolve', misstated.res.status === 'error' && misstated.res.stage === 'resolve' && (misstated.res.error || '').startsWith('the resolve agent stated no disposition for R1-1') && Boolean(misstated.res.resumeFrom) && misstated.res.resumeFrom.label === 'resolve r1', [misstated.res.status, misstated.res.stage, misstated.res.error, misstated.res.resumeFrom])
  // One statement a call is the first returned, whatever it holds (#108, R3-3; the spec's
  // decisions 12 and 20): a first statement outside the three is no statement, so the round stops
  // at resolve even with a valid second one beside it. `statedTwice` above is the neighbour, two
  // valid statements, the first kept.
  const misstatedFirst = await go('filing: the resolve agent states a disposition the workflow does not know, then a fix, for one call', { ...baseArgs, decisions: typedAnswer('R1-1') }, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'], resolveDecided: { 'R1-1': 'mitigate' }, resolveDecidedTwice: { 'R1-1': 'fix' }, commitIds: [['R1-1']] })
  check('filing: of two statements for one call the first is kept even when it is outside the three, so the round stops at resolve', (misstatedFirst.res || {}).status === 'error' && misstatedFirst.res.stage === 'resolve' && (misstatedFirst.res.error || '').startsWith('the resolve agent stated no disposition for R1-1') && Boolean(misstatedFirst.res.resumeFrom) && misstatedFirst.res.resumeFrom.label === 'resolve r1', [(misstatedFirst.res || {}).status, (misstatedFirst.res || {}).stage, (misstatedFirst.res || {}).error])
  // A call's decision that names a disposition itself decides, as an override's does (#103,
  // R1-11), so no statement is asked of it (#99): the round goes on without one, and the fix it
  // names is demanded and posted.
  const namedCall = await go('filing: a call whose decision names its own disposition, with no statement', { ...baseArgs, decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-18', disposition: 'fix' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], commitIds: [['R1-1']] })
  check('filing: a call whose decision names its disposition needs no statement, and its fix is posted as applied', namedCall.res.status === 'done' && replyFor(namedCall.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Fix it in full. Applied in 1bbbbbb (redline: R1-1 fix). · decided by: @author', [namedCall.res.status, namedCall.res.stage, namedCall.res.error, replyFor(namedCall.calls, 'push and reply r1', 'R1-1')])
  const namedUnbuilt = await go('filing: a call whose decision names its own disposition, the fix left out', { ...baseArgs, decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-18', disposition: 'fix' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], commitIds: [[], []] })
  check('filing: a call whose decision names a fix is demanded: left unbuilt, the round stops at the check', namedUnbuilt.res.status === 'error' && namedUnbuilt.res.stage === 'check' && (namedUnbuilt.res.error || '').includes('no commit names R1-1'), [namedUnbuilt.res.status, namedUnbuilt.res.stage, namedUnbuilt.res.error])
  // A call whose decision names its own disposition is asked for no statement (#108, R1-2), as
  // a call left to the person under a rule is not: the prompt says so only when a call carries
  // one (`callResolve` below holds no such sentence), and the agent file says it too.
  const NAMED_EXEMPT = 'A call whose decision carries `disposition` names its own and has no entry in decided.'
  const namedResolve = (pick(namedCall.calls, 'resolve r1') || { prompt: '' }).prompt
  check('filing: the resolve prompt says a call whose decision names its own disposition has no entry in decided', namedResolve.includes(NAMED_EXEMPT), namedResolve.slice(-1500))
  check('filing: the resolve agent\'s file says a call whose decision carries a disposition has no entry in decided', fs.readFileSync(path.join(here, '..', 'agents', 'redline-resolve.md'), 'utf8').includes('and so does a call whose decision carries `disposition`'))
  // A stray entry beside a call whose decision names its own disposition is dropped as one beside
  // an override is, and its warning says whose decision it is (#108, R2-3): the call was never a
  // deferral the person changed away from. The override's own wording is pinned by
  // `overrideBuilt` below.
  const namedStray = await go('filing: a stray entry beside a call whose decision names a fix', { ...baseArgs, decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-18', disposition: 'fix' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], resolveDeferred: [{ id: 'R1-1', mitigation: 'a guard', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }], commitIds: [['R1-1']] })
  check('filing: a stray entry beside a call whose decision names a fix is warned as that call\'s, never as one the person changed away from defer', (namedStray.res.warnings || []).includes('round 1: the resolve agent listed R1-1 as deferred, a call whose decision names it as fix; the entry is dropped, since the decision stands') && !(namedStray.res.warnings || []).some((w) => w.includes('changed away from defer')), [namedStray.res.status, namedStray.res.warnings])
  // What is stated is checked against what the same resolve returned, before anything is built,
  // filed or posted (#99): a statement its own tasks and entries cannot support is a result the
  // run cannot use, so the round stops at resolve, where a resume reruns the agent. Three ways: a
  // deferral with no deferred entry, as a defer override with none stops (#97, R2-13); a fix with
  // no task with files; and an accept beside a task with files, which the implementer would
  // build. Their neighbours run on: `chosenBare` below (a deferral with its entry and no task),
  // `acceptedResorted` below (an accept with no files) and `strayFilled` above (a fix with files).
  const stopsAtResolve = (r, error) => r.res.status === 'error' && r.res.stage === 'resolve' && r.res.error === error && Boolean(r.res.resumeFrom) && r.res.resumeFrom.label === 'resolve r1' && !labels(r.calls).includes('plan approver r1')
  const stopDetail = (r) => [r.res.status, r.res.stage, r.res.error, r.res.resumeFrom, labels(r.calls).slice(-3)]
  const oneCall = { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'], commitIds: [['R1-1']] }
  const deferNoEntry = await go('filing: the resolve agent states a deferral and returns no deferred entry', { ...baseArgs, decisions: typedAnswer('R1-1') }, { ...oneCall, resolveDecided: { 'R1-1': 'defer' } })
  check('filing: a call stated as a deferral with no deferred entry stops at resolve, resumable there, before the plan approver', stopsAtResolve(deferNoEntry, 'the resolve agent stated defer for R1-1 with no deferred entry; a deferred item always carries a drafted issue'), stopDetail(deferNoEntry))
  const fixNoFiles = await go('filing: the resolve agent states a fix and plans no task with files', { ...baseArgs, decisions: typedAnswer('R1-1') }, { ...oneCall, acceptedCalls: ['R1-1'], resolveDecided: { 'R1-1': 'fix' } })
  check('filing: a call stated as a fix with no task with files stops at resolve, resumable there, before the plan approver', stopsAtResolve(fixNoFiles, 'the resolve agent stated fix for R1-1 with no task with files; a fix names the files it changes'), stopDetail(fixNoFiles))
  // The files are those of the finding's own task: another call's task with files, in the same
  // resolve, does not stand in for it.
  const fixNoFilesBeside = await go('filing: the resolve agent states a fix with no task with files, beside another call\'s task', { ...baseArgs, decisions: typedAnswer('R1-1', 'R1-2') }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')]], ask: ['R1-1', 'R1-2'], acceptedCalls: ['R1-1'], resolveDecided: { 'R1-1': 'fix' }, commitIds: [['R1-1', 'R1-2']] })
  check('filing: a call stated as a fix is held to its own task\'s files, whatever another call\'s task lists', stopsAtResolve(fixNoFilesBeside, 'the resolve agent stated fix for R1-1 with no task with files; a fix names the files it changes'), stopDetail(fixNoFilesBeside))
  // A blank path is no file at the resolve-time check either (#114, R1-6): it reads the task's
  // files through the same cleanup as the list the round keeps.
  const fixBlankFile = await go('filing: the resolve agent states a fix and plans a task whose only file is blank', { ...baseArgs, decisions: typedAnswer('R1-1') }, { ...oneCall, resolveDecided: { 'R1-1': 'fix' }, resolveFiles: { 'R1-1': [''] } })
  check('filing: a call stated as a fix whose task lists only a blank path stops at resolve, as one with no task with files does', stopsAtResolve(fixBlankFile, 'the resolve agent stated fix for R1-1 with no task with files; a fix names the files it changes'), stopDetail(fixBlankFile))
  const acceptWithFiles = await go('filing: the resolve agent states an accept and plans a task with files', { ...baseArgs, decisions: typedAnswer('R1-1') }, { ...oneCall, resolveDecided: { 'R1-1': 'accept' } })
  check('filing: a call stated as accepted beside a task with files stops at resolve, resumable there, before the plan approver', stopsAtResolve(acceptWithFiles, 'the resolve agent stated accept beside a task with files for R1-1 (app/x.php); an accepted finding changes nothing'), stopDetail(acceptWithFiles))
  // A decision that names its own disposition is held to the same three checks, by what it names
  // (#108, R1-5): until #108 only a defer override was, by its entry. A call whose decision names
  // a deferral and comes back with no deferred entry, a decline the person overrules to a fix
  // planned with no task with files, and a fix the person changes to accept planned beside a task
  // with files each stop at resolve before the plan approver. Their neighbours run on: `namedCall`
  // above (a named fix with files), `fixAccepted` (an accept override with no files), and the
  // shaper's own deferral below, which stands in for a defer override's entry as before.
  const deferNamed = { 'R1-1': { choice: 'defer', notes: 'Defer it behind a log line.', date: '2026-11-18', disposition: 'defer' } }
  const namedDeferNoEntry = await go('filing: a call whose decision names a deferral, with no deferred entry', { ...baseArgs, decisions: deferNamed }, oneCall)
  check('filing: a call whose decision names a deferral with no deferred entry stops at resolve, resumable there, before the plan approver', stopsAtResolve(namedDeferNoEntry, 'the resolve agent returned no deferred entry for R1-1, which its decision deferred; a deferred item always carries a drafted issue'), stopDetail(namedDeferNoEntry))
  const fixOverrideNoFiles = await go('filing: a decline the person overrules to a fix, planned with no task with files', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-18', disposition: 'fix' } } }, { reviews: [[f('R1-1', 'correctness')]], decline: ['R1-1'], resolveFiles: { 'R1-1': [] }, commitIds: [['R1-1']] })
  check('filing: an override to fix planned with no task with files stops at resolve, resumable there, before the plan approver', stopsAtResolve(fixOverrideNoFiles, 'the resolve agent planned no task with files for R1-1, which a disposition override names as a fix; a fix names the files it changes'), stopDetail(fixOverrideNoFiles))
  const acceptOverrideWithFiles = await go('filing: a fix the person changes to accept, planned with a task with files', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: { 'R1-1': { choice: 'accept', notes: 'Keep it as it is.', date: '2026-11-18', disposition: 'accept' } } }, { reviews: [[f('R1-1', 'correctness')]], resolveFiles: { 'R1-1': ['app/x.php'] }, commitIds: [[]] })
  check('filing: an override to accept planned beside a task with files stops at resolve, resumable there, before the plan approver', stopsAtResolve(acceptOverrideWithFiles, 'the resolve agent planned a task with files for R1-1 (app/x.php), which a disposition override names as accepted; an accepted finding changes nothing'), stopDetail(acceptOverrideWithFiles))
  const restatedBare = await go('filing: a defer override on the shaper\'s own deferral, with no entry from the resolve agent', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: deferNamed, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], commitIds: [['R1-1']] })
  check('filing: a defer override whose entry the round already holds from the shaper runs on past resolve with no entry of its own', !(restatedBare.res.status === 'error' && restatedBare.res.stage === 'resolve') && labels(restatedBare.calls).includes('plan approver r1'), stopDetail(restatedBare))
  // A call stated as a fix that a reshape then leaves to the person under a rule is not
  // demanded (#108, R1-8), as the clause the statement replaced had it: the finding is posted
  // as left to the person. Its neighbour, a call stated as a fix and not forced, is demanded
  // (`strayFilledUnbuilt` above).
  const billingRule = [{ id: 'billing', when: { prose: 'the change alters what a customer is charged' }, reason: 'Billing changes are reviewed by finance' }]
  const forcedLater = await go('filing: a call stated as a fix that a reshape leaves to the person under a rule, the fix left out', { ...baseArgs, askRules: billingRule, decisions: { 'R1-1': { choice: 'Change it', notes: 'Fix it now.', date: '2026-11-18' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeAskRule: { 'R1-1': 'billing' }, commitIds: [[], []] })
  const forcedReply = replyFor(forcedLater.calls, 'push and reply r1', 'R1-1')
  check('filing: a call stated as a fix that a reshape leaves to the person under a rule is not demanded, so the round finishes with no repair', forcedLater.res.status === 'done' && !labels(forcedLater.calls).includes('repair r1'), [forcedLater.res.status, forcedLater.res.stage, forcedLater.res.error, labels(forcedLater.calls).slice(-6)])
  check('filing: that call is posted as left to the person under the rule', forcedReply.startsWith('Redline round 1: left to @author under repository rule billing'), forcedReply)
  // The same holds for a call whose decision names its own fix (#108, R2-5): no statement is
  // asked of it, so it is demanded through its final disposition, and a reshape that leaves it
  // to the person under a rule after its resolve takes it out of the demand as well.
  const forcedNamed = await go('filing: a call whose decision names a fix that a reshape leaves to the person under a rule, the fix left out', { ...baseArgs, askRules: billingRule, decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-18', disposition: 'fix' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeAskRule: { 'R1-1': 'billing' }, commitIds: [[], []] })
  const forcedNamedReply = replyFor(forcedNamed.calls, 'push and reply r1', 'R1-1')
  check('filing: a call whose decision names a fix that a reshape leaves to the person under a rule is not demanded, so the round finishes with no repair', forcedNamed.res.status === 'done' && !labels(forcedNamed.calls).includes('repair r1'), [forcedNamed.res.status, forcedNamed.res.stage, forcedNamed.res.error, labels(forcedNamed.calls).slice(-6)])
  check('filing: that named call is posted as left to the person under the rule', forcedNamedReply.startsWith('Redline round 1: left to @author under repository rule billing'), forcedNamedReply)
  // The resolve prompt of a run with a call asks for the statement and keeps the rule for when a
  // deferred entry is returned (#97, R2-15; #99), and the resolve agent's file asks as the prompt
  // does. A resolve with overrides and no call is asked for neither, so its prompt is the one it
  // had before #99, and a result recorded before it can replay with no `decided` list: the list
  // is read as empty, and nothing is needed from it, since no call was applied.
  const ENDS_IN = 'each call\'s decision ends in'
  const ENTRY_RULE = 'return a deferred entry for a call only when its decision defers the finding'
  const callResolve = pick(strayResolve.calls, 'resolve r1') || { prompt: '', opts: {} }
  const overridePrompt = (pick(chosen.calls, 'resolve r1') || { prompt: '' }).prompt
  check('filing: the resolve prompt of a run with a call asks for each call\'s disposition and says an entry is returned only for a decision that defers', callResolve.prompt.includes(`State in decided what ${ENDS_IN}`) && callResolve.prompt.includes(ENTRY_RULE) && !callResolve.prompt.includes('has no entry in decided'), callResolve.prompt.slice(-2400))
  check('filing: the resolve agent\'s schema requires the decided list', (((callResolve.opts || {}).schema || {}).required || []).includes('decided'), ((callResolve.opts || {}).schema || {}).required)
  check('filing: the resolve agent\'s file asks for each call\'s disposition, as the prompt does', fs.readFileSync(path.join(here, '..', 'agents', 'redline-resolve.md'), 'utf8').includes(ENDS_IN))
  check('filing: the resolve prompt of a run with overrides and no call asks for no disposition', overridePrompt !== '' && !overridePrompt.includes(ENDS_IN) && !overridePrompt.includes(ENTRY_RULE), overridePrompt.slice(-1500))
  // An override's fix is held to the files of a task whose finding is its own id (namedUnplanned),
  // so the agent file says so; the overrides prompt stays as it was, so an overrides-only resolve
  // still replays after an update (#108, R4-9; the spec's decision 13).
  check('filing: the resolve agent\'s file asks for a task of its own for an override\'s fix', fs.readFileSync(path.join(here, '..', 'agents', 'redline-resolve.md'), 'utf8').includes('`fix` plans the full fix as a task of its own, its `finding` set to the override\'s id (files by path, the change, the test)'))
  // A call stated as a fix is held to the files of its own task (`fixNoFilesBeside` above), so the
  // ask says each has a task of its own, its finding the call's id, in the prompt and in the agent
  // file (#108, R2-4).
  check('filing: the resolve prompt asks for a task of its own for each call stated as a fix', callResolve.prompt.includes('(a task of its own, its finding set to the call\'s id, names its files, and the check demands its commit;'), callResolve.prompt.slice(-2400))
  check('filing: the resolve agent\'s file asks for a task of its own for each call stated as a fix, as the prompt does', fs.readFileSync(path.join(here, '..', 'agents', 'redline-resolve.md'), 'utf8').includes('(a task of its own, its `finding` set to the call\'s id, names its files, and the check demands its commit)'))
  const noDecided = await go('filing: a resolve with overrides and no call returns no decided list', { ...filedArgs, interrupt: 'plan', approvedPlans: [1], decisions: { 'R1-1': { choice: 'defer', notes: 'Defer it behind a log line.', date: '2026-11-16', disposition: 'defer' } } }, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']], resolveDeferred: [{ id: 'R1-1', mitigation: 'a log line', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }], resolveNoDecided: true })
  check('filing: a resolve with overrides only and no decided list ends as it does with one', noDecided.res.status === 'done' && labels(noDecided.calls).join(' | ') === labels(chosen.calls).join(' | ') && replyFor(noDecided.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Defer it behind a log line. Applied in 1bbbbbb (redline: R1-1 fix). Deferred to #301. · decided by: @author', [noDecided.res.status, noDecided.res.error, labels(noDecided.calls), replyFor(noDecided.calls, 'push and reply r1', 'R1-1')])
  // A reshape's entry beside a decided call never makes it a deferral (#97, R1-10): no draft is
  // raised, nothing is filed, and the fix is posted as the person's.
  const strayReshape = await go('filing: a reshape defers a decided call\'s finding, shipping nothing', { ...baseArgs, decisions: { 'R1-1': { choice: 'Change it', notes: 'Fix it now.', date: '2026-11-16' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeDefer: ['R1-1'], mitigations: { 'R1-1': '' }, commitIds: [['R1-1']] })
  check('filing: a reshape\'s entry beside a decided call raises no draft and files nothing, and the fix is posted as the person\'s', strayReshape.res.status === 'done' && !labels(strayReshape.calls).includes('file deferred r1') && replyFor(strayReshape.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Fix it now. Applied in 1bbbbbb (redline: R1-1 fix). · decided by: @author' && (strayReshape.res.rounds[1] || {}).reviewed === 'fix-diff', [strayReshape.res.status, strayReshape.res.handoffKind, labels(strayReshape.calls), replyFor(strayReshape.calls, 'push and reply r1', 'R1-1')])
  // A decided call a reshape re-sorts to defer is no deferral (#97, R1-10), so its planned fix is
  // still demanded (#103, R1-10): left unbuilt, the round stops at the check after its repair, as
  // on the base branch, and files nothing. The run above, with its commit, is the neighbour.
  const strayReshapeUnbuilt = await go('filing: a reshape defers a decided call\'s finding, and the fix is left out', { ...baseArgs, decisions: { 'R1-1': { choice: 'Change it', notes: 'Fix it now.', date: '2026-11-16' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeDefer: ['R1-1'], mitigations: { 'R1-1': '' }, commitIds: [[], []] })
  check('filing: a decided call\'s fix that a reshape re-sorted to defer is still demanded: left unbuilt, the round stops at the check after its repair and files nothing', strayReshapeUnbuilt.res.status === 'error' && strayReshapeUnbuilt.res.stage === 'check' && (strayReshapeUnbuilt.res.error || '').includes('no commit names R1-1') && labels(strayReshapeUnbuilt.calls).includes('repair r1') && !labels(strayReshapeUnbuilt.calls).includes('file deferred r1'), [strayReshapeUnbuilt.res.status, strayReshapeUnbuilt.res.stage, strayReshapeUnbuilt.res.error, labels(strayReshapeUnbuilt.calls).slice(-6)])
  // An override names its disposition, and that decides (#103, R1-11): a filled entry the resolve
  // agent returns beside an override to fix is no deferral, so the fix is demanded and nothing is
  // filed. The neighbours that must not change: `chosen` above, a defer override filed, and
  // `overrideAccepted` below, an accept override beside the same entry, which files nothing
  // (#103, R2-2).
  const fixOverride = { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-17', disposition: 'fix' } }
  const strayOverrideEntry = { id: 'R1-1', mitigation: 'a guard', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }
  const overrideArgs = { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: fixOverride, deferrals: goAhead('R1-1') }
  const overrideUnbuilt = await go('filing: a deferral the person changes to a fix, beside a filled resolve entry, the fix left out', overrideArgs, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], resolveDeferred: [strayOverrideEntry], commitIds: [[], []] })
  check('filing: an override to fix beside a filled resolve entry is still demanded: left unbuilt, the round stops at the check after its repair and files nothing', overrideUnbuilt.res.status === 'error' && overrideUnbuilt.res.stage === 'check' && (overrideUnbuilt.res.error || '').includes('no commit names R1-1') && labels(overrideUnbuilt.calls).includes('repair r1') && !labels(overrideUnbuilt.calls).includes('file deferred r1'), [overrideUnbuilt.res.status, overrideUnbuilt.res.stage, overrideUnbuilt.res.error, labels(overrideUnbuilt.calls).slice(-6)])
  const overrideBuilt = await go('filing: a deferral the person changes to a fix, beside a filled resolve entry, the fix built', overrideArgs, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], resolveDeferred: [strayOverrideEntry], commitIds: [['R1-1']] })
  check('filing: an override to fix beside a filled resolve entry files nothing and is posted as applied', overrideBuilt.res.status === 'done' && !labels(overrideBuilt.calls).includes('file deferred r1') && (overrideBuilt.res.deferred || []).length === 0 && replyFor(overrideBuilt.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Fix it in full. Applied in 1bbbbbb (redline: R1-1 fix). · decided by: @author', [overrideBuilt.res.status, overrideBuilt.res.error, labels(overrideBuilt.calls).slice(-8), replyFor(overrideBuilt.calls, 'push and reply r1', 'R1-1')])
  // An override to fix or accept leaves no deferral behind in any list an agent is shown (#103,
  // R2-8): the resolve agent's entry beside it is dropped with a warning, so neither the plan
  // approver nor the implementer is shown it. A prompt that is absent reads as '' and fails.
  const shownStray = ['plan approver r1', 'implement r1'].map((label) => (pick(overrideBuilt.calls, label) || { prompt: '' }).prompt)
  check('filing: the resolve agent\'s entry beside an override to fix is dropped with a warning, and neither the plan approver nor the implementer is shown it', shownStray.every((p) => p !== '' && !p.includes('"mitigation": "a guard"')) && (overrideBuilt.res.warnings || []).includes('round 1: the resolve agent listed R1-1 as deferred, a finding whose disposition the person changed to fix; the entry is dropped, since the decision stands'), [shownStray.map((p) => p.includes('"mitigation": "a guard"')), overrideBuilt.res.warnings])
  // The accept half of R1-11's rule (#103, R2-2): an override to accept beside a filled entry the
  // resolve agent returns is no deferral either, so nothing is filed or listed as deferred, and the
  // reply is the person's decision with no code change.
  const acceptOverride = { 'R1-1': { choice: 'accept', notes: 'Keep it as it is.', date: '2026-11-17', disposition: 'accept' } }
  const overrideAccepted = await go('filing: a deferral the person changes to accept, beside a filled resolve entry', { ...overrideArgs, decisions: acceptOverride }, { reviews: [[f('R1-1', 'correctness')]], defer: ['R1-1'], resolveDeferred: [strayOverrideEntry], commitIds: [[]] })
  check('filing: an override to accept beside a filled resolve entry files nothing, lists nothing as deferred and is posted as kept with no code change', overrideAccepted.res.status === 'done' && !labels(overrideAccepted.calls).includes('file deferred r1') && (overrideAccepted.res.deferred || []).length === 0 && replyFor(overrideAccepted.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Keep it as it is. No code change. · decided by: @author', [overrideAccepted.res.status, overrideAccepted.res.error, labels(overrideAccepted.calls).slice(-8), replyFor(overrideAccepted.calls, 'push and reply r1', 'R1-1')])
  // An override's stray warning names the disposition the person changed the finding to, since
  // an override need not have been a deferral (#108, R3-5): here the shaper declined the finding
  // and the person overruled it to a fix.
  const declineStray = await go('filing: a decline the person overrules to a fix, beside a filled resolve entry', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: fixOverride }, { reviews: [[f('R1-1', 'correctness')], []], decline: ['R1-1'], resolveDeferred: [strayOverrideEntry], commitIds: [['R1-1']] })
  check('filing: a stray entry beside a decline overruled to a fix is warned with the disposition the person chose, never as a change away from defer', ((declineStray.res || {}).warnings || []).includes('round 1: the resolve agent listed R1-1 as deferred, a finding whose disposition the person changed to fix; the entry is dropped, since the decision stands') && !((declineStray.res || {}).warnings || []).some((w) => w.includes('changed away from defer')), [(declineStray.res || {}).status, (declineStray.res || {}).warnings])
  // A reshape that restates a deferral the person chose is not held to a draft of its own (#97,
  // R3-4): the decision's entry carries the resolve agent's draft, so a short one in the
  // restatement stops nothing.
  const mitigateCall = { 'R1-1': { choice: 'Mitigate', notes: 'The author ships a guard now.', date: '2026-11-16' } }
  const chosenEntry = { id: 'R1-1', mitigation: 'a guard', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }
  const shortReshape = await go('filing: a reshape restates a deferral the person chose, its draft short', { ...baseArgs, interrupt: 'autopilot', decisions: mitigateCall }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeDefer: ['R1-1'], reshapeDrafts: { 'R1-1': { found: '' } }, resolveDeferred: [chosenEntry], commitIds: [['R1-1']] })
  check('filing: a reshape that restates a decided deferral with a short draft does not stop the round, and the deferral is filed', shortReshape.res.status === 'done' && labels(shortReshape.calls).includes('reshape r1 #1') && labels(shortReshape.calls).includes('file deferred r1'), [shortReshape.res.status, shortReshape.res.stage, shortReshape.res.error])
  // The person's deferral stands through a reshape (#97, R3-6): a reshape that restates it with
  // another mitigation or another draft has its entry dropped, with a warning, and the resolve
  // agent's entry is the one filed and posted.
  check('filing: the reshape prompt asks for every finding\'s files', (pick(strayReshape.calls, 'reshape r1 #1') || { prompt: '' }).prompt.includes(FILES_ASKED), (pick(strayReshape.calls, 'reshape r1 #1') || { prompt: '' }).prompt.slice(-900))
  const restated = await go('filing: a reshape restates a deferral the person chose, shipping nothing and with another draft', { ...baseArgs, interrupt: 'autopilot', decisions: mitigateCall }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeDefer: ['R1-1'], mitigations: { 'R1-1': '' }, reshapeDrafts: { 'R1-1': { found: 'found R1-1 by the reshape' } }, resolveDeferred: [chosenEntry], commitIds: [['R1-1']] })
  check('filing: a reshape\'s entry for a decided deferral is dropped with a warning, and the resolve agent\'s draft is filed and its reply says where it went', restated.res.status === 'done' && ((draftsOf(restated)[0] || {}).content || '').includes('\nfound R1-1\n') && replyFor(restated.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: The author ships a guard now. Applied in 1bbbbbb (redline: R1-1 fix). Deferred to #301. · decided by: @author' && (restated.res.warnings || []).includes('round 1: the reshape listed R1-1 as deferred, a finding the person or autopilot decided; the reshape\'s entry is dropped, since the decision stands'), [restated.res.status, draftsOf(restated), replyFor(restated.calls, 'push and reply r1', 'R1-1'), restated.res.warnings])
  const chosenBare = await go('filing: a call answered with a deferral that ships nothing', { ...baseArgs, decisions: { 'R1-1': { choice: 'Defer it', notes: 'Defer it; nothing ships now.', date: '2026-11-16' } }, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'], acceptedCalls: ['R1-1'], resolveDeferred: [{ id: 'R1-1', mitigation: '', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }], commitIds: [[]] })
  check('filing: a call answered with a deferral that ships nothing, with no task, is still filed as the person\'s deferral', chosenBare.res.status === 'done' && labels(chosenBare.calls).includes('file deferred r1') && replyFor(chosenBare.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Defer it; nothing ships now. No code change. Deferred to #301. · decided by: @author', [chosenBare.res.status, labels(chosenBare.calls), replyFor(chosenBare.calls, 'push and reply r1', 'R1-1')])
  // A deferral the person chose is no more demanded than Redline's own (#100): a "Mitigate" answer
  // whose task the build left out is posted as their decision with no code change, filed, and
  // warned about. The neighbour is `unbuilt` below, a decided fix, which still stops.
  const chosenUnbuilt = await go('filing: a call answered with a mitigation the build leaves out', { ...baseArgs, decisions: mitigateCall, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'], resolveDeferred: [chosenEntry], commitIds: [[]] })
  check('filing: a deferral the person chose whose mitigation is not built is a warning, never a stop, and is still filed', chosenUnbuilt.res.status === 'done' && labels(chosenUnbuilt.calls).includes('file deferred r1') && replyFor(chosenUnbuilt.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: The author ships a guard now. No code change. Deferred to #301. · decided by: @author' && (chosenUnbuilt.res.warnings || []).includes('round 1: R1-1 planned a mitigation in app/x.php and no commit of its own landed; posted as shipping nothing'), [chosenUnbuilt.res.status, chosenUnbuilt.res.stage, chosenUnbuilt.res.error, replyFor(chosenUnbuilt.calls, 'push and reply r1', 'R1-1'), chosenUnbuilt.res.warnings])
  // The commit-of-its-own warning in its decided form (#103, R1-12): a "Mitigate" answer whose
  // resolve agent planned no task with files, and whose commit is the finding's own.
  const chosenUnlisted = await go('filing: a call answered with a mitigation, no task with files, and a commit of its own', { ...baseArgs, decisions: mitigateCall, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], acceptedCalls: ['R1-1'], resolveDeferred: [chosenEntry], commitIds: [['R1-1']] })
  check('filing: a decided deferral with a commit of its own and no task with files is posted with its decision, and the warning says the resolve agent planned none', chosenUnlisted.res.status === 'done' && replyFor(chosenUnlisted.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: The author ships a guard now. Applied in 1bbbbbb (redline: R1-1 fix). Deferred to #301. · decided by: @author' && (chosenUnlisted.res.warnings || []).includes('round 1: R1-1 has a commit of its own (1bbbbbb) and the resolve agent planned no task with files for it; posted with its decision') && !(chosenUnlisted.res.warnings || []).some((w) => w.includes('the shaper listed no files')), [chosenUnlisted.res.status, chosenUnlisted.res.error, replyFor(chosenUnlisted.calls, 'push and reply r1', 'R1-1'), chosenUnlisted.res.warnings])
  // Pin 3 of #99: a real "Mitigate" answer. A filled entry, a task and its commit, with a deferral
  // stated: filed, and posted as the person's decision, applied. It ended the same way before
  // #99, by the filled field, so its red run is a mutation of the statement's reading; its twin
  // `strayFilledGuided` above is the same record with a fix stated, which files nothing.
  const mitigateAnswer = await go('filing: a call answered with a mitigation', { ...baseArgs, decisions: mitigateCall, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], resolveDeferred: [chosenEntry], resolveDecided: { 'R1-1': 'defer' }, commitIds: [['R1-1']] })
  check('filing: a call answered with a mitigation is the person\'s deferral: filed, and posted as applied', mitigateAnswer.res.status === 'done' && labels(mitigateAnswer.calls).includes('file deferred r1') && replyFor(mitigateAnswer.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: The author ships a guard now. Applied in 1bbbbbb (redline: R1-1 fix). Deferred to #301. · decided by: @author' && !(mitigateAnswer.res.warnings || []).some((w) => w.includes('the entry is dropped')), [mitigateAnswer.res.status, mitigateAnswer.res.error, labels(mitigateAnswer.calls), replyFor(mitigateAnswer.calls, 'push and reply r1', 'R1-1'), mitigateAnswer.res.warnings])
  // The same record as `strayResolve`, an empty entry beside a task with files, with a deferral
  // stated (#99): the person's deferral whatever its words say, so no commit is demanded of it
  // whatever became of its task. Here the plan is bounced and reshaped and nothing is built, the
  // path #106 names: until #99 the empty field beside a planned task read as a fix, and the round
  // stopped at the check.
  const deferCall = { 'R1-1': { choice: 'Defer it', notes: 'Defer it; nothing ships now.', date: '2026-11-18' } }
  const emptyDeferral = await go('filing: a call answered with a deferral in empty words beside a planned task, the plan bounced and nothing built', { ...baseArgs, decisions: deferCall, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'], planBounce: 1, resolveDeferred: [{ ...chosenEntry, mitigation: '' }], resolveDecided: { 'R1-1': 'defer' }, commitIds: [[]] })
  check('filing: a call stated as a deferral is never demanded, whatever its words and its task: filed, posted with no code change, and warned about', emptyDeferral.res.status === 'done' && labels(emptyDeferral.calls).includes('reshape r1 #1') && labels(emptyDeferral.calls).includes('file deferred r1') && replyFor(emptyDeferral.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Defer it; nothing ships now. No code change. Deferred to #301. · decided by: @author' && (emptyDeferral.res.warnings || []).includes('round 1: R1-1 planned a mitigation in app/x.php and no commit of its own landed; posted as shipping nothing'), [emptyDeferral.res.status, emptyDeferral.res.stage, emptyDeferral.res.error, labels(emptyDeferral.calls).slice(-6), replyFor(emptyDeferral.calls, 'push and reply r1', 'R1-1'), emptyDeferral.res.warnings])
  // An accept leaves no deferral behind either (#99): an entry beside a call stated as accepted
  // is dropped with a warning, no draft is raised, nothing is filed, and the reply is the decision
  // with no code change. The override's half of the rule is `overrideAccepted` above.
  const acceptCall = { 'R1-1': { choice: 'Keep it', notes: 'Keep it as it is.', date: '2026-11-18' } }
  const acceptBesideEntry = await go('filing: the resolve agent returns an entry beside a call it states as accepted', { ...baseArgs, decisions: acceptCall }, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'], acceptedCalls: ['R1-1'], resolveDeferred: [chosenEntry], resolveDecided: { 'R1-1': 'accept' }, commitIds: [[]] })
  check('filing: an entry beside a call stated as accepted files nothing, raises no draft and is posted as kept with no code change', acceptBesideEntry.res.status === 'done' && !labels(acceptBesideEntry.calls).includes('file deferred r1') && (acceptBesideEntry.res.deferred || []).length === 0 && replyFor(acceptBesideEntry.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Keep it as it is. No code change. · decided by: @author' && (acceptBesideEntry.res.warnings || []).includes('round 1: the resolve agent listed R1-1 as deferred and stated its decision as accept; the entry is dropped, since the statement decides'), [acceptBesideEntry.res.status, acceptBesideEntry.res.handoffKind, acceptBesideEntry.res.error, labels(acceptBesideEntry.calls).slice(-6), replyFor(acceptBesideEntry.calls, 'push and reply r1', 'R1-1'), acceptBesideEntry.res.warnings])
  // A call's decision stands whatever a reshape makes of its finding (#94, R8-6), and what the
  // check demands of it is read from the statement alone (#99): an accepted call a reshape
  // re-sorts to fix is not demanded. Until #99 the reshape's disposition demanded its commit.
  const acceptedResorted = await go('filing: a reshape re-sorts an accepted call\'s finding to fix', { ...baseArgs, decisions: acceptCall }, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'], acceptedCalls: ['R1-1'], planBounce: 1, reshapeFix: ['R1-1'], commitIds: [[]] })
  check('filing: an accepted call a reshape re-sorts to fix is not demanded: the round ends with the decision and no code change', acceptedResorted.res.status === 'done' && labels(acceptedResorted.calls).includes('reshape r1 #1') && replyFor(acceptedResorted.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Keep it as it is. No code change. · decided by: @author', [acceptedResorted.res.status, acceptedResorted.res.stage, acceptedResorted.res.error, labels(acceptedResorted.calls).slice(-6), replyFor(acceptedResorted.calls, 'push and reply r1', 'R1-1')])
  // Every resolve of the round planned tasks (#97, R2-14): a reshape that raises a call runs a
  // second resolve for that call alone, and the first resolve's tasks still count, for the task a
  // stray entry stands beside and for the commits the gate demands.
  const strayRaised = await go('filing: the resolve agent defers a call it planned as a fix, then a reshape raises a call', { ...baseArgs, decisions: typedAnswer('R1-1', 'R1-2') }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeAsk: ['R1-2'], resolveDeferred: [{ id: 'R1-1', mitigation: '', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }], resolveDecided: { 'R1-1': 'fix' }, commitIds: [['R1-1', 'R1-2']] })
  check('filing: after a reshape\'s resolve, a stray entry beside the first resolve\'s fix files nothing, and the fix is posted as applied', strayRaised.res.status === 'done' && labels(strayRaised.calls).includes('resolve r1 #1') && !labels(strayRaised.calls).includes('file deferred r1') && (replyFor(strayRaised.calls, 'push and reply r1', 'R1-1') || '').includes(' Applied in ') && !(replyFor(strayRaised.calls, 'push and reply r1', 'R1-1') || '').includes('Deferred to'), [strayRaised.res.status, labels(strayRaised.calls), replyFor(strayRaised.calls, 'push and reply r1', 'R1-1')])
  const unbuilt = await go('filing: a reshape raises a call and the first resolve\'s task is not built', { ...baseArgs, interrupt: 'autopilot' }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeAsk: ['R1-2'], commitIds: [['R1-2'], []] })
  check('filing: after a reshape\'s resolve, the gate still demands the commit of the first resolve\'s task', unbuilt.res.status === 'error' && unbuilt.res.stage === 'check' && (unbuilt.res.error || '').includes('no commit names R1-1'), [unbuilt.res.status, unbuilt.res.stage, unbuilt.res.error])

  // The cap-hit comment carries the section, since no handoff follows.
  const capped = await go('filing: a run that defers, then hits the cap', { ...filedArgs, maxRounds: 1 }, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')]], defer: ['R1-1'], commitIds: [['R1-1']] })
  check('filing: the cap-hit comment lists what the run deferred, with its number, after what is still open', capped.res.status === 'capped' && handoffOf(capped, 'cap-hit comment').includes('### Still open\n\n') && handoffOf(capped, 'cap-hit comment').endsWith('\n\n### Deferred (1)\n\n- **R1-1** title R1-1: deferred to #301; mitigated in 1bbbbbb · decided by: redline'), handoffOf(capped, 'cap-hit comment'))
  const cappedPlain = await go('filing: a run that defers nothing hits the cap', { ...filedArgs, maxRounds: 1 }, { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')]], commitIds: [['R1-1']] })
  check('filing: a cap-hit comment with nothing deferred has no such section', cappedPlain.res.status === 'capped' && !handoffOf(cappedPlain, 'cap-hit comment').includes('### Deferred'), handoffOf(cappedPlain, 'cap-hit comment'))

  // A human review pass: the author answers a comment with a deferral, which is filed into the
  // pass's own record; the summary reads what was filed, since no finding there has the kind.
  const h = { id: 'H1-1', file: 'app/x.php', line: 1, side: 'RIGHT', category: 'human', severity: 'medium', confidence: 'confirmed', title: 'comment H1-1', description: 'Please rewrite H1-1.', proposedFix: '', needsDecision: false, knownAs: '', source: '@marcamos', commentId: 900, threadId: 900, reviewId: 7 }
  const humanFolder = 'agent-os/specs/2026-10-20-1600-114-human-review-1'
  const human = await go('filing: a human pass, the author defers a comment', { ...filedArgs, firstRound: 3, decisions: { 'H1-1': { choice: 'Mitigate', notes: 'The author defers the rewrite behind a guard.', date: '2026-11-16' } }, revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: '', specFolder: humanFolder, findings: [h], commentIds: { 'H1-1': 900 }, posted: true } }, { reviews: [[]], ask: ['H1-1'], commitIds: [['H1-1'], []], resolveDeferred: [{ id: 'H1-1', mitigation: 'a guard', fullFix: 'a rewrite', title: 'Rewrite H1-1', found: 'found H1-1', why: 'why H1-1' }] })
  const [hd] = draftsOf(human, 'file deferred h1')
  check('filing: a human pass files the author\'s deferral into the pass\'s own record, naming the pass', human.res.status === 'done' && hd && hd.command === `/p/scripts/redline-gh.sh defer issue H1-1 /r/${humanFolder}/redline/issue-H1-1.md /r/${humanFolder}/redline/human-review-1-deferred.json` && hd.content.endsWith('\n\nDeferred from pull request #114 by Redline (human review 1, finding H1-1).\n'), [human.res.status, human.res.error, hd])
  check('filing: a human pass\'s reply and summary say where the deferral went', (replyFor(human.calls, 'push and reply h1', 'H1-1') || '').includes(' Deferred to #301. · decided by: @author') && handoffOf(human, 'summary comment').includes('H1-1 deferred to #301'), [replyFor(human.calls, 'push and reply h1', 'H1-1'), handoffOf(human, 'summary comment')])
  // The summary words a draft's place as the replies and the handoff do (#97, R3-7).
  const humanSpec = await go('filing: a human pass, the author defers a comment, drafts to the spec folder', { ...filedArgs, deferTo: 'spec', firstRound: 3, decisions: { 'H1-1': { choice: 'Mitigate', notes: 'The author defers the rewrite behind a guard.', date: '2026-11-16' } }, revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: '', specFolder: humanFolder, findings: [h], commentIds: { 'H1-1': 900 }, posted: true } }, { reviews: [[]], ask: ['H1-1'], commitIds: [['H1-1'], []], resolveDeferred: [{ id: 'H1-1', mitigation: 'a guard', fullFix: 'a rewrite', title: 'Rewrite H1-1', found: 'found H1-1', why: 'why H1-1' }] })
  check('filing: a human pass\'s summary gives a draft\'s place in the words the replies use', humanSpec.res.status === 'done' && handoffOf(humanSpec, 'summary comment').includes(`H1-1 deferred; the issue draft is at \`${humanFolder}/redline/issue-H1-1.md\``), [humanSpec.res.status, handoffOf(humanSpec, 'summary comment')])
}

// ---------------------------------------------------------------------------
// #95, the stops: on every dial but autopilot a deferred item's draft is raised with the person
// before it is filed. Each round (the default): at the round's stop after shaping, with its
// judgment calls, and once more for a draft that appears or changes later in the round. End of
// the run: no round stops, the deferred items' replies wait, and the run stops once before
// Finish. The answers enter as args.deferrals, read by no prompt before the stop that asked.
// ---------------------------------------------------------------------------
{
  const folder = 'agent-os/specs/2026-10-20-1600-114-review-round-1'
  const draftsOf = (r, label = 'file deferred r1') => {
    const p = (pick(r.calls, label) || { prompt: '' }).prompt
    return p.includes('Drafts, as JSON:\n[') ? JSON.parse(p.slice(p.indexOf('Drafts, as JSON:\n[') + 17, p.lastIndexOf(']') + 1)) : []
  }
  const bodyOf = (r, label = 'handoff comment') => (pick(r.calls, label) ? comment(r.calls, label) : '')
  const promptOf = (r, label) => (pick(r.calls, label) || { prompt: '' }).prompt
  const answer = (action, extra) => ({ action, title: '', notes: '', date: '2026-11-16', draft: 1, ...extra })
  const only = { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], commitIds: [['R1-1']] }

  // A round with only a deferred item stops, after shaping and before anything is planned.
  const first = await go('stop: a round with only a deferred item', baseArgs, only)
  check('stop: a round with only a deferred item stops after shaping, as a decisions hand-off with nothing to decide', first.res.status === 'handoff' && first.res.handoffKind === 'decisions' && first.res.handoffRound === 1 && labels(first.calls).join('|') === 'gather r1|review r1|post r1|shape r1|spec status r1' && JSON.stringify([first.res.judgmentCalls, first.res.decisionsNeeded, first.res.draftsNeeded]) === '[[],[],["R1-1"]]', [first.res.status, first.res.handoffKind, labels(first.calls), first.res.draftsNeeded])
  const shown = (first.res.drafts || [])[0] || {}
  check('stop: the draft is handed back as the person is shown it: the finding, what ships, where it goes, the title and body as filed, its version, and that a fix can still be built', JSON.stringify([shown.id, shown.round, shown.finding && shown.finding.file, shown.mitigation, shown.goesTo, shown.dryRun, shown.title, shown.body, shown.draft, shown.canFix]) === JSON.stringify(['R1-1', 1, 'app/x.php', 'a guard clause', 'github', false, 'Lock R1-1', 'found R1-1\n\n- **Where:** `app/x.php:1`\n- **Why it is not fixed in #114:** why R1-1\n- **Proposed fix:** a lock\n\nDeferred from pull request #114 by Redline (round 1, finding R1-1).\n', 1, true]), shown)
  // What ships is the round's record, stated in the view (#100): before the build, a task planned
  // with files. The words are shown only beside it, and decide nothing: no task, no words.
  check('stop: the draft says a mitigation ships and lists its task\'s files, from the plan', shown.ships === true && JSON.stringify(shown.files) === '["app/x.php"]', [shown.ships, shown.files])
  const shownPinned = ((await go('stop: a draft whose words say nothing ships, with no task', baseArgs, { ...only, mitigations: { 'R1-1': 'No code ships in this pull request.' }, files: { 'R1-1': [] } })).res.drafts || [])[0] || {}
  check('stop: with no task planned the draft says nothing ships and shows no words, whatever was written', JSON.stringify([shownPinned.ships, shownPinned.mitigation, shownPinned.files]) === '[false,"",[]]', shownPinned)
  const shownMirror = ((await go('stop: a draft whose words are empty, with a task', baseArgs, { ...only, mitigations: { 'R1-1': '' }, files: { 'R1-1': ['app/x.php'] } })).res.drafts || [])[0] || {}
  check('stop: with a task planned the draft says a mitigation ships and lists its files, though the words are empty', JSON.stringify([shownMirror.ships, shownMirror.mitigation, shownMirror.files]) === '[true,"",["app/x.php"]]', shownMirror)
  // The shaper's own list is read through the one path function where the shape is taken in
  // (#114, R4-4), so a blank is no file there either: a deferral listed with only a blank plans
  // nothing, at the stop and at the push. Until R4-4 the list was read as written, so [''] was a
  // planned change that ships, and the push warned of a mitigation planned in no file.
  for (const blank of ['', '  ']) {
    const shownBlank = ((await go(`stop: a draft whose task lists only ${JSON.stringify(blank)}`, baseArgs, { ...only, files: { 'R1-1': [blank] } })).res.drafts || [])[0] || {}
    check(`stop: a deferral the shaper lists with only ${JSON.stringify(blank)} plans nothing: the draft says nothing ships and lists no files`, JSON.stringify([shownBlank.ships, shownBlank.mitigation, shownBlank.files]) === '[false,"",[]]', shownBlank)
  }
  const blankFiled = await go('stop: a deferral the shaper lists with only a blank path, filed with no commit of its own', { ...baseArgs, deferrals: { 'R1-1': answer('file') } }, { ...only, files: { 'R1-1': [''] }, commitIds: [[]] })
  check('stop: a deferral listed with only a blank path is filed with no warning of a planned mitigation left unbuilt', (blankFiled.res || {}).status === 'done' && !((blankFiled.res || {}).warnings || []).some((w) => w.includes('planned a mitigation in')), [(blankFiled.res || {}).status, (blankFiled.res || {}).error, (blankFiled.res || {}).warnings])
  check('stop: the result says when drafts are raised, each round by default, and the relaunch note names the answer', first.res.deferAt === 'round' && first.res.relaunch.how.includes('deferrals ({"<id>": {"action": "file|drop"') && first.res.relaunch.how.includes('one for each id in draftsNeeded') && first.res.relaunch.how.includes('only for a draft whose canFix is true'), [first.res.deferAt, first.res.relaunch.how])
  const second = await go('stop: the relaunch files the draft', { ...baseArgs, deferrals: { 'R1-1': answer('file') } }, only)
  samePrefix('stop: the relaunch replays every prompt before the stop', first.calls, second.calls, first.calls.length)
  check('stop: on the relaunch the draft is filed and the run goes on', second.res.status === 'done' && labels(second.calls).includes('file deferred r1') && replyFor(second.calls, 'push and reply r1', 'R1-1').startsWith('Redline round 1: deferred to #301.'), [second.res.status, labels(second.calls)])
  for (const [word, goesTo, dryRun, extra] of [['spec', 'spec', false, { deferTo: 'spec' }], ['print', 'print', false, { deferTo: 'print' }], ['a dry run', 'spec', true, { postToGitHub: false }]]) {
    const where = await go(`stop: where the draft goes, ${word}`, { ...baseArgs, ...extra }, only)
    check(`stop: with ${word} the draft says where it goes`, JSON.stringify([((where.res.drafts || [])[0] || {}).goesTo, ((where.res.drafts || [])[0] || {}).dryRun]) === JSON.stringify([goesTo, dryRun]), where.res.drafts)
  }

  // A call and a draft make one stop, with the round's declines listed as at any stop before its resolve.
  const both = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness'), f('R1-3', 'nit')], []], defer: ['R1-1'], ask: ['R1-2'], decline: ['R1-3'], commitIds: [['R1-1', 'R1-2']] }
  const one = await go('stop: a call and a draft', baseArgs, both)
  check('stop: a round with a call and a draft stops once, for both, and lists its declines', one.res.status === 'handoff' && JSON.stringify([one.res.decisionsNeeded, one.res.draftsNeeded, (one.res.declined || []).map((d) => d.id), one.res.declinedAfterRun]) === '[["R1-2"],["R1-1"],["R1-3"],[]]', [one.res.decisionsNeeded, one.res.draftsNeeded, one.res.declined])
  const kept = { 'R1-2': { choice: 'Keep it', notes: 'Kept as it is, on purpose.', date: '2026-11-16' } }
  const onward = await go('stop: a call and a draft, answered', { ...baseArgs, decisions: kept, deferrals: { 'R1-1': answer('file') } }, both)
  samePrefix('stop: with a call and a draft the relaunch replays every prompt before the stop', one.calls, onward.calls, one.calls.length)
  check('stop: both answered, the round goes on with no second stop', onward.res.status === 'done' && labels(onward.calls).includes('resolve r1') && labels(onward.calls).includes('file deferred r1'), [onward.res.status, onward.res.handoffKind, labels(onward.calls)])
  const half = await go('stop: the call answered, the draft not', { ...baseArgs, decisions: kept }, both)
  check('stop: with the call answered and the draft not, the round still stops at the same point, for the draft', half.res.status === 'handoff' && labels(half.calls).join('|') === labels(one.calls).join('|') && JSON.stringify([half.res.decisionsNeeded, half.res.draftsNeeded]) === '[[],["R1-1"]]', [labels(half.calls), half.res.decisionsNeeded, half.res.draftsNeeded])

  // Drop: nothing is filed and nothing else changes, so the mitigation still ships; it is the person's decision.
  const why = '@author does not want this tracked: the client is replaced next quarter.'
  const droppedRun = await go('stop: the person drops the draft', { ...baseArgs, deferrals: { 'R1-1': answer('drop', { notes: why }) } }, only)
  check('stop: a dropped draft is not filed, its mitigation still ships and buys the round, and the reply gives the person\'s reason', droppedRun.res.status === 'done' && !labels(droppedRun.calls).some((l) => l.startsWith('file deferred')) && droppedRun.res.rounds.length === 2 && replyFor(droppedRun.calls, 'push and reply r1', 'R1-1') === `Redline round 1: ${why} No issue was opened. Mitigated in 1bbbbbb (redline: R1-1 fix). · decided by: @author`, [droppedRun.res.status, labels(droppedRun.calls), replyFor(droppedRun.calls, 'push and reply r1', 'R1-1')])
  check('stop: a dropped draft is listed as overruled by the person, never under Deferred, and the result holds no deferred item', bodyOf(droppedRun).includes(`### Overruled by @author (1)\n\n- **R1-1** title R1-1: ${why} No issue was opened. Mitigated in 1bbbbbb. · decided by: @author\n`) && !bodyOf(droppedRun).includes('### Deferred') && bodyOf(droppedRun).includes('1 item: 1 overruled by @author;') && (droppedRun.res.deferred || []).length === 0 && JSON.stringify(droppedRun.res.decided.map((d) => [d.id, d.kind, d.overruled, d.decidedBy])) === '[["R1-1","decided",true,"@author"]]', [bodyOf(droppedRun), droppedRun.res.decided])
  const droppedBare = await go('stop: the person drops a draft that ships nothing, giving no reason', { ...baseArgs, deferrals: { 'R1-1': answer('drop') } }, { reviews: [[f('R1-1', 'correctness')]], defer: ['R1-1'], mitigations: { 'R1-1': '' }, commitIds: [[]] })
  check('stop: a dropped draft with no mitigation changes nothing, and a drop with no reason says only that the person does not want it tracked', droppedBare.res.status === 'done' && droppedBare.res.rounds.length === 1 && replyFor(droppedBare.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: @author does not want this tracked. No issue was opened. · decided by: @author', [droppedBare.res.status, droppedBare.res.error, replyFor(droppedBare.calls, 'push and reply r1', 'R1-1')])

  // A title of the person's is the title filed. It is no new draft, so it moves no version, and no earlier prompt holds it.
  const titled = await go('stop: the person gives a title', { ...baseArgs, deferrals: { 'R1-1': answer('file', { title: 'Mine: lock <b> the queue' }) } }, { ...only, planBounce: 1 })
  check('stop: the person\'s title is the one filed, as written, and the result carries it', titled.res.status === 'done' && (draftsOf(titled)[0] || { content: '' }).content.startsWith('# Mine: lock <b> the queue\n\nfound R1-1\n') && ((titled.res.deferred || [])[0] || { draft: {} }).draft.title === 'Mine: lock <b> the queue', [titled.res.status, draftsOf(titled)[0], titled.res.deferred])
  check('stop: a title of the person\'s moves no version, so a reshape that leaves the draft as it was does not stop again', labels(titled.calls).includes('reshape r1 #1') && titled.res.status === 'done', [titled.res.status, labels(titled.calls)])
  check('stop: no prompt before the filing call holds the person\'s title: the plan approver and the implementer are shown the shaper\'s entry', titled.calls.filter((c) => c.label !== 'file deferred r1').every((c) => !c.prompt.includes('Mine: lock')), titled.calls.filter((c) => c.prompt.includes('Mine: lock')).map((c) => c.label))

  // Fix: the existing disposition override, planned and built in the same round, with nothing filed.
  const fixed = await go('stop: the person turns the draft back into a fix', { ...baseArgs, decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it here; the client is ours.', date: '2026-11-16', disposition: 'fix' } } }, only)
  check('stop: a draft turned back into a fix is built in the round as the person\'s decision, and nothing is filed or asked again', fixed.res.status === 'done' && labels(fixed.calls).includes('resolve r1') && !labels(fixed.calls).some((l) => l.startsWith('file deferred')) && replyFor(fixed.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Fix it here; the client is ours. Applied in 1bbbbbb (redline: R1-1 fix). · decided by: @author' && !bodyOf(fixed).includes('### Deferred') && promptOf(fixed, 'resolve r1').includes('Disposition overrides'), [fixed.res.status, labels(fixed.calls), replyFor(fixed.calls, 'push and reply r1', 'R1-1')])

  // A deferral the person chose is drafted by the resolve agent, after the stop, so its draft is
  // raised before it is filed, at a stop that takes no override and lists no declines.
  const chosenScenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness'), f('R1-3', 'nit')], []], ask: ['R1-2'], decline: ['R1-3'], commitIds: [['R1-1', 'R1-2']], resolveDeferred: [{ id: 'R1-2', mitigation: 'a guard', fullFix: 'a rewrite', title: 'Rewrite R1-2', found: 'found R1-2', why: 'why R1-2' }] }
  const mitigate = { 'R1-2': { choice: 'Mitigate', notes: 'Defer the rewrite behind a guard.', date: '2026-11-16' } }
  const chosen = await go('stop: a deferral the person chose', { ...baseArgs, decisions: mitigate }, chosenScenario)
  check('stop: a deferral the person chose is raised after the resolve that drafted it, before anything is built', chosen.res.status === 'handoff' && chosen.res.handoffKind === 'decisions' && labels(chosen.calls).join('|') === 'gather r1|review r1|post r1|shape r1|spec status r1|resolve r1' && JSON.stringify([chosen.res.draftsNeeded, chosen.res.decisionsNeeded, ((chosen.res.drafts || [])[0] || {}).title, ((chosen.res.drafts || [])[0] || {}).draft]) === '[["R1-2"],[],"Rewrite R1-2",1]', [chosen.res.status, labels(chosen.calls), chosen.res.drafts])
  check('stop: a stop after the round\'s first resolve takes no fix and lists no declines, naming them for after the run', ((chosen.res.drafts || [])[0] || {}).canFix === false && JSON.stringify([chosen.res.declined, chosen.res.declinedAfterRun]) === '[[],["R1-3"]]', [chosen.res.drafts, chosen.res.declined, chosen.res.declinedAfterRun])
  const chosenOn = await go('stop: a deferral the person chose, its draft answered', { ...baseArgs, decisions: mitigate, deferrals: { 'R1-2': answer('file') } }, chosenScenario)
  samePrefix('stop: after the second stop of a round the relaunch replays every prompt before it, the resolve included', chosen.calls, chosenOn.calls, chosen.calls.length)
  check('stop: the chosen deferral is then filed, and stays the person\'s decision', chosenOn.res.status === 'done' && replyFor(chosenOn.calls, 'push and reply r1', 'R1-2') === 'Redline round 1: Defer the rewrite behind a guard. Applied in 2bbbbbb (redline: R1-2 fix). Deferred to #301. · decided by: @author', [chosenOn.res.status, replyFor(chosenOn.calls, 'push and reply r1', 'R1-2')])
  // A drop of a deferral the person chose keeps the call's decision and its commit, then gives the
  // drop's own reason, and is listed as overruled, as a drop of Redline's deferral is (#97, R4-3).
  const chosenDropped = await go('stop: a deferral the person chose, its draft dropped', { ...baseArgs, decisions: mitigate, deferrals: { 'R1-2': answer('drop', { notes: why }) } }, chosenScenario)
  const chosenDropLine = `Defer the rewrite behind a guard. Applied in 2bbbbbb. ${why} No issue was opened. · decided by: @author`
  check('stop: a dropped draft of a deferral the person chose is not filed, and its reply gives the decision, its commit, then the drop\'s reason', chosenDropped.res.status === 'done' && !labels(chosenDropped.calls).some((l) => l.startsWith('file deferred')) && replyFor(chosenDropped.calls, 'push and reply r1', 'R1-2') === `Redline round 1: Defer the rewrite behind a guard. Applied in 2bbbbbb (redline: R1-2 fix). ${why} No issue was opened. · decided by: @author`, [chosenDropped.res.status, chosenDropped.res.error, replyFor(chosenDropped.calls, 'push and reply r1', 'R1-2')])
  check('stop: a dropped draft of a deferral the person chose is listed and counted as overruled, not as put to them', bodyOf(chosenDropped).includes(`### Overruled by @author (1)\n\n- **R1-2** title R1-2: ${chosenDropLine}\n`) && !bodyOf(chosenDropped).includes('### Put to @author') && bodyOf(chosenDropped).includes('1 overruled by @author;') && JSON.stringify(chosenDropped.res.decided.filter((d) => d.id === 'R1-2').map((d) => [d.kind, d.overruled, d.decidedBy])) === '[["decided",true,"@author"]]', [bodyOf(chosenDropped), chosenDropped.res.decided])
  const chosenDroppedBare = await go('stop: a deferral the person chose, its draft dropped with no reason', { ...baseArgs, decisions: mitigate, deferrals: { 'R1-2': answer('drop') } }, chosenScenario)
  check('stop: a drop of a deferral the person chose that gives no reason says only that the person does not want it tracked', replyFor(chosenDroppedBare.calls, 'push and reply r1', 'R1-2') === 'Redline round 1: Defer the rewrite behind a guard. Applied in 2bbbbbb (redline: R1-2 fix). @author does not want this tracked. No issue was opened. · decided by: @author', [chosenDroppedBare.res.status, chosenDroppedBare.res.error, replyFor(chosenDroppedBare.calls, 'push and reply r1', 'R1-2')])
  // The same at the end of the run: the draft waits, and its late reply and its line read the same.
  const chosenHeld = await go('end: a deferral the person chose, held to the end', { ...baseArgs, deferAt: 'end', decisions: mitigate }, chosenScenario)
  check('end: a deferral the person chose is held to the end of the run, with no reply in its round', chosenHeld.res.status === 'handoff' && chosenHeld.res.handoffKind === 'deferred' && JSON.stringify(chosenHeld.res.draftsNeeded) === '["R1-2"]' && !replies(chosenHeld.calls, 'push and reply r1').some((r) => r.finding === 'R1-2'), [chosenHeld.res.status, chosenHeld.res.handoffKind, chosenHeld.res.draftsNeeded, labels(chosenHeld.calls)])
  // At the end-of-run stop the build is over, so the draft says what shipped from the round's
  // commits (#100): a commit of the finding's own, or nothing, whatever was planned.
  const heldShown = (r) => { const d = (r.res.drafts || [])[0] || {}; return JSON.stringify([d.id, d.ships, d.mitigation, d.files]) }
  check('end: the held draft of a deferral whose commit landed says a mitigation shipped, with its words and files', heldShown(chosenHeld) === '["R1-2",true,"a guard",["app/x.php"]]', heldShown(chosenHeld))
  const chosenHeldUnbuilt = await go('end: a deferral the person chose, its mitigation not built, held to the end', { ...baseArgs, deferAt: 'end', decisions: mitigate }, { ...chosenScenario, commitIds: [['R1-1']] })
  check('end: the held draft of a deferral whose planned mitigation was not built says nothing shipped, and still lists the planned files', chosenHeldUnbuilt.res.status === 'handoff' && heldShown(chosenHeldUnbuilt) === '["R1-2",false,"",["app/x.php"]]', [chosenHeldUnbuilt.res.status, chosenHeldUnbuilt.res.error, heldShown(chosenHeldUnbuilt)])
  const chosenDroppedAtEnd = await go('end: a deferral the person chose, its draft dropped at the end', { ...baseArgs, deferAt: 'end', decisions: mitigate, deferrals: { 'R1-2': answer('drop', { notes: why }) } }, chosenScenario)
  check('end: a dropped draft of a deferral the person chose gives the drop\'s reason in its late reply and is listed as overruled', chosenDroppedAtEnd.res.status === 'done' && replyFor(chosenDroppedAtEnd.calls, 'deferred replies r1', 'R1-2') === `Redline round 1: Defer the rewrite behind a guard. Applied in 2bbbbbb (redline: R1-2 fix). ${why} No issue was opened. · decided by: @author` && bodyOf(chosenDroppedAtEnd).includes(`### Overruled by @author (1)\n\n- **R1-2** title R1-2: ${chosenDropLine}\n`) && !bodyOf(chosenDroppedAtEnd).includes('### Put to @author') && JSON.stringify(chosenDroppedAtEnd.res.decided.filter((d) => d.id === 'R1-2').map((d) => [d.kind, d.overruled])) === '[["decided",true]]', [chosenDroppedAtEnd.res.status, chosenDroppedAtEnd.res.error, replyFor(chosenDroppedAtEnd.calls, 'deferred replies r1', 'R1-2'), bodyOf(chosenDroppedAtEnd), chosenDroppedAtEnd.res.decided])

  // A reshape that changes a draft the person answered raises it once more, as its next version;
  // an answer to the later version passes the round's first stop too.
  const changed = { ...only, planBounce: 1, reshapeDrafts: { 'R1-1': { found: 'found R1-1, with the caller named' } } }
  const redrafted = await go('stop: a reshape changes an answered draft', { ...baseArgs, deferrals: { 'R1-1': answer('file') } }, changed)
  check('stop: a draft the reshape changed is raised again as version 2, with its new body, where no fix can be built', redrafted.res.status === 'handoff' && labels(redrafted.calls).slice(-2).join('|') === 'reshape r1 #1|spec status r1 #1' && JSON.stringify([redrafted.res.draftsNeeded, ((redrafted.res.drafts || [])[0] || {}).draft, ((redrafted.res.drafts || [])[0] || {}).canFix]) === '[["R1-1"],2,false]' && (((redrafted.res.drafts || [])[0] || {}).body || '').startsWith('found R1-1, with the caller named\n'), [redrafted.res.status, labels(redrafted.calls), redrafted.res.drafts])
  const redraftedOn = await go('stop: the changed draft answered', { ...baseArgs, deferrals: { 'R1-1': answer('file', { draft: 2 }) } }, changed)
  samePrefix('stop: after a reshape\'s stop the relaunch replays every prompt before it', redrafted.calls, redraftedOn.calls, redrafted.calls.length)
  check('stop: an answer to the later version passes the first stop too, and the changed draft is the one filed', redraftedOn.res.status === 'done' && (draftsOf(redraftedOn)[0] || { content: '' }).content.includes('found R1-1, with the caller named'), [redraftedOn.res.status, redraftedOn.res.handoffKind, draftsOf(redraftedOn)])
  const same = await go('stop: a reshape leaves an answered draft as it was', { ...baseArgs, deferrals: { 'R1-1': answer('file') } }, { ...only, planBounce: 1 })
  check('stop: a reshape that leaves the draft as it was does not stop again', same.res.status === 'done' && labels(same.calls).includes('reshape r1 #1'), [same.res.status, labels(same.calls)])

  // The plan dial shows the drafts in the list it already stops for: one approval answers them.
  const planArgs = { ...baseArgs, interrupt: 'plan' }
  const planned = await go('stop: the plan dial', planArgs, only)
  check('stop: the plan dial\'s stop carries the drafts, where a fix can still be built', planned.res.status === 'handoff' && planned.res.handoffKind === 'plan' && JSON.stringify([planned.res.draftsNeeded, ((planned.res.drafts || [])[0] || {}).draft, ((planned.res.drafts || [])[0] || {}).canFix]) === '[["R1-1"],1,true]', [planned.res.handoffKind, planned.res.drafts])
  const approved = await go('stop: the plan approved with its draft answered', { ...planArgs, approvedPlans: [1], deferrals: { 'R1-1': answer('file') } }, only)
  samePrefix('stop: the plan dial\'s relaunch replays every prompt before the stop', planned.calls, approved.calls, planned.calls.length)
  check('stop: an approval that answers the draft is followed by no second stop in the round', labels(approved.calls).includes('file deferred r1') && labels(approved.calls).includes('push and reply r1'), [approved.res.status, approved.res.handoffKind, labels(approved.calls)])
  const unanswered = await go('stop: the plan approved, its draft not answered', { ...planArgs, approvedPlans: [1] }, only)
  check('stop: an approval that leaves the draft unanswered stops again for it, as an unanswered ask does', unanswered.res.status === 'handoff' && unanswered.res.handoffKind === 'decisions' && JSON.stringify(unanswered.res.draftsNeeded) === '["R1-1"]', [unanswered.res.status, unanswered.res.handoffKind, unanswered.res.draftsNeeded])

  // Autopilot never asks: every draft is filed as drafted, in its round, at either setting.
  for (const at of ['round', 'end']) {
    const auto = await go(`stop: autopilot, deferred at ${at}`, { ...baseArgs, interrupt: 'autopilot', deferAt: at }, only)
    check(`stop: on autopilot, with drafts raised at ${at}, the run never stops and files each draft in its round`, auto.res.status === 'done' && labels(auto.calls).slice(10, 13).join('|') === 'check r1|file deferred r1|push and reply r1' && replyFor(auto.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: deferred to #301. Mitigated in 1bbbbbb (redline: R1-1 fix). · decided by: redline', [auto.res.status, labels(auto.calls)])
  }

  // End of the run: no round stops for a draft. Round 1 fixes one finding, which buys round 2,
  // and defers another with no mitigation. The deferred thread gets no reply yet; round 2's
  // reviewer is shown the item as deferred, from the round's record, so a candidate that matches
  // it is settled and buys nothing; the run then stops once, before anything of Finish.
  const covArgs = { ...baseArgs, deferAt: 'end', models: { ...baseArgs.models, coverage: { model: 'm-cov', effort: 'xhigh' } } }
  const candidate = 'Reviewed.\n\n```json\n' + JSON.stringify([{ file: 'app/x.php', line: 3, summary: 'the deferred one again', failure_scenario: 'f' }]) + '\n```\n'
  const ended = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], defer: ['R1-2'], mitigations: { 'R1-2': '' }, commitIds: [['R1-1']], coverage: [candidate, candidate], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }], [{ index: 1, outcome: 'settled', ref: 'R1-2' }]] }
  const held = await go('end: the rounds run, then the run stops once', covArgs, ended)
  check('end: no round stops for a draft; the run stops once, after its last round and before anything of Finish', held.res.status === 'handoff' && held.res.handoffKind === 'deferred' && held.res.handoffRound === 2 && held.res.rounds.length === 2 && labels(held.calls).slice(-1)[0] === 'post r2' && !labels(held.calls).some((l) => l === 'last round' || l.startsWith('file deferred') || l.startsWith('deferred replies')), [held.res.status, held.res.handoffKind, labels(held.calls)])
  check('end: the stop hands back every held draft with its round and version, where no fix can be built, and nothing else to decide', JSON.stringify([held.res.draftsNeeded, held.res.decisionsNeeded, held.res.judgmentCalls, ((held.res.drafts || [])[0] || {}).round, ((held.res.drafts || [])[0] || {}).draft, ((held.res.drafts || [])[0] || {}).canFix, held.res.deferAt]) === '[["R1-2"],[],[],1,1,false,"end"]', [held.res.draftsNeeded, held.res.drafts])
  check('end: the deferred item\'s thread gets no reply in its round, while the fixed one does', JSON.stringify(replies(held.calls, 'push and reply r1').map((r) => r.finding)) === '["R1-1"]', replies(held.calls, 'push and reply r1'))
  check('end: the next round\'s reviewer is shown the item as deferred, from the round\'s record, with no reply and no issue yet', promptOf(held, 're-review r2').includes('"outcome": "deferred; raised with @author at the end of the run · decided by: redline"'), promptOf(held, 're-review r2').slice(0, 3000))
  check('end: a candidate that matches the deferred item is settled, so round 2 finds nothing new and buys no round', ((held.res.rounds[1] || {}).findings || [0]).length === 0 && (((held.res.rounds[1] || {}).coverage || {}).counts || {}).settled === 1, held.res.rounds[1])
  const filedAtEnd = await go('end: the relaunch files and finishes', { ...covArgs, deferrals: { 'R1-2': answer('file') } }, ended)
  samePrefix('end: the relaunch replays every prompt of every round', held.calls, filedAtEnd.calls, held.calls.length)
  check('end: after the answer, Finish reads the highest posted round first, then files, then posts the held replies, then finishes', filedAtEnd.res.status === 'done' && labels(filedAtEnd.calls).slice(held.calls.length).join('|') === 'last round|file deferred r1|deferred replies r1|PR description|resolve threads|handoff comment|record files|record commit', labels(filedAtEnd.calls).slice(held.calls.length))
  // Filing held drafts runs inside Finish, so it is grouped there (#97, R1-11).
  check('end: the filing inside Finish is grouped under Finish', (pick(filedAtEnd.calls, 'file deferred r1') || { opts: {} }).opts.phase === 'Finish', (pick(filedAtEnd.calls, 'file deferred r1') || { opts: {} }).opts)
  // With push off the round pushed nothing, and the held replies' prompt says so (#97, R1-12).
  const unpushed = await go('end: with push off, the relaunch files and finishes', { ...covArgs, push: false, deferrals: { 'R1-2': answer('file') } }, ended)
  check('end: with push off, the held replies\' prompt says push is off, not that the round pushed', unpushed.res.status === 'done' && promptOf(unpushed, 'deferred replies r1').includes('Step 1. Do not push (push is off for this run; these are the replies its deferred items waited for).'), [unpushed.res.status, unpushed.res.error, promptOf(unpushed, 'deferred replies r1').slice(0, 600)])
  check('end: the held reply says where the item went, and is posted with no push', replyFor(filedAtEnd.calls, 'deferred replies r1', 'R1-2') === 'Redline round 1: deferred to #301. · decided by: redline' && promptOf(filedAtEnd, 'deferred replies r1').includes('Step 1. Do not push (the round pushed its commits when it ended; these are the replies its deferred items waited for).'), [replyFor(filedAtEnd.calls, 'deferred replies r1', 'R1-2'), promptOf(filedAtEnd, 'deferred replies r1').slice(0, 900)])
  check('end: the handoff and the result carry the number, and the item\'s thread is swept with its late reply', bodyOf(filedAtEnd).includes('### Deferred (1)\n\n- **R1-2** title R1-2: deferred to #301 · decided by: redline\n') && bodyOf(filedAtEnd).includes('2 items: 1 fixed, 1 deferred;') && ((filedAtEnd.res.deferred || [])[0] || {}).number === 301 && ((filedAtEnd.res.rounds[0] || {}).outcomes || {})['R1-2'] === 'deferred to #301 · decided by: redline' && promptOf(filedAtEnd, 'resolve threads').includes('- R1-2 (round 1): comments 101, 250'), [bodyOf(filedAtEnd), filedAtEnd.res.deferred, promptOf(filedAtEnd, 'resolve threads')])
  const droppedAtEnd = await go('end: the person drops the draft at the end', { ...covArgs, deferrals: { 'R1-2': answer('drop', { notes: why }) } }, ended)
  check('end: a draft dropped at the end is not filed, and its late reply gives the person\'s reason', droppedAtEnd.res.status === 'done' && !labels(droppedAtEnd.calls).some((l) => l.startsWith('file deferred')) && replyFor(droppedAtEnd.calls, 'deferred replies r1', 'R1-2') === `Redline round 1: ${why} No issue was opened. · decided by: @author`, [droppedAtEnd.res.status, labels(droppedAtEnd.calls).slice(-8), replyFor(droppedAtEnd.calls, 'deferred replies r1', 'R1-2')])
  check('end: a draft dropped at the end is counted and listed as overruled by the person, never as deferred', bodyOf(droppedAtEnd).includes('2 items: 1 fixed, 1 overruled by @author;') && bodyOf(droppedAtEnd).includes(`### Overruled by @author (1)\n\n- **R1-2** title R1-2: ${why} No issue was opened. · decided by: @author\n`) && !bodyOf(droppedAtEnd).includes('### Deferred') && (droppedAtEnd.res.deferred || []).length === 0 && JSON.stringify(droppedAtEnd.res.decided.filter((d) => d.id === 'R1-2').map((d) => [d.kind, d.overruled, d.decidedBy])) === '[["decided",true,"@author"]]', [bodyOf(droppedAtEnd), droppedAtEnd.res.decided])
  // Nothing is filed once Finish's read of the highest posted round refuses (#81).
  const rerun = await go('end: finishing from a re-run earlier round', { ...covArgs, deferrals: { 'R1-2': answer('file') } }, { ...ended, lastPosted: 7 })
  check('end: when the round check refuses, nothing is filed and no held reply is posted', rerun.res.status === 'error' && rerun.res.stage === 'finish' && labels(rerun.calls).slice(-1)[0] === 'last round' && !labels(rerun.calls).some((l) => l.startsWith('file deferred') || l.startsWith('deferred replies')), [rerun.res.status, rerun.res.stage, labels(rerun.calls).slice(-3)])
  // With nothing deferred the end setting adds no stop.
  const nothing = await go('end: a run that defers nothing', { ...baseArgs, deferAt: 'end' }, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('end: a run that deferred nothing makes no stop', nothing.res.status === 'done', [nothing.res.status, nothing.res.handoffKind])

  // The same stop comes before a cap-hit comment, which then carries the numbers.
  const capScenario = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], [f('R2-1', 'correctness')]], defer: ['R1-2'], commitIds: [['R1-1', 'R1-2']] }
  const capHeld = await go('end: the round cap', { ...baseArgs, deferAt: 'end', maxRounds: 1 }, capScenario)
  check('end: a run that reaches the cap stops for its held drafts before the cap-hit comment', capHeld.res.status === 'handoff' && capHeld.res.handoffKind === 'deferred' && !labels(capHeld.calls).includes('cap-hit comment') && JSON.stringify(capHeld.res.draftsNeeded) === '["R1-2"]', [capHeld.res.status, capHeld.res.handoffKind, labels(capHeld.calls).slice(-3)])
  const capFiled = await go('end: the round cap, answered', { ...baseArgs, deferAt: 'end', maxRounds: 1, deferrals: { 'R1-2': answer('file') } }, capScenario)
  check('end: the cap-hit comment then lists what was deferred, with its number and its mitigation\'s commit', capFiled.res.status === 'capped' && labels(capFiled.calls).slice(-6).join('|') === 'last round|file deferred r1|deferred replies r1|cap-hit comment|record files|record commit' && bodyOf(capFiled, 'cap-hit comment').endsWith('### Deferred (1)\n\n- **R1-2** title R1-2: deferred to #301; mitigated in 2bbbbbb · decided by: redline'), [capFiled.res.status, labels(capFiled.calls).slice(-6), bodyOf(capFiled, 'cap-hit comment')])

  // A revise-only pass ends at its record commit, so its held drafts are raised and settled there.
  const reviseArgs = { ...baseArgs, deferAt: 'end', revise: { round: 1, specFolder: folder, findings: [f('R1-1', 'correctness')], commentIds: { 'R1-1': 100 }, posted: true } }
  const reviseHeld = await go('end: a revise-only pass', reviseArgs, { reviews: [], defer: ['R1-1'], commitIds: [['R1-1']] })
  check('end: a revise-only pass stops for its held draft before its record commit', reviseHeld.res.status === 'handoff' && reviseHeld.res.handoffKind === 'deferred' && !labels(reviseHeld.calls).includes('record commit'), [reviseHeld.res.status, reviseHeld.res.handoffKind, labels(reviseHeld.calls)])
  const reviseFiled = await go('end: a revise-only pass, answered', { ...reviseArgs, deferrals: { 'R1-1': answer('file') } }, { reviews: [], defer: ['R1-1'], commitIds: [['R1-1']] })
  check('end: a revise-only pass then files, replies and commits its record', reviseFiled.res.status === 'done' && labels(reviseFiled.calls).slice(-4).join('|') === 'file deferred r1|deferred replies r1|record files|record commit', [reviseFiled.res.status, labels(reviseFiled.calls).slice(-4)])

  // A human review pass raises its drafts in the pass at either setting: its threads take one
  // reply per pass, so nothing of it can wait for the end.
  const h = { id: 'H1-1', file: 'app/x.php', line: 1, side: 'RIGHT', category: 'human', severity: 'medium', confidence: 'confirmed', title: 'comment H1-1', description: 'Please rewrite H1-1.', proposedFix: '', needsDecision: false, knownAs: '', source: '@marcamos', commentId: 900, threadId: 900, reviewId: 7 }
  const humanArgs = { ...baseArgs, deferAt: 'end', firstRound: 3, decisions: { 'H1-1': { choice: 'Mitigate', notes: 'The author defers the rewrite behind a guard.', date: '2026-11-16' } }, revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: '', specFolder: 'agent-os/specs/2026-10-20-1600-114-human-review-1', findings: [h], commentIds: { 'H1-1': 900 }, posted: true } }
  const humanScenario = { reviews: [[]], ask: ['H1-1'], commitIds: [['H1-1'], []], resolveDeferred: [{ id: 'H1-1', mitigation: 'a guard', fullFix: 'a rewrite', title: 'Rewrite H1-1', found: 'found H1-1', why: 'why H1-1' }] }
  const humanStop = await go('end: a human pass raises its draft in the pass', humanArgs, humanScenario)
  check('end: at the end setting a human review pass still raises its draft in the pass, after the resolve', humanStop.res.status === 'handoff' && humanStop.res.handoffKind === 'decisions' && labels(humanStop.calls).slice(-1)[0] === 'resolve h1' && JSON.stringify(humanStop.res.draftsNeeded) === '["H1-1"]', [humanStop.res.status, humanStop.res.handoffKind, labels(humanStop.calls)])
  const humanOn = await go('end: a human pass, its draft answered', { ...humanArgs, deferrals: { 'H1-1': answer('file') } }, humanScenario)
  check('end: a human pass files its draft and answers its thread in the pass, never at the end', humanOn.res.status === 'done' && labels(humanOn.calls).indexOf('file deferred h1') + 1 === labels(humanOn.calls).indexOf('push and reply h1') && !labels(humanOn.calls).some((l) => l.startsWith('deferred replies')), [humanOn.res.status, labels(humanOn.calls)])

  // The words and the answers are checked before any agent runs.
  const badAt = await go('stop: a bad deferAt word', { ...baseArgs, deferAt: 'never' }, only)
  check('stop: a deferAt that is not round or end is refused before any agent runs', Boolean(badAt.thrown) && /args\.deferAt must be one of round \| end/.test(badAt.thrown.message) && badAt.calls.length === 0, badAt.thrown && badAt.thrown.message)
  for (const [name, bad] of [['an action that is neither file nor drop', { 'R1-1': answer('open') }], ['no draft version', { 'R1-1': { action: 'file', title: '', notes: '', date: '2026-11-16' } }], ['a list', ['R1-1']]]) {
    const refused = await go(`stop: deferrals with ${name}`, { ...baseArgs, deferrals: bad }, only)
    check(`stop: deferrals with ${name} are refused before any agent runs`, Boolean(refused.thrown) && /args\.deferrals must map a finding id to/.test(refused.thrown.message) && refused.calls.length === 0, refused.thrown && refused.thrown.message)
  }
}

// ---------------------------------------------------------------------------
// #95, the fix-diff rule: a new correctness finding that is low severity and whose cause is in the
//     previous round's fix diff is fixed like a nit. It buys no round and is left out of the cap
//     test, so its round ends in the final nit pass. The verifier states the fact (inFixDiff), and
//     the workflow honours it only on a round that read a fix diff and for a file the previous
//     round's plan named; a claim it cannot honour is a warning, and the finding buys as before.
// ---------------------------------------------------------------------------
{
  const promptOf = (calls, label) => (pick(calls, label) || { prompt: '' }).prompt
  const bodyOf = (calls, label) => {
    const p = promptOf(calls, label)
    if (!p.includes('{\n  "body"')) {
      return ''
    }
    return JSON.parse(p.slice(p.indexOf('{\n  "body"'), p.indexOf('\n}\n', p.indexOf('{\n  "body"')) + 2)).body
  }
  const handoffOf = (calls) => (pick(calls, 'handoff comment') ? comment(calls, 'handoff comment') : '')
  const minorOf = (res, i) => ((res.rounds || [])[i] || {}).minor || []
  const about = (res, id) => (res.warnings || []).filter((w) => w.includes(id) && w.includes('fix diff'))
  const low = (id, extra) => f(id, 'correctness', { severity: 'low', inFixDiff: true, ...extra })
  const two = (second, extra) => ({ reviews: [[f('R1-1', 'correctness')], second, []], commitIds: [['R1-1'], second.map((x) => x.id)], ...extra })

  // Low, and in the previous round's fix diff: fixed like a nit.
  const minor = await go('fix-diff: a low finding in the fix diff', baseArgs, two([low('R2-1')]))
  check('fix-diff: a low correctness finding in the previous round\'s fix diff is fixed and buys no round: its round ends in the final nit pass', minor.res.status === 'done' && minor.res.rounds.length === 3 && labels(minor.calls).includes('implement r2') && labels(minor.calls).includes('final nit pass r3') && !labels(minor.calls).includes('re-review r3') && about(minor.res, 'R2-1').length === 0, [minor.res.status, labels(minor.calls), minor.res.warnings])
  check('fix-diff: the round records which of its findings were fixed like a nit, and no other round does', minorOf(minor.res, 1).join(',') === 'R2-1' && minorOf(minor.res, 0).length === 0 && minorOf(minor.res, 2).length === 0, (minor.res.rounds || []).map((r) => r.minor))
  check('fix-diff: its fix is still a commit and a reply of its own', replyFor(minor.calls, 'push and reply r2', 'R2-1').startsWith('Redline round 2: fixed in ') && minor.res.decided.some((d) => d.id === 'R2-1' && d.kind === 'fixed'), replyFor(minor.calls, 'push and reply r2', 'R2-1'))
  // The final nit pass after it read correctness fixes, so no sentence calls them nit fixes.
  check('fix-diff: the final nit pass after it says whose fixes it read, in its review and in the handoff', bodyOf(minor.calls, 'post r3').startsWith('Redline round 3\n\nFinal nit pass: reviewed only round 2\'s fixes (') && handoffOf(minor.calls).includes('The last was a final nit pass over the fix diff only, which found no correctness bugs in round 2\'s fixes.') && !handoffOf(minor.calls).includes('nit fixes') && !bodyOf(minor.calls, 'post r3').includes('nit fixes'), [bodyOf(minor.calls, 'post r3').slice(0, 200), handoffOf(minor.calls).slice(0, 300)])
  const nitsOnly = await go('fix-diff: a round of nits still reads as nit fixes', baseArgs, { reviews: [[f('R1-1', 'nit')], []], commitIds: [['R1-1']] })
  check('fix-diff: after a round that fixed only nits the two sentences are as before', bodyOf(nitsOnly.calls, 'post r2').startsWith('Redline round 2\n\nFinal nit pass: reviewed only the nit fixes (') && handoffOf(nitsOnly.calls).includes('which found no correctness bugs in the nit fixes.'), [bodyOf(nitsOnly.calls, 'post r2').slice(0, 200), handoffOf(nitsOnly.calls).slice(0, 300)])
  const minorThenBug = await go('fix-diff: the final nit pass after it finds a bug', baseArgs, { reviews: [[f('R1-1', 'correctness')], [low('R2-1')], [f('R3-1', 'correctness')]], commitIds: [['R1-1'], ['R2-1'], ['R3-1']] })
  check('fix-diff: a bug the final nit pass finds in those fixes gets its one more pass, named the same way', minorThenBug.res.status === 'done' && minorThenBug.res.lastFixUnreviewed === true && handoffOf(minorThenBug.calls).includes('The final nit pass found a correctness bug in round 2\'s fixes; it was fixed in one more pass, which was not re-reviewed.') && labels(minorThenBug.calls).filter((l) => /^(re-review|final nit pass) r4$/.test(l)).length === 0, [minorThenBug.res.status, handoffOf(minorThenBug.calls).slice(0, 300)])
  // A round whose only correctness item is a bug in the previous round's fixes, asked about and
  // kept, bought nothing and changed nothing: the handoff says so, not that nothing was asked (#97, R2-16).
  const keptMinor = await go('fix-diff: a low finding in the fix diff, asked about and kept', { ...baseArgs, decisions: { 'R2-1': { choice: 'Keep it', notes: 'Kept as it is.', date: '2026-11-16' } } }, two([low('R2-1')], { ask: ['R2-1'], acceptedCalls: ['R2-1'], commitIds: [['R1-1'], []] }))
  check('fix-diff: the handoff after such a round names the bugs in the previous round\'s fixes, not a round that asked nothing', keptMinor.res.status === 'done' && handoffOf(keptMinor.calls).includes('Redline ran 2 review rounds; the last one verified no new correctness item to fix or ask about beyond low-severity bugs in round 1\'s fixes, which are handled like nits and buy no further round, and it committed no fix.'), [keptMinor.res.status, handoffOf(keptMinor.calls).slice(0, 400)])

  // A final nit pass reads only fixes, so the fact means nothing there: no warning, nothing recorded.
  const inFinal = await go('fix-diff: a final nit pass finding that states it', baseArgs, { reviews: [[f('R1-1', 'nit')], [low('R2-1')]], commitIds: [['R1-1'], ['R2-1']] })
  check('fix-diff: a final nit pass finding that states inFixDiff gets its one more pass, with no warning and nothing recorded', inFinal.res.status === 'done' && inFinal.res.lastFixUnreviewed === true && about(inFinal.res, 'R2-1').length === 0 && minorOf(inFinal.res, 1).length === 0 && handoffOf(inFinal.calls).includes('found a correctness bug in the nit fixes'), [inFinal.res.status, inFinal.res.warnings, (inFinal.res.rounds || []).map((r) => r.minor)])
  // Only the boolean is the fact.
  const worded = await go('fix-diff: a claim that is not a boolean', baseArgs, two([low('R2-1', { inFixDiff: 'true' })]))
  check('fix-diff: an inFixDiff that is not the boolean true is not the fact, and the finding buys the next round', labels(worded.calls).includes('re-review r3') && minorOf(worded.res, 1).length === 0, labels(worded.calls))

  // Each condition on its own: without it the finding buys the next round, as before.
  const unstated = await go('fix-diff: a low finding that states nothing', baseArgs, two([f('R2-1', 'correctness')]))
  check('fix-diff: a low finding of a fix-diff round that does not state inFixDiff buys the next round, as before', unstated.res.status === 'done' && labels(unstated.calls).includes('re-review r3') && !labels(unstated.calls).includes('final nit pass r3') && minorOf(unstated.res, 1).length === 0 && about(unstated.res, 'R2-1').length === 0, [labels(unstated.calls), unstated.res.warnings])
  const own = await go('fix-diff: a low finding in the pull request\'s own code', baseArgs, two([low('R2-1', { inFixDiff: false })]))
  check('fix-diff: a low finding the verifier places in the pull request\'s own code buys the next round', labels(own.calls).includes('re-review r3') && !labels(own.calls).includes('final nit pass r3') && minorOf(own.res, 1).length === 0, labels(own.calls))
  for (const severity of ['medium', 'high']) {
    const run = await go(`fix-diff: a ${severity} finding in the fix diff`, baseArgs, two([low('R2-1', { severity })]))
    check(`fix-diff: a ${severity} finding in the fix diff buys the next round, with no warning`, labels(run.calls).includes('re-review r3') && !labels(run.calls).includes('final nit pass r3') && minorOf(run.res, 1).length === 0 && about(run.res, 'R2-1').length === 0, [labels(run.calls), run.res.warnings])
  }
  const lowNit = await go('fix-diff: a nit in the fix diff', baseArgs, two([f('R2-1', 'nit', { inFixDiff: true })]))
  check('fix-diff: a nit that states inFixDiff is a nit: not recorded as one of these, and its round ends as a nit round does', minorOf(lowNit.res, 1).length === 0 && labels(lowNit.calls).includes('final nit pass r3'), [labels(lowNit.calls), (lowNit.res.rounds || []).map((r) => r.minor)])
  const mixed = await go('fix-diff: a low one beside a medium one', baseArgs, two([low('R2-1'), low('R2-2', { severity: 'medium' })]))
  check('fix-diff: beside a finding that buys, the round is bought and the low one is still recorded', labels(mixed.calls).includes('re-review r3') && minorOf(mixed.res, 1).join(',') === 'R2-1', [labels(mixed.calls), minorOf(mixed.res, 1)])

  // The claim is checked: the file must be one the previous round's plan named.
  const elsewhere = await go('fix-diff: a claim on a file the plan did not name', baseArgs, two([low('R2-1', { file: 'app/other.php' })]))
  check('fix-diff: a claim on a file outside the previous round\'s plan paths is a warning, and the finding buys the next round', labels(elsewhere.calls).includes('re-review r3') && !labels(elsewhere.calls).includes('final nit pass r3') && minorOf(elsewhere.res, 1).length === 0 && about(elsewhere.res, 'R2-1').length === 1 && about(elsewhere.res, 'R2-1')[0] === 'round 2: the reviewer placed R2-1 in the fix diff, but `app/other.php` is not among the paths round 1\'s plan named; it is treated as a finding in the pull request\'s own code, which buys a round', [labels(elsewhere.calls), elsewhere.res.warnings])
  const folder = await go('fix-diff: a plan path that is a folder', baseArgs, two([low('R2-1', { file: 'app/Services/Retry.php' })], { planPaths: ['app/Services/', 'tests/'] }))
  check('fix-diff: a plan path ending in a slash covers the files under it', labels(folder.calls).includes('final nit pass r3') && minorOf(folder.res, 1).join(',') === 'R2-1' && about(folder.res, 'R2-1').length === 0, [labels(folder.calls), folder.res.warnings])
  const sibling = await go('fix-diff: a file beside a named one', baseArgs, two([low('R2-1', { file: 'app/Services.php' })], { planPaths: ['app/Services/', 'app/Service'] }))
  check('fix-diff: a folder path covers nothing beside it, and a file path only itself', labels(sibling.calls).includes('re-review r3') && about(sibling.res, 'R2-1').length === 1, [labels(sibling.calls), sibling.res.warnings])
  // Both sides of the compare are read through the one path function (the #114 round 4 by-hand
  // spec): the reviewer's file, and each path the plan approver listed. Until then the file was
  // compared as written, against a list with only the repository root taken off, so a file
  // written with a leading ./ was under no folder, and a plan path written in another form named
  // no file.
  const dotted = await go('fix-diff: a file the reviewer writes with a leading ./', baseArgs, two([low('R2-1', { file: './app/Services/Retry.php' })], { planPaths: ['app/Services/', 'tests/'] }))
  check('fix-diff: a file written with a leading ./ is under the folder the plan named', labels(dotted.calls).includes('final nit pass r3') && minorOf(dotted.res, 1).join(',') === 'R2-1' && about(dotted.res, 'R2-1').length === 0, [labels(dotted.calls), dotted.res.warnings])
  const respelled = await go('fix-diff: a plan path the approver writes in another form', baseArgs, two([low('R2-1', { file: 'app/x.php' })], { planPaths: [' ./app//x.php'] }))
  check('fix-diff: a plan path written with a leading ./, a doubled slash and padding names its file', labels(respelled.calls).includes('final nit pass r3') && minorOf(respelled.res, 1).join(',') === 'R2-1' && about(respelled.res, 'R2-1').length === 0, [labels(respelled.calls), respelled.res.warnings])
  // The plan approver's list becomes the snapshot's plan_paths, which checks.sh reads as the
  // allowed list, an entry that ends in a slash as a prefix. Each path is read as the guard reads
  // the target of a write, and a path written as a directory keeps its slash. Reading the list
  // this way never makes the allowed list broader than the approver wrote it: an entry that is
  // the repository root, that is outside the repository, or that names a directory through a ..
  // segment is left out and warned about by name, and never written as a prefix; a blank is left
  // out with no warning.
  const planPathsOf = (r, label = 'snapshot r1') => {
    const p = (pick(r.calls, label) || { prompt: '' }).prompt
    try {
      return JSON.parse(p.slice(p.indexOf('{'), p.lastIndexOf('}') + 1)).plan_paths || []
    } catch {
      return []
    }
  }
  const KEPT = { ' ./app//x.php': 'app/x.php', '/r/app/sub/../y.php': 'app/y.php', 'app/Services/': 'app/Services/', 'tests/./': 'tests/', 'app/z/.': 'app/z/', 'app/x.php/': 'app/x.php/' }
  const LEFT_OUT = { '.': 'is the repository root', '/r': 'is the repository root', 'app/..': 'is the repository root', '../x.php': 'is outside the repository', '/etc/x.php': 'is outside the repository', 'app/sub/../': 'names a directory through a .. segment', 'app/sub/..': 'names a directory through a .. segment' }
  const everyForm = await go('plan paths: the approver lists paths in every form', baseArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']], planPaths: Object.keys(KEPT).concat(Object.keys(LEFT_OUT), ['', '  ']) })
  const everyFormPaths = planPathsOf(everyForm)
  check('plan paths: the snapshot holds each path the approver listed, read as the guard reads a write target, a directory with its slash, and then the spec folder', (everyForm.res || {}).status === 'done' && JSON.stringify(everyFormPaths.slice(0, -1)) === JSON.stringify(Object.values(KEPT)) && String(everyFormPaths[everyFormPaths.length - 1]).endsWith('-review-round-1/'), [(everyForm.res || {}).status, (everyForm.res || {}).error, everyFormPaths])
  const leftOutWarning = (entry) => `round 1: the plan approver listed \`${entry}\`, which ${LEFT_OUT[entry]}; it is not among the allowed paths`
  check('plan paths: each entry left out is warned about by name with its reason, and a blank is not', Object.keys(LEFT_OUT).every((entry) => ((everyForm.res || {}).warnings || []).includes(leftOutWarning(entry))) && ((everyForm.res || {}).warnings || []).filter((w) => w.includes('the plan approver listed')).length === Object.keys(LEFT_OUT).length, (everyForm.res || {}).warnings)
  // The allowed list is never widened: nothing in it is the root, absolute or holds a .. segment,
  // and an entry is a prefix only where the approver wrote that directory, slash by slash. `app/`
  // is what app/sub/../ and app/sub/.. fold to, and the root what app/.. folds to. Seen red under
  // a mutation that writes a directory through .. as its folded prefix, and under one that keeps
  // the root.
  const prefixesWritten = Object.values(KEPT).filter((entry) => entry.endsWith('/'))
  check('plan paths: reading the list never widens it: no root, no path outside, no .. segment, and no prefix the approver did not write', everyFormPaths.length > 1 && !everyFormPaths.some((entry) => entry === '' || entry.startsWith('/') || entry.split('/').includes('..') || entry === 'app/' || entry === 'app') && JSON.stringify(everyFormPaths.slice(0, -1).filter((entry) => entry.endsWith('/'))) === JSON.stringify(prefixesWritten), everyFormPaths)
  // The previous round's plan, never the run's: round 1 named app/a.php, round 2 app/b.php, and a
  // round 3 finding on app/a.php is not in round 2's fix diff.
  const perRound = { reviews: [[f('R1-1', 'correctness')], [f('R2-1', 'correctness')], [low('R3-1', { file: 'app/a.php' })], []], commitIds: [['R1-1'], ['R2-1'], ['R3-1']], planPaths: [['app/a.php'], ['app/b.php'], ['app/a.php']] }
  const stale = await go('fix-diff: a file only an earlier round\'s plan named', { ...baseArgs, maxRounds: 5 }, perRound)
  check('fix-diff: the paths checked are the previous round\'s own, not every path the run approved', labels(stale.calls).includes('re-review r4') && about(stale.res, 'R3-1').length === 1 && about(stale.res, 'R3-1')[0].includes('`app/a.php` is not among the paths round 2\'s plan named'), [labels(stale.calls), stale.res.warnings])
  const current = await go('fix-diff: a file the previous round\'s plan named', { ...baseArgs, maxRounds: 5 }, { ...perRound, reviews: [perRound.reviews[0], perRound.reviews[1], [low('R3-1', { file: 'app/b.php' })], []] })
  check('fix-diff: and a file the previous round\'s plan named is honoured', labels(current.calls).includes('final nit pass r4') && minorOf(current.res, 2).join(',') === 'R3-1' && about(current.res, 'R3-1').length === 0, [labels(current.calls), current.res.warnings])

  // A round that read no fix diff cannot hold such a finding.
  const first = await go('fix-diff: a claim in the whole-PR round', baseArgs, { reviews: [[low('R1-1')], []], commitIds: [['R1-1']] })
  check('fix-diff: a claim in the whole-pull-request round is a warning, and the finding buys the next round', labels(first.calls).includes('re-review r2') && !labels(first.calls).includes('final nit pass r2') && minorOf(first.res, 0).length === 0 && about(first.res, 'R1-1').length === 1 && about(first.res, 'R1-1')[0].includes('this round reviewed the whole pull request, not a fix diff'), [labels(first.calls), first.res.warnings])
  const covArgs = { ...baseArgs, models: { ...baseArgs.models, coverage: { model: 'm-cov', effort: 'xhigh' } } }
  const one = 'Reviewed.\n\n```json\n' + JSON.stringify([{ file: 'app/x.php', line: 3, summary: 'the real one', failure_scenario: 'f' }]) + '\n```\n'
  const acct = (ref, outcome = 'verified') => [{ index: 1, outcome, ref }]
  const keep = { 'R1-1': { choice: 'Accept', notes: 'The author accepts it as it is.', date: '2026-11-16' } }
  const noDiff = await go('fix-diff: a claim in a round with no fix diff', { ...covArgs, decisions: keep }, { reviews: [[f('R1-1', 'correctness')], [low('R2-1')], []], ask: ['R1-1'], acceptedCalls: ['R1-1'], commitIds: [[], ['R2-1']], coverage: [one, one, one], coverageOut: [acct('R1-1'), acct('R2-1'), acct('R2-1', 'settled')] })
  check('fix-diff: a claim in a round whose previous round changed no code is a warning, and the finding buys the next round', noDiff.res.status === 'done' && labels(noDiff.calls).includes('re-review r3') && !labels(noDiff.calls).includes('final nit pass r3') && about(noDiff.res, 'R2-1').length === 1 && about(noDiff.res, 'R2-1')[0].includes('round 1 changed no code, so this round had no fix diff'), [noDiff.res.status, labels(noDiff.calls), noDiff.res.warnings])
  const covered = await go('fix-diff: with the coverage pass on', covArgs, { reviews: [[f('R1-1', 'correctness')], [low('R2-1')], []], commitIds: [['R1-1'], ['R2-1']], coverage: [one, one], coverageOut: [acct('R1-1'), acct('R2-1')] })
  check('fix-diff: with the coverage pass on, a low finding in the fix diff still ends its round in the final nit pass, which runs no coverage pass', covered.res.status === 'done' && labels(covered.calls).includes('coverage r2') && labels(covered.calls).includes('final nit pass r3') && !labels(covered.calls).includes('coverage r3') && minorOf(covered.res, 1).join(',') === 'R2-1', [covered.res.status, labels(covered.calls)])

  // The cap: such a finding is left out of it, as a nit is.
  const capArgs = { ...baseArgs, maxRounds: 1 }
  const pastCap = await go('fix-diff: past the cap, only low fix-diff findings', capArgs, two([low('R2-1')]))
  check('fix-diff: past the cap a round whose only correctness findings are low ones from the fix diff is fixed, with no cap-hit comment', pastCap.res.status === 'done' && labels(pastCap.calls).includes('implement r2') && labels(pastCap.calls).includes('final nit pass r3') && !labels(pastCap.calls).includes('cap-hit comment') && labels(pastCap.calls).includes('handoff comment'), [pastCap.res.status, labels(pastCap.calls)])
  const capped = await go('fix-diff: past the cap, a low finding that states nothing', capArgs, two([f('R2-1', 'correctness')]))
  check('fix-diff: past the cap a low finding that does not state inFixDiff still caps the run, as before', capped.res.status === 'capped' && labels(capped.calls).includes('cap-hit comment') && !labels(capped.calls).includes('implement r2'), [capped.res.status, labels(capped.calls)])
  const cappedMixed = await go('fix-diff: past the cap, a low one beside one that buys', capArgs, two([low('R2-1'), low('R2-2', { severity: 'high' })]))
  check('fix-diff: past the cap a finding that buys still caps the run, and the comment lists every open correctness finding', cappedMixed.res.status === 'capped' && cappedMixed.res.openFindings.map((x) => x.id).join(',') === 'R2-1,R2-2' && !labels(cappedMixed.calls).includes('implement r2'), [cappedMixed.res.status, (cappedMixed.res.openFindings || []).map((x) => x.id)])
  const cappedClaim = await go('fix-diff: past the cap, a claim that is not honoured', capArgs, two([low('R2-1', { file: 'app/other.php' })]))
  check('fix-diff: past the cap a claim the workflow does not honour caps the run', cappedClaim.res.status === 'capped' && about(cappedClaim.res, 'R2-1').length === 1, [cappedClaim.res.status, cappedClaim.res.warnings])

  // Correctness only: no nit is fixed under that scope, so it has no final nit pass; these fixes are
  // unreviewed code, so their round gets one.
  const scopedRun = await go('fix-diff: correctness only', { ...baseArgs, scope: 'correctness' }, two([low('R2-1'), f('R2-2', 'nit')]))
  check('fix-diff: under correctness only a round whose only fix is a low fix-diff finding gets its final nit pass', scopedRun.res.status === 'done' && labels(scopedRun.calls).includes('final nit pass r3') && !labels(scopedRun.calls).includes('re-review r3') && scopedRun.res.rounds[1].scoped.map((x) => x.id).join(',') === 'R2-2', [scopedRun.res.status, labels(scopedRun.calls)])

  // Like a nit whatever the shaper does with it: put to the person, it stops the run and buys nothing.
  const askedScenario = { ...two([low('R2-1')]), ask: ['R2-1'] }
  const askedStop = await go('fix-diff: the shaper asks about one', baseArgs, askedScenario)
  const askedOn = await go('fix-diff: the person answers', { ...baseArgs, decisions: { 'R2-1': { choice: 'Change it', notes: 'The author wants the retry count logged.', date: '2026-11-16' } } }, askedScenario)
  check('fix-diff: one the shaper puts to the person stops a guided run as any call does, and once answered buys no round', askedStop.res.status === 'handoff' && askedStop.res.decisionsNeeded.join(',') === 'R2-1' && askedOn.res.status === 'done' && labels(askedOn.calls).includes('final nit pass r3') && !labels(askedOn.calls).includes('re-review r3'), [askedStop.res.status, askedOn.res.status, labels(askedOn.calls)])
  samePrefix('fix-diff: the relaunch replays every prompt before the stop', askedStop.calls, askedOn.calls, askedStop.calls.length)

  // What the verifier is asked, and where.
  const asks = 'state inFixDiff'
  const fixDiffPrompt = promptOf(minor.calls, 're-review r2')
  check('fix-diff: the fix-diff review is asked to state inFixDiff for each finding, naming the round whose fixes it means', fixDiffPrompt.includes('For each finding, state inFixDiff: true when its cause is in the fix diff named above, in code round 1\'s fixes added or changed, and false when it is in the pull request\'s own code or anywhere else.') && fixDiffPrompt.includes('never set it because a finding is small'), fixDiffPrompt.slice(-1800))
  check('fix-diff: the whole-PR review, the final nit pass and a round with no fix diff are not asked', !promptOf(minor.calls, 'review r1').includes(asks) && !promptOf(minor.calls, 'final nit pass r3').includes(asks) && promptOf(noDiff.calls, 're-review r2') !== '' && !promptOf(noDiff.calls, 're-review r2').includes(asks) && promptOf(covered.calls, 're-review r2').includes(asks), [promptOf(minor.calls, 'review r1').includes(asks), promptOf(minor.calls, 'final nit pass r3').includes(asks), promptOf(noDiff.calls, 're-review r2').includes(asks)])
  const schemaOf = (calls, label) => (((((pick(calls, label) || { opts: {} }).opts.schema || {}).properties || {}).findings || {}).items || {}).properties || {}
  check('fix-diff: the reviewer\'s schema takes inFixDiff as a boolean and does not require it', (schemaOf(minor.calls, 're-review r2').inFixDiff || {}).type === 'boolean' && !((((pick(minor.calls, 're-review r2') || { opts: {} }).opts.schema || {}).properties || {}).findings.items.required || []).includes('inFixDiff'), schemaOf(minor.calls, 're-review r2').inFixDiff)
  check('fix-diff: the agent file states the same fact and returns it', reviewerAgent.includes('`inFixDiff: true` when its cause is in the fix diff the prompt names') && reviewerAgent.includes('"inFixDiff": false') && reviewerAgent.includes('never set it because a finding is small'), 'agents/redline-reviewer.md')
  check('fix-diff: the agent file\'s sentence on what a correctness finding buys names the exception', reviewerAgent.includes('a low-severity one whose cause is in the previous round\'s fixes is fixed like a nit and buys none'), 'agents/redline-reviewer.md, "The kind"')
}

// ---------------------------------------------------------------------------
// #95, the statements a reader meets: a verified item ends one of four ways, and every place that
//     says so names the deferred ending. #79 left the README's opening line, both plugin
//     descriptions and the mission on the old rule until a fifth round (#80, R5-1), so each is
//     pinned here beside what the agents themselves are told.
// ---------------------------------------------------------------------------
{
  const read = (...parts) => fs.readFileSync(path.join(here, '..', ...parts), 'utf8')
  const promptOf = (calls, label) => (pick(calls, label) || { prompt: '' }).prompt
  const run = await go('statements: a round of nits and its final pass', baseArgs, { reviews: [[f('R1-1', 'nit')], []], commitIds: [['R1-1']] })
  const shapers = 'Whether to fix it, defer it, decline it or put it to the person is the shaper\'s decision, never yours.'
  check('statements: every review prompt leaves all four endings to the shaper', promptOf(run.calls, 'review r1').includes(shapers) && promptOf(run.calls, 'final nit pass r2').includes(shapers), promptOf(run.calls, 'review r1').slice(-700))
  check('statements: the reviewer\'s file names the four endings the shaper chooses from', reviewerAgent.includes('fix it, defer it to a drafted issue when it is worth doing outside this pull request, decline it with a reason, or put it to the person'), 'agents/redline-reviewer.md')
  const described = (src.match(/^ {2}description: '(.*)',$/m) || ['', ''])[1]
  check('statements: the workflow describes itself by the done rule as it is, with the filing step', described.includes('file each deferred item\\\'s drafted issue') && described.endsWith('re-review while a round finds a new correctness item to fix or ask about') && !src.includes('until a round confirms no new correctness finding'), described)
  const manifest = JSON.parse(read('.claude-plugin', 'plugin.json'))
  const market = JSON.parse(read('.claude-plugin', 'marketplace.json'))
  const skill = read('skills', 'redline', 'SKILL.md').split('\n').find((line) => line.startsWith('description: ')) || ''
  const endings = [
    ['the README\'s opening paragraph', read('README.md').split('\n')[2], 'defers it to a drafted issue when it is worth doing and not here'],
    ['the plugin manifest\'s description', manifest.description, 'Every verified item is fixed, deferred to a drafted issue, declined with a reason, or put to you.'],
    ['the marketplace entry\'s description', market.plugins[0].description, 'Every verified item is fixed, deferred to a drafted issue, declined with a reason, or put to you.'],
    ['the skill\'s description', skill, 'every verified item is fixed, deferred to a drafted issue, declined with a reason, or put to the person'],
    ['the product mission', read('agent-os', 'product', 'mission.md'), 'defers what is worth doing outside this pull request'],
  ]
  for (const [name, text, phrase] of endings) {
    check(`statements: ${name} names the deferred ending`, typeof text === 'string' && text.includes(phrase) && !text.includes('fixed, declined with a reason, or put to'), String(text).slice(0, 300))
  }
  const limits = read('README.md').split('\n').filter((line) => line.startsWith('- **'))
  for (const [name, opening] of [['a deferred item opens an issue and a board gets a card', '- **A deferred item becomes a GitHub issue, and a board that takes new issues gets a card.**'], ['an issue is opened once per finding within one run', '- **An issue is opened once per finding, within one run.**'], ['at the end setting an unfinished run leaves threads unanswered', '- **With deferred items raised at the end, a run that never finishes leaves their threads unanswered.**'], ['a draft is the shaper\'s judgment and its title is posted as written', '- **A deferred item\'s draft is the shaper\'s judgment, and its title is posted as written.**']]) {
    check(`statements: the README's Known limits says ${name}`, limits.some((line) => line.startsWith(opening)), opening)
  }
  check('statements: the README states the title\'s unmeasured case as expected, never as fact', limits.some((line) => line.includes('Whether an `@word` in a title notifies by some path other than a link was not measured; it is expected not to.')), 'README.md, Known limits')
  // Drafts to GitHub need the repository's Issues on (#97, R1-4): whatever gh does where they are
  // off, no issue can be opened there, so the docs that describe the setting say so.
  check('statements: the docs say drafts to GitHub need the repository\'s Issues turned on', read('docs', 'contract.md').includes('`github` needs GitHub Issues turned on in the repository') && read('docs', 'running.md').includes('`defer to github` needs GitHub Issues turned on in the repository'), 'docs/contract.md, redline.json; docs/running.md, Where a draft goes')
  // A capped run reports its deferred items as a finished one does (#97, R1-6): the docs promise
  // a print-mode draft is printed when the run ends, and the cap is an ending too.
  const capped = ((read('skills', 'redline', 'SKILL.md').split('### `capped`')[1] || '').split('### `error`')[0]) || ''
  check('statements: the skill\'s capped section lists the deferred items and prints the print-mode drafts', capped.includes('Then the deferred items (`deferred`), as the `done` section lists them') && capped.includes('when `deferTo` is `print`, print each draft after the list'), capped)
  // The after-run filing is gone (#95), so the guard's docs no longer name it (#97, R1-1).
  check('statements: docs/guard.md no longer names a deferred issue filed after the run as the main session\'s prompt', !read('docs', 'guard.md').includes('filing a deferred issue after a run') && read('docs', 'guard.md').includes('The main session itself runs no `redline-gh.sh` write'), 'docs/guard.md, The hook')
  // A draft's body can hold a code fence, so the session prints it in a longer one (#97, R2-3).
  const fence = 'in a fenced block whose fence is one backtick longer than the longest run of backticks in the body, and at least three'
  const doneSection = ((read('skills', 'redline', 'SKILL.md').split('### `done`')[1] || '').split('### `capped`')[0]) || ''
  check('statements: the skill prints a print-mode draft\'s body in a fence longer than any run of backticks in it, when the run ends and at the cap', doneSection.includes(fence) && capped.includes(fence) && !read('skills', 'redline', 'SKILL.md').includes('in a fenced block, both exactly as given'), 'skills/redline/SKILL.md, done and capped')
  // A headless run stops where its dial does, a draft's stop included (#97, R2-4).
  const headless = 'a headless run that must not stop uses `autopilot`'
  // The skill reads what ships off the draft's `ships`, the round's record, never off its words (#100).
  check('statements: the skill says what ships in a round is read from the draft\'s ships, whatever the words say', read('skills', 'redline', 'SKILL.md').includes('from `ships`, whatever the words say') && read('skills', 'redline', 'SKILL.md').includes('`ships` (whether a mitigation ships'), [read('skills', 'redline', 'SKILL.md').includes('from `ships`, whatever the words say'), read('skills', 'redline', 'SKILL.md').includes('`ships` (whether a mitigation ships')])
  check('statements: the docs and the skill say a headless run that must not stop uses autopilot', read('docs', 'running.md').includes(headless) && read('skills', 'redline', 'SKILL.md').includes(headless), 'docs/running.md, Saved launch settings; skills/redline/SKILL.md, section 3')
  // The defer operation runs at two times, and the GitHub agent's file names both (#97, R3-1).
  check('statements: the GitHub agent\'s defer operation names the end-of-run filing at Finish', read('agents', 'redline-github.md').includes('or, with deferred items raised at the end of the run, at Finish, before the replies those items waited for'), 'agents/redline-github.md, defer')
}

// ---------------------------------------------------------------------------
// #105, what an option ends in: every option of a judgment call states its end (fix, defer or
//     accept) and the call names the recommended option by its label, in the shaper's schema and
//     in the workflow's own check of what the shaper returned. A decision that picks an option
//     names it in `option`, and the workflow gives that decision the option's end as its own
//     disposition: no statement is asked of the resolve agent for it, and the three record checks
//     of a decision that names its disposition hold the plan to it. A decision with no option is
//     the person's own words, stated by the resolve agent as before.
// ---------------------------------------------------------------------------
{
  const read = (...parts) => fs.readFileSync(path.join(here, '..', ...parts), 'utf8')
  const promptOf = (r, label) => (pick(r.calls, label) || { prompt: '' }).prompt
  const one = { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], commitIds: [['R1-1']] }
  const h = (id, extra) => ({ id, file: 'app/x.php', line: 1, side: 'RIGHT', category: 'human', severity: 'medium', confidence: 'confirmed', title: `comment ${id}`, description: `Please change ${id}.`, proposedFix: '', needsDecision: false, knownAs: '', source: '@marcamos', commentId: 900, threadId: 900, reviewId: 7, ...extra })
  const humanFolder = 'agent-os/specs/2026-10-20-1600-114-human-review-1'
  const humanArgs = (argExtra) => ({ ...baseArgs, firstRound: 3, ...(argExtra || {}), revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: 'One thing inline.', specFolder: humanFolder, findings: [h('H1-1')], commentIds: { 'H1-1': 900 }, posted: true } })
  const humanOne = { reviews: [[]], ask: ['H1-1'], commitIds: [['H1-1']] }
  const rules = [{ id: 'craft-config', when: { paths: ['config/project/**'] }, reason: 'Craft project config is applied through the control panel' }]
  const reason = rules[0].reason
  const ruleArgs = { ...baseArgs, askRules: rules }
  const underRule = { reviews: [[f('R1-1', 'correctness', { file: 'config/project/project.yaml' })], []], commitIds: [[]] }
  // The disposition a prompt's list of dispositions shows for a finding: the plan approver's and
  // the implementer's are the same JSON object, findings then deferred.
  const shownAs = (r, label, id) => {
    const p = promptOf(r, label)
    const from = p.indexOf('{\n  "findings": [')
    const list = from < 0 ? [] : JSON.parse(p.slice(from, p.indexOf('\n}\n', from) + 2)).findings
    return (list.find((x) => x.id === id) || {}).disposition
  }
  const stopsAtShape = (r, error, label = 'shape r1') => r.res.status === 'error' && r.res.stage === 'shape' && r.res.error === error && r.res.ownCheck === true && Boolean(r.res.resumeFrom) && r.res.resumeFrom.label === label
  const stopsAtResolve = (r, error, label = 'resolve r1') => r.res.status === 'error' && r.res.stage === 'resolve' && r.res.error === error && r.res.ownCheck === true && Boolean(r.res.resumeFrom) && r.res.resumeFrom.label === label && !labels(r.calls).some((l) => l.startsWith('plan approver'))
  const stopDetail = (r) => [(r.res || {}).status, (r.res || {}).stage, (r.res || {}).error, (r.res || {}).ownCheck, (r.res || {}).resumeFrom, labels(r.calls).slice(-3), r.thrown && r.thrown.message]

  // The schema, in each of the four the shaper can be given: a round's and a human pass's, each
  // with and without the repository's rule reasons.
  const callSchema = (r, label) => ((((pick(r.calls, label) || { opts: {} }).opts.schema || {}).properties || {}).judgmentCalls || {}).items || {}
  const optionSchema = (r, label) => ((callSchema(r, label).properties || {}).options || {}).items || {}
  const statesEnds = (r, label) => (callSchema(r, label).required || []).includes('recommended') && ((callSchema(r, label).properties || {}).recommended || {}).type === 'string' && (optionSchema(r, label).required || []).join('|') === 'label|cost|effect|ends' && (((optionSchema(r, label).properties || {}).ends || {}).enum || []).join('|') === 'fix|defer|accept'
  const stop = await go('ends: guided, a call stops for the person', baseArgs, one)
  const stopRules = await go('ends: guided, a call stops for the person, in a repository with ask rules', ruleArgs, one)
  const humanStop = await go('ends: a human pass, a call stops for the author', humanArgs(), humanOne)
  const humanStopRules = await go('ends: a human pass, a call stops for the author, in a repository with ask rules', humanArgs({ askRules: rules }), humanOne)
  const fourSchemas = [[stop, 'shape r1'], [stopRules, 'shape r1'], [humanStop, 'shape h1'], [humanStopRules, 'shape h1']]
  check('ends: each of the four shaper schemas (a round\'s and a human pass\'s, with and without rule reasons) requires ends on every option, one of fix, defer and accept, and recommended on the call', fourSchemas.every(([r, label]) => statesEnds(r, label)), fourSchemas.map(([r, label]) => [optionSchema(r, label).required, callSchema(r, label).required]))
  check('ends: the stop\'s result carries each option\'s end and the call\'s recommended option, for the person to be shown', stop.res.status === 'handoff' && JSON.stringify(stop.res.judgmentCalls[0].options.map((o) => [o.label, o.ends])) === '[["Keep it","fix"],["Change it","fix"]]' && stop.res.judgmentCalls[0].recommended === 'Keep it', stop.res.judgmentCalls)

  // Every prompt that returns the shaper's JSON asks for the two fields: the shape, the human
  // pass's shape, and the reshape of each, with and without a decided finding.
  const OPTIONS_ASK = 'ends on every option (what choosing it ends in: fix, a change in this pull request that leaves nothing to track elsewhere; defer, an issue, with or without a mitigation now; accept, no change) and recommended (the label, as written, of the option you recommend); on a call for '
  const bounced = await go('ends: a round with no call, its plan bounced once', baseArgs, { reviews: [[f('R1-1', 'correctness')], []], planBounce: 1, commitIds: [['R1-1']] })
  const bouncedDecided = await go('ends: a round whose call autopilot decided, its plan bounced once', { ...baseArgs, interrupt: 'autopilot' }, { ...one, planBounce: 1 })
  const humanBounced = await go('ends: a human pass with no call, its plan bounced once', humanArgs(), { reviews: [[]], planBounce: 1, commitIds: [['H1-1']] })
  const humanBouncedDecided = await go('ends: a human pass whose call autopilot decided, its plan bounced once', humanArgs({ interrupt: 'autopilot' }), { ...humanOne, planBounce: 1 })
  const returns = [[stop, 'shape r1'], [humanStop, 'shape h1'], [bounced, 'reshape r1 #1'], [bouncedDecided, 'reshape r1 #1'], [humanBounced, 'reshape h1 #1'], [humanBouncedDecided, 'reshape h1 #1']]
  check('ends: the shape prompt, the human pass\'s and the four reshape prompts each ask for ends on every option and for recommended', returns.every(([r, label]) => promptOf(r, label).includes(OPTIONS_ASK)) && promptOf(bouncedDecided, 'reshape r1 #1').includes(DECIDED_BLOCK) && !promptOf(bounced, 'reshape r1 #1').includes(DECIDED_BLOCK) && promptOf(humanBouncedDecided, 'reshape h1 #1').includes(DECIDED_BLOCK) && !promptOf(humanBounced, 'reshape h1 #1').includes(DECIDED_BLOCK), returns.map(([r, label]) => [label, promptOf(r, label).includes(OPTIONS_ASK), promptOf(r, label).slice(-500)]))

  // The workflow's own check of the options, after the shape and after every reshape, in both
  // passes: a label names one option, every option has a label and an end of the three, and
  // recommended names one of them. Each stop is the workflow's check of what the shaper returned.
  const twoKeeps = [{ label: 'Keep it', cost: 'c', effect: 'e', ends: 'accept' }, { label: 'Keep it', cost: 'c', effect: 'e', ends: 'fix' }]
  const REPEATED = (id) => `the shaper gave ${id} more than one option labelled "Keep it"; a decision names the option it picks by its label, so each label names one option`
  const repeated = await go('ends: two options of one call share a label', baseArgs, { ...one, callOf: { 'R1-1': { options: twoKeeps } } })
  check('ends: a call with two options under one label stops at shape, the workflow\'s own check, resumable at the shaper', stopsAtShape(repeated, REPEATED('R1-1')), stopDetail(repeated))
  const NONE_RECOMMENDED = (id, named) => `the shaper recommended ${JSON.stringify(named)} for ${id}, which is the label of none of its options (Keep it, Change it); recommended names the option the shaper recommends by its label`
  const noneRecommended = await go('ends: the recommended label names no option of the call', baseArgs, { ...one, callOf: { 'R1-1': { recommended: 'Keep' } } })
  check('ends: a call whose recommended names none of its options stops at shape, the workflow\'s own check', stopsAtShape(noneRecommended, NONE_RECOMMENDED('R1-1', 'Keep')), stopDetail(noneRecommended))
  const noRecommended = await go('ends: a call with no recommended at all', baseArgs, { ...one, callOf: { 'R1-1': { recommended: undefined } } })
  check('ends: a call with no recommended stops the same way', stopsAtShape(noRecommended, NONE_RECOMMENDED('R1-1', '')), stopDetail(noRecommended))
  const endless = await go('ends: an option with an end outside the three, and one with none and no label', baseArgs, { ...one, callOf: { 'R1-1': { options: [{ label: 'Keep it', cost: 'c', effect: 'e', ends: 'mitigate' }, { label: ' ', cost: 'c', effect: 'e' }, { label: 'Change it', cost: 'c', effect: 'e', ends: 'fix' }] } } })
  check('ends: an option with no label, or with an end that is none of the three, stops at shape, the workflow\'s own check, as the second layer behind the schema', stopsAtShape(endless, 'the shaper gave R1-1 an option with no label or with no end the workflow knows ("Keep it" ends in "mitigate", "" ends in null); every option of a judgment call carries a label and states what it ends in, fix, defer or accept'), stopDetail(endless))
  const humanNoneRecommended = await go('ends: a human pass, the recommended label names no option', humanArgs(), { ...humanOne, callOf: { 'H1-1': { recommended: 'Keep' } } })
  check('ends: a human pass\'s call is held to the same check', stopsAtShape(humanNoneRecommended, NONE_RECOMMENDED('H1-1', 'Keep'), 'shape h1'), stopDetail(humanNoneRecommended))
  // After a reshape the check reads the calls still pending or newly raised: a call the reshape
  // raises stops at the reshape's own label, and one the round already decided is not held to
  // options the reshape restates.
  const raisedTwo = { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeAsk: ['R1-2'], commitIds: [['R1-1', 'R1-2']] }
  const raisedRepeated = await go('ends: a reshape raises a call with two options under one label', { ...baseArgs, interrupt: 'autopilot' }, { ...raisedTwo, callAt: { 'reshape r1 #1': { 'R1-2': { options: twoKeeps } } } })
  check('ends: a call a reshape raises is held to the check, and its stop names the reshape', stopsAtShape(raisedRepeated, REPEATED('R1-2'), 'reshape r1 #1'), stopDetail(raisedRepeated))
  const decidedRestated = await go('ends: a reshape returns a decided call again with two options under one label', { ...baseArgs, interrupt: 'autopilot' }, { ...raisedTwo, callAt: { 'reshape r1 #1': { 'R1-1': { options: twoKeeps } } } })
  check('ends: a call the round already decided is not held to the options a reshape restates', decidedRestated.res.status === 'done', stopDetail(decidedRestated))

  // The one call the workflow writes, for a finding left to the person under a rule, states its
  // options' ends and its recommended option like any other.
  const forcedStop = await go('ends: a finding under a paths rule, guided', ruleArgs, underRule)
  const forcedCall = ((forcedStop.res || {}).judgmentCalls || [])[0] || { options: [] }
  check('ends: the call the workflow writes for a finding left to the person states each option\'s end and recommends the change by hand', JSON.stringify(forcedCall.options.map((o) => [o.label, o.ends])) === '[["Make the change by hand after the run","fix"],["Accept, no change","accept"]]' && forcedCall.recommended === 'Make the change by hand after the run', forcedCall)
  const forcedDeclined = await go('ends: a finding under a paths rule that the shaper declined, guided', ruleArgs, { ...underRule, decline: ['R1-1'] })
  const declinedCall = ((forcedDeclined.res || {}).judgmentCalls || [])[0] || { options: [] }
  check('ends: for a finding the shaper would have declined, the call the workflow writes recommends no change', declinedCall.recommended === 'Accept, no change' && declinedCall.recommendation.startsWith('Accept, no change'), declinedCall)

  // A pick. The decision names the option in `option`; the run's copy of it carries the option's
  // end as its disposition, the resolve agent is asked for no statement (the scripted agent
  // returns none here), and the finding is shown and built by that end.
  const pickOf = (label, notes, id = 'R1-1') => ({ [id]: { choice: label, option: label, notes, date: '2026-11-24' } })
  const NAMED_EXEMPT = ' A call whose decision carries `disposition` names its own and has no entry in decided.'
  const PICK = ' A call whose decision carries `option` was answered by picking that option of the call, named by its label: plan that option as the shaper wrote it, and the `disposition` beside it is what the option ends in, which the workflow set from the option\'s `ends`.'
  const picked = await go('ends: guided, the person picks Change it', { ...baseArgs, decisions: pickOf('Change it', 'Change it now.') }, { ...one, resolveUnstated: ['R1-1'] })
  const pickedResolve = promptOf(picked, 'resolve r1')
  check('ends: a picked option gives its decision the option\'s end as its disposition, and no statement is asked of the resolve agent', picked.res.status === 'done' && pickedResolve.includes('"option": "Change it"') && pickedResolve.includes('"disposition": "fix"') && replyFor(picked.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Change it now. Applied in 1bbbbbb (redline: R1-1 fix). · decided by: @author', [stopDetail(picked), pickedResolve.slice(-1200)])
  check('ends: the resolve prompt says what a pick is, in the calls block, after the sentence that a named disposition has no entry in decided', pickedResolve.includes(NAMED_EXEMPT + PICK), pickedResolve.slice(-1500))
  samePrefix('ends: a pick', stop.calls, picked.calls, 5)
  // The case #105's comment names: the person picks Mitigate, which ends in defer, and the
  // resolve agent plans a full fix with no deferred entry. Until this spec it ran on with fix
  // stated, and nothing held the plan to the option the person chose.
  const three = [{ label: 'Full fix', cost: 'c', effect: 'e', ends: 'fix' }, { label: 'Mitigate', cost: 'c', effect: 'e', ends: 'defer' }, { label: 'Accept', cost: 'c', effect: 'e', ends: 'accept' }]
  const threeWay = { ...one, callOf: { 'R1-1': { options: three, recommended: 'Mitigate', recommendation: 'Mitigate; add a guard.' } } }
  const entry = { id: 'R1-1', mitigation: 'a guard', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }
  const NO_ENTRY = 'the resolve agent returned no deferred entry for R1-1, which its decision deferred; a deferred item always carries a drafted issue'
  const mitigateAsFix = await go('ends: the person picks Mitigate and the resolve agent plans a full fix with no entry', { ...baseArgs, decisions: pickOf('Mitigate', 'Mitigate it behind a guard.') }, threeWay)
  check('ends: Mitigate picked and planned as a full fix with no deferred entry stops at resolve, before the plan approver', stopsAtResolve(mitigateAsFix, NO_ENTRY), stopDetail(mitigateAsFix))
  const fixNoTask = await go('ends: the person picks Full fix and the resolve agent plans no task with files', { ...baseArgs, decisions: pickOf('Full fix', 'Fix it in full.') }, { ...threeWay, resolveFiles: { 'R1-1': [] } })
  check('ends: an option that ends in a fix, planned with no task with files, stops at resolve', stopsAtResolve(fixNoTask, 'the resolve agent planned no task with files for R1-1, which its decision names as a fix; a fix names the files it changes'), stopDetail(fixNoTask))
  const acceptWithTask = await go('ends: the person picks Accept and the resolve agent plans a task with files', { ...baseArgs, decisions: pickOf('Accept', 'Leave it as it is.') }, { ...threeWay, resolveFiles: { 'R1-1': ['app/x.php'] } })
  check('ends: an option that ends in accept, planned beside a task with files, stops at resolve', stopsAtResolve(acceptWithTask, 'the resolve agent planned a task with files for R1-1 (app/x.php), which its decision names as accepted; an accepted finding changes nothing'), stopDetail(acceptWithTask))
  // Their neighbours run on, each shown to the plan approver and the implementer by its end.
  const mitigated = await go('ends: the person picks Mitigate, planned as a deferral with its entry', { ...baseArgs, decisions: pickOf('Mitigate', 'Mitigate it behind a guard.'), deferrals: goAhead('R1-1') }, { ...threeWay, resolveDeferred: [entry] })
  check('ends: Mitigate picked and planned as a deferral is filed as the person\'s deferral, and shown as a defer', mitigated.res.status === 'done' && labels(mitigated.calls).includes('file deferred r1') && replyFor(mitigated.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Mitigate it behind a guard. Applied in 1bbbbbb (redline: R1-1 fix). Deferred to #301. · decided by: @author' && shownAs(mitigated, 'plan approver r1', 'R1-1') === 'defer' && shownAs(mitigated, 'implement r1', 'R1-1') === 'defer', [stopDetail(mitigated), replyFor(mitigated.calls, 'push and reply r1', 'R1-1'), shownAs(mitigated, 'plan approver r1', 'R1-1')])
  const acceptedPick = await go('ends: the person picks Accept, planned with no task', { ...baseArgs, decisions: pickOf('Accept', 'Leave it as it is.') }, { ...threeWay, commitIds: [[]] })
  check('ends: Accept picked is posted as no code change, demanded of no commit, and shown as an accept', acceptedPick.res.status === 'done' && replyFor(acceptedPick.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Leave it as it is. No code change. · decided by: @author' && shownAs(acceptedPick, 'plan approver r1', 'R1-1') === 'accept' && shownAs(acceptedPick, 'implement r1', 'R1-1') === 'accept', [stopDetail(acceptedPick), replyFor(acceptedPick.calls, 'push and reply r1', 'R1-1'), shownAs(acceptedPick, 'plan approver r1', 'R1-1')])
  const fullFix = await go('ends: the person picks Full fix, left unbuilt', { ...baseArgs, decisions: pickOf('Full fix', 'Fix it in full.') }, { ...threeWay, commitIds: [[], []] })
  check('ends: an option that ends in a fix is demanded by the check: left unbuilt, the round stops there', fullFix.res.status === 'error' && fullFix.res.stage === 'check' && (fullFix.res.error || '').includes('no commit names R1-1') && shownAs(fullFix, 'plan approver r1', 'R1-1') === 'fix', stopDetail(fullFix))

  // An answer in the person's own words names no option: its decision carries no disposition,
  // the resolve agent states what it ends in, and its prompt says nothing of a pick.
  const typed = { 'R1-1': { choice: 'Change it, with a log line', notes: 'Change it and log it.', date: '2026-11-24' } }
  const typedRun = await go('ends: guided, an answer in the person\'s own words', { ...baseArgs, decisions: typed }, one)
  const typedResolve = promptOf(typedRun, 'resolve r1')
  check('ends: an answer with no option is stated by the resolve agent, as before: no disposition on its decision, and no word of a pick in its prompt', typedRun.res.status === 'done' && typedResolve !== '' && !typedResolve.includes('"option"') && !typedResolve.includes('"disposition": ') && !typedResolve.includes('carries `option`') && shownAs(typedRun, 'plan approver r1', 'R1-1') === 'ask', [stopDetail(typedRun), typedResolve.slice(-900)])
  const typedUnstated = await go('ends: guided, an answer in the person\'s own words, no statement returned', { ...baseArgs, decisions: typed }, { ...one, resolveUnstated: ['R1-1'] })
  check('ends: an answer with no option still needs its statement', stopsAtResolve(typedUnstated, 'the resolve agent stated no disposition for R1-1, a judgment call it applied; a call\'s decision is read from what it states (fix, defer or accept)'), stopDetail(typedUnstated))
  // An option that names none of the call's options is the person's own words, with a warning.
  const UNKNOWN = 'round 1: the decision for R1-1 names the option "Kep it", which is the label of none of its call\'s options (Keep it, Change it); it is read as an answer in the person\'s own words, and the resolve agent states what it ends in'
  const unknown = await go('ends: a decision names an option its call does not have', { ...baseArgs, decisions: pickOf('Kep it', 'Keep it.') }, one)
  const unknownResolve = promptOf(unknown, 'resolve r1')
  check('ends: an option that names none of its call\'s options is read as the person\'s own words, with a warning, and the resolve agent states its end', unknown.res.status === 'done' && (unknown.res.warnings || []).includes(UNKNOWN) && unknownResolve !== '' && !unknownResolve.includes('"option"') && !unknownResolve.includes('"disposition": '), [stopDetail(unknown), unknown.res.warnings])
  const unknownUnstated = await go('ends: a decision names an option its call does not have, no statement returned', { ...baseArgs, decisions: pickOf('Kep it', 'Keep it.') }, { ...one, resolveUnstated: ['R1-1'] })
  check('ends: such a decision still needs its statement', stopsAtResolve(unknownUnstated, 'the resolve agent stated no disposition for R1-1, a judgment call it applied; a call\'s decision is read from what it states (fix, defer or accept)'), stopDetail(unknownUnstated))
  // A label is matched as written, apart from the blanks around it.
  const padded = await go('ends: a decision names its option with blanks around the label', { ...baseArgs, decisions: pickOf(' Change it ', 'Change it now.') }, { ...one, resolveUnstated: ['R1-1'] })
  check('ends: an option is matched by its label whatever blanks surround it', padded.res.status === 'done' && promptOf(padded, 'resolve r1').includes('"disposition": "fix"'), stopDetail(padded))

  // What a decision may carry is checked at launch, before any agent runs.
  const both = await go('ends: a decision gives an option and a disposition', { ...baseArgs, decisions: { 'R1-1': { choice: 'Change it', option: 'Change it', notes: 'Change it now.', date: '2026-11-24', disposition: 'fix' } } }, one)
  check('ends: a decision that gives both an option and a disposition is refused before any agent runs', Boolean(both.thrown) && /args\.decisions must not give both an option and a disposition/.test(both.thrown.message) && both.calls.length === 0, [both.thrown && both.thrown.message, both.calls.length])
  const notText = await go('ends: a decision gives an option that is no string', { ...baseArgs, decisions: { 'R1-1': { choice: 'Change it', option: 2, notes: 'Change it now.', date: '2026-11-24' } } }, one)
  check('ends: an option that is not a string is refused before any agent runs', Boolean(notText.thrown) && /args\.decisions must give an option as a string/.test(notText.thrown.message) && notText.calls.length === 0, [notText.thrown && notText.thrown.message, notText.calls.length])
  const emptyOption = await go('ends: an empty and a null option', { ...baseArgs, decisions: { 'R1-1': { choice: 'Change it', option: '', notes: 'Change it now.', date: '2026-11-24' }, 'R1-2': { choice: 'Change it', option: null, notes: 'Change it now.', date: '2026-11-24', disposition: 'fix' } } }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-1', 'R1-2'], commitIds: [['R1-1', 'R1-2']] })
  const emptyOptionResolve = promptOf(emptyOption, 'resolve r1')
  check('ends: an empty and a null option each name none: the decision runs on without one, a named disposition beside it kept', !emptyOption.thrown && (emptyOption.res || {}).status === 'done' && emptyOptionResolve !== '' && !emptyOptionResolve.includes('"option"') && emptyOptionResolve.includes('"disposition": "fix"') && !(emptyOption.res.warnings || []).some((w) => w.includes('names the option')), [emptyOption.thrown && emptyOption.thrown.message, (emptyOption.res || {}).status, (emptyOption.res || {}).warnings])

  // Autopilot takes the call's recommended option by its label, so its decision is a pick too.
  const auto = await go('ends: autopilot takes the recommended option, Mitigate', { ...baseArgs, interrupt: 'autopilot' }, { ...threeWay, resolveDeferred: [entry] })
  const autoResolve = promptOf(auto, 'resolve r1')
  check('ends: autopilot\'s decision names the recommended option, takes its end, and keeps the recommendation as its choice and notes', auto.res.status === 'done' && autoResolve.includes('"option": "Mitigate"') && autoResolve.includes('"disposition": "defer"') && autoResolve.includes('"choice": "Mitigate; add a guard"') && autoResolve.includes('"notes": "Autopilot took the shaper\'s recommendation: Mitigate; add a guard."') && autoResolve.includes(NAMED_EXEMPT + PICK) && labels(auto.calls).includes('file deferred r1'), [stopDetail(auto), autoResolve.slice(-1500)])
  const autoAsFix = await go('ends: autopilot takes Mitigate and the resolve agent plans a full fix with no entry', { ...baseArgs, interrupt: 'autopilot' }, threeWay)
  check('ends: on autopilot too, Mitigate planned as a full fix with no deferred entry stops at resolve', stopsAtResolve(autoAsFix, NO_ENTRY), stopDetail(autoAsFix))
  // Pin 1 of #99 on the dial it was first seen on: an entry the resolve agent returns beside a
  // call autopilot picked to a fix is dropped, as one beside any decision that names a fix is,
  // and nothing is filed. Until #105 the agent's own statement decided, and a statement of
  // defer beside that entry filed an issue the recommended option never asked for.
  const autoStray = await go('ends: autopilot takes an option that ends in a fix and the resolve agent returns a deferred entry', { ...baseArgs, interrupt: 'autopilot' }, { ...one, ends: { 'R1-1': 'fix' }, resolveDeferred: [entry] })
  check('ends: an entry the resolve agent returns beside a pick that ends in a fix is dropped with a warning, nothing is filed, and the fix is posted', autoStray.res.status === 'done' && (autoStray.res.warnings || []).includes('round 1: the resolve agent listed R1-1 as deferred, a call whose decision names it as fix; the entry is dropped, since the decision stands') && !labels(autoStray.calls).includes('file deferred r1') && replyFor(autoStray.calls, 'push and reply r1', 'R1-1').includes(' Applied in ') && (autoStray.res.deferred || []).length === 0, [stopDetail(autoStray), autoStray.res.warnings, replyFor(autoStray.calls, 'push and reply r1', 'R1-1')])
  const autoRaised = await go('ends: autopilot decides a call a reshape raised', { ...baseArgs, interrupt: 'autopilot' }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], planBounce: 1, reshapeAsk: ['R1-2'], commitIds: [['R1-1', 'R1-2']] })
  check('ends: a call a reshape raises is picked the same way, in the resolve that reshape sets off', autoRaised.res.status === 'done' && promptOf(autoRaised, 'resolve r1 #1').includes('"option": "Keep it"') && promptOf(autoRaised, 'resolve r1 #1').includes('"disposition": "fix"'), [stopDetail(autoRaised), promptOf(autoRaised, 'resolve r1 #1').slice(-900)])

  // A resolve with overrides and no call has no calls block, so nothing of this reaches it.
  const overrideOnly = await go('ends: a plan-dial override and no call', { ...baseArgs, interrupt: 'plan', approvedPlans: [1, 2], decisions: { 'R1-1': { choice: 'accept', notes: 'Leave it as it is.', date: '2026-11-24', disposition: 'accept' } } }, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [[]] })
  const overrideResolve = promptOf(overrideOnly, 'resolve r1')
  check('ends: a resolve with overrides and no call holds no calls block and no word of a pick', overrideResolve.includes('Disposition overrides, as JSON') && !overrideResolve.includes('Judgment calls as the shaper wrote them') && !overrideResolve.includes('`option`'), overrideResolve.slice(-900))

  // A pick on a call left to the person under a rule: no end is kept on its decision and nothing
  // warns, since no task writes anything whatever the answer, and the finding ends as every left
  // finding does. The calls block's sentence about a pick is for a decision that carries the
  // option's end, so this prompt holds none.
  const leftPick = await go('ends: the person picks Accept, no change on a call left to them under a rule', { ...ruleArgs, decisions: pickOf('Accept, no change', 'The author leaves the config as it is.') }, underRule)
  const leftResolve = promptOf(leftPick, 'resolve r1')
  check('ends: a pick on a call left to the person keeps no disposition and warns of none, and the finding is posted as left', leftPick.res.status === 'done' && leftResolve.includes('"option": "Accept, no change"') && leftResolve.includes('"rule": "craft-config"') && !leftResolve.includes('"disposition": ') && !leftResolve.includes('carries `option`') && !(leftPick.res.warnings || []).some((w) => w.includes('is not applied') || w.includes('names the option')) && replyFor(leftPick.calls, 'push and reply r1', 'R1-1') === `Redline round 1: left to @author under repository rule craft-config (${reason}). The author leaves the config as it is. · decided by: @author`, [stopDetail(leftPick), leftPick.res.warnings, replyFor(leftPick.calls, 'push and reply r1', 'R1-1')])
  // A disposition typed for it is still dropped with its warning, as before.
  const leftTyped = await go('ends: the person types a fix for a call left to them under a rule', { ...ruleArgs, decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it.', date: '2026-11-24', disposition: 'fix' } } }, underRule)
  check('ends: a disposition typed for a call left to the person is not applied, with the warning it always had', leftTyped.res.status === 'done' && (leftTyped.res.warnings || []).includes('round 1: R1-1 is left to the person under repository rule craft-config; the disposition "fix" is not applied'), [stopDetail(leftTyped), leftTyped.res.warnings])

  // A human review pass: one schema, one dial and one path. An option may end in defer there,
  // since choosing it is the author's decision, so the plan approver is told that a defer no
  // decision names is the bounce, where it was told any defer is.
  const humanThree = { ...humanOne, callOf: { 'H1-1': { options: three, recommended: 'Full fix', recommendation: 'Full fix.' } } }
  const humanEntry = { id: 'H1-1', mitigation: 'a guard', fullFix: 'a lock', title: 'Lock H1-1', found: 'found H1-1', why: 'why H1-1' }
  const humanPicked = await go('ends: a human pass, the author picks Mitigate', humanArgs({ decisions: pickOf('Mitigate', 'The author defers it behind a guard.', 'H1-1'), deferrals: goAhead('H1-1') }), { ...humanThree, resolveDeferred: [humanEntry] })
  const humanApprover = promptOf(humanPicked, 'plan approver h1')
  check('ends: a human pass\'s pick travels the same way, and is shown to its plan approver as the defer its decision names', humanPicked.res.status === 'done' && promptOf(humanPicked, 'resolve h1').includes('"disposition": "defer"') && shownAs(humanPicked, 'plan approver h1', 'H1-1') === 'defer', [stopDetail(humanPicked), shownAs(humanPicked, 'plan approver h1', 'H1-1')])
  check('ends: a human pass\'s plan approver is told that a defer no decision names is a bounce, and no longer that any defer is', humanApprover.includes('and no finding is deferred by the shaper; a disposition of defer that no decision below names is a bounce.') && !humanApprover.includes('a disposition of defer here is a bounce'), humanApprover.slice(0, 1500))
  samePrefix('ends: a human pass\'s pick', humanStop.calls, humanPicked.calls, 2)

  // The statements a reader and an agent meet.
  const shaperAgent = read('agents', 'redline-shaper.md')
  const resolveAgent = read('agents', 'redline-resolve.md')
  const approverAgent = read('agents', 'redline-plan-approver.md')
  const skill = read('skills', 'redline', 'SKILL.md')
  check('ends: the shaper\'s file says every option states what it ends in and the call names the recommended one, in rule 1, for a left call, for a human pass and in its return shape', shaperAgent.includes('Every option of a call states what choosing it ends in, in `ends`') && shaperAgent.includes('`recommended`, by its label as written') && shaperAgent.includes('which ends in `fix`, or accept it as it is, which ends in `accept`') && shaperAgent.includes('and one may end in `defer`: choosing it is the author\'s decision') && shaperAgent.includes('"options": [{"label": "Full fix", "cost": "...", "effect": "...", "ends": "fix"}, {"label": "Mitigate", "cost": "...", "effect": "...", "ends": "defer"}, {"label": "Accept", "cost": "...", "effect": "...", "ends": "accept"}]') && shaperAgent.includes('"recommended": "Accept"'), 'agents/redline-shaper.md')
  check('ends: the resolve agent\'s file says a decision that carries option is a pick whose disposition the workflow set, planned as the option reads and stated nowhere', resolveAgent.includes('A decision that carries `option` picked that option of the call, named by its label') && resolveAgent.includes('return no entry in `decided` for it') && resolveAgent.includes('and so does a call whose decision carries `disposition`'), 'agents/redline-resolve.md')
  check('ends: the plan approver\'s file says a picked option\'s end is the disposition the plan follows, and that a human pass\'s defer stands only when a decision names it', approverAgent.includes('A decision that carries `option` picked that option of the call, and its `disposition` is what the option ends in') && approverAgent.includes('a `defer` there stands only when a decision the prompt lists names it'), 'agents/redline-plan-approver.md')
  check('ends: the skill shows each option with what it ends in, takes the recommended one from the field, and records a pick\'s option', skill.includes('what it ends in (`ends`:') && skill.includes('the recommended one (`recommended`, the label of one option)') && skill.includes('"option": "<the option\'s label, exactly as given>"') && skill.includes('You never write a `disposition` for a call the person answered by picking an option'), 'skills/redline/SKILL.md')
  check('ends: the result tells a relaunching session that a pick carries option, and never beside a disposition', stop.res.relaunch.how.includes('"option": "<the label of the option picked>"') && stop.res.relaunch.how.includes('never beside "disposition"'), stop.res.relaunch.how)
}

// ---------------------------------------------------------------------------
// #126, a rule call the person defers: an option of a call for a finding left to the person (a
//     repository rule, or one of Redline's own files) may end in defer and carry a drafted issue.
//     When the person picks it, or types a defer for the finding, Redline files the draft: the
//     decision is the person's, no task writes anything, the reply still says the change is
//     theirs under the rule and names the issue, and the thread is resolved once the draft is
//     filed. The shaper's own deferral of such a finding is kept as that option where it was
//     thrown away. Any other answer, and autopilot, leave the finding as before.
// ---------------------------------------------------------------------------
{
  const read = (...parts) => fs.readFileSync(path.join(here, '..', ...parts), 'utf8')
  const promptOf = (r, label) => (pick(r.calls, label) || { prompt: '' }).prompt
  const bodyOf = (r) => (pick(r.calls, 'handoff comment') ? comment(r.calls, 'handoff comment') : '')
  const shownAs = (r, label, id) => {
    const p = promptOf(r, label)
    const from = p.indexOf('{\n  "findings": [')
    const list = from < 0 ? [] : JSON.parse(p.slice(from, p.indexOf('\n}\n', from) + 2)).findings
    return (list.find((x) => x.id === id) || {}).disposition
  }
  const detail = (r) => [(r.res || {}).status, (r.res || {}).handoffKind, (r.res || {}).stage, (r.res || {}).error, labels(r.calls).slice(-8), (r.res || {}).warnings, r.thrown && r.thrown.message]
  const rules = [{ id: 'craft-config', when: { paths: ['config/project/**'] }, reason: 'Craft project config is applied through the control panel' }]
  const reason = rules[0].reason
  const ruleArgs = { ...baseArgs, askRules: rules }
  const folder = 'agent-os/specs/2026-10-20-1600-114-review-round-1'
  const cfg = f('R1-1', 'correctness', { file: 'config/project/project.yaml', line: 3 })
  const BY_HAND = 'Make the change by hand after the run'
  const ACCEPT = 'Accept, no change'
  const DEFER = 'Defer to an issue'
  const draft = { title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1', fullFix: 'a lock' }
  const LEFT = `left to @author under repository rule craft-config`
  const tracked = 'The author tracks the config change in an issue and makes it after the merge.'
  const pickOf = (label, notes, id = 'R1-1') => ({ [id]: { choice: label, option: label, notes, date: '2026-11-24' } })
  const typedDefer = (id = 'R1-1') => ({ [id]: { choice: 'defer', notes: tracked, date: '2026-11-24', disposition: 'defer' } })
  const filedCalls = (r) => labels(r.calls).filter((l) => l.startsWith('file deferred'))

  // The forcing point: the shaper deferred a finding a rule covers, with its drafted issue.
  // Until this spec the entry was dropped there and the person was shown two options.
  const deferredUnderRule = { reviews: [[cfg], []], defer: ['R1-1'], commitIds: [[]] }
  const stop = await go('left: the shaper deferred a finding under a paths rule, guided', ruleArgs, deferredUnderRule)
  const call = ((stop.res || {}).judgmentCalls || [])[0] || { options: [], forced: {} }
  check('left: the call for a finding the shaper deferred under a rule keeps the drafted issue, as a third option that ends in defer and is the recommended one', stop.res.status === 'handoff' && JSON.stringify(call.options.map((o) => [o.label, o.ends])) === `[["${BY_HAND}","fix"],["${ACCEPT}","accept"],["${DEFER}","defer"]]` && JSON.stringify(call.options[2].draft) === JSON.stringify(draft) && call.recommended === DEFER && call.recommendation === 'Defer to an issue: Lock R1-1.' && call.forced.recommendation === 'Defer to an issue: Lock R1-1.', call)
  check('left: no draft is raised at the stop for it: the draft is the option\'s, shown with the call', JSON.stringify(stop.res.draftsNeeded) === '[]' && JSON.stringify(stop.res.decisionsNeeded) === '["R1-1"]' && (stop.res.warnings || []).includes('round 1: the shaper sorted R1-1 as defer; repository rule craft-config makes it an ask for the person'), [stop.res.draftsNeeded, stop.res.decisionsNeeded, stop.res.warnings])
  const undrafted = await go('left: the shaper deferred a finding under a paths rule with no drafted issue', ruleArgs, { ...deferredUnderRule, noDraft: ['R1-1'] })
  const undraftedCall = ((undrafted.res || {}).judgmentCalls || [])[0] || { options: [] }
  check('left: a deferral with no complete draft under a rule gets the two options, and the round does not stop for the draft', undrafted.res.status === 'handoff' && undraftedCall.options.map((o) => o.label).join('|') === `${BY_HAND}|${ACCEPT}` && undraftedCall.recommended === BY_HAND, [detail(undrafted), undraftedCall])

  // The pick. The resolve agent is told how a deferred left finding is written, the draft is
  // raised once more before it is filed, as every deferral chosen at a call is, and then filed.
  const EXCEPTION = '- The exception to what is said above of a finding left to the person: a decision carrying `rule` and `disposition` "defer" is one the person deferred to an issue (#126). No task writes anything for it either: its plan task is "Left to the person: <id>" as above, with no files. But the finding is listed under Deferred in shape.md with its drafted issue, and returned in deferred with an empty mitigation and the draft as title, found, why and fullFix: the draft its call\'s option carries, copied as written, when one does, and one you write when the call offered none. The workflow files it, and the change stays the person\'s to make.'
  const picked = await go('left: the person picks Defer to an issue', { ...ruleArgs, decisions: pickOf(DEFER, tracked) }, deferredUnderRule)
  const pickedResolve = promptOf(picked, 'resolve r1')
  const pickedDraft = ((picked.res || {}).drafts || [])[0] || {}
  check('left: a picked defer option stops once more for its draft, after the resolve and before the plan approver', picked.res.status === 'handoff' && picked.res.handoffKind === 'decisions' && JSON.stringify(picked.res.draftsNeeded) === '["R1-1"]' && pickedDraft.title === 'Lock R1-1' && pickedDraft.ships === false && pickedDraft.canFix === false && JSON.stringify(pickedDraft.files) === '[]' && labels(picked.calls).includes('resolve r1') && !labels(picked.calls).includes('plan approver r1'), [detail(picked), pickedDraft])
  check('left: the resolve prompt carries the rule, the option and the defer on the decision, and the bullet that says how a deferred left finding is written', pickedResolve.includes('"rule": "craft-config"') && pickedResolve.includes('"option": "Defer to an issue"') && pickedResolve.includes('"disposition": "defer"') && pickedResolve.includes(EXCEPTION) && pickedResolve.indexOf(EXCEPTION) > pickedResolve.indexOf('A decision carrying `rule` is on a finding a repository ask rule covers') && !pickedResolve.includes('carries `option` was answered by picking'), pickedResolve.slice(0, 3000))
  const filed = await go('left: the person picks Defer to an issue and lets the draft go ahead', { ...ruleArgs, decisions: pickOf(DEFER, tracked), deferrals: goAhead('R1-1') }, deferredUnderRule)
  samePrefix('left: the draft stop of a deferred rule call', picked.calls, filed.calls, picked.calls.length)
  const filedPrompt = promptOf(filed, 'file deferred r1')
  check('left: the draft the option carried is filed, with no commit demanded and no task planned for the finding', filed.res.status === 'done' && filedCalls(filed).join('|') === 'file deferred r1' && filedPrompt.includes('# Lock R1-1') && filedPrompt.includes('found R1-1') && !labels(filed.calls).includes('repair r1') && (filed.res.commits || []).length === 0, [detail(filed), filedPrompt.slice(0, 900)])
  const filedReply = `Redline round 1: ${LEFT} (${reason}). ${tracked} Deferred to #301. · decided by: @author`
  check('left: the reply says the change is the person\'s under the rule and names the issue', replyFor(filed.calls, 'push and reply r1', 'R1-1') === filedReply, replyFor(filed.calls, 'push and reply r1', 'R1-1'))
  const filedLine = `${LEFT}: ${tracked} Deferred to #301. · decided by: @author`
  check('left: the handoff lists it under Deferred and under Left to, each with where its draft went, and counts it as left', bodyOf(filed).includes(`### Deferred (1)\n\n- **R1-1** title R1-1: ${filedLine}\n`) && bodyOf(filed).includes(`### Left to @author (repository rules)\n\n- **R1-1** title R1-1: rule craft-config (${reason}); ${filedLine}`) && bodyOf(filed).includes('- Round 1 (pr): 1 item: 1 left to @author;'), bodyOf(filed))
  check('left: its thread is resolved once its draft is filed', promptOf(filed, 'resolve threads').includes('resolve-threads 114 100 200\n') && bodyOf(filed).includes('\n\nResolved 1 thread; 0 left open.\n'), [promptOf(filed, 'resolve threads').slice(0, 600), bodyOf(filed).slice(0, 500)])
  check('left: the result lists it as deferred with where it went, as left to the person, and as overruled by nobody', JSON.stringify((filed.res.deferred || []).map((d) => [d.id, d.where, d.number, d.ships, d.mitigation])) === '[["R1-1","issue",301,false,""]]' && JSON.stringify((filed.res.forced || []).map((x) => [x.id, x.rule, x.outcome])) === JSON.stringify([['R1-1', 'craft-config', filedLine]]) && JSON.stringify((filed.res.decided || []).filter((d) => d.id === 'R1-1').map((d) => [d.kind, d.overruled, d.decidedBy])) === '[["left",false,"@author"]]', [filed.res.deferred, filed.res.forced, filed.res.decided])
  check('left: the plan approver and the implementer are shown it as every left finding is, an ask, beside its drafted issue', shownAs(filed, 'plan approver r1', 'R1-1') === 'ask' && shownAs(filed, 'implement r1', 'R1-1') === 'ask' && promptOf(filed, 'plan approver r1').includes('"title": "Lock R1-1"') && promptOf(filed, 'plan approver r1').includes('"mitigation": ""'), [shownAs(filed, 'plan approver r1', 'R1-1'), shownAs(filed, 'implement r1', 'R1-1')])
  const besideFix = await go('left: a deferred rule call beside a fix', { ...ruleArgs, decisions: pickOf(DEFER, tracked), deferrals: goAhead('R1-1') }, { reviews: [[cfg, f('R1-2', 'correctness')], []], defer: ['R1-1'], commitIds: [['R1-2']] })
  check('left: the next review is shown it as left with where it went', besideFix.res.status === 'done' && promptOf(besideFix, 're-review r2').includes(`"outcome": "${filedLine}"`), [detail(besideFix), promptOf(besideFix, 're-review r2').slice(0, 2500)])

  // Whose draft is filed: the option's, which the person was shown before deciding. One the
  // resolve agent returns for the finding that differs is dropped with a warning; the same one
  // returned again is no difference.
  const DIFFERS = 'round 1: the resolve agent returned a drafted issue for R1-1 that differs from the one its call\'s option carries; the option\'s is filed, since the person was shown it before deciding'
  const rewritten = await go('left: the resolve agent returns another draft for a picked defer option', { ...ruleArgs, decisions: pickOf(DEFER, tracked), deferrals: goAhead('R1-1') }, { ...deferredUnderRule, resolveDeferred: [{ id: 'R1-1', mitigation: 'a guard', ...draft, title: 'Another title', found: 'found otherwise' }] })
  check('left: a draft the resolve agent returns that differs from the picked option\'s is dropped with a warning, and the option\'s is filed with no mitigation', rewritten.res.status === 'done' && (rewritten.res.warnings || []).includes(DIFFERS) && promptOf(rewritten, 'file deferred r1').includes('# Lock R1-1') && !promptOf(rewritten, 'file deferred r1').includes('Another title') && JSON.stringify((rewritten.res.deferred || []).map((d) => [d.id, d.ships, d.mitigation])) === '[["R1-1",false,""]]', [detail(rewritten), rewritten.res.deferred])
  const copied = await go('left: the resolve agent returns the option\'s draft as written', { ...ruleArgs, decisions: pickOf(DEFER, tracked), deferrals: goAhead('R1-1') }, { ...deferredUnderRule, resolveDeferred: [{ id: 'R1-1', mitigation: '', ...draft }] })
  check('left: the option\'s draft returned as written is no difference, and nothing warns', copied.res.status === 'done' && !(copied.res.warnings || []).some((w) => w.includes('differs from the one')) && replyFor(copied.calls, 'push and reply r1', 'R1-1') === filedReply, [detail(copied)])

  // The other answers leave the finding as before: by hand, accept, and the person's own words,
  // whatever they say. Nothing is filed, nothing warns, and the thread stays open.
  for (const [name, decision, notes] of [
    ['picks the change by hand', pickOf(BY_HAND, 'The author renames the field through the control panel after the merge.'), 'The author renames the field through the control panel after the merge.'],
    ['picks no change', pickOf(ACCEPT, 'The author leaves the field as it is.'), 'The author leaves the field as it is.'],
    ['answers in their own words that an issue should be filed', { 'R1-1': { choice: 'file the drafted issue and add the index by hand', notes: 'The author wants the drafted issue filed and adds the index by hand.', date: '2026-11-24' } }, 'The author wants the drafted issue filed and adds the index by hand.'],
  ]) {
    const r = await go(`left: the person ${name}`, { ...ruleArgs, decisions: decision }, deferredUnderRule)
    check(`left: when the person ${name}, nothing is filed, the reply is the left finding's as before and its thread stays open`, r.res.status === 'done' && filedCalls(r).length === 0 && (r.res.deferred || []).length === 0 && replyFor(r.calls, 'push and reply r1', 'R1-1') === `Redline round 1: ${LEFT} (${reason}). ${notes} · decided by: @author` && !promptOf(r, 'resolve r1').includes('"disposition": ') && !promptOf(r, 'resolve r1').includes(EXCEPTION) && !bodyOf(r).includes('### Deferred') && bodyOf(r).includes('\n\nResolved 0 threads; 1 left open: R1-1 (repository rule craft-config).\n') && !(r.res.warnings || []).some((w) => w.includes('is not applied')), [detail(r), replyFor(r.calls, 'push and reply r1', 'R1-1')])
  }

  // A defer typed for the finding is the other named way to defer it (at a stop, or as a changed
  // disposition on the plan dial): it is kept, where every other disposition typed for a left
  // finding is still dropped with its warning. It takes the call's draft when exactly one option
  // carries one; when none does, the resolve agent writes the draft, and a resolve that returns
  // none stops the round.
  const typedOne = await go('left: the person types a defer for a call whose one option carries a draft', { ...ruleArgs, decisions: typedDefer(), deferrals: goAhead('R1-1') }, deferredUnderRule)
  check('left: a typed defer on a finding left to the person is kept, and files the draft its call\'s one drafted option carries', typedOne.res.status === 'done' && filedCalls(typedOne).join('|') === 'file deferred r1' && promptOf(typedOne, 'file deferred r1').includes('# Lock R1-1') && replyFor(typedOne.calls, 'push and reply r1', 'R1-1') === filedReply && !(typedOne.res.warnings || []).some((w) => w.includes('is not applied')), [detail(typedOne), replyFor(typedOne.calls, 'push and reply r1', 'R1-1')])
  const planTyped = await go('left: the person changes it to defer on the plan dial', { ...ruleArgs, interrupt: 'plan', approvedPlans: [1, 2], decisions: typedDefer(), deferrals: goAhead('R1-1') }, deferredUnderRule)
  check('left: a defer typed on the plan dial for a finding left to the person is kept and filed the same way', planTyped.res.status === 'done' && filedCalls(planTyped).join('|') === 'file deferred r1' && replyFor(planTyped.calls, 'push and reply r1', 'R1-1') === filedReply, [detail(planTyped), replyFor(planTyped.calls, 'push and reply r1', 'R1-1')])
  const fixedUnderRule = { reviews: [[cfg], []], commitIds: [[]] }
  const written = { id: 'R1-1', mitigation: '', title: 'Rename the field handle', found: 'found by the resolve agent', why: 'why R1-1', fullFix: 'rename it in the control panel' }
  const typedNone = await go('left: the person types a defer for a call with no drafted option, and the resolve agent drafts the issue', { ...ruleArgs, decisions: typedDefer(), deferrals: goAhead('R1-1') }, { ...fixedUnderRule, resolveDeferred: [written] })
  check('left: a typed defer on a call that offered no draft files the one the resolve agent wrote', typedNone.res.status === 'done' && promptOf(typedNone, 'file deferred r1').includes('# Rename the field handle') && replyFor(typedNone.calls, 'push and reply r1', 'R1-1') === filedReply, [detail(typedNone), replyFor(typedNone.calls, 'push and reply r1', 'R1-1')])
  const typedBare = await go('left: the person types a defer for a call with no drafted option, and the resolve agent returns no entry', { ...ruleArgs, decisions: typedDefer() }, fixedUnderRule)
  check('left: a typed defer the resolve agent returns no drafted issue for stops at resolve, the workflow\'s own check, resumable there', typedBare.res.status === 'error' && typedBare.res.stage === 'resolve' && typedBare.res.error === 'the resolve agent returned no deferred entry for R1-1, which its decision deferred; a deferred item always carries a drafted issue' && typedBare.res.ownCheck === true && (typedBare.res.resumeFrom || {}).label === 'resolve r1', detail(typedBare))
  const typedShort = await go('left: the person types a defer for a call with no drafted option, and the resolve agent\'s draft is short', { ...ruleArgs, decisions: typedDefer() }, { ...fixedUnderRule, resolveDeferred: [{ ...written, found: '' }] })
  check('left: a typed defer whose draft the resolve agent left short stops at resolve the same way', typedShort.res.status === 'error' && typedShort.res.stage === 'resolve' && (typedShort.res.error || '').startsWith('the resolve agent deferred R1-1 with no drafted issue') && typedShort.res.ownCheck === true, detail(typedShort))
  const typedFix = await go('left: the person types a fix for it', { ...ruleArgs, decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it.', date: '2026-11-24', disposition: 'fix' } } }, deferredUnderRule)
  check('left: a fix typed for a finding left to the person is still not applied, with the warning it always had, and nothing is filed', typedFix.res.status === 'done' && (typedFix.res.warnings || []).includes('round 1: R1-1 is left to the person under repository rule craft-config; the disposition "fix" is not applied') && filedCalls(typedFix).length === 0 && !promptOf(typedFix, 'resolve r1').includes('"disposition": '), [detail(typedFix)])
  // An entry the resolve agent returns for a left finding nobody deferred is still dropped, as
  // before, with no warning.
  const stray = await go('left: the resolve agent returns a deferred entry for a finding the person takes by hand', { ...ruleArgs, decisions: pickOf(BY_HAND, 'By hand.') }, { ...deferredUnderRule, resolveDeferred: [written] })
  check('left: an entry returned for a left finding whose decision does not defer is dropped, and nothing is filed', stray.res.status === 'done' && filedCalls(stray).length === 0 && (stray.res.deferred || []).length === 0 && !promptOf(stray, 'plan approver r1').includes('Rename the field handle'), detail(stray))

  // The draft's answer: dropped, nothing is filed, the reply says so after the decision, and the
  // finding stays left, its thread open, overruled by nobody.
  const dropNotes = 'The author will not track it after all.'
  const dropAnswer = { 'R1-1': { action: 'drop', title: '', notes: dropNotes, date: '2026-11-24', draft: 1 } }
  const droppedRun = await go('left: the person picks Defer to an issue and then drops the draft', { ...ruleArgs, decisions: pickOf(DEFER, tracked), deferrals: dropAnswer }, deferredUnderRule)
  check('left: a dropped draft files nothing, its reply gives the decision and then the drop, and the thread stays open', droppedRun.res.status === 'done' && filedCalls(droppedRun).length === 0 && replyFor(droppedRun.calls, 'push and reply r1', 'R1-1') === `Redline round 1: ${LEFT} (${reason}). ${tracked} ${dropNotes} No issue was opened. · decided by: @author` && !bodyOf(droppedRun).includes('### Deferred') && bodyOf(droppedRun).includes('\n\nResolved 0 threads; 1 left open: R1-1 (repository rule craft-config).\n') && JSON.stringify((droppedRun.res.decided || []).filter((d) => d.id === 'R1-1').map((d) => [d.kind, d.overruled])) === '[["left",false]]', [detail(droppedRun), replyFor(droppedRun.calls, 'push and reply r1', 'R1-1'), bodyOf(droppedRun).slice(0, 400)])

  // Raised at the end of the run: the round holds the draft and its reply, the run stops once
  // before Finish, and the answer completes the left finding's outcome there.
  const heldRun = await go('left: a deferred rule call, drafts raised at the end of the run', { ...ruleArgs, deferAt: 'end', decisions: pickOf(DEFER, tracked) }, deferredUnderRule)
  check('left: with drafts raised at the end, the deferred rule call\'s draft and reply wait for the end-of-run stop', heldRun.res.status === 'handoff' && heldRun.res.handoffKind === 'deferred' && JSON.stringify(heldRun.res.draftsNeeded) === '["R1-1"]' && filedCalls(heldRun).length === 0 && !replies(heldRun.calls, 'push and reply r1').some((r) => r.finding === 'R1-1'), detail(heldRun))
  const heldFiled = await go('left: a deferred rule call, drafts raised at the end of the run, answered', { ...ruleArgs, deferAt: 'end', decisions: pickOf(DEFER, tracked), deferrals: goAhead('R1-1') }, deferredUnderRule)
  check('left: answered at the end, the draft is filed in Finish, the late reply names the issue, and the thread is resolved', heldFiled.res.status === 'done' && filedCalls(heldFiled).join('|') === 'file deferred r1' && replyFor(heldFiled.calls, 'deferred replies r1', 'R1-1') === filedReply && bodyOf(heldFiled).includes(`### Deferred (1)\n\n- **R1-1** title R1-1: ${filedLine}\n`) && promptOf(heldFiled, 'resolve threads').includes('resolve-threads 114 100 250\n') && JSON.stringify((heldFiled.res.decided || []).filter((d) => d.id === 'R1-1').map((d) => [d.kind, d.overruled, d.outcome])) === JSON.stringify([['left', false, filedLine]]), [detail(heldFiled), replyFor(heldFiled.calls, 'deferred replies r1', 'R1-1'), heldFiled.res.decided])
  const heldDropped = await go('left: a deferred rule call, its draft dropped at the end of the run', { ...ruleArgs, deferAt: 'end', decisions: pickOf(DEFER, tracked), deferrals: dropAnswer }, deferredUnderRule)
  check('left: dropped at the end, the finding stays left, with the drop in its late reply, and is listed as overruled by nobody', heldDropped.res.status === 'done' && filedCalls(heldDropped).length === 0 && replyFor(heldDropped.calls, 'deferred replies r1', 'R1-1') === `Redline round 1: ${LEFT} (${reason}). ${tracked} ${dropNotes} No issue was opened. · decided by: @author` && JSON.stringify((heldDropped.res.decided || []).filter((d) => d.id === 'R1-1').map((d) => [d.kind, d.overruled])) === '[["left",false]]' && !bodyOf(heldDropped).includes('### Overruled by') && bodyOf(heldDropped).includes('1 left open: R1-1 (repository rule craft-config).'), [detail(heldDropped), replyFor(heldDropped.calls, 'deferred replies r1', 'R1-1'), heldDropped.res.decided])

  // Where the draft goes is the run's setting: the spec folder, and every draft of a dry run.
  const draftPath = `${folder}/redline/issue-R1-1.md`
  const toSpec = await go('left: a deferred rule call, drafts to the spec folder', { ...ruleArgs, deferTo: 'spec', decisions: pickOf(DEFER, tracked), deferrals: goAhead('R1-1') }, deferredUnderRule)
  check('left: with drafts to the spec folder the reply names the draft\'s path, and the thread is resolved all the same', toSpec.res.status === 'done' && replyFor(toSpec.calls, 'push and reply r1', 'R1-1') === `Redline round 1: ${LEFT} (${reason}). ${tracked} The issue draft is at \`${draftPath}\`. · decided by: @author` && promptOf(toSpec, 'resolve threads').includes('resolve-threads 114 100 200\n'), [detail(toSpec), replyFor(toSpec.calls, 'push and reply r1', 'R1-1')])
  const dry = await go('left: a deferred rule call, a dry run', { ...ruleArgs, postToGitHub: false, decisions: pickOf(DEFER, tracked), deferrals: goAhead('R1-1') }, deferredUnderRule)
  check('left: a dry run writes the draft and opens nothing', dry.res.status === 'done' && promptOf(dry, 'file deferred r1').includes(`defer draft R1-1 /r/${draftPath}`) && JSON.stringify((dry.res.deferred || []).map((d) => [d.id, d.where])) === '[["R1-1","draft"]]', [detail(dry), promptOf(dry, 'file deferred r1').slice(0, 700)])

  // Autopilot leaves a rule call and files nothing, whatever its recommended option ends in:
  // its Left to line says what that option was.
  const auto = await go('left: the shaper deferred a finding under a paths rule, on autopilot', { ...ruleArgs, interrupt: 'autopilot' }, deferredUnderRule)
  check('left: on autopilot nothing is filed and nothing is asked, and the Left to line names the recommended option', auto.res.status === 'done' && filedCalls(auto).length === 0 && (auto.res.deferred || []).length === 0 && replyFor(auto.calls, 'push and reply r1', 'R1-1') === `Redline round 1: ${LEFT} (${reason}). Repository rule craft-config: ${reason}. No change made; @author makes it. · decided by: redline (autopilot)` && bodyOf(auto).includes(`- **R1-1** title R1-1: rule craft-config (${reason}); open: Defer to an issue: Lock R1-1; ${LEFT}`) && !bodyOf(auto).includes('### Deferred') && !promptOf(auto, 'resolve r1').includes('"disposition": ') && JSON.stringify((auto.res.forced || []).map((x) => x.open)) === '["open: Defer to an issue: Lock R1-1."]', [detail(auto), bodyOf(auto).slice(0, 900), auto.res.forced])

  // A rule call the shaper wrote itself, and a call on one of Redline's own files: their options
  // are the shaper's, and a defer option there carries the drafted issue.
  const own = [{ label: 'Change it by hand', cost: 'c', effect: 'e', ends: 'fix' }, { label: 'Leave it', cost: 'c', effect: 'e', ends: 'accept' }, { label: 'Track it', cost: 'c', effect: 'e', ends: 'defer', draft }]
  const shaperCall = { reviews: [[cfg], []], ask: ['R1-1'], whyHuman: { 'R1-1': 'repository rule craft-config' }, callOf: { 'R1-1': { options: own, recommended: 'Track it', recommendation: 'Track it.' } }, commitIds: [[]] }
  const shaperPicked = await go('left: a rule call the shaper wrote, its defer option picked', { ...ruleArgs, decisions: pickOf('Track it', tracked), deferrals: goAhead('R1-1') }, shaperCall)
  check('left: a defer option of a rule call the shaper wrote is filed the same way', shaperPicked.res.status === 'done' && promptOf(shaperPicked, 'file deferred r1').includes('# Lock R1-1') && replyFor(shaperPicked.calls, 'push and reply r1', 'R1-1') === filedReply, [detail(shaperPicked), replyFor(shaperPicked.calls, 'push and reply r1', 'R1-1')])
  const ownFile = f('R1-1', 'correctness', { file: '.claude/redline.json', line: 3 })
  const ownCall = { reviews: [[ownFile], []], ask: ['R1-1'], whyHuman: { 'R1-1': 'redline\'s own file' }, callOf: { 'R1-1': { options: own, recommended: 'Change it by hand', recommendation: 'Change it by hand.' } }, commitIds: [[]] }
  const ownPicked = await go('left: a call on one of Redline\'s own files, its defer option picked', { ...baseArgs, decisions: pickOf('Track it', tracked), deferrals: goAhead('R1-1') }, ownCall)
  const ownResolve = promptOf(ownPicked, 'resolve r1')
  check('left: a finding on one of Redline\'s own files is deferred the same way: its reply keeps its opening and names the issue, and its thread is resolved', ownPicked.res.status === 'done' && replyFor(ownPicked.calls, 'push and reply r1', 'R1-1') === `Redline round 1: left to @author under the rule on Redline's own files (no Redline role may write them). ${tracked} Deferred to #301. · decided by: @author` && ownResolve.includes('"own": true') && ownResolve.includes(EXCEPTION) && promptOf(ownPicked, 'resolve threads').includes('resolve-threads 114 100 200\n') && bodyOf(ownPicked).includes('### Left to @author (Redline\'s own files)') && bodyOf(ownPicked).includes('### Deferred (1)'), [detail(ownPicked), replyFor(ownPicked.calls, 'push and reply r1', 'R1-1')])

  // Where a draft is read: on an option that ends in defer of a call left to the person, and
  // there it is complete. On any other option it is dropped with a warning.
  const shortDraft = [{ ...own[0] }, { ...own[1] }, { ...own[2], draft: { title: 'Lock R1-1', fullFix: 'a lock' } }]
  const noOptionDraft = await go('left: a rule call the shaper wrote, its defer option\'s draft short', ruleArgs, { ...shaperCall, callOf: { 'R1-1': { options: shortDraft, recommended: 'Track it' } } })
  check('left: a defer option of a call left to the person with no complete draft stops at shape, the workflow\'s own check', noOptionDraft.res.status === 'error' && noOptionDraft.res.stage === 'shape' && noOptionDraft.res.error === 'the shaper gave R1-1, a call for a finding left to the person, an option that ends in defer with no complete drafted issue ("Track it": missing found, why); the person is shown the draft before deciding, and Redline files it when they pick the option' && noOptionDraft.res.ownCheck === true && (noOptionDraft.res.resumeFrom || {}).label === 'shape r1', detail(noOptionDraft))
  const bareDefer = await go('left: a rule call the shaper wrote, its defer option with no draft at all', ruleArgs, { ...shaperCall, callOf: { 'R1-1': { options: [own[0], own[1], { label: 'Track it', cost: 'c', effect: 'e', ends: 'defer' }], recommended: 'Track it' } } })
  check('left: a defer option of a call left to the person with no draft at all stops the same way', bareDefer.res.status === 'error' && bareDefer.res.stage === 'shape' && (bareDefer.res.error || '').includes('("Track it": missing title, found, why, fullFix)') && bareDefer.res.ownCheck === true, detail(bareDefer))
  const DROPPED_DRAFT = (label) => `round 1: the shaper gave R1-1's option ${JSON.stringify(label)} a drafted issue, which is read only on an option that ends in defer of a call for a finding left to the person; the draft is dropped`
  const wrongOption = await go('left: a rule call the shaper wrote, a draft on its by-hand option', ruleArgs, { ...shaperCall, callOf: { 'R1-1': { options: [{ ...own[0], draft }, own[1]], recommended: 'Change it by hand' } } })
  check('left: a draft on an option of a left call that does not end in defer is dropped with a warning', wrongOption.res.status === 'handoff' && (wrongOption.res.warnings || []).includes(DROPPED_DRAFT('Change it by hand')) && !('draft' in wrongOption.res.judgmentCalls[0].options[0]), [detail(wrongOption), (wrongOption.res.judgmentCalls || [])[0]])
  const ordinary = await go('left: an ordinary call whose defer option carries a draft', baseArgs, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], callOf: { 'R1-1': { options: [{ label: 'Keep it', cost: 'c', effect: 'e', ends: 'fix' }, { label: 'Track it', cost: 'c', effect: 'e', ends: 'defer', draft }] } }, commitIds: [['R1-1']] })
  check('left: a draft on an option of an ordinary call is dropped with a warning: its deferral is drafted by the resolve agent after the decision, as before', ordinary.res.status === 'handoff' && (ordinary.res.warnings || []).includes(DROPPED_DRAFT('Track it')) && !('draft' in ordinary.res.judgmentCalls[0].options[1]), [detail(ordinary), (ordinary.res.judgmentCalls || [])[0]])
  const draftSchema = (r, label) => (((((((pick(r.calls, label) || { opts: {} }).opts.schema || {}).properties || {}).judgmentCalls || {}).items || {}).properties || {}).options || {}).items || {}
  check('left: the shaper\'s schema lets an option carry a draft, its four fields strings, and requires none of it', JSON.stringify(Object.keys(((draftSchema(stop, 'shape r1').properties || {}).draft || {}).properties || {})) === '["title","found","why","fullFix"]' && !(draftSchema(stop, 'shape r1').required || []).includes('draft'), draftSchema(stop, 'shape r1'))
  // Every shape prompt asks for it, in the sentence that asks for the options' ends. A
  // repository with no ask rules is told of Redline's own files alone, so no rule text reaches
  // its prompts (section 12 pins that for every prompt of a run).
  const DRAFT_ASK = ', an option that ends in defer also carries draft, its drafted issue as title, found, why and fullFix, and no other option carries one'
  const LEFT_ASK = `on a call for a finding left to the person (one a repository ask rule covers, or one on a file of Redline's own)${DRAFT_ASK}`
  const OWN_ASK = `on a call for a finding on a file of Redline's own, which is left to the person${DRAFT_ASK}`
  const bounced = await go('left: a round in a repository with ask rules, its plan bounced once', ruleArgs, { reviews: [[f('R1-2', 'correctness')], []], planBounce: 1, commitIds: [['R1-2']] })
  check('left: the shape prompt and the reshape prompt ask for the draft on a left call\'s defer option, naming the rules where the repository has any', promptOf(stop, 'shape r1').includes(LEFT_ASK) && promptOf(bounced, 'reshape r1 #1').includes(LEFT_ASK), [promptOf(stop, 'shape r1').slice(-500), promptOf(bounced, 'reshape r1 #1').slice(-500)])
  check('left: in a repository with no ask rules the same ask names Redline\'s own files alone', promptOf(ownPicked, 'shape r1').includes(OWN_ASK) && !promptOf(ownPicked, 'shape r1').includes('ask rule'), promptOf(ownPicked, 'shape r1').slice(-500))

  // A human review pass: the same, and its summary names the finding once.
  const hf = { id: 'H1-1', file: 'config/project/project.yaml', line: 3, side: 'RIGHT', category: 'human', severity: 'medium', confidence: 'confirmed', title: 'comment H1-1', description: 'Rename this handle.', proposedFix: '', needsDecision: false, knownAs: '', source: '@marcamos', commentId: 905, threadId: 905, reviewId: 7 }
  const humanFolder = 'agent-os/specs/2026-10-20-1600-114-human-review-1'
  const humanArgs = (extra) => ({ ...ruleArgs, firstRound: 3, ...extra, revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: '', specFolder: humanFolder, findings: [hf], commentIds: { 'H1-1': 905 }, posted: true } })
  const humanCall = { reviews: [[]], ask: ['H1-1'], whyHuman: { 'H1-1': 'repository rule craft-config' }, callOf: { 'H1-1': { options: [own[0], own[1], { ...own[2], draft: { title: 'Lock H1-1', found: 'found H1-1', why: 'why H1-1', fullFix: 'a lock' } }], recommended: 'Change it by hand', recommendation: 'Change it by hand.' } }, commitIds: [[]] }
  const humanPicked = await go('left: a human pass, the author defers a comment a rule covers', humanArgs({ decisions: pickOf('Track it', 'The author tracks the rename in an issue.', 'H1-1'), deferrals: goAhead('H1-1') }), humanCall)
  check('left: in a human pass the deferred rule call is filed, and its reply keeps the pass\'s wording and names the issue', humanPicked.res.status === 'done' && replyFor(humanPicked.calls, 'push and reply h1', 'H1-1') === `Redline human review 1: left to the author under repository rule craft-config (${reason}). The author tracks the rename in an issue. Deferred to #301. · decided by: @author\n\n<!-- redline:answers 905 -->`, [detail(humanPicked), replyFor(humanPicked.calls, 'push and reply h1', 'H1-1')])
  check('left: a human pass\'s shape prompt asks for the draft on a left call\'s defer option too', promptOf(humanPicked, 'shape h1').includes(LEFT_ASK), promptOf(humanPicked, 'shape h1').slice(-500))
  const summary = pick(humanPicked.calls, 'summary comment') ? comment(humanPicked.calls, 'summary comment') : ''
  check('left: the human pass\'s summary names the finding once, as left under the rule with where its draft went', summary === 'Redline human review 1 · review by @marcamos: nothing to fix; H1-1 left to @author under repository rule craft-config (H1-1 deferred to #301). No fix was committed, so no final nit pass.', summary)

  // However it came to be left (table C, row 21): a call the person answered with a deferral,
  // whose draft they let go ahead, that a reshape then puts under a rule. Until this spec the
  // approved draft was not filed and nothing warned. A fix or an accept a reshape puts under a
  // rule is as before (`forcedLater`, `forcedNamed` above).
  const billing = [{ id: 'billing', when: { prose: 'the change alters what a customer is charged' }, reason: 'Billing changes are reviewed by finance' }]
  const guard = { id: 'R1-1', mitigation: 'a guard', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }
  const later = { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeAskRule: { 'R1-1': 'billing' }, resolveDeferred: [guard], commitIds: [[], []] }
  const namedLater = await go('left: a call whose decision names defer, its draft approved, left to the person under a rule by a reshape', { ...baseArgs, askRules: billing, decisions: typedDefer(), deferrals: goAhead('R1-1') }, later)
  check('left: a deferral the person approved is filed when a reshape then leaves its finding to the person under a rule, and the reply says both', namedLater.res.status === 'done' && filedCalls(namedLater).join('|') === 'file deferred r1' && replyFor(namedLater.calls, 'push and reply r1', 'R1-1') === `Redline round 1: left to @author under repository rule billing (Billing changes are reviewed by finance). ${tracked} Deferred to #301. · decided by: @author`, [detail(namedLater), replyFor(namedLater.calls, 'push and reply r1', 'R1-1')])
  const statedLater = await go('left: a call answered in the person\'s own words and stated as a deferral, left to the person under a rule by a reshape', { ...baseArgs, askRules: billing, decisions: { 'R1-1': { choice: 'mitigate it behind a guard', notes: tracked, date: '2026-11-24' } }, deferrals: goAhead('R1-1') }, later)
  check('left: the same holds for a deferral the resolve agent stated', statedLater.res.status === 'done' && filedCalls(statedLater).join('|') === 'file deferred r1' && replyFor(statedLater.calls, 'push and reply r1', 'R1-1').endsWith(`${tracked} Deferred to #301. · decided by: @author`) && replyFor(statedLater.calls, 'push and reply r1', 'R1-1').startsWith('Redline round 1: left to @author under repository rule billing'), [detail(statedLater), replyFor(statedLater.calls, 'push and reply r1', 'R1-1')])

  // The statements an agent and a reader meet.
  const shaperAgent = read('agents', 'redline-shaper.md')
  const resolveAgent = read('agents', 'redline-resolve.md')
  const approverAgent = read('agents', 'redline-plan-approver.md')
  const skill = read('skills', 'redline', 'SKILL.md')
  check('left: the shaper\'s file says a left call may offer an option that ends in defer, carrying the drafted issue, for a rule and for Redline\'s own files', shaperAgent.includes('an option that ends in `defer` and carries its drafted issue in `draft`') && shaperAgent.includes('never `fix`, `decline` or `defer`') && shaperAgent.split('carries its drafted issue in `draft`').length === 3, 'agents/redline-shaper.md')
  check('left: the resolve agent\'s file says how a left finding the person deferred is written and returned', resolveAgent.includes('The exception is a decision that also carries `disposition` `defer`') && resolveAgent.includes('returned in `deferred` with an empty `mitigation`'), 'agents/redline-resolve.md')
  check('left: the plan approver\'s file says a left finding the person deferred has its drafted issue and still no task with files', approverAgent.includes('When that decision also carries `disposition` `defer`, the person deferred the finding to an issue'), 'agents/redline-plan-approver.md')
  check('left: the skill shows a left call\'s defer option with its draft\'s title, records a typed defer for it, and says back that any other wording files nothing', skill.includes('shown with its draft\'s title') && skill.includes('`<id>: defer. <reason>` typed for such a finding is recorded with `"disposition": "defer"`') && skill.includes('nothing is filed for it') && skill.includes('its thread is resolved once the draft is filed'), 'skills/redline/SKILL.md')
  check('left: the result tells a relaunching session how a finding left to the person is deferred', stop.res.relaunch.how.includes('A finding left to the person (forced not null) is deferred to an issue by a pick of its option that ends in defer, or by "disposition": "defer" typed for it'), stop.res.relaunch.how)
}

check('no prompt of any scenario holds a For the person section or asks for a forThePerson list', forThePerson.length === 0, forThePerson.slice(0, 5))
check('no shaper prompt of any scenario names decided findings unless the plan approver before it was shown a decision', strayDecidedBlock.length === 0, strayDecidedBlock.slice(0, 5))
check('no reshape prompt that names decided findings asks an ask for its recommended paths in a clause that covers them too', doubleFilesAsk.length === 0, doubleFilesAsk.slice(0, 5))
check('every error result of every scenario says in ownCheck whether its stop was the workflow\'s own check of what an agent returned: true for the stops of the sites listed, false for every other', ownWrong.length === 0, [ownWrong.length, ownWrong.slice(0, 5)])
check('no reshape prompt of any scenario tells the shaper to rewrite the spec folder from scratch', rewrittenReshape.length === 0, rewrittenReshape.slice(0, 5))
check('no prompt of a run that passes no resume entry holds the resume line or one of its clauses', strayResumeWords.length === 0, strayResumeWords.slice(0, 5))
check('each stop that is the workflow\'s own check is reached by a scenario, resumable and with ownCheck true', OWN_CHECKS.every((k) => k.seen > 0), OWN_CHECKS.filter((k) => k.seen === 0).map((k) => String(k.re)))

console.log(`\n${passed} checks passed, ${failures.length} failed`)
for (const failure of failures) {
  console.log(`  FAIL ${failure}`)
}
process.exit(failures.length ? 1 : 0)
