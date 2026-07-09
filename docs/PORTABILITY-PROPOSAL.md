# Proposal: Running Fable Mode Outside Claude Code (Cursor, Local DGX Spark, Grok Heavy)

> **STATUS: DRAFT — RESEARCH NOT YET VERIFIED.** This is an exploratory roadmap, not a commitment.
> Web research was conducted in July 2026 and some of it rests on low-quality secondary sources;
> **facts flagged with ⚠ below are the least certain and need primary-source re-verification before
> anyone acts on them.** Nothing here has been implemented. Corrections and firsthand reports are
> welcome as issues or PRs.

## Question this answers

Can the Fable Mode pack run outside Claude Code — specifically in **Cursor**, on a **local NVIDIA DGX
Spark** with open-weight models, or against **Grok Heavy** — and how would we facilitate that?

---

## The core reframe

Fable Mode is four layers (see [CLAUDE.md](../CLAUDE.md) "Architecture: four layers wired by name"). They
port with very different ease:

| Layer | Portability | Why |
|---|---|---|
| Skills (`.claude/skills/*/SKILL.md`) | **High** | Anthropic's Agent Skills spec is now widely adopted (Cursor, others). |
| Agents (`.claude/agents/fable-*.md`) | **High** | `name`/`description`/`model` frontmatter + delegation-by-description is a common shape; `AGENTS.md` is a Linux-Foundation standard. |
| Doctrine (`.claude/fable/FABLE.md` via `@`-import) | **Medium** | The text ports; the `@path` import mechanism and `CLAUDE.md` discovery are Claude-Code-specific. |
| Workflows (`.claude/workflows/*.js`) | **Low / none** | The Workflow-tool JS sandbox (`agent()`/`parallel()`/`pipeline()`, deterministic loops, vote tallies, announced caps) exists only in Claude Code. |

**Strategic consequence:** the pack's portable value is the **doctrine + the seven role-agents**, not the
JS scripts. Every SKILL.md already ships an "if the Workflow tool is unavailable, emulate the stages with
parallel Agent-tool calls" fallback — on any non-Claude-Code host, that fallback *becomes* the primary
implementation. The universal substrate is **`AGENTS.md` (doctrine) + subagents**.

---

## Scenario 1 — Cursor (best supported)

Cursor natively discovers Claude Code's directories, so most of the pack works in place.

- **Agents** — Cursor scans `.claude/agents/` directly (subagent system, delegation by `description`).
  `model: inherit` maps 1:1. **Lost:** the `tools:` allowlist field has no Cursor equivalent; nearest is
  `readonly: true`, which fits the read-only roles (scout, finder, skeptic, judge, critic).
- **Skills** — `.claude/skills/` is a discovered path; `/skill-name` invocation works.
- **Doctrine** — the Cursor **IDE agent does not read `CLAUDE.md`** and does not follow the
  `@.claude/fable/FABLE.md` import (only the Cursor CLI reads `CLAUDE.md`, and import-following is
  undocumented). **Fix:** inline FABLE.md into `.cursor/rules/fable-doctrine.mdc` with `alwaysApply: true`,
  or into a root `AGENTS.md`.
- **Workflows** — no equivalent; becomes prose in the skills driving Cursor's real parallel subagents
  (worktree isolation via `/worktree`, `/best-of-n`).
- **Bonus:** Cursor **hooks** (`.cursor/hooks.json`, `stop`/`subagentStop` with `followup_message` +
  `loop_limit`) could machine-enforce "done means verified" — stronger than the prose-only enforcement the
  pack has today.

**Verdict:** ~80% ports with a doctrine re-home. One installer branch (`--target cursor`) that inlines
FABLE.md into an `.mdc`/`AGENTS.md` and adjusts the idempotence check gets there.

⚠ **To re-verify:** the four `.mdc` activation modes and exact frontmatter fields; that `.claude/agents/`
and `.claude/skills/` are still auto-discovered; whether `tools:` is truly ignored; current Cursor version
and feature names (`/multitask`, `/worktree`, `/best-of-n`, `/in-cloud` — version numbers came from
low-quality secondary sources and were **not** all confirmed against the official changelog).

---

## Scenario 2 — DGX Spark, fully local

DGX Spark = GB10 Grace Blackwell, 128 GB unified memory. Two viable paths.

**Path A — Keep Claude Code, point it at a local model (recommended).**
Claude Code speaks Anthropic's Messages API; local servers (Ollama, vLLM, llama.cpp) speak OpenAI's
format, so a translation proxy is required: **claude-code-router** (simplest) or **LiteLLM** (team/audit).
Set `ANTHROPIC_BASE_URL` to the proxy + a dummy `ANTHROPIC_AUTH_TOKEN`. **Win:** the Workflow tool,
subagents, and skills all keep working — only the reasoning model changes. **Caveat:** multi-agent fan-out
and structured-output schemas depend on tool-calling fidelity, which open-weight models do less reliably
than Claude. **Supply-chain hygiene:** whichever proxy you choose, install a pinned, checksummed release
from the official source and review its changelog/advisories before giving it credentials — proxies sit
on the path that carries your API keys.

**Path B — Use a local-native harness.** OpenCode (75+ endpoints incl. local Ollama / OpenAI-compatible,
reads `AGENTS.md`) or Goose (Block; subagents, recipes, MCP; reads `AGENTS.md`). Run the portable core
(AGENTS.md doctrine + seven agents) with no proxy. Lose the JS workflow determinism.

