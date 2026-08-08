# Fable Mode — config

Defaults for every fable workflow in this project. Edit this file by hand or run
`/fable-config`. Skills read it at invocation, so changes apply to the next
command — no restart.

## Subagents (honored by every workflow)

```yaml
subagent_model: opus     # fable | opus | sonnet | haiku | inherit (= session model)
subagent_effort: medium  # low | medium | high | xhigh | inherit
fleet: standard          # light | standard | max — scales pools, votes, round caps
# votes: 3               # skeptics per review finding (uncomment to override the fleet preset)
# max_rounds: 6          # fable-exhaust round cap (uncomment to override the fleet preset)
# max_leads: 30          # fable-research deep-read cap (uncomment to override the fleet preset)
```

What `fleet` changes, concretely: **light** = 2 finder stances instead of 4
(exhaust), 2 design stances and 2 judges instead of 3, 1 skeptic per finding
instead of 3, 12 research leads instead of 30, round cap 3 instead of 6 — a
`/fable-review` drops from roughly 16 agents to 6. **standard** = the shipped
defaults. **max** = 5 skeptics per finding, 60 leads, round cap 8, for audits.

Subagent thinking has no separate switch — it follows `subagent_effort`. Set
`subagent_effort: low` for minimal subagent thinking; the skeptic/judge
structure, not deliberation depth, is what carries verification quality.

## Main agent (set in the harness, recorded here)

The pack cannot set your session's model, effort, or thinking — those are Claude
Code settings:

- Model: `/model` (pick Fable 5 or Opus 5)
- Effort: `/effort low` — on Fable 5, low effort is fast, cheap, and still strong
- Thinking: toggle with Tab in the CLI, or via `/config`

Recommended setups (apply the subagent half with `/fable-config <preset>`):

| Preset | Main agent | Subagents | Fleet |
|---|---|---|---|
| `value` (the default) | Fable 5 @ low effort, or Opus 5 | opus @ medium | standard (3 votes) |
| `light` | anything | inherit @ low | light (1 vote) |
| `max` | Fable 5 @ high | opus @ high | max (5 votes) |
