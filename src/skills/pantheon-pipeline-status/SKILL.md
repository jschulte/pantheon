---
name: Pantheon Pipeline Status
description: Check pipeline progress for running or completed batch-stories sessions. Shows per-story status, current phase, and overall progress.
allowed-tools: [Read, Grep, Glob, Bash]
---

# Pipeline Status

**Purpose:** Check progress of batch-stories pipeline execution — running or completed.

## Input Contract

| Parameter | Required | Description | Default |
|-----------|----------|-------------|---------|
| `epic` | No | Filter to a specific epic number | All epics |
| `session_id` | No | Check a specific session | Most recent |

## Process

### Step 1: Locate Sprint Artifacts

Read the project's Pantheon config to find the sprint artifacts directory:
1. Check `{project-root}/_bmad/pantheon/config.yaml` for `output_folder`
2. Default: `{project-root}/_bmad-output/implementation-artifacts`

### Step 2: Find Session State

1. Look for `session-reports/` directory in sprint artifacts
2. Look for `completions/` directory for per-story progress files
3. Look for `sprint-status.yaml` for overall story status
4. If `session_id` provided, filter to that session's files

### Step 3: Aggregate Status

For each story found, report:

| Field | Source |
|-------|--------|
| Story key | File name pattern `{key}-progress.json` |
| Status | `status` field in progress file (pending / building / reviewing / refining / complete / failed) |
| Current phase | `current_phase` field if in-progress |
| Completion % | Task checkbox count from story file |
| Issues found | Count from `{key}-themis.json` if exists |
| MUST_FIX remaining | From triage artifact |

### Step 4: Display Summary

Output a table with:

```
Pipeline Status (Epic {N})
==========================

Story   | Status     | Phase    | Tasks    | Issues | MUST_FIX
--------|------------|----------|----------|--------|--------
17-1    | complete   | —        | 12/12    | 3      | 0
17-2    | reviewing  | VERIFY   | 8/10     | —      | —
17-3    | pending    | —        | 0/15     | —      | —

Overall: 1/3 complete | 1 in progress | 1 pending
```

If no artifacts are found, report:
```
No pipeline artifacts found. Run /batch-stories to start a batch session.
```

### Step 5: Show Active Workers (Swarm Mode)

If worktree isolation is active (manifest.json exists):
1. Read `manifest.json` for worker assignments
2. Report which workers are active and their current stories
3. Report any stale workers (no progress update in > `worker_timeout_seconds`)

## Output

Plain text summary suitable for terminal display. No JSON output — this is a human-readable status check.
