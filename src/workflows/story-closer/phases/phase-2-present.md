# Phase 2: PRESENT (2/4)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PHASE 2: PRESENT (2/4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Show findings, select stories, choose mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2.1 Display Closeable Stories

If closeable stories exist, display detailed breakdown:

```
🔧 CLOSEABLE STORIES (≤30% unchecked — story-closer will handle):

| # | Story Key | Total | Done | Remaining | % Done |
|---|-----------|-------|------|-----------|--------|
| 1 | {{key}}   | {{n}} | {{n}}| {{n}}    | {{n}}% |
| 2 | {{key}}   | {{n}} | {{n}}| {{n}}    | {{n}}% |
...
```

### 2.2 Display Needs-Pipeline Stories

If needs-pipeline stories exist:

```
🔀 NEEDS FULL PIPELINE (>30% unchecked — will route to story-pipeline):

| # | Story Key | Total | Done | Remaining | % Done |
|---|-----------|-------|------|-----------|--------|
| 1 | {{key}}   | {{n}} | {{n}}| {{n}}    | {{n}}% |
...
```

### 2.3 Display Clean Stories (Summary Only)

```
✅ CLEAN: {{clean_count}} stories with all tasks complete (no action needed)
```

### 2.4 Handle Edge Cases

```
IF closeable_count == 0 AND needs_pipeline_count == 0:
  → "All stories are clean! Nothing to close."
  → HALT workflow.

IF closeable_count == 0 AND needs_pipeline_count > 0:
  → "No stories are closeable — all incomplete stories need the full pipeline."
  → Present needs-pipeline stories and ask if user wants to route them.
```

### 2.5 Story Selection

Present selection options:

```
**Which stories should I process?**

[A] All closeable stories ({{closeable_count}} stories)
[S] Select specific stories (enter numbers from the table above)
[I] Include needs-pipeline stories too (will route to full story-pipeline)
[N] Include specific needs-pipeline stories (enter numbers)
```

Wait for user selection.

**IF A:** Select all closeable stories.
**IF S:** Collect story numbers from user, validate against closeable list.
**IF I:** Select all closeable + all needs-pipeline stories.
**IF N:** Collect specific needs-pipeline story numbers, add to closeable selection.

Confirm selection: "Selected {{count}} stories for processing. Proceed?"

### 2.6 Execution Mode Selection

```
**How should I execute?**

[S] Sequential — one story at a time (safer, easier to monitor)
[P] Parallel — multiple stories at once (faster, uses more resources)
```

Wait for user selection.

**IF S:** Set execution_mode = "sequential"
**IF P:** Set execution_mode = "parallel"

### 2.7 Final Confirmation

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 READY TO EXECUTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stories:  {{selected_count}} selected
  🔧 Closeable:      {{closeable_selected}} (story-closer)
  🔀 Needs Pipeline:  {{pipeline_selected}} (full story-pipeline)
Mode:     {{sequential/parallel}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Proceed? [Y] Yes, start execution / [N] No, go back to selection
```

**IF Y:** Proceed to Phase 3 with selected stories and execution mode.
**IF N:** Return to step 2.5 for re-selection.

### 2.8 Proceed to Phase 3

Pass to Phase 3:
- `selected_stories`: list of {story_key, story_file, total, checked, unchecked, category}
- `execution_mode`: "sequential" or "parallel"

**Starting batch execution...**

Load and execute `phases/phase-3-execute.md`.
