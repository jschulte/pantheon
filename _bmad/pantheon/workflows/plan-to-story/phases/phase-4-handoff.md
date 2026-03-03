# Phase 4: HANDOFF (4/4)
<!-- Part of Plan-to-Story Pipeline v1.0 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4: HANDOFF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Update sprint-status → Summary → Next steps
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 1: Update sprint-status.yaml

Orchestrator does this directly — YAML append, no sub-agent needed.

```
IF SPRINT_EXISTS:
  → Read {implementation_artifacts}/sprint-status.yaml
  → Parse development_status section

  # Add epic entry if not present
  IF epic-{{TARGET_EPIC_NUM}} key does NOT exist in development_status:
    → Append: "  epic-{{TARGET_EPIC_NUM}}: in-progress"

  # Add story entries
  FOR EACH story IN STORY_SPECS where RESULTS[story] != FAIL:
    story_key = "{{story.epic_num}}-{{story.story_num}}-{{story.title_slug}}"

    # Determine status based on mode
    IF MODE == "pre-build":
      → story_status = "ready-for-dev"

    ELSE (MODE == "post-build"):
      # Analyze gap analysis results from story file
      Read story file and count checkboxes:
        checked = count of [x] markers
        partial = count of [~] markers
        unchecked = count of [ ] markers
        total = checked + partial + unchecked

      IF unchecked == 0 AND partial == 0:
        → story_status = "done"
      ELSE IF checked > (total * 0.7):
        → story_status = "review"
      ELSE:
        → story_status = "in-progress"
    END IF

    → Append to development_status: "  {{story_key}}: {{story_status}}"

  # Add retrospective entry if new epic
  IF EPIC_STRATEGY == "new" OR EPIC_STRATEGY == "create":
    → Append: "  epic-{{TARGET_EPIC_NUM}}-retrospective: optional"

  # Check if epic is fully done (post-build only)
  IF MODE == "post-build":
    → Count all stories for epic-{{TARGET_EPIC_NUM}}
    → If ALL stories are "done" → update epic status to "done"

  → Write updated sprint-status.yaml (preserve all comments and existing entries)

ELSE (no sprint-status.yaml):
  → Create new {implementation_artifacts}/sprint-status.yaml:

  "# generated: {{date}}
   # project: (from config)
   # tracking_system: file-system
   # story_location: "{implementation_artifacts}/stories"

   # STATUS DEFINITIONS:
   # ==================
   # Epic Status:
   #   - backlog: Epic not yet started
   #   - in-progress: Epic actively being worked on
   #   - done: All stories in epic completed
   #
   # Story Status:
   #   - backlog: Story only exists in epic file
   #   - ready-for-dev: Story file created, ready for development
   #   - in-progress: Developer actively working on implementation
   #   - review: Implementation complete, ready for review
   #   - done: Story completed

   development_status:
     epic-{{TARGET_EPIC_NUM}}: in-progress
     {{FOR EACH story with status}}
     {{story_key}}: {{story_status}}
     {{END FOR}}
     epic-{{TARGET_EPIC_NUM}}-retrospective: optional
  "
```

## Step 2: Summary Display

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLAN-TO-STORY COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mode: {{MODE}}
Epic: {{TARGET_EPIC_NUM}}

| Story Key | Title              | Size    | Sections | Tasks ([x]/[~]/[ ]) | Status        |
|-----------|--------------------|---------|----------|----------------------|---------------|
{{FOR EACH story IN RESULTS}}
| {{key}}   | {{title}}          | {{KB}}  | {{N}}/12 | {{checked}}/{{partial}}/{{unchecked}} | {{status}} |
{{END FOR}}

Summary:
  Stories generated:  {{pass_count + warn_count}}
  Stories failed:     {{fail_count}}
  PRD amended:        {{PRD_AMEND ? "Yes" : "No"}}
  Epics updated:      {{EPIC_STRATEGY}}
  Sprint status:      Updated

{{IF MODE == "post-build" AND SWEEP_RESULTS}}
Sweep coverage:
  Commits documented: {{documented_commit_count}}/{{total_commits}}
  Groups documented:  {{SWEEP_RESULTS.undocumented}} previously undocumented
{{END IF}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 3: Next Steps

Display recommended next actions based on mode (no user stop — informational only):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{IF MODE == "pre-build"}}
Stories are ready for development:
  1. Run /batch-stories to build all stories
  2. Run /story-pipeline for a specific story
  3. Review story files in {{implementation_artifacts}}/stories/

{{ELSE IF MODE == "post-build"}}
  {{IF any stories have unchecked tasks}}
Stories with gaps detected:
  {{FOR EACH story with unchecked > 0}}
  - {{story_key}}: {{unchecked}} unchecked tasks — run /story-pipeline to close gaps
  {{END FOR}}

  {{ELSE}}
All work verified complete:
  - Stories documented retroactively with full gap analysis
  - All tasks verified as implemented
  - Sprint status reflects actual completion

  {{END IF}}

  {{IF SWEEP_RESULTS}}
Sweep follow-up:
  - Run /plan-to-story sweep_range="{{different_range}}" to scan a different period
  - Review documented stories for accuracy
  {{END IF}}

{{END IF}}

Artifacts updated:
  - Epics:         {{planning_artifacts}}/epics.md
  - Sprint status: {{implementation_artifacts}}/sprint-status.yaml
  - Stories:       {{implementation_artifacts}}/stories/
  {{IF PRD_AMEND}}
  - PRD:           {{planning_artifacts}}/prd.md
  {{END IF}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
