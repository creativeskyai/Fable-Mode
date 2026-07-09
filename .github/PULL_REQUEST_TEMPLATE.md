## What changed

<!-- One paragraph. If this adds or renames a fable-* name, say which layer(s) it touches. -->

## Why

<!-- The task or failure that motivated it. -->

## How it was verified

<!-- The pack has no test suite; say exactly what you ran. Delete lines that don't apply. -->

- [ ] `node tools/check-workflows.cjs` passes
- [ ] Installer smoke test: fresh install + idempotent second run (`./install.sh /tmp/fable-target` twice)
- [ ] `CHANGELOG.md` updated (and `.claude/fable/VERSION` bumped, if pack files changed)
- [ ] Dogfooded: ran `/fable-review` (or the review workflow) over this branch
