// Validates the pack's workflow scripts and the string-name wiring between layers.
//
// 1. Syntax-checks each workflow the way the Workflow sandbox runs it: `export const meta`
//    stripped, body wrapped in an async function (top-level return/await are legal there,
//    so plain `node --check` false-fails by design). Also rejects sandbox-banned calls.
// 2. Cross-layer integrity: every 'fable-*' string in a workflow must resolve to an agent
//    name or workflow meta.name; every backticked fable-* reference in SKILL.md files and
//    FABLE.md must resolve to a workflow, agent, or skill; each workflow's phase()/phase:
//    titles must exactly match its meta.phases titles.
//
// Usage: node tools/check-workflows.cjs
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const wfDir = path.join(root, '.claude', 'workflows');
let fail = 0;
const bad = (file, msg) => { console.log('FAIL', file, '-', msg); fail++; };

// --- collect the name registries + validate frontmatter ---
const frontmatter = raw => (raw.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || '';
const agentNames = new Set();
for (const f of fs.readdirSync(path.join(root, '.claude', 'agents')).filter(f => f.endsWith('.md'))) {
  const fm = frontmatter(fs.readFileSync(path.join(root, '.claude', 'agents', f), 'utf8'));
  const name = (fm.match(/^name:\s*(\S+)/m) || [])[1];
  if (!name) { bad('agents/' + f, 'missing required frontmatter field: name'); continue; }
  if (name !== path.basename(f, '.md')) bad('agents/' + f, "agent name '" + name + "' does not match the filename");
  if (!/^description:\s*\S/m.test(fm)) bad('agents/' + f, 'missing required frontmatter field: description');
  agentNames.add(name);
}
const skillNames = new Set(fs.readdirSync(path.join(root, '.claude', 'skills')));
for (const s of skillNames) {
  const p = path.join(root, '.claude', 'skills', s, 'SKILL.md');
  if (!fs.existsSync(p)) { bad('skills/' + s, 'missing SKILL.md'); continue; }
  const fm = frontmatter(fs.readFileSync(p, 'utf8'));
  const desc = (fm.match(/^description:\s*(.+)$/m) || ['', ''])[1] + ((fm.match(/^when_to_use:\s*(.+)$/m) || ['', ''])[1]);
  if (!desc.trim()) bad('skills/' + s, 'missing frontmatter description — the skill will not auto-invoke');
  if (desc.length > 1536) bad('skills/' + s, 'description + when_to_use is ' + desc.length + ' chars; Claude Code truncates at 1536');
}
const workflowNames = new Set();
const workflows = fs.readdirSync(wfDir).filter(f => f.endsWith('.js'));

// --- per-workflow checks ---
for (const f of workflows) {
  const raw = fs.readFileSync(path.join(wfDir, f), 'utf8');
  if (!/^export const meta = \{/m.test(raw)) { bad(f, 'must begin with a pure-literal "export const meta = {"'); continue; }
  if (/\bDate\.now\(\)|\bMath\.random\(\)|new Date\(\)/.test(raw)) { bad(f, 'Date.now()/Math.random()/argless new Date() throw in the sandbox'); continue; }

  try {
    new Function('agent', 'parallel', 'pipeline', 'log', 'phase', 'args', 'budget', 'workflow',
      'return (async () => {\n' + raw.replace(/^export const meta/m, 'const meta') + '\n})');
  } catch (e) { bad(f, e.message); continue; }

  const metaEnd = raw.indexOf('\n}', raw.indexOf('export const meta'));
  const metaBlock = raw.slice(0, metaEnd);
  const body = raw.slice(metaEnd);

  const name = (metaBlock.match(/name:\s*'([^']+)'/) || [])[1];
  if (name) workflowNames.add(name);
  if (name !== path.basename(f, '.js')) bad(f, "meta.name '" + name + "' does not match the filename");

  const metaTitles = new Set([...metaBlock.matchAll(/title:\s*'([^']+)'/g)].map(m => m[1]));
  const usedTitles = new Set([...body.matchAll(/phase\('([^']+)'\)/g), ...body.matchAll(/phase:\s*'([^']+)'/g)].map(m => m[1]));
  for (const t of usedTitles) if (!metaTitles.has(t)) bad(f, "phase '" + t + "' is used in the body but missing from meta.phases");
  for (const t of metaTitles) if (!usedTitles.has(t)) bad(f, "meta.phases title '" + t + "' is never used in the body");
}

// second pass: fable-* strings in workflows must be known agents or workflows
for (const f of workflows) {
  const raw = fs.readFileSync(path.join(wfDir, f), 'utf8');
  for (const [, ref] of raw.matchAll(/'(fable-[a-z-]+)'/g)) {
    if (!agentNames.has(ref) && !workflowNames.has(ref)) bad(f, "'" + ref + "' is not a known agent or workflow name");
  }
}

// --- skills + doctrine reference checks ---
const known = new Set([...agentNames, ...workflowNames, ...skillNames]);
const docs = [path.join(root, '.claude', 'fable', 'FABLE.md')];
for (const s of skillNames) docs.push(path.join(root, '.claude', 'skills', s, 'SKILL.md'));
for (const d of docs) {
  if (!fs.existsSync(d)) { bad(path.relative(root, d), 'missing file'); continue; }
  const raw = fs.readFileSync(d, 'utf8');
  for (const [, tok] of raw.matchAll(/`\/?(fable-[a-z-]+)`/g)) {
    if (!known.has(tok)) bad(path.relative(root, d), "reference `" + tok + "` resolves to no workflow, agent, or skill");
  }
}

console.log(fail
  ? fail + ' problem(s) found'
  : 'OK: ' + workflows.length + ' workflows valid; wiring intact across ' + agentNames.size + ' agents, ' + workflowNames.size + ' workflows, ' + skillNames.size + ' skills');
process.exit(fail ? 1 : 0);
