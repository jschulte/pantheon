# Quick Feature — Automated BMAD Planning Pipeline

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUICK FEATURE PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plan → Clarify → PRD → Architecture →
Epics → Sprint → Stories → Build
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

<purpose>
Go from a plan to stories-being-built in a single command. Automates BMAD approval prompts while preserving the full document trail (PRD, architecture, epics, sprint-status, stories).

The document trail IS the value. We automate approvals, not thinking.
</purpose>

<philosophy>
**Autonomy Without Shortcuts**

1. Accept a plan (file or inline text)
2. Ask targeted clarifying questions (adaptive: 4-12 based on plan detail)
3. Run the entire BMM planning chain autonomously
4. Produce the full document trail
5. Hand off to batch-stories for implementation

The user has exactly **2 interaction points**:
- Phase 2 CLARIFY: Targeted multiple-choice questions
- Phase 5 POST-EPICS: Epic selection + build mode

Everything else runs without user input.
</philosophy>

<execution_discipline>
**CRITICAL: Sub-Agent Orchestration Model**

This workflow is a **Pantheon-style orchestrator** that spawns sub-agents for each BMM workflow step. The orchestrator:

**DOES:**
- Read and parse plan input (Phase 1)
- Ask clarifying questions (Phase 2)
- Spawn Task sub-agents for BMM workflows (Phases 3-7)
- Validate output artifacts after each phase
- Present epic selection + build mode (Phase 5 checkpoint)
- Hand off to batch-stories (Phase 8)

**DOES NOT:**
- Write PRD/architecture/epics content directly
- Run BMM workflow steps inline (always delegate to sub-agents)
- Skip validation between phases
- Ask user for approval except at the 2 designated stops

**Sub-Agent Pattern:**
Each BMM workflow sub-agent receives:
1. The YOLO directive (auto-approve all checkpoints)
2. The BMM workflow file to follow
3. BMM config path for variable resolution
4. The ENRICHED_PLAN as user requirements
5. Paths to prior phase outputs (PRD, architecture, etc.)

**Two BMM invocation patterns:**
- **Step-file workflows** (edit-prd, create-architecture, create-epics-and-stories): Sub-agent follows the workflow file with YOLO directive — auto-selects [c] Continue at every menu
- **Workflow.yaml workflows** (sprint-planning, create-story): Sub-agent loads workflow.yaml and enters its native YOLO mode
</execution_discipline>

## Phase Routing

Load phases on-demand from the `phases/` directory.

| # | Phase | File | Condition | Description |
|---|-------|------|-----------|-------------|
| 1 | INTAKE | phases/phase-1-intake.md | Always | Accept plan, detect mode |
| 2 | CLARIFY | phases/phase-2-clarify.md | Always | Adaptive questions (4-12) |
| 3 | PRD | phases/phase-3-prd.md | Always | Run edit-prd/create-prd |
| 4 | ARCHITECTURE | phases/phase-4-architecture.md | skip_architecture != true | Run create-architecture |
| 5 | EPICS | phases/phase-5-epics.md | Always | Run create-epics-and-stories + checkpoint |
| 6 | SPRINT | phases/phase-6-sprint.md | Always | Run sprint-planning |
| 7 | STORIES | phases/phase-7-stories.md | Always | Generate + validate all stories |
| 8 | BUILD | phases/phase-8-build.md | Always | Hand off to batch-stories |

**Execution flow:**
1. Load `phases/phase-1-intake.md` — parse input, detect artifacts
2. Load `phases/phase-2-clarify.md` — ask questions, build enriched plan
3. Load `phases/phase-3-prd.md` — spawn PRD sub-agent
4. If `skip_architecture` is false: load `phases/phase-4-architecture.md`
5. Load `phases/phase-5-epics.md` — spawn epics sub-agent + **USER CHECKPOINT**
6. Load `phases/phase-6-sprint.md` — spawn sprint-planning sub-agent
7. Load `phases/phase-7-stories.md` — generate and validate all stories
8. Load `phases/phase-8-build.md` — execute pre-selected build mode

> **IMPORTANT:** Read phase files on-demand, not upfront. Each phase validates its output artifact before the next phase loads.

<failure_handling>
**Missing plan input:** Ask user for plan text (Phase 1 handles gracefully).

**BMM workflow fails:** HALT the pipeline. Report which phase failed and why. Do NOT continue to next phase (except architecture — see below).

**Architecture failure:** WARN but continue. Architecture is valuable but not strictly required for epics. Log the warning and proceed to Phase 5.

**Artifact too small:** WARN with actual vs expected size. Allow pipeline to continue but flag the concern.

**Story validation fails:** Retry up to 2 times (per story). If still failing after retries, warn and continue with remaining stories.

**All stories fail:** HALT — this indicates a systemic issue. Report and stop.

**PRD or Epics failure:** HALT — these are foundation documents. Cannot continue without them.
</failure_handling>

<success_criteria>
- [ ] Plan input accepted and enriched with clarifications
- [ ] PRD generated (>= 5KB) with key sections
- [ ] Architecture generated (>= 3KB) or skipped with reason
- [ ] Epics generated with BDD acceptance criteria
- [ ] Sprint-status.yaml created with story entries
- [ ] All story files generated and validated (>= 10KB each, 12+ sections)
- [ ] Build mode selected and handoff executed
- [ ] Full document trail preserved in planning/implementation artifacts
</success_criteria>

<version_history>
**v1.0.0 — Initial Release**
1. Full BMAD planning chain automation (8 phases)
2. Adaptive clarification (4-12 questions based on plan detail)
3. 2-stop user interaction model (clarify + post-epics)
4. Story validation with retry logic
5. Batch-stories handoff with mode selection
</version_history>
