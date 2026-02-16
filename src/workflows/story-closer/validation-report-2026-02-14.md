---
validationDate: 2026-02-14
workflowName: story-closer
workflowPath: src/workflows/story-closer/
validationStatus: COMPLETE
completionDate: 2026-02-14
---

# Validation Report: story-closer

**Validation Started:** 2026-02-14
**Validator:** BMAD Workflow Validation System
**Standards Version:** BMAD Workflow Standards

**NOTE:** This is a phase-based autonomous workflow (not a traditional step-based collaborative workflow). Many standard step-file validations (frontmatter variables, A/P/C menus, collaborative facilitation patterns) are adapted accordingly — phases are prescriptive execution instructions for an autonomous agent, not interactive facilitation steps.

---

## File Structure & Size

### Folder Structure

```
src/workflows/story-closer/
├── workflow.md              (entry point, config, phase routing)
├── phases/
│   ├── phase-1-scan.md      (scan all stories, categorize)
│   ├── phase-2-present.md   (show findings, user selects)
│   ├── phase-3-execute.md   (autonomous batch execution)
│   └── phase-4-debrief.md   (summary, blockers, re-run)
└── agents/
    └── closer-worker.md     (Teleos per-story worker)
```

**Structure Assessment:**
- ✅ workflow.md exists at root
- ✅ Phase files organized in `phases/` folder
- ✅ Agent files organized in `agents/` folder
- ✅ Folder names are clear and logical
- ✅ No stray files or unnecessary artifacts

### File Size Analysis

| File | Lines | Status |
|------|-------|--------|
| workflow.md | 134 | ✅ Good |
| phases/phase-1-scan.md | 98 | ✅ Good |
| phases/phase-2-present.md | 118 | ✅ Good |
| phases/phase-3-execute.md | 179 | ✅ Good (approaching 200) |
| phases/phase-4-debrief.md | 169 | ✅ Good |
| agents/closer-worker.md | 298 | ⚠️ Exceeds 250 limit |

**Issues:**
- ⚠️ `closer-worker.md` at 298 lines exceeds the 250-line maximum. However, this is an agent definition file (not a step file) containing 9 self-contained execution steps, Multi-Reviewer spawn template, reconciliation logic, commit template, and structured JSON output template. Splitting would fragment the agent's instructions across files, making sub-agent spawning more complex. This mirrors the pattern of other agent files in the codebase (e.g., Heracles in batch-stories). **Recommendation:** Accept as-is — agent files benefit from being self-contained for sub-agent context injection.

**Status:** ⚠️ WARNINGS (1 file over size limit, mitigated by agent-file justification)

---

## Frontmatter Validation

**N/A — Phase-based architecture.**

This workflow uses phase files and agent files rather than traditional step files. Phase files do not have YAML frontmatter with variable references. Instead, the workflow.md `<config>` block serves as the centralized configuration, and phase files reference values from the orchestrator's runtime context.

- ✅ workflow.md uses XML-style config blocks (`<config>`, `<agents>`, `<process>`, etc.)
- ✅ Phase files receive data from orchestrator context, not frontmatter variables
- ✅ Agent files are self-contained instruction documents
- ✅ No `{project-root}` violations found anywhere in the workflow

**Status:** ✅ PASS (architecture-appropriate)

---

## Critical Path Violations

### Content Path Violations
- ✅ No `{project-root}` hardcoded paths found in any file content
- ✅ All runtime references use `{{variable}}` template syntax (appropriate for prescriptive instructions)

### Dead Links
- ✅ Phase files reference each other by relative path in prose: `phases/phase-N-name.md`
- ✅ Agent file referenced from phase-3-execute.md: `src/workflows/story-closer/agents/closer-worker.md`
- ✅ workflow.md process table references all 4 phase files correctly

### Module Awareness
- ✅ Workflow is standalone in `src/workflows/` (not in a module)
- ✅ No module-specific path assumptions

**Status:** ✅ PASS

---

## Menu Handling Validation

**Adapted for phase-based architecture.** This workflow has 2 interactive phases and 2 autonomous phases.

