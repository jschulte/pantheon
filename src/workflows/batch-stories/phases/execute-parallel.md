# Phase: Execute Parallel (Persistent Worktree Isolation + Early Integration)
<!-- Batch Stories phase file — see workflow.md for config and routing -->

<step name="execute_parallel" if="mode == parallel">
**Lead-Driven Parallel Processing with Persistent Worktrees**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 PARALLEL PROCESSING (WORKTREE ISOLATION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Architecture:** The lead creates 3 persistent worktrees with independent filesystems and
`node_modules`. Stories are assigned to worktrees (dependencies colocated, rest load-balanced).
Each worker gets exactly ONE story — when it finishes, the lead merges to integration, then
spawns a NEW worker in the same worktree for the next story. The new worker pulls integration
first, getting all previously completed code. This preserves the single-story contract that
keeps workers focused.

**Why worktrees?** Parallel workers sharing one filesystem caused git staging contention,
concurrent build/test fights, and CPU/memory spikes. The `mkdir`-based commit queue was a
bandaid. Worktrees give each worker its own git index, working tree, and `node_modules`.

### Pre-Flight: Permissions & Delegate Mode

**Pre-approve permissions** in Claude Code settings before starting a batch run. Workers
operate autonomously and cannot prompt for permission mid-execution. In your settings or
`CLAUDE.md`, pre-approve:
- File read/write in the project directory
- Bash commands for `npm test`, `git add`, `git commit`, `npx`, etc.
- Task agent spawning (sub-agents within workers)

**Delegate mode (recommended):** Use `Shift+Tab` to switch the lead session to delegate mode.
This ensures the orchestrator coordinates work without accidentally implementing stories itself.

### Step 1: Initialize Tracking + Session ID

```
# Generate a unique 6-character hex session ID from PID + timestamp
# This ensures multiple terminals never collide on worktree names
SESSION_ID = Bash("echo -n $$$(date +%s%N) | shasum | head -c 6").trim()

Display: "🔑 Session ID: {{SESSION_ID}}"

# From the dependency-sorted story list (produced by select-stories phase):
ALL_STORIES = []    # All stories in dependency order
COMPLETED = []      # Successfully completed story_keys
FAILED = []         # Failed story_keys with reasons
CONSECUTIVE_FAILURES = 0  # Circuit breaker counter
NARRATIVE_POSITIONS = {}  # story_key → lines_already_displayed (for incremental log reading)

WORKTREES = {}          # wt_id → {path, branch, stories: [], agent_task_id, current_story}
INTEGRATION = "integration-{{SESSION_ID}}"
MERGED_TO_INTEGRATION = []  # story_keys already merged

# Populate ALL_STORIES in dependency order (dependencies first)
FOR EACH story IN DEPENDENCY_SORTED_STORIES:
  ALL_STORIES.append({
    story_key: story.story_key,
    story_file: story.story_file,
    complexity: story.complexity,
    title: story.story_title,
    depends_on: story.depends_on
  })
```

**No TeamCreate. No TaskCreate. No shared task list.** Tracking lives in the lead's context only.

### Step 1.5: Orphan Detection + Cleanup

Before creating new worktrees, check for orphaned worktrees from crashed sessions.

```
MANIFEST_PATH = "{{project_root}}/.claude/worktrees/manifest.json"
Bash("mkdir -p {{project_root}}/.claude/worktrees")

IF file_exists(MANIFEST_PATH):
  manifest = JSON.parse(Read(MANIFEST_PATH))
  stale_threshold_hours = 4  # From worktree_isolation.orphan_detection.stale_threshold_hours

  FOR EACH (session_id, session) IN manifest.sessions:
    # Check if the PID is still running
    pid_alive = Bash("kill -0 {{session.pid}} 2>/dev/null && echo alive || echo dead").trim() == "alive"
    age_hours = (now() - session.started_at) / 3600

    IF NOT pid_alive AND age_hours > stale_threshold_hours:
      Display: "🧹 Cleaning orphaned session {{session_id}} (PID {{session.pid}} dead, {{age_hours}}h old)"

      FOR EACH wt IN session.worktrees:
        Bash("git worktree remove {{wt.path}} --force 2>/dev/null || true")
        Bash("git branch -D {{wt.branch}} 2>/dev/null || true")
      Bash("git branch -D {{session.integration_branch}} 2>/dev/null || true")

      # Remove session from manifest
      delete manifest.sessions[session_id]

    ELIF NOT pid_alive:
      Display: "⚠️ Session {{session_id}} (PID {{session.pid}}) — PID dead but only {{age_hours}}h old. Skipping (threshold: {{stale_threshold_hours}}h)"

  # Write cleaned manifest back
  Write(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

ELSE:
  # No manifest — first run or manually cleaned
  manifest = { sessions: {} }
```

### Step 1.7: Create Integration Branch

```
# Create or reset integration branch at current HEAD (idempotent for interrupted reruns)
Bash("git branch -f {{INTEGRATION}} HEAD")
```

### Step 2: Create Persistent Worktrees

```
max_worktrees = 3  # From parallel_config.worktree_isolation.max_worktrees
install_cmd = parallel_config.worktree_isolation.install_cmd  # e.g., "npm ci"

FOR n IN 1..max_worktrees:
  branch = "worktree/heracles-{{SESSION_ID}}-{{n}}"
  path = "{{project_root}}/.claude/worktrees/heracles-{{SESSION_ID}}-{{n}}"

  Bash("git worktree add -b {{branch}} {{path}} HEAD")
  Bash("cd {{path}} && {{install_cmd}}")

  WORKTREES[n] = {
    path: path,
    branch: branch,
    stories: [],
    agent_task_id: null,
    current_story: null,
    completed_stories: []
  }

# Write this session to the manifest
manifest.sessions[SESSION_ID] = {
  pid: Bash("echo $$").trim(),
  started_at: now(),
  integration_branch: INTEGRATION,
  worktrees: WORKTREES.values().map(wt → { path: wt.path, branch: wt.branch }),
  stories: [],  # populated in Step 3
  status: "active"
}
Write(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

Display:
  "✅ Created {{max_worktrees}} persistent worktrees (session: {{SESSION_ID}})"
  FOR EACH (id, wt) IN WORKTREES:
    "  worktree-{{id}}: {{wt.path}} (branch: {{wt.branch}})"
```

### Step 3: Assign Stories to Worktrees

Walk dependency-sorted stories. Colocate dependencies to the same worktree.
Load-balance the rest.

```
FOR EACH story IN ALL_STORIES:
  target_wt = null

  # 1. If story depends on a story already assigned → same worktree
  IF story.depends_on is not empty:
    FOR EACH dep_key IN story.depends_on:
      FOR EACH (wt_id, wt) IN WORKTREES:
        IF dep_key IN wt.stories.map(s → s.story_key):
          target_wt = wt_id
          BREAK
      IF target_wt: BREAK

  # 2. Otherwise → worktree with fewest stories (load balance)
  IF target_wt is null:
    target_wt = WORKTREES.min_by(wt → wt.stories.length).id

  WORKTREES[target_wt].stories.append(story)

# Update manifest with story assignments
manifest.sessions[SESSION_ID].stories = ALL_STORIES.map(s → s.story_key)
FOR EACH (wt_id, wt) IN WORKTREES:
  manifest.sessions[SESSION_ID].worktrees[wt_id - 1].assigned_stories = wt.stories.map(s → s.story_key)
Write(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

Display:
  "📋 Story assignments:"
  FOR EACH (wt_id, wt) IN WORKTREES:
    story_list = wt.stories.map(s → s.story_key).join(", ")
    "  worktree-{{wt_id}}: {{story_list}} ({{wt.stories.length}} stories)"
```

### Step 4: Spawn Initial Workers (One Story Per Worker)

**Each worker gets exactly ONE story.** When a worker finishes, the lead merges to
integration and spawns a NEW worker in the same worktree for the next story in that
worktree's queue. This keeps the single-story contract that prevents workers from
panicking and cutting corners.

```
# Load the worker persona once
HERACLES_PROMPT = Read("{installed_path}/workflows/batch-stories/agents/heracles.md")

FUNCTION spawn_worker_in_worktree(wt_id, wt, story):
  # If this isn't the first story in this worktree, pull integration first
  is_first_story = (wt.completed_stories.length == 0)

  agent = Task({
    subagent_type: "general-purpose",
    model: "opus",
    run_in_background: true,
    description: "🦁 Pipeline: {{story.story_key}} (wt-{{wt_id}})",
    prompt: `
You are a story-pipeline executor working in an isolated worktree.

## Your Assignment — ONE Story

- **story_key:** {{story.story_key}}
- **story_file:** {{story.story_file}}
- **complexity_level:** {{story.complexity}}
- **story_title:** {{story.title}}
- **batch_mode:** true
- **worktree_mode:** true

## Worktree Mode

- **worktree_path:** {{wt.path}}
- You OWN this worktree. No other agents modify files here.
- Commit freely — no lock protocol, no git-commit-queue.md.
- All npm scripts work normally — you have full node_modules.

{{IF NOT is_first_story:}}
## Pre-Flight: Pull Integration

Before starting your pipeline, pull the latest integration branch to get
code from other workers' completed stories:

\`\`\`bash
cd {{wt.path}}
git merge integration --no-edit
\`\`\`

If merge conflict: resolve automatically if straightforward, report if not.
{{END IF}}

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
- Working directory: {{wt.path}}

## Critical Rules

- You have ONE story. Execute the full pipeline for it, then stop.
- You MUST spawn Task sub-agents for BUILD, VERIFY, ASSESS, REFINE, COMMIT, and REFLECT.
- Do NOT write implementation code yourself — delegate to builder agents.
- Do NOT self-certify code — spawn independent reviewer agents.
- Mandatory checkpoints: builder artifact, reviewer artifact, themis artifact, reconciler artifact, git commit.
- If ANY checkpoint fails, report failure — do not skip ahead.
- **BATCH MODE ENABLED:** Skip type-check and lint during all phases. Tests still run per-story. Quality gates run once after all stories complete.
`
  })

  WORKTREES[wt_id].agent_task_id = agent.task_id
  WORKTREES[wt_id].current_story = story

