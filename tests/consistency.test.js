import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { globSync } from 'glob';

describe('triage percentage consistency', () => {
  // Canonical triage percentages: 80-95% MUST_FIX, 5-15% SHOULD_FIX, <10% STYLE
  // Defined in phase-4-assess.md and arbiter.md

  const filesToCheck = [
    ...globSync('src/agents/support/arbiter.md'),
    ...globSync('src/workflows/story-pipeline/agents/arbiter.md'),
    ...globSync('src/adapters/**/pantheon-arbiter*.md'),
    ...globSync('src/adapters/**/pantheon-pipeline*.md'),
    ...globSync('src/adapters/**/codex-copilot-instructions*.md'),
  ];

  it('should find files containing triage percentages', () => {
    expect(filesToCheck.length).toBeGreaterThan(0);
  });

  filesToCheck.forEach((file) => {
    it(`${file} uses 80-95% for MUST_FIX (not 60-80%)`, () => {
      const content = readFileSync(file, 'utf8');
      // Should not contain old 60-80% pattern
      expect(content).not.toMatch(/60.?-?.?80%.*MUST_FIX/i);
      expect(content).not.toMatch(/MUST_FIX.*60.?-?.?80%/i);
    });
  });

  // Check that no source file (excluding historical review docs) uses old percentages
  it('no source files use deprecated 60-80% MUST_FIX', () => {
    const allSourceFiles = [
      ...globSync('src/**/*.md'),
      ...globSync('src/**/*.yaml'),
    ];
    allSourceFiles.forEach((file) => {
      const content = readFileSync(file, 'utf8');
      if (content.includes('60-80%') && content.includes('MUST_FIX')) {
        // This should fail — no source file should have the old pattern
        expect.fail(`${file} contains deprecated 60-80% MUST_FIX pattern`);
      }
    });
  });
});

describe('naming consistency', () => {
  it('no references to old project name "BMAD Story Engine"', () => {
    const allFiles = [
      ...globSync('src/**/*.md'),
      ...globSync('src/**/*.yaml'),
    ];
    allFiles.forEach((file) => {
      const content = readFileSync(file, 'utf8');
      expect(content, `${file} still references old name`).not.toMatch(/BMAD Story Engine/i);
    });
  });

  it('README uses Pantheon consistently', () => {
    const readme = readFileSync('README.md', 'utf8');
    expect(readme).toContain('Pantheon');
    expect(readme).not.toMatch(/BMAD Story Engine/i);
  });
});

describe('version consistency', () => {
  it('module.yaml and package.json versions match', () => {
    const moduleYaml = readFileSync('src/module.yaml', 'utf8');
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const moduleVersion = moduleYaml.match(/version:\s*"?([^"\n]+)"?/)?.[1];
    expect(moduleVersion).toBe(packageJson.version);
  });
});

describe('input validation patterns', () => {
  it('story_key pattern is consistent across schemas and workflow', () => {
    const schemas = globSync('src/schemas/*.schema.json');
    const storyKeyPatterns = schemas.map((file) => {
      const schema = JSON.parse(readFileSync(file, 'utf8'));
      return schema.properties?.story_key?.pattern;
    }).filter(Boolean);

    // All patterns should be the same
    const unique = new Set(storyKeyPatterns);
    expect(unique.size, 'story_key patterns differ across schemas').toBe(1);
    expect(storyKeyPatterns[0]).toBe('^[0-9]+-[0-9]+$');
  });
});

describe('severity values consistency', () => {
  it('reviewer-findings and arbiter-triage use same severity values', () => {
    const reviewerSchema = JSON.parse(readFileSync('src/schemas/reviewer-findings.schema.json', 'utf8'));
    const arbiterSchema = JSON.parse(readFileSync('src/schemas/arbiter-triage.schema.json', 'utf8'));

    const reviewerSeverities = reviewerSchema.properties.findings.items.properties.severity.enum;
    const arbiterOriginal = arbiterSchema.properties.triaged_findings.items.properties.original_severity.enum;
    const arbiterFinal = arbiterSchema.properties.triaged_findings.items.properties.final_severity.enum;

    // Reviewer severities should be subset of arbiter original
    reviewerSeverities.forEach((sev) => {
      expect(arbiterOriginal, `${sev} not in arbiter original_severity`).toContain(sev);
    });

    // Arbiter final includes DISMISSED
    expect(arbiterFinal).toContain('DISMISSED');
    reviewerSeverities.forEach((sev) => {
      expect(arbiterFinal, `${sev} not in arbiter final_severity`).toContain(sev);
    });
  });

  it('finding categories match across schemas', () => {
    const reviewerSchema = JSON.parse(readFileSync('src/schemas/reviewer-findings.schema.json', 'utf8'));
    const categories = reviewerSchema.properties.findings.items.properties.category.enum;
    expect(categories).toContain('security');
    expect(categories).toContain('architecture');
    expect(categories).toContain('performance');
    expect(categories).toContain('testing');
    expect(categories).toContain('accessibility');
  });
});
