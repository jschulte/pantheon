# Story Pipeline

Enhanced multi-agent pipeline featuring the Greek Pantheon: Metis (builder), Argus (inspector), Nemesis (test quality), specialized reviewers (Cerberus, Apollo, Hestia, Arete, Iris), Themis (arbiter for triage), and Hermes (reflection + reporting).

## What's New in v7.4

### v7.0: Pygmalion Persona Forging
- Domain-specific specialist reviewers forged on-the-fly based on story context
- Replaces static reviewer selection with dynamically crafted expert personas

### v7.2: Specialist Registry
- Reuse and evolve previously forged specialists across stories
- Jaccard similarity matching to find the best existing specialist before forging new ones

### v7.3: Phase File Split
- Separate .md files per phase (75% context reduction vs monolithic workflow)
- User-configurable reviewer count for flexible review depth

### v7.4: Playbook Intelligence
- Compaction protocol targeting 3-10KB per playbook
- Structured `_index.json` for fast lookups without loading full playbook content
- Token budget loading to stay within context limits
- Hit-rate tracking to measure and improve playbook relevance

## Previous Changes (v6.1)

### 1. Combined Hermes Agent
**Token Savings: ~5-8K per story**

- Phase 7 now uses a single combined agent for reflection AND reporting
- Both roles read the same artifacts - combining them eliminates duplicate context loading
- Produces same outputs: playbook updates + completion report + TL;DR for batch aggregation

### 2. Consolidated Multi-Reviewer Option
**Token Savings: ~60-70% on Phase 3 for simpler stories**

- New Multi-Reviewer agent covers all 4 perspectives (Argus, Nemesis, Cerberus, Hestia) in one pass
- Used for trivial → standard complexity (1-10 tasks)
- Parallel reviewers still used for complex/critical (11+ tasks) where independence matters

### 3. Complexity-Based Review Routing
**Smart routing based on story complexity**

| Complexity | Review Mode | Token Impact |
|------------|-------------|--------------|
| trivial → standard | Consolidated (Multi-Reviewer) | ~60-70% savings |
| complex → critical | Parallel (separate agents) | Maximum independence |

## Previous Changes

### Resume Builder (v3.2+)

### 1. Resume Builder (v3.2+)
**Token Efficiency: 50-70% savings**

- Phase 3 now RESUMES Builder agent with review findings
- Builder already has full codebase context
- More efficient than spawning fresh Fixer agent

### 2. Inspector Code Citations (v4.0)
**Evidence-Based Verification**

- Inspector must map EVERY task to file:line citations
- Example: "Create component" → "src/Component.tsx:45-67"
- No more "trust me, it works" - requires proof
- Returns structured JSON with code evidence per task

### 3. Remove Hospital-Grade Framing (v4.0)
**Focus on Concrete Verification**

- Dropped psychological appeal language
- Kept rigorous verification gates and bash checks
- Replaced with patterns/verification.md + patterns/tdd.md

### 4. Micro Stories Get Security Scan (v4.0)
**Even Simple Stories Need Security**

- No longer skip ALL review for micro stories
- Still get 2 reviewers: Security + Architect
- Lightweight but catches critical vulnerabilities

### 5. Test Quality Agent + Coverage Gate (v4.0)
**Validate Test Completeness**

- New Test Quality Agent validates:
  - Edge cases covered (null, empty, invalid)
  - Error conditions tested
  - Meaningful assertions (not just "doesn't crash")
  - No flaky tests (random data, timing)
- Automated Coverage Gate enforces 80% threshold
- Builder must fix test gaps before proceeding

### 6. Playbook Learning System (v4.0)
**Continuous Improvement Through Reflection**

- **Phase 0:** Query playbooks before implementation
- Builder gets relevant patterns/gotchas upfront
- **Phase 6:** Reflection agent extracts learnings
- Auto-generates playbook updates for future agents
- Bootstrap mode: auto-initializes playbooks if missing

## Pipeline Flow - 7 Named Phases

```
Phase 1:   PREPARE ────────────────────────────────────
           Story quality gate + playbook query
           ↓
Phase 1.5: FORGE (Pygmalion) ──────────────────────────
           Forge domain-specific specialist reviewers
           ↓
Phase 2:   BUILD ──────────────────────────────────────
           🔨 Metis (initial implementation with TDD)
           ↓
Phase 3:   VERIFY ─────────────────────────────────────
           👁️ Argus + 🧪 Nemesis + Reviewers (parallel)
           ↓
Phase 4:   ASSESS ─────────────────────────────────────
           Coverage gate + ⚖️ Themis triages issues
           ↓
Phase 5:   REFINE ─────────────────────────────────────
           🔨 Metis fixes MUST_FIX (iterative loop, max 3)
           ↓
Phase 6:   COMMIT ─────────────────────────────────────
           Orchestrator reconciliation (evidence-based)
           ↓
Phase 7:   REFLECT ────────────────────────────────────
           📜 Hermes: playbooks + report
```

