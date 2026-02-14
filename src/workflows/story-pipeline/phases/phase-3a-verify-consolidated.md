# Phase 3A: VERIFY — Consolidated Review (3/7)
<!-- Part of Story Pipeline v1.1 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👁️ PHASE 3A: VERIFY — Consolidated (3/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Review Mode: consolidated
Complexity: trivial | micro | light | standard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Review Mode Gate

```
ASSERT COMPLEXITY in [trivial, micro, light, standard]
  → If COMPLEXITY in [complex, critical]:
    → Load phase-3b-verify-parallel.md instead
```

---

### Consolidated Review (trivial/micro/light/standard)

**Single agent reviews from 4 perspectives. Saves ~25K tokens.**

**Note on blind mode:** In consolidated review, the multi-reviewer agent receives the Metis completion artifact for Nemesis/Cerberus/Hestia perspectives, but the Argus perspective section of multi-reviewer.md instructs Argus to verify against story requirements independently, not against builder claims. See the Blind Mode section in `agents/multi-reviewer.md`.

```
Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "👁️🧪🔐🏛️ Multi-Review {{story_key}}",
  prompt: `
<agent_definition>
[INLINE: Content from agents/multi-reviewer.md]
</agent_definition>

<goal>
Review the implementation of {{story_key}} from all four perspectives defined in your agent definition.
Classify each issue as MUST_FIX / SHOULD_FIX / STYLE.
</goal>

<context>
<story>
[inline story content]
</story>

<metis_completion>
[INLINE: Summary from metis.json — files_created, files_modified, tasks_addressed]
</metis_completion>

<playbook_guidance>
[CONDITIONAL — same rules as SHARED_PREFIX_FULL:
 If loaded tokens < 2000: inline gotchas + anti-patterns.
 If >= 2000: top 5 entries only.
 If none loaded: omit block entirely.
 Use entries to flag violations as MUST_FIX.]
</playbook_guidance>

<files_to_review>
[list from metis.json]
</files_to_review>
</context>

Save consolidated findings to:
{{sprint_artifacts}}/completions/{{story_key}}-review.json
`
})
```

**After consolidated review, also spawn any forged specialists (if Pygmalion produced them):**

```
IF FORGED_SPECS.forged_specialists.length > 0:
  # Spawn forged specialists in parallel alongside or after consolidated review
  FOR EACH spec IN FORGED_SPECS.forged_specialists:
    Task({
      subagent_type: "{{spec.suggested_claude_agent_type}}",
      model: "opus",
      description: "{{spec.emoji}} {{spec.name}} reviewing {{story_key}}",
      prompt: `
You are {{spec.name}} ({{spec.emoji}}) — {{spec.title}}.

{{spec.domain_expertise}}

Review the following code changes for this story. Focus specifically on:
{{spec.review_focus — as bullet list}}

Technology Checklist — verify each item:
{{spec.technology_checklist — as numbered list}}

Known Gotchas to watch for:
{{spec.known_gotchas — as bullet list}}

Issue Classification:
{{spec.issue_classification_guidance}}

<story>[INLINE: story content]</story>
<files_to_review>[list from metis.json]</files_to_review>

Output your findings in standard reviewer JSON format.
Save to: {{sprint_artifacts}}/completions/{{story_key}}-{{spec.id}}.json
`
    })
```

**After all reviews complete (consolidated + forged), proceed to Phase 4 (ASSESS).**

---

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
