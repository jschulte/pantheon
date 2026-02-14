---
validationDate: 2026-02-13
workflowName: batch-stories
workflowPath: src/workflows/batch-stories
validationStatus: COMPLETE
---

# Validation Report: batch-stories

**Validation Started:** 2026-02-13
**Validator:** BMAD Workflow Validation System
**Standards Version:** BMAD Workflow Standards

---

## File Structure & Size

### Folder Structure

```
src/workflows/batch-stories/
├── workflow.md              (1458 lines) ❌ EXCEEDS LIMIT
├── workflow.yaml            (config)
├── README.md                (788 lines)  ❌ EXCEEDS LIMIT
├── AGENT-LIMITATIONS.md     (332 lines)  ❌ EXCEEDS LIMIT
├── WORKFLOW-PATCH-STEP-2.5.md (349 lines) ❌ EXCEEDS LIMIT
├── step-4.5-reconcile-story-status.md (193 lines) ✅ Good
└── agents/
    ├── heracles.md          (421 lines)  ❌ EXCEEDS LIMIT
    ├── hygeia.md            (198 lines)  ✅ Good
    └── session-reporter.md  (399 lines)  ❌ EXCEEDS LIMIT
```

### Architecture Assessment

**NON-STANDARD ARCHITECTURE:** This workflow uses inline `<step>` XML-style blocks within a monolithic `workflow.md` instead of BMAD step-file architecture (`steps/step-01-*.md`, etc.). There is no `steps/` directory, no `data/` directory, and no `templates/` directory.

This is a valid architectural choice for a Pantheon pipeline orchestration workflow, but it diverges significantly from BMAD BMB standards. The validation below adapts checks where applicable.

### File Size Analysis

| File | Lines | Status | Recommendation |
|------|-------|--------|----------------|
| workflow.md | 1458 | ❌ 5.8x over limit | **CRITICAL** — Split into phase files or step files |
| README.md | 788 | ❌ 3.2x over limit | Split into separate docs or shorten |
| agents/heracles.md | 421 | ❌ 1.7x over limit | Extract protocols to data files |
| agents/session-reporter.md | 399 | ❌ 1.6x over limit | Extract template to data file |
| WORKFLOW-PATCH-STEP-2.5.md | 349 | ❌ 1.4x over limit | Merge into workflow.md or archive |
| AGENT-LIMITATIONS.md | 332 | ❌ 1.3x over limit | Condense or split |
| agents/hygeia.md | 198 | ✅ Good | — |
| step-4.5-reconcile-story-status.md | 193 | ✅ Good | — |

**Summary:** 6 of 8 markdown files exceed the 250-line limit. Only 2 files are within bounds.

### Missing Files

- **workflow-plan.md** — Does not exist. Cannot validate plan-to-implementation alignment.
- **No steps/ directory** — Workflow uses inline steps rather than step files.
- **No data/ directory** — Reference material is inline rather than extracted.

### File Structure Verdict: ❌ FAIL

Multiple critical size violations. The monolithic workflow.md at 1458 lines is the primary concern.

---

## Frontmatter Validation

**Architecture Note:** This workflow does not use BMAD step-file frontmatter. The `workflow.md` uses XML-style `<config>`, `<execution_context>`, `<process>`, and `<step>` tags instead of YAML frontmatter. The `workflow.yaml` serves as the configuration file.

### workflow.yaml Frontmatter

The workflow.yaml is well-structured with proper variable references:
- ✅ `config_source`, `output_folder`, `sprint_artifacts` use `{project-root}` pattern
- ✅ `installed_path` properly references `{project-root}/_bmad/pantheon/workflows/batch-stories`
- ✅ Runtime variables use `{{double-curly}}` pattern where appropriate
- ✅ Config dereferences use `{source}:key` pattern

### Agent Files

Agent files (heracles.md, hygeia.md, session-reporter.md) have no frontmatter — they use markdown headers and inline configuration. This is consistent with Pantheon agent conventions but deviates from BMAD standards.

### Frontmatter Verdict: ⚠️ N/A (non-standard architecture)

---

## Critical Path Violations

### Dead Reference: `@patterns/hospital-grade.md`

**CRITICAL:** `workflow.md:111` references `@patterns/hospital-grade.md` in `<execution_context>`:

