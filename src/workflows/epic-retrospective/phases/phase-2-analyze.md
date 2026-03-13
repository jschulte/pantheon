# Phases 2-3: ANALYZE + SYNTHESIZE (2-3/4)
<!-- Part of Epic Retrospective v1.0 — see workflow.md for config and routing -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASES 2-3: ANALYZE + SYNTHESIZE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Clio: Pattern analysis + output generation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Phases 2 and 3 are combined into a single Clio agent spawn to preserve cross-story
context. Splitting would lose the pattern connections that make retrospectives valuable.

## Spawn Clio (Analyst Agent)

```
Task({
  subagent_type: "general-purpose",
  model: "opus",
  description: "📜 Clio: epic {{epic_num}} retrospective analysis",
  prompt: <see below>
})
```

### Clio Prompt Construction

The orchestrator builds the Clio prompt by inlining all collected artifacts.
Read `{workflow-dir}/agents/analyst.md` for Clio's full instructions, then
construct the prompt:

```
prompt = `
${Read("{workflow-dir}/agents/analyst.md")}

---

## EPIC CONTEXT

Epic: {{epic_num}} — {{epic_title}}
Stories: {{total_stories}} ({{done_stories}} done, {{pending_stories}} pending)
Partial retro: {{partial_retro}}
Date: {{date}}

### Epic Definition
${epic_definition_content}

### Next Epic ({{next_epic_num}})
${has_next_epic ? next_epic_content : "No next epic defined."}

### Previous Retrospective
${has_previous_retro ? prev_retro_content : "First retrospective — no prior retro to reference."}

### Current CLAUDE.md
${claude_md_content || "No CLAUDE.md found."}

### Current Playbook Index
${playbook_index_content || "No playbook index found."}

---

## STORY ARTIFACTS

${FOR EACH story_key IN story_keys, sorted by story number:}

### Story {{story_key}}: {{story_title}}

#### Narrative Log
\`\`\`
${artifacts[story_key]["narrative"] || "No narrative log found."}
\`\`\`

#### Progress Metrics
\`\`\`json
${artifacts[story_key]["-progress.json"] || "No progress metrics found."}
\`\`\`

#### Review Findings
\`\`\`json
${artifacts[story_key]["-review.json"] || "No review findings found."}
\`\`\`

#### Triage Decisions
\`\`\`json
${artifacts[story_key]["-themis.json"] || "No triage data found."}
\`\`\`

#### Reflection Learnings
\`\`\`json
${artifacts[story_key]["-mnemosyne.json"] || "No reflection data found."}
\`\`\`

#### Completion Summary
${artifacts[story_key]["-summary.md"] || "No completion summary found."}

#### Builder Output
\`\`\`json
${artifacts[story_key]["-builder.json"] || "No builder data found."}
\`\`\`

#### Specialist Forging (Pygmalion)
\`\`\`json
${artifacts[story_key]["-pygmalion.json"] || "No specialist forging data found."}
\`\`\`

#### Reporter Summary (Hermes)
\`\`\`json
${artifacts[story_key]["-hermes.json"] || "No reporter data found."}
\`\`\`

${END FOR}

---

## EPIC-LEVEL ARTIFACTS

### Hardening Reports
${FOR EACH file IN epic_artifacts["hardening"]:}
#### ${filename}
${file_content}
${END FOR}

### Session Reports
${FOR EACH file IN epic_artifacts["sessions"]:}
#### ${filename}
${file_content}
${END FOR}

---

## OUTPUT INSTRUCTIONS

Write ALL output files using the Write tool:

1. **Analysis JSON:** {{sprint_artifacts}}/retro-proposals/analysis.json
2. **Retro Document:** {{implementation_artifacts}}/epic-{{epic_num}}-retro-{{date}}.md
3. **Playbook Proposals:** {{sprint_artifacts}}/retro-proposals/playbook-updates.md
4. **CLAUDE.md Proposals:** {{sprint_artifacts}}/retro-proposals/claude-md-patches.md
5. **Process Proposals:** {{sprint_artifacts}}/retro-proposals/pantheon-suggestions.md

Ensure the retro-proposals directory exists before writing (mkdir -p).
`
```

### Context Size Management

If the total artifact content exceeds reasonable context limits:

1. **Always include:** narrative logs and progress JSONs (compact, high signal)
2. **Always include:** review JSONs (the "debates")
3. **Summarize if needed:** summary.md files (already human-readable summaries)
4. **Include selectively:** builder.json and specialist files (only for stories with issues)
5. **Always include:** hardening reports (epic-level synthesis)
6. **Always include:** mnemosyne reflections (per-story learnings)

If even this exceeds limits, split into two Clio passes:
- Pass 1: Stories 1-N/2 → partial analysis
- Pass 2: Stories N/2+1-N + Pass 1 results → complete analysis

### Expected Clio Outputs

After Clio completes, verify these files exist:

```
{{sprint_artifacts}}/retro-proposals/
  analysis.json           — Structured analysis (metrics, patterns, proposals)
  playbook-updates.md     — Proposed playbook changes with rationale
  claude-md-patches.md    — Proposed CLAUDE.md additions with rationale
  pantheon-suggestions.md — Proposed Pantheon workflow improvements

{{implementation_artifacts}}/
  epic-{{epic_num}}-retro-{{date}}.md  — The retrospective document
```

If any output is missing, log a warning but proceed to Phase 4 with what's available.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANALYZE + SYNTHESIZE COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Clio produced:
  Retro document: {{retro_doc_exists ? "Yes" : "MISSING"}}
  Analysis JSON:  {{analysis_exists ? "Yes" : "MISSING"}}
  Playbook proposals: {{playbook_exists ? "Yes (" + proposal_count + " proposals)" : "None"}}
  CLAUDE.md patches:  {{claude_exists ? "Yes (" + patch_count + " patches)" : "None"}}
  Process suggestions: {{process_exists ? "Yes (" + suggestion_count + " suggestions)" : "None"}}

Proceeding to PRESENT...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
