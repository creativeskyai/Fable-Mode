# Fable-Mode

Drop-in `.claude/` assets that give any Claude Code project the **Fable 5 / Ultracode working style** on any model (Opus, Sonnet, Haiku): phase discipline across the whole lifecycle (planning → design → development → deployment), multi-agent workflow orchestration, adversarial verification of every finding, loop-until-dry exhaustiveness, continuous long-run operation, and Fable-grade reporting.

Prompts can't change model weights — what this pack ports is the **process**, and most of what makes Ultracode output trustworthy is process: independent perspectives, skeptics that kill plausible-but-wrong claims, completeness critics, and honest reporting of what was and wasn't covered.

## What's in the box

```
.claude/
├── fable/
│   ├── FABLE.md            # the always-on operating doctrine (imported into CLAUDE.md)
│   ├── GUIDE.md            # one-page user guide: what to run, when (for you — never loaded into context)
│   └── VERSION             # pack version stamp (printed by the installers)
├── agents/                 # the subagent fleet the workflows are built from
│   ├── fable-scout.md      #   read & map (read-only)
│   ├── fable-finder.md     #   hunt defects with concrete failure scenarios
│   ├── fable-skeptic.md    #   adversarial verifier — weighs claims both ways, kills the wrong ones
│   ├── fable-judge.md      #   scores candidates on one rubric, grounded in code
│   ├── fable-builder.md    #   precisely-scoped edits, self-verified
│   ├── fable-critic.md     #   completeness critic — finds what's missing
│   └── fable-scribe.md     #   synthesizes fan-out results into one readable report
├── workflows/              # named workflows for the Workflow tool
│   ├── fable-understand.js #   partition → parallel deep-read → architecture brief
│   ├── fable-design.js     #   3 divergent designs → judge panel → synthesis
│   ├── fable-review.js     #   4 review dimensions → N lens-diverse skeptics per finding
│   ├── fable-research.js   #   5-modality sweep → deep-read → synthesis → critic
│   ├── fable-exhaust.js    #   loop-until-dry hunt with 3-lens verification
│   ├── fable-migrate.js    #   4-modality discovery → transform each → check each → run suite
│   └── fable-ship.js       #   release-readiness gate: detect checks → run gates → skeptic verdict
└── skills/                 # slash commands
    ├── fable/              #   /fable [task] — load the doctrine (if not wired into CLAUDE.md)
    ├── ultra/              #   /ultra <task> — full multi-phase orchestration
    ├── fable-understand/   #   /fable-understand [focus] — map a codebase or subsystem
    ├── fable-review/       #   /fable-review [target]
    ├── fable-plan/         #   /fable-plan <design question>
    ├── fable-research/     #   /fable-research <question>
    ├── fable-exhaust/      #   /fable-exhaust [what to hunt] [scope]
    ├── fable-migrate/      #   /fable-migrate <instruction> — repo-wide mechanical change
    ├── fable-ship/         #   /fable-ship [scope] — release gate (verifies; never deploys)
    └── fable-marathon/     #   /fable-marathon [goal] — continuous goal-directed operation
```

## Install

From this repo, into any project:

```powershell
# Windows
.\install.ps1 C:\path\to\your\project
```

```bash
# macOS / Linux
./install.sh /path/to/your/project
```

The installer copies the `.claude/` assets (never overwriting existing files) and adds one line to the target's `CLAUDE.md`:

```markdown
# Fable Mode
@.claude/fable/FABLE.md
```

Manual install is the same two steps: copy the `.claude/` folder contents into the project's `.claude/`, and add the import line. If you prefer not to touch `CLAUDE.md` at all, skip the import and run `/fable` at the start of a session instead.

**Restart any open Claude Code session in the target project after installing** — agent types register at session start and don't hot-reload. (The workflows survive an unregistered agent by falling back to the default agent type, with a log line telling you to restart.)

## Update

Re-run the installer with `-Update` / `--update` to refresh an installed project to the pack's current version:

```powershell
.\install.ps1 C:\path\to\your\project -Update
```

```bash
./install.sh --update /path/to/your/project
```

