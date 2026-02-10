import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { globSync } from 'glob';

const yamlFiles = globSync('src/**/*.yaml', { cwd: process.cwd() });

describe('YAML validity', () => {
  it('should find YAML files to test', () => {
    expect(yamlFiles.length).toBeGreaterThan(0);
  });

  yamlFiles.forEach((file) => {
    it(`${file} parses without errors`, () => {
      const content = readFileSync(file, 'utf8');
      expect(() => parse(content)).not.toThrow();
    });
  });
});

describe('YAML structure', () => {
  it('module.yaml has required fields', () => {
    const content = parse(readFileSync('src/module.yaml', 'utf8'));
    expect(content.code).toBe('pantheon');
    expect(content.name).toBe('Pantheon');
    expect(content.version).toBeDefined();
    expect(content.requires).toContain('bmm');
  });

  it('agent-routing.yaml has builder_routing array', () => {
    const content = parse(readFileSync('src/agent-routing.yaml', 'utf8'));
    expect(content.builder_routing).toBeDefined();
    expect(Array.isArray(content.builder_routing)).toBe(true);
    expect(content.builder_routing.length).toBeGreaterThan(0);
  });

  it('agent-routing.yaml has reviewer_routing', () => {
    const content = parse(readFileSync('src/agent-routing.yaml', 'utf8'));
    expect(content.reviewer_routing).toBeDefined();
    expect(content.reviewer_routing.security).toBeDefined();
    expect(content.reviewer_routing.architecture).toBeDefined();
  });

  it('agent-routing.yaml has complexity_routing with all 6 tiers', () => {
    const content = parse(readFileSync('src/agent-routing.yaml', 'utf8'));
    const tiers = content.complexity_routing.tiers;
    const expected = ['trivial', 'micro', 'light', 'standard', 'complex', 'critical'];
    expected.forEach((tier) => {
      expect(tiers[tier]).toBeDefined();
    });
  });

  it('workflow YAMLs have required name field', () => {
    const workflowYamls = yamlFiles.filter((f) => f.includes('workflows/') && f.endsWith('workflow.yaml'));
    workflowYamls.forEach((file) => {
      const content = parse(readFileSync(file, 'utf8'));
      expect(content.name, `${file} missing name`).toBeDefined();
    });
  });
});
