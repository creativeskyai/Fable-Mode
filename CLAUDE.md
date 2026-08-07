# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A distributable Claude Code configuration pack, not an application. The deliverable is the `.claude/` directory itself — doctrine, subagents, workflow scripts, and skills that give any project a Fable 5 / Ultracode working style on other models. `install.ps1` / `install.sh` copy `.claude/**` verbatim into a target project and append `@.claude/fable/FABLE.md` to its CLAUDE.md. Consequence: **everything under `.claude/` ships to every target project** — session-local or repo-local config does not belong there.

## Validation commands

There is no build or test suite; validate changes with:

```bash
# Syntax-check all workflow scripts (plain `node --check` false-fails — see below)
node tools/check-workflows.cjs

# Smoke-test an installer against a throwaway directory (must be idempotent on a second run,
# must skip existing files, must not duplicate the CLAUDE.md import line)
mkdir -p /tmp/fable-target && ./install.sh /tmp/fable-target   # or: .\install.ps1 -Target <dir>
```

## Architecture: five layers wired by name

1. **Doctrine** — `.claude/fable/FABLE.md`. Always-on operating contract, loaded via a `@.claude/fable/FABLE.md` import in the target's CLAUDE.md (created/appended by the installers). Its Orchestration list must stay in sync with the actual workflow names (the checker verifies the names resolve).
2. **Config** — `.claude/fable/CONFIG.md`. User-owned defaults (subagent model/effort, fleet, votes). Skills read it at invocation and pass its yaml keys as `config` in workflow args; workflows apply it via the shared config block. Once installed it belongs to the user: `--update` never overwrites it (both installers special-case `fable/CONFIG.md`, CI asserts it), and `/fable-config` carries a template to recreate it.
3. **Agents** — `.claude/agents/fable-*.md`. Seven subagents (scout, finder, skeptic, judge, builder, critic, scribe) that everything else is built from.
4. **Workflows** — `.claude/workflows/fable-*.js`. Scripts for the Workflow tool that fan out over the agents.
5. **Skills** — `.claude/skills/*/SKILL.md`. Slash commands that invoke the workflows by name and report results.

The layers reference each other by **string name**; `tools/check-workflows.cjs` validates this wiring (agentType strings ↔ agent frontmatter names, backticked fable-* references in skills/doctrine ↔ workflow/agent/skill names, phase titles ↔ meta.phases), so run it after any rename or addition. One reference it cannot see: the installers detect an existing install by grepping CLAUDE.md for the literal string `@.claude/fable/FABLE.md` — if the doctrine path ever changes, update both installers, the FABLE.md references in the skills, and this import string together.

## Workflow-script constraints (the sandbox is not Node)

- Scripts run wrapped in an async function: top-level `return` and `await` are legal, and `node --check` therefore rejects valid scripts. Always validate with `tools/check-workflows.cjs`.
- `export const meta = {...}` must open the file and be a pure literal — no variables, calls, or spreads. `phases` titles must match the `phase()` calls / `phase:` opts in the body.
- Plain JavaScript only (no TypeScript annotations). `Date.now()`, `Math.random()`, and argless `new Date()` throw in the sandbox.
- Repo conventions to preserve: every workflow accepts `args` as either an object or a plain string (the harness can deliver args as a JSON-encoded string, so never access `args.x` bare); every deliberate bound (lead caps, round caps, budget stops) is announced with `log()` — no silent caps; `agent()`/`parallel()` results and schema arrays are null-guarded because skipped or dead agents resolve to null and structured output can come back with fields missing.
- Every workflow defines the same `run()` helper wrapping `agent()`: it retries without `agentType` when the agent isn't registered. This is load-bearing — agent types register at session start only, so a fresh install would otherwise kill every workflow until the session restarts. Use `run()` (not bare `agent()`) for every agent call — it also applies the configured subagent model/effort via `sub()`.
- Every workflow carries the same config block (`const cfg` … `const sub` … the `log('config: …')` line) directly above `run()`. Both blocks are drift-checked byte-for-byte across workflows and required in each; fleet-dependent bounds (`votes`, round caps, stance slices) derive from `cfg`/`fleet` and must be announced with `log()`.

## Load-bearing wording

- Each SKILL.md opens by declaring the invocation as the user's **explicit opt-in to the Workflow tool**. That sentence satisfies the Workflow tool's permission gating on other models — do not soften or remove it.
- Each skill and the doctrine carry an Agent-tool fallback for Claude Code versions without the Workflow tool — keep it when adding skills.
- FABLE.md is injected into every session of every target project; keep it lean and doctrine-only.
- Agents default to `model: inherit`; the supported model/effort lever is `CONFIG.md`'s `subagent_model` / `subagent_effort` (applied per-call by the workflows' `sub()` helper), not frontmatter pinning — don't hardcode models in agent files.

# Fable Mode
@.claude/fable/FABLE.md
