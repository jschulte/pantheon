# BMad Story Engine

A BMAD-METHOD external module providing a multi-agent story development engine with gap analysis, batch processing, playbook learning, and quality gates.

## Overview

This module extends the BMad Method with advanced implementation workflows that orchestrate multiple specialized AI agents to ensure high-quality code delivery through:

- **Multi-Agent Pipelines**: The Greek Pantheon - Metis (Builder) → Argus (Inspector) → Nemesis (Test Quality) → Reviewers → Themis (Arbiter) → Mnemosyne (Reflection)
- **Gap Analysis**: Validate story tasks against actual codebase implementation
- **Batch Processing**: Process multiple stories with smart dependency ordering
- **Playbook Learning**: Extract patterns from implementations for future agents
- **Quality Gates**: Enforce test coverage thresholds and code citation requirements

## What's New in v6.0

### Greek Pantheon Edition
All agents renamed with Greek mythology identities for memorable, distinct personalities.

### 7 Named Phases
Clean phase structure with progress indicators (1/7, 2/7, etc.):
- PREPARE → BUILD → VERIFY → ASSESS → REFINE → COMMIT → REFLECT

### Themis Quick-Fix Rule
The arbiter now errs on the side of fixing rather than filtering:
- **Any issue < 2 minutes to fix = MUST_FIX** (no debate)
- Expected distribution: 60-80% MUST_FIX, 10-30% SHOULD_FIX, 5-15% STYLE
- *"If it takes 30 seconds to fix, just fix it."*

### Smart Dependency Ordering (Parallel Waves)
When running stories in parallel, the engine analyzes dependencies and builds smart waves:

```
Stories selected: 5-1, 5-2, 5-3, 5-4, 5-5, 5-6

Wave 1 (no dependencies):
  • 5-1 Create shared UI components
  • 5-3 Add form validation helpers

Wave 2 (depends on Wave 1):
  • 5-2 Build list view using components (← 5-1)
  • 5-4 Add image upload service (← 5-1)

Wave 3 (depends on Wave 2):
  • 5-5 Enhance upload with preview (← 5-4)
  • 5-6 Add detail view with editing (← 5-2)
```

**Dependency detection:**
1. Explicit `depends_on` field in story files
2. File-based inference (cross-referencing created/used files)
3. Keyword scanning for story references
4. Epic ordering fallback (lower numbers first)

### Progress Artifacts & Wave Summaries
Each pipeline writes progress at every phase, enabling detailed wave summaries:

> **🌊 WAVE 1 COMPLETE**

| Story | Status | Tests | Coverage | Issues | Commit |
|-------|--------|-------|----------|--------|--------|
| 5-1 | ✅ done | 25 | 97.6% | 4→0 | `8a1a0f0` |
| 5-3 | ✅ done | 18 | 100% | 2→0 | `481c7fd` |

> **Wave Summary:** 2/2 succeeded

The **Issues** column shows "found→remaining" (e.g., "4→0" means 4 issues found, all fixed).

### Playbook Consolidation
Mnemosyne now searches existing playbooks before creating new ones - consolidating knowledge rather than scattering it across many files.

## Installation

### Prerequisites

- [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) v6.0.0 or later
- Node.js >= 18.0.0

### Install via BMAD Installer

```bash
npx bmad-method install
```

During installation, select both:
- ✅ BMad Method (BMM) - Required dependency
- ✅ BMad Story Engine (BSE) - This module

### Manual Registration (for development)

Add to your project's external modules or BMAD's `external-official-modules.yaml`:

```yaml
modules:
  bmad-story-engine:
    url: https://github.com/jschulte/bmad-story-engine
    module-definition: src/module.yaml
    code: bse
    name: "BMad Story Engine"
    description: "Multi-agent story development engine"
    defaultSelected: false
    type: community
    npmPackage: bmad-story-engine
```

## Workflows

