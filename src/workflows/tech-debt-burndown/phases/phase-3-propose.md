# Phase 3: PROPOSE (3/4)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PHASE 3: PROPOSE (3/4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Interactive proposal review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3.1 Present Proposals

For each cluster from Phase 2, present a proposal to the user for approval.

**Sort clusters by:** effort (smallest first), then by issue count (most issues first).

```
FOR EACH cluster IN analysis.clusters (sorted):
  # Present the proposal
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📋 Proposal {{index}}/{{total}}: {{cluster.suggested_title}}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Root Cause:  {{cluster.root_cause}}"
  echo "Pattern:     {{cluster.pattern_type}}"
  echo "Issues:      {{cluster.issue_count}} ({{cluster.issues | join ', #'}})"
  echo "Files:       {{cluster.files_affected | length}} files"
  echo "Effort:      {{cluster.effort}}"
  echo "Risk:        {{cluster.risk}}"
  echo "Depends on:  {{cluster.dependencies | join ', ' || 'none'}}"
  echo ""
  echo "Files affected:"
  FOR EACH file IN cluster.files_affected:
    echo "  - {{file}}"
  echo ""

  # Ask user for action
  AskUserQuestion({
    questions: [{
      question: "What would you like to do with this proposal?",
      header: "Action",
      options: [
        { label: "Approve", description: "Create a story for this cluster" },
        { label: "Edit title", description: "Approve with a different title" },
        { label: "Skip", description: "Don't create a story for this cluster" },
        { label: "Quit", description: "Stop reviewing proposals, proceed with approved so far" }
      ],
      multiSelect: false
    }]
  })

  IF action == "Approve":
    approved_proposals.push(cluster)

  ELIF action == "Edit title":
    # User provides custom title via "Other" option or follow-up
    cluster.suggested_title = user_provided_title
    approved_proposals.push(cluster)

  ELIF action == "Skip":
    skipped_proposals.push(cluster)
    CONTINUE

  ELIF action == "Quit":
    BREAK
```

### 3.2 Gate Check

```
IF approved_proposals.length == 0:
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📭 No proposals approved."
  echo "   No stories will be created."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  → EXIT workflow

ELSE:
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ {{approved_proposals.length}} proposals approved"
  echo "   {{skipped_proposals.length}} skipped"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  → Continue to Phase 4
```

### 3.3 Save Approved Proposals

```json
Save to: {{sprint_artifacts}}/burndown/proposals.json

{
  "approved": [
    {
      "cluster_id": "cluster-1",
      "title": "Extract auth validation into shared middleware",
      "root_cause": "...",
      "pattern_type": "dry_violation",
      "issues": [123, 145, 167, 189, 201],
      "files_affected": [...],
      "effort": "medium",
      "risk": "low"
    }
  ],
  "skipped": [...],
  "total_reviewed": N,
  "total_approved": N,
  "total_skipped": N
}
```
