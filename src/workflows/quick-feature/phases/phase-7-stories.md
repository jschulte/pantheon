# Phase 7: STORY GENERATION + VALIDATION (7/8)
<!-- Part of Quick Feature Pipeline v1.0 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 7: STORY GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Autonomous — generating {{STORY_COUNT}} stories
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 1: Enumerate Stories

From `STORY_LIST` (extracted in Phase 6), prepare the generation queue:

```
GENERATION_QUEUE = STORY_LIST  (all backlog stories)
RESULTS = []
RETRY_QUEUE = []
```

## Step 2: Generate Stories Sequentially

Stories are generated sequentially — each story benefits from context established by prior ones.

```
FOR EACH story IN GENERATION_QUEUE:

  Log: "Generating story {{story.story_key}}: {{story.story_title}} ({{index+1}}/{{total}})"

  Spawn a Task sub-agent (general-purpose, model: opus) with:

  ===
  {sub_agent.yolo_directive}

  You are executing the BMM create-story workflow autonomously.

  ## Your Task
  Generate a complete BMAD-formatted story file for story {{story.story_key}}.

  ## BMM Workflow
  1. Read the story creation instructions at: {bmm_workflows.create_story}
  2. Follow the instructions to generate a complete story file

  ## BMM Config
  Load configuration from: {bmm_config}

  ## Inputs
  - Sprint status: {SPRINT_STATUS_PATH}
  - Epics: {EPICS_PATH}
  - PRD: {PRD_PATH}
  {{IF ARCHITECTURE_PATH}}
  - Architecture: {ARCHITECTURE_PATH}
  {{END IF}}

  ## Story to Generate
  - Story key: {{story.story_key}}
  - Story title: {{story.story_title}}

  ## Output Location
  Story file: {implementation_artifacts}/stories/{{story.story_key}}.md

  ## Execution Rules
  - Enter YOLO mode immediately
  - Auto-approve all checkpoints and menus
  - Generate a COMPREHENSIVE story file (target: 10KB+)
  - Must include ALL 12 BMAD sections:
    Business Context, Acceptance Criteria, Tasks, Dev Agent Guardrails,
    Technical Requirements, Testing Requirements, Current State,
    Story Metadata, Dependencies, Performance Requirements,
    Security Requirements, Error Handling
  - Tasks MUST use checkbox format: - [ ] Task description
  - Include BDD acceptance criteria (Given/When/Then)
  - Write the complete story file to the output location
  ===

  → Wait for sub-agent completion
  → Run validation (Step 3)
  → Add result to RESULTS

END FOR
```

## Step 3: Validate Each Story

After each story sub-agent completes, validate the output:

```
VALIDATE(story_key):

  story_path = {implementation_artifacts}/stories/{{story_key}}.md

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
     → Count lines matching "- [ ]" pattern
     → task_count == 0 = FAIL ("No checkbox tasks found")

  RESULT:
    PASS = file exists + size OK + sections OK + tasks exist
    WARN = minor section gaps (1-2 missing)
    FAIL = file missing OR size < 10KB OR 3+ sections missing OR no tasks
```

## Step 4: Retry Failed Stories

```
FOR EACH failed story IN RESULTS where status == FAIL:

  IF retry_count < story_validation.max_retries (2):
    Log: "Retrying story {{story_key}} (attempt {{retry_count + 1}}/{{max_retries}})"
    → Re-run Step 2 for this story with additional prompt context:
      "Previous generation was insufficient. Ensure the story is >= 10KB
       with all 12 required sections and checkbox tasks."
    → Re-validate
    → Update RESULTS

  ELSE:
    Log: "Story {{story_key}} failed after {{max_retries}} retries. Continuing."
    → Mark as FAILED in RESULTS

END FOR
```

## Step 5: Check for Systemic Failure

```
failed_count = RESULTS.count(status == FAIL)
total_count = RESULTS.length

IF failed_count == total_count AND total_count > 0:
  → HALT: "All {{total_count}} stories failed generation. This indicates a systemic issue."
  → Report the first 3 failure reasons
  → Stop pipeline

IF failed_count > total_count / 2:
  → WARN: "{{failed_count}}/{{total_count}} stories failed. Pipeline will continue with successful stories."
```

## Step 6: Display Validation Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STORY GENERATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Story Key | Title              | Size    | Sections | Tasks | Status |
|-----------|--------------------|---------|----------|-------|--------|
| {{key}}   | {{title}}          | {{KB}}  | {{N}}/12 | {{N}} | {{OK/WARN/FAIL}} |
| ...       | ...                | ...     | ...      | ...   | ...    |

Summary:
  Total:    {{total_count}}
  Passed:   {{pass_count}}
  Warnings: {{warn_count}}
  Failed:   {{fail_count}}

Proceeding to BUILD...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Carry forward to Phase 8:**
- `STORY_RESULTS` — list of {story_key, status, path, size, section_count, task_count}
- `VALID_STORIES` — stories with status PASS or WARN
- `BUILD_MODE` — from Phase 5
- `SPRINT_STATUS_PATH` — unchanged
