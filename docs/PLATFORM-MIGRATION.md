# Platform Migration Guide

How to switch between Pantheon's supported AI coding platforms.

---

## Supported Platforms

| Platform | Adapter Path | Multi-Agent | Swarm Mode | Full Pipeline |
|----------|-------------|-------------|------------|---------------|
| **Claude Code** | Native (no adapter) | Yes | Yes | Yes |
| **OpenCode** | `src/adapters/opencode/` | Partial | No | Partial |
| **GitHub Copilot** | `src/adapters/copilot/` | No | No | Simplified |
| **Codex CLI** | `src/adapters/codex/` | No | No | Degraded |

---

## Migrating To Claude Code (Recommended)

Claude Code is the primary platform. All features work natively.

**Requirements:**
- Claude Code CLI installed
- For swarm mode: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

**Setup:**
1. Install Pantheon via BMAD Method: `npx bmad install @jonahschulte/pantheon`
2. Run story pipeline: `/pantheon_story-pipeline`
3. Run batch stories: `/pantheon_batch-stories`

No adapter configuration needed.

---

## Migrating To OpenCode

OpenCode supports multi-agent via sequential agent invocation.

**What works:**
- Story pipeline (sequential phases)
- Individual agent invocation (Metis, Cerberus, Themis, etc.)
- Playbook learning
- Specialist forging (Pygmalion)

**What doesn't work:**
- Parallel reviewer spawning (runs sequentially instead)
- Swarm mode (no Agent Teams equivalent)
- Automated phase transitions (manual progression)

**Setup:**
1. Copy `src/adapters/opencode/agents/` to your OpenCode agents directory
2. Configure `.opencode.yaml` to reference Pantheon agents
3. Use `/pantheon-pipeline` as the entry point

**Key differences:**
- Agents are invoked one at a time, not in parallel
- The orchestrator role falls to the user (you manage phase progression)
- Model references use `anthropic/claude-sonnet-4` format

---

## Migrating To GitHub Copilot

Copilot uses Skills (slash commands) for agent invocation.

**What works:**
- Individual skills for each pipeline phase
- Story validation
- Code review (single-agent, multi-perspective)
- Batch review

**What doesn't work:**
- Multi-agent parallel verification
- Swarm mode
- Automated pipeline orchestration
- Specialist forging

**Setup:**
1. Copy `src/adapters/copilot/skills/` to your `.github/copilot/skills/` directory
2. Each skill becomes a `/pantheon-*` slash command
3. Invoke skills manually in sequence

**Key differences:**
- Each skill runs independently — no shared state between phases
- Review is single-pass, not multi-agent
- No artifact chain between phases (each skill starts fresh)

---

## Migrating To Codex CLI

Codex provides a single-agent pipeline with persona switching.

**What works:**
- Full pipeline flow (persona switching within one agent)
- Story validation
- Build + review cycle

**Limitations (Degraded Mode):**
- Same agent builds AND reviews code — loses independent verification
- No parallel execution
- No swarm mode
- Persona switching is advisory, not enforced

**Setup:**
1. Copy `src/adapters/codex/instructions/` to your Codex instructions directory
2. Use `pantheon-pipeline.md` as the primary instruction file
3. Invoke via Codex CLI with the instruction file

**Key differences:**
- Single agent adopts each persona sequentially
- The "blind reviewer" pattern is lost (reviewer has seen builder's reasoning)
- This is explicitly a **degraded mode** — use for convenience, not rigor

---

## Feature Comparison Matrix

| Feature | Claude Code | OpenCode | Copilot | Codex |
|---------|------------|----------|---------|-------|
| 7-phase pipeline | Automated | Manual | Per-skill | Single-agent |
| Parallel reviewers | 3-6 agents | Sequential | No | No |
| Blind review | Yes | Yes | No | No |
| Pygmalion forging | Yes | Yes | No | No |
| Specialist registry | Yes | Yes | No | No |
| Playbook learning | Yes | Yes | No | No |
| Swarm mode | Yes | No | No | No |
| Complexity routing | Automatic | Manual | No | No |
| Coverage gates | Automated | Manual | No | No |
| Artifact chain | Full | Manual | No | Single |

---

## Tips for Migration

1. **Start with Claude Code** if possible — it's the only platform with full feature support
2. **OpenCode is the best alternative** — most features work, just without parallelism
3. **Copilot/Codex are convenience modes** — useful for quick reviews, not full pipeline runs
4. **Don't expect equivalent quality** across platforms — multi-agent verification is the core value proposition, and only Claude Code fully supports it
5. **Run `npm run check:drift`** after updating adapters to verify they're in sync with canonical agent definitions
