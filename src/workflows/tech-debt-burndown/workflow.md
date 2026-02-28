# Tech Debt Burndown Workflow

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 TECH DEBT BURNDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Harvest → Analyze → Propose → Create
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Overview

This workflow harvests tracked issues from the local JSON index (`tracked-issues.json`) or GitHub Issues (as fallback), clusters them by root cause, proposes stories interactively for user approval, then generates BMAD-formatted story files.

**When to use:** After running `/batch-review` or `/batch-stories` which create tracked issues. Periodically, to convert accumulated tech debt into actionable work.

## Phases

### Phase 1: HARVEST (Charon ⛵)
- Read local `tracked-issues.json` index (primary), or fetch GitHub Issues (fallback)
- Filter by scope (type, epic, date, status=open)
- Group by file domain, label type, perspective, age
- **Gate:** 0 issues → clean exit

### Phase 2: ANALYZE (Clotho 🧵)
- Root-cause clustering: issues sharing same underlying problem → one cluster
- Pattern detection: "5 DRY violations in auth layer" → one story
- Deduplication within clusters
- Effort estimation per cluster
- Dependency mapping between clusters

### Phase 3: PROPOSE (Interactive)
- Present each cluster as a proposal
- User actions: Approve / Edit title / Skip / Merge with another / Quit
- Collect approved proposals
- **Gate:** 0 approved → clean exit

### Phase 4: CREATE (Daedalus ⚒️)
- Generate BMAD story files (6-12KB each)
- Mark source issues as `addressed` in local index
- Optional: export to GitHub Issues (if `export_to_github: true`)
- Generate burndown summary report

## Configuration

See `workflow.yaml` for all configuration options. Key settings:

- **scope.labels** — Which labels to harvest (default: tech-debt, should-fix, code-health)
- **scope.epic** — Optional: filter by epic
- **scope.since** — Optional: only issues after a date
- **story_settings.output_dir** — Where to write story files
- **story_settings.link_source_issues** — Comment on source issues with story reference
- **story_settings.export_to_github** — If true, export tracked issues to GitHub Issues after story creation

## Invocation

```bash
/tech-debt-burndown                          # Harvest all tracked issues
/tech-debt-burndown labels="code-health"     # Only code-health issues
/tech-debt-burndown since="2026-01-01"       # Issues after a date
/tech-debt-burndown epic=17                  # Issues from a specific epic
```
