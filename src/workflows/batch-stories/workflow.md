# Batch Super-Dev v3.0 - Unified Workflow

<purpose>
Interactive story selector for batch implementation. Scan codebase for gaps, select stories, process with story-pipeline, reconcile results.

**AKA:** "Mend the Gap" - Mind the gap between story requirements and reality, then mend it.
</purpose>

<philosophy>
**Gap Analysis First, Build Only What's Missing**

1. Scan codebase to verify what's actually implemented
2. Find the gap between story requirements and reality
3. Build ONLY what's truly missing (no duplicate work)
4. Update tracking to reflect actual completion

Orchestrator coordinates. Agents do implementation. Orchestrator does reconciliation.
</philosophy>

<config>
name: batch-stories
version: 3.5.0

modes:
  sequential: {description: "Process one-by-one in this session", recommended_for: "gap analysis"}
  parallel: {description: "Spawn concurrent Task agents", recommended_for: "greenfield batch"}

parallel_config:
  max_concurrent: 3          # Max stories per wave (can override via user prompt)
  smart_ordering: true       # Analyze dependencies and order waves intelligently
  respect_epic_order: true   # Within an epic, lower story numbers go first

complexity_routing:
  # 6-tier scale - see story-pipeline/workflow.md for full details
  trivial: {max_tasks: 1, agents: 1, triggers: [static, policy, content, copy, config]}
  micro: {max_tasks: 2, agents: 2, triggers: [no API, no user input]}
  light: {max_tasks: 4, agents: 3, triggers: [basic CRUD, simple form]}
  standard: {max_tasks: 10, agents: 4, triggers: [API integration, user input]}
  complex: {max_tasks: 15, agents: 5, triggers: [auth, migration, database]}
  critical: {min_tasks: 16, agents: 6, triggers: [payment, encryption, PII, credentials]}

defaults:
  auto_create_missing: true  # Automatically create missing story files using greenfield workflow
</config>

<story_dependencies>
## Story Dependency Declaration

Stories can declare dependencies on other stories using the `depends_on` field.
This enables smart wave ordering in parallel execution.

**Format in story file:**

```markdown
## Story Metadata
<!-- Optional: declare dependencies for smart parallel execution -->
depends_on: [5-1, 5-2]
```

**Or in a Dependencies section:**

```markdown
## Dependencies
- **5-1**: Uses the CatchList component created in this story
- **5-2**: Extends the detail view patterns established here
```

**Dependency detection methods (in priority order):**

1. **Explicit `depends_on`** - Highest priority, always respected
2. **File-based inference** - If Story A creates a file that Story B references
3. **Keyword scanning** - Phrases like "uses component from 5-1"
4. **Epic ordering** - Lower story numbers first (fallback)

**Example dependency graph:**
```
5-1 ──┬──► 5-2 ──► 5-6
      │
      └──► 5-4 ──► 5-5

5-3 (independent)
```

**Resulting waves:**
- Wave 1: 5-1, 5-3 (no deps)
- Wave 2: 5-2, 5-4 (deps satisfied by Wave 1)
- Wave 3: 5-5, 5-6 (deps satisfied by Wave 2)
</story_dependencies>

<execution_context>
@patterns/hospital-grade.md
@patterns/agent-completion.md
@story-pipeline/workflow.md
</execution_context>

<execution_discipline>
**CRITICAL: Understand the Execution Model**

This workflow runs in the **main Claude context** (the orchestrator). The orchestrator is NOT a Task agent - it's the primary assistant context that receives user messages.

**What the Orchestrator DOES:**
- Parse sprint-status.yaml (Read tool)
- Display stories and get user selection (AskUserQuestion tool)
- Check prerequisites (Read tool, Bash tool)
- Execute story-pipeline phases directly (spawning Task agents as defined in workflow phases)
- Reconcile results after each story (Edit tool)
- Update sprint-status.yaml (Edit tool)

**What the Orchestrator MUST NOT DO:**
- ❌ Spawn ad-hoc Task agents to "implement a story" outside workflow phases
- ❌ Use Task tool with prompts like "implement story X" that bypass the pipeline
- ❌ Delegate story implementation to a general-purpose agent
- ❌ Skip the story-pipeline phases defined in story-pipeline/workflow.md

