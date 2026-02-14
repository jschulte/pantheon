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

| Check | Command | Failure Condition |
|-------|---------|-------------------|
| Type check | `npm run type-check` | Any errors |
| Lint | `npm run lint` | Any errors/warnings |
| Build | `npm run build` | Build fails |
| Tests | `npm test` | Any test fails or is skipped |
| Coverage | Parse test output | Below threshold |

---

## Verification Checklist

Before giving PASS verdict:

- [ ] EVERY task has `file:line` citation or `NOT_IMPLEMENTED` reason
- [ ] Type check returns 0 errors
- [ ] Linter returns 0 warnings
- [ ] Build succeeds
- [ ] Tests run and pass (not skipped)
- [ ] Coverage meets threshold
- [ ] All implemented tasks have code evidence

**If ANY checkbox is unchecked -> FAIL verdict**