# Spawn the first story in each worktree's queue
FOR EACH (wt_id, wt) IN WORKTREES WHERE wt.stories is not empty:
  first_story = wt.stories[0]
  spawn_worker_in_worktree(wt_id, wt, first_story)

Display: "🦁 Spawned initial workers (one story each, one per worktree)"
```

### Step 5: Monitor, Early Integration, Re-Dispatch, and Collect Results

**The developer should never wonder "is anything happening?"** This polling loop is the
primary communication channel. It must provide regular, formatted updates every cycle —
even when no narrative log entries have appeared yet.

The lead also performs **early integration** and **re-dispatch** — when a worker completes
a story, the lead merges the worktree branch into integration, then spawns a NEW worker in
the same worktree for the next story in that worktree's queue. The new worker pulls
integration before starting, so it has all previously completed code.

**Display cadence:**
- **Every poll cycle (~15s):** Read narrative logs, display any new entries
- **Every 3rd cycle (~45s):** Display the full status dashboard (table + elapsed times) regardless of whether new entries exist — this is the heartbeat
- **On story completion:** Merge to integration, re-dispatch next story, display a rich completion card
- **On story failure:** Display failure details, re-dispatch next story

```
POLL_COUNT = 0
BATCH_START = now()

# Track which story index each worktree is on
FOR EACH (wt_id, wt) IN WORKTREES:
  wt.story_index = 0  # Currently processing stories[0]

