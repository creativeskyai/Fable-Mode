export const meta = {
  name: 'fable-ship',
  description: 'Release-readiness gate: detect the project checks, run every gate in parallel, then a skeptic attacks the readiness claim',
  whenToUse: 'Before shipping, releasing, or deploying. Verifies readiness and reports blockers with evidence — it never deploys. args: { scope?: string } or a plain string describing what is being shipped',
  phases: [
    { title: 'Detect' },
    { title: 'Gate', detail: 'build, tests, repo hygiene, docs — in parallel' },
    { title: 'Challenge', detail: 'skeptic attacks the readiness claim' },
  ],
}

const input = typeof args === 'string' ? { scope: args } : (args || {})
const scope = input.scope || 'the current state of this repository'

// Falls back to the default agent when the pack's agents aren't registered yet
// (agent types load at session start — a fresh install needs a restart).
const run = (prompt, opts) => agent(prompt, opts).catch(e => {
  if (!opts.agentType || !String(e).includes('not found')) throw e
  log(opts.agentType + ' not registered (restart the session after installing the pack) — using the default agent')
  return agent(prompt, { ...opts, agentType: undefined })
})

const MECH = {
  type: 'object',
  required: ['commands'],
  properties: {
    commands: {
      type: 'array',
      items: {
        type: 'object',
        required: ['purpose', 'command'],
        properties: {
          purpose: { type: 'string', description: 'e.g. build, test, lint, package' },
          command: { type: 'string', description: 'the exact command to run' },
        },
      },
    },
    notes: { type: 'string', description: 'release mechanics worth knowing: versioning scheme, changelog, CI config, deploy targets' },
  },
}

const READINESS = {
  type: 'object',
  required: ['ready', 'blockers', 'warnings'],
  properties: {
    ready: { type: 'boolean' },
    blockers: { type: 'array', items: { type: 'string' }, description: 'must fix before shipping, each with evidence' },
    warnings: { type: 'array', items: { type: 'string' }, description: 'should know before shipping, each with evidence' },
  },
}

phase('Detect')
const mech = await run(
  'Shipping ' + scope + '. Detect this project\'s verification mechanics: build, test, lint, and packaging commands ' +
  '(from package.json scripts, Makefile, CI config, or equivalents). Also note release mechanics: versioning scheme, ' +
  'changelog convention, deploy configuration. Return the exact commands to run.',
  { label: 'detect', schema: MECH, agentType: 'fable-scout' }
)
const commands = (mech && mech.commands) || []
log(commands.length + ' project check(s) detected' + (commands.length ? ': ' + commands.map(c => c.purpose).join(', ') : ' — gates will note the absence'))

const GATES = [
  {
    key: 'checks',
    prompt: 'Shipping ' + scope + '. Run each of these project checks and report every outcome verbatim — do not fix anything:\n' +
      (commands.length ? commands.map(c => c.purpose + ': ' + c.command).join('\n') : '(none detected — say so and report what you would have expected to find)'),
  },
  {
    key: 'hygiene',
    prompt: 'Shipping ' + scope + '. Audit repo hygiene: uncommitted or untracked files that should be in (or out of) the release, ' +
      'version/changelog consistency with recent changes, leftover debug code or TODO markers in the shipping surface, ' +
      'and anything staged that looks like a secret. Report with path:line evidence.',
  },
  {
    key: 'docs',
    prompt: 'Shipping ' + scope + '. Check that README, usage docs, and any install/upgrade instructions still match current behavior ' +
      'for what is being shipped. Report only real mismatches, with path:line evidence.',
  },
]

const reports = await parallel(GATES.map(g => () =>
  run(g.prompt, { label: 'gate:' + g.key, phase: 'Gate', agentType: g.key === 'checks' ? undefined : 'fable-scout' })
    .then(r => ({ gate: g.key, report: r }))
))

const gateReports = reports.filter(Boolean)

phase('Challenge')
const verdict = await run(
  'Shipping ' + scope + '. Release notes from the gate agents:\n\n' +
  gateReports.map(r => '--- ' + r.gate + ' ---\n' + r.report).join('\n\n') +
  ((mech && mech.notes) ? '\n\nRelease mechanics: ' + mech.notes : '') +
  '\n\nYou are the skeptic attacking the claim "this is ready to ship". What is unverified, what failed, what would break ' +
  'in production that these reports gloss over? ready=true only if every gate holds on positive evidence. ' +
  'Blockers and warnings must each cite their evidence.',
  { label: 'challenge', phase: 'Challenge', schema: READINESS, agentType: 'fable-skeptic' }
)

if (!verdict) return { ready: false, blockers: ['the readiness skeptic did not complete — treat as not ready'], warnings: [], gateReports }
log(verdict.ready ? 'ready to ship (' + verdict.warnings.length + ' warnings)' : 'NOT ready: ' + verdict.blockers.length + ' blocker(s)')
return { ready: verdict.ready, blockers: verdict.blockers, warnings: verdict.warnings, gateReports }
