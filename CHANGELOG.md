# Changelog

If a release ever removes a shipped file, the entry lists the stale path so `--update` users can delete it manually.

## 1.0.0 — 2026-07-10

First public release, MIT licensed.

The pack ships as one `.claude/` directory in four layers, wired by string name and validated by `tools/check-workflows.cjs` in CI:

- **Doctrine** — `.claude/fable/FABLE.md`, the always-on operating contract (phase discipline, adversarial verification, honest reporting, the scale dial), imported into a project's `CLAUDE.md` by the installers. A one-page routing guide ships alongside it (`.claude/fable/GUIDE.md`).
- **7 agents** — scout, finder, skeptic, judge, builder, critic, scribe.
- **7 workflows** — `fable-understand`, `fable-design`, `fable-review` (finder fan-out, then 3 lens-diverse skeptics vote on every finding), `fable-research`, `fable-exhaust` (loops until two consecutive rounds come up dry), `fable-migrate` (pilots on two files before fanning out), `fable-ship`. Every deliberate bound is announced — no silent caps.
- **10 skills** — `/ultra`, `/fable`, and the eight `/fable-*` commands, including `/fable-marathon` for long-running work with all state in a `FABLE-RUN.md` (Walls, Invariants, standoff rule; composes with `/loop`).

Tooling around the pack:

- `install.sh` / `install.ps1`: copy the pack without overwriting existing files, wire the CLAUDE.md import exactly once, `--update` to refresh pack-owned files only, version-aware hints, session-local files never shipped.
- CI validates the wiring and smoke-tests both installers (fresh install, idempotent second run, update semantics) on Linux and Windows.
- Releases publish automatically: merging a `VERSION` bump to `main` tags `v<VERSION>` and publishes a GitHub Release with that version's changelog section as the body.
