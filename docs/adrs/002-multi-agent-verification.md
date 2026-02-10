# ADR-002: Multi-Agent Independent Verification

**Status:** Accepted
**Date:** 2025-01

## Context

Single-agent code review has a fundamental flaw: the same context that generated the code also reviews it. The agent is biased toward confirming its own work. This is analogous to a developer reviewing their own pull request.

## Decision

Enforce a strict separation between building and reviewing:

1. **Builder agent (Metis)** writes the implementation in its own context
2. **Reviewer agents (Cerberus, Hestia, Argus, Nemesis, etc.)** review in separate, fresh contexts
3. Reviewers receive only the code diff and story requirements — never the builder's reasoning
4. This creates a **blind reviewer pattern** where reviewers form independent judgments

The builder and reviewers never share a context window. This is enforced by spawning reviewers as separate Task agents with `fresh_context: true`.

## Consequences

**Easier:**
- Catches issues that self-review would miss (confirmation bias eliminated)
- Each reviewer specializes in one domain (security, architecture, testing)
- Parallel execution — reviewers run simultaneously
- Independent findings can be cross-referenced for conflicts

**Harder:**
- Higher token cost (3-6x vs single-agent review)
- Requires orchestration logic to manage multiple agents
- Platform adapters that can't spawn multiple agents lose this benefit (see Codex "degraded mode")
- Reviewers may lack context about _why_ certain decisions were made (mitigated: structural digest provides architecture context without builder reasoning)
