import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';
import { globSync } from 'glob';

const config = parse(readFileSync('src/config.yaml', 'utf8'));
const deferredIssues = config.pantheon.deferred_issues;

describe('tracked-issues config', () => {
  it('default tracking_method is tracked_issues_file', () => {
    expect(deferredIssues.tracking_method).toBe('tracked_issues_file');
  });

  it('tracked_issues_file config block exists with path', () => {
    expect(deferredIssues.tracked_issues_file).toBeDefined();
    expect(deferredIssues.tracked_issues_file.path).toBe('tracked-issues.json');
  });

  it('github_issues config still exists as alternative', () => {
    expect(deferredIssues.github_issues).toBeDefined();
    expect(deferredIssues.github_issues.labels).toContain('tech-debt');
  });

  it('local_file config still exists as alternative', () => {
    expect(deferredIssues.local_file).toBeDefined();
    expect(deferredIssues.local_file.path).toBe('KNOWN_ISSUES.md');
  });

  it('tracking_method comment lists all three options', () => {
    const raw = readFileSync('src/config.yaml', 'utf8');
    expect(raw).toContain('tracked_issues_file');
    expect(raw).toContain('github_issues');
    expect(raw).toContain('local_file');
  });
});

describe('tracked-issues write path (batch-review phase-6)', () => {
  const phase6 = readFileSync('src/workflows/batch-review/phases/phase-6-report.md', 'utf8');

  it('tracked_issues_file is the primary (first) tracking path', () => {
    const trackedIdx = phase6.indexOf('tracked_issues_file');
    const githubIdx = phase6.indexOf('github_issues');
    // tracked_issues_file should appear as a condition before github_issues
    expect(trackedIdx).toBeLessThan(githubIdx);
  });

  it('reads and writes tracked-issues.json', () => {
    expect(phase6).toContain('tracked-issues.json');
    expect(phase6).toContain('JSON.parse');
    expect(phase6).toContain('JSON.stringify');
  });

  it('uses type::file_path as dedup key', () => {
    expect(phase6).toContain('should-fix::{{file}}');
    expect(phase6).toContain('code-health::');
  });

  it('tracks new_findings and known_findings counters', () => {
    expect(phase6).toContain('NEW_FINDINGS');
    expect(phase6).toContain('KNOWN_FINDINGS');
  });

  it('bumps seen_count on duplicate', () => {
    expect(phase6).toContain('seen_count += 1');
  });

  it('appends to sightings on duplicate', () => {
    expect(phase6).toContain('sightings.append');
  });

  it('gh issue create only appears in github_issues branch', () => {
    // Find all gh issue create occurrences
    const lines = phase6.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('gh issue create')) {
        // Look backwards for the nearest tracking_method condition
        const preceding = lines.slice(Math.max(0, i - 20), i).join('\n');
        expect(
          preceding,
          `gh issue create at line ${i + 1} should be inside github_issues branch`
        ).toContain('github_issues');
      }
    });
  });
});

describe('tracked-issues write path (story-pipeline phase-5)', () => {
  const phase5 = readFileSync('src/workflows/story-pipeline/phases/phase-5-refine.md', 'utf8');

  it('tracked_issues_file is the primary tracking path', () => {
    const trackedIdx = phase5.indexOf('tracking_method == "tracked_issues_file"');
    const githubIdx = phase5.indexOf('tracking_method == "github_issues"');
    expect(trackedIdx).toBeGreaterThan(-1);
    expect(trackedIdx).toBeLessThan(githubIdx);
  });

  it('reads and writes tracked-issues.json', () => {
    expect(phase5).toContain('tracked-issues.json');
  });

  it('uses type::file_path as dedup key', () => {
    expect(phase5).toContain('should-fix::{{file}}');
    expect(phase5).toContain('code-health::');
  });

  it('gh issue create only appears in github_issues branch', () => {
    const lines = phase5.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('gh issue create')) {
        const preceding = lines.slice(Math.max(0, i - 20), i).join('\n');
        expect(
          preceding,
          `gh issue create at line ${i + 1} should be inside github_issues branch`
        ).toContain('github_issues');
      }
    });
  });
});

describe('tracked-issues read path (tech-debt-burndown harvest)', () => {
  const phase1 = readFileSync('src/workflows/tech-debt-burndown/phases/phase-1-harvest.md', 'utf8');

  it('reads tracked-issues.json as primary source', () => {
    expect(phase1).toContain('tracked-issues.json');
  });

  it('filters by status == open', () => {
    expect(phase1).toContain('status == "open"');
  });

  it('gh issue list only appears in github_issues fallback', () => {
    const lines = phase1.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('gh issue list')) {
        const preceding = lines.slice(Math.max(0, i - 20), i).join('\n');
        expect(
          preceding,
          `gh issue list at line ${i + 1} should be inside github_issues fallback`
        ).toContain('github_issues');
      }
    });
  });

  it('output format includes seen_count and first_seen', () => {
    expect(phase1).toContain('seen_count');
    expect(phase1).toContain('first_seen');
  });
});

