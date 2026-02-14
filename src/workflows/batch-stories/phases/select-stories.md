# Phase: Select Stories
<!-- Batch Stories phase file — see workflow.md for config and routing -->

<step name="load_sprint_status" priority="first">
**Load and parse sprint-status.yaml**

```bash
SPRINT_STATUS="{{sprint_artifacts}}/sprint-status.yaml"
[ -f "$SPRINT_STATUS" ] || { echo "ERROR: sprint-status.yaml not found"; exit 1; }
```

Use Read tool on sprint-status.yaml. Extract:
- Stories with status `ready-for-dev` or `backlog`
- Exclude epics (`epic-*`) and retrospectives (`*-retrospective`)
- Sort by epic number, then story number

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 LOADING SPRINT STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If no available stories: report "All stories complete!" and exit.
</step>

<step name="display_stories">
**Display available stories with file status**

For each story:
1. Check if story file exists in `{{sprint_artifacts}}/`
2. Try patterns in order (first match wins):
   ```
   # Exact key match
   {story_key}.md                          # e.g., 18b-3-migrate-navigation.md
   story-{story_key}.md                    # e.g., story-18b-3-migrate-navigation.md

   # Numeric prefix match (handles slug mismatches between sprint-status and filename)
   {epic}-{story_number}-*.md              # e.g., 18b-3-*.md via glob
   story-{epic}-{story_number}-*.md        # e.g., story-18b-3-*.md via glob

   # Dot-separated variant
   story-{epic}.{story_number}.md          # e.g., story-18b.3.md
   ```

   **Use Glob for fuzzy matching.** Sprint-status keys often differ from filenames
   (e.g., key `18b-3-migrate-navigation-profiles-service` vs file
   `story-18b-3-migrate-profile-services.md`). The glob `*{epic}-{story_number}-*.md`
   catches these mismatches. If multiple files match a glob, warn and use the first.

3. Mark status: ✅ exists, ❌ missing, 🔄 already implemented

```markdown
## 📦 Available Stories (N)

### Ready for Dev (X)
1. **17-10** ✅ occupant-agreement-view
2. **17-11** ✅ agreement-status-tracking

### Backlog (Y)
3. **18-1** ❌ [needs story file]

Legend: ✅ ready | ❌ missing | 🔄 done but not tracked
```
</step>

<step name="validate_stories">
**Validate story files have required sections and sufficient depth**

For each story with existing file:
1. Read story file
2. Check for 12 BMAD sections (Business Context, Acceptance Criteria, Tasks, etc.)
3. Check file size for quality signal
4. If invalid: mark for regeneration

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 VALIDATING STORY FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**File size quality check:**
```bash
for STORY_FILE in ${STORY_FILES[@]}; do
  FILE_SIZE=$(wc -c < "$STORY_FILE" | tr -d ' ')
  STORY_NAME=$(basename "$STORY_FILE" .md)

  if [ "$FILE_SIZE" -lt 3000 ]; then
    echo "⚠️  $STORY_NAME (${FILE_SIZE}B) — TOO THIN: likely insufficient context"
    THIN_STORIES+=("$STORY_NAME")
  elif [ "$FILE_SIZE" -lt 6000 ]; then
    echo "⚠️  $STORY_NAME (${FILE_SIZE}B) — may lack detail for quality implementation"
    THIN_STORIES+=("$STORY_NAME")
  else
    SIZE_KB=$((FILE_SIZE / 1024))
    echo "✅ $STORY_NAME (${SIZE_KB}KB)"
  fi
done
```

**If thin stories found, prompt user:**
```
IF THIN_STORIES.length > 0:
  Use AskUserQuestion:
    "Found {{THIN_STORIES.length}} story file(s) under 6KB. Thin stories often
    produce poor results — they lack the context agents need for quality work.
    Most stories should be 10KB+ with detailed Business Context, Acceptance
    Criteria, and Technical Requirements.

    Thin stories: {{THIN_STORIES}}

    What would you like to do?"

    Options:
    1. "Continue anyway" — Process all stories including thin ones
    2. "Skip thin stories" — Only process stories >= 6KB
    3. "Regenerate thin stories first" — Run /create-story-with-gap-analysis on thin ones
    4. "Cancel" — Stop and review story files manually
```

**Note:** Stories with missing files will be auto-created in the execution step.
</step>

<step name="score_complexity">
**Score story complexity for pipeline routing**

For each validated story:

```bash
# Count tasks
TASK_COUNT=$(grep -c "^- \[ \]" "$STORY_FILE")

# Check for risk keywords
RISK_KEYWORDS="auth|security|payment|encryption|migration|database|schema"
HIGH_RISK=$(grep -ciE "$RISK_KEYWORDS" "$STORY_FILE")
```

**Scoring:**
| Criteria | micro | standard | complex |
|----------|-------|----------|---------|
| Tasks | ≤3 | 4-15 | ≥16 |
| Files | ≤5 | ≤30 | >30 |
| Risk keywords | 0 | low | high |

Store `complexity_level` for each story.
</step>

<step name="get_selection">
**Get user selection**

Use AskUserQuestion:
```
Which stories would you like to implement?

Options:
1. All ready-for-dev stories (X stories)
2. Select specific stories by number
3. Single story (enter key like "17-10")
```

Validate selection against available stories.
</step>

<step name="choose_mode">
**Choose execution mode (auto-detects Agent Teams)**

### Auto-Detection (MANDATORY)

Before asking the user, check if Agent Teams is available:

```
IF TeamCreate tool is available AND swarm_config.enabled == true:
  → Auto-select parallel/swarm mode
  → Display:
    "🐝 Agent Teams detected. Using swarm mode for parallel execution.
     Workers will self-schedule from shared task list with dependency constraints."
  → Proceed directly to analyze_dependencies (skip mode selection question)

ELSE:
  → Fall back to sequential mode
  → Display:
    "ℹ️ Agent Teams not available. Using sequential mode.
     To enable swarm mode, set CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
     before launching Claude Code."
  → Proceed to execute_sequential
```

**Why auto-detect:** When Agent Teams is enabled, swarm mode provides:
- Parallel story execution with dynamic work-claiming
- Dependency-aware scheduling (workers skip blocked tasks)
- Quality gate coordination via Hygeia
- Crash recovery via progress artifacts

There is no scenario where sequential mode is preferred when teams are available.
Manual mode selection is only shown as a fallback when teams is NOT available.

### Fallback: Manual Selection (only when teams unavailable)

If teams is NOT available, use AskUserQuestion:
```
How should stories be processed?

Options:
1. Sequential (process one-by-one in this session)
   - Verify code → build gaps → check boxes → next

2. Parallel (spawn concurrent Task agents — limited without Agent Teams)
   - Faster but no inter-agent coordination
```

For sequential: proceed to `execute_sequential`
For parallel: proceed to `analyze_dependencies`
</step>
