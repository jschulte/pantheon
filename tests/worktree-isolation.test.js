import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';

const batchWorkflow = parse(readFileSync('src/workflows/batch-stories/workflow.yaml', 'utf8'));
const worktreeConfig = batchWorkflow.parallel_config.worktree_isolation;

describe('worktree isolation config', () => {
  it('worktree_isolation section exists in parallel_config', () => {
    expect(worktreeConfig).toBeDefined();
    expect(worktreeConfig.enabled).toBe(true);
  });

  it('has required config fields', () => {
    expect(worktreeConfig.max_worktrees).toBeDefined();
    expect(worktreeConfig.install_cmd).toBeDefined();
    expect(worktreeConfig.branch_pattern).toBeDefined();
    expect(worktreeConfig.integration_branch).toBeDefined();
    expect(worktreeConfig.manifest_file).toBeDefined();
  });

  it('max_worktrees matches max_workers', () => {
    expect(worktreeConfig.max_worktrees).toBe(batchWorkflow.parallel_config.max_workers);
  });

  it('branch_pattern contains {session} placeholder for collision avoidance', () => {
    expect(worktreeConfig.branch_pattern).toContain('{session}');
  });

  it('branch_pattern contains {n} placeholder for worktree numbering', () => {
    expect(worktreeConfig.branch_pattern).toContain('{n}');
  });

  it('worktree_path_pattern contains {session} placeholder', () => {
    expect(worktreeConfig.worktree_path_pattern).toContain('{session}');
  });

  it('integration_branch contains {session} placeholder for collision avoidance', () => {
    expect(worktreeConfig.integration_branch).toContain('{session}');
  });

  it('manifest_file points to .claude/worktrees/', () => {
    expect(worktreeConfig.manifest_file).toMatch(/\.claude\/worktrees\//);
  });
});

describe('orphan detection config', () => {
  const orphanConfig = worktreeConfig.orphan_detection;

  it('orphan_detection section exists', () => {
    expect(orphanConfig).toBeDefined();
  });

  it('has stale_threshold_hours configured', () => {
    expect(orphanConfig.stale_threshold_hours).toBeDefined();
    expect(orphanConfig.stale_threshold_hours).toBeGreaterThan(0);
  });

  it('stale threshold is reasonable (1-24 hours)', () => {
    expect(orphanConfig.stale_threshold_hours).toBeGreaterThanOrEqual(1);
    expect(orphanConfig.stale_threshold_hours).toBeLessThanOrEqual(24);
  });

  it('auto_cleanup is enabled', () => {
    expect(orphanConfig.auto_cleanup).toBe(true);
  });
});

describe('session-scoped naming prevents collision', () => {
  it('two different session IDs produce non-overlapping branch names', () => {
    const pattern = worktreeConfig.branch_pattern;
    const sessionA = 'a1b2c3';
    const sessionB = 'x9y8z7';

    const branchesA = [1, 2, 3].map((n) =>
      pattern.replace('{session}', sessionA).replace('{n}', n)
    );
    const branchesB = [1, 2, 3].map((n) =>
      pattern.replace('{session}', sessionB).replace('{n}', n)
    );

    // No overlap between sessions
    branchesA.forEach((branch) => {
      expect(branchesB).not.toContain(branch);
    });
  });

  it('two different session IDs produce non-overlapping worktree paths', () => {
    const pattern = worktreeConfig.worktree_path_pattern;
    const sessionA = 'a1b2c3';
    const sessionB = 'x9y8z7';

    const pathsA = [1, 2, 3].map((n) =>
      pattern.replace('{session}', sessionA).replace('{n}', n)
    );
    const pathsB = [1, 2, 3].map((n) =>
      pattern.replace('{session}', sessionB).replace('{n}', n)
    );

    pathsA.forEach((path) => {
      expect(pathsB).not.toContain(path);
    });
  });

  it('integration branches are session-scoped', () => {
    const pattern = worktreeConfig.integration_branch;
    const branchA = pattern.replace('{session}', 'a1b2c3');
    const branchB = pattern.replace('{session}', 'x9y8z7');
    expect(branchA).not.toBe(branchB);
  });
});

describe('execute-parallel phase references session-scoped patterns', () => {
  const executeParallel = readFileSync('src/workflows/batch-stories/phases/execute-parallel.md', 'utf8');

  it('generates a SESSION_ID', () => {
    expect(executeParallel).toContain('SESSION_ID');
    expect(executeParallel).toMatch(/shasum.*head -c 6/);
  });

  it('uses SESSION_ID in integration branch name', () => {
    expect(executeParallel).toContain('integration-{{SESSION_ID}}');
  });

  it('uses SESSION_ID in worktree branch names', () => {
    expect(executeParallel).toContain('heracles-{{SESSION_ID}}-{{n}}');
  });

  it('uses SESSION_ID in worktree paths', () => {
    expect(executeParallel).toContain('worktrees/heracles-{{SESSION_ID}}-{{n}}');
  });

  it('references manifest file', () => {
    expect(executeParallel).toContain('manifest.json');
    expect(executeParallel).toContain('MANIFEST_PATH');
  });

  it('includes orphan detection logic', () => {
    expect(executeParallel).toContain('Orphan Detection');
    expect(executeParallel).toContain('pid_alive');
    expect(executeParallel).toContain('stale_threshold_hours');
  });

  it('cleans up manifest on completion', () => {
    expect(executeParallel).toContain('delete manifest.sessions[SESSION_ID]');
  });
});

describe('story-closer mirrors worktree isolation pattern', () => {
  const storyCloser = readFileSync('src/workflows/story-closer/phases/phase-3-execute.md', 'utf8');

  it('generates a SESSION_ID', () => {
    expect(storyCloser).toContain('SESSION_ID');
  });

  it('uses SESSION_ID in teleos worktree names', () => {
    expect(storyCloser).toContain('teleos-{{SESSION_ID}}-{{n}}');
  });

  it('uses session-scoped integration branch', () => {
    expect(storyCloser).toContain('integration-{{SESSION_ID}}');
  });

  it('includes orphan cleanup', () => {
    expect(storyCloser).toContain('Cleaning orphaned session');
  });

  it('writes and cleans manifest', () => {
    expect(storyCloser).toContain('manifest.sessions[SESSION_ID]');
    expect(storyCloser).toContain('delete manifest.sessions[SESSION_ID]');
  });
});

describe('quality-gates handles session-scoped branches', () => {
  const qualityGates = readFileSync('src/workflows/batch-stories/phases/quality-gates.md', 'utf8');

  it('detects session-scoped integration branch by pattern', () => {
    expect(qualityGates).toContain("integration-*");
  });

  it('cleans up all merged integration branches', () => {
    expect(qualityGates).toContain("git branch --list 'integration-*' --merged main");
  });
});

describe('worktree phase files exist', () => {
  it('execute-parallel.md exists', () => {
    expect(existsSync('src/workflows/batch-stories/phases/execute-parallel.md')).toBe(true);
  });

  it('quality-gates.md exists', () => {
    expect(existsSync('src/workflows/batch-stories/phases/quality-gates.md')).toBe(true);
  });

  it('story-closer phase-3-execute.md exists', () => {
    expect(existsSync('src/workflows/story-closer/phases/phase-3-execute.md')).toBe(true);
  });

  it('git-commit-queue.md has deprecation notice', () => {
    const content = readFileSync('src/workflows/batch-stories/data/git-commit-queue.md', 'utf8');
    expect(content).toContain('DEPRECATION');
  });
});
