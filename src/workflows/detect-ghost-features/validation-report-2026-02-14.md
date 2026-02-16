---
validationDate: 2026-02-14
completionDate: 2026-02-14
workflowName: detect-ghost-features
workflowPath: src/workflows/detect-ghost-features
validationStatus: COMPLETE
---

# Validation Report: detect-ghost-features

**Validation Started:** 2026-02-14
**Validator:** BMAD Workflow Validation System
**Standards Version:** BMAD Workflow Standards

---

## File Structure & Size

**Files Found:** 2
| File | Lines | Status |
|------|-------|--------|
| `workflow.md` | 277 | WARNING - exceeds 250-line limit |
| `workflow.yaml` | 61 | PASS |

**Architecture:** Monolithic single-file (inline `<step>` XML tags)

**Missing Standard Directories:**
- No `steps-c/` or `steps-v/` or `steps-e/` directories
- No `data/` directory
- No `templates/` directory
- No `phases/` directory
- No `workflow-plan.md`

**Assessment:** This workflow uses an inline architecture where all 8 steps are embedded directly in `workflow.md` using XML `<step>` tags. This is a fundamentally different pattern than the step-file architecture that BMAD validation targets. For a workflow of this size (277 lines, only 27 over limit), the monolithic approach is borderline acceptable — the content is cohesive and sequential. Splitting into step files would add overhead without meaningful benefit.

**Status:** WARNING — 277 lines (27 over 250 limit)

---

## Frontmatter Validation

**N/A** — This workflow has no separate step files and therefore no step-level frontmatter to validate. The workflow.md uses XML-style semantic tags (`<purpose>`, `<config>`, `<process>`, `<execution_context>`, `<failure_handling>`, `<success_criteria>`) instead of YAML frontmatter. The `workflow.yaml` file provides configuration but is not a frontmatter-bearing step file.

**Status:** N/A (inline architecture)

---

## Critical Path Violations

### CRITICAL: Dead `@patterns/hospital-grade.md` Reference

**Location:** `workflow.md` line 46
```xml
<execution_context>
@patterns/hospital-grade.md
</execution_context>
```

The file `@patterns/hospital-grade.md` does not exist anywhere in the project. No `patterns/` directory exists under this workflow.

**SYSTEMIC ISSUE:** This dead reference exists across **7 workflows**:
1. `batch-stories` (fixed in commit `4599bb7`)
2. `validate` (unfixed)
3. `gap-analysis` (unfixed)
4. `detect-ghost-features` (this workflow — unfixed)
5. `create-story-with-gap-analysis` (unfixed)
6. `revalidate-story` (unfixed)
7. `multi-agent-review` (unfixed)

**Impact:** The `<execution_context>` tag is meant to load shared patterns at runtime. A dead reference means the execution context fails silently — agents may not receive expected behavioral guidance. For this workflow specifically, `hospital-grade.md` likely defined quality/rigor patterns that would be applied during ghost feature detection.

**Status:** CRITICAL (dead reference) + SYSTEMIC (affects 6 other workflows)

---

## Menu Handling Validation

**Two menu points found:**

### Menu 1: `create_backfill_stories` step (line 190-194)
```
[Y] Create story
[A] Auto-create all remaining
[S] Skip this orphan
[H] Halt
```
- Progressive interaction (per-orphan with batch option)
- Clear escalation path (skip → halt)
- Conditional step (`if="create_backfill_stories"`)
- **Status:** PASS

### Menu 2: `suggest_organization` step (line 209-218)
```
[A] Create Epic-Backfill (recommended)
[B] Distribute to existing epics
[C] Leave in backlog
```
- Clear options with descriptions
- Default recommendation marked
- Conditional step (`if="backfill_stories_created"`)
- **Status:** PASS

**Overall Status:** PASS — menus are well-designed with clear options and progressive interaction

---

## Step Type Validation

**Architecture Pattern:** Inline XML `<step>` tags (non-standard for BMAD step-file model)

**Steps Found:** 8

| Step | Name | Conditional | Lines (approx) |
|------|------|-------------|-----------------|
| 1 | `load_stories` | `priority="first"` | 17 |
| 2 | `scan_codebase` | — | 33 |
| 3 | `cross_reference` | — | 23 |
| 4 | `categorize_orphans` | — | 29 |
| 5 | `create_backfill_stories` | `if="create_backfill_stories"` | 40 |
| 6 | `suggest_organization` | `if="backfill_stories_created"` | 20 |
| 7 | `generate_report` | `if="create_report"` | 12 |
| 8 | `final_summary` | — | 26 |

**Observations:**
- Individual steps are well-scoped (12-40 lines each)
- Conditional execution via `if=` attributes is appropriate
- Steps follow a clear linear progression
- No step exceeds reasonable size for inline definition
- The `<step>` XML pattern provides structure without the overhead of separate files

