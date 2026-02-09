# Phase 1: PREPARE (1/7)
<!-- Part of Story Pipeline v7.4 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PHASE 1: PREPARE (1/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Story quality gate + Playbook query
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.1 Load and Parse Story

```bash
STORY_FILE="docs/sprint-artifacts/{{story_key}}.md"
[ -f "$STORY_FILE" ] || { echo "ERROR: Story file not found"; exit 1; }
```

Use Read tool. Extract:
- Task count
- Acceptance criteria count
- Keywords for risk scoring

### 1.2 Determine Complexity (6-tier scale)

```bash
TASK_COUNT=$(grep -c "^- \[ \]" "$STORY_FILE")
CRITICAL_KEYWORDS=$(grep -ciE "payment|encryption|PII|credentials|secret" "$STORY_FILE")
RISK_KEYWORDS=$(grep -ciE "auth|security|migration|database|API" "$STORY_FILE")
TRIVIAL_KEYWORDS=$(grep -ciE "static|policy|content|copy|config|readme" "$STORY_FILE")

# Check for trivial indicators
HAS_API=$(grep -ciE "fetch|axios|API|endpoint|route\.ts" "$STORY_FILE")
HAS_USER_INPUT=$(grep -ciE "form|input|onChange|submit" "$STORY_FILE")
```

**Complexity decision tree:**

```
IF CRITICAL_KEYWORDS > 0 OR TASK_COUNT >= 16:
  COMPLEXITY = "critical"
  AGENTS = [Argus, Nemesis, Cerberus, Apollo, Hestia, Arete]  # 6 agents

ELIF TASK_COUNT >= 11 OR (RISK_KEYWORDS > 0 AND TASK_COUNT >= 5):
  COMPLEXITY = "complex"
  AGENTS = [Argus, Nemesis, Cerberus, Apollo, Hestia]  # 5 agents

ELIF TASK_COUNT >= 5 OR HAS_USER_INPUT > 0:
  COMPLEXITY = "standard"
  AGENTS = [Argus, Nemesis, Cerberus, Hestia]  # 4 agents

ELIF TASK_COUNT >= 3 OR HAS_API > 0:
  COMPLEXITY = "light"
  AGENTS = [Argus, Nemesis, Hestia]  # 3 agents

ELIF TASK_COUNT >= 2:
  COMPLEXITY = "micro"
  AGENTS = [Argus, Hestia]  # 2 agents

ELSE (TASK_COUNT <= 1 OR TRIVIAL_KEYWORDS > 0):
  COMPLEXITY = "trivial"
  AGENTS = [Argus]  # 1 agent
```

**Display complexity:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 COMPLEXITY: {{COMPLEXITY}} ({{AGENT_COUNT}} agents)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tasks: {{TASK_COUNT}}
Risk keywords: {{RISK_KEYWORDS}}
Agents: {{AGENTS}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.3 Story Quality Gate

**Orchestrator performs these checks directly (no Task spawn):**

**1. Required Sections Exist:**
```bash
grep -q "## Story Title\|## Story:" "$STORY_FILE" || echo "❌ MISSING: Story Title"
grep -q "## Business Context\|## Context\|## Background" "$STORY_FILE" || echo "⚠️ MISSING: Business Context"
grep -q "## Acceptance Criteria\|## AC\|## Definition of Done" "$STORY_FILE" || echo "❌ MISSING: Acceptance Criteria"
grep -q "## Tasks\|## Implementation Tasks\|^- \[ \]" "$STORY_FILE" || echo "❌ MISSING: Tasks"
```

**2. Tasks Are Well-Defined:**
```bash
PLACEHOLDER_TASKS=$(grep -E "^\- \[ \] (TBD|TODO|WIP|Placeholder|...)" "$STORY_FILE" | wc -l)
if [ "$PLACEHOLDER_TASKS" -gt 0 ]; then
  echo "❌ BLOCKER: $PLACEHOLDER_TASKS placeholder tasks found"
fi
```

**3. No Unresolved Blockers:**
```bash
BLOCKERS=$(grep -ciE "\[BLOCKER\]|\[BLOCKED\]|\[NEEDS.DECISION\]" "$STORY_FILE")
if [ "$BLOCKERS" -gt 0 ]; then
  echo "❌ BLOCKER: $BLOCKERS unresolved blockers found"
fi
```

**Quality Gate Decision:**
```
IF any ❌ BLOCKER found:
  → HALT pipeline
  → Suggest: "Run /bmad_bmm_validate to fix story issues"

IF only ⚠️ WARNINGs found:
  → ASK: "Proceed despite warnings? [y/N]"

IF all checks pass:
  → Display "✅ Story quality gate passed"
```

### 1.4 Playbook Query (Index-Based)

**1. Read the playbook index:**
```bash
INDEX_FILE="docs/implementation-playbooks/_index.json"
if [ ! -f "$INDEX_FILE" ]; then
  # Bootstrap empty index if missing
  echo '{"version":"1.0","token_budget":7500,"playbooks":[]}' > "$INDEX_FILE"
fi
```

Read `docs/implementation-playbooks/_index.json` using the Read tool.

**2. Score each playbook for relevance:**

Extract story keywords and file patterns from the story file, then score each playbook entry:

```
FOR EACH playbook IN index.playbooks:
  domain_overlap = count(story_keywords ∩ playbook.domains) / count(playbook.domains)
  file_pattern_match = count(story_file_patterns ∩ playbook.file_patterns) / count(playbook.file_patterns)
  hit_rate_boost = playbook.hit_rate * 0.2
  staleness_penalty = -0.1 IF playbook not updated in last 30 stories

  score = (domain_overlap * 0.5) + (file_pattern_match * 0.3) + hit_rate_boost - staleness_penalty
```

**3. Load playbooks under token budget:**

```
BUDGET = index.token_budget  # default 7500
LOADED = []
TOKENS_USED = 0

FOR EACH playbook IN sorted_by_score(index.playbooks, descending):
  IF score < 0.2: SKIP  # Below relevance threshold
  IF TOKENS_USED + playbook.token_cost > BUDGET: SKIP
  Read playbook file, add to LOADED
  TOKENS_USED += playbook.token_cost

# No hard count limit — budget is the constraint
```

**4. Display loading summary:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 PLAYBOOKS: {{count}} loaded ({{TOKENS_USED}}/{{BUDGET}} tokens)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{FOR EACH loaded playbook: "  • {{title}} ({{token_cost}} tokens, score: {{score}})"}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Store loaded playbook content and IDs for Metis (Phase 2) and hit-rate tracking (Phase 4).

### 1.5 Update Progress

```bash
cat > "docs/sprint-artifacts/completions/{{story_key}}-progress.json" << EOF
{
  "story_key": "{{story_key}}",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "current_phase": "BUILD",
  "phases": {
    "PREPARE": { "status": "complete", "details": "{{playbook_count}} playbooks loaded, complexity: {{COMPLEXITY}}" },
    "BUILD": { "status": "pending" },
    "VERIFY": { "status": "pending" },
    "ASSESS": { "status": "pending" },
    "REFINE": { "status": "pending" },
    "COMMIT": { "status": "pending" },
    "REFLECT": { "status": "pending" }
  },
  "metrics": {
    "complexity": "{{COMPLEXITY}}",
    "task_count": {{TASK_COUNT}},
    "playbooks_loaded": {{playbook_count}}
  }
}
EOF
```

**📢 Orchestrator says:**
> "Story looks good! Found {{playbook_count}} relevant playbooks. Now I'll hand off to **Metis** to build the implementation. She'll write tests first (TDD), then implement. This is usually the longest phase."
