# Step 6: Generate Execution Phases (6/8)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 6: EXECUTION PHASES (6/8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Organizing work into execution phases...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 6.1 Phase Assignment

Organize the work into execution phases. These are not time-boxed sprints — the user maps them to their own cadence.

```
PHASES = []

# Phase 0: Foundation (greenfield only)
IF PROJECT_TYPE == "greenfield" AND FOUNDATION_SET.length > 0:
  PHASES.push({
    id: 0,
    name: "Foundation",
    description: "Critical path work — project scaffolding, initial schema, auth infrastructure",
    assigned_devs: [foundation_devs],
    stories: FOUNDATION_SET,
    unblocks: [list of epics/stories unblocked by foundation],
    other_devs_activity: "Review docs, set up dev environments, review architecture, prepare designs"
  })

# Phase 1: Fan-out
PHASE_1_STORIES = stories that become available after foundation completes
  (OR all non-foundation stories if brownfield)

PHASES.push({
  id: 1,
  name: "Fan-out",
  description: "Foundation complete — parallel work streams open, most devs active",
  assigned_devs: ALL,
  stories: PHASE_1_STORIES,
  parallel_lanes: group by developer
})

# Phase 2: Steady State
PHASE_2_STORIES = stories that become available after Phase 1 dependencies resolve

IF PHASE_2_STORIES.length > 0:
  PHASES.push({
    id: 2,
    name: "Steady State",
    description: "Full parallelism — devs working domain-by-domain",
    assigned_devs: ALL,
    stories: PHASE_2_STORIES,
    parallel_lanes: group by developer
  })

# Phase 3: Convergence
CONVERGENCE_STORIES = stories that require multiple developers' outputs

IF CONVERGENCE_STORIES.length > 0:
  PHASES.push({
    id: 3,
    name: "Convergence",
    description: "Cross-cutting integration — streams merge, final polish",
    assigned_devs: ALL,
    stories: CONVERGENCE_STORIES,
    coordination_points: list of integration touchpoints
  })
```

### 6.2 Rebalance Mode Adjustments

```
IF REBALANCE_MODE:
  # Filter out completed phases
  FOR EACH phase IN PHASES:
    phase.stories = phase.stories.filter(s => !COMPLETED_STORIES.includes(s))
    IF phase.stories.length == 0:
      phase.status = "completed"

  # Show only remaining work
  echo "Skipping completed phases. Showing remaining work only."
```

### 6.3 Display Execution Phases

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EXECUTION PHASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Phase 0: Foundation {{IF completed: "(DONE)"}}
  ─────────────────────
  Devs: {{foundation_devs}}
  Stories: {{story_list}}
  Unblocks: {{unblocked_items}}
  Others: {{other_devs_activity}}

  Phase 1: Fan-out {{IF completed: "(DONE)"}}
  ─────────────────────
  Dev 1: {{stories}}
  Dev 2: {{stories}}
  Dev 3: {{stories}}
  Checkpoints: {{relevant_checkpoints}}

  Phase 2: Steady State
  ─────────────────────
  Dev 1: {{stories}}
  Dev 2: {{stories}}
  Dev 3: {{stories}}
  Checkpoints: {{relevant_checkpoints}}

  Phase 3: Convergence
  ─────────────────────
  Integration: {{convergence_stories}}
  Coordination: {{integration_points}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
