# ADR-004: Dynamic Persona Forging (Pygmalion)

**Status:** Accepted
**Date:** 2025-09

## Context

The fixed Pantheon reviewers (Cerberus, Hestia, Argus, Nemesis) cover general concerns: security, architecture, task completion, test quality. But domain-specific expertise (e.g., Stripe API patterns, Next.js App Router conventions, PostgreSQL indexing strategies) requires specialist knowledge that generic reviewers lack.

Maintaining a large library of pre-built specialists is impractical — the domain space is too large and each project has unique technology combinations.

## Decision

Create Pygmalion, a meta-agent that dynamically forges domain-specific specialist reviewer personas at runtime:

1. Pygmalion analyzes the story's technology stack, file patterns, and domain keywords
2. Checks the specialist registry for existing specialists with matching domains (Jaccard similarity)
3. Either **reuses** (>= 0.5), **evolves** (0.3-0.49), or **forges new** (< 0.3) specialists
4. Forged specialists are stored in a persistent registry for cross-story reuse
5. Specialists augment (never replace) the fixed Pantheon reviewers

**Registry matching:** Jaccard similarity on domain keyword sets determines reuse vs new forging.

**Cost profile:**
- REUSE: ~2-3K tokens (registry lookup + minor adaptation)
- EVOLVE: ~5-8K tokens (modify existing specialist)
- FORGE_NEW: ~15-20K tokens (full domain analysis + persona generation)

## Consequences

**Easier:**
- Unlimited domain coverage without maintaining a specialist library
- Specialists improve over time through the registry
- Token cost amortizes: first story pays FORGE_NEW, subsequent stories pay REUSE
- Each project gets specialists tailored to its exact technology stack

**Harder:**
- Forging quality depends on Pygmalion's analysis (garbage in, garbage out)
- Registry can accumulate stale or low-quality specialists (mitigated: eviction policy)
- Prompt injection risk in forged personas (mitigated: output validation + whitelisting)
- Registry poisoning risk (mitigated: write locking + structural validation)
- Empty registry on first use means first batch run has higher token cost
