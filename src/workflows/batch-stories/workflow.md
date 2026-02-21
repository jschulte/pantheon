# Batch Stories - Unified Workflow

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

<story_quality_guidance>
**IMPORTANT: Story File Quality Determines Output Quality**

Before running batch-stories, verify your story files are robust enough:

| File Size | Likely Quality | Recommendation |
|-----------|---------------|----------------|
| < 3KB | Too thin | Will produce poor results. Regenerate with more context. |
| 3-6KB | Minimal | May work for trivial/micro stories only. Enrich for anything larger. |
| 6-10KB | Adequate | Sufficient for light/standard stories. |
| 10KB+ | Good | Recommended for standard+ stories. Rich context = better implementation. |

**What makes a story robust:**
- Detailed Business Context (not just "add a button")
- Specific Acceptance Criteria with edge cases
- Technical Requirements mentioning frameworks, patterns, constraints
- Dev Agent Guardrails with anti-patterns and gotchas
- Current State describing what exists already

**Rule of thumb:** If the story doesn't give a human developer enough context to implement it well, it won't give an AI agent enough either. Run `npm run validate:stories` before batch processing.
</story_quality_guidance>

<config>
name: batch-stories
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
- Spawn ad-hoc Task agents to "implement a story" outside workflow phases
- Use Task tool with prompts like "implement story X" that bypass the pipeline
- Delegate story implementation to a general-purpose agent
- Skip the story-pipeline phases defined in story-pipeline/workflow.md

**When spawning Task agents:**
- Only spawn Tasks for phases explicitly defined in story-pipeline/workflow.md
- Phase 2: BUILD - Metis (builder)
- Phase 3: VERIFY - Argus (inspector), Nemesis (test quality), Eudaimonia (requirements), reviewers (Cerberus/Apollo/Hestia/Arete/Iris)
- Phase 4: ASSESS - Themis (arbiter) triages issues
- Phase 5: REFINE - Metis resumed with MUST_FIX issues, iterative loop
- Phase 7: REFLECT - Mnemosyne (reflection)

**Why this matters:**
The story-pipeline ensures proper verification, testing, and quality gates. Spawning ad-hoc "implementation" agents bypasses these safeguards and leads to incomplete or untested implementations.
</execution_discipline>

## Phase Routing

Load phases on-demand from the `phases/` directory.

| # | Phase | File | Condition | ~Lines |
|---|-------|------|-----------|--------|
| 1 | Select Stories | phases/select-stories.md | Always | 210 |
| 2 | Plan Parallel | phases/plan-parallel.md | mode==parallel | 165 |
| 3a | Execute Sequential | phases/execute-sequential.md | mode==sequential | 130 |
| 3b | Execute Parallel | phases/execute-parallel.md | mode==parallel | 550 |
| 3c | Quality Gates | phases/quality-gates.md | mode==parallel | 180 |
| 4 | Report & Summary | phases/report-summary.md | Always | 300 |

**Execution flow:**
1. Always load `phases/select-stories.md` first
2. Based on mode selection in choose_mode step:
   - Sequential: Load `phases/execute-sequential.md`
   - Parallel: Load `phases/plan-parallel.md`, then `phases/execute-parallel.md`, then `phases/quality-gates.md`
3. Always load `phases/report-summary.md` last

> **Worktree Isolation (3b):** In parallel mode, the lead creates 3 persistent worktrees with
> independent `node_modules` (via `npm ci`). Stories are assigned to worktrees — dependencies
> go to the same worktree, remaining stories are load-balanced. Each worker gets exactly ONE
> story (single-story contract). When a worker finishes, the lead merges to the integration
> branch and spawns a NEW worker in the same worktree for the next story. The new worker pulls
> integration first, getting all previously completed code. This eliminates git staging
> contention, concurrent build fights, and the `mkdir`-based commit queue.

> **Quality Gates (3c):** In parallel mode, individual workers skip type-check and lint during
> their phases (batch_mode flag). Phase 3c verifies the integration merge, runs type-check,
> full test suite (catches cross-story issues), and lint once after all stories complete.
> Auto-fixes what it can, spawns a fixer for remaining issues. Sequential mode runs
> type-check/lint per-story as before — no quality gates phase needed.

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
