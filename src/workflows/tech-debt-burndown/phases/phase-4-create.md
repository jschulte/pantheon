# Phase 4: CREATE (4/4)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚒️ PHASE 4: CREATE (4/4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Daedalus generating story files
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.1 Generate Story Files

```
FOR EACH proposal IN approved_proposals:
  Task({
    subagent_type: "general-purpose",
    model: "opus",
    description: "⚒️ Daedalus creating story: {{proposal.title}}",
    prompt: `
  You are DAEDALUS ⚒️ — the Master Craftsman. Your job is to build a complete,
  well-structured BMAD story file from this approved burndown proposal.

  <proposal>
  {{JSON.stringify(proposal)}}
  </proposal>

  <source_issues>
  {{For each issue number in proposal.issues, include the full issue body}}
  </source_issues>

  **Generate a BMAD story file (6-12KB) with these sections:**

  # Story: {{proposal.title}}

  ## Story
  As a developer maintaining this codebase, I want to {{root_cause_fix}}
  so that {{benefit}}.

  ## Status: ready-for-dev

  ## Background
  ### Current State
  {{Describe the current problematic state, citing specific files and patterns}}

  ### Target State
  {{Describe what the code should look like after this story is complete}}

  ## Acceptance Criteria
  {{Given/When/Then format for each verifiable outcome}}

  - Given {{precondition}}
    When {{action}}
    Then {{expected result}}

  ## Tasks
  - [ ] {{task 1 — specific, actionable, with file references}}
  - [ ] {{task 2}}
  - [ ] {{task N}}
  - [ ] Verify all source issues are addressed
  - [ ] Run full test suite and confirm no regressions

  ## Dev Notes
  ### Architecture Decisions
  {{Key decisions about approach, alternatives considered}}

  ### Files to Touch
  {{List of files that will need modification}}

  ### Constraints
  {{Any constraints or gotchas}}

  ### Testing Strategy
  {{How to verify this work — unit tests, integration tests, manual checks}}

  ## References
  ### Source Issues
  {{For each source issue: - #{{number}} — {{title}} ({{url}})}}

  ### Related Stories
  {{Any related stories if known}}

  ---

  **Target size:** 6-12KB. Include enough detail for a developer to implement
  without additional context. Every task should be checkable.

  **Save to:** {{story_settings.output_dir}}/burndown-{{cluster_id}}.md
  `
  })
```

### 4.2 Mark Source Issues as Addressed

Update the status of source issues in the local tracked-issues index.

```
IF tracking_method == "tracked_issues_file":
  TRACKED_FILE="{{sprint_artifacts}}/tracked-issues.json"
  tracked = JSON.parse(read(TRACKED_FILE))

  FOR EACH proposal IN approved_proposals:
    FOR EACH issue_id IN proposal.issues:
      # Find entry by id in tracked.issues
      entry = tracked.issues.find(e => e.id == issue_id)
      IF entry:
        entry.status = "addressed"

  tracked.last_updated = "{{ISO timestamp}}"
  write(TRACKED_FILE, JSON.stringify(tracked, null, 2))
  echo "Marked {{addressed_count}} issues as 'addressed' in tracked-issues.json"

ELIF tracking_method == "github_issues":
  {{IF story_settings.link_source_issues}}
  FOR EACH proposal IN approved_proposals:
    FOR EACH issue_number IN proposal.issues:
      gh issue comment {{issue_number}} \
        --body "Addressed in burndown story: \`{{story_file_path}}\`

  This issue has been clustered with {{proposal.issues.length - 1}} related issues
  and a story has been created to address the root cause: **{{proposal.title}}**

  ---
  *Auto-commented by Pantheon tech-debt-burndown workflow*"
  {{ENDIF}}
```

### 4.2.5 Export to GitHub Issues (Optional)

If `story_settings.export_to_github` is true, bulk-create GitHub Issues from the local index.

```
IF story_settings.export_to_github AND tracking_method == "tracked_issues_file":
  TRACKED_FILE="{{sprint_artifacts}}/tracked-issues.json"
  tracked = JSON.parse(read(TRACKED_FILE))
  EXPORTED=0

  FOR EACH entry IN tracked.issues WHERE entry.status IN ["open", "addressed"]:
    LABEL = entry.type  # "should-fix" or "code-health"
    TITLE_PREFIX = IF entry.type == "code-health" THEN "[Code Health]" ELSE "[Tech Debt]"

    gh issue create \
      --title "${TITLE_PREFIX} ${entry.description}" \
      --body "$(cat <<EOF
## Source
Exported from local tracked-issues.json

**ID:** \`${entry.id}\`
**File:** \`${entry.file}:${entry.line || ""}\`
**Perspective:** ${entry.perspective}
**Severity:** ${entry.severity}
**First seen:** ${entry.first_seen} | **Last seen:** ${entry.last_seen} | **Seen:** ${entry.seen_count}x

## Description
${entry.description}

{{IF entry.suggested_fix}}
## Suggested Fix
${entry.suggested_fix}
{{ENDIF}}

{{IF entry.reason_deferred}}
## Why Deferred
${entry.reason_deferred} — Effort: ${entry.effort_estimate}
{{ENDIF}}

{{IF entry.sightings.length > 1}}
## Sightings (${entry.seen_count})
{{FOR EACH sighting IN entry.sightings}}
- ${sighting.date}: ${sighting.source} — "${sighting.title}"
{{END FOR}}
{{ENDIF}}

---
*Exported by Pantheon tech-debt-burndown workflow*
EOF
)" \
      --label "tech-debt" --label "${LABEL}"

    entry.status = "exported"
    EXPORTED++

  tracked.last_updated = "{{ISO timestamp}}"
  write(TRACKED_FILE, JSON.stringify(tracked, null, 2))
  echo "Exported ${EXPORTED} issues to GitHub"
```

### 4.3 Generate Burndown Summary

```
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 BURNDOWN COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Stories created: {{approved_proposals.length}}"
echo "Issues addressed: {{total_issues_in_approved}}"
echo ""
FOR EACH proposal IN approved_proposals:
  echo "  📝 {{proposal.title}}"
  echo "     File: {{story_file_path}}"
  echo "     Issues: {{proposal.issues | join ', #'}}"
  echo "     Effort: {{proposal.effort}}"
  echo ""
echo "Story files: {{story_settings.output_dir}}/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

### 4.4 Save Burndown Report

```json
Save to: {{sprint_artifacts}}/burndown/report.json

{
  "workflow": "tech-debt-burndown",
  "timestamp": "{{ISO timestamp}}",
  "scope": { "labels": [...], "epic": null, "since": null },
  "harvest": {
    "total_issues": N,
    "by_label": { "should-fix": N, "code-health": N }
  },
  "analysis": {
    "total_clusters": N,
    "by_pattern": { ... },
    "by_effort": { ... }
  },
  "proposals": {
    "total_reviewed": N,
    "approved": N,
    "skipped": N
  },
  "stories_created": [
    {
      "title": "Extract auth validation into shared middleware",
      "file": "burndown-cluster-1.md",
      "issues_addressed": [123, 145, 167, 189, 201],
      "effort": "medium",
      "pattern_type": "dry_violation"
    }
  ],
  "issues_commented": N,
  "recommendation": "Run /batch-stories to implement approved burndown stories"
}
```
