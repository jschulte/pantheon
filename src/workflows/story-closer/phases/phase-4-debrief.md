# Phase 4: DEBRIEF (4/4)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PHASE 4: DEBRIEF (4/4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary, blocker questions, re-run option
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.1 Completed Stories Detail

If completed stories exist:

```
✅ COMPLETED STORIES:

| Story Key | Tasks Done | Commit |
|-----------|------------|--------|
| {{key}}   | {{n}}/{{n}}| {{hash}}|
...
```

### 4.2 Partially Blocked Stories

If blocked stories exist:

```
⚠️ PARTIALLY BLOCKED STORIES:

| Story Key | Tasks Done | Blocked | Reason |
|-----------|------------|---------|--------|
| {{key}}   | {{n}}/{{n}}| {{n}}  | See questions below |
...
```

### 4.3 Routed to Pipeline

If stories were routed to full pipeline:

```
🔀 ROUTED TO FULL STORY-PIPELINE:

These stories have >30% unchecked tasks and need the full pipeline treatment.

| Story Key | Total | Unchecked | % Unchecked |
|-----------|-------|-----------|-------------|
| {{key}}   | {{n}} | {{n}}    | {{n}}%     |
...

To process these, run the story-pipeline workflow for each story.
```

### 4.4 Blocker Questions

**This is the deferred escalation point.** All questions that Teleos workers
collected during execution are presented here at once.

If blocker questions exist:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ BLOCKER QUESTIONS ({{count}} total)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
These tasks could not be completed autonomously.
Please review and provide guidance.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Story: {{story_key_1}}**

  Q1: {{task_text}}
      Blocker: {{description of what blocked the agent}}

  Q2: {{task_text}}
      Blocker: {{description}}

**Story: {{story_key_2}}**

  Q3: {{task_text}}
      Blocker: {{description}}

...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.5 Human Validation Tasks

If human-validation tasks were collected:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 HUMAN VALIDATION TASKS ({{count}} total)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
These tasks require manual verification by a human.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Story: {{story_key_1}}**
  - [ ] {{task_text}}
  - [ ] {{task_text}}

**Story: {{story_key_2}}**
  - [ ] {{task_text}}

...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.6 Errors

If errors occurred:

```
❌ ERRORS:

| Story Key | Error |
|-----------|-------|
| {{key}}   | {{error_message}} |
...
```

### 4.7 Final Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 STORY CLOSER — FINAL SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Selected:             {{total_selected}}
  ✅ Fully completed:   {{completed_count}}
  ⚠️ Partially done:    {{blocked_count}}
  🔀 Routed to pipeline:{{routed_count}}
  ❌ Errors:            {{error_count}}
  ❓ Blocker questions:  {{question_count}}
  👤 Human validation:   {{human_task_count}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.8 Re-Run Option

If there are blocked stories or blocker questions:

```
**What would you like to do next?**

[R] Re-run story-closer for blocked stories (after answering questions above)
[P] Route blocked stories to full story-pipeline
[D] Done — I'll handle the rest manually
```

**IF R:**
- Collect user answers to blocker questions
- Re-run Phase 3 with blocked stories only, providing the user's answers as additional context to Teleos workers
- Return to Phase 4 debrief with updated results

**IF P:**
- Note blocked stories for full pipeline processing
- Display: "Blocked stories noted for full pipeline. Run story-pipeline for each."
- End workflow.

**IF D:**
- Display: "Story closer complete. Review human validation tasks above and handle blocked stories manually."
- End workflow.

If no blocked stories:

```
**All selected stories fully closed! Story closer complete.**
```

End workflow.
