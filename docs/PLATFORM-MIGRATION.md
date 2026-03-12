# Platform Migration Guide

How to switch between Pantheon's supported AI coding platforms.

---

## Supported Platforms

| Platform | Multi-Agent | Swarm Mode | Full Pipeline |
|----------|-------------|------------|---------------|
| **Claude Code** | Yes | Yes | Yes |
| **OpenCode** | Partial | No | Partial |
| **GitHub Copilot** | No | No | Simplified |
| **Codex CLI** | Experimental | No | Per-skill |

Platform-specific launchers are auto-generated from `.agent.yaml` and `workflow.yaml` files by BMAD's IDE manager. No hand-crafted adapters are needed.

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

No additional configuration needed.

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
1. Install Pantheon via BMAD — IDE manager generates OpenCode agent files
2. Configure `.opencode.yaml` to reference generated agent files
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
1. Install Pantheon via BMAD — IDE manager generates Copilot skill files
2. Each skill becomes a `/pantheon-*` slash command
3. Invoke skills manually in sequence

**Key differences:**
- Each skill runs independently — no shared state between phases
- Review is single-pass, not multi-agent
- No artifact chain between phases (each skill starts fresh)

---

## Migrating To Codex CLI

Codex CLI now supports sub-agents, parallel execution, and the Agent Skills Standard.

**What works:**
- Full pipeline flow via skills (same `SKILL.md` format as Copilot)
- Sub-agent spawning with parallel fan-out (up to 6 concurrent threads)
- Agent roles: `default`, `worker`, `explorer`, `monitor`
- Blind review via separate sub-agent threads

**Limitations:**
- Multi-agent is experimental (enable via `[features] multi_agent = true` in `~/.codex/config.toml`)
- Max spawn depth defaults to 1 (configurable up to 3)
- Agent threads don't share context (similar to Claude Code's blind review)

**Setup:**
1. Install Pantheon via BMAD — IDE manager generates Codex instruction files
2. Enable multi-agent: add `[features] multi_agent = true` to `~/.codex/config.toml`
3. Invoke skills explicitly (`$pantheon-pipeline`) or let Codex auto-activate them

**Key differences from Claude Code:**
- Sub-agent management via `/agent` command instead of TeamCreate
- CSV batch fan-out (`spawn_agents_on_csv`) for bulk operations
- Agent roles configured in `config.toml` instead of `subagent_type` parameter

---

## Feature Comparison Matrix

| Feature | Claude Code | OpenCode | Copilot | Codex |
|---------|------------|----------|---------|-------|
| 8-phase pipeline | Automated | Manual | Per-skill | Per-skill |
| Parallel reviewers | 3-6 agents | Sequential | Yes | Yes (experimental) |
| Blind review | Yes | Yes | Yes | Yes (separate threads) |
| Pygmalion forging | Yes | Yes | Via skill | Via skill |
| Specialist registry | Yes | Yes | Via skill | Via skill |
| Playbook learning | Yes | Yes | Via skill | Via skill |
| Swarm mode | Yes | No | No | No |
| Complexity routing | Automatic | Manual | Via skill | Via skill |
| Coverage gates | Automated | Manual | Via skill | Via skill |
| Artifact chain | Full | Manual | Per-skill | Per-skill |

---

## Tips for Migration

1. **Start with Claude Code** if possible — it has the most mature multi-agent support
2. **Codex CLI is the closest alternative** — sub-agents + skills + parallel execution (experimental)
3. **Copilot works well** — skills auto-activate and can run in parallel
4. **OpenCode is functional** — most features work, just without built-in parallelism
