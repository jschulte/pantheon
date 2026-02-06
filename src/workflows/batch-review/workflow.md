# Batch Review - Hardening Sweep Workflow

**Version:** 2.1.0
**Purpose:** Deep code review and hardening with swarm parallelism + Pygmalion persona forging

---

## Overview

This workflow performs deep code review on existing implementations to find and fix issues that may have been missed. Unlike story-pipeline (which implements new stories), batch-review focuses purely on reviewing and hardening existing code.

**Key Features:**
- **Repeatable** - Run multiple times; each pass finds deeper issues
- **Focus-able** - Provide guidance to target specific concerns
- **Comprehensive** - Multi-perspective review from security, correctness, architecture, tests
- **Action-oriented** - Finds issues AND fixes them
- **Swarm Parallel** (v2.0) - Reviewers, fixers, and verifiers run as parallel swarm teammates
- **Pygmalion Forging** (v2.0) - Domain-specific specialist reviewers forged on-the-fly

---

## Usage Examples

```bash
# Review all stories in an epic (default: find all bugs)
/batch-review epic=17

# Review specific stories with focus guidance
/batch-review stories="17-1,17-2,17-3" focus="styling, UX, button placement"

# Review specific paths
/batch-review path="src/components" focus="accessibility compliance"

# Security sweep
/batch-review epic=17 focus="security vulnerabilities, auth bypass, injection"

# Consistency sweep
/batch-review epic=17 focus="error handling patterns, consistent API responses"

# Performance sweep
/batch-review path="src/api" focus="N+1 queries, caching opportunities, slow operations"
```

---

## Phases

```
Phase 1: SCOPE ─────────────────────────────────────────
         Analyze scope, identify files to review
         ↓
Phase 1.5: FORGE (Pygmalion) ───────────────────────────
         Forge domain-specific specialist personas (if enabled)
         ↓
Phase 2: REVIEW ────────────────────────────────────────
         Multi-perspective review (swarm: parallel workers)
         ↓
Phase 3: ASSESS ────────────────────────────────────────
         Themis triages + deduplicates findings
         ↓
Phase 4: FIX ───────────────────────────────────────────
         Category-partitioned fixers (swarm: parallel workers)
         ↓
Phase 5: VERIFY ────────────────────────────────────────
         Independent fix verification (swarm: parallel workers)
         ↓
         ↓ (loop if new issues found, max iterations)
         ↓
Phase 6: REPORT ────────────────────────────────────────
         Generate hardening summary + cleanup swarm
```

---

## Process

<process>

<step name="phase_1_scope">
## Phase 1: SCOPE (1/6)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 PHASE 1: SCOPE (1/6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyzing review scope...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.1 Parse Input

Extract scope from user input:

```
IF epic provided:
  SCOPE_TYPE = "epic"
  Find all stories: docs/stories/epic-{{epic}}/*.md
  Extract file patterns from stories

ELIF stories provided:
  SCOPE_TYPE = "stories"
  Parse story list: "17-1,17-2,17-3"
  Find story files and extract file patterns

ELIF path provided:
  SCOPE_TYPE = "path"
  Use provided paths directly

ELIF since_commit provided:
  SCOPE_TYPE = "git"
  Get changed files: git diff --name-only {{since_commit}}..HEAD
```

### 1.2 Extract Focus (if provided)

```
IF focus provided:
  FOCUS_ENABLED = true
  FOCUS_PROMPT = "{{user_focus_input}}"

  # Enhance review prompts with focus
  REVIEW_GUIDANCE = `
  **SPECIAL FOCUS REQUESTED:**
  In addition to standard review, pay particular attention to:
  {{FOCUS_PROMPT}}

  Look for issues related to this focus across all files reviewed.
  `
ELSE:
  FOCUS_ENABLED = false
  REVIEW_GUIDANCE = ""
```

### 1.3 Analyze Scope

```
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "🔍 Analyzing review scope",
  prompt: `
Analyze the review scope and prepare for deep review.

<scope>
Type: {{SCOPE_TYPE}}
Input: {{scope_input}}
</scope>

<stories_or_paths>
{{IF SCOPE_TYPE == "epic" or "stories"}}
[List story files with their file patterns]
{{ELSE}}
[List paths to review]
{{ENDIF}}
</stories_or_paths>

**Tasks:**
1. Identify all files that should be reviewed
2. Categorize by type (frontend, backend, database, tests)
3. Note which reviewers should be activated (accessibility for frontend, etc.)
4. Estimate scope size

