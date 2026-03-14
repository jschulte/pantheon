# Platform Definition: Codex CLI

> Load this file when running Pantheon workflows inside OpenAI Codex CLI.
> It maps platform-agnostic primitives to Codex's native capabilities.

## Platform Detection

You are running in Codex if you have access to background terminals (via shell), can execute commands autonomously, but do NOT have a `Task` tool, `Agent` tool, or `subagent_type` parameter.

## Capabilities

| Capability | Support | Notes |
|------------|---------|-------|
| Background agents | Via background terminals | `command &` or background shell sessions |
| Parallel agents | Via background terminals | Multiple background processes |
| Agent resumption | Fresh spawn fallback | Re-read artifacts, no context preservation |
| Interactive input | Limited | Use defaults; batch mode is autonomous |
| Worktree isolation | Via git worktree | Standard git commands |
| Specialized agents | Via persona switching | Same agent, different persona instructions |

---

## Primitive Mappings

### `spawn(persona, options) → agent_ref`

**Foreground (background=false):**

Execute the persona's instructions directly in the current context. Adopt the persona by reading its persona file and following its instructions.

```
# 1. Read the persona file
Read(options.persona_file)

# 2. Execute the persona's instructions with the given prompt
# You ARE this persona now. Follow its instructions.
{{options.prompt}}
```

**Background (background=true):**

Use a background terminal to run the agent's work independently.

```bash
# Start a background terminal with the persona's task
# The exact mechanism depends on Codex's current background terminal API.
# Key: the work runs independently and you can check on it later.
```

If background terminals are not available, fall back to sequential execution:
```
# Sequential fallback: execute each agent one at a time
# This changes wall-clock time, not correctness
```

**Specialist mapping:** Codex does not have specialized sub-agent types. Ignore the `specialist` hint — all agents run as the same model with different persona instructions. The persona file provides domain expertise.

**Model mapping:** Codex uses its configured model. Ignore the `model` hint.

---

### `spawn_parallel(specs[]) → agent_ref[]`

**With background terminals:**

Start each agent in a separate background terminal:

```bash
# Terminal 1: Agent for spec[0]
# Terminal 2: Agent for spec[1]
# Terminal 3: Agent for spec[2]
# Each terminal reads its persona file and executes its prompt independently
```

**Without background terminals (sequential fallback):**

Execute each spec one at a time in the current context:

```
FOR EACH spec IN specs:
  # Adopt persona, execute prompt, save artifacts
  spawn(spec)  # foreground
```

The workflow logic is identical — parallel execution is an optimization, not a requirement.

---

### `check(agent_ref) → result`

**With background terminals:**

Check if the background terminal/process has completed:

```bash
# Check if the background process is still running
# Read any output files or artifacts it produced
# Map to: { status: "running" | "completed" | "failed", output, error }
```

**Sequential fallback:**

When running sequentially, `check()` always returns `{ status: "completed" }` because agents run to completion before the next step. This is a no-op.

---

### `poll(agent_refs[], interval)`

**With background terminals:**

```bash
# Periodically check all background terminals
# When one completes, handle its results and potentially start the next task
```

**Sequential fallback:**

No polling needed — agents complete synchronously. Skip this primitive entirely.

---

### `ask(question, options) → response`

Codex runs autonomously in batch mode. Interactive prompts are not supported during batch execution.

**Behavior:**
- If `options.default` is provided → use the default automatically
- If no default → use the first option (index 0)
- Log the auto-selected choice so the user can review

```
# Auto-select: {{options[default || 0]}}
# Reason: Codex batch mode — interactive input not available
```

**Pre-batch configuration:** Users should set preferences before starting the batch run. Workflows should document what decisions will be auto-resolved and what defaults are used.

---

### `resume(agent_ref, prompt) → agent_ref`

Codex does not support agent resumption. Fall back to fresh spawn with combined context.

**Fallback:**

```
# Cannot resume — spawn fresh agent with original + new instructions
spawn({
  persona: original_persona,
  persona_file: original_persona_file,
  prompt: `
    ## Previous Context
    {{Read any artifacts from the previous agent's work}}

    ## New Instructions
    {{prompt}}
  `
})
```

**Optimization:** Read the previous agent's output artifacts (JSON files in `completions/`) to reconstruct context. This is more expensive than true resumption but functionally equivalent.

---

## Platform-Specific Notes

### Worktree Isolation

Codex supports git worktrees via standard git commands. The workflow's worktree setup instructions work as-is:

```bash
git worktree add -b branch-name path HEAD
ln -s /path/to/node_modules path/node_modules
```

### Artifact-Based Coordination

Since Codex agents don't share memory, all coordination happens through filesystem artifacts:

- Progress: `completions/{{story_key}}-progress.json`
- Builder output: `completions/{{story_key}}-builder.json`
- Review findings: `completions/{{story_key}}-review.json`
- Triage results: `completions/{{story_key}}-themis.json`

Each agent reads/writes these files. The orchestrator checks them to determine next steps.

### Permissions

Codex manages its own permissions. Ensure the Codex session has:
- File read/write access to the project directory
- Shell access for `npm test`, `git` commands
- Network access if tests require it

### Sequential vs Parallel Decision

If you're unsure whether Codex supports background terminals in your environment:

1. **Try parallel first** — attempt to start a background process
2. **If it fails** — fall back to sequential execution automatically
3. **Log the mode** — note in the session report which mode was used

The workflow produces identical results either way. Parallel is faster, sequential is simpler.
