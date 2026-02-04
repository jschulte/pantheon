# Story Pipeline v7.0 - Pygmalion Edition

<purpose>
Implement a story using parallel verification agents with Builder context reuse.
Enhanced with playbook learning, code citation evidence, test quality validation, pragmatic triage, automated coverage gates, and on-the-fly persona forging via Pygmalion.
Builder fixes issues in its own context (50-70% token savings).
Pygmalion forges domain-specific specialist reviewers to fill Pantheon coverage gaps.
</purpose>

<philosophy>
**Quality Through Discipline, Continuous Learning**

- Phase 1 PREPARE: Validate story quality, load playbooks
- Phase 1.5 FORGE: Pygmalion analyzes domain, forges specialist personas (if complexity >= light)
- Phase 2 BUILD: Metis implements with TDD
- Phase 3 VERIFY: Argus + Nemesis + reviewers + forged specialists validate in parallel
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
| Persona Forge | **Pygmalion** | The sculptor who brought the perfect being to life | 🗿 |
| *Forged Specialists* | *Dynamic* | *Domain-specific experts created by Pygmalion* | *Varies* |
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
- Phase 1.5 FORGE: `Task(subagent_type: "general-purpose")` → Pygmalion (Persona Forge) — complexity >= light only
- Phase 2 BUILD: `Task(subagent_type: "general-purpose")` → Metis (Builder)
- Phase 3 VERIFY: `Task(subagent_type: ...)` → Argus + Nemesis + Cerberus/Apollo/Hestia/Arete + forged specialists - in parallel
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
version: 7.0.0
execution_mode: multi_agent

phases:
  phase_1: PREPARE (story quality gate + playbook query)
  phase_1_5: FORGE (Pygmalion forges specialist personas — complexity >= light)
  phase_2: BUILD (Metis implements with TDD)
  phase_3: VERIFY (Argus + Nemesis + reviewers + forged specialists in parallel)
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
  directory: "docs/implementation-playbooks"
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

Use Grep tool on `docs/implementation-playbooks/` to find matching playbooks (max 3).

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

<step name="phase_1_5_forge">
## Phase 1.5: FORGE (Pygmalion)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗿 PHASE 1.5: FORGE (Pygmalion)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Domain analysis + specialist persona forging
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Complexity Gate

```
IF COMPLEXITY in [trivial, micro]:
  FORGED_SPECS = { forged_specialists: [], skipped: true }
  → Skip Pygmalion entirely. Pantheon coverage is sufficient.
  → Proceed to Phase 2.

ELSE:
  → Invoke Pygmalion to analyze domain and forge specialists.
```

### Invoke Pygmalion

```
PYGMALION_TASK = Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "🗿 Pygmalion forging specialists for {{story_key}}",
  prompt: `
<agent_persona>
[INLINE: Content from agents/pygmalion.md]
</agent_persona>

Analyze this story and its domain context. Forge specialist personas if the fixed Pantheon leaves coverage gaps.

<story>
[INLINE: Full story file content]
</story>

<complexity>
Tier: {{COMPLEXITY}}
Max specialists: {{max_specialists_for_tier}}
</complexity>

<playbooks>
[INLINE: Playbook content loaded in Phase 1]
</playbooks>

<project_context>
[INLINE: package.json dependencies, project structure summary]
</project_context>

Output your analysis as the Pygmalion JSON artifact.
Save to: docs/sprint-artifacts/completions/{{story_key}}-pygmalion.json
`
})
```

### Process Pygmalion Output

```
FORGED_SPECS = read("docs/sprint-artifacts/completions/{{story_key}}-pygmalion.json")

IF FORGED_SPECS.forged_specialists.length > 0:
  echo "🗿 Pygmalion forged {{count}} specialist(s):"
  FOR EACH spec IN FORGED_SPECS.forged_specialists:
    echo "  {{spec.emoji}} {{spec.name}} — {{spec.title}}"

ELSE:
  echo "🗿 Pygmalion: No gaps identified — Pantheon coverage sufficient."
```

**📢 Orchestrator says (if specialists forged):**
> "Pygmalion has studied the domain and forged **{{count}} specialist(s)** to augment the review team. These specialists will join the Pantheon reviewers in Phase 3."

**📢 Orchestrator says (if no specialists):**
> "Pygmalion analyzed the domain and confirmed the Pantheon reviewers have full coverage. No additional specialists needed."

</step>

