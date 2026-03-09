---
name: Pantheon Batch Review (Hydra)
description: Execute a deep code review and hardening sweep across a scope. Invoke when a user says "batch review", "harden", "deep review", "find bugs", or "security sweep".
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Edit
  - Write
---

# Pantheon Batch Review -- Hardening Sweep

> Deep code review and hardening workflow. Run iteratively until the codebase is clean.

## Input Contract

| Parameter | Required | Description | Failure Behavior |
|-----------|----------|-------------|------------------|
| `scope_id` | Yes | Unique identifier for this review scope, derived from input: `epic-{N}` for epic scopes, `path-{hash}` for directory scopes, `file-{name}` for single-file scopes. Used to namespace all output artifacts. | Halt with error: "Cannot derive scope_id from input" |
| `epic` | No | Epic number to review (e.g., `17`). Resolves to all story files and implementation files for that epic. | At least one of `epic`, `path`, or `file` is required |
| `path` | No | Directory path to review (e.g., `src/components`). Resolves to all files under that directory. | At least one of `epic`, `path`, or `file` is required |
| `file` | No | Single file path to review. | At least one of `epic`, `path`, or `file` is required |
| `focus` | No | Review focus area (e.g., "security vulnerabilities", "accessibility"). Emphasizes that perspective during REVIEW. | Default: all perspectives equally weighted |
| `max_iterations` | No | Maximum review-fix-verify loops. | Default: 5 |

### Deriving `scope_id`

1. If `epic` is provided, set `scope_id` to `epic-{epic}`.
2. If `path` is provided, set `scope_id` to `path-{basename of directory}`.
3. If `file` is provided, set `scope_id` to `file-{filename without extension}`.
4. Append `-pass-{N}` for multi-pass tracking (e.g., `epic-17-pass-1`).

## Workflow

```
SCOPE -> REVIEW -> ASSESS -> FIX -> VERIFY -> REPORT
            ^________________________|
            (loop until clean or max_iterations reached)
```

## Phase 1: SCOPE

1. Parse input parameters and derive `scope_id`.
2. Identify all files in scope based on the input (epic stories, directory contents, or single file).
3. Filter out non-reviewable files (binary, generated, lock files).
4. Display the file list and total count for user confirmation.

**Failure:** If no reviewable files are found, halt with message: "No reviewable files found in scope [scope_id]".

## Phase 2: REVIEW

Perform deep multi-perspective analysis on all scoped files:

1. **Security** -- Injection vectors, auth gaps, exposed secrets, insecure defaults.
2. **Correctness** -- Logic errors, edge cases, null handling, race conditions.
3. **Architecture** -- Pattern violations, coupling, integration issues, API contracts.
4. **Tests** -- Coverage gaps, test quality, missing edge cases, brittle tests.
5. **Accessibility** -- WCAG compliance, keyboard navigation, screen reader support.

If `focus` is provided, weight that perspective more heavily and report its findings first.

Each finding must include: file path, line range, severity, description, and suggested fix.

## Phase 3: ASSESS

Triage all findings into severity tiers:

| Tier | Criteria | Target Ratio |
|------|----------|--------------|
| **MUST_FIX** | Real bugs, security issues, correctness failures | 80-95% of findings |
| **SHOULD_FIX** | Large refactors, significant improvements | 5-15% of findings |
| **STYLE** | Cosmetic issues, minor preference differences | < 10% of findings |

Apply the Quick Fix Rule: if fixable in < 2 minutes, classify as MUST_FIX regardless of severity.

## Phase 4: FIX

1. Collect all MUST_FIX issues sorted by file (minimize context switches).
2. Apply minimal, targeted fixes for each issue.
3. Record each fix with before/after snippets in the fixes artifact.

Do not refactor surrounding code. Do not fix SHOULD_FIX or STYLE issues unless they are trivially adjacent to a MUST_FIX.

## Phase 5: VERIFY

