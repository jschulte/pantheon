# Phase 2: BUILD (2/7)
<!-- Part of Story Pipeline v1.2 — see workflow.md for config and routing -->
<!-- v1.2: Sisyphus Loop pattern replaces single-pass/chunking strategy -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔨 PHASE 2: BUILD (2/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sisyphus Loop — Iterate Until Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 1: Smart Builder Selection

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

### Step 2: Initialize Build Loop

```
# Count total and unchecked tasks
TOTAL_TASKS = grep -c '- \[.\]' {{story_file}}       # All checkboxes
UNCHECKED_TASKS = grep -c '- \[ \]' {{story_file}}    # Unchecked only

# Calculate iteration limit: enough passes to cover all tasks at ~30/pass, plus buffer
MAX_ITERATIONS = max(3, ceil(UNCHECKED_TASKS / 30) + 1)

# Initialize progress tracker
BUILD_PROGRESS = {
  "story_key": "{{story_key}}",
  "iterations": [],
  "total_tasks": TOTAL_TASKS,
  "tasks_remaining_start": UNCHECKED_TASKS,
  "codebase_patterns": []    # Accumulates learnings (like progress.txt)
}

ITERATION = 0
LAST_BUILDER_AGENT_ID = null
```

**WHY A LOOP:** Builder agents have an effective attention span of ~30-40 tasks.
A single-pass approach causes the builder to address only the most visible tasks
and silently drop the rest. The Sisyphus Loop (inspired by [snarktank/ralph](https://github.com/snarktank/ralph))
spawns a **fresh builder each iteration** with clean context — like Sisyphus resetting
at the bottom of the hill, but each time the hill is shorter because tasks get checked off.
Memory persists via artifacts, not accumulated context. Each iteration picks up where the last left off.

### Step 3: Build Loop

```
WHILE UNCHECKED_TASKS > 0 AND ITERATION < MAX_ITERATIONS:

  ITERATION += 1

  # 3.1 — Extract remaining unchecked tasks from current story file state
  REMAINING_TASKS = extract all '- [ ]' lines from {{story_file}}

  # 3.2 — Display iteration status
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔨 BUILD iteration {{ITERATION}}/{{MAX_ITERATIONS}}
  {{BUILDER_EMOJI}} {{BUILDER_NAME}} — {{UNCHECKED_TASKS}} tasks remaining
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  # 3.3 — Spawn FRESH builder (never resume previous)
  BUILDER_TASK = Task({
    subagent_type: "general-purpose",
    model: "opus",
    description: "{{BUILDER_EMOJI}} {{BUILDER_NAME}} building {{story_key}} [{{ITERATION}}/{{MAX_ITERATIONS}}]",
    prompt: `
<agent_persona>
[INLINE: Content from the selected builder file, e.g., agents/builders/backend-typescript.md]
</agent_persona>

<goal>
VERIFY and COMPLETE every unchecked task in story {{story_key}}.

This story may have prior implementation from an earlier pass. DO NOT assume prior work is correct.
For EACH task below, you MUST:
1. READ the relevant source file(s) to check if the implementation exists
2. If it EXISTS and is CORRECT → note it as verified in tasks_addressed with the file path and line
3. If it EXISTS but is WRONG or INCOMPLETE → fix it, note what you changed
4. If it DOES NOT EXIST → implement it from scratch

You MUST individually verify every single task. Do NOT extrapolate from a few checked tasks
that "the rest are probably done too." Each task is independent. Read the actual code for each one.

CRITICAL: Your tasks_addressed list must include a file path for EVERY task you claim is done.
If you cannot point to a specific file and line that satisfies a task, it is NOT done.

UNCHECKED TASKS ({{UNCHECKED_TASKS}} remaining):
{{REMAINING_TASKS}}
</goal>

<context>
<story>
[INLINE: Full story file content — for acceptance criteria, technical notes, business context]
</story>

{{IF playbooks loaded}}
<playbooks>
[INLINE: Playbook content that was loaded in Phase 1]
</playbooks>
{{ENDIF}}

{{IF ITERATION > 1}}
<previous_iterations>
This is iteration {{ITERATION}}. Previous builders have already made changes.
Do NOT redo their work — build on top of it. Read the current state of files before editing.

Learnings from prior iterations:
{{BUILD_PROGRESS.codebase_patterns | join('\n')}}

Files already modified:
{{BUILD_PROGRESS.iterations | map(i => i.files_modified) | flatten | unique | join('\n')}}
</previous_iterations>
{{ENDIF}}
</context>

<constraints>
- VERIFY then address ALL unchecked tasks listed above — every [ ] is mandatory
- For each task: READ the file, CONFIRM the implementation, cite the file:line in your report
- Do NOT bulk-report tasks as done. Each task requires individual file inspection.
- Code-level tasks (breadcrumbs, component migration, styling, test writing) are ALWAYS in scope
- **CRITICAL: Infrastructure-as-code tasks are ALWAYS in scope** — If a task says "write Terraform module", "create Dockerfile", "add GitHub Action workflow", "write deployment script" — YOU WRITE IT. Infrastructure code is code. The ONLY exception is tasks requiring actual deployment/apply commands that need live AWS credentials. Writing the .tf/.yml/.dockerfile IS your job.
- **CRITICAL: NEVER self-defer tasks** — You cannot decide a task is "too hard", "infrastructure only", "requires manual work", or "out of scope". If the task involves writing code, configuration, tests, or documentation — DO IT. The ONLY tasks you cannot complete are: (1) tasks requiring external human decisions (stakeholder approval, user research), (2) tasks requiring live production access you don't have (run terraform apply in prod, deploy to AWS, merge PR). Everything else is actionable.
- **DELEGATION IS MANDATORY FOR SPECIALIZED WORK** — You have access to the Task tool. When you encounter tasks requiring specialized expertise (infrastructure, testing, security, database), you MUST spawn specialized sub-agents using appropriate subagent_type (specialist-terraform, engineer-deployment, database-administrator, etc.). Collect their work and include it in your completion artifact. You are responsible for ALL tasks - either do them yourself OR delegate them. Never say "cannot complete" without attempting delegation.
- Visual verification, layout checks, and responsive testing are automatable via
  Playwright screenshots + LLM visual inspection. The only "human-only" tasks are
  non-technical organizational ones (stakeholder sign-off, user interviews, etc.)
- DO NOT update story checkboxes (Orchestrator does this after verifying your work)
- DO NOT commit changes yet (happens after review passes)
- If you discover a reusable pattern or gotcha, include it in your learnings

CONTEXT BUDGET — STOP BEFORE YOU DEGRADE:
- You have a finite context window. Quality degrades sharply past ~85% usage.
- Track your progress: after every ~10 tasks, assess whether you are still producing
  quality work. Signs of degradation: rushing through verification, skipping file reads,
  giving vague evidence, or feeling "behind."
- When you notice degradation OR have addressed ~25-30 tasks, STOP IMMEDIATELY.
  Report status as "PARTIAL", list remaining tasks, and return your completion artifact.
  A fresh builder with clean context will pick up where you left off.
- It is ALWAYS better to stop early with high-quality verified work than to push through
  and produce sloppy, unverified results. The loop exists precisely for this reason.
</constraints>

<completion_format>
Return this JSON artifact when done:

{
  "agent": "{{BUILDER_NAME | lowercase}}",
  "story_key": "{{story_key}}",
  "iteration": {{ITERATION}},
  "status": "COMPLETE" | "PARTIAL",
  "files_created": [...],
  "files_modified": [...],
  "tests_added": { "total": N, "passing": N },
  "tasks_addressed": [
    {"task": "task 1 text", "evidence": "path/to/file.ts:42 — implementation description", "action": "verified|fixed|implemented"},
    ...
  ],
  "tasks_remaining": ["task text — REASON if unable to complete"],
  "learnings": [
    "Pattern: this codebase uses X for Y",
    "Gotcha: don't forget to Z when changing W",
    "Context: the component for X lives in path/to/file"
  ]
}

Save to: {{sprint_artifacts}}/completions/{{story_key}}-builder.json
</completion_format>
`
  })

  # 3.4 — Store builder agent ID (last iteration's builder used for Phase 5 REFINE resume)
  LAST_BUILDER_AGENT_ID = {{extract agent_id from BUILDER_TASK result}}

  # 3.5 — Parse builder's completion artifact
  BUILDER_RESULT = Read {{sprint_artifacts}}/completions/{{story_key}}-builder.json

  # 3.6 — Accumulate learnings (Sisyphus carries knowledge between iterations)
  BUILD_PROGRESS.codebase_patterns += BUILDER_RESULT.learnings
  BUILD_PROGRESS.iterations.append({
    "iteration": ITERATION,
    "tasks_addressed": BUILDER_RESULT.tasks_addressed,
    "tasks_remaining": BUILDER_RESULT.tasks_remaining,
    "files_modified": BUILDER_RESULT.files_modified,
    "status": BUILDER_RESULT.status
  })

  # 3.7 — Recount unchecked tasks from the ACTUAL story file
  #        (Builder may have addressed tasks without us knowing the exact mapping)
  #        Use gap analysis: scan codebase for evidence of task completion
  UNCHECKED_TASKS = grep -c '- \[ \]' {{story_file}}

  # 3.8 — Check for stall (builder made no progress)
  IF BUILDER_RESULT.tasks_addressed is empty AND ITERATION > 1:
    → Builder stalled. Log reason and break loop.
    → This prevents infinite loops when tasks are genuinely blocked.
    BREAK

  # 3.9 — If builder reports COMPLETE and addressed all tasks → done
  IF BUILDER_RESULT.status == "COMPLETE" AND BUILDER_RESULT.tasks_remaining is empty:
    BREAK

END WHILE
```

**WHY FRESH BUILDERS EACH ITERATION:** Resuming the same agent piles all prior context
(files read, decisions made, tests written) on top of new work. By iteration 3, the agent
is drowning in its own history instead of focusing on the remaining tasks. The problem
is too much context, not too little. A fresh agent with a clean slate, the unchecked task list,
and concise learnings from prior iterations produces dramatically better results.

### Step 4: Build Loop Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔨 BUILD COMPLETE — {{ITERATION}} iteration(s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Started:  {{BUILD_PROGRESS.tasks_remaining_start}} unchecked tasks
Finished: {{UNCHECKED_TASKS}} unchecked tasks
Addressed: {{BUILD_PROGRESS.tasks_remaining_start - UNCHECKED_TASKS}} tasks across {{ITERATION}} iterations
Learnings: {{BUILD_PROGRESS.codebase_patterns | length}} patterns captured
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Save consolidated build progress:**
```
Write BUILD_PROGRESS to {{sprint_artifacts}}/completions/{{story_key}}-build-progress.json
```

### Update Progress

Use Write tool to update `{{sprint_artifacts}}/completions/{{story_key}}-progress.json`:
```json
{
  "current_phase": "VERIFY",
  "phases": {
    "PREPARE": { "status": "complete", "details": "..." },
    "BUILD": {
      "status": "complete",
      "details": "{{ITERATION}} iterations, {{tasks_addressed}} tasks, {{files_changed}} files, {{tests_added}} tests",
      "iterations": "{{ITERATION}}",
      "tasks_start": "{{BUILD_PROGRESS.tasks_remaining_start}}",
      "tasks_end": "{{UNCHECKED_TASKS}}"
    },
    "VERIFY": { "status": "in_progress", "details": "{{AGENT_COUNT}} reviewers" }
  },
  "metrics": {
    "files_changed": "{{files_created + files_modified}}",
    "lines_added": "{{lines_added}}",
    "tests_added": "{{tests_added}}",
    "build_iterations": "{{ITERATION}}"
  }
}
```

**📢 Orchestrator says:**
> "{{BUILDER_NAME}} completed the build in {{ITERATION}} iteration(s)! Started with {{BUILD_PROGRESS.tasks_remaining_start}} unchecked tasks, {{UNCHECKED_TASKS}} remain. Now sending in the review squad — **{{AGENT_COUNT}} agents** will verify the work in parallel."
