# Playbook Migration v1.0 — Legacy to v7.4 Format

<purpose>
One-time migration utility for repos with existing playbooks. Converts legacy format
to v7.4 standardized format (YAML frontmatter, required sections, size targets),
bootstraps the _index.json, and retroactively backfills learnings from historical
pipeline artifacts (mnemosyne, themis, review JSONs).

Run this ONCE per repo when upgrading to story-pipeline v7.4.
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
version: 1.0.0

parameters:
  playbook_dir: "docs/implementation-playbooks"
  artifacts_dir: "docs/sprint-artifacts/completions"
  dry_run: false
  backfill: true
  max_artifact_scan: 50
</config>

<process>

## Phase 1: DISCOVERY (Read-Only)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PHASE 1: DISCOVERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Inventory existing playbooks + historical artifacts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.1 Inventory Existing Playbooks

```bash
ls {{playbook_dir}}/
```

For EACH playbook file found:

```
READ the file. Classify its current state:

FORMAT_STATUS:
  - "v7.4"       → Has YAML frontmatter with all required fields (id, domains, token_cost, etc.)
  - "partial"    → Has some frontmatter or some required sections, but incomplete
  - "legacy"     → No frontmatter, freeform format (the common case)
  - "empty"      → File exists but has no meaningful content

SECTIONS_PRESENT: Which of the 7 required sections exist?
  [Overview, Critical Patterns, Common Gotchas, Anti-Patterns, Code Patterns, Test Requirements, Related Stories]

CONTENT_INVENTORY:
  - gotcha_count: Number of gotcha/warning entries
  - anti_pattern_count: Number of anti-pattern entries
  - code_pattern_count: Number of DO/DON'T code examples
  - test_req_count: Number of test requirements
  - story_refs: List of story keys mentioned anywhere in the file
  - byte_size: File size in bytes
  - estimated_tokens: byte_size / 4 (rough estimate)
```

Collect into `PLAYBOOK_INVENTORY[]`.

### 1.2 Check for Existing Index

```bash
INDEX_FILE="{{playbook_dir}}/_index.json"
if [ -f "$INDEX_FILE" ]; then
  echo "Index exists — will merge, not overwrite"
  # Read and parse existing index
else
  echo "No index found — will create from scratch"
fi
```

### 1.3 Inventory Historical Artifacts

If `backfill: true`:

```bash
# Find all mnemosyne artifacts (reflection learnings)
ls {{artifacts_dir}}/*-mnemosyne.json 2>/dev/null | sort -r | head -{{max_artifact_scan}}

# Find all themis artifacts (triage results with issue details)
ls {{artifacts_dir}}/*-themis.json 2>/dev/null | sort -r | head -{{max_artifact_scan}}

# Find all review artifacts (reviewer findings)
ls {{artifacts_dir}}/*-review.json 2>/dev/null | sort -r | head -{{max_artifact_scan}}
# Also check for individual reviewer artifacts
ls {{artifacts_dir}}/*-argus.json {{artifacts_dir}}/*-nemesis.json {{artifacts_dir}}/*-cerberus.json {{artifacts_dir}}/*-hestia.json 2>/dev/null | sort -r | head -{{max_artifact_scan}}
```

For EACH mnemosyne artifact, extract:
```json
{
  "story_key": "from artifact",
  "learnings": "from artifact.learnings[]",
  "anti_patterns": "from artifact.anti_patterns[] (if present)",
  "playbook_action": "from artifact.playbook_action",
  "target_domain": "from artifact.learnings[].applies_to"
}
```

For EACH themis artifact, extract:
```json
{
  "story_key": "from artifact",
  "must_fix_issues": "issues classified MUST_FIX (these are real problems)",
  "issue_domains": "categorize: api, auth, database, frontend, testing, security, etc."
}
```

For EACH review artifact (review.json or individual reviewer files), extract:
```json
{
  "story_key": "from artifact",
  "issues": "all issues with classification and file references",
  "reviewer": "which reviewer found it"
}
```

Collect into `ARTIFACT_INVENTORY[]`.

### 1.4 Discovery Report

Display summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DISCOVERY RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Playbooks found: {{count}}
  - v7.4 format:  {{count}} (will skip)
  - Partial:      {{count}} (will complete)
  - Legacy:       {{count}} (will migrate)
  - Empty:        {{count}} (will remove or populate)

Index status: {{exists/missing}}

Historical artifacts found:
  - Mnemosyne:    {{count}} artifacts
  - Themis:       {{count}} artifacts
  - Review:       {{count}} artifacts
  - Unique stories covered: {{count}}

