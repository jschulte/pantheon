# Contributing to Pantheon

Pantheon is a BMAD Method plugin that provides a multi-agent story development engine. Agents are named after Greek mythology figures and operate in an 8-phase pipeline:

**PREPARE > FORGE > BUILD > VERIFY > ASSESS > REFINE > COMMIT + REFLECT**

---

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/jonahschulte/pantheon.git
   cd pantheon
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Ensure you have Node.js >= 18 installed.

4. Pantheon requires `bmad-method >= 6.0.0` as a peer dependency.

5. Validate YAML files:

   ```bash
   npm run validate:yaml
   ```

---

## Project Structure

```
src/
  module.yaml                # Module metadata and configuration prompts
  agent-routing.yaml         # Routing rules: maps story content to agents
  agents/
    builders/                # Builder agents (Helios, Hephaestus, Athena, Metis, ...)
    reviewers/               # Review agents (Cerberus, Hestia, Apollo, Iris, Arete)
    validators/              # Validation agents (Argus, Nemesis)
    support/                 # Support agents (Themis, Mnemosyne, Hermes)
  workflows/
    story-pipeline/          # Core 8-phase pipeline
    batch-stories/           # Batch processing of multiple stories
    batch-review/            # Batch code review
    gap-analysis/            # Gap analysis between stories and code
    multi-agent-review/      # Parallel multi-agent review
    validate/                # Story validation
    ...
docs/
  specialist-registry/       # Registry of forged specialist personas
scripts/
  validate-all-stories.sh    # Pre-batch story validation
```

---

## How to Add a New Builder Agent

Builders implement stories. They are matched via routing rules based on file patterns, keywords, and package indicators.

1. **Create the agent file** in `src/agents/builders/`. Use an existing builder (e.g., `frontend-react.md`) as a template. Extend `_base-builder.md`.

2. **Add routing rules** to `src/agent-routing.yaml` under `builder_routing`:

   ```yaml
   - id: your-builder-id
     agent: "agents/builders/your-builder.md"
     persona:
       name: "AgentName"       # Greek mythology name
       title: "Title"
       emoji: "..."
     match:
       file_patterns: [...]
       story_keywords: [...]
       package_indicators: [...]  # optional
   ```

   Rules are evaluated in order; first match wins. Place specific rules before general ones.

3. **Register in story-pipeline** by adding to `available_builders` in `src/workflows/story-pipeline/workflow.yaml`:

   ```yaml
   - id: your-builder-id
     agent: "agents/builders/your-builder.md"
     persona: { name: "AgentName", emoji: "..." }
   ```

4. **Add subagent type mapping** in `builder.subagent_type_routing` of `workflow.yaml` if the builder maps to a platform-specific agent type.

---

## How to Add a New Reviewer Agent

Reviewers perform adversarial code review from specific perspectives.

1. **Create the reviewer file** in `src/agents/reviewers/`. Include the persona, review focus, and evaluation criteria.

2. **Add routing rules** to `src/agent-routing.yaml` under `reviewer_routing`:

   ```yaml
   your_review_type:
     agent: "agents/reviewers/your-reviewer.md"
     persona:
       name: "AgentName"
       title: "Title"
       emoji: "..."
     always_include: false       # true if reviewer runs on every story
     match:
       file_patterns: [...]
       story_keywords: [...]
     priority: 6                 # execution order
   ```

3. **Register in story-pipeline** by adding to `reviewer.review_types` in `src/workflows/story-pipeline/workflow.yaml`.

---

## Workflow Modifications

Each workflow directory contains two files that must stay in sync:

- `workflow.yaml` -- Configuration: agent definitions, routing, model tiers, quality gates.
- `workflow.md` -- Instructions: phase-by-phase execution logic for the orchestrator.

When modifying a workflow:

- Agent configuration/routing changes go in `workflow.yaml`.
- Execution logic/phase behavior changes go in `workflow.md`.
- New agent roles in `workflow.yaml` must be referenced in `workflow.md` at the correct phase.
- New phases in `workflow.md` require corresponding agent entries in `workflow.yaml`.

---

## Naming Conventions

All agent names follow a **Greek mythology theme**:

| Role | Naming Pattern | Examples |
|------|---------------|----------|
| Builders | Titans/gods of creation and craft | Helios, Hephaestus, Athena |
| Reviewers | Guardians, judges, overseers | Cerberus, Hestia, Apollo |
| Validators | Truth-revealing figures | Argus, Nemesis |
| Support | Messengers, arbiters, memory keepers | Hermes, Themis, Mnemosyne |

Choose a name that fits the role category and has a thematic connection to the agent's domain.

---

## PR Conventions

- Use **conventional commits** in present tense: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- Target the `main` branch for all PRs.
- Keep PRs focused -- one agent addition or one workflow change per PR when possible.
- Do not commit secrets, API keys, or debug artifacts.

---

## Testing

Before submitting a PR:

1. **Validate YAML syntax**:

   ```bash
   npm run validate:yaml
   ```

2. **Run story validation** if your changes affect story processing:

   ```bash
   ./scripts/validate-all-stories.sh [story-dir]
   ```

   This checks that story files have all 12 required BMAD sections, sufficient tasks, and substantive content.

3. **Verify routing rules** manually. Confirm new `match` patterns do not conflict with existing rules (earlier rules take priority in `builder_routing`).

---

## Platform Support

Platform-specific launchers (Copilot skills, OpenCode agents, Codex instructions) are auto-generated from `.agent.yaml` and `workflow.yaml` files by BMAD's IDE manager. There are no hand-crafted adapters to maintain.

---

## Questions

Open an issue at [github.com/jonahschulte/pantheon/issues](https://github.com/jonahschulte/pantheon/issues).
