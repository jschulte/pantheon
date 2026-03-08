# Phase 3: STORIES (3/4)
<!-- Part of Plan-to-Story Pipeline v1.0 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3: STORIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Decompose plan → Update epics → Generate stories
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 1: Decompose Plan into Stories

Analyze PLAN_TEXT and break it into logical stories:

```
STORY_SPECS = []

FOR EACH plan item IN PLAN_ITEMS:
  Determine story boundaries:
    → Each distinct user-facing capability = 1 story
    → Each independent technical component = 1 story
    → Tightly coupled items may be combined into 1 story
    → Small/focused plans may produce just 1 story

  Determine epic and story number from EPIC_ASSIGNMENTS:
    → epic_num = EPIC_ASSIGNMENTS[item] (resolved to actual number, or NEW_EPIC_NUM if "new")
    → story_num = NEXT_STORY_NUM_PER_EPIC[epic_num]++ (or NEXT_STORY_NUM++ for single-epic)

  Create story spec:
    title_slug = kebab-case slug derived from descriptive title
                 (e.g. "User Authentication Flow" → "user-authentication-flow")
    STORY_SPECS.append({
      epic_num: epic_num,
      story_num: story_num,
      title: descriptive title (human-readable),
      title_slug: title_slug,
      user_story: "As a {persona}, I want {action}, so that {benefit}",
      acceptance_criteria: [BDD Given/When/Then statements],
      plan_context: relevant excerpt from PLAN_TEXT,
      source_commits: [commit references if IS_SWEEP]
    })

TOTAL_STORIES = STORY_SPECS.length
Log: "Decomposed plan into {{TOTAL_STORIES}} stories"
```

## Step 2: Update epics.md

Orchestrator does this directly — structured append, no sub-agent needed.

```
IF EPIC_STRATEGY == "create" (no epics.md exists):
  → Create new {planning_artifacts}/epics.md with header:
    "# Epics and Stories
     Generated: {{date}}

     ## Epic {{NEW_EPIC_NUM}}: {epic_title_from_plan}

     {epic_description}
    "
  → For each story in STORY_SPECS, append:
    "### Story {{epic_num}}.{{story_num}}: {{title}}
     **As a** {persona}, **I want** {action}, **so that** {benefit}

     **Acceptance Criteria:**
     - Given {context}, When {action}, Then {expected}
     - ...
    "

ELSE IF EPIC_STRATEGY == "append":
  → Read {planning_artifacts}/epics.md
  → Find section "## Epic {{TARGET_EPIC_NUM}}:"
  → Find the last ### Story entry within that epic section
  → After the last story entry (before the next ## Epic or end of file), append:
    New story entries in the same format as above
  → Write updated epics.md

ELSE IF EPIC_STRATEGY == "append-multi":
  → Read {planning_artifacts}/epics.md
  → Group STORY_SPECS by epic_num
  → For each epic_num group:
    → Find section "## Epic {{epic_num}}:"
    → Find the last ### Story entry within that epic section
    → Append new story entries for that group
  → Write updated epics.md

ELSE IF EPIC_STRATEGY == "new":
  → Read {planning_artifacts}/epics.md
  → Append at the end of the file:
    "## Epic {{NEW_EPIC_NUM}}: {epic_title_from_plan}

     {epic_description}

     ### Story {{NEW_EPIC_NUM}}.1: {{title}}
     ...
    "
  → Write updated epics.md

ELSE IF EPIC_STRATEGY == "mixed":
  → Read {planning_artifacts}/epics.md
  → For items fitting existing epics: append stories to their respective epic sections
  → For items needing new epic: append new epic section at end
  → Write updated epics.md
```

**Validate epics update:**
```
1. File exists after write
2. New story entries are present (grep for story titles)
3. Epic structure is intact (## Epic headers still valid)
```

## Step 3: Generate Story Files

Generate stories sequentially — each benefits from context established by prior ones.

