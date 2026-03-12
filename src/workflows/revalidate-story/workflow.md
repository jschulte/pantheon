# Revalidate Story - Verify Checkboxes Against Codebase

<purpose>
Clear all checkboxes and re-verify each item against actual codebase reality.
Detects over-reported completion and identifies real gaps.
Optionally fills gaps by implementing missing items.
</purpose>

<philosophy>
**Trust But Verify, Evidence Required**

1. Clear all checkboxes (fresh start)
2. For each AC/Task/DoD: search codebase for evidence
3. Only re-check if evidence found AND not a stub
4. Report accuracy: was completion over-reported or under-reported?
</philosophy>

<config>
name: revalidate-story

defaults:
  fill_gaps: false
  max_gaps_to_fill: 10
  commit_strategy: "all_at_once"  # or "per_gap"
  create_report: true
  update_sprint_status: true

verification_status:
  verified: {checkbox: "[x]", evidence: "found, not stub, tests exist"}
  partial: {checkbox: "[~]", evidence: "partial implementation or missing tests"}
  missing: {checkbox: "[ ]", evidence: "not found in codebase"}
</config>

<execution_context>
@patterns/verification.md
</execution_context>

<process>

<step name="load_and_backup" priority="first">
**Load story and backup current state**

```bash
STORY_FILE="{{story_file}}"
[ -f "$STORY_FILE" ] || { echo "ERROR: story_file required"; exit 1; }
```

Use Read tool on story file. Count current checkboxes:
- ac_checked_before
- tasks_checked_before
- dod_checked_before

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 STORY REVALIDATION STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Story: {{story_key}}
Mode: {{fill_gaps ? "Verify & Fill Gaps" : "Verify Only"}}

Current State:
- Acceptance Criteria: {{ac_checked}}/{{ac_total}} checked
- Tasks: {{tasks_checked}}/{{tasks_total}} checked
- DoD: {{dod_checked}}/{{dod_total}} checked
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</step>

<step name="clear_checkboxes">
**Clear all checkboxes for fresh verification**

Use Edit tool (replace_all: true):
- `[x]` → `[ ]` in Acceptance Criteria section
- `[x]` → `[ ]` in Tasks section
- `[x]` → `[ ]` in Definition of Done section
</step>

<step name="verify_acceptance_criteria">
**Verify each AC against codebase**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 VERIFYING ACCEPTANCE CRITERIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

For each AC item:

1. **Parse AC** - Extract file/component/feature mentions
2. **Search codebase** - Use Glob/Grep to find evidence
3. **Verify implementation** - Read files, check for:
   - NOT a stub (no "TODO", "Not implemented", empty function)
   - Has actual implementation
   - Tests exist (*.test.* or *.spec.*)

4. **Determine status:**
   - VERIFIED: Evidence found, not stub, tests exist → check [x]
   - PARTIAL: Partial evidence or missing tests → check [~]
   - MISSING: No evidence found → leave [ ]

5. **Record evidence or gap**
</step>

<step name="verify_tasks">
**Verify each task against codebase**

Same process as ACs:
- Parse task description for artifacts
- Search codebase with Glob/Grep
- Read and verify (check for stubs, tests)
- Update checkbox based on evidence
</step>

<step name="verify_definition_of_done">
**Verify DoD items**

For common DoD items, run actual checks:
- "Type check passes" → `npm run type-check`
- "Unit tests pass" → `npm test`
- "Linting clean" → `npm run lint`
- "Build succeeds" → `npm run build`
</step>

<step name="generate_report">
**Calculate and display results**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 REVALIDATION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Story: {{story_key}}

Verification Results:
- ✅ Verified: {{verified}}/{{total}} ({{pct}}%)
- 🔶 Partial: {{partial}}/{{total}}
- ❌ Missing: {{missing}}/{{total}}

Accuracy Check:
- Before: {{pct_before}}% checked
- After: {{verified_pct}}% verified
- {{pct_before > verified_pct ? "Over-reported" : "Under-reported"}}

{{#if missing > 0}}
Gaps Found ({{missing}}):
[list gaps with what's missing]
{{/if}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</step>

<step name="fill_gaps" if="fill_gaps AND gaps_found">
**Implement missing items**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 GAP FILLING MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Safety check:
```
if gaps_found > max_gaps_to_fill:
  echo "⚠️ TOO MANY GAPS ({{gaps}} > {{max}})"
  echo "Consider re-implementing with /dev-story"
  HALT
```

For each gap:
1. Load story context
2. Implement missing item
3. Write tests
4. Run tests to verify
5. Check box [x] if successful
6. Commit if commit_strategy == "per_gap"
</step>

<step name="finalize">
**Re-verify and commit**

If gaps were filled:
1. Re-run verification on filled gaps
2. Commit all changes (if commit_strategy == "all_at_once")

Update sprint-status.yaml with revalidation result:
```
{{story_key}}: {{status}}  # Revalidated: {{pct}}% ({{timestamp}})
```

**Tracker Sync (Push revalidation results):**

Check `tracker.provider` from config.yaml:
- If `none` or not configured → skip (zero overhead)
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
2. Look up `{{story_key}}` in mapping
3. If mapped:
   - Map revalidated BMAD status to tracker status
   - Call `updateRallyStory` with:
     - `objectId`: story's tracker_id
     - `scheduleState`: mapped status
     - `addComment`: "BMAD revalidation: {{verified}}/{{total}} verified ({{pct}}%). Previous: {{pct_before}}%."
   - Update mapping entry `last_synced`, `local_status`, `tracker_status`
   - Report: "📡 Pushed revalidation to tracker: {story_key} → {tracker_status}"
4. If not mapped → skip

Reference: `_bmad/pantheon/workflows/rally-sync/data/tracker-operations.md` → "Embedded Push"

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ REVALIDATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Final: {{verified}}/{{total}} verified ({{pct}}%)

Recommendation:
{{#if pct >= 95}}
✅ Story is COMPLETE - mark as "done"
{{else if pct >= 80}}
🔶 Mostly complete - finish remaining items
{{else if pct >= 50}}
⚠️ Significant gaps - continue with /dev-story
{{else}}
❌ Mostly incomplete - consider re-implementing
{{/if}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</step>

</process>

<failure_handling>
**File not found:** HALT with error.
**Verification fails:** Record gap, continue to next item.
**Gap fill fails:** Leave unchecked, record failure.
**Too many gaps:** HALT, recommend re-implementation.
</failure_handling>

<success_criteria>
- [ ] All items verified against codebase
- [ ] Checkboxes reflect actual implementation
- [ ] Accuracy comparison displayed
- [ ] Gaps filled (if enabled)
- [ ] Sprint status updated
</success_criteria>