**When spawning Task agents:**
- Only spawn Tasks for phases explicitly defined in story-pipeline/workflow.md
- Phase 2: BUILD - Metis (builder)
- Phase 3: VERIFY - Argus (inspector), Nemesis (test quality), reviewers (Cerberus/Apollo/Hestia/Arete/Iris)
- Phase 4: ASSESS - Themis (arbiter) triages issues
- Phase 5: REFINE - Metis resumed with MUST_FIX issues, iterative loop
- Phase 7: REFLECT - Mnemosyne (reflection)

**Why this matters:**
The story-pipeline ensures proper verification, testing, and quality gates. Spawning ad-hoc "implementation" agents bypasses these safeguards and leads to incomplete or untested implementations.
</execution_discipline>

<process>

<step name="load_sprint_status" priority="first">
**Load and parse sprint-status.yaml**

```bash
SPRINT_STATUS="docs/sprint-artifacts/sprint-status.yaml"
[ -f "$SPRINT_STATUS" ] || { echo "ERROR: sprint-status.yaml not found"; exit 1; }
```

Use Read tool on sprint-status.yaml. Extract:
- Stories with status `ready-for-dev` or `backlog`
- Exclude epics (`epic-*`) and retrospectives (`*-retrospective`)
- Sort by epic number, then story number

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 LOADING SPRINT STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If no available stories: report "All stories complete!" and exit.
</step>

<step name="display_stories">
**Display available stories with file status**

For each story:
1. Check if story file exists in `docs/sprint-artifacts/`
2. Try patterns: `story-{epic}.{story}.md`, `{epic}-{story}.md`, `{story_key}.md`
3. Mark status: ✅ exists, ❌ missing, 🔄 already implemented

```markdown
## 📦 Available Stories (N)

### Ready for Dev (X)
1. **17-10** ✅ occupant-agreement-view
2. **17-11** ✅ agreement-status-tracking

### Backlog (Y)
3. **18-1** ❌ [needs story file]

Legend: ✅ ready | ❌ missing | 🔄 done but not tracked
```
</step>

<step name="validate_stories">
**Validate story files have required sections**

For each story with existing file:
1. Read story file
2. Check for 12 BMAD sections (Business Context, Acceptance Criteria, Tasks, etc.)
3. If invalid: mark for regeneration

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 VALIDATING STORY FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Note:** Stories with missing files will be auto-created in the execution step.
</step>

<step name="score_complexity">
**Score story complexity for pipeline routing**

For each validated story:

```bash
# Count tasks
TASK_COUNT=$(grep -c "^- \[ \]" "$STORY_FILE")

# Check for risk keywords
RISK_KEYWORDS="auth|security|payment|encryption|migration|database|schema"
HIGH_RISK=$(grep -ciE "$RISK_KEYWORDS" "$STORY_FILE")
```

**Scoring:**
| Criteria | micro | standard | complex |
|----------|-------|----------|---------|
| Tasks | ≤3 | 4-15 | ≥16 |
| Files | ≤5 | ≤30 | >30 |
| Risk keywords | 0 | low | high |

Store `complexity_level` for each story.
</step>

<step name="get_selection">
**Get user selection**

Use AskUserQuestion:
```
Which stories would you like to implement?

Options:
1. All ready-for-dev stories (X stories)
2. Select specific stories by number
3. Single story (enter key like "17-10")
```

Validate selection against available stories.
</step>

<step name="choose_mode">
**Choose execution mode**

Use AskUserQuestion:
```
How should stories be processed?

Options:
1. Sequential (recommended for gap analysis)
   - Process one-by-one in this session
   - Verify code → build gaps → check boxes → next

2. Parallel (for greenfield batch)
   - Spawn Task agents concurrently
   - Faster but harder to monitor
```

For sequential: proceed to `execute_sequential`
For parallel: proceed to `analyze_dependencies`
</step>

<step name="analyze_dependencies" if="mode == parallel">
**Dependency Analysis & Smart Wave Planning**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 ANALYZING DEPENDENCIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 1: Extract Dependencies from Each Story

For each selected story, read the story file and look for:

