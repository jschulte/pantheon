# Phase 3: BACKFILL FROM ARTIFACTS

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3: BACKFILL
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
"API integration" | "api" | "REST" | "fetch" | "endpoints" -> "api"
"authentication" | "auth" | "session" | "JWT" -> "auth"
"database" | "prisma" | "SQL" | "queries" -> "database"
"frontend" | "react" | "components" | "UI" -> "frontend"
"testing" | "tests" | "coverage" | "assertions" -> "testing"
"security" | "XSS" | "injection" | "OWASP" -> "security"
"performance" | "optimization" | "caching" -> "performance"
(extend as needed based on what you find in the artifacts)
```

### 3.2 Deduplicate Against Existing Playbook Content

For each domain with learnings:

```
IF a playbook already covers this domain:
  Read the playbook (just reformatted in Phase 2)
  FOR EACH learning IN DOMAIN_LEARNINGS[domain]:
    IF learning overlaps with existing content:
      -> SKIP (already captured)
    IF learning adds nuance to existing entry:
      -> MERGE (combine into richer entry)
    IF learning is genuinely new:
      -> ADD to appropriate section

ELIF no playbook covers this domain:
  IF DOMAIN_LEARNINGS[domain].length >= 3:
    -> CREATE new playbook (enough content to be useful)
  ELIF DOMAIN_LEARNINGS[domain].length < 3:
    -> Find the closest existing playbook and ADD there
    -> Or flag for human decision in the report
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
