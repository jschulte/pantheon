# Batch Review - Hardening Sweep Workflow

**Purpose:** Deep code review and hardening with swarm parallelism + Pygmalion persona forging

---

## Overview

This workflow performs deep code review on existing implementations to find and fix issues that may have been missed. Unlike story-pipeline (which implements new stories), batch-review focuses purely on reviewing and hardening existing code.

**Key Features:**
- **Repeatable** - Run multiple times; each pass finds deeper issues
- **Focus-able** - Provide guidance to target specific concerns
- **Comprehensive** - Multi-perspective review from security, correctness, architecture, tests
- **Action-oriented** - Finds issues AND fixes them
- **Swarm Parallel** (v2.0) - Reviewers, fixers, and verifiers run as parallel swarm teammates
- **Pygmalion Forging** (v2.0) - Domain-specific specialist reviewers forged on-the-fly

---

## Usage Examples

```bash
# Review all stories in an epic (default: find all bugs)
/batch-review epic=17

# Review specific stories with focus guidance
/batch-review stories="17-1,17-2,17-3" focus="styling, UX, button placement"

# Review specific paths
/batch-review path="src/components" focus="accessibility compliance"

# Security sweep
/batch-review epic=17 focus="security vulnerabilities, auth bypass, injection"

# Consistency sweep
/batch-review epic=17 focus="error handling patterns, consistent API responses"

# Performance sweep
/batch-review path="src/api" focus="N+1 queries, caching opportunities, slow operations"
```

---

## Phases

```
Phase 1: SCOPE ─────────────────────────────────────────
         Analyze scope, identify files to review
         ↓
Phase 1.5: FORGE (Pygmalion) ───────────────────────────
         Forge domain-specific specialist personas (if enabled)
         ↓
Phase 2: REVIEW ────────────────────────────────────────
         Multi-perspective review (swarm: parallel workers)
         ↓
Phase 3: ASSESS ────────────────────────────────────────
         Themis triages + deduplicates findings
         ↓
Phase 4: FIX ───────────────────────────────────────────
         Category-partitioned fixers (swarm: parallel workers)
         ↓
Phase 5: VERIFY ────────────────────────────────────────
         Independent fix verification (swarm: parallel workers)
         ↓
         ↓ (loop if new issues found, max iterations)
         ↓
Phase 6: REPORT ────────────────────────────────────────
         Generate hardening summary + cleanup swarm
```

---

## Phase Routing

Load phases on-demand from the `phases/` directory.

| # | Phase | File | Condition | ~Lines |
|---|-------|------|-----------|--------|
| 1 | Scope | phases/phase-1-scope.md | Always | 112 |
| 1.5 | Forge | phases/phase-1.5-forge.md | persona_forging.enabled | 104 |
| 2 | Review | phases/phase-2-review.md | Always | 188 |
| 3 | Assess | phases/phase-3-assess.md | Always | 84 |
| 4 | Fix | phases/phase-4-fix.md | MUST_FIX issues exist | 103 |
| 5 | Verify | phases/phase-5-verify.md | fixes applied | 104 |
| 6 | Report | phases/phase-6-report.md | Always | 184 |

**Execution flow:**
1. Always load `phases/phase-1-scope.md` first
2. If persona forging enabled, load `phases/phase-1.5-forge.md`
3. Load `phases/phase-2-review.md` for multi-perspective review
4. Load `phases/phase-3-assess.md` for Themis triage
5. If MUST_FIX issues exist:
   a. Load `phases/phase-4-fix.md`
   b. Load `phases/phase-5-verify.md`
   c. Loop back to (a) if new issues found (max iterations)
6. If no MUST_FIX issues, skip directly to step 7
7. Always load `phases/phase-6-report.md` last

---

## Focus Examples

**Default (no focus):** Standard multi-perspective review
```
/batch-review epic=17
```

**UX/Styling Focus:**
```
/batch-review epic=17 focus="styling, UX, button placement, context menus, visual consistency"
```

**Security Sweep:**
```
/batch-review epic=17 focus="security vulnerabilities, authentication, authorization, input validation, secrets"
```

**Accessibility Audit:**
```
/batch-review path="src/components" focus="WCAG AA compliance, keyboard navigation, screen reader, focus management"
```

**Performance Hunt:**
```
/batch-review path="src/api" focus="N+1 queries, caching, database performance, slow operations, memory leaks"
```

**Consistency Check:**
```
/batch-review epic=17 focus="error handling patterns, API response formats, naming conventions, code style"
```

**Test Coverage:**
```
/batch-review epic=17 focus="missing tests, edge cases, error conditions, integration tests"
```

---

## Hardening Strategy

For maximum hardening, run multiple passes with different focuses:

1. **Pass 1:** Default (all perspectives) - catch obvious issues
2. **Pass 2:** Security focus - deep security audit
3. **Pass 3:** Accessibility focus - ensure compliance
4. **Pass 4:** Performance focus - optimize
5. **Pass 5:** Consistency focus - unify patterns

Each pass builds on the previous, resulting in thoroughly hardened code.

---

## Version History

**v2.1.1 - Modular Phase Split**
1. Split monolithic workflow.md into hub + 7 phase files in `phases/` directory
2. On-demand phase loading reduces context window usage
3. No behavioral changes — content preserved exactly

**v2.1.0 - Specialist Registry Edition**
1. Phase 1.5 FORGE: Pygmalion now checks specialist registry before forging
2. Jaccard similarity matching: REUSE (>=0.5), EVOLVE (0.3-0.49), FORGE_NEW (<0.3)
3. Registry writes handled by orchestrator after Pygmalion output
4. Token savings from reusing previously forged specialists across reviews

**v2.0.0 - Swarm + Pygmalion Edition**
1. Phase 1.5 FORGE: Pygmalion forges domain-specific specialist personas
2. Phase 2 REVIEW: Parallel review workers (Dike) via TeammateTool swarm
3. Phase 3 ASSESS: Themis deduplicates findings from multiple parallel reviewers
4. Phase 4 FIX: Parallel category fixers (Asclepius) with non-overlapping file sets
5. Phase 5 VERIFY: Parallel verification workers (Aletheia)
6. Phase 6 REPORT: Swarm cleanup added
7. Sequential fallback mode preserved for environments without swarm support
8. Forged specialist reviewers integrated alongside Pantheon perspectives

**v1.0.0 - Initial Release**
- Sequential deep review with single multi-perspective reviewer
- Themis triage
- Category-based sequential fixing
- Verification and iteration loop
- Hardening report generation
