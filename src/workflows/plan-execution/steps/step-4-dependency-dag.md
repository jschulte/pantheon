# Step 4: Build Dependency DAG (4/8)

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
