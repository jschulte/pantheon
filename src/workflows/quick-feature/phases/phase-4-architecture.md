# Phase 4: ARCHITECTURE (4/8)
<!-- Part of Quick Feature Pipeline v1.0 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4: ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Autonomous — no user input required (skippable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 1: Skip Gate

```
IF SKIP_ARCHITECTURE == true AND architecture.md exists at {planning_artifacts}/architecture.md:
  → Log: "Skipping architecture — existing document detected and no architectural changes in plan."
  → Set ARCHITECTURE_PATH = {planning_artifacts}/architecture.md
  → Skip to Phase 5

ELSE IF SKIP_ARCHITECTURE == true AND architecture.md does NOT exist:
  → Log: "skip_architecture is true but no existing architecture found. Generating."
  → Continue to Step 2
```

## Step 2: Spawn Architecture Sub-Agent

Spawn a `Task` sub-agent (`general-purpose`, model: `opus`) with the following prompt:

```
{sub_agent.yolo_directive}

You are executing the BMM create-architecture workflow autonomously.

## Your Task
Follow the BMM workflow file below to generate an architecture document.

## BMM Workflow to Follow
Read and follow this workflow file completely:
{{bmm_workflows.create_architecture}}

## BMM Config
Load configuration from: {{bmm_config}}

## PRD (Primary Input)
Read the PRD at: {{PRD_PATH}}

## Additional Context (Enriched Plan)
{{ENRICHED_PLAN}}

## Output Location
Architecture file: {{planning_artifacts}}/architecture.md

## Execution Rules
- Follow the workflow step-by-step
- At EVERY menu or checkpoint, select [c] Continue
- If offered YOLO mode [y], select it immediately
- Do NOT wait for user input at any point
- The PRD is your primary input — architecture must align with PRD requirements
- Write the complete architecture document to the output location
```

## Step 3: Validate Architecture Output

```
1. FILE EXISTS: Check {planning_artifacts}/architecture.md exists
   → Missing = WARN ("Architecture generation failed — no output file")
   → Continue to Phase 5 (architecture is non-blocking)

2. FILE SIZE: Check file size >= 3072 bytes (3KB)
   → Too small = WARN ("Architecture is only {size} bytes, expected >= 3KB")
```

**On failure:** WARN but continue. Architecture is valuable but not strictly required for epics. The PRD alone provides sufficient context.

## Step 4: Display Status

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHITECTURE {{status}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File:     {{architecture_path || "SKIPPED/FAILED"}}
Size:     {{file_size || "N/A"}} bytes
Status:   {{COMPLETE | SKIPPED | WARN}}

Proceeding to EPICS...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Carry forward to Phase 5:**
- `ARCHITECTURE_PATH` — path to architecture doc (or null if skipped/failed)
- `PRD_PATH` — unchanged
- `ENRICHED_PLAN` — unchanged
