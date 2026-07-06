---
name: fable-ship
description: Release-readiness gate — detects the project's build/test/release mechanics, runs every gate in parallel (checks, repo hygiene, docs), then a skeptic attacks the "ready to ship" claim. Use before releasing, deploying, tagging, or publishing. It verifies readiness; it never deploys.
---

The user invoked /fable-ship: that is explicit opt-in to workflow orchestration — call the Workflow tool.

1. From the arguments, determine what is being shipped (a release, a deploy, a package publish). Default: the current state of the repository.
2. Run the named workflow `fable-ship` with `args: { scope: "<what is being shipped>" }`.
3. Report the verdict first — ready or not — then every blocker and warning with its evidence, then the exact commands the user would run to actually ship.
4. Never execute the deployment itself unless the user explicitly asks; deploying is theirs to trigger. If they ask, run their project's deploy command and report the outcome verbatim.

If the Workflow tool is unavailable, run the same structure with Agent-tool subagents: one `fable-scout` to detect the project checks, three parallel gate agents (run checks / repo hygiene / docs), then one `fable-skeptic` attacking the readiness claim.
