# Phase 1: DISCOVERY (Read-Only)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: DISCOVERY
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
  - "v1"       -> Has YAML frontmatter with all required fields (id, domains, token_cost, etc.)
  - "partial"    -> Has some frontmatter or some required sections, but incomplete
  - "legacy"     -> No frontmatter, freeform format (the common case)
  - "empty"      -> File exists but has no meaningful content

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
DISCOVERY RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Playbooks found: {{count}}
  - v1 format:  {{count}} (will skip)
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
