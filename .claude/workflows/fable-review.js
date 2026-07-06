export const meta = {
  name: 'fable-review',
  description: 'Review a change set across independent dimensions, then adversarially verify every finding',
  whenToUse: 'Code review of a diff, branch, PR, or directory. args: { target?: string, votes?: number } or a plain string describing the target',
  phases: [
    { title: 'Review', detail: 'one finder per dimension' },
    { title: 'Verify', detail: 'independent skeptics attempt to refute each finding' },
  ],
}

const input = typeof args === 'string' ? { target: args } : (args || {})
const target = input.target ||
  'the uncommitted working-tree changes (run `git status` and `git diff HEAD` to see them); if the tree is clean, review the most recent commit (`git show HEAD`)'
const votes = input.votes || 3
const needed = Math.floor(votes / 2) + 1

const FINDINGS = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'line', 'title', 'detail', 'severity'],
        properties: {
          file: { type: 'string', description: 'repo-relative path' },
          line: { type: 'integer', description: '1-indexed line the finding anchors to' },
          title: { type: 'string', description: 'one-sentence statement of the defect' },
          detail: { type: 'string', description: 'concrete failure scenario: specific inputs/state that produce specific wrong behavior' },
          severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
        },
      },
    },
  },
}

const VERDICT = {
  type: 'object',
  required: ['refuted', 'reasoning'],
  properties: {
    refuted: { type: 'boolean', description: 'true if the finding is wrong, cannot occur, or is intended behavior' },
    reasoning: { type: 'string', description: 'the decisive evidence, with path:line citations' },
  },
}

const DIMENSIONS = [
  { key: 'correctness', focus: 'logic bugs: wrong conditionals, off-by-one, inverted checks, broken state transitions, unhandled edge cases (empty, null, zero, unicode, concurrent access)' },
  { key: 'contracts', focus: 'breakage at the boundaries of the change: callers of changed functions, changed types/signatures, API and serialization compatibility, migrations, config' },
  { key: 'security', focus: 'injection, authz/authn gaps, secrets in code, unsafe deserialization, path traversal, SSRF, XSS, race conditions with security impact' },
  { key: 'resources', focus: 'performance and resource handling: leaks, unbounded growth, N+1 queries, missing timeouts or cancellation, blocking calls on hot paths' },
]

const perDimension = await pipeline(
  DIMENSIONS,
  d => agent(
    'Review ' + target + '.\n\n' +
    'Focus exclusively on this dimension: ' + d.focus + '.\n\n' +
    'Never report a finding from the diff alone — open the surrounding file and confirm the defect is real in context. ' +
    'Report only defects with a concrete failure scenario. Do not report style, naming, or hypothetical hardening.',
    { label: 'find:' + d.key, phase: 'Review', schema: FINDINGS, agentType: 'fable-finder' }
  ),
  (review, d) => {
    const findings = (review && review.findings) || []
    if (!findings.length) return []
    return parallel(findings.map(f => () =>
      parallel(Array.from({ length: votes }, (_, i) => () =>
        agent(
          'A reviewer claims this defect in ' + f.file + ' line ' + f.line + ' (dimension: ' + d.key + '):\n' +
          '"' + f.title + '"\n' +
          'Claimed failure scenario: ' + f.detail + '\n\n' +
          'Your job is to REFUTE it (independent attempt ' + (i + 1) + ' of ' + votes + '). ' +
          'Read the code, trace the failure scenario, run it if practical. ' +
          'If the defect cannot actually occur, is intended behavior, or the scenario misreads the code, set refuted=true. ' +
          'If you cannot decide either way, default to refuted=true.',
          { label: 'verify:' + f.file + ':' + f.line, phase: 'Verify', schema: VERDICT, agentType: 'fable-skeptic' }
        )))
        .then(vs => ({ ...f, dimension: d.key, upheld: vs.filter(Boolean).filter(v => !v.refuted).length >= needed }))
    ))
  }
)

const all = perDimension.filter(Boolean).flat().filter(Boolean)
const order = { critical: 0, major: 1, minor: 2 }
const confirmed = all.filter(f => f.upheld).sort((a, b) => order[a.severity] - order[b.severity])
log(confirmed.length + ' of ' + all.length + ' raw findings survived adversarial verification (' + votes + ' skeptics each, ' + needed + ' upholds to survive)')

return {
  confirmed,
  refuted: all.filter(f => !f.upheld).map(f => f.file + ':' + f.line + ' — ' + f.title),
}
