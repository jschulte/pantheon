# Phase 2: SCOPE (2/4) — USER CHECKPOINT
<!-- Part of Plan-to-Story Pipeline v1.0 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2: SCOPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRD comparison + epic placement + USER CHECKPOINT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 1: PRD Scope Comparison

> Skip this step if PRD_EXISTS is false. Set SCOPE_CLASS = "no-prd" and proceed.

Read PLAN_TEXT and PRD_CONTENT. For each distinct item/feature in the plan, classify:

```
PLAN_ITEMS = extract distinct features/capabilities from PLAN_TEXT
NEW_SCOPE_ITEMS = []
EXISTING_SCOPE_ITEMS = []

FOR EACH item IN PLAN_ITEMS:
  Search PRD_CONTENT for matching requirements:
    → Match by: topic keywords, feature names, user stories, functional areas
    → "existing" — a PRD requirement substantially covers this plan item
    → "new" — no corresponding PRD requirement found

  IF "existing":
    → Add to EXISTING_SCOPE_ITEMS with PRD reference
  ELSE:
    → Add to NEW_SCOPE_ITEMS

# Classification
IF NEW_SCOPE_ITEMS.length == 0:
  → SCOPE_CLASS = "existing"   (all items match existing PRD)
ELSE IF EXISTING_SCOPE_ITEMS.length > 0:
  → SCOPE_CLASS = "mixed"      (some new, some existing)
ELSE:
  → SCOPE_CLASS = "new"         (all items are new scope)
```

## Step 2: Epic Placement Analysis

Parse existing epics to determine where new stories should be placed.

```
IF EPICS_EXISTS:
  Parse EPICS_CONTENT:
    → Extract all epic sections (## Epic N: Title)
    → For each epic, count existing stories (### Story N.M: Title)
    → Build EPIC_MAP: {epic_num, title, story_count, topics/keywords}

  FOR EACH plan item (from PLAN_ITEMS):
    Determine best-fit epic by topic/domain overlap:
      → Compare plan item keywords against each epic's title and story topics
      → Select epic with strongest overlap
      → If no clear overlap → mark for new epic

  IF all items fit existing epics:
    → EPIC_STRATEGY = "append"
    → TARGET_EPIC_NUM = best-fit epic number
    → NEXT_STORY_NUM = EPIC_MAP[TARGET_EPIC_NUM].story_count + 1
  ELSE IF some items need a new epic:
    → EPIC_STRATEGY = "mixed" (some append, some new epic)
    → NEW_EPIC_NUM = max(existing epic numbers) + 1
  ELSE:
    → EPIC_STRATEGY = "new"
    → NEW_EPIC_NUM = max(existing epic numbers) + 1

ELSE (no epics.md):
  → EPIC_STRATEGY = "create"
  → NEW_EPIC_NUM = 1
```

## Step 3: User Checkpoint (SINGLE MANDATORY STOP)

This is the **only user interaction point** in the entire pipeline. After this, everything runs autonomously.

Use a **single AskUserQuestion call** with up to 3 questions:

```
QUESTIONS = []

# Q1: Mode confirmation (always)
QUESTIONS.append({
  question: "Detected mode: {{MODE}}. Is this correct?",
  header: "Mode",
  options: [
    { label: "Yes, {{MODE}} (Recommended)", description: "Proceed with detected mode" },
    { label: "Switch to pre-build", description: "Plan hasn't been built yet — generate stories with all tasks unchecked" },
    { label: "Switch to post-build", description: "Work is already done — generate stories with gap analysis" }
  ],
  multiSelect: false
})

# Q2: PRD amendment (conditional on scope analysis)
IF SCOPE_CLASS == "mixed" OR SCOPE_CLASS == "new":
  QUESTIONS.append({
    question: "Found {{NEW_SCOPE_ITEMS.length}} plan items not in PRD. Amend PRD?",
    header: "PRD",
    options: [
      { label: "Amend PRD (Recommended)", description: "Add {{NEW_SCOPE_ITEMS.length}} new requirements to existing PRD" },
      { label: "Skip PRD amendment", description: "Generate stories without updating PRD" },
      { label: "Abort — run /quick-feature instead", description: "Too much new scope for lightweight pipeline" }
    ],
    multiSelect: false
  })
ELSE IF SCOPE_CLASS == "existing":
  QUESTIONS.append({
    question: "Plan aligns with existing PRD requirements. Continue?",
    header: "PRD",
    options: [
      { label: "Continue (Recommended)", description: "Plan matches PRD — no amendment needed" },
      { label: "Amend PRD anyway", description: "Force PRD update even though scope matches" }
    ],
    multiSelect: false
  })
ELSE IF SCOPE_CLASS == "no-prd":
  # No question needed — already warned in Phase 1
  # Proceed without PRD cross-references
END IF

# Q3: Epic placement (always)
IF EPIC_STRATEGY == "append":
  QUESTIONS.append({
    question: "Place stories in Epic {{TARGET_EPIC_NUM}}: {{EPIC_MAP[TARGET_EPIC_NUM].title}}?",
    header: "Epic",
    options: [
      { label: "Epic {{TARGET_EPIC_NUM}} (Recommended)", description: "Append to existing epic — next story: {{TARGET_EPIC_NUM}}.{{NEXT_STORY_NUM}}" },
      { label: "Choose different epic", description: "Select from existing epics" },
      { label: "Create new epic", description: "Start a new epic for this work" }
    ],
    multiSelect: false
  })
ELSE IF EPIC_STRATEGY == "mixed":
  QUESTIONS.append({
    question: "Some stories fit existing epics, others need a new Epic {{NEW_EPIC_NUM}}. Accept?",
    header: "Epic",
    options: [
      { label: "Accept mixed placement (Recommended)", description: "Append matching stories to existing epics, create Epic {{NEW_EPIC_NUM}} for rest" },
      { label: "All in new epic", description: "Create Epic {{NEW_EPIC_NUM}} for all stories" },
      { label: "All in existing epic", description: "Force-fit all into an existing epic" }
    ],
    multiSelect: false
  })
ELSE IF EPIC_STRATEGY == "new" OR EPIC_STRATEGY == "create":
  QUESTIONS.append({
    question: "Creating new Epic {{NEW_EPIC_NUM}} for all stories. Accept?",
    header: "Epic",
    options: [
      { label: "Create Epic {{NEW_EPIC_NUM}} (Recommended)", description: "New epic section with all plan stories" },
      { label: "Choose existing epic", description: "Append to an existing epic instead" }
    ],
    multiSelect: false
  })
END IF

→ Call AskUserQuestion with QUESTIONS
→ Process responses
```