FUNCTION stories_remaining():
  # True if any worktree still has an active worker OR unprocessed stories
  FOR EACH (wt_id, wt) IN WORKTREES:
    IF wt.agent_task_id is not null: RETURN true
    IF wt.story_index < wt.stories.length: RETURN true
  RETURN false

WHILE stories_remaining():
  POLL_COUNT++
  stories_completed_this_cycle = []

  # ── 1. Check worker completion ──
  FOR EACH (wt_id, wt) IN WORKTREES WHERE wt.agent_task_id is not null:
    result = TaskOutput(task_id=wt.agent_task_id, block=false, timeout=5000)

    IF result.status == "completed":
      story = wt.current_story
      validation = validate_artifacts(story.story_key, wt.path)

      IF validation.passed:
        # Merge worktree branch into integration
        Bash("git checkout {{INTEGRATION}} && git merge {{wt.branch}} --no-edit && git checkout main")
        MERGED_TO_INTEGRATION.append(story.story_key)
        COMPLETED.append(story.story_key)
        wt.completed_stories.append(story.story_key)
        CONSECUTIVE_FAILURES = 0
        stories_completed_this_cycle.append(story.story_key)
        Display: "🔀 Merged {{story.story_key}} → integration branch"
      ELSE:
        IF story.retry_count < 2:
          story.retry_count = (story.retry_count || 0) + 1
          Display: "⚠️ {{story.story_key}} rejected — missing: {{validation.missing}}. Retrying (attempt {{story.retry_count}})"
          # Re-spawn worker for same story (retry)
          spawn_worker_in_worktree(wt_id, wt, story)
          CONTINUE  # Don't advance story_index
        ELSE:
          FAILED.append({ story_key: story.story_key, reason: "Artifact validation failed after 2 attempts: {{validation.missing}}" })
          CONSECUTIVE_FAILURES++
          Display: "❌ {{story.story_key}} FAILED — {{validation.missing}}"

      # Advance to next story in this worktree's queue
      wt.agent_task_id = null
      wt.current_story = null
      wt.story_index++

      # Re-dispatch: spawn new worker for next story (if any remain)
      IF wt.story_index < wt.stories.length:
        next_story = wt.stories[wt.story_index]
        spawn_worker_in_worktree(wt_id, wt, next_story)

    ELIF result.status == "failed":
      story = wt.current_story
      FAILED.append({ story_key: story.story_key, reason: result.error })
      CONSECUTIVE_FAILURES++
      Display: "❌ {{story.story_key}} FAILED — {{result.error}}"

      # Advance and re-dispatch next story despite failure
      wt.agent_task_id = null
      wt.current_story = null
      wt.story_index++

      IF wt.story_index < wt.stories.length:
        next_story = wt.stories[wt.story_index]
        spawn_worker_in_worktree(wt_id, wt, next_story)

  # ── 2. Circuit breaker ──
  IF CONSECUTIVE_FAILURES >= 3:
    Display: "🛑 CIRCUIT BREAKER — 3 consecutive failures. Halting batch."
    → HALT (proceed to final merge with partial results)

  # ── 3. Read narrative logs from ALL active + completed workers ──
  NEW_ENTRIES = []
  all_story_keys = []
  FOR EACH (wt_id, wt) IN WORKTREES:
    FOR EACH story IN wt.stories:
      all_story_keys.append(story.story_key)

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

  # ── 4. Display: completion cards for finished stories ──
  FOR EACH story_key IN stories_completed_this_cycle:
    display_completion_card(story_key)  # See Step 9 for format

  # ── 5. Display: narrative feed (new entries this cycle) ──
  IF NEW_ENTRIES:
    Display:
      "── LIVE FEED ──────────────────────────────"
      FOR EACH entry IN NEW_ENTRIES:
        entry
      "────────────────────────────────────────────"

  # ── 6. Display: status dashboard (heartbeat — every 3rd cycle, or if no feed) ──
  IF POLL_COUNT % 3 == 0 OR (NOT NEW_ENTRIES AND NOT stories_completed_this_cycle):
    elapsed = now() - BATCH_START
    Display:
      "━━━ {{time()}} ━━━ BATCH PROGRESS ({{COMPLETED.length}}/{{total}}) ━━━ {{elapsed}} elapsed ━━━"

    FOR EACH (wt_id, wt) IN WORKTREES:
      active = wt.agent_task_id is not null
      remaining = wt.stories.length - wt.story_index
      "  [worktree-{{wt_id}}] {{IF active: 'active' ELSE: 'idle'}} ({{remaining}} remaining)"

      FOR EACH story IN wt.stories:
        IF story.story_key IN COMPLETED:
          "    {{story.story_key}}  ✅ DONE      {{summary_from_progress_artifact}}"
        ELIF story.story_key IN FAILED:
          "    {{story.story_key}}  ❌ FAILED    {{failure_reason}}"
        ELIF story == wt.current_story:
          phase = last_phase_from_narrative_log(story.story_key)  # e.g., "BUILD", "VERIFY"
          IF phase:
            "    {{story.story_key}}  {{phase_emoji}} {{phase}}    {{phase_detail}}"
          ELSE:
            "    {{story.story_key}}  ⏳ STARTING"
        ELSE:
          "    {{story.story_key}}  ⏳ QUEUED"

    "  Workers: {{active_workers}}/{{max_worktrees}} | Done: {{COMPLETED.length}}/{{total}} | Integration merges: {{MERGED_TO_INTEGRATION.length}}"
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # ── 7. Pause before next cycle ──
  sleep(15s)
