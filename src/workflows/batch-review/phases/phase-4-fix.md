# Phase 4: FIX (4/6)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💊 PHASE 4: FIX (4/6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fixing {{must_fix_count}} issues
Mode: {{SWARM or SEQUENTIAL}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.1 Group Issues by File Category

**Note:** CODE_HEALTH items are excluded from all fix phases. They are never sent to fixers — they go directly to GitHub Issues tracking in Phase 6.

Group MUST_FIX issues into non-overlapping file categories:

```
frontend_issues = issues where file matches: *.tsx, *.jsx, *.css, components/, pages/
backend_issues = issues where file matches: api/, services/, middleware/, *.ts (non-frontend)
database_issues = issues where file matches: prisma/, migrations/, *.sql, models/
```

**CRITICAL:** File categories must NOT overlap. Each file belongs to exactly one category. This enables safe parallel fixing.

---

### SWARM MODE: Parallel Category Fixers (Single-Team Strategy)

With the single-team strategy, fixer tasks were created during team setup (Step 1) and
are blocked until reviews + triage complete. After triage, update the fix tasks with
actual issue content and unblock them.

**Step 1: Update fix tasks with triage results (targeted messaging)**

```
FOR EACH category IN [frontend, backend, database] WHERE category HAS issues:
  # Update the pre-created fix task with actual issues
  TaskUpdate(
    taskId=FIX_TASK_IDS[category],
    subject="Fix: {{category}} ({{issue_count}} issues)",
    description=`
      category: {{category}}
      scope_id: {{scope_id}}
      issues: {{JSON.stringify(category_issues)}}
      file_boundaries: {{list of files in this category}}
    `
  )

  # Send targeted message ONLY to the relevant fixer worker
  SendMessage(type="request", recipient="asclepius-{{category}}",
    content="Fix tasks unblocked for {{category}}. Claim and fix {{issue_count}} issues.")

FOR EACH category WHERE category HAS NO issues:
  # Mark empty fix tasks as completed (nothing to fix)
  TaskUpdate(taskId=FIX_TASK_IDS[category], status="completed")
```

**Step 2: Fixer workers already running (spawned in Step 1)**

Asclepius workers were spawned during team creation. They've been idle waiting for
fix tasks to unblock. Now that triage is complete and tasks are updated, they'll
automatically pick up the work.

**Step 3: Wait for all fixers to complete**

Workers fix only files within their assigned category. No file conflicts possible.

---

### SEQUENTIAL MODE: Single Fixer (Fallback)

When swarm mode is unavailable, fix sequentially by category:

```
FOR EACH category WITH issues:
  subagent = SELECT based on category:
    frontend → "dev-frontend"
    backend → "dev-typescript"
    database → "database-administrator"
    default → "general-purpose"

  Task({
    subagent_type: subagent,
    model: "opus",
    description: "💊 Fixing {{category}} issues",
    prompt: `
  [INLINE: issue-fixer.md persona]

  <issues_to_fix>
  {{List of MUST_FIX issues for this category}}
  </issues_to_fix>

  Save to: {{sprint_artifacts}}/hardening/{{scope_id}}-fixes-{{category}}.json
  `
  })
```

---

---

### 4.2 Best-Effort SHOULD_FIX Fixes

After all MUST_FIX issues are resolved, attempt SHOULD_FIX items with a best-effort approach.
**SHOULD_FIX failures never block the pipeline.**

**Triage each SHOULD_FIX item before attempting:**

For each SHOULD_FIX issue, evaluate:
1. Can this be fixed with a **localized change** (1-3 files, <50 lines)?
2. Does the fix stay **within the current review scope**?
3. Is it a **straightforward improvement** (not a design change)?

If YES to all → attempt the fix.
If NO to any → defer to tracking. Log:
```json
{
  "issue_id": "...",
  "reason_deferred": "requires multi-file refactor | architectural change | out of scope",
  "effort_estimate": "small | medium | large",
  "recommendation": "brief description of what should be done"
}
```

**Sequential mode:** Same fixer agent, second pass with SHOULD_FIX list + defer instructions.

```
FOR EACH category WITH should_fix_issues:
  subagent = SELECT based on category (same routing as 4.1)

  Task({
    subagent_type: subagent,
    model: "sonnet",
    description: "💊 Best-effort SHOULD_FIX fixes ({{category}})",
    prompt: `
  [INLINE: issue-fixer.md persona — SHOULD_FIX mode]

  <should_fix_issues>
  {{List of SHOULD_FIX issues for this category}}
  </should_fix_issues>

  These are best-effort items. Fix what you can with localized changes.
  Defer anything requiring multi-file refactors or architectural changes.

  Save to: {{sprint_artifacts}}/hardening/{{scope_id}}-should-fix-{{category}}.json
  `
  })
```

**Swarm mode:** Same Asclepius workers, unblock SHOULD_FIX tasks after MUST_FIX tasks complete.

```
FOR EACH category IN [frontend, backend, database] WHERE category HAS should_fix_issues:
  TaskCreate(
    subject="SHOULD_FIX: {{category}} ({{sf_count}} items, best-effort)",
    description=`
      category: {{category}}
      scope_id: {{scope_id}}
      mode: "should_fix_best_effort"
      issues: {{JSON.stringify(should_fix_category_issues)}}
      file_boundaries: {{list of files in this category}}
    `,
    blockedBy=[FIX_TASK_IDS[category]]  # Wait for MUST_FIX to finish first
  )

  SendMessage(type="request", recipient="asclepius-{{category}}",
    content="SHOULD_FIX tasks queued for {{category}}. Best-effort — fix what's localized, defer the rest.")
```

---

**Orchestrator says:**
> "Fixed **{{fixed_count}}/{{must_fix_count}}** MUST_FIX issues across {{category_count}} categories. Best-effort: fixed **{{sf_fixed}}/{{sf_total}}** SHOULD_FIX items. **{{sf_deferred}}** deferred to tracking. Running verification..."
