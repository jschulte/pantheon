# Phase 1: SCOPE (1/6)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 PHASE 1: SCOPE (1/6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyzing review scope...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.1 Parse Input

Extract scope from user input:

```
IF epic provided:
  SCOPE_TYPE = "epic"
  Find all stories: docs/stories/epic-{{epic}}/*.md
  Extract file patterns from stories

ELIF stories provided:
  SCOPE_TYPE = "stories"
  Parse story list: "17-1,17-2,17-3"
  Find story files and extract file patterns

ELIF path provided:
  SCOPE_TYPE = "path"
  Use provided paths directly

ELIF since_commit provided:
  SCOPE_TYPE = "git"
  Get changed files: git diff --name-only {{since_commit}}..HEAD
```

### 1.2 Extract Focus (if provided)

```
IF focus provided:
  FOCUS_ENABLED = true
  FOCUS_PROMPT = "{{user_focus_input}}"

  # Enhance review prompts with focus
  REVIEW_GUIDANCE = `
  **SPECIAL FOCUS REQUESTED:**
  In addition to standard review, pay particular attention to:
  {{FOCUS_PROMPT}}

  Look for issues related to this focus across all files reviewed.
  `
ELSE:
  FOCUS_ENABLED = false
  REVIEW_GUIDANCE = ""
```

### 1.3 Analyze Scope

```
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "🔍 Analyzing review scope",
  prompt: `
Analyze the review scope and prepare for deep review.

<scope>
Type: {{SCOPE_TYPE}}
Input: {{scope_input}}
</scope>

<stories_or_paths>
{{IF SCOPE_TYPE == "epic" or "stories"}}
[List story files with their file patterns]
{{ELSE}}
[List paths to review]
{{ENDIF}}
</stories_or_paths>

**Tasks:**
1. Identify all files that should be reviewed
2. Categorize by type (frontend, backend, database, tests)
3. Note which reviewers should be activated (accessibility for frontend, etc.)
4. Estimate scope size

**Output:**
{
  "scope_id": "epic-17-pass-1",
  "files_to_review": [
    { "path": "src/components/Button.tsx", "category": "frontend" },
    ...
  ],
  "total_files": 25,
  "categories": {
    "frontend": 12,
    "backend": 8,
    "database": 2,
    "tests": 3
  },
  "reviewers_needed": ["security", "correctness", "architecture", "accessibility"],
  "estimated_complexity": "medium"
}

Save to: {{sprint_artifacts}}/hardening/{{scope_id}}-scope.json
`
})
```

**Orchestrator says:**
> "Scope analyzed: **{{total_files}} files** to review across {{categories}}. {{IF FOCUS_ENABLED}}Focus: **{{FOCUS_PROMPT}}**{{ENDIF}}. Starting deep review..."
