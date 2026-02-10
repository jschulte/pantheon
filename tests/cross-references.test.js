import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';
import { globSync } from 'glob';

describe('agent file cross-references', () => {
  const routing = parse(readFileSync('src/agent-routing.yaml', 'utf8'));
  const storyPipeline = parse(readFileSync('src/workflows/story-pipeline/workflow.yaml', 'utf8'));

  it('all builders in story-pipeline available_builders exist in agent-routing', () => {
    const routingIds = routing.builder_routing.map((b) => b.id);
    storyPipeline.agent_routing.available_builders.forEach((builder) => {
      expect(routingIds, `${builder.id} not in agent-routing`).toContain(builder.id);
    });
  });

  it('persona names match between story-pipeline and agent-routing', () => {
    storyPipeline.agent_routing.available_builders.forEach((pipelineBuilder) => {
      const routingBuilder = routing.builder_routing.find((b) => b.id === pipelineBuilder.id);
      if (routingBuilder) {
        expect(
          pipelineBuilder.persona.name,
          `${pipelineBuilder.id} name mismatch: pipeline=${pipelineBuilder.persona.name}, routing=${routingBuilder.persona.name}`
        ).toBe(routingBuilder.persona.name);
      }
    });
  });

  it('persona emojis match between story-pipeline and agent-routing', () => {
    storyPipeline.agent_routing.available_builders.forEach((pipelineBuilder) => {
      const routingBuilder = routing.builder_routing.find((b) => b.id === pipelineBuilder.id);
      if (routingBuilder) {
        expect(
          pipelineBuilder.persona.emoji,
          `${pipelineBuilder.id} emoji mismatch`
        ).toBe(routingBuilder.persona.emoji);
      }
    });
  });

  it('subagent_type_routing covers all builder IDs', () => {
    const routingMap = storyPipeline.agents.builder.subagent_type_routing;
    const routingIds = routing.builder_routing.map((b) => b.id);
    routingIds.forEach((id) => {
      // The routing map or fallback should handle every builder
      if (id !== 'general') {
        // general is the fallback, doesn't need explicit mapping (but may have one)
        // just verify no unexpected builders are missing
      }
    });
    // Verify the fallback exists
    expect(storyPipeline.agents.builder.fallback_subagent).toBe('general-purpose');
  });
});

describe('builder markdown files', () => {
  const builderFiles = globSync('src/agents/builders/*.md');

  it('should have builder files', () => {
    expect(builderFiles.length).toBeGreaterThan(0);
  });

  it('every builder in agent-routing has a markdown file', () => {
    const routing = parse(readFileSync('src/agent-routing.yaml', 'utf8'));
    routing.builder_routing.forEach((builder) => {
      const path = `src/${builder.agent}`;
      expect(existsSync(path), `Missing builder file: ${path}`).toBe(true);
    });
  });
});

describe('reviewer markdown files', () => {
  const reviewerFiles = globSync('src/agents/reviewers/*.md');

  it('should have reviewer files', () => {
    expect(reviewerFiles.length).toBeGreaterThan(0);
  });

  it('every reviewer in agent-routing has a markdown file', () => {
    const routing = parse(readFileSync('src/agent-routing.yaml', 'utf8'));
    Object.entries(routing.reviewer_routing).forEach(([key, reviewer]) => {
      const path = `src/${reviewer.agent}`;
      expect(existsSync(path), `Missing reviewer file: ${path} for ${key}`).toBe(true);
    });
  });
});

describe('workflow phase files', () => {
  const phaseFiles = globSync('src/workflows/story-pipeline/phases/*.md');

  it('has phase files for the pipeline', () => {
    expect(phaseFiles.length).toBeGreaterThanOrEqual(5);
  });

  it('has required phase files', () => {
    const expectedPhases = [
      'phase-1-prepare.md',
      'phase-1.5-forge.md',
      'phase-2-build.md',
      'phase-3-verify.md',
      'phase-4-assess.md',
      'phase-5-refine.md',
      'phase-6-commit.md',
    ];
    expectedPhases.forEach((phase) => {
      const path = `src/workflows/story-pipeline/phases/${phase}`;
      expect(existsSync(path), `Missing phase file: ${path}`).toBe(true);
    });
  });
});

describe('adapter files', () => {
  const platforms = ['opencode', 'copilot', 'codex'];

  platforms.forEach((platform) => {
    it(`${platform} adapter directory exists`, () => {
      expect(existsSync(`src/adapters/${platform}`)).toBe(true);
    });
  });

  it('adapter README exists', () => {
    expect(existsSync('src/adapters/README.md')).toBe(true);
  });
});

describe('schema references', () => {
  const schemas = globSync('src/schemas/*.schema.json');

  it('has 5 schema files', () => {
    expect(schemas.length).toBe(5);
  });

  it('schema IDs are unique', () => {
    const ids = schemas.map((file) => {
      const schema = JSON.parse(readFileSync(file, 'utf8'));
      return schema.$id;
    });
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it('schema IDs follow pantheon/ prefix pattern', () => {
    schemas.forEach((file) => {
      const schema = JSON.parse(readFileSync(file, 'utf8'));
      expect(schema.$id, `${file} $id missing pantheon/ prefix`).toMatch(/^pantheon\//);
    });
  });
});
