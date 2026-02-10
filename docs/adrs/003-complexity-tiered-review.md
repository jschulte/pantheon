# ADR-003: Complexity-Tiered Review Depth

**Status:** Accepted
**Date:** 2025-06

## Context

Running 6 parallel reviewers on a README typo fix wastes tokens. Running only 1 reviewer on a payment processing implementation is dangerous. Review depth should match story risk.

## Decision

Implement a 6-tier complexity system that scales review depth based on story characteristics:

| Tier | Tasks | Review Mode | Agents | Forging |
|------|-------|-------------|--------|---------|
| trivial | 0-1 | consolidated | 1 | skip |
| micro | 2 | consolidated | 2 | skip |
| light | 3-4 | consolidated | 3 | conditional (max 1) |
| standard | 5-10 | consolidated | 4 | conditional (max 2) |
| complex | 11-15 | parallel | 5 | always (max 3) |
| critical | 16+ | parallel | 6 | aggressive (max 4) |

Complexity is determined by:
1. **Task count** (primary signal)
2. **Risk keywords** (auth, security, payment promote +2 tiers)
3. **File patterns** (API endpoints, database migrations promote +1 tier)

Below complex tier, a single "multi-reviewer" agent adopts all perspectives sequentially (consolidated mode), saving 60-70% of tokens vs parallel spawning.

## Consequences

**Easier:**
- Token cost scales with risk (trivial stories cost ~10% of critical stories)
- No manual configuration needed — complexity is auto-detected
- Risk keywords catch stories that might be small but dangerous
- Consolidated mode provides good-enough review for most stories

**Harder:**
- Keyword matching is a coarse heuristic ("authentication documentation" scores high)
- Consolidated mode loses true independence (same agent, different perspectives)
- Tier boundaries are somewhat arbitrary (is 10 tasks really different from 11?)
- Risk promotion can over-classify simple stories that mention security in passing
