import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { parse } from 'yaml';

const routing = parse(readFileSync('src/agent-routing.yaml', 'utf8'));
const storyPipeline = parse(readFileSync('src/workflows/story-pipeline/workflow.yaml', 'utf8'));
const batchStories = parse(readFileSync('src/workflows/batch-stories/workflow.yaml', 'utf8'));

describe('complexity tier consistency', () => {
  const canonicalTiers = routing.complexity_routing.tiers;
  const pipelineTiers = storyPipeline.complexity_routing;

  it('canonical source has exactly 6 tiers', () => {
    const tierNames = Object.keys(canonicalTiers);
    expect(tierNames).toEqual(['trivial', 'micro', 'light', 'standard', 'complex', 'critical']);
  });

  it('story-pipeline has matching tier names', () => {
    const pipelineTierNames = Object.keys(pipelineTiers);
    const canonicalTierNames = Object.keys(canonicalTiers);
    expect(pipelineTierNames).toEqual(canonicalTierNames);
  });

  it('review_mode matches between canonical and story-pipeline', () => {
    Object.entries(canonicalTiers).forEach(([tier, config]) => {
      expect(
        pipelineTiers[tier].review_mode,
        `review_mode mismatch for ${tier}`
      ).toBe(config.review_mode);
    });
  });

  it('trivial through standard use consolidated review', () => {
    ['trivial', 'micro', 'light', 'standard'].forEach((tier) => {
      expect(canonicalTiers[tier].review_mode, `${tier} should be consolidated`).toBe('consolidated');
    });
  });

  it('complex and critical use parallel review', () => {
    ['complex', 'critical'].forEach((tier) => {
      expect(canonicalTiers[tier].review_mode, `${tier} should be parallel`).toBe('parallel');
    });
  });

  it('forging thresholds are in order', () => {
    const forgingOrder = { skip: 0, conditional: 1, always: 2, aggressive: 3 };
    const tiers = ['trivial', 'micro', 'light', 'standard', 'complex', 'critical'];
    for (let i = 0; i < tiers.length - 1; i++) {
      const current = forgingOrder[canonicalTiers[tiers[i]].forging];
      const next = forgingOrder[canonicalTiers[tiers[i + 1]].forging];
      expect(next, `${tiers[i+1]} forging should be >= ${tiers[i]}`).toBeGreaterThanOrEqual(current);
    }
  });

  it('batch-stories complexity thresholds reference valid tiers', () => {
    // batch-stories uses "complexity" with thresholds, not "complexity_routing"
    const batchComplexity = batchStories.complexity;
    expect(batchComplexity).toBeDefined();
    expect(batchComplexity.enabled).toBe(true);
    expect(batchComplexity.thresholds).toBeDefined();

    const canonicalTierNames = Object.keys(canonicalTiers);
    Object.keys(batchComplexity.thresholds).forEach((tier) => {
      expect(canonicalTierNames, `batch tier ${tier} not in canonical`).toContain(tier);
    });
  });

  it('risk_promotion keywords are categorized', () => {
    const riskPromotion = routing.complexity_routing.risk_promotion;
    expect(riskPromotion.high_risk).toBeDefined();
    expect(riskPromotion.medium_risk).toBeDefined();
    expect(riskPromotion.low_risk).toBeDefined();
    expect(riskPromotion.high_risk.length).toBeGreaterThan(0);
  });

  it('multi_reviewer is used for consolidated tiers', () => {
    const multiReviewer = storyPipeline.agents.multi_reviewer;
    expect(multiReviewer.use_when).toContain('trivial');
    expect(multiReviewer.use_when).toContain('micro');
    expect(multiReviewer.use_when).toContain('light');
    expect(multiReviewer.use_when).toContain('standard');
    expect(multiReviewer.use_when).not.toContain('complex');
    expect(multiReviewer.use_when).not.toContain('critical');
  });
});

describe('model tier configuration', () => {
  const modelTier = storyPipeline.model_tier;

  it('has all expected agent roles', () => {
    const expectedRoles = [
      'builder', 'fixer', 'cerberus', 'themis', 'argus',
      'nemesis', 'pygmalion', 'multi_reviewer', 'forged_specialists',
      'reflection_reporter',
    ];
    expectedRoles.forEach((role) => {
      expect(modelTier[role], `missing model_tier.${role}`).toBeDefined();
    });
  });

  it('builder uses opus for deep reasoning', () => {
    expect(modelTier.builder).toBe('opus');
  });

  it('security reviewer uses opus', () => {
    expect(modelTier.cerberus).toBe('opus');
  });

  it('mechanical tasks use sonnet', () => {
    expect(modelTier.argus).toBe('sonnet');
    expect(modelTier.nemesis).toBe('sonnet');
    expect(modelTier.pygmalion).toBe('sonnet');
  });
});

describe('agent timeout configuration', () => {
  const timeouts = storyPipeline.agent_timeouts;

  it('has timeouts for all agent types', () => {
    const expected = ['builder', 'reviewer', 'validator', 'arbiter', 'pygmalion', 'reflection', 'reporter'];
    expected.forEach((agent) => {
      expect(timeouts[agent], `missing timeout for ${agent}`).toBeDefined();
      expect(timeouts[agent]).toBeGreaterThan(0);
    });
  });

  it('builder has longest timeout', () => {
    const allTimeouts = Object.values(timeouts);
    expect(timeouts.builder).toBe(Math.max(...allTimeouts));
  });

  it('timeouts are in reasonable ranges', () => {
    expect(timeouts.builder).toBeGreaterThanOrEqual(1800);
    expect(timeouts.reviewer).toBeGreaterThanOrEqual(300);
    expect(timeouts.arbiter).toBeLessThanOrEqual(600);
  });
});
