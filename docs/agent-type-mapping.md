# Agent Type Mapping - Hybrid Architecture

## Overview

Pantheon v5.1+ uses a **hybrid approach** that maps BMAD agent roles to Claude Code native agents while layering specialized personas on top.

This document explains:
- How builder selection works (dynamic routing)
- How reviewers are mapped (role-based routing)
- Why each mapping was chosen
- Platform compatibility notes

---

## Architecture Layers

```
Story Requirements
       ↓
[1] BMAD Agent Routing Logic
       ├─ Analyzes story content (files, keywords)
       ├─ Determines builder type (frontend-react, backend-typescript, etc.)
       └─ Determines reviewer needs (security, architecture, etc.)
       ↓
[2] Claude Code Native Agent Selection
       ├─ Maps builder type → native agent (dev-frontend, dev-typescript, etc.)
       ├─ Maps reviewer role → native agent (auditor-security, architect-reviewer, etc.)
       └─ Spawns Task with appropriate subagent_type
       ↓
[3] BMAD Persona Prompt Layer
       ├─ Injects Greek Pantheon persona (Metis, Cerberus, etc.)
       ├─ Adds BMAD-specific directives (TDD, evidence-based, triage rules)
       └─ Includes playbook knowledge and project patterns
       ↓
Native Agent + Persona Execute Task
       ↓
Structured Artifacts (JSON/Markdown)
```

---

## Builder Mapping

### Routing Configuration

Defined in `_pantheon/agent-routing.yaml`:

```yaml
builder_routing:
  - id: frontend-react
    native_agent: dev-frontend
    bmad_persona: builders/frontend-react.md
    match_patterns:
      files: ["app/**/*.tsx", "components/**", "src/pages/**"]
      keywords: ["component", "UI", "React", "Next.js"]
      package_json: ["react", "next"]

  - id: backend-typescript
    native_agent: dev-typescript
    bmad_persona: builders/backend-typescript.md
    match_patterns:
      files: ["app/api/**", "src/services/**", "*.route.ts"]
      keywords: ["API", "endpoint", "service", "backend"]
      package_json: ["express", "fastify", "hono"]

  - id: backend-python
    native_agent: dev-python
    bmad_persona: builders/backend-python.md
    match_patterns:
      files: ["**/*.py", "main.py", "app.py"]
      keywords: ["FastAPI", "Django", "Flask"]

  - id: database-prisma
    native_agent: database-administrator
    bmad_persona: builders/database-prisma.md
    match_patterns:
      files: ["prisma/schema.prisma", "prisma/migrations/**"]
      keywords: ["migration", "schema", "database"]

  - id: infrastructure
    native_agent: engineer-deployment
    bmad_persona: builders/infrastructure.md
    match_patterns:
      files: ["Dockerfile", ".github/workflows/**", "terraform/**"]
      keywords: ["CI/CD", "deployment", "Docker", "Kubernetes"]

  - id: general
    native_agent: general-purpose
    bmad_persona: builders/general.md
    match_patterns: [] # Fallback for unclear stories
```

### Matching Algorithm

**Priority order:**

1. **Explicit builder in story metadata**
   ```markdown
   builder: backend-typescript
   ```

2. **File pattern matching**
   - Extract file references from story tasks
   - Match against `match_patterns.files` (glob patterns)
   - First match wins

3. **Keyword detection**
   - Scan story title and tasks for keywords
   - Match against `match_patterns.keywords`
   - Weight by keyword frequency

4. **Package.json inference**
   - Read project's package.json dependencies
   - Match against `match_patterns.package_json`
   - Used as confirmation signal

5. **Fallback to general**
   - If no clear match, use general-purpose builder
   - Metis persona (wise generalist)

### Native Agent Capabilities

| Builder Type | Native Agent | Why This Mapping |
|--------------|--------------|------------------|
| frontend-react | `dev-frontend` | React/Next.js component patterns, hooks, routing |
| frontend-vue | `dev-frontend` | Vue composition API, Nuxt patterns |
| backend-typescript | `dev-typescript` | TypeScript API development, Express/Fastify |
| backend-python | `dev-python` | Python idioms, FastAPI/Django patterns |
| backend-go | `dev-go` | Go concurrency, standard library |
| database-prisma | `database-administrator` | SQL optimization, schema design |
| infrastructure | `engineer-deployment` | Docker, CI/CD, cloud platforms |
| general | `general-purpose` | Flexible, no domain assumptions |

