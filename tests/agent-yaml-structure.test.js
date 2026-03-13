import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { globSync } from 'glob';
import { parse } from 'yaml';

const agentYamls = globSync('src/agents/*.agent.yaml');
const workflowYamls = globSync('src/workflows/*/workflow.yaml');

describe('.agent.yaml structural validation', () => {
	it('should have 12 agent yaml files', () => {
		expect(agentYamls.length).toBe(12);
	});

	agentYamls.forEach((file) => {
		const content = parse(readFileSync(file, 'utf8'));
		const basename = file.split('/').pop();

		it(`${basename} has agent.metadata with id, name, and icon`, () => {
			expect(content.agent?.metadata?.id, `${basename} missing metadata.id`).toBeDefined();
			expect(content.agent?.metadata?.name, `${basename} missing metadata.name`).toBeDefined();
			expect(content.agent?.metadata?.icon, `${basename} missing metadata.icon`).toBeDefined();
		});

		it(`${basename} has agent.persona with role and identity`, () => {
			expect(content.agent?.persona?.role, `${basename} missing persona.role`).toBeDefined();
			expect(content.agent?.persona?.identity, `${basename} missing persona.identity`).toBeDefined();
		});

		it(`${basename} has agent.menu with at least one trigger`, () => {
			expect(content.agent?.menu, `${basename} missing menu`).toBeDefined();
			expect(Array.isArray(content.agent.menu), `${basename} menu is not an array`).toBe(true);
			expect(content.agent.menu.length, `${basename} menu is empty`).toBeGreaterThan(0);
			content.agent.menu.forEach((item, i) => {
				expect(item.trigger, `${basename} menu[${i}] missing trigger`).toBeDefined();
				expect(item.action, `${basename} menu[${i}] missing action`).toBeDefined();
			});
		});

		it(`${basename} has module: pantheon`, () => {
			expect(content.agent?.metadata?.module).toBe('pantheon');
		});
	});
});

describe('workflow.yaml count', () => {
	it('should have 18 workflow yaml files', () => {
		expect(workflowYamls.length).toBe(18);
	});

	workflowYamls.forEach((file) => {
		const content = parse(readFileSync(file, 'utf8'));
		const dirname = file.split('/').slice(-2, -1)[0];

		it(`${dirname}/workflow.yaml has name and description`, () => {
			expect(content.name, `${dirname} missing name`).toBeDefined();
			expect(content.description, `${dirname} missing description`).toBeDefined();
		});
	});
});

describe('no adapters regression', () => {
	it('src/adapters/ directory does not exist', () => {
		expect(existsSync('src/adapters')).toBe(false);
	});

	it('detect-adapter-drift.sh does not exist', () => {
		expect(existsSync('scripts/detect-adapter-drift.sh')).toBe(false);
	});

	it('no source files reference src/adapters/', () => {
		const sourceFiles = [
			...globSync('src/**/*.yaml'),
			...globSync('src/**/*.md'),
		];
		sourceFiles.forEach((file) => {
			const content = readFileSync(file, 'utf8');
			expect(
				content.includes('src/adapters/'),
				`${file} still references src/adapters/`,
			).toBe(false);
		});
	});
});
