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

### 3.4 Parallel Processing (Worktree Isolation)

Uses the same persistent worktree + early integration pattern as batch-stories.
Each worktree gets its own filesystem, `node_modules`, and git branch — no contention.

**Step 1: Create Integration Branch + Persistent Worktrees**

```
INTEGRATION = "integration"
Bash("git branch {{INTEGRATION}} HEAD")

max_worktrees = 3  # matches batch-stories parallel_config
WORKTREES = {}

FOR n IN 1..max_worktrees:
  branch = "worktree/teleos-{{n}}"
  path = "{{project_root}}/.claude/worktrees/teleos-{{n}}"
  Bash("git worktree add -b {{branch}} {{path}} HEAD")
  Bash("cd {{path}} && npm ci")
  WORKTREES[n] = { path, branch, stories: [], agent_task_id: null }
```

**Step 2: Assign Stories to Worktrees**

Route NEEDS_PIPELINE stories first (log them, no spawn needed).

For CLOSEABLE stories:
- If story depends on another assigned story → same worktree
- Otherwise → worktree with fewest stories (load balance)

```
FOR EACH closeable story IN selected_stories:
  IF story.depends_on intersects any worktree's story list:
    target_wt = worktree containing the dependency
  ELSE:
    target_wt = worktree with fewest stories
  WORKTREES[target_wt].stories.append(story)
```

**Step 3: Spawn Initial Workers (One Story Per Worker)**

Each worker gets exactly ONE story. When a worker finishes, the lead merges to integration
and spawns a NEW worker in the same worktree for the next story in that worktree's queue.

```
FUNCTION spawn_teleos_in_worktree(wt_id, wt, story):
  is_first_story = (wt.completed_count == 0)

  agent = Task({
    subagent_type: "general-purpose",
    description: "🔧 Teleos: {{story.story_key}} (wt-{{wt_id}})",
    run_in_background: true,
    prompt: `
You are Teleos, the Story Closer worker agent.

Read your full instructions from:
  src/workflows/story-closer/agents/closer-worker.md

## Worktree Mode
- worktree_mode: true
- worktree_path: {{wt.path}}
- You OWN this worktree. Commit freely, no lock protocol needed.

## Your Assignment — ONE Story
- story_key: {{story.story_key}}
- story_file: {{story.story_file}}
- unchecked_count: {{story.unchecked}}

{{IF NOT is_first_story:}}
## Pre-Flight: Pull Integration
Before starting, pull the latest integration branch:
  cd {{wt.path}} && git merge integration --no-edit
{{END IF}}

sprint_artifacts: {{sprint_artifacts}}
current_date: {{date}}

Human-validation patterns to skip:
{{human_validation_patterns from workflow.md config}}

CRITICAL: Return a structured JSON result as your final output.
Do NOT stop to ask questions — log blockers and continue.
`
  })
  WORKTREES[wt_id].agent_task_id = agent.task_id
  WORKTREES[wt_id].current_story = story

# Spawn first story in each worktree
FOR EACH (wt_id, wt) IN WORKTREES WHERE wt.stories is not empty:
  wt.story_index = 0
  wt.completed_count = 0
  spawn_teleos_in_worktree(wt_id, wt, wt.stories[0])
```

**Step 4: Monitor, Early Integration, Re-Dispatch**

```
WHILE any workers active OR any worktrees have remaining stories:
  FOR EACH (wt_id, wt) IN WORKTREES WHERE wt.agent_task_id is not null:
    result = TaskOutput(task_id=wt.agent_task_id, block=false, timeout=5000)

    IF result.status == "completed":
      # Merge worktree branch into integration
      Bash("git checkout {{INTEGRATION}} && git merge {{wt.branch}} --no-edit && git checkout -")
      Parse result, merge into batch_results
      wt.completed_count++
      wt.agent_task_id = null

      # Re-dispatch: spawn new worker for next story in this worktree's queue
      wt.story_index++
      IF wt.story_index < wt.stories.length:
        next_story = wt.stories[wt.story_index]
        spawn_teleos_in_worktree(wt_id, wt, next_story)

    ELIF result.status == "failed":
      batch_results.errors.append({ story_key: wt.current_story.story_key, error: result.error })
      wt.agent_task_id = null
      wt.story_index++
      IF wt.story_index < wt.stories.length:
        next_story = wt.stories[wt.story_index]
        spawn_teleos_in_worktree(wt_id, wt, next_story)

  sleep(10s)
```

**Step 5: Final Merge + Cleanup**

```
# Merge integration into main
Bash("git checkout main && git merge {{INTEGRATION}} --no-edit")

# Cleanup worktrees and branches
FOR EACH (wt_id, wt) IN WORKTREES:
  Bash("git worktree remove {{wt.path}}")
  Bash("git branch -d {{wt.branch}}")
Bash("git branch -d {{INTEGRATION}}")
```

**Display batch summary:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Parallel Execution Complete
   ✅ {{completed}} completed
   ⚠️ {{partial}} partial
   ❌ {{errors}} errors
   🔀 {{routed}} routed to pipeline
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

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