---

## Reviewer Mapping

### Role-Based Routing

Defined in `workflow.yaml`:

```yaml
reviewer:
  subagent_type_by_role:
    security: "auditor-security"        # OWASP Top 10 expertise
    architecture: "architect-reviewer"  # SOLID, design patterns
    performance: "optimizer-performance" # Profiling, bottlenecks
    accessibility: "accessibility-expert" # WCAG 2.1 guidelines
    test_quality: "testing-suite:test-engineer"      # Test patterns, coverage
    inspector: "general-purpose"        # No specialized inspector
```

### Reviewer Personas

Each reviewer gets a Greek Pantheon persona prompt:

| Role | Native Agent | BMAD Persona | Focus |
|------|--------------|--------------|-------|
| Security | `auditor-security` | **Cerberus** 🔐 | SQL injection, XSS, auth bypass |
| Architecture | `architect-reviewer` | **Hestia** 🏛️ | SOLID, coupling, patterns |
| Performance | `optimizer-performance` | **Apollo** ⚡ | N+1 queries, bottlenecks |
| Accessibility | `accessibility-expert` | **Iris** 🌈 | ARIA, keyboard nav, screen readers |
| Test Quality | `testing-suite:test-engineer` | **Nemesis** 🧪 | Edge cases, assertions |
| Inspector | `general-purpose` | **Argus** 👁️ | Evidence-based verification |

### Why These Mappings?

**Security → auditor-security**
- Native agent has OWASP knowledge, pen-testing patterns
- Cerberus persona adds "nothing unsafe passes" discipline
- Issues classified as MUST_FIX by default

**Architecture → architect-reviewer**
- Native agent knows SOLID, design patterns, anti-patterns
- Hestia persona focuses on "solid foundation" philosophy
- Reviews integration points, coupling, structure

**Performance → optimizer-performance**
- Native agent has profiling tools, algorithmic knowledge
- Apollo persona "illuminates" hidden bottlenecks
- Looks for N+1, missing indexes, unbounded loops

**Accessibility → accessibility-expert**
- Native agent knows WCAG 2.1, ARIA patterns
- Iris persona "bridges realms" (sighted/non-sighted users)
- Conditional (only spawns for UI components)

**Test Quality → testing-suite:test-engineer**
- Native agent specializes in test strategy and quality assessment
- Nemesis persona demands "balance" (happy + edge cases)
- Validates test meaningfulness, not just coverage numbers
- Reviews for edge cases, error conditions, determinism

**Inspector → general-purpose**
- No specialized inspector in Claude Code
- Argus persona provides "100-eyed" systematic verification
- Requires file:line citations for all tasks

---

## Complexity-Based Scaling

Number of reviewers scales with story complexity:

| Complexity | Agents | Personas |
|------------|--------|----------|
| trivial | 1 | Argus |
| micro | 2 | Argus, Hestia |
| light | 3 | Argus, Nemesis, Hestia |
| standard | 4 | Argus, Nemesis, Cerberus, Hestia |
| complex | 5 | Argus, Nemesis, Cerberus, Apollo, Hestia |
| critical | 6 | Argus, Nemesis, Cerberus, Apollo, Hestia, Arete |

**Token Optimization:**
- trivial/micro/light/standard → Use consolidated multi-reviewer (60-70% token savings)
- complex/critical → Use parallel specialized reviewers (thoroughness > efficiency)

---

## Platform Detection

### Auto-Detection

When workflow starts:
```bash
# Check if running on Claude Code
if command -v claude-code &> /dev/null; then
  PLATFORM="claude-code"
  USE_NATIVE_AGENTS=true
else
  PLATFORM="unknown"
  USE_NATIVE_AGENTS=false
fi
```

### Fallback Strategy

