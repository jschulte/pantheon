import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { globSync } from 'glob';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const schemaFiles = globSync('src/schemas/*.schema.json', { cwd: process.cwd() });

/** Create a fresh AJV instance and compile a schema (avoids ID caching conflicts) */
function compileSchema(schemaPath) {
  const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
  addFormats(ajv);
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  return ajv.compile(schema);
}

describe('JSON schema validity', () => {
  it('should find schema files to test', () => {
    expect(schemaFiles.length).toBe(5);
  });

  schemaFiles.forEach((file) => {
    it(`${file} is valid JSON`, () => {
      const content = readFileSync(file, 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it(`${file} compiles as a JSON Schema`, () => {
      expect(() => compileSchema(file)).not.toThrow();
    });

    it(`${file} has $schema, $id, title, and description`, () => {
      const schema = JSON.parse(readFileSync(file, 'utf8'));
      expect(schema.$schema).toBeDefined();
      expect(schema.$id).toMatch(/^pantheon\//);
      expect(schema.title).toBeDefined();
      expect(schema.description).toBeDefined();
    });

    it(`${file} has required fields defined`, () => {
      const schema = JSON.parse(readFileSync(file, 'utf8'));
      expect(schema.required).toBeDefined();
      expect(Array.isArray(schema.required)).toBe(true);
      expect(schema.required.length).toBeGreaterThan(0);
    });
  });
});

describe('schema sample validation', () => {
  it('valid builder-completion artifact passes', () => {
    const validate = compileSchema('src/schemas/builder-completion.schema.json');
    const valid = validate({
      agent: 'metis',
      story_key: '17-1',
      status: 'completed',
      files_created: ['src/api/users.ts'],
      files_modified: ['src/api/index.ts'],
      tests_added: { total: 5, passing: 5, coverage_percent: 87.5 },
    });
    expect(valid).toBe(true);
  });

  it('invalid builder-completion (missing required) fails', () => {
    const validate = compileSchema('src/schemas/builder-completion.schema.json');
    const valid = validate({ agent: 'metis' });
    expect(valid).toBe(false);
  });

  it('invalid story_key pattern fails', () => {
    const validate = compileSchema('src/schemas/builder-completion.schema.json');
    const valid = validate({
      agent: 'metis',
      story_key: 'invalid-key',
      status: 'completed',
      files_created: [],
      files_modified: [],
      tests_added: { total: 0, passing: 0 },
    });
    expect(valid).toBe(false);
  });

  it('valid reviewer-findings artifact passes', () => {
    const validate = compileSchema('src/schemas/reviewer-findings.schema.json');
    const valid = validate({
      agent: 'cerberus',
      story_key: '5-3',
      findings: [
        {
          id: 'SEC-001',
          severity: 'MUST_FIX',
          title: 'Missing input validation',
          file: 'src/api/users.ts',
          line: 42,
          description: 'User input not sanitized before database query',
          category: 'security',
        },
      ],
    });
    expect(valid).toBe(true);
  });

  it('invalid severity value fails reviewer-findings', () => {
    const validate = compileSchema('src/schemas/reviewer-findings.schema.json');
    const valid = validate({
      agent: 'cerberus',
      story_key: '5-3',
      findings: [
        {
          id: 'SEC-001',
          severity: 'LOW',
          title: 'Test',
          file: 'test.ts',
          description: 'Test finding',
        },
      ],
    });
    expect(valid).toBe(false);
  });

  it('valid arbiter-triage artifact passes', () => {
    const validate = compileSchema('src/schemas/arbiter-triage.schema.json');
    const valid = validate({
      agent: 'themis',
      story_key: '8-2',
      triaged_findings: [
        {
          original_id: 'SEC-001',
          original_agent: 'cerberus',
          final_severity: 'MUST_FIX',
          triage_reason: 'Confirmed real SQL injection vulnerability',
        },
      ],
      summary: {
        must_fix_count: 1,
        should_fix_count: 0,
        style_count: 0,
        dismissed_count: 0,
      },
    });
    expect(valid).toBe(true);
  });

  it('valid pygmalion-output artifact passes', () => {
    const validate = compileSchema('src/schemas/pygmalion-output.schema.json');
    const valid = validate({
      agent: 'pygmalion',
      story_key: '10-4',
      complexity_tier: 'complex',
      skipped: false,
      forged_specialists: [
        {
          id: 'stripe-payments',
          name: 'Tyche',
          emoji: '$',
          title: 'Fortune of Payment Flows',
          role_type: 'reviewer',
          domain_expertise: 'Stripe integration patterns',
          review_focus: ['webhook verification', 'idempotency'],
          technology_checklist: ['stripe-node', 'webhook signatures'],
        },
      ],
      summary: {
        total_forged: 1,
        technologies_detected: ['stripe', 'node.js'],
      },
    });
    expect(valid).toBe(true);
  });

  it('valid reflection-learning artifact passes', () => {
    const validate = compileSchema('src/schemas/reflection-learning.schema.json');
    const valid = validate({
      agent: 'hermes',
      story_key: '12-1',
      learnings: [
        {
          pattern: 'Always validate webhook signatures before processing',
          domain: 'payments',
          source: 'security_issue',
        },
      ],
      playbook_updates: [
        {
          action: 'update',
          playbook: 'payments.md',
          entries_added: 2,
        },
      ],
    });
    expect(valid).toBe(true);
  });
});
