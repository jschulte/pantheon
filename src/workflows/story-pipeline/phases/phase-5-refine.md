# Phase 5: REFINE (5/7)
<!-- Part of Story Pipeline v1.1 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 PHASE 5: REFINE (5/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Metis fixes + iterate until clean (max 3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Skip Conditions

```
Note: CODE_HEALTH items are excluded from MUST_FIX_COUNT and do not block the pipeline.
They are tracked to GitHub Issues after SHOULD_FIX processing in section 5.3.5.

IF (MUST_FIX_COUNT == 0) AND (task_completion_pct >= 95):
  → Skip REFINE phase entirely
  → Proceed to Phase 6: COMMIT

ELIF (MUST_FIX_COUNT == 0) AND (task_completion_pct < 95):
  → Trigger COMPLETION LOOP (not bug-fix loop)
  → Resume Metis with directive to complete remaining tasks
  → Max 2 iterations for task completion

ELSE:
  → Execute standard REFINEMENT LOOP (fix MUST_FIX issues)
  → Max 3 iterations
```

### Completion Loop (When Clean Code But Incomplete Tasks)

**Trigger:** 0 MUST_FIX issues, but task completion < 95%

This addresses the pattern where builders defer "manual QA" or "integration tests" instead of automating them.

```
ITERATION = 1
MAX_COMPLETION_ITERATIONS = 2

WHILE (task_completion_pct < 95) AND (ITERATION <= MAX_COMPLETION_ITERATIONS):

  # Iteration 1: Resume Metis (builder knows the context)
  IF ITERATION == 1:
    Task({
      subagent_type: "general-purpose",
      model: "opus",
      description: "🔨 Metis completing remaining tasks (iteration 1) on {{story_key}}",
      resume: "{{BUILDER_AGENT_ID}}",
      prompt: `
You have {{unchecked_count}} unchecked tasks remaining out of {{total_tasks}}.

**DIRECTIVE: COMPLETE THESE TASKS. DO NOT DEFER.**

<unchecked_tasks>
{{list of unchecked tasks from story file}}
</unchecked_tasks>

**Required actions:**
- "Manual QA" → Write Playwright E2E tests
- "Test with live database" → Write integration tests with test DB setup
- "Visual verification" → Playwright screenshot tests
- "Staging deployment" → Write deployment automation or document procedure
- "Integration testing" → Write automated integration test suite

**NOT acceptable:**
- Marking tasks as "requires human" when automation is possible
- Deferring tasks because "needs infrastructure" (set up test infrastructure!)
- Stopping at <95% completion

Complete the work. Run tests. Report when done or genuinely blocked.
`
    })

  # Iteration 2: Invoke Teleos (story-closer agent - more aggressive)
  ELSE:
    Task({
      subagent_type: "general-purpose",
      model: "opus",
      description: "🏁 Teleos (story-closer) completing {{story_key}}",
      prompt: `
You are TELEOS 🔧 - the story-closer completion agent.

Metis attempted to complete this story but {{unchecked_count}} tasks remain.

Load the story-closer workflow:
  {{project_root}}/_bmad/pantheon/workflows/story-closer/workflow.md

Execute ONLY the Teleos worker logic (not the full workflow):
1. Read story file: {{story_file}}
2. Analyze {{unchecked_count}} unchecked tasks
3. For each task:
   - "Manual QA" → Write Playwright E2E test
   - "Visual verification" → Playwright screenshot test
   - "Integration test" → Write integration test with test DB
   - "Deployment" → Write deployment automation script or detailed runbook
   - If genuinely human-only (PR review, product sign-off), mark as validated
4. Check off completed tasks with evidence
5. Report final completion percentage

**You are more aggressive than Metis.** Don't accept "needs infrastructure" as
an excuse - BUILD the test infrastructure. Don't accept "manual QA" - WRITE
the automated test.

Story: {{story_key}}
Unchecked tasks: {{unchecked_count}}
Sprint artifacts: {{sprint_artifacts}}
`
    })

  # Quick verification (no full review needed - just check tasks got done)
  Read story file, count checked vs unchecked tasks

  IF task_completion_pct >= 95:
    BREAK  # Success!

  ITERATION++

END WHILE

IF task_completion_pct < 95 AND ITERATION > MAX_COMPLETION_ITERATIONS:
  → Log warning: "Completion loop exhausted (tried Metis + Teleos). {{unchecked_count}} tasks genuinely require human intervention. Proceeding to COMMIT with in-progress/review status."
  → Continue to Phase 6 (story will be marked in-progress or review based on percentage)
```

### Iterative Refinement Loop (When MUST_FIX Issues Exist)

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

  Save to: {{sprint_artifacts}}/completions/{{story_key}}-{{spec.id}}-verify.json
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

  Run scoped tests to confirm nothing is broken:
  \`npx jest --findRelatedTests {{modified_files}}\`
  \`npx tsc --noEmit --incremental\`
  `
  })
