# Phase: Execute Sequential
<!-- Batch Stories phase file — see workflow.md for config and routing -->

<step name="execute_sequential" if="mode == sequential">
**Sequential Processing**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 SEQUENTIAL PROCESSING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

For each selected story:

**Step A: Auto-Fix Prerequisites**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Story {{index}}/{{total}}: {{story_key}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```bash
STORY_FILE="{{sprint_artifacts}}/{{story_key}}.md"

echo "🔍 Checking prerequisites..."
```

**Check 1: Story file exists?**
```bash
if [ ! -f "$STORY_FILE" ]; then
  echo "❌ STORY FILE MISSING: $STORY_FILE"
fi
```

**CRITICAL: NEVER WRITE STORY FILES DIRECTLY!**

If story file is missing, you MUST use the proper story creation workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│  MANDATORY: Story Creation Enforcement                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ALWAYS use: /bmad_bmm_create-story-with-gap-analysis           │
│                                                                 │
│  This workflow will:                                            │
│  1. Analyze the existing codebase for relevant code             │
│  2. Identify what already exists vs what's needed               │
│  3. Generate properly structured tasks with gap analysis        │
│  4. Create acceptance criteria based on actual requirements     │
│                                                                 │
│  DO NOT:                                                        │
│  - Write story files manually                                   │
│  - Use Write/Edit tools to create story content                 │
│  - Skip gap analysis "to save time"                             │
│  - Create placeholder tasks like "TBD" or "TODO"                │
│                                                                 │
│  The Story Quality Gate (Phase 0) will REJECT poorly            │
│  formed stories anyway, so do it right the first time!          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**If story file missing:**
1. STOP processing this story
2. Use Skill tool: `/bmad_bmm_create-story-with-gap-analysis {{story_key}}`
3. WAIT for story creation to complete
4. Verify story file exists and passes quality checks
5. THEN continue with implementation

```bash
[ -f "$STORY_FILE" ] || { echo "❌ Story creation failed"; exit 1; }
echo "✅ Story file exists and ready for implementation"
```

**Step B: Execute Pipeline Phases DIRECTLY (not wrapped in Task)**

**CRITICAL: DO NOT wrap this in a Task!**
Execute the pipeline phases directly so each agent is a visible top-level Task.

**B.1: Load story-pipeline workflow:**
Read: `{project-root}/_bmad/pantheon/workflows/story-pipeline/workflow.md`

**B.2: Execute each phase as described in workflow.md:**
The workflow describes spawning these Tasks - spawn them DIRECTLY.

**CRITICAL - Ensure commits happen:**
- After Phase 5 (REFINE): Implementation commit with all code changes
- After Phase 6 (COMMIT): Reconciliation commit with story checkboxes + sprint-status

```
Phase 1: PREPARE - Story quality gate + playbook query (orchestrator, no Task)
Phase 2: BUILD - Task({ description: "🔨 Metis building {{story_key}}", ... })  ← VISIBLE
Phase 3: VERIFY - Task({ description: "👁️ Argus inspecting {{story_key}}", ... })   ← VISIBLE
         Task({ description: "🧪 Nemesis testing {{story_key}}", ... })     ← VISIBLE
         Task({ description: "🔐🏛️⚡✨🌈 Reviewers reviewing {{story_key}}", ... })  ← VISIBLE (x N based on tier)
Phase 4: ASSESS - Coverage gate + Task({ description: "⚖️ Themis triaging {{story_key}}", ... }) ← VISIBLE
Phase 5: REFINE - ITERATIVE LOOP (max 3 iterations):
         Task({ description: "🔨 Metis fixing (iter N) {{story_key}}", resume: ID }) ← VISIBLE
         Task({ description: "[Reviewer] verifying fix {{story_key}}", resume: ID }) ← VISIBLE (only reviewers with MUST_FIX)
         Task({ description: "👁️ Fresh eyes on {{story_key}}", ... }) ← VISIBLE (iter 2+)
         Loop until: zero MUST_FIX remaining OR max iterations
Phase 6: COMMIT - Reconciliation (orchestrator does this, no Task)
Phase 7: REFLECT - Task({ description: "📚 Mnemosyne reflecting on {{story_key}}", ... }) ← VISIBLE
```

**Why this matters:** By NOT wrapping the pipeline in a Task, each agent spawn becomes a top-level Task that the user can see in Claude Code's UI.

**Step C: Execute Phase 6 COMMIT (Eunomia reconciliation + hard gate)**

Phase 6 is defined in `story-pipeline/phases/phase-6-commit.md`. It:

1. Loads completion artifacts from `docs/sprint-artifacts/completions/{{story_key}}-*.json`
2. **Spawns Eunomia** — a dedicated reconciliation agent that:
   - Checks off tasks with implementation evidence (`- [ ]` → `- [x]`)
   - Fills the Dev Agent Record with pipeline metrics
   - Outputs `{{story_key}}-reconciler.json` with structured counts
3. **Runs the hard validation gate:**
   - If `tasks_checked == 0` → HALT. Do NOT mark story done. Escalate to user.
   - If `tasks_checked / tasks_total < 0.5` → WARN. Ask user to continue or investigate.
4. Updates sprint-status.yaml using status decision logic (95%+ = done, 80-94% = review, etc.)
5. Commits reconciliation

**Manual fallback:** If Eunomia fails to spawn or returns no artifact, fall back to
the manual reconciliation procedure in `step-4.5-reconcile-story-status.md`.

**Step D: Tracker sync and next story**

**Tracker Sync (Push after story complete):**

Check `tracker.provider` from config.yaml:
- If `none` or not configured → skip (zero overhead)
Check session flag `tracker_available`:
- If `false` → skip (user chose to disable sync this session)
- If not yet set → probe MCP now; on failure present prompt:
  [R] Retry  [S] Skip this operation  [D] Disable for session  [H] Halt workflow
  (Only [D] sets `tracker_available = false`)
- If `true` → proceed:

**Branch-aware push guard:**
`git rev-parse --abbrev-ref HEAD`
- On `{tracker.main_branch}` → all statuses allowed
- On feature branch → only In-Progress, Completed, Accepted
- Restricted status → log "⚠️ Skipped: {status} push restricted to {main_branch} (current: {branch})", continue workflow

1. Load `{{sprint_artifacts}}/.tracker-mapping.yaml`
2. Look up `{{story_key}}` in mapping
3. If mapped:
   - Read current status from sprint-status.yaml (set in Phase 6)
   - Map to tracker status and push via `updateRallyStory`
   - Push completion comment with task counts
   - Update mapping entry
   - Report: "📡 Pushed to tracker: {story_key} → {tracker_status}"
4. If not mapped → skip

Continue to next story or summary.

- If more stories: continue loop
- If complete: proceed to `summary`
</step>