| Workflow | Phase | Description |
|----------|-------|-------------|
| `story-pipeline` | Execution | Multi-agent TDD pipeline with 7 phases and specialized agents |
| `batch-stories` | Orchestration | Process multiple stories with smart dependency ordering |
| `gap-analysis` | Preparation | Validate story tasks against actual codebase (pre-dev) |
| `create-story-with-gap-analysis` | Preparation | Story creation with systematic codebase analysis |
| `validate` | Verification | Post-dev verification with quick/deep modes |
| `revalidate-story` | Verification | Quick single-story validation check |
| `multi-agent-review` | On-demand | Smart multi-agent code review |
| `detect-ghost-features` | Maintenance | Reverse gap analysis - find code without specs |

### Workflow Phases

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT LIFECYCLE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PREPARATION          EXECUTION           VERIFICATION          │
│  ────────────         ─────────           ────────────          │
│                                                                  │
│  gap-analysis    ──▶  story-pipeline  ──▶  validate             │
│  create-story-       (multi-agent)        revalidate-story      │
│  with-gap-analysis                                              │
│                                                                  │
│  ORCHESTRATION        ON-DEMAND           MAINTENANCE           │
│  ─────────────        ─────────           ───────────           │
│                                                                  │
│  batch-stories        multi-agent-        detect-ghost-         │
│  (smart waves)        review              features              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Agents - The Greek Pantheon

### Core Agents

| Agent | Greek Name | Domain | Role |
|-------|------------|--------|------|
| `builder` | **Metis** 🔨 | Goddess of Wisdom & Craft | TDD Implementation Specialist - "With the wisdom of the Titans" |
| `inspector` | **Argus** 👁️ | The All-Seeing Giant | Independent verification with code citations - "With a hundred eyes" |
| `test-quality` | **Nemesis** 🧪 | Goddess of Retribution & Balance | Test quality analyst - "Justice demands tests that assert the truth" |
| `arbiter` | **Themis** ⚖️ | Titan of Justice | Triages feedback - Quick fixes = MUST_FIX, filters only the truly pointless |
| `reflection` | **Mnemosyne** 📚 | Titan of Memory | Knowledge curator - Consolidates playbooks, doesn't scatter |

### Reviewer Squad

The pipeline spawns specialized reviewers based on story complexity (6-tier scale):

| Reviewer | Greek Name | Domain | Focus |
|----------|------------|--------|-------|
| `security` | **Cerberus** 🔐 | Three-Headed Guardian | Vulnerabilities, auth, injection |
| `logic` | **Apollo** ⚡ | God of Reason & Truth | Bugs, edge cases, performance |
| `architect` | **Hestia** 🏛️ | Goddess of Structure | Patterns, integration, routes |
| `quality` | **Arete** ✨ | Personification of Excellence | Code smells, maintainability |
| `accessibility` | **Iris** 🌈 | Goddess of the Rainbow | WCAG, ARIA, screen readers |

### 6-Tier Complexity Routing

| Tier | Reviewers | Description |
|------|-----------|-------------|
| **trivial** | 1 (Argus only) | Static content, copy changes |
| **micro** | 2 (Cerberus + Hestia) | Simple component, no API |
| **light** | 3 (+Apollo) | Basic CRUD, simple form |
| **standard** | 4 (+Arete) | API integration, user input |
| **complex** | 5 (+Iris if frontend) | Auth, migration, database |
| **critical** | 6 (all reviewers) | Payment, encryption, PII |

### Conditional Reviewers

**Iris** (Accessibility) is **automatically added** when frontend files are detected:

```bash
# Iris is invoked when git diff includes frontend files:
git diff --name-only | grep -E "\.(tsx|jsx|vue|css|scss|html)$|components/|pages/"
```

## Story Pipeline v6.0 - The Greek Pantheon

