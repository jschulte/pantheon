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
version: 3.4.0

modes:
  sequential: {description: "Process one-by-one in this session", recommended_for: "gap analysis"}
  parallel: {description: "Spawn concurrent Task agents", recommended_for: "greenfield batch"}

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
For parallel: proceed to `execute_parallel`
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
The workflow describes spawning these Tasks - spawn them DIRECTLY:

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
**Parallel Processing with Wave Pattern**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 PARALLEL PROCESSING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Wave Configuration:**
- Max concurrent: 3 agents
- Wait for wave completion before next wave

**For each wave:**

### Step 1: Display Wave Header

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌊 WAVE {{wave_number}}: {{story_keys}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

### Step 3: Wait for all agents in wave to complete

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

**Display format:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌊 WAVE {{wave_number}} COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{story_key_1}}:
  ✓ PREPARE: {{complexity}}, {{playbook_count}} playbooks
  ✓ BUILD: {{files_created}} files, {{lines_added}} lines
  ✓ VERIFY: {{agent_count}} reviewers, {{issues_found}} issues
  ✓ ASSESS: {{must_fix}} MUST_FIX, {{should_fix}} logged
  ✓ REFINE: {{iterations}} iterations
  ✓ COMMIT: {{git_commit}}
  ✓ REFLECT: {{playbook_action}}

{{story_key_2}}:
  ✓ PREPARE: ...
  ✓ BUILD: ...
  ...

{{story_key_3}}:
  ⚠ BUILD: ...
  ✗ VERIFY: Failed - {{error}}
  ⏳ Remaining phases skipped

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Wave Summary: {{success}}/{{total}} succeeded
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Status icons:**
- ✓ = Complete
- ⚠ = Completed with warnings
- ✗ = Failed
- ⏳ = Pending/Skipped

### Step 5: Orchestrator reconciles each completed story

For each successful story:
- Check off tasks in story file
- Fill Dev Agent Record
- Update sprint-status to done

### Step 6: Continue to next wave or summary
</step>

<step name="summary">
**Display Batch Summary**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ BATCH COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stories processed: {{total}}
Successful: {{success_count}}
Failed: {{fail_count}}

## Results

| Story | Status | Tasks | Commit |
|-------|--------|-------|--------|
| 17-10 | ✅ done | 8/8 | abc123 |
| 17-11 | ✅ done | 5/5 | def456 |

## Next Steps
- Run /bmad:sprint-status to verify
- Review commits with git log
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
- [ ] Summary displayed with results
</success_criteria>
