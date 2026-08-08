export const meta = {
  name: 'fable-design',
  description: 'Generate competing designs from divergent stances, score them with a judge panel, synthesize the winner',
  whenToUse: 'Architecture or implementation-approach decisions where the solution space is wide. args: { question: string } or a plain string',
  phases: [
    { title: 'Design', detail: 'independent approaches from divergent stances' },
    { title: 'Judge', detail: 'each judge scores every approach on one rubric' },
    { title: 'Synthesize' },
  ],
}

const input = typeof args === 'string' ? { question: args } : (args || {})
const question = input.question
if (!question) throw new Error('fable-design requires a design question — pass args: { question: "..." }')

// Config arrives via args.config — the skills read .claude/fable/CONFIG.md and pass it.
// sub() applies the configured subagent model/effort to every agent call in run().
const cfg = (input && input.config && typeof input.config === 'object') ? input.config : {}
const fleet = ['light', 'standard', 'max'].includes(cfg.fleet) ? cfg.fleet : 'standard'
const sub = opts => ({
  ...opts,
  ...(cfg.subagent_model && cfg.subagent_model !== 'inherit' ? { model: cfg.subagent_model } : {}),
  ...(cfg.subagent_effort && cfg.subagent_effort !== 'inherit' ? { effort: cfg.subagent_effort } : {}),
})
if (cfg.subagent_model || cfg.subagent_effort || cfg.fleet) log('config: subagents on ' + (cfg.subagent_model || 'the session model') + ' at ' + (cfg.subagent_effort || 'session') + ' effort, fleet ' + fleet)

// Falls back to the default agent when the pack's agents aren't registered yet
// (agent types load at session start — a fresh install needs a restart).
const run = (prompt, opts) => agent(prompt, sub(opts)).catch(e => {
  if (!opts.agentType || !String(e).includes('not found')) throw e
  log(opts.agentType + ' not registered (restart the session after installing the pack) — using the default agent')
  return agent(prompt, { ...sub(opts), agentType: undefined })
})

const APPROACH = {
  type: 'object',
  required: ['summary', 'design', 'tradeoffs'],
  properties: {
    summary: { type: 'string', description: 'one-paragraph pitch' },
    design: { type: 'string', description: 'the full design: components, data flow, key files to touch, sequencing' },
    tradeoffs: { type: 'string', description: 'what this design sacrifices and where it will hurt' },
  },
}

const SCORES = {
  type: 'object',
  required: ['scores'],
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        required: ['approach', 'score', 'evidence'],
        properties: {
          approach: { type: 'integer', description: 'index of the approach being scored' },
          score: { type: 'integer', description: '1 to 10, using the full range' },
          evidence: { type: 'string', description: 'what in the code or design grounds this score' },
        },
      },
    },
  },
}

const STANCES = [
  'simplicity-first: the smallest design that fully solves the problem; prefer boring, proven mechanisms',
  'robustness-first: design from the failure modes backwards; make the hard edge cases first-class citizens',
  'evolution-first: optimize for how this will be extended and maintained over the next year',
]

const stances = fleet === 'light' ? STANCES.slice(0, 2) : STANCES
if (stances.length < STANCES.length) log('fleet light: ' + stances.length + ' of ' + STANCES.length + ' design stances (evolution-first dropped)')

const approaches = (await parallel(stances.map((stance, i) => () =>
  run(
    'Design question: ' + question + '\n\n' +
    'Explore the codebase first so the design is grounded in what actually exists — cite real files. ' +
    'Then produce ONE complete design, taking this stance: ' + stance + '. ' +
    'Commit to the stance; do not hedge toward a middle ground. Honest tradeoffs make the panel work.',
    { label: 'design:' + (i + 1), phase: 'Design', schema: APPROACH }
  )
))).filter(Boolean)

if (!approaches.length) throw new Error('no design approaches were produced')

// Each judge sees the approaches in a different order (rotated by judge index —
// the sandbox bans Math.random) so no approach always enjoys first position.
// Approach numbers in the headers stay canonical; scores key off them, not position.
const card = i => '--- Approach ' + i + ' ---\n' + approaches[i].summary + '\n\n' + approaches[i].design + '\n\nTradeoffs: ' + approaches[i].tradeoffs
const briefFor = offset => approaches.map((_, k) => card((k + offset) % approaches.length)).join('\n\n')
const brief = briefFor(0)

const RUBRICS = ['correctness and edge-case coverage', 'implementation cost and risk', 'long-term maintainability']
const rubrics = fleet === 'light' ? RUBRICS.slice(0, 2) : RUBRICS
if (rubrics.length < RUBRICS.length) log('fleet light: ' + rubrics.length + ' of ' + RUBRICS.length + ' judge rubrics (maintainability dropped)')

const judgments = (await parallel(rubrics.map((rubric, j) => () =>
  run(
    'Design question: ' + question + '\n\n' + briefFor(j) + '\n\n' +
    'Presentation order is arbitrary — the approach number in each header, not position, identifies a candidate. ' +
    'Score EVERY approach from 1 to 10 on this single rubric: ' + rubric + '.',
    { label: 'judge:' + rubric.split(' ')[0], phase: 'Judge', schema: SCORES, agentType: 'fable-judge' }
  )
))).filter(Boolean)

if (!judgments.length) throw new Error('no judge scores were produced — an unjudged winner would be arbitrary; re-run fable-design')

const totals = approaches.map((_, i) =>
  judgments.reduce((sum, j) => {
    const s = (j.scores || []).find(x => x.approach === i)
    return sum + (s ? s.score : 0)
  }, 0)
)
const winner = totals.indexOf(Math.max(...totals))
log('judge panel totals: [' + totals.join(', ') + '] — approach ' + winner + ' wins')

const final = await run(
  'Design question: ' + question + '\n\n' + brief + '\n\n' +
  'Judge panel totals per approach: ' + JSON.stringify(totals) + '. Approach ' + winner + ' won.\n\n' +
  'Write the final design: start from the winning approach, graft in any clearly superior ideas from the runners-up, ' +
  'and resolve the weaknesses the judges flagged. Deliver a concrete implementation plan: files to change, in what order, with what tests.',
  { label: 'synthesize', phase: 'Synthesize', agentType: 'fable-scribe' }
)

return { design: final, totals, winner }
