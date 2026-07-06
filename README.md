# Fable-Mode

Drop-in `.claude/` assets that give any Claude Code project the **Fable 5 / Ultracode working style** on any model (Opus, Sonnet, Haiku): phase discipline across the whole lifecycle (planning → design → development → deployment), multi-agent workflow orchestration, adversarial verification of every finding, loop-until-dry exhaustiveness, continuous long-run operation, and Fable-grade reporting.

Prompts can't change model weights — what this pack ports is the **process**, and most of what makes Ultracode output trustworthy is process: independent perspectives, skeptics that kill plausible-but-wrong claims, completeness critics, and honest reporting of what was and wasn't covered.

## What's in the box

```
.claude/
├── fable/FABLE.md          # the always-on operating doctrine (imported into CLAUDE.md)
├── agents/                 # the subagent fleet the workflows are built from
│   ├── fable-scout.md      #   read & map (read-only)
│   ├── fable-finder.md     #   hunt defects with concrete failure scenarios
│   ├── fable-skeptic.md    #   adversarial verifier — tries to refute claims
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
    ├── fable/              #   /fable — load the doctrine (if not wired into CLAUDE.md)
    ├── ultra/              #   /ultra <task> — full multi-phase orchestration
    ├── fable-review/       #   /fable-review [target]
    ├── fable-plan/         #   /fable-plan <design question>
    ├── fable-research/     #   /fable-research <question>
    ├── fable-exhaust/      #   /fable-exhaust [what/where]
    ├── fable-ship/         #   /fable-ship [scope] — release gate (verifies; never deploys)
    └── fable-marathon/     #   /fable-marathon [goal] — continuous goal-directed operation
```

## Install

From this repo, into any project:

```powershell
# Windows
.\install.ps1 -Target C:\path\to\your\project
```

```bash
# macOS / Linux
./install.sh /path/to/your/project
```

The installer copies the `.claude/` assets (never overwriting existing files unless you pass `-Force` / `--force`) and adds one line to the target's `CLAUDE.md`:

```markdown
# Fable Mode
@.claude/fable/FABLE.md
```

Manual install is the same two steps: copy the `.claude/` folder contents into the project's `.claude/`, and add the import line. If you prefer not to touch `CLAUDE.md` at all, skip the import and run `/fable` at the start of a session instead.

**Restart any open Claude Code session in the target project after installing** — agent types register at session start and don't hot-reload. (The workflows survive an unregistered agent by falling back to the default agent type, with a log line telling you to restart.)

## Usage

With the doctrine wired into `CLAUDE.md`, no commands are needed — the model treats every substantive task as an Ultracode task: it maps before designing, panels wide decisions, reviews its own diffs with skeptics, and reports what it didn't cover. The skills are for invoking specific machinery directly:

| Command | What runs |
|---|---|
| `/ultra add rate limiting to the API` | understand → design → implement → review (→ ship), full pipeline |
| `/fable-review` | 4 finder dimensions, every finding attacked by lens-diverse skeptics |
| `/fable-plan how should auth tokens be stored?` | 3 divergent designs, 3-judge panel, synthesized plan |
| `/fable-research where do we validate uploads?` | 5 search modalities, cited answer, completeness critic |
| `/fable-exhaust` | rounds of diverse finders until two rounds come up dry |
| `/fable-ship` | release-readiness gate: project checks + hygiene + docs, skeptic verdict |
| `/fable-marathon build out the v2 API` | continuous cycles: one backlog item per cycle, verified, committed |
| `/fable` | load the doctrine mid-session (fallback when CLAUDE.md isn't wired) |

## Continuous operation

`/fable-marathon` is built for long runs. It keeps all state in `FABLE-RUN.md` at the project root (goal, backlog with statuses, journal, next action), executes one backlog item per cycle through the full phase discipline, and commits at verified milestones — so every cycle is resumable from the file alone, across sessions, compactions, or machines.

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
| Judge panel for wide solution spaces | `fable-design.js` + `fable-judge` agent |
| Loop-until-dry discovery | `fable-exhaust.js` (2 consecutive dry rounds to stop) |
| Multi-modal sweep | `fable-research.js` (names, content, structure, history, tests) |
| Completeness critic | `fable-critic` agent; final stage of `fable-research.js` |
| No silent caps | every workflow `log()`s anything it bounded; doctrine requires it in reports |
| Fable reporting standards | `FABLE.md` Reporting section + `fable-scribe` agent |
| Token-budget awareness (`+500k` directives) | `fable-exhaust.js` checks `budget.remaining()` each round |
| Long-running autonomous work | `/fable-marathon` + `FABLE-RUN.md` state file; composes with `/loop` |
| Release gating before deploys | `fable-ship.js` + `/fable-ship` (verifies readiness; never deploys) |

## Tuning

- **Per-agent models** — every agent ships with `model: inherit`. To cut cost, pin cheap roles down (e.g. `model: haiku` in `fable-scout.md`); to raise verification quality on a Sonnet session, pin `fable-skeptic` and `fable-judge` to `opus`.
- **Verification strictness** — `votes` in the review workflow (3 default, 5 for audits); the dry-round threshold and `MAX_ROUNDS` in `fable-exhaust.js`.
- **Doctrine** — `FABLE.md` is plain markdown; edit the scale dial or reporting rules to taste. It's loaded into every session, so keep it lean.

## Requirements and honest limits

- **Claude Code with the Workflow tool** for the full experience. On older versions without it, the doctrine and skills fall back to the same structures built from parallel Agent-tool calls — same shape, less deterministic control flow.
- **Token cost is real.** This is Ultracode-style orchestration: a `/fable-review` spawns ~16+ agents; `/fable-exhaust` can spawn dozens. The doctrine's scale dial ("quick" / "no agents") is the off switch.
- **It's still the base model underneath.** The pack buys you Fable's process — coverage, verification, and honesty about gaps — not Fable's single-shot reasoning depth. On hard problems the panels and skeptics close much of that gap; on easy ones they're mostly insurance.
