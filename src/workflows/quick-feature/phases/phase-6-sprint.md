# Phase 6: SPRINT PLANNING (6/8)
<!-- Part of Quick Feature Pipeline v1.0 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 6: SPRINT PLANNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Autonomous — no user input required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 1: Spawn Sprint Planning Sub-Agent

The sprint-planning BMM workflow uses a `workflow.yaml` format (not step-files). The sub-agent loads the workflow.yaml which routes to its own instructions.

Spawn a `Task` sub-agent (`general-purpose`, model: `opus`) with the following prompt:

```
{sub_agent.yolo_directive}

You are executing the BMM sprint-planning workflow autonomously.

## Your Task
Generate a sprint-status.yaml file from the epics document.

## BMM Workflow
1. Read the workflow config at: {{bmm_workflows.sprint_planning}}
2. Load the workflow.xml engine at: {{project-root}}/_bmad/core/tasks/workflow.xml
3. Pass the workflow.yaml path as the 'workflow-config' parameter
4. Follow workflow.xml instructions to execute the sprint-planning workflow

## BMM Config
Load configuration from: {{bmm_config}}

## Inputs
- Epics file: {{EPICS_PATH}}
- PRD file: {{PRD_PATH}}

## Selected Epics
Only include stories from these epics: {{SELECTED_EPICS}}
(If "all", include all epics)

## Output Location
Sprint status: {{implementation_artifacts}}/sprint-status.yaml

## Execution Rules
- Enter YOLO mode immediately when offered
- Auto-approve all checkpoints
- Include ALL stories from selected epics in the sprint-status
- Set all story statuses to "backlog"
- Write the complete sprint-status.yaml to the output location
```

## Step 2: Validate Sprint Status Output

```
1. FILE EXISTS: Check {implementation_artifacts}/sprint-status.yaml exists
   → Missing = HALT ("Sprint planning failed — no sprint-status.yaml")

2. CONTENT CHECK: Parse the YAML and verify:
   → Contains "development_status:" section (or equivalent status section)
   → Contains story entries with keys and statuses
   → Story count > 0
   → Missing structure = HALT ("sprint-status.yaml is malformed")

3. STORY COUNT MATCH: Compare stories in sprint-status vs expected from epics
   → Mismatch = WARN ("Expected {expected} stories, found {actual} in sprint-status")
```

**On failure:** HALT — cannot generate individual stories without sprint-status.yaml.

## Step 3: Extract Story List

Parse sprint-status.yaml to build the story queue for Phase 7:

```
STORY_LIST = []

For each story entry in sprint-status.yaml:
  IF story.status == "backlog":
    → Extract story_key (e.g., "5-1")
    → Extract story_title
    → Add to STORY_LIST

Log: "Found {{STORY_LIST.length}} stories in backlog"
```

## Step 4: Display Status

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPRINT PLANNING COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sprint status: {{implementation_artifacts}}/sprint-status.yaml
Stories found:  {{STORY_LIST.length}} in backlog
Epics covered:  {{SELECTED_EPICS.length}}

Proceeding to STORY GENERATION...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Carry forward to Phase 7:**
- `SPRINT_STATUS_PATH` — path to sprint-status.yaml
- `STORY_LIST` — list of {story_key, story_title} objects
- `EPICS_PATH` — unchanged
- `PRD_PATH` — unchanged
- `ARCHITECTURE_PATH` — unchanged
