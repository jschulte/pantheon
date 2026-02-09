# Phase 1.5: FORGE (Pygmalion)
<!-- Part of Story Pipeline v7.3 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗿 PHASE 1.5: FORGE (Pygmalion)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Domain analysis + specialist persona forging
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Complexity Gate

```
IF COMPLEXITY in [trivial, micro]:
  FORGED_SPECS = { forged_specialists: [], skipped: true }
  → Skip Pygmalion entirely. Pantheon coverage is sufficient.
  → Proceed to Phase 2.

ELSE:
  → Invoke Pygmalion to analyze domain and forge specialists.
```

### Invoke Pygmalion

```
# Load specialist registry for Pygmalion context
REGISTRY_INDEX = read("docs/specialist-registry/_index.json") OR { "version": "1.0", "specialists": [] }

PYGMALION_TASK = Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "🗿 Pygmalion forging specialists for {{story_key}}",
  prompt: `
<agent_persona>
[INLINE: Content from agents/pygmalion.md]
</agent_persona>

Analyze this story and its domain context. Forge specialist personas if the fixed Pantheon leaves coverage gaps.
Check the specialist registry first — reuse or evolve existing specialists when possible.

<story>
[INLINE: Full story file content]
</story>

<complexity>
Tier: {{COMPLEXITY}}
Max specialists: {{max_specialists_for_tier}}
</complexity>

<specialist_registry>
[INLINE: Content of docs/specialist-registry/_index.json]
</specialist_registry>

<playbooks>
[INLINE: Playbook content loaded in Phase 1]
</playbooks>

<project_context>
[INLINE: package.json dependencies, project structure summary]
</project_context>

Output your analysis as the Pygmalion JSON artifact.
Save to: docs/sprint-artifacts/completions/{{story_key}}-pygmalion.json
`
})
```

### Process Pygmalion Output

```
FORGED_SPECS = read("docs/sprint-artifacts/completions/{{story_key}}-pygmalion.json")

IF FORGED_SPECS.forged_specialists.length > 0:
  echo "🗿 Pygmalion assembled {{count}} specialist(s):"
  FOR EACH spec IN FORGED_SPECS.forged_specialists:
    IF spec.registry_action == "reused":
      echo "  {{spec.emoji}} {{spec.name}} — {{spec.title}} (REUSED, score: {{spec.registry_match_score}})"
    ELIF spec.registry_action == "evolved":
      echo "  {{spec.emoji}} {{spec.name}} — {{spec.title}} (EVOLVED)"
    ELSE:
      echo "  {{spec.emoji}} {{spec.name}} — {{spec.title}} (NEW)"

ELSE:
  echo "🗿 Pygmalion: No gaps identified — Pantheon coverage sufficient."
```

### Update Specialist Registry

After Pygmalion returns, persist new/evolved specialists to the registry.
Pygmalion handles the matching logic; the orchestrator handles file I/O.

```
FOR EACH spec IN FORGED_SPECS.forged_specialists:
  IF spec.registry_action == "forged_new":
    # Write new specialist file
    Write("docs/specialist-registry/{{spec.id}}.json", {
      "registry_metadata": {
        "spec_version": 1,
        "created_for": "{{story_key}}",
        "last_used": "{{story_key}}",
        "usage_history": ["{{story_key}}"]
      },
      ...spec fields...
    })
    # Append to _index.json
    Append to REGISTRY_INDEX.specialists: {
      "id": spec.id,
      "name": spec.name,
      "emoji": spec.emoji,
      "title": spec.title,
      "technologies": [extracted from spec],
      "domains": [extracted from spec],
      "file": "{{spec.id}}.json",
      "spec_version": 1,
      "created_for": "{{story_key}}",
      "last_used": "{{story_key}}"
    }

  ELIF spec.registry_action == "evolved":
    # Read existing spec, merge new items, bump version
    existing = read("docs/specialist-registry/{{spec.id}}.json")
    existing.registry_metadata.spec_version += 1
    existing.registry_metadata.last_used = "{{story_key}}"
    existing.registry_metadata.usage_history.push("{{story_key}}")
    # Merge new review_focus, technology_checklist, known_gotchas
    Write("docs/specialist-registry/{{spec.id}}.json", existing)
    # Update _index.json entry
    Update REGISTRY_INDEX entry: spec_version, last_used

  ELIF spec.registry_action == "reused":
    # Update last_used tracking only
    Update REGISTRY_INDEX entry: last_used = "{{story_key}}"
    existing = read("docs/specialist-registry/{{spec.id}}.json")
    existing.registry_metadata.last_used = "{{story_key}}"
    existing.registry_metadata.usage_history.push("{{story_key}}")
    Write("docs/specialist-registry/{{spec.id}}.json", existing)

Write("docs/specialist-registry/_index.json", REGISTRY_INDEX)
```

**📢 Orchestrator says (if specialists assembled):**
> "Pygmalion has assembled **{{count}} specialist(s)** to augment the review team ({{new}} new, {{evolved}} evolved, {{reused}} reused). These specialists will join the Pantheon reviewers in Phase 3."

**📢 Orchestrator says (if no specialists):**
> "Pygmalion analyzed the domain and confirmed the Pantheon reviewers have full coverage. No additional specialists needed."
