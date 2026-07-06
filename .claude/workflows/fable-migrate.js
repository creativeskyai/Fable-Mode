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
  "the project's standard build and test commands (detect them from the repo: package.json scripts, Makefile, CI config)"

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
const sites = await agent(
  'Migration: ' + input.instruction + '\n\n' +
  'Find EVERY file that needs to change. Search multiple ways — identifiers, string literals, types, imports, config — so nothing is missed. ' +
  'Return the complete file list; err toward including a file the transformer can reject over missing one.',
  { label: 'discover', schema: SITES, agentType: 'fable-scout' }
)
if (!sites || !sites.files.length) {
  log('discovery found no files needing this migration')
  return { transformed: 0, perFileProblems: [], suiteReport: 'skipped — nothing to migrate' }
}
log(sites.files.length + ' files to transform')

const results = await pipeline(
  sites.files,
  f => agent(
    'Apply this migration to ' + f + ' and ONLY this file: ' + input.instruction + '\n' +
    'Match the surrounding code style. If the file turns out not to need the change, say so and change nothing.',
    { label: 'transform:' + f, phase: 'Transform', agentType: 'fable-builder' }
  ),
  (result, f) => agent(
    'The file ' + f + ' was just migrated ("' + input.instruction + '"). The transformer reported: ' + result + '\n' +
    'Read the file as it is NOW and verify: the change is applied completely, nothing unrelated was touched, ' +
    'there are no syntax errors, and all in-file references are consistent. Report ok=false with specifics if anything is off.',
    { label: 'check:' + f, phase: 'Check', schema: CHECK, agentType: 'fable-skeptic' }
  ).then(c => ({ file: f, ...(c || { ok: false, problems: 'checker did not complete' }) }))
)

const bad = results.filter(Boolean).filter(r => !r.ok)
if (bad.length) log(bad.length + ' file(s) failed their per-file check — see perFileProblems')

phase('Final verify')
const suite = await agent(
  'A migration just touched ' + sites.files.length + ' files ("' + input.instruction + '"). ' +
  'Run ' + verifyCmd + ' and report the outcome verbatim — do not fix anything, just report what passed and what failed.',
  { label: 'project-checks', phase: 'Final verify' }
)

return { transformed: sites.files.length, perFileProblems: bad, suiteReport: suite }
