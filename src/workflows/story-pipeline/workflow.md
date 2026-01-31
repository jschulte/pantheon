# Story Pipeline v6.0 - Greek Pantheon Edition

<purpose>
Implement a story using parallel verification agents with Builder context reuse.
Enhanced with playbook learning, code citation evidence, test quality validation, pragmatic triage, and automated coverage gates.
Builder fixes issues in its own context (50-70% token savings).
</purpose>

<philosophy>
**Quality Through Discipline, Continuous Learning**

- Phase 1 PREPARE: Validate story quality, load playbooks
- Phase 2 BUILD: Metis implements with TDD
- Phase 3 VERIFY: Argus + Nemesis + reviewers validate in parallel
- Phase 4 ASSESS: Coverage gate + Themis triages issues pragmatically
- Phase 5 REFINE: Metis fixes real issues, iterate until clean
- Phase 6 COMMIT: Reconcile story, update status
- Phase 7 REFLECT: Mnemosyne updates playbooks for future

Measure twice, cut once. Trust but verify. Evidence-based validation. Self-improving system.
</philosophy>

<agents>
## The Greek Pantheon

| Role | Name | Domain | Emoji |
|------|------|--------|-------|
| Builder | **Metis** | Goddess of wisdom, skill, and craft | 🔨 |
| Inspector | **Argus** | The 100-eyed giant who sees everything | 👁️ |
| Test Quality | **Nemesis** | Goddess of retribution and balance | 🧪 |
| Security | **Cerberus** | Three-headed guardian of the underworld | 🔐 |
| Logic/Perf | **Apollo** | God of reason, truth, and light | ⚡ |
| Architecture | **Hestia** | Goddess of hearth, home, and structure | 🏛️ |
| Quality | **Arete** | Personification of excellence | ✨ |
| Arbiter | **Themis** | Titan of justice and fair judgment | ⚖️ |
| Reflection | **Mnemosyne** | Titan of memory | 📚 |
| Accessibility | **Iris** | Goddess of the rainbow, bridges realms | 🌈 |
</agents>

<execution_discipline>
**CRITICAL: How This Workflow Executes**

This workflow is designed to run in the **main Claude context** (the orchestrator).
It is invoked via `/bmad_bse_story-pipeline` (a Skill), NOT as a Task subagent.

**Correct Execution Flow:**
1. User invokes `/bmad_bse_story-pipeline {story-key}`
2. Orchestrator (main context) loads this workflow.md
3. Orchestrator executes phases sequentially, spawning Task agents ONLY as defined below
4. Task agents return artifacts; orchestrator continues with next phase

**Task Agents Are ONLY Used For:**
- Phase 2 BUILD: `Task(subagent_type: "general-purpose")` → Metis (Builder)
- Phase 3 VERIFY: `Task(subagent_type: ...)` → Argus + Nemesis + Cerberus/Apollo/Hestia/Arete - in parallel
- Phase 4 ASSESS: `Task(subagent_type: ...)` → Themis (triage arbiter)
- Phase 5 REFINE: Iterative loop:
  - `Task(resume: builder_id)` → Metis fixes MUST_FIX
  - `Task(resume: reviewer_id)` → Original reviewers verify their issues
  - `Task(subagent_type: ...)` → Fresh eyes (iteration 2+)
- Phase 7 REFLECT: `Task(subagent_type: ...)` → Mnemosyne (Reflection)

**NEVER DO THIS:**
- Spawn a `dev-typescript` or other Task agent to implement a story outside this workflow
- Use Task tool to bypass the multi-agent verification structure
- Let the orchestrator write implementation code directly (delegate to Metis)

**WHY:**
Ad-hoc Task agents lack:
- Playbook knowledge (Phase 1)
- Independent verification (Phase 3)
- Issue classification (MUST_FIX/SHOULD_FIX/STYLE)
- Pragmatic triage (Themis in Phase 4)
- Code citation evidence (Argus)
- Test quality validation (Nemesis)
- Security/architecture review (Cerberus/Apollo/Hestia/Arete)
- Coverage gates (Phase 4)
- Iterative refinement until issues resolved (Phase 5)

The workflow structure EXISTS to prevent bugs that slip through when a single agent implements and self-certifies.
</execution_discipline>

<config>
name: story-pipeline
version: 6.0.0
execution_mode: multi_agent

phases:
  phase_1: PREPARE (story quality gate + playbook query)
  phase_2: BUILD (Metis implements with TDD)
  phase_3: VERIFY (Argus + Nemesis + reviewers in parallel)
  phase_4: ASSESS (coverage gate + Themis triage)
  phase_5: REFINE (Metis fixes + iterate until clean)
  phase_6: COMMIT (reconcile story, update status)
  phase_7: REFLECT (Mnemosyne updates playbooks)

issue_classification:
  MUST_FIX: "Blocks completion - security, correctness, tests fail"
  SHOULD_FIX: "Real issue but non-blocking - edge cases, minor bugs"
  STYLE: "Preference only - naming, formatting, alternative approaches"

