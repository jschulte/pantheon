# Agent Completion Pattern

Standard protocol for agent output artifacts across all pipeline agents.

---

## Core Principle

Every agent produces a **structured JSON artifact** saved to a known path. The orchestrator and downstream agents depend on this format. Deviating breaks the pipeline.

---

## Completion Artifact Format

```json
{
  "agent": "<role>",
  "story_key": "{{story_key}}",
  "status": "SUCCESS | PARTIAL | FAILED",
  "files_created": ["path/to/new/file.ts"],
  "files_modified": ["path/to/existing/file.ts"],
  "tasks_addressed": [
    "Task description from story"
  ],
  "issues": [],
  "summary": "Brief human-readable summary"
}
```

---

## Required Fields by Agent Role

| Field | Builder | Inspector | Reviewer | Fixer |
|-------|---------|-----------|----------|-------|
| `agent` | "builder" | "inspector" | "<role>" | "fixer" |
| `story_key` | Required | Required | Required | Required |
| `status` | Required | Required | Required | Required |
| `files_created` | Required | - | - | - |
| `files_modified` | Required | - | - | Required |
| `tasks_addressed` | Required | Required | - | - |
| `task_verification` | - | Required | - | - |
| `issues` | - | Optional | Required | - |
| `checks` | - | Required | - | Required |
| `verdict` | - | Required | - | - |

---

## Save Path Convention

All artifacts save to: `{{sprint_artifacts}}/completions/{{story_key}}-<agent>.json`

| Agent | Filename |
|-------|----------|
| Builder (Metis) | `{{story_key}}-builder.json` |
| Inspector (Argus) | `{{story_key}}-inspector.json` |
| Test Quality (Nemesis) | `{{story_key}}-nemesis.json` |
| Security (Cerberus) | `{{story_key}}-cerberus.json` |
| Logic (Apollo) | `{{story_key}}-apollo.json` |
| Architecture (Hestia) | `{{story_key}}-hestia.json` |
| Quality (Arete) | `{{story_key}}-arete.json` |
| Multi-Reviewer | `{{story_key}}-review.json` |
| Forged Specialist | `{{story_key}}-{{spec.id}}.json` |
| Reconciler (Eunomia) | `{{story_key}}-reconciler.json` |

---

## Status Values

- **SUCCESS** — All objectives met, no blocking issues
- **PARTIAL** — Some objectives met, blocking issues remain
- **FAILED** — Unable to complete, requires escalation

---

## Issue Format (Reviewers)

```json
{
  "id": 1,
  "severity": "MUST_FIX | SHOULD_FIX | STYLE",
  "description": "What's wrong",
  "file": "path/to/file.ts",
  "line": 45,
  "suggestion": "How to fix it"
}
```

---

## Rules

1. **Always save the artifact** — even on failure (status: "FAILED")
2. **Use exact field names** — downstream agents parse these programmatically
3. **Include file listings** — the orchestrator uses these for context assembly
4. **Never omit story_key** — it's the primary key for artifact correlation
5. **Write valid JSON** — use the Write tool, not echo/heredoc