Estimated uncaptured learnings: {{count}}
  (learnings in artifacts not reflected in any playbook)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Phase 2: BACKUP + REFORMAT

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 PHASE 2: BACKUP + REFORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Back up originals, convert to v7.4 format
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2.1 Back Up Originals

```bash
BACKUP_DIR="{{playbook_dir}}/.migration-backup"
mkdir -p "$BACKUP_DIR"
cp {{playbook_dir}}/*.md "$BACKUP_DIR/" 2>/dev/null
[ -f "{{playbook_dir}}/_index.json" ] && cp "{{playbook_dir}}/_index.json" "$BACKUP_DIR/"
echo "Backed up {{count}} files to $BACKUP_DIR"
```

**CRITICAL:** Always back up before modifying. If `dry_run: true`, skip all writes below and just report what would happen.

### 2.2 Reformat Each Playbook

For EACH playbook in `PLAYBOOK_INVENTORY[]` where `FORMAT_STATUS != "v7.4"`:

**Step A: Read the full legacy content.**

**Step B: Extract structured data from freeform content.**

Map legacy content to the 7 required sections:

```
MAPPING RULES (adapt to what's actually in the file):

"Overview" / "Purpose" / "About" / first paragraph
  → Overview section

"Gotchas" / "Watch out" / "Pitfalls" / "Common Issues" / "Known Issues"
  → Common Gotchas section

"Anti-Patterns" / "Don't do this" / "Bad patterns"
  → Anti-Patterns section

"Patterns" / "Best Practices" / "DO/DON'T" / "Code Examples" / "Templates"
  → Code Patterns section (also extract into Critical Patterns if they're must-follow rules)

"Testing" / "Test" / "Coverage" / "Assertions"
  → Test Requirements section

"Related Stories" / "History" / "Changelog" / "Last updated from"
  → Related Stories section

Content that doesn't map to any section:
  → Assess: Is it a gotcha? Anti-pattern? Code pattern? Categorize by content, not heading.

"Critical" / "MUST" / "ALWAYS" / "NEVER" rules:
  → Critical Patterns section (highest value per token)
```

**Step C: Generate YAML frontmatter.**

```yaml
---
id: {{derive from filename: kebab-case, strip .md}}
title: {{derive from first H1 heading, or humanize the filename}}
domains: {{extract keywords from content — technology names, feature areas, frameworks}}
file_patterns: {{extract any file path patterns mentioned, or infer from domain}}
token_cost: {{byte_size / 4, rounded to nearest 50}}
byte_size: {{calculate after reformat}}
target_range_bytes: [3000, 10000]
last_updated: {{extract from "Last updated" line, or file mtime, or today}}
last_updated_by: {{extract story key from "Last updated" line, or "MIGRATION-v7.4"}}
created_by: {{earliest story key found in file, or "MIGRATION-v7.4"}}
hit_count: 0
miss_count: 0
stories_contributed: {{all story keys found in file content}}
---
```

**Domain extraction heuristic:**
- Scan for technology keywords: react, next, prisma, api, auth, database, css, tailwind, etc.
- Scan for feature areas: form, validation, routing, middleware, testing, etc.
- Scan for file patterns mentioned: `app/api/**`, `*.test.ts`, `components/**`, etc.
- Cap at 6 domains (most specific first)

**Step D: Assemble the reformatted playbook.**

Produce the complete file with frontmatter + all 7 sections. Rules:
- Preserve ALL existing content — just reorganize it into the right sections
- Empty sections get a placeholder: `*No entries yet.*`
- Tighten verbose prose but preserve code examples exactly
- Keep all story references

**Step E: Check size and compact if needed.**

```
IF byte_size > 10000:
  Compact: trim verbose explanations, merge overlapping entries,
  drop lowest-value items (single-story-ref, generic advice).
  Target: under 10KB.

IF byte_size < 500:
  This playbook may not have enough content to be useful.
  Flag for review but don't delete.
```

**Step F: Write the reformatted playbook.**

Use `Write` tool (full file replacement). This is a migration, not an append.

### 2.3 Handle Empty Playbooks

