---
name: "epic-retrospective"
description: "Automated epic retrospective — ingests all build artifacts from an epic's stories, performs pattern analysis, produces actionable outputs (playbook updates, CLAUDE.md patches, process suggestions), and generates a retrospective document."
---

# Epic Retrospective

<purpose>
Automated epic retrospective that ingests structured build artifacts from all stories in
a completed epic, performs cross-story pattern analysis, and produces actionable outputs.

Unlike the BMAD interactive retrospective (party mode with simulated team), this workflow
treats the build artifacts as primary evidence. The narrative logs, review JSONs, progress
metrics, and reflection artifacts collectively contain richer data than any human retrospective
discussion could surface — because every agent decision was recorded in structured form.

Key difference: one user checkpoint (Phase 4), not eleven interactive stops.
</purpose>

<philosophy>
**Data-Driven Retrospection, Actionable Outputs**

The artifacts ARE the discussion. Review JSONs contain the debates. Narrative logs show
what happened. Mnemosyne reflections capture what was learned. We don't simulate a meeting —
we analyze evidence and propose concrete changes.

Outputs go beyond a markdown document:
- Playbook consolidation (aggregate per-story learnings into lasting patterns)
- CLAUDE.md / rules file patches (prevent repeated mistakes)
- Pantheon process suggestions (improve the build system itself)
- Retrospective document (for human review and future retro continuity)
</philosophy>

<agents>
## Retrospective Agent

| Role | Name | Domain | Emoji |
|------|------|--------|-------|
| Analyst | **Clio** | Muse of History — pattern analysis across epic artifacts | 📜 |

Clio handles both analysis and synthesis in a single context to preserve cross-story
pattern connections. Splitting would lose the "Story 3's review found the same issue
as Story 7" insight that makes retrospectives valuable.
</agents>

<execution_discipline>
**How This Workflow Executes**

### Context 1: Main Session (via Skill invocation)

1. User invokes the epic-retrospective workflow
2. Main session loads this workflow.md
3. Phase 1 GATHER runs in orchestrator context (discovery + artifact collection)
4. Phase 2 ANALYZE spawns Clio with all artifacts for deep analysis
5. Phase 3 SYNTHESIZE: Clio generates all outputs (retro doc, proposals)
6. Phase 4 PRESENT: Orchestrator displays findings, user approves changes

### Task Agents Used:

- Phase 2-3 ANALYZE+SYNTHESIZE: `Task(subagent_type: "general-purpose", model: "opus")` → Clio
  - Single agent for both phases to preserve cross-story context
  - Receives: all artifact content, previous retro, epic definition, next epic preview
  - Produces: analysis.json, retro document, playbook proposals, CLAUDE.md patches, process suggestions

### Orchestration Rules:

- Phase 1 is lightweight discovery — orchestrator handles directly
- Phases 2-3 are delegated to Clio as a single Task (heavy analysis)
- Phase 4 is orchestrator-driven user interaction
- Clio gets goal + full context, not step-by-step instructions
</execution_discipline>

<failure_handling>
**Epic not found:** Ask user which epic to retrospect
**No artifacts found:** Warn user, offer to proceed with available data
**Clio analysis timeout:** Save partial results, present what's available
**Previous retro not found:** Skip continuity analysis, note first retro
**User rejects all proposals:** Save retro document only, skip all patches
**Sprint status update fails:** Log warning, retro document still saved
</failure_handling>

<process>
## Phase Execution

Each phase is defined in its own file under `phases/`. Load each phase file
with the Read tool when you reach it. Execute phases sequentially.

**Phase file path pattern:** `{workflow-dir}/phases/phase-{N}-{name}.md`

| Phase | File | Gate | Description |
|-------|------|------|-------------|
| 1 GATHER | `phases/phase-1-gather.md` | Always | Discover epic, collect all artifacts |
| 2-3 ANALYZE+SYNTHESIZE | `phases/phase-2-analyze.md` | Artifacts found | Clio: pattern analysis + output generation |
| 4 PRESENT | `phases/phase-4-present.md` | Analysis complete | Show findings, apply approved changes |

**IMPORTANT:** Read phase files on-demand. Do NOT read all phase files upfront.
Load only the current phase, execute it, then load the next.
</process>

<success_criteria>
- [ ] Phase 1 GATHER: Epic identified, all available artifacts collected
- [ ] Phase 2-3 ANALYZE+SYNTHESIZE: Clio produced analysis with cross-story patterns
- [ ] Retrospective document generated with metrics, patterns, and insights
- [ ] Playbook update proposals generated (if learnings warrant)
- [ ] CLAUDE.md patch proposals generated (if repeated mistakes found)
- [ ] Pantheon process suggestions generated (if workflow improvements identified)
- [ ] Phase 4 PRESENT: User reviewed and acted on proposals
- [ ] Approved playbook updates applied
- [ ] Approved CLAUDE.md patches applied
- [ ] Retrospective document saved to implementation artifacts
- [ ] Sprint status updated (epic-X-retrospective: done)
</success_criteria>
