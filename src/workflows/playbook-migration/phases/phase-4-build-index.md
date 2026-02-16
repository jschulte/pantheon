# Phase 4: BUILD INDEX

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4: BUILD INDEX
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
