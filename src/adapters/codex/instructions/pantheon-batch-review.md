# Pantheon - Batch Review Instructions (Codex)

Deep code review and hardening workflow. Run repeatedly until bulletproof.

## Overview

Unlike story-pipeline (which implements new features), batch-review focuses on:
- Finding bugs that slipped through initial review
- Security vulnerabilities
- Consistency issues
- Accessibility gaps
- Performance problems

## Usage

```
# Default: find all bugs
batch-review epic=17

# With focus guidance
batch-review epic=17 focus="security vulnerabilities"
batch-review path="src/components" focus="accessibility, WCAG AA"
```

## Workflow Phases

```
SCOPE → REVIEW → ASSESS → FIX → VERIFY → REPORT
           ↑_____________________|
           (loop until clean)
```

---

## Phase 1: SCOPE

**You perform directly.**

1. Parse input (epic, stories, or path)
2. Identify all files to review
3. Categorize by type (frontend, backend, database)
4. Extract focus guidance if provided

### Scope Sources

| Input | How to Find Files |
|-------|-------------------|
| `epic=17` | Find all stories in `docs/stories/epic-17/`, extract file patterns |
| `stories="17-1,17-2"` | Find specific stories, extract file patterns |
| `path="src/api"` | Use path directly |

### Focus Handling

If user provides `focus="..."`:
```
FOCUS_PROMPT = user's focus text
FOCUS_ENABLED = true
```

Inject into all review prompts:
```
**SPECIAL FOCUS REQUESTED:**
{{FOCUS_PROMPT}}
```

---

## Phase 2: REVIEW

**Adopt the Review Council persona.**

Review from 5 perspectives:

### Security (Cerberus) 🔐
- SQL/NoSQL injection
- XSS (stored, reflected, DOM)
- Authentication bypass
- Authorization flaws
- Secrets exposure
- CSRF, session issues
- Input validation gaps

### Correctness (Apollo) ⚡
- Logic errors, off-by-one
- Null/undefined handling
- Edge cases (empty, zero, negative)
- Race conditions
- Error handling gaps
- State management bugs

### Architecture (Hestia) 🏛️
- Pattern violations
- Coupling issues
- API contract mismatches
- Integration problems

### Test Quality (Nemesis) 🧪
- Missing test cases
- Untested branches
- Flaky test patterns
- Integration test gaps

### Accessibility (Iris) 🌈 - For Frontend
- WCAG AA compliance
- Keyboard navigation
- Screen reader support
- Focus management

### Output

```json
{
  "issues": [
    {
      "id": "scope-001",
      "perspective": "security",
      "severity": "high",
      "file": "src/api/users/route.ts",
      "line": 45,
      "title": "SQL injection",
      "description": "User ID interpolated into SQL",
      "suggested_fix": "Use parameterized query",
      "classification": "MUST_FIX"
    }
  ]
}
```

---

## Phase 3: ASSESS

**Adopt the Themis persona.**

Triage findings:

| Classification | Meaning | Percentage |
|----------------|---------|------------|
| **MUST_FIX** | Real issues | 80-95% |
| **SHOULD_FIX** | Large refactors | 5-15% |
| **STYLE** | Manufactured only | <10% |

**Rule:** If it's a real issue → MUST_FIX

---

## Phase 4: FIX

**Adopt the Mender persona.**

For each MUST_FIX issue:

1. Read file, understand context
2. Apply minimal fix
3. Run tests
4. Document change

### Guidelines

✅ Do:
- Fix the specific issue
- Run tests after each fix
- Add test if missing
- Keep diff minimal

❌ Don't:
- Refactor unrelated code
- Change coding style
- Add features

---

## Phase 5: VERIFY

1. Run full test suite: `npm test`
2. Check for regressions
3. Verify each fix resolved its issue

If new issues found → loop back to Phase 4

---

## Phase 6: REPORT

Generate summary:

```markdown
# Hardening Report: {{scope_id}}

## Summary
| Metric | Value |
|--------|-------|
| Files Reviewed | 25 |
| Issues Found | 12 |
| MUST_FIX | 10 |
| Fixed | 10 |
| Status | CLEAN |

## Focus Area
User Guidance: {{FOCUS_PROMPT}}

## Fixed Issues
1. [MF-001] SQL injection in users route
2. [MF-002] Missing null check...

## Remaining Tech Debt
- [SF-001] Consider refactoring...

## Next Steps
✅ Clean pass achieved.
```

---

## Hardening Strategy

For maximum hardening, run multiple passes:

| Pass | Focus | Purpose |
|------|-------|---------|
| 1 | (none) | Obvious issues |
| 2 | security | Deep security audit |
| 3 | accessibility | WCAG compliance |
| 4 | performance | Optimize |
| 5 | consistency | Unify patterns |

---

## Focus Examples

```
focus="security vulnerabilities, auth bypass, injection"
focus="styling, UX, button placement, context menus"
focus="WCAG AA, keyboard navigation, screen reader"
focus="N+1 queries, caching, performance"
focus="error handling, API response consistency"
focus="test coverage, edge cases, error conditions"
```

---

## Artifacts

Save to `{{sprint_artifacts}}/hardening/`:
- `{{scope_id}}-scope.json`
- `{{scope_id}}-review.json`
- `{{scope_id}}-triage.json`
- `{{scope_id}}-fixes.json`
- `{{scope_id}}-report.md`
- `{{scope_id}}-history.json`