Update overwrites every **pack-owned** file — any path the pack ships under `.claude/` — and touches nothing else. That includes overwriting documented tuning edits (pinned models in agent files, edited FABLE.md, changed exhaust thresholds), so commit the target project before updating and re-apply your tuning from the diff. Files you created yourself (your own agents, skills, settings) are never touched. The installed version is readable at `.claude/fable/VERSION`; changes per version are in this repo's `CHANGELOG.md`. If a future release ever removes a shipped file, the changelog will list the stale path to delete manually.

## Uninstall

Two steps, no script needed:

1. Remove the `# Fable Mode` heading and the `@.claude/fable/FABLE.md` import line from the project's `CLAUDE.md` (delete the file if the installer created it and you added nothing else).
2. Delete the pack's files — everything is namespaced `fable*` except the `ultra` skill:

```powershell
Remove-Item -Recurse -Force .claude\fable, .claude\skills\ultra
Get-ChildItem .claude\agents\fable-*.md, .claude\workflows\fable-*.js | Remove-Item
Get-ChildItem .claude\skills -Directory -Filter fable* | Remove-Item -Recurse -Force
```

```bash
rm -rf .claude/fable .claude/skills/ultra .claude/skills/fable*
rm -f .claude/agents/fable-*.md .claude/workflows/fable-*.js
```

## Usage

A one-page routing guide — which command to run when, how they differ, and what `/fable-marathon` runs on its own — ships with the pack as [.claude/fable/GUIDE.md](.claude/fable/GUIDE.md), so it's also present in every project you install into.

With the doctrine wired into `CLAUDE.md`, no commands are needed — the model treats every substantive task as an Ultracode task: it maps before designing, panels wide decisions, reviews its own diffs with skeptics, and reports what it didn't cover. The skills are for invoking specific machinery directly (bracketed arguments are optional and have sensible defaults):