complexity_scale:
  # Scale from 1-6 verification agents based on story complexity
  # Argus (Inspector) is ALWAYS included - he's the baseline

  trivial:
    total_agents: 1
    agents: [Argus]
    triggers: [static pages, copy changes, config updates, single-file changes]
    skip_nemesis: true  # No test quality review needed for trivial

  micro:
    total_agents: 2
    agents: [Argus, Hestia]
    triggers: [1-2 tasks, no API calls, no user input, simple UI component]
    skip_nemesis: true

  light:
    total_agents: 3
    agents: [Argus, Nemesis, Hestia]
    triggers: [3-4 tasks, basic CRUD, simple form, no auth]

  standard:
    total_agents: 4
    agents: [Argus, Nemesis, Cerberus, Hestia]
    triggers: [5-10 tasks, API integration, user input handling]

  complex:
    total_agents: 5
    agents: [Argus, Nemesis, Cerberus, Apollo, Hestia]
    triggers: [11-15 tasks, auth flows, payment adjacent, data migrations]

  critical:
    total_agents: 6
    agents: [Argus, Nemesis, Cerberus, Apollo, Hestia, Arete]
    triggers: [16+ tasks, security keywords, payment processing, encryption, PII]

quality_gates:
  coverage_threshold: 80  # % line coverage required
  task_verification: "all_with_evidence"  # Argus must cite file:line
  must_fix_issues: "iterate_until_resolved"
  max_iterations: 3

token_efficiency:
  - Phase 3 agents spawn in parallel (same cost, faster)
  - Phase 5 resumes Metis (50-70% token savings vs fresh agent)
  - Phase 5 resumes ONLY reviewers who had MUST_FIX issues (targeted verification)
  - Fresh eyes added only on iteration 2+ (avoids redundant full re-review)

playbooks:
  enabled: true
  directory: "docs/playbooks/implementation-playbooks"
  max_load: 3
  auto_apply_updates: false
</config>

<execution_context>
@patterns/verification.md
@patterns/tdd.md
@patterns/agent-completion.md
</execution_context>

<orchestrator_narrative>
## Orchestrator Checkpoint System

Between each phase, the orchestrator outputs a brief narrative to keep the user informed.
These are friendly status updates - not verbose, just enough to orient the user.

**Example checkpoints:**
- "Metis is building... this may take a few minutes."
- "Good news - Metis finished! Now the reviewers will take a look."
- "Themis has weighed the issues. 2 need fixing, 3 were gold-plating."
- "All clear! Moving to commit the changes."

**Implementation:** Orchestrator outputs these as regular text messages between Task spawns.
</orchestrator_narrative>

<progress_artifact>
## Progress Tracking for Parallel Execution

When running in parallel (batch mode), each pipeline writes progress to a JSON file.
This allows the batch orchestrator to report detailed wave summaries.

**File:** `docs/sprint-artifacts/completions/{{story_key}}-progress.json`

**Structure:**
```json
{
  "story_key": "{{story_key}}",
  "started_at": "ISO timestamp",
  "current_phase": "BUILD",
  "phases": {
    "PREPARE": { "status": "complete", "details": "2 playbooks loaded" },
    "BUILD": { "status": "in_progress", "details": "implementing..." },
    "VERIFY": { "status": "pending" },
    "ASSESS": { "status": "pending" },
    "REFINE": { "status": "pending" },
    "COMMIT": { "status": "pending" },
    "REFLECT": { "status": "pending" }
  },
  "metrics": {
    "files_changed": 0,
    "lines_added": 0,
    "issues_found": 0,
    "must_fix": 0,
    "iterations": 0
  }
}
```

**Update Points:**
- After Phase 1: PREPARE complete, playbooks loaded
- After Phase 2: BUILD complete, files/lines counts
- After Phase 3: VERIFY complete, issues found
- After Phase 4: ASSESS complete, triage results
- After Phase 5: REFINE complete (or each iteration)
- After Phase 6: COMMIT complete
- After Phase 7: REFLECT complete, final status

**Write with:**
```bash
PROGRESS_FILE="docs/sprint-artifacts/completions/{{story_key}}-progress.json"
cat > "$PROGRESS_FILE" << 'EOF'
{ ... updated JSON ... }
EOF
```

Or use the Write tool to update the file.
</progress_artifact>

<process>

<step name="phase_1_prepare">
## Phase 1: PREPARE (1/7)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PHASE 1: PREPARE (1/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Story quality gate + Playbook query
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.1 Load and Parse Story

```bash
STORY_FILE="docs/sprint-artifacts/{{story_key}}.md"
[ -f "$STORY_FILE" ] || { echo "ERROR: Story file not found"; exit 1; }
```

Use Read tool. Extract:
- Task count
- Acceptance criteria count
- Keywords for risk scoring

### 1.2 Determine Complexity (6-tier scale)

```bash
TASK_COUNT=$(grep -c "^- \[ \]" "$STORY_FILE")
CRITICAL_KEYWORDS=$(grep -ciE "payment|encryption|PII|credentials|secret" "$STORY_FILE")
RISK_KEYWORDS=$(grep -ciE "auth|security|migration|database|API" "$STORY_FILE")
TRIVIAL_KEYWORDS=$(grep -ciE "static|policy|content|copy|config|readme" "$STORY_FILE")

# Check for trivial indicators
HAS_API=$(grep -ciE "fetch|axios|API|endpoint|route\.ts" "$STORY_FILE")
HAS_USER_INPUT=$(grep -ciE "form|input|onChange|submit" "$STORY_FILE")
```

**Complexity decision tree:**

