# Story Pipeline Phase Transition Flowchart

```
                            START
                              |
                              v
                    +-------------------+
                    |  PHASE 1: PREPARE |
                    |  Story quality    |
                    |  gate + playbooks |
                    +-------------------+
                        |           |
                   [PASS]       [FAIL]
                        |           |
                        v           v
                        |       HALT: Fix story
                        |       (run /create-story-
                        |        with-gap-analysis)
                        v
              +---------------------+
              | PHASE 1.5: FORGE    |
              | (Pygmalion)         |<--- Skip if trivial/micro
              | Domain analysis +   |
              | specialist forging  |
              +---------------------+
                        |
                        v
                +----------------+
                | PHASE 2: BUILD |
                | Metis writes   |
                | tests + code   |
                | (TDD approach) |
                +----------------+
                        |
                        v
               +-----------------+
               | PHASE 3: VERIFY |
               +-----------------+
                   /         \
            [trivial-       [complex/
             standard]       critical]
                |               |
                v               v
          Consolidated    Parallel Reviewers
          Multi-Reviewer  (independent agents)
          (single agent,  Argus + Nemesis +
           4 perspectives) Cerberus + Hestia +
                |          forged specialists
                 \             /
                  \           /
                   v         v
              +------------------+
              | PHASE 4: ASSESS  |
              | Coverage gate +  |
              | Themis triage    |
              +------------------+
                   |          |
            [MUST_FIX > 0]  [MUST_FIX == 0]
                   |          |
                   v          |
             +-----------+    |
             | PHASE 5:  |    |
             | REFINE    |    |
             | Metis     |    |
             | fixes     |    |
             | issues    |    |
             +-----------+    |
                   |          |
              [iteration      |
               < max?]        |
               /     \        |
            [yes]   [no]      |
              |       |       |
              v       v       |
          Re-verify  Accept   |
          (Phase 3)  as-is    |
                       \      |
                        \     |
                         v    v
                  +----------------+
                  | PHASE 6: COMMIT|
                  | Git commit +   |
                  | story reconcile|
                  +----------------+
                          |
                          v
                  +-----------------+
                  | PHASE 7: REFLECT|
                  | Mnemosyne:      |
                  | update playbooks|
                  | Hermes:         |
                  | generate report |
                  +-----------------+
                          |
                          v
                       COMPLETE
```

## Phase Transition Rules

| From | To | Condition |
|------|----|-----------|
| START | PREPARE | Always |
| PREPARE | FORGE | Complexity >= light |
| PREPARE | BUILD | Complexity < light (skip forge) |
| PREPARE | HALT | Quality gate failed |
| FORGE | BUILD | Always |
| BUILD | VERIFY | Always |
| VERIFY | ASSESS | All reviewers complete |
| ASSESS | REFINE | MUST_FIX > 0 |
| ASSESS | COMMIT | MUST_FIX == 0 (skip refine) |
| REFINE | VERIFY | Re-verify after fixes (iteration < max) |
| REFINE | COMMIT | Max iterations reached or all fixed |
| COMMIT | REFLECT | Always |
| REFLECT | COMPLETE | Always |

## Maximum Iterations

The REFINE -> VERIFY -> ASSESS -> REFINE loop runs at most **3 iterations**. If issues remain after 3 iterations, the pipeline commits with remaining SHOULD_FIX items logged as tech debt.

## Batch Stories Flow

```
                 START
                   |
                   v
          +------------------+
          | Scan stories     |
          | Score complexity |
          | Get user selection|
          +------------------+
                   |
            [sequential]---[parallel/swarm]
                   |               |
                   v               v
            Process one-      Spawn workers
            by-one in         (Heracles team)
            this context      via Agent Teams
                   |               |
                   v               v
            story-pipeline    Each worker runs
            for each story    story-pipeline
                   |          independently
                   |               |
                   v               v
            Reconcile each    Workers report
            story result      via SendMessage
                   |               |
                    \             /
                     v           v
              +------------------+
              | Session Report   |
              | (Hermes)         |
              +------------------+
                       |
                       v
                   COMPLETE
```
