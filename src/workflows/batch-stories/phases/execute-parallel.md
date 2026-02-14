# Phase: Execute Parallel (Swarm Mode)
<!-- Batch Stories phase file — see workflow.md for config and routing -->

<step name="execute_parallel" if="mode == parallel">
**Parallel Processing with TeammateTool Swarm**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 PARALLEL PROCESSING (SWARM MODE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Requires:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` environment variable set before launching Claude Code.
This feature is **experimental** and may change. See Claude Code Agent Teams documentation.
**Uses dependency graph from analysis step.** Tasks are created in Step 1.5 (after TeamCreate)
to ensure they land in the team's task list context.

Workers self-schedule from the shared task list. Dependencies are enforced via `addBlockedBy`
constraints — workers automatically skip blocked tasks and grab unblocked ones. No wave
planning or batch synchronization needed.

### Pre-Flight: Permissions & Delegate Mode

**Pre-approve permissions** in Claude Code settings before starting a batch run. Workers
operate autonomously and cannot prompt for permission mid-execution. In your settings or
`CLAUDE.md`, pre-approve:
- File read/write in the project directory
- Bash commands for `npm test`, `git add`, `git commit`, `npx`, etc.
- Task agent spawning (sub-agents within teammates)

**Delegate mode (recommended):** Use `Shift+Tab` to switch the lead session to delegate mode.
This ensures the orchestrator coordinates work without accidentally implementing stories itself.
The lead should only manage tasks, monitor progress, and reconcile results.

### Step 1: Create Swarm Team

```
TeamCreate({
  team_name: "batch-{{epic_or_timestamp}}",
  description: "Batch story implementation for {{story_count}} stories"
})
```

The team name uses the epic number if filtering by epic (e.g., `batch-5`), otherwise
a timestamp (e.g., `batch-20260203`).

### Step 1.5: Populate Team Task List

**Prerequisites:** TeamCreate completed (Step 1). DEPENDENCY_GRAPH available from `analyze_dependencies`.

Now that the team exists, create tasks in the team context so workers can see them.
Tasks created here land in `~/.claude/tasks/{team-name}/` — the shared task list that
workers access via TaskList.

```
# Create a task for each story in the dependency graph
TASK_IDS = {}  # Map story_key → task_id

FOR EACH story IN DEPENDENCY_GRAPH:
  task = TaskCreate(
    subject="Story {{story.story_key}}: {{story.story_title}}",
    description="""
      story_key: {{story.story_key}}
      story_file: {{story.story_file}}
      complexity_level: {{story.complexity}}
      story_title: {{story.story_title}}

      Execute the full story-pipeline for this story.
      Load the story file, run all 7 phases (PREPARE through REFLECT),
      and report results via SendMessage to team-lead.
    """,
    activeForm="Processing story {{story.story_key}}"
  )
  TASK_IDS[story.story_key] = task.id

# Set dependency constraints using stored task IDs
FOR EACH story IN DEPENDENCY_GRAPH:
  IF story.depends_on is not empty:
    FOR EACH dep_key IN story.depends_on:
      TaskUpdate(
        taskId=TASK_IDS[story.story_key],
        addBlockedBy=[TASK_IDS[dep_key]]
      )
```

**Verify tasks are in team context:**

```
VERIFY = TaskList()
IF VERIFY has no tasks:
  → ERROR: "Task list is empty after population. TaskCreate calls may have
     landed in wrong context. Verify TeamCreate completed before TaskCreate."
  → HALT

UNBLOCKED = VERIFY WHERE status=="pending" AND owner==empty AND blockedBy==empty
IF UNBLOCKED is empty:
  → WARN: "All tasks are blocked. Check dependency graph for circular dependencies."
  → HALT

Display:
  "✅ {{VERIFY.length}} tasks created in team context.
   {{UNBLOCKED.length}} unblocked and ready for workers."
```

### Step 1.75: Spawn Quality Gate Coordinator (Optional)

**When to spawn Hygeia:** If `max_workers >= 2` (parallel workers will contend for CPU),
spawn Hygeia as a team member before any workers. Hygeia serializes expensive quality
checks (type-check, build, full test suite) so only one runs at a time.

**Load the coordinator persona:**
Read: `{installed_path}/agents/hygeia.md`

```
Task({
  subagent_type: "general-purpose",
  team_name: "batch-{{epic_or_timestamp}}",
  name: "hygeia",
  model: "sonnet",  # Hygeia just runs bash commands, doesn't need opus
  run_in_background: true,
  prompt: `
You are Hygeia, the Quality Gate Coordinator for a batch-stories swarm.

## Your Instructions

Read this file NOW, then follow it exactly:
  {{project_root}}/_bmad/pantheon/workflows/batch-stories/agents/hygeia.md

## Project Context

- Project root: {{project_root}}
- Working directory for checks: {{project_root}}/app
- Team name: batch-{{epic_or_timestamp}}

## Critical Rules

- You ONLY run quality checks. Never modify code.
- Process messages one at a time (serialization is the point).
- Cache results when git state hasn't changed.
- Always respond to every request — workers are waiting.
`
})
```

Workers will detect Hygeia's presence by reading the team config file and
route quality check requests through her instead of running checks independently.

**Skip Hygeia when:**
- `max_workers == 1` (no contention with sequential/single worker)
- User explicitly opts out via prompt argument

### Step 2: Spawn Workers On-Demand (Demand-Based Spawning)

**Prerequisites:**
- TeamCreate completed (Step 1)
- Tasks populated in team context (Step 1.5)
- At least 1 unblocked task verified via TaskList

```
VERIFY = TaskList()
IF VERIFY has no tasks:
  → ERROR: "Task list is empty after population. Check TaskCreate calls."
  → HALT

UNBLOCKED = VERIFY WHERE status=="pending" AND owner==empty AND blockedBy==empty
IF UNBLOCKED is empty:
  → WARN: "All tasks are blocked. Check dependency graph for issues."
  → HALT
```

**Do NOT spawn all workers upfront.** Only spawn a worker when there is an unblocked
task for it to claim. This prevents idle workers from rationalizing work on blocked tasks.

**Load the worker persona once:**
Read: `{installed_path}/agents/heracles.md`

**Worker naming — Greek hero roster (rotate through as needed):**

```
HERO_NAMES = ["heracles", "theseus", "perseus", "atalanta", "achilles",
              "odysseus", "diomedes", "bellerophon", "orion", "patroclus"]
# Each worker gets the next unused name from the roster.
# If max_workers=3, the first three spawned are: heracles, theseus, perseus
```

**Spawning rules:**

```
# Count currently unblocked, unclaimed tasks
UNBLOCKED_TASKS = TaskList() WHERE status=="pending" AND owner==empty AND blockedBy==empty
ACTIVE_WORKERS = count of currently running workers

# Only spawn enough workers to cover available work (up to max_workers)
WORKERS_NEEDED = min(UNBLOCKED_TASKS.length, max_workers) - ACTIVE_WORKERS

IF WORKERS_NEEDED <= 0:
  → No workers needed yet. Wait for tasks to unblock.

FOR i IN 1..WORKERS_NEEDED:
  HERO_NAME = HERO_NAMES[next_hero_index++]

  Task({
    subagent_type: "general-purpose",
    team_name: "batch-{{epic_or_timestamp}}",
    name: "{{HERO_NAME}}",
    model: "{{worker_model}}",  # from workflow.yaml (default: opus)
    run_in_background: true,
    prompt: `
You are {{HERO_NAME}}, a story-pipeline worker in a batch-stories swarm.

## Your Instructions

Read these two files NOW, then follow them exactly:

1. **Your persona & self-scheduling loop:**
   {{project_root}}/_bmad/pantheon/workflows/batch-stories/agents/heracles.md

2. **The 7-phase pipeline you execute for each story:**
   {{project_root}}/_bmad/pantheon/workflows/story-pipeline/workflow.md

## Project Context

- Project root: {{project_root}}
- Sprint artifacts: {{sprint_artifacts_path}}
- Pipeline config: {{project_root}}/_bmad/pantheon/workflows/story-pipeline/workflow.yaml
- Agent routing: {{project_root}}/_bmad/pantheon/workflows/story-pipeline/agent-routing.yaml

## Critical Rules

- Load and follow the workflow files. Do NOT paraphrase or improvise pipeline phases.
- You CAN and MUST spawn Task sub-agents for BUILD, VERIFY, ASSESS, REFINE, and REFLECT phases.
  (Note: The "no nested teams" restriction in Agent Teams only prevents calling TeammateTool
  from within a teammate. It does NOT prevent spawning Task sub-agents — those work normally.)
- Do NOT write implementation code yourself — delegate to builder agents.
- Do NOT self-certify code — spawn independent reviewer agents.
- Do NOT work on blocked tasks. If no unblocked tasks exist, send idle message and stop.
`
  })
```

**Optional: Plan approval gate for complex+ stories:**

For stories scored `complex` or `critical`, you may optionally enable a plan approval gate
where the orchestrator reviews the Heracles worker's execution plan before it starts building.
This adds latency but catches misunderstood requirements early:

```
IF complexity_level in [complex, critical] AND plan_approval_gate enabled:
  Worker sends plan via SendMessage to team-lead BEFORE Phase 2 BUILD
  Team-lead reviews and replies with approval or corrections
  Worker proceeds only after approval
```

This is opt-in. For most batch runs, autonomous execution is preferred.

**When to spawn additional workers:**

After each worker completes a story and tasks unblock, check if new workers are needed:

```
ON worker_completion_message:
  # Completing a story may unblock downstream tasks
  UNBLOCKED = TaskList() WHERE status=="pending" AND owner==empty AND blockedBy==empty
  ACTIVE = count of running workers (excluding the one that just finished — it will self-schedule)

  IF UNBLOCKED.length > ACTIVE AND ACTIVE < max_workers:
    # More unblocked work than active workers — spawn additional
    SPAWN_COUNT = min(UNBLOCKED.length - ACTIVE, max_workers - ACTIVE)
    → Spawn SPAWN_COUNT new workers (same prompt as above)
```

**Example with linear chain (36-1 → 36-2 → 36-3 → 36-4 → fan-out):**

```
Initial:  1 task unblocked (36-1)  → spawn 1 worker (heracles)
36-1 done: 1 task unblocked (36-2) → heracles self-schedules, no new spawn needed
36-2 done: 1 task unblocked (36-3) → heracles self-schedules, no new spawn needed
36-3 done: 1 task unblocked (36-4) → heracles self-schedules, no new spawn needed
36-4 done: 5 tasks unblock (36-5 through 36-9) → spawn 2 more (theseus, perseus)
```

This avoids spawning 3 workers when only 1 has work, which wastes tokens and creates
the "idle worker works on blocked task" problem.

### Step 3: Monitor Progress via Idle Notifications

> **WARNING: No Session Resumption for Teammates**
>
> If the lead session crashes or is interrupted, `/resume` does **NOT** restore teammates.
> Teammates and their context are lost. The **only** recovery path is through progress
> artifacts (`completions/*-progress.json`). After resuming the lead session:
> 1. Read progress artifacts to determine which stories completed
> 2. Mark completed stories as done
> 3. Create a new team and re-spawn workers for remaining stories
> This is why progress artifacts are written after EVERY phase — they are the crash recovery mechanism.

**Workers send messages automatically.** The orchestrator receives:

- **Completion messages** — Worker reports story results via `SendMessage`
- **Failure messages** — Worker reports story failure with phase and reason
- **Blocker messages** — Worker requests help from team lead
- **Idle notifications** — Automatic when a worker has no more work to do

**No polling loop needed.** Messages are delivered automatically as new conversation turns.

**When a completion message arrives:**

```
Received from heracles:
  "Story 5-1 COMPLETE - 25 tests, 97.6% cov, 4->0 issues, commit 8a1a0f0"

→ VERIFY ARTIFACTS FIRST (see below)
→ Log to progress tracker
→ Reconcile story (Step 5)
→ Check if completed story unblocks new tasks → spawn additional workers if needed
→ Check if all stories done
```

**Artifact Verification (MANDATORY before accepting completion):**

Before trusting a worker's completion report, verify that the pipeline actually ran:

```
story_key = extract from completion message (e.g., "5-1")
artifacts_dir = "{sprint_artifacts}/completions/"

# 1. Progress artifact must exist and show COMPLETE
progress = Read("{artifacts_dir}/{story_key}-progress.json")
IF progress missing OR progress.status != "SUCCESS":
  → Flag: "Worker reported success but progress artifact missing/incomplete"
  → Do NOT mark story as done

# 2. Builder artifact must exist (proves BUILD phase ran with sub-agent)
builder_exists = Glob("{artifacts_dir}/{story_key}-metis.json") OR
                 Glob("{artifacts_dir}/{story_key}-apollo.json") OR
                 Glob("{artifacts_dir}/{story_key}-hephaestus.json")
IF NOT builder_exists:
  → Flag: "No builder artifact — worker may have self-implemented without spawning builder"

# 3. Review artifact must exist (proves VERIFY phase ran independently)
review_exists = Glob("{artifacts_dir}/{story_key}-review.json") OR
                Glob("{artifacts_dir}/{story_key}-argus.json") OR
                Glob("{artifacts_dir}/{story_key}-multi-review.json")
IF NOT review_exists:
  → Flag: "No review artifact — worker may have self-certified without independent review"

# 4. If any flags raised:
IF any_flags:
  → SendMessage to worker: "Completion rejected — missing artifacts: {list}. Re-run missing phases."
  → Do NOT mark task as completed
  → Worker should resume pipeline from the missing phase
ELSE:
  → Accept completion, proceed with reconciliation
```

**When a failure message arrives:**

```
Received from theseus:
  "Story 5-3 FAILED at Phase VERIFY - Cerberus found critical security issue"

→ Log failure
→ Decide: retry, skip, or halt
→ If retry: reset task status so another worker can claim it
```

**When a blocker message arrives:**

```
Received from perseus:
  "Story 5-5 BLOCKED - dependency 5-4 failed, cannot proceed"

→ Assess blocker
→ Either fix the dependency or mark story as skipped
→ Reply via SendMessage to unblock worker
```

### Step 4: Track Running Progress

Maintain a progress table that updates as messages arrive:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SWARM PROGRESS ({{completed}}/{{total}} stories)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  5-1  heracles  COMPLETE  25 tests  97.6% cov  8a1a0f0
  5-2  theseus   BUILD     ...working...
  5-3  heracles  VERIFY    ...working...
  5-4  --        pending   blocked by #1
  5-5  --        pending   blocked by #4
  5-6  --        pending   blocked by #2

Heroes: 3 active | Stories: 1 done, 2 active, 3 waiting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Optionally read progress artifacts for more detail:
```bash
PROGRESS="{{sprint_artifacts}}/completions/${story}-progress.json"
```

**Phase status icons:**
```
STARTING   Agent initializing
PREPARE    Loading story & playbooks
BUILD      Metis implementing
VERIFY     Reviewers checking
ASSESS     Themis triaging
REFINE     Fixing issues
COMMIT     Reconciling & committing
REFLECT    Mnemosyne learning
COMPLETE   Done
FAILED     Pipeline failed
```

### Step 5: Orchestrator Reconciles Each Completed Story

As each worker reports completion:

1. Read the story's completion artifact (`{{story_key}}-progress.json`)
2. **Execute Phase 6 from story-pipeline** (which spawns Eunomia + hard validation gate)
3. Eunomia checks off tasks, fills Dev Agent Record, outputs reconciler artifact
4. Hard gate validates: zero tasks checked = BLOCK, <50% = WARN
5. Update sprint-status.yaml using status decision logic

**This happens incrementally** — as soon as a story is reported complete, reconcile it.
Don't wait for all stories to finish.

**Reconciliation includes a hard validation gate** — if Eunomia reports zero tasks
checked, do NOT mark story done. Flag it for investigation.

> **Detailed reconciliation protocol:** See `step-4.5-reconcile-story-status.md` for the
> full step-by-step reconciliation procedure and manual fallback if Eunomia fails.

### Step 6: Wait for All Workers to Finish

Workers send idle notifications automatically when they have no more tasks to claim.
Once all workers are idle (or all tasks are completed/failed):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SWARM COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  5-1  heracles  DONE    25 tests  97.6% cov  4->0 issues  8a1a0f0
  5-2  theseus   DONE    22 tests  100% cov   2->0 issues  481c7fd
  5-3  heracles  DONE    32 tests  89.2% cov  6->0 issues  e94460c
  5-4  perseus   DONE    18 tests  94.1% cov  3->0 issues  f2b9a1c
  5-5  theseus   DONE    12 tests  91.3% cov  1->0 issues  7d3e4f2
  5-6  heracles  FAILED  Phase VERIFY - critical security issue

Summary: 5/6 succeeded, 1 failed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Column format:** `Story  Status  Tests  Coverage  Issues  Commit`

**For failures, show phase details:**
```
5-6 (FAILED):
  PREPARE: standard, 2 playbooks
  BUILD: 8 files, 423 lines
  VERIFY: Cerberus found critical security issue [FAILED]
  ASSESS: Skipped
  REFINE: Skipped
  COMMIT: Skipped
```

### Step 7: Shutdown Workers and Cleanup

Request graceful shutdown of all workers, then clean up the team:

```
# For each active worker (by their hero name):
SendMessage({
  type: "shutdown_request",
  recipient: "heracles",
  content: "All stories processed. Shutting down."
})
# Repeat for theseus, perseus, etc. — whichever workers were spawned

# After all workers confirm shutdown:
TeamDelete()
```

### Step 8: Continue to Summary

Proceed to `summary` step with aggregated results from all completed stories.
</step>