<step name="phase_2_build">
## Phase 2: BUILD (2/7)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔨 PHASE 2: BUILD (2/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Smart Builder Selection + TDD Implementation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 1: Smart Builder Selection (v5.0)

**Load the agent routing configuration:**
```
Read: {project-root}/_bmad/bse/agent-routing.yaml
```

**Analyze story for routing signals:**
1. Extract file patterns from story tasks (e.g., `app/api/**`, `components/**`, `prisma/**`)
2. Extract keywords from story content (e.g., "API", "component", "migration")
3. Check package.json for framework indicators (react, vue, fastapi, etc.)

**Match against builder_routing rules (first match wins):**
- `frontend-react` → Apollo ⚛️ (React/Next.js components)
- `backend-typescript` → Hephaestus 🔥 (API routes, services)
- `database-prisma` → Athena 🦉 (migrations, schema changes)
- `infrastructure` → Atlas 🌍 (CI/CD, Docker, Terraform)
- `general` → Metis 🔨 (fallback for mixed/unclear stories)

**Load the matched specialized builder prompt:**
```
# Example: If story touches app/api/** files
Read: {project-root}/_bmad/bse/agents/builders/backend-typescript.md
BUILDER_NAME = "Hephaestus"
BUILDER_EMOJI = "🔥"
BUILDER_SPECIALTY = "Backend TypeScript API Development"
```

### Step 2: Spawn Specialized Builder

