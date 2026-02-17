# Phase 8: AUTO-CLOSE (8/8)
<!-- Part of Story Pipeline v1.2 — automatic story-closer invocation -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏁 PHASE 8: AUTO-CLOSE (8/8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Story-Closer: Push incomplete stories to 100%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Purpose

After Phase 7 (REFLECT) completes, check if the story is truly done or if story-closer can push it to 100%. This prevents stories from being marked "in-progress" or "review" when they're actually closeable.

### Trigger Conditions

```
Read: {{sprint_artifacts}}/completions/{{story_key}}-reconciler.json

task_completion_pct = reconciler.tasks_checked / reconciler.tasks_total

IF task_completion_pct >= 95:
  → ✅ Story is DONE. Skip Phase 8.
  → Pipeline complete.

ELIF task_completion_pct >= 70 AND task_completion_pct < 95:
  → 🏁 Invoke story-closer
  → Try to push to 100%

ELSE:
  → ⚠️ Story is <70% complete. Pipeline stops here.
  → Log: "Story {{story_key}} is {{task_completion_pct}}% complete. Too incomplete for story-closer. Needs full re-implementation."
```

### 8.1 Invoke Story-Closer

When triggered (70-94% completion), automatically invoke the story-closer workflow:

```
Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "🏁 Story-closer pushing {{story_key}} to completion",
  prompt: `
You are executing the Story-Closer workflow in auto-invoke mode.

Load workflow from: {{project_root}}/_bmad/pantheon/workflows/story-closer/workflow.md

**Batch mode** - pre-selected single story (skip Phase 2 PRESENT):

Story to close:
- {{story_key}} ({{task_completion_pct}}% complete)

**Context from pipeline:**
- Pipeline phases 1-7 completed successfully
- Code quality: {{must_fix_count}} MUST_FIX, {{should_fix_count}} SHOULD_FIX
- Tests: {{tests_passing}} passing
- Unchecked tasks: {{unchecked_count}}

**Story-closer directive:**
Execute Phase 3 (spawn Teleos worker) to:
1. Analyze remaining {{unchecked_count}} unchecked tasks
2. Write Playwright E2E tests for "manual QA" items
3. Write integration tests for "deployment verification" items
4. Document deployment procedures where automation isn't possible
5. Reconcile and close the story

Then execute Phase 4 (debrief) and report:
- Final completion percentage
- Whether story was CLOSED or still needs work
- What remains (if any)

Sprint artifacts: {{sprint_artifacts}}
`
})
```

### 8.2 Handle Story-Closer Result

Read the story-closer output and determine final status:

```
IF story_closer_result.status == "CLOSED":
  → ✅ Story pushed to completion!
  → Final sprint-status should be "done"
  → Log: "Story-closer successfully completed {{story_key}}. Final completion: {{final_pct}}%"

ELIF story_closer_result.status == "STILL_INCOMPLETE":
  → ⚠️ Story-closer couldn't complete
  → Final sprint-status remains "in-progress" or "review"
  → Log: "Story-closer attempted but {{remaining_count}} tasks genuinely require human intervention: {{reasons}}"

ELIF story_closer_result.status == "ROUTED_TO_PIPELINE":
  → 🔄 Story has >30% unchecked, needs full pipeline
  → This shouldn't happen if Phase 8 trigger logic is correct
  → Log: "ERROR: Story-closer routed back to pipeline. Check trigger logic."
```

### 8.3 Update Progress

Update `{{sprint_artifacts}}/completions/{{story_key}}-progress.json`:

```json
{
  "current_phase": "COMPLETE",
  "phases": {
    ...
    "REFLECT": { "status": "complete", "details": "..." },
    "AUTO_CLOSE": {
      "status": "complete",
      "details": "Story-closer invoked, final completion: {{final_pct}}%",
      "story_closer_result": "{{CLOSED|STILL_INCOMPLETE}}"
    }
  },
  "metrics": {
    "final_completion_pct": {{final_pct}},
    "story_closer_invoked": true,
    "pipeline_version": "1.2"
  }
}
```

### 8.4 Final Pipeline Summary

**📢 Orchestrator says (if story-closer succeeded):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 PIPELINE + AUTO-CLOSE COMPLETE: {{story_key}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phases 1-7: Pipeline completed at {{pipeline_pct}}%
Phase 8: Story-closer pushed to {{final_pct}}%

Final Status: DONE ✅

{{story_key}} is now fully complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**📢 Orchestrator says (if story-closer couldn't complete):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ PIPELINE COMPLETE BUT STORY INCOMPLETE: {{story_key}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phases 1-7: Pipeline completed at {{pipeline_pct}}%
Phase 8: Story-closer attempted but {{remaining_count}} tasks remain

Remaining work requires:
{{human_validation_categories}}

Status: {{in-progress|review}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Configuration Changes Required

Update `workflow.md` or `workflow.yaml` to change:

```diff
-phases: 7  # PREPARE → FORGE → BUILD → VERIFY → ASSESS → REFINE → REFLECT
+phases: 8  # PREPARE → FORGE → BUILD → VERIFY → ASSESS → REFINE → REFLECT → AUTO-CLOSE
```

**Benefits:**
- Eliminates manual story-closer invocation
- Stories either reach 95%+ or exhaust all automation options
- Clear signal when human intervention is truly needed
- Higher completion rate (70-94% stories get automatic second push)
