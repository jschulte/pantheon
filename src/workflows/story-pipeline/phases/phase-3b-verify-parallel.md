# Phase 3B: VERIFY — Parallel Review (3/7)
<!-- Part of Story Pipeline v1.1 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👁️ PHASE 3B: VERIFY — Parallel (3/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Review Mode: parallel
Complexity: complex | critical
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Review Mode Gate

```
ASSERT COMPLEXITY in [complex, critical]
  → If COMPLEXITY in [trivial, micro, light, standard]:
    → Load phase-3a-verify-consolidated.md instead
```

---

### Parallel Reviewers (complex/critical)

**Multiple specialized agents for maximum thoroughness.**

**CRITICAL: Spawn ALL agents in ONE message (parallel execution)**

#### Pre-Read & Context Assembly (Token Optimization v7.1)

Before spawning any reviewer, the orchestrator reads ALL implementation files ONCE and constructs:

1. **A structural digest** (~200-400 lines) containing:
   - File inventory (path, line count, type classification)
   - Function/class/component signatures per file (exports only for large files)
   - Import graph (which files import what)
   - Story task-to-file mapping from Metis output

2. **Classified file buckets** for targeted reviewer context

**File Classification (first-match rules by path/extension):**

```
CLASSIFY each file from metis.json output:

test:       *test*, *spec*, __tests__/*, *.test.ts, *.spec.ts
migration:  *migration*, prisma/migrations/*
config:     *.config.*, .env*, package.json, tsconfig*, next.config*
route:      *route*, *router*, *endpoint*, app/api/*, pages/api/*
auth:       *auth*, *session*, *token*, *credential*, *permission*, *rbac*, *middleware*
ui:         *component*, *page.tsx, *layout*, *template*, *.css, *.scss
database:   *prisma*, *schema*, *model*, *repository*, *dao*, *query*, *migration*
types:      *types*, *interfaces*, *enums*, *.d.ts
security:   *crypto*, *encrypt*, *hash*, *sanitize*, *validate*
logic:      everything else (services, utils, lib, helpers, etc.)
```

**Build the structural digest:**

```
STRUCTURAL_DIGEST = ""

# 1. File inventory table
STRUCTURAL_DIGEST += "## File Inventory\n"
STRUCTURAL_DIGEST += "| File | Lines | Type | Exports |\n"
FOR EACH file IN metis_files:
  content = Read(file)
  line_count = content.lines.length
  file_type = classify(file)
  exports = extract_export_signatures(content)  # function/class/const names + params
  STRUCTURAL_DIGEST += "| {file} | {line_count} | {file_type} | {exports} |\n"

# 2. Import graph
STRUCTURAL_DIGEST += "\n## Import Graph\n"
FOR EACH file IN metis_files:
  imports = extract_imports(content)
  STRUCTURAL_DIGEST += "{file} imports: {imports}\n"

# 3. Task-to-file mapping (from metis.json tasks_addressed)
STRUCTURAL_DIGEST += "\n## Task-to-File Mapping\n"
FOR EACH task IN metis.tasks_addressed:
  related_files = files where task is implemented
  STRUCTURAL_DIGEST += "- {task} → {related_files}\n"

# Budget: truncate to ~400 lines. For 40+ file implementations,
# show export-level signatures only (no function bodies).
```

**Partition files by reviewer concern:**

```
# Full context agents (cross-cutting — receive ALL files inline):
ARGUS_FILES   = ALL metis_files     # Must verify every task with file:line
HESTIA_FILES  = ALL metis_files     # Architecture is inherently cross-cutting

# Focused context agents (naturally scoped — receive subset + digest):
NEMESIS_FILES  = files classified as: test
                 # Gets production signatures via digest
CERBERUS_FILES = files classified as: route, auth, database, security, config
                 # + any file containing: password, secret, token, cookie, session, cors, csrf
APOLLO_FILES   = files classified as: logic, route, database, types
ARETE_FILES    = ALL metis_files EXCEPT files classified as: test
                 # Reviews production code quality, skips test files

# Forged specialists: match spec.review_focus keywords against classifications.
# If unclear or keywords span 3+ categories → ALL files.
```

**Cache-optimized prompt structure:**

All reviewer prompts share an IDENTICAL prefix so the API prompt cache pays for it once:

```
[IDENTICAL PREFIX — cached after agent #1]
  <story>{{story content}}</story>
  <structural_digest>{{digest built above}}</structural_digest>
  <metis_completion>{{metis.json summary}}</metis_completion>

[AGENT-SPECIFIC — varies per agent]
  <files_for_review>{{partitioned file contents}}</files_for_review>
  <agent_persona>{{role + instructions}}</agent_persona>
```

**IMPORTANT:** The `<story>`, `<structural_digest>`, and `<metis_completion>` blocks MUST appear in the same order with identical content across all prompts. Any difference breaks the cache prefix.

---

#### Spawn All Reviewers (Cache-Optimized Prompts)

**Build TWO prefix variants — one full, one blind:**

```
# SHARED_PREFIX_FULL: Used by Nemesis, Cerberus, Apollo, Hestia, Arete, forged specialists
# Includes builder completion artifact, structural digest, and playbook guidance for informed review.
SHARED_PREFIX_FULL = `
<story>
[INLINE: Full story file content — identical for all reviewers]
</story>

<structural_digest>
[INLINE: The structural digest built above — identical for all reviewers]
</structural_digest>

<metis_completion>
[INLINE: Summary from metis.json — files_created, files_modified, tasks_addressed]
</metis_completion>

<playbook_guidance>
[CONDITIONAL — included only if playbooks were loaded in Phase 1]

IF total loaded playbook tokens < 2000:
  [INLINE: Compact summary of all loaded playbooks — gotchas + anti-patterns only, no code examples]

ELIF total loaded playbook tokens >= 2000:
  [INLINE: Top 5 highest-priority entries only (gotchas + anti-patterns)]
  Note: Full playbooks available on disk at docs/implementation-playbooks/

IF no playbooks loaded:
  [OMIT this entire block]

Use these entries to flag violations — if the implementation contradicts a known gotcha or matches a documented anti-pattern, classify as MUST_FIX.
</playbook_guidance>
`

# SHARED_PREFIX_BLIND: Used by Argus (Inspector) ONLY
# Excludes metis.json, builder plan, and completion artifact.
# Argus verifies against original story requirements + actual code only.
# This prevents confirmation bias — Argus can't just check "did they do what they said"
# and must independently verify "did they do what the story needed."
SHARED_PREFIX_BLIND = `
<story>
[INLINE: Full story file content — identical for all reviewers]
</story>

<structural_digest>
[INLINE: The structural digest built above — file inventory and imports only, NO task-to-file mapping]
</structural_digest>
`
```

**Why blind context for Argus?** When a reviewer sees the builder's completion artifact ("I implemented tasks 1-5 in these files"), they tend to verify "did the builder do what they claimed" rather than independently checking "does the code satisfy the story requirements." Argus reviews blind to prevent this confirmation bias.

### Argus (Inspector) - ALWAYS SPAWN — Blind Context

**Argus uses SHARED_PREFIX_BLIND** — no builder completion artifact, no builder plan.
This forces independent verification against story requirements, not builder claims.

```
Task({
  subagent_type: "testing-suite:test-engineer",
  model: "opus",
  description: "👁️ Argus inspecting {{story_key}}",
  prompt: `
${SHARED_PREFIX_BLIND}

<files_for_review>
[INLINE: ALL implementation file contents — Argus needs everything]
</files_for_review>

You are ARGUS 👁️ - The 100-Eyed Giant.

You see EVERYTHING. Nothing escapes your gaze.

<goal>
Independently verify that every story task is implemented with file:line code citations.
You have the story requirements and the code — verify by tracing execution paths,
not by checking a builder's self-reported completion list.
Run verification checks (type-check, lint, tests, build).
Every task must have evidence: file:line, code snippet, verdict.
</goal>

<blind_mode>
You intentionally do NOT have the builder's completion artifact or implementation plan.
Verify against the STORY REQUIREMENTS, not against what the builder claims to have done.
This is by design — your value is independent verification.
</blind_mode>

<issue_classification>
For EACH issue you find, classify it:
- MUST_FIX: Blocks completion (security, correctness, tests fail)
- SHOULD_FIX: Real issue but non-blocking
- STYLE: Preference only
</issue_classification>

Save to: {{sprint_artifacts}}/completions/{{story_key}}-argus.json
`
})
```

### Nemesis (Test Quality) - Skip for trivial/micro — Focused Context (test files)

```
Task({
  subagent_type: "testing-suite:test-engineer",
  model: "opus",
  description: "🧪 Nemesis reviewing tests for {{story_key}}",
  prompt: `
${SHARED_PREFIX_FULL}

<files_for_review>
[INLINE: NEMESIS_FILES — test files only. Production signatures are in the structural digest above.]
</files_for_review>

You are NEMESIS 🧪 - Goddess of Retribution and Balance.

You find what's missing. You expose what's weak.

The structural digest above contains production file signatures so you can assess coverage without reading every production file. If you need to inspect a specific production file's implementation details, use the Read tool — this is your escape hatch.

<objective>
Review test files for quality:
- Happy path tested?
- Edge cases (null, empty, invalid)?
- Error conditions handled?
- Assertions meaningful?
- Tests deterministic?
</objective>

<issue_classification>
Classify each issue: MUST_FIX / SHOULD_FIX / STYLE
</issue_classification>

Save to: {{sprint_artifacts}}/completions/{{story_key}}-nemesis.json
`
})
```

### Cerberus (Security) - standard+ — Focused Context (security-relevant files)

```
Task({
  subagent_type: "auditor-security",
  model: "opus",
  description: "🔐 Cerberus guarding {{story_key}}",
  prompt: `
${SHARED_PREFIX_FULL}

<files_for_review>
[INLINE: CERBERUS_FILES — route, auth, database, security, config files]
</files_for_review>

You are CERBERUS 🔐 - The Three-Headed Guardian.

Nothing unsafe passes your gates.

The structural digest above shows ALL files and their exports. You have been given the security-relevant files inline. If you need to inspect additional files (e.g., a utility referenced from an auth file), use the Read tool — this is your escape hatch.

Focus: Security vulnerabilities, injection attacks, auth issues, data exposure.

<issue_classification>
Classify each issue: MUST_FIX / SHOULD_FIX / STYLE
Security issues are almost always MUST_FIX.
</issue_classification>

Save to: {{sprint_artifacts}}/completions/{{story_key}}-cerberus.json
`
})
```

### Apollo (Logic/Performance) - complex+ — Focused Context (logic files)

```
Task({
  subagent_type: "optimizer-performance",
  model: "opus",
  description: "⚡ Apollo analyzing {{story_key}}",
  prompt: `
${SHARED_PREFIX_FULL}

<files_for_review>
[INLINE: APOLLO_FILES — logic, route, database, types files]
</files_for_review>

You are APOLLO ⚡ - God of Reason, Truth, and Light.

You illuminate logic flaws and performance issues.

The structural digest above shows ALL files and their exports. You have been given the logic-relevant files inline. If you need to inspect additional files (e.g., a UI component that calls a service), use the Read tool — this is your escape hatch.

Focus: Logic bugs, edge cases, performance bottlenecks, algorithmic issues.

<issue_classification>
Classify each issue: MUST_FIX / SHOULD_FIX / STYLE
</issue_classification>

Save to: {{sprint_artifacts}}/completions/{{story_key}}-apollo.json
`
})
```

### Hestia (Architecture) - micro+ — Full Context

```
Task({
  subagent_type: "architect-reviewer",
  model: "opus",
  description: "🏛️ Hestia reviewing architecture of {{story_key}}",
  prompt: `
${SHARED_PREFIX_FULL}

<files_for_review>
[INLINE: ALL implementation file contents — architecture is cross-cutting]
</files_for_review>

You are HESTIA 🏛️ - Goddess of Hearth, Home, and Structure.

You ensure the foundation is solid.

Focus: Patterns, integration, route structure, code organization.

<issue_classification>
Classify each issue: MUST_FIX / SHOULD_FIX / STYLE
</issue_classification>

Save to: {{sprint_artifacts}}/completions/{{story_key}}-hestia.json
`
})
```

### Arete (Code Quality) - critical only — Focused Context (production files)

```
Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "✨ Arete judging quality of {{story_key}}",
  prompt: `
${SHARED_PREFIX_FULL}

<files_for_review>
[INLINE: ARETE_FILES — all production files, test files excluded]
</files_for_review>

You are ARETE ✨ - Personification of Excellence.

You hold code to the highest standards.

The structural digest above shows ALL files including tests. You have been given production files inline (tests excluded — Nemesis handles those). If you need to inspect a test file for context, use the Read tool — this is your escape hatch.

Focus: Maintainability, readability, best practices, code cleanliness.

<issue_classification>
Classify each issue: MUST_FIX / SHOULD_FIX / STYLE
Be honest - not everything is MUST_FIX.
</issue_classification>

Save to: {{sprint_artifacts}}/completions/{{story_key}}-arete.json
`
})
```

### Forged Specialists (from Pygmalion) — spawned in same parallel batch

```
IF FORGED_SPECS.forged_specialists.length > 0:
  # Include these in the SAME message as Pantheon reviewers above
  FOR EACH spec IN FORGED_SPECS.forged_specialists:

    # Determine file partition based on spec.review_focus keywords
    SPEC_FILES = match_review_focus_to_classifications(spec.review_focus)
    # If keywords span 3+ file categories or are unclear → ALL files
    # Otherwise → only matching classified files

    Task({
      subagent_type: "{{spec.suggested_claude_agent_type}}",
      model: "opus",
      description: "{{spec.emoji}} {{spec.name}} reviewing {{story_key}}",
      prompt: `
${SHARED_PREFIX_FULL}

<files_for_review>
[INLINE: SPEC_FILES — partitioned by review_focus, or ALL if ambiguous]
</files_for_review>

You are {{spec.name}} ({{spec.emoji}}) — {{spec.title}}.

{{spec.domain_expertise}}

The structural digest above shows ALL files and their exports. You have been given files relevant to your domain inline. If you need to inspect additional files, use the Read tool — this is your escape hatch.

Review the provided files for this story. Focus specifically on:
{{spec.review_focus — as bullet list}}

Technology Checklist — verify each item:
{{spec.technology_checklist — as numbered list}}

Known Gotchas to watch for:
{{spec.known_gotchas — as bullet list}}

Issue Classification:
{{spec.issue_classification_guidance}}

Output your findings in standard reviewer JSON format.
Save to: {{sprint_artifacts}}/completions/{{story_key}}-{{spec.id}}.json
`
    })
```

**CRITICAL: Forged specialist Task calls MUST be in the SAME message as Pantheon reviewer Task calls above. This ensures true parallel execution.**

---

**Wait for ALL agents to complete (Pantheon + forged specialists).**

Collect completion artifacts and store agent_ids for potential resume.

### Update Progress

Update `{{sprint_artifacts}}/completions/{{story_key}}-progress.json`:
```json
{
  "current_phase": "ASSESS",
  "phases": {
    "PREPARE": { "status": "complete", "details": "..." },
    "BUILD": { "status": "complete", "details": "..." },
    "VERIFY": { "status": "complete", "details": "{{AGENT_COUNT}} reviewers, {{total_issues}} issues found" },
    "ASSESS": { "status": "in_progress", "details": "Themis triaging" }
  },
  "metrics": {
    "issues_found": "{{total_issues}}",
    "reviewers": "{{AGENT_COUNT}}"
  }
}
```

**Orchestrator says:**
> "All {{AGENT_COUNT}} reviewers are back! They found {{total_issues}} potential issues. Now **Themis** will weigh each one - she'll separate the real problems from the gold-plating."
