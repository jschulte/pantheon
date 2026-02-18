# Phase 1.5: FORGE (Pygmalion)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗿 PHASE 1.5: FORGE (Pygmalion)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Forging domain-specific specialist personas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Invoke Pygmalion

Pygmalion analyzes the scoped code to identify domain-specific expertise gaps in the standard Pantheon reviewers. It checks the specialist registry first to reuse or evolve existing specialists.

```
IF persona_forging.enabled AND estimated_complexity >= "light":

  # Load specialist registry for Pygmalion context
  REGISTRY_INDEX = read("docs/specialist-registry/_index.json") OR { "version": "1.0", "specialists": [] }

  Task({
    subagent_type: "general-purpose",
    model: "opus",
    description: "🗿 Pygmalion forging specialists for {{scope_id}}",
    prompt: `
  <agent_persona>
  [INLINE: Content from story-pipeline/agents/pygmalion.md]
  </agent_persona>

  Analyze this code scope and forge specialist personas if the Pantheon leaves coverage gaps.
  Check the specialist registry first — reuse or evolve existing specialists when possible.

  <scope>
  Files: {{scoped_files}}
  Focus: {{FOCUS_PROMPT or "standard hardening"}}
  </scope>

  <specialist_registry>
  [INLINE: Content of docs/specialist-registry/_index.json]
  </specialist_registry>

  <project_context>
  [INLINE: package.json dependencies, project structure]
  </project_context>

  Output your analysis as the Pygmalion JSON artifact.
  Save to: {{sprint_artifacts}}/hardening/{{scope_id}}-pygmalion.json
  `
  })

  FORGED_SPECS = read("{{sprint_artifacts}}/hardening/{{scope_id}}-pygmalion.json")

  # --- VALIDATE OUTPUT (see story-pipeline/phases/phase-1.5-forge.md for full validation logic) ---
  # Validate against: src/schemas/pygmalion-output.schema.json
  # Key checks: required fields, specialist count <= tier max, agent type whitelist,
  # free-text field sanitization (reject if contains <system, IGNORE PREVIOUS, etc.)
  # If validation fails: FORGED_SPECS = { forged_specialists: [], skipped: true, reason: "Validation failure" }

ELSE:
  FORGED_SPECS = { forged_specialists: [], skipped: true }
```

### Conduct Live Research for Forged Specialists

For each newly forged or evolved specialist, spawn a research agent to compile authoritative
reference documentation. This transforms specialists from "persona titles" into genuine
domain experts backed by verified knowledge.

```
NEEDS_RESEARCH = []
FOR EACH spec IN FORGED_SPECS.forged_specialists:
  IF spec.registry_action == "forged_new":
    NEEDS_RESEARCH.push(spec)
  ELIF spec.registry_action == "evolved":
    existing_file = "docs/specialist-registry/{{spec.id}}.json"
    IF file_exists(existing_file):
      existing = read(existing_file)
      IF NOT existing.knowledge_file:
        NEEDS_RESEARCH.push(spec)

IF NEEDS_RESEARCH.length > 0:
  echo "📚 Conducting live research for {{NEEDS_RESEARCH.length}} specialist(s)..."

  FOR EACH spec IN NEEDS_RESEARCH (max 5 parallel):
    Task({
      subagent_type: "search-web",
      model: "opus",
      run_in_background: true,
      description: "📚 Research for {{spec.name}} ({{spec.title}})",
      prompt: `
        Compile authoritative, LLM-friendly reference documentation for a
        {{spec.title}} code reviewer.

        This documentation will be injected into a code review agent's prompt
        to help it catch implementation errors that codebase analysis alone would miss.

        Technologies: {{spec.technologies}}
        Review focus: {{spec.review_focus}}

        For each technology cluster, research:
        - Official documentation and best practices
        - Security considerations and common vulnerabilities
        - Compliance/legal requirements (if applicable)
        - Known anti-patterns and community gotchas
        - Framework-specific implementation patterns

        Write as a single markdown document with DO / DON'T patterns,
        code examples, and a quick-reference review checklist.
        Target: 20-50KB.
        Save to: docs/specialist-registry/knowledge/{{spec.id}}-reference.md
      `
    })

  # Wait for completion, then set knowledge_file on each spec
  FOR EACH spec IN NEEDS_RESEARCH:
    knowledge_path = "knowledge/{{spec.id}}-reference.md"
    IF file_exists("docs/specialist-registry/{{knowledge_path}}"):
      spec.knowledge_file = knowledge_path
```

### Update Specialist Registry

After Pygmalion returns, persist new/evolved specialists to the registry.
**Concurrency:** In swarm mode, acquire `docs/specialist-registry/.write-lock` before writing
(see story-pipeline/phases/phase-1.5-forge.md for full locking protocol).

```
FOR EACH spec IN FORGED_SPECS.forged_specialists:
  IF spec.registry_action == "forged_new":
    Write("docs/specialist-registry/{{spec.id}}.json", {
      "registry_metadata": {
        "spec_version": 1,
        "created_for": "{{scope_id}}",
        "last_used": "{{scope_id}}",
        "usage_history": ["{{scope_id}}"]
      },
      ...spec fields...
    })
    Append to REGISTRY_INDEX.specialists

  ELIF spec.registry_action == "evolved":
    existing = read("docs/specialist-registry/{{spec.id}}.json")
    existing.registry_metadata.spec_version += 1
    existing.registry_metadata.last_used = "{{scope_id}}"
    existing.registry_metadata.usage_history.push("{{scope_id}}")
    Write("docs/specialist-registry/{{spec.id}}.json", existing)
    Update REGISTRY_INDEX entry

  ELIF spec.registry_action == "reused":
    Update last_used in REGISTRY_INDEX and spec file

Write("docs/specialist-registry/_index.json", REGISTRY_INDEX)
```

**Orchestrator says (if specialists assembled):**
> "Pygmalion assembled **{{count}} specialist(s)** ({{new}} new, {{evolved}} evolved, {{reused}} reused)."

**Orchestrator says (if no specialists):**
> "Pygmalion confirmed Pantheon coverage is sufficient. Proceeding with standard reviewers."
