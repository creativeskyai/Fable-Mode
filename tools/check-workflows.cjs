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
const workflowRaw = new Map();
for (const f of fs.readdirSync(wfDir).filter(f => f.endsWith('.js'))) workflowRaw.set(f, fs.readFileSync(path.join(wfDir, f), 'utf8'));
const workflows = [...workflowRaw.keys()];

// --- per-workflow checks ---
for (const [f, raw] of workflowRaw) {
  if (!/^export const meta = \{/m.test(raw)) { bad(f, 'must begin with a pure-literal "export const meta = {"'); continue; }
  if (/\bDate\.now\(\)|\bMath\.random\(\)|new Date\(\)/.test(raw)) { bad(f, 'Date.now()/Math.random()/argless new Date() throw in the sandbox'); continue; }

  try {
    new Function('agent', 'parallel', 'pipeline', 'log', 'phase', 'args', 'budget', 'workflow',
      'return (async () => {\n' + raw.replace(/^export const meta/m, 'const meta') + '\n})');
  } catch (e) { bad(f, e.message); continue; }

  // meta must be a pure literal, so evaluate it instead of regex-scraping it —
  // real fields, not guesses that break on quoting or nesting.
  const metaEnd = raw.indexOf('\n}', raw.indexOf('export const meta'));
  let meta;
  try { meta = new Function('return ' + raw.slice(raw.indexOf('{'), metaEnd + 2))(); }
  catch (e) { bad(f, 'meta is not a pure literal: ' + e.message); continue; }
  const body = raw.slice(metaEnd + 2);

  if (meta.name) workflowNames.add(meta.name);
  if (meta.name !== path.basename(f, '.js')) bad(f, "meta.name '" + meta.name + "' does not match the filename");
  if (!meta.description) bad(f, 'meta.description is missing');

  const metaTitles = new Set((meta.phases || []).map(p => p.title));
  const usedTitles = new Set([...body.matchAll(/phase\('([^']+)'\)/g), ...body.matchAll(/phase:\s*'([^']+)'/g)].map(m => m[1]));
  for (const t of usedTitles) if (!metaTitles.has(t)) bad(f, "phase '" + t + "' is used in the body but missing from meta.phases");
  for (const t of metaTitles) if (!usedTitles.has(t)) bad(f, "meta.phases title '" + t + "' is never used in the body");
}

// second pass: fable-* strings in workflows must be known agents or workflows
for (const [f, raw] of workflowRaw) {
  for (const [, ref] of raw.matchAll(/'(fable-[a-z-]+)'/g)) {
    if (!agentNames.has(ref) && !workflowNames.has(ref)) bad(f, "'" + ref + "' is not a known agent or workflow name");
  }
}

// --- deliberate identical copies must not drift ---
// The sandbox has no imports, so every workflow carries its own copy of the run()
// helper (and some share a LENSES panel). Identical-by-convention becomes
// identical-by-check here.
const TWINS = [
  ['run() helper', /^const run = [\s\S]*?\n\}\)$/m],
  ['LENSES panel', /^const LENSES = \[[\s\S]*?\n\]$/m],
  // CONTRAST must stay single-line — this regex compares only the one line.
  ['CONTRAST verdict framing', /^const CONTRAST = .+$/m],
];
for (const [label, re] of TWINS) {
  const variants = new Map();
  for (const [f, raw] of workflowRaw) {
    const m = raw.match(re);
    if (!m) continue;
    if (!variants.has(m[0])) variants.set(m[0], []);
    variants.get(m[0]).push(f);
  }
  if (variants.size > 1) bad('workflows', 'the ' + label + ' copies have drifted apart: ' + [...variants.values()].map(v => v.join('+')).join(' vs '));
}
// A file that deletes its copy of a twin block would silently drop out of the drift
// comparison above — require the blocks where they are load-bearing.
const REQUIRED_TWINS = { 'fable-review.js': ['const LENSES', 'const CONTRAST'], 'fable-exhaust.js': ['const LENSES', 'const CONTRAST'] };
for (const [f, needles] of Object.entries(REQUIRED_TWINS)) {
  for (const n of needles) {
    if (!(workflowRaw.get(f) || '').includes(n)) bad(f, 'expected twin block "' + n + '" is missing');
  }
}

// --- docs + doctrine reference checks ---
const known = new Set([...agentNames, ...workflowNames, ...skillNames]);
const fablePath = path.join(root, '.claude', 'fable', 'FABLE.md');
const docs = [fablePath, path.join(root, '.claude', 'fable', 'GUIDE.md'), path.join(root, 'README.md'), path.join(root, 'CLAUDE.md')];
for (const s of skillNames) docs.push(path.join(root, '.claude', 'skills', s, 'SKILL.md'));
for (const d of docs) {
  if (!fs.existsSync(d)) { bad(path.relative(root, d), 'missing file'); continue; }
  const raw = fs.readFileSync(d, 'utf8');
  for (const [, tok] of raw.matchAll(/`\/?(fable-[a-z-]+)`/g)) {
    if (!known.has(tok)) bad(path.relative(root, d), "reference `" + tok + "` resolves to no workflow, agent, or skill");
  }
}

// reverse direction: the doctrine must mention every workflow and agent that ships,
// or a target project's model never learns they exist.
if (fs.existsSync(fablePath)) {
  const fableRaw = fs.readFileSync(fablePath, 'utf8');
  for (const n of [...workflowNames, ...agentNames]) {
    if (!fableRaw.includes(n)) bad('fable/FABLE.md', "'" + n + "' ships in the pack but is never mentioned in the doctrine");
  }
}

// --- version stamp: VERSION ships with the pack; CHANGELOG's top entry must match ---
const versionPath = path.join(root, '.claude', 'fable', 'VERSION');
const changelogPath = path.join(root, 'CHANGELOG.md');
if (!fs.existsSync(versionPath)) bad('fable/VERSION', 'missing file');
else {
  const ver = fs.readFileSync(versionPath, 'utf8').trim();
  if (!/^\d+\.\d+\.\d+$/.test(ver)) bad('fable/VERSION', "'" + ver + "' is not a bare semver line");
  else if (!fs.existsSync(changelogPath)) bad('CHANGELOG.md', 'missing file');
  else {
    const head = (fs.readFileSync(changelogPath, 'utf8').match(/^## (\S+)/m) || [])[1];
    if (head !== ver) bad('CHANGELOG.md', "first release heading '" + head + "' does not match VERSION " + ver);
  }
}

console.log(fail
  ? fail + ' problem(s) found'
  : 'OK: ' + workflows.length + ' workflows valid; wiring intact across ' + agentNames.size + ' agents, ' + workflowNames.size + ' workflows, ' + skillNames.size + ' skills');
process.exit(fail ? 1 : 0);
