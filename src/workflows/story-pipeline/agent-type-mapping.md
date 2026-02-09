# Agent Type Mapping - Hybrid Approach (v5.1)

This document defines the mapping between Pantheon pipeline roles and Claude Code's specialized agent types.

**Strategy:** Use the most capable Claude Code agent as the base, then layer our purpose-built persona on top.

## Builder Agents (Phase 2: BUILD)

| Story Type | Claude Code Agent | Pantheon Persona | Combined Power |
|------------|-------------------|-------------|----------------|
| React/Next.js components | `dev-frontend` | `builders/frontend-react.md` | Frontend expertise + Apollo persona |
| TypeScript APIs | `dev-typescript` | `builders/backend-typescript.md` | TS mastery + Hephaestus persona |
| Python backends | `dev-python` | `builders/backend-python.md` | Python expertise + Pythia persona |
| Go services | `dev-go` | `builders/backend-go.md` | Go mastery + Gopher persona |
| Database/Prisma | `database-administrator` | `builders/database-prisma.md` | DB expertise + Athena persona |
| Infrastructure | `engineer-deployment` | `builders/infrastructure.md` | DevOps + Atlas persona |
| General/Mixed | `general-purpose` | `builders/general.md` | Flexibility + Metis persona |

## Reviewer Agents (Phase 3: VERIFY)

| Review Type | Claude Code Agent | Pantheon Persona | Combined Power |
|-------------|-------------------|-------------|----------------|
| Security | `auditor-security` | `reviewers/security.md` | OWASP expertise + Cerberus persona |
| Architecture | `architect-reviewer` | `reviewers/architecture.md` | SOLID/patterns + Hestia persona |
| Performance | `optimizer-performance` | `reviewers/performance.md` | Perf optimization + Apollo persona |
| Test Quality | `testing-suite:test-engineer` | `validators/test-quality.md` | Test expertise + Nemesis persona |
| Accessibility | `accessibility-expert` | `reviewers/accessibility.md` | WCAG expertise + Iris persona |
| Code Quality | `general-purpose` | `reviewers/quality.md` | Flexibility + Arete persona |

## Validator Agents

| Validator | Claude Code Agent | Pantheon Persona | Combined Power |
|-----------|-------------------|-------------|----------------|
| Inspector (Argus) | `general-purpose` | `validators/inspector.md` | Task verification + evidence |
| Test Quality (Nemesis) | `testing-suite:test-engineer` | `validators/test-quality.md` | Test validation |

## Support Agents (Phase 4-7)

| Role | Claude Code Agent | Pantheon Persona | Combined Power |
|------|-------------------|-------------|----------------|
| Arbiter (Themis) | `general-purpose` | `support/arbiter.md` | Issue triage |
| Reflection+Report | `general-purpose` | `reflection-reporter.md` | Playbook updates + reporting |

## Multi-Reviewer (Consolidated Mode)

For trivial→standard complexity, use a single agent with all perspectives:

| Mode | Claude Code Agent | Pantheon Persona | Combined Power |
|------|-------------------|-------------|----------------|
| Consolidated | `architect-reviewer` | `multi-reviewer.md` | 4 perspectives in one pass |

## Persona Forge (Phase 1.5: FORGE)

| Role | Claude Code Agent | Pantheon Persona | Combined Power |
|------|-------------------|-------------|----------------|
| Pygmalion | `general-purpose` | `agents/pygmalion.md` | Domain analysis + specialist forging |

## Forged Specialists (Phase 3: VERIFY — dynamic)

Forged specialists are created on-the-fly by Pygmalion based on story domain analysis.
They use the same artifact format as Pantheon reviewers, so Themis triages them identically.

| Role | Claude Code Agent | Pantheon Persona | Combined Power |
|------|-------------------|-------------|----------------|
| *Dynamic* | `spec.suggested_claude_agent_type` | *Constructed from Pygmalion spec* | Domain-specific gap coverage |

**Examples of forged specialists:**
- Stripe Webhook Integrity → `auditor-security` + Pygmalion-generated checklist
- GraphQL Schema Design → `architect-reviewer` + Pygmalion-generated checklist
- OAuth 2.0 PKCE Flow → `auditor-security` + Pygmalion-generated checklist

## Agent Teams vs Task Sub-Agents

**All mappings in this file use Task sub-agents** (spawned via the `Task` tool), **not** TeammateTool teammates. This is an important distinction:

| Mechanism | Tool | Purpose | Works inside teammates? |
|-----------|------|---------|-------------------------|
| Task sub-agent | `Task(subagent_type: ...)` | Spawn a specialized worker for a pipeline phase | **Yes** — always works |
| Teammate | `TeammateTool` / `spawnTeam` | Spawn a peer in an Agent Teams swarm | **No** — cannot create nested teams |

When Heracles (a teammate) executes the pipeline, it uses **Task sub-agents** for every phase. The "no nested teams" restriction in Agent Teams does NOT prevent this. Task sub-agents are independent of Agent Teams and work in all contexts.

**Rule of thumb:** If you see `Task(subagent_type: ...)` in this file or in workflow.md, that's a regular sub-agent call that works everywhere — inside teammates, inside the main session, inside other sub-agents.

## Implementation Notes

1. **Always layer the persona** - Even when using specialized agents, include the Pantheon persona for:
   - Pipeline-specific output formats (JSON artifacts)
   - Story context and acceptance criteria
   - Issue classification (MUST_FIX/SHOULD_FIX/STYLE)

2. **Model selection** - Use `opus` for builders and reviewers, `sonnet` for synthesis tasks

3. **Fresh context** - Reviewers should have `fresh_context: true` to avoid builder bias
