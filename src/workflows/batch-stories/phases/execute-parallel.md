# Phase: Execute Parallel (Lead-Driven Single-Story Workers)
<!-- Batch Stories phase file — see workflow.md for config and routing -->

<step name="execute_parallel" if="mode == parallel">
**Lead-Driven Parallel Processing with Background Task Agents**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 PARALLEL PROCESSING (LEAD-DRIVEN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Architecture:** The lead manages an in-memory queue and spawns one background Task agent
per story. Each agent executes the full pipeline for ONE story with zero knowledge of other
stories. No shared task list, no Agent Teams, no self-scheduling.

**Why not Agent Teams?** Workers with a shared task list optimized for throughput over depth —
they performed reconciliation-only sweeps instead of running full BUILD/VERIFY cycles. The
lead-driven model eliminates batch awareness entirely.

### Pre-Flight: Permissions & Delegate Mode

**Pre-approve permissions** in Claude Code settings before starting a batch run. Workers
operate autonomously and cannot prompt for permission mid-execution. In your settings or
`CLAUDE.md`, pre-approve:
- File read/write in the project directory
- Bash commands for `npm test`, `git add`, `git commit`, `npx`, etc.
- Task agent spawning (sub-agents within workers)

**Delegate mode (recommended):** Use `Shift+Tab` to switch the lead session to delegate mode.
This ensures the orchestrator coordinates work without accidentally implementing stories itself.

### Step 1: Initialize In-Memory Queue

```
# From the dependency-sorted story list (produced by select-stories phase):
QUEUE = []          # Stories waiting to be processed
IN_FLIGHT = {}      # story_key → { agent_task_id, started_at }
COMPLETED = []      # Successfully completed story_keys
FAILED = []         # Failed story_keys with reasons
CONSECUTIVE_FAILURES = 0  # Circuit breaker counter
NARRATIVE_POSITIONS = {}  # story_key → lines_already_displayed (for incremental log reading)

# Populate queue in dependency order (dependencies first)
FOR EACH story IN DEPENDENCY_SORTED_STORIES:
  QUEUE.append({
    story_key: story.story_key,
    story_file: story.story_file,
    complexity: story.complexity,
    title: story.story_title,
    depends_on: story.depends_on
  })
```

**No TeamCreate. No TaskCreate. No shared task list.** The queue lives in the lead's context only.

### Step 2: Spawn Workers (Up to max_workers in Parallel)

```
max_workers = 3  # Maximum concurrent pipeline executors

# Load the worker persona once
HERACLES_PROMPT = Read("{installed_path}/workflows/batch-stories/agents/heracles.md")

FUNCTION spawn_next_workers():
  WHILE IN_FLIGHT.size < max_workers AND QUEUE is not empty:
    story = QUEUE.shift()  # Take next from front

    # Check dependencies are satisfied
    IF story.depends_on is not empty:
      unmet = story.depends_on WHERE dep_key NOT IN COMPLETED
      IF unmet is not empty:
        # Re-queue at end — dependencies not yet done
        QUEUE.append(story)
        CONTINUE

    # Spawn a background Task agent for this ONE story
    agent = Task({
      subagent_type: "general-purpose",
      model: "opus",
      run_in_background: true,
      description: "🦁 Pipeline: {{story.story_key}}",
      prompt: `
You are a story-pipeline executor.

## Your Assignment — ONE Story

- **story_key:** {{story.story_key}}
- **story_file:** {{story.story_file}}
- **complexity_level:** {{story.complexity}}
- **story_title:** {{story.title}}
- **batch_mode:** true

## Your Instructions

Read these two files NOW, then follow them exactly:

1. **Your execution protocol:**
   {{project_root}}/_bmad/pantheon/workflows/batch-stories/agents/heracles.md

2. **The 7-phase pipeline:**
   {{project_root}}/_bmad/pantheon/workflows/story-pipeline/workflow.md

## Project Context

- Project root: {{project_root}}
- Sprint artifacts: {{sprint_artifacts_path}}
- Pipeline config: {{project_root}}/_bmad/pantheon/workflows/story-pipeline/workflow.yaml

## Critical Rules

- You have ONE story. Execute the full pipeline for it, then stop.
- You MUST spawn Task sub-agents for BUILD, VERIFY, ASSESS, REFINE, COMMIT, and REFLECT.
- Do NOT write implementation code yourself — delegate to builder agents.
- Do NOT self-certify code — spawn independent reviewer agents.
- Mandatory checkpoints: builder artifact, reviewer artifact, themis artifact, reconciler artifact, git commit.
- If ANY checkpoint fails, report failure — do not skip ahead.
- **BATCH MODE ENABLED:** Skip type-check (`tsc --noEmit`) and lint (`npm run lint`) during all phases. Tests still run per-story. Quality gates run once after all stories complete.
`
    })

    IN_FLIGHT[story.story_key] = {
      agent_task_id: agent.task_id,
      started_at: now()
    }

# Initial spawn
spawn_next_workers()
```

### Step 3: Monitor, Narrate, and Collect Results

**The developer should never wonder "is anything happening?"** This polling loop is the
primary communication channel. It must provide regular, formatted updates every cycle —
even when no narrative log entries have appeared yet.

**Display cadence:**
- **Every poll cycle (~15s):** Read narrative logs, display any new entries
- **Every 3rd cycle (~45s):** Display the full status dashboard (table + elapsed times) regardless of whether new entries exist — this is the heartbeat
- **On story completion:** Display a rich completion card with files, tests, issues
- **On story failure:** Display failure details with actionable context

```
POLL_COUNT = 0
BATCH_START = now()

WHILE IN_FLIGHT is not empty OR QUEUE is not empty:
  POLL_COUNT++
  stories_completed_this_cycle = []

  # ── 1. Check agent status ──
  FOR EACH (story_key, info) IN IN_FLIGHT:
    result = TaskOutput(task_id=info.agent_task_id, block=false, timeout=5000)

    IF result.status == "completed":
      validation = validate_artifacts(story_key)

      IF validation.passed:
        COMPLETED.append(story_key)
        CONSECUTIVE_FAILURES = 0
        stories_completed_this_cycle.append(story_key)
      ELSE:
        IF story.retry_count < 2:
          story.retry_count++
          QUEUE.append(story)
          Display: "⚠️ {{story_key}} rejected — missing: {{validation.missing}}. Re-queued (attempt {{story.retry_count}})"
        ELSE:
          FAILED.append({ story_key, reason: "Artifact validation failed after 2 attempts: {{validation.missing}}" })
          CONSECUTIVE_FAILURES++
          Display: "❌ {{story_key}} FAILED — {{validation.missing}}"

      IN_FLIGHT.remove(story_key)

    ELIF result.status == "failed":
      FAILED.append({ story_key, reason: result.error })
      CONSECUTIVE_FAILURES++
      IN_FLIGHT.remove(story_key)
      Display: "❌ {{story_key}} FAILED — {{result.error}}"

  # ── 2. Circuit breaker ──
  IF CONSECUTIVE_FAILURES >= 3:
    Display: "🛑 CIRCUIT BREAKER — 3 consecutive failures. Halting batch."
    → HALT (proceed to summary with partial results)

  # ── 3. Spawn more workers if slots opened ──
  spawn_next_workers()

  # ── 4. Read narrative logs from ALL active + just-completed workers ──
  NEW_ENTRIES = []
  all_story_keys = IN_FLIGHT.keys() + stories_completed_this_cycle

  FOR EACH story_key IN all_story_keys:
    log_file = "{{sprint_artifacts}}/completions/{{story_key}}-narrative.log"
    IF file_exists(log_file):
      all_lines = Read(log_file).split("\n").filter(non_empty)
      last_shown = NARRATIVE_POSITIONS.get(story_key, 0)
      new_lines = all_lines[last_shown:]
      IF new_lines:
        FOR EACH line IN new_lines:
          NEW_ENTRIES.append("  {{story_key}} | {{line}}")
        NARRATIVE_POSITIONS[story_key] = all_lines.length

  # ── 5. Display: completion cards for finished stories ──
  FOR EACH story_key IN stories_completed_this_cycle:
    display_completion_card(story_key)  # See Step 5 for format

  # ── 6. Display: narrative feed (new entries this cycle) ──
  IF NEW_ENTRIES:
    Display:
      "── LIVE FEED ──────────────────────────────"
      FOR EACH entry IN NEW_ENTRIES:
        entry
      "────────────────────────────────────────────"

  # ── 7. Display: status dashboard (heartbeat — every 3rd cycle, or if no feed) ──
  IF POLL_COUNT % 3 == 0 OR (NOT NEW_ENTRIES AND NOT stories_completed_this_cycle):
    elapsed = now() - BATCH_START
    Display:
      "━━━ {{time()}} ━━━ BATCH PROGRESS ({{COMPLETED.length}}/{{total}}) ━━━ {{elapsed}} elapsed ━━━"

    FOR EACH story IN ALL_STORIES:
      IF story IN COMPLETED:
        "  {{story_key}}  ✅ DONE      {{summary_from_progress_artifact}}"
      ELIF story IN IN_FLIGHT:
        phase = last_phase_from_narrative_log(story_key)  # e.g., "BUILD", "VERIFY"
        age = now() - IN_FLIGHT[story_key].started_at
        "  {{story_key}}  {{phase_emoji}} {{phase}}    {{phase_detail}}    [{{age}}]"
      ELIF story IN FAILED:
        "  {{story_key}}  ❌ FAILED    {{failure_reason}}"
      ELIF story IN QUEUE:
        blocked = story.depends_on WHERE dep NOT IN COMPLETED
        IF blocked: "  {{story_key}}  ⏳ QUEUED    blocked by {{blocked}}"
        ELSE:       "  {{story_key}}  ⏳ QUEUED"

    "  Workers: {{IN_FLIGHT.size}}/{{max_workers}} | Queue: {{QUEUE.length}} | Done: {{COMPLETED.length}}"
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # ── 8. Pause before next cycle ──
  sleep(15s)
```

**Phase emoji mapping** for the status dashboard:
```
PREPARE → 📋    BUILD → 🔨    VERIFY → 🔍    ASSESS → ⚖️
REFINE  → 🔧    COMMIT → 📦   REFLECT → 💭   STARTING → ⏳
```

### Step 4: Artifact Validation (MANDATORY Before Accepting Completion)

```
FUNCTION validate_artifacts(story_key):
  artifacts_dir = "{{sprint_artifacts}}/completions/"
  missing = []

  # 1. Progress artifact must exist and show COMPLETE or ALREADY_DONE
  progress = Read("{{artifacts_dir}}/{{story_key}}-progress.json")
  IF progress missing OR progress.status NOT IN ["SUCCESS", "ALREADY_DONE"]:
    missing.append("progress artifact (missing or incomplete)")

  # For ALREADY_DONE stories, only progress artifact is required
  IF progress.status == "ALREADY_DONE":
    RETURN { passed: missing.length == 0, missing }

  # 2. Builder artifact must exist with file:line evidence
  builder_files = Glob("{{artifacts_dir}}/{{story_key}}-builder.json") OR
                  Glob("{{artifacts_dir}}/{{story_key}}-metis.json") OR
                  Glob("{{artifacts_dir}}/{{story_key}}-helios.json") OR
                  Glob("{{artifacts_dir}}/{{story_key}}-hephaestus.json")
  IF NOT builder_files:
    missing.append("builder artifact (no BUILD phase evidence)")
  ELSE:
    builder = Read(builder_files[0])
    IF builder.tasks_addressed is empty OR no file:line citations found:
      missing.append("builder artifact (no file:line evidence in tasks_addressed)")

  # 3. At least one reviewer artifact must exist
  review_files = Glob("{{artifacts_dir}}/{{story_key}}-review.json") OR
                 Glob("{{artifacts_dir}}/{{story_key}}-argus.json") OR
                 Glob("{{artifacts_dir}}/{{story_key}}-requirements.json") OR
                 Glob("{{artifacts_dir}}/{{story_key}}-multi-review.json")
  IF NOT review_files:
    missing.append("reviewer artifact (no VERIFY phase evidence)")

  # 4. Themis artifact must exist
  themis = Glob("{{artifacts_dir}}/{{story_key}}-themis.json")
  IF NOT themis:
    missing.append("themis artifact (no ASSESS phase evidence)")

  # 5. Reconciler artifact must exist
  reconciler = Glob("{{artifacts_dir}}/{{story_key}}-reconciler.json")
  IF NOT reconciler:
    missing.append("reconciler artifact (no COMMIT/reconciliation evidence)")

  # 6. Git commit must exist
  git_check = Bash("git log --oneline -20 | grep 'feat({{story_key}})'")
  IF no match:
    missing.append("git commit with feat({{story_key}}) prefix")

  RETURN { passed: missing.length == 0, missing }
```

### Step 5: Completion Cards

When a story completes (validated in Step 3), display a **completion card** — a rich
summary the developer can scan in 5 seconds to understand what was built. This is the
moment of payoff. Don't waste it with "✅ done."

```
FUNCTION display_completion_card(story_key):
  # Read the narrative log and progress artifact
  narrative = Read("{{sprint_artifacts}}/completions/{{story_key}}-narrative.log")
  progress = Read("{{sprint_artifacts}}/completions/{{story_key}}-progress.json")
  story_title = story.title  # From the queue entry
  duration = progress.completed_at - IN_FLIGHT[story_key].started_at

  # Extract key data from narrative log
  build_done_lines = lines matching "BUILD DONE" and subsequent "+" / "~" lines
  verify_done_lines = lines matching "VERIFY DONE" and subsequent issue lines
  commit_line = line matching "COMMIT"

  Display:
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ {{story_key}} COMPLETE — {{story_title}}                    [{{duration}}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Files created:
    + src/services/agreementService.ts — CRUD operations for agreements
    + src/components/Agreement/StatusBadge.tsx — visual status indicator
    + src/components/Agreement/Timeline.tsx — agreement history timeline

  Files modified:
    ~ src/pages/agreements/[id].tsx:22-89 — wired up service, added error boundary
    ~ src/types/agreement.ts:5-18 — added StatusType enum

  Tests: 22 added (100% coverage)
  Issues: 3 found → 3 fixed (1 iteration)
  Commit: feat(36-2): 481c7fd

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Source data:** The file lists come from `BUILD DONE` entries in the narrative log.
Test/issue/commit data comes from the progress artifact. The card is assembled by the
lead from data the worker already wrote — no extra agent spawn needed.

**For ALREADY_DONE stories**, show a minimal card:
```
⏭️ {{story_key}} ALREADY DONE — {{story_title}}
   All tasks checked, no gaps. Skipped pipeline.
```

**For FAILED stories**, show actionable detail:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ {{story_key}} FAILED — {{story_title}}                      [{{duration}}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Failed at: VERIFY (Phase 3)
  Reason: Builder did not spawn sub-agent — self-implemented without delegation
  Missing artifacts: builder artifact (no file:line evidence), reviewer artifact

  What was partially done:
    ~ src/pages/agreements/index.tsx — modified but no tests
    ~ src/components/Agreement/List.tsx — modified but no review

  Retry: Attempt 2 of 2 exhausted
  Action: Manual investigation required — check worker output

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 6: Final Summary

After all stories are processed (queue empty, no in-flight):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BATCH COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  36-1  DONE     25 tests  97.6% cov  4→0 issues  8a1a0f0
  36-2  DONE     22 tests  100% cov   2→0 issues  481c7fd
  36-3  DONE     32 tests  89.2% cov  6→0 issues  e94460c
  36-4  DONE     18 tests  94.1% cov  3→0 issues  f2b9a1c
  36-5  SKIPPED  ALREADY_DONE — all tasks checked
  36-6  FAILED   Missing builder artifact after 2 attempts

Summary: {{COMPLETED.length}}/{{total}} succeeded, {{FAILED.length}} failed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**For failures, show details:**
```
36-6 (FAILED):
  Attempt 1: Missing builder artifact, reviewer artifact
  Attempt 2: Missing builder artifact (worker self-implemented without spawning builder)
  Action: Manual investigation required
```

### Step 7: Continue to Summary

Proceed to `summary` step with aggregated results.

**No TeamDelete needed** — no team was created. Background Task agents clean up automatically.
</step>
