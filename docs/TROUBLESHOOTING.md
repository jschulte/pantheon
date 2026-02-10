# Troubleshooting Guide

Common issues and solutions for Pantheon workflows.

---

## Story Pipeline Issues

### Pipeline halts at PREPARE with "Story quality gate failed"
**Cause:** Story file is missing required sections or has placeholder tasks.
**Fix:** Run `/create-story-with-gap-analysis` to regenerate the story, or manually add the missing sections listed in the error output.

### Builder (Metis) produces thin implementation
**Cause:** Story file lacks sufficient context. Files under 10KB often don't provide enough detail.
**Fix:** Enrich your story file — add detailed Business Context, specific Acceptance Criteria with edge cases, Technical Requirements with framework/pattern constraints, and Dev Agent Guardrails with anti-patterns.

### "Coverage below threshold" in ASSESS phase
**Cause:** Builder didn't write enough tests, or tests aren't covering the right code paths.
**Fix:** This is handled automatically — Themis marks it as MUST_FIX and Metis adds tests in the REFINE phase. If it persists after 3 iterations, the story may need manual test guidance in Dev Agent Guardrails.

### Reviewers find too many issues (20+ MUST_FIX)
**Cause:** Usually indicates the story was too complex for the assigned complexity tier, or the builder missed significant requirements.
**Fix:** Check if the story should be split into smaller stories. If the issues are legitimate, let the REFINE phase handle them (up to 3 iterations). If REFINE can't resolve them all, the pipeline will report remaining issues.

### Playbook loading takes too long or loads irrelevant playbooks
**Cause:** Playbook index has grown large, or scoring is matching on generic keywords.
**Fix:** Check `docs/implementation-playbooks/_index.json` — look for playbooks with low hit_rate (< 0.3) that might be candidates for eviction. The `max_playbook_count` in workflow.yaml caps the corpus at 50.

---

## Batch Stories Issues

### All stories failing at the same phase
**Cause:** Systemic issue (broken test infrastructure, missing dependency, etc.)
**Fix:** The circuit breaker should catch this after 3 consecutive failures at the same phase. Check the phase-specific error in the first failure. Common causes: missing `node_modules`, broken `tsconfig.json`, stale lock files.

### Swarm worker appears stuck / not progressing
**Cause:** Worker may have hit an infinite loop in REFINE, or the model is taking unusually long.
**Fix:** The `worker_timeout_seconds` config (default: 3600s) will detect stalled workers. Check `docs/sprint-artifacts/completions/` for partial progress artifacts. The lead will retry the story once if `worker_retries > 0`.

### "Lock acquisition failed" errors
**Cause:** Multiple workers trying to write to the specialist registry or playbooks simultaneously.
**Fix:** The mkdir-based locking protocol should handle this with exponential backoff. If locks persist, check for stale lock directories (`docs/specialist-registry/.write-lock/`). Locks older than `lock_timeout_seconds` (default: 180s) are automatically broken.

### Stories processed but sprint-status.yaml not updated
**Cause:** Reconciliation step was skipped or failed.
**Fix:** See `step-4.5-reconcile-story-status.md` for the manual reconciliation protocol. Run the reconciliation steps manually for each completed story.

---

## Agent Routing Issues

### Wrong builder selected for a story
**Cause:** Keyword matching picked up an unrelated term, or file patterns didn't match.
**Fix:** Check the routing log output (enabled by `log_routing: true` in agent-routing.yaml). You can override with `project_default_builder` in workflow.yaml, or set `always: true` on a specific builder.

### Pygmalion forges too many specialists
**Cause:** Story touches many domains, and complexity tier allows it.
**Fix:** `max_specialists` per complexity tier is configured in workflow.yaml. For standard stories, the cap is 2. Lower it if specialist forging adds too much token cost.

### Specialist registry full (50 entries)
**Cause:** Many unique domains forged over time without eviction.
**Fix:** The eviction policy (`strategy: "lru_with_hit_rate"`) should handle this automatically. Check `docs/specialist-registry/_index.json` for specialists with zero usage. Manually prune if needed.

---

## Platform Adapter Issues

### Copilot/OpenCode adapter missing features
**Cause:** Adapters are simplified versions of the full Claude Code pipeline.
**Fix:** This is expected. Adapters trade multi-agent verification for single-agent convenience. For full pipeline features, use Claude Code directly.

### Codex adapter "degraded mode" warning
**Cause:** Codex runs all personas in a single agent context, losing independent verification.
**Fix:** This is a known limitation documented in the adapter. The same agent builds and reviews, which undermines the blind reviewer pattern. Use Claude Code for full multi-agent verification.

---

## General Issues

### "SECURITY: Story file was modified mid-pipeline"
**Cause:** Something changed the story file after the pipeline started. Could be an editor auto-save, a concurrent process, or a formatting tool.
**Fix:** The pipeline uses SHA-256 hash verification. Close any editors that might auto-format the file, restart the pipeline. If the change was intentional, restart from Phase 1.

### YAML parse errors in workflow files
**Cause:** Indentation or syntax error in a YAML file.
**Fix:** Run `npm run validate:yaml` to identify which file has the error. YAML is sensitive to indentation — use 2 spaces, no tabs.

### "Agent spawn timeout" or agent not responding
**Cause:** Model is overloaded, or the prompt is too large for the context window.
**Fix:** Check `agent_timeouts` in workflow.yaml. Builder timeout (1800s / 30min) is the most generous. If timeouts are frequent, the story may be too complex — consider splitting it.
