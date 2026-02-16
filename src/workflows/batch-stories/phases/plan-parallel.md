# Phase: Plan Parallel Execution
<!-- Batch Stories phase file — see workflow.md for config and routing -->

<step name="analyze_dependencies" if="mode == parallel">
**Dependency Analysis & Task Graph Creation**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 ANALYZING DEPENDENCIES & BUILDING TASK GRAPH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 1: Extract Dependencies from Each Story

For each selected story, read the story file and look for:

**1.1 Explicit dependencies (highest priority):**
```bash
# Look for depends_on in story frontmatter or metadata
grep -E "depends_on:|dependencies:|requires:" "$STORY_FILE"
```

Example in story file:
```markdown
## Dependencies
depends_on: [5-1, 5-2]
```

**1.2 File-based inference (medium priority):**
```bash
# Extract file paths mentioned in tasks
grep -oE "(src|components|lib|api|services)/[a-zA-Z0-9/_.-]+" "$STORY_FILE" | sort -u
```

Cross-reference: If Story B creates `src/components/PhotoUpload.tsx` and Story C references it, C depends on B.

**1.3 Keyword scanning (low priority):**
```bash
# Look for references to other stories
grep -oE "(story |from |uses |extends |builds on )[0-9]+-[0-9]+" "$STORY_FILE"
```

**1.4 Epic ordering (fallback):**
Within the same epic, assume lower story numbers should complete first unless contradicted by explicit dependencies.

### Step 2: Build Dependency Graph

```
Dependencies found:
  5-1: []                    # No dependencies
  5-2: [5-1]                 # Depends on 5-1
  5-3: []                    # No dependencies
  5-4: [5-1]                 # Depends on 5-1
  5-5: [5-4]                 # Depends on 5-4
  5-6: [5-2]                 # Depends on 5-2
```

### Step 3: Detect Circular Dependencies

```bash
# If circular dependency detected:
echo "CIRCULAR DEPENDENCY: 5-1 -> 5-3 -> 5-1"
echo "Falling back to epic order for these stories"
```

If circular dependency detected, remove the back-edge (the link that creates the cycle) and log a warning.

### Step 3.5: Pre-Flight Already-Implemented Check

Before adding stories to the dependency graph, check each story file for signs it was
already implemented. This avoids wasting tokens spawning workers that immediately discover
the story is done.

```
ALREADY_DONE = []

FOR EACH story IN selected_stories:
  STORY_FILE = story.file_path

  # Check 1: All tasks checked off
  CHECKED = grep -c "^- \[x\]" "$STORY_FILE" || 0
  UNCHECKED = grep -c "^- \[ \]" "$STORY_FILE" || 0

  # Check 2: Dev Agent Record has a git commit (proves pipeline completed)
  HAS_COMMIT = grep -q "Git Commit.*[0-9a-f]\{7,\}" "$STORY_FILE"

  IF UNCHECKED == 0 AND CHECKED > 0:
    ALREADY_DONE += story
  ELIF HAS_COMMIT:
    ALREADY_DONE += story
```

**If already-implemented stories found:**

```
IF ALREADY_DONE is not empty:
  Display:
    "⏭️ {{ALREADY_DONE.length}} stories appear already implemented:"
    FOR EACH story IN ALREADY_DONE:
      "  • {{story.story_key}} — {{CHECKED}} tasks checked, {{UNCHECKED}} unchecked"

  Use AskUserQuestion:
    "These stories have completed Dev Agent Records or all tasks checked off.
     What would you like to do?"

    Options:
    1. "Skip them (recommended)" — Remove from task graph, mark done in sprint-status
    2. "Re-run anyway" — Include them for re-verification
    3. "Review individually" — Let me choose which to skip

  IF skip:
    → Remove ALREADY_DONE stories from selected_stories
    → Update sprint-status.yaml: mark each as "done"
    → Log: "Skipped {{ALREADY_DONE.length}} already-implemented stories"
```

### Step 4: Store Dependency Graph (In-Memory Only)

**No TaskCreate or TeamCreate calls needed.** The lead manages an in-memory queue in `execute_parallel`.
Workers are background Task agents with no access to shared task lists.

Store the dependency graph as an in-memory data structure for use by `execute_parallel`:

```
DEPENDENCY_GRAPH = {
  "5-1": { story_key: "5-1", story_title: "...", story_file: "...", complexity: "...", depends_on: [] },
  "5-2": { story_key: "5-2", story_title: "...", story_file: "...", complexity: "...", depends_on: ["5-1"] },
  "5-3": { story_key: "5-3", story_title: "...", story_file: "...", complexity: "...", depends_on: [] },
  ...
}
```

**Display the planned dependency graph:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PLANNED DEPENDENCY GRAPH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  5-1 Polish Catch List View         [unblocked]
  5-2 Polish Catch Detail View       [depends on 5-1]
  5-3 Polish Manual Catch Entry Form [unblocked]
  5-4 Fix Offline Photo Handling     [depends on 5-1]
  5-5 Improve Photo Upload Widget    [depends on 5-4]
  5-6 Add Catch Edit Functionality   [depends on 5-2]

Unblocked (ready now): 2 stories
Blocked (waiting):     4 stories
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 5: User Confirmation

Use AskUserQuestion:
```
Dependency graph analyzed. The lead will manage an in-memory queue
and spawn isolated workers in execute_parallel.

Options:
1. Proceed with dependency graph (recommended)
2. Remove all dependencies (process in any order)
3. Adjust max workers (currently {{max_workers}})
```

**Pass DEPENDENCY_GRAPH to execute_parallel.** No TaskCreate calls happen in this step.
</step>
