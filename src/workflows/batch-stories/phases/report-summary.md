# Phase: Report & Summary
<!-- Batch Stories phase file — see workflow.md for config and routing -->

<step name="summary">
**Generate Comprehensive Session Summary**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 PHASE: SESSION REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hermes compiling comprehensive session summary...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 1: Gather All Completion Artifacts

```bash
SESSION_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_DIR="{{sprint_artifacts}}/session-reports"
mkdir -p "$REPORT_DIR"

# Collect all artifacts for processed stories
for story in {{all_stories}}; do
  echo "Gathering artifacts for $story..."

  # Progress artifact
  cat "{{sprint_artifacts}}/completions/${story}-progress.json" 2>/dev/null

  # Agent artifacts
  cat "{{sprint_artifacts}}/completions/${story}-metis.json" 2>/dev/null
  cat "{{sprint_artifacts}}/completions/${story}-argus.json" 2>/dev/null
  cat "{{sprint_artifacts}}/completions/${story}-themis.json" 2>/dev/null
  cat "{{sprint_artifacts}}/completions/${story}-mnemosyne.json" 2>/dev/null
done
```

### Step 2: Spawn Hermes (Session Reporter)

**Load persona:**
Read: `{project-root}/_bmad/pantheon/workflows/batch-stories/agents/session-reporter.md`

**Load report template:**
Read: `{project-root}/_bmad/pantheon/workflows/batch-stories/templates/session-report-template.md`

```
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "📜 Hermes generating session report",
  prompt: `
You are HERMES 📜 - Messenger of the Gods.

Your job is to create a comprehensive Session Summary Report from the batch
story implementation session that just completed.

<stories_processed>
{{list of story keys}}
</stories_processed>

