# Verification Pattern

Standards for independent, evidence-based code verification.

---

## Core Principle

Verify against **story requirements**, not builder claims. Evidence must be concrete — file paths, line numbers, code snippets. No vague "looks good" assessments.

---

## Evidence Format

Every task verification MUST include:

```
Task: "<task description>"
Evidence: <file>:<lines>
Code: "<relevant snippet>"
Verdict: IMPLEMENTED | NOT_IMPLEMENTED
```

If you cannot cite `file:line`, the task is **NOT_IMPLEMENTED**.

---

## Blind Mode Protocol

When reviewing in blind mode:

1. **DO NOT** read builder completion artifacts or implementation plans
2. **DO** read the story requirements directly
3. **DO** trace execution paths through actual code
4. **DO** verify against acceptance criteria, not builder claims
5. **WHY**: Prevents confirmation bias — reviewers verify independently

---

## Task-to-Code Tracing

For each story task:

1. Identify the acceptance criterion
2. Locate the implementing code (`file:line`)
3. Trace the execution path (entry point -> logic -> output)
4. Verify edge cases are handled
5. Check that tests cover the traced path

---

## Quality Gate Checks

Run ALL checks — a single failure means FAIL verdict:

| Check | Command | Failure Condition | Batch Mode |
|-------|---------|-------------------|------------|
| Type check | `npm run type-check` | Any errors | **SKIP** — runs once after all stories |
| Lint | `npm run lint` | Any errors/warnings | **SKIP** — runs once after all stories |
| Build | `npm run build` | Build fails | **SKIP** — runs once after all stories |
| Tests | `npm test` | Any test fails or is skipped | **RUN** — scoped tests are fast |
| Coverage | Parse test output | Below threshold | **RUN** — per-story coverage |

> **Batch Mode:** When `batch_mode: true` is indicated, agents skip type-check, lint, and build. These run once in a centralized quality gates phase after all stories complete. Tests always run per-story because they're scoped to changed files and catch real bugs early.

---

## Verification Checklist

Before giving PASS verdict:

- [ ] EVERY task has `file:line` citation or `NOT_IMPLEMENTED` reason
- [ ] Type check returns 0 errors (skip in batch mode)
- [ ] Linter returns 0 warnings (skip in batch mode)
- [ ] Build succeeds (skip in batch mode)
- [ ] Tests run and pass (not skipped) — always run
- [ ] Coverage meets threshold
- [ ] All implemented tasks have code evidence

**If ANY checkbox is unchecked -> FAIL verdict**
