# Story Closer

<purpose>
Close out nearly-complete stories by scanning for unchecked tasks, autonomously executing
remaining work, reviewing quality, and updating all artifacts. Designed to run at scale
across 100+ stories in batch mode with deferred human escalation.

Key difference from story-pipeline: ignores sprint-status entirely and scans actual task
checkboxes in every story file. Stories marked "done" with unchecked tasks are still candidates.
Lightweight closer flow for stories ≤30% unchecked; routes to full story-pipeline for >30%.
</purpose>

<config>
name: story-closer
execution_mode: batch_orchestration

phases:
  phase_1: SCAN (scan all story files, categorize by completion)
  phase_2: PRESENT (show findings, user selects batch + execution mode)
  phase_3: EXECUTE (autonomous per-story closer flow, sequential or parallel)
  phase_4: DEBRIEF (summary, blocker questions, re-run option)

triage:
  closeable_threshold: 0.30  # ≤30% unchecked → story-closer handles
  clean_threshold: 0         # 0 unchecked → skip (already done)
  needs_pipeline: ">30%"     # >30% unchecked → route to full story-pipeline

review:
  mode: consolidated         # Single Multi-Reviewer agent per story
  perspectives: [Argus, Nemesis, Cerberus, Hestia]
  max_fix_iterations: 2

issue_classification:
  MUST_FIX: "Blocks completion - security, correctness, tests fail"
  SHOULD_FIX: "Real issue but non-blocking - edge cases, minor bugs"
  STYLE: "Preference only - naming, formatting, alternative approaches"

sprint_artifacts: "docs/sprint-artifacts"

human_validation_patterns:
  - "manually verify"
  - "manual test"
  - "QA sign-off"
  - "user acceptance"
  - "visually confirm"
  - "browser test"
  - "human review"
</config>

<agents>
## Story Closer Agents

| Role | Name | Domain | Emoji |
|------|------|--------|-------|
| Closer Worker | **Teleos** | Spirit of completion and fulfillment | 🔧 |
| Multi-Reviewer | **Consolidated** | Argus+Nemesis+Cerberus+Hestia in one pass | 👁️🧪🔐🏛️ |
| Reconciler | **Eunomia** | Goddess of lawful conduct (reused from story-pipeline) | 📋 |

**Teleos** is the per-story worker agent (like Heracles in batch-stories). Each Teleos
instance processes one story: executes unchecked tasks, spawns a Multi-Reviewer, fixes
MUST_FIX issues, reconciles checkboxes, updates sprint-status, and commits.
</agents>

<execution_discipline>
**How This Workflow Executes**

### Context 1: Main Session (via Skill invocation)

1. User invokes the story-closer workflow
2. Main session loads this workflow.md
3. Phase 1 SCAN runs in orchestrator context (grep across story files)
4. Phase 2 PRESENT displays findings, collects user selection
5. Phase 3 EXECUTE spawns Teleos workers (sequential or parallel)
6. Phase 4 DEBRIEF summarizes results and presents blocker questions

### Context 2: Batch Integration

1. Can be invoked programmatically with a pre-selected story list
2. Skip Phase 2 (PRESENT) if story list provided as input
3. Execute and debrief as normal

### Task Agents Used:

- Phase 3 EXECUTE: `Task(subagent_type: "general-purpose")` → Teleos (per-story worker)
- Per-story review: `Task(subagent_type: "general-purpose")` → Consolidated Multi-Reviewer
- Per-story reconciliation: Inline in Teleos (Eunomia pattern, not separate agent)

### Orchestration Rules:

- Orchestrator passes goal + context payloads to agents (not step-by-step instructions)
- Teleos workers are self-contained — they read closer-worker.md for their full instructions
- Blocker questions are collected in an array and returned to orchestrator, NOT raised during execution
- Human-validation tasks are identified by pattern matching and skipped, collected for debrief
</execution_discipline>

<failure_handling>
**Story not found:** Skip, log warning in results
**Task execution fails after retries:** Log as blocked with question, move to next task
**Multi-Reviewer fails:** Log warning, proceed with reconciliation based on work done
**Git commit fails:** Log error, continue to next story
**Max review iterations reached:** Accept current state, note in debrief
**Story routed to full pipeline:** Not a failure — triage working correctly
</failure_handling>

<process>
## Phase Execution

Each phase is defined in its own file under `phases/`. Load each phase file
with the Read tool when you reach it. Execute phases sequentially.

**Phase file path pattern:** `{workflow-dir}/phases/phase-{N}-{name}.md`

| Phase | File | Gate | Description |
|-------|------|------|-------------|
| 1 SCAN | `phases/phase-1-scan.md` | Always | Scan all story files, categorize |
| 2 PRESENT | `phases/phase-2-present.md` | Always (skip if story list provided) | User selects batch + mode |
| 3 EXECUTE | `phases/phase-3-execute.md` | Stories selected | Autonomous per-story closer |
| 4 DEBRIEF | `phases/phase-4-debrief.md` | Always | Summary + blocker questions |

**IMPORTANT:** Read phase files on-demand. Do NOT read all phase files upfront.
Load only the current phase, execute it, then load the next.
</process>

<success_criteria>
- [ ] Phase 1 SCAN: All story files scanned, categorized correctly
- [ ] Phase 2 PRESENT: User selected stories and execution mode
- [ ] Phase 3 EXECUTE: All selected stories processed (completed, blocked, or routed to pipeline)
- [ ] Phase 4 DEBRIEF: Summary presented, blocker questions collected
- [ ] Story checkboxes updated for completed tasks
- [ ] sprint-status.yaml updated for completed stories
- [ ] Completion reports generated/updated
- [ ] Git commits exist for each completed story
- [ ] Blocker questions and human-validation tasks reported
</success_criteria>
