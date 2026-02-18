# Step 4.5: Story Reconciliation

**Execute:** AFTER story-pipeline completes, BEFORE marking story done
**Primary method:** Phase 6 spawns **Eunomia** (reconciliation agent) + hard validation gate
**Fallback:** Manual orchestrator-driven reconciliation (steps below)

---

## Primary: Agent-Driven Reconciliation (Phase 6)

Phase 6 of the story-pipeline now spawns **Eunomia** 📋, a dedicated reconciliation agent.
Eunomia reads completion artifacts, checks off tasks with evidence, fills the Dev Agent Record,
and outputs a structured JSON artifact (`{{story_key}}-reconciler.json`).

After Eunomia returns, Phase 6 runs a **hard validation gate**:
- **Zero tasks checked → HALT.** Cannot mark story done. Escalate to user.
- **<50% tasks checked → WARN.** Ask user to continue or investigate.
- **50%+ tasks checked → PROCEED** with status decision logic.

This gate makes it structurally impossible for a story to complete the pipeline
without its tasks being checked off.

---

## Fallback: Manual Orchestrator Reconciliation

If Eunomia fails to spawn, returns no artifact, or the agent approach fails for
any reason, the orchestrator falls back to the manual procedure below.

---

## Execute These Steps

### Step 1: Get What Was Built

Run this command with Bash tool:

```bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 STORY RECONCILIATION: {{story_key}}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get the commit for this story
echo "Recent commits:"
git log -5 --oneline | grep -i "{{story_key}}" || echo "(no commits found with story key)"

# Get files changed
echo ""
echo "Files changed in last commit:"
git diff HEAD~1 --name-only | grep -v "__tests__" | grep -v "\.test\." | head -20
```

Store the output - you'll need it for the next steps.

### Step 2: Read Story File

Use Read tool on: `{{sprint_artifacts}}/{{story_key}}.md`

Find these sections:
- **Tasks** (lines starting with `- [ ]` or `- [x]`)
- **Dev Agent Record** (section with Agent Model, Implementation Date, etc.)

### Step 3: Check Off Completed Tasks

For EACH task in the Tasks section that relates to files changed:

Use Edit tool:
```
file_path: {{sprint_artifacts}}/{{story_key}}.md
old_string: "- [ ] Create the SomeComponent"
new_string: "- [x] Create the SomeComponent"
```

**Match logic:**
- If task mentions a file that was created → check it off
- If task mentions a service/component that now exists → check it off
- If unsure → leave unchecked (don't over-claim)

### Step 4: Fill Dev Agent Record

Use Edit tool to replace the placeholder record:

```
file_path: {{sprint_artifacts}}/{{story_key}}.md
old_string: "### Dev Agent Record
- **Agent Model Used:** [Not set]
- **Implementation Date:** [Not set]
- **Files Created/Modified:** [Not set]
- **Tests Added:** [Not set]
- **Completion Notes:** [Not set]"
new_string: "### Dev Agent Record
- **Agent Model Used:** Claude Sonnet 4 (multi-agent pipeline)
- **Implementation Date:** 2026-01-26
- **Files Created/Modified:**
  - path/to/file1.ts
  - path/to/file2.ts
  [list all files from git diff]
- **Tests Added:** X tests (from Inspector report)
- **Completion Notes:** Implemented [brief summary]"
```

### Step 5: Verify Updates

Run this command with Bash tool:

```bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 RECONCILIATION VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STORY_FILE="{{sprint_artifacts}}/{{story_key}}.md"

# Count checked tasks
CHECKED=$(grep -c "^- \[x\]" "$STORY_FILE" 2>/dev/null || echo "0")
UNCHECKED=$(grep -c "^- \[ \]" "$STORY_FILE" 2>/dev/null || echo "0")
TOTAL=$((CHECKED + UNCHECKED))
echo "Tasks: $CHECKED/$TOTAL checked"

if [ "$CHECKED" -eq 0 ]; then
  echo ""
  echo "❌ HARD GATE: Zero tasks checked off — cannot mark story done"
  echo "This matches the Phase 6 Eunomia hard gate."
  echo "You MUST go back to Step 3 and check off tasks"
  exit 1
fi

# Warn if less than 50% checked (matches Eunomia hard gate threshold)
if [ "$TOTAL" -gt 0 ] && [ $((CHECKED * 100 / TOTAL)) -lt 50 ]; then
  echo ""
  echo "⚠️ WARNING: Only $((CHECKED * 100 / TOTAL))% tasks checked ($CHECKED/$TOTAL)"
  echo "Review before continuing — less than 50% reconciled"
fi

# Check Dev Agent Record filled
if grep -q "Implementation Date: \[Not set\]" "$STORY_FILE" 2>/dev/null; then
  echo "❌ BLOCKER: Dev Agent Record not filled"
  echo "You MUST go back to Step 4 and fill it"
  exit 1
fi

if grep -A 3 "### Dev Agent Record" "$STORY_FILE" | grep -q "Implementation Date: 202"; then
  echo "✅ Dev Agent Record: Filled"
else
  echo "❌ BLOCKER: Dev Agent Record incomplete"
  exit 1
fi

echo ""
echo "✅ RECONCILIATION COMPLETE"
echo "   Checked tasks: $CHECKED/$TOTAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

### Step 6: Update Sprint Status

Use Read tool: `{{implementation_artifacts}}/sprint-status.yaml`

Find the entry for {{story_key}} and use Edit tool to update:

```
old_string: "{{story_key}}: ready-for-dev"
new_string: "{{story_key}}: done  # ✅ COMPLETED 2026-01-26"
```

Or if 95%+ complete but not 100%:
```
new_string: "{{story_key}}: review  # 8/10 tasks - awaiting review"
```

---

## Status Decision Logic

Based on verification results:

| Condition | Status |
|-----------|--------|
| 95%+ tasks checked + Dev Record filled | `done` |
| 80-94% tasks checked | `review` |
| <80% tasks checked | `in-progress` |
| Dev Record not filled | `in-progress` |

---

## If Verification Fails

1. **DO NOT** proceed to next story
2. **DO NOT** mark story as done
3. **FIX** the issue using Edit tool
4. **RE-RUN** verification command
5. **REPEAT** until verification passes

This is mandatory. No shortcuts.
