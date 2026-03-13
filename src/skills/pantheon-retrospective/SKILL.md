---
name: Pantheon Epic Retrospective
description: Run an automated retrospective on a completed epic. Analyzes all build artifacts (narrative logs, review findings, progress metrics, reflections) to identify cross-story patterns and produce actionable outputs — playbook updates, CLAUDE.md patches, and Pantheon process suggestions. Invoke when an epic is complete, after running batch-stories or story-pipeline for all stories.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Edit
  - Write
---

# Epic Retrospective — Artifact-Driven Analysis

> **Canonical source:** `src/workflows/epic-retrospective/workflow.md`
> This file is a Copilot-adapted skill. For full details, refer to the canonical workflow.
> When this file conflicts with the canonical source, the canonical source wins.

**Role:** Orchestrate an automated retrospective on a completed epic.
**Philosophy:** The artifacts ARE the discussion. Analyze evidence, propose concrete changes.

## Input Contract

| Parameter | Required | Description | Failure Behavior |
|-----------|----------|-------------|------------------|
| `epic_num` | No | Epic number to retrospect (e.g., `1`) | Auto-detect from sprint-status.yaml |
| `sprint_artifacts` | Yes | Path to sprint artifacts directory | Halt with error |
| `implementation_artifacts` | Yes | Path to implementation artifacts directory | Halt with error |

## The Phases (4 logical, 3 execution steps)

1. **GATHER** — Discover completed epic, collect all build artifacts from completions/
2-3. **ANALYZE + SYNTHESIZE** — Clio performs cross-story pattern analysis and generates all outputs (single agent, preserves cross-story context)
4. **PRESENT** — Display findings, user approves playbook/CLAUDE.md/process changes

## Quick Start

Load the workflow configuration:

```
Read {project-root}/_bmad/pantheon/workflows/epic-retrospective/workflow.yaml
Read {project-root}/_bmad/pantheon/workflows/epic-retrospective/workflow.md
```

Then execute phases sequentially, loading each phase file on demand:

```
Read {project-root}/_bmad/pantheon/workflows/epic-retrospective/phases/phase-1-gather.md
# Execute Phase 1...

Read {project-root}/_bmad/pantheon/workflows/epic-retrospective/phases/phase-2-analyze.md
# Execute Phases 2-3 (combined, spawns Clio)...

Read {project-root}/_bmad/pantheon/workflows/epic-retrospective/phases/phase-4-present.md
# Execute Phase 4 (user checkpoint)...
```

## What Gets Produced

| Output | Location | Applied? |
|--------|----------|----------|
| Retrospective document | `{implementation_artifacts}/epic-{N}-retro-{date}.md` | Always saved |
| Playbook updates | `{sprint_artifacts}/retro-proposals/playbook-updates.md` | User approves |
| CLAUDE.md patches | `{sprint_artifacts}/retro-proposals/claude-md-patches.md` | User approves |
| Pantheon suggestions | `{sprint_artifacts}/retro-proposals/pantheon-suggestions.md` | Never auto-applied |
| Analysis data | `{sprint_artifacts}/retro-proposals/analysis.json` | Reference only |

## Constraints

- Never apply Pantheon process suggestions directly — present as suggestions only
- Never fabricate findings — every insight must cite specific artifacts with evidence
- Never skip the user checkpoint in Phase 4 — all changes require approval
- Never modify story files or sprint-status (except marking retro as done)
