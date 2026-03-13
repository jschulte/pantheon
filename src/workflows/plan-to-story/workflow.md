---
name: "plan-to-story"
description: "Lightweight plan-to-story pipeline. Slots work into the existing BMAD document trail without full quick-feature overhead. Three modes: pre-build, post-build, sweep."
---

# Plan-to-Story — Lightweight BMAD Document Trail Integration

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLAN-TO-STORY PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plan → Scope → Stories → Handoff
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

<purpose>
Slot work into the existing BMAD document trail without the full quick-feature overhead. Accepts a plan (file, inline, or git sweep) and produces stories, epics entries, and sprint-status updates that integrate with existing artifacts.

quick-feature creates the trail from scratch. plan-to-story assumes the trail exists and adds to it.
</purpose>

<philosophy>
**Lightweight Integration, Not Recreation**

Three modes handle different entry points:

| Mode | Input | Use Case |
|------|-------|----------|
| **pre-build** | A plan | Turn plan into stories before building |
| **post-build** | A plan | Retroactively document already-built work |
| **sweep** | Git history | Find undocumented work in recent commits |

Mode is auto-detected from content signals and user-confirmable.

The user has exactly **1 interaction point**:
- Phase 2 SCOPE: Mode confirmation, PRD amendment decision, epic placement

Everything else runs autonomously.
</philosophy>

<execution_discipline>
**CRITICAL: Orchestrator Model**

This workflow is a **Pantheon-style orchestrator** that does most work directly and spawns sub-agents only for edit-prd and create-story.

**DOES:**
- Parse plan input and detect mode (Phase 1)
- Sweep git history and cross-reference stories (Phase 1, sweep mode)
- Analyze PRD scope alignment and epic placement (Phase 2)
- Present user checkpoint with mode/PRD/epic decisions (Phase 2)
- Update epics.md directly (structured append — Phase 3)
- Spawn Task sub-agents for edit-prd and create-story only
- Validate generated story files (Phase 3)
- Update sprint-status.yaml directly (YAML append — Phase 4)

**DOES NOT:**
- Create PRD from scratch (if no PRD exists, warn and suggest quick-feature)
- Run architecture or sprint-planning sub-agents
- Ask user for approval except at the 1 designated stop (Phase 2)
- Write creative content directly — epics/sprint-status updates are structured appends

**Sub-Agent Pattern:**
Only two BMM workflows are invoked:
- **edit-prd** (conditional): Surgical PRD update with only new scope items. Step-file workflow with YOLO directive.
- **create-story** (per story): XML-instructions workflow with YOLO directive. Receives story spec, epics, PRD, and plan context.

**If no PRD/epics exist at all:**
Warn the user and suggest running `/quick-feature` for full trail creation. Allow proceeding if user confirms — create epics.md and sprint-status.yaml from scratch, skip PRD cross-references.
</execution_discipline>

## Phase Routing

Load phases on-demand from the `phases/` directory.

| # | Phase | File | Condition | Description |
|---|-------|------|-----------|-------------|
| 1 | INTAKE | phases/phase-1-intake.md | Always | Parse input, detect mode, load artifacts |
| 2 | SCOPE | phases/phase-2-scope.md | Always | PRD comparison, epic placement, **USER CHECKPOINT** |
| 3 | STORIES | phases/phase-3-stories.md | Always | Decompose, update epics, generate + validate stories |
| 4 | HANDOFF | phases/phase-4-handoff.md | Always | Update sprint-status, summary, next steps |

**Execution flow:**
1. Load `phases/phase-1-intake.md` — parse input, sweep if needed, detect mode
2. Load `phases/phase-2-scope.md` — analyze scope, **USER CHECKPOINT**, optional PRD edit
3. Load `phases/phase-3-stories.md` — decompose plan, update epics.md, generate stories
4. Load `phases/phase-4-handoff.md` — update sprint-status.yaml, display summary

> **IMPORTANT:** Read phase files on-demand, not upfront. Each phase validates its output before the next phase loads.

<failure_handling>
**No PRD found:** WARN — proceed without PRD cross-references. Note in summary.

**No epics.md found:** Create a new epics.md from scratch with the plan's stories.

**No sprint-status.yaml found:** Create a new sprint-status.yaml from scratch.

**PRD edit sub-agent fails:** WARN and continue. PRD amendment is optional — stories can still be generated.

**Story generation fails:** Retry up to 2 times per story. If still failing after retries, warn and continue with remaining stories.

**All stories fail:** HALT — systemic issue. Report and stop.

**Sweep finds nothing undocumented:** Report "All recent work is already documented" and exit gracefully.
</failure_handling>

<success_criteria>
- [ ] Plan input accepted (file, inline, or sweep-generated)
- [ ] Mode detected and user-confirmed (pre-build, post-build, or sweep)
- [ ] PRD amended if new scope found and user approved
- [ ] Epics.md updated with new story entries
- [ ] Story files generated and validated (>= 10KB each, 12+ sections)
- [ ] Sprint-status.yaml updated with new story entries
- [ ] Summary displayed with story table and next steps
</success_criteria>

<version_history>
**v1.0.0 — Initial Release**
1. Three-mode pipeline (pre-build, post-build, sweep)
2. 1-stop user interaction model (scope checkpoint)
3. Lightweight integration — reuses existing artifacts
4. Gap analysis for post-build/sweep modes
5. Direct epics/sprint-status updates (no sub-agents for structured appends)
</version_history>
