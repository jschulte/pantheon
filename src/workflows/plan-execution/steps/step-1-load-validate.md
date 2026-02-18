# Step 1: Load & Validate Inputs (1/8)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 1: LOAD & VALIDATE INPUTS (1/8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Discovering project artifacts...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.1 Discover and Read Epics

```
# Try whole-file epics first, then sharded
IF exists("docs/epics.md"):
  EPICS_SOURCE = Read("docs/epics.md")
  EPICS_MODE = "single"
ELIF exists("docs/epics/*.md"):
  EPICS_SOURCE = Read each shard in docs/epics/
  EPICS_MODE = "sharded"
ELSE:
  HALT: "No epics found. Run /create-epics-and-stories first."
```

### 1.2 Discover and Read Architecture

```
IF exists("docs/architecture.md"):
  ARCHITECTURE = Read("docs/architecture.md")
ELSE:
  HALT: "No architecture.md found. Run /create-architecture first."
```

### 1.3 Check for Sprint Status (Rebalance Mode)

```
IF exists("{{implementation_artifacts}}/sprint-status.yaml"):
  SPRINT_STATUS = Read("{{implementation_artifacts}}/sprint-status.yaml")
  REBALANCE_MODE = true

  # Parse completed stories
  COMPLETED_STORIES = stories WHERE status == "done"
  COMPLETED_EPICS = epics WHERE all stories are "done"
  REMAINING_STORIES = stories WHERE status != "done"

  echo "Rebalance mode: {{COMPLETED_STORIES.count}} stories done, {{REMAINING_STORIES.count}} remaining"
ELSE:
  REBALANCE_MODE = false
  echo "Initial planning mode (no sprint-status found)"
```

### 1.4 Parse Epic & Story Inventory

```
FOR EACH epic IN EPICS_SOURCE:
  Extract:
    - epic_id (e.g., "Epic 1", "Epic 2")
    - epic_title
    - epic_description
    - stories[] with:
      - story_key (e.g., "1-1", "1-2")
      - story_title
      - story_size (if available: S/M/L/XL)
      - story_tasks_count
      - story_domains[] (inferred in Step 3)
      - story_dependencies[] (explicit if listed, inferred in Step 4)

TOTAL_EPICS = count of epics
TOTAL_STORIES = count of all stories across epics
```

### 1.5 Detect Project Type

```
IF project_type == "auto-detect":
  IF REBALANCE_MODE AND COMPLETED_STORIES.count > 0:
    PROJECT_TYPE = "brownfield"
  ELIF architecture mentions "existing codebase" OR "legacy" OR "migration":
    PROJECT_TYPE = "brownfield"
  ELSE:
    PROJECT_TYPE = "greenfield"
ELSE:
  PROJECT_TYPE = project_type  # User override
```

### 1.6 Display Input Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  INPUT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project Type: {{PROJECT_TYPE}}
  Mode:         {{REBALANCE_MODE ? "Rebalance" : "Initial Planning"}}
  Epics:        {{TOTAL_EPICS}}
  Stories:      {{TOTAL_STORIES}}
  {{IF REBALANCE_MODE}}
  Completed:    {{COMPLETED_STORIES.count}} stories ({{COMPLETED_EPICS.count}} full epics)
  Remaining:    {{REMAINING_STORIES.count}} stories
  {{ENDIF}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