| Phase | Has Menu | Type | Handler | Status |
|-------|----------|------|---------|--------|
| phase-1-scan.md | No | Auto-proceed | N/A (autonomous) | ✅ Correct |
| phase-2-present.md | Yes | Custom selection | Steps 2.5-2.7 with clear handling | ✅ Good |
| phase-3-execute.md | No | Autonomous | N/A (batch execution) | ✅ Correct |
| phase-4-debrief.md | Yes | Custom re-run | Step 4.8 with R/P/D handling | ✅ Good |

**Phase 2 Menu Analysis:**
- ✅ Step 2.5: Story selection [A/S/I/N] with clear handler logic
- ✅ Step 2.6: Execution mode [S/P] with clear handler logic
- ✅ Step 2.7: Final confirmation [Y/N] with clear handler logic
- ✅ "Wait for user selection" instruction present

**Phase 4 Menu Analysis:**
- ✅ Step 4.8: Re-run option [R/P/D] with clear handler logic
- ✅ Each option has defined behavior and routing
- ✅ Conditional display (only shows if blocked stories exist)

**Status:** ✅ PASS

---

## Step Type Validation

**Adapted for phase-based architecture.** Traditional step types (init, middle, final, branch) map to phase types.

| File | Expected Type | Actual Type | Pattern Match | Status |
|------|---------------|-------------|---------------|--------|
| workflow.md | Entry point | Config + routing | ✅ Matches | ✅ PASS |
| phase-1-scan.md | Auto-proceed | Autonomous scan | ✅ Matches | ✅ PASS |
| phase-2-present.md | Interactive | User selection | ✅ Matches | ✅ PASS |
| phase-3-execute.md | Autonomous batch | Sub-agent orchestration | ✅ Matches | ✅ PASS |
| phase-4-debrief.md | Interactive + final | Summary + re-run | ✅ Matches | ✅ PASS |
| closer-worker.md | Sub-agent | Self-contained worker | ✅ Matches | ✅ PASS |

**Status:** ✅ PASS

---

## Output Format Validation

**This workflow is classified as non-document (actions on existing files).** It does not produce a primary document output. Instead it:

- Updates existing story file checkboxes (`- [ ]` → `- [x]`)
- Updates existing sprint-status.yaml
- Creates/updates lightweight completion reports (secondary output)
- Makes git commits

**Assessment:**
- ✅ No document template needed (correct per classification)
- ✅ No final polish step needed (no document to polish)
- ✅ Output actions are well-defined in closer-worker.md Steps 5-8
- ✅ Completion report template in closer-worker.md Step 7 is appropriate for secondary output

**Status:** ✅ PASS (N/A — non-document workflow)

---

## Validation Design Check

