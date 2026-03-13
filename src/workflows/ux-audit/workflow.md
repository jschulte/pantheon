---
name: "ux-audit"
description: "UX design audit — bootstrap design language reference or audit pages for consistency"
---

# UX Design Audit Workflow

**Agent:** Harmonia 🎼 (Goddess of Harmony and Concord)
**Purpose:** Establish and maintain design consistency across an application's UI/UX

---

## Overview

This workflow ensures every page in an application feels like it belongs to the same system. It operates in two modes:

1. **BOOTSTRAP** — Extract patterns from the existing app, create a Design Language Reference (DLR)
2. **AUDIT** — Compare pages against the DLR, find and report inconsistencies

---

## When to Use

| Scenario | Mode | Trigger |
|----------|------|---------|
| New project, no DLR exists | BOOTSTRAP | Manual invocation |
| Regular consistency check | AUDIT | Manual or scheduled |
| After major UI changes | AUDIT (targeted) | Manual |
| Story touches frontend files | AUDIT (story-scoped) | Automatic via story pipeline |
| Design system established | BOOTSTRAP (update) | After design system adoption |

---

## Phase 1: PREPARE

### 1.1 Determine Mode

Check for an existing DLR:

```bash
# Check common locations
ls -la {{sprint_artifacts}}/design-language-reference.md 2>/dev/null
ls -la docs/design-language-reference.md 2>/dev/null
ls -la .design/language-reference.md 2>/dev/null
```

- **DLR exists** → AUDIT mode
- **No DLR** → BOOTSTRAP mode (or ask user)

### 1.2 Determine Scope

Ask the user or infer from context:

- **Full application** — All routes and pages
- **Targeted** — Specific pages, features, or components
- **Story-scoped** — Only pages affected by the current story

### 1.3 Load Configuration

Read project config for any UX-specific settings:

```yaml
# In _bmad/pantheon/config.yaml (optional section)
ux_audit:
  dlr_path: "docs/design-language-reference.md"
  framework: "react"  # react | vue | svelte | angular
  css_approach: "tailwind"  # tailwind | css-modules | styled-components | scss
  component_library: "shadcn"  # shadcn | material | ant | custom | none
  design_tokens: "tailwind.config"  # Path to design tokens
  storybook: false  # Whether Storybook is available
```

---

## Phase 2: EXECUTE

### BOOTSTRAP Path

Spawn Harmonia in bootstrap mode:

```
Agent: harmonia
Mode: bootstrap
Prompt: |
  You are Harmonia, running a BOOTSTRAP audit.

  Project: {{project_name}}
  Framework: {{framework}}
  CSS: {{css_approach}}
  Component Library: {{component_library}}

  1. Inventory all routes and pages
  2. Read each page component and its children
  3. Extract every UI pattern (forms, buttons, tables, navigation, feedback, etc.)
  4. Document patterns in the DLR template
  5. Identify canonical patterns (most common) vs deviations
  6. Save completed DLR to {{dlr_path}}

  Use the DLR template at: workflows/ux-audit/templates/design-language-reference.md
```

### AUDIT Path

Spawn Harmonia in audit mode:

```
Agent: harmonia
Mode: audit
Prompt: |
  You are Harmonia, running a consistency AUDIT.

  DLR: {{dlr_path}}
  Scope: {{scope}}
  Pages: {{pages_to_audit}}

  1. Load the Design Language Reference
  2. For each page in scope, read the component tree
  3. Compare every UI pattern against the DLR
  4. Perform cross-page consistency analysis
  5. Generate findings report
  6. Save artifact to {{sprint_artifacts}}/completions/{{story_key}}-harmonia.json
```

### Story-Scoped Path (Pipeline Integration)

When integrated with the story pipeline, Harmonia runs as a conditional reviewer:

```
Agent: harmonia
Mode: story-scoped
Prompt: |
  You are Harmonia, reviewing story {{story_key}} for design consistency.

  Changed files: {{changed_frontend_files}}
  DLR: {{dlr_path}}

  1. Load the DLR
  2. Read each changed frontend file
  3. Compare new/modified patterns against the DLR
  4. Check consistency with existing pages
  5. Flag any new patterns that should be added to the DLR
  6. Report findings
```

---

## Phase 3: REVIEW

### For BOOTSTRAP

Present the completed DLR to the user for review:

1. Show the extracted patterns
2. Ask which patterns should be canonical
3. Identify any intentional deviations
4. Finalize the DLR

### For AUDIT

Present the findings report:

1. Show consistency scores by category
2. Walk through MUST_FIX findings (mental model breakers)
3. Discuss SHOULD_FIX items (friction points)
4. Note CODE_HEALTH observations (systemic issues)
5. Present prioritized fix plan

---

## Phase 4: ACTION (Optional)

If the user wants to fix issues found during the audit:

1. **Quick fixes** — Apply MUST_FIX items that are low-effort
2. **Story creation** — Generate stories for larger consistency fixes
3. **Epic creation** — Create an epic for CODE_HEALTH items (e.g., "Design System Harmonization")
4. **DLR update** — Update the DLR if new canonical patterns were established

---

## Output Artifacts

| Artifact | Path | Mode |
|----------|------|------|
| Design Language Reference | `{{dlr_path}}` | BOOTSTRAP |
| Audit Findings Report | `{{sprint_artifacts}}/completions/{{story_key}}-harmonia.json` | AUDIT |
| Consistency Score History | `{{sprint_artifacts}}/ux-consistency-scores.json` | AUDIT (appended) |

---

## Pipeline Integration (workflow.yaml additions)

To add Harmonia to the story pipeline as a conditional reviewer, add to `workflow.yaml` under `agents.reviewer.conditional_reviewers`:

```yaml
ux_design_audit:
  name: "Harmonia"
  title: "The Design Harmonizer"
  prompt_file: "{agents_path}/harmonia.md"
  trigger_on_files:
    - "*.tsx"
    - "*.jsx"
    - "*.vue"
    - "*.svelte"
    - "*.css"
    - "*.scss"
    - "components/**"
    - "pages/**"
    - "app/**/page.tsx"
    - "app/**/layout.tsx"
  trigger_on_keywords:
    - "component"
    - "UI"
    - "form"
    - "modal"
    - "dialog"
    - "page"
    - "layout"
    - "design"
    - "button"
    - "table"
    - "navigation"
  requires: "design-language-reference"  # Only runs if DLR exists
```

---

## Tips for Best Results

1. **Run BOOTSTRAP first** — You need a DLR before you can audit against it
2. **Review the DLR with your team** — The patterns should reflect intentional decisions, not just what happened to ship first
3. **Update the DLR as you go** — When design decisions change, update the DLR before the next audit
4. **Start with targeted audits** — Full-app audits on large codebases can be overwhelming. Start with the most user-facing flows.
5. **Pair with browser automation** — For visual consistency issues that code analysis alone might miss
6. **Track scores over time** — The consistency score should improve sprint over sprint
