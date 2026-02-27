# Phase 2: ANALYZE (2/4)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧵 PHASE 2: ANALYZE (2/4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Clotho clustering issues by root cause
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2.1 Root-Cause Analysis

```
Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "🧵 Clotho analyzing root causes",
  prompt: `
You are CLOTHO 🧵 — Spinner of the Thread of Life. You see the threads that
connect seemingly separate issues to the same root cause. Your job is to cluster
issues into actionable groups that can each become a single story.

<harvested_issues>
{{harvest.json from Phase 1}}
</harvested_issues>

**Step 1: Root-cause clustering**

Group issues that share the same underlying problem into clusters. Two issues
belong in the same cluster if fixing the root cause would resolve both.

Clustering criteria:
- Same file or adjacent files + same type of problem → likely same root cause
- Same pattern type across different files → likely same systemic issue
- Issues from different perspectives about the same code section → one cluster
- DRY violations citing the same duplicated logic → one cluster

**Step 2: Pattern detection**

For each cluster, identify the pattern:
- **DRY violation** — Same logic duplicated across N locations
- **God class/module** — Single file doing too many things
- **Inconsistent patterns** — Same problem solved differently across codebase
- **Missing abstraction** — Implementation details leaked across boundaries
- **Coupling** — Modules that should be independent are entangled
- **Layer violation** — Wrong layer accessing another directly
- **Naming inconsistency** — Same concept named differently across codebase
- **Test infrastructure gap** — Missing test harness or shared fixtures
- **Security pattern gap** — Auth/validation applied inconsistently

**Step 3: Deduplication**

Within each cluster, identify exact duplicates (same issue filed from
different review passes) and merge them.

**Step 4: Effort estimation**

For each cluster, estimate effort:
- **trivial** — < 1 hour, single file, obvious fix
- **small** — 1-4 hours, 1-3 files, straightforward
- **medium** — 4-16 hours, 3-10 files, requires some design
- **large** — 1-3 days, 10+ files, requires architectural discussion
- **epic** — > 3 days, cross-cutting, needs its own epic

**Step 5: Dependency mapping**

Identify dependencies between clusters:
- Cluster A must be done before Cluster B (shared abstraction)
- Clusters C and D can be done in parallel (independent domains)

**Output:**

Save to: {{sprint_artifacts}}/burndown/analysis.json

\`\`\`json
{
  "analyst": "clotho",
  "timestamp": "{{ISO timestamp}}",
  "clusters": [
    {
      "id": "cluster-1",
      "root_cause": "Auth validation duplicated across route handlers",
      "pattern_type": "dry_violation",
      "issues": [123, 145, 167, 189, 201],
      "issue_count": 5,
      "files_affected": [
        "src/api/users/route.ts",
        "src/api/spaces/route.ts",
        "src/api/bookings/route.ts",
        "src/api/admin/route.ts",
        "src/api/billing/route.ts"
      ],
      "suggested_title": "Extract auth validation into shared middleware",
      "effort": "medium",
      "risk": "low",
      "dependencies": [],
      "perspectives": ["security", "architecture"],
      "label_types": ["should-fix", "code-health"]
    }
  ],
  "dependency_graph": {
    "cluster-1": [],
    "cluster-2": ["cluster-1"],
    "cluster-3": []
  },
  "summary": {
    "total_clusters": N,
    "total_issues_clustered": N,
    "unclustered_issues": N,
    "by_effort": { "trivial": 1, "small": 3, "medium": 2, "large": 1, "epic": 0 },
    "by_pattern": { "dry_violation": 3, "god_class": 1, "inconsistent_patterns": 2, "missing_abstraction": 1 }
  }
}
\`\`\`
`
})
```

### 2.2 Display Analysis Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧵 ANALYSIS COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Clusters: {{total_clusters}}
Issues clustered: {{total_issues_clustered}}
Unclustered: {{unclustered_issues}}

By effort: {{effort_breakdown}}
By pattern: {{pattern_breakdown}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

→ Continue to Phase 3: PROPOSE