**1.1 Explicit dependencies (highest priority):**
```bash
# Look for depends_on in story frontmatter or metadata
grep -E "depends_on:|dependencies:|requires:" "$STORY_FILE"
```

Example in story file:
```markdown
## Dependencies
depends_on: [5-1, 5-2]
```

**1.2 File-based inference (medium priority):**
```bash
# Extract file paths mentioned in tasks
grep -oE "(src|components|lib|api|services)/[a-zA-Z0-9/_.-]+" "$STORY_FILE" | sort -u
```

Cross-reference: If Story B creates `src/components/PhotoUpload.tsx` and Story C references it, C depends on B.

**1.3 Keyword scanning (low priority):**
```bash
# Look for references to other stories
grep -oE "(story |from |uses |extends |builds on )[0-9]+-[0-9]+" "$STORY_FILE"
```

**1.4 Epic ordering (fallback):**
Within the same epic, assume lower story numbers should complete first unless contradicted by explicit dependencies.

### Step 2: Build Dependency Graph

```
Dependencies found:
  5-1: []                    # No dependencies
  5-2: [5-1]                 # Depends on 5-1
  5-3: []                    # No dependencies
  5-4: [5-1]                 # Depends on 5-1
  5-5: [5-4]                 # Depends on 5-4
  5-6: [5-2]                 # Depends on 5-2
```

### Step 3: Detect Circular Dependencies

```bash
# If circular dependency detected:
echo "⚠️ CIRCULAR DEPENDENCY: 5-1 → 5-3 → 5-1"
echo "Falling back to epic order for these stories"
```

### Step 4: Build Smart Waves

**Algorithm:**
1. Start with stories that have no unmet dependencies → Wave 1
2. After Wave 1 completes, stories whose dependencies are now met → Wave 2
3. Repeat until all stories are assigned
4. Respect `max_concurrent` limit per wave

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 WAVE PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Wave 1 (no dependencies):
  • 5-1 Polish Catch List View
  • 5-3 Polish Manual Catch Entry Form

Wave 2 (depends on Wave 1):
  • 5-2 Polish Catch Detail View (← 5-1)
  • 5-4 Fix Offline Photo Handling (← 5-1)

Wave 3 (depends on Wave 2):
  • 5-5 Improve Photo Upload Widget (← 5-4)
  • 5-6 Add Catch Edit Functionality (← 5-2)

Total: 6 stories in 3 waves
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 5: User Confirmation

Use AskUserQuestion:
```
Smart wave plan created based on dependency analysis.

Options:
1. Proceed with smart ordering (recommended)
2. Override: Process in selection order (ignore dependencies)
3. Adjust max concurrent (currently {{max_concurrent}})
```

**Store wave plan for execute_parallel step.**
</step>

<step name="execute_sequential" if="mode == sequential">
**Sequential Processing - Visible Agent Phases**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 SEQUENTIAL PROCESSING - VISIBLE AGENTS
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
STORY_FILE="docs/sprint-artifacts/{{story_key}}.md"

echo "🔍 Checking prerequisites..."
```

**Check 1: Story file exists?**
```bash
if [ ! -f "$STORY_FILE" ]; then
  echo "❌ STORY FILE MISSING: $STORY_FILE"
fi
```

⚠️ **CRITICAL: NEVER WRITE STORY FILES DIRECTLY!**

If story file is missing, you MUST use the proper story creation workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│  🚨 MANDATORY: Story Creation Enforcement                       │
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
│  ❌ DO NOT:                                                      │
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

⚠️ **CRITICAL: DO NOT wrap this in a Task!**
Execute the pipeline phases directly so each agent is a visible top-level Task.

**B.1: Load story-pipeline workflow:**
Read: `{project-root}/_bmad/bse/workflows/story-pipeline/workflow.md`

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

**Step C: Reconcile Using Completion Artifacts (orchestrator does this directly)**

After story-pipeline completes:

**C1. Load Fixer completion artifact:**
```bash
FIXER_COMPLETION="docs/sprint-artifacts/completions/{{story_key}}-fixer.json"

if [ ! -f "$FIXER_COMPLETION" ]; then
  echo "❌ WARNING: No completion artifact, using fallback"
  # Fallback to git diff if completion artifact missing
else
  echo "✅ Using completion artifact"
