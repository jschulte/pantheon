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
| CODE_HEALTH | {{code_health}} |
| Fixed | {{fixed}} |
| Verified | {{verified}} |
| SHOULD_FIX Attempted | {{sf_attempted}} |
| SHOULD_FIX Fixed     | {{sf_fixed}} |
| SHOULD_FIX Deferred  | {{sf_deferred}} |
| New Findings         | {{new_findings}} |
| Known (seen again)   | {{known_findings}} |
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

## SHOULD_FIX Results

| Status | Count |
|--------|-------|
| Attempted | {{sf_attempted}} |
| Fixed | {{sf_fixed}} |
| Deferred | {{sf_deferred}} |

### Fixed SHOULD_FIX Items
{{For each fixed SHOULD_FIX item, brief summary}}

### Deferred Items (Tracked)

{{IF tracking_method == "tracked_issues_file"}}
{{sf_deferred}} deferred items tracked to `tracked-issues.json` ({{new_findings}} new, {{known_findings}} seen again)
{{FOR EACH deferred_item}}
- **{{title}}** — `{{file}}:{{line}}` — {{reason_deferred}} ({{IF known}}seen {{seen_count}}x{{ELSE}}new{{ENDIF}})
{{END FOR}}
{{ELIF tracking_method == "github_issues"}}
{{sf_deferred}} deferred items tracked ({{new_findings}} new issues, {{known_findings}} deduplicated)
{{FOR EACH deferred_item}}
- **{{title}}** — `{{file}}:{{line}}` — {{reason_deferred}} ([#{{issue_number}}]({{issue_url}}))
{{END FOR}}
{{ELIF tracking_method == "local_file"}}
{{sf_deferred}} items appended to {{local_file_path}}
{{END IF}}

## CODE_HEALTH Observations

{{IF code_health > 0}}
Structural and design observations tracked for future planning.
These are not bugs — they represent accumulated design debt that benefits from planned remediation.

| Pattern Type | Count | Description |
|-------------|-------|-------------|
| DRY violations | {{n}} | Duplicated logic across multiple locations |
| God classes | {{n}} | Files/classes with too many responsibilities |
| Inconsistent patterns | {{n}} | Different approaches to the same problem |
| Coupling issues | {{n}} | Tight coupling between independent modules |
| Other | {{n}} | Layer violations, naming inconsistencies, etc. |

{{FOR EACH code_health_item}}
- **{{title}}** — `{{locations}}` — {{pattern_type}} ({{IF known}}seen {{seen_count}}x{{ELSE}}new{{ENDIF}})
{{END FOR}}
{{ELSE}}
No CODE_HEALTH observations in this pass.
{{ENDIF}}

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

### 6.1.5 Track Deferred Issues

For SHOULD_FIX items that were not fixed (deferred) and all CODE_HEALTH items, create tracking artifacts.

**Read config:** Load `deferred_issues.tracking_method` from config.yaml.

**IF tracking_method == "tracked_issues_file" (default):**

> **Dedup key:** `{type}::{file_path}` — e.g. `should-fix::src/auth/handler.ts`
> File paths are the one stable thing the LLM produces (it reads the actual codebase).
> On duplicate: bump `seen_count`, append to `sightings[]`, update `last_seen`.

```
# ── Read or init tracked-issues.json ──
TRACKED_FILE="{{sprint_artifacts}}/tracked-issues.json"

IF file_exists(TRACKED_FILE):
  tracked = JSON.parse(read(TRACKED_FILE))
ELSE:
  tracked = { "version": 1, "last_updated": null, "issues": [] }

# ── Build lookup map ──
issue_map = {}
FOR EACH entry IN tracked.issues:
  issue_map[entry.id] = entry

# ── Counters ──
NEW_FINDINGS=0
KNOWN_FINDINGS=0

# ── Upsert deferred SHOULD_FIX items ──
FOR EACH deferred SHOULD_FIX item:
  KEY = "should-fix::{{file}}"
  sighting = {
    "date": "{{today}}",
    "source": "batch-review pass #{{pass_number}} on {{scope_id}}",
    "title": "{{issue_title}}"
  }

  IF KEY in issue_map:
    # Existing — bump counters
    issue_map[KEY].seen_count += 1
    issue_map[KEY].last_seen = "{{today}}"
    issue_map[KEY].sightings.append(sighting)
    KNOWN_FINDINGS++
  ELSE:
    # New entry
    issue_map[KEY] = {
      "id": KEY,
      "type": "should-fix",
      "file": "{{file}}",
      "line": {{line}},
      "locations": null,
      "perspective": "{{perspective}}",
      "severity": "{{severity}}",
      "description": "{{issue_description}}",
      "suggested_fix": "{{suggested_fix}}",
      "reason_deferred": "{{reason_deferred}}",
      "effort_estimate": "{{effort_estimate}}",
      "pattern_type": null,
      "source_workflow": "batch-review",
      "source_scope": "{{scope_id}}",
      "first_seen": "{{today}}",
      "last_seen": "{{today}}",
      "seen_count": 1,
      "sightings": [sighting],
      "status": "open"
    }
    NEW_FINDINGS++

# ── Upsert CODE_HEALTH items ──
FOR EACH CODE_HEALTH item:
  PRIMARY_FILE = first_location_file("{{locations}}")
  KEY = "code-health::${PRIMARY_FILE}"
  sighting = {
    "date": "{{today}}",
    "source": "batch-review pass #{{pass_number}} on {{scope_id}}",
    "title": "{{issue_title}}"
  }

  IF KEY in issue_map:
    issue_map[KEY].seen_count += 1
    issue_map[KEY].last_seen = "{{today}}"
    issue_map[KEY].sightings.append(sighting)
    KNOWN_FINDINGS++
  ELSE:
    issue_map[KEY] = {
      "id": KEY,
      "type": "code-health",
      "file": "${PRIMARY_FILE}",
      "line": null,
      "locations": "{{locations}}",
      "perspective": "{{perspective}}",
      "severity": "{{severity}}",
      "description": "{{issue_description}}",
      "suggested_fix": null,
      "reason_deferred": null,
      "effort_estimate": "{{effort_estimate}}",
      "pattern_type": "{{pattern_type}}",
      "source_workflow": "batch-review",
      "source_scope": "{{scope_id}}",
      "first_seen": "{{today}}",
      "last_seen": "{{today}}",
      "seen_count": 1,
      "sightings": [sighting],
      "status": "open"
    }
    NEW_FINDINGS++

# ── Write back ──
tracked.last_updated = "{{ISO timestamp}}"
tracked.issues = Object.values(issue_map)
write(TRACKED_FILE, JSON.stringify(tracked, null, 2))

echo "Tracked issues: ${NEW_FINDINGS} new, ${KNOWN_FINDINGS} seen again (total ${tracked.issues.length} in index)"
```

**ELIF tracking_method == "github_issues":**

```
# Simple gh issue create per item — no dedup (use tracked_issues_file for dedup)
NEW_FINDINGS=0

FOR EACH deferred SHOULD_FIX item:
  gh issue create \
    --title "[Tech Debt] {{issue_title}}" \
    --body "Found during batch-review pass #{{pass_number}} on scope \`{{scope_id}}\`. File: \`{{file}}:{{line}}\`. Perspective: {{perspective}}. Severity: {{severity}}. Why deferred: {{reason_deferred}} ({{effort_estimate}})." \
    --label "tech-debt" --label "should-fix"
  NEW_FINDINGS++

FOR EACH CODE_HEALTH item:
  gh issue create \
    --title "[Code Health] {{issue_title}}" \
    --body "Found during batch-review pass #{{pass_number}} on scope \`{{scope_id}}\`. Locations: {{locations}}. Pattern: {{pattern_type}}." \
    --label "tech-debt" --label "code-health"
  NEW_FINDINGS++

KNOWN_FINDINGS=0
echo "GitHub Issues: ${NEW_FINDINGS} created"
```

**ELIF tracking_method == "local_file":**

Append to `{{project_root}}/KNOWN_ISSUES.md`:
```markdown
## [{{date}}] Batch-Review Pass #{{pass_number}} — {{scope_id}}

| Issue | File | Severity | Why Deferred | Effort |
|-------|------|----------|-------------|--------|
| {{title}} | `{{file}}:{{line}}` | {{severity}} | {{reason}} | {{est}} |
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