| Command | What runs |
|---|---|
| `/ultra add rate limiting to the API` | understand → design → implement → review (→ ship), full pipeline |
| `/fable-understand [focus]` | partition the repo/subsystem, parallel deep-reads, one cited architecture brief |
| `/fable-review [target]` | 4 finder dimensions, every finding attacked by lens-diverse skeptics |
| `/fable-plan how should auth tokens be stored?` | 3 divergent designs, 3-judge panel, synthesized plan |
| `/fable-research where do we validate uploads?` | 5 search modalities, cited answer, completeness critic |
| `/fable-exhaust [what to hunt] [scope]` | rounds of diverse finders until two rounds come up dry |
| `/fable-migrate <instruction>` | 4-modality discovery, per-file transform + independent check, project suite once |
| `/fable-ship [scope]` | release-readiness gate: project checks + hygiene + docs, skeptic verdict |
| `/fable-marathon build out the v2 API` | continuous cycles: one backlog item per cycle, verified, committed |
| `/fable [task]` | load the doctrine mid-session (fallback when CLAUDE.md isn't wired) |

## Continuous operation

`/fable-marathon` is built for long runs. It keeps all state in `FABLE-RUN.md` at the project root (goal, walls, backlog with statuses and machine-checkable done-when commands, standing invariants, journal, next action — created automatically), executes one backlog item per cycle through the full phase discipline, and commits at verified milestones — so every cycle is resumable from the file alone, across sessions, compactions, or machines. It expects a git repository (checkpoint commits are its safety rail): on a non-git project it offers `git init` once; declining disables rollback, not the run.

Three disciplines keep unattended runs honest: **Walls** (a per-run list of actions that always queue for the user — secrets, payments, anything destructive or externally visible — written into the run file so it survives compaction), **Invariants** (finished items graduate into cheap, re-runnable check commands that every cycle re-verifies, so nothing that passed once rots silently), and a **standoff rule** (when implementation and verification disagree twice, the item is blocked for the user instead of burning tokens all night). At natural stopping points the run also sweeps its own failures and proposes up to three new Walls or Invariants — proposals only, never self-applied.

For unattended operation, compose it with whatever loop mechanism your Claude Code version provides:

```
/loop /fable-marathon        # self-paced recurring cycles
/loop 30m /fable-marathon    # fixed interval
```

or point a scheduled task / cron-style routine at the same command. Marathon stops cycling on its own only for things that are genuinely the user's: an empty backlog, input only they can provide, or a destructive/deploy action (which it gates behind `/fable-ship` and hands to you).

## How it maps to Fable 5 Ultracode

| Ultracode behavior | Pack mechanism |
|---|---|
| Workflow orchestration by default | standing authorization in `FABLE.md`, plus per-skill opt-in |
| Adversarial verify (N refuting skeptics, majority kills) | `fable-review.js` verify stage; `fable-skeptic` agent |
| Perspective-diverse verification | three-lens panels in `fable-review.js` and `fable-exhaust.js` |
| Judge panel for wide solution spaces | `fable-design.js` + `fable-judge` agent (rotated presentation order per judge) |
| Loop-until-dry discovery | `fable-exhaust.js` (2 consecutive dry rounds to stop) |
| Multi-modal sweep | `fable-research.js` (names, content, structure, history, tests) |
| Completeness critic | `fable-critic` agent; final stage of `fable-research.js` |
| No silent caps | every workflow `log()`s anything it bounded; doctrine requires it in reports |
| Fable reporting standards | `FABLE.md` Reporting section + `fable-scribe` agent |
| Token-budget awareness (`+500k` directives) | `fable-exhaust.js` checks `budget.remaining()` each round |
| Long-running autonomous work | `/fable-marathon` + `FABLE-RUN.md` state file; composes with `/loop` |
| Release gating before deploys | `fable-ship.js` + `/fable-ship` (verifies readiness; never deploys) |

## Tuning

- **Per-agent models** — every agent ships with `model: inherit`. The intended tuning lever is pinning models in agent frontmatter (e.g. `model: haiku` in `fable-scout.md`), **but that field is currently ignored by Claude Code** ([anthropics/claude-code#44385](https://github.com/anthropics/claude-code/issues/44385)) — subagents inherit the session model regardless. Until that's fixed, the working alternative is passing `model` in direct Agent-tool calls; the shipped files deliberately stay on `inherit` either way.
- **Verification strictness** — `votes` in the review workflow (3 default, 5 for audits); the dry-round threshold and `MAX_ROUNDS` in `fable-exhaust.js`.
- **Per-stage effort** — workflow agents inherit the session's reasoning effort; the Workflow tool accepts a per-agent `effort` override (`'low'`…`'max'`, verified working in the current harness). The discipline: spend effort where the loop branches — skeptics and judges — and keep mechanical stages at the default; raising every stage at once buys cost, not quality. The shipped workflows deliberately set no effort overrides.
- **Doctrine** — `FABLE.md` is plain markdown; edit the scale dial or reporting rules to taste. It's loaded into every session, so keep it lean.

### Cost control

- The scale dial is the main lever: "quick" or "no agents" in your request drops to solo work; "thorough"/"audit" scales up.
- Prefer `/fable-research` over `/fable-exhaust` for scoped questions — research is one bounded sweep; exhaust loops until dry (capped at `MAX_ROUNDS = 6` and a 40k-token budget floor per round check in `fable-exhaust.js`).
- Review defaults to 3 skeptic votes per finding; 5-vote mode is for release audits, not everyday diffs.
- Every workflow announces every bound it applies (round caps, lead caps, budget stops) in its log — a stopped run always says why.

### If a run dies

Workflows are stateless between invocations — re-invoke the skill, narrowing the args to what's still unanswered; nothing in the repo is lost. `/fable-marathon` resumes from `FABLE-RUN.md`. If every workflow fails with "agent type not found", the pack was just installed: restart the session (the runs still complete via the default-agent fallback in the meantime).

## Requirements and honest limits

| Your Claude Code | What you get |
|---|---|
| Workflow tool available (documented floor: v2.1.154+, paid plan) | the full experience — named workflows, deterministic orchestration |
| Agent tool only | the same structures via each skill's shipped fallback: parallel subagent calls, same stages, less deterministic control flow |
| Neither | doctrine-only via `/fable` — phase discipline and reporting standards, solo execution |

**Restart semantics:** agents (`.claude/agents/`) and the `CLAUDE.md` import load at session start — restart after installing or editing them. Skills and workflow scripts are read at invocation — edits hot-reload.

- **Token cost is real.** This is Ultracode-style orchestration: a `/fable-review` spawns ~16+ agents; `/fable-exhaust` can spawn dozens. The doctrine's scale dial ("quick" / "no agents") is the off switch.
- **It's still the base model underneath.** The pack buys you Fable's process — coverage, verification, and honesty about gaps — not Fable's single-shot reasoning depth. On hard problems the panels and skeptics close much of that gap; on easy ones they're mostly insurance.