fi
```

Use Read tool on: `docs/sprint-artifacts/completions/{{story_key}}-fixer.json`

**C2. Parse completion data:**
Extract from JSON:
- files_created and files_modified arrays
- git_commit hash
- quality_checks results
- tests counts
- fixes_applied list

**C3. Read story file:**
Use Read tool: `docs/sprint-artifacts/{{story_key}}.md`

**C4. Check off completed tasks:**
For each task:
- Match task to files in completion artifact
- If file was created/modified: check off task
- Use Edit tool: `"- [ ]"` → `"- [x]"`

**C5. Fill Dev Agent Record:**
Use Edit tool with data from completion.json:
```markdown
### Dev Agent Record
**Implementation Date:** {{timestamp from json}}
**Agent Model:** Claude Sonnet 4.5 (multi-agent pipeline)
**Git Commit:** {{git_commit from json}}

**Files:** {{files_created + files_modified from json}}
**Tests:** {{tests.passing}}/{{tests.total}} passing ({{tests.coverage}}%)
**Issues Fixed:** {{issues_fixed.total}} issues
```

**C6. Verify updates:**
```bash
CHECKED=$(grep -c "^- \[x\]" "$STORY_FILE")
[ "$CHECKED" -gt 0 ] || { echo "❌ Zero tasks checked"; exit 1; }
echo "✅ Reconciled: $CHECKED tasks"
```

**C7. Update sprint-status.yaml:**
Use Edit tool: `"{{story_key}}: ready-for-dev"` → `"{{story_key}}: done"`

**Step D: Next story or complete**
- If more stories: continue loop
- If complete: proceed to `summary`
</step>

<step name="execute_parallel" if="mode == parallel">
**Parallel Processing with Smart Wave Pattern**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 PARALLEL PROCESSING (SMART WAVES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Uses wave plan from dependency analysis step.**

**Wave Configuration:**
- Max concurrent: `{{max_concurrent}}` (default 3, user can override)
- Smart ordering: Dependencies respected
- Wait for wave completion before next wave

**For each wave in wave_plan:**

### Step 1: Display Wave Header

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌊 WAVE {{wave_number}}/{{total_waves}}: {{story_keys}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dependencies satisfied: {{deps_from_previous_waves}}
Spawning {{count}} parallel pipeline agents...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 2: Spawn Task agents (up to 3 parallel)

```
Task({
  subagent_type: "general-purpose",
  description: "🔨 Pipeline: {{story_key}}",
  prompt: `
Execute story-pipeline for story {{story_key}}.

<execution_context>
@story-pipeline/workflow.md
</execution_context>

<context>
Story: [inline story content]
Complexity: {{complexity_level}}
</context>

<success_criteria>
- [ ] All pipeline phases complete
- [ ] Git commit created
- [ ] Progress artifact updated at each phase
- [ ] Return ## AGENT COMPLETE with summary
</success_criteria>
`
})
```

### Step 3: Poll Progress While Waiting (Smart Polling)

**Poll every 30 seconds, but only display when something changes.**

**State tracking:**
```
# Track last known state for each story
LAST_STATE = {}  # { "6-1": "BUILD", "6-3": "PREPARE", ... }
```

**Polling loop:**
```
WHILE any agent still running:
  SLEEP 30 seconds

  changes_detected = false
  current_states = {}

  FOR each story in wave:
    PROGRESS = "docs/sprint-artifacts/completions/${story}-progress.json"

    IF file exists:
      phase = READ progress artifact -> current_phase
      details = READ progress artifact -> phases[phase].details
    ELSE:
      phase = "STARTING"
      details = "Initializing..."
    END IF

    current_states[story] = phase

    IF phase != LAST_STATE[story]:
      changes_detected = true
      # Log the transition
      PRINT "📍 ${story}: ${LAST_STATE[story]} → ${phase}"
    END IF
  END FOR

  IF changes_detected:
    DISPLAY full progress table
  END IF

  LAST_STATE = current_states
