# Step 8: Generate Outputs (8/8)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 8: GENERATE OUTPUTS (8/8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Writing execution plan...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 8.1 Generate team-execution-plan.md

Use the template at `templates/team-execution-plan-template.md` to generate the output document.

Fill all template placeholders with computed values:
- `{{project_name}}` - from project context
- `{{generated_date}}` - current date
- `{{team_size}}` - number of developers
- `{{total_epics}}` / `{{total_stories}}` - inventory counts
- `{{mode}}` - "Initial Planning" or "Rebalance"
- `{{rebalance_summary}}` - if rebalance mode
- Developer table, dependency graph, phases, work streams, checkpoints, risk zones

```
Read template from: templates/team-execution-plan-template.md
Fill placeholders with computed data
Write to: docs/team-execution-plan.md
```

### 8.2 Enrich Sprint Status (Optional)

```
IF exists("{{sprint_artifacts}}/sprint-status.yaml"):
  # Add team_assignments section
  Append to sprint-status.yaml:

  team_assignments:
    generated: {{timestamp}}
    team_size: {{TEAM_SIZE}}
    developers:
      - name: {{dev_1_name}}
        specialization: {{dev_1_spec}}
        stream: {{dev_1_stream_name}}
        stories: [story_keys]
      - name: {{dev_2_name}}
        ...
    phases:
      - phase: 0
        name: Foundation
        stories: [story_keys]
        status: pending
      - phase: 1
        name: Fan-out
        stories: [story_keys]
        status: pending
      ...
```

### 8.3 Display Final Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PLAN COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Team: {{TEAM_SIZE}} developers
  Epics: {{TOTAL_EPICS}} ({{TOTAL_STORIES}} stories)
  {{IF REBALANCE_MODE}}
  Remaining: {{REMAINING_STORIES.count}} stories
  {{ENDIF}}
  Phases: {{PHASES.count}}
  Checkpoints: {{CHECKPOINTS.count}}
  Risk Zones: {{RISK_ZONES.count}}

  Output:
    docs/team-execution-plan.md
    {{IF sprint_status_enriched}}
    {{sprint_artifacts}}/sprint-status.yaml (enriched)
    {{ENDIF}}

  Next Steps:
    1. Share team-execution-plan.md with the team
    2. Each developer reviews their work stream
    3. Foundation developers start Phase 0
    4. Run /batch-stories when ready to implement

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
