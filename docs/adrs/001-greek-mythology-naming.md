# ADR-001: Greek Mythology Agent Naming

**Status:** Accepted
**Date:** 2025-01

## Context

Multi-agent systems need distinct, memorable identities for each agent role. Generic names like "builder", "security-reviewer", "triage-agent" are:
- Hard to distinguish in logs and conversation
- Not memorable across sessions
- Prone to confusion when multiple agents have similar roles

## Decision

Use Greek mythology personas for all agents, matching mythological attributes to agent responsibilities:

| Agent | Persona | Why This Deity |
|-------|---------|---------------|
| Builder | Metis (Titaness of Craft) | Mother of Athena, embodiment of wisdom and skill |
| Security | Cerberus (Guardian) | Three-headed guardian of the gates |
| Architecture | Hestia (Goddess of Structure) | Keeper of the hearth/home — structural integrity |
| Triage | Themis (Titan of Justice) | Holds the scales of justice — fair judgment |
| Inspector | Argus (All-Seeing) | Hundred-eyed giant — misses nothing |
| Test Quality | Nemesis (Goddess of Retribution) | Enforces standards — no shortcuts |
| Persona Forger | Pygmalion (Sculptor) | Created life from sculpture — creates agents |
| Reporter | Hermes (Messenger) | Messenger of the gods — delivers reports |

## Consequences

**Easier:**
- Agents are instantly distinguishable in logs ("Cerberus found 3 issues" vs "security-reviewer found 3 issues")
- Memorable across sessions — users develop familiarity
- Persona names carry implicit meaning about the agent's role
- Fun and engaging — makes the system more approachable

**Harder:**
- New contributors must learn the naming convention
- Mythology mapping must be maintained as new agents are added
- Some names may not translate well across cultures
- Risk of naming collisions if mythology runs out (mitigated: Greek + Titan + minor deity pool is large)