```
┌─────────────────────────────────────────────────────────────┐
│           STORY PIPELINE v6.0 - GREEK PANTHEON               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Phase 1: PREPARE (1/7) ─────────────────────────────────── │
│     Story quality gate + playbook query                     │
│                                                              │
│  Phase 2: BUILD (2/7) ───────────────────────────────────── │
│     🔨 Metis implements with TDD                            │
│                                                              │
│  Phase 3: VERIFY (3/7) ──────────────────────────────────── │
│     👁️ Argus (Inspector)     ┐                              │
│     🧪 Nemesis (Test Quality) ├─ Run in parallel            │
│     🔐 Cerberus (Security)    │                              │
│     ⚡ Apollo (Logic)         │                              │
│     🏛️ Hestia (Architecture)  │                              │
│     ✨ Arete (Quality)        │                              │
│     🌈 Iris (Accessibility)  ┘                              │
│                                                              │
│  Phase 4: ASSESS (4/7) ──────────────────────────────────── │
│     Coverage gate + ⚖️ Themis triages issues                │
│     Quick Fix Rule: < 2 min = MUST_FIX                      │
│                                                              │
│  Phase 5: REFINE (5/7) ──────────────────────────────────── │
│     🔨 Metis fixes MUST_FIX issues                          │
│     Loop until clean (max 3 iterations)                     │
│                                                              │
│  Phase 6: COMMIT (6/7) ──────────────────────────────────── │
│     Reconcile story, update sprint status                   │
│                                                              │
│  Phase 7: REFLECT (7/7) ─────────────────────────────────── │
│     📚 Mnemosyne updates playbooks (consolidates, not scatters) │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Batch Processing

### Execution Modes

| Mode | Description | Best For |
|------|-------------|----------|
| **Sequential** | Process one-by-one, visible agent phases | Gap analysis, debugging |
| **Parallel** | Smart waves with dependency ordering | Greenfield batch, speed |

### Parallel Configuration

```yaml
parallel_config:
  max_concurrent: 3          # Stories per wave (configurable)
  smart_ordering: true       # Analyze dependencies automatically
  respect_epic_order: true   # Lower story numbers first
```

### Story Dependencies

Stories can declare dependencies for smart wave ordering:

```markdown
## Dependencies
depends_on: [5-1, 5-2]
```

## Configuration

The module adds these configuration options during installation:

| Option | Default | Description |
|--------|---------|-------------|
| `enable_playbooks` | `true` | Enable playbook learning from implementations |
| `coverage_threshold` | `80` | Minimum test coverage percentage required |
| `enable_batch_processing` | `true` | Allow processing multiple stories |
| `require_code_citations` | `true` | Inspector must provide file:line evidence |
| `auto_fix_critical_issues` | `true` | Builder resumes to fix critical/high issues |

## Issue Classification

Themis triages reviewer findings with the **Quick Fix Rule**:

| Classification | Meaning | When Used |
|----------------|---------|-----------|
| **MUST_FIX** | Fix now | Quick fixes (< 2 min) OR real issues (security, bugs, broken tests) |
| **SHOULD_FIX** | Tech debt | Significant effort (10+ min) AND debatable value |
| **STYLE** | Ignore | Truly pointless - bikeshedding, preference only (rare!) |

**Expected distribution:** 60-80% MUST_FIX, 10-30% SHOULD_FIX, 5-15% STYLE

## Complexity Routing

The batch processor routes stories based on complexity:

| Level | Criteria | Pipeline |
|-------|----------|----------|
| **Trivial** | 1 task, static content | Argus only |
| **Micro** | ≤2 tasks, no API | Lightweight (2 reviewers) |
| **Light** | ≤4 tasks, basic CRUD | 3 reviewers |
| **Standard** | ≤10 tasks, API integration | Full pipeline (4 reviewers) |
| **Complex** | ≤15 tasks, auth/migration | Enhanced (5 reviewers) |
| **Critical** | 16+ tasks, payment/encryption/PII | All reviewers (6) |

Risk keywords that increase complexity:
- **Critical**: payment, encryption, PII, credentials, secret
- **High**: auth, security, migration, database, schema
- **Medium**: api, integration, external, third-party, cache

## Dependencies

This module depends on:
- **BMM (BMad Method)**: Uses BMM's config and agents (sm, tea, dev)

## License

MIT

## Contributing

Contributions welcome! Please read the [BMAD-METHOD contributing guide](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/CONTRIBUTING.md) first.
