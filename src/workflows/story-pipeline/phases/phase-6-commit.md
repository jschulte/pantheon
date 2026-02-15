# Phase 6: COMMIT (6/7)
<!-- Part of Story Pipeline v1.1 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PHASE 6: COMMIT (6/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Eunomia reconciles → Hard gate validates → Commit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 6.1 Load completion artifacts

Read all artifacts from `{{sprint_artifacts}}/completions/{{story_key}}-*.json`

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
pct = tasks_checked / tasks_total

# ── Gate 1: Zero tasks checked → HALT ──────────────────────────
IF tasks_checked == 0:
  → ❌ RECONCILIATION FAILED: Zero tasks checked out of {{tasks_total}}.
  → DO NOT commit. DO NOT update sprint-status.yaml.
  → Escalate: "Eunomia found zero implementation evidence."
  → HALT pipeline for this story.

# ── Gate 2: Less than 80% checked → REJECT as incomplete ───────
# CRITICAL: This gate prevents stories from being marked "done" or "review"
# when the builder only partially completed the work. The builder likely
# ran out of context on a large story. Status MUST reflect actual completion.
IF pct < 0.80:
  → ⚠️ INCOMPLETE: Only {{pct*100}}% of tasks reconciled ({{tasks_checked}}/{{tasks_total}}).
  → Sprint-status = "in-progress" (NOT "done", NOT "review")
  → DO NOT ask user to override — this is arithmetic, not judgment.
  → Log: "Story {{story_key}} is {{pct*100}}% complete. {{tasks_unchecked}} tasks
    remain unchecked. The builder addressed {{tasks_checked}} of {{tasks_total}} tasks.
    Story marked in-progress for further work."
  → Continue to 6.4 with status = "in-progress".
  → In batch/swarm mode: report PARTIAL to team lead (not SUCCESS).

# ── Gate 3: Dev Record not filled → WARN ──────────────────────
IF dev_record_filled == false:
  → ⚠️ WARNING: Dev Agent Record not filled by Eunomia.
  → Orchestrator fills it manually as fallback (see step-4.5 for template).
```

### 6.4 Update sprint-status.yaml

**Status is DERIVED from task counts. No agent may override this arithmetic.**

| Condition | Status | Notes |
|-----------|--------|-------|
| 95%+ tasks checked + Dev Record filled | `done` | Fully complete |
| 80-94% tasks checked | `review` | Nearly complete, needs final pass |
| <80% tasks checked | `in-progress` | Builder incomplete — needs more work |
| 0 tasks checked | blocked by hard gate | Pipeline halted |

**NEVER mark a story "done" if task completion is below 95%.** This is non-negotiable.
The previous approach of marking stories "done" because "the core objective was met" while
leaving 60-90% of tasks unchecked was fraudulent — it hid incomplete work from tracking.

```bash
# Edit: "{{story_key}}: ready-for-dev" → "{{story_key}}: {{status}}"
```

### 6.5 Commit reconciliation

```bash
git add {{sprint_artifacts}}/{{story_key}}.md
git add {{sprint_artifacts}}/sprint-status.yaml
git add {{sprint_artifacts}}/completions/

git commit -m "$(cat <<'EOF'
chore({{story_key}}): reconcile story completion

- Eunomia checked off {{tasks_checked}}/{{tasks_total}} tasks with evidence
- Dev Agent Record filled with pipeline metrics
- Update sprint-status to {{status}}
EOF
)"
```

### Update Progress

Update `{{sprint_artifacts}}/completions/{{story_key}}-progress.json`:
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
