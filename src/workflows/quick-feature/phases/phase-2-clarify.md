# Phase 2: CLARIFY (2/8)
<!-- Part of Quick Feature Pipeline v1.0 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2: CLARIFY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Adaptive clarification — last input before autonomy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**This is the FIRST of 2 user interaction points.** After this phase completes, the pipeline runs autonomously through PRD, Architecture, and Epics before the next stop.

## Step 1: Calculate Question Count

```
QUESTION_COUNT = max(4, min(12, 14 - (PLAN_DETAIL_SCORE * 2)))

Score 0 (no detail)        → 12 questions (3 AskUserQuestion calls, capped at 12)
Score 1 (vague idea)       → 12 questions (3 calls)
Score 2 (brief outline)    → 10 questions (3 calls)
Score 3 (decent detail)    → 8 questions  (2 calls)
Score 4 (solid spec)       → 6 questions  (2 calls)
Score 5 (comprehensive)    → 4 questions  (1 call)
```

## Step 2: Select Questions

Pick from the question bank below based on what's MISSING from the plan. Skip questions the plan already answers clearly.

**Question Bank** (orchestrator picks QUESTION_COUNT from these):

| # | Category | Question | When to ask |
|---|----------|----------|-------------|
| 1 | Scope & boundaries | "What's explicitly OUT of scope for this feature?" | Plan lacks scope boundaries |
| 2 | User personas | "Who are the primary users? Any role-based access differences?" | No user/persona mentions |
| 3 | Data model | "What new data entities or fields does this require?" | No data model details |
| 4 | Integration points | "Does this connect to external services/APIs?" | No integration mentions |
| 5 | UI/UX expectations | "Any specific UI patterns or design system constraints?" | No UI/UX details |
| 6 | Auth/permissions | "Any authorization or access control requirements?" | No auth mentions |
| 7 | Performance | "Any latency, throughput, or scale targets?" | No performance requirements |
| 8 | Error handling | "How should errors/edge cases be surfaced to users?" | No error handling details |
| 9 | Migration/compat | "Any backward compatibility or data migration needs?" | Touches existing systems |
| 10 | Testing | "What level of test coverage is expected?" | No testing expectations |
| 11 | Dependencies | "Are there prerequisite features or infrastructure needed?" | No dependency mentions |
| 12 | Success metrics | "How will you know this feature is working correctly?" | No success criteria |

**Selection rules:**
- Always include questions 1 (scope) and 12 (success metrics) — these are universally valuable
- Prioritize questions for dimensions that scored 0 in the detail assessment
- Each question MUST be multiple-choice with 2-4 options (the AskUserQuestion tool auto-adds "Other" for custom input)
- Phrase options to cover the most common answers for the project's domain

## Step 3: Ask Questions in Batches

AskUserQuestion supports up to 4 questions per call. Batch accordingly:

```
IF QUESTION_COUNT <= 4:
  → 1 AskUserQuestion call with QUESTION_COUNT questions

ELSE IF QUESTION_COUNT <= 8:
  → 2 AskUserQuestion calls (4 + remainder)

ELSE (9-12):
  → 3 AskUserQuestion calls (4 + 4 + remainder)
```

**For each question, provide contextual multiple-choice options.** Examples:

```
Q: "What's explicitly OUT of scope?"
Options:
  - "No exclusions — build everything mentioned"
  - "Admin/management features (user-facing only)"
  - "Mobile/responsive (desktop only for now)"
  - "Performance optimization (functional first)"

Q: "Who are the primary users?"
Options:
  - "All authenticated users (no role differences)"
  - "End users + admins (role-based access)"
  - "Internal team only (back-office tool)"
  - "Public (unauthenticated access)"

Q: "What level of test coverage?"
Options:
  - "Unit tests for business logic (Recommended)"
  - "Unit + integration tests"
  - "Full coverage (unit + integration + e2e)"
  - "Minimal (happy path only)"
```

**Adapt the specific options to the project domain and plan context.** The options should reflect realistic choices for the feature being described, not generic boilerplate.

## Step 4: Build Enriched Plan

After all answers are collected:

```
ENRICHED_PLAN = """
## Original Plan
{PLAN_TEXT}

## Clarifications
{For each Q&A pair:}
### {Question Category}
**Q:** {Question}
**A:** {User's answer}

{End for each}
"""
```

This ENRICHED_PLAN is the input to all subsequent BMM workflow sub-agents.

## Step 5: Display Confirmation

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLARIFICATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plan enriched with {{answer_count}} clarifications.
Launching autonomous pipeline...

Pipeline: PRD → Architecture → Epics
Next stop: After epics (epic selection + build mode)

No further input needed until then.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Carry forward to Phase 3:**
- `ENRICHED_PLAN` — original plan + all clarification answers
- `PRD_MODE` — from Phase 1
- `SKIP_ARCHITECTURE` — from Phase 1
