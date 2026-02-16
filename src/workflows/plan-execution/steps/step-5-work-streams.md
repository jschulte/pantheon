# Step 5: Compute Developer Work Streams (5/8)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 5: DEVELOPER WORK STREAMS (5/8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Computing optimal parallel work lanes...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5.1 Compute Work Stream Assignment

Given N developers and the dependency DAG, optimize for:

```
OPTIMIZATION_GOALS (in priority order):
  1. DEPENDENCY RESPECT
     - Never assign a story to Dev B if it depends on Dev A's unfinished work
       (unless explicit coordination checkpoint is defined)

  2. DOMAIN AFFINITY
     - Group work so each dev primarily touches one module/layer
     - Fewer context switches = fewer merge conflicts = faster delivery
     - Match developer specialization to domain when available

  3. WORKLOAD BALANCE
     - Roughly equal story counts per developer
     - Weight by story size if available (XL=4, L=3, M=2, S=1)
     - No developer should have >150% of the average workload

  4. CONFLICT MINIMIZATION
     - Prefer assignments where developers touch non-overlapping files
     - Flag unavoidable overlaps as risk zones
```

### 5.2 Assignment Algorithm

```
# Step A: Handle foundation (greenfield only)
IF PROJECT_TYPE == "greenfield":
  Assign FOUNDATION_SET to 1-2 developers (prefer infrastructure/backend specialists)
  Mark remaining developers as "available after foundation"

# Step B: Group remaining stories by domain
DOMAIN_GROUPS = {
  frontend: [stories tagged frontend],
  backend: [stories tagged backend],
  database: [stories tagged database],
  infrastructure: [stories tagged infrastructure],
  cross_cutting: [stories tagged with 2+ domains]
}

# Step C: Assign domain groups to developers
FOR EACH developer IN DEVELOPERS:
  IF developer.specialization matches a domain:
    PREFER assigning that domain's stories
  ELSE:
    Assign from largest unassigned domain group

# Step D: Handle cross-cutting stories
FOR EACH cross_cutting_story:
  Assign to the developer whose existing stream has most overlap with this story's domains
  Mark coordination checkpoints if story spans multiple developers' domains

# Step E: Balance workload
WHILE max_workload > 1.5 * average_workload:
  Move stories from overloaded dev to underloaded dev
  (respecting domain affinity and dependencies)
```

### 5.3 Identify Coordination Checkpoints

```
CHECKPOINTS = []

FOR EACH story_a assigned to dev_x:
  FOR EACH story_b assigned to dev_y WHERE dev_y != dev_x:
    IF story_b depends on story_a:
      CHECKPOINTS.push({
        producer: dev_x,
        consumer: dev_y,
        handoff: "{{story_a.key}} -> {{story_b.key}}",
        what: dependency_reason,
        when: "After {{story_a.key}} completes"
      })
```

### 5.4 Identify Risk Zones

```
RISK_ZONES = []

FOR EACH file_pattern referenced by multiple stories:
  IF those stories are assigned to different developers:
    RISK_ZONES.push({
      file_pattern: pattern,
      stories: [story_keys],
      developers: [dev_names],
      mitigation: determine_mitigation(stories)
    })

# Mitigation strategies:
#   - "Sequence these stories (assign both to same dev)"
#   - "Define interface contract first, then implement independently"
#   - "Use feature flags to isolate changes"
#   - "Coordinate via PR review before merge"
```

### 5.5 Display Work Streams

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DEVELOPER WORK STREAMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Dev 1: {{name}} ({{specialization}}) - "{{stream_name}}"
  ┌──────────┬────────────┬─────────┬────────┐
  │ Story    │ Epic       │ Domains │ Size   │
  ├──────────┼────────────┼─────────┼────────┤
  │ 1-1      │ Epic 1     │ backend │ M      │
  │ 1-2      │ Epic 1     │ backend │ L      │
  │ 4-1      │ Epic 4     │ backend │ M      │
  └──────────┴────────────┴─────────┴────────┘
  Total: {{count}} stories, estimated effort: {{effort}}

  Dev 2: {{name}} ({{specialization}}) - "{{stream_name}}"
  ...

  Coordination Checkpoints:
  ┌────────────┬──────────┬──────────┬──────────────┐
  │ Checkpoint │ Producer │ Consumer │ Handoff      │
  ├────────────┼──────────┼──────────┼──────────────┤
  │ API ready  │ Dev 1    │ Dev 2    │ 4-1 -> 3-2   │
  │ Auth done  │ Dev 3    │ Dev 1,2  │ 2-3 -> 1-4   │
  └────────────┴──────────┴──────────┴──────────────┘

  Risk Zones:
  ┌───────────────────┬────────────┬───────────────────────────┐
  │ Files             │ Developers │ Mitigation                │
  ├───────────────────┼────────────┼───────────────────────────┤
  │ src/auth/*        │ Dev 1,3    │ Define interface first    │
  │ prisma/schema     │ Dev 1,2    │ Sequence migrations       │
  └───────────────────┴────────────┴───────────────────────────┘
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
