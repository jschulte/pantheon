# Phase 2: BACKUP + REFORMAT

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2: BACKUP + REFORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Back up originals, convert to v1 format
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

For EACH playbook in `PLAYBOOK_INVENTORY[]` where `FORMAT_STATUS != "v1"`:

**Step A: Read the full legacy content.**

**Step B: Extract structured data from freeform content.**

Map legacy content to the 7 required sections:

```
MAPPING RULES (adapt to what's actually in the file):

"Overview" / "Purpose" / "About" / first paragraph
  -> Overview section

"Gotchas" / "Watch out" / "Pitfalls" / "Common Issues" / "Known Issues"
  -> Common Gotchas section

"Anti-Patterns" / "Don't do this" / "Bad patterns"
  -> Anti-Patterns section

"Patterns" / "Best Practices" / "DO/DON'T" / "Code Examples" / "Templates"
  -> Code Patterns section (also extract into Critical Patterns if they're must-follow rules)

"Testing" / "Test" / "Coverage" / "Assertions"
  -> Test Requirements section

"Related Stories" / "History" / "Changelog" / "Last updated from"
  -> Related Stories section

Content that doesn't map to any section:
  -> Assess: Is it a gotcha? Anti-pattern? Code pattern? Categorize by content, not heading.

"Critical" / "MUST" / "ALWAYS" / "NEVER" rules:
  -> Critical Patterns section (highest value per token)
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
last_updated_by: {{extract story key from "Last updated" line, or "MIGRATION-v1"}}
created_by: {{earliest story key found in file, or "MIGRATION-v1"}}
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
- If an artifact mentions this domain -> keep the file, it will get populated in Phase 3
- If no artifacts reference this domain -> flag for removal in the report (don't auto-delete)
