# Pantheon - Multi-Platform Adapters

This directory contains adapters that allow the Pantheon pipeline to run on different AI coding assistants.

## Supported Platforms

| Platform | Status | Parallel Execution | Agent Resumption | Notes |
|----------|--------|-------------------|------------------|-------|
| **Claude Code** | ✅ Full Support | ✅ Native | ✅ Native | Primary platform, all features |
| **OpenCode** | ✅ Supported | ⚠️ Via orchestration | ❌ Fresh context | Task tool compatible |
| **GitHub Copilot** | ✅ Supported | ✅ Automatic | ✅ `--resume` flag | Agent Skills based |
| **Codex CLI** | ✅ Supported | ❌ Sequential | ❌ Fresh context | Instruction-based |

## Installation

Run the setup script for your platform:

```bash
# Detect platform and install appropriate adapters
./src/adapters/install.sh

# Or specify explicitly:
./src/adapters/install.sh --platform opencode
./src/adapters/install.sh --platform copilot
./src/adapters/install.sh --platform codex
./src/adapters/install.sh --platform claude-code  # Default, uses existing setup
```

## Architecture

```
adapters/
├── README.md                    # This file
├── install.sh                   # Installation script
├── universal/
│   ├── workflow-orchestrator.md # Platform-agnostic orchestration guide
│   └── agents/                  # Portable agent definitions
├── opencode/
│   └── agents/                  # OpenCode .md agent configs
├── copilot/
│   └── skills/                  # GitHub Copilot Agent Skills
└── codex/
    └── instructions/            # Codex CLI instructions
```

## How It Works

### Claude Code (Native)
Uses the built-in Task tool with `subagent_type` parameter to spawn specialized agents. Full parallel execution via multiple Task calls in a single message.

### OpenCode
Uses `.opencode/agents/` Markdown configurations with YAML frontmatter. The Task tool invokes subagents. Parallel execution requires external orchestration (vibe-kanban) or runs sequentially.

### GitHub Copilot
Uses Agent Skills (`.github/skills/`) folders. Each agent becomes a skill with `SKILL.md` + resources. Copilot automatically delegates and can run agents in parallel.

### Codex CLI
Uses instruction files that Codex loads into context. Sequential execution only. The orchestrator follows phases manually with Codex handling implementation.

## Platform-Specific Limitations

### OpenCode
- No built-in agent resumption (fresh context each time)
- Parallel execution requires external tooling
- Must define all agent types manually

### GitHub Copilot
- Less explicit control over parallel execution timing
- Agent Skills are relatively new (Dec 2025)
- Some features require Copilot Pro/Business

### Codex CLI
- No subagent system - runs as single agent
- Sequential execution only
- Simpler but less powerful

## Workflow Compatibility

The core 7-phase workflow remains identical across platforms:

1. **PREPARE** - Story validation + playbook loading
2. **BUILD** - Implementation with TDD
3. **VERIFY** - Multi-reviewer validation
4. **ASSESS** - Coverage gate + issue triage
5. **REFINE** - Fix issues iteratively
6. **COMMIT** - Reconcile story + git commit
7. **REFLECT** - Update playbooks with learnings

What changes per platform:
- How agents are spawned (Task tool vs Skills vs instructions)
- Whether parallel execution is automatic or manual
- Whether agent context can be resumed

## Available Workflows

### Story Pipeline (`/story-pipeline`, `/batch-stories`)

Implements new user stories with multi-agent review.

| Platform | Command |
|----------|---------|
| Claude Code | `/story-pipeline story_key=17-1` |
| OpenCode | `@pantheon-orchestrator "Implement STORY-001"` |
| Copilot | `@workspace /pantheon-pipeline Implement STORY-001` |
| Codex | `Implement STORY-001 using BMAD pipeline` |

### Batch Review (`/batch-review`)

Deep hardening sweeps on existing code. Run repeatedly until bulletproof.

| Platform | Command |
|----------|---------|
| Claude Code | `/batch-review epic=17 focus="security"` |
| OpenCode | `@pantheon-batch-review "Harden epic=17 focus=security"` |
| Copilot | `@workspace /batch-review epic=17 focus="security"` |
| Codex | `batch-review epic=17 focus="security"` |

**Focus Examples:**
```
focus="security vulnerabilities, auth bypass"
focus="styling, UX, button placement"
focus="accessibility, WCAG AA"
focus="N+1 queries, performance"
focus="error handling consistency"
```

## Adapters by Platform

### Claude Code (Native)
- Uses built-in Task tool with specialized subagent_types
- Full parallel execution
- Agent resumption supported

### OpenCode
Files in `.opencode/agents/`:
- `pantheon-orchestrator.md` - Story pipeline orchestrator
- `pantheon-batch-review.md` - Batch review orchestrator
- `pantheon-builder.md`, `pantheon-inspector.md`, etc. - Specialized agents
- `pantheon-deep-reviewer.md`, `pantheon-issue-fixer.md` - Hardening agents

### GitHub Copilot
Skills in `.github/skills/`:
- `pantheon-pipeline/` - Story pipeline skill
- `pantheon-batch-review/` - Batch review skill
- `pantheon-security/`, `pantheon-inspector/`, etc. - Specialized skills

### Codex CLI
Instructions in `.codex/`:
- `pantheon-pipeline.md` - Story pipeline instructions
- `pantheon-batch-review.md` - Batch review instructions
