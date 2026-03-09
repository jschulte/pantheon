---
name: Pantheon Batch Stories
description: Execute batch implementation of multiple stories with dependency-aware wave ordering. Invoke when a user asks to implement multiple stories, an entire epic, or mentions batch processing.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Edit
  - Write
---

# Batch Stories -- Wave-Based Execution

> **Canonical source:** `src/workflows/story-pipeline/workflow.md`
> This file is a Copilot-adapted skill. For full details, refer to the canonical workflow.
> When this file conflicts with the canonical source, the canonical source wins.

**Role:** Orchestrate batch implementation of multiple stories.
**Philosophy:** Gap Analysis First, Build Only What's Missing.

## Input Contract

| Parameter | Required | Description | Failure Behavior |
|-----------|----------|-------------|------------------|
| `sprint_artifacts` | Yes | Path to sprint artifacts directory | Halt with error: "sprint_artifacts path not set" |
| `implementation_artifacts` | Yes | Path to implementation artifacts directory (contains sprint-status.yaml) | Halt with error: "implementation_artifacts path not set" |
| `epic` | No | Epic number to filter stories (e.g., `17`) | If omitted, process all ready-for-dev stories |
| `stories` | No | Explicit list of story keys to process (e.g., `["5-1", "5-2"]`) | If omitted, discover stories from sprint-status.yaml |
| `max_failures` | No | Maximum consecutive story failures before halting batch | Default: 3 |

## Procedure

### Step 1: Load Sprint Status

1. Read `{{implementation_artifacts}}/sprint-status.yaml`.
2. Extract stories with status `ready-for-dev` or `backlog`.
3. Exclude epics and retrospectives.
4. Sort by epic number, then story number.
5. If `epic` parameter is set, filter to that epic only.
6. If `stories` parameter is set, select only those specific stories.

### Step 2: Display and Select Stories

1. Show available stories with file status:
   - Check if story file exists in `{{sprint_artifacts}}/`.
   - Mark each: exists, missing, or already implemented.
2. Present selection options to the user:
   1. All ready-for-dev stories.
   2. Select specific stories.
   3. Single story.
3. Wait for user selection before proceeding.

### Step 3: Validate Story Files

For each selected story:

1. Read the story file.
2. Verify required sections exist: Business Context, Acceptance Criteria, Tasks.
3. If a story file is missing, mark it for regeneration using the story creation workflow.
4. If a story file is invalid, log the specific validation failure and exclude it from the batch.

### Step 4: Score Complexity

For each validated story, determine complexity tier:

```bash
TASK_COUNT=$(grep -c "^- \[ \]" "$STORY_FILE")
HIGH_RISK=$(grep -ciE "auth|security|payment|encryption|migration|database" "$STORY_FILE")
```

Use the same complexity routing table as the pipeline skill (trivial through critical).

### Step 5: Analyze Dependencies and Build Waves

#### 5a: Extract Dependencies (priority order)

1. **Explicit `depends_on`** -- Parse `depends_on:`, `dependencies:`, or `requires:` fields.
2. **File-based inference** -- Detect when Story A creates a file that Story B imports.
3. **Keyword scanning** -- Scan for phrases like "uses component from 5-1".
4. **Epic ordering** -- Lower story numbers first (fallback when no explicit deps).

#### 5b: Build Dependency Graph

1. Construct adjacency list from extracted dependencies.
2. Run cycle detection. If a circular dependency is found, remove the back-edge and log a warning.

#### 5c: Create Waves

1. Group stories into waves where all dependencies are satisfied by prior waves.
2. Display the wave plan to the user for confirmation.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WAVE PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Wave 1: 5-1 (standard), 5-3 (light)
Wave 2: 5-2 (standard), 5-4 (light)
Wave 3: 5-5 (micro), 5-6 (complex)

Total: 6 stories in 3 waves
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 6: Execute Stories Sequentially Within Waves

#### 6a: Gap Analysis Before Building

For each story, before invoking the pipeline:

1. Parse the story's Tasks section to extract expected artifacts (files, functions, tests).
2. Scan the codebase to determine which artifacts already exist.
3. Classify each task as: IMPLEMENTED (exists and passes tests), PARTIAL (exists but incomplete), or MISSING (not found).
4. Pass only PARTIAL and MISSING tasks to the pipeline. Skip fully IMPLEMENTED tasks.

