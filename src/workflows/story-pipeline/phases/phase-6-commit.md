# Phase 6: COMMIT (6/7)
<!-- Part of Story Pipeline v7.3 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PHASE 6: COMMIT (6/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reconcile story, update status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Orchestrator does this directly. No agent spawn.**

### 6.1 Load completion artifacts

Read all artifacts from `docs/sprint-artifacts/completions/{{story_key}}-*.json`

### 6.2 Check off completed tasks using Argus evidence

For each task in `argus.task_verification`:
- If `implemented: true` with evidence:
  - Use Edit tool: `"- [ ] {{task}}"` → `"- [x] {{task}}"`

### 6.3 Fill Dev Agent Record

```text
**Dev Agent Record**
**Implementation Date:** {{timestamp}}
**Agent Model:** Claude (Greek Pantheon Pipeline v6.1)
**Git Commit:** {{GIT_IMPLEMENTATION_COMMIT}}

**Pipeline Phases:**
- Phase 1 PREPARE: {{playbooks_loaded}} playbooks loaded
- Phase 2 BUILD: Metis implemented
- Phase 3 VERIFY: {{AGENT_COUNT}} agents in parallel
- Phase 4 ASSESS: Themis triaged ({{upheld}}/{{original}} upheld)
- Phase 5 REFINE: {{iterations}} iterations, {{fixes}} fixes
- Phase 6 COMMIT: Reconciled
- Phase 7 REFLECT: Pending

**Files:** {{files_created + files_modified}}
**Tests:** {{passing}}/{{total}} ({{coverage}}%)
```

### 6.4 Update sprint-status.yaml

```bash
# Edit: "{{story_key}}: ready-for-dev" → "{{story_key}}: done"
```

### 6.5 Commit reconciliation

```bash
git add docs/sprint-artifacts/{{story_key}}.md
git add docs/sprint-artifacts/sprint-status.yaml
git add docs/sprint-artifacts/completions/

git commit -m "$(cat <<'EOF'
chore({{story_key}}): reconcile story completion

- Check off completed tasks with code citations
- Fill Dev Agent Record with pipeline results
- Update sprint-status to done
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
    "COMMIT": { "status": "complete", "details": "Committed: {{git_commit}}" },
    "REFLECT": { "status": "in_progress" }
  },
  "metrics": {
    "git_commit": "{{git_commit}}",
    "tasks_completed": {{checked_tasks}}
  }
}
```

**📢 Orchestrator says:**
> "Story reconciled and committed! One last step - **Hermes** will review what happened, update playbooks, and generate the completion report."
