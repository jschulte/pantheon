# Phase 3: EXECUTE (3/4)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 PHASE 3: EXECUTE (3/4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Autonomous batch execution
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3.1 Initialize Batch State

```
batch_results = {
  completed: [],
  blocked: [],
  routed_to_pipeline: [],
  blocker_questions: [],
  human_validation_tasks: [],
  errors: []
}
```

### 3.2 Route by Execution Mode

```
IF execution_mode == "sequential":
  → Execute 3.3 (Sequential Processing)

IF execution_mode == "parallel":
  → Execute 3.4 (Parallel Processing)
```

### 3.3 Sequential Processing

For each story in `selected_stories`, in order:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Processing {{story_key}} ({{index}}/{{total}})
   {{unchecked}} tasks remaining
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**IF story.category == "NEEDS_PIPELINE":**
- Log to `batch_results.routed_to_pipeline`
- Display: "🔀 {{story_key}} routed to full story-pipeline (>30% unchecked)"
- Continue to next story

**IF story.category == "CLOSEABLE":**
- Spawn Teleos worker agent:

```
Task({
  subagent_type: "general-purpose",
  description: "🔧 Teleos closing {{story_key}}",
  prompt: `
You are Teleos, the Story Closer worker agent.

Read your full instructions from:
  src/workflows/story-closer/agents/closer-worker.md

Then execute the closer flow for this story:

- story_key: {{story_key}}
- story_file: {{story_file}}
- sprint_artifacts: {{sprint_artifacts}}
- unchecked_count: {{unchecked}}
- current_date: {{date}}

Human-validation patterns to skip:
{{human_validation_patterns from workflow.md config}}

CRITICAL: Return a structured JSON result as your final output.
Do NOT stop to ask questions — log blockers and continue.
`
})
```

- Parse Teleos result
- Merge into `batch_results`
- Display per-story status:

```
IF result.status == "completed":
  "✅ {{story_key}} — {{tasks_completed}}/{{tasks_total}} tasks done, committed"

IF result.status == "partial":
  "⚠️ {{story_key}} — {{tasks_completed}}/{{tasks_total}} tasks done, {{blocked_count}} blocked"

IF result.status == "error":
  "❌ {{story_key}} — Error: {{error_message}}"
```

Continue to next story.

### 3.4 Parallel Processing

Group selected stories into waves. Wave size depends on story count:
- ≤5 stories: 1 wave (all at once)
- 6-15 stories: waves of 5
- 16+ stories: waves of 8

**For each wave:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Wave {{wave_num}}/{{total_waves}}
   Processing {{wave_size}} stories in parallel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Route NEEDS_PIPELINE stories first** (just log them, no spawn needed).

**Spawn Teleos workers in parallel for CLOSEABLE stories:**

```
FOR EACH closeable story in wave:
  Task({
    subagent_type: "general-purpose",
    description: "🔧 Teleos closing {{story_key}}",
    run_in_background: true,
    prompt: `[same prompt as sequential mode]`
  })
```

Wait for all workers in wave to complete. Collect results.

**Display wave summary:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Wave {{wave_num}} Complete
   ✅ {{completed}} completed
   ⚠️ {{partial}} partial
   ❌ {{errors}} errors
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Continue to next wave until all waves complete.

### 3.5 Aggregate Results

After all stories processed (sequential or parallel):

```
batch_results = {
  completed: [{story_key, tasks_completed, tasks_total, commit_hash}, ...],
  blocked: [{story_key, tasks_completed, tasks_total, blocked_tasks}, ...],
  routed_to_pipeline: [{story_key, unchecked_count, pct_unchecked}, ...],
  blocker_questions: [{story_key, task, question}, ...],
  human_validation_tasks: [{story_key, task_text}, ...],
  errors: [{story_key, error_message}, ...]
}
```

### 3.6 Display Batch Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 BATCH EXECUTION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Completed:          {{completed_count}}
  ⚠️ Partially blocked:  {{blocked_count}}
  🔀 Routed to pipeline: {{routed_count}}
  ❌ Errors:             {{error_count}}

  ❓ Blocker questions:   {{question_count}} (see debrief)
  👤 Human validation:    {{human_task_count}} (see debrief)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3.7 Proceed to Phase 4

Pass `batch_results` to Phase 4.

**Proceeding to debrief...**

Load and execute `phases/phase-4-debrief.md`.
