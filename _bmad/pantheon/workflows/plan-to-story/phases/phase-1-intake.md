# Phase 1: INTAKE (1/4)
<!-- Part of Plan-to-Story Pipeline v1.0 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: INTAKE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Parse input, detect mode, load existing artifacts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 1: Parse Input and Detect Mode

Check `plan_input` and `sweep_range` from workflow.yaml.

**IMPORTANT — Intent Detection:** The user may provide natural language that expresses sweep intent
rather than a literal plan. Before classifying input as inline plan text, check whether the user is
asking you to scan git history. Examples:
- "Scan the past 2 days of git commits and look for changes that should be tracked as stories"
- "Find undocumented work from last week"
- "Check recent commits for anything missing from stories"

If the input expresses sweep intent, extract the time range from the natural language and treat it
as if `sweep_range` were set to that value.

```
IF plan_input contains "/" or ends with ".md" or ".txt":
  → It's a file path. Read the file contents.
  → Set PLAN_TEXT = file contents
  → Set PLAN_SOURCE = "file: {path}"
  → Set initial MODE = "check-content" (resolved in Step 4)

ELSE IF plan_input is non-empty string:
  → First, check for SWEEP INTENT in the text:
    Does plan_input express a request to scan git history, find undocumented work,
    or review recent commits? (e.g. mentions "commits", "git", "scan", "undocumented",
    "recent changes", "past N days/weeks", "history")
    → IF sweep intent detected:
      → Extract time range from the natural language (e.g. "past 2 days" → "2 days",
        "last week" → "1 week"). Default to "1 week" if no range is clear.
      → Set sweep_range = extracted range
      → Set MODE = "sweep"
      → Set PLAN_SOURCE = "sweep (from natural language): {sweep_range}"
      → Proceed to Step 2 (sweep discovery)
    → ELSE:
      → It's inline plan text. Use directly.
      → Set PLAN_TEXT = plan_input
      → Set PLAN_SOURCE = "inline"
      → Set initial MODE = "check-content" (resolved in Step 4)

ELSE IF plan_input is empty AND sweep_range is set:
  → Set MODE = "sweep"
  → Set PLAN_SOURCE = "sweep: {sweep_range}"
  → Proceed to Step 2 (sweep discovery)

ELSE (plan_input is empty AND no sweep_range):
  → Auto-detect: check plan_auto_detect paths in order:
    1. Read {project-root}/.claude/plan.md (if exists)
    2. Glob {project-root}/.claude/plans/*.md → use most recently modified
  → IF file found:
    → Set PLAN_TEXT = file contents
    → Set PLAN_SOURCE = "auto-detected: {path}"
    → Set initial MODE = "check-content"
  → IF still empty:
    → AskUserQuestion:
      Q: "No plan found. How would you like to provide input?"
      header: "Input"
      Options:
        - "Provide a file path" — specify path to a plan file
        - "Type plan inline" — describe the work directly
        - "Sweep recent git commits" — find undocumented work
      multiSelect: false
    → Handle response:
      IF "Provide a file path": Ask for path, read file, set PLAN_TEXT
      IF "Type plan inline": Ask for text, set PLAN_TEXT
      IF "Sweep recent git commits": Ask for time range, set sweep_range, set MODE = "sweep"
```

## Step 2: Sweep Mode Discovery (only if MODE = "sweep")

> Skip this step entirely if MODE is not "sweep".

**2a — Gather recent commit history:**
```bash
git log --oneline --since="{sweep_range}" --no-merges
```

Extract: commit hashes, messages, and changed files for each commit.

**2b — Group related commits into logical changes:**
Analyze commit messages and changed files to group related commits into logical "features" or "changes." Each group represents a candidate plan item. Criteria for grouping:
- Commits touching the same files/directories
- Commits with related messages (e.g., "add auth" + "fix auth" + "test auth")
- Commits within the same logical feature area

**2c — Cross-reference against existing stories:**
```
Read {implementation_artifacts}/sprint-status.yaml
  → Extract all tracked story keys
Read existing story files in {implementation_artifacts}/stories/
  → Extract task descriptions and file references

For each commit group:
  → Search story files for references to the group's files or topics
  → Search sprint-status for matching story keys
  → IF no story covers this group → Mark as UNDOCUMENTED
  → IF a story partially covers it → Mark as PARTIAL_COVERAGE
  → IF fully covered → Mark as DOCUMENTED (skip)
```

