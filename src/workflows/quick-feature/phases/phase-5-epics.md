# Phase 5: EPICS (5/8)
<!-- Part of Quick Feature Pipeline v1.0 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 5: EPICS & STORIES OUTLINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Autonomous generation + USER CHECKPOINT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 1: Spawn Epics Sub-Agent

Spawn a `Task` sub-agent (`general-purpose`, model: `opus`) with the following prompt:

```
{sub_agent.yolo_directive}

You are executing the BMM create-epics-and-stories workflow autonomously.

## Your Task
Follow the BMM workflow file below to generate epics with story breakdowns.

## BMM Workflow to Follow
Read and follow this workflow file completely:
{{bmm_workflows.create_epics_and_stories}}

## BMM Config
Load configuration from: {{bmm_config}}

## PRD (Primary Input)
Read the PRD at: {{PRD_PATH}}

## Architecture (Secondary Input)
{{IF ARCHITECTURE_PATH}}
Read the architecture at: {{ARCHITECTURE_PATH}}
{{ELSE}}
No architecture document available — derive technical approach from PRD.
{{END IF}}

## Output Location
Epics file: {{planning_artifacts}}/epics.md
(Or sharded: {{planning_artifacts}}/epics/ directory)

## Execution Rules
- Follow the workflow step-by-step
- At EVERY menu or checkpoint, select [c] Continue
- If offered YOLO mode [y], select it immediately
- Do NOT wait for user input at any point
- Generate comprehensive epics with BDD-style acceptance criteria
- Each story should have clear scope and acceptance criteria
- Write output to the specified location
```

## Step 2: Validate Epics Output

```
1. FILE EXISTS: Check for epics output
   → Check {planning_artifacts}/epics.md
   → OR check {planning_artifacts}/epics/*.md (sharded format)
   → Neither exists = HALT ("Epics generation failed — no output")

2. TOTAL SIZE: Sum all epic file sizes >= 5120 bytes (5KB)
   → Too small = WARN ("Epics total only {size} bytes, expected >= 5KB")

3. CONTENT CHECK: Scan for epic/story structure
   → Must contain "Epic" headers
   → Must contain "Story" headers or numbered story entries
   → Must contain acceptance criteria (Given/When/Then or checkbox format)
   → Missing structure = WARN ("Epics missing expected structure")
```

**On failure (no file):** HALT — cannot generate sprint-status without epics.

## Step 3: Parse Epic Summary

Extract from the generated epics:

```
EPIC_LIST = []
TOTAL_STORY_COUNT = 0

For each epic found:
  → Extract epic number and title
  → Count stories in epic
  → Add to EPIC_LIST
  → TOTAL_STORY_COUNT += story_count

EPIC_COUNT = EPIC_LIST.length
```

## Step 4: User Checkpoint (SECOND AND LAST USER STOP)

This is the **last user interaction point**. After this, the pipeline runs autonomously through sprint planning, story generation, validation, and build.

Use a **single AskUserQuestion call** with 2 batched questions:

```
Q1: "{{EPIC_COUNT}} epics with {{TOTAL_STORY_COUNT}} stories generated. Which epics to include?"
  header: "Epics"
  Options:
    - "All epics (Recommended)" — build everything
    - "Let me select specific epics" — will list epic titles for selection
  multiSelect: false

Q2: "How should stories be built?"
  header: "Build mode"
  Options:
    - "Sequential — one-by-one, best for brownfield/existing code (Recommended)"
    - "Parallel — concurrent workers, best for greenfield/throughput"
    - "Review first — pause to inspect stories before building"
  multiSelect: false
```

**Handle responses:**

```
IF Q1 answer == "Let me select specific epics":
  → Follow up with a multiSelect AskUserQuestion listing each epic:
    Q: "Select epics to build:"
    Options: [Epic 1: {title}, Epic 2: {title}, ...]
    multiSelect: true
  → Set SELECTED_EPICS = user's selections

ELSE:
  → Set SELECTED_EPICS = all epics

Set BUILD_MODE = Q2 answer (sequential | parallel | review)
```

## Step 5: Display Status

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EPICS COMPLETE — PIPELINE RESUMING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Epics:       {{EPIC_COUNT}} total, {{SELECTED_EPICS.length}} selected
Stories:     {{TOTAL_STORY_COUNT}} total
Build mode:  {{BUILD_MODE}}

Remaining phases run autonomously:
  → Sprint Planning
  → Story Generation ({{TOTAL_STORY_COUNT}} stories)
  → Story Validation
  → Build Handoff ({{BUILD_MODE}} mode)

No further input required.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Carry forward to Phase 6:**
- `EPICS_PATH` — path to epics file(s)
- `SELECTED_EPICS` — list of selected epic numbers
- `BUILD_MODE` — "sequential", "parallel", or "review"
- `PRD_PATH` — unchanged
- `ARCHITECTURE_PATH` — unchanged
- `ENRICHED_PLAN` — unchanged
