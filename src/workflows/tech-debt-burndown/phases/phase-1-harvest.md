# Phase 1: HARVEST (1/4)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛵ PHASE 1: HARVEST (1/4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Charon harvesting tracked issues
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.1 Fetch Issues

```
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "⛵ Charon harvesting tracked issues",
  prompt: `
You are CHARON ⛵ — the Ferryman. Your job is to ferry tracked issues into
structured data for analysis.

<scope>
Labels: {{scope.labels}}
Epic filter: {{scope.epic || "none"}}
Date filter: {{scope.since || "none"}}
State: {{scope.state}}
</scope>

<config>
tracking_method: {{deferred_issues.tracking_method}}
</config>

**Primary path: Read local tracked-issues.json**

IF tracking_method == "tracked_issues_file" (default):

  TRACKED_FILE="{{sprint_artifacts}}/tracked-issues.json"

  IF NOT file_exists(TRACKED_FILE):
    → Output: total_issues = 0, empty harvest
    → EXIT (gate check will handle)

  tracked = JSON.parse(read(TRACKED_FILE))

  **Step 1: Filter issues**

  Start with all entries where status == "open".

  {{IF scope.labels}}
  Filter to entries whose type matches one of: {{scope.labels}}
  (e.g., "should-fix" matches label "should-fix", "code-health" matches "code-health")
  {{ENDIF}}

  {{IF scope.epic}}
  Filter to entries whose source_scope mentions epic {{scope.epic}}.
  {{ENDIF}}

  {{IF scope.since}}
  Filter to entries where first_seen >= "{{scope.since}}".
  {{ENDIF}}

  **Step 2: Group issues**

  Group by:
  - File domain (e.g., "src/api/", "src/components/", "prisma/")
  - Type (should-fix vs code-health)
  - Perspective (security, correctness, architecture, etc.)
  - Age bucket based on first_seen (< 1 week, 1-4 weeks, > 4 weeks)

  **Step 3: Output**

  Save to: {{sprint_artifacts}}/burndown/harvest.json
  Data is already structured — no template parsing needed.

**Fallback: Fetch from GitHub Issues**

ELIF tracking_method == "github_issues":

  Run gh commands to fetch all matching issues:

  \`\`\`bash
  gh issue list --state open --label "tech-debt" --json number,title,body,labels,createdAt,url --limit 200
  gh issue list --state open --label "should-fix" --json number,title,body,labels,createdAt,url --limit 200
  gh issue list --state open --label "code-health" --json number,title,body,labels,createdAt,url --limit 200
  \`\`\`

  Deduplicate (issues may have multiple matching labels).

  {{IF scope.epic}}
  Filter to issues mentioning epic {{scope.epic}} in title or body.
  {{ENDIF}}

  {{IF scope.since}}
  Filter to issues created after {{scope.since}}.
  {{ENDIF}}

  Parse issue bodies to extract structured data (Pantheon tracking template):
  - Source workflow, source scope, file/line, perspective, severity
  - Suggested fix, reason deferred, pattern type, effort estimate

  Group by domain, label type, perspective, age bucket.

**Output format (same for both paths):**

\`\`\`json
{
  "harvester": "charon",
  "timestamp": "{{ISO timestamp}}",
  "source": "tracked_issues_file",
  "scope": { "labels": [...], "epic": null, "since": null },
  "total_issues": N,
  "issues": [
    {
      "id": "should-fix::src/api/users/route.ts",
      "title": "Missing input validation",
      "type": "should-fix",
      "file": "src/api/users/route.ts",
      "line": 45,
      "source_workflow": "batch-review",
      "source_scope": "epic-17",
      "perspective": "security",
      "severity": "medium",
      "suggested_fix": "Add Zod validation schema",
      "reason_deferred": "requires multi-file refactor",
      "pattern_type": null,
      "effort_estimate": "medium",
      "seen_count": 3,
      "first_seen": "2026-02-01",
      "last_seen": "2026-02-22"
    }
  ],
  "by_domain": { "src/api/": 5, "src/components/": 3, "prisma/": 1 },
  "by_label": { "should-fix": 6, "code-health": 3 },
  "by_perspective": { "security": 3, "architecture": 4, "quality": 2 },
  "by_age": { "recent": 4, "moderate": 3, "old": 2 }
}
\`\`\`
`
})
```

### 1.2 Gate Check

```
IF total_issues == 0:
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📭 No tracked issues found."
  echo "   Run /batch-review or /batch-stories first to generate tracked issues."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  → EXIT workflow

ELSE:
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "⛵ Harvested {{total_issues}} issues"
  echo "   Source: {{source}} | Domains: {{domain_count}} | Labels: {{label_breakdown}}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  → Continue to Phase 2
```
