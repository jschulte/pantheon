# Phase 7: REFLECT (7/7)
<!-- Part of Story Pipeline v1 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 PHASE 7: REFLECT (7/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hermes: Reflection + Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Combined Reflection & Report (Token Optimized v4.2)

**Why combined?** Both Mnemosyne (reflection) and Hermes (reporting) read the same artifacts. Combining them saves ~5-8K tokens per story while producing identical outputs.

**Spawn Hermes (Combined Agent):**

```
Task({
  subagent_type: "general-purpose",
  model: "sonnet",  # Faster model sufficient for synthesis
  description: "📜 Hermes: reflect + report {{story_key}}",
  prompt: `
You are MNEMOSYNE-HERMES 📜 - Memory & Messenger Combined.

Perform TWO roles in sequence for {{story_key}}:

## ROLE 1: Mnemosyne (Reflection)

<context>
Story: [inline story file]
All review findings: [inline all artifacts]
Themis judgments: [inline triage]
</context>

**Step 1: Extract learnings**
- What issues were found?
- What did Metis miss initially?
- What would have prevented these?

**Step 2: SEARCH existing playbooks via index**
\`\`\`bash
cat docs/implementation-playbooks/_index.json
# Fallback if index doesn't exist:
ls docs/implementation-playbooks/
\`\`\`

**Step 3: Decide action**
| Situation | Action |
|-----------|--------|
| Existing playbook covers this | **UPDATE** (compaction protocol) |
| Related playbook exists | **UPDATE** with integrated content |
| Truly new domain | **CREATE** new (rare) |
| No real learnings | **SKIP** |

**Step 4: Revise playbook (Compaction Protocol)**

**Concurrency note (M16):** In swarm mode, acquire `docs/implementation-playbooks/.write-lock`
before writing playbooks (same mkdir-based protocol as specialist registry — see phase-1.5-forge.md).
Re-read `_index.json` after acquiring lock.

- If updating: Read full playbook → assess entries vs new learnings → MERGE overlaps, REPLACE stale, ADD novel → check size budget (3-10KB target) → use Write tool for FULL FILE REPLACEMENT (not Edit/append) → update _index.json
- If creating: Use Write tool with standardized format (YAML frontmatter + required sections) → add entry to _index.json

CRITICAL: Use Write tool (full replacement), NOT Edit tool (append). This prevents bloat.

See agents/reflection-reporter.md for full compaction protocol details and standardized format template.

Save reflection artifact to: {{sprint_artifacts}}/completions/{{story_key}}-mnemosyne.json

---

## ROLE 2: Hermes (Report)

Now generate a comprehensive Story Completion Report.

<artifacts>
Progress: [{{story_key}}-progress.json]
Builder: [{{story_key}}-metis.json]
Review: [{{story_key}}-review.json OR individual argus/nemesis/cerberus/hestia files]
Triage: [{{story_key}}-themis.json]
Reflection: [{{story_key}}-mnemosyne.json - just created above]
</artifacts>

<git_commits>
[Recent commits for this story]
</git_commits>

Generate report including:

1. **TL;DR** - One paragraph summary (used in batch aggregation)
2. **What Was Built** - Features and acceptance criteria status
3. **Technical Changes** - Files created/modified tables
4. **Quality Summary** - Issues found and fixed
5. **Verification Guide** - Manual testing checklist with specific steps
6. **Learnings Captured** - Playbook updates from Mnemosyne role

Save report to: {{sprint_artifacts}}/completions/{{story_key}}-summary.md
Save hermes artifact to: {{sprint_artifacts}}/completions/{{story_key}}-hermes.json

---

<critical>
- SEARCH playbooks FIRST - don't create duplicates
- PREFER UPDATE over CREATE
- ACTUALLY WRITE playbook changes - don't just propose
- SKIP reflection if trivial - don't create noise
- TL;DR must be concise - used in batch aggregation
</critical>
`
})
```

### Final Progress Update

Update `{{sprint_artifacts}}/completions/{{story_key}}-progress.json`:
```json
{
  "current_phase": "COMPLETE",
  "completed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "success",
  "phases": {
    "PREPARE": { "status": "complete", "details": "..." },
    "BUILD": { "status": "complete", "details": "{{files_created}} files, {{lines_added}} lines" },
    "VERIFY": { "status": "complete", "details": "{{AGENT_COUNT}} reviewers, {{total_issues}} issues" },
    "ASSESS": { "status": "complete", "details": "{{coverage}}% coverage, {{must_fix}} MUST_FIX" },
    "REFINE": { "status": "complete", "details": "{{iterations}} iterations, {{must_fix}}→0 issues" },
    "COMMIT": { "status": "complete", "details": "Committed: {{git_commit}}" },
    "REFLECT": { "status": "complete", "details": "{{playbook_action}}" }
  },
  "metrics": {
    "files_changed": {{files_created + files_modified}},
    "lines_added": {{lines_added}},
    "tests_added": {{tests_added}},
    "issues_found": {{total_issues}},
    "must_fix": {{must_fix}},
    "iterations": {{iterations}},
    "coverage": "{{coverage}}%"
  }
}
```

### Display Final Summary

**📢 Orchestrator says (completion):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ STORY COMPLETE: {{story_key}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{story_title}}

📊 Quick Stats:
   • Files: {{files_created + files_modified}} changed
   • Lines: {{lines_added}} added
   • Tests: {{tests_added}} added
   • Coverage: {{coverage}}%
   • Issues: {{total_issues}} found → {{upheld_must_fix}} fixed

✅ Features Delivered:
   {{From TL;DR in hermes artifact}}

📋 Verification:
   {{verification_items}} items in manual testing checklist

📄 Full Report:
   {{sprint_artifacts}}/completions/{{story_key}}-summary.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
