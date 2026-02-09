# Plan Team Sprint v1.0 - Team Execution Planner

<purpose>
Analyze epics and architecture to build a dependency DAG and generate an optimal team execution
plan that assigns work across N developers with maximum parallelism and minimum file conflicts.
Supports initial planning (greenfield/brownfield) and mid-project rebalancing.
</purpose>

<philosophy>
**Maximize Parallelism, Minimize Conflicts**

- Understand the full dependency graph before assigning any work
- Group work by domain affinity so each developer primarily touches one module/layer
- Balance workload across the team — no one developer should be a bottleneck
- Identify coordination checkpoints explicitly — handoffs are where things break
- Surface risk zones (same files, different devs) early so mitigation can be planned
- Support iterative refinement — the human knows their team better than any algorithm
</philosophy>

<config>
name: plan-team-sprint
execution_mode: interactive

steps:
  step_1: Load & Validate Inputs
  step_2: Gather Team Configuration
  step_3: Analyze Architecture Domains
  step_4: Build Dependency DAG
  step_5: Compute Developer Work Streams
  step_6: Generate Execution Phases
  step_7: Interactive Refinement
  step_8: Generate Outputs
</config>

<process>

<step name="step_1_load_validate">
## Step 1: Load & Validate Inputs (1/8)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 1: LOAD & VALIDATE INPUTS (1/8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Discovering project artifacts...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.1 Discover and Read Epics

```
# Try whole-file epics first, then sharded
IF exists("docs/epics.md"):
  EPICS_SOURCE = Read("docs/epics.md")
  EPICS_MODE = "single"
ELIF exists("docs/epics/*.md"):
  EPICS_SOURCE = Read each shard in docs/epics/
  EPICS_MODE = "sharded"
ELSE:
  HALT: "No epics found. Run /create-epics-and-stories first."
```

### 1.2 Discover and Read Architecture

```
IF exists("docs/architecture.md"):
  ARCHITECTURE = Read("docs/architecture.md")
ELSE:
  HALT: "No architecture.md found. Run /create-architecture first."
```

### 1.3 Check for Sprint Status (Rebalance Mode)

```
IF exists("docs/sprint-artifacts/sprint-status.yaml"):
  SPRINT_STATUS = Read("docs/sprint-artifacts/sprint-status.yaml")
  REBALANCE_MODE = true

  # Parse completed stories
  COMPLETED_STORIES = stories WHERE status == "done"
  COMPLETED_EPICS = epics WHERE all stories are "done"
  REMAINING_STORIES = stories WHERE status != "done"

  echo "Rebalance mode: {{COMPLETED_STORIES.count}} stories done, {{REMAINING_STORIES.count}} remaining"
ELSE:
  REBALANCE_MODE = false
  echo "Initial planning mode (no sprint-status found)"
```

### 1.4 Parse Epic & Story Inventory

```
FOR EACH epic IN EPICS_SOURCE:
  Extract:
    - epic_id (e.g., "Epic 1", "Epic 2")
    - epic_title
    - epic_description
    - stories[] with:
      - story_key (e.g., "1-1", "1-2")
      - story_title
      - story_size (if available: S/M/L/XL)
      - story_tasks_count
      - story_domains[] (inferred in Step 3)
      - story_dependencies[] (explicit if listed, inferred in Step 4)

TOTAL_EPICS = count of epics
TOTAL_STORIES = count of all stories across epics
```

### 1.5 Detect Project Type

```
IF project_type == "auto-detect":
  IF REBALANCE_MODE AND COMPLETED_STORIES.count > 0:
    PROJECT_TYPE = "brownfield"
  ELIF architecture mentions "existing codebase" OR "legacy" OR "migration":
    PROJECT_TYPE = "brownfield"
  ELSE:
    PROJECT_TYPE = "greenfield"
ELSE:
  PROJECT_TYPE = project_type  # User override
```

