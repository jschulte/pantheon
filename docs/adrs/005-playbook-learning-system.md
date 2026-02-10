# ADR-005: Playbook Learning System

**Status:** Accepted
**Date:** 2025-11

## Context

The same types of issues recur across stories: missing null checks in API handlers, forgotten aria-labels on interactive elements, N+1 queries in list endpoints. Without institutional memory, each story starts from zero — the builder makes the same mistakes and reviewers catch the same issues repeatedly.

## Decision

Implement a playbook learning system that captures patterns from review findings and feeds them back to builders in future stories:

1. **Phase 1 PREPARE:** Load relevant playbooks based on domain overlap and file patterns
2. **Phase 4 ASSESS:** Track playbook hit-rate (did following the playbook prevent issues?)
3. **Phase 7 REFLECT:** Mnemosyne extracts learnings from review findings, updates or creates playbooks

**Playbook lifecycle:**
- Created when a new domain pattern emerges from review findings
- Updated via compaction protocol (merge overlaps, replace stale, add novel)
- Scored by hit-rate (did the playbook help? did the builder follow it?)
- Evicted when stale (unused for 90+ days) or corpus exceeds cap

**Token budget:** Playbooks loaded under a 7,500-token budget per story, scored by relevance.

**Compaction protocol:** Playbooks are REPLACED (Write tool), not APPENDED (Edit tool), to prevent unbounded growth. Target size: 3-10KB per playbook.

## Consequences

**Easier:**
- System learns from its own mistakes over time
- Builders receive relevant guidance before writing code
- Hit-rate tracking provides signal on which playbooks are actually useful
- Compaction prevents playbook bloat
- Token budget prevents context window overload

**Harder:**
- Playbook quality depends on Mnemosyne's extraction ability
- Hit-rate metric is a coarse heuristic (domain relevance check helps but isn't perfect)
- Concurrent writes in swarm mode require locking protocol
- First few stories have no playbooks — learning curve before value appears
- Risk of playbooks encoding bad patterns if review findings were wrong
