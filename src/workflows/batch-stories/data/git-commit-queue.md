# Git Commit Queue Protocol
<!-- Extracted from agents/heracles.md — shared protocol for swarm commit serialization -->

**Multiple workers commit in parallel. You MUST serialize commits with a directory-based lock.**

**CRITICAL: Skip pre-commit type-check and lint in batch mode.** The pipeline already ran
type-check and lint during BUILD and VERIFY phases (in sequential mode), or defers them to a
centralized quality gates phase (in batch mode). Running them in the pre-commit hook causes
N parallel `tsc`/`eslint` processes to compete for CPU, grinding the machine to a halt.
Always use `SKIP_TYPECHECK=1 SKIP_LINT=1`.

```
# What SKIP_TYPECHECK=1 SKIP_LINT=1 does and does NOT skip:
#
# SKIPPED:
#   - TypeScript type-check (tsc --noEmit) — deferred to quality gates phase
#   - ESLint linting (npm run lint) — deferred to quality gates phase
#
# NOT SKIPPED (these hooks still run on every commit):
#   - lint-staged (prettier formatting) — fast, per-file, always runs
#   - Secret detection (e.g., detect-secrets, gitleaks) — MUST always run
#   - Tests (pnpm test --bail 1) — MUST always run
#   - Other pre-commit hooks — MUST always run
```

The lock uses `mkdir` as the atomic primitive — `mkdir` fails atomically if the directory
already exists, eliminating the TOCTOU race condition that file-based locks have.

```
BEFORE any git commit:
  1. Try to acquire lock atomically:
     - Run: mkdir .git/pantheon-commit.lock
     - mkdir is atomic — if two workers race, exactly one succeeds and one fails

  2. IF mkdir SUCCEEDED (you acquired the lock):
     - Write your worker ID and timestamp to .git/pantheon-commit.lock/owner
     - Proceed to step 3

  2b. IF mkdir FAILED (lock already held):
     - Read .git/pantheon-commit.lock/owner, check timestamp
     - IF lock is stale (>5 minutes old):
       → Run: rm -rf .git/pantheon-commit.lock
       → Retry mkdir .git/pantheon-commit.lock from step 1
       → (If retry also fails, another worker beat you — continue waiting)
     - ELSE:
       → Wait with exponential backoff: 1s, 2s, 4s, 8s, 16s (max 30s)
       → Max retries: 10
       → After each wait, retry from step 1

  3. WITH lock held:
     - git add <specific files>
     - SKIP_TYPECHECK=1 SKIP_LINT=1 git commit -m "message"
     - Run: rm -rf .git/pantheon-commit.lock  (release lock immediately)

  4. IF lock acquisition fails after max retries:
     - Log error in progress artifact
     - Report to team-lead via SendMessage
     - Continue to next phase (don't block pipeline on commit failure)
```