```

**Phase emoji mapping** for the status dashboard:
```
PREPARE → 📋    BUILD → 🔨    VERIFY → 🔍    ASSESS → ⚖️
REFINE  → 🔧    COMMIT → 📦   REFLECT → 💭   STARTING → ⏳
```

### Step 6: Final Merge to Main

After all workers complete, merge the integration branch into main.

```
Display: "🔀 Merging integration branch into main..."

Bash("git checkout main && git merge {{INTEGRATION}} --no-edit")

IF merge succeeds:
  Display: "✅ Integration branch merged cleanly into main"
ELSE:
  Display: "❌ Merge conflict — attempting automatic resolution"
  # Try to resolve automatically, report if manual intervention needed
```

### Step 7: Cleanup Worktrees + Manifest

```
Display: "🧹 Cleaning up worktrees and branches..."

FOR EACH (wt_id, wt) IN WORKTREES:
  Bash("git worktree remove {{wt.path}} --force")
  Bash("git branch -d {{wt.branch}}")

# NOTE: Integration branch is NOT deleted here — quality-gates Step 0 needs it
# to verify the merge. Quality gates deletes it after verification.

# Remove this session from the manifest
IF file_exists(MANIFEST_PATH):
  manifest = JSON.parse(Read(MANIFEST_PATH))
  delete manifest.sessions[SESSION_ID]
  Write(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

Display: "✅ Removed {{WORKTREES.size}} worktrees (integration branch retained for quality gates)"
```

### Step 8: Artifact Validation (MANDATORY Before Accepting Completion)

```
FUNCTION validate_artifacts(story_key, worktree_path=null):
  # Artifacts are written to sprint_artifacts (shared location)
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

  # 6. Git commit must exist (check in worktree if specified, else main repo)
  IF worktree_path:
    git_check = Bash("cd {{worktree_path}} && git log --oneline -20 | grep 'feat({{story_key}})'")
  ELSE:
    git_check = Bash("git log --oneline -20 | grep 'feat({{story_key}})'")
  IF no match:
    missing.append("git commit with feat({{story_key}}) prefix")

  RETURN { passed: missing.length == 0, missing }
```

### Step 9: Completion Cards

When a story completes (validated in Step 5), display a **completion card** — a rich
summary the developer can scan in 5 seconds to understand what was built. This is the
moment of payoff. Don't waste it with "done."

```
FUNCTION display_completion_card(story_key):
  # Read the narrative log and progress artifact
  narrative = Read("{{sprint_artifacts}}/completions/{{story_key}}-narrative.log")
  progress = Read("{{sprint_artifacts}}/completions/{{story_key}}-progress.json")
  story_title = story.title  # From the assignment
  duration = progress.completed_at - progress.started_at

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

### Step 10: Final Summary

After all stories are processed and merged:

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
Worktrees: {{WORKTREES.size}} created, cleaned up
Integration merges: {{MERGED_TO_INTEGRATION.length}} stories merged via integration branch
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**For failures, show details:**
```
36-6 (FAILED):
  Worktree: worktree-2
  Reason: Missing builder artifact (worker self-implemented without spawning builder)
  Action: Manual investigation required
```

### Step 11: Continue to Quality Gates

Proceed to `quality_gates` step. Artifact validation already ran per-story (Step 8);
quality gates run type-check, full test suite, and lint once on the merged main branch.

**No TeamDelete needed** — no team was created. Background Task agents clean up automatically.
</step>