```xml
<execution_context>
@patterns/hospital-grade.md        ← DOES NOT EXIST
@patterns/agent-completion.md      ← EXISTS (in story-pipeline/patterns/)
@story-pipeline/workflow.md        ← EXISTS
</execution_context>
```

The file `patterns/hospital-grade.md` does not exist anywhere in the project. This is a dead reference.

### Cross-Workflow Pattern References

The `@patterns/agent-completion.md` and `@story-pipeline/workflow.md` references resolve to files in the `story-pipeline` workflow directory. These are cross-workflow dependencies — batch-stories depends on story-pipeline's patterns directory.

### Stale Reference: `instructions.md`

`WORKFLOW-PATCH-STEP-2.5.md` references `instructions.md` (lines 11, 330) which does not exist. This file appears to be a predecessor to the current `workflow.md`. The patch document is effectively orphaned.

### Outdated README References

`README.md` references `claude-sneakpeek` and variant-based swarm mode (lines 79-95) which has been superseded by the native Agent Teams feature (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). The workflow.md itself has been updated to use Agent Teams, but the README still describes the old approach.

### Critical Path Verdict: ❌ FAIL

1 dead pattern reference (`hospital-grade.md`), 1 orphaned patch file referencing non-existent `instructions.md`, outdated README documentation.

---

## Menu Handling Validation

**Architecture Note:** This workflow uses `AskUserQuestion` tool calls and inline conditional logic instead of BMAD menu patterns (A/P/C). The interaction model is:

1. `load_sprint_status` → automatic
2. `display_stories` → automatic
3. `validate_stories` → AskUserQuestion for thin stories
4. `get_selection` → AskUserQuestion with options
5. `choose_mode` → Auto-detect or AskUserQuestion fallback
6. `analyze_dependencies` → AskUserQuestion for confirmation
7. `execute_*` → Autonomous execution
8. `summary` → AskUserQuestion for report actions

### Assessment

- ✅ User interactions use AskUserQuestion with clear options
- ✅ Fallback paths defined when auto-detection fails
- ✅ Confirmations before destructive/expensive operations
- ⚠️ No "halt and wait" enforcement — relies on tool semantics
- ⚠️ No menu redisplay logic after non-Continue options

### Menu Handling Verdict: ⚠️ PASS WITH WARNINGS (adapted for non-BMAD architecture)

---

## Step Type Validation

### Inline Step Analysis

| Step Name | Type | Gate | Lines (approx) |
|-----------|------|------|-----------------|
| `load_sprint_status` | Init | Always | ~20 |
| `display_stories` | Display | Always | ~40 |
| `validate_stories` | Validation | Always | ~55 |
| `score_complexity` | Processing | Always | ~25 |
| `get_selection` | Interactive | Always | ~15 |
| `choose_mode` | Branch | Always | ~50 |
| `analyze_dependencies` | Processing | mode==parallel | ~165 |
| `execute_sequential` | Execution | mode==sequential | ~125 |
| `execute_parallel` | Execution | mode==parallel | ~480 |
| `summary` | Report | Always | ~200 |
| `epic_completion_check` | Finalization | Always | ~55 |

### Issues Found

1. **`execute_parallel` is massive (~480 lines):** Contains 8 sub-steps (Create Team, Populate Tasks, Spawn Hygeia, Spawn Workers, Monitor, Track Progress, Reconcile, Shutdown). Should be split into separate orchestration phases.

2. **`summary` is large (~200 lines):** Contains Hermes agent spawn prompt, display template, and alternative fallback. The agent prompt template should be extracted.

3. **`analyze_dependencies` is large (~165 lines):** Contains dependency extraction, graph building, cycle detection, pre-flight checks, and confirmation. Could benefit from splitting.

4. **Conditional gates use XML `if` attributes:** `<step name="execute_sequential" if="mode == sequential">` — functional but non-standard.

### Step Type Verdict: ⚠️ PASS WITH WARNINGS

Steps are logically sequenced but several are oversized. The `execute_parallel` step alone is nearly 2x the recommended file limit.

---

## Output Format Validation

### Output Artifacts

The workflow produces multiple output types:

1. **Progress artifacts** — `completions/{{story_key}}-progress.json` (per story, per phase)
2. **Agent artifacts** — `completions/{{story_key}}-*.json` (per agent)
3. **Session report** — `session-reports/session-{{timestamp}}.md`
4. **Batch log** — `batch-stories-{date}.log`
5. **Sprint status updates** — `sprint-status.yaml` modifications

### Assessment

- ✅ Clear artifact naming conventions
- ✅ JSON format for machine-readable artifacts
- ✅ Markdown format for human-readable reports
- ✅ Session reporter agent has detailed template (in session-reporter.md)
- ✅ Progress artifacts written after each phase (crash recovery)
- ⚠️ No output template file — templates are inline in agent prompts

### Output Format Verdict: ✅ PASS

---

## Validation Design Check

### Does This Workflow Need Validation Steps?

**Yes — this is a critical orchestration workflow** that coordinates multi-agent pipelines, manages git commits, and updates production tracking files (sprint-status.yaml). Validation is important.

### Built-in Validation

- ✅ Story file validation (12 BMAD sections, content quality, gap analysis markers)
- ✅ Pre-flight already-implemented check in `analyze_dependencies`
- ✅ Artifact verification before accepting completion (Step 3 in execute_parallel)
- ✅ Hard validation gate in Phase 6 (Eunomia: zero tasks = BLOCK)
- ✅ Circuit breaker (3 consecutive failures at same phase = halt)
- ✅ Resource limits (max 300 agent spawns, 8-hour session cap)

### Assessment

- ✅ Comprehensive validation at multiple levels
- ✅ Clear PASS/FAIL criteria with escalation paths
- ✅ Anti-fraud measures (artifact verification prevents self-certification)
- ✅ Hard gates that cannot be bypassed

### Validation Design Verdict: ✅ PASS

---

## Instruction Style Check

### Domain Classification

This is a **technical orchestration workflow** — prescriptive instruction style is appropriate. The workflow coordinates autonomous agents and must be deterministic.

### Assessment

- ✅ Steps have clear, prescriptive instructions
- ✅ Pseudocode blocks define exact execution logic
- ✅ Conditional routing is explicit (`IF/ELIF/ELSE`)
- ✅ Error handling is specified for each step
- ✅ Agent prompts are detailed with exact formats
- ⚠️ Some steps mix orchestrator instructions with agent prompt templates (confusing boundary)

### Instruction Style Verdict: ✅ PASS

---

## Collaborative Experience Check

### Interaction Model

The workflow has a dual interaction model:
1. **Interactive phase** (steps 1-6): User selects stories, confirms mode, reviews dependency graph
2. **Autonomous phase** (steps 7-11): Pipeline executes without user input, reports results

### Assessment

- ✅ Clear user touchpoints with AskUserQuestion
- ✅ Options have descriptions and recommendations
- ✅ User can cancel or adjust at confirmation points
- ✅ Progress updates during autonomous execution
- ✅ Summary with actionable next steps
- ⚠️ Long autonomous phase with no interrupt mechanism (except session kill)
- ⚠️ Parallel mode may run for hours — no intermediate user checkpoints

### Collaborative Experience Verdict: ✅ PASS

---

## Subprocess Optimization Opportunities

### Current Architecture

The workflow spawns Task agents for:
- Heracles workers (parallel mode)
- Hygeia quality gate coordinator
- Hermes session reporter
- All story-pipeline phase agents (via Heracles sub-spawning)

### Optimization Opportunities

1. **HIGH: workflow.md splitting** — The 1458-line monolithic file could be split into:
   - `workflow.md` (~200 lines) — Config, routing, execution discipline
   - `phases/interactive.md` (~150 lines) — Steps 1-6 (user interaction)
   - `phases/execute-sequential.md` (~130 lines) — Sequential execution
   - `phases/execute-parallel.md` (~480 lines) — Parallel/swarm execution
   - `phases/summary.md` (~200 lines) — Session reporting

2. **MEDIUM: Agent prompt extraction** — The Hermes session reporter prompt in `summary` step is ~80 lines that could be a template file.

3. **MEDIUM: heracles.md splitting** — Extract Git Commit Queue Protocol (~60 lines) and Hygeia Integration (~80 lines) into separate protocol files.

4. **LOW: session-reporter.md template extraction** — The 200-line report template could be a separate file in `templates/`.