**2d — Synthesize undocumented groups into PLAN_TEXT:**
```
PLAN_TEXT = ""
For each UNDOCUMENTED or PARTIAL_COVERAGE group:
  Append to PLAN_TEXT:
    "## {group_title}
     Commits: {commit_list}
     Files changed: {file_list}
     Summary: {what_this_group_accomplished}
     Status: implemented (post-build documentation needed)"

SWEEP_RESULTS = {
  total_commits: N,
  groups_found: N,
  undocumented: N,
  partial: N,
  documented: N
}
```

If UNDOCUMENTED count is 0:
```
Display: "All recent work in the last {sweep_range} is already documented in stories."
→ EXIT pipeline gracefully
```

Set MODE = "post-build" (sweep always produces post-build stories since work is already done).

## Step 3: Load Existing Artifacts

Scan artifact directories to understand the current document trail state.

```
# Check for existing PRD
Read {planning_artifacts}/prd.md
  → Set PRD_CONTENT = contents (or empty if missing)
  → Set PRD_EXISTS = true/false

# Check for existing epics
Read {planning_artifacts}/epics.md
  → Set EPICS_CONTENT = contents (or empty if missing)
  → Set EPICS_EXISTS = true/false

# Check for existing architecture (informational — not required)
Glob {planning_artifacts}/architecture*.md
  → Set ARCHITECTURE_PATH = path if found (or empty)

# Check for sprint-status
Read {implementation_artifacts}/sprint-status.yaml
  → Set SPRINT_STATUS = contents (or empty if missing)
  → Set SPRINT_EXISTS = true/false

# Check for existing story files
Glob {implementation_artifacts}/stories/*.md
  → Set EXISTING_STORY_COUNT = count
  → Set EXISTING_STORY_FILES = list of paths
```

**If no PRD AND no epics exist:**
```
Display WARNING:
"No PRD or epics found. This project has no BMAD document trail yet.
 Consider running /quick-feature for full trail creation.
 Proceeding will create epics.md and sprint-status.yaml from scratch."
```

## Step 4: Mode Detection for Non-Sweep

> Skip this step if MODE is already "sweep" or "post-build" (from sweep).

Analyze PLAN_TEXT to determine whether this is pre-build or post-build:

```
SIGNALS = {
  post_build_markers: 0,
  pre_build_markers: 0,
  git_correlation: 0,
  file_existence: 0
}

# 1. Content markers
Scan PLAN_TEXT for:
  → "implemented", "done", "completed", "built", "shipped", "deployed"
    → post_build_markers += count
  → "TODO", "planned", "will", "should", "need to", "propose"
    → pre_build_markers += count

# 2. Git history correlation
Extract key terms from PLAN_TEXT (component names, feature names)
Run: git log --oneline -20 --no-merges
  → If >50% of key terms appear in recent commits → git_correlation = 1

# 3. File existence check
Extract file paths or component names referenced in PLAN_TEXT
Glob for matching files in the codebase
  → If >50% of referenced files/components exist → file_existence = 1

# 4. Plan file metadata
If PLAN_SOURCE starts with "auto-detected" or "file":
  → Check for status metadata like "applied", "completed" in the plan file
  → If found → post_build_markers += 2

# Decision
IF post_build_markers > pre_build_markers AND (git_correlation OR file_existence):
  → MODE = "post-build"
ELSE:
  → MODE = "pre-build"
```

User always gets to override in Phase 2.

## Step 5: Display Intake Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLAN-TO-STORY — INTAKE COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Plan source:      {{PLAN_SOURCE}}
Plan length:      {{char_count}} characters
Detected mode:    {{MODE}}

Existing artifacts:
  PRD:            {{PRD_EXISTS ? "Found" : "Missing"}}
  Epics:          {{EPICS_EXISTS ? "Found" : "Missing"}}
  Sprint status:  {{SPRINT_EXISTS ? "Found" : "Missing"}}
  Stories:        {{EXISTING_STORY_COUNT}} existing

{{IF MODE == "sweep"}}
Sweep results:
  Commits scanned: {{SWEEP_RESULTS.total_commits}}
  Groups found:    {{SWEEP_RESULTS.groups_found}}
  Undocumented:    {{SWEEP_RESULTS.undocumented}}
{{END IF}}

Proceeding to SCOPE phase...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Carry forward to Phase 2:**
- `PLAN_TEXT` — raw or synthesized plan content
- `PLAN_SOURCE` — origin of plan input
- `MODE` — "pre-build", "post-build", or detected mode
- `PRD_CONTENT`, `PRD_EXISTS`
- `EPICS_CONTENT`, `EPICS_EXISTS`
- `SPRINT_STATUS`, `SPRINT_EXISTS`
- `ARCHITECTURE_PATH`
- `EXISTING_STORY_COUNT`, `EXISTING_STORY_FILES`
- `SWEEP_RESULTS` (sweep mode only)
