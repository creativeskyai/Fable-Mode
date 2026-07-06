// Syntax-checks the workflow scripts the way the Workflow sandbox actually runs them:
// `export const meta` stripped, body wrapped in an async function (so top-level
// return/await are legal). Plain `node --check` false-fails on these files by design.
//
// Usage: node tools/check-workflows.cjs
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', '.claude', 'workflows');
let fail = 0;

for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js'))) {
  let src = fs.readFileSync(path.join(dir, f), 'utf8');
  if (!/^export const meta = \{/m.test(src)) {
    console.log('FAIL', f, '- must begin with a pure-literal "export const meta = {"');
    fail++;
    continue;
  }
  if (/\bDate\.now\(\)|\bMath\.random\(\)|new Date\(\)/.test(src)) {
    console.log('FAIL', f, '- Date.now()/Math.random()/argless new Date() throw in the sandbox');
    fail++;
    continue;
  }
  src = src.replace(/^export const meta/m, 'const meta');
  try {
    new Function(
      'agent', 'parallel', 'pipeline', 'log', 'phase', 'args', 'budget', 'workflow',
      'return (async () => {\n' + src + '\n})'
    );
    console.log('OK  ', f);
  } catch (e) {
    console.log('FAIL', f, '-', e.message);
    fail++;
  }
}

process.exit(fail ? 1 : 0);
