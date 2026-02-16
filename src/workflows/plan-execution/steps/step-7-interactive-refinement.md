# Step 7: Interactive Refinement (7/8)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 7: INTERACTIVE REFINEMENT (7/8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Review and adjust the plan...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 7.1 Present Complete Plan

Display the full plan: dependency graph, work streams, phases, risk zones, checkpoints.

### 7.2 Solicit Adjustments

```
REFINEMENT_ROUND = 0

WHILE REFINEMENT_ROUND < max_refinement_rounds:
  AskUserQuestion: "Would you like to adjust the plan?"
  Options:
    - "Approve plan as-is"
    - "Move stories between developers"
    - "Adjust developer capacity (junior/senior)"
    - "Re-route domain-specific work"
    - "Other adjustment"

  IF "Approve plan as-is":
    BREAK

  IF "Move stories between developers":
    AskUserQuestion: "Which story should move, and to which developer?"
    Apply move, respecting dependency constraints
    Re-display affected work streams

  IF "Adjust developer capacity":
    AskUserQuestion: "Which developer, and what adjustment?"
    Examples:
      - "Dev Z is a junior — give them less complex work"
      - "Dev W is our database expert — route all migration stories there"
    Re-balance workload accordingly
    Re-display work streams

  IF "Re-route domain-specific work":
    AskUserQuestion: "Which domain should go to which developer?"
    Re-assign domain stories
    Re-display work streams

  IF "Other adjustment":
    AskUserQuestion: "Describe the adjustment you'd like."
    Parse and apply adjustment
    Re-display affected sections

  REFINEMENT_ROUND += 1

IF REFINEMENT_ROUND >= max_refinement_rounds:
  echo "Maximum refinement rounds reached. Proceeding with current plan."
```
