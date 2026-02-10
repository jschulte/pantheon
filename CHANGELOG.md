# Changelog

All notable changes to Pantheon are documented here.

## Versioning

Pantheon uses two-tier versioning:
- **Module version** (package.json): `1.2.0` -- tracks npm releases and the module packaging
- **Workflow versions** (workflow.yaml): track feature evolution of individual workflows
  - story-pipeline: `7.4.0`
  - batch-stories: `4.0.0`
  - batch-review: `2.1.0`

---

## Story Pipeline

### v7.4 - Playbook Intelligence Edition

- Standardized playbook format: YAML frontmatter, token cost headers, 3-10KB size target
- Playbook index (`_index.json`): structured search, dedup protection, hit-rate metadata
- Hermes Compaction Protocol: read, assess, integrate, compact (replaces append-only)
- Budget-based playbook loading: token budget replaces "max 3" keyword grep
- Hit-rate tracking: Phase 4 feedback loop on playbook effectiveness
- Playbook guidance to reviewers: Phase 3 gets compact gotchas/anti-patterns

### v7.3.1 - Phase File Split

- Split `<process>` block into 8 phase files under `phases/` directory (~1720 lines to 8 files)
- workflow.md now contains config, routing table, and footer only (~460 lines, down from 2163)
- Phase files loaded on-demand via Read tool -- reduces initial context load by ~75%
- Zero changes to phase content -- exact extraction from `<step>` blocks
- No consumer changes needed -- Heracles, batch-stories, and Agent Teams follow routing instructions

### v7.3 - Review Quality Edition

- Phase 5 iteration-aware context strategy: iteration 1 resumes agents (full context), iteration 2+ fresh spawns with compact context (<20K tokens, sonnet model) to prevent transcript overflow
- Orchestration Discipline: orchestrator passes data payloads + goals, not step-by-step instructions. Agents follow their own definitions.
- Blind Reviewer Pattern: Argus reviews without builder completion artifact (SHARED_PREFIX_BLIND). Prevents confirmation bias -- verifies against story requirements, not builder claims.
- Conflict Resolution: Themis detects contradictory reviewer findings on same code sections. Resolves with evidence-based binding judgments (evidence over opinion, requirements as tiebreaker, no splitting the difference).
- Anti-Pattern Documentation: Hermes extracts anti-patterns during reflection ("X looks right but fails because Y"). Formal Anti-Patterns category in playbooks alongside Common Gotchas.
- Phase 2/3 prompt audit: removed prescriptive step-by-step instructions, replaced with goal+context payloads

### v7.2 - Specialist Registry Edition

- Persistent specialist registry at `docs/specialist-registry/` for cross-story persona reuse
- Pygmalion now checks registry before forging (7-step process: Analyze, Registry, Builder, Playbooks, Gaps, Forge, Register)
- Jaccard similarity matching: REUSE (>=0.5), EVOLVE (0.3-0.49), FORGE_NEW (<0.3)
- New output fields: `registry_action`, `registry_match_score` per specialist
- Orchestrator handles registry file I/O after Pygmalion returns
- Registry auto-initializes on first invocation (no bootstrap needed)
- Safety cap: max 50 specialists in registry

### v7.1 - Context Optimization Edition

- Phase 3 Option B: Orchestrator pre-reads ALL files once, builds structural digest (~200-400 lines)
- File classification engine: test, migration, config, route, auth, ui, database, types, security, logic
- File partitioning by reviewer concern: Argus/Hestia get ALL files; Nemesis/Cerberus/Apollo/Arete get focused subsets + digest
- Cache-optimized prompt structure: identical prefix (story + digest) cached after agent #1
- Escape hatch: focused agents can Read additional files beyond their partition
- Forged specialists: review_focus keywords matched against file classifications
- Agent persona files updated with Context Delivery paragraph (backward-compatible)
- Option A (consolidated) unchanged -- already efficient with single agent

### v7.0 - Pygmalion Edition

- Added Pygmalion (Persona Forge) -- dynamically forges domain-specific specialist personas
- New Phase 1.5 FORGE: Domain analysis + specialist forging (complexity >= light)
- Phase 3 VERIFY: Forged specialists spawn alongside Pantheon reviewers in parallel
- Phase 4 ASSESS: Themis triages forged specialist findings identically to Pantheon
- Phase 5 REFINE: Forged specialists with upheld MUST_FIX resumed/respawned for verification
- Complexity gating: trivial/micro skip forging; light gets max 1; standard max 2; complex max 3; critical max 4
- Forged specialists use same artifact format as Pantheon -- zero changes to Themis triage

### v6.1 - Token Optimization Edition

- Combined Mnemosyne + Hermes into Hermes (saves ~5-8K tokens/story)
- Added Multi-Reviewer consolidated agent (saves ~60-70% Phase 3 tokens)
- Complexity-based review mode routing (consolidated for trivial through standard, parallel for complex+)
- Both optimizations maintain quality while reducing token overhead

### v6.0 - Greek Pantheon Edition

- Renamed all agents to Greek mythology (Metis, Argus, Nemesis, etc.)
- Restructured to 7 named phases (PREPARE, BUILD, VERIFY, ASSESS, REFINE, COMMIT, REFLECT)
- Added Themis as independent triage arbiter (not the builder)
- Phase numbers now show progress (3/7)

### v5.1 - Pragmatic Issue Triage + 6-Tier Complexity