---

## Cohesive Review

### Strengths

1. **Comprehensive orchestration** — Covers sequential, parallel, and swarm execution modes with clear routing
2. **Robust error handling** — Circuit breaker, artifact verification, hard validation gates, crash recovery via progress artifacts
3. **Well-designed agent architecture** — Heracles (worker), Hygeia (quality gate), Hermes (reporter) have clear separation of concerns
4. **Dependency-aware scheduling** — Task graph with `addBlockedBy` constraints, demand-based worker spawning
5. **Strong documentation** — README, AGENT-LIMITATIONS, and inline comments explain design decisions
6. **Security conscious** — Git commit queue protocol, SKIP_TYPECHECK rationale, permission pre-approval guidance

### Weaknesses

1. **Monolithic workflow.md** — 1458 lines in a single file makes navigation and maintenance difficult
2. **Dead reference** — `@patterns/hospital-grade.md` doesn't exist
3. **Orphaned files** — `WORKFLOW-PATCH-STEP-2.5.md` references non-existent `instructions.md`
4. **Outdated README** — Still references `claude-sneakpeek` variant approach for swarm mode
5. **Size violations** — 6 of 8 files exceed the 250-line limit
6. **No step-file architecture** — Makes on-demand loading impossible; entire workflow must be loaded at once

### User Experience Flow

```
User invokes /batch-stories
  → See available stories (clear, well-formatted)
  → Validate stories (with quality guidance)
  → Select stories (flexible syntax)
  → Auto-detect execution mode (smart default)
  → Review dependency graph (visual + confirmation)
  → Autonomous execution (progress tracking)
  → Comprehensive summary (actionable next steps)
```

The flow is logical and well-paced. The transition from interactive to autonomous is well-handled with clear expectations set.

### Cohesive Review Verdict: ⚠️ GOOD (solid with structural improvements needed)

---

## Plan Quality Validation

**No workflow-plan.md found.** Cannot validate plan-to-implementation alignment.

**Verdict:** ⚠️ SKIPPED (no plan file)

---

## Summary

### Overall Validation Status: ⚠️ PASS WITH WARNINGS

### Findings by Severity

#### CRITICAL (2)

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| 1 | Dead reference: `@patterns/hospital-grade.md` | workflow.md:111 | Agents loading this context will fail to resolve the reference |
| 2 | workflow.md at 1458 lines (5.8x over 250 limit) | workflow.md | Entire workflow must load at once; no on-demand phase loading |

#### WARNING (6)

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| 3 | agents/heracles.md at 421 lines (1.7x over limit) | agents/heracles.md | Large agent context load |
| 4 | agents/session-reporter.md at 399 lines (1.6x over limit) | agents/session-reporter.md | Large agent context load |
| 5 | WORKFLOW-PATCH-STEP-2.5.md references non-existent `instructions.md` | WORKFLOW-PATCH-STEP-2.5.md | Orphaned patch document |
| 6 | README.md outdated (references `claude-sneakpeek` variant) | README.md:79-95 | Misleading setup instructions |
| 7 | AGENT-LIMITATIONS.md at 332 lines (1.3x over limit) | AGENT-LIMITATIONS.md | Could be condensed |
| 8 | README.md at 788 lines (3.2x over limit) | README.md | Excessive documentation file |

#### INFO (3)

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| 9 | Non-standard architecture (inline steps vs step files) | workflow.md | Valid choice but limits on-demand loading |
| 10 | No workflow-plan.md | root | Cannot validate plan alignment |
| 11 | Cross-workflow dependencies on story-pipeline/patterns/ | workflow.md:112-113 | Coupling between workflows |

### Recommended Fix Priority

1. **Create `patterns/hospital-grade.md`** or remove the dead reference (CRITICAL)
2. **Split workflow.md** into phase files for on-demand loading (CRITICAL)
3. **Update README.md** to reflect Agent Teams instead of claude-sneakpeek (WARNING)
4. **Archive or merge WORKFLOW-PATCH-STEP-2.5.md** — it references deleted files (WARNING)
5. **Extract protocols from heracles.md** — Git Commit Queue and Hygeia Integration into separate files (WARNING)
6. **Extract report template from session-reporter.md** into templates/ directory (WARNING)
