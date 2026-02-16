# Phase 2: REVIEW (2/6)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔬 PHASE 2: REVIEW (2/6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Multi-perspective review
Mode: {{SWARM or SEQUENTIAL}}
{{IF FOCUS_ENABLED}}Focus: {{FOCUS_PROMPT}}{{ENDIF}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Mode Selection

```
IF swarm_config.enabled AND swarm mode available:
  → Use SWARM MODE (parallel review workers)
ELSE:
  → Use SEQUENTIAL MODE (single deep reviewer — fallback)
```

---

### SWARM MODE: Single-Team Strategy with Dependency Gating

**Pre-flight:** Pre-approve permissions in Claude Code settings before starting. Workers
operate autonomously. Use `Shift+Tab` delegate mode for the lead session.

**Step 1: Create ONE team for the entire workflow**

Create a single team at the start. All worker types (reviewers, fixers, verifiers) join
this team. Phase ordering is enforced via task dependencies (`blockedBy`), not separate teams.

```
Teammate.spawnTeam("review-{{scope_id}}")

# --- REVIEW TASKS (Phase 2) - no dependencies, run immediately ---

FOR EACH perspective IN [security, correctness, architecture, test_quality]:
  TaskCreate(
    subject="Review: {{perspective}}",
    description=`
      phase: REVIEW
      perspective: {{perspective}}
      scope_id: {{scope_id}}
      scoped_files: {{all_files}}
      {{IF FOCUS_ENABLED}}focus: {{FOCUS_PROMPT}}{{ENDIF}}
    `
  )
  # Store task IDs as REVIEW_TASK_IDS

IF has_frontend_files:
  TaskCreate(subject="Review: accessibility", description="...")
  # Add to REVIEW_TASK_IDS

FOR EACH spec IN FORGED_SPECS.forged_specialists:
  TaskCreate(
    subject="Review: {{spec.id}} ({{spec.name}})",
    description=`
      phase: REVIEW
      perspective: {{spec.id}}
      scope_id: {{scope_id}}
      scoped_files: {{all_files}}
      forged_spec: {{JSON.stringify(spec)}}
    `
  )
  # Add to REVIEW_TASK_IDS

# --- FIX TASKS (Phase 4) - blocked until ALL reviews + triage complete ---
# These are created now but won't be claimable until dependencies resolve.
# Actual issue content is populated after triage (Phase 3).

FOR EACH category IN [frontend, backend, database]:
  fix_task = TaskCreate(
    subject="Fix: {{category}} (pending triage)",
    description=`
      phase: FIX
      category: {{category}}
      scope_id: {{scope_id}}
      # Issues will be populated after ASSESS phase
    `
  )
  TaskUpdate(taskId=fix_task.id, addBlockedBy=REVIEW_TASK_IDS + [TRIAGE_TASK_ID])
  # Store as FIX_TASK_IDS

# --- VERIFY TASKS (Phase 5) - blocked until ALL fixes complete ---

FOR EACH category IN [frontend, backend, database]:
  verify_task = TaskCreate(
    subject="Verify: {{category}} (pending fixes)",
    description=`
      phase: VERIFY
      category: {{category}}
      scope_id: {{scope_id}}
    `
  )
  TaskUpdate(taskId=verify_task.id, addBlockedBy=FIX_TASK_IDS)
```

**Step 2: Spawn all workers upfront**

```
# Spawn review workers (Dike) — they'll claim review tasks immediately
worker_count = min(total_perspectives, swarm_config.review_workers.max_workers)

Task(subagent_type="general-purpose", team_name="review-{{scope_id}}", name="dike-1",
     model="opus", prompt="[INLINE: review-worker.md] Claim and review.", run_in_background=True)
Task(subagent_type="general-purpose", team_name="review-{{scope_id}}", name="dike-2",
     model="opus", prompt="[INLINE: review-worker.md] Claim and review.", run_in_background=True)
Task(subagent_type="general-purpose", team_name="review-{{scope_id}}", name="dike-3",
     model="opus", prompt="[INLINE: review-worker.md] Claim and review.", run_in_background=True)

# Spawn fixer workers (Asclepius) — they'll idle until fix tasks unblock
Task(subagent_type="general-purpose", team_name="review-{{scope_id}}", name="asclepius-frontend",
     model="opus", prompt="[INLINE: fixer-worker.md] Claim and fix.", run_in_background=True)
Task(subagent_type="general-purpose", team_name="review-{{scope_id}}", name="asclepius-backend",
     model="opus", prompt="[INLINE: fixer-worker.md] Claim and fix.", run_in_background=True)

# Spawn verification workers (Aletheia) — they'll idle until verify tasks unblock
Task(subagent_type="general-purpose", team_name="review-{{scope_id}}", name="aletheia-1",
     model="opus", prompt="[INLINE: verification-worker.md] Claim and verify.", run_in_background=True)
Task(subagent_type="general-purpose", team_name="review-{{scope_id}}", name="aletheia-2",
     model="opus", prompt="[INLINE: verification-worker.md] Claim and verify.", run_in_background=True)
```

Workers idle until their tasks unblock — this is correct behavior. Review workers start
immediately. Fixer workers wait for reviews + triage. Verifier workers wait for fixes.

**Step 3: Wait for review workers to complete**

Workers self-schedule from the shared task list. Each claims one perspective, reviews all scoped files from that angle, saves findings, and claims the next available perspective.

Idle notifications arrive automatically as workers finish.

**Step 4: Collect all findings**

```
all_findings = []
FOR EACH perspective_artifact IN {{sprint_artifacts}}/reviews/{{scope_id}}-*.json:
  all_findings.extend(artifact.issues)
```

---

### SEQUENTIAL MODE: Single Deep Reviewer (Fallback)

When swarm mode is unavailable, fall back to single deep reviewer (identical to v1.0):

```
Task({
  subagent_type: "architect-reviewer",
  model: "opus",
  description: "🔬 Deep review of {{scope_id}}",
  prompt: `
[INLINE: deep-reviewer.md persona]

<scope>{{List all files to review}}</scope>

{{IF FOCUS_ENABLED}}
<special_focus>
**USER-REQUESTED FOCUS:** {{FOCUS_PROMPT}}
</special_focus>
{{ENDIF}}

{{IF FORGED_SPECS.forged_specialists.length > 0}}
<additional_perspectives>
In addition to standard perspectives, also review from these domain-specific angles:
{{FOR EACH spec IN FORGED_SPECS.forged_specialists:}}
## {{spec.name}} ({{spec.emoji}}) — {{spec.title}}
Focus: {{spec.review_focus}}
Checklist: {{spec.technology_checklist}}
Gotchas: {{spec.known_gotchas}}
{{END}}
</additional_perspectives>
{{ENDIF}}

Save to: {{sprint_artifacts}}/hardening/{{scope_id}}-review.json
`
})
```

---

**Orchestrator says:**
> "Review complete. **{{total_issues}} issues** found across {{perspective_count}} perspectives. Sending to Themis for triage..."