describe('tracked-issues status update (tech-debt-burndown create)', () => {
  const phase4 = readFileSync('src/workflows/tech-debt-burndown/phases/phase-4-create.md', 'utf8');

  it('marks source issues as addressed', () => {
    expect(phase4).toContain('status = "addressed"');
  });

  it('has optional GitHub export section', () => {
    expect(phase4).toContain('Export to GitHub Issues');
    expect(phase4).toContain('export_to_github');
  });

  it('export sets status to exported', () => {
    expect(phase4).toContain('status = "exported"');
  });
});

describe('hardening-reporter uses new_findings/known_findings', () => {
  const reporter = readFileSync('src/workflows/batch-review/agents/hardening-reporter.md', 'utf8');

  it('uses new_findings instead of issues_created', () => {
    expect(reporter).toContain('new_findings');
    expect(reporter).not.toContain('issues_created');
  });

  it('uses known_findings instead of issues_deduped', () => {
    expect(reporter).toContain('known_findings');
    expect(reporter).not.toContain('issues_deduped');
  });

  it('JSON output uses tracked_issues_file as default tracking_method', () => {
    expect(reporter).toContain('"tracking_method": "tracked_issues_file"');
  });
});

describe('tech-debt-burndown workflow.yaml', () => {
  const burndownYaml = parse(readFileSync('src/workflows/tech-debt-burndown/workflow.yaml', 'utf8'));

  it('has export_to_github setting', () => {
    expect(burndownYaml.story_settings.export_to_github).toBe(false);
  });

  it('harvester description references local tracking as primary', () => {
    expect(burndownYaml.agents.harvester.description).toContain('tracked-issues.json');
    // GitHub Issues may be mentioned as fallback, but local should come first
    const localIdx = burndownYaml.agents.harvester.description.indexOf('tracked-issues.json');
    const githubIdx = burndownYaml.agents.harvester.description.indexOf('GitHub Issues');
    if (githubIdx > -1) {
      expect(localIdx).toBeLessThan(githubIdx);
    }
  });
});

describe('tech-debt-burndown harvester agent', () => {
  const harvester = readFileSync('src/workflows/tech-debt-burndown/agents/harvester.md', 'utf8');

  it('documents local JSON as primary path', () => {
    expect(harvester).toContain('Primary Path: Local JSON Index');
  });

  it('documents GitHub as fallback path', () => {
    expect(harvester).toContain('Fallback Path: GitHub Issues');
  });

  it('output format includes source field', () => {
    expect(harvester).toContain('"source": "tracked_issues_file"');
  });
});

describe('tracked-issues.json referenced across creation and consumption', () => {
  const creationFiles = [
    'src/workflows/batch-review/phases/phase-6-report.md',
    'src/workflows/story-pipeline/phases/phase-5-refine.md',
  ];

  const consumptionFiles = [
    'src/workflows/tech-debt-burndown/phases/phase-1-harvest.md',
    'src/workflows/tech-debt-burndown/agents/harvester.md',
  ];

  const statusUpdateFiles = [
    'src/workflows/tech-debt-burndown/phases/phase-4-create.md',
  ];

  const allFiles = [...creationFiles, ...consumptionFiles, ...statusUpdateFiles];

  allFiles.forEach((file) => {
    it(`${file} references tracked-issues.json`, () => {
      const content = readFileSync(file, 'utf8');
      expect(content).toContain('tracked-issues.json');
    });
  });

  it('all tracked-issues files exist', () => {
    allFiles.forEach((file) => {
      expect(existsSync(file), `${file} does not exist`).toBe(true);
    });
  });
});

describe('issue entry schema consistency', () => {
  // Verify the JSON schema shown in phase-6 (write) matches what phase-1 (read) expects
  const phase6 = readFileSync('src/workflows/batch-review/phases/phase-6-report.md', 'utf8');
  const phase1 = readFileSync('src/workflows/tech-debt-burndown/phases/phase-1-harvest.md', 'utf8');

  const requiredFields = [
    'id', 'type', 'file', 'line', 'perspective', 'severity',
    'description', 'source_workflow', 'source_scope',
    'first_seen', 'last_seen', 'seen_count', 'sightings', 'status',
  ];

  requiredFields.forEach((field) => {
    it(`write path (phase-6) includes "${field}" field`, () => {
      expect(phase6).toContain(`"${field}"`);
    });
  });

  it('read path (phase-1) references seen_count for harvest output', () => {
    expect(phase1).toContain('seen_count');
  });

  it('read path (phase-1) references first_seen for age filtering', () => {
    expect(phase1).toContain('first_seen');
  });
});
