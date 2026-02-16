# Step 3: Analyze Architecture Domains (3/8)

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