END WHILE
```

**Display on change:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌊 WAVE {{wave_number}} IN PROGRESS ({{elapsed}})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 6-1: BUILD → VERIFY (phase changed)

  6-1   👁️ VERIFY    4 reviewers checking...
  6-3   🔨 BUILD     Metis implementing...
  6-6   📋 PREPARE   Loading playbooks...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Phase status icons:**
```
⏳ STARTING   Agent initializing
📋 PREPARE    Loading story & playbooks
🔨 BUILD      Metis implementing
👁️ VERIFY     Reviewers checking
⚖️ ASSESS     Themis triaging
🔧 REFINE     Fixing issues
💾 COMMIT     Reconciling & committing
📚 REFLECT    Mnemosyne learning
✅ COMPLETE   Done
```

**Polling behavior:**
- **Frequency:** Every 30 seconds
- **Display:** Only when phase changes detected
- **Quiet mode:** No output if nothing changed (avoids spam)
- **Completion:** Show final status when agent finishes

**Transition announcements:**
When a story changes phase, announce it inline:
```
📍 6-1: BUILD → VERIFY
📍 6-3: PREPARE → BUILD
📍 6-6: VERIFY → ASSESS
✅ 6-1: COMPLETE (3m 42s)
```

This gives real-time feel without flooding the screen with unchanged status.

### Step 4: Display Wave Summary

After all agents complete, read progress artifacts and display detailed summary:

```bash
# Read progress files for this wave
for story in {{wave_stories}}; do
  PROGRESS="docs/sprint-artifacts/completions/${story}-progress.json"
  if [ -f "$PROGRESS" ]; then
    cat "$PROGRESS"
  fi
done
```

**Display format (terminal-friendly):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌊 WAVE {{wave_number}} COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  5-1  ✅ done   25 tests   97.6% cov   4→0 issues   8a1a0f0
  5-2  ✅ done   22 tests   100% cov    2→0 issues   481c7fd
  5-3  ✅ done   32 tests   89.2% cov   6→0 issues   e94460c

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Wave Summary: {{success}}/{{total}} succeeded
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Column format:** `Story  Status  Tests  Coverage  Issues  Commit`
- **Tests**: Number of tests (e.g., "25 tests")
- **Coverage**: Line coverage (e.g., "97.6% cov")
- **Issues**: found→remaining (e.g., "4→0 issues")
- **Commit**: Short git hash

**For failures, show phase details:**
```
5-3 (FAILED):
  ✓ PREPARE: standard, 2 playbooks
  ✓ BUILD: 8 files, 423 lines
  ✗ VERIFY: Cerberus found critical security issue
  ⏳ ASSESS: Skipped
  ⏳ REFINE: Skipped
  ⏳ COMMIT: Skipped
```

**Status icons:**
- ✓ = Complete
- ⚠ = Completed with warnings
- ✗ = Failed
- ⏳ = Pending/Skipped

**Coverage must always be populated.** If missing, it indicates a bug in the pipeline - the coverage gate in Phase 4 should always capture this metric.

### Step 5: Orchestrator reconciles each completed story

For each successful story:
- Check off tasks in story file
- Fill Dev Agent Record
- Update sprint-status to done

### Step 6: Continue to next wave or summary
</step>

<step name="summary">
**Generate Comprehensive Session Summary**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 PHASE: SESSION REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hermes compiling comprehensive session summary...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 1: Gather All Completion Artifacts

```bash
SESSION_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_DIR="docs/sprint-artifacts/session-reports"
mkdir -p "$REPORT_DIR"

# Collect all artifacts for processed stories
for story in {{all_stories}}; do
  echo "Gathering artifacts for $story..."

  # Progress artifact
  cat "docs/sprint-artifacts/completions/${story}-progress.json" 2>/dev/null

  # Agent artifacts
  cat "docs/sprint-artifacts/completions/${story}-metis.json" 2>/dev/null
  cat "docs/sprint-artifacts/completions/${story}-argus.json" 2>/dev/null
  cat "docs/sprint-artifacts/completions/${story}-themis.json" 2>/dev/null
  cat "docs/sprint-artifacts/completions/${story}-mnemosyne.json" 2>/dev/null