**Status:** PASS — steps are well-structured within the inline architecture

---

## Output Format Validation

**Template Style:** Handlebars-like syntax (`{{count}}`, `{{#if ...}}`, `{{else}}`)

**Output Points:**
1. **Scan progress banner** (line 74-77): ASCII box art with ghost emoji — clear visual marker
2. **Cross-reference banner** (line 108-112): Progress indicator
3. **Ghost features summary** (line 132-157): Comprehensive dashboard with severity breakdown, type counts, coverage percentage, conditional high-orphan-rate warning
4. **Backfill story template** (line 168-188): Well-structured markdown with pre-checked tasks for existing code
5. **Organization options** (line 204-219): Clear option menu
6. **Final summary** (line 238-260): Completion dashboard with conditional next steps and "pro tip"

**Strengths:**
- Consistent ASCII box art framing
- Severity color coding (emoji-based: red/orange/yellow/green)
- Conditional messaging based on results
- Actionable next steps in final output

**Status:** PASS — output formatting is clear, consistent, and informative

---

## Validation Design Check

**Is validation critical for this workflow?** No.

This is a **detection/analysis tool**, not a compliance or safety workflow. It scans codebases for undocumented features and optionally creates backfill stories. The output is informational — the user reviews results and decides what to act on.

**Validation steps needed?** No — the workflow itself is an analysis tool, not a process requiring formal validation gates. The user's review of detected orphans serves as the quality gate.

**Status:** N/A (not a validation-critical workflow)

---

## Instruction Style Check

**Domain Type:** Automated analysis tool with interactive decision points

**Style Assessment:**

| Step | Style | Appropriate? |
|------|-------|-------------|
| `load_stories` | Prescriptive (bash commands, systematic extraction) | Yes — automated scanning |
| `scan_codebase` | Prescriptive (bash find/grep commands) | Yes — automated scanning |
| `cross_reference` | Prescriptive (systematic comparison logic) | Yes — algorithmic |
| `categorize_orphans` | Prescriptive (severity classification) | Yes — structured output |
| `create_backfill_stories` | Mixed (prescriptive template + intent-based user interaction) | Yes — appropriate mix |
| `suggest_organization` | Intent-based (options presented, user decides) | Yes — user choice |
| `generate_report` | Prescriptive (file output specification) | Yes — file generation |
| `final_summary` | Intent-based (actionable guidance) | Yes — user guidance |

**Assessment:** The instruction style is appropriate throughout. Automated scanning steps are correctly prescriptive (specific bash commands, systematic logic). User interaction points are correctly intent-based (presenting options, guiding decisions). The `create_backfill_stories` step demonstrates good mixed style — prescriptive template generation with collaborative per-item approval.

**Status:** PASS — style matches domain appropriately

---

## Collaborative Experience Check

**Overall Facilitation Quality:** Good (for an automated tool)

**Nature of Workflow:** This is primarily an automated scanning/analysis tool, not a facilitated conversation. The "collaborative" dimension is evaluated in terms of user interaction quality at decision points.

**User Interaction Points:**

1. **`create_backfill_stories`** — Progressive per-item approval with batch option [A]. Does not dump all orphans at once — presents one at a time. Includes escape hatch [H] for halt. **Excellent interaction design.**

2. **`suggest_organization`** — Three clear options with descriptions and a recommended default. Short menu, not overwhelming. **Good interaction design.**

3. **`final_summary`** — Conditional messaging (zero orphans = celebration, nonzero = actionable next steps). Includes a "pro tip" for recurring use. **Good closure.**

**Progression & Arc:**
- Clear progression: Load → Scan → Compare → Categorize → Act → Organize → Report → Summary
- Each step builds on previous (scan needs loaded stories, cross-reference needs scan results, etc.)
- User always knows where they are (ASCII banners mark each phase)
- Satisfying completion with actionable next steps

**Would this workflow feel like:**
- [x] An automated tool that respects user decisions
- [ ] A form collecting data FROM the user
- [ ] An interrogation extracting information

**Overall Collaborative Rating:** 4/5 stars

**Status:** PASS — good user interaction design for an automated analysis tool

---

## Subprocess Optimization Opportunities

**Total Opportunities:** 0 | **High Priority:** 0

This is a monolithic 277-line workflow with no separate step files, data files, or template files. All content is contained in a single `workflow.md` file loaded once at execution time.

**Subprocess optimization is not applicable** because:
1. No separate files to load in subprocesses
2. The entire workflow fits comfortably in a single context window
3. The inline `<step>` architecture means all steps are parsed from one file
4. No data operations requiring subprocess delegation

