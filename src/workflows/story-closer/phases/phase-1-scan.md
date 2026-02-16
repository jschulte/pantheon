# Phase 1: SCAN (1/4)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 PHASE 1: SCAN (1/4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scan all story files, categorize by completion
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.1 Locate Sprint Artifacts

```bash
SPRINT_DIR="{{sprint_artifacts}}"
[ -d "$SPRINT_DIR" ] || { echo "ERROR: Sprint artifacts directory not found at $SPRINT_DIR"; exit 1; }
```

Use Glob to find all `*.md` files in the sprint artifacts directory (top-level only, not subdirectories like `completions/`).

### 1.2 Filter to Story Files

Skip non-story files by excluding:
- Files starting with `README`, `index`, `template`, `session-report`
- Files in subdirectories (`completions/`, etc.)
- Files without any task checkboxes (`- [ ]` or `- [x]`)

For each candidate file, verify it has at least one task checkbox before counting.

### 1.3 Count Tasks Per Story

For each story file, count:

```bash
CHECKED=$(grep -c "^- \[x\]" "$STORY_FILE" 2>/dev/null || echo "0")
UNCHECKED=$(grep -c "^- \[ \]" "$STORY_FILE" 2>/dev/null || echo "0")
TOTAL=$((CHECKED + UNCHECKED))
```

**CRITICAL:** Scan EVERY story file regardless of what sprint-status.yaml says.
Stories marked "done" in sprint-status may still have unchecked tasks — that's exactly
what this workflow is designed to catch.

### 1.4 Categorize Each Story

```
FOR EACH story_file:
  story_key = filename without .md extension
  pct_unchecked = UNCHECKED / TOTAL

  IF TOTAL == 0:
    → SKIP (no tasks in file, not a real story)

  ELIF UNCHECKED == 0:
    → CLEAN (fully done, 0 unchecked)

  ELIF pct_unchecked <= 0.30:
    → CLOSEABLE (story-closer can handle this)

  ELSE:
    → NEEDS_PIPELINE (>30% unchecked, route to full story-pipeline)
```

### 1.5 Build Scan Results

Construct a scan results summary:

```
scan_results = {
  total_stories_scanned: N,
  clean: [list of {story_key, total, checked, unchecked}],
  closeable: [list of {story_key, total, checked, unchecked, pct_unchecked}],
  needs_pipeline: [list of {story_key, total, checked, unchecked, pct_unchecked}],
  skipped: [list of {filename, reason}]
}
```

### 1.6 Display Scan Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 SCAN COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 {{total_stories_scanned}} stories scanned

  ✅ CLEAN:          {{clean_count}} stories (all tasks done)
  🔧 CLOSEABLE:      {{closeable_count}} stories (≤30% unchecked)
  🔀 NEEDS PIPELINE: {{needs_pipeline_count}} stories (>30% unchecked)
  ⏭️  SKIPPED:        {{skipped_count}} files (no tasks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.7 Proceed to Phase 2

Pass scan results to Phase 2 for user presentation and selection.

**Proceeding to story selection...**

Load and execute `phases/phase-2-present.md`.
