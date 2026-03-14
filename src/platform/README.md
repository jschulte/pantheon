# Platform Abstraction Layer

Pantheon workflows use platform-agnostic primitives instead of tool-specific syntax. This directory contains the primitive definitions and platform-specific mappings.

## Files

| File | Purpose |
|------|---------|
| `primitives.md` | 6 abstract primitives workflows use (`spawn`, `spawn_parallel`, `check`, `poll`, `ask`, `resume`) |
| `claude-code.md` | Maps primitives to Claude Code tools (Agent, TaskOutput, AskUserQuestion) |
| `codex.md` | Maps primitives to Codex capabilities (background terminals, sequential fallback) |

## How It Works

1. Workflow says `spawn(persona: "metis", background: true)`
2. Agent reads its platform definition file
3. Platform definition says how to invoke that primitive natively
4. Agent executes using its platform's mechanism

**Before:** Workflow → Claude Code syntax → Other platforms can't parse it
**After:** Workflow → Generic primitive → Each platform translates to its own syntax

## Adding a New Platform

1. Copy an existing platform definition as a template
2. Map each of the 6 primitives to your platform's native tools
3. Document capability support (native vs fallback)
4. Add to the capability matrix in `primitives.md`

## Design Rationale

The previous approach used per-workflow, per-platform adapter files (N workflows x M platforms = N*M files). This platform layer replaces that with: N workflows (using primitives) + M platform definitions = N+M files — a simpler, more maintainable architecture.

## Migration Status

| Workflow | Uses Primitives |
|----------|----------------|
| batch-stories/execute-parallel | Yes |
| story-pipeline | Not yet |
| batch-review | Not yet |
| Others | Not yet |