**Hardware fit.** DGX Spark runs vLLM natively (NVIDIA ships a vLLM playbook). Model candidates in 128 GB:
`gpt-oss-120b` (MXFP4, ~66 GB), Qwen3-Coder MoE variants, GLM-Air-class MoE — NVFP4 MoE with ~10–15B active
params is the tuned sweet spot. ⚠ **Throughput reality:** single-box DGX Spark is tens of tok/s for large
models (gpt-oss-20b reported ~58 tok/s), not the hundreds cloud inference gives. Wide fan-out (5-vote
verification, exhaust loops) is slow locally → **turn the scale dial down**: smaller finder pools,
single-vote verification by default locally.

**Recommendation:** Claude Code + claude-code-router + vLLM serving `gpt-oss-120b` or a Qwen3-Coder MoE.
Keeps 100% of the pack; tune fleet sizes for local throughput. Fall back to OpenCode-native if local
tool-calling is too flaky for the Workflow tool's structured output.

⚠ **To re-verify:** current NVIDIA-recommended serving stack for GB10; which open-weight models genuinely
handle agentic tool-calling well at this size; real tok/s under multi-agent load; whether Claude Code's
Workflow tool actually produces valid structured output against a given local model (needs an empirical
test, not just docs).

---

## Scenario 3 — Grok Heavy

⚠ **Key finding, needs primary re-verification:** xAI's current API docs appear to list a
`grok-4.20-...-multi-agent` chat model alongside the flagship `grok-4.3` (1M context), at the same pricing
as regular chat models — meaning the parallel-agent "Heavy" behavior may now be **API-reachable**, not
consumer-only as it was at launch (SuperGrok Heavy, $300/mo, grok.com). Exact model IDs churn and
secondary coverage is unreliable; trust only `docs.x.ai` at call time.

**How to drive it.**
- xAI API is **OpenAI-compatible** at `https://api.x.ai/v1`. Anthropic-SDK compatibility was offered once
  but appears **deprecated** now (consistent with the reported Anthropic–xAI access dispute) — do **not**
  point `ANTHROPIC_BASE_URL` straight at `api.x.ai`.
- To run Claude Code + the full pack against Grok, use **claude-code-router / LiteLLM** (Messages→OpenAI
  translation), same as the local path.
- **Design decision:** if you use xAI's own `multi-agent` model, you get xAI's internal fan-out *plus* the
  pack's orchestration — redundant. For an honest test of *your* doctrine, point the pack at the
  single-agent flagship (`grok-4.3`) and let Fable Mode supply the multi-agent structure. **Framing: the
  pack is a portable "Heavy tier" for any model.**
- Zero-proxy alternative: Grok is selectable directly inside Cursor, so Scenario 1 + Grok works without a
  proxy.

⚠ **To re-verify:** exact live model IDs; whether a `multi-agent` model is really API-exposed; current
Anthropic-compat status; whether xAI ships its own coding CLI worth targeting.

---

## How to facilitate (proposed pack additions — none implemented yet)

Through-line: **`AGENTS.md` + the seven agents is the universal substrate; the JS workflows are the
Claude-Code-only luxury.**

1. **Generate an `AGENTS.md` mirror of FABLE.md.** Highest-leverage single addition — makes the doctrine
   readable by Cursor, Codex, OpenCode, Goose, Aider, Gemini CLI in one file.
2. **Add installer target modes.** `--target cursor` inlines FABLE.md into
   `.cursor/rules/fable-doctrine.mdc` (`alwaysApply: true`) instead of the `@`-import, and updates the
   idempotence grep. `--target agents-md` writes/appends doctrine to `AGENTS.md`.
3. **Promote each skill's Agent-tool fallback to a first-class orchestration playbook** — on non-Claude-Code
   hosts it *is* the implementation. Verify each fable-* skill's fallback fully specifies the fan-out.
4. **Ship `BACKENDS.md`** — proxy recipes (claude-code-router / LiteLLM env vars) for local vLLM/Ollama on
   DGX Spark and for xAI Grok; the LiteLLM version-pin warning; DGX throughput → scale-dial guidance.
5. **Document what's lost per target** in README — deterministic loop-until-dry / vote-counting / announced
   caps exist only under the Workflow tool; elsewhere they are LLM-followed prose (verify more, trust less).

Validation for any of these: existing `tools/check-workflows.cjs` (for naming/wiring) plus an installer
smoke-test (idempotent, skips existing files, no duplicate import line) per [CLAUDE.md](../CLAUDE.md)
"Validation commands".

---

## Open review questions

1. **Re-verify every ⚠ fact against primary docs** (cursor.com/docs, docs.x.ai, NVIDIA DGX Spark docs) —
   version numbers and model IDs here came partly from unreliable sources.
2. **Pressure-test the "workflows don't port" claim** — is there a lighter-weight portable orchestration
   representation (e.g., a declarative phase spec both the Workflow tool and a prose-driven host can read)
   that would preserve more than raw prose?
3. **Decide the priority order** — Cursor is lowest-effort/highest-return; is that the right first pilot?
4. **Empirical gap:** none of the local/Grok tool-calling-fidelity claims are tested. A real
   Workflow-tool-against-local-model smoke test would de-risk the DGX recommendation more than any doc.
5. **Scope check:** should this become real installer work, or stay a reference doc?