## 6-Tier Complexity Routing

| Tier | Review Mode | Phase 3 Agents |
|------|-------------|----------------|
| **trivial** | Consolidated | Multi-Reviewer (4 perspectives in 1) |
| **micro** | Consolidated | Multi-Reviewer (4 perspectives in 1) |
| **light** | Consolidated | Multi-Reviewer (4 perspectives in 1) |
| **standard** | Consolidated | Multi-Reviewer (4 perspectives in 1) |
| **complex** | Parallel | Argus + Nemesis + Cerberus + Apollo + Hestia |
| **critical** | Parallel | All above + Arete + Iris (if frontend) |

## Quality Gates

- **Coverage Threshold:** 80% line coverage required
- **Task Verification:** ALL tasks need file:line evidence
- **Critical Issues:** MUST fix
- **High Issues:** MUST fix

## Token Efficiency

- **Phase 2:** Agents spawn in parallel (same cost, faster)
- **Phase 3:** Consolidated Multi-Reviewer for trivial→standard (60-70% savings)
- **Phase 5:** Resumes Builder (50-70% token savings vs fresh agent)
- **Phase 7:** Combined Hermes (5-8K savings per story)

## Playbook Configuration

```yaml
playbooks:
  enabled: true
  directory: "docs/implementation-playbooks"
  bootstrap_mode: true  # Auto-initialize if missing
  max_load: 3
  auto_apply_updates: false  # Require manual review
  discovery:
    enabled: true
    sources: ["git_history", "docs", "existing_code"]
```

## How It Avoids CooperBench Coordination Failures

Unlike the multi-agent coordination failures documented in CooperBench (Stanford/SAP 2026):

1. **Sequential Implementation** - ONE Builder agent implements entire story (no parallel implementation conflicts)
2. **Parallel Review** - Multiple agents review in parallel (safe read-only operations)
3. **Context Reuse** - SAME agent fixes issues (no expectation failures about partner state)
4. **Evidence-Based** - file:line citations prevent vague communication
5. **Clear Roles** - Builder writes, reviewers validate (no overlapping responsibilities)

The workflow uses agents for **verification parallelism**, not **implementation parallelism** - avoiding the "curse of coordination."

## Files - Greek Pantheon Agents

**Core Agents:**
- `agents/builder.md` - **Metis** 🔨 - Implementation agent (with playbook awareness)
- `agents/inspector.md` - **Argus** 👁️ - Validation agent (requires code citations)
- `agents/test-quality.md` - **Nemesis** 🧪 - Test quality validation
- `agents/arbiter.md` - **Themis** ⚖️ - Issue triage (MUST_FIX/SHOULD_FIX/STYLE)
- `agents/fixer.md` - **Metis** 🔨 (resumed) - Issue resolution
- `agents/reflection-reporter.md` - **Hermes** 📜 - Combined reflection + reporting (v6.1)
- `agents/reflection.md` - **Mnemosyne** 📚 - Playbook learning (deprecated, use reflection-reporter)

**Reviewer Squad:**
- `agents/multi-reviewer.md` - **Review Council** 👁️🧪🔐🏛️ - Consolidated 4-perspective review (v6.1)
- `agents/security-reviewer.md` - **Cerberus** 🔐 - Security review
- `agents/logic-reviewer.md` - **Apollo** ⚡ - Logic/performance review
- `agents/architect-integration-reviewer.md` - **Hestia** 🏛️ - Architecture review
- `agents/quality-reviewer.md` - **Arete** ✨ - Code quality review
- `agents/ux-accessibility-reviewer.md` - **Iris** 🌈 - Accessibility review

**Workflow Config:**
- `workflow.yaml` - Main configuration (v7.4)
- `workflow.md` - Complete step-by-step documentation

**Templates:**
- `../templates/implementation-playbook-template.md` - Playbook structure

## Usage

```bash
# Run story-pipeline
/story-pipeline story_key=17-10
```

## Backward Compatibility

Falls back to single-agent mode if multi-agent execution fails.
