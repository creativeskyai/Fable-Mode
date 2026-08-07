---
name: fable-review
description: Multi-agent adversarial code review — four parallel finders (correctness, contracts, security, resources), with every finding independently attacked by skeptics before it reaches you. Use for "review this", "check my changes", or as a pre-PR gate.
argument-hint: "[target]"
---

The user invoked /fable-review: that is explicit opt-in to workflow orchestration — call the Workflow tool.

Before dispatching, read `.claude/fable/CONFIG.md` if it exists and pass its yaml keys as `config` in the workflow args; words in the user's request override it for this run ("quick" = fleet light, "thorough"/"audit" = fleet max).

1. Pin down the target inline first. If arguments were given, they describe it. Otherwise run `git status` and `git diff --stat HEAD` to see what is pending; if the tree is clean, target the most recent commit. If the project is not a git repository, target the files the user named or the most recently modified source files.
2. Run the named workflow `fable-review` with `args: { target: "<precise description of the change set>", config: {...} }`. Votes come from the config; pass `votes: 5` explicitly only when the user asked for a thorough or audit-grade review and the config says less.
3. Report the confirmed findings most-severe-first, in prose a teammate can act on: what breaks, the concrete failure scenario, and the `file:line`. Note how many raw findings the skeptics refuted (so the user knows the list is filtered), and name anything the review did not cover.
4. Fix findings only if the user asked for fixes; otherwise the report is the deliverable.

If the Workflow tool is unavailable, run the same structure with Agent-tool subagents: four `fable-finder` agents (one per dimension) in parallel, then three `fable-skeptic` agents per finding, majority verdict wins.