**Display selected builder:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔨 PHASE 2: BUILD - {{BUILDER_EMOJI}} {{BUILDER_NAME}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{BUILDER_NAME}} is building... this may take a few minutes.
Selected for: {{BUILDER_SPECIALTY}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Spawn builder Task with specialized prompt:**

```
BUILDER_TASK = Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "{{BUILDER_EMOJI}} {{BUILDER_NAME}} building {{story_key}}",
  prompt: `
<agent_persona>
[INLINE: Content from the selected builder file, e.g., agents/builders/backend-typescript.md]
</agent_persona>

You are implementing story {{story_key}}.

<story_file>
[INLINE: Full story file content]
</story_file>

{{IF playbooks loaded}}
<relevant_playbooks>
[INLINE: Playbook content that was loaded in Phase 1]
</relevant_playbooks>
{{ENDIF}}

<objective>
1. Review story tasks and acceptance criteria thoroughly
2. Review playbooks for gotchas and patterns (if provided)
3. Analyze what exists vs what's needed (gap analysis)
4. **Write tests FIRST** (TDD - red/green/refactor)
5. Implement production code to pass tests
6. Run tests and linting before completing
</objective>

<constraints>
- Follow the patterns and conventions in the codebase
- Run tests and linting before finishing
- DO NOT update story checkboxes (Orchestrator does this)
- DO NOT commit changes yet (happens after review passes)
</constraints>

<completion_format>
{
  "agent": "{{BUILDER_NAME | lowercase}}",
  "story_key": "{{story_key}}",
  "status": "SUCCESS" | "FAILED",
  "files_created": [...],
  "files_modified": [...],
  "tests_added": { "total": N, "passing": N },
  "tasks_addressed": ["task 1", "task 2", ...],
  "playbooks_reviewed": ["playbook1.md", ...]
}

Save to: docs/sprint-artifacts/completions/{{story_key}}-metis.json
</completion_format>
`
})

BUILDER_AGENT_ID = {{extract agent_id from Task result}}
```

**Store builder agent ID for resume in Phase 5.**

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
Review Mode: {{REVIEW_MODE}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Review Mode Selection (Token Optimization v4.2)

**Based on complexity, choose review mode:**

```
IF COMPLEXITY in [trivial, micro, light, standard]:
  REVIEW_MODE = "consolidated"
  → Use Multi-Reviewer (single agent, 4 perspectives)
  → Saves ~60-70% tokens vs parallel reviewers

ELIF COMPLEXITY in [complex, critical]:
  REVIEW_MODE = "parallel"
  → Use separate parallel reviewers
  → Maximum thoroughness for high-risk stories
```

---

### Option A: Consolidated Review (trivial/micro/light/standard)

**Single agent reviews from 4 perspectives. Saves ~25K tokens.**

```
Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "👁️🧪🔐🏛️ Multi-Review {{story_key}}",
  prompt: `
You are the REVIEW COUNCIL - four perspectives, one thorough review.

Review this implementation from 4 perspectives:

1. **Argus (Inspector)** 👁️
   - Verify EVERY task with file:line evidence
   - Run quality checks (type-check, lint, build, tests)

2. **Nemesis (Test Quality)** 🧪
   - Check test coverage and quality
   - Happy paths, edge cases, error conditions

3. **Cerberus (Security)** 🔐
   - Scan for injection, auth issues, data exposure
   - Security issues are almost always MUST_FIX

4. **Hestia (Architecture)** 🏛️
   - Check patterns, integration, migrations
   - Verify routes registered, env vars documented

<story>
[inline story content]
</story>

<files_to_review>
[list from metis.json]
</files_to_review>

For EACH issue, classify as: MUST_FIX / SHOULD_FIX / STYLE

Save consolidated findings to:
docs/sprint-artifacts/completions/{{story_key}}-review.json
`
})
```

**After consolidated review, also spawn any forged specialists (if Pygmalion produced them):**

```
IF FORGED_SPECS.forged_specialists.length > 0:
  # Spawn forged specialists in parallel alongside or after consolidated review
  FOR EACH spec IN FORGED_SPECS.forged_specialists:
    Task({
      subagent_type: "{{spec.suggested_claude_agent_type}}",
      model: "opus",
      description: "{{spec.emoji}} {{spec.name}} reviewing {{story_key}}",
      prompt: `
You are {{spec.name}} ({{spec.emoji}}) — {{spec.title}}.

{{spec.domain_expertise}}

Review the following code changes for this story. Focus specifically on:
{{spec.review_focus — as bullet list}}

Technology Checklist — verify each item:
{{spec.technology_checklist — as numbered list}}

Known Gotchas to watch for:
{{spec.known_gotchas — as bullet list}}

Issue Classification:
{{spec.issue_classification_guidance}}

<story>[INLINE: story content]</story>
<files_to_review>[list from metis.json]</files_to_review>

Output your findings in standard reviewer JSON format.
Save to: docs/sprint-artifacts/completions/{{story_key}}-{{spec.id}}.json
`
    })
```

**After all reviews complete (consolidated + forged), proceed to Phase 4 (ASSESS).**

---

### Option B: Parallel Reviewers (complex/critical)

**Multiple specialized agents for maximum thoroughness.**

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

### Forged Specialists (from Pygmalion) — spawned in same parallel batch

```
IF FORGED_SPECS.forged_specialists.length > 0:
  # Include these in the SAME message as Pantheon reviewers above
  FOR EACH spec IN FORGED_SPECS.forged_specialists:
    Task({
      subagent_type: "{{spec.suggested_claude_agent_type}}",
      model: "opus",
      description: "{{spec.emoji}} {{spec.name}} reviewing {{story_key}}",
      prompt: `
You are {{spec.name}} ({{spec.emoji}}) — {{spec.title}}.

{{spec.domain_expertise}}

Review the following code changes for this story. Focus specifically on:
{{spec.review_focus — as bullet list}}

Technology Checklist — verify each item:
{{spec.technology_checklist — as numbered list}}

Known Gotchas to watch for:
{{spec.known_gotchas — as bullet list}}

Issue Classification:
{{spec.issue_classification_guidance}}

<story>[INLINE: story content]</story>
<files_to_review>[list from metis.json]</files_to_review>

Output your findings in standard reviewer JSON format.
Save to: docs/sprint-artifacts/completions/{{story_key}}-{{spec.id}}.json
`
    })
```

**CRITICAL: Forged specialist Task calls MUST be in the SAME message as Pantheon reviewer Task calls above. This ensures true parallel execution.**

---

**Wait for ALL agents to complete (Pantheon + forged specialists).**

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

**Purpose:** Triage issues pragmatically, but **strongly err on the side of fixing**. Only filter clearly manufactured complaints.

```
Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "⚖️ Themis triaging issues for {{story_key}}",
  prompt: `
You are THEMIS ⚖️ - Titan of Justice and Fair Judgment.

You hold the scales. Your job is NOT to find excuses to skip work. Your job is to filter out **clearly manufactured complaints** so Metis can focus on real issues.

**CORE PRINCIPLE: If a reviewer found a real issue, it's MUST_FIX. Period.**

<story_context>
Complexity: {{COMPLEXITY}}
Story type: {{story_type}}
</story_context>

<all_issues>
{{ALL issues from Phase 3 — Pantheon reviewers AND forged specialists}}
</all_issues>

NOTE: Forged specialist findings use the same JSON format as Pantheon reviewers.
Triage them identically — no special handling needed.

<triage_instructions>
**THE "REAL ISSUE" RULE (MOST IMPORTANT):**
If a reviewer found something real → MUST_FIX. Always. No debate.

Real issues that are ALWAYS MUST_FIX:
- Missing null/error handling
- Missing accessibility attributes
- Poorly-named variables
- Missing error messages
- Typos in user-facing text
- Missing test assertions
- Security issues of any severity
- Edge cases not handled

**Classification:**
1. **MUST_FIX** - Any real issue. Metis fixes immediately.
2. **SHOULD_FIX** - Large refactoring with speculative benefit. Log as tech debt.
3. **STYLE** - Clearly manufactured complaints (very rare!)

**What's always MUST_FIX:**
- Any real code quality issue
- Security vulnerabilities (from Cerberus)
- Test failures or gaps
- Broken functionality
- Data loss risks
- Integration failures
- Accessibility gaps

**SHOULD_FIX only when:**
- Fix requires substantial restructuring
- AND benefit is speculative/future-focused
- AND it doesn't affect current functionality

**STYLE only when:**
- Clearly manufactured (reviewer nitpicking to have something to say)
- Pure bikeshedding (preference, not a real problem)
- Reviewer misunderstood the code
- Suggestion would actually make code worse

**Expected distribution:**
- MUST_FIX: 80-95% (real issues get fixed)
- SHOULD_FIX: 5-15% (big refactors)
- STYLE: <10% (manufactured complaints only)

If your STYLE count exceeds 10%, you're filtering too aggressively.
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
      "justification": "Real issue - missing null check could cause runtime error"
    }
  ],
  "summary": {
    "must_fix": 5,
    "should_fix": 1,
    "style": 0
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
    "ASSESS": { "status": "complete", "details": "{{coverage}}% coverage, {{must_fix}} MUST_FIX" },
    "REFINE": { "status": "{{must_fix > 0 ? 'in_progress' : 'skipped'}}", "details": "{{must_fix}} issues to fix" },
    ...
  },
  "metrics": {
    "coverage": "{{COVERAGE}}",
    "must_fix": {{must_fix}},
    "should_fix": {{should_fix}},
    "style": {{style}}
  }
}
```

**CRITICAL:** Coverage MUST be captured here. It comes from the coverage gate check:
```bash
COVERAGE=$(grep -E "All files|Statements" coverage-output.txt | head -1 | grep -oE "[0-9]+\.[0-9]+" | head -1)
```

**📢 Orchestrator says (if issues remain):**
> "Themis has triaged **{{total_count}} issues**. **{{must_fix}} real issues need fixing**. {{should_fix}} logged as tech debt for later. Sending Metis to handle the MUST_FIX list."

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

Only resume reviewers who had upheld MUST_FIX findings. This includes both Pantheon reviewers and forged specialists.

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

# For forged specialists that cannot be resumed (no saved agent_id),
# re-spawn with the original spec from Pygmalion output:
FOR EACH spec IN forged_specialists_with_upheld_must_fix:
  IF spec.agent_id is available:
    Task({ resume: "{{spec.agent_id}}", prompt: "Verify fixes..." })
  ELSE:
    # Re-spawn with verification-focused prompt
    Task({
      subagent_type: "{{spec.suggested_claude_agent_type}}",
      model: "opus",
      prompt: `