done
```

### Step 2: Spawn Hermes (Session Reporter)

**Load persona:**
Read: `{project-root}/_bmad/bse/workflows/batch-stories/agents/session-reporter.md`

```
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "📜 Hermes generating session report",
  prompt: `
You are HERMES 📜 - Messenger of the Gods.

Your job is to create a comprehensive Session Summary Report from the batch
story implementation session that just completed.

<stories_processed>
{{list of story keys}}
</stories_processed>

<individual_story_summaries>
{{For each story, the full content of {{story}}-summary.md - these contain
the detailed verification guides that we'll reference in the session report}}
</individual_story_summaries>

<hermes_artifacts>
{{For each story, the {{story}}-hermes.json containing:
  - tldr: One paragraph summary
  - quick_stats: files, lines, tests, coverage, issues
  - verification_items: count of manual checklist items
}}
</hermes_artifacts>

<progress_artifacts>
{{All collected {{story}}-progress.json files}}
</progress_artifacts>

<git_log>
{{Recent commits from this session}}
</git_log>

<session_metadata>
Session Start: {{start_time}}
Session End: {{end_time}}
Mode: {{sequential|parallel}}
</session_metadata>

**IMPORTANT:** Each story already has its own detailed summary report with verification guide.
Your job is to create an AGGREGATE session report that:
- Shows the TL;DR of each story (from hermes artifacts)
- Provides aggregate metrics across all stories
- Points users to individual story reports for detailed verification
- Does NOT duplicate the per-story verification checklists (reference them instead)

Generate a comprehensive report following the template in your persona file.
The report should be 1-2 pages and include:

1. **Executive Summary** (2-3 paragraphs)
   - What was accomplished (business value)
   - Key metrics (files, tests, coverage)
   - Overall success/issues

2. **Features Delivered** (per story)
   - What each story delivers in user-facing terms
   - Key capabilities added

3. **Technical Summary**
   - Files created/modified table
   - Quality metrics table
   - Git commits list

4. **Verification Guide**
   - How to run tests
   - Manual testing checklist per story
   - API testing examples if applicable

5. **Issues & Tech Debt**
   - What was fixed
   - What was deferred

6. **Next Steps**
   - Immediate actions
   - Follow-up tasks
   - Pre-deployment checklist

Save the full report to:
  docs/sprint-artifacts/session-reports/session-{{timestamp}}.md

Then output a condensed terminal summary.
`
})
```

### Step 3: Display Quick Summary with TL;DRs

After Hermes completes, display condensed results showing each story's TL;DR:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 SESSION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Session Totals
   Stories: {{completed}}/{{total}} completed
   Files:   {{total_files}} changed ({{total_lines}} lines)
   Tests:   {{total_tests}} added
   Coverage: {{avg_coverage}}% average
   Issues:  {{total_issues}} found → {{total_fixed}} fixed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 STORY SUMMARIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{For each story, read from {{story}}-hermes.json:}}

┌─────────────────────────────────────────────────────────────────────────────┐
│ {{story_key}}: {{story_title}}                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ {{files}} files | {{lines}} lines | {{tests}} tests | {{coverage}}% cov    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ {{TL;DR from hermes.json - 3-5 sentences summarizing what was built        │
│   and the key outcome. This gives the user a quick understanding           │
│   of what each story accomplished without reading the full report.}}       │
│                                                                             │
│ 📋 Verification: {{verification_items}} checklist items                     │
│ 📄 Full Report: completions/{{story_key}}-summary.md                        │
└─────────────────────────────────────────────────────────────────────────────┘

{{Repeat box for each story...}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 QUICK VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   npm test              # Run all {{total_tests}} tests
   npm run dev           # Start dev server and explore

   Per-story verification guides in:
   docs/sprint-artifacts/completions/{{story}}-summary.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 REPORTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Session Report: {{session_report_path}}
   Story Reports:
{{For each story:}}
     • {{story_key}}: completions/{{story_key}}-summary.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 4: Offer Report Actions

Use AskUserQuestion:
```
Session report generated. What would you like to do?

Options:
1. View full report in terminal (display report content)
2. Open report file (provides path)
3. Continue (done, move on)
```

**If user selects "View full report":**
Read and display `docs/sprint-artifacts/session-reports/session-{{timestamp}}.md`

### Alternative: Orchestrator-Generated Summary

If Task agent is not available or for simpler sessions, the orchestrator can generate
the summary directly by following this template:

**Gather data:**
```bash
# Calculate totals
TOTAL_FILES=0
TOTAL_LINES=0
TOTAL_TESTS=0
COVERAGE_SUM=0

