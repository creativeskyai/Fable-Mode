export const meta = {
  name: 'fable-migrate',
  description: 'Discover every site matching a described change, transform each file independently, verify each, then run the project checks once',
  whenToUse: 'Mechanical-but-large changes: rename or replace an API across the repo, migrate a pattern, apply a fix everywhere. args: { instruction: string, verify?: string } or a plain string instruction',
  phases: [
    { title: 'Discover' },
    { title: 'Transform' },
    { title: 'Check', detail: 'independent verification of each transformed file' },
    { title: 'Final verify' },
  ],
}

const input = typeof args === 'string' ? { instruction: args } : (args || {})
if (!input.instruction) throw new Error('fable-migrate requires args: { instruction: "..." }')
const verifyCmd = input.verify ||
  "the project's documented build and test commands (read the root CLAUDE.md and its @path imports and AGENTS.md first; " +
  "detect from package.json scripts, Makefile, or CI config only if the docs name none)"

// Falls back to the default agent when the pack's agents aren't registered yet
// (agent types load at session start — a fresh install needs a restart).
const run = (prompt, opts) => agent(prompt, opts).catch(e => {
  if (!opts.agentType || !String(e).includes('not found')) throw e
  log(opts.agentType + ' not registered (restart the session after installing the pack) — using the default agent')
  return agent(prompt, { ...opts, agentType: undefined })
})

const SITES = {
  type: 'object',
  required: ['files'],
  properties: {
    files: { type: 'array', items: { type: 'string' }, description: 'repo-relative paths of every file that needs the change' },
  },
}

const CHECK = {
  type: 'object',
  required: ['ok', 'problems'],
  properties: {
    ok: { type: 'boolean' },
    problems: { type: 'string', description: 'empty string when ok; otherwise what is wrong, with path:line' },
  },
}

phase('Discover')
// Kept word-for-word in sync with the shared modalities in fable-research.js (which
// adds a fifth, git-history modality) — a diff between the lists should show only
// the intended differences.
const MODES = [
  'search identifiers: function, class, and variable names involved in the change, and their call sites',
  'search string literals, log messages, error messages, comments, and docs',
  'search types, interfaces, schemas, config files, and dependency manifests',
  'search test files — treat tests as the executable specification of behavior',
]
const discoveries = (await parallel(MODES.map((how, i) => () =>
  run(
    'Migration: ' + input.instruction + '\n\n' +
    'Find every file that needs to change, searching ONLY this modality: ' + how + '. ' +
    'Other searchers cover other modalities — do not generalize beyond yours. ' +
    'Err toward including a file the transformer can reject over missing one.',
    { label: 'discover:' + (i + 1), phase: 'Discover', schema: SITES, agentType: 'fable-scout' }
  )
))).filter(Boolean)

const fileSet = new Set()
for (const d of discoveries) for (const f of d.files || []) fileSet.add(f)
const files = Array.from(fileSet)
if (!files.length) {
  log('discovery found no files needing this migration')
  return { transformed: 0, perFileProblems: [], suiteReport: 'skipped — nothing to migrate' }
}
log(files.length + ' unique files to transform (from ' + discoveries.length + ' discovery modalities)')

const results = await pipeline(
  files,
  f => run(
    'Apply this migration to ' + f + ' and ONLY this file: ' + input.instruction + '\n' +
    'If the file turns out not to need the change, say so and change nothing.',
    { label: 'transform:' + f, phase: 'Transform', agentType: 'fable-builder' }
  ),
  (result, f) => run(
    'The file ' + f + ' was just migrated ("' + input.instruction + '"). The transformer reported: ' + result + '\n' +
    'Read the file as it is NOW and verify: the change is applied completely, nothing unrelated was touched, ' +
    'there are no syntax errors, and all in-file references are consistent. Report ok=false with specifics if anything is off.',
    { label: 'check:' + f, phase: 'Check', schema: CHECK, agentType: 'fable-skeptic' }
  ).then(c => ({ file: f, ...(c || { ok: false, problems: 'checker did not complete' }) }))
)

const bad = results.filter(r => r && !r.ok)
if (bad.length) log(bad.length + ' file(s) failed their per-file check — see perFileProblems')

phase('Final verify')
const suite = await agent(
  'A migration just touched ' + files.length + ' files ("' + input.instruction + '"). ' +
  'Run ' + verifyCmd + ' and report the outcome verbatim — do not fix anything, just report what passed and what failed.',
  { label: 'project-checks', phase: 'Final verify' }
)

return { transformed: files.length, perFileProblems: bad, suiteReport: suite }
