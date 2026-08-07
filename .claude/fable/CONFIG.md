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

What `fleet` changes: **light** = smaller finder pools, 1 skeptic per finding,
lower round and lead caps. **standard** = the shipped defaults (3 skeptics).
**max** = 5-vote verification and raised caps, for audits.

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
