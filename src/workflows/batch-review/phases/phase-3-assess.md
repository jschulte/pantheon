# Phase 3: ASSESS (3/6)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ PHASE 3: ASSESS (3/6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Themis triaging findings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3.1 Themis Triage + Deduplication

Same triage logic as story-pipeline — err on the side of fixing. Additionally, when multiple reviewers (Pantheon + forged specialists) find the same issue, Themis merges duplicates.

```
Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "⚖️ Themis triaging hardening findings",
  prompt: `
You are THEMIS ⚖️ - Titan of Justice.

Triage these hardening findings. **ERR ON THE SIDE OF FIXING.**

<all_issues>
{{ALL issues from Phase 2 — from all reviewers (Pantheon + forged specialists)}}
</all_issues>

<triage_rules>
**MUST_FIX** - Any real issue. Default category.
**SHOULD_FIX** - Large refactoring with speculative benefit only.
**STYLE** - Clearly manufactured complaints only (<10%).

If uncertain → MUST_FIX.
</triage_rules>

<deduplication_rules>
Multiple reviewers may find the same underlying issue. Merge duplicates:
- Same file + within 5 lines + same root cause = ONE issue
- Keep the most detailed finding
- Note all reviewers who found it (consensus increases confidence)
- Add "reviewers_agreed" field listing who found it
- Higher consensus = higher confidence the issue is real
</deduplication_rules>

<output>
{
  "triage": [
    {
      "issue_id": "epic-17-pass-1-001",
      "original_classification": "MUST_FIX",
      "final_classification": "MUST_FIX",
      "justification": "Real security issue - input not sanitized",
      "reviewers_agreed": ["security", "stripe-webhook-integrity"],
      "duplicates_merged": 1
    }
  ],
  "summary": {
    "must_fix": N,
    "should_fix": N,
    "style": N,
    "duplicates_merged": N
  }
}

Save to: {{sprint_artifacts}}/hardening/{{scope_id}}-triage.json
</output>
`
})
```

**If no MUST_FIX issues:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CLEAN PASS - No issues require fixing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
--> Skip to Phase 6: REPORT

**If MUST_FIX issues exist:**
--> Continue to Phase 4: FIX
