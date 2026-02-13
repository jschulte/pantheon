# Story Pipeline

<purpose>
Implement a story using parallel verification agents with Builder context reuse.
Enhanced with playbook learning, code citation evidence, test quality validation, pragmatic triage, automated coverage gates, and on-the-fly persona forging via Pygmalion.
Builder fixes issues in its own context (50-70% token savings).
Pygmalion forges domain-specific specialist reviewers to fill Pantheon coverage gaps.
Blind reviewer pattern prevents confirmation bias. Conflict resolution handles contradictory findings.
Anti-pattern documentation captures "looks right but fails" patterns for future builders.
</purpose>

<philosophy>
**Quality Through Discipline, Continuous Learning**

- Phase 1 PREPARE: Validate story quality, load playbooks
- Phase 1.5 FORGE: Pygmalion analyzes domain, forges specialist personas (if complexity >= light)
- Phase 2 BUILD: Metis implements with TDD
- Phase 3 VERIFY: Argus + Nemesis + reviewers + forged specialists validate in parallel
- Phase 4 ASSESS: Coverage gate + Themis triages issues pragmatically
- Phase 5 REFINE: Metis fixes real issues, iterate until clean
- Phase 6 COMMIT: Reconcile story, update status
- Phase 7 REFLECT: Mnemosyne updates playbooks for future

Measure twice, cut once. Trust but verify. Evidence-based validation. Self-improving system.
</philosophy>

<agents>
## The Greek Pantheon

| Role | Name | Domain | Emoji |
|------|------|--------|-------|
| Builder | **Metis** | Goddess of wisdom, skill, and craft | 🔨 |
| Inspector | **Argus** | The 100-eyed giant who sees everything | 👁️ |
| Test Quality | **Nemesis** | Goddess of retribution and balance | 🧪 |
| Security | **Cerberus** | Three-headed guardian of the underworld | 🔐 |
| Logic/Perf | **Apollo** | God of reason, truth, and light | ⚡ |
| Architecture | **Hestia** | Goddess of hearth, home, and structure | 🏛️ |
| Quality | **Arete** | Personification of excellence | ✨ |
| Arbiter | **Themis** | Titan of justice and fair judgment | ⚖️ |
| Reflection | **Mnemosyne** | Titan of memory | 📚 |
| Accessibility | **Iris** | Goddess of the rainbow, bridges realms | 🌈 |
| Persona Forge | **Pygmalion** | The sculptor who brought the perfect being to life | 🗿 |
| Reconciler | **Eunomia** | Goddess of lawful conduct and good order | 📋 |
| *Forged Specialists* | *Dynamic* | *Domain-specific experts created by Pygmalion* | *Varies* |
</agents>

<execution_discipline>
**CRITICAL: How This Workflow Executes**

This workflow runs in TWO contexts. The phases, quality gates, and artifacts are IDENTICAL in both.

### Context 1: Main Session (Sequential — via Skill)

1. User invokes `/bmad_pantheon_story-pipeline {story-key}`
2. Main session loads this workflow.md
3. Main session executes phases sequentially, spawning Task agents as defined below
4. Task agents return artifacts; main session continues with next phase

### Context 2: Heracles Teammate (Parallel — via batch-stories swarm)

1. Heracles worker claims a story from the shared TaskList
2. Heracles reads this workflow.md file directly (no Skill invocation needed)
3. Heracles executes phases sequentially, spawning Task sub-agents as defined below
4. Task sub-agents return artifacts; Heracles continues with next phase

**This works because `general-purpose` Task agents have access to ALL tools, including the Task tool itself.** Heracles workers CAN and MUST spawn sub-agents for each pipeline phase.

### Context 3: Agent Teams Member (Experimental)