- 6-Tier Complexity Scale (trivial through critical)
- Issue Triage phase
- Context-aware filtering

### v5.0 - Iterative Refinement Loop

- Issue Classification (MUST_FIX/SHOULD_FIX/STYLE)
- Iterative loop until zero MUST_FIX
- Resume original reviewers
- Fresh eyes on iteration 2+
- User escalation after 3 iterations
- Tech debt logging

### v4.0 - Inspector Code Citations + Test Quality

- Inspector code citations
- Test Quality + Coverage Gate
- Playbook query + reflection

### v3.2 - Resume Builder

- Resume Builder for fixes

---

## Batch Stories

### v4.0.0 (2026-02-03)

- **BREAKING:** Parallel mode rewritten to use TeammateTool swarm coordination
  - Replaces wave-based Task polling with self-scheduling Heracles teammates
  - Dependencies expressed as task graph constraints (`addBlockedBy`) instead of computed waves
  - Workers dynamically claim unblocked stories -- zero idle time between stories
  - Progress via `SendMessage` notifications instead of 30-second artifact polling
  - Requires swarm-patched Claude Code (e.g., `claudesp` variant from claude-sneakpeek)
- New `heracles.md` teammate persona in `agents/`
  - Autonomous pipeline executor with self-scheduling loop
  - Git commit queue protocol (file-based locking with exponential backoff)
  - Structured communication protocol (success/failure/blocker messages)
  - Completion artifact generation for batch aggregation
- New `swarm_config` section in `workflow.yaml`
  - `team_prefix`, `max_workers`, `worker_model`, `worker_persona` settings
  - `requires.swarm_mode: true` flag for variant validation
- Sequential mode unchanged (no swarm dependency)
- Story-pipeline phases unchanged
- Reconciliation logic unchanged

### v1.3.0 (2026-01-07)

- Complexity-Based Routing (Step 2.6)
  - Automatic story complexity scoring (micro/standard/complex)
  - Risk keyword detection with configurable weights
  - Smart pipeline selection: micro to lightweight, complex to enhanced
  - 50-70% token savings for micro stories
  - Deterministic classification with mutually exclusive thresholds
  - Rejects stories with <3 tasks as INVALID
- Semaphore Pattern for Parallel Execution
  - Worker pool maintains constant N concurrent agents
  - As soon as worker completes, immediately start next story
  - No idle time waiting for batch synchronization
  - 20-40% faster than old batch-and-wait pattern
  - Non-blocking task polling with live progress dashboard
- Git Commit Queue (Parallel-Safe)
  - File-based locking prevents concurrent commit conflicts
  - Workers acquire `.git/bmad-commit.lock` before committing
  - Automatic retry with exponential backoff (1s to 30s max)
  - Stale lock cleanup (>5 min old locks auto-removed)
  - Serializes commits while keeping implementations parallel
- Continuous Sprint-Status Tracking
  - sprint-status.yaml updated after every task completion
  - Real-time progress comments
  - CRITICAL enforcement with HALT on update failure
- Stricter Story Validation
  - Step 2.5 now rejects stories with <3 tasks
  - Step 2.6 marks stories with <3 tasks as INVALID
  - Prevents incomplete/stub stories from being processed

### v1.2.0 (2026-01-06)

- Smart Story Validation and Auto-Creation (Step 2.5)
  - Validates story files before processing
  - Auto-creates missing stories with gap analysis
  - Auto-regenerates invalid/incomplete stories
  - Checks 12 BMAD sections, content quality
  - Interactive or fully automated modes
  - Backups before regeneration
- Removes friction: No more "story file missing" interruptions
- Ensures quality: Only valid stories with gap analysis proceed
- Configuration: New `validation` settings in workflow.yaml

### v1.1.0 (2026-01-06)

- Smart Story Reconciliation (Step 4.5)
  - Auto-verifies story accuracy after implementation
  - Updates checkboxes based on Dev Agent Record
  - Synchronizes sprint-status.yaml
  - Prevents "done" stories with unchecked items
- Added reconciliation warnings to batch summary
- Added reconciliation statistics to output

### v1.0.0 (2026-01-05)

- Initial release
- Interactive story selector
- Sequential and parallel execution modes
- Integration with story-pipeline
- Batch summary and logging

---

## Batch Review

### v2.1.0 - Specialist Registry Edition

- Phase 1.5 FORGE: Pygmalion now checks specialist registry before forging
- Jaccard similarity matching: REUSE (>=0.5), EVOLVE (0.3-0.49), FORGE_NEW (<0.3)
- Registry writes handled by orchestrator after Pygmalion output
- Token savings from reusing previously forged specialists across reviews

### v2.0.0 - Swarm + Pygmalion Edition

- Phase 1.5 FORGE: Pygmalion forges domain-specific specialist personas
- Phase 2 REVIEW: Parallel review workers (Dike) via TeammateTool swarm
- Phase 3 ASSESS: Themis deduplicates findings from multiple parallel reviewers
- Phase 4 FIX: Parallel category fixers (Asclepius) with non-overlapping file sets
- Phase 5 VERIFY: Parallel verification workers (Aletheia)
- Phase 6 REPORT: Swarm cleanup added
- Sequential fallback mode preserved for environments without swarm support
- Forged specialist reviewers integrated alongside Pantheon perspectives

### v1.0.0 - Initial Release

- Sequential deep review with single multi-perspective reviewer
- Themis triage
- Category-based sequential fixing
- Verification and iteration loop
- Hardening report generation
