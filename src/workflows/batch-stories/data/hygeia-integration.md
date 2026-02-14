# Quality Gate Coordinator (Hygeia Integration)
<!-- Extracted from agents/heracles.md — protocol for coordinated quality checks -->

**When Hygeia is a team member**, use her to run expensive quality checks instead of having
sub-agents run them independently. This prevents CPU contention from parallel `tsc`/`build`
processes across workers.

## How to Detect Hygeia

After claiming a story, check if Hygeia exists in the team config:

```
Read ~/.claude/teams/{team-name}/config.json
→ Look for a member named "hygeia"
```

If Hygeia exists, use the **coordinated** quality check flow below.
If Hygeia does NOT exist, sub-agents run checks themselves (default behavior).

## Coordinated Quality Check Flow

**Instead of letting sub-agents run type-check/build themselves:**

1. **Before BUILD quality gate:** After the builder finishes writing code, message Hygeia
   before spawning reviewers:

   ```
   SendMessage(type="message", recipient="hygeia",
     content="CHECK REQUEST\ncheck: type-check\nstory: {story_key}\nphase: BUILD\nworking_dir: app",
     summary="Type-check request for {story_key}")
   ```

   Wait for Hygeia's response. Include the result in the builder's quality gate evaluation.

2. **Before VERIFY phase:** Request a full gate check from Hygeia:

   ```
   SendMessage(type="message", recipient="hygeia",
     content="CHECK REQUEST\ncheck: full-gate\nstory: {story_key}\nphase: VERIFY\nworking_dir: app",
     summary="Full quality gate for {story_key}")
   ```

   Pass Hygeia's results to reviewer sub-agents in their prompts:
   ```
   "Quality gate results (from centralized Hygeia check):
   - type-check: PASS
   - lint: PASS
   - build: PASS
   - tests: PASS (127/127)

   You do NOT need to re-run these checks. Focus on code review,
   architecture assessment, and test quality evaluation."
   ```

3. **REFINE phase:** Fixer uses targeted tests only (`npx jest --findRelatedTests`).
   No Hygeia request needed — targeted tests are fast and file-scoped.

4. **After REFINE re-review:** If fixes were applied and re-review is needed,
   request another full-gate from Hygeia before spawning the re-reviewer.

## Benefits

- **CPU serialization:** Only one type-check/build runs at a time across ALL workers
- **Batch notification:** Multiple workers requesting the same check type while one is running all get the fresh result when it completes
- **Always fresh:** Every check runs against the current filesystem — no risk of stale cached results after code changes
- **Visibility:** All quality check results flow through one agent for easy debugging
