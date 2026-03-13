# Phase 4: PRESENT (4/4)
<!-- Part of Epic Retrospective v1.0 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4: PRESENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Review findings, apply approved changes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

This phase runs in the orchestrator context. Single user checkpoint.

## Step 1: Display Retrospective Summary

Read the retrospective document and display a condensed version to the user.

```
Read {{implementation_artifacts}}/epic-{{epic_num}}-retro-{{date}}.md

Display:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EPIC {{epic_num}} RETROSPECTIVE — KEY FINDINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Epic metrics summary from retro doc — stories completed, iterations,
 issues found/fixed, specialists forged, playbooks created]

TOP PATTERNS:
[List the top 3-5 cross-story patterns identified]

WINS:
[List the 2-3 biggest successes]

CONCERNS:
[List the 2-3 most significant issues/risks]

{{IF has_previous_retro}}
PREVIOUS RETRO FOLLOW-THROUGH:
[Action item status: X completed, Y in progress, Z not addressed]
{{END IF}}

{{IF has_next_epic}}
NEXT EPIC READINESS:
[Readiness assessment — blockers, gaps, preparation needed]
{{END IF}}

Full document: {{implementation_artifacts}}/epic-{{epic_num}}-retro-{{date}}.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 2: Present Playbook Proposals

```
IF {{sprint_artifacts}}/retro-proposals/playbook-updates.md exists AND has proposals:

  Read the proposals file.

  Display:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PLAYBOOK UPDATE PROPOSALS ({{count}} proposals)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  FOR EACH proposal:
    **{{N}}. {{playbook_name}}** — {{action: CREATE | UPDATE | MERGE}}
    Rationale: {{why this change, which stories drove it}}
    Evidence: {{story_keys where this pattern appeared}}

    ```diff
    {{proposed changes as diff}}
    ```

  END FOR

  Options:
  1. Apply all playbook proposals
  2. Apply selected proposals (specify numbers)
  3. Skip all playbook proposals
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  WAIT for user choice.

  IF user approves (all or selected):
    FOR EACH approved proposal:
      Apply the playbook change (Write or Edit tool)
      Update _index.json if needed
    END FOR
    Display: "Applied {{count}} playbook updates."

ELSE:
  Display: "No playbook updates proposed."
```

## Step 3: Present CLAUDE.md Proposals

```
IF {{sprint_artifacts}}/retro-proposals/claude-md-patches.md exists AND has proposals:

  Read the proposals file.

  Display:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CLAUDE.md PATCH PROPOSALS ({{count}} patches)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  NOTE: CLAUDE.md is loaded into every session. Only truly pervasive
  issues belong here. Most learnings go in playbooks instead.

  FOR EACH patch:
    **{{N}}. {{rule_summary}}**
    Problem: {{what pervasive mistake this prevents}}
    Evidence: Stories {{story_keys}} — {{description of the repeated issue}}
    Why CLAUDE.md: {{justification — why every session needs this}}

    ```diff
    {{proposed CLAUDE.md addition as diff}}
    ```

  END FOR

  Options:
  1. Apply all CLAUDE.md patches
  2. Apply selected patches (specify numbers)
  3. Skip all CLAUDE.md patches
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  WAIT for user choice.

  IF user approves (all or selected):
    FOR EACH approved patch:
      Apply to CLAUDE.md (Edit tool — append to appropriate section)
    END FOR
    Display: "Applied {{count}} CLAUDE.md patches."

ELSE:
  Display: "No CLAUDE.md patches proposed."
```

## Step 4: Present Pantheon Process Suggestions

These are NEVER auto-applied. Always presented as suggestions for the user to
take back to the Pantheon repo.

```
IF {{sprint_artifacts}}/retro-proposals/pantheon-suggestions.md exists AND has suggestions:

  Read the proposals file.

  Display:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PANTHEON PROCESS SUGGESTIONS ({{count}} suggestions)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  These are suggestions for improving Pantheon itself.
  Review them and apply manually to the Pantheon repo if agreed.

  FOR EACH suggestion:
    **{{N}}. {{suggestion_title}}**
    Problem: {{what workflow gap or inefficiency was observed}}
    Evidence: {{story_keys and specific artifact data supporting this}}
    Suggested change:
    - File: {{pantheon workflow file that would change}}
    - Change: {{description of what to modify}}

    ```diff
    {{proposed change as a diff}}
    ```

  END FOR

  NOTE: These suggestions are saved to:
  {{sprint_artifacts}}/retro-proposals/pantheon-suggestions.md

  Take these to the Pantheon repo when ready.
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 5: Update Sprint Status

```
Read {{implementation_artifacts}}/sprint-status.yaml

Find key: epic-{{epic_num}}-retrospective
Update: epic-{{epic_num}}-retrospective: done

IF key not found:
  Append to development_status:
    epic-{{epic_num}}-retrospective: done

Save file (preserve all comments and existing entries).

Display:
"Updated sprint-status.yaml: epic-{{epic_num}}-retrospective → done"
```

## Step 6: Final Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EPIC {{epic_num}} RETROSPECTIVE COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Retro document: {{implementation_artifacts}}/epic-{{epic_num}}-retro-{{date}}.md

Changes applied:
  Playbook updates: {{playbook_applied_count}} / {{playbook_total_count}}
  CLAUDE.md patches: {{claude_applied_count}} / {{claude_total_count}}
  Process suggestions: {{process_count}} saved for review

{{IF has_next_epic}}
Next epic readiness: {{readiness_status}}
{{IF readiness_blockers}}
Blockers to resolve before Epic {{next_epic_num}}:
{{FOR EACH blocker}}
  - {{blocker_description}}
{{END FOR}}
{{END IF}}
{{END IF}}

Sprint status: epic-{{epic_num}}-retrospective → done
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
