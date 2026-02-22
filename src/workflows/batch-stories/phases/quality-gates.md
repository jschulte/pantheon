# Phase: Quality Gates (Post-Batch Verification)
<!-- Batch Stories phase file — see workflow.md for config and routing -->

<step name="quality_gates" if="mode == parallel">
**Centralized Quality Gates — Run Once After All Stories**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 QUALITY GATES (BATCH DEFERRED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Why this phase exists:** During batch execution, individual story workers skip `tsc --noEmit`
and `npm run lint` to avoid N parallel processes competing for CPU. This phase runs both
checks exactly ONCE after all stories complete, then fixes any issues.

**What was already verified per-story:**
- Scoped tests (`jest --findRelatedTests`) — ran during BUILD, VERIFY, and REFINE
- Prettier formatting (`lint-staged`) — ran in pre-commit hook
- Secret detection — ran in pre-commit hook

**What this phase verifies:**
- Integration branch merged cleanly into main (worktree mode)
- TypeScript type-check (whole project, one process)
- Full test suite (catches cross-story integration issues)
- ESLint lint (whole project, one process)

### Step 0: Verify Integration Merge (Worktree Mode)

If worktree isolation was used, the integration branch was already merged into main
during the execute-parallel phase (Step 6: Final Merge). Verify that merge was clean:

```bash
# Verify we're on main and integration is fully merged
git branch --merged main | grep integration
```

```
IF integration branch is merged:
  "✅ Integration branch merged cleanly into main"
ELSE:
  "⚠️ Integration branch not fully merged — attempting merge"
  git merge integration --no-edit
  IF merge fails:
    "❌ Integration merge conflict — manual resolution required"
    Display conflict files
```

### Step 1: Run Type Check

```bash
cd app
npm run type-check 2>&1 | tee /tmp/batch-typecheck-output.txt
TYPE_CHECK_EXIT=$?
```

Display result:
```
IF TYPE_CHECK_EXIT == 0:
  "✅ Type check: PASS (0 errors)"
ELSE:
  "❌ Type check: FAIL — see errors below"
  Display first 50 lines of errors
```

### Step 2: Run Lint

```bash
cd app
npm run lint -- --fix 2>&1 | tee /tmp/batch-lint-output.txt
LINT_EXIT=$?
```

`--fix` handles auto-fixable issues (formatting, import order, etc.) in one pass.

Display result:
```
IF LINT_EXIT == 0:
  "✅ Lint: PASS (0 errors, auto-fixes applied if any)"
ELSE:
  "❌ Lint: FAIL — see errors below"
  Display first 50 lines of errors
```

### Step 2.5: Run Full Test Suite (Cross-Story Integration)

Per-story tests ran scoped (`jest --findRelatedTests`) during BUILD/VERIFY. Now run the
full suite to catch cross-story integration issues — e.g., two stories modifying the same
module in incompatible ways.

```bash
cd app
npm test -- --bail 2>&1 | tee /tmp/batch-test-output.txt
TEST_EXIT=$?
```

```
IF TEST_EXIT == 0:
  "✅ Full test suite: PASS"
ELSE:
  "❌ Full test suite: FAIL — cross-story integration issues detected"
  Display first 50 lines of failures
```

### Step 3: If Errors, Spawn Fixer Agent

```
IF TYPE_CHECK_EXIT != 0 OR LINT_EXIT != 0 OR TEST_EXIT != 0:
  # Collect error output
  errors = ""
  IF TYPE_CHECK_EXIT != 0:
    errors += Read("/tmp/batch-typecheck-output.txt")
  IF LINT_EXIT != 0:
    errors += Read("/tmp/batch-lint-output.txt")
  IF TEST_EXIT != 0:
    errors += Read("/tmp/batch-test-output.txt")

  # Spawn a fixer agent to resolve issues
  fixer = Task({
    subagent_type: "general-purpose",
    model: "opus",
    description: "🔧 Fix batch type-check/lint errors",
    prompt: `
You are a code fixer. The batch pipeline completed all stories but type-check, lint, and/or
tests failed. Fix ALL errors below.

## Errors to Fix

{{errors}}

## Rules

- Fix type errors and lint errors in the affected files
- Do NOT change test files unless the type error is in a test
- Do NOT refactor or improve code — only fix the specific errors
- Run \`npm run type-check\` after fixes to verify
- Run \`npm run lint\` after fixes to verify
- If a lint error is auto-fixable, run \`npm run lint -- --fix\` first
- Working directory: {{project_root}}/app
`
  })

  Display:
    "🔧 Spawned fixer agent to resolve {{error_count}} errors..."
    "   Fixer result: {{fixer.result}}"
```

### Step 4: Commit Fixes (If Any)

```
IF fixes were applied:
  cd {{project_root}}
  git add -A
  SKIP_TYPECHECK=1 SKIP_LINT=1 git commit -m "$(cat <<'EOF'
fix(batch): resolve type-check and lint errors from deferred quality gates
EOF
  )"

  Display: "📦 Committed quality gate fixes: {{git_hash}}"
```

### Step 5: Final Verification

```bash
cd app
npm run type-check
npm run lint
npm test -- --bail
```

```
IF all pass:
  Display:
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    "✅ QUALITY GATES PASSED"
    "   Integration: MERGED"
    "   Type check: PASS"
    "   Tests: PASS"
    "   Lint: PASS"
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ELSE:
  Display:
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    "❌ QUALITY GATES FAILED — Manual intervention required"
    "   Type check: {{PASS|FAIL}}"
    "   Tests: {{PASS|FAIL}}"
    "   Lint: {{PASS|FAIL}}"
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    "   Remaining errors saved to /tmp/batch-*-output.txt"
    "   Fix manually and commit before merging."

  # Do NOT halt the batch — proceed to summary with the failure noted
```

### Step 6: Cleanup Integration Branch

The integration branch was retained by execute-parallel for this verification.
Now that quality gates are complete, clean it up.

```
Bash("git branch -d integration 2>/dev/null || true")
Display: "🧹 Cleaned up integration branch"
```

### Proceed to Summary

Continue to `report-summary` phase with quality gate results included.

</step>