**Output:**
{
  "scope_id": "epic-17-pass-1",
  "files_to_review": [
    { "path": "src/components/Button.tsx", "category": "frontend" },
    ...
  ],
  "total_files": 25,
  "categories": {
    "frontend": 12,
    "backend": 8,
    "database": 2,
    "tests": 3
  },
  "reviewers_needed": ["security", "correctness", "architecture", "accessibility"],
  "estimated_complexity": "medium"
}

Save to: docs/sprint-artifacts/hardening/{{scope_id}}-scope.json
`
})
```

**📢 Orchestrator says:**
> "Scope analyzed: **{{total_files}} files** to review across {{categories}}. {{IF FOCUS_ENABLED}}Focus: **{{FOCUS_PROMPT}}**{{ENDIF}}. Starting deep review..."

</step>

<step name="phase_1_5_forge">
## Phase 1.5: FORGE (Pygmalion)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗿 PHASE 1.5: FORGE (Pygmalion)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Forging domain-specific specialist personas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Invoke Pygmalion

Pygmalion analyzes the scoped code to identify domain-specific expertise gaps in the standard Pantheon reviewers. It checks the specialist registry first to reuse or evolve existing specialists.

```
IF persona_forging.enabled AND estimated_complexity >= "light":

  # Load specialist registry for Pygmalion context
  REGISTRY_INDEX = read("docs/specialist-registry/_index.json") OR { "version": "1.0", "specialists": [] }

  Task({
    subagent_type: "general-purpose",
    model: "opus",
    description: "🗿 Pygmalion forging specialists for {{scope_id}}",
    prompt: `
  <agent_persona>
  [INLINE: Content from story-pipeline/agents/pygmalion.md]
  </agent_persona>

  Analyze this code scope and forge specialist personas if the Pantheon leaves coverage gaps.
  Check the specialist registry first — reuse or evolve existing specialists when possible.

  <scope>
  Files: {{scoped_files}}
  Focus: {{FOCUS_PROMPT or "standard hardening"}}
  </scope>

  <specialist_registry>
  [INLINE: Content of docs/specialist-registry/_index.json]
  </specialist_registry>

  <project_context>
  [INLINE: package.json dependencies, project structure]
  </project_context>

  Output your analysis as the Pygmalion JSON artifact.
  Save to: docs/sprint-artifacts/hardening/{{scope_id}}-pygmalion.json
  `
  })

  FORGED_SPECS = read("docs/sprint-artifacts/hardening/{{scope_id}}-pygmalion.json")

ELSE:
  FORGED_SPECS = { forged_specialists: [], skipped: true }
```

### Update Specialist Registry

After Pygmalion returns, persist new/evolved specialists to the registry.

```
FOR EACH spec IN FORGED_SPECS.forged_specialists:
  IF spec.registry_action == "forged_new":
    Write("docs/specialist-registry/{{spec.id}}.json", {
      "registry_metadata": {
        "spec_version": 1,
        "created_for": "{{scope_id}}",
        "last_used": "{{scope_id}}",
        "usage_history": ["{{scope_id}}"]
      },
      ...spec fields...
    })
    Append to REGISTRY_INDEX.specialists

  ELIF spec.registry_action == "evolved":
    existing = read("docs/specialist-registry/{{spec.id}}.json")
    existing.registry_metadata.spec_version += 1
    existing.registry_metadata.last_used = "{{scope_id}}"
    existing.registry_metadata.usage_history.push("{{scope_id}}")
    Write("docs/specialist-registry/{{spec.id}}.json", existing)
    Update REGISTRY_INDEX entry

  ELIF spec.registry_action == "reused":
    Update last_used in REGISTRY_INDEX and spec file

Write("docs/specialist-registry/_index.json", REGISTRY_INDEX)
```

**📢 Orchestrator says (if specialists assembled):**
> "Pygmalion assembled **{{count}} specialist(s)** ({{new}} new, {{evolved}} evolved, {{reused}} reused)."

**📢 Orchestrator says (if no specialists):**
> "Pygmalion confirmed Pantheon coverage is sufficient. Proceeding with standard reviewers."

</step>

<step name="phase_2_review">
## Phase 2: REVIEW (2/6)

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
FOR EACH perspective_artifact IN docs/sprint-artifacts/reviews/{{scope_id}}-*.json:
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

