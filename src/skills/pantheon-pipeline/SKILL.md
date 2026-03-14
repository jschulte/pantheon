---
name: Pantheon Story Pipeline
description: Execute the 9-phase Pantheon pipeline to implement a user story with multi-agent verification. Invoke when a user asks to implement a story, mentions BMAD or Pantheon, or requests TDD with review.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Edit
  - Write
---

# Pantheon Pipeline

> **Canonical source:** `src/workflows/story-pipeline/workflow.md` (v1)
> This file is a Copilot-adapted skill. For full phase details, refer to the canonical workflow.
> When this file conflicts with the canonical source, the canonical source wins.

You are orchestrating the **Pantheon** -- an 9-phase pipeline that implements user stories with multi-agent verification.

## Input Contract

| Parameter | Required | Description | Failure Behavior |
|-----------|----------|-------------|------------------|
| `story_key` | Yes | Story identifier (e.g., `5-1`) | Halt with error: "No story_key provided" |
| `sprint_artifacts` | Yes | Path to sprint artifacts directory | Halt with error: "sprint_artifacts path not set" |
| `focus` | No | Optional review focus (e.g., "security") | Default: all review perspectives |

## The 8 Phases

1. **PREPARE** -- Validate story, load playbooks, determine complexity
2. **FORGE** -- Pygmalion forges domain-specific specialist reviewers (skipped if complexity < light)
3. **BUILD** -- Metis implements with TDD (tests first, then production code)
4. **VERIFY** -- Multi-reviewer validation in parallel (Argus, Nemesis, Cerberus, forged specialists)
5. **ASSESS** -- Coverage gate + Themis triage (security gate check included)
6. **REFINE** -- Fix MUST_FIX issues iteratively (max 3 iterations)
7. **COMMIT** -- Reconcile story, update sprint-status.yaml, git commit via Charon
8. **REFLECT** -- Mnemosyne updates playbooks with learnings

## Phase 1: PREPARE

Perform directly:

1. Load the story file from `{{sprint_artifacts}}/{{story_key}}.md`.
2. Count tasks and scan for risk keywords.
3. Route to the appropriate complexity tier.
4. Validate required sections exist.

```bash
# Load story
STORY_FILE="{{sprint_artifacts}}/{{story_key}}.md"

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

Verify each condition before proceeding:

1. Confirm required sections exist (Title, Tasks, Acceptance Criteria).
2. Confirm no placeholder tasks (TBD, TODO).
3. Confirm no unresolved blockers.

If any check fails, halt the pipeline and report the specific validation failure.

**Failure:** If the story file is missing or unparseable, halt with message: "Story {{story_key}} failed PREPARE validation: [reason]".

## Phase 2: FORGE

Invoke the `pantheon-pygmalion` skill to analyze the story domain and forge specialist reviewer personas.

1. Pass the story file and detected domain keywords to Pygmalion.
2. Receive forged specialist definitions.
3. Add forged specialists to the reviewer roster for Phase 4.

Skip this phase if complexity is `trivial` or `micro`.

**Failure:** If Pygmalion fails to produce valid personas, continue with default reviewers only and log a warning.

## Phase 3: BUILD

Load the `pantheon-builder` skill content and execute TDD implementation.

1. Load playbooks for known patterns.
2. Analyze existing code in the target area.
3. Write tests first.
4. Implement production code to pass tests.
5. Run all tests and confirm they pass before completing.

**Failure:** If tests fail after implementation, collect the failure output and pass it forward to ASSESS. Do not halt the pipeline.

## Phase 4: VERIFY

Invoke reviewer skills in parallel based on complexity tier:

- **trivial**: pantheon-inspector
- **micro**: + pantheon-architecture
- **light**: + pantheon-test-quality
- **standard**: + pantheon-security
- **complex**: + pantheon-logic
- **critical**: + pantheon-quality

Include any forged specialists from Phase 2.

Each reviewer outputs findings with MUST_FIX / SHOULD_FIX / STYLE classification.

**Failure:** If a reviewer skill fails to respond, exclude its findings and log a warning. Continue with available reviews.

## Phase 5: ASSESS

1. Run the coverage gate:
```bash
npm test -- --coverage
# Fail if < 80%
```

2. Invoke `pantheon-arbiter` to triage all findings from VERIFY.

3. Apply the Quick Fix Rule: if an issue is fixable in < 2 minutes, classify it as MUST_FIX.

If `must_fix == 0`, skip Phase 6.

**Failure:** If the coverage gate fails (< 80%), add a MUST_FIX issue for insufficient coverage and proceed to REFINE.

## Phase 6: REFINE

Loop (max 3 iterations):

1. Pass the MUST_FIX list to the builder.
2. Builder fixes each issue.
3. Re-run verification on changed files.
4. Re-check: if `must_fix > 0`, loop again.

If max iterations reached, escalate to the user with the remaining issues list.

**Failure:** If the builder cannot fix an issue after 3 attempts, mark it as `ESCALATED` and include it in the pipeline summary.

## Phase 7: COMMIT

Perform directly:

1. Update story checkboxes using inspector evidence.
2. Fill the Dev Agent Record section with metrics.
3. Update sprint-status.yaml with story completion status.
4. Create a git commit.

```bash
git add {{sprint_artifacts}}/
git commit -m "chore({{story_key}}): reconcile story completion"
```

**Failure:** If git commit fails (e.g., hook failure), report the error and leave files staged for manual commit.

## Phase 8: REFLECT

Invoke `pantheon-reflection` to update playbooks with learnings from this pipeline run.

1. Pass all findings, fixes, and metrics to the reflection agent.
2. Mnemosyne extracts patterns and anti-patterns.
3. Updated playbooks are written to disk.

**Failure:** If reflection fails, log a warning. This phase is non-blocking.

## Error Handling

| Error | Action |
|-------|--------|
| Story file missing or unparseable | Halt pipeline, report validation failure |
| Pygmalion forge failure | Continue with default reviewers, log warning |
| Builder test failure | Pass failure output to ASSESS, do not halt |
| Reviewer skill unresponsive | Exclude that reviewer's findings, log warning |
| Coverage below 80% | Add MUST_FIX for coverage, proceed to REFINE |
| REFINE max iterations exceeded | Escalate remaining issues to user |
| Git commit failure | Report error, leave files staged |
| Reflection failure | Log warning, pipeline still succeeds |

## Constraints

- Never skip PREPARE validation -- all stories must pass quality gate before building.
- Never implement code directly -- always delegate to the builder skill.
- Never suppress or downgrade MUST_FIX findings during triage.
- Never exceed 3 REFINE iterations without user escalation.
- Never commit code with failing tests unless the user explicitly approves.
- Never run reviewers that are outside the complexity tier (avoid unnecessary token spend).

## Pre-Output Verification

Before emitting the pipeline summary, verify:

1. Confirm all 8 phases executed or were explicitly skipped with logged reason.
2. Confirm zero MUST_FIX issues remain (or all are marked ESCALATED).
3. Confirm story file checkboxes match actual implementation state.
4. Confirm sprint-status.yaml reflects the correct story status.
5. Confirm git commit was created (or failure was reported).
6. Confirm the completion summary includes: files changed, tests added, issues found/fixed, coverage percentage.

## Progress Display

Between phases, output status:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3: BUILD (3/8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Metis implementing with TDD...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Completion Summary

```
Story {{story_key}} complete!

Built: {{files}} files, {{tests}} tests
Reviewed by: {{agent_count}} agents
Issues: {{total}} found, {{fixed}} fixed
Coverage: {{coverage}}%
```