**Handle responses:**

```
# Mode
IF user switched mode:
  → Update MODE to selected value

# PRD
IF "Abort — run /quick-feature instead":
  → HALT pipeline: "Aborting. Run /quick-feature for full document trail creation."
IF "Amend PRD" or "Amend PRD anyway":
  → Set PRD_AMEND = true
IF "Skip" or "Continue":
  → Set PRD_AMEND = false

# Epic
IF "Choose different epic" or "Choose existing epic":
  → Follow up with AskUserQuestion listing available epics
  → Update TARGET_EPIC_NUM based on selection
IF "All in new epic" or "Create new epic":
  → Set EPIC_STRATEGY = "new", TARGET_EPIC_NUM = NEW_EPIC_NUM
IF accepted recommended:
  → Keep EPIC_STRATEGY and TARGET_EPIC_NUM as analyzed
```

## Step 4: Conditional — Spawn Edit-PRD Sub-Agent

> Only execute if PRD_AMEND is true AND PRD_EXISTS is true.

Spawn a `Task` sub-agent (`general-purpose`, model: `opus`) with:

```
{sub_agent.yolo_directive}

You are executing the BMM edit-prd workflow autonomously.

## Your Task
Surgically update the existing PRD with new scope items. Do NOT rewrite the PRD — only ADD the new requirements.

## BMM Workflow to Follow
Read and follow this workflow file completely:
{{bmm_workflows.edit_prd}}

## BMM Config
Load configuration from: {{bmm_config}}

## PRD to Edit
Path: {{planning_artifacts}}/prd.md

## New Requirements to Add
{{NEW_SCOPE_ITEMS — formatted as requirements}}

## Execution Rules
- Follow the workflow step-by-step
- At EVERY menu or checkpoint, select [c] Continue
- If offered YOLO mode [y], select it immediately
- Do NOT wait for user input at any point
- ONLY add the new requirements — do not restructure existing content
- Preserve all existing PRD content and structure
```

After sub-agent completes, verify PRD file still exists and was updated.

**On failure:** WARN and continue. PRD amendment is optional.

## Step 5: Display Scope Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCOPE COMPLETE — PIPELINE RESUMING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode:            {{MODE}}
PRD scope:       {{SCOPE_CLASS}} ({{NEW_SCOPE_ITEMS.length}} new items)
PRD amended:     {{PRD_AMEND ? "Yes" : "No"}}
Epic strategy:   {{EPIC_STRATEGY}} → Epic {{TARGET_EPIC_NUM}}

Remaining phases run autonomously:
  → Story Decomposition & Generation
  → Sprint Status Update & Handoff

No further input required.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Carry forward to Phase 3:**
- `MODE` — confirmed mode ("pre-build" or "post-build")
- `PLAN_TEXT` — unchanged
- `PLAN_ITEMS` — decomposed plan items
- `SCOPE_CLASS` — "existing", "mixed", "new", or "no-prd"
- `PRD_AMEND` — boolean
- `EPIC_STRATEGY` — "append", "mixed", "new", or "create"
- `TARGET_EPIC_NUM` — target epic number
- `NEXT_STORY_NUM` — next available story number in target epic
- `NEW_EPIC_NUM` — new epic number (if creating)
- `EPICS_CONTENT`, `EPICS_EXISTS`
- `PRD_CONTENT`, `PRD_EXISTS`
- `ARCHITECTURE_PATH`
- `SPRINT_STATUS`, `SPRINT_EXISTS`
