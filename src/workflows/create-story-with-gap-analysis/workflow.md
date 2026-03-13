---
name: "create-story-with-gap-analysis"
description: "Create/regenerate story with SYSTEMATIC codebase gap analysis using verified file scanning (Glob/Read tools)"
---

# Create Story with Gap Analysis - Verified Story Generation

<purpose>
Regenerate story with VERIFIED codebase gap analysis.
Uses Glob/Read tools to determine what actually exists vs what's missing.
Checkboxes reflect reality, not guesses.
</purpose>

<philosophy>
**Truth from Codebase, Not Assumptions**

1. Scan codebase for actual implementations
2. Verify files exist, check for stubs/TODOs
3. Check test coverage
4. Generate story with checkboxes matching reality
5. No guessing—every checkbox has evidence
</philosophy>

<config>
name: create-story-with-gap-analysis

verification_status:
  verified: "[x]"      # File exists, real implementation, tests exist
  partial: "[~]"       # File exists but stub/TODO or no tests
  missing: "[ ]"       # File does not exist

defaults:
  update_sprint_status: true
  create_report: false
</config>

<execution_context>
@patterns/verification.md
</execution_context>

<process>

<step name="initialize" priority="first">
**Identify story and load context**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 STORY REGENERATION WITH GAP ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Ask user for story:**
```
Which story should I regenerate with gap analysis?

Provide:
- Story number (e.g., "1.9" or "1-9")
- OR story filename

Your choice:
```

**Parse input:**
- Extract epic_num, story_num
- Locate story file

**Load existing story:**
```bash
Read: {{story_dir}}/story-{{epic_num}}.{{story_num}}.md
```

Extract:
- Story title
- User story (As a... I want... So that...)
- Acceptance criteria
- Tasks
- Dev Notes

**Load epic context:**
```bash
Read: {{planning_artifacts}}/epics.md
```

Extract:
- Epic business objectives
- Technical constraints
- Dependencies

**Determine target directories:**
From story title/requirements, identify which directories to scan.

```
✅ Story Context Loaded

Story: {{epic_num}}.{{story_num}} - {{title}}
Target directories:
{{#each directories}}
  - {{this}}
{{/each}}

[C] Continue to Codebase Scan
```
</step>

<step name="codebase_scan">
**VERIFY what code actually exists**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 CODEBASE SCAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**For each target directory:**

1. **List all source files:**
   ```bash
   Glob: {{target_dir}}/src/**/*.ts
   Glob: {{target_dir}}/src/**/*.tsx
   ```

2. **Check for specific required components:**
   Based on story ACs, check if required files exist:
   ```bash
   Glob: {{target_dir}}/src/auth/controllers/*oauth*.ts
   # Result: ✅ EXISTS or ❌ MISSING
   ```

3. **Verify implementation depth:**
   For files that exist, check quality:
   ```bash
   Read: {{file}}

   # Check for stubs
   Grep: "MOCK|TODO|FIXME|Not implemented" {{file}}
   # If found: ⚠️ STUB
   ```

4. **Check dependencies:**
   ```bash
   Read: {{target_dir}}/package.json

   # Required: axios - Found? ✅/❌
   # Required: @aws-sdk/client-secrets-manager - Found? ✅/❌
   ```

5. **Check test coverage:**
   ```bash
   Glob: {{target_dir}}/src/**/*.spec.ts
   Glob: {{target_dir}}/test/**/*.test.ts
   ```
</step>