```

### 5.3 Fresh eyes on iteration 2+

On iteration 2+, add ONE fresh reviewer (possibly Iris if frontend files).
This is IN ADDITION to the compact verification above — fresh eyes catch what tunnel vision misses.

**END WHILE**

### 5.3.5 Best-Effort SHOULD_FIX Fixes

After all MUST_FIX issues are resolved (or max iterations reached), attempt SHOULD_FIX items.
**This is non-blocking — failures do not prevent commit.**

```
IF should_fix_count > 0 AND should_fix_behavior.fix_enabled:
  Task({
    subagent_type: "general-purpose",
    model: "sonnet",
    description: "🔧 Best-effort SHOULD_FIX fixes on {{story_key}}",
    prompt: `
  You are Metis 🔨 performing best-effort improvements on {{story_key}}.

  These are SHOULD_FIX items — nice-to-have improvements. Fix what you can
  with localized changes. **Do not attempt large refactors.**

  <should_fix_issues>
  {{SHOULD_FIX issues with file:line citations}}
  </should_fix_issues>

  **Evaluation criteria for each item:**
  - FIX if: 1-3 files, <50 lines, clear improvement, no design changes
  - DEFER if: Multi-file refactor, architectural change, out of scope

  For each item, output:
  { "issue_id": "...", "action": "fixed" | "deferred", "reason": "..." }

  For deferred items, include:
  - "reason_deferred": What made it too large
  - "effort_estimate": "small" | "medium" | "large"
  - "recommendation": What someone should do later

  Run tests after fixes. If any test breaks, revert that fix and defer the item.

  Save to: {{sprint_artifacts}}/completions/{{story_key}}-should-fix.json
  `
  })

  # Track deferred items per config
  deferred_issues_config = load_config("deferred_issues")

  NEW_FINDINGS=0
  KNOWN_FINDINGS=0

  IF deferred_issues_config.tracking_method == "tracked_issues_file":
    # ── Read or init tracked-issues.json ──
    TRACKED_FILE="{{sprint_artifacts}}/tracked-issues.json"
    IF file_exists(TRACKED_FILE):
      tracked = JSON.parse(read(TRACKED_FILE))
    ELSE:
      tracked = { "version": 1, "last_updated": null, "issues": [] }

    issue_map = {}
    FOR EACH entry IN tracked.issues:
      issue_map[entry.id] = entry

    # ── Upsert deferred SHOULD_FIX items ──
    FOR EACH deferred item:
      KEY = "should-fix::{{file}}"
      sighting = { "date": "{{today}}", "source": "story-pipeline on {{story_key}}", "title": "{{issue_title}}" }

      IF KEY in issue_map:
        issue_map[KEY].seen_count += 1
        issue_map[KEY].last_seen = "{{today}}"
        issue_map[KEY].sightings.append(sighting)
        KNOWN_FINDINGS++
      ELSE:
        issue_map[KEY] = {
          "id": KEY, "type": "should-fix", "file": "{{file}}", "line": {{line}},
          "locations": null, "perspective": "{{perspective}}", "severity": "{{severity}}",
          "description": "{{issue_description}}", "suggested_fix": "{{suggested_fix}}",
          "reason_deferred": "{{reason_deferred}}", "effort_estimate": "{{effort_estimate}}",
          "pattern_type": null, "source_workflow": "story-pipeline", "source_scope": "{{story_key}}",
          "first_seen": "{{today}}", "last_seen": "{{today}}", "seen_count": 1,
          "sightings": [sighting], "status": "open"
        }
        NEW_FINDINGS++

    # ── Upsert CODE_HEALTH items ──
    IF code_health_count > 0:
      FOR EACH code_health_item:
        PRIMARY_FILE = first_location_file("{{locations}}")
        KEY = "code-health::${PRIMARY_FILE}"
        sighting = { "date": "{{today}}", "source": "story-pipeline on {{story_key}}", "title": "{{issue_title}}" }

        IF KEY in issue_map:
          issue_map[KEY].seen_count += 1
          issue_map[KEY].last_seen = "{{today}}"
          issue_map[KEY].sightings.append(sighting)
          KNOWN_FINDINGS++
        ELSE:
          issue_map[KEY] = {
            "id": KEY, "type": "code-health", "file": "${PRIMARY_FILE}", "line": null,
            "locations": "{{locations}}", "perspective": "{{perspective}}", "severity": "{{severity}}",
            "description": "{{issue_description}}", "suggested_fix": null,
            "reason_deferred": null, "effort_estimate": "{{effort_estimate}}",
            "pattern_type": "{{pattern_type}}", "source_workflow": "story-pipeline",
            "source_scope": "{{story_key}}", "first_seen": "{{today}}", "last_seen": "{{today}}",
            "seen_count": 1, "sightings": [sighting], "status": "open"
          }
          NEW_FINDINGS++

    # ── Write back ──
    tracked.last_updated = "{{ISO timestamp}}"
    tracked.issues = Object.values(issue_map)
    write(TRACKED_FILE, JSON.stringify(tracked, null, 2))
    echo "Tracked issues: ${NEW_FINDINGS} new, ${KNOWN_FINDINGS} seen again"

  ELIF deferred_issues_config.tracking_method == "github_issues":
    FOR EACH deferred item:
      gh issue create \
        --title "[Tech Debt] {{issue_title}}" \
        --body "Found during story-pipeline on {{story_key}}. {{issue_description}}. File: {{file}}:{{line}}. Why deferred: {{reason_deferred}} ({{effort_estimate}})" \
        --label "tech-debt" --label "should-fix"
      NEW_FINDINGS++

    IF code_health_count > 0:
      FOR EACH code_health_item:
        gh issue create \
          --title "[Code Health] {{issue_title}}" \
          --body "Found during story-pipeline on {{story_key}}. {{issue_description}}. Locations: {{locations}}. Pattern: {{pattern_type}}." \
          --label "tech-debt" --label "code-health"
        NEW_FINDINGS++

    echo "GitHub Issues: ${NEW_FINDINGS} created"

  ELIF deferred_issues_config.tracking_method == "local_file":
    Append to {{project_root}}/KNOWN_ISSUES.md:
      ## [{{date}}] Story {{story_key}}
      | Issue | File | Why Deferred | Effort |
      |-------|------|-------------|--------|
      | {{title}} | {{file}}:{{line}} | {{reason}} | {{est}} |

    IF code_health_count > 0:
      Append to {{project_root}}/KNOWN_ISSUES.md:
        ## [{{date}}] Story {{story_key}} — CODE_HEALTH
        | Observation | Locations | Pattern Type |
        |------------|-----------|--------------|
        | {{title}} | {{locations}} | {{pattern_type}} |

  echo "Deferred tracking: ${NEW_FINDINGS} new, ${KNOWN_FINDINGS} seen again"
