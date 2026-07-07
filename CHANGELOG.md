# Changelog

The first `## ` heading below must match `.claude/fable/VERSION` — `tools/check-workflows.cjs` enforces it. If a release ever removes a shipped file, list the stale path here so updaters can delete it manually.

## 1.0.0 — 2026-07-06

Initial versioned release.

- New skills `/fable-understand` and `/fable-migrate` expose their workflows standalone.
- Skeptic verification uses contrastive framing (strongest case for, then against, then decide) instead of pure refute framing; skeptic and critic agents state confidence with each verdict.
- Judge panels in `fable-design` see candidates in a rotated order per judge to remove position bias.
- Deep-read and gap-follow-up reports in `fable-research` are capped at 250 words to keep the synthesis prompt dense.
- `fable-exhaust` skeptic verdicts converged to the same refuted-polarity schema as `fable-review`; per-round dedup broadcast shrunk to file:line locations.
- `fable-ship` runs its read-only gates (detect, hygiene, docs) concurrently; build/test checks follow.
- Installers gain `--update` / `-Update` (refresh pack-owned files, never touch anything else) and print the pack version; `--force` / `-Force` deprecated as aliases.
- Version stamping via `.claude/fable/VERSION` (ships with the pack).
- Wiring checker: evaluates the meta literal, scans README/CLAUDE.md references, requires every shipped workflow/agent to be mentioned in the doctrine, polices byte-identical twin blocks (run(), LENSES, CONTRAST) and their presence, validates VERSION/CHANGELOG consistency.
- CI: checker plus installer smoke tests on ubuntu and windows.
