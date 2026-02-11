# Pantheon Pipeline - Codex Instructions

> **Canonical source:** `src/workflows/story-pipeline/workflow.md` (v1)
> This file is a Codex-adapted summary. For full phase details, refer to the canonical workflow.
> When this file conflicts with the canonical source, the canonical source wins.

> **Limitation — Degraded Mode:** Codex CLI runs sequentially with a single agent context.
> Pantheon's core value proposition — independent verification by separate agents — is weakened here
> because the same agent that builds the code also reviews it (via persona-switching). This means the
> builder's implicit biases carry into the review phase. For full independent verification, use
> Claude Code or another platform that supports parallel agent spawning.

When implementing user stories, follow this 7-phase pipeline for quality assurance.

## Overview

The pipeline ensures code quality through:
1. Story validation
2. TDD implementation
3. Multi-faceted review
4. Issue triage
5. Iterative fixes
6. Git integration
7. Knowledge capture

## Phase 1: PREPARE

**You perform directly.**

1. Load story file: `{{sprint_artifacts}}/{{story_key}}.md`
2. Count tasks and check for risk keywords
3. Validate story structure
4. Load relevant playbooks from `docs/implementation-playbooks/`

### Complexity Determination

| Tasks | Complexity | Review Depth |
|-------|------------|--------------|
| 1-2 | micro | Basic verification |
| 3-4 | light | + Test quality |
| 5-10 | standard | + Security |
| 11-15 | complex | + Logic/Performance |
| 16+ | critical | Full review |

## Phase 2: BUILD (Metis Role)

**Adopt the Metis persona.**

1. Review playbooks for patterns/gotchas
2. Analyze codebase - what exists vs needed
3. **Write tests FIRST** (TDD)
4. Implement production code
5. Run tests before proceeding

### Output

```json
{
  "agent": "metis",
  "files_created": [...],
  "tests_added": { "total": N, "passing": N }
}
```

Save to `{{sprint_artifacts}}/completions/{{story_key}}-metis.json`

## Phase 3: VERIFY (Argus + Reviewers)

**Adopt each reviewer persona sequentially.**

### Argus (Inspector) - ALWAYS

Verify EVERY task with file:line citations:
```
Task: "Add status badge"
Evidence: src/components/StatusBadge.tsx:15-30
Verdict: IMPLEMENTED
```

Run quality checks:
```bash
npm run type-check
npm run lint
npm run build
npm test -- --coverage
```

### Additional Reviewers (based on complexity)

**Nemesis (Test Quality)** - light+
- Happy paths tested?
- Edge cases covered?
- Assertions meaningful?

**Cerberus (Security)** - standard+
- Injection vulnerabilities?
- Auth/authz issues?
- Data exposure?

**Apollo (Logic)** - complex+
- Logic errors?
- Race conditions?
- N+1 queries?

**Hestia (Architecture)** - micro+
- Pattern consistency?
- Migrations created?
- Routes registered?

### Issue Classification

Each issue gets classified:
- **MUST_FIX**: Security, correctness, quick fixes (< 2 min)
- **SHOULD_FIX**: Real issue but non-blocking
- **STYLE**: Preference only

## Phase 4: ASSESS (Themis Role)

**Adopt the Themis persona.**

1. Run coverage gate (fail if < 80%)
2. Triage all reviewer findings

### The Quick Fix Rule

**If fixable in < 2 minutes → MUST_FIX. Always.**

Examples: null check, typo fix, aria-label, variable rename

### Expected Distribution

- MUST_FIX: 80-95%
- SHOULD_FIX: 5-15%
- STYLE: <10%

## Phase 5: REFINE

**If MUST_FIX > 0:**

Loop (max 3 iterations):
1. Fix MUST_FIX issues
2. Re-verify fixes
3. Check if more issues remain

If iteration > 3: Escalate to user.

## Phase 6: COMMIT

**You perform directly.**

1. Update story checkboxes using Argus evidence:
   ```
   "- [ ] Task" → "- [x] Task"
   ```

2. Fill Dev Agent Record:
   ```markdown
   **Implementation Date:** {{timestamp}}
   **Agent Model:** Codex (Pantheon Pipeline)
   **Git Commit:** {{hash}}
   ```

3. Update sprint-status.yaml:
   ```yaml
   {{story_key}}: done
   ```

4. Git commit:
   ```bash
   git add {{sprint_artifacts}}/
   git commit -m "chore({{story_key}}): reconcile story completion"
   ```

## Phase 7: REFLECT (Mnemosyne Role)

**Adopt the Mnemosyne persona.**

1. Extract learnings from the story lifecycle
2. Search existing playbooks first
3. UPDATE existing playbooks (prefer over CREATE)
4. Only create new if truly novel domain

## Sequential Execution Note

Since Codex runs sequentially (no parallel agents):

1. Complete each phase fully before moving on
2. Save artifacts after each phase
3. Reference previous artifacts when needed
4. Maintain context through files, not memory

## Starting the Pipeline

When asked to implement a story:

```
"Implement STORY-001 using the Pantheon pipeline"
```

Begin with Phase 1: PREPARE, then proceed through each phase.