You are {{spec.name}} ({{spec.emoji}}) — {{spec.title}}.
{{spec.domain_expertise}}

Metis has fixed these issues you raised:
{{upheld_must_fix_from_this_specialist}}

Verify each fix:
1. Is the fix satisfactory? (RESOLVED / NOT_RESOLVED)
2. Did the fix introduce NEW issues?
3. Check technology_checklist items again.

Save to: docs/sprint-artifacts/completions/{{story_key}}-{{spec.id}}-verify.json
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

### 5.4 Commit Implementation

After all MUST_FIX issues are resolved, commit the implementation:

```bash
git add .

git commit -m "$(cat <<'EOF'
feat({{story_key}}): {{story_title}}

Implementation complete:
- {{files_created}} files created
- {{files_modified}} files modified
- {{tests_added}} tests added
- Coverage: {{coverage}}%

All review issues resolved ({{iterations}} iteration{{s}}).
EOF
)"
```

**Save the commit SHA:**
```bash
GIT_IMPLEMENTATION_COMMIT=$(git rev-parse HEAD)
```

**📢 Orchestrator says (after successful fix):**
> "Metis fixed the issues and the reviewers confirmed the fixes look good. **Zero MUST_FIX remaining!** Implementation committed ({{git_commit}}). Now I'll reconcile the story file."

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
**Agent Model:** Claude (Greek Pantheon Pipeline v6.1)
**Git Commit:** {{GIT_IMPLEMENTATION_COMMIT}}

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
> "Story reconciled and committed! One last step - **Hermes** will review what happened, update playbooks, and generate the completion report."

