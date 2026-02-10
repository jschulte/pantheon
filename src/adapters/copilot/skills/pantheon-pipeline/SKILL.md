---
name: Pantheon Story Pipeline
description: Execute the 7-phase Pantheon pipeline to implement user stories with multi-agent verification. Invoke when implementing stories or when user mentions BMAD, Pantheon, or story pipeline.
---

# Pantheon Pipeline

> **Canonical source:** `src/workflows/story-pipeline/workflow.md` (v1)
> This file is a Copilot-adapted skill. For full phase details, refer to the canonical workflow.
> When this file conflicts with the canonical source, the canonical source wins.

You are orchestrating the **Pantheon** - a 7-phase pipeline that implements user stories with multi-agent verification.

## When to Use This Skill

- User asks to implement a story (e.g., "implement STORY-001")
- User mentions BMAD, Pantheon, or story pipeline
- User wants multi-agent code review
- User wants TDD implementation with verification

## The 7 Phases

1. **PREPARE** - Validate story, load playbooks
2. **BUILD** - TDD implementation (invoke pantheon-builder skill)
3. **VERIFY** - Multi-reviewer validation (invoke reviewer skills)
4. **ASSESS** - Coverage gate + issue triage (invoke pantheon-arbiter)
5. **REFINE** - Fix issues iteratively
6. **COMMIT** - Reconcile story, git commit
7. **REFLECT** - Update playbooks (invoke pantheon-reflection)

## Phase 1: PREPARE

Perform directly:

```bash
# Load story
STORY_FILE="docs/sprint-artifacts/{{story_key}}.md"

# Count tasks
TASK_COUNT=$(grep -c "^- \[ \]" "$STORY_FILE")

# Check for risk keywords
CRITICAL=$(grep -ciE "payment|encryption|PII|credentials" "$STORY_FILE")
```

### Complexity Routing

| Tasks | Risk | Complexity | Reviewers |
|-------|------|------------|-----------|
| 1 | None | trivial | Inspector only |
| 2 | None | micro | + Architecture |
| 3-4 | None | light | + Test Quality |
| 5-10 | Some | standard | + Security |
| 11-15 | Yes | complex | + Logic |
| 16+ | Critical | critical | + Quality |

### Quality Gate

Check:
- Required sections exist (Title, Tasks, Acceptance Criteria)
- No placeholder tasks (TBD, TODO)
- No unresolved blockers

If blocked → HALT with message.

## Phase 2: BUILD

Load the `pantheon-builder` skill content and execute TDD implementation.

The builder (Metis) will:
1. Review playbooks for patterns
2. Analyze existing code
3. Write tests FIRST
4. Implement production code
5. Run tests before finishing

## Phase 3: VERIFY

Based on complexity, invoke reviewer skills in parallel:

**trivial**: pantheon-inspector
**micro**: + pantheon-architecture
**light**: + pantheon-test-quality
**standard**: + pantheon-security
**complex**: + pantheon-logic
**critical**: + pantheon-quality

Each reviewer outputs findings with MUST_FIX/SHOULD_FIX/STYLE classification.

## Phase 4: ASSESS

1. Run coverage gate:
```bash
npm test -- --coverage
# Fail if < 80%
```

2. Load `pantheon-arbiter` skill to triage all findings.

**Quick Fix Rule**: If fixable in < 2 minutes → MUST_FIX (no debate)

If must_fix == 0 → Skip Phase 5.

## Phase 5: REFINE

Loop (max 3 iterations):
1. Provide MUST_FIX list to builder
2. Builder fixes issues
3. Verify fixes
4. Check if must_fix > 0

If max iterations reached → Escalate to user.

## Phase 6: COMMIT

Perform directly:

1. Update story checkboxes using inspector evidence
2. Fill Dev Agent Record section
3. Update sprint-status.yaml
4. Git commit

```bash
git add docs/sprint-artifacts/
git commit -m "chore({{story_key}}): reconcile story completion"
```

## Phase 7: REFLECT

Load `pantheon-reflection` skill to update playbooks with learnings.

## Progress Display

Between phases, output friendly status:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔨 PHASE 2: BUILD (2/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Metis implementing with TDD...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Completion Summary

```
Story {{story_key}} complete! 🎉

Built: {{files}} files, {{tests}} tests
Reviewed by: {{agent_count}} agents
Issues: {{total}} found → {{fixed}} fixed
Coverage: {{coverage}}%
```