**If the workflow were refactored into step files**, Pattern 2 (per-file deep analysis) could apply. However, given the workflow's size (277 lines), step-file refactoring is not recommended — it would add file management overhead without meaningful context savings.

**Status:** N/A (single-file architecture, no optimization needed)

---

## Cohesive Review

**Overall Assessment:** Good — solid, focused workflow

### Walk-Through Experience

The workflow has a clear, logical flow:
1. **Load** documented stories → establishes the "known" baseline
2. **Scan** codebase → discovers what actually exists
3. **Cross-reference** → finds the gaps (orphans)
4. **Categorize** → prioritizes by severity
5. **Create backfill** → optional remediation with user approval
6. **Organize** → optional epic assignment
7. **Report** → permanent record
8. **Summary** → actionable closure

Each step builds naturally on the previous. The user would understand the progression intuitively. The conditional steps (`create_backfill_stories`, `suggest_organization`, `generate_report`) correctly gate on configuration and prior results.

### Strengths
- **Clear purpose**: "Reverse gap analysis" is immediately understandable
- **Good metaphor**: "Ghost features" / "Who you gonna call?" makes it memorable
- **Progressive interaction**: Per-orphan approval with batch option is well-designed
- **Severity classification**: 4-tier severity (critical → low) with clear examples
- **Conditional logic**: Steps only execute when relevant (`if=` attributes)
- **Visual design**: ASCII box art with emoji provides clear progress markers
- **Failure handling**: Documented for 3 failure modes
- **Success criteria**: Checklist of 5 completion conditions

### Weaknesses
- **Dead `@patterns/hospital-grade.md` reference**: Critical — execution context cannot load
- **Slightly over line limit**: 277 lines (27 over 250). Minor — content is cohesive
- **Hardcoded tech assumptions**: bash commands assume React/Next.js/Prisma stack. The `workflow.yaml` has configurable `scan_for` categories but `workflow.md` has hardcoded bash commands for specific frameworks. A `data/scan-patterns.yaml` file would make this configurable.
- **No error recovery guidance**: `failure_handling` lists 3 scenarios but doesn't specify retry logic or partial results handling

### Would This Workflow Work in Practice?
Yes — with the dead reference fixed. The workflow's logic is sound, the user interaction is well-designed, and the output is informative. The hardcoded bash commands limit portability across tech stacks but work for the stated target (Next.js + Prisma).

**Recommendation:** Ready to use after fixing the dead reference. Consider extracting scan patterns to a data file for future tech stack flexibility.

**Status:** PASS WITH WARNINGS

---

## Plan Quality Validation

**No `workflow-plan.md` found** — this workflow was likely built without the BMAD create-workflow process, or the plan was not preserved.

**Status:** N/A (no plan file)

---

## Summary

**Validation Completed:** 2026-02-14
**Overall Status:** PASS WITH WARNINGS

### Validation Results

| Check | Status | Notes |
|-------|--------|-------|
| File Structure & Size | WARNING | 277 lines (27 over 250 limit) |
| Frontmatter Validation | N/A | Inline architecture, no step files |
| Critical Path Violations | CRITICAL | Dead `@patterns/hospital-grade.md` reference |
| Menu Handling | PASS | Well-designed progressive interaction |
| Step Type Validation | PASS | 8 well-scoped inline steps |
| Output Format | PASS | Clear, consistent, informative |
| Validation Design Check | N/A | Not a validation-critical workflow |
| Instruction Style | PASS | Style matches domain appropriately |
| Collaborative Experience | PASS | Good interaction design for automated tool |
| Subprocess Optimization | N/A | Single-file, no optimization needed |
| Cohesive Review | PASS | Solid, focused, well-structured |
| Plan Quality | N/A | No plan file found |

### Critical Issues (1)
1. **Dead `@patterns/hospital-grade.md` reference** (line 46) — execution context cannot load. This is a **systemic issue** affecting 6 other workflows beyond this one.

### Warnings (1)
1. **File size** — 277 lines, 27 over 250 limit. Content is cohesive; splitting not recommended.

### Key Strengths
- Clear purpose and memorable metaphor ("ghost features")
- Logical step progression with conditional execution
- Well-designed user interaction (progressive per-item approval)
- Good severity classification and visual output

### Recommendations
1. **Fix:** Remove or replace dead `@patterns/hospital-grade.md` reference
2. **Consider:** Extract hardcoded bash scan commands to `data/scan-patterns.yaml` for tech stack flexibility
3. **Consider:** Address the systemic `hospital-grade.md` dead reference across all 6 remaining workflows

### Readiness
**Ready to use** after fixing the dead reference. The workflow is well-designed, focused, and achieves its goal effectively. The inline architecture is appropriate for a workflow of this size and complexity.
