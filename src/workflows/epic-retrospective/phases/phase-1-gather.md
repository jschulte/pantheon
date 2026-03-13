# Phase 1: GATHER (1/4)
<!-- Part of Epic Retrospective v1.0 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: GATHER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Discover epic, collect all build artifacts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

This phase runs in the orchestrator context (no sub-agent needed).

## Step 1: Identify the Completed Epic

**Priority 1: Check sprint-status.yaml**

```
Read {{implementation_artifacts}}/sprint-status.yaml
Parse development_status section
Find epics where:
  - Epic status is "done" OR all stories for that epic are "done"
  - Retrospective status is NOT "done" (hasn't been retrospected yet)

IF multiple candidates:
  → Present list, ask user which epic to retrospect
IF one candidate:
  → Confirm with user: "Epic {{epic_num}} appears complete. Retrospect this one?"
IF no candidates:
  → Ask user: "No completed epics with pending retrospectives found. Which epic number?"
```

**Priority 2: User provides epic number directly**

If the user passed an epic number when invoking the workflow, use that.

```
Set {{epic_num}} = user-provided or confirmed epic number
```

## Step 2: Verify Epic Completion Status

```
Count all stories for epic {{epic_num}} in sprint-status.yaml
  → story keys matching pattern: {{epic_num}}-*

total_stories = count of story keys
done_stories = count where status == "done"
pending_stories = total - done

IF pending_stories > 0:
  Display:
  "Epic {{epic_num}}: {{done_stories}}/{{total_stories}} stories complete.
   {{pending_stories}} stories still pending.

   Options:
   1. Continue with partial retrospective (retrospect what's done)
   2. Abort — finish remaining stories first"

  WAIT for user choice.

  IF user chooses abort → HALT
  IF user chooses continue → Set {{partial_retro}} = true
```

## Step 3: Collect Story Artifacts

For each story in epic {{epic_num}}, gather all available completion artifacts.

```
story_keys = all keys matching {{epic_num}}-* from sprint-status

FOR EACH story_key IN story_keys:
  artifacts[story_key] = {}

  # Check each artifact type from workflow.yaml
  FOR EACH suffix IN story_artifact_types:
    file = {{sprint_artifacts}}/completions/{{story_key}}{{suffix}}
    IF file exists:
      artifacts[story_key][suffix] = Read(file)

  # Also check for specialist-specific review files
  # Pattern: {{story_key}}-{{specialist_name}}.json
  specialist_files = Glob("{{sprint_artifacts}}/completions/{{story_key}}-*.json")
  FOR EACH file IN specialist_files:
    IF file not already captured:
      artifacts[story_key][basename] = Read(file)

  # Check for narrative logs
  narrative = Glob("{{sprint_artifacts}}/completions/{{story_key}}*narrative*.log")
  IF narrative exists:
    artifacts[story_key]["narrative"] = Read(narrative)
```

**Track artifact coverage:**
```
FOR EACH story_key:
  artifact_count = count of artifacts found
  IF artifact_count == 0:
    Log warning: "Story {{story_key}} has no completion artifacts"

Display summary:
"Collected artifacts for {{stories_with_artifacts}}/{{total_stories}} stories.
 Total artifacts: {{total_artifact_count}}
 Stories with no artifacts: {{stories_without_artifacts}}"
```

## Step 4: Collect Epic-Level Artifacts

```
# Hardening reports
hardening_files = Glob("{{sprint_artifacts}}/hardening/epic-{{epic_num}}-*")
FOR EACH file IN hardening_files:
  epic_artifacts["hardening"][basename] = Read(file)

# Session reports (may span the epic's build sessions)
session_reports = Glob("{{sprint_artifacts}}/session-reports/session-*.md")
# Filter to sessions that reference stories from this epic
FOR EACH report IN session_reports:
  IF report contains any story_key from this epic:
    epic_artifacts["sessions"][basename] = Read(report)
```

## Step 5: Load Context Documents

```
# Previous retrospective (for continuity analysis)
prev_retro_files = Glob("{{implementation_artifacts}}/epic-*-retro-*.md")
IF prev_retro_files not empty:
  # Find the most recent one (by filename date or modification time)
  prev_retro = Read(most_recent)
  Set {{has_previous_retro}} = true
ELSE:
  Set {{has_previous_retro}} = false

# Current epic definition (from planning artifacts)
# Try sharded first, then whole document
epic_definition = Read("{{planning_artifacts}}/epics/epic-{{epic_num}}.md")
  OR Read("{{planning_artifacts}}/epics.md") and extract Epic {{epic_num}} section

# Next epic definition (if exists, for readiness assessment)
next_epic_num = {{epic_num}} + 1
next_epic = Read("{{planning_artifacts}}/epics/epic-{{next_epic_num}}.md")
  OR extract from epics.md
Set {{has_next_epic}} = (next_epic found)

# Playbook index (current state of learnings)
playbook_index = Read("docs/implementation-playbooks/_index.json") or empty

# CLAUDE.md (for checking what rules already exist)
claude_md = Read("CLAUDE.md") if exists, else empty
```

## Step 6: Handoff Summary

Display what was collected and transition to Phase 2.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GATHER COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Epic: {{epic_num}} ({{epic_title}})
Stories: {{total_stories}} ({{done_stories}} done)
Artifacts collected: {{total_artifact_count}}
Previous retro: {{has_previous_retro ? "Yes" : "First retrospective"}}
Next epic: {{has_next_epic ? "Epic " + next_epic_num + " exists" : "Not defined"}}

Proceeding to ANALYZE...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**CRITICAL:** All artifact content collected in this phase must be passed to Clio
in Phase 2. The orchestrator inlines artifact content into the Clio prompt — Clio
does NOT re-read files from disk (saves tool calls and ensures consistent snapshot).
