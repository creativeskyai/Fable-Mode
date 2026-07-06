---
name: fable-marathon
description: Continuous goal-directed operation across many cycles or sessions — maintains a persistent run file (goal, backlog, journal), executes one backlog item per cycle through the full phase discipline, commits at verified milestones, and keeps cycling. Composable with /loop or scheduled tasks for unattended long runs. Use for "keep working on this", overnight runs, or multi-day builds.
---

The user invoked /fable-marathon: that is explicit opt-in to workflow orchestration and to checkpoint commits at verified milestones — call the Workflow tool and commit without asking again.

## State

All run state lives in `FABLE-RUN.md` at the project root, structured as:

```markdown
# Fable Run
## Goal
<the standing goal, in the user's words>
## Backlog
- [ ] item — acceptance criteria
- [x] done item (commit <hash>)
## Journal
- <date>: one-line cycle summary
## Next
<the single next action>
```

This file is the only memory the run has: update it before ending any turn, keep it committed, and in a fresh session or after compaction, re-ground from it before acting. Never rely on conversation history surviving.

## Cycle

1. **Load or create.** If `FABLE-RUN.md` exists, read it and resume from **Next**. If not, create it: take the goal from the arguments (ask if there are none), ground a backlog by running `fable-understand` over the relevant code, order items by value, and write the file.
2. **Execute one item** through the phase discipline: understand what it touches, run `fable-design` if the approach is genuinely open, implement, then verify with `fable-review` plus the project's tests. Fix confirmed findings before calling it done.
3. **Checkpoint.** When the item is verified, commit it (item description in the message), tick it in the backlog, add a journal line, and rewrite **Next**.
4. **Continue.** Start the next item. Keep cycling within the session while context allows; when context is running low, make sure `FABLE-RUN.md` and the working tree are committed so the next session resumes cleanly, then end the turn with a re-grounding summary.

## Stopping

Stop cycling and report when: the backlog is empty (say so and propose next steps), an item is blocked on input only the user can provide (ask and end the turn), or an item requires a destructive or deployment action (gate it with `fable-ship` and hand the trigger to the user).

## Unattended operation

Each invocation is resumable, so the marathon composes with whatever loop mechanism the harness provides: `/loop /fable-marathon` for self-paced recurring cycles, or a scheduled task for fixed intervals. When invoked by a loop, run one full cycle (or finish the in-progress item) per invocation and let the state file carry continuity.

If the Workflow tool is unavailable, run the same cycle using Agent-tool subagents per the fallback in `.claude/fable/FABLE.md`.
