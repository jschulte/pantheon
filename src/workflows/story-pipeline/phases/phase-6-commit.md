# Phase 6: COMMIT (6/7)
<!-- Part of Story Pipeline v7.3.2 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PHASE 6: COMMIT (6/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Eunomia reconciles → Hard gate validates → Commit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 6.1 Load completion artifacts

Read all artifacts from `docs/sprint-artifacts/completions/{{story_key}}-*.json`

### 6.2 Spawn Eunomia reconciliation agent

**Eunomia** 📋 is a dedicated reconciliation agent that checks off tasks with evidence
and fills the Dev Agent Record. This replaces inline orchestrator reconciliation —
the orchestrator was skipping these tedious Edit operations.

```
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "📋 Eunomia reconciling {{story_key}}",
  prompt: `
You are Eunomia, the Reconciliation Agent.

Read your full instructions from:
  {{project_root}}/_bmad/pantheon/workflows/story-pipeline/agents/reconciler.md

Then execute reconciliation for this story:

- story_key: {{story_key}}
- story_file: docs/sprint-artifacts/{{story_key}}.md
- artifacts_dir: docs/sprint-artifacts/completions/
- current_date: {{date}}

Available artifacts:
{{list of completion artifact files found in 6.1}}

Recent git commits for this story:
{{git log --oneline -5 | grep story_key}}

IMPORTANT: You MUST output the reconciler JSON artifact as your final output
and save it to: docs/sprint-artifacts/completions/{{story_key}}-reconciler.json
`
})
```

### 6.3 HARD VALIDATION GATE

After Eunomia returns, read the reconciler artifact and validate:

```
reconciler = Read("docs/sprint-artifacts/completions/{{story_key}}-reconciler.json")

tasks_checked = reconciler.tasks_checked
tasks_total = reconciler.tasks_total
tasks_unchecked = reconciler.tasks_unchecked
dev_record_filled = reconciler.dev_record_filled

# ── Gate 1: Zero tasks checked → HALT ──────────────────────────
IF tasks_checked == 0:
  → ❌ RECONCILIATION FAILED: Zero tasks checked out of {{tasks_total}}.
  → DO NOT commit.
  → DO NOT update sprint-status.yaml.
  → Escalate to user: "Eunomia found zero implementation evidence.
    Either the pipeline produced no artifacts or all tasks are unverifiable.
    Please investigate before marking this story done."
  → HALT pipeline for this story.

# ── Gate 2: Less than 50% checked → WARN + confirm ─────────────
IF tasks_checked / tasks_total < 0.5:
  → ⚠️ WARNING: Only {{pct}}% of tasks reconciled ({{tasks_checked}}/{{tasks_total}}).
  → Ask user: "Only {{tasks_checked}} of {{tasks_total}} tasks have evidence.
    Continue with partial reconciliation, or investigate?"
  → Options: "Continue (mark as review)" | "Investigate (halt)"
  → If user says investigate → HALT.

# ── Gate 3: Dev Record not filled → WARN ──────────────────────
IF dev_record_filled == false:
  → ⚠️ WARNING: Dev Agent Record not filled by Eunomia.
  → Orchestrator fills it manually as fallback (see step-4.5 for template).
```

### 6.4 Update sprint-status.yaml

Use the status decision logic from `step-4.5-reconcile-story-status.md`:

| Condition | Status |
|-----------|--------|
| 95%+ tasks checked + Dev Record filled | `done` |
| 80-94% tasks checked | `review` |
| 50-79% tasks checked (user continued) | `in-progress` |
| <50% tasks checked | blocked by hard gate |

```bash
# Edit: "{{story_key}}: ready-for-dev" → "{{story_key}}: {{status}}"
```

### 6.5 Commit reconciliation

```bash
git add docs/sprint-artifacts/{{story_key}}.md
git add docs/sprint-artifacts/sprint-status.yaml
git add docs/sprint-artifacts/completions/

git commit -m "$(cat <<'EOF'
chore({{story_key}}): reconcile story completion

- Eunomia checked off {{tasks_checked}}/{{tasks_total}} tasks with evidence
- Dev Agent Record filled with pipeline metrics
- Update sprint-status to {{status}}
EOF
)"
```

### Update Progress

Update `docs/sprint-artifacts/completions/{{story_key}}-progress.json`:
```json
{
  "current_phase": "REFLECT",
  "phases": {
    ...
    "COMMIT": { "status": "complete", "details": "Eunomia: {{tasks_checked}}/{{tasks_total}} tasks, committed: {{git_commit}}" },
    "REFLECT": { "status": "in_progress" }
  },
  "metrics": {
    "git_commit": "{{git_commit}}",
    "tasks_completed": {{tasks_checked}},
    "tasks_total": {{tasks_total}},
    "reconciler_agent": "eunomia"
  }
}
```

**📢 Orchestrator says:**
> "Eunomia reconciled {{tasks_checked}}/{{tasks_total}} tasks. Story committed! One last step - **Hermes** will review what happened, update playbooks, and generate the completion report."
