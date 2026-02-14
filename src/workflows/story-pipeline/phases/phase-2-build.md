# Phase 2: BUILD (2/7)
<!-- Part of Story Pipeline v1.1 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔨 PHASE 2: BUILD (2/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Smart Builder Selection + TDD Implementation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 1: Smart Builder Selection (v5.0)

**Load the agent routing configuration:**
```
Read: {project-root}/_bmad/pantheon/agent-routing.yaml
```

**Analyze story for routing signals:**
1. Extract file patterns from story tasks (e.g., `app/api/**`, `components/**`, `prisma/**`)
2. Extract keywords from story content (e.g., "API", "component", "migration")
3. Check package.json for framework indicators (react, vue, fastapi, etc.)

**Match against builder_routing rules (first match wins):**
- `frontend-react` → Apollo ⚛️ (React/Next.js components)
- `backend-typescript` → Hephaestus 🔥 (API routes, services)
- `database-prisma` → Athena 🦉 (migrations, schema changes)
- `infrastructure` → Atlas 🌍 (CI/CD, Docker, Terraform)
- `general` → Metis 🔨 (fallback for mixed/unclear stories)

**Load the matched specialized builder prompt:**
```
# Example: If story touches app/api/** files
Read: {project-root}/_bmad/pantheon/agents/builders/backend-typescript.md
BUILDER_NAME = "Hephaestus"
BUILDER_EMOJI = "🔥"
BUILDER_SPECIALTY = "Backend TypeScript API Development"
```

### Step 2: Spawn Specialized Builder

**Display selected builder:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔨 PHASE 2: BUILD - {{BUILDER_EMOJI}} {{BUILDER_NAME}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{BUILDER_NAME}} is building... this may take a few minutes.
Selected for: {{BUILDER_SPECIALTY}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Spawn builder Task with data payload (not step-by-step instructions):**

The builder's agent definition (e.g., `agents/builders/backend-typescript.md`) contains the full process (TDD, gap analysis, etc.). The orchestrator provides context and goals only.

```
BUILDER_TASK = Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "{{BUILDER_EMOJI}} {{BUILDER_NAME}} building {{story_key}}",
  prompt: `
<agent_persona>
[INLINE: Content from the selected builder file, e.g., agents/builders/backend-typescript.md]
</agent_persona>

<goal>
Implement story {{story_key}} following your agent definition process.
</goal>

<context>
<story>
[INLINE: Full story file content]
</story>

{{IF playbooks loaded}}
<playbooks>
[INLINE: Playbook content that was loaded in Phase 1]
</playbooks>
{{ENDIF}}
</context>

<constraints>
- Follow the patterns and conventions in the codebase
- DO NOT update story checkboxes (Orchestrator does this)
- DO NOT commit changes yet (happens after review passes)
</constraints>

<completion_format>
{
  "agent": "{{BUILDER_NAME | lowercase}}",
  "story_key": "{{story_key}}",
  "status": "SUCCESS" | "FAILED",
  "files_created": [...],
  "files_modified": [...],
  "tests_added": { "total": N, "passing": N },
  "tasks_addressed": ["task 1", "task 2", ...],
  "playbooks_reviewed": ["playbook1.md", ...]
}

Save to: {{sprint_artifacts}}/completions/{{story_key}}-metis.json
</completion_format>
`
})

BUILDER_AGENT_ID = {{extract agent_id from Task result}}
```

**Store builder agent ID for resume in Phase 5.**

### Update Progress

Use Write tool to update `{{sprint_artifacts}}/completions/{{story_key}}-progress.json`:
```json
{
  "current_phase": "VERIFY",
  "phases": {
    "PREPARE": { "status": "complete", "details": "..." },
    "BUILD": { "status": "complete", "details": "{{files_created}} files, {{lines_added}} lines, {{tests_added}} tests" },
    "VERIFY": { "status": "in_progress", "details": "{{AGENT_COUNT}} reviewers" },
    ...
  },
  "metrics": {
    "files_changed": {{files_created + files_modified}},
    "lines_added": {{lines_added}},
    "tests_added": {{tests_added}}
  }
}
```

**📢 Orchestrator says:**
> "Metis has finished building! She created {{files_created}} files and {{tests_added}} tests. Now I'm sending in the review squad - **{{AGENT_COUNT}} agents** will verify the work in parallel. This goes fast since they run simultaneously."