**This workflow does not need traditional validation steps** (it's not compliance/regulatory/safety-critical). However, it has built-in quality validation:

- ✅ Per-story Multi-Reviewer (4-perspective review in fresh context)
- ✅ MUST_FIX fix loop with max 2 iterations
- ✅ Evidence-based reconciliation (only checks off tasks with proof)
- ✅ Test execution after implementation
- ✅ sprint-status update logic with percentage thresholds

**Assessment:** The workflow has robust inline validation via the Multi-Reviewer pattern. No separate validation mode (steps-v/) is needed — this is appropriate for an autonomous execution workflow.

**Status:** ✅ PASS (N/A — inline validation appropriate)

---

## Instruction Style Check

**Domain:** Autonomous agent execution (prescriptive is CORRECT here)

**Plan specified:** Prescriptive — explicit step-by-step instructions, no facilitation or discovery

| File | Style | Appropriate | Status |
|------|-------|-------------|--------|
| workflow.md | Declarative config | ✅ Yes | ✅ |
| phase-1-scan.md | Prescriptive pseudocode | ✅ Yes | ✅ |
| phase-2-present.md | Prescriptive with user interaction | ✅ Yes | ✅ |
| phase-3-execute.md | Prescriptive orchestration | ✅ Yes | ✅ |
| phase-4-debrief.md | Prescriptive display templates | ✅ Yes | ✅ |
| closer-worker.md | Prescriptive 9-step execution | ✅ Yes | ✅ |

**Analysis:**
- All files use prescriptive instruction style consistently
- Pseudocode blocks provide clear execution logic
- Display templates show exact output formatting
- No facilitative/intent-based language found (appropriate — this is autonomous execution, not collaborative facilitation)

**Status:** ✅ PASS

---

## Collaborative Experience Check

**Adapted for autonomous execution workflow.** This is NOT a collaborative/facilitative workflow — it's designed to run autonomously across 100+ stories with minimal human interaction.

**User touchpoints are limited to:**
1. Phase 2: Story selection and execution mode (well-designed interactive menu)
2. Phase 4: Review debrief results and choose next action (clear summary + options)

**Assessment:**
- ✅ Phase 2 provides clear, categorized information for user decision-making
- ✅ Phase 2 offers multiple selection modes (all/specific/include-pipeline)
- ✅ Phase 2 has final confirmation before batch execution
- ✅ Phase 4 presents all results in organized sections
- ✅ Phase 4 defers escalation correctly (all blockers at once, not during execution)
- ✅ Phase 4 offers clear re-run option
- ✅ User always knows what happened and what's next

**Collaborative Rating:** N/A (autonomous workflow — evaluated on UX quality instead)
**UX Quality:** Excellent — clear information presentation, well-structured interaction points, deferred escalation pattern works well for batch operations

**Status:** ✅ PASS

---

## Subprocess Optimization Opportunities

**Total Opportunities:** 0 high-priority | **Already optimized**

This workflow is already well-optimized for subprocess/sub-agent usage:

- ✅ Phase 1 SCAN: Uses grep across all story files (Pattern 1)
- ✅ Phase 3 EXECUTE: Spawns Teleos workers per story (Pattern 4 parallel)
- ✅ Per-story review: Multi-Reviewer in fresh context (context isolation)
- ✅ Parallel mode: Wave-based execution with `run_in_background: true`
- ✅ Sequential mode: Task() sub-agent per story

**No additional optimization opportunities identified.** The workflow already uses all 4 subprocess patterns where appropriate.

**Status:** ✅ PASS

---

## Cohesive Review

### Overall Assessment: Excellent

**Mental walkthrough as orchestrator agent:**

1. **Entry (workflow.md):** Clear config, agent definitions, phase routing table. Agent knows exactly what to do and what tools are available. Execution discipline section is thorough.

2. **Phase 1 (SCAN):** Logical progression — locate files → filter to stories → count tasks → categorize → display summary → auto-proceed. The CRITICAL note about ignoring sprint-status is well-placed and prominent.

3. **Phase 2 (PRESENT):** Clean information display with categorized tables. Selection flow is logical: choose stories → choose mode → confirm. Edge cases handled (no closeable, all clean). Good UX.

4. **Phase 3 (EXECUTE):** Well-structured orchestration. Sequential vs parallel routing is clean. Teleos worker spawn template is complete. Wave-based parallel execution is well-designed. Results aggregation is thorough.

5. **Phase 4 (DEBRIEF):** Comprehensive summary with all relevant sections. Deferred escalation (blocker questions) presented clearly. Re-run option is practical. Clean ending.

6. **Teleos (closer-worker.md):** Excellent self-contained agent. 9 clear steps with pseudocode. Multi-Reviewer spawn template is complete. Reconciliation, sprint-status update, completion report, and git commit are all well-defined. Constraints are clear and appropriate.

### Strengths
- Deferred escalation pattern (collect questions during batch, present at end) is excellent for scale
- Triage gate (30% threshold) prevents overreach — routes to full pipeline when appropriate
- Evidence-based reconciliation prevents false checkbox checking
- Wave-based parallel execution is well-thought-out
- Failure handling is comprehensive and non-blocking
- Consistent patterns with story-pipeline (reuses conventions)

### Weaknesses
- closer-worker.md at 298 lines is the only concern (see File Size section)
- No other significant weaknesses identified

### Critical Issues
- None

**Recommendation:** Ready to use. This is a well-designed autonomous batch workflow that follows established patterns from the story-pipeline while adding the lightweight closer concept, deferred escalation, and triage gate.

**Status:** ✅ EXCELLENT

---

## Plan Quality Validation

**Plan file:** `_bmad-output/bmb-creations/workflows/story-closer/workflow-plan-story-closer.md`
**Plan status:** CONFIRMED

### Discovery Validation
- ✅ Original vision (lightweight autonomous closer for last-mile story completion at scale) is fully reflected in workflow.md purpose block
- **Quality:** High

### Classification Validation
| Attribute | Planned | Implemented | Status |
|-----------|---------|-------------|--------|
| Document output | false | No template, actions on files | ✅ |
| Module affiliation | standalone | src/workflows/ | ✅ |
| Session type | single-session | No continuation logic | ✅ |
| Lifecycle | create-only | phases/ folder only | ✅ |

- **Quality:** High

### Requirements Validation
| Requirement | Planned | Implemented | Status |
|-------------|---------|-------------|--------|
| Batch orchestration | Scan + present + execute + debrief | 4 phases exactly | ✅ |
| Ignore sprint-status | Scan EVERY story file | Phase 1 CRITICAL note | ✅ |
| Triage gate | ≤30% closer, >30% pipeline | Config + Phase 1 logic | ✅ |
| Sequential/parallel | User chooses mode | Phase 2 step 2.6 | ✅ |
| Autonomous execution | No checkpoints during batch | Phase 3 design | ✅ |
| Deferred escalation | Collect questions, present at end | Phase 4 design | ✅ |
| Human-validation skip | Pattern-match and skip | Config + Teleos Step 1 | ✅ |
| Multi-Reviewer | Consolidated 4-perspective | Teleos Step 3 | ✅ |
| MUST_FIX fix loop | Max 2 iterations | Teleos Step 4 | ✅ |
| Story checkbox update | Evidence-based only | Teleos Step 5 | ✅ |
| sprint-status update | Percentage thresholds | Teleos Step 6 | ✅ |
| Completion report | Generate/update | Teleos Step 7 | ✅ |
| Git commit per story | Single commit | Teleos Step 8 | ✅ |
| Re-run option | After answering blockers | Phase 4 step 4.8 | ✅ |
| Prescriptive style | Explicit instructions | All files | ✅ |

- **Quality:** High — all 15 requirements fully implemented

### Design Validation
| Planned File | Exists | Purpose Match | Status |
|--------------|--------|---------------|--------|
| workflow.md | ✅ | Config + routing | ✅ |
| phases/phase-1-scan.md | ✅ | Scan + categorize | ✅ |
| phases/phase-2-present.md | ✅ | User selection | ✅ |
| phases/phase-3-execute.md | ✅ | Batch execution | ✅ |
| phases/phase-4-debrief.md | ✅ | Summary + re-run | ✅ |
| agents/closer-worker.md | ✅ | Per-story worker | ✅ |

- **Quality:** High — 6/6 files match design

### Tools Validation
| Tool | Planned | Configured | Status |
|------|---------|------------|--------|
| File I/O | Included | Read/Edit/Write in Teleos | ✅ |
| Sub-Agents | Included | Task() for Teleos + Multi-Reviewer | ✅ |
| Sub-Processes | Included | Parallel mode with run_in_background | ✅ |
| Party Mode | Excluded | Not referenced | ✅ |
| Advanced Elicitation | Excluded | Not referenced | ✅ |
| Web-Browsing | Excluded | Not referenced | ✅ |

- **Quality:** High

### Plan Implementation Score: 100%
### Overall Status: Fully Implemented

---

## Summary

**Validation Completed:** 2026-02-14
**Overall Status:** ✅ EXCELLENT

| Validation Step | Result |
|----------------|--------|
| File Structure & Size | ⚠️ WARNINGS (1 agent file over 250 lines) |
| Frontmatter | ✅ PASS (N/A — phase architecture) |
| Critical Path Violations | ✅ PASS |
| Menu Handling | ✅ PASS |
| Step Type | ✅ PASS |
| Output Format | ✅ PASS (N/A — non-document) |
| Validation Design | ✅ PASS (inline validation) |
| Instruction Style | ✅ PASS (prescriptive, appropriate) |
| Collaborative Experience | ✅ PASS (autonomous UX quality) |
| Subprocess Optimization | ✅ PASS (already optimized) |
| Cohesive Review | ✅ EXCELLENT |
| Plan Quality | ✅ Fully Implemented (100%) |

**Critical Issues:** 0
**Warnings:** 1 (closer-worker.md at 298 lines — mitigated, acceptable for agent file)

**Strengths:**
- Excellent batch orchestration with deferred escalation pattern
- Smart triage gate (30% threshold) prevents overreach
- Evidence-based reconciliation prevents false positives
- Wave-based parallel execution well-designed
- Complete plan implementation (100% coverage)
- Consistent with story-pipeline conventions

**Recommendation:** Ready to use. No critical issues. The single warning (agent file size) is acceptable given the self-contained nature of sub-agent instruction files.