```
RESULTS = []

FOR EACH story IN STORY_SPECS:

  story_key = "{{story.epic_num}}-{{story.story_num}}-{{story.title_slug}}"
  story_path = "{{implementation_artifacts}}/{{story_key}}.md"

  Log: "Generating story {{story_key}} ({{index+1}}/{{TOTAL_STORIES}})"

  # Determine gap analysis mode
  IF MODE == "pre-build":
    GAP_MODE = "none"
    CURRENT_STATE_DIRECTIVE = "Current State: Not yet implemented. All tasks should be marked [ ] (unchecked)."
  ELSE (MODE == "post-build"):
    GAP_MODE = "full"
    CURRENT_STATE_DIRECTIVE = |
      Current State: Implementation may already exist. You MUST perform gap analysis:
      1. Use Glob to find files matching story requirements
      2. Use Read to check implementation depth (real code vs stubs/TODOs)
      3. Check for test files
      4. Mark tasks as:
         - [x] VERIFIED: File exists, real implementation, tests exist
         - [~] PARTIAL: File exists but stub/TODO or no tests
         - [ ] MISSING: File does not exist
      5. Include file evidence for each checkbox state
  END IF

  Spawn a Task sub-agent (general-purpose, model: opus) with:

  ===
  {sub_agent.yolo_directive}

  You are executing the BMM create-story workflow autonomously.

  ## Your Task
  Generate a complete BMAD-formatted story file for story {{story_key}}.

  ## BMM Workflow
  1. Read the story creation instructions at: {{bmm_workflows.create_story}}
  2. Follow the instructions to generate a complete story file

  ## BMM Config
  Load configuration from: {{bmm_config}}

  ## Inputs
  {{IF SPRINT_EXISTS}}
  - Sprint status: {{implementation_artifacts}}/sprint-status.yaml
  {{END IF}}
  - Epics: {{planning_artifacts}}/epics.md
  {{IF PRD_EXISTS}}
  - PRD: {{planning_artifacts}}/prd.md
  {{END IF}}
  {{IF ARCHITECTURE_PATH}}
  - Architecture: {{ARCHITECTURE_PATH}}
  {{END IF}}

  ## Story to Generate
  - Story key: {{story_key}}
  - Epic number: {{story.epic_num}}
  - Story number: {{story.story_num}}
  - Story title: {{story.title}}
  - User story: {{story.user_story}}

  ## Plan Context (source material for this story)
  {{story.plan_context}}

  ## Gap Analysis Mode
  {{CURRENT_STATE_DIRECTIVE}}

  ## Output Location
  Story file: {{story_path}}

  ## Execution Rules
  - Enter YOLO mode immediately
  - Auto-approve all checkpoints and menus
  - Generate a COMPREHENSIVE story file (target: 10KB+)
  - Must include ALL 12 BMAD sections:
    Business Context, Acceptance Criteria, Tasks, Dev Agent Guardrails,
    Technical Requirements, Testing Requirements, Current State,
    Story Metadata, Dependencies, Performance Requirements,
    Security Requirements, Error Handling
  - Tasks MUST use checkbox format: - [ ] Task description (or [x]/[~] for gap analysis)
  - Include BDD acceptance criteria (Given/When/Then)
  - Write the complete story file to the output location
  ===

  → Wait for sub-agent completion
  → Run validation (Step 4)
  → Add result to RESULTS as: {story_key, story, status, path, size, section_count, task_count}

END FOR
```

## Step 4: Validate Stories

After each story sub-agent completes, validate the output:

```
VALIDATE(story_key):

  story_path = {implementation_artifacts}/{{story_key}}.md

  1. FILE EXISTS:
     → Missing = FAIL

  2. FILE SIZE >= story_validation.min_file_size_bytes (10240 bytes):
     → Too small = FAIL ("Story {{story_key}} is {{size}} bytes, need >= 10KB")

  3. REQUIRED SECTIONS (check for 12 BMAD sections):
     missing_sections = []
     FOR EACH section IN story_validation.required_sections:
       IF section header NOT found in file:
         → Add to missing_sections
     → missing_sections.length > 2 = FAIL
     → missing_sections.length 1-2 = WARN

  4. TASK FORMAT: Check for checkbox tasks
     → Count lines matching "- [ ]" or "- [x]" or "- [~]" patterns
     → task_count == 0 = FAIL ("No checkbox tasks found")

  5. GAP ANALYSIS (post-build mode only):
     → Verify [x]/[~]/[ ] markers are present
     → Verify file evidence comments exist (file paths referenced)

  RESULT:
    PASS = file exists + size OK + sections OK + tasks exist
    WARN = minor section gaps (1-2 missing)
    FAIL = file missing OR size < 10KB OR 3+ sections missing OR no tasks
```

**Retry failed stories:**
```
FOR EACH failed story IN RESULTS where status == FAIL:

  IF retry_count < story_validation.max_retries (2):
    Log: "Retrying story {{story_key}} (attempt {{retry_count + 1}}/{{max_retries}})"
    → Re-run Step 3 for this story with additional prompt context:
      "Previous generation was insufficient. Ensure the story is >= 10KB
       with all 12 required sections and checkbox tasks."
    → Re-validate
    → Update RESULTS

  ELSE:
    Log: "Story {{story_key}} failed after {{max_retries}} retries. Continuing."
    → Mark as FAILED in RESULTS

END FOR
```

**Check for systemic failure:**
```
failed_count = RESULTS.count(status == FAIL)
total_count = RESULTS.length

IF failed_count == total_count AND total_count > 0:
  → HALT: "All {{total_count}} stories failed generation. Systemic issue detected."
  → Report first 3 failure reasons
  → Stop pipeline
```

**Carry forward to Phase 4:**
- `STORY_SPECS` — story specifications with keys and paths
- `RESULTS` — validation results for each story
- `MODE` — unchanged
- `EPIC_STRATEGY`, `TARGET_EPIC_NUM` — unchanged
- `SPRINT_STATUS`, `SPRINT_EXISTS` — unchanged
- All artifact paths unchanged
