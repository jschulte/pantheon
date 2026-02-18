# Universal Story Pipeline Orchestrator

> **Canonical source:** `src/workflows/story-pipeline/workflow.md` (v1)
> This file is a platform-agnostic adapter. For full phase details, refer to the canonical workflow.
> When this file conflicts with the canonical source, the canonical source wins.

This document provides platform-agnostic orchestration instructions for the Pantheon pipeline. Each platform adapter translates these instructions into platform-specific agent invocations.

## Platform Detection

Before starting, determine your platform:

```
IF running in Claude Code:
  → Use Task tool with subagent_type
  → Parallel: Multiple Task calls in one message
  → Resume: Pass agent_id to Task

ELIF running in OpenCode:
  → Use @agent mentions or Task tool
  → Parallel: External orchestration or sequential
  → Resume: Not available, fresh context each time

ELIF running in GitHub Copilot:
  → Skills auto-loaded by Copilot
  → Parallel: Automatic when appropriate
  → Resume: Use --resume flag in CLI

ELIF running in Codex:
  → Follow instructions sequentially
  → Parallel: Not available
  → Resume: Not available
```

---

## Phase 1: PREPARE (1/7)

**Orchestrator performs directly (no agent spawn)**

### 1.1 Load Story
```
Read story file: {{sprint_artifacts}}/{{story_key}}.md
Parse: task count, acceptance criteria, keywords
```

### 1.2 Determine Complexity

| Tasks | Risk Keywords | Complexity | Agent Count |
|-------|---------------|------------|-------------|
| 1 | None | trivial | 1 (Argus) |
| 2 | None | micro | 2 (Argus + Hestia) |
| 3-4 | None | light | 3 (+Nemesis) |
| 5-10 | Some | standard | 4 (+Cerberus) |
| 11-15 | Yes | complex | 5 (+Apollo) |
| 16+ | Critical | critical | 6 (+Arete) |

### 1.3 Quality Gate

Check:
- [ ] Required sections exist (Title, Acceptance Criteria, Tasks)
- [ ] No placeholder tasks (TBD, TODO)
- [ ] No unresolved blockers

If blocked → HALT with message

### 1.4 Load Playbooks

Search `docs/implementation-playbooks/` for relevant playbooks (max 3).

---

## Phase 2: BUILD (2/7)

**Spawn: Metis (Builder)**

### Platform-Specific Invocation

```
# Claude Code
Task(subagent_type: "general-purpose", ...)
SAVE builder_agent_id for resume

# OpenCode
@pantheon-builder OR Task({ agent: "pantheon-builder", ... })

# Copilot
Skill auto-loads pantheon-builder when implementation needed

# Codex
Load builder instructions, execute sequentially
```

### Metis Instructions

1. Review playbooks for patterns/gotchas
2. Analyze existing code vs needed
3. Write tests FIRST (TDD)
4. Implement production code
5. Run tests before finishing

### Expected Output

```json
{
  "agent": "metis",
  "status": "SUCCESS",
  "files_created": [...],
  "files_modified": [...],
  "tests_added": { "total": N, "passing": N }
}
```

---

## Phase 3: VERIFY (3/7)

**Spawn: Multiple reviewers based on complexity**

### Agent Selection

| Complexity | Agents to Spawn |
|------------|-----------------|
| trivial | Argus |
| micro | Argus, Hestia |
| light | Argus, Nemesis, Hestia |
| standard | Argus, Nemesis, Cerberus, Hestia |
| complex | Argus, Nemesis, Cerberus, Apollo, Hestia |
| critical | Argus, Nemesis, Cerberus, Apollo, Hestia, Arete |

### Parallel Execution

```
# Claude Code - Single message with multiple Tasks
Task(Argus), Task(Nemesis), Task(Cerberus), ...

# OpenCode - Sequential or external orchestration
FOR agent IN selected_agents:
  invoke(agent)

# Copilot - Automatic parallelization
Skills load automatically and may run in parallel

# Codex - Sequential
FOR agent IN selected_agents:
  execute(agent_instructions)
```

### Each Reviewer Must Provide