</step>

<step name="phase_7_reflect">
## Phase 7: REFLECT (7/7)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 PHASE 7: REFLECT (7/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hermes: Reflection + Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Combined Reflection & Report (Token Optimized v4.2)

**Why combined?** Both Mnemosyne (reflection) and Hermes (reporting) read the same artifacts. Combining them saves ~5-8K tokens per story while producing identical outputs.

**Spawn Hermes (Combined Agent):**

```
Task({
  subagent_type: "general-purpose",
  model: "sonnet",  # Faster model sufficient for synthesis
  description: "📜 Hermes: reflect + report {{story_key}}",
  prompt: `
You are MNEMOSYNE-HERMES 📜 - Memory & Messenger Combined.

Perform TWO roles in sequence for {{story_key}}:

## ROLE 1: Mnemosyne (Reflection)

<context>
Story: [inline story file]
All review findings: [inline all artifacts]
Themis judgments: [inline triage]
</context>

**Step 1: Extract learnings**
- What issues were found?
- What did Metis miss initially?
- What would have prevented these?

**Step 2: SEARCH existing playbooks first**
\`\`\`bash
ls docs/implementation-playbooks/
grep -r "{{keyword}}" docs/implementation-playbooks/
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

Save reflection artifact to: docs/sprint-artifacts/completions/{{story_key}}-mnemosyne.json

---

## ROLE 2: Hermes (Report)

Now generate a comprehensive Story Completion Report.

<artifacts>
Progress: [{{story_key}}-progress.json]
Builder: [{{story_key}}-metis.json]
Review: [{{story_key}}-review.json OR individual argus/nemesis/cerberus/hestia files]
Triage: [{{story_key}}-themis.json]
Reflection: [{{story_key}}-mnemosyne.json - just created above]
</artifacts>

<git_commits>
[Recent commits for this story]
</git_commits>

Generate report including:

1. **TL;DR** - One paragraph summary (used in batch aggregation)
2. **What Was Built** - Features and acceptance criteria status
3. **Technical Changes** - Files created/modified tables
4. **Quality Summary** - Issues found and fixed
5. **Verification Guide** - Manual testing checklist with specific steps
6. **Learnings Captured** - Playbook updates from Mnemosyne role

Save report to: docs/sprint-artifacts/completions/{{story_key}}-summary.md
Save hermes artifact to: docs/sprint-artifacts/completions/{{story_key}}-hermes.json

---

<critical>
- SEARCH playbooks FIRST - don't create duplicates
- PREFER UPDATE over CREATE
- ACTUALLY WRITE playbook changes - don't just propose
- SKIP reflection if trivial - don't create noise
- TL;DR must be concise - used in batch aggregation
</critical>
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
    "ASSESS": { "status": "complete", "details": "{{coverage}}% coverage, {{must_fix}} MUST_FIX" },
    "REFINE": { "status": "complete", "details": "{{iterations}} iterations, {{must_fix}}→0 issues" },
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

### Display Final Summary

**📢 Orchestrator says (completion):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ STORY COMPLETE: {{story_key}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{story_title}}

📊 Quick Stats:
   • Files: {{files_created + files_modified}} changed
   • Lines: {{lines_added}} added
   • Tests: {{tests_added}} added
   • Coverage: {{coverage}}%
   • Issues: {{total_issues}} found → {{upheld_must_fix}} fixed

✅ Features Delivered:
   {{From TL;DR in hermes artifact}}

📋 Verification:
   {{verification_items}} items in manual testing checklist

📄 Full Report:
   docs/sprint-artifacts/completions/{{story_key}}-summary.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

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
| Complexity | Review Mode | Agents | Triggers |
|------------|-------------|--------|----------|
| trivial | consolidated | Multi-Reviewer (4 perspectives) | Static pages, copy, config, 1 task |
| micro | consolidated | Multi-Reviewer (4 perspectives) | 2 tasks, no API, no user input |
| light | consolidated | Multi-Reviewer (4 perspectives) | 3-4 tasks, basic CRUD |
| standard | consolidated | Multi-Reviewer (4 perspectives) | 5-10 tasks, API, user input |
| complex | parallel | Argus + Nemesis + Cerberus + Apollo + Hestia | 11-15 tasks, auth, migrations |
| critical | parallel | Argus + Nemesis + Cerberus + Apollo + Hestia + Arete | 16+ tasks, payment, encryption, PII |

**Review Modes (Token Optimization v4.2):**
- **Consolidated** - Single Multi-Reviewer agent covers all 4 perspectives (Argus, Nemesis, Cerberus, Hestia). Saves ~60-70% tokens. Use for trivial→standard.
- **Parallel** - Separate agents spawn in parallel for maximum independence. Use for complex/critical.

**Agent roles:**
- **Argus** 👁️ (Inspector) - Verifies tasks with code citations.
- **Nemesis** 🧪 (Test Quality) - Reviews test coverage and quality.
- **Cerberus** 🔐 (Security) - Security vulnerabilities, injection, auth issues.
- **Apollo** ⚡ (Logic/Performance) - Logic bugs, performance issues, edge cases.
- **Hestia** 🏛️ (Architecture) - Patterns, integration, route structure.
- **Arete** ✨ (Code Quality) - Maintainability, readability, best practices.
- **Multi-Reviewer** 👁️🧪🔐🏛️ (Consolidated) - All 4 perspectives in one pass. Token-efficient.
- **Themis** ⚖️ (Arbiter) - Triages issues with pragmatic judgment.
- **Hermes** 📜 (Reflect+Report) - Updates playbooks AND generates completion report.
- **Iris** 🌈 (Accessibility) - WCAG, ARIA, a11y (conditional, frontend only).
- **Pygmalion** 🗿 (Persona Forge) - Analyzes domain, forges specialist personas. Invoked in Phase 1.5 for complexity >= light.
- **Forged Specialists** (Dynamic) - Domain-specific reviewers created by Pygmalion. Same artifact format as Pantheon reviewers.
</complexity_routing>

<success_criteria>
- [ ] Phase 1 PREPARE: Story validated, playbooks loaded
- [ ] Phase 1.5 FORGE: Pygmalion invoked (if complexity >= light), forged specs stored
- [ ] Phase 2 BUILD: Metis spawned, agent_id saved
- [ ] Phase 3 VERIFY: Review completed (consolidated OR parallel) + forged specialists (if any)
- [ ] Phase 4 ASSESS: Coverage passed, Themis triaged issues
- [ ] Phase 5 REFINE: Zero MUST_FIX remaining (or user accepted)
- [ ] Phase 6 COMMIT: Story reconciled, sprint status updated
- [ ] Phase 7 REFLECT: Hermes generated playbook updates + completion report
- [ ] Implementation commit exists
- [ ] Reconciliation commit exists
- [ ] Coverage ≥ {{coverage_threshold}}%
- [ ] SHOULD_FIX/STYLE logged as tech debt (if any)
</success_criteria>

<version_history>
**v7.0 - Pygmalion Edition**
1. ✅ Added Pygmalion (Persona Forge) — dynamically forges domain-specific specialist personas
2. ✅ New Phase 1.5 FORGE: Domain analysis + specialist forging (complexity >= light)
3. ✅ Phase 3 VERIFY: Forged specialists spawn alongside Pantheon reviewers in parallel
4. ✅ Phase 4 ASSESS: Themis triages forged specialist findings identically to Pantheon
5. ✅ Phase 5 REFINE: Forged specialists with upheld MUST_FIX resumed/respawned for verification
6. ✅ Complexity gating: trivial/micro skip forging; light gets max 1; standard max 2; complex max 3; critical max 4
7. ✅ Forged specialists use same artifact format as Pantheon — zero changes to Themis triage

**v6.1 - Token Optimization Edition**
1. ✅ Combined Mnemosyne + Hermes into Hermes (saves ~5-8K tokens/story)
2. ✅ Added Multi-Reviewer consolidated agent (saves ~60-70% Phase 3 tokens)
3. ✅ Complexity-based review mode routing (consolidated for trivial→standard, parallel for complex+)
4. ✅ Both optimizations maintain quality while reducing token overhead

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
