# Phase 4: ASSESS (4/7)
<!-- Part of Story Pipeline v1.1 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ PHASE 4: ASSESS (4/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Coverage gate + Themis triage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.1 Coverage Gate

<!-- WHY FULL SUITE: Phase 4 is the ONE place the full test suite runs.
     Earlier phases use scoped checks (incremental tsc, findRelatedTests) for speed.
     This is the safety net that catches cross-module regressions. Do NOT scope this. -->

```bash
npm test -- --coverage --silent 2>&1 | tee coverage-output.txt
COVERAGE=$(grep -E "All files|Statements" coverage-output.txt | head -1 | grep -oE "[0-9]+\.[0-9]+" | head -1)

if (( $(echo "$COVERAGE < {{coverage_threshold}}" | bc -l) )); then
  echo "❌ Coverage ${COVERAGE}% below threshold"
  # Add to MUST_FIX list
fi
```

### 4.1.5 Security Gate Check (Pre-Themis)

**Before Themis triage, process the independent Cerberus security gate result.**

Cerberus findings use BLOCK/WARN severity and bypass Themis triage entirely for BLOCKs.

```
security_gate = Read("{{sprint_artifacts}}/completions/{{story_key}}-security-gate.json")

# Display security verdict banner
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 CERBERUS SECURITY VERDICT: {{security_gate.status}}
   BLOCKs: {{security_gate.summary.blocks}}
   WARNs: {{security_gate.summary.warnings}}
   Policies: {{security_gate.policies_source}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IF security_gate.status == "BLOCKED":
  # Extract all BLOCK findings → these bypass Themis completely
  security_blocks = security_gate.findings.filter(f => f.severity == "BLOCK")
  # WARN findings flow to Themis as SHOULD_FIX inputs
  security_warns_as_should_fix = security_gate.findings
    .filter(f => f.severity == "WARN")
    .map(f => ({ ...f, severity: "SHOULD_FIX", source: "cerberus-gate" }))

ELIF security_gate.status == "ERROR":
  # Check enterprise failure policy
  IF security_gate.enterprise_config.failure_policy == "fail-closed":
    AskUserQuestion({
      question: "Security gate ERROR with fail-closed policy. Only Abort or Retry allowed.",
      options: [
        { label: "Abort workflow", description: "Halt pipeline" },
        { label: "Retry security gate", description: "Re-run Cerberus" }
      ]
    })
  ELSE:  # fail-open or null
    AskUserQuestion({
      question: "Security gate returned ERROR. What would you like to do?",
      options: [
        { label: "Abort workflow", description: "Halt pipeline" },
        { label: "Proceed without security gate", description: "Continue — security gate skipped" },
        { label: "Retry security gate", description: "Re-run Cerberus" }
      ]
    })

ELIF security_gate.status == "PASSED":
  security_blocks = []
  # WARN findings still flow to Themis
  security_warns_as_should_fix = security_gate.findings
    .filter(f => f.severity == "WARN")
    .map(f => ({ ...f, severity: "SHOULD_FIX", source: "cerberus-gate" }))
```

### 4.2 Themis Triage

**Purpose:** Triage issues pragmatically, but **strongly err on the side of fixing**. Only filter clearly manufactured complaints.

```
Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "⚖️ Themis triaging issues for {{story_key}}",
  prompt: `
You are THEMIS ⚖️ - Titan of Justice and Fair Judgment.

You hold the scales. Your job is NOT to find excuses to skip work. Your job is to filter out **clearly manufactured complaints** so Metis can focus on real issues.

**CORE PRINCIPLE: If a reviewer found a real issue, it's MUST_FIX. Period.**

<story_context>
Complexity: {{COMPLEXITY}}
Story type: {{story_type}}
</story_context>

<all_issues>
{{ALL issues from Phase 3 — Pantheon reviewers AND forged specialists}}
</all_issues>

NOTE: Forged specialist findings use the same JSON format as Pantheon reviewers.
Triage them identically — no special handling needed.

<triage_instructions>
**THE "REAL ISSUE" RULE (MOST IMPORTANT):**
If a reviewer found something real → MUST_FIX. Always. No debate.

Real issues that are ALWAYS MUST_FIX:
- Missing null/error handling
- Missing accessibility attributes
- Poorly-named variables
- Missing error messages
- Typos in user-facing text
- Missing test assertions
- Security issues of any severity
- Edge cases not handled

**Classification (4 tiers):**
1. **MUST_FIX** - Any real issue. Metis fixes immediately.
2. **SHOULD_FIX** - Localized improvements. Best-effort fix, defer remainder.
3. **CODE_HEALTH** - Structural/design observations. Skip fixer, track to GitHub Issues.
4. **STYLE** - Clearly manufactured complaints (very rare!)

**What's always MUST_FIX:**
- Any real code quality issue
- Security vulnerabilities (from Cerberus)
- Test failures or gaps
- Broken functionality
- Data loss risks
- Integration failures
- Accessibility gaps

**SHOULD_FIX when:**
- Localized improvement (1-3 files, <50 lines)
- Clear benefit but not urgent
- Doesn't affect current functionality

**CODE_HEALTH when:**
- Systemic/structural issue (affects multiple modules)
- Requires architectural discussion or planning
- Represents accumulated design debt, not a bug
- Examples: god classes, DRY violations across 3+ locations, inconsistent patterns,
  circular dependencies, layer violations, naming inconsistencies

**STYLE only when:**
- Clearly manufactured (reviewer nitpicking to have something to say)
- Pure bikeshedding (preference, not a real problem)
- Reviewer misunderstood the code
- Suggestion would actually make code worse

**Expected distribution:**
- MUST_FIX: 70-85% (real issues get fixed)
- SHOULD_FIX: 5-15% (localized improvements)
- CODE_HEALTH: 5-15% (structural observations)
- STYLE: <5% (manufactured complaints only)

If your STYLE count exceeds 5%, you're filtering too aggressively.
**When uncertain → MUST_FIX.**
CODE_HEALTH items are NEVER sent to the fixer. They go directly to GitHub Issues.
</triage_instructions>

<completion_format>
{
  "triage": [
    {
      "issue": "original issue description",
      "reviewer": "Nemesis",
      "original_classification": "MUST_FIX",
      "judgment": "UPHELD",
      "new_classification": "MUST_FIX",
      "justification": "Real issue - missing null check could cause runtime error"
    }
  ],
  "summary": {
    "must_fix": 5,
    "should_fix": 1,
    "code_health": 0,
    "style": 0
  }
}

Save to: {{sprint_artifacts}}/completions/{{story_key}}-themis.json
</completion_format>
`
})
```

### 4.3 Conflict Detection & Resolution

After triage, Themis checks for **conflicting reviewer assessments** on the same code sections.

```
CONFLICTS = []

FOR EACH code_section IN all_reviewed_code:
  findings_on_section = all findings referencing this code section
  IF findings_on_section has different severities from different reviewers:
    # e.g., Cerberus says MUST_FIX, Hestia says acceptable
    CONFLICTS.append({
      code_section: code_section,
      findings: findings_on_section
    })

IF CONFLICTS.length > 0:
  → Themis enters RESOLUTION MODE (see arbiter.md Conflict Resolution Protocol)
  → Each conflict gets a binding resolution with documented reasoning
  → Resolved conflicts are appended to the triage output
```

**Conflict decision tree:**
```
All reviewers agree on a code section → Proceed normally (no conflict)
Reviewers disagree on severity → Themis resolves with documented reasoning
Reviewers fundamentally disagree on approach → Themis issues binding judgment with evidence
```

**IMPORTANT:** Conflicts always get full resolution. They are never quick-fixed or hand-waved. The resolution must pick a side with evidence — no "splitting the difference."

### 4.4 Playbook Hit-Rate Update

After triage, update playbook effectiveness metrics based on review outcomes.

```
FOR EACH playbook loaded in Phase 1:
  playbook_domains = playbook.domains
  story_domains = domains actually touched by this story (from file patterns + keywords)

  # RELEVANCE CHECK (M15): Only score playbooks against domains the story actually touches.
  # A playbook about "auth" is irrelevant to a UI-only story — don't score it.
  domain_overlap = playbook_domains ∩ story_domains
  IF domain_overlap is empty:
    → SKIP: Playbook domain not relevant to this story (no signal)
    # Don't update counts — prevents inflating hit-rate with irrelevant loads

  ELIF matching_issues for domain_overlap == 0:
    → HIT: Playbook guidance was followed in relevant domain, no issues found
    playbook.hit_count += 1

  ELIF any matching_issue matches a SPECIFIC playbook entry (gotcha/anti-pattern):
    → MISS: Playbook was loaded but specific guidance not followed
    playbook.miss_count += 1

  ELSE:
    → NEUTRAL: Issues exist in domain but don't match playbook entries
    # Don't update counts

  Recalculate: playbook.hit_rate = hit_count / (hit_count + miss_count)
```

**Update `_index.json`:** Read current index, update `hit_count`, `miss_count`, and `hit_rate` for each affected playbook entry, write back.

**Add to Themis artifact** (`{{story_key}}-themis.json`):
```json
{
  "playbook_effectiveness": {
    "loaded": ["api-patterns", "auth-patterns"],
    "relevant": ["api-patterns"],
    "skipped_irrelevant": ["auth-patterns"],
    "hits": ["api-patterns"],
    "misses": [],
    "neutral": []
  }
}
```

This is a coarse heuristic. The relevance check prevents inflating hit-rates by counting irrelevant domain loads as "hits." Over 20+ stories it becomes meaningful even if individual measurements are noisy.

---

### 4.3.5 Merge Security Gate Results

After Themis completes triage, merge the security gate BLOCK findings into the MUST_FIX list. These were NOT sent to Themis and cannot be triaged away.

```
# Instruct Themis: "Do NOT triage findings from security-gate. They are pre-triaged."
# (This instruction is included in the Themis prompt above)

# Merge security BLOCKs into the final MUST_FIX list
IF security_blocks.length > 0:
  must_fix += security_blocks.length
  # Append security blocks to MUST_FIX list with clear provenance
  FOR EACH block IN security_blocks:
    MUST_FIX_LIST.append({
      issue: block.description,
      reviewer: "cerberus-gate",
      classification: "MUST_FIX",
      source: "security-gate-BLOCK",
      location: block.location,
      rule: block.rule,
      non_negotiable: true  # Cannot be triaged away
    })

# Merge security WARNs that Themis may have received
# (These were already sent to Themis as SHOULD_FIX inputs)
```

**Process triage results:**

```
IF must_fix == 0 AND (should_fix == 0 OR NOT should_fix_behavior.fix_enabled):
  echo "✅ No issues to fix - proceeding to COMMIT"
  SKIP_PHASE_5 = true
ELIF must_fix == 0 AND should_fix > 0 AND should_fix_behavior.fix_enabled:
  echo "No MUST_FIX issues, but {{should_fix}} SHOULD_FIX items to attempt (best-effort)"
  SHOULD_FIX_ONLY = true
ELSE:
  echo "📋 {{must_fix}} MUST_FIX + {{should_fix}} SHOULD_FIX issues - proceeding to REFINE"
```

**Display triage summary:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ THEMIS JUDGMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total issues reviewed: {{total_count}}
Triage:
  - MUST_FIX: {{must_fix}} (Metis fixes these)
  - SHOULD_FIX: {{should_fix}} (best-effort fix, defer remainder to tracking)
  - CODE_HEALTH: {{code_health}} (tracked to GitHub Issues, no fix attempt)
  - STYLE: {{style}} (filtered out)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Update Progress

Update `{{sprint_artifacts}}/completions/{{story_key}}-progress.json`:
```json
{
  "current_phase": "REFINE",
  "phases": {
    "PREPARE": { "status": "complete", "details": "..." },
    "BUILD": { "status": "complete", "details": "..." },
    "VERIFY": { "status": "complete", "details": "..." },
    "ASSESS": { "status": "complete", "details": "{{coverage}}% coverage, {{must_fix}} MUST_FIX" },
    "REFINE": { "status": "{{must_fix > 0 ? 'in_progress' : 'skipped'}}", "details": "{{must_fix}} issues to fix" },
    ...
  },
  "metrics": {
    "coverage": "{{COVERAGE}}",
    "must_fix": {{must_fix}},
    "should_fix": {{should_fix}},
    "code_health": {{code_health}},
    "style": {{style}}
  }
}
```

**CRITICAL:** Coverage MUST be captured here. It comes from the coverage gate check:
```bash
COVERAGE=$(grep -E "All files|Statements" coverage-output.txt | head -1 | grep -oE "[0-9]+\.[0-9]+" | head -1)
```

**📢 Orchestrator says (if issues remain):**
> "Themis has triaged **{{total_count}} issues**. **{{must_fix}} real issues need fixing**. {{should_fix}} logged as tech debt for later. Sending Metis to handle the MUST_FIX list."

**📢 Orchestrator says (if no issues):**
> "Clean pass! No issues need fixing - either reviewers found nothing, or the few suggestions were truly optional. Moving straight to commit."
