# Changelog

If a release ever removes a shipped file, the entry lists the stale path so `--update` users can delete it manually.

## 2.0.0 — 2026-08-07

The Claude 5 / value-maxxing release: pick your spend instead of prompting for it, tuned for the leaner Claude Code system prompts that shipped with the Claude 5 generation.

- **Config file** — `.claude/fable/CONFIG.md` sets the defaults every workflow runs with: `subagent_model` (ships as `opus`), `subagent_effort` (ships as `medium`), `fleet` (`light` / `standard` / `max` — each fleet carries its own vote count of 1/3/5), and optional `votes` / round / lead-cap overrides. Skills read it at invocation and pass it as `config` in workflow args, so edits apply to the next command with no restart. `--update` installs never overwrite it (CI-tested on both installers).
- **`/fable-config`** — new skill (11th) to show settings, change keys, or apply presets: `value` (the shipped defaults), `light` (inherit/low, 1 skeptic), `max` (opus/high, 5 votes). It also prints the harness commands for the main agent — `/model`, `/effort`, thinking toggle — which a pack cannot set itself.
- **All 7 workflows** honor the config: subagent model/effort applied to every agent call, fleet-scaled pools, votes, and caps, each announced with `log()` (no silent caps). The shared config block is drift-checked like the `run()` helper.
- **Recommended setup** documented throughout: main agent Fable 5 at low effort (or Opus 5), subagents Opus at medium — lower effort with structural verification beats higher effort without it, at a fraction of the spend.
- **Doctrine and reporting** rewritten for the Claude 5 generation: `FABLE.md` slimmed to judgment-over-rules, agents and scribe now report in plain language (lead with the answer, numbered steps, short lists, no filler).
- **README, GUIDE.md** rewritten shorter; new SVG banner. Removed: `assets/banner.png`, `assets/review-pipeline.png` (stale; `--update` users can delete them manually).

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
