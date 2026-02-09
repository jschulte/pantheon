# Phase 5: REFINE (5/7)
<!-- Part of Story Pipeline v7.3 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 PHASE 5: REFINE (5/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Metis fixes + iterate until clean (max 3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Skip if Themis cleared all issues.**

### Iterative Refinement Loop

```
┌─────────────────────────────────────────────────────────┐
│  Iterative Refinement Loop                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Metis    │───▶│ Resume       │───▶│ MUST_FIX     │  │
│  │ fixes    │    │ original     │    │ remaining?   │  │
│  │ MUST_FIX │    │ reviewers    │    └──────┬───────┘  │
│  └──────────┘    └──────────────┘           │          │
│       ▲                                     │          │
│       │          YES ◀──────────────────────┤          │
│       └─────────────────────────────────────┘          │
│                                             │ NO       │
│                                             ▼          │
│                                      ✅ Complete       │
│                                                         │
│  Max iterations: 3                                      │
│  After 3: Escalate to user                              │
└─────────────────────────────────────────────────────────┘
```

### Iteration-Aware Context Strategy

**Problem:** By iteration 2+, the orchestrator transcript contains Phase 1-4 context plus iteration 1 results (~80-100K tokens). Resuming agents adds to already-large transcripts, risking context overflow.

**Solution:** Different strategies per iteration:

```
IF ITERATION == 1:
  → Resume Metis + original reviewers (full transcript context, maximum continuity)
  → Model: opus (same as build phase)

IF ITERATION >= 2:
  → Fresh spawn with COMPACT CONTEXT (prevents transcript overflow)
  → Model: sonnet (sufficient for targeted fixes, faster)
  → Compact context includes ONLY:
    - Story summary (not full story file)
    - MUST_FIX issues remaining (from previous iteration's verification)
    - Affected files only (not all implementation files)
    - Previous iteration summary (what was attempted, what resolved, what remains)
  → Target: <20K tokens total prompt size
```

**Compact context template (iteration 2+):**
```yaml
story_summary: "1-2 sentence story description"
iteration: N
previous_summary: "What iteration N-1 attempted and resolved"
must_fix_remaining:
  - issue: "description"
    location: "file:line"
    reviewer: "who found it"
    prior_fix_attempt: "what was tried and why it didn't resolve"
affected_files: [only files relevant to remaining issues]
```

---

**WHILE MUST_FIX_COUNT > 0 AND ITERATION <= 3:**

### 5.1 Fix MUST_FIX issues (Metis)

**Iteration 1: Resume Metis (full context continuity)**

```
IF ITERATION == 1:
  Task({
    subagent_type: "general-purpose",
    model: "opus",
    description: "🔨 Metis fixing issues (iteration 1) on {{story_key}}",
    resume: "{{BUILDER_AGENT_ID}}",
    prompt: `
  Metis, Themis has upheld these issues as MUST_FIX:

  <must_fix_issues>
  {{upheld issues with file:line citations}}
  </must_fix_issues>

  Fix them. Run tests after each fix.
  `
  })
```

**Iteration 2+: Fresh spawn with compact context (prevent overflow)**

```
IF ITERATION >= 2:
  Task({
    subagent_type: "general-purpose",
    model: "sonnet",
    description: "🔨 Metis fixing issues (iteration {{ITERATION}}) on {{story_key}}",
    prompt: `
  You are METIS 🔨 - continuing iterative fixes on {{story_key}}.

  <compact_context>
  Story: {{story_summary}}
  Iteration: {{ITERATION}}
  Previous: {{previous_iteration_summary}}
  </compact_context>

  <must_fix_remaining>
  {{remaining MUST_FIX issues with file:line citations and prior fix attempts}}
  </must_fix_remaining>

  <affected_files>
  {{ONLY files relevant to remaining issues — read these before fixing}}
  </affected_files>

  Fix the remaining issues. Run tests after each fix.
  `
  })
```

### 5.2 Verify fixes (reviewers)

Only verify with reviewers who had upheld MUST_FIX findings. This includes both Pantheon reviewers and forged specialists.

**Iteration 1: Resume original reviewers (full context)**

```
IF ITERATION == 1:
  FOR EACH reviewer_id IN reviewers_with_upheld_must_fix:
    Task({
      resume: "{{reviewer_id}}",
      prompt: `
  Metis has addressed your issues. Verify:
  1. Is the fix satisfactory? (RESOLVED / NOT_RESOLVED)
  2. Did the fix introduce NEW issues?
  `
    })

  # For forged specialists that cannot be resumed (no saved agent_id),
  # re-spawn with the original spec from Pygmalion output:
  FOR EACH spec IN forged_specialists_with_upheld_must_fix:
    IF spec.agent_id is available:
      Task({ resume: "{{spec.agent_id}}", prompt: "Verify fixes..." })
    ELSE:
      # Re-spawn with verification-focused prompt
      Task({
        subagent_type: "{{spec.suggested_claude_agent_type}}",
        model: "opus",
        prompt: `
  You are {{spec.name}} ({{spec.emoji}}) — {{spec.title}}.
  {{spec.domain_expertise}}

  Metis has fixed these issues you raised:
  {{upheld_must_fix_from_this_specialist}}

  Verify each fix:
  1. Is the fix satisfactory? (RESOLVED / NOT_RESOLVED)
  2. Did the fix introduce NEW issues?
  3. Check technology_checklist items again.

  Save to: docs/sprint-artifacts/completions/{{story_key}}-{{spec.id}}-verify.json
  `
      })
```

**Iteration 2+: Fresh spawn with compact verification context**

```
IF ITERATION >= 2:
  # Single verification agent with compact context (no resume needed)
  Task({
    subagent_type: "general-purpose",
    model: "sonnet",
    description: "👁️ Verifying iteration {{ITERATION}} fixes on {{story_key}}",
    prompt: `
  Verify that the following MUST_FIX issues have been resolved:

  <issues_to_verify>
  {{remaining MUST_FIX issues with file:line citations}}
  </issues_to_verify>

  <affected_files>
  {{files that were modified in this iteration}}
  </affected_files>

  For each issue:
  1. Read the affected file at the cited location
  2. Determine: RESOLVED or NOT_RESOLVED
  3. Check if the fix introduced NEW issues

  Run tests to confirm nothing is broken.
  `
  })
```

### 5.3 Fresh eyes on iteration 2+

On iteration 2+, add ONE fresh reviewer (possibly Iris if frontend files).
This is IN ADDITION to the compact verification above — fresh eyes catch what tunnel vision misses.

**END WHILE**

**Post-loop:**
- If max iterations reached, escalate to user
- Log SHOULD_FIX and STYLE as tech debt

### Update Progress

Update `docs/sprint-artifacts/completions/{{story_key}}-progress.json`:
```json
{
  "current_phase": "COMMIT",
  "phases": {
    ...
    "REFINE": { "status": "complete", "details": "{{iterations}} iterations, {{fixes_applied}} fixes" },
    "COMMIT": { "status": "in_progress" },
    ...
  },
  "metrics": {
    "iterations": {{iterations}},
    "fixes_applied": {{fixes_applied}}
  }
}
```

### 5.4 Commit Implementation

After all MUST_FIX issues are resolved, commit the implementation:

```bash
# Stage only implementation files (not .env, credentials, temp files)
git add src/ lib/ app/ components/ pages/ public/ prisma/ tests/ __tests__/
git add package.json package-lock.json tsconfig.json
# Stage sprint artifacts
git add docs/sprint-artifacts/

git commit -m "$(cat <<'EOF'
feat({{story_key}}): {{story_title}}

Implementation complete:
- {{files_created}} files created
- {{files_modified}} files modified
- {{tests_added}} tests added
- Coverage: {{coverage}}%

All review issues resolved ({{iterations}} iteration{{s}}).
EOF
)"
```

**Save the commit SHA:**
```bash
GIT_IMPLEMENTATION_COMMIT=$(git rev-parse HEAD)
```

**📢 Orchestrator says (after successful fix):**
> "Metis fixed the issues and the reviewers confirmed the fixes look good. **Zero MUST_FIX remaining!** Implementation committed ({{git_commit}}). Now I'll reconcile the story file."

**📢 Orchestrator says (if max iterations reached):**
> "We've gone through {{max_iterations}} fix cycles and there are still {{remaining}} issues. I'll need your input on whether to proceed anyway or address these manually."
