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
Save to: {{sprint_artifacts}}/completions/{{story_key}}-pygmalion.json
`
})
```

### Validate Pygmalion Output (H2 — Security Hardening)

Before consuming Pygmalion's output, the orchestrator validates structure and sanitizes content.
This prevents malicious story content from propagating through forged specialist prompts.

```
FORGED_SPECS = read("{{sprint_artifacts}}/completions/{{story_key}}-pygmalion.json")

# --- STRUCTURAL VALIDATION ---
# Required top-level fields
ASSERT FORGED_SPECS has keys: agent, story_key, complexity_tier, skipped, forged_specialists, summary
ASSERT FORGED_SPECS.agent == "pygmalion"
ASSERT FORGED_SPECS.forged_specialists is Array

# Enforce complexity gate limits
MAX_ALLOWED = complexity_routing[COMPLEXITY].max_specialists  # from agent-routing.yaml
IF FORGED_SPECS.forged_specialists.length > MAX_ALLOWED:
  WARN "Pygmalion returned {{count}} specialists but tier {{COMPLEXITY}} allows max {{MAX_ALLOWED}}. Truncating."
  FORGED_SPECS.forged_specialists = FORGED_SPECS.forged_specialists[0:MAX_ALLOWED]

# --- PER-SPECIALIST VALIDATION ---
FOR EACH spec IN FORGED_SPECS.forged_specialists:
  # Required fields
  ASSERT spec has keys: id, name, emoji, title, role_type, domain_expertise, review_focus, technology_checklist
  ASSERT spec.role_type IN ["reviewer", "builder"]
  ASSERT spec.id matches /^[a-z0-9-]+$/  # No special characters in IDs

  # Whitelist suggested_claude_agent_type (prevents arbitrary agent types)
  ALLOWED_AGENT_TYPES = [
    "general-purpose", "auditor-security", "dev-frontend", "dev-typescript",
    "dev-python", "dev-go", "dev-java", "dev-rust", "dev-csharp",
    "architect-backend", "database-administrator", "specialist-graphql",
    "dev-ios", "dev-android", "dev-php"
  ]
  IF spec.suggested_claude_agent_type NOT IN ALLOWED_AGENT_TYPES:
    WARN "Unknown agent type '{{spec.suggested_claude_agent_type}}' — defaulting to general-purpose"
    spec.suggested_claude_agent_type = "general-purpose"

  # Sanitize free-text fields (strip potential prompt injection)
  FOR EACH field IN [domain_expertise, issue_classification_guidance]:
    IF spec[field] contains any of: "<system", "</system", "<tool_use", "IGNORE PREVIOUS", "DISREGARD":
      WARN "Suspicious content in Pygmalion output field '{{field}}' for specialist '{{spec.id}}'. Removing specialist."
      REMOVE spec from FORGED_SPECS.forged_specialists
      CONTINUE to next specialist

  # Array length limits
  ASSERT spec.review_focus.length <= 10
  ASSERT spec.technology_checklist.length <= 15
  ASSERT spec.known_gotchas.length <= 10 (if present)

IF validation fails for any ASSERT:
  WARN "Pygmalion output failed validation. Falling back to Pantheon-only review."
  FORGED_SPECS = { forged_specialists: [], skipped: true, reason: "Validation failure" }
```

### Process Pygmalion Output

```

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

**Registry Write Lock (H3 — Concurrency Safety):**
In swarm mode, multiple workers may forge specialists concurrently. Use directory-based
locking (same protocol as the git commit lock) to prevent registry corruption.

```
# --- ACQUIRE REGISTRY LOCK ---
# Only needed in swarm/parallel mode. Sequential mode can skip.
IF execution_mode == "swarm":
  MAX_RETRIES = 5
  RETRY_DELAY = 2  # seconds, doubles each retry

  FOR attempt IN 1..MAX_RETRIES:
    TRY: mkdir docs/specialist-registry/.write-lock
    IF SUCCESS:
      Write("docs/specialist-registry/.write-lock/owner", "{{worker_id}} {{timestamp}}")
      BREAK
    IF FAILED:
      # Check for stale lock (>3 minutes old)
      owner_info = read("docs/specialist-registry/.write-lock/owner")
      IF owner_info.timestamp is older than 3 minutes:
        rm -rf docs/specialist-registry/.write-lock
        CONTINUE  # Retry
      ELSE:
        sleep(RETRY_DELAY)
        RETRY_DELAY = RETRY_DELAY * 2
        CONTINUE

  IF all retries exhausted:
    WARN "Could not acquire registry lock. Skipping registry update (specialist will still be used for this story)."
    → Skip registry write, proceed to Phase 2.

  # Re-read registry index after acquiring lock (another worker may have updated it)
  REGISTRY_INDEX = read("docs/specialist-registry/_index.json") OR { "version": "1.0", "specialists": [] }
```

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

# --- RELEASE REGISTRY LOCK ---
IF execution_mode == "swarm":
  rm -rf docs/specialist-registry/.write-lock
```

**📢 Orchestrator says (if specialists assembled):**
> "Pygmalion has assembled **{{count}} specialist(s)** to augment the review team ({{new}} new, {{evolved}} evolved, {{reused}} reused). These specialists will join the Pantheon reviewers in Phase 3."

**📢 Orchestrator says (if no specialists):**
> "Pygmalion analyzed the domain and confirmed the Pantheon reviewers have full coverage. No additional specialists needed."
