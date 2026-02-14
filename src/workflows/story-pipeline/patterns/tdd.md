# TDD Pattern

Standards for test-driven development execution within the pipeline.

---

## Core Principle

Write tests **before** implementation. Tests define the contract; code fulfills it. Never write production code without a failing test that demands it.

---

## Red-Green-Refactor Cycle

```
1. RED    — Write a failing test for the next requirement
2. GREEN  — Write the minimum code to make it pass
3. REFACTOR — Clean up without changing behavior
4. REPEAT — Next requirement
```

Do not skip steps. Do not write multiple tests before making any pass.

---

## Test-First Workflow

### For Greenfield (new feature):
1. Create test file alongside production file
2. Write test suite skeleton from story tasks
3. Implement one test at a time (red -> green)
4. Refactor after each green

### For Brownfield (existing code):
1. Write characterization tests for existing behavior
2. Add tests for new functionality
3. Implement changes, keeping existing tests green
4. Refactor with full test coverage as safety net

---

## Coverage Expectations

| Metric | Target | Enforcement |
|--------|--------|-------------|
| Line coverage | >= 80% | Hard gate in Phase 4 |
| Branch coverage | >= 70% | Reviewer flag |
| Critical paths | 100% | MUST_FIX if missing |

---

## Test Quality Criteria

Tests must be:

- **Meaningful** — Assert behavior, not implementation details
- **Isolated** — No shared mutable state between tests
- **Deterministic** — Same result every run (no flaky tests)
- **Readable** — Test name describes the scenario and expected outcome
- **Fast** — Unit tests under 100ms each

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad |
|-------------|--------------|
| Testing implementation details | Breaks on refactor, doesn't catch bugs |
| Snapshot-only testing | No behavioral assertions |
| Skipped tests (`xit`, `.skip`) | Hidden tech debt |
| No error path testing | Misses edge cases |
| Mocking everything | Tests prove nothing |
| Asserting on `toBeTruthy()` only | Weak assertions miss real bugs |

---

## Framework Conventions

Use the project's existing test framework. Match existing patterns for:
- File naming (`*.test.ts`, `*.spec.ts`)
- Directory structure (`__tests__/` or co-located)
- Setup/teardown patterns
- Mocking strategy