1. Issue classification: MUST_FIX / SHOULD_FIX / STYLE
2. File:line evidence for each finding
3. Structured JSON output

---

## Phase 4: ASSESS (4/7)

**Orchestrator: Coverage Gate + Spawn: Themis (Arbiter)**

### 4.1 Coverage Gate

```bash
npm test -- --coverage
# Extract coverage percentage
# If < 80% → Add to MUST_FIX list
```

### 4.2 Themis Triage

Spawn Themis with ALL reviewer findings.

**Quick Fix Rule:** If fixable in < 2 minutes → MUST_FIX (no debate)

**Expected Output:**
```json
{
  "summary": {
    "must_fix": N,
    "should_fix": N,
    "style": N
  }
}
```

### Decision Point

```
IF must_fix == 0:
  SKIP Phase 5
  GOTO Phase 6
ELSE:
  CONTINUE to Phase 5
```

---

## Phase 5: REFINE (5/7)

**Iterative loop: max 3 iterations**

### Loop

```
WHILE must_fix > 0 AND iteration <= 3:

  # 5.1 Metis fixes
  # Claude Code: Task(resume: builder_agent_id)
  # Other platforms: Fresh Metis spawn with MUST_FIX list

  # 5.2 Verify fixes
  # Resume original reviewers OR fresh verification

  # 5.3 Check remaining
  must_fix = count_remaining_issues()
  iteration++

IF iteration > 3 AND must_fix > 0:
  ESCALATE to user
```

### Platform Notes

- **Claude Code**: Resume Metis with `agent_id` (50-70% token savings)
- **OpenCode/Copilot/Codex**: Fresh agent each time (higher token cost)

---

## Phase 6: COMMIT (6/7)

**Orchestrator performs directly (no agent spawn)**

### 6.1 Update Story File

Using Argus evidence, check off completed tasks:
```
"- [ ] Task" → "- [x] Task"
```

### 6.2 Fill Dev Agent Record

Add to story file:
```markdown
**Dev Agent Record**
**Implementation Date:** {{timestamp}}
**Agent Model:** {{platform}} (Greek Pantheon Pipeline v6.0)
**Git Commit:** {{commit_hash}}
...
```

### 6.3 Update Sprint Status

```yaml
# sprint-status.yaml
{{story_key}}: done  # was: ready-for-dev
```

### 6.4 Git Commit

```bash
git add {{sprint_artifacts}}/{{story_key}}.md
git add {{implementation_artifacts}}/sprint-status.yaml
git add {{sprint_artifacts}}/completions/
git commit -m "chore({{story_key}}): reconcile story completion"
```

---

## Phase 7: REFLECT (7/7)

**Spawn: Mnemosyne (Reflection)**

### Mnemosyne Process

1. Extract learnings from reviewer findings
2. SEARCH existing playbooks first
3. UPDATE existing OR CREATE new (prefer update)
4. Actually write the changes

### Expected Output

```json
{
  "playbook_action": {
    "action": "updated|created|skipped",
    "path": "docs/playbooks/...",
    "reason": "..."
  }
}
```

---

## Completion

Display summary:
```
Story {{story_key}} complete!

Built: {{files}} files, {{tests}} tests
Reviewed by: {{agent_count}} agents
Issues: {{total}} found → {{fixed}} fixed
Coverage: {{coverage}}%
```

---

## Agent Quick Reference

| Agent | Greek Name | Role | Platform Agent Type |
|-------|------------|------|---------------------|
| Builder | Metis | TDD Implementation | general-purpose |
| Inspector | Argus | Task verification with evidence | test-engineer |
| Test Quality | Nemesis | Test coverage/quality review | test-engineer |
| Security | Cerberus | Security vulnerabilities | security-auditor |
| Logic/Perf | Apollo | Logic bugs, performance | optimizer |
| Architecture | Hestia | Patterns, structure | architect-reviewer |
| Quality | Arete | Code quality, best practices | general-purpose |
| Arbiter | Themis | Issue triage | general-purpose |
| Reflection | Mnemosyne | Playbook learning | general-purpose |
| Accessibility | Iris | WCAG, a11y (conditional) | general-purpose |
