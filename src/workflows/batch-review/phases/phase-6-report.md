# Phase 6: REPORT (6/6)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PHASE 6: REPORT (6/6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generating hardening report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 6.1 Generate Report

```
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "📋 Generating hardening report",
  prompt: `
Generate a comprehensive hardening report.

<scope>
{{Scope from Phase 1}}
</scope>

<review_findings>
{{Findings from Phase 2}}
</review_findings>

<triage>
{{Triage from Phase 3}}
</triage>

<fixes>
{{Fixes from Phase 4}}
</fixes>

<verification>
{{Verification from Phase 5}}
</verification>

**Generate Report:**

# Hardening Report: {{scope_id}}

## Summary

| Metric | Value |
|--------|-------|
| Files Reviewed | {{total_files}} |
| Issues Found | {{total_issues}} |
| MUST_FIX | {{must_fix}} |
| Fixed | {{fixed}} |
| Verified | {{verified}} |
| Pass Status | {{CLEAN / ISSUES_REMAINING}} |

{{IF FOCUS_ENABLED}}
## Focus Area
**User Guidance:** {{FOCUS_PROMPT}}
**Focus-Related Issues:** {{focus_issues_count}}
{{ENDIF}}

## Issues by Perspective

| Perspective | Found | Fixed |
|-------------|-------|-------|
| Security 🔐 | N | N |
| Correctness ⚡ | N | N |
| Architecture 🏛️ | N | N |
| Test Quality 🧪 | N | N |
{{IF accessibility}}
| Accessibility 🌈 | N | N |
{{ENDIF}}

## Fixed Issues

{{For each fixed issue, brief summary}}

## Remaining Tech Debt (SHOULD_FIX)

{{List of SHOULD_FIX items for future}}

## Recommendations

{{Based on patterns seen, what should be done next}}

## Next Steps

{{IF CLEAN_PASS}}
✅ **Clean pass achieved.** Code is hardened for this scope.
Consider running again with a different focus to find other issue types.
{{ELSE}}
⚠️ **Issues remain.** Consider running \`/batch-review\` again.
Remaining issues logged to: {{sprint_artifacts}}/hardening/{{scope_id}}-remaining.json
{{ENDIF}}

---

Save to: {{sprint_artifacts}}/hardening/{{scope_id}}-report.md
`
})
```

### 6.2 Update History

Track passes for this scope:

```json
{
  "scope_id": "epic-17",
  "passes": [
    {
      "pass_number": 1,
      "timestamp": "2026-...",
      "issues_found": 15,
      "issues_fixed": 12,
      "focus": null
    },
    {
      "pass_number": 2,
      "timestamp": "2026-...",
      "issues_found": 5,
      "issues_fixed": 5,
      "focus": "security vulnerabilities"
    }
  ],
  "status": "hardened"  // or "in_progress"
}
```

### 6.3 Cleanup Swarm (if applicable)

```
IF swarm_config.enabled AND team was created:
  # Check for active teammates before cleanup
  active = TaskList() WHERE status == "in_progress"
  IF active.length > 0:
    # Wait for stragglers or send shutdown requests
    FOR EACH worker IN active_workers:
      SendMessage(type="request", subtype="shutdown", recipient=worker)
    # Wait briefly for shutdown confirmations

  # Cleanup the team (only ONE team exists per session)
  Teammate.cleanup()
```

> **Note:** Only one team can exist per session. If you need to re-run the workflow,
> ensure cleanup completes before creating a new team.

### 6.4 Display Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{✅ or ⚠️}} HARDENING COMPLETE: {{scope_id}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 This Pass:
   • Files Reviewed: {{total_files}}
   • Issues Found: {{total_issues}}
   • Issues Fixed: {{fixed}}
   {{IF FOCUS_ENABLED}}
   • Focus: "{{FOCUS_PROMPT}}"
   {{ENDIF}}

📈 Progress:
   • Pass #{{pass_number}}
   • Total Fixed (all passes): {{cumulative_fixed}}
   • Status: {{HARDENED / IN_PROGRESS}}

{{IF CLEAN_PASS}}
✅ Clean pass! No MUST_FIX issues remaining.
   Run again with different focus to find other issue types.
{{ELSE}}
⚠️ {{remaining}} issues logged as tech debt.
   Consider running again: /batch-review {{scope_input}}
{{ENDIF}}

📄 Full Report:
   {{sprint_artifacts}}/hardening/{{scope_id}}-report.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
