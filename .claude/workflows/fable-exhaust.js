export const meta = {
  name: 'fable-exhaust',
  description: 'Loop-until-dry discovery: waves of diverse finders keep sweeping until two consecutive rounds surface nothing new; every fresh finding faces a three-lens judge panel',
  whenToUse: 'Exhaustive audits of unknown size: "find all the bugs", "audit this module", "what edge cases are unhandled". args: { hunt?: string, scope?: string } or a plain string describing the hunt',
  phases: [
    { title: 'Find' },
    { title: 'Verify' },
  ],
}

const input = typeof args === 'string' ? { hunt: args } : (args || {})
const hunt = input.hunt || 'defects: logic bugs, unhandled edge cases, race conditions, resource leaks, and security flaws'
const scope = input.scope || 'the entire repository'

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

const BUGS = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'line', 'title', 'detail'],
        properties: {
          file: { type: 'string', description: 'repo-relative path' },
          line: { type: 'integer', description: '1-indexed anchor line' },
          title: { type: 'string', description: 'one-sentence statement of the finding' },
          detail: { type: 'string', description: 'concrete failure scenario' },
        },
      },
    },
  },
}

const VERDICT = {
  type: 'object',
  required: ['refuted', 'evidence'],
  properties: {
    refuted: { type: 'boolean', description: 'true if the finding is wrong, cannot occur, or is intended behavior' },
    evidence: { type: 'string', description: 'the decisive evidence, with path:line citations' },
  },
}

const LENSES = [
  'correctness: trace the claimed failure scenario line by line through the real code — does it actually happen?',
  'reproduction: can this actually be triggered from real entry points, or is it guarded upstream / unreachable?',
  'impact: is the consequence as claimed, or benign in context (intended behavior, dead code, test-only path)?',
]

// Must stay single-line — the drift checker compares this line byte-for-byte across workflows.
const CONTRAST = 'First state the strongest concrete case that the claim is REAL, then the strongest case that it is NOT, then decide: set refuted=true only if the against-case wins under your lens, citing the decisive evidence.'

const STANCES = [
  'read the least-tested code first — anything without test coverage',
  'trace data from every external input to the point where it is trusted',
  'hunt state: initialization order, caching, concurrency, teardown, partial failure',
  'hunt boundaries: empty, zero, negative, maximum, unicode, malformed input',
]

// Fleet scaling — every bound is announced up front, per the no-silent-caps rule.
const stances = fleet === 'light' ? STANCES.slice(0, 2) : STANCES
const panel = fleet === 'light' ? LENSES.slice(0, 1) : LENSES
const need = fleet === 'light' ? 1 : 2
const MAX_ROUNDS = cfg.max_rounds || { light: 3, standard: 6, max: 8 }[fleet]
log('fleet ' + fleet + ': ' + stances.length + ' finder stances per round, ' + panel.length + '-lens verification, round cap ' + MAX_ROUNDS)

const key = b => b.file + ':' + b.line + ':' + b.title.toLowerCase().slice(0, 60)
const seen = new Set()
// Locations only (no titles) — this set is re-broadcast to every finder each round,
// so it must stay small; the finders need "don't re-report here", not the details.
const seenLocs = new Set()
const confirmed = []
let round = 0
let dry = 0

while (dry < 2 && round < MAX_ROUNDS && (!budget.total || budget.remaining() > 40_000)) {
  round++
  const found = (await parallel(stances.map((stance, i) => () =>
    run(
      'Hunt for ' + hunt + ' in ' + scope + '. Round ' + round + '. Your stance: ' + stance + '.' +
      (seenLocs.size ? '\nAlready found — do NOT re-report findings at these locations: ' + Array.from(seenLocs).slice(-200).join('; ') : ''),
      { label: 'find:r' + round + 's' + (i + 1), phase: 'Find', schema: BUGS, agentType: 'fable-finder' }
    )
  ))).filter(Boolean).flatMap(r => r.findings || [])

  const fresh = found.filter(b => !seen.has(key(b)))
  if (!fresh.length) {
    dry++
    log('round ' + round + ': nothing new (' + dry + '/2 dry rounds)')
    continue
  }
  dry = 0
  fresh.forEach(b => { seen.add(key(b)); seenLocs.add(b.file + ':' + b.line) })

  const judged = await parallel(fresh.map(b => () =>
    parallel(panel.map(lens => () =>
      run(
        'Claimed finding in ' + b.file + ':' + b.line + ' — "' + b.title + '". Scenario: ' + b.detail + '\n' +
        'Judge it through ONE lens only — ' + lens + '\n' +
        CONTRAST,
        { label: 'verify:' + b.file + ':' + b.line, phase: 'Verify', schema: VERDICT, agentType: 'fable-skeptic' }
      )))
      .then(vs => ({ b, real: vs.filter(v => v && v.refuted === false).length >= need }))
  ))
  const kept = judged.filter(j => j.real).map(j => j.b)
  confirmed.push(...kept)
  log('round ' + round + ': ' + found.length + ' reported, ' + fresh.length + ' fresh, ' + kept.length + ' confirmed (total ' + confirmed.length + ')')
}

const ranDry = dry >= 2
if (!ranDry && round >= MAX_ROUNDS) log('stopped at the round cap (' + MAX_ROUNDS + ') before running dry — coverage may be incomplete')
if (!ranDry && budget.total && budget.remaining() <= 40_000) log('stopped by the token budget before running dry — coverage may be incomplete')

return { confirmed, rounds: round, ranDry }