Save to: docs/sprint-artifacts/hardening/{{scope_id}}-review.json
`
})
```

---

**📢 Orchestrator says:**
> "Review complete. **{{total_issues}} issues** found across {{perspective_count}} perspectives. Sending to Themis for triage..."

</step>

<step name="phase_3_assess">
## Phase 3: ASSESS (3/6)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ PHASE 3: ASSESS (3/6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Themis triaging findings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3.1 Themis Triage + Deduplication

Same triage logic as story-pipeline — err on the side of fixing. Additionally, when multiple reviewers (Pantheon + forged specialists) find the same issue, Themis merges duplicates.

```
Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "⚖️ Themis triaging hardening findings",
  prompt: `
You are THEMIS ⚖️ - Titan of Justice.

Triage these hardening findings. **ERR ON THE SIDE OF FIXING.**

<all_issues>
{{ALL issues from Phase 2 — from all reviewers (Pantheon + forged specialists)}}
</all_issues>

<triage_rules>
**MUST_FIX** - Any real issue. Default category.
**SHOULD_FIX** - Large refactoring with speculative benefit only.
**STYLE** - Clearly manufactured complaints only (<10%).

If uncertain → MUST_FIX.
</triage_rules>

<deduplication_rules>
Multiple reviewers may find the same underlying issue. Merge duplicates:
- Same file + within 5 lines + same root cause = ONE issue
- Keep the most detailed finding
- Note all reviewers who found it (consensus increases confidence)
- Add "reviewers_agreed" field listing who found it
- Higher consensus = higher confidence the issue is real
</deduplication_rules>

<output>
{
  "triage": [
    {
      "issue_id": "epic-17-pass-1-001",
      "original_classification": "MUST_FIX",
      "final_classification": "MUST_FIX",
      "justification": "Real security issue - input not sanitized",
      "reviewers_agreed": ["security", "stripe-webhook-integrity"],
      "duplicates_merged": 1
    }
  ],
  "summary": {
    "must_fix": N,
    "should_fix": N,
    "style": N,
    "duplicates_merged": N
  }
}

Save to: docs/sprint-artifacts/hardening/{{scope_id}}-triage.json
</output>
`
})
```

**If no MUST_FIX issues:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CLEAN PASS - No issues require fixing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
→ Skip to Phase 6: REPORT

**If MUST_FIX issues exist:**
→ Continue to Phase 4: FIX

</step>

