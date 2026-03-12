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

### 6.1.5 User Git Scope Selection

Before reconciliation and commit, ask the user what git workflow they want:

```
AskUserQuestion({
  question: "Story {{story_key}} is ready to commit ({{tasks_checked}}/{{tasks_total}} tasks).
             What git workflow would you like?",
  options: [
    {
      label: "Full PR workflow (branch → commit → push → PR → merge) (Recommended)",
      description: "Creates a branch, commits, pushes, opens a PR with pipeline stats"
    },
    {
      label: "Commit only (branch + commit, no push/PR)",
      description: "Creates a branch and commits locally — you push when ready"
    },
    {
      label: "Stage only (branch + stage, no commit)",
      description: "Creates a branch and stages files — you review and commit"
    },
    {
      label: "Skip git (output summary only)",
      description: "No git operations — just output the prepared data and proceed to REFLECT"
    }
  ]
})

GIT_SCOPE = user_selection  # "full-pr" | "commit-only" | "stage-only" | "skip"

IF GIT_SCOPE == "skip":
  → Output prepared data summary (files, stats, review results)
  → Skip Eunomia reconciliation and Charon
  → Proceed directly to Phase 7 REFLECT
```

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

### 6.5 Spawn Charon (Commit Agent)

**Charon handles all git operations.** The orchestrator does NOT do git work directly.

```
IF GIT_SCOPE != "skip":
  Task({
    subagent_type: "general-purpose",
    model: "haiku",  # Git operations are mechanical — haiku is sufficient
    description: "⛵ Charon committing {{story_key}} ({{GIT_SCOPE}})",
    prompt: `
Read your full instructions from:
  {{project_root}}/_bmad/pantheon/agents/support/committer.md

Then execute with this data:

- git_scope: {{GIT_SCOPE}}
- files_to_commit: {{all_files_from_builder_and_test_artifacts}}
- commit_message: "feat({{story_key}}): {{story_title}}"
- story_key: {{story_key}}
- pipeline_stats:
    iterations: {{iterations}}
    files_changed: {{files_changed}}
    tests_added: {{tests_added}}
    coverage: {{coverage}}%
    agents_used: {{agent_count}}
- review_summary:
    must_fix_resolved: {{must_fix_resolved}}
    should_fix_deferred: {{should_fix_deferred}}
- security_verdict: {{security_gate_status}}

Also commit the reconciliation changes:
- {{sprint_artifacts}}/{{story_key}}.md
- {{implementation_artifacts}}/sprint-status.yaml
- {{sprint_artifacts}}/completions/
`
  })
```

### 6.5.5 Tracker Sync (Push)

> Push reconciliation results to external tracker after commit.

Check `tracker.provider` from config.yaml:
- If `none` or not configured → skip this section entirely (zero overhead)
Check session flag `tracker_available`:
- If `false` → skip (user chose to disable sync this session)
- If not yet set → probe MCP now; on failure present prompt:
  [R] Retry  [S] Skip this operation  [D] Disable for session  [H] Halt workflow
  (Only [D] sets `tracker_available = false`)
- If `true` → proceed:

**Branch-aware push guard:**
`git rev-parse --abbrev-ref HEAD`
- On `{tracker.main_branch}` → all statuses allowed
- On feature branch → only In-Progress, Completed, Accepted
- Restricted status → log "⚠️ Skipped: {status} push restricted to {main_branch} (current: {branch})", continue workflow

1. Load `{{sprint_artifacts}}/.tracker-mapping.yaml`
2. Look up `{{story_key}}` in the stories section
3. If mapped:
   - Map the BMAD status (from sprint-status.yaml update in 6.4) to tracker status using `tracker.status_mapping`
   - Call `updateRallyStory` (or provider equivalent) with:
     - `objectId`: story's tracker_id
     - `scheduleState`: mapped status
     - `addComment`: "BMAD sync: {{tasks_checked}}/{{tasks_total}} tasks reconciled ({{pct}}%). Status: {{status}}"
   - Update mapping entry `last_synced`, `local_status`, and `tracker_status`
   - Report: "📡 Pushed to tracker: {story_key} → {tracker_status}"
4. If not mapped → skip

Reference: `_bmad/pantheon/workflows/rally-sync/data/tracker-operations.md` → "Embedded Push"

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