#### 6b: Execute Pipeline

**Invoke the `pantheon-pipeline` skill for each story.** Do not implement stories directly.

The pipeline handles all 8 phases:
1. PREPARE -- Story validation + playbook loading
2. FORGE -- Pygmalion persona forging (if complexity >= light)
3. BUILD -- Metis TDD implementation
4. VERIFY -- Multi-reviewer validation in parallel
5. ASSESS -- Coverage gate + Themis triage
6. REFINE -- Fix issues iteratively
7. COMMIT -- Reconcile story + git commit
8. REFLECT -- Update playbooks with learnings

#### 6c: Reconcile After Each Story

After the pipeline completes for a story:

1. Load the completion artifact (`{{story_key}}-progress.json`).
2. Check off completed tasks in the story file.
3. Fill the Dev Agent Record section with metrics.
4. Update sprint-status.yaml: set story status to `done`.

#### 6d: Display Progress Between Stories

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BATCH PROGRESS (2/6 stories)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Wave 1:
  [done] 5-1  25 tests  97.6% cov  4->0 issues
  [done] 5-3  12 tests  91.3% cov  1->0 issues

Wave 2:
  [building] 5-2  ...in progress...
  [waiting]  5-4  ...waiting...

Wave 3:
  [waiting]  5-5  ...waiting...
  [waiting]  5-6  ...waiting...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 7: Generate Session Report

#### 7a: Gather Artifacts

For each processed story, collect:
- `{{story_key}}-progress.json`
- `{{story_key}}-hermes.json` (TL;DR + stats)
- `{{story_key}}-summary.md` (full report)

#### 7b: Display Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stories: {{completed}}/{{total}} completed
Files:   {{total_files}} changed
Tests:   {{total_tests}} added
Coverage: {{avg_coverage}}% average
Issues:  {{total_issues}} found, {{total_fixed}} fixed

Per-story reports: completions/{{story}}-summary.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 7c: Check Epic Completion

If all stories in an epic are now `done`, mark the epic as complete in sprint-status.yaml.

## Batch Termination Criteria

The batch terminates when ANY of these conditions is met:

- All selected stories have been processed (success or failure).
- `max_failures` consecutive story failures occur (default: 3). Halt and report systemic issue.
- The user cancels the batch.
- A story pipeline returns an unrecoverable error that indicates a systemic problem (e.g., test framework broken, git repository corrupted).

## Error Handling

| Error | Action |
|-------|--------|
| Sprint status file missing | Halt: "sprint-status.yaml not found at {{implementation_artifacts}}" |
| No stories match selection criteria | Halt: "No ready-for-dev stories found" |
| Story file missing for a selected story | Invoke story creation workflow, then continue |
| Story file fails validation | Exclude from batch, log reason, continue to next |
| Pipeline fails for a story | Mark story as `failed`, increment failure counter, continue to next |
| `max_failures` consecutive failures | Halt batch, report systemic issue to user |
| Circular dependency detected | Remove back-edge, log warning, continue with modified graph |
| All stories in a wave fail | Skip subsequent waves that depend on failed stories |

## Constraints

- Never implement stories directly -- always delegate to the `pantheon-pipeline` skill.
- Never skip gap analysis -- always check existing implementation before building.
- Never process stories from a later wave before all stories in prior waves complete or fail.
- Never continue the batch after `max_failures` consecutive failures.
- Never modify sprint-status.yaml for stories that were not processed.
- Never skip user confirmation of the wave plan.

## Pre-Output Verification

Before emitting the session report, verify:

1. Confirm every selected story has a recorded outcome (done, failed, or skipped).
2. Confirm sprint-status.yaml is updated for all processed stories.
3. Confirm story file checkboxes match actual implementation state for completed stories.
4. Confirm the session report totals match the sum of individual story results.
5. Confirm all per-story artifacts exist for completed stories.
6. Confirm epic completion status is updated if all stories in an epic are done.

## Platform Constraints (Copilot)

- **Sequential execution within waves** -- Copilot cannot reliably run multiple full pipelines in parallel. Process stories one at a time within each wave.
- **No agent resumption** -- Phase 6 REFINE spawns a fresh builder each iteration with artifact context. This costs more tokens than Claude Code's resume capability.