<individual_story_summaries>
{{For each story, the full content of {{story}}-summary.md - these contain
the detailed verification guides that we'll reference in the session report}}
</individual_story_summaries>

<hermes_artifacts>
{{For each story, the {{story}}-hermes.json containing:
  - tldr: One paragraph summary
  - quick_stats: files, lines, tests, coverage, issues
  - verification_items: count of manual checklist items
}}
</hermes_artifacts>

<progress_artifacts>
{{All collected {{story}}-progress.json files}}
</progress_artifacts>

<git_log>
{{Recent commits from this session}}
</git_log>

<session_metadata>
Session Start: {{start_time}}
Session End: {{end_time}}
Mode: {{sequential|parallel}}
</session_metadata>

**IMPORTANT:** Each story already has its own detailed summary report with verification guide.
Your job is to create an AGGREGATE session report that:
- Shows the TL;DR of each story (from hermes artifacts)
- Provides aggregate metrics across all stories
- Points users to individual story reports for detailed verification
- Does NOT duplicate the per-story verification checklists (reference them instead)

Generate a comprehensive report following the template in:
  {{project_root}}/_bmad/pantheon/workflows/batch-stories/templates/session-report-template.md

The report should be 1-2 pages and include:

1. **Executive Summary** (2-3 paragraphs)
2. **Features Delivered** (per story)
3. **Technical Summary** (files, quality, commits)
4. **Verification Guide** (tests + per-story checklists)
5. **Issues & Tech Debt**
6. **Next Steps**

Save the full report to:
  {{sprint_artifacts}}/session-reports/session-{{timestamp}}.md

Then output a condensed terminal summary.
`
})
```

### Step 3: Display Quick Summary with TL;DRs

After Hermes completes, display condensed results showing each story's TL;DR:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 SESSION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Session Totals
   Stories: {{completed}}/{{total}} completed
   Files:   {{total_files}} changed ({{total_lines}} lines)
   Tests:   {{total_tests}} added
   Coverage: {{avg_coverage}}% average
   Issues:  {{total_issues}} found → {{total_fixed}} fixed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 STORY SUMMARIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{For each story, read from {{story}}-hermes.json:}}

┌─────────────────────────────────────────────────────────────────────────────┐
│ {{story_key}}: {{story_title}}                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ {{files}} files | {{lines}} lines | {{tests}} tests | {{coverage}}% cov    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ {{TL;DR from hermes.json - 3-5 sentences summarizing what was built        │
│   and the key outcome. This gives the user a quick understanding           │
│   of what each story accomplished without reading the full report.}}       │
│                                                                             │
│ 📋 Verification: {{verification_items}} checklist items                     │
│ 📄 Full Report: completions/{{story_key}}-summary.md                        │
└─────────────────────────────────────────────────────────────────────────────┘

{{Repeat box for each story...}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 QUICK VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   npm test              # Run all {{total_tests}} tests
   npm run dev           # Start dev server and explore

   Per-story verification guides in:
   {{sprint_artifacts}}/completions/{{story}}-summary.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 REPORTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Session Report: {{session_report_path}}
   Story Reports:
{{For each story:}}
     • {{story_key}}: completions/{{story_key}}-summary.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 4: Offer Report Actions

Use AskUserQuestion:
```
Session report generated. What would you like to do?

Options:
1. View full report in terminal (display report content)
2. Open report file (provides path)
3. Continue (done, move on)
```

**If user selects "View full report":**
Read and display `{{sprint_artifacts}}/session-reports/session-{{timestamp}}.md`

### Alternative: Orchestrator-Generated Summary

If Task agent is not available or for simpler sessions, the orchestrator can generate
the summary directly by following this template:

**Gather data:**
```bash
# Calculate totals
TOTAL_FILES=0
TOTAL_LINES=0
TOTAL_TESTS=0
COVERAGE_SUM=0

for story in {{all_stories}}; do
  PROGRESS="{{sprint_artifacts}}/completions/${story}-progress.json"
  if [ -f "$PROGRESS" ]; then
    FILES=$(jq '.metrics.files_changed // 0' "$PROGRESS")
    LINES=$(jq '.metrics.lines_added // 0' "$PROGRESS")
    TESTS=$(jq '.metrics.tests_added // 0' "$PROGRESS")
    COV=$(jq '.metrics.coverage | gsub("%"; "") | tonumber // 0' "$PROGRESS")

    TOTAL_FILES=$((TOTAL_FILES + FILES))
    TOTAL_LINES=$((TOTAL_LINES + LINES))
    TOTAL_TESTS=$((TOTAL_TESTS + TESTS))
    COVERAGE_SUM=$((COVERAGE_SUM + COV))
  fi
done

AVG_COVERAGE=$((COVERAGE_SUM / {{story_count}}))
```

**Generate markdown report:**
Use Write tool to create `{{sprint_artifacts}}/session-reports/session-{{timestamp}}.md`
following the template in `templates/session-report-template.md`.

**Display terminal summary:**
Output the quick summary format shown above.
</step>

<step name="epic_completion_check">
### Check Epic Completion

After session completes, check if the epic is now fully done:

```bash
# If this was an epic batch, check if all stories are done
IF epic provided (e.g., epic=17):
  EPIC_KEY="epic-{{epic}}"

  # Get all stories in this epic from sprint-status.yaml
  EPIC_STORIES=$(grep "^  {{epic}}-" {{implementation_artifacts}}/sprint-status.yaml | cut -d: -f1 | tr -d ' ')

  # Check if ALL stories are "done"
  ALL_DONE=true
  for story in $EPIC_STORIES; do
    STATUS=$(grep "^  $story:" {{implementation_artifacts}}/sprint-status.yaml | cut -d: -f2 | tr -d ' ')
    if [ "$STATUS" != "done" ]; then
      ALL_DONE=false
      break
    fi
  done

  IF ALL_DONE:
    # Mark epic as done
    Use Edit tool on sprint-status.yaml:
    "{{EPIC_KEY}}: in-progress" → "{{EPIC_KEY}}: done"

    **Orchestrator says:**
    > "EPIC {{epic}} COMPLETE! All {{story_count}} stories are done and the epic is now marked as complete in sprint-status.yaml."
  ELSE:
    REMAINING=$(echo "$EPIC_STORIES" | wc -l) - {{completed_count}}
    **Orchestrator says:**
    > "Epic {{epic}} Progress: {{completed_count}}/{{total_stories}} stories done. {{REMAINING}} stories remaining."
  ENDIF
ENDIF
```

### Commit Epic Completion (if applicable)

```bash
IF epic marked as done:
  git add {{implementation_artifacts}}/sprint-status.yaml

  git commit -m "$(cat <<'EOF'
chore(epic-{{epic}}): mark epic as complete

All {{story_count}} stories in epic {{epic}} have been implemented,
reviewed, and verified. Epic marked as done.
EOF
)"

  **Orchestrator says:**
  > "Epic completion committed: {{git_commit}}"
ENDIF
```

</step>
