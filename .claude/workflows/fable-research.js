export const meta = {
  name: 'fable-research',
  description: 'Answer a question about the repo via a multi-modal search sweep, deep-reads of every lead, a cited synthesis, and a completeness critic',
  whenToUse: 'Questions where one search angle will miss things: "where is X handled", "what breaks if Y changes", "how does Z really work". args: { question: string } or a plain string',
  phases: [
    { title: 'Sweep', detail: 'parallel searchers, each blind to the others' },
    { title: 'Deep-read' },
    { title: 'Synthesize' },
    { title: 'Critique' },
  ],
}

const question = typeof args === 'string' ? args : (args && args.question)
if (!question) throw new Error('fable-research requires a question — pass args: { question: "..." }')

const LEADS = {
  type: 'object',
  required: ['leads'],
  properties: {
    leads: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'why'],
        properties: {
          file: { type: 'string', description: 'repo-relative path' },
          why: { type: 'string', description: 'why this file matters to the question' },
        },
      },
    },
  },
}

const GAPS = {
  type: 'object',
  required: ['complete', 'gaps'],
  properties: {
    complete: { type: 'boolean' },
    gaps: { type: 'array', items: { type: 'string' }, description: 'specific unanswered sub-questions or unread sources' },
  },
}

const MODES = [
  { key: 'names', how: 'search identifiers: function, class, and variable names related to the question, and their call sites' },
  { key: 'content', how: 'search string literals, log messages, error messages, comments, and docs' },
  { key: 'structure', how: 'search types, interfaces, schemas, config files, and dependency manifests' },
  { key: 'history', how: 'search git history: git log -S, git blame, and recent commits touching related code' },
  { key: 'tests', how: 'search test files — treat tests as the executable specification of behavior' },
]

phase('Sweep')
const sweeps = (await parallel(MODES.map(m => () =>
  agent(
    'Research question: ' + question + '\n\n' +
    'Find every file relevant to this question using ONLY this search modality: ' + m.how + '. ' +
    'Other searchers cover other modalities — do not generalize beyond yours. Return each relevant file once, with why it matters.',
    { label: 'sweep:' + m.key, phase: 'Sweep', schema: LEADS, agentType: 'fable-scout' }
  )
))).filter(Boolean)

const byFile = new Map()
for (const s of sweeps) for (const l of s.leads) if (!byFile.has(l.file)) byFile.set(l.file, l)
let leads = Array.from(byFile.values())
log(leads.length + ' unique leads from ' + sweeps.length + ' sweep modalities')

const MAX_LEADS = 30
if (leads.length > MAX_LEADS) {
  log('capping deep-read at ' + MAX_LEADS + ' of ' + leads.length + ' leads — ' + (leads.length - MAX_LEADS) + ' dropped (will be named in the final report)')
  leads = leads.slice(0, MAX_LEADS)
}

const readings = await pipeline(
  leads,
  l => agent(
    'Research question: ' + question + '\n\n' +
    'Read ' + l.file + ' (a lead because: ' + l.why + ') plus whatever it directly pulls in that bears on the question. ' +
    'Report exactly what this file contributes to the answer, with path:line citations. Say "nothing relevant" if the lead is a dead end.',
    { label: 'read:' + l.file, phase: 'Deep-read', agentType: 'fable-scout' }
  )
)

phase('Synthesize')
const draft = await agent(
  'Research question: ' + question + '\n\nEvidence from ' + leads.length + ' sources:\n\n' +
  readings.map((r, i) => r ? '--- ' + leads[i].file + ' ---\n' + r : '').filter(Boolean).join('\n\n') +
  '\n\nWrite the answer. Every claim gets a path:line citation. Separate what the evidence establishes from what remains uncertain.',
  { label: 'synthesize', agentType: 'fable-scribe' }
)

phase('Critique')
const critique = await agent(
  'Research question: ' + question + '\n\nDraft answer:\n' + draft + '\n\n' +
  'You are the completeness critic. What is missing — a modality not searched, a claim without a citation, ' +
  'an obvious source unread, a sub-question quietly dropped? Verify each suspicion against the repo before reporting it.',
  { label: 'critic', schema: GAPS, agentType: 'fable-critic' }
)

if (critique && !critique.complete && critique.gaps.length) {
  log('critic found ' + critique.gaps.length + ' gaps — running a follow-up round')
  const followups = await pipeline(
    critique.gaps.slice(0, 6),
    g => agent(
      'Research question: ' + question + '\n\nClose this specific gap with path:line evidence: ' + g,
      { label: 'gap:' + g.slice(0, 40), phase: 'Critique', agentType: 'fable-scout' }
    )
  )
  if (critique.gaps.length > 6) log('only the first 6 of ' + critique.gaps.length + ' gaps were followed up')
  return await agent(
    'Merge these follow-up findings into the draft answer. Keep every citation.\n\nDraft:\n' + draft + '\n\nFollow-ups:\n' +
    followups.map((f, i) => f ? '--- gap: ' + critique.gaps[i] + ' ---\n' + f : '').filter(Boolean).join('\n\n'),
    { label: 'final', phase: 'Critique', agentType: 'fable-scribe' }
  )
}

return draft
