# Pantheon Batch Review - Hardening Sweep

Deep code review and hardening workflow. Run repeatedly until bulletproof.

## Trigger

User says: "batch review", "harden", "deep review", "find bugs", "security sweep"

## Usage

```
# Default: find all bugs
@workspace /batch-review epic=17

# With focus guidance
@workspace /batch-review epic=17 focus="security vulnerabilities"
@workspace /batch-review path="src/components" focus="accessibility"
```

## Workflow

```
SCOPE → REVIEW → ASSESS → FIX → VERIFY → REPORT
           ↑_____________________|
           (loop until clean)
```

## Focus Examples

| Focus | Purpose |
|-------|---------|
| `"security vulnerabilities"` | Security audit |
| `"styling, UX, button placement"` | UX consistency |
| `"accessibility, WCAG AA"` | Accessibility audit |
| `"N+1 queries, performance"` | Performance hunt |
| `"error handling consistency"` | Pattern consistency |

## Phases

### Phase 1: SCOPE
Parse input and identify files to review.

### Phase 2: REVIEW
Deep multi-perspective analysis:
- **Security** 🔐 - Injection, auth, secrets
- **Correctness** ⚡ - Logic, edge cases, null handling
- **Architecture** 🏛️ - Patterns, coupling, integration
- **Tests** 🧪 - Coverage, quality, gaps
- **Accessibility** 🌈 - WCAG, keyboard, screen reader

If focus provided, emphasize those concerns.

### Phase 3: ASSESS
Triage findings:
- **MUST_FIX** - Real issues (80-95%)
- **SHOULD_FIX** - Large refactors (5-15%)
- **STYLE** - Manufactured only (<10%)

### Phase 4: FIX
Fix MUST_FIX issues with minimal, targeted changes.

### Phase 5: VERIFY
Run tests, check for regressions.
Loop back if new issues found.

### Phase 6: REPORT
Generate summary:
- Issues found/fixed
- Remaining tech debt
- Recommendations

## Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ HARDENING COMPLETE: epic-17-pass-1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 This Pass:
   • Files Reviewed: 25
   • Issues Found: 12
   • Issues Fixed: 10
   • Focus: "security vulnerabilities"

✅ Clean pass! Run again with different focus.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Hardening Strategy

For maximum hardening, run multiple passes:

1. **Pass 1:** (none) - Catch obvious issues
2. **Pass 2:** `"security"` - Deep security audit
3. **Pass 3:** `"accessibility"` - WCAG compliance
4. **Pass 4:** `"performance"` - Optimize bottlenecks
5. **Pass 5:** `"consistency"` - Unify patterns

## Artifacts

Saved to `{{sprint_artifacts}}/hardening/`:
- `{{scope_id}}-review.json` - All findings
- `{{scope_id}}-triage.json` - Classified issues
- `{{scope_id}}-fixes.json` - Applied fixes
- `{{scope_id}}-report.md` - Summary
- `{{scope_id}}-history.json` - Multi-pass tracking

## Related Skills

- `pantheon-pipeline` - Implement new stories
- `pantheon-inspector` - Verify implementations
- `pantheon-security` - Security-focused review
