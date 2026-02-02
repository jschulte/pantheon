# Batch Review - Hardening Sweep Workflow

**Author:** Jonah Schulte (leveraging BMAD Method)
**Version:** 1.0.0

Deep code review and hardening workflow - run repeatedly until bulletproof.

## What It Does

Unlike `story-pipeline` (which implements new features), `batch-review` focuses purely on reviewing and hardening **existing** code. Run it multiple times until you achieve a clean pass.

**Perfect for:**
- Post-sprint hardening sweeps
- Pre-release security audits
- Finding bugs that slipped through initial review
- Targeted consistency checks
- Accessibility audits
- Performance optimization hunts

## Quick Start

```bash
# Review all stories in an epic
/batch-review epic=17

# Add focus for targeted review
/batch-review epic=17 focus="security vulnerabilities"

# Review specific paths
/batch-review path="src/api" focus="N+1 queries, performance"
```

## Focus Examples

The optional `focus` parameter tells reviewers to pay special attention to specific concerns:

| Focus | When to Use |
|-------|-------------|
| `"security vulnerabilities, auth bypass"` | Security audit |
| `"styling, UX, button placement"` | UX consistency check |
| `"WCAG AA, accessibility"` | Accessibility audit |
| `"N+1 queries, performance"` | Performance optimization |
| `"error handling, API consistency"` | Pattern consistency |
| `"test coverage, edge cases"` | Test quality improvement |

## Workflow Phases

```
SCOPE → REVIEW → ASSESS → FIX → VERIFY → REPORT
           ↑                      ↓
           └──────────────────────┘
           (loop until clean or max iterations)
```

1. **SCOPE** - Identify files to review
2. **REVIEW** - Deep multi-perspective analysis (+ focus if provided)
3. **ASSESS** - Triage findings (MUST_FIX/SHOULD_FIX/STYLE)
4. **FIX** - Resolve MUST_FIX issues
5. **VERIFY** - Confirm fixes, check for regressions
6. **REPORT** - Generate hardening summary

## Hardening Strategy

For maximum hardening, run multiple passes with different focuses:

| Pass | Focus | Purpose |
|------|-------|---------|
| 1 | (none) | Catch obvious issues |
| 2 | `"security"` | Deep security audit |
| 3 | `"accessibility"` | WCAG compliance |
| 4 | `"performance"` | Optimize bottlenecks |
| 5 | `"consistency"` | Unify patterns |

## Output

Each pass generates:
- `hardening/{{scope_id}}-review.json` - All findings
- `hardening/{{scope_id}}-triage.json` - Classified issues
- `hardening/{{scope_id}}-fixes.json` - Applied fixes
- `hardening/{{scope_id}}-report.md` - Human-readable summary
- `hardening/{{scope_id}}-history.json` - Multi-pass history

## Completion Criteria

A **clean pass** means:
- No MUST_FIX issues remaining
- All fixes verified
- Tests passing

You can (and should) run again with different focus to find other issue types.

## Agents

| Agent | Role |
|-------|------|
| Scope Analyzer | Identifies files to review |
| Deep Reviewer | Multi-perspective code analysis |
| Themis (Arbiter) | Triages findings |
| Issue Fixer | Applies minimal, targeted fixes |
| Verification Reviewer | Confirms fixes work |
| Hardening Reporter | Generates summary |

## Real-World Examples

### Security Hardening

```bash
/batch-review epic=17 focus="security vulnerabilities, auth bypass, injection"
```

**Findings (Pass 1):**
- SQL injection in user search (MUST_FIX)
- XSS in comment rendering (MUST_FIX)
- Auth token in localStorage (MUST_FIX)
- Missing rate limiting (MUST_FIX)
- Weak password validation (SHOULD_FIX)

**Result:** 4 security issues fixed, 1 logged as tech debt
**Time:** 90 minutes
**vs Manual Security Audit:** 1-2 weeks

### UX Consistency Sweep

```bash
/batch-review epic=17 focus="styling, button placement, context menus, visual consistency"
```

**Findings:**
- Button styles inconsistent (primary vs accent)
- Context menus positioned differently
- Modal close buttons on left vs right
- Loading states missing in 3 components

**Result:** Unified UX patterns across all 10 stories
**Time:** 2 hours
**vs Manual UX Review:** 3-5 days

### Performance Optimization

```bash
/batch-review path="src/api" focus="N+1 queries, caching, performance"
```

**Findings:**
- 5 N+1 query patterns in user relationships
- Missing database indexes
- No response caching on expensive queries
- Inefficient JSON parsing

**Result:** 40% API response time improvement
**Time:** 90 minutes
**vs Manual Performance Audit:** 1-2 weeks

### Accessibility Compliance

```bash
/batch-review path="src/components" focus="WCAG AA, keyboard nav, screen reader"
```

**Findings:**
- 15 missing aria-labels
- 8 components with poor focus management
- 3 color contrast violations
- No keyboard shortcuts for power users

**Result:** Full WCAG AA compliance
**Time:** 2.5 hours
**vs Manual A11y Audit:** 1 week + remediation

## Philosophy

> "The code works until it doesn't. Find the 'doesn't' before production does."

This workflow assumes bugs exist and systematically finds them. Each pass makes the code more robust, more secure, and more reliable.

## Why Run Multiple Passes?

Each pass with a different focus finds different issue types:

**Pass 1 (general):** Obvious bugs, missing null checks, basic issues
**Pass 2 (security):** Subtle vulnerabilities, auth edge cases, injection vectors
**Pass 3 (accessibility):** Screen reader issues, keyboard nav, WCAG
**Pass 4 (performance):** N+1s, caching opportunities, bottlenecks
**Pass 5 (consistency):** Pattern mismatches, naming inconsistencies

**Result:** Progressively more robust code with each iteration.
