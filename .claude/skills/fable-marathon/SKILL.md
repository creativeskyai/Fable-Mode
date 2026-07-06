---
name: fable-marathon
description: Continuous goal-directed operation across many cycles or sessions — maintains a persistent run file (goal, backlog, journal), executes one backlog item per cycle through the full phase discipline, commits at verified milestones, and keeps cycling. Composable with /loop or scheduled tasks for unattended long runs. Use for "keep working on this", overnight runs, or multi-day builds.
---

The user invoked /fable-marathon: that is explicit opt-in to workflow orchestration and to checkpoint commits at verified milestones — call the Workflow tool and commit without asking again.

## State

All run state lives in `FABLE-RUN.md` at the project root, structured as:

```markdown
# Fable Run
> Run state for /fable-marathon — re-read .claude/skills/fable-marathon/SKILL.md before acting on this file.
## Goal
<the standing goal, in the user's words>
## Backlog
- [ ] item — acceptance criteria
- [?] blocked item — blocked: <the question only the user can answer>
- [x] done item (commit <hash>)
## Journal
- <date>: one-line cycle summary
## Next
<the single next actionable step>
```

This file is the only memory the run has: update it before ending any turn, keep it committed, and in a fresh session or after compaction, re-ground from it — and from this skill file, per its header line — before acting. Never rely on conversation history surviving. Record run-level decisions in it too (e.g. "user declined git init") so no question is ever asked twice.

## Cycle

1. **Load or create.** If `FABLE-RUN.md` exists, read it; if arguments were also given, reconcile first — a different goal replaces the **Goal** section and gets the backlog rebuilt around it, new constraints get folded in. Then check the working tree (`git status`): if it is dirty from an interrupted cycle, reconcile against **Next** and the journal — finish and verify the half-done work, or revert it — before starting anything new. If the file does not exist, create it: take the goal from the arguments (ask if there are none); ground the backlog with `fable-understand` when the repo has meaningful code, or — greenfield — derive it from the goal itself, running `fable-design` for the initial architecture instead; order items by value and write the file. If the project is not a git repository, ask once whether to `git init` (checkpoint commits are the marathon's safety rail), record the answer in the run file; if declined, skip the commit steps below and note in each journal line that rollback is unavailable.
2. **Execute one item** through the phase discipline: understand what it touches, run `fable-design` if the approach is genuinely open, implement, then verify with `fable-review` plus the project's tests. Fix confirmed findings before calling it done.
3. **Checkpoint.** When the item is verified: tick it in the backlog, add a journal line, rewrite **Next**, then commit everything including `FABLE-RUN.md` (item description in the message) — file first, commit second, so the committed state always includes its own bookkeeping.
4. **Continue.** Start the next actionable item. Keep cycling within the session while context allows; when context is running low, make sure `FABLE-RUN.md` and the working tree are committed so the next session resumes cleanly, then end the turn with a re-grounding summary.

## Blocked items

When an item needs input only the user can provide, do not stall the run: mark it `- [?] … — blocked: <question>`, record the question in the journal, move **Next** to the next actionable item, and keep cycling. Treat deploy-gated items the same way — gate with `fable-ship`, mark the item with the pending trigger, continue with the rest. Ask-and-end-the-turn only when no actionable items remain.

## Stopping

Stop cycling and report when the backlog has no actionable items left: every item done (say so and propose next steps), or only blocked items remaining (surface their questions, each explained as if new).

## Unattended operation

Each invocation is resumable, so the marathon composes with whatever loop mechanism the harness provides: `/loop /fable-marathon` for self-paced recurring cycles, or a scheduled task for fixed intervals. When invoked by a loop, run one full cycle (or finish the in-progress item) per invocation and let the state file carry continuity.

If the Workflow tool is unavailable, run the same cycle using Agent-tool subagents per the fallback in `.claude/fable/FABLE.md`.
