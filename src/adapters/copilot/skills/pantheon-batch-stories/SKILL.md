---
name: Pantheon Batch Stories
description: Sequential batch implementation of multiple stories with dependency-aware wave ordering. Invoke when implementing multiple stories or an entire epic.
---

# Batch Stories - Wave-Based Execution

> **Canonical source:** `src/workflows/batch-stories/workflow.md` (v4.0)
> This file is a Copilot-adapted skill. For full details, refer to the canonical workflow.
> When this file conflicts with the canonical source, the canonical source wins.

**Role:** Orchestrate batch implementation of multiple stories
**Philosophy:** Gap Analysis First, Build Only What's Missing

## When to Use This Skill

- User asks to implement multiple stories (e.g., "implement all stories in epic 17")
- User mentions batch processing, wave execution, or epic implementation
- User wants to process a set of stories with dependency awareness

## Overview

1. Load sprint status → find available stories
2. Validate story files → check required sections
3. Score complexity → route to appropriate pipeline tier
4. Analyze dependencies → build task graph with waves
5. Execute stories sequentially within waves
6. Reconcile results → update story files + sprint status
7. Generate session report

## Step 1: Load Sprint Status

```bash
SPRINT_STATUS="docs/sprint-artifacts/sprint-status.yaml"
```

Read sprint-status.yaml. Extract stories with status `ready-for-dev` or `backlog`. Exclude epics and retrospectives. Sort by epic number, then story number.

## Step 2: Display & Select Stories

Show available stories with file status:
- Check if story file exists in `docs/sprint-artifacts/`
- Mark: ✅ exists, ❌ missing, 🔄 already implemented

Ask user which stories to implement:
1. All ready-for-dev stories
2. Select specific stories
3. Single story

## Step 3: Validate Story Files

For each selected story:
- Read story file
- Check for required sections (Business Context, Acceptance Criteria, Tasks)
- If invalid: mark for regeneration

## Step 4: Score Complexity

For each validated story:
```bash
TASK_COUNT=$(grep -c "^- \[ \]" "$STORY_FILE")
HIGH_RISK=$(grep -ciE "auth|security|payment|encryption|migration|database" "$STORY_FILE")
```

## Step 5: Analyze Dependencies

### 5.1 Extract Dependencies (priority order)

1. **Explicit `depends_on`** — Highest priority
   ```bash
   grep -E "depends_on:|dependencies:|requires:" "$STORY_FILE"
   ```

2. **File-based inference** — If Story A creates a file that Story B references

3. **Keyword scanning** — Phrases like "uses component from 5-1"
   ```bash
   grep -oE "(story |from |uses |extends |builds on )[0-9]+-[0-9]+" "$STORY_FILE"
   ```

4. **Epic ordering** — Lower story numbers first (fallback)

### 5.2 Build Dependency Graph & Detect Cycles

```
Dependencies found:
  5-1: []           # No dependencies
  5-2: [5-1]        # Depends on 5-1
  5-3: []           # Independent
  5-4: [5-1]        # Depends on 5-1
```

If circular dependency detected, remove the back-edge and log warning.

### 5.3 Create Waves

Group stories into waves where all dependencies are satisfied by previous waves:

```
Wave 1: 5-1, 5-3 (no deps)
Wave 2: 5-2, 5-4 (deps satisfied by Wave 1)
Wave 3: 5-5, 5-6 (deps satisfied by Wave 2)
```

Display the wave plan:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 WAVE PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Wave 1: 5-1 (standard), 5-3 (light)
Wave 2: 5-2 (standard), 5-4 (light)
Wave 3: 5-5 (micro), 5-6 (complex)

Total: 6 stories in 3 waves
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 6: Execute Stories (Sequential Within Waves)

For each wave, process stories sequentially:

### 6a: Gap Analysis Before Building

For each story, scan the codebase to verify what's actually implemented vs what the story requires. Build ONLY what's truly missing.

### 6b: Execute Pipeline

**CRITICAL:** For each story, invoke the `pantheon-pipeline` skill to execute the full 7-phase pipeline. Do NOT implement stories directly.

The pipeline handles:
1. PREPARE - Story validation + playbook loading
2. FORGE - Pygmalion persona forging (if complexity >= light)
3. BUILD - Metis TDD implementation
4. VERIFY - Multi-reviewer or parallel reviewers + forged specialists
5. ASSESS - Coverage gate + Themis triage + hit-rate tracking
6. REFINE - Fix issues iteratively
7. COMMIT - Reconcile story, git commit
8. REFLECT - Update playbooks

### 6c: Reconcile After Each Story

After pipeline completes for each story:
1. Load completion artifact (`{{story_key}}-progress.json`)
2. Check off completed tasks in story file
3. Fill Dev Agent Record with metrics
4. Update sprint-status.yaml: story status to `done`

### 6d: Progress Display

Between stories:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 BATCH PROGRESS (2/6 stories)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Wave 1:
  ✅ 5-1  25 tests  97.6% cov  4→0 issues
  ✅ 5-3  12 tests  91.3% cov  1→0 issues

Wave 2:
  🔨 5-2  ...in progress...
  ⏳ 5-4  ...waiting...

Wave 3:
  ⏳ 5-5  ...waiting...
  ⏳ 5-6  ...waiting...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 7: Session Report

After all stories complete, generate a comprehensive session report.

### Gather Artifacts
For each processed story, collect:
- `{{story_key}}-progress.json`
- `{{story_key}}-hermes.json` (TL;DR + stats)
- `{{story_key}}-summary.md` (full report)

### Display Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 SESSION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stories: {{completed}}/{{total}} completed
Files:   {{total_files}} changed
Tests:   {{total_tests}} added
Coverage: {{avg_coverage}}% average
Issues:  {{total_issues}} found → {{total_fixed}} fixed

Per-story reports: completions/{{story}}-summary.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Check Epic Completion

If all stories in an epic are done, mark epic as complete in sprint-status.yaml.

## Error Handling

- **Story file missing:** Use story creation workflow, then continue
- **Pipeline fails:** Mark story as failed, continue to next
- **Max iterations reached:** Escalate to user
- **All stories fail:** Report systemic issue, halt batch

## Platform Constraints (Copilot)

- **Sequential execution within waves** — Copilot cannot reliably run multiple full pipelines in parallel. Stories are processed one at a time within each wave.
- **No agent resumption** — Phase 5 REFINE spawns fresh builder each iteration with artifact context. This costs more tokens than Claude Code's resume capability.

## Success Criteria

- [ ] All selected stories processed
- [ ] Each story has zero MUST_FIX issues (or user accepted)
- [ ] Each story has checked tasks
- [ ] Sprint status updated for all stories
- [ ] Session report generated
- [ ] Verification checklist provided
