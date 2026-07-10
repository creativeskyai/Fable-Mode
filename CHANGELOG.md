# Changelog

If a release ever removes a shipped file, the entry lists the stale path so `--update` users can delete it manually.

## 1.4.0 — 2026-07-09

Open-source release under MIT. No functional changes to the pack's machinery — every workflow and agent behaves exactly as in 1.3.0; the only shipped-file edits are the version stamp and one naming fix.

- MIT license (root `LICENSE`); the pack may now be installed, modified, and redistributed freely.
- Community infrastructure: `CONTRIBUTING.md` (the wiring rules and validation commands a PR must respect), `CODE_OF_CONDUCT.md`, `SECURITY.md` (what the attack surface of an instruction pack actually is), issue forms, and a PR template that asks for the checker + installer smoke test.
- README rebuilt for public consumption: banner, clone-and-install quickstart, the review pipeline explained and illustrated, per-model guidance (Opus 4.8 / Sonnet 5 / Haiku 4.5, and how the pack composes with Claude Code's `ultracode` setting), FAQ, non-affiliation notice. Visual assets live in `assets/` (repo-level, never shipped by the installers).
- Naming standardized to "Fable Mode" in all prose and program output ("Fable-Mode" remains only as the repo slug); the one shipped-file instance was in the `fable` skill's partial-install message.
- Installers no longer suggest `--update` when the target already has the current pack version, read the installed version *before* copying (so a freshly copied `VERSION` can't mask a stale pre-1.0 install — caught by the pack's own review fleet), and never ship session-local files (`settings.local.json`, `.DS_Store`) even when present in a working clone.
- CI hardened: `permissions: contents: read`, push runs restricted to `main` (PRs still get their own runs), 10-minute job timeouts, and superseded PR runs auto-cancelled — the last two found by the pack's own review fleet run over this release.
- `PORTABILITY-PROPOSAL.md` moved to `docs/`, reframed for public readers (neutral draft banner, internal review notes generalized, an unverifiable third-party security claim replaced with general supply-chain guidance).

## 1.3.0 — 2026-07-07

Adoptions judged in from Anthropic's loop-design guidance (most of it the pack already had — `/goal`-style stop conditions are marathon done-whens, "encode the fix into the system" is the Proposals mechanism; what follows is the delta).

- `fable-migrate` pilots before fanning out: with 4+ discovered files, two representative files are transformed and checked first; if the pilot fails, the fan-out is aborted (`pilotFailed` in the result) and the remaining files are never touched — a bad instruction now fails at two files' cost, not the fleet's. Below 4 files the pilot is skipped, announced.
- Verification doctrine: verify by observing changed behavior end-to-end (real tests, real command, running app), never by edit success; prefer machine-checkable conditions. Marathon's execute step prefers end-to-end checks the same way.
- Loop composition documented: FABLE.md, README, and GUIDE.md name `/goal` alongside `/loop` and scheduled tasks — a backlog item's done-when command is a ready-made goal condition; GUIDE.md maps the loop types to pack pieces.

## 1.2.0 — 2026-07-07

Project-facts seam: workflows and agents now treat a target project's own operating docs as authoritative over re-detection. Design chosen by a judge panel (a prompt-level reading convention scored 9/10 against a FABLE-PROJECT.md contract file and a checker-enforced resolver stage — no new files, no parser, byte-identical behavior for targets that document nothing).

- `fable-ship` detection and docs gates, and `fable-migrate`'s verify fallback, read the target's root CLAUDE.md (plus its `@path` imports), AGENTS.md, CONTRIBUTING.md, and README before self-detecting from package.json/Makefile/CI; detection provenance is reported in the mech notes.
- Decision-log respect in the three judgment agents: finders don't report disagreement with Locked entries (but do report code violating them, citing the id); skeptics may refute findings that relitigate Locked decisions; judges score contradicting a Locked entry like misreading the code.
- `fable-builder` treats actions the project's docs or FABLE-RUN.md Walls mark always-queue-for-user as blocked; marathon seeds Walls from the project's own docs.
- FABLE.md gains a one-fact-one-home doctrine bullet: forward known facts via workflow args instead of letting fleets re-derive them.
- New one-page user guide ships in the pack (`.claude/fable/GUIDE.md`): what to run when, look-alike disambiguation, what marathon runs automatically, cost dial. Never loaded into context.
- Wiring checker: GUIDE.md added to the reference scan; new drift guard requires every decision-log mention across agents/docs to use the one canonical phrase.

## 1.1.0 — 2026-07-07

Unattended-run hardening, judged in from an external autonomous-loop field guide (each adoption vetted by a three-lens judge panel; the guide's shell infrastructure — cron loops, trust ledgers, cost scripts, model dispatch — was rejected as redundant with the Workflow tool and harness `/loop`).

- Marathon run file gains **Walls** (per-run always-queue-for-user actions, written at creation so they survive compaction) and **Invariants** (finished items graduate into cheap, read-only check commands; every cycle re-verifies them and a violation becomes the next item, or a blocked item after one failed fix or a Wall hit).
- Marathon backlog items record a machine-checkable done-when command where one exists; an item is done only when its command passes; "the project's tests" generalized to "the project's own checks".
- Standoff rule: verification rejecting the same fix twice stops iteration — blocked item in marathon, surfaced to the user per FABLE.md's "When a run breaks". Blocking mid-item reverts or branch-parks unverified work first.
- Marathon retro at stopping points: up to three proposed new Walls/Invariants recorded under a dedicated Proposals section — effective only when the user moves them up.
- Test-integrity law: never weaken, skip, or delete a test or check to make work pass (FABLE.md, fable-builder, and an always-critical rule in fable-review's correctness finder).
- Grounded progress claims in FABLE.md Reporting: audit each claim against a session tool result before reporting it.
- Schema field `reasoning` renamed to `evidence` in review/exhaust VERDICT and design SCORES (never read by scripts; avoids reasoning-extraction-adjacent phrasing).
- README: per-stage effort tuning guidance (override verified working in the current harness); Continuous-operation section documents Walls/Invariants/standoff.

## 1.0.0 — 2026-07-06

Initial versioned release.

- New skills `/fable-understand` and `/fable-migrate` expose their workflows standalone.
- Skeptic verification uses contrastive framing (strongest case for, then against, then decide) instead of pure refute framing; skeptic and critic agents state confidence with each verdict.
- Judge panels in `fable-design` see candidates in a rotated order per judge to remove position bias.
- Deep-read and gap-follow-up reports in `fable-research` are capped at 250 words to keep the synthesis prompt dense.
- `fable-exhaust` skeptic verdicts converged to the same refuted-polarity schema as `fable-review`; per-round dedup broadcast shrunk to file:line locations.
- `fable-ship` runs its read-only gates (detect, hygiene, docs) concurrently; build/test checks follow.
- Installers gain `--update` / `-Update` (refresh pack-owned files, never touch anything else) and print the pack version; `--force` / `-Force` deprecated as aliases.
- Version stamping via `.claude/fable/VERSION` (ships with the pack).
- Wiring checker: evaluates the meta literal, scans README/CLAUDE.md references, requires every shipped workflow/agent to be mentioned in the doctrine, polices byte-identical twin blocks (run(), LENSES, CONTRAST) and their presence, validates VERSION/CHANGELOG consistency.
- CI: checker plus installer smoke tests on ubuntu and windows.
