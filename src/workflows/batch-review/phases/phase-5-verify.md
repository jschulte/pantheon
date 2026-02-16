# Phase 5: VERIFY (5/6)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 PHASE 5: VERIFY (5/6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verifying fixes and checking for regressions
Mode: {{SWARM or SEQUENTIAL}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5.1 Run Tests

```bash
npm test 2>&1 | tee test-output.txt
```

---

### SWARM MODE: Parallel Verification Workers (Single-Team Strategy)

With the single-team strategy, verify tasks were created during team setup and are blocked
until fix tasks complete. After fixes, update verify tasks with fix artifacts.

**Step 1: Update verification tasks with fix results (targeted messaging)**

```
FOR EACH category THAT had fixes applied:
  TaskUpdate(
    taskId=VERIFY_TASK_IDS[category],
    subject="Verify: {{category}} fixes",
    description=`
      category: {{category}}
      scope_id: {{scope_id}}
      fixes_artifact: {{scope_id}}-fixes-{{category}}.json
      original_issues: {{issues for this category}}
    `
  )

  # Send targeted message ONLY to relevant verifier
  SendMessage(type="request", recipient="aletheia-{{index}}",
    content="Verification tasks unblocked for {{category}}. Claim and verify.")

FOR EACH category WHERE no fixes were applied:
  TaskUpdate(taskId=VERIFY_TASK_IDS[category], status="completed")
```

**Step 2: Verification workers already running (spawned in Step 1)**

Aletheia workers were spawned during team creation. They'll automatically pick up
verify tasks as they unblock.

**Step 3: Wait for all verifiers to complete**

Collect verification results. Check for new issues or regressions.

---

### SEQUENTIAL MODE: Single Verifier (Fallback)

```
Task({
  subagent_type: "testing-suite:test-engineer",
  model: "opus",
  description: "🔍 Verifying hardening fixes",
  prompt: `
Verify that all fixes were correctly applied and no regressions introduced.

<original_issues>
{{MUST_FIX issues that were fixed}}
</original_issues>

<fixes_applied>
{{Fixes from Phase 4}}
</fixes_applied>

<test_output>
{{test-output.txt}}
</test_output>

Save to: {{sprint_artifacts}}/hardening/{{scope_id}}-verification.json
`
})
```

---

### Iteration Logic

```
IF new_issues_found OR regressions_found:
  ITERATION += 1

  IF ITERATION > MAX_ITERATIONS:
    → Log remaining issues and continue to REPORT
  ELSE:
    → Return to Phase 4: FIX with new issues
```

**If all verified:**
--> Continue to Phase 6: REPORT