```

**Post-loop:**
- If max iterations reached, escalate to user
- SHOULD_FIX items that were fixed are included in the commit
- SHOULD_FIX items deferred are tracked per `deferred_issues` config
- STYLE items are discarded (no action needed)

### Update Progress

Update `{{sprint_artifacts}}/completions/{{story_key}}-progress.json`:
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
# Stage ONLY files from the builder completion artifact (targeted git add)
# This prevents accidentally committing debug code, temp files, or parallel work
BUILDER_ARTIFACT="{{sprint_artifacts}}/completions/{{story_key}}-metis.json"
if [ -f "$BUILDER_ARTIFACT" ]; then
  # Extract file lists from builder artifact and stage them
  FILES_CREATED=$(node -e "const a=JSON.parse(require('fs').readFileSync('$BUILDER_ARTIFACT'));(a.files_created||[]).forEach(f=>console.log(f))")
  FILES_MODIFIED=$(node -e "const a=JSON.parse(require('fs').readFileSync('$BUILDER_ARTIFACT'));(a.files_modified||[]).forEach(f=>console.log(f))")
  echo "$FILES_CREATED" "$FILES_MODIFIED" | xargs git add
else
  # Fallback: stage common implementation directories (less precise)
  git add src/ lib/ app/ components/ pages/ public/ prisma/ tests/ __tests__/
fi
git add package.json package-lock.json tsconfig.json
# Stage sprint artifacts
git add {{sprint_artifacts}}/

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