For playbooks classified as "empty":
- If an artifact mentions this domain → keep the file, it will get populated in Phase 3
- If no artifacts reference this domain → flag for removal in the report (don't auto-delete)

---

## Phase 3: BACKFILL FROM ARTIFACTS

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 PHASE 3: BACKFILL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mine historical artifacts for uncaptured learnings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Skip this phase if `backfill: false`.

### 3.1 Aggregate Learnings by Domain

Process `ARTIFACT_INVENTORY[]` and group all learnings by target domain:

```
FOR EACH mnemosyne artifact:
  FOR EACH learning IN artifact.learnings:
    domain = learning.applies_to (normalize: lowercase, map synonyms)
    DOMAIN_LEARNINGS[domain].push({
      type: "gotcha",
      content: learning.issue + " — " + learning.prevention,
      story: artifact.story_key,
      source: "mnemosyne"
    })

  FOR EACH anti_pattern IN artifact.anti_patterns (if present):
    domain = infer from anti_pattern.name or context
    DOMAIN_LEARNINGS[domain].push({
      type: "anti_pattern",
      content: {
        name: anti_pattern.name,
        looks_like: anti_pattern.looks_like,
        why_it_fails: anti_pattern.why_it_fails,
        better_approach: anti_pattern.better_approach
      },
      story: artifact.story_key,
      source: "mnemosyne"
    })

FOR EACH themis artifact:
  FOR EACH issue IN artifact.triage WHERE issue.new_classification == "MUST_FIX":
    domain = categorize_issue_domain(issue)
    DOMAIN_LEARNINGS[domain].push({
      type: "gotcha",
      content: issue.issue + " (found by " + issue.reviewer + ")",
      story: artifact.story_key,
      source: "themis"
    })

FOR EACH review artifact:
  FOR EACH issue IN artifact.issues WHERE issue.classification IN ["MUST_FIX", "SHOULD_FIX"]:
    domain = categorize_from_file_path(issue.file) or categorize_from_content(issue)
    DOMAIN_LEARNINGS[domain].push({
      type: infer_type(issue),  # gotcha, anti_pattern, test_requirement, code_pattern
      content: issue.description,
      story: artifact.story_key,
      source: artifact.reviewer or "review"
    })
```

**Domain normalization map** (handle synonyms):
```
"API integration" | "api" | "REST" | "fetch" | "endpoints" → "api"
"authentication" | "auth" | "session" | "JWT" → "auth"
"database" | "prisma" | "SQL" | "queries" → "database"
"frontend" | "react" | "components" | "UI" → "frontend"
"testing" | "tests" | "coverage" | "assertions" → "testing"
"security" | "XSS" | "injection" | "OWASP" → "security"
"performance" | "optimization" | "caching" → "performance"
(extend as needed based on what you find in the artifacts)
```

### 3.2 Deduplicate Against Existing Playbook Content

For each domain with learnings:

```
IF a playbook already covers this domain:
  Read the playbook (just reformatted in Phase 2)
  FOR EACH learning IN DOMAIN_LEARNINGS[domain]:
    IF learning overlaps with existing content:
      → SKIP (already captured)
    IF learning adds nuance to existing entry:
      → MERGE (combine into richer entry)
    IF learning is genuinely new:
      → ADD to appropriate section

ELIF no playbook covers this domain:
  IF DOMAIN_LEARNINGS[domain].length >= 3:
    → CREATE new playbook (enough content to be useful)
  ELIF DOMAIN_LEARNINGS[domain].length < 3:
    → Find the closest existing playbook and ADD there
    → Or flag for human decision in the report
```

**Overlap detection heuristic:**
- Same story key + same general topic = likely overlap
- Similar keywords (>60% word overlap after stopword removal) = likely overlap
- When in doubt, MERGE rather than duplicate

### 3.3 Write Updated Playbooks

For each playbook that received new backfilled content:

1. Read the current playbook (reformatted in Phase 2)
2. Integrate new learnings into appropriate sections
3. Apply compaction protocol (merge overlaps, check size budget)
4. Write with `Write` tool (full replacement)
5. Update frontmatter: `byte_size`, `token_cost`, `stories_contributed`

For new playbooks:
1. Generate using standardized format template
2. Populate with aggregated learnings
3. Write to `{{playbook_dir}}/{{domain}}-patterns.md`

---

## Phase 4: BUILD INDEX

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📑 PHASE 4: BUILD INDEX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generate _index.json from final playbook state
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.1 Generate Index

Read ALL playbook files in `{{playbook_dir}}/` (the now-reformatted versions).

For each playbook, extract frontmatter and build index entry:

```json
{
  "version": "1.0",
  "token_budget": 7500,
  "generated_by": "playbook-migration v1.0",
  "generated_at": "{{ISO timestamp}}",
  "playbooks": [
    {
      "id": "{{from frontmatter}}",
      "title": "{{from frontmatter}}",
      "file": "{{filename}}",
      "domains": ["{{from frontmatter}}"],
      "file_patterns": ["{{from frontmatter}}"],
      "token_cost": {{from frontmatter}},
      "byte_size": {{actual file size}},
      "last_updated": "{{from frontmatter}}",
      "last_updated_by": "{{from frontmatter}}",
      "hit_count": 0,
      "miss_count": 0,
      "hit_rate": 0.0,
      "stories_contributed": ["{{from frontmatter}}"]
    }
  ]
}
```

**Validation checks:**
- No duplicate `id` values
- All `file` references point to actual files
- `byte_size` matches actual file size
- `token_cost` is reasonable (byte_size / 4, within 20% tolerance)

### 4.2 Write Index

```bash
Write to: {{playbook_dir}}/_index.json
```

If an index already existed and had `hit_count`/`miss_count` data, preserve those values.

---

## Phase 5: REPORT

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 PHASE 5: MIGRATION REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary of all changes for human review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5.1 Generate Migration Report

Write to `{{sprint_artifacts}}/playbook-migration-report.md`:

```markdown
# Playbook Migration Report

**Date:** {{timestamp}}
**Mode:** {{dry_run ? "DRY RUN (no files modified)" : "LIVE"}}

---

## Summary

| Metric | Count |
|--------|-------|
| Playbooks found | {{n}} |
| Reformatted (legacy → v7.4) | {{n}} |
| Completed (partial → v7.4) | {{n}} |
| Already v7.4 (skipped) | {{n}} |
| Empty (flagged) | {{n}} |
| New playbooks created | {{n}} |

## Artifacts Scanned

| Type | Found | Learnings Extracted |
|------|-------|-------------------|
| Mnemosyne | {{n}} | {{n}} learnings, {{n}} anti-patterns |
| Themis | {{n}} | {{n}} MUST_FIX issues |
| Review | {{n}} | {{n}} issues |

## Backfill Results

| Domain | New Entries | Merged | Skipped (duplicate) |
|--------|-----------|--------|-------------------|
{{FOR EACH domain with changes}}
| {{domain}} | {{new}} | {{merged}} | {{skipped}} |
{{END}}

## Playbook Details

{{FOR EACH playbook}}
### {{title}} (`{{filename}}`)

- **Status:** {{migrated/completed/created/skipped}}
- **Size:** {{before_bytes}} → {{after_bytes}} bytes ({{change}})
- **Sections filled:** {{count}}/7
- **Stories contributing:** {{count}} ({{story_keys}})
- **Entries:** {{gotchas}} gotchas, {{anti_patterns}} anti-patterns, {{code_patterns}} code patterns
{{END}}

## Action Items

{{IF any empty playbooks}}
- [ ] Review empty playbooks for removal: {{list}}
{{END}}

{{IF any playbooks over 10KB after migration}}
- [ ] Manual compaction needed: {{list}} (automated compaction reduced but didn't reach target)
{{END}}

{{IF any domains with uncaptured learnings but no playbook}}
- [ ] Consider creating playbooks for: {{domains}} ({{count}} uncaptured learnings each)
{{END}}

## Backup Location

Originals saved to: `{{playbook_dir}}/.migration-backup/`

To revert: `cp {{playbook_dir}}/.migration-backup/*.md {{playbook_dir}}/`

---

*Generated by playbook-migration v1.0*
```

### 5.2 Display Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PLAYBOOK MIGRATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Playbooks: {{reformatted}} migrated, {{created}} new, {{skipped}} unchanged
📑 Index: {{playbook_dir}}/_index.json ({{entry_count}} entries)
📊 Backfill: {{new_entries}} learnings extracted from {{artifact_count}} artifacts
💾 Backup: {{playbook_dir}}/.migration-backup/

📄 Full report: {{sprint_artifacts}}/playbook-migration-report.md

{{IF action_items > 0}}
⚠️  {{action_items}} items need human review (see report)
{{END}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</process>

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

- **Already-migrated playbooks** (FORMAT_STATUS = "v7.4") are skipped in Phase 2
- **Backup directory** is only created once; subsequent runs don't overwrite backups
- **Backfill deduplication** (Phase 3.2) prevents adding learnings that already exist
- **Index rebuild** (Phase 4) regenerates from current state, preserving hit/miss counts
- **Artifacts are read-only** — the workflow never modifies historical artifacts

The ONE exception: if you want to force re-migration of an already-v7.4 playbook (e.g., to re-apply backfill), delete its frontmatter first.
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
