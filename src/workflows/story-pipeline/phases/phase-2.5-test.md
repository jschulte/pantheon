# Phase 2.5: TEST (2.5/7)
<!-- Part of Story Pipeline v1.3 — see workflow.md for config and routing -->
<!-- v1.3: Separated testing from build phase for adversarial test authoring -->

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PHASE 2.5: TEST (2.5/7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Aletheia writes adversarial tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Purpose

The builder (Metis) writes implementation code but NO tests. A separate test agent (Aletheia) writes all tests with an adversarial mindset — her job is to BREAK things, not confirm they work.

This separation prevents the "builder tests their own code" anti-pattern where tests are unconsciously designed to pass rather than to find bugs.

### Step 1: Spawn Aletheia (Test Agent)

```
BUILDER_ARTIFACT = Read("{{sprint_artifacts}}/completions/{{story_key}}-builder.json")

Task({
  subagent_type: "automater-test",
  model: "opus",
  description: "🎯 Aletheia writing adversarial tests for {{story_key}}",
  prompt: `
<agent_definition>
[INLINE: Content from agents/builders/testing.md — Aletheia base persona]
</agent_definition>

<workflow_instructions>
[INLINE: Content from agents/test-agent.md — workflow-specific test agent rules]
</workflow_instructions>

<goal>
Write comprehensive, adversarial tests for the implementation of {{story_key}}.
Your job is to BREAK things, not confirm they work.

You MUST achieve 100% coverage on new code.
You may ONLY write test files. You may NOT modify implementation files.
</goal>

<context>
<story>
[INLINE: Full story file content]
</story>

<builder_artifact>
files_created: {{BUILDER_ARTIFACT.files_created}}
files_modified: {{BUILDER_ARTIFACT.files_modified}}
test_suggestions: {{BUILDER_ARTIFACT.test_suggestions}}
</builder_artifact>

<implementation_files>
[INLINE: All files created/modified by Metis — read but do not modify]
</implementation_files>
</context>

<adversarial_mindset>
Your job is to BREAK things, not confirm they work.

Before writing any test, ask yourself:
- What happens with empty input? Null? Undefined?
- What happens with malformed data? Wrong types?
- What happens at boundary conditions? Max int? Empty string? Max length?
- What happens with concurrent access? Race conditions?
- What happens when dependencies fail? Network errors? Timeouts?
- What does the unhappy path look like?

Write tests you EXPECT to fail first. If they all pass on the first run,
you're not being adversarial enough.
</adversarial_mindset>

<constraints>
- You may ONLY create/modify test files (*.test.*, *.spec.*, __tests__/*)
- You may NOT modify implementation files — that is Metis's domain
- ALL tests must pass — no "pre-existing failure" exceptions
- 100% coverage on new code is mandatory
- If you find a bug (test fails), report it — do NOT fix the implementation
</constraints>

<completion_format>
{
  "agent": "aletheia",
  "story_key": "{{story_key}}",
  "tests_added": { "total": N, "passing": N, "files": [...] },
  "coverage_percentage": N,
  "bugs_found": [
    {
      "test_file": "path/to/test.ts",
      "test_name": "description of failing test",
      "failure_reason": "what broke and why",
      "implementation_file": "path/to/source.ts:line",
      "severity": "MUST_FIX | SHOULD_FIX"
    }
  ],
  "adversarial_patterns_tested": [
    "null input handling",
    "empty array edge case",
    "concurrent access simulation"
  ]
}

Save to: {{sprint_artifacts}}/completions/{{story_key}}-aletheia.json
</completion_format>
`
})
```

### Step 2: Bug Loop (Test ↔ Build)

If Aletheia finds bugs (tests that fail against the implementation), send failing tests back to Metis for fixes.

```
ALETHEIA_RESULT = Read("{{sprint_artifacts}}/completions/{{story_key}}-aletheia.json")
BUG_ITERATION = 0
MAX_BUG_ITERATIONS = 3

WHILE ALETHEIA_RESULT.bugs_found.length > 0 AND BUG_ITERATION < MAX_BUG_ITERATIONS:

  BUG_ITERATION += 1

  # 2.1 — Send bug reports to Metis for implementation fixes
  Task({
    subagent_type: "general-purpose",
    model: "opus",
    description: "🔨 Metis fixing bugs found by Aletheia (round {{BUG_ITERATION}}) on {{story_key}}",
    resume: "{{LAST_BUILDER_AGENT_ID}}",
    prompt: `
Aletheia (test agent) found {{ALETHEIA_RESULT.bugs_found.length}} bugs in your implementation.

<bug_reports>
{{ALETHEIA_RESULT.bugs_found — formatted as actionable bug reports}}
</bug_reports>

Fix the IMPLEMENTATION (not the tests). The tests are correct — they expose real bugs.

IMPORTANT: Do NOT modify test files. Only fix implementation files.

After fixing, run the failing tests to confirm they pass:
# Run failing tests using the project's test runner (jest or vitest)
npx jest --findRelatedTests {{affected_test_files}}  # or: npx vitest run --related {{affected_test_files}}
`
  })

  # 2.2 — Re-run tests to verify fixes
  # (Aletheia's tests should now pass against fixed implementation)
  # Run tests using the project's test runner
  RUN: npx jest --findRelatedTests {{test_files}} --coverage  # or: npx vitest run --related {{test_files}} --coverage

  IF all tests pass:
    BREAK
  ELSE:
    # Update bugs_found with remaining failures
    ALETHEIA_RESULT.bugs_found = remaining_failures

END WHILE

IF BUG_ITERATION >= MAX_BUG_ITERATIONS AND bugs remain:
  → Log: "Bug loop exhausted after {{BUG_ITERATION}} rounds. {{remaining_bugs}} bugs remain."
  → These will be caught by Phase 3 reviewers as MUST_FIX issues
```

### Step 3: Test Phase Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TEST COMPLETE — Aletheia
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tests written: {{ALETHEIA_RESULT.tests_added.total}}
Tests passing: {{ALETHEIA_RESULT.tests_added.passing}}
Coverage: {{ALETHEIA_RESULT.coverage_percentage}}%
Bugs found: {{ALETHEIA_RESULT.bugs_found.length}}
Bug fixes applied: {{BUG_ITERATION}} rounds
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Update Progress

Update `{{sprint_artifacts}}/completions/{{story_key}}-progress.json`:
```json
{
  "current_phase": "VERIFY",
  "phases": {
    "PREPARE": { "status": "complete", "details": "..." },
    "BUILD": { "status": "complete", "details": "..." },
    "TEST": {
      "status": "complete",
      "details": "{{tests_added}} tests, {{coverage}}% coverage, {{bugs_found}} bugs found"
    },
    "VERIFY": { "status": "in_progress" }
  }
}
```

**📢 Orchestrator says:**
> "Aletheia wrote {{tests_added}} adversarial tests with {{coverage}}% coverage! She found {{bugs_found}} bugs that Metis fixed. Now sending in the review squad."
