# Platform Definition: Claude Code

> Load this file when running Pantheon workflows inside Claude Code (Anthropic's CLI).
> It maps platform-agnostic primitives to Claude Code's native tools.

## Platform Detection

You are running in Claude Code if you have access to the `Agent` tool with `subagent_type` parameter, or the `Skill` tool for slash commands.

## Capabilities

| Capability | Support | Notes |
|------------|---------|-------|
| Background agents | Native | `run_in_background: true` |
| Parallel agents | Native | Multiple Agent calls in one message |
| Agent resumption | Native | Pass `resume: agent_id` to Agent tool |
| Interactive input | Native | AskUserQuestion tool (deferred, fetch first) |
| Worktree isolation | Native | `isolation: "worktree"` on Agent tool |
| Specialized agents | Native | `subagent_type` parameter |

---

## Primitive Mappings

### `spawn(persona, options) → agent_ref`

```
agent_ref = Agent({
  description: "{{persona}} — {{short_task_description}}",
  subagent_type: SPECIALIST_MAP[options.specialist] || "general-purpose",
  model: MODEL_MAP[options.model] || "opus",
  run_in_background: options.background || false,
  isolation: options.isolation == "worktree" ? "worktree" : undefined,
  prompt: `
    {{Read(options.persona_file) if provided}}

    {{options.prompt}}
  `
})
```

**Specialist mapping** (`options.specialist` → Claude Code `subagent_type`):

| Specialist Hint | subagent_type | When to use |
|----------------|---------------|-------------|
| `"frontend"` | `dev-frontend` | React, Next.js, CSS, UI components |
| `"typescript"` | `dev-typescript` | TypeScript APIs, type systems |
| `"python"` | `dev-python` | Python backends, scripts |
| `"go"` | `dev-go` | Go services |
| `"database"` | `database-administrator` | SQL, Prisma, migrations |
| `"infrastructure"` | `engineer-deployment` | CI/CD, Docker, cloud |
| `"security"` | `auditor-security` | Security review, OWASP |
| `"architecture"` | `architect-reviewer` | Patterns, structure review |
| `"testing"` | `automater-test` | Test quality, coverage |
| `"performance"` | `optimizer-performance` | Performance optimization |
| `"accessibility"` | `accessibility-expert` | WCAG, a11y review |
| _(default)_ | `general-purpose` | Mixed or unspecified |

**Model mapping** (`options.model` → Claude Code model):

| Model Hint | Claude Code Model |
|------------|-------------------|
| `"best"` | `opus` |
| `"fast"` | `sonnet` |
| `"budget"` | `haiku` |

---

### `spawn_parallel(specs[]) → agent_ref[]`

Issue multiple `Agent()` calls in a **single message**. Claude Code executes them concurrently when they appear in the same response.

```
// In a single message, emit all Agent calls together:
agent_ref_1 = Agent({ ...spec_1_mapped... })
agent_ref_2 = Agent({ ...spec_2_mapped... })
agent_ref_3 = Agent({ ...spec_3_mapped... })
```

Each spec is mapped using the same rules as `spawn()` above.

---

### `check(agent_ref) → result`

Use the `TaskOutput` tool (deferred — fetch schema first):

```
result = TaskOutput({
  task_id: agent_ref.task_id,
  block: false,        // non-blocking check
  timeout: 5000        // 5s timeout for quick poll
})

// Or blocking:
result = TaskOutput({
  task_id: agent_ref.task_id,
  block: true
})
```

**Status mapping:**
- TaskOutput returns `status: "completed"` → `{ status: "completed", output: result.output }`
- TaskOutput returns `status: "failed"` → `{ status: "failed", error: result.error }`
- TaskOutput times out or returns nothing → `{ status: "running" }`

---

### `poll(agent_refs[], interval)`

Loop with sleep:

```
WHILE any agent_ref still running:
  FOR EACH agent_ref IN agent_refs:
    result = check(agent_ref)
    IF result.status != "running":
      handle_completion(agent_ref, result)

  sleep(interval || 15s)
```

---

### `ask(question, options) → response`

Fetch and use the `AskUserQuestion` tool:

```
response = AskUserQuestion({
  question: question,
  options: options.map((opt, i) => `${i+1}. ${opt}`),
  defaultOption: options.default || 0
})
```

---

### `resume(agent_ref, prompt) → agent_ref`

Pass the original agent's ID to spawn a new agent that continues with full context:

```
new_agent_ref = Agent({
  resume: agent_ref.agent_id,
  prompt: prompt
})
```

This preserves the agent's full conversation history and working state. Significant token savings compared to fresh spawn (50-70% reduction).

---

## Platform-Specific Setup

### Permissions

Pre-approve in Claude Code settings before batch execution:
- File read/write in project directory
- Bash commands for `npm test`, `git add`, `git commit`, `npx`
- Agent spawning (sub-agents within workers)

### Delegate Mode

For batch orchestration, use `Shift+Tab` to switch to delegate mode. This prevents the orchestrator from accidentally implementing stories itself.

### Agent Teams (Experimental)

If using Agent Teams swarm mode (not the default):
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

This enables `TeamCreate`, `SendMessage`, and team-based coordination. Not required for the standard lead-driven parallel model.
