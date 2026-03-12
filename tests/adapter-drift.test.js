import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';

describe('agent routing file references', () => {
	const routing = parse(readFileSync('src/agent-routing.yaml', 'utf8'));

	// Verify agent prompt files referenced in routing actually exist
	it('all agent files referenced in builder_routing exist', () => {
		routing.builder_routing.forEach((entry) => {
			const agentPath = `src/${entry.agent}`;
			expect(existsSync(agentPath), `Missing: ${agentPath} (builder: ${entry.id})`).toBe(true);
		});
	});

	it('all agent files referenced in reviewer_routing exist', () => {
		Object.entries(routing.reviewer_routing).forEach(([key, entry]) => {
			const agentPath = `src/${entry.agent}`;
			expect(existsSync(agentPath), `Missing: ${agentPath} (reviewer: ${key})`).toBe(true);
		});
	});

	it('all agent files referenced in validator_routing exist', () => {
		Object.entries(routing.validator_routing).forEach(([key, entry]) => {
			const agentPath = `src/${entry.agent}`;
			expect(existsSync(agentPath), `Missing: ${agentPath} (validator: ${key})`).toBe(true);
		});
	});

	it('all agent files referenced in support_routing exist', () => {
		Object.entries(routing.support_routing).forEach(([key, entry]) => {
			const agentPath = `src/${entry.agent}`;
			expect(existsSync(agentPath), `Missing: ${agentPath} (support: ${key})`).toBe(true);
		});
	});
});