### 1.6 Display Input Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  INPUT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project Type: {{PROJECT_TYPE}}
  Mode:         {{REBALANCE_MODE ? "Rebalance" : "Initial Planning"}}
  Epics:        {{TOTAL_EPICS}}
  Stories:      {{TOTAL_STORIES}}
  {{IF REBALANCE_MODE}}
  Completed:    {{COMPLETED_STORIES.count}} stories ({{COMPLETED_EPICS.count}} full epics)
  Remaining:    {{REMAINING_STORIES.count}} stories
  {{ENDIF}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</step>

<step name="step_2_team_config">
## Step 2: Gather Team Configuration (2/8)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 2: TEAM CONFIGURATION (2/8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Configuring developer team...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2.1 Team Size

```
IF team_size NOT provided:
  AskUserQuestion: "How many developers are on the team?"
  Options: [2, 3, 4, 5+]
  TEAM_SIZE = user response

ELSE:
  TEAM_SIZE = team_size
```

### 2.2 Developer Profiles

```
IF developer_profiles NOT provided:
  AskUserQuestion: "Do you want to define developer specializations?"
  Options:
    - "Yes, let me define each developer"
    - "No, assume all are fullstack generalists"

  IF "Yes":
    FOR i IN 1..TEAM_SIZE:
      AskUserQuestion: "Developer {{i}} — Name and specialization?"
      Specialization options: [frontend, backend, fullstack, database, infrastructure]

      DEVELOPERS[i] = {
        name: user_name,
        specialization: user_specialization
      }

  ELSE:
    FOR i IN 1..TEAM_SIZE:
      DEVELOPERS[i] = {
        name: "Dev {{i}}",
        specialization: "fullstack"
      }

ELSE:
  DEVELOPERS = developer_profiles
```

### 2.3 Display Team Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TEAM COMPOSITION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  | # | Name       | Specialization |
  |---|------------|----------------|
  | 1 | {{name_1}} | {{spec_1}}     |
  | 2 | {{name_2}} | {{spec_2}}     |
  | ...                              |
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

AskUserQuestion: "Does this look correct?"
Options: ["Yes, proceed", "Edit team composition"]

</step>

<step name="step_3_architecture_domains">
## Step 3: Analyze Architecture Domains (3/8)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 3: ARCHITECTURE DOMAIN ANALYSIS (3/8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mapping epics/stories to architecture domains...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3.1 Extract Architecture Domains

Read architecture.md and identify:

```
DOMAINS = {
  frontend: {
    description: "UI components, pages, client-side logic",
    key_modules: [extracted from architecture],
    shared_components: [auth UI, layout, navigation]
  },
  backend: {
    description: "API routes, services, business logic",
    key_modules: [extracted from architecture],
    shared_components: [middleware, error handling, logging]
  },
  database: {
    description: "Schema, migrations, data models",
    key_modules: [extracted from architecture],
    shared_components: [ORM config, seed data]
  },
  infrastructure: {
    description: "CI/CD, deployment, monitoring, config",
    key_modules: [extracted from architecture],
    shared_components: [env config, Docker, secrets]
  },
  shared: {
    description: "Cross-cutting concerns",
    key_modules: [auth, logging, error handling, types/interfaces],
    shared_components: []
  }
}
```

### 3.2 Identify Data Model Relationships

```
DATA_RELATIONSHIPS = []
FOR EACH entity/model referenced in architecture:
  Identify:
    - Which epics create/modify this entity
    - Which epics read this entity
    - Foreign key / relationship dependencies

  DATA_RELATIONSHIPS.push({
    entity: entity_name,
    created_by: [epic_ids],
    consumed_by: [epic_ids],
    migration_required: boolean
  })
```

### 3.3 Identify API Contracts

```
API_CONTRACTS = []
FOR EACH API boundary in architecture:
  Identify:
    - Producer epic (backend endpoint)
    - Consumer epic(s) (frontend/other services)
    - Contract definition (request/response shape)

  API_CONTRACTS.push({
    endpoint: endpoint_description,
    producer_epic: epic_id,
    consumer_epics: [epic_ids],
    contract: shape_description
  })
```

### 3.4 Tag Stories with Domains

```
FOR EACH story IN all_stories:
  story.domains = []

  # Infer domains from story description, tasks, and architecture context
  IF story mentions UI components, pages, forms, styling:
    story.domains.push("frontend")
  IF story mentions API routes, services, middleware, business logic:
    story.domains.push("backend")
  IF story mentions schema, migrations, models, queries:
    story.domains.push("database")
  IF story mentions CI/CD, Docker, deployment, monitoring:
    story.domains.push("infrastructure")
  IF story mentions auth, logging, types that cross boundaries:
    story.domains.push("shared")

  # Flag multi-domain stories (higher conflict risk)
  story.cross_cutting = story.domains.length > 1
```

### 3.5 Display Domain Mapping

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DOMAIN MAPPING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Epic 1: {{title}}
    Story 1-1: [frontend, backend]
    Story 1-2: [database]
    Story 1-3: [frontend]

  Epic 2: {{title}}
    Story 2-1: [infrastructure]
    Story 2-2: [backend, database]
    ...

  Domain Distribution:
    frontend:       {{count}} stories
    backend:        {{count}} stories
    database:       {{count}} stories
    infrastructure: {{count}} stories
    shared:         {{count}} stories
    cross-cutting:  {{count}} stories (higher conflict risk)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

AskUserQuestion: "Does this domain mapping look accurate? Any corrections?"
Options: ["Looks good", "I have corrections"]

IF corrections:
  Apply user feedback and re-display.

</step>

<step name="step_4_dependency_dag">
## Step 4: Build Dependency DAG (4/8)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 4: DEPENDENCY ANALYSIS (4/8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Building dependency graph...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.1 Analyze Epic-Level Dependencies

Go beyond linear ordering in epics.md. Determine which epics are truly independent vs dependent.

```
EPIC_DEPS = {}

FOR EACH epic_a IN all_epics:
  FOR EACH epic_b IN all_epics WHERE epic_b != epic_a:

    # Check: Does epic_b depend on epic_a?
    dependency_reasons = []

    # Data model dependencies
    IF epic_b consumes entities created by epic_a:
      dependency_reasons.push("data: {{entity}} created in {{epic_a}}, consumed in {{epic_b}}")

    # API contract dependencies
    IF epic_b consumes API endpoints produced by epic_a:
      dependency_reasons.push("API: {{endpoint}} produced in {{epic_a}}, consumed in {{epic_b}}")

    # Shared component dependencies
    IF epic_b uses shared components built in epic_a:
      dependency_reasons.push("shared: {{component}} built in {{epic_a}}, used in {{epic_b}}")

    # Infrastructure dependencies
    IF epic_b requires infrastructure set up in epic_a:
      dependency_reasons.push("infra: {{resource}} set up in {{epic_a}}, needed by {{epic_b}}")

    IF dependency_reasons.length > 0:
      EPIC_DEPS[epic_b] = EPIC_DEPS[epic_b] || []
      EPIC_DEPS[epic_b].push({
        depends_on: epic_a,
        reasons: dependency_reasons
      })
```

### 4.2 Analyze Cross-Epic Story Dependencies

For stories in different epics that have direct dependencies:

```
STORY_DEPS = {}

FOR EACH story IN all_stories:
  STORY_DEPS[story.key] = []

  # Shared database tables/migrations
  IF story modifies a table that another story also modifies:
    STORY_DEPS[story.key].push({
      depends_on: other_story.key,
      reason: "shared migration: {{table_name}}"
    })

  # API contracts between layers
  IF story implements frontend that consumes API from another story:
    STORY_DEPS[story.key].push({
      depends_on: api_story.key,
      reason: "API: frontend consumes {{endpoint}}"
    })

  # Shared components
  IF story uses a component/utility built in another story:
    STORY_DEPS[story.key].push({
      depends_on: component_story.key,
      reason: "shared: uses {{component}}"
    })
```

### 4.3 Identify Foundation Set (Greenfield)

```
IF PROJECT_TYPE == "greenfield":
  FOUNDATION_SET = stories/epics that:
    - Set up project scaffolding
    - Create initial database schema
    - Establish auth/session infrastructure
    - Configure build tooling and CI
    - Define shared types/interfaces

  echo "Foundation set: {{FOUNDATION_SET.count}} stories must complete before fan-out"
```

### 4.4 Detect Circular Dependencies

```
FOR EACH node IN dependency_graph:
  Run DFS to detect cycles

  IF cycle_detected:
    CIRCULAR_DEPS.push({
      cycle: [node_a, node_b, ..., node_a],
      suggestion: "Break cycle by: {{suggested_resolution}}"
    })

IF CIRCULAR_DEPS.length > 0:
  WARN: "Circular dependencies detected!"
  Display cycles and suggestions
```

### 4.5 Identify Independent Epics

```
INDEPENDENT_EPICS = epics WHERE:
  - No epic depends on them AND they depend on no epic
  - OR they share only a common ancestor that is already in the foundation set

PARALLEL_GROUPS = group independent epics by shared ancestor
```

### 4.6 Display Dependency Graph (Mermaid)

Generate a Mermaid flowchart:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DEPENDENCY GRAPH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

~~~mermaid
flowchart TD
    E1[Epic 1: Project Setup] --> E3[Epic 3: User Dashboard]
    E1 --> E4[Epic 4: API Layer]
    E2[Epic 2: Auth System] --> E3
    E2 --> E5[Epic 5: Admin Panel]
    E4 --> E3
    E4 --> E5

    classDef foundation fill:#f9a825,stroke:#f57f17
    classDef parallel fill:#66bb6a,stroke:#388e3c
    classDef convergence fill:#42a5f5,stroke:#1565c0

    class E1,E2 foundation
    class E3,E4,E5 parallel
~~~

```
  Legend:
    [Yellow] Foundation - must complete first
    [Green]  Parallel   - can run concurrently
    [Blue]   Convergence - requires multiple inputs

  Critical Path: E1 -> E4 -> E5 (longest chain)

  Key Dependencies:
    E3 depends on E1 (project setup) + E2 (auth) + E4 (API)
    E5 depends on E2 (auth) + E4 (API)
    E3 and E5 are independent of each other
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

AskUserQuestion: "Does this dependency graph look correct? Any adjustments?"
Options: ["Looks correct", "I see missing dependencies", "I see incorrect dependencies"]

IF adjustments:
  Apply user feedback and regenerate graph.

</step>

<step name="step_5_work_streams">
## Step 5: Compute Developer Work Streams (5/8)

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

</step>

<step name="step_6_execution_phases">
## Step 6: Generate Execution Phases (6/8)

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

</step>

<step name="step_7_refinement">
## Step 7: Interactive Refinement (7/8)

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

</step>

<step name="step_8_generate_outputs">
## Step 8: Generate Outputs (8/8)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 8: GENERATE OUTPUTS (8/8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Writing execution plan...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 8.1 Generate team-execution-plan.md

Use the template at `templates/team-execution-plan-template.md` to generate the output document.

Fill all template placeholders with computed values:
- `{{project_name}}` - from project context
- `{{generated_date}}` - current date
- `{{team_size}}` - number of developers
- `{{total_epics}}` / `{{total_stories}}` - inventory counts
- `{{mode}}` - "Initial Planning" or "Rebalance"
- `{{rebalance_summary}}` - if rebalance mode
- Developer table, dependency graph, phases, work streams, checkpoints, risk zones

```
Read template from: templates/team-execution-plan-template.md
Fill placeholders with computed data
Write to: docs/team-execution-plan.md
```

### 8.2 Enrich Sprint Status (Optional)

```
IF exists("docs/sprint-artifacts/sprint-status.yaml"):
  # Add team_assignments section
  Append to sprint-status.yaml:

  team_assignments:
    generated: {{timestamp}}
    team_size: {{TEAM_SIZE}}
    developers:
      - name: {{dev_1_name}}
        specialization: {{dev_1_spec}}
        stream: {{dev_1_stream_name}}
        stories: [story_keys]
      - name: {{dev_2_name}}
        ...
    phases:
      - phase: 0
        name: Foundation
        stories: [story_keys]
        status: pending
      - phase: 1
        name: Fan-out
        stories: [story_keys]
        status: pending
      ...
```

### 8.3 Display Final Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PLAN COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Team: {{TEAM_SIZE}} developers
  Epics: {{TOTAL_EPICS}} ({{TOTAL_STORIES}} stories)
  {{IF REBALANCE_MODE}}
  Remaining: {{REMAINING_STORIES.count}} stories
  {{ENDIF}}
  Phases: {{PHASES.count}}
  Checkpoints: {{CHECKPOINTS.count}}
  Risk Zones: {{RISK_ZONES.count}}

  Output:
    docs/team-execution-plan.md
    {{IF sprint_status_enriched}}
    docs/sprint-artifacts/sprint-status.yaml (enriched)
    {{ENDIF}}

  Next Steps:
    1. Share team-execution-plan.md with the team
    2. Each developer reviews their work stream
    3. Foundation developers start Phase 0
    4. Run /batch-stories when ready to implement

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</step>

</process>

<failure_handling>
**No epics found (Step 1):** Halt and suggest running /create-epics-and-stories first.
**No architecture found (Step 1):** Halt and suggest running /create-architecture first.
**Circular dependencies (Step 4):** Warn user with cycle details and suggested resolutions.
**Unbalanceable workload (Step 5):** Suggest increasing team size or splitting large stories.
**Too few stories for team (Step 5):** Suggest reducing team size or combining with other work.
**Refinement limit reached (Step 7):** Proceed with current plan, note adjustments were capped.
</failure_handling>

<success_criteria>
- [ ] Step 1: Epics and architecture loaded successfully
- [ ] Step 2: Team composition confirmed by user
- [ ] Step 3: Domain mapping reviewed and approved by user
- [ ] Step 4: Dependency graph reviewed and approved by user
- [ ] Step 5: Work streams computed with balanced workload
- [ ] Step 6: Execution phases organized with checkpoints
- [ ] Step 7: User approved final plan
- [ ] Step 8: team-execution-plan.md written to docs/
- [ ] No circular dependencies (or user acknowledged them)
- [ ] All stories assigned to exactly one developer
- [ ] Risk zones identified with mitigations
</success_criteria>
