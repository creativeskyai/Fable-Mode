---
name: fable-ship
description: Release-readiness gate — detects the project's build/test/release mechanics, runs the read-only gates (detection, hygiene, docs) in parallel and the build/test gate after them alone, then a skeptic attacks the "ready to ship" claim. Use before releasing, deploying, tagging, or publishing. It verifies readiness; it never deploys.
argument-hint: "[scope]"
---

The user invoked /fable-ship: that is explicit opt-in to workflow orchestration — call the Workflow tool.

Before dispatching, read `.claude/fable/CONFIG.md` if it exists and pass its yaml keys as `config` in the workflow args; words in the user's request override it for this run ("quick" = fleet light, "thorough"/"audit" = fleet max).

1. From the arguments, determine what is being shipped (a release, a deploy, a package publish). Default: the current state of the repository.
2. Run the named workflow `fable-ship` with `args: { scope: "<what is being shipped>" }`.
3. Report the verdict first — ready or not — then every blocker and warning with its evidence, then the ship mechanics the workflow returns (`shipCommands` and `releaseNotes`). If no ship command was detected, say so rather than inventing one.
4. Never execute the deployment itself unless the user explicitly asks; deploying is theirs to trigger. If they ask, run their project's deploy command and report the outcome verbatim.

If the Workflow tool is unavailable, run the same structure with Agent-tool subagents: in parallel, one `fable-scout` to detect the project checks (reading the project's own operating docs — CLAUDE.md and its imports, AGENTS.md — before scanning build files) plus read-only hygiene and docs gate agents; then run the detected build/test checks alone (they may dirty the working tree, which would poison a concurrent audit); then one `fable-skeptic` attacking the readiness claim.