If native agents unavailable:
1. Use `general-purpose` for all roles
2. Load full BMAD agent definitions from `src/agents/`
3. Trade specialization for compatibility

---

## Benefits of Hybrid Approach

### What BMAD Adds to Claude Code

✓ **Multi-agent orchestration** - Parallel reviewer squads
✓ **Quality gates** - Coverage thresholds, evidence requirements
✓ **Systematic triage** - Themis prevents bikeshedding
✓ **Continuous learning** - Playbook system captures patterns
✓ **Enterprise features** - Rally integration, workstream planning
✓ **Workflow discipline** - 7-phase verification process

### What Claude Code Adds to BMAD

✓ **Domain expertise** - React, security, performance knowledge
✓ **Platform optimization** - Native integrations, efficient context
✓ **Specialized tools** - Built-in profilers, test frameworks
✓ **Continuous updates** - Agent capabilities improve over time
✓ **Zero configuration** - Works out of the box

---

## Migration Path

### From Pure BMAD (v5.0) to Hybrid (v5.1)

**Before (v5.0):**
```yaml
BUILDER_TASK = Task({
  subagent_type: "general-purpose",
  prompt: `[Full custom Metis definition]`
})
```

**After (v5.1):**
```yaml
# Determine native agent based on story content
NATIVE_AGENT = route_builder(story) # → "dev-frontend"

BUILDER_TASK = Task({
  subagent_type: NATIVE_AGENT,
  prompt: `
    <agent_persona>
    [Lightweight Metis persona - adds TDD discipline]
    </agent_persona>
    [Story content and requirements]
  `
})
```

**Changes required:**
1. Update workflow.md builder spawn (line ~445)
2. Update workflow.md reviewer spawns (lines ~617, 654, 684, etc.)
3. Add agent-routing.yaml configuration
4. Keep persona files lightweight (guidance, not full definitions)

---

## Testing Agent Mapping

### Verify Builder Selection

```bash
# Test frontend detection
echo "Task: Update app/components/Button.tsx" > test-story.md
/story-pipeline story_key=test-1
# Should select: dev-frontend + frontend-react persona

# Test backend detection
echo "Task: Add GET /api/users endpoint" > test-story.md
/story-pipeline story_key=test-2
# Should select: dev-typescript + backend-typescript persona
```

### Verify Reviewer Selection

```bash
# Complex story → parallel reviewers
echo "16+ tasks with 'payment' keyword" > test-story.md
/story-pipeline story_key=test-3
# Should spawn: auditor-security, architect-reviewer, optimizer-performance, etc.

# Micro story → consolidated review
echo "1 task, static page" > test-story.md
/story-pipeline story_key=test-4
# Should spawn: single multi-reviewer agent
```

---

## Future Enhancements

### Planned Improvements

1. **ML-based builder selection**
   - Train model on past story → builder mappings
   - Improve accuracy beyond keyword matching

2. **Dynamic reviewer composition**
   - AI suggests which reviewers needed
   - Based on file diff complexity analysis

3. **Platform-specific optimizations**
   - Different agent mappings for Cursor vs Windsurf
   - Leverage platform-unique capabilities

4. **Performance telemetry**
   - Track agent effectiveness by type
   - A/B test mappings for optimization

---

## Troubleshooting

### "Native agent not found" errors

**Cause:** Running on platform without Claude Code native agents

**Fix:**
```yaml
# In workflow.yaml, set fallback:
fallback_subagent: "general-purpose"
```

### Builder selection incorrect

**Cause:** Story has ambiguous signals (both frontend and backend files)

**Fix:**
```markdown
<!-- In story metadata -->
builder: backend-typescript
```

### Reviewers not spawning in parallel

**Cause:** Using consolidated review mode (by design for simple stories)

**Fix:** Increase complexity or add critical keywords:
```markdown
keywords: security, authentication
```

---

## Related Documentation

- `src/workflows/story-pipeline/workflow.yaml` - Full agent configuration
- `src/workflows/story-pipeline/workflow.md` - Workflow implementation
- `_pantheon/agent-routing.yaml` - Builder routing rules
- `src/agents/builders/*.md` - Persona definitions
- `README.md` - Hybrid architecture overview
