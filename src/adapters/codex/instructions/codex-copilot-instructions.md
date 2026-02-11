# Pantheon - Codex/Copilot Instructions

Add this to your `.github/copilot-instructions.md` or load into Codex context.

---

## Story Implementation Pipeline

When implementing stories (files in `{{sprint_artifacts}}/*.md`), use the Pantheon 7-phase pipeline:

### Phases

1. **PREPARE** - Validate story, load playbooks
2. **BUILD** - TDD implementation
3. **VERIFY** - Multi-faceted review with evidence
4. **ASSESS** - Coverage gate + issue triage
5. **REFINE** - Fix MUST_FIX issues iteratively
6. **COMMIT** - Update story, git commit
7. **REFLECT** - Update playbooks with learnings

### Key Principles

**TDD**: Write tests before implementation.

**Evidence-Based Verification**: Every task verification must include file:line citations.

**Quick Fix Rule**: If an issue takes < 2 minutes to fix, it's MUST_FIX regardless of severity.

**Pragmatic Triage**: Focus on real issues, not gold-plating. Expected: 80-95% MUST_FIX, 5-15% SHOULD_FIX, <10% STYLE.

### Artifacts

Save completion artifacts to `{{sprint_artifacts}}/completions/`:
- `{{story_key}}-metis.json` - Builder output
- `{{story_key}}-argus.json` - Inspector verification
- `{{story_key}}-themis.json` - Triage results
- `{{story_key}}-progress.json` - Pipeline progress

### Complexity Routing

| Tasks | Complexity | Review Focus |
|-------|------------|--------------|
| 1-2 | micro | Verification only |
| 3-4 | light | + Test quality |
| 5-10 | standard | + Security |
| 11-15 | complex | + Logic/Performance |
| 16+ | critical | Full multi-agent review |

### Quality Gates

- Coverage must be >= 80%
- All tasks must have file:line evidence
- Zero MUST_FIX issues before commit

### Playbooks

Check `docs/implementation-playbooks/` for:
- Gotchas and patterns
- Code examples
- Test requirements

Update playbooks after completing stories with new learnings.
