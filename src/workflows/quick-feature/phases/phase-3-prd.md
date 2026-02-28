# Phase 3: PRD (3/8)
<!-- Part of Quick Feature Pipeline v1.0 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3: PRD GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Autonomous — no user input required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 1: Select BMM Workflow

```
IF PRD_MODE == "edit":
  → BMM_WORKFLOW = bmm_workflows.edit_prd
  → Log: "Editing existing PRD with new requirements..."

ELSE (PRD_MODE == "create"):
  → BMM_WORKFLOW = bmm_workflows.create_prd
  → Log: "Creating new PRD from enriched plan..."
```

## Step 2: Spawn PRD Sub-Agent

Spawn a `Task` sub-agent (`general-purpose`, model: `opus`) with the following prompt:

```
{sub_agent.yolo_directive}

You are executing the BMM PRD workflow autonomously.

## Your Task
Follow the BMM workflow file below to generate/edit a PRD document.

## BMM Workflow to Follow
Read and follow this workflow file completely:
{BMM_WORKFLOW}

## BMM Config
Load configuration from: {bmm_config}

## User Requirements (Enriched Plan)
{ENRICHED_PLAN}

## Output Location
PRD file: {planning_artifacts}/prd.md

## Execution Rules
- Follow the workflow step-by-step
- At EVERY menu or checkpoint, select [c] Continue
- If offered YOLO mode [y], select it immediately
- Do NOT wait for user input at any point
- Write the complete PRD to the output location
- Use the enriched plan as the source of all requirements
```

## Step 3: Validate PRD Output

After the sub-agent completes, validate the output:

```
1. FILE EXISTS: Check {planning_artifacts}/prd.md exists
   → Missing = HALT ("PRD generation failed — no output file")

2. FILE SIZE: Check file size >= 5120 bytes (5KB)
   → Too small = WARN ("PRD is only {size} bytes, expected >= 5KB")
   → Log warning but continue

3. KEY SECTIONS: Scan for presence of these headers:
   - "Executive Summary" or "Overview"
   - "Functional Requirements" or "Requirements"
   - "User Stories" or "User Flows"
   - "Success Metrics" or "KPIs"
   → Missing sections = WARN ("PRD missing sections: {list}")
```

**On validation failure (file missing):** HALT the pipeline. PRD is the foundation — cannot continue without it.

**On validation warnings:** Log and continue. The PRD exists but may be thin.

## Step 4: Display Status

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRD COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode:     {{PRD_MODE}}
File:     {{prd_path}}
Size:     {{file_size}} bytes
Warnings: {{warning_count || "None"}}

Proceeding to {{SKIP_ARCHITECTURE ? "EPICS" : "ARCHITECTURE"}}...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Carry forward to Phase 4:**
- `PRD_PATH` — path to generated/edited PRD
- `ENRICHED_PLAN` — unchanged
- `SKIP_ARCHITECTURE` — from Phase 1
