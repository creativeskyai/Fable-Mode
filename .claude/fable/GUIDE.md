# Fable Mode — user guide

One page: what to run, when, and how to dial cost. Ships with the pack
(`.claude/fable/GUIDE.md`); it's for you, never loaded into context.

## The default: run nothing

With the pack installed, the doctrine (`FABLE.md`) is in every session and the
model orchestrates on its own: maps unfamiliar code, panels wide decisions,
reviews its own diffs with skeptics, gates releases. Ask for work in plain
language. The slash commands are for when you want specific machinery at a
specific scale.

## Set up once: models and effort

Two dials, two places:

1. **Main agent** (harness settings): pick the driver with `/model` and its
   effort with `/effort`. The value setup is Fable 5 at **low** effort — recent
   benchmarks keep showing lower effort (and often less thinking) is faster,
   cheaper, and just as good when the structure does the verifying. Opus 5 is
   the other strong driver. Thinking toggles with Tab in the CLI or `/config`.
2. **Subagents** (`.claude/fable/CONFIG.md`): the pack ships with subagents on
   **opus at medium effort**, fleet **standard**, **3** skeptic votes. Change it
   with `/fable-config` — no restart, applies to the next command:

```
/fable-config                       # show current settings
/fable-config fleet light           # smaller pools, 1 skeptic, lower caps
/fable-config subagent_model haiku  # cheap subagents
/fable-config max                   # audit mode: 5 votes, raised caps
/fable-config value                 # back to the shipped defaults
```

Words in a request override config for one run: "quick" / "no agents" → solo;
"thorough" / "audit" → fleet max. A stated budget ("+500k") is a hard cap.

## Pick by the question

| Your question | Run | Cost feel |
|---|---|---|
| "How is this codebase organized?" (new territory) | `/fable-understand` | medium |
| "Where is X handled? What breaks if I change Y?" | `/fable-research` | medium |
| "How should I build X?" (decision only) | `/fable-plan` | medium |
| "Build X" (substantive, end to end) | `/ultra` | high |
| "Apply this change everywhere" | `/fable-migrate` | scales with sites |
| "Review this diff / branch / PR" | `/fable-review` | ~16 agents at standard |
| "Find ALL the bugs / audit this module" | `/fable-exhaust` | highest — loops until dry |
| "Are we ready to release?" | `/fable-ship` | medium |
| "Keep working on this for hours / days" | `/fable-marathon` | open-ended |
| Change defaults | `/fable-config` | free |
| Doctrine isn't loaded (fresh clone) | `/fable` | free |

Look-alikes: `/fable-research` answers a scoped question in one bounded sweep;
`/fable-exhaust` loops until two rounds come up dry — use it only when you mean
*all*. `/fable-plan` stops at a design; `/ultra` carries it through review.
`/fable-review` judges the change; `/fable-ship` judges the release.

## What marathon runs for you

`/fable-marathon` cycles a backlog through the full phase discipline and calls
the other workflows itself. Your job is the run file, `FABLE-RUN.md`:

- **Goal / Backlog** — edit to steer; it re-reads every cycle.
- **Walls** — actions that always stop and queue for you (secrets, payments,
  deploys, anything destructive). The run never crosses them.
- **`- [?]` blocked items** — questions only you can answer; the run keeps
  cycling past them until you answer.

Unattended: `/loop /fable-marathon` or a scheduled task pointed at the same
command. A backlog item's `done-when:` command doubles as a `/goal` condition.

## If something breaks

- "Agent type not found" everywhere → fresh install; restart the session
  (runs still finish via a fallback in the meantime).
- A workflow died mid-run → re-invoke the skill with narrower args; no repo
  state is lost. Marathon resumes from `FABLE-RUN.md` alone.
- Edited a skill, workflow, or CONFIG.md → applies immediately. Edited an
  agent or the CLAUDE.md wiring → restart the session.
