# Plan Execution v1.0 - Team Execution Planner

<purpose>
Analyze epics and architecture to build a dependency DAG and generate an optimal team execution
plan that assigns work across N developers with maximum parallelism and minimum file conflicts.
Supports initial planning (greenfield/brownfield) and mid-project rebalancing.
</purpose>

<philosophy>
**Maximize Parallelism, Minimize Conflicts**

- Understand the full dependency graph before assigning any work
- Group work by domain affinity so each developer primarily touches one module/layer
- Balance workload across the team — no one developer should be a bottleneck
- Identify coordination checkpoints explicitly — handoffs are where things break
- Surface risk zones (same files, different devs) early so mitigation can be planned
- Support iterative refinement — the human knows their team better than any algorithm
</philosophy>

<config>
name: plan-execution
execution_mode: interactive

steps:
  step_1: Load & Validate Inputs
  step_2: Gather Team Configuration
  step_3: Analyze Architecture Domains
  step_4: Build Dependency DAG
  step_5: Compute Developer Work Streams
  step_6: Generate Execution Phases
  step_7: Interactive Refinement
  step_8: Generate Outputs
</config>

## Step Routing

Load steps on-demand from the `steps/` directory.

| # | Step | File | ~Lines |
|---|------|------|--------|
| 1 | Load & Validate | steps/step-1-load-validate.md | 104 |
| 2 | Team Config | steps/step-2-team-config.md | 71 |
| 3 | Architecture Domains | steps/step-3-architecture-domains.md | 136 |
| 4 | Dependency DAG | steps/step-4-dependency-dag.md | 170 |
| 5 | Work Streams | steps/step-5-work-streams.md | 148 |
| 6 | Execution Phases | steps/step-6-execution-phases.md | 121 |
| 7 | Interactive Refinement | steps/step-7-interactive-refinement.md | 62 |
| 8 | Generate Outputs | steps/step-8-generate-outputs.md | 91 |

**Execution flow:**
1. Steps 1-6 always execute in order
2. Step 7 is interactive (may loop back for refinements)
3. Step 8 generates final output

<failure_handling>
**No epics found (Step 1):** Halt and suggest running /create-epics-and-stories first.
**No architecture found (Step 1):** Halt and suggest running /create-architecture first.
**Circular dependencies (Step 4):** Warn user with cycle details and suggested resolutions.
**Unbalanceable workload (Step 5):** Suggest increasing team size or splitting large stories.
**Too few stories for team (Step 5):** Suggest reducing team size or combining with other work.
**Refinement limit reached (Step 7):** Proceed with current plan, note adjustments were capped.
</failure_handling>

<success_criteria>
- [ ] Step 1: Epics and architecture loaded successfully
- [ ] Step 2: Team composition confirmed by user
- [ ] Step 3: Domain mapping reviewed and approved by user
- [ ] Step 4: Dependency graph reviewed and approved by user
- [ ] Step 5: Work streams computed with balanced workload
- [ ] Step 6: Execution phases organized with checkpoints
- [ ] Step 7: User approved final plan
- [ ] Step 8: team-execution-plan.md written to docs/
- [ ] No circular dependencies (or user acknowledged them)
- [ ] All stories assigned to exactly one developer
- [ ] Risk zones identified with mitigations
</success_criteria>