1. Run the test suite to check for regressions.
2. Re-review changed files for newly introduced issues.
3. If new MUST_FIX issues are found and iteration count < `max_iterations`, loop back to Phase 2 with the new findings only.
4. If no new MUST_FIX issues are found, proceed to REPORT.

### Loop Termination

The review-fix-verify loop terminates when ANY of these conditions is met:

- Zero new MUST_FIX issues found in a VERIFY pass (clean pass).
- `max_iterations` reached (default: 5). Report remaining issues as unresolved.
- A VERIFY pass finds the exact same issues as the previous pass (no progress). Escalate to user.

## Phase 6: REPORT

Generate a hardening summary covering:

1. Total files reviewed.
2. Total issues found, classified by tier.
3. Total issues fixed.
4. Remaining unresolved issues (if any) with rationale.
5. Recommendations for follow-up passes with suggested focus areas.

## Error Handling

| Error | Action |
|-------|--------|
| No reviewable files found in scope | Halt with descriptive message |
| No scope parameters provided | Halt: "Provide at least one of: epic, path, or file" |
| Test suite fails before any changes | Log baseline failures, proceed with review (do not fix pre-existing failures) |
| Fix introduces new test failure | Revert that specific fix, log as unresolvable, continue |
| Review iteration finds no new issues | Terminate loop, proceed to REPORT |
| Review iteration finds same issues as prior pass | Terminate loop, escalate to user |
| Max iterations reached | Terminate loop, report remaining unresolved issues |

## Constraints

- Never fix SHOULD_FIX or STYLE issues in automated passes -- only MUST_FIX.
- Never exceed `max_iterations` (default 5) without terminating.
- Never modify files outside the defined scope.
- Never refactor working code that has no findings against it.
- Never suppress findings to achieve a "clean" result.
- Never run more than one hardening pass without displaying intermediate results.

## Pre-Output Verification

Before emitting the final report, verify:

1. Confirm `scope_id` is set and all artifacts use it consistently.
2. Confirm all MUST_FIX issues are either fixed or explicitly listed as unresolved with rationale.
3. Confirm the test suite passes (or pre-existing failures are documented).
4. Confirm iteration count and termination reason are recorded.
5. Confirm all output artifacts are written to `{{sprint_artifacts}}/hardening/`.
6. Confirm the report totals match the sum of individual findings.

## Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARDENING COMPLETE: {{scope_id}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This Pass:
   Files Reviewed: {{file_count}}
   Issues Found: {{found}}
   Issues Fixed: {{fixed}}
   Iterations: {{iteration_count}}
   Focus: "{{focus}}"

Remaining: {{unresolved}} unresolved issues
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Focus Examples

| Focus | Purpose |
|-------|---------|
| `"security vulnerabilities"` | Security audit |
| `"styling, UX, button placement"` | UX consistency |
| `"accessibility, WCAG AA"` | Accessibility audit |
| `"N+1 queries, performance"` | Performance hunt |
| `"error handling consistency"` | Pattern consistency |

## Hardening Strategy

For maximum hardening, run multiple passes with different focus areas:

1. **Pass 1:** No focus -- catch obvious issues across all perspectives.
2. **Pass 2:** `"security"` -- deep security audit.
3. **Pass 3:** `"accessibility"` -- WCAG compliance.
4. **Pass 4:** `"performance"` -- optimize bottlenecks.
5. **Pass 5:** `"consistency"` -- unify patterns.

## Artifacts

Write all artifacts to `{{sprint_artifacts}}/hardening/`:

- `{{scope_id}}-review.json` -- All findings with file/line/severity
- `{{scope_id}}-triage.json` -- Classified issues by tier
- `{{scope_id}}-fixes.json` -- Applied fixes with before/after
- `{{scope_id}}-report.md` -- Human-readable summary
- `{{scope_id}}-history.json` -- Multi-pass tracking across runs

## Related Skills

- `pantheon-pipeline` -- Implement new stories
- `pantheon-inspector` -- Verify implementations
- `pantheon-security` -- Security-focused review
