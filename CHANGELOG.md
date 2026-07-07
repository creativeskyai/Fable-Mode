# Changelog

The first `## ` heading below must match `.claude/fable/VERSION` — `tools/check-workflows.cjs` enforces it. If a release ever removes a shipped file, list the stale path here so updaters can delete it manually.

## 1.1.0 — 2026-07-07

Unattended-run hardening, judged in from an external autonomous-loop field guide (each adoption vetted by a three-lens judge panel; the guide's shell infrastructure — cron loops, trust ledgers, cost scripts, model dispatch — was rejected as redundant with the Workflow tool and harness `/loop`).

- Marathon run file gains **Walls** (per-run always-queue-for-user actions, written at creation so they survive compaction) and **Invariants** (finished items graduate into cheap, read-only check commands; every cycle re-verifies them and a violation becomes the next item, or a blocked item after one failed fix or a Wall hit).
- Marathon backlog items record a machine-checkable done-when command where one exists; an item is done only when its command passes; "the project's tests" generalized to "the project's own checks".
- Standoff rule: verification rejecting the same fix twice stops iteration — blocked item in marathon, surfaced to the user per FABLE.md's "When a run breaks". Blocking mid-item reverts or branch-parks unverified work first.
- Marathon retro at stopping points: up to three proposed new Walls/Invariants recorded under a dedicated Proposals section — effective only when the user moves them up.
- Test-integrity law: never weaken, skip, or delete a test or check to make work pass (FABLE.md, fable-builder, and an always-critical rule in fable-review's correctness finder).
- Grounded progress claims in FABLE.md Reporting: audit each claim against a session tool result before reporting it.
- Schema field `reasoning` renamed to `evidence` in review/exhaust VERDICT and design SCORES (never read by scripts; avoids reasoning-extraction-adjacent phrasing).
- README: per-stage effort tuning guidance (override verified working in the current harness); Continuous-operation section documents Walls/Invariants/standoff.

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
