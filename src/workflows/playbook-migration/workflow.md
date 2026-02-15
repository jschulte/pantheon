# Playbook Migration — Legacy Format Conversion

<purpose>
One-time migration utility for repos with existing playbooks. Converts legacy format
to v1 standardized format (YAML frontmatter, required sections, size targets),
bootstraps the _index.json, and retroactively backfills learnings from historical
pipeline artifacts (mnemosyne, themis, review JSONs).

Run this ONCE per repo when upgrading to story-pipeline v1.
Safe to re-run — idempotent (skips already-migrated playbooks, merges new artifacts).
</purpose>

<philosophy>
**Preserve Everything, Lose Nothing**

- Back up originals before touching anything
- Extract every useful signal from historical artifacts
- Compact intelligently — merge, don't delete blindly
- Report what changed so the human can verify
</philosophy>

<config>
name: playbook-migration

parameters:
  playbook_dir: "docs/implementation-playbooks"
  artifacts_dir: "{{sprint_artifacts}}/completions"
  dry_run: false
  backfill: true
  max_artifact_scan: 50
</config>

## Phase Routing

Load phases on-demand from the `phases/` directory.

| # | Phase | File | Condition | ~Lines |
|---|-------|------|-----------|--------|
| 1 | Discovery | phases/phase-1-discovery.md | Always | 131 |
| 2 | Backup + Reformat | phases/phase-2-backup-reformat.md | Non-v1 playbooks found | 120 |
| 3 | Backfill | phases/phase-3-backfill.md | backfill: true | 118 |
| 4 | Build Index | phases/phase-4-build-index.md | Always | 57 |
| 5 | Report | phases/phase-5-report.md | Always | 109 |

**Execution flow:**
1. Phase 1 always runs (discovery)
2. Phase 2 runs if non-v1 playbooks were found in discovery
3. Phase 3 runs if `backfill: true` (default: true)
4. Phase 4 always runs (index generation)
5. Phase 5 always runs (reporting)

<dry_run_mode>
## Dry Run Mode

When `dry_run: true`, the workflow:

1. Performs ALL discovery and analysis (Phase 1)
2. Generates reformatted content in memory but does NOT write files (Phase 2)
3. Analyzes artifacts and identifies backfill opportunities (Phase 3)
4. Generates the index in memory (Phase 4)
5. Writes ONLY the migration report (Phase 5) — prefixed with "DRY RUN"

The report shows exactly what WOULD change, including before/after diffs for each playbook.

**Recommended:** Run with `dry_run: true` first, review the report, then run with `dry_run: false`.
</dry_run_mode>

<idempotency>
## Re-Run Safety

This workflow is safe to re-run:

- **Already-migrated playbooks** (FORMAT_STATUS = "v1") are skipped in Phase 2
- **Backup directory** is only created once; subsequent runs don't overwrite backups
- **Backfill deduplication** (Phase 3.2) prevents adding learnings that already exist
- **Index rebuild** (Phase 4) regenerates from current state, preserving hit/miss counts
- **Artifacts are read-only** — the workflow never modifies historical artifacts

The ONE exception: if you want to force re-migration of an already-v1 playbook (e.g., to re-apply backfill), delete its frontmatter first.
</idempotency>

<artifact_data_quality>
## What Historical Artifacts Give Us

**Mnemosyne artifacts (`*-mnemosyne.json`)** — BEST source:
- Structured `learnings[]` with `issue`, `root_cause`, `prevention`, `applies_to`
- Structured `anti_patterns[]` with full details (if v7.3+)
- `playbook_action` tells us what was already captured vs skipped
- **Limitation:** Earlier pipeline versions had simpler artifact formats. Adapt gracefully.

**Themis artifacts (`*-themis.json`)** — GOOD source:
- Every issue that went through triage with `new_classification`
- MUST_FIX issues are strong signals for gotchas/anti-patterns
- **Limitation:** Issues are described in reviewer language, not playbook language. Needs rewording.

**Review artifacts (`*-review.json`, `*-argus.json`, etc.)** — DECENT source:
- Raw reviewer findings with file:line references
- Good for extracting code patterns (DO/DON'T from real examples)
- **Limitation:** Noisy — includes STYLE issues and false positives. Filter to MUST_FIX/SHOULD_FIX only.

**Summary reports (`*-summary.md`)** — SUPPLEMENTARY source:
- "Learnings Captured" section has human-readable summaries
- Useful for cross-referencing but not primary data extraction
- **Limitation:** Freeform text, harder to parse programmatically.

**What we CAN'T get retroactively:**
- `file_patterns` for playbooks (must be inferred from story files that triggered them)
- Accurate `hit_count`/`miss_count` (starts at 0; tracking begins going forward)
- Perfect `token_cost` (estimated from byte_size; corrected over time)
</artifact_data_quality>
