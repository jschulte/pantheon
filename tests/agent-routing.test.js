import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';

const routing = parse(readFileSync('src/agent-routing.yaml', 'utf8'));

describe('builder routing', () => {
  it('has no duplicate builder IDs', () => {
    const ids = routing.builder_routing.map((b) => b.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it('every builder has required fields', () => {
    routing.builder_routing.forEach((builder) => {
      expect(builder.id, `builder missing id`).toBeDefined();
      expect(builder.agent, `${builder.id} missing agent`).toBeDefined();
      expect(builder.persona, `${builder.id} missing persona`).toBeDefined();
      expect(builder.persona.name, `${builder.id} missing persona.name`).toBeDefined();
      expect(builder.persona.emoji, `${builder.id} missing persona.emoji`).toBeDefined();
      expect(builder.match, `${builder.id} missing match`).toBeDefined();
    });
  });

  it('every builder agent file exists', () => {
    routing.builder_routing.forEach((builder) => {
      const path = `src/${builder.agent}`;
      expect(existsSync(path), `${path} not found for builder ${builder.id}`).toBe(true);
    });
  });

  it('has a general fallback builder', () => {
    const general = routing.builder_routing.find((b) => b.id === 'general');
    expect(general).toBeDefined();
    expect(general.match.always).toBe(true);
  });

  it('general builder is last in routing order', () => {
    const last = routing.builder_routing[routing.builder_routing.length - 1];
    expect(last.id).toBe('general');
  });

  it('persona names match README agent names', () => {
    const expectedNames = {
      'frontend-react': 'Helios',
      'backend-typescript': 'Hephaestus',
      'database-prisma': 'Athena',
      'infrastructure': 'Atlas',
      'backend-python': 'Pythia',
      'backend-go': 'Gopher',
      'general': 'Metis',
    };
    Object.entries(expectedNames).forEach(([id, name]) => {
      const builder = routing.builder_routing.find((b) => b.id === id);
      expect(builder, `builder ${id} not found`).toBeDefined();
      expect(builder.persona.name, `${id} persona name mismatch`).toBe(name);
    });
  });
});

describe('reviewer routing', () => {
  const reviewerEntries = Object.entries(routing.reviewer_routing);

  it('has security and architecture always-included', () => {
    expect(routing.reviewer_routing.security.always_include).toBe(true);
    expect(routing.reviewer_routing.architecture.always_include).toBe(true);
  });

  it('every reviewer agent file exists', () => {
    reviewerEntries.forEach(([key, reviewer]) => {
      const path = `src/${reviewer.agent}`;
      expect(existsSync(path), `${path} not found for reviewer ${key}`).toBe(true);
    });
  });

  it('reviewer persona names match expected', () => {
    const expected = {
      security: 'Cerberus',
      architecture: 'Hestia',
      performance: 'Apollo',
      accessibility: 'Iris',
      quality: 'Arete',
    };
    Object.entries(expected).forEach(([key, name]) => {
      expect(routing.reviewer_routing[key].persona.name, `${key} persona mismatch`).toBe(name);
    });
  });

  it('reviewers have priority ordering', () => {
    const priorities = reviewerEntries
      .filter(([, r]) => r.priority !== undefined)
      .map(([key, r]) => ({ key, priority: r.priority }));
    const sorted = [...priorities].sort((a, b) => a.priority - b.priority);
    expect(priorities).toEqual(sorted);
  });
});

describe('validator routing', () => {
  it('has inspector and test_quality', () => {
    expect(routing.validator_routing.inspector).toBeDefined();
    expect(routing.validator_routing.test_quality).toBeDefined();
  });

  it('both validators are always included', () => {
    expect(routing.validator_routing.inspector.always_include).toBe(true);
    expect(routing.validator_routing.test_quality.always_include).toBe(true);
  });

  it('validator agent files exist', () => {
    Object.entries(routing.validator_routing).forEach(([key, validator]) => {
      const path = `src/${validator.agent}`;
      expect(existsSync(path), `${path} not found for validator ${key}`).toBe(true);
    });
  });

  it('validator persona names match expected', () => {
    expect(routing.validator_routing.inspector.persona.name).toBe('Argus');
    expect(routing.validator_routing.test_quality.persona.name).toBe('Nemesis');
  });
});

describe('support routing', () => {
  it('has reflection, arbiter, and reporter', () => {
    expect(routing.support_routing.reflection).toBeDefined();
    expect(routing.support_routing.arbiter).toBeDefined();
    expect(routing.support_routing.reporter).toBeDefined();
  });

  it('support persona names match expected', () => {
    expect(routing.support_routing.reflection.persona.name).toBe('Mnemosyne');
    expect(routing.support_routing.arbiter.persona.name).toBe('Themis');
    expect(routing.support_routing.reporter.persona.name).toBe('Hermes');
  });

  it('support agent files exist', () => {
    Object.entries(routing.support_routing).forEach(([key, agent]) => {
      const path = `src/${agent.agent}`;
      expect(existsSync(path), `${path} not found for support ${key}`).toBe(true);
    });
  });
});