<step name="generate_gap_analysis">
**Create verified gap analysis**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 GAP ANALYSIS RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ IMPLEMENTED (Verified):
{{#each implemented}}
{{@index}}. **{{name}}**
   - File: {{file}} ✅ EXISTS
   - Status: {{status}}
   - Tests: {{test_count}} tests
{{/each}}

❌ MISSING (Verified):
{{#each missing}}
{{@index}}. **{{name}}**
   - Expected: {{expected_file}} ❌ NOT FOUND
   - Needed for: {{requirement}}
{{/each}}

⚠️ PARTIAL (Stub/Incomplete):
{{#each partial}}
{{@index}}. **{{name}}**
   - File: {{file}} ✅ EXISTS
   - Issue: {{issue}}
{{/each}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</step>

<step name="generate_story">
**Generate story with verified checkboxes**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 GENERATING STORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use story template with:
- `[x]` for VERIFIED items (evidence: file exists, not stub, has tests)
- `[~]` for PARTIAL items (evidence: file exists but stub/no tests)
- `[ ]` for MISSING items (evidence: file not found)

**Write story file:**
```bash
Write: {{story_dir}}/story-{{epic_num}}.{{story_num}}.md
```

**Validate generated story:**
```bash
# Check 7 sections exist
grep "^## " {{story_file}} | wc -l
# Should be 7

# Check gap analysis section exists
grep "Gap Analysis" {{story_file}}
```
</step>

<step name="update_sprint_status" if="update_sprint_status">
**Update sprint-status.yaml**

```bash
Read: {{sprint_status}}

# Update story status to "ready-for-dev" if was "backlog"
# Preserve comments and structure

Write: {{sprint_status}}
```
</step>

<step name="tracker_sync_push" if="tracker.provider != 'none'">
**Push new/updated story to tracker**

Check `tracker.provider` from config.yaml:
- If `none` or not configured → skip this step entirely (zero overhead)
Check session flag `tracker_available`:
- If `false` → skip (user chose to disable sync this session)
- If not yet set → probe MCP now; on failure present prompt:
  [R] Retry  [S] Skip this operation  [D] Disable for session  [H] Halt workflow
  (Only [D] sets `tracker_available = false`)
- If `true` → proceed:

**Branch-aware push guard:**
`git rev-parse --abbrev-ref HEAD`
- On `{tracker.main_branch}` → all statuses allowed
- On feature branch → only In-Progress, Completed, Accepted
- Restricted status → log "⚠️ Skipped: {status} push restricted to {main_branch} (current: {branch})", continue workflow

1. Load `{{sprint_artifacts}}/.tracker-mapping.yaml`
2. Look up `{{story_key}}` (e.g., `5.9`) in mapping

**If mapped (story exists in tracker):**
- Call `updateRallyStory` with:
  - `objectId`: story's tracker_id
  - `addComment`: "BMAD: Story regenerated with gap analysis. {{implemented_count}} verified, {{missing_count}} missing, {{partial_count}} partial."
- Update mapping entry `last_synced`
- Report: "📡 Updated tracker: {story_key} ({tracker_id})"

**If NOT mapped (new story):**
- Determine parent Feature tracker_id from epic mapping
- Call `createRallyStory` with:
  - `name`: story title
  - `description`: story description/ACs
  - `featureId`: parent Feature tracker_id
  - `owner`: from `tracker.rally.owner` config
  - `scheduleState`: mapped from current BMAD status (likely "Defined" for ready-for-dev)
  - `storyPoints`: from story file (if set)
- Add new entry to .tracker-mapping.yaml
- Report: "📡 Created in tracker: {story_key} → {new_tracker_id}"

Reference: `_bmad/pantheon/workflows/rally-sync/data/tracker-operations.md` → "Embedded Push"
</step>

<step name="final_summary">
**Report completion**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ STORY REGENERATED WITH GAP ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Story: {{epic_num}}.{{story_num}} - {{title}}
File: {{story_file}}
Sections: 7/7 ✅

Gap Analysis Summary:
- ✅ {{implemented_count}} components VERIFIED complete
- ❌ {{missing_count}} components VERIFIED missing
- ⚠️ {{partial_count}} components PARTIAL (stub/no tests)

Checkboxes reflect VERIFIED codebase state.

Next Steps:
1. Review story for accuracy
2. Use /dev-story to implement missing components
3. Story provides complete context for implementation

[N] Regenerate next story
[Q] Quit
[R] Review generated story
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If [N]:** Loop back to initialize with next story.
**If [R]:** Display story content, then show menu.
</step>

</process>

<examples>
```bash
# Regenerate specific story
/create-story-with-gap-analysis
> Which story? 1.9

# With explicit story file
/create-story-with-gap-analysis story_file={{sprint_artifacts}}/story-1.9.md
```
</examples>

<failure_handling>
**Story not found:** HALT with clear error.
**Target directory not found:** Warn, scan available directories.
**Glob/Read fails:** Log warning, count as MISSING.
**Write fails:** Report error, display generated content.
</failure_handling>

<success_criteria>
- [ ] Codebase scanned for all story requirements
- [ ] Gap analysis generated with evidence
- [ ] Story written with verified checkboxes
- [ ] 7 sections present
- [ ] Sprint status updated (if enabled)
</success_criteria>