<step name="phase_4_fix">
## Phase 4: FIX (4/6)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💊 PHASE 4: FIX (4/6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fixing {{must_fix_count}} issues
Mode: {{SWARM or SEQUENTIAL}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.1 Group Issues by File Category

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

  Save to: docs/sprint-artifacts/hardening/{{scope_id}}-fixes-{{category}}.json
  `
  })
```

---

**📢 Orchestrator says:**
> "Fixed **{{fixed_count}}/{{must_fix_count}}** issues across {{category_count}} categories. Running verification..."

</step>

<step name="phase_5_verify">
## Phase 5: VERIFY (5/6)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 PHASE 5: VERIFY (5/6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verifying fixes and checking for regressions
Mode: {{SWARM or SEQUENTIAL}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5.1 Run Tests

```bash
npm test 2>&1 | tee test-output.txt
```

---

### SWARM MODE: Parallel Verification Workers (Single-Team Strategy)

With the single-team strategy, verify tasks were created during team setup and are blocked
until fix tasks complete. After fixes, update verify tasks with fix artifacts.

**Step 1: Update verification tasks with fix results (targeted messaging)**

```
FOR EACH category THAT had fixes applied:
  TaskUpdate(
    taskId=VERIFY_TASK_IDS[category],
    subject="Verify: {{category}} fixes",
    description=`
      category: {{category}}
      scope_id: {{scope_id}}
      fixes_artifact: {{scope_id}}-fixes-{{category}}.json
      original_issues: {{issues for this category}}
    `
  )

  # Send targeted message ONLY to relevant verifier
  SendMessage(type="request", recipient="aletheia-{{index}}",
    content="Verification tasks unblocked for {{category}}. Claim and verify.")

FOR EACH category WHERE no fixes were applied:
  TaskUpdate(taskId=VERIFY_TASK_IDS[category], status="completed")
```

**Step 2: Verification workers already running (spawned in Step 1)**

Aletheia workers were spawned during team creation. They'll automatically pick up
verify tasks as they unblock.

**Step 3: Wait for all verifiers to complete**

Collect verification results. Check for new issues or regressions.

---

### SEQUENTIAL MODE: Single Verifier (Fallback)

```
Task({
  subagent_type: "testing-suite:test-engineer",
  model: "opus",
  description: "🔍 Verifying hardening fixes",
  prompt: `
Verify that all fixes were correctly applied and no regressions introduced.

<original_issues>
{{MUST_FIX issues that were fixed}}
</original_issues>

<fixes_applied>
{{Fixes from Phase 4}}
</fixes_applied>

<test_output>
{{test-output.txt}}
</test_output>

Save to: docs/sprint-artifacts/hardening/{{scope_id}}-verification.json
`
})
```

---

### Iteration Logic

```
IF new_issues_found OR regressions_found:
  ITERATION += 1

  IF ITERATION > MAX_ITERATIONS:
    → Log remaining issues and continue to REPORT
  ELSE:
    → Return to Phase 4: FIX with new issues
```

**If all verified:**
→ Continue to Phase 6: REPORT

</step>

<step name="phase_6_report">
## Phase 6: REPORT (6/6)

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
⚠️ **Issues remain.** Consider running `/batch-review` again.
Remaining issues logged to: docs/sprint-artifacts/hardening/{{scope_id}}-remaining.json
{{ENDIF}}

---

Save to: docs/sprint-artifacts/hardening/{{scope_id}}-report.md
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
      "timestamp": "2024-...",
      "issues_found": 15,
      "issues_fixed": 12,
      "focus": null
    },
    {
      "pass_number": 2,
      "timestamp": "2024-...",
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
   docs/sprint-artifacts/hardening/{{scope_id}}-report.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</step>

</process>

---

## Focus Examples

**Default (no focus):** Standard multi-perspective review
```
/batch-review epic=17
```

**UX/Styling Focus:**
```
/batch-review epic=17 focus="styling, UX, button placement, context menus, visual consistency"
```

**Security Sweep:**
```
/batch-review epic=17 focus="security vulnerabilities, authentication, authorization, input validation, secrets"
```

**Accessibility Audit:**
```
/batch-review path="src/components" focus="WCAG AA compliance, keyboard navigation, screen reader, focus management"
```

**Performance Hunt:**
```
/batch-review path="src/api" focus="N+1 queries, caching, database performance, slow operations, memory leaks"
```

**Consistency Check:**
```
/batch-review epic=17 focus="error handling patterns, API response formats, naming conventions, code style"
```

**Test Coverage:**
```
/batch-review epic=17 focus="missing tests, edge cases, error conditions, integration tests"
```

---

## Hardening Strategy

For maximum hardening, run multiple passes with different focuses:

1. **Pass 1:** Default (all perspectives) - catch obvious issues
2. **Pass 2:** Security focus - deep security audit
3. **Pass 3:** Accessibility focus - ensure compliance
4. **Pass 4:** Performance focus - optimize
5. **Pass 5:** Consistency focus - unify patterns

Each pass builds on the previous, resulting in thoroughly hardened code.

---

## Version History

**v2.1.0 - Specialist Registry Edition**
1. Phase 1.5 FORGE: Pygmalion now checks specialist registry before forging
2. Jaccard similarity matching: REUSE (>=0.5), EVOLVE (0.3-0.49), FORGE_NEW (<0.3)
3. Registry writes handled by orchestrator after Pygmalion output
4. Token savings from reusing previously forged specialists across reviews

**v2.0.0 - Swarm + Pygmalion Edition**
1. Phase 1.5 FORGE: Pygmalion forges domain-specific specialist personas
2. Phase 2 REVIEW: Parallel review workers (Dike) via TeammateTool swarm
3. Phase 3 ASSESS: Themis deduplicates findings from multiple parallel reviewers
4. Phase 4 FIX: Parallel category fixers (Asclepius) with non-overlapping file sets
5. Phase 5 VERIFY: Parallel verification workers (Aletheia)
6. Phase 6 REPORT: Swarm cleanup added
7. Sequential fallback mode preserved for environments without swarm support
8. Forged specialist reviewers integrated alongside Pantheon perspectives

**v1.0.0 - Initial Release**
- Sequential deep review with single multi-perspective reviewer
- Themis triage
- Category-based sequential fixing
- Verification and iteration loop
- Hardening report generation
