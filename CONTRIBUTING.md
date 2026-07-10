# Contributing to Fable Mode

Thanks for wanting to make the pack better. This page is short because the repo is small — but the wiring is strict, so read it before your first PR.

## What this repo is

A distributable Claude Code configuration pack. The deliverable is the `.claude/` directory itself; the installers copy it verbatim into target projects. That has one hard consequence:

> **Everything under `.claude/` ships to every target project.** Repo-level files (CI, templates, assets, docs) live outside `.claude/`. Session-local or repo-local config never goes inside it.

## The four layers

| Layer | Where | Referenced by |
|---|---|---|
| Doctrine | `.claude/fable/FABLE.md` | imported into the target's `CLAUDE.md` |
| Agents | `.claude/agents/fable-*.md` | `agentType` strings in workflows |
| Workflows | `.claude/workflows/fable-*.js` | invoked by name from skills |
| Skills | `.claude/skills/*/SKILL.md` | slash commands |

The layers are wired by **string name**. `tools/check-workflows.cjs` validates all of it: agentType strings resolve to agent names, backticked `fable-*` references resolve to something that ships, workflow phase titles match their `meta.phases`, twin code blocks stay byte-identical across workflows, and `VERSION` matches the changelog head.

## Validating changes

There is no build and no test suite — validation is:

```bash
# 1. The wiring checker (plain `node --check` false-fails on workflow scripts — always use this)
node tools/check-workflows.cjs

# 2. Installer smoke test (fresh install, then idempotent second run)
mkdir -p /tmp/fable-target && ./install.sh /tmp/fable-target && ./install.sh /tmp/fable-target
```

CI runs both, plus the PowerShell installer on Windows. A PR that fails the checker will not be reviewed further — it usually means a rename didn't propagate.

## Workflow-script rules (the sandbox is not Node)

- Scripts run wrapped in an async function: top-level `return`/`await` are legal there.
- `export const meta = {...}` must open the file and be a pure literal.
- `Date.now()`, `Math.random()`, and argless `new Date()` throw in the sandbox.
- Accept `args` as an object **or** a plain string (the harness may deliver JSON-encoded strings).
- Announce every deliberate bound with `log()` — no silent caps.
- Null-guard agent results; skipped or dead agents resolve to `null`.
- Use the shared `run()` helper (not bare `agent()`) for any call passing `agentType` — it falls back to the default agent on fresh installs where agent types haven't registered yet.

## Adding an agent, workflow, or skill

1. Follow the existing naming: `fable-<role>` and match `name:`/`meta.name` to the filename.
2. Mention it in `.claude/fable/FABLE.md` (the checker requires the doctrine to name everything that ships) — and keep FABLE.md lean; it loads into every session of every target project.
3. Add it to the routing table in `.claude/fable/GUIDE.md` and the README.
4. Add a `CHANGELOG.md` entry; bump `.claude/fable/VERSION` if pack files changed.
5. Run the checker.

## Style

- Keep diffs minimal and in the local idiom; the pack's own doctrine applies to its repo.
- If you have the pack installed, dogfood it: run `/fable-review` over your branch before opening the PR and say so in the description.
- Prose matters here as much as code — the pack *is* prose. Match the existing voice: concrete, honest about limits, no hype.

## Releases

Maintainers cut releases by bumping `.claude/fable/VERSION`, adding the matching `CHANGELOG.md` heading (the checker enforces the match), and merging to `main`. The `release` workflow then publishes automatically: it re-runs the checker, and if the stamped version has no GitHub Release yet, tags `v<VERSION>` and publishes one with that version's changelog section as the body (already-published versions are a no-op; manual dispatch exists as a fallback). If a release removes a shipped file, the changelog lists the stale path so `--update` users can delete it manually.
