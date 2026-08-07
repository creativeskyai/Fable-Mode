---
name: fable-config
description: View or change Fable Mode defaults — subagent model, subagent effort, fleet size, skeptic votes — by editing .claude/fable/CONFIG.md. Presets - value, light, max. Use for "use fewer agents", "run subagents on haiku", "crank verification up", "cheaper runs".
argument-hint: "[show | <key> <value>... | value | light | max]"
---

This is a mechanical edit of `.claude/fable/CONFIG.md` — do it yourself, no agents.

1. Read `.claude/fable/CONFIG.md`. If it is missing, recreate it from the template at the end of this file first.
2. No arguments, or `show`: print the current yaml settings as a short table, then the harness commands for the main agent (`/model`, `/effort`, thinking toggles with Tab or `/config`). Stop.
3. `<key> <value>` pairs: update those keys in the yaml block. Valid keys and values — `subagent_model`: fable | opus | sonnet | haiku | inherit; `subagent_effort`: low | medium | high | xhigh | inherit; `fleet`: light | standard | max; `votes`, `max_rounds`, `max_leads`: positive integers. Reject anything else, showing the valid list.
4. A preset name rewrites the yaml keys: `value` → opus / medium / standard / votes 3; `light` → inherit / low / light / votes 1; `max` → opus / high / max / votes 5.
5. Confirm in two lines: what changed, and that it applies to the next fable command (no restart needed). If the user also asked about the main agent's model, effort, or thinking, give them the exact harness commands — you cannot run those for them.

Template for a missing CONFIG.md — recreate the `## Subagents` yaml block exactly as:

```yaml
subagent_model: opus     # fable | opus | sonnet | haiku | inherit (= session model)
subagent_effort: medium  # low | medium | high | xhigh | inherit
fleet: standard          # light | standard | max — scales pools, votes, round caps
votes: 3                 # skeptics per review finding (overrides the fleet preset)
```