for story in {{all_stories}}; do
  PROGRESS="docs/sprint-artifacts/completions/${story}-progress.json"
  if [ -f "$PROGRESS" ]; then
    FILES=$(jq '.metrics.files_changed // 0' "$PROGRESS")
    LINES=$(jq '.metrics.lines_added // 0' "$PROGRESS")
    TESTS=$(jq '.metrics.tests_added // 0' "$PROGRESS")
    COV=$(jq '.metrics.coverage | gsub("%"; "") | tonumber // 0' "$PROGRESS")

    TOTAL_FILES=$((TOTAL_FILES + FILES))
    TOTAL_LINES=$((TOTAL_LINES + LINES))
    TOTAL_TESTS=$((TOTAL_TESTS + TESTS))
    COVERAGE_SUM=$((COVERAGE_SUM + COV))
  fi
done

AVG_COVERAGE=$((COVERAGE_SUM / {{story_count}}))
```

**Generate markdown report:**
Use Write tool to create `docs/sprint-artifacts/session-reports/session-{{timestamp}}.md`
following the template structure in `session-reporter.md`.

**Display terminal summary:**
Output the quick summary format shown above.
</step>

<step name="epic_completion_check">
### Check Epic Completion

After session completes, check if the epic is now fully done:

```bash
# If this was an epic batch, check if all stories are done
IF epic provided (e.g., epic=17):
  EPIC_KEY="epic-{{epic}}"

  # Get all stories in this epic from sprint-status.yaml
  EPIC_STORIES=$(grep "^  {{epic}}-" docs/sprint-artifacts/sprint-status.yaml | cut -d: -f1 | tr -d ' ')

  # Check if ALL stories are "done"
  ALL_DONE=true
  for story in $EPIC_STORIES; do
    STATUS=$(grep "^  $story:" docs/sprint-artifacts/sprint-status.yaml | cut -d: -f2 | tr -d ' ')
    if [ "$STATUS" != "done" ]; then
      ALL_DONE=false
      break
    fi
  done

  IF ALL_DONE:
    # Mark epic as done
    Use Edit tool on sprint-status.yaml:
    "{{EPIC_KEY}}: in-progress" → "{{EPIC_KEY}}: done"

    **📢 Orchestrator says:**
    > "🎉 **EPIC {{epic}} COMPLETE!** All {{story_count}} stories are done and the epic is now marked as complete in sprint-status.yaml."
  ELSE:
    REMAINING=$(echo "$EPIC_STORIES" | wc -l) - {{completed_count}}
    **📢 Orchestrator says:**
    > "📊 **Epic {{epic}} Progress:** {{completed_count}}/{{total_stories}} stories done. {{REMAINING}} stories remaining."
  ENDIF
ENDIF
```

### Commit Epic Completion (if applicable)

```bash
IF epic marked as done:
  git add docs/sprint-artifacts/sprint-status.yaml

  git commit -m "$(cat <<'EOF'
chore(epic-{{epic}}): mark epic as complete

All {{story_count}} stories in epic {{epic}} have been implemented,
reviewed, and verified. Epic marked as done.
EOF
)"

  **📢 Orchestrator says:**
  > "Epic completion committed: {{git_commit}}"
ENDIF
```

</step>

</process>

<failure_handling>
**Story file missing:** Skip with warning, continue to next.
**Pipeline fails:** Mark story as failed, continue to next.
**Iterative refinement exhausted:** User escalation, then continue or halt.
**Reconciliation fails:** Fix with Edit tool, retry verification.
**All stories fail:** Report systemic issue, halt batch.
</failure_handling>

<success_criteria>
- [ ] All selected stories processed
- [ ] Each story has zero MUST_FIX issues (or user accepted remaining)
- [ ] Each story has checked tasks (count > 0)
- [ ] Each story has Dev Agent Record filled
- [ ] SHOULD_FIX/STYLE logged as tech debt (if any)
- [ ] Sprint status updated for all stories
- [ ] Session report generated and saved
- [ ] Verification checklist provided
- [ ] Summary displayed with results
</success_criteria>