When running as a teammate in an Agent Teams session (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`):

- **You CAN spawn Task sub-agents.** The "no nested teams" restriction only prevents calling `TeammateTool` (creating new teams or spawning additional teammates). Regular `Task` sub-agent spawning works normally and is required for all pipeline phases.
- **You CAN use all standard tools** (Read, Write, Edit, Bash, Grep, Glob, Task, etc.)
- **You CANNOT call TeammateTool** — no `spawnTeam`, no spawning additional teammates
- **You CANNOT create nested teams** — one team per session, managed by the lead
- **Session resumption does NOT restore teammates** — progress artifacts are your crash recovery mechanism

Agent Teams is **experimental** and may change without notice. The sequential fallback (Context 1) always works regardless of feature availability.

### Task Agents Used Per Phase (same in both contexts):

- Phase 1.5 FORGE: `Task(subagent_type: "general-purpose")` → Pygmalion (Persona Forge) — complexity >= light only
- Phase 2 BUILD: `Task(subagent_type: "general-purpose")` → Metis (Builder)
- Phase 3 VERIFY: `Task(subagent_type: ...)` → Argus + Nemesis + Cerberus/Apollo/Hestia/Arete + forged specialists - in parallel
- Phase 4 ASSESS: `Task(subagent_type: ...)` → Themis (triage arbiter)
- Phase 5 REFINE: Iterative loop:
  - `Task(resume: builder_id)` → Metis fixes MUST_FIX
  - `Task(resume: reviewer_id)` → Original reviewers verify their issues
  - `Task(subagent_type: ...)` → Fresh eyes (iteration 2+)
- Phase 6 COMMIT: `Task(subagent_type: "general-purpose")` → Eunomia (Reconciler) + hard validation gate
- Phase 7 REFLECT: `Task(subagent_type: ...)` → Mnemosyne (Reflection)

### NEVER DO THIS (applies in BOTH contexts):

- Spawn a `dev-typescript` or other Task agent to implement a story outside this workflow
- Use Task tool to bypass the multi-agent verification structure
- Let the orchestrator/worker write implementation code directly (delegate to Metis)
- Paraphrase or summarize pipeline phases — load and follow THIS file

**WHY:**
Ad-hoc Task agents lack:
- Playbook knowledge (Phase 1)
- Independent verification (Phase 3)
- Issue classification (MUST_FIX/SHOULD_FIX/STYLE)
- Pragmatic triage (Themis in Phase 4)
- Code citation evidence (Argus)
- Test quality validation (Nemesis)
- Security/architecture review (Cerberus/Apollo/Hestia/Arete)
- Coverage gates (Phase 4)
- Iterative refinement until issues resolved (Phase 5)

The workflow structure EXISTS to prevent bugs that slip through when a single agent implements and self-certifies.
</execution_discipline>

<orchestration_discipline>
**CRITICAL: How the Orchestrator Communicates With Agents**

The orchestrator passes **data payloads and goals** to agents. It does NOT pass step-by-step instructions.

### The Rule

Agents are experts. They have their own agent definitions (`.md` files) that define their process, checklists, and output formats. The orchestrator's job is to provide:

1. **Goal** — What needs to be accomplished
2. **Context** — Story, files, constraints, prior feedback
3. **Quality gates** — What standards must be met

The orchestrator does NOT:
- Paraphrase agent workflows into numbered steps
- Rewrite agent checklists inline
- Tell agents HOW to do their job (only WHAT to accomplish)

### Standard Payload Format

```yaml
# What the orchestrator passes to an agent:
goal: "What needs to be accomplished"
context:
  story: "<story reference or inline content>"
  files: [list of relevant files]
  constraints: [quality gates or requirements]
  prior_feedback: [if iterating, previous review findings]

# What the orchestrator does NOT pass:
# - Step-by-step instructions
# - Paraphrased agent workflow
# - Numbered execution sequences
```

### Why This Matters

When the orchestrator includes step-by-step instructions:
- Agents may follow the orchestrator's paraphrased steps instead of their own (more thorough) definitions
- Agent definitions become dead code that never executes
- Updates to agent definitions don't propagate (orchestrator's copy is stale)
- Prompts become bloated with redundant instructions

### Exceptions

Phase 1 (PREPARE) runs in the orchestrator's own context — no agents to instruct.
Phase 6 (COMMIT) spawns Eunomia for reconciliation + runs a hard validation gate.
Phase 1 and the Phase 6 validation gate have detailed steps since the orchestrator IS the executor.
</orchestration_discipline>

<config>
name: story-pipeline
execution_mode: multi_agent

phases:
  phase_1: PREPARE (story quality gate + playbook query)
  phase_1_5: FORGE (Pygmalion forges specialist personas — complexity >= light)
  phase_2: BUILD (Metis implements with TDD)
  phase_3: VERIFY (Argus + Nemesis + reviewers + forged specialists in parallel)
  phase_4: ASSESS (coverage gate + Themis triage)
  phase_5: REFINE (Metis fixes + iterate until clean)
  phase_6: COMMIT (Eunomia reconciles story + hard validation gate + update status)
  phase_7: REFLECT (Mnemosyne updates playbooks)

issue_classification:
  MUST_FIX: "Blocks completion - security, correctness, tests fail"
  SHOULD_FIX: "Real issue but non-blocking - edge cases, minor bugs"
  STYLE: "Preference only - naming, formatting, alternative approaches"

complexity_scale:
  # Scale from 1-6 verification agents based on story complexity
  # Argus (Inspector) is ALWAYS included - he's the baseline

  trivial:
    total_agents: 1
    agents: [Argus]
    triggers: [static pages, copy changes, config updates, single-file changes]
    skip_nemesis: true  # No test quality review needed for trivial

  micro:
    total_agents: 2
    agents: [Argus, Hestia]
    triggers: [1-2 tasks, no API calls, no user input, simple UI component]
    skip_nemesis: true

  light:
    total_agents: 3
    agents: [Argus, Nemesis, Hestia]
    triggers: [3-4 tasks, basic CRUD, simple form, no auth]

  standard:
    total_agents: 4
    agents: [Argus, Nemesis, Cerberus, Hestia]
    triggers: [5-10 tasks, API integration, user input handling]

  complex:
    total_agents: 5
    agents: [Argus, Nemesis, Cerberus, Apollo, Hestia]
    triggers: [11-15 tasks, auth flows, payment adjacent, data migrations]

  critical:
    total_agents: 6
    agents: [Argus, Nemesis, Cerberus, Apollo, Hestia, Arete]
    triggers: [16+ tasks, security keywords, payment processing, encryption, PII]

quality_gates:
  coverage_threshold: 80  # % line coverage required
  task_verification: "all_with_evidence"  # Argus must cite file:line
  must_fix_issues: "iterate_until_resolved"
  max_iterations: 3

token_efficiency:
  - Phase 3 agents spawn in parallel (same cost, faster)
  - Phase 3 Option B: orchestrator pre-reads files once, builds structural digest, partitions files by reviewer concern (~50% input token reduction)
  - Phase 3 Option B: all prompts share identical prefix (story + digest) for API prompt cache hits
  - Phase 5 iteration 1: resumes Metis + reviewers (50-70% token savings vs fresh agent)
  - Phase 5 iteration 2+: fresh spawn with compact context (<20K tokens, sonnet model) prevents transcript overflow
  - Phase 5 resumes ONLY reviewers who had MUST_FIX issues (targeted verification)
  - Fresh eyes added only on iteration 2+ (avoids redundant full re-review)

playbooks:
  enabled: true
  directory: "docs/implementation-playbooks"
  index_file: "_index.json"
  token_budget: 7500
  target_size_bytes: [3000, 10000]
  compaction_threshold: 10000
  auto_apply_updates: false
</config>

<execution_context>
@patterns/verification.md
@patterns/tdd.md
@patterns/agent-completion.md
</execution_context>

<orchestrator_narrative>
## Orchestrator Checkpoint System

Between each phase, the orchestrator outputs a brief narrative to keep the user informed.
These are friendly status updates - not verbose, just enough to orient the user.

**Example checkpoints:**
- "Metis is building... this may take a few minutes."
- "Good news - Metis finished! Now the reviewers will take a look."
- "Themis has weighed the issues. 2 need fixing, 3 were gold-plating."
- "All clear! Moving to commit the changes."

**Implementation:** Orchestrator outputs these as regular text messages between Task spawns.
</orchestrator_narrative>

<progress_artifact>
## Progress Tracking for Parallel Execution

When running in parallel (batch mode), each pipeline writes progress to a JSON file.
This allows the batch orchestrator to report detailed wave summaries.

**File:** `{{sprint_artifacts}}/completions/{{story_key}}-progress.json`

**Structure:**
```json
{
  "story_key": "{{story_key}}",
  "started_at": "ISO timestamp",
  "current_phase": "BUILD",
  "phases": {
    "PREPARE": { "status": "complete", "details": "2 playbooks loaded" },
    "BUILD": { "status": "in_progress", "details": "implementing..." },
    "VERIFY": { "status": "pending" },
    "ASSESS": { "status": "pending" },
    "REFINE": { "status": "pending" },
    "COMMIT": { "status": "pending" },
    "REFLECT": { "status": "pending" }
  },
  "metrics": {
    "files_changed": 0,
    "lines_added": 0,
    "issues_found": 0,
    "must_fix": 0,
    "iterations": 0
  }
}
```

**Update Points:**
- After Phase 1: PREPARE complete, playbooks loaded
- After Phase 2: BUILD complete, files/lines counts
- After Phase 3: VERIFY complete, issues found
- After Phase 4: ASSESS complete, triage results
- After Phase 5: REFINE complete (or each iteration)
- After Phase 6: COMMIT complete
- After Phase 7: REFLECT complete, final status

**Write with:**
```bash
PROGRESS_FILE="{{sprint_artifacts}}/completions/{{story_key}}-progress.json"
cat > "$PROGRESS_FILE" << 'EOF'
{ ... updated JSON ... }
EOF
```

Or use the Write tool to update the file.
</progress_artifact>

<process>
## Phase Execution

Each phase is defined in its own file under `phases/`. Load each phase file
with the Read tool when you reach it. Execute phases sequentially.

**Phase file path pattern:** `{workflow-dir}/phases/phase-{N}-{name}.md`
(where `{workflow-dir}` is the directory containing this workflow.md)

| Phase | File | Gate | Lines |
|-------|------|------|-------|
| 1 PREPARE | `phases/phase-1-prepare.md` | Always | ~160 |
| 1.5 FORGE | `phases/phase-1.5-forge.md` | complexity >= light | ~150 |
| 2 BUILD | `phases/phase-2-build.md` | Always | ~130 |
| 3 VERIFY | `phases/phase-3-verify.md` | Always | ~540 |
| 4 ASSESS | `phases/phase-4-assess.md` | Always | ~215 |
| 5 REFINE | `phases/phase-5-refine.md` | MUST_FIX > 0 | ~270 |
| 6 COMMIT | `phases/phase-6-commit.md` | Always | ~90 |
| 7 REFLECT | `phases/phase-7-reflect.md` | Always | ~160 |

**IMPORTANT:** Read phase files on-demand. Do NOT read all phase files upfront.
Load only the current phase, execute it, then load the next.
</process>

<failure_handling>
**Metis fails (Phase 2):** Don't spawn verification. Report failure and halt.
**Argus fails (Phase 3):** Still collect other reviewer findings.
**Nemesis fails (Phase 3):** Add test quality issues to fix list.
**Coverage below threshold (Phase 4):** Add to MUST_FIX list.
**Themis upholds MUST_FIX (Phase 4):** Enter refinement loop (Phase 5).
**Iteration limit reached (Phase 5):** Escalate to user with remaining issues.
**Metis resume fails (Phase 5):** Report unfixed issues. Manual intervention.
**Eunomia reports zero tasks (Phase 6):** Hard gate blocks completion. Escalate to user.
**Eunomia reports <50% tasks (Phase 6):** Warn user, allow continue or investigate.
</failure_handling>

<complexity_routing>
| Complexity | Review Mode | Agents | Triggers |
|------------|-------------|--------|----------|
| trivial | consolidated | Multi-Reviewer (4 perspectives) | Static pages, copy, config, 1 task |
| micro | consolidated | Multi-Reviewer (4 perspectives) | 2 tasks, no API, no user input |
| light | consolidated | Multi-Reviewer (4 perspectives) | 3-4 tasks, basic CRUD |
| standard | consolidated | Multi-Reviewer (4 perspectives) | 5-10 tasks, API, user input |
| complex | parallel | Argus + Nemesis + Cerberus + Apollo + Hestia | 11-15 tasks, auth, migrations |
| critical | parallel | Argus + Nemesis + Cerberus + Apollo + Hestia + Arete | 16+ tasks, payment, encryption, PII |

**Review Modes (Token Optimization v7.1):**
- **Consolidated** - Single Multi-Reviewer agent covers all 4 perspectives (Argus, Nemesis, Cerberus, Hestia). Saves ~60-70% tokens. Use for trivial→standard.
- **Parallel** - Separate agents spawn in parallel for maximum independence. Pre-read + file partitioning + prompt cache reduces input tokens ~50%. Use for complex/critical.

**Agent roles:**
- **Argus** 👁️ (Inspector) - Verifies tasks with code citations.
- **Nemesis** 🧪 (Test Quality) - Reviews test coverage and quality.
- **Cerberus** 🔐 (Security) - Security vulnerabilities, injection, auth issues.
- **Apollo** ⚡ (Logic/Performance) - Logic bugs, performance issues, edge cases.
- **Hestia** 🏛️ (Architecture) - Patterns, integration, route structure.
- **Arete** ✨ (Code Quality) - Maintainability, readability, best practices.
- **Multi-Reviewer** 👁️🧪🔐🏛️ (Consolidated) - All 4 perspectives in one pass. Token-efficient.
- **Themis** ⚖️ (Arbiter) - Triages issues with pragmatic judgment.
- **Hermes** 📜 (Reflect+Report) - Updates playbooks AND generates completion report.
- **Iris** 🌈 (Accessibility) - WCAG, ARIA, a11y (conditional, frontend only).
- **Pygmalion** 🗿 (Persona Forge) - Analyzes domain, forges specialist personas. Invoked in Phase 1.5 for complexity >= light.
- **Eunomia** 📋 (Reconciler) - Checks off story tasks with evidence, fills Dev Agent Record. Invoked in Phase 6. Includes hard validation gate (zero tasks = block, <50% = warn).
- **Forged Specialists** (Dynamic) - Domain-specific reviewers created by Pygmalion. Same artifact format as Pantheon reviewers.
</complexity_routing>

<success_criteria>
- [ ] Phase 1 PREPARE: Story validated, playbooks loaded
- [ ] Phase 1.5 FORGE: Pygmalion invoked (if complexity >= light), forged specs stored
- [ ] Phase 2 BUILD: Metis spawned, agent_id saved
- [ ] Phase 3 VERIFY: Review completed (consolidated OR parallel) + forged specialists (if any)
- [ ] Phase 4 ASSESS: Coverage passed, Themis triaged issues
- [ ] Phase 5 REFINE: Zero MUST_FIX remaining (or user accepted)
- [ ] Phase 6 COMMIT: Story reconciled, sprint status updated
- [ ] Phase 7 REFLECT: Hermes generated playbook updates + completion report
- [ ] Implementation commit exists
- [ ] Reconciliation commit exists
- [ ] Coverage ≥ {{coverage_threshold}}%
- [ ] SHOULD_FIX/STYLE logged as tech debt (if any)
</success_criteria>

<version_history>
**v1 - Playbook Intelligence Edition**
1. Standardized playbook format: YAML frontmatter, token cost headers, 3-10KB size target
2. Playbook index (`_index.json`): structured search, dedup protection, hit-rate metadata
3. Hermes Compaction Protocol: read → assess → integrate → compact (replaces append-only)
4. Budget-based playbook loading: token budget replaces "max 3" keyword grep
5. Hit-rate tracking: Phase 4 feedback loop on playbook effectiveness
6. Playbook guidance to reviewers: Phase 3 gets compact gotchas/anti-patterns

**v7.3.1 - Phase File Split**
1. ✅ Split `<process>` block into 8 phase files under `phases/` directory (~1720 lines → 8 files)
2. ✅ workflow.md now contains config, routing table, and footer only (~460 lines, down from 2163)
3. ✅ Phase files loaded on-demand via Read tool — reduces initial context load by ~75%
4. ✅ Zero changes to phase content — exact extraction from `<step>` blocks
5. ✅ No consumer changes needed — Heracles, batch-stories, and Agent Teams follow routing instructions

**v7.3 - Review Quality Edition**
1. ✅ Phase 5 iteration-aware context strategy: iteration 1 resumes agents (full context), iteration 2+ fresh spawns with compact context (<20K tokens, sonnet model) to prevent transcript overflow
2. ✅ Orchestration Discipline: orchestrator passes data payloads + goals, not step-by-step instructions. Agents follow their own definitions.
3. ✅ Blind Reviewer Pattern: Argus reviews without builder completion artifact (SHARED_PREFIX_BLIND). Prevents confirmation bias — verifies against story requirements, not builder claims.
4. ✅ Conflict Resolution: Themis detects contradictory reviewer findings on same code sections. Resolves with evidence-based binding judgments (evidence over opinion, requirements as tiebreaker, no splitting the difference).
5. ✅ Anti-Pattern Documentation: Hermes extracts anti-patterns during reflection ("X looks right but fails because Y"). Formal Anti-Patterns category in playbooks alongside Common Gotchas.
6. ✅ Phase 2/3 prompt audit: removed prescriptive step-by-step instructions, replaced with goal+context payloads

**v7.2 - Specialist Registry Edition**
1. Persistent specialist registry at `docs/specialist-registry/` for cross-story persona reuse
2. Pygmalion now checks registry before forging (7-step process: Analyze → Registry → Builder → Playbooks → Gaps → Forge → Register)
3. Jaccard similarity matching: REUSE (>=0.5), EVOLVE (0.3-0.49), FORGE_NEW (<0.3)
4. New output fields: `registry_action`, `registry_match_score` per specialist
5. Orchestrator handles registry file I/O after Pygmalion returns
6. Registry auto-initializes on first invocation (no bootstrap needed)
7. Safety cap: max 50 specialists in registry

**v7.1 - Context Optimization Edition**
1. ✅ Phase 3 Option B: Orchestrator pre-reads ALL files once, builds structural digest (~200-400 lines)
2. ✅ File classification engine: test, migration, config, route, auth, ui, database, types, security, logic
3. ✅ File partitioning by reviewer concern: Argus/Hestia get ALL files; Nemesis/Cerberus/Apollo/Arete get focused subsets + digest
4. ✅ Cache-optimized prompt structure: identical prefix (story + digest) cached after agent #1
5. ✅ Escape hatch: focused agents can Read additional files beyond their partition
6. ✅ Forged specialists: review_focus keywords matched against file classifications
7. ✅ Agent persona files updated with Context Delivery paragraph (backward-compatible)
8. ✅ Option A (consolidated) unchanged — already efficient with single agent

**v7.0 - Pygmalion Edition**
1. ✅ Added Pygmalion (Persona Forge) — dynamically forges domain-specific specialist personas
2. ✅ New Phase 1.5 FORGE: Domain analysis + specialist forging (complexity >= light)
3. ✅ Phase 3 VERIFY: Forged specialists spawn alongside Pantheon reviewers in parallel
4. ✅ Phase 4 ASSESS: Themis triages forged specialist findings identically to Pantheon
5. ✅ Phase 5 REFINE: Forged specialists with upheld MUST_FIX resumed/respawned for verification
6. ✅ Complexity gating: trivial/micro skip forging; light gets max 1; standard max 2; complex max 3; critical max 4
7. ✅ Forged specialists use same artifact format as Pantheon — zero changes to Themis triage

**v6.1 - Token Optimization Edition**
1. ✅ Combined Mnemosyne + Hermes into Hermes (saves ~5-8K tokens/story)
2. ✅ Added Multi-Reviewer consolidated agent (saves ~60-70% Phase 3 tokens)
3. ✅ Complexity-based review mode routing (consolidated for trivial→standard, parallel for complex+)
4. ✅ Both optimizations maintain quality while reducing token overhead

**v6.0 - Greek Pantheon Edition**
1. ✅ Renamed all agents to Greek mythology (Metis, Argus, Nemesis, etc.)
2. ✅ Restructured to 7 named phases (PREPARE, BUILD, VERIFY, ASSESS, REFINE, COMMIT, REFLECT)
3. ✅ Added Themis as independent triage arbiter (not the builder)
4. ✅ Phase numbers now show progress (3/7)

**v5.1 - Pragmatic Issue Triage + 6-Tier Complexity**
- 6-Tier Complexity Scale (trivial → critical)
- Issue Triage phase
- Context-aware filtering

**v5.0 - Iterative Refinement Loop**
- Issue Classification (MUST_FIX/SHOULD_FIX/STYLE)
- Iterative loop until zero MUST_FIX
- Resume original reviewers
- Fresh eyes on iteration 2+
- User escalation after 3 iterations
- Tech debt logging

**Previous:**
- Resume Builder for fixes (v3.2+)
- Inspector code citations (v4.0)
- Test Quality + Coverage Gate (v4.0)
- Playbook query + reflection (v4.0)
</version_history>
