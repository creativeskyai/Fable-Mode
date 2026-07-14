# Security Policy

## What the attack surface is

Fable Mode ships no runtime application code. The pack is:

- **Markdown** (doctrine, agents, skills) that Claude Code loads as instructions;
- **Workflow scripts** that run inside Claude Code's sandboxed Workflow tool (no filesystem or Node API access);
- **Two installer scripts** (`install.sh`, `install.ps1`) that copy files and append one import line to a `CLAUDE.md`.

The installers never delete, never overwrite existing files outside `--update` mode (which only touches pack-owned paths), never elevate, and never touch the network. The agents and workflows the pack defines run entirely under Claude Code's own permission system — the pack cannot grant itself capabilities your Claude Code configuration doesn't allow.

That said, prompt-injection-shaped issues are real for instruction packs: if you find wording in a shipped file that could cause Claude Code to take an action a reasonable user wouldn't expect (bypassing its permission prompts, exfiltrating data, weakening its own verification), treat that as a vulnerability and report it.

## Supported versions

Only the latest release is supported. Check your installed version at `.claude/fable/VERSION` and update with `./install.sh --update <project>` / `.\install.ps1 <project> -Update`.

## Reporting a vulnerability

Email **Hello@creativesky.ai** with the details — file, line, and the scenario in which it bites. Please don't open a public issue for anything you believe is exploitable before we've had a chance to fix it. You'll get an acknowledgement within a few days, and a fix or a reasoned disagreement within two weeks.
