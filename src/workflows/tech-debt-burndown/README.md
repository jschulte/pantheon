# Tech Debt Burndown Workflow

**Author:** Jonah Schulte (leveraging BMAD Method)

Convert accumulated tracked issues into actionable BMAD-formatted story files. Reads from a local JSON index (`tracked-issues.json`) by default — no GitHub API calls needed. Clusters by root cause, proposes interactively, generates complete stories.

## What It Does

Unlike `batch-review` (which finds issues) or `batch-stories` (which implements stories), `tech-debt-burndown` is the bridge between them — it converts tracked issues into implementable stories.

**Tracking is local-first:** Issues are stored in `tracked-issues.json` (in sprint artifacts). Dedup is a trivial key lookup (`{type}::{file_path}`). GitHub Issues are an optional export, not the default.

**Perfect for:**
- Converting CODE_HEALTH observations from batch-review into stories
- Consolidating scattered SHOULD_FIX deferrals into focused work
- Periodic tech debt planning sessions
- Sprint planning when you want to pay down accumulated debt

## Quick Start

```bash
# Harvest all tracked issues and create stories
/tech-debt-burndown

# Only code-health issues
/tech-debt-burndown labels="code-health"

# Issues from a specific epic
/tech-debt-burndown epic=17

# Issues after a date
/tech-debt-burndown since="2026-01-01"
```

## Workflow Phases

```
HARVEST → ANALYZE → PROPOSE → CREATE
  ⛵        🧵        📋       ⚒️
Charon    Clotho   (Interactive) Daedalus
```

1. **HARVEST** (Charon ⛵) — Read `tracked-issues.json` (or fetch GitHub Issues as fallback), filter by scope
2. **ANALYZE** (Clotho 🧵) — Cluster by root cause, detect patterns, estimate effort, map dependencies
3. **PROPOSE** (Interactive) — Present each cluster for user approval (Approve / Edit title / Skip / Quit)
4. **CREATE** (Daedalus ⚒️) — Generate BMAD story files, mark source issues as `addressed`, optionally export to GitHub

## Agents

| Agent | Name | Role |
|-------|------|------|
| Charon | ⛵ Ferryman | Read local tracked-issues.json (or GitHub Issues as fallback) into structured data |
| Clotho | 🧵 Spinner | Root-cause clustering, pattern detection, effort estimation |
| Daedalus | ⚒️ Master Craftsman | Generate BMAD story files (6-12KB each) |

## Clustering Patterns

Clotho detects these root-cause patterns:

| Pattern | Description | Typical Fix |
|---------|-------------|-------------|
| `dry_violation` | Same logic in 3+ places | Extract shared function/module |
| `god_class` | >500 lines, mixed concerns | Split into focused modules |
| `inconsistent_patterns` | Same problem, different solutions | Standardize approach |
| `missing_abstraction` | Implementation details leak | Create abstraction layer |
| `coupling` | Independent modules entangled | Decouple with interfaces |
| `layer_violation` | Wrong layer accessing another | Enforce boundaries |
| `naming_inconsistency` | Same concept, different names | Rename for consistency |
| `test_infrastructure_gap` | Missing test harness/fixtures | Build shared infrastructure |
| `security_pattern_gap` | Auth/validation inconsistent | Centralize security patterns |

## Story Output

Each approved proposal produces a BMAD story file with:
- **Story** (user story format)
- **Background** (current state + target state)
- **Acceptance Criteria** (Given/When/Then)
- **Tasks** (checkable, specific, with file references)
- **Dev Notes** (architecture decisions, files to touch, constraints, testing strategy)
- **References** (all source GitHub issues linked)

Stories are saved to `_bmad-output/burndown-stories/` and can be implemented via `/batch-stories` or `/story-pipeline`.

## GitHub Export (Optional)

By default, issues stay local in `tracked-issues.json`. To push them to GitHub Issues:

Set `export_to_github: true` in `workflow.yaml` under `story_settings`. During Phase 4 (CREATE), after story files are generated, entries with `status: "open"` or `status: "addressed"` will be bulk-created as GitHub Issues and marked `status: "exported"` in the local index.

This is a one-time push for when you want GitHub visibility — not required for normal operation.

## Output Artifacts

| File | Location | Content |
|------|----------|---------|
| Harvest data | `sprint-artifacts/burndown/harvest.json` | Raw issue data |
| Analysis | `sprint-artifacts/burndown/analysis.json` | Clusters + patterns |
| Proposals | `sprint-artifacts/burndown/proposals.json` | Approved/skipped |
| Report | `sprint-artifacts/burndown/report.json` | Final summary |
| Stories | `burndown-stories/burndown-*.md` | BMAD story files |

## Typical Workflow

```
1. Run /batch-review epic=17          → finds issues, writes to tracked-issues.json
2. Run /batch-review epic=17 focus="security"  → more issues tracked (dupes auto-bumped)
3. Run /tech-debt-burndown            → reads local index, clusters 25 issues into 7 stories
4. Approve 5 of 7 proposals          → 5 BMAD story files generated, source issues marked "addressed"
5. Run /batch-stories                 → implements the 5 burndown stories
```

## Related Workflows

- **batch-review:** Creates tracked issues (in `tracked-issues.json`) that this workflow consumes (`/batch-review`)
- **story-pipeline:** Implements individual stories created by this workflow (`/story-pipeline`)
- **batch-stories:** Batch-implements stories created by this workflow (`/batch-stories`)

---

## Changelog

### v1.0.0 — Initial Release

- 4-phase workflow: Harvest → Analyze → Propose → Create
- Charon issue harvester with template parsing
- Clotho root-cause clustering with 9 pattern types
- Interactive proposal review with approve/edit/skip/quit
- Daedalus BMAD story generation (6-12KB targets)
- Source issue commenting
- Burndown summary report

---

**Last Updated:** 2026-02-22
**Status:** Active
**Maintained By:** Jonah Schulte