```
IF CRITICAL_KEYWORDS > 0 OR TASK_COUNT >= 16:
  COMPLEXITY = "critical"
  AGENTS = [Argus, Nemesis, Cerberus, Apollo, Hestia, Arete]  # 6 agents

ELIF TASK_COUNT >= 11 OR (RISK_KEYWORDS > 0 AND TASK_COUNT >= 5):
  COMPLEXITY = "complex"
  AGENTS = [Argus, Nemesis, Cerberus, Apollo, Hestia]  # 5 agents

ELIF TASK_COUNT >= 5 OR HAS_USER_INPUT > 0:
  COMPLEXITY = "standard"
  AGENTS = [Argus, Nemesis, Cerberus, Hestia]  # 4 agents

ELIF TASK_COUNT >= 3 OR HAS_API > 0:
  COMPLEXITY = "light"
  AGENTS = [Argus, Nemesis, Hestia]  # 3 agents

ELIF TASK_COUNT >= 2:
  COMPLEXITY = "micro"
  AGENTS = [Argus, Hestia]  # 2 agents

ELSE (TASK_COUNT <= 1 OR TRIVIAL_KEYWORDS > 0):
  COMPLEXITY = "trivial"
  AGENTS = [Argus]  # 1 agent
```

**Display complexity:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 COMPLEXITY: {{COMPLEXITY}} ({{AGENT_COUNT}} agents)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tasks: {{TASK_COUNT}}
Risk keywords: {{RISK_KEYWORDS}}
Agents: {{AGENTS}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.3 Story Quality Gate

**Orchestrator performs these checks directly (no Task spawn):**

**1. Required Sections Exist:**
```bash
grep -q "## Story Title\|## Story:" "$STORY_FILE" || echo "❌ MISSING: Story Title"
grep -q "## Business Context\|## Context\|## Background" "$STORY_FILE" || echo "⚠️ MISSING: Business Context"
grep -q "## Acceptance Criteria\|## AC\|## Definition of Done" "$STORY_FILE" || echo "❌ MISSING: Acceptance Criteria"
grep -q "## Tasks\|## Implementation Tasks\|^- \[ \]" "$STORY_FILE" || echo "❌ MISSING: Tasks"
```

**2. Tasks Are Well-Defined:**
```bash
PLACEHOLDER_TASKS=$(grep -E "^\- \[ \] (TBD|TODO|WIP|Placeholder|...)" "$STORY_FILE" | wc -l)
if [ "$PLACEHOLDER_TASKS" -gt 0 ]; then
  echo "❌ BLOCKER: $PLACEHOLDER_TASKS placeholder tasks found"
fi
```

**3. No Unresolved Blockers:**
```bash
BLOCKERS=$(grep -ciE "\[BLOCKER\]|\[BLOCKED\]|\[NEEDS.DECISION\]" "$STORY_FILE")
if [ "$BLOCKERS" -gt 0 ]; then
  echo "❌ BLOCKER: $BLOCKERS unresolved blockers found"
fi
```

**Quality Gate Decision:**
```
IF any ❌ BLOCKER found:
  → HALT pipeline
  → Suggest: "Run /bmad_bmm_validate to fix story issues"

IF only ⚠️ WARNINGs found:
  → ASK: "Proceed despite warnings? [y/N]"

IF all checks pass:
  → Display "✅ Story quality gate passed"
```

### 1.4 Playbook Query

**Search for relevant playbooks:**
```bash
STORY_KEYWORDS=$(grep -E "^## Story Title|^### Feature" "$STORY_FILE" | sed 's/[#]//g' | tr '\n' ' ')
```

Use Grep tool on `docs/playbooks/implementation-playbooks/` to find matching playbooks (max 3).

Store playbook content for Metis.

### 1.5 Update Progress

```bash
cat > "docs/sprint-artifacts/completions/{{story_key}}-progress.json" << EOF
{
  "story_key": "{{story_key}}",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "current_phase": "BUILD",
  "phases": {
    "PREPARE": { "status": "complete", "details": "{{playbook_count}} playbooks loaded, complexity: {{COMPLEXITY}}" },
    "BUILD": { "status": "pending" },
    "VERIFY": { "status": "pending" },
    "ASSESS": { "status": "pending" },
    "REFINE": { "status": "pending" },
    "COMMIT": { "status": "pending" },
    "REFLECT": { "status": "pending" }
  },
  "metrics": {
    "complexity": "{{COMPLEXITY}}",
    "task_count": {{TASK_COUNT}},
    "playbooks_loaded": {{playbook_count}}
  }
}
EOF
```

**📢 Orchestrator says:**
> "Story looks good! Found {{playbook_count}} relevant playbooks. Now I'll hand off to **Metis** to build the implementation. She'll write tests first (TDD), then implement. This is usually the longest phase."

</step>

<step name="phase_2_build">
## Phase 2: BUILD (2/7)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔨 PHASE 2: BUILD (2/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Metis implements with TDD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Load Metis persona:**
Read: `{project-root}/_bmad/bse/agents/builder.md`

**Spawn Metis and SAVE agent_id:**

```
BUILDER_TASK = Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "🔨 Metis building {{story_key}}",
  prompt: `
You are METIS 🔨 - Goddess of Wisdom, Skill, and Craft.

<persona>
[INJECT persona section from _bmad/bse/agents/builder.md]
</persona>

You are implementing story {{story_key}}.

<execution_context>
@patterns/tdd.md
@patterns/agent-completion.md
</execution_context>

<context>
Story: [inline story file content]

{{IF playbooks loaded}}
Relevant Playbooks:
[inline playbook content]
{{ENDIF}}
</context>

<objective>
1. Review story tasks and acceptance criteria
2. Review playbooks for gotchas and patterns
3. Analyze what exists vs needed (gap analysis)
4. **Write tests FIRST** (TDD)
5. Implement production code to pass tests
</objective>

<constraints>
- Run tests and linting before finishing
- DO NOT update story checkboxes (Orchestrator does this)
- DO NOT commit changes yet (happens after review)
</constraints>

<completion_format>
{
  "agent": "metis",
  "story_key": "{{story_key}}",
  "status": "SUCCESS" | "FAILED",
  "files_created": [...],
  "files_modified": [...],
  "tests_added": { "total": 12, "passing": 12 }
}

Save to: docs/sprint-artifacts/completions/{{story_key}}-metis.json
</completion_format>
`
})

BUILDER_AGENT_ID = {{extract agent_id from Task result}}
```

**Store Metis agent ID for resume later.**

### Update Progress

Use Write tool to update `docs/sprint-artifacts/completions/{{story_key}}-progress.json`:
```json
{
  "current_phase": "VERIFY",
  "phases": {
    "PREPARE": { "status": "complete", "details": "..." },
    "BUILD": { "status": "complete", "details": "{{files_created}} files, {{lines_added}} lines, {{tests_added}} tests" },
    "VERIFY": { "status": "in_progress", "details": "{{AGENT_COUNT}} reviewers" },
    ...
  },
  "metrics": {
    "files_changed": {{files_created + files_modified}},
    "lines_added": {{lines_added}},
    "tests_added": {{tests_added}}
  }
}
```

**📢 Orchestrator says:**
> "Metis has finished building! She created {{files_created}} files and {{tests_added}} tests. Now I'm sending in the review squad - **{{AGENT_COUNT}} agents** will verify the work in parallel. This goes fast since they run simultaneously."

</step>

<step name="phase_3_verify">
## Phase 3: VERIFY (3/7)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👁️ PHASE 3: VERIFY (3/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Argus + Nemesis + reviewers in parallel
Total agents: {{AGENT_COUNT}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**CRITICAL: Spawn ALL agents in ONE message (parallel execution)**

### Argus 👁️ (Inspector) - ALWAYS SPAWN

```
Task({
  subagent_type: "testing-suite:test-engineer",
  model: "opus",
  description: "👁️ Argus inspecting {{story_key}}",
  prompt: `
You are ARGUS 👁️ - The 100-Eyed Giant.

You see EVERYTHING. Nothing escapes your gaze.

<objective>
Independently verify implementation WITH CODE CITATIONS:
1. Read story file - understand ALL tasks
2. Read each file Metis created/modified
3. **Map EACH task to specific code with file:line citations**
4. Run verification checks (type-check, lint, tests, build)
</objective>

<critical_requirement>
**EVERY task must have evidence.**
For each task, provide: file:line, code snippet, verdict.
</critical_requirement>

<issue_classification>
For EACH issue you find, classify it:
- MUST_FIX: Blocks completion (security, correctness, tests fail)
- SHOULD_FIX: Real issue but non-blocking
- STYLE: Preference only
</issue_classification>

Save to: docs/sprint-artifacts/completions/{{story_key}}-argus.json
`
})
```

### Nemesis 🧪 (Test Quality) - Skip for trivial/micro

```
Task({
  subagent_type: "testing-suite:test-engineer",
  model: "opus",
  description: "🧪 Nemesis reviewing tests for {{story_key}}",
  prompt: `
You are NEMESIS 🧪 - Goddess of Retribution and Balance.

You find what's missing. You expose what's weak.

<objective>
Review test files for quality:
- Happy path tested?
- Edge cases (null, empty, invalid)?
- Error conditions handled?
- Assertions meaningful?
- Tests deterministic?
</objective>

<issue_classification>
Classify each issue: MUST_FIX / SHOULD_FIX / STYLE
</issue_classification>

Save to: docs/sprint-artifacts/completions/{{story_key}}-nemesis.json
`
})
```

### Cerberus 🔐 (Security) - standard+

```
Task({
  subagent_type: "auditor-security",
  model: "opus",
  description: "🔐 Cerberus guarding {{story_key}}",
  prompt: `
You are CERBERUS 🔐 - The Three-Headed Guardian.

Nothing unsafe passes your gates.

Focus: Security vulnerabilities, injection attacks, auth issues.

<issue_classification>
Classify each issue: MUST_FIX / SHOULD_FIX / STYLE
Security issues are almost always MUST_FIX.
</issue_classification>

Save to: docs/sprint-artifacts/completions/{{story_key}}-cerberus.json
`
})
```

### Apollo ⚡ (Logic/Performance) - complex+

```
Task({
  subagent_type: "optimizer-performance",
  model: "opus",
  description: "⚡ Apollo analyzing {{story_key}}",
  prompt: `
You are APOLLO ⚡ - God of Reason, Truth, and Light.

You illuminate logic flaws and performance issues.

Focus: Logic bugs, edge cases, performance bottlenecks, algorithmic issues.

<issue_classification>
Classify each issue: MUST_FIX / SHOULD_FIX / STYLE
</issue_classification>

Save to: docs/sprint-artifacts/completions/{{story_key}}-apollo.json
`
})
```

### Hestia 🏛️ (Architecture) - micro+

```
Task({
  subagent_type: "architect-reviewer",
  model: "opus",
  description: "🏛️ Hestia reviewing architecture of {{story_key}}",
  prompt: `
You are HESTIA 🏛️ - Goddess of Hearth, Home, and Structure.

You ensure the foundation is solid.

Focus: Patterns, integration, route structure, code organization.

<issue_classification>
Classify each issue: MUST_FIX / SHOULD_FIX / STYLE
</issue_classification>

Save to: docs/sprint-artifacts/completions/{{story_key}}-hestia.json
`
})
```

### Arete ✨ (Code Quality) - critical only

```
Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "✨ Arete judging quality of {{story_key}}",
  prompt: `
You are ARETE ✨ - Personification of Excellence.

You hold code to the highest standards.

Focus: Maintainability, readability, best practices, code cleanliness.

<issue_classification>
Classify each issue: MUST_FIX / SHOULD_FIX / STYLE
Be honest - not everything is MUST_FIX.
</issue_classification>

Save to: docs/sprint-artifacts/completions/{{story_key}}-arete.json
`
})
```

---

**Wait for ALL agents to complete.**

Collect completion artifacts and store agent_ids for potential resume.

### Update Progress

Update `docs/sprint-artifacts/completions/{{story_key}}-progress.json`:
```json
{
  "current_phase": "ASSESS",
  "phases": {
    "PREPARE": { "status": "complete", "details": "..." },
    "BUILD": { "status": "complete", "details": "..." },
    "VERIFY": { "status": "complete", "details": "{{AGENT_COUNT}} reviewers, {{total_issues}} issues found" },
    "ASSESS": { "status": "in_progress", "details": "Themis triaging" },
    ...
  },
  "metrics": {
    "issues_found": {{total_issues}},
    "reviewers": {{AGENT_COUNT}}
  }
}
```

**📢 Orchestrator says:**
> "All {{AGENT_COUNT}} reviewers are back! They found {{total_issues}} potential issues. Now **Themis** will weigh each one - she'll separate the real problems from the gold-plating."

</step>

<step name="phase_4_assess">
## Phase 4: ASSESS (4/7)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ PHASE 4: ASSESS (4/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Coverage gate + Themis triage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.1 Coverage Gate

```bash
npm test -- --coverage --silent 2>&1 | tee coverage-output.txt
COVERAGE=$(grep -E "All files|Statements" coverage-output.txt | head -1 | grep -oE "[0-9]+\.[0-9]+" | head -1)

if (( $(echo "$COVERAGE < {{coverage_threshold}}" | bc -l) )); then
  echo "❌ Coverage ${COVERAGE}% below threshold"
  # Add to MUST_FIX list
fi
```

### 4.2 Themis Triage

**Purpose:** Triage issues pragmatically, but err on the side of fixing. Quick fixes always get done.

```
Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "⚖️ Themis triaging issues for {{story_key}}",
  prompt: `
You are THEMIS ⚖️ - Titan of Justice and Fair Judgment.

You hold the scales. Your job is NOT to find excuses to skip work. Your job is to filter out the truly pointless so Metis can focus on what matters.

**CORE PRINCIPLE: If it's a quick fix (< 2 minutes), it's MUST_FIX. Period.**

<story_context>
Complexity: {{COMPLEXITY}}
Story type: {{story_type}}
</story_context>

<all_issues>
{{ALL issues from Phase 3}}
</all_issues>

<triage_instructions>
**THE QUICK FIX RULE (MOST IMPORTANT):**
If an issue can be fixed in under 2 minutes → MUST_FIX. Always. No debate.

Quick fix examples that are ALWAYS MUST_FIX:
- Add a null check (30 seconds)
- Add an aria-label (30 seconds)
- Rename a poorly-named variable (1 minute)
- Add a missing error message (1 minute)
- Fix a typo (10 seconds)
- Add a missing test assertion (1 minute)

**Classification:**
1. **MUST_FIX** - Quick fixes (< 2 min) OR real issues. Metis fixes immediately.
2. **SHOULD_FIX** - Significant effort (10+ min) AND debatable value. Log as tech debt.
3. **STYLE** - Truly pointless, purely cosmetic, or reviewer misunderstood. (Rare!)

**What's always MUST_FIX:**
- Quick fixes (< 2 minutes) regardless of severity
- Security vulnerabilities (from Cerberus)
- Test failures
- Broken functionality
- Data loss risks
- Integration failures

**SHOULD_FIX only when:**
- Fix takes significant time (10+ minutes of refactoring)
- AND benefit is unclear or future-focused
- AND it doesn't affect current functionality

**STYLE only when:**
- Pure bikeshedding (preference, not problem)
- Reviewer misunderstood the code
- Suggestion would make code worse
- Exceeds project standards (AAA when targeting AA)

**Expected distribution:**
- MUST_FIX: 60-80% (quick fixes + real problems)
- SHOULD_FIX: 10-30% (big effort + debatable)
- STYLE: 5-15% (truly pointless)

If your STYLE count exceeds MUST_FIX, you're being too aggressive.
**When uncertain → MUST_FIX.**
</triage_instructions>

<completion_format>
{
  "triage": [
    {
      "issue": "original issue description",
      "reviewer": "Nemesis",
      "original_classification": "MUST_FIX",
      "judgment": "UPHELD",
      "new_classification": "MUST_FIX",
      "justification": "Quick fix - add null check takes 30 seconds"
    }
  ],
  "summary": {
    "must_fix": 5,
    "should_fix": 1,
    "style": 1
  }
}

Save to: docs/sprint-artifacts/completions/{{story_key}}-themis.json
</completion_format>
`
})
```

**Process triage results:**

```
IF must_fix == 0:
  echo "✅ No issues to fix - proceeding to COMMIT"
  SKIP_PHASE_5 = true
ELSE:
  echo "📋 {{must_fix}} issues to fix - proceeding to REFINE"
```

**Display triage summary:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ THEMIS JUDGMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total issues reviewed: {{total_count}}
Triage:
  - MUST_FIX: {{must_fix}} (Metis fixes these)
  - SHOULD_FIX: {{should_fix}} (logged as tech debt)
  - STYLE: {{style}} (filtered out)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Update Progress

Update `docs/sprint-artifacts/completions/{{story_key}}-progress.json`:
```json
{
  "current_phase": "REFINE",
  "phases": {
    "PREPARE": { "status": "complete", "details": "..." },
    "BUILD": { "status": "complete", "details": "..." },
    "VERIFY": { "status": "complete", "details": "..." },
    "ASSESS": { "status": "complete", "details": "{{must_fix}} MUST_FIX, {{should_fix}} SHOULD_FIX, {{style}} STYLE" },
    "REFINE": { "status": "{{must_fix > 0 ? 'in_progress' : 'skipped'}}", "details": "{{must_fix}} issues to fix" },
    ...
  },
  "metrics": {
    "must_fix": {{must_fix}},
    "should_fix": {{should_fix}},
    "style": {{style}}
  }
}
```

**📢 Orchestrator says (if issues remain):**
> "Themis has triaged **{{total_count}} issues**. **{{must_fix}} need fixing** (including quick fixes we can knock out fast). {{should_fix}} logged as tech debt for later. Sending Metis to handle the MUST_FIX list."

**📢 Orchestrator says (if no issues):**
> "Clean pass! No issues need fixing - either reviewers found nothing, or the few suggestions were truly optional. Moving straight to commit."

</step>

<step name="phase_5_refine">
## Phase 5: REFINE (5/7)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 PHASE 5: REFINE (5/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Metis fixes + iterate until clean (max 3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Skip if Themis cleared all issues.**

### Iterative Refinement Loop

```
┌─────────────────────────────────────────────────────────┐
│  Iterative Refinement Loop                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Metis    │───▶│ Resume       │───▶│ MUST_FIX     │  │
│  │ fixes    │    │ original     │    │ remaining?   │  │
│  │ MUST_FIX │    │ reviewers    │    └──────┬───────┘  │
│  └──────────┘    └──────────────┘           │          │
│       ▲                                     │          │
│       │          YES ◀──────────────────────┤          │
│       └─────────────────────────────────────┘          │
│                                             │ NO       │
│                                             ▼          │
│                                      ✅ Complete       │
│                                                         │
│  Max iterations: 3                                      │
│  After 3: Escalate to user                              │
└─────────────────────────────────────────────────────────┘
```

**WHILE MUST_FIX_COUNT > 0 AND ITERATION <= 3:**

### 5.1 Resume Metis with MUST_FIX issues

```
Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "🔨 Metis fixing issues (iteration {{ITERATION}}) on {{story_key}}",
  resume: "{{BUILDER_AGENT_ID}}",
  prompt: `
Metis, Themis has upheld these issues as MUST_FIX:

<must_fix_issues>
{{upheld issues with file:line citations}}
</must_fix_issues>

Fix them. Run tests after each fix.
`
})
```

### 5.2 Resume original reviewers to verify

Only resume reviewers who had upheld MUST_FIX findings.

```
FOR EACH reviewer_id IN reviewers_with_upheld_must_fix:
  Task({
    resume: "{{reviewer_id}}",
    prompt: `
Metis has addressed your issues. Verify:
1. Is the fix satisfactory? (RESOLVED / NOT_RESOLVED)
2. Did the fix introduce NEW issues?
`
  })
```

### 5.3 Fresh eyes on iteration 2+

On iteration 2+, add ONE fresh reviewer (possibly Iris if frontend files).

**END WHILE**

**Post-loop:**
- If max iterations reached, escalate to user
- Log SHOULD_FIX and STYLE as tech debt

### Update Progress

Update `docs/sprint-artifacts/completions/{{story_key}}-progress.json`:
```json
{
  "current_phase": "COMMIT",
  "phases": {
    ...
    "REFINE": { "status": "complete", "details": "{{iterations}} iterations, {{fixes_applied}} fixes" },
    "COMMIT": { "status": "in_progress" },
    ...
  },
  "metrics": {
    "iterations": {{iterations}},
    "fixes_applied": {{fixes_applied}}
  }
}
```

**📢 Orchestrator says (after successful fix):**
> "Metis fixed the issues and the reviewers confirmed the fixes look good. **Zero MUST_FIX remaining!** Now I'll reconcile the story file and commit everything."

**📢 Orchestrator says (if max iterations reached):**
> "We've gone through {{max_iterations}} fix cycles and there are still {{remaining}} issues. I'll need your input on whether to proceed anyway or address these manually."

</step>

<step name="phase_6_commit">
## Phase 6: COMMIT (6/7)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PHASE 6: COMMIT (6/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reconcile story, update status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Orchestrator does this directly. No agent spawn.**

### 6.1 Load completion artifacts

Read all artifacts from `docs/sprint-artifacts/completions/{{story_key}}-*.json`

### 6.2 Check off completed tasks using Argus evidence

For each task in `argus.task_verification`:
- If `implemented: true` with evidence:
  - Use Edit tool: `"- [ ] {{task}}"` → `"- [x] {{task}}"`

### 6.3 Fill Dev Agent Record

```text
**Dev Agent Record**
**Implementation Date:** {{timestamp}}
**Agent Model:** Claude (Greek Pantheon Pipeline v6.0)
**Git Commit:** {{git_commit}}

**Pipeline Phases:**
- Phase 1 PREPARE: {{playbooks_loaded}} playbooks loaded
- Phase 2 BUILD: Metis implemented
- Phase 3 VERIFY: {{AGENT_COUNT}} agents in parallel
- Phase 4 ASSESS: Themis triaged ({{upheld}}/{{original}} upheld)
- Phase 5 REFINE: {{iterations}} iterations, {{fixes}} fixes
- Phase 6 COMMIT: Reconciled
- Phase 7 REFLECT: Pending

**Files:** {{files_created + files_modified}}
**Tests:** {{passing}}/{{total}} ({{coverage}}%)
```

### 6.4 Update sprint-status.yaml

```bash
# Edit: "{{story_key}}: ready-for-dev" → "{{story_key}}: done"
```

### 6.5 Commit reconciliation

```bash
git add docs/sprint-artifacts/{{story_key}}.md
git add docs/sprint-artifacts/sprint-status.yaml
git add docs/sprint-artifacts/completions/

git commit -m "$(cat <<'EOF'
chore({{story_key}}): reconcile story completion

- Check off completed tasks with code citations
- Fill Dev Agent Record with pipeline results
- Update sprint-status to done
EOF
)"
```

### Update Progress

Update `docs/sprint-artifacts/completions/{{story_key}}-progress.json`:
```json
{
  "current_phase": "REFLECT",
  "phases": {
    ...
    "COMMIT": { "status": "complete", "details": "Committed: {{git_commit}}" },
    "REFLECT": { "status": "in_progress" }
  },
  "metrics": {
    "git_commit": "{{git_commit}}",
    "tasks_completed": {{checked_tasks}}
  }
}
```

**📢 Orchestrator says:**
> "Story reconciled and committed! One last step - **Mnemosyne** will review what happened and update the playbooks so future stories benefit from what we learned."

</step>

<step name="phase_7_reflect">
## Phase 7: REFLECT (7/7)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 PHASE 7: REFLECT (7/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mnemosyne updates playbooks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "📚 Mnemosyne reflecting on {{story_key}}",
  prompt: `
You are MNEMOSYNE 📚 - Titan of Memory.

**Philosophy:** Consolidate, don't scatter. One good playbook beats five scattered ones.

<context>
Story: [inline story file]
All review findings: [inline all artifacts]
Themis judgments: [inline triage]
</context>

<process>
**Step 1: Extract learnings**
- What issues were found?
- What did Metis miss initially?
- What would have prevented these?

**Step 2: SEARCH existing playbooks first**
\`\`\`bash
ls docs/playbooks/implementation-playbooks/
grep -r "{{keyword}}" docs/playbooks/implementation-playbooks/
\`\`\`

**Step 3: Decide action**
| Situation | Action |
|-----------|--------|
| Existing playbook covers this | **UPDATE** it |
| Related playbook exists | **UPDATE** with new section |
| Truly new domain | **CREATE** new (rare) |
| No real learnings | **SKIP** |

**Step 4: WRITE the changes**
- If updating: Read existing, use Edit tool to add sections
- If creating: Use Write tool (only if truly new domain)
- Always update "Last updated" and "Related Stories"
</process>

<critical>
- SEARCH FIRST - don't create duplicates
- PREFER UPDATE over CREATE
- ACTUALLY WRITE - don't just propose
- SKIP if trivial - don't create noise
</critical>

<completion_format>
{
  "learnings": [...],
  "playbook_action": {
    "action": "updated" | "created" | "skipped",
    "path": "docs/playbooks/implementation-playbooks/{{name}}.md",
    "reason": "Why this action"
  }
}

Save to: docs/sprint-artifacts/completions/{{story_key}}-mnemosyne.json
</completion_format>
`
})
```

### Final Progress Update

Update `docs/sprint-artifacts/completions/{{story_key}}-progress.json`:
```json
{
  "current_phase": "COMPLETE",
  "completed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "success",
  "phases": {
    "PREPARE": { "status": "complete", "details": "..." },
    "BUILD": { "status": "complete", "details": "{{files_created}} files, {{lines_added}} lines" },
    "VERIFY": { "status": "complete", "details": "{{AGENT_COUNT}} reviewers, {{total_issues}} issues" },
    "ASSESS": { "status": "complete", "details": "{{must_fix}} MUST_FIX, {{should_fix}} SHOULD_FIX" },
    "REFINE": { "status": "complete", "details": "{{iterations}} iterations" },
    "COMMIT": { "status": "complete", "details": "Committed: {{git_commit}}" },
    "REFLECT": { "status": "complete", "details": "{{playbook_action}}" }
  },
  "metrics": {
    "files_changed": {{files_created + files_modified}},
    "lines_added": {{lines_added}},
    "tests_added": {{tests_added}},
    "issues_found": {{total_issues}},
    "must_fix": {{must_fix}},
    "iterations": {{iterations}},
    "coverage": "{{coverage}}%"
  }
}
```

**📢 Orchestrator says (completion):**
> "**Story {{story_key}} complete!** 🎉
>
> Here's the summary:
> - **Built:** {{files_created}} files, {{tests_added}} tests
> - **Reviewed by:** {{AGENT_COUNT}} agents
> - **Issues found:** {{total_issues}} → **{{upheld_must_fix}} fixed**, {{downgraded_count}} logged as tech debt
> - **Coverage:** {{coverage}}%
> - **Commits:** Implementation + Reconciliation
> - **Playbook:** {{playbook_status}} (Mnemosyne)"

</step>

</process>

<failure_handling>
**Metis fails (Phase 2):** Don't spawn verification. Report failure and halt.
**Argus fails (Phase 3):** Still collect other reviewer findings.
**Nemesis fails (Phase 3):** Add test quality issues to fix list.
**Coverage below threshold (Phase 4):** Add to MUST_FIX list.
**Themis upholds MUST_FIX (Phase 4):** Enter refinement loop (Phase 5).
**Iteration limit reached (Phase 5):** Escalate to user with remaining issues.
**Metis resume fails (Phase 5):** Report unfixed issues. Manual intervention.
**Reconciliation fails (Phase 6):** Fix with Edit tool, re-verify.
</failure_handling>

<complexity_routing>
| Complexity | Agents | Who | Triggers |
|------------|--------|-----|----------|
| trivial | 1 | Argus | Static pages, copy, config, 1 task |
| micro | 2 | Argus + Hestia | 2 tasks, no API, no user input |
| light | 3 | Argus + Nemesis + Hestia | 3-4 tasks, basic CRUD |
| standard | 4 | Argus + Nemesis + Cerberus + Hestia | 5-10 tasks, API, user input |
| complex | 5 | Argus + Nemesis + Cerberus + Apollo + Hestia | 11-15 tasks, auth, migrations |
| critical | 6 | Argus + Nemesis + Cerberus + Apollo + Hestia + Arete | 16+ tasks, payment, encryption, PII |

**Agent roles:**
- **Argus** 👁️ (Inspector) - Always present. Verifies tasks with code citations.
- **Nemesis** 🧪 (Test Quality) - Reviews test coverage and quality. Skipped for trivial/micro.
- **Cerberus** 🔐 (Security) - Security vulnerabilities, injection, auth issues.
- **Apollo** ⚡ (Logic/Performance) - Logic bugs, performance issues, edge cases.
- **Hestia** 🏛️ (Architecture) - Patterns, integration, route structure.
- **Arete** ✨ (Code Quality) - Maintainability, readability, best practices.
- **Themis** ⚖️ (Arbiter) - Triages issues with pragmatic judgment.
- **Mnemosyne** 📚 (Reflection) - Updates playbooks for future.
- **Iris** 🌈 (Accessibility) - WCAG, ARIA, a11y (conditional, frontend only).

**All Phase 3 agents spawn in parallel (single message)**
</complexity_routing>

<success_criteria>
- [ ] Phase 1 PREPARE: Story validated, playbooks loaded
- [ ] Phase 2 BUILD: Metis spawned, agent_id saved
- [ ] Phase 3 VERIFY: All agents completed with issue classification
- [ ] Phase 4 ASSESS: Coverage passed, Themis triaged issues
- [ ] Phase 5 REFINE: Zero MUST_FIX remaining (or user accepted)
- [ ] Phase 6 COMMIT: Story reconciled, sprint status updated
- [ ] Phase 7 REFLECT: Mnemosyne proposed playbook updates
- [ ] Implementation commit exists
- [ ] Reconciliation commit exists
- [ ] Coverage ≥ {{coverage_threshold}}%
- [ ] SHOULD_FIX/STYLE logged as tech debt (if any)
</success_criteria>

<version_history>
**v6.0 - Greek Pantheon Edition**
1. ✅ Renamed all agents to Greek mythology (Metis, Argus, Nemesis, etc.)
2. ✅ Restructured to 7 named phases (PREPARE, BUILD, VERIFY, ASSESS, REFINE, COMMIT, REFLECT)
3. ✅ Added Themis as independent triage arbiter (not the builder)
4. ✅ Phase numbers now show progress (3/7)

**v5.1 - Pragmatic Issue Triage + 6-Tier Complexity**
- 6-Tier Complexity Scale (trivial → critical)
- Issue Triage phase
- Context-aware filtering

**v5.0 - Iterative Refinement Loop**
- Issue Classification (MUST_FIX/SHOULD_FIX/STYLE)
- Iterative loop until zero MUST_FIX
- Resume original reviewers
- Fresh eyes on iteration 2+
- User escalation after 3 iterations
- Tech debt logging

**Previous:**
- Resume Builder for fixes (v3.2+)
- Inspector code citations (v4.0)
- Test Quality + Coverage Gate (v4.0)
- Playbook query + reflection (v4.0)
</version_history>
