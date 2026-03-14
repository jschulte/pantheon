# Platform Primitives

Pantheon workflows use these 6 abstract primitives instead of platform-specific tool names. Before executing any workflow, load your platform definition from this directory to learn how each primitive maps to your environment.

## How It Works

1. Workflow says: `spawn(persona=metis, background=true)`
2. You read your platform definition (e.g., `claude-code.md` or `codex.md`)
3. Platform definition says how to invoke that primitive on your platform
4. You execute using your platform's native mechanism

Workflows describe **what** to do. Platform definitions describe **how**.

---

## Primitives

### 1. `spawn(persona, options) → agent_ref`

Start an agent with a given persona and instructions.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `persona` | string | yes | Persona name (e.g., "metis", "heracles", "cerberus") |
| `persona_file` | path | no | Path to persona .md file to load into agent context |
| `prompt` | string | yes | Task-specific instructions for this agent |
| `background` | bool | no | If true, agent runs without blocking. Default: false |
| `model` | string | no | Model preference: "best" (default), "fast", "budget" |
| `isolation` | string | no | "worktree" for git-isolated execution, "shared" (default) |
| `specialist` | string | no | Domain hint for platform-specific agent routing (e.g., "frontend", "security", "database") |

**Returns:** An `agent_ref` you can pass to `check()` or `resume()`.

**Example in workflow:**
```
builder = spawn(
  persona: "metis",
  persona_file: "workflows/story-pipeline/agents/metis.md",
  prompt: "Implement story {{story_key}} using TDD. Story file: {{story_file}}",
  background: true,
  model: "best",
  specialist: "frontend"
)
```

---

### 2. `spawn_parallel(specs[]) → agent_ref[]`

Start multiple agents concurrently. Semantically equivalent to calling `spawn()` for each spec, but signals to the platform that these should run at the same time.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `specs` | array | yes | Array of spawn parameter objects (same shape as `spawn()` params) |

**Returns:** Array of `agent_ref` values, one per spec.

**Fallback:** Platforms that don't support true concurrency execute each spec sequentially. The workflow logic remains identical — only the wall-clock time changes.

**Example in workflow:**
```
reviewers = spawn_parallel([
  { persona: "cerberus", prompt: "Security review...", specialist: "security" },
  { persona: "nemesis", prompt: "Test quality review...", specialist: "testing" },
  { persona: "hestia", prompt: "Architecture review...", specialist: "architecture" }
])
```

---

### 3. `check(agent_ref) → result`

Check whether a background agent has completed.

**Returns:**
```
{
  status: "running" | "completed" | "failed",
  output: string | null,   // Agent's final output (if completed)
  error: string | null      // Error message (if failed)
}
```

**Blocking variant:** `check(agent_ref, block=true)` waits until the agent finishes.

---

### 4. `poll(agent_refs[], interval) → results[]`

Periodically check multiple background agents. Keeps checking until all agents complete or fail.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `agent_refs` | array | yes | Array of agent_ref values from spawn/spawn_parallel |
| `interval` | duration | no | Check interval. Default: 15s |
| `on_complete` | callback | no | Action to take when an individual agent completes |

**Returns:** Array of results (same shape as `check()` return).

**Fallback:** Platforms without background agents don't need poll — agents run synchronously, so results are available immediately after spawn.

---

### 5. `ask(question, options) → response`

Get interactive input from the user.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | yes | The question to ask |
| `options` | array | no | Numbered options for the user to choose from |
| `default` | number | no | Default option index (0-based) |

**Returns:** The user's response (text or selected option index).

**Fallback:** Platforms that don't support interactive input use the default option automatically and log a note. Workflows should always provide sensible defaults.

---

### 6. `resume(agent_ref, prompt) → agent_ref`

Resume a previously completed agent with its full context preserved, plus new instructions.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `agent_ref` | ref | yes | Reference from a previous spawn |
| `prompt` | string | yes | Additional instructions (e.g., "fix these MUST_FIX issues: ...") |

**Returns:** A new `agent_ref` for the resumed agent.

**Fallback:** Platforms that don't support agent resumption spawn a fresh agent with the original prompt + new instructions concatenated. Higher token cost but functionally equivalent.

---

## Platform Capability Matrix

| Primitive | Claude Code | Codex | Copilot | OpenCode |
|-----------|-------------|-------|---------|----------|
| `spawn` | Native | Native | Native | Native |
| `spawn_parallel` | Native | Native (background terminals) | Native (auto) | Sequential fallback |
| `check` | Native | Native | Auto | Sequential (no-op) |
| `poll` | Native | Native | Auto | Sequential (no-op) |
| `ask` | Native | Limited | Native | Native |
| `resume` | Native | Fresh spawn fallback | `--resume` flag | Fresh spawn fallback |

---

## For Workflow Authors

When writing or editing workflows:

1. **Use primitive names**, not platform tool names
2. **Always provide `background: false` fallback paths** — some platforms run everything synchronously
3. **Always provide `default` for `ask()`** — some platforms can't prompt interactively
4. **Don't assume `resume()` preserves context** — treat it as "best effort optimization"
5. **The `specialist` hint is optional** — platforms that support specialized agent types use it; others ignore it

## For Platform Authors

When writing a platform definition:

1. Map each primitive to your platform's native mechanism
2. Document which primitives have native support vs fallback behavior
3. Include concrete syntax examples the LLM can copy
4. Note any platform-specific setup (env vars, permissions, etc.)
